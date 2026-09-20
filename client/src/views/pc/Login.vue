<template>
    <div class="login-container">
        <el-card class="login-card">
            <h2>园区事件管理系统</h2>
            <el-form @submit.prevent="handleLogin">
                <el-form-item>
                    <el-input v-model="form.username" placeholder="用户名" size="large"></el-input>
                </el-form-item>
                <el-form-item>
                    <el-input 
                        v-model="form.password"
                        type="password"
                        placeholder="密码"
                        size="large"
                        show-password
                        @keyup.enter="handleLogin"
                    />
                </el-form-item>
                <el-button type="primary" native-type="submit" :loading="loading" size="large" style="width: 100%">登 录</el-button>
            </el-form>
            <p class="link">
                没有账号？<router-link to="/register">去注册</router-link>
            </p>
        </el-card>
    </div>
</template>

<script setup>
    import { reactive, ref } from 'vue'
    import { useRouter } from 'vue-router'
    import { ElMessage } from 'element-plus'
    import { authApi } from '../../api'
    import { useUserStore } from '../../stores/user'

    const form = reactive({ username: '', password: '' })
    const loading = ref(false)
    const router = useRouter()
    const store = useUserStore()

    async function handleLogin() {
        if (!form.username || !form.password) {
            return ElMessage.warning('请填写用户名和密码')
        }
        loading.value = true
        try {
            const data = await authApi.login(form)
            store.setAuth(data.token, data.username, data.role)
            ElMessage.success('登陆成功')
            // 管理员去列表页，巡检员去移动端（或者也去列表页）
            router.push('/events')
        } catch (error) {
            ElMessage.error(error.response?.data?.message || '登录失败')
        } finally {
            loading.value = false
        }
    }
</script>

<style scoped>
    .login-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background-color: #f0f2f5;
    }
    .login-card {
        width: 400px;
        padding: 20px;
    }
    .login-card h2 {
        margin-bottom: 24px;
        text-align: center;
        color: #303133;
    }
    .link {
        margin-top: 16px;;
        text-align: center;
        color: #909399;
        font-size: 14px;
    }
</style>