<script setup>
import { ref } from 'vue'
import { parseLocalPersonnel } from '../../lib/utils/personnel-parser.mjs'

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

// 更新插件配置
const updatePluginConfig = (pluginType, key, value) => {
  const newConfigs = { ...props.pluginConfigs }
  if (!newConfigs[pluginType]) {
    newConfigs[pluginType] = {}
  }
  newConfigs[pluginType][key] = value
  emit('update:pluginConfigs', newConfigs)
}

// 获取人员数据预览
const getPersonnelPreview = (pluginType) => {
  const config = props.pluginConfigs[pluginType]
  if (!config?.useLocalPersonnel || !config?.localPersonnelData) {
    return []
  }
  return parseLocalPersonnel(config.localPersonnelData)
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
    :style="{ width: '65rem' }"
    :breakpoints="{ '1199px': '85vw', '575px': '95vw' }"
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

      <!-- 人员信息核对插件的本地名单配置 -->
      <div v-if="selectedPlugins.includes('personnel')" class="personnel-config">
        <label class="config-label">人员信息配置：</label>

        <div class="personnel-mode-selection">
          <div class="radio-option">
            <RadioButton
              inputId="api-mode"
              name="personnel-mode"
              value="api"
              :modelValue="props.pluginConfigs.personnel?.useLocalPersonnel ? 'local' : 'api'"
              @update:modelValue="updatePluginConfig('personnel', 'useLocalPersonnel', $event === 'local')"
            />
            <label for="api-mode" class="radio-label">从接口获取人员名单</label>
          </div>

          <div class="radio-option">
            <RadioButton
              inputId="local-mode"
              name="personnel-mode"
              value="local"
              :modelValue="props.pluginConfigs.personnel?.useLocalPersonnel ? 'local' : 'api'"
              @update:modelValue="updatePluginConfig('personnel', 'useLocalPersonnel', $event === 'local')"
            />
            <label for="local-mode" class="radio-label">使用本地人员名单</label>
          </div>
        </div>

        <!-- API 配置 -->
        <div v-if="!props.pluginConfigs.personnel?.useLocalPersonnel" class="api-config">
          <label class="input-label">人员数据接口地址：</label>
          <InputText
            placeholder="请输入人员数据API地址"
            :modelValue="props.pluginConfigs.personnel?.personnelApiUrl || ''"
            @update:modelValue="updatePluginConfig('personnel', 'personnelApiUrl', $event)"
            class="w-full"
          />
        </div>

        <!-- 本地名单配置 -->
        <div v-if="props.pluginConfigs.personnel?.useLocalPersonnel" class="local-personnel-config">
          <div class="personnel-input-section">
            <label class="input-label">人员名单录入：</label>
            <div class="input-hint">每行一个人员，格式："姓名 职务"</div>

            <div class="personnel-layout">
              <!-- 左侧输入区 -->
              <div class="input-area">
                <Textarea
                  placeholder="请输入人员名单，每行一个人员&#10;例如：&#10;张三 县委书记&#10;李四 县长&#10;王五 水利局局长"
                  :modelValue="props.pluginConfigs.personnel?.localPersonnelData || ''"
                  @update:modelValue="updatePluginConfig('personnel', 'localPersonnelData', $event)"
                  class="personnel-textarea"
                  rows="8"
                  autoResize
                />
              </div>

              <!-- 右侧预览区 -->
              <div class="preview-area">
                <div class="preview-header">
                  <h5 class="preview-title">数据预览</h5>
                  <span class="preview-count">
                    共 {{ getPersonnelPreview('personnel').length }} 人
                  </span>
                </div>
                <div class="preview-content">
                  <div v-if="getPersonnelPreview('personnel').length === 0" class="preview-empty">
                    <i class="pi pi-info-circle"></i>
                    请在左侧输入人员名单
                  </div>
                  <div v-else class="preview-table-container">
                    <table class="personnel-table">
                      <thead>
                        <tr>
                          <th class="table-header">序号</th>
                          <th class="table-header">姓名</th>
                          <th class="table-header">职务</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(person, index) in getPersonnelPreview('personnel')"
                          :key="index"
                          class="table-row"
                        >
                          <td class="table-cell table-index">{{ index + 1 }}</td>
                          <td class="table-cell person-name">{{ person.name }}</td>
                          <td class="table-cell person-position">{{ person.position || '(无职务)' }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
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


/* 人员配置样式 */
.personnel-config {
  margin-top: 2rem;
  padding: 1.5rem;
  border: 2px solid var(--primary-200);
  border-radius: 0.75rem;
  background: var(--primary-50);
}

.personnel-mode-selection {
  display: flex;
  gap: 2rem;
  margin: 1rem 0;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.radio-label {
  font-size: 0.95rem;
  color: var(--text-color);
  cursor: pointer;
  font-weight: 500;
}

.api-config {
  margin-top: 1.5rem;
}

.input-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text-color);
  font-size: 0.95rem;
}

.local-personnel-config {
  margin-top: 1.5rem;
}

.personnel-input-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.input-hint {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  font-style: italic;
  margin-bottom: 0.5rem;
}

.personnel-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  align-items: start;
}

.input-area {
  display: flex;
  flex-direction: column;
}

.personnel-textarea {
  min-height: 200px;
  font-family: monospace;
  font-size: 0.9rem;
}

.preview-area {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--surface-border);
}

.preview-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-color);
}

.preview-count {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
  background: var(--surface-100);
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-weight: 500;
}

.preview-content {
  background: var(--surface-0);
  border: 1px solid var(--surface-border);
  border-radius: 0.5rem;
  overflow: hidden;
}

.preview-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: var(--text-color-secondary);
  font-style: italic;
  gap: 0.5rem;
}

.preview-empty i {
  font-size: 1.5rem;
  color: var(--text-color-secondary);
}

.preview-table-container {
  overflow-y: auto;
  padding: 0;
}

.personnel-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.table-header {
  background: var(--surface-100);
  color: var(--text-color);
  font-weight: 600;
  padding: 0.75rem 0.5rem;
  text-align: left;
  border-bottom: 2px solid var(--surface-border);
  font-size: 0.85rem;
}

.table-row:nth-child(even) {
  background: var(--surface-50);
}

.table-row:hover {
  background: var(--surface-100);
}

.table-cell {
  padding: 0.5rem;
  border-bottom: 1px solid var(--surface-border);
  vertical-align: top;
}

.table-index {
  width: 50px;
  text-align: center;
  color: var(--text-color-secondary);
  font-weight: 500;
}

.person-name {
  font-weight: 600;
  color: var(--text-color);
  min-width: 6em;
  width: auto;
}

.person-position {
  color: var(--text-color-secondary);
  font-style: italic;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .personnel-layout {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .personnel-mode-selection {
    flex-direction: column;
    gap: 1rem;
  }
}

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