<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <n-space class="head">
    <n-grid x-gap="16" y-gap="16" cols="2" style="border-radius: 15px">
      <n-grid-item style="border-radius: 15px"
        ><div class="logo">
          <img src="../../assets/admin.jpg" alt="LOGO" width="60" /></div
      ></n-grid-item>
      <!-- <n-grid-item class="sysname"></n-grid-item> -->
      <n-grid-item>
        <div class="user" @mouseenter="showbtn = true" @mouseleave="showbtn = false">
          <n-span>
            <img src="../../assets/admin.jpg" alt="user-image" width="50"
          /></n-span>
          <n-span style="margin-top: 20px">Admin</n-span>
          <n-button
            type="error"
            @click="downhome"
            style="margin: 16px"
            v-show="showbtn"
            class="ubtn"
          >
            退出登录
          </n-button>
        </div>
      </n-grid-item>
    </n-grid>
  </n-space>
</template>

<script setup lang="ts">
import router from "@/router";
import { NButton } from "naive-ui";
import { ref } from "vue";
const showbtn = ref(false);
const downhome = () => {
  window.setTimeout(() => {
    router.push("/");
  }, 1000);
};
</script>

<style scoped>
.head {
  display: flex;
  width: 100%;
  height: 80px;
  background-color: hwb(196 16% 30%);
}
.logo {
  display: flex;
  width: 750px;
  margin: 10px;
  border-radius: 15px;
}
.logo img {
  border-radius: 10%;
  box-shadow: 0 0 15px 10px #e4c4c4;
}
.sysname {
  display: inline-block;
  width: 200px;
  background-color: #865959;
}
.user {
  display: flex;
  height: auto;
  float: right;
  margin: 5px;
}
@keyframes fadenum {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
.ubtn {
  animation: fadenum 1s 1;
}
.user n-span {
  display: block;
  margin: 10px;
}
.user n-span img {
  border-radius: 50%;
  box-shadow: 0 0 15px 10px #e4c4c4;
}
</style>
