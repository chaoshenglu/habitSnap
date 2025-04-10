import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../supabase'
import { useAuthStore } from './auth'

export const useHabitsStore = defineStore('habits', () => {
  const habits = ref([])
  const loading = ref(false)
  const error = ref(null)
  const filters = ref({
    type: null,
    startDate: null,
    endDate: null
  })
  
  const authStore = useAuthStore()
  
  // 获取习惯列表，支持筛选
  async function fetchHabits() {
    if (!authStore.isAuthenticated) return
    
    loading.value = true
    error.value = null
    
    try {
      let query = supabase
        .from('habits')
        .select('*')
        .eq('user_id', authStore.user.id)
        .order('created_at', { ascending: false })
      
      // 应用类型筛选
      if (filters.value.type) {
        query = query.eq('type', filters.value.type)
      }
      
      // 应用日期筛选
      if (filters.value.startDate) {
        query = query.gte('created_at', filters.value.startDate)
      }
      
      if (filters.value.endDate) {
        // 将结束日期设置为当天的23:59:59
        const endDate = new Date(filters.value.endDate)
        endDate.setHours(23, 59, 59)
        query = query.lte('created_at', endDate.toISOString())
      }
      
      const { data, error: fetchError } = await query
      
      if (fetchError) throw fetchError
      habits.value = data
    } catch (err) {
      error.value = err.message
      console.error('Error fetching habits:', err)
    } finally {
      loading.value = false
    }
  }
  
  // 创建新习惯记录
  async function createHabit({ type, remark, imageUrls, score }) {
    if (!authStore.isAuthenticated) return { success: false, error: 'User not authenticated' }
    
    loading.value = true
    error.value = null
    
    try {
      const newHabit = {
        user_id: authStore.user.id,
        type,
        remark: remark || null,
        image_urls: imageUrls || [],
        score: score || null,
        created_at: new Date().toISOString()
      }
      
      const { data, error: insertError } = await supabase
        .from('habits')
        .insert([newHabit])
        .select()
      
      if (insertError) throw insertError
      
      // 添加到本地状态
      if (data && data.length > 0) {
        habits.value = [data[0], ...habits.value]
      }
      
      return { success: true, data: data?.[0] }
    } catch (err) {
      error.value = err.message
      console.error('Error creating habit:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }
  
  // 删除习惯记录
  async function deleteHabit(id) {
    if (!authStore.isAuthenticated) return { success: false }
    
    loading.value = true
    error.value = null
    
    try {
      const { error: deleteError } = await supabase
        .from('habits')
        .delete()
        .eq('id', id)
        .eq('user_id', authStore.user.id)
      
      if (deleteError) throw deleteError
      
      // 从本地状态中移除
      habits.value = habits.value.filter(habit => habit.id !== id)
      
      return { success: true }
    } catch (err) {
      error.value = err.message
      console.error('Error deleting habit:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }
  
  // 更新筛选条件
  function updateFilters(newFilters) {
    filters.value = { ...filters.value, ...newFilters }
    fetchHabits()
  }
  
  // 重置筛选条件
  function resetFilters() {
    filters.value = {
      type: null,
      startDate: null,
      endDate: null
    }
    fetchHabits()
  }
  
  // 按类型分组的习惯统计
  const habitsByType = computed(() => {
    const result = {
      sleep: habits.value.filter(h => h.type === 'sleep'),
      diet: habits.value.filter(h => h.type === 'diet'),
      exercise: habits.value.filter(h => h.type === 'exercise'),
      meditation: habits.value.filter(h => h.type === 'meditation')
    }
    return result
  })
  
  return {
    habits,
    loading,
    error,
    filters,
    habitsByType,
    fetchHabits,
    createHabit,
    deleteHabit,
    updateFilters,
    resetFilters
  }
})