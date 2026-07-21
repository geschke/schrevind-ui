<template>
  <TheMainLayout>
    <template #default>
      <div class="col-12">
        <h2>{{ t("analyses.dividends_by_security_year_data.title") }}</h2>

        <!-- Filter -->
        <div class="mb-3">
          <div class="row g-2 align-items-start">
            <!-- Security multi-select + reload button -->
            <div class="col-12 col-md-8">
              <div ref="dropdownRef" class="position-relative">
                <div class="input-group input-group-sm">
                  <button
                    type="button"
                    class="btn btn-outline-secondary"
                    @click.stop="toggleDropdown"
                  >
                    <i class="bi bi-funnel me-1"></i>
                    <span v-if="selectedSecurityIds.length === 0">{{ t("analyses.dividends_by_security_year_data.allSecurities") }}</span>
                    <span v-else>{{ t("analyses.dividends_by_security_year_data.nSecurities", { n: selectedSecurityIds.length }) }}</span>
                    <i class="bi bi-chevron-down ms-1"></i>
                  </button>
                  <button
                    v-if="selectedSecurityIds.length > 0"
                    type="button"
                    class="btn btn-outline-secondary"
                    @click="clearSecurityFilter"
                  >
                    <i class="bi bi-x"></i>
                  </button>
                  <button
                    type="button"
                    class="btn btn-primary"
                    :disabled="loading"
                    @click="loadData"
                  >
                    <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    {{ t("analyses.dividends_by_security_year_data.loadButton") }}
                  </button>
                </div>

                <div
                  v-if="securityDropdownOpen"
                  class="position-absolute bg-body border rounded shadow-sm p-2 mt-1"
                  style="z-index: 1050; min-width: 420px; max-height: 280px; overflow-y: auto;"
                  @click.stop
                >
                  <input
                    type="text"
                    class="form-control form-control-sm mb-2"
                    v-model="securitySearch"
                    :placeholder="t('analyses.dividends_by_security_year_data.securitySearchPlaceholder')"
                  />
                  <div v-if="filteredSecurities.length === 0" class="text-muted small px-1">
                    {{ t("analyses.dividends_by_security_year_data.noSecurities") }}
                  </div>
                  <div v-for="security in filteredSecurities" :key="security.ID" class="form-check">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      :id="`sec-${security.ID}`"
                      :value="security.ID"
                      v-model="selectedSecurityIds"
                    />
                    <label class="form-check-label small" :for="`sec-${security.ID}`">
                      {{ security.Name }}
                      <span class="text-muted ms-1">{{ security.ISIN }}</span>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Chips for selected securities -->
              <div v-if="selectedSecurityIds.length > 0" class="d-flex flex-wrap gap-1 mt-1">
                <span
                  v-for="id in selectedSecurityIds"
                  :key="id"
                  class="badge bg-primary d-inline-flex align-items-center gap-1"
                >
                  {{ securityNameById(id) }}
                  <button
                    type="button"
                    class="btn-close btn-close-white"
                    style="font-size: 0.5rem;"
                    :aria-label="t('analyses.dividends_by_security_year_data.removeSecurityFilter')"
                    @click="removeSecurityById(id)"
                  ></button>
                </span>
              </div>
            </div>

            <!-- Depot filter -->
            <div class="col-12 col-md-4">
              <select class="form-select form-select-sm" v-model="selectedDepotId" @change="loadData">
                <option :value="null">{{ t("analyses.charts.common.allDepots") }}</option>
                <option v-for="depot in storeDepots.getDepots" :key="depot.ID" :value="depot.ID">
                  {{ depot.Name }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="text-center py-4">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">{{ t("common.loading") }}</span>
          </div>
        </div>

        <!-- Error: cause shown as toast, area shows the resulting empty state -->
        <div v-else-if="errorMsg" class="alert alert-info" role="alert">
          {{ t("analyses.common.empty") }}
        </div>

        <!-- Empty -->
        <div v-else-if="data && data.securities.length === 0" class="alert alert-info" role="alert">
          {{ t("analyses.common.empty") }}
        </div>

        <!-- Table -->
        <div v-else-if="data" class="table-responsive">
          <table class="table table-sm table-bordered table-hover align-middle">
            <thead class="table-light">
              <tr>
                <th>{{ t("analyses.dividends_by_security_year_data.columns.year") }}</th>
                <th class="text-end">{{ t("analyses.dividends_by_security_year_data.columns.quantity") }}</th>
                <th class="text-end">{{ t("analyses.dividends_by_security_year_data.columns.gross") }} ({{ data.currency }})</th>
                <th class="text-end">{{ t("analyses.dividends_by_security_year_data.columns.after_withholding") }} ({{ data.currency }})</th>
                <th class="text-end">{{ t("analyses.dividends_by_security_year_data.columns.net") }} ({{ data.currency }})</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="security in data.securities" :key="security.security_id + '_' + security.security_isin">
                <!-- Security group header -->
                <tr class="table-secondary">
                  <td colspan="5" class="fw-semibold">
                    {{ security.security_name }}
                    <span class="text-muted fw-normal ms-2 small">{{ security.security_isin }}</span>
                  </td>
                </tr>
                <!-- Year/summary rows -->
                <tr
                  v-for="(row, idx) in security.rows"
                  :key="idx"
                  :class="{ 'fw-bold': row.type === 'summary' }"
                >
                  <td>
                    <template v-if="row.type === 'summary'">{{ t("analyses.dividends_by_security_year_data.summary") }}</template>
                    <template v-else>
                      {{ row.year }}
                      <span v-if="row.payment_count > 0" class="badge text-bg-secondary ms-2" style="font-size: 0.7em;" :title="t('analyses.dividends_by_security_year_data.paymentCount', { count: row.payment_count, year: row.year })">{{ row.payment_count }}×</span>
                    </template>
                  </td>
                  <td class="text-end">{{ row.quantity }}</td>
                  <td class="text-end">{{ row.gross }}</td>
                  <td class="text-end">{{ row.after_withholding }}</td>
                  <td class="text-end">{{ row.net }}</td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>

      <GToast ref="toast" />
    </template>
  </TheMainLayout>
</template>

<script setup lang="ts">
import TheMainLayout from "@/layouts/TheMainLayout.vue";
import { useAnalysesStore } from "@/stores/analyses";
import { useDepotsStore } from "@/stores/depots";
import { useSecuritiesStore } from "@/stores/securities";
import type { SecurityYearData } from "@/types/analyses";
import { GToast, GToastDanger } from "goar-components";
import type { GToastContent } from "goar-components";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const storeAnalyses = useAnalysesStore();
const storeDepots = useDepotsStore();
const storeSecurities = useSecuritiesStore();

const loading = ref(false);
const errorMsg = ref<string | null>(null);
const data = ref<SecurityYearData | null>(null);
const toast = ref<InstanceType<typeof GToast> | null>(null);

function showErrorToast() {
  toast.value?.addToast(<GToastContent>{
    ...GToastDanger,
    title: t("analyses.common.errorTitle"),
    content: t("analyses.errors.loadFailed"),
  });
}

const securityDropdownOpen = ref(false);
const securitySearch = ref("");
const selectedSecurityIds = ref<number[]>([]);
const selectedDepotId = ref<number | null>(null);
const dropdownRef = ref<HTMLElement | null>(null);

const filteredSecurities = computed(() => {
  const search = securitySearch.value.toLowerCase().trim();
  const all = storeSecurities.getSecurities;
  if (!search) return all;
  return all.filter(
    (s) => s.Name.toLowerCase().includes(search) || s.ISIN.toLowerCase().includes(search),
  );
});

function securityNameById(id: number): string {
  return storeSecurities.getSecurities.find((s) => s.ID === id)?.Name ?? String(id);
}

function toggleDropdown() {
  if (securityDropdownOpen.value) {
    securityDropdownOpen.value = false;
    loadData();
  } else {
    securityDropdownOpen.value = true;
  }
}

function removeSecurityById(id: number) {
  selectedSecurityIds.value = selectedSecurityIds.value.filter((sid) => sid !== id);
  loadData();
}

function clearSecurityFilter() {
  selectedSecurityIds.value = [];
  loadData();
}

function handleClickOutside(event: MouseEvent) {
  if (securityDropdownOpen.value && dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    securityDropdownOpen.value = false;
    loadData();
  }
}

async function loadData() {
  loading.value = true;
  errorMsg.value = null;
  securityDropdownOpen.value = false;
  const depotIds = selectedDepotId.value != null ? [selectedDepotId.value] : undefined;
  const secIds = selectedSecurityIds.value.length > 0 ? selectedSecurityIds.value : undefined;
  storeAnalyses
    .fetchDividendsBySecurityYearData(secIds, depotIds)
    .then((result) => {
      data.value = result;
    })
    .catch(() => {
      errorMsg.value = t("analyses.errors.loadFailed");
      showErrorToast();
    })
    .finally(() => {
      loading.value = false;
    });
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  loading.value = true; // show spinner during the initial fetches, loadData() takes over afterwards
  Promise.all([
    storeDepots.fetchDepots(),
    storeSecurities.fetchAllSecurities({ sort: "Name", direction: "asc" }),
  ])
    .then(() => loadData())
    .catch(() => {
      loading.value = false;
      errorMsg.value = t("analyses.errors.loadFailed");
      showErrorToast();
    });
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>
