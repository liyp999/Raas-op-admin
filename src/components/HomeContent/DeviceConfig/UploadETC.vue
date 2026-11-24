<template>
  <div class="upload-wrap">
    <n-upload v-model:file-list="fileList" :custom-request="customRequest" :max="5" class="uploader">
      <n-upload-dragger class="dragger">
        <div class="head">
          <span class="icon">↑</span>
          <span class="main-text">上传 / 更新应用</span>
        </div>
        <div class="hint">SINGLE ≤ 100MB · MAX 5</div>
      </n-upload-dragger>
    </n-upload>

    <div v-if="recent.length" class="recent">
      <div v-for="item in recent" :key="item.id" class="recent-item">
        <span class="dot"></span>
        <span class="name" :title="item.filename">{{ item.filename }}</span>
        <span class="size">{{ formatSize(item.size) }}</span>
        <span class="time">{{ time(item.uploadedAt) }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import {
  NUpload,
  NUploadDragger,
  useMessage,
  type UploadCustomRequestOptions,
  type UploadFileInfo
} from 'naive-ui'
import { useDeviceStore } from '@/stores/device'
import type { UploadTarget } from '@/api/upload'

const props = withDefaults(defineProps<{ target?: UploadTarget; deviceId?: string }>(), {
  target: 'sys',
  deviceId: ''
})

const deviceStore = useDeviceStore()
const message = useMessage()
const fileList = ref<UploadFileInfo[]>([])

const recent = computed(() =>
  deviceStore.files
    .filter((f) => f.target === props.target && (!props.deviceId || f.deviceId === props.deviceId))
    .slice(0, 2)
)

const formatSize = (size: number) => {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

const time = (iso: string) => new Date(iso).toLocaleTimeString('zh-CN', { hour12: false })

const customRequest = async ({ file, onFinish, onError, onProgress }: UploadCustomRequestOptions) => {
  const raw = file.file
  if (!raw) {
    message.error('未获取到文件对象')
    onError()
    return
  }
  if (raw.size > 100 * 1024 * 1024) {
    message.error('文件超过 100MB 限制')
    onError()
    return
  }
  try {
    const record = await deviceStore.upload(raw, props.target, props.deviceId, (percent) =>
      onProgress({ percent })
    )
    message.success(`「${record.filename}」上传成功`)
    onFinish()
    fileList.value = []
    deviceStore.loadFiles().catch(() => undefined)
  } catch (e) {
    message.error((e as Error).message)
    onError()
  }
}
</script>

<style scoped>
.upload-wrap {
  width: 100%;
}
.uploader {
  width: 100%;
}
:deep(.dragger) {
  padding: 9px 8px 8px;
  border-radius: 12px;
  border: 1px dashed #d7e6f8;
  background: #f8fbff;
  transition: background 0.2s ease, border-color 0.2s ease;
}
:deep(.dragger:hover) {
  background: rgba(var(--hud-accent-rgb), 0.06);
  border-color: rgba(var(--hud-accent-rgb), 0.55);
}
.head {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
}
.icon {
  width: 18px;
  height: 18px;
  line-height: 17px;
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  color: var(--hud-accent);
  border-radius: 6px;
  background: rgba(var(--hud-accent-rgb), 0.1);
  border: 1px solid rgba(var(--hud-accent-rgb), 0.25);
}
.main-text {
  font-size: 12.5px;
  font-weight: 600;
  color: #3a5878;
}
.hint {
  margin-top: 4px;
  font-size: 10px;
  letter-spacing: 0.6px;
  color: var(--iso-ink-3);
}
.recent {
  margin-top: 6px;
  padding: 4px 8px;
  border-radius: 8px;
  background: rgba(244, 249, 255, 0.9);
  font-size: 10.5px;
  color: #43617f;
}
.recent-item {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: space-between;
  line-height: 1.75;
}
.dot {
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #12b886;
}
.name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.size,
.time {
  color: var(--iso-ink-3);
  flex: none;
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}
</style>
