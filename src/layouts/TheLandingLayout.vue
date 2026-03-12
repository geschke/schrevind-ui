<template>
  <div>
    <div class="d-flex justify-content-end p-3">
      <LanguageSwitcher id-prefix="landingLocaleDropdown" />
    </div>
    <slot name="mainContent">
      <h1>{{ t("landing.mainContent") }}</h1>
    </slot>
  </div>
</template>

<script lang="ts">
import LanguageSwitcher from "@/components/helper/LanguageSwitcher.vue";
import { useI18n } from "vue-i18n";
export default {
  name: "TheLandingLayout",
  components: {
    LanguageSwitcher,
  },
  setup() {
    const { t } = useI18n();
    return { t };
  },
  props: {
    // just for fun and reference
    fullsize: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    rowClasses() {
      return [this.fullsize ? "h-100" : ""]; // height: 100%
    },
    containerClasses() {
      return ""; //layout-theme-light d-flex align-items-center py-4 bg-body-tertiary"; //[this.fullsize ? "vh-100" : ""]; // view-height
    },
  },
};
</script>

<style scoped></style>
