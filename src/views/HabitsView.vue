<template>
  <div class="habits-page">
    <div class="navbar">
      <h1 class="navbar-brand">习惯追踪</h1>
      <button class="btn" @click="authStore.logout(); router.push('/login')">
        <span class="material-icons">logout</span>
      </button>
    </div>
    
    <div class="container">
      <div class="filter-section card mb-2">
        <div class="form-group">
          <div class="type-filter">
            <button 
              class="type-btn" 
              :class="{ active: !habitsStore.filters.type }"
              @click="habitsStore.updateFilters({ type: null })"
            >
              全部
            </button>
            <button 
              class="type-btn sleep" 
              :class="{ active: habitsStore.filters.type === 'sleep' }"
              @click="habitsStore.updateFilters({ type: 'sleep' })"
            >
              睡眠
            </button>
            <button 
              class="type-btn diet" 
              :class="{ active: habitsStore.filters.type === 'diet' }"
              @click="habitsStore.updateFilters({ type: 'diet' })"
            >
              饮食
            </button>
            <button 
              class="type-btn exercise" 
              :class="{ active: habitsStore.filters.type === 'exercise' }"
              @click="habitsStore.updateFilters({ type: 'exercise' })"
            >
              锻炼
            </button>
            <button 
              class="type-btn meditation" 
              :class="{ active: habitsStore.filters.type === 'meditation' }"
              @click="habitsStore.updateFilters({ type: 'meditation' })"
            >
              冥想
            </button>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">日期范围</label>
          <div class="date-filter">
            <input 
              type="date" 
              class="form-control" 
              v-model="startDate" 
              @change="updateDateFilter"
            >
            <span class="date-separator">至</span>
            <input 
              type="date" 
              class="form-control" 
              v-model="endDate" 
              @change="updateDateFilter"
            >
          </div>
        </div>
        
        <button class="btn btn-secondary" @click="habitsStore.resetFilters()">
          重置筛选
        </button>
      </div>
      
      <!-- 习惯列表 -->
      <div v-if="habitsStore.loading" class="loading-indicator">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>
      
      <div v-else-if="habitsStore.habits.length === 0" class="empty-state card">
        <p>暂无习惯记录</p>
        <p>点击下方按钮添加新记录</p>
      </div>
      
      <div v-else class="habits-list">
        <div v-for="habit in habitsStore.habits" :key="habit.id" class="habit-card card">
          <div class="habit-header">
            <span class="habit-tag" :class="`habit-tag-${habit.type}`">
              {{ habitTypeText(habit.type) }}
            </span>
          </div>
          
          <div v-if="habit.image_urls && habit.image_urls.length > 0" class="habit-images">
            <div class="image-grid">
              <div 
                v-for="(url, index) in habit.image_urls" 
                :key="index" 
                class="image-item"
                @click="openImageViewer(habit.image_urls, index)"
              >
                <img :src="url" alt="习惯图片" />
              </div>
            </div>
          </div>
          
          <div v-if="habit.score" class="habit-score">
            <span class="score-label">评分：</span>
            <div class="rating">
              <span 
                v-for="i in 5" 
                :key="i" 
                class="rating-star"
                :class="{ active: i <= habit.score }"
              >★</span>
            </div>
          </div>
          
          <p v-if="habit.remark" class="habit-remark">{{ habit.remark }}</p>
          
          <div class="habit-footer">
            <div></div>
            <span class="habit-date">{{ formatDate(habit.habit_date) }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 添加新习惯的浮动按钮 -->
    <router-link to="/habits/new" class="camera-btn">
      <span class="material-icons">add_a_photo</span>
    </router-link>
    
    <!-- 图片查看器 -->
    <div v-if="imageViewer.visible" class="image-viewer" @click="closeImageViewer">
      <div class="image-viewer-content" @click.stop>
        <img :src="imageViewer.currentImage" alt="习惯图片" />
        <div class="image-viewer-controls">
          <button 
            class="btn btn-secondary" 
            @click="prevImage" 
            :disabled="imageViewer.currentIndex === 0"
          >
            上一张
          </button>
          <span>{{ imageViewer.currentIndex + 1 }} / {{ imageViewer.images.length }}</span>
          <button 
            class="btn btn-secondary" 
            @click="nextImage" 
            :disabled="imageViewer.currentIndex === imageViewer.images.length - 1"
          >
            下一张
          </button>
        </div>
      </div>
    </div>
    
    <!-- 确认删除对话框 -->
    <div v-if="deleteConfirm.visible" class="modal-overlay">
      <div class="modal-content card">
        <h3>确认删除</h3>
        <p>确定要删除这条习惯记录吗？此操作不可撤销。</p>
        <div class="modal-actions">
          <button class="btn" @click="deleteConfirm.visible = false">取消</button>
          <button class="btn btn-danger" @click="deleteHabit">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useHabitsStore } from '../stores/habits'

const router = useRouter()
const authStore = useAuthStore()
const habitsStore = useHabitsStore()

// 日期筛选
const startDate = ref('')
const endDate = ref('')

// 图片查看器状态
const imageViewer = ref({
  visible: false,
  images: [],
  currentIndex: 0,
  currentImage: ''
})

// 删除确认对话框状态
const deleteConfirm = ref({
  visible: false,
  habitId: null
})

// 初始化
onMounted(async () => {
  // 确保用户已登录
  if (!authStore.isAuthenticated) {
    await authStore.initialize()
  }
  
  // 加载习惯数据
  habitsStore.fetchHabits()
})

// 更新日期筛选
function updateDateFilter() {
  habitsStore.updateFilters({
    startDate: startDate.value || null,
    endDate: endDate.value || null
  })
}

// 格式化日期
function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 习惯类型文本
function habitTypeText(type) {
  const types = {
    sleep: '睡眠',
    diet: '饮食',
    exercise: '锻炼',
    meditation: '冥想'
  }
  return types[type] || type
}

// 打开图片查看器
function openImageViewer(images, index) {
  imageViewer.value = {
    visible: true,
    images,
    currentIndex: index,
    currentImage: images[index]
  }
}

// 关闭图片查看器
function closeImageViewer() {
  imageViewer.value.visible = false
}

// 查看上一张图片
function prevImage() {
  if (imageViewer.value.currentIndex > 0) {
    imageViewer.value.currentIndex--
    imageViewer.value.currentImage = imageViewer.value.images[imageViewer.value.currentIndex]
  }
}

// 查看下一张图片
function nextImage() {
  if (imageViewer.value.currentIndex < imageViewer.value.images.length - 1) {
    imageViewer.value.currentIndex++
    imageViewer.value.currentImage = imageViewer.value.images[imageViewer.value.currentIndex]
  }
}

// 确认删除
function confirmDelete(habitId) {
  deleteConfirm.value = {
    visible: true,
    habitId
  }
}

// 删除习惯
async function deleteHabit() {
  if (!deleteConfirm.value.habitId) return
  
  const result = await habitsStore.deleteHabit(deleteConfirm.value.habitId)
  
  if (result.success) {
    deleteConfirm.value.visible = false
    deleteConfirm.value.habitId = null
  }
}
</script>

<style scoped>
.habits-page {
  padding-bottom: 80px; /* 为底部按钮留出空间 */
}

.filter-section {
  margin-top: 16px;
}

.type-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.type-btn {
  padding: 8px 12px;
  border-radius: 16px;
  border: 1px solid #ddd;
  background-color: white;
  font-size: 14px;
}

.type-btn.active {
  color: white;
  border-color: transparent;
}

.type-btn.active {
  background-color: #666;
}

.type-btn.sleep.active {
  background-color: #0288D1;
}

.type-btn.diet.active {
  background-color: #388E3C;
}

.type-btn.exercise.active {
  background-color: #F57C00;
}

.type-btn.meditation.active {
  background-color: #8E24AA;
}

.date-filter {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-separator {
  flex-shrink: 0;
}

/* 添加以下样式修复日期选择器超出屏幕的问题 */
.date-filter {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

@media (min-width: 480px) {
  .date-filter {
    flex-direction: row;
    align-items: center;
  }
}

.date-filter .form-control {
  width: 100%;
  min-width: 0;
}

.habits-list {
  margin-top: 16px;
}

.habit-card {
  margin-bottom: 16px;
  position: relative;
}

.habit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.habit-date {
  font-size: 0.875rem;
  color: #666;
}

.habit-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.habit-footer .habit-date {
  font-style: italic;
  text-align: right;
}

.habit-images {
  margin-bottom: 12px;
}

.image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.image-item {
  width: calc(33.333% - 6px);
  padding-top: calc(33.333% - 6px);
  position: relative;
  border-radius: var(--border-radius);
  overflow: hidden;
  cursor: pointer;
}

.image-item img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.habit-score {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.score-label {
  margin-right: 8px;
}

.rating {
  display: flex;
}

.rating-star {
  color: #ddd;
  font-size: 20px;
}

.rating-star.active {
  color: #FFB400;
}

.habit-remark {
  margin-bottom: 12px;
  white-space: pre-wrap;
}

.delete-btn {
  padding: 6px 12px;
  font-size: 0.875rem;
}

/* 图片查看器 */
.image-viewer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.image-viewer-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.image-viewer-content img {
  max-width: 100%;
  max-height: calc(100% - 80px);
  object-fit: contain;
}

.image-viewer-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 16px;
  color: white;
}

/* 确认删除对话框 */
.modal-overlay {
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

.modal-content {
  width: 90%;
  max-width: 320px;
  padding: 20px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
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

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 32px 16px;
  color: #666;
}
</style>