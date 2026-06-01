<template>
  <div v-for="item in items">

    <router-link v-if="item.type === 'item' && item.url" :class="getItemLinkClass(item)" :to="item.url">
      <div class="ui-nav-link-icon"><i v-if="item.icon" :class="item.icon"></i></div>
      {{ t(item.title) }}
    </router-link>

    <div v-else-if="item.type === 'subitem' && item.sub">

      <a :class="getSubitemsLinkClass(item)" href="#" data-bs-toggle="collapse"
        :data-bs-target="getSubitemCollapseId(item.title, '#')" :aria-expanded="getSubitemsAriaExpanded(item)"
        :aria-controls="getSubitemCollapseId(item.title, '')">
        <div class="ui-nav-link-icon"><i :class="item.icon"></i></div>
        {{ t(item.title) }}
        <div class="ui-sidenav-collapse-arrow">
          <i class="bi bi-caret-down-fill"></i>
        </div>
      </a>

      <div :class="getSubitemsClass(item)" :id="getSubitemCollapseId(item.title, '')" aria-labelledby="headingOne"
        _data-bs-parent="#sidenavAccordion">
        <nav class="ui-sidenav-menu-nested nav">
          <the-navbar-item v-if="item.sub" :items="item.sub" :menu-path="menuPath"></the-navbar-item>

        </nav>
      </div>


    </div>

  </div>
</template>

<script setup lang="ts">

import TheNavbarItem from "@/components/TheNavbarItem.vue";
import type { SidebarItem } from "@/types/navigation";

import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";


interface Props {
  items: SidebarItem[];
  menuPath?: string;
}

const props = withDefaults(defineProps<Props>(), {
  menuPath: "",
});
const { t } = useI18n();
const route = useRoute();
const menuPath = computed(() => (props.menuPath !== "" ? props.menuPath : route.path));

onMounted(() => {
  //console.log("mounted NavbarItem");
  //console.log(props.items);
});

function getItemLinkClass(item: SidebarItem): string {
  return "nav-link" + (item.url === menuPath.value ? " active" : "");
}


function getSubitemCollapseId(title: string, prefix: string): string {
  return prefix + "collapse" + title.replace(/[^\w\s]/gi, '');
}


function getSubitemsLinkClass(item: SidebarItem): string {
  return "nav-link" + (item.show ? "" : " collapsed");
}


function getSubitemsClass(item: SidebarItem): string {
  return "collapse" + (item.show ? " show" : "");
}

function getSubitemsAriaExpanded(item: SidebarItem): boolean {
  return (item.show ? true : false);
}

</script>

<style scoped></style>
