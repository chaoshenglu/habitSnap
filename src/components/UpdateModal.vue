<template>
  <div v-if="visible" class="update-modal-overlay">
    <div class="update-modal">
      <div class="update-modal-header">
        <h3>应用更新</h3>
      </div>
      <div class="update-modal-body">
        <p>应用已更新到最新版本，请刷新页面以应用更新</p>
      </div>
      <div class="update-modal-footer">
        <button @click="confirmUpdate" class="confirm-btn">立即刷新</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "UpdateModal",
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    confirmUpdate() {
      this.$emit("confirm");
      // 刷新页面
      window.location.reload();
    },
  },
};
</script>

<style scoped>
.update-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease;
}

.update-modal {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  animation: slideIn 0.3s ease;
}

.update-modal-header {
  padding: 16px;
  border-bottom: 1px solid #eee;
  text-align: center;
}

.update-modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.update-modal-body {
  padding: 20px 16px;
  text-align: center;
}

.update-modal-body p {
  margin: 0;
  color: #666;
  line-height: 1.5;
}

.update-modal-footer {
  padding: 12px 16px 16px;
  display: flex;
  justify-content: center;
}

.confirm-btn {
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 24px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.confirm-btn:hover {
  background-color: #45a049;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
