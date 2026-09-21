<template>
    <div class="m-page">
        <van-nav-bar title="我的上报" fixed placeholder>
            <template #right>
                <van-button size="small" type="primary" @click="$router.push('/m/create')">上报</van-button>
            </template>
        </van-nav-bar>

        <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
            <van-list 
                v-model:loading="loading" 
                v-model:error="error"
                :finished="finished" 
                finished-text="没有更多了"
                error-text="加载失败，点击重试"
                @load="onLoad">
                <van-cell v-for="item in list" :key="item.id" is-link @click="$router.push(`/m/detail/${item.id}`)">
                    <template #title>
                        <div class="cell-title">
                            <span>{{ item.title }}</span>
                            <van-tag :type="tagType(item.status)">{{ statusLable(item.status) }}</van-tag>
                        </div>
                    </template>
                    <template #label>
                        <div>{{ typeLabel(item.type) }} · {{ item.address || '无地址' }}</div>
                        <div v-if="item.latitude" class="coords">
                            📍 {{ item.latitude.toFixed(4) }}, {{ item.longitude.toFixed(4) }}
                        </div>
                        <div class="time">{{ item.created_at }}</div>
                    </template>
                </van-cell>
            </van-list>
        </van-pull-refresh>

        <van-tabbar>
            <van-tabbar-item to="/m/list" icon="records">上报记录</van-tabbar-item>
            <van-tabbar-item to="/m/create" icon="add-0">新建上报</van-tabbar-item>
        </van-tabbar>
    </div>
</template>

<script setup>
    import { ref } from 'vue'
    import { eventApi } from '../../api'

    const list = ref([])
    const page = ref(1)
    const loading = ref(false)
    const finished = ref(false)
    const refreshing = ref(false)
    const error = ref(false)

    const typeMap = { facility: '设施损坏', environment: '环境卫生', safety: '安全隐患', other: '其他' }
    const statusMap = { pending: '待处理', processing: '处理中', done: '已完成' }
    const typeLabel = t => typeMap[t] || t
    const statusLable = s => statusMap[s] || s
    const tagType = s => ({ pending: 'danger', processing: 'warning' , done: 'success' }[s] || 'default')

    async function onLoad() {
        loading.value = true
        try {
            const data = await eventApi.getList({ page: page.value, size: 10 })
            if (page.value === 1) list.value = []
            list.value.push(...data.list)
            loading.value = false

            if (list.value.length >= data.total) {
                finished.value = true
            } else {
                page.value++
            }
            
        } catch (err) {
            finished.value = true
        } finally {
            loading.value = false
        }
    }

    function onRefresh() {
        page.value = 1
        finished.value = false
        refreshing.value = false
        loading.value = false
        list.value = []
        onRefreshDone()
    }

    async function onRefreshDone() {
        await onLoad()
        refreshing.value = false
    }
</script>

<style scoped>

</style>