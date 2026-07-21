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
              <v-chart ref="chartRef" class="dividend-chart" :option="chartOption" :update-options="{ notMerge: true }" autoresize />
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
            <div class="card-header d-flex align-items-center justify-content-between">
              <span class="fw-medium">
                <i class="bi bi-table me-2 text-primary"></i>
                {{ t('analyses.charts.dividends_by_year_month.tableTitle') }}
              </span>
              <span v-if="currency" class="text-muted small">{{ currency }}</span>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover mb-0 month-table">
                  <thead>
                    <tr>
                      <th class="year-col">{{ t('analyses.common.year') }}</th>
                      <th v-for="m in selectedMonths" :key="m" class="text-end">{{ monthName(m) }}</th>
                      <th class="text-end th-sum">Σ</th>
                      <th class="text-end th-avg">
                        <span class="d-inline-flex align-items-center justify-content-end gap-1 w-100">
                          Ø
                          <button
                            type="button"
                            class="btn btn-link p-0 lh-1 avg-mode-btn"
                            :class="avgMode === 'elapsed' ? 'text-primary' : 'text-body-tertiary'"
                            @click="avgMode = avgMode === 'data' ? 'elapsed' : 'data'"
                            :title="avgMode === 'elapsed' ? t('analyses.charts.dividends_by_year_month.avgToggleElapsed') : t('analyses.charts.dividends_by_year_month.avgToggleData')"
                          ><i class="bi bi-calendar3"></i></button>
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="year in filteredYears" :key="year">
                      <td class="year-col">
                        <span class="year-dot" :style="{ background: yearColor(year) }"></span>
                        <strong>{{ year }}</strong>
                      </td>
                      <td v-for="m in selectedMonths" :key="m" class="text-end cell-compact">
                        <span
                          v-if="tableRaw(year, m) !== null"
                          class="cell-value"
                          :class="{ 'cell-active': activeCellKey === `${year}-${m}` }"
                          @click="openCellPopover($event, year, m)"
                        >{{ tableCompact(year, m) }}</span>
                        <span v-else class="text-muted">–</span>
                      </td>
                      <td class="text-end cell-compact th-sum">
                        <span
                          class="cell-value"
                          :class="{ 'cell-active': activeCellKey === `${year}-sum` }"
                          @click="openSumPopover($event, year)"
                        >{{ tableSum(year) }}</span>
                      </td>
                      <td class="text-end cell-compact th-avg">
                        <span
                          class="cell-value"
                          :class="{ 'cell-active': activeCellKey === `${year}-avg` }"
                          @click="openAvgPopover($event, year)"
                        >{{ tableAvg(year) }}</span>
                      </td>
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
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUserLocale } from '@/composables/useUserLocale'
import * as bootstrap from 'bootstrap'
import { useSettingsStore } from '@/stores/settings'

const ALL_MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']

const { t, locale } = useI18n()
const { userLocale } = useUserLocale()
const router = useRouter()
const storeAnalyses = useAnalysesStore()
const storeDepots = useDepotsStore()
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
  if (activePopoverInstance.value) {
    const popoverEl = document.querySelector('.popover.show')
    if (!popoverEl?.contains(e.target as Node)) {
      closePopover()
    }
  }
}

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
  closePopover()
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

// --- Cell popover ---
// Bootstrap 5.3.8 ships no .d.ts files; cast once here, use typed interface everywhere else
type BSPopover = { show(): void; hide(): void; dispose(): void }
const BSPopoverClass = (bootstrap as unknown as { Popover: new (el: Element, opts?: object) => BSPopover }).Popover

const activePopoverInstance = ref<BSPopover | null>(null)
const activePopoverTriggerEl = ref<HTMLElement | null>(null)

function closePopover() {
  activePopoverInstance.value?.hide()
  activePopoverInstance.value?.dispose()
  activePopoverInstance.value = null
  activePopoverTriggerEl.value = null
  activeCellKey.value = null
}

function openCellPopover(event: MouseEvent, year: string, month: string) {
  event.stopPropagation()
  const el = event.currentTarget as HTMLElement
  if (activePopoverTriggerEl.value === el) {
    closePopover()
    return
  }
  closePopover()
  const detailHref = router.resolve({ name: 'analysismonthsecurity', query: { year, month: Number(month) } }).href
  const shareHref = router.resolve({ name: 'analysismonthshare', query: { year, month } }).href
  const popover = new BSPopoverClass(el, {
    html: true,
    title: `${year} · ${monthName(month)}`,
    content: `<div class="fw-semibold num-tabular mb-1">${tableExact(year, month)}</div>
      <div class="d-flex flex-column gap-1 mt-1">
        <a href="${detailHref}" class="text-secondary text-decoration-none small">${t('analyses.charts.dividends_by_year_month.popoverDetailLink')}</a>
        <a href="${shareHref}" class="text-secondary text-decoration-none small">${t('analyses.charts.dividends_by_year_month.popoverShareLink')}</a>
      </div>`,
    trigger: 'manual',
    placement: 'auto',
    container: 'body',
    customClass: 'popover-analytics',
  })
  popover.show()
  activePopoverInstance.value = popover
  activePopoverTriggerEl.value = el
  activeCellKey.value = `${year}-${month}`
}

const activeCellKey = ref<string | null>(null)

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
  return new Intl.NumberFormat(userLocale.value, {
    style: 'currency',
    currency: currency.value || 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

function fmtShort(n: number) {
  if (n >= 1000)
    return new Intl.NumberFormat(userLocale.value, { maximumFractionDigits: 1 }).format(n / 1000) + ' k'
  return new Intl.NumberFormat(userLocale.value, { maximumFractionDigits: 0 }).format(n)
}

function monthName(m: string): string {
  return new Date(2020, parseInt(m) - 1, 1).toLocaleDateString(fmtLocale.value, { month: 'short' })
}

// --- Table helpers ---
function tableRaw(year: string, month: string): number | null {
  const row = filteredRows.value.find((r) => r.year === year && r.month === month)
  return row ? row[activeValue.value] : null
}

function tableCompact(year: string, month: string): string {
  const v = tableRaw(year, month)
  return v !== null ? fmtShort(v) : '–'
}

function tableExact(year: string, month: string): string {
  const v = tableRaw(year, month)
  return v !== null ? fmtMoney2(v) : '–'
}

const avgMode = ref<'data' | 'elapsed'>('data')

function calcAvgData(year: string, mode?: 'data' | 'elapsed'): { value: number; divisor: number } | null {
  const rows = filteredRows.value.filter((r) => r.year === year)
  if (rows.length === 0) return null
  const sum = rows.reduce((s, r) => s + r[activeValue.value], 0)
  const effectiveMode = mode ?? avgMode.value
  let divisor: number
  if (effectiveMode === 'elapsed') {
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    if (Number(year) === now.getFullYear()) {
      divisor = selectedMonths.value.filter((m) => Number(m) <= currentMonth).length
    } else {
      divisor = selectedMonths.value.length
    }
    if (divisor === 0) divisor = rows.length
  } else {
    divisor = rows.length
  }
  return { value: sum / divisor, divisor }
}

function tableAvg(year: string): string {
  const data = calcAvgData(year)
  return data ? fmtShort(data.value) : '–'
}

function tableSum(year: string): string {
  const rows = filteredRows.value.filter((r) => r.year === year)
  if (rows.length === 0) return '–'
  const sum = rows.reduce((s, r) => s + r[activeValue.value], 0)
  return fmtShort(sum)
}

function openSumPopover(event: MouseEvent, year: string) {
  event.stopPropagation()
  const el = event.currentTarget as HTMLElement
  if (activePopoverTriggerEl.value === el) {
    closePopover()
    return
  }
  closePopover()
  const rows = filteredRows.value.filter((r) => r.year === year)
  if (rows.length === 0) return
  const sum = rows.reduce((s, r) => s + r[activeValue.value], 0)
  const months = t('analyses.charts.dividends_by_year_month.avgMonths')
  const popover = new BSPopoverClass(el, {
    html: true,
    title: year,
    content: `<div class="fw-semibold num-tabular mb-1">${fmtMoney2(sum)}</div>
      <div class="text-secondary small">${rows.length} ${months}</div>`,
    trigger: 'manual',
    placement: 'auto',
    container: 'body',
    customClass: 'popover-analytics',
  })
  popover.show()
  activePopoverInstance.value = popover
  activePopoverTriggerEl.value = el
  activeCellKey.value = `${year}-sum`
}

function openAvgPopover(event: MouseEvent, year: string) {
  event.stopPropagation()
  const el = event.currentTarget as HTMLElement
  if (activePopoverTriggerEl.value === el) {
    closePopover()
    return
  }
  closePopover()
  const dataResult    = calcAvgData(year, 'data')
  const elapsedResult = calcAvgData(year, 'elapsed')
  if (!dataResult) return

  const labelData    = t('analyses.charts.dividends_by_year_month.avgLabelData')
  const labelElapsed = t('analyses.charts.dividends_by_year_month.avgLabelElapsed')
  const months       = t('analyses.charts.dividends_by_year_month.avgMonths')
  const isCurrentYear = Number(year) === new Date().getFullYear()
  const showBoth = isCurrentYear && elapsedResult !== null && dataResult.divisor !== elapsedResult.divisor

  let content: string
  if (showBoth && elapsedResult) {
    const activeData    = avgMode.value === 'data' ? dataResult    : elapsedResult
    const inactiveData  = avgMode.value === 'data' ? elapsedResult : dataResult
    const activeLabel   = avgMode.value === 'data' ? labelData     : labelElapsed
    const inactiveLabel = avgMode.value === 'data' ? labelElapsed  : labelData
    content = `
      <div class="d-flex flex-column gap-2">
        <div>
          <div class="text-secondary small">${activeLabel} (÷ ${activeData.divisor} ${months})</div>
          <div class="fw-semibold num-tabular">${fmtMoney2(activeData.value)}</div>
        </div>
        <div>
          <div class="text-secondary small">${inactiveLabel} (÷ ${inactiveData.divisor} ${months})</div>
          <div class="num-tabular">${fmtMoney2(inactiveData.value)}</div>
        </div>
      </div>`
  } else {
    const single = avgMode.value === 'elapsed' && elapsedResult ? elapsedResult : dataResult
    content = `<div class="fw-semibold num-tabular mb-1">${fmtMoney2(single.value)}</div>
      <div class="text-secondary small">÷ ${single.divisor} ${months}</div>`
  }

  const title = showBoth ? year : `${year} · ${avgMode.value === 'elapsed' ? labelElapsed : labelData}`
  const popover = new BSPopoverClass(el, {
    html: true,
    title,
    content,
    trigger: 'manual',
    placement: 'auto',
    container: 'body',
    customClass: 'popover-analytics',
  })
  popover.show()
  activePopoverInstance.value = popover
  activePopoverTriggerEl.value = el
  activeCellKey.value = `${year}-avg`
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
      formatter: (p: { value: unknown }) => ((p.value as number) > 0 ? fmtShort(p.value as number) : ''),
      fontSize: 10,
      color: chartColors.value.label,
    },
  }))

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
  const instance = chartRef.value as unknown as { getDataURL?: (opts: object) => string }
  const url = instance?.getDataURL?.({ pixelRatio: 2, backgroundColor: '#ffffff' })
  if (!url) return
  const a = document.createElement('a')
  a.href = url
  a.download = `dividenden_monate_${yearFrom.value}-${yearTo.value}.png`
  a.click()
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

.th-sum {
  background: color-mix(in oklab, var(--bs-secondary-bg), transparent 60%);
  font-weight: 600;
}

.th-avg {
  background: color-mix(in oklab, var(--bs-secondary-bg), transparent 40%);
  font-style: italic;
}

.avg-mode-btn {
  font-size: 0.65rem;
  line-height: 1;
}

.filter-btn {
  width: 2.25rem;
}

/* Compact table cells */
.month-table th,
.month-table td {
  padding: 0.3rem 0.5rem;
  font-size: 0.8rem;
}

.cell-compact {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.cell-value {
  display: inline-block;
  padding: 0.15rem 0.4rem;
  border-radius: 0.35rem;
  cursor: pointer;
  transition: background-color 0.12s ease, color 0.12s ease;
}

.cell-value:hover {
  background-color: rgba(var(--bs-emphasis-color-rgb), 0.07);
  color: var(--bs-primary);
}

.cell-value.cell-active {
  background-color: rgba(var(--bs-primary-rgb), 0.1);
  color: var(--bs-primary);
}

/* Sticky year column */
.month-table .year-col {
  position: sticky;
  left: 0;
  z-index: 2;
  background-color: var(--bs-body-bg);
  white-space: nowrap;
}

.month-table tbody tr:hover .year-col {
  background-color: var(--bs-table-hover-bg, rgba(0, 0, 0, 0.075));
}
</style>
