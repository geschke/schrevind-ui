<template>
  <TheMainLayout>
    <template #default>
      <div class="col-12">
        <!-- Header -->
        <div class="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-3">
          <div>
            <h2 class="mb-1">{{ t('analyses.charts.dividends_share_by_month.title') }}</h2>
            <p class="text-muted mb-0 small">{{ t('analyses.charts.dividends_share_by_month.description') }}</p>
          </div>
          <div class="d-flex align-items-center gap-2 flex-wrap">
            <span v-if="currency" class="badge rounded-pill text-bg-light border">
              <i class="bi bi-cash-coin me-1"></i>{{ t('analyses.charts.common.baseCurrency') }}: <strong>{{ currency }}</strong>
            </span>
            <div class="dropdown">
              <button class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown" type="button" :disabled="sortedRows.length === 0">
                <i class="bi bi-download me-1"></i>{{ t('analyses.charts.common.export') }}
              </button>
              <ul class="dropdown-menu dropdown-menu-end">
                <li>
                  <a class="dropdown-item" href="#" @click.prevent="exportPng">
                    <i class="bi bi-image me-2"></i>PNG
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Filter card -->
        <div class="card mb-3">
          <div class="card-body py-2">
            <div class="d-flex flex-wrap align-items-end gap-3">
              <!-- Year dropdown -->
              <div>
                <div class="filter-label">{{ t('analyses.charts.dividends_share_by_month.filterYear') }}</div>
                <select
                  class="form-select form-select-sm"
                  v-model="selectedYear"
                  @change="loadData"
                  :disabled="availableYears.length === 0 || loading"
                >
                  <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
                </select>
              </div>

              <!-- Month buttons (single select) -->
              <div>
                <div class="filter-label">{{ t('analyses.charts.dividends_share_by_month.filterMonth') }}</div>
                <div class="btn-group flex-wrap" role="group">
                  <button
                    v-for="m in ALL_MONTHS"
                    :key="m"
                    type="button"
                    class="btn btn-sm"
                    :class="selectedMonth === m ? 'btn-secondary' : 'btn-outline-secondary'"
                    @click="onMonthClick(m)"
                    :disabled="loading"
                  >{{ monthName(m) }}</button>
                </div>
              </div>

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

              <!-- Value toggle + amounts toggle -->
              <div class="ms-auto d-flex align-items-end gap-2">
                <div>
                  <div class="filter-label">{{ t('analyses.charts.common.valueAmounts') }}</div>
                  <button
                    type="button"
                    class="btn btn-sm"
                    :class="showAmounts ? 'btn-secondary' : 'btn-outline-secondary'"
                    @click="showAmounts = !showAmounts"
                    :title="t('analyses.charts.common.valueAmounts')"
                  >
                    <i class="bi" :class="showAmounts ? 'bi-eye-fill' : 'bi-eye-slash'"></i>
                  </button>
                </div>
                <div>
                  <div class="filter-label">{{ t('analyses.charts.common.values') }}</div>
                  <div class="btn-group" role="group">
                    <input type="radio" class="btn-check" id="share-val-gross" v-model="activeValue" value="gross" />
                    <label class="btn btn-sm btn-outline-secondary" for="share-val-gross">{{ t('analyses.dividends_by_year.columns.gross') }}</label>
                    <input type="radio" class="btn-check" id="share-val-after" v-model="activeValue" value="after_withholding" />
                    <label class="btn btn-sm btn-outline-secondary" for="share-val-after">{{ t('analyses.dividends_by_year.columns.after_withholding') }}</label>
                    <input type="radio" class="btn-check" id="share-val-net" v-model="activeValue" value="net" />
                    <label class="btn btn-sm btn-outline-secondary" for="share-val-net">{{ t('analyses.dividends_by_year.columns.net') }}</label>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- Spinner -->
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">{{ t('common.loading') }}</span>
          </div>
        </div>

        <!-- Error -->
        <div v-else-if="errorMsg" class="alert alert-danger" role="alert">{{ errorMsg }}</div>

        <!-- No data -->
        <div v-else-if="data !== null && sortedRows.length === 0" class="alert alert-info" role="alert">
          {{ t('analyses.charts.dividends_share_by_month.noData') }}
        </div>

        <!-- Chart + options + table -->
        <template v-else-if="sortedRows.length > 0">
          <!-- Chart -->
          <div class="card mb-3">
            <div class="card-header">
              <span class="fw-medium">
                <i class="bi bi-pie-chart-fill me-2 text-primary"></i>
                {{ t('analyses.charts.dividends_share_by_month.chartTitle') }}
              </span>
            </div>
            <div class="card-body p-3">
              <div class="chart-wrapper">
                <v-chart ref="chartRef" class="share-chart" :option="chartOption" autoresize />
                <div v-if="sortedRows.length > 0 && showAmounts" class="donut-center" :style="donutCenterStyle">
                  <div class="donut-center-amount">{{ totalAmountDisplay }} {{ currency }}</div>
                  <div class="donut-center-label">{{ t('analyses.charts.dividends_share_by_month.centerTotal') }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Options (collapsible) -->
          <div class="card mb-3">
            <div
              class="card-header d-flex align-items-center justify-content-between"
              style="cursor: pointer"
              data-bs-toggle="collapse"
              data-bs-target="#share-chart-options"
            >
              <span class="fw-medium">
                <i class="bi bi-sliders me-2 text-primary"></i>{{ t('analyses.charts.common.options') }}
              </span>
              <i class="bi bi-chevron-down text-muted small"></i>
            </div>
            <div id="share-chart-options" class="collapse">
              <div class="card-body">
                <div class="filter-label mb-2">{{ t('analyses.charts.common.display') }}</div>
                <div class="d-flex flex-wrap gap-3">
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="share-opt-labels" v-model="showLabels" />
                    <label class="form-check-label" for="share-opt-labels">{{ t('analyses.charts.common.valueLabels') }}</label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="share-opt-legend" v-model="showLegend" />
                    <label class="form-check-label" for="share-opt-legend">{{ t('analyses.charts.common.legend') }}</label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Table -->
          <div class="card">
            <div class="card-header">
              <span class="fw-medium">
                <i class="bi bi-table me-2 text-primary"></i>
                {{ t('analyses.charts.dividends_share_by_month.tableTitle') }}
              </span>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>{{ t('analyses.charts.dividends_share_by_month.tableColSecurity') }}</th>
                      <th class="text-end">{{ t('analyses.charts.dividends_share_by_month.tableColAmount') }} ({{ currency }})</th>
                      <th class="text-end">{{ t('analyses.charts.dividends_share_by_month.tableColShare') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, idx) in sortedRows" :key="row.security_id">
                      <td>
                        <span class="security-dot" :style="{ background: pieColor(idx) }"></span>
                        {{ row.security_name }}
                        <small v-if="row.security_isin" class="text-muted ms-1">{{ row.security_isin }}</small>
                      </td>
                      <td class="text-end num-tabular">{{ getAmountValue(row) }}</td>
                      <td class="text-end num-tabular">{{ fmtPct(getPctValue(row)) }}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="fw-semibold table-secondary">
                      <td>{{ t('analyses.common.total') }}</td>
                      <td class="text-end num-tabular">{{ totalAmountDisplay }} {{ currency }}</td>
                      <td class="text-end num-tabular">{{ fmtPct(totalPct) }}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </template>
      </div>

      <GToast ref="toast" />
    </template>
  </TheMainLayout>
</template>

<script setup lang="ts">
import { use } from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import type { ComposeOption } from 'echarts/core'
import type { PieSeriesOption } from 'echarts/charts'
import type { TooltipComponentOption, LegendComponentOption } from 'echarts/components'

use([PieChart, TooltipComponent, LegendComponent, CanvasRenderer])

type ECOption = ComposeOption<PieSeriesOption | TooltipComponentOption | LegendComponentOption>

import TheMainLayout from '@/layouts/TheMainLayout.vue'
import { useAnalysesStore } from '@/stores/analyses'
import { useDepotsStore } from '@/stores/depots'
import { useDividendEntriesStore } from '@/stores/dividendEntries'
import type { TimeRange } from '@/stores/dividendEntries'
import { useSettingsStore } from '@/stores/settings'
import type { ShareByMonthChartData, ShareByMonthChartRow } from '@/types/analyses'
import { getErrorCode } from '@/helper/errorCode'
import { GToast, GToastDanger } from 'goar-components'
import type { GToastContent } from 'goar-components'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const ALL_MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']

const { t, locale } = useI18n()
const route = useRoute()
const storeAnalyses = useAnalysesStore()
const storeDepots = useDepotsStore()
const storeDividendEntries = useDividendEntriesStore()
const storeSettings = useSettingsStore()

const chartRef = ref<InstanceType<typeof VChart> | null>(null)
const toast = ref<InstanceType<typeof GToast> | null>(null)

const loading = ref(false)
const errorMsg = ref('')
const data = ref<ShareByMonthChartData | null>(null)
const timeRange = ref<TimeRange | null>(null)

const selectedYear = ref(new Date().getFullYear())
const selectedMonth = ref(String(new Date().getMonth() + 1).padStart(2, '0'))
const selectedDepotIds = ref<number[]>([])
const activeValue = ref<'gross' | 'after_withholding' | 'net'>('gross')

const showLabels = ref(true)
const showAmounts = ref(true)
const showLegend = ref(true)

const availableYears = computed<number[]>(() => {
  if (!timeRange.value || timeRange.value.first_year === 0) return []
  const years: number[] = []
  for (let y = timeRange.value.last_year; y >= timeRange.value.first_year; y--) {
    years.push(y)
  }
  return years
})

const availableDepots = computed(() => storeDepots.getDepots)
const depotDropdownOpen = ref(false)
const depotDropdownEl = ref<HTMLElement | null>(null)

const depotFilterLabel = computed(() => {
  if (selectedDepotIds.value.length === 0) return t('analyses.charts.common.allDepots')
  if (selectedDepotIds.value.length === 1) {
    const depot = availableDepots.value.find((d) => d.ID === selectedDepotIds.value[0])
    return depot?.Name ?? t('analyses.charts.common.allDepots')
  }
  return t('analyses.charts.common.nDepots', { n: selectedDepotIds.value.length })
})

function toggleDepotDropdown() {
  depotDropdownOpen.value = !depotDropdownOpen.value
}

function handleDocumentClick(e: MouseEvent) {
  if (depotDropdownEl.value && !depotDropdownEl.value.contains(e.target as Node)) {
    depotDropdownOpen.value = false
  }
}

function toggleDepot(id: number) {
  if (selectedDepotIds.value.includes(id)) {
    selectedDepotIds.value = selectedDepotIds.value.filter((x) => x !== id)
  } else {
    selectedDepotIds.value = [...selectedDepotIds.value, id]
  }
  depotDropdownOpen.value = false
  loadData()
}

function clearDepotSelection() {
  selectedDepotIds.value = []
  depotDropdownOpen.value = false
  loadData()
}

function onMonthClick(m: string) {
  selectedMonth.value = m
  loadData()
}

const sortedRows = computed<ShareByMonthChartRow[]>(() => {
  if (!data.value) return []
  const rows = [...data.value.rows]
  if (activeValue.value === 'gross') return rows.sort((a, b) => b.gross_pct - a.gross_pct)
  if (activeValue.value === 'after_withholding') return rows.sort((a, b) => b.after_withholding_pct - a.after_withholding_pct)
  return rows.sort((a, b) => b.net_pct - a.net_pct)
})

type ChartItem =
  | { type: 'row'; row: ShareByMonthChartRow }
  | { type: 'others'; count: number; pct: number }

const chartItems = computed<ChartItem[]>(() => {
  const rows = sortedRows.value
  if (!rows.length) return []

  const sorted = [...rows].sort((a, b) => getPctValue(b) - getPctValue(a))
  let main = sorted.filter(r => getPctValue(r) >= 1.0)
  const others = sorted.filter(r => getPctValue(r) < 1.0)

  while (main.length > 20) {
    others.push(main.pop()!)
  }

  const result: ChartItem[] = main.map(r => ({ type: 'row' as const, row: r }))
  if (others.length > 0) {
    result.push({ type: 'others' as const, count: others.length, pct: others.reduce((s, r) => s + getPctValue(r), 0) })
  }
  return result
})

function getPctValue(row: ShareByMonthChartRow): number {
  if (activeValue.value === 'gross') return row.gross_pct
  if (activeValue.value === 'after_withholding') return row.after_withholding_pct
  return row.net_pct
}

function getAmountValue(row: ShareByMonthChartRow): string {
  if (activeValue.value === 'gross') return row.gross
  if (activeValue.value === 'after_withholding') return row.after_withholding
  return row.net
}

const currency = computed(() => data.value?.currency ?? '')
const fmtLocale = computed(() => (locale.value.startsWith('de') ? 'de-DE' : 'en-US'))

function fmtMoney2(n: number): string {
  return new Intl.NumberFormat(fmtLocale.value, {
    style: 'currency',
    currency: currency.value || 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

function fmtPct(n: number): string {
  return n.toFixed(1) + '%'
}

function parseLocalizedAmount(val: string): number {
  if (!val) return 0
  const s = val.replace(/[^\d,.-]/g, '')
  if (!s) return 0
  const lastComma = s.lastIndexOf(',')
  const lastDot = s.lastIndexOf('.')
  if (lastComma > lastDot) {
    return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0
  }
  return parseFloat(s.replace(/,/g, '')) || 0
}

function getTotalsValue(): string {
  const totals = data.value?.totals
  if (!totals) return ''
  if (activeValue.value === 'gross') return totals.gross
  if (activeValue.value === 'after_withholding') return totals.after_withholding
  return totals.net
}

const totalAmountDisplay = computed(() => {
  if (!data.value || sortedRows.value.length === 0) return '–'
  const raw = getTotalsValue()
  if (raw) return raw
  return fmtMoney2(sortedRows.value.reduce((sum, r) => sum + parseLocalizedAmount(getAmountValue(r)), 0))
})

const totalPct = computed(() => sortedRows.value.reduce((sum, r) => sum + getPctValue(r), 0))

const donutCenterStyle = computed(() => ({
  left: '50%',
  top: showLegend.value ? '36%' : '50%',
}))

function pieColor(idx: number): string {
  const colors = storeSettings.currentPalette.yearColors as string[]
  return colors[idx % colors.length] ?? '#888888'
}

const chartColors = computed(() => {
  const dark = storeSettings.uiMode === 'dark'
  return {
    label: dark ? '#adb5bd' : '#495057',
    yLabel: dark ? '#868e96' : '#6c757d',
  }
})

function monthName(m: string): string {
  return new Date(2020, parseInt(m) - 1, 1).toLocaleDateString(fmtLocale.value, { month: 'short' })
}

const chartOption = computed<ECOption>(() => {
  const cRows = chartItems.value
  if (!cRows.length) return {}

  const colors = storeSettings.currentPalette.yearColors as string[]
  const _showAmounts = showAmounts.value
  const _showLegend = showLegend.value
  const othersLabel = t('analyses.charts.dividends_share_by_month.others')

  const seriesData = cRows.map((item, idx) => {
    if (item.type === 'others') {
      return { name: othersLabel, value: item.pct, itemStyle: { color: '#9e9e9e' } }
    }
    return {
      name: item.row.security_name,
      value: getPctValue(item.row),
      itemStyle: { color: colors[idx % colors.length] },
    }
  })

  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: '#212529',
      borderColor: '#212529',
      textStyle: { color: '#fff', fontSize: 12 },
      padding: [10, 12],
      formatter: (params: unknown) => {
        const p = params as { name: string; color: string; value: number; dataIndex: number }
        const item = cRows[p.dataIndex]
        if (!item) return ''
        if (item.type === 'others') {
          return (
            `<div style="font-weight:600;font-size:13px;margin-bottom:6px">${p.name} (${item.count})</div>` +
            `<div style="display:flex;align-items:center;gap:8px">` +
            `<span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${p.color}"></span>` +
            `<strong style="margin-left:auto">${fmtPct(item.pct)}</strong>` +
            `</div>` +
            `<div style="color:#868e96;font-size:11px;margin-top:6px">${t('analyses.charts.dividends_share_by_month.othersHint')}</div>`
          )
        }
        const row = item.row
        return (
          `<div style="font-weight:600;font-size:13px;margin-bottom:6px">${p.name}</div>` +
          `<div style="display:flex;align-items:center;gap:8px">` +
          `<span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${p.color}"></span>` +
          `<span style="color:#ced4da">${getAmountValue(row)} ${currency.value}</span>` +
          `<strong style="margin-left:auto">${fmtPct(p.value)}</strong>` +
          `</div>`
        )
      },
    },
    legend: {
      show: _showLegend,
      orient: 'horizontal',
      top: '75%',
      left: 'center',
      icon: 'roundRect',
      itemWidth: 12,
      itemHeight: 12,
      textStyle: { color: chartColors.value.label, fontSize: 11 },
    },
    series: [
      {
        type: 'pie',
        radius: _showLegend ? ['30%', '52%'] : ['37%', '65%'],
        center: ['50%', _showLegend ? '36%' : '50%'],
        data: seriesData,
        minAngle: 3,
        label: {
          show: showLabels.value,
          formatter: (params: unknown) => {
            const p = params as { name: string; dataIndex: number }
            const item = cRows[p.dataIndex]
            if (!item) return p.name
            if (item.type === 'others') {
              return `${othersLabel} (${item.count}): ${fmtPct(item.pct)}`
            }
            const row = item.row
            const pct = fmtPct(getPctValue(row))
            if (_showAmounts) {
              return `${row.security_name}: ${getAmountValue(row)} ${currency.value} (${pct})`
            }
            return `${row.security_name} (${pct})`
          },
          color: chartColors.value.label,
          fontSize: 11,
        },
        labelLine: {
          show: showLabels.value,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0,0,0,0.3)',
          },
        },
      },
    ],
  }
})

function exportPng() {
  const instance = chartRef.value as unknown as { getDataURL?: (opts: object) => string }
  const url = instance?.getDataURL?.({ pixelRatio: 2, backgroundColor: '#ffffff' })
  if (!url) return
  const a = document.createElement('a')
  a.href = url
  a.download = `dividenden_anteile_${selectedYear.value}_${selectedMonth.value}.png`
  a.click()
}

function loadData() {
  if (!selectedYear.value || !selectedMonth.value) return
  loading.value = true
  errorMsg.value = ''
  const ids = selectedDepotIds.value.length > 0 ? selectedDepotIds.value : undefined
  storeAnalyses
    .fetchShareByMonthChart(selectedYear.value, selectedMonth.value, ids)
    .then((result) => {
      data.value = result
    })
    .catch((requestError: unknown) => {
      const code = getErrorCode(requestError)
      errorMsg.value =
        code === 'ANALYSIS_MULTIPLE_BASE_CURRENCIES'
          ? t('analyses.charts.errors.multipleCurrencies')
          : t('analyses.errors.loadFailed')
      toast.value?.addToast({
        ...GToastDanger,
        title: t('analyses.common.errorTitle'),
        content: errorMsg.value,
      } as GToastContent)
    })
    .finally(() => {
      loading.value = false
    })
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  Promise.all([storeDepots.fetchDepots(), storeDividendEntries.fetchTimeRange()])
    .then(([, range]) => {
      timeRange.value = range
      const qYear = route.query.year ? Number(route.query.year) : null
      const qMonthRaw = route.query.month ? String(route.query.month) : null
      const qMonth = qMonthRaw ? qMonthRaw.padStart(2, '0') : null
      selectedYear.value = qYear && availableYears.value.includes(qYear) ? qYear : range.current_year
      selectedMonth.value = qMonth && ALL_MONTHS.includes(qMonth) ? qMonth : String(range.current_month).padStart(2, '0')
      loadData()
    })
    .catch(() => {
      errorMsg.value = t('analyses.errors.loadFailed')
    })
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<style scoped>
.filter-label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--bs-secondary-color, #6c757d);
  margin-bottom: 4px;
}

.depot-dropdown {
  min-width: 220px;
}

.chart-wrapper {
  position: relative;
}

.share-chart {
  height: 600px;
}

.donut-center {
  position: absolute;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
}

.donut-center-amount {
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  color: var(--bs-body-color);
}

.donut-center-label {
  font-size: 11px;
  white-space: nowrap;
  color: var(--bs-secondary-color);
}

.security-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
  flex-shrink: 0;
}
</style>
