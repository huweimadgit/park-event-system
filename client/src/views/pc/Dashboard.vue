<template>
    <div class="dashboard">
        <div class="header">
            <h2>园区事件驾驶舱</h2>
            <el-button @click="$router.push('/list')">返回列表</el-button>
        </div>

        <!-- 指标卡 -->
        <div class="cards">
            <div class="card" v-for="c in cards" :key="c.label">
                <div class="num">{{ c.value }}</div>
                <div class="label">{{ c.label }}</div>
            </div>
        </div>

        <!-- 图标行 -->
        <div class="charts">
            <div class="chart" ref="trendRef"></div>
            <div class="chart" ref="typeRef"></div>
            <div class="chart" ref="statusRef"></div>
        </div>

        <!-- 地图 -->
        <div class="map-warp">
            <div class="map" ref="mapRef"></div>
        </div>
    </div>
</template>

<script setup>
    import { ref, reactive, onMounted, onBeforeUnmount, nextTick } from 'vue'
    import * as echarts from 'echarts'
    import L from 'leaflet'
    import { eventApi } from '../../api'

    const trendRef = ref(null)
    const typeRef = ref(null)
    const statusRef = ref(null)
    const mapRef = ref(null)
    let trendChart, typeChart, statusChart, map
    const cards = reactive([
        { label: '总事件', value:0 },
        { label: '待处理', value: 0 },
        { label: '今日新增', value: 0 }
    ])

    const typeMap = { facility: '设施损坏', environment: '环境卫生', safety: '安全隐患', other: '其他' }
    const statusMap = { pending: '待处理', processing: '处理中', done: '已完成' }

    onMounted(async () => {
        // 初始化图表
        trendChart = echarts.init(trendRef.value, 'dark')
        typeChart = echarts.init(typeRef.value, 'dark')
        statusChart = echarts.init(statusRef.value, 'dark')

        // 初始化地图
        map = L.map(mapRef.value, { zoomControl: true }).setView([39.9042, 116.4074], 13)
        L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
            subdomains: ['1', '2', '3', '4'],
            attribution: '© 高德地图'
        }).addTo(map)

        // 拉数据
        const [stats, points] = await Promise.all([eventApi.getStats(), eventApi.getMapPoints()])

        cards[0].value = stats.total
        cards[1].value = stats.pending
        cards[2].value = stats.today

        // 趋势折线图
        trendChart.setOption({
            title: { text: '近7天上报趋势', left: 'center', textStyle: { fontSize: 14 } },
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: stats.trend.map(t => t.date.slice(5)) },
            yAxis: { type: 'value', minInterval: 1 },
            series: [{ type: 'line', data: stats.trend.map(t => t.count), smooth: true, areaStyle: {} }]
        })
        // 类型饼图
        typeChart.setOption({
            title: { text: '事件类型分布', left: 'center', textStyle: { fontSize: 14 } },
            tooltip: { trigger: 'item' },
            series: [{ 
                type: 'pie', radius: ['40%', '65%'],
                data: stats.typeDist.map(t => ({ name: typeMap[t.type] || t.type, value: t.count })),
                label: { formatter: '{b}：{c}' }
            }]
        })
        // 状态柱状图
        statusChart.setOption({
            title: { text: '事件状态分布', left: 'center', textStyle: { fontSize: 14 } },
            xAxis: { type: 'category', data: stats.statusDist.map(s => statusMap[s.status] || s.status) },
            yAxis: { type: 'value', minInterval: 1 },
            series: [{ type: 'bar', data: stats.statusDist.map(s => s.count), barWidth: '50%' }]
        })

        // 地图打点
        const colorMap = { pending: '#f56c6c', processing: '#e6a23c', done: '#67c23a' }
        points.forEach(p => {
            L.circleMarker([p.lat, p.lng], {
                radius: 8, color: colorMap[p.status] || '#409eff', fillOpacity: 0.7
            }).addTo(map).bindPopup(
                `<b>${p.title}</b><br/>类型: ${typeMap[p.type] || p.type}<br/>状态: ${statusMap[p.status] || p.status}<br/>地址: ${p.address || '-'}`
            )
        });
        if( points.length > 0) {
            const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]))
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
        }
        // 响应式
        function handleResize() {
            trendChart?.resize();
            typeChart?.resize();
            statusChart?.resize();
        }
        window.addEventListener('resize', handleResize)

        onBeforeUnmount(() => {
            window.removeEventListener('resize', handleResize)
            trendChart?.dispose();
            typeChart?.dispose();
            statusChart?.dispose();
            map?.remove()
        })
    })
</script>

<style scoped>
    .dashboard {
        padding: 20px;
        min-height: 100vh;
        background-color: #0f172a;
        color: #fff;
    }
    .header {
        display: flex;
        margin-bottom: 20px;
        justify-content: space-between;
        align-items: center;
    }
    .cards {
        display: flex;
        gap: 20px;
        margin-bottom: 20px;
    }
    .card {
        flex: 1;
        padding: 20px;
        background-color: #1e293b;
        border-radius: 8px;
        text-align: center;
    }
    .card .num {
        font-size: 36px;
        font-weight: bold;
        color: #38bdf8;
    }
    .card .label {
        margin-top: 8px;
        color: #94a3b8;
    }
    .charts {
        display: flex;
        gap: 20px;
        margin-bottom: 20px;
    }
    .chart {
        flex: 1;
        padding: 12px;
        height: 320px;
        background-color: #1e293b;
        border-radius: 8px;
    }
    .map-warp {
        height: 400px;
        border-radius: 8px;
        overflow: hidden;
    }
    .map {
        height: 400px;
        width: 100%;
    }
</style>