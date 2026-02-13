<template>
  <div class="layout-container">
    <LayoutSidebar /> <!-- 对应修改后的组件名 -->
    <div class="layout-main">
      <LayoutHeader /> <!-- 对应修改后的组件名 -->
      <div class="layout-content">
        <router-view /> <!-- 页面内容在这里渲染 -->
      </div>
    </div>
  </div>
</template>

<script>
import LayoutSidebar from './Sidebar.vue' // 导入修改后的组件名
import LayoutHeader from './Header.vue' // 导入修改后的组件名

export default {
  name: 'AppLayout', // 修复：组件名改为多单词
  components: { LayoutSidebar, LayoutHeader }
}
</script>

<style scoped>
.layout-main {
  margin-left: 200px;
  min-height: 100vh;
}
.layout-content {
  padding: 20px;
  background: #f3f3f4;
  min-height: calc(100vh - 60px);
}
</style>