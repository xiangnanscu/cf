/**
 * 格式规范模块
 * 集中管理插件中重复使用的返回格式规范文本
 */

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
