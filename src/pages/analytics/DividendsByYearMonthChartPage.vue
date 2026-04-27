<template>
  <TheMainLayout>
    <template #default>
      <div class="col-12">
        <!-- Page header -->
        <div class="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-3">
          <div>
            <h2 class="mb-1">{{ pageTitle }}</h2>
            <p class="text-muted mb-0 small">{{ t('analyses.charts.dividends_by_year_month.description') }}</p>
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

        <!-- Filter card — always visible -->
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

              <!-- Year quick select -->
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

              <!-- Value toggle -->
              <div class="ms-auto">
                <div class="filter-label">{{ t('analyses.charts.common.values') }}</div>
                <div class="btn-group" role="group">
                  <input type="radio" class="btn-check" id="val-gross" v-model="activeValue" value="gross" />
                  <label class="btn btn-sm btn-outline-secondary" for="val-gross">{{ t('analyses.dividends_by_year.columns.gross') }}</label>
                  <input type="radio" class="btn-check" id="val-after" v-model="activeValue" value="after_withholding" />
                  <label class="btn btn-sm btn-outline-secondary" for="val-after">{{ t('analyses.dividends_by_year.columns.after_withholding') }}</label>
                  <input type="radio" class="btn-check" id="val-net" v-model="activeValue" value="net" />
                  <label class="btn btn-sm btn-outline-secondary" for="val-net">{{ t('analyses.dividends_by_year.columns.net') }}</label>
                </div>
              </div>
            </div>

            <!-- Month filter row -->
            <div class="d-flex flex-wrap align-items-center gap-2 mt-2 pt-2 border-top">
              <div class="filter-label">{{ t('analyses.charts.dividends_by_year_month.filterMonths') }}</div>
              <div class="btn-group flex-wrap" role="group">
                <button
                  v-for="m in ALL_MONTHS"
                  :key="m"
                  type="button"
                  class="btn btn-sm"
                  :class="selectedMonths.includes(m) ? 'btn-secondary' : 'btn-outline-secondary'"
                  @click="onMonthClick(m)"
                >{{ monthName(m) }}</button>
              </div>
              <div class="d-flex gap-1 ms-1">
                <button
                  type="button"
                  class="btn btn-sm"
                  :class="multiSelectMode ? 'btn-secondary' : 'btn-outline-secondary'"
                  @click="multiSelectMode = !multiSelectMode"
                  :title="t('analyses.charts.dividends_by_year_month.multiSelect')"
                ><i class="bi bi-ui-checks"></i></button>
                <button
                  type="button"
                  class="btn btn-sm filter-btn"
                  :class="filterActive ? 'btn-outline-danger' : 'btn-outline-secondary'"
                  @click="resetMonthFilter"
                  :disabled="!filterActive"
                  :title="t('analyses.charts.dividends_by_year_month.resetFilter')"
                ><i class="bi" :class="filterActive ? 'bi-funnel-fill' : 'bi-funnel'"></i></button>
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

        <!-- Data content -->
        <template v-else-if="filteredRows.length > 0">
          <!-- Chart -->
          <div class="card mb-3">
            <div class="card-header">
              <span class="fw-medium">
                <i class="bi bi-bar-chart-line-fill me-2 text-primary"></i>
                {{ t('analyses.charts.dividends_by_year_month.chartTitle') }}
              </span>
            </div>
            <div class="card-body p-3">
              <v-chart ref="chartRef" class="dividend-chart" :option="chartOption" :update-options="{ replaceMerge: ['series'] }" autoresize />
            </div>
          </div>

          <!-- Options -->
          <div class="card mb-3">
            <div
              class="card-header d-flex align-items-center justify-content-between"
              style="cursor: pointer"
              data-bs-toggle="collapse"
              data-bs-target="#month-chart-options"
            >
              <span class="fw-medium">
                <i class="bi bi-sliders me-2 text-primary"></i>{{ t('analyses.charts.common.options') }}
              </span>
              <i class="bi bi-chevron-down text-muted small"></i>
            </div>
            <div id="month-chart-options" class="collapse">
              <div class="card-body">
                <div class="filter-label mb-2">{{ t('analyses.charts.common.display') }}</div>
                <div class="d-flex flex-wrap gap-3">
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="mc-opt-grid" v-model="showGrid" />
                    <label class="form-check-label" for="mc-opt-grid">{{ t('analyses.charts.common.gridLines') }}</label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="mc-opt-labels" v-model="showLabels" />
                    <label class="form-check-label" for="mc-opt-labels">{{ t('analyses.charts.common.valueLabels') }}</label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="mc-opt-legend" v-model="showLegend" />
                    <label class="form-check-label" for="mc-opt-legend">{{ t('analyses.charts.common.legend') }}</label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Table: rows = years, columns = months + avg -->
          <div class="card">
            <div class="card-header">
              <span class="fw-medium">
                <i class="bi bi-table me-2 text-primary"></i>
                {{ t('analyses.charts.dividends_by_year_month.tableTitle') }}
              </span>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover mb-0 month-table">
                  <thead>
                    <tr>
                      <th>{{ t('analyses.common.year') }}</th>
                      <th v-for="m in selectedMonths" :key="m" class="text-end">{{ monthName(m) }}</th>
                      <th class="text-end th-avg">Ø</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="year in filteredYears" :key="year">
                      <td>
                        <span class="year-dot" :style="{ background: yearColor(year) }"></span>
                        <strong>{{ year }}</strong>
                      </td>
                      <td v-for="m in selectedMonths" :key="m" class="text-end font-monospace">
                        {{ tableCell(year, m) }}
                      </td>
                      <td class="text-end font-monospace th-avg">{{ tableAvg(year) }}</td>
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
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import type { ComposeOption } from 'echarts/core'
import type { BarSeriesOption } from 'echarts/charts'
import type { GridComponentOption, TooltipComponentOption, LegendComponentOption } from 'echarts/components'

use([BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

type ECOption = ComposeOption<BarSeriesOption | GridComponentOption | TooltipComponentOption | LegendComponentOption>

import { getErrorCode } from '@/helper/errorCode'
import TheMainLayout from '@/layouts/TheMainLayout.vue'
import { useAnalysesStore } from '@/stores/analyses'
import { useDepotsStore } from '@/stores/depots'
import { GToast, GToastDanger, GToastWarning } from 'goar-components'
import type { GToastContent } from 'goar-components'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '@/stores/settings'

const ALL_MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']

const { t, locale } = useI18n()
const storeAnalyses = useAnalysesStore()
const storeDepots = useDepotsStore()
const storeSettings = useSettingsStore()
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
  const base = t('analyses.charts.dividends_by_year_month.title')
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

watch(selectedDepotIds, () => { reloadChartData() })

// --- Raw data ---
const rawData = computed(() => storeAnalyses.getCurrentMonthChartData)
const currency = computed(() => rawData.value?.rows[0]?.currency ?? '')

// --- Years ---
const allYears = computed(() => {
  const data = rawData.value
  if (!data) return []
  return [...new Set(data.rows.map((r) => r.year))].sort()
})

// --- Year filter ---
const preset = ref('5y')
const yearFrom = ref('')
const yearTo = ref('')
const availableYears = computed(() => allYears.value)

const presets = [
  { key: '3y', labelKey: 'analyses.charts.common.preset3y' },
  { key: '5y', labelKey: 'analyses.charts.common.preset5y' },
  { key: '10y', labelKey: 'analyses.charts.common.preset10y' },
  { key: 'all', labelKey: 'analyses.charts.common.presetAll' },
]

watch(allYears, (years) => {
  if (years.length > 0 && yearFrom.value === '') {
    applyPreset('5y')
  }
}, { immediate: true })

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

const filteredYears = computed(() =>
  allYears.value.filter((y) => y >= yearFrom.value && y <= yearTo.value)
)

// --- Month filter ---
const selectedMonths = ref<string[]>([...ALL_MONTHS])
const multiSelectMode = ref(false)
const filterActive = computed(() => selectedMonths.value.length < 12)

function onMonthClick(m: string) {
  if (multiSelectMode.value) {
    const isSelected = selectedMonths.value.includes(m)
    const next = isSelected
      ? selectedMonths.value.filter((x) => x !== m)
      : [...selectedMonths.value, m].sort()
    selectedMonths.value = next.length === 0 ? [...ALL_MONTHS] : next
  } else {
    selectedMonths.value = [m]
  }
}

function resetMonthFilter() {
  selectedMonths.value = [...ALL_MONTHS]
  multiSelectMode.value = false
}

// --- Value toggle ---
const activeValue = ref<'gross' | 'after_withholding' | 'net'>('gross')

// --- Filtered rows ---
const filteredRows = computed(() => {
  const data = rawData.value
  if (!data) return []
  return data.rows.filter(
    (r) => r.year >= yearFrom.value && r.year <= yearTo.value && selectedMonths.value.includes(r.month),
  )
})

// --- Year color ---
function yearColor(year: string): string {
  const colors = storeSettings.currentPalette.yearColors
  const idx = allYears.value.indexOf(year)
  return colors[idx % colors.length] ?? colors[0] ?? '#888888'
}

// --- Display options ---
const showGrid = ref(true)
const showLabels = ref(false)
const showLegend = ref(true)

// --- Formatting ---
const fmtLocale = computed(() => (locale.value.startsWith('de') ? 'de-DE' : 'en-US'))

function fmtMoney2(n: number) {
  return new Intl.NumberFormat(fmtLocale.value, {
    style: 'currency',
    currency: currency.value || 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

function fmtShort(n: number) {
  if (n >= 1000)
    return new Intl.NumberFormat(fmtLocale.value, { maximumFractionDigits: 1 }).format(n / 1000) + ' k'
  return new Intl.NumberFormat(fmtLocale.value, { maximumFractionDigits: 0 }).format(n)
}

function monthName(m: string): string {
  return new Date(2020, parseInt(m) - 1, 1).toLocaleDateString(fmtLocale.value, { month: 'short' })
}

// --- Table helpers ---
function tableCell(year: string, month: string): string {
  const row = filteredRows.value.find((r) => r.year === year && r.month === month)
  if (!row) return '–'
  return fmtMoney2(row[activeValue.value])
}

function tableAvg(year: string): string {
  const rows = filteredRows.value.filter((r) => r.year === year)
  if (rows.length === 0) return '–'
  return fmtMoney2(rows.reduce((s, r) => s + r[activeValue.value], 0) / rows.length)
}

// --- Chart option ---
const chartOption = computed<ECOption>(() => {
  const months = selectedMonths.value
  const years = filteredYears.value

  const series: BarSeriesOption[] = years.map((year) => ({
    name: year,
    type: 'bar',
    data: months.map((m) => {
      const row = filteredRows.value.find((r) => r.year === year && r.month === m)
      return row ? row[activeValue.value] : 0
    }),
    itemStyle: { color: yearColor(year), borderRadius: [2, 2, 0, 0] },
    barMaxWidth: 28,
    barGap: '5%',
    barCategoryGap: '30%',
    label: {
      show: showLabels.value,
      position: 'top',
      formatter: (p: { value: number }) => (p.value > 0 ? fmtShort(p.value) : ''),
      fontSize: 10,
      color: '#495057',
    },
  }))

  return {
    animationDuration: 400,
    grid: { left: 60, right: 16, top: 48, bottom: 40, containLabel: true },
    legend: {
      show: showLegend.value,
      top: 4,
      left: 'center',
      icon: 'roundRect',
      itemWidth: 12,
      itemHeight: 12,
      textStyle: { color: '#495057', fontSize: 12 },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'none' },
      backgroundColor: '#212529',
      borderColor: '#212529',
      textStyle: { color: '#fff', fontSize: 12 },
      padding: [10, 12],
      formatter(params: unknown) {
        const ps = params as Array<{ seriesName: string; color: string; value: number; axisValueLabel: string }>
        if (!ps?.length) return ''
        const lines = ps
          .filter((p) => p.value > 0)
          .map(
            (p) =>
              `<div style="display:flex;align-items:center;gap:8px;margin-top:3px">` +
              `<span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${p.color}"></span>` +
              `<span style="min-width:50px;color:#ced4da">${p.seriesName}</span>` +
              `<strong style="margin-left:auto">${fmtMoney2(p.value)}</strong>` +
              `</div>`,
          )
          .join('')
        return (
          `<div style="font-weight:600;font-size:13px;margin-bottom:4px">${ps[0].axisValueLabel}</div>` + lines
        )
      },
    },
    xAxis: {
      type: 'category',
      data: months.map((m) => monthName(m)),
      axisLine: { lineStyle: { color: '#ced4da' } },
      axisTick: { show: false },
      axisLabel: { color: '#495057', fontSize: 12 },
    },
    yAxis: {
      type: 'value',
      splitLine: { show: showGrid.value, lineStyle: { color: '#eceff3' } },
      axisLabel: {
        color: '#6c757d',
        fontSize: 11,
        formatter: (v: number) => fmtShort(v),
      },
    },
    series,
  }
})

// --- Export ---
function exportPng() {
  const instance = chartRef.value as unknown as { getDataURL?: (opts: object) => string }
  const url = instance?.getDataURL?.({ pixelRatio: 2, backgroundColor: '#ffffff' })
  if (!url) return
  const a = document.createElement('a')
  a.href = url
  a.download = `dividenden_monate_${yearFrom.value}-${yearTo.value}.png`
  a.click()
}

function exportCsv() {
  const years = filteredYears.value
  const months = selectedMonths.value
  const sep = ';'
  const header = [t('analyses.common.year'), ...months.map((m) => monthName(m)), 'Ø'].join(sep)
  const lines = [
    header,
    ...years.map((year) => {
      const cells = months.map((m) => {
        const row = filteredRows.value.find((r) => r.year === year && r.month === m)
        return row ? row[activeValue.value].toFixed(2).replace('.', ',') : ''
      })
      const yearRows = filteredRows.value.filter((r) => r.year === year)
      const avg =
        yearRows.length > 0
          ? (yearRows.reduce((s, r) => s + r[activeValue.value], 0) / yearRows.length).toFixed(2).replace('.', ',')
          : ''
      return [year, ...cells, avg].join(sep)
    }),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `dividenden_monate_${yearFrom.value}-${yearTo.value}.csv`
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
    .fetchDividendsByYearMonthChartData(ids)
    .then(() => {
      if (!rawData.value || rawData.value.rows.length === 0) {
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

.dividend-chart {
  height: 380px;
}

.year-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
  flex-shrink: 0;
}

.th-avg {
  background: color-mix(in oklab, var(--bs-secondary-bg), transparent 40%);
  font-style: italic;
}

.filter-btn {
  width: 2.25rem;
}
</style>
