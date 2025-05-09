<template>
  <div class="edit-habit-page">
    <div class="navbar">
      <router-link :to="`/habits/detail/${habitId}`" class="back-btn">
        <span class="material-icons">arrow_back</span>
      </router-link>
      <h1 class="navbar-title">编辑习惯记录</h1>
      <button
        @click="updateHabit"
        type="submit"
        :disabled="isSubmitting || !isFormValid"
        class="save-button"
      >
        {{ isSubmitting ? "保存中..." : "保存" }}
      </button>
    </div>
    <div
      v-if="showDatePicker"
      class="date-picker-overlay"
      @click="showDatePicker = false"
    >
      <div class="date-picker-container" @click.stop>
        <h3>选择日期</h3>
        <input
          type="date"
          class="form-control"
          v-model="dateInput"
          :max="today"
        />
        <div class="date-picker-actions">
          <button class="btn" @click="showDatePicker = false">取消</button>
          <button class="btn btn-primary" @click="confirmDateSelection">
            确定
          </button>
        </div>
      </div>
    </div>

    <div class="container">
      <div v-if="loading" class="loading-indicator">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>
      <form v-else class="habit-form">
        <div class="form-group">
          <label class="form-label">创建时间：</label>
          <div
            style="
              margin-bottom: 16px;
              background-color: white;
              padding: 16px;
              border-radius: var(--border-radius);
              border: 1px solid #ddd;
            "
            class="navbar-title date-selector"
            @click="showDatePicker = true"
          >
            <span class="material-icons date-icon">event</span>
            {{ formatDate(selectedDate) }}
          </div>
          <label class="form-label">习惯类型：</label>
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

        <div class="form-group">
          <label class="form-label">评分：</label>
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

        <div class="form-group">
          <label for="remark" class="form-label">评价：</label>
          <textarea
            id="remark"
            v-model="habitRemark"
            class="form-control"
            placeholder="添加评价..."
            rows="3"
          ></textarea>
        </div>

        <!-- 图片上传 -->
        <div class="form-group">
          <label class="form-label">照片</label>
          <div class="image-upload-container">
            <div class="image-upload-options">
              <div class="image-upload-btn" @click="openGallery">
                <span class="material-icons">photo_library</span>
                <span>从相册选择</span>
              </div>
              <div class="image-upload-btn" @click="openCamera">
                <span class="material-icons">photo_camera</span>
                <span>拍照</span>
              </div>
            </div>
            <input
              type="file"
              ref="galleryInput"
              accept="image/*"
              multiple
              @change="handleFileSelect"
              class="file-input"
            />
            <input
              type="file"
              ref="cameraInput"
              accept="image/*"
              capture="environment"
              @change="handleFileSelect"
              class="file-input"
            />
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
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { useHabitsStore } from "../stores/habits";
import { uploadImages } from "../utils/storage";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const habitsStore = useHabitsStore();

// 获取习惯ID
const habitId = route.params.id;

// 日期选择相关
const today = new Date().toISOString().split("T")[0]; // 今天的日期，格式为 YYYY-MM-DD
const selectedDate = ref(new Date()); // 默认为今天
const dateInput = ref(today);
const showDatePicker = ref(false);

// 表单数据
const habitType = ref("sleep");
const habitScore = ref(3);
const habitRemark = ref("");
const selectedFiles = ref([]);
const previewUrls = ref([]);
const existingImageUrls = ref([]);

// 状态
const error = ref("");
const isSubmitting = ref(false);
const loading = ref(true);
const galleryInput = ref(null);
const cameraInput = ref(null);

// 格式化日期显示
function formatDate(date) {
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// 确认日期选择
function confirmDateSelection() {
  if (dateInput.value) {
    selectedDate.value = new Date(dateInput.value);
  }
  showDatePicker.value = false;
}

// 表单验证
const isFormValid = computed(() => {
  return (
    habitType.value &&
    (previewUrls.value.length > 0 || habitRemark.value.trim() !== "")
  );
});

// 初始化 - 获取习惯数据
onMounted(async () => {
  // 隐藏底部导航栏
  document.body.classList.add("hide-bottom-nav");

  // 确保用户已登录
  if (!authStore.isAuthenticated) {
    await authStore.initialize();
    if (!authStore.isAuthenticated) {
      router.push("/login");
      return;
    }
  }

  // 获取习惯详情
  try {
    const habit = await habitsStore.fetchHabitById(habitId);
    if (!habit) {
      error.value = "未找到习惯记录";
      return;
    }

    // 填充表单数据
    habitType.value = habit.type || "sleep";
    habitScore.value = habit.score || 3;
    habitRemark.value = habit.remark || "";

    // 设置日期
    selectedDate.value = new Date(habit.habit_date);
    dateInput.value = selectedDate.value.toISOString().split("T")[0];

    // 设置图片
    if (habit.image_urls && habit.image_urls.length > 0) {
      existingImageUrls.value = [...habit.image_urls];
      previewUrls.value = [...habit.image_urls];
    }
  } catch (err) {
    console.error("Error fetching habit:", err);
    error.value = "加载习惯数据失败";
  } finally {
    loading.value = false;
  }
});

// 组件卸载时恢复底部导航栏
onBeforeUnmount(() => {
  document.body.classList.remove("hide-bottom-nav");
});

// 打开相册选择器
function openGallery() {
  galleryInput.value.click();
}

// 打开相机拍照
function openCamera() {
  cameraInput.value.click();
}

// 处理文件选择
function handleFileSelect(event) {
  const files = Array.from(event.target.files);
  if (!files.length) return;

  // 添加到已选文件列表
  selectedFiles.value = [...selectedFiles.value, ...files];

  // 生成预览URL
  files.forEach((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewUrls.value.push(e.target.result);
    };
    reader.readAsDataURL(file);
  });

  // 重置文件输入，以便可以再次选择相同的文件
  event.target.value = "";
}

// 移除图片
function removeImage(index) {
  // 检查是否是已有图片
  if (index < existingImageUrls.value.length) {
    existingImageUrls.value.splice(index, 1);
  } else {
    // 调整新上传图片的索引
    const newFileIndex = index - existingImageUrls.value.length;
    if (newFileIndex >= 0 && newFileIndex < selectedFiles.value.length) {
      selectedFiles.value.splice(newFileIndex, 1);
    }
  }
  previewUrls.value.splice(index, 1);
}

// 更新习惯
async function updateHabit() {
  if (!isFormValid.value) return;

  isSubmitting.value = true;
  error.value = "";

  try {
    // 上传新图片到Supabase存储
    let imageUrls = [...existingImageUrls.value];
    if (selectedFiles.value.length > 0) {
      const newImageUrls = await uploadImages(
        selectedFiles.value,
        authStore.user.id
      );
      imageUrls = [...imageUrls, ...newImageUrls];
    }

    // 创建习惯记录，合并选择的日期和当前时间
    const now = new Date();
    const habitDate = new Date(selectedDate.value);
    habitDate.setHours(
      now.getHours(),
      now.getMinutes(),
      now.getSeconds(),
      now.getMilliseconds()
    );

    const updatedHabit = {
      type: habitType.value,
      remark: habitRemark.value,
      imageUrls,
      score: habitScore.value,
      habit_date: habitDate.toISOString(),
    };

    const result = await habitsStore.updateHabit(habitId, updatedHabit);

    if (result.success) {
      // 更新成功，返回详情页
      router.push(`/habits/detail/${habitId}`);
    } else {
      error.value = result.error || "保存失败，请稍后再试";
    }
  } catch (err) {
    console.error("Error updating habit:", err);
    error.value = "保存失败，请稍后再试";
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
.edit-habit-page {
  padding-bottom: 20px;
}

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-color);
  text-decoration: none;
}

.navbar-title {
  font-size: 1.25rem;
  margin: 0;
}

.save-button {
  padding: 4px 8px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.save-button:hover:not(:disabled) {
  background-color: var(--primary-hover-color);
}

.save-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
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
  grid-template-columns: repeat(4, 1fr);
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
  background-color: white;
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
  color: #ffb400;
}

.image-upload-container {
  margin-bottom: 16px;
}

.image-upload-options {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.image-upload-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  border: 2px dashed #ddd;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
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

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: var(--primary-color);
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
