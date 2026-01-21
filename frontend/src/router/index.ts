import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/login',
            name: 'login',
            component: () => import('@/pages/Login.vue'),
            meta: { requiresAuth: false }
        },
        {
            path: '/',
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

    if (to.meta.requiresAuth !== false && !authStore.isAuthenticated) {
        next('/login')
    } else if (to.path === '/login' && authStore.isAuthenticated) {
        next('/')
    } else {
        next()
    }
})

export default router
