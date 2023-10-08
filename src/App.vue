<script setup lang="ts">
import { RouterView } from "vue-router";
import { defineComponent } from "vue";
import { darkTheme } from "naive-ui";
const defineComponents = defineComponent(darkTheme);
</script>
<template>
  <n-config-provider :theme="defineComponents">
    <RouterView />
  </n-config-provider>
</template>
<style scoped>

</style>
