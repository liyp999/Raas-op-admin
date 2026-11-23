import { http } from '@/utils/request'
import type { LoginPayload, LoginResult, UserInfo } from '@/utils/typing/raas'

/** 登录，成功返回 token 与用户信息 */
export function userLogin(data: LoginPayload) {
  return http.post<LoginResult>('/auth/login', data)
}

/** 退出登录（服务端销毁会话） */
export function userLogout() {
  return http.post<null>('/auth/logout')
}

/** 获取当前登录用户 */
export function getUserInfo() {
  return http.get<UserInfo>('/auth/me')
}
