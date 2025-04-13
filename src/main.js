import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { pinia } from './stores'

// 注册service worker
import { registerSW } from 'virtual:pwa-register'

registerSW({
  onNeedRefresh() {
    // 当有新内容可用时，可以显示通知给用户
    console.log('有新内容可用，请刷新')
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
