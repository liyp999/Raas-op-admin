import axios, { type AxiosRequestConfig } from 'axios'

/** 统一请求实例：baseURL 来自环境变量，未配置时默认 /api（走 vite 代理） */
const service = axios.create({
  baseURL: import.meta.env.VITE_APP_API_BASEURL || '/api',
  timeout: Number(import.meta.env.VITE_APP_TIMEOUT) || 10000
})

const TOKEN_KEY = 'raas_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function setToken(token: string) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

/* 请求拦截：自动带 token */
service.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/* 响应拦截：拆掉 { code, msg, data } 外壳，统一抛错 */
service.interceptors.response.use(
  (response) => {
    const body = response.data
    if (body && typeof body === 'object' && 'code' in body) {
      if (body.code === 0) return body.data
      return Promise.reject(new Error(body.msg || '请求失败'))
    }
    return body
  },
  (error) => {
    const status = error.response?.status
    const message = error.response?.data?.msg || error.message || '网络异常，请稍后重试'
    if (status === 401) setToken('')
    return Promise.reject(new Error(message))
  }
)

export const http = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return service.get(url, config) as unknown as Promise<T>
  },
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return service.post(url, data, config) as unknown as Promise<T>
  },
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return service.put(url, data, config) as unknown as Promise<T>
  },
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return service.delete(url, config) as unknown as Promise<T>
  }
}

export default http
