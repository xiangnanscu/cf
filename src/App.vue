<template>
  <div id="app">
    <!-- 顶部导航栏 -->
    <Menubar class="layout-menubar">
      <template #start>
        <div class="flex align-items-center gap-2">
          <i class="pi pi-robot text-xl text-primary"></i>
          <span class="font-bold text-xl">AI文本核稿助手</span>
        </div>
      </template>
      <template #end>
        <div class="flex align-items-center gap-2">
          <span class="font-medium">AI助手</span>
        </div>
      </template>
    </Menubar>

    <!-- 主内容区域 -->
    <main class="layout-main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
// 简化后的组件，只保留必要的导航
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
</style>