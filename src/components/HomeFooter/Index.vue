<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="table-wrap" ref="wrapRef">
    <div class="edge-mask" :class="{ on: showEdge }" aria-hidden="true"></div>
    <div class="edge-mask left" :class="{ on: showStart }" aria-hidden="true"></div>
    <n-data-table
      :data="deviceStore.laserRows"
      :columns="columns"
      :loading="deviceStore.loading"
      :row-key="(row: LaserDevice) => row.id"
      :scroll-x="scrollX"
      :single-line="false"
      size="small"
      :bordered="false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, h, ref } from 'vue'
import { NButton, NDataTable, useMessage, type DataTableColumns } from 'naive-ui'
import Upload from '@/components/HomeContent/DeviceConfig/UploadETC.vue'
import UpLaserIp from '@/components/HomeContent/DeviceConfig/Laser/UpLaserIp.vue'
import { useCompactViewport } from '@/composables/useCompactViewport'
import { useTableEdge } from '@/composables/useTableEdge'
import { useDeviceStore } from '@/stores/device'
import type { DeviceStatus, LaserDevice } from '@/utils/typing/raas'

const deviceStore = useDeviceStore()
const message = useMessage()

const STATUS_META: Record<DeviceStatus, { text: string; tone: string }> = {
  online: { text: '在线', tone: 'ok' },
  rebooting: { text: '重启中', tone: 'warn' },
  booting: { text: '启动中', tone: 'info' },
  offline: { text: '离线', tone: 'err' }
}

const wrapRef = ref<HTMLElement | null>(null)
const { showEdge, showStart } = useTableEdge(wrapRef)
const { compact } = useCompactViewport()

/** 紧凑视口下省掉端口列（卡片底部已展示端口），缩短横向滚动距离 */
const baseColumns: DataTableColumns<LaserDevice> = [
  {
    title: '设备状态',
    key: 'status',
    width: 110,
    align: 'center',
    render: (row: LaserDevice) => {
      const meta = STATUS_META[row.status]
      return h('span', { class: ['st', meta.tone] }, [
        h('i', { class: 'led' }),
        h('span', { class: 'txt' }, meta.text)
      ])
    }
  },
  { title: '设备名称', key: 'name', width: 130, align: 'center' },
  { title: '设备IP', key: 'ip', width: 150, align: 'center' },
  { title: '设备端口', key: 'port', width: 110, align: 'center' },
  {
    title: '测量数据',
    key: 'measure',
    width: 260,
    align: 'center',
    render: (row: LaserDevice) => {
      const m = row.measure
      if (!m) return h('span', { class: 'measure-empty' }, 'NO DATA')
      return h('div', { class: 'measure-box' }, [
        h('div', { class: 'line' }, [
          h('span', { class: 'kv' }, [h('em', {}, 'PWR'), ` ${m.power} W`]),
          h('span', { class: 'sep' }, '·'),
          h('span', { class: 'kv' }, [h('em', {}, 'WL'), ` ${m.wavelength} nm`])
        ]),
        h('div', { class: 'line' }, [
          h('span', { class: 'kv' }, [h('em', {}, 'TEMP'), ` ${m.temperature}℃`]),
          h('span', { class: 'sep' }, '·'),
          h('span', { class: 'kv' }, [h('em', {}, 'PW'), ` ${m.pulseWidth} ms`])
        ]),
        h('div', { class: 'line' }, [
          h('span', { class: 'kv dist' }, [h('em', {}, 'DIST'), ` ${Number(m.distance).toFixed(2)} m`])
        ]),
        h('div', { class: 'time' }, new Date(m.updatedAt).toLocaleTimeString('zh-CN', { hour12: false }))
      ])
    }
  },
  {
    title: '设备配置',
    key: 'config',
    width: 230,
    align: 'center',
    render: (row: LaserDevice) =>
      h('div', { class: 'action-row' }, [
        h(UpLaserIp, { device: row }),
        h(
          NButton,
          { type: 'primary', size: 'small', secondary: true, onClick: () => runMeasure(row) },
          { default: () => '立即测量' }
        )
      ])
  },
  {
    title: '更新激光应用ETC',
    key: 'upload',
    width: 290,
    align: 'center',
    render: (row: LaserDevice) => h(Upload, { target: 'laser', deviceId: row.id })
  }
]

const columns = computed(() =>
  compact.value ? baseColumns.filter((c) => ('key' in c ? c.key : '') !== 'port') : baseColumns
)
const scrollX = computed(() => (compact.value ? 1180 : 1360))

async function runMeasure(row: LaserDevice) {
  try {
    const m = await deviceStore.runMeasure(row.id)
    message.success(
      `${row.name} 测量完成：距离 ${Number(m.distance).toFixed(2)} m，功率 ${m.power} W，波长 ${m.wavelength} nm`
    )
  } catch (e) {
    message.error((e as Error).message)
  }
}
</script>

<style scoped>
.table-wrap {
  position: relative;
  width: 100%;
}
/* 右侧渐隐：提示还有列未露出，滚到底自动隐藏 */
.edge-mask {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 48px;
  z-index: 2;
  pointer-events: none;
  opacity: 0;
  border-radius: 0 12px 12px 0;
  background: linear-gradient(270deg, rgba(255, 255, 255, 0.96) 14%, rgba(255, 255, 255, 0.7) 48%, rgba(255, 255, 255, 0));
  transition: opacity 0.25s ease;
}
.edge-mask.on {
  opacity: 1;
}
.edge-mask.left {
  left: 0;
  right: auto;
  border-radius: 12px 0 0 12px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.96) 14%, rgba(255, 255, 255, 0.7) 48%, rgba(255, 255, 255, 0));
}
:deep(.n-data-table-th),
:deep(.n-data-table-td) {
  text-align: center;
  border-bottom: 1px solid #eff5fd !important;
}
:deep(.n-data-table-th) {
  font-size: 12px !important;
  font-weight: 600 !important;
  letter-spacing: 0.6px;
  color: #436994 !important;
  background: #f3f8ff !important;
  padding-top: 11px !important;
  padding-bottom: 11px !important;
}
:deep(.n-data-table-td) {
  font-size: 13px;
  color: #25415f;
  background: transparent !important;
  padding-top: 12px !important;
  padding-bottom: 12px !important;
}
:deep(.n-data-table-tr:hover .n-data-table-td) {
  background: rgba(var(--hud-accent-rgb), 0.045) !important;
}

/* 状态胶囊 */
:deep(.st) {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.4px;
}
:deep(.st .led) {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  animation: stPulse 2.6s ease-in-out infinite;
}
@keyframes stPulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.55;
    transform: scale(0.8);
  }
}
:deep(.st.ok) {
  color: #0a7a58;
  background: rgba(18, 184, 134, 0.12);
}
:deep(.st.ok .led) {
  background: #0e9d72;
}
:deep(.st.warn) {
  color: #a35a0a;
  background: rgba(255, 154, 60, 0.15);
}
:deep(.st.warn .led) {
  background: #d97d16;
}
:deep(.st.info) {
  color: var(--hud-accent-soft);
  background: rgba(var(--hud-accent-rgb), 0.12);
}
:deep(.st.info .led) {
  background: var(--hud-accent);
}
:deep(.st.err) {
  color: #c23a3a;
  background: rgba(255, 107, 107, 0.13);
}
:deep(.st.err .led) {
  background: #e05b5b;
}

:deep(.action-row) {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: nowrap;
}
:deep(.action-row .n-button) {
  font-size: 12px;
  letter-spacing: 0.4px;
}

/* 测量数值 */
:deep(.measure-box) {
  display: flex;
  flex-direction: column;
  gap: 3px;
  line-height: 1.5;
}
:deep(.measure-box .line) {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  white-space: nowrap;
  font-size: 12px;
}
:deep(.measure-box .kv) {
  color: #25415f;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
:deep(.measure-box .kv em) {
  font-style: normal;
  font-size: 9px;
  letter-spacing: 0.8px;
  color: var(--iso-ink-3);
  font-weight: 500;
  margin-right: 2px;
}
:deep(.measure-box .sep) {
  color: #c6d7ea;
}
:deep(.measure-box .time) {
  color: var(--iso-ink-3);
  font-size: 10px;
  letter-spacing: 0.4px;
}
:deep(.measure-empty) {
  color: var(--iso-ink-3);
  font-size: 11px;
  letter-spacing: 0.8px;
}
</style>
