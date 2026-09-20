<template>
    <div class="m-page">
        <van-nav-bar title="事件详情" left-arrow @click-left="$router.back()" fixed placeholder></van-nav-bar>

        <div v-if="loading" style="padding:40px; text-align: center">
            <van-loading>加载中...</van-loading>
        </div>

        <div v-else-if="detail" class="content">
            <!-- 状态卡 -->
            <div class="status-bar" :class="detail.status">
                <span class="status-text">{{ statusLabel(detail.status) }}</span>
            </div>

            <!-- 基本信息 -->
            <van-cell-group inset title="基本信息">
                <van-cell title="标题" :value="detail.title"></van-cell>
                <van-cell title="类型" :value="typeLabel(detail.type)"></van-cell>
                <van-cell title="描述" :value="detail.description || '无'"></van-cell>
                <van-cell title="地址" :value="detail.address || '无'"></van-cell>
                <van-cell title="上报人" :value="detail.reporter_name || '-'"></van-cell>
                <van-cell title="上报时间" :value="detail.created_at"></van-cell>
                <van-cell v-if="detail.handler_note" title="处理反馈" :value="detail.handler_note"></van-cell>
            </van-cell-group>

            <!-- 图片 -->
            <van-cell-group inset title="现场照片" v-if="detail.images && detail.images.length">
                <div class="images">
                    <van-image
                        v-for="(img, i) in detail.images"
                        :key="i"
                        :src="img"
                        width="100"
                        height="100"
                        fit="cover"
                        radius="6"
                        @click="previewImage(i)"
                    ></van-image>
                </div>
            </van-cell-group>

            <!-- 地图定位 -->
            <van-cell-group inset title="位置" v-if="detail.latitude && detail.longitude">
                <van-cell>
                    <template #title>
                        <span>坐标: {{ detail.latitude.toFixed(4) }}, {{ detail.longitude.toFixed(4) }}</span>
                    </template>
                </van-cell>
            </van-cell-group>
        </div>

        <van-empty v-else description="事件不存在"></van-empty>
    </div>
</template>

<script setup>
    import { ref, onMounted } from 'vue'
    import { useRoute } from 'vue-router'
    import { showImagePreview, showToast } from 'vant'
    import { eventApi } from '../../api'

    const route = useRoute()
    const detail = ref(null)
    const loading = ref(true)

    const typeMap = { facility: '设施损坏', environment: '环境卫生', safety: '安全隐患', other: '其他' }
    const statusMap = { pending: '待处理', processing: '处理中', done: '已完成' }
    const typeLabel = t => typeMap[t] || t
    const statusLabel = s => statusMap[s] || s

    function previewImage(index) {
        showImagePreview({
            images: detail.value.images,
            startPosition: index
        })
    }

    onMounted(async () => {
        try {
            detail.value = await eventApi.getDetail(route.params.id)
        } catch (err) {
            showToast('加载失败')
        } finally {
            loading.value = false
        }
    })
</script>

<style scoped>
    .m-page {
        padding-bottom: 40px;
        min-height: 100vh;
        background-color: #f7f8fa;
    }
    .status-bar {
        padding: 16px;
        color: #fff;
        font-size: 18px;
        text-align: center;
    }
    .status-bar.pending { background-color: #ee0a24; }
    .status-bar.processing { background-color: #ff976a; }
    .status-bar.done { background-color: #07c160; }
    .content {
        padding-top: 12px;
    }
    .images {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        padding: 12px 16px;
    }
</style>