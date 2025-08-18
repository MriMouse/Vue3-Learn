<template>
    <BaseToast ref="toast" :message="toastMessage" />
    <div class="product-container">
        <div class="product-header">
            <h2 class="title">
                <span class="icon">👟</span>
                Product Management
            </h2>
            <div class="product-count">Total: {{ totalCount }} products</div>
        </div>

        <div class="action-bar">
            <button class="batch-action-btn" @click="toggleBatchStatus" :disabled="selectedProducts.length === 0">
                <span class="btn-icon">🔄</span>
                Batch Enable/Disable ({{ selectedProducts.length }})
            </button>
            <button class="add-btn" @click="showAddDialog">
                <span class="btn-icon">➕</span>
                Add New Product
            </button>
        </div>

        <div class="table-container">
            <table class="product-table">
                <thead>
                    <tr>
                        <th class="checkbox-col">
                            <input type="checkbox" v-model="selectAll" @change="handleSelectAll"
                                class="custom-checkbox">
                        </th>
                        <th class="index-col">No.</th>
                        <th class="image-col">Image</th>
                        <th class="name-col">Product Name</th>
                        <th class="brand-col">Brand</th>
                        <th class="type-col">Type</th>
                        <th class="color-col">Color</th>
                        <th class="price-col">Price</th>
                        <th class="discount-col">Discount</th>
                        <th class="sales-col">Sales</th>
                        <th class="status-col">Status</th>
                        <th class="inventory-col">Inventory</th>
                        <th class="action-col">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(product, index) in products" :key="product.shoeId" class="product-row"
                        :class="{ 'even-row': index % 2 === 1 }">
                        <td class="checkbox-col">
                            <input type="checkbox" v-model="selectedProducts" :value="product.shoeId"
                                class="custom-checkbox">
                        </td>
                        <td class="index-col">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                        <td class="image-col">
                            <div v-if="product.images && product.images.length > 0" class="product-images">
                                <div class="image-carousel">
                                    <img :src="`/api/shoeImg/getImage/${product.images[product.currentImageIndex || 0].imagePath}`"
                                        :alt="product.name" class="main-product-image"
                                        @click="showImageGallery(product)">
                                    <!-- Image selector button for multiple images -->
                                    <div v-if="product.images.length > 1" class="image-selector">
                                        <button class="image-switch-btn" @click="cycleProductImage(product)"
                                            :title="`Switch image (${(product.currentImageIndex || 0) + 1}/${product.images.length})`">
                                            {{ (product.currentImageIndex || 0) + 1 }}/{{ product.images.length }}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div v-else class="no-image">
                                📷
                            </div>
                        </td>
                        <td class="name-col">
                            <div class="product-info">
                                <span class="product-name" :title="product.name">{{ product.name }}</span>
                                <small class="serial-number">{{ product.serialNumber }}</small>
                            </div>
                        </td>
                        <td class="brand-col">
                            <span class="brand-name">{{ product.brand?.brandName || 'N/A' }}</span>
                        </td>
                        <td class="type-col">
                            <span class="type-name">{{ product.shoesType?.typeName || 'N/A' }}</span>
                        </td>
                        <td class="color-col">
                            <span class="color-name">{{ product.color?.colorName || 'N/A' }}</span>
                        </td>
                        <td class="price-col">
                            <div class="price-info">
                                <span class="original-price">¥{{ product.price }}</span>
                            </div>
                        </td>
                        <td class="discount-col">
                            <span class="discount-price" v-if="product.discountPrice">¥{{ product.discountPrice
                                }}</span>
                            <span v-else class="no-discount">-</span>
                        </td>
                        <td class="sales-col">
                            <span class="sales-volume">{{ product.salesVolume || 0 }}</span>
                        </td>
                        <td class="status-col">
                            <label class="switch">
                                <input type="checkbox" :checked="!product.shoeDisabled"
                                    @change="toggleStatus(product.shoeId)" />
                                <span class="slider"></span>
                            </label>
                            <span class="status-text" :class="{ 'disabled-text': product.shoeDisabled }">{{
                                product.shoeDisabled ? 'Disabled' : 'Enabled' }}</span>
                        </td>
                        <td class="inventory-col">
                            <button class="inventory-btn" @click="showInventoryDialog(product)" title="View Inventory">
                                📦
                            </button>
                        </td>
                        <td class="action-col">
                            <button class="edit-btn" @click="showEditDialog(product)" title="Edit Product">
                                ✏️
                            </button>
                            <button class="delete-btn" @click="deleteProduct(product.shoeId)" title="Delete Product">
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

        <!-- Add/Edit Product Dialog -->
        <div v-if="showDialog" class="dialog-overlay" @click="closeDialog">
            <div class="dialog" @click.stop>
                <div class="dialog-header">
                    <h3>{{ isEditMode ? 'Edit Product' : 'Add New Product' }}</h3>
                    <button class="close-btn" @click="closeDialog">✕</button>
                </div>
                <div class="dialog-content">
                    <form @submit.prevent="isEditMode ? updateProduct() : addProduct()">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="productName">Product Name:</label>
                                <input type="text" id="productName" v-model="newProduct.name" required
                                    class="form-input">
                            </div>
                            <div class="form-group">
                                <label for="serialNumber">Serial Number:</label>
                                <input type="text" id="serialNumber" v-model="newProduct.serialNumber" required
                                    class="form-input">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="brandId">Brand:</label>
                                <select id="brandId" v-model="newProduct.brandId" required class="form-input">
                                    <option value="">Select Brand</option>
                                    <option v-for="brand in brands" :key="brand.brandId" :value="brand.brandId">
                                        {{ brand.brandName }}
                                    </option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="typeId">Type:</label>
                                <select id="typeId" v-model="newProduct.typeId" required class="form-input">
                                    <option value="">Select Type</option>
                                    <option v-for="type in types" :key="type.typeId" :value="type.typeId">
                                        {{ type.typeName }}
                                    </option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="colorId">Color:</label>
                                <select id="colorId" v-model="newProduct.colorId" required class="form-input">
                                    <option value="">Select Color</option>
                                    <option v-for="color in colors" :key="color.colorId" :value="color.colorId">
                                        {{ color.colorName }}
                                    </option>
                                </select>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="price">Price:</label>
                                <input type="number" id="price" v-model="newProduct.price" step="0.01" min="0" required
                                    class="form-input">
                            </div>
                            <div class="form-group">
                                <label for="discountPrice">Discount Price:</label>
                                <input type="number" id="discountPrice" v-model="newProduct.discountPrice" step="0.01"
                                    min="0" class="form-input">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="launchDate">Launch Date:</label>
                                <input type="date" id="launchDate" v-model="newProduct.launchDate" class="form-input">
                            </div>
                            <div class="form-group">
                                <label for="origin">Origin:</label>
                                <input type="text" id="origin" v-model="newProduct.origin" class="form-input">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="salesVolume">Sales Volume:</label>
                                <input type="number" id="salesVolume" v-model="newProduct.salesVolume" min="0"
                                    class="form-input">
                            </div>
                            <div class="form-group">
                                <label for="points">Points:</label>
                                <input type="number" id="points" v-model="newProduct.points" min="0" class="form-input">
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="description">Description:</label>
                            <textarea id="description" v-model="newProduct.description" class="form-textarea"
                                placeholder="Product description"></textarea>
                        </div>

                        <div class="form-group">
                            <label for="productImages">Product Images:</label>
                            <div class="image-upload-area">
                                <input type="file" id="productImages" @change="handleImagesUpload" accept="image/*"
                                    multiple class="form-input">
                                <div class="upload-help">You can select multiple images</div>

                                <!-- Preview selected images -->
                                <div v-if="selectedImages.length > 0" class="images-preview">
                                    <h4>Selected Images ({{ selectedImages.length }}):</h4>
                                    <div class="preview-grid">
                                        <div v-for="(image, index) in selectedImages" :key="index"
                                            class="image-preview-item">
                                            <img :src="image.preview" :alt="`Preview ${index + 1}`">
                                            <button type="button" @click="removeSelectedImage(index)"
                                                class="remove-image-btn">✕</button>
                                            <div class="image-name">{{ image.file.name }}</div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Show existing images in edit mode -->
                                <div v-if="isEditMode && existingImages.length > 0" class="existing-images">
                                    <h4>Current Images ({{ existingImages.length }}):</h4>
                                    <div class="preview-grid">
                                        <div v-for="image in existingImages" :key="image.imgId"
                                            class="image-preview-item existing">
                                            <img :src="`/api/shoeImg/getImage/${image.imagePath}`"
                                                :alt="image.imagePath">
                                            <button type="button" @click="removeExistingImage(image)"
                                                class="remove-image-btn">✕</button>
                                            <div class="image-name">{{ image.imagePath }}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="form-group" v-if="isEditMode">
                            <label for="productDisabled">Status:</label>
                            <select id="productDisabled" v-model="newProduct.shoeDisabled" class="form-input">
                                <option :value="false">Enabled</option>
                                <option :value="true">Disabled</option>
                            </select>
                        </div>

                        <div class="form-actions">
                            <button type="button" @click="closeDialog" class="cancel-btn">Cancel</button>
                            <button type="submit"
                                :disabled="uploading || !newProduct.name || !newProduct.serialNumber || (isEditMode && !hasChanges)"
                                class="submit-btn">
                                {{ uploading ? (isEditMode ? 'Updating Product...' : 'Adding Product...') : (isEditMode
                                    ?
                                    'Update Product' : 'Add Product') }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Inventory Management Dialog -->
        <div v-if="showInventoryModal" class="dialog-overlay" @click="closeInventoryDialog">
            <div class="dialog inventory-dialog" @click.stop>
                <div class="dialog-header">
                    <h3>Inventory Management - {{ currentProduct?.name }}</h3>
                    <button class="close-btn" @click="closeInventoryDialog">✕</button>
                </div>
                <div class="dialog-content">
                    <div v-if="inventoryLoading" class="loading">Loading inventory...</div>
                    <div v-else>
                        <div class="inventory-summary">
                            <h4>Inventory by Size</h4>
                            <div class="size-inventory-list">
                                <div v-for="sizeInfo in inventoryData" :key="sizeInfo.sizeId" class="size-item"
                                    :class="{ 'no-inventory': !sizeInfo.hasInventory }">
                                    <div class="size-info">
                                        <span class="size-name">Size {{ sizeInfo.size }}</span>
                                        <span class="size-stock" v-if="sizeInfo.hasInventory">Stock: {{ sizeInfo.stock
                                            }}</span>
                                        <span class="size-stock no-stock" v-else>No inventory record</span>
                                    </div>
                                    <div class="inventory-actions" v-if="sizeInfo.hasInventory">
                                        <button class="adjust-btn decrease-btn" @click="adjustInventory(sizeInfo, -1)"
                                            :disabled="sizeInfo.stock <= 0">-</button>
                                        <input type="number" v-model.number="sizeInfo.newStock" min="0"
                                            class="stock-input" @change="updateInventory(sizeInfo)">
                                        <button class="adjust-btn increase-btn"
                                            @click="adjustInventory(sizeInfo, 1)">+</button>
                                    </div>
                                    <div class="inventory-actions" v-else>
                                        <button class="add-inventory-btn" @click="addNewInventory(sizeInfo)"
                                            title="Add inventory record for this size">
                                            ➕
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="loading" class="loading">Loading products...</div>
        <div v-if="error" class="error">{{ error }}</div>

        <!-- Image Gallery Modal -->
        <div v-if="showImageGalleryModal" class="dialog-overlay" @click="closeImageGallery">
            <div class="dialog image-gallery-dialog" @click.stop>
                <div class="dialog-header">
                    <h3>{{ galleryProduct?.name }} - Images</h3>
                    <button class="close-btn" @click="closeImageGallery">✕</button>
                </div>
                <div class="dialog-content">
                    <div class="gallery-main-image">
                        <img v-if="galleryProduct?.images?.length > 0"
                            :src="`/api/shoeImg/getImage/${galleryProduct.images[galleryCurrentIndex].imagePath}`"
                            :alt="galleryProduct.name" class="main-gallery-image">
                        <div v-if="galleryProduct?.images?.length > 1" class="gallery-controls">
                            <button @click="previousGalleryImage" class="gallery-nav-btn prev">‹</button>
                            <button @click="nextGalleryImage" class="gallery-nav-btn next">›</button>
                        </div>
                        <!-- 确认按钮：独立定位到右下角 -->
                        <button v-if="galleryCurrentIndex > 0" class="gallery-confirm-btn"
                            @click="setDefaultImageFromGallery()"
                            :title="`Set image ${galleryCurrentIndex + 1} as default`">
                            Set as Default
                        </button>
                    </div>
                    <div v-if="galleryProduct?.images?.length > 1" class="gallery-thumbnails">
                        <img v-for="(image, index) in galleryProduct.images" :key="image.imgId"
                            :src="`/api/shoeImg/getImage/${image.imagePath}`"
                            :alt="`${galleryProduct.name} ${index + 1}`" class="gallery-thumbnail"
                            :class="{ 'active': index === galleryCurrentIndex }" @click="galleryCurrentIndex = index">
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive, nextTick, watch } from 'vue'
import axios from 'axios'
import BaseToast from './BaseToast.vue'

// Toast related
const toast = ref(null)
const toastMessage = ref('')

// Reactive data
const products = ref([])
const selectedProducts = ref([])
const loading = ref(false)
const error = ref('')
const showDialog = ref(false)
const uploading = ref(false)

// Options data
const brands = ref([])
const types = ref([])
const colors = ref([])
const sizes = ref([])

// Edit mode state
const isEditMode = ref(false)
const originalProduct = ref({})

// Pagination data
const currentPage = ref(1)
const pageSize = ref(5)
const totalCount = ref(0)
const pageSizeInput = ref(pageSize.value)

// Image upload - support multiple images
const selectedImages = ref([])
const existingImages = ref([])
const imagesToDelete = ref([])

// Inventory management
const showInventoryModal = ref(false)
const currentProduct = ref(null)
const inventoryData = ref([])
const inventoryLoading = ref(false)

// Image gallery
const showImageGalleryModal = ref(false)
const galleryProduct = ref(null)
const galleryCurrentIndex = ref(0)

// New product form data
const newProduct = ref({
    shoeId: null,
    name: '',
    serialNumber: '',
    brandId: '',
    typeId: '',
    colorId: '',
    price: '',
    discountPrice: '',
    launchDate: '',
    origin: '',
    description: '',
    salesVolume: 0,
    points: 0,
    shoeDisabled: false
})

// Computed property for select all checkbox
const selectAll = computed({
    get() {
        return products.value.length > 0 && selectedProducts.value.length === products.value.length
    },
    set(value) {
        if (value) {
            selectedProducts.value = products.value.map(product => product.shoeId)
        } else {
            selectedProducts.value = []
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

    return newProduct.value.name !== originalProduct.value.name ||
        newProduct.value.serialNumber !== originalProduct.value.serialNumber ||
        newProduct.value.brandId !== originalProduct.value.brandId ||
        newProduct.value.typeId !== originalProduct.value.typeId ||
        newProduct.value.colorId !== originalProduct.value.colorId ||
        newProduct.value.price !== originalProduct.value.price ||
        newProduct.value.discountPrice !== originalProduct.value.discountPrice ||
        newProduct.value.launchDate !== originalProduct.value.launchDate ||
        newProduct.value.origin !== originalProduct.value.origin ||
        newProduct.value.description !== originalProduct.value.description ||
        newProduct.value.salesVolume !== originalProduct.value.salesVolume ||
        newProduct.value.points !== originalProduct.value.points ||
        newProduct.value.shoeDisabled !== originalProduct.value.shoeDisabled ||
        selectedImages.value.length > 0 ||
        imagesToDelete.value.length > 0
})

// Fetch products data and their images
const fetchProducts = async () => {
    loading.value = true
    error.value = ''
    try {
        const params = new URLSearchParams();
        params.append('pageNum', currentPage.value);
        params.append('pageSize', pageSize.value);
        const response = await axios.post('/api/shoe/getPage', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })

        if (response.data && response.data.data) {
            const pageInfo = response.data.data
            const productList = pageInfo.list || []

            // Fetch images for each product
            for (let product of productList) {
                try {
                    const imageResponse = await axios.get(`/api/shoeImg/list/${product.shoeId}`)
                    if (imageResponse.data && imageResponse.data.data) {
                        // 使用响应式对象确保Vue能检测到变化
                        product.images = imageResponse.data.data
                        product.currentImageIndex = 0
                        product.defaultImageIndex = 0
                    } else {
                        product.images = []
                        product.currentImageIndex = 0
                        product.defaultImageIndex = 0
                    }
                } catch (imgError) {
                    product.images = []
                    product.currentImageIndex = 0
                    product.defaultImageIndex = 0
                }
            }

            // 将产品数组转换为响应式数组
            products.value = productList.map(product => reactive(product))
            totalCount.value = pageInfo.total || 0
        } else {
            products.value = []
            totalCount.value = 0
        }
    } catch (error) {
        console.error('Error fetching products:', error)
        error.value = 'Failed to load product data. Please try again.'
        products.value = []
        totalCount.value = 0
    } finally {
        loading.value = false
    }
}

// Fetch options data
const fetchOptions = async () => {
    try {
        // Fetch brands
        const brandResponse = await axios.post('/api/brand/getAll', {}, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
        if (brandResponse.data && brandResponse.data.data) {
            brands.value = brandResponse.data.data.filter(brand => !brand.brandDisabled)
        }

        // Fetch types
        const typeResponse = await axios.post('/api/shoesType/getAll', {}, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
        if (typeResponse.data && typeResponse.data.data) {
            types.value = typeResponse.data.data.filter(type => !type.typeDisabled)
        }

        // Fetch colors
        const colorResponse = await axios.post('/api/color/getAll', {}, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
        if (colorResponse.data && colorResponse.data.data) {
            colors.value = colorResponse.data.data.filter(color => !color.colorDisabled)
        }

        // Fetch sizes
        const sizeResponse = await axios.post('/api/shoesSize/getAll', {}, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
        if (sizeResponse.data && sizeResponse.data.data) {
            sizes.value = sizeResponse.data.data.filter(size => !size.sizeDisabled)
        }
    } catch (error) {
        console.error('Error fetching options:', error)
    }
}

// Handle select all checkbox
const handleSelectAll = () => {
    if (selectAll.value) {
        selectedProducts.value = products.value.map(product => product.shoeId)
    } else {
        selectedProducts.value = []
    }
}

// Toggle batch status
const toggleBatchStatus = async () => {
    if (selectedProducts.value.length === 0) {
        return
    }

    if (!confirm(`Are you sure you want to toggle the status of ${selectedProducts.value.length} selected products?`)) {
        return
    }

    loading.value = true
    error.value = ''
    try {
        for (const shoeId of selectedProducts.value) {
            await toggleStatus(shoeId)
        }

        selectedProducts.value = []
        await fetchProducts()
    } catch (error) {
        console.error('Error toggling products status:', error)
        error.value = 'Failed to toggle products status. Please try again.'
    } finally {
        loading.value = false
    }
}

// Delete single product
const deleteProduct = async (shoeId, showConfirm = true) => {
    if (showConfirm && !confirm(`Are you sure you want to delete this product? All associated images will also be deleted.`)) {
        return
    }

    loading.value = true
    error.value = ''
    try {
        const params = new URLSearchParams();
        params.append('shoeId', shoeId);

        const response = await axios.post('/api/shoe/deleteShoe', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (response.data && (response.data.ok === true || response.data.code === 200 || response.data.success)) {
            if (showConfirm) {
                await fetchProducts()
            }
        } else {
            throw new Error(response.data?.msg || response.data?.message || 'Delete failed')
        }
    } catch (error) {
        console.error('Error deleting product:', error)
        error.value = 'Failed to delete product. Please try again.'
    } finally {
        if (showConfirm) {
            loading.value = false
        }
    }
}

// Toggle product status
const toggleStatus = async (shoeId) => {
    loading.value = true
    error.value = ''
    try {
        const params = new URLSearchParams();
        params.append('shoeId', shoeId);

        const response = await axios.post('/api/shoe/toggleStatus', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (response.data && (response.data.ok === true || response.data.code === 200 || response.data.success)) {
            await fetchProducts()
        } else {
            throw new Error(response.data?.msg || response.data?.message || 'Toggle status failed')
        }
    } catch (error) {
        console.error('Error toggling product status:', error)
        error.value = 'Failed to toggle product status. Please try again.'
    } finally {
        loading.value = false
    }
}

// Multiple images handling
const handleImagesUpload = (event) => {
    const files = Array.from(event.target.files)
    if (!files.length) return

    selectedImages.value = []

    files.forEach(file => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert(`${file.name} is not a valid image file`)
            return
        }

        // Validate file size (e.g., max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert(`${file.name} is too large. Maximum file size is 5MB`)
            return
        }

        // Create preview
        const reader = new FileReader()
        reader.onload = (e) => {
            selectedImages.value.push({
                file: file,
                preview: e.target.result,
                name: file.name
            })
        }
        reader.readAsDataURL(file)
    })
}

const removeSelectedImage = (index) => {
    selectedImages.value.splice(index, 1)
}

const removeExistingImage = (image) => {
    imagesToDelete.value.push(image)
    existingImages.value = existingImages.value.filter(img => img.imgId !== image.imgId)
}

const uploadImages = async () => {
    const uploadedUrls = []

    for (const imageData of selectedImages.value) {
        try {
            const formData = new FormData()
            formData.append('image', imageData.file)

            const response = await axios.post('/api/shoeImg/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            if (response.data && (response.data.ok || response.data.code === 200 || response.data.success)) {
                const imageName = response.data.data
                uploadedUrls.push(imageName)
            } else {
                throw new Error(response.data?.msg || response.data?.message || '图片上传失败')
            }
        } catch (uploadError) {
            if (uploadError.response?.status === 413) {
                throw new Error(`图片文件 ${imageData.file.name} 过大，请选择更小的图片文件`)
            } else if (uploadError.response?.status === 415) {
                throw new Error(`不支持的文件类型 ${imageData.file.name}，请选择有效的图片文件`)
            } else {
                throw new Error(`图片上传失败 ${imageData.file.name}: ${uploadError.message}`)
            }
        }
    }

    return uploadedUrls
}

// Image carousel and gallery functionality
const cycleProductImage = async (product) => {
    if (product.images && product.images.length > 1) {
        const currentIndex = product.currentImageIndex || 0
        const nextIndex = (currentIndex + 1) % product.images.length
        // 使用Vue的响应式方式更新
        product.currentImageIndex = nextIndex

        // 强制Vue更新DOM
        await nextTick()
    }
}

// 从图片画廊设置默认图片
const setDefaultImageFromGallery = async () => {
    if (!galleryProduct.value || !galleryProduct.value.images || galleryCurrentIndex.value <= 0) {
        return
    }

    const selectedImageIndex = galleryCurrentIndex.value

    try {
        // 重新排序图片数组，将用户选择的图片移到第一位作为默认图片
        const selectedImage = galleryProduct.value.images[selectedImageIndex]
        const otherImages = galleryProduct.value.images.filter((_, index) => index !== selectedImageIndex)
        const newImageOrder = [selectedImage, ...otherImages]

        // 更新画廊产品的图片数组
        galleryProduct.value.images = newImageOrder
        galleryProduct.value.currentImageIndex = 0
        galleryProduct.value.defaultImageIndex = 0

        // 重置画廊索引为0（现在选择的图片在第一位）
        galleryCurrentIndex.value = 0

        // 同时更新产品列表中的对应产品
        const productInList = products.value.find(p => p.shoeId === galleryProduct.value.shoeId)
        if (productInList) {
            productInList.images = [...newImageOrder]
            productInList.currentImageIndex = 0
            productInList.defaultImageIndex = 0
        }

        alert('Default image updated successfully!')

        // 强制Vue更新DOM
        await nextTick()
    } catch (error) {
        alert(`设置默认图片失败: ${error.message}`)
    }
}

const showImageGallery = (product) => {
    if (product.images && product.images.length > 0) {
        galleryProduct.value = product
        galleryCurrentIndex.value = product.currentImageIndex || 0
        showImageGalleryModal.value = true
    }
}

const closeImageGallery = () => {
    showImageGalleryModal.value = false
    galleryProduct.value = null
    galleryCurrentIndex.value = 0
}

const previousGalleryImage = () => {
    if (galleryProduct.value && galleryProduct.value.images.length > 1) {
        galleryCurrentIndex.value = (galleryCurrentIndex.value - 1 + galleryProduct.value.images.length) % galleryProduct.value.images.length
    }
}

const nextGalleryImage = () => {
    if (galleryProduct.value && galleryProduct.value.images.length > 1) {
        galleryCurrentIndex.value = (galleryCurrentIndex.value + 1) % galleryProduct.value.images.length
    }
}

// Show add dialog
const showAddDialog = () => {
    isEditMode.value = false
    showDialog.value = true
    resetForm()
}

// Show edit dialog
const showEditDialog = async (product) => {
    isEditMode.value = true
    originalProduct.value = { ...product }
    newProduct.value = {
        shoeId: product.shoeId,
        name: product.name,
        serialNumber: product.serialNumber,
        brandId: product.brand?.brandId || '',
        typeId: product.shoesType?.typeId || '',
        colorId: product.color?.colorId || '',
        price: product.price,
        discountPrice: product.discountPrice || '',
        launchDate: product.launchDate || '',
        origin: product.origin || '',
        description: product.description || '',
        salesVolume: product.salesVolume || 0,
        points: product.points || 0,
        shoeDisabled: product.shoeDisabled
    }

    // Load existing images
    try {
        const response = await axios.get(`/api/shoeImg/list/${product.shoeId}`)
        if (response.data && response.data.data) {
            existingImages.value = [...response.data.data]
        } else {
            existingImages.value = []
        }
    } catch (error) {
        existingImages.value = []
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
    originalProduct.value = {}
    newProduct.value = {
        shoeId: null,
        name: '',
        serialNumber: '',
        brandId: '',
        typeId: '',
        colorId: '',
        price: '',
        discountPrice: '',
        launchDate: '',
        origin: '',
        description: '',
        salesVolume: 0,
        points: 0,
        shoeDisabled: false
    }
    selectedImages.value = []
    existingImages.value = []
    imagesToDelete.value = []
    error.value = ''

    // Clear file input
    const fileInput = document.getElementById('productImages')
    if (fileInput) {
        fileInput.value = ''
    }
}

// Add new product
const addProduct = async () => {
    if (!newProduct.value.name.trim() || !newProduct.value.serialNumber.trim()) {
        error.value = 'Please enter product name and serial number'
        return
    }

    loading.value = true
    uploading.value = true
    error.value = ''

    try {
        // Upload images if selected
        let imageUrls = []
        if (selectedImages.value.length > 0) {
            imageUrls = await uploadImages()
        }

        const params = new URLSearchParams();
        params.append('typeId', newProduct.value.typeId);
        params.append('brandId', newProduct.value.brandId);
        params.append('colorId', newProduct.value.colorId);
        params.append('serialNumber', newProduct.value.serialNumber.trim());
        params.append('name', newProduct.value.name.trim());
        params.append('price', newProduct.value.price);
        if (newProduct.value.discountPrice) params.append('discountPrice', newProduct.value.discountPrice);
        if (newProduct.value.launchDate) params.append('launchDate', newProduct.value.launchDate);
        if (newProduct.value.origin) params.append('origin', newProduct.value.origin.trim());
        if (newProduct.value.description) params.append('description', newProduct.value.description.trim());
        params.append('salesVolume', newProduct.value.salesVolume || 0);
        params.append('points', newProduct.value.points || 0);

        // Add image URLs as array parameter
        imageUrls.forEach(url => {
            params.append('imageUrls', url);
        });

        const response = await axios.post('/api/shoe/insertShoe', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (response.data && (response.data.ok === true || response.data.code === 200 || response.data.success)) {
            closeDialog()
            await fetchProducts()
        } else {
            throw new Error(response.data?.msg || response.data?.message || 'Add product failed')
        }
    } catch (error) {
        console.error('Error adding product:', error)
        error.value = error.message || 'Failed to add product. Please try again.'
    } finally {
        loading.value = false
        uploading.value = false
    }
}

// Update existing product
const updateProduct = async () => {
    if (!newProduct.value.name.trim() || !newProduct.value.serialNumber.trim()) {
        error.value = 'Please enter product name and serial number'
        return
    }

    loading.value = true
    uploading.value = true
    error.value = ''

    try {
        // First, delete images marked for deletion
        if (imagesToDelete.value.length > 0) {
            for (const image of imagesToDelete.value) {
                try {
                    await axios.post(`/api/shoeImg/delete/${image.imgId}`)
                } catch (deleteError) {
                    // Continue with update even if deletion fails
                }
            }
        }

        // Upload new images if any
        let newImageUrls = []
        if (selectedImages.value.length > 0) {
            newImageUrls = await uploadImages()
        }

        // Combine existing images with new images
        const allImageUrls = [
            ...existingImages.value.map(img => img.imagePath),
            ...newImageUrls
        ]

        const params = new URLSearchParams();
        params.append('shoeId', newProduct.value.shoeId);
        params.append('typeId', newProduct.value.typeId);
        params.append('brandId', newProduct.value.brandId);
        params.append('colorId', newProduct.value.colorId);
        params.append('serialNumber', newProduct.value.serialNumber.trim());
        params.append('name', newProduct.value.name.trim());
        params.append('price', newProduct.value.price);
        if (newProduct.value.discountPrice) params.append('discountPrice', newProduct.value.discountPrice);
        if (newProduct.value.launchDate) params.append('launchDate', newProduct.value.launchDate);
        if (newProduct.value.origin) params.append('origin', newProduct.value.origin.trim());
        if (newProduct.value.description) params.append('description', newProduct.value.description.trim());
        params.append('salesVolume', newProduct.value.salesVolume || 0);
        params.append('points', newProduct.value.points || 0);
        params.append('shoeDisabled', newProduct.value.shoeDisabled);

        // Add all image URLs (existing + new)
        allImageUrls.forEach(url => {
            params.append('imageUrls', url);
        });

        const response = await axios.post('/api/shoe/updateShoe', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (response.data && (response.data.ok === true || response.data.code === 200 || response.data.success)) {
            closeDialog()
            await fetchProducts()
        } else {
            throw new Error(response.data?.msg || response.data?.message || 'Update product failed')
        }
    } catch (error) {
        console.error('Error updating product:', error)
        error.value = error.message || 'Failed to update product. Please try again.'
    } finally {
        loading.value = false
        uploading.value = false
    }
}

// Inventory management
const showInventoryDialog = async (product) => {
    currentProduct.value = product
    showInventoryModal.value = true
    await fetchInventory(product.shoeId)
}

const closeInventoryDialog = () => {
    showInventoryModal.value = false
    currentProduct.value = null
    inventoryData.value = []
}

const fetchInventory = async (shoeId) => {
    inventoryLoading.value = true
    try {
        // Get existing inventory for the shoe
        const response = await axios.get(`/api/inventory/getInventoryByShoeId/${shoeId}`)

        let existingInventories = []
        if (response.data && response.data.data && response.data.data.sizeInventories) {
            existingInventories = response.data.data.sizeInventories
        }

        // Create a comprehensive list including all available sizes
        const allSizes = sizes.value
        const inventoryMap = new Map()

        // First, add existing inventories
        existingInventories.forEach(item => {
            inventoryMap.set(item.sizeId, {
                sizeId: item.sizeId,
                size: item.size || item.sizeName, // 使用item.size优先，如果没有则使用item.sizeName
                stock: item.inventoryNumber,
                newStock: item.inventoryNumber,
                hasInventory: true
            })
        })

        // Then add missing sizes (sizes that don't have inventory records yet)
        allSizes.forEach(size => {
            if (!inventoryMap.has(size.sizeId)) {
                inventoryMap.set(size.sizeId, {
                    sizeId: size.sizeId,
                    size: size.size,
                    stock: 0,
                    newStock: 0,
                    hasInventory: false
                })
            }
        })

        // Sort by size value
        inventoryData.value = Array.from(inventoryMap.values()).sort((a, b) =>
            parseFloat(a.size) - parseFloat(b.size)
        )

    } catch (error) {
        console.error('Error fetching inventory:', error)
        inventoryData.value = []
    } finally {
        inventoryLoading.value = false
    }
}

const adjustInventory = (sizeInfo, delta) => {
    sizeInfo.newStock = Math.max(0, sizeInfo.newStock + delta)
    updateInventory(sizeInfo)
}

const updateInventory = async (sizeInfo) => {
    if (sizeInfo.newStock === sizeInfo.stock) return

    try {
        const params = new URLSearchParams();
        params.append('shoeId', currentProduct.value.shoeId);
        params.append('sizeId', sizeInfo.sizeId);
        params.append('inventoryNumber', sizeInfo.newStock);

        const response = await axios.post('/api/inventory/updateInventoryNumber', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (response.data && (response.data.success || response.data.ok || response.data.code === 200)) {
            sizeInfo.stock = sizeInfo.newStock
            sizeInfo.hasInventory = true
        } else {
            sizeInfo.newStock = sizeInfo.stock
            throw new Error('Failed to update inventory')
        }
    } catch (error) {
        console.error('Error updating inventory:', error)
        sizeInfo.newStock = sizeInfo.stock
    }
}

// Add new inventory record for a size that doesn't have one yet
const addNewInventory = async (sizeInfo) => {
    if (sizeInfo.hasInventory) return

    try {
        const params = new URLSearchParams();
        params.append('shoeId', currentProduct.value.shoeId);
        params.append('sizeId', sizeInfo.sizeId);
        params.append('inventoryNumber', 0); // Start with 0 inventory

        const response = await axios.post('/api/inventory/addNewInventory', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (response.data && (response.data.success || response.data.ok || response.data.code === 200)) {
            sizeInfo.hasInventory = true
            sizeInfo.stock = 0
            sizeInfo.newStock = 0
        } else {
            throw new Error(response.data?.message || response.data?.msg || 'Failed to add new inventory record')
        }
    } catch (error) {
        alert(`Failed to add inventory record: ${error.message}`)
    }
}

// Pagination methods
const goToPage = (page) => {
    if (page >= 1 && page <= totalPages.value && page !== currentPage.value) {
        currentPage.value = page
        selectedProducts.value = []
        fetchProducts()
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
    selectedProducts.value = []
    fetchProducts()
}

// Keep the input in sync with the actual page size
watch(pageSize, (newValue) => {
    pageSizeInput.value = newValue
})

// Lifecycle hook
onMounted(() => {
    fetchProducts()
    fetchOptions()
})
</script>

<style scoped>
.product-container {
    max-width: 1600px;
    width: 98%;
    margin: 20px auto;
    padding: 24px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    font-family: 'Playfair Display', 'Georgia', serif;
}

.product-header {
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

.product-count {
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
    overflow-x: auto;
}

.product-table {
    width: 100%;
    min-width: 1400px;
    border-collapse: collapse;
    font-family: 'Lora', 'Georgia', serif;
}

.product-table thead tr {
    background: linear-gradient(135deg, rgb(211, 169, 101), #d4af37);
    color: white;
}

.product-table th,
.product-table td {
    text-align: center;
    padding: 12px 8px;
    border-bottom: 1px solid #f0f0f0;
    vertical-align: middle;
}

.product-table th {
    font-weight: 600;
    font-size: 0.9rem;
    letter-spacing: 0.5px;
    color: white !important;
}

.product-row {
    transition: all 0.2s ease;
}

.product-row:hover {
    background: rgba(211, 169, 101, 0.05);
    transform: translateY(-1px);
}

.even-row {
    background: rgba(243, 242, 234, 0.3);
}

.checkbox-col {
    width: 40px;
}

.index-col {
    width: 50px;
}

.image-col {
    width: 80px;
}

.name-col {
    width: 200px;
}

.brand-col {
    width: 100px;
}

.type-col {
    width: 100px;
}

.color-col {
    width: 80px;
}

.price-col {
    width: 100px;
}

.discount-col {
    width: 100px;
}

.sales-col {
    width: 80px;
}

.status-col {
    width: 120px;
}

.inventory-col {
    width: 80px;
}

.action-col {
    width: 120px;
}

.product-images {
    width: 60px;
    height: 60px;
    margin: 0 auto;
    position: relative;
}

.image-carousel {
    position: relative;
    width: 100%;
    height: 100%;
}

.main-product-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 8px;
    border: 2px solid #f0f0f0;
    cursor: pointer;
    transition: all 0.3s ease;
}

.main-product-image:hover {
    border-color: rgb(211, 169, 101);
    transform: scale(1.05);
}

.image-selector {
    position: absolute;
    bottom: -2px;
    right: -2px;
    display: flex;
    gap: 2px;
}

.image-switch-btn {
    background: rgba(211, 169, 101, 0.9);
    color: white;
    border: none;
    border-radius: 4px;
    padding: 2px 6px;
    font-size: 0.7rem;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 500;
    min-width: 35px;
    text-align: center;
}

.image-switch-btn:hover {
    background: rgb(211, 169, 101);
    transform: scale(1.05);
}

.no-image {
    width: 60px;
    height: 60px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f8f9fa;
    border: 2px dashed #ddd;
    border-radius: 8px;
    font-size: 1.5rem;
    color: #999;
}

.product-image {
    width: 60px;
    height: 60px;
    border-radius: 8px;
    overflow: hidden;
    margin: 0 auto;
    border: 2px solid #f0f0f0;
}

.product-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.product-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
}

.product-name {
    font-weight: 600;
    color: #333;
    font-size: 0.9rem;
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.serial-number {
    color: #666;
    font-size: 0.8rem;
}

.brand-name,
.type-name,
.color-name {
    font-size: 0.85rem;
    color: #555;
}

.price-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.original-price {
    font-weight: 600;
    color: #333;
}

.discount-price {
    font-weight: 600;
    color: #e74c3c;
}

.no-discount {
    color: #999;
}

.sales-volume {
    font-weight: 500;
    color: #2c3e50;
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
    display: block;
    font-size: 0.8rem;
    margin-top: 4px;
    font-weight: 600;
    color: #28a745;
}

.status-text.disabled-text {
    color: #dc3545;
}

.inventory-btn,
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

.inventory-btn {
    background: linear-gradient(135deg, #6c757d, #5a6268);
    color: white;
}

.edit-btn {
    background: linear-gradient(135deg, #28a745, #20c997);
    color: white;
}

.delete-btn {
    background: linear-gradient(135deg, #dc3545, #c82333);
    color: white;
}

.inventory-btn:hover,
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
    max-width: 800px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.inventory-dialog {
    max-width: 600px;
}

.image-gallery-dialog {
    max-width: 800px;
    max-height: 90vh;
}

.gallery-main-image {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #f8f9fa;
    border-radius: 8px;
    margin-bottom: 20px;
    min-height: 400px;
}

.main-gallery-image {
    max-width: 100%;
    max-height: 400px;
    object-fit: contain;
    border-radius: 8px;
}

.gallery-controls {
    position: absolute;
    top: 50%;
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transform: translateY(-50%);
    pointer-events: none;
}

.gallery-confirm-btn {
    position: absolute;
    bottom: 15px;
    right: 15px;
    background: rgba(40, 167, 69, 0.9);
    color: white;
    border: none;
    border-radius: 20px;
    padding: 10px 20px;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    pointer-events: all;
    display: flex;
    align-items: center;
    gap: 4px;
    font-family: 'Playfair Display', serif;
    box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
    z-index: 10;
}

.gallery-confirm-btn:hover {
    background: rgba(40, 167, 69, 1);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
}

.gallery-nav-btn {
    background: rgba(0, 0, 0, 0.5);
    color: white;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    font-size: 1.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
    pointer-events: all;
    display: flex;
    align-items: center;
    justify-content: center;
}

.gallery-nav-btn:hover {
    background: rgba(0, 0, 0, 0.7);
    transform: scale(1.1);
}

.gallery-nav-btn.prev {
    margin-left: 10px;
}

.gallery-nav-btn.next {
    margin-right: 10px;
}

.gallery-thumbnails {
    display: flex;
    gap: 10px;
    justify-content: center;
    flex-wrap: wrap;
}

.gallery-thumbnail {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: 6px;
    border: 2px solid #ddd;
    cursor: pointer;
    transition: all 0.3s ease;
}

.gallery-thumbnail:hover {
    border-color: rgb(211, 169, 101);
}

.gallery-thumbnail.active {
    border-color: rgb(211, 169, 101);
    border-width: 3px;
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

.form-row {
    display: flex;
    gap: 16px;
    margin-bottom: 20px;
}

.form-group {
    flex: 1;
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
    position: relative;
    margin-top: 10px;
    display: inline-block;
}

.image-preview img {
    max-width: 200px;
    max-height: 200px;
    border-radius: 8px;
    border: 2px solid #ddd;
}

/* Multiple images upload styles */
.image-upload-area {
    margin-top: 8px;
}

.upload-help {
    font-size: 0.8rem;
    color: #666;
    margin-top: 4px;
    font-style: italic;
}

.images-preview,
.existing-images {
    margin-top: 16px;
}

.images-preview h4,
.existing-images h4 {
    color: rgb(211, 169, 101);
    margin-bottom: 12px;
    font-size: 1rem;
}

.preview-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
}

.image-preview-item {
    position: relative;
    width: 100px;
    height: 100px;
    border-radius: 8px;
    overflow: visible;
    /* 改为 visible 让删除按钮完全显示 */
    border: 2px solid #ddd;
    background: #f8f9fa;
    display: flex;
    flex-direction: column;
    margin: 8px;
    /* 添加边距，为删除按钮留空间 */
}

.image-preview-item.existing {
    border-color: rgb(211, 169, 101);
    opacity: 0.9;
}

.image-preview-item img {
    width: 100%;
    height: 80px;
    object-fit: cover;
    border-radius: 6px 6px 0 0;
    /* 只对上角圆角，避免被删除按钮遮挡 */
}

.image-name {
    font-size: 0.7rem;
    color: #666;
    padding: 2px 4px;
    text-align: center;
    background: rgba(255, 255, 255, 0.9);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    height: 20px;
    line-height: 16px;
}

.remove-image-btn {
    position: absolute;
    top: -5px;
    right: -5px;
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 50%;
    width: 18px;
    height: 18px;
    cursor: pointer;
    font-size: 0.6rem;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    transition: all 0.3s ease;
}

.remove-image-btn:hover {
    background: #c82333;
    transform: scale(1.1);
}

.clear-image-btn {
    position: absolute;
    top: -10px;
    right: -10px;
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    cursor: pointer;
    font-size: 0.8rem;
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

/* Inventory Management Styles */
.inventory-summary h4 {
    color: rgb(211, 169, 101);
    margin-bottom: 16px;
}

.size-inventory-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.size-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #dee2e6;
    transition: all 0.3s ease;
}

.size-item:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.size-item.no-inventory {
    background: #fff3cd;
    border-color: #ffeaa7;
}

.size-item.no-inventory:hover {
    background: #ffeaa7;
}

.size-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.size-name {
    font-weight: 600;
    color: #333;
}

.size-stock {
    color: #666;
    font-size: 0.9rem;
}

.size-stock.no-stock {
    color: #856404;
    font-style: italic;
}

.inventory-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.adjust-btn {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1.2rem;
    font-weight: bold;
    transition: all 0.3s ease;
}

.decrease-btn {
    background: #dc3545;
    color: white;
}

.increase-btn {
    background: #28a745;
    color: white;
}

.adjust-btn:hover:not(:disabled) {
    transform: scale(1.1);
}

.adjust-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
}

.add-inventory-btn {
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1.5rem;
    font-weight: bold;
    transition: all 0.3s ease;
    background: linear-gradient(135deg, #28a745, #20c997);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
}

.add-inventory-btn:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
}

.stock-input {
    width: 80px;
    padding: 6px 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    text-align: center;
    font-size: 0.9rem;
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
@media (max-width: 1400px) {
    .product-container {
        width: 99%;
        padding: 16px;
    }
}

@media (max-width: 768px) {
    .product-header {
        flex-direction: column;
        gap: 12px;
        text-align: center;
    }

    .title {
        font-size: 1.5rem;
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

    .form-row {
        flex-direction: column;
    }
}

@media (max-width: 480px) {
    .product-container {
        margin: 10px;
        padding: 12px;
    }

    .title {
        font-size: 1.3rem;
    }
}
</style>
