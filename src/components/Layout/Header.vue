<template>
  <div class="header">
    <div class="header-right">
      <span>欢迎您：{{ username }}</span>
      <el-button type="link" @click="handleLogout">退出登录</el-button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LayoutHeader', // 修复：组件名改为多单词
  data() {
    return {
      username: localStorage.getItem('username')
    }
  },
  methods: {
    handleLogout() {
      // 清除本地存储+跳转到登录页
      localStorage.clear()
      this.$router.push('/login')
    }
  }
}
</script>

<style scoped>
.header {
  height: 60px;
  background: #fff;
  border-bottom: 1px solid #eee;
  padding: 0 20px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-left: 200px;
}
.header-right {
  display: flex;
  gap: 20px;
  align-items: center;
}
</style>