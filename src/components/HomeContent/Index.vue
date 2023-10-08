<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div>
    <n-data-table :data="data" :columns="columns" class="table"></n-data-table>
  </div>
</template>

<script setup lang="ts">
import { ref, h } from "vue";
import { NButton, NDataTable, NPopconfirm } from "naive-ui";
import router from "@/router";
import Upload from "@/components/HomeContent/DeviceConfig/UploadETC.vue";
import UpdateIp from "./DeviceConfig/Sys/UpdateIp.vue";
import Reboot from "./DeviceConfig/Sys/Reboot.vue";
const data = ref([{ name: "系统", age: 28, country: "在线" }]);

const columns = [
  { title: "设备状态", key: "country" },
  { title: "设备名称", key: "name" },
  {
    title: "设备ip",
    key: "age",
  },

  {
    title: "设备配置",
    key: "country",
    render() {
      return [
        h(UpdateIp),
        h(
          NPopconfirm,
          {
            onPositiveClick: () => positiveClick(),
            onNegativeClick: () => negativeText(),
            negativeText: "确定",
            positiveText: "取消",
          },
          {
            trigger: () =>
              h(NButton, { type: "error" }, [
                h("span", { style: { size: "large" } }, "设备关机"),
              ]),
            default: () => {
              h("span", { style: { size: "large" } }, "确认将设备关机?");
            },
          }
        ),

        h(
          NPopconfirm,
          {
            onPositiveClick: () => positiveClick(),
            onNegativeClick: () => negativeText(),
            negativeText: "确定",
            positiveText: "取消",
          },
          {
            trigger: () =>
              h(NButton, { type: "warning", style: { margin: "10px" } }, [
                h("span", { style: { size: "large" } }, "设备重启"),
              ]),
            default: () => {
              h("span", { style: { size: "large" } }, "确认将设备重启?");
            },
          }
        ),
      ];
    },
  },
  {
    title: "更新系统应用ETC",
    key: "country",
    render() {
      return h(
        Upload,
        {
          style: { width: "100%", margin: "10px" },
          onClick: () => upload(),
        },
        { default: () => "上传文件" }
      );
    },
  },
];
//文件上传

const upIP = () => {};
//弹窗提示
// const message = useMessage();
const negativeText = () => {
  // message.success("关机成功");
  // router.push("/home");
};
const positiveClick = () => {
  // message.error("你已取消关机");
  // router.push("/home");
};
//上传文件
const upload = () => {};
</script>

<style scoped>
:deep .n-data-table-th {
  text-align: center;
  /* background-color: antiquewhite; */
}
:deep .n-data-table-td {
  text-align: center;
}
</style>
