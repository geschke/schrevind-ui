<script lang="ts" setup>

</script>

<template>
        <router-view v-slot="{ Component, route }">
        <component :is="Component" :key="route.fullPath"></component>
      </router-view>
  
</template>


<style>

.bg-vue {
  background-color: rgb(52, 73, 94);
  color: white;
}

.bg-vue2 {
  background-color: rgb(65, 184, 131);
  color: white;
}

.text-vue {
  color: rgb(52, 73, 94);
}

.text-vue2 {
  color: rgb(65, 184, 131);
}
</style>
