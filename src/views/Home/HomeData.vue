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
            <span class="icon-chip"><i class="led" :class="groupTone(sysSummary)"></i></span>
            <div class="pt-text">
              <span class="pt-name">边缘网关</span>
              <span class="pt-code">EDGE · 共 {{ sysSummary.total }} 台 · {{ gatewayModel }}</span>
            </div>
          </div>
          <div class="pt-right">
            <span class="metric"><em>{{ sysSummary.online }}</em>/{{ sysSummary.total }}</span>
            <span class="badge" :class="groupTone(sysSummary)">
              {{ groupText(sysSummary) }}
            </span>
          </div>
        </header>
        <SysData />
        <footer class="panel-bottom">
          <span>在网 <b>{{ sysSummary.online }}/{{ sysSummary.total }}</b></span>
          <span>平均温度 <b>{{ avgTemp }}℃</b></span>
          <span>最近启动 <b>{{ lastBoot }}</b></span>
        </footer>
      </section>

      <section class="panel">
        <header class="panel-top">
          <div class="pt-left">
            <span class="icon-chip"><i class="led" :class="groupTone(laserSummary)"></i></span>
            <div class="pt-text">
              <span class="pt-name">红外激光</span>
              <span class="pt-code">LASER · 共 {{ laserSummary.total }} 台 · {{ laserModel }}</span>
            </div>
          </div>
          <div class="pt-right">
            <span class="metric"><em>{{ laserSummary.online }}</em>/{{ laserSummary.total }}</span>
            <span class="badge" :class="groupTone(laserSummary)">
              {{ groupText(laserSummary) }}
            </span>
          </div>
        </header>
        <LaserData />
        <footer class="panel-bottom">
          <span>在网 <b>{{ laserSummary.online }}/{{ laserSummary.total }}</b></span>
          <span>最近测量 <b>{{ lastMeasureAt }}</b></span>
          <span>距离 <b>{{ distRange }}</b></span>
          <span>端口 <b>{{ portRange }}</b></span>
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
import { computed, onBeforeUnmount, onMounted } from 'vue'
import UserTop from '@/components/HomeTop/Index.vue'
import SysData from '@/components/HomeContent/Index.vue'
import LaserData from '@/components/HomeFooter/Index.vue'
import IsoScene from '@/components/IsoScene/Index.vue'
import router from '@/router'
import { useDeviceStore } from '@/stores/device'
import { useUserStore } from '@/stores/user'
import type { GroupSummary } from '@/utils/typing/raas'

const deviceStore = useDeviceStore()
const userStore = useUserStore()
let timer: number | undefined

/* ── 分组统计 ── */
const sysSummary = computed<GroupSummary>(() => deviceStore.summary.gateway)
const laserSummary = computed<GroupSummary>(() => deviceStore.summary.laser)

const gatewayModel = computed(() => deviceStore.gateways[0]?.model || '—')
const laserModel = computed(() => deviceStore.lasers[0]?.model || '—')

/** 在线比例决定色调：全在线 ok / 部分在线 warn / 全离线 err */
const groupTone = (g: GroupSummary) => {
  if (!g.total) return 'err'
  if (g.online === g.total) return 'ok'
  if (g.online === 0) return 'err'
  return 'warn'
}

const groupText = (g: GroupSummary) => {
  if (!g.total) return 'NO DEVICE 未配置'
  if (g.online === g.total) return `ALL ONLINE 全部在线`
  return `${g.total - g.online} 台离线`
}

const shortTime = (iso?: string) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString('zh-CN', { hour12: false })
}

/** 测量距离，单位 m，保留两位小数 */
const fmtDist = (v?: number) => (typeof v === 'number' && Number.isFinite(v) ? `${v.toFixed(2)} m` : '—')

/** 在线网关的平均温度 */
const avgTemp = computed(() => {
  const online = deviceStore.gateways.filter((d) => d.status === 'online')
  if (!online.length) return '—'
  const sum = online.reduce((acc, d) => acc + (Number(d.temperature) || 0), 0)
  return (sum / online.length).toFixed(1)
})

/** 全部网关里最近的一次启动时间 */
const lastBoot = computed(() => {
  const stamps = deviceStore.gateways
    .map((d) => d.lastBootAt)
    .filter(Boolean)
    .map((iso) => new Date(iso).getTime())
    .filter((n) => Number.isFinite(n))
  if (!stamps.length) return '—'
  return shortTime(new Date(Math.max(...stamps)).toISOString())
})

/** 全部激光里最近的一次测量时间 */
const lastMeasureAt = computed(() => {
  const stamps = deviceStore.lasers
    .map((d) => d.measure?.updatedAt)
    .filter(Boolean)
    .map((iso) => new Date(iso as string).getTime())
    .filter((n) => Number.isFinite(n))
  if (!stamps.length) return '—'
  return shortTime(new Date(Math.max(...stamps)).toISOString())
})

/** 各台激光的测距范围 */
const distRange = computed(() => {
  const values = deviceStore.lasers
    .map((d) => d.measure?.distance)
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
  if (!values.length) return '—'
  const min = Math.min(...values)
  const max = Math.max(...values)
  return min === max ? fmtDist(min) : `${min.toFixed(2)}–${max.toFixed(2)} m`
})

/** 各台激光的端口范围 */
const portRange = computed(() => {
  const ports = deviceStore.lasers.map((d) => d.port).filter((p): p is number => Number.isFinite(p))
  if (!ports.length) return '—'
  const min = Math.min(...ports)
  const max = Math.max(...ports)
  return min === max ? `${min}` : `${min}–${max}`
})

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
