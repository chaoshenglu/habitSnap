<template>
  <div class="edit-habit-page">
    <div class="navbar">
      <router-link to="/habits" class="back-btn">
        <span class="material-icons">arrow_back</span>
      </router-link>
      <div class="navbar-title date-selector" @click="showDatePicker = true">
        {{ formatDate(selectedDate) }}
        <span class="material-icons date-icon">event</span>
      </div>
    </div>
    
    <!-- 日期选择器 -->
    <div v-if="showDatePicker" class="date-picker-overlay" @click="showDatePicker = false">
      <div class="date-picker-container" @click.stop>
        <h3>选择日期</h3>
        <input 
          type="date" 
          class="form-control" 
          v-model="dateInput"
          :max="today"
        >
        <div class="date-picker-actions">
          <button class="btn" @click="showDatePicker = false">取消</button>
          <button class="btn btn-primary" @click="confirmDateSelection">确定</button>
        </div>
      </div>
    </div>
    
    <div class="container">
      <div v-if="loading" class="loading-indicator">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>
      
      <form v-else @submit.prevent="updateHabit" class="habit-form">
        <!-- 习惯类型选择 -->
        <div class="form-group">
          <label class="form-label">习惯类型</label>
          <div class="type-selector">
            <div 
              class="type-option" 
              :class="{ active: habitType === 'sleep' }"
              @click="habitType = 'sleep'"
            >
              <span class="material-icons">bedtime</span>
              <span>睡眠</span>
            </div>
            <div 
              class="type-option" 
              :class="{ active: habitType === 'diet' }"
              @click="habitType = 'diet'"
            >
              <span class="material-icons">restaurant</span>
              <span>饮食</span>
            </div>
            <div 
              class="type-option" 
              :class="{ active: habitType === 'exercise' }"
              @click="habitType = 'exercise'"
            >
              <span class="material-icons">fitness_center</span>
              <span>锻炼</span>
            </div>
            <div 
              class="type-option" 
              :class="{ active: habitType === 'meditation' }"
              @click="habitType = 'meditation'"
            >
              <span class="material-icons">self_improvement</span>
              <span>冥想</span>
            </div>
          </div>
        </div>
        
        <!-- 评分 -->
        <div class="form-group">
          <label class="form-label">评分 (1-5)</label>
          <div class="rating-selector">
            <div 
              v-for="i in 5" 
              :key="i"
              class="rating-star"
              :class="{ active: i <= habitScore }"
              @click="habitScore = i"
            >
              ★
            </div>
          </div>
        </div>
        
        <!-- 备注 -->
        <div class="form-group">
          <label for="remark" class="form-label">备注</label>
          <textarea 
            id="remark" 
            v-model="habitRemark" 
            class="form-control" 
            placeholder="添加备注..."
            rows="3"
          ></textarea>
        </div>
        
        <!-- 图片上传 -->
        <div class="form-group">
          <label class="form-label">照片</label>
          <div class="image-upload-container">
            <div 
              class="image-upload-btn"
              @click="openFilePicker"
            >
              <span class="material-icons">add_a_photo</span>
              <span>添加照片</span>
            </div>
            <input 
              type="file" 
              ref="fileInput" 
              accept="image/*" 
              multiple 
              @change="handleFileSelect" 
              class="file-input"
              capture="environment"
            >
          </div>
          
          <!-- 图片预览 -->
          <div v-if="previewUrls.length > 0" class="image-preview">
            <div 
              v-for="(url, index) in previewUrls" 
              :key="index" 
              class="image-preview-item"
            >
              <img :src="url" alt="预览图片" />
              <button 
                type="button"
                class="image-preview-remove" 
                @click="removeImage(index)"
              >
                <span class="material-icons">close</span>
              </button>
            </div>
          </div>
        </div>
        
        <div v-if="error" class="error-message mb-2">
          {{ error }}
        </div>
        
        <button 
          type="submit" 
          class="btn btn-primary w-100 mt-2" 
          :disabled="isSubmitting || !isFormValid"
        >
          {{ isSubmitting ? '保存中...' : '保存' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useHabitsStore } from '../stores/habits'
import { uploadImages } from '../utils/storage'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const habitsStore = useHabitsStore()

// 获取习惯ID
const habitId = route.params.id

// 加载状态
const loading = ref(true)

// 日期选择相关
const today = new Date().toISOString().split('T')[0] // 今天的日期，格式为 YYYY-MM-DD
const selectedDate = ref(new Date()) // 默认为今天
const dateInput = ref(today)
const showDatePicker = ref(false)

// 表单数据
const habitType = ref('sleep') // 默认选择睡眠
const habitScore = ref(3) // 默认3分
const habitRemark = ref('')
const selectedFiles = ref([])
const previewUrls = ref([])
const existingImageUrls = ref([])

// 状态
const error = ref('')
const isSubmitting = ref(false)
const fileInput = ref(null)

// 表单验证
const isFormValid = computed(() => {
  return habitType.value !== ''
})

// 初始化 - 获取习惯数据
onMounted(async () => {
  // 确保用户已登录
  if (!authStore.isAuthenticated) {
    await authStore.initialize()
    if (!authStore.isAuthenticated) {
      router.push('/login')
      return
    }
  }
  
  // 加载习惯数据
  await loadHabitData()
})

// 加载习惯数据
async function loadHabitData() {
  loading.value = true
  error.value = ''
  
  try {
    // 查找当前习惯
    const habit = habitsStore.habits.find(h => h.id === parseInt(habitId))
    
    if (!habit) {
      // 如果在本地状态中找不到，尝试重新获取所有习惯
      await habitsStore.fetchHabits()
      const refetchedHabit = habitsStore.habits.find(h => h.id === parseInt(habitId))
      
      if (!refetchedHabit) {
        throw new Error('找不到该习惯记录')
      }
      
      initFormWithHabit(refetchedHabit)
    } else {
      initFormWithHabit(habit)
    }
  } catch (err) {
    error.value = err.message || '加载习惯数据失败'
    console.error('Error loading habit:', err)
  } finally {
    loading.value = false
  }
}

// 用习惯数据初始化表单
function initFormWithHabit(habit) {
  habitType.value = habit.type || 'sleep'
  habitScore.value = habit.score || 0
  habitRemark.value = habit.remark || ''
  selectedDate.value = new Date(habit.habit_date)
  dateInput.value = habit.habit_date.split('T')[0]
  
  // 处理图片
  if (habit.image_urls && habit.image_urls.length > 0) {
    existingImageUrls.value = [...habit.image_urls]
    previewUrls.value = [...habit.image_urls]
  }
}

// 格式化日期显示
function formatDate(date) {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 确认日期选择
function confirmDateSelection() {
  if (dateInput.value) {
    selectedDate.value = new Date(dateInput.value)
  }
  showDatePicker.value = false
}

// 打开文件选择器
function openFilePicker() {
  fileInput.value.click()
}

// 处理文件选择
function handleFileSelect(event) {
  const files = event.target.files
  if (!files || files.length === 0) return
  
  // 添加新选择的文件
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    selectedFiles.value.push(file)
    
    // 创建预览URL
    const url = URL.createObjectURL(file)
    previewUrls.value.push(url)
  }
  
  // 重置文件输入，以便可以再次选择相同的文件
  event.target.value = ''
}

// 移除图片
function removeImage(index) {
  // 检查是否是现有图片或新上传的图片
  if (index < existingImageUrls.value.length) {
    // 移除现有图片
    existingImageUrls.value.splice(index, 1)
    previewUrls.value.splice(index, 1)
  } else {
    // 调整索引以匹配selectedFiles数组
    const adjustedIndex = index - existingImageUrls.value.length
    
    // 释放预览URL
    URL.revokeObjectURL(previewUrls.value[index])
    
    // 移除文件和预览
    selectedFiles.value.splice(adjustedIndex, 1)
    previewUrls.value.splice(index, 1)
  }
}

// 更新习惯
async function updateHabit() {
  if (!isFormValid.value) return
  
  isSubmitting.value = true
  error.value = ''
  
  try {
    // 准备图片URLs数组
    let imageUrls = [...existingImageUrls.value]
    
    // 如果有新上传的图片，先上传它们
    if (selectedFiles.value.length > 0) {
      const uploadedUrls = await uploadImages(selectedFiles.value)
      imageUrls = [...imageUrls, ...uploadedUrls]
    }
    
    // 准备习惯数据
    const habitData = {
      type: habitType.value,
      remark: habitRemark.value,
      imageUrls: imageUrls,
      score: habitScore.value || null,
      habit_date: selectedDate.value.toISOString()
    }
    
    // 更新习惯
    const result = await habitsStore.updateHabit(habitId, habitData)
    
    if (!result.success) {
      throw new Error(result.error || '更新习惯失败')
    }
    
    // 更新成功，返回习惯列表页面
    router.push('/habits')
  } catch (err) {
    error.value = err.message || '更新习惯失败'
    console.error('Error updating habit:', err)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.edit-habit-page {
  padding-bottom: 16px;
}

.navbar-title {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.date-icon {
  font-size: 18px;
}

/* 日期选择器 */
.date-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.date-picker-container {
  background-color: white;
  border-radius: var(--border-radius);
  padding: 16px;
  width: 90%;
  max-width: 320px;
}

.date-picker-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

/* 表单样式 */
.habit-form {
  margin-top: 16px;
}

.type-selector {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 8px;
}

.type-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  border-radius: var(--border-radius);
  border: 1px solid #ddd;
  cursor: pointer;
  transition: all 0.2s;
}

.type-option .material-icons {
  font-size: 24px;
  margin-bottom: 8px;
}

.type-option.active {
  color: white;
}

.type-option:nth-child(1).active {
  background-color: #0288D1;
  border-color: #0288D1;
}

.type-option:nth-child(2).active {
  background-color: #388E3C;
  border-color: #388E3C;
}

.type-option:nth-child(3).active {
  background-color: #F57C00;
  border-color: #F57C00;
}

.type-option:nth-child(4).active {
  background-color: #8E24AA;
  border-color: #8E24AA;
}

/* 评分选择器 */
.rating-selector {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.rating-star {
  font-size: 32px;
  color: #ddd;
  cursor: pointer;
  user-select: none;
}

.rating-star.active {
  color: #FFB400;
}

/* 图片上传 */
.image-upload-container {
  margin-top: 8px;
}

.image-upload-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  border: 1px dashed #ddd;
  border-radius: var(--border-radius);
  cursor: pointer;
}

.image-upload-btn .material-icons {
  font-size: 24px;
  margin-bottom: 8px;
  color: var(--primary-color);
}

.file-input {
  display: none;
}

/* 图片预览 */
.image-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.image-preview-item {
  position: relative;
  width: calc(33.333% - 6px);
  padding-top: calc(33.333% - 6px);
  border-radius: var(--border-radius);
  overflow: hidden;
}

.image-preview-item img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-preview-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.image-preview-remove .material-icons {
  font-size: 16px;
}

/* 错误消息 */
.error-message {
  color: var(--danger-color);
  font-size: 0.875rem;
}

/* 加载指示器 */
.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 0;
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