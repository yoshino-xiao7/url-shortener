<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { createLink } from '@/api'

const router = useRouter()

const form = ref({
  url: '',
  code: '',
  title: '',
  expires_at: ''
})

const loading = ref(false)
const error = ref('')
const createdLink = ref<{ code: string; original_url: string } | null>(null)

async function handleSubmit() {
  if (!form.value.url) {
    error.value = '请输入目标 URL'
    return
  }

  // 验证 URL 格式
  try {
    new URL(form.value.url)
  } catch {
    error.value = '请输入有效的 URL'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const link = await createLink({
      url: form.value.url,
      code: form.value.code || undefined,
      title: form.value.title || undefined,
      expires_at: form.value.expires_at || undefined
    })

    createdLink.value = { code: link.code, original_url: link.original_url }
  } catch (err: any) {
    error.value = err.response?.data?.error || '创建失败'
  } finally {
    loading.value = false
  }
}

function createAnother() {
  form.value = { url: '', code: '', title: '', expires_at: '' }
  createdLink.value = null
}

function copyToClipboard() {
  if (createdLink.value) {
    navigator.clipboard.writeText(`https://ki1.mom/${createdLink.value.code}`)
    alert('已复制到剪贴板')
  }
}
</script>

<template>
  <div class="create-page">
    <header class="page-header">
      <h1>创建短链</h1>
    </header>

    <!-- 创建成功 -->
    <div v-if="createdLink" class="card success-card">
      <div class="success-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9 12l2 2 4-4"/>
        </svg>
      </div>
      <h2>创建成功！</h2>
      <div class="created-link">
        <div class="link-box">
          <span class="link-label">短链接</span>
          <code class="link-url">https://ki1.mom/{{ createdLink.code }}</code>
          <button class="btn btn-primary btn-sm" @click="copyToClipboard">
            复制
          </button>
        </div>
        <div class="link-box mt-4">
          <span class="link-label">原始链接</span>
          <a 
            :href="createdLink.original_url" 
            target="_blank"
            class="original-url"
          >
            {{ createdLink.original_url }}
          </a>
        </div>
      </div>
      <div class="success-actions">
        <button class="btn btn-primary" @click="createAnother">
          继续创建
        </button>
        <button class="btn btn-secondary" @click="router.push('/links')">
          查看全部
        </button>
      </div>
    </div>

    <!-- 创建表单 -->
    <div v-else class="card">
      <form @submit.prevent="handleSubmit" class="create-form">
        <div class="input-group">
          <label for="url">目标 URL <span class="required">*</span></label>
          <input
            id="url"
            v-model="form.url"
            type="url"
            class="input"
            placeholder="https://example.com/your-long-url"
            :disabled="loading"
          />
        </div>

        <div class="input-group">
          <label for="code">
            自定义短码
            <span class="optional">(可选，留空自动生成)</span>
          </label>
          <div class="code-input-wrapper">
            <span class="code-prefix">ki1.mom/</span>
            <input
              id="code"
              v-model="form.code"
              type="text"
              class="input code-input"
              placeholder="custom-code"
              :disabled="loading"
              pattern="[a-zA-Z0-9_-]+"
            />
          </div>
        </div>

        <div class="input-group">
          <label for="title">
            链接标题
            <span class="optional">(可选)</span>
          </label>
          <input
            id="title"
            v-model="form.title"
            type="text"
            class="input"
            placeholder="给链接起个名字方便识别"
            :disabled="loading"
          />
        </div>

        <div class="input-group">
          <label for="expires">
            过期时间
            <span class="optional">(可选，留空永不过期)</span>
          </label>
          <input
            id="expires"
            v-model="form.expires_at"
            type="datetime-local"
            class="input"
            :disabled="loading"
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button type="submit" class="btn btn-primary btn-lg" :disabled="loading">
          <span v-if="loading" class="spinner spinner-sm"></span>
          <span v-else>创建短链</span>
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
}

.create-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 600px;
}

.required {
  color: var(--danger);
}

.optional {
  font-weight: 400;
  color: var(--text-muted);
  font-size: 0.75rem;
}

.code-input-wrapper {
  display: flex;
  align-items: center;
}

.code-prefix {
  padding: 0.75rem 1rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-right: none;
  border-radius: var(--radius) 0 0 var(--radius);
  color: var(--text-muted);
  font-family: 'Fira Code', monospace;
  font-size: 0.875rem;
}

.code-input {
  border-radius: 0 var(--radius) var(--radius) 0;
}

.error-message {
  padding: 0.75rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius);
  color: var(--danger);
  font-size: 0.875rem;
}

.spinner-sm {
  width: 1.25rem;
  height: 1.25rem;
  border-width: 2px;
}

/* 成功状态 */
.success-card {
  text-align: center;
  max-width: 500px;
  margin: 0 auto;
}

.success-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  padding: 1.25rem;
  background: rgba(16, 185, 129, 0.2);
  border-radius: 50%;
  color: var(--success);
}

.success-icon svg {
  width: 100%;
  height: 100%;
}

.success-card h2 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
}

.created-link {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--bg-tertiary);
  border-radius: var(--radius);
}

.link-box {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.link-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: var(--text-muted);
  min-width: 60px;
}

.link-url {
  flex: 1;
  font-family: 'Fira Code', monospace;
  font-size: 1rem;
  color: var(--primary);
  word-break: break-all;
}

.original-url {
  flex: 1;
  font-size: 0.875rem;
  color: var(--text-secondary);
  word-break: break-all;
}

.success-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

@media (max-width: 768px) {
  .success-actions {
    flex-direction: column;
  }
}
</style>
