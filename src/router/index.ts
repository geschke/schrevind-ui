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
    path: "/comments",
    name: "comments",
    component: () => import("@/pages/CommentsPage.vue"),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: "/sites",
    name: "sites",
    component: () => import("@/pages/SitesPage.vue"),
    meta: {
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

router.beforeEach(async (to, from, next) => {
  //console.log(to);
  //console.log(from);
  const storeUserAuth = useUserAuthStore();
  await storeUserAuth.initAuth();
  //console.log(storeUser.isAuthenticated);
  // maybe don't use next() in current version, see https://router.vuejs.org/guide/advanced/navigation-guards.html#global-before-guards
  if (to.name === "home" && storeUserAuth.isAuthenticated) {
    next({ name: "comments" });
    return;
  }

  if (to.meta.requiresAuth && !storeUserAuth.isAuthenticated) {
    next({ name: "home" });
  } else {
    next();
  }
});

export default router;
