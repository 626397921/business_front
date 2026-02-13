<template>
  <!-- 仅渲染路由视图，登录页占满全屏 -->
  <router-view />
</template>

<script setup>
// 空脚本，无多余逻辑
</script>

<style>
/* 全局样式重置，确保登录页全屏显示 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
html, body {
  height: 100%;
  overflow: hidden;
}
</style>