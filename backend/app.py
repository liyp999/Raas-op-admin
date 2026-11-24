"""Raas-op-admin Python 后端（FastAPI · 多设备版）

设备清单来自 backend/devices.json（名称/IP/型号/端口都在那里改），前端按实际条数渲染。
统一响应外壳 {"code": 0, "msg": "ok", "data": ..., "ts": 毫秒}，code=0 即成功；
鉴权走 Authorization: Bearer <token>；默认监听 8090（与 vite 代理目标一致）。

仅供本地联调/演示：设备状态、会话、上传记录全部放内存，进程重启即从 JSON 重新装载。
"""

from __future__ import annotations

import asyncio
import json
import os
import random
import re
import threading
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

import uvicorn
from fastapi import Depends, FastAPI, File, Form, Header, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from starlette.exceptions import HTTPException as StarletteHTTPException

# ── 常量 ────────────────────────────────────────────────────────────────
PORT = int(os.environ.get("PORT", "8090"))
TOKEN_TTL = 2 * 60 * 60
MAX_UPLOAD = 100 * 1024 * 1024
DELAY_ENABLED = os.environ.get("MOCK_DELAY", "1") != "0"

BASE_DIR = Path(__file__).resolve().parent
CONFIG_FILE = Path(os.environ.get("DEVICES_FILE", BASE_DIR / "devices.json"))
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

APP_START = time.time()
LOCK = threading.RLock()
TIMERS: dict[str, threading.Timer] = {}


# ── 工具 ────────────────────────────────────────────────────────────────
def now_iso() -> str:
    dt = datetime.now(timezone.utc)
    return dt.strftime("%Y-%m-%dT%H:%M:%S.") + f"{dt.microsecond // 1000:03d}Z"


def now_ms() -> int:
    return int(time.time() * 1000)


def ok(data, msg: str = "ok") -> dict:
    return {"code": 0, "msg": msg, "data": data, "ts": now_ms()}


class ApiError(Exception):
    def __init__(self, code: int, msg: str, status: int = 400):
        self.code, self.msg, self.status = code, msg, status


def is_valid_ip(ip: object) -> bool:
    if not isinstance(ip, str):
        return False
    parts = ip.split(".")
    if len(parts) != 4:
        return False
    for p in parts:
        if not p.isdigit():
            return False
        if len(p) > 1 and p.startswith("0"):
            return False
        if not 0 <= int(p) <= 255:
            return False
    return True


def rnd(lo: float, hi: float, digits: int = 1) -> float:
    return round(lo + random.random() * (hi - lo), digits)


# ── 从 devices.json 装载设备清单 ─────────────────────────────────────────
FALLBACK_CONFIG = {
    "gateways": [{"id": "gw-1", "name": "边缘网关1", "model": "RaaS-EG2000", "ip": "192.168.1.28"}],
    "lasers": [{"id": "laser-1", "name": "红外激光1", "model": "IR-LD980", "ip": "192.168.1.31", "port": 502}],
}


def load_config() -> dict:
    if not CONFIG_FILE.is_file():
        print(f"[backend] 未找到 {CONFIG_FILE}，使用内置单设备配置")
        return FALLBACK_CONFIG
    try:
        data = json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
    except Exception as exc:  # 配置写坏了也别让服务起不来
        print(f"[backend] devices.json 解析失败（{exc}），使用内置单设备配置")
        return FALLBACK_CONFIG
    return {
        "gateways": data.get("gateways") or FALLBACK_CONFIG["gateways"],
        "lasers": data.get("lasers") or FALLBACK_CONFIG["lasers"],
    }


def build_state(cfg: dict) -> dict:
    gateways, lasers = [], []
    for idx, gw in enumerate(cfg["gateways"]):
        gateways.append(
            {
                "id": str(gw.get("id") or f"gw-{idx + 1}"),
                "name": gw.get("name") or f"边缘网关{idx + 1}",
                "model": gw.get("model") or "RaaS-EG2000",
                "ip": gw.get("ip") or f"192.168.1.{28 + idx}",
                "status": gw.get("status") or "online",
                "appVersion": gw.get("appVersion") or "v1.2.3",
                "firmware": gw.get("firmware") or "EG-1.0.8",
                "bootCount": int(gw.get("bootCount") or 12),
                "lastBootAt": gw.get("lastBootAt") or now_iso(),
                "cpu": float(gw.get("cpu", 18.2)),
                "mem": float(gw.get("mem", 41.5)),
                "temperature": float(gw.get("temperature", 43)),
                "note": gw.get("note") or "",
            }
        )
    for idx, ls in enumerate(cfg["lasers"]):
        lasers.append(
            {
                "id": str(ls.get("id") or f"laser-{idx + 1}"),
                "name": ls.get("name") or f"红外激光{idx + 1}",
                "model": ls.get("model") or "IR-LD980",
                "ip": ls.get("ip") or f"192.168.1.{31 + idx}",
                "port": int(ls.get("port") or 502 + idx),
                "status": ls.get("status") or "online",
                "measure": {
                    "power": round(12.4 + idx * 0.3, 1),
                    "wavelength": round(980.2 + idx * 0.1, 1),
                    "temperature": round(26.3 + idx * 0.4, 1),
                    "pulseWidth": round(1.2 + idx * 0.05, 2),
                    "distance": round(2.35 + idx * 0.2, 2),
                    "updatedAt": now_iso(),
                },
                "history": [],
            }
        )
    return {"gateways": gateways, "lasers": lasers, "files": []}


STATE = build_state(load_config())

USERS = [
    {"username": "sj", "password": "123456", "name": "设备运维", "role": "admin"},
    {"username": "admin", "password": "admin123", "name": "管理员", "role": "admin"},
]

SESSIONS: dict[str, dict] = {}


def group_summary(items: list[dict]) -> dict:
    online = sum(1 for d in items if d["status"] == "online")
    return {"online": online, "total": len(items)}


def summary() -> dict:
    return {"gateway": group_summary(STATE["gateways"]), "laser": group_summary(STATE["lasers"])}


def find_device(kind: str, device_id: str) -> dict:
    items = STATE["gateways"] if kind == "gateway" else STATE["lasers"]
    for d in items:
        if d["id"] == device_id:
            return d
    raise ApiError(2005, f"设备不存在：{device_id}", 404)


def ip_in_use(ip: str, exclude_kind: str = "", exclude_id: str = "") -> str:
    """返回占用该 IP 的设备名，空闲则返回空串"""
    for kind, items in (("gateway", STATE["gateways"]), ("laser", STATE["lasers"])):
        for d in items:
            if d["ip"] == ip and not (kind == exclude_kind and d["id"] == exclude_id):
                return d["name"]
    return ""


# ── 应用 ────────────────────────────────────────────────────────────────
app = FastAPI(title="Raas-op-admin Mock Backend (multi-device)", version="1.1.0")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_headers=["*"], allow_methods=["*"])


@app.middleware("http")
async def simulate_latency(request, call_next):
    if DELAY_ENABLED and request.url.path.startswith("/api"):
        await asyncio.sleep(random.uniform(0.06, 0.22))
    return await call_next(request)


@app.exception_handler(ApiError)
async def api_error_handler(_request, exc: ApiError):
    return JSONResponse(
        status_code=exc.status,
        content={"code": exc.code, "msg": exc.msg, "data": None, "ts": now_ms()},
    )


@app.exception_handler(StarletteHTTPException)
async def http_error_handler(request, exc: StarletteHTTPException):
    if exc.status_code == 404:
        return JSONResponse(
            status_code=404,
            content={
                "code": 4004,
                "msg": f"接口不存在: {request.method} {request.url.path}",
                "data": None,
                "ts": now_ms(),
            },
        )
    return JSONResponse(
        status_code=exc.status_code,
        content={"code": 5000, "msg": str(exc.detail), "data": None, "ts": now_ms()},
    )


@app.exception_handler(Exception)
async def unhandled_error_handler(_request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"code": 5000, "msg": str(exc) or "服务器内部错误", "data": None, "ts": now_ms()},
    )


# ── 鉴权 ────────────────────────────────────────────────────────────────
def auth(authorization: str | None = Header(default=None)) -> dict:
    token = authorization[7:] if authorization and authorization.startswith("Bearer ") else ""
    session = SESSIONS.get(token)
    if not session:
        raise ApiError(1002, "登录状态已失效，请重新登录", 401)
    if time.time() > session["expires_at"]:
        SESSIONS.pop(token, None)
        raise ApiError(1002, "登录状态已过期，请重新登录", 401)
    return {**session, "token": token}


# ── 入参模型 ────────────────────────────────────────────────────────────
class LoginBody(BaseModel):
    username: str = ""
    password: str = ""


class IpBody(BaseModel):
    ip: str = ""


class LaserIpBody(BaseModel):
    ip: str = ""
    port: int | float | str | None = None


# ── 认证接口 ────────────────────────────────────────────────────────────
@app.post("/api/auth/login")
def login(body: LoginBody):
    if not body.username or not body.password:
        raise ApiError(1001, "用户名和密码不能为空", 400)
    user = next(
        (u for u in USERS if u["username"] == body.username and u["password"] == body.password), None
    )
    if not user:
        raise ApiError(1001, "用户名或密码错误", 401)
    token = uuid.uuid4().hex
    SESSIONS[token] = {
        "username": user["username"],
        "name": user["name"],
        "role": user["role"],
        "expires_at": time.time() + TOKEN_TTL,
    }
    return ok(
        {
            "token": token,
            "expiresIn": TOKEN_TTL,
            "user": {"username": user["username"], "name": user["name"], "role": user["role"]},
        },
        "登录成功",
    )


@app.post("/api/auth/logout")
def logout(session: dict = Depends(auth)):
    SESSIONS.pop(session["token"], None)
    return ok(None, "已退出登录")


@app.get("/api/auth/me")
def me(session: dict = Depends(auth)):
    return ok({"username": session["username"], "name": session["name"], "role": session["role"]})


# ── 设备总览 ────────────────────────────────────────────────────────────
@app.get("/api/devices")
def devices(_session: dict = Depends(auth)):
    with LOCK:
        return ok({"gateways": STATE["gateways"], "lasers": STATE["lasers"], "summary": summary()})


# ── 边缘网关（多台） ────────────────────────────────────────────────────
@app.get("/api/devices/gateway/{device_id}")
def get_gateway(device_id: str, _session: dict = Depends(auth)):
    with LOCK:
        return ok(find_device("gateway", device_id))


@app.put("/api/devices/gateway/{device_id}/ip")
def update_gateway_ip(device_id: str, body: IpBody, _session: dict = Depends(auth)):
    if not is_valid_ip(body.ip):
        raise ApiError(2001, "IP 格式不合法，应为 0-255 的四段点分十进制", 400)
    with LOCK:
        device = find_device("gateway", device_id)
        if device["status"] != "online":
            raise ApiError(2003, "设备当前不在线，无法修改配置", 409)
        owner = ip_in_use(body.ip, "gateway", device_id)
        if owner:
            raise ApiError(2002, f"IP 与其他设备冲突（{owner} · {body.ip}）", 409)
        old = device["ip"]
        device["ip"] = body.ip
        device["note"] = f"IP 由 {old} 变更为 {body.ip}"
        return ok(device, "IP 修改成功")


def _finish_reboot(device_id: str) -> None:
    with LOCK:
        for d in STATE["gateways"]:
            if d["id"] == device_id:
                d["status"] = "online"
                d["bootCount"] += 1
                d["lastBootAt"] = now_iso()
                d["note"] = "重启完成"


def _finish_boot(device_id: str) -> None:
    with LOCK:
        for d in STATE["gateways"]:
            if d["id"] == device_id:
                d["status"] = "online"
                d["bootCount"] += 1
                d["lastBootAt"] = now_iso()
                d["note"] = "启动完成"


def _schedule(key: str, seconds: float, fn, device_id: str) -> None:
    old = TIMERS.pop(key, None)
    if old:
        old.cancel()
    timer = threading.Timer(seconds, fn, args=(device_id,))
    timer.daemon = True
    TIMERS[key] = timer
    timer.start()


@app.post("/api/devices/gateway/{device_id}/reboot")
def reboot_gateway(device_id: str, _session: dict = Depends(auth)):
    with LOCK:
        device = find_device("gateway", device_id)
        if device["status"] != "online":
            raise ApiError(2003, f"{device['name']} 当前状态为 {device['status']}，无法重启", 409)
        device["status"] = "rebooting"
        device["note"] = "设备重启中，约 3 秒后恢复"
        _schedule(f"reboot:{device_id}", 3.0, _finish_reboot, device_id)
        return ok(
            {"taskId": uuid.uuid4().hex, "deviceId": device_id, "status": "rebooting", "eta": 3},
            "重启指令已下发",
        )


@app.post("/api/devices/gateway/{device_id}/shutdown")
def shutdown_gateway(device_id: str, _session: dict = Depends(auth)):
    with LOCK:
        device = find_device("gateway", device_id)
        if device["status"] != "online":
            raise ApiError(2003, f"{device['name']} 当前状态为 {device['status']}，无法关机", 409)
        timer = TIMERS.pop(f"reboot:{device_id}", None)
        if timer:
            timer.cancel()
        device["status"] = "offline"
        device["note"] = "设备已关机"
        return ok(device, "关机指令已下发")


@app.post("/api/devices/gateway/{device_id}/poweron")
def poweron_gateway(device_id: str, _session: dict = Depends(auth)):
    with LOCK:
        device = find_device("gateway", device_id)
        if device["status"] == "online":
            raise ApiError(2003, f"{device['name']} 已处于在线状态", 409)
        device["status"] = "booting"
        device["note"] = "设备启动中"
        _schedule(f"poweron:{device_id}", 3.0, _finish_boot, device_id)
        return ok(device, "开机指令已下发")


# ── 红外激光（多台） ────────────────────────────────────────────────────
@app.get("/api/devices/laser/{device_id}")
def get_laser(device_id: str, _session: dict = Depends(auth)):
    with LOCK:
        return ok(find_device("laser", device_id))


@app.put("/api/devices/laser/{device_id}/ip")
def update_laser(device_id: str, body: LaserIpBody, _session: dict = Depends(auth)):
    if not is_valid_ip(body.ip):
        raise ApiError(2001, "IP 格式不合法，应为 0-255 的四段点分十进制", 400)
    try:
        port_num = int(str(body.port).strip())
    except (TypeError, ValueError):
        raise ApiError(2004, "端口不合法，应为 1-65535 的整数", 400)
    if not 1 <= port_num <= 65535:
        raise ApiError(2004, "端口不合法，应为 1-65535 的整数", 400)
    with LOCK:
        device = find_device("laser", device_id)
        if device["status"] != "online":
            raise ApiError(2003, "设备当前不在线，无法修改配置", 409)
        owner = ip_in_use(body.ip, "laser", device_id)
        if owner:
            raise ApiError(2002, f"IP 与其他设备冲突（{owner} · {body.ip}）", 409)
        old = f"{device['ip']}:{device['port']}"
        device["ip"] = body.ip
        device["port"] = port_num
        return ok(device, f"配置由 {old} 变更为 {body.ip}:{port_num}")


@app.post("/api/devices/laser/{device_id}/measure")
def measure_laser(device_id: str, _session: dict = Depends(auth)):
    with LOCK:
        device = find_device("laser", device_id)
        if device["status"] != "online":
            raise ApiError(2003, f"{device['name']} 不在线，无法测量", 409)
        measure = {
            "power": rnd(11.5, 13.5, 1),
            "wavelength": rnd(979.8, 980.6, 1),
            "temperature": rnd(25.0, 27.5, 1),
            "pulseWidth": rnd(1.0, 1.5, 2),
            "distance": rnd(2.0, 3.2, 2),  # 测量距离，单位 m
            "updatedAt": now_iso(),
        }
        device["measure"] = measure
        device["history"] = [measure, *device["history"]][:20]
        return ok(measure, "测量完成")


@app.get("/api/devices/laser/{device_id}/history")
def laser_history(device_id: str, _session: dict = Depends(auth)):
    with LOCK:
        return ok(find_device("laser", device_id)["history"])


# ── 文件上传 ────────────────────────────────────────────────────────────
@app.post("/api/upload")
async def upload_file(
    file: UploadFile = File(...),
    target: str = Form("sys"),
    deviceId: str = Form(""),
    session: dict = Depends(auth),
):
    file_id = uuid.uuid4().hex[:8]
    safe_name = re.sub(r'[\\/:*?"<>|]', "_", file.filename or "unnamed")
    stored_name = f"{file_id}-{safe_name}"
    dest = UPLOAD_DIR / stored_name

    size = 0
    try:
        with dest.open("wb") as out:
            while chunk := await file.read(1 << 20):
                size += len(chunk)
                if size > MAX_UPLOAD:
                    raise ApiError(3003, "文件超过 100MB 限制", 413)
                out.write(chunk)
    except ApiError:
        dest.unlink(missing_ok=True)
        raise
    except Exception:
        dest.unlink(missing_ok=True)
        raise

    if size == 0:
        dest.unlink(missing_ok=True)
        raise ApiError(3001, "未收到文件", 400)

    record = {
        "id": file_id,
        "filename": file.filename or safe_name,
        "storedName": stored_name,
        "size": size,
        "target": "laser" if target == "laser" else "sys",
        "deviceId": deviceId,
        "mimetype": file.content_type or "application/octet-stream",
        "uploadedAt": now_iso(),
        "uploadedBy": session["username"],
        "url": f"/api/files/{stored_name}",
    }
    with LOCK:
        STATE["files"] = [record, *STATE["files"]][:50]
    return ok(record, "上传成功")


@app.get("/api/files")
def list_files(_session: dict = Depends(auth)):
    with LOCK:
        return ok(STATE["files"])


@app.get("/api/files/{stored_name}")
def download_file(stored_name: str):
    path = (UPLOAD_DIR / Path(stored_name).name).resolve()
    if not path.is_file():
        raise ApiError(3002, "文件不存在", 404)
    return FileResponse(str(path), filename=path.name)


@app.delete("/api/files/{file_id}")
def delete_file(file_id: str, _session: dict = Depends(auth)):
    with LOCK:
        index = next((i for i, f in enumerate(STATE["files"]) if f["id"] == file_id), -1)
        if index == -1:
            raise ApiError(3002, "文件记录不存在", 404)
        record = STATE["files"].pop(index)
    (UPLOAD_DIR / record["storedName"]).unlink(missing_ok=True)
    return ok(record, "已删除")


# ── 健康检查 ────────────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    with LOCK:
        return ok(
            {
                "service": "raas-op-admin-mock-python",
                "uptime": int(time.time() - APP_START),
                "devices": summary(),
                "config": CONFIG_FILE.name,
            }
        )


if __name__ == "__main__":
    print(f"[backend] 设备清单：{CONFIG_FILE}（网关 {len(STATE['gateways'])} 台 / 激光 {len(STATE['lasers'])} 台）")
    print(f"[backend] Raas-op-admin Python 后端启动: http://127.0.0.1:{PORT}/api")
    print("[backend] 测试账号: sj / 123456 ，admin / admin123")
    uvicorn.run(app, host="0.0.0.0", port=PORT, log_level="info")
