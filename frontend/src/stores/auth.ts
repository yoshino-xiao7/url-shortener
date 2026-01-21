import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as apiLogin } from '@/api'

export const useAuthStore = defineStore('auth', () => {
    const token = ref<string | null>(localStorage.getItem('token'))
    const username = ref<string | null>(localStorage.getItem('username'))

    const isAuthenticated = computed(() => !!token.value)

    async function login(usernameInput: string, password: string) {
        const response = await apiLogin(usernameInput, password)
        token.value = response.token
        username.value = response.username
        localStorage.setItem('token', response.token)
        localStorage.setItem('username', response.username)
    }

    function logout() {
        token.value = null
        username.value = null
        localStorage.removeItem('token')
        localStorage.removeItem('username')
    }

    return {
        token,
        username,
        isAuthenticated,
        login,
        logout
    }
})
