<template>
  <n-button @click="open" type="primary" size="small" :disabled="!online">配置修改</n-button>
  <n-modal v-model:show="showModal" preset="card" size="huge" style="width: 600px" :bordered="false">
    <template #header>
      <div class="m-head">
        <span class="tagline">// NETWORK CONFIG</span>
        <h3>边缘网关 IP 修改</h3>
      </div>
    </template>
    <template #footer>
      <n-form label-position="top">
        <n-form-item label="DEVICE ADDRESS / 设备 IP">
          <n-input v-model:value="ip" placeholder="例如 192.168.1.28" :maxlength="15" />
        </n-form-item>
        <div class="meta">
          CURRENT IP <b>{{ deviceStore.sys?.ip || '--' }}</b>
          <span class="sep">|</span>
          MODEL <b>{{ deviceStore.sys?.model || '--' }}</b>
        </div>
      </n-form>
      <div class="actions">
        <n-button type="primary" :loading="saving" strong @click="submit">APPLY / 应用</n-button>
        <n-button class="cancel" :disabled="saving" @click="showModal = false">取消</n-button>
      </div>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { NButton, NForm, NFormItem, NInput, NModal, useMessage } from 'naive-ui'
import { useDeviceStore } from '@/stores/device'

const deviceStore = useDeviceStore()
const message = useMessage()
const showModal = ref(false)
const saving = ref(false)
const ip = ref('')

const online = computed(() => deviceStore.sys?.status === 'online')

const IPV4 = /^((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/

function open() {
  ip.value = deviceStore.sys?.ip || ''
  showModal.value = true
}

async function submit() {
  const value = ip.value.trim()
  if (!IPV4.test(value)) {
    message.error('IP 格式不合法，应为 0-255 的四段点分十进制')
    return
  }
  if (value === deviceStore.sys?.ip) {
    message.info('IP 未发生变化')
    showModal.value = false
    return
  }
  saving.value = true
  try {
    await deviceStore.changeSysIp(value)
    message.success(`IP 已更新为 ${value}`)
    showModal.value = false
  } catch (e) {
    message.error((e as Error).message)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.m-head .tagline {
  font-size: 10px;
  letter-spacing: 1.2px;
  font-weight: 600;
  color: var(--hud-accent);
}
.m-head h3 {
  margin: 5px 0 0;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: var(--iso-ink);
}
.actions {
  display: flex;
  gap: 10px;
  margin-top: 18px;
}
.actions .cancel {
  color: #4d6f92 !important;
  border-color: #dfeaf8 !important;
  background: #f7faff !important;
}
.meta {
  font-size: 11px;
  letter-spacing: 0.2px;
  color: var(--iso-ink-3);
  margin-top: 2px;
}
.meta b {
  color: #25415f;
  font-weight: 600;
  margin: 0 4px;
}
.meta .sep {
  margin: 0 8px;
  color: #cfdeee;
}
</style>
