<template>
  <TheMainLayout>
    <template #default>
      <div class="col-12">
        <h2>{{ t("analyses.dividends_by_year.title") }}</h2>

        <!-- Filter card -->
        <div class="card mb-3">
          <div class="card-body py-2">
            <div class="d-flex flex-wrap align-items-end gap-3">
              <!-- Depot filter -->
              <div>
                <div class="form-label text-secondary small mb-1 text-uppercase fw-semibold">{{ t("analyses.charts.common.depots") }}</div>
                <select class="form-select form-select-sm" v-model="selectedDepotId" @change="loadData">
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
        <div v-else-if="data && data.rows.length === 0" class="alert alert-info" role="alert">
          {{ t("analyses.common.empty") }}
        </div>

        <!-- Table -->
        <div v-else-if="data" class="table-responsive">
          <table class="table table-sm table-bordered table-hover align-middle">
            <thead class="table-light">
              <tr>
                <th>{{ t("analyses.common.year") }}</th>
                <th class="text-end">{{ t("analyses.dividends_by_year.columns.gross") }} ({{ data.currency }})</th>
                <th class="text-end">{{ t("analyses.dividends_by_year.columns.after_withholding") }} ({{ data.currency }})</th>
                <th class="text-end">{{ t("analyses.dividends_by_year.columns.net") }} ({{ data.currency }})</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in data.rows" :key="idx">
                <td>{{ row.year }}</td>
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
import type { YearData } from "@/types/analyses";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const storeAnalyses = useAnalysesStore();
const storeDepots = useDepotsStore();

const loading = ref(false);
const errorMsg = ref<string | null>(null);
const data = ref<YearData | null>(null);
const selectedDepotId = ref<number | null>(null);

function loadData() {
  loading.value = true;
  errorMsg.value = null;
  const depotIds = selectedDepotId.value != null ? [selectedDepotId.value] : undefined;
  storeAnalyses
    .fetchDividendsByYearData(depotIds)
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
  storeDepots
    .fetchDepots()
    .then(() => loadData())
    .catch(() => {
      errorMsg.value = t("analyses.errors.loadFailed");
    });
});
</script>

