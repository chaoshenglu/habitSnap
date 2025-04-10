<template>
  <div class="profile-page">
    <div class="navbar">
      <router-link to="/habits" class="back-btn">
        <span class="material-icons">arrow_back</span>
      </router-link>
      <h1 class="navbar-title">个人资料</h1>
    </div>
    
    <div class="container">
      <div class="card profile-card">
        <div class="profile-header">
          <div class="profile-avatar">
            <span class="material-icons">account_circle</span>
          </div>
          <h2 class="profile-email">{{ authStore.user?.email }}</h2>
        </div>
      </div>

      <!-- 添加习惯评分折线图 -->
      <div class="card chart-card">
        <h3 class="chart-title">习惯评分趋势</h3>
        <div class="chart-container">
          <Line v-if="chartData" :data="filteredChartData" :options="chartOptions" />
          <div v-else class="chart-loading">加载中...</div>
        </div>
      </div>

      <div class="profile-stats">
          <div 
            class="stat-item" 
            :class="{ active: selectedType === 'all' }"
            @click="selectedType = 'all'"
          >
            <span class="stat-value">{{ habitsStore.habits.length }}</span>
            <span class="stat-label">全部</span>
          </div>
          <div 
            class="stat-item" 
            :class="{ active: selectedType === 'sleep' }"
            @click="selectedType = 'sleep'"
          >
            <span class="stat-value">{{ habitsStore.habitsByType.sleep.length }}</span>
            <span class="stat-label">睡眠</span>
          </div>
          <div 
            class="stat-item" 
            :class="{ active: selectedType === 'diet' }"
            @click="selectedType = 'diet'"
          >
            <span class="stat-value">{{ habitsStore.habitsByType.diet.length }}</span>
            <span class="stat-label">饮食</span>
          </div>
          <div 
            class="stat-item" 
            :class="{ active: selectedType === 'exercise' }"
            @click="selectedType = 'exercise'"
          >
            <span class="stat-value">{{ habitsStore.habitsByType.exercise.length }}</span>
            <span class="stat-label">锻炼</span>
          </div>
          <div 
            class="stat-item" 
            :class="{ active: selectedType === 'meditation' }"
            @click="selectedType = 'meditation'"
          >
            <span class="stat-value">{{ habitsStore.habitsByType.meditation.length }}</span>
            <span class="stat-label">冥想</span>
          </div>
        </div>
      
      <button class="btn w-100 mt-3" style="background-color: var(--primary-color);color: white;" @click="handleLogout">
        退出登录
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useHabitsStore } from '../stores/habits'
// Fix the import statement
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'

// 注册 Chart.js 组件
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const router = useRouter()
const authStore = useAuthStore()
const habitsStore = useHabitsStore()
const chartData = ref(null)
const selectedType = ref('all') // 默认选择全部

// 根据选择的类型过滤图表数据
const filteredChartData = computed(() => {
  if (!chartData.value) return null
  
  // 如果选择全部，返回完整数据
  if (selectedType.value === 'all') {
    return chartData.value
  }
  
  // 否则只返回选中类型的数据
  const filteredData = {
    labels: chartData.value.labels,
    datasets: chartData.value.datasets.filter(dataset => {
      // 根据标签匹配类型
      const typeMap = {
        '睡眠': 'sleep',
        '饮食': 'diet',
        '锻炼': 'exercise',
        '冥想': 'meditation'
      }
      
      // 查找与选中类型匹配的数据集
      return Object.entries(typeMap).some(([label, type]) => {
        return dataset.label === label && type === selectedType.value
      })
    })
  }
  
  return filteredData
})

// 图表配置
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      max: 5,
      ticks: {
        stepSize: 1
      }
    }
  },
  plugins: {
    legend: {
      position: 'bottom'
    }
  }
}

// 准备图表数据
function prepareChartData() {
  // 获取最近7天的数据
  const now = new Date()
  const dates = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    dates.push(date.toISOString().split('T')[0])
  }
  
  // 按日期和类型分组习惯数据
  const habitsByDateAndType = {}
  
  // 初始化数据结构
  dates.forEach(date => {
    habitsByDateAndType[date] = {
      sleep: [],
      diet: [],
      exercise: [],
      meditation: []
    }
  })
  
  // 填充数据
  habitsStore.habits.forEach(habit => {
    const habitDate = habit.habit_date.split('T')[0]
    if (dates.includes(habitDate) && habitsByDateAndType[habitDate][habit.type]) {
      habitsByDateAndType[habitDate][habit.type].push(habit)
    }
  })
  
  // 计算每天每种类型的平均评分
  const sleepScores = []
  const dietScores = []
  const exerciseScores = []
  const meditationScores = []
  
  dates.forEach(date => {
    const dayData = habitsByDateAndType[date]
    
    sleepScores.push(calculateAvgScore(dayData.sleep))
    dietScores.push(calculateAvgScore(dayData.diet))
    exerciseScores.push(calculateAvgScore(dayData.exercise))
    meditationScores.push(calculateAvgScore(dayData.meditation))
  })
  
  // 格式化日期标签
  const labels = dates.map(date => {
    const d = new Date(date)
    return `${d.getMonth() + 1}/${d.getDate()}`
  })
  
  // 返回图表数据
  return {
    labels,
    datasets: [
      {
        label: '睡眠',
        data: sleepScores,
        borderColor: '#4361ee',
        backgroundColor: 'rgba(67, 97, 238, 0.2)',
        tension: 0.3
      },
      {
        label: '饮食',
        data: dietScores,
        borderColor: '#f72585',
        backgroundColor: 'rgba(247, 37, 133, 0.2)',
        tension: 0.3
      },
      {
        label: '锻炼',
        data: exerciseScores,
        borderColor: '#4cc9f0',
        backgroundColor: 'rgba(76, 201, 240, 0.2)',
        tension: 0.3
      },
      {
        label: '冥想',
        data: meditationScores,
        borderColor: '#4d908e',
        backgroundColor: 'rgba(77, 144, 142, 0.2)',
        tension: 0.3
      }
    ]
  }
}

// 计算平均评分
function calculateAvgScore(habits) {
  if (habits.length === 0) return null
  const sum = habits.reduce((acc, habit) => acc + habit.score, 0)
  return sum / habits.length
}

onMounted(async () => {
  // 确保用户已登录
  if (!authStore.isAuthenticated) {
    await authStore.initialize()
    if (!authStore.isAuthenticated) {
      router.push('/login')
      return
    }
  }
  
  // 加载习惯数据（如果尚未加载）
  if (habitsStore.habits.length === 0) {
    await habitsStore.fetchHabits()
  }
  
  // 准备图表数据
  chartData.value = prepareChartData()
})

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
}

.navbar {
  display: flex;
  align-items: center;
  padding: 16px;
}

.back-btn {
  margin-right: 16px;
  color: var(--text-color);
  text-decoration: none;
}

.navbar-title {
  font-size: 1.25rem;
  margin: 0;
}

.profile-card {
  margin-top: 16px;
}

.profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
}

.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: var(--light-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.profile-avatar .material-icons {
  font-size: 48px;
  color: #666;
}

.profile-email {
  font-size: 1.25rem;
  margin: 0;
  word-break: break-all;
}

/* 图表样式 */
.chart-card {
  margin: 16px 0;
  padding: 16px;
}

.chart-title {
  font-size: 1.1rem;
  margin-top: 0;
  margin-bottom: 16px;
  text-align: center;
}

.chart-container {
  height: 250px;
  position: relative;
}

.chart-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
}

.profile-stats {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  border-radius: var(--border-radius);
  background-color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.stat-item:hover {
  background-color: var(--light-bg);
}

.stat-item.active {
  background-color: var(--primary-color);
  color: white;
}

.stat-item.active .stat-label {
  color: rgba(255, 255, 255, 0.8);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.875rem;
  color: #666;
}

.w-100 {
  width: 100%;
}
</style>