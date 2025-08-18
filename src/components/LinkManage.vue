<template>
    <BaseToast ref="toast" :message="toastMessage" />
    <div class="link-container">
        <div class="link-header">
            <h2 class="title">
                <span class="icon">🔗</span>
                Partner Links Management
            </h2>
            <div class="link-count">Total: {{ totalCount }} links</div>
        </div>

        <div class="action-bar">
            <button class="batch-delete-btn" @click="batchDelete" :disabled="selectedLinks.length === 0">
                <span class="btn-icon">🗑️</span>
                Batch Delete ({{ selectedLinks.length }})
            </button>
            <button class="add-btn" @click="showAddDialog">
                <span class="btn-icon">➕</span>
                Add New Link
            </button>
        </div>

        <div class="table-container">
            <table class="link-table">
                <thead>
                    <tr>
                        <th class="checkbox-col">
                            <input type="checkbox" v-model="selectAll" @change="handleSelectAll"
                                class="custom-checkbox">
                        </th>
                        <th class="index-col">No.</th>
                        <th class="name-col">Link Name</th>
                        <th class="url-col">URL</th>
                        <th class="image-col">Image</th>
                        <th class="remark-col">Remark</th>
                        <th class="action-col">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(link, index) in links" :key="link.id" class="link-row"
                        :class="{ 'even-row': index % 2 === 1 }">
                        <td class="checkbox-col">
                            <input type="checkbox" v-model="selectedLinks" :value="link.id" class="custom-checkbox">
                        </td>
                        <td class="index-col">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                        <td class="name-col">
                            <span class="link-name">{{ link.name }}</span>
                        </td>
                        <td class="url-col">
                            <a :href="link.url" target="_blank" class="link-url">{{ link.url }}</a>
                        </td>
                        <td class="image-col">
                            <img v-if="link.img" :src="getImageUrl(link.img)" :alt="link.name" class="link-image" />
                            <span v-else class="no-image">No Image</span>
                        </td>
                        <td class="remark-col">
                            <span class="link-remark" :title="link.remark">{{ link.remark || 'No remark' }}</span>
                        </td>
                        <td class="action-col">
                            <button class="edit-btn" @click="showEditDialog(link)" title="Edit Link">
                                ✏️
                            </button>
                            <button class="delete-btn" @click="deleteLink(link.name)" title="Delete Link">
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
                    <input type="number" v-model.number="pageSizeInput" @change="handlePageSizeChange" min="1"
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

        <!-- Add Link Dialog -->
        <div v-if="showDialog" class="dialog-overlay" @click="closeDialog">
            <div class="dialog" @click.stop>
                <div class="dialog-header">
                    <h3>{{ isEditMode ? 'Edit Link' : 'Add New Link' }}</h3>
                    <button class="close-btn" @click="closeDialog">✕</button>
                </div>
                <div class="dialog-content">
                    <form @submit.prevent="isEditMode ? updateLink() : addLink()">
                        <div class="form-group">
                            <label for="linkName">Link Name:</label>
                            <input type="text" id="linkName" v-model="newLink.name" required class="form-input">
                        </div>
                        <div class="form-group">
                            <label for="linkUrl">URL:</label>
                            <input type="url" id="linkUrl" v-model="newLink.url" required class="form-input">
                        </div>
                        <div class="form-group">
                            <label for="linkImage">Image:</label>
                            <input type="file" id="linkImage" @change="handleImageUpload" accept="image/*"
                                class="form-input">
                            <div v-if="imagePreview" class="image-preview">
                                <img :src="imagePreview" alt="Preview" />
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="linkRemark">Remark:</label>
                            <textarea id="linkRemark" v-model="newLink.remark" class="form-textarea"></textarea>
                        </div>
                        <div class="form-actions">
                            <button type="button" @click="closeDialog" class="cancel-btn">Cancel</button>
                            <button type="submit"
                                :disabled="uploading || !newLink.name || !newLink.url || (isEditMode && !hasChanges)"
                                class="submit-btn">
                                {{ uploading ? (isEditMode ? 'Updating Link...' : 'Adding Link...') : (isEditMode ?
                                    'Update Link' : 'Add Link') }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <div v-if="loading" class="loading">Loading links...</div>
        <div v-if="error" class="error">{{ error }}</div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import axios from 'axios'
import BaseToast from './BaseToast.vue'

// Toast related
const toast = ref(null)
const toastMessage = ref('')

// Reactive data
const links = ref([])
const selectedLinks = ref([])
const loading = ref(false)
const error = ref('')
const showDialog = ref(false)
const uploading = ref(false)
const imagePreview = ref('')

// Edit mode state
const isEditMode = ref(false)
const originalLink = ref({})

// Pagination data
const currentPage = ref(1)
const pageSize = ref(5)
const totalCount = ref(0)
const pageSizeInput = ref(pageSize.value)

// New link form data
const newLink = ref({
    id: null,
    name: '',
    url: '',
    img: '',
    remark: '',
    imageFile: null // Store the selected file for upload
})

// Computed property for select all checkbox
const selectAll = computed({
    get() {
        return links.value.length > 0 && selectedLinks.value.length === links.value.length
    },
    set(value) {
        if (value) {
            selectedLinks.value = links.value.map(link => link.id)
        } else {
            selectedLinks.value = []
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

    return newLink.value.name !== originalLink.value.name ||
        newLink.value.url !== originalLink.value.url ||
        newLink.value.remark !== originalLink.value.remark ||
        newLink.value.imageFile !== null
})

// Fetch links data
const fetchLinks = async () => {
    loading.value = true
    error.value = ''
    try {
        console.log('Fetching link data from API...')
        const params = new URLSearchParams();
        params.append('pageNum', currentPage.value);
        params.append('pageSize', pageSize.value);
        const response = await axios.post('/api/link/getPage', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })

        if (response.data && response.data.data) {
            const pageInfo = response.data.data
            links.value = pageInfo.list || []
            totalCount.value = pageInfo.total || 0
            console.log(`Successfully loaded ${links.value.length} links, total: ${totalCount.value}`)
        } else {
            console.warn('Unexpected API response structure:', response.data)
            links.value = []
            totalCount.value = 0
        }
    } catch (error) {
        console.error('Error fetching links:', error)
        error.value = 'Failed to load link data. Please try again.'
        links.value = []
        totalCount.value = 0
    } finally {
        loading.value = false
    }
}

// Handle select all checkbox
const handleSelectAll = () => {
    if (selectAll.value) {
        selectedLinks.value = links.value.map(link => link.id)
    } else {
        selectedLinks.value = []
    }
}

// Batch delete links
const batchDelete = async () => {
    if (selectedLinks.value.length === 0) {
        return
    }

    if (!confirm(`Are you sure you want to delete ${selectedLinks.value.length} selected links?`)) {
        return
    }

    loading.value = true
    error.value = ''
    try {
        const selectedLinkObjects = links.value.filter(link => selectedLinks.value.includes(link.id))

        for (const link of selectedLinkObjects) {
            await deleteLink(link.name, false)
        }

        selectedLinks.value = []
        await fetchLinks() // Refresh the list
    } catch (error) {
        console.error('Error batch deleting links:', error)
        error.value = 'Failed to delete links. Please try again.'
    } finally {
        loading.value = false
    }
}

// Delete single link
const deleteLink = async (linkName, showConfirm = true) => {
    if (showConfirm && !confirm(`Are you sure you want to delete the link "${linkName}"?`)) {
        return
    }

    loading.value = true
    error.value = ''
    try {
        // 找到要删除的链接对象，获取图片信息
        const linkToDelete = links.value.find(link => link.name === linkName)
        const imgName = linkToDelete?.img || ''
        // 从路径中提取文件名（移除开头的 / 符号）
        const imgPath = imgName.replace(/^\//, '')

        const params = new URLSearchParams();
        params.append('name', linkName);
        params.append('imgname', imgPath);

        console.log('删除链接参数:', { name: linkName, imgname: imgPath });

        const response = await axios.post('/api/link/deleteLink', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (response.data && (response.data.ok === true || response.data.code === 200 || response.data.success)) {
            console.log('Delete link success:', response.data);
            if (showConfirm) {
                await fetchLinks() // Refresh the list only for single delete
            }
        } else {
            throw new Error(response.data?.msg || response.data?.message || 'Delete failed')
        }
    } catch (error) {
        console.error('Error deleting link:', error)
        error.value = 'Failed to delete link. Please try again.'
    } finally {
        if (showConfirm) {
            loading.value = false
        }
    }
}

// Show add dialog
const showAddDialog = () => {
    isEditMode.value = false
    showDialog.value = true
    resetForm()
}

// Show edit dialog
const showEditDialog = (link) => {
    isEditMode.value = true
    originalLink.value = { ...link }
    newLink.value = {
        id: link.id,
        name: link.name,
        url: link.url,
        img: link.img,
        remark: link.remark || '',
        imageFile: null
    }

    // Show current image as preview if exists
    if (link.img) {
        imagePreview.value = getImageUrl(link.img)
    } else {
        imagePreview.value = ''
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
    originalLink.value = {}
    newLink.value = {
        id: null,
        name: '',
        url: '',
        img: '',
        remark: '',
        imageFile: null
    }
    imagePreview.value = ''
    error.value = '' // 清除错误信息

    // 清除文件输入框
    const fileInput = document.getElementById('linkImage')
    if (fileInput) {
        fileInput.value = ''
    }
}

// Handle image selection (only preview, not upload)
const handleImageUpload = (event) => {
    const file = event.target.files[0]
    if (!file) {
        newLink.value.imageFile = null
        imagePreview.value = ''
        return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('请选择有效的图片文件')
        event.target.value = ''
        return
    }

    // Validate file size (e.g., max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('图片文件大小不能超过 5MB')
        event.target.value = ''
        return
    }

    // Store the file for later upload
    newLink.value.imageFile = file

    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => {
        imagePreview.value = e.target.result
    }
    reader.readAsDataURL(file)
}

// Add new link
const addLink = async () => {
    // 基本验证
    if (!newLink.value.name.trim()) {
        error.value = '请输入链接名称'
        return
    }

    if (!newLink.value.url.trim()) {
        error.value = '请输入链接URL'
        return
    }

    // URL格式验证
    try {
        new URL(newLink.value.url)
    } catch {
        error.value = '请输入有效的URL格式'
        return
    }

    loading.value = true
    uploading.value = true
    error.value = ''

    try {
        let imagePath = ''

        // 如果用户选择了图片，先上传图片获取唯一文件名
        if (newLink.value.imageFile) {
            console.log('开始上传图片...', {
                fileName: newLink.value.imageFile.name,
                fileSize: newLink.value.imageFile.size,
                fileType: newLink.value.imageFile.type
            })

            const formData = new FormData()
            formData.append('image', newLink.value.imageFile)

            try {
                const uploadResponse = await axios.post('/api/link/uploadImage', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })

                console.log('图片上传响应:', uploadResponse.data)

                // 检查服务器返回的数据结构
                if (uploadResponse.data && (uploadResponse.data.ok || uploadResponse.data.code === 200)) {
                    // 服务器返回的是唯一文件名，需要添加/前缀来匹配数据库格式
                    imagePath = '/' + uploadResponse.data.data
                    console.log('图片上传成功，唯一文件名:', imagePath)
                } else {
                    throw new Error(uploadResponse.data?.msg || uploadResponse.data?.message || '图片上传失败')
                }
            } catch (uploadError) {
                console.error('图片上传失败:', uploadError)

                // 处理不同类型的上传错误
                if (uploadError.response?.status === 413) {
                    throw new Error('图片文件过大，请选择更小的图片文件')
                } else if (uploadError.response?.status === 415) {
                    throw new Error('不支持的文件类型，请选择有效的图片文件')
                } else {
                    throw new Error(`图片上传失败: ${uploadError.message}`)
                }
            }
        }

        // 图片上传成功（或无图片）后，插入链接数据
        console.log('开始插入链接数据...')
        console.log('准备插入的数据:', {
            name: newLink.value.name.trim(),
            url: newLink.value.url.trim(),
            img: imagePath,
            remark: newLink.value.remark.trim()
        })

        const params = new URLSearchParams();
        params.append('name', newLink.value.name.trim());
        params.append('url', newLink.value.url.trim());
        params.append('img', imagePath);
        params.append('remark', newLink.value.remark.trim());

        // 打印发送的参数
        console.log('发送的imgPath:', imagePath)

        const response = await axios.post('/api/link/insertLink', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        console.log('插入链接响应:', response.data)

        // 检查插入链接的响应格式
        if (response.data && (response.data.ok === true || response.data.code === 200)) {
            console.log('添加链接成功:', response.data);
            closeDialog()
            await fetchLinks() // 刷新列表
        } else {
            throw new Error(response.data?.msg || response.data?.message || '添加链接失败')
        }
    } catch (error) {
        console.error('添加链接过程中发生错误:', error)
        console.error('错误详情:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            statusText: error.response?.statusText
        })

        // 显示具体的错误信息
        let errorMessage = '添加链接失败，请重试'

        if (error.response?.data) {
            // 如果服务器返回了具体的错误信息
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

// Update existing link
const updateLink = async () => {
    // 基本验证
    if (!newLink.value.name.trim()) {
        error.value = '请输入链接名称'
        return
    }

    if (!newLink.value.url.trim()) {
        error.value = '请输入链接URL'
        return
    }

    // URL格式验证
    try {
        new URL(newLink.value.url)
    } catch {
        error.value = '请输入有效的URL格式'
        return
    }

    loading.value = true
    uploading.value = true
    error.value = ''

    try {
        let imagePath = newLink.value.img // 默认使用原有图片路径

        // 如果用户选择了新图片，先上传图片获取唯一文件名
        if (newLink.value.imageFile) {
            console.log('开始上传新图片...', {
                fileName: newLink.value.imageFile.name,
                fileSize: newLink.value.imageFile.size,
                fileType: newLink.value.imageFile.type
            })

            const formData = new FormData()
            formData.append('image', newLink.value.imageFile)

            try {
                const uploadResponse = await axios.post('/api/link/uploadImage', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })

                console.log('图片上传响应:', uploadResponse.data)

                // 检查服务器返回的数据结构
                if (uploadResponse.data && (uploadResponse.data.ok || uploadResponse.data.code === 200)) {
                    // 服务器返回的是唯一文件名，需要添加/前缀来匹配数据库格式
                    imagePath = '/' + uploadResponse.data.data
                    console.log('图片上传成功，唯一文件名:', imagePath)
                } else {
                    throw new Error(uploadResponse.data?.msg || uploadResponse.data?.message || '图片上传失败')
                }
            } catch (uploadError) {
                console.error('图片上传失败:', uploadError)

                // 处理不同类型的上传错误
                if (uploadError.response?.status === 413) {
                    throw new Error('图片文件过大，请选择更小的图片文件')
                } else if (uploadError.response?.status === 415) {
                    throw new Error('不支持的文件类型，请选择有效的图片文件')
                } else {
                    throw new Error(`图片上传失败: ${uploadError.message}`)
                }
            }
        }

        // 图片上传成功（或无新图片）后，更新链接数据
        console.log('开始更新链接数据...')

        // 准备旧图片路径用于后端删除
        const oldImagePath = originalLink.value.img || '' // 获取原始图片路径
        const oldImgName = oldImagePath.replace(/^\//, '') // 移除开头的 / 符号，得到文件名

        // 如果没有上传新图片，传递"WSY"告诉后端没有修改图片
        // 如果上传了新图片且原来有图片，传递旧图片文件名用于删除
        // 如果上传了新图片但原来没有图片，传递空字符串
        let oldImgToDelete;
        if (!newLink.value.imageFile) {
            oldImgToDelete = 'WSY'; // 没有修改图片
        } else if (oldImgName) {
            oldImgToDelete = oldImgName; // 有新图片且有旧图片，删除旧图片
        } else {
            oldImgToDelete = ''; // 有新图片但没有旧图片
        }

        console.log('准备更新的数据:', {
            id: newLink.value.id,
            name: newLink.value.name.trim(),
            url: newLink.value.url.trim(),
            img: imagePath,
            remark: newLink.value.remark.trim(),
            oldImg: oldImgToDelete,
            hasNewImage: !!newLink.value.imageFile
        })

        const params = new URLSearchParams();
        params.append('id', newLink.value.id);
        params.append('name', newLink.value.name.trim());
        params.append('url', newLink.value.url.trim());
        params.append('img', imagePath);
        params.append('remark', newLink.value.remark.trim());
        params.append('oldImg', oldImgToDelete);

        const response = await axios.post('/api/link/updateLink', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        console.log('更新链接响应:', response.data)

        // 检查更新链接的响应格式
        if (response.data && (response.data.ok === true || response.data.code === 200)) {
            console.log('更新链接成功:', response.data);
            closeDialog()
            await fetchLinks() // 刷新列表
        } else {
            throw new Error(response.data?.msg || response.data?.message || '更新链接失败')
        }
    } catch (error) {
        console.error('更新链接过程中发生错误:', error)
        console.error('错误详情:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            statusText: error.response?.statusText
        })

        // 显示具体的错误信息
        let errorMessage = '更新链接失败，请重试'

        if (error.response?.data) {
            // 如果服务器返回了具体的错误信息
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

// Get image URL using the backend API endpoint
const getImageUrl = (imageName) => {
    if (!imageName) return ''

    // 直接从路径中提取文件名（现在数据库存储格式为 /filename.ext）
    const filename = imageName.replace(/^\//, '') // 移除开头的 / 符号

    // 构建图片URL并输出到控制台
    const imageUrl = `/api/link/getImage/${filename}`
    // console.log('Constructed image URL:', imageUrl)
    // console.log('Current window location:', window.location.href)
    // console.log('Expected to proxy to: http://localhost:8081/link/getImage/' + filename)
    return imageUrl
}

// Pagination methods
const goToPage = (page) => {
    if (page >= 1 && page <= totalPages.value && page !== currentPage.value) {
        currentPage.value = page
        selectedLinks.value = [] // Clear selection when changing page
        fetchLinks()
    }
}

const handlePageSizeChange = () => {
    const newSize = Number(pageSizeInput.value)

    if (isNaN(newSize) || newSize > 5) {
        toastMessage.value = 'Cannot be greater than 5'
        if (toast.value) {
            toast.value.show()
        }
        // Revert the input to the last valid page size
        pageSizeInput.value = pageSize.value
        return
    }

    if (newSize < 1) {
        pageSizeInput.value = 1
        pageSize.value = 1
    } else {
        pageSize.value = newSize
    }

    currentPage.value = 1
    selectedLinks.value = []
    fetchLinks()
}

// Keep the input in sync with the actual page size
watch(pageSize, (newValue) => {
    pageSizeInput.value = newValue
})

// Lifecycle hook
onMounted(() => {
    fetchLinks()
})
</script>

<style scoped>
.link-container {
    max-width: 1400px;
    width: 95%;
    margin: 20px auto;
    padding: 24px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    font-family: 'Playfair Display', 'Georgia', serif;
}

.link-header {
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

.link-count {
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

.batch-delete-btn,
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

.batch-delete-btn {
    background: linear-gradient(135deg, #dc3545, #c82333);
    color: white;
}

.add-btn {
    background: linear-gradient(135deg, #28a745, #20c997);
    color: white;
}

.batch-delete-btn:hover:not(:disabled),
.add-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.batch-delete-btn:disabled {
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

.link-table {
    width: 100%;
    border-collapse: collapse;
    font-family: 'Lora', 'Georgia', serif;
}

.link-table thead tr {
    background: linear-gradient(135deg, rgb(211, 169, 101), #d4af37);
    color: white;
}

.link-table th,
.link-table td {
    text-align: center;
}

.link-table th {
    padding: 16px 12px;
    font-weight: 600;
    font-size: 1rem;
    letter-spacing: 0.5px;
    color: white !important;
}

.link-table td {
    padding: 14px 12px;
    border-bottom: 1px solid #f0f0f0;
    vertical-align: middle;
    text-align: center;
}

.link-row {
    transition: all 0.2s ease;
}

.link-row:hover {
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

.link-name {
    font-weight: 600;
    color: #333;
    font-family: 'Lora', 'Georgia', serif;
}

.url-col {
    width: 300px;
    font-family: 'Lora', 'Georgia', serif;
}

.link-url {
    color: #007bff;
    text-decoration: none;
    font-weight: 500;
    max-width: 250px;
    display: inline-block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.link-url:hover {
    text-decoration: underline;
}

.image-col {
    width: 120px;
    text-align: center;
    padding: 8px 4px;
}

.link-image {
    max-width: 80px;
    height: 40px;
    width: auto;
    object-fit: contain;
    border-radius: 6px;
    border: 1px solid #e0e0e0;
    background: #fafafa;
    padding: 4px;
    transition: all 0.3s ease;
    display: block;
    margin: 0 auto;
}

.link-image:hover {
    transform: scale(1.05);
    border-color: rgb(211, 169, 101);
    box-shadow: 0 2px 8px rgba(211, 169, 101, 0.3);
}

.no-image {
    color: #999;
    font-style: italic;
    font-size: 0.9rem;
}

.remark-col {
    width: 200px;
    text-align: center;
    padding: 8px 4px;
    font-family: 'Lora', 'Georgia', serif;
}

.link-remark {
    color: #666;
    font-size: 0.9rem;
    max-width: 180px;
    display: inline-block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: help;
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

.image-preview {
    margin-top: 10px;
    text-align: center;
}

.image-preview img {
    max-width: 200px;
    max-height: 150px;
    border-radius: 6px;
    border: 2px solid #f0f0f0;
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

/* Pagination - reuse from UserList */
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
    .link-container {
        width: 98%;
        padding: 16px;
    }

    .link-table th,
    .link-table td {
        padding: 10px 8px;
        font-size: 0.9rem;
    }
}

@media (max-width: 768px) {
    .link-header {
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

    .batch-delete-btn,
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
    .link-container {
        margin: 10px;
        padding: 12px;
    }

    .title {
        font-size: 1.3rem;
    }

    .link-table th,
    .link-table td {
        padding: 8px 4px;
        font-size: 0.8rem;
    }

    .url-col {
        width: 200px;
    }

    .remark-col {
        width: 150px;
    }

    .link-remark {
        max-width: 120px;
    }

    .link-url {
        max-width: 150px;
    }
}
</style>
