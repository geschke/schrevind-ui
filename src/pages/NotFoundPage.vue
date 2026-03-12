<template>
  <TheMainLayout>
    <template #default>
      <div class="row">
        <div class="col-12">
          <h1 class="mt-4">
            {{ t("notFound.title") }}

          </h1>
          <div class="card mt-4">
            <div class="row no-gutters">
              <div class="col-md-4">
                <img
                  src="https://dummyimage.com/600x400/34495e/fff"
                  class="card-img"/>
              </div>
              <div class="col-md-8">
                <div class="card-body">
                  <div class="row">
                    <div class="col-9">
                      <h5 class="card-title mb-4">{{ t("notFound.productTitle") }}</h5>
                    </div>
                    <div class="col-3">
                      <div class="d-grid">
                        <button class="btn bg-vue2">15 €</button>
                      </div>
                    </div>
                  </div>
                  <div class="row">
                    <div class="col-12">
                      {{ t("notFound.description") }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
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

<style scoped></style>
