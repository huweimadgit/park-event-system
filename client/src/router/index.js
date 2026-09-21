import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

// PC 路由
const pcRoutes = [
    { path: '/login', component: () => import('../views/pc/Login.vue'), meta: { title: '登录' } },
    { path: '/register', component: () =>  import('../views/pc/Register.vue') },
    { path: '/', redirect: '/list'},
    { path: '/list', component: () => import('../views/pc/EventList.vue'), meta: { requiresAuth: true, title: '事件管理' } },
    { path: '/dashboard', component: () => import('../views/pc/Dashboard.vue'), meta: { requiresAuth: true, adminOnly: true, title: '驾驶舱' }}
]

// 移动端路由
const mobileRoutes = [
   { path: '/m/login', component: () =>  import('../views/mobile/Login.vue') },
   { path: '/m/register', component: () =>  import('../views/mobile/Register.vue') },
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
    const isMobileRoute = to.path.startsWith('/m')
    // 根据是否移动端觉得主页和登录页路径
    const listPath = isMobile ? '/m/list' : '/list'
    const loginPath = isMobile ? '/m/login' : '/login'

    // 第一层：路径前缀与设备不匹配 → 修正到对应端的路径
    if (isMobile && !isMobileRoute) {
        const map = {
        '/': '/m/list',
        '/login': '/m/login',
        '/register': '/m/register',
        '/list': '/m/list'
        }
        return next(map[to.path] || '/m/list')
    }
    // 第二层： 已经登录用户访问登录/注册页 → 直接跳列表
    const authPages = ['/login', '/register', '/m/login', '/m/register']
    if (authPages.includes(to.path) && store.token) {
        return next(listPath)
    }

    // 第三层： 需要鉴权但无 token → 跳登录
    if (to.meta.requiresAuth && !store.token) {
        return next(loginPath)
    }

    // 第四层： 需要管理员单角色不符 → 跳列表
    if (to.meta.adminOnly && store.role !== 'admin') {
        return next(listPath)
    }
    
    next()
})

export default router