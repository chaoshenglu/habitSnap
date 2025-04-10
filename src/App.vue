<template>
  <div id="app">
    <router-view v-if="!authStore.loading"></router-view>
    <div v-else class="loading-container">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>
    
    <BottomNav v-if="showBottomNav" />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import BottomNav from './components/BottomNav.vue'

const route = useRoute()
const authStore = useAuthStore()

// 初始化认证状态
onMounted(() => {
  authStore.initialize()
})

// 控制底部导航的显示
const showBottomNav = computed(() => {
  // 在登录和注册页面不显示底部导航
  return !route.path.includes('/login') && !route.path.includes('/register')
})
</script>

<style>
/* 导入Material Icons字体 */
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');

/* 导入主样式文件 */
@import './assets/main.css';

/* 加载指示器样式 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: var(--primary-color);
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
