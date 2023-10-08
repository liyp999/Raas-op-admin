<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div style="background-color: blue; border-radius: 10%;">
    <n-data-table
      :data="data"
      :columns="columns"
      class="table"
      
    ></n-data-table>
  </div>
</template>

<script setup lang="ts">
import { h, ref } from "vue";
import { NDataTable } from "naive-ui";
import Upload from "@/components/HomeContent/DeviceConfig/UploadETC.vue";
import UpLaserIp from "../HomeContent/DeviceConfig/Laser/UpLaserIp.vue";
// 假设你有一个包含数据的数组
const data = ref([{ name: "John Doe", age: 28, country: "USA" }]);

// 定义要显示的列
const columns = [
  { title: "设备状态", key: "country" },
  { title: "设备名称", key: "name" },
  { title: "设备ip", key: "age" },
  { title: "设备端口", key: "country" },
  { title: "测量数据etc", key: "country" },
  {
    title: "设备配置",
    key: "country",
    render() {
      return h(
        UpLaserIp,
        {
          style: { size: "large", strong: true, tertiary: true },

          onClick: () => updatelaser(),
        },
        { default: () => "设备配置" }
      );
    },
  },
  {
    title: "更新激光应用ETC",
    key: "country",
    render() {
      return h(
        Upload,
        { style: { width: "100%", margin: "10px" } },
        { default: () => "上传文件" }
      );
    },
  },
];

const updatelaser = () => {
  alert("修改激光端口");
};
</script>

<style scoped>
.table {
  width: 100%;
}
:deep .n-data-table{
border-radius: 10px;
}
:deep .n-data-table-th {
  text-align: center;
}
:deep .n-data-table-td {
  text-align: center;
}
</style>
