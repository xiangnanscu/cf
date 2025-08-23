<script setup>
import { ref, onMounted, inject } from 'vue'
import { diffChars } from 'diff'
import { useToast } from 'primevue/usetoast'

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
    const plugins = selectedPlugins.value.map(pluginType => ({
      type: pluginType,
      options: {
        modelName: selectedModel.value,
        ...pluginConfigs.value[pluginType]
      }
    }))

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

    if (result.success) {
      revisedText.value = result.data.finalText
      processingResults.value = result.data.results || []
      errors.value = result.data.errors || []

      // 生成diff视图
      generateDiff()
    } else {
      throw new Error(result.error || '核稿处理失败')
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
            <div class="custom-card-header flex align-items-center justify-content-between">
              <div class="button-group">
                <Button
                  label="开始核稿"
                  icon="pi pi-check"
                  @click="processText"
                  :loading="isProcessing"
                  :disabled="isProcessing || !originalText.trim() || selectedPlugins.length === 0"
                  class="review-btn"
                  size="small"
                />
                <Button
                  label="清空"
                  icon="pi pi-trash"
                  severity="secondary"
                  @click="clearAll"
                  class="clear-btn"
                  size="small"
                />
              </div>
            </div>
          </template>
          <template #content>
            <div class="input-area">
              <Textarea
                v-model="originalText"
                placeholder="请输入需要核稿的文本..."
                rows="15"
                class="w-full"
                autoResize
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
              <Button
                icon="pi pi-copy"
                label="复制结果"
                size="small"
                severity="secondary"
                @click="copyRevisedText"
                :disabled="!revisedText"
              />
            </div>
          </template>
          <template #content>
            <div class="result-area">
              <!-- 处理结果 -->
              <div v-if="revisedText" class="result-content">
                <!-- 错误提示 -->
                <div v-if="errors.length > 0" class="errors-section">
                  <Message
                    v-for="(error, index) in errors"
                    :key="index"
                    severity="error"
                    :closable="false"
                  >
                    <strong>{{ error.plugin }}:</strong> {{ error.error }}
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
</template>

<style scoped>
.review-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 2rem;
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

.button-group {
  display: flex;
  gap: 0.75rem;
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
  text-decoration: line-through;
}

/* 自定义卡片标题 */
.custom-card-header {
  border-bottom: 1px solid var(--surface-border);
  display: flex;
  justify-content: space-between;
  padding: 0;
  margin: 0;
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
    padding: 1rem;
  }

  .button-group {
    flex-direction: column;
  }
}
</style>