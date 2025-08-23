<script setup>
import { ref } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  availablePlugins: {
    type: Array,
    default: () => []
  },
  selectedPlugins: {
    type: Array,
    default: () => []
  },
  availableModels: {
    type: Array,
    default: () => []
  },
  selectedModel: {
    type: String,
    default: ''
  },
  pluginConfigs: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:visible', 'update:selectedPlugins', 'update:selectedModel', 'update:pluginConfigs'])

const showAdvanced = ref(false)

// 获取插件信息
const getPluginInfo = (pluginType) => {
  return props.availablePlugins.find(p => p.type === pluginType)
}

// 更新插件配置
const updatePluginConfig = (pluginType, key, value) => {
  const newConfigs = { ...props.pluginConfigs }
  if (!newConfigs[pluginType]) {
    newConfigs[pluginType] = {}
  }
  newConfigs[pluginType][key] = value
  emit('update:pluginConfigs', newConfigs)
}

// 更新选中的模型
const updateSelectedModel = (value) => {
  emit('update:selectedModel', value)
}

// 关闭弹窗
const closeDialog = () => {
  emit('update:visible', false)
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="closeDialog"
    modal
    header="核稿配置"
    :style="{ width: '50rem' }"
    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
  >
    <template #header>

    </template>

    <div class="config-content">
      <!-- 模型选择 -->
      <div class="config-group">
        <label class="config-label">AI模型：</label>
        <Dropdown
          :modelValue="selectedModel"
          @update:modelValue="updateSelectedModel"
          :options="availableModels"
          optionLabel="name"
          optionValue="id"
          placeholder="选择AI模型"
          class="model-select w-full"
        />
      </div>

      <!-- 插件选择 -->
      <div class="config-group">
        <label class="config-label">启用插件：</label>
        <div class="plugin-grid">
          <div
            v-for="plugin in availablePlugins"
            :key="plugin.type"
            class="plugin-item"
            :class="{ 'plugin-selected': selectedPlugins.includes(plugin.type) }"
          >
            <Checkbox
              :inputId="plugin.type"
              :value="plugin.type"
              :modelValue="selectedPlugins"
              @update:modelValue="emit('update:selectedPlugins', $event)"
            />
            <label :for="plugin.type" class="plugin-label">
              <span class="plugin-name">{{ plugin.name }}</span>
              <small class="plugin-description">{{ plugin.description }}</small>
            </label>
          </div>
        </div>
      </div>

      <!-- 高级配置 -->
      <div class="advanced-section" style="display: none;">
        <Button
          :icon="showAdvanced ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
          label="高级配置"
          text
          @click="showAdvanced = !showAdvanced"
          class="advanced-toggle"
        />

        <div v-if="showAdvanced" class="advanced-config">
          <Divider />
          <div v-for="pluginType in selectedPlugins" :key="pluginType" class="plugin-config">
            <h4 class="plugin-config-title">{{ getPluginInfo(pluginType)?.name }} 配置</h4>
            <div
              v-for="(option, key) in getPluginInfo(pluginType)?.configOptions"
              :key="key"
              class="config-option"
            >
              <label class="option-label">{{ key }}:</label>
              <InputText
                v-if="option.type === 'string'"
                :placeholder="option.description"
                @update:modelValue="updatePluginConfig(pluginType, key, $event)"
                class="w-full"
              />
              <InputNumber
                v-else-if="option.type === 'number'"
                :min="option.min"
                :max="option.max"
                :placeholder="option.default?.toString()"
                @update:modelValue="updatePluginConfig(pluginType, key, $event)"
                class="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-content-end gap-2">
        <Button
          label="取消"
          icon="pi pi-times"
          severity="secondary"
          @click="closeDialog"
        />
        <Button
          label="确定"
          icon="pi pi-check"
          @click="closeDialog"
        />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.config-content {
  padding: 1rem 0;
}

.config-group {
  margin-bottom: 2rem;
}

.config-label {
  display: block;
  margin-bottom: 0.75rem;
  font-weight: 600;
  color: var(--text-color);
  font-size: 1rem;
}

.model-select {
  max-width: 300px;
}

.plugin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.plugin-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border: 2px solid var(--surface-border);
  border-radius: 0.75rem;
  background: var(--surface-50);
  transition: all 0.3s ease;
  cursor: pointer;
}

.plugin-item:hover {
  border-color: var(--primary-300);
  background: var(--primary-50);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.plugin-item.plugin-selected {
  border-color: var(--primary-color);
  background: var(--primary-100);
  box-shadow: 0 0 0 1px var(--primary-200);
}

.plugin-label {
  display: flex;
  flex-direction: column;
  cursor: pointer;
  flex: 1;
}

.plugin-name {
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 0.25rem;
}

.plugin-description {
  color: var(--text-color-secondary);
  font-size: 0.875rem;
  line-height: 1.4;
}

.advanced-section {
  margin-top: 1.5rem;
}

.advanced-toggle {
  color: var(--primary-color);
  font-weight: 600;
}

.advanced-config {
  margin-top: 1rem;
}

.plugin-config {
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  border: 1px solid var(--surface-border);
  border-radius: 0.75rem;
  background: var(--surface-0);
}

.plugin-config-title {
  margin: 0 0 1rem 0;
  color: var(--text-color);
  font-size: 1.1rem;
  font-weight: 600;
}

.config-option {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.option-label {
  font-weight: 500;
  color: var(--text-color);
  font-size: 0.9rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .plugin-grid {
    grid-template-columns: 1fr;
  }

  .config-option {
    gap: 0.5rem;
  }

  .model-select {
    max-width: 100%;
  }
}
</style>