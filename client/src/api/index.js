import request from './request'

export const authApi = {
    login: (data) => request.post('/auth/login', data),
    register: (data) => request.post('/auth/register', data)
}

export const eventApi = {
    getList: (params) => request.get('/events', { params }),
    getDetail: (id) => request.get(`/events/${id}`),
    create: (data) => request.post('/events', data),
    update: (id, data) => request.put(`/events/${id}`, data),
    changeStatus: (id, data) => request.patch(`/events/${id}/status`, data),
    remove: (id) => request.delete(`/events/${id}`),
    getStats: () => request.get('/events/stats/overview'),
    getMapPoints: () => request.get('/events/map/points')
}

export const uploadApi = {
    uploadImages: (formData) => request.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    })
}