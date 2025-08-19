<template>
    <div v-if="isVisible" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content">
            <button class="close-button" @click="closeModal">✖</button>
            <h3 class="modal-title" :style="{ color: themeColor }">Order Details</h3>
            <div v-if="loading" class="loading">Loading order details...</div>
            <div v-else-if="error" class="error">{{ error }}</div>
            <div v-else-if="orderDetail">
                <div class="detail-item">
                    <span class="label">Order ID:</span>
                    <span class="value">{{ orderDetail.orderId }}</span>
                </div>
                <div class="detail-item">
                    <span class="label">User ID:</span>
                    <span class="value">{{ orderDetail.userId }}</span>
                </div>
                <div class="detail-item">
                    <span class="label">Address ID:</span>
                    <span class="value">{{ orderDetail.addressId }}</span>
                </div>
                <div class="detail-item">
                    <span class="label">Status:</span>
                    <span class="value status-badge" :style="{
                        color: themeColor,
                        backgroundColor: `${themeColor}26`, // 15% opacity
                        borderColor: `${themeColor}4d`    // 30% opacity
                    }">{{ statusText(orderDetail.status) }}</span>
                </div>
                <div class="detail-item">
                    <span class="label">Order Number:</span>
                    <span class="value">{{ orderDetail.orderNumber || 'N/A' }}</span>
                </div>
                <div class="detail-item">
                    <span class="label">Created At:</span>
                    <span class="value">{{ formatDateTime(orderDetail.createdAt) }}</span>
                </div>
                <div class="detail-item">
                    <span class="label">Updated At:</span>
                    <span class="value">{{ formatDateTime(orderDetail.updatedAt) }}</span>
                </div>
                <div class="detail-item">
                    <span class="label">Shipping Fee:</span>
                    <span class="value">¥{{ orderDetail.shippingFee.toFixed(2) }}</span>
                </div>
                <div class="detail-item">
                    <span class="label">Delivery Time:</span>
                    <span class="value">{{ formatDateTime(orderDetail.deliveryTime) }}</span>
                </div>
                <div class="detail-item">
                    <span class="label">Size ID:</span>
                    <span class="value">{{ orderDetail.sizeId || 'N/A' }}</span>
                </div>
                <div class="detail-item">
                    <span class="label">Order Shoe Num:</span>
                    <span class="value">{{ orderDetail.orderShoeNum }}</span>
                </div>
            </div>
            <div v-else class="no-data">No order details available.</div>
        </div>
    </div>
</template>

<script setup>
/* eslint-disable */
import { ref, watch } from 'vue';
import axios from 'axios';

const props = defineProps({
    orderId: {
        type: Number,
        default: null
    },
    isVisible: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['close']);

const orderDetail = ref(null);
const loading = ref(false);
const error = ref('');

const fetchOrderDetail = async (id) => {
    if (!id) {
        orderDetail.value = null;
        return;
    }

    //转换id为数字
    const numericId = Number(String(id).replace('ORD', ''));
    console.log('Original orderId:', id);
    console.log('Converted numericId:', numericId);

    loading.value = true;
    error.value = '';
    try {
        const params = new URLSearchParams();
        params.append('orderId', numericId);

        const response = await axios.post('/api/order/getById', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (response.data && response.data.code === 200) {
            console.log('API Response:', response.data);
            orderDetail.value = response.data.data;
        } else {
            throw new Error(response.data?.msg || 'Failed to fetch order details.');
        }

        // 获取订单鞋号信息
        const response2 = await axios.post('/api/orderShoeNum/getTotalNumByOrderId', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        if (response2.data && response2.data.code === 200) {
            // 正确访问ref对象并赋值
            if (orderDetail.value) {
                orderDetail.value.orderShoeNum = response2.data.data;
            }
        } else {
            throw new Error(response2.data?.msg || 'Failed to fetch order shoe number.');
        }


    } catch (err) {
        console.error('API Error:', err);
        error.value = err.message || 'Network request failed. Please try again.';
    } finally {
        loading.value = false;
    }
};

const closeModal = () => {
    emit('close');
    orderDetail.value = null; // Clear details when closing
};

const statusText = (status) => {
    const map = {
        1: 'Pending Shipment',
        2: 'Shipping',
        3: 'Successful',
        4: 'Return Applied',
        5: 'Returned',
        6: 'Cancelled'
    };
    return map[Number(status)] || 'Unknown';
};

// Get theme color based on order status
const getThemeColor = (status) => {
    const colorMap = {
        1: '#d3a965', // Pending Shipment - Gold
        2: '#17a2b8', // Shipping - Blue
        3: '#28a745', // Successful - Green
        4: '#e67e22', // Return Applied - Orange
        5: '#ff9800', // Returned - Amber
        6: '#c0392b'  // Cancelled - Red
    };
    return colorMap[Number(status)] || '#666'; // Default to gray
};

// Computed property for current theme color
const themeColor = ref('#666'); // Default color

// Update theme color when order status changes
watch(() => orderDetail.value?.status, (newStatus) => {
    if (newStatus) {
        themeColor.value = getThemeColor(newStatus);
    }
});

const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    // Handle both timestamp numbers and date strings
    const date = new Date(timestamp);
    // Check if date is valid
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString(); // Adjust format as needed
};

watch(() => props.orderId, (newOrderId) => {
    if (props.isVisible && newOrderId) {
        fetchOrderDetail(newOrderId);
    }
}, { immediate: true });

watch(() => props.isVisible, (newVal) => {
    if (newVal && props.orderId) {
        fetchOrderDetail(props.orderId);
    } else if (!newVal) {
        orderDetail.value = null; // Clear details when modal is hidden
    }
});
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(5px);
}

.modal-content {
    background: #fff;
    padding: 30px;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    width: 90%;
    max-width: 600px;
    position: relative;
    animation: fadeIn 0.3s ease-out;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    color: #333;
}

.close-button {
    position: absolute;
    top: 15px;
    right: 15px;
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #888;
    transition: color 0.2s ease;
}

.close-button:hover {
    color: #333;
}

.modal-title {
    font-size: 2rem;
    color: #c0392b;
    margin-bottom: 25px;
    text-align: center;
    border-bottom: 2px solid #eee;
    padding-bottom: 15px;
}

.detail-item {
    display: flex;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px dashed #f0f0f0;
}

.detail-item:last-child {
    border-bottom: none;
}

.label {
    font-weight: 600;
    color: #555;
    flex-basis: 40%;
    text-align: left;
}

.value {
    flex-basis: 60%;
    text-align: right;
    color: #333;
}

.status-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 15px;
    font-weight: 600;
    font-size: 0.85rem;
    border: 1px solid;
    max-width: 150px;
    text-align: center;
}

.loading,
.error,
.no-data {
    text-align: center;
    padding: 20px;
    font-size: 1.1rem;
    color: #888;
}

.error {
    color: #dc3545;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>