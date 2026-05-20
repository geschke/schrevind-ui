<template>
  <TheMainLayout>
    <template #default>
      <div class="col-12">
        <h2>{{ t("analyses.dividends_by_year_month.title") }}</h2>

        <!-- Filter card -->
        <div class="card mb-3">
          <div class="card-body py-2">
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
                    class="position-absolute bg-white border rounded shadow-sm p-2 mt-1"
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
        <div v-else-if="data && filteredRows.length === 0" class="alert alert-info" role="alert">
          {{ t("analyses.common.empty") }}
        </div>

        <!-- Table -->
        <div v-else-if="data" class="table-responsive">
          <table class="table table-sm table-bordered table-hover align-middle">
            <thead class="table-light">
              <tr>
                <th>{{ t("analyses.common.period") }}</th>
                <th class="text-end">{{ t("analyses.dividends_by_year_month.columns.gross") }} ({{ data.currency }})</th>
                <th class="text-end">{{ t("analyses.dividends_by_year_month.columns.after_withholding") }} ({{ data.currency }})</th>
                <th class="text-end">{{ t("analyses.dividends_by_year_month.columns.net") }} ({{ data.currency }})</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, idx) in filteredRows"
                :key="idx"
                :class="{ 'table-secondary fw-semibold': row.level === 'year' }"
              >
                <td>{{ formatPeriod(row) }}</td>
                <td class="text-end">{{ row.gross }}</td>
                <td class="text-end">{{ row.after_withholding }}</td>
                <td class="text-end">{{ row.net }}</td>
              </tr>
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
import type { YearMonthData, YearMonthRow } from "@/types/analyses";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useI18n } from "vue-i18n";

const { t, locale } = useI18n();
const storeAnalyses = useAnalysesStore();
const storeDepots = useDepotsStore();
const storeDividendEntries = useDividendEntriesStore();

const loading = ref(false);
const errorMsg = ref<string | null>(null);
const data = ref<YearMonthData | null>(null);
const timeRange = ref<TimeRange | null>(null);

const yearDropdownOpen = ref(false);
const yearDropdownRef = ref<HTMLElement | null>(null);
const selectedYears = ref<number[]>([]);
const selectedDepotId = ref<number | null>(null);

const availableYears = computed<number[]>(() => {
  if (!timeRange.value || timeRange.value.first_year === 0) return [];
  const years: number[] = [];
  for (let y = timeRange.value.last_year; y >= timeRange.value.first_year; y--) {
    years.push(y);
  }
  return years;
});

const filteredRows = computed<YearMonthRow[]>(() => {
  if (!data.value) return [];
  const rows = data.value.rows;
  if (!timeRange.value) return rows;

  const currentYearStr = String(timeRange.value.current_year);
  const currentMonth = timeRange.value.current_month;

  return rows.filter((row) => {
    if (row.level === "month" && row.year === currentYearStr) {
      const m = Number(row.month);
      if (m > currentMonth && isRowZero(row)) {
        return false;
      }
    }
    return true;
  });
});

function isRowZero(row: YearMonthRow): boolean {
  const parseValue = (val: string) => {
    if (!val) return 0;
    const cleaned = val.replace(/\s/g, "").replace(/,/g, ".").replace(/[^0-9.-]/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };
  return parseValue(row.gross) === 0 && parseValue(row.after_withholding) === 0 && parseValue(row.net) === 0;
}

function toggleYearDropdown() {
  if (yearDropdownOpen.value) {
    yearDropdownOpen.value = false;
    loadData();
  } else {
    yearDropdownOpen.value = true;
  }
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
    })
    .catch(() => {});
  loadData();
}

function clearYearFilter() {
  selectedYears.value = [];
  loadData();
}

function loadData() {
  loading.value = true;
  errorMsg.value = null;
  yearDropdownOpen.value = false;
  const depotIds = selectedDepotId.value != null ? [selectedDepotId.value] : undefined;
  const years = selectedYears.value.length > 0 ? selectedYears.value : undefined;
  storeAnalyses
    .fetchDividendsByYearMonthData(years, depotIds)
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

function formatPeriod(row: YearMonthRow): string {
  if (row.level === "year") {
    return row.year;
  }
  const m = Number(row.month);
  if (isNaN(m) || m < 1 || m > 12) return row.period;
  return new Date(2000, m - 1, 1).toLocaleString(locale.value === "de" ? "de-DE" : "en-US", { month: "long" });
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  Promise.all([storeDepots.fetchDepots(), storeDividendEntries.fetchTimeRange()])
    .then(([, range]) => {
      timeRange.value = range;
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

