<template>
  <TheMainLayout>
    <template #default>
      <div class="col-12">
        <h2>{{ t("analytics.months.title") }}</h2>

        <div class="alert alert-info" role="alert">
          {{ t("analytics.common.placeholder") }}
        </div>

        <div class="card">
          <div class="card-body">
            <h3 class="h5">{{ t("analytics.months.dummyTitle") }}</h3>
            <p class="mb-0">{{ t("analytics.months.dummyText") }}</p>
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
