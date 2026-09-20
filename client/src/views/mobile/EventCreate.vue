<template>
    <div class="m-page">
        <van-nav-bar title="上报事件" left-arrow @click-left="$router.back()" fixed placeholder></van-nav-bar>

        <van-form @sumbit="onSubmit">
            <van-field v-model="form.title" label="标题" placeholder="简要描述问题" :rules="[{ required: true, message: '请输入标题'}]"></van-field>
            <van-field v-model="form.description" label="描述" type="textarea" rows="3" placeholder="详情说明"></van-field>
            <van-field name="type" lable="类型" :rules="[{ required: true, message: '请选择类型' }]">
                <template #input>
                    <van-radio-group v-model="form.type" direction="horizontal">
                        <van-radio name="facility">设备损坏</van-radio>
                        <van-radio name="environment">环境卫生</van-radio>
                        <van-radio name="safety">安全隐患</van-radio>
                        <van-radio name="other">其他</van-radio>
                    </van-radio-group>
                </template>
            </van-field>

            <!-- 定位 -->
            <van-field label="位置">
                <template #input>
                    <div class="location-box">
                        <div v-if="loadRouteLocation.lat">{{ loadRouteLocation.address || '已获取坐标' }} ({{ loadRouteLocation.lat.toFixed(4) }}, {{ loadRouteLocation.lng.toFixed(4) }})</div>
                        <div v-else class="on-loc">未定位</div>
                        <van-button size="small" type="primary" @click="getLocation" :loading="locating">获取定位</van-button>
                    </div>
                </template>
            </van-field>

            <!-- 图片上传 -->
            <van-field label="照片">
                <template #input>
                    <van-uploader v-model="fileList" :max-count="3" :after-read="afterRead" :before-delete="onDelete" accept="image/*"></van-uploader>
                </template>
            </van-field>

            <div style="margin: 16px">
                <van-button round block type="primary" native-type="submit" :loading="submitting">提交上报</van-button>
            </div>
        </van-form>
    </div>
</template>

<script setup>
    import { ref, reactive } from 'vue'
    import { useRouter } from 'vue-router'
    import { showToast, showLoadingToast, closeToast } from 'vant'
    import { eventApi, uploadApi } from '../../api'

    const router = useRouter()
    const form = reactive({ title: '', description: '', type: '', images:[], latitude: null, longitude: null, address: '' })
    const location = reactive({ lat: null, lng: null, address: '' })
    const locating = ref(false)
    const submitting = ref(false)
    const fileList = ref([])

    // 浏览器定位
    function getLocation() {
        if (!navigator.geolocation) return showToast('浏览器不支持定位')
        locating.value = true
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                location.lat = pos.coords.latitude
                location.lng = pos.coords.longitude
                form.latitude = pos.coords.latitude
                form.longitude = pos.coords.longitude
                // 简单显示坐标作为地址 （生产环境应调用逆向地址编码 API）
                location.address = `纬度${pos.coords.latitude.toFixed(4)}, 经度${pos.coords.longitude.toFixed(4)}`
                locating.value = false
                showToast('定位成功')
            }
        )
    }

    // 图片上传
    async function afterRead(file) {
        // 单文件时file是对象，多文件时是数组
        const files = Array.isArray(file) ? file : [file]
        showLoadingToast({ message: '上传中...', forbidClick: true })
        try {
            const formData = new FormData()
            files.forEach(f => formData.append('images', f.file))
            const data = await uploadApi.uploadImages(formData)
            form.images.push(...data.files)
            closeToast()
            showToast('上传成功')
        } catch (err) {
            closeToast()
            showToast('上传失败')
            // 失败时从列表移除
            fileList.value = fileList.value.filter(f => !files.includes(f))
        }
    }

    function onDelete(file) {
        const url = file.url || file.content
        // 从 form.images 中移除对应路径（简略处理）
        return true
    }

    async function onSubmit() {
        if (fileList.value.length === 0) return showToast('请至少上传一张照片')
        submitting.value = true
        try {
            await eventApi.create(form)
            showToast('上报成功')
            router.replace('/m/list')
        } catch (err) {
            showToast(err.response?.data?.message || '提交失败')
        } finally {
            submitting.value = false
        }
    }
</script>

<style scoped>
</style>