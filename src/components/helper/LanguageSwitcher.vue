<template>
  <div class="dropdown" :class="animate ? 'animate__animated animate__fadeInDown' : ''">
    <button
      type="button"
      :class="toggleClass"
      :id="dropdownId"
      data-bs-toggle="dropdown"
      aria-expanded="false"
    >
      <i class="bi bi-translate"></i>
      <transition
        mode="out-in"
        enter-active-class="animate__animated animate__fadeIn"
        leave-active-class="animate__animated animate__fadeOut"
      >
        <span :key="currentLocale" class="text-uppercase">{{ currentLocale }}</span>
      </transition>
    </button>

    <ul :class="menuClass" :aria-labelledby="dropdownId">
      <li v-for="item in localeOptions" :key="item.value">
        <button
          type="button"
          class="dropdown-item d-flex justify-content-between align-items-center"
          @click="changeLocale(item.value)"
        >
          <span>{{ item.label }}</span>
          <i v-if="currentLocale === item.value" class="bi bi-check2"></i>
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance } from "vue";
import { useI18n } from "vue-i18n";
import { getCurrentLocale, setLocale, type SupportedLocale } from "@/i18n";

const props = withDefaults(
  defineProps<{
    toggleClass?: string;
    menuClass?: string;
    idPrefix?: string;
    animate?: boolean;
  }>(),
  {
    toggleClass: "btn btn-sm btn-outline-secondary dropdown-toggle d-flex align-items-center gap-1",
    menuClass: "dropdown-menu dropdown-menu-end shadow-sm",
    idPrefix: "localeDropdown",
    animate: true,
  },
);

const { t } = useI18n();
const instance = getCurrentInstance();

const dropdownId = computed(() => `${props.idPrefix}-${instance?.uid ?? 0}`);

const localeOptions = computed<Array<{ value: SupportedLocale; label: string }>>(() => [
  { value: "de", label: t("layout.locale.de") },
  { value: "en", label: t("layout.locale.en") },
]);

const currentLocale = computed(() => getCurrentLocale());

function changeLocale(locale: SupportedLocale) {
  if (locale === currentLocale.value) return;
  setLocale(locale);
}
</script>
