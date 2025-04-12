<template>
  <div class="detail-page">
    <div class="navbar">
      <router-link to="/habits" class="back-btn">
        <span class="material-icons">arrow_back</span>
      </router-link>
      <h1 class="navbar-title">习惯详情</h1>
    </div>

    <div class="container">
      <div v-if="loading" class="loading-indicator">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="!habit" class="empty-state card">
        <p>未找到习惯记录</p>
        <router-link to="/habits" class="btn btn-primary">返回列表</router-link>
      </div>

      <div v-else class="habit-detail card">
        <div class="habit-header">
          <span class="habit-tag" :class="`habit-tag-${habit.type}`">
            {{ habitTypeText(habit.type) }}
          </span>
          <span class="habit-date">{{ formatDate(habit.habit_date) }}</span>
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

        <div v-if="habit.remark" class="habit-remark">
          <h3>评语</h3>
          <p>{{ habit.remark }}</p>
        </div>
      </div>
    </div>

    <!-- 图片查看器 -->
    <div
      v-if="imageViewer.visible"
      class="image-viewer"
      @click="closeImageViewer"
    >
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
          <button
            class="btn btn-close-viewer"
            @click="closeImageViewer"
            aria-label="关闭"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useHabitsStore } from '../stores/habits';

const route = useRoute();
const habitsStore = useHabitsStore();
const loading = ref(true);
const habit = ref(null);

// 图片查看器状态
const imageViewer = ref({
  visible: false,
  images: [],
  currentIndex: 0,
  currentImage: '',
});

// 初始化
onMounted(async () => {
  const habitId = route.params.id;
  if (habitId) {
    const habits = await habitsStore.fetchHabits();
    habit.value = habits.find(h => h.id === habitId);
  }
  loading.value = false;
});

// 格式化日期
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// 习惯类型文本
function habitTypeText(type) {
  const types = {
    sleep: '睡眠',
    diet: '饮食',
    exercise: '锻炼',
    meditation: '冥想',
  };
  return types[type] || type;
}

// 打开图片查看器
function openImageViewer(images, index) {
  imageViewer.value = {
    visible: true,
    images,
    currentIndex: index,
    currentImage: images[index],
  };
}

// 关闭图片查看器
function closeImageViewer() {
  imageViewer.value.visible = false;
}

// 查看上一张图片
function prevImage() {
  if (imageViewer.value.currentIndex > 0) {
    imageViewer.value.currentIndex--;
    imageViewer.value.currentImage =
      imageViewer.value.images[imageViewer.value.currentIndex];
  }
}

// 查看下一张图片
function nextImage() {
  if (imageViewer.value.currentIndex < imageViewer.value.images.length - 1) {
    imageViewer.value.currentIndex++;
    imageViewer.value.currentImage =
      imageViewer.value.images[imageViewer.value.currentIndex];
  }
}
</script>

<style scoped>
.detail-page {
  padding-bottom: 80px;
}

.navbar {
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: var(--primary-color);
  color: white;
}

.back-btn {
  color: white;
  text-decoration: none;
  margin-right: 16px;
}

.navbar-title {
  font-size: 1.25rem;
  margin: 0;
}

.container {
  padding: 16px;
}

.habit-detail {
  margin-top: 16px;
}

.habit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.habit-tag {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.875rem;
  color: white;
}

.habit-tag-sleep { background-color: #2196f3; }
.habit-tag-diet { background-color: #4caf50; }
.habit-tag-exercise { background-color: #ff9800; }
.habit-tag-meditation { background-color: #9c27b0; }

.habit-date {
  font-size: 0.875rem;
  color: #666;
}

.habit-images {
  margin-bottom: 16px;
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
  margin-bottom: 16px;
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
  color: #ffb400;
}

.habit-remark {
  margin-top: 16px;
}

.habit-remark h3 {
  font-size: 1rem;
  margin-bottom: 8px;
}

.habit-remark p {
  margin: 0;
  white-space: pre-wrap;
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

.btn-close-viewer {
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-weight: bold;
  cursor: pointer;
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
  to {
    transform: rotate(360deg);
  }
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 32px 16px;
  color: #666;
}
</style>