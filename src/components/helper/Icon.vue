<script setup lang="ts">
import * as TablerIcons from '@tabler/icons-vue';

const props = defineProps<{
  name: keyof typeof TablerIcons;
  size?: number;
  stroke?: number;
  color?: string;
}>();

const IconComponent = TablerIcons[props.name];
</script>

<template>
  <component
    :is="IconComponent"
    :size="size ?? 20"
    :stroke="stroke ?? 1.5"
    :color="color"
  />
</template>
