<script setup>
import { ref, onMounted } from 'vue'
import { diffChars } from 'diff'
import { useToast } from 'primevue/usetoast'

const toast = useToast()

// 响应式数据
const originalText = ref('')
const revisedText = ref('')
const isProcessing = ref(false)
const diffResult = ref(null)
const availablePlugins = ref([])
const selectedPlugins = ref([])
const availableModels = ref([])
const selectedModel = ref('deepseek')
const processingResults = ref([])
const errors = ref([])
const showAdvanced = ref(false)

// 插件配置
const pluginConfigs = ref({})

onMounted(async () => {
  console.log('index.vue mounted')
  await loadPlugins()
  await loadModels()
})

// 加载可用插件
const loadPlugins = async () => {
  try {
    const response = await fetch('/plugins')
    const result = await response.json()
    if (result.success) {
      availablePlugins.value = result.data
      // 默认选择语法检查插件
      selectedPlugins.value = ['grammar']
    }
  } catch (error) {
    console.error('Failed to load plugins:', error)
  }
}

// 加载可用模型
const loadModels = async () => {
  try {
    const response = await fetch('/plugins?action=models')
    const result = await response.json()
    if (result.success) {
      availableModels.value = result.data
    }
  } catch (error) {
    console.error('Failed to load models:', error)
  }
}

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

// 切换插件选择
const togglePlugin = (pluginType) => {
  const index = selectedPlugins.value.indexOf(pluginType)
  if (index > -1) {
    selectedPlugins.value.splice(index, 1)
  } else {
    selectedPlugins.value.push(pluginType)
  }
}

// 获取插件信息
const getPluginInfo = (pluginType) => {
  return availablePlugins.value.find(p => p.type === pluginType)
}

// 更新插件配置
const updatePluginConfig = (pluginType, key, value) => {
  if (!pluginConfigs.value[pluginType]) {
    pluginConfigs.value[pluginType] = {}
  }
  pluginConfigs.value[pluginType][key] = value
}
</script>

<template>
  <div class="review-container">
    <!-- 配置面板 -->
    <div class="config-section">
      <Card class="config-card">
        <template #title>
          <div class="flex align-items-center gap-2">
            <i class="pi pi-cog text-primary"></i>
            核稿配置
            <Button
              icon="pi pi-angle-down"
              text
              @click="showAdvanced = !showAdvanced"
              :class="{ 'rotate-180': showAdvanced }"
            />
          </div>
        </template>
        <template #content>
          <!-- 模型选择 -->
          <div class="config-group">
            <label>AI模型：</label>
            <Dropdown
              v-model="selectedModel"
              :options="availableModels"
              optionLabel="name"
              optionValue="id"
              placeholder="选择AI模型"
              class="model-select"
            />
          </div>

          <!-- 插件选择 -->
          <div class="config-group">
            <label>启用插件：</label>
            <div class="plugin-list">
              <div
                v-for="plugin in availablePlugins"
                :key="plugin.type"
                class="plugin-item"
              >
                <Checkbox
                  :inputId="plugin.type"
                  :value="plugin.type"
                  v-model="selectedPlugins"
                />
                <label :for="plugin.type" class="plugin-label">
                  {{ plugin.name }}
                  <small>{{ plugin.description }}</small>
                </label>
              </div>
            </div>
          </div>

          <!-- 高级配置 -->
          <div v-if="showAdvanced" class="advanced-config">
            <Divider />
            <div v-for="pluginType in selectedPlugins" :key="pluginType" class="plugin-config">
              <h4>{{ getPluginInfo(pluginType)?.name }} 配置</h4>
              <div
                v-for="(option, key) in getPluginInfo(pluginType)?.configOptions"
                :key="key"
                class="config-option"
              >
                <label>{{ key }}:</label>
                <InputText
                  v-if="option.type === 'string'"
                  :placeholder="option.description"
                  @update:modelValue="updatePluginConfig(pluginType, key, $event)"
                />
                <InputNumber
                  v-else-if="option.type === 'number'"
                  :min="option.min"
                  :max="option.max"
                  :placeholder="option.default?.toString()"
                  @update:modelValue="updatePluginConfig(pluginType, key, $event)"
                />
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧输入区域 -->
      <div class="input-section">
        <Card class="input-card">
          <template #title>
            <div class="flex align-items-center gap-2">
              <i class="pi pi-pencil text-primary"></i>
              输入原文
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
              <div class="button-group">
                <Button
                  label="开始核稿"
                  icon="pi pi-check"
                  @click="processText"
                  :loading="isProcessing"
                  :disabled="!originalText.trim() || selectedPlugins.length === 0"
                  class="review-btn"
                />
                <Button
                  label="清空"
                  icon="pi pi-trash"
                  severity="secondary"
                  @click="clearAll"
                  class="clear-btn"
                />
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- 右侧结果区域 -->
      <div class="result-section">
        <Card class="result-card">
          <template #title>
            <div class="flex align-items-center justify-content-between">
              <div class="flex align-items-center gap-2">
                <i class="pi pi-eye text-success"></i>
                核稿结果
              </div>
              <Button
                v-if="revisedText"
                icon="pi pi-copy"
                label="复制结果"
                size="small"
                severity="secondary"
                @click="copyRevisedText"
                class="copy-button"
                :disabled="!revisedText"
              />
            </div>
          </template>
          <template #content>
            <div class="result-area">
              <!-- 空状态 -->
              <div v-if="!revisedText" class="empty-state">
                <i class="pi pi-file-edit text-6xl text-300"></i>
                <p class="text-500">选择插件并点击"开始核稿"按钮开始处理</p>
              </div>

              <!-- 处理结果 -->
              <div v-else class="result-content">
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
                    <div class="diff-header">
                      <div class="diff-stats">
                        <span class="additions">+{{ diffResult?.diff?.parts?.filter(part => part.added).length || 0 }}</span>
                        <span class="deletions">-{{ diffResult?.diff?.parts?.filter(part => part.removed).length || 0 }}</span>
                      </div>
                    </div>

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
  gap: 1.5rem;
  padding: 2rem;
  height: calc(100vh - 120px);
}

/* 配置面板 */
.config-section {
  flex-shrink: 0;
}

.config-card {
  margin-bottom: 1rem;
}

.config-group {
  margin-bottom: 1.5rem;
}

.config-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text-color);
}

.model-select {
  width: 200px;
}

.plugin-list {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.plugin-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid var(--surface-border);
  border-radius: 0.5rem;
  background: var(--surface-50);
  transition: all 0.2s;
}

.plugin-item:hover {
  border-color: var(--primary-color);
  background: var(--primary-50);
}

.plugin-label {
  display: flex;
  flex-direction: column;
  cursor: pointer;
}

.plugin-label small {
  color: var(--text-color-secondary);
  margin-top: 0.25rem;
  font-size: 0.8rem;
}

.advanced-config {
  margin-top: 1rem;
}

.plugin-config {
  margin-bottom: 1.5rem;
  padding: 1rem;
  border: 1px solid var(--surface-border);
  border-radius: 0.5rem;
  background: var(--surface-0);
}

.plugin-config h4 {
  margin: 0 0 1rem 0;
  color: var(--text-color);
}

.config-option {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.config-option label {
  min-width: 120px;
  margin-bottom: 0;
}

.rotate-180 {
  transform: rotate(180deg);
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
  gap: 1rem;
  margin-top: auto;
}

.review-btn {
  flex: 1;
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

/* 处理过程展示 */
.processing-results {
  border: 1px solid var(--surface-border);
  border-radius: 0.5rem;
  padding: 1rem;
  background: var(--surface-50);
}

.processing-results h4 {
  margin: 0 0 1rem 0;
  color: var(--text-color);
}

.processing-timeline {
  margin: 0;
}

.timeline-marker {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: var(--surface-0);
  border: 2px solid var(--success-color);
  border-radius: 50%;
}

.timeline-item h5 {
  margin: 0 0 0.5rem 0;
  color: var(--text-color);
}

.changes-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.change-item {
  padding: 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.change-grammar {
  background: var(--yellow-50);
  border-left: 3px solid var(--yellow-500);
}

.change-personnel {
  background: var(--blue-50);
  border-left: 3px solid var(--blue-500);
}

.change-error {
  background: var(--red-50);
  border-left: 3px solid var(--red-500);
}

/* Git风格Diff视图 */
.diff-view {
  flex: 1;
  overflow-y: auto;
}

.diff-title {
  margin: 0 0 0.75rem 0;
  color: var(--text-color);
  font-size: 1rem;
  font-weight: 600;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--surface-border);
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
  font-size: 0.875rem;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
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

/* 传统对比视图 */
.traditional-diff {
  margin-top: 1rem;
  border: 1px solid var(--surface-border);
  border-radius: 0.5rem;
}

.traditional-diff summary {
  padding: 0.75rem 1rem;
  background: var(--surface-50);
  cursor: pointer;
  font-weight: 600;
  color: var(--text-color-secondary);
}

.traditional-diff summary:hover {
  background: var(--surface-100);
}

.traditional-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
}

.diff-section {
  flex: 1;
}

.section-title {
  margin: 0 0 0.5rem 0;
  color: var(--text-color);
  font-size: 0.9rem;
  font-weight: 600;
}

.text-content {
  padding: 1rem;
  border-radius: 0.5rem;
  background: var(--surface-50);
  border: 1px solid var(--surface-border);
  min-height: 150px;
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.6;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
}

.text-content.original {
  background: var(--red-50);
  border-color: var(--red-200);
}

.text-content.revised {
  background: var(--green-50);
  border-color: var(--green-200);
}

/* 复制按钮样式 */
.copy-button {
  font-size: 0.875rem;
  padding: 0.5rem 0.75rem;
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

  .plugin-list {
    flex-direction: column;
  }
}

@media (max-width: 768px) {
  .review-container {
    padding: 1rem;
  }

  .config-option {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .config-option label {
    min-width: auto;
  }

  .button-group {
    flex-direction: column;
  }

  .text-content {
    min-height: 150px;
    font-size: 0.8rem;
  }
}
</style>