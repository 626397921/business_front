<template>
  <div class="fabric-quote-container">
    <!-- 纱线成分配比验证卡片 -->
    <div class="card form-card">
      <div class="card-header">
        <div class="card-title">纱线成分配比验证</div>
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

    <!-- 2. 成分配置卡片（复用纱线结构，文案微调） -->
    <div class="card form-card">
      <div class="card-header">
        <div class="card-title">面料成分配置</div>
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
        <div v-else class="empty-tip">暂无选中的原材料，请点击「选择原材料」按钮添加（至少2种）</div>
      </div>
    </div>

    <!-- 3. 计算参数卡片（核心修改：新增水洗费、其余保持不变） -->
    <div class="card form-card">
      <div class="card-header">
        <div class="card-title">面料计算参数</div>
      </div>
      <div class="card-body">
        <el-form :model="calcParams" label-width="100px" class="params-form">
          <el-row :gutter="20">
            <!-- 核心项：支数、颜色（必填）；克重、幅宽（非必填，去掉required） -->
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
              <el-form-item label="克重："> <!-- 非必填：去掉required -->
                <el-input
                  v-model.number="calcParams.weight_gsm"
                  type="number"
                  precision="0"
                  clearable
                  class="form-input"
                  placeholder="非必填，输入面料克重（如180）"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="幅宽(cm)："> <!-- 非必填：去掉required -->
                <el-input
                  v-model.number="calcParams.width_cm"
                  type="number"
                  precision="0"
                  clearable
                  class="form-input"
                  placeholder="非必填，输入面料幅宽（如180）"
                />
              </el-form-item>
            </el-col>
            <!-- 基础工艺参数 -->
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="原料损耗率：">
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
              <el-form-item label="织布费：">
                <el-input
                  v-model.number="calcParams.weavingCost"
                  type="number"
                  step="0.01"
                  precision="2"
                  clearable
                  class="form-input"
                  placeholder="非必填，后端默认按是否含氨纶计算"
                />
              </el-form-item>
            </el-col>
            <!-- 新增：水洗费（和其他工艺费格式保持一致） -->
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="水洗费：">
                <el-input
                  v-model.number="calcParams.washFee"
                  type="number"
                  step="0.01"
                  precision="2"
                  clearable
                  class="form-input"
                  placeholder="非必填，水洗费默认值：3500"
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
                  placeholder="非必填，后端默认值：0.94"
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
            <!-- 新增：附加费输入框（参考纱线VUE结构） -->
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
            <!-- 信用证 -->
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="信用证：">
                <el-input
                  v-model.number="calcParams.letterOfCredit"
                  type="number"
                  step="0.001"
                  precision="3"
                  clearable
                  class="form-input"
                  placeholder="选填，默认1.05"
                />
              </el-form-item>
            </el-col>
            <!-- 统一汇率样式：和纱线VUE保持一致，flex布局紧凑排列 -->
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
            <!-- 新增：备注输入框（独占一行，和纱线VUE一致） -->
            <el-col :xs="24" :sm="24" :md="24">
              <el-form-item label="备注：">
                <el-input
                  v-model="calcParams.remark"
                  type="textarea"
                  rows="1"
                  autosize="{ minRows: 1, maxRows: 3 }"
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

    <!-- 4. 计算操作 & 结果卡片（核心修改：新增水洗费展示、公式更新） -->
    <div class="card form-card">
      <div class="card-header">
        <div class="card-title">面料计算结果</div>
        <div class="calc-actions">
          <el-button
            type="primary"
            @click="submitCalculation"
            :loading="calcLoading"
            class="operate-btn primary-btn calc-btn"
            :disabled="selectedMaterials.length < 2 || ((totalRatio || 0) < 99.9 || (totalRatio || 0) > 100.1) || !calcParams.count || !calcParams.color"
          >
            计算面料报价
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
        <!-- 计算结果展示（新增：水洗费展示） -->
        <div v-if="calcResult" class="calc-result">
          <el-descriptions title="面料报价结果" border column="2" class="result-desc">
            <el-descriptions-item label="计算ID">{{ calcResult?.calc_id ?? '无' }}</el-descriptions-item>
            <el-descriptions-item label="使用汇率">
              {{ toFixedNumber(calcResult?.used_exchange_rate, 4) }}
            </el-descriptions-item>
            <el-descriptions-item label="支数">{{ calcResult?.count ?? calcParams.count ?? '无' }}</el-descriptions-item>
            <el-descriptions-item label="颜色">{{ calcResult?.color ?? calcParams.color ?? '无' }}</el-descriptions-item>
            <el-descriptions-item label="克重(g/m²)">{{ calcResult?.weight_gsm ?? calcParams.weight_gsm ?? '未填写' }}</el-descriptions-item>
            <el-descriptions-item label="幅宽(cm)">{{ calcResult?.width_cm ?? calcParams.width_cm ?? '未填写' }}</el-descriptions-item>
            <el-descriptions-item label="人民币价格(元/公斤)">
              {{ toFixedNumber(calcResult?.final_rmb_cost ?? calcResult?.rmb_price, 2) }}
            </el-descriptions-item>
            <el-descriptions-item label="FOB价格(美元/公斤)">
              {{ toFixedNumber(calcResult?.fob_usd_kg ?? calcResult?.fob_price, 2) }}
            </el-descriptions-item>
            <el-descriptions-item label="信用证系数" :span="2">
              {{ toFixedNumber(calcResult?.letter_of_credit, 3) }}（{{ calcResult?.letter_of_credit > 0 ? '已生效' : '未生效' }}）
            </el-descriptions-item>
<!-- 附加费展示优化 -->
<el-descriptions-item label="附加费(元/吨)" :span="2">
  {{ toFixedNumber(calcResult?.calculation_params?.additional_fee || calcResult?.additional_fee || 0, 2) }}
</el-descriptions-item>
<!-- 水洗费展示优化 -->
<el-descriptions-item label="水洗费(元/吨)" :span="2">
  {{ toFixedNumber(calcResult?.calculation_params?.washing_fee || calcResult?.wash_fee || 0, 2) }}
</el-descriptions-item>
            <el-descriptions-item label="成分组成" :span="2">{{ calcResult?.composition ?? '无' }}</el-descriptions-item>
            <!-- 备注展示 -->
            <el-descriptions-item label="备注" :span="2">
              {{ calcResult?.remark || '无' }}
            </el-descriptions-item>
            <el-descriptions-item label="计算时间" :span="2">{{ calcResult?.create_time ?? '无' }}</el-descriptions-item>
          </el-descriptions>

          <!-- 分步计算详情 + 公式展示（新增水洗费到公式和参数说明） -->
          <div class="calc-details" v-if="showFormula">
            <div class="detail-title">面料计算逻辑详情</div>

<!-- 替换面料模板中原有硬编码的formula-section部分 -->
<div class="formula-section" v-loading="formulaLoading">
  <div class="formula-title">核心计算公式（信用证仅作用于FOB价格）</div>
  <!-- 动态渲染接口返回的公式 -->
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
  <!-- 参数说明：优先渲染接口返回的，再保留本次计算参数 -->
  <div class="param-explain mt-2" v-if="formulaData && Object.keys(formulaData).length > 0">
    <div class="explain-title">公式参数说明：</div>
    <ul>
      <li v-for="(desc, key) in formulaData['参数说明']" :key="key">
        {{ key }}：{{ desc }}
      </li>
    </ul>
  </div>
  <!-- 兜底提示 -->
  <div v-else-if="!formulaLoading" class="empty-tip">
    未能获取到面料计算公式，请刷新页面重试
  </div>
  <!-- 保留本次计算的参数说明（原有逻辑） -->
  <div class="param-explain mt-2">
    <div class="explain-title">本次计算参数说明：</div>
    <ul>
      <li>总材料成本：{{ toFixedNumber(calcResult?.material_total_cost, 2) }} 元/吨</li>
      <li>原材料损耗率：{{ toFixedNumber(calcResult?.calculation_params?.yarn_loss_rate || calcResult?.calculation_details?.params?.loss, 2) }}</li>
      <li>纺纱费：{{ toFixedNumber(calcResult?.calculation_params?.spinning_cost || calcResult?.calculation_details?.params?.spinning_cost, 2) }} 元/吨</li>
      <li>织布费：{{ toFixedNumber(calcResult?.calculation_params?.weaving_cost || calcResult?.calculation_details?.params?.weaving_fee, 2) }} 元/吨</li>
      <li>水洗费：{{ toFixedNumber(calcResult?.calculation_params?.washing_fee || calcResult?.wash_fee, 2) }} 元/吨</li>
      <li>附加费：{{ toFixedNumber(calcResult?.calculation_params?.additional_fee || calcResult?.additional_fee, 2) }} 元/吨</li>
      <li>纱线损耗率：{{ toFixedNumber(calcResult?.calculation_params?.yarn_consumption_loss || 0.9, 2) }}</li>
      <li v-if="calcResult.calculation_params.has_spandex">氨纶含量：{{ toFixedNumber(calcResult.calculation_params.spandex_ratio, 2) }}%（折算系数{{ toFixedNumber(calcResult.calculation_params.spandex_factor, 4) }}）</li>
      <li>税率：{{ toFixedNumber(calcResult?.calculation_params?.tax_rate || calcResult?.calculation_details?.params?.tax_rate, 2) }}</li>
      <li>利润率：{{ toFixedNumber(calcResult?.calculation_params?.profit_rate || calcResult?.calculation_details?.params?.profit_rate, 2) }}</li>
      <li>内托费：{{ toFixedNumber(calcResult?.calculation_params?.inner_support_fee || calcResult?.calculation_details?.params?.freight, 2) }} 元/吨</li>
      <li>信用证系数：{{ toFixedNumber(calcResult?.letter_of_credit, 3) }}</li>
      <li>计算汇率：{{ toFixedNumber(calcResult?.used_exchange_rate, 4) }}</li>
      <li>备注：{{ calcResult?.remark || '无' }}</li>
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
        <div v-else class="empty-tip">未执行计算，完成成分配置和参数设置后点击「计算面料报价」</div>
      </div>
    </div>

    <!-- 5. 历史计算卡片（新增：水洗费列展示） -->
    <div class="card table-card history-card">
      <div class="card-header">
        <div class="card-title">面料历史计算记录</div>
        <div class="history-actions">
          <el-input
            v-model="historyFilter"
            placeholder="筛选计算ID/成分/支数/颜色/克重/备注/水洗费"
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
            下载面料计算记录
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
  empty-text="暂无匹配的面料计算记录"
  :key="JSON.stringify(filteredHistoryList)"
  @selection-change="handleHistorySelection"
  ref="historyTableRef"
  class="material-table"
  row-key="calc_id"
>
          <!-- 多选列 -->
          <el-table-column type="selection" width="60" align="center" :reserve-selection="true"  />

          <!-- 面料专属列 + 新增水洗费列 -->
          <el-table-column prop="weight_gsm" label="克重(g/m²)" min-width="100" align="center" />
          <el-table-column prop="width_cm" label="幅宽(cm)" min-width="100" align="center" />
          <el-table-column prop="count" label="支数" min-width="90" align="center" />
          <el-table-column prop="color" label="颜色" min-width="120" align="center" />
          <el-table-column prop="composition" label="成分组成详情" min-width="280" align="center" />
          <el-table-column prop="rmb_price" label="人民币单价(元/公斤)" width="160" align="center">
            <template #default="scope">
              {{ toFixedNumber(scope.row.rmb_price || scope.row.final_rmb_cost, 2) }}
            </template>
          </el-table-column>
          <el-table-column prop="calc_exchange_rate" label="计算汇率" width="160" align="center">
            <template #default="scope">
              {{ toFixedNumber(scope.row.calc_exchange_rate, 4) }}
            </template>
          </el-table-column>
          <el-table-column prop="fob_usd_kg" label="FOB单价(美元/公斤)" width="160" align="center">
            <template #default="scope">
              {{ toFixedNumber(scope.row.fob_usd_kg || scope.row.fob_price, 2) }}
            </template>
          </el-table-column>
          <el-table-column prop="create_time" label="计算时间" min-width="190" align="center" />
          <el-table-column prop="username" label="用户名" min-width="120" align="center" />
          <el-table-column prop="user_role" label="用户角色" min-width="120" align="center" />

          <!-- 操作列 -->
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

        <!-- 历史记录分页组件 -->
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

    <!-- 原材料选择弹窗（无修改，复用） -->
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
              row-key="material_id"
            >
              <el-table-column type="selection" width="60" align="center" :reserve-selection="true" />
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
/* global defineExpose */
import { ref, onMounted, computed, watch, getCurrentInstance } from 'vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'

// ========== 核心修改：获取全局挂载的$axios 替代局部axios实例 ==========
const { proxy } = getCurrentInstance()
const $axios = proxy.$axios

// ========== 通用工具函数 ==========
/**
 * 数字格式化（避免NaN/空值）
 * @param {number} value 数值
 * @param {number} decimalPlaces 小数位数
 * @returns {string} 格式化后的字符串
 */
const toFixedNumber = (value, decimalPlaces) => {
  const num = Number(value) || 0
  return num.toFixed(decimalPlaces)
}

/**
 * 时间格式化（UTC转东八区）
 * @param {string} timeStr 时间字符串
 * @returns {string} 格式化后的东八区时间
 */
const formatTime = (timeStr) => {
  if (!timeStr) return '-'
  let date = new Date(timeStr)
  if (isNaN(date.getTime())) return '-'

  const shanghaiTz = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  return shanghaiTz.format(date).replace(/\//g, '-')
}

// ========== 响应式数据定义（核心修改：新增水洗费washFee） ==========
const ratioForm = ref({ cotton: "", chemical: "", viscose: "" })
const ratioVerifyResult = ref(null)
const verifyLoading = ref(false)

const materialDialogVisible = ref(false)
const materialList = ref([])
const selectedMaterialRows = ref([]) // 当前页选中项（原有）
const selectedAllMaterials = ref([]) // 新增：全局持久化容器，存储所有页码的选中项
const selectedMaterials = ref([]) // 已选原材料（带配比）（原有）

// 3. 计算参数（核心修改：新增washFee水洗费）
const calcParams = ref({
  count: '',        // 支数（必填）
  color: '',        // 颜色（必填）
  weight_gsm: '',   // 克重(g/m²)（非必填）
  width_cm: '',     // 幅宽(cm)（非必填）
  lossRate: '',     // 原材料损耗率（后端按棉占比计算默认值）
  spinningFee: '',  // 纺纱费（元/吨）
  weavingCost: '',  // 织布费（元/吨）
  washFee: '',      // 新增：水洗费（元/吨）
  taxRate: '',      // 税率（默认0.94）
  profitRate: '',   // 利润率（默认1.1）
  innerBoxFee: '',  // 内托费（默认500）
  additionalFee: '',// 附加费
  letterOfCredit: '', // 信用证（默认1.05）
  calculatedRate: '', // 计算汇率（后端默认：实时汇率-0.1）
  currentRate: '',  // 实时汇率
  calcDate: '',     // 计算日期
  remark: ''        // 备注
})

// 汇率错误提示
const exchangeRateError = ref('')

// 4. 计算结果相关
const calcResult = ref(null)
const calcLoading = ref(false)
const showFormula = ref(false)

// 5. 历史记录相关（分页+筛选）
const historyList = ref([])
const historyLoading = ref(false)
const historyFilter = ref('')
const historyCurrentPage = ref(1)
const historyPageSize = ref(10)
const selectedHistoryRows = ref([])
const historyTableRef = ref(null)

// ========== 原材料管理相关响应式数据 ==========
// 1. 基础加载状态
const categoryLoading = ref(false)
const materialLoading = ref(false)
const tableLoading = ref(false)

// 2. 表单引用
const categoryFormRef = ref(null)
const materialFormRef = ref(null)

// 3. 编辑状态
const isEditMaterial = ref(false)
const categoryDialogVisible = ref(false)

// 4. 分页控制
const currentPage = ref(1)
const pageSize = ref(10)

// 5. 筛选条件
const globalFilter = ref('')
const filterForm = ref({
  categoryIds: [],
  priceMin: '',
  priceMax: '',
  createTimeRange: []
})

// 6. 基础数据
const categoryList = ref([])
const rawMaterialList = ref([])

// 7. 表单验证规则
const materialRules = ref({
  category_id: [{ required: true, message: '请选择原材料类别', trigger: 'change' }],
  name: [{ required: true, message: '请输入原材料名称', trigger: 'blur' }],
  price: [
    { required: true, message: '请输入单价', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '单价需大于0且保留2位小数', trigger: 'blur' }
  ]
})

// 8. 表单数据
const categoryForm = ref({ category_name: '' })
const materialForm = ref({ material_id: '', category_id: '', name: '', price: '' })

// ========== 计算属性（核心修改：历史筛选包含水洗费） ==========
// 1. 已选原材料总配比
const totalRatio = computed(() => {
  return selectedMaterials.value.reduce((sum, item) => sum + (Number(item.ratio) || 0), 0)
})

// 2. 历史记录筛选（核心修改：加入水洗费筛选）
const filteredHistoryList = computed(() => {
  if (!historyList.value.length) return []
  const keyword = historyFilter.value.toLowerCase().trim()
  if (!keyword) return historyList.value
  return historyList.value.filter(item => {
    return (item.calc_id?.toString() || '').includes(keyword) ||
           (item.composition?.toLowerCase() || '').includes(keyword) ||
           (item.count?.toString() || '').includes(keyword) ||
           (item.color?.toLowerCase() || '').includes(keyword) ||
           (item.weight_gsm?.toString() || '').includes(keyword) ||
           (item.width_cm?.toString() || '').includes(keyword) ||
           (item.remark?.toLowerCase() || '').includes(keyword) ||
           (item.wash_fee?.toString() || '').includes(keyword) // 新增：水洗费筛选
  })
})

// 3. 历史记录分页
const totalHistory = computed(() => filteredHistoryList.value.length)
const paginatedHistoryList = computed(() => {
  const startIndex = (historyCurrentPage.value - 1) * historyPageSize.value
  const endIndex = startIndex + historyPageSize.value
  return filteredHistoryList.value.slice(startIndex, endIndex)
})

// 4. 原材料筛选（全局/类别/价格）
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

  // 价格筛选
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

// 5. 原材料分页
const total = computed(() => filteredAllMaterialList.value.length)
const filteredMaterialList = computed(() => {
  if (tableLoading.value) return []
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  return filteredAllMaterialList.value.slice(startIndex, endIndex)
})

// 6. 筛选标签
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

// ========== 核心方法（核心修改：提交数据包含水洗费wash_fee） ==========
// 1. 获取实时汇率（和纱线VUE保持一致，统一逻辑）
const getCurrentExchangeRate = async () => {
  exchangeRateError.value = ''
  try {
    const res = await $axios.get('/calculation/exchange/rate/current/')
    const rateData = res.data || {}
    if (rateData && rateData.current_exchange_rate !== undefined && !isNaN(Number(rateData.current_exchange_rate))) {
      const currentRate = Number(rateData.current_exchange_rate)
      calcParams.value.currentRate = currentRate
      // 自动计算后端默认的计算汇率（实时汇率-0.1）
      calcParams.value.calculatedRate = (currentRate - 0.1).toFixed(4)
      ElMessage.success('获取实时汇率成功') // 轻量反馈：ElMessage.success（自动消失）
    } else {
      exchangeRateError.value = '获取的汇率数据无效（非数字）'
      calcParams.value.currentRate = ''
      ElMessage.warning('汇率数据解析失败，后端将使用默认汇率逻辑') // 轻量反馈：ElMessage.warning（自动消失）
    }
  } catch (error) {
    exchangeRateError.value = `获取汇率失败：${error.message || '服务器异常'}`
    calcParams.value.currentRate = ''
    ElMessage.error(`获取汇率失败：${error.message || '服务器异常'}，后端将使用默认汇率逻辑`) // 轻量反馈：ElMessage.error（自动消失）
  }
}

// 2. 加载类别列表（适配后端get_category_list接口）
const loadCategoryList = async () => {
  try {
    tableLoading.value = true
    const res = await $axios.get('/calculation/category/list/')
    categoryList.value = res.data || []
  } catch (error) {
    ElMessage.error(`加载类别列表失败：${error.message || '接口请求异常'}`) // 轻量反馈：ElMessage.error（自动消失）
    categoryList.value = []
  } finally {
    tableLoading.value = false
  }
}

// 3. 加载原材料列表（适配后端get_material_list接口）
const loadMaterialList = async () => {
  try {
    materialLoading.value = true
    const res = await $axios.get('/calculation/material/list/')
    rawMaterialList.value = res.data || []
    materialList.value = rawMaterialList.value
  } catch (error) {
    ElMessage.error(`加载原材料列表失败：${error.message || '接口请求异常'}`) // 轻量反馈：ElMessage.error（自动消失）
    rawMaterialList.value = []
    materialList.value = []
  } finally {
    materialLoading.value = false
  }
}

// 4. 新增原材料类别（适配后端add_category接口）
const handleAddCategory = async () => {
  if (!categoryFormRef.value) return
  try {
    await categoryFormRef.value.validate()
  } catch (error) {
    return ElMessage.warning('请输入有效的类别名称！') // 轻量反馈：ElMessage.warning（自动消失）
  }
  const name = categoryForm.value.category_name.trim()
  if (!name) return ElMessage.warning('请输入类别名称！') // 轻量反馈：ElMessage.warning（自动消失）

  try {
    categoryLoading.value = true
    await $axios.post('/calculation/category/add/', { category_name: name })
    ElMessage.success('新增类别成功！') // 轻量反馈：ElMessage.success（自动消失）
    categoryDialogVisible.value = false
    await loadCategoryList()
    await loadMaterialList()
  } catch (error) {
    ElMessage.error(`新增类别失败：${error.message || '服务器异常'}`) // 轻量反馈：ElMessage.error（自动消失）
  } finally {
    categoryLoading.value = false
  }
}

// 5. 新增原材料（适配后端add_material接口）
const handleAddMaterial = async () => {
  if (categoryList.value.length === 0) return ElMessage.warning('请先新增原材料类别！') // 轻量反馈：ElMessage.warning（自动消失）
  if (!materialFormRef.value) return ElMessage.error('表单初始化失败，请刷新') // 轻量反馈：ElMessage.error（自动消失）

  try {
    await materialFormRef.value.validate()
  } catch (err) {
    return ElMessage.warning('请填写完整且有效的表单数据！') // 轻量反馈：ElMessage.warning（自动消失）
  }

  const { category_id, name, price } = materialForm.value
  if (!category_id || !name.trim() || price <= 0) return ElMessage.warning('表单数据有误，请检查！') // 轻量反馈：ElMessage.warning（自动消失）

  try {
    materialLoading.value = true
    await $axios.post('/calculation/material/add/', {
      category_id: Number(category_id),
      name: name.trim(),
      price: Number(price)
    })
    ElMessage.success('新增原材料成功！') // 轻量反馈：ElMessage.success（自动消失）
    materialForm.value = { material_id: '', category_id: '', name: '', price: '' }
    materialFormRef.value.resetFields()
    await loadMaterialList()
  } catch (error) {
    ElMessage.error(`新增失败：${error.message || '服务器异常'}`) // 轻量反馈：ElMessage.error（自动消失）
  } finally {
    materialLoading.value = false
  }
}

// 6. 编辑原材料（适配后端edit_material接口）
const handleEditMaterial = async () => {
  if (!materialFormRef.value) return
  try {
    await materialFormRef.value.validate()
  } catch (error) {
    return ElMessage.warning('表单填写不完整，请检查！') // 轻量反馈：ElMessage.warning（自动消失）
  }
  const { material_id, category_id, name, price } = materialForm.value
  if (!material_id || !category_id || !name || price <= 0) return ElMessage.warning('数据有误！') // 轻量反馈：ElMessage.warning（自动消失）

  try {
    materialLoading.value = true
    await $axios.post(`/calculation/material/edit/${material_id}/`, {
      category_id: Number(category_id),
      name: name.trim(),
      price: Number(price)
    })
    ElMessage.success('修改成功！') // 轻量反馈：ElMessage.success（自动消失）
    cancelEditMaterial()
    await loadMaterialList()
  } catch (error) {
    ElMessage.error(`修改失败：${error.message}`) // 轻量反馈：ElMessage.error（自动消失）
  } finally {
    materialLoading.value = false
  }
}

// 7. 删除原材料（适配后端delete_material接口）
const handleDeleteMaterial = async (materialId) => {
  try {
    // 关键交互：ElMessageBox.confirm（手动关闭、阻断操作）
    await ElMessageBox.confirm('确定删除该原材料？删除后不可恢复！', '确认删除', { type: 'warning' })
    await $axios.delete(`/calculation/material/delete/${materialId}/`)

    // 新增：如果该原材料已被选中，从全局选中容器中移除
    selectedAllMaterials.value = selectedAllMaterials.value.filter(item => item.material_id !== materialId)

    ElMessage.success('删除成功！') // 轻量反馈：ElMessage.success（自动消失）
    await loadMaterialList()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error(`删除失败：${error.message}`) // 轻量反馈：ElMessage.error（自动消失）
  }
}

// 8. 原材料选择弹窗相关
const openMaterialDialog = () => {
  materialDialogVisible.value = true
  selectedMaterialRows.value = [] // 重置当前页选中项（原有）
  selectedAllMaterials.value = [] // 新增：重置全局选中容器
  loadCategoryList()
  loadMaterialList()
}
const handleMaterialSelection = (currentPageSelected) => {
  selectedMaterialRows.value = currentPageSelected || [] // 更新当前页选中项（原有）

  // 新增：同步更新全局持久化容器 selectedAllMaterials
  const currentPageMaterialIds = filteredMaterialList.value.map(item => item.material_id) // 当前页所有原材料ID

  // 1. 移除：当前页中已取消选中的项（不在 currentPageSelected 中，但在 selectedAllMaterials 中）
  selectedAllMaterials.value = selectedAllMaterials.value.filter(
    globalItem => !currentPageMaterialIds.includes(globalItem.material_id) ||
    currentPageSelected.some(currentItem => currentItem.material_id === globalItem.material_id)
  )

  // 2. 添加：当前页中新选中的项（在 currentPageSelected 中，但不在 selectedAllMaterials 中）
  currentPageSelected.forEach(currentItem => {
    if (!selectedAllMaterials.value.some(globalItem => globalItem.material_id === currentItem.material_id)) {
      selectedAllMaterials.value.push(currentItem)
    }
  })
}
const confirmMaterialSelect = () => {
  // 修改：从全局选中容器 selectedAllMaterials 中获取所有选中项，而非当前页 selectedMaterialRows
  const newMaterials = (selectedAllMaterials.value || []).filter(newItem => {
    return !selectedMaterials.value.some(existItem => existItem.material_id === newItem.material_id)
  })

  newMaterials.forEach(item => {
    selectedMaterials.value.push({
      ...item,
      ratio: 0
    })
  })

  materialDialogVisible.value = false
  ElMessage.success(`成功选择 ${newMaterials.length} 种原材料`) // 轻量反馈：ElMessage.success（自动消失）
}

const removeMaterial = (index) => {
  if (index >= 0 && index < selectedMaterials.value.length) {
    selectedMaterials.value.splice(index, 1)
  }
}

const checkTotalRatio = () => {
  const ratio = totalRatio.value || 0
  if (ratio < 99.9 || ratio > 100.1) {
    // 非阻塞提醒：ElNotification.warning（右上角弹出、自动消失）
    ElNotification.warning({
      title: '配比提醒',
      message: `当前总配比为 ${toFixedNumber(ratio, 1)}%，需调整至100%`,
      duration: 3000
    })
  }
}

// 9. 面料配比验证（修正：仅校验纱线百分比输入，不关联面料成分配置）
const verifyRatio = async () => {
  // 前端基础校验：仅校验纱线百分比输入
  const cotton = Number(ratioForm.value.cotton) || 0
  const chemical = Number(ratioForm.value.chemical) || 0
  const viscose = Number(ratioForm.value.viscose) || 0
  const total = cotton + chemical + viscose

  // 校验1：总和需接近100%（±0.1）
  if (total < 99.9 || total > 100.1) {
    ratioVerifyResult.value = {
      success: false,
      errors: [`总配比需接近100%（当前：${toFixedNumber(total, 1)}%）`]
    }
    ElMessage.warning('配比总和不符合要求，请调整') // 轻量反馈：ElMessage.warning（自动消失）
    return
  }

  // 校验2：单个值非负
  if (cotton < 0 || chemical < 0 || viscose < 0) {
    ratioVerifyResult.value = {
      success: false,
      errors: ['棉、化纤、粘胶含量不能为负数']
    }
    ElMessage.warning('输入值不能为负数') // 轻量反馈：ElMessage.warning（自动消失）
    return
  }

  try {
    verifyLoading.value = true
    const response = await $axios.post('/calculation/yarn/verify-ratio/', {
      cotton,
      chemical,
      viscose
    })
    // 修正：axios拦截器已返回response.data，apiResponse直接等于response
    const apiResponse = response;
    // 验证结果详情在 apiResponse.data 里，同时继承外层success保证alert类型正确
    ratioVerifyResult.value = {
      ...apiResponse.data, // 展开data里的yarn_type/count_range等字段
      success: apiResponse.success // 外层的success（控制alert样式）
    };

    if (apiResponse.success) {
      ElMessage.success('配比验证成功') // 轻量反馈：ElMessage.success（自动消失）
    } else {
      ElMessage.warning('配比验证失败，请检查输入') // 轻量反馈：ElMessage.warning（自动消失）
    }
  } catch (error) {
    ElMessage.error(`验证失败：${error.message}`) // 轻量反馈：ElMessage.error（自动消失）
    ratioVerifyResult.value = {
      success: false,
      errors: [error.message || '服务器异常']
    }
  } finally {
    verifyLoading.value = false
  }
}

// 10. 提交面料计算（核心修改：包含水洗费wash_fee传递）
const submitCalculation = async () => {
  // 前端基础校验（核心修改：去掉克重/幅宽的非空校验）
  const count = Number(calcParams.value.count)

  if (!calcParams.value.count || isNaN(count) || count <= 0) {
    return ElMessage.warning('请输入有效的支数（大于0的数字）') // 轻量反馈：ElMessage.warning（自动消失）
  }
  if (!calcParams.value.color.trim()) {
    return ElMessage.warning('请输入颜色（如黑色、白色）') // 轻量反馈：ElMessage.warning（自动消失）
  }
  if (selectedMaterials.value.length < 2) {
    return ElMessage.warning('至少选择2种原材料') // 轻量反馈：ElMessage.warning（自动消失）
  }
  const ratio = totalRatio.value || 0
  if (ratio < 99.9 || ratio > 100.1) {
    return ElMessage.warning(`总配比需等于100%（当前：${toFixedNumber(ratio, 1)}%）`) // 轻量反馈：ElMessage.warning（自动消失）
  }
  const invalidMaterial = selectedMaterials.value.find(item => isNaN(Number(item.ratio)) || Number(item.ratio) <= 0)
  if (invalidMaterial) {
    return ElMessage.error(`原材料【${invalidMaterial.category_name || '未知'} - ${invalidMaterial.name || '未知'}】的配比无效，请输入大于0的数字`) // 轻量反馈：ElMessage.error（自动消失）
  }

  // 组装后端需要的参数格式（核心修改：加入水洗费wash_fee）
  const basicParams = {}
  if (calcParams.value.lossRate !== '' && !isNaN(Number(calcParams.value.lossRate))) {
    basicParams.yarn_loss_rate = Number(calcParams.value.lossRate)
  }
  if (calcParams.value.spinningFee !== '' && !isNaN(Number(calcParams.value.spinningFee))) {
    basicParams.spinning_cost = Number(calcParams.value.spinningFee)
  }
  if (calcParams.value.weavingCost !== '' && !isNaN(Number(calcParams.value.weavingCost))) {
    basicParams.weaving_cost = Number(calcParams.value.weavingCost)
  }
  // 新增：水洗费参数传递
  if (calcParams.value.washFee !== '' && !isNaN(Number(calcParams.value.washFee))) {
    basicParams.washing_fee = Number(calcParams.value.washFee) // 改为 washing_fee，与后端字段一致
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
  // 附加费
  if (calcParams.value.additionalFee !== '' && !isNaN(Number(calcParams.value.additionalFee))) {
    basicParams.additional_fee = Number(calcParams.value.additionalFee)
  }
  if (calcParams.value.calculatedRate !== '' && !isNaN(Number(calcParams.value.calculatedRate))) {
    basicParams.calc_exchange_rate = Number(calcParams.value.calculatedRate)
  }
  if (calcParams.value.letterOfCredit !== '' && !isNaN(Number(calcParams.value.letterOfCredit))) {
    basicParams.letter_of_credit = Number(calcParams.value.letterOfCredit)
  }
  // 备注
  if (calcParams.value.remark !== '') {
    basicParams.remark = calcParams.value.remark.trim()
  }

  const submitData = {
    count: String(count),
    color: calcParams.value.color.trim(),
    // 克重/幅宽仅在有值且有效时传入（非必填）
    ...(calcParams.value.weight_gsm !== '' && !isNaN(Number(calcParams.value.weight_gsm)) && {
      weight_gsm: String(Number(calcParams.value.weight_gsm))
    }),
    ...(calcParams.value.width_cm !== '' && !isNaN(Number(calcParams.value.width_cm)) && {
      width_cm: String(Number(calcParams.value.width_cm))
    }),
    compositions: selectedMaterials.value.map(item => ({
      material_id: Number(item.material_id) || 0,
      ratio: Number(item.ratio) || 0
    })),
    basic_params: basicParams
  }

  // 提交请求
  try {
    calcLoading.value = true
    const res = await $axios.post('/calculation/fabric/submit-calculation/', submitData)
    calcResult.value = res.data || {}
    ElMessage.success('面料报价计算成功并入库') // 轻量反馈：ElMessage.success（自动消失）
    await loadHistoryList() // 计算成功后刷新历史记录
  } catch (error) {
    const errMsg = error.message || '计算失败'
    ElMessage.error(`计算失败：${errMsg}`) // 轻量反馈：ElMessage.error（自动消失）
    calcResult.value = null
  } finally {
    calcLoading.value = false
  }
}

// 11. 加载面料历史记录（适配后端get_knitted_fabric_history接口）
const loadHistoryList = async () => {
  try {
    historyLoading.value = true
    const res = await $axios.get('/calculation/fabric/knitted-fabric-history/')
    historyList.value = res.data || []
    historyCurrentPage.value = 1
  } catch (error) {
    ElMessage.error('加载面料历史记录失败') // 轻量反馈：ElMessage.error（自动消失）
    historyList.value = []
  } finally {
    historyLoading.value = false
  }
}

// 12. 删除面料历史记录（适配后端delete_knitted_fabric_history接口）
const deleteHistory = async (calcId) => {
  if (!calcId) {
    return ElMessage.warning('无效的记录ID') // 轻量反馈：ElMessage.warning（自动消失）
  }
  try {
    // 关键交互：ElMessageBox.confirm（手动关闭、阻断操作）
    await ElMessageBox.confirm('确定删除该条历史记录？', '确认删除', { type: 'warning' })
    await $axios.delete(`/calculation/fabric/calculation-history/${calcId}/`)
    ElMessage.success('删除成功') // 轻量反馈：ElMessage.success（自动消失）
    await loadHistoryList()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error(`删除失败：${error.message || '未知错误'}`) // 轻量反馈：ElMessage.error（自动消失）
  }
}

// 13. 下载面料历史记录（适配后端download_knitted_fabric_history接口）
const downloadHistory = async () => {
  if (selectedHistoryRows.value.length === 0) {
    return ElMessage.warning('请至少选择一条计算记录') // 轻量反馈：ElMessage.warning（自动消失）
  }
  try {
    const calcIds = selectedHistoryRows.value.map(row => row.calc_id).join(',')
    const link = document.createElement('a')
    link.style.display = 'none'
    const response = await $axios({
      url: '/calculation/fabric/history/download/',
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
    let filename = '针织面料计算记录.xlsx'
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
    ElMessage.success(`成功下载 ${selectedHistoryRows.value.length} 条计算记录`) // 轻量反馈：ElMessage.success（自动消失）
    historyTableRef.value?.clearSelection()
  } catch (error) {
    const errMsg = error.message || '下载失败'
    ElMessage.error(`下载失败：${errMsg}`) // 轻量反馈：ElMessage.error（自动消失）
  }
}

// 在面料script的「响应式数据定义」区域新增（比如在showFormula下方）
const formulaData = ref(null) // 存储面料公式接口返回数据
const formulaLoading = ref(false) // 公式接口加载状态

// 参考getYarnFormula实现，修改接口地址和文案
const getFabricFormula = async () => {
  // 避免重复请求
  if (formulaData.value && Object.keys(formulaData.value).length > 0) return;
  try {
    formulaLoading.value = true;
    console.log('开始请求面料公式接口：/calculation/fabric/formula/');

    const res = await $axios({
      url: '/calculation/fabric/formula/', // 面料公式接口地址（对应后端fabric/formula/路由）
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const responseData = res.data || {};
    console.log('面料公式接口原始返回：', responseData);

    // 适配后端返回格式（和纱线保持一致的兼容逻辑）
    if (responseData['核心公式']) {
      formulaData.value = responseData;
    } else if (responseData.success === true || responseData.success === 'true') {
      formulaData.value = responseData.data || {};
    } else if (Object.keys(responseData).length > 0) {
      formulaData.value = responseData;
    } else {
      formulaData.value = null;
      ElMessage.warning('获取面料计算公式失败：接口返回空数据'); // 轻量反馈：ElMessage.warning（自动消失）
    }

  } catch (error) {
    formulaData.value = null;
    console.error('面料公式接口请求异常详情：', error);

    // 精准错误处理（核心修改：规范化弹窗类型）
    if (error.response) {
      const status = error.response.status;
      const errMsg = error.response.data?.message || '未知错误';
      switch(status) {
        case 401:
          ElMessage.error('登录已过期，请重新登录后再试'); // 轻量反馈：ElMessage.error（自动消失）
          break;
        case 403:
          // 关键交互：ElMessageBox.alert（手动关闭、阻断操作）- 匹配图片中的权限报错
          ElMessageBox.alert(
            '请求初始化失败：无fabric_formula_view权限，请联系管理员',
            '权限不足',
            {
              type: 'error',
              confirmButtonText: '确定',
              closeOnClickModal: false
            }
          );
          formulaData.value = null;
          break;
        case 404:
          ElMessage.error('面料计算公式接口不存在，请检查后端路由配置'); // 轻量反馈：ElMessage.error（自动消失）
          break;
        case 500:
          ElMessage.error(`服务器内部错误：${errMsg}`); // 轻量反馈：ElMessage.error（自动消失）
          break;
        default:
          ElMessage.error(`获取面料计算公式失败（${status}）：${errMsg}`); // 轻量反馈：ElMessage.error（自动消失）
      }
    } else if (error.request) {
      ElMessage.error('网络异常，无法连接服务器（请检查网络或后端服务状态）'); // 轻量反馈：ElMessage.error（自动消失）
    } else {
      // 关键交互：ElMessageBox.alert（手动关闭、阻断操作）- 初始化失败类报错
      ElMessageBox.alert(
        `请求初始化失败：${error.message}`,
        '请求失败',
        {
          type: 'error',
          confirmButtonText: '确定',
          closeOnClickModal: false
        }
      );
    }
  } finally {
    formulaLoading.value = false;
    // 接口失败时自动关闭公式显示
    if (!formulaData.value) {
      showFormula.value = false;
    }
  }
};

// 替换原有仅切换showFormula的toggleFormula
const toggleFormula = async () => {
  showFormula.value = !showFormula.value
  if (showFormula.value) {
    // 打开公式时请求接口
    await getFabricFormula()
  } else {
    // 关闭时清空数据，下次打开重新获取
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
    weight_gsm: '',
    width_cm: '',
    lossRate: '',
    spinningFee: '',
    weavingCost: '',
    washFee: '',
    taxRate: '',
    profitRate: '',
    innerBoxFee: '',
    additionalFee: '',
    letterOfCredit: '',
    calculatedRate: '',
    currentRate: calcParams.value.currentRate || '',
    calcDate: '',
    remark: ''
  }
  exchangeRateError.value = ''
  calcResult.value = null
  showFormula.value = false // 关闭公式显示
  formulaData.value = null  // 清空公式数据（新增）
  ElMessage.success('表单已重置') // 轻量反馈：ElMessage.success（自动消失）
}

const resetFilter = () => {
  globalFilter.value = ''
  filterForm.value = { categoryIds: [], priceMin: '', priceMax: '', createTimeRange: [] }
  currentPage.value = 1
  ElMessage.success('筛选条件已重置') // 轻量反馈：ElMessage.success（自动消失）
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

const handleEditMaterialRow = (row) => {
  isEditMaterial.value = true
  materialForm.value = { ...row }
}

const cancelEditMaterial = () => {
  isEditMaterial.value = false
  materialForm.value = { material_id: '', category_id: '', name: '', price: '' }
  materialFormRef.value?.resetFields()
}

const handleHistorySizeChange = (val) => {
  historyPageSize.value = val
  historyCurrentPage.value = 1
}

const handleHistoryCurrentChange = (val) => {
  historyCurrentPage.value = val
}

const handleHistorySelection = (val) => {
  selectedHistoryRows.value = val || []
}

const setDefaultCalcDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  calcParams.value.calcDate = `${year}-${month}-${day}`;
};

// ========== 生命周期 & 监听 ==========
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
    ElMessage.error(`初始化数据失败：${error.message || '未知错误'}`) // 轻量反馈：ElMessage.error（自动消失）
  }

  // 抑制ResizeObserver非致命错误
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
})

// 监听汇率输入，确保数字格式
watch(() => calcParams.value.calculatedRate, (val) => {
  if (val && val !== '' && isNaN(Number(val))) {
    ElMessage.error('汇率必须为数字格式（如 7.2345）') // 轻量反馈：ElMessage.error（自动消失）
    calcParams.value.calculatedRate = ''
  }
})

// 监听历史筛选，重置页码
watch(historyFilter, () => {
  historyCurrentPage.value = 1
})

// 暴露给模板的变量和方法
defineExpose({
  calcLoading,
  calcParams,
  calcResult,
  cancelEditMaterial,
  categoryDialogVisible,
  categoryForm,
  categoryFormRef,
  categoryList,
  categoryLoading,
  checkTotalRatio,
  confirmMaterialSelect,
  currentPage,
  deleteHistory,
  downloadHistory,
  exchangeRateError,
  filterForm,
  filterTags,
  filteredAllMaterialList,
  filteredHistoryList,
  filteredMaterialList,
  formatTime,
  formulaData,
  formulaLoading,
  getCurrentExchangeRate,
  getFabricFormula,
  globalFilter,
  handleAddCategory,
  handleAddMaterial,
  handleCurrentChange,
  handleDeleteMaterial,
  handleEditMaterial,
  handleEditMaterialRow,
  handleHistoryCurrentChange,
  handleHistorySelection,
  handleHistorySizeChange,
  handleMaterialSelection,
  handleSizeChange,
  hasFilter,
  historyCurrentPage,
  historyFilter,
  historyList,
  historyLoading,
  historyPageSize,
  historyTableRef,
  isEditMaterial,
  loadCategoryList,
  loadHistoryList,
  loadMaterialList,
  materialDialogVisible,
  materialForm,
  materialFormRef,
  materialList,
  materialLoading,
  materialRules,
  openCategoryDialog,
  openMaterialDialog,
  pageSize,
  paginatedHistoryList,
  ratioForm,
  ratioVerifyResult,
  rawMaterialList,
  removeFilterTag,
  removeMaterial,
  resetAll,
  resetCategoryForm,
  resetFilter,
  selectedHistoryRows,
  selectedMaterialRows,
  selectedMaterials,
  setDefaultCalcDate,
  showFormula,
  submitCalculation,
  tableLoading,
  toFixedNumber,
  toggleFormula,
  total,
  totalHistory,
  totalRatio,
  verifyLoading,
  verifyRatio
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
/* 全局容器 */
.fabric-quote-container {
  padding: 20px;
  background: #f8f8f8;
  min-height: 100vh;
  box-sizing: border-box;
}

/* 卡片通用样式 */
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

/* 卡片头部 */
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

/* 输入框通用样式 */
.form-input {
  height: 36px !important;
  border-radius: 4px;
  box-sizing: border-box;
  width: 100%;
}

/* 按钮通用样式 */
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

/* 按钮配色 */
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

/* 表格样式 */
.material-table {
  width: 100%;
  --el-table-header-text-color: #333;
  --el-table-row-hover-bg-color: #f9f9f9;
  --el-table-border-color: #eee;
  --el-table-stripe-bg: #fafafa;
}

/* 分页样式 */
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

/* 响应式适配 */
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

/* 原材料管理相关样式 */
.raw-material-container {
  padding: 10px;
  background: #f8f8f8;
  border-radius: 4px;
  box-sizing: border-box;
  max-height: 80vh;
  overflow-y: auto;
  overflow-x: hidden;
}

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
  flex: 1;
  min-width: 120px;
}
.btn-group-container {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
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

.table-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.table-wrapper {
  overflow-x: auto;
  border-radius: 4px;
  padding-bottom: 10px;
  box-sizing: border-box;
  overflow-y: visible;
}

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

/* 弹窗底部按钮容器 */
.dialog-footer-btn-group {
  display: flex !important;
  justify-content: flex-end !important;
  gap: 12px !important;
  padding: 10px 20px !important;
  border-top: 1px solid #eee !important;
  margin: 0 !important;
}

.dialog-footer-btn-group .operate-btn {
  flex-shrink: 0 !important;
  min-width: 100px !important;
}
/* 汇率操作行样式优化 */
.rate-action-wrapper {
  flex-wrap: wrap;
}
.refresh-rate-btn {
  padding: 0;
  color: #4CAF50;
  white-space: nowrap;
}
.rate-tips {
  font-size: 12px;
  line-height: 1.4;
}
/* 公式差异提示样式 */
.formula-diff {
  margin-top: 12px;
  padding: 8px;
  background: #FFFBEB;
  border-radius: 4px;
  border-left: 2px solid #E6A23C;
}

/* 公式高亮样式（突出氨纶相关部分） */
:deep(.formula-highlight) {
  color: #f44336;
  font-weight: 600;
}
</style>