<template>
    <div class="marketing-container">
        <div class="header">
            <h2 class="title">
                <span class="icon">📊</span>
                Marketing Analysis by Shoe Type
            </h2>
            <div class="actions">
                <button :class="['toggle-btn', chartType === 'pie' ? 'active' : '']"
                    @click="chartType = 'pie'">Pie</button>
                <button :class="['toggle-btn', chartType === 'bar' ? 'active' : '']"
                    @click="chartType = 'bar'">Bar</button>
                <button class="refresh-btn" @click="fetchData">Refresh</button>
            </div>
        </div>

        <div v-if="loading" class="loading">Loading...</div>
        <div v-else-if="error" class="error">{{ error }}</div>
        <div v-else class="chart-wrapper">
            <div ref="chartRef" class="chart"></div>
            <div v-if="!loading && stats.length === 0" class="empty-hint">暂无数据</div>
        </div>
    </div>


</template>
<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import axios from 'axios'
import * as echarts from 'echarts'

const chartRef = ref(null)
let chartInstance = null
const chartType = ref('pie')
const loading = ref(false)
const error = ref('')
const stats = ref([]) // [{ typeId, typeName, totalSold }]

const fetchData = async () => {
    loading.value = true
    error.value = ''
    try {
        console.log('[Marketing] fetchData: start')
        const headers = { 'Content-Type': 'application/x-www-form-urlencoded' }
        const [ordersResp, osnResp, shoesResp] = await Promise.all([
            axios.post('/api/order/getAll', {}, { headers }),
            axios.post('/api/orderShoeNum/getAll', {}, { headers }),
            axios.post('/api/shoe/getAll', {}, { headers })
        ])

        const ok = (r) => r && r.data && (r.data.code === 200 || r.data.ok === true)
        if (!ok(ordersResp) || !ok(osnResp) || !ok(shoesResp)) {
            console.warn('[Marketing] fetchData: bad response flags', {
                orderOk: ok(ordersResp), osnOk: ok(osnResp), shoeOk: ok(shoesResp),
                orderRaw: ordersResp?.data, osnRaw: osnResp?.data, shoeRaw: shoesResp?.data
            })
            throw new Error('Failed to fetch required data')
        }

        const orders = ordersResp.data.data || []
        const osn = osnResp.data.data || []
        const shoes = shoesResp.data.data || []
        console.log('[Marketing] fetchData: lengths', {
            orders: orders.length, orderSample: orders[0],
            osn: osn.length, osnSample: osn[0],
            shoes: shoes.length, shoeSample: shoes[0]
        })

        // 统计status为1、2、3的订单
        const orderIdSet = new Set(
            orders.filter(o => [1, 2, 3].includes(Number(o.status))).map(o => o.orderId)
        )
        console.log('[Marketing] orderIdSet sizes', { usedSize: orderIdSet.size })

        const shoeIdToTypeName = new Map()
        for (const s of shoes) {
            const typeName = (s && s.shoesType && s.shoesType.typeName) ? s.shoesType.typeName : `Type ${s?.shoesType?.typeId ?? ''}`
            shoeIdToTypeName.set(s.shoeId, typeName)
        }
        console.log('[Marketing] shoeIdToTypeName size', shoeIdToTypeName.size)

        const agg = new Map()
        for (const row of osn) {
            if (!orderIdSet.has(row.orderId)) continue
            const typeName = shoeIdToTypeName.get(row.shoeId) || 'Unknown'
            const prev = agg.get(typeName) || 0
            agg.set(typeName, prev + (Number(row.shoeNum) || 0))
        }

        stats.value = Array.from(agg.entries()).map(([typeName, totalSold]) => ({ typeName, totalSold }))
        // sort desc for nicer view
        stats.value.sort((a, b) => b.totalSold - a.totalSold)
        console.log('[Marketing] stats computed', { count: stats.value.length, stats: stats.value })
        // 先结束loading，确保DOM中有chart容器，再渲染
        loading.value = false
        await nextTick()
        renderChart()
    } catch (e) {
        console.error(e)
        error.value = e.message || 'Network error'
    } finally {
        console.log('[Marketing] fetchData: end')
    }
}

const renderChart = () => {
    if (!chartRef.value) {
        console.warn('[Marketing] renderChart: chartRef missing')
        return
    }
    if (!chartInstance) {
        console.log('[Marketing] renderChart: init echarts', {
            width: chartRef.value.clientWidth, height: chartRef.value.clientHeight
        })
        chartInstance = echarts.init(chartRef.value, null, { renderer: 'canvas' })
        window.addEventListener('resize', () => {
            if (chartInstance) {
                chartInstance.resize()
            }
        })
    }

    const cs = window.getComputedStyle(chartRef.value)
    console.log('[Marketing] renderChart: container style', {
        display: cs.display, visibility: cs.visibility, opacity: cs.opacity,
        clientWidth: chartRef.value.clientWidth, clientHeight: chartRef.value.clientHeight
    })

    const names = stats.value.map(i => i.typeName || `Type ${i.typeId}`)
    const values = stats.value.map(i => Number(i.totalSold) || 0)
    console.log('[Marketing] renderChart: data', { chartType: chartType.value, names, values })

    if (names.length === 0) {
        chartInstance.clear()
        chartInstance.setOption({
            title: { text: '暂无数据', left: 'center', top: 'center', textStyle: { color: '#999', fontSize: 16 } }
        })
        console.log('[Marketing] renderChart: empty state set')
        return
    }

    let option = {}
    if (chartType.value === 'pie') {
        option = {
            tooltip: { trigger: 'item' },
            legend: { top: 'bottom' },
            series: [
                {
                    name: 'Sales By Type',
                    type: 'pie',
                    radius: '65%',
                    data: names.map((n, idx) => ({ name: n, value: values[idx] })),
                    label: { show: true, formatter: '{d}%' },
                    emphasis: {
                        itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' }
                    }
                }
            ]
        }
    } else {
        option = {
            tooltip: { trigger: 'axis' },
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: { type: 'category', data: names, axisLabel: { rotate: 20 } },
            yAxis: { type: 'value', name: 'Sales' },
            series: [
                { name: 'Sales', type: 'bar', data: values, itemStyle: { color: '#d4af37' }, label: { show: true, position: 'top', formatter: '{c}' } }
            ]
        }
    }

    // 彻底刷新一次
    chartInstance.clear()
    chartInstance.setOption(option, { notMerge: true, lazyUpdate: false })
    chartInstance.resize({
        width: chartRef.value.clientWidth,
        height: chartRef.value.clientHeight
    })
    console.log('[Marketing] renderChart: option applied, size', {
        w: chartInstance.getWidth && chartInstance.getWidth(),
        h: chartInstance.getHeight && chartInstance.getHeight()
    })
    // 调试：查看绘制层；若未注入DOM，则降级使用SVG重试
    setTimeout(() => {
        const layer = chartRef.value.querySelector('canvas, svg')
        if (layer) {
            const cs2 = window.getComputedStyle(layer)
            console.log('[Marketing] layer style', {
                tag: layer.tagName, width: cs2.width, height: cs2.height,
                clientWidth: layer.clientWidth, clientHeight: layer.clientHeight
            })
        } else {
            console.warn('[Marketing] no render layer found, fallback to svg renderer')
            try {
                const opt = chartInstance.getOption && chartInstance.getOption()
                chartInstance.dispose()
                chartInstance = echarts.init(chartRef.value, null, { renderer: 'svg' })
                chartInstance.setOption(opt || option, { notMerge: true })
                chartInstance.resize()
            } catch (e) {
                console.error('[Marketing] fallback error', e)
            }
        }
    }, 120)
}

watch(chartType, () => {
    renderChart()
})

onMounted(async () => {
    await nextTick()
    if (chartRef.value && !chartInstance) {
        chartInstance = echarts.init(chartRef.value)
        window.addEventListener('resize', () => chartInstance && chartInstance.resize())
        renderChart()
    }
    fetchData()
})
</script>
<style scoped>
.marketing-container {
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
    padding: 8px 16px;
    border-radius: 20px;
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

.chart-wrapper {
    width: 100%;
    position: relative;
}

.chart {
    width: 100%;
    height: 520px;
    background: #f9fafb;
    /* 调试用：淡灰背景，便于观察 */
    border: 1px dashed #d4af37;
    /* 调试用：边框 */
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
    padding: 20px;
    font-size: 1.1rem;
    font-weight: 500;
}

.error {
    color: #dc3545;
    background: rgba(220, 53, 69, 0.1);
    border-radius: 8px;
    margin-top: 16px;
}
</style>
