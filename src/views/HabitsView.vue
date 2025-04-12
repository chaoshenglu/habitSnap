<template>
  <div class="habits-page">
    <div class="navbar">
      <h1 class="navbar-brand">习惯追踪</h1>
    </div>

    <div class="container">
      <div class="filter-section card mb-2">
        <div class="form-group">
          <label class="form-label">日期范围</label>

          <div class="date-filter">
            <input
              type="date"
              class="form-control"
              v-model="startDate"
              @change="updateDateFilter"
            />
            <span class="date-separator">至</span>
            <input
              type="date"
              class="form-control"
              v-model="endDate"
              @change="updateDateFilter"
            />
          </div>
        </div>
        <div class="quick-date-buttons">
          <button
            class="btn btn-secondary"
            @click="setQuickDate('dayBeforeYesterday')"
          >
            前天
          </button>
          <button
            class="btn btn-secondary ml-10"
            @click="setQuickDate('yesterday')"
          >
            昨天
          </button>
          <button
            class="btn btn-secondary ml-10"
            @click="setQuickDate('today')"
          >
            今天
          </button>
          <button
            class="btn btn-secondary ml-10"
            @click="habitsStore.resetFilters()"
          >
            重置筛选
          </button>
        </div>
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
        <div
          v-for="habit in habitsStore.habits"
          :key="habit.id"
          class="habit-card card"
        >
          <div class="habit-header">
            <span class="habit-tag" :class="`habit-tag-${habit.type}`">
              {{ habitTypeText(habit.type) }}
            </span>
            <button class="more-btn" @click.stop="openActionMenu(habit)">
              <span class="material-icons">more_vert</span>
            </button>
          </div>

          <div
            v-if="habit.image_urls && habit.image_urls.length > 0"
            class="habit-images"
          >
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
                >★</span
              >
            </div>
          </div>

          <p v-if="habit.remark" class="habit-remark">评语：{{ habit.remark }}</p>

          <div class="habit-footer">
            <div></div>
            <span class="habit-date">{{ formatDate(habit.habit_date) }}</span>
          </div>
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
          <span
            >{{ imageViewer.currentIndex + 1 }} /
            {{ imageViewer.images.length }}</span
          >
          <button
            class="btn btn-secondary"
            @click="nextImage"
            :disabled="
              imageViewer.currentIndex === imageViewer.images.length - 1
            "
          >
            下一张
          </button>
        </div>
      </div>
    </div>

    <!-- 底部操作菜单 -->
    <div
      v-if="actionMenu.visible"
      class="action-menu-overlay"
      @click="actionMenu.visible = false"
    >
      <div class="action-menu">
        <button class="action-btn edit" @click="editHabit(actionMenu.habit)">
          修改
        </button>
        <button
          class="action-btn delete"
          @click="confirmDelete(actionMenu.habit.id)"
        >
          删除
        </button>
        <button class="action-btn cancel" @click="actionMenu.visible = false">
          取消
        </button>
      </div>
    </div>

    <!-- 确认删除对话框 -->
    <div v-if="deleteConfirm.visible" class="modal-overlay">
      <div class="modal-content card">
        <h3>确认删除</h3>
        <p>确定要删除这条习惯记录吗？此操作不可撤销。</p>
        <div class="modal-actions">
          <button class="btn" @click="deleteConfirm.visible = false">
            取消
          </button>
          <button class="btn btn-danger" @click="deleteHabit">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { useHabitsStore } from "../stores/habits";

const router = useRouter();
const authStore = useAuthStore();
const habitsStore = useHabitsStore();

// 日期筛选
const startDate = ref("");
const endDate = ref("");

// 图片查看器状态
const imageViewer = ref({
  visible: false,
  images: [],
  currentIndex: 0,
  currentImage: "",
});

// 删除确认对话框状态
const deleteConfirm = ref({
  visible: false,
  habitId: null,
});

// 操作菜单状态
const actionMenu = ref({
  visible: false,
  habit: null,
});

// 初始化
onMounted(async () => {
  // 确保用户已登录
  if (!authStore.isAuthenticated) {
    await authStore.initialize();
  }

  // 加载习惯数据
  habitsStore.fetchHabits();
});

// 设置快捷日期
function setQuickDate(type) {
  const today = new Date();
  const date = new Date(today);

  if (type === "today") {
    date.setDate(today.getDate());
  } else if (type === "yesterday") {
    date.setDate(today.getDate() - 1);
  } else if (type === "dayBeforeYesterday") {
    date.setDate(today.getDate() - 2);
  }

  const dateStr = date.toISOString().split("T")[0];
  startDate.value = dateStr;
  endDate.value = dateStr;
  updateDateFilter();
}

// 更新日期筛选
function updateDateFilter() {
  habitsStore.updateFilters({
    startDate: startDate.value || null,
    endDate: endDate.value || null,
  });
}

// 格式化日期
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// 习惯类型文本
function habitTypeText(type) {
  const types = {
    sleep: "睡眠",
    diet: "饮食",
    exercise: "锻炼",
    meditation: "冥想",
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

// 确认删除
function confirmDelete(habitId) {
  deleteConfirm.value = {
    visible: true,
    habitId,
  };
}

// 删除习惯
async function deleteHabit() {
  if (!deleteConfirm.value.habitId) return;

  const result = await habitsStore.deleteHabit(deleteConfirm.value.habitId);

  if (result.success) {
    deleteConfirm.value.visible = false;
    deleteConfirm.value.habitId = null;
    actionMenu.value.visible = false;
  }
}

// 打开操作菜单
function openActionMenu(habit) {
  actionMenu.value = {
    visible: true,
    habit,
  };
}

// 编辑习惯
function editHabit(habit) {
  if (!habit) return;
  router.push(`/habits/edit/${habit.id}`);
  actionMenu.value.visible = false;
}
</script>

<style scoped>
.habits-page {
  padding-bottom: 80px; /* 为底部按钮留出空间 */
}

.filter-section {
  margin-top: 16px;
}

.date-filter {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-separator {
  flex-shrink: 0;
}

.date-filter {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.date-filter .form-control {
  flex: 1;
  min-width: 120px;
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
  color: #ffb400;
}

.habit-remark {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
  padding-bottom: 60px; /* 添加底部内边距，避免被底部导航栏遮挡 */
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

/* 更多按钮 */
.more-btn {
  background: none;
  border: none;
  color: #666;
  padding: 4px;
  cursor: pointer;
  border-radius: 50%;
}

.more-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

/* 底部操作菜单 */
.action-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
}

.action-menu {
  width: 100%;
  background-color: white;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 60px;
}

.action-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  border: none;
  background: none;
  text-align: center;
  border-radius: 8px;
  font-size: 16px;
  width: 100%;
}

.action-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.action-btn.edit {
  color: #2196f3;
}

.action-btn.delete {
  color: #f44336;
}

.action-btn.cancel {
  color: #666;
  border-top: 1px solid #eee;
  margin-top: 8px;
  padding-top: 16px;
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
