<template>
  <div class="raw-material-container">
    <!-- 图片预览弹窗 -->
<el-dialog
  v-model="imagePreviewVisible"
  title="图片预览"
  width="80%"
  :close-on-click-modal="true"
  :show-close="true"
  destroy-on-close
>
  <div style="display: flex; justify-content: center; padding: 20px;">
    <el-image
      :src="previewImageUrl"
      style="max-width: 100%; max-height: 70vh;"
      fit="contain"
    >
      <template #error>
        <div style="width: 100%; height: 200px; display: flex; align-items: center; justify-content: center; background: #f5f5f5; color: #999;">
          <el-icon size="40"><Picture /></el-icon>
        </div>
      </template>
      <template #loading>
        <div style="width: 100%; height: 200px; display: flex; align-items: center; justify-content: center; background: #f5f5f5;">
          <el-icon size="40"><Loading /></el-icon>
        </div>
      </template>
    </el-image>
  </div>
</el-dialog>
    <div class="form-card">
      <div class="form-header">
        <h3 class="form-title">生产记录管理</h3>
        <div class="pre-module-btn-group">
          <button class="category-add-btn" @click="openCategoryDialog('manage')" type="button">品类管理</button>
          <button class="category-add-btn" style="margin-left:8px" @click="openBatchDialog('manage')" type="button">批次管理</button>
          <button class="category-add-btn" style="margin-left:8px" @click="openRecordDialog('add')" type="button">新增记录</button>
        </div>
      </div>
      <div class="filter-bar">
        <el-form :inline="true" :model="recordForm" class="filter-form" :key="filterFormKey">
          <el-form-item label="所属批次">
            <el-select
              v-model="recordForm.batch_id"
              placeholder="请选择批次"
              class="filter-input"
              style="width: 250px;"
            >
              <el-option v-for="item in batchList" :key="item.batch_id" :label="item.batch_name" :value="item.batch_id"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="所属品类">
            <el-select
              v-model="recordForm.category_id"
              placeholder="请选择品类"
              class="filter-input"
              @change="handleRecordCategoryChange"
              style="width: 250px;"
            >
              <el-option v-for="item in categoryList" :key="item.category_id" :label="item.category_name" :value="item.category_id"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="getRecordList" class="operate-btn add-btn">查询</el-button>
            <el-button type="warning" @click="batchOperateDialogVisible = true" :disabled="selectedRecordIds.length === 0" class="operate-btn" style="background:#ff9800;color:#fff;margin-left:8px">批量操作</el-button>
            <el-button type="info" @click="exportRecords" :disabled="selectedRecordIds.length === 0" class="operate-btn" style="background:#2196f3;color:#fff;margin-left:8px">导出选中</el-button>
          </el-form-item>
        </el-form>
      </div>
      <div class="table-wrapper">
        <el-table
          ref="recordTableRef"
          :data="recordList"
          border
          stripe
          class="material-table"
          style="width:100%;position: relative;z-index: 0;"
          @selection-change="handleRecordSelectionChangeDebounce"
          :key="tableKey"
          row-key="record_id"
          :reserve-selection="true"
        >
          <el-table-column type="selection" width="55" :reserve-selection="true"></el-table-column> <!-- 补充reserve-selection -->
          <el-table-column prop="category_name" label="品类名称" min-width="120"></el-table-column>
          <el-table-column prop="spec_value" label="规格值" min-width="150"></el-table-column>
          <el-table-column prop="product_name" label="产品名称" min-width="120"></el-table-column>
          <el-table-column prop="stock" label="库存" width="80"></el-table-column>
          <el-table-column prop="price" label="价格" width="100">
            <template #default="scope">{{ scope.row.price || '-' }}</template>
          </el-table-column>
          <el-table-column prop="production_date" label="生产日期" width="120"></el-table-column>
          <el-table-column prop="production_user" label="生产人" width="100"></el-table-column>
          <el-table-column prop="composition" label="成分" min-width="150">
            <template #default="scope">{{ scope.row.composition || '-' }}</template>
          </el-table-column>
          <el-table-column prop="last_operate_user" label="操作人" width="100">
            <template #default="scope">{{ scope.row.last_operate_user || '-' }}</template>
          </el-table-column>

          <el-table-column label="产品图片" width="120">
            <template #default="scope">
              <el-upload
                :ref="(el) => uploadRefs[scope.row.record_id] = el"
                class="cell-image-uploader"
                :action="imageUploadUrl"
                :headers="uploadHeaders"
                :data="{ record_id: scope.row.record_id }"
                :show-file-list="false"
                :on-success="(res) => handleCellImageUploadSuccess(res, scope.row)"
                :on-error="(err) => ElMessage.error('图片上传失败：' + err.message)"
                accept="image/jpeg,image/png"
                :disabled="!scope.row.record_id"
                name="product_image"
                :before-upload="(file) => beforeImageUpload(file, scope.row)"
              >
                <div v-if="scope.row.product_image" class="image-wrapper">
                  <el-image
                    :src="getImageUrl(scope.row.product_image)"
                    style="width:60px;height:60px;object-fit:cover;cursor:pointer"
                    fit="cover"
                    @error="() => { scope.row.product_image = '' }"
                    preview
                    :preview-teleported="true"
                    :preview-close-on-click-mask="true"
                  >
                    <template #error>
                      <div style="width:60px;height:60px;display:flex;align-items:center;justify-content:center;background:#f5f5f5;color:#999">
                        <el-icon size="20"><Picture /></el-icon>
                      </div>
                    </template>
                    <template #loading>
                      <div style="width:60px;height:60px;display:flex;align-items:center;justify-content:center;background:#f5f5f5">
                        <el-icon size="20"><Loading /></el-icon>
                      </div>
                    </template>
                  </el-image>
                  <div class="image-actions">
<el-icon size="14" class="action-icon" @click.stop="() => previewImage(scope.row)"><View /></el-icon>
  <el-icon size="14" class="action-icon" @click.stop="() => triggerUpload(scope.row.record_id)"><Edit /></el-icon>
  <el-icon size="14" class="action-icon" @click.stop="() => deleteCellImage(scope.row)"><Delete /></el-icon>
                  </div>
                </div>
                <div v-else class="upload-placeholder" style="width:60px;height:60px;border:1px dashed #d9d9d9;border-radius:4px;display:flex;align-items:center;justify-content:center;cursor:pointer">
                  <el-icon size="20"><Plus /></el-icon>
                </div>
              </el-upload>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="160">
            <template #default="scope">
              <div class="operate-btn-group">
                <button class="edit-btn" @click="openRecordDialog('edit', scope.row)" type="button">编辑</button>
                <button class="delete-btn" @click="deleteRecord(scope.row.record_id)" type="button">删除</button>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="last_operate_time" label="最后更新时间" width="180">
            <template #default="scope">{{ scope.row.last_operate_time || '-' }}</template>
          </el-table-column>
        </el-table>
        <div class="pagination-wrapper" style="margin-top: 15px; text-align: right;">
          <el-pagination
            v-model:current-page="pagination.currentPage"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </div>

    <el-dialog
      v-model="categoryDialogVisible"
      title="产品品类&规格管理"
      width="1000px"
      @close="resetSpecForm"
      destroy-on-close
    >
      <div class="dialog-header" style="margin-bottom:10px">
        <el-form :inline="true" class="filter-form">
          <el-form-item>
            <el-button type="primary" @click="openCategoryDialog('add')" class="operate-btn add-btn">新增品类</el-button>
            <el-button v-if="isSpecManage" type="default" @click="backToCategoryList" class="operate-btn" style="margin-left:8px">返回品类列表</el-button>
          </el-form-item>
        </el-form>
      </div>

      <div v-if="!isSpecManage">
        <el-form
          v-if="categoryDialogType === 'add' || categoryDialogType === 'edit'"
          :model="categoryDialogForm"
          label-width="80px"
          ref="categoryFormRef"
          style="margin-bottom:15px"
        >
          <el-form-item label="品类名称" prop="category_name">
            <el-input v-model="categoryDialogForm.category_name" placeholder="请输入品类名称" class="form-input" style="width: 300px;"></el-input>
          </el-form-item>
          <el-form-item label="品类属性" style="margin: 0;">
            <div style="width: 100%; max-width: 300px;">
              <div style="display: flex; align-items: center; gap: 8px; width: 100%;">
                <el-input v-model="newAttrName" placeholder="请输入属性名称" class="form-input" style="flex: 1;"></el-input>
                <el-button type="primary" size="small" @click="addCategoryAttr" class="operate-btn add-btn">添加</el-button>
              </div>
              <div style="margin-top: 8px;">
                <el-tag v-for="(attr, index) in categoryDialogForm.attributes" :key="attr + index" closable @close="removeCategoryAttr(index)" style="margin-right: 8px; margin-bottom: 8px;">{{ attr }}</el-tag>
              </div>
            </div>
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="categoryDialogForm.remark" type="textarea" placeholder="请输入备注"></el-input>
          </el-form-item>
          <div style="display: flex; justify-content: flex-end; margin-top: 20px; gap: 8px;">
            <button class="operate-btn cancel-btn" @click="cancelCategoryEdit" type="button">取消</button>
            <button class="operate-btn save-btn" @click="saveCategory" type="button">确定</button>
          </div>
        </el-form>
        <div class="table-wrapper">
          <el-table
            :data="categoryList"
            border
            stripe
            class="material-table category-table"
            style="width:100%;overflow-anchor: none;"
            :cell-style="{ whiteSpace: 'normal', wordBreak: 'break-all' }"
            row-key="category_id"
          >
            <el-table-column prop="category_name" label="品类名称" min-width="120"></el-table-column>
            <el-table-column prop="attributes" label="品类属性" min-width="180">
              <template #default="scope">{{ scope.row.attributes?.join('、') || '-' }}</template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="150"></el-table-column>
            <el-table-column label="操作" min-width="200">
              <template #default="scope">
                <div class="operate-btn-group">
                  <button class="edit-btn" @click="openCategoryDialog('edit', scope.row)" type="button">编辑</button>
                  <button class="delete-btn" @click="deleteCategory(scope.row.category_id)" type="button">删除</button>
                  <button class="edit-btn" style="background:#2196f3" @click="openSpecManage(scope.row)" type="button">规格管理</button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <div v-if="isSpecManage" style="width:100%">
        <div style="font-size:14px; font-weight:500; margin-bottom:15px; color:#333;">
          当前管理品类：<span style="color:#2196f3">{{ currentManageCategoryName }}</span>
        </div>
        <el-form :model="specDialogForm" label-width="80px" ref="specFormRef" style="margin-bottom:15px">
          <el-form-item label="所属品类" prop="category_id">
            <div style="display: flex; align-items: center; gap: 10px;">
              <el-select v-model="specDialogForm.category_id" placeholder="请选择品类" class="form-input" style="width:300px" disabled>
                <el-option :key="currentManageCategoryId" :label="currentManageCategoryName" :value="currentManageCategoryId"></el-option>
              </el-select>
              <el-button
                type="success"
                size="small"
                @click="generateSpecCombination"
                class="operate-btn add-btn spec-generate-btn"
                icon="Plus"
              >
                生成规格
              </el-button>
            </div>
          </el-form-item>

          <el-form-item label="属性值" v-if="currentCategoryAttrs.length > 0" style="margin-top:15px;">
            <div class="spec-attr-config-wrapper">
              <div
                v-for="attr in currentCategoryAttrs.filter(attr => attr.trim())"
                :key="attr"
                class="spec-attr-item"
              >
                <div class="spec-attr-label-wrapper">
                  <span class="spec-attr-label">{{ attr }}：</span>
                  <el-button type="primary" size="mini" class="spec-attr-btn spec-attr-plus-btn" @click="addSpecAttrValue(attr)">+</el-button>
                </div>
                <div class="spec-attr-value-list" style="overflow-anchor: none;">
                  <div v-for="(val, idx) in specAttrValues[attr]" :key="idx" class="spec-attr-value-item">
                    <el-input v-model="specAttrValues[attr][idx]" :placeholder="`请输入${attr}值`" class="form-input spec-attr-input" size="small"></el-input>
                    <el-button type="danger" size="mini" class="spec-attr-btn spec-attr-minus-btn" @click="deleteSpecAttrValue(attr, idx)">-</el-button>
                  </div>
                </div>
              </div>
            </div>
          </el-form-item>

          <el-form-item label="已选规格组合" v-if="specCombinationList.length > 0" style="margin-top:15px">
            <div style="display:flex;flex-wrap:wrap;gap:8px;padding:10px;border:1px solid #e6e6e6;border-radius:4px;max-height:200px;overflow-y:auto;overflow-anchor: none">
              <el-tag v-for="(item, index) in specCombinationList" :key="index" closable @close="deleteSpecCombination(index)" style="font-size:14px">{{ item }}</el-tag>
            </div>
            <p style="margin:5px 0 0;color:#666;font-size:12px">提示：删除标签后会自动更新最终规格值</p>
          </el-form-item>

          <div class="spec-confirm-area" style="margin-top: 30px;">
            <div style="height: 1px; background-color: #eee; margin-bottom: 20px;"></div>
            <div style="display: flex; justify-content: flex-end; gap: 15px;">
              <button class="operate-btn cancel-btn spec-cancel-btn" @click="cancelSpecEdit" type="button">取消</button>
              <button class="operate-btn save-btn spec-save-btn" @click="saveSpec" type="button">确定保存规格</button>
            </div>
          </div>
        </el-form>
        <div class="table-wrapper">
          <el-table
            :data="specList"
            border
            stripe
            class="material-table"
            style="width:100%;overflow-anchor: none;"
            row-key="spec_id"
          >
            <el-table-column prop="category_name" label="品类名称" min-width="120"></el-table-column>
            <el-table-column prop="spec_value" label="规格值" min-width="180"></el-table-column>
            <el-table-column prop="create_time" label="创建时间" width="180"></el-table-column>
            <el-table-column prop="create_user" label="创建人" width="100"></el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="scope">
                <div class="operate-btn-group">
                  <button class="delete-btn" @click="deleteSpec(scope.row.spec_id)" type="button">删除</button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <div v-if="currentCategoryAttrs.length === 0" style="text-align: center; padding:50px 0; color:#999;">
          该品类未配置任何属性，请先返回品类列表编辑品类添加属性
        </div>
      </div>
    </el-dialog>

    <el-dialog
      v-model="batchDialogVisible"
      title="生产批次管理"
      width="800px"
      destroy-on-close
    >
      <div class="dialog-header">
        <el-form :inline="true" class="filter-form" style="margin-bottom:10px">
          <el-form-item>
            <el-button type="primary" @click="openBatchDialog('add')" class="operate-btn add-btn">新增批次</el-button>
          </el-form-item>
        </el-form>
      </div>
      <el-form v-if="batchDialogType === 'add'" :model="batchDialogForm" label-width="80px" ref="batchFormRef" style="margin-bottom:15px">
        <el-form-item label="批次名称" prop="batch_name">
          <el-input v-model="batchDialogForm.batch_name" placeholder="请输入批次名称" class="form-input"></el-input>
        </el-form-item>
        <div style="display: flex; justify-content: flex-end; margin-top: 10px; gap: 8px;">
          <button class="operate-btn cancel-btn" @click="cancelBatchEdit" type="button">取消</button>
          <button class="operate-btn save-btn" @click="saveBatch" type="button">确定</button>
        </div>
      </el-form>
      <div class="table-wrapper">
        <el-table
          :data="batchList"
          border
          stripe
          class="material-table"
          style="width:100%;overflow-anchor: none;"
          row-key="batch_id"
        >
          <el-table-column prop="batch_name" label="批次名称" min-width="150"></el-table-column>
          <el-table-column prop="category_count" label="关联品类数" width="100">
            <template #default="scope">{{ scope.row.category_count || 0 }}</template>
          </el-table-column>
          <el-table-column prop="record_count" label="生产记录数" width="100">
            <template #default="scope">{{ scope.row.record_count || 0 }}</template>
          </el-table-column>
          <el-table-column prop="create_time" label="创建时间" width="180"></el-table-column>
          <el-table-column prop="create_user" label="创建人" width="100"></el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="scope">
              <div class="operate-btn-group">
                <button class="delete-btn" @click="deleteBatch(scope.row)" type="button">删除</button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <el-dialog
      v-model="recordDialogVisible"
      title="生产记录管理"
      width="1200px"
      destroy-on-close
      class="record-dialog"
    >
      <el-form :model="recordDialogForm" label-width="100px" ref="recordFormRef" class="record-dialog-form">
        <div class="record-dialog-form-row">
          <el-form-item label="所属批次" prop="batch_id" required class="record-dialog-form-item">
            <el-select
              v-model="recordDialogForm.batch_id"
              placeholder="请选择批次"
              class="form-input"
              style="width: 300px;"
              :disabled="dialogType === 'edit'"
            >
              <el-option v-for="item in batchList" :key="item.batch_id" :label="item.batch_name" :value="item.batch_id"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="所属品类" prop="category_id" required class="record-dialog-form-item">
            <el-select
              v-model="recordDialogForm.category_id"
              placeholder="请选择品类"
              class="form-input"
              style="width: 300px;"
              @change="handleDialogCategoryChange"
              :disabled="dialogType === 'edit'"
            >
              <el-option v-for="item in categoryList" :key="item.category_id" :label="item.category_name" :value="item.category_id"></el-option>
            </el-select>
          </el-form-item>
        </div>

        <div v-if="dialogSpecTableData.length > 0 && dialogType === 'add'" class="batch-operate-group" style="margin: 15px 0; display: flex; gap: 10px; flex-wrap: wrap;">
          <el-popover
            v-model="batchNamePopoverVisible"
            placement="bottom"
            width="200"
            trigger="click"
          >
            <div style="display: flex; flex-direction: column; gap: 10px;">
              <el-input v-model="batchOperateValue.productName" placeholder="请输入统一产品名称"></el-input>
              <el-button type="primary" size="small" @click="batchSetProductName">确认设置</el-button>
            </div>
            <template #reference>
              <el-button type="default" size="small">批量设置产品名称</el-button>
            </template>
          </el-popover>

          <el-popover
            v-model="batchCompositionPopoverVisible"
            placement="bottom"
            width="200"
            trigger="click"
          >
            <div style="display: flex; flex-direction: column; gap: 10px;">
              <el-input v-model="batchOperateValue.composition" type="textarea" placeholder="请输入统一产品成分" :rows="2"></el-input>
              <el-button type="primary" size="small" @click="batchSetComposition">确认设置</el-button>
            </div>
            <template #reference>
              <el-button type="default" size="small">批量设置产品成分</el-button>
            </template>
          </el-popover>

          <el-popover
            v-model="batchStockPopoverVisible"
            placement="bottom"
            width="250"
            trigger="click"
          >
            <div style="display: flex; flex-direction: column; gap: 10px;">
              <el-radio-group v-model="batchOperateType.stock">
                <el-radio label="add">增加</el-radio>
                <el-radio label="sub">减少</el-radio>
                <el-radio label="set">统一值</el-radio>
              </el-radio-group>
              <el-input v-model.number="batchOperateValue.stock" type="number" min="0" placeholder="请输入数值"></el-input>
              <el-button type="primary" size="small" @click="batchAdjustStock">确认调整</el-button>
            </div>
            <template #reference>
              <el-button type="default" size="small">批量调整库存</el-button>
            </template>
          </el-popover>

          <el-popover
            v-model="batchPricePopoverVisible"
            placement="bottom"
            width="250"
            trigger="click"
          >
            <div style="display: flex; flex-direction: column; gap: 10px;">
              <el-radio-group v-model="batchOperateType.price">
                <el-radio label="add">增加</el-radio>
                <el-radio label="sub">减少</el-radio>
                <el-radio label="set">统一值</el-radio>
              </el-radio-group>
              <el-input v-model.number="batchOperateValue.price" type="number" min="0" step="0.01" placeholder="请输入数值"></el-input>
              <el-button type="primary" size="small" @click="batchAdjustPrice">确认调整</el-button>
            </div>
            <template #reference>
              <el-button type="default" size="small">批量调整价格</el-button>
            </template>
          </el-popover>
        </div>

        <div v-if="dialogSpecTableData.length > 0" class="spec-table-wrapper" style="margin-top: 20px;">
          <el-table
            :data="dialogSpecTableData"
            border
            stripe
            style="width: 100%;"
            :cell-style="{ whiteSpace: 'normal' }"
          >
            <el-table-column prop="spec_value" label="规格值" min-width="200"></el-table-column>
            <el-table-column prop="product_name" label="产品名称" min-width="150">
              <template #default="scope">
                <el-input v-model="scope.row.product_name" placeholder="请输入产品名称" size="small"></el-input>
              </template>
            </el-table-column>
            <el-table-column prop="composition" label="产品成分" min-width="200">
              <template #default="scope">
                <el-input v-model="scope.row.composition" type="textarea" placeholder="请输入产品成分" size="small" :rows="2"></el-input>
              </template>
            </el-table-column>
            <el-table-column prop="stock" label="库存数量" min-width="120">
              <template #default="scope">
                <el-input v-model.number="scope.row.stock" type="number" placeholder="请输入库存" size="small" min="0"></el-input>
              </template>
            </el-table-column>
            <el-table-column prop="price" label="产品价格" min-width="120">
              <template #default="scope">
                <el-input v-model.number="scope.row.price" type="number" step="0.01" placeholder="请输入价格" size="small" min="0"></el-input>
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="80">
              <template #default="scope">
                <el-button
                  type="danger"
                  size="mini"
                  @click="deleteSpecTableRow(scope.$index)"
                  :disabled="dialogType === 'edit'"
                >
                  <Delete />
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div v-else-if="recordDialogForm.category_id && dialogSpecTableData.length === 0" style="text-align: center; padding: 20px; color: #999;">
          该品类暂无配置规格，请先在「品类管理」中添加规格
        </div>

        <div v-if="dialogSpecTableData.length > 0" class="record-dialog-form-row" style="margin-top: 20px;">
          <el-form-item label="生产日期" class="record-dialog-form-item">
            <el-date-picker v-model="recordDialogForm.production_date" type="date" placeholder="请选择生产日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD" class="form-input" style="width: 300px;"></el-date-picker>
          </el-form-item>
          <el-form-item label="生产人" class="record-dialog-form-item">
            <el-input v-model="recordDialogForm.production_user" placeholder="请输入生产人姓名（为空则不填写）" class="form-input" style="width: 300px;"></el-input>
          </el-form-item>
        </div>
        <el-form-item label="备注" v-if="dialogSpecTableData.length > 0" class="record-dialog-full-item">
          <el-input v-model="recordDialogForm.remark" type="textarea" placeholder="请输入备注" style="width: 100%;" :rows="3"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 10px; padding: 10px 0;">
          <button class="operate-btn cancel-btn" @click="recordDialogVisible = false" type="button">取消</button>
          <button
            class="operate-btn save-btn"
            @click="saveRecord"
            type="button"
            :disabled="!recordDialogForm.batch_id || !recordDialogForm.category_id || (dialogSpecTableData.length === 0)"
          >确定</button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchOperateDialogVisible"
      title="批量操作"
      width="400px"
      destroy-on-close
    >
      <el-form :model="batchOperateForm" label-width="80px">
        <el-form-item label="操作类型">
          <el-radio-group v-model="batchOperateForm.operate_type">
            <el-radio label="price">批量修改价格</el-radio>
            <el-radio label="stock">批量修改库存</el-radio>
            <el-radio label="delete">批量删除</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="batchOperateForm.operate_type !== 'delete'" label="操作方式">
          <el-radio-group v-model="batchOperateForm.operate_mode">
            <el-radio label="add">增加</el-radio>
            <el-radio label="sub">减少</el-radio>
            <el-radio label="set">设置为</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="batchOperateForm.operate_type !== 'delete'" label="操作值">
          <el-input v-model="batchOperateForm.operate_value" type="number" :step="batchOperateForm.operate_type === 'price' ? 0.01 : 1" class="form-input"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 10px; width: 100%; padding: 10px 0;">
          <button class="operate-btn cancel-btn" @click="batchOperateDialogVisible = false" type="button">取消</button>
          <button class="operate-btn save-btn" @click="doBatchOperate" type="button">确定</button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import Cookies from 'js-cookie'
import { ref, reactive, onMounted, computed, getCurrentInstance, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Picture, Loading, Delete, Edit, View } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
const { proxy } = getCurrentInstance()
const $axios = proxy.$axios
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})
// 图片预览相关
const imagePreviewVisible = ref(false)
const previewImageUrl = ref('')

// 预览图片方法
const previewImage = (row) => {
  if (!row.product_image) {
    ElMessage.warning('暂无图片可预览')
    return
  }
  previewImageUrl.value = getImageUrl(row.product_image)
  imagePreviewVisible.value = true
}
// 新增：表格引用
const recordTableRef = ref(null)

const uploadRefs = ref({})
const triggerUpload = (recordId) => {
  const uploadRef = uploadRefs.value[recordId]
  if (uploadRef?.$el) {
    uploadRef.$el.querySelector('input').click()
  } else {
    ElMessage.warning('上传组件未初始化')
  }
}

const debounce = (fn, delay) => {
  let timer = null
  const debounced = (...args) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
  debounced.cancel = () => {
    if (timer) clearTimeout(timer)
    timer = null
  }
  return debounced
}

const filterFormKey = ref(0)
const tableKey = ref(0)

const getImageUrl = (imagePath) => {
  if (!imagePath) return ''
  if (imagePath.startsWith('http')) return imagePath
  if (imagePath.startsWith('/media')) return imagePath
  return `/media/${imagePath}`
}

const allSelectedRecordIds = ref(new Set())
const selectedRecordIds = ref([])

// 核心修改：修正选中状态维护逻辑
const handleRecordSelectionChange = (val) => {
  const currentPageRecordIds = recordList.value.map(item => item.record_id)

  // 1. 移除当前页中已取消选中的记录ID
  currentPageRecordIds.forEach(id => {
    if (!val.some(item => item.record_id === id)) {
      allSelectedRecordIds.value.delete(id)
    }
  })

  // 2. 添加当前页中新选中的记录ID
  val.forEach(item => {
    allSelectedRecordIds.value.add(item.record_id)
  })

  // 3. 更新选中ID数组
  selectedRecordIds.value = Array.from(allSelectedRecordIds.value)
}

const handleRecordSelectionChangeDebounce = debounce(handleRecordSelectionChange, 300)

const categoryForm = reactive({ name: '' })
const categoryList = ref([])
const categoryDialogVisible = ref(false)
const categoryDialogType = ref('manage')
const categoryDialogForm = reactive({
  category_id: '',
  category_name: '',
  attributes: [],
  remark: ''
})
const newAttrName = ref('')
const categoryFormRef = ref(null)

const batchForm = reactive({ name: '' })
const batchList = ref([])
const batchDialogVisible = ref(false)
const batchDialogType = ref('manage')
const batchDialogForm = reactive({
  batch_id: '',
  batch_name: ''
})
const batchFormRef = ref(null)

const specForm = reactive({ category_id: '' })
const specList = ref([])
const specDialogForm = reactive({
  spec_id: '',
  category_id: '',
  spec_value: ''
})
const specFormRef = ref(null)
const currentCategoryAttrs = ref([])
const specAttrValues = reactive({})
const specCombinationList = ref([])
const isSpecManage = ref(false)
const currentManageCategoryId = ref('')
const currentManageCategoryName = ref('')

const recordForm = reactive({
  batch_id: '',
  category_id: '',
  spec_id: ''
})
const recordList = ref([])
const recordDialogVisible = ref(false)
const recordDialogForm = reactive({
  record_id: '',
  batch_id: '',
  category_id: '',
  spec_id: '',
  product_name: '',
  product_type: '',
  composition: '',
  stock: 0,
  price: '',
  production_date: '',
  production_user: '',
  remark: '',
  product_image: ''
})
const dialogSpecTableData = ref([]);
const recordFormRef = ref(null)
const batchOperateDialogVisible = ref(false)
const batchOperateForm = reactive({
  operate_type: '',
  operate_mode: '',
  operate_value: ''
})

const beforeImageUpload = (file, row) => {
  if (!row.record_id) {
    ElMessage.error('记录ID不存在，无法上传图片')
    return false
  }
  const isJPG = file.type === 'image/jpeg'
  const isPNG = file.type === 'image/png'
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isJPG && !isPNG) {
    ElMessage.error('仅支持上传JPG/PNG格式的图片！')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过5MB！')
    return false
  }
  return true
}

const imageUploadUrl = computed(() => '/api/production/image/upload/')
const uploadHeaders = computed(() => {
  const csrfToken = Cookies.get('csrftoken') || ''
  return { 'X-CSRFToken': csrfToken }
})
const batchNamePopoverVisible = ref(false)
const batchCompositionPopoverVisible = ref(false)
const batchStockPopoverVisible = ref(false)
const batchPricePopoverVisible = ref(false)

const batchOperateType = reactive({
  stock: 'set',
  price: 'set'
})

const batchOperateValue = reactive({
  productName: '',
  composition: '',
  stock: 0,
  price: 0
})

onMounted(() => {
  getCategoryList()
  getBatchList()
  getSpecList()
  getRecordList()
})

onUnmounted(() => {
  categoryDialogVisible.value = false
  batchDialogVisible.value = false
  recordDialogVisible.value = false
  batchOperateDialogVisible.value = false
  Object.keys(specAttrValues).forEach(key => delete specAttrValues[key])
  handleRecordSelectionChangeDebounce.cancel()
})

const batchSetProductName = () => {
  if (!batchOperateValue.productName.trim()) {
    ElMessage.warning('产品名称不能为空')
    return
  }
  dialogSpecTableData.value.forEach(row => {
    row.product_name = batchOperateValue.productName.trim()
  })
  batchNamePopoverVisible.value = false
  batchOperateValue.productName = ''
  ElMessage.success('产品名称批量设置成功')
}

const batchSetComposition = () => {
  if (!batchOperateValue.composition.trim()) {
    ElMessage.warning('产品成分不能为空')
    return
  }
  dialogSpecTableData.value.forEach(row => {
    row.composition = batchOperateValue.composition.trim()
  })
  batchCompositionPopoverVisible.value = false
  batchOperateValue.composition = ''
  ElMessage.success('产品成分批量设置成功')
}

const batchAdjustStock = () => {
  if (batchOperateValue.stock < 0) {
    ElMessage.warning('数值不能为负数')
    return
  }
  dialogSpecTableData.value.forEach(row => {
    const currentStock = row.stock || 0
    switch (batchOperateType.stock) {
      case 'add':
        row.stock = currentStock + batchOperateValue.stock
        break
      case 'sub':
        row.stock = Math.max(0, currentStock - batchOperateValue.stock)
        break
      case 'set':
        row.stock = batchOperateValue.stock
        break
    }
  })
  batchStockPopoverVisible.value = false
  batchOperateValue.stock = 0
  ElMessage.success('库存批量调整成功')
}

const batchAdjustPrice = () => {
  if (batchOperateValue.price < 0) {
    ElMessage.warning('数值不能为负数')
    return
  }
  dialogSpecTableData.value.forEach(row => {
    const currentPrice = row.price || 0
    switch (batchOperateType.price) {
      case 'add':
        row.price = currentPrice + batchOperateValue.price
        break
      case 'sub':
        row.price = Math.max(0, currentPrice - batchOperateValue.price)
        break
      case 'set':
        row.price = batchOperateValue.price
        break
    }
  })
  batchPricePopoverVisible.value = false
  batchOperateValue.price = 0
  ElMessage.success('价格批量调整成功')
}

const deleteSpec = async (specId) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除该规格吗？删除后关联的生产记录也会被删除！',
      '危险提示',
      { type: 'error' }
    )
    const res = await $axios.delete('/production/spec/manage/', {
      data: { spec_id: specId }
    })
    if (res.success) {
      ElMessage.success(res.message)
      getSpecList()
    } else {
      ElMessage.error(res.message)
    }
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('删除规格失败：' + err.message)
    }
  }
}

const getCategoryList = async () => {
  try {
    const res = await $axios.get('/production/category/manage/', { params: categoryForm })
    if (res.success) categoryList.value = res.data
    else ElMessage.error(res.message)
  } catch (err) {
    ElMessage.error('查询品类失败：' + err.message)
  }
}

const addCategoryAttr = () => {
  if (newAttrName.value.trim()) {
    categoryDialogForm.attributes.push(newAttrName.value.trim())
    newAttrName.value = ''
  } else ElMessage.warning('属性名称不能为空')
}

const removeCategoryAttr = (index) => categoryDialogForm.attributes.splice(index, 1)

const openCategoryDialog = (type, row = {}) => {
  categoryDialogVisible.value = true
  categoryDialogType.value = type
  isSpecManage.value = false
  if (type === 'add') {
    Object.assign(categoryDialogForm, { category_id: '', category_name: '', attributes: [], remark: '' })
  } else if (type === 'edit') {
    Object.assign(categoryDialogForm, {
      category_id: row.category_id,
      category_name: row.category_name,
      attributes: [...row.attributes],
      remark: row.remark || ''
    })
  }
}

const cancelCategoryEdit = () => {
  categoryDialogType.value = 'manage'
  Object.assign(categoryDialogForm, { category_id: '', category_name: '', attributes: [], remark: '' })
}

const saveCategory = async () => {
  try {
    if (!categoryDialogForm.category_name) {
      ElMessage.warning('品类名称不能为空')
      return
    }
    const res = categoryDialogForm.category_id
      ? await $axios.put('/production/category/manage/', categoryDialogForm)
      : await $axios.post('/production/category/manage/', categoryDialogForm)
    if (res.success) {
      ElMessage.success(res.message)
      getCategoryList()
    } else ElMessage.error(res.message)
  } catch (err) {
    ElMessage.error('保存品类失败：' + err.message)
  }
}

const deleteCategory = async (categoryId) => {
  try {
    await ElMessageBox.confirm('确定要删除该品类吗？删除后关联的规格和记录也会被删除！', '危险提示', { type: 'error' })
    const res = await $axios.delete('/production/category/manage/', { data: { category_id: categoryId } })
    if (res.success) {
      ElMessage.success(res.message)
      getCategoryList()
      getSpecList()
      getRecordList()
    } else ElMessage.error(res.message)
  } catch (err) {
    if (err !== 'cancel') ElMessage.error('删除品类失败：' + err.message)
  }
}

const getBatchList = async () => {
  try {
    const res = await $axios.get('/production/batch/manage/', { params: batchForm })
    if (res.success) batchList.value = res.data
    else ElMessage.error(res.message)
  } catch (err) {
    ElMessage.error('查询批次失败：' + err.message)
  }
}

const openBatchDialog = (type) => {
  batchDialogVisible.value = true
  batchDialogType.value = type
  if (type === 'add') Object.assign(batchDialogForm, { batch_id: '', batch_name: '' })
}

const cancelBatchEdit = () => {
  batchDialogType.value = 'manage'
  Object.assign(batchDialogForm, { batch_id: '', batch_name: '' })
}

const saveBatch = async () => {
  try {
    if (!batchDialogForm.batch_name) {
      ElMessage.warning('批次名称不能为空')
      return
    }
    const res = await $axios.post('/production/batch/manage/', batchDialogForm)
    if (res.success) {
      ElMessage.success(res.message)
      getBatchList()
    } else ElMessage.error(res.message)
  } catch (err) {
    ElMessage.error('保存批次失败：' + err.message)
  }
}

const deleteBatch = async (row) => {
  try {
    let confirmDelete = false
    const hasRecord = await $axios.get('/production/record/manage/', { params: { batch_id: row.batch_id } })
    if (hasRecord.success && hasRecord.data.length > 0) {
      await ElMessageBox.confirm('该批次下存在生产记录，确定要全部删除吗？', '提示', { type: 'warning' })
      confirmDelete = true
    }
    const res = await $axios.delete('/production/batch/manage/', {
      data: { batch_id: row.batch_id, confirm_delete: confirmDelete }
    })
    if (res.success) {
      ElMessage.success(res.message)
      getBatchList()
      getRecordList()
    } else if (res.data?.need_confirm) ElMessage.warning(res.message)
    else ElMessage.error(res.message)
  } catch (err) {
    if (err !== 'cancel') ElMessage.error('删除批次失败：' + err.message)
  }
}

const getSpecList = async () => {
  try {
    const res = await $axios.get('/production/spec/manage/', { params: specForm })
    if (res.success) specList.value = res.data
    else ElMessage.error(res.message)
  } catch (err) {
    ElMessage.error('查询规格失败：' + err.message)
  }
}

const openSpecManage = (row) => {
  currentManageCategoryId.value = row.category_id
  currentManageCategoryName.value = row.category_name
  isSpecManage.value = true
  initSpecCombinationData()
  specDialogForm.category_id = row.category_id
  specForm.category_id = row.category_id
  getSpecList()
  if (row.attributes?.length > 0) {
    currentCategoryAttrs.value = [...row.attributes]
    currentCategoryAttrs.value.forEach(attr => {
      specAttrValues[attr] = ['']
    })
  } else {
    currentCategoryAttrs.value = []
    ElMessage.warning('该品类未配置任何属性，请先编辑品类添加属性')
  }
}

const backToCategoryList = () => {
  isSpecManage.value = false
  initSpecCombinationData()
  specForm.category_id = ''
}

const initSpecCombinationData = () => {
  currentCategoryAttrs.value = []
  Object.keys(specAttrValues).forEach(key => {
    specAttrValues[key] = []
  })
  specCombinationList.value = []
  specDialogForm.spec_value = ''
}

const resetSpecForm = () => {
  initSpecCombinationData()
  isSpecManage.value = false
  specForm.category_id = ''
}

const addSpecAttrValue = (attr) => {
  specAttrValues[attr].push('')
}

const deleteSpecAttrValue = (attr, index) => {
  specAttrValues[attr].splice(index, 1)
  if (specAttrValues[attr].length === 0) {
    specAttrValues[attr].push('')
  }
}

const cartesianProduct = (arrays) => {
  return arrays.reduce((acc, curr) => {
    return acc.flatMap(a => curr.map(c => [...a, c]))
  }, [[]])
}

const generateSpecCombination = () => {
  const validAttrValues = {}
  let hasEmptyAttr = false
  currentCategoryAttrs.value.forEach(attr => {
    const values = specAttrValues[attr].filter(val => val?.trim())
    if (values.length === 0) {
      hasEmptyAttr = true
      ElMessage.warning(`请完善【${attr}】的属性值（至少填写一个有效值）`)
    }
    validAttrValues[attr] = values
  })
  if (hasEmptyAttr) return

  const attrValueArrays = currentCategoryAttrs.value.map(attr => validAttrValues[attr])
  const productResult = cartesianProduct(attrValueArrays)
  const newCombinations = productResult.map(comb => {
    return currentCategoryAttrs.value.map((attr, idx) => `${attr}:${comb[idx].trim()}`).join('/')
  })

  const uniqueCombinations = [...new Set([...specCombinationList.value, ...newCombinations])]
  specCombinationList.value = uniqueCombinations
  specDialogForm.spec_value = specCombinationList.value.join('；')
  ElMessage.success(`成功生成${newCombinations.length}组规格组合，累计${specCombinationList.value.length}组`)
}

const deleteSpecCombination = (index) => {
  specCombinationList.value.splice(index, 1)
  specDialogForm.spec_value = specCombinationList.value.join('；')
}

const cancelSpecEdit = () => {
  initSpecCombinationData()
  backToCategoryList()
}

const saveSpec = async () => {
  try {
    if (!specDialogForm.category_id) {
      ElMessage.warning('请选择所属品类')
      return
    }
    if (specCombinationList.value.length === 0) {
      ElMessage.warning('请先配置属性值并生成规格组合')
      return
    }
    const submitData = {
      category_id: specDialogForm.category_id,
      spec_value_list: specCombinationList.value
    }
    const res = await $axios.post('/production/spec/manage/', submitData)
    if (res.success) {
      ElMessage.success(res.message)
      getSpecList()
    } else ElMessage.error(res.message)
  } catch (err) {
    ElMessage.error('保存规格失败：' + err.message)
  }
}

const handleRecordCategoryChange = (categoryId) => {
  specForm.category_id = categoryId
  recordForm.spec_id = ''
  getSpecList()
}

const validateTableData = () => {
  const errorRows = [];
  dialogSpecTableData.value.forEach((row, index) => {
    if (!row.product_name?.trim()) {
      errorRows.push(`第${index + 1}行（${row.spec_value}）：产品名称不能为空`);
    }
    if (row.stock === '' || row.stock < 0) {
      errorRows.push(`第${index + 1}行（${row.spec_value}）：库存数量必须≥0`);
    }
  });
  return errorRows;
};

const handleDialogCategoryChange = (categoryId) => {
  if (!categoryId) {
    dialogSpecTableData.value = [];
    return;
  }
  $axios.get('/production/spec/manage/', { params: { category_id: categoryId } }).then(res => {
    if (res.success) {
      dialogSpecTableData.value = res.data.map(spec => ({
        spec_id: spec.spec_id,
        spec_value: spec.spec_value,
        product_name: '',
        product_type: '',
        composition: '',
        stock: 0,
        price: '',
        is_valid: true
      }));
    }
  }).catch(err => {
    ElMessage.error('查询规格失败：' + err.message);
    dialogSpecTableData.value = [];
  });
};

const deleteSpecTableRow = (index) => {
  ElMessageBox.confirm(
    '确定要删除该行规格数据吗？',
    '提示',
    { type: 'warning' }
  ).then(() => {
    dialogSpecTableData.value.splice(index, 1);
    ElMessage.success('删除成功');
  }).catch(() => {
    ElMessage.info('已取消删除');
  });
};

// 核心修改：优化数据加载后选中状态恢复逻辑
const getRecordList = async (resetPage = true) => {
  try {
    if (resetPage) {
      pagination.currentPage = 1
    }
    const params = {
      ...recordForm,
      page: pagination.currentPage,
      page_size: pagination.pageSize
    }
    const res = await $axios.get('/production/record/manage/', { params })
    if (res.success) {
      recordList.value = res.data.list
      pagination.total = res.data.total
      tableKey.value += 1
      filterFormKey.value += 1

      nextTick(() => {
        // 使用表格引用恢复选中状态（更可靠）
        if (recordTableRef.value) {
          recordList.value.forEach(row => {
            if (allSelectedRecordIds.value.has(row.record_id)) {
              recordTableRef.value.toggleRowSelection(row, true)
            }
          })
        }
      })
    } else {
      ElMessage.error(res.message)
    }
  } catch (err) {
    ElMessage.error('查询记录失败：' + err.message)
  }
}

const handleSizeChange = (val) => {
  pagination.pageSize = val
  getRecordList(false) // 不重置页码
}

const handleCurrentChange = (val) => {
  pagination.currentPage = val
  getRecordList(false) // 不重置页码
}
const dialogType = ref('add')
const currentEditRow = ref({})
const openRecordDialog = (type, row = {}) => {
  recordDialogVisible.value = true;
  dialogSpecTableData.value = [];
  dialogType.value = type;
  currentEditRow.value = type === 'edit' ? { ...row } : {};

  if (type === 'add') {
    Object.assign(recordDialogForm, {
      record_id: row.record_id || '',
      batch_id: row.batch_id || '',
      category_id: row.category_id || '',
      production_date: row.production_date || dayjs().format('YYYY-MM-DD'),
      production_user: row.production_user || '',
      remark: row.remark || '',
      product_image: row.product_image || ''
    });
  } else if (type === 'edit') {
    Object.assign(recordDialogForm, {
      record_id: row.record_id,
      batch_id: row.batch_id,
      category_id: row.category_id,
      production_date: row.production_date || dayjs().format('YYYY-MM-DD'),
      production_user: row.production_user || '',
      remark: row.remark || '',
      product_image: row.product_image || ''
    });
    dialogSpecTableData.value = [{
      spec_id: row.spec_id,
      spec_value: row.spec_value,
      product_name: row.product_name || '',
      composition: row.composition || '',
      stock: row.stock || 0,
      price: row.price || '',
      is_valid: true
    }];
  }
};

const saveRecord = async () => {
  if (!recordDialogForm.batch_id || !recordDialogForm.category_id) {
    ElMessage.warning('批次和品类不能为空');
    return;
  }
  if (dialogSpecTableData.value.length === 0) {
    ElMessage.warning('暂无规格数据可保存');
    return;
  }

  const errorRows = validateTableData();
  if (errorRows.length > 0) {
    ElMessageBox.alert(
      errorRows.join('<br/>'),
      '数据校验失败',
      { type: 'error', dangerouslyUseHTMLString: true }
    );
    return;
  }

  try {
    if (dialogType.value === 'edit' && recordDialogForm.record_id) {
      const rowData = dialogSpecTableData.value[0];
      const editData = {
        record_id: recordDialogForm.record_id,
        batch_id: recordDialogForm.batch_id,
        spec_id: rowData.spec_id,
        product_name: rowData.product_name?.trim() || '',
        composition: rowData.composition?.trim() || '',
        stock: Number(rowData.stock) || 0,
        price: rowData.price ? Number(rowData.price) : null,
        production_date: recordDialogForm.production_date || dayjs().format('YYYY-MM-DD'),
        production_user: recordDialogForm.production_user?.trim() || '',
        remark: recordDialogForm.remark?.trim() || ''
      };

      const res = await $axios.post('/production/record/manage/', editData);

      if (res.success) {
        ElMessage.success('记录编辑成功');
        recordDialogVisible.value = false;
        getRecordList();
      } else {
        ElMessage.error(`编辑失败：${res.message}`);
      }
      return;
    }

    const validData = dialogSpecTableData.value.filter(row => row.product_name?.trim() && row.stock >= 0);
    if (validData.length === 0) {
      ElMessage.warning('暂无有效数据可保存');
      return;
    }

    let successCount = 0;
    let failCount = 0;
    for (const row of validData) {
      try {
        const addData = {
          batch_id: recordDialogForm.batch_id,
          spec_id: row.spec_id,
          product_name: row.product_name.trim(),
          composition: row.composition.trim(),
          stock: row.stock,
          price: row.price || null,
          production_date: recordDialogForm.production_date || dayjs().format('YYYY-MM-DD'),
          production_user: recordDialogForm.production_user.trim() || '',
          remark: recordDialogForm.remark.trim()
        };
        await $axios.post('/production/record/manage/', addData);
        successCount++;
      } catch (err) {
        failCount++;
        console.error(`新增${row.spec_value}失败：`, err);
      }
    }

    ElMessage.success(`成功保存${successCount}条记录，失败${failCount}条`);
    recordDialogVisible.value = false;
    getRecordList();

  } catch (err) {
    console.error('保存记录异常：', err);
    ElMessage.error(`保存失败：${err.response?.data?.message || err.message || '未知错误'}`);
  }
};

// 核心修改：删除记录时清理选中状态
const deleteRecord = async (recordId) => {
  try {
    await ElMessageBox.confirm('确定要删除该记录吗？', '提示', { type: 'warning' })
    const res = await $axios.delete('/production/record/manage/', { data: { record_id: recordId } })
    if (res.success) {
      // 从全局选中集合中移除删除的ID
      allSelectedRecordIds.value.delete(recordId)
      selectedRecordIds.value = Array.from(allSelectedRecordIds.value)

      ElMessage.success(res.message)
      getRecordList()
    } else ElMessage.error(res.message)
  } catch (err) {
    if (err !== 'cancel') ElMessage.error('删除记录失败：' + err.message)
  }
}

const doBatchOperate = async () => {
  try {
    if (!batchOperateForm.operate_type) {
      ElMessage.warning('请选择操作类型')
      return
    }
    if (batchOperateForm.operate_type !== 'delete' && (!batchOperateForm.operate_mode || batchOperateForm.operate_value === '')) {
      ElMessage.warning('请选择操作方式并输入操作值')
      return
    }
    const confirmText = batchOperateForm.operate_type === 'delete'
      ? '确定要批量删除选中的记录吗？'
      : `确定要${batchOperateForm.operate_mode === 'add' ? '增加' : batchOperateForm.operate_mode === 'sub' ? '减少' : '设置'}${batchOperateForm.operate_type === 'price' ? '价格' : '库存'}为${batchOperateForm.operate_value}吗？`
    await ElMessageBox.confirm(confirmText, '提示', { type: 'warning' })
    const res = await $axios.put('/production/record/manage/', {
      operate_type: batchOperateForm.operate_type,
      record_ids: selectedRecordIds.value,
      operate_mode: batchOperateForm.operate_mode,
      operate_value: batchOperateForm.operate_value
    })
    if (res.success) {
      ElMessage.success(res.message)
      // 如果是删除操作，清空选中状态
      if (batchOperateForm.operate_type === 'delete') {
        allSelectedRecordIds.value.clear()
        selectedRecordIds.value = []
      }
      getRecordList()
    } else ElMessage.error(res.message)
  } catch (err) {
    if (err !== 'cancel') ElMessage.error('批量操作失败：' + err.message)
  }
}

const exportRecords = async () => {
  if (selectedRecordIds.value.length === 0) {
    ElMessage.warning('请先选中要导出的记录')
    return
  }

  try {
    const res = await $axios.post('/production/record/export/', { record_ids: selectedRecordIds.value }, {
      responseType: 'blob',
      timeout: 30000
    })

    if (!res.data || res.data.size === 0) {
      ElMessage.error('导出失败：返回空数据')
      return
    }

    const blob = new Blob([res.data])
    const fileName = decodeURIComponent(res.headers['content-disposition']?.split('filename=')[1] || `生产记录_${dayjs().format('YYYYMMDDHHmmss')}.csv`)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(a.href)
    ElMessage.success('CSV导出成功')
  } catch (err) {
    ElMessage.error('导出失败：' + (err.message || '未知错误'))
  }
}

const handleCellImageUploadSuccess = (res, row) => {
  if (typeof res !== 'object' || res === null) {
    ElMessage.error('图片上传失败：接口返回格式错误')
    return
  }

  if (res.success) {
    ElMessage.success('图片上传成功')
    row.product_image = res.data?.image_url || ''
    tableKey.value += 1
  } else {
    ElMessage.error(res.message || '图片上传失败')
  }
}

const deleteCellImage = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该图片吗？', '提示', { type: 'warning' })
    const res = await $axios.delete('/production/record/manage/', {
      data: { record_id: row.record_id, operate_type: 'image' },
      responseType: 'json'
    })
    if (res.success) {
      ElMessage.success('图片删除成功')
      row.product_image = ''
      tableKey.value += 1
    } else {
      ElMessage.error(res.message)
    }
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('删除图片失败：' + err.message)
    }
  }
}
</script>




<style>
.image-wrapper {
  position: relative;
  display: inline-block;
}
.image-actions {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px; /* 关键修改：从15px减小到8px，适配60px宽度 */
  opacity: 0;
  transition: opacity 0.2s;
  border-radius: 4px;
  box-sizing: border-box; /* 新增：确保内边距不影响尺寸 */
  padding: 0 4px; /* 新增：增加内边距，防止图标贴边 */
}
.image-wrapper:hover .image-actions {
  opacity: 1;
}
.action-icon {
  color: #fff;
  cursor: pointer;
  font-size: 13px !important; /* 关键修改：从14px微调为13px，减少宽度占用 */
  display: flex; /* 新增：确保图标居中显示 */
  align-items: center;
  justify-content: center;
}
/* 可选：增加图标点击区域，提升交互体验 */
.action-icon::before {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
}
.upload-placeholder:hover {
  background-color: #f5f5f5;
  border-color: #409eff;
}
.el-image-viewer__wrapper {
  z-index: 99999 !important;
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  background-color: rgba(0, 0, 0, 0.9) !important;
}
</style>
<style scoped>
.raw-material-container {
  padding: 20px;
  background: #f8f8f8;
  min-height: 100vh;
  box-sizing: border-box;
}
.cell-image-uploader {
  display: inline-block;
}
.form-card, .table-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  padding: 20px;
  margin-bottom: 20px;
  box-sizing: border-box;
}
.category-table {
  --el-table-row-height: auto;
}
.category-table /deep/ .el-table__cell {
  padding: 10px 8px !important;
  white-space: normal !important;
  word-break: break-all;
  line-height: 1.4;
}
.operate-btn-group {
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
}
.operate-btn-group .edit-btn {
  background-color: #67c23a;
  color: #fff;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.operate-btn-group .edit-btn:hover {
  background-color: #5eba2f;
}
.operate-btn-group .delete-btn {
  background-color: #f56c6c;
  color: #fff;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.operate-btn-group .delete-btn:hover {
  background-color: #f35858;
}
.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}
.form-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}
.pre-module-btn-group {
  display: flex;
  align-items: center;
  gap: 8px;
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
.form-input, .filter-input, .price-filter-input {
  height: 36px !important;
  border-radius: 4px;
  box-sizing: border-box;
}
.dialog-header {
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
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
  margin-bottom: 20px;
  padding: 15px;
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
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}
.table-wrapper {
  overflow-x: visible;
  border-radius: 4px;
  padding-bottom: 10px;
  box-sizing: border-box;
}
.material-table {
  width: 100%;
  --el-table-header-text-color: #333;
  --el-table-row-hover-bg-color: #f9f9f9;
  --el-table-border-color: #eee;
  --el-table-stripe-bg: #fafafa;
}
:deep(.material-table .el-table__header .el-table__cell) {
  text-align: center !important;
  justify-content: center;
  align-items: center;
}
:deep(.material-table .el-table__body .el-table__cell) {
  text-align: center !important;
  justify-content: center;
  align-items: center;
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
  min-width: 55px;
  padding: 0 4px;
  font-size: 12px;
  line-height: 1;
  border-radius: 4px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
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
:deep(.el-table__fixed-right) {
  height: auto !important;
  bottom: 16px !important;
}
:deep(.avatar-uploader) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
}
:deep(.avatar-uploader .avatar) {
  border-radius: 4px;
  object-fit: cover;
  border: 1px solid #eee;
}
:deep(.avatar-uploader-icon) {
  font-size: 28px;
  color: #8c8c8c;
  width: 80px;
  height: 80px;
  line-height: 80px;
  text-align: center;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
}
.spec-attr-config-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.spec-generate-btn-box {
  display: none;
}
.spec-attr-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
  width: 100%;
  box-sizing: border-box;
}
.spec-attr-label-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}
.spec-attr-label {
  width: auto;
  text-align: left;
  font-weight: 500;
  display: inline-block;
  white-space: nowrap;
}
.spec-attr-value-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 180px;
  overflow-y: auto;
  padding: 8px;
  border: 1px solid #e6e6e6;
  border-radius: 4px;
  box-sizing: border-box;
}
.spec-attr-value-item {
  display: flex;
  align-items: center;
  gap: 4px;
  width: calc(33.333% - 8px);
  box-sizing: border-box;
}
.spec-attr-input {
  width: 100% !important;
}
.spec-attr-btn {
  width: 24px;
  height: 24px;
  padding: 0;
  border-radius: 4px !important;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: normal;
  line-height: 1;
}
.spec-attr-plus-btn {
  margin-top: 0 !important;
  width: 24px !important;
  height: 24px !important;
}
:deep(.spec-attr-minus-btn) {
  border: none !important;
}
.spec-generate-btn {
  margin-top: 0;
  background-color: #67c23a !important;
  border-color: #67c23a !important;
  padding: 0 12px !important;
  height: 32px !important;
}
.spec-generate-btn:hover {
  background-color: #5eba2f !important;
  border-color: #5eba2f !important;
}
.spec-confirm-area {
  width: 100%;
}
.spec-cancel-btn {
  padding: 0 20px !important;
  height: 40px !important;
  font-size: 14px !important;
}
.spec-save-btn {
  background-color: #1989fa !important;
  border-color: #1989fa !important;
  padding: 0 20px !important;
  height: 40px !important;
  font-size: 14px !important;
  font-weight: 600 !important;
}
.spec-save-btn:hover {
  background-color: #0f7ae5 !important;
  border-color: #0f7ae5 !important;
}
@media (max-width: 767px) {
  .form-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .pre-module-btn-group {
    flex-wrap: wrap;
    width: 100%;
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
  .operate-btn-group {
    flex-wrap: wrap;
  }
  .spec-attr-value-item {
    width: 100%;
  }
}
</style>