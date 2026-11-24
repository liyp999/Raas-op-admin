import { defineStore } from 'pinia'
import {
  getOverview,
  poweronGateway,
  rebootGateway,
  shutdownGateway,
  updateGatewayIp
} from '@/api/system'
import { measureLaser, updateLaser } from '@/api/laser'
import { deleteFile, getFiles, uploadFile, type UploadTarget } from '@/api/upload'
import type {
  DeviceOverview,
  DeviceSummary,
  LaserDevice,
  SysDevice,
  UploadedFile
} from '@/utils/typing/raas'

const emptySummary: DeviceSummary = {
  gateway: { online: 0, total: 0 },
  laser: { online: 0, total: 0 }
}

export const useDeviceStore = defineStore('device', {
  state: () => ({
    gateways: [] as SysDevice[],
    lasers: [] as LaserDevice[],
    summary: emptySummary,
    files: [] as UploadedFile[],
    loading: false,
    lastUpdated: '',
    error: ''
  }),
  getters: {
    /** 表格数据源：条数完全由后端 devices.json 决定 */
    sysRows: (state): SysDevice[] => state.gateways,
    laserRows: (state): LaserDevice[] => state.lasers,
    sysCount: (state) => `${state.summary.gateway.online}/${state.summary.gateway.total}`,
    laserCount: (state) => `${state.summary.laser.online}/${state.summary.laser.total}`
  },
  actions: {
    applyOverview(data: DeviceOverview) {
      this.gateways = data.gateways || []
      this.lasers = data.lasers || []
      this.summary = data.summary || emptySummary
      this.lastUpdated = new Date().toLocaleTimeString('zh-CN', { hour12: false })
      this.error = ''
    },

    async refresh() {
      this.loading = true
      try {
        this.applyOverview(await getOverview())
      } catch (e) {
        this.error = (e as Error).message
        throw e
      } finally {
        this.loading = false
      }
    },

    async changeSysIp(deviceId: string, ip: string) {
      const device = await updateGatewayIp(deviceId, ip)
      const idx = this.gateways.findIndex((d) => d.id === deviceId)
      if (idx >= 0) this.gateways[idx] = device
      return device
    },

    async rebootSysDevice(deviceId: string) {
      const result = await rebootGateway(deviceId)
      await this.refresh()
      return result
    },

    async shutdownSysDevice(deviceId: string) {
      await shutdownGateway(deviceId)
      await this.refresh()
    },

    async poweronSysDevice(deviceId: string) {
      await poweronGateway(deviceId)
      await this.refresh()
    },

    async changeLaserConfig(deviceId: string, ip: string, port: number) {
      const device = await updateLaser(deviceId, ip, port)
      const idx = this.lasers.findIndex((d) => d.id === deviceId)
      if (idx >= 0) this.lasers[idx] = device
      return device
    },

    async runMeasure(deviceId: string) {
      const measure = await measureLaser(deviceId)
      const idx = this.lasers.findIndex((d) => d.id === deviceId)
      if (idx >= 0) this.lasers[idx] = { ...this.lasers[idx], measure }
      return measure
    },

    async loadFiles() {
      this.files = await getFiles()
      return this.files
    },

    async upload(file: File, target: UploadTarget, deviceId = '', onProgress?: (p: number) => void) {
      const record = await uploadFile(file, target, deviceId, onProgress)
      this.files.unshift(record)
      return record
    },

    async removeFile(id: string) {
      await deleteFile(id)
      this.files = this.files.filter((f) => f.id !== id)
    }
  }
})
