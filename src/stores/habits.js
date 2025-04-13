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
        .order('habit_date', { ascending: false })
      
      // 应用类型筛选
      if (filters.value.type) {
        query = query.eq('type', filters.value.type)
      }
      
      // 应用日期筛选
      if (filters.value.startDate && filters.value.endDate) {
        query = query.gte('habit_date', filters.value.startDate)
        // 将结束日期设置为当天的23:59:59
        const endDate = new Date(filters.value.endDate)
        endDate.setHours(23, 59, 59)
        query = query.lte('habit_date', endDate.toISOString())
      }else{
        loading.value = false
        return
      }
      
      console.log('filters.value :', filters.value);
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
  async function createHabit({ type, remark, imageUrls, score, habit_date }) {
    if (!authStore.isAuthenticated) return { success: false, error: 'User not authenticated' }
    
    loading.value = true
    error.value = null
    
    try {
      // 检查当天是否已有同类型的记录
      const habitDate = new Date(habit_date);
      const startOfDay = new Date(habitDate.getFullYear(), habitDate.getMonth(), habitDate.getDate());
      const endOfDay = new Date(habitDate.getFullYear(), habitDate.getMonth(), habitDate.getDate(), 23, 59, 59);
      
      const { data: existingHabits, error: checkError } = await supabase
        .from('habits')
        .select('id')
        .eq('user_id', authStore.user.id)
        .eq('type', type)
        .gte('habit_date', startOfDay.toISOString())
        .lte('habit_date', endOfDay.toISOString());
      
      if (checkError) throw checkError;
      
      // 如果已存在同类型记录，返回错误
      if (existingHabits && existingHabits.length > 0) {
        return { 
          success: false, 
          error: `当天已经记录过${type === 'sleep' ? '睡眠' : type === 'diet' ? '饮食' : type === 'exercise' ? '锻炼' : '冥想'}习惯，每天只能记录一次同类型习惯。` 
        };
      }
      
      const newHabit = {
        user_id: authStore.user.id,
        type,
        remark: remark || null,
        image_urls: imageUrls || [],
        score: score || null,
        habit_date: habit_date
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
  
  // 更新习惯记录
  async function updateHabit(id, { type, remark, imageUrls, score, habit_date }) {
    if (!authStore.isAuthenticated) return { success: false, error: 'User not authenticated' }
    
    loading.value = true
    error.value = null
    
    try {
      const updatedHabit = {
        type,
        remark: remark || null,
        image_urls: imageUrls || [],
        score: score || null,
        habit_date: habit_date
      }
      
      const { data, error: updateError } = await supabase
        .from('habits')
        .update(updatedHabit)
        .eq('id', id)
        .eq('user_id', authStore.user.id)
        .select()
      
      if (updateError) throw updateError
      
      // 更新本地状态
      if (data && data.length > 0) {
        const index = habits.value.findIndex(h => h.id === id)
        if (index !== -1) {
          habits.value[index] = data[0]
        }
      }
      
      return { success: true, data: data?.[0] }
    } catch (err) {
      error.value = err.message
      console.error('Error updating habit:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }
  
  // 获取单个习惯详情
  async function fetchHabitById(id) {
    if (!authStore.isAuthenticated) return null
    
    loading.value = true
    error.value = null
    
    try {
      const { data, error: fetchError } = await supabase
        .from('habits')
        .select('*')
        .eq('id', id)
        .eq('user_id', authStore.user.id)
        .single()
      
      if (fetchError) throw fetchError
      return data
    } catch (err) {
      error.value = err.message
      console.error('Error fetching habit:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    habits,
    loading,
    error,
    filters,
    habitsByType,
    fetchHabits,
    fetchHabitById,
    createHabit,
    deleteHabit,
    updateHabit,
    updateFilters
  }
})