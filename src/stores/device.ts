import { defineStore } from 'pinia'
import { getOverview, rebootSys, shutdownSys, poweronSys, updateSysIp } from '@/api/system'
import { measureLaser, updateLaser } from '@/api/laser'
import { getFiles, uploadFile, deleteFile, type UploadTarget } from '@/api/upload'
import type { DeviceSummary, LaserDevice, SysDevice, UploadedFile } from '@/utils/typing/raas'

const emptySummary: DeviceSummary = {
  sys: { status: 'offline', online: 0, total: 0 },
  laser: { status: 'offline', online: 0, total: 0 }
}

export const useDeviceStore = defineStore('device', {
  state: () => ({
    sys: null as SysDevice | null,
    laser: null as LaserDevice | null,
    summary: emptySummary,
    files: [] as UploadedFile[],
    loading: false,
    lastUpdated: '',
    error: ''
  }),
  getters: {
    sysRows: (state) => (state.sys ? [state.sys] : []),
    laserRows: (state) => (state.laser ? [state.laser] : []),
    sysCount: (state) => `${state.summary.sys.online}/${state.summary.sys.total}`,
    laserCount: (state) => `${state.summary.laser.online}/${state.summary.laser.total}`
  },
  actions: {
    applyOverview(data: { sys: SysDevice; laser: LaserDevice; summary: DeviceSummary }) {
      this.sys = data.sys
      this.laser = data.laser
      this.summary = data.summary
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

    async changeSysIp(ip: string) {
      const device = await updateSysIp(ip)
      this.sys = device
      return device
    },

    async rebootSysDevice() {
      const result = await rebootSys()
      await this.refresh()
      return result
    },

    async shutdownSysDevice() {
      await shutdownSys()
      await this.refresh()
    },

    async poweronSysDevice() {
      await poweronSys()
      await this.refresh()
    },

    async changeLaserConfig(ip: string, port: number) {
      const device = await updateLaser(ip, port)
      this.laser = device
      return device
    },

    async runMeasure() {
      const measure = await measureLaser()
      if (this.laser) this.laser = { ...this.laser, measure }
      return measure
    },

    async loadFiles() {
      this.files = await getFiles()
      return this.files
    },

    async upload(file: File, target: UploadTarget, onProgress?: (p: number) => void) {
      const record = await uploadFile(file, target, onProgress)
      this.files.unshift(record)
      return record
    },

    async removeFile(id: string) {
      await deleteFile(id)
      this.files = this.files.filter((f) => f.id !== id)
    }
  }
})
