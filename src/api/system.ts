import { http } from '@/utils/request'
import type { DeviceOverview, SysDevice } from '@/utils/typing/raas'

/** 设备总览：多台网关 + 多台激光 + 分组统计 */
export function getOverview() {
  return http.get<DeviceOverview>('/devices')
}

/** 单台边缘网关详情 */
export function getGateway(deviceId: string) {
  return http.get<SysDevice>(`/devices/gateway/${deviceId}`)
}

/** 修改某台边缘网关 IP */
export function updateGatewayIp(deviceId: string, ip: string) {
  return http.put<SysDevice>(`/devices/gateway/${deviceId}/ip`, { ip })
}

/** 重启某台边缘网关 */
export function rebootGateway(deviceId: string) {
  return http.post<{ taskId: string; deviceId: string; status: string; eta: number }>(
    `/devices/gateway/${deviceId}/reboot`
  )
}

/** 关机 */
export function shutdownGateway(deviceId: string) {
  return http.post<SysDevice>(`/devices/gateway/${deviceId}/shutdown`)
}

/** 开机 */
export function poweronGateway(deviceId: string) {
  return http.post<SysDevice>(`/devices/gateway/${deviceId}/poweron`)
}
