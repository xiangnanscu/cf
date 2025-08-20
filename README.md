# Cloudflare Workers 项目

这是一个基于 Cloudflare Workers 的现代化 Web 应用项目，使用 Vue 3 + PrimeVue 4.x 构建。

## 🚀 项目特性

- **现代化前端**: Vue 3 + Composition API
- **企业级UI**: PrimeVue 4.x 组件库
- **响应式设计**: 完美适配各种设备
- **Cloudflare部署**: 基于 Workers 的边缘计算
- **TypeScript支持**: 完整的类型定义
- **自动路由**: 基于文件系统的路由生成

## 🛠️ 技术栈

### 前端
- **Vue 3.5.18** - 渐进式 JavaScript 框架
- **PrimeVue 4.3.7** - 企业级 Vue 组件库
- **PrimeIcons 7.0.0** - 图标库
- **Vue Router 4** - 官方路由管理器
- **Vite** - 下一代前端构建工具

### 后端
- **Cloudflare Workers** - 边缘计算平台
- **Wrangler** - Workers 开发工具

### 开发工具
- **TypeScript** - 类型安全的 JavaScript
- **ESLint + Prettier** - 代码质量和格式化
- **pnpm** - 快速、节省磁盘空间的包管理器

## 📁 项目结构

```
cf/
├── src/
│   ├── App.vue              # 应用根组件
│   ├── main.js              # 应用入口文件
│   ├── router.js            # 路由配置
│   ├── views/
│   │   └── index.vue        # 首页组件 (PrimeVue)
│   └── assets/
│       └── main.css         # 全局样式和主题
├── worker/                  # Cloudflare Workers 代码
├── lib/                     # 核心库文件
├── components/              # 全局组件
├── composables/             # 组合式函数
└── package.json
```

## 🎨 PrimeVue 首页特性

### 主要组件
1. **导航栏** - 响应式顶部导航，支持移动端侧边栏
2. **英雄区域** - 大标题、描述和行动按钮
3. **轮播图** - 自动播放的平台特色展示
4. **特性卡片** - 4个核心特性展示
5. **统计数据** - 关键指标网格展示
6. **联系表单** - 用户反馈表单
7. **页脚** - 完整的信息和链接

### 设计特色
- 现代化渐变背景
- 流畅的悬停动画
- 响应式网格布局
- 优雅的阴影效果
- 移动端优先设计

## 🚀 快速开始

### 1. 安装依赖
```bash
pnpm install
```

### 2. 启动开发服务器
```bash
pnpm run dev:vite
```

### 3. 访问应用
打开浏览器访问 `http://localhost:5173`

### 4. 构建生产版本
```bash
pnpm run build
```

### 5. 部署到 Cloudflare
```bash
pnpm run deploy
```

## 🔧 开发配置

### 环境变量
创建 `.env` 文件：
```env
NODE_ENV=development
VITE_API_BASE_URL=http://localhost:8787
```

### PrimeVue 配置
PrimeVue 已在 `main.js` 中全局配置，支持：
- 自动组件导入
- 主题系统
- 图标库
- 响应式设计

### 路由配置
使用 `unplugin-vue-router` 自动生成路由：
- 基于文件系统的路由
- 自动类型生成
- 懒加载支持

## 📱 响应式设计

### 断点设置
- **桌面端**: > 768px
- **平板端**: 768px - 480px
- **移动端**: < 480px

### 移动端特性
- 侧边栏导航菜单
- 触摸友好的按钮尺寸
- 优化的字体和间距
- 单列布局适配

## 🎯 自定义配置

### 修改主题色彩
在 `src/assets/main.css` 中修改 CSS 变量：
```css
:root {
  --primary-color: #3B82F6;    /* 主色调 */
  --primary-600: #2563EB;      /* 深色主调 */
  --text-color: #1F2937;       /* 文字颜色 */
}
```

### 修改首页内容
在 `src/views/index.vue` 中修改：
- 统计数据 (`stats` 数组)
- 特性列表 (`features` 数组)
- 轮播图内容 (`carouselItems` 数组)
- 导航菜单 (`menuItems` 数组)

## 🐛 故障排除

### 常见问题

1. **PrimeVue 组件不显示**
   - 确保已安装 `primevue` 和 `primeicons`
   - 检查 `main.js` 中的 PrimeVue 配置
   - 验证 CSS 主题导入

2. **样式不正确**
   - 检查 `src/assets/main.css` 中的主题导入
   - 验证 CSS 变量定义
   - 清除浏览器缓存

3. **路由不工作**
   - 检查 `src/router.js` 配置
   - 验证 `unplugin-vue-router` 设置
   - 查看浏览器控制台错误

### 调试技巧
- 使用 Vue DevTools 检查组件状态
- 查看浏览器开发者工具控制台
- 检查网络请求和资源加载
- 验证 TypeScript 类型定义

## 📚 相关文档

- [Vue 3 官方文档](https://vuejs.org/)
- [PrimeVue 4.x 文档](https://primevue.org/)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Vite 官方文档](https://vitejs.dev/)

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [PrimeVue](https://primevue.org/) - 企业级 Vue 组件库
- [Cloudflare](https://cloudflare.com/) - 边缘计算平台
- [Vite](https://vitejs.dev/) - 下一代前端构建工具

---

**注意**: 这是一个基于最新技术栈的现代化项目，确保您的开发环境兼容 Node.js 18+ 和现代浏览器。
