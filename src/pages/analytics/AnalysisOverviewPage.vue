<template>
  <TheMainLayout>
    <template #default>
      <div class="col-12 mb-4">
        <h2>{{ t("analytics.overview.title") }}</h2>
        <p class="text-muted mb-0">{{ t("analytics.overview.description") }}</p>
      </div>

      <div class="col-xl-3 col-lg-6 mb-4">
        <div class="card h-100 shadow-sm">
          <div class="card-body">
            <div class="d-flex align-items-center gap-3 mb-3">
              <div class="analysis-icon bg-primary-subtle text-primary">
                <i class="bi bi-calendar3"></i>
              </div>
              <div>
                <h3 class="h5 mb-1">{{ t("analytics.overview.cards.years.title") }}</h3>
                <p class="text-muted mb-0">{{ t("analytics.overview.cards.years.description") }}</p>
              </div>
            </div>

            <router-link class="btn btn-primary" :to="{ name: 'analysisyears' }">
              {{ t("analytics.overview.cards.years.action") }}
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
                <h3 class="h5 mb-1">{{ t("analytics.overview.cards.months.title") }}</h3>
                <p class="text-muted mb-0">{{ t("analytics.overview.cards.months.description") }}</p>
              </div>
            </div>

            <router-link class="btn btn-info" :to="{ name: 'analysismonths' }">
              {{ t("analytics.overview.cards.months.action") }}
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
