<template>
    <div class="m-login">
        <div class="header">
            <h2>园区事件上报</h2>
            <p>巡检员移动端</p>
        </div>

        <van-form @submit="handleLogin">
            <van-cell-group inset>
                <van-field
                    v-model="form.username"
                    name="username"
                    label="用户名"
                    placeholder="请输入用户名"
                    :rules="[{ required: true, message: '请填写用户名' }]"
                ></van-field>
                <van-field
                    v-model="form.password"
                    name="password"
                    type="password"
                    label="密码"
                    placeholder="请输入密码"
                    :rules="[{ required: true, message: '请填写密码' }]"
                ></van-field>
            </van-cell-group>

            <div class="btn-wrap">
                <van-button round block type="primary" native-type="submit" :loading="loading">登 录</van-button>
            </div>
        </van-form>

        <p class="link">
            没有账号？<router-link to="/m/register">去注册</router-link>
        </p>
    </div>
</template>

<script setup>
    import { ref, reactive } from 'vue'
    import { useRouter } from 'vue-router'
    import { showToast, showSuccessToast } from 'vant'
    import { authApi } from '../../api'
    import { useUserStore } from '../../stores/user'

    const form = reactive({ username: '', password: '' })
    const loading = ref(false)
    const router = useRouter()
    const store = useUserStore()

    async function handleLogin() {
        loading.value = true
        try {
            const data = await authApi.login(form)
            store.setAuth(data.token, data.username, data.role)
            showSuccessToast('登陆成功')
            router.replace('/m/list')
        } catch (err) {
            showToast(err.response?.data?.message || '登录失败')
        } finally {
            loading.value = false
        }
    }
</script>

<style scoped>
    .m-login {
        min-height: 100vh;
        padding-top: 80px;
        background-color: #f7f8fa;
    }
    .header {
        margin-bottom: 40px;
        text-align: center;
    }
    .header h2 {
        margin-bottom: 8px;
        font-size: 24px;
        color: #323233;
    }
    .header p {
        font-size: 14px;
        color: #969799;
    }
    .btn-wrap {
        margin: 24px 16px;
    }
    .link {
        margin-top: 20px;
        font-size: 14px;
        color: #969799;
        text-align: center;
    }
    .link a {
        color:#1989fa;
    }
</style>