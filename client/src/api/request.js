import axios from 'axios'
import { useUserStore } from '../stores/user'
import router from '../router'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL 
    ? `${import.meta.env.VITE_API_BASE_URL}/api` 
    : '/api',
  timeout: 15000
})

request.interceptors.request.use(config => {
    const store = useUserStore()
    if (store.token) config.headers.Authorization = `Bearer ${store.token}`
    return config
})

request.interceptors.response.use(
    res => res.data,
    err => {
        if (err.response?.status === 401) {
            const store = useUserStore()
            store.logout()
            const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent)
            router.push(isMobile ? '/m/login' : '/login')
        }
        return Promise.reject(err)
    }
)

export default request