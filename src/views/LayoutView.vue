<template>
  <el-container class="layout-container">
    <!-- 顶部导航栏（固定） -->
    <el-header class="layout-header">
      <div class="header-left">
        <!-- LOGO图片（样式已优化） -->
        <img src="@/assets/logo.png" alt="欧美佳LOGO" class="system-logo" />
        <span class="system-name">欧美佳业务管理系统</span>
      </div>
      <div class="header-right">
        <!-- 改为flex布局容器，适配长用户名 -->
        <div class="user-info">
          <span class="time-text">{{ currentTime }}</span>
          <span class="welcome-text">欢迎，{{ username }}</span>
        </div>
        <el-button type="text" @click="handleLogout" class="logout-btn">
          <i class="el-icon-switch-button"></i> 退出登录
        </el-button>
      </div>
    </el-header>

    <el-container>
      <!-- 侧边栏（固定） -->
      <el-aside width="200px" class="layout-aside">
        <el-menu
          :default-active="activeMenuIndex"
          class="layout-menu"
          background-color="#fff"
          text-color="#333"
          active-text-color="#42b983"
          router
        >
          <el-menu-item index="/layout/home"> <!-- 新增/layout前缀 -->
            <i class="el-icon-menu"></i>
            <template v-slot:title>首页</template>
          </el-menu-item>
          <el-menu-item index="/layout/calculation/yarn-quote"> <!-- 新增/layout前缀 -->
            <i class="el-icon-price-tag"></i>
            <template v-slot:title>纱线报价</template>
          </el-menu-item>
          <el-menu-item index="/layout/calculation/knitted-fabric-quote"> <!-- 新增/layout前缀 -->
            <i class="el-icon-price-tag"></i>
            <template v-slot:title>针织面料报价</template>
          </el-menu-item>
          <el-menu-item index="/layout/calculation/raw-material"> <!-- 新增/layout前缀 -->
            <i class="el-icon-s-data"></i>
            <template v-slot:title>原材料管理</template>
          </el-menu-item>
          <!-- 新增生产记录管理菜单项 -->
          <el-menu-item index="/layout/production-record">
            <i class="el-icon-s-data"></i>
            <template v-slot:title>生产记录管理</template>
          </el-menu-item>
          <!-- 货代管理菜单项 -->
          <el-menu-item index="/layout/freight/freight-forwarder">
            <i class="el-icon-truck"></i>
            <template v-slot:title>货代管理</template>
          </el-menu-item>
          <el-menu-item index="/layout/business/customer-management"> <!-- 新增/layout前缀 -->
            <i class="el-icon-user"></i>
            <template v-slot:title>客户管理</template>
          </el-menu-item>
          <!-- 核心修改：仅超级管理员显示账号管理菜单 -->
          <el-menu-item
            index="/layout/users/user-list"
            v-if="userRole === '超级管理员'"
          >
            <i class="el-icon-user-solid"></i>
            <template v-slot:title>账号管理</template>
          </el-menu-item>
          <el-menu-item index="/layout/calculation/exchange-rate"> <!-- 新增/layout前缀 -->
            <i class="el-icon-money"></i>
            <template v-slot:title>汇率API配置</template>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 主体内容区域（滚动） -->
      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, watch, onUnmounted, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()

// 用户名和角色初始值为空
const username = ref('')
const userRole = ref('')

// 页面挂载时读取localStorage中的用户信息（核心修改）
onMounted(() => {
  // 从统一的userInfo键中解析用户信息
  const storedUserInfo = localStorage.getItem('userInfo')

  if (storedUserInfo) {
    try {
      // 解析JSON字符串为对象
      const userInfo = JSON.parse(storedUserInfo)
      username.value = userInfo.username || '未登录用户'
      userRole.value = userInfo.role || ''
    } catch (e) {
      // 解析失败则清除无效数据
      console.error('用户信息解析失败：', e)
      localStorage.removeItem('userInfo')
      ElMessage.warning('登录信息异常，请重新登录！')
      router.push('/login')
      return
    }
  } else {
    // 无用户信息则跳登录页
    username.value = '未登录用户'
    userRole.value = ''
    router.push('/login')
    ElMessage.warning('请先登录！')
  }
})

// 其他逻辑（实时时间、退出登录、路由监听）保持不变
const activeMenuIndex = ref(route.path)
const currentTime = ref('')
const formatDateTime = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}
currentTime.value = formatDateTime()
const timeTimer = setInterval(() => {
  currentTime.value = formatDateTime()
}, 1000)
onUnmounted(() => clearInterval(timeTimer))

// 退出登录（同步修改清除逻辑，保持一致）
const handleLogout = () => {
  // 清除统一的用户信息键，而非单独的username、userRole
  localStorage.removeItem('isLogin')
  localStorage.removeItem('userInfo') // 核心修改：清除统一的userInfo
  localStorage.removeItem('token')
  localStorage.removeItem('loginInfo')
  router.push('/login')
  ElMessage.success('退出登录成功！')
}

// 监听路由
watch(() => route.path, (newPath) => {
  activeMenuIndex.value = newPath
}, { immediate: true })
</script>

<style scoped>
/* 全局布局容器 */
.layout-container {
  height: 100vh;
  min-width: 1200px;
}

/* 顶部导航栏 */
.layout-header {
  height: 60px !important;
  line-height: 60px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 0 20px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 999;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: none;
}
.header-left {
  display: flex;
  align-items: center;
}
/* 系统名称样式 */
.system-name {
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
}
/* 核心：LOGO样式（适配导航栏） */
.system-logo {
  height: 40px; /* 控制LOGO高度，适配60px导航栏 */
  margin-right: 12px; /* 与系统名称的间距 */
  object-fit: contain; /* 防止图片拉伸变形，保持比例 */
  cursor: pointer; /* 鼠标悬浮显示手型，提升交互性 */
  vertical-align: middle; /* 垂直居中 */
}
.header-right {
  display: flex;
  align-items: center;
  gap: 20px; /* 退出按钮和用户信息的间距 */
}

/* 核心：用户信息改为flex布局，适配长用户名 */
.user-info {
  display: flex; /* 弹性布局 */
  align-items: center;
  gap: 15px; /* 时间和欢迎语的间距（固定，无论内容多长都不变） */
  font-size: 14px;
  max-width: 300px; /* 限制最大宽度，避免挤压 */
  overflow: hidden; /* 溢出隐藏 */
  white-space: nowrap; /* 禁止换行 */
}
/* 时间样式（绿色） */
.time-text {
  color: #42b983;
  flex-shrink: 0; /* 时间不收缩，保证宽度固定 */
}
/* 欢迎语+用户名（超长时省略） */
.welcome-text {
  color: #666;
  text-overflow: ellipsis; /* 溢出显示省略号 */
  overflow: hidden;
}

.logout-btn {
  color: #f56c6c;
  font-size: 14px;
  flex-shrink: 0; /* 退出按钮不收缩 */
}
.logout-btn:hover {
  color: #e45656;
}

/* 侧边栏 */
.layout-aside {
  background-color: #fff;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
  position: fixed;
  top: 60px;
  bottom: 0;
  left: 0;
  z-index: 998;
  overflow-y: auto;
  border: none;
}
.layout-menu {
  border-right: none;
  height: 100%;
}
:deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
  font-size: 14px;
  margin: 5px 0;
  border-radius: 8px !important;
  margin: 0 10px;
}
:deep(.el-menu-item.is-active) {
  background-color: rgba(66, 185, 131, 0.1) !important;
  color: #42b983 !important;
}
:deep(.el-menu-item:hover) {
  background-color: #f8f9fa;
}

/* 主体内容 */
.layout-main {
  margin-left: 200px;
  margin-top: 60px;
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
  box-sizing: border-box;
}

/* 响应式 */
@media (max-width: 1200px) {
  .layout-container {
    min-width: 100%;
  }
  .layout-aside {
    width: 180px !important;
  }
  .layout-main {
    margin-left: 180px;
  }
}
@media (max-width: 768px) {
  .layout-aside {
    width: 60px !important;
    overflow: hidden;
  }
  .layout-main {
    margin-left: 60px;
  }
  .system-name {
    display: none;
  }
  .user-info {
    display: none;
  }
  /* 小屏幕下LOGO微调 */
  .system-logo {
    height: 36px; /* 小屏幕适当缩小LOGO */
    margin-right: 0;
  }
}
</style>