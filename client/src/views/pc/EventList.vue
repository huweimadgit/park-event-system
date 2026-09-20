<template>
    <div class="page">
        <el-card>
            <div class="toolbar">
                <el-input v-model="keyword" placeholder="搜索标题/地址" style="width:220px" clearable @clear="fetch" @keyup.enter="fetch" />
                <el-select v-model="filterType" placeholder="类型" clearable style="width:140px"
                        @change="fetch">
                    <el-option label="设施损坏" value="facility" />
                    <el-option label="换卫生" value="environment" />
                    <el-option label="安全隐患" value="safety" />
                    <el-option label="其他" value="other" />
                </el-select>
                <el-select v-model="filterStatus" placeholder="状态" clearable style="width: 140px;"
                        @change="fetch">
                    <el-option lable="待处理" value="pending" />
                    <el-option lable="处理中" value="processing" />
                    <el-option lable="已完成" value="done" />
                </el-select>
                <el-button type="primary" @click="fetch">查询</el-button>
                <el-button type="success" @click="$router.push('/dashboard')">驾驶舱</el-button>
                <el-button @click="handleLogout">退出</el-button>
            </div>
            
            <el-table :data="list" v-loading="loading" stripe>
                <el-table-column prop="id" label="ID" width="70"></el-table-column>
                <el-table-column prop="title" label="标题" min-width="160"></el-table-column>
                <el-table-column label="类型" width="100">
                    <template #default="{ row }">{{ typeLable(row.type) }}</template>
                </el-table-column>
                <el-table-column prop="address" label="地址" min-width="160" show-overflow-tooltip></el-table-column>
                <el-table-column label="状态" width="100">
                    <template #default="{ row }">
                        <el-tag :type="statusTag(row.status)">{{ statusLable(row.status) }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="reporter_name" label="上报人" width="100"></el-table-column>
                <el-table-column prop="created_at" lable="时间" width="170"></el-table-column>
                <el-table-column label="操作" width="200" fixed="right">
                    <template #default="{ row }">
                        <el-button size="small" @click="openStatus(row)">变更状态</el-button>
                        <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <el-pagination v-model:current-page="page" :page-size="size" :total="total"
                layout="prev, pager, next, total" style="margin-top:16px;" @current-change="fetch"></el-pagination>
        </el-card>

        <el-dialog v-model="dialogVisible" title="变更状态" width="420px">
            <el-form lable-width="80px">
                <el-form-item lable="状态">
                    <el-select v-model="statusForm.status" style="width:100%">
                        <el-option label="待处理" value="pending"></el-option>
                        <el-option label="处理中" value="processing"></el-option>
                        <el-option label="已完成" value="done"></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="处理反馈">
                    <el-input v-model="statusForm.handler_note" typ="textarea" :rows="3"></el-input>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="submitStatus">确定</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
    import { ref, reactive, onMounted } from 'vue'
    import { useRouter } from 'vue-router'
    import { ElMessage, ElMessageBox } from 'element-plus'
    import { evnetApi } from '../../api'
    import { useUserStore } from '../../stores/user'

    const list = ref([])
    const total = ref(0)
    const page = ref(1)
    const size = ref(10)
    const keyword = ref('')
    const filterType = ref('')
    const filterStatus = ref('')
    const loading = ref(false);
    const dialogVisible = ref(false);
    const statusForm = reactive({ id: null, status: '', handler_note: '' })
    const router = useRouter
    const store = useUserStore()

    const typeMap = { facility: '设施损坏', environment: '环境卫生', safety: '安全隐患', other: '其他' }
    const statusMap = { pending: '待处理', processing: '处理中', done: '已完成' }
    const typeLable = (t) => typeMap[t] || t
    const statusLable = (t) => statusMap[t] || t
    const statusTag = (s) => ({ pending: 'danger', processing: 'warning', done: 'success' }[s] || '')

    async function fetch() {
        loading.value = true
        try {
            const data = await evnetApi.getList({
                page: page.value, size: size.value,
                keyword: keyword.value, type: filterType.value, status: filterStatus.value
            })
            list.value = data.list;
            total.value = data.total
        } finally { loading.value = false }
    }

    function openStatus(row) {
        Object.assign(statusForm, { id: row.id, status: row.status, handler_note: row.handler_note || '' })
        dialogVisible.value = true
    }

    async function submitStatus() {
        await eventApi.changeStatus(statusForm.id, {
            status:statusForm.status, hander_note: statusForm.handler_note
        })
        ElMessage.success('状态已更新')
        dialogVisible.value = false
        fetch()
    }

    async function handleDelete(id) {
        await ElMessageBox.confirm('确定删除此事件？', '警告', { type: 'warning' })
        await eventApi.remove(id)
        ElMessage.success('已删除')
        fetch()
    }

    function handleLogout() {
        store.logout();
        router.push('/login')
    }

    onMounted(fetch)
</script>

<style scoped>
    .page {
        padding: 20px;
        background: #f0f2f5;
        min-height: 100vh;
    }
    .toolbar {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;
        flex-wrap: wrap;
    }
</style>