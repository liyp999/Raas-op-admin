import { http } from '@/utils/request'
import type { LaserDevice, LaserMeasure } from '@/utils/typing/raas'

/** 红外激光设备详情（含最新测量数据） */
export function getLaserDevice() {
  return http.get<LaserDevice>('/devices/laser')
}

/** 修改激光设备 IP 与端口 */
export function updateLaser(ip: string, port: number) {
  return http.put<LaserDevice>('/devices/laser/ip', { ip, port })
}

/** 触发一次测量，返回新的测量结果 */
export function measureLaser() {
  return http.post<LaserMeasure>('/devices/laser/measure')
}

/** 历史测量数据 */
export function getLaserHistory() {
  return http.get<LaserMeasure[]>('/devices/laser/history')
}
