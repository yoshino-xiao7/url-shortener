<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getLinkStats, type LinkStats } from '@/api'

const route = useRoute()
const router = useRouter()

const code = computed(() => route.params.code as string)
const stats = ref<LinkStats | null>(null)
const loading = ref(true)
const error = ref('')
const days = ref(7)

async function loadStats() {
  loading.value = true
  error.value = ''
  
  try {
    stats.value = await getLinkStats(code.value, days.value)
  } catch (err: any) {
    error.value = err.response?.data?.error || '加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(loadStats)

function copyToClipboard() {
  navigator.clipboard.writeText(`https://ki1.mom/${code.value}`)
  alert('已复制到剪贴板')
}

// 简单的柱状图计算
function getBarHeight(count: number): string {
  if (!stats.value || stats.value.visitsByDay.length === 0) return '0%'
  const max = Math.max(...stats.value.visitsByDay.map(d => d.count))
  if (max === 0) return '0%'
  return `${(count / max) * 100}%`
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}
</script>

<template>
  <div class="stats-page">
    <header class="page-header">
      <div>
        <button class="btn btn-ghost" @click="router.back()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          返回
        </button>
        <h1>链接统计</h1>
      </div>
    </header>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="card">
      <div class="empty-state">
        <p>{{ error }}</p>
        <button class="btn btn-secondary" @click="router.push('/links')">返回列表</button>
      </div>
    </div>

    <!-- 统计内容 -->
    <template v-else-if="stats">
      <!-- 链接信息 -->
      <div class="card link-info-card">
        <div class="link-info">
          <div class="link-main">
            <code class="short-code">{{ code }}</code>
            <button class="btn btn-ghost btn-sm" @click="copyToClipboard">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <rect x="9" y="9" width="13" height="13" rx="2"/>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
              复制
            </button>
          </div>
          <a 
            :href="stats.link.original_url" 
            target="_blank"
            class="original-url"
          >
            {{ stats.link.original_url }}
          </a>
          <div v-if="stats.link.title" class="link-title text-muted">
            {{ stats.link.title }}
          </div>
        </div>
        <div class="total-visits stat-card">
          <div class="stat-value">{{ stats.totalVisits }}</div>
          <div class="stat-label">总访问量</div>
        </div>
      </div>

      <!-- 时间筛选 -->
      <div class="time-filter">
        <button 
          v-for="d in [7, 14, 30]" 
          :key="d"
          class="btn btn-sm"
          :class="days === d ? 'btn-primary' : 'btn-secondary'"
          @click="days = d; loadStats()"
        >
          {{ d }} 天
        </button>
      </div>

      <!-- 访问趋势 -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">访问趋势</h2>
        </div>
        
        <div v-if="stats.visitsByDay.length === 0" class="empty-state">
          <p>暂无访问数据</p>
        </div>
        
        <div v-else class="chart-container">
          <div class="bar-chart">
            <div 
              v-for="item in stats.visitsByDay" 
              :key="item.date"
              class="bar-item"
            >
              <div class="bar-wrapper">
                <div 
                  class="bar" 
                  :style="{ height: getBarHeight(item.count) }"
                  :title="`${item.date}: ${item.count} 次访问`"
                >
                  <span class="bar-value">{{ item.count }}</span>
                </div>
              </div>
              <span class="bar-label">{{ formatDate(item.date) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 来源和地区 -->
      <div class="stats-grid">
        <!-- 来源分析 -->
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">来源分析</h2>
          </div>
          <div v-if="stats.topReferers.length === 0" class="empty-state">
            <p class="text-sm">暂无来源数据</p>
          </div>
          <ul v-else class="stats-list">
            <li v-for="item in stats.topReferers" :key="item.referer">
              <span class="stats-list-label truncate" :title="item.referer">
                {{ item.referer || '直接访问' }}
              </span>
              <span class="stats-list-value">{{ item.count }}</span>
            </li>
          </ul>
        </div>

        <!-- 地区分布 -->
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">地区分布</h2>
          </div>
          <div v-if="stats.topCountries.length === 0" class="empty-state">
            <p class="text-sm">暂无地区数据</p>
          </div>
          <ul v-else class="stats-list">
            <li v-for="item in stats.topCountries" :key="item.country">
              <span class="stats-list-label">{{ item.country || '未知' }}</span>
              <span class="stats-list-value">{{ item.count }}</span>
            </li>
          </ul>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  margin-top: 0.5rem;
}

.link-info-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.link-info {
  flex: 1;
  min-width: 0;
}

.link-main {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.short-code {
  font-family: 'Fira Code', monospace;
  font-size: 1.25rem;
  padding: 0.5rem 1rem;
  background: var(--primary-light);
  color: var(--primary);
  border-radius: var(--radius);
}

.original-url {
  display: block;
  font-size: 0.875rem;
  color: var(--text-secondary);
  word-break: break-all;
  margin-bottom: 0.5rem;
}

.original-url:hover {
  color: var(--primary);
}

.link-title {
  font-size: 0.875rem;
}

.total-visits {
  flex-shrink: 0;
  min-width: 140px;
  text-align: center;
}

.time-filter {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

/* 柱状图 */
.chart-container {
  padding: 1rem 0;
}

.bar-chart {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  height: 200px;
  padding-bottom: 2rem;
}

.bar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.bar-wrapper {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.bar {
  width: 80%;
  max-width: 40px;
  background: linear-gradient(180deg, var(--primary) 0%, var(--secondary) 100%);
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  min-height: 4px;
  position: relative;
  transition: height 0.3s ease;
}

.bar-value {
  position: absolute;
  top: -1.5rem;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-primary);
}

.bar-label {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* 统计列表 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.stats-list {
  list-style: none;
}

.stats-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border-color);
}

.stats-list li:last-child {
  border-bottom: none;
}

.stats-list-label {
  flex: 1;
  min-width: 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.stats-list-value {
  font-weight: 600;
  color: var(--primary);
}

@media (max-width: 768px) {
  .link-info-card {
    flex-direction: column;
  }

  .total-visits {
    width: 100%;
  }

  .bar-chart {
    overflow-x: auto;
    padding-bottom: 3rem;
  }

  .bar-item {
    min-width: 40px;
  }
}
</style>
