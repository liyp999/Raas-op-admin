'use strict'

/**
 * Raas-op-admin 模拟后端（仅供本地联调 / 演示，数据全在内存，重启即复位）
 * 启动：node mock-server/server.js   默认端口 8090，前缀 /api
 */

const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const express = require('express')
const multer = require('multer')

const PORT = Number(process.env.PORT) || 8090
const UPLOAD_DIR = path.join(__dirname, 'uploads')
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const app = express()
app.use(express.json({ limit: '2mb' }))

/* ---------------- 基础中间件：CORS + 模拟网络延迟 ---------------- */
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

app.use((req, res, next) => {
  const delay = 60 + Math.floor(Math.random() * 160) // 60~220ms，避免前端看起来“秒回”不真实
  setTimeout(next, delay)
})

app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`)
  })
  next()
})

/* ---------------- 统一响应 ---------------- */
const ok = (res, data, msg = 'ok') => res.json({ code: 0, msg, data, ts: Date.now() })
const fail = (res, code, msg, httpStatus = 400) =>
  res.status(httpStatus).json({ code, msg, data: null, ts: Date.now() })

/* ---------------- 账号与会话 ---------------- */
const USERS = [
  { username: 'sj', password: '123456', name: '设备运维', role: 'admin' },
  { username: 'admin', password: 'admin123', name: '管理员', role: 'admin' }
]
const TOKEN_TTL = 2 * 60 * 60 * 1000
const sessions = new Map() // token -> { username, name, role, expiresAt }

const nowIso = () => new Date().toISOString()

/* ---------------- 设备状态（内存） ---------------- */
const state = {
  sys: {
    id: 'edge-gw-01',
    name: '边缘网关',
    model: 'RaaS-EG2000',
    ip: '192.168.1.28',
    status: 'online',
    appVersion: 'v1.2.3',
    firmware: 'EG-1.0.8',
    bootCount: 12,
    lastBootAt: nowIso(),
    cpu: 18.2,
    mem: 41.5,
    temperature: 43,
    note: ''
  },
  laser: {
    id: 'laser-01',
    name: '红外激光',
    model: 'IR-LD980',
    ip: '192.168.1.31',
    port: 502,
    status: 'online',
    measure: {
      power: 12.4,
      wavelength: 980.2,
      temperature: 26.3,
      pulseWidth: 1.2,
      distance: 2.35,
      updatedAt: nowIso()
    },
    history: []
  },
  files: []
}

const timers = {}

/* ---------------- 鉴权 ---------------- */
function auth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  const session = sessions.get(token)
  if (!session) return fail(res, 1002, '登录状态已失效，请重新登录', 401)
  if (Date.now() > session.expiresAt) {
    sessions.delete(token)
    return fail(res, 1002, '登录状态已过期，请重新登录', 401)
  }
  req.session = session
  req.token = token
  next()
}

/* ---------------- 工具函数 ---------------- */
function isValidIp(ip) {
  if (typeof ip !== 'string') return false
  const parts = ip.split('.')
  if (parts.length !== 4) return false
  return parts.every((p) => /^(\d{1,3})$/.test(p) && Number(p) >= 0 && Number(p) <= 255 && !/^0\d/.test(p))
}

function summary() {
  return {
    sys: {
      status: state.sys.status,
      online: state.sys.status === 'online' ? 1 : 0,
      total: 1
    },
    laser: {
      status: state.laser.status,
      online: state.laser.status === 'online' ? 1 : 0,
      total: 1
    }
  }
}

/* ---------------- 认证接口 ---------------- */
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {}
  if (!username || !password) return fail(res, 1001, '用户名和密码不能为空', 400)
  const user = USERS.find((u) => u.username === username && u.password === password)
  if (!user) return fail(res, 1001, '用户名或密码错误', 401)

  const token = crypto.randomUUID().replace(/-/g, '')
  sessions.set(token, {
    username: user.username,
    name: user.name,
    role: user.role,
    expiresAt: Date.now() + TOKEN_TTL
  })
  return ok(res, {
    token,
    expiresIn: TOKEN_TTL / 1000,
    user: { username: user.username, name: user.name, role: user.role }
  }, '登录成功')
})

app.post('/api/auth/logout', auth, (req, res) => {
  sessions.delete(req.token)
  return ok(res, null, '已退出登录')
})

app.get('/api/auth/me', auth, (req, res) => ok(res, { username: req.session.username, name: req.session.name, role: req.session.role }))

/* ---------------- 设备总览 ---------------- */
app.get('/api/devices', auth, (req, res) =>
  ok(res, { sys: state.sys, laser: state.laser, summary: summary() })
)

/* ---------------- 边缘网关 ---------------- */
app.get('/api/devices/sys', auth, (req, res) => ok(res, state.sys))

app.put('/api/devices/sys/ip', auth, (req, res) => {
  const { ip } = req.body || {}
  if (!isValidIp(ip)) return fail(res, 2001, 'IP 格式不合法，应为 0-255 的四段点分十进制', 400)
  if (state.sys.status !== 'online') return fail(res, 2003, '设备当前不在线，无法修改配置', 409)
  if (ip === state.laser.ip) return fail(res, 2002, `IP 与红外激光设备冲突（${ip}）`, 409)
  const old = state.sys.ip
  state.sys.ip = ip
  state.sys.note = `IP 由 ${old} 变更为 ${ip}`
  return ok(res, state.sys, 'IP 修改成功')
})

function rebootSys() {
  clearTimeout(timers.reboot)
  state.sys.status = 'rebooting'
  state.sys.note = '设备重启中，约 3 秒后恢复'
  timers.reboot = setTimeout(() => {
    state.sys.status = 'online'
    state.sys.bootCount += 1
    state.sys.lastBootAt = nowIso()
    state.sys.note = '重启完成'
    console.log('[mock] 边缘网关重启完成')
  }, 3000)
}

app.post('/api/devices/sys/reboot', auth, (req, res) => {
  if (state.sys.status !== 'online') return fail(res, 2003, `设备当前状态为 ${state.sys.status}，无法重启`, 409)
  rebootSys()
  return ok(res, { taskId: crypto.randomUUID(), status: state.sys.status, eta: 3 }, '重启指令已下发')
})

app.post('/api/devices/sys/shutdown', auth, (req, res) => {
  if (state.sys.status !== 'online') return fail(res, 2003, `设备当前状态为 ${state.sys.status}，无法关机`, 409)
  clearTimeout(timers.reboot)
  state.sys.status = 'offline'
  state.sys.note = '设备已关机'
  return ok(res, state.sys, '关机指令已下发')
})

app.post('/api/devices/sys/poweron', auth, (req, res) => {
  if (state.sys.status === 'online') return fail(res, 2003, '设备已处于在线状态', 409)
  state.sys.status = 'booting'
  state.sys.note = '设备启动中'
  clearTimeout(timers.poweron)
  timers.poweron = setTimeout(() => {
    state.sys.status = 'online'
    state.sys.bootCount += 1
    state.sys.lastBootAt = nowIso()
    state.sys.note = '启动完成'
  }, 3000)
  return ok(res, state.sys, '开机指令已下发')
})

/* ---------------- 红外激光 ---------------- */
app.get('/api/devices/laser', auth, (req, res) => ok(res, state.laser))

app.put('/api/devices/laser/ip', auth, (req, res) => {
  const { ip, port } = req.body || {}
  if (!isValidIp(ip)) return fail(res, 2001, 'IP 格式不合法，应为 0-255 的四段点分十进制', 400)
  const portNum = Number(port)
  if (!Number.isInteger(portNum) || portNum < 1 || portNum > 65535) {
    return fail(res, 2004, '端口不合法，应为 1-65535 的整数', 400)
  }
  if (state.laser.status !== 'online') return fail(res, 2003, '设备当前不在线，无法修改配置', 409)
  if (ip === state.sys.ip) return fail(res, 2002, `IP 与边缘网关设备冲突（${ip}）`, 409)
  const old = `${state.laser.ip}:${state.laser.port}`
  state.laser.ip = ip
  state.laser.port = portNum
  return ok(res, state.laser, `配置由 ${old} 变更为 ${ip}:${portNum}`)
})

app.post('/api/devices/laser/measure', auth, (req, res) => {
  if (state.laser.status !== 'online') return fail(res, 2003, '设备不在线，无法测量', 409)
  const rnd = (min, max, digits = 1) => {
    const v = min + Math.random() * (max - min)
    return Number(v.toFixed(digits))
  }
  const measure = {
    power: rnd(11.5, 13.5),
    wavelength: rnd(979.8, 980.6),
    temperature: rnd(25.0, 27.5),
    pulseWidth: rnd(1.0, 1.5, 2),
    distance: rnd(2.0, 3.2, 2),
    updatedAt: nowIso()
  }
  state.laser.measure = measure
  state.laser.history.unshift({ ...measure })
  state.laser.history = state.laser.history.slice(0, 20)
  return ok(res, measure, '测量完成')
})

app.get('/api/devices/laser/history', auth, (req, res) => ok(res, state.laser.history))

/* ---------------- 文件上传（系统/激光应用包） ---------------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const id = crypto.randomUUID().slice(0, 8)
    const safe = Buffer.from(file.originalname, 'latin1').toString('utf8').replace(/[\\/:*?"<>|]/g, '_')
    cb(null, `${id}-${safe}`)
  }
})
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } })

app.post('/api/upload', auth, upload.single('file'), (req, res) => {
  if (!req.file) return fail(res, 3001, '未收到文件', 400)
  const target = req.body.target === 'laser' ? 'laser' : 'sys'
  const record = {
    id: req.file.filename.split('-')[0],
    filename: req.file.originalname,
    storedName: req.file.filename,
    size: req.file.size,
    target,
    mimetype: req.file.mimetype,
    uploadedAt: nowIso(),
    uploadedBy: req.session.username,
    url: `/api/files/${req.file.filename}`
  }
  state.files.unshift(record)
  state.files = state.files.slice(0, 50)
  return ok(res, record, '上传成功')
})

app.get('/api/files', auth, (req, res) => ok(res, state.files))

app.get('/api/files/:storedName', auth, (req, res) => {
  const filePath = path.join(UPLOAD_DIR, path.basename(req.params.storedName))
  if (!fs.existsSync(filePath)) return fail(res, 3002, '文件不存在', 404)
  return res.download(filePath)
})

app.delete('/api/files/:id', auth, (req, res) => {
  const index = state.files.findIndex((f) => f.id === req.params.id)
  if (index === -1) return fail(res, 3002, '文件记录不存在', 404)
  const [record] = state.files.splice(index, 1)
  const p = path.join(UPLOAD_DIR, record.storedName)
  if (fs.existsSync(p)) fs.unlinkSync(p)
  return ok(res, record, '已删除')
})

/* ---------------- 健康检查 & 兜底 ---------------- */
app.get('/api/health', (req, res) =>
  ok(res, { service: 'raas-op-admin-mock', uptime: Math.round(process.uptime()), devices: summary() })
)

app.use('/api', (req, res) => fail(res, 4004, `接口不存在: ${req.method} ${req.originalUrl}`, 404))

app.use((err, req, res, next) => {
  console.error('[mock] 错误', err)
  if (err && err.code === 'LIMIT_FILE_SIZE') return fail(res, 3003, '文件超过 100MB 限制', 413)
  return fail(res, 5000, err.message || '服务器内部错误', 500)
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[mock] Raas-op-admin 模拟后端已启动: http://127.0.0.1:${PORT}/api`)
  console.log('[mock] 测试账号: sj / 123456 ，admin / admin123')
  console.log(`[mock] 上传目录: ${UPLOAD_DIR}`)
})
