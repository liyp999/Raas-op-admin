<template>
  <n-space>
    <n-layout>
      <n-layout-header :inverted="inverted" bordered style="height: 10%">
        <UserTop />
      </n-layout-header>
      <n-layout-content>
        <div class="tags">
          <n-span>边缘网关</n-span>
          <n-span class="eqnum">设备个数<br />0/1 </n-span>
        </div>
        <div><SysData /></div>
      </n-layout-content>
      <n-layout-footer>
        <div class="tags">
          <n-span>红外激光</n-span> <n-span class="eqnum">设备个数<br />0/1 </n-span>
        </div>
        <div><LaserData /></div>
      </n-layout-footer>
    </n-layout>
  </n-space>
</template>
<script setup lang="ts">
import { h, ref } from "vue";
import UserTop from "@/components/HomeTop/Index.vue";
import SysData from "@/components/HomeContent/Index.vue";
import LaserData from "@/components/HomeFooter/Index.vue";

const inverted = ref(false);
</script>
<style>
.tags {
  background-color: rgb(125, 187, 209);
  height: 70px;
  border-radius: 20px;
  text-align: center;
  width: 100%;
}
.tags n-span {
  display: inline-block;
  margin-top: 20px;
  vertical-align: middle;
  text-align: center;
  color: #000000;
}
.eqnum {
  bottom: 8px;
  position: relative;
  float: right;
  margin-right: 100px;
}
.footer {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 400px;
  border: 1px solid;
  margin: 2px;
  border-radius: 10px;
}
.footer-text {
  display: flex;
  flex-direction: column;
  width: 50%;
  background-color: rgb(113, 137, 200);
  height: 400px;
  border-radius: 10px;
}
.etc {
  background-color: rgb(42, 40, 40);
  width: 50%;
  height: 500px;
}
</style>
