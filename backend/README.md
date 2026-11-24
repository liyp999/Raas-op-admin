# Raas-op-admin 后端（Python / FastAPI）

多设备版实现（v2）：设备台数与初始状态由 `backend/devices.json` 配置，接口按设备 id 寻址。
统一响应外壳 `{"code": 0, "msg": "ok", "data": ..., "ts": 毫秒}`、`Authorization: Bearer <token>` 鉴权、
错误码 1001/1002/2001–2005/3001–3003/4004/5000 对齐前端既有约定。

数据在内存（运行期状态、会话、上传记录），进程重启即按 `devices.json` 复位。

## 启动

```bash
python -m pip install -r backend/requirements.txt
python backend/app.py            # 默认 8090，读取同目录 devices.json
# 或者：uvicorn backend.app:app --host 0.0.0.0 --port 8090 --reload
```

- 端口默认 **8090**，与 `vite.config.ts` 中 `/api` 代理目标（`VITE_APP_PROXY_TARGET`）一致。
- 测试账号：`sj / 123456`、`admin / admin123`
- 环境变量：`PORT`（监听端口）、`MOCK_DELAY=0`（关闭 60–220ms 模拟延迟）
- 上传目录：`backend/uploads/`，单文件上限 100MB

注意：Python 版与 `mock-server/`（Node 单设备版）**都占 8090**，只能起一个；两套契约已不同步，多设备请用 Python 版。

## 设备配置 `devices.json`

```json
{
  "gateways": [
    { "id": "gw-1", "name": "边缘网关1", "ip": "192.168.1.28", "model": "EG-2000", "status": "online" }
  ],
  "lasers": [
    { "id": "laser-1", "name": "红外激光1", "ip": "192.168.1.31", "port": 502, "model": "IR-980", "distance": 2.35 }
  ]
}
```

- 必填：`id`（唯一，跨两类都不能重复）、`name`、`ip`；激光还需 `port`。
- 可选：`model`、`status`（默认 online）、`distance`（激光测距初值，m）。
- 文件缺失或 JSON 非法时回落到内置单设备配置（`FALLBACK_CONFIG`），服务仍可启动。
- 改完配置需**重启后端**生效（前端轮询会自动跟上，无需改代码）。

## 接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/auth/login` | 登录，返回 `token` / `expiresIn` / `user` |
| POST | `/api/auth/logout` | 退出，销毁会话 |
| GET | `/api/auth/me` | 当前登录用户 |
| GET | `/api/devices` | 总览：`{gateways:[], lasers:[], summary}` |
| GET | `/api/devices/gateway/{id}` | 单台网关详情 |
| PUT | `/api/devices/gateway/{id}/ip` | 改 IP（格式校验、跨网关/激光查重） |
| POST | `/api/devices/gateway/{id}/reboot` | 重启，3 秒后回 online，该台 bootCount +1 |
| POST | `/api/devices/gateway/{id}/shutdown` | 关机 → offline |
| POST | `/api/devices/gateway/{id}/poweron` | 开机 → booting → 3 秒后 online |
| GET | `/api/devices/laser/{id}` | 单台激光详情（含最新测量与历史） |
| PUT | `/api/devices/laser/{id}/ip` | 改 IP + 端口（1–65535），同样查重 |
| POST | `/api/devices/laser/{id}/measure` | 触发测量，返回功率/波长/温度/脉宽/**距离** |
| GET | `/api/devices/laser/{id}/history` | 该台最近 20 条测量记录 |
| POST | `/api/upload` | multipart 上传（`file`、`target=sys\|laser`、`deviceId`） |
| GET | `/api/files` | 上传记录列表（按 `deviceId` 归档） |
| GET | `/api/files/{storedName}` | 下载 |
| DELETE | `/api/files/{id}` | 删除记录并删磁盘文件 |
| GET | `/api/health` | 健康检查（`service=raas-op-admin-mock-python`） |

`summary` 形如 `{"gateway":{"online":2,"total":3},"laser":{"online":3,"total":3}}`，文案交给前端渲染。

错误码补充：`2005 / 404` = 设备 id 不存在；`2002 / 409` = IP 与其他设备冲突（`msg` 中带占用者名称）。

测量数据范围：功率 11.5–13.5 W、波长 979.8–980.6 nm、温度 25.0–27.5 ℃、
脉宽 1.00–1.50 ms、距离 2.00–3.20 m（两位小数）。

## 接真实设备时

把 `backend/devices.json` 换成实际设备清单（或改成从 CMDB/网关接口拉取），
再把 `app.py` 中 `build_state()`、`measure_laser()`、`_finish_reboot/_finish_poweron` 的模拟逻辑
替换成真实协议调用（Modbus TCP / MQTT / SNMP 等）；前端无需改动。
