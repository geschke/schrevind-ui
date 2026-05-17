<template>
  <li class="nav-item dropdown me-2" v-if="hasMultipleGroups">
    <a
      class="nav-link dropdown-toggle d-flex align-items-center gap-1"
      href="#"
      role="button"
      data-bs-toggle="dropdown"
      aria-expanded="false"
      :aria-label="t('layout.topbar.groupSwitcher.ariaLabel')"
    >
      <i class="bi bi-people-fill"></i>
      <span class="d-none d-md-inline">{{ activeGroup?.Name ?? t('layout.topbar.groupSwitcher.label') }}</span>
    </a>
    <ul class="dropdown-menu dropdown-menu-end">
      <li v-for="group in groups" :key="group.ID">
        <button
          class="dropdown-item d-flex align-items-center gap-2"
          :class="{ active: group.ID === activeGroupID }"
          @click.prevent="switchGroup(group.ID)"
        >
          <i class="bi bi-check2" v-if="group.ID === activeGroupID"></i>
          <i class="bi bi-dash" v-else style="visibility: hidden;"></i>
          {{ group.Name }}
          <span v-if="group.Role" class="badge bg-secondary ms-auto text-lowercase">{{ group.Role }}</span>
        </button>
      </li>
    </ul>
  </li>
  <GToast ref="toast" />
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useUserAuthStore } from "@/stores/userauth";
import { getErrorCode } from "@/helper/errorCode";
import { GToast, GToastWarning } from "goar-components";
import type { GToastContent } from "goar-components";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const storeUserAuth = useUserAuthStore();
const toast: any = ref(null);

const groups = computed(() => storeUserAuth.getGroups);
const activeGroupID = computed(() => storeUserAuth.activeGroupID);
const activeGroup = computed(() => storeUserAuth.getActiveGroup);
const hasMultipleGroups = computed(() => storeUserAuth.hasMultipleGroups);

function errorContent(code: string): string {
  switch (code) {
    case "UNAUTHORIZED":        return t("layout.topbar.groupSwitcher.errors.UNAUTHORIZED");
    case "FORBIDDEN":           return t("layout.topbar.groupSwitcher.errors.FORBIDDEN");
    case "INVALID_GROUP_ID":    return t("layout.topbar.groupSwitcher.errors.INVALID_GROUP_ID");
    case "DB_NOT_INITIALIZED":  return t("layout.topbar.groupSwitcher.errors.DB_NOT_INITIALIZED");
    case "AUTH_NOT_CONFIGURED": return t("layout.topbar.groupSwitcher.errors.AUTH_NOT_CONFIGURED");
    case "INVALID_JSON":        return t("layout.topbar.groupSwitcher.errors.INVALID_JSON");
    case "DB_ERROR":            return t("layout.topbar.groupSwitcher.errors.DB_ERROR");
    default:                    return t("layout.topbar.groupSwitcher.errors.switchFailed");
  }
}

function switchGroup(id: number) {
  if (id === activeGroupID.value) return;
  storeUserAuth
    .setActiveGroup(id)
    .then(() => {
      if (route.meta.contextSensitive) {
        void router.push(String(route.meta.menuPath));
      }
    })
    .catch((error: unknown) => {
      toast.value?.addToast(<GToastContent>{
        ...GToastWarning,
        title: t("layout.topbar.groupSwitcher.label"),
        content: errorContent(getErrorCode(error)),
      });
    });
}
</script>
