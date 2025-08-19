<template>
    <div class="performance-container">
        <div class="header">
            <h2 class="title">
                <span class="icon">📈</span>
                Performance Report by Brand
            </h2>
            <div class="actions">
                <button class="refresh-btn" @click="fetchAll">Refresh</button>
            </div>
        </div>

        <div class="charts-grid">
            <!-- Shipments by Brand -->
            <div class="chart-card">
                <div class="card-header">
                    <div class="card-title">Shipments by Brand (status 1/2/3)</div>
                    <div class="card-actions">
                        <button :class="['toggle-btn', shippedChartType === 'pie' ? 'active' : '']"
                            @click="shippedChartType = 'pie'">Pie</button>
                        <button :class="['toggle-btn', shippedChartType === 'bar' ? 'active' : '']"
                            @click="shippedChartType = 'bar'">Bar</button>
                    </div>
                </div>
                <div v-if="loadingShipped" class="loading">Loading...</div>
                <div v-else-if="errorShipped" class="error">{{ errorShipped }}</div>
                <div class="chart-wrapper">
                    <div ref="shippedRef" class="chart"></div>
                    <div v-if="!loadingShipped && shippedStats.length === 0" class="empty-hint">暂无数据</div>
                </div>
            </div>

            <!-- Shipping Fee by Brand -->
            <div class="chart-card">
                <div class="card-header">
                    <div class="card-title">Shipping Fee by Brand (status 1/2/3)</div>
                    <div class="card-actions">
                        <button :class="['toggle-btn', feeChartType === 'pie' ? 'active' : '']"
                            @click="feeChartType = 'pie'">Pie</button>
                        <button :class="['toggle-btn', feeChartType === 'bar' ? 'active' : '']"
                            @click="feeChartType = 'bar'">Bar</button>
                    </div>
                </div>
                <div v-if="loadingFee" class="loading">Loading...</div>
                <div v-else-if="errorFee" class="error">{{ errorFee }}</div>
                <div class="chart-wrapper">
                    <div ref="feeRef" class="chart"></div>
                    <div v-if="!loadingFee && feeStats.length === 0" class="empty-hint">暂无数据</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'
import axios from 'axios'
import * as echarts from 'echarts'

// Shipment chart state
const shippedRef = ref(null)
let shippedChart = null
const shippedChartType = ref('pie')
const loadingShipped = ref(false)
const errorShipped = ref('')
const shippedStats = ref([]) // [{ brandName, totalShipped }]

// Fee chart state
const feeRef = ref(null)
let feeChart = null
const feeChartType = ref('pie')
const loadingFee = ref(false)
const errorFee = ref('')
const feeStats = ref([]) // [{ brandName, totalShippingFee }]

const ok = (r) => r && r.data && (r.data.code === 200 || r.data.ok === true)

const fetchAll = async () => {
    loadingShipped.value = true
    loadingFee.value = true
    errorShipped.value = ''
    errorFee.value = ''
    try {
        const headers = { 'Content-Type': 'application/x-www-form-urlencoded' }
        const [ordersResp, osnResp, shoesResp] = await Promise.all([
            axios.post('/api/order/getAll', {}, { headers }),
            axios.post('/api/orderShoeNum/getAll', {}, { headers }),
            axios.post('/api/shoe/getAll', {}, { headers })
        ])
        if (!ok(ordersResp) || !ok(osnResp) || !ok(shoesResp)) {
            throw new Error('Failed to fetch required data')
        }
        const orders = ordersResp.data.data || []
        const osn = osnResp.data.data || []
        const shoes = shoesResp.data.data || []

        // 1) 过滤订单状态为 1/2/3
        const validOrderIds = new Set(
            orders.filter(o => ['1', '2', '3'].includes(String(o.status))).map(o => o.orderId)
        )

        // 2) 构建 shoeId -> brandName
        const shoeIdToBrand = new Map()
        for (const s of shoes) {
            const brandName = s && s.brand && s.brand.brandName ? s.brand.brandName : 'Unknown'
            shoeIdToBrand.set(s.shoeId, brandName)
        }

        // 3) 出货量聚合：brand -> sum(shoe_num) for valid orders
        const brandToQty = new Map()
        for (const row of osn) {
            if (!validOrderIds.has(row.orderId)) continue
            const brandName = shoeIdToBrand.get(row.shoeId) || 'Unknown'
            const qty = Number(row.shoeNum || 0)
            brandToQty.set(brandName, (brandToQty.get(brandName) || 0) + qty)
        }
        shippedStats.value = Array.from(brandToQty.entries()).map(([brandName, totalShipped]) => ({ brandName, totalShipped }))
        shippedStats.value.sort((a, b) => b.totalShipped - a.totalShipped)

        // 4) 运费聚合（按订单中品牌数量占比分摊）
        const orderIdToRows = new Map()
        for (const row of osn) {
            if (!validOrderIds.has(row.orderId)) continue
            if (!orderIdToRows.has(row.orderId)) orderIdToRows.set(row.orderId, [])
            orderIdToRows.get(row.orderId).push(row)
        }
        const brandToFee = new Map()
        for (const o of orders) {
            if (!validOrderIds.has(o.orderId)) continue
            const fee = Number(o.shippingFee || 0)
            if (!fee) continue
            const items = orderIdToRows.get(o.orderId) || []
            let totalQty = 0
            const brandQty = new Map()
            for (const it of items) {
                const brandName = shoeIdToBrand.get(it.shoeId) || 'Unknown'
                const qty = Number(it.shoeNum || 0)
                totalQty += qty
                brandQty.set(brandName, (brandQty.get(brandName) || 0) + qty)
            }
            if (totalQty <= 0) continue
            for (const [brandName, qty] of brandQty.entries()) {
                const share = qty / totalQty
                const allocated = fee * share
                brandToFee.set(brandName, (brandToFee.get(brandName) || 0) + allocated)
            }
        }
        feeStats.value = Array.from(brandToFee.entries()).map(([brandName, totalShippingFee]) => ({ brandName, totalShippingFee }))
        feeStats.value.sort((a, b) => b.totalShippingFee - a.totalShippingFee)

        await nextTick()
        renderShipped()
        renderFee()
    } catch (e) {
        errorShipped.value = e.message || 'Network error'
        errorFee.value = e.message || 'Network error'
    } finally {
        loadingShipped.value = false
        loadingFee.value = false
    }
}

const renderShipped = () => {
    if (!shippedRef.value) return
    if (!shippedChart) {
        shippedChart = echarts.init(shippedRef.value, null, { renderer: 'canvas' })
        window.addEventListener('resize', () => shippedChart && shippedChart.resize())
    }
    const names = shippedStats.value.map(i => i.brandName)
    const values = shippedStats.value.map(i => i.totalShipped)
    if (names.length === 0) {
        shippedChart.clear()
        shippedChart.setOption({ title: { text: '暂无数据', left: 'center', top: 'center', textStyle: { color: '#999', fontSize: 16 } } })
        return
    }
    let option = {}
    if (shippedChartType.value === 'pie') {
        option = {
            tooltip: { trigger: 'item' },
            legend: { top: 'bottom' },
            series: [{
                name: 'Shipments',
                type: 'pie',
                radius: '65%',
                data: names.map((n, idx) => ({ name: n, value: values[idx] })),
                label: { show: true, formatter: '{d}%' },
                emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.5)' } }
            }]
        }
    } else {
        option = {
            tooltip: { trigger: 'axis' },
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: { type: 'category', data: names, axisLabel: { rotate: 20 } },
            yAxis: { type: 'value', name: 'Quantity' },
            series: [{ name: 'Shipments', type: 'bar', data: values, itemStyle: { color: '#d4af37' }, label: { show: true, position: 'top', formatter: '{c}' } }]
        }
    }
    shippedChart.clear()
    shippedChart.setOption(option, { notMerge: true, lazyUpdate: false })
}

const renderFee = () => {
    if (!feeRef.value) return
    if (!feeChart) {
        feeChart = echarts.init(feeRef.value, null, { renderer: 'canvas' })
        window.addEventListener('resize', () => feeChart && feeChart.resize())
    }
    const names = feeStats.value.map(i => i.brandName)
    const values = feeStats.value.map(i => i.totalShippingFee)
    if (names.length === 0) {
        feeChart.clear()
        feeChart.setOption({ title: { text: '暂无数据', left: 'center', top: 'center', textStyle: { color: '#999', fontSize: 16 } } })
        return
    }
    let option = {}
    if (feeChartType.value === 'pie') {
        option = {
            tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
            legend: { top: 'bottom' },
            series: [{
                name: 'Shipping Fee',
                type: 'pie',
                radius: '65%',
                data: names.map((n, idx) => ({ name: n, value: values[idx] })),
                label: { show: true, formatter: '{d}%' },
                emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.5)' } }
            }]
        }
    } else {
        option = {
            tooltip: { trigger: 'axis' },
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: { type: 'category', data: names, axisLabel: { rotate: 20 } },
            yAxis: { type: 'value', name: 'Fee' },
            series: [{ name: 'Shipping Fee', type: 'bar', data: values, itemStyle: { color: '#17a2b8' }, label: { show: true, position: 'top', formatter: '{c}' } }]
        }
    }
    feeChart.clear()
    feeChart.setOption(option, { notMerge: true, lazyUpdate: false })
}

watch(shippedChartType, renderShipped)
watch(feeChartType, renderFee)

onMounted(async () => {
    await nextTick()
    if (shippedRef.value && !shippedChart) shippedChart = echarts.init(shippedRef.value)
    if (feeRef.value && !feeChart) feeChart = echarts.init(feeRef.value)
    window.addEventListener('resize', () => {
        shippedChart && shippedChart.resize()
        feeChart && feeChart.resize()
    })
    fetchAll()
})
</script>

<style scoped>
.performance-container {
    max-width: 1400px;
    width: 95%;
    margin: 20px auto;
    padding: 24px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    font-family: 'Playfair Display', 'Georgia', serif;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 2px solid rgb(211, 169, 101);
}

.title {
    font-size: 1.8rem;
    font-weight: 600;
    color: rgb(211, 169, 101);
    margin: 0;
    display: flex;
    align-items: center;
    gap: 10px;
}

.icon {
    font-size: 1.8rem;
}

.actions {
    display: flex;
    gap: 8px;
}

.toggle-btn {
    border: 1px solid rgb(211, 169, 101);
    background: white;
    color: rgb(211, 169, 101);
    padding: 6px 12px;
    border-radius: 18px;
    cursor: pointer;
}

.toggle-btn.active {
    background: rgb(211, 169, 101);
    color: white;
}

.refresh-btn {
    padding: 8px 16px;
    border-radius: 20px;
    border: none;
    background: #17a2b8;
    color: white;
    cursor: pointer;
}

.charts-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
}

.chart-card {
    background: #fff;
    border-radius: 12px;
    border: 1px dashed #d4af37;
    padding: 14px 16px 8px;
}

.card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
}

.card-title {
    font-weight: 600;
    color: rgb(211, 169, 101);
}

.card-actions {
    display: flex;
    gap: 8px;
}

.chart-wrapper {
    position: relative;
    width: 100%;
}

.chart {
    width: 100%;
    height: 420px;
    background: #f9fafb;
}

.empty-hint {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #999;
    font-size: 16px;
    pointer-events: none;
}

.loading,
.error {
    text-align: center;
    padding: 8px;
    font-size: 0.95rem;
    font-weight: 500;
}

.error {
    color: #dc3545;
    background: rgba(220, 53, 69, 0.08);
    border-radius: 8px;
    margin-top: 6px;
}

@media (min-width: 1000px) {
    .charts-grid {
        grid-template-columns: 1fr 1fr;
    }
}
</style>
