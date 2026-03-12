<template>
  <TheMainLayout>
    <template #default>
      <h2>{{ t("adminOverview.title") }}</h2>
      <div class="row">
      <div class="col-12 m-3">
      <ul>
      <li><router-link to="/admin/user" class="nav-link">{{ t("adminOverview.links.users") }}</router-link>
      </li>
      </ul>

      </div>

       <!-- <div
          class="col-3 m-3"
          v-for="thumbnail in thumbnails"
          :key="thumbnail.ID"
        >
          <DocumentListItem :thumbnail="thumbnail"></DocumentListItem>
        </div> -->

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
