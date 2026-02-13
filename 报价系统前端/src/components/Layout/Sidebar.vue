<template>
  <div class="sidebar">
    <div class="sidebar-logo">
      <img src="@/assets/logo.png" alt="LOGO" class="logo-img" />
    </div>
    <el-menu default-active="1" class="sidebar-menu">
      <!-- 首页 -->
      <el-menu-item index="1">
        <i class="el-icon-menu"></i> <!-- 修复：去掉多余的< -->
        <span>首页</span>
        <router-link to="/home" />
      </el-menu-item>

      <!-- 超级管理员可见：用户/角色管理 -->
      <el-submenu index="2" v-if="userRole === '超级管理员'">
        <template #title> <!-- 修复：slot="title" 改为 #title（v-slot简写） -->
          <i class="el-icon-user"></i> <!-- 修复：去掉多余的< -->
          <span>用户管理</span>
        </template>
        <el-menu-item index="2-1">
          <router-link to="/users/list">用户列表</router-link>
        </el-menu-item>
        <el-menu-item index="2-2">
          <router-link to="/users/roles">角色列表</router-link>
        </el-menu-item>
      </el-submenu>

      <!-- 业务员可见：业务/货代管理 -->
      <el-submenu index="3" v-if="userRole === '业务员'">
        <template #title> <!-- 修复：slot="title" 改为 #title -->
          <i class="el-icon-s-tools"></i> <!-- 修复：去掉多余的< -->
          <span>业务管理</span>
        </template>
        <el-menu-item index="3-1">
          <router-link to="/business/customers">客户列表</router-link>
        </el-menu-item>
        <el-menu-item index="3-2">
          <router-link to="/freight/forwarders">货代表</router-link>
        </el-menu-item>
      </el-submenu>

      <!-- 财务可见：账款/汇率管理 -->
      <el-submenu index="4" v-if="userRole === '财务'">
        <template #title> <!-- 修复：slot="title" 改为 #title -->
          <i class="el-icon-money"></i> <!-- 修复：去掉多余的< -->
          <span>财务管理</span>
        </template>
        <el-menu-item index="4-1">
          <router-link to="/finance/payments">账款列表</router-link>
        </el-menu-item>
        <el-menu-item index="4-2">
          <router-link to="/finance/exchange">汇率配置</router-link>
        </el-menu-item>
      </el-submenu>

      <!-- 所有角色可见：计算工具 -->
      <el-menu-item index="5">
        <i class="el-icon-calculator"></i> <!-- 修复：去掉多余的< -->
        <span>计算工具</span>
        <router-link to="/calculation/yarn" />
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script>
export default {
  name: 'LayoutSidebar', // 修复：组件名改为多单词（解决ESLint报错）
  data() {
    return {
      userRole: localStorage.getItem('userRole') // 登录后存储的角色
    }
  }
}
</script>

<style scoped>
.sidebar {
  width: 200px;
  height: 100vh;
  background: #2f4050;
  color: #fff;
  position: fixed;
  top: 0;
  left: 0;
}
.sidebar-logo {
  padding: 20px;
  text-align: center;
}
.logo-img {
  max-width: 80px;
  height: auto;
}
.sidebar-menu {
  border-right: none;
}
</style>