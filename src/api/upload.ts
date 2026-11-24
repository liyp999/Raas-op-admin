import { http } from '@/utils/request'
import type { UploadedFile } from '@/utils/typing/raas'

export type UploadTarget = 'sys' | 'laser'

/** 上传应用包/文件到指定设备（deviceId 用于标记目标设备，可省略） */
export function uploadFile(
  file: File,
  target: UploadTarget,
  deviceId = '',
  onProgress?: (percent: number) => void
) {
  const form = new FormData()
  form.append('file', file)
  form.append('target', target)
  if (deviceId) form.append('deviceId', deviceId)
  return http.post<UploadedFile>('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (onProgress && event.total) onProgress(Math.round((event.loaded / event.total) * 100))
    }
  })
}

/** 已上传文件列表 */
export function getFiles() {
  return http.get<UploadedFile[]>('/files')
}

/** 删除上传记录（同时删服务端文件） */
export function deleteFile(id: string) {
  return http.delete<UploadedFile>(`/files/${id}`)
}
