<script setup>
import { ref } from 'vue'

// 响应式数据
const originalText = ref('')
const revisedText = ref('')
const isProcessing = ref(false)
const diffResult = ref(null)

onMounted(() => {
  console.log('index.vue mounted')
  usePost('/users', {
    text: '你好'
  })
})

// 核稿方法
const processText = async () => {
  if (!originalText.value.trim()) {
    return
  }

  isProcessing.value = true

  try {
    // 这里调用后端API进行核稿
    // const response = await fetch('/api/review', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ text: originalText.value })
    // })
    // const result = await response.json()
    // revisedText.value = result.revisedText

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    revisedText.value = `核稿后的文本：${originalText.value}`

    // 生成简单的diff视图
    generateDiff()
  } catch (error) {
    console.error('核稿失败:', error)
  } finally {
    isProcessing.value = false
  }
}

// 生成diff视图
const generateDiff = () => {
  if (!originalText.value || !revisedText.value) return

  // 这里可以集成专业的diff库，如jsdiff
  // 现在用简单的对比显示
  diffResult.value = {
    original: originalText.value,
    revised: revisedText.value,
    changes: []
  }
}

// 清空内容
const clearAll = () => {
  originalText.value = ''
  revisedText.value = ''
  diffResult.value = null
}
</script>

<template>
  <div class="review-container">
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
                :disabled="!originalText.trim()"
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
          <div class="flex align-items-center gap-2">
            <i class="pi pi-eye text-success"></i>
            核稿结果
          </div>
        </template>
        <template #content>
          <div class="result-area">
            <div v-if="!revisedText" class="empty-state">
              <i class="pi pi-file-edit text-6xl text-300"></i>
              <p class="text-500">点击左侧"开始核稿"按钮开始处理</p>
            </div>

            <div v-else class="diff-view">
              <div class="diff-section">
                <h4 class="diff-title">原文</h4>
                <div class="text-content original">{{ originalText }}</div>
              </div>

              <div class="diff-section">
                <h4 class="diff-title">核稿后</h4>
                <div class="text-content revised">{{ revisedText }}</div>
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<style scoped>
.review-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  padding: 2rem;
  height: calc(100vh - 120px);
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

.diff-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  height: 100%;
  overflow-y: auto;
}

.diff-section {
  flex: 1;
}

.diff-title {
  margin: 0 0 0.75rem 0;
  color: var(--text-color);
  font-size: 1rem;
  font-weight: 600;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--surface-border);
}

.text-content {
  padding: 1rem;
  border-radius: 0.5rem;
  background: var(--surface-50);
  border: 1px solid var(--surface-border);
  min-height: 200px;
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

/* 响应式设计 */
@media (max-width: 1024px) {
  .review-container {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1rem;
  }

  .review-container {
    height: auto;
  }
}

@media (max-width: 768px) {
  .review-container {
    padding: 0.5rem;
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