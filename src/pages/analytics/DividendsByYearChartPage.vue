<template>
  <TheMainLayout>
    <template #default>
      <div class="col-12" :style="cssVars">
        <!-- Page header -->
        <div class="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-3">
          <div>
            <h2 class="mb-1">{{ pageTitle }}</h2>
            <p class="text-muted mb-0 small">{{ t('analyses.charts.dividends_by_year.description') }}</p>
          </div>
          <div class="d-flex align-items-center gap-2 flex-wrap">
            <span v-if="currency" class="badge rounded-pill text-bg-light border">
              <i class="bi bi-cash-coin me-1"></i>{{ t('analyses.charts.common.baseCurrency') }}: <strong>{{ currency }}</strong>
            </span>
            <div class="dropdown">
              <button class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown" type="button">
                <i class="bi bi-download me-1"></i>{{ t('analyses.charts.common.export') }}
              </button>
              <ul class="dropdown-menu dropdown-menu-end">
                <li>
                  <a class="dropdown-item" href="#" @click.prevent="exportPng">
                    <i class="bi bi-image me-2"></i>PNG
                  </a>
                </li>
                <li>
                  <a class="dropdown-item" href="#" @click.prevent="exportCsv">
                    <i class="bi bi-filetype-csv me-2"></i>CSV
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Filter card — always visible once page is mounted -->
        <div class="card mb-3">
          <div class="card-body py-2">
            <div class="d-flex flex-wrap align-items-end gap-3">
              <!-- Depot filter -->
              <div>
                <div class="filter-label">{{ t('analyses.charts.common.depots') }}</div>
                <div class="dropdown" ref="depotDropdownEl">
                  <button
                    class="btn btn-sm btn-outline-secondary dropdown-toggle"
                    type="button"
                    :class="{ active: selectedDepotIds.length > 0 }"
                    @click.stop="toggleDepotDropdown"
                  >
                    <i class="bi bi-bank me-1"></i>{{ depotFilterLabel }}
                  </button>
                  <ul class="dropdown-menu depot-dropdown" :class="{ show: depotDropdownOpen }">
                    <li>
                      <a class="dropdown-item" href="#" @click.prevent="clearDepotSelection">
                        <i class="bi bi-check2-all me-2" :class="selectedDepotIds.length === 0 ? 'text-primary' : 'invisible'"></i>
                        {{ t('analyses.charts.common.allDepots') }}
                      </a>
                    </li>
                    <li><hr class="dropdown-divider" /></li>
                    <li v-for="depot in availableDepots" :key="depot.ID">
                      <a class="dropdown-item" href="#" @click.prevent="toggleDepot(depot.ID)">
                        <i class="bi me-2" :class="selectedDepotIds.includes(depot.ID) ? 'bi-check-square-fill text-primary' : 'bi-square text-muted'"></i>
                        {{ depot.Name }}
                        <span v-if="depot.BrokerName" class="text-muted ms-1 small">({{ depot.BrokerName }})</span>
                      </a>
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <div class="filter-label">{{ t('analyses.charts.common.quickSelect') }}</div>
                <div class="btn-group" role="group">
                  <button
                    v-for="p in presets"
                    :key="p.key"
                    type="button"
                    class="btn btn-sm btn-outline-secondary"
                    :class="{ active: preset === p.key }"
                    @click="applyPreset(p.key)"
                    :disabled="loading"
                  >
                    {{ t(p.labelKey) }}
                  </button>
                </div>
              </div>
              <div>
                <div class="filter-label">{{ t('analyses.charts.common.from') }}</div>
                <select class="form-select form-select-sm" v-model="yearFrom" @change="onYearChange" :disabled="loading || availableYears.length === 0">
                  <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
                </select>
              </div>
              <div>
                <div class="filter-label">{{ t('analyses.charts.common.to') }}</div>
                <select class="form-select form-select-sm" v-model="yearTo" @change="onYearChange" :disabled="loading || availableYears.length === 0">
                  <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
                </select>
              </div>
              <div class="ms-auto">
                <div class="filter-label">{{ t('analyses.charts.common.values') }}</div>
                <div class="btn-group" role="group">
                  <input type="checkbox" class="btn-check" id="v-gross" v-model="activeValues" value="gross" />
                  <label class="btn btn-sm btn-value btn-value-gross" for="v-gross">
                    <span class="legend-dot" style="background: var(--c-gross)"></span>
                    {{ t('analyses.dividends_by_year.columns.gross') }}
                  </label>
                  <input type="checkbox" class="btn-check" id="v-after-wht" v-model="activeValues" value="after_withholding" />
                  <label class="btn btn-sm btn-value btn-value-after-wht" for="v-after-wht">
                    <span class="legend-dot" style="background: var(--c-after-wht)"></span>
                    {{ t('analyses.dividends_by_year.columns.after_withholding') }}
                  </label>
                  <input type="checkbox" class="btn-check" id="v-net" v-model="activeValues" value="net" />
                  <label class="btn btn-sm btn-value btn-value-net" for="v-net">
                    <span class="legend-dot" style="background: var(--c-net)"></span>
                    {{ t('analyses.dividends_by_year.columns.net') }}
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Inline loading spinner (also shown during reload) -->
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">{{ t('common.loading') }}</span>
          </div>
        </div>

        <!-- Data content — only when loaded and has rows -->
        <template v-else-if="allRows.length > 0">
          <!-- KPI row -->
          <div class="row g-3 mb-3">
            <div class="col-12 col-md-4">
              <div class="card h-100 kpi-card kpi-gross">
                <div class="card-body">
                  <div class="kpi-label">
                    <span class="kpi-swatch" style="background: var(--c-gross)"></span>
                    {{ t('analyses.charts.common.totalGross') }}
                  </div>
                  <div class="kpi-value num-tabular">{{ fmtMoney(kpis.totalGross) }}</div>
                  <div class="text-muted small">{{ filteredRows.length }} {{ t('analyses.charts.common.years') }}</div>
                </div>
              </div>
            </div>
            <div class="col-12 col-md-4">
              <div class="card h-100 kpi-card kpi-net">
                <div class="card-body">
                  <div class="kpi-label">
                    <span class="kpi-swatch" style="background: var(--c-net)"></span>
                    {{ t('analyses.charts.common.totalNet') }}
                  </div>
                  <div class="kpi-value num-tabular">{{ fmtMoney(kpis.totalNet) }}</div>
                  <div class="text-muted small">{{ t('analyses.charts.common.afterTaxes') }}</div>
                </div>
              </div>
            </div>
            <div class="col-12 col-md-4">
              <div class="card h-100 kpi-card kpi-after-wht">
                <div class="card-body">
                  <div class="kpi-label">
                    <span class="kpi-swatch" style="background: var(--c-after-wht)"></span>
                    {{ t('analyses.charts.common.bestYear') }}
                  </div>
                  <div class="kpi-value num-tabular">{{ kpis.bestYear?.year ?? '—' }}</div>
                  <div class="text-success small">{{ kpis.bestYear ? fmtMoney(kpis.bestYear.gross) : '—' }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Chart card -->
          <div class="card mb-3">
            <div class="card-header d-flex align-items-center justify-content-between">
              <span class="fw-medium">
                <i class="bi bi-bar-chart-line-fill me-2 text-primary"></i>
                {{ t('analyses.charts.dividends_by_year.chartTitle') }}
              </span>
              <div class="form-check form-switch mb-0">
                <input class="form-check-input" type="checkbox" id="trend-toggle" v-model="showTrend" />
                <label class="form-check-label small" for="trend-toggle">
                  <i class="bi bi-graph-up me-1"></i>{{ t('analyses.charts.common.trendLine') }}
                </label>
              </div>
            </div>
            <div class="card-body p-3">
              <v-chart ref="chartRef" class="dividend-chart" :option="chartOption" :update-options="{ replaceMerge: ['series'] }" autoresize />
            </div>
          </div>

          <!-- Options (collapsible) -->
          <div class="card mb-3">
            <div
              class="card-header d-flex align-items-center justify-content-between"
              style="cursor: pointer"
              data-bs-toggle="collapse"
              data-bs-target="#chart-options"
            >
              <span class="fw-medium">
                <i class="bi bi-sliders me-2 text-primary"></i>
                {{ t('analyses.charts.common.options') }}
              </span>
              <i class="bi bi-chevron-down text-muted small"></i>
            </div>
            <div id="chart-options" class="collapse">
              <div class="card-body">
                <div class="filter-label mb-2">{{ t('analyses.charts.common.display') }}</div>
                <div class="d-flex flex-wrap gap-3">
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="opt-grid" v-model="showGrid" />
                    <label class="form-check-label" for="opt-grid">{{ t('analyses.charts.common.gridLines') }}</label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="opt-labels" v-model="showLabels" />
                    <label class="form-check-label" for="opt-labels">{{ t('analyses.charts.common.valueLabels') }}</label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="opt-legend" v-model="showLegend" />
                    <label class="form-check-label" for="opt-legend">{{ t('analyses.charts.common.legend') }}</label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Table -->
          <div class="card">
            <div class="card-header d-flex align-items-center justify-content-between">
              <span class="fw-medium">
                <i class="bi bi-table me-2 text-primary"></i>
                {{ t('analyses.charts.dividends_by_year.tableTitle') }}
              </span>
              <span class="text-muted small">{{ t('analyses.charts.common.syncWithChart') }}</span>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover mb-0 dividend-table">
                  <thead>
                    <tr>
                      <th>{{ t('analyses.common.year') }}</th>
                      <th class="th-gross text-end">{{ t('analyses.dividends_by_year.columns.gross') }}</th>
                      <th class="th-after-wht text-end">{{ t('analyses.dividends_by_year.columns.after_withholding') }}</th>
                      <th class="th-net text-end">{{ t('analyses.dividends_by_year.columns.net') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in filteredRows" :key="row.year">
                      <td>
                        <strong>{{ row.year }}</strong>
                        <router-link
                          :to="{ name: 'analysisyearshare', query: { year: row.year } }"
                          class="ms-2 text-muted"
                          :title="t('analyses.charts.dividends_share_by_year.linkTitle')"
                        ><i class="bi bi-pie-chart"></i></router-link>
                      </td>
                      <td class="td-gross text-end num-tabular">{{ fmtMoney2(row.gross) }}</td>
                      <td class="td-after-wht text-end num-tabular">{{ fmtMoney2(row.afterWithholding) }}</td>
                      <td class="td-net text-end num-tabular">{{ fmtMoney2(row.net) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </template>
      </div>

      <GToast ref="toast" :_maxNumber="0" _placement="top-50 start-50 translate-middle" />
    </template>
  </TheMainLayout>
</template>

<script setup lang="ts">
import { use } from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import type { ComposeOption } from 'echarts/core'
import type { BarSeriesOption, LineSeriesOption } from 'echarts/charts'
import type { GridComponentOption, TooltipComponentOption, LegendComponentOption } from 'echarts/components'

use([BarChart, LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

type ECOption = ComposeOption<
  BarSeriesOption | LineSeriesOption | GridComponentOption | TooltipComponentOption | LegendComponentOption
>

import { getErrorCode } from '@/helper/errorCode'
import TheMainLayout from '@/layouts/TheMainLayout.vue'
import { useAnalysesStore } from '@/stores/analyses'
import { useDepotsStore } from '@/stores/depots'
import { useSettingsStore } from '@/stores/settings'
import { GToast, GToastDanger, GToastWarning } from 'goar-components'
import type { GToastContent } from 'goar-components'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

interface ChartRow {
  year: string
  gross: number
  afterWithholding: number
  net: number
  whtShare: number
}

const storeSettings = useSettingsStore()

const chartColors = computed(() => {
  const dark = storeSettings.uiMode === 'dark'
  return {
    label:     dark ? '#adb5bd' : '#495057',
    axisLabel: dark ? '#adb5bd' : '#495057',
    yLabel:    dark ? '#868e96' : '#6c757d',
    axisLine:  dark ? '#6c757d' : '#ced4da',
    splitLine: dark ? '#343a40' : '#eceff3',
  }
})

const cssVars = computed(() => ({
  '--c-gross': storeSettings.currentPalette.gross,
  '--c-after-wht': storeSettings.currentPalette.afterWithholding,
  '--c-net': storeSettings.currentPalette.net,
}))

const { t, locale } = useI18n()
const storeAnalyses = useAnalysesStore()
const storeDepots = useDepotsStore()
const toast = ref<InstanceType<typeof GToast> | null>(null)
const chartRef = ref<InstanceType<typeof VChart> | null>(null)
const loading = ref(false)

// --- Depot selection ---
const selectedDepotIds = ref<number[]>([])
const availableDepots = computed(() => storeDepots.getDepots)
const depotDropdownOpen = ref(false)
const depotDropdownEl = ref<HTMLElement | null>(null)

function toggleDepotDropdown() {
  depotDropdownOpen.value = !depotDropdownOpen.value
}

function handleDocumentClick(e: MouseEvent) {
  if (depotDropdownEl.value && !depotDropdownEl.value.contains(e.target as Node)) {
    depotDropdownOpen.value = false
  }
}

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
})

const depotFilterLabel = computed(() => {
  if (selectedDepotIds.value.length === 0) return t('analyses.charts.common.allDepots')
  if (selectedDepotIds.value.length === 1) {
    const depot = availableDepots.value.find((d) => d.ID === selectedDepotIds.value[0])
    return depot?.Name ?? t('analyses.charts.common.allDepots')
  }
  return t('analyses.charts.common.nDepots', { n: selectedDepotIds.value.length })
})

const pageTitle = computed(() => {
  const base = t('analyses.charts.dividends_by_year.title')
  return `${base} – ${depotFilterLabel.value}`
})

function toggleDepot(id: number) {
  if (selectedDepotIds.value.includes(id)) {
    selectedDepotIds.value = selectedDepotIds.value.filter((x) => x !== id)
  } else {
    selectedDepotIds.value = [...selectedDepotIds.value, id]
  }
  depotDropdownOpen.value = false
}

function clearDepotSelection() {
  selectedDepotIds.value = []
  depotDropdownOpen.value = false
}

watch(selectedDepotIds, () => {
  reloadChartData()
})

const rawData = computed(() => storeAnalyses.getCurrentChartData)

const allRows = computed<ChartRow[]>(() => {
  const data = rawData.value
  if (!data) return []
  const grossSeries = data.series.find((s) => s.key === 'gross')
  const afterWhtSeries = data.series.find((s) => s.key === 'after_withholding')
  const netSeries = data.series.find((s) => s.key === 'net')
  return data.categories.map((year, i) => {
    const gross = grossSeries?.values[i] ?? 0
    const afterWithholding = afterWhtSeries?.values[i] ?? 0
    const net = netSeries?.values[i] ?? 0
    return { year, gross, afterWithholding, net, whtShare: gross - afterWithholding }
  })
})

const currency = computed(() => rawData.value?.series[0]?.currency ?? '')
const availableYears = computed(() => allRows.value.map((r) => r.year))

// --- Filter state ---
const preset = ref('5y')
const yearFrom = ref('')
const yearTo = ref('')
const activeValues = ref<string[]>(['gross', 'after_withholding', 'net'])
const showTrend = ref(false)
const showGrid = ref(true)
const showLabels = ref(true)
const showLegend = ref(true)

const presets = [
  { key: '3y', labelKey: 'analyses.charts.common.preset3y' },
  { key: '5y', labelKey: 'analyses.charts.common.preset5y' },
  { key: '10y', labelKey: 'analyses.charts.common.preset10y' },
  { key: 'all', labelKey: 'analyses.charts.common.presetAll' },
]

watch(
  allRows,
  (rows) => {
    if (rows.length > 0 && yearFrom.value === '') {
      applyPreset('5y')
    }
  },
  { immediate: true },
)

function applyPreset(key: string) {
  preset.value = key
  const years = availableYears.value
  if (years.length === 0) return
  const maxY = years[years.length - 1]
  const minY = years[0]
  if (key === '3y') yearFrom.value = years[Math.max(0, years.length - 3)]
  else if (key === '5y') yearFrom.value = years[Math.max(0, years.length - 5)]
  else if (key === '10y') yearFrom.value = years[Math.max(0, years.length - 10)]
  else if (key === 'all') yearFrom.value = minY
  yearTo.value = maxY
}

function onYearChange() {
  const years = availableYears.value
  if (years.indexOf(yearFrom.value) > years.indexOf(yearTo.value)) {
    yearTo.value = yearFrom.value
  }
  preset.value = 'custom'
}

const filteredRows = computed(() =>
  allRows.value.filter((r) => r.year >= yearFrom.value && r.year <= yearTo.value),
)

// --- KPIs ---
const kpis = computed(() => {
  const rows = filteredRows.value
  if (rows.length === 0) return { totalGross: 0, totalNet: 0, bestYear: null }
  const totalGross = rows.reduce((s, r) => s + r.gross, 0)
  const totalNet = rows.reduce((s, r) => s + r.net, 0)
  const bestYear = rows.slice().sort((a, b) => b.gross - a.gross)[0]
  return { totalGross, totalNet, bestYear }
})

// --- Formatting ---
const fmtLocale = computed(() => (locale.value.startsWith('de') ? 'de-DE' : 'en-US'))

function fmtMoney(n: number) {
  return new Intl.NumberFormat(fmtLocale.value, {
    style: 'currency',
    currency: currency.value || 'EUR',
    maximumFractionDigits: 0,
  }).format(n)
}

function fmtMoney2(n: number) {
  return new Intl.NumberFormat(fmtLocale.value, {
    style: 'currency',
    currency: currency.value || 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

function fmtPct(n: number) {
  return new Intl.NumberFormat(fmtLocale.value, {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(n)
}

function fmtShort(n: number) {
  if (n >= 1000)
    return new Intl.NumberFormat(fmtLocale.value, { maximumFractionDigits: 1 }).format(n / 1000) + ' k'
  return new Intl.NumberFormat(fmtLocale.value, { maximumFractionDigits: 0 }).format(n)
}

// --- Chart option ---
const chartOption = computed<ECOption>(() => {
  const rows = filteredRows.value
  const xData = rows.map((r) => r.year)
  const series: (BarSeriesOption | LineSeriesOption)[] = []

  function addBar(key: string, name: string, color: string, dataKey: keyof ChartRow) {
    if (!activeValues.value.includes(key)) return
    series.push({
      id: key,
      name,
      type: 'bar',
      universalTransition: true,
      data: rows.map((r) => r[dataKey] as number),
      barMaxWidth: 48,
      itemStyle: { color, borderRadius: [3, 3, 0, 0] },
      label: {
        show: showLabels.value,
        position: 'top',
        formatter: (p: { value: number }) => fmtShort(p.value),
        fontSize: 11,
        color: chartColors.value.label,
      },
    })
  }

  const pal = storeSettings.currentPalette
  addBar('gross', t('analyses.dividends_by_year.columns.gross'), pal.gross, 'gross')
  addBar('after_withholding', t('analyses.dividends_by_year.columns.after_withholding'), pal.afterWithholding, 'afterWithholding')
  addBar('net', t('analyses.dividends_by_year.columns.net'), pal.net, 'net')

  if (showTrend.value && activeValues.value.length > 0) {
    const refKey = ['gross', 'after_withholding', 'net'].find((k) => activeValues.value.includes(k))!
    const refColor = refKey === 'gross' ? pal.gross : refKey === 'after_withholding' ? pal.afterWithholding : pal.net
    const dataKey: keyof ChartRow = refKey === 'after_withholding' ? 'afterWithholding' : (refKey as keyof ChartRow)
    series.push({
      name: 'Trend',
      type: 'line',
      smooth: false,
      symbol: 'circle',
      symbolSize: 6,
      z: 10,
      data: rows.map((r) => r[dataKey] as number),
      lineStyle: { width: 2, color: refColor },
      itemStyle: { color: refColor, borderColor: '#fff', borderWidth: 1.5 },
      label: { show: false },
    })
  }

  return {
    animationDuration: 400,
    animationDurationUpdate: 400,
    grid: { left: 60, right: 16, top: 48, bottom: 40, containLabel: true },
    legend: {
      show: showLegend.value,
      top: 4,
      left: 'center',
      icon: 'roundRect',
      itemWidth: 12,
      itemHeight: 12,
      textStyle: { color: chartColors.value.label, fontSize: 12 },
      data: series.filter((s) => s.name !== 'Trend').map((s) => s.name as string),
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'none' },
      backgroundColor: '#212529',
      borderColor: '#212529',
      textStyle: { color: '#fff', fontSize: 12 },
      padding: [10, 12],
      formatter(params: unknown) {
        const ps = params as Array<{ axisValueLabel: string; seriesName: string; color: string; value: number }>
        if (!ps?.length) return ''
        const year = ps[0].axisValueLabel
        const row = filteredRows.value.find((r) => r.year === year)
        if (!row) return ''
        const lines = ps
          .filter((p) => p.seriesName !== 'Trend')
          .map(
            (p) =>
              `<div style="display:flex;align-items:center;gap:8px;margin-top:3px">` +
              `<span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${p.color}"></span>` +
              `<span style="min-width:130px;color:#ced4da">${p.seriesName}</span>` +
              `<strong style="margin-left:auto">${fmtMoney2(p.value)}</strong>` +
              `</div>`,
          )
          .join('')
        const qstPct = row.gross > 0 ? row.whtShare / row.gross : 0
        return (
          `<div style="font-weight:600;font-size:13px;margin-bottom:4px">${t('analyses.common.year')} ${year}</div>` +
          lines +
          `<hr style="border-color:#495057;margin:6px 0 4px"/>` +
          `<div style="font-size:11px;color:#adb5bd">${t('analyses.charts.common.whtShare')}: ${fmtMoney2(row.whtShare)} (${fmtPct(qstPct)})</div>`
        )
      },
    },
    xAxis: {
      type: 'category',
      data: xData,
      axisPointer: {
        show: true,
        type: 'shadow',
        z: 0,
        shadowStyle: { color: 'rgba(13,17,23,0.04)' },
        label: { show: false },
      } as never,
      axisLine: { lineStyle: { color: chartColors.value.axisLine } },
      axisTick: { show: false },
      axisLabel: { color: chartColors.value.axisLabel, fontSize: 12 },
    },
    yAxis: {
      type: 'value',
      splitLine: { show: showGrid.value, lineStyle: { color: chartColors.value.splitLine } },
      axisLabel: {
        color: chartColors.value.yLabel,
        fontSize: 11,
        formatter: (v: number) => fmtShort(v),
      },
    },
    series,
  }
})

// --- Export ---
function exportPng() {
  const instance = (chartRef.value as unknown as { getDataURL?: (opts: object) => string })
  const url = instance?.getDataURL?.({ pixelRatio: 2, backgroundColor: '#ffffff' })
  if (!url) return
  const a = document.createElement('a')
  a.href = url
  a.download = `dividenden_pro_jahr_${yearFrom.value}-${yearTo.value}.png`
  a.click()
}

function exportCsv() {
  const rows = filteredRows.value
  const sep = ';'
  const header = [
    t('analyses.common.year'),
    t('analyses.dividends_by_year.columns.gross'),
    t('analyses.dividends_by_year.columns.after_withholding'),
    t('analyses.dividends_by_year.columns.net'),
  ].join(sep)
  const lines = [
    header,
    ...rows.map((r) =>
      [
        r.year,
        r.gross.toFixed(2).replace('.', ','),
        r.afterWithholding.toFixed(2).replace('.', ','),
        r.net.toFixed(2).replace('.', ','),
      ].join(sep),
    ),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `dividenden_pro_jahr_${yearFrom.value}-${yearTo.value}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// --- Fetch ---
function reloadChartData() {
  loading.value = true
  yearFrom.value = ''
  yearTo.value = ''
  const ids = selectedDepotIds.value.length > 0 ? selectedDepotIds.value : undefined
  storeAnalyses
    .fetchDividendsByYearChartData(ids)
    .then(() => {
      if (allRows.value.length === 0) {
        toast.value?.addToast({
          ...GToastWarning,
          title: t('analyses.common.errorTitle'),
          content: t('analyses.common.empty'),
        } as GToastContent)
      }
    })
    .catch((requestError: unknown) => {
      const code = getErrorCode(requestError)
      const content =
        code === 'ANALYSIS_MULTIPLE_BASE_CURRENCIES'
          ? t('analyses.charts.errors.multipleCurrencies')
          : t('analyses.errors.loadFailed')
      toast.value?.addToast({
        ...GToastDanger,
        title: t('analyses.common.errorTitle'),
        content,
      } as GToastContent)
    })
    .finally(() => {
      loading.value = false
    })
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  storeDepots.fetchDepots().catch(() => {})
  reloadChartData()
})
</script>

<style scoped>
.kpi-card {
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
}
.kpi-gross { border-top: 3px solid var(--c-gross); }
.kpi-after-wht { border-top: 3px solid var(--c-after-wht); }
.kpi-net { border-top: 3px solid var(--c-net); }

.kpi-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--bs-secondary-color, #6c757d);
  margin-bottom: 4px;
}
.kpi-swatch {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}
.kpi-value {
  font-size: 1.35rem;
  font-weight: 600;
}

.filter-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--bs-secondary-color, #6c757d);
  margin-bottom: 4px;
}

.legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  vertical-align: middle;
  margin-right: 5px;
}

/* Value toggle buttons — tinted when active */
.btn-value { --bs-btn-color: #495057; --bs-btn-border-color: #dde1e6; --bs-btn-bg: #fff; }
.btn-check:checked + .btn-value-gross    { background: color-mix(in oklab, var(--c-gross) 14%, #fff);     border-color: var(--c-gross);     color: color-mix(in oklab, var(--c-gross) 70%, #212529); }
.btn-check:checked + .btn-value-after-wht { background: color-mix(in oklab, var(--c-after-wht) 14%, #fff); border-color: var(--c-after-wht); color: color-mix(in oklab, var(--c-after-wht) 70%, #212529); }
.btn-check:checked + .btn-value-net      { background: color-mix(in oklab, var(--c-net) 14%, #fff);       border-color: var(--c-net);       color: color-mix(in oklab, var(--c-net) 70%, #212529); }

.dividend-chart { height: 440px; }

.depot-dropdown { min-width: 260px; max-height: 320px; overflow-y: auto; }

/* Table header tints */
.dividend-table th { font-size: 0.875rem; }
.dividend-table td { font-size: 0.875rem; padding: 0.45rem 0.75rem; }
.th-gross    { background: color-mix(in oklab, var(--c-gross) 10%, #fff);     color: color-mix(in oklab, var(--c-gross) 75%, #212529);     border-bottom: 2px solid var(--c-gross) !important; }
.th-after-wht { background: color-mix(in oklab, var(--c-after-wht) 10%, #fff); color: color-mix(in oklab, var(--c-after-wht) 75%, #212529); border-bottom: 2px solid var(--c-after-wht) !important; }
.th-net      { background: color-mix(in oklab, var(--c-net) 10%, #fff);       color: color-mix(in oklab, var(--c-net) 75%, #212529);       border-bottom: 2px solid var(--c-net) !important; }
.td-gross    { box-shadow: inset 3px 0 0 color-mix(in oklab, var(--c-gross) 20%, transparent); }
.td-after-wht { box-shadow: inset 3px 0 0 color-mix(in oklab, var(--c-after-wht) 20%, transparent); }
.td-net      { box-shadow: inset 3px 0 0 color-mix(in oklab, var(--c-net) 20%, transparent); }
</style>
