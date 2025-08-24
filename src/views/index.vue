<script setup>
import { ref, onMounted, inject, computed } from 'vue'
import { diffChars } from 'diff'
import { useToast } from 'primevue/usetoast'
import { parseLocalPersonnel } from '../../lib/utils/personnel-parser.mjs'

const toast = useToast()

// 注入配置数据
const proofreadConfig = inject('proofreadConfig')
const { availablePlugins, selectedPlugins, availableModels, selectedModel, pluginConfigs } = proofreadConfig

// 响应式数据
const originalText = ref('')
const revisedText = ref('')
const isProcessing = ref(false)
const diffResult = ref(null)
const processingResults = ref([])
const errors = ref([])
const showSummaryDialog = ref(false)
const summaryContent = ref('')

// 计算属性：从处理结果中提取错误信息
const pluginErrors = computed(() => {
  const errorList = []

  processingResults.value.forEach(result => {
    if (result.changes) {
      result.changes
        .filter(change => change.type === 'error')
        .forEach(errorChange => {
          errorList.push({
            plugin: result.plugin,
            description: errorChange.description,
            severity: errorChange.severity
          })
        })
    }
  })

  return errorList
})

// 计算属性：检查是否有插件错误
const hasPluginErrors = computed(() => pluginErrors.value.length > 0)

onMounted(async () => {
  console.log('index.vue mounted')
})

// 核稿方法
const processText = async () => {
  if (!originalText.value.trim()) {
    return
  }

  isProcessing.value = true
  errors.value = []
  processingResults.value = []

  try {
    // 构建插件配置
    const plugins = selectedPlugins.value.map(pluginType => {
      const config = { ...pluginConfigs.value[pluginType] }

      // 如果是人员插件且使用本地数据，处理解析后的数据
      if (pluginType === 'personnel' && config.useLocalPersonnel && config.localPersonnelData) {
        // 使用公共解析函数
        const parsedPersonnel = parseLocalPersonnel(config.localPersonnelData)

        // 替换原始文本数据为解析后的结构化数据
        config.parsedPersonnelData = parsedPersonnel
        delete config.localPersonnelData // 不再需要原始文本
      }

      return {
        type: pluginType,
        options: {
          modelName: selectedModel.value,
          ...config
        }
      }
    })

    // 调用后端API进行核稿
    const response = await fetch('/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: originalText.value,
        plugins,
        config: {
          defaultModel: selectedModel.value
        }
      })
    })

    const result = await response.json()

    // 处理响应结果（无论success状态如何，都显示可能的结果和错误）
    if (result.success) {
      revisedText.value = result.data.finalText
      processingResults.value = result.data.results || []

      // 保存摘要内容
      summaryContent.value = result.data?.metadata?.summary || ''

      // 生成diff视图
      generateDiff()
    } else {
      // 处理失败的情况，仍然显示可能的结果
      revisedText.value = result.data?.finalText || originalText.value
      processingResults.value = result.data?.results || []

      // 保存摘要内容（即使失败也可能有摘要）
      summaryContent.value = result.data?.metadata?.summary || ''

      // 如果有结果文本且与原文不同，生成diff视图
      if (revisedText.value && revisedText.value !== originalText.value) {
        generateDiff()
      }
    }

    // 统一从 errors 数组获取错误信息
    errors.value = result.errors || []

    // 如果没有具体的错误信息但有通用错误，添加到errors数组
    if (errors.value.length === 0 && result.error) {
      errors.value = [{ plugin: 'system', error: result.error }]
    }

  } catch (error) {
    console.error('核稿失败:', error)
    errors.value = [{ plugin: 'system', error: error.message }]
  } finally {
    isProcessing.value = false
  }
}

// 使用diff库的内置功能生成细粒度差异视图
const computeFineDiff = (original, revised) => {
  // 使用diffChars进行字符级别的差异比较
  const charDiff = diffChars(original, revised)

  return {
    type: 'char-diff',
    parts: charDiff.map(part => ({
      type: part.added ? 'added' : part.removed ? 'removed' : 'unchanged',
      value: part.value,
      added: part.added,
      removed: part.removed
    }))
  }
}

// 生成diff视图
const generateDiff = () => {
  if (!originalText.value || !revisedText.value) return

  diffResult.value = {
    original: originalText.value,
    revised: revisedText.value,
    changes: processingResults.value.flatMap(result => result.changes || []),
    diff: computeFineDiff(originalText.value, revisedText.value)
  }
}

// 复制修改后的文本到剪切板
const copyRevisedText = async () => {
  if (!revisedText.value) {
    return
  }

  try {
    await navigator.clipboard.writeText(revisedText.value)
    toast.add({
      severity: 'success',
      summary: '复制成功',
      detail: '修改后的文本已复制到剪切板',
      life: 3000
    })
  } catch (error) {
    console.error('复制失败:', error)
    // 降级方案：使用传统的复制方法
    try {
      const textarea = document.createElement('textarea')
      textarea.value = revisedText.value
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      toast.add({
        severity: 'success',
        summary: '复制成功',
        detail: '修改后的文本已复制到剪切板',
        life: 3000
      })
    } catch (fallbackError) {
      console.error('复制失败（降级方案）:', fallbackError)
      toast.add({
        severity: 'error',
        summary: '复制失败',
        detail: '无法复制到剪切板，请手动复制',
        life: 5000
      })
    }
  }
}

// 清空内容
const clearAll = () => {
  originalText.value = ''
  revisedText.value = ''
  diffResult.value = null
  processingResults.value = []
  errors.value = []
  summaryContent.value = ''
}
</script>

<template>
  <div class="review-container">
    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧输入区域 -->
      <div class="input-section">
        <Card class="input-card">
          <template #title>

          </template>
          <template #content>
            <div class="input-area">
              <div class="textarea-wrapper">
                <Textarea
                  v-model="originalText"
                  placeholder="请输入需要核查的文本..."
                  rows="15"
                  class="w-full"
                />
                <Button
                  v-if="originalText"
                  icon="pi pi-times"
                  class="clear-textarea-btn"
                  @click="originalText = ''"
                  text
                  rounded
                  size="small"
                />
              </div>
            </div>
          </template>
          <template #footer>
            <div class="custom-card-header flex align-items-center justify-content-end">
              <Button
                :label="isProcessing ? '核稿中...' : '开始核稿'"
                icon="pi pi-check"
                @click="processText"
                :loading="isProcessing"
                :disabled="isProcessing || !originalText.trim() || selectedPlugins.length === 0"
                class="review-btn"
                size="small"
              />
            </div>
          </template>
        </Card>
      </div>

      <!-- 右侧结果区域 -->
      <div class="result-section">
        <Card class="result-card">
          <template #title>
            <div class="custom-card-header flex align-items-center justify-content-between">
              <div class="button-group">
                <Button
                  v-if="revisedText"
                  icon="pi pi-copy"
                  label="复制结果"
                  size="small"
                  severity="secondary"
                  @click="copyRevisedText"
                  :disabled="!revisedText"
                />
                <Button
                  v-if="summaryContent"
                  icon="pi pi-file-text"
                  label="核稿摘要"
                  size="small"
                  severity="info"
                  @click="showSummaryDialog = true"
                  :disabled="!summaryContent"
                />
              </div>
            </div>
          </template>
          <template #content>
            <div class="result-area">
              <!-- 处理结果 -->
              <div v-if="revisedText" class="result-content">
                <!-- 错误提示 -->
                <div v-if="errors.length > 0 || hasPluginErrors" class="errors-section">
                  <!-- 系统级错误 -->
                  <Message
                    v-for="(error, index) in errors"
                    :key="'system-' + index"
                    severity="error"
                    :closable="false"
                  >
                    <strong>{{ error.plugin }}:</strong> {{ error.error }}
                  </Message>

                  <!-- 插件内部错误（如JSON解析错误） -->
                  <Message
                    v-for="(errorChange, index) in pluginErrors"
                    :key="'plugin-' + index"
                    severity="error"
                    :closable="false"
                  >
                    <strong>{{ errorChange.plugin }}:</strong> {{ errorChange.description }}
                  </Message>
                </div>

                <!-- Git风格的Diff视图 -->
                <div class="diff-view">
                  <div class="git-diff">
                    <div class="diff-content">
                      <div class="diff-text">
                        <span
                          v-for="(part, index) in diffResult?.diff?.parts || []"
                          :key="index"
                          :class="[
                            'diff-part',
                            part.added ? 'diff-added' : '',
                            part.removed ? 'diff-removed' : ''
                          ]"
                        >{{ part.value }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>
  </div>

  <!-- Toast通知 -->
  <Toast position="top-right" />

  <!-- 核稿摘要弹出框 -->
  <Dialog
    v-model:visible="showSummaryDialog"
    modal
    header="核稿摘要"
    :style="{ width: '50vw' }"
    :maximizable="true"
    :closable="true"
  >
    <div class="summary-content">
      <div v-if="summaryContent" class="summary-text">
        {{ summaryContent }}
      </div>
      <div v-else class="no-summary">
        暂无摘要内容
      </div>
    </div>
    <template #footer>
      <Button
        label="关闭"
        icon="pi pi-times"
        @click="showSummaryDialog = false"
        class="p-button-text"
      />
    </template>
  </Dialog>
</template>

<style scoped>
.review-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 0rem;
  height: calc(100vh - 120px);
}

/* 主要内容区域 */
.main-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  flex: 1;
  min-height: 0;
}

.input-section,
.result-section {
  display: flex;
  flex-direction: column;
}

.input-card,
.result-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.input-area {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
}

.textarea-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.clear-textarea-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.9) !important;
  border: 1px solid var(--surface-border) !important;
  color: var(--text-color-secondary) !important;
}

.clear-textarea-btn:hover {
  background: var(--surface-100) !important;
  color: var(--text-color) !important;
}

.button-group {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-left: auto;
}

/* 摘要弹出框样式 */
.summary-content {
  padding: 1rem 0;
  max-height: 60vh;
  overflow-y: auto;
}

.summary-text {
  font-size: 1rem;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: var(--text-color);
  background: var(--surface-50);
  padding: 1.5rem;
  border-radius: 0.5rem;
  border: 1px solid var(--surface-border);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.no-summary {
  text-align: center;
  color: var(--text-color-secondary);
  font-style: italic;
  padding: 2rem;
  background: var(--surface-100);
  border-radius: 0.5rem;
  border: 1px dashed var(--surface-border);
}

.review-btn {
  min-width: 100px;
}

.clear-btn {
  min-width: 80px;
}

.result-area {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: var(--text-color-secondary);
}

.empty-state i {
  margin-bottom: 1rem;
}

.result-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  height: 100%;
  overflow-y: auto;
}

/* 错误显示 */
.errors-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Git风格Diff视图 */
.diff-view {
  flex: 1;
  overflow-y: auto;
}

.git-diff {
  border: 1px solid var(--surface-border);
  border-radius: 0.5rem;
  background: var(--surface-0);
  overflow: hidden;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.diff-header {
  background: var(--surface-100);
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--surface-border);
}

.diff-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.additions {
  color: var(--green-600);
}

.deletions {
  color: var(--red-600);
}

.diff-content {
  overflow-y: auto;
  padding: 1rem;
}

.diff-text {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 16px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
  word-break: break-all;
  max-width: 56ch;
  overflow-wrap: break-word;
}

.diff-part {
  display: inline;
}

.diff-added {
  background: rgba(0, 190, 0, 0.3);
  color: var(--green-800);
  font-weight: 500;
  border-radius: 3px;
  padding: 1px 2px;
}

.diff-removed {
  background: rgba(255, 60, 60, 0.3);
  color: var(--red-800);
  font-weight: 500;
  border-radius: 3px;
  padding: 1px 2px;
}

/* 自定义卡片标题 */
.custom-card-header {
  border-bottom: 1px solid var(--surface-border);
  display: flex;
  padding: 0;
  margin: 0;
}

.custom-card-header.justify-content-end {
  justify-content: flex-end;
}

.custom-card-header.justify-content-between {
  justify-content: space-between;
}

/* 卡片标题样式 */
.input-card .p-card-title,
.result-card .p-card-title {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* 复制按钮样式 */
.copy-button {
  font-size: 0.875rem;
  padding: 0.5rem 0.75rem;
  margin-left: auto;
}

.copy-button:hover {
  background: var(--primary-color);
  color: white;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

@media (max-width: 768px) {
  .review-container {
    padding: 0rem;
  }

  .button-group {
    flex-direction: column;
    gap: 0.5rem;
  }

  .button-group .p-button {
    width: 100%;
  }
}
</style>