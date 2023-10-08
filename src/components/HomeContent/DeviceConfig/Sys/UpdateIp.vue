<template>
  <n-button @click="showModal = true" type="success" style="margin: 10px">
    配置修改
  </n-button>
  <n-modal
    v-model:show="showModal"
    class="custom-card"
    preset="card"
    title="IP修改"
    size="huge"
    style="width: 600px"
    :bordered="false"
  >
    <template #footer>
      <n-form label-position="top">
        <n-form-item label="请输入设备的IP地址:">
          <n-input v-model:value="sys.sysip" placeholder="IP"></n-input>
        </n-form-item>
      </n-form>
      <div>
        <n-button type="success" @click="sucess">确定</n-button>
        <n-button type="error" style="margin: 10px" @click="showModal = false"
          >取消</n-button
        >
      </div>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import router from "@/router";
import { ref } from "vue";
const sys = ref({
  sysip: "",
});
const showModal = ref(false);
const sucess = () => {
  alert("成功" + sys.value.sysip);
  console.log("成功" + JSON.stringify(sys.value.sysip));
};
</script>
