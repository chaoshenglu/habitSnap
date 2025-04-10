<template>
  <div class="profile-page">
    <div class="navbar">
      <router-link to="/habits" class="back-btn">
        <span class="material-icons">arrow_back</span>
      </router-link>
      <h1 class="navbar-title">个人资料</h1>
    </div>
    
    <div class="container">
      <div class="card profile-card">
        <div class="profile-header">
          <div class="profile-avatar">
            <span class="material-icons">account_circle</span>
          </div>
          <h2 class="profile-email">{{ authStore.user?.email }}</h2>
        </div>
        
        <div class="profile-stats">
          <div class="stat-item">
            <span class="stat-value">{{ habitsStore.habits.length }}</span>
            <span class="stat-label">总记录</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ habitsStore.habitsByType.sleep.length }}</span>
            <span class="stat-label">睡眠</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ habitsStore.habitsByType.diet.length }}</span>
            <span class="stat-label">饮食</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ habitsStore.habitsByType.exercise.length }}</span>
            <span class="stat-label">锻炼</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ habitsStore.habitsByType.meditation.length }}</span>
            <span class="stat-label">冥想</span>
          </div>
        </div>
      </div>
      
      <button class="btn btn-danger w-100 mt-3" @click="handleLogout">
        退出登录
      </button>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useHabitsStore } from '../stores/habits'

const router = useRouter()
const authStore = useAuthStore()
const habitsStore = useHabitsStore()

onMounted(async () => {
  // 确保用户已登录
  if (!authStore.isAuthenticated) {
    await authStore.initialize()
    if (!authStore.isAuthenticated) {
      router.push('/login')
      return
    }
  }
  
  // 加载习惯数据（如果尚未加载）
  if (habitsStore.habits.length === 0) {
    await habitsStore.fetchHabits()
  }
})

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
}

.navbar {
  display: flex;
  align-items: center;
  padding: 16px;
}

.back-btn {
  margin-right: 16px;
  color: var(--text-color);
  text-decoration: none;
}

.navbar-title {
  font-size: 1.25rem;
  margin: 0;
}

.profile-card {
  margin-top: 16px;
}

.profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
}

.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: var(--light-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.profile-avatar .material-icons {
  font-size: 48px;
  color: #666;
}

.profile-email {
  font-size: 1.25rem;
  margin: 0;
  word-break: break-all;
}

.profile-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  border-radius: var(--border-radius);
  background-color: var(--light-bg);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.875rem;
  color: #666;
}

.w-100 {
  width: 100%;
}
</style>