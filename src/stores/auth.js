import { defineStore } from 'pinia'
import { supabase } from '../supabase'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(true)
  const error = ref(null)
  
  const isAuthenticated = computed(() => !!user.value)
  
  // 初始化用户状态
  async function initialize() {
    loading.value = true
    try {
      const { data } = await supabase.auth.getSession()
      user.value = data.session?.user || null
      
      // 设置认证状态变化监听器
      supabase.auth.onAuthStateChange((_, session) => {
        user.value = session?.user || null
      })
    } catch (err) {
      error.value = err.message
      console.error('Auth initialization error:', err)
    } finally {
      loading.value = false
    }
  }
  
  // 用户登录
  async function login(email, password) {
    loading.value = true
    error.value = null
    
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (authError) throw authError
      user.value = data.user
      return { success: true }
    } catch (err) {
      error.value = err.message
      console.error('Login error:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }
  
  // 用户注册
  async function register(email, password) {
    loading.value = true
    error.value = null
    
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password
      })
      
      if (authError) throw authError
      return { success: true, user: data.user }
    } catch (err) {
      error.value = err.message
      console.error('Registration error:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }
  
  // 用户登出
  async function logout() {
    try {
      const { error: authError } = await supabase.auth.signOut()
      if (authError) throw authError
      user.value = null
    } catch (err) {
      error.value = err.message
      console.error('Logout error:', err)
    }
  }
  
  return {
    user,
    loading,
    error,
    isAuthenticated,
    initialize,
    login,
    register,
    logout
  }
})