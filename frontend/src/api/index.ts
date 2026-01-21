import axios from 'axios'

// API 基础 URL - 生产环境使用 Worker 域名
const API_BASE_URL = import.meta.env.PROD
    ? 'https://ki1.mom'
    : ''

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
})

// 请求拦截器 - 添加 token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// 响应拦截器 - 处理 401 错误
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token')
            localStorage.removeItem('username')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

// ===== 类型定义 =====

export interface Link {
    id: number
    code: string
    original_url: string
    title: string | null
    created_at: string
    expires_at: string | null
    is_active: number
}

export interface Pagination {
    page: number
    limit: number
    total: number
    totalPages: number
}

export interface LinksResponse {
    data: Link[]
    pagination: Pagination
}

export interface StatsOverview {
    totalLinks: number
    totalVisits: number
    todayVisits: number
    recentLinks: Link[]
}

export interface LinkStats {
    link: Link
    totalVisits: number
    visitsByDay: { date: string; count: number }[]
    topReferers: { referer: string; count: number }[]
    topCountries: { country: string; count: number }[]
}

// ===== API 函数 =====

export async function login(username: string, password: string): Promise<{ token: string; username: string }> {
    const response = await api.post('/api/login', { username, password })
    return response.data
}

export async function getLinks(page = 1, limit = 20, search = ''): Promise<LinksResponse> {
    const response = await api.get('/api/links', { params: { page, limit, search } })
    return response.data
}

export async function getLink(code: string): Promise<Link> {
    const response = await api.get(`/api/links/${code}`)
    return response.data
}

export async function createLink(data: {
    url: string
    code?: string
    title?: string
    expires_at?: string
}): Promise<Link> {
    const response = await api.post('/api/links', data)
    return response.data
}

export async function updateLink(
    code: string,
    data: {
        url?: string
        title?: string
        expires_at?: string | null
        is_active?: boolean
    }
): Promise<Link> {
    const response = await api.put(`/api/links/${code}`, data)
    return response.data
}

export async function deleteLink(code: string): Promise<void> {
    await api.delete(`/api/links/${code}`)
}

export async function getStatsOverview(): Promise<StatsOverview> {
    const response = await api.get('/api/stats/overview')
    return response.data
}

export async function getLinkStats(code: string, days = 7): Promise<LinkStats> {
    const response = await api.get(`/api/stats/${code}`, { params: { days } })
    return response.data
}
