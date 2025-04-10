import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { pinia } from './stores'

// 创建Vue应用实例
const app = createApp(App)

// 使用路由和Pinia
app.use(router)
app.use(pinia)

// 挂载应用
app.mount('#app')
