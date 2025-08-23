import { BasePlugin } from "../base.mjs";
import { ModelManager } from "../model-manager.mjs";
import { buildPluginPrompt } from "../format-specs.mjs";

/**
 * 语病检查插件
 * 使用AI模型检查文本中的语法错误、用词不当等问题
 */
export class GrammarCheckPlugin extends BasePlugin {
  constructor(config = {}) {
    super({
      description: "检查文本中的语法错误、用词不当、表达不清等问题",
      version: "1.0.0",
      ...config,
    });

    this.modelManager = new ModelManager();
    this.modelName = config.modelName || "deepseek";

    // 设置API密钥
    if (config.apiKey) {
      this.modelManager.setApiKey(this.modelName, config.apiKey);
    }
  }

  /**
   * 生成核稿提示词
   * @param {string} text - 待检查文本
   * @returns {string} 提示词
   */
  generatePrompt(text) {
    const specificInstruction = `
<规则描述>
请检查以下文本中的语言问题，包括错别字、语法错误、用词不当、存在歧义、不合逻辑、不合常理等。
</规则描述>

<待核对文本>
${text}
</待核对文本>`;

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
      // 预处理AI响应，提取JSON内容
      const cleanedResponse = this.preprocessAIResponse(aiResponse);

      // 尝试解析JSON响应
      const parsed = JSON.parse(cleanedResponse.trim());

      // 验证必要字段
      const revisedText = parsed.revisedText || originalText;
      const issues = Array.isArray(parsed.issues) ? parsed.issues : [];

      // 转换为统一的changes格式
      const changes = issues.map((issue) => ({
        type: issue.type || "grammar",
        position: issue.line ? `行${issue.line}` : "未知位置",
        original: issue.original || "",
        revised: issue.revised || "",
        description: issue.description || "语法问题",
        severity: issue.severity || "medium",
      }));

      return {
        sections: {
          revisedText,
          analysis: issues
            .map((issue) => `${issue.line ? "行" + issue.line : "未知位置"}-${issue.description}`)
            .join("\n"),
          summary: parsed.summary || "处理完成",
          stats: parsed.stats || { totalIssues: issues.length },
        },
        changes,
      };
    } catch (error) {
      console.error("Failed to parse JSON response:", error);
      console.log("Raw AI response:", aiResponse);

      // JSON解析失败时的fallback
      return {
        sections: {
          revisedText: originalText + "\n\n[错误: AI返回了无效的JSON格式，无法进行语法检查]",
          analysis: "AI返回了无效的JSON格式",
          summary: `解析错误: ${error.message}`,
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
   * 处理文本核稿
   * @param {Object} input - 输入数据
   * @returns {Promise<Object>} 处理结果
   */
  async process(input) {
    const { text, context = {}, metadata = {} } = input;

    try {
      // 生成提示词
      const prompt = this.generatePrompt(text);

      // 调用AI模型
      const aiResponse = await this.modelManager.callModel(this.modelName, prompt, {
        temperature: 0.3, // 较低温度以获得更稳定的结果
      });

      // 解析AI响应
      const { sections, changes } = this.parseAIResponse(aiResponse, text);

      // 返回格式化结果
      return this.formatOutput(sections.revisedText, changes, {
        ...metadata,
        analysis: sections.analysis,
        summary: sections.summary,
        modelUsed: this.modelName,
        promptTokens: prompt.length,
        responseTokens: aiResponse.length,
      });
    } catch (error) {
      console.error("Grammar check failed:", error);

      // API密钥缺失、认证错误、模型不存在等关键错误应该抛出异常，让pipeline处理
      if (
        error.message.includes("API key not set") ||
        error.message.includes("not found") ||
        error.message.includes("not implemented") ||
        error.message.includes("401 Unauthorized") ||
        error.message.includes("403 Forbidden") ||
        error.message.includes("API error")
      ) {
        throw error;
      }

      // 其他错误情况下抛出异常，让pipeline统一处理
      throw error;
    }
  }
}
