import { BasePlugin } from "../base.mjs";
import { ModelManager } from "../model-manager.mjs";
import { buildPluginPrompt } from "../format-specs.mjs";

/**
 * 人员信息核对插件
 * 通过HTTP接口获取人员名单，核对文本中的人员姓名和职务是否正确
 */
export class PersonnelCheckPlugin extends BasePlugin {
  constructor(config = {}) {
    super({
      description: "核对文本中的人员姓名和职务信息是否正确",
      version: "1.0.0",
      ...config,
    });

    this.modelManager = new ModelManager();
    this.modelName = config.modelName || "deepseek";
    this.personnelApiUrl = config.personnelApiUrl || null;
    this.personnelData = null;
    this.cacheExpiry = config.cacheExpiry || 30 * 60 * 1000; // 30分钟缓存
    this.lastFetchTime = null;

    // 设置API密钥
    if (config.apiKey) {
      this.modelManager.setApiKey(this.modelName, config.apiKey);
    }
  }

  /**
   * 从HTTP接口获取人员数据
   * @returns {Promise<Array>} 人员数据列表
   */
  async fetchPersonnelData() {
    if (!this.personnelApiUrl) {
      throw new Error("Personnel API URL not configured");
    }

    // 检查缓存是否有效
    const now = Date.now();
    if (this.personnelData && this.lastFetchTime && now - this.lastFetchTime < this.cacheExpiry) {
      return this.personnelData;
    }

    try {
      console.log("Fetching personnel data from:", this.personnelApiUrl);

      const response = await fetch(this.personnelApiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "PersonnelCheckPlugin/1.0.0",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // 标准化数据格式
      this.personnelData = this.normalizePersonnelData(data);
      this.lastFetchTime = now;

      console.log(`Fetched ${this.personnelData.length} personnel records`);

      return this.personnelData;
    } catch (error) {
      console.error("Failed to fetch personnel data:", error);
      throw new Error(`无法获取人员数据: ${error.message}`);
    }
  }

  /**
   * 标准化人员数据格式
   * @param {Array|Object} rawData - 原始数据
   * @returns {Array} 标准化后的人员数据
   */
  normalizePersonnelData(rawData) {
    let dataArray = Array.isArray(rawData) ? rawData : rawData.data || [rawData];

    return dataArray
      .map((person) => ({
        name: person.name || person.姓名 || person.fullName || "",
        position: person.position || person.职务 || person.title || "",
      }))
      .filter((person) => person.name); // 过滤掉没有姓名的记录
  }

  /**
   * 生成人员核对提示词
   * @param {string} text - 待检查文本
   * @param {Array} personnelData - 人员数据
   * @returns {string} 提示词
   */
  generatePrompt(text, personnelData) {
    const personnelList = personnelData.map((person) => `${person.name} - ${person.position}`).join("\n");

    const specificInstruction = `请核对以下文本中提到的人员姓名和职务是否正确。

标准人员名单：
${personnelList}

待核对文本：
${text}`;

    return buildPluginPrompt(specificInstruction);
  }

  /**
   * 解析AI返回结果
   * @param {string} aiResponse - AI返回的JSON文本
   * @param {string} originalText - 原始文本
   * @returns {Object} 解析结果
   */
  parseAIResponse(aiResponse, originalText) {
    try {
      // 尝试解析JSON响应
      const parsed = JSON.parse(aiResponse.trim());

      // 验证必要字段
      const revisedText = parsed.revisedText || originalText;
      const issues = Array.isArray(parsed.issues) ? parsed.issues : [];

      // 转换为统一的changes格式
      const changes = issues.map((issue) => ({
        type: issue.type || "personnel",
        position: issue.line ? `行${issue.line}` : "未知位置",
        original: issue.original || "",
        revised: issue.revised || "",
        description: issue.description || "人员信息问题",
        severity: issue.severity || "medium",
        personName: issue.personName || "",
        correctInfo: issue.correctInfo || "",
      }));

      return {
        sections: {
          checkResult: issues
            .map((issue) => `${issue.type}-${issue.personName || "未知"}-${issue.description}`)
            .join("\n"),
          revisedText,
          statistics: parsed.summary || "核对完成",
          stats: parsed.stats || { totalIssues: issues.length },
        },
        changes,
      };
    } catch (error) {
      console.error("Failed to parse personnel check JSON response:", error);
      console.log("Raw AI response:", aiResponse);

      return {
        sections: {
          revisedText: originalText,
          checkResult: "AI返回了无效的JSON格式",
          statistics: `解析错误: ${error.message}`,
          stats: { totalIssues: 0 },
        },
        changes: [
          {
            type: "error",
            description: `JSON解析失败: ${error.message}`,
            severity: "high",
            position: "系统",
            original: "",
            revised: "",
          },
        ],
      };
    }
  }

  /**
   * 处理人员信息核对
   * @param {Object} input - 输入数据
   * @returns {Promise<Object>} 处理结果
   */
  async process(input) {
    const { text, context = {}, metadata = {} } = input;

    try {
      // 获取人员数据
      const personnelData = await this.fetchPersonnelData();

      if (!personnelData || personnelData.length === 0) {
        throw new Error("未获取到有效的人员数据");
      }

      // 生成提示词
      const prompt = this.generatePrompt(text, personnelData);

      // 调用AI模型
      const aiResponse = await this.modelManager.callModel(this.modelName, prompt, {
        temperature: 0.1, // 更低温度以获得准确的核对结果
      });

      // 解析AI响应
      const { sections, changes } = this.parseAIResponse(aiResponse, text);

      // 返回格式化结果
      return this.formatOutput(sections.revisedText, changes, {
        ...metadata,
        checkResult: sections.checkResult,
        statistics: sections.statistics,
        personnelCount: personnelData.length,
        modelUsed: this.modelName,
        dataSource: this.personnelApiUrl,
        lastDataFetch: new Date(this.lastFetchTime).toISOString(),
      });
    } catch (error) {
      console.error("Personnel check failed:", error);

      // 人员 API 不可用、认证错误、模型错误等关键错误应该抛出异常，让pipeline处理
      if (error.message.includes('API URL not configured') || 
          error.message.includes('未获取到有效的人员数据') ||
          error.message.includes('401 Unauthorized') ||
          error.message.includes('403 Forbidden') ||
          error.message.includes('API error') ||
          error.message.includes('API key not set')) {
        throw error;
      }

      // 所有错误情况下抛出异常，让pipeline统一处理
      throw error;
    }
  }

  /**
   * 设置人员数据API地址
   * @param {string} url - API地址
   */
  setPersonnelApiUrl(url) {
    this.personnelApiUrl = url;
    // 清除缓存，强制重新获取
    this.personnelData = null;
    this.lastFetchTime = null;
  }

  /**
   * 清除人员数据缓存
   */
  clearCache() {
    this.personnelData = null;
    this.lastFetchTime = null;
  }

  /**
   * 获取缓存状态
   * @returns {Object} 缓存状态信息
   */
  getCacheStatus() {
    return {
      hasCachedData: !!this.personnelData,
      recordCount: this.personnelData?.length || 0,
      lastFetchTime: this.lastFetchTime,
      cacheExpiry: this.cacheExpiry,
      isExpired: this.lastFetchTime ? Date.now() - this.lastFetchTime > this.cacheExpiry : true,
    };
  }
}
