<template>
  <n-space vertical size="large">
    <n-layout>
      <n-layout-header>
        <span><img src="../../assets/admin.jpg" alt="logo" width="80" /></span>
      </n-layout-header>
      <n-layout-content>
        <div class="content-from">
          <n-form :model="loginIn">
            <n-form-item label="用户名" prop="username">
              <n-input
                style="padding: 0px"
                v-model:value="loginIn.username"
                type="text"
                placeholder="用户名"
                :maxlength="20"
                class="h-50 items-center text-16"
              />
            </n-form-item>
            <n-form-item label="密码" prop="password">
              <n-input
                v-model:value="loginIn.password"
                type="password"
                placeholder="密码"
                show-password-on="mousedown"
                :maxlength="20"
                class="h-50 items-center text-16"
              />
            </n-form-item>
            <n-form-item>
              <div class="btn">
                <n-button
                  type="primary"
                  @click="loginhome()"
                  :disabled="disabled"
                  block
                  secondary
                  strong
                  class="nbt"
                  >登录</n-button
                >
              </div>
            </n-form-item>
          </n-form>
        </div>
      </n-layout-content>
    </n-layout>
  </n-space>
</template>
<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { NInput, NButton, NForm, NFormItem, useLoadingBar } from "naive-ui";
import router from "@/router";

import { userLogin } from "@/api/login";
import type { Login } from "@/utils/typing/raas";

const loginIn = reactive<Login>({
  username: "",
  password: "",
});

// // 定义 loadingPercentage 变量用于控制进度条的进度
// const loadingPercentage = ref(0);

// // 定义 startLoading 函数，用于启动加载条
// const loginhome = () => {
//   // 模拟数据加载过程
//   const timer = setInterval(() => {
//     if (loadingPercentage.value >= 100) {
//       clearInterval(timer);
//     } else {
//       loadingPercentage.value += 10;
//     }
//   }, 500);
// };

// onMounted(() => {
//   setTimeout(() => {
//     loginhome();
//   }, 1000);
// });

//登录实现
const loginhome = () => {
  userLogin().then((data) => {
    console.log("data的值是+", data);
  });
  if (loginIn.username == "" || loginIn.password == "") {
    alert("用户名或密码不能为空");
  } else {
    if (loginIn.username == "sj" && loginIn.password == "123456") {
      // console.log("user" + JSON.stringify(loginIn));
      setTimeout(() => {
        router.push("/home");
      }, 1000);
    } else {
      alert("用户名或密码错误!");
      console.log("登录失败！");
    }
  }
};
</script>
<style scoped>
.n-space {
  background-color: aliceblue;
  height: 100%;
}
.n-layout-header {
  padding: 10px;
  background-color: hwb(196 16% 30%);
}
.n-layout-header img {
  border-radius: 10px;
  box-shadow: 0 0 15px 10px #fff;
}
.n-layout-content {
  height: 605px;
  display: block;
  position: relative;
  float: center;
  background-color: hwb(196 16% 30%);
}

.content-from {
  position: relative;
  width: 400px;
  top: 130px;
  left: 32%;
  border-radius: 7px;
  background-color: rgb(62, 46, 68);
  padding: 20px;
  box-shadow: 0 0 15px 10px #fff;
}
.nbt {
  width: 100px;
  margin-left: 156px;
}
.h-50 {
  height: 50px;
}
.items-center {
  align-items: center;
}
.text-16 {
  font-size: 16px;
}
</style>
