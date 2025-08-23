import { BasePlugin } from './base.mjs'

/**
 * 插件管道处理器
 * 实现插件的链式处理，类似Unix管道符
 */
export class PluginPipeline {
  constructor() {
    this.plugins = []
    this.context = {}
  }

  /**
   * 添加插件到管道
   * @param {BasePlugin} plugin - 插件实例
   * @returns {PluginPipeline} 返回自身以支持链式调用
   */
  addPlugin(plugin) {
    if (!(plugin instanceof BasePlugin)) {
      throw new Error('Plugin must extend BasePlugin')
    }
    this.plugins.push(plugin)
    return this
  }

  /**
   * 设置全局上下文
   * @param {Object} context - 上下文数据
   * @returns {PluginPipeline} 返回自身以支持链式调用
   */
  setContext(context) {
    this.context = { ...this.context, ...context }
    return this
  }

  /**
   * 执行插件管道
   * @param {Object} input - 初始输入
   * @param {string} input.text - 输入文本
   * @param {Object} input.metadata - 元数据
   * @returns {Promise<Object>} 最终处理结果
   */
  async execute(input) {
    if (!input || typeof input.text !== 'string') {
      throw new Error('Invalid input: text field is required')
    }

    let currentInput = {
      text: input.text,
      context: { ...this.context, ...input.context },
      metadata: { ...input.metadata }
    }

    const results = []
    const errors = []

    // 顺序执行每个插件
    for (let i = 0; i < this.plugins.length; i++) {
      const plugin = this.plugins[i]
      
      try {
        console.log(`Executing plugin: ${plugin.name}`)
        
        // 验证插件输入
        if (!plugin.validateInput(currentInput)) {
          throw new Error(`Invalid input for plugin ${plugin.name}`)
        }

        // 执行插件
        const result = await plugin.process(currentInput)
        
        if (!result || typeof result.text !== 'string') {
          throw new Error(`Plugin ${plugin.name} returned invalid result`)
        }

        // 记录处理结果
        results.push({
          plugin: plugin.name,
          input: currentInput.text,
          output: result.text,
          changes: result.changes || [],
          metadata: result.metadata || {}
        })

        // 将当前插件的输出作为下一个插件的输入
        currentInput = {
          text: result.text,
          context: { ...currentInput.context, ...result.context },
          metadata: { ...currentInput.metadata, ...result.metadata }
        }

      } catch (error) {
        console.error(`Plugin ${plugin.name} execution failed:`, error)
        
        errors.push({
          plugin: plugin.name,
          error: error.message,
          stage: i + 1
        })

        // 根据错误策略决定是否继续
        if (plugin.config.stopOnError !== false) {
          break
        }
      }
    }

    return {
      success: errors.length === 0,
      finalText: currentInput.text,
      originalText: input.text,
      results,
      errors,
      metadata: {
        totalPlugins: this.plugins.length,
        executedPlugins: results.length,
        executionTime: new Date().toISOString(),
        context: this.context
      }
    }
  }

  /**
   * 获取管道信息
   * @returns {Object} 管道信息
   */
  getInfo() {
    return {
      pluginCount: this.plugins.length,
      plugins: this.plugins.map(plugin => plugin.getInfo()),
      context: this.context
    }
  }

  /**
   * 清空管道
   */
  clear() {
    this.plugins = []
    this.context = {}
  }

  /**
   * 移除指定插件
   * @param {string} pluginName - 插件名称
   * @returns {boolean} 是否成功移除
   */
  removePlugin(pluginName) {
    const index = this.plugins.findIndex(plugin => plugin.name === pluginName)
    if (index !== -1) {
      this.plugins.splice(index, 1)
      return true
    }
    return false
  }

  /**
   * 获取指定插件
   * @param {string} pluginName - 插件名称
   * @returns {BasePlugin|null} 插件实例
   */
  getPlugin(pluginName) {
    return this.plugins.find(plugin => plugin.name === pluginName) || null
  }
}