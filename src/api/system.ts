import { http } from '@/utils/request'
import type { DeviceOverview, SysDevice } from '@/utils/typing/raas'

/** 设备总览：网关 + 激光 + 统计 */
export function getOverview() {
  return http.get<DeviceOverview>('/devices')
}

/** 边缘网关设备详情 */
export function getSysDevice() {
  return http.get<SysDevice>('/devices/sys')
}

/** 修改边缘网关 IP */
export function updateSysIp(ip: string) {
  return http.put<SysDevice>('/devices/sys/ip', { ip })
}

/** 重启边缘网关 */
export function rebootSys() {
  return http.post<{ taskId: string; status: string; eta: number }>('/devices/sys/reboot')
}

/** 关机 */
export function shutdownSys() {
  return http.post<SysDevice>('/devices/sys/shutdown')
}

/** 开机 */
export function poweronSys() {
  return http.post<SysDevice>('/devices/sys/poweron')
}
