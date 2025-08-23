/**
 * 插件基类
 * 所有AI核稿插件都应该继承此类
 */
export class BasePlugin {
  constructor(config = {}) {
    this.config = config
    this.name = this.constructor.name
    this.description = config.description || ''
    this.version = config.version || '1.0.0'
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
    throw new Error(`Plugin ${this.name} must implement process() method`)
  }

  /**
   * 验证输入数据
   * @param {Object} input - 输入数据
   * @returns {boolean} 是否有效
   */
  validateInput(input) {
    return input && typeof input.text === 'string'
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
      config: this.config
    }
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
        processedAt: new Date().toISOString()
      }
    }
  }
}