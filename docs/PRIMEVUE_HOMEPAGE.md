# PrimeVue 首页使用说明

## 概述

这是一个使用 PrimeVue 4.x 和 Vue 3 构建的现代化首页，专为 Cloudflare Workers 项目设计。

## 功能特性

### 🎨 现代化设计
- 使用 PrimeVue 4.x 最新组件库
- 响应式设计，完美适配各种设备
- 渐变背景和现代化视觉效果
- 流畅的动画和悬停效果

### 🧭 导航功能
- 固定顶部导航栏，支持滚动
- 响应式侧边栏菜单（移动端）
- 毛玻璃效果和阴影设计
- 品牌 Logo 和导航链接

### 🚀 主要内容区域
1. **英雄区域 (Hero Section)**
   - 大标题和描述文字
   - 行动按钮（开始使用、了解更多）
   - 右侧配图展示

2. **轮播图展示**
   - 自动播放的轮播组件
   - 平台特色介绍
   - 响应式图片展示

3. **核心特性展示**
   - 4个特性卡片
   - 图标 + 标题 + 描述
   - 悬停动画效果

4. **统计数据**
   - 4个关键数据指标
   - 图标 + 数值 + 标签
   - 网格布局展示

5. **联系表单**
   - 姓名、邮箱、消息输入
   - 响应式表单布局
   - PrimeVue 表单组件

6. **页脚信息**
   - 关于我们、快速链接、联系方式
   - 版权信息

## 技术栈

- **Vue 3** - 渐进式 JavaScript 框架
- **PrimeVue 4.x** - 企业级 Vue 组件库
- **PrimeIcons** - 图标库
- **CSS Grid & Flexbox** - 现代布局技术
- **CSS 变量** - 主题色彩管理
- **响应式设计** - 移动端优先

## 已安装的依赖

```json
{
  "primevue": "^4.3.7",
  "@primeuix/themes": "^1.2.3",
  "primeicons": "^7.0.0"
}
```

## 使用方法

### 1. 启动开发服务器
```bash
pnpm run dev:vite
```

### 2. 访问首页
打开浏览器访问 `http://localhost:5173`

### 3. 自定义配置

#### 修改主题色彩
在 `src/assets/main.css` 中修改 CSS 变量：
```css
:root {
  --primary-color: #3B82F6;    /* 主色调 */
  --primary-600: #2563EB;      /* 深色主调 */
  --text-color: #1F2937;       /* 文字颜色 */
  --text-color-secondary: #6B7280; /* 次要文字颜色 */
}
```

#### 修改统计数据
在 `src/views/index.vue` 中修改 `stats` 数组：
```javascript
const stats = ref([
  { icon: 'pi pi-users', value: '10,000+', label: '活跃用户' },
  // 添加更多统计数据...
]);
```

#### 修改特性列表
在 `src/views/index.vue` 中修改 `features` 数组：
```javascript
const features = ref([
  {
    icon: 'pi pi-shield',
    title: '安全可靠',
    description: '采用最新的安全技术，确保您的数据安全无忧'
  },
  // 添加更多特性...
]);
```

#### 修改轮播图内容
在 `src/views/index.vue` 中修改 `carouselItems` 数组：
```javascript
const carouselItems = ref([
  {
    title: '欢迎使用我们的平台',
    description: '基于Cloudflare Workers构建的高性能应用',
    image: 'your-image-url.jpg'
  },
  // 添加更多轮播图...
]);
```

## 组件说明

### PrimeVue 组件使用
- `Menubar` - 顶部导航栏
- `Sidebar` - 侧边栏菜单
- `Button` - 按钮组件
- `Card` - 卡片组件
- `Carousel` - 轮播图组件
- `InputText` - 文本输入框
- `Textarea` - 多行文本输入框

### 自定义组件
- 响应式布局组件
- 统计展示组件
- 特性卡片组件
- 联系表单组件

## 响应式设计

### 断点设置
- **桌面端**: > 768px
- **平板端**: 768px - 480px
- **移动端**: < 480px

### 移动端特性
- 侧边栏菜单
- 单列布局
- 触摸友好的按钮尺寸
- 优化的字体大小

## 性能优化

- 图片懒加载
- CSS 动画优化
- 组件按需加载
- 响应式图片

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 故障排除

### 常见问题

1. **图标不显示**
   - 确保已安装 `primeicons` 包
   - 检查 CSS 导入是否正确

2. **样式不正确**
   - 确保 PrimeVue 主题已正确导入
   - 检查 CSS 变量是否定义

3. **组件不工作**
   - 确保 PrimeVue 已正确配置
   - 检查浏览器控制台错误信息

### 调试技巧
- 使用浏览器开发者工具检查元素
- 查看 Vue DevTools 组件状态
- 检查网络请求和资源加载

## 下一步

- 添加更多页面路由
- 集成后端 API
- 添加用户认证
- 实现数据持久化
- 添加单元测试

## 贡献指南

欢迎提交 Issue 和 Pull Request 来改进这个首页！

---

**注意**: 这是一个基于 PrimeVue 4.x 的现代化首页，确保您的项目环境兼容 Vue 3 和 PrimeVue 4.x。