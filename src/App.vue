<script setup lang="ts"></script>

<template>
  <Suspense>
    <a-layout>
      <ant-loading />
      <a-layout-header class="header">
        <div class="logo">
          <router-link to="/" class="logo-link">
            <span class="logo-text">Mind Dump</span>
          </router-link>
        </div>
      </a-layout-header>
      <a-layout>
        <a-layout-content :style="{ 'background-color': '#fff' }">
          <router-view />
        </a-layout-content>
      </a-layout>
      <a-layout-footer style="text-align: center; display: none">
        <a href="http://beian.miit.gov.cn/" target="_blank">11</a>
      </a-layout-footer>
    </a-layout>
  </Suspense>
</template>

<style scoped>
.header {
  background: #fff;
  padding: 0 16px;
  display: flex;
  align-items: center;
}

.logo {
  height: 100%;
  display: flex;
  align-items: center;
}

.logo-link {
  text-decoration: none;
  color: #000;
  font-size: 20px;
  font-weight: bold;
}

.logo-text {
  background: linear-gradient(135deg, #4a4a4a, #9e9e9e, #848484, #3d3d3d);
  background-clip: text;
  color: transparent;
  letter-spacing: 1px;
  font-weight: 700;
  -webkit-font-smoothing: antialiased;
}
</style>
