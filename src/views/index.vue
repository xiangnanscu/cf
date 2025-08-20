<script setup>
import { ref, onMounted } from "vue";

const { isMobile } = useWindowResize();

// 统计数据
const stats = ref([
  { icon: 'pi pi-users', value: '10,000+', label: '活跃用户' },
  { icon: 'pi pi-globe', value: '50+', label: '覆盖国家' },
  { icon: 'pi pi-clock', value: '99.9%', label: '服务可用性' },
  { icon: 'pi pi-star', value: '4.9', label: '用户评分' }
]);

// 特性列表
const features = ref([
  {
    icon: 'pi pi-shield',
    title: '安全可靠',
    description: '采用最新的安全技术，确保您的数据安全无忧'
  },
  {
    icon: 'pi pi-bolt',
    title: '高性能',
    description: '基于Cloudflare Workers构建，全球边缘计算，响应速度极快'
  },
  {
    icon: 'pi pi-mobile',
    title: '响应式设计',
    description: '完美适配各种设备，提供一致的用户体验'
  },
  {
    icon: 'pi pi-cog',
    title: '易于集成',
    description: '提供丰富的API和SDK，快速集成到您的项目中'
  }
]);

// 轮播图数据
const carouselItems = ref([
  {
    title: '欢迎使用我们的平台',
    description: '基于Cloudflare Workers构建的高性能应用',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=400&fit=crop'
  },
  {
    title: '现代化技术栈',
    description: 'Vue 3 + PrimeVue + Cloudflare Workers',
    image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=400&fit=crop'
  },
  {
    title: '全球部署',
    description: '利用Cloudflare全球网络，为用户提供最佳体验',
    image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=400&fit=crop'
  }
]);

// 导航菜单
const menuItems = ref([
  { label: '首页', icon: 'pi pi-home', url: '/' },
  { label: '产品', icon: 'pi pi-box', url: '/products' },
  { label: '服务', icon: 'pi pi-cog', url: '/services' },
  { label: '关于我们', icon: 'pi pi-info-circle', url: '/about' },
  { label: '联系我们', icon: 'pi pi-envelope', url: '/contact' }
]);

// 侧边栏状态
const sidebarVisible = ref(false);

// 切换侧边栏
const toggleSidebar = () => {
  sidebarVisible.value = !sidebarVisible.value;
};

onMounted(() => {
  // 页面加载完成后的初始化逻辑
  console.log('首页加载完成');
});
</script>

<template>
  <div class="home-page">
    <!-- 导航栏 -->
    <Menubar class="navbar">
      <template #start>
        <div class="logo">
          <i class="pi pi-cloud" style="font-size: 1.5rem; color: var(--primary-color);"></i>
          <span class="logo-text">CloudFlare App</span>
        </div>
      </template>

      <template #end>
        <div class="nav-actions">
          <Button
            icon="pi pi-bars"
            text
            @click="toggleSidebar"
            class="mobile-menu-btn"
            v-if="isMobile"
          />
          <div class="desktop-menu" v-else>
            <Button
              v-for="item in menuItems"
              :key="item.label"
              :label="item.label"
              :icon="item.icon"
              text
              class="nav-item"
            />
          </div>
        </div>
      </template>
    </Menubar>

    <!-- 侧边栏 -->
    <Sidebar v-model:visible="sidebarVisible" position="right" class="mobile-sidebar">
      <div class="sidebar-content">
        <div class="sidebar-header">
          <h3>菜单</h3>
          <Button icon="pi pi-times" text @click="toggleSidebar" />
        </div>
        <div class="sidebar-menu">
          <Button
            v-for="item in menuItems"
            :key="item.label"
            :label="item.label"
            :icon="item.icon"
            text
            class="sidebar-item"
            @click="toggleSidebar"
          />
        </div>
      </div>
    </Sidebar>

    <!-- 主要内容 -->
    <div class="main-content">
      <!-- 英雄区域 -->
      <section class="hero-section">
        <div class="hero-content">
          <h1 class="hero-title">欢迎来到 CloudFlare 应用平台</h1>
          <p class="hero-description">
            基于 Cloudflare Workers 构建的高性能、可扩展的现代化应用平台
          </p>
          <div class="hero-actions">
            <Button
              label="开始使用"
              icon="pi pi-play"
              size="large"
              class="primary-btn"
            />
            <Button
              label="了解更多"
              icon="pi pi-info-circle"
              size="large"
              text
              class="secondary-btn"
            />
          </div>
        </div>
        <div class="hero-image">
          <img src="https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=600&h=400&fit=crop" alt="Hero Image" />
        </div>
      </section>

      <!-- 轮播图区域 -->
      <section class="carousel-section">
        <h2 class="section-title">平台特色</h2>
        <Carousel
          :value="carouselItems"
          :numVisible="isMobile ? 1 : 3"
          :numScroll="1"
          :autoplayInterval="5000"
          class="feature-carousel"
        >
          <template #item="slotProps">
            <div class="carousel-item">
              <img :src="slotProps.data.image" :alt="slotProps.data.title" />
              <div class="carousel-content">
                <h3>{{ slotProps.data.title }}</h3>
                <p>{{ slotProps.data.description }}</p>
              </div>
            </div>
          </template>
        </Carousel>
      </section>

      <!-- 特性展示 -->
      <section class="features-section">
        <h2 class="section-title">核心特性</h2>
        <div class="features-grid">
          <Card
            v-for="feature in features"
            :key="feature.title"
            class="feature-card"
          >
            <template #header>
              <div class="feature-header">
                <i :class="feature.icon" class="feature-icon"></i>
                <h3>{{ feature.title }}</h3>
              </div>
            </template>
            <template #content>
              <p class="feature-description">{{ feature.description }}</p>
            </template>
          </Card>
        </div>
      </section>

      <!-- 统计数据 -->
      <section class="stats-section">
        <div class="stats-grid">
          <div
            v-for="stat in stats"
            :key="stat.label"
            class="stat-item"
          >
            <i :class="stat.icon" class="stat-icon"></i>
            <div class="stat-content">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- 联系区域 -->
      <section class="contact-section">
        <Card class="contact-card">
          <template #header>
            <h2>联系我们</h2>
          </template>
          <template #content>
            <div class="contact-form">
              <div class="form-row">
                <div class="form-field">
                  <label for="name">姓名</label>
                  <InputText id="name" placeholder="请输入您的姓名" />
                </div>
                <div class="form-field">
                  <label for="email">邮箱</label>
                  <InputText id="email" type="email" placeholder="请输入您的邮箱" />
                </div>
              </div>
              <div class="form-field">
                <label for="message">消息</label>
                <Textarea id="message" rows="4" placeholder="请输入您的消息" />
              </div>
              <Button label="发送消息" icon="pi pi-send" class="send-btn" />
            </div>
          </template>
        </Card>
      </section>
    </div>

    <!-- 页脚 -->
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-section">
          <h3>关于我们</h3>
          <p>基于 Cloudflare Workers 构建的现代化应用平台，为用户提供高性能、可扩展的服务。</p>
        </div>
        <div class="footer-section">
          <h3>快速链接</h3>
          <ul>
            <li><a href="/products">产品</a></li>
            <li><a href="/services">服务</a></li>
            <li><a href="/about">关于我们</a></li>
            <li><a href="/contact">联系我们</a></li>
          </ul>
        </div>
        <div class="footer-section">
          <h3>联系方式</h3>
          <p><i class="pi pi-envelope"></i> contact@example.com</p>
          <p><i class="pi pi-phone"></i> +86 123 4567 8900</p>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2024 CloudFlare App. 保留所有权利。</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

/* 导航栏样式 */
.navbar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: bold;
  font-size: 1.2rem;
}

.logo-text {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-600));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-item {
  font-weight: 500;
}

.mobile-menu-btn {
  display: none;
}

.desktop-menu {
  display: flex;
  gap: 0.5rem;
}

/* 侧边栏样式 */
.mobile-sidebar {
  display: none;
}

.sidebar-content {
  padding: 1rem;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--surface-border);
}

.sidebar-item {
  width: 100%;
  justify-content: flex-start;
  margin-bottom: 0.5rem;
}

/* 主要内容样式 */
.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

/* 英雄区域样式 */
.hero-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: center;
  margin-bottom: 4rem;
  padding: 3rem 0;
}

.hero-title {
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-600));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-description {
  font-size: 1.2rem;
  color: var(--text-color-secondary);
  margin-bottom: 2rem;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.primary-btn {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-600));
  border: none;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.secondary-btn {
  color: var(--primary-color);
}

.hero-image img {
  width: 100%;
  height: auto;
  border-radius: 1rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

/* 轮播图样式 */
.carousel-section {
  margin-bottom: 4rem;
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 2rem;
  color: var(--text-color);
}

.feature-carousel {
  max-width: 1000px;
  margin: 0 auto;
}

.carousel-item {
  position: relative;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.carousel-item img {
  width: 100%;
  height: 250px;
  object-fit: cover;
}

.carousel-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  color: white;
  padding: 2rem 1rem 1rem;
}

.carousel-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
}

.carousel-content p {
  margin: 0;
  opacity: 0.9;
}

/* 特性展示样式 */
.features-section {
  margin-bottom: 4rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.feature-card {
  height: 100%;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
}

.feature-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.feature-icon {
  font-size: 2rem;
  color: var(--primary-color);
}

.feature-header h3 {
  margin: 0;
  font-size: 1.3rem;
}

.feature-description {
  color: var(--text-color-secondary);
  line-height: 1.6;
  margin: 0;
}

/* 统计数据样式 */
.stats-section {
  margin-bottom: 4rem;
  padding: 3rem 0;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  text-align: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  font-size: 3rem;
  color: var(--primary-color);
}

.stat-value {
  font-size: 2.5rem;
  font-weight: bold;
  color: var(--primary-color);
}

.stat-label {
  font-size: 1.1rem;
  color: var(--text-color-secondary);
  font-weight: 500;
}

/* 联系区域样式 */
.contact-section {
  margin-bottom: 4rem;
}

.contact-card {
  max-width: 800px;
  margin: 0 auto;
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field label {
  font-weight: 500;
  color: var(--text-color);
}

.send-btn {
  align-self: flex-start;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-600));
  border: none;
}

/* 页脚样式 */
.footer {
  background: var(--surface-card);
  border-top: 1px solid var(--surface-border);
  margin-top: 4rem;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 1rem 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.footer-section h3 {
  color: var(--primary-color);
  margin-bottom: 1rem;
}

.footer-section p {
  color: var(--text-color-secondary);
  line-height: 1.6;
  margin-bottom: 0.5rem;
}

.footer-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-section li {
  margin-bottom: 0.5rem;
}

.footer-section a {
  color: var(--text-color-secondary);
  text-decoration: none;
  transition: color 0.3s ease;
}

.footer-section a:hover {
  color: var(--primary-color);
}

.footer-bottom {
  text-align: center;
  padding: 1.5rem;
  border-top: 1px solid var(--surface-border);
  color: var(--text-color-secondary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .hero-section {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 2rem;
  }

  .hero-title {
    font-size: 2rem;
  }

  .hero-description {
    font-size: 1rem;
  }

  .hero-actions {
    justify-content: center;
  }

  .section-title {
    font-size: 2rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .mobile-menu-btn {
    display: block;
  }

  .desktop-menu {
    display: none;
  }

  .mobile-sidebar {
    display: block;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .main-content {
    padding: 1rem 0.5rem;
  }

  .hero-section {
    padding: 2rem 0;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
