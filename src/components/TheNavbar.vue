<template>
  <div id="layoutSidenav_nav">
    <nav class="sb-sidenav accordion sb-sidenav-dark" id="sidenavAccordion">
      <div class="sb-sidenav-menu">
        <div class="nav">
          <div v-for="item in sidebarMenu">
            <div class="sb-sidenav-menu-heading">
            </div>
            <the-navbar-item v-if="item.sub" :items="item.sub" :menu-path="menuPath()"></the-navbar-item>
          </div>
        </div>
      </div>

      <div class="sb-sidenav-footer">
        <div class="small">{{ t("layout.loggedInAs") }}</div>
        {{ storeUserAuth.firstname }} {{ storeUserAuth.lastname }}
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import TheNavbarItem from "@/components/TheNavbarItem.vue";
import type { SidebarItem } from "@/types/navigation";
import { usePermissions } from "@/composables/usePermissions";
import { useUserAuthStore } from "../stores/userauth";
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";

interface Props {
  menuPath?: string,
}

const props = withDefaults(defineProps<Props>(), {
  menuPath: '',
});

const storeUserAuth = useUserAuthStore();
const { canManageUsers } = usePermissions();
const route = useRoute();
const { t } = useI18n();

const activeMenuPath = computed(() => (props.menuPath != '' ? props.menuPath : route.path));
const menuPath = () => activeMenuPath.value;

const sidebarMenu = computed<SidebarItem[]>(() => {
  const adminItems: SidebarItem[] = canManageUsers.value
    ? [
        { title: "nav.items.users", type: "item", icon: "bi bi-people", url: "/admin/user" },
        { title: "nav.items.groups", type: "item", icon: "bi bi-people-fill", url: "/admin/group" },
      ]
    : [];

  const menu: SidebarItem[] = [
    {
      title: "",
      type: "main",
      sub: [
        { title: "nav.items.overview", type: "item", icon: "bi bi-grid-1x2", url: "/overview" },
        {
          title: "nav.items.analyses",
          type: "subitem",
          icon: "bi bi-bar-chart-line",
          sub: [
            { title: "nav.items.analysisOverview", type: "item", icon: "bi bi-grid-1x2", url: "/analytics" },
            { title: "nav.items.analysisYears", type: "item", icon: "bi bi-calendar3", url: "/analytics/years" },
            { title: "nav.items.analysisMonths", type: "item", icon: "bi bi-calendar-month", url: "/analytics/months" },
          ],
        },
        { title: "nav.items.dividendEntryAdd", type: "item", icon: "bi bi-plus-circle", url: "/dividend-entries/new" },
        { title: "nav.items.dividendEntries", type: "item", icon: "bi bi-cash-coin", url: "/dividend-entries" },
        { title: "nav.items.depots", type: "item", icon: "bi bi-bank", url: "/depots" },
        { title: "nav.items.securities", type: "item", icon: "bi bi-graph-up-arrow", url: "/securities" },
        { title: "nav.items.withholdingTaxDefaults", type: "item", icon: "bi bi-percent", url: "/withholding-tax-defaults" },
        { title: "nav.items.currencies", type: "item", icon: "bi bi-currency-exchange", url: "/currencies" },
        ...adminItems,
      ],
    },
  ];

  markCollapse(menu, activeMenuPath.value);

  return menu;
});

function markCollapse(menu: SidebarItem[], targetUrl: string): boolean {
  let hasActiveItem = false;

  for (const item of menu) {
    const itemIsActive = item.url === targetUrl;
    const childIsActive = item.sub ? markCollapse(item.sub, targetUrl) : false;

    item.show = itemIsActive || childIsActive;

    if (item.show) {
      hasActiveItem = true;
    }
  }

  return hasActiveItem;
}
</script>

<style scoped></style>
