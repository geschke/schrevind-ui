<template>
  <TheMainLayout>
    <template #default>
      <h2>{{ t("overview.title") }}</h2>

      <h3>
      <router-link :to="{ name: 'comments' }"><i class="bi bi-chat-dots"/></router-link>&nbsp;&nbsp;&nbsp;<router-link :to="{ name: 'comments' }">{{ t("overview.commentsLink") }}</router-link>
    </h3>

    </template>
  </TheMainLayout>
</template>

<script setup lang="ts">
import TheMainLayout from "@/layouts/TheMainLayout.vue";
import { useI18n } from "vue-i18n";
import { onMounted } from 'vue'

const { t } = useI18n();


onMounted(() => {


  


});



</script>

<style scoped></style>
