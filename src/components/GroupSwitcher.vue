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
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useUserAuthStore } from "@/stores/userauth";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const storeUserAuth = useUserAuthStore();

const groups = computed(() => storeUserAuth.getGroups);
const activeGroupID = computed(() => storeUserAuth.activeGroupID);
const activeGroup = computed(() => storeUserAuth.getActiveGroup);
const hasMultipleGroups = computed(() => storeUserAuth.hasMultipleGroups);

function switchGroup(id: number) {
  if (id === activeGroupID.value) return;
  storeUserAuth.setActiveGroup(id);
}
</script>
