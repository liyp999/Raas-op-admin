/** 登录请求体 */
export interface LoginPayload {
  username: string
  password: string
}

/** 登录返回 */
export interface LoginResult {
  token: string
  expiresIn: number
  user: UserInfo
}

export interface UserInfo {
  username: string
  name: string
  role: string
}

/** 设备在线状态 */
export type DeviceStatus = 'online' | 'offline' | 'rebooting' | 'booting'

/** 边缘网关（系统）设备 */
export interface SysDevice {
  id: string
  name: string
  model: string
  ip: string
  status: DeviceStatus
  appVersion: string
  firmware: string
  bootCount: number
  lastBootAt: string
  cpu: number
  mem: number
  temperature: number
  note: string
}

/** 激光测量结果 */
export interface LaserMeasure {
  power: number
  wavelength: number
  temperature: number
  pulseWidth: number
  /** 测量距离，单位 m */
  distance: number
  updatedAt: string
}

/** 红外激光设备 */
export interface LaserDevice {
  id: string
  name: string
  model: string
  ip: string
  port: number
  status: DeviceStatus
  measure: LaserMeasure
  history?: LaserMeasure[]
}

/** 分组设备统计（在线数 / 总数） */
export interface GroupSummary {
  online: number
  total: number
}

/** 两类设备的分组统计 */
export interface DeviceSummary {
  gateway: GroupSummary
  laser: GroupSummary
}

/** 设备总览：多台网关 + 多台激光（条数由后端 devices.json 决定） */
export interface DeviceOverview {
  gateways: SysDevice[]
  lasers: LaserDevice[]
  summary: DeviceSummary
}

/** 上传文件记录 */
export interface UploadedFile {
  id: string
  filename: string
  storedName: string
  size: number
  target: 'sys' | 'laser'
  /** 目标设备 id，未指定时为空串 */
  deviceId?: string
  mimetype: string
  uploadedAt: string
  uploadedBy: string
  url: string
}

/** 通用响应外壳（拦截器已拆壳，保留供参考） */
export interface ApiEnvelope<T> {
  code: number
  msg: string
  data: T
  ts: number
}
