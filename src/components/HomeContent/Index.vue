<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="table-wrap" ref="wrapRef">
    <div class="edge-mask" :class="{ on: showEdge }" aria-hidden="true"></div>
    <div class="edge-mask left" :class="{ on: showStart }" aria-hidden="true"></div>
    <n-data-table
      :data="deviceStore.sysRows"
      :columns="columns"
      :loading="deviceStore.loading"
      :row-key="(row: SysDevice) => row.id"
      :scroll-x="scrollX"
      :single-line="false"
      size="small"
      :bordered="false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, h, ref } from 'vue'
import {
  NButton,
  NDataTable,
  NPopconfirm,
  useMessage,
  type DataTableColumns
} from 'naive-ui'
import UpdateIp from '@/components/HomeContent/DeviceConfig/Sys/UpdateIp.vue'
import Upload from '@/components/HomeContent/DeviceConfig/UploadETC.vue'
import { useCompactViewport } from '@/composables/useCompactViewport'
import { useTableEdge } from '@/composables/useTableEdge'
import { useDeviceStore } from '@/stores/device'
import type { DeviceStatus, SysDevice } from '@/utils/typing/raas'

const deviceStore = useDeviceStore()
const message = useMessage()

const STATUS_META: Record<DeviceStatus, { text: string; tone: string }> = {
  online: { text: '在线', tone: 'ok' },
  rebooting: { text: '重启中', tone: 'warn' },
  booting: { text: '启动中', tone: 'info' },
  offline: { text: '已关机', tone: 'err' }
}

const wrapRef = ref<HTMLElement | null>(null)
const { showEdge, showStart } = useTableEdge(wrapRef)
const { compact } = useCompactViewport()

/** 紧凑视口下省掉型号列（卡片头部已展示型号），缩短横向滚动距离 */
const baseColumns: DataTableColumns<SysDevice> = [
  {
    title: '设备状态',
    key: 'status',
    width: 110,
    align: 'center',
    render: (row: SysDevice) => {
      const meta = STATUS_META[row.status]
      return h('span', { class: ['st', meta.tone] }, [
        h('i', { class: 'led' }),
        h('span', { class: 'txt' }, meta.text)
      ])
    }
  },
  { title: '设备名称', key: 'name', width: 120, align: 'center' },
  { title: '设备型号', key: 'model', width: 150, align: 'center' },
  { title: '设备IP', key: 'ip', width: 150, align: 'center' },
  {
    title: '运行信息',
    key: 'runtime',
    width: 230,
    align: 'center',
    render: (row: SysDevice) =>
      h('span', { class: 'runtime' }, [
        h('b', {}, `CPU ${row.cpu}%`),
        h('span', { class: 'sep' }, '·'),
        h('b', {}, `MEM ${row.mem}%`),
        h('span', { class: 'sep' }, '·'),
        h('b', {}, `${row.temperature}℃`)
      ])
  },
  {
    title: '设备配置',
    key: 'config',
    width: 310,
    align: 'center',
    render: (row: SysDevice) =>
      h('div', { class: 'action-row' }, [
        h(UpdateIp),
        row.status === 'offline'
          ? h(
              NPopconfirm,
              { onPositiveClick: () => poweron(), positiveText: '开机', negativeText: '取消' },
              {
                trigger: () =>
                  h(NButton, { type: 'primary', size: 'small', secondary: true }, { default: () => '设备开机' }),
                default: () => '确认将该设备开机？'
              }
            )
          : h(
              NPopconfirm,
              { onPositiveClick: () => reboot(), positiveText: '重启', negativeText: '取消' },
              {
                trigger: () =>
                  h(NButton, { type: 'warning', size: 'small', secondary: true }, { default: () => '设备重启' }),
                default: () => '确认将该设备重启？约 3 秒后恢复在线。'
              }
            ),
        h(
          NPopconfirm,
          {
            onPositiveClick: () => shutdown(),
            positiveText: '关机',
            negativeText: '取消',
            disabled: row.status !== 'online'
          },
          {
            trigger: () =>
              h(
                NButton,
                { type: 'error', size: 'small', secondary: true, disabled: row.status !== 'online' },
                { default: () => '设备关机' }
              ),
            default: () => '确认将该设备关机？关机后将无法远程配置。'
          }
        )
      ])
  },
  {
    title: '更新系统应用ETC',
    key: 'upload',
    width: 290,
    align: 'center',
    render: () => h(Upload, { target: 'sys' })
  }
]

const columns = computed(() =>
  compact.value ? baseColumns.filter((c) => ('key' in c ? c.key : '') !== 'model') : baseColumns
)
const scrollX = computed(() => (compact.value ? 1220 : 1380))

async function reboot() {
  try {
    const result = await deviceStore.rebootSysDevice()
    message.success(`重启指令已下发，预计 ${result.eta} 秒恢复`)
  } catch (e) {
    message.error((e as Error).message)
  }
}

async function shutdown() {
  try {
    await deviceStore.shutdownSysDevice()
    message.warning('设备已关机')
  } catch (e) {
    message.error((e as Error).message)
  }
}

async function poweron() {
  try {
    await deviceStore.poweronSysDevice()
    message.success('开机指令已下发，设备启动中')
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
:deep(.n-data-table .n-data-table-td:last-child),
:deep(.n-data-table .n-data-table-th:last-child) {
  border-right: none;
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

/* 操作按钮不换行，避免“设备关机”被截断 */
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

/* 遥测数值 */
:deep(.runtime) {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  white-space: nowrap;
  font-size: 12px;
  color: var(--iso-ink-3);
}
:deep(.runtime b) {
  font-weight: 600;
  color: #25415f;
  font-variant-numeric: tabular-nums;
}
:deep(.runtime .sep) {
  color: #c6d7ea;
}
</style>
