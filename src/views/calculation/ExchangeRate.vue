<template>
  <div class="exchange-rate-container">
    <el-row :gutter="24" class="main-row">
      <!-- 左侧：API配置表单 -->
      <el-col :xs="24" :lg="12" class="form-col">
        <div class="form-card">
          <div class="form-header">
            <div class="form-title">API配置</div>
          </div>

          <el-form
            ref="apiConfigFormRef"
            :model="apiConfigForm"
            label-width="0"
            class="api-config-form"
          >
            <el-form-item prop="apiName" required class="form-item">
              <label class="form-item-label">API名称</label>
              <el-input
                v-model="apiConfigForm.apiName"
                placeholder="例如：Open Exchange Rates"
                class="form-input"
              ></el-input>
            </el-form-item>

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
                <p>示例2（参数在查询串）：https://exchangerate.host/latest</p>
              </div>
            </el-form-item>

            <el-form-item prop="requestMethod" class="form-item">
              <label class="form-item-label">请求方法</label>
              <!-- 全新下拉框写法：无teleported、无复杂popper配置，原生控制层级和高度 -->
              <el-select
                ref="requestMethodSelectRef"
                v-model="apiConfigForm.requestMethod"
                class="form-input request-method-select"
                placeholder="请选择请求方法"
                popper-append-to-body="false"
                max-height="200px"
                style="width: 100%"
              >
                <el-option label="GET" value="get"></el-option>
                <el-option label="POST" value="post"></el-option>
              </el-select>
            </el-form-item>

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

            <el-form-item required class="form-item rate-rel-form-item">
              <label class="form-item-label">手动设置汇率关系</label>
              <div class="rate-rel-content">
                <!-- 全新下拉框写法：源货币字段 -->
                <el-select
                  ref="sourceCurrencySelectRef"
                  v-model="apiConfigForm.sourceCurrencyField"
                  placeholder="源货币字段"
                  class="form-input rate-rel-selector"
                  popper-append-to-body="false"
                  max-height="200px"
                  style="flex: 1"
                >
                  <el-option
                    v-for="field in mappingFieldOptions"
                    :key="field"
                    :label="field"
                    :value="field"
                  ></el-option>
                </el-select>
                <!-- 全新下拉框写法：目标货币字段 -->
                <el-select
                  ref="targetCurrencySelectRef"
                  v-model="apiConfigForm.targetCurrencyField"
                  placeholder="目标货币字段"
                  class="form-input rate-rel-selector"
                  popper-append-to-body="false"
                  max-height="200px"
                  style="flex: 1"
                >
                  <el-option
                    v-for="field in mappingFieldOptions"
                    :key="field"
                    :label="field"
                    :value="field"
                  ></el-option>
                </el-select>
                <!-- 全新下拉框写法：汇率字段 -->
                <el-select
                  ref="exchangeRateSelectRef"
                  v-model="apiConfigForm.exchangeRateField"
                  placeholder="汇率字段"
                  class="form-input rate-rel-selector"
                  popper-append-to-body="false"
                  max-height="200px"
                  style="flex: 1"
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
              >
                同步汇率
              </el-button>
            </div>
          </div>

          <!-- 已保存的API（固定汇率配置优化） -->
          <div class="saved-api-card mb-6">
            <div class="card-header">
              <div class="font-medium">已保存的API</div>
            </div>

            <div class="fixed-rate-container p-4 border rounded-lg mb-4 bg-gray-50">
              <div class="font-medium mb-3">固定汇率配置</div>
              <div class="fixed-rate-content flex gap-3 align-items-center flex-wrap">
                <el-switch
                  v-model="useFixedRate"
                  active-text="使用固定汇率"
                  class="fixed-rate-switch"
                  style="z-index: 10;"
                  @change="handleFixedRateSwitchChange"
                ></el-switch>
                <el-input
                  v-model="apiConfigForm.fixedExchangeRate"
                  placeholder=""
                  class="form-input fixed-rate-input"
                  :disabled="!useFixedRate"
                  number
                  @blur="validateFixedRate"
                  @input="handleFixedRateInput"
                >
                  <template #append>
                    <span class="text-gray-500">≤4位小数</span>
                  </template>
                </el-input>
                <el-button
                  type="primary"
                  @click="submitFixedRate"
                  class="operate-btn submit-fixed-btn"
                  :disabled="!useFixedRate || !!fixedRateError"
                >
                  提交固定汇率
                </el-button>
                <div class="text-tips mt-1 w-full">
                  数据库无活跃API时，默认使用此固定汇率；选中API并点击「使用选中的API」后，自动取消固定汇率
                </div>
                <el-text v-if="fixedRateError" type="danger" size="small" class="mt-1">
                  {{ fixedRateError }}
                </el-text>
              </div>
            </div>

            <div class="saved-api-container">
              <div class="saved-api-list">
                <div
                  v-for="api in savedApiList"
                  :key="api.api_id"
                  class="api-item flex mb-3 mr-3 p-3 border rounded-lg cursor-pointer"
                  :class="selectedApiId === api.api_id ? 'selected-api-item' : ''"
                  @click="selectApiItem(api.api_id)"
                >
                  <div class="flex items-center gap-3 w-full">
                    <el-radio
                      v-model="selectedApiId"
                      :label="api.api_id"
                      class="api-radio"
                      @click.stop
                    ></el-radio>
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
                      <p v-if="api.fixed_exchange_rate" class="text-sm text-blue-600 mt-1">
                        固定汇率: {{ api.fixed_exchange_rate }}
                      </p>
                    </div>
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
            >
              使用选中的API
            </el-button>
          </div>

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
                <el-col :span="12" class="active-api-col" v-if="activeApiInfo.fixed_exchange_rate">
                  <label class="active-api-label text-left">固定汇率</label>
                  <p class="font-medium text-blue-600 active-api-value text-left">{{ activeApiInfo.fixed_exchange_rate }}</p>
                </el-col>
              </el-row>
            </div>
            <div v-else class="no-active-api">
              <p class="text-gray-500 text-left py-4">暂无活跃的汇率API（将使用固定汇率）</p>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 测试结果弹窗 -->
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

<script setup>
import { ref, reactive, onMounted, computed, getCurrentInstance } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CircleCheck, CircleClose } from '@element-plus/icons-vue'

const { proxy } = getCurrentInstance()
const $axios = proxy.$axios

// 表单数据（新增固定汇率字段）
const apiConfigForm = reactive({
  apiId: '',
  apiName: '',
  apiUrl: '',
  requestMethod: 'get',
  apiParamsList: [{ key: '', value: '' }],
  fieldMappings: [
    { originalFieldPath: '', fieldName: '', fieldValue: '', fieldDesc: '' },
    { originalFieldPath: '', fieldName: '', fieldValue: '', fieldDesc: '' },
    { originalFieldPath: '', fieldName: '', fieldValue: '', fieldDesc: '' }
  ],
  sourceCurrencyField: '',
  targetCurrencyField: '',
  exchangeRateField: '',
  fixedExchangeRate: null // 固定汇率值（从数据库读取）
})

// 固定汇率核心状态
const useFixedRate = ref(false) // 固定汇率开关状态
const fixedRateError = ref('') // 固定汇率验证错误信息
const isManualOperation = ref(false) // 标记是否为用户手动操作，区分初始化与手动触发

// 其他状态（保持不变）
const connectionResult = reactive({
  status: '',
  responseCode: '',
  originalResponse: '',
  lastSyncTime: null
})
const mappingFieldOptions = computed(() => {
  return apiConfigForm.fieldMappings
    .map(item => item.fieldName ? `${item.fieldName} - ${item.fieldDesc || '无描述'}` : '')
    .filter(Boolean)
})
const showRateWarning = ref(false)
const savedApiList = ref([])
const selectedApiId = ref(null)
const activeApiInfo = ref(null)
const liveRateInfo = reactive({ rateText: '', updateTime: '' })
const testResultModalVisible = ref(false)
const testResult = reactive({
  success: false, responseCode: '', mappingResults: [], rawResponse: '', errorMsg: '', errorDetails: ''
})
const apiConfigFormRef = ref(null)
const requestMethodSelectRef = ref(null)
const sourceCurrencySelectRef = ref(null)
const targetCurrencySelectRef = ref(null)
const exchangeRateSelectRef = ref(null)

// ===================== 修复：固定汇率输入框限制（Vue规范事件） =====================
const handleFixedRateInput = (value) => {
  // 只允许数字和一个小数点
  const regex = /^\d*\.?\d*$/
  if (!regex.test(value)) {
    // 非法字符，移除最后输入的内容
    apiConfigForm.fixedExchangeRate = value.slice(0, -1)
  }
  // 限制最多4位小数
  if (value.includes('.') && value.split('.')[1].length > 4) {
    apiConfigForm.fixedExchangeRate = value.slice(0, value.indexOf('.') + 5)
  }
}

// ===================== 修复：固定汇率开关变化（解决异步干扰，优先保留用户选择） =====================
const handleFixedRateSwitchChange = async () => {
  fixedRateError.value = ''
  isManualOperation.value = true // 标记为用户手动操作
  const currentUseFixed = useFixedRate.value // 记录用户当前选择的状态

  if (currentUseFixed) {
    // 启用固定汇率：前端先更新状态，再执行后端请求
    selectedApiId.value = null
    try {
      await $axios.post('/exchange/config/switch_fixed_rate_mode/', { enable: true })
      ElMessage.success('已启用固定汇率模式，所有API已设为未活跃')
      // 同步前端状态，仅加载汇率值，不覆盖开关状态
      await loadDefaultFixedRate()
      await loadSavedApiList()
      await loadActiveApi()
    } catch (err) {
      // 后端请求失败，回滚前端状态并提示
      useFixedRate.value = false
      ElMessage.error('启用固定汇率模式失败：' + (err.response?.data?.error || err.message))
    }
  } else {
    // 禁用固定汇率：前端先更新状态，再同步活跃API
    apiConfigForm.fixedExchangeRate = null
    ElMessage.info('已关闭固定汇率模式，可选择API使用')
    await loadActiveApi()
  }

  isManualOperation.value = false // 重置手动操作标记
}

// ===================== 核心逻辑2：固定汇率验证（4位小数、大于0） =====================
const validateFixedRate = () => {
  fixedRateError.value = ''
  if (!useFixedRate.value) return true

  const rate = apiConfigForm.fixedExchangeRate
  if (rate === null || rate === '') {
    fixedRateError.value = '请输入固定汇率'
    return false
  }
  if (isNaN(rate) || Number(rate) <= 0) {
    fixedRateError.value = '固定汇率必须是大于0的数字'
    return false
  }
  if (rate.toString().split('.')[1]?.length > 4) {
    fixedRateError.value = '固定汇率最多支持4位小数'
    return false
  }
  return true
}

// ===================== 核心逻辑3：提交固定汇率（更新数据库） =====================
const submitFixedRate = async () => {
  // 验证
  if (!validateFixedRate()) {
    ElMessage.warning(fixedRateError.value)
    return
  }

  // 获取目标API（优先选中的API，无则用第一个API）
  const targetApiId = selectedApiId.value || (savedApiList.value.length > 0 ? savedApiList.value[0].api_id : null)
  if (!targetApiId) {
    ElMessage.warning('请先创建至少一个API配置，再提交固定汇率')
    return
  }

  try {
    // 调用后端更新固定汇率
    const res = await $axios.post(`/exchange/config/${targetApiId}/update_fixed_rate/`, {
      fixed_exchange_rate: apiConfigForm.fixedExchangeRate
    })

    if (res.success) {
      ElMessage.success(`固定汇率提交成功，当前API：${res.api_id}，汇率：${res.fixed_exchange_rate}`)
      // 更新本地数据
      const apiIndex = savedApiList.value.findIndex(item => item.api_id === targetApiId)
      if (apiIndex !== -1) {
        savedApiList.value[apiIndex].fixed_exchange_rate = res.fixed_exchange_rate
      }
      if (activeApiInfo.value?.api_id === targetApiId) {
        activeApiInfo.value.fixed_exchange_rate = res.fixed_exchange_rate
      }
    } else {
      ElMessage.error('提交失败：' + (res.error || '未知错误'))
    }
  } catch (err) {
    ElMessage.error('提交固定汇率失败：' + (err.response?.data?.error || err.message))
  }
}

// ===================== 核心逻辑4：加载数据库固定汇率值（解决状态覆盖，区分手动/初始化） =====================
const loadDefaultFixedRate = async () => {
  try {
    const res = await $axios.get('/exchange/config/fixed_rate/')
    // 核心修改：无活跃API时，后端返回的use_fixed_rate无效，这里仅初始化汇率值，不覆盖开关状态
    apiConfigForm.fixedExchangeRate = res.fixed_exchange_rate ?? 7.2 // 兜底默认值
    ElMessage.success('默认固定汇率加载成功')
  } catch (err) {
    // 接口调用失败：仅初始化汇率值，开关状态由loadActiveApi决定
    apiConfigForm.fixedExchangeRate = 7.2 // 兜底默认值
    ElMessage.warning('加载默认固定汇率失败，已使用兜底值：7.2')
    console.warn('加载固定汇率异常：', err)
  }
}

// ===================== 核心逻辑5：选择API时，自动取消固定汇率（标记手动操作） =====================
const selectApiItem = (apiId) => {
  isManualOperation.value = true // 标记为用户手动操作
  selectedApiId.value = Number(apiId)
  // 选择API时，自动关闭固定汇率模式（保留用户手动重新开启的权利）
  if (useFixedRate.value) {
    useFixedRate.value = false
    apiConfigForm.fixedExchangeRate = null
    fixedRateError.value = ''
    ElMessage.info('已自动取消固定汇率，将使用选中的API（可手动重新开启）')
  }
  // 回填选中API的固定汇率（若有）
  loadSelectedApiFixedRate(Number(apiId))
  isManualOperation.value = false // 重置手动操作标记
}

// 加载选中API的固定汇率
const loadSelectedApiFixedRate = (apiId) => {
  const api = savedApiList.value.find(item => item.api_id === apiId)
  if (api) {
    apiConfigForm.fixedExchangeRate = api.fixed_exchange_rate || null
  } else {
    apiConfigForm.fixedExchangeRate = null
  }
}

// ===================== 核心逻辑6：使用选中的API（标记手动操作，避免状态覆盖） =====================
const setActiveApi = async () => {
  // 按钮始终不禁用，点击时判断是否选中API
  if (!selectedApiId.value) {
    ElMessage.warning('请先选择API')
    return
  }
  isManualOperation.value = true // 标记为用户手动操作
  try {
    // 1. 调用后端设置选中API为活跃
    await $axios.post(`/exchange/config/${selectedApiId.value}/activate/`)
    // 2. 自动取消固定汇率
    useFixedRate.value = false
    apiConfigForm.fixedExchangeRate = null
    fixedRateError.value = ''
    ElMessage.success('已设置为活跃API，自动取消固定汇率（可手动重新开启）')
    // 3. 同步前端状态
    await loadActiveApi()
    await loadSavedApiList()
  } catch (err) {
    ElMessage.error('设置活跃API失败：' + err.message)
  }
  isManualOperation.value = false // 重置手动操作标记
}

// ===================== 原有方法（保持不变，仅保留关键修改） =====================
// 删除API
const deleteApi = async (apiId) => {
  try {
    await ElMessageBox.confirm('确定删除该API配置？', '删除确认', { type: 'warning' })
    await $axios.delete(`/exchange/config/${apiId}/`)
    ElMessage.success('删除成功')
    if (selectedApiId.value === Number(apiId)) {
      selectedApiId.value = null
      apiConfigForm.fixedExchangeRate = null
    }
    if (activeApiInfo.value?.api_id === Number(apiId)) activeApiInfo.value = null
    await loadSavedApiList()
    // 删除后重新判断是否启用固定汇率
    await loadActiveApi()
  } catch (err) {
    if (err !== 'cancel') ElMessage.error('删除失败：' + (err.message || '未知错误'))
  }
}

// 同步汇率
const syncExchangeRate = async () => {
  if (!activeApiInfo.value) {
    ElMessage.warning('暂无活跃API，无法同步汇率')
    return
  }
  try {
    const res = await $axios.post(`/exchange/config/${activeApiInfo.value.api_id}/sync_exchange_rate/`)
    if (res.status === 'success') {
      const apiIndex = savedApiList.value.findIndex(item => item.api_id === activeApiInfo.value.api_id)
      if (apiIndex !== -1) savedApiList.value[apiIndex].last_sync_time = res.last_sync_time
      activeApiInfo.value.last_sync_time = res.last_sync_time
      liveRateInfo.updateTime = formatTime(res.last_sync_time)
      ElMessage.success('同步成功')
    } else {
      ElMessage.error('同步失败：' + res.error)
    }
  } catch (err) {
    ElMessage.error('同步失败：' + (err.response?.data?.error || err.message))
  }
}

// 添加/删除参数行
const addParamRow = () => {
  apiConfigForm.apiParamsList.push({ key: '', value: '' })
}
const removeParamRow = async (index) => {
  try {
    await ElMessageBox.confirm('确定删除该参数？', '提示', { type: 'warning' })
    if (apiConfigForm.apiParamsList.length <= 1) {
      ElMessage.warning('至少保留一个参数')
      return
    }
    apiConfigForm.apiParamsList.splice(index, 1)
    ElMessage.success('删除成功')
  } catch (err) {
    ElMessage.info('已取消删除')
  }
}

// 添加/删除映射行
const addMappingRow = () => {
  apiConfigForm.fieldMappings.push({ originalFieldPath: '', fieldName: '', fieldValue: '', fieldDesc: '' })
}
const removeMappingRow = async (index) => {
  try {
    await ElMessageBox.confirm('确定删除该映射？', '提示', { type: 'warning' })
    if (apiConfigForm.fieldMappings.length <= 1) {
      ElMessage.warning('至少保留一个映射')
      return
    }
    apiConfigForm.fieldMappings.splice(index, 1)
    ElMessage.success('删除成功')
  } catch (err) {
    ElMessage.info('已取消删除')
  }
}

// 时间格式化
const formatTime = (timeStr) => {
  if (!timeStr) return '-'
  try {
    const date = new Date(timeStr)
    return date.toLocaleString('zh-CN')
  } catch (err) {
    return '-'
  }
}

// 样式类计算
const getApiStatusClass = (status) => status === 1 ? 'text-green-600' : 'text-gray-500'
const getConnectStatusClass = (status) => {
  if (status === 1) return 'text-green-600'
  if (status === 2) return 'text-red-600'
  return 'text-gray-500'
}
const connectionStatusClass = computed(() => {
  if (connectionResult.status === '成功') return 'text-green-600'
  if (connectionResult.status === '失败') return 'text-red-600'
  return 'text-gray-500'
})

// 加载已保存API列表
const loadSavedApiList = async () => {
  try {
    const res = await $axios.get('/exchange/config/')
    savedApiList.value = Array.isArray(res) ? res : []
    ElMessage.success(`加载${savedApiList.value.length}条API配置`)
  } catch (err) {
    savedApiList.value = []
    ElMessage.error('加载API列表失败：' + (err.message || '网络异常'))
  }
}

// ===================== 修复：加载活跃API（区分手动/初始化，避免状态覆盖） =====================
const loadActiveApi = async () => {
  try {
    const res = await $axios.get('/exchange/config/active_api/')
    activeApiInfo.value = res.data
    selectedApiId.value = res.data?.api_id ? Number(res.data.api_id) : null

    if (res.data) {
      // 有活跃API：关闭固定汇率（初始化阶段不考虑手动操作标记）
      useFixedRate.value = false
      apiConfigForm.fixedExchangeRate = null
      loadSelectedApiFixedRate(res.data.api_id)
    } else {
      // 无活跃API：强制启用固定汇率（核心修改：不再依赖后端，直接设为true）
      useFixedRate.value = true
      apiConfigForm.fixedExchangeRate = apiConfigForm.fixedExchangeRate ?? 7.2 // 兜底默认值
      ElMessage.info('暂无活跃API，已自动启用固定汇率')
    }
  } catch (err) {
    // 接口调用失败（无活跃API）：强制启用固定汇率
    activeApiInfo.value = null
    selectedApiId.value = null
    useFixedRate.value = true // 核心修改：强制开启
    apiConfigForm.fixedExchangeRate = apiConfigForm.fixedExchangeRate ?? 7.2
    ElMessage.warning('暂无活跃API，已自动启用固定汇率')
  }
}

// 测试连接
const testConnection = async () => {
  if (!apiConfigForm.apiUrl) {
    ElMessage.warning('请填写API地址')
    return
  }
  let tempApiId = ''
  try {
    if (!apiConfigForm.apiId) {
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
    }

    const res = await $axios.post(`/exchange/config/${apiConfigForm.apiId || tempApiId}/test_connection/`)
    connectionResult.status = res.connect_status
    connectionResult.responseCode = res.response_code
    // 【修改处】格式化原始响应数据，实现换行显示
    connectionResult.originalResponse = typeof res.original_response === 'object'
      ? JSON.stringify(res.original_response, null, 2)
      : (res.original_response ? (() => {
          try {
            return JSON.stringify(JSON.parse(res.original_response), null, 2);
          } catch (e) {
            return res.original_response; // 解析失败则保留原字符串
          }
        })() : '');
    connectionResult.lastSyncTime = res.last_sync_time
    ElMessage.success('连接测试成功')

    if (res.last_sync_time) {
      const targetApiId = Number(apiConfigForm.apiId || tempApiId)
      const apiIndex = savedApiList.value.findIndex(item => item.api_id === targetApiId)
      if (apiIndex !== -1) savedApiList.value[apiIndex].last_sync_time = res.last_sync_time
      if (activeApiInfo.value?.api_id === targetApiId) activeApiInfo.value.last_sync_time = res.last_sync_time
    }
  } catch (err) {
    connectionResult.status = '失败'
    connectionResult.responseCode = ''
    // 【异常处理也同步格式化】
    connectionResult.originalResponse = err.response?.data?.error || err.message
    ElMessage.error('测试失败：' + err.message)
  } finally {
    if (tempApiId) await $axios.delete(`/exchange/config/${tempApiId}/`).catch(() => void 0)
  }
}

// 测试API映射（核心修改：自动填充默认值 + 路径错误提示）
const testApiMapping = async () => {
  if (!apiConfigForm.apiUrl) {
    ElMessage.warning('请填写API地址')
    return
  }
  testResultModalVisible.value = true
  try {
    // 先执行连接测试，确保有响应数据
    await testConnection()
    if (connectionResult.status !== '成功') {
      testResult.success = false
      testResult.errorMsg = 'API连接失败，无法测试映射'
      testResult.errorDetails = connectionResult.originalResponse
      return
    }

    const mappingResults = []
    const errorPaths = [] // 收集提取失败的路径
    let rawResponse = connectionResult.originalResponse
    let responseData = {}

    // 解析原始响应为JSON对象
    try {
      responseData = JSON.parse(rawResponse)
    } catch (e) {
      testResult.success = false
      testResult.errorMsg = '原始响应不是有效的JSON格式，无法进行字段映射'
      testResult.errorDetails = rawResponse
      ElMessage.error('API响应非JSON格式，映射测试失败')
      return
    }

    // 遍历所有映射项，提取值并填充到fieldValue
    apiConfigForm.fieldMappings.forEach((mapping, index) => {
      // 跳过未配置原始字段路径的映射项
      if (!mapping.originalFieldPath) {
        mappingResults.push({
          targetField: mapping.fieldName || `未命名字段${index + 1}`,
          dataPath: mapping.originalFieldPath,
          extractedValue: '未配置路径'
        })
        return
      }

      let extractedValue = null
      try {
        // 处理数组路径（如data.list[0].name），转换为点分隔路径
        const pathArr = mapping.originalFieldPath.replace(/\[(\d+)\]/g, '.$1').split('.')
        let value = responseData

        // 逐级提取字段值
        for (const key of pathArr) {
          if (value === undefined || value === null) {
            throw new Error(`路径中断：无法找到字段 "${key}"`)
          }
          value = value[key]
        }

        extractedValue = value
        // 核心：提取成功，自动填充到“字段值”（默认值）
        mapping.fieldValue = extractedValue !== undefined && extractedValue !== null ? String(extractedValue) : ''
      } catch (e) {
        extractedValue = '路径错误'
        errorPaths.push(`${mapping.originalFieldPath}（${mapping.fieldName || '未命名字段'}）`)
        // 提取失败，清空默认值（或保留原有值，可根据需求调整）
        mapping.fieldValue = ''
      }

      // 组装映射结果（用于弹窗展示）
      mappingResults.push({
        targetField: mapping.fieldName || `未命名字段${index + 1}`,
        dataPath: mapping.originalFieldPath,
        extractedValue: extractedValue !== null ? extractedValue : '无数据'
      })
    })

    // 处理路径错误提示
    if (errorPaths.length > 0) {
      ElMessage.error(`以下字段路径提取失败：\n${errorPaths.join('\n')}`)
    } else if (apiConfigForm.fieldMappings.some(item => item.originalFieldPath)) {
      ElMessage.success('所有字段映射提取成功，已自动填充默认值')
    }

    // 更新弹窗数据
    testResult.success = true
    testResult.responseCode = connectionResult.responseCode
    testResult.mappingResults = mappingResults
    testResult.rawResponse = rawResponse
  } catch (err) {
    testResult.success = false
    testResult.errorMsg = '测试映射失败'
    testResult.errorDetails = err.message
    ElMessage.error('映射测试异常：' + err.message)
  }
}

// 保存API配置
const saveApiConfig = async () => {
  if (!apiConfigForm.sourceCurrencyField || !apiConfigForm.targetCurrencyField || !apiConfigForm.exchangeRateField) {
    showRateWarning.value = true
    ElMessage.warning('请完整设置汇率关系')
    return
  }
  showRateWarning.value = false

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
      res = await $axios.put(`/exchange/config/${apiConfigForm.apiId}/`, submitData)
    } else {
      res = await $axios.post('/exchange/config/', submitData)
    }

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
    await loadSavedApiList()
    resetForm()
  } catch (err) {
    ElMessage.error('保存失败：' + (err.response?.data?.error || err.message))
  }
}

// 获取实时汇率
const fetchLiveRate = async () => {
  if (!activeApiInfo.value) {
    ElMessage.warning('暂无活跃API，无法获取实时汇率')
    return
  }
  try {
    const res = await $axios.post(`/exchange/config/${activeApiInfo.value.api_id}/test_connection/`)
    let rateData = {}
    try { rateData = JSON.parse(res.original_response) } catch (e) { void 0 }
    liveRateInfo.rateText = `1 ${apiConfigForm.sourceCurrencyField || 'USD'} = ${rateData.conversion_rate || '7.2'} ${apiConfigForm.targetCurrencyField || 'CNY'}`
    liveRateInfo.updateTime = formatTime(res.last_sync_time || activeApiInfo.value.last_sync_time)
    ElMessage.success('获取实时汇率成功')
  } catch (err) {
    ElMessage.error('获取失败：' + err.message)
  }
}

// 重置表单
const resetForm = () => {
  apiConfigForm.apiId = ''
  apiConfigForm.apiName = ''
  apiConfigForm.apiUrl = ''
  apiConfigForm.requestMethod = 'get'
  apiConfigForm.apiParamsList = [{ key: '', value: '' }]
  apiConfigForm.fieldMappings = [
    { originalFieldPath: '', fieldName: '', fieldValue: '', fieldDesc: '' },
    { originalFieldPath: '', fieldName: '', fieldValue: '', fieldDesc: '' },
    { originalFieldPath: '', fieldName: '', fieldValue: '', fieldDesc: '' }
  ]
  apiConfigForm.sourceCurrencyField = ''
  apiConfigForm.targetCurrencyField = ''
  apiConfigForm.exchangeRateField = ''
  useFixedRate.value = false
  apiConfigForm.fixedExchangeRate = null
  fixedRateError.value = ''
  connectionResult.status = ''
  connectionResult.responseCode = ''
  connectionResult.originalResponse = ''
  connectionResult.lastSyncTime = null
  showRateWarning.value = false
  selectedApiId.value = null
  if (apiConfigFormRef.value) apiConfigFormRef.value.resetFields()
}

// 初始化：加载数据并判断是否启用固定汇率
// 初始化：优先加载固定汇率状态，再加载API数据
onMounted(async () => {
  await loadDefaultFixedRate() // 先同步后端固定汇率状态
  await loadSavedApiList()
  await loadActiveApi() // 最后加载活跃API，避免状态覆盖
})
</script>

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
  overflow: visible !important;
  margin-top: 0;
}

/* 列布局：大屏幕平分，小屏幕占满 */
.form-col, .table-col {
  flex: 1 1 calc(50% - 12px);
  min-width: 360px;
  max-width: calc(50% - 12px);
  box-sizing: border-box;
  overflow: visible !important;
  margin-bottom: 0;
}

/* 卡片基础样式：优化阴影 & 圆角 */
.form-card, .table-card {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  padding: 24px;
  box-sizing: border-box;
  width: 100%;
  overflow: visible !important;
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

/* ========== 全新下拉框样式：统一控制宽度、高度、层级 ========== */
:deep(.request-method-select),
:deep(.rate-rel-selector) {
  border: 1px solid #e5e7eb !important;
  background: #fff !important;
  box-shadow: none !important;
  overflow: visible !important;
}

:deep(.request-method-select .el-input__inner),
:deep(.rate-rel-selector .el-input__inner) {
  height: 100% !important;
  border: none !important;
  background: transparent !important;
  padding: 0 12px !important;
  box-shadow: none !important;
  color: #333 !important;
  font-size: 14px !important;
}

:deep(.request-method-select .el-select__wrapper),
:deep(.rate-rel-selector .el-select__wrapper) {
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
  overflow: visible !important;
}

:deep(.request-method-select .el-input__suffix),
:deep(.rate-rel-selector .el-input__suffix) {
  color: #909399 !important;
  pointer-events: auto !important;
}

/* 下拉面板核心样式：解决层级、长度、宽度问题 */
:deep(.el-select__popper) {
  width: 100% !important;
  min-width: 100% !important;
  max-width: 100% !important;
  margin-top: 4px !important;
  border: 1px solid #e5e7eb !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1) !important;
  background: #fff !important;
  padding: 4px 0 !important;
  box-sizing: border-box !important;
  z-index: 100 !important; /* 合理层级，不冲突 */
}

/* 下拉选项样式：限制高度、自动换行 */
:deep(.el-select-dropdown__item) {
  padding: 8px 16px !important;
  font-size: 14px !important;
  width: 100% !important;
  box-sizing: border-box !important;
  white-space: normal !important;
  word-wrap: break-word !important;
  word-break: break-all !important;
  line-height: 1.4 !important;
  min-height: 40px !important;
  display: flex !important;
  align-items: center !important;
}

:deep(.el-select-dropdown__item:hover) {
  background: #f5f7fa !important;
  color: #67c23a !important;
}

:deep(.el-select-dropdown__item.selected) {
  color: #67c23a !important;
  font-weight: 500 !important;
}

/* ========== 汇率关系下拉框样式 + 增加与保存按钮的间距 ========== */
.rate-rel-form-item {
  margin-bottom: 32px !important;
}
.rate-rel-content {
  display: flex;
  gap: 8px;
  width: 100%;
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
  overflow: visible !important;
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
  border: none;
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
  display: flex;
  gap: 8px;
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
  border: none;
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
  gap: 8px;
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
  display: flex;
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
  margin-bottom: 24px;
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
  padding: 16px;
  box-sizing: border-box;
}

/* ========== 已保存API列表样式（支持换行+自适应） ========== */
.saved-api-container {
  padding: 8px 0;
  width: 100%;
  max-height: 300px;
  overflow-y: auto;
}
.saved-api-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  width: 100%;
}
/* API卡片：自适应内容宽度 + 换行 */
.api-item {
  transition: all 0.2s;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-sizing: border-box;
  width: auto;
  max-width: calc(50% - 6px);
  align-items: flex-start;
  padding: 12px;
  margin-bottom: 0;
  margin-right: 0;
}
/* API项hover效果 */
.api-item:hover {
  border-color: #c6e2ff;
  background-color: #f9fafc;
}
/* 选中状态的API卡片 */
.selected-api-item {
  border-color: #409eff !important;
  background-color: #f0f7ff !important;
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
  font-weight: 500;
}
.api-url {
  margin: 0 0 6px 0;
  font-size: 12px;
  color: #6b7280;
  word-break: break-all;
  max-width: 100%;
  overflow: visible;
  text-overflow: unset;
  white-space: normal;
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
  margin-right: 0;
}
/* 删除按钮：固定在右侧 */
.api-del-btn {
  flex-shrink: 0;
  width: auto;
  padding: 0 8px;
}

/* 活跃API信息：优化排版 */
.active-api-info {
  padding: 0;
  border: none;
  border-radius: 0;
}
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
  font-size: 14px;
}

/* 无数据样式：更柔和 */
.no-active-api {
  padding: 32px 0;
  color: #9ca3af;
  width: 100%;
  text-align: left;
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

/* 原始响应文本样式 */
.raw-response-text {
  white-space: pre-wrap;
  word-break: break-all;
  text-align: left;
  padding: 8px;
}

/* ========== 固定汇率相关样式：沿用前两个版本 ========== */
.fixed-rate-container {
  background: #fafafa;
  border-color: #e4e7ed;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}
.fixed-rate-switch {
  margin-right: 12px;
}
.fixed-rate-input {
  max-width: 300px;
  flex: 1;
  min-width: 200px;
}
.submit-fixed-btn {
  min-width: 120px;
}
.fixed-rate-content {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
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