import { PluginPipeline } from '../lib/plugins/pipeline.mjs'
import { GrammarCheckPlugin } from '../lib/plugins/grammar/grammar-check.mjs'
import { PersonnelCheckPlugin } from '../lib/plugins/personnel/personnel-check.mjs'

/**
 * AI核稿服务API
 * 处理核稿请求，管理插件管道
 */
export default async function handler(request, env) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const body = await request.json()
    const { text, plugins = [], config = {} } = body

    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ 
        error: 'Invalid input: text field is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 创建插件管道
    const pipeline = new PluginPipeline()

    // 根据请求配置添加插件
    for (const pluginConfig of plugins) {
      const plugin = await createPlugin(pluginConfig, env)
      if (plugin) {
        pipeline.addPlugin(plugin)
      }
    }

    // 如果没有指定插件，使用默认配置
    if (plugins.length === 0) {
      // 默认添加语法检查插件
      const grammarPlugin = new GrammarCheckPlugin({
        modelName: config.defaultModel || 'deepseek',
        apiKey: env.DEEPSEEK_API_KEY || env.GEMINI_API_KEY
      })
      pipeline.addPlugin(grammarPlugin)
    }

    // 设置全局上下文
    pipeline.setContext({
      requestId: generateRequestId(),
      timestamp: new Date().toISOString(),
      userConfig: config
    })

    // 执行管道处理
    const result = await pipeline.execute({
      text,
      metadata: {
        originalLength: text.length,
        processingStart: new Date().toISOString()
      }
    })

    // 返回处理结果
    return new Response(JSON.stringify({
      success: result.success,
      data: {
        originalText: result.originalText,
        finalText: result.finalText,
        results: result.results,
        errors: result.errors,
        metadata: {
          ...result.metadata,
          processingEnd: new Date().toISOString(),
          finalLength: result.finalText.length
        }
      }
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })

  } catch (error) {
    console.error('Review processing failed:', error)

    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      data: null
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}

/**
 * 根据配置创建插件实例
 * @param {Object} config - 插件配置
 * @param {Object} env - 环境变量
 * @returns {Promise<BasePlugin|null>} 插件实例
 */
async function createPlugin(config, env) {
  const { type, options = {} } = config

  // 设置API密钥
  const apiKeys = {
    deepseek: env.DEEPSEEK_API_KEY,
    gemini: env.GEMINI_API_KEY
  }

  const modelName = options.modelName || 'deepseek'
  const apiKey = apiKeys[modelName]

  if (!apiKey) {
    console.warn(`API key not found for model: ${modelName}`)
  }

  switch (type) {
    case 'grammar':
      return new GrammarCheckPlugin({
        ...options,
        modelName,
        apiKey
      })

    case 'personnel':
      return new PersonnelCheckPlugin({
        ...options,
        modelName,
        apiKey,
        personnelApiUrl: options.personnelApiUrl || env.PERSONNEL_API_URL
      })

    default:
      console.warn(`Unknown plugin type: ${type}`)
      return null
  }
}

/**
 * 生成请求ID
 * @returns {string} 请求ID
 */
function generateRequestId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

/**
 * 处理OPTIONS请求（CORS预检）
 */
export async function handleOptions() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  })
}