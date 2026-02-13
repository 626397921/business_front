<template>
  <div class="customer-management-container">
    <!-- 顶部筛选栏 -->
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="全局搜索">
          <el-input
            v-model="searchForm.keyword"
            clearable
            @keyup.enter="getCustomerList"
            style="width: 280px;"
            prefix-icon="el-icon-search"
          ></el-input>
        </el-form-item>
        <el-form-item label="客户名称">
          <el-input
            v-model="searchForm.name"
            placeholder="请输入客户名称"
            clearable
            @keyup.enter="getCustomerList"
          ></el-input>
        </el-form-item>
        <!-- 下拉框 - 加form-item-picker -->
        <el-form-item label="客户等级" class="form-item-picker">
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
            ></el-option>
          </el-select>
        </el-form-item>
        <!-- 新增：负责业务员 - 下拉框 - 加form-item-picker -->
        <el-form-item label="负责业务员" class="form-item-picker">
          <el-select
            v-model="searchForm.salesman_id"
            placeholder="请选择负责业务员"
            clearable
            style="width: 200px;"
            filterable
          >
            <el-option
              v-for="item in salesmanList"
              :key="item.user_id"
              :label="item.username"
              :value="item.user_id"
            ></el-option>
          </el-select>
        </el-form-item>
        <!-- 新增：创建日期范围 - 日期框 - 加form-item-picker -->
        <el-form-item label="创建日期" class="form-item-picker">
          <el-date-picker
            v-model="searchForm.createDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            clearable
            style="width: 280px;"
          ></el-date-picker>
        </el-form-item>
        <!-- 新增：客户来源 -->
        <el-form-item label="客户来源">
          <el-input
            v-model="searchForm.source"
            placeholder="请输入客户来源"
            clearable
            @keyup.enter="getCustomerList"
          ></el-input>
        </el-form-item>
        <!-- 新增：联系方式（电话/邮箱模糊查询） -->
        <el-form-item label="联系方式">
          <el-input
            v-model="searchForm.contactInfo"
            placeholder="请输入电话/邮箱关键词"
            clearable
            @keyup.enter="getCustomerList"
          ></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getCustomerList">查询</el-button>
          <el-button @click="resetSearchForm">重置</el-button>
          <el-button type="success" @click="downloadCustomerExcel">导出Excel</el-button>
        </el-form-item>
      </el-form>

      <!-- 替换原search-bar内的两个绿色按钮，外层增加专属容器保证布局 -->
      <div class="search-bar-actions">
        <el-button
          class="customer-green-btn add-customer-btn"
          type="primary"
          @click="openCustomerDialog('add')"
        >
          新增客户
        </el-button>

        <el-button
          class="customer-green-btn batch-assign-btn"
          type="primary"
          @click="openBatchAssignDialog"
          v-if="isSuperAdmin"
        >
          批量分配客户
        </el-button>
      </div>
    </div>
    <!-- 新增：表格包裹容器（添加ref，用于ResizeObserver监听），减少尺寸频繁变动 -->
    <!-- 修改：添加滚动样式，设置固定高度 -->
    <div class="main-table-wrapper" ref="mainTableWrapperRef" style="height: 750px; overflow-y: auto;">
      <!-- 客户列表表格核心修改 -->
      <el-table
        ref="customerTableRef"
        :data="customerList"
        border
        stripe
        row-key="customer_id"
        @selection-change="handleSelectionChange"
        @row-dblclick="handleRowDblClick"
        v-loading="loading"
      >

        <el-table-column
          type="selection"
          width="60"
          align="center"
          :reserve-selection="true"
        />

        <el-table-column label="客户名称" min-width="120" align="center">
          <template #default="scope">
            <!-- 绑定详情弹窗方法，添加可点击样式类 -->
            <span
              class="customer-name-clickable"
              @click="openCustomerDetail(scope.row)"
            >
              {{ scope.row.name || '未知客户' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="gender" label="性别" width="80" align="center"></el-table-column>
        <el-table-column prop="country" label="国家/地区" min-width="100" align="center"></el-table-column>
        <!-- 核心修改：移除单独的phone、email列，新增联系方式列（支持换行） -->
        <el-table-column prop="contact" label="联系方式" min-width="180" align="center" >
          <template #default="scope">
            <div class="contact-content-wrapper">
              {{ scope.row.contact || '无' }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="company" label="公司名称" min-width="150" align="center"></el-table-column>
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
        <el-table-column prop="salesman_name" label="负责业务员" width="120" align="center"></el-table-column>
        <el-table-column prop="create_time" label="创建时间" width="180" align="center"></el-table-column>
        <el-table-column label="操作" width="400" align="center">
          <template #default="scope">
            <div class="operation-buttons">
              <!-- 编辑按钮：自定义class "btn-edit" -->
              <el-button size="small" class="btn-edit" @click="openCustomerDialog('edit', scope.row)">
                编辑
              </el-button>
              <!-- 跟进记录：自定义class "btn-follow" -->
              <el-button size="small" class="btn-follow" @click="openFollowTab(scope.row)">
                跟进记录
              </el-button>
              <!-- 报价记录：自定义class "btn-quote" -->
              <el-button size="small" class="btn-quote" @click="openQuoteTab(scope.row)">
                报价记录
              </el-button>
              <!-- 删除：自定义class "btn-delete" -->
              <el-button
                size="small"
                class="btn-delete"
                @click="handleDeleteCustomer(scope.row.customer_id)"
                v-if="isSuperAdmin"
              >
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 移除：分页组件 -->

    <!-- 客户新增/编辑弹窗（保留phone、email单独输入，后端需要接收这两个字段进行合并） -->
    <el-dialog
      v-model="customerDialogVisible"
      :title="customerDialogTitle"
      width="800px"
      @close="resetCustomerForm"
      class="unified-dialog"
    >
      <el-form
        ref="customerFormRef"
        :model="customerForm"
        :rules="customerFormRules"
        label-width="100px"
        class="unified-form"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="客户名称" prop="name">
              <el-input v-model="customerForm.name" placeholder="请输入客户名称"></el-input>
            </el-form-item>
          </el-col>
          <!-- 下拉框 - 加form-item-picker -->
          <el-col :span="12">
            <el-form-item label="性别" prop="gender" class="form-item-picker">
              <el-select v-model="customerForm.gender" placeholder="请选择性别">
                <el-option label="男" value="男"></el-option>
                <el-option label="女" value="女"></el-option>
                <el-option label="未知" value="未知"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="国家/地区" prop="country">
              <el-input v-model="customerForm.country" placeholder="请输入国家/地区"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="customerForm.phone" placeholder="请输入联系电话"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="电子邮箱" prop="email">
              <el-input v-model="customerForm.email" placeholder="请输入电子邮箱"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户来源" prop="source">
              <el-input v-model="customerForm.source" placeholder="请输入客户来源"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="公司名称" prop="company">
              <el-input v-model="customerForm.company" placeholder="请输入公司名称"></el-input>
            </el-form-item>
          </el-col>
          <!-- 下拉框 - 加form-item-picker -->
          <el-col :span="12">
            <el-form-item label="客户等级" prop="level" class="form-item-picker">
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
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <!-- 下拉框 - 加form-item-picker -->
          <el-col :span="12">
            <el-form-item label="负责业务员" prop="salesman_id" class="form-item-picker">
              <el-select v-model="customerForm.salesman_id" placeholder="请选择业务员" filterable>
                <el-option
                  v-for="item in salesmanList"
                  :key="item.user_id"
                  :label="item.username"
                  :value="item.user_id"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="操作人" prop="operator">
              <el-input v-model="operatorName" disabled placeholder="当前登录用户"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="详细地址" prop="address">
          <el-input
            v-model="customerForm.address"
            type="textarea"
            :rows="3"
            placeholder="请输入详细地址"
          ></el-input>
        </el-form-item>
        <!-- 正确：备注信息 表单输入项（多行文本框） -->
        <el-form-item label="备注信息" prop="remark">
          <el-input
            v-model="customerForm.remark"
            type="textarea"
            :rows="4"
            placeholder="请输入客户备注信息（可选）"
            resize="vertical"
          ></el-input>
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

    <!-- 新增：客户批量分配弹窗 -->
    <el-dialog
      v-model="batchAssignDialogVisible"
      title="批量分配客户给业务员"
      width="500px"
      @close="resetBatchAssignForm"
      class="unified-dialog"
    >
      <el-form
        ref="batchAssignFormRef"
        :model="batchAssignForm"
        :rules="batchAssignFormRules"
        label-width="120px"
        class="unified-form"
      >
        <el-form-item label="已选中客户数量">
          <el-tag type="info">{{ selectedCustomers.length }} 个</el-tag>
        </el-form-item>
        <!-- 下拉框 - 加form-item-picker -->
        <el-form-item label="目标业务员" prop="target_salesman_id" class="form-item-picker">
          <el-select
            v-model="batchAssignForm.target_salesman_id"
            placeholder="请选择要分配的业务员"
            filterable
            style="width: 100%;"
          >
            <el-option
              v-for="item in salesmanList"
              :key="item.user_id"
              :label="item.username"
              :value="item.user_id"
            ></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="batchAssignDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitBatchAssign">确认分配</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="customerDetailVisible"
      title="客户详情"
      width="900px"
      class="unified-dialog customer-detail-dialog"
      @close="resetCustomerDetail"
    >
      <div class="customer-detail-content">
        <!-- 核心：column=2 保证默认两列，长文本项单独处理换行和滚动 -->
        <el-descriptions :column="2" border fill class="detail-descriptions unified-desc">
          <!-- 正常两列显示的项，优化文本自动换行 -->
          <el-descriptions-item label="客户名称" class="text-wrap-item">
            {{ customerDetail.name || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="性别" class="text-wrap-item">
            {{ customerDetail.gender || '未知' }}
          </el-descriptions-item>
          <el-descriptions-item label="国家/地区" class="text-wrap-item">
            {{ customerDetail.country || '-' }}
          </el-descriptions-item>
          <!-- 核心修改：移除单独的电话、邮箱，新增合并的联系方式（支持换行） -->
          <el-descriptions-item label="联系方式" class="text-wrap-item">
            <div class="contact-content-wrapper">
              {{ customerDetail.contact || '无' }}
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="客户来源" class="text-wrap-item">
            {{ customerDetail.source || '无' }}
          </el-descriptions-item>
          <el-descriptions-item label="公司名称" class="text-wrap-item">
            {{ customerDetail.company || '无' }}
          </el-descriptions-item>
          <el-descriptions-item label="客户等级" class="text-wrap-item">
            <el-tooltip :content="getCustomerLevelLabel(customerDetail.level)" placement="top" effect="dark">
              <span>{{ getShortCustomerLevelLabel(customerDetail.level) }}</span>
            </el-tooltip>
          </el-descriptions-item>
          <el-descriptions-item label="负责业务员" class="text-wrap-item">
            {{ customerDetail.salesman_name || '无' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间" class="text-wrap-item">
            {{ customerDetail.create_time || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="最后修改时间" class="text-wrap-item">
            {{ customerDetail.update_time || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="操作人" class="text-wrap-item">
            {{ customerDetail.operator_name || '无' }}
          </el-descriptions-item>

          <!-- 长文本：详细地址 - 固定高度+内部滚动 -->
          <el-descriptions-item label="详细地址" :span="2" class="long-text-item address-item">
            <div class="address-content-wrapper">
              {{ customerDetail.address || '无详细地址信息' }}
            </div>
          </el-descriptions-item>

          <el-descriptions-item
            label="备注信息"
            :span="2"
            class="long-text-item remark-item"
          >
            <!-- 内容容器：独立盒模型，解决重叠问题，增加ref用于高度判断 -->
            <div class="remark-content-box" ref="remarkContentBoxRef">
              <div
                class="remark-content-wrapper"
                :class="{ 'remark-collapsed': !isRemarkExpanded && isRemarkNeedToggle }"
              >
                <template v-if="customerDetail.remark">
                  {{ customerDetail.remark }}
                </template>
                <template v-else>
                  <span class="empty-remark-text">无客户备注信息，可在编辑页面添加相关备注</span>
                </template>
              </div>

              <!-- 展开/收起按钮：仅当内容需要折叠时显示，阻止事件冒泡 -->
              <div v-if="customerDetail.remark && isRemarkNeedToggle" class="remark-actions">
                <el-button
                  size="small"
                  link
                  class="expand-btn"
                  @click.stop="toggleRemarkExpand"
                >
                  <el-icon v-if="!isRemarkExpanded"><ArrowDown /></el-icon>
                  <el-icon v-else><ArrowUp /></el-icon>
                  {{ isRemarkExpanded ? '收起' : '展开' }}
                </el-button>
              </div>
            </div>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

<!-- 跟进记录弹窗 - 优化为更宽尺寸，适配大量数据展示 -->
<el-dialog
  v-model="followDialogVisible"
  width="1200px"
  class="unified-dialog follow-record-dialog"
  :fullscreen="false"
  @close="resetFollowSearchForm"
>
  <template #header>
    <div class="follow-dialog-header">
      <span class="unified-dialog-title">客户跟进记录（{{ currentCustomerInfo.name || '' }}）</span>
      <div class="follow-dialog-header-buttons">
        <el-button type="primary" size="small" @click="openFollowDialog('add')">
          新增跟进记录
        </el-button>
        <el-button type="success" size="small" @click="downloadFollowExcel">
          导出跟进记录
        </el-button>
      </div>
    </div>
  </template>

  <div class="follow-customer-overview">
    <el-card shadow="hover" class="overview-card">
      <el-descriptions :column="4" border size="small" class="unified-desc">
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
        <!-- 核心修改：合并联系方式，支持换行 -->
        <el-descriptions-item label="联系方式">
          <div class="contact-content-wrapper">
            {{ currentCustomerInfo.contact || '无' }}
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="公司名称">{{ currentCustomerInfo.company || '无' }}</el-descriptions-item>
        <el-descriptions-item label="客户来源">{{ currentCustomerInfo.source || '无' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentCustomerInfo.create_time || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>

  <div class="follow-top-bar">
    <el-form :inline="true" :model="followSearchForm" class="follow-search-form unified-form" size="small">
      <!-- 日期框 - 加form-item-picker -->
      <el-form-item label="跟进日期" class="form-item-picker">
        <el-date-picker
          v-model="followSearchForm.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          size="small"
          style="width: 180px;"
        ></el-date-picker>
      </el-form-item>
      <el-form-item label="跟进类型" class="form-item-picker">
        <el-select
          v-model="followSearchForm.followType"
          placeholder="请选择"
          clearable
          size="small"
          style="width: 200px;"
        >
          <el-option
            v-for="item in followTypeOptions"
            :key="item.code"
            :label="item.name"
            :value="item.code"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="跟进内容">
        <el-input
          v-model="followSearchForm.content"
          placeholder="关键词搜索"
          clearable
          @keyup.enter="getCustomerFollowList"
          size="small"
        ></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="getCustomerFollowList" size="small">查询</el-button>
        <el-button @click="resetFollowSearchForm" size="small">重置</el-button>
      </el-form-item>
    </el-form>
  </div>

  <!-- 表格包裹容器，适配宽弹窗滚动 -->
  <div class="follow-table-wrapper">
    <!-- 跟进记录表格：添加统一类名 unified-table -->
    <el-table
      v-loading="followLoading"
      :data="followList"
      border
      stripe
      class="unified-table"
      style="width: 100%;"
      highlight-current-row
      @row-dblclick="handleFollowRowDblClick"
      size="small"
    >
      <el-table-column prop="follow_date" label="跟进日期" width="120" align="center"></el-table-column>
      <!-- 关键修改：调大跟进类型列宽度 -->
      <el-table-column
        prop="follow_type"
        label="跟进类型"
        width="110"
        align="center"
      >
        <template #default="scope">
          <el-tag :type="getFollowTypeTagType(scope.row.follow_type)" size="small">
            {{ getFollowTypeLabel(scope.row.follow_type) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="content" label="跟进内容" min-width="400" align="left">
        <template #default="scope">
          <div class="follow-content-wrapper">
            {{ scope.row.content || '无详细内容' }}
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="recorder_name" label="记录人" width="100" align="center"></el-table-column>
      <el-table-column prop="create_time" label="创建时间" width="180" align="center"></el-table-column>
      <el-table-column label="操作" width="150" align="center">
        <template #default="scope">
          <div class="operation-buttons follow-operation-buttons">
            <el-button size="small" type="primary" @click="openFollowDialog('edit', scope.row)">
              编辑
            </el-button>
            <el-button
              size="small"
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

  <!-- 跟进记录分页，适配宽弹窗 -->
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
    ></el-pagination>
  </div>

  <!-- 跟进记录新增/编辑弹窗，适配宽弹窗协调感 -->
  <el-dialog
    v-model="followFormVisible"
    :title="followFormTitle"
    width="700px"
    @close="resetFollowForm"
    size="small"
    class="unified-dialog"
  >
    <el-form
      ref="followFormRef"
      :model="followForm"
      :rules="followFormRules"
      label-width="100px"
      class="unified-form"
      size="small"
    >
      <!-- 日期框 - 加form-item-picker -->
      <el-form-item label="跟进日期" prop="follow_date" class="form-item-picker">
        <el-date-picker
          v-model="followForm.follow_date"
          type="date"
          placeholder="请选择跟进日期"
          style="width: 100%"
          value-format="YYYY-MM-DD"
          size="small"
          :disabled="false"
        ></el-date-picker>
      </el-form-item>
      <!-- 下拉框 - 加form-item-picker | 可选优化：保持100%宽度，适配弹窗布局 -->
      <el-form-item label="跟进类型" prop="follow_type" class="form-item-picker">
        <el-select v-model="followForm.follow_type" placeholder="请选择跟进类型" filterable style="width: 100%" size="small">
          <el-option
            v-for="item in followTypeOptions"
            :key="item.code"
            :label="item.name"
            :value="item.code"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="跟进内容" prop="content">
        <el-input
          v-model="followForm.content"
          type="textarea"
          :rows="8"
          placeholder="请详细输入跟进内容（包括沟通结果、后续计划等）"
          resize="vertical"
        ></el-input>
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
    <el-dialog v-model="quoteDialogVisible" title="客户报价记录" width="1280px" class="unified-dialog quote-record-dialog">
      <div class="quote-header">
        <el-button type="primary" @click="openQuoteDialog('add')">
          新增报价记录
        </el-button>
      </div>
      <!-- 重构后的报价记录表格：核心匹配指定表头，添加统一类名 unified-table -->
      <el-table
        v-loading="quoteLoading"
        :data="quoteList"
        border
        stripe
        style="width: 100%; margin-top: 10px"
        class="unified-table quote-main-table"
        row-key="quote_id"
      >
        <!-- 报价日期 -->
        <el-table-column prop="quote_date" label="报价日期" width="120" align="center">
          <template #default="scope">
            {{ scope.row.quote_date || '-' }}
          </template>
        </el-table-column>
        <!-- 报价状态：带标签样式 -->
        <el-table-column prop="status" label="报价状态" width="100" align="center">
          <template #default="scope">
            <el-tag
              :type="scope.row.status === 'quoted' ? 'primary' : scope.row.status === 'confirmed' ? 'success' : 'danger'"
            >
              {{ getQuoteStatusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <!-- 报价类型：纱线/面料/自定义 -->
        <el-table-column prop="quote_type_label" label="报价类型" width="120" align="center">
          <template #default="scope">
            {{ scope.row.quote_type_label || '其他' }}
          </template>
        </el-table-column>
        <!-- 支数：统一字段，空值显示- -->
        <el-table-column prop="unified_count" label="支数" width="80" align="center">
          <template #default="scope">
            {{ scope.row.unified_count || '-' }}
          </template>
        </el-table-column>
        <!-- RMB价格：保留2位小数，单位元/KG -->
        <el-table-column prop="unified_rmb_price" label="RMB价格(元/KG)" width="140" align="center">
          <template #default="scope">
            {{ scope.row.unified_rmb_price ? scope.row.unified_rmb_price.toFixed(2) : '-' }}
          </template>
        </el-table-column>
        <!-- 操作列：编辑/删除/计算明细 + 状态变更（确认/作废）+ 新增下载报价单 -->
        <el-table-column label="操作" width="650" align="center">
          <template #default="scope">
            <div class="operation-buttons quote-op-buttons" style="gap: 4px;">
              <!-- 编辑 -->
              <el-button size="small" type="primary" @click="openQuoteDialog('edit', scope.row)">
                编辑
              </el-button>
              <!-- 计算明细：核心功能 -->
              <el-button
                size="small"
                type="info"
                @click="viewQuoteCalculation(scope.row.quote_id)"
              >
                计算明细
              </el-button>
              <!-- 新增：下载报价单按钮 -->
              <el-button
                size="small"
                type="info"
                class="download-quote-btn"
                @click="handleDownloadQuoteExcel(scope.row.quote_id)"
                :loading="quoteDownloadLoading[scope.row.quote_id]"
              >
                {{ scope.row.calc_type === 'yarn' ? '下载纱线报价单' : '下载面料报价单' }}
              </el-button>
              <!-- 确认按钮 -->
              <el-button
                size="small"
                :type="scope.row.status === 'confirmed' ? 'success' : 'primary'"
                @click="handleChangeQuoteStatus(scope.row.quote_id, 'confirmed')"
                :loading="quoteStatusLoading[scope.row.quote_id]"
              >
                确认
              </el-button>
              <!-- 作废按钮 -->
              <el-button
                size="small"
                type="warning"
                @click="handleChangeQuoteStatus(scope.row.quote_id, 'invalid')"
                :loading="quoteStatusLoading[scope.row.quote_id]"
              >
                作废
              </el-button>
              <!-- 删除：超级管理员可见 -->
              <el-button
                size="small"
                type="danger"
                @click="handleDeleteQuote(scope.row.quote_id)"
                v-if="isSuperAdmin"
              >
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <!-- 新增/编辑报价弹窗【美化核心】 -->
      <el-dialog
        v-model="quoteFormVisible"
        :title="quoteFormTitle"
        width="1400px"
        max-width="98vw"
        class="unified-dialog quote-form-dialog"
        @close="resetQuoteForm"
      >
        <!-- 表单滚动容器，优化长内容滚动体验 -->
        <div class="quote-form-scroll-wrapper">
          <el-form
            ref="quoteFormRef"
            :model="quoteForm"
            :rules="quoteFormRules"
            label-width="120px"
            class="unified-form quote-form-container"
          >
            <!-- 1. 报价基础信息区 - 浅背景+标题，区分核心信息 -->
            <div class="quote-form-group">
              <h3 class="unified-dialog-title quote-form-group-title"><i class="el-icon-document"></i> 报价基础信息</h3>
              <el-row :gutter="16" class="quote-form-row">
                <!-- 日期框 - 加form-item-picker -->
                <el-col :span="8">
                  <el-form-item label="报价日期" prop="quote_date" class="required-item form-item-picker">
                    <el-date-picker
                      v-model="quoteForm.quote_date"
                      type="date"
                      placeholder="请选择报价日期"
                      style="width: 100%"
                      value-format="YYYY-MM-DD"
                      class="quote-form-input"
                    ></el-date-picker>
                  </el-form-item>
                </el-col>
                <!-- 日期框 - 加form-item-picker -->
                <el-col :span="8">
                  <el-form-item label="有效截止日期" prop="quote_valid_until" class="required-item form-item-picker">
                    <el-date-picker
                      v-model="quoteForm.quote_valid_until"
                      type="date"
                      placeholder="请选择截止日期"
                      style="width: 100%"
                      value-format="YYYY-MM-DD"
                      class="quote-form-input"
                    ></el-date-picker>
                  </el-form-item>
                </el-col>
                <!-- 下拉框 - 加form-item-picker -->
                <el-col :span="8">
                  <el-form-item label="贸易术语" prop="trade_terms" class="required-item form-item-picker">
                    <el-select
                      v-model="quoteForm.trade_terms"
                      placeholder="请选择贸易术语"
                      style="width: 100%"
                      allow-create
                      filterable
                      default-first-option
                      class="quote-form-select"
                    >
                      <el-option label="FOB" value="FOB"></el-option>
                      <el-option label="CNF" value="CNF"></el-option>
                      <el-option label="CIF" value="CIF"></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
            </div>
            <!-- 2. 计算记录选择区 - 卡片包裹+标题，视觉分组 -->
            <div class="quote-form-group">
              <h3 class="unified-dialog-title quote-form-group-title"><i class="el-icon-calculator"></i> 计算记录选择</h3>
              <el-form-item  prop="calc_id" class="calc-record-item">
                <el-tabs
                  v-model="activeCalcTab"
                  type="card"
                  class="calc-record-tabs"
                  @tab-change="handleCalcTabChange"
                  :lazy="true"
                >
                  <!-- 纱线计算记录标签页 -->
                  <el-tab-pane label="纱线计算记录" name="yarn">
                    <div class="calc-table-wrapper">
                      <!-- 纱线计算表格：添加统一类名 unified-table -->
                      <el-table
                        v-loading="calcLoading"
                        :data="yarnCalculationList"
                        border
                        stripe
                        row-key="calc_id"
                        ref="yarnCalcTable"
                        @selection-change="handleYarnSelectionChange"
                        class="unified-table calc-select-table"
                      >
                        <el-table-column type="selection" width="55" align="center"></el-table-column>
                        <el-table-column prop="count" label="支数" width="60" align="center"></el-table-column>
                        <el-table-column prop="color" label="颜色" width="100" align="center"></el-table-column>
                        <el-table-column prop="composition" label="成分组成" min-width="400" align="center"></el-table-column>
                        <el-table-column prop="rmb_price" label="RMB价格(cny/kg)" width="100" align="center">
                          <template #default="scope">
                            {{ scope.row.rmb_price ? scope.row.rmb_price.toFixed(2) : '-' }}
                          </template>
                        </el-table-column>
                        <el-table-column prop="calc_exchange_rate" label="计算汇率" width="100" align="center">
                          <template #default="scope">
                            {{ scope.row.calc_exchange_rate ? scope.row.calc_exchange_rate.toFixed(4) : '-' }}
                          </template>
                        </el-table-column>
                        <el-table-column prop="fob_price" label="FOB价格(usd/kg)" width="100" align="center">
                          <template #default="scope">
                            {{ scope.row.fob_price ? scope.row.fob_price.toFixed(2) : '-' }}
                          </template>
                        </el-table-column>
                        <el-table-column prop="create_time" label="创建时间" width="180" align="center"></el-table-column>
                      </el-table>
                      <el-pagination
                        @size-change="handleYarnSizeChange"
                        @current-change="handleYarnCurrentChange"
                        :current-page="yarnCurrentPage"
                        :page-sizes="[10, 20, 50]"
                        :page-size="yarnPageSize"
                        layout="total, sizes, prev, pager, next, jumper"
                        :total="yarnTotal"
                        style="text-align: right; margin-top: 10px"
                        size="small"
                        class="calc-pagination"
                      ></el-pagination>
                      <!-- 选中行展示区 -->
                      <div class="selected-table-wrapper" v-if="selectedYarnRows.length">
                        <h4 class="unified-dialog-title selected-table-title">已选中纱线记录 ({{ selectedYarnRows.length }})</h4>
                        <!-- 选中纱线表格：添加统一类名 unified-table -->
                        <el-table
                          :data="selectedYarnRows"
                          border
                          stripe
                          row-key="calc_id"
                          class="unified-table selected-calc-table"
                        >
                          <el-table-column prop="count" label="支数" width="60" align="center"></el-table-column>
                          <el-table-column prop="color" label="颜色" width="90" align="center"></el-table-column>
                          <el-table-column prop="composition" label="成分组成" min-width="350" align="center"></el-table-column>
                          <el-table-column prop="rmb_price" label="RMB价格(cny/kg)" width="90" align="center">
                            <template #default="scope">
                              {{ scope.row.rmb_price ? scope.row.rmb_price.toFixed(2) : '-' }}
                            </template>
                          </el-table-column>
                          <el-table-column prop="calc_exchange_rate" label="计算汇率" width="90" align="center">
                            <template #default="scope">
                              {{ scope.row.calc_exchange_rate ? scope.row.calc_exchange_rate.toFixed(4) : '-' }}
                            </template>
                          </el-table-column>
                          <el-table-column
                            :label="`${quoteForm.trade_terms || 'FOB'} 价格(usd/kg)`"
                            width="120"
                            align="center"
                            class="price-header-column"
                          >
                            <template #default="scope">
                              <el-input
                                v-model.number="scope.row.quotePrice"
                                type="number"
                                min="0"
                                step="0.01"
                                style="width: 100%;"
                                size="small"
                                @input="handleQuotePriceChange(scope.row)"
                                class="quote-price-input"
                              ></el-input>
                            </template>
                          </el-table-column>
                          <el-table-column label="数量(kg)" width="110" align="center">
                            <template #default="scope">
                              <el-input
                                v-model.number="scope.row.quantity"
                                type="number"
                                min="0"
                                controls="false"
                                @input="handleQuantityChange(scope.row.quantity, scope.row)"
                                style="width: 80px;"
                                class="quote-quantity-input"
                              ></el-input>
                            </template>
                          </el-table-column>
                          <el-table-column label="金额(USD)" width="100" align="center">
                            <template #default="scope">
                              {{ scope.row.amount || 0.00 }}
                            </template>
                          </el-table-column>
                          <el-table-column label="操作" width="100" align="center">
                            <template #default="scope">
                              <el-button
                                size="small"
                                type="danger"
                                @click="handleDeleteSelectedRow('yarn', scope.row)"
                                class="delete-selected-btn"
                              >
                                删除
                              </el-button>
                            </template>
                          </el-table-column>
                        </el-table>
                      </div>
                    </div>
                  </el-tab-pane>

                  <!-- 面料计算记录标签页 -->
                  <el-tab-pane label="面料计算记录" name="fabric">
                    <div class="calc-table-wrapper">
                      <!-- 面料计算表格：添加统一类名 unified-table -->
                      <el-table
                        v-loading="calcLoading"
                        :data="fabricCalculationList"
                        border
                        stripe
                        row-key="calc_id"
                        ref="fabricCalcTable"
                        @selection-change="handleFabricSelectionChange"
                        class="unified-table calc-select-table"
                      >
                        <el-table-column type="selection" width="55" align="center"></el-table-column>
                        <el-table-column prop="weight_gsm" label="克重(g/m²)" width="70" align="center"></el-table-column>
                        <el-table-column prop="width_cm" label="幅宽(cm)" width="60" align="center"></el-table-column>
                        <el-table-column prop="count" label="支数" width="60" align="center"></el-table-column>
                        <el-table-column prop="composition" label="成分组成" min-width="400" align="center"></el-table-column>
                        <el-table-column prop="rmb_price" label="RMB价格(cny/kg)" width="90" align="center">
                          <template #default="scope">
                            {{ scope.row.rmb_price ? scope.row.rmb_price.toFixed(2) : '-' }}
                          </template>
                        </el-table-column>
                        <el-table-column prop="calc_exchange_rate" label="计算汇率" width="90" align="center">
                          <template #default="scope">
                            {{ scope.row.calc_exchange_rate ? scope.row.calc_exchange_rate.toFixed(4) : '-' }}
                          </template>
                        </el-table-column>
                        <el-table-column prop="fob_price" label="FOB价格(usd/kg)" width="90" align="center">
                          <template #default="scope">
                            {{ scope.row.fob_price ? scope.row.fob_price.toFixed(2) : '-' }}
                          </template>
                        </el-table-column>
                        <el-table-column prop="create_time" label="创建时间" width="180" align="center"></el-table-column>
                      </el-table>
                      <el-pagination
                        @size-change="handleFabricSizeChange"
                        @current-change="handleFabricCurrentChange"
                        :current-page="fabricCurrentPage"
                        :page-size="fabricPageSize"
                        layout="total, sizes, prev, pager, next, jumper"
                        :total="fabricTotal"
                        style="text-align: right; margin-top: 10px"
                        size="small"
                        class="calc-pagination"
                      ></el-pagination>
                      <!-- 选中行展示区 -->
                      <div class="selected-table-wrapper" v-if="selectedFabricRows.length">
                        <h4 class="unified-dialog-title selected-table-title">已选中面料记录 ({{ selectedFabricRows.length }})</h4>
                        <!-- 选中面料表格：添加统一类名 unified-table -->
                        <el-table
                          :data="selectedFabricRows"
                          border
                          stripe
                          row-key="calc_id"
                          class="unified-table selected-calc-table"
                        >
                          <el-table-column prop="weight_gsm" label="克重(g/m²)" width="70" align="center"></el-table-column>
                          <el-table-column prop="width_cm" label="幅宽(cm)" width="60" align="center"></el-table-column>
                          <el-table-column prop="count" label="支数" width="60" align="center"></el-table-column>
                          <el-table-column prop="composition" label="成分组成" min-width="340" align="center"></el-table-column>
                          <el-table-column prop="rmb_price" label="RMB价格(cny/kg)" width="80" align="center">
                            <template #default="scope">
                              {{ scope.row.rmb_price ? scope.row.rmb_price.toFixed(2) : '-' }}
                            </template>
                          </el-table-column>
                          <el-table-column prop="calc_exchange_rate" label="计算汇率" width="90" align="center">
                            <template #default="scope">
                              {{ scope.row.calc_exchange_rate ? scope.row.calc_exchange_rate.toFixed(4) : '-' }}
                            </template>
                          </el-table-column>
                          <el-table-column
                            :label="`${quoteForm.trade_terms || 'FOB'} 价格(usd/kg)`"
                            width="120"
                            align="center"
                            class="price-header-column"
                          >
                            <template #default="scope">
                              <el-input
                                v-model.number="scope.row.quotePrice"
                                type="number"
                                min="0"
                                step="0.01"
                                style="width: 100%;"
                                size="small"
                                @input="handleQuotePriceChange(scope.row)"
                                class="quote-price-input"
                              ></el-input>
                            </template>
                          </el-table-column>
                          <el-table-column label="数量(kg)" width="110" align="center">
                            <template #default="scope">
                              <el-input
                                v-model.number="scope.row.quantity"
                                type="number"
                                min="0"
                                @input="handleQuantityChange(scope.row.quantity, scope.row)"
                                style="width: 80px;"
                                class="quote-quantity-input"
                              ></el-input>
                            </template>
                          </el-table-column>
                          <el-table-column label="金额(USD)" width="100" align="center">
                            <template #default="scope">
                              {{ scope.row.amount || 0.00 }}
                            </template>
                          </el-table-column>
                          <el-table-column label="操作" width="90" align="center">
                            <template #default="scope">
                              <el-button
                                size="small"
                                type="danger"
                                @click="handleDeleteSelectedRow('fabric', scope.row)"
                                class="delete-selected-btn"
                              >
                                删除
                              </el-button>
                            </template>
                          </el-table-column>
                        </el-table>
                      </div>
                    </div>
                  </el-tab-pane>
                </el-tabs>
              </el-form-item>
            </div>


            <!-- 3. 贸易条款区 - 分组展示，逻辑更清晰 -->
            <div class="quote-form-group">
              <h3 class="unified-dialog-title quote-form-group-title"><i class="el-icon-rule"></i> 贸易条款</h3>
              <el-row :gutter="16" class="quote-form-row">
                <el-col :span="12">
                  <el-form-item label="付款方式" prop="payment_terms" class="required-item">
                    <el-input
                      v-model="quoteForm.payment_terms"
                      placeholder="请输入付款方式"
                      type="textarea"
                      class="quote-form-textarea unified-input"
                    ></el-input>
                  </el-form-item>
                </el-col>
                <!-- 日期框 - 加form-item-picker -->
                <el-col :span="12">
                  <el-form-item label="交货期" prop="delivery_date" class="required-item form-item-picker">
                    <el-date-picker
                      v-model="quoteForm.delivery_date"
                      type="date"
                      placeholder="请选择交货日期"
                      style="width: 100%"
                      value-format="YYYY-MM-DD"
                      class="quote-form-input"
                    ></el-date-picker>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="16" class="quote-form-row">
                <el-col :span="12">
                  <el-form-item label="检验条款" prop="inspection_terms" class="required-item">
                    <el-input
                      v-model="quoteForm.inspection_terms"
                      placeholder="请输入检验条款"
                      type="textarea"
                      class="quote-form-textarea unified-input"
                    ></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="不可抗力" prop="force_majeure" class="required-item">
                    <el-input
                      v-model="quoteForm.force_majeure"
                      placeholder="请输入不可抗力条款"
                      type="textarea"
                      class="quote-form-textarea unified-input"
                    ></el-input>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="16" class="quote-form-row">
                <el-col :span="12">
                  <el-form-item label="异议处理" prop="objection_handling" class="required-item">
                    <el-input
                      v-model="quoteForm.objection_handling"
                      placeholder="请输入异议处理方式"
                      type="textarea"
                      class="quote-form-textarea unified-input"
                    ></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="报价备注" prop="quote_remark" class="required-item">
                    <el-input
                      v-model="quoteForm.quote_remark"
                      placeholder="请输入报价备注信息"
                      type="textarea"
                      class="quote-form-textarea unified-input"
                    ></el-input>
                  </el-form-item>
                </el-col>
              </el-row>
            </div>

            <!-- 4. 包装物流区 - 独立分组，适配物流信息录入 -->
            <div class="quote-form-group">
              <h3 class="unified-dialog-title quote-form-group-title"><i class="el-icon-box"></i> 包装与物流</h3>
              <el-row :gutter="16" class="quote-form-row">
                <el-col :span="8">
                  <el-form-item label="包装材料" prop="packaging_material" class="required-item">
                    <el-input
                      v-model="quoteForm.packaging_material"
                      placeholder="请输入包装材料（如：防水编织袋+纸箱）"
                      class="quote-form-input unified-input"
                    ></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="尺寸(cm)" prop="size_cm" class="required-item">
                    <el-input
                      v-model="quoteForm.size_cm"
                      placeholder="请输入尺寸（如：60x40x30，长x宽x高）"
                      class="quote-form-input unified-input"
                    ></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="重量(KG)" prop="weight_kg" class="required-item">
                    <el-input
                      v-model.number="quoteForm.weight_kg"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="请输入单箱/单批重量"
                      class="quote-form-input unified-input"
                    ></el-input>
                  </el-form-item>
                </el-col>
              </el-row>
            </div>

            <!-- 5. 收款信息区 - 最后分组，突出财务信息 -->
            <div class="quote-form-group quote-form-pay-group">
              <h3 class="unified-dialog-title quote-form-group-title"><i class="el-icon-money"></i> 收款信息</h3>
              <el-row :gutter="16" class="quote-form-row">
                <el-col :span="8">
                  <el-form-item label="收款方名称" prop="payee_name" class="required-item">
                    <el-input
                      v-model="quoteForm.payee_name"
                      placeholder="请输入收款方全称"
                      class="quote-form-input unified-input"
                    ></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="开户银行" prop="opening_bank" class="required-item">
                    <el-input
                      v-model="quoteForm.opening_bank"
                      placeholder="请输入开户银行全称"
                      class="quote-form-input unified-input"
                    ></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="银行账号" prop="bank_account" class="required-item">
                    <el-input
                      v-model="quoteForm.bank_account"
                      placeholder="请输入银行账号"
                      class="quote-form-input unified-input"
                    ></el-input>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="16" class="quote-form-row">
                <el-col :span="24">
                  <el-form-item label="汇款备注" prop="remittance_remark" class="required-item">
                    <el-input
                      v-model="quoteForm.remittance_remark"
                      placeholder="请输入汇款备注要求"
                      type="textarea"
                      class="quote-form-textarea unified-input"
                      rows="2"
                    ></el-input>
                  </el-form-item>
                </el-col>
              </el-row>
            </div>
          </el-form>
        </div>

        <!-- 弹窗底部按钮【美化】 -->
        <template #footer>
          <div class="dialog-footer quote-form-footer">
            <el-button @click="quoteFormVisible = false" class="quote-form-cancel-btn">取消</el-button>
            <el-button type="primary" @click="submitQuoteForm" class="quote-form-submit-btn">确认提交报价</el-button>
          </div>
        </template>
      </el-dialog>

      <el-dialog v-model="quoteCalculationVisible" title="纱线计算参数（数据库原始数据）" width="900px" class="unified-dialog quote-calc-detail-dialog">
        <div v-loading="calcLoading" v-if="quoteCalculationDetail?.calc_detail_data" class="calc-detail-container">
          <!-- 仅保留：纱线计算参数（数据库原始数据）卡片 -->
          <el-card shadow="hover" class="calc-detail-card">
            <template #header>
              <span class="unified-dialog-title calc-detail-title">纱线计算参数（数据库原始数据）</span>
            </template>
            <el-descriptions :column="2" border fill class="calc-params-desc unified-desc">
              <el-descriptions-item
                v-for="(value, key) in quoteCalculationDetail?.calc_detail_data"
                :key="key"
                :label="key"
              >
                {{ value || '-' }}
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
        </div>
        <div v-else class="empty-tip calc-empty-tip">暂无计算明细数据</div>
      </el-dialog>
    </el-dialog>
  </div>
</template>

<script setup>
// ============================ 1. 核心模块导入 ============================
import { ref, onMounted, reactive, getCurrentInstance, onBeforeMount, onUnmounted, nextTick, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown, ArrowUp } from '@element-plus/icons-vue'

// ============================ 2. 全局状态与常量定义 ============================
const { proxy } = getCurrentInstance()
const $axios = proxy.$axios

// 权限标识
const isSuperAdmin = ref(true)
const operatorName = ref('当前登录用户')

// 加载状态
const loading = ref(false)
const followLoading = ref(false)
const quoteLoading = ref(false)
const calcLoading = ref(false)
const quoteStatusLoading = ref({})
const quoteDownloadLoading = ref({})

// 移除：客户列表分页参数（不需要分页）
// const currentPage = ref(1)
// const pageSize = ref(10)
// const total = ref(0)

// 分页参数 - 跟进记录（保留，跟进记录仍分页）
const followCurrentPage = ref(1)
const followPageSize = ref(20)
const followTotal = ref(0)

// 分页参数 - 纱线计算记录
const yarnCurrentPage = ref(1)
const yarnPageSize = ref(10)
const yarnTotal = ref(0)

// 分页参数 - 面料计算记录
const fabricCurrentPage = ref(1)
const fabricPageSize = ref(10)
const fabricTotal = ref(0)

// 筛选表单
const searchForm = reactive({
  keyword: '',
  name: '',
  level: '',
  salesman_id: '',
  createDateRange: [],
  source: '',
  contactInfo: ''
})

const followSearchForm = reactive({
  dateRange: [],
  followType: '',
  content: ''
})

// 业务表单
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

const followForm = reactive({
  follow_id: '',
  customer_id: '',
  follow_date: '',
  follow_type: '',
  content: ''
})

const quoteForm = reactive({
  quote_id: '',
  customer_id: '',
  quote_date: '',
  quote_valid_until: '',
  trade_terms: '',
  payment_terms: 'T/T（电汇）30%预付款，70%见提单副本',
  delivery_date: '',
  inspection_terms: '货物到港后7个工作日内书面提出异议（附当地检验报告）；逾期视为无异议。',
  force_majeure: '自然灾害/战争/海关扣押等不可抗力导致的延误/无法交货双方无责，需及时通知对方。',
  objection_handling: '双方协商解决，协商不成可向合同签订地人民法院提起诉讼',
  quote_remark: '本报价单仅为业务参考，具体交易条款以双方签订的正式购销合同为准',
  packaging_material: 'PP bag',
  size_cm: '93X47X14',
  weight_kg: 25.00,
  payee_name: '福建欧美佳纺织科技有限公司',
  opening_bank: '中国建设银行股份有限公司霞浦支行',
  bank_account: '35001687207059000197',
  remittance_remark: '无',
  quote_file_path: '',
  status: 'quoted'
})

const batchAssignForm = reactive({
  target_salesman_id: ''
})

// 下拉选项
const customerLevelOptions = ref([
  { label: 'A级：多次下订单的老客户', value: 'a' },
  { label: 'B级：已经建立合作的新客户', value: 'b' },
  { label: 'C级：有寄过样品，且准备下单的客户', value: 'c' },
  { label: 'D级：重点潜在大客户，已做过被调，尚未开展合作', value: 'd' },
  { label: 'E级：普通潜在客户，有询价有意向合作可能，但非大客户', value: 'e' },
  { label: 'F级：仅一次合作，无复购 无再询价的客户', value: 'f' },
  { label: 'G级：仅询价，无回音的客户', value: 'g' }
])

const salesmanList = ref([])
const followTypeOptions = ref([])
const quoteStatusOptions = ref([
  { label: '已报价', value: 'quoted' },
  { label: '已确认', value: 'confirmed' },
  { label: '已作废', value: 'invalid' }
])

// 业务数据列表
const customerList = ref([])
const followList = ref([])
const quoteList = ref([])
const yarnCalculationList = ref([])
const fabricCalculationList = ref([])

// 弹窗状态
const customerDialogVisible = ref(false)
const customerDialogTitle = ref('')
const customerFormType = ref('add')
const customerFormRef = ref(null)

const customerDetailVisible = ref(false)
const customerDetail = reactive({})

const followDialogVisible = ref(false)
const followFormVisible = ref(false)
const followFormTitle = ref('')
const followFormType = ref('add')
const followFormRef = ref(null)

const quoteDialogVisible = ref(false)
const quoteFormVisible = ref(false)
const quoteFormTitle = ref('')
const quoteFormType = ref('add')
const quoteFormRef = ref(null)

const quoteCalculationVisible = ref(false)
const quoteCalculationDetail = reactive({
  quote_info: {},
  calculation_base: {},
  calc_detail_data: {}
})

const batchAssignDialogVisible = ref(false)
const batchAssignFormRef = ref(null)

// 选中状态（简化：移除全局跨页选中，因为没有分页了）
const selectedCustomers = ref([])
// 移除：全局选中客户的Map（不需要分页，无需跨页记忆）
// const globalSelectedCustomers = ref(new Map())
const customerTableRef = ref(null)
const activeCalcTab = ref('yarn')
const globalSelectedYarnRecords = ref(new Map()) // key: calc_id, value: 完整记录
const globalSelectedFabricRecords = ref(new Map()) // key: calc_id, value: 完整记录
const selectedYarnCalcIds = ref(new Set()) // 仅用于当前页勾选状态
const selectedFabricCalcIds = ref(new Set()) // 仅用于当前页勾选状态
const yarnCalcTable = ref(null)
const fabricCalcTable = ref(null)

// 上下文数据
const currentCustomerId = ref('')
const currentCustomerName = ref('')
const currentCustomerInfo = reactive({})

// DOM引用
const mainTableWrapperRef = ref(null)
const remarkContentBoxRef = ref(null)
const isRemarkExpanded = ref(false)
const isRemarkNeedToggle = ref(false)

// 选中行数据
const selectedYarnRows = ref([])
const selectedFabricRows = ref([])
const currentSelectedRows = ref([])

// 价格计算工具
const getOriginalPriceByTerm = (row, term) => {
  if (!term || !row) return 0;
  const priceField = term.toLowerCase() === 'fob'
    ? 'fob_price'
    : term.toLowerCase() === 'cnf'
      ? 'cnf_price'
      : 'cif_price';
  const finalPriceField = row.calc_type === 'yarn'
    ? `yarn_${priceField}`
    : `fabric_${priceField}`;
  const priceValue = row[priceField] || row[finalPriceField] || 0;
  return Number(priceValue).toFixed(2) * 1;
};

// 纱线选择变化处理 - 支持跨页记忆
const handleYarnSelectionChange = (val) => {
  // 1. 更新当前页选中ID
  selectedYarnCalcIds.value = new Set(val.map(item => item.calc_id));

  // 2. 更新全局存储（仅新增当前页选中的记录，不再删除跨页记录）
  val.forEach(item => {
    const existRow = globalSelectedYarnRecords.value.get(item.calc_id);
    const defaultPrice = existRow?.quotePrice ?? getOriginalPriceByTerm(item, quoteForm.trade_terms);
    const defaultQty = existRow?.quantity ?? 0;
    const record = {
      ...item,
      priceType: quoteForm.trade_terms || 'FOB',
      quotePrice: defaultPrice,
      quantity: defaultQty,
      amount: calculateAmount({ quotePrice: defaultPrice, quantity: defaultQty })
    };
    globalSelectedYarnRecords.value.set(item.calc_id, record);
  });

  // 3. 仅删除当前页中取消选中的记录（关键修复：不再删除跨页记录）
  yarnCalculationList.value.forEach(item => {
    if (!selectedYarnCalcIds.value.has(item.calc_id)) {
      globalSelectedYarnRecords.value.delete(item.calc_id);
    }
  });

  // 4. 强制从全局存储更新选中行展示列表
  selectedYarnRows.value = Array.from(globalSelectedYarnRecords.value.values());

  // 5. 清空面料选中状态（保持互斥）
  globalSelectedFabricRecords.value.clear();
  selectedFabricCalcIds.value.clear();
  selectedFabricRows.value = [];
  fabricCalcTable.value && fabricCalcTable.value.clearSelection();

  nextTick(() => {
    yarnCalcTable.value.doLayout();
  });
};

// 面料选择变化处理 - 支持跨页记忆
const handleFabricSelectionChange = (val) => {
  // 1. 更新当前页选中ID
  selectedFabricCalcIds.value = new Set(val.map(item => item.calc_id));

  // 2. 更新全局存储（仅新增当前页选中的记录，不再删除跨页记录）
  val.forEach(item => {
    const existRow = globalSelectedFabricRecords.value.get(item.calc_id);
    const defaultPrice = existRow?.quotePrice ?? getOriginalPriceByTerm(item, quoteForm.trade_terms);
    const defaultQty = existRow?.quantity ?? 0;
    const record = {
      ...item,
      priceType: quoteForm.trade_terms || 'FOB',
      quotePrice: defaultPrice,
      quantity: defaultQty,
      amount: calculateAmount({ quotePrice: defaultPrice, quantity: defaultQty })
    };
    globalSelectedFabricRecords.value.set(item.calc_id, record);
  });

  // 3. 仅删除当前页中取消选中的记录（关键修复：不再删除跨页记录）
  fabricCalculationList.value.forEach(item => {
    if (!selectedFabricCalcIds.value.has(item.calc_id)) {
      globalSelectedFabricRecords.value.delete(item.calc_id);
    }
  });

  // 4. 强制从全局存储更新选中行展示列表
  selectedFabricRows.value = Array.from(globalSelectedFabricRecords.value.values());

  // 5. 清空纱线选中状态（保持互斥）
  globalSelectedYarnRecords.value.clear();
  selectedYarnCalcIds.value.clear();
  selectedYarnRows.value = [];
  yarnCalcTable.value && yarnCalcTable.value.clearSelection();

  nextTick(() => {
    fabricCalcTable.value.doLayout();
  });
};
// ============================ 3. 表单校验规则 ============================
const customerFormRules = reactive({
  name: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
  country: [{ required: true, message: '请输入国家/地区', trigger: 'blur' }],
  salesman_id: [{ required: true, message: '请选择负责业务员', trigger: 'change' }],
  level: [{ required: true, message: '请选择客户等级', trigger: 'change' }]
})

const followFormRules = reactive({
  follow_date: [{ required: true, message: '请选择跟进日期', trigger: 'change' }],
  follow_type: [{ required: true, message: '请选择跟进类型', trigger: 'change' }],
  content: [{ required: true, message: '请输入跟进内容', trigger: 'blur' }]
})

const quoteFormRules = reactive({
  quote_date: [{ required: true, message: '请选择报价日期', trigger: 'change' }],
  quote_valid_until: [{ required: true, message: '请选择报价有效截止日期', trigger: 'change' }],
  trade_terms: [{ required: true, message: '请选择/输入贸易术语', trigger: 'blur' }],
  payment_terms: [{ required: true, message: '请输入付款方式', trigger: 'blur' }],
  delivery_date: [{ required: true, message: '请选择交货日期', trigger: 'change' }],
  inspection_terms: [{ required: true, message: '请输入检验条款', trigger: 'blur' }],
  force_majeure: [{ required: true, message: '请输入不可抗力条款', trigger: 'blur' }],
  objection_handling: [{ required: true, message: '请输入异议处理方式', trigger: 'blur' }],
  quote_remark: [{ required: true, message: '请输入报价备注', trigger: 'blur' }],
  packaging_material: [{ required: true, message: '请输入包装材料', trigger: 'blur' }],
  size_cm: [{ required: true, message: '请输入尺寸（如：60x40x30）', trigger: 'blur' }],
  weight_kg: [{
    required: true,
    message: '请输入重量（KG）',
    trigger: 'blur',
    validator: (rule, value, callback) => {
      if (value < 0) callback(new Error('重量不能为负数'))
      else callback()
    }
  }],
  payee_name: [{ required: true, message: '请输入收款方名称', trigger: 'blur' }],
  opening_bank: [{ required: true, message: '请输入开户银行', trigger: 'blur' }],
  bank_account: [{ required: true, message: '请输入银行账号', trigger: 'blur' }],
  remittance_remark: [{ required: true, message: '请输入汇款备注', trigger: 'blur' }]
})

const batchAssignFormRules = reactive({
  target_salesman_id: [{ required: true, message: '请选择目标业务员', trigger: 'change' }]
})

// ============================ 4. 生命周期与监听 ============================
let resizeObserver = null
let originalOnError = null

onBeforeMount(() => {
  originalOnError = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    let errorMessage = message
    if (error) {
      errorMessage = error.message || JSON.stringify(error) || message
    }
    const isResizeObserverBenignError =
      typeof errorMessage === 'string' &&
      errorMessage.toLowerCase().includes('resizeobserver loop completed with undelivered notifications');
    if (isResizeObserverBenignError) {
      console.debug('忽略ResizeObserver良性警告：', errorMessage);
      return true;
    }
    if (originalOnError) {
      return originalOnError(errorMessage, source, lineno, colno, error);
    }
    return false;
  };
})

// 标签页切换监听
watch(activeCalcTab, (newVal) => {
  currentSelectedRows.value = newVal === 'yarn' ? selectedYarnRows.value : selectedFabricRows.value
}, { immediate: true })

// 贸易术语变化监听
watch(() => quoteForm.trade_terms, (newTerm) => {
  if (!newTerm) return;
  const updateRow = (row) => {
    row.priceType = newTerm;
    row.amount = calculateAmount(row);
  };
  selectedYarnRows.value.forEach(updateRow);
  selectedFabricRows.value.forEach(updateRow);
  selectedYarnRows.value = [...selectedYarnRows.value];
  selectedFabricRows.value = [...selectedFabricRows.value];
  nextTick(() => {
    yarnCalcTable.value && yarnCalcTable.value.doLayout();
    fabricCalcTable.value && fabricCalcTable.value.doLayout();
  });
}, { immediate: true });

// 选中ID变化监听
watch([selectedYarnCalcIds, selectedFabricCalcIds], () => {
  nextTick(() => {
    syncSelectedRows();
  });
}, { deep: true });

// 金额计算
const calculateAmount = (row) => {
  const quotePrice = Number(row.quotePrice) || 0;
  const quantity = Number(row.quantity) || 0;
  return quotePrice * quantity;
};

const handleQuantityChange = (value, row) => {
  // 1. 校验并格式化数量值
  const newQuantity = Number(value) >= 0.01 ? Number(value) : 0;
  row.quantity = newQuantity;
  row.amount = calculateAmount(row);

  // 2. 更新展示数组
  const targetArr = activeCalcTab.value === 'yarn' ? selectedYarnRows.value : selectedFabricRows.value;
  const index = targetArr.findIndex(item => item.calc_id === row.calc_id);
  if (index > -1) {
    targetArr[index] = { ...targetArr[index], quantity: row.quantity, amount: row.amount };
    // 触发响应式更新
    if (activeCalcTab.value === 'yarn') {
      selectedYarnRows.value = [...selectedYarnRows.value];
    } else {
      selectedFabricRows.value = [...selectedFabricRows.value];
    }
  }

  // 3. 核心修复：同步更新全局存储（关键！）
  if (activeCalcTab.value === 'yarn' && globalSelectedYarnRecords.value.has(row.calc_id)) {
    const globalRow = globalSelectedYarnRecords.value.get(row.calc_id);
    globalRow.quantity = newQuantity;
    globalRow.amount = calculateAmount(globalRow);
    globalSelectedYarnRecords.value.set(row.calc_id, globalRow);
  } else if (activeCalcTab.value === 'fabric' && globalSelectedFabricRecords.value.has(row.calc_id)) {
    const globalRow = globalSelectedFabricRecords.value.get(row.calc_id);
    globalRow.quantity = newQuantity;
    globalRow.amount = calculateAmount(globalRow);
    globalSelectedFabricRecords.value.set(row.calc_id, globalRow);
  }
};

// 报价修改处理 - 补充：同步更新全局存储
const handleQuotePriceChange = (row) => {
  // 1. 校验并格式化报价
  const newPrice = row.quotePrice >= 0.01 ? Number(row.quotePrice).toFixed(2) * 1 : 0;
  row.quotePrice = newPrice;
  row.amount = calculateAmount(row);

  // 2. 更新展示数组
  const targetArr = activeCalcTab.value === 'yarn' ? selectedYarnRows.value : selectedFabricRows.value;
  const index = targetArr.findIndex(item => item.calc_id === row.calc_id);
  if (index > -1) {
    targetArr[index] = { ...targetArr[index], quotePrice: row.quotePrice, amount: row.amount };
    if (activeCalcTab.value === 'yarn') {
      selectedYarnRows.value = [...selectedYarnRows.value];
    } else {
      selectedFabricRows.value = [...selectedFabricRows.value];
    }
  }

  // 3. 补充：同步更新全局存储
  if (activeCalcTab.value === 'yarn' && globalSelectedYarnRecords.value.has(row.calc_id)) {
    const globalRow = globalSelectedYarnRecords.value.get(row.calc_id);
    globalRow.quotePrice = newPrice;
    globalRow.amount = calculateAmount(globalRow);
    globalSelectedYarnRecords.value.set(row.calc_id, globalRow);
  } else if (activeCalcTab.value === 'fabric' && globalSelectedFabricRecords.value.has(row.calc_id)) {
    const globalRow = globalSelectedFabricRecords.value.get(row.calc_id);
    globalRow.quotePrice = newPrice;
    globalRow.amount = calculateAmount(globalRow);
    globalSelectedFabricRecords.value.set(row.calc_id, globalRow);
  }
};


onMounted(async () => {
  await Promise.all([
    getSalesmanList(),
    getFollowTypeChoices()
  ])
  getCustomerList()

  if (mainTableWrapperRef.value) {
    try {
      resizeObserver = new ResizeObserver((entries) => {
        requestAnimationFrame(() => {
          entries.forEach((entry) => {
            if (entry && entry.contentRect) {
              console.debug('表格容器尺寸变化：', {
                width: entry.contentRect.width,
                height: entry.contentRect.height
              });
            }
          });
        });
      });
      if (mainTableWrapperRef.value instanceof Element) {
        resizeObserver.observe(mainTableWrapperRef.value);
      }
    } catch (error) {
      console.warn('ResizeObserver初始化失败：', error);
      resizeObserver = null;
    }
  }
})

// 报价日期变化监听
watch(() => quoteForm.quote_date, (newVal) => {
  if (newVal && quoteFormType.value === 'add') {
    const quoteDate = new Date(newVal)
    const validUntil = new Date(quoteDate)
    validUntil.setMonth(validUntil.getMonth() + 1)
    quoteForm.quote_valid_until = validUntil.toISOString().split('T')[0]
    const deliveryDate = new Date(quoteDate)
    deliveryDate.setMonth(deliveryDate.getMonth() + 4)
    quoteForm.delivery_date = deliveryDate.toISOString().split('T')[0]
  }
}, { immediate: true })

// 贸易术语变化监听（表格重布局）
watch(() => quoteForm.trade_terms, () => {
  nextTick(() => {
    yarnCalcTable.value && yarnCalcTable.value.doLayout()
    fabricCalcTable.value && fabricCalcTable.value.doLayout()
    currentSelectedRows.value = [...currentSelectedRows.value]
  })
}, { immediate: true })

onUnmounted(() => {
  try {
    if (originalOnError) {
      window.onerror = originalOnError;
      originalOnError = null;
    }
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    mainTableWrapperRef.value = null;
    remarkContentBoxRef.value = null;
  } catch (error) {
    console.warn('组件卸载清理失败：', error);
  }
})

// ============================ 5. 工具方法 ============================
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

const getTodayFormattedDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const resetCustomerDetail = () => {
  isRemarkExpanded.value = false
  isRemarkNeedToggle.value = false
}

const toggleRemarkExpand = () => {
  isRemarkExpanded.value = !isRemarkExpanded.value
}

// ============================ 6. 表单重置方法 ============================
const resetSearchForm = () => {
  searchForm.keyword = '';
  searchForm.name = '';
  searchForm.level = '';
  searchForm.salesman_id = '';
  searchForm.createDateRange = [];
  searchForm.source = '';
  searchForm.contactInfo = '';
  // 移除：分页重置（不需要分页）
  // currentPage.value = 1;

  // 清空表格选中状态
  nextTick(() => {
    if (customerTableRef.value) {
      customerTableRef.value.clearSelection();
    }
    getCustomerList();
  });
};

const resetFollowSearchForm = () => {
  followSearchForm.dateRange = []
  followSearchForm.followType = ''
  followSearchForm.content = ''
  followCurrentPage.value = 1
  getCustomerFollowList()
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
  const resetKeys = [
    'quote_id', 'quote_date', 'quote_valid_until', 'delivery_date',
    'quote_file_path', 'status'
  ]
  resetKeys.forEach(key => {
    quoteForm[key] = ''
  })
  quoteForm.customer_id = currentCustomerId.value || '';
  quoteForm.status = 'quoted'
  activeCalcTab.value = 'yarn'
  yarnCurrentPage.value = 1
  fabricCurrentPage.value = 1

  // ========== 新增：清空全局选中记录 ==========
  globalSelectedYarnRecords.value.clear();
  globalSelectedFabricRecords.value.clear();
  // ===========================================

  selectedYarnCalcIds.value.clear()
  selectedFabricCalcIds.value.clear()
  selectedYarnRows.value = []
  selectedFabricRows.value = []
  currentSelectedRows.value = []
  yarnCalculationList.value = []
  fabricCalculationList.value = []
  nextTick(() => {
    yarnCalcTable.value && yarnCalcTable.value.clearSelection()
    fabricCalcTable.value && fabricCalcTable.value.clearSelection()
    yarnCalcTable.value && yarnCalcTable.value.doLayout()
    fabricCalcTable.value && fabricCalcTable.value.doLayout()
  })
}

const resetBatchAssignForm = () => {
  if (batchAssignFormRef.value) {
    batchAssignFormRef.value.clearValidate()
  }
  batchAssignForm.target_salesman_id = ''
}

// 移除：客户列表分页相关方法（不需要分页）
// const handleSizeChange = async (val) => { ... }
// const handleCurrentChange = async (val) => { ... }

const handleCalcTabChange = async (tabName) => {
  activeCalcTab.value = tabName;
  if (tabName === 'yarn') {
    selectedFabricCalcIds.value.clear();
    selectedFabricRows.value = [];
    fabricCalcTable.value && fabricCalcTable.value.clearSelection();
  } else {
    selectedYarnCalcIds.value.clear();
    selectedYarnRows.value = [];
    yarnCalcTable.value && yarnCalcTable.value.clearSelection();
  }
  await getCalculationList(tabName);
  nextTick(() => {
    const currentTable = tabName === 'yarn' ? yarnCalcTable.value : fabricCalcTable.value;
    currentTable && currentTable.doLayout();
    currentSelectedRows.value = tabName === 'yarn' ? selectedYarnRows.value : selectedFabricRows.value;
  });
};

const setTableSelection = async (type, calcIds, historyItems) => {
  await nextTick();
  const tableRef = type === 'yarn' ? yarnCalcTable.value : fabricCalcTable.value;
  const dataList = type === 'yarn' ? yarnCalculationList.value : fabricCalculationList.value;
  const selectedRows = type === 'yarn' ? selectedYarnRows.value : selectedFabricRows.value;

  if (!tableRef || !dataList.length) return;
  tableRef.clearSelection();
  selectedRows.length = 0;

  calcIds.forEach(calcId => {
    const row = dataList.find(item => item.calc_id === calcId);
    if (!row) return;
    tableRef.toggleRowSelection(row, true);

    const historyItem = historyItems.find(item =>
      (item.calc_id_read || item.calc_id) === calcId
    );

    const quotePrice = historyItem
      ? Number(historyItem.quote_price || 0).toFixed(2) * 1
      : getOriginalPriceByTerm(row, quoteForm.trade_terms);

    const quantity = historyItem
      ? Number(historyItem.quantity_kg || 0).toFixed(2) * 1
      : 0;

    const amount = calculateAmount({ quotePrice, quantity });

    selectedRows.push({
      ...row,
      priceType: quoteForm.trade_terms || 'FOB',
      quotePrice: quotePrice,
      quantity: quantity,
      amount: amount
    });
  });

  if (type === 'yarn') {
    selectedYarnRows.value = JSON.parse(JSON.stringify(selectedRows));
  } else {
    selectedFabricRows.value = JSON.parse(JSON.stringify(selectedRows));
  }

  nextTick(() => {
    tableRef.doLayout();
  });
};

const handleFollowSizeChange = (val) => {
  const sizeNum = Number(val);
  if (isNaN(sizeNum) || sizeNum < 1 || sizeNum > 100) {
    followPageSize.value = 20;
    return;
  }
  followPageSize.value = sizeNum;
  followCurrentPage.value = 1;
  getCustomerFollowList();
};

const handleFollowCurrentChange = (val) => {
  const pageNum = Number(val);
  if (isNaN(pageNum) || pageNum < 1) {
    followCurrentPage.value = 1;
    return;
  }
  followCurrentPage.value = pageNum;
  getCustomerFollowList();
};

const handleYarnSizeChange = (val) => {
  yarnPageSize.value = val
  yarnCurrentPage.value = 1
  getCalculationList('yarn').then(() => {
    syncSelectedRows();
  })
}

const handleYarnCurrentChange = async (val) => {
  const pageNum = Number(val);
  if (isNaN(pageNum) || pageNum < 1) {
    yarnCurrentPage.value = 1;
    return;
  }
  yarnCurrentPage.value = pageNum;
  await getCalculationList('yarn');
  syncSelectedRows(); // 分页后强制同步选中状态
};

const handleFabricCurrentChange = async (val) => {
  const pageNum = Number(val);
  if (isNaN(pageNum) || pageNum < 1) {
    fabricCurrentPage.value = 1;
    return;
  }
  fabricCurrentPage.value = pageNum;
  await getCalculationList('fabric');
  syncSelectedRows(); // 分页后强制同步选中状态
};

const handleFabricSizeChange = (val) => {
  fabricPageSize.value = val
  fabricCurrentPage.value = 1
  getCalculationList('fabric').then(() => {
    syncSelectedRows();
  })
}

// ============================ 8. 核心业务接口 ============================
const getCustomerList = async () => {
  try {
    loading.value = true;
    // 移除：分页参数（不需要分页）
    // const page = Math.max(1, Number(currentPage.value) || 1);
    // const size = Math.max(1, Math.min(100, Number(pageSize.value) || 10));

    const params = {
      // 移除：分页参数
      // page,
      // size,
      keyword: searchForm.keyword ?? '',
      name: searchForm.name ?? '',
      level: searchForm.level ?? '',
      salesman_id: searchForm.salesman_id ?? '',
      start_create: searchForm.createDateRange?.[0] ?? '',
      end_create: searchForm.createDateRange?.[1] ?? '',
      source: searchForm.source ?? '',
      contact_info: searchForm.contactInfo ?? ''
    };

    Object.keys(params).forEach(key => {
      if (params[key] === '') {
        delete params[key];
      }
    });

    const res = await $axios.get('/business/customer/list/', { params });
    if (res.code === 200) {
      // 修改：直接赋值所有数据，不需要list属性（根据后端返回调整，如果后端仍返回list则保留）
      customerList.value = res.data.list || res.data || [];
      // 移除：总数（不需要分页）
      // total.value = res.data.total || 0;

      // 简化：没有分页，直接清空并重置选中状态
      nextTick(() => {
        if (customerTableRef.value && customerList.value.length) {
          customerTableRef.value.clearSelection();
        }
      });
    } else {
      ElMessage.error(res.msg || '获取客户列表失败');
    }
  } catch (error) {
    console.error('获取客户列表详细错误：', error);
    ElMessage.error(`获取客户列表失败：${error.message}`);
  } finally {
    loading.value = false;
  }
};

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

const getCalculationList = async (type = '') => {
  try {
    calcLoading.value = true;
    const params = {
      page: type === 'yarn' ? yarnCurrentPage.value : fabricCurrentPage.value,
      pageSize: type === 'yarn' ? yarnPageSize.value : fabricPageSize.value,
      calcType: type === 'yarn' ? 'yarn' : 'knitted_fabric'
    };
    const res = await $axios.get('/calculation/records/all/', { params });
    if (res.success) {
      const data = res.data.list || [];
      if (type === 'yarn') {
        yarnCalculationList.value = data;
        yarnTotal.value = res.data.total || 0;
      } else if (type === 'fabric') {
        fabricCalculationList.value = data;
        fabricTotal.value = res.data.total || 0;
      }
    } else {
      ElMessage.error(res.message || '获取计算记录失败');
    }
    await nextTick();

    if (type === 'yarn' && yarnCalcTable.value) {
      await nextTick(); // 确保表格DOM已更新
      yarnCalcTable.value.clearSelection();
      // 勾选全局存储中当前页存在的记录
      yarnCalculationList.value.forEach(item => {
        if (globalSelectedYarnRecords.value.has(item.calc_id)) {
          yarnCalcTable.value.toggleRowSelection(item, true);
        }
      });
      // 强制更新选中行展示列表
      selectedYarnRows.value = Array.from(globalSelectedYarnRecords.value.values());
    } else if (type === 'fabric' && fabricCalcTable.value) {
      await nextTick(); // 确保表格DOM已更新
      fabricCalcTable.value.clearSelection();
      // 勾选全局存储中当前页存在的记录
      fabricCalculationList.value.forEach(item => {
        if (globalSelectedFabricRecords.value.has(item.calc_id)) {
          fabricCalcTable.value.toggleRowSelection(item, true);
        }
      });
      // 强制更新选中行展示列表
      selectedFabricRows.value = Array.from(globalSelectedFabricRecords.value.values());
    }
    // =======================================================

  } catch (error) {
    ElMessage.error(`获取计算记录失败：${error.message}`);
  } finally {
    calcLoading.value = false;
    setTimeout(() => {
      nextTick(() => {
        type === 'yarn' && yarnCalcTable.value && yarnCalcTable.value.doLayout();
        type === 'fabric' && fabricCalcTable.value && fabricCalcTable.value.doLayout();
      });
    }, 50);
  }
};

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

// ============================ 9. 客户管理方法 ============================
const openCustomerDialog = (type, row = {}) => {
  customerDialogTitle.value = type === 'add' ? '新增客户' : '编辑客户'
  customerFormType.value = type
  customerDialogVisible.value = true

  if (type === 'edit') {
    customerForm.customer_id = row.customer_id ?? ''
    customerForm.name = row.name ?? ''
    customerForm.gender = row.gender ?? ''
    customerForm.country = row.country ?? ''
    customerForm.phone = row.phone ?? ''
    customerForm.email = row.email ?? ''
    customerForm.source = row.source ?? ''
    customerForm.company = row.company ?? ''
    customerForm.level = row.level ?? 'e'
    customerForm.salesman_id = row.salesman_id ?? ''
    customerForm.address = row.address ?? ''
    customerForm.remark = row.remark ?? ''
  } else {
    customerForm.level = 'e'
    customerForm.phone = ''
    customerForm.email = ''
    customerForm.address = ''
    customerForm.remark = ''
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
      isRemarkExpanded.value = false
      nextTick(() => {
        try {
          if (remarkContentBoxRef.value && customerDetail.remark) {
            const contentWrapper = remarkContentBoxRef.value.querySelector('.remark-content-wrapper')
            if (contentWrapper && typeof contentWrapper.scrollHeight === 'number') {
              isRemarkNeedToggle.value = contentWrapper.scrollHeight > 100
            } else {
              isRemarkNeedToggle.value = false
            }
          } else {
            isRemarkNeedToggle.value = false
          }
        } catch (error) {
          console.warn('计算备注高度失败：', error);
          isRemarkNeedToggle.value = false;
        }
      })
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
      // 移除：全局选中客户删除（不需要分页）
      // globalSelectedCustomers.value.delete(customerId)
      getCustomerList()
    } else {
      ElMessage.error(res.msg || '删除客户失败')
    }
  } catch (error) {
    const isCancel = error && (
      error.message === 'cancel' ||
      error.name === 'CanceledError' ||
      error.type === 'cancel' ||
      !!error.canceled ||
      (error.response === undefined && error.request === undefined)
    )

    if (!isCancel) {
      const errorMsg = (error && error.message) || '删除操作出现异常'
      ElMessage.error(`删除客户失败：${errorMsg}`)
    }
    return
  }
}

// 简化：客户选择变化处理（没有分页，直接赋值）
const handleSelectionChange = (val) => {
  selectedCustomers.value = val || [];
};

// 简化：导出客户Excel（没有分页，直接用selectedCustomers）
const downloadCustomerExcel = async () => {
  if (selectedCustomers.value.length === 0) {
    ElMessage.warning("请先选择需要导出的客户！");
    return;
  }

  try {
    const customerIds = selectedCustomers.value.map(item => item.customer_id).join(',');
    const params = { customer_ids: customerIds };

    const res = await $axios.get('/business/customer/download/', {
      params,
      responseType: 'blob'
    });

    const contentDisposition = res.headers['content-disposition'];
    let filename = '选中客户列表.xlsx';
    if (contentDisposition) {
      const matches = /filename\*?=UTF-8''([^;]+)/i.exec(contentDisposition);
      if (matches && matches[1]) {
        filename = decodeURIComponent(matches[1]);
      }
    }

    const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);

    ElMessage.success('选中客户Excel导出成功');
  } catch (error) {
    ElMessage.error(`Excel导出失败：${error.message}`);
  }
};

const handleRowDblClick = (row) => {
  openCustomerDetail(row)
}

// ============================ 10. 跟进记录方法 ============================
const openFollowTab = async (row) => {
  currentCustomerId.value = row.customer_id
  currentCustomerName.value = row.name
  followDialogVisible.value = true

  try {
    const res = await $axios.get(`/business/customer/detail/${row.customer_id}/`)
    if (res.code === 200) {
      Object.assign(currentCustomerInfo, res.data)
    }
  } catch (error) {
    console.error('获取客户概览失败：', error)
  }

  followCurrentPage.value = 1
  getCustomerFollowList()
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
  } else {
    followForm.follow_date = getTodayFormattedDate();
  }
};

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
    const isCancel =
      error.message === 'cancel' ||
      error.name === 'CanceledError' ||
      error.type === 'cancel' ||
      !!error.canceled;

    if (!isCancel) {
      const errorMsg = error.message || '未知错误';
      ElMessage.error(`删除跟进记录失败：${errorMsg}`);
    }
  }
}

const downloadFollowExcel = async () => {
  if (!currentCustomerId.value) {
    ElMessage.warning('请先选择具体客户，再进行跟进记录导出操作')
    return
  }

  try {
    followLoading.value = true
    const exportParams = {
      customer_id: currentCustomerId.value,
      start_date: followSearchForm.dateRange[0] || '',
      end_date: followSearchForm.dateRange[1] || '',
      follow_type: followSearchForm.followType || '',
      content: followSearchForm.content || ''
    }

    const res = await $axios.get('/business/customer/follow/download/', {
      params: exportParams,
      responseType: 'blob'
    })

    let fileName = `${currentCustomerName.value || '未知客户'}-跟进记录.xlsx`
    const contentDisposition = res.headers['content-disposition']
    if (contentDisposition) {
      const fileNameMatches = /filename\*?=UTF-8''([^;]+)/i.exec(contentDisposition)
      if (fileNameMatches && fileNameMatches[1]) {
        fileName = decodeURIComponent(fileNameMatches[1])
      }
    }

    const blobFile = new Blob([res.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const downloadUrl = window.URL.createObjectURL(blobFile)
    const tempLink = document.createElement('a')
    tempLink.href = downloadUrl
    tempLink.download = fileName
    document.body.appendChild(tempLink)
    tempLink.click()

    window.URL.revokeObjectURL(downloadUrl)
    document.body.removeChild(tempLink)

    ElMessage.success('跟进记录Excel导出成功，可在浏览器下载列表查看')
  } catch (error) {
    const errorMsg = error.response?.data?.msg || error.message || '未知错误'
    ElMessage.error(`跟进记录导出失败：${errorMsg}`)
  } finally {
    followLoading.value = false
  }
}

// ============================ 11. 报价记录方法 ============================
const openQuoteTab = (row) => {
  currentCustomerId.value = row.customer_id
  quoteDialogVisible.value = true
  getCustomerQuoteList()
}

const loadAllCalculationRecords = async (type) => {
  calcLoading.value = true;
  try {
    await getCalculationList(type || 'yarn');
    await nextTick();
    yarnCalcTable.value && yarnCalcTable.value.doLayout();
    fabricCalcTable.value && fabricCalcTable.value.doLayout();
  } catch (error) {
    ElMessage.error(`加载计算记录失败：${error.message}`);
  } finally {
    calcLoading.value = false;
  }
};

const handleDeleteQuote = async (quoteId) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除该报价记录吗？删除后将同时删除关联的计算明细数据！',
      '危险操作',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'error'
      }
    )
    const res = await $axios.delete(`/business/customer/quote/delete/${quoteId}/`)
    if (res.code === 200) {
      ElMessage.success('报价记录删除成功')
      getCustomerQuoteList()
    } else {
      ElMessage.error(res.msg || '删除报价记录失败')
    }
  } catch (error) {
    const isCancel = error.message === 'cancel' || error.name === 'CanceledError'
    if (!isCancel) {
      ElMessage.error(`删除报价失败：${error.message}`)
    }
  }
}

const openQuoteDialog = async (type, row = {}) => {
  quoteFormTitle.value = type === 'add' ? '新增报价记录' : '编辑报价记录'
  quoteFormType.value = type
  quoteFormVisible.value = true

  resetQuoteForm()
  quoteForm.customer_id = currentCustomerId.value;

  if (type === 'add') {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    quoteForm.quote_date = todayStr
    const nextMonth = new Date(today)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    quoteForm.quote_valid_until = nextMonth.toISOString().split('T')[0]
    quoteForm.trade_terms = 'FOB'
    await loadAllCalculationRecords('yarn')
    nextTick(() => {
      yarnCalcTable.value && yarnCalcTable.value.doLayout()
      fabricCalcTable.value && fabricCalcTable.value.doLayout()
    })
    return;
  }

  try {
    calcLoading.value = true;
    const res = await $axios.get(`/business/customer/quote/detail/${row.quote_id}/`);
    if (res.code !== 200) {
      ElMessage.error(res.msg || '获取报价详情失败，无法编辑');
      quoteFormVisible.value = false;
      return;
    }
    const quoteDetail = res.data;
    const q = quoteDetail;
    quoteForm.quote_id = q.quote_id || '';
    quoteForm.quote_date = q.quote_date || getTodayFormattedDate();
    quoteForm.quote_valid_until = q.quote_valid_until || '';
    quoteForm.trade_terms = q.trade_terms || 'FOB';
    quoteForm.payment_terms = q.payment_terms || 'T/T（电汇）30%预付款，70%见提单副本';
    quoteForm.delivery_date = q.delivery_date || '';
    quoteForm.inspection_terms = q.inspection_terms || '货物到港后7个工作日内书面提出异议（附当地检验报告）；逾期视为无异议。';
    quoteForm.force_majeure = q.force_majeure || '自然灾害/战争/海关扣押等不可抗力导致的延误/无法交货双方无责，需及时通知对方。';
    quoteForm.objection_handling = q.objection_handling || '双方协商解决，协商不成可向合同签订地人民法院提起诉讼';
    quoteForm.quote_remark = q.quote_remark || '';
    quoteForm.packaging_material = q.packaging_material || '';
    quoteForm.size_cm = q.size_cm || '';
    quoteForm.weight_kg = q.weight_kg ? Number(q.weight_kg) : 0;
    quoteForm.payee_name = q.payee_name || '';
    quoteForm.opening_bank = q.opening_bank || '';
    quoteForm.bank_account = q.bank_account || '';
    quoteForm.remittance_remark = q.remittance_remark || '';
    quoteForm.quote_file_path = q.quote_file_path || '';
    quoteForm.status = q.status || 'quoted';

    const calcItems = Array.isArray(q.calculation_items) ? q.calculation_items : [];
    if (calcItems.length === 0) {
      ElMessage.warning('该报价无关联计算明细，请重新选择');
      calcLoading.value = false;
      return;
    }
    const targetTab = q.calc_type === 'yarn' ? 'yarn' : 'fabric';
    activeCalcTab.value = targetTab;
    await loadAllCalculationRecords(targetTab);
    const historyCalcIds = calcItems.map(item => item.calc_id_read || item.calc_id).filter(Boolean);
    await setTableSelection(targetTab, historyCalcIds, calcItems);
    currentSelectedRows.value = targetTab === 'yarn' ? [...selectedYarnRows.value] : [...selectedFabricRows.value];
  } catch (error) {
    ElMessage.error(`加载报价记录失败：${error.message}`);
    quoteFormVisible.value = false;
  } finally {
    calcLoading.value = false;
  }
};

const handleDeleteSelectedRow = async (type, row) => {
  try {
    await ElMessageBox.confirm(
      '确定要取消该行的选中状态吗？',
      '提示',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 1. 取消表格勾选
    if (type === 'yarn' && yarnCalcTable.value) {
      yarnCalcTable.value.toggleRowSelection(row, false)
    } else if (type === 'fabric' && fabricCalcTable.value) {
      fabricCalcTable.value.toggleRowSelection(row, false)
    }

    // 2. 从全局存储中移除
    if (type === 'yarn') {
      globalSelectedYarnRecords.value.delete(row.calc_id);
      selectedYarnCalcIds.value.delete(row.calc_id);
      selectedYarnRows.value = Array.from(globalSelectedYarnRecords.value.values());
    } else if (type === 'fabric') {
      globalSelectedFabricRecords.value.delete(row.calc_id);
      selectedFabricCalcIds.value.delete(row.calc_id);
      selectedFabricRows.value = Array.from(globalSelectedFabricRecords.value.values());
    }

    syncSelectedRows()
    ElMessage.success('已取消该行的选中状态')
  } catch (error) {
    const isCancel = error.message === 'cancel' || error.name === 'CanceledError'
    if (!isCancel) {
      ElMessage.error('操作失败：' + error.message)
    }
  }
}

const syncSelectedRows = () => {
  // 始终从全局存储同步选中行数据
  selectedYarnRows.value = Array.from(globalSelectedYarnRecords.value.values());
  selectedFabricRows.value = Array.from(globalSelectedFabricRecords.value.values());

  currentSelectedRows.value = activeCalcTab.value === 'yarn'
    ? [...selectedYarnRows.value]
    : [...selectedFabricRows.value];

  nextTick(() => {
    yarnCalcTable.value && yarnCalcTable.value.doLayout();
    fabricCalcTable.value && fabricCalcTable.value.doLayout();
  });
};
const submitQuoteForm = async () => {
  try {
    await quoteFormRef.value.validate()
    // 从全局存储获取所有选中记录
    const allSelectedRows = [
      ...Array.from(globalSelectedYarnRecords.value.values()),
      ...Array.from(globalSelectedFabricRecords.value.values())
    ]

    if (allSelectedRows.length === 0) {
      ElMessage.warning('请至少选择一条纱线/面料计算记录！')
      return
    }

    // 收集有效数据并校验
    const invalidItems = []; // 存储无效项的提示
    const calculation_items = allSelectedRows.map(row => {
      if (!row.calc_id) {
        invalidItems.push('存在无ID的计算记录，请重新选择');
        return null;
      }
      const quotePrice = Number(row.quotePrice) || 0;
      const quantity = Number(row.quantity) || 0;
      const amountUsd = calculateAmount(row);

      // 收集所有无效提示
      const itemName = row.composition || `记录ID:${row.calc_id}`;
      if (quantity < 0.01) {
        invalidItems.push(`【${itemName}】数量不能小于0.01KG`);
      }
      if (quotePrice < 0.01) {
        invalidItems.push(`【${itemName}】报价不能小于0.01USD/KG`);
      }
      if (amountUsd < 0.01 && quantity >=0.01 && quotePrice >=0.01) {
        invalidItems.push(`【${itemName}】金额计算异常，请检查`);
      }

      // 只有全部校验通过才返回有效数据
      if (quantity >= 0.01 && quotePrice >= 0.01) {
        return {
          calc_id: row.calc_id,
          quote_price: quotePrice,
          quantity_kg: quantity,
          amount_usd: amountUsd
        };
      }
      return null;
    }).filter(Boolean);

    // 显示所有无效提示
    if (invalidItems.length > 0) {
      ElMessage.warning(`提交失败：\n${invalidItems.join('\n')}`);
      return;
    }

    if (calculation_items.length === 0) {
      ElMessage.warning('请填写有效数量和报价后提交！');
      return;
    }

    const requestData = {
      ...quoteForm,
      calculation_items: calculation_items,
      customer: quoteForm.customer_id,
    }

    Object.keys(requestData).forEach(key => {
      if (requestData[key] === '' || requestData[key] === null || requestData[key] === undefined) {
        delete requestData[key]
      }
    })

    let res
    if (quoteFormType.value === 'add') {
      res = await $axios.post('/business/customer/quote/create/', requestData)
    } else {
      res = await $axios.put(`/business/customer/quote/update/${quoteForm.quote_id}/`, requestData)
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
  if (quoteStatusLoading.value[quoteId]) return;
  try {
    const statusText = status === 'confirmed' ? '确认' : '作废';
    await ElMessageBox.confirm(
      `确定要${statusText}该报价吗？操作后可通过另一按钮切换状态！`,
      `确认${statusText}报价`,
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: status === 'confirmed' ? 'success' : 'warning',
        closeOnClickModal: false
      }
    );

    quoteStatusLoading.value = { ...quoteStatusLoading.value, [quoteId]: true };
    const res = await $axios.post(`/business/customer/quote/change-status/${quoteId}/`, {
      status
    });

    if (res.code === 200) {
      ElMessage.success(res.msg || `报价${statusText}成功，已刷新列表！`);
      getCustomerQuoteList();
    } else {
      ElMessage.error(res.msg || `报价${statusText}失败，请稍后重试！`);
    }
  } catch (error) {
    const isCancel = error && (
      error.message === 'cancel' ||
      error.name === 'CanceledError' ||
      error.type === 'cancel' ||
      !!error.canceled
    );
    if (!isCancel) {
      const statusText = status === 'confirmed' ? '确认' : '作废';
      ElMessage.error(`${statusText}报价失败：${error.message || '接口请求异常'}`);
      console.error(`报价${statusText}异常：`, error);
    }
  } finally {
    quoteStatusLoading.value = { ...quoteStatusLoading.value, [quoteId]: false };
  }
};

const viewQuoteCalculation = async (quoteId) => {
  try {
    quoteCalculationVisible.value = true
    Object.assign(quoteCalculationDetail, {})
    calcLoading.value = true
    const res = await $axios.get(`/business/customer/quote/calculation/${quoteId}/`)
    if (res.code === 200) {
      Object.assign(quoteCalculationDetail, res.data)
    } else {
      ElMessage.error(res.msg || '获取计算明细失败')
      quoteCalculationVisible.value = false
    }
  } catch (error) {
    ElMessage.error(`获取计算明细失败：${error.message}`)
    quoteCalculationVisible.value = false
  } finally {
    calcLoading.value = false
  }
}

const handleDownloadQuoteExcel = async (quoteId) => {
  if (!quoteId) {
    ElMessage.warning('报价ID为空，无法下载报价单！')
    return
  }
  quoteDownloadLoading.value = { ...quoteDownloadLoading.value, [quoteId]: true }
  try {
    const res = await $axios.get(`/business/customer/quote/download/${quoteId}/`, {
      responseType: 'blob',
      headers: { 'Content-Type': 'application/octet-stream' }
    })
    const contentDisposition = res.headers['content-disposition']
    let fileName = `报价单_${quoteId}.xlsx`
    if (contentDisposition) {
      const matches = /filename\*?=UTF-8''([^;]+)/i.exec(contentDisposition)
      if (matches && matches[1]) {
        fileName = decodeURIComponent(matches[1])
      }
    }
    const blob = new Blob([res.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const downloadUrl = window.URL.createObjectURL(blob)
    const tempLink = document.createElement('a')
    tempLink.href = downloadUrl
    tempLink.download = fileName
    document.body.appendChild(tempLink)
    tempLink.click()
    window.URL.revokeObjectURL(downloadUrl)
    document.body.removeChild(tempLink)
    ElMessage.success('报价单下载成功，可在浏览器下载列表查看！')
  } catch (error) {
    const errorMsg = error.response?.data?.msg
      || error.message
      || (error.response?.status === 404 ? '该报价单未生成，请先保存报价记录！' : '报价单下载失败')
    ElMessage.error(`下载失败：${errorMsg}`)
    console.error(`报价单${quoteId}下载异常：`, error)
  } finally {
    quoteDownloadLoading.value = { ...quoteDownloadLoading.value, [quoteId]: false }
  }
}

// ============================ 12. 批量操作方法 ============================
const openBatchAssignDialog = () => {
  if (selectedCustomers.value.length === 0) {
    ElMessage.warning('请先选择至少一个要分配的客户！')
    return
  }
  resetBatchAssignForm()
  batchAssignDialogVisible.value = true
}

const submitBatchAssign = async () => {
  try {
    await batchAssignFormRef.value.validate();
    // 简化：直接用selectedCustomers的id（没有分页）
    const selectedCustomerIds = selectedCustomers.value.map(item => item.customer_id);
    if (selectedCustomerIds.length === 0) {
      ElMessage.warning('请先选择至少一个要分配的客户！');
      return;
    }

    const requestData = {
      customer_ids: selectedCustomerIds,
      target_salesman_id: batchAssignForm.target_salesman_id
    };
    const res = await $axios.post('/business/customer/assign/', requestData);
    if (res.code === 200) {
      ElMessage.success(res.msg || '批量分配客户成功！');
      batchAssignDialogVisible.value = false;
      // 清空选中状态
      nextTick(() => {
        if (customerTableRef.value) {
          customerTableRef.value.clearSelection();
        }
      });
      getCustomerList();
    } else {
      ElMessage.error(res.msg || '批量分配客户失败！');
    }
  } catch (error) {
    if (error.name !== 'ValidationError') {
      ElMessage.error(`批量分配失败：${error.message}`);
    }
  }
};
</script>

<style scoped lang="scss">
/* ===================== 全局基础样式 ===================== */
// 页面根容器样式
.customer-management-container {
  padding: 20px;
  background: #f8f8f8;
  min-height: 100vh;
  box-sizing: border-box;
  max-width: 100vw;
  overflow-x: hidden;
  font-size: 14px;
  line-height: 1.6;
}

// 通用卡片样式（表单/表格外层卡片）
.form-card,
.table-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
  box-sizing: border-box;
}

// 联系方式换行展示（解析\n换行，适配多电话/邮箱）
.contact-content-wrapper {
  word-wrap: break-word;
  word-break: break-all;
  line-height: 1.6;
  white-space: pre-wrap;
  color: #666;
  padding: 2px 0;
  font-size: 14px;
}

// 通用空数据提示
.empty-tip {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 14px;
}

// 文字超出省略
.text-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
  max-width: 100%;
}

/* ===================== 【新增核心】下拉/日期选择器表单项专属样式 - 解决重叠问题 ===================== */
// 下拉框/日期框专属form-item，提升层级+优化布局，彻底解决和输入框重叠
:deep(.form-item-picker) {
  position: relative;
  z-index: 10; // 远高于普通输入框，弹出层不会被遮挡
  margin-bottom: 10px !important;
  // 内部选择器宽度100%适配，避免布局挤压
  .el-select, .el-date-picker {
    width: 100%;
  }
  // 选择器弹出层层级再提升，避免被其他元素遮挡
  .el-select__popper, .el-picker__popper {
    z-index: 9999 !important;
  }
  // 行内表单适配（筛选栏）
  &.el-form-item--inline {
    margin-right: 15px !important;
  }
}

/* ===================== 【全局统一滚动条】核心 - 所有滚动区域均适用 ===================== */
// 全局滚动条样式（弹窗、表格、滚动容器）
:deep(::-webkit-scrollbar) {
  width: 4px;
  height: 4px;
}
:deep(::-webkit-scrollbar-thumb) {
  background-color: #4CAF50;
  border-radius: 2px;
  transition: background-color 0.2s ease;
}
:deep(::-webkit-scrollbar-thumb:hover) {
  background-color: #388E3C;
}
:deep(::-webkit-scrollbar-track) {
  background-color: transparent;
}

/* ===================== 【表格样式统一定义】核心 - 所有表格统一 【修复点1：表格两层重叠】 ===================== */
// 表格标题（弹窗内表格/分组标题）
.unified-dialog-title {
  font-size: 18px !important;
  font-weight: 600 !important;
  line-height: 1.6 !important;
  color: #333 !important;
  margin: 0 !important;
}
// 修复表格header/body/fixed层级冲突 + 边框重叠
:deep(.unified-table) {
  width: 100% !important;
  box-sizing: border-box !important;
  border-radius: 8px !important;
  overflow: hidden !important;
  --el-table-cell-padding: 10px 12px !important;
  --el-table-header-text-color: #333 !important;
  --el-table-row-hover-bg-color: #f5f7fa !important;
  --el-table-stripe-bg: #fafafa !important;
  --el-table-border-color: #e8e8e8 !important;
  position: relative;
  z-index: 1; // 统一表格基础层级，避免层级混乱
  // 修复表头边框不重叠
  .el-table__header-wrapper {
    border-bottom: 1px solid var(--el-table-border-color) !important;
    & + .el-table__body-wrapper {
      border-top: none !important;
    }
  }
  // 修复fixed列层级和高度，避免和主表格重叠
  .el-table__fixed, .el-table__fixed-right {
    z-index: 2 !important; // 比主表格高1级，不遮挡操作按钮
    height: calc(100% - 1px) !important; // 匹配主表格高度，消除底部间隙
    bottom: 0 !important;
    border: none !important;
    &::before {
      display: none !important; // 清除fixed列默认的分隔线，避免双重边框
    }
  }
  // 表头单元格无重复边框
  .el-table__header-cell {
    border-right: 1px solid var(--el-table-border-color) !important;
    &:last-child {
      border-right: none !important;
    }
  }
  // 内容单元格无重复边框
  .el-table__body-cell {
    border-right: 1px solid var(--el-table-border-color) !important;
    &:last-child {
      border-right: none !important;
    }
  }
}
// 表格表头
:deep(.unified-table .el-table__header) {
  font-size: 15px !important;
  font-weight: 600 !important;
  line-height: 2 !important;
  color: #333 !important;
}
// 表格内容
:deep(.unified-table .el-table__body) {
  font-size: 14px !important;
  line-height: 2 !important;
  color: #333 !important;
}

/* ===================== 【全局核心】按钮统一样式 ===================== */
:deep(.el-button) {
  height: 36px !important;
  padding: 0 16px !important;
  border-radius: 4px !important;
  border: none !important;
  font-size: 14px !important;
  cursor: pointer !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  white-space: nowrap !important;
  transition: all 0.2s ease !important;
  flex-shrink: 0 !important;
}
:deep(.el-button--small) {
  height: 32px !important;
  padding: 0 12px !important;
  font-size: 14px !important;
  border-radius: 4px !important;
}
// 按钮配色统一
:deep(.el-button--primary),
:deep(.el-button--success) {
  background: #4CAF50 !important;
  color: #fff !important;
}
:deep(.el-button--primary:hover),
:deep(.el-button--success:hover) {
  background: #388E3C !important;
}
:deep(.el-button--danger) {
  background: #f44336 !important;
  color: #fff !important;
}
:deep(.el-button--danger:hover) {
  background: #d32f2f !important;
}
:deep(.el-button--warning) {
  background: #f57c00 !important;
  color: #fff !important;
}
:deep(.el-button--warning:hover) {
  background: #e65100 !important;
}
:deep(.el-button--info) {
  background: #0288d1 !important;
  color: #fff !important;
}
:deep(.el-button--info:hover) {
  background: #0277bd !important;
}

/* ===================== 【全局弹窗统一样式】核心 - 所有弹窗均加unified-dialog类 ===================== */
:deep(.unified-dialog) {
  border-radius: 12px !important;
  overflow: hidden !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1) !important;
  // 弹窗标题
  .el-dialog__title {
    font-size: 18px !important;
    font-weight: 600 !important;
    color: #333 !important;
    line-height: 1.6 !important;
  }
  // 弹窗头部
  .el-dialog__header {
    padding: 20px 24px !important;
    border-bottom: 1px solid #e8e8e8 !important;
    background: #fff !important;
  }
  // 弹窗内容区
  .el-dialog__body {
    padding: 24px !important;
    max-height: 75vh !important;
    overflow-y: auto !important;
    box-sizing: border-box !important;
    scroll-behavior: smooth !important;
    font-size: 14px !important;
    line-height: 1.6 !important;
  }
  // 弹窗底部
  .el-dialog__footer {
    padding: 16px 24px !important;
    border-top: 1px solid #e8e8e8 !important;
    background: #fafafa !important;
  }
}

/* ===================== 【全局表单统一样式】核心 - 所有弹窗表单加unified-form类 ===================== */
:deep(.unified-form) {
  .el-form-item {
    margin-bottom: 16px !important;
    // 表单标签
    .el-form-item__label {
      font-size: 14px !important;
      font-weight: 500 !important;
      color: #333 !important;
      line-height: 1.6 !important;
    }
    // 表单内容
    .el-form-item__content {
      font-size: 14px !important;
      line-height: 1.6 !important;
    }
  }
  // 输入框/下拉/日期选择器统一
  .el-input__wrapper,
  .el-select__wrapper,
  .el-date-editor {
    height: 38px !important;
    border-radius: 6px !important;
    box-sizing: border-box !important;
    border: 1px solid #dcdfe6 !important;
    transition: all 0.2s ease !important;
    &:hover {
      border-color: #4CAF50 !important;
    }
    &:focus,
    &.is-focus {
      border-color: #4CAF50 !important;
      box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1) !important;
      outline: none !important;
    }
  }
  .el-input__inner,
  .el-select__placeholder,
  .el-date-editor .el-input__inner {
    line-height: 38px !important;
    height: 38px !important;
    font-size: 14px !important;
    color: #333 !important;
  }
  // 文本域
  .el-textarea__wrapper {
    border-radius: 6px !important;
    border: 1px solid #dcdfe6 !important;
    transition: all 0.2s ease !important;
    &:hover {
      border-color: #4CAF50 !important;
    }
    &:focus {
      border-color: #4CAF50 !important;
      box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1) !important;
    }
    .el-textarea__inner {
      font-size: 14px !important;
      color: #333 !important;
      line-height: 1.6 !important;
      padding: 10px 12px !important;
    }
  }
  // 下拉选项
  .el-select-dropdown__item {
    font-size: 14px !important;
    line-height: 1.6 !important;
    padding: 8px 16px !important;
  }
}

/* ===================== 【全局描述列表统一】unified-desc ===================== */
:deep(.unified-desc) {
  --el-descriptions-item-padding: 12px 16px !important;
  --el-descriptions-label-color: #333 !important;
  --el-descriptions-content-color: #666 !important;
  font-size: 14px !important;
  line-height: 1.6 !important;
  .el-descriptions-item__label {
    font-weight: 500 !important;
    font-size: 14px !important;
  }
  .el-descriptions-item__content {
    font-size: 14px !important;
    word-wrap: break-word !important;
    word-break: break-all !important;
  }
}

/* ===================== 顶部筛选栏样式 ===================== */
.search-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
  margin-bottom: 20px;
}
.search-bar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.search-bar .search-form {
  flex: 1;
  min-width: 600px;
}
:deep(.search-form .el-form-item) {
  margin-bottom: 10px !important;
  margin-right: 15px !important;
}
// 自定义绿色功能按钮
:deep(.customer-green-btn) {
  background-color: #4CAF50 !important;
  border: none !important;
  color: #ffffff !important;
  &:hover {
    background-color: #388E3C !important;
    box-shadow: 0 2px 8px rgba(76, 175, 80, 0.2) !important;
  }
  &:active,
  &:focus {
    background-color: #2E7D32 !important;
    box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.3) !important;
    outline: none !important;
  }
  .el-button__content {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 8px !important;
    width: 100% !important;
  }
}

// 客户等级下拉框适配长标签
:deep(.customer-level-select .el-select__popper) {
  min-width: 320px !important;
}
:deep(.customer-level-dialog-select .el-select__popper) {
  min-width: 100% !important;
  width: max-content !important;
  max-width: 400px;
}

/* ===================== 表格相关样式 ===================== */
.main-table-wrapper {
  min-height: 400px;
  background: #fff;
  border-radius: 8px;
  padding: 10px;
  box-sizing: border-box;
  overflow: hidden;
}
// 表格操作列按钮容器
.operation-buttons {
  display: flex;
  justify-content: center !important;
  align-items: center !important;
  gap: 8px !important;
  flex-wrap: wrap;
  width: 100% !important;
}
.follow-operation-buttons {
  flex-wrap: nowrap !important;
}
.quote-op-buttons {
  gap: 4px !important;
}
// 分页通用样式
:deep(.el-pagination) {
  --el-pagination-active-color: #4CAF50 !important;
  font-size: 14px !important;
  .el-pager li.is-active {
    background: #4CAF50 !important;
    color: #fff !important;
  }
}

/* ===================== 表格自定义操作按钮配色 ===================== */
:deep(.btn-edit) {
  background-color: #FF9800 !important;
  color: #fff !important;
  &:hover {
    background-color: #FB8C00 !important;
  }
}
:deep(.btn-follow) {
  background-color: #1E88E5 !important;
  color: #fff !important;
  &:hover {
    background-color: #1976D2 !important;
  }
}
:deep(.btn-quote) {
  background-color: #52C41A !important;
  color: #fff !important;
  &:hover {
    background-color: #43A047 !important;
  }
}
:deep(.btn-delete) {
  background-color: #F5222D !important;
  color: #fff !important;
  &:hover {
    background-color: #ff4d4f !important;
  }
}

/* ===================== 弹窗通用底部按钮 ===================== */
.dialog-footer {
  display: flex;
  justify-content: flex-end !important;
  align-items: center !important;
  gap: 12px !important;
  flex-wrap: nowrap !important;
  width: 100% !important;
  .el-button {
    font-size: 14px !important;
  }
}

/* ===================== 客户详情弹窗专属样式 ===================== */
:deep(.customer-detail-dialog) {
  .el-dialog__body {
    max-height: 80vh !important;
    background: #fafafa !important;
  }
}
// 客户名称可点击样式
.customer-name-clickable {
  cursor: pointer;
  color: #4CAF50;
  transition: color 0.2s ease;
  font-size: 14px;
  &:hover {
    color: #2E7D32;
    text-decoration: underline;
  }
}
// 详情长文本项
.long-text-item {
  margin-top: 8px;
  display: block !important;
  .el-descriptions-item__label {
    background: #f9f9f9;
    font-weight: 600;
    padding: 12px 16px !important;
    margin-bottom: 8px !important;
    display: block !important;
    font-size: 14px !important;
  }
}
// 地址项
.address-item .address-content-wrapper {
  padding: 16px;
  min-height: 80px;
  max-height: 160px;
  overflow-y: auto;
  background: #f9f9f9;
  border-radius: 4px;
  line-height: 1.8;
  color: #666;
  white-space: pre-wrap;
  word-wrap: break-word;
  word-break: break-all;
  font-size: 14px;
}
// 备注项
.remark-item {
  position: relative;
  margin-top: 12px;
  margin-bottom: 20px !important;
  width: 100%;
  box-sizing: border-box;
}
.remark-content-box {
  position: relative;
  width: 100%;
  min-height: 120px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  padding: 20px 18px;
  padding-bottom: 50px !important;
  box-sizing: border-box;
  overflow: hidden;
}
:deep(.remark-content-wrapper) {
  width: 100%;
  line-height: 1.8;
  color: #333;
  white-space: pre-wrap;
  word-wrap: break-word;
  word-break: break-all;
  max-height: none;
  transition: max-height 0.4s ease-in-out;
  font-size: 14px;
}
:deep(.remark-collapsed) {
  max-height: 100px !important;
  overflow: hidden !important;
  position: relative;
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.98));
    pointer-events: none;
  }
}
// 空备注提示
:deep(.empty-remark-text) {
  color: #999;
  font-style: italic;
  text-align: center;
  display: block;
  padding: 30px 0;
  font-size: 14px;
  width: 100%;
}
// 备注展开/收起按钮
.remark-actions {
  position: absolute;
  bottom: 18px;
  right: 18px;
  display: flex;
  gap: 8px;
  align-items: center;
  z-index: 999;
}
:deep(.expand-btn) {
  color: #4CAF50;
  font-size: 14px;
  padding: 8px 16px;
  border-radius: 6px;
  transition: all 0.3s ease-in-out;
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(76, 175, 80, 0.03);
  &:hover {
    color: #2E7D32;
    background: rgba(76, 175, 80, 0.1);
  }
}

/* ===================== 跟进记录弹窗专属样式 ===================== */
:deep(.follow-record-dialog) {
  // 针对跟进弹窗内的small尺寸日期选择器（新增/编辑跟进记录表单）
  .unified-form {
    .form-item-picker {
      .el-date-picker--small {
        // 1. 取消外层editor的强制高度，适配small尺寸默认值
        .el-date-editor {
          height: auto !important;
          // 2. 移除外层editor的边框（避免和内部input__wrapper重叠）
          border: none !important;
          padding: 0 !important;
          margin: 0 !important;
          // 3. 针对内部输入框容器做精准样式，保证单一边框
          .el-input__wrapper {
            height: 32px !important; // 严格匹配Element Plus small尺寸输入框高度
            line-height: 32px !important;
            border-radius: 6px !important;
            border: 1px solid #dcdfe6 !important; // 仅保留这一层边框
            box-sizing: border-box !important;
            &:hover {
              border-color: #4CAF50 !important;
            }
            &.is-focus {
              border-color: #4CAF50 !important;
              box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1) !important;
            }
          }
          // 4. 日期选择器输入框文字居中，匹配small尺寸
          .el-input__inner {
            height: 32px !important;
            line-height: 32px !important;
            font-size: 14px !important;
            border: none !important; // 确保输入框本身无边框
          }
          // 5. 日期选择器图标样式适配
          .el-input__prefix {
            height: 32px !important;
            line-height: 32px !important;
          }
        }
      }
    }
  }
}

// 跟进弹窗头部
.follow-dialog-header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
  padding: 0;
}
.follow-dialog-header-buttons {
  display: flex;
  gap: 8px;
  margin-left: auto;
  margin-right: 20px;
}
// 客户信息概览卡片
.follow-customer-overview {
  margin-bottom: 15px;
  width: 100%;
}
.overview-card {
  border: 1px solid #e8e8e8;
  box-shadow: none !important;
  margin-bottom: 10px;
}
// 跟进筛选栏
.follow-top-bar {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 15px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
}
.follow-search-form {
  display: flex;
  align-items: center;
  gap: 12px;
  width: auto;
  flex-wrap: nowrap;
  flex-shrink: 1;
}
:deep(.follow-search-form .el-form-item) {
  margin-bottom: 0 !important;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  .el-form-item__label {
    width: 70px !important;
    text-align: right;
    padding: 0 !important;
    flex-shrink: 0;
  }
}
// 跟进表格容器
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
  min-width: 1100px !important;
  border: none !important;
}
// 跟进内容文本
.follow-content-wrapper {
  word-wrap: break-word;
  word-break: break-all;
  line-height: 1.6;
  padding: 2px 0;
  color: #666;
  font-size: 14px;
}
// 跟进分页容器
.follow-pagination {
  margin-top: 10px;
  padding: 8px 16px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
}

/* ===================== 报价相关样式 【修复点2：报价弹窗内容贴分隔线 | 修复点3：计算表格左侧空白】 ===================== */
// 报价记录弹窗
:deep(.quote-record-dialog) {
  .el-dialog__body {
    padding: 20px !important;
  }
  .quote-main-table {
    --el-table-row-hover-bg-color: #f0f9eb !important;
    --el-table-stripe-bg: #f9fdf5 !important;
  }
}
// 报价表单弹窗
:deep(.quote-form-dialog) {
  .el-dialog__header {
    background: #f9fdf5 !important;
    border-bottom: 1px solid #e6f4ea !important;
    .el-dialog__title {
      color: #165DFF !important;
    }
  }
  .el-dialog__body {
    padding: 0 !important;
    max-height: 85vh !important;
    overflow: hidden !important;
  }
  .el-dialog__footer {
    background: #f9fdf5 !important;
    border-top: 1px solid #e6f4ea !important;
  }
}
// 【修复点2核心】报价表单滚动容器 - 增加上下左右内边距，远离分隔线
.quote-form-scroll-wrapper {
  height: calc(85vh - 60px);
  overflow-y: auto;
  padding: 30px 28px !important; // 原24px，增加上下左右间距，远离弹窗分隔线
  box-sizing: border-box;
}
// 报价表单分组
.quote-form-container {
  width: 100%;
}
// 【修复点2辅助】报价表单分组 - 增加内边距，内容不贴分组边框
.quote-form-group {
  margin-bottom: 28px !important; // 原24px，增加分组之间间距
  background: #f8faf7;
  border-radius: 8px;
  padding: 24px !important; // 原20px，增加分组内边距
  border: 1px solid #f0f0f0;
  &:last-child {
    margin-bottom: 0;
  }
  &.quote-form-pay-group {
    background: #f8faf7 !important;
    border-color: #f0f0f0 !important;
  }
}
// 报价表单分组标题
.quote-form-group-title {
  margin: 0 0 20px 0 !important; // 原16px，增加标题和表单的间距
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 2px solid #388E3C;
}
// 报价表单行间距
.quote-form-row {
  margin-bottom: 16px !important; // 原12px，增加表单行之间间距
  &:last-child {
    margin-bottom: 0;
  }
}
// 【修复点3核心】计算记录表单项 - 清除所有默认padding/margin，消除左侧空白
.calc-record-item {
  margin-bottom: 0 !important;
  width: 100% !important;
  padding: 0 !important; // 原20px，清除左侧padding导致的空白
  box-sizing: border-box !important;
  border: none !important;
  .el-form-item__label {
    display: none !important; // 隐藏该表单项的label，无需显示
  }
  .el-form-item__content {
    margin: 0 !important; // 清除form-item默认的margin-left，核心消除左侧空白
    width: 100% !important;
  }
}
// 计算记录标签页 - 清除默认布局样式，无多余间距
.calc-record-tabs {
  width: 100% !important;
  box-sizing: border-box !important;
  :deep(.el-tabs__header) {
    margin: 0 0 16px 0 !important;
    width: 100% !important;
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    padding: 0 !important;
    border: none !important;
  }
  :deep(.el-tabs__nav-wrap) {
    flex: none !important;
    justify-content: center !important;
    align-items: center !important;
    padding: 0 !important;
    border: none !important;
  }
  :deep(.el-tabs__nav) {
    float: none !important;
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    margin: 0 auto !important;
    padding: 0 !important;
    border-radius: 8px 8px 0 0 !important;
  }
  :deep(.el-tabs--card .el-tabs__nav) {
    border: 1px solid #e8e8e8 !important;
    background: #fff !important;
  }
  :deep(.el-tabs--card .el-tab-nav__item) {
    padding: 10px 30px !important;
    border: none !important;
    margin: 0 !important;
    font-size: 14px !important;
  }
  :deep(.el-tabs--card .el-tab-nav__item.is-active) {
    background: #4CAF50 !important;
    color: #fff !important;
    border: none !important;
  }
}
// 【修复点3辅助】计算记录表格容器 - 清除左侧padding，100%宽度无偏移
.calc-table-wrapper {
  margin: 10px auto 0;
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
  padding: 0 !important; // 原0 8px，清除左右padding导致的左侧空白
}
.calc-select-table {
  --el-table-header-text-color: #fff !important;
  --el-table-header-bg-color: #1890ff !important;
  --el-table-row-hover-bg-color: #e6f7ff !important;
  --el-table-stripe-bg: #f0f9eb !important;
  border-radius: 8px !important;
  overflow: hidden !important;
}
// 选中计算记录表格
.selected-table-wrapper {
  position: relative;
  z-index: 20;
  margin: 20px auto 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding: 0 8px;
}
.selected-table-title {
  margin: 20px 0 12px 0;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px !important;
}
.selected-calc-table {
  --el-table-header-text-color: #fff !important;
  --el-table-header-bg-color: #52c41a !important;
  --el-table-row-hover-bg-color: #f0f9eb !important;
  --el-table-stripe-bg: #f9fdf5 !important;
  border-radius: 8px !important;
  overflow: hidden !important;
}
:deep(.selected-table-wrapper .el-table .price-header-column) {
  min-width: 240px !important;
  width: 240px !important;
  position: relative;
  z-index: 99;
  .el-table__header-cell {
    overflow: visible !important;
    white-space: normal !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    height: 60px !important;
    padding: 0 15px !important;
    box-sizing: border-box !important;
    background: #4CAF50 !important;
    border: none !important;
    z-index: 99 !important;
    font-size: 14px !important;
  }
}
// 报价数量/价格输入框
.quote-price-input, .quote-quantity-input {
  :deep(.el-input__wrapper) {
    border-radius: 4px !important;
    box-shadow: none !important;
    border-color: #dcdfe6 !important;
    &:focus {
      box-shadow: 0 0 0 2px rgba(82, 196, 26, 0.2) !important;
    }
  }
}
// 隐藏数字输入框增减箭头
:deep(.el-input__inner[type="number"])::-webkit-outer-spin-button,
:deep(.el-input__inner[type="number"])::-webkit-inner-spin-button {
  -webkit-appearance: none !important;
  margin: 0 !important;
}
:deep(.el-input__inner[type="number"]) {
  -moz-appearance: textfield !important;
}
// 报价表单底部按钮
.quote-form-footer {
  gap: 16px;
}
.quote-form-cancel-btn {
  padding: 0 24px !important;
  border-radius: 6px !important;
}
.quote-form-submit-btn {
  padding: 0 32px !important;
  border-radius: 6px !important;
  background: #52c41a !important;
  &:hover {
    background: #43a047 !important;
  }
  .el-button__content {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}
// 下载报价单按钮
:deep(.download-quote-btn) {
  background-color: #f57c00 !important;
  color: #FFFFFF !important;
  border: none !important;
  &:hover {
    background-color: #e65100 !important;
  }
  &:disabled,
  &.is-loading {
    background-color: #f9a825 !important;
    color: rgba(255, 255, 255, 0.9) !important;
    cursor: not-allowed !important;
  }
}
// 报价计算明细弹窗
:deep(.quote-calc-detail-dialog) {
  .el-dialog__body {
    max-height: 70vh !important;
    padding: 24px !important;
  }
  .calc-empty-tip {
    text-align: center;
    padding: 40px 0;
    color: #999;
    font-size: 14px;
  }
}
.calc-detail-container {
  height: 600px;
  overflow-y: auto;
}
.calc-detail-card {
  --el-card-border-radius: 8px !important;
}
.calc-params-desc {
  --el-descriptions-item-label-width: 180px !important;
}

/* ===================== 响应式适配 ===================== */
@media (max-width: 1440px) {
  .search-bar .search-form {
    min-width: 400px;
    flex-wrap: wrap;
  }
  :deep(.quote-form-dialog) {
    width: 1200px !important;
  }
  .quote-form-group {
    padding: 20px !important; // 响应式适配分组内边距
  }
  .quote-form-scroll-wrapper {
    padding: 24px 20px !important; // 响应式适配滚动容器内边距
  }
}

@media (max-width: 1280px) {
  :deep(.follow-record-dialog) {
    width: calc(100% - 40px) !important;
  }
  :deep(.follow-record-dialog .el-table) {
    min-width: 900px !important;
  }
  .search-bar .search-form {
    min-width: 400px;
  }
}

@media (max-width: 1200px) {
  :deep(.quote-form-dialog) {
    width: 95vw !important;
  }
  .quote-form-scroll-wrapper {
    padding: 20px 16px !important; // 响应式适配滚动容器内边距
  }
  :deep(.el-form-item) {
    label-width: 100px !important;
  }
  .quote-form-group {
    padding: 20px !important; // 响应式适配分组内边距
  }
}

@media (max-width: 992px) {
  :deep(.follow-record-dialog) {
    width: calc(100% - 40px) !important;
  }
  :deep(.follow-record-dialog .el-table) {
    min-width: 700px !important;
  }
  .search-bar .search-form {
    min-width: 400px;
  }
  .follow-top-bar .follow-search-form {
    flex-wrap: wrap;
    width: 100%;
    margin-top: 8px;
  }
}

@media (max-width: 768px) {
  :deep(.follow-record-dialog) {
    width: calc(100% - 20px) !important;
  }
  .search-bar .search-form {
    min-width: 300px;
  }
  // 移动端备注容器优化
  .remark-content-box {
    padding: 14px;
    padding-bottom: 40px !important;
  }
  :deep(.remark-item .expand-btn) {
    font-size: 14px;
    padding: 6px 12px;
  }
  // 移动端报价表单适配
  .quote-form-scroll-wrapper {
    padding: 16px 12px !important;
  }
  .quote-form-group {
    padding: 16px !important;
    margin-bottom: 20px !important;
  }
}
// 日期选择器输入框强制不重叠
:deep(.form-item-picker .el-date-editor .el-input__wrapper) {
  position: relative;
  z-index: 12;
  overflow: hidden;
}
// 下拉选择器输入框强制不重叠
:deep(.form-item-picker .el-select .el-input__wrapper) {
  position: relative;
  z-index: 12;
  overflow: hidden;
}
/* 新增：修复跟进记录弹窗 - small尺寸日期选择器双框问题（核心） */
:deep(.follow-record-dialog) {
  // 针对跟进弹窗内的small尺寸日期选择器
  .unified-form {
    .form-item-picker {
      .el-date-picker--small {
        // 取消全局强制的height，适配small尺寸默认高度
        .el-date-editor {
          height: auto !important;
          // 消除外层editor的边框（避免和内部input__wrapper边框重叠形成双框）
          border: none !important;
          padding: 0 !important;
          // 针对内部输入框容器做样式匹配，保证单一边框
          .el-input__wrapper {
            height: 32px !important; // 严格匹配Element Plus small尺寸输入框高度
            line-height: 32px !important;
            border-radius: 6px !important;
            border: 1px solid #dcdfe6 !important; // 单一边框，避免重叠
            &:hover {
              border-color: #4CAF50 !important;
            }
            &.is-focus {
              border-color: #4CAF50 !important;
              box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1) !important;
            }
          }
          // 日期选择器的输入框文字居中，匹配small尺寸
          .el-input__inner {
            height: 32px !important;
            line-height: 32px !important;
            font-size: 14px !important;
          }
        }
      }
    }
  }
}

/* 可选：兜底修复所有small尺寸日期选择器，防止其他地方出现同类问题 */
:deep(.el-date-picker--small) {
  .el-date-editor {
    height: auto !important;
    border: none !important;
    padding: 0 !important;
  }
}
/* 可选：修复报价弹窗 - 日期选择器双框兜底 */
:deep(.quote-form-dialog) {
  .unified-form {
    .form-item-picker {
      .el-date-editor {
        height: auto !important;
        border: none !important;
        padding: 0 !important;
        .el-input__wrapper {
          height: 38px !important;
          line-height: 38px !important;
        }
      }
    }
  }
}
</style>

