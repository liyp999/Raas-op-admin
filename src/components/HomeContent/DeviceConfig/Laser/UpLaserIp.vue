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
          <n-input v-model:value="LaserData.laserIp" placeholder="IP"></n-input>
        </n-form-item>
        <n-form-item label="请输入设备的Port:">
          <n-input v-model:value="LaserData.laserPort" placeholder="Port"></n-input>
        </n-form-item>
      </n-form>
      <div>
        <n-button type="success" @click="Update">确定</n-button>
        <n-button type="error" style="margin: 10px" @click="showModal = false"
          >取消</n-button
        >
      </div>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref } from "vue";

const showModal = ref(false);
const LaserData = ref({
  laserIp: "",
  laserPort: "",
});
const Update = () => {
  alert("成功");
};
</script>
