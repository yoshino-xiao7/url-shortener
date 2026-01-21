<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { getLinks, deleteLink, updateLink, type Link, type Pagination } from '@/api'

const links = ref<Link[]>([])
const pagination = ref<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 })
const loading = ref(true)
const search = ref('')
const searchTimeout = ref<number | null>(null)
const deleteConfirm = ref<string | null>(null)

async function loadLinks(page = 1) {
  loading.value = true
  try {
    const response = await getLinks(page, 20, search.value)
    links.value = response.data
    pagination.value = response.pagination
  } catch (err) {
    console.error('Failed to load links:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => loadLinks())

// 搜索防抖
watch(search, () => {
  if (searchTimeout.value) clearTimeout(searchTimeout.value)
  searchTimeout.value = window.setTimeout(() => {
    loadLinks(1)
  }, 300)
})

async function handleToggleActive(link: Link) {
  try {
    await updateLink(link.code, { is_active: !link.is_active })
    link.is_active = link.is_active ? 0 : 1
  } catch (err) {
    console.error('Failed to update link:', err)
  }
}

async function handleDelete(code: string) {
  if (deleteConfirm.value !== code) {
    deleteConfirm.value = code
    setTimeout(() => { deleteConfirm.value = null }, 3000)
    return
  }

  try {
    await deleteLink(code)
    links.value = links.value.filter(l => l.code !== code)
    pagination.value.total--
    deleteConfirm.value = null
  } catch (err) {
    console.error('Failed to delete link:', err)
  }
}

function copyToClipboard(code: string) {
  navigator.clipboard.writeText(`https://ki1.mom/${code}`)
  // 简单的提示
  alert('已复制到剪贴板')
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<template>
  <div class="links-page">
    <header class="page-header">
      <h1>链接管理</h1>
      <RouterLink to="/admin/create" class="btn btn-primary">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v8M8 12h8"/>
        </svg>
        创建短链
      </RouterLink>
    </header>

    <!-- 搜索框 -->
    <div class="search-bar">
      <input
        v-model="search"
        type="text"
        class="input"
        placeholder="搜索短码、链接或标题..."
      />
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <!-- 链接列表 -->
    <div v-else class="card">
      <div v-if="links.length === 0" class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
        <p v-if="search">未找到匹配的链接</p>
        <p v-else>暂无短链</p>
      </div>

      <div v-else class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>短码</th>
              <th>原始链接</th>
              <th>标题</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="link in links" :key="link.id">
              <td>
                <div class="flex items-center gap-2">
                  <code class="short-code">{{ link.code }}</code>
                  <button 
                    class="btn-icon" 
                    @click="copyToClipboard(link.code)"
                    title="复制链接"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                      <rect x="9" y="9" width="13" height="13" rx="2"/>
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                    </svg>
                  </button>
                </div>
              </td>
              <td>
                <a 
                  :href="link.original_url" 
                  target="_blank"
                  class="original-url truncate"
                  :title="link.original_url"
                >
                  {{ link.original_url }}
                </a>
              </td>
              <td class="text-muted">
                {{ link.title || '-' }}
              </td>
              <td>
                <span 
                  class="badge"
                  :class="link.is_active ? 'badge-success' : 'badge-danger'"
                >
                  {{ link.is_active ? '启用' : '禁用' }}
                </span>
              </td>
              <td class="text-muted text-sm">
                {{ formatDate(link.created_at) }}
              </td>
              <td>
                <div class="actions">
                  <RouterLink :to="`/admin/stats/${link.code}`" class="btn btn-ghost btn-sm">
                    统计
                  </RouterLink>
                  <button 
                    class="btn btn-ghost btn-sm"
                    @click="handleToggleActive(link)"
                  >
                    {{ link.is_active ? '禁用' : '启用' }}
                  </button>
                  <button 
                    class="btn btn-sm"
                    :class="deleteConfirm === link.code ? 'btn-danger' : 'btn-ghost'"
                    @click="handleDelete(link.code)"
                  >
                    {{ deleteConfirm === link.code ? '确认删除' : '删除' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页 -->
      <div v-if="pagination.totalPages > 1" class="pagination">
        <button 
          class="pagination-btn"
          :disabled="pagination.page === 1"
          @click="loadLinks(pagination.page - 1)"
        >
          上一页
        </button>
        <span class="pagination-info">
          {{ pagination.page }} / {{ pagination.totalPages }}
        </span>
        <button 
          class="pagination-btn"
          :disabled="pagination.page === pagination.totalPages"
          @click="loadLinks(pagination.page + 1)"
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
}

.search-bar {
  margin-bottom: 1.5rem;
}

.search-bar .input {
  width: 100%;
  max-width: 400px;
}

.short-code {
  font-family: 'Fira Code', monospace;
  font-size: 0.875rem;
  padding: 0.25rem 0.5rem;
  background: var(--primary-light);
  color: var(--primary);
  border-radius: var(--radius-sm);
}

.btn-icon {
  padding: 0.375rem;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: var(--transition);
}

.btn-icon:hover {
  background: var(--primary-light);
  color: var(--primary);
}

.original-url {
  display: block;
  max-width: 250px;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.original-url:hover {
  color: var(--primary);
}

.actions {
  display: flex;
  gap: 0.25rem;
}

.pagination-info {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  color: var(--text-muted);
}

@media (max-width: 1024px) {
  .original-url {
    max-width: 150px;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .search-bar .input {
    max-width: 100%;
  }

  .table th:nth-child(3),
  .table td:nth-child(3) {
    display: none;
  }

  .actions {
    flex-direction: column;
  }
}
</style>
