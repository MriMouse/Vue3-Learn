<template>
    <div class="admin-layout">
        <aside class="sidebar">
            <div class="sidebar-header">
                <h1 class="brand-title">Admin Panel</h1>
            </div>
            <nav class="menu-nav">

                <!-- Home -->
                <div class="menu-section">
                    <div class="menu-item" :class="{ active: activeMenu === 'home' }" @click="selectMenu('home')">
                        <i class="menu-icon">🏠</i>
                        <span class="menu-text">Home</span>
                    </div>
                </div>

                <!-- 商品管理 -->
                <div class="menu-section">
                    <div class="menu-item menu-parent" :class="{ expanded: openMenus.product }"
                        @click="toggleSubMenu('product')">
                        <i class="menu-icon">🛒</i>
                        <span class="menu-text">Product Management</span>
                        <i class="expand-icon" :class="{ rotated: openMenus.product }">▶</i>
                    </div>
                    <div class="submenu-container" :class="{ show: openMenus.product }">
                        <div v-for="item in ['product-list', 'brand-list', 'type-list', 'color-list', 'size-list']"
                            :key="item" class="submenu-item" :class="{ active: activeMenu === item }"
                            @click.stop="selectMenu(item)">
                            {{ menuLabels[item] }}
                        </div>
                    </div>
                </div>

                <!-- 订单管理 -->
                <div class="menu-section">
                    <div class="menu-item menu-parent" :class="{ expanded: openMenus.order }"
                        @click="toggleSubMenu('order')">
                        <i class="menu-icon">📋</i>
                        <span class="menu-text">Order Management</span>
                        <i class="expand-icon" :class="{ rotated: openMenus.order }">▶</i>
                    </div>
                    <div class="submenu-container" :class="{ show: openMenus.order }">
                        <div v-for="item in ['order-pending-shipment', 'order-shipping', 'order-successful', 'order-return-apply', 'order-returned', 'order-cancelled']"
                            :key="item" class="submenu-item" :class="{ active: activeMenu === item }"
                            @click.stop="selectMenu(item)">
                            {{ menuLabels[item] }}
                        </div>
                    </div>
                </div>

                <!-- 用户管理 -->
                <div class="menu-section">
                    <div class="menu-item menu-parent" :class="{ expanded: openMenus.user }"
                        @click="toggleSubMenu('user')">
                        <i class="menu-icon">👤</i>
                        <span class="menu-text">User Management</span>
                        <i class="expand-icon" :class="{ rotated: openMenus.user }">▶</i>
                    </div>
                    <div class="submenu-container" :class="{ show: openMenus.user }">
                        <div class="submenu-item" :class="{ active: activeMenu === 'user-list' }"
                            @click.stop="selectMenu('user-list')">
                            {{ menuLabels['user-list'] }}
                        </div>
                    </div>
                </div>

                <!-- 查看报表 -->
                <div class="menu-section">
                    <div class="menu-item menu-parent" :class="{ expanded: openMenus.report }"
                        @click="toggleSubMenu('report')">
                        <i class="menu-icon">📊</i>
                        <span class="menu-text">Reports</span>
                        <i class="expand-icon" :class="{ rotated: openMenus.report }">▶</i>
                    </div>
                    <div class="submenu-container" :class="{ show: openMenus.report }">
                        <div v-for="item in ['report-performance', 'report-marketing', 'report-traffic']" :key="item"
                            class="submenu-item" :class="{ active: activeMenu === item }"
                            @click.stop="selectMenu(item)">
                            {{ menuLabels[item] }}
                        </div>
                    </div>
                </div>

                <!-- 企业管理 -->
                <div class="menu-section">
                    <div class="menu-item menu-parent" :class="{ expanded: openMenus.company }"
                        @click="toggleSubMenu('company')">
                        <i class="menu-icon">🏢</i>
                        <span class="menu-text">Company Management</span>
                        <i class="expand-icon" :class="{ rotated: openMenus.company }">▶</i>
                    </div>
                    <div class="submenu-container" :class="{ show: openMenus.company }">
                        <div class="submenu-item" :class="{ active: activeMenu === 'link-manage' }"
                            @click.stop="selectMenu('link-manage')">
                            {{ menuLabels['link-manage'] }}
                        </div>
                        <div class="submenu-item" :class="{ active: activeMenu === 'ad-manage' }"
                            @click.stop="selectMenu('ad-manage')">
                            {{ menuLabels['ad-manage'] }}
                        </div>
                    </div>
                </div>

            </nav>
        </aside>

        <main class="main-content">
            <component :is="currentComponent" />
        </main>
    </div>
</template>


<script>
// Import order components
import OrderPendingShipment from './OrderPendingShipment.vue';
import OrderShipping from './OrderShipping.vue';
import OrderSuccessful from './OrderSuccessful.vue';
import OrderReturnApply from './OrderReturnApply.vue';
import OrderReturned from './OrderReturned.vue';
import OrderCancelled from './OrderCancelled.vue';

// Import other components
import AdminHome from './AdminHome.vue';
import ProductList from './ProductList.vue';
import BrandList from './BrandList.vue';
import TypeList from './TypeList.vue';
import ColorList from './ColorList.vue';
import SizeList from './SizeList.vue';
import UserList from './UserList.vue';
import ReportPerformance from './ReportPerformance.vue';
import ReportMarketing from './ReportMarketing.vue';
import ReportTraffic from './ReportTraffic.vue';
import LinkManage from './LinkManage.vue';
import AdManage from './AdManage.vue';

export default {
    name: 'AdminLayout',
    components: {
        OrderPendingShipment,
        OrderShipping,
        OrderSuccessful,
        OrderReturnApply,
        OrderReturned,
        OrderCancelled,
        AdminHome,
        ProductList,
        BrandList,
        TypeList,
        ColorList,
        SizeList,
        UserList,
        ReportPerformance,
        ReportMarketing,
        ReportTraffic,
        LinkManage,
        AdManage,
    },
    data() {
        return {
            activeMenu: 'home',
            openMenus: {
                product: false,
                order: false,
                user: false,
                report: false,
                company: false
            },
            menuLabels: {
                'product-list': 'Product List',
                'brand-list': 'Brand List',
                'type-list': 'Type List',
                'color-list': 'Color List',
                'size-list': 'Size List',
                'order-pending-shipment': 'Pending Shipment Orders',
                'order-shipping': 'Shipping Orders',
                'order-successful': 'Successful Orders',
                'order-return-apply': 'Return Application Orders',
                'order-returned': 'Returned Orders',
                'order-cancelled': 'Cancelled Orders',
                'user-list': 'User List',
                'report-performance': 'Performance Report',
                'report-marketing': 'Marketing Report',
                'report-traffic': 'Traffic Report',
                'link-manage': 'Partner Links',
                'ad-manage': 'Advertisement Management',
            }
        };
    },
    computed: {
        currentComponent() {
            const map = {
                'home': AdminHome,
                'product-list': ProductList,
                'brand-list': BrandList,
                'type-list': TypeList,
                'color-list': ColorList,
                'size-list': SizeList,
                'order-pending-shipment': OrderPendingShipment,
                'order-shipping': OrderShipping,
                'order-successful': OrderSuccessful,
                'order-return-apply': OrderReturnApply,
                'order-returned': OrderReturned,
                'order-cancelled': OrderCancelled,
                'user-list': UserList,
                'report-performance': ReportPerformance,
                'report-marketing': ReportMarketing,
                'report-traffic': ReportTraffic,
                'link-manage': LinkManage,
                'ad-manage': AdManage,
            };
            return map[this.activeMenu] || AdminHome;
        }
    },
    methods: {
        selectMenu(menu) {
            this.activeMenu = menu;
        },
        toggleSubMenu(menu) {
            this.openMenus[menu] = !this.openMenus[menu];
        }
    }
};
</script>

<style scoped>
* {
    box-sizing: border-box;
}

.admin-layout {
    display: flex;
    height: 100vh;
    background: rgb(243, 242, 234);
}

.sidebar {
    width: 280px;
    background: linear-gradient(180deg, #2c3e50 0%, #34495e 100%);
    color: #ecf0f1;
    display: flex;
    flex-direction: column;
    box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    position: relative;
}

.sidebar::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, rgb(211, 169, 101), #f39c12);
}

.sidebar-header {
    padding: 2rem 1.5rem 1.5rem;
    text-align: center;
    border-bottom: 1px solid rgba(236, 240, 241, 0.1);
}

.brand-title {
    font-size: 1.5rem;
    font-family: 'Playball', cursive, 'Times New Roman', serif;
    color: rgb(211, 169, 101);
    margin: 0 0 0.5rem 0;
    font-weight: 600;
    letter-spacing: 1px;
}

.menu-nav {
    flex: 1;
    padding: 1rem 0;
    overflow-y: auto;
    /* 关键：菜单区域可滚动 */
    max-height: calc(100vh - 140px);
    /* 预留给header等的高度 */
    /* 更柔和的滚动条样式 */
    scrollbar-width: thin;
    /* Firefox */
    scrollbar-color: rgba(255, 255, 255, 0.25) transparent;
}

/* WebKit 浏览器的滚动条定制 */
.menu-nav::-webkit-scrollbar {
    width: 8px;
}

.menu-nav::-webkit-scrollbar-track {
    background: transparent;
}

.menu-nav::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.22);
    border-radius: 8px;
    border: 2px solid transparent;
    /* 窄边距，避免显得突兀 */
    background-clip: padding-box;
}

.menu-nav:hover::-webkit-scrollbar-thumb {
    background: rgba(211, 169, 101, 0.45);
    /* 悬停时略显色 */
}

.menu-section {
    margin-bottom: 0.5rem;
}

.menu-item {
    display: flex;
    align-items: center;
    padding: 0.875rem 1.5rem;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    position: relative;
    color: #ecf0f1;
    border-left: 3px solid transparent;
}

.menu-item:hover {
    background: rgba(52, 73, 94, 0.8);
    color: rgb(211, 169, 101);
    border-left-color: rgba(211, 169, 101, 0.3);
}

.menu-item.active {
    background: rgba(211, 169, 101, 0.15);
    color: rgb(211, 169, 101);
    border-left-color: rgb(211, 169, 101);
}

.menu-item.expanded {
    background: rgba(52, 73, 94, 0.6);
    color: rgb(211, 169, 101);
}

.menu-icon {
    font-size: 1.2rem;
    margin-right: 1rem;
    width: 1.5rem;
    text-align: center;
    opacity: 0.9;
}

.menu-text {
    flex: 1;
    font-size: 0.95rem;
    font-weight: 500;
    letter-spacing: 0.3px;
}

.expand-icon {
    font-size: 0.7rem;
    margin-left: auto;
    transition: transform 0.3s ease;
    opacity: 0.7;
}

.expand-icon.rotated {
    transform: rotate(90deg);
}

.submenu-container {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
    background: rgba(44, 62, 80, 0.3);
}

.submenu-container.show {
    max-height: 600px;
    /* 更大的展开高度以适配滚动容器 */
}

.submenu-item {
    display: block;
    padding: 0.7rem 1.5rem 0.7rem 3.5rem;
    cursor: pointer;
    transition: all 0.25s ease;
    color: #bdc3c7;
    font-size: 0.9rem;
    position: relative;
    border-left: 2px solid transparent;
}

.submenu-item::before {
    content: '';
    position: absolute;
    left: 2.8rem;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 4px;
    background: #7f8c8d;
    border-radius: 50%;
    transition: all 0.25s ease;
}

.submenu-item:hover {
    background: rgba(52, 73, 94, 0.5);
    color: rgb(211, 169, 101);
    border-left-color: rgba(211, 169, 101, 0.3);
}

.submenu-item:hover::before {
    background: rgb(211, 169, 101);
    transform: translateY(-50%) scale(1.2);
}

.submenu-item.active {
    background: rgba(211, 169, 101, 0.1);
    color: rgb(211, 169, 101);
    border-left-color: rgb(211, 169, 101);
    font-weight: 600;
}

.submenu-item.active::before {
    background: rgb(211, 169, 101);
    transform: translateY(-50%) scale(1.3);
}

.main-content {
    flex: 1;
    background: rgb(243, 242, 234);
    padding: 2rem 3rem;
    height: 100vh;
    overflow: hidden;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .admin-layout {
        flex-direction: column;
    }

    .sidebar {
        width: 100%;
        height: auto;
    }

    .sidebar-header {
        padding: 1rem;
    }

    .brand-title {
        font-size: 1.25rem;
    }

    .main-content {
        padding: 1rem;
        flex: 1;
    }
}

@media (max-width: 480px) {
    .menu-item {
        padding: 0.75rem 1rem;
    }

    .menu-text {
        font-size: 0.9rem;
    }

    .submenu-item {
        padding: 0.6rem 1rem 0.6rem 2.5rem;
        font-size: 0.85rem;
    }

    .submenu-item::before {
        left: 2rem;
    }
}
</style>
