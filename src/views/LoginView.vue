<template>
  <div class="login-page">
    <div class="container">
      <h1 class="text-center mb-3">习惯追踪</h1>
      <div class="card">
        <h2 class="text-center mb-2">登录</h2>
        
        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label for="email" class="form-label">邮箱</label>
            <input 
              type="email" 
              id="email" 
              v-model="email" 
              class="form-control" 
              required 
              placeholder="请输入邮箱地址"
            >
          </div>
          
          <div class="form-group">
            <label for="password" class="form-label">密码</label>
            <input 
              type="password" 
              id="password" 
              v-model="password" 
              class="form-control" 
              required 
              placeholder="请输入密码"
            >
          </div>
          
          <div v-if="authStore.error" class="error-message mb-2">
            {{ authStore.error }}
          </div>
          
          <button 
            type="submit" 
            class="btn btn-primary w-100 mt-2" 
            :disabled="authStore.loading"
          >
            {{ authStore.loading ? '登录中...' : '登录' }}
          </button>
        </form>
        
        <div class="text-center mt-2">
          <p>还没有账号？ <router-link to="/register">立即注册</router-link></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')

async function handleLogin() {
  if (!email.value || !password.value) return
  
  const result = await authStore.login(email.value, password.value)
  if (result.success) {
    router.push('/habits')
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 20px;
  background-color: var(--light-bg);
}

.container {
  max-width: 400px;
  margin: auto;
  width: 100%;
}

h1 {
  color: var(--primary-color);
  margin-bottom: 2rem;
}

.error-message {
  color: var(--danger-color);
  font-size: 0.875rem;
}

.w-100 {
  width: 100%;
}
</style>