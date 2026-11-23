<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <header class="topbar">
    <div class="inner">
      <div class="brand">
        <div class="logo-frame">
          <img src="../../assets/admin.jpg" alt="LOGO" width="34" />
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

      <div class="right">
        <div class="theme-switch">
          <span class="ts-label">主题</span>
          <button
            v-for="p in ACCENTS"
            :key="p.id"
            type="button"
            class="ts-dot"
            :class="{ on: currentId === p.id && !autoMode }"
            :style="{ '--dot': p.accent }"
            :title="`${p.label} · ${p.cn}`"
            @click="pick(p)"
          ></button>
          <button type="button" class="ts-auto" :class="{ on: autoMode }" title="自动轮换主色" @click="switchAuto()">
            AUTO
          </button>
          <span class="ts-flash" :class="{ show: !!flashText }" role="status" aria-live="polite">{{ flashText }}</span>
        </div>
        <span class="hint"><i></i>SYS NOMINAL</span>
        <div class="op">
          <img class="avatar" src="../../assets/admin.jpg" alt="operator" width="26" />
          <span class="op-id">OP-01</span>
          <span class="uname">{{ userStore.displayName }}</span>
        </div>
        <n-button size="tiny" quaternary :loading="loggingOut" class="logout" @click="downhome">
          LOGOFF
        </n-button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { NButton } from 'naive-ui'
import { ref } from 'vue'
import router from '@/router'
import { useUserStore } from '@/stores/user'
import { useHudTheme } from '@/composables/useHudTheme'

const { ACCENTS, currentId, autoMode, setAccent, toggleAuto } = useHudTheme()

/** 切换后短暂显示主色名：兼顾红绿色盲下 azure/violet 同色的文字兜底 */
const flashText = ref('')
let flashTimer: number | undefined
function flash(msg: string) {
  flashText.value = msg
  window.clearTimeout(flashTimer)
  flashTimer = window.setTimeout(() => (flashText.value = ''), 1600)
}
function pick(preset: { id: string; label: string; cn: string }) {
  setAccent(preset.id as Parameters<typeof setAccent>[0])
  flash(`${preset.label} · ${preset.cn}`)
}
function switchAuto() {
  toggleAuto()
  flash(autoMode.value ? 'AUTO · 12s 轮换' : 'AUTO 关闭')
}

const loggingOut = ref(false)
const userStore = useUserStore()

const downhome = async () => {
  if (loggingOut.value) return
  loggingOut.value = true
  try {
    await userStore.logout()
  } finally {
    loggingOut.value = false
    router.push('/login')
  }
}
</script>

<style scoped>
.topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgba(255, 255, 255, 0.82);
  border-bottom: 1px solid rgba(210, 227, 248, 0.9);
  box-shadow: 0 10px 30px -22px rgba(41, 96, 180, 0.55);
  backdrop-filter: blur(14px) saturate(1.1);
  -webkit-backdrop-filter: blur(14px) saturate(1.1);
}
.inner {
  max-width: 1680px;
  margin: 0 auto;
  height: 64px;
  padding: 0 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  box-sizing: border-box;
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
/* 圆角方块 logo，呼应等轴测模块 */
.logo-frame {
  width: 42px;
  height: 42px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: linear-gradient(135deg, #f2f8ff, #d9e9ff);
  box-shadow: 0 8px 16px -8px rgba(47, 110, 210, 0.5), inset 0 0 0 1px rgba(120, 165, 225, 0.4);
}
.logo-frame img {
  border-radius: 8px;
}
.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
  min-width: 0;
}
.line1 {
  display: flex;
  align-items: center;
  gap: 8px;
}
.name {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--iso-ink);
}
.divider {
  width: 1px;
  height: 12px;
  background: #d7e6f9;
}
.cn {
  font-size: 13px;
  letter-spacing: 1.5px;
  color: var(--iso-ink-2);
  white-space: nowrap;
}
.sub {
  font-size: 9px;
  letter-spacing: 1.8px;
  color: var(--iso-ink-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.right {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: none;
}

/* 主题切换：浅色胶囊 */
.theme-switch {
  position: relative;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(210, 227, 248, 0.95);
  background: rgba(255, 255, 255, 0.7);
}
.ts-label {
  font-size: 10px;
  letter-spacing: 1px;
  color: var(--iso-ink-3);
  margin-right: 1px;
}
.ts-flash {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  padding: 3px 10px;
  font-size: 10px;
  letter-spacing: 1px;
  white-space: nowrap;
  color: var(--hud-accent-soft);
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(210, 227, 248, 0.95);
  border-radius: 999px;
  box-shadow: 0 8px 18px -12px rgba(31, 78, 150, 0.8);
  opacity: 0;
  transform: translateY(-4px);
  pointer-events: none;
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.ts-flash.show {
  opacity: 1;
  transform: translateY(0);
}
.ts-dot {
  width: 11px;
  height: 11px;
  padding: 0;
  border-radius: 50%;
  border: 2px solid transparent;
  background: var(--dot);
  opacity: 0.55;
  cursor: pointer;
  transition: opacity 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;
}
.ts-dot:hover {
  opacity: 0.95;
  transform: scale(1.08);
}
.ts-dot.on {
  opacity: 1;
  border-color: #fff;
  box-shadow: 0 0 0 2px var(--dot), 0 6px 12px -4px var(--dot);
  transform: scale(1.05);
}
.ts-auto {
  margin-left: 2px;
  padding: 2px 8px;
  font-size: 9px;
  letter-spacing: 1.2px;
  color: var(--iso-ink-3);
  background: transparent;
  border: 1px solid #dfeaf8;
  border-radius: 999px;
  cursor: pointer;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}
.ts-auto:hover {
  color: var(--hud-accent-soft);
  border-color: rgba(var(--hud-accent-rgb), 0.45);
}
.ts-auto.on {
  color: #fff;
  background: var(--hud-accent-soft);
  border-color: var(--hud-accent-soft);
  box-shadow: 0 8px 16px -8px rgba(var(--hud-accent-rgb), 0.9);
  animation: autoPulse 2.4s ease-in-out infinite;
}
@keyframes autoPulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.72;
  }
}
.hint {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  letter-spacing: 1.2px;
  color: #0a7a58;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(18, 184, 134, 0.1);
}
.hint i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #0e9d72;
  box-shadow: 0 0 0 3px rgba(18, 184, 134, 0.18);
  animation: dotPulse 2.2s ease-in-out infinite;
}
@keyframes dotPulse {
  0%,
  100% {
    box-shadow: 0 0 0 2px rgba(18, 184, 134, 0.2);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(18, 184, 134, 0.06);
  }
}
.op {
  display: flex;
  align-items: center;
  gap: 8px;
}
.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid #dbe9fb;
  box-shadow: 0 6px 14px -8px rgba(47, 110, 210, 0.7);
}
.op-id {
  font-size: 10px;
  letter-spacing: 1px;
  color: var(--hud-accent-soft);
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(var(--hud-accent-rgb), 0.1);
}
.uname {
  font-size: 12px;
  color: var(--iso-ink-2);
  white-space: nowrap;
}
.logout {
  letter-spacing: 1.2px;
  color: var(--iso-ink-3);
}

@media (max-width: 1080px) {
  .hint {
    display: none;
  }
}
@media (max-width: 860px) {
  .ts-label {
    display: none;
  }
}
@media (max-width: 720px) {
  .inner {
    height: 58px;
    padding: 0 14px;
  }
  .sub,
  .op-id,
  .divider {
    display: none;
  }
  .name {
    font-size: 14px;
    letter-spacing: 1.6px;
  }
  .cn {
    font-size: 12px;
    letter-spacing: 1px;
  }
  .theme-switch {
    padding: 3px 8px;
    gap: 5px;
  }
}
@media (max-width: 500px) {
  .uname {
    display: none;
  }
  .theme-switch {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .ts-auto.on {
    animation: none !important;
  }
}
</style>
