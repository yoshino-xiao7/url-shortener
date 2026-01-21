import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        // 公开首页 - 创建短链
        {
            path: '/',
            name: 'home',
            component: () => import('@/pages/Home.vue'),
            meta: { requiresAuth: false }
        },
        // 登录页面
        {
            path: '/login',
            name: 'login',
            component: () => import('@/pages/Login.vue'),
            meta: { requiresAuth: false }
        },
        // 管理后台
        {
            path: '/admin',
            component: () => import('@/layouts/MainLayout.vue'),
            meta: { requiresAuth: true },
            children: [
                {
                    path: '',
                    name: 'dashboard',
                    component: () => import('@/pages/Dashboard.vue')
                },
                {
                    path: 'links',
                    name: 'links',
                    component: () => import('@/pages/Links.vue')
                },
                {
                    path: 'create',
                    name: 'create',
                    component: () => import('@/pages/CreateLink.vue')
                },
                {
                    path: 'stats/:code',
                    name: 'stats',
                    component: () => import('@/pages/Stats.vue')
                }
            ]
        }
    ]
})

router.beforeEach((to, _from, next) => {
    const authStore = useAuthStore()

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        next('/login')
    } else if (to.path === '/login' && authStore.isAuthenticated) {
        next('/admin')
    } else {
        next()
    }
})

export default router
