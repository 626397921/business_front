<template>
  <!-- 路由容器：所有页面都在这里渲染 -->
  <router-view />
</template>

<script setup>
// 空脚本，仅提供路由渲染容器
</script>

<style>
/* 全局样式重置，保证页面全屏 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
html, body {
  height: 100%;
  overflow: auto; /* 允许首页滚动，登录页仍全屏 */
}
</style>