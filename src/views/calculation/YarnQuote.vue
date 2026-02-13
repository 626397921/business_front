<template>
  <div class="yarn-quote-container">
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

    <div class="card form-card">
      <div class="card-header">
        <div class="card-title">计算参数</div>
      </div>
      <div class="card-body">
        <el-form :model="calcParams" label-width="100px" class="params-form">
          <el-row :gutter="20">
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
                  placeholder="默认值：1,（国内：1.1 、 国外：1）"
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
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="附加费：">
                <el-input
                  v-model.number="calcParams.additionalFee"
                  type="number"
                  step="0.01"
                  precision="2"
                  clearable
                  class="form-input"
                  placeholder="非必填，额外新增费用（如加工费、包装费）"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="信用证：">
                <el-input
                  v-model.number="calcParams.letterOfCredit"
                  type="number"
                  step="0.001"
                  precision="3"
                  clearable
                  class="form-input"
                  placeholder="选填，仅作用于FOB价格（LC120=1.05）"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="计算汇率：">
                <div style="display: flex; align-items: center; gap: 8px; width: 100%; flex-wrap: wrap;">
                  <el-input
                    v-model.number="calcParams.calculatedRate"
                    type="number"
                    step="0.0001"
                    precision="4"
                    clearable
                    class="form-input"
                    placeholder="非必填，后端默认：实时汇率-0.1"
                    style="width: 240px; flex: none;"
                  />
                  <el-button
                    size="small"
                    type="text"
                    @click="getCurrentExchangeRate"
                    class="refresh-rate-btn"
                    style="padding: 0; margin: 0;"
                  >
                    刷新
                  </el-button>
                  <div class="rate-tips" style="margin: 0; white-space: nowrap;">
                    <span v-if="calcParams.currentRate" class="current-rate text-success">
                      实时汇率：{{ toFixedNumber(calcParams.currentRate, 4) }}
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
                  style="width: 220px; flex: none;"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="24">
              <el-form-item label="备注：">
<el-input
  v-model="calcParams.remark"
  type="textarea"
  :rows="1"
  :autosize="{ minRows: 1, maxRows: 3 }"
  clearable
  class="form-input"
  placeholder="非必填，填写本次计算的备注信息（如客户需求、特殊说明等）"
/>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
    </div>

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
            type="link"
            @click="toggleFormula"
            class="operate-btn text-btn formula-btn"
          >
            {{ showFormula ? '隐藏计算公式' : '显示计算公式' }}
          </el-button>
        </div>
      </div>
      <div class="card-body">
        <div v-if="calcResult" class="calc-result">
<el-descriptions title="报价结果" border :column="2" class="result-desc">
    <el-descriptions-item label="计算ID">{{ calcResult?.calc_id ?? '无' }}</el-descriptions-item>
    <el-descriptions-item label="使用汇率">
      {{ toFixedNumber(calcResult?.used_exchange_rate, 4) }}
    </el-descriptions-item>
    <el-descriptions-item label="支数">{{ calcResult?.count ?? calcParams.count ?? '无' }}</el-descriptions-item>
    <el-descriptions-item label="颜色">{{ calcResult?.color ?? calcParams.color ?? '无' }}</el-descriptions-item>
    <el-descriptions-item label="人民币价格(元/公斤)">
      {{ toFixedNumber(calcResult?.final_rmb_cost ?? calcResult?.rmb_price, 2) }}
    </el-descriptions-item>
    <el-descriptions-item label="FOB价格(美元/公斤)（含信用证，如有）">
      {{ toFixedNumber(calcResult?.fob_usd_kg ?? calcResult?.fob_price, 2) }}
    </el-descriptions-item>
    <el-descriptions-item label="信用证系数" :span="2">
      {{ toFixedNumber(calcResult?.letter_of_credit, 3) }}（{{ calcResult?.letter_of_credit > 0 ? '仅对FOB价格生效' : '未生效' }}）
    </el-descriptions-item>
    <el-descriptions-item label="附加费(元/吨)" :span="2">
      {{ toFixedNumber(calcResult?.calculation_details?.params?.additional_fee || 0, 2) }}
    </el-descriptions-item>
    <el-descriptions-item label="成分组成" :span="2">{{ calcResult?.composition ?? '无' }}</el-descriptions-item>
    <el-descriptions-item label="备注" :span="2">
      {{ calcResult?.remark || '无' }}
    </el-descriptions-item>
    <el-descriptions-item label="计算时间" :span="2">{{ calcResult?.create_time ?? '无' }}</el-descriptions-item>
  </el-descriptions>

  <div class="calc-details" v-if="showFormula && calcResult && formulaData">
    <div class="detail-title">计算逻辑详情</div>

    <div class="formula-section" v-loading="formulaLoading">
      <div class="formula-title">核心计算公式（信用证仅作用于FOB价格）</div>
      <!-- 关键修改2：优化 formulaData 的渲染条件，增加兜底判断 -->
      <div class="math-formula plain-text-formula" v-if="formulaData && Object.keys(formulaData).length > 0">
        <p>{{ formulaData['核心公式'] }}</p>
        <div v-for="(step, index) in formulaData['分步说明']" :key="index">
          <p>{{ step }}</p>
        </div>
        <div class="fob-formula mt-2">
          <div class="formula-subtitle">FOB价格公式：</div>
          <div v-for="(step, index) in formulaData['FOB价格公式']" :key="index">
            <p>{{ step }}</p>
          </div>
        </div>
      </div>
      <div class="param-explain mt-2" v-if="formulaData && Object.keys(formulaData).length > 0">
        <div class="explain-title">参数说明：</div>
        <ul>
          <li v-for="(desc, key) in formulaData['参数说明']" :key="key">
            {{ key }}：{{ desc }}
          </li>
        </ul>
      </div>
      <div v-else-if="!formulaLoading" class="empty-tip">
        未能获取到计算公式，请刷新页面重试
      </div>
      <!-- 保留原有参数说明部分 -->
      <div class="param-explain mt-2">
        <div class="explain-title">本次计算参数说明：</div>
        <ul>
          <li>总材料成本：{{ toFixedNumber(calcResult?.material_total_cost || calcResult?.calculation_details?.total_material_price, 2) }} 元/吨</li>
          <li>损耗率：{{ toFixedNumber(calcResult?.calculation_details?.params?.loss, 2) }}</li>
          <li>纺纱费：{{ toFixedNumber(calcResult?.calculation_details?.params?.spinning_cost, 2) }} 元/吨</li>
          <li>附加费：{{ toFixedNumber(calcResult?.calculation_details?.params?.additional_fee, 2) }} 元/吨</li>
          <li>净重率：{{ toFixedNumber(calcResult?.calculation_details?.params?.net_weight, 2) }}</li>
          <li>税率：{{ toFixedNumber(calcResult?.calculation_details?.params?.tax_rate, 2) }}</li>
          <li>利润率：{{ toFixedNumber(calcResult?.calculation_details?.params?.profit_rate, 2) }}</li>
          <li>内托费：{{ toFixedNumber(calcResult?.calculation_details?.params?.inner_support_fee, 2) }} 元/吨</li>
          <li>信用证系数：{{ toFixedNumber(calcResult?.calculation_details?.params?.letter_of_credit, 3) }}（仅对FOB价格进行乘数计算）</li>
          <li>计算汇率：{{ toFixedNumber(calcResult?.calculation_details?.params?.calc_exchange_rate, 4) }}</li>
          <li>备注：{{ calcResult?.remark || '无' }}</li>
        </ul>
      </div>
    </div>
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
              <el-collapse-item title="FOB价格计算步骤（含信用证，如有）">
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

    <div class="card table-card history-card">
      <div class="card-header">
        <div class="card-title">历史计算记录</div>
        <div class="history-actions">
          <el-input
            v-model="historyFilter"
            placeholder="筛选计算ID/成分/支数/颜色/备注"
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
  row-key="calc_id"
>
  <el-table-column type="selection" width="60" align="center" reserve-selection />  <!-- 新增：开启跨页保留选中 -->
  <el-table-column prop="count" label="支数" min-width="90" align="center" />
  <el-table-column prop="color" label="颜色" min-width="120" align="center" />
  <el-table-column prop="composition" label="成分组成详情" min-width="280" align="center" />
  <el-table-column prop="rmb_price" label="人民币单价(元/公斤)" width="180" align="center">
    <template #default="scope">
      {{ toFixedNumber(scope.row.rmb_price || scope.row.final_rmb_cost, 2) }}
    </template>
  </el-table-column>
  <el-table-column prop="calc_exchange_rate" label="计算汇率" width="160" align="center">
    <template #default="scope">
      {{ toFixedNumber(scope.row.calc_exchange_rate, 4) }}
    </template>
  </el-table-column>
  <el-table-column prop="fob_usd_kg" label="FOB单价(美元/公斤)）" width="180" align="center">
    <template #default="scope">
      {{ toFixedNumber(scope.row.fob_usd_kg || scope.row.fob_price, 2) }}
    </template>
  </el-table-column>
  <el-table-column prop="create_time" label="计算时间" min-width="190" align="center" />
  <el-table-column prop="username" label="用户名" min-width="120" align="center" />
  <el-table-column prop="user_role" label="用户角色" min-width="120" align="center" />
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
              row-key="material_id"
            >
               <el-table-column type="selection" width="65" align="center" reserve-selection />

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
            <el-button type="primary" @click="handleAddCategory" :loading="categoryLoading" size="large">确认新增</el-button>
          </template>
        </el-dialog>
      </div>

      <template #footer>
        <div class="dialog-footer-btn-group">
          <el-button
            @click="cancelMaterialSelect"
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

const { proxy } = getCurrentInstance()
const $axios = proxy.$axios

onMounted(() => {
  const originalError = window.onerror
  window.onerror = function(message, source, lineno, colno, error) {
    if (message.includes('ResizeObserver loop completed with undelivered notifications')) {
      return true
    }
    if (originalError) {
      return originalError(message, source, lineno, colno, error)
    }
    return false
  }

  if (window.ResizeObserver) {
    const originalObserve = window.ResizeObserver.prototype.observe
    window.ResizeObserver.prototype.observe = function(target, options) {
      try {
        originalObserve.call(this, target, options)
      } catch (e) {
        console.debug('ResizeObserver observe failed:', e)
      }
    }
  }
})

const toFixedNumber = (value, decimalPlaces) => {
  const num = Number(value);
  if (isNaN(num) || value === undefined || value === null) {
    return '0'.padEnd(decimalPlaces + 2, '0').replace(/^(\d)/, '$1.');
  }
  return num.toFixed(decimalPlaces);
}

const ratioForm = ref({
  cotton: '',
  chemical: '',
  viscose: ''
})
const ratioVerifyResult = ref(null)
const verifyLoading = ref(false)

const materialDialogVisible = ref(false)
const materialList = ref([])
const selectedMaterialRows = ref([])
const selectedMaterials = ref([])
const selectedMaterialIds = ref(new Set())

const calcParams = ref({
  count: '',
  color: '',
  lossRate: '',
  spinningFee: '',
  netWeight: '',
  taxRate: '',
  profitRate: '',
  innerBoxFee: '',
  additionalFee: '',
  remark: '',
  letterOfCredit: '',
  calculatedRate: '',
  currentRate: '',
  calcDate: ''
})

const exchangeRateError = ref('')

const calcResult = ref(null)
const calcLoading = ref(false)
const showFormula = ref(false)
const formulaData = ref(null)
const formulaLoading = ref(false)

const historyList = ref([])
const historyLoading = ref(false)
const historyFilter = ref('')
const historyCurrentPage = ref(1)
const historyPageSize = ref(10)
const selectedHistoryRows = ref([])
const historyTableRef = ref(null)

const categoryLoading = ref(false)
const materialLoading = ref(false)
const tableLoading = ref(false)
const categoryFormRef = ref(null)
const materialFormRef = ref(null)
const isEditMaterial = ref(false)
const categoryDialogVisible = ref(false)

const currentPage = ref(1)
const pageSize = ref(10)

const globalFilter = ref('')
const filterForm = ref({
  categoryIds: [],
  priceMin: '',
  priceMax: '',
  createTimeRange: []
})

const categoryList = ref([])
const rawMaterialList = ref([])
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

const totalRatio = computed(() => {
  return selectedMaterials.value.reduce((sum, item) => sum + (Number(item.ratio) || 0), 0)
})

const filteredHistoryList = computed(() => {
  if (!historyList.value.length) return []
  const keyword = historyFilter.value.toLowerCase().trim()
  if (!keyword) return historyList.value
  return historyList.value.filter(item => {
    return (item.calc_id?.toString() || '').includes(keyword) ||
           (item.composition?.toLowerCase() || '').includes(keyword) ||
           (item.count?.toString() || '').includes(keyword) ||
           (item.color?.toLowerCase() || '').includes(keyword) ||
           (item.remark?.toLowerCase() || '').includes(keyword)
  })
})

const totalHistory = computed(() => filteredHistoryList.value.length)
const paginatedHistoryList = computed(() => {
  const startIndex = (historyCurrentPage.value - 1) * historyPageSize.value
  const endIndex = startIndex + historyPageSize.value
  return filteredHistoryList.value.slice(startIndex, endIndex)
})

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

const filteredAllMaterialList = computed(() => {
  if (tableLoading.value) return []
  let data = [...rawMaterialList.value]

  if (globalFilter.value) {
    const keyword = globalFilter.value.trim().toLowerCase()
    data = data.filter(item =>
      (item.name && item.name.toLowerCase().includes(keyword)) ||
      (item.category_name && item.category_name.toLowerCase().includes(keyword))
    )
  }

  if (filterForm.value.categoryIds.length > 0) {
    data = data.filter(item => filterForm.value.categoryIds.includes(item.category_id))
  }

  if (filterForm.value.priceMin !== '') {
    data = data.filter(item => item.price >= Number(filterForm.value.priceMin))
  }
  if (filterForm.value.priceMax !== '') {
    data = data.filter(item => item.price <= Number(filterForm.value.priceMax))
  }

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

const total = computed(() => filteredAllMaterialList.value.length)

const filteredMaterialList = computed(() => {
  if (tableLoading.value) return []
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  return filteredAllMaterialList.value.slice(startIndex, endIndex)
})

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

watch([globalFilter, () => filterForm.value.categoryIds, () => filterForm.value.priceMin, () => filterForm.value.priceMax, () => filterForm.value.createTimeRange], () => {
  currentPage.value = 1
}, { deep: true })

const getCurrentExchangeRate = async () => {
  exchangeRateError.value = ''
  try {
    const res = await $axios.get('/calculation/exchange/rate/current/')
    const rateData = res.data || res
    if (rateData && rateData.current_exchange_rate !== undefined && !isNaN(Number(rateData.current_exchange_rate))) {
      const currentRate = Number(rateData.current_exchange_rate)
      calcParams.value.currentRate = currentRate
      const defaultCalculatedRate = currentRate - 0.1
      calcParams.value.calculatedRate = defaultCalculatedRate.toFixed(4)
      ElMessage.success('获取实时汇率成功，已自动填充默认计算汇率（实时汇率-0.1）')
    } else {
      exchangeRateError.value = '获取的汇率数据无效（非数字）'
      calcParams.value.currentRate = ''
      calcParams.value.calculatedRate = '7.0000'
      ElMessage.warning('汇率数据解析失败，已填充兜底默认汇率7.0000')
    }
  } catch (error) {
    // 统一错误提示：接口错误用弹窗，输入验证用轻量提示
    const errMsg = error.response?.data?.message || error.message || '服务器异常'
    await ElMessageBox.alert(`获取实时汇率失败：${errMsg}`, '操作失败', { type: 'error' })
    exchangeRateError.value = `获取汇率失败：${errMsg}`
    calcParams.value.currentRate = ''
    calcParams.value.calculatedRate = '7.0000'
  }
}

const loadCategoryList = async () => {
  try {
    tableLoading.value = true
    const res = await $axios.get('/calculation/category/list/')
    categoryList.value = res.data?.data || res.data || res || []
  } catch (error) {
    const errMsg = error.response?.data?.message || error.message || '接口请求异常'
    await ElMessageBox.alert(`加载类别列表失败：${errMsg}`, '操作失败', { type: 'error' })
    categoryList.value = []
  } finally {
    tableLoading.value = false
  }
}

const loadMaterialList = async () => {
  try {
    materialLoading.value = true
    const res = await $axios.get('/calculation/material/list/')
    rawMaterialList.value = res.data?.data || res.data || res || []
    materialList.value = rawMaterialList.value
  } catch (error) {
    const errMsg = error.response?.data?.message || error.message || '接口请求异常'
    await ElMessageBox.alert(`加载原材料列表失败：${errMsg}`, '操作失败', { type: 'error' })
    rawMaterialList.value = []
    materialList.value = []
  } finally {
    materialLoading.value = false
  }
}

const resetFilter = () => {
  globalFilter.value = ''
  filterForm.value = { categoryIds: [], priceMin: '', priceMax: '', createTimeRange: [] }
  currentPage.value = 1
  ElMessage.success('筛选条件已重置')
}

const removeFilterTag = (type) => {
  switch (type) {
    case 'global': globalFilter.value = ''; break
    case 'category': filterForm.value.categoryIds = []; break
    case 'price': filterForm.value.priceMin = ''; filterForm.value.priceMax = ''; break
    case 'time': filterForm.value.createTimeRange = []; break
  }
  currentPage.value = 1
}

const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
}
const handleCurrentChange = (val) => {
  currentPage.value = val
}

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
    await loadCategoryList()
    await loadMaterialList()
  } catch (error) {
    const errMsg = error.response?.data?.message || error.message || '服务器异常'
    await ElMessageBox.alert(`新增类别失败：${errMsg}`, '操作失败', { type: 'error' })
  } finally {
    categoryLoading.value = false
  }
}

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
    await loadMaterialList()
  } catch (error) {
    const errMsg = error.response?.data?.message || error.message || '服务器异常'
    await ElMessageBox.alert(`新增原材料失败：${errMsg}`, '操作失败', { type: 'error' })
  } finally {
    materialLoading.value = false
  }
}

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
    await loadMaterialList()
  } catch (error) {
    const errMsg = error.response?.data?.message || error.message || '服务器异常'
    await ElMessageBox.alert(`修改原材料失败：${errMsg}`, '操作失败', { type: 'error' })
  } finally {
    materialLoading.value = false
  }
}

const cancelEditMaterial = () => {
  isEditMaterial.value = false
  materialForm.value = { material_id: '', category_id: '', name: '', price: '' }
  materialFormRef.value?.resetFields()
}

const handleDeleteMaterial = async (materialId) => {
  try {
    await ElMessageBox.confirm('确定删除该原材料？删除后不可恢复！', '确认删除', { type: 'warning' })
    await $axios.delete(`/calculation/material/delete/${materialId}/`)
    ElMessage.success('删除成功！')
    await loadMaterialList()
  } catch (error) {
    if (error !== 'cancel') {
      const errMsg = error.response?.data?.message || error.message || '服务器异常'
      await ElMessageBox.alert(`删除原材料失败：${errMsg}`, '操作失败', { type: 'error' })
    }
  }
}

const openMaterialDialog = () => {
  materialDialogVisible.value = true
  selectedMaterialRows.value = []
  selectedMaterialIds.value.clear()
  loadCategoryList()
  loadMaterialList()
}

const cancelMaterialSelect = () => {
  materialDialogVisible.value = false
  selectedMaterialRows.value = []
  selectedMaterialIds.value.clear()
}
const handleMaterialSelection = (val) => {
  selectedMaterialRows.value = val || []

  const currentPageMaterialIds = filteredAllMaterialList.value.map(item => item.material_id)
  currentPageMaterialIds.forEach(id => {
    if (!val.some(item => item.material_id === id)) {
      selectedMaterialIds.value.delete(id)
    }
  })
  val.forEach(item => {
    selectedMaterialIds.value.add(item.material_id)
  })
}

const confirmMaterialSelect = () => {
  const allSelectedMaterials = filteredAllMaterialList.value.filter(item =>
    selectedMaterialIds.value.has(item.material_id)
  )

  const newMaterials = allSelectedMaterials.filter(newItem => {
    return !selectedMaterials.value.some(existItem => existItem.material_id === newItem.material_id)
  })

  newMaterials.forEach(item => {
    selectedMaterials.value.push({
      ...item,
      ratio: 0
    })
  })

  materialDialogVisible.value = false
  selectedMaterialIds.value.clear()
  ElMessage.success(`成功选择 ${newMaterials.length} 种原材料（跨分页累计选中 ${allSelectedMaterials.length} 种）`)
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
      duration: 3000,
      customClass: 'center-notification'
    })
  }
}

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
    const errMsg = error.response?.data?.message || error.message || '服务器异常'
    await ElMessageBox.alert(`配比验证失败：${errMsg}`, '操作失败', { type: 'error' })
    ratioVerifyResult.value = { success: false, errors: [errMsg] }
  } finally {
    verifyLoading.value = false
  }
}

const submitCalculation = async () => {
  const count = Number(calcParams.value.count)
  if (!calcParams.value.count || isNaN(count) || count <= 0) {
    return ElMessage.warning('请输入有效的支数（大于0的数字）')
  }
  if (!calcParams.value.color.trim()) {
    return ElMessage.warning('请输入颜色（如黑色、白色）')
  }
  if (selectedMaterials.value.length <2) {
    return ElMessage.warning('至少选择2种原材料')
  }
  const ratio = totalRatio.value || 0
  if (ratio < 99.9 || ratio > 100.1) {
    return ElMessage.warning(`总配比需等于100%（当前：${toFixedNumber(ratio, 1)}%）`)
  }
  const invalidMaterial = selectedMaterials.value.find(item => isNaN(Number(item.ratio)) || Number(item.ratio) <= 0)
  if (invalidMaterial) {
    return ElMessage.error(`原材料【${invalidMaterial.category_name || '未知'} - ${invalidMaterial.name || '未知'}】的配比无效，请输入大于0的数字`)
  }

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
  if (calcParams.value.additionalFee !== '' && !isNaN(Number(calcParams.value.additionalFee))) {
    basicParams.additional_fee = Number(calcParams.value.additionalFee)
  }
  if (calcParams.value.remark !== '') {
    basicParams.remark = calcParams.value.remark.trim()
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

  try {
    calcLoading.value = true
    const res = await $axios.post('/calculation/yarn/submit-calculation/', submitData)
    calcResult.value = res.data?.data || res.data || {}
    ElMessage.success('报价计算成功并入库')
    await loadHistoryList()
  } catch (error) {
    const errMsg = error.response?.data?.message || error.message || '计算失败'
    await ElMessageBox.alert(`报价计算失败：${errMsg}`, '操作失败', { type: 'error' })
    calcResult.value = null
  } finally {
    calcLoading.value = false
  }
}

const loadHistoryList = async () => {
  try {
    historyLoading.value = true
    const res = await $axios.get('/calculation/yarn/calculation-history/')
    historyList.value = res.data?.data || res.data || []
    historyCurrentPage.value = 1
  } catch (error) {
    const errMsg = error.response?.data?.message || error.message || '接口请求异常'
    await ElMessageBox.alert(`加载历史记录失败：${errMsg}`, '操作失败', { type: 'error' })
    historyList.value = []
  } finally {
    historyLoading.value = false
  }
}

const handleHistorySizeChange = (val) => {
  historyPageSize.value = val
  historyCurrentPage.value = 1
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
    if (error !== 'cancel') {
      const errMsg = error.response?.data?.message || error.message || '服务器异常'
      await ElMessageBox.alert(`删除历史记录失败：${errMsg}`, '操作失败', { type: 'error' })
    }
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
    await ElMessageBox.alert(`下载历史记录失败：${errMsg}`, '操作失败', { type: 'error' })
  }
}

const getYarnFormula = async () => {
  if (formulaData.value && Object.keys(formulaData.value).length > 0) return;
  try {
    formulaLoading.value = true;
    // 保留调试日志，方便排查
    console.log('开始请求公式接口：/calculation/yarn/formula/');

    const res = await $axios({
      url: '/calculation/yarn/formula/',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const responseData = res.data || {};
    console.log('公式接口原始返回：', responseData); // 关键调试日志

    // 修复核心：适配实际返回格式（两种兼容方案）
    // 方案1：如果后端返回的是直接的公式对象（无success/data）
    if (responseData['核心公式']) { // 直接判断是否包含核心公式字段
      formulaData.value = responseData;
    }
    // 方案2：兼容有success/data的格式
    else if (responseData.success === true || responseData.success === 'true') {
      formulaData.value = responseData.data || {};
    }
    // 方案3：兜底兼容（只要有数据就用）
    else if (Object.keys(responseData).length > 0) {
      formulaData.value = responseData;
    }
    else {
      formulaData.value = null;
      ElMessage.warning('获取计算公式失败：接口返回空数据');
    }

  } catch (error) {
    formulaData.value = null;
    console.error('公式接口请求异常详情：', error);

    // 更精准的错误提示
    if (error.response) {
      const status = error.response.status;
      const errMsg = error.response.data?.message || '未知错误';
      switch(status) {
        case 401:
          await ElMessageBox.alert('登录已过期，请重新登录后再试', '操作失败', { type: 'error' })
          break;
case 403:
  await ElMessageBox.alert(
    '您暂无查看纱线计算公式的权限，请联系管理员开通相关权限后再试。',
    '权限不足',
    {
      type: 'warning',
      confirmButtonText: '确定',
      closeOnClickModal: false
    }
  );
  formulaData.value = null;
  break;
        case 404:
          await ElMessageBox.alert('计算公式接口不存在，请检查后端路由配置', '操作失败', { type: 'error' })
          break;
        case 500:
          await ElMessageBox.alert(`服务器内部错误：${errMsg}`, '操作失败', { type: 'error' })
          break;
        default:
          await ElMessageBox.alert(`获取计算公式失败（${status}）：${errMsg}`, '操作失败', { type: 'error' })
      }
    } else if (error.request) {
      await ElMessageBox.alert('网络异常，无法连接服务器（请检查网络或后端服务状态）', '操作失败', { type: 'error' })
    } else {
      await ElMessageBox.alert(`请求初始化失败：${error.message}`, '操作失败', { type: 'error' })
    }
  } finally {
    formulaLoading.value = false;
      if (!formulaData.value) {
    showFormula.value = false;
  }
  }
};


const toggleFormula = async () => {
  showFormula.value = !showFormula.value
  if (showFormula.value) {
    // 打开公式时才请求接口
    await getYarnFormula()
  } else {
    // 关闭公式时清空数据，下次打开重新获取
    formulaData.value = null
  }
}

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
    additionalFee: '',
    remark: '',
    letterOfCredit: '',
    calculatedRate: '',
    currentRate: calcParams.value.currentRate || '',
    calcDate: ''
  }
  exchangeRateError.value = ''
  calcResult.value = null
  showFormula.value = false
  formulaData.value = null
  ElMessage.success('表单已重置')
}

const setDefaultCalcDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  calcParams.value.calcDate = `${year}-${month}-${day}`;
};

onMounted(async () => {
  try {
    setDefaultCalcDate();
    await Promise.all([
      getCurrentExchangeRate(),
      loadCategoryList(),
      loadMaterialList(),
      loadHistoryList()
    ])
  } catch (error) {
    const errMsg = error.message || '未知错误'
    await ElMessageBox.alert(`初始化数据失败：${errMsg}`, '操作失败', { type: 'error' })
  }
})

watch(() => calcParams.value.calculatedRate, (val) => {
  if (val && val !== '' && isNaN(Number(val))) {
    ElMessage.error('汇率必须为数字格式（如 7.2345）')
    calcParams.value.calculatedRate = ''
  }
})

watch(() => calcParams.value.additionalFee, (val) => {
  if (val && val !== '' && isNaN(Number(val))) {
    ElMessage.error('附加费必须为数字格式（如 100.00）')
    calcParams.value.additionalFee = ''
  }
})

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
:deep(.center-notification) {
  /* 取消默认的右上角定位 */
  right: auto !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  /* 可选：调整弹窗宽度，避免过窄 */
  min-width: 300px !important;
  text-align: center !important;
}

/* 隐藏默认的通知关闭按钮（可选，如需保留可删除） */
:deep(.center-notification .el-notification__closeBtn) {
  display: none !important;
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

/* 备注文本域样式优化 */
:deep(.el-textarea) {
  --el-textarea-input-height: auto !important;
  margin-top: 2px;
}
:deep(.el-textarea__inner) {
  min-height: 36px !important;
  resize: vertical;
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