import { defineStore } from 'pinia'
import { userLogin, userLogout } from '@/api/login'
import { getToken, setToken } from '@/utils/request'
import type { UserInfo } from '@/utils/typing/raas'

const USER_KEY = 'raas_user'

function readUser(): UserInfo | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as UserInfo) : null
  } catch {
    return null
  }
}

export const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken(),
    user: readUser() as UserInfo | null
  }),
  getters: {
    isLogin: (state) => Boolean(state.token),
    displayName: (state) => state.user?.name || state.user?.username || '未登录'
  },
  actions: {
    async login(username: string, password: string) {
      const result = await userLogin({ username, password })
      this.token = result.token
      this.user = result.user
      setToken(result.token)
      localStorage.setItem(USER_KEY, JSON.stringify(result.user))
      return result
    },
    async logout() {
      try {
        await userLogout()
      } catch {
        // 会话可能已过期，本地清理即可
      }
      this.token = ''
      this.user = null
      setToken('')
      localStorage.removeItem(USER_KEY)
    }
  }
})
