<template>
  <!-- navbar top -->
  <nav class="sb-topnav navbar navbar-expand navbar-dark _fixed-top bg-dark">
    <!-- Navbar Brand-->
    <router-link to="/overview" class="navbar-brand ps-3"><img src="/img/logo_01.png" width="32" height="32" class="me-3"
        alt="Schrevind UI"> Schrevind UI</router-link>

    <!-- Sidebar Toggle-->
    <button @click="toggleSidebar" class="btn btn-link btn-sm order-1 order-lg-0 me-4 me-lg-0" id="sidebarToggle"
      href="#!"><i class="bi bi-list" style="font-size: 1.5rem; color: white;"></i>
    </button>
    <!-- Navbar-->
    <ul class="navbar-nav ms-auto me-3 me-lg-4">
      <li class="nav-item me-2">
        <LanguageSwitcher
          id-prefix="navbarLocaleDropdown"
          :animate="false"
          toggle-class="nav-link dropdown-toggle d-flex align-items-center gap-1 border-0 bg-transparent text-white"
          menu-class="dropdown-menu dropdown-menu-end"
        />
      </li>
      <li class="nav-item dropdown">
        <a class="nav-link dropdown-toggle" id="navbarDropdown" href="#" role="button" data-bs-toggle="dropdown"
          aria-expanded="false"><i class="bi bi-person-fill"></i></a>
        <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
          <li>
            <router-link
              v-if="currentUserId !== null"
              class="dropdown-item"
              :to="{ name: 'adminuseredit', params: { id: currentUserId } }"
            >
              {{ t("layout.topbar.editUser") }}
            </router-link>
            <span v-else class="dropdown-item disabled">{{ t("layout.topbar.editUser") }}</span>
          </li>
          <li>
            <router-link
              v-if="currentUserId !== null"
              class="dropdown-item"
              :to="{ name: 'adminuserpassword', params: { id: currentUserId } }"
            >
              {{ t("layout.topbar.changeOwnPassword") }}
            </router-link>
            <span v-else class="dropdown-item disabled">{{ t("layout.topbar.changeOwnPassword") }}</span>
          </li>
          <li>
            <hr class="dropdown-divider" />
          </li>
          <li><a class="dropdown-item" @click.prevent="signout" href="#!">{{ t("layout.topbar.logout") }}</a></li>
        </ul>
      </li>
    </ul>
  </nav>


  <div id="layoutSidenav">

  
    <TheNavbar :menuPath="menuPath"></TheNavbar>

    <div id="layoutSidenav_content">
      <main>
        <div class="container-fluid px-4 mt-2">
         
          <div class="row">
            <slot>
              <h1>{{ t("layout.contentFallback") }}</h1>
            </slot>

          </div>


        </div>
      </main>
      <footer class="py-4 bg-light mt-auto">
        <div class="container-fluid px-4">
          <div class="d-flex align-items-center justify-content-end small">
            <div>
              <a href="#" data-bs-toggle="modal" data-bs-target="#aboutModal">{{ t("layout.footer.about") }}</a>
              &middot;
              <a href="https://github.com/geschke/schrevind-ui" target="_blank" rel="noopener noreferrer">{{ t("layout.footer.github") }}</a>
            </div>
          </div>
        </div>
      </footer>
      <AboutModal />
    </div>
  </div>
</template>

<script setup lang="ts">
import AboutModal from "@/components/helper/AboutModal.vue";
import TheNavbar from "@/components/TheNavbar.vue";
import LanguageSwitcher from "@/components/helper/LanguageSwitcher.vue";

import { useUserAuthStore } from "../stores/userauth";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from 'vue-router';
import { ref, onUpdated, onMounted, computed } from 'vue';

const storeUserAuth = useUserAuthStore();
const router = useRouter();
const route = useRoute();
const { t } = useI18n();

const menuPath = ref("");
const currentUserId = computed(() => {
  const rawId = storeUserAuth.getUserId;
  if (rawId == null) return null;
  return String(rawId);
});

const drawer = ref(true);
const rail = ref(true);


async function signout() {
  try {
    await storeUserAuth.signout();
  } catch (error) {

  } finally {
    router.push("/");
  }
}

// todo:
// push route path parameter to TheNavbar, so it could match
// URLs with IDs or another path parameter
// or in general: find a solution to this, so the right menu item will be opened

const open = ref(['Users']);


onMounted(() => {

  if (route.meta.menuPath) {
    menuPath.value = route.meta.menuPath;
  } else {
    menuPath.value = route.path;
  }

})

onUpdated(() => {
  // todo: get breadcrumb data and use them to create senseful breadcrumb, title and more
})




function toggleSidebar() {
  //console.log("sidebar toggle clicked");
  document.body.classList.toggle('sb-sidenav-toggled'); // see: https://www.w3schools.com/howto/howto_js_toggle_class.asp, switch CSS class with toggle function

  // origin from: 
  /*!
    * Start Bootstrap - SB Admin v7.0.7 (https://startbootstrap.com/template/sb-admin)
    * Copyright 2013-2023 Start Bootstrap
    * Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-sb-admin/blob/master/LICENSE)
    */
  // 
  // Scripts
  // 
  /*
  window.addEventListener('DOMContentLoaded', event => {
      console.log("sidebarToggle loaded");
  
      // Toggle the side navigation
      const sidebarToggle = document.body.querySelector('#sidebarToggle');
      if (sidebarToggle) {
          // Uncomment Below to persist sidebar toggle between refreshes
          // if (localStorage.getItem('sb|sidebar-toggle') === 'true') {
          //     document.body.classList.toggle('sb-sidenav-toggled');
          // }
          sidebarToggle.addEventListener('click', event => {
              console.log("sidebar something clicked");
              event.preventDefault();
              document.body.classList.toggle('sb-sidenav-toggled');
              localStorage.setItem('sb|sidebar-toggle', document.body.classList.contains('sb-sidenav-toggled'));
          });
      }
  
  });
  */
}

</script>

<style>
</style>
