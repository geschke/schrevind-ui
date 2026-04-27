<template>
  <!-- navbar top -->
  <nav class="sb-topnav navbar navbar-expand navbar-dark _fixed-top bg-dark">
    <!-- Navbar Brand-->
    <router-link to="/overview" class="navbar-brand ps-3"><img src="/img/logo_dark_02.png" width="32" height="32" class="me-3"
        alt="Schrevind UI"> Schrevind UI</router-link>

    <!-- Sidebar Toggle-->
    <button @click="toggleSidebar" class="btn btn-link btn-sm order-1 order-lg-0 me-4 me-lg-0" id="sidebarToggle"
      href="#!"><i class="bi bi-list" style="font-size: 1.5rem; color: white;"></i>
    </button>
    <!-- Navbar-->
    <ul class="navbar-nav ms-auto me-3 me-lg-4">
      <GroupSwitcher />
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
            <a
              class="dropdown-item"
              href="#"
              data-bs-toggle="offcanvas"
              data-bs-target="#offcanvasSettings"
              @click.prevent
            >
              <i class="bi bi-sliders me-1"></i>{{ t("layout.topbar.settings") }}
            </a>
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

  <div class="offcanvas offcanvas-end" tabindex="-1" id="offcanvasSettings" aria-labelledby="offcanvasSettingsLabel">
    <div class="offcanvas-header">
      <h5 class="offcanvas-title" id="offcanvasSettingsLabel">{{ t("layout.settings.title") }}</h5>
      <button type="button" class="btn-close" data-bs-dismiss="offcanvas" :aria-label="t('layout.settings.close')"></button>
    </div>
    <div class="offcanvas-body">
      <h6 class="mb-1">{{ t("layout.settings.appearance.title") }}</h6>
      <p class="text-muted small mb-3">{{ t("layout.settings.appearance.paletteLabel") }}</p>
      <div class="d-flex flex-column gap-2">
        <button
          v-for="name in PALETTE_ORDER"
          :key="name"
          type="button"
          class="btn btn-sm d-flex align-items-center gap-3 text-start"
          :class="storeSettings.palette === name ? 'btn-dark' : 'btn-outline-secondary'"
          @click="storeSettings.setPalette(name)"
        >
          <div class="d-flex gap-1 flex-shrink-0">
            <div :style="{ width: '16px', height: '16px', borderRadius: '3px', backgroundColor: CHART_PALETTES[name].gross }"></div>
            <div :style="{ width: '16px', height: '16px', borderRadius: '3px', backgroundColor: CHART_PALETTES[name].afterWithholding }"></div>
            <div :style="{ width: '16px', height: '16px', borderRadius: '3px', backgroundColor: CHART_PALETTES[name].net }"></div>
          </div>
          <span>{{ CHART_PALETTES[name].label }}</span>
          <i v-if="storeSettings.palette === name" class="bi bi-check2 ms-auto"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AboutModal from "@/components/helper/AboutModal.vue";
import TheNavbar from "@/components/TheNavbar.vue";
import LanguageSwitcher from "@/components/helper/LanguageSwitcher.vue";
import GroupSwitcher from "@/components/GroupSwitcher.vue";

import { useUserAuthStore } from "../stores/userauth";
import { useSettingsStore, CHART_PALETTES, PALETTE_ORDER } from "../stores/settings";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from 'vue-router';
import { computed } from 'vue';

const storeUserAuth = useUserAuthStore();
const storeSettings = useSettingsStore();
const router = useRouter();
const route = useRoute();
const { t } = useI18n();

const menuPath = computed(() => {
  return route.meta.menuPath ? route.meta.menuPath : route.path;
});
const currentUserId = computed(() => {
  const rawId = storeUserAuth.getUserId;
  if (rawId == null) return null;
  return String(rawId);
});

async function signout() {
  try {
    await storeUserAuth.signout();
  } catch (error) {

  } finally {
    router.push("/");
  }
}

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
