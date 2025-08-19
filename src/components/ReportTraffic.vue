<template>
    <div class="report-traffic">
        <div class="charts-grid">
            <div class="card">
                <div class="card-title">点击热力图（按日期）</div>
                <div ref="clickHeatRef" class="chart"></div>
            </div>
            <div class="card">
                <div class="card-title">热门鞋子排名（点击量）</div>
                <div ref="hotShoesRef" class="chart"></div>
            </div>
            <div class="card">
                <div class="card-header">
                    <div class="card-title">{{ orderMode === 'heat' ? '订单热力图（按日期）' : '订单折线图' }}</div>
                    <div class="controls">
                        <button class="btn btn-outline" @click="toggleOrderMode">{{ orderMode === 'heat' ? '切换为折线图' :
                            '切换为热力图' }}</button>
                    </div>
                </div>
                <div ref="orderHeatRef" class="chart"></div>
            </div>
        </div>
    </div>

</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const clickHeatRef = ref(null)
const orderHeatRef = ref(null)
const hotShoesRef = ref(null)

let clickHeatChart = null
let orderHeatChart = null
let hotShoesChart = null

// 订单图表模式
const orderMode = ref('heat') // 'heat' | 'line'
const orderPairs = ref([]) // [date, count]

function loadECharts() {
    if (window.echarts) {
        return Promise.resolve(window.echarts)
    }
    return new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js'
        script.async = true
        script.onload = () => resolve(window.echarts)
        script.onerror = () => reject(new Error('Failed to load ECharts'))
        document.head.appendChild(script)
    })
}

async function fetchJSON(url, { method = 'POST', body } = {}) {
    const headers = {}
    let fetchBody = body
    if (body && typeof body === 'string') {
        headers['Content-Type'] = 'application/x-www-form-urlencoded'
    } else if (body && typeof body === 'object') {
        headers['Content-Type'] = 'application/json'
        fetchBody = JSON.stringify(body)
    }
    const res = await fetch(url, { method, headers, body: fetchBody })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
}

function toDateString(dateInput) {
    try {
        if (!dateInput) return null
        // 支持 LocalDate (yyyy-MM-dd) 与 LocalDateTime (yyyy-MM-ddTHH:mm:ss 或 带空格)
        const s = String(dateInput)
        if (s.length >= 10) return s.slice(0, 10)
        return null
    } catch { return null }
}

function buildCalendarOption(title, dataPairs, rangeStart, rangeEnd) {
    return {
        tooltip: { position: 'top' },
        visualMap: {
            min: 0,
            max: Math.max(1, Math.max(...dataPairs.map((d) => d[1] || 0))),
            orient: 'horizontal',
            left: 'center',
            bottom: 0,
            inRange: { color: ['#e8f5e9', '#1b5e20'] }
        },
        calendar: {
            top: 40,
            left: 20,
            right: 20,
            bottom: 60,
            range: [rangeStart, rangeEnd],
            cellSize: ['auto', 18],
            splitLine: { show: true, lineStyle: { color: '#eee' } },
            itemStyle: { color: '#fff', borderColor: '#eee' },
            dayLabel: { color: '#666' },
            monthLabel: { color: '#666' },
            yearLabel: { color: '#333' }
        },
        series: [{
            type: 'heatmap',
            coordinateSystem: 'calendar',
            data: dataPairs
        }]
    }
}

function getRangeFromDates(dates) {
    if (!dates.length) {
        const today = new Date()
        const y = today.getFullYear()
        return [`${y}-01-01`, `${y}-12-31`]
    }
    const sorted = dates.slice().sort()
    return [sorted[0], sorted[sorted.length - 1]]
}

async function renderClickHeat(echarts) {
    // 获取所有点击日志并聚合到日期
    const resp = await fetchJSON('/api/clickLog/getAll')
    const logs = Array.isArray(resp?.data) ? resp.data : []
    const map = new Map()
    for (const log of logs) {
        const d = toDateString(log.clickTime)
        if (!d) continue
        map.set(d, (map.get(d) || 0) + 1)
    }
    const pairs = Array.from(map.entries()).sort((a, b) => a[0] > b[0] ? 1 : -1)
    const dateList = pairs.map(p => p[0])
    const [start, end] = getRangeFromDates(dateList)
    clickHeatChart = echarts.init(clickHeatRef.value)
    clickHeatChart.setOption(buildCalendarOption('点击热力图', pairs, start, end))
}

async function renderOrderHeat(echarts) {
    // 获取所有订单并聚合到日期
    const resp = await fetchJSON('/api/order/getAll')
    const orders = Array.isArray(resp?.data) ? resp.data : []
    const map = new Map()
    for (const o of orders) {
        const d = toDateString(o.createdAt)
        if (!d) continue
        map.set(d, (map.get(d) || 0) + 1)
    }
    orderPairs.value = Array.from(map.entries()).sort((a, b) => (a[0] > b[0] ? 1 : -1))
    orderHeatChart = echarts.init(orderHeatRef.value)
    renderOrderChart()
}

function buildLineOption(title, pairs) {
    const dates = pairs.map(p => p[0])
    const values = pairs.map(p => p[1])
    return {
        tooltip: { trigger: 'axis' },
        grid: { left: 40, right: 20, top: 20, bottom: 40 },
        xAxis: { type: 'category', data: dates, boundaryGap: false, axisLine: { lineStyle: { color: '#999' } } },
        yAxis: { type: 'value', axisLine: { lineStyle: { color: '#999' } }, splitLine: { lineStyle: { color: '#eee' } } },
        dataZoom: [
            { type: 'slider', start: 0, end: 100 },
            { type: 'inside' }
        ],
        series: [{ type: 'line', data: values, smooth: true, symbol: 'circle', itemStyle: { color: '#1b5e20' }, areaStyle: { color: 'rgba(76,175,80,0.15)' } }]
    }
}

function renderOrderChart() {
    if (!orderHeatChart) return
    if (orderMode.value === 'heat') {
        const dateList = orderPairs.value.map(p => p[0])
        const [start, end] = getRangeFromDates(dateList)
        orderHeatChart.setOption(buildCalendarOption('订单热力图', orderPairs.value, start, end), true)
    } else {
        orderHeatChart.setOption(buildLineOption('订单折线图', orderPairs.value), true)
    }
}

function toggleOrderMode() {
    orderMode.value = orderMode.value === 'heat' ? 'line' : 'heat'
    renderOrderChart()
}

async function renderHotShoes(echarts) {
    // 直接复用后端已有热门鞋子接口，包含点击量
    const resp = await fetchJSON('/api/clickLog/getHotShoes', { method: 'POST', body: 'limit=20' })
    const list = Array.isArray(resp?.data) ? resp.data : []
    // 兼容字段：优先 name，否则用 `鞋子#ID`
    const items = list.map((it) => ({
        name: it?.shoe?.name || it?.name || `鞋子 #${it?.shoeId}`,
        clicks: Number(it?.clickCount || it?.click_count || it?.clicks || 0)
    }))
    // 降序
    items.sort((a, b) => b.clicks - a.clicks)
    const names = items.map(i => i.name)
    const values = items.map(i => i.clicks)

    hotShoesChart = echarts.init(hotShoesRef.value)
    hotShoesChart.setOption({
        grid: { left: 120, right: 20, top: 20, bottom: 40 },
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        xAxis: { type: 'value', axisLine: { lineStyle: { color: '#999' } }, splitLine: { lineStyle: { color: '#eee' } } },
        yAxis: {
            type: 'category',
            data: names,
            axisLine: { lineStyle: { color: '#999' } },
            axisLabel: { color: '#333', interval: 0 }
        },
        dataZoom: [
            { type: 'slider', yAxisIndex: 0, right: 0, start: 0, end: Math.min(100, 100 * (10 / Math.max(1, names.length))) },
            { type: 'inside', yAxisIndex: 0 }
        ],
        series: [{
            type: 'bar',
            data: values,
            barWidth: 14,
            itemStyle: { color: '#111' },
            label: { show: true, position: 'right', color: '#111' }
        }]
    })
}

function handleResize() {
    clickHeatChart?.resize()
    orderHeatChart?.resize()
    hotShoesChart?.resize()
}

onMounted(async () => {
    try {
        const echarts = await loadECharts()
        await Promise.all([
            renderClickHeat(echarts),
            renderHotShoes(echarts),
            renderOrderHeat(echarts)
        ])
        window.addEventListener('resize', handleResize)
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error('渲染报表失败:', e)
    }
})

onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize)
    clickHeatChart?.dispose?.()
    orderHeatChart?.dispose?.()
    hotShoesChart?.dispose?.()
})
</script>

<style scoped>
.report-traffic {
    padding: 16px;
}

.charts-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
}

.card {
    background: #fff;
    border: 1px solid #eee;
    border-radius: 12px;
    padding: 12px;
}

.card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;
}

.card-title {
    font-weight: 700;
    color: #111;
}

.controls {
    display: flex;
    align-items: center;
    gap: 8px;
}

.btn {
    padding: 8px 14px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: background .15s ease, color .15s ease, border-color .15s ease, transform .1s ease;
}

.btn-outline {
    background: transparent;
    color: #000;
    border: 1.5px solid #000;
}

.btn-outline:hover {
    background: #000;
    color: #fff;
}

.chart {
    width: 100%;
    height: 360px;
}

@media (min-width: 960px) {
    .charts-grid {
        grid-template-columns: 1fr 1fr;
    }

    .charts-grid>.card:nth-child(3) {
        grid-column: 1 / span 2;
    }
}
</style>
