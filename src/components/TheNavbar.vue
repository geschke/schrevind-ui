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

import { useUserAuthStore } from "../stores/userauth";
import { ref, onUpdated, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";

interface Props {
  menuPath?: string,
}

const props = withDefaults(defineProps<Props>(), {
  menuPath: '',
});



const storeUserAuth = useUserAuthStore();
const route = useRoute();
const { t } = useI18n();

onMounted(() => {
 
  markCollapse(sidebarMenu.value, menuPath());
});

const menuPath = () => { return (props.menuPath != '' ? props.menuPath : route.path) };

onUpdated(() => {
  markCollapse(sidebarMenu.value, menuPath());
  //console.log(route.path);
  // todo: get breadcrumb data and use them to create senseful breadcrumb, title and more
});

const sidebarMenu = ref<SidebarItem[]>([
  {
    title: "", // nav.sections.core",
    type: "main",
    //icon: "", // optional, default none
    //url: "", // optional, default none
    sub: [
      {
        title: "nav.items.comments",
        type: "item",
        icon: "bi bi-chat-text",
        url: "/comments",
      },
      {
        title: "nav.items.sites",
        type: "item",
        icon: "bi bi-globe",
        url: "/sites",
      },
      {
        title: "nav.items.users",
        type: "item",
        icon: "bi bi-people",
        url: "/admin/user",
      },
    ],
  },
 
]);


function markCollapse(menu: SidebarItem[], targetUrl: string, parentItems: SidebarItem[] = []) {
  //console.log("in markCollapse mit ", targetUrl, parentItems);
  for (const item of menu) {
    // Überprüfe, ob die aktuelle URL mit dem Ziel übereinstimmt
    if (item.url === targetUrl) {
      //console.log("found mit ", item.url)
      // Füge das zusätzliche Feld collapse hinzu und setze es auf true
      item.show = true;
      //console.log("item? ", item);
      for (const parentItem of parentItems) {
        //console.log("in parentItems loop mit item ", parentItem);
        parentItem.show = true;
      }
      return;
     
    } else if (item.sub) {
      //console.log("not found mit ", item.sub.url);
      // Wenn der Menüpunkt Untermenüpunkte hat, rufe die Funktion rekursiv auf
      markCollapse(item.sub, targetUrl, [...parentItems, item]);
    }
  }
}




</script>

<style scoped>
/*.bi {
  vertical-align: -0.125em;
  fill: currentColor;
}

.nav-scroller {
  position: relative;
  z-index: 2;
  height: 2.75rem;
  overflow-y: hidden;
}
*/
/*.nav-scroller .nav {
  display: flex;
  flex-wrap: nowrap;
  padding-bottom: 1rem;
  margin-top: -1px;
  overflow-x: auto;
  text-align: center;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
}
*/
/*
.btn-bd-primary {
  --bd-violet-bg: #712cf9;
  --bd-violet-rgb: 112.520718, 44.062154, 249.437846;

  --bs-btn-font-weight: 600;
  --bs-btn-color: var(--bs-white);
  --bs-btn-bg: var(--bd-violet-bg);
  --bs-btn-border-color: var(--bd-violet-bg);
  --bs-btn-hover-color: var(--bs-white);
  --bs-btn-hover-bg: #6528e0;
  --bs-btn-hover-border-color: #6528e0;
  --bs-btn-focus-shadow-rgb: var(--bd-violet-rgb);
  --bs-btn-active-color: var(--bs-btn-hover-color);
  --bs-btn-active-bg: #5a23c8;
  --bs-btn-active-border-color: #5a23c8;
}

.bd-mode-toggle {
  z-index: 1500;
}

.bd-mode-toggle .dropdown-menu .active .bi {
  display: block !important;
}

body {
  min-height: 100vh;
  min-height: -webkit-fill-available;
}

html {
  height: -webkit-fill-available;
}

main {
  height: 100vh;
  height: -webkit-fill-available;
  max-height: 100vh;
  overflow-x: auto;
  overflow-y: hidden;
}

.dropdown-toggle {
  outline: 0;
}

.btn-toggle {
  padding: 0.25rem 0.5rem;
  font-weight: 600;
  color: var(--bs-emphasis-color);
  background-color: transparent;
}

.btn-toggle:hover,
.btn-toggle:focus {
  color: rgba(var(--bs-emphasis-color-rgb), 0.85);
  background-color: var(--bs-tertiary-bg);
}

.btn-toggle::before {
  width: 1.25em;
  line-height: 0;
  content: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='rgba%280,0,0,.5%29' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M5 14l6-6-6-6'/%3e%3c/svg%3e");
  transition: transform 0.35s ease;
  transform-origin: 0.5em 50%;
}

[data-bs-theme="dark"] .btn-toggle::before {
  content: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='rgba%28255,255,255,.5%29' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M5 14l6-6-6-6'/%3e%3c/svg%3e");
}

.btn-toggle[aria-expanded="true"] {
  color: rgba(var(--bs-emphasis-color-rgb), 0.85);
}

.btn-toggle[aria-expanded="true"]::before {
  transform: rotate(90deg);
}

.btn-toggle-nav a {
  padding: 0.1875rem 0.5rem;
  margin-top: 0.125rem;
  margin-left: 1.25rem;
}

.btn-toggle-nav a:hover,
.btn-toggle-nav a:focus {
  background-color: var(--bs-tertiary-bg);
}

.scrollarea {
  overflow-y: auto;
}
*/
</style>
