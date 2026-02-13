<template>
  <div class="customer-management-container">
    <!-- 顶部筛选栏 -->
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="客户名称">
          <el-input
            v-model="searchForm.name"
            placeholder="请输入客户名称"
            clearable
            @keyup.enter="getCustomerList"
          />
        </el-form-item>
        <el-form-item label="客户等级">
          <el-select
            v-model="searchForm.level"
            placeholder="请选择客户等级"
            class="customer-level-select"
            clearable
            style="width: 320px;"
          >
            <el-option
              v-for="item in customerLevelOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getCustomerList">查询</el-button>
          <el-button @click="resetSearchForm">重置</el-button>
          <el-button type="success" @click="downloadCustomerExcel">导出Excel</el-button>
        </el-form-item>
      </el-form>

      <el-button type="primary" icon="el-icon-plus" @click="openCustomerDialog('add')">
        新增客户
      </el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="customerList"
      border
      stripe
      style="width: 100%; margin-top: 10px"
      @row-dblclick="handleRowDblClick"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" align="center" width="55" />
      <el-table-column prop="name" label="客户名称" min-width="120" />
      <el-table-column prop="gender" label="性别" width="80" align="center" />
      <el-table-column prop="country" label="国家/地区" min-width="100" />
      <el-table-column prop="phone" label="联系电话" min-width="120" />
      <el-table-column prop="email" label="电子邮箱" min-width="150" />
      <el-table-column prop="company" label="公司名称" min-width="150" />
      <el-table-column
        prop="level"
        label="客户等级"
        min-width="80"
        align="center"
      >
        <template #default="scope">
          <el-tooltip
            :content="getCustomerLevelLabel(scope.row.level)"
            placement="top"
            effect="dark"
            enterable
          >
            <span>{{ getShortCustomerLevelLabel(scope.row.level) }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column prop="salesman_name" label="负责业务员" width="120" align="center" />
      <el-table-column prop="create_time" label="创建时间" width="180" align="center" />
      <el-table-column label="操作" width="400" align="center">
        <template #default="scope">
          <div class="operation-buttons">
            <el-button size="small" type="primary" @click="openCustomerDialog('edit', scope.row)">
              编辑
            </el-button>
            <el-button size="small" type="warning" @click="openCustomerDetail(scope.row)">
              详情
            </el-button>
            <el-button size="small" type="info" @click="openFollowTab(scope.row)">
              跟进记录
            </el-button>
            <el-button size="small" type="success" @click="openQuoteTab(scope.row)">
              报价记录
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="handleDeleteCustomer(scope.row.customer_id)"
              v-if="isSuperAdmin"
            >
              删除
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="currentPage"
      :page-sizes="[10, 20, 50, 100]"
      :page-size="pageSize"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      style="margin-top: 10px; text-align: right"
      v-if="total > 0"
    >
    </el-pagination>

    <!-- 客户新增/编辑弹窗 -->
    <el-dialog
      v-model="customerDialogVisible"
      :title="customerDialogTitle"
      width="800px"
      @close="resetCustomerForm"
    >
      <el-form
        ref="customerFormRef"
        :model="customerForm"
        :rules="customerFormRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="客户名称" prop="name">
              <el-input v-model="customerForm.name" placeholder="请输入客户名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="性别" prop="gender">
              <el-select v-model="customerForm.gender" placeholder="请选择性别">
                <el-option label="男" value="男" />
                <el-option label="女" value="女" />
                <el-option label="未知" value="未知" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="国家/地区" prop="country">
              <el-input v-model="customerForm.country" placeholder="请输入国家/地区" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="customerForm.phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="电子邮箱" prop="email">
              <el-input v-model="customerForm.email" placeholder="请输入电子邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户来源" prop="source">
              <el-input v-model="customerForm.source" placeholder="请输入客户来源" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="公司名称" prop="company">
              <el-input v-model="customerForm.company" placeholder="请输入公司名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户等级" prop="level">
              <!-- 核心修改1：添加专属类名，用于样式控制换行 -->
              <el-select
                v-model="customerForm.level"
                placeholder="请选择客户等级"
                class="customer-level-dialog-select"
                style="width: 100%;"
              >
                <el-option
                  v-for="item in customerLevelOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="负责业务员" prop="salesman_id">
              <el-select v-model="customerForm.salesman_id" placeholder="请选择业务员" filterable>
                <el-option
                  v-for="item in salesmanList"
                  :key="item.user_id"
                  :label="item.username"
                  :value="item.user_id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="操作人" prop="operator">
              <el-input v-model="operatorName" disabled placeholder="当前登录用户" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="详细地址" prop="address">
          <el-input
            v-model="customerForm.address"
            type="textarea"
            :rows="3"
            placeholder="请输入详细地址"
          />
        </el-form-item>
        <el-form-item label="备注信息" prop="remark">
          <el-input
            v-model="customerForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      <!-- 核心修改2：弹窗底部按钮容器，确保同行 -->
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="customerDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitCustomerForm">确认</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 客户详情弹窗 -->
    <el-dialog v-model="customerDetailVisible" title="客户详情" width="800px">
      <el-descriptions :column="2" border fill>
        <el-descriptions-item label="客户ID">{{ customerDetail.customer_id || '-' }}</el-descriptions-item>
        <el-descriptions-item label="客户名称">{{ customerDetail.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="性别">{{ customerDetail.gender || '未知' }}</el-descriptions-item>
        <el-descriptions-item label="国家/地区">{{ customerDetail.country || '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ customerDetail.phone || '无' }}</el-descriptions-item>
        <el-descriptions-item label="电子邮箱">{{ customerDetail.email || '无' }}</el-descriptions-item>
        <el-descriptions-item label="客户来源">{{ customerDetail.source || '无' }}</el-descriptions-item>
        <el-descriptions-item label="公司名称">{{ customerDetail.company || '无' }}</el-descriptions-item>
        <el-descriptions-item label="详细地址">{{ customerDetail.address || '无' }}</el-descriptions-item>
        <el-descriptions-item label="客户等级" :span="1">
          <el-tooltip
            :content="getCustomerLevelLabel(customerDetail.level)"
            placement="top"
            effect="dark"
          >
            <span>{{ getShortCustomerLevelLabel(customerDetail.level) }}</span>
          </el-tooltip>
        </el-descriptions-item>
        <el-descriptions-item label="负责业务员">
          {{ customerDetail.salesman_name || '无' }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ customerDetail.create_time || '-' }}</el-descriptions-item>
        <el-descriptions-item label="最后修改时间">{{ customerDetail.update_time || '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ customerDetail.operator_name || '无' }}</el-descriptions-item>
        <el-descriptions-item label="备注信息" :span="2">
          {{ customerDetail.remark || '无' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 跟进记录弹窗 - 调整为小尺寸，不超过客户管理页面 -->
    <el-dialog
      v-model="followDialogVisible"
      :title="`客户跟进记录（${currentCustomerInfo.name || ''}）`"
      width="800px"
      class="follow-record-dialog"
      fullscreen="false"
      @close="resetFollowSearchForm"
    >
      <!-- 1. 客户核心信息概览，适配小弹窗 -->
      <div class="follow-customer-overview">
        <el-card shadow="hover" class="overview-card">
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="客户ID">{{ currentCustomerInfo.customer_id || '-' }}</el-descriptions-item>
            <el-descriptions-item label="客户名称">{{ currentCustomerInfo.name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="客户等级">
              <el-tooltip
                :content="getCustomerLevelLabel(currentCustomerInfo.level)"
                placement="top"
                effect="dark"
              >
                <span>{{ getShortCustomerLevelLabel(currentCustomerInfo.level) }}</span>
              </el-tooltip>
            </el-descriptions-item>
            <el-descriptions-item label="负责业务员">{{ currentCustomerInfo.salesman_name || '无' }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ currentCustomerInfo.phone || '无' }}</el-descriptions-item>
            <el-descriptions-item label="电子邮箱">{{ currentCustomerInfo.email || '无' }}</el-descriptions-item>
            <el-descriptions-item label="公司名称">{{ currentCustomerInfo.company || '无' }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ currentCustomerInfo.create_time || '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </div>

      <!-- 2. 顶部操作+筛选栏，适配小弹窗换行 -->
      <div class="follow-top-bar">
        <div class="follow-operation">
          <el-button type="primary" icon="el-icon-plus" size="small" @click="openFollowDialog('add')">
            新增跟进记录
          </el-button>
          <el-button type="success" icon="el-icon-download" size="small" @click="downloadFollowExcel">
            导出跟进记录
          </el-button>
        </div>
        <el-form :inline="true" :model="followSearchForm" class="follow-search-form" size="small">
          <el-form-item label="跟进日期">
            <el-date-picker
              v-model="followSearchForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              style="width: 180px"
              size="small"
            />
          </el-form-item>
          <el-form-item label="跟进类型">
            <el-select
              v-model="followSearchForm.followType"
              placeholder="请选择"
              clearable
              style="width: 120px"
              size="small"
            >
              <el-option
                v-for="item in followTypeOptions"
                :key="item.code"
                :label="item.name"
                :value="item.code"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="跟进内容">
            <el-input
              v-model="followSearchForm.content"
              placeholder="关键词搜索"
              clearable
              style="width: 150px"
              @keyup.enter="getCustomerFollowList"
              size="small"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="getCustomerFollowList" size="small">查询</el-button>
            <el-button @click="resetFollowSearchForm" size="small">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 3. 表格包裹容器，适配小弹窗滚动 -->
      <div class="follow-table-wrapper">
        <el-table
          v-loading="followLoading"
          :data="followList"
          border
          stripe
          style="width: 100%;"
          highlight-current-row
          @row-dblclick="handleFollowRowDblClick"
          size="small"
        >
          <el-table-column prop="follow_id" label="记录ID" width="70" align="center" />
          <el-table-column prop="follow_date" label="跟进日期" width="100" align="center" />
          <el-table-column
            prop="follow_type"
            label="跟进类型"
            width="100"
            align="center"
          >
            <template #default="scope">
              <el-tag :type="getFollowTypeTagType(scope.row.follow_type)" size="small">
                {{ getFollowTypeLabel(scope.row.follow_type) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="content" label="跟进内容" min-width="200" align="left">
            <template #default="scope">
              <div class="follow-content-wrapper">
                {{ scope.row.content || '无详细内容' }}
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="recorder_name" label="记录人" width="80" align="center" />
          <el-table-column prop="create_time" label="创建时间" width="150" align="center" />
          <el-table-column label="操作" width="120" align="center">
            <template #default="scope">
              <div class="operation-buttons">
                <el-button size="mini" type="primary" @click="openFollowDialog('edit', scope.row)">
                  编辑
                </el-button>
                <el-button
                  size="mini"
                  type="danger"
                  @click="handleDeleteFollow(scope.row.follow_id)"
                >
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 4. 跟进记录分页，适配小弹窗 -->
      <div class="follow-pagination">
        <el-pagination
          @size-change="handleFollowSizeChange"
          @current-change="handleFollowCurrentChange"
          :current-page="followCurrentPage"
          :page-sizes="[10, 20, 50]"
          :page-size="followPageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="followTotal"
          style="text-align: right"
          v-if="followTotal > 0"
          size="small"
        >
        </el-pagination>
      </div>

      <!-- 跟进记录新增/编辑弹窗，适配小尺寸 -->
      <el-dialog
        v-model="followFormVisible"
        :title="followFormTitle"
        width="600px"
        @close="resetFollowForm"
        size="small"
      >
        <el-form
          ref="followFormRef"
          :model="followForm"
          :rules="followFormRules"
          label-width="100px"
          class="follow-form"
          size="small"
        >
          <el-form-item label="跟进日期" prop="follow_date">
            <el-date-picker
              v-model="followForm.follow_date"
              type="date"
              placeholder="请选择跟进日期"
              style="width: 100%"
              value-format="YYYY-MM-DD"
              size="small"
            />
          </el-form-item>
          <el-form-item label="跟进类型" prop="follow_type">
            <el-select v-model="followForm.follow_type" placeholder="请选择跟进类型" filterable style="width: 100%" size="small">
              <el-option
                v-for="item in followTypeOptions"
                :key="item.code"
                :label="item.name"
                :value="item.code"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="跟进内容" prop="content">
            <el-input
              v-model="followForm.content"
              type="textarea"
              :rows="6"
              placeholder="请详细输入跟进内容（包括沟通结果、后续计划等）"
              resize="vertical"
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="followFormVisible = false" size="small">取消</el-button>
            <el-button type="primary" @click="submitFollowForm" size="small">确认</el-button>
          </div>
        </template>
      </el-dialog>
    </el-dialog>

    <!-- 报价记录标签页弹窗 -->
    <el-dialog v-model="quoteDialogVisible" title="客户报价记录" width="1000px">
      <div class="quote-header">
        <el-button type="primary" icon="el-icon-plus" @click="openQuoteDialog('add')">
          新增报价记录
        </el-button>
      </div>
      <el-table
        v-loading="quoteLoading"
        :data="quoteList"
        border
        stripe
        style="width: 100%; margin-top: 10px"
      >
        <el-table-column prop="quote_id" label="报价ID" width="80" align="center" />
        <el-table-column prop="quote_date" label="报价日期" width="120" align="center" />
        <el-table-column prop="calc_id" label="计算ID" width="80" align="center" />
        <el-table-column
          prop="status"
          label="报价状态"
          width="100"
          align="center"
        >
          <template #default="scope">
            <el-tag
              :type="scope.row.status === 'quoted' ? 'primary' : scope.row.status === 'confirmed' ? 'success' : 'danger'"
            >
              {{ getQuoteStatusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="manual_freight_per_kg"
          label="手动海运费(元/KG)"
          width="150"
          align="center"
        >
          <template #default="scope">
            {{ scope.row.manual_freight_per_kg || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="freight_forwarder_quote_id" label="货代报价ID" width="120" align="center">
          <template #default="scope">
            {{ scope.row.freight_forwarder_quote_id || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="creator_name" label="创建人" width="120" align="center" />
        <el-table-column prop="create_time" label="创建时间" width="180" align="center" />
        <el-table-column label="操作" width="400" align="center">
          <template #default="scope">
            <div class="operation-buttons">
              <el-button size="small" type="primary" @click="openQuoteDialog('edit', scope.row)">
                编辑
              </el-button>
              <el-button
                size="small"
                type="success"
                @click="handleChangeQuoteStatus(scope.row.quote_id, 'confirmed')"
                v-if="scope.row.status === 'quoted'"
              >
                确认报价
              </el-button>
              <el-button
                size="small"
                type="danger"
                @click="handleChangeQuoteStatus(scope.row.quote_id, 'invalid')"
                v-if="scope.row.status !== 'invalid'"
              >
                作废报价
              </el-button>
              <el-button
                size="small"
                type="info"
                @click="downloadQuoteFile(scope.row.quote_id)"
                v-if="scope.row.quote_file_path"
              >
                下载报价单
              </el-button>
              <el-button
                size="small"
                type="warning"
                @click="viewQuoteCalculation(scope.row.quote_id)"
              >
                查看计算明细
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 报价记录新增/编辑弹窗 -->
      <el-dialog
        v-model="quoteFormVisible"
        :title="quoteFormTitle"
        width="700px"
        @close="resetQuoteForm"
      >
        <el-form
          ref="quoteFormRef"
          :model="quoteForm"
          :rules="quoteFormRules"
          label-width="120px"
        >
          <el-form-item label="计算ID" prop="calc_id">
            <el-input v-model.number="quoteForm.calc_id" placeholder="请输入关联计算ID" />
          </el-form-item>
          <el-form-item label="报价日期" prop="quote_date">
            <el-date-picker
              v-model="quoteForm.quote_date"
              type="date"
              placeholder="请选择报价日期"
              style="width: 100%"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
          <el-form-item label="海运费类型" prop="freight_type">
            <el-radio-group v-model="quoteForm.freight_type" @change="handleFreightTypeChange">
              <el-radio label="manual">手动输入海运费</el-radio>
              <el-radio label="forwarder">货代报价ID</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item
            label="手动每KG海运费"
            prop="manual_freight_per_kg"
            v-if="quoteForm.freight_type === 'manual'"
          >
            <el-input
              v-model.number="quoteForm.manual_freight_per_kg"
              type="number"
              placeholder="请输入手动每KG海运费"
              min="0"
              step="0.01"
              precision="2"
            />
          </el-form-item>
          <el-form-item
            label="货代报价ID"
            prop="freight_forwarder_quote_id"
            v-if="quoteForm.freight_type === 'forwarder'"
          >
            <el-input
              v-model="quoteForm.freight_forwarder_quote_id"
              placeholder="请输入货代报价ID"
            />
          </el-form-item>
          <el-form-item label="报价单路径" prop="quote_file_path">
            <el-input v-model="quoteForm.quote_file_path" placeholder="请输入报价单存储路径" />
          </el-form-item>
          <el-form-item label="报价状态" prop="status" v-if="quoteFormType === 'edit'">
            <el-select v-model="quoteForm.status" placeholder="请选择报价状态">
              <el-option
                v-for="item in quoteStatusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-form>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="quoteFormVisible = false">取消</el-button>
            <el-button type="primary" @click="submitQuoteForm">确认</el-button>
          </div>
        </template>
      </el-dialog>

      <!-- 报价计算明细弹窗 -->
      <el-dialog v-model="quoteCalculationVisible" title="报价计算明细" width="700px">
        <el-descriptions :column="2" border fill v-if="quoteCalculationDetail">
          <el-descriptions-item label="报价ID">{{ quoteCalculationDetail.quote_info.quote_id }}</el-descriptions-item>
          <el-descriptions-item label="客户名称">{{ quoteCalculationDetail.quote_info.customer_name }}</el-descriptions-item>
          <el-descriptions-item label="报价日期">{{ quoteCalculationDetail.quote_info.quote_date }}</el-descriptions-item>
          <el-descriptions-item label="报价状态">
            {{ getQuoteStatusLabel(quoteCalculationDetail.quote_info.status) }}
          </el-descriptions-item>
          <el-descriptions-item label="计算ID">{{ quoteCalculationDetail.calculation_detail.calc_id }}</el-descriptions-item>
          <el-descriptions-item label="计算结果">{{ quoteCalculationDetail.calculation_detail.calc_result || '无' }}</el-descriptions-item>
          <el-descriptions-item label="计算日期">{{ quoteCalculationDetail.calculation_detail.calc_date || '无' }}</el-descriptions-item>
          <el-descriptions-item label="计算人">{{ quoteCalculationDetail.calculation_detail.calculator_name || '无' }}</el-descriptions-item>
          <el-descriptions-item label="计算明细" :span="2">
            {{ quoteCalculationDetail.calculation_detail.calc_detail || '无' }}
          </el-descriptions-item>
        </el-descriptions>
        <div v-else class="empty-tip">暂无计算明细数据</div>
      </el-dialog>
    </el-dialog>
  </div>
</template>

<style scoped>
/* 全局容器 */
.customer-management-container {
  padding: 20px;
  background: #f8f8f8;
  min-height: 100vh;
  box-sizing: border-box;
  /* 限制容器最大宽度，防止页面过宽 */
  max-width: 100vw;
  overflow-x: hidden;
}

/* 卡片样式 */
.form-card, .table-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  padding: 20px;
  margin-bottom: 20px;
  box-sizing: border-box;
}

/* 顶部筛选+新增按钮 布局 */
.search-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
  flex-wrap: wrap;
  gap: 10px;
}
.search-form {
  flex: 1;
  min-width: 600px;
}

/* 所有输入框高度统一为36px */
:deep(.el-input__wrapper), :deep(.el-select__wrapper), :deep(.el-date-editor) {
  height: 36px !important;
  border-radius: 4px;
  box-sizing: border-box;
}
:deep(.el-input__inner), :deep(.el-select__placeholder), :deep(.el-date-editor .el-input__inner) {
  line-height: 36px !important;
  height: 36px !important;
}

/* 操作按钮容器样式，确保按钮同一行 */
.operation-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

/* 客户等级下拉框（筛选栏）优化 */
:deep(.customer-level-select .el-select__popper) {
  min-width: 320px !important;
}
:deep(.el-select-dropdown__item) {
  white-space: normal !important;
  line-height: 1.4 !important;
  padding: 8px 16px !important;
}

/* 核心修改3：弹窗内客户等级下拉框 - 支持换行显示 */
:deep(.customer-level-dialog-select .el-select__popper) {
  min-width: 100% !important;
  width: max-content !important;
  max-width: 400px; /* 限制最大宽度，避免过宽 */
}
:deep(.customer-level-dialog-select .el-select-dropdown__item) {
  white-space: normal !important; /* 允许换行 */
  line-height: 1.5 !important;
  padding: 10px 16px !important;
  word-wrap: break-word; /* 长文本换行 */
  word-break: break-all;
}

/* 核心修改4：弹窗底部按钮容器 - 强制同行 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  flex-wrap: nowrap !important; /* 禁止按钮换行 */
}
:deep(.dialog-footer .el-button) {
  flex-shrink: 0; /* 禁止按钮收缩 */
}

/* 按钮样式统一 */
:deep(.el-button) {
  height: 36px;
  padding: 0 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}
:deep(.el-button--primary) {
  background: #4CAF50;
  color: #fff;
}
:deep(.el-button--primary:hover) {
  background: #388E3C;
}
:deep(.el-button--success) {
  background: #4CAF50;
  color: #fff;
}
:deep(.el-button--success:hover) {
  background: #388E3C;
}
:deep(.el-button--danger) {
  background: #f44336;
  color: #fff;
}
:deep(.el-button--danger:hover) {
  background: #d32f2f;
}
:deep(.el-button--warning) {
  background: #f57c00;
  color: #fff;
}
:deep(.el-button--warning:hover) {
  background: #e65100;
}
:deep(.el-button--info) {
  background: #0288d1;
  color: #fff;
}
:deep(.el-button--info:hover) {
  background: #0277bd;
}

/* 跟进/报价弹窗顶部按钮 */
.follow-header, .quote-header {
  margin-bottom: 10px;
  text-align: right;
  width: 100%;
  box-sizing: border-box; /* 确保不超出弹窗宽度 */
}

/* 表格样式 */
:deep(.el-table) {
  width: 100%;
  --el-table-header-text-color: #333;
  --el-table-row-hover-bg-color: #f9f9f9;
  --el-table-border-color: #eee;
  --el-table-stripe-bg: #fafafa;
  border-radius: 4px;
}
.table-wrapper {
  overflow-x: auto;
  border-radius: 4px;
  padding-bottom: 10px;
  box-sizing: border-box;
}

/* 分页样式 */
.pagination-wrapper {
  margin-top: 20px;
  text-align: right;
  padding: 10px 0;
}
:deep(.el-pagination) {
  --el-pagination-text-color: #333;
  --el-pagination-active-color: #4CAF50;
}
:deep(.el-pagination .el-pager li.is-active) {
  background: #4CAF50;
  color: #fff;
}
:deep(.el-pagination .el-select .el-input) {
  width: 80px !important;
}

/* 弹窗样式优化（全局弹窗，不影响跟进记录专属弹窗） */
:deep(.el-dialog):not(.follow-record-dialog) {
  border-radius: 8px;
  max-width: unset; /* 避免全局样式影响跟进弹窗宽度 */
}
:deep(.el-dialog__header) {
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}
:deep(.el-dialog__body):not(.follow-record-dialog .el-dialog__body) {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
  box-sizing: border-box;
}
:deep(.el-dialog__footer) {
  padding: 16px 20px;
  border-top: 1px solid #eee;
  /* 覆盖element默认样式，确保按钮容器生效 */
  display: block !important;
}

/* 详情页描述列表 */
:deep(.el-descriptions) {
  --el-descriptions-label-color: #333;
  --el-descriptions-content-color: #666;
}

/* 解决fixed列遮挡问题 */
:deep(.el-table__fixed-right) {
  height: auto !important;
  bottom: 16px !important;
}

/* 空提示样式 */
.empty-tip {
  text-align: center;
  padding: 20px;
  color: #999;
}

/* ===================== 跟进记录弹窗专属样式（调整为小尺寸，不超出客户管理页面） ===================== */
/* 1. 小弹窗整体样式，限制最大宽度不超过客户管理容器 */
:deep(.follow-record-dialog) {
  max-width: calc(100% - 40px) !important; /* 减去客户容器左右20px padding，不超出页面 */
  width: 800px !important;
  border-radius: 8px !important;
  margin: 20px auto !important;
}
:deep(.follow-record-dialog .el-dialog__wrapper) {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 10px 0;
  /* 防止弹窗超出视口 */
  max-width: 100vw;
  overflow: hidden;
}
:deep(.follow-record-dialog .el-dialog__header) {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}
:deep(.follow-record-dialog .el-dialog__title) {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
:deep(.follow-record-dialog .el-dialog__body) {
  padding: 20px;
  max-height: 70vh !important; /* 降低最大高度，适配小弹窗 */
  overflow-y: auto !important;
  box-sizing: border-box !important;
  background-color: #fafafa;
}

/* 2. 客户信息概览样式，适配小弹窗 */
.follow-customer-overview {
  margin-bottom: 15px;
  width: 100%;
}
.overview-card {
  border: 1px solid #e8e8e8;
  box-shadow: none !important;
  margin-bottom: 10px;
}
:deep(.overview-card .el-descriptions) {
  --el-descriptions-item-padding: 6px 12px;
  font-size: 12px;
}

/* 3. 顶部操作+筛选栏样式，适配小弹窗换行 */
.follow-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
}
.follow-operation {
  display: flex;
  gap: 8px;
  margin-bottom: 5px;
  flex-wrap: wrap;
}
.follow-search-form {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  flex-wrap: wrap;
}

/* 4. 表格包裹容器，适配小弹窗滚动 */
.follow-table-wrapper {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 8px;
  box-sizing: border-box;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
}
:deep(.follow-record-dialog .el-table) {
  min-width: 700px; /* 适配小弹窗的表格最小宽度 */
  width: 100% !important;
  box-sizing: border-box;
  border: none !important;
  font-size: 12px;
}
:deep(.follow-record-dialog .el-table__header-wrapper) {
  background-color: #f5f5f5;
}
.follow-content-wrapper {
  word-wrap: break-word;
  word-break: break-all;
  line-height: 1.4;
  padding: 2px 0;
  color: #666;
  font-size: 12px;
}

/* 5. 跟进记录分页样式，适配小弹窗 */
.follow-pagination {
  margin-top: 10px;
  padding: 8px 16px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
}
:deep(.follow-record-dialog .el-pagination) {
  font-size: 12px;
}

/* 6. 跟进表单样式优化，适配小弹窗 */
:deep(.follow-form .el-textarea__wrapper) {
  height: auto !important;
}

/* 7. 响应式适配，确保小弹窗在各种屏幕下不超出客户管理页面 */
@media (max-width: 992px) {
  :deep(.follow-record-dialog) {
    width: calc(100% - 40px) !important;
  }
  :deep(.follow-record-dialog .el-table) {
    min-width: 600px !important;
  }
  .search-form {
    min-width: 400px;
  }
}
@media (max-width: 768px) {
  :deep(.follow-record-dialog) {
    width: calc(100% - 20px) !important;
  }
  .search-form {
    min-width: 300px;
  }
}
</style>

<script setup>
import { ref, onMounted, reactive, getCurrentInstance } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 获取全局axios实例
const { proxy } = getCurrentInstance()
const $axios = proxy.$axios

// 加载状态
const loading = ref(false)
const followLoading = ref(false)
const quoteLoading = ref(false)

// 分页参数（客户列表）
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 跟进记录分页参数（新增，支持大量记录分页）
const followCurrentPage = ref(1)
const followPageSize = ref(20)
const followTotal = ref(0)

// 超级管理员标识
const isSuperAdmin = ref(false)
const operatorName = ref('当前登录用户')

// 筛选表单（客户列表）
const searchForm = reactive({
  name: '',
  level: ''
})

// 跟进记录筛选表单（新增，支持多条件查询）
const followSearchForm = reactive({
  dateRange: [],
  followType: '',
  content: ''
})

// 客户列表数据
const customerList = ref([])

// 当前跟进客户信息（新增，用于弹窗展示客户概览）
const currentCustomerId = ref('')
const currentCustomerName = ref('')
const currentCustomerInfo = reactive({})

// 客户等级选项
const customerLevelOptions = ref([
  { label: 'A级：多次下订单的老客户', value: 'a' },
  { label: 'B级：已经建立合作的新客户', value: 'b' },
  { label: 'C级：有寄过样品，且准备下单的客户', value: 'c' },
  { label: 'D级：重点潜在大客户，已做过被调，尚未开展合作', value: 'd' },
  { label: 'E级：普通潜在客户，有询价有意向合作可能，但非大客户', value: 'e' },
  { label: 'F级：仅一次合作，无复购 无再询价的客户', value: 'f' },
  { label: 'G级：仅询价，无回音的客户', value: 'g' }
])

// 业务员列表
const salesmanList = ref([])

// 客户弹窗相关
const customerDialogVisible = ref(false)
const customerDialogTitle = ref('')
const customerFormType = ref('add')
const customerFormRef = ref(null)
const customerForm = reactive({
  customer_id: '',
  name: '',
  gender: '',
  country: '',
  phone: '',
  email: '',
  source: '',
  company: '',
  level: '',
  salesman_id: '',
  address: '',
  remark: ''
})

// 客户表单验证规则
const customerFormRules = reactive({
  name: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
  country: [{ required: true, message: '请输入国家/地区', trigger: 'blur' }],
  salesman_id: [{ required: true, message: '请选择负责业务员', trigger: 'change' }],
  level: [{ required: true, message: '请选择客户等级', trigger: 'change' }]
})

// 客户详情
const customerDetailVisible = ref(false)
const customerDetail = reactive({})

// 跟进记录相关
const followDialogVisible = ref(false)
const followFormVisible = ref(false)
const followFormTitle = ref('')
const followFormType = ref('add')
const followFormRef = ref(null)
const followList = ref([])
const followTypeOptions = ref([])

const followForm = reactive({
  follow_id: '',
  customer_id: '',
  follow_date: '',
  follow_type: '',
  content: ''
})

const followFormRules = reactive({
  follow_date: [{ required: true, message: '请选择跟进日期', trigger: 'change' }],
  follow_type: [{ required: true, message: '请选择跟进类型', trigger: 'change' }],
  content: [{ required: true, message: '请输入跟进内容', trigger: 'blur' }]
})

// 报价记录相关
const quoteDialogVisible = ref(false)
const quoteFormVisible = ref(false)
const quoteFormTitle = ref('')
const quoteFormType = ref('add')
const quoteFormRef = ref(null)
const quoteList = ref([])
const quoteStatusOptions = ref([
  { label: '已报价', value: 'quoted' },
  { label: '已确认', value: 'confirmed' },
  { label: '已作废', value: 'invalid' }
])

const quoteForm = reactive({
  quote_id: '',
  customer_id: '',
  calc_id: '',
  quote_date: '',
  freight_type: 'manual',
  manual_freight_per_kg: '',
  freight_forwarder_quote_id: '',
  quote_file_path: '',
  status: 'quoted'
})

const quoteFormRules = reactive({
  calc_id: [{ required: true, message: '请输入计算ID', trigger: 'blur' }],
  quote_date: [{ required: true, message: '请选择报价日期', trigger: 'change' }],
  manual_freight_per_kg: [{
    required: true,
    message: '请输入手动每KG海运费',
    trigger: 'blur',
    validator: (rule, value, callback) => {
      if (quoteForm.freight_type === 'manual' && (value === '' || value < 0)) {
        callback(new Error('手动海运费必须为非负数字'))
      } else {
        callback()
      }
    }
  }],
  freight_forwarder_quote_id: [{
    required: true,
    message: '请输入货代报价ID',
    trigger: 'blur',
    validator: (rule, value, callback) => {
      if (quoteForm.freight_type === 'forwarder' && !value) {
        callback(new Error('请输入货代报价ID'))
      } else {
        callback()
      }
    }
  }]
})

// 报价计算明细
const quoteCalculationVisible = ref(false)
const quoteCalculationDetail = reactive({})

// 选中的客户列表
const selectedCustomers = ref([])

// 工具方法
const getShortCustomerLevelLabel = (value) => {
  const item = customerLevelOptions.value.find(item => item.value === value)
  if (!item) return '未知等级'
  return item.label.split('：')[0] || item.label
}

const getCustomerLevelLabel = (value) => {
  const item = customerLevelOptions.value.find(item => item.value === value)
  return item ? item.label : value || '未知等级'
}

const getFollowTypeLabel = (value) => {
  const item = followTypeOptions.value.find(item => item.code === value)
  return item ? item.name : value || '未知'
}

// 新增：跟进类型标签颜色映射
const getFollowTypeTagType = (value) => {
  const typeMap = {
    'phone': 'primary',
    'wechat': 'success',
    'email': 'info',
    'meeting': 'warning',
    'other': 'default'
  }
  return typeMap[value] || 'default'
}

const getQuoteStatusLabel = (value) => {
  const item = quoteStatusOptions.value.find(item => item.value === value)
  return item ? item.label : value || '未知'
}

const resetSearchForm = () => {
  searchForm.name = ''
  searchForm.level = ''
  getCustomerList()
}

// 新增：重置跟进记录筛选表单
const resetFollowSearchForm = () => {
  followSearchForm.dateRange = []
  followSearchForm.followType = ''
  followSearchForm.content = ''
  followCurrentPage.value = 1
  // 重置跟进列表数据，防止关闭弹窗后残留
  followList.value = []
  followTotal.value = 0
}

const resetCustomerForm = () => {
  if (customerFormRef.value) {
    customerFormRef.value.clearValidate()
  }
  Object.keys(customerForm).forEach(key => {
    customerForm[key] = ''
  })
  customerForm.level = 'e'
}

const resetFollowForm = () => {
  if (followFormRef.value) {
    followFormRef.value.clearValidate()
  }
  Object.keys(followForm).forEach(key => {
    followForm[key] = ''
  })
  followForm.customer_id = currentCustomerId.value
}

const resetQuoteForm = () => {
  if (quoteFormRef.value) {
    quoteFormRef.value.clearValidate()
  }
  Object.keys(quoteForm).forEach(key => {
    quoteForm[key] = ''
  })
  quoteForm.customer_id = currentCustomerId.value
  quoteForm.freight_type = 'manual'
  quoteForm.status = 'quoted'
}

const handleSizeChange = (val) => {
  pageSize.value = val
  getCustomerList()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  getCustomerList()
}

// 新增：跟进记录分页事件
const handleFollowSizeChange = (val) => {
  followPageSize.value = val
  getCustomerFollowList()
}
const handleFollowCurrentChange = (val) => {
  followCurrentPage.value = val
  getCustomerFollowList()
}

// 客户相关接口
const getCustomerList = async () => {
  try {
    loading.value = true
    const params = {
      name: searchForm.name,
      level: searchForm.level,
      page: currentPage.value,
      size: pageSize.value
    }
    const res = await $axios.get('/business/customer/list/', { params })
    if (res.code === 200) {
      customerList.value = res.data.list
      total.value = res.data.total
    } else {
      ElMessage.error(res.msg || '获取客户列表失败')
    }
  } catch (error) {
    ElMessage.error(`获取客户列表失败：${error.message}`)
  } finally {
    loading.value = false
  }
}

const getSalesmanList = async () => {
  try {
    const res = await $axios.get('/business/customer/salesman/list/')
    if (res.code === 200) {
      salesmanList.value = res.data.list
    } else {
      ElMessage.error(res.msg || '获取业务员列表失败')
    }
  } catch (error) {
    ElMessage.error(`获取业务员列表失败：${error.message}`)
  }
}

const openCustomerDialog = (type, row = {}) => {
  customerDialogTitle.value = type === 'add' ? '新增客户' : '编辑客户'
  customerFormType.value = type
  customerDialogVisible.value = true

  if (type === 'edit') {
    customerForm.customer_id = row.customer_id
    customerForm.name = row.name
    customerForm.gender = row.gender
    customerForm.country = row.country
    customerForm.phone = row.phone
    customerForm.email = row.email
    customerForm.source = row.source || ''
    customerForm.company = row.company
    customerForm.level = row.level
    customerForm.salesman_id = row.salesman_id
    customerForm.address = row.address || ''
    customerForm.remark = row.remark || ''
  } else {
    customerForm.level = 'e'
  }
}

const submitCustomerForm = async () => {
  try {
    await customerFormRef.value.validate()

    const requestData = { ...customerForm }
    let res
    if (customerFormType.value === 'add') {
      res = await $axios.post('/business/customer/create/', requestData)
    } else {
      res = await $axios.post(`/business/customer/update/${customerForm.customer_id}/`, requestData)
    }

    if (res.code === 200) {
      ElMessage.success(res.msg || (customerFormType.value === 'add' ? '新增客户成功' : '编辑客户成功'))
      customerDialogVisible.value = false
      getCustomerList()
    } else {
      ElMessage.error(res.msg || (customerFormType.value === 'add' ? '新增客户失败' : '编辑客户失败'))
    }
  } catch (error) {
    if (error.name !== 'ValidationError') {
      ElMessage.error(`提交失败：${error.message}`)
    }
  }
}

const openCustomerDetail = async (row) => {
  try {
    customerDetailVisible.value = true
    const res = await $axios.get(`/business/customer/detail/${row.customer_id}/`)
    if (res.code === 200) {
      Object.assign(customerDetail, res.data)
    } else {
      ElMessage.error(res.msg || '获取客户详情失败')
    }
  } catch (error) {
    ElMessage.error(`获取客户详情失败：${error.message}`)
  }
}

const handleDeleteCustomer = async (customerId) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除该客户吗？删除后将同时删除关联的跟进记录、报价记录等数据！',
      '危险操作',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'error'
      }
    )

    const res = await $axios.delete(`/business/customer/delete/${customerId}/`)
    if (res.code === 200) {
      ElMessage.success('删除客户成功')
      getCustomerList()
    } else {
      ElMessage.error(res.msg || '删除客户失败')
    }
  } catch (error) {
    if (error.message !== 'cancel') {
      ElMessage.error(`删除客户失败：${error.message}`)
    }
  }
}

const handleSelectionChange = (val) => {
  selectedCustomers.value = val
}

const downloadCustomerExcel = async () => {
  if (selectedCustomers.value.length === 0) {
    ElMessage.warning("请先选择需要导出的客户！")
    return
  }

  try {
    const customerIds = selectedCustomers.value.map(item => item.customer_id).join(',')
    const params = { customer_ids: customerIds }

    const res = await $axios.get('/business/customer/download/', {
      params,
      responseType: 'blob'
    })

    const contentDisposition = res.headers['content-disposition']
    let filename = '选中客户列表.xlsx'
    if (contentDisposition) {
      const matches = /filename\*?=UTF-8''([^;]+)/i.exec(contentDisposition)
      if (matches && matches[1]) {
        filename = decodeURIComponent(matches[1])
      }
    }

    const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()

    window.URL.revokeObjectURL(url)
    document.body.removeChild(link)

    ElMessage.success('选中客户Excel导出成功')
  } catch (error) {
    ElMessage.error(`Excel导出失败：${error.message}`)
  }
}

const handleRowDblClick = (row) => {
  openCustomerDetail(row)
}

// 跟进记录相关接口
const getFollowTypeChoices = async () => {
  try {
    const res = await $axios.get('/business/customer/follow/types/')
    if (res.code === 200) {
      followTypeOptions.value = res.data
    } else {
      ElMessage.error(res.msg || '获取跟进类型失败')
    }
  } catch (error) {
    ElMessage.error(`获取跟进类型失败：${error.message}`)
  }
}

// 优化：打开跟进记录弹窗，同时获取客户详情
const openFollowTab = async (row) => {
  currentCustomerId.value = row.customer_id
  currentCustomerName.value = row.name
  followDialogVisible.value = true

  // 获取客户详情，用于弹窗内概览展示
  try {
    const res = await $axios.get(`/business/customer/detail/${row.customer_id}/`)
    if (res.code === 200) {
      Object.assign(currentCustomerInfo, res.data)
    }
  } catch (error) {
    console.error('获取客户概览失败：', error)
  }

  // 重置筛选条件，获取跟进记录列表
  followCurrentPage.value = 1
  getCustomerFollowList()
}

// 优化：跟进记录列表（支持多条件筛选+分页）
const getCustomerFollowList = async () => {
  try {
    followLoading.value = true
    const params = {
      customer_id: currentCustomerId.value,
      start_date: followSearchForm.dateRange[0] || '',
      end_date: followSearchForm.dateRange[1] || '',
      follow_type: followSearchForm.followType || '',
      content: followSearchForm.content || '',
      page: followCurrentPage.value,
      size: followPageSize.value
    }
    const res = await $axios.get('/business/customer/follow/list/', { params })
    if (res.code === 200) {
      followList.value = res.data.list
      followTotal.value = res.data.total
    } else {
      ElMessage.error(res.msg || '获取跟进记录失败')
    }
  } catch (error) {
    ElMessage.error(`获取跟进记录失败：${error.message}`)
  } finally {
    followLoading.value = false
  }
}

const openFollowDialog = (type, row = {}) => {
  followFormTitle.value = type === 'add' ? '新增跟进记录' : '编辑跟进记录'
  followFormType.value = type
  followFormVisible.value = true

  resetFollowForm()

  if (type === 'edit') {
    followForm.follow_id = row.follow_id
    followForm.follow_date = row.follow_date
    followForm.follow_type = row.follow_type
    followForm.content = row.content
  }
}

// 新增：双击跟进记录行快速编辑
const handleFollowRowDblClick = (row) => {
  openFollowDialog('edit', row)
}

const submitFollowForm = async () => {
  try {
    await followFormRef.value.validate()

    const requestData = { ...followForm }
    let res

    if (followFormType.value === 'add') {
      res = await $axios.post('/business/customer/follow/create/', requestData)
    } else {
      res = await $axios.post(`/business/customer/follow/update/${followForm.follow_id}/`, requestData)
    }

    if (res.code === 200) {
      ElMessage.success(res.msg || (followFormType.value === 'add' ? '新增跟进记录成功' : '编辑跟进记录成功'))
      followFormVisible.value = false
      getCustomerFollowList()
    } else {
      ElMessage.error(res.msg || (followFormType.value === 'add' ? '新增跟进记录失败' : '编辑跟进记录失败'))
    }
  } catch (error) {
    if (error.name !== 'ValidationError') {
      ElMessage.error(`提交失败：${error.message}`)
    }
  }
}

const handleDeleteFollow = async (followId) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除该跟进记录吗？',
      '提示',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const res = await $axios.delete(`/business/customer/follow/delete/${followId}/`)
    if (res.code === 200) {
      ElMessage.success('删除跟进记录成功')
      getCustomerFollowList()
    } else {
      ElMessage.error(res.msg || '删除跟进记录失败')
    }
  } catch (error) {
    if (error.message !== 'cancel') {
      ElMessage.error(`删除跟进记录失败：${error.message}`)
    }
  }
}

// 新增：导出跟进记录Excel
const downloadFollowExcel = async () => {
  try {
    followLoading.value = true
    const params = {
      customer_id: currentCustomerId.value,
      start_date: followSearchForm.dateRange[0] || '',
      end_date: followSearchForm.dateRange[1] || '',
      follow_type: followSearchForm.followType || '',
      content: followSearchForm.content || ''
    }
    const res = await $axios.get('/business/customer/follow/download/', {
      params,
      responseType: 'blob'
    })

    const contentDisposition = res.headers['content-disposition']
    let filename = `${currentCustomerName.value}-跟进记录.xlsx`
    if (contentDisposition) {
      const matches = /filename\*?=UTF-8''([^;]+)/i.exec(contentDisposition)
      if (matches && matches[1]) {
        filename = decodeURIComponent(matches[1])
      }
    }

    const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()

    window.URL.revokeObjectURL(url)
    document.body.removeChild(link)

    ElMessage.success('跟进记录Excel导出成功')
  } catch (error) {
    ElMessage.error(`跟进记录导出失败：${error.message}`)
  } finally {
    followLoading.value = false
  }
}

// 报价记录相关接口
const openQuoteTab = (row) => {
  currentCustomerId.value = row.customer_id
  quoteDialogVisible.value = true
  getCustomerQuoteList()
}

const getCustomerQuoteList = async () => {
  try {
    quoteLoading.value = true
    const res = await $axios.get(`/business/customer/quote/list/${currentCustomerId.value}/`)
    if (res.code === 200) {
      quoteList.value = res.data.list
    } else {
      ElMessage.error(res.msg || '获取报价记录失败')
    }
  } catch (error) {
    ElMessage.error(`获取报价记录失败：${error.message}`)
  } finally {
    quoteLoading.value = false
  }
}

const openQuoteDialog = (type, row = {}) => {
  quoteFormTitle.value = type === 'add' ? '新增报价记录' : '编辑报价记录'
  quoteFormType.value = type
  quoteFormVisible.value = true

  resetQuoteForm()

  if (type === 'edit') {
    quoteForm.quote_id = row.quote_id
    quoteForm.calc_id = row.calc_id
    quoteForm.quote_date = row.quote_date
    quoteForm.quote_file_path = row.quote_file_path
    quoteForm.status = row.status

    if (row.manual_freight_per_kg) {
      quoteForm.freight_type = 'manual'
      quoteForm.manual_freight_per_kg = row.manual_freight_per_kg
    } else if (row.freight_forwarder_quote_id) {
      quoteForm.freight_type = 'forwarder'
      quoteForm.freight_forwarder_quote_id = row.freight_forwarder_quote_id
    }
  }
}

const handleFreightTypeChange = () => {
  if (quoteForm.freight_type === 'manual') {
    quoteForm.freight_forwarder_quote_id = ''
  } else {
    quoteForm.manual_freight_per_kg = ''
  }
  if (quoteFormRef.value) {
    quoteFormRef.value.clearValidate(['manual_freight_per_kg', 'freight_forwarder_quote_id'])
  }
}

const submitQuoteForm = async () => {
  try {
    await quoteFormRef.value.validate()

    const requestData = { ...quoteForm }
    if (!requestData.manual_freight_per_kg) delete requestData.manual_freight_per_kg
    if (!requestData.freight_forwarder_quote_id) delete requestData.freight_forwarder_quote_id

    let res
    if (quoteFormType.value === 'add') {
      res = await $axios.post('/business/customer/quote/create/', requestData)
    } else {
      res = await $axios.post(`/business/customer/quote/update/${quoteForm.quote_id}/`, requestData)
    }

    if (res.code === 200) {
      ElMessage.success(res.msg || (quoteFormType.value === 'add' ? '新增报价记录成功' : '编辑报价记录成功'))
      quoteFormVisible.value = false
      getCustomerQuoteList()
    } else {
      ElMessage.error(res.msg || (quoteFormType.value === 'add' ? '新增报价记录失败' : '编辑报价记录失败'))
    }
  } catch (error) {
    if (error.name !== 'ValidationError') {
      ElMessage.error(`提交失败：${error.message}`)
    }
  }
}

const handleChangeQuoteStatus = async (quoteId, status) => {
  try {
    const statusText = status === 'confirmed' ? '确认' : '作废'
    await ElMessageBox.confirm(
      `确定要${statusText}该报价吗？`,
      '提示',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: status === 'confirmed' ? 'success' : 'warning'
      }
    )

    const res = await $axios.post(`/business/customer/quote/change-status/${quoteId}/`, { status })
    if (res.code === 200) {
      ElMessage.success(res.msg || `报价已${statusText}`)
      getCustomerQuoteList()
    } else {
      ElMessage.error(res.msg || `${statusText}报价失败`)
    }
  } catch (error) {
    if (error.message !== 'cancel') {
      ElMessage.error(`${status === 'confirmed' ? '确认' : '作废'}报价失败：${error.message}`)
    }
  }
}

const downloadQuoteFile = async (quoteId) => {
  try {
    const res = await $axios.get(`/business/customer/quote/download/${quoteId}/`, {
      responseType: 'blob'
    })

    const contentDisposition = res.headers['content-disposition']
    let filename = '报价单.xlsx'
    if (contentDisposition) {
      const matches = /filename\*?=UTF-8''([^;]+)/i.exec(contentDisposition)
      if (matches && matches[1]) {
        filename = decodeURIComponent(matches[1])
      }
    }

    const blob = new Blob([res.data], { type: 'application/octet-stream' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()

    window.URL.revokeObjectURL(url)
    document.body.removeChild(link)

    ElMessage.success('报价单下载成功')
  } catch (error) {
    ElMessage.error(`报价单下载失败：${error.message}`)
  }
}

const viewQuoteCalculation = async (quoteId) => {
  try {
    quoteCalculationVisible.value = true
    const res = await $axios.get(`/business/customer/quote/calculation/${quoteId}/`)
    if (res.code === 200) {
      Object.assign(quoteCalculationDetail, res.data)
    } else {
      ElMessage.error(res.msg || '获取计算明细失败')
    }
  } catch (error) {
    ElMessage.error(`获取计算明细失败：${error.message}`)
  }
}

// 生命周期
onMounted(async () => {
  await Promise.all([
    getSalesmanList(),
    getFollowTypeChoices()
  ])
  getCustomerList()
})
</script>