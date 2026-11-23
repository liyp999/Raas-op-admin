<template>
  <div class="page">
    <UserTop />

    <main class="main">
      <div class="monitor-bar">
        <span class="mb-title">设备总览<span class="en">DEVICE MONITOR</span></span>
        <span class="mb-line"></span>
        <span class="mb-meta">
          链路
          <i :class="{ lost: !!deviceStore.error }">{{ deviceStore.error ? '异常' : '正常' }}</i>
          · 每 5s 刷新
        </span>
      </div>

      <section class="panel">
        <header class="panel-top">
          <div class="pt-left">
            <span class="icon-chip"><i class="led" :class="toneOf(deviceStore.summary.sys.status)"></i></span>
            <div class="pt-text">
              <span class="pt-name">边缘网关</span>
              <span class="pt-code">SYS-01 · {{ deviceStore.sys?.model || '—' }}</span>
            </div>
          </div>
          <div class="pt-right">
            <span class="metric"><em>{{ deviceStore.summary.sys.online }}</em>/{{ deviceStore.summary.sys.total }}</span>
            <span class="badge" :class="toneOf(deviceStore.summary.sys.status)">
              {{ statusText(deviceStore.summary.sys.status) }}
            </span>
          </div>
        </header>
        <SysData />
        <footer class="panel-bottom">
          <span>启动次数 <b>{{ deviceStore.sys?.bootCount ?? '—' }}</b></span>
          <span>最近启动 <b>{{ shortTime(deviceStore.sys?.lastBootAt) }}</b></span>
          <span>温度 <b>{{ deviceStore.sys?.temperature ?? '—' }}℃</b></span>
        </footer>
      </section>

      <section class="panel">
        <header class="panel-top">
          <div class="pt-left">
            <span class="icon-chip"><i class="led" :class="toneOf(deviceStore.summary.laser.status)"></i></span>
            <div class="pt-text">
              <span class="pt-name">红外激光</span>
              <span class="pt-code">LSR-01 · {{ deviceStore.laser?.model || '—' }}</span>
            </div>
          </div>
          <div class="pt-right">
            <span class="metric"><em>{{ deviceStore.summary.laser.online }}</em>/{{ deviceStore.summary.laser.total }}</span>
            <span class="badge" :class="toneOf(deviceStore.summary.laser.status)">
              {{ statusText(deviceStore.summary.laser.status) }}
            </span>
          </div>
        </header>
        <LaserData />
        <footer class="panel-bottom">
          <span>端口 <b>{{ deviceStore.laser?.port ?? '—' }}</b></span>
          <span>最近测量 <b>{{ shortTime(deviceStore.laser?.measure?.updatedAt) }}</b></span>
          <span>距离 <b>{{ fmtDist(deviceStore.laser?.measure?.distance) }}</b></span>
          <span>波长 <b>{{ deviceStore.laser?.measure?.wavelength ?? '—' }} nm</b></span>
        </footer>
      </section>

      <div class="sys-bar">
        <span class="left">
          <i class="pulse" :class="{ err: !!deviceStore.error }"></i>
          <span v-if="deviceStore.error" class="err">错误 · {{ deviceStore.error }}</span>
          <span v-else>自动刷新 5s · 最近同步 {{ deviceStore.lastUpdated || '—' }}</span>
          <span class="scroll-hint">← 左右滑动表格查看全部列 →</span>
        </span>
        <n-button size="tiny" secondary :loading="deviceStore.loading" @click="manualRefresh">同步 SYNC</n-button>
      </div>
    </main>

    <IsoScene class="iso-art" compact />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import UserTop from '@/components/HomeTop/Index.vue'
import SysData from '@/components/HomeContent/Index.vue'
import LaserData from '@/components/HomeFooter/Index.vue'
import IsoScene from '@/components/IsoScene/Index.vue'
import router from '@/router'
import { useDeviceStore } from '@/stores/device'
import { useUserStore } from '@/stores/user'
import type { DeviceStatus } from '@/utils/typing/raas'

const deviceStore = useDeviceStore()
const userStore = useUserStore()
let timer: number | undefined

const STATUS_TEXT: Record<DeviceStatus, string> = {
  online: 'ONLINE 在线',
  offline: 'OFFLINE 离线',
  rebooting: 'REBOOT 重启中',
  booting: 'BOOTING 启动中'
}

const statusText = (status: DeviceStatus) => STATUS_TEXT[status] || status

const toneOf = (status: DeviceStatus) => {
  if (status === 'online') return 'ok'
  if (status === 'rebooting') return 'warn'
  if (status === 'booting') return 'info'
  return 'err'
}

const shortTime = (iso?: string) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString('zh-CN', { hour12: false })
}

/** 测量距离，单位 m，保留两位小数 */
const fmtDist = (v?: number) => (typeof v === 'number' && Number.isFinite(v) ? `${v.toFixed(2)} m` : '—')

async function load() {
  try {
    await deviceStore.refresh()
  } catch (e) {
    if (!userStore.isLogin || (e as Error).message.includes('登录')) {
      router.replace('/login')
    }
  }
}

const manualRefresh = () => load()

onMounted(() => {
  load()
  timer = window.setInterval(load, 5000)
})

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer)
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
}

.main {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1680px;
  margin: 0 auto;
  padding: 18px 22px 30px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  box-sizing: border-box;
}

/* 顶部小标题 */
.monitor-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 4px;
  font-size: 12px;
  color: var(--iso-ink-2);
}
.mb-title {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: var(--iso-ink);
  letter-spacing: 0.5px;
}
.mb-title .en {
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 2px;
  color: var(--iso-ink-3);
}
.mb-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, rgba(var(--hud-accent-rgb), 0.35), rgba(var(--hud-accent-rgb), 0));
}
.mb-meta i {
  font-style: normal;
  color: #0a7a58;
  font-weight: 600;
}
.mb-meta i.lost {
  color: #c23a3a;
}

/* 白色等轴测卡片 */
.panel {
  position: relative;
  background: var(--iso-card);
  border: 1px solid rgba(214, 229, 248, 0.95);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 28px 48px -34px rgba(35, 88, 168, 0.65), 0 1px 0 rgba(255, 255, 255, 0.9) inset;
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  transition: transform 0.35s ease, box-shadow 0.35s ease;
}
.panel:hover {
  transform: translateY(-3px);
  box-shadow: 0 34px 56px -32px rgba(35, 88, 168, 0.7), 0 1px 0 rgba(255, 255, 255, 0.9) inset;
}
.panel-top {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 20px;
  background: linear-gradient(90deg, rgba(var(--hud-accent-rgb), 0.07), rgba(255, 255, 255, 0) 55%);
  border-bottom: 1px solid #eef5fd;
  overflow: hidden;
}
/* 顶部细流光 */
.panel-top::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 26%;
  height: 2px;
  border-radius: 2px;
  background: linear-gradient(90deg, transparent, rgba(var(--hud-accent-rgb), 0.75), transparent);
  animation: topSweep 6.4s ease-in-out infinite;
}
@keyframes topSweep {
  0% {
    transform: translateX(-110%);
  }
  70%,
  100% {
    transform: translateX(430%);
  }
}

.icon-chip {
  width: 34px;
  height: 34px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: linear-gradient(135deg, #f4f9ff, #dceaff);
  box-shadow: inset 0 0 0 1px rgba(120, 165, 225, 0.35), 0 8px 16px -10px rgba(47, 110, 210, 0.8);
}
.led {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: ledPulse 2.6s ease-in-out infinite;
}
@keyframes ledPulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(0.82);
  }
}
.led.ok {
  background: #0e9d72;
  box-shadow: 0 0 0 4px rgba(18, 184, 134, 0.16);
}
.led.warn {
  background: #d97d16;
  box-shadow: 0 0 0 4px rgba(255, 154, 60, 0.18);
}
.led.info {
  background: var(--hud-accent);
  box-shadow: 0 0 0 4px rgba(var(--hud-accent-rgb), 0.16);
}
.led.err {
  background: #e05b5b;
  box-shadow: 0 0 0 4px rgba(255, 107, 107, 0.16);
}

.pt-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.pt-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.pt-name {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: var(--iso-ink);
  white-space: nowrap;
}
.pt-code {
  font-size: 11px;
  letter-spacing: 0.6px;
  color: var(--iso-ink-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pt-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: none;
}
.metric {
  font-size: 12px;
  color: var(--iso-ink-3);
  font-variant-numeric: tabular-nums;
}
.metric em {
  font-style: normal;
  font-size: 20px;
  font-weight: 700;
  color: var(--hud-accent);
  margin-right: 2px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 11px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.6px;
  white-space: nowrap;
}
.badge::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.badge.ok {
  color: #0a7a58;
  background: rgba(18, 184, 134, 0.12);
}
.badge.ok::before {
  background: #0e9d72;
}
.badge.warn {
  color: #a35a0a;
  background: rgba(255, 154, 60, 0.14);
}
.badge.warn::before {
  background: #d97d16;
}
.badge.info {
  color: var(--hud-accent-soft);
  background: rgba(var(--hud-accent-rgb), 0.12);
}
.badge.info::before {
  background: var(--hud-accent);
}
.badge.err {
  color: #c23a3a;
  background: rgba(255, 107, 107, 0.13);
}
.badge.err::before {
  background: #e05b5b;
}

.panel-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 9px 20px 11px;
  border-top: 1px solid #f0f6fd;
  background: rgba(244, 249, 255, 0.6);
  font-size: 11px;
  color: var(--iso-ink-3);
  letter-spacing: 0.4px;
}
.panel-bottom b {
  font-weight: 600;
  color: var(--iso-ink-2);
  font-variant-numeric: tabular-nums;
  margin-left: 4px;
}

/* 底部状态条 */
.sys-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 2px 4px 0;
  font-size: 11px;
  color: var(--iso-ink-3);
}
.sys-bar .left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  overflow: hidden;
}
.sys-bar .err {
  color: #c23a3a;
}
.pulse {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--hud-accent);
  box-shadow: 0 0 0 4px rgba(var(--hud-accent-rgb), 0.14);
  animation: dotPulse 2s ease-in-out infinite;
}
.pulse.err {
  background: #e05b5b;
  box-shadow: 0 0 0 4px rgba(255, 107, 107, 0.16);
  animation: none;
}
@keyframes dotPulse {
  0%,
  100% {
    box-shadow: 0 0 0 3px rgba(var(--hud-accent-rgb), 0.16);
  }
  50% {
    box-shadow: 0 0 0 7px rgba(var(--hud-accent-rgb), 0.05);
  }
}
.scroll-hint {
  display: none;
  color: var(--hud-accent-soft);
  white-space: nowrap;
}

/* 右下角等轴测场景：漂浮装饰 */
.iso-art {
  position: fixed;
  right: 4px;
  bottom: 6px;
  width: min(28vw, 400px);
  pointer-events: none;
  user-select: none;
  opacity: 0.92;
  z-index: 0;
}

@media (max-width: 1200px) {
  .scroll-hint {
    display: inline;
  }
  .iso-art {
    width: 300px;
    opacity: 0.6;
  }
}
@media (max-width: 1000px) {
  .iso-art {
    display: none;
  }
}
@media (max-width: 820px) {
  .main {
    padding: 14px 14px 22px;
    gap: 14px;
  }
  .panel-top {
    padding: 12px 14px;
  }
  .panel-bottom {
    padding: 8px 14px 10px;
    gap: 10px;
    flex-wrap: wrap;
  }
  .mb-title {
    font-size: 14px;
  }
  .mb-title .en {
    display: none;
  }
  .mb-meta {
    display: none;
  }
  .sys-bar {
    flex-wrap: wrap;
    row-gap: 6px;
  }
  .sys-bar .left {
    flex-wrap: wrap;
    row-gap: 2px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .panel::after,
  .led,
  .pulse {
    animation: none !important;
  }
}
</style>
