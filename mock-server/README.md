# Raas-op-admin 模拟后端（mock-server）

用于本地联调和演示的轻量后端：**内存态数据**（重启即复位）、无数据库、无外部依赖，纯 Express。
配合前端 `/api` 代理使用，前端零改动即可切换到真实后端。

## 快速启动

```bash
# 1. 安装 mock 后端依赖（一次即可）
cd mock-server && npm install && cd ..

# 2. 一键同时起 mock 后端 + 前端 dev（推荐）
npm run dev:all

# 或者分开起
npm run mock   # mock 后端：http://127.0.0.1:8090/api
npm run dev    # 前端：http://127.0.0.1:3001
```

前端请求链路：浏览器 → `localhost:3001/api/**` →（vite proxy）→ `127.0.0.1:8090/api/**`。

## 测试账号

| 用户名 | 密码 | 说明 |
|---|---|---|
| `sj` | `123456` | 设备运维（默认预填） |
| `admin` | `admin123` | 管理员 |

其他账号一律返回 `401 / code=1001 / 用户名或密码错误`。

## 接口清单（统一前缀 `/api`，统一响应 `{ code, msg, data, ts }`，`code=0` 为成功）

| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| GET | `/health` | 否 | 健康检查，返回服务名、运行时长、设备统计 |
| POST | `/auth/login` | 否 | 登录，返回 `token`（有效期 2 小时）与用户信息 |
| POST | `/auth/logout` | 是 | 退出登录，服务端销毁会话 |
| GET | `/auth/me` | 是 | 当前登录用户 |
| GET | `/devices` | 是 | 设备总览：`sys` + `laser` + `summary` |
| GET | `/devices/sys` | 是 | 边缘网关详情 |
| PUT | `/devices/sys/ip` | 是 | 修改网关 IP（校验格式、与激光设备冲突、在线状态） |
| POST | `/devices/sys/reboot` | 是 | 重启，3 秒后自动恢复在线并累加开机次数 |
| POST | `/devices/sys/shutdown` | 是 | 关机，状态置为 `offline` |
| POST | `/devices/sys/poweron` | 是 | 开机，3 秒后恢复在线 |
| GET | `/devices/laser` | 是 | 激光设备详情（含最新测量数据） |
| PUT | `/devices/laser/ip` | 是 | 修改激光 IP + 端口（端口 1-65535 校验） |
| POST | `/devices/laser/measure` | 是 | 触发一次测量，返回随机但合理的功率/波长/温度/脉宽/距离（距离 2.00–3.20 m，两位小数） |
| GET | `/devices/laser/history` | 是 | 最近 20 条测量历史 |
| POST | `/upload` | 是 | 上传应用包（`multipart/form-data`，字段 `file` + `target=sys\|laser`，单文件 ≤100MB） |
| GET | `/files` | 是 | 上传记录（最多 50 条） |
| GET | `/files/:storedName` | 是 | 下载已上传文件 |
| DELETE | `/files/:id` | 是 | 删除文件及记录 |

鉴权方式：请求头 `Authorization: Bearer <token>`；token 缺失/过期返回 `401 / code=1002`，前端会自动清 token 并跳回登录页。

### 业务错误码

| code | 含义 |
|---|---|
| 1001 | 用户名或密码错误 / 参数为空 |
| 1002 | 未登录或登录已失效（HTTP 401） |
| 2001 | IP 格式不合法 |
| 2002 | IP 与另一台设备冲突 |
| 2003 | 设备状态不允许该操作（如离线时改配置） |
| 2004 | 端口不合法 |
| 3001/3002/3003 | 未收到文件 / 文件不存在 / 超出大小限制 |
| 4004 | 接口不存在 |

## 关键技术点

- **模拟延迟**：每个请求 60~220ms 随机延迟，避免前端“秒回”看不出加载态。
- **状态机**：`online → rebooting → online`（3 秒）、`online → offline → booting → online`，前端 5 秒轮询能观察到状态流转和"设备个数 1/1"变化。
- **上传落盘**：文件写入 `mock-server/uploads/`（已在 `.gitignore` 中排除），文件名带 8 位随机前缀，中文名做安全化处理。
- **不用数据库**：所有设备状态在进程内存里，`Ctrl+C` 重启后复位（IP 回到 `192.168.1.28` / `192.168.1.31`）。

## 切换到真实后端

前端认环境变量，不需要改代码：

```bash
# .env.development
VITE_APP_API_BASEURL=/api                        # 或 https://your-api.example.com/api
VITE_APP_PROXY_TARGET=http://127.0.0.1:8090      # 指向真实后端地址
```

真实后端的响应只需符合 `{ code: 0, msg, data }` 外壳 + 上述字段命名，`src/utils/request.ts` 的拦截器会自动拆壳并把 `code != 0` 转成异常。
