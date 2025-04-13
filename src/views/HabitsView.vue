<template>
  <div class="habits-page">
    <div class="navbar">
      <div style="display: flex; flex-direction: row">
        <img src="/src/assets/logo.svg" style="width: 26px" />
        <h1 class="navbar-brand ml-5">习惯拍</h1>
      </div>
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
        <div class="quick-date-buttons" style="position: relative">
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
          <div
            @click="switchRows"
            style="
              display: flex;
              align-items: center;
              justify-content: center;
              width: 40px;
              height: 40px;
              position: absolute;
              right: 0px;
              top: 0px;
              border: 1px solid rgba(0, 0, 0, 0.2);
              border-radius: 6px;
            "
          >
            <img src="/src/assets/switch.png" style="width: 20px" />
          </div>
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
        <div v-if="viewMode === 'habit'">
          <div
            v-for="habit in habitsStore.habits"
            :key="habit.id"
            class="habit-card card"
          >
            <div class="habit-header">
              <div @click="goToDetailPage(habit)">
                <span class="habit-date">{{
                  formatDate(habit.habit_date)
                }}</span>
                <span class="habit-tag ml-5" :class="`habit-tag-${habit.type}`">
                  {{ habitTypeText(habit.type) }}
                </span>
              </div>
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
                  v-for="(url, index) in habit.image_urls.slice(0, 3)"
                  :key="index"
                  class="image-item"
                  @click="openImageViewer(habit.image_urls, index)"
                >
                  <img :src="url" alt="习惯图片" />
                  <div
                    v-if="index === 2 && habit.image_urls.length > 3"
                    class="remaining-count"
                  >
                    +{{ habit.image_urls.length - 3 }}
                  </div>
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

            <div @click="goToDetailPage(habit)">
              <p v-if="habit.remark" class="habit-remark">
                评语：{{ habit.remark }}
              </p>
            </div>
          </div>
        </div>

        <div v-else>
          <div
            v-for="day in dayGroupedHabits"
            :key="day.date"
            class="day-card card"
          >
            <div class="day-header">
              <span class="day-date">{{ formatDateSimple(day.date) }}</span>
            </div>

            <div class="day-habits-grid">
              <div class="day-habit-item">
                <div class="habit-score-display">
                  <div v-if="day.habits.sleep" class="rating">
                    🛌
                    <span
                      v-for="i in 5"
                      :key="i"
                      class="rating-star"
                      :class="{ active: i <= day.habits.sleep.score }"
                      >★</span
                    >
                  </div>
                  <span v-else>-</span>
                </div>
              </div>

              <div class="day-habit-item">
                <div class="habit-score-display">
                  <div v-if="day.habits.diet" class="rating">
                    🍚
                    <span
                      v-for="i in 5"
                      :key="i"
                      class="rating-star"
                      :class="{ active: i <= day.habits.diet.score }"
                      >★</span
                    >
                  </div>
                  <span v-else>-</span>
                </div>
              </div>

              <div class="day-habit-item">
                <div class="habit-score-display">
                  <div v-if="day.habits.exercise" class="rating">
                    💪🏼
                    <span
                      v-for="i in 5"
                      :key="i"
                      class="rating-star"
                      :class="{ active: i <= day.habits.exercise.score }"
                      >★</span
                    >
                  </div>
                  <span v-else>-</span>
                </div>
              </div>

              <div class="day-habit-item">
                <div class="habit-score-display">
                  <div v-if="day.habits.meditation" class="rating">
                    🧘🏻
                    <span
                      v-for="i in 5"
                      :key="i"
                      class="rating-star"
                      :class="{ active: i <= day.habits.meditation.score }"
                      >★</span
                    >
                  </div>
                  <span v-else>-</span>
                </div>
              </div>
            </div>
          </div>
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
        <button class="btn" @click="deleteConfirm.visible = false">取消</button>
        <button class="btn btn-danger" @click="deleteHabit">删除</button>
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
const viewMode = ref("habit"); // 'habit' 或 'day'

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

  // 设置默认日期范围
  const today = new Date();
  const dayBeforeYesterday = new Date(today);
  dayBeforeYesterday.setDate(today.getDate() - 2);

  startDate.value = dayBeforeYesterday.toISOString().split("T")[0];
  endDate.value = today.toISOString().split("T")[0];
  updateDateFilter();

  // 加载习惯数据
  habitsStore.fetchHabits();
});

function goToDetailPage(habit) {
  if (!habit || !habit.id) return;
  router.push(`/habits/detail/${habit.id}`);
}

function formatDateSimple(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

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
  // 如果结束时间早于开始时间，则交换它们
  if (new Date(endDate.value) < new Date(startDate.value)) {
    const temp = startDate.value;
    startDate.value = endDate.value;
    endDate.value = temp;
  }
  // 更新过滤器
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

// 添加一个计算属性，用于按天分组习惯数据
const dayGroupedHabits = computed(() => {
  if (!habitsStore.habits.length) return [];

  // 按日期分组
  const habitsByDate = {};

  habitsStore.habits.forEach((habit) => {
    // 提取日期部分（不包含时间）
    const dateOnly = habit.habit_date.split("T")[0];

    if (!habitsByDate[dateOnly]) {
      habitsByDate[dateOnly] = {
        date: dateOnly,
        habits: {
          sleep: null,
          diet: null,
          exercise: null,
          meditation: null,
        },
      };
    }

    // 每种类型只保存一条记录（如果有多条，以最后一条为准）
    habitsByDate[dateOnly].habits[habit.type] = habit;
  });

  // 转换为数组并按日期降序排序
  return Object.values(habitsByDate).sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
});

// 切换数据的展示方式（方式一与方式二直接来回切换）
function switchRows() {
  //# 方式一:列表的一项 对应 一个习惯(已完成)
  //# 方式二:根据habitsStore.habits生成一个新的数组(days)，一项 对应 一天
  //在这一个卡片中显示当天的日期和4个习惯的评分即可，不需要展示习惯的图片和评语，若当天只记录了睡眠，没有记录其他三项，其他三项的分数显示为"-"。
  //不需要考虑一天有多个睡眠记录的情况，因为我会限制每种类型的习惯每天只能记录一次。
  //当数据以方式二的形式展现时，不支持修改和删除习惯，也不支持点击卡片进入详情页。
  viewMode.value = viewMode.value === "habit" ? "day" : "habit";
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
  color: #666;
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

.remaining-count {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
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

.btn-close-viewer {
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-weight: bold;
  cursor: pointer;
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

.day-card {
  margin-bottom: 16px;
  padding: 16px;
}

.day-header {
  margin-bottom: 12px;
}

.day-date {
  font-size: 1.1rem;
  font-weight: bold;
  color: #333;
}

.day-habits-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.day-habit-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  background-color: var(--light-bg);
  border-radius: var(--border-radius);
}

.habit-type-label {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 4px;
}

.habit-score-display {
  display: flex;
  justify-content: center;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 32px 16px;
  color: #666;
}
</style>
