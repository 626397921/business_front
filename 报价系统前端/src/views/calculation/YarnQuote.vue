<template>
  <div class="yarn-quote-container">
    <!-- 1. 纱线配比验证卡片 -->
    <div class="card form-card">
      <div class="card-header">
        <div class="card-title">纱线配比验证</div>
      </div>
      <div class="card-body">
        <el-form :model="ratioForm" inline @submit.prevent class="ratio-form">
          <el-form-item label="棉(%)：">
            <el-input
              v-model.number="ratioForm.cotton"
              type="number"
              
              precision="1"
              clearable
              class="form-input"
              placeholder="输入棉含量"
            />
          </el-form-item>
          <el-form-item label="化纤(%)：">
            <el-input
              v-model.number="ratioForm.chemical"
              type="number"
              
              precision="1"
              clearable
              class="form-input"
              placeholder="输入化纤含量"
            />
          </el-form-item>
          <el-form-item label="粘胶(%)：">
            <el-input
              v-model.number="ratioForm.viscose"
              type="number"
              
              precision="1"
              clearable
              class="form-input"
              placeholder="输入粘胶含量"
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              @click="verifyRatio"
              :loading="verifyLoading"
              class="operate-btn primary-btn"
            >
              验证配比
            </el-button>
          </el-form-item>
        </el-form>
        <!-- 配比验证结果 -->
        <div v-if="ratioVerifyResult" class="ratio-result">
          <el-alert
            :type="ratioVerifyResult.success ? 'success' : 'error'"
            :title="ratioVerifyResult.success ? '验证成功' : '验证失败'"
            :description="ratioVerifyResult.errors?.join('；') ||
              `纱线类型：${ratioVerifyResult.yarn_type || '未知'}，支数范围：${ratioVerifyResult.count_range || '未知'}，推荐配比：${ratioVerifyResult.recommended_ratio || '无'}`"
            show-icon
            closable
          />
        </div>
      </div>
    </div>

    <!-- 2. 成分配置卡片 -->
    <div class="card form-card">
      <div class="card-header">
        <div class="card-title">成分配置</div>
        <el-button
          type="primary"
          @click="openMaterialDialog"
          class="operate-btn primary-btn material-dialog-btn"
        >
          选择原材料
        </el-button>
      </div>
      <div class="card-body">
        <!-- 选中的原材料列表 -->
        <div v-if="selectedMaterials.length > 0" class="selected-materials">
          <div class="material-item" v-for="(item, index) in selectedMaterials" :key="item.material_id || index">
            <span class="material-info">
              {{ item.category_name || '未知类别' }} - {{ item.name || '未知名称' }}（单价：{{ toFixedNumber(item.price, 2) }}元/吨）
            </span>
            <el-input
              v-model.number="item.ratio"
              type="number"
              
              precision="1"
              placeholder="输入配比(%)"
              class="form-input percentage-input"
              @blur="checkTotalRatio"
              @input="checkTotalRatio"
            />
            <el-button
              type="danger"
              size="small"
              @click="removeMaterial(index)"
              icon="el-icon-delete"
              class="operate-btn danger-btn"
            />
          </div>
          <div class="total-percentage">
            总配比：{{ toFixedNumber(totalRatio, 1) }}%
            <el-text type="danger" v-if="(totalRatio || 0) < 99.9 || (totalRatio || 0) > 100.1">
              （需等于100%，当前偏差：{{ toFixedNumber((totalRatio || 0) - 100, 1) }}%）
            </el-text>
            <el-text type="success" v-else>（符合要求）</el-text>
          </div>
        </div>
        <div v-else class="empty-tip">暂无选中的原材料，请点击「选择原材料」按钮添加</div>
      </div>
    </div>

    <!-- 3. 计算参数卡片（新增支数、颜色输入） -->
    <div class="card form-card">
      <div class="card-header">
        <div class="card-title">计算参数</div>
      </div>
      <div class="card-body">
        <el-form :model="calcParams" label-width="100px" class="params-form">
          <el-row :gutter="20">
            <!-- 新增：支数 + 颜色（必填） -->
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="支数：" required>
                <el-input
                  v-model.number="calcParams.count"
                  type="number"
                  
                  precision="1"
                  clearable
                  class="form-input"
                  placeholder="输入具体支数（如21、32、40）"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="颜色：" required>
                <el-input
                  v-model="calcParams.color"
                  clearable
                  class="form-input"
                  placeholder="输入颜色（如黑色、白色、藏青）"
                />
              </el-form-item>
            </el-col>
            <!-- 基础工艺参数（非必填，后端默认） -->
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="损耗率：">
                <el-input
                  v-model.number="calcParams.lossRate"
                  type="number"
                  step="0.01"
                  precision="2"
                  clearable
                  class="form-input"
                  placeholder="非必填，后端默认按棉含量计算"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="纺纱费：">
                <el-input
                  v-model.number="calcParams.spinningFee"
                  type="number"
                  step="0.01"
                  precision="2"
                  clearable
                  class="form-input"
                  placeholder="非必填，后端默认按支数计算"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="净重：">
                <el-input
                  v-model.number="calcParams.netWeight"
                  type="number"
                  step="0.01"
                  precision="2"
                  clearable
                  class="form-input"
                  placeholder="非必填，后端默认值：0.96"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="税率：">
                <el-input
                  v-model.number="calcParams.taxRate"
                  type="number"
                  step="0.01"
                  precision="2"
                  clearable
                  class="form-input"
                  placeholder="非必填，后端默认值：0.95"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="利润率：">
                <el-input
                  v-model.number="calcParams.profitRate"
                  type="number"
                  step="0.01"
                  precision="2"
                  clearable
                  class="form-input"
                  placeholder="非必填，后端默认：国内1.1/国外1"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="内托费：">
                <el-input
                  v-model.number="calcParams.innerBoxFee"
                  type="number"
                  step="0.01"
                  precision="2"
                  clearable
                  class="form-input"
                  placeholder="非必填，后端默认值：500"
                />
              </el-form-item>
            </el-col>
            <!-- 汇率/信用证参数 -->
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="信用证：">
                <el-input
                  v-model.number="calcParams.letterOfCredit"
                  type="number"
                  step="0.001"
                  precision="3"
                  clearable
                  class="form-input"
                  placeholder="选填，LC120=1.05"
                />
              </el-form-item>
            </el-col>
<el-col :xs="24" :sm="12" :md="8">
  <el-form-item label="计算汇率：">
    <el-input
      v-model.number="calcParams.calculatedRate"
      type="number"
      step="0.0001"
      precision="4"
      clearable
      class="form-input"
      placeholder="非必填，后端默认：实时汇率-0.2"
    />
    <!-- 核心修改：用flex容器包裹按钮和汇率提示，实现同行显示 -->
    <div class="rate-action-wrapper" style="display: flex; align-items: center; gap: 10px; margin-top: 5px;">
      <el-button
        size="small"
        type="text"
        @click="getCurrentExchangeRate"
        class="refresh-rate-btn"
      >
        刷新实时汇率
      </el-button>
      <!-- 实时汇率提示 & 错误提示 -->
      <div class="rate-tips">
        <span v-if="calcParams.currentRate" class="current-rate text-success">
          当前实时汇率：{{ toFixedNumber(calcParams.currentRate, 4) }}
        </span>
        <span v-if="exchangeRateError" class="error-text text-danger">
          {{ exchangeRateError }}
        </span>
      </div>
    </div>
  </el-form-item>
</el-col>
<el-col :xs="24" :sm="12" :md="8">
  <el-form-item label="计算日期：">
    <el-date-picker
      v-model="calcParams.calcDate"
      type="date"
      placeholder="选择计算日期"
      class="form-input"
      value-format="YYYY-MM-DD"
    />
  </el-form-item>
</el-col>
          </el-row>
        </el-form>
      </div>
    </div>

    <!-- 4. 计算操作 & 结果卡片 -->
    <div class="card form-card">
      <div class="card-header">
        <div class="card-title">计算结果</div>
        <div class="calc-actions">
          <el-button
            type="primary"
            @click="submitCalculation"
            :loading="calcLoading"
            class="operate-btn primary-btn calc-btn"
            :disabled="selectedMaterials.length < 1 || ((totalRatio || 0) < 99.9 || (totalRatio || 0) > 100.1) || !calcParams.count || !calcParams.color"
          >
            计算报价
          </el-button>
          <el-button
            type="default"
            @click="resetAll"
            class="operate-btn default-btn reset-btn"
          >
            重置表单
          </el-button>
          <el-button
            type="text"
            @click="toggleFormula"
            class="operate-btn text-btn formula-btn"
          >
            {{ showFormula ? '隐藏计算公式' : '显示计算公式' }}
          </el-button>
        </div>
      </div>
      <div class="card-body">
        <!-- 计算结果展示 -->
        <div v-if="calcResult" class="calc-result">
          <el-descriptions title="报价结果" border column="2" class="result-desc">
            <el-descriptions-item label="计算ID">{{ calcResult?.calc_id ?? '无' }}</el-descriptions-item>
            <el-descriptions-item label="使用汇率">
              {{ toFixedNumber(calcResult?.used_exchange_rate, 4) }}
            </el-descriptions-item>
            <el-descriptions-item label="支数">{{ calcResult?.count ?? calcParams.count ?? '无' }}</el-descriptions-item>
            <el-descriptions-item label="颜色">{{ calcResult?.color ?? calcParams.color ?? '无' }}</el-descriptions-item>
            <el-descriptions-item label="人民币价格(元/公斤)">
              {{ toFixedNumber(calcResult?.final_rmb_cost ?? calcResult?.rmb_price, 2) }}
            </el-descriptions-item>
            <el-descriptions-item label="FOB价格(美元/公斤)">
              {{ toFixedNumber(calcResult?.fob_usd_kg ?? calcResult?.fob_price, 2) }}
            </el-descriptions-item>
            <el-descriptions-item label="信用证系数" :span="2">
              {{ toFixedNumber(calcResult?.letter_of_credit, 3) }}（{{ calcResult?.letter_of_credit > 0 ? '已生效' : '未生效' }}）
            </el-descriptions-item>
            <el-descriptions-item label="成分组成" :span="2">{{ calcResult?.composition ?? '无' }}</el-descriptions-item>
            <el-descriptions-item label="计算时间" :span="2">{{ calcResult?.create_time ?? '无' }}</el-descriptions-item>
          </el-descriptions>

          <!-- 分步计算详情 + 公式展示 -->
          <div class="calc-details" v-if="showFormula">
            <div class="detail-title">计算逻辑详情</div>

            <!-- 核心计算公式模块 -->
            <div class="formula-section">
              <div class="formula-title">核心计算公式</div>
              <!-- 纯文本公式（兼容所有环境） -->
              <div class="math-formula plain-text-formula">
                <p>1. 总材料成本(元/吨) = Σ(材料ᵢ单价 × 材料ᵢ配比/100)</p>
                <p>2. 人民币单价(元/公斤) = [(总材料成本/损耗率 + 纺纱费)/净重率 ÷ 税率 × 利润率 + 内托费] / 1000 × 信用证系数（如有）</p>
                <p>3. FOB单价(美元/公斤) = 人民币单价 ÷ 计算汇率 × 信用证系数（如有）</p>
              </div>
              <!-- 参数说明 -->
              <div class="param-explain">
                <div class="explain-title">本次计算参数说明：</div>
                <ul>
                  <li>总材料成本：{{ toFixedNumber(calcResult?.material_total_cost, 2) }} 元/吨</li>
                  <li>损耗率：{{ toFixedNumber(calcResult?.calculation_detail?.rmb_cost_calc?.params?.loss, 2) }}</li>
                  <li>纺纱费：{{ toFixedNumber(calcResult?.calculation_detail?.rmb_cost_calc?.params?.spinning_fee, 2) }} 元/吨</li>
                  <li>净重率：{{ toFixedNumber(calcResult?.calculation_detail?.rmb_cost_calc?.params?.net_weight, 2) }}</li>
                  <li>税率：{{ toFixedNumber(calcResult?.calculation_detail?.rmb_cost_calc?.params?.tax_rate, 2) }}</li>
                  <li>利润率：{{ toFixedNumber(calcResult?.calculation_detail?.rmb_cost_calc?.params?.profit_rate, 2) }}</li>
                  <li>内托费：{{ toFixedNumber(calcResult?.calculation_detail?.rmb_cost_calc?.params?.freight, 2) }} 元/吨</li>
                  <li>信用证系数：{{ toFixedNumber(calcResult?.letter_of_credit, 3) }}</li>
                  <li>计算汇率：{{ toFixedNumber(calcResult?.used_exchange_rate, 4) }}</li>
                </ul>
              </div>
            </div>

            <!-- 分步计算明细 -->
            <el-collapse style="margin-top: 15px;" v-if="calcResult">
              <el-collapse-item title="材料成本明细">
                <div v-for="(item, index) in calcResult?.calculation_details?.material_cost_details || []" :key="index" class="calc-step-item">
                  {{ item }}
                </div>
                <div class="total-material-cost mt-2">
                  总材料成本：{{ toFixedNumber(calcResult?.calculation_details?.total_material_price, 2) }} 元/吨
                </div>
              </el-collapse-item>
              <el-collapse-item title="人民币价格计算步骤">
                <div v-for="(item, index) in calcResult?.calculation_details?.rmb_price_calculation || []" :key="index" class="calc-step-item">
                  {{ item }}
                </div>
              </el-collapse-item>
              <el-collapse-item title="FOB价格计算步骤">
                <div v-for="(item, index) in calcResult?.calculation_details?.fob_calculation || []" :key="index" class="calc-step-item">
                  {{ item }}
                </div>
                <div v-if="!calcResult?.calculation_details?.fob_calculation || calcResult?.calculation_details?.fob_calculation.length === 0" class="empty-tip">
                  暂无FOB计算步骤
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>
        </div>
        <div v-else class="empty-tip">未执行计算，完成成分配置和参数设置后点击「计算报价」</div>
      </div>
    </div>

    <!-- 5. 历史计算卡片（新增分页） -->
    <div class="card table-card history-card">
      <div class="card-header">
        <div class="card-title">历史计算记录</div>
        <div class="history-actions">
          <el-input
            v-model="historyFilter"
            placeholder="筛选计算ID/成分/支数/颜色"
            clearable
            prefix-icon="el-icon-search"
            class="form-input history-filter-input"
          />
          <el-button
            type="primary"
            @click="downloadHistory"
            icon="el-icon-download"
            class="operate-btn primary-btn download-btn"
            :disabled="selectedHistoryRows.length === 0"
            size="default"
          >
            下载纱线计算记录
          </el-button>
        </div>
      </div>
      <div class="card-body">
<el-table
  :data="paginatedHistoryList"
  border
  stripe
  :header-cell-style="{ background: '#f5f5f5', color: '#333', fontWeight: '600', textAlign: 'center' }"
  :cell-style="{ verticalAlign: 'middle', textAlign: 'center', height: '45px' }"
  v-loading="historyLoading"
  empty-text="暂无历史计算记录"
  :key="JSON.stringify(filteredHistoryList)"
  @selection-change="handleHistorySelection"
  ref="historyTableRef"
  class="material-table"
>
  <!-- 多选列（保留，供下载/批量操作） -->
  <el-table-column type="selection" width="60" align="center" />

  <!-- 1. 支数 -->
  <el-table-column prop="count" label="支数" min-width="90" align="center" />
  <!-- 2. 颜色 -->
  <el-table-column prop="color" label="颜色" min-width="120" align="center" />
  <!-- 3. 成分组成详情 -->
  <el-table-column prop="composition" label="成分组成详情" min-width="280" align="center" />
  <!-- 4. 人民币单价(元/公斤) -->
  <el-table-column prop="rmb_price" label="人民币单价(元/公斤)" width="160" align="center">
    <template #default="scope">
      {{ toFixedNumber(scope.row.rmb_price || scope.row.final_rmb_cost, 2) }}
    </template>
  </el-table-column>
  <!-- 5. 计算汇率 -->
  <el-table-column prop="calc_exchange_rate" label="计算汇率" width="160" align="center">
    <template #default="scope">
      {{ toFixedNumber(scope.row.calc_exchange_rate, 4) }}
    </template>
  </el-table-column>
  <!-- 6. FOB单价(美元/公斤) -->
  <el-table-column prop="fob_usd_kg" label="FOB单价(美元/公斤)" width="160" align="center">
    <template #default="scope">
      {{ toFixedNumber(scope.row.fob_usd_kg || scope.row.fob_price, 2) }}
    </template>
  </el-table-column>
  <!-- 7. 计算时间 -->
  <el-table-column prop="create_time" label="计算时间" min-width="190" align="center" />
  <!-- 8. 用户名 -->
  <el-table-column prop="username" label="用户名" min-width="120" align="center" />
  <!-- 9. 用户角色 -->
  <el-table-column prop="user_role" label="用户角色" min-width="120" align="center" />

  <!-- 操作列（保留删除功能） -->
  <el-table-column label="操作" width="110" align="center">
    <template #default="scope">
      <el-button
        type="danger"
        size="small"
        @click="deleteHistory(scope.row.calc_id)"
        icon="el-icon-delete"
        :disabled="!scope.row.calc_id"
        class="operate-btn danger-btn delete-btn"
      >
        删除
      </el-button>
    </template>
  </el-table-column>
</el-table>

        <!-- 历史记录分页组件（和之前风格统一） -->
        <div class="pagination-wrapper" v-if="totalHistory > 0">
          <el-pagination
            @size-change="handleHistorySizeChange"
            @current-change="handleHistoryCurrentChange"
            :current-page="historyCurrentPage"
            :page-sizes="[10, 20, 50]"
            :page-size="historyPageSize"
            layout="total, prev, pager, next, jumper, ->, sizes"
            :total="totalHistory"
            background
            class="table-pagination"
          />
        </div>
      </div>
    </div>
<el-dialog
  title="原材料管理与选择"
  v-model="materialDialogVisible"
  width="80%"
  max-width="1100px"
  max-height="90vh"
  :close-on-click-modal="false"
  :destroy-on-close="true"
  class="raw-material-dialog"
>
  <div class="raw-material-container">
    <div class="form-card">
      <div class="form-header">
        <div class="form-title">{{ isEditMaterial ? '编辑原材料' : '新增原材料' }}</div>
        <el-button
          type="primary"
          @click="openCategoryDialog"
          class="category-add-btn"
        >
          新增类别
        </el-button>
      </div>

      <el-form
        :model="materialForm"
        label-width="100px"
        class="material-form"
        @submit.prevent
        ref="materialFormRef"
        :rules="materialRules"
      >
        <el-row :gutter="15" class="form-main-row">
          <el-col :xs="24" :sm="7" :md="7" class="form-col">
            <el-form-item label="原材料类别" prop="category_id" class="material-form-item">
              <el-select
                v-model="materialForm.category_id"
                clearable
                class="form-input"
                placeholder="请先新增类别，再选择"
                size="large"
              >
                <el-option
                  v-for="item in categoryList"
                  :key="item.category_id"
                  :label="item.category_name"
                  :value="item.category_id"
                />
              </el-select>
              <div v-if="categoryList.length === 0" class="category-tip">
                <el-text type="warning">⚠️ 暂无类别，请先新增原材料类别</el-text>
              </div>
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="7" :md="7" class="form-col">
            <el-form-item label="原材料名称" prop="name" class="material-form-item">
              <el-input
                v-model="materialForm.name"
                clearable
                class="form-input"
                placeholder="如：黑色全棉/黑色大化"
                size="large"
              />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="10" :md="10" class="form-col price-btn-col">
            <el-form-item label="单价(元)" prop="price" class="material-form-item">
              <div class="price-btn-row">
                <el-input
                  v-model.number="materialForm.price"
                  type="number"
                  step="0.01"
                  precision="2"
                  clearable
                  class="form-input price-input"
                  placeholder="请输入大于0的单价"
                  size="large"
                />
                <div class="btn-group-container">
                  <el-button
                    type="primary"
                    @click="handleAddMaterial"
                    class="operate-btn add-btn"
                    :loading="materialLoading"
                    v-if="!isEditMaterial"
                    size="large"
                  >
                    新增
                  </el-button>
                  <el-button
                    type="primary"
                    @click="handleEditMaterial"
                    class="operate-btn save-btn"
                    :loading="materialLoading"
                    v-if="isEditMaterial"
                    size="large"
                  >
                    保存修改
                  </el-button>
                  <el-button
                    v-if="isEditMaterial"
                    type="default"
                    @click="cancelEditMaterial"
                    class="operate-btn cancel-btn"
                    size="large"
                  >
                    取消
                  </el-button>
                </div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <div class="table-card">
      <div class="table-title">原材料列表</div>

      <div class="filter-bar">
        <el-row :gutter="15" class="filter-main-row">
          <el-col :xs="24" :sm="6" :md="6" class="filter-col">
            <el-input
              v-model="globalFilter"
              placeholder="全局搜索：名称/类别"
              clearable
              prefix-icon="el-icon-search"
              class="filter-input"
              size="large"
            />
          </el-col>
          <el-col :xs="24" :sm="6" :md="6" class="filter-col">
            <el-select
              v-model="filterForm.categoryIds"
              multiple
              clearable
              placeholder="选择类别"
              class="filter-input"
              size="large"
            >
              <el-option
                v-for="item in categoryList"
                :key="item.category_id"
                :label="item.category_name"
                :value="item.category_id"
              />
            </el-select>
          </el-col>
          <el-col :xs="24" :sm="6" :md="6" class="filter-col">
            <div class="price-filter-wrapper">
              <el-input
                v-model.number="filterForm.priceMin"
                type="number"
                step="0.01"
                precision="2"
                placeholder="¥最小"
                class="price-filter-input"
                size="large"
              />
              <span class="price-separator">-</span>
              <el-input
                v-model.number="filterForm.priceMax"
                type="number"
                step="0.01"
                precision="2"
                placeholder="¥最大"
                class="price-filter-input"
                size="large"
              />
            </div>
          </el-col>
          <el-col :xs="24" :sm="6" :md="6" class="filter-col btn-col">
            <el-button
              type="default"
              @click="resetFilter"
              icon="el-icon-refresh"
              class="reset-btn"
              size="large"
            >
              重置筛选
            </el-button>
          </el-col>
        </el-row>

        <div class="filter-tags" v-if="hasFilter">
          <el-tag
            v-for="(tag, index) in filterTags"
            :key="index"
            closable
            @close="removeFilterTag(tag.type)"
            class="filter-tag"
            size="large"
          >
            {{ tag.label }}
          </el-tag>
        </div>
      </div>

      <div class="table-wrapper">
        <el-table
          :data="filteredMaterialList"
          border
          stripe
          :header-cell-style="{
            background: '#f5f5f5',
            color: '#333',
            fontWeight: '700',
            textAlign: 'center',
            fontSize: '16px'
          }"
          :cell-style="{
            verticalAlign: 'middle',
            textAlign: 'center',
            fontSize: '15px',
            height: '50px'
          }"
          class="material-table"
          v-loading="tableLoading"
          empty-text="暂无匹配的原材料数据"
          @selection-change="handleMaterialSelection"
          size="large"
        >
          <el-table-column type="selection" width="65" align="center" />

          <el-table-column prop="category_name" label="类别" min-width="120" align="center" sortable />
          <el-table-column prop="name" label="名称" min-width="180" align="center" sortable />
          <el-table-column prop="price" label="单价(元)" width="120" align="center" sortable>
            <template #default="scope">
              {{ scope.row.price ? scope.row.price.toFixed(2) : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="create_time" label="创建时间" min-width="200" align="center" sortable>
            <template #default="scope">
              {{ formatTime(scope.row.create_time) }}
            </template>
          </el-table-column>
          <el-table-column prop="update_time" label="最后更新时间" min-width="200" align="center" sortable>
            <template #default="scope">
              {{ formatTime(scope.row.update_time || scope.row.create_time) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160" align="center" fixed="right">
            <template #default="scope">
              <div class="operate-btn-group">
                <el-button
                  type="primary"
                  size="large"
                  @click="handleEditMaterialRow(scope.row)"
                  class="edit-btn"
                >
                  编辑
                </el-button>
                <el-button
                  type="danger"
                  size="large"
                  @click="handleDeleteMaterial(scope.row.material_id)"
                  class="delete-btn"
                >
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrapper" v-if="total > 0">
          <el-pagination
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            :current-page="currentPage"
            :page-sizes="[10, 20, 50]"
            :page-size="pageSize"
            layout="total, prev, pager, next, jumper, ->, sizes"
            :total="total"
            background
            class="table-pagination"
            size="large"
          />
        </div>
      </div>
    </div>

    <el-dialog
      title="新增原材料类别"
      v-model="categoryDialogVisible"
      width="450px"
      :close-on-click-modal="false"
      @close="resetCategoryForm"
      size="large"
    >
      <el-form
        :model="categoryForm"
        ref="categoryFormRef"
        label-width="80px"
        :rules="[{ required: true, message: '请输入类别名称', trigger: 'blur' }]"
      >
        <el-form-item label="类别名称" prop="category_name">
          <el-input
            v-model="categoryForm.category_name"
            clearable
            placeholder="如：棉/化纤/粘胶/氨纶"
            class="form-input"
            size="large"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="categoryDialogVisible = false" size="large">取消</el-button>
        <el-button
          type="primary"
          @click="handleAddCategory"
          :loading="categoryLoading"
          size="large"
        >
          确认新增
        </el-button>
      </template>
    </el-dialog>
  </div>

  <template #footer>
    <div class="dialog-footer-btn-group">
      <el-button
        @click="materialDialogVisible = false"
        class="operate-btn default-btn"
        size="large"
      >
        取消
      </el-button>
      <el-button
        type="primary"
        @click="confirmMaterialSelect"
        :disabled="selectedMaterialRows.length === 0"
        class="operate-btn primary-btn"
        size="large"
      >
        确认选择
      </el-button>
    </div>
  </template>
</el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, getCurrentInstance } from 'vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'

// ========== 核心修改1：复用全局axios实例 ==========
const { proxy } = getCurrentInstance()
const $axios = proxy.$axios // 直接使用main.js挂载的全局axios

// ========== 关键修复1：全局抑制ResizeObserver错误（修复ESLint空块错误） ==========
onMounted(() => {
  // 捕获ResizeObserver的非致命错误，避免控制台报错
  const originalError = window.onerror
  window.onerror = function(message, source, lineno, colno, error) {
    // 过滤ResizeObserver的loop错误
    if (message.includes('ResizeObserver loop completed with undelivered notifications')) {
      return true // 阻止错误向上传播
    }
    // 其他错误正常抛出
    if (originalError) {
      return originalError(message, source, lineno, colno, error)
    }
    return false
  }

  // 可选：修复Element Plus的ResizeObserver清理问题（修复空catch块）
  if (window.ResizeObserver) {
    const originalObserve = window.ResizeObserver.prototype.observe
    window.ResizeObserver.prototype.observe = function(target, options) {
      try {
        originalObserve.call(this, target, options)
      } catch (e) {
        // 忽略ResizeObserver观察失败的非致命错误（修复ESLint no-empty错误）
        console.debug('ResizeObserver observe failed:', e)
      }
    }
  }
})

// ========== 通用工具函数 ==========
const toFixedNumber = (value, decimalPlaces) => {
  const num = Number(value) || 0
  return num.toFixed(decimalPlaces)
}

// ========== 响应式数据定义 ==========
// 配比验证
const ratioForm = ref({
  cotton: 0,
  chemical: 0,
  viscose: 0
})
const ratioVerifyResult = ref(null)
const verifyLoading = ref(false)

// 原材料选择
const materialDialogVisible = ref(false)
const materialList = ref([])
const selectedMaterialRows = ref([])
const selectedMaterials = ref([])

// 计算参数
const calcParams = ref({
  count: '',
  color: '',
  lossRate: '',
  spinningFee: '',
  netWeight: '',
  taxRate: '',
  profitRate: '',
  innerBoxFee: '',
  letterOfCredit: '',
  calculatedRate: '',
  currentRate: '',
  calcDate: ''
})

// 汇率错误提示
const exchangeRateError = ref('')

// 计算结果
const calcResult = ref(null)
const calcLoading = ref(false)
const showFormula = ref(false)

// 历史计算（新增分页相关）
const historyList = ref([])
const historyLoading = ref(false)
const historyFilter = ref('')
const historyCurrentPage = ref(1)  // 历史记录当前页
const historyPageSize = ref(10)    // 历史记录每页条数
const selectedHistoryRows = ref([])
const historyTableRef = ref(null)

// ========== 新增：原材料管理相关响应式数据 ==========
const categoryLoading = ref(false)
const materialLoading = ref(false)
const tableLoading = ref(false)
const categoryFormRef = ref(null)
const materialFormRef = ref(null)
const isEditMaterial = ref(false) // 区分是否编辑原材料
const categoryDialogVisible = ref(false) // 新增类别弹窗开关

// 原材料分页
const currentPage = ref(1)
const pageSize = ref(10)

// 原材料筛选条件
const globalFilter = ref('')
const filterForm = ref({
  categoryIds: [],
  priceMin: '',
  priceMax: '',
  createTimeRange: []
})

// 原材料基础数据
const categoryList = ref([]) // 类别列表（核心：确保该数组能正确加载数据）
const rawMaterialList = ref([]) // 原材料列表（区分原有materialList）
const materialRules = ref({
  category_id: [{ required: true, message: '请选择原材料类别', trigger: 'change' }],
  name: [{ required: true, message: '请输入原材料名称', trigger: 'blur' }],
  price: [
    { required: true, message: '请输入单价', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '单价需大于0且保留2位小数', trigger: 'blur' }
  ]
})
const categoryForm = ref({ category_name: '' })
const materialForm = ref({ material_id: '', category_id: '', name: '', price: '' })

// ========== 计算属性 ==========
// 总配比
const totalRatio = computed(() => {
  return selectedMaterials.value.reduce((sum, item) => sum + (Number(item.ratio) || 0), 0)
})

// 筛选后的历史记录
const filteredHistoryList = computed(() => {
  if (!historyList.value.length) return []
  const keyword = historyFilter.value.toLowerCase().trim()
  if (!keyword) return historyList.value
  return historyList.value.filter(item => {
    return (item.calc_id?.toString() || '').includes(keyword) ||
           (item.composition?.toLowerCase() || '').includes(keyword) ||
           (item.count?.toString() || '').includes(keyword) ||
           (item.color?.toLowerCase() || '').includes(keyword)
  })
})

// 分页后的历史记录（核心新增）
const totalHistory = computed(() => filteredHistoryList.value.length)
const paginatedHistoryList = computed(() => {
  const startIndex = (historyCurrentPage.value - 1) * historyPageSize.value
  const endIndex = startIndex + historyPageSize.value
  return filteredHistoryList.value.slice(startIndex, endIndex)
})

// ========== 新增：时间格式化函数 ==========
const formatTime = (timeStr) => {
  if (!timeStr) return '-'
  let date = new Date(timeStr)
  if (isNaN(date.getTime())) return '-'
  const offset = 8 * 60 * 60 * 1000
  const utcTime = date.getTime() + (date.getTimezoneOffset() * 60 * 1000)
  const beijingTime = new Date(utcTime + offset)
  return beijingTime.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/\//g, '-')
}

// ========== 新增：原材料筛选计算属性 ==========
// 筛选后的全量原材料数据
const filteredAllMaterialList = computed(() => {
  if (tableLoading.value) return []
  let data = [...rawMaterialList.value]

  // 全局搜索
  if (globalFilter.value) {
    const keyword = globalFilter.value.trim().toLowerCase()
    data = data.filter(item =>
      (item.name && item.name.toLowerCase().includes(keyword)) ||
      (item.category_name && item.category_name.toLowerCase().includes(keyword))
    )
  }

  // 类别筛选
  if (filterForm.value.categoryIds.length > 0) {
    data = data.filter(item => filterForm.value.categoryIds.includes(item.category_id))
  }

  // 单价筛选
  if (filterForm.value.priceMin !== '') {
    data = data.filter(item => item.price >= Number(filterForm.value.priceMin))
  }
  if (filterForm.value.priceMax !== '') {
    data = data.filter(item => item.price <= Number(filterForm.value.priceMax))
  }

  // 时间筛选
  if (filterForm.value.createTimeRange.length === 2) {
    const [start, end] = filterForm.value.createTimeRange
    data = data.filter(item => {
      const createTime = new Date(item.create_time).getTime()
      const startTime = new Date(start).getTime()
      const endTime = new Date(end).getTime()
      return createTime >= startTime && createTime <= endTime
    })
  }

  return data
})

// 原材料总条数
const total = computed(() => filteredAllMaterialList.value.length)

// 分页后原材料数据
const filteredMaterialList = computed(() => {
  if (tableLoading.value) return []
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  return filteredAllMaterialList.value.slice(startIndex, endIndex)
})

// 原材料筛选标签
const filterTags = computed(() => {
  const tags = []
  if (globalFilter.value) tags.push({ type: 'global', label: `全局搜索：${globalFilter.value}` })
  if (filterForm.value.categoryIds.length > 0) {
    const names = filterForm.value.categoryIds.map(id => {
      const item = categoryList.value.find(c => c.category_id === id)
      return item ? item.category_name : id
    }).join('、')
    tags.push({ type: 'category', label: `类别：${names}` })
  }
  if (filterForm.value.priceMin !== '' || filterForm.value.priceMax !== '') {
    const min = filterForm.value.priceMin || '0'
    const max = filterForm.value.priceMax || '∞'
    tags.push({ type: 'price', label: `单价：${min}-${max}元` })
  }
  if (filterForm.value.createTimeRange.length === 2) {
    tags.push({ type: 'time', label: `创建时间：${filterForm.value.createTimeRange[0]} 至 ${filterForm.value.createTimeRange[1]}` })
  }
  return tags
})

const hasFilter = computed(() => filterTags.value.length > 0)

// ========== 新增：监听原材料筛选条件变化 ==========
watch([globalFilter, () => filterForm.value.categoryIds, () => filterForm.value.priceMin, () => filterForm.value.priceMax, () => filterForm.value.createTimeRange], () => {
  currentPage.value = 1
}, { deep: true })

// ========== 核心方法 ==========
// 1. 汇率相关
const getCurrentExchangeRate = async () => {
  exchangeRateError.value = ''
  try {
    // 核心修改：使用全局axios，接口路径去掉/api前缀
    const res = await $axios.get('/calculation/exchange/rate/current/')
    const rateData = res.data || res // 兼容全局axios拦截器返回结构
    if (rateData && rateData.current_exchange_rate !== undefined && !isNaN(Number(rateData.current_exchange_rate))) {
      const currentRate = Number(rateData.current_exchange_rate)
      calcParams.value.currentRate = currentRate
      ElMessage.success('获取实时汇率成功')
    } else {
      exchangeRateError.value = '获取的汇率数据无效（非数字）'
      calcParams.value.currentRate = ''
      ElMessage.warning('汇率数据解析失败，后端将使用默认汇率逻辑')
    }
  } catch (error) {
    exchangeRateError.value = `获取汇率失败：${error.message || '服务器异常'}`
    calcParams.value.currentRate = ''
    ElMessage.error(`获取汇率失败：${error.message || '服务器异常'}，后端将使用默认汇率逻辑`)
  }
}

// ========== 原材料管理核心方法 ==========
// 加载类别列表（修复：确保接口调用和数据赋值正确）
const loadCategoryList = async () => {
  try {
    tableLoading.value = true
    // 核心修改：使用全局axios，接口路径简化
    const res = await $axios.get('/calculation/category/list/')
    // 兼容全局axios拦截器返回结构（res.data 或 res）
    categoryList.value = res.data?.data || res.data || res || []
    console.log('类别列表加载成功：', categoryList.value) // 调试用，可删除
  } catch (error) {
    ElMessage.error(`加载类别列表失败：${error.message || '接口请求异常'}`)
    categoryList.value = [] // 确保数组不为undefined
  } finally {
    tableLoading.value = false
  }
}

// 加载原材料列表（修改原有loadMaterialList方法）
const loadMaterialList = async () => {
  try {
    materialLoading.value = true
    const res = await $axios.get('/calculation/material/list/')
    rawMaterialList.value = res.data?.data || res.data || res || []
    materialList.value = rawMaterialList.value // 同步到原有选择用的列表
    console.log('原材料列表加载成功：', rawMaterialList.value) // 调试用，可删除
  } catch (error) {
    ElMessage.error(`加载原材料列表失败：${error.message || '接口请求异常'}`)
    rawMaterialList.value = []
    materialList.value = []
  } finally {
    materialLoading.value = false
  }
}

// 重置原材料筛选
const resetFilter = () => {
  globalFilter.value = ''
  filterForm.value = { categoryIds: [], priceMin: '', priceMax: '', createTimeRange: [] }
  currentPage.value = 1
  ElMessage.success('筛选条件已重置')
}

// 移除单个原材料筛选标签
const removeFilterTag = (type) => {
  switch (type) {
    case 'global': globalFilter.value = ''; break
    case 'category': filterForm.value.categoryIds = []; break
    case 'price': filterForm.value.priceMin = ''; filterForm.value.priceMax = ''; break
    case 'time': filterForm.value.createTimeRange = []; break
  }
  currentPage.value = 1
}

// 原材料分页操作
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
}
const handleCurrentChange = (val) => {
  currentPage.value = val
}

// 新增类别弹窗相关
const openCategoryDialog = () => {
  categoryDialogVisible.value = true
  resetCategoryForm()
}
const resetCategoryForm = () => {
  categoryForm.value = { category_name: '' }
  categoryFormRef.value?.resetFields()
}
const handleAddCategory = async () => {
  if (!categoryFormRef.value) return
  try {
    await categoryFormRef.value.validate()
  } catch (error) {
    return ElMessage.warning('请输入有效的类别名称！')
  }
  const name = categoryForm.value.category_name.trim()
  if (!name) return ElMessage.warning('请输入类别名称！')

  try {
    categoryLoading.value = true
    await $axios.post('/calculation/category/add/', { category_name: name })
    ElMessage.success('新增类别成功！')
    categoryDialogVisible.value = false
    await loadCategoryList() // 新增类别后重新加载类别列表（核心）
    await loadMaterialList() // 新增类别后刷新原材料列表
  } catch (error) {
    ElMessage.error(`新增类别失败：${error.message || '服务器异常'}`)
  } finally {
    categoryLoading.value = false
  }
}

// 新增原材料
const handleAddMaterial = async () => {
  if (categoryList.value.length === 0) return ElMessage.warning('请先新增原材料类别！')
  if (!materialFormRef.value) return ElMessage.error('表单初始化失败，请刷新')

  try {
    await materialFormRef.value.validate()
  } catch (err) {
    return ElMessage.warning('请填写完整且有效的表单数据！')
  }

  const { category_id, name, price } = materialForm.value
  if (!category_id || !name.trim() || price <= 0) return ElMessage.warning('表单数据有误，请检查！')

  try {
    materialLoading.value = true
    await $axios.post('/calculation/material/add/', {
      category_id: Number(category_id),
      name: name.trim(),
      price: Number(price)
    })
    ElMessage.success('新增原材料成功！')
    materialForm.value = { material_id: '', category_id: '', name: '', price: '' }
    materialFormRef.value.resetFields()
    await loadMaterialList() // 新增后刷新列表
  } catch (error) {
    ElMessage.error(`新增失败：${error.message || '服务器异常'}`)
  } finally {
    materialLoading.value = false
  }
}

// 编辑原材料
const handleEditMaterialRow = (row) => {
  isEditMaterial.value = true
  materialForm.value = { ...row }
}
const handleEditMaterial = async () => {
  if (!materialFormRef.value) return
  try {
    await materialFormRef.value.validate()
  } catch (error) {
    return ElMessage.warning('表单填写不完整，请检查！')
  }
  const { material_id, category_id, name, price } = materialForm.value
  if (!material_id || !category_id || !name || price <= 0) return ElMessage.warning('数据有误！')

  try {
    materialLoading.value = true
    await $axios.post(`/calculation/material/edit/${material_id}/`, {
      category_id: Number(category_id),
      name: name.trim(),
      price: Number(price)
    })
    ElMessage.success('修改成功！')
    cancelEditMaterial()
    await loadMaterialList() // 修改后刷新列表
  } catch (error) {
    ElMessage.error(`修改失败：${error.message}`)
  } finally {
    materialLoading.value = false
  }
}

// 取消编辑原材料
const cancelEditMaterial = () => {
  isEditMaterial.value = false
  materialForm.value = { material_id: '', category_id: '', name: '', price: '' }
  materialFormRef.value?.resetFields()
}

// 删除原材料
const handleDeleteMaterial = async (materialId) => {
  try {
    await ElMessageBox.confirm('确定删除该原材料？删除后不可恢复！', '确认删除', { type: 'warning' })
    await $axios.delete(`/calculation/material/delete/${materialId}/`)
    ElMessage.success('删除成功！')
    await loadMaterialList() // 删除后刷新列表
  } catch (error) {
    if (error !== 'cancel') ElMessage.error(`删除失败：${error.message}`)
  }
}

// ========== 原材料选择弹窗相关 ==========
const openMaterialDialog = () => {
  materialDialogVisible.value = true
  selectedMaterialRows.value = []
  // 打开弹窗时重新加载类别和原材料列表，确保数据最新
  loadCategoryList()
  loadMaterialList()
}

const handleMaterialSelection = (val) => {
  selectedMaterialRows.value = val || []
}

const confirmMaterialSelect = () => {
  const newMaterials = (selectedMaterialRows.value || []).filter(newItem => {
    return !selectedMaterials.value.some(existItem => existItem.material_id === newItem.material_id)
  })
  newMaterials.forEach(item => {
    selectedMaterials.value.push({
      ...item,
      ratio: 0
    })
  })
  materialDialogVisible.value = false
  ElMessage.success(`成功选择 ${newMaterials.length} 种原材料`)
}

const removeMaterial = (index) => {
  if (index >= 0 && index < selectedMaterials.value.length) {
    selectedMaterials.value.splice(index, 1)
  }
}

const checkTotalRatio = () => {
  const ratio = totalRatio.value || 0
  if (ratio < 99.9 || ratio > 100.1) {
    ElNotification.warning({
      title: '配比提醒',
      message: `当前总配比为 ${toFixedNumber(ratio, 1)}%，需调整至100%`,
      duration: 3000
    })
  }
}

// 3. 配比验证
const verifyRatio = async () => {
  if (!ratioForm.value.cotton && !ratioForm.value.chemical && !ratioForm.value.viscose) {
    return ElMessage.warning('请至少输入一项含量')
  }
  try {
    verifyLoading.value = true
    const res = await $axios.post('/calculation/yarn/verify-ratio/', {
      cotton: Number(ratioForm.value.cotton) || 0,
      chemical: Number(ratioForm.value.chemical) || 0,
      viscose: Number(ratioForm.value.viscose) || 0
    })
    ratioVerifyResult.value = res.data?.data || res.data || {}
    if (res.data?.success || res.success !== false) {
      ElMessage.success('配比验证成功')
    } else {
      ElMessage.warning('配比验证失败，请检查输入')
    }
  } catch (error) {
    ElMessage.error(`验证失败：${error.message}`)
    ratioVerifyResult.value = { success: false, errors: [error.message] }
  } finally {
    verifyLoading.value = false
  }
}

// 4. 提交计算
const submitCalculation = async () => {
  // 1. 前端仅校验必填项
  const count = Number(calcParams.value.count)
  if (!calcParams.value.count || isNaN(count) || count <= 0) {
    return ElMessage.warning('请输入有效的支数（大于0的数字）')
  }
  if (!calcParams.value.color.trim()) {
    return ElMessage.warning('请输入颜色（如黑色、白色）')
  }
  if (selectedMaterials.value.length < 1) {
    return ElMessage.warning('至少选择1种原材料')
  }
  const ratio = totalRatio.value || 0
  if (ratio < 99.9 || ratio > 100.1) {
    return ElMessage.warning(`总配比需等于100%（当前：${toFixedNumber(ratio, 1)}%）`)
  }
  const invalidMaterial = selectedMaterials.value.find(item => isNaN(Number(item.ratio)) || Number(item.ratio) <= 0)
  if (invalidMaterial) {
    return ElMessage.error(`原材料【${invalidMaterial.category_name || '未知'} - ${invalidMaterial.name || '未知'}】的配比无效，请输入大于0的数字`)
  }

  // 2. 组装参数
  const basicParams = {}
  if (calcParams.value.lossRate !== '' && !isNaN(Number(calcParams.value.lossRate))) {
    basicParams.yarn_loss_rate = Number(calcParams.value.lossRate)
  }
  if (calcParams.value.spinningFee !== '' && !isNaN(Number(calcParams.value.spinningFee))) {
    basicParams.spinning_cost = Number(calcParams.value.spinningFee)
  }
  if (calcParams.value.netWeight !== '' && !isNaN(Number(calcParams.value.netWeight))) {
    basicParams.cone_net_weight_rate = Number(calcParams.value.netWeight)
  }
  if (calcParams.value.taxRate !== '' && !isNaN(Number(calcParams.value.taxRate))) {
    basicParams.tax_rate = Number(calcParams.value.taxRate)
  }
  if (calcParams.value.profitRate !== '' && !isNaN(Number(calcParams.value.profitRate))) {
    basicParams.profit_point = Number(calcParams.value.profitRate)
  }
  if (calcParams.value.innerBoxFee !== '' && !isNaN(Number(calcParams.value.innerBoxFee))) {
    basicParams.inner_support_fee = Number(calcParams.value.innerBoxFee)
  }
  if (calcParams.value.calculatedRate !== '' && !isNaN(Number(calcParams.value.calculatedRate))) {
    basicParams.calc_exchange_rate = Number(calcParams.value.calculatedRate)
  }
  if (calcParams.value.letterOfCredit !== '' && !isNaN(Number(calcParams.value.letterOfCredit))) {
    basicParams.letter_of_credit = Number(calcParams.value.letterOfCredit)
  }
  if (calcParams.value.currentRate !== '' && !isNaN(Number(calcParams.value.currentRate))) {
    basicParams.currentRate = Number(calcParams.value.currentRate)
  }

  const submitData = {
    count: String(count),
    color: calcParams.value.color.trim(),
    compositions: selectedMaterials.value.map(item => ({
      material_id: Number(item.material_id) || 0,
      ratio: Number(item.ratio) || 0
    })),
    basic_params: basicParams
  }

  // 3. 提交请求
  try {
    calcLoading.value = true
    const res = await $axios.post('/calculation/yarn/submit-calculation/', submitData)
    calcResult.value = res.data?.data || res.data || {}
    ElMessage.success('报价计算成功并入库')
    await loadHistoryList()
  } catch (error) {
    const errMsg = error.response?.data?.message || error.message || '计算失败'
    ElMessage.error(`计算失败：${errMsg}`)
    calcResult.value = null
  } finally {
    calcLoading.value = false
  }
}

// 6. 历史记录相关（新增分页方法）
const loadHistoryList = async () => {
  try {
    historyLoading.value = true
    const res = await $axios.get('/calculation/yarn/calculation-history/')
    historyList.value = res.data?.data || res.data || []
    historyCurrentPage.value = 1 // 刷新后重置页码
  } catch (error) {
    ElMessage.error('加载历史记录失败')
    historyList.value = []
  } finally {
    historyLoading.value = false
  }
}

// 历史记录分页事件（核心新增）
const handleHistorySizeChange = (val) => {
  historyPageSize.value = val
  historyCurrentPage.value = 1 // 切换页大小时重置页码
}
const handleHistoryCurrentChange = (val) => {
  historyCurrentPage.value = val
}

const deleteHistory = async (calcId) => {
  if (!calcId) {
    return ElMessage.warning('无效的记录ID')
  }
  try {
    await ElMessageBox.confirm('确定删除该条历史记录？', '确认删除', { type: 'warning' })
    await $axios.delete(`/calculation/yarn/calculation-history/${calcId}/`)
    ElMessage.success('删除成功')
    await loadHistoryList()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error(`删除失败：${error.message || '未知错误'}`)
  }
}

const handleHistorySelection = (val) => {
  selectedHistoryRows.value = val || []
}

const downloadHistory = async () => {
  if (selectedHistoryRows.value.length === 0) {
    return ElMessage.warning('请至少选择一条计算记录')
  }
  try {
    const calcIds = selectedHistoryRows.value.map(row => row.calc_id).join(',')
    const link = document.createElement('a')
    link.style.display = 'none'
    const response = await $axios({
      url: '/calculation/yarn/history/download/',
      method: 'GET',
      params: { calc_ids: calcIds },
      responseType: 'blob',
      timeout: 30000
    })
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = window.URL.createObjectURL(blob)
    link.href = url
    const contentDisposition = response.headers['content-disposition']
    let filename = '纱线计算记录.xlsx'
    if (contentDisposition) {
      const matches = /filename\*?=UTF-8''(.*)/i.exec(contentDisposition)
      if (matches && matches[1]) {
        filename = decodeURIComponent(matches[1])
      }
    }
    link.download = filename
    document.body.appendChild(link)
    link.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(link)
    ElMessage.success(`成功下载 ${selectedHistoryRows.value.length} 条计算记录`)
    historyTableRef.value?.clearSelection()
  } catch (error) {
    const errMsg = error.response?.data?.message || error.message || '下载失败'
    ElMessage.error(`下载失败：${errMsg}`)
  }
}

// 7. 公式显示/隐藏
const toggleFormula = () => {
  showFormula.value = !showFormula.value
}

// 8. 重置表单
const resetAll = () => {
  ratioForm.value = { cotton: 0, chemical: 0, viscose: 0 }
  ratioVerifyResult.value = null
  selectedMaterials.value = []
  calcParams.value = {
    count: '',
    color: '',
    lossRate: '',
    spinningFee: '',
    netWeight: '',
    taxRate: '',
    profitRate: '',
    innerBoxFee: '',
    letterOfCredit: '',
    calculatedRate: '',
    currentRate: calcParams.value.currentRate || '',
    calcDate: ''
  }
  exchangeRateError.value = ''
  calcResult.value = null
  showFormula.value = false
  ElMessage.success('表单已重置')
}

// ========== 生命周期 ==========
// 新增：设置计算日期默认值为今日
const setDefaultCalcDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // 月份补0
  const day = String(today.getDate()).padStart(2, '0'); // 日期补0
  calcParams.value.calcDate = `${year}-${month}-${day}`;
};

onMounted(async () => {
  try {
    // 先设置默认日期
    setDefaultCalcDate();
    // 核心修复：添加loadCategoryList调用，确保类别列表初始化加载
    await Promise.all([
      getCurrentExchangeRate(),
      loadCategoryList(), // 新增：加载类别列表
      loadMaterialList(),
      loadHistoryList()
    ])
  } catch (error) {
    ElMessage.error(`初始化数据失败：${error.message || '未知错误'}`)
  }
})

// ========== 监听汇率输入 ==========
watch(() => calcParams.value.calculatedRate, (val) => {
  if (val && val !== '' && isNaN(Number(val))) {
    ElMessage.error('汇率必须为数字格式（如 7.2345）')
    calcParams.value.calculatedRate = ''
  }
})

// ========== 监听筛选条件，重置历史记录页码 ==========
watch(historyFilter, () => {
  historyCurrentPage.value = 1
})
</script>
<style scoped>
/* 隐藏number输入框的上下步进按钮 */
:deep(input[type="number"]) {
  -moz-appearance: textfield; /* Firefox */
}
:deep(input[type="number"]::-webkit-outer-spin-button),
:deep(input[type="number"]::-webkit-inner-spin-button) {
  -webkit-appearance: none; /* Chrome/Safari/Edge */
  margin: 0;
}
/* 全局容器 - 保持和原材料页面一致 */
.yarn-quote-container {
  padding: 20px;
  background: #f8f8f8;
  min-height: 100vh;
  box-sizing: border-box;
}

/* 卡片通用样式 - 统一风格 */
.card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  padding: 20px;
  margin-bottom: 20px;
  box-sizing: border-box;
}

.form-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  padding: 20px;
  margin-bottom: 20px;
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

/* 卡片头部 - 统一样式 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.card-body {
  box-sizing: border-box;
}

/* 输入框通用样式 - 统一高度36px */
.form-input {
  height: 36px !important;
  border-radius: 4px;
  box-sizing: border-box;
  width: 100%;
}

/* 按钮通用样式 - 统一风格 */
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
  transition: all 0.2s ease;
}

/* 按钮配色 - 和原材料页面一致 */
.primary-btn {
  background: #4CAF50;
  color: #fff;
}
.primary-btn:hover {
  background: #388E3C;
}

.default-btn {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
}
.default-btn:hover {
  background: #eee;
}

.danger-btn {
  background: #f44336;
  color: #fff;
}
.danger-btn:hover {
  background: #d32f2f;
}

.text-btn {
  color: #4CAF50;
  background: transparent;
  height: auto;
  padding: 0;
}
.text-btn:hover {
  color: #388E3C;
}

/* 配比验证表单 */
.ratio-form {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: center;
}

.ratio-result {
  margin-top: 15px;
}

/* 选中原材料列表 */
.selected-materials {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  background: #fafafa;
  border-radius: 6px;
}

.material-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #eee;
}

.material-info {
  flex: 1;
  min-width: 200px;
  color: #333;
}

.percentage-input {
  width: 100px !important;
}

.total-percentage {
  margin-top: 10px;
  padding: 8px;
  font-weight: 600;
  color: #333;
  text-align: right;
}

/* 计算参数表单 */
.params-form {
  width: 100%;
}

.refresh-rate-btn {
  margin-top: 5px;
  padding: 0;
  color: #4CAF50;
}

.rate-tips {
  font-size: 12px;
  line-height: 1.4;
}
.current-rate {
  font-weight: 600;
}
.error-text {
  font-weight: 500;
}

/* 计算操作按钮 */
.calc-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.calc-btn {
  flex-shrink: 0;
}

/* 计算结果 */
.calc-result {
  padding: 10px 0;
}

.result-desc {
  margin-bottom: 15px;
}

.calc-details {
  margin-top: 15px;
}

.detail-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #333;
}

/* 公式展示样式 */
.formula-section {
  margin: 15px 0;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 6px;
  border-left: 4px solid #4CAF50;
}

.formula-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}

.math-formula {
  padding: 10px 0;
  text-align: center;
  font-size: 15px;
}

.plain-text-formula {
  font-family: "Microsoft Yahei", monospace;
  line-height: 2;
  color: #333;
  padding: 10px;
  text-align: left !important;
}
.plain-text-formula p {
  margin: 8px 0;
}

.param-explain {
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px dashed #eee;
}

.explain-title {
  font-weight: 600;
  color: #4CAF50;
  margin-bottom: 8px;
}

.param-explain ul {
  margin: 0;
  padding-left: 20px;
  color: #666;
  line-height: 1.8;
}

.param-explain li {
  margin-bottom: 4px;
}

.total-material-cost {
  margin-top: 10px;
  font-weight: 600;
  color: #4CAF50;
}

/* 历史记录卡片样式 */
.history-card {
  margin-bottom: 20px;
}

.history-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.history-filter-input {
  width: 280px !important;
}

/* 表格样式 - 统一风格 */
.material-table {
  width: 100%;
  --el-table-header-text-color: #333;
  --el-table-row-hover-bg-color: #f9f9f9;
  --el-table-border-color: #eee;
  --el-table-stripe-bg: #fafafa;
}

/* 分页样式 - 和原材料页面完全一致 */
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

/* 空提示 */
.empty-tip {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 14px;
}

/* 计算步骤项 */
.calc-step-item {
  line-height: 1.8;
  padding: 4px 0;
  border-bottom: 1px dashed #f0f0f0;
}

.mt-1 {
  margin-top: 8px !important;
}

.mt-2 {
  margin-top: 16px !important;
}

/* 响应式适配 - 统一规则 */
@media (max-width: 767px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .calc-actions, .history-actions {
    flex-direction: column;
    width: 100%;
    gap: 8px;
  }

  .operate-btn {
    width: 100%;
  }

  .material-item {
    flex-direction: column;
    align-items: stretch;
  }

  .percentage-input {
    width: 100% !important;
  }

  .history-filter-input {
    width: 100% !important;
  }
}

/* 解决fixed列遮挡 */
:deep(.el-table__fixed-right) {
  height: auto !important;
  bottom: 16px !important;
}

/* ========== 新增：原材料管理相关样式 ========== */
/* 全局容器 */
.raw-material-container {
  padding: 10px;
  background: #f8f8f8;
  border-radius: 4px;
  box-sizing: border-box;
  /* 优化：调整最大高度，适配居中弹窗 */
  max-height: 80vh;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 卡片样式 */
.form-card, .table-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  padding: 15px;
  margin-bottom: 15px;
  box-sizing: border-box;
}

/* 标题 + 新增类别按钮 */
.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}
.form-title {
  font-size: 16px;
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

/* 核心：所有输入框高度统一为36px */
.form-input, .filter-input, .price-filter-input {
  height: 36px !important;
  border-radius: 4px;
  box-sizing: border-box;
}

/* 原材料表单布局 */
.form-main-row {
  margin: 0 !important;
  align-items: flex-end;
}
.form-col {
  margin: 0 !important;
  box-sizing: border-box;
}
.material-form-item {
  margin-bottom: 0 !important;
  width: 100%;
}

/* 单价+按钮同行布局：核心调整 */
.price-btn-col {
  box-sizing: border-box;
}
.price-btn-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}
.price-input {
  flex: 1; /* 输入框占大部分宽度，按钮占小部分 */
  min-width: 120px; /* 最小宽度，避免过窄 */
}
.btn-group-container {
  display: flex;
  gap: 8px; /* 按钮间距紧凑，不冗余 */
  align-items: center;
  flex-shrink: 0; /* 按钮不被挤压 */
}

/* 操作按钮样式：统一高度 + 紧凑宽度 */
.operate-btn {
  height: 36px;
  padding: 0 16px; /* 按钮宽度适中，不占过多空间 */
  border-radius: 4px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap; /* 按钮文字不换行 */
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

/* 筛选栏样式 */
.filter-bar {
  margin-bottom: 15px;
  padding: 10px;
  background: #fafafa;
  border-radius: 6px;
  border: 1px solid #eee;
  box-sizing: border-box;
}
.filter-main-row {
  margin: 0 !important;
  margin-bottom: 10px !important;
  align-items: center;
}
.filter-col {
  margin: 0 !important;
  box-sizing: border-box;
}

/* 单价区间筛选 */
.price-filter-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
}
.price-filter-input {
  flex: 1;
}
.price-separator {
  color: #666;
  font-weight: 400;
  margin: 0 4px;
}

/* 重置按钮：高度统一 */
.reset-btn {
  height: 36px;
  width: 100%;
  border-radius: 4px;
  background: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
}
.reset-btn:hover {
  background: #eee;
}

/* 筛选标签 */
.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}
.filter-tag {
  background: #f0f9f0;
  color: #333;
  border: 1px solid #e6f7e6;
  border-radius: 4px;
}

/* 表格标题 */
.table-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

/* 表格样式 */
.table-wrapper {
  overflow-x: auto;
  border-radius: 4px;
  padding-bottom: 10px;
  box-sizing: border-box;
  /* 核心修改：表格容器仅横向滚动，纵向由外层容器控制 */
  overflow-y: visible;
}
.material-table {
  width: 100%;
  --el-table-header-text-color: #333;
  --el-table-row-hover-bg-color: #f9f9f9;
  --el-table-border-color: #eee;
  --el-table-stripe-bg: #fafafa;
}

/* 操作列按钮组 */
.operate-btn-group {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 2px 0;
}
.edit-btn, .delete-btn {
  height: 34px;
  width: 55px;
  padding: 0;
  font-size: 12px;
  line-height: 1;
  border-radius: 4px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}
.edit-btn {
  background: #4CAF50;
  color: #fff;
}
.edit-btn:hover {
  background: #388E3C;
}
.delete-btn {
  background: #f44336;
  color: #fff;
}
.delete-btn:hover {
  background: #d32f2f;
}

/* 分页样式 */
.pagination-wrapper {
  margin-top: 15px;
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

/* 解决fixed列遮挡 */
:deep(.el-table__fixed-right) {
  height: auto !important;
  bottom: 16px !important;
}

/* 响应式适配：小屏自动调整 */
@media (max-width: 767px) {
  .form-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .form-main-row {
    flex-direction: column;
    gap: 15px;
  }
  .price-btn-row {
    flex-direction: column;
    align-items: stretch;
  }
  .btn-group-container {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
  .filter-main-row {
    flex-direction: column;
    gap: 10px;
  }
}

/* 弹窗底部按钮容器 - 强制同行显示 */
.dialog-footer-btn-group {
  display: flex !important;
  justify-content: flex-end !important;
  gap: 12px !important;
  padding: 10px 20px !important;
  border-top: 1px solid #eee !important;
  margin: 0 !important;
}

/* 底部按钮样式统一 */
.dialog-footer-btn-group .operate-btn {
  flex-shrink: 0 !important; /* 按钮不被压缩 */
  min-width: 100px !important; /* 保证按钮宽度一致 */
}
/* 汇率操作行样式优化 */
.rate-action-wrapper {
  flex-wrap: wrap; /* 小屏幕自动换行，避免溢出 */
}
.refresh-rate-btn {
  padding: 0;
  color: #4CAF50;
  white-space: nowrap; /* 按钮文字不换行 */
}
.rate-tips {
  font-size: 12px;
  line-height: 1.4;
}
</style>