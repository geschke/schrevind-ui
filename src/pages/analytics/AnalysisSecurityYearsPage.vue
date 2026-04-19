<template>
  <TheMainLayout>
    <template #default>
      <div class="col-12">
        <h2>{{ pageTitle }}</h2>

        <div v-if="loading" class="text-center py-4">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">{{ t("common.loading") }}</span>
          </div>
        </div>

        <div v-else-if="analysis" class="card">
          <div class="card-body">
            <AnalysisTable :analysis="analysis" />
          </div>
        </div>

        <div v-else class="alert alert-warning" role="alert">
          {{ t("analyses.errors.loadFailed") }}
        </div>
      </div>

      <GToast ref="toast" :_maxNumber="0" _placement="top-50 start-50 translate-middle" />
    </template>
  </TheMainLayout>
</template>

<script setup lang="ts">
import AnalysisTable from "@/components/analyses/AnalysisTable.vue";
import { getErrorCode } from "@/helper/errorCode";
import TheMainLayout from "@/layouts/TheMainLayout.vue";
import { useAnalysesStore } from "@/stores/analyses";
import { GToast, GToastDanger } from "goar-components";
import type { GToastContent } from "goar-components";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const storeAnalyses = useAnalysesStore();
const toast: any = ref(null);
const loading = ref(false);
const analysis = computed(() => storeAnalyses.getCurrentAnalysis);
const pageTitle = computed(() => {
  return analysis.value?.title_key ? t(analysis.value.title_key) : t("analyses.dividends_by_security_year.title");
});

onMounted(() => {
  loading.value = true;
  storeAnalyses
    .fetchDividendsBySecurityYearAnalysis()
    .catch((requestError: unknown) => {
      toast.value?.addToast(<GToastContent>{
        ...GToastDanger,
        title: t("analyses.common.errorTitle"),
        content: errorContent(getErrorCode(requestError)),
      });
    })
    .finally(() => {
      loading.value = false;
    });
});

function errorContent(errorCode: string) {
  switch (errorCode) {
    case "UNSUPPORTED_ANALYSIS_TYPE":
      return t("analyses.errors.unsupportedType");
    case "UNAUTHORIZED":
    case "AUTH_NOT_CONFIGURED":
    case "NETWORK_ERROR":
    case "DB_ERROR":
    case "DB_NOT_INITIALIZED":
      return t("analyses.errors.loadFailed");
    default:
      return t("analyses.errors.unknown");
  }
}
</script>
