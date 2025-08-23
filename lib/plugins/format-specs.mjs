/**
 * 格式规范模块
 * 集中管理插件中重复使用的返回格式规范文本和通用提示前缀
 */

/**
 * 生成通用的提示前缀
 * 包含当前时间、基础上下文等所有插件需要的通用信息
 * @returns {string} 通用提示前缀
 */
export function getCommonPromptPrefix() {
  const now = new Date()
  const currentTime = now.toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'long'
  })
  
  return `当前时间：${currentTime}

重要提示：
- 你是一个专业的文本处理AI助手
- 请基于当前时间进行合理判断，避免时间相关的错误
- 保持客观、准确、专业的处理态度
- 严格按照要求的格式返回结果

`
}

/**
 * 统一的JSON返回格式说明
 */
export const JSON_FORMAT_INSTRUCTION = `请直接返回JSON格式的结果，不要添加任何markdown标记或其他格式：

{
  "revisedText": "修改后的完整文本（必须包含完整内容）",
  "summary": "修改说明概要"
}

重要要求：
- 必须返回有效的JSON格式
- revisedText必须包含完整的修改后文本`

/**
 * 生成完整的插件提示模板
 * 结合通用前缀和格式说明
 * @param {string} specificInstruction - 插件特定的指令
 * @returns {string} 完整的提示模板
 */
export function buildPluginPrompt(specificInstruction) {
  return getCommonPromptPrefix() + specificInstruction + '\n\n' + JSON_FORMAT_INSTRUCTION
}
