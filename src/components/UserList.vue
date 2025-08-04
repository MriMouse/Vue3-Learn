<template>
    <div class="user-container">
        <div class="user-header">
            <h2 class="title">
                <span class="icon">👥</span>
                User Management
            </h2>
            <div class="user-count">Total: {{ totalCount }} users</div>
        </div>

        <div class="action-bar">
            <button class="batch-action-btn" @click="toggleBatchStatus" :disabled="selectedUsers.length === 0">
                <span class="btn-icon">🔄</span>
                Batch Ban/Allow ({{ selectedUsers.length }})
            </button>
        </div>

        <div class="table-container">
            <table class="user-table">
                <thead>
                    <tr>
                        <th class="checkbox-col">
                            <input type="checkbox" v-model="selectAll" @change="handleSelectAll"
                                class="custom-checkbox">
                        </th>
                        <th class="index-col">No.</th>
                        <th class="username-col">Username</th>
                        <th class="gender-col">Gender</th>
                        <th class="email-col">Email</th>
                        <th class="integral-col">Integral</th>
                        <th class="date-col">Registration Date</th>
                        <th class="status-col">Status</th>
                        <th class="action-col">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(user, index) in users" :key="user.id" class="user-row"
                        :class="{ 'even-row': index % 2 === 1 }">
                        <td class="checkbox-col">
                            <input type="checkbox" v-model="selectedUsers" :value="user.id" class="custom-checkbox">
                        </td>
                        <td class="index-col">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                        <td class="username-col">
                            <span class="user-name">{{ user.username }}</span>
                        </td>
                        <td class="gender-col">
                            <span class="gender-text">
                                {{ user.gender === '男' ? 'Male' : user.gender === '女' ? 'Female' : user.gender }}
                            </span>
                        </td>
                        <td class="email-col">{{ user.email }}</td>
                        <td class="integral-col">{{ user.integral }}</td>
                        <td class="date-col">{{ formatDate(user.registrationDate) }}</td>
                        <td class="status-col">
                            <label class="switch">
                                <input type="checkbox" :checked="!user.banned" @change="toggleUserStatus(user)" />
                                <span class="slider"></span>
                            </label>
                            <span class="status-text" :class="{ 'banned-text': user.banned }">{{ user.banned ? 'Banned'
                                : 'Active' }}</span>
                        </td>
                        <td class="action-col">
                            <button class="delete-btn" @click="deleteUser(user.id)" title="Delete User">
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

        <div v-if="loading" class="loading">Loading users...</div>
        <div v-if="error" class="error">{{ error }}</div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'

// Reactive data
const users = ref([])
const selectedUsers = ref([])
const loading = ref(false)
const error = ref('')

// Pagination data
const currentPage = ref(1)
const pageSize = ref(5)
const totalCount = ref(0)

// Computed property for select all checkbox
const selectAll = computed({
    get() {
        return users.value.length > 0 && selectedUsers.value.length === users.value.length
    },
    set(value) {
        if (value) {
            selectedUsers.value = users.value.map(user => user.id)
        } else {
            selectedUsers.value = []
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

// Fetch users data
const fetchUsers = async () => {
    loading.value = true
    error.value = ''
    try {
        console.log('Fetching user data from API...')
        const params = new URLSearchParams();
        params.append('pageNum', currentPage.value);
        params.append('pageSize', pageSize.value);
        const response = await axios.post('/api/users/pageList', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })

        if (response.data && response.data.data) {
            const pageInfo = response.data.data
            users.value = pageInfo.list || []
            totalCount.value = pageInfo.total || 0
            console.log(`Successfully loaded ${users.value.length} users, total: ${totalCount.value}`)
        } else {
            console.warn('Unexpected API response structure:', response.data)
            users.value = []
            totalCount.value = 0
        }
    } catch (error) {
        console.error('Error fetching users:', error)
        error.value = 'Failed to load user data. Please try again.'
        users.value = []
        totalCount.value = 0
    } finally {
        loading.value = false
    }
}

// Handle select all checkbox
const handleSelectAll = () => {
    if (selectAll.value) {
        selectedUsers.value = users.value.map(user => user.id)
    } else {
        selectedUsers.value = []
    }
}

// Toggle batch status
const toggleBatchStatus = async () => {
    if (selectedUsers.value.length === 0) {
        return
    }
    loading.value = true
    error.value = ''
    try {
        const selectedUserObjects = users.value.filter(user => selectedUsers.value.includes(user.id))

        for (const user of selectedUserObjects) {
            await toggleUserStatus(user)
        }
        selectedUsers.value = []
    } catch (error) {
        console.error('Error toggling ban status:', error)
        error.value = 'Failed to update user status. Please try again.'
    } finally {
        loading.value = false
    }
}

// Toggle single user status
const toggleUserStatus = async (user) => {
    loading.value = true
    error.value = ''
    try {
        const params = new URLSearchParams();
        params.append('Username', user.username);
        const response = await axios.post('/api/users/changeBanStatus', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        console.log('切换用户状态返回：', response.data);
        await fetchUsers()
    } catch (error) {
        console.error('Error toggling user status:', error)
        error.value = 'Failed to update user status. Please try again.'
    } finally {
        loading.value = false
    }
}

// Delete user (placeholder function)
const deleteUser = (userId) => {
    console.log('Delete user:', userId)
    // TODO: Implement delete functionality
}

// Pagination methods
const goToPage = (page) => {
    if (page >= 1 && page <= totalPages.value && page !== currentPage.value) {
        currentPage.value = page
        selectedUsers.value = [] // Clear selection when changing page
        fetchUsers()
    }
}

const handlePageSizeChange = () => {
    currentPage.value = 1 // Reset to first page when changing page size
    selectedUsers.value = [] // Clear selection
    fetchUsers()
}

// Format date
const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}

// Lifecycle hook
onMounted(() => {
    fetchUsers()
})
</script>

<style scoped>
.user-container {
    max-width: 1400px;
    width: 95%;
    margin: 20px auto;
    padding: 24px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    font-family: 'Playfair Display', 'Georgia', serif;
}

.user-header {
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

.user-count {
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
}

.batch-action-btn {
    background: linear-gradient(135deg, rgb(211, 169, 101), #d4af37);
    color: white;
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

.batch-action-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(211, 169, 101, 0.3);
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

.user-table {
    width: 100%;
    border-collapse: collapse;
    font-family: 'Lora', 'Georgia', serif;
}

.user-table thead tr {
    background: linear-gradient(135deg, rgb(211, 169, 101), #d4af37);
    color: white;
}


.user-table th,
.user-table td {
    text-align: center;
}

.user-table th {
    padding: 16px 12px;
    font-weight: 600;
    font-size: 1rem;
    letter-spacing: 0.5px;
    color: white !important;
}

.user-table td {
    padding: 14px 12px;
    border-bottom: 1px solid #f0f0f0;
    vertical-align: middle;
    text-align: center;
}

.user-row {
    transition: all 0.2s ease;
}

.user-row:hover {
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


.username-col {
    width: 120px;
    font-family: 'Lora', 'Georgia', serif;
}

.user-name {
    font-weight: 600;
    color: #333;
    font-family: 'Lora', 'Georgia', serif;
}

.gender-col {
    width: 80px;
    font-family: 'Lora', 'Georgia', serif;
}

.gender-text {
    font-weight: 600;
    color: #333;
    font-family: 'Lora', 'Georgia', serif;
}

.email-col {
    width: 200px;
    font-weight: 600;
    font-family: 'Lora', 'Georgia', serif;
}

.integral-col {
    width: 100px;
    text-align: center;
    font-weight: 600;
    color: #54AD54;
    font-size: 1.1rem;
    font-family: 'Times New Roman', 'Georgia', serif;
}

.date-col {
    min-width: 140px;
    font-weight: 600;
    font-size: 1rem;
    white-space: nowrap;
    width: auto;
    font-family: 'Lora', 'Georgia', serif;
}

.gender-col {
    width: 80px;
}

.gender-text {
    font-weight: 600;
    color: #333;
}

.email-col {
    width: 200px;
    font-weight: 600;
}

.integral-col {
    width: 100px;
    text-align: center;
    font-weight: 600;
    color: #54AD54;
    font-size: 1.1rem;
    font-family: 'Times New Roman', 'Georgia', serif;
}

.date-col {
    min-width: 140px;
    font-weight: 600;
    font-size: 1rem;
    white-space: nowrap;
    width: auto;
}

.status-col {
    width: 140px;
    min-width: 140px;
    text-align: center;
    vertical-align: middle;
}

.status-badge {
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.status-badge.active {
    background: linear-gradient(135deg, #007bff, #0056b3);
    color: white;
}

.status-badge.banned {
    background: linear-gradient(135deg, #dc3545, #c82333);
    color: white;
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
    background: linear-gradient(135deg, #007bff, #0056b3);
}

.switch input:checked+.slider:before {
    transform: translateX(22px);
}

.status-text {
    display: inline-block;
    min-width: 60px;
    margin-left: 10px;
    font-weight: 600;
    font-size: 0.95rem;
    text-align: left;
    vertical-align: middle;
    color: #54AD54;
}

.banned-text {
    color: #dc3545;
}

.action-col {
    width: 80px;
    text-align: center;
}

.delete-btn {
    background: linear-gradient(135deg, #dc3545, #c82333);
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 1rem;
}

.delete-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
}

.custom-checkbox {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: rgb(211, 169, 101);
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
    .user-container {
        width: 98%;
        padding: 16px;
    }

    .user-table th,
    .user-table td {
        padding: 10px 8px;
        font-size: 0.9rem;
    }
}

@media (max-width: 768px) {
    .user-header {
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

    .batch-action-btn {
        width: 100%;
        justify-content: center;
        margin-bottom: 16px;
    }
}

@media (max-width: 480px) {
    .user-container {
        margin: 10px;
        padding: 12px;
    }

    .title {
        font-size: 1.3rem;
    }

    .user-table th,
    .user-table td {
        padding: 8px 4px;
        font-size: 0.8rem;
    }
}
</style>
