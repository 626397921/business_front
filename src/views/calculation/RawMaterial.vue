<template>
  <div class="raw-material-container">
    <!-- 1. 新增/编辑模块 -->
    <div class="form-card">
      <!-- 标题 + 新增类别按钮（弹窗触发） -->
      <div class="form-header">
        <div class="form-title">{{ isEdit ? '编辑原材料' : '新增原材料' }}</div>
        <el-button
          type="primary"
          @click="openCategoryDialog"
          class="category-add-btn"
          :disabled="categoryLoading"
        >
          新增类别
        </el-button>
      </div>

      <!-- 原材料表单：输入框高度统一 + 按钮同行 -->
      <el-form
        :model="materialForm"
        label-width="100px"
        class="material-form"
        @submit.prevent
        ref="materialFormRef"
        :rules="materialRules"
      >
        <el-row :gutter="15" class="form-main-row">
          <!-- 原材料类别：统一高度 + 适配宽度 -->
          <el-col :xs="24" :sm="7" :md="7" class="form-col">
            <el-form-item label="原材料类别" prop="category_id" class="material-form-item">
              <el-select
                v-model="materialForm.category_id"
                clearable
                class="form-input"
                placeholder="请先新增类别，再选择"
                :disabled="materialLoading"
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

          <!-- 原材料名称：统一高度 + 适配宽度 -->
          <el-col :xs="24" :sm="7" :md="7" class="form-col">
            <el-form-item label="原材料名称" prop="name" class="material-form-item">
              <el-input
                v-model="materialForm.name"
                clearable
                class="form-input"
                placeholder="如：黑色全棉/黑色大化"
                :disabled="materialLoading"
              />
            </el-form-item>
          </el-col>

          <!-- 单价 + 操作按钮：同行显示 + 宽度适配 -->
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
                  :disabled="materialLoading"
                  min="0.01"
                  max="999999.99"
                />
                <!-- 操作按钮组：同行紧跟输入框 -->
                <div class="btn-group-container">
                  <el-button
                    type="primary"
                    @click="handleAddMaterial"
                    class="operate-btn add-btn"
                    :loading="materialLoading"
                    v-if="!isEdit"
                  >
                    新增
                  </el-button>
                  <el-button
                    type="primary"
                    @click="handleEditMaterial"
                    class="operate-btn save-btn"
                    :loading="materialLoading"
                    v-if="isEdit"
                  >
                    保存修改
                  </el-button>
                  <el-button
                    v-if="isEdit"
                    type="default"
                    @click="cancelEdit"
                    class="operate-btn cancel-btn"
                    :disabled="materialLoading"
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

    <!-- 2. 表格模块 -->
    <div class="table-card">
      <div class="table-title">原材料列表</div>

      <!-- 筛选栏：输入框高度统一 + 均匀分布 + 补充时间筛选 -->
      <div class="filter-bar">
        <el-row :gutter="15" class="filter-main-row">
          <!-- 全局搜索：统一高度 -->
          <el-col :xs="24" :sm="5" :md="5" class="filter-col">
            <el-input
              v-model="globalFilter"
              placeholder="全局搜索：名称/类别"
              clearable
              prefix-icon="el-icon-search"
              class="filter-input"
              size="default"
            />
          </el-col>
          <!-- 类别筛选：统一高度 -->
          <el-col :xs="24" :sm="5" :md="5" class="filter-col">
            <el-select
              v-model="filterForm.categoryIds"
              multiple
              clearable
              placeholder="选择类别"
              class="filter-input"
              size="default"
            >
              <el-option
                v-for="item in categoryList"
                :key="item.category_id"
                :label="item.category_name"
                :value="item.category_id"
              />
            </el-select>
          </el-col>
          <!-- 单价区间：统一高度 -->
          <el-col :xs="24" :sm="6" :md="6" class="filter-col">
            <div class="price-filter-wrapper">
              <el-input
                v-model.number="filterForm.priceMin"
                type="number"
                step="0.01"
                precision="2"
                placeholder="¥最小"
                class="price-filter-input"
                size="default"
                min="0.01"
                max="999999.99"
              />
              <span class="price-separator">-</span>
              <el-input
                v-model.number="filterForm.priceMax"
                type="number"
                step="0.01"
                precision="2"
                placeholder="¥最大"
                class="price-filter-input"
                size="default"
                min="0.01"
                max="999999.99"
              />
            </div>
          </el-col>
          <!-- 时间筛选：新增 -->
          <el-col :xs="24" :sm="6" :md="6" class="filter-col">
            <el-date-picker
              v-model="filterForm.createTimeRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              class="filter-input"
              size="default"
            />
          </el-col>
          <!-- 重置按钮：统一高度 -->
          <el-col :xs="24" :sm="2" :md="2" class="filter-col btn-col">
            <el-button
              type="default"
              @click="resetFilter"
              icon="el-icon-refresh"
              class="reset-btn"
              size="default"
            >
              重置
            </el-button>
          </el-col>
        </el-row>

        <!-- 筛选标签 -->
        <div class="filter-tags" v-if="hasFilter">
          <el-tag
            v-for="(tag, index) in filterTags"
            :key="index"
            closable
            @close="removeFilterTag(tag.type)"
            class="filter-tag"
          >
            {{ tag.label }}
          </el-tag>
        </div>
      </div>

      <!-- 表格区域 -->
      <div class="table-wrapper">
        <el-table
          :data="filteredMaterialList"
          border
          stripe
          :header-cell-style="{ background: '#f5f5f5', color: '#333', fontWeight: '600', textAlign: 'center' }"
          :cell-style="{ verticalAlign: 'middle', textAlign: 'center' }"
          :row-style="{ height: '45px' }"
          class="material-table"
          v-loading="tableLoading"
          empty-text="暂无匹配的原材料数据"
        >
          <el-table-column prop="category_name" label="类别" min-width="100" align="center" sortable />
          <el-table-column prop="name" label="名称" min-width="150" align="center" sortable />
          <el-table-column prop="price" label="单价(元)" width="100" align="center" sortable>
            <template #default="scope">
              {{ scope.row.price ? scope.row.price.toFixed(2) : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="create_time" label="创建时间" min-width="180" align="center" sortable>
            <template #default="scope">
              {{ formatTime(scope.row.create_time) }}
            </template>
          </el-table-column>
          <el-table-column prop="update_time" label="最后更新时间" min-width="180" align="center" sortable>
            <template #default="scope">
              {{ formatTime(scope.row.update_time || scope.row.create_time) }}
            </template>
          </el-table-column>
          <!-- 操作列：按钮居中 -->
          <el-table-column label="操作" width="140" align="center" fixed="right">
            <template #default="scope">
              <div class="operate-btn-group">
                <el-button
                  type="primary"
                  size="small"
                  @click="handleEdit(scope.row)"
                  class="edit-btn"
                  :disabled="tableLoading"
                >
                  编辑
                </el-button>
                <el-button
                  type="danger"
                  size="small"
                  @click="handleDelete(scope.row.material_id)"
                  class="delete-btn"
                  :disabled="tableLoading"
                >
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
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
            :disabled="tableLoading"
          />
        </div>
      </div>
    </div>

    <!-- 新增类别弹窗 -->
    <el-dialog
      title="新增原材料类别"
      v-model="categoryDialogVisible"
      width="400px"
      :close-on-click-modal="false"
      @close="resetCategoryForm"
      :close-on-press-escape="false"
    >
      <el-form
        :model="categoryForm"
        ref="categoryFormRef"
        label-width="80px"
        :rules="categoryRules"
      >
        <el-form-item label="类别名称" prop="category_name">
          <el-input
            v-model="categoryForm.category_name"
            clearable
            placeholder="如：棉/化纤/粘胶/氨纶"
            class="form-input"
            :disabled="categoryLoading"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="categoryDialogVisible = false" :disabled="categoryLoading">取消</el-button>
        <el-button
          type="primary"
          @click="handleAddCategory"
          :loading="categoryLoading"
        >
          确认新增
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, getCurrentInstance } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// ========== 核心修改1：复用全局axios实例 ==========
const { proxy } = getCurrentInstance()
const $axios = proxy.$axios // 复用main.js配置的全局axios

// 基础配置（移除重复的axios创建）
const BASE_API = '/calculation' // 接口前缀（拼接在全局baseURL后）

// 响应式数据
const categoryLoading = ref(false)
const materialLoading = ref(false)
const tableLoading = ref(false)
const categoryFormRef = ref(null)
const materialFormRef = ref(null)
const isEdit = ref(false)
const categoryDialogVisible = ref(false) // 新增类别弹窗开关

// 分页
const currentPage = ref(1)
const pageSize = ref(10)

// 筛选条件
const globalFilter = ref('')
const filterForm = ref({
  categoryIds: [],
  priceMin: '',
  priceMax: '',
  createTimeRange: []
})

// 基础数据
const categoryList = ref([])
const materialList = ref([])

// ========== 核心修改2：优化表单验证规则 ==========
const materialRules = ref({
  category_id: [{ required: true, message: '请选择原材料类别', trigger: 'change' }],
  name: [
    { required: true, message: '请输入原材料名称', trigger: 'blur' },
    { min: 1, max: 50, message: '名称长度需在1-50字符之间', trigger: 'blur' }
  ],
  price: [
    { required: true, message: '请输入单价', trigger: 'blur' },
    { type: 'number', min: 0.01, max: 999999.99, message: '单价需在0.01-999999.99之间', trigger: 'blur' },
    { validator: (rule, value, callback) => {
      if (value && String(value).split('.').length > 1 && String(value).split('.')[1].length > 2) {
        callback(new Error('单价最多保留2位小数'))
      } else {
        callback()
      }
    }, trigger: 'blur' }
  ]
})

// 类别验证规则（新增去重校验）
const categoryRules = ref([
  { required: true, message: '请输入类别名称', trigger: 'blur' },
  { min: 1, max: 20, message: '类别名称长度需在1-20字符之间', trigger: 'blur' },
  { validator: (rule, value, callback) => {
    if (value) {
      const exist = categoryList.value.some(item => item.category_name.trim() === value.trim())
      if (exist) {
        callback(new Error('该类别已存在，请勿重复添加'))
      } else {
        callback()
      }
    } else {
      callback()
    }
  }, trigger: 'blur' }
])

const categoryForm = ref({ category_name: '' })
const materialForm = ref({ material_id: '', category_id: '', name: '', price: '' })

// ========== 核心修改3：优化时间格式化（修复时区问题） ==========
const formatTime = (timeStr) => {
  if (!timeStr) return '-'
  try {
    const date = new Date(timeStr)
    if (isNaN(date.getTime())) return '-'
    // 简化时区处理：直接使用toLocaleString，自动适配本地时区
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/\//g, '-')
  } catch (e) {
    return '-'
  }
}

// ========== 核心修改4：统一弹窗规范 - 错误处理封装 ==========
/**
 * 统一错误弹窗处理
 * @param {String} errMsg - 错误信息
 * @param {Boolean} isAuthError - 是否为权限错误（默认false）
 */
const handleErrorToast = (errMsg, isAuthError = false) => {
  // 权限类报错：使用ElMessageBox.alert（关键交互，手动关闭）
  if (isAuthError || errMsg.includes('无') && errMsg.includes('权限')) {
    ElMessageBox.alert(errMsg, '权限异常', {
      type: 'error',
      confirmButtonText: '确定',
      closeOnClickModal: false // 禁止点击遮罩关闭，必须手动确认
    })
  } else {
    // 普通错误：使用ElMessage.error（轻量反馈，自动消失）
    ElMessage.error(errMsg)
  }
}

// 筛选后的全量数据
const filteredAllMaterialList = computed(() => {
  if (tableLoading.value) return []
  let data = [...materialList.value]

  // 全局搜索（忽略大小写）
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

  // 时间筛选（新增：兼容日期格式）
  if (filterForm.value.createTimeRange.length === 2) {
    const [startDate, endDate] = filterForm.value.createTimeRange
    data = data.filter(item => {
      if (!item.create_time) return false
      const itemTime = new Date(item.create_time).setHours(0, 0, 0, 0)
      const start = new Date(startDate).setHours(0, 0, 0, 0)
      const end = new Date(endDate).setHours(0, 0, 0, 0)
      return itemTime >= start && itemTime <= end
    })
  }

  return data
})

// 总条数
const total = computed(() => filteredAllMaterialList.value.length)

// 分页后数据
const filteredMaterialList = computed(() => {
  if (tableLoading.value) return []
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  return filteredAllMaterialList.value.slice(startIndex, endIndex)
})

// 筛选标签（补充时间标签）
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
    const min = filterForm.value.priceMin || '0.01'
    const max = filterForm.value.priceMax || '999999.99'
    tags.push({ type: 'price', label: `单价：${min}-${max}元` })
  }
  if (filterForm.value.createTimeRange.length === 2) {
    tags.push({ type: 'time', label: `创建时间：${filterForm.value.createTimeRange[0]} 至 ${filterForm.value.createTimeRange[1]}` })
  }
  return tags
})

const hasFilter = computed(() => filterTags.value.length > 0)

// 监听筛选条件变化，自动重置页码
watch([globalFilter, () => filterForm.value.categoryIds, () => filterForm.value.priceMin, () => filterForm.value.priceMax, () => filterForm.value.createTimeRange], () => {
  currentPage.value = 1
}, { deep: true })

// 加载数据
onMounted(async () => {
  await loadCategoryList()
  await loadMaterialList()
})

// ========== 核心修改5：统一使用全局axios，按规范处理弹窗 ==========
const loadCategoryList = async () => {
  try {
    tableLoading.value = true
    const res = await $axios.get(`${BASE_API}/category/list/`)
    categoryList.value = res.data || []
  } catch (error) {
    // 普通加载错误：轻量反馈
    handleErrorToast('加载类别列表失败，请重试')
  } finally {
    tableLoading.value = false
  }
}

const loadMaterialList = async () => {
  try {
    tableLoading.value = true
    const res = await $axios.get(`${BASE_API}/material/list/`)
    materialList.value = res.data || []
  } catch (error) {
    // 普通加载错误：轻量反馈
    handleErrorToast('加载原材料列表失败，请重试')
  } finally {
    tableLoading.value = false
  }
}

// 重置筛选
const resetFilter = () => {
  globalFilter.value = ''
  filterForm.value = { categoryIds: [], priceMin: '', priceMax: '', createTimeRange: [] }
  currentPage.value = 1
  // 操作成功：轻量反馈
  ElMessage.success('筛选条件已重置')
}

// 移除单个筛选标签
const removeFilterTag = (type) => {
  switch (type) {
    case 'global': globalFilter.value = ''; break
    case 'category': filterForm.value.categoryIds = []; break
    case 'price': filterForm.value.priceMin = ''; filterForm.value.priceMax = ''; break
    case 'time': filterForm.value.createTimeRange = []; break
  }
  currentPage.value = 1
}

// 分页操作
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

// ========== 核心修改6：新增类别 - 按规范处理弹窗 ==========
const handleAddCategory = async () => {
  if (!categoryFormRef.value) return
  try {
    await categoryFormRef.value.validate()
  } catch (error) {
    // 表单验证警告：轻量反馈
    ElMessage.warning('请输入有效的类别名称！')
    return
  }
  const name = categoryForm.value.category_name.trim()
  if (!name) {
    ElMessage.warning('请输入类别名称！')
    return
  }

  try {
    categoryLoading.value = true
    await $axios.post(`${BASE_API}/category/add/`, { category_name: name })
    // 操作成功：轻量反馈
    ElMessage.success('新增类别成功！')
    categoryDialogVisible.value = false
    await loadCategoryList()
  } catch (error) {
    // 权限错误自动识别，普通错误用轻量反馈
    handleErrorToast(error.message || '新增类别失败：服务器异常')
  } finally {
    categoryLoading.value = false
  }
}

// 新增原材料
const handleAddMaterial = async () => {
  if (categoryList.value.length === 0) {
    ElMessage.warning('请先新增原材料类别！')
    return
  }
  if (!materialFormRef.value) {
    handleErrorToast('表单初始化失败，请刷新')
    return
  }

  try {
    await materialFormRef.value.validate()
  } catch (err) {
    ElMessage.warning('请填写完整且有效的表单数据！')
    return
  }

  const { category_id, name, price } = materialForm.value
  const trimName = name.trim()
  if (!category_id || !trimName || price <= 0) {
    ElMessage.warning('表单数据有误，请检查！')
    return
  }

  // 检查名称是否重复（同类别下）
  const isDuplicate = materialList.value.some(item =>
    item.category_id === category_id && item.name.trim() === trimName
  )
  if (isDuplicate) {
    ElMessage.warning('该类别下已存在相同名称的原材料，请勿重复添加')
    return
  }

  try {
    materialLoading.value = true
    await $axios.post(`${BASE_API}/material/add/`, {
      category_id: Number(category_id),
      name: trimName,
      price: Number(price)
    })
    ElMessage.success('新增原材料成功！')
    materialForm.value = { material_id: '', category_id: '', name: '', price: '' }
    materialFormRef.value.resetFields()
    await loadMaterialList()
  } catch (error) {
    handleErrorToast(error.message || '新增失败：服务器异常')
  } finally {
    materialLoading.value = false
  }
}

// 编辑/保存/删除/取消
const handleEdit = (row) => {
  isEdit.value = true
  materialForm.value = { ...row }
}

const handleEditMaterial = async () => {
  if (!materialFormRef.value) return
  try {
    await materialFormRef.value.validate()
  } catch (error) {
    ElMessage.warning('表单填写不完整，请检查！')
    return
  }
  const { material_id, category_id, name, price } = materialForm.value
  const trimName = name.trim()
  if (!material_id || !category_id || !trimName || price <= 0) {
    ElMessage.warning('数据有误！')
    return
  }

  // 检查编辑后名称是否重复（同类别下，排除自身）
  const isDuplicate = materialList.value.some(item =>
    item.material_id !== material_id &&
    item.category_id === category_id &&
    item.name.trim() === trimName
  )
  if (isDuplicate) {
    ElMessage.warning('该类别下已存在相同名称的原材料，请勿重复')
    return
  }

  try {
    materialLoading.value = true
    await $axios.post(`${BASE_API}/material/edit/${material_id}/`, {
      category_id: Number(category_id),
      name: trimName,
      price: Number(price)
    })
    ElMessage.success('修改成功！')
    cancelEdit()
    await loadMaterialList()
  } catch (error) {
    handleErrorToast(error.message || '修改失败：服务器异常')
  } finally {
    materialLoading.value = false
  }
}

const cancelEdit = () => {
  isEdit.value = false
  materialForm.value = { material_id: '', category_id: '', name: '', price: '' }
  materialFormRef.value?.resetFields()
}

const handleDelete = async (materialId) => {
  if (!materialId) {
    ElMessage.warning('无效的原材料ID')
    return
  }
  try {
    // 删除确认：关键交互，必须手动选择
    await ElMessageBox.confirm('确定删除该原材料？删除后不可恢复！', '确认删除', {
      type: 'warning',
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      closeOnClickModal: false
    })
    await $axios.delete(`${BASE_API}/material/delete/${materialId}/`)
    ElMessage.success('删除成功！')
    await loadMaterialList()
  } catch (error) {
    if (error !== 'cancel') {
      handleErrorToast(error.message || '删除失败：服务器异常')
    }
  }
}
</script>
<style scoped>
/* 全局容器 */
.raw-material-container {
  padding: 20px;
  background: #f8f8f8;
  min-height: 100vh;
  box-sizing: border-box;
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

/* 标题 + 新增类别按钮 */
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
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

/* 表格样式 */
.table-wrapper {
  overflow-x: auto;
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
</style>