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
    // 判断是否登录或者注册（包括 /login, /register, /m/login, /m/reister）
    const isAuthPage = to.path.includes('/login') || to.path.includes('/register')
    // 根据是否移动端觉得主页和登录页路径
    const homePath = isMobile ? '/m/list' : '/list'
    const loginPath = isMobile ? '/m/login' : '/login'

    if (isAuthPage){
        if(store.token){
            next({
				path: homePath
			})
			return false
        }
        next()
        return 
    } 

    if (!store.token) {
        next({ path: loginPath })
        return
    }
    
    if(to.meta.adminOnly && store.role !== 'admin') {
        next({ path: homePath })
    }
    
    next()
})

export default router