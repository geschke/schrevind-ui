<template>
  <TheMainLayout>
    <template #default>
      <div class="col-12">
        <h2>{{ t("analyses.dividends_by_year_month_security_data.title") }}</h2>

        <!-- Filter card -->
        <div class="card mb-3">
          <div class="card-body py-2">
            <!-- Row 1: year, depot, reload -->
            <div class="d-flex flex-wrap align-items-end gap-3">
              <!-- Year multi-select -->
              <div>
                <div class="form-label text-secondary small mb-1 text-uppercase fw-semibold">{{ t("analyses.dividends_by_year_month_security_data.filterYears") }}</div>
                <div ref="yearDropdownRef" class="position-relative">
                  <div class="input-group input-group-sm">
                    <button type="button" class="btn btn-outline-secondary" @click.stop="toggleYearDropdown">
                      <i class="bi bi-calendar3 me-1"></i>
                      <span v-if="selectedYears.length === 0">{{ t("analyses.dividends_by_year_month_security_data.allYears") }}</span>
                      <span v-else>{{ selectedYears.slice().sort((a, b) => b - a).join(", ") }}</span>
                      <i class="bi bi-chevron-down ms-1"></i>
                    </button>
                    <button v-if="selectedYears.length > 0" type="button" class="btn btn-outline-secondary" @click="clearYearFilter">
                      <i class="bi bi-x"></i>
                    </button>
                  </div>
                  <div
                    v-if="yearDropdownOpen"
                    class="position-absolute bg-body border rounded shadow-sm p-2 mt-1"
                    style="z-index: 1050; min-width: 100px;"
                    @click.stop
                  >
                    <div v-for="year in availableYears" :key="year" class="form-check">
                      <input class="form-check-input" type="checkbox" :id="`year-${year}`" :value="year" v-model="selectedYears" />
                      <label class="form-check-label small" :for="`year-${year}`">{{ year }}</label>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Depot filter -->
              <div>
                <div class="form-label text-secondary small mb-1 text-uppercase fw-semibold">{{ t("analyses.charts.common.depots") }}</div>
                <select class="form-select form-select-sm" v-model="selectedDepotId" @change="onDepotChange">
                  <option :value="null">{{ t("analyses.charts.common.allDepots") }}</option>
                  <option v-for="depot in storeDepots.getDepots" :key="depot.ID" :value="depot.ID">
                    {{ depot.Name }}
                  </option>
                </select>
              </div>

              <!-- Sort toggles -->
              <div>
                <div class="form-label text-secondary small mb-1 text-uppercase fw-semibold">{{ t("analyses.dividends_by_year_month_security_data.sortLabel") }}</div>
                <div class="btn-group btn-group-sm">
                  <button
                    type="button"
                    class="btn btn-outline-secondary"
                    @click="yearSortDesc = !yearSortDesc"
                  >
                    <i class="bi me-1" :class="yearSortDesc ? 'bi-sort-down' : 'bi-sort-up-alt'"></i>
                    {{ t("analyses.dividends_by_year_month_security_data.sortYears") }}
                  </button>
                  <button
                    type="button"
                    class="btn btn-outline-secondary"
                    @click="monthSortAsc = !monthSortAsc"
                  >
                    <i class="bi me-1" :class="monthSortAsc ? 'bi-sort-up-alt' : 'bi-sort-down'"></i>
                    {{ t("analyses.dividends_by_year_month_security_data.sortMonths") }}
                  </button>
                </div>
              </div>

              <!-- Compare mode toggle -->
              <div v-if="activeYearCount >= 2">
                <div class="form-label text-secondary small mb-1 text-uppercase fw-semibold">&nbsp;</div>
                <button
                  type="button"
                  class="btn btn-sm"
                  :class="compareMode ? 'btn-warning' : 'btn-outline-secondary'"
                  @click="compareMode = !compareMode"
                  :title="t('analyses.dividends_by_year_month_security_data.compareButton')"
                >
                  <i class="bi bi-arrows-angle-contract me-1"></i>
                  {{ t("analyses.dividends_by_year_month_security_data.compareButton") }}
                </button>
              </div>

              <!-- Reload button -->
              <div>
                <div class="form-label text-secondary small mb-1 text-uppercase fw-semibold">&nbsp;</div>
                <button type="button" class="btn btn-primary btn-sm" :disabled="loading" @click="loadData">
                  <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                  {{ t("analyses.dividends_by_year_month_security_data.loadButton") }}
                </button>
              </div>
            </div>

            <!-- Row 2: month filter (visually separated) -->
            <div class="d-flex flex-wrap align-items-center gap-2 mt-2 pt-2 border-top">
              <div class="form-label text-secondary small mb-0 text-uppercase fw-semibold">{{ t("analyses.charts.dividends_by_year_month.filterMonths") }}</div>
              <div class="btn-group btn-group-sm flex-wrap" role="group">
                <button
                  v-for="m in 12"
                  :key="m"
                  type="button"
                  class="btn btn-sm"
                  :class="selectedMonths.includes(m) ? 'btn-secondary' : 'btn-outline-secondary'"
                  @click="onMonthClick(m)"
                >{{ monthLabel(m) }}</button>
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

        <!-- Loading -->
        <div v-if="loading" class="text-center py-4">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">{{ t("common.loading") }}</span>
          </div>
        </div>

        <!-- Error -->
        <div v-else-if="errorMsg" class="alert alert-danger" role="alert">
          {{ errorMsg }}
        </div>

        <!-- Empty -->
        <div v-else-if="data && data.periods.length === 0" class="alert alert-info" role="alert">
          {{ t("analyses.common.empty") }}
        </div>

        <!-- Table -->
        <div v-else-if="data" class="table-responsive">
          <table class="table table-sm table-bordered table-hover align-middle">
            <thead class="table-light">
              <tr>
                <th>{{ t("analyses.dividends_by_year_month_security_data.columns.security_name") }}</th>
                <th>{{ t("analyses.dividends_by_year_month_security_data.columns.security_isin") }}</th>
                <th class="text-end">{{ t("analyses.dividends_by_year_month_security_data.columns.gross") }} ({{ data.currency }})</th>
                <th class="text-end">{{ t("analyses.dividends_by_year_month_security_data.columns.after_withholding") }} ({{ data.currency }})</th>
                <th class="text-end">{{ t("analyses.dividends_by_year_month_security_data.columns.net") }} ({{ data.currency }})</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="period in sortedPeriods" :key="`${period.year}-${period.month}`">
                <tr class="table-secondary">
                  <td colspan="5" class="fw-semibold">
                    {{ periodLabel(period.year, period.month) }}
                    <router-link
                      :to="{ name: 'analysismonthshare', query: { year: period.year, month: period.month } }"
                      class="ms-2 text-muted fw-normal"
                      :title="t('analyses.charts.dividends_share_by_month.linkTitle')"
                    ><i class="bi bi-pie-chart"></i></router-link>
                  </td>
                </tr>
                <tr
                  v-for="(row, idx) in period.rows"
                  :key="idx"
                  :class="[{ 'fw-bold': row.type === 'summary' }, row.type !== 'summary' ? rowCompareClass(period.year, period.month, row.security_isin) : '']"
                >
                  <td>{{ row.type === "summary" ? t("analyses.dividends_by_year_month_security_data.summary") : row.security_name }}</td>
                  <td>{{ row.security_isin }}</td>
                  <td class="text-end">{{ row.gross }}</td>
                  <td class="text-end">{{ row.after_withholding }}</td>
                  <td class="text-end">{{ row.net }}</td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </TheMainLayout>
</template>

<script setup lang="ts">
import TheMainLayout from "@/layouts/TheMainLayout.vue";
import { useAnalysesStore } from "@/stores/analyses";
import { useDepotsStore } from "@/stores/depots";
import { useDividendEntriesStore } from "@/stores/dividendEntries";
import type { TimeRange } from "@/stores/dividendEntries";
import type { YearMonthPeriod, YearMonthSecurityData } from "@/types/analyses";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";

const { t, locale } = useI18n();
const route = useRoute();
const storeAnalyses = useAnalysesStore();
const storeDepots = useDepotsStore();
const storeDividendEntries = useDividendEntriesStore();

const loading = ref(false);
const errorMsg = ref<string | null>(null);
const data = ref<YearMonthSecurityData | null>(null);
const timeRange = ref<TimeRange | null>(null);

const yearDropdownOpen = ref(false);
const yearDropdownRef = ref<HTMLElement | null>(null);
const selectedYears = ref<number[]>([]);
const selectedMonths = ref<number[]>([]);
const multiSelectMode = ref(false);
const selectedDepotId = ref<number | null>(null);
const yearSortDesc = ref(true);
const monthSortAsc = ref(true);
const compareMode = ref(false);

const availableYears = computed<number[]>(() => {
  if (!timeRange.value || timeRange.value.first_year === 0) return [];
  const years: number[] = [];
  for (let y = timeRange.value.last_year; y >= timeRange.value.first_year; y--) {
    years.push(y);
  }
  return years;
});

const computedPeriods = computed<YearMonthPeriod[]>(() => {
  const years = selectedYears.value.length > 0 ? selectedYears.value : availableYears.value;
  if (years.length === 0 || selectedMonths.value.length === 0) return [];
  const periods: YearMonthPeriod[] = [];
  for (const year of years) {
    for (const month of selectedMonths.value) {
      periods.push({ year: String(year), month: String(month).padStart(2, "0") });
    }
  }
  return periods;
});

const sortedPeriods = computed(() => {
  if (!data.value) return [];
  return [...data.value.periods].sort((a, b) => {
    const yearDiff = yearSortDesc.value
      ? Number(b.year) - Number(a.year)
      : Number(a.year) - Number(b.year);
    if (yearDiff !== 0) return yearDiff;
    return monthSortAsc.value
      ? Number(a.month) - Number(b.month)
      : Number(b.month) - Number(a.month);
  });
});

const activeYearCount = computed(() => {
  if (!data.value) return 0;
  return new Set(data.value.periods.map((p) => p.year)).size;
});

// Map key: `${year}-${month}-${isin}` → 'all' | 'some'
const comparisonMap = computed((): Map<string, "all" | "some"> => {
  const result = new Map<string, "all" | "some">();
  if (!compareMode.value || !data.value) return result;

  const byMonth = new Map<string, typeof data.value.periods>();
  for (const period of data.value.periods) {
    const existing = byMonth.get(period.month) ?? [];
    existing.push(period);
    byMonth.set(period.month, existing);
  }

  for (const [, periods] of byMonth) {
    if (periods.length < 2) continue;
    const isinSets = periods.map(
      (p) => new Set(p.rows.filter((r) => r.type !== "summary" && r.security_isin).map((r) => r.security_isin))
    );
    const allIsins = new Set(isinSets.flatMap((s) => [...s]));
    for (const isin of allIsins) {
      const inAll = isinSets.every((s) => s.has(isin));
      for (const period of periods) {
        result.set(`${period.year}-${period.month}-${isin}`, inAll ? "all" : "some");
      }
    }
  }
  return result;
});

function rowCompareClass(year: string, month: string, isin: string): string {
  if (!compareMode.value || !isin) return "";
  const status = comparisonMap.value.get(`${year}-${month}-${isin}`);
  if (status === "all") return "row-compare-all";
  if (status === "some") return "row-compare-some";
  return "";
}

const filterActive = computed(() => {
  if (multiSelectMode.value) return true;
  if (selectedMonths.value.length !== 1) return true;
  if (timeRange.value == null) return false;
  return selectedMonths.value[0] !== timeRange.value.current_month;
});

function monthLabel(m: number): string {
  return new Date(2000, m - 1, 1).toLocaleString(locale.value === "de" ? "de-DE" : "en-US", { month: "short" });
}

function periodLabel(year: string, month: string): string {
  return new Date(Number(year), Number(month) - 1, 1).toLocaleString(locale.value === "de" ? "de-DE" : "en-US", {
    month: "long",
    year: "numeric",
  });
}

function setDefaultPeriods(range: TimeRange) {
  const defaultYear = range.last_year > 0 && range.current_year > range.last_year
    ? range.last_year
    : range.current_year;
  selectedYears.value = [defaultYear];
  selectedMonths.value = [range.current_month];
  multiSelectMode.value = false;
}

function onMonthClick(m: number) {
  if (multiSelectMode.value) {
    const isSelected = selectedMonths.value.includes(m);
    const next = isSelected
      ? selectedMonths.value.filter((x) => x !== m)
      : [...selectedMonths.value, m].sort((a, b) => a - b);
    selectedMonths.value = next.length === 0 ? [m] : next;
  } else {
    selectedMonths.value = [m];
  }
  loadData();
}

function resetMonthFilter() {
  if (timeRange.value) {
    selectedMonths.value = [timeRange.value.current_month];
  }
  multiSelectMode.value = false;
  loadData();
}

function toggleYearDropdown() {
  if (yearDropdownOpen.value) {
    yearDropdownOpen.value = false;
    loadData();
  } else {
    yearDropdownOpen.value = true;
  }
}

function clearYearFilter() {
  selectedYears.value = [];
  loadData();
}

function handleClickOutside(event: MouseEvent) {
  if (yearDropdownOpen.value && yearDropdownRef.value && !yearDropdownRef.value.contains(event.target as Node)) {
    yearDropdownOpen.value = false;
    loadData();
  }
}

async function onDepotChange() {
  const depotId = selectedDepotId.value ?? undefined;
  await storeDividendEntries
    .fetchTimeRange(depotId)
    .then((range) => {
      timeRange.value = range;
      setDefaultPeriods(range);
    })
    .catch(() => {});
  loadData();
}

function loadData() {
  loading.value = true;
  errorMsg.value = null;
  yearDropdownOpen.value = false;
  const depotIds = selectedDepotId.value != null ? [selectedDepotId.value] : undefined;
  const periods = computedPeriods.value.length > 0 ? computedPeriods.value : undefined;
  storeAnalyses
    .fetchDividendsByYearMonthSecurityData(periods, depotIds)
    .then((result) => {
      data.value = result;
    })
    .catch(() => {
      errorMsg.value = t("analyses.errors.loadFailed");
    })
    .finally(() => {
      loading.value = false;
    });
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  Promise.all([storeDepots.fetchDepots(), storeDividendEntries.fetchTimeRange()])
    .then(([, range]) => {
      timeRange.value = range;
      const qYear = Number(route.query.year);
      const qMonth = Number(route.query.month);
      if (qYear && qMonth) {
        selectedYears.value = [qYear];
        selectedMonths.value = [qMonth];
        multiSelectMode.value = false;
      } else {
        setDefaultPeriods(range);
      }
      loadData();
    })
    .catch(() => {
      errorMsg.value = t("analyses.errors.loadFailed");
    });
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style scoped>
.filter-btn {
  width: 2.25rem;
}

.row-compare-all {
  --bs-table-bg: color-mix(in oklab, var(--bs-success), transparent 80%);
  --bs-table-striped-bg: color-mix(in oklab, var(--bs-success), transparent 80%);
}

.row-compare-some {
  --bs-table-bg: color-mix(in oklab, var(--bs-warning), transparent 70%);
  --bs-table-striped-bg: color-mix(in oklab, var(--bs-warning), transparent 70%);
}
</style>
