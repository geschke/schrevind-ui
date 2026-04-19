<template>
  <TheMainLayout>
    <template #default>
      <div class="col-12 mb-4">
        <h2>{{ t("analyses.overview.title") }}</h2>
        <p class="text-muted mb-0">{{ t("analyses.overview.description") }}</p>
      </div>

      <div class="col-xl-3 col-lg-6 mb-4">
        <div class="card h-100 shadow-sm">
          <div class="card-body">
            <div class="d-flex align-items-center gap-3 mb-3">
              <div class="analysis-icon bg-warning-subtle text-warning">
                <i class="bi bi-bar-chart-line-fill"></i>
              </div>
              <div>
                <h3 class="h5 mb-1">{{ t("analyses.charts.dividends_by_year.title") }}</h3>
                <p class="text-muted mb-0">{{ t("analyses.charts.dividends_by_year.description") }}</p>
              </div>
            </div>

            <router-link class="btn btn-warning" :to="{ name: 'analyticscharts' }">
              {{ t("analyses.charts.action") }}
            </router-link>
          </div>
        </div>
      </div>

      <div class="col-xl-3 col-lg-6 mb-4">
        <div class="card h-100 shadow-sm">
          <div class="card-body">
            <div class="d-flex align-items-center gap-3 mb-3">
              <div class="analysis-icon bg-primary-subtle text-primary">
                <i class="bi bi-bar-chart-line"></i>
              </div>
              <div>
                <h3 class="h5 mb-1">{{ t("analyses.dividends_by_year.title") }}</h3>
                <p class="text-muted mb-0">{{ t("analyses.dividends_by_year.description") }}</p>
              </div>
            </div>

            <router-link class="btn btn-primary" :to="{ name: 'analysisyears' }">
              {{ t("analyses.dividends_by_year.action") }}
            </router-link>
          </div>
        </div>
      </div>

      <div class="col-xl-3 col-lg-6 mb-4">
        <div class="card h-100 shadow-sm">
          <div class="card-body">
            <div class="d-flex align-items-center gap-3 mb-3">
              <div class="analysis-icon bg-info-subtle text-info">
                <i class="bi bi-calendar-month"></i>
              </div>
              <div>
                <h3 class="h5 mb-1">{{ t("analyses.dividends_by_year_month.title") }}</h3>
                <p class="text-muted mb-0">{{ t("analyses.dividends_by_year_month.description") }}</p>
              </div>
            </div>

            <router-link class="btn btn-info" :to="{ name: 'analysismonths' }">
              {{ t("analyses.dividends_by_year_month.action") }}
            </router-link>
          </div>
        </div>
      </div>

      <div class="col-xl-3 col-lg-6 mb-4">
        <div class="card h-100 shadow-sm">
          <div class="card-body">
            <div class="d-flex align-items-center gap-3 mb-3">
              <div class="analysis-icon bg-success-subtle text-success">
                <i class="bi bi-graph-up"></i>
              </div>
              <div>
                <h3 class="h5 mb-1">{{ t("analyses.dividends_by_security_year.title") }}</h3>
                <p class="text-muted mb-0">{{ t("analyses.dividends_by_security_year.description") }}</p>
              </div>
            </div>

            <router-link class="btn btn-success" :to="{ name: 'analysissecurityyears' }">
              {{ t("analyses.dividends_by_security_year.action") }}
            </router-link>
          </div>
        </div>
      </div>
    </template>
  </TheMainLayout>
</template>

<script setup lang="ts">
import TheMainLayout from "@/layouts/TheMainLayout.vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>

<style scoped>
.analysis-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}
</style>
