<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  if (!username.value || !password.value) {
    error.value = '请输入用户名和密码'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await authStore.login(username.value, password.value)
    router.push('/')
  } catch (err: any) {
    error.value = err.response?.data?.error || '登录失败，请检查用户名和密码'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-container">
      <!-- 背景装饰 -->
      <div class="login-bg">
        <div class="bg-circle bg-circle-1"></div>
        <div class="bg-circle bg-circle-2"></div>
        <div class="bg-circle bg-circle-3"></div>
      </div>

      <!-- 登录卡片 -->
      <div class="login-card">
        <div class="login-header">
          <div class="logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          </div>
          <h1>短链管理后台</h1>
          <p class="text-muted">登录以管理您的短链接</p>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="input-group">
            <label for="username">用户名</label>
            <input
              id="username"
              v-model="username"
              type="text"
              class="input"
              placeholder="请输入用户名"
              :disabled="loading"
            />
          </div>

          <div class="input-group">
            <label for="password">密码</label>
            <input
              id="password"
              v-model="password"
              type="password"
              class="input"
              placeholder="请输入密码"
              :disabled="loading"
            />
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <button type="submit" class="btn btn-primary btn-lg w-full" :disabled="loading">
            <span v-if="loading" class="spinner spinner-sm"></span>
            <span v-else>登录</span>
          </button>
        </form>

        <div class="login-footer">
          <p>短链域名: <code>ki1.mom</code></p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  position: relative;
  overflow: hidden;
}

.login-container {
  width: 100%;
  max-width: 420px;
  position: relative;
  z-index: 1;
}

/* 背景装饰 */
.login-bg {
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

/* 登录卡片 */
.login-card {
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: 2.5rem;
  box-shadow: var(--shadow-lg);
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo {
  width: 64px;
  height: 64px;
  margin: 0 auto 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  border-radius: var(--radius-lg);
  color: white;
}

.logo svg {
  width: 100%;
  height: 100%;
}

.login-header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
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

.spinner-sm {
  width: 1.25rem;
  height: 1.25rem;
  border-width: 2px;
}

.login-footer {
  margin-top: 2rem;
  text-align: center;
  font-size: 0.875rem;
  color: var(--text-muted);
}

.login-footer code {
  padding: 0.25rem 0.5rem;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  font-family: 'Fira Code', monospace;
  color: var(--primary);
}
</style>
