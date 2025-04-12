<template>
  <div class="register-page">
    <div class="container">
      <h1 class="text-center mb-3">习惯拍</h1>
      <div class="card">
        <h2 class="text-center mb-2">注册</h2>
        
        <form @submit.prevent="handleRegister">
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
              placeholder="请输入密码（至少6位）"
              minlength="6"
            >
          </div>
          
          <div class="form-group">
            <label for="confirmPassword" class="form-label">确认密码</label>
            <input 
              type="password" 
              id="confirmPassword" 
              v-model="confirmPassword" 
              class="form-control" 
              required 
              placeholder="请再次输入密码"
              minlength="6"
            >
          </div>
          
          <div v-if="error" class="error-message mb-2">
            {{ error }}
          </div>
          
          <button 
            type="submit" 
            class="btn btn-primary w-100 mt-2" 
            :disabled="authStore.loading"
          >
            {{ authStore.loading ? '注册中...' : '注册' }}
          </button>
        </form>
        
        <div class="text-center mt-2">
          <p>已有账号？ <router-link to="/login">立即登录</router-link></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')

async function handleRegister() {
  error.value = ''
  
  if (!email.value || !password.value) {
    error.value = '请填写所有必填字段'
    return
  }
  
  if (password.value !== confirmPassword.value) {
    error.value = '两次输入的密码不一致'
    return
  }
  
  if (password.value.length < 6) {
    error.value = '密码长度至少为6位'
    return
  }
  
  const result = await authStore.register(email.value, password.value)
  
  if (result.success) {
    // 注册成功，跳转到登录页
    router.push('/login')
  } else {
    error.value = result.error || '注册失败，请稍后再试'
  }
}
</script>

<style scoped>
.register-page {
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