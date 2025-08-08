<template>
    <div class="ad-container">
        <div class="ad-header">
            <h2 class="title">
                <span class="icon">📢</span>
                Advertisement Management
            </h2>
            <div class="ad-count">Total: {{ totalCount }} advertisements</div>
        </div>

        <div class="action-bar">
            <button class="batch-delete-btn" @click="batchDelete" :disabled="selectedAds.length === 0">
                <span class="btn-icon">🗑️</span>
                Batch Delete ({{ selectedAds.length }})
            </button>
            <button class="add-btn" @click="showAddDialog">
                <span class="btn-icon">➕</span>
                Add New Ad
            </button>
        </div>

        <div class="table-container">
            <table class="ad-table">
                <thead>
                    <tr>
                        <th class="checkbox-col">
                            <input type="checkbox" v-model="selectAll" @change="handleSelectAll"
                                class="custom-checkbox">
                        </th>
                        <th class="index-col">No.</th>
                        <th class="company-col">Company Name</th>
                        <th class="fee-col">Fee</th>
                        <th class="period-col">Period Date</th>
                        <th class="image-col">Image</th>
                        <th class="url-col">URL</th>
                        <th class="action-col">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(ad, index) in ads" :key="ad.id" class="ad-row" :class="{ 'even-row': index % 2 === 1 }">
                        <td class="checkbox-col">
                            <input type="checkbox" v-model="selectedAds" :value="ad.id" class="custom-checkbox">
                        </td>
                        <td class="index-col">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                        <td class="company-col">
                            <span class="company-name">{{ ad.companyName }}</span>
                        </td>
                        <td class="fee-col">
                            <span class="fee-amount">¥{{ formatFee(ad.fee) }}</span>
                        </td>
                        <td class="period-col">
                            <span class="period-date">{{ formatDate(ad.periodDate) }}</span>
                        </td>
                        <td class="image-col">
                            <img v-if="ad.img" :src="getImageUrl(ad.img)" :alt="ad.companyName" class="ad-image"
                                @error="handleImageError" @load="handleImageLoad" />
                            <span v-else class="no-image">No Image</span>
                        </td>
                        <td class="url-col">
                            <a :href="ad.url" target="_blank" class="ad-url">{{ ad.url }}</a>
                        </td>
                        <td class="action-col">
                            <button class="edit-btn" @click="showEditDialog(ad)" title="Edit Ad">
                                ✏️
                            </button>
                            <button class="delete-btn" @click="deleteAd(ad.companyName)" title="Delete Ad">
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

        <!-- Add/Edit Ad Dialog -->
        <div v-if="showDialog" class="dialog-overlay" @click="closeDialog">
            <div class="dialog" @click.stop>
                <div class="dialog-header">
                    <h3>{{ isEditMode ? 'Edit Advertisement' : 'Add New Advertisement' }}</h3>
                    <button class="close-btn" @click="closeDialog">✕</button>
                </div>
                <div class="dialog-content">
                    <form @submit.prevent="isEditMode ? updateAd() : addAd()">
                        <div class="form-group">
                            <label for="companyName">Company Name:</label>
                            <input type="text" id="companyName" v-model="newAd.companyName" required class="form-input">
                        </div>
                        <div class="form-group">
                            <label for="fee">Fee (¥):</label>
                            <input type="number" id="fee" v-model.number="newAd.fee" required step="0.01" min="0"
                                class="form-input">
                        </div>
                        <div class="form-group">
                            <label for="periodDate">Period Date:</label>
                            <input type="date" id="periodDate" v-model="newAd.periodDate" required class="form-input">
                        </div>
                        <div class="form-group">
                            <label for="adImage">Image:</label>
                            <input type="file" id="adImage" @change="handleImageUpload" accept="image/*"
                                class="form-input">
                            <div v-if="imagePreview" class="image-preview">
                                <img :src="imagePreview" alt="Preview" @error="handlePreviewError" />
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="adUrl">URL:</label>
                            <input type="url" id="adUrl" v-model="newAd.url" required class="form-input">
                        </div>
                        <div class="form-actions">
                            <button type="button" @click="closeDialog" class="cancel-btn">Cancel</button>
                            <button type="submit"
                                :disabled="uploading || !newAd.companyName || !newAd.fee || !newAd.periodDate || !newAd.url || (isEditMode && !hasChanges)"
                                class="submit-btn">
                                {{ uploading ? (isEditMode ? 'Updating Ad...' : 'Adding Ad...') : (isEditMode ?
                                    'Update Ad' : 'Add Ad') }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <div v-if="loading" class="loading">Loading advertisements...</div>
        <div v-if="error" class="error">{{ error }}</div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'

// Reactive data
const ads = ref([])
const selectedAds = ref([])
const loading = ref(false)
const error = ref('')
const showDialog = ref(false)
const uploading = ref(false)
const imagePreview = ref('')

// Edit mode state
const isEditMode = ref(false)
const originalAd = ref({})

// Pagination data
const currentPage = ref(1)
const pageSize = ref(5)
const totalCount = ref(0)

// New ad form data
const newAd = ref({
    id: null,
    companyName: '',
    fee: 0,
    periodDate: '',
    img: '',
    url: '',
    imageFile: null // Store the selected file for upload
})

// Computed property for select all checkbox
const selectAll = computed({
    get() {
        return ads.value.length > 0 && selectedAds.value.length === ads.value.length
    },
    set(value) {
        if (value) {
            selectedAds.value = ads.value.map(ad => ad.id)
        } else {
            selectedAds.value = []
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

    return newAd.value.companyName !== originalAd.value.companyName ||
        newAd.value.fee !== originalAd.value.fee ||
        newAd.value.periodDate !== originalAd.value.periodDate ||
        newAd.value.url !== originalAd.value.url ||
        newAd.value.imageFile !== null
})

// Fetch ads data
const fetchAds = async () => {
    loading.value = true
    error.value = ''
    try {
        console.log('Fetching ad data from API...')
        const params = new URLSearchParams();
        params.append('pageNum', currentPage.value);
        params.append('pageSize', pageSize.value);
        const response = await axios.post('/api/ad/getPage', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })

        if (response.data && response.data.data) {
            const pageInfo = response.data.data
            ads.value = pageInfo.list || []
            totalCount.value = pageInfo.total || 0
            console.log(`Successfully loaded ${ads.value.length} ads, total: ${totalCount.value}`)
        } else {
            console.warn('Unexpected API response structure:', response.data)
            ads.value = []
            totalCount.value = 0
        }
    } catch (error) {
        console.error('Error fetching ads:', error)
        error.value = 'Failed to load advertisement data. Please try again.'
        ads.value = []
        totalCount.value = 0
    } finally {
        loading.value = false
    }
}

// Handle select all checkbox
const handleSelectAll = () => {
    if (selectAll.value) {
        selectedAds.value = ads.value.map(ad => ad.id)
    } else {
        selectedAds.value = []
    }
}

// Batch delete ads
const batchDelete = async () => {
    if (selectedAds.value.length === 0) {
        return
    }

    if (!confirm(`Are you sure you want to delete ${selectedAds.value.length} selected advertisements?`)) {
        return
    }

    loading.value = true
    error.value = ''
    try {
        const selectedAdObjects = ads.value.filter(ad => selectedAds.value.includes(ad.id))

        for (const ad of selectedAdObjects) {
            await deleteAd(ad.companyName, false)
        }

        selectedAds.value = []
        await fetchAds() // Refresh the list
    } catch (error) {
        console.error('Error batch deleting ads:', error)
        error.value = 'Failed to delete advertisements. Please try again.'
    } finally {
        loading.value = false
    }
}

// Delete single ad
const deleteAd = async (companyName, showConfirm = true) => {
    if (showConfirm && !confirm(`Are you sure you want to delete the advertisement for "${companyName}"?`)) {
        return
    }

    loading.value = true
    error.value = ''
    try {
        // 找到要删除的广告对象，获取图片信息
        const adToDelete = ads.value.find(ad => ad.companyName === companyName)
        const imgName = adToDelete?.img || ''
        // 从路径中提取文件名（移除开头的 / 符号）
        const imgPath = imgName.replace(/^\//, '')

        const params = new URLSearchParams();
        params.append('companyName', companyName);
        params.append('imgname', imgPath);

        console.log('删除广告参数:', { companyName: companyName, imgname: imgPath });

        const response = await axios.post('/api/ad/deleteAdvertisement', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (response.data && (response.data.ok === true || response.data.code === 200 || response.data.success)) {
            console.log('Delete ad success:', response.data);
            if (showConfirm) {
                await fetchAds() // Refresh the list only for single delete
            }
        } else {
            throw new Error(response.data?.msg || response.data?.message || 'Delete failed')
        }
    } catch (error) {
        console.error('Error deleting ad:', error)
        error.value = 'Failed to delete advertisement. Please try again.'
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
const showEditDialog = (ad) => {
    isEditMode.value = true
    originalAd.value = { ...ad }
    newAd.value = {
        id: ad.id,
        companyName: ad.companyName,
        fee: ad.fee,
        periodDate: formatDateForInput(ad.periodDate),
        img: ad.img,
        url: ad.url,
        imageFile: null
    }

    // Show current image as preview if exists
    if (ad.img) {
        imagePreview.value = getImageUrl(ad.img)
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
    originalAd.value = {}
    newAd.value = {
        id: null,
        companyName: '',
        fee: 0,
        periodDate: '',
        img: '',
        url: '',
        imageFile: null
    }
    imagePreview.value = ''
    error.value = ''

    // 清除文件输入框
    const fileInput = document.getElementById('adImage')
    if (fileInput) {
        fileInput.value = ''
    }
}

// Handle image selection (only preview, not upload)
const handleImageUpload = (event) => {
    const file = event.target.files[0]
    if (!file) {
        newAd.value.imageFile = null
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
    newAd.value.imageFile = file

    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => {
        imagePreview.value = e.target.result
    }
    reader.readAsDataURL(file)
}

// Add new ad
const addAd = async () => {
    // 基本验证
    if (!newAd.value.companyName.trim()) {
        error.value = '请输入公司名称'
        return
    }

    if (!newAd.value.fee || newAd.value.fee <= 0) {
        error.value = '请输入有效的费用'
        return
    }

    if (!newAd.value.periodDate) {
        error.value = '请选择投放日期'
        return
    }

    if (!newAd.value.url.trim()) {
        error.value = '请输入广告链接'
        return
    }

    // URL格式验证
    try {
        new URL(newAd.value.url)
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
        if (newAd.value.imageFile) {
            console.log('开始上传图片...', {
                fileName: newAd.value.imageFile.name,
                fileSize: newAd.value.imageFile.size,
                fileType: newAd.value.imageFile.type
            })

            const formData = new FormData()
            formData.append('image', newAd.value.imageFile)

            try {
                const uploadResponse = await axios.post('/api/ad/uploadImage', formData, {
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

        // 图片上传成功（或无图片）后，插入广告数据
        console.log('开始插入广告数据...')
        console.log('准备插入的数据:', {
            companyName: newAd.value.companyName.trim(),
            fee: newAd.value.fee,
            periodDate: new Date(newAd.value.periodDate),
            img: imagePath,
            url: newAd.value.url.trim()
        })

        const params = new URLSearchParams();
        params.append('companyName', newAd.value.companyName.trim());
        params.append('fee', newAd.value.fee.toString());
        params.append('periodDate', newAd.value.periodDate); // 直接发送yyyy-MM-dd格式
        params.append('img', imagePath);
        params.append('url', newAd.value.url.trim());

        // 打印发送的参数
        console.log('发送的imgPath:', imagePath)
        console.log('发送的插入参数:', {
            companyName: newAd.value.companyName.trim(),
            fee: newAd.value.fee.toString(),
            periodDate: newAd.value.periodDate,
            img: imagePath,
            url: newAd.value.url.trim()
        })

        const response = await axios.post('/api/ad/insertAdvertisement', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        console.log('插入广告响应:', response.data)

        // 检查插入广告的响应格式
        if (response.data && (response.data.ok === true || response.data.code === 200)) {
            console.log('添加广告成功:', response.data);
            closeDialog()
            await fetchAds() // 刷新列表
        } else {
            throw new Error(response.data?.msg || response.data?.message || '添加广告失败')
        }
    } catch (error) {
        console.error('添加广告过程中发生错误:', error)
        console.error('错误详情:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            statusText: error.response?.statusText
        })

        // 显示具体的错误信息
        let errorMessage = '添加广告失败，请重试'

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

// Update existing ad
const updateAd = async () => {
    // 基本验证
    if (!newAd.value.companyName.trim()) {
        error.value = '请输入公司名称'
        return
    }

    if (!newAd.value.fee || newAd.value.fee <= 0) {
        error.value = '请输入有效的费用'
        return
    }

    if (!newAd.value.periodDate) {
        error.value = '请选择投放日期'
        return
    }

    if (!newAd.value.url.trim()) {
        error.value = '请输入广告链接'
        return
    }

    // URL格式验证
    try {
        new URL(newAd.value.url)
    } catch {
        error.value = '请输入有效的URL格式'
        return
    }

    loading.value = true
    uploading.value = true
    error.value = ''

    try {
        let imagePath = newAd.value.img // 默认使用原有图片路径

        // 如果用户选择了新图片，先上传图片获取唯一文件名
        if (newAd.value.imageFile) {
            console.log('开始上传新图片...', {
                fileName: newAd.value.imageFile.name,
                fileSize: newAd.value.imageFile.size,
                fileType: newAd.value.imageFile.type
            })

            const formData = new FormData()
            formData.append('image', newAd.value.imageFile)

            try {
                const uploadResponse = await axios.post('/api/ad/uploadImage', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })

                console.log('新图片上传响应:', uploadResponse.data)

                if (uploadResponse.data && (uploadResponse.data.ok || uploadResponse.data.code === 200)) {
                    // 服务器返回的是唯一文件名，需要添加/前缀来匹配数据库格式
                    imagePath = '/' + uploadResponse.data.data
                    console.log('新图片上传成功，唯一文件名:', imagePath)
                } else {
                    throw new Error(uploadResponse.data?.msg || uploadResponse.data?.message || '图片上传失败')
                }
            } catch (uploadError) {
                console.error('图片上传失败:', uploadError)
                if (uploadError.response?.status === 413) {
                    throw new Error('图片文件过大，请选择更小的图片文件')
                } else if (uploadError.response?.status === 415) {
                    throw new Error('不支持的文件类型，请选择有效的图片文件')
                } else {
                    throw new Error(`图片上传失败: ${uploadError.message}`)
                }
            }
        }

        // 图片上传成功（或使用原图片）后，更新广告数据
        console.log('开始更新广告数据...')

        // 准备旧图片路径用于后端删除 - 只有在上传了新图片时才需要删除旧图片
        const oldImagePath = originalAd.value.img || '' // 获取原始图片路径
        const oldImgName = oldImagePath.replace(/^\//, '') // 移除开头的 / 符号，得到文件名

        console.log('旧图片信息:', {
            originalImg: originalAd.value.img,
            oldImagePath: oldImagePath,
            oldImgName: oldImgName,
            hasNewImage: !!newAd.value.imageFile
        })

        console.log('准备更新的数据:', {
            id: newAd.value.id,
            companyName: newAd.value.companyName.trim(),
            fee: newAd.value.fee,
            periodDate: newAd.value.periodDate,
            img: imagePath,
            url: newAd.value.url.trim(),
            oldImg: oldImgName,
            hasNewImage: !!newAd.value.imageFile
        })

        const params = new URLSearchParams();
        params.append('id', newAd.value.id);
        params.append('companyName', newAd.value.companyName.trim());
        params.append('fee', newAd.value.fee.toString());
        params.append('periodDate', newAd.value.periodDate); // 直接发送yyyy-MM-dd格式
        params.append('img', imagePath);
        params.append('url', newAd.value.url.trim());

        // 如果没有上传新图片，传递"WSY"告诉后端没有修改图片
        // 如果上传了新图片且原来有图片，传递旧图片文件名用于删除
        // 如果上传了新图片但原来没有图片，传递空字符串
        let oldImgToDelete;
        if (!newAd.value.imageFile) {
            oldImgToDelete = 'WSY'; // 没有修改图片
        } else if (oldImgName) {
            oldImgToDelete = oldImgName; // 有新图片且有旧图片，删除旧图片
        } else {
            oldImgToDelete = ''; // 有新图片但没有旧图片
        }
        params.append('oldImg', oldImgToDelete);

        // 打印发送的参数
        console.log('发送的更新参数:', {
            id: newAd.value.id,
            companyName: newAd.value.companyName.trim(),
            fee: newAd.value.fee.toString(),
            periodDate: newAd.value.periodDate,
            img: imagePath,
            url: newAd.value.url.trim(),
            oldImg: oldImgToDelete,
            hasNewImage: !!newAd.value.imageFile,
            imageAction: oldImgToDelete === 'WSY' ? '未修改图片' : oldImgToDelete ? '删除旧图片' : '新增图片'
        })

        // 打印完整的URLSearchParams内容
        console.log('URLSearchParams内容:')
        for (const [key, value] of params) {
            console.log(`${key}: "${value}"`)
        }

        const response = await axios.post('/api/ad/updateAdvertisement', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        console.log('更新广告响应:', response.data)

        if (response.data && (response.data.ok === true || response.data.code === 200)) {
            console.log('更新广告成功:', response.data);
            closeDialog()
            await fetchAds() // 刷新列表
        } else {
            throw new Error(response.data?.msg || response.data?.message || '更新广告失败')
        }
    } catch (error) {
        console.error('更新广告过程中发生错误:', error)
        console.error('错误详情:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            statusText: error.response?.statusText,
            config: error.config
        })

        let errorMessage = '更新广告失败，请重试'
        if (error.response?.data) {
            const serverError = error.response.data
            if (serverError.msg) {
                errorMessage = `服务器错误: ${serverError.msg}`
            } else if (serverError.message) {
                errorMessage = `服务器错误: ${serverError.message}`
            } else if (serverError.error) {
                errorMessage = `服务器错误: ${serverError.error}`
            } else if (error.response.status === 400) {
                errorMessage = '请求参数错误，请检查输入数据格式'
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

// Utility functions
const formatFee = (fee) => {
    return Number(fee).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('zh-CN')
}

const formatDateForInput = (date) => {
    if (!date) return ''
    const d = new Date(date)
    return d.toISOString().split('T')[0]
}

const getImageUrl = (imageName) => {
    if (!imageName) return ''

    const filename = imageName.replace(/^\//, '') // 移除开头的 / 符号
    const imageUrl = `/api/ad/getImage/${filename}`
    return imageUrl
}

// 图片加载错误处理
const handleImageError = (event) => {
    console.warn('图片加载失败:', event.target.src)
    event.target.style.display = 'none'
    // 可以设置默认图片
    // event.target.src = '/default-image.png'
}

// 图片加载成功处理
const handleImageLoad = (event) => {
    console.log('图片加载成功:', event.target.src)
    event.target.style.display = 'block'
}

// 预览图片错误处理
const handlePreviewError = (event) => {
    console.warn('预览图片加载失败:', event.target.src)
    imagePreview.value = ''
}

// Pagination methods
const goToPage = (page) => {
    if (page >= 1 && page <= totalPages.value && page !== currentPage.value) {
        currentPage.value = page
        selectedAds.value = [] // Clear selection when changing page
        fetchAds()
    }
}

const handlePageSizeChange = () => {
    currentPage.value = 1 // Reset to first page when changing page size
    selectedAds.value = [] // Clear selection
    fetchAds()
}

// Lifecycle hook
onMounted(() => {
    fetchAds()
})
</script>

<style scoped>
.ad-container {
    max-width: 1400px;
    width: 95%;
    margin: 20px auto;
    padding: 24px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    font-family: 'Playfair Display', 'Georgia', serif;
}

.ad-header {
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

.ad-count {
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

.ad-table {
    width: 100%;
    border-collapse: collapse;
    font-family: 'Lora', 'Georgia', serif;
}

.ad-table thead tr {
    background: linear-gradient(135deg, rgb(211, 169, 101), #d4af37);
    color: white;
}

.ad-table th,
.ad-table td {
    text-align: center;
}

.ad-table th {
    padding: 16px 12px;
    font-weight: 600;
    font-size: 1rem;
    letter-spacing: 0.5px;
    color: white !important;
}

.ad-table td {
    padding: 14px 12px;
    border-bottom: 1px solid #f0f0f0;
    vertical-align: middle;
    text-align: center;
}

.ad-row {
    transition: all 0.2s ease;
}

.ad-row:hover {
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

.company-col {
    width: 200px;
    font-family: 'Lora', 'Georgia', serif;
}

.company-name {
    font-weight: 600;
    color: #333;
    font-family: 'Lora', 'Georgia', serif;
}

.fee-col {
    width: 120px;
    font-family: 'Lora', 'Georgia', serif;
}

.fee-amount {
    font-weight: 600;
    color: #28a745;
    font-size: 1.1rem;
}

.period-col {
    width: 120px;
    font-family: 'Lora', 'Georgia', serif;
}

.period-date {
    color: #666;
    font-size: 0.9rem;
}

.image-col {
    width: 120px;
    text-align: center;
    padding: 8px 4px;
}

.ad-image {
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

.ad-image:hover {
    transform: scale(1.05);
    border-color: rgb(211, 169, 101);
    box-shadow: 0 2px 8px rgba(211, 169, 101, 0.3);
}

.no-image {
    color: #999;
    font-style: italic;
    font-size: 0.9rem;
}

.url-col {
    width: 250px;
    font-family: 'Lora', 'Georgia', serif;
}

.ad-url {
    color: #007bff;
    text-decoration: none;
    font-weight: 500;
    max-width: 200px;
    display: inline-block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.ad-url:hover {
    text-decoration: underline;
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
    .ad-container {
        width: 98%;
        padding: 16px;
    }

    .ad-table th,
    .ad-table td {
        padding: 10px 8px;
        font-size: 0.9rem;
    }
}

@media (max-width: 768px) {
    .ad-header {
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
    .ad-container {
        margin: 10px;
        padding: 12px;
    }

    .title {
        font-size: 1.3rem;
    }

    .ad-table th,
    .ad-table td {
        padding: 8px 4px;
        font-size: 0.8rem;
    }

    .url-col {
        width: 200px;
    }

    .ad-url {
        max-width: 150px;
    }
}
</style>
