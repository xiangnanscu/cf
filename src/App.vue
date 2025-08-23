<template>
  <div id="app">
    <!-- 顶部导航栏 -->
    <Menubar class="layout-menubar">
      <template #start>
        <div class="flex align-items-center gap-2 brand-container">
          <img src="/logo.svg" alt="AI核稿" class="brand-logo" />
          <span class="font-bold text-xl">AI核稿</span>
        </div>
      </template>
      <template #end>
        <div class="flex align-items-center gap-2">
          <Button
            text
            rounded
            aria-label="核稿配置"
            @click="testPopup"
            class="config-button"
          >
            <i class="pi pi-cog" style="font-size: 1rem;"></i>
          </Button>
        </div>
      </template>
    </Menubar>

    <!-- 主内容区域 -->
    <main class="layout-main">
      <router-view />
    </main>

    <!-- 配置弹窗 -->
    <ProofreadConfigPopup
      :visible="showConfigPopup"
      @update:visible="closePopup"
      :availablePlugins="availablePlugins"
      v-model:selectedPlugins="selectedPlugins"
      :availableModels="availableModels"
      v-model:selectedModel="selectedModel"
      v-model:pluginConfigs="pluginConfigs"
    />
  </div>
</template>

<script setup>
import { ref, provide, onMounted } from 'vue'
import ProofreadConfigPopup from './components/ProofreadConfigPopup.vue'

// 弹窗控制
const showConfigPopup = ref(false)

// 调试方法
const testPopup = () => {
  console.log('按钮被点击了！当前弹窗状态:', showConfigPopup.value)
  showConfigPopup.value = true
  console.log('弹窗状态设置为:', showConfigPopup.value)
}

// 关闭弹窗
const closePopup = () => {
  showConfigPopup.value = false
}

// 配置数据
const availablePlugins = ref([])
const selectedPlugins = ref(['grammar'])
const availableModels = ref([])
const selectedModel = ref('')
const pluginConfigs = ref({})

// 加载配置数据
onMounted(async () => {
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
      if (result.data.length > 0 && !selectedModel.value) {
        selectedModel.value = result.data[0].id
      }
    }
  } catch (error) {
    console.error('Failed to load models:', error)
  }
}

// 提供配置数据给子组件
provide('proofreadConfig', {
  availablePlugins,
  selectedPlugins,
  availableModels,
  selectedModel,
  pluginConfigs
})
</script>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.layout-menubar {
  border: none;
  border-bottom: 1px solid var(--surface-border);
  background: var(--surface-card);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.layout-main {
  flex: 1;
  background: var(--surface-ground);
  min-height: calc(100vh - 60px);
}

.config-button {
  color: var(--text-color-secondary);
  transition: all 0.3s ease;
}

.config-button:hover {
  color: var(--primary-color);
  background: var(--primary-50);
  transform: scale(1.1);
}

.brand-container {
  height: 40px;
  display: flex;
  align-items: center;
}

.brand-logo {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  margin-right: 8px;
}
</style>