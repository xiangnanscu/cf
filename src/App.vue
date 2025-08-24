<template>
  <div id="app">
    <!-- 顶部导航栏 -->
    <Menubar class="layout-menubar">
      <template #start>
        <div class="flex align-items-center gap-2 brand-container">
          <img src="/logo.svg" alt="核稿大师" class="brand-logo" />
          <span class="font-bold text-xl">核稿大师</span>
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
            <i class="pi pi-cog" style="font-size: 1.5rem; color: #6c757d;"></i>
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
import { ref, provide, onMounted, watch } from 'vue'
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

// localStorage 配置键
const CONFIG_STORAGE_KEY = 'proofreading_config'

// 从 localStorage 加载保存的配置
const loadSavedConfig = () => {
  try {
    const saved = localStorage.getItem(CONFIG_STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.warn('Failed to load saved config:', error)
  }
  return {}
}

// 保存配置到 localStorage
const saveConfig = () => {
  try {
    const config = {
      selectedPlugins: selectedPlugins.value,
      selectedModel: selectedModel.value,
      pluginConfigs: pluginConfigs.value
    }
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config))
  } catch (error) {
    console.warn('Failed to save config:', error)
  }
}

// 初始化配置数据，优先使用保存的配置
const savedConfig = loadSavedConfig()
const availablePlugins = ref([])
const selectedPlugins = ref(savedConfig.selectedPlugins || ['grammar'])
const availableModels = ref([])
const selectedModel = ref(savedConfig.selectedModel || '')
const pluginConfigs = ref(savedConfig.pluginConfigs || {})

// 加载配置数据
onMounted(async () => {
  await loadPlugins()
  await loadModels()
  // 设置监听器，当配置改变时自动保存
  watch([selectedPlugins, selectedModel, pluginConfigs], () => {
    saveConfig()
  }, { deep: true })
})

// 加载可用插件
const loadPlugins = async () => {
  try {
    const response = await fetch('/plugins')
    const result = await response.json()
    if (result.success) {
      availablePlugins.value = result.data
      // 如果没有保存的配置，使用默认值
      if (!savedConfig.selectedPlugins) {
        selectedPlugins.value = ['grammar']
      }
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
      // 如果没有保存的模型选择，使用第一个可用模型
      if (result.data.length > 0 && !savedConfig.selectedModel && !selectedModel.value) {
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