/**
 * 插件基类
 * 所有核稿大师插件都应该继承此类
 */
export class BasePlugin {
  constructor(config = {}) {
    this.config = config;
    this.name = this.constructor.name;
    this.description = config.description || "";
    this.version = config.version || "1.0.0";
  }

  /**
   * 获取插件元数据（静态方法）
   * @returns {Object} 插件元数据
   */
  static getPluginMetadata() {
    return {
      name: this.name,
      description: this.description || "",
      version: this.version || "1.0.0",
      type: this.pluginType || this.name.toLowerCase().replace(/plugin$/, ""),
      supportedModels: this.supportedModels || ["gemini", "deepseek"],
      configOptions: this.configOptions || {},
    };
  }

  /**
   * 插件处理方法 - 子类必须实现
   * @param {Object} input - 输入数据
   * @param {string} input.text - 输入文本
   * @param {Object} input.context - 上下文数据
   * @param {Object} input.metadata - 元数据
   * @returns {Promise<Object>} 处理结果
   */
  async process(input) {
    throw new Error(`Plugin ${this.name} must implement process() method`);
  }

  /**
   * 验证输入数据
   * @param {Object} input - 输入数据
   * @returns {boolean} 是否有效
   */
  validateInput(input) {
    return input && typeof input.text === "string";
  }

  /**
   * 获取插件信息
   * @returns {Object} 插件信息
   */
  getInfo() {
    return {
      name: this.name,
      description: this.description,
      version: this.version,
      config: this.config,
    };
  }

  /**
   * 预处理AI响应，尝试从各种格式中提取JSON
   * @param {string} aiResponse - AI返回的原始响应
   * @returns {string} 提取出的JSON字符串
   */
  preprocessAIResponse(aiResponse) {
    if (!aiResponse || typeof aiResponse !== "string") {
      return aiResponse;
    }

    const response = aiResponse.trim();

    // 1. 尝试提取markdown代码块中的JSON
    const markdownJsonMatch = response.match(/```(?:json)?\s+(\S+?)\s*```/i);
    if (markdownJsonMatch) {
      return markdownJsonMatch[1].trim();
    }

    // 5. 移除常见的前缀文本
    const commonPrefixes = [
      /^Here\s+is\s+the\s+JSON\s*:?\s*/i,
      /^JSON\s*:?\s*/i,
      /^Response\s*:?\s*/i,
      /^Result\s*:?\s*/i,
      /^Output\s*:?\s*/i,
      /^以下是.*?结果.*?:?\s*/i,
      /^JSON格式.*?:?\s*/i,
    ];

    let cleanedResponse = response;
    for (const prefix of commonPrefixes) {
      cleanedResponse = cleanedResponse.replace(prefix, "");
    }

    // 6. 如果清理后的响应以JSON字符开头，返回它
    const trimmed = cleanedResponse.trim();
    if (trimmed.startsWith("{")) {
      return trimmed;
    }

    // 7. 最后尝试：查找第一个{到最后一个}之间的内容
    const firstBrace = response.indexOf("{");
    const lastBrace = response.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return response.substring(firstBrace, lastBrace + 1).trim();
    }

    // 如果所有方法都失败，返回原始响应
    return response;
  }

  /**
   * 格式化输出结果
   * @param {string} text - 处理后的文本
   * @param {Object} changes - 变更记录
   * @param {Object} metadata - 元数据
   * @returns {Object} 标准输出格式
   */
  formatOutput(text, changes = [], metadata = {}) {
    return {
      text,
      changes,
      metadata: {
        ...metadata,
        processedBy: this.name,
        processedAt: new Date().toISOString(),
      },
    };
  }
}
