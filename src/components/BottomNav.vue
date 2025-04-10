<template>
  <nav class="bottom-nav">
    <router-link to="/habits" class="bottom-nav-item" :class="{ active: currentRoute === '/habits' }">
      <span class="material-icons">list</span>
      <span>习惯列表</span>
    </router-link>
    <router-link to="/habits/new" class="bottom-nav-item" :class="{ active: currentRoute === '/habits/new' }">
      <span class="material-icons">add_a_photo</span>
      <span>添加</span>
    </router-link>
    <router-link to="/profile" class="bottom-nav-item" :class="{ active: currentRoute === '/profile' }">
      <span class="material-icons">person</span>
      <span>我的</span>
    </router-link>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const currentRoute = computed(() => route.path)
</script>

<style scoped>
.bottom-nav {
  display: flex;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.bottom-nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0;
  color: #666;
  text-decoration: none;
}

.bottom-nav-item.active {
  color: var(--primary-color);
}

.material-icons {
  font-size: 24px;
  margin-bottom: 4px;
}
</style>