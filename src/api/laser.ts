import { http } from '@/utils/request'
import type { LaserDevice, LaserMeasure } from '@/utils/typing/raas'

/** 单台红外激光设备详情（含最新测量数据） */
export function getLaser(deviceId: string) {
  return http.get<LaserDevice>(`/devices/laser/${deviceId}`)
}

/** 修改某台激光设备的 IP 与端口 */
export function updateLaser(deviceId: string, ip: string, port: number) {
  return http.put<LaserDevice>(`/devices/laser/${deviceId}/ip`, { ip, port })
}

/** 对某台设备触发一次测量，返回新的测量结果 */
export function measureLaser(deviceId: string) {
  return http.post<LaserMeasure>(`/devices/laser/${deviceId}/measure`)
}

/** 某台设备的历史测量数据 */
export function getLaserHistory(deviceId: string) {
  return http.get<LaserMeasure[]>(`/devices/laser/${deviceId}/history`)
}
