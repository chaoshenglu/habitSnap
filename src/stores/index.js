import { createPinia } from 'pinia'

export const pinia = createPinia()

// 导出所有存储，方便在其他地方导入
export { useAuthStore } from './auth'
export { useHabitsStore } from './habits'