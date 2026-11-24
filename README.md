# raas-op-admin

RaaS 设备运维后台（Vue 3 + Vite + naive-ui + Pinia），多设备监控边缘网关与红外激光（默认 3 + 3 台，清单见 `backend/devices.json`）：登录、分组在线率、IP/端口配置、重启关机、应用包上传、逐台激光测量（功率/波长/温度/脉宽/测距）。

## 本地联调（自带 mock 后端）

```bash
npm install                 # 前端依赖
cd mock-server && npm install && cd ..   # mock 后端依赖
npm run dev:all             # 同时起 mock(8090) + 前端(3001)
```

- 前端：http://localhost:3001
- 测试账号：`sj / 123456`、`admin / admin123`
- 接口文档与错误码见 [`mock-server/README.md`](mock-server/README.md)

前端通过 `VITE_APP_API_BASEURL=/api` + vite 代理转发到 `VITE_APP_PROXY_TARGET`（默认 `http://127.0.0.1:8090`）。接真实后端时只改 `.env.development`，不用动代码。

## 后端（Python 多设备版为主，Node mock 为早期单设备版）

前端只认 `/api` + `{ code, msg, data, ts }` 这套契约，所以后端可以换语言而前端零改动；两套实现都占 **8090**，只能同时起一个。

**Python / FastAPI（推荐）**

```bash
python -m pip install -r backend/requirements.txt
npm run server:py         # 只起后端
npm run dev:py            # 后端 + 前端一起起
```

实现见 [`backend/app.py`](backend/app.py)，接口表见 [`backend/README.md`](backend/README.md)。依赖仅 FastAPI + uvicorn + python-multipart；数据在内存，重启按配置复位；上传落盘到 `backend/uploads/`。

**设备清单在 `backend/devices.json`**（默认 3 台边缘网关 + 3 台红外激光），加设备只改这个文件再重启后端，前端表格与卡片会自动按条数渲染：

```json
{ "gateways": [{ "id": "gw-1", "name": "边缘网关1", "ip": "192.168.1.28", "model": "EG-2000", "status": "online" }],
  "lasers":   [{ "id": "laser-1", "name": "红外激光1", "ip": "192.168.1.31", "port": 502, "model": "IR-980", "distance": 2.35 }] }
```

接口按设备 id 寻址：`GET /api/devices`（返回 `{gateways, lasers, summary}`）、`PUT /api/devices/gateway/{id}/ip`、`POST /api/devices/gateway/{id}/reboot|shutdown|poweron`、`POST /api/devices/laser/{id}/measure` 等。

**Node / Express（原 mock，单设备）**

```bash
cd mock-server && npm install && cd ..
npm run dev:all
```

Node 版是早期单设备实现（旧路径 `/api/devices/sys`、`/api/devices/laser`），**与 Python 多设备版的契约已不再一致**，仅供追溯；日常联调请用 `npm run dev:py`。两套都覆盖登录、IP 修改、重启/关机/开机（3 秒状态流转）、激光测量（功率/波长/温度/脉宽/距离）、上传/下载/删除、健康检查，错误码 1001/1002/2001–2004/3001–3003/4004/5000。

## 主题（等轴测浅色 · 动态）

- 默认 AZURE 云蓝，顶栏胶囊可切 TEAL 冰青 / VIOLET 星紫 / CORAL 珊瑚，AUTO 每 12s 轮换；选择写入 `localStorage`（键 `raas.hud.theme`）。
- 主色拆双轨：`--hud-accent` 只用于描边/光效，`--hud-accent-soft` 用于 ≤12px 文字与实心按钮，保证白字 4.5:1。
- 背景三层动效：等轴测斜网格漂移、45° 圆角模块浮动、斜向流光；登录页与首页右下角另有纯 SVG 等轴测场景（`src/components/IsoScene`）。
- 表格 ≤1300px 自动进入紧凑列模式（隐藏型号 / 端口列），横向溢出时显示左右边缘渐隐；切换主色会在顶栏显示 1.6s 主色名（色觉兜底）。
- 全部动效遵循 `prefers-reduced-motion`，系统开启「减少动态效果」时自动静止。

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin) to make the TypeScript language service aware of `.vue` types.

If the standalone TypeScript plugin doesn't feel fast enough to you, Volar has also implemented a [Take Over Mode](https://github.com/johnsoncodehk/volar/discussions/471#discussioncomment-1361669) that is more performant. You can enable it by the following steps:

1. Disable the built-in TypeScript Extension
    1) Run `Extensions: Show Built-in Extensions` from VSCode's command palette
    2) Find `TypeScript and JavaScript Language Features`, right click and select `Disable (Workspace)`
2. Reload the VSCode window by running `Developer: Reload Window` from the command palette.

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
