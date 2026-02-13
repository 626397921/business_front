<template>
  <div class="exchange-rate-container">
    <!-- 左右分栏布局：优化栅格响应式 & 间距 -->
    <el-row :gutter="24" class="main-row">
      <!-- 左侧：API配置表单 -->
      <el-col :xs="24" :lg="12" class="form-col">
        <div class="form-card">
          <div class="form-header">
            <div class="form-title">API配置</div>
          </div>

          <!-- API配置表单：优化间距和对齐 -->
          <el-form
            ref="apiConfigFormRef"
            :model="apiConfigForm"
            label-width="0"
            class="api-config-form"
          >
            <!-- API名称 -->
            <el-form-item prop="apiName" required class="form-item">
              <label class="form-item-label">API名称</label>
              <el-input
                v-model="apiConfigForm.apiName"
                placeholder="例如：Open Exchange Rates"
                class="form-input"
              ></el-input>
            </el-form-item>

            <!-- API地址 -->
            <el-form-item prop="apiUrl" required class="form-item">
              <label class="form-item-label">API地址</label>
              <el-input
                v-model="apiConfigForm.apiUrl"
                type="url"
                placeholder="例如：https://v6.exchangerate-api.com/v6/{api_key}/latest/{base}"
                class="form-input"
              ></el-input>
              <div class="text-tips mt-1">
                <p>示例1（含参数API接口路径）：https://v6.exchangerate-api.com/v6/{api_key}/pair/{from}/{to}</p>
                <p>示例2（参数在查询串）：https:/.exchangerate.host/latest</p>
              </div>
            </el-form-item>

            <!-- 请求方法（核心：宽度与输入框一致） -->
            <el-form-item prop="requestMethod" class="form-item">
              <label class="form-item-label">请求方法</label>
              <el-select
                ref="requestMethodSelectRef"
                v-model="apiConfigForm.requestMethod"
                class="form-input request-method-select"
                :teleported="true"
                popper-class="custom-select-popper"
                placeholder="请选择请求方法"
                :popper-options="{
                  placement: 'bottom-start',
                  modifiers: [
                    { name: 'offset', options: { offset: [0, 4] } },
                    { name: 'preventOverflow', options: { rootBoundary: 'viewport', altBoundary: true } },
                    { name: 'flip', options: { fallbackPlacements: ['bottom-start', 'top-start'] } },
                    { name: 'width', options: { minWidth: '100%', maxWidth: '100%' } } // 新增：强制宽度匹配
                  ]
                }"
              >
                <el-option label="GET" value="get"></el-option>
                <el-option label="POST" value="post"></el-option>
              </el-select>
            </el-form-item>

            <!-- API参数配置 -->
            <el-form-item class="form-item">
              <label class="form-item-label">API参数</label>
              <div class="test-result-card param-card">
                <div class="test-result-header mb-3">
                  <div class="font-medium">参数键值对</div>
                  <el-button
                    type="primary"
                    @click="addParamRow"
                    class="operate-btn"
                  >
                    <i class="el-icon-plus mr-1"></i> 添加参数
                  </el-button>
                </div>
                <el-scrollbar height="180px" class="param-scrollbar">
                  <div
                    v-for="(param, index) in apiConfigForm.apiParamsList"
                    :key="index"
                    class="param-row flex gap-2 mb-2 align-items-center"
                  >
                    <el-input
                      v-model="param.key"
                      placeholder="参数名"
                      class="form-input flex-1"
                    ></el-input>
                    <el-input
                      v-model="param.value"
                      placeholder="参数值"
                      class="form-input flex-1"
                    ></el-input>
                    <el-button
                      type="text"
                      @click="removeParamRow(index)"
                      :disabled="apiConfigForm.apiParamsList.length <= 1"
                      class="text-btn danger-btn param-del-btn"
                    >
                      <i class="el-icon-minus"></i> 删除
                    </el-button>
                  </div>
                </el-scrollbar>
                <div class="text-tips mt-2">
                  点击"添加参数"可增加多个键值对，参数将自动替换URL中的{占位符}或作为查询参数
                </div>
              </div>
            </el-form-item>

            <!-- 连接测试结果 -->
            <el-form-item class="form-item">
              <label class="form-item-label">连接测试结果</label>
              <div class="test-result-card">
                <div class="test-result-header flex justify-between items-center mb-3">
                  <div class="font-medium">连接测试结果</div>
                  <el-button
                    type="primary"
                    @click="testConnection"
                    class="operate-btn"
                  >
                    连接测试
                  </el-button>
                </div>
                <div class="result-item mb-3">
                  <label class="result-label">连接状态：</label>
                  <div class="result-value" :class="connectionStatusClass">
                    {{ connectionResult.status || '未测试' }}
                  </div>
                </div>
                <div class="result-item mb-3">
                  <label class="result-label">响应状态：</label>
                  <div class="result-value">
                    {{ connectionResult.responseCode ? `HTTP ${connectionResult.responseCode}` : '-' }}
                  </div>
                </div>
                <div class="raw-response">
                  <label class="result-label block mb-1">原始响应数据</label>
                  <p class="text-tips mb-2">查看完整的API返回结果，用于配置字段映射</p>
                  <el-scrollbar height="160px" class="raw-response-scroll">
                    <pre class="text-sm">{{ connectionResult.originalResponse || '暂无数据' }}</pre>
                  </el-scrollbar>
                </div>
              </div>
            </el-form-item>

            <!-- 响应字段映射 -->
            <el-form-item class="form-item">
              <label class="form-item-label">响应字段映射</label>
              <div class="mapping-header flex gap-2 mb-4">
                <el-button
                  type="primary"
                  @click="testApiMapping"
                  icon="el-icon-check"
                  class="operate-btn mapping-btn"
                >
                  测试API映射
                </el-button>
                <el-button
                  type="primary"
                  @click="addMappingRow"
                  icon="el-icon-plus"
                  class="operate-btn mapping-btn"
                >
                  添加映射
                </el-button>
              </div>
              <div class="mapping-single-card">
                <el-row :gutter="10" class="mapping-header-row">
                  <el-col :span="6" class="mapping-header-col">
                    <span class="mapping-header-text">原始字段路径</span>
                  </el-col>
                  <el-col :span="5" class="mapping-header-col">
                    <span class="mapping-header-text">字段名</span>
                  </el-col>
                  <el-col :span="5" class="mapping-header-col">
                    <span class="mapping-header-text">字段值</span>
                  </el-col>
                  <el-col :span="5" class="mapping-header-col">
                    <span class="mapping-header-text">字段描述</span>
                  </el-col>
                  <el-col :span="3" class="mapping-header-col text-center">
                    <span class="mapping-header-text">操作</span>
                  </el-col>
                </el-row>
                <el-scrollbar height="280px" class="mapping-scrollbar">
                  <div class="mapping-rows-container">
                    <div
                      v-for="(mapping, index) in apiConfigForm.fieldMappings"
                      :key="index"
                      class="mapping-row flex items-center"
                    >
                      <el-col :span="6" class="mapping-col">
                        <el-input
                          v-model="mapping.originalFieldPath"
                          placeholder="例如：data.base_currency"
                          class="form-input mapping-input"
                          size="small"
                        ></el-input>
                      </el-col>
                      <el-col :span="5" class="mapping-col">
                        <el-input
                          v-model="mapping.fieldName"
                          placeholder="例如：base"
                          class="form-input mapping-input"
                          size="small"
                        ></el-input>
                      </el-col>
                      <el-col :span="5" class="mapping-col">
                        <el-input
                          v-model="mapping.fieldValue"
                          placeholder="可选默认值"
                          class="form-input mapping-input"
                          size="small"
                        ></el-input>
                      </el-col>
                      <el-col :span="5" class="mapping-col">
                        <el-input
                          v-model="mapping.fieldDesc"
                          placeholder="例如：基础货币"
                          class="form-input mapping-input"
                          size="small"
                        ></el-input>
                      </el-col>
                      <el-col :span="3" class="mapping-col text-center">
                        <el-button
                          type="text"
                          @click="removeMappingRow(index)"
                          :disabled="apiConfigForm.fieldMappings.length <= 1"
                          class="text-btn danger-btn"
                          size="small"
                        >
                          <i class="el-icon-delete"></i> 删除
                        </el-button>
                      </el-col>
                    </div>
                  </div>
                </el-scrollbar>
              </div>
            </el-form-item>

            <!-- 手动设置汇率关系（核心修改：下拉框长度一致 + 仅显示下拉框 + 增加底部间距） -->
            <el-form-item required class="form-item rate-rel-form-item">
              <label class="form-item-label">手动设置汇率关系</label>
              <!-- 仅保留下拉框容器，无多余元素 -->
              <div class="rate-rel-content">
                <el-select
                  ref="sourceCurrencySelectRef"
                  v-model="apiConfigForm.sourceCurrencyField"
                  placeholder="源货币字段"
                  class="form-input rate-rel-selector"
                  :teleported="true"
                  popper-class="custom-select-popper"
                  :popper-options="{
                    placement: 'bottom-start',
                    modifiers: [
                      { name: 'offset', options: { offset: [0, 4] } },
                      { name: 'width', options: { minWidth: '100%', maxWidth: '100%' } } // 新增：强制宽度匹配
                    ]
                  }"
                >
                  <el-option
                    v-for="field in mappingFieldOptions"
                    :key="field"
                    :label="field"
                    :value="field"
                  ></el-option>
                </el-select>
                <el-select
                  ref="targetCurrencySelectRef"
                  v-model="apiConfigForm.targetCurrencyField"
                  placeholder="目标货币字段"
                  class="form-input rate-rel-selector"
                  :teleported="true"
                  popper-class="custom-select-popper"
                  :popper-options="{
                    placement: 'bottom-start',
                    modifiers: [
                      { name: 'offset', options: { offset: [0, 4] } },
                      { name: 'width', options: { minWidth: '100%', maxWidth: '100%' } } // 新增：强制宽度匹配
                    ]
                  }"
                >
                  <el-option
                    v-for="field in mappingFieldOptions"
                    :key="field"
                    :label="field"
                    :value="field"
                  ></el-option>
                </el-select>
                <el-select
                  ref="exchangeRateSelectRef"
                  v-model="apiConfigForm.exchangeRateField"
                  placeholder="汇率字段"
                  class="form-input rate-rel-selector"
                  :teleported="true"
                  popper-class="custom-select-popper"
                  :popper-options="{
                    placement: 'bottom-start',
                    modifiers: [
                      { name: 'offset', options: { offset: [0, 4] } },
                      { name: 'width', options: { minWidth: '100%', maxWidth: '100%' } } // 新增：强制宽度匹配
                    ]
                  }"
                >
                  <el-option
                    v-for="field in mappingFieldOptions"
                    :key="field"
                    :label="field"
                    :value="field"
                  ></el-option>
                </el-select>
              </div>
              <el-alert
                v-if="showRateWarning"
                title="请设置并确认汇率关系后才能保存配置"
                type="warning"
                size="small"
                class="mt-2 rate-rel-alert"
                show-icon
              ></el-alert>
            </el-form-item>

            <!-- 保存按钮（增加顶部间距） -->
            <el-form-item class="form-item save-btn-item">
              <el-button
                type="primary"
                class="operate-btn w-full"
                @click="saveApiConfig"
                icon="el-icon-save"
              >
                保存配置
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-col>

      <!-- 右侧：API管理 -->
      <el-col :xs="24" :lg="12" class="table-col">
        <div class="table-card">
          <div class="form-header">
            <div class="form-title">API管理</div>
          </div>

          <!-- 实时汇率测试 -->
      <div class="rate-test-card mb-6">
        <div class="card-header">
          <div class="font-medium">汇率实时测试</div>
        </div>
        <div class="live-rate-display text-center p-4 bg-f5f5f5 rounded-md mb-4">
          <span class="text-xl font-bold text-green-700">
            {{ liveRateInfo.rateText || '1 源货币 = 汇率 目标货币' }}
          </span>
          <p class="text-sm text-gray-500 mt-1">
            最后更新: {{ liveRateInfo.updateTime || '未获取' }}
          </p>
        </div>
        <div class="flex gap-2">
          <el-button
            type="primary"
            class="operate-btn flex-1"
            @click="fetchLiveRate"
            icon="el-icon-refresh"
          >
            获取实时汇率
          </el-button>
          <el-button
            type="success"
            class="operate-btn flex-1"
            @click="syncExchangeRate"
            icon="el-icon-sync"
            :disabled="!selectedApiId"
          >
            同步汇率
          </el-button>
        </div>
      </div>

          <!-- 已保存API列表（支持换行、自适应宽度） -->
          <div class="saved-api-card mb-6">
            <div class="card-header">
              <div class="font-medium">已保存的API</div>
            </div>
            <!-- 弹性容器：自动换行 + 自适应高度 -->
            <div class="saved-api-container">
              <div class="saved-api-list">
                <!-- 核心修改1：添加点击事件，主动设置选中状态 -->
                <div
                  v-for="api in savedApiList"
                  :key="api.api_id"
                  class="api-item flex mb-3 mr-3 p-3 border rounded-lg cursor-pointer"
                  :class="selectedApiId === api.api_id ? 'selected-api-item' : ''"
                  @click="selectApiItem(api.api_id)"
                >
                  <div class="flex items-center gap-3 w-full">
                    <!-- 核心修改2：恢复单选框可见性，确保交互有效 -->
                    <el-radio
                      v-model="selectedApiId"
                      :label="api.api_id"
                      class="api-radio"
                      @click.stop
                    ></el-radio>
                    <!-- API信息：自适应内容宽度 -->
                    <div class="api-info flex-1">
                      <p class="font-medium api-name">{{ api.api_name }}</p>
                      <p class="text-sm text-gray-500 api-url">{{ api.api_url }}</p>
                      <p class="text-sm api-status mt-1">
                        状态:
                        <span :class="getApiStatusClass(api.active_status)">
                          {{ api.active_status === 1 ? '活跃' : '未活跃' }}
                        </span>
                        /
                        <span :class="getConnectStatusClass(api.connect_status)">
                          {{ api.connect_status === 0 ? '未测试' : api.connect_status === 1 ? '连接成功' : '连接失败' }}
                        </span>
                      </p>
                    </div>
                    <!-- 删除按钮 -->
                    <el-button
                      type="text"
                      @click.stop="deleteApi(api.api_id)"
                      class="text-btn danger-btn api-del-btn"
                      icon="el-icon-delete"
                      size="small"
                    >
                      删除
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
            <el-button
              type="primary"
              class="operate-btn w-full mt-4"
              @click="setActiveApi"
              icon="el-icon-check"
              :disabled="!selectedApiId"
            >
              使用选中的API
            </el-button>
          </div>

          <!-- 当前活跃API信息 -->
          <div class="active-api-card">
            <div class="card-header">
              <div class="font-medium">当前活跃API</div>
            </div>
            <div v-if="activeApiInfo" class="active-api-info">
              <el-row :gutter="15" class="active-api-row mb-3">
                <el-col :span="12" class="active-api-col">
                  <label class="active-api-label text-left">API名称</label>
                  <p class="font-medium active-api-value text-left">{{ activeApiInfo.api_name }}</p>
                </el-col>
                <el-col :span="12" class="active-api-col">
                  <label class="active-api-label text-left">API地址</label>
                  <p class="font-medium text-sm truncate active-api-value text-left">{{ activeApiInfo.api_url }}</p>
                </el-col>
                <el-col :span="12" class="active-api-col">
                  <label class="active-api-label text-left">最后同步时间</label>
                  <p class="font-medium active-api-value text-left">{{ formatTime(activeApiInfo.last_sync_time) || '未同步' }}</p>
                </el-col>
                <el-col :span="12" class="active-api-col">
                  <label class="active-api-label text-left">状态</label>
                  <p class="font-medium text-green-600 active-api-value text-left">正常</p>
                </el-col>
              </el-row>
            </div>
            <div v-else class="no-active-api">
              <p class="text-gray-500 text-left py-4">暂无活跃的汇率API</p>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- API测试结果模态框 -->
    <el-dialog
      v-model="testResultModalVisible"
      title="API测试结果"
      width="800px"
      top="20px"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <div v-if="testResult.success" class="test-success text-center">
        <el-icon class="success-icon"><CircleCheck /></el-icon>
        <div class="success-title">API请求成功</div>
        <el-descriptions :column="2" border class="mt-3 mx-auto" style="max-width: 600px;">
          <el-descriptions-item label="连接状态">
            已成功连接到API服务器
          </el-descriptions-item>
          <el-descriptions-item label="响应状态">
            HTTP {{ testResult.responseCode }} OK
          </el-descriptions-item>
        </el-descriptions>
        <div class="mt-4">
          <div class="font-medium mb-2 text-center">字段映射结果</div>
          <el-table
            :data="testResult.mappingResults"
            border
            :header-cell-style="{ background: '#f8f9fa', color: '#333', fontWeight: '600', textAlign: 'center' }"
            :cell-style="{ verticalAlign: 'middle', textAlign: 'center' }"
            size="small"
            style="margin: 0 auto; max-width: 700px;"
          >
            <el-table-column prop="targetField" label="目标字段" align="center"></el-table-column>
            <el-table-column prop="dataPath" label="数据路径" align="center"></el-table-column>
            <el-table-column prop="extractedValue" label="提取值" align="center"></el-table-column>
          </el-table>
        </div>
        <div class="mt-4">
          <div class="font-medium mb-2 text-center">原始响应数据（已标记映射字段）</div>
          <el-scrollbar height="200px" style="max-width: 700px; margin: 0 auto;">
            <pre class="raw-response-text" v-html="testResult.rawResponse"></pre>
          </el-scrollbar>
        </div>
      </div>
      <div v-else class="test-error text-center">
        <el-icon class="error-icon"><CircleClose /></el-icon>
        <div class="error-title">操作失败</div>
        <p class="error-message mt-2">{{ testResult.errorMsg }}</p>
        <div v-if="testResult.errorDetails" class="mt-2">
          <div class="font-medium mb-1 text-center">错误详情</div>
          <el-scrollbar height="150px" style="max-width: 700px; margin: 0 auto;">
            <pre class="error-details-text">{{ testResult.errorDetails }}</pre>
          </el-scrollbar>
        </div>
      </div>
      <template #footer>
        <div style="text-align: center; width: 100%;">
          <el-button class="operate-btn cancel-btn" @click="testResultModalVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
/* 全局容器：优化背景 & 内边距 */
.exchange-rate-container {
  padding: 20px;
  background: #f8f9fa;
  min-height: 100vh;
  box-sizing: border-box;
}

/* 主行布局：更自然的分栏 */
.main-row {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  width: 100%;
  overflow: visible !important; /* 关键：取消裁剪 */
}

/* 列布局：大屏幕平分，小屏幕占满 */
.form-col, .table-col {
  flex: 1 1 calc(50% - 12px);
  min-width: 360px;
  max-width: calc(50% - 12px);
  box-sizing: border-box;
  overflow: visible !important; /* 关键：取消裁剪 */
}

/* 卡片基础样式：优化阴影 & 圆角 */
.form-card, .table-card {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  padding: 24px;
  box-sizing: border-box;
  width: 100%;
  overflow: visible !important; /* 关键：取消裁剪 */
}

/* 表单标题：强化层级 */
.form-header {
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f2f5;
}
.form-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

/* 表单项：优化间距 & 标签样式 */
.form-item {
  margin-bottom: 24px;
  width: 100%;
}
.form-item-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  text-align: left;
}

/* 输入框/下拉框通用样式：宽度100%，统一视觉 */
.form-input {
  height: 40px !important;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  box-sizing: border-box;
  transition: all 0.2s;
  width: 100% !important;
}
.form-input:focus {
  border-color: #67c23a;
  box-shadow: 0 0 0 2px rgba(103, 194, 58, 0.2);
}

/* ========== 核心：请求方法下拉框样式（与输入框完全一致） ========== */
:deep(.request-method-select) {
  border: 1px solid #e5e7eb !important;
  background: #fff !important;
  box-shadow: none !important;
  overflow: visible !important;
}
/* 下拉框内部输入框样式 */
:deep(.request-method-select .el-input__inner) {
  height: 100% !important;
  border: none !important;
  background: transparent !important;
  padding: 0 12px !important;
  box-shadow: none !important;
  color: #333 !important;
  font-size: 14px !important;
}
/* 下拉框外层容器样式 */
:deep(.request-method-select .el-select__wrapper) {
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
  overflow: visible !important;
}
/* 下拉箭头样式 */
:deep(.request-method-select .el-input__suffix) {
  color: #909399 !important;
  pointer-events: auto !important;
}

/* ========== 核心修改：下拉选项框样式 - 强制宽度与下拉框完全一致 ========== */
:global(.custom-select-popper) {
  z-index: 999999 !important; /* 提升层级 */
  width: 100% !important; /* 强制宽度100%匹配下拉框 */
  min-width: 100% !important;
  max-width: 100% !important;
  margin-top: 4px !important;
  border: 1px solid #e5e7eb !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1) !important;
  background: #fff !important;
  padding: 4px 0 !important;
  box-sizing: border-box !important;
  left: 0 !important; /* 强制左对齐下拉框 */
  transform: none !important; /* 取消默认位移 */
}

/* 下拉选项容器：强制宽度100%，防止内容撑开 */
:global(.custom-select-popper .el-select-dropdown) {
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}

/* 下拉选项样式：处理长文本，自动换行 */
:global(.custom-select-popper .el-select-dropdown__item) {
  padding: 8px 16px !important;
  font-size: 14px !important;
  width: 100% !important;
  box-sizing: border-box !important;
  white-space: normal !important; /* 取消单行限制，允许换行 */
  word-wrap: break-word !important; /* 长单词换行 */
  word-break: break-all !important; /* 强制换行 */
  line-height: 1.4 !important; /* 调整行高，优化换行显示 */
  min-height: 40px !important; /* 最小高度，保证点击区域 */
  display: flex !important;
  align-items: center !important;
}

/* 下拉选项hover/选中样式 */
:global(.custom-select-popper .el-select-dropdown__item:hover) {
  background: #f5f7fa !important;
  color: #67c23a !important;
}
:global(.custom-select-popper .el-select-dropdown__item.selected) {
  color: #67c23a !important;
  font-weight: 500 !important;
}

/* ========== 汇率关系下拉框样式 + 增加与保存按钮的间距 ========== */
.rate-rel-form-item {
  margin-bottom: 32px !important; /* 核心：增加汇率下拉框区域底部间距，拉开与保存按钮的距离 */
}
.rate-rel-content {
  display: flex;
  gap: 8px;
  width: 100%;
}
/* 汇率下拉框：继承form-input样式，平分宽度 */
:deep(.rate-rel-selector) {
  flex: 1;
  border: 1px solid #e5e7eb !important;
  background: #fff !important;
  box-shadow: none !important;
  overflow: visible !important;
}
:deep(.rate-rel-selector .el-input__inner) {
  height: 100% !important;
  border: none !important;
  background: transparent !important;
  padding: 0 12px !important;
}
:deep(.rate-rel-selector .el-select__wrapper) {
  border: none !important;
  box-shadow: none !important;
  overflow: visible !important;
}

/* 保存按钮：增加顶部间距（双重保障） */
.save-btn-item {
  margin-top: 8px !important;
}

/* 取消所有父元素的overflow裁剪（核心） */
:global(.mapping-single-card) {
  background: #ffffff;
  border: 1px solid #f0f2f5;
  border-radius: 8px;
  box-sizing: border-box;
  overflow: visible !important; /* 关键：取消裁剪 */
}

/* 修复滚动容器层级 */
:deep(.el-scrollbar) {
  z-index: 1;
  overflow: visible !important;
}
:deep(.el-scrollbar__wrap) {
  overflow-x: hidden !important;
  width: 100%;
}

/* 按钮样式：统一绿色系 & 圆角 */
.operate-btn {
  height: 40px;
  padding: 0 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}
:deep(.operate-btn) {
  --el-button-text-color: #fff;
  --el-button-bg-color: #67c23a;
  --el-button-hover-bg-color: #85ce61;
  --el-button-active-bg-color: #52c41a;
  --el-button-border-color: #67c23a;
}
.cancel-btn {
  background: #f5f7fa !important;
  color: #67c23a !important;
  border: 1px solid #67c23a !important;
}
.cancel-btn:hover {
  background: #e8f5e9 !important;
  color: #52c41a !important;
}

/* 文本按钮：优化颜色 */
.text-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #67c23a;
  font-size: 14px;
  transition: color 0.2s;
}
.danger-btn {
  color: #f56c6c !important;
}
.danger-btn:hover {
  color: #f78989 !important;
}

/* 参数区域：优化卡片样式 */
.param-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  box-sizing: border-box;
  width: 100%;
  margin-bottom: 10px;
}
.param-scrollbar {
  width: 100%;
  background: #ffffff;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #f0f2f5;
}
.param-row {
  width: 100%;
  align-items: center;
}
.param-del-btn {
  width: 80px;
  flex-shrink: 0;
}

/* 提示文本：更柔和的样式 */
.text-tips {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.5;
  margin-top: 8px;
}

/* 测试结果卡片：优化间距 */
.test-result-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  box-sizing: border-box;
  width: 100%;
}
.test-result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  width: 100%;
}
.result-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: left;
  width: 100%;
}
.result-label {
  font-size: 12px;
  color: #6b7280;
  text-align: left;
}
.result-value {
  padding: 8px 12px;
  border-radius: 6px;
  min-height: 36px;
  line-height: 1.5;
  background: #ffffff;
  border: 1px solid #f0f2f5;
  text-align: left;
  width: 100%;
}
.raw-response-scroll {
  background: #ffffff;
  padding: 12px;
  border-radius: 6px;
  font-size: 12px;
  border: 1px solid #f0f2f5;
  text-align: left;
  width: 100%;
}

/* 映射区域：优化布局 */
.mapping-btn {
  flex: 1;
  min-width: 120px;
}
.mapping-header {
  display: flex;
  width: 100%;
}
.mapping-header-row {
  background: #f8f9fa;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f2f5;
  width: 100%;
}
.mapping-header-col {
  box-sizing: border-box;
  text-align: center;
}
.mapping-header-text {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  text-align: center;
  display: block;
}
.mapping-rows-container {
  padding: 8px 16px;
  width: 100%;
}
.mapping-row {
  width: 100%;
  padding: 8px 0;
  border-bottom: 1px solid #f0f2f5;
  align-items: center;
  justify-content: center;
}
.mapping-col {
  box-sizing: border-box;
  padding: 0 5px !important;
}
.mapping-input {
  width: 100%;
  box-sizing: border-box;
  height: 36px !important;
}

/* 汇率关系区域：优化间距 */
.rate-rel-alert {
  width: 100%;
  margin-top: 8px !important;
}

/* 右侧卡片通用样式：优化间距 & 边框 */
.rate-test-card, .saved-api-card, .active-api-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #f0f2f5;
  padding: 20px;
  box-sizing: border-box;
  width: 100%;
}
.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f2f5;
}

/* 实时汇率展示：优化背景 */
.live-rate-display {
  font-size: 16px;
  border-radius: 8px;
  background: #f0f9ff !important;
  text-align: center;
  width: 100%;
}

/* ========== 已保存API列表样式（支持换行+自适应） ========== */
.saved-api-container {
  padding: 8px 0;
  width: 100%;
  /* 限制最大高度，超出则垂直滚动（可选） */
  max-height: 300px;
  overflow-y: auto;
}
.saved-api-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px; /* 卡片之间的间距 */
  width: 100%;
}
/* API卡片：自适应内容宽度 + 换行 */
.api-item {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-sizing: border-box;
  width: auto; /* 自适应内容宽度 */
  max-width: calc(50% - 6px); /* 最多占容器一半，避免过宽 */
  align-items: flex-start;
  transition: all 0.2s ease;
}
/* API项hover效果 */
.api-item:hover {
  border-color: #67c23a;
  box-shadow: 0 2px 8px rgba(103, 194, 58, 0.1);
}
/* 选中状态的API卡片 */
.selected-api-item {
  border-color: #52c41a;
  background-color: #f6ffed;
  box-shadow: 0 2px 8px rgba(103, 194, 58, 0.15);
}
/* API卡片内部布局 */
.api-item .flex {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
/* API信息：不强制截断，自适应宽度 */
.api-info {
  min-width: 0;
}
.api-name {
  margin: 0 0 4px 0;
  color: #1f2937;
  font-size: 14px;
}
.api-url {
  margin: 0 0 6px 0;
  font-size: 12px;
  color: #6b7280;
  word-break: break-all; /* 长URL自动换行 */
}
.api-status {
  margin: 0;
  color: #4b5563;
  font-size: 12px;
}
/* 单选框样式 */
:deep(.api-radio) {
  margin: 0;
  flex-shrink: 0;
}
:deep(.api-radio .el-radio__input) {
  opacity: 1 !important;
  width: auto !important;
  height: auto !important;
}
/* 单选按钮：紧凑排列 */
.api-radio {
  flex-shrink: 0;
  margin-top: 2px;
}
/* 删除按钮：固定在右侧 */
.api-del-btn {
  flex-shrink: 0;
  width: auto;
  padding: 0 8px;
}

/* 活跃API信息：优化排版 */
.active-api-row {
  margin-bottom: 12px !important;
  width: 100%;
}
.active-api-col {
  margin-bottom: 12px;
  width: 100%;
}
.active-api-label {
  display: block;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}
.active-api-value {
  margin: 0;
  color: #1f2937;
}

/* 无数据样式：更柔和 */
.no-active-api {
  padding: 32px 0;
  color: #9ca3af;
  width: 100%;
}

/* 模态框样式：优化间距 */
.test-success, .test-error {
  padding: 16px 0;
  text-align: center;
  width: 100%;
}
.success-icon {
  color: #67c23a;
  font-size: 32px;
  margin-bottom: 12px;
  display: inline-block;
}
.success-title {
  color: #67c23a;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  text-align: center;
}
.error-icon {
  color: #f56c6c;
  font-size: 32px;
  margin-bottom: 12px;
  display: inline-block;
}
.error-title {
  color: #f56c6c;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  text-align: center;
}
.error-message {
  color: #f56c6c;
  font-size: 14px;
  line-height: 1.5;
  text-align: center;
}
.error-details-text {
  background: #fef0f0;
  padding: 12px;
  border-radius: 8px;
  font-size: 12px;
  color: #f56c6c;
  line-height: 1.5;
  text-align: left;
  width: 100%;
}

/* 高亮样式 */
.highlight {
  background-color: #fff7e6;
  color: #ff9800;
  padding: 0 4px;
  border-radius: 4px;
  font-weight: 600;
}

/* 响应式适配：小屏幕下样式调整 */
@media (max-width: 768px) {
  .exchange-rate-container {
    padding: 16px;
  }
  .form-card, .table-card {
    padding: 16px;
  }
  .form-col, .table-col {
    flex: 1 1 100%;
    max-width: 100%;
    min-width: 320px;
  }
  .param-row {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  .param-del-btn {
    width: 100%;
    justify-content: center;
  }
  .mapping-header {
    flex-direction: column;
    gap: 8px;
  }
  .mapping-btn {
    width: 100%;
  }
  .mapping-header-row {
    display: none;
  }
  .mapping-row {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    padding: 12px 0;
  }
  .mapping-col {
    width: 100% !important;
    margin-bottom: 8px;
    text-align: center;
  }
  /* 小屏幕下汇率下拉框垂直排列 */
  .rate-rel-content {
    flex-direction: column;
    gap: 8px;
  }
  :deep(.rate-rel-selector) {
    width: 100% !important;
  }
  /* 小屏幕下API卡片占满宽度 */
  .api-item {
    max-width: 100%;
  }
  .api-item .flex {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .api-del-btn {
    width: 100%;
    justify-content: flex-start;
    margin-top: 4px;
  }
  /* 小屏幕下汇率下拉框与保存按钮间距调整 */
  .rate-rel-form-item {
    margin-bottom: 24px !important;
  }
}

/* 修复Element UI默认样式 */
:deep(.el-row) {
  margin: 0 !important;
  width: 100%;
}
:deep(.el-col) {
  box-sizing: border-box;
}
:deep(.el-form-item) {
  margin-bottom: 0 !important;
}
:deep(.el-alert) {
  --el-alert-padding: 8px 16px;
  --el-alert-border-radius: 8px;
  width: 100%;
}

/* 自定义工具类 */
.bg-f5f5f5 {
  background-color: #f5f5f5;
}
.flex {
  display: flex;
}
.justify-between {
  justify-content: space-between;
}
.items-center {
  align-items: center;
}
.gap-2 {
  gap: 8px;
}
.gap-12 {
  gap: 12px;
}
.mb-2 {
  margin-bottom: 8px;
}
.mb-3 {
  margin-bottom: 12px;
}
.mb-4 {
  margin-bottom: 16px;
}
.mb-6 {
  margin-bottom: 24px;
}
.w-full {
  width: 100%;
}
.flex-1 {
  flex: 1;
}
.block {
  display: block;
}
.text-center {
  text-align: center;
}
.text-left {
  text-align: left;
}
.text-sm {
  font-size: 12px;
}
.text-xl {
  font-size: 18px;
}
.font-bold {
  font-weight: 700;
}
.font-medium {
  font-weight: 500;
}
.text-green-700 {
  color: #52c41a;
}
.text-green-600 {
  color: #67c23a;
}
.text-gray-500 {
  color: #909399;
}
.p-3 {
  padding: 12px;
}
.p-4 {
  padding: 16px;
}
.rounded-lg {
  border-radius: 8px;
}
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.align-items-center {




  align-items: center;
}
.cursor-pointer {
  cursor: pointer;
}
</style>

<script setup>
import { ref, reactive, onMounted, computed, getCurrentInstance } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CircleCheck, CircleClose } from '@element-plus/icons-vue'

// ========== 核心修改：获取全局axios实例（复用main.js中配置好的axios） ==========
const { proxy } = getCurrentInstance()
const $axios = proxy.$axios // 直接使用main.js挂载的全局axios

// 表单数据
const apiConfigForm = reactive({
  apiId: '', // 编辑时的API ID
  apiName: '',
  apiUrl: '',
  requestMethod: 'get',
  apiParamsList: [{ key: '', value: '' }], // API参数列表
  fieldMappings: [
    {
      originalFieldPath: '',
      fieldName: '',
      fieldValue: '',
      fieldDesc: ''
    },
    {
      originalFieldPath: '',
      fieldName: '',
      fieldValue: '',
      fieldDesc: ''
    },
    {
      originalFieldPath: '',
      fieldName: '',
      fieldValue: '',
      fieldDesc: ''
    }
  ], // 字段映射列表
  sourceCurrencyField: '',
  targetCurrencyField: '',
  exchangeRateField: ''
})

// 连接测试结果
const connectionResult = reactive({
  status: '',
  responseCode: '',
  originalResponse: '',
  lastSyncTime: null // 存储最后同步时间
})

// 映射字段选项（动态生成）
const mappingFieldOptions = computed(() => {
  return apiConfigForm.fieldMappings.map(item => {
    if (!item.fieldName) return ''
    return item.fieldName + ' - 这是一个非常长的字段名称用于测试下拉框选项宽度是否和下拉框一致'
  }).filter(Boolean)
})

// 显示汇率警告
const showRateWarning = ref(false)

// 已保存API列表 - 初始化为空数组，避免undefined导致渲染异常
const savedApiList = ref([])
// 选中的API ID（初始为null，严格匹配后端数字类型）
const selectedApiId = ref(null)
// 当前活跃API信息
const activeApiInfo = ref(null)
// 实时汇率信息
const liveRateInfo = reactive({
  rateText: '',
  updateTime: ''
})

// 测试结果模态框
const testResultModalVisible = ref(false)
const testResult = reactive({
  success: false,
  responseCode: '',
  mappingResults: [],
  rawResponse: '',
  errorMsg: '',
  errorDetails: ''
})

// 表单引用
const apiConfigFormRef = ref(null)

// 下拉框引用（保留用于扩展）
const requestMethodSelectRef = ref(null)
const sourceCurrencySelectRef = ref(null)
const targetCurrencySelectRef = ref(null)
const exchangeRateSelectRef = ref(null)

// ========== 核心方法：选中API项（强制类型统一） ==========
const selectApiItem = (apiId) => {
  // 强制转换为数字类型，确保与后端返回的api_id（数字）严格匹配
  selectedApiId.value = Number(apiId)
  console.log('选中的API ID（数字类型）：', selectedApiId.value)
}

// ========== 删除API（删除后刷新列表，重置选中状态） ==========
const deleteApi = async (apiId) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除该API配置吗？此操作不可恢复！',
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    // 调用删除接口
    await $axios.delete(`/exchange/config/${apiId}/`)
    ElMessage.success('API配置删除成功')

    // 清空选中状态（如果删除的是选中的API）
    if (selectedApiId.value === Number(apiId)) {
      selectedApiId.value = null
    }

    // 清空活跃API（如果删除的是活跃API）
    if (activeApiInfo.value && activeApiInfo.value.api_id === Number(apiId)) {
      activeApiInfo.value = null
    }

    // 重新加载API列表，确保数据实时同步
    await loadSavedApiList()
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('删除API失败：' + (err.message || '未知错误'))
      console.error('删除API异常：', err)
    } else {
      ElMessage.info('已取消删除')
    }
  }
}

// ========== 手动同步汇率（更新最后同步时间） ==========
const syncExchangeRate = async () => {
  if (!selectedApiId.value) {
    ElMessage.warning('请先选择一个API')
    return
  }

  try {
    const res = await $axios.post(`/exchange/config/${selectedApiId.value}/sync_exchange_rate/`)
    if (res.status === 'success') {
      // 更新API列表中的最后同步时间
      const apiIndex = savedApiList.value.findIndex(item => item.api_id === selectedApiId.value)
      if (apiIndex !== -1) {
        savedApiList.value[apiIndex].last_sync_time = res.last_sync_time
      }
      // 更新活跃API信息
      if (activeApiInfo.value && activeApiInfo.value.api_id === selectedApiId.value) {
        activeApiInfo.value.last_sync_time = res.last_sync_time
      }
      // 更新实时汇率区域的时间
      liveRateInfo.updateTime = formatTime(res.last_sync_time)
      ElMessage.success('汇率同步成功')
    } else {
      ElMessage.error('汇率同步失败：' + res.error)
    }
  } catch (err) {
    ElMessage.error('同步汇率失败：' + (err.response?.data?.error || err.message))
  }
}

// ========== 基础方法：参数行操作 ==========
// 添加参数行
const addParamRow = () => {
  apiConfigForm.apiParamsList.push({ key: '', value: '' })
}

// 移除参数行
const removeParamRow = async (index) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除该参数吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    if (apiConfigForm.apiParamsList.length <= 1) {
      ElMessage.warning('至少保留一个参数项')
      return
    }
    apiConfigForm.apiParamsList.splice(index, 1)
    ElMessage.success('参数删除成功')
  } catch (err) {
    ElMessage.info('已取消删除参数')
    console.debug('取消删除参数原因：', err)
  }
}

// ========== 基础方法：映射行操作 ==========
// 添加映射行
const addMappingRow = () => {
  apiConfigForm.fieldMappings.push({
    originalFieldPath: '',
    fieldName: '',
    fieldValue: '',
    fieldDesc: ''
  })
}

// 移除映射行
const removeMappingRow = async (index) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除该映射吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    if (apiConfigForm.fieldMappings.length <= 1) {
      ElMessage.warning('至少保留一个映射项')
      return
    }
    apiConfigForm.fieldMappings.splice(index, 1)
    ElMessage.success('映射删除成功')
  } catch (err) {
    ElMessage.info('已取消删除映射')
    console.debug('取消删除映射原因：', err)
  }
}

// ========== 工具方法：时间格式化（容错处理） ==========
const formatTime = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return '-'
  try {
    const date = new Date(timeStr)
    if (isNaN(date.getTime())) return '-'
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
  } catch (err) {
    console.error('时间格式化失败：', err)
    return '-'
  }
}

// ========== 工具方法：样式类计算 ==========
// 获取API状态样式
const getApiStatusClass = (status) => {
  return status === 1 ? 'text-green-600' : 'text-gray-500'
}

// 获取连接状态样式
const getConnectStatusClass = (status) => {
  if (status === 1) return 'text-green-600'
  if (status === 2) return 'text-red-600'
  return 'text-gray-500'
}

// 连接状态样式计算属性
const connectionStatusClass = computed(() => {
  if (connectionResult.status === '成功') return 'text-green-600'
  if (connectionResult.status === '失败') return 'text-red-600'
  return 'text-gray-500'
})

// ========== 强化版：加载已保存的API列表（修复数据格式异常） ==========
const loadSavedApiList = async () => {
  try {
    console.log('【API列表加载】开始请求 /exchange/config/ 接口');
    // 发起请求（使用全局axios实例）
    const res = await $axios.get('/exchange/config/');

    // 直接取后端返回的数组（后端已关闭分页）
    let apiListData = res;
    console.log('【接口原始返回】', apiListData);

    // 核心校验——必须是数组，否则兜底为空数组
    if (!Array.isArray(apiListData)) {
      console.error('【API列表异常】返回非数组数据：', apiListData);
      ElMessage.warning('API列表数据格式异常（非数组），已自动兜底');
      apiListData = [];
    }

    // 安全格式化数组内的每个API项
    const formattedApiList = apiListData.map(api => {
      try {
        // 容错：确保API项是对象
        if (typeof api !== 'object' || api === null) {
          console.warn('【API项异常】非对象数据，跳过格式化：', api);
          return { api_id: Math.random(), api_name: '异常数据', api_url: '', active_status: 0, connect_status: 0 };
        }

        // 解析JSON字符串字段（api_params/original_response）
        api.api_params = api.api_params ? (() => {
          try { return JSON.parse(api.api_params) }
          catch (e) { return {} }
        })() : {};

        api.original_response = api.original_response ? (() => {
          try { return JSON.parse(api.original_response) }
          catch (e) { return api.original_response }
        })() : null;

        // 强制api_id为数字（避免选中异常）
        api.api_id = api.api_id ? Number(api.api_id) : Math.random();

        return api;
      } catch (err) {
        console.error('【API项格式化失败】', err, '原始数据：', api);
        return {
          api_id: Math.random(),
          api_name: '解析失败的API',
          api_url: api.api_url || '',
          active_status: 0,
          connect_status: 0
        };
      }
    });

    // 赋值并反馈
    savedApiList.value = formattedApiList;
    console.log(`【API列表加载成功】共${formattedApiList.length}条数据`, formattedApiList);
    ElMessage.success(`成功加载${formattedApiList.length}条API配置`);

  } catch (err) {
    // 网络/接口报错的终极兜底
    savedApiList.value = [];
    ElMessage.error(`加载API列表失败：${err.message || '网络请求异常'}`);
    console.error('【API列表加载异常】', err);
  }
};

// ========== 核心方法：加载当前活跃API ==========
const loadActiveApi = async () => {
  try {
    const res = await $axios.get('/exchange/config/active_api/')
    if (res) {
      activeApiInfo.value = res
      // 统一类型，确保选中状态匹配
      if (res.api_id) {
        selectedApiId.value = Number(res.api_id)
      }
      console.log('活跃API加载成功：', activeApiInfo.value)
    }
  } catch (err) {
    activeApiInfo.value = null
    ElMessage.warning('暂无活跃API')
    console.debug('加载活跃API异常：', err)
  }
}

// ========== 业务方法：测试API连接 ==========
const testConnection = async () => {
  if (!apiConfigForm.apiUrl) {
    ElMessage.warning('请先填写API地址')
    return
  }

  // 构造临时API ID（新增时用临时ID，编辑时用已有ID）
  let tempApiId = ''
  if (!apiConfigForm.apiId) {
    try {
      const saveRes = await $axios.post('/exchange/config/', {
        api_name: apiConfigForm.apiName || '临时测试API',
        api_url: apiConfigForm.apiUrl,
        request_method: apiConfigForm.requestMethod,
        api_params: JSON.stringify(apiConfigForm.apiParamsList.reduce((obj, item) => {
          if (item.key) obj[item.key] = item.value
          return obj
        }, {}))
      })
      tempApiId = saveRes.api_id
    } catch (err) {
      ElMessage.error('临时保存配置失败：' + err.message)
      return
    }
  }

  try {
    const res = await $axios.post(`/exchange/config/${apiConfigForm.apiId || tempApiId}/test_connection/`)
    connectionResult.status = res.connect_status
    connectionResult.responseCode = res.response_code
    connectionResult.originalResponse = res.original_response
    connectionResult.lastSyncTime = res.last_sync_time
    ElMessage.success('连接测试成功')

    // 更新API列表中的最后同步时间
    if (res.last_sync_time && (apiConfigForm.apiId || tempApiId)) {
      const targetApiId = Number(apiConfigForm.apiId || tempApiId)
      const apiIndex = savedApiList.value.findIndex(item => item.api_id === targetApiId)
      if (apiIndex !== -1) {
        savedApiList.value[apiIndex].last_sync_time = res.last_sync_time
      }
      // 同步更新活跃API的最后同步时间
      if (activeApiInfo.value && activeApiInfo.value.api_id === targetApiId) {
        activeApiInfo.value.last_sync_time = res.last_sync_time
      }
    }

    // 删除临时API
    if (tempApiId) {
      await $axios.delete(`/exchange/config/${tempApiId}/`)
    }
  } catch (err) {
    connectionResult.status = '失败'
    connectionResult.responseCode = ''
    connectionResult.originalResponse = err.response?.data?.error || err.message
    connectionResult.lastSyncTime = null
    ElMessage.error('连接测试失败：' + err.message)

    // 删除临时API
    if (tempApiId) {
      await $axios.delete(`/exchange/config/${tempApiId}/`)
    }
  }
}

// ========== 业务方法：测试API映射 ==========
const testApiMapping = async () => {
  if (!apiConfigForm.apiUrl) {
    ElMessage.warning('请先填写API地址')
    return
  }

  testResultModalVisible.value = true
  try {
    // 先执行连接测试
    await testConnection()

    if (connectionResult.status !== '成功') {
      testResult.success = false
      testResult.errorMsg = 'API连接失败，无法测试映射'
      testResult.errorDetails = connectionResult.originalResponse
      return
    }

    // 解析映射结果
    const mappingResults = []
    let rawResponse = typeof connectionResult.originalResponse === 'object'
      ? JSON.stringify(connectionResult.originalResponse, null, 2)
      : connectionResult.originalResponse
    let responseData = {}
    try {
      responseData = JSON.parse(rawResponse)
    } catch (e) {
      console.debug('响应数据非JSON格式，跳过解析：', e)
    }

    // 提取字段值
    apiConfigForm.fieldMappings.forEach(mapping => {
      if (!mapping.originalFieldPath) return

      // 解析字段路径（支持data[0].value格式）
      let extractedValue = '-'
      try {
        const pathArr = mapping.originalFieldPath.replace(/\[(\d+)\]/g, '.$1').split('.')
        let value = responseData
        pathArr.forEach(key => {
          if (value && key in value) {
            value = value[key]
          } else {
            value = null
          }
        })
        extractedValue = value || '-'
      } catch (e) {
        extractedValue = '解析失败'
        console.debug('字段路径解析失败：', e)
      }

      mappingResults.push({
        targetField: mapping.fieldName,
        dataPath: mapping.originalFieldPath,
        extractedValue
      })

      // 高亮原始响应中的字段值
      if (extractedValue !== '-' && extractedValue !== '解析失败') {
        rawResponse = rawResponse.replace(
          new RegExp(String(extractedValue).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
          `<span class="highlight">${extractedValue}</span>`
        )
      }
    })

    testResult.success = true
    testResult.responseCode = connectionResult.responseCode
    testResult.mappingResults = mappingResults
    testResult.rawResponse = rawResponse
  } catch (err) {
    testResult.success = false
    testResult.errorMsg = '测试映射失败'
    testResult.errorDetails = err.message
    console.error('API映射测试异常：', err)
  }
}

// ========== 业务方法：保存API配置 ==========
const saveApiConfig = async () => {
  // 校验汇率关系
  if (!apiConfigForm.sourceCurrencyField || !apiConfigForm.targetCurrencyField || !apiConfigForm.exchangeRateField) {
    showRateWarning.value = true
    ElMessage.warning('请完整设置汇率关系字段')
    return
  }
  showRateWarning.value = false

  // 校验表单
  try {
    if (apiConfigFormRef.value) {
      await apiConfigFormRef.value.validate()
    }
  } catch (err) {
    ElMessage.warning('请完善表单必填项：' + err.message)
    return
  }

  // 构造提交数据
  const submitData = {
    api_name: apiConfigForm.apiName,
    api_url: apiConfigForm.apiUrl,
    request_method: apiConfigForm.requestMethod,
    api_params: JSON.stringify(apiConfigForm.apiParamsList.reduce((obj, item) => {
      if (item.key) obj[item.key] = item.value
      return obj
    }, {})),
    active_status: apiConfigForm.apiId ? apiConfigForm.active_status : 0
  }

  try {
    let res
    if (apiConfigForm.apiId) {
      // 编辑
      res = await $axios.put(`/exchange/config/${apiConfigForm.apiId}/`, submitData)
    } else {
      // 新增
      res = await $axios.post('/exchange/config/', submitData)
    }

    // 保存字段映射
    const apiId = res.api_id
    for (const mapping of apiConfigForm.fieldMappings) {
      if (!mapping.originalFieldPath || !mapping.fieldName) continue

      const mappingData = {
        api: apiId,
        original_field_path: mapping.originalFieldPath,
        field_name: mapping.fieldName,
        field_value: mapping.fieldValue,
        field_desc: mapping.fieldDesc
      }

      if (mapping.mapping_id) {
        await $axios.put(`/exchange/mapping/${mapping.mapping_id}/`, mappingData)
      } else {
        await $axios.post('/exchange/mapping/', mappingData)
      }
    }

    ElMessage.success('配置保存成功')
    // 重新加载API列表，确保新增/编辑后数据实时显示
    await loadSavedApiList()
    // 重置表单
    resetForm()
  } catch (err) {
    ElMessage.error('保存配置失败：' + (err.response?.data?.error || err.message))
    console.error('配置保存异常：', err)
  }
}

// ========== 业务方法：设置活跃API ==========
const setActiveApi = async () => {
  if (!selectedApiId.value) {
    ElMessage.warning('请先选择一个API')
    return
  }

  try {
    await $axios.post(`/exchange/config/${selectedApiId.value}/activate/`)
    ElMessage.success('已设置为活跃API')
    // 重新加载活跃API和列表，确保状态同步
    await loadActiveApi()
    await loadSavedApiList()
  } catch (err) {
    ElMessage.error('设置活跃API失败：' + err.message)
    console.error('设置活跃API异常：', err)
  }
}

// ========== 业务方法：获取实时汇率 ==========
const fetchLiveRate = async () => {
  if (!activeApiInfo.value) {
    ElMessage.warning('暂无活跃API，无法获取实时汇率')
    return
  }

  try {
    // 调用活跃API获取实时汇率
    const res = await $axios.post(`/exchange/config/${activeApiInfo.value.api_id}/test_connection/`)

    // 解析汇率（示例逻辑，根据实际API返回调整）
    let rateData = {}
    try {
      rateData = JSON.parse(res.original_response)
    } catch (e) {
      console.debug('实时汇率数据解析失败：', e)
      ElMessage.warning('汇率数据格式异常，使用默认值')
    }

    // 模拟汇率解析（实际需根据字段映射配置）
    liveRateInfo.rateText = `1 ${apiConfigForm.sourceCurrencyField || 'USD'} = ${rateData.conversion_rate || '7.2'} ${apiConfigForm.targetCurrencyField || 'CNY'}`
    // 使用last_sync_time而非当前时间，保证数据准确性
    liveRateInfo.updateTime = formatTime(res.last_sync_time || activeApiInfo.value.last_sync_time)
    ElMessage.success('获取实时汇率成功')
  } catch (err) {
    ElMessage.error('获取实时汇率失败：' + err.message)
    console.error('获取实时汇率异常：', err)
  }
}

// ========== 工具方法：重置表单 ==========
const resetForm = () => {
  apiConfigForm.apiId = ''
  apiConfigForm.apiName = ''
  apiConfigForm.apiUrl = ''
  apiConfigForm.requestMethod = 'get'
  apiConfigForm.apiParamsList = [{ key: '', value: '' }]
  apiConfigForm.fieldMappings = [
    {
      originalFieldPath: '',
      fieldName: '',
      fieldValue: '',
      fieldDesc: ''
    },
    {
      originalFieldPath: '',
      fieldName: '',
      fieldValue: '',
      fieldDesc: ''
    },
    {
      originalFieldPath: '',
      fieldName: '',
      fieldValue: '',
      fieldDesc: ''
    }
  ]
  apiConfigForm.sourceCurrencyField = ''
  apiConfigForm.targetCurrencyField = ''
  apiConfigForm.exchangeRateField = ''

  connectionResult.status = ''
  connectionResult.responseCode = ''
  connectionResult.originalResponse = ''
  connectionResult.lastSyncTime = null

  showRateWarning.value = false
  selectedApiId.value = null // 重置选中状态
  if (apiConfigFormRef.value) {
    apiConfigFormRef.value.resetFields()
  }
}

// ========== 生命周期：优化加载时序 ==========
onMounted(async () => {
  // 先加载API列表，再加载活跃API，保证数据顺序和渲染正确性
  await loadSavedApiList()
  await loadActiveApi()
})
</script>
