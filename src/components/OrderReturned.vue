<template>
    <BaseToast ref="toast" :message="toastMessage" :type="toastType" />
    <div class="order-container">
        <div class="order-header">
            <h2 class="title">
                <span class="icon">🔙</span>
                Returned Orders
            </h2>
            <div class="order-count">Total: {{ filteredOrders.length }} orders</div>
        </div>

        <div v-if="loading" class="loading">Loading orders...</div>
        <div v-else-if="error" class="error">{{ error }}</div>
        <div v-else>
            <div class="table-container">
                <table class="order-table">
                    <thead>
                        <tr>
                            <th class="index-col">No.</th>
                            <th class="id-col">Order ID</th>
                            <th class="id-col">Order Number</th>
                            <th class="id-col">User ID</th>
                            <th class="id-col">Address ID</th>
                            <th class="status-col">Status</th>
                            <th class="action-col">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="pagedOrders.length === 0">
                            <td colspan="7" class="empty-row">No returned orders found.</td>
                        </tr>
                        <tr v-for="(order, index) in pagedOrders" :key="order.orderId" class="order-row"
                            :class="{ 'even-row': index % 2 === 1 }">
                            <td class="index-col">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                            <td class="id-col">{{ order.orderId }}</td>
                            <td class="id-col">{{ order.orderNumber || order.orderId }}</td>
                            <td class="id-col">{{ order.userId }}</td>
                            <td class="id-col">{{ order.addressId }}</td>
                            <td class="status-col">
                                <span class="status-badge">{{ statusText(order.status) }}</span>
                            </td>
                            <td class="action-col">
                                <button class="eye-icon-btn" title="View Details"
                                    @click="viewOrderDetails(order.orderId)">👁️</button>
                                <button class="delete-btn" title="Delete Order"
                                    @click="deleteOrder(order.orderId)">❌</button>
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
        </div>
    </div>

    <OrderDetailModal :isVisible="showDetailModal" :orderId="selectedOrderId" @close="closeDetailModal" />
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import axios from 'axios'
import BaseToast from './BaseToast.vue'
import OrderDetailModal from './OrderDetailModal.vue'

// Toast related
const toast = ref(null)
const toastMessage = ref('')
const toastType = ref('error') // Default type

// Reactive data
const allOrders = ref([])
const loading = ref(true)
const error = ref('')

// Modal related
const showDetailModal = ref(false)
const selectedOrderId = ref(null)

// Pagination data
const currentPage = ref(1)
const pageSize = ref(5)
const pageSizeInput = ref(pageSize.value)

// Computed property to filter orders with status 5 (Returned)
const filteredOrders = computed(() => {
    return allOrders.value.filter(order => Number(order.status) === 5)
})

// Pagination computed properties
const totalPages = computed(() => {
    const total = filteredOrders.value.length
    return total > 0 ? Math.ceil(total / pageSize.value) : 1
})

const pagedOrders = computed(() => {
    const startIndex = (currentPage.value - 1) * pageSize.value
    return filteredOrders.value.slice(startIndex, startIndex + pageSize.value)
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

// Methods
const statusText = (status) => {
    const map = {
        1: 'Pending Shipment',
        2: 'Shipping',
        3: 'Successful',
        4: 'Return Applied',
        5: 'Returned',
        6: 'Cancelled'
    }
    return map[Number(status)] || 'Unknown'
}

const fetchOrders = async () => {
    loading.value = true
    error.value = ''
    try {
        const response = await axios.post('/api/order/getAll', {}, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
        if (response.data && response.data.code === 200) {
            allOrders.value = response.data.data || []
        } else {
            throw new Error(response.data?.msg || 'Failed to fetch orders.')
        }
    } catch (err) {
        console.error('API Error:', err)
        error.value = err.message || 'Network request failed. Please try again.'
    } finally {
        loading.value = false
    }
}

const viewOrderDetails = (orderId) => {
    selectedOrderId.value = orderId
    showDetailModal.value = true
}

const closeDetailModal = () => {
    showDetailModal.value = false
    selectedOrderId.value = null
}

// Pagination methods
const goToPage = (page) => {
    if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page
    }
}

const handlePageSizeChange = () => {
    const newSize = Number(pageSizeInput.value)

    if (isNaN(newSize) || newSize > 5) {
        toastMessage.value = 'Cannot be greater than 5'
        toastType.value = 'error';
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
}

// Keep the input in sync with the actual page size
watch(pageSize, (newValue) => {
    pageSizeInput.value = newValue
})

const deleteOrder = async (orderId) => {
    try {
        const params = new URLSearchParams();
        params.append('orderId', orderId);

        // 调用后端 API 删除订单
        const response = await axios.post('/api/order/deleteOrderAndShoeNum', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (response.data && response.data.code === 200) {
            toastMessage.value = 'Order deleted successfully';
            toastType.value = 'success';
            toast.value.show();
            fetchOrders(); // 刷新订单列表
        } else {
            throw new Error(response.data?.msg || 'Failed to delete order');
        }
    } catch (err) {
        console.error('API Error:', err);
        toastMessage.value = err.message || 'Failed to delete order, please try again.';
        toastType.value = 'error'; // 确保错误类型
        toast.value.show();
    }
};

// Lifecycle hook
onMounted(() => {
    fetchOrders()
})
</script>

<style scoped>
.order-container {
    max-width: 1400px;
    width: 95%;
    margin: 20px auto;
    padding: 24px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    font-family: 'Playfair Display', 'Georgia', serif;
}

.order-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 2px solid #8e44ad;
}

.title {
    font-size: 2rem;
    font-weight: 600;
    color: #8e44ad;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 12px;
}

.icon {
    font-size: 2.2rem;
}

.order-count {
    font-size: 1.1rem;
    color: #666;
    font-weight: 500;
    background: rgba(142, 68, 173, 0.1);
    padding: 8px 16px;
    border-radius: 20px;
}

.table-container {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}

.order-table th,
.order-table td {
    font-weight: bold;
}

.order-table {
    width: 100%;
    border-collapse: collapse;
    font-family: 'Lora', 'Georgia', serif;
}

.order-table thead tr {
    background: linear-gradient(135deg, #8e44ad, #9b59b6);
    color: white;
}

.order-table th,
.order-table td {
    padding: 16px 12px;
    text-align: center;
    vertical-align: middle;
}

.order-table th {
    font-weight: 600;
    font-size: 1rem;
    letter-spacing: 0.5px;
}

.order-table td {
    border-bottom: 1px solid #f0f0f0;
}

.order-row:hover {
    background: rgba(142, 68, 173, 0.05);
}

.even-row {
    background: rgba(243, 242, 234, 0.3);
}

.index-col {
    width: 80px;
    font-weight: 600;
    color: #8e44ad;
}

.id-col {
    width: 250px;
    font-family: 'Courier New', Courier, monospace;
}

.status-col {
    width: 180px;
}

.status-badge {
    display: inline-block;
    padding: 6px 16px;
    border-radius: 18px;
    font-weight: 600;
    font-size: 0.9rem;
    background: rgba(142, 68, 173, 0.15);
    color: #8e44ad;
    border: 1px solid rgba(142, 68, 173, 0.3);
}

.action-col {
    width: 100px;
}

.delete-col {
    width: 80px;
}

.delete-btn {
    background: none;
    border: none;
    color: #e74c3c;
    font-size: 1.2rem;
    cursor: pointer;
    transition: transform 0.3s ease;
    padding: 4px;
}

.delete-btn:hover {
    transform: scale(1.2);
    color: #c0392b;
}

.action-btn {
    border: none;
    padding: 4px 8px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.75rem;
    margin: 0 2px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.2px;
    white-space: nowrap;
    min-width: 60px;
}

.eye-icon-btn {
    color: white;
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    font-size: 1rem;
    transition: transform 0.3s ease;
}

.eye-icon-btn:hover {
    transform: scale(1.1);
    box-shadow: none;
}

.view-btn {
    color: #17a2b8;
}

.action-btn:hover {
    transform: scale(1.2);
}

.empty-row {
    text-align: center;
    padding: 40px;
    color: #888;
    font-size: 1.1rem;
    font-style: italic;
}

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
    border-color: #8e44ad;
}

.pagination-controls {
    display: flex;
    align-items: center;
    gap: 8px;
}

.page-btn {
    background: white;
    color: #8e44ad;
    border: 1px solid #8e44ad;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.9rem;
    font-weight: 500;
}

.page-btn:hover:not(:disabled) {
    background: #8e44ad;
    color: white;
}

.page-btn:disabled {
    background: #f5f5f5;
    color: #ccc;
    border-color: #ddd;
    cursor: not-allowed;
}

.page-numbers {
    display: flex;
    gap: 4px;
}

.page-number-btn {
    background: white;
    color: #8e44ad;
    border: 1px solid #8e44ad;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.9rem;
    min-width: 40px;
}

.page-number-btn:hover {
    background: rgba(142, 68, 173, 0.1);
}

.page-number-btn.active {
    background: #8e44ad;
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
    color: #8e44ad;
}

.error {
    color: #dc3545;
    background: rgba(220, 53, 69, 0.1);
    border-radius: 8px;
    margin-top: 16px;
}
</style>
