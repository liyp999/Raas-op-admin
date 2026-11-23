<template>
  <div class="login-page">
    <div class="brand">
      <div class="logo-frame">
        <img src="../../assets/admin.jpg" alt="logo" width="32" />
      </div>
      <div class="brand-text">
        <div class="line1">
          <span class="name">RaaS</span>
          <span class="divider"></span>
          <span class="cn">设备运维控制台</span>
        </div>
        <span class="sub">ROBOTIC OPS CONSOLE · EDGE / LASER</span>
      </div>
    </div>

    <div class="stage">
      <div class="login-card">
        <div class="card-head">
          <span class="eyebrow">RaaS OPS · 安全接入</span>
          <h1>运维身份验证</h1>
          <p>接入边缘网关与红外激光控制总线</p>
        </div>

        <n-form ref="formRef" :model="loginIn" :rules="rules" @keyup.enter="loginhome">
          <n-form-item label="用户名" prop="username" :show-feedback="false">
            <n-input
              v-model:value="loginIn.username"
              type="text"
              placeholder="请输入运维账号"
              size="large"
              :maxlength="20"
              :input-props="{ autocomplete: 'username' }"
            />
          </n-form-item>
          <n-form-item label="访问密钥" prop="password" :show-feedback="false" class="mt">
            <n-input
              v-model:value="loginIn.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              show-password-on="mousedown"
              :maxlength="20"
              :input-props="{ autocomplete: 'current-password' }"
            />
          </n-form-item>

          <n-alert v-if="errorMsg" type="error" class="err" closable @close="errorMsg = ''">
            {{ errorMsg }}
          </n-alert>

          <n-button type="primary" :loading="loading" block strong class="submit" @click="loginhome">
            登录 / AUTHORIZE
          </n-button>
        </n-form>

        <div class="boot">
          <span class="ok">● DEVICE BUS READY</span>
          <span class="ok">● CHANNEL 01 LINKED</span>
          <span class="dim">测试账号 sj:123456 · admin:admin123 · {{ apiBase }}</span>
        </div>

        <div class="accent-bar">
          <span class="ab-label">主题</span>
          <button
            v-for="p in ACCENTS"
            :key="p.id"
            type="button"
            class="ab-dot"
            :class="{ on: currentId === p.id && !autoMode }"
            :style="{ '--dot': p.accent }"
            :title="`${p.label} · ${p.cn}`"
            @click="setAccent(p.id)"
          ></button>
          <button type="button" class="ab-auto" :class="{ on: autoMode }" @click="toggleAuto()">AUTO</button>
        </div>
      </div>

      <IsoScene class="hero" />
    </div>

    <footer class="foot">RaaS OPS CONSOLE · BUILD 2026.11 · LOCAL SANDBOX</footer>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { NInput, NButton, NForm, NFormItem, NAlert, type FormInst, type FormRules } from 'naive-ui'
import router from '@/router'
import { useUserStore } from '@/stores/user'
import { useHudTheme } from '@/composables/useHudTheme'
import IsoScene from '@/components/IsoScene/Index.vue'
import type { LoginPayload } from '@/utils/typing/raas'

const { ACCENTS, currentId, autoMode, setAccent, toggleAuto } = useHudTheme()

const userStore = useUserStore()
const formRef = ref<FormInst | null>(null)
const loading = ref(false)
const errorMsg = ref('')
const apiBase = import.meta.env.VITE_APP_API_BASEURL || '/api'

const loginIn = reactive<LoginPayload>({
  username: 'sj',
  password: '123456'
})

const rules: FormRules = {
  username: { required: true, message: '请输入用户名', trigger: ['input', 'blur'] },
  password: { required: true, message: '请输入密码', trigger: ['input', 'blur'] }
}

const loginhome = async () => {
  if (loading.value) return
  errorMsg.value = ''
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  loading.value = true
  try {
    const result = await userStore.login(loginIn.username.trim(), loginIn.password)
    if (result?.user?.name) {
      router.push('/home')
    }
  } catch (e) {
    errorMsg.value = (e as Error).message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 24px 56px;
  box-sizing: border-box;
  z-index: 1;
  overflow: hidden;
}

.brand {
  position: absolute;
  top: 28px;
  left: 34px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.logo-frame {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: linear-gradient(135deg, #f2f8ff, #d9e9ff);
  box-shadow: 0 8px 16px -8px rgba(47, 110, 210, 0.5), inset 0 0 0 1px rgba(120, 165, 225, 0.4);
}
.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}
.line1 {
  display: flex;
  align-items: center;
  gap: 8px;
}
.name {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--iso-ink);
}
.divider {
  width: 1px;
  height: 11px;
  background: #d7e6f9;
}
.cn {
  font-size: 12px;
  letter-spacing: 1.2px;
  color: var(--iso-ink-2);
  white-space: nowrap;
}
.sub {
  font-size: 9px;
  letter-spacing: 1.6px;
  color: var(--iso-ink-3);
}

.stage {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4vw;
  width: 100%;
  max-width: 1120px;
}

.login-card {
  position: relative;
  width: 100%;
  max-width: 396px;
  padding: 30px 30px 22px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(214, 229, 248, 0.95);
  box-shadow: 0 40px 70px -44px rgba(35, 88, 168, 0.75), 0 1px 0 #fff inset;
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
}
.card-head {
  margin-bottom: 20px;
}
.eyebrow {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1.2px;
  color: var(--hud-accent-soft);
  padding: 3px 9px;
  border-radius: 999px;
  background: rgba(var(--hud-accent-rgb), 0.1);
}
.card-head h1 {
  margin: 10px 0 0;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--iso-ink);
}
.card-head p {
  margin: 7px 0 0;
  font-size: 12px;
  color: var(--iso-ink-3);
}
:deep(.n-form-item-label__text) {
  font-size: 12px !important;
  color: #436994 !important;
  font-weight: 600 !important;
  letter-spacing: 0.4px;
}
.mt {
  margin-top: 12px;
}
.err {
  margin-bottom: 12px;
  border-radius: 10px;
}
.submit {
  margin-top: 18px;
  height: 46px;
  font-size: 14px;
  letter-spacing: 0.6px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--hud-accent-soft), var(--hud-accent-pressed)) !important;
  border: none !important;
  box-shadow: 0 14px 26px -14px rgba(var(--hud-accent-rgb), 0.95);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.submit:hover {
  transform: translateY(-1px);
  box-shadow: 0 18px 30px -14px rgba(var(--hud-accent-rgb), 0.95);
}

.boot {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px dashed #e2edfa;
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 10px;
  letter-spacing: 0.4px;
  color: var(--iso-ink-3);
}
.boot .ok {
  color: #0e9a70;
  font-weight: 600;
}
.boot .dim {
  color: #7a93ae;
}

.accent-bar {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 7px;
}
.ab-label {
  font-size: 10px;
  color: var(--iso-ink-3);
  letter-spacing: 0.4px;
}
.ab-dot {
  width: 11px;
  height: 11px;
  padding: 0;
  border-radius: 50%;
  border: 2px solid transparent;
  background: var(--dot);
  opacity: 0.55;
  cursor: pointer;
  transition: opacity 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}
.ab-dot:hover {
  opacity: 0.95;
  transform: scale(1.08);
}
.ab-dot.on {
  opacity: 1;
  border-color: #fff;
  box-shadow: 0 0 0 2px var(--dot), 0 6px 12px -6px var(--dot);
}
.ab-auto {
  margin-left: 2px;
  padding: 1px 8px;
  font-size: 9px;
  letter-spacing: 1px;
  color: var(--iso-ink-3);
  background: transparent;
  border: 1px solid #dfeaf8;
  border-radius: 999px;
  cursor: pointer;
}
.ab-auto.on {
  color: #fff;
  background: var(--hud-accent);
  border-color: var(--hud-accent);
}

.hero {
  flex: none;
  width: 46%;
  max-width: 520px;
}

.foot {
  position: absolute;
  bottom: 18px;
  font-size: 10px;
  letter-spacing: 1.2px;
  color: #7a93ae;
}

@media (max-width: 1080px) {
  .hero {
    width: 40%;
    opacity: 0.9;
  }
}
@media (max-width: 880px) {
  .hero {
    display: none;
  }
  .login-card {
    max-width: 420px;
  }
}
@media (max-width: 560px) {
  .brand {
    top: 18px;
    left: 18px;
  }
  .sub,
  .foot {
    display: none;
  }
  .login-page {
    padding: 84px 16px 32px;
    justify-content: flex-start;
  }
  .login-card {
    padding: 24px 20px 18px;
  }
  .card-head h1 {
    font-size: 19px;
  }
}
</style>
