<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

// 生产环境使用 Worker 域名
const API_URL = import.meta.env.PROD ? 'https://ki1.mom' : ''

const form = ref({
  url: '',
  code: ''
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
    const response = await fetch(`${API_URL}/api/shorten`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: form.value.url,
        code: form.value.code || undefined
      })
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || '创建失败')
    }

    const link = await response.json()
    createdLink.value = { code: link.code, original_url: link.original_url }
  } catch (err: any) {
    error.value = err.message || '创建失败'
  } finally {
    loading.value = false
  }
}

function createAnother() {
  form.value = { url: '', code: '' }
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
  <div class="home-page">
    <div class="home-container">
      <!-- Logo 和标题 -->
      <header class="home-header">
        <div class="logo">
          <img src="/favicon.png" alt="Logo" />
        </div>
        <h1>短链服务</h1>
        <p class="subtitle">快速生成短链接，简洁易分享</p>
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
          <div class="link-display">
            <code class="short-url">https://ki1.mom/{{ createdLink.code }}</code>
            <button class="btn btn-primary" @click="copyToClipboard">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <rect x="9" y="9" width="13" height="13" rx="2"/>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
              复制
            </button>
          </div>
          <p class="original-url">原链接: {{ createdLink.original_url }}</p>
        </div>
        <button class="btn btn-secondary" @click="createAnother">继续创建</button>
      </div>

      <!-- 创建表单 -->
      <div v-else class="card create-card">
        <form @submit.prevent="handleSubmit">
          <div class="input-group">
            <input
              v-model="form.url"
              type="url"
              class="input input-lg"
              placeholder="输入需要缩短的链接"
              :disabled="loading"
            />
          </div>

          <div class="input-group">
            <div class="code-input-wrapper">
              <span class="code-prefix">ki1.mom/</span>
              <input
                v-model="form.code"
                type="text"
                class="input"
                placeholder="自定义短码 (可选)"
                :disabled="loading"
                pattern="[a-zA-Z0-9_-]+"
              />
            </div>
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <button type="submit" class="btn btn-primary btn-lg w-full" :disabled="loading">
            <span v-if="loading" class="spinner spinner-sm"></span>
            <span v-else>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              生成短链
            </span>
          </button>
        </form>
      </div>

      <!-- 管理入口 -->
      <div class="admin-link">
        <RouterLink to="/login">管理员登录</RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  position: relative;
  overflow: hidden;
}

.home-container {
  width: 100%;
  max-width: 500px;
  position: relative;
  z-index: 1;
}

/* 背景装饰 */
.home-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
}

.bg-circle-1 {
  width: 400px;
  height: 400px;
  background: var(--primary);
  top: -100px;
  right: -100px;
}

.bg-circle-2 {
  width: 300px;
  height: 300px;
  background: var(--secondary);
  bottom: -50px;
  left: -50px;
}

.bg-circle-3 {
  width: 200px;
  height: 200px;
  background: var(--success);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* 头部 */
.home-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo {
  width: 100px;
  height: 100px;
  margin: 0 auto 1.5rem;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(244, 114, 182, 0.4);
}

.logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.home-header h1 {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 1rem;
}

/* 创建卡片 */
.create-card {
  padding: 2rem;
}

.create-card form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.input-lg {
  padding: 1rem 1.25rem;
  font-size: 1rem;
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

.code-input-wrapper .input {
  border-radius: 0 var(--radius) var(--radius) 0;
}

.error-message {
  padding: 0.75rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius);
  color: var(--danger);
  font-size: 0.875rem;
  text-align: center;
}

/* 成功状态 */
.success-card {
  text-align: center;
  padding: 2rem;
}

.success-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 1rem;
  padding: 1rem;
  background: rgba(16, 185, 129, 0.2);
  border-radius: 50%;
  color: var(--success);
}

.success-icon svg {
  width: 100%;
  height: 100%;
}

.success-card h2 {
  font-size: 1.25rem;
  margin-bottom: 1.5rem;
}

.created-link {
  margin-bottom: 1.5rem;
}

.link-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--bg-tertiary);
  border-radius: var(--radius);
  margin-bottom: 0.75rem;
}

.short-url {
  font-family: 'Fira Code', monospace;
  font-size: 1rem;
  color: var(--primary);
  word-break: break-all;
}

.original-url {
  font-size: 0.75rem;
  color: var(--text-muted);
  word-break: break-all;
}

/* 管理入口 */
.admin-link {
  text-align: center;
  margin-top: 2rem;
}

.admin-link a {
  font-size: 0.875rem;
  color: var(--text-muted);
}

.admin-link a:hover {
  color: var(--primary);
}

.spinner-sm {
  width: 1.25rem;
  height: 1.25rem;
  border-width: 2px;
}

@media (max-width: 480px) {
  .home-header h1 {
    font-size: 1.5rem;
  }

  .link-display {
    flex-direction: column;
  }
}
</style>
