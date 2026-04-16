import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";
//import HomePage from "@/pages/HomePage.vue";
//import OverviewPage from "@/pages/OverviewPage.vue";
//import ItemEditPage from "@/pages/ItemEditPage.vue";
//import ItemDetailPage from "@/pages/ItemDetailPage.vue";
//import NotFoundPage from "@/pages/NotFoundPage.vue";

import { useUserAuthStore } from "../stores/userauth";

declare module 'vue-router' {
  interface RouteMeta {
    menuPath?: string
    requiresAuth?: boolean
  }
}

// todo: authentication stuff, does not work currently, but with first resquest after login only. Strange. 

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    alias: "/home", // maybe necessary
    name: "home",
    //component: HomePage,
    component: () => import("@/pages/HomePage.vue"),
  },
  {
    path: "/overview",
    name: "overview",
    component: () => import("@/pages/OverviewPage.vue"),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: "/analytics",
    name: "analytics",
    component: () => import("@/pages/analytics/AnalysisOverviewPage.vue"),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: "/analytics/years",
    name: "analysisyears",
    component: () => import("@/pages/analytics/AnalysisYearsPage.vue"),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: "/analytics/months",
    name: "analysismonths",
    component: () => import("@/pages/analytics/AnalysisMonthsPage.vue"),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: "/depots",
    name: "depots",
    component: () => import("@/pages/depots/DepotListPage.vue"),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: "/depots/new",
    name: "depotnew",
    component: () => import("@/pages/depots/DepotAddPage.vue"),
    meta: {
      menuPath: "/depots",
      requiresAuth: true,
    },
  },
  {
    path: "/depots/edit/:id",
    name: "depotedit",
    props: true,
    component: () => import("@/pages/depots/DepotEditPage.vue"),
    meta: {
      menuPath: "/depots",
      requiresAuth: true,
    },
  },
  {
    path: "/depots/:id",
    name: "depotdetail",
    props: true,
    component: () => import("@/pages/depots/DepotDetailPage.vue"),
    meta: {
      menuPath: "/depots",
      requiresAuth: true,
    },
  },
  {
    path: "/securities",
    name: "securities",
    component: () => import("@/pages/securities/SecurityListPage.vue"),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: "/securities/new",
    name: "securitynew",
    component: () => import("@/pages/securities/SecurityAddPage.vue"),
    meta: {
      menuPath: "/securities",
      requiresAuth: true,
    },
  },
  {
    path: "/securities/edit/:id",
    name: "securityedit",
    props: true,
    component: () => import("@/pages/securities/SecurityEditPage.vue"),
    meta: {
      menuPath: "/securities",
      requiresAuth: true,
    },
  },
  {
    path: "/withholding-tax-defaults",
    name: "withholdingtaxdefaults",
    component: () => import("@/pages/withholdingTaxDefaults/WithholdingTaxDefaultListPage.vue"),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: "/withholding-tax-defaults/new",
    name: "withholdingtaxdefaultnew",
    component: () => import("@/pages/withholdingTaxDefaults/WithholdingTaxDefaultAddPage.vue"),
    meta: {
      menuPath: "/withholding-tax-defaults",
      requiresAuth: true,
    },
  },
  {
    path: "/withholding-tax-defaults/edit/:id",
    name: "withholdingtaxdefaultedit",
    props: true,
    component: () => import("@/pages/withholdingTaxDefaults/WithholdingTaxDefaultEditPage.vue"),
    meta: {
      menuPath: "/withholding-tax-defaults",
      requiresAuth: true,
    },
  },
  {
    path: "/currencies",
    name: "currencies",
    component: () => import("@/pages/currencies/CurrencyListPage.vue"),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: "/currencies/new",
    name: "currencynew",
    component: () => import("@/pages/currencies/CurrencyAddPage.vue"),
    meta: {
      menuPath: "/currencies",
      requiresAuth: true,
    },
  },
  {
    path: "/currencies/edit/:id",
    name: "currencyedit",
    props: true,
    component: () => import("@/pages/currencies/CurrencyEditPage.vue"),
    meta: {
      menuPath: "/currencies",
      requiresAuth: true,
    },
  },
  {
    path: "/dividend-entries",
    name: "dividendentries",
    component: () => import("@/pages/dividendEntries/DividendEntryListPage.vue"),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: "/dividend-entries/new",
    name: "dividendentrynew",
    component: () => import("@/pages/dividendEntries/DividendEntryAddPage.vue"),
    meta: {
      menuPath: "/dividend-entries/new",
      requiresAuth: true,
    },
  },
  {
    path: "/dividend-entries/edit/:id",
    name: "dividendentryedit",
    props: true,
    component: () => import("@/pages/dividendEntries/DividendEntryAddPage.vue"),
    meta: {
      menuPath: "/dividend-entries",
      requiresAuth: true,
    },
  },
  {
    path: "/admin",
    component: () => import("@/pages/admin/OverviewPage.vue"),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: "/admin/user",
    name: "adminusers",
    component: () => import("@/pages/admin/UserListPage.vue"),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: "/admin/user/new",
    name: "adminusernew",
    component: () => import("@/pages/admin/UserAddPage.vue"),
    meta: {
      menuPath: "/admin/user",
      requiresAuth: true,
    },
  },
  {
    path: "/admin/user/edit/:id",
    name: "adminuseredit",
    props: true,
    component: () => import("@/pages/admin/UserEditPage.vue"),
    meta: {
      menuPath: "/admin/user",
      requiresAuth: true,
    },
  },
  {
    path: "/admin/user/password/:id",
    name: "adminuserpassword",
    props: true,
    component: () => import("@/pages/admin/UserPasswordPage.vue"),
    meta: {
      menuPath: "/admin/user",
      requiresAuth: true,
    },
  },
  {
    path: "/admin/group",
    name: "admingroups",
    component: () => import("@/pages/admin/GroupListPage.vue"),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: "/admin/group/new",
    name: "admingroupnew",
    component: () => import("@/pages/admin/GroupAddPage.vue"),
    meta: {
      menuPath: "/admin/group",
      requiresAuth: true,
    },
  },
  {
    path: "/admin/group/edit/:id",
    name: "admingroupedit",
    props: true,
    component: () => import("@/pages/admin/GroupEditPage.vue"),
    meta: {
      menuPath: "/admin/group",
      requiresAuth: true,
    },
  },
  {
    path: "/admin/group/:id/members",
    name: "admingroupmembers",
    props: true,
    component: () => import("@/pages/admin/GroupMembersPage.vue"),
    meta: {
      menuPath: "/admin/group",
      requiresAuth: true,
    },
  },



  /*{
    path: "/about",
    name: "about",
    // route level code-splitting
    // this generates a separate chunk (About.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import("../views/AboutView.vue"),
  },*/
  {
    path: "/:pathMatch(.*)*",
    component: () => import("@/pages/NotFoundPage.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(), //import.meta.env.BASE_URL),
  routes: routes,
});

// todo: Autologin or something like this based on session cookies

router.beforeEach(async (to) => {
  //console.log(to);
  const storeUserAuth = useUserAuthStore();
  await storeUserAuth.initAuth();
  //console.log(storeUser.isAuthenticated);
  if (to.name === "home" && storeUserAuth.isAuthenticated) {
    return { name: "overview" };
  }

  if (to.meta.requiresAuth && !storeUserAuth.isAuthenticated) {
    return { name: "home" };
  }

  return true;
});

export default router;
