# PrimeVue 布局系统

这是一个基于 PrimeVue 4.x 构建的现代化管理界面布局系统，专为 CloudFlare Worker 项目设计。

## 🚀 特性

### 核心布局组件
- **顶部导航栏 (Menubar)**: 包含应用标题、用户信息和通知
- **侧边栏 (Sidebar)**: 响应式导航菜单，支持折叠/展开
- **主内容区域**: 面包屑导航和内容展示区域
- **移动端适配**: 完全响应式设计，支持触摸操作

### 设计特色
- 🎨 **Aura 主题**: 使用 PrimeVue 官方 Aura 主题，支持明暗模式
- 📱 **响应式设计**: 完美适配桌面端、平板和移动设备
- 🎭 **动画效果**: 流畅的过渡动画和悬停效果
- 🎯 **用户体验**: 直观的导航结构和视觉反馈

## 🛠️ 技术栈

- **Vue 3**: 使用 Composition API
- **PrimeVue 4.x**: 现代化 UI 组件库
- **Vue Router**: 单页应用路由
- **CSS Grid/Flexbox**: 现代布局技术
- **CSS 变量**: 主题色彩系统

## 📁 文件结构

```
src/
├── App.vue              # 主布局组件
├── views/
│   └── index.vue        # 首页仪表板
├── main.js              # 应用入口
└── router.js            # 路由配置
```

## 🔧 使用方法

### 1. 基本布局结构

```vue
<template>
  <div id="app">
    <!-- 顶部导航栏 -->
    <Menubar :model="menuItems" class="layout-menubar">
      <!-- 导航内容 -->
    </Menubar>

    <div class="layout-container">
      <!-- 侧边栏 -->
      <Sidebar v-model:visible="sidebarVisible" class="layout-sidebar">
        <!-- 侧边栏内容 -->
      </Sidebar>

      <!-- 主内容区域 -->
      <main class="layout-main">
        <!-- 内容头部 -->
        <div class="content-header">
          <!-- 面包屑导航 -->
        </div>

        <!-- 内容主体 -->
        <div class="content-body">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>
```

### 2. 配置菜单项

```javascript
// 顶部菜单
const menuItems = ref([
  {
    label: '文件',
    icon: 'pi pi-file',
    items: [
      { label: '新建', icon: 'pi pi-plus' },
      { label: '打开', icon: 'pi pi-folder-open' }
    ]
  }
])

// 侧边栏菜单
const sidebarItems = ref([
  { label: '仪表板', icon: 'pi pi-home', route: '/' },
  { label: '工作流', icon: 'pi pi-sitemap', route: '/workflows' }
])
```

### 3. 响应式控制

```javascript
// 检测移动端
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
  if (isMobile.value) {
    sidebarVisible.value = false
  } else {
    sidebarVisible.value = true
  }
}

// 切换侧边栏
const toggleSidebar = () => {
  sidebarVisible.value = !sidebarVisible.value
}
```

## 🎨 样式系统

### CSS 变量
布局使用 PrimeVue 的 CSS 变量系统，支持主题切换：

```css
.layout-menubar {
  background: var(--surface-card);
  border-bottom: 1px solid var(--surface-border);
}

.nav-link.active {
  background: var(--primary-color);
  color: var(--primary-color-text);
}
```

### 响应式断点
- **桌面端**: > 768px
- **移动端**: ≤ 768px

### 动画效果
- 侧边栏滑入/滑出动画
- 菜单项悬停效果
- 内容区域过渡动画

## 📱 移动端特性

### 触摸友好
- 侧边栏支持触摸滑动
- 按钮尺寸适配触摸操作
- 响应式网格布局

### 性能优化
- 移动端自动隐藏侧边栏
- 触摸遮罩层防止误触
- 平滑的动画过渡

## 🔍 组件说明

### Menubar (顶部导航)
- 应用标题和 Logo
- 用户信息和头像
- 通知和消息中心
- 下拉菜单支持

### Sidebar (侧边栏)
- 可折叠的导航菜单
- 图标和标签组合
- 当前页面高亮
- 响应式显示控制

### Breadcrumb (面包屑)
- 自动生成导航路径
- 支持路由跳转
- 响应式显示

### Card (卡片组件)
- 内容容器
- 标题和内容区域
- 响应式网格布局

## 🚀 扩展建议

### 1. 添加更多页面
```javascript
// 在 sidebarItems 中添加新路由
{ label: '数据分析', icon: 'pi pi-chart-bar', route: '/analytics' }
```

### 2. 自定义主题
```css
/* 在 main.js 中配置主题 */
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.dark-mode-toggle'
    }
  }
})
```

### 3. 国际化支持
```javascript
// 使用 PrimeVue 的国际化功能
import { createI18n } from 'vue-i18n'
```

## 🐛 常见问题

### Q: 侧边栏不显示？
A: 检查 `sidebarVisible` 变量和 CSS 样式，确保没有 `display: none`

### Q: 移动端布局异常？
A: 检查媒体查询断点设置，确保响应式样式正确

### Q: 主题色彩不正确？
A: 确认 PrimeVue 主题配置和 CSS 变量引用

## 📚 相关资源

- [PrimeVue 官方文档](https://primevue.org/)
- [Vue 3 官方文档](https://vuejs.org/)
- [CSS Grid 教程](https://css-tricks.com/snippets/css/complete-guide-grid/)
- [响应式设计指南](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request 来改进这个布局系统！

---

**注意**: 此布局系统专为 CloudFlare Worker 项目设计，使用 pnpm 包管理器，确保在正确的环境中运行。
