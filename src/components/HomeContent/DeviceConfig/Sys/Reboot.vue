<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <n-button @click="showModalRef = true" type="error"> 来吧 </n-button>
  <n-modal
    v-model:show="showModalRef"
    :mask-closable="false"
    preset="dialog"
    title="确认"
    content="你确认"
    positive-text="确认"
    negative-text="算了"
    @positive-click="onPositiveClick"
    @negative-click="onNegativeClick"
  />
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useMessage } from "naive-ui";

const message = useMessage();
const showModalRef = ref(false);

function onNegativeClick() {
  message.success("Cancel");
  showModalRef.value = false;
}
function onPositiveClick() {
  message.success("Submit");
  showModalRef.value = false;
}
</script>
