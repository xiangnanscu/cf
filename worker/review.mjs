import { PluginPipeline } from '../lib/plugins/pipeline.mjs'
import { GrammarCheckPlugin } from '../lib/plugins/grammar/grammar-check.mjs'
import { PersonnelCheckPlugin } from '../lib/plugins/personnel/personnel-check.mjs'

/**
 * 核稿大师服务API
 * 处理核稿请求，管理插件管道
 */
export default async function handler(request, env, ctx) {
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
        modelName: config.defaultModel || 'gemini',
        apiKey: env.GEMINI_API_KEY || env.DEEPSEEK_API_KEY
      })
      pipeline.addPlugin(grammarPlugin)
    }

    // 设置全局上下文
    pipeline.setContext({
      requestId: generateRequestId(),
      timestamp: new Date().toISOString(),
      userConfig: config
    })

    // 记录处理开始时间
    const processingStart = new Date().toISOString()

    // 执行管道处理
    const result = await pipeline.execute({
      text,
      metadata: {
        originalLength: text.length,
        processingStart
      }
    })

    // 记录处理结束时间
    const processingEnd = new Date().toISOString()

    // 准备发送到远程URL的数据
    const remoteData = {
      originalText: result.originalText,
      finalText: result.finalText || result.originalText,
      errors: result.errors,
      processingEnd,
      processingStart,
      summary: result.metadata.summary || '处理完成'
    }
    console.log("env.REMOTE_WEBHOOK_URL:" + env.REMOTE_WEBHOOK_URL)
    // 异步发送结果到远程URL（不阻塞响应）
    if (env.REMOTE_WEBHOOK_URL) {
      ctx.waitUntil(sendToRemoteUrl(env.REMOTE_WEBHOOK_URL, remoteData, env).catch(error => {
        console.error('Failed to send data to remote URL:' + error.message)
      }))
    }

    // 检查处理结果，如果有错误则返回错误状态
    if (!result.success || result.errors.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        errors: result.errors,
        data: {
          originalText: result.originalText,
          finalText: result.finalText || result.originalText, // 如果处理失败，使用原文本
          results: result.results,
          metadata: {
            ...result.metadata,
            processingEnd,
            finalLength: (result.finalText || result.originalText).length
          }
        }
      }), {
        status: 422, // 处理失败但请求格式正确
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      })
    }

    // 返回成功结果
    return new Response(JSON.stringify({
      success: true,
      errors: [],
      data: {
        originalText: result.originalText,
        finalText: result.finalText,
        results: result.results,
        metadata: {
          ...result.metadata,
          processingEnd,
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

    // 如果发生异常，也尝试发送错误信息到远程URL
    if (env.REMOTE_WEBHOOK_URL) {
      const errorData = {
        originalText: text || '未知',
        finalText: text || '未知',
        errors: [{ error: error.message, stage: 'exception' }],
        processingEnd: new Date().toISOString(),
        processingStart: new Date().toISOString(),
        summary: '处理过程中发生异常'
      }

      ctx.waitUntil(sendToRemoteUrl(env.REMOTE_WEBHOOK_URL, errorData, env).catch(error => {
        console.error('Failed to send data to remote URL:' + error.message)
      }))
    }

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

  const modelName = options.modelName || 'gemini'
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
 * 格式化日期为 YYYY-MM-DD HH:mm:ss 格式
 * @param {string} isoString - ISO 8601 格式的日期字符串
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(isoString) {
  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) {
      return isoString // 如果解析失败，返回原字符串
    }

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  } catch (error) {
    console.warn('Date formatting failed:', error)
    return isoString // 如果出错，返回原字符串
  }
}

/**
 * 规范化数据中的日期字段
 * @param {Object} data - 要规范化的数据对象
 * @returns {Object} 规范化后的数据对象
 */
function normalizeDateFields(data) {
  const normalized = { ...data }

  // 规范化 processingStart 和 processingEnd 字段
  if (normalized.processingStart) {
    normalized.processingStart = formatDate(normalized.processingStart)
  }
  if (normalized.processingEnd) {
    normalized.processingEnd = formatDate(normalized.processingEnd)
  }

  return normalized
}

/**
 * 向远程URL发送POST请求
 * @param {string} url - 远程URL
 * @param {Object} data - 要发送的数据
 * @param {Object} env - 环境变量
 */
async function sendToRemoteUrl(url, data, env) {
  console.log('sendToRemoteUrl:' + url)

  // 规范化日期字段
  const normalizedData = normalizeDateFields(data)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Cloudflare-Worker-Review-Service/1.0'
    },
    body: JSON.stringify(normalizedData)
  })

  if (!response.ok) {
    console.log('Error sending data to remote URL:' + JSON.stringify(response))
    throw new Error(`Remote URL responded with status: ${response.status}`)
  } else {
    console.log('Successfully sent data to remote URL:' + url)
  }
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