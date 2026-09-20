<template>
    <div class="login-container">
        <el-card class="login-card">
            <h2>注册账号</h2>
            <el-form @submit.prevent="handleRegister">
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
                    ></el-input>
                </el-form-item>
                <el-form-item>
                    <el-select v-model="form.role" placeholder="角色" size="large" style="width: 100%">
                        <el-option label="管理员" value="admin"></el-option>
                        <el-option label="巡检员" value="inspector"></el-option>
                    </el-select>
                </el-form-item>
                <el-button
                    type="primary"
                    native-type="submit"
                    :loading="loading"
                    size="large"
                    style="width:100%"
                >注  册</el-button>
            </el-form>
            <p class="link">
                已有账号？<router-link to="/login">去登录</router-link>
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

    const form = reactive({ username: '', password: '', role: 'admin' })
    const loading = ref(false)
    const router = useRouter()
    const store = useUserStore()

    async function handleRegister() {
        if (!form.username || !form.password) {
            return ElMessage.warning('请填写用户名和密码')
        }
        loading.value = true
        try {
            const data = await authApi.register(form)
            store.setAuth(data.token, data.username, data.role)
            ElMessage.success('注册成功，已自动登录')
            router.push('/list')
        } catch (error) {
            ElMessage.error(error.response?.data?.message || '注册失败')
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
        padding: 20px;
        width: 400px;
    }
    .login-card h2 {
        margin-bottom: 24px;
        text-align: center;
        color: #303133;
    }
    .link {
        margin-top: 16px;
        text-align: center;
        color: #909399;
        font-size: 14px;
    }
</style>