<template>
  <div class="order-management-container">
    <el-card shadow="hover" class="page-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">订单管理</span>
          <el-button type="primary" icon="el-icon-plus" @click="handleAddOrder">新增订单</el-button>
        </div>
      </template>
      <!-- 空白页面占位，可根据需求扩展 -->
      <div class="empty-content">
        <el-empty description="暂无订单数据" :image-size="120">
          <el-button type="primary" @click="handleAddOrder">新增订单</el-button>
        </el-empty>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ElMessage } from 'element-plus'

// 新增订单方法（示例）
const handleAddOrder = () => {
  ElMessage.info('进入新增订单页面')
  // 可扩展路由跳转/弹窗逻辑
}
</script>

<style scoped>
.order-management-container {
  width: 100%;
  height: 100%;
}

.page-card {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
}

.empty-content {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 0;
}
</style>