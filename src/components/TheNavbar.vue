<template>
  <div id="layoutSidenav_nav">
    <nav class="ui-sidenav" id="sidenavAccordion">
      <div class="ui-sidenav-menu">
        <div class="nav">
          <div v-for="item in sidebarMenu">
            <div class="ui-sidenav-menu-heading">
            </div>
            <the-navbar-item v-if="item.sub" :items="item.sub" :menu-path="menuPath()"></the-navbar-item>
          </div>
        </div>
      </div>

    </nav>
  </div>
</template>

<script setup lang="ts">
import TheNavbarItem from "@/components/TheNavbarItem.vue";
import type { SidebarItem } from "@/types/navigation";
import { usePermissions } from "@/composables/usePermissions";
import { useUserAuthStore } from "@/stores/userauth";
import { computed } from "vue";
import { useRoute } from "vue-router";

interface Props {
  menuPath?: string,
}

const props = withDefaults(defineProps<Props>(), {
  menuPath: '',
});

const { canManageUsers } = usePermissions();
const storeUserAuth = useUserAuthStore();
const route = useRoute();

const activeGroupID = computed(() => storeUserAuth.activeGroupID);

const activeMenuPath = computed(() => {
  // Own group's members page → highlight "Mitglieder" nav item
  if (route.name === 'admingroupmembers' && String(route.params.id) === String(activeGroupID.value)) {
    return `/admin/group/${activeGroupID.value}/members`;
  }
  return props.menuPath !== '' ? props.menuPath : route.path;
});
const menuPath = () => activeMenuPath.value;

const sidebarMenu = computed<SidebarItem[]>(() => {
  const adminItems: SidebarItem[] = [
    ...(storeUserAuth.isSystemContext ? [{ title: "nav.items.users", type: "item" as const, icon: "bi bi-people", url: "/admin/user" }] : []),
    ...(canManageUsers.value ? [{ title: "nav.items.groups", type: "item" as const, icon: "bi bi-people-fill", url: "/admin/group" }] : []),
  ];

  const membersItems: SidebarItem[] = activeGroupID.value != null
    ? [{ title: "nav.items.groupMembers", type: "item", icon: "bi bi-person-lines-fill", url: `/admin/group/${activeGroupID.value}/members` }]
    : [];

  const menu: SidebarItem[] = [
    {
      title: "",
      type: "main",
      sub: [
        { title: "nav.items.overview", type: "item", icon: "bi bi-grid-1x2", url: "/overview" },
        {
          title: "analyses.menu",
          type: "subitem",
          icon: "bi bi-bar-chart-line",
          sub: [
            { title: "analyses.overview.menu", type: "item", icon: "bi bi-grid-1x2", url: "/analytics" },
            { title: "analyses.charts.menu", type: "item", icon: "bi bi-bar-chart-line-fill", url: "/analytics/charts" },
            { title: "analyses.charts.dividends_by_year_month.title", type: "item", icon: "bi bi-bar-chart-fill", url: "/analytics/month-charts" },
            { title: "analyses.dividends_by_year.title", type: "item", icon: "bi bi-calendar3", url: "/analytics/years" },
            { title: "analyses.dividends_by_year_month.title", type: "item", icon: "bi bi-calendar-month", url: "/analytics/months" },
            { title: "analyses.dividends_by_security_year_data.title", type: "item", icon: "bi bi-graph-up", url: "/analytics/security-years" },
{ title: "analyses.dividends_by_year_month_security_data.title", type: "item", icon: "bi bi-table", url: "/analytics/month-security" },
          ],
        },
        { title: "nav.items.dividendEntryAdd", type: "item", icon: "bi bi-plus-circle", url: "/dividend-entries/new" },
        { title: "nav.items.dividendEntries", type: "item", icon: "bi bi-cash-coin", url: "/dividend-entries" },
        { title: "nav.items.depots", type: "item", icon: "bi bi-bank", url: "/depots" },
        { title: "nav.items.securities", type: "item", icon: "bi bi-graph-up-arrow", url: "/securities" },
        { title: "nav.items.withholdingTaxDefaults", type: "item", icon: "bi bi-percent", url: "/withholding-tax-defaults" },
        { title: "nav.items.currencies", type: "item", icon: "bi bi-currency-exchange", url: "/currencies" },
        ...membersItems,
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
