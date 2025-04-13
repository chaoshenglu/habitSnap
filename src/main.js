import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { pinia } from './stores'

// 注册service worker
import { registerSW } from 'virtual:pwa-register'

// 注册service worker并获取更新函数
const updateSW = registerSW({
  onNeedRefresh() {
    // 当有新内容可用时，自动更新并提示用户刷新
    console.log('检测到新版本，正在自动更新...')
    // 自动应用更新
    updateSW()
      .then(() => {
        // 更新成功后提示用户刷新页面以应用更新
        alert('应用已更新到最新版本，请刷新页面以应用更新')
      })
      .catch(err => {
        console.error('更新失败:', err)
      })
  },
  onOfflineReady() {
    // 当应用可以离线工作时
    console.log('应用已准备好离线工作')
  },
})

// 创建Vue应用实例
const app = createApp(App)

// 使用路由和Pinia
app.use(router)
app.use(pinia)

// 挂载应用
app.mount('#app')
