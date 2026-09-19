import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

// PC 路由
const pcRoutes = [
    { path: '/login', component: () => import('../views/pc/Login.vue'), meta: { title: '登录' } },
    { path: '/', redirect: '/events'},
    { path: '/evnets', component: () => import('../views/pc/EventList.vue'), meta: { requiresAuth: true, title: '事件管理' } },
    { path: '/dashboard', component: () => import('../views/pc/Dashboard.vue'), meta: { requiresAuth: true, adminOnly: true, title: '驾驶舱' }}
]

// 移动端路由
const mobileRoutes = [
   { path: '/m/login', component: () =>  import('../views/mobile/Login.vue') },
   { path: '/m', redirect: '/m/list' },
   { path: '/m/list', component: () => import('../views/mobile/EventList.vue'), meta: { requiresAuth: true } },
   { path: '/m/create', component: () => import('../views/mobile/EventCreate.vue'), meta: { requiresAuth: true } },
   { path: '/m/detail/:id', component: () => import('../views/mobile/EventDetail.vue'), meta: { requiresAuth: true } }
]

const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
const routes = isMobile ? mobileRoutes : pcRoutes

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to, from, next) => {
    const store = useUserStore()
    if(to.meta.requiresAuth && !store.token) {
        next(isMobile ? '/m/login' : '/login')
    } else if(to.meta.adminOnly && store.role !== 'admin') {
        next('/events')
    } else {
        next()
    }
})

export default router