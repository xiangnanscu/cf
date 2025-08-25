/**
 * AI模型管理器
 * 支持Gemini和DeepSeek等多种AI模型
 */
export class ModelManager {
  constructor() {
    this.models = new Map();
    this.initializeModels();
  }

  /**
   * 初始化支持的AI模型
   */
  initializeModels() {
    // Gemini模型 - 移除token限制
    this.models.set("gemini", {
      name: "Gemini",
      endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      apiKey: process.env.GEMINI_API_KEY, // 从环境变量获取
      maxTokens: null, // 不设置限制，让模型自由发挥
      temperature: 0.7,
    });

    // DeepSeek模型 - 移除token限制
    this.models.set("deepseek", {
      name: "DeepSeek",
      endpoint: "https://api.deepseek.com/v1/chat/completions",
      apiKey: process.env.DEEPSEEK_API_KEY, // 从环境变量获取
      maxTokens: null, // 不设置限制
      temperature: 0.7,
    });
  }

  /**
   * 设置模型API密钥
   * @param {string} modelName - 模型名称
   * @param {string} apiKey - API密钥
   */
  setApiKey(modelName, apiKey) {
    const model = this.models.get(modelName);
    if (model) {
      model.apiKey = apiKey;
    }
  }

  /**
   * 获取模型配置
   * @param {string} modelName - 模型名称
   * @returns {Object|null} 模型配置
   */
  getModel(modelName) {
    return this.models.get(modelName) || null;
  }

  /**
   * 调用AI模型
   * @param {string} modelName - 模型名称
   * @param {string} prompt - 提示词
   * @param {Object} options - 可选参数
   * @returns {Promise<string>} AI响应
   */
  async callModel(modelName, prompt, options = {}) {
    console.log(`Calling model ${modelName} with prompt:\n ${prompt}`);
    const model = this.getModel(modelName);
    if (!model) {
      throw new Error(`Model ${modelName} not found`);
    }

    if (!model.apiKey) {
      throw new Error(`API key not set for model ${modelName}`);
    }

    switch (modelName) {
      case "gemini":
        return await this.callGemini(model, prompt, options);
      case "deepseek":
        return await this.callDeepSeek(model, prompt, options);
      default:
        throw new Error(`Model ${modelName} not implemented`);
    }
  }

  /**
   * 调用Gemini模型
   * @param {Object} model - 模型配置
   * @param {string} prompt - 提示词
   * @param {Object} options - 可选参数
   * @returns {Promise<string>} AI响应
   */
  async callGemini(model, prompt, options = {}) {
    const response = await fetch(`${model.endpoint}?key=${model.apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: options.temperature || model.temperature,
          // 不设置maxOutputTokens，让模型自由发挥
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    // console.log("Gemini raw response:", JSON.stringify(data, null, 2));

    // 检查是否因为MAX_TOKENS而失败
    const candidate = data.candidates?.[0];
    if (candidate?.finishReason === "MAX_TOKENS") {
      console.warn("Gemini response was truncated due to MAX_TOKENS limit");
      throw new Error("响应内容被截断，请尝试缩短输入文本或使用其他模型");
    }

    if (candidate?.finishReason === "SAFETY") {
      throw new Error("内容被安全过滤器阻止，请检查输入内容");
    }

    const content = candidate?.content?.parts?.[0]?.text;
    if (!content) {
      console.error("No content in Gemini response:", data);
      throw new Error("Gemini未返回有效内容");
    }

    return content;
  }

  /**
   * 调用DeepSeek模型
   * @param {Object} model - 模型配置
   * @param {string} prompt - 提示词
   * @param {Object} options - 可选参数
   * @returns {Promise<string>} AI响应
   */
  async callDeepSeek(model, prompt, options = {}) {
    const response = await fetch(model.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${model.apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-reasoner",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: options.temperature || model.temperature,
        // 不设置max_tokens限制
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }

  /**
   * 获取所有可用模型列表
   * @returns {Array} 模型列表
   */
  getAvailableModels() {
    // 确保Gemini排在第一位
    const orderedKeys = ["gemini", "deepseek"];
    return orderedKeys
      .filter((key) => this.models.has(key))
      .map((key) => ({
        id: key,
        name: this.models.get(key).name,
        hasApiKey: !!this.models.get(key).apiKey,
      }));
  }
}
