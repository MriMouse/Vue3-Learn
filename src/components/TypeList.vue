<template>
    <div class="type-container">
        <div class="type-header">
            <h2 class="title">
                <span class="icon">👟</span>
                Shoes Type Management
            </h2>
            <div class="type-count">Total: {{ totalCount }} types</div>
        </div>

        <div class="action-bar">
            <button class="batch-action-btn" @click="toggleBatchStatus" :disabled="selectedTypes.length === 0">
                <span class="btn-icon">🔄</span>
                Batch Enable/Disable ({{ selectedTypes.length }})
            </button>
            <button class="add-btn" @click="showAddDialog">
                <span class="btn-icon">➕</span>
                Add New Type
            </button>
        </div>

        <div class="table-container">
            <table class="type-table">
                <thead>
                    <tr>
                        <th class="checkbox-col">
                            <input type="checkbox" v-model="selectAll" @change="handleSelectAll"
                                class="custom-checkbox">
                        </th>
                        <th class="index-col">No.</th>
                        <th class="name-col">Type Name</th>
                        <th class="remark-col">Remark</th>
                        <th class="status-col">Status</th>
                        <th class="action-col">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(type, index) in types" :key="type.typeId" class="type-row"
                        :class="{ 'even-row': index % 2 === 1 }">
                        <td class="checkbox-col">
                            <input type="checkbox" v-model="selectedTypes" :value="type.typeId" class="custom-checkbox">
                        </td>
                        <td class="index-col">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                        <td class="name-col">
                            <span class="type-name">{{ type.typeName }}</span>
                        </td>
                        <td class="remark-col">
                            <span class="type-remark" :title="type.typeRemark">{{ type.typeRemark || 'No remark'
                            }}</span>
                        </td>
                        <td class="status-col">
                            <label class="switch">
                                <input type="checkbox" :checked="!type.typeDisabled"
                                    @change="toggleStatus(type.typeId)" />
                                <span class="slider"></span>
                            </label>
                            <span class="status-text" :class="{ 'disabled-text': type.typeDisabled }">{{
                                type.typeDisabled ? 'Disabled' : 'Enabled' }}</span>
                        </td>
                        <td class="action-col">
                            <button class="edit-btn" @click="showEditDialog(type)" title="Edit Type">
                                ✏️
                            </button>
                            <button class="delete-btn" @click="deleteType(type.typeId)" title="Delete Type">
                                🗑️
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Pagination Controls -->
        <div class="pagination-container">
            <div class="pagination-info">
                <span>Page {{ currentPage }} of {{ totalPages }}</span>
                <span class="page-size-control">
                    Items per page:
                    <input type="number" v-model.number="pageSize" @change="handlePageSizeChange" min="1" max="100"
                        class="page-size-input">
                </span>
            </div>
            <div class="pagination-controls">
                <button class="page-btn" @click="goToPage(1)" :disabled="currentPage === 1">First</button>
                <button class="page-btn" @click="goToPage(currentPage - 1)"
                    :disabled="currentPage === 1">Previous</button>
                <span class="page-numbers">
                    <button v-for="page in visiblePages" :key="page" class="page-number-btn"
                        :class="{ 'active': page === currentPage }" @click="goToPage(page)">
                        {{ page }}
                    </button>
                </span>
                <button class="page-btn" @click="goToPage(currentPage + 1)"
                    :disabled="currentPage === totalPages">Next</button>
                <button class="page-btn" @click="goToPage(totalPages)"
                    :disabled="currentPage === totalPages">Last</button>
            </div>
        </div>

        <!-- Add/Edit Type Dialog -->
        <div v-if="showDialog" class="dialog-overlay" @click="closeDialog">
            <div class="dialog" @click.stop>
                <div class="dialog-header">
                    <h3>{{ isEditMode ? 'Edit Type' : 'Add New Type' }}</h3>
                    <button class="close-btn" @click="closeDialog">✕</button>
                </div>
                <div class="dialog-content">
                    <form @submit.prevent="isEditMode ? updateType() : addType()">
                        <div class="form-group">
                            <label for="typeName">Type Name:</label>
                            <input type="text" id="typeName" v-model="newType.typeName" required class="form-input">
                        </div>
                        <div class="form-group">
                            <label for="typeRemark">Remark:</label>
                            <textarea id="typeRemark" v-model="newType.typeRemark" class="form-textarea"
                                placeholder="Optional type description or remarks"></textarea>
                        </div>
                        <div class="form-group" v-if="isEditMode">
                            <label for="typeDisabled">Status:</label>
                            <select id="typeDisabled" v-model="newType.typeDisabled" class="form-input">
                                <option :value="false">Enabled</option>
                                <option :value="true">Disabled</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button type="button" @click="closeDialog" class="cancel-btn">Cancel</button>
                            <button type="submit"
                                :disabled="uploading || !newType.typeName || (isEditMode && !hasChanges)"
                                class="submit-btn">
                                {{ uploading ? (isEditMode ? 'Updating Type...' : 'Adding Type...') : (isEditMode ?
                                    'Update Type' : 'Add Type') }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <div v-if="loading" class="loading">Loading types...</div>
        <div v-if="error" class="error">{{ error }}</div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'

// Reactive data
const types = ref([])
const selectedTypes = ref([])
const loading = ref(false)
const error = ref('')
const showDialog = ref(false)
const uploading = ref(false)

// Edit mode state
const isEditMode = ref(false)
const originalType = ref({})

// Pagination data
const currentPage = ref(1)
const pageSize = ref(5)
const totalCount = ref(0)

// New type form data
const newType = ref({
    typeId: null,
    typeName: '',
    typeRemark: '',
    typeDisabled: false
})

// Computed property for select all checkbox
const selectAll = computed({
    get() {
        return types.value.length > 0 && selectedTypes.value.length === types.value.length
    },
    set(value) {
        if (value) {
            selectedTypes.value = types.value.map(type => type.typeId)
        } else {
            selectedTypes.value = []
        }
    }
})

// Pagination computed properties
const totalPages = computed(() => {
    return Math.ceil(totalCount.value / pageSize.value)
})

const visiblePages = computed(() => {
    const pages = []
    const start = Math.max(1, currentPage.value - 2)
    const end = Math.min(totalPages.value, currentPage.value + 2)

    for (let i = start; i <= end; i++) {
        pages.push(i)
    }
    return pages
})

// Check if there are changes in edit mode
const hasChanges = computed(() => {
    if (!isEditMode.value) return true

    return newType.value.typeName !== originalType.value.typeName ||
        newType.value.typeRemark !== originalType.value.typeRemark ||
        newType.value.typeDisabled !== originalType.value.typeDisabled
})

// Fetch types data
const fetchTypes = async () => {
    loading.value = true
    error.value = ''
    try {
        console.log('Fetching type data from API...')
        const params = new URLSearchParams();
        params.append('pageNum', currentPage.value);
        params.append('pageSize', pageSize.value);
        const response = await axios.post('/api/shoesType/getPage', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })

        if (response.data && response.data.data) {
            const pageInfo = response.data.data
            types.value = pageInfo.list || []
            totalCount.value = pageInfo.total || 0
            console.log(`Successfully loaded ${types.value.length} types, total: ${totalCount.value}`)
        } else {
            console.warn('Unexpected API response structure:', response.data)
            types.value = []
            totalCount.value = 0
        }
    } catch (error) {
        console.error('Error fetching types:', error)
        error.value = 'Failed to load type data. Please try again.'
        types.value = []
        totalCount.value = 0
    } finally {
        loading.value = false
    }
}

// Handle select all checkbox
const handleSelectAll = () => {
    if (selectAll.value) {
        selectedTypes.value = types.value.map(type => type.typeId)
    } else {
        selectedTypes.value = []
    }
}

// Toggle batch status
const toggleBatchStatus = async () => {
    if (selectedTypes.value.length === 0) {
        return
    }

    if (!confirm(`Are you sure you want to toggle the status of ${selectedTypes.value.length} selected types?`)) {
        return
    }

    loading.value = true
    error.value = ''
    try {
        for (const typeId of selectedTypes.value) {
            await toggleStatus(typeId)
        }

        selectedTypes.value = []
        await fetchTypes() // Refresh the list
    } catch (error) {
        console.error('Error toggling types status:', error)
        error.value = 'Failed to toggle types status. Please try again.'
    } finally {
        loading.value = false
    }
}

// Delete single type
const deleteType = async (typeId, showConfirm = true) => {
    if (showConfirm && !confirm(`Are you sure you want to delete this type?`)) {
        return
    }

    loading.value = true
    error.value = ''
    try {
        const params = new URLSearchParams();
        params.append('shoesTypeId', typeId);

        console.log('删除鞋型参数:', { shoesTypeId: typeId });

        const response = await axios.post('/api/shoesType/deleteShoesType', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (response.data && (response.data.ok === true || response.data.code === 200 || response.data.success)) {
            console.log('Delete type success:', response.data);
            if (showConfirm) {
                await fetchTypes() // Refresh the list only for single delete
            }
        } else {
            throw new Error(response.data?.msg || response.data?.message || 'Delete failed')
        }
    } catch (error) {
        console.error('Error deleting type:', error)
        error.value = 'Failed to delete type. Please try again.'
    } finally {
        if (showConfirm) {
            loading.value = false
        }
    }
}

// Toggle type status
const toggleStatus = async (typeId) => {
    loading.value = true
    error.value = ''
    try {
        const params = new URLSearchParams();
        params.append('shoesTypeId', typeId);

        console.log('切换鞋型状态参数:', { shoesTypeId: typeId });

        const response = await axios.post('/api/shoesType/toggleStatus', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (response.data && (response.data.ok === true || response.data.code === 200 || response.data.success)) {
            console.log('Toggle type status success:', response.data);
            await fetchTypes() // Refresh the list
        } else {
            throw new Error(response.data?.msg || response.data?.message || 'Toggle status failed')
        }
    } catch (error) {
        console.error('Error toggling type status:', error)
        error.value = 'Failed to toggle type status. Please try again.'
    } finally {
        loading.value = false
    }
}

// Show add dialog
const showAddDialog = () => {
    isEditMode.value = false
    showDialog.value = true
    resetForm()
}

// Show edit dialog
const showEditDialog = (type) => {
    isEditMode.value = true
    originalType.value = { ...type }
    newType.value = {
        typeId: type.typeId,
        typeName: type.typeName,
        typeRemark: type.typeRemark || '',
        typeDisabled: type.typeDisabled
    }

    showDialog.value = true
    error.value = ''
}

// Close dialog
const closeDialog = () => {
    showDialog.value = false
    resetForm()
}

// Reset form
const resetForm = () => {
    isEditMode.value = false
    originalType.value = {}
    newType.value = {
        typeId: null,
        typeName: '',
        typeRemark: '',
        typeDisabled: false
    }
    error.value = ''
}

// Add new type
const addType = async () => {
    // 基本验证
    if (!newType.value.typeName.trim()) {
        error.value = '请输入鞋型名称'
        return
    }

    loading.value = true
    uploading.value = true
    error.value = ''

    try {
        console.log('开始插入鞋型数据...')
        console.log('准备插入的数据:', {
            shoesTypeName: newType.value.typeName.trim(),
            shoesTypeRemark: newType.value.typeRemark.trim()
        })

        const params = new URLSearchParams();
        params.append('shoesTypeName', newType.value.typeName.trim());
        params.append('shoesTypeRemark', newType.value.typeRemark.trim());

        const response = await axios.post('/api/shoesType/insertShoesType', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        console.log('插入鞋型响应:', response.data)

        if (response.data && (response.data.ok === true || response.data.code === 200)) {
            console.log('添加鞋型成功:', response.data);
            closeDialog()
            await fetchTypes() // 刷新列表
        } else {
            throw new Error(response.data?.msg || response.data?.message || '添加鞋型失败')
        }
    } catch (error) {
        console.error('添加鞋型过程中发生错误:', error)
        console.error('错误详情:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            statusText: error.response?.statusText
        })

        let errorMessage = '添加鞋型失败，请重试'
        if (error.response?.data) {
            const serverError = error.response.data
            if (serverError.msg) {
                errorMessage = `服务器错误: ${serverError.msg}`
            } else if (serverError.message) {
                errorMessage = `服务器错误: ${serverError.message}`
            } else if (error.response.status === 500) {
                errorMessage = '服务器内部错误，请检查数据格式或联系管理员'
            }
        } else if (error.message) {
            errorMessage = error.message
        }

        error.value = errorMessage
    } finally {
        loading.value = false
        uploading.value = false
    }
}

// Update existing type
const updateType = async () => {
    // 基本验证
    if (!newType.value.typeName.trim()) {
        error.value = '请输入鞋型名称'
        return
    }

    loading.value = true
    uploading.value = true
    error.value = ''

    try {
        console.log('开始更新鞋型数据...')
        console.log('准备更新的数据:', {
            shoesTypeId: newType.value.typeId,
            shoesTypeName: newType.value.typeName.trim(),
            shoesTypeRemark: newType.value.typeRemark.trim(),
            shoesTypeDisabled: newType.value.typeDisabled
        })

        const params = new URLSearchParams();
        params.append('shoesTypeId', newType.value.typeId);
        params.append('shoesTypeName', newType.value.typeName.trim());
        params.append('shoesTypeRemark', newType.value.typeRemark.trim());
        params.append('shoesTypeDisabled', newType.value.typeDisabled);

        const response = await axios.post('/api/shoesType/updateShoesType', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        console.log('更新鞋型响应:', response.data)

        if (response.data && (response.data.ok === true || response.data.code === 200)) {
            console.log('更新鞋型成功:', response.data);
            closeDialog()
            await fetchTypes() // 刷新列表
        } else {
            throw new Error(response.data?.msg || response.data?.message || '更新鞋型失败')
        }
    } catch (error) {
        console.error('更新鞋型过程中发生错误:', error)
        console.error('错误详情:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            statusText: error.response?.statusText
        })

        let errorMessage = '更新鞋型失败，请重试'
        if (error.response?.data) {
            const serverError = error.response.data
            if (serverError.msg) {
                errorMessage = `服务器错误: ${serverError.msg}`
            } else if (serverError.message) {
                errorMessage = `服务器错误: ${serverError.message}`
            } else if (error.response.status === 500) {
                errorMessage = '服务器内部错误，请检查数据格式或联系管理员'
            }
        } else if (error.message) {
            errorMessage = error.message
        }

        error.value = errorMessage
    } finally {
        loading.value = false
        uploading.value = false
    }
}

// Pagination methods
const goToPage = (page) => {
    if (page >= 1 && page <= totalPages.value && page !== currentPage.value) {
        currentPage.value = page
        selectedTypes.value = [] // Clear selection when changing page
        fetchTypes()
    }
}

const handlePageSizeChange = () => {
    currentPage.value = 1 // Reset to first page when changing page size
    selectedTypes.value = [] // Clear selection
    fetchTypes()
}

// Lifecycle hook
onMounted(() => {
    fetchTypes()
})
</script>

<style scoped>
.type-container {
    max-width: 1400px;
    width: 95%;
    margin: 20px auto;
    padding: 24px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    font-family: 'Playfair Display', 'Georgia', serif;
}

.type-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 2px solid rgb(211, 169, 101);
}

.title {
    font-size: 2rem;
    font-weight: 600;
    color: rgb(211, 169, 101);
    margin: 0;
    display: flex;
    align-items: center;
    gap: 12px;
}

.icon {
    font-size: 2.2rem;
}

.type-count {
    font-size: 1.1rem;
    color: #666;
    font-weight: 500;
    background: rgba(211, 169, 101, 0.1);
    padding: 8px 16px;
    border-radius: 20px;
}

.action-bar {
    margin-bottom: 20px;
    display: flex;
    justify-content: flex-start;
    gap: 12px;
}

.batch-action-btn,
.add-btn {
    border: none;
    padding: 12px 24px;
    border-radius: 25px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'Playfair Display', serif;
}

.batch-action-btn {
    background: linear-gradient(135deg, #007bff, #0056b3);
    color: white;
}

.add-btn {
    background: linear-gradient(135deg, #28a745, #20c997);
    color: white;
}

.batch-action-btn:hover:not(:disabled),
.add-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.batch-action-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

.btn-icon {
    font-size: 1.1rem;
}

.table-container {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}

.type-table {
    width: 100%;
    border-collapse: collapse;
    font-family: 'Lora', 'Georgia', serif;
}

.type-table thead tr {
    background: linear-gradient(135deg, rgb(211, 169, 101), #d4af37);
    color: white;
}

.type-table th,
.type-table td {
    text-align: center;
}

.type-table th {
    padding: 16px 12px;
    font-weight: 600;
    font-size: 1rem;
    letter-spacing: 0.5px;
    color: white !important;
}

.type-table td {
    padding: 14px 12px;
    border-bottom: 1px solid #f0f0f0;
    vertical-align: middle;
    text-align: center;
}

.type-row {
    transition: all 0.2s ease;
}

.type-row:hover {
    background: rgba(211, 169, 101, 0.05);
    transform: translateY(-1px);
}

.even-row {
    background: rgba(243, 242, 234, 0.3);
}

.checkbox-col {
    width: 50px;
    text-align: center;
}

.index-col {
    width: 60px;
    text-align: center;
    font-weight: 600;
    color: rgb(211, 169, 101);
}

.name-col {
    width: 200px;
    font-family: 'Lora', 'Georgia', serif;
}

.type-name {
    font-weight: 600;
    color: #333;
    font-family: 'Lora', 'Georgia', serif;
}

.remark-col {
    width: 300px;
    text-align: center;
    padding: 8px 4px;
    font-family: 'Lora', 'Georgia', serif;
}

.type-remark {
    color: #666;
    font-size: 0.9rem;
    max-width: 280px;
    display: inline-block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: help;
}

.status-col {
    width: 140px;
    text-align: center;
    font-family: 'Lora', 'Georgia', serif;
}

/* Switch Toggle for Status */
.switch {
    position: relative;
    display: inline-block;
    width: 48px;
    height: 26px;
    min-width: 48px;
    vertical-align: middle;
}

.switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #ccc;
    transition: .4s;
    border-radius: 26px;
}

.slider:before {
    position: absolute;
    content: "";
    height: 20px;
    width: 20px;
    left: 3px;
    bottom: 3px;
    background: white;
    transition: .4s;
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.switch input:checked+.slider {
    background: linear-gradient(135deg, #28a745, #20c997);
}

.switch input:checked+.slider:before {
    transform: translateX(22px);
}

.status-text {
    display: inline-block;
    min-width: 60px;
    margin-left: 10px;
    font-weight: 600;
    font-size: 0.9rem;
    text-align: left;
    vertical-align: middle;
    color: #28a745;
}

.status-text.disabled-text {
    color: #dc3545;
}

.action-col {
    width: 120px;
    text-align: center;
}

.edit-btn,
.delete-btn {
    border: none;
    padding: 8px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 1rem;
    margin: 0 2px;
}

.edit-btn {
    background: linear-gradient(135deg, #28a745, #20c997);
    color: white;
}

.delete-btn {
    background: linear-gradient(135deg, #dc3545, #c82333);
    color: white;
}

.edit-btn:hover,
.delete-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.custom-checkbox {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: rgb(211, 169, 101);
}

/* Dialog Styles */
.dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.dialog {
    background: white;
    border-radius: 12px;
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid #eee;
    background: linear-gradient(135deg, rgb(211, 169, 101), #d4af37);
    color: white;
    border-radius: 12px 12px 0 0;
}

.dialog-header h3 {
    margin: 0;
    font-size: 1.3rem;
    font-weight: 600;
}

.close-btn {
    background: none;
    border: none;
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: background 0.2s ease;
}

.close-btn:hover {
    background: rgba(255, 255, 255, 0.2);
}

.dialog-content {
    padding: 24px;
}

.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    margin-bottom: 6px;
    font-weight: 600;
    color: #333;
}

.form-input,
.form-textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 1rem;
    transition: border-color 0.3s ease;
    box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus {
    outline: none;
    border-color: rgb(211, 169, 101);
}

.form-textarea {
    height: 80px;
    resize: vertical;
}

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid #eee;
}

.cancel-btn,
.submit-btn {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
}

.cancel-btn {
    background: #6c757d;
    color: white;
}

.submit-btn {
    background: linear-gradient(135deg, rgb(211, 169, 101), #d4af37);
    color: white;
}

.cancel-btn:hover {
    background: #5a6268;
}

.submit-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(211, 169, 101, 0.3);
}

.submit-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

/* Pagination */
.pagination-container {
    margin-top: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
    padding: 20px;
    background: rgba(243, 242, 234, 0.3);
    border-radius: 12px;
    font-family: 'Lora', 'Georgia', serif;
}

.pagination-info {
    display: flex;
    align-items: center;
    gap: 20px;
    color: #666;
    font-weight: 500;
}

.page-size-control {
    display: flex;
    align-items: center;
    gap: 8px;
}

.page-size-input {
    width: 60px;
    padding: 4px 8px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 0.9rem;
    text-align: center;
    transition: border-color 0.3s ease;
}

.page-size-input:focus {
    outline: none;
    border-color: rgb(211, 169, 101);
}

.pagination-controls {
    display: flex;
    align-items: center;
    gap: 8px;
}

.page-btn {
    background: white;
    color: rgb(211, 169, 101);
    border: 1px solid rgb(211, 169, 101);
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.9rem;
    font-weight: 500;
    font-family: 'Lora', serif;
}

.page-btn:hover:not(:disabled) {
    background: rgb(211, 169, 101);
    color: white;
    transform: translateY(-1px);
}

.page-btn:disabled {
    background: #f5f5f5;
    color: #ccc;
    border-color: #ddd;
    cursor: not-allowed;
    transform: none;
}

.page-numbers {
    display: flex;
    gap: 4px;
}

.page-number-btn {
    background: white;
    color: rgb(211, 169, 101);
    border: 1px solid rgb(211, 169, 101);
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.9rem;
    font-weight: 500;
    min-width: 40px;
    font-family: 'Lora', serif;
}

.page-number-btn:hover {
    background: rgba(211, 169, 101, 0.1);
    transform: translateY(-1px);
}

.page-number-btn.active {
    background: rgb(211, 169, 101);
    color: white;
    font-weight: 600;
}

.loading,
.error {
    text-align: center;
    padding: 20px;
    font-size: 1.1rem;
    font-weight: 500;
}

.loading {
    color: rgb(211, 169, 101);
}

.error {
    color: #dc3545;
    background: rgba(220, 53, 69, 0.1);
    border-radius: 8px;
    margin-top: 16px;
}

/* Responsive Design */
@media (max-width: 1200px) {
    .type-container {
        width: 98%;
        padding: 16px;
    }

    .type-table th,
    .type-table td {
        padding: 10px 8px;
        font-size: 0.9rem;
    }
}

@media (max-width: 768px) {
    .type-header {
        flex-direction: column;
        gap: 12px;
        text-align: center;
    }

    .title {
        font-size: 1.5rem;
    }

    .table-container {
        overflow-x: auto;
    }

    .action-bar {
        flex-direction: column;
        gap: 8px;
    }

    .batch-action-btn,
    .add-btn {
        width: 100%;
        justify-content: center;
    }

    .dialog {
        width: 95%;
        margin: 20px;
    }
}

@media (max-width: 480px) {
    .type-container {
        margin: 10px;
        padding: 12px;
    }

    .title {
        font-size: 1.3rem;
    }

    .type-table th,
    .type-table td {
        padding: 8px 4px;
        font-size: 0.8rem;
    }

    .remark-col {
        width: 200px;
    }

    .type-remark {
        max-width: 150px;
    }
}
</style>
