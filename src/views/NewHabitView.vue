<template>
  <div class="new-habit-page">
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
      <form @submit.prevent="saveHabit" class="habit-form">
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
          <div v-if="selectedFiles.length > 0" class="image-preview">
            <div 
              v-for="(file, index) in selectedFiles" 
              :key="index" 
              class="image-preview-item"
            >
              <img :src="previewUrls[index]" alt="预览图片" />
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
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useHabitsStore } from '../stores/habits'
import { uploadImages } from '../utils/storage'

const router = useRouter()
const authStore = useAuthStore()
const habitsStore = useHabitsStore()

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

// 状态
const error = ref('')
const isSubmitting = ref(false)
const fileInput = ref(null)

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

// 表单验证
const isFormValid = computed(() => {
  return habitType.value && (selectedFiles.value.length > 0 || habitRemark.value.trim() !== '')
})

// 初始化
onMounted(async () => {
  // 确保用户已登录
  if (!authStore.isAuthenticated) {
    await authStore.initialize()
    if (!authStore.isAuthenticated) {
      router.push('/login')
    }
  }
})

// 打开文件选择器
function openFilePicker() {
  fileInput.value.click()
}

// 处理文件选择
function handleFileSelect(event) {
  const files = Array.from(event.target.files)
  if (!files.length) return
  
  // 添加到已选文件列表
  selectedFiles.value = [...selectedFiles.value, ...files]
  
  // 生成预览URL
  files.forEach(file => {
    const reader = new FileReader()
    reader.onload = (e) => {
      previewUrls.value.push(e.target.result)
    }
    reader.readAsDataURL(file)
  })
  
  // 重置文件输入，以便可以再次选择相同的文件
  event.target.value = ''
}

// 移除图片
function removeImage(index) {
  selectedFiles.value.splice(index, 1)
  previewUrls.value.splice(index, 1)
}

// 保存习惯
async function saveHabit() {
  if (!isFormValid.value) return
  
  isSubmitting.value = true
  error.value = ''
  
  try {
    // 上传图片到Supabase存储
    let imageUrls = []
    if (selectedFiles.value.length > 0) {
      imageUrls = await uploadImages(selectedFiles.value, authStore.user.id)
    }
    
    // 创建习惯记录，合并选择的日期和当前时间
    const now = new Date()
    const habitDate = new Date(selectedDate.value)
    habitDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds())
    
    const newHabit = {
      type: habitType.value,
      remark: habitRemark.value,
      imageUrls,
      score: habitScore.value,
      habit_date: habitDate.toISOString() // 使用选择的日期和当前时间
    }
    console.log('New habit:', newHabit)
    const result = await habitsStore.createHabit(newHabit)
    
    if (result.success) {
      // 创建成功，返回列表页
      router.push('/habits')
    } else {
      error.value = result.error || '保存失败，请稍后再试'
    }
  } catch (err) {
    console.error('Error saving habit:', err)
    error.value = '保存失败，请稍后再试'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.new-habit-page {
  padding-bottom: 20px;
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

/* 日期选择器样式 */
.date-selector {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.date-icon {
  margin-left: 8px;
  font-size: 20px;
}

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
  padding: 20px;
  width: 90%;
  max-width: 320px;
}

.date-picker-container h3 {
  margin-top: 0;
  margin-bottom: 16px;
}

.date-picker-container .form-control {
  margin-bottom: 16px;
  width: 100%;
}

.date-picker-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.habit-form {
  padding: 16px 0;
  padding-bottom: 80px; /* 增加底部内边距，确保按钮不被导航栏遮挡 */
}

.type-selector {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
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
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.rating-selector {
  display: flex;
  gap: 12px;
}

.rating-star {
  font-size: 32px;
  color: #ddd;
  cursor: pointer;
  transition: color 0.2s;
}

.rating-star.active {
  color: #FFB400;
}

.image-upload-container {
  margin-bottom: 16px;
}

.image-upload-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  border: 2px dashed #ddd;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s;
}

.image-upload-btn:hover {
  border-color: var(--primary-color);
}

.image-upload-btn .material-icons {
  font-size: 32px;
  margin-bottom: 8px;
  color: #666;
}

.file-input {
  display: none;
}

.image-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
}

.image-preview-item {
  position: relative;
  width: calc(33.333% - 8px);
  padding-top: calc(33.333% - 8px);
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
  cursor: pointer;
}

.image-preview-remove .material-icons {
  font-size: 16px;
}

.error-message {
  color: var(--danger-color);
  font-size: 0.875rem;
}

.w-100 {
  width: 100%;
}

/* 添加底部安全区域，确保按钮不被底部导航栏遮挡 */
.habit-form {
  padding: 16px 0;
  padding-bottom: 80px; /* 增加底部内边距，确保按钮不被导航栏遮挡 */
}
</style>