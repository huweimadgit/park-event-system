export function getImageUrl(url) {
    if (!url) return ''
    // 已经是 https 或相对路径，直接返回
    if (url.startsWith('https://') || url.startsWith('/')) return url
    // http 地址走后端代理
    const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
    return  `${baseUrl}/api/proxy-image?url=${encodeURIComponent(url)}`
}