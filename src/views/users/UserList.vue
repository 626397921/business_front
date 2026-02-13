<template>
  <div class="raw-material-container">
    <!-- 卡片容器 -->
    <div class="table-card">
      <!-- 标题 + 新增按钮 + 数据备份按钮 -->
      <div class="form-header">
        <h2 class="form-title">用户账号管理</h2>
        <div class="header-btn-group">
          <button class="category-add-btn" @click="openAddUserDialog">
            <el-icon><Plus /></el-icon> 新增用户
          </button>
          <button
            class="backup-btn"
            @click="backupAllData"
            :disabled="backupLoading"
          >
            <el-icon v-if="backupLoading"><Loading /></el-icon>
            <el-icon v-else><Download /></el-icon>
            {{ backupLoading ? '备份中...' : '数据备份' }}
          </button>
        </div>
      </div>

      <!-- 筛选栏已完全删除 -->
    </div>

    <!-- 用户列表表格 -->
    <div class="table-wrapper">
      <el-table
        v-loading="loading"
        :data="userList"
        border
        stripe
        class="material-table"
        highlight-current-row
      >
        <el-table-column prop="username" label="用户名" min-width="120" align="center" />
        <el-table-column prop="role_name" label="角色" min-width="100" align="center" />
        <el-table-column prop="contact" label="联系方式" min-width="120" align="center" />
        <el-table-column prop="create_date" label="创建时间" min-width="160" align="center" />
        <el-table-column prop="last_operate_time" label="最后操作时间" min-width="160" align="center" />
        <el-table-column label="操作" fixed="right" width="300" align="center">
          <template #default="scope">
            <div class="operate-btn-group">
              <el-button
                type="primary"
                size="small"
                class="edit-btn"
                @click="openEditUserDialog(scope.row)"
              >
                编辑
              </el-button>
              <el-button
                type="danger"
                size="small"
                class="delete-btn"
                @click="handleDeleteUser(scope.row.user_id)"
              >
                删除
              </el-button>
              <el-button
                size="small"
                class="permission-btn"
                @click="openPermissionDialog(scope.row)"
              >
                权限分配
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.page_size"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        class="table-pagination"
      />
    </div>

    <!-- 新增/编辑用户弹窗（核心修改：加宽至1100px，优化权限显示区域） -->
    <el-dialog
      v-model="userDialogVisible"
      title="用户信息"
      width="950px"
      destroy-on-close
      class="user-dialog"
      top="2vh"
    >
      <el-form
        ref="userFormRef"
        :model="userForm"
        :rules="userFormRules"
        label-width="80px"
        class="user-form"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户名" prop="username">
              <el-input
                v-model="userForm.username"
                placeholder="请输入用户名"
                :disabled="isEdit"
                class="form-input"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="角色" prop="role_id">
              <el-select
                v-model="userForm.role_id"
                placeholder="请选择角色"
                class="form-input"
                @change="handleRoleChange"
              >
                <el-option
                  v-for="role in roleList"
                  :key="role.role_id"
                  :label="role.role_name"
                  :value="role.role_id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="密码" prop="password" v-if="!isEdit">
              <el-input
                v-model="userForm.password"
                type="password"
                placeholder="请输入密码"
                class="form-input"
              />
            </el-form-item>
            <el-form-item label="密码" prop="newPassword" v-if="isEdit">
              <el-input
                v-model="userForm.newPassword"
                type="password"
                placeholder="不修改请留空"
                class="form-input"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系方式" prop="contact">
              <el-input
                v-model="userForm.contact"
                placeholder="请输入联系方式"
                class="form-input"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 权限选择区域（核心优化：移除滚动、两行一列改为一行两列、只显示中文） -->
        <el-form-item label="权限分配" class="permission-form-item">
          <div class="permission-container" v-loading="permissionLoading">
            <!-- 权限列表为空提示 -->
            <div v-if="permissionList.length === 0" class="permission-empty-tip">
              <el-empty description="暂无可用权限，请先在系统中添加权限，或检查当前账号是否为超级管理员" />
            </div>

            <!-- 权限勾选区域（核心修改：固定一行两个权限） -->
            <el-checkbox-group
              v-model="userPermissionIds"
              class="permission-group"
              v-else
            >
              <el-checkbox
                v-for="perm in permissionList"
                :key="perm.permission_id"
                :label="perm.permission_id"
                class="permission-checkbox"
                :title="perm.permission_desc || '无权限描述'"
              >
                <!-- 只显示中文描述，移除英文名称 -->
                <span class="perm-cn-name">{{ perm.permission_desc || '无权限描述' }}</span>
              </el-checkbox>
            </el-checkbox-group>

            <div v-if="permissionList.length > 0 && userPermissionIds.length === 0" class="empty-permission-tip">
              暂无勾选任何权限
            </div>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button class="cancel-btn" @click="userDialogVisible = false">取消</el-button>
        <el-button class="save-btn" @click="submitUserForm">保存</el-button>
      </template>
    </el-dialog>

    <!-- 权限分配弹窗（同步加宽、优化权限显示） -->
    <el-dialog
      v-model="permissionDialogVisible"
      title="权限分配"
      width="1000px"
      destroy-on-close
      top="2vh"
    >
      <div v-loading="permissionLoading">
        <!-- 权限列表为空提示 -->
        <div v-if="permissionList.length === 0" class="permission-empty-tip">
          <el-empty description="暂无可用权限，请先在系统中添加权限，或检查当前账号是否为超级管理员" />
        </div>

        <el-form label-width="100px" v-else>
          <el-form-item label="用户信息">
            <div>
              用户名：{{ currentUser.username }} | 角色：{{ currentUser.role_name }}
            </div>
          </el-form-item>
          <!-- 权限勾选区域（同步修改：固定一行两个权限） -->
          <el-form-item label="全部权限">
            <el-checkbox-group
              v-model="userPermissionIds"
              class="permission-group"
            >
              <el-checkbox
                v-for="perm in permissionList"
                :key="perm.permission_id"
                :label="perm.permission_id"
                class="permission-checkbox"
                :title="perm.permission_desc || '无权限描述'"
              >
                <!-- 只显示中文描述，移除英文名称 -->
                <span class="perm-cn-name">{{ perm.permission_desc || '无权限描述' }}</span>
              </el-checkbox>
            </el-checkbox-group>
            <div v-if="userPermissionIds.length === 0" class="empty-permission-tip">
              该用户暂无任何权限
            </div>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button class="cancel-btn" @click="permissionDialogVisible = false">取消</el-button>
        <el-button
          class="save-btn"
          @click="submitPermissionForm"
          :disabled="permissionList.length === 0"
        >
          保存权限
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElEmpty } from 'element-plus'
import { Plus, Download, Loading } from '@element-plus/icons-vue'
import axios from 'axios'

// 加载状态
const loading = ref(false)
const permissionLoading = ref(false)
// 新增：数据备份加载状态
const backupLoading = ref(false)

// 分页参数
const pagination = reactive({
  page: 1,
  page_size: 10,
  total: 0,
  total_pages: 0
})

// 数据列表
const userList = ref([])
const roleList = ref([])
const permissionList = ref([])
// 角色默认权限映射
const roleDefaultPermissions = ref({})

// 弹窗状态
const userDialogVisible = ref(false)
const permissionDialogVisible = ref(false)
const isEdit = ref(false)

// 用户表单
const userFormRef = ref(null)
const userForm = reactive({
  user_id: '',
  username: '',
  password: '',
  newPassword: '',
  role_id: '',
  contact: ''
})

// 权限相关
const currentUser = reactive({
  user_id: '',
  username: '',
  role_name: ''
})
const userPermissionIds = ref([])  // 用户拥有的所有权限ID

// 表单校验规则
const userFormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不少于 6 个字符', trigger: 'blur' }
  ],
  role_id: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

// 新增：通用Axios错误处理函数（返回中文友好提示）
const handleAxiosError = (error, operationName) => {
  // 优先获取后端返回的业务错误信息（如果有）
  const backendMsg = error.response?.data?.message;
  const status = error.response?.status;
  let errMsg = '';

  // 1. 处理HTTP状态码
  switch (status) {
    case 403:
      errMsg = `操作失败：您没有【${operationName}】的权限，请联系管理员`;
      break;
    case 404:
      errMsg = `操作失败：接口路径不存在，请检查后端配置`;
      break;
    case 500:
      errMsg = `操作失败：服务器内部错误，请稍后重试`;
      break;
    case 400:
      errMsg = `操作失败：请求参数错误，请检查输入内容`;
      break;
    default:
      // 2. 无状态码时，优先用后端业务提示，否则用通用提示
      errMsg = backendMsg || `操作失败：网络异常或${operationName}服务异常`;
  }

  // 保留控制台日志（方便调试），返回中文提示
  console.error(`【${operationName}】错误详情：`, error);
  return errMsg;
};

// 页面初始化
onMounted(async () => {
  await getCsrfToken()
  await Promise.all([
    getAllRoles(),
    getAllPermissions(),
    getRoleDefaultPermissions()  // 获取角色默认权限
  ])
  getUserList()
})

// 获取CSRF Token
const getCsrfToken = async () => {
  try {
    await axios.get('/users/get-csrf/')
    console.log('CSRF Token获取成功')
  } catch (error) {
    ElMessage.error(handleAxiosError(error, '获取CSRF Token'))
  }
}

// 获取所有角色
const getAllRoles = async () => {
  try {
    const res = await axios.get('/users/roles/all/')
    if (res && res.success) {
      roleList.value = res.data || []
    } else {
      ElMessage.error('获取角色列表失败：' + (res?.message || '未知错误'))
    }
  } catch (error) {
    ElMessage.error(handleAxiosError(error, '获取角色列表'))
  }
}

// 获取所有权限
const getAllPermissions = async () => {
  try {
    const res = await axios.get('/users/permissions/all/')
    if (res && res.success) {
      permissionList.value = res.data || []
      if (permissionList.value.length === 0) {
        ElMessage.warning('系统中暂无可用权限，请先添加权限数据')
      }
    } else {
      ElMessage.error('获取权限列表失败：' + (res?.message || '未知错误'))
    }
  } catch (error) {
    ElMessage.error(handleAxiosError(error, '获取权限列表'))
  }
}

// 获取角色默认权限（核心：从后端接口获取）
const getRoleDefaultPermissions = async () => {
  try {
    const res = await axios.get('/users/roles/default-permissions/')
    if (res && res.success) {
      roleDefaultPermissions.value = res.data || {}
    } else {
      ElMessage.warning('获取角色默认权限失败，将使用空默认值：' + (res?.message || '未知错误'))
      roleDefaultPermissions.value = {}
    }
  } catch (error) {
    ElMessage.warning(handleAxiosError(error, '获取角色默认权限') + '，将使用空默认值')
    roleDefaultPermissions.value = {}
  }
}

// 获取用户列表（已移除筛选条件）
const getUserList = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      page_size: pagination.page_size
    }

    const res = await axios.get('/users/list/', { params })
    if (res && res.success) {
      userList.value = res.data.user_list || []
      pagination.total = res.data.pagination?.total || 0
      pagination.total_pages = res.data.pagination?.total_pages || 0
    } else {
      ElMessage.error('获取用户列表失败：' + (res?.message || '未知错误'))
    }
  } catch (error) {
    ElMessage.error(handleAxiosError(error, '获取用户列表'))
  } finally {
    loading.value = false
  }
}

// 分页尺寸变化
const handleSizeChange = (val) => {
  pagination.page_size = val
  getUserList()
}

// 分页页码变化
const handleCurrentChange = (val) => {
  pagination.page = val
  getUserList()
}

// 角色变化处理（核心：自动勾选对应默认权限）
const handleRoleChange = (roleId) => {
  if (!roleId) {
    userPermissionIds.value = []
    return
  }
  // 获取该角色的默认权限ID列表
  const defaultPerms = roleDefaultPermissions.value[roleId] || []
  userPermissionIds.value = [...defaultPerms]
  ElMessage.info(`已为【${roleList.value.find(r => r.role_id === roleId)?.role_name}】角色自动勾选默认权限`)
}

// 打开新增用户弹窗
const openAddUserDialog = () => {
  isEdit.value = false
  userForm.user_id = ''
  userForm.username = ''
  userForm.password = ''
  userForm.newPassword = ''
  userForm.role_id = ''
  userForm.contact = ''
  userPermissionIds.value = []  // 清空权限勾选
  if (userFormRef.value) {
    userFormRef.value.clearValidate()
  }
  userDialogVisible.value = true
}

// 打开编辑用户弹窗
const openEditUserDialog = async (row) => {
  isEdit.value = true
  userForm.user_id = row.user_id
  userForm.username = row.username
  userForm.role_id = row.role_id
  userForm.contact = row.contact
  userForm.password = ''
  userForm.newPassword = ''

  // 获取该用户已有的权限
  permissionLoading.value = true
  try {
    const res = await axios.get(`/users/${row.user_id}/permissions/`)
    if (res && res.success) {
      userPermissionIds.value = res.data.user_permission_ids || []
    } else {
      userPermissionIds.value = []
      ElMessage.warning('获取用户已有权限失败，将显示空权限列表')
    }
  } catch (error) {
    userPermissionIds.value = []
    ElMessage.warning(handleAxiosError(error, '获取用户已有权限') + '，将显示空权限列表')
  } finally {
    permissionLoading.value = false
  }

  if (userFormRef.value) {
    userFormRef.value.clearValidate()
  }
  userDialogVisible.value = true
}

// 提交用户表单（支持权限提交）
const submitUserForm = async () => {
  try {
    await userFormRef.value.validate()

    const postData = {
      user_id: userForm.user_id,
      username: userForm.username,
      role_id: userForm.role_id,
      contact: userForm.contact,
      permission_ids: userPermissionIds.value  // 提交勾选的权限ID列表
    }
    if (!isEdit.value) {
      postData.password = userForm.password
    } else if (userForm.newPassword) {
      postData.password = userForm.newPassword
    }

    let res
    if (!isEdit.value) {
      res = await axios.post('/users/create/', postData)
    } else {
      res = await axios.post('/users/update/', postData)
    }

    if (res && res.success) {
      ElMessage.success(res.message)
      userDialogVisible.value = false
      getUserList()
    } else {
      ElMessage.error(res?.message || '提交失败')
    }
  } catch (error) {
    if (error.name === 'ValidationError') {
      ElMessage.warning('请完善表单必填项')
    } else {
      ElMessage.error(handleAxiosError(error, '提交用户表单'))
    }
  }
}

// 删除用户
const handleDeleteUser = async (userId) => {
  try {
    await ElMessageBox.confirm(
      '此操作将永久删除该用户, 是否继续?',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const res = await axios.post('/users/delete/', { user_id: userId })
    if (res && res.success) {
      ElMessage.success(res.message)
      getUserList()
    } else {
      ElMessage.error(res?.message || '删除失败')
    }
  } catch (error) {
    if (error.message !== 'cancel') {
      ElMessage.error(handleAxiosError(error, '删除用户'))
    }
  }
}

// 打开权限分配弹窗
const openPermissionDialog = async (row) => {
  permissionLoading.value = true
  try {
    currentUser.user_id = row.user_id
    currentUser.username = row.username
    currentUser.role_name = row.role_name

    // 获取用户已拥有的权限
    const res = await axios.get(`/users/${row.user_id}/permissions/`)
    if (res && res.success) {
      userPermissionIds.value = res.data.user_permission_ids || []
      permissionDialogVisible.value = true
    } else {
      ElMessage.error('获取用户权限失败：' + (res?.message || '未知错误'))
    }
  } catch (error) {
    ElMessage.error(handleAxiosError(error, '获取用户权限'))
  } finally {
    permissionLoading.value = false
  }
}

// 提交权限表单
const submitPermissionForm = async () => {
  try {
    const postData = {
      user_id: currentUser.user_id,
      permission_ids: userPermissionIds.value
    }

    const res = await axios.post('/users/assign-permissions/', postData)
    if (res && res.success) {
      ElMessage.success(res.message)
      permissionDialogVisible.value = false
      getUserList()
    } else {
      ElMessage.error('保存权限失败：' + (res?.message || '未知错误'))
    }
  } catch (error) {
    ElMessage.error(handleAxiosError(error, '保存用户权限'))
  }
}

// 新增：全量数据备份下载方法
const backupAllData = async () => {
  backupLoading.value = true
  try {
    // 调用备份接口，指定responseType为blob（文件流）
    const res = await axios.get('/users/backup/all/', {
      responseType: 'blob',
      timeout: 300000  // 超时时间设为5分钟，适配大数据备份
    })

    // 处理文件下载
    const blob = new Blob([res.data])
    const fileName = res.headers['content-disposition']?.split('filename=')[1] || `全量数据备份_${new Date().getTime()}.zip`

    // 创建下载链接并触发下载
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = decodeURIComponent(fileName)  // 解码中文文件名
    document.body.appendChild(link)
    link.click()

    // 清理资源
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)

    ElMessage.success('数据备份成功，文件已开始下载！')
  } catch (error) {
    // 处理备份失败（区分权限/服务器/网络错误）
    let errMsg = ''
    if (error.response?.status === 403) {
      errMsg = '备份失败：仅超级管理员可执行全量数据备份'
    } else if (error.response?.data) {
      // 解析后端返回的JSON错误信息（非文件流时）
      const errorData = JSON.parse(await new Response(error.response.data).text())
      errMsg = `备份失败：${errorData.message || '服务器处理异常'}`
    } else {
      errMsg = handleAxiosError(error, '全量数据备份')
    }
    ElMessage.error(errMsg)
  } finally {
    backupLoading.value = false
  }
}
</script>

<style scoped>
/* 核心优化：用户弹窗样式，确保权限完整显示 */
.user-dialog {
  --el-dialog-body-padding: 20px;
  --el-dialog-max-height: 90vh;  /* 限制弹窗最大高度 */
}

.user-form {
  padding-right: 10px;
  box-sizing: border-box;
}

/* 权限区域样式优化 - 核心修改：固定一行两个权限 */
.permission-form-item {
  margin-top: 20px;
}

.permission-container {
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
  min-height: 200px;
  box-sizing: border-box;
}

/* 核心修改：固定一行两个权限（grid-template-columns: repeat(2, 1fr)） */
.permission-group {
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* 关键修改：固定两列，实现一行两个 */
  gap: 12px;  /* 统一间距 */
  max-height: none !important;
  overflow-y: visible !important;
  padding-right: 0 !important;
}

.permission-checkbox {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
  width: 100%;  /* 宽度100%，适配网格布局 */
  box-sizing: border-box;
  margin: 0 !important;  /* 清除默认margin，确保对齐 */
}

/* 中文权限名称样式 */
.perm-cn-name {
  font-weight: 500;
  color: #333;
  font-size: 14px;
  margin-left: 8px;
  flex: 1;  /* 占满剩余空间，对齐显示 */
}

.permission-empty-tip, .empty-permission-tip {
  text-align: center;
  color: #909399;
  padding: 20px 0;
}

/* 原有样式保持并优化 */
.raw-material-container {
  padding: 20px;
  background: #f8f8f8;
  min-height: 100vh;
  box-sizing: border-box;
}

.table-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  padding: 20px;
  margin-bottom: 20px;
  box-sizing: border-box;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

/* 新增：按钮组样式，适配新增和备份按钮 */
.header-btn-group {
  display: flex;
  gap: 12px;
  align-items: center;
}

.form-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.category-add-btn {
  background: #4CAF50;
  color: #fff;
  border: none;
  height: 36px;
  padding: 0 20px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.category-add-btn:hover {
  background: #388E3C;
}

/* 新增：数据备份按钮样式 */
.backup-btn {
  background: #ff9800;
  color: #fff;
  border: none;
  height: 36px;
  padding: 0 20px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.backup-btn:hover {
  background: #f57c00;
}

.backup-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.table-wrapper {
  overflow-x: auto;
  border-radius: 4px;
  padding-bottom: 10px;
  box-sizing: border-box;
}

.material-table {
  width: 100%;
  --el-table-header-text-color: #333;
  --el-table-row-hover-bg-color: #f9f9f9;
  --el-table-border-color: #eee;
  --el-table-stripe-bg: #fafafa;
}

/* 优化操作列按钮样式 - 核心修改 */
.operate-btn-group {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 5px 0;
}

.edit-btn, .delete-btn, .permission-btn {
  height: 36px;
  width: 70px;
  padding: 0;
  font-size: 14px;
  font-weight: 500;
  line-height: 1;
  border-radius: 4px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.edit-btn {
  background: #4CAF50;
  color: #fff;
}

.edit-btn:hover {
  background: #388E3C;
  transform: translateY(-1px);
}

.delete-btn {
  background: #f44336;
  color: #fff;
}

.delete-btn:hover {
  background: #d32f2f;
  transform: translateY(-1px);
}

.permission-btn {
  background: #2196F3;
  color: #fff;
}

.permission-btn:hover {
  background: #1976D2;
  transform: translateY(-1px);
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: right;
  padding: 10px 0;
}

.table-pagination {
  --el-pagination-text-color: #333;
  --el-pagination-active-color: #4CAF50;
}

:deep(.table-pagination .el-pager li.is-active) {
  background: #4CAF50;
  color: #fff;
}

:deep(.el-pagination .el-select .el-input) {
  width: 80px !important;
}

.operate-btn {
  height: 36px;
  padding: 0 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}
.add-btn, .save-btn {
  background: #4CAF50;
  color: #fff;
}
.add-btn:hover, .save-btn:hover {
  background: #388E3C;
}
.cancel-btn {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
}
.cancel-btn:hover {
  background: #eee;
}

/* 响应式适配：移动端仍改为单列 */
@media (max-width: 767px) {
  .form-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  /* 移动端按钮组改为垂直排列 */
  .header-btn-group {
    flex-direction: column;
    width: 100%;
    gap: 8px;
  }
  .category-add-btn, .backup-btn {
    width: 100%;
  }
  .operate-btn-group {
    flex-wrap: wrap;
  }
  /* 移动端权限网格改为单列 */
  .permission-group {
    grid-template-columns: 1fr;
  }
  /* 移动端操作按钮调整 */
  .edit-btn, .delete-btn, .permission-btn {
    width: 60px;
    height: 32px;
    font-size: 12px;
  }
}
</style>