<template>
  <TheMainLayout>
    <template #default>
      <div class="col-12 mb-4">
        <h2>{{ t("overview.title") }}</h2>
        <p class="text-muted mb-0">{{ t("overview.description") }}</p>
      </div>

      <div class="col-xl-3 col-lg-6 mb-4">
        <div class="card h-100 shadow-sm">
          <div class="card-body">
            <div class="d-flex align-items-center gap-3 mb-3">
              <div class="overview-icon bg-info-subtle text-info">
                <i class="bi bi-cash-coin"></i>
              </div>
              <div>
                <h3 class="h5 mb-1">{{ t("overview.cards.dividendEntries.title") }}</h3>
                <p class="text-muted mb-0">{{ t("overview.cards.dividendEntries.description") }}</p>
              </div>
            </div>

            <router-link class="btn btn-info" :to="{ name: 'dividendentrynew' }">
              {{ t("overview.cards.dividendEntries.action") }}
            </router-link>
          </div>
        </div>
      </div>

      <div class="col-xl-3 col-lg-6 mb-4">
        <div class="card h-100 shadow-sm">
          <div class="card-body">
            <div class="d-flex align-items-center gap-3 mb-3">
              <div class="overview-icon bg-primary-subtle text-primary">
                <i class="bi bi-bank"></i>
              </div>
              <div>
                <h3 class="h5 mb-1">{{ t("overview.cards.depots.title") }}</h3>
                <p class="text-muted mb-0">{{ t("overview.cards.depots.description") }}</p>
              </div>
            </div>

            <router-link class="btn btn-primary" :to="{ name: 'depots' }">
              {{ t("overview.cards.depots.action") }}
            </router-link>
          </div>
        </div>
      </div>

      <div class="col-xl-3 col-lg-6 mb-4">
        <div class="card h-100 shadow-sm">
          <div class="card-body">
            <div class="d-flex align-items-center gap-3 mb-3">
              <div class="overview-icon bg-success-subtle text-success">
                <i class="bi bi-graph-up-arrow"></i>
              </div>
              <div>
                <h3 class="h5 mb-1">{{ t("overview.cards.securities.title") }}</h3>
                <p class="text-muted mb-0">{{ t("overview.cards.securities.description") }}</p>
              </div>
            </div>

            <router-link class="btn btn-success" :to="{ name: 'securities' }">
              {{ t("overview.cards.securities.action") }}
            </router-link>
          </div>
        </div>
      </div>

      <div class="col-xl-3 col-lg-6 mb-4">
        <div class="card h-100 shadow-sm">
          <div class="card-body">
            <div class="d-flex align-items-center gap-3 mb-3">
              <div class="overview-icon bg-warning-subtle text-warning">
                <i class="bi bi-percent"></i>
              </div>
              <div>
                <h3 class="h5 mb-1">{{ t("overview.cards.withholdingTaxDefaults.title") }}</h3>
                <p class="text-muted mb-0">{{ t("overview.cards.withholdingTaxDefaults.description") }}</p>
              </div>
            </div>

            <router-link class="btn btn-warning" :to="{ name: 'withholdingtaxdefaults' }">
              {{ t("overview.cards.withholdingTaxDefaults.action") }}
            </router-link>
          </div>
        </div>
      </div>

      <div class="col-xl-3 col-lg-6 mb-4">
        <div class="card h-100 shadow-sm">
          <div class="card-body">
            <div class="d-flex align-items-center gap-3 mb-3">
              <div class="overview-icon bg-dark-subtle text-dark">
                <i class="bi bi-currency-exchange"></i>
              </div>
              <div>
                <h3 class="h5 mb-1">{{ t("overview.cards.currencies.title") }}</h3>
                <p class="text-muted mb-0">{{ t("overview.cards.currencies.description") }}</p>
              </div>
            </div>

            <router-link class="btn btn-dark" :to="{ name: 'currencies' }">
              {{ t("overview.cards.currencies.action") }}
            </router-link>
          </div>
        </div>
      </div>

      <div class="col-xl-3 col-lg-6 mb-4">
        <div class="card h-100 shadow-sm">
          <div class="card-body">
            <div class="d-flex align-items-center gap-3 mb-3">
              <div class="overview-icon bg-secondary-subtle text-secondary">
                <i class="bi bi-people"></i>
              </div>
              <div>
                <h3 class="h5 mb-1">{{ t("overview.cards.users.title") }}</h3>
                <p class="text-muted mb-0">{{ t("overview.cards.users.description") }}</p>
              </div>
            </div>

            <router-link class="btn btn-outline-secondary" :to="{ name: 'adminusers' }">
              {{ t("overview.cards.users.action") }}
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
.overview-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}
</style>
