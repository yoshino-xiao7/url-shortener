<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { getStatsOverview, type StatsOverview } from '@/api'

const stats = ref<StatsOverview | null>(null)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    stats.value = await getStatsOverview()
  } catch (err: any) {
    error.value = err.message || '加载失败'
  } finally {
    loading.value = false
  }
})

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function reload() {
  window.location.reload()
}
</script>

<template>
  <div class="dashboard">
    <header class="page-header">
      <h1>仪表盘</h1>
      <RouterLink to="/create" class="btn btn-primary">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v8M8 12h8"/>
        </svg>
        创建短链
      </RouterLink>
    </header>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="card">
      <div class="empty-state">
        <p>{{ error }}</p>
        <button class="btn btn-secondary" @click="reload()">重试</button>
      </div>
    </div>

    <!-- 统计数据 -->
    <template v-else-if="stats">
      <!-- 统计卡片 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ stats.totalLinks }}</div>
          <div class="stat-label">总链接数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.totalVisits }}</div>
          <div class="stat-label">总访问量</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.todayVisits }}</div>
          <div class="stat-label">今日访问</div>
        </div>
      </div>

      <!-- 最近创建的链接 -->
      <div class="card mt-6">
        <div class="card-header">
          <h2 class="card-title">最近创建</h2>
          <RouterLink to="/links" class="btn btn-ghost btn-sm">
            查看全部
          </RouterLink>
        </div>

        <div v-if="stats.recentLinks.length === 0" class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
          <p>暂无短链，点击上方按钮创建</p>
        </div>

        <div v-else class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>短码</th>
                <th>原始链接</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="link in stats.recentLinks" :key="link.id">
                <td>
                  <a 
                    :href="`https://ki1.mom/${link.code}`" 
                    target="_blank"
                    class="short-link"
                  >
                    {{ link.code }}
                  </a>
                </td>
                <td>
                  <div class="original-url truncate" :title="link.original_url">
                    {{ link.original_url }}
                  </div>
                </td>
                <td class="text-muted text-sm">
                  {{ formatDate(link.created_at) }}
                </td>
                <td>
                  <RouterLink :to="`/stats/${link.code}`" class="btn btn-ghost btn-sm">
                    统计
                  </RouterLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.short-link {
  font-family: 'Fira Code', monospace;
  font-weight: 500;
  color: var(--primary);
}

.original-url {
  max-width: 300px;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .original-url {
    max-width: 150px;
  }
}
</style>
