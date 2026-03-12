<template>
  <TheLandingLayout
    :fullsize="true"
  >
    <template #mainContent><LoginForm /></template>
  </TheLandingLayout>
</template>

<script lang="ts">
import TheLandingLayout from "@/layouts/TheLandingLayout.vue";
import LoginForm from "@/components/auth/LoginForm.vue";

export default {
  name: "HomePage",
  components: {
    TheLandingLayout,
    LoginForm,
  },
};
</script>

<style scoped></style>
