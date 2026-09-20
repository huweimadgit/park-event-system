<template>
    <div class="m-login">
        <div class="header">
            <h2>注册账号</h2>
        </div>

        <van-form @submit="handleRegister">
            <van-cell-group inset>
                <van-field
                    v-model="form.username"
                    label="用户名"
                    placeholder="请输入用户名"
                    :rules="[{ required: true, message: '请填写用户名' }]"
                ></van-field>
                <van-field
                    v-model="form.password"
                    label="密码"
                    type="password"
                    placeholder="请输入密码"
                    :rules="[{ required: true, message: '请填写密码' }]"
                ></van-field>
                <van-field name="role" label="角色">
                    <template #input>
                        <van-radio-group v-model="form.role" direction="horizontal">
                            <van-radio name="inspector">巡检员</van-radio>
                            <van-radio name="admin">管理员</van-radio>
                        </van-radio-group>
                    </template>
                </van-field>
            </van-cell-group>

            <div class="btn-wrap">
                <van-button
                    round
                    block
                    type="primary"
                    native-type="submit"
                    :loading="loading"
                >注 册</van-button>
            </div>
        </van-form>

        <p class="link">
            已有账号?<router-link to="/m/login">去登录</router-link>
        </p>
    </div>
</template>

<script setup>
    import { ref, reactive } from 'vue'
    import { useRouter } from 'vue-router'
    import { showToast, showSuccessToast } from 'vant'
    import { authApi } from '../../api'
    import { useUserStore } from '../../stores/user'

    const form = reactive({ username: '', password: '', role: 'inspector' })
    const loading = ref(false)
    const router = useRouter()
    const store = useUserStore()

    async function handleRegister() {
        loading.value = true
        try {
            const data = await authApi.register(form)
            store.setAuth(data.token, data.username, data.role)
            showSuccessToast('注册成功')
            router.replace('/m/list')
        } catch (err) {
            showToast(err.response?.data?.message || '注册失败')
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
        font-size: 24px;
        color: #323233;
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
        color: #1989fa;
    }
</style>