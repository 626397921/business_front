<template>
  <div class="freight-container">
    <!-- 移除标签页，直接平铺货代信息管理模块 -->
    <div class="tab-content">
      <!-- ========== 第一部分：货代信息模块（原封不动保留） ========== -->
      <div class="module-title">货代信息管理</div>
<div class="search-form forwarder-search-container">
  <el-form :inline="true" :model="forwarderFilter" class="forwarder-search-form">
    <el-form-item label="货代公司">
      <!-- 核心：添加固定宽度缩短输入框 -->
      <el-input
        v-model="forwarderFilter.company"
        placeholder="请输入货代公司名称"
        clearable
        style="width: 200px;"
      />
    </el-form-item>
    <el-form-item label="货代姓名">
      <!-- 核心：添加固定宽度缩短输入框 -->
      <el-input
        v-model="forwarderFilter.name"
        placeholder="请输入货代姓名"
        clearable
        style="width: 200px;"
      />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="queryForwarder">查询</el-button>
      <el-button @click="resetForwarderFilter">重置</el-button>
    </el-form-item>
  </el-form>
</div>

      <div class="table-actions">
        <el-button type="primary" @click="openForwarderDialog('add')">新增货代</el-button>
        <el-button type="danger" @click="batchDeleteForwarder" :disabled="selectedForwarderRows.length === 0">
          批量删除
        </el-button>
      </div>

<!-- 修改后 -->
<el-table
  v-loading="forwarderLoading"
  :data="forwarderTableList"
  border
  stripe
  @selection-change="handleForwarderSelection"
  ref="forwarderTableRef"
  row-key="ff_id"
>
  <el-table-column type="selection" width="55" :reserve-selection="true" />
        <el-table-column label="姓名" align="center" header-align="center" width="100">
          <template #default="scope">
            {{ formatForwarderField(scope.row.name) }}
          </template>
        </el-table-column>
        <el-table-column label="性别" align="center" header-align="center" width="80">
          <template #default="scope">
            {{ formatForwarderField(scope.row.gender) }}
          </template>
        </el-table-column>
        <el-table-column label="公司名称" align="center"
          header-align="center" min-width="150">
          <template #default="scope">
            {{ formatForwarderField(scope.row.company) }}
          </template>
        </el-table-column>
        <el-table-column label="联系方式" align="center" header-align="center" min-width="120">
          <template #default="scope">
            {{ formatForwarderField(scope.row.contact) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="货代杂费项目_收费"
          label="货代杂费项目_收费"
          min-width="250"
          align="center"
          header-align="center"
        >
          <template #default="scope">
            <div class="misc-fee-wrap">
              {{ scope.row.货代杂费项目_收费 || '无杂费配置' }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="总收费金额" label="总收费金额" align="center" header-align="center" width="120">
          <template #default="scope">
            {{ toFixedNumber(scope.row.总收费金额, 2) }} 元
          </template>
        </el-table-column>
        <el-table-column label="备注" align="center" header-align="center" min-width="150">
          <template #default="scope">
            <div class="remark-wrap">
              {{ formatRemark(scope.row.remark) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="creator__username" align="center" header-align="center" label="创建人" width="100" />
        <el-table-column prop="operate_time" align="center" header-align="center" label="操作时间" width="180">
          <template #default="scope">
            {{ formatTime(scope.row.operate_time) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" header-align="center" class='operate-btn-group' width="240">
          <template #default="scope">
            <div class="operate-btn-group">
              <el-button type="primary" size="small" @click="openForwarderDialog('edit', scope.row)">编辑</el-button>
              <el-button type="success" size="small" @click="openFfMiscFeeDialog('add', scope.row)">编辑杂费</el-button>
              <el-button type="danger" size="small" @click="deleteForwarder(scope.row.ff_id)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div style="margin-top: 16px; text-align: right;">
        <el-pagination
          v-model:current-page="forwarderCurrentPage"
          v-model:page-size="forwarderPageSize"
          :total="forwarderTotal"
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="[5, 10, 20, 50]"
          @size-change="handleForwarderSizeChange"
          @current-change="handleForwarderCurrentChange"
          size="medium"
        />
      </div>

      <!-- 货代新增/编辑弹窗（保留原有） -->
      <el-dialog
        v-model="forwarderDialogVisible"
        :title="forwarderDialogTitle"
        width="500px"
        @close="resetForwarderForm"
      >
        <el-form
          ref="forwarderFormRef"
          :model="forwarderForm"
          :rules="forwarderRules"
          label-width="100px"
        >
          <el-input v-model="forwarderForm.ff_id" type="hidden" />
          <el-form-item label="姓名" prop="name">
            <el-input v-model="forwarderForm.name" placeholder="请输入货代姓名" />
          </el-form-item>
          <el-form-item label="性别" prop="gender">
            <el-select v-model="forwarderForm.gender" placeholder="请选择性别（可选）">
              <el-option label="男" value="男" />
              <el-option label="女" value="女" />
            </el-select>
          </el-form-item>
          <el-form-item label="公司名称" prop="company">
            <el-input v-model="forwarderForm.company" placeholder="请输入货代公司名称（可选）" />
          </el-form-item>
          <el-form-item label="联系方式" prop="contact">
            <el-input v-model="forwarderForm.contact" placeholder="请输入联系方式（电话/微信，可选）" />
          </el-form-item>
          <el-form-item label="备注" prop="remark">
            <el-input v-model="forwarderForm.remark" type="textarea" rows="3" placeholder="请输入备注信息（可选）" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="forwarderDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForwarderForm" :loading="forwarderFormLoading">提交</el-button>
        </template>
      </el-dialog>

      <!-- 货代杂费编辑弹窗（保留原有） -->
      <el-dialog
        v-model="ffMiscFeeDialogVisible"
        :title="ffMiscFeeDialogTitle"
        width="60%"
        max-width="800px"
        @close="resetFfMiscFeeForm"
      >
        <el-form
          ref="ffMiscFeeFormRef"
          :model="ffMiscFeeForm"
          :rules="ffMiscFeeRules"
          label-width="100px"
          style="margin-bottom: 20px;"
          class="ff-misc-fee-form"
        >
          <el-input v-model.number="ffMiscFeeForm.ff_id" type="hidden" />
          <el-input v-model="ffMiscFeeForm.ff_misc_id" type="hidden" />
          <el-input v-model="ffMiscFeeForm.fee_id" type="hidden" />

          <el-row :gutter="24" style="margin-bottom: 16px;">
            <el-col :span="12">
              <el-form-item label="杂费名称" prop="fee_name">
                <el-input
                  v-model="ffMiscFeeForm.fee_name"
                  placeholder="请输入杂费名称（如报关费、拖车费）"
                  style="width: 100%;"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="标准金额" prop="standard_amount">
                <el-input
                  v-model.number="ffMiscFeeForm.standard_amount"
                  type="number"
                  placeholder="请输入杂费金额（非负数）"
                  append="元"
                  style="width: 100%;"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="24">
            <el-col :span="24">
              <el-form-item label="杂费说明" prop="fee_desc">
                <div style="display: flex; align-items: flex-start; gap: 16px; width: 100%;">
                  <el-input
                    v-model="ffMiscFeeForm.fee_desc"
                    type="textarea"
                    rows="3"
                    placeholder="请输入杂费说明（可选）"
                    style="flex: 1; min-height: 80px; padding: 8px 12px;"
                  />
                  <el-button
                    type="primary"
                    @click="submitFfMiscFeeForm"
                    :loading="ffMiscFeeFormLoading"
                    size="medium"
                    style="width: 88px; margin-top: 24px; white-space: nowrap;"
                  >
                    提交
                  </el-button>
                </div>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>

        <div class="ff-misc-fee-table-container">
          <h4 style="margin-bottom: 12px; font-size: 16px; font-weight: 500;">已有杂费配置</h4>
          <el-table
            v-loading="ffMiscFeeTableLoading"
            :data="ffMiscFeeList"
            border
            stripe
            @row-click="editFfMiscFeeItem"
            style="width: 100%;"
            size="medium"
            empty-text="暂无货代专属杂费数据"
          >
            <el-table-column
              prop="misc_fee__fee_name"
              label="杂费名称"
              width="100"
              min-width="100"
              header-align="center"
              align="center"
              show-overflow-tooltip
            >
              <template #default="scope">
                <div style="font-size: 14px;">{{ scope.row.misc_fee__fee_name }}</div>
              </template>
            </el-table-column>
            <el-table-column
              prop="standard_amount"
              label="标准金额（元）"
              width="140"
              header-align="center"
              align="center"
            >
              <template #default="scope">
                <div style="font-size: 14px;">{{ toFixedNumber(scope.row.standard_amount, 2) }}</div>
              </template>
            </el-table-column>
            <el-table-column
              prop="fee_desc"
              label="杂费说明"
              min-width="100"
              header-align="center"
              align="center"
            >
            <template #default="scope">
              <div style="font-size: 14px; line-height: 1.5; padding: 4px 0;">
                {{ formatFeeDesc(scope.row.fee_desc) }}
              </div>
            </template>
            </el-table-column>
            <el-table-column
              prop="update_time"
              label="更新时间"
              width="180"
              header-align="center"
              align="center"
            >
              <template #default="scope">
                <div style="font-size: 14px;">{{ scope.row.update_time || '-' }}</div>
              </template>
            </el-table-column>
            <el-table-column
              label="操作"
              width="100"
              header-align="center"
              align="center"
            >
              <template #default="scope">
                <el-button
                  type="danger"
                  icon="el-icon-delete"
                  @click="deleteSingleFfMiscFee(scope.row.ff_misc_id)"
                  size="small"
                >删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div style="margin-top: 16px; text-align: right;">
            <el-pagination
              v-model:current-page="ffMiscFeeCurrentPage"
              v-model:page-size="ffMiscFeePageSize"
              :total="ffMiscFeeTotal"
              layout="total, sizes, prev, pager, next, jumper"
              :page-sizes="[5, 10, 20, 50]"
              @size-change="handleFfMiscFeeSizeChange"
              @current-change="handleFfMiscFeeCurrentChange"
              size="medium"
            />
          </div>
        </div>
      </el-dialog>
    </div>

    <!-- 货代信息模块与报价模块之间增加间距，提升视觉效果 -->
    <div style="margin-top: 24px;"></div>

    <!-- 移除标签页，平铺货代报价管理模块（位于货代信息模块下方） -->
    <div class="tab-content">
      <!-- ========== 第二部分：货代报价模块（整合并适配风格） ========== -->
      <div class="module-title">货代报价管理</div>
<!-- 货代报价管理的查询表单部分（已优化为两行布局） -->
<div class="search-form">
  <el-form :model="quoteFilter" class="demo-form-inline">
    <!-- 第一行：全局搜索 + 集装箱规格 + 货物名称 + 出口国家（4列均分，span=6） -->
    <el-row :gutter="20" align="middle" style="margin-bottom: 16px;">
      <el-col :span="6">
        <el-form-item label="全局搜索">
          <el-input
            v-model="quoteFilter.globalSearch"
            placeholder="输入货代/集装箱/货物等关键词搜索"
            clearable
            style="width: 100%;"
          />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="集装箱">
          <el-select
            v-model="quoteFilter.containerSpec"
            placeholder="请选择集装箱规格"
            clearable
            style="width: 100%;"
          >
            <el-option
              v-for="container in containerList"
              :key="container.container_id"
              :label="container.spec_desc"
              :value="container.spec_desc"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="货物名称">
          <el-select
            v-model="quoteFilter.goodsName"
            placeholder="请选择货物名称"
            clearable
            style="width: 100%;"
          >
            <el-option
              v-for="goods in goodsList"
              :key="goods.goods_id"
              :label="goods.goods_name"
              :value="goods.goods_name"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="出口国家">
          <el-select
            v-model="quoteFilter.exportCountry"
            placeholder="请选择出口国家"
            clearable
            style="width: 100%;"
          >
            <el-option
              v-for="country in exportCountryList"
              :key="country"
              :label="country"
              :value="country"
            />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <!-- 第二行：出口港 + 目的港 + 开始日期 + 查询/重置按钮（4列均分，span=6） -->
    <el-row :gutter="20" align="middle">
      <el-col :span="6">
        <el-form-item label="出口港">
          <el-select
            v-model="quoteFilter.exportPort"
            placeholder="请选择出口港"
            clearable
            style="width: 100%;"
          >
            <el-option
              v-for="port in exportPortList"
              :key="port"
              :label="port"
              :value="port"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="目的港">
          <el-select
            v-model="quoteFilter.destinationPort"
            placeholder="请选择目的港"
            clearable
            style="width: 100%;"
          >
            <el-option
              v-for="port in destinationPortList"
              :key="port"
              :label="port"
              :value="port"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="开始日期">
          <el-date-picker
            v-model="quoteFilter.startDate"
            type="date"
            placeholder="请选择开始日期"
            clearable
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%;"
          />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <!-- 按钮列：居中对齐，间距8px -->
        <el-form-item style="display: flex; justify-content: center; gap: 8px; margin: 0;">
          <el-button type="primary" @click="queryQuote">查询</el-button>
          <el-button @click="resetQuoteFilter">重置</el-button>
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</div>

      <div class="table-actions">
        <el-button type="primary" @click="openQuoteDialog('add')">新增报价</el-button>
        <el-button type="danger" @click="batchDeleteQuote" :disabled="selectedQuoteRows.length === 0">
          批量删除
        </el-button>
      </div>
<div class="quote-table-container">
<el-table
  v-loading="quoteLoading"
  :data="quoteList"
  border
  stripe
  @selection-change="handleQuoteSelection"
  ref="quoteTableRef"
  row-key="quote_id"
  height="calc(100vh - 400px)"
  fixed-header  
>
  <!-- 选择列：表头+内容居中 -->
  <el-table-column type="selection" width="55" header-align="center" align="center" :reserve-selection="true" />
    <el-table-column label="货代" min-width="150" header-align="center" align="center">
  <template #default="scope">
    {{ formatForwarderDisplay(scope.row.freight_forwarder) }}
  </template>
</el-table-column>
        <!-- 集装箱规格列：表头+内容居中 -->
        <el-table-column prop="container_spec" label="集装箱规格" min-width="120" header-align="center" align="center" />
        <!-- 货物名称列：表头+内容居中 -->
        <el-table-column prop="goods_name" label="货物名称" min-width="120" header-align="center" align="center" />

        <!-- 出口国家列：表头+内容居中 -->
        <el-table-column prop="export_country" label="出口国家" width="120" header-align="center" align="center" />
        <!-- 出口港列：表头+内容居中 -->
        <el-table-column prop="export_port" label="出口港" width="120" header-align="center" align="center" />
        <!-- 目的港列：表头+内容居中 -->
        <el-table-column prop="destination_port" label="目的港" width="120" header-align="center" align="center" />
        <!-- 海运费(总)列：表头+内容居中 -->
        <el-table-column prop="total_freight" label="海运费(总)" width="120" header-align="center" align="center">
          <template #default="scope">
            {{ toFixedNumber(scope.row.total_freight, 2) }} 元
          </template>
        </el-table-column>
        <!-- 每KG海运费列：表头+内容居中 -->
        <el-table-column prop="freight_per_kg" label="每KG海运费" width="120" header-align="center" align="center">
          <template #default="scope">
            {{ toFixedNumber(scope.row.freight_per_kg, 2) }} 元
          </template>
        </el-table-column>
        <el-table-column prop="start_date" label="开船日期" width="120" header-align="center" align="center" />
        <!-- 操作人列：表头+内容居中 -->
        <el-table-column prop="updater" label="操作人" width="100" header-align="center" align="center" />

        <!-- 操作列：表头+内容居中（按钮本身已有居中样式） -->
        <el-table-column label="操作" width="240" header-align="center" align="center">
          <template #default="scope">
            <div class="operate-btn-group">
              <el-button type="primary" size="small" @click="openQuoteDialog('edit', scope.row)">编辑</el-button>
              <el-button type="info" size="small" @click="viewQuoteDetail(scope.row.quote_id)">详情</el-button>
              <el-button type="danger" size="small" @click="deleteQuote(scope.row.quote_id)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
</div>

      <!-- 报价新增/编辑弹窗（核心修改） -->
      <el-dialog
        v-model="quoteDialogVisible"
        :title="quoteDialogTitle"
        width="70%"
        max-width="1000px"
        @close="resetQuoteForm"
      >
        <el-form
          ref="quoteFormRef"
          :model="quoteForm"
          :rules="quoteRules"
          label-width="100px"
          class="ff-misc-fee-form"
          style="padding: 0 10px;"
        >
          <el-input v-model.number="quoteForm.quote_id" type="hidden" />

          <el-row :gutter="24" style="margin-bottom: 16px;">
            <el-col :span="12">
              <el-form-item label="货代" prop="ff_id">
                <!-- 新增@change事件，加载货代专属杂费 -->
                <el-select
                  v-model="quoteForm.ff_id"
                  placeholder="请选择货代"
                  clearable
                  style="width: 100%;"
                  @change="handleFfChange"
                >
                  <!-- 修改后 -->
                  <el-option
                    v-for="item in forwarderSelectList"
                    :key="item.ff_id"
                    :label="item.company ? `${item.company}-${item.name}` : item.name"
                    :value="item.ff_id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
<el-form-item label="出口国家" prop="export_country">
  <el-select
    v-model="quoteForm.export_country"
    placeholder="请选择/输入出口国家"
    clearable
    style="width: 100%;"
    filterable
    allow-create
    default-first-option
  >
    <el-option
      v-for="country in exportCountryList"
      :key="`dialog-country-${country}`"
      :label="country"
      :value="country"
    />
  </el-select>
</el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="24" style="margin-bottom: 16px;">
            <el-col :span="12">
              <el-form-item label="集装箱规格" prop="container_id">
                <div class="container-select-wrapper">
                  <el-select
                    v-model="quoteForm.container_id"
                    placeholder="请选择集装箱规格（必填）"
                    clearable
                    style="width: 100%;"
                  >
                    <el-option
                      v-for="item in containerList"
                      :key="item.container_id"
                      :label="`${item.spec_desc || '无描述'} (${item.length_cm}×${item.width_cm}×${item.height_cm}cm)`"
                      :value="item.container_id"
                    />
                  </el-select>
                  <el-button
                    type="success"
                    icon="el-icon-plus"
                    size="medium"
                    @click="openContainerDialog()"
                    title="新增集装箱规格"
                    class="add-btn"
                  >
                    新增
                  </el-button>
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="货物" prop="goods_id">
                <div class="container-select-wrapper">
                  <el-select
                    v-model="quoteForm.goods_id"
                    placeholder="请选择货物（可选）"
                    clearable
                    style="width: 100%;"
                  >
                    <el-option
                      v-for="item in goodsList"
                      :key="item.goods_id"
                      :label="`${item.goods_name || '未知货物'} (${formatGoodsSpec(item)})`"
                      :value="item.goods_id"
                    />
                  </el-select>
                  <el-button
                    type="success"
                    icon="el-icon-plus"
                    size="medium"
                    @click="openGoodsDialog()"
                    title="新增货物规格"
                    class="add-btn"
                  >
                    新增
                  </el-button>
                </div>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="24" style="margin-bottom: 16px;">
            <el-col :span="12">
     <el-form-item label="出口港" prop="export_port">
  <el-select
    v-model="quoteForm.export_port"
    placeholder="请选择/输入出口港"
    clearable
    style="width: 100%;"
    filterable
    allow-create
    default-first-option
  >
    <el-option
      v-for="port in exportPortList"
      :key="`dialog-export-port-${port}`"
      :label="port"
      :value="port"
    />
  </el-select>
</el-form-item>
            </el-col>
            <el-col :span="12">
<el-form-item label="目的港" prop="destination_port">
  <el-select
    v-model="quoteForm.destination_port"
    placeholder="请选择/输入目的港"
    clearable
    style="width: 100%;"
    filterable
    allow-create
    default-first-option
  >
    <el-option
      v-for="port in destinationPortList"
      :key="`dialog-dest-port-${port}`"
      :label="port"
      :value="port"
    />
  </el-select>
</el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="24" style="margin-bottom: 16px;">
            <el-col :span="12">
              <el-form-item label="开始日期" prop="start_date">
                <el-date-picker
                  v-model="quoteForm.start_date"
                  type="date"
                  placeholder="请选择开始日期（可选）"
                  clearable
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  style="width: 100%;"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="最晚开船期" prop="latest_departure_date">
                <el-date-picker
                  v-model="quoteForm.latest_departure_date"
                  type="date"
                  placeholder="请选择最晚开船期（可选）"
                  clearable
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  style="width: 100%;"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="24" style="margin-bottom: 16px;">
            <el-col :span="12">
              <el-form-item label="海运费(总)" prop="total_freight">
                <el-input
                  v-model.number="quoteForm.total_freight"
                  type="number"
                  placeholder="请输入海运费（总）（可选）"
                  append="元"
                  min="0"
                  style="width: 100%;"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="每KG海运费" prop="freight_per_kg">
                <el-input
                  v-model.number="quoteForm.freight_per_kg"
                  type="number"
                  placeholder="请输入每KG海运费（可选）"
                  append="元"
                  min="0"
                  style="width: 100%;"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="24" style="margin-bottom: 16px;">
            <el-col :span="24">
              <el-form-item label="备注" prop="remark">
                <el-input
                  v-model="quoteForm.remark"
                  type="textarea"
                  rows="3"
                  placeholder="请输入备注信息（可选）"
                  style="width: 100%;"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 杂费项配置- 核心修改 -->
          <el-row :gutter="24" style="margin-bottom: 16px;">
            <el-col :span="24">
              <el-form-item label="杂费项配置" class="misc-fee-form-item">
                <div class="misc-fee-header">
                  <div class="misc-fee-total">选中总金额：{{ selectedMiscFeeTotal }} 元</div>
<el-button
  type="primary"
  @click="openQuoteMiscFeeSelectDialog()"
  icon="el-icon-plus"
  size="small"
  class="add-misc-fee-btn"
  :disabled="!quoteForm.ff_id"
  style="margin-left: 20px;"
>
  选择货代专属杂费
</el-button>
                </div>

                <el-table
                  ref="quoteMiscFeeTableRef"
                  v-loading="quoteMiscFeeLoading"
                  :data="quoteMiscFeeList"
                  border
                  stripe
                  size="medium"
                  @selection-change="handleMiscFeeSelection"
                  @cell-change="handleMiscFeeCellChange"
                  empty-text="暂无杂费，点击「选择货代专属杂费」添加"
                  class="ff-misc-fee-table-container"
                >
                  <el-table-column type="selection" width="55" />
                  <el-table-column prop="fee_name" label="杂费名称" min-width="60" show-overflow-tooltip />
                  <el-table-column prop="standard_amount_snapshot" label="标准金额" width="120">
                    <template #default="scope">
                      {{ toFixedNumber(scope.row.standard_amount_snapshot, 2) }} 元
                    </template>
                  </el-table-column>
                  <el-table-column label="实际报价金额" width="160">
                    <template #default="scope">
                      <el-input
                        v-model.number="scope.row.actual_fee_amount"
                        type="number"
                        min="0"
                        size="small"
                        append="元"
                        @change="updateMiscFeeTotal"
                      />
                    </template>
                  </el-table-column>
                  <el-table-column
                    label="杂费说明"
                    min-width="120"
                    header-align="center"
                    align="center"
                  >
                    <template #default="scope">
                      {{ formatFeeDesc(scope.row.fee_desc_snapshot) }}
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="90" min-width="90" header-align="center" align="center">
                    <template #default="scope">
                      <el-button
                        type="danger"
                        icon="el-icon-delete"
                        size="mini"
                        @click="removeQuoteMiscFee(scope.row)"
                      >删除</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>

        <template #footer>
          <el-button @click="quoteDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitQuoteForm" :loading="quoteFormLoading">提交</el-button>
        </template>
      </el-dialog>

      <!-- 货代专属杂费选择弹窗（新增） -->
      <el-dialog
        v-model="quoteMiscFeeSelectDialogVisible"
        title="选择货代专属杂费"
        width="600px"
        @close="resetQuoteMiscFeeSelectForm"
      >
        <el-table
          ref="ffMiscFeeSelectTableRef"
          v-loading="ffCurrentMiscFeeLoading"
          :data="ffCurrentMiscFeeList"
          border
          stripe
          size="medium"
          @selection-change="handleFfMiscFeeSelect"
          empty-text="该货代暂无专属杂费配置，请先去「货代信息管理」配置"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column
            prop="fee_name"
            label="杂费名称"
            min-width="80"
            show-overflow-tooltip
          />
          <el-table-column prop="standard_amount" label="标准金额（元）" width="120">
            <template #default="scope">
              {{ toFixedNumber(scope.row.standard_amount, 2) }}
            </template>
          </el-table-column>
<el-table-column label="杂费说明" min-width="100">
  <template #default="scope">
    {{ formatFeeDesc(scope.row.fee_desc) }}
  </template>
</el-table-column>
        </el-table>
        <template #footer>
          <el-button @click="quoteMiscFeeSelectDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmFfMiscFeeSelect">确认选择</el-button>
        </template>
      </el-dialog>

      <!-- 新增货物弹窗（保留原有） -->
      <el-dialog
        v-model="goodsDialogVisible"
        title="新增货物规格"
        width="600px"
        @close="resetGoodsForm"
      >
        <el-form
          ref="goodsFormRef"
          :model="goodsForm"
          :rules="goodsRules"
          label-width="100px"
          class="ff-misc-fee-form goods-form-custom"
        >
          <el-form-item label="货物名称" prop="goods_name">
            <el-input v-model="goodsForm.goods_name" placeholder="请输入货物名称（可选）" />
          </el-form-item>
          <el-form-item label="长(cm)" prop="length_cm">
            <el-input
              v-model.number="goodsForm.length_cm"
              type="number"
              placeholder="请输入长度（cm，可选）"
              min="0.01"
              step="0.01"
            />
          </el-form-item>
          <el-form-item label="宽(cm)" prop="width_cm">
            <el-input
              v-model.number="goodsForm.width_cm"
              type="number"
              placeholder="请输入宽度（cm，可选）"
              min="0.01"
              step="0.01"
            />
          </el-form-item>
          <el-form-item label="高(cm)" prop="height_cm">
            <el-input
              v-model.number="goodsForm.height_cm"
              type="number"
              placeholder="请输入高度（cm，可选）"
              min="0.01"
              step="0.01"
            />
          </el-form-item>
          <el-form-item label="单位体积(m³)" prop="volume_per_unit">
            <el-input
              v-model.number="goodsForm.volume_per_unit"
              type="number"
              placeholder="请输入单位体积（m³，可选）"
              min="0.01"
              step="0.01"
            />
          </el-form-item>
          <el-form-item label="单位重量(KG)" prop="weight_per_unit">
            <el-input
              v-model.number="goodsForm.weight_per_unit"
              type="number"
              placeholder="请输入单位重量（KG，可选）"
              min="0.01"
              step="0.01"
            />
          </el-form-item>
          <el-form-item label="规格描述" prop="spec_desc">
            <el-input v-model="goodsForm.spec_desc" placeholder="请输入规格描述（可选）" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="goodsDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitGoodsForm" :loading="goodsFormLoading">提交</el-button>
        </template>
      </el-dialog>

      <el-dialog
        v-model="containerDialogVisible"
        title="新增集装箱规格"
        width="600px"
        @close="resetContainerForm"
      >
        <el-form
          ref="containerFormRef"
          :model="containerForm"
          :rules="containerRules"
          label-width="100px"
          class="ff-misc-fee-form container-form-custom"
        >
          <!-- 原有表单项不变，仅修改el-form的label-width -->
          <el-form-item label="长(cm)" prop="length_cm">
            <el-input
              v-model.number="containerForm.length_cm"
              type="number"
              placeholder="请输入长度"
              step="0.01"
              append="cm"
            />
          </el-form-item>
          <el-form-item label="宽(cm)" prop="width_cm">
            <el-input
              v-model.number="containerForm.width_cm"
              type="number"
              placeholder="请输入宽度"
              step="0.01"
              append="cm"
            />
          </el-form-item>
          <el-form-item label="高(cm)" prop="height_cm">
            <el-input
              v-model.number="containerForm.height_cm"
              type="number"
              placeholder="请输入高度"
              step="0.01"
              append="cm"
            />
          </el-form-item>
          <el-form-item label="实际容量(m³)" prop="actual_volume">
            <el-input
              v-model.number="containerForm.actual_volume"
              type="number"
              placeholder="请输入实际容量"
              step="0.01"
              append="m³"
            />
          </el-form-item>
          <el-form-item label="最大载重(KG)" prop="max_load_kg">
            <el-input
              v-model.number="containerForm.max_load_kg"
              type="number"
              placeholder="请输入最大载重"
              step="0.01"
              append="KG"
            />
          </el-form-item>
          <el-form-item label="规格描述" prop="spec_desc">
            <el-input v-model="containerForm.spec_desc" placeholder="请输入规格描述（可选）" />
          </el-form-item>
        </el-form>
        <!-- 弹窗footer不变 -->
        <template #footer>
          <el-button @click="containerDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitContainerForm" :loading="containerFormLoading">提交</el-button>
        </template>
      </el-dialog>

      <!-- 报价详情弹窗（核心优化） -->
      <el-dialog
        v-model="quoteDetailVisible"
        title="货代报价详情"
        width="50%"
        max-width="900px"
      >
        <div v-if="quoteDetailLoading" class="loading-wrapper">
          <el-loading-spinner />
          <p>加载中...</p>
        </div>
        <div v-else class="quote-detail-content">
          <el-descriptions :column="2" border class="quote-detail-desc">
         <el-descriptions-item label="货代">
  {{ quoteDetail.quote_info?.freight_forwarder?.company
    ? `${quoteDetail.quote_info.freight_forwarder.company}-${quoteDetail.quote_info.freight_forwarder.name}`
    : (quoteDetail.quote_info?.freight_forwarder?.name || '-') }}
</el-descriptions-item>
            <el-descriptions-item label="集装箱规格">
              {{ quoteDetail.quote_info?.container?.spec_desc || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="货物名称">{{ quoteDetail.quote_info?.goods?.goods_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="出口国家">{{ quoteDetail.quote_info?.export_country || '-' }}</el-descriptions-item>
            <el-descriptions-item label="出口港">{{ quoteDetail.quote_info?.export_port || '-' }}</el-descriptions-item>
            <el-descriptions-item label="目的港">{{ quoteDetail.quote_info?.destination_port || '-' }}</el-descriptions-item>
            <el-descriptions-item label="开始日期">{{ quoteDetail.quote_info?.start_date || '-' }}</el-descriptions-item>
            <el-descriptions-item label="最晚开船期">{{ quoteDetail.quote_info?.latest_departure_date || '-' }}</el-descriptions-item>
            <el-descriptions-item label="航程">{{ quoteDetail.quote_info?.voyage || '-' }}</el-descriptions-item>
            <el-descriptions-item label="海运费(总)">
              {{ toFixedNumber(quoteDetail.quote_info?.total_freight, 2) }} 元
            </el-descriptions-item>
            <el-descriptions-item label="每KG海运费">
              {{ toFixedNumber(quoteDetail.quote_info?.freight_per_kg, 2) }} 元
            </el-descriptions-item>
            <el-descriptions-item label="创建人">{{ quoteDetail.quote_info?.creator || '-' }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ quoteDetail.quote_info?.create_time || '-' }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">
              {{ formatTime(quoteDetail.quote_info?.update_time) || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="备注" :span="2" style="white-space: pre-line;">{{ quoteDetail.quote_info?.remark || '-' }}</el-descriptions-item>
          </el-descriptions>
          <el-table
            :data="quoteDetail.misc_fees || []"
            border
            stripe
            class="ff-misc-fee-table-container"
            empty-text="该报价暂无杂费数据"
            style="margin-top: 16px;"
          >
            <el-table-column prop="fee_name" label="杂费名称" min-width="60" show-overflow-tooltip />
            <el-table-column prop="standard_amount_snapshot" label="标准金额" width="120">
              <template #default="scope">
                {{ toFixedNumber(scope.row.standard_amount_snapshot, 2) }} 元
              </template>
            </el-table-column>
            <el-table-column prop="actual_fee_amount" label="实际报价金额" width="120">
              <template #default="scope">
                {{ toFixedNumber(scope.row.actual_fee_amount, 2) }} 元
              </template>
            </el-table-column>
            <el-table-column
              label="杂费说明"
              min-width="120"
              header-align="center"
              align="left"
            >
              <template #default="scope">
                {{ formatFeeDesc(scope.row.fee_desc_snapshot) }}
              </template>
            </el-table-column>
            <el-table-column prop="create_time" label="创建时间" width="180" />
          </el-table>
        </div>
        <template #footer>
          <el-button @click="quoteDetailVisible = false">关闭</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
/* global defineExpose */
import { ref, reactive, onMounted, getCurrentInstance, onUnmounted, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 移除：标签页激活状态（已删除el-tabs，该变量无用）
// const activeTab = ref('forwarder')

// ========== 优化版：全局优雅处理 ResizeObserver 循环错误（彻底无副作用、无残留） ==========
const OriginalResizeObserver = window.ResizeObserver;
// 保存需要清理的 patched 实例（避免组件卸载后残留）
const resizeObserverInstances = new Set();

// 防护：避免重复重写，仅在原始对象存在且未被重写时执行
if (OriginalResizeObserver && !window.ResizeObserver._patched) {
  window.ResizeObserver = class PatchedResizeObserver extends OriginalResizeObserver {
    constructor(callback) {
      // 核心优化：用 queueMicrotask（微任务）替代 setTimeout（宏任务），无视觉延迟
      super((entries, observer) => {
        queueMicrotask(() => {
          try {
            // 仅当实例未被销毁时执行回调（避免卸载后执行）
            if (resizeObserverInstances.has(observer)) {
              callback(entries, observer);
            }
          } catch (err) {
            // 优化：更严谨的错误过滤，兼容不同浏览器/框架的错误消息格式
            const errorMessages = [
              'ResizeObserver loop completed with undelivered notifications',
              'ResizeObserver loop limit exceeded',
              'ResizeObserver timeout'
            ];
            if (!errorMessages.some(msg => err.message?.includes(msg))) {
              // 仅抛出非该类错误，不屏蔽其他正常业务错误
              throw err;
            }
          }
        });
      });

      // 记录实例，用于后续清理
      resizeObserverInstances.add(this);
    }

    // 重写 disconnect 方法，清理实例记录
    disconnect() {
      super.disconnect();
      resizeObserverInstances.delete(this);
    }
  };

  // 标记已重写，防止重复执行
  window.ResizeObserver._patched = true;
}


// ========== 安全获取全局挂载的axios（仅保留一份） ==========
const instance = getCurrentInstance()
const $axios = instance ? instance.proxy.$axios : null

if (!$axios) {
  console.error('【全局axios获取失败】请检查main.js是否已正确挂载$axios到app.config.globalProperties')
  ElMessage.error('系统初始化失败：请求工具未加载，请刷新页面重试')
}

// ========== 通用工具函数（合并去重，保留一份） ==========
// 新增：格式化货代显示（处理None-名字/空公司的情况）
const formatForwarderDisplay = (value) => {
  if (!value) return '-';
  // 处理后端返回的"None-名字"格式
  if (value.startsWith('None-')) {
    return value.replace('None-', '');
  }
  // 处理自定义拼接的"公司-名字"（公司为空时只显示名字）
  if (value.startsWith('-')) {
    return value.replace('-', '');
  }
  return value;
};

const toFixedNumber = (value, decimalPlaces = 2) => {
  if (value === null || value === undefined || isNaN(Number(value)) || value === '') {
    return '0.00';
  }
  const num = Number(value);
  return num.toFixed(decimalPlaces);
};

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
};

const formatForwarderField = (value) => {
  // 处理所有空值场景：'None'字符串、null、undefined、空字符串
  if (value === 'None' || value === null || value === undefined || value === '') {
    return '';
  }
  // 非字符串类型（如数字）直接返回
  if (typeof value !== 'string') {
    return value;
  }
  // 字符串去空格后返回
  return value.trim();
};

const formatRemark = (remark) => {
  if (remark === 'None' || remark === null || remark === undefined || remark === '') {
    return '';
  }
  return remark;
};

const formatFeeDesc = (desc) => {
  if (desc === null || desc === undefined || desc === 'None' || desc.trim() === '') {
    return '';
  }
  return desc.trim();
};

// ========== 新增：格式化货物规格 ==========
const formatGoodsSpec = (goodsItem) => {
  const length = goodsItem.length_cm || '';
  const width = goodsItem.width_cm || '';
  const height = goodsItem.height_cm || '';

  if (length && width && height) {
    return `${length}×${width}×${height}cm`;
  }
  return goodsItem.spec_desc || '无规格';
};

// ========== 第一部分：货代信息模块 - 响应式数据 ==========
// 货代筛选
const forwarderFilter = ref({ company: '', name: '' })
// 货代表格（重命名为forwarderTableList，避免与报价下拉框冲突）
const forwarderTableList = ref([])
const forwarderLoading = ref(false)
const selectedForwarderRows = ref([]) // 当前页选中项
const selectedAllForwarderRows = ref([]) // 全局持久化选中项（新增）
const forwarderCurrentPage = ref(1)
const forwarderPageSize = ref(10)
const forwarderTotal = ref(0)

// 货代弹窗
const forwarderDialogVisible = ref(false)
const forwarderDialogTitle = ref('新增货代')
const forwarderFormLoading = ref(false)
const forwarderFormRef = ref(null)
const forwarderForm = ref({
  ff_id: '',
  name: '',
  gender: '',
  company: '',
  contact: '',
  remark: ''
})
const forwarderRules = ref({
  name: [{ required: true, message: '请输入货代姓名', trigger: 'blur' }]
})

// 货代杂费
const ffMiscFeeDialogVisible = ref(false)
const ffMiscFeeDialogTitle = ref('编辑货代专属杂费')
const ffMiscFeeFormLoading = ref(false)
const ffMiscFeeTableLoading = ref(false)
const ffMiscFeeList = ref([])
const ffMiscFeeFormRef = ref(null)
const ffMiscFeeListAll = ref([])
const ffMiscFeeForm = ref({
  ff_misc_id: '',
  ff_id: '',
  fee_id: '',
  fee_name: '',
  standard_amount: '',
  fee_desc: ''
})
const ffMiscFeeCurrentPage = ref(1)
const ffMiscFeePageSize = ref(10)
const ffMiscFeeTotal = ref(0)
const ffMiscFeeRules = ref({
  fee_name: [{ required: true, message: '请输入杂费名称', trigger: 'blur' }],
  standard_amount: [{
    validator: (rule, value, callback) => {
      if (value && Number(value) < 0) {
        callback(new Error('标准金额不能为负数'))
      } else {
        callback()
      }
    }, trigger: 'blur'
  }]
})

// ========== 第二部分：货代报价模块 - 响应式数据（核心修改：补充下拉框数据源+完善筛选条件） ==========
// 报价筛选（核心修改：补充下拉框绑定的字段，与模板保持一致）
const quoteFilter = reactive({
  globalSearch: '',
  containerSpec: '',
  goodsName: '',
  exportCountry: '',
  exportPort: '',
  destinationPort: '',
  startDate: '',
  ff_id: '',
  foreign_order_id: ''
})

// 报价表格
const quoteList = ref([])
const quoteLoading = ref(false)
const selectedQuoteRows = ref([]) // 当前页选中项
const selectedAllQuoteRows = ref([]) // 全局持久化选中项（新增）
const quoteCurrentPage = ref(1)
const quoteTotal = ref(0)

// 报价弹窗
const quoteDialogVisible = ref(false)
const quoteDialogTitle = ref('')
const containerDialogVisible = ref(false)
const quoteDetailVisible = ref(false)
const goodsDialogVisible = ref(false)
const quoteMiscFeeSelectDialogVisible = ref(false) // 新增：货代专属杂费选择弹窗

// 报价加载状态
const quoteFormLoading = ref(false)
const containerFormLoading = ref(false)
const quoteDetailLoading = ref(false)
const goodsFormLoading = ref(false)
const quoteMiscFeeLoading = ref(false)
const ffCurrentMiscFeeLoading = ref(false) // 新增：当前货代专属杂费加载状态

// 报价下拉框数据源（核心修改：补充出口国家、出口港、目的港下拉列表）
const forwarderSelectList = ref([]) // 报价用货代下拉框（重命名避免冲突）
const containerList = ref([])
const goodsList = ref([])
const exportCountryList = ref([]) // 新增：出口国家下拉数据源
const exportPortList = ref([])    // 新增：出口港下拉数据源
const destinationPortList = ref([]) // 新增：目的港下拉数据源
const ffCurrentMiscFeeList = ref([]) // 新增：当前选中货代的专属杂费列表
const selectedFfMiscFeeRows = ref([]) // 新增：选中的货代专属杂费列表

// 报价杂费（核心修改：移除标准杂费关联，改为列表）
const quoteMiscFeeList = ref([]) // 本地维护的杂费列表
const selectedMiscFeeRows = ref([])
const selectedMiscFeeTotal = ref(0)

// 报价表单（核心修改：misc_fees适配字段）
const quoteFormRef = ref(null)
const quoteMiscFeeTableRef = ref(null)
const ffMiscFeeSelectTableRef = ref(null)
const goodsFormRef = ref(null)
const containerFormRef = ref(null)

const quoteForm = reactive({
  quote_id: '',
  foreign_order_id: '',
  ff_id: '',
  container_id: '',
  goods_id: '',
  export_country: '',
  export_port: '',
  destination_port: '',
  start_date: '',
  latest_departure_date: '',
  voyage: '',
  total_freight: '',
  freight_per_kg: '',
  remark: '',
  misc_fees: [] // 结构：[{fee_name, standard_amount_snapshot, actual_fee_amount, fee_desc_snapshot, remark}]
})

const containerForm = reactive({
  length_cm: '',
  width_cm: '',
  height_cm: '',
  actual_volume: '',
  max_load_kg: '',
  spec_desc: ''
})

const goodsForm = reactive({
  goods_name: '',
  spec_desc: '',
  length_cm: '',
  width_cm: '',
  height_cm: '',
  volume_per_unit: '',
  weight_per_unit: ''
})

// 核心修改：报价详情适配杂费字段
const quoteDetail = reactive({
  quote_info: {},
  misc_fees: [] // 结构：[{actual_misc_id, fee_name, standard_amount_snapshot, actual_fee_amount, fee_desc_snapshot, remark, create_time}]
})

// 报价验证规则
const quoteRules = ref({
  ff_id: [{ required: true, message: '请选择货代', trigger: 'change' }],
  container_id: [{ required: true, message: '请选择集装箱规格（必填，不可为空）', trigger: 'change' }],
  total_freight: [{
    validator: (rule, value, callback) => {
      if (value && value < 0) {
        callback(new Error('海运费（总）不能为负数'));
      } else {
        callback();
      }
    }, trigger: 'blur'
  }],
  freight_per_kg: [{
    validator: (rule, value, callback) => {
      if (value && value < 0) {
        callback(new Error('每KG海运费不能为负数'));
      } else {
        callback();
      }
    }, trigger: 'blur'
  }]
})

const containerRules = ref({
  length_cm: [{ // 移除 required: true，仅当有值时校验大于0
    validator: (rule, value, callback) => {
      if (value !== '' && value !== undefined && value !== null && value <= 0) {
        callback(new Error('长度必须大于0'));
      } else {
        callback();
      }
    }, trigger: 'blur'
  }],
  width_cm: [{ // 移除 required: true，仅当有值时校验大于0
    validator: (rule, value, callback) => {
      if (value !== '' && value !== undefined && value !== null && value <= 0) {
        callback(new Error('宽度必须大于0'));
      } else {
        callback();
      }
    }, trigger: 'blur'
  }],
  height_cm: [{ // 移除 required: true，仅当有值时校验大于0
    validator: (rule, value, callback) => {
      if (value !== '' && value !== undefined && value !== null && value <= 0) {
        callback(new Error('高度必须大于0'));
      } else {
        callback();
      }
    }, trigger: 'blur'
  }],
  actual_volume: [{ // 移除 required: true，仅当有值时校验大于0
    validator: (rule, value, callback) => {
      if (value !== '' && value !== undefined && value !== null && value <= 0) {
        callback(new Error('实际容量必须大于0'));
      } else {
        callback();
      }
    }, trigger: 'blur'
  }],
  max_load_kg: [{ // 移除 required: true，仅当有值时校验大于0
    validator: (rule, value, callback) => {
      if (value !== '' && value !== undefined && value !== null && value <= 0) {
        callback(new Error('最大载重必须大于0'));
      } else {
        callback();
      }
    }, trigger: 'blur'
  }]
});

const goodsRules = ref({
  length_cm: [{
    validator: (rule, value, callback) => {
      if (value && value <= 0) {
        callback(new Error('长度必须大于0'));
      } else {
        callback();
      }
    }, trigger: 'blur'
  }],
  width_cm: [{
    validator: (rule, value, callback) => {
      if (value && value <= 0) {
        callback(new Error('宽度必须大于0'));
      } else {
        callback();
      }
    }, trigger: 'blur'
  }],
  height_cm: [{
    validator: (rule, value, callback) => {
      if (value && value <= 0) {
        callback(new Error('高度必须大于0'));
      } else {
        callback();
      }
    }, trigger: 'blur'
  }],
  volume_per_unit: [{
    validator: (rule, value, callback) => {
      if (value && value <= 0) {
        callback(new Error('单位体积必须大于0'));
      } else {
        callback();
      }
    }, trigger: 'blur'
  }],
  weight_per_unit: [{
    validator: (rule, value, callback) => {
      if (value && value <= 0) {
        callback(new Error('单位重量必须大于0'));
      } else {
        callback();
      }
    }, trigger: 'blur'
  }]
})

// 核心新增：加载出口国家/出口港/目的港下拉框数据（优化后）
const loadFreightQuoteDropdownOptions = async () => {
  if (!$axios) {
    ElMessage.error('全局axios未初始化，无法加载下拉框选项');
    return;
  }
  try {
    const apiUrl = '/freight/freight-quote/dropdown-options/';
    console.log(`正在请求下拉框数据：${apiUrl}`);
    const res = await $axios.get(apiUrl);

    // 关键优化1：兼容后端两种返回格式（带success/不带success），避免数据丢失
    let dropdownData = {};
    if (res.data?.success === true) {
      // 格式1：{success: true, data: {...}}
      dropdownData = res.data.data || {};
    } else {
      // 格式2：直接返回{export_countries: [], ...}（避免后端未封装success导致数据丢失）
      dropdownData = res.data || {};
    }

    // 关键优化2：强制转为数组，避免非数组类型导致v-for报错
    exportCountryList.value = Array.isArray(dropdownData.export_countries) ? dropdownData.export_countries : [];
    exportPortList.value = Array.isArray(dropdownData.export_ports) ? dropdownData.export_ports : [];
    destinationPortList.value = Array.isArray(dropdownData.destination_ports) ? dropdownData.destination_ports : [];

    // 关键优化3：调试日志，确认数据是否正确赋值（方便排查）
    console.log('下拉框数据赋值结果：', {
      exportCountryList: exportCountryList.value,
      exportPortList: exportPortList.value,
      destinationPortList: destinationPortList.value
    });

    // 数据为空提示优化
    const emptyFields = [];
    if (exportCountryList.value.length === 0) emptyFields.push('出口国家');
    if (exportPortList.value.length === 0) emptyFields.push('出口港');
    if (destinationPortList.value.length === 0) emptyFields.push('目的港');
    if (emptyFields.length > 0) {
      ElMessage.info(`提示：${emptyFields.join('、')}暂无有效数据，请先新增报价并录入对应字段后刷新`);
    }
  } catch (error) {
    if (error.response && error.response.status === 404) {
      ElMessage.error(`下拉框数据接口不存在：${error.config.url}，请检查后端路由配置`);
    } else {
      const errMsg = error.response?.data?.message || error.message || '加载下拉框选项请求异常';
      ElMessage.error(errMsg);
    }
    console.error('下拉框选项加载失败详情：', error);
  }
};

// ========== 第一部分：货代信息模块 - 业务方法（核心修改：选中持久化） ==========
const loadForwarderTableList = async () => {
  if (!$axios) {
    ElMessage.error('全局axios未初始化，无法加载货代列表');
    return;
  }
  try {
    forwarderLoading.value = true
    const params = {
      company: forwarderFilter.value.company.trim(),
      name: forwarderFilter.value.name.trim(),
      page: forwarderCurrentPage.value,
      page_size: forwarderPageSize.value
    }
    Object.keys(params).forEach(key => {
      if (params[key] === '' || (key !== 'page' && key !== 'page_size' && !params[key])) {
        delete params[key]
      }
    })
    const res = await $axios.get('/freight/forwarder/list/', { params })
    const paginatedData = res.data.data || []

    // 核心新增：格式化每条数据，处理None为空
    const formattedData = paginatedData.map(item => {
      const formattedItem = { ...item };
      // 遍历所有字段，统一处理空值
      Object.keys(formattedItem).forEach(key => {
        if (formattedItem[key] === 'None' || formattedItem[key] === null || formattedItem[key] === undefined) {
          formattedItem[key] = '';
        }
        // 字符串类型自动去空格
        if (typeof formattedItem[key] === 'string') {
          formattedItem[key] = formattedItem[key].trim();
        }
      });
      // 保留杂费项目/总金额的默认值逻辑
      formattedItem['货代杂费项目_收费'] = formattedItem['货代杂费项目_收费'] || '无杂费配置';
      formattedItem['总收费金额'] = formattedItem['总收费金额'] || 0;
      return formattedItem;
    });

    forwarderTotal.value = res.data.total || 0
    forwarderTableList.value = formattedData // 赋值格式化后的数据

    // 核心新增：分页加载后恢复选中状态
    nextTick(() => {
      const forwarderTableRef = instance.proxy.$refs.forwarderTableRef;
      if (forwarderTableRef) {
        forwarderTableList.value.forEach(row => {
          if (selectedAllForwarderRows.value.some(item => item.ff_id === row.ff_id)) {
            forwarderTableRef.toggleRowSelection(row, true);
          }
        });
      }
    });
  } catch (error) {
    const errMsg = error.response?.data?.message || '加载货代列表失败'
    ElMessage.error(errMsg)
    forwarderTableList.value = []
    forwarderTotal.value = 0
  } finally {
    forwarderLoading.value = false
  }
}

const handleForwarderSizeChange = (size) => {
  forwarderPageSize.value = size
  forwarderCurrentPage.value = 1
  loadForwarderTableList()
}

const handleForwarderCurrentChange = (page) => {
  forwarderCurrentPage.value = page
  loadForwarderTableList()
}

const queryForwarder = () => {
  forwarderCurrentPage.value = 1
  // 核心新增：筛选时清空全局选中
  selectedAllForwarderRows.value = []
  loadForwarderTableList()
}

const resetForwarderFilter = () => {
  forwarderFilter.value = { company: '', name: '' }
  forwarderCurrentPage.value = 1
  // 核心新增：重置时清空全局选中
  selectedAllForwarderRows.value = []
  loadForwarderTableList()
}

// 核心修改：货代选中事件 - 实现持久化
const handleForwarderSelection = (val) => {
  selectedForwarderRows.value = val || []

  // 1. 获取当前页所有数据的ID
  const currentPageIds = forwarderTableList.value.map(item => item.ff_id);

  // 2. 移除当前页中取消选中的项
  selectedAllForwarderRows.value = selectedAllForwarderRows.value.filter(
    globalItem => !currentPageIds.includes(globalItem.ff_id) ||
    val.some(currentItem => currentItem.ff_id === globalItem.ff_id)
  );

  // 3. 添加当前页中新选中的项
  val.forEach(currentItem => {
    if (!selectedAllForwarderRows.value.some(globalItem => globalItem.ff_id === currentItem.ff_id)) {
      selectedAllForwarderRows.value.push(currentItem);
    }
  });
}

const openForwarderDialog = (type, row = {}) => {
  forwarderDialogVisible.value = true
  if (type === 'add') {
    forwarderDialogTitle.value = '新增货代'
    resetForwarderForm()
  } else if (type === 'edit') {
    forwarderDialogTitle.value = '编辑货代'
    forwarderForm.value = {
      ff_id: formatForwarderField(row.ff_id) || '',
      name: formatForwarderField(row.name) || '',
      gender: formatForwarderField(row.gender) || '',
      company: formatForwarderField(row.company) || '',
      contact: formatForwarderField(row.contact) || '',
      remark: formatForwarderField(row.remark) || ''
    }
  }
}

const resetForwarderForm = () => {
  forwarderForm.value = {
    ff_id: '',
    name: '',
    gender: '',
    company: '',
    contact: '',
    remark: ''
  }
  forwarderFormRef.value?.resetFields()
}

const submitForwarderForm = async () => {
  if (!forwarderFormRef.value) return
  if (!$axios) {
    ElMessage.error('全局axios未初始化，无法提交表单');
    return;
  }
  try {
    await forwarderFormRef.value.validate()
  } catch (error) {
    return ElMessage.warning('请填写完整且有效的表单数据！')
  }

  const submitData = {
    name: forwarderForm.value.name.trim(),
    gender: forwarderForm.value.gender?.trim() || null,
    company: forwarderForm.value.company?.trim() || null,
    contact: forwarderForm.value.contact?.trim() || null,
    remark: forwarderForm.value.remark?.trim() || null
  }

  try {
    forwarderFormLoading.value = true
    if (!forwarderForm.value.ff_id) {
      await $axios.post('/freight/forwarder/add/', submitData)
      ElMessage.success('货代信息创建成功！')
    } else {
      await $axios.post(`/freight/forwarder/edit/${forwarderForm.value.ff_id}/`, submitData)
      ElMessage.success('货代信息修改成功！')
    }
    forwarderDialogVisible.value = false
    // 先刷新货代表格
    await loadForwarderTableList()
    // 核心新增：刷新报价下拉框数据源（关键修复）
    await loadForwarderSelectList()
  } catch (error) {
    const errMsg = error.response?.data?.message || '服务器异常'
    ElMessage.error(`操作失败：${errMsg}`)
  } finally {
    forwarderFormLoading.value = false
  }
};

const deleteForwarder = async (ffId) => {
  if (!ffId) return
  if (!$axios) {
    ElMessage.error('全局axios未初始化，无法执行删除操作');
    return;
  }
  try {
    await ElMessageBox.confirm(
      '此操作将永久删除该货代信息（注：若该货代存在关联报价，将无法删除，请先删除对应报价）',
      '提示',
      { type: 'warning' }
    )
    await $axios.post(`/freight/forwarder/delete/${ffId}/`)
    ElMessage.success('货代信息删除成功！')

    // 核心新增：删除后从全局选中中移除
    selectedAllForwarderRows.value = selectedAllForwarderRows.value.filter(item => item.ff_id !== ffId);

    await loadForwarderTableList()
    await loadForwarderSelectList()
  } catch (error) {
    // 1. 排除用户点击“取消”的场景
    if (error !== 'cancel') {
      // 2. 提取错误信息（优先后端自定义提示，其次默认提示）
      const errMsg = error.response?.data?.message || error.message || '删除失败'

      // 3. 判断是否为业务性无法删除错误
      const isBusinessError = errMsg.includes('无法删除')

      // 4. 针对性展示弹窗
      if (isBusinessError) {
        // 业务错误：警告样式弹窗，友好提示
        await ElMessageBox.alert(errMsg, '操作提示', {
          type: 'warning',
          confirmButtonText: '确定',
          closeOnClickModal: false // 点击弹窗外层不关闭，强制用户确认
        })
      } else {
        // 系统错误：错误样式弹窗，提示服务器故障
        await ElMessageBox.alert(`服务器故障：${errMsg}`, '操作失败', {
          type: 'error',
          confirmButtonText: '确定'
        })
      }
    }
  }
};

const batchDeleteForwarder = async () => {
  if (selectedAllForwarderRows.value.length === 0) return
  if (!$axios) {
    ElMessage.error('全局axios未初始化，无法执行批量删除操作');
    return;
  }
  const ids = selectedAllForwarderRows.value.map(item => item.ff_id)
  try {
    await ElMessageBox.confirm(
      `此操作将尝试删除选中的${ids.length}条货代信息（注：若货代存在关联报价，将无法删除，请先删除对应报价）`,
      '提示',
      { type: 'warning' }
    )
    const failIds = []
    const quoteRelatedFailIds = [] // 记录因报价关联无法删除的货代ID
    for (const id of ids) {
      try {
        await $axios.post(`/freight/forwarder/delete/${id}/`)
      } catch (err) {
        const errMsg = err.response?.data?.message || '未知错误'
        if (errMsg.includes('无法删除')) {
          quoteRelatedFailIds.push(id)
        }
        failIds.push(id)
      }
    }
    // 分情况提示，避免报错样式
    let warningMsg = ''
    if (quoteRelatedFailIds.length > 0) {
      warningMsg += `货代ID【${quoteRelatedFailIds.join(', ')}】：无法删除，请先删除对应报价；\n`
    }
    if (failIds.length > quoteRelatedFailIds.length) {
      const otherFailIds = failIds.filter(id => !quoteRelatedFailIds.includes(id))
      warningMsg += `货代ID【${otherFailIds.join(', ')}】：服务器故障，删除失败；\n`
    }
    if (failIds.length > 0) {
      // 批量删除提示：弹窗展示所有失败原因
      await ElMessageBox.alert(warningMsg.slice(0, -1), '批量删除结果提示', {
        type: 'warning',
        confirmButtonText: '确定',
        closeOnClickModal: false,
        dangerouslyUseHTMLString: false // 禁止HTML，避免XSS
      })
    } else {
      ElMessage.success('批量删除货代成功！')
    }

    // 核心新增：批量删除后清空全局选中
    selectedAllForwarderRows.value = [];

    await loadForwarderTableList()
  } catch (error) {
    if (error !== 'cancel') {
      const errMsg = error.response?.data?.message || '服务器异常'
      await ElMessageBox.alert(`批量删除失败：${errMsg}`, '操作失败', {
        type: 'error',
        confirmButtonText: '确定'
      })
    }
  }
}

const loadFfMiscFeeList = async (ffId) => {
  if (!ffId) {
    console.warn('loadFfMiscFeeList: ffId为空，终止请求');
    return;
  }
  if (!$axios) {
    ElMessage.error('全局axios未初始化，无法获取杂费列表');
    return;
  }
  try {
    ffMiscFeeTableLoading.value = true;
    const backendResponse = await $axios.get('/freight/ff-misc-fee/list/', {
      params: { ff_id: ffId }
    });

    if (!backendResponse.success) {
      throw new Error(backendResponse.message || '查询货代杂费失败');
    }

    const rawListAll = Array.isArray(backendResponse.data) ? backendResponse.data : [];
    ffMiscFeeListAll.value = rawListAll;
    ffMiscFeeTotal.value = rawListAll.length;

    const page = ffMiscFeeCurrentPage.value;
    const size = ffMiscFeePageSize.value;
    const startIndex = (page - 1) * size;
    const endIndex = startIndex + size;
    const paginatedList = rawListAll.slice(startIndex, endIndex);

    const formattedList = paginatedList.map(item => ({
      ff_misc_id: item.ff_misc_id || '',
      misc_fee__fee_name: item.misc_fee__fee_name || '未知杂费',
      standard_amount: item.standard_amount || 0,
      fee_desc: formatFeeDesc(item.fee_desc),
      update_time: item.update_time || '-'
    }));

    ffMiscFeeList.value = formattedList;
  } catch (error) {
    const errMsg = error.message || '加载杂费列表失败';
    ElMessage.error(errMsg);
    ffMiscFeeList.value = [];
    ffMiscFeeListAll.value = [];
    ffMiscFeeTotal.value = 0;
  } finally {
    ffMiscFeeTableLoading.value = false;
  }
};

const handleFfMiscFeeSizeChange = (size) => {
  ffMiscFeePageSize.value = size
  ffMiscFeeCurrentPage.value = 1
  loadFfMiscFeeList(ffMiscFeeForm.value.ff_id)
}

const handleFfMiscFeeCurrentChange = (page) => {
  ffMiscFeeCurrentPage.value = page
  loadFfMiscFeeList(ffMiscFeeForm.value.ff_id)
}

const openFfMiscFeeDialog = (type, row = {}) => {
  const currentFfId = Number(row.ff_id) || (selectedAllForwarderRows.value[0] ? Number(selectedAllForwarderRows.value[0].ff_id) : '');

  if (!currentFfId || isNaN(currentFfId)) {
    return ElMessage.warning('请选择有效的货代记录，无法获取货代ID！');
  }

  ffMiscFeeCurrentPage.value = 1;
  ffMiscFeePageSize.value = 10;

  ffMiscFeeDialogVisible.value = true;
  ffMiscFeeForm.value.ff_id = currentFfId;

  if (type === 'add') {
    ffMiscFeeDialogTitle.value = '编辑货代专属杂费';
    resetFfMiscFeeForm();
  } else if (type === 'edit') {
    ffMiscFeeDialogTitle.value = '编辑货代专属杂费';
    ffMiscFeeForm.value = {
      ff_misc_id: row.ff_misc_id || '',
      ff_id: currentFfId,
      fee_id: row.misc_fee__fee_id || '',
      fee_name: row.misc_fee__fee_name || '',
      standard_amount: row.standard_amount || '',
      fee_desc: row.fee_desc || ''
    };
  }

  loadFfMiscFeeList(currentFfId);
};

const resetFfMiscFeeForm = () => {
  const keepFfId = ffMiscFeeForm.value.ff_id
  ffMiscFeeForm.value = {
    ff_misc_id: '',
    ff_id: keepFfId,
    fee_id: '',
    fee_name: '',
    standard_amount: '',
    fee_desc: ''
  }
  ffMiscFeeFormRef.value?.resetFields()
}

const submitFfMiscFeeForm = async () => {
  if (!ffMiscFeeFormRef.value) return;
  if (!$axios) {
    ElMessage.error('全局axios未初始化，无法提交杂费表单');
    return;
  }

  const currentFfId = Number(ffMiscFeeForm.value.ff_id);
  if (!currentFfId || isNaN(currentFfId)) {
    return ElMessage.error('货代ID无效，请关闭弹窗重新选择货代！');
  }

  try {
    await ffMiscFeeFormRef.value.validate();
  } catch (error) {
    return ElMessage.warning('请填写完整且有效的表单数据！');
  }

  const submitData = {
    ff_id: currentFfId,
    fee_name: ffMiscFeeForm.value.fee_name.trim(),
    standard_amount: ffMiscFeeForm.value.standard_amount ? Number(ffMiscFeeForm.value.standard_amount) : null,
    fee_desc: ffMiscFeeForm.value.fee_desc?.trim() || null
  };

  try {
    ffMiscFeeFormLoading.value = true;
    await $axios.post('/freight/ff-misc-fee/bind/', submitData);
    ElMessage.success('编辑货代专属杂费成功！');
    resetFfMiscFeeForm();
    await loadFfMiscFeeList(currentFfId);
    updateForwarderMiscFeeDisplay(currentFfId);
  } catch (error) {
    const errMsg = error.response?.data?.message || '服务器异常';
    ElMessage.error(`操作失败：${errMsg}`);
  } finally {
    ffMiscFeeFormLoading.value = false;
  }
};

const deleteSingleFfMiscFee = async (ffMiscId) => {
  if (!ffMiscId) return;
  if (!$axios) {
    ElMessage.error('全局axios未初始化，无法执行删除操作');
    return;
  }
  try {
    await ElMessageBox.confirm(
      '此操作将永久删除该杂费配置，且无关联报价时才可删除，是否继续？',
      '提示',
      { type: 'warning' }
    );
    await $axios.post(`/freight/ff-misc-fee/delete/${ffMiscId}/`);
    ElMessage.success('杂费删除成功！');
    await loadFfMiscFeeList(ffMiscFeeForm.value.ff_id);
    updateForwarderMiscFeeDisplay(ffMiscFeeForm.value.ff_id);
  } catch (error) {
    // 【核心优化】统一错误处理逻辑
    if (error !== 'cancel') {
      const errMsg = error.response?.data?.message || error.message || '删除失败'
      const isBusinessError = errMsg.includes('无法删除')

      if (isBusinessError) {
        await ElMessageBox.alert(errMsg, '操作提示', {
          type: 'warning',
          confirmButtonText: '确定',
          closeOnClickModal: false
        })
      } else {
        await ElMessageBox.alert(`服务器故障：${errMsg}`, '操作失败', {
          type: 'error',
          confirmButtonText: '确定'
        })
      }
    }
  }
};

const editFfMiscFeeItem = (row) => {
  ffMiscFeeForm.value = {
    ff_misc_id: row.ff_misc_id || '',
    ff_id: row.ff_id || ffMiscFeeForm.value.ff_id,
    fee_id: row.misc_fee__fee_id || '',
    fee_name: row.misc_fee__fee_name || '',
    standard_amount: row.standard_amount || '',
    fee_desc: row.fee_desc || ''
  }
}

const updateForwarderMiscFeeDisplay = (ffId) => {
  if (!ffId || !ffMiscFeeList.value.length) {
    const targetIndex = forwarderTableList.value.findIndex(item => Number(item.ff_id) === Number(ffId));
    if (targetIndex !== -1) {
      forwarderTableList.value[targetIndex] = {
        ...forwarderTableList.value[targetIndex],
        '货代杂费项目_收费': '无杂费配置',
        '总收费金额': 0
      };
    }
    return;
  }

  const miscFeeText = ffMiscFeeList.value.map(item => {
    const feeName = item.misc_fee__fee_name || '未知杂费';
    const feeAmount = toFixedNumber(item.standard_amount, 2);
    const feeDesc = item.fee_desc ? `（${item.fee_desc}）` : '';
    return `${feeName}：${feeAmount}元${feeDesc}`;
  }).join('；');

  const totalAmount = ffMiscFeeList.value.reduce((total, item) => {
    const amount = Number(item.standard_amount) || 0;
    return total + amount;
  }, 0);

  const targetIndex = forwarderTableList.value.findIndex(item => Number(item.ff_id) === Number(ffId));
  if (targetIndex !== -1) {
    forwarderTableList.value[targetIndex] = {
      ...forwarderTableList.value[targetIndex],
      '货代杂费项目_收费': miscFeeText,
      '总收费金额': totalAmount
    };
  }
};

// ========== 第二部分：货代报价模块 - 业务方法（核心修改：选中持久化） ==========
// 新增：加载当前选中货代的专属杂费
const loadFfCurrentMiscFeeList = async (ffId) => {
  if (!ffId || !$axios) return;
  ffCurrentMiscFeeLoading.value = true;
  try {
    const res = await $axios.get('/freight/ff-misc-fee/list/', { params: { ff_id: ffId } });
    if (res.success) {
      ffCurrentMiscFeeList.value = Array.isArray(res.data) ? res.data.map(item => ({
        ff_misc_id: item.ff_misc_id,
        fee_name: item.misc_fee__fee_name || '未知杂费',
        standard_amount: item.standard_amount || 0,
        fee_desc: item.fee_desc || ''
      })) : [];
    } else {
      ElMessage.error(res.message || '加载货代专属杂费失败');
      ffCurrentMiscFeeList.value = [];
    }
  } catch (error) {
    ElMessage.error('加载货代专属杂费失败（请求异常）');
    ffCurrentMiscFeeList.value = [];
  } finally {
    ffCurrentMiscFeeLoading.value = false;
  }
};

// 新增：处理货代选择变化
const handleFfChange = async (ffId) => {
  if (!ffId) {
    ffCurrentMiscFeeList.value = [];
    quoteMiscFeeList.value = [];
    updateMiscFeeTotal();
    return;
  }
  await loadFfCurrentMiscFeeList(ffId);
  // 清空原有未提交的杂费列表
  quoteMiscFeeList.value = [];
  updateMiscFeeTotal();
};

// 新增：更新杂费总金额
const updateMiscFeeTotal = () => {
  const total = quoteMiscFeeList.value.reduce((sum, item) => {
    const feeAmount = Number(item.actual_fee_amount) || 0;
    return sum + feeAmount;
  }, 0);
  selectedMiscFeeTotal.value = parseFloat(toFixedNumber(total, 2));
};

// 新增：处理杂费单元格变化
const handleMiscFeeCellChange = () => {
  updateMiscFeeTotal();
};

// 优化：加载货代下拉框数据源（确保可独立刷新，获取全量货代）
const loadForwarderSelectList = async () => {
  if (!$axios) return;
  try {
    const res = await $axios.get('/freight/forwarder/list/', {
      params: { page: 1, page_size: 10000 }
    });
    if (res.success === true) {
      const listData = Array.isArray(res.data?.data) ? res.data.data : [];
      forwarderSelectList.value = listData.map(item => {
        const formattedItem = { ...item };
        Object.keys(formattedItem).forEach(key => {
          // 关键：将None/null/undefined转为空字符串
          if (formattedItem[key] === 'None' || formattedItem[key] === null || formattedItem[key] === undefined) {
            formattedItem[key] = '';
          }
          if (typeof formattedItem[key] === 'string') {
            formattedItem[key] = formattedItem[key].trim();
          }
        });
        return formattedItem;
      });
    } else {
      ElMessage.error(`加载货代下拉框失败：${res.message || '未知错误'}`);
      forwarderSelectList.value = [];
    }
  } catch (error) {
    const errMsg = error.message || `加载货代下拉框失败：请求异常`;
    ElMessage.error(errMsg);
    forwarderSelectList.value = [];
  }
};

const loadContainerList = async () => {
  if (!$axios) return;
  try {
    const res = await $axios.get('/freight/container-spec/list/');
    if (res.success === true) {
      const listData = Array.isArray(res.data) ? res.data : [];
      containerList.value = listData;
    } else {
      ElMessage.error(`加载集装箱列表失败：${res.message || '未知错误'}`);
      containerList.value = [];
    }
  } catch (error) {
    const errMsg = error.message || `加载集装箱规格列表失败：请求异常`;
    ElMessage.error(errMsg);
    containerList.value = [];
  }
};

const loadGoodsList = async () => {
  if (!$axios) return;
  try {
    const res = await $axios.get('/freight/goods-spec/list/');
    if (res.success === true) {
      const listData = Array.isArray(res.data) ? res.data : [];
      goodsList.value = listData;
    } else {
      ElMessage.error(`加载货物列表失败：${res.message || '未知错误'}`);
      goodsList.value = [];
    }
  } catch (error) {
    const errMsg = error.message || `加载货物规格列表失败：请求异常`;
    ElMessage.error(errMsg);
    goodsList.value = [];
  }
};

const queryQuote = async () => {
  if (!$axios) return;
  quoteLoading.value = true;
  try {
    // 关键：参数名映射（驼峰 → 下划线）
    const params = {
      ff_id: quoteFilter.ff_id,
      export_port: quoteFilter.exportPort, // 驼峰exportPort → 下划线export_port
      destination_port: quoteFilter.destinationPort, // destinationPort → destination_port
      container_spec: quoteFilter.containerSpec, // containerSpec → container_spec
      goods_name: quoteFilter.goodsName, // goodsName → goods_name
      export_country: quoteFilter.exportCountry, // exportCountry → export_country
      start_date: quoteFilter.startDate, // startDate → start_date
      global_search: quoteFilter.globalSearch // globalSearch → global_search
    };

    // 过滤空值参数（保持原有逻辑）
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === undefined || params[key] === null) {
        delete params[key];
      }
    });

    const res = await $axios.get('/freight/freight-quote/list/', { params });
    if (res.success === true) {
      const quoteData = Array.isArray(res.data) ? res.data : [];
      quoteList.value = quoteData;
      quoteTotal.value = quoteData.length || 0;

      // 恢复选中状态（原有逻辑）
      nextTick(() => {
        const quoteTableRef = instance.proxy.$refs.quoteTableRef;
        if (quoteTableRef) {
          quoteList.value.forEach(row => {
            if (selectedAllQuoteRows.value.some(item => item.quote_id === row.quote_id)) {
              quoteTableRef.toggleRowSelection(row, true);
            }
          });
        }
      });
    } else {
      ElMessage.error(res.message || '查询报价列表失败');
      quoteList.value = [];
      quoteTotal.value = 0;
    }
  } catch (error) {
    const errMsg = error.message || `查询报价列表失败：请求异常`;
    ElMessage.error(errMsg);
    quoteList.value = [];
    quoteTotal.value = 0;
  } finally {
    quoteLoading.value = false;
  }
};


// 核心修改：报价选中事件 - 实现持久化
const handleQuoteSelection = (val) => {
  selectedQuoteRows.value = val || [];

  // 1. 获取当前页所有数据的ID
  const currentPageIds = quoteList.value.map(item => item.quote_id);

  // 2. 移除当前页中取消选中的项
  selectedAllQuoteRows.value = selectedAllQuoteRows.value.filter(
    globalItem => !currentPageIds.includes(globalItem.quote_id) ||
    val.some(currentItem => currentItem.quote_id === globalItem.quote_id)
  );

  // 3. 添加当前页中新选中的项
  val.forEach(currentItem => {
    if (!selectedAllQuoteRows.value.some(globalItem => globalItem.quote_id === currentItem.quote_id)) {
      selectedAllQuoteRows.value.push(currentItem);
    }
  });
};

const handleMiscFeeSelection = (val) => {
  selectedMiscFeeRows.value = val || [];
  updateMiscFeeTotal();
};

// 新增：处理货代专属杂费选择
const handleFfMiscFeeSelect = (val) => {
  selectedFfMiscFeeRows.value = val || [];
};

// 新增：打开货代专属杂费选择弹窗
const openQuoteMiscFeeSelectDialog = () => {
  if (!quoteForm.ff_id) {
    return ElMessage.warning('请先选择货代！');
  }
  if (ffCurrentMiscFeeList.value.length === 0) {
    return ElMessage.info('该货代暂无专属杂费配置，请先去「货代信息管理」模块配置');
  }
  selectedFfMiscFeeRows.value = [];
  quoteMiscFeeSelectDialogVisible.value = true;
  nextTick(() => {
    if (ffMiscFeeSelectTableRef.value) {
      ffMiscFeeSelectTableRef.value.clearSelection();
    }
  });
};

// 新增：确认选择货代专属杂费
const confirmFfMiscFeeSelect = () => {
  if (selectedFfMiscFeeRows.value.length === 0) {
    return ElMessage.warning('请选择要添加的杂费！');
  }
  // 去重添加
  selectedFfMiscFeeRows.value.forEach(ffMisc => {
    const isExisted = quoteMiscFeeList.value.some(item => item.ff_misc_id === ffMisc.ff_misc_id);
    if (!isExisted) {
      quoteMiscFeeList.value.push({
        ff_misc_id: ffMisc.ff_misc_id,
        fee_name: ffMisc.fee_name,
        standard_amount_snapshot: ffMisc.standard_amount,
        actual_fee_amount: ffMisc.standard_amount, // 默认与标准金额一致
        fee_desc_snapshot: ffMisc.fee_desc,
        remark: ''
      });
    }
  });
  updateMiscFeeTotal();
  quoteMiscFeeSelectDialogVisible.value = false;
  ElMessage.success(`成功添加${selectedFfMiscFeeRows.value.length}项杂费`);
};

// 核心修改：打开报价弹窗，适配杂费列表
const openQuoteDialog = (type, _row = {}) => {
  resetQuoteForm();
  if (type === 'add') {
    quoteDialogTitle.value = '新增货代报价';
    quoteDialogVisible.value = true;
  } else if (type === 'edit') {
    quoteDialogTitle.value = '编辑货代报价';
    quoteForm.quote_id = formatForwarderField(_row.quote_id) || '';
    quoteForm.ff_id = formatForwarderField(_row.ff_id || _row.freight_forwarder?.ff_id) || '';
    quoteForm.container_id = formatForwarderField(_row.container_id || _row.container?.container_id) || '';
    quoteForm.goods_id = formatForwarderField(_row.goods_id || _row.goods?.goods_id) || '';
    quoteForm.export_country = formatForwarderField(_row.export_country) || '';
    quoteForm.export_port = formatForwarderField(_row.export_port) || '';
    quoteForm.destination_port = formatForwarderField(_row.destination_port) || '';
    quoteForm.total_freight = _row.total_freight ? Number(_row.total_freight) : '';
    quoteForm.start_date = formatForwarderField(_row.start_date) || '';

    // 加载详情时适配数据
    viewQuoteDetail(_row.quote_id, false);
    quoteDialogVisible.value = true;
  }
};

const openContainerDialog = () => {
  resetContainerForm();
  containerDialogVisible.value = true;
};

const openGoodsDialog = () => {
  resetGoodsForm();
  goodsDialogVisible.value = true;
};

// 核心修改：查看报价详情，适配后端返回数据
const viewQuoteDetail = async (quoteId, isShowDetail = true) => {
  if (!$axios || !quoteId) {
    ElMessage.warning('参数无效，无法查看详情');
    return;
  }
  if (isShowDetail) {
    quoteDetailVisible.value = true;
  }
  quoteDetailLoading.value = true;

  try {
    const res = await $axios.get(`/freight/freight-quote/detail/${quoteId}/`);
    if (res.success) {
      quoteDetail.quote_info = res.data?.quote_info || {};
      quoteDetail.misc_fees = Array.isArray(res.data?.misc_fees) ? res.data.misc_fees : [];

      if (quoteForm.quote_id === quoteId) {
        const quoteInfo = quoteDetail.quote_info;
        quoteForm.quote_id = formatForwarderField(quoteInfo.quote_id) || '';
        quoteForm.ff_id = formatForwarderField(quoteInfo.ff_id || quoteInfo.freight_forwarder?.ff_id) || '';
        quoteForm.container_id = formatForwarderField(quoteInfo.container_id || quoteInfo.container?.container_id) || '';
        quoteForm.goods_id = formatForwarderField(quoteInfo.goods_id || quoteInfo.goods?.goods_id) || '';
        quoteForm.foreign_order_id = formatForwarderField(quoteInfo.foreign_order_id) || '';
        quoteForm.export_country = formatForwarderField(quoteInfo.export_country) || '';
        quoteForm.export_port = formatForwarderField(quoteInfo.export_port) || '';
        quoteForm.destination_port = formatForwarderField(quoteInfo.destination_port) || '';
        quoteForm.voyage = formatForwarderField(quoteInfo.voyage) || '';
        quoteForm.remark = formatForwarderField(quoteInfo.remark) || '';
        quoteForm.total_freight = quoteInfo.total_freight ? Number(quoteInfo.total_freight) : '';
        quoteForm.freight_per_kg = quoteInfo.freight_per_kg ? Number(quoteInfo.freight_per_kg) : '';
        quoteForm.start_date = formatForwarderField(quoteInfo.start_date) || '';
        quoteForm.latest_departure_date = formatForwarderField(quoteInfo.latest_departure_date) || '';

        // 核心修改：适配杂费数据，不再处理ff_misc_id
        quoteForm.misc_fees = quoteDetail.misc_fees.map(item => ({
          fee_name: item.fee_name || '未知杂费',
          standard_amount_snapshot: item.standard_amount_snapshot || 0,
          actual_fee_amount: item.actual_fee_amount || 0,
          fee_desc_snapshot: item.fee_desc_snapshot || '',
          remark: item.remark || ''
        })) || [];

        // 同步到本地杂费列表
        quoteMiscFeeList.value = [...quoteForm.misc_fees];
        nextTick(() => {
          updateMiscFeeTotal();
        });

        // 加载当前货代的专属杂费
        if (quoteForm.ff_id) {
          await loadFfCurrentMiscFeeList(quoteForm.ff_id);
        }
      }
    } else {
      ElMessage.error(res.message || '查询报价详情失败');
    }
  } catch (error) {
    const errMsg = error.message || '查询报价详情失败（请求异常）';
    ElMessage.error(errMsg);
  } finally {
    quoteDetailLoading.value = false;
  }
};

const submitContainerForm = async () => {
  if (!$axios) {
    ElMessage.error('系统初始化失败，无法提交表单');
    return;
  }
  if (!containerFormRef.value) return;

  try {
    await containerFormRef.value.validate();
  } catch (error) {
    return ElMessage.warning('请填写有效的表单数据（填写的数值字段需大于0）');
  }

  // 新增：过滤空值字段，仅提交有值的字段
  const submitData = {};
  Object.keys(containerForm).forEach(key => {
    const value = containerForm[key];
    // 排除空字符串、undefined、null，保留有效数值和字符串
    if (value !== '' && value !== undefined && value !== null) {
      submitData[key] = value;
    }
  });

  containerFormLoading.value = true;
  try {
    // 提交过滤后的submitData，而非原始containerForm
    const res = await $axios.post('/freight/container-spec/add/', submitData);
    if (res.success) {
      ElMessage.success('集装箱规格创建成功');
      containerDialogVisible.value = false;
      await loadContainerList();
    } else {
      ElMessage.error(res.message || '创建集装箱规格失败');
    }
  } catch (error) {
    const errMsg = error.message || '创建集装箱规格失败（请求异常）';
    ElMessage.error(errMsg);
  } finally {
    containerFormLoading.value = false;
  }
};

const submitGoodsForm = async () => {
  if (!$axios) {
    ElMessage.error('系统初始化失败，无法提交表单');
    return;
  }
  if (!goodsFormRef.value) return;

  try {
    await goodsFormRef.value.validate();
  } catch (error) {
    return ElMessage.warning('请填写有效的表单数据（数值字段需大于0）');
  }

  const submitData = {};
  Object.keys(goodsForm).forEach(key => {
    if (goodsForm[key] !== '' && goodsForm[key] !== undefined && goodsForm[key] !== null) {
      submitData[key] = goodsForm[key];
    }
  });

  goodsFormLoading.value = true;
  try {
    const res = await $axios.post('/freight/goods-spec/add/', submitData);
    if (res.success) {
      ElMessage.success('货物规格创建成功');
      goodsDialogVisible.value = false;
      await loadGoodsList();
    } else {
      ElMessage.error(res.message || '创建货物规格失败');
    }
  } catch (error) {
    const errMsg = error.message || '创建货物规格失败（请求异常）';
    ElMessage.error(errMsg);
  } finally {
    goodsFormLoading.value = false;
  }
};

// 核心修改：提交报价表单，适配杂费提交结构+下拉框刷新
const submitQuoteForm = async () => {
  if (!$axios) {
    ElMessage.error('系统初始化失败，无法提交表单');
    return;
  }
  if (!quoteFormRef.value) return;

  try {
    await quoteFormRef.value.validate();
  } catch (error) {
    return ElMessage.warning('请完善报价表单必填项');
  }

  quoteFormLoading.value = true;
  try {
    let res;
    const submitData = { ...quoteForm };

    submitData.misc_fees = quoteMiscFeeList.value.map(item => ({
      fee_name: item.fee_name || '',
      standard_amount: item.standard_amount_snapshot || 0,
      actual_fee_amount: item.actual_fee_amount || 0,
      fee_desc: item.fee_desc_snapshot || '',
      remark: item.remark || ''
    }));

    if (submitData.quote_id) {
      res = await $axios.post(`/freight/freight-quote/edit/${submitData.quote_id}/`, submitData);
    } else {
      res = await $axios.post('/freight/freight-quote/add/', submitData);
    }

    if (res.success || (res.data && res.data.success)) { // 兼容后端返回格式
      const successMsg = submitData.quote_id ? '报价修改成功' : '报价创建成功';
      ElMessage.success(successMsg);
      quoteDialogVisible.value = false;
      queryQuote();

      // 关键优化：等待弹窗关闭后，再刷新下拉框（避免数据未更新完成）
      nextTick(async () => {
        await loadFreightQuoteDropdownOptions();
      });
    } else {
      ElMessage.error(res.message || (submitData.quote_id ? '修改报价失败' : '创建报价失败'));
    }
  } catch (error) {
    const errMsg = error.message || (quoteForm.quote_id ? '修改报价失败（请求异常）' : '创建报价失败（请求异常）');
    ElMessage.error(errMsg);
  } finally {
    quoteFormLoading.value = false;
  }
};

const deleteQuote = async (quoteId) => {
  if (!$axios || !quoteId) {
    ElMessage.warning('参数无效，无法删除报价');
    return;
  }
  try {
    await ElMessageBox.confirm(
      '确定要删除该报价吗？删除后无法恢复',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    const res = await $axios.post(`/freight/freight-quote/delete/${quoteId}/`);
    if (res.success) {
      ElMessage.success('报价删除成功');

      // 核心新增：删除后从全局选中中移除
      selectedAllQuoteRows.value = selectedAllQuoteRows.value.filter(item => item.quote_id !== quoteId);

      queryQuote();
      await loadFreightQuoteDropdownOptions();
    } else {
      // 后端返回的业务错误（非关联数据，如报价不存在）
      const errMsg = res.message || '删除报价失败'
      await ElMessageBox.alert(errMsg, '操作提示', {
        type: 'warning',
        confirmButtonText: '确定'
      })
    }
  } catch (error) {
    if (error !== 'cancel') {
      const errMsg = error.response?.data?.message || error.message || '删除报价失败（请求异常）'
      const isBusinessError = errMsg.includes('无法删除')

      if (isBusinessError) {
        await ElMessageBox.alert(errMsg, '操作提示', {
          type: 'warning',
          confirmButtonText: '确定',
          closeOnClickModal: false
        })
      } else {
        await ElMessageBox.alert(`服务器故障：${errMsg}`, '操作失败', {
          type: 'error',
          confirmButtonText: '确定'
        })
      }
    }
  }
};

const batchDeleteQuote = async () => {
  if (!$axios) {
    ElMessage.error('系统初始化失败，无法执行批量删除');
    return;
  }
  if (selectedAllQuoteRows.value.length === 0) {
    return ElMessage.warning('请先选择要删除的报价');
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedAllQuoteRows.value.length} 条报价吗？删除后无法恢复`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    const deletePromises = selectedAllQuoteRows.value.map(row =>
      $axios.post(`/freight/freight-quote/delete/${row.quote_id}/`)
    );

    const results = await Promise.allSettled(deletePromises);
    const failCount = results.filter(result => result.status === 'rejected').length;

    if (failCount === 0) {
      ElMessage.success('批量删除报价成功');
    } else {
      ElMessage.warning(`批量删除完成，其中${failCount}条报价删除失败`);
    }

    // 核心新增：批量删除后清空全局选中
    selectedAllQuoteRows.value = [];

    queryQuote();
    // 核心新增：批量删除报价后，刷新下拉框选项
    await loadFreightQuoteDropdownOptions();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除报价失败（请求异常）');
    }
  }
};

const resetQuoteFilter = () => {
  quoteFilter.globalSearch = '';
  quoteFilter.containerSpec = '';
  quoteFilter.goodsName = '';
  quoteFilter.exportCountry = '';
  quoteFilter.exportPort = '';
  quoteFilter.destinationPort = '';
  quoteFilter.startDate = '';
  quoteFilter.ff_id = '';
  quoteFilter.foreign_order_id = '';
  quoteCurrentPage.value = 1;

  // 核心新增：重置筛选时清空全局选中
  selectedAllQuoteRows.value = [];

  queryQuote();
};

// 核心修改：重置报价表单，适配杂费列表
const resetQuoteForm = () => {
  quoteForm.quote_id = '';
  quoteForm.foreign_order_id = '';
  quoteForm.ff_id = '';
  quoteForm.container_id = '';
  quoteForm.goods_id = '';
  quoteForm.export_country = '';
  quoteForm.export_port = '';
  quoteForm.destination_port = '';
  quoteForm.start_date = '';
  quoteForm.latest_departure_date = '';
  quoteForm.voyage = '';
  quoteForm.total_freight = '';
  quoteForm.freight_per_kg = '';
  quoteForm.remark = '';
  quoteForm.misc_fees = [];

  quoteMiscFeeList.value = [];
  selectedMiscFeeRows.value = [];
  selectedMiscFeeTotal.value = 0;
  ffCurrentMiscFeeList.value = [];
  selectedFfMiscFeeRows.value = [];

  if (quoteFormRef.value) {
    quoteFormRef.value.resetFields();
  }
};

// 新增：重置货代专属杂费选择表单
const resetQuoteMiscFeeSelectForm = () => {
  selectedFfMiscFeeRows.value = [];
  nextTick(() => {
    if (ffMiscFeeSelectTableRef.value) {
      ffMiscFeeSelectTableRef.value.clearSelection();
    }
  });
};

const resetContainerForm = () => {
  containerForm.length_cm = '';
  containerForm.width_cm = '';
  containerForm.height_cm = '';
  containerForm.actual_volume = '';
  containerForm.max_load_kg = '';
  containerForm.spec_desc = '';

  if (containerFormRef.value) {
    containerFormRef.value.resetFields();
  }
};

const resetGoodsForm = () => {
  goodsForm.goods_name = '';
  goodsForm.spec_desc = '';
  goodsForm.length_cm = '';
  goodsForm.width_cm = '';
  goodsForm.height_cm = '';
  goodsForm.volume_per_unit = '';
  goodsForm.weight_per_unit = '';

  if (goodsFormRef.value) {
    goodsFormRef.value.resetFields();
  }
};

// 核心修改：监听货代选择变化，清空本地杂费列表
watch(() => quoteForm.ff_id, (newFfId) => {
  if (!newFfId) {
    quoteMiscFeeList.value = [];
    selectedMiscFeeRows.value = [];
    selectedMiscFeeTotal.value = 0;
    ffCurrentMiscFeeList.value = [];
  }
}, { immediate: false, deep: false });

// ========== 生命周期（合并初始化逻辑+新增下拉框加载） ==========
onMounted(async () => {
  if (!$axios) {
    ElMessage.warning('系统初始化失败，部分数据无法加载，请刷新页面重试');
    return;
  }
  // 并行加载所有初始化数据（核心新增：加入下拉框选项加载）
  await Promise.all([
    // 货代信息模块
    loadForwarderTableList(),
    // 报价模块
    loadForwarderSelectList(),
    loadContainerList(),
    loadGoodsList(),
    queryQuote(),
    // 核心新增：初始化加载出口国家/出口港/目的港下拉框
    loadFreightQuoteDropdownOptions()
  ]);
});

// 组件卸载时：恢复原始 ResizeObserver + 清理所有残留实例
onUnmounted(() => {
  // 恢复原始 ResizeObserver（避免影响其他组件/页面）
  if (OriginalResizeObserver && window.ResizeObserver._patched) {
    window.ResizeObserver = OriginalResizeObserver;
    delete window.ResizeObserver._patched;
  }

  // 清理所有残留的 PatchedResizeObserver 实例
  resizeObserverInstances.forEach(observer => {
    try {
      observer.disconnect();
    } catch (e) { /* 忽略已销毁的实例 */ }
  });
  resizeObserverInstances.clear();
});

// ========== 暴露方法 ==========
defineExpose({
  loadForwarderTableList,
  queryQuote,
  loadFreightQuoteDropdownOptions
});
</script>


<style scoped>
/* 基础重置 & 全局变量 */
.freight-container {
  --primary-color: #4CAF50;
  --primary-hover: #388E3C;
  --danger-color: #f44336;
  --danger-hover: #d32f2f;
  --text-primary: #333;
  --text-secondary: #666;
  --bg-page: #f8f8f8;
  --bg-card: #ffffff;
  --bg-light: #fafafa;
  --border-primary: #eee;
  --border-secondary: #ddd;
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --font-xs: 12px;
  --font-sm: 13px;
  --font-md: 14px;
  --font-lg: 17px;
  --font-xl: 19px;

  padding: var(--spacing-lg);
  background: var(--bg-page);
  min-height: 100vh;
  box-sizing: border-box;
  font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
}

/* 模块容器 */
.tab-content {
  background: var(--bg-card);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-primary);
  box-shadow: 0 2px 6px rgba(76, 175, 80, 0.08);
  margin-bottom: var(--spacing-lg);
  box-sizing: border-box;
}

/* 模块标题 */
.module-title {
  font-size: var(--font-xl);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-lg);
  line-height: 1.4;
  position: relative;
  padding-bottom: 12px;
}

.module-title::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: 0;
  width: 48px;
  height: 3px;
  background: var(--primary-color);
  border-radius: 2px;
}

/* 查询表单核心样式 - 解决布局混乱 */
.search-form {
  background: var(--bg-light);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-primary);
  padding: var(--spacing-md) var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  box-sizing: border-box;
}

/* 表单行布局 */
.demo-form-inline {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  box-sizing: border-box;
}

/* 报价查询表单专属样式（优化两行布局） */
:deep(.demo-form-inline) {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px; /* 两行之间的间距 */
}

/* 统一所有表单项的标签宽度（70px），确保对齐 */
:deep(.demo-form-inline .el-form-item__label) {
  width: 70px !important;
  text-align: right;
  padding-right: 8px;
  flex-shrink: 0; /* 防止标签被挤压 */
  margin-bottom: 0; /* 消除默认底部间距 */
}

/* 表单项内容区占满剩余宽度 */
:deep(.demo-form-inline .el-form-item__content) {
  margin-left: 0 !important;
  flex: 1;
}

/* 所有控件宽度100%，移除最小宽度限制，避免挤压 */
:deep(.demo-form-inline .el-input),
:deep(.demo-form-inline .el-select),
:deep(.demo-form-inline .el-date-picker) {
  width: 100% !important;
  min-width: unset !important;
}

/* 栅格列内边距统一，避免间距错乱 */
:deep(.demo-form-inline .el-col) {
  padding: 0 10px;
}

/* 按钮列特殊处理：无标签，直接居中 */
:deep(.demo-form-inline .el-col:last-child .el-form-item) {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 40px; /* 与控件高度一致，保证垂直对齐 */
}

/* 输入框/下拉框样式 */
:deep(.el-input__wrapper),
:deep(.el-select__wrapper) {
  height: 40px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-primary);
  background: var(--bg-card);
  box-sizing: border-box;
  transition: all 0.3s ease;
}

/* 聚焦样式 */
:deep(.el-input__wrapper.is-focus),
:deep(.el-select__wrapper.is-focus) {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

/* 表格操作栏 */
.table-actions {
  margin-bottom: var(--spacing-md);
  display: flex;
  gap: var(--spacing-sm);
}

/* 表格统一样式 */
:deep(.el-table) {
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  overflow: hidden;
  --el-table-border-color: var(--border-primary);
  --el-table-row-hover-bg-color: #f9f9f9;
  --el-table-stripe-bg-color: #fafafa;
}

/* 表格单元格 */
:deep(.el-table__cell) {
  padding: 16px var(--spacing-sm);
  border-right: 1px solid var(--border-primary);
  border-bottom: 1px solid var(--border-primary);
  font-size: var(--font-sm);
  color: var(--text-primary);
  box-sizing: border-box;
}

/* 表格头部 */
:deep(.el-table__header-cell) {
  background: var(--bg-light);
  font-weight: 500;
  padding: 16px var(--spacing-sm);
  font-size: var(--font-sm);
}

/* 操作列按钮组 */
.operate-btn-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  width: 100%;
  box-sizing: border-box;
}

/* 统一按钮样式 */
:deep(.el-button) {
  height: 32px;
  padding: 0 12px;
  border-radius: var(--radius-sm);
  font-size: var(--font-sm);
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

/* 主按钮 */
:deep(.el-button--primary) {
  background: var(--primary-color);
  color: white;
}

:deep(.el-button--primary:hover) {
  background: var(--primary-hover);
}

/* 危险按钮 */
:deep(.el-button--danger) {
  background: var(--danger-color);
  color: white;
}

:deep(.el-button--danger:hover) {
  background: var(--danger-hover);
}

/* 次要按钮 */
:deep(.el-button--default) {
  background: #f5f5f5;
  color: var(--text-secondary);
  border: 1px solid var(--border-secondary);
}

/* 分页样式 */
:deep(.el-pagination) {
  margin-top: var(--spacing-md);
  text-align: right;
  font-size: var(--font-sm);
}

:deep(.el-pagination__active) {
  background: var(--primary-color);
  color: white;
}

/* 弹窗样式 */
:deep(.el-dialog) {
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-primary);
  box-shadow: 0 4px 16px rgba(76, 175, 80, 0.12);
  overflow: hidden;
}

:deep(.el-dialog__header) {
  background: var(--bg-light);
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--border-primary);
}

:deep(.el-dialog__title) {
  font-size: var(--font-lg);
  font-weight: 600;
  color: var(--text-primary);
}

:deep(.el-dialog__body) {
  padding: var(--spacing-lg);
  max-height: 75vh;
  overflow-y: auto;
  box-sizing: border-box;
}

:deep(.el-dialog__footer) {
  padding: var(--spacing-md) var(--spacing-lg);
  border-top: 1px solid var(--border-primary);
  background: var(--bg-light);
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
}

/* 杂费表单样式 */
:deep(.ff-misc-fee-form) {
  width: 100%;
  box-sizing: border-box;
}

:deep(.ff-misc-fee-form .el-form-item) {
  margin-bottom: var(--spacing-md);
}

/* 集装箱/货物表单样式 */
.container-select-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  width: 100%;
}

.add-btn {
  width: 68px;
  height: 32px;
  padding: 0 12px;
  font-size: var(--font-sm);
}

/* 杂费头部 */
.misc-fee-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--border-primary);
}

.misc-fee-total {
  font-size: var(--font-md);
  font-weight: 600;
  color: var(--danger-color);
}

/* 响应式适配 */
@media (max-width: 1200px) {
  :deep(.demo-form-inline .el-row) {
    flex-wrap: wrap;
  }

  :deep(.demo-form-inline .el-form-item) {
    min-width: 200px;
  }
}

@media (max-width: 768px) {
  .freight-container {
    padding: var(--spacing-md);
  }

  .tab-content {
    padding: var(--spacing-md);
  }

  :deep(.el-dialog) {
    width: 96% !important;
  }

  .operate-btn-group {
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .demo-form-inline {
    gap: var(--spacing-sm);
  }

  :deep(.demo-form-inline .el-form-item__label) {
    width: 70px;
    padding-right: var(--spacing-xs);
  }

  :deep(.el-button) {
    padding: 0 8px;
    font-size: var(--font-xs);
  }
}
/* ========== 货代信息管理搜索表单专属样式（新增） ========== */
.forwarder-search-container {
  background: var(--bg-light);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-primary);
  padding: var(--spacing-md) var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  box-sizing: border-box;
}
/* 报价表格滚动容器（新增） */
.quote-table-container {
  max-height: 800px; /* 可根据需求调整高度 */
  overflow-y: auto;
  margin-bottom: 16px;
}
/* 强制inline布局一行显示，隔离报价表单样式 */
:deep(.forwarder-search-form) {
  display: flex;
  align-items: center;
  gap: 16px; /* 表单项间距，可按需调整 */
  flex-wrap: nowrap; /* 桌面端强制一行 */
  width: 100%;
}

:deep(.forwarder-search-form .el-form-item) {
  margin: 0; /* 清除默认间距 */
  display: flex;
  align-items: center;
}

:deep(.forwarder-search-form .el-form-item__label) {
  width: auto; /* 标签自适应宽度 */
  margin-right: 8px;
  white-space: nowrap;
}

:deep(.forwarder-search-form .el-form-item__content) {
  margin-left: 0; /* 清除默认间距 */
}

/* 小屏幕适配：自动换行，不挤压布局 */
@media (max-width: 768px) {
  :deep(.forwarder-search-form) {
    flex-wrap: wrap;
  }
  :deep(.forwarder-search-form .el-input) {
    width: 100% !important; /* 移动端输入框占满行 */
  }
}
</style>