<template>
  <TheMainLayout v-if="isAuthenticated">
    <template #default>
      <div class="d-flex flex-column align-items-center justify-content-center text-center py-5">
        <i class="bi bi-compass text-secondary" style="font-size: 5rem;"></i>
        <h1 class="display-4 fw-bold mt-4">404</h1>
        <p class="lead text-secondary mt-2">{{ t("notFound.description") }}</p>
        <router-link to="/" class="btn btn-primary mt-4">
          {{ t("notFound.backHome") }}
        </router-link>
      </div>
    </template>
  </TheMainLayout>

  <TheLandingLayout v-else>
    <template #mainContent>
      <div class="d-flex flex-column align-items-center justify-content-center text-center" style="min-height: 80vh;">
        <i class="bi bi-compass text-secondary" style="font-size: 5rem;"></i>
        <h1 class="display-4 fw-bold mt-4">404</h1>
        <p class="lead text-secondary mt-2">{{ t("notFound.description") }}</p>
        <router-link to="/" class="btn btn-primary mt-4">
          {{ t("notFound.backHome") }}
        </router-link>
      </div>
    </template>
  </TheLandingLayout>
</template>

<script setup lang="ts">
import TheMainLayout from "@/layouts/TheMainLayout.vue";
import TheLandingLayout from "@/layouts/TheLandingLayout.vue";
import { useUserAuthStore } from "@/stores/userauth";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const storeUserAuth = useUserAuthStore();
const isAuthenticated = computed(() => storeUserAuth.isAuthenticated);
</script>
