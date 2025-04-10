import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../supabase'

const routes = [
  {
    path: '/',
    redirect: '/habits'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/RegisterView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/habits',
    name: 'Habits',
    component: () => import('../views/HabitsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/habits/new',
    name: 'NewHabit',
    component: () => import('../views/NewHabitView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/ProfileView.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 路由守卫，检查用户是否已登录
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth !== false)
  
  if (requiresAuth) {
    const { data } = await supabase.auth.getSession()
    const isAuthenticated = !!data.session
    
    if (!isAuthenticated) {
      next('/login')
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router