import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import type { Socket } from "node:net";
import os from "node:os";
import path from "node:path";
import tls from "node:tls";
import { fileURLToPath } from "node:url";
import {
  ALL_POSITIONS_CHAPTERS,
  BODY_PRESETS,
  BUILTIN_CHARACTERS,
  BUNDLED_CUSTOM_PRESETS,
  BUST_PRESETS,
  CANVAS_PRESETS,
  ENV_PRESETS,
  EXPRESSION_PRESETS,
  LEGWEAR_PRESETS,
  LIGHTING_PRESETS,
  MORPH_PRESETS,
  MULTI_ANGLE_CHAPTERS,
  NAI_MODEL_OPTIONS,
  OTHER_ACTION_CHAPTERS,
  OUTFIT_PRESETS,
  OUTFIT_STATE_PRESETS,
  PIGMENT_PRESETS,
  POS_MALE_MODE_PRESETS,
  POS_SCENE_PRESETS,
  POS_STAGE_PRESETS,
  PUBIC_PRESETS,
  SKIN_PRESETS,
  STYLE_PRESETS,
} from "../data/engineConstants";
import { OTHER_ACTION_TEMPLATES } from "../data/otherActionsData";

const BRIDGE_BIND_HOST = process.env.NAI_STUDIO_BRIDGE_HOST || "0.0.0.0";
const LOCAL_RELAY_HOST = "127.0.0.1";
const BRIDGE_PORT = Number(process.env.NAI_STUDIO_BRIDGE_PORT || 17890);
const WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../../..");
const STANDALONE_HTML_PATH = path.join(REPO_ROOT, "NovelAI_Workbench.html");
const PREVIEW_DIR = path.join(REPO_ROOT, "outputs", "_mcp_live_preview");
const NAI_API_CONFIG_PATH = path.join(REPO_ROOT, "nai_api_config.json");
const NAI_PROXY_TIMEOUT_MS = 180_000;
const NAI_PROXY_TARGETS: Record<string, string> = {
  image: "image.novelai.net",
  api: "api.novelai.net",
};

function isJpegBuffer(buf: Buffer): boolean {
  return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
}

function runPipeEncoder(
  command: string,
  args: string[],
  input: Buffer,
  timeoutMs = 8000
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });
    const outChunks: Buffer[] = [];
    const errChunks: Buffer[] = [];
    let settled = false;

    const finishErr = (err: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    };

    const timer = setTimeout(() => {
      try {
        child.kill();
      } catch {
        // ignore
      }
      finishErr(new Error(`${command} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => outChunks.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => errChunks.push(chunk));
    child.on("error", (err) => finishErr(err));
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const out = Buffer.concat(outChunks);
      if (code === 0 && isJpegBuffer(out) && out.length > 100) {
        resolve(out);
      } else {
        const errMsg = Buffer.concat(errChunks).toString("utf8").trim().slice(0, 200);
        reject(new Error(`${command} exited ${code}: ${errMsg || "invalid JPEG output"}`));
      }
    });

    child.stdin.on("error", () => {
      // ignore EPIPE if child exits early
    });
    child.stdin.end(input);
  });
}

async function encodePreviewToJpeg(buf: Buffer): Promise<Buffer> {
  if (isJpegBuffer(buf)) return buf;

  // Tier 1: ffmpeg native MJPEG pipe (q:v 4 ~= JPEG quality 82, ~110-130ms, zero temp files)
  try {
    return await runPipeEncoder(
      "ffmpeg",
      [
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        "pipe:0",
        "-frames:v",
        "1",
        "-c:v",
        "mjpeg",
        "-q:v",
        "4",
        "-f",
        "mjpeg",
        "pipe:1",
      ],
      buf,
      8000
    );
  } catch {
    // Fall through to Tier 2
  }

  // Tier 2: Python Pillow (exact quality=82, optimize=True)
  const pyScript = [
    "import sys, io",
    "from PIL import Image",
    "im = Image.open(io.BytesIO(sys.stdin.buffer.read())).convert('RGB')",
    "out = io.BytesIO()",
    "im.save(out, format='JPEG', quality=82, optimize=True)",
    "sys.stdout.buffer.write(out.getvalue())",
  ].join("; ");
  return await runPipeEncoder("python", ["-c", pyScript], buf, 8000);
}

async function savePreviewImage(
  buf: Buffer,
  rawFilename: string
): Promise<{ savedPath: string; format: "jpg" | "png"; originalBytes: number; savedBytes: number }> {
  fs.mkdirSync(PREVIEW_DIR, { recursive: true });
  const sanitized = (rawFilename || `preview_${Date.now()}.png`).replace(/[^a-zA-Z0-9._-]/g, "_");
  const baseName = sanitized.replace(/\.(png|jpe?g|webp)$/i, "") || `preview_${Date.now()}`;

  try {
    const jpgBuf = await encodePreviewToJpeg(buf);
    const destPath = path.join(PREVIEW_DIR, `${baseName}.jpg`);
    fs.writeFileSync(destPath, jpgBuf);
    return {
      savedPath: destPath.replace(/\\/g, "/"),
      format: "jpg",
      originalBytes: buf.length,
      savedBytes: jpgBuf.length,
    };
  } catch {
    // Zero-interruption fallback: write original PNG bytes as-is
    const fallbackName = sanitized.endsWith(".png") ? sanitized : `${baseName}.png`;
    const destPath = path.join(PREVIEW_DIR, fallbackName);
    fs.writeFileSync(destPath, buf);
    return {
      savedPath: destPath.replace(/\\/g, "/"),
      format: "png",
      originalBytes: buf.length,
      savedBytes: buf.length,
    };
  }
}

function resolveConfiguredNaiProxyUrl(): string | null {
  try {
    if (fs.existsSync(NAI_API_CONFIG_PATH)) {
      const raw = fs.readFileSync(NAI_API_CONFIG_PATH, "utf8");
      const parsed = JSON.parse(raw) as { proxy?: unknown };
      if (typeof parsed.proxy === "string" && parsed.proxy.trim()) {
        return parsed.proxy.trim();
      }
    }
  } catch {
    // Fallback to environment proxy variables if config is unreadable
  }
  const envProxy = (
    process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    process.env.HTTP_PROXY ||
    process.env.http_proxy ||
    ""
  ).trim();
  return envProxy || null;
}

function openHttpsConnectSocket(
  proxyUrlStr: string,
  targetHost: string,
  targetPort: number,
  timeoutMs = 15_000
): Promise<tls.TLSSocket> {
  return new Promise((resolve, reject) => {
    let proxyUrl: URL;
    try {
      proxyUrl = new URL(proxyUrlStr);
    } catch {
      reject(new Error(`Invalid proxy URL: ${proxyUrlStr}`));
      return;
    }

    const proxyHost = proxyUrl.hostname;
    const proxyPort = Number(proxyUrl.port || (proxyUrl.protocol === "https:" ? 443 : 80));
    const connectHeaders: Record<string, string> = {
      Host: `${targetHost}:${targetPort}`,
    };
    if (proxyUrl.username || proxyUrl.password) {
      const auth = Buffer.from(
        `${decodeURIComponent(proxyUrl.username)}:${decodeURIComponent(proxyUrl.password)}`,
        "utf8"
      ).toString("base64");
      connectHeaders["Proxy-Authorization"] = `Basic ${auth}`;
    }

    let settled = false;
    const fail = (err: Error) => {
      if (settled) return;
      settled = true;
      reject(err);
    };

    const connectReq = http.request({
      hostname: proxyHost,
      port: proxyPort,
      method: "CONNECT",
      path: `${targetHost}:${targetPort}`,
      headers: connectHeaders,
    });

    connectReq.setTimeout(timeoutMs, () => {
      connectReq.destroy(new Error(`Proxy CONNECT timeout (${Math.round(timeoutMs / 1000)}s)`));
    });

    connectReq.on("error", (err) => fail(err));
    connectReq.on("connect", (proxyRes, socket, head) => {
      if (proxyRes.statusCode !== 200) {
        socket.destroy();
        fail(new Error(`Proxy CONNECT rejected with HTTP ${proxyRes.statusCode ?? "unknown"}`));
        return;
      }
      if (head && head.length > 0) {
        socket.unshift(head);
      }
      const tlsSocket = tls.connect({
        socket,
        servername: targetHost,
      });
      const tlsTimer = setTimeout(() => {
        tlsSocket.destroy(new Error("TLS handshake via proxy timed out"));
      }, timeoutMs);
      tlsSocket.once("secureConnect", () => {
        clearTimeout(tlsTimer);
        if (settled) return;
        settled = true;
        resolve(tlsSocket);
      });
      tlsSocket.once("error", (err) => {
        clearTimeout(tlsTimer);
        fail(err);
      });
    });

    connectReq.end();
  });
}

function getLanUrls(): string[] {
  const urls: string[] = [];
  const nets = os.networkInterfaces();
  for (const list of Object.values(nets)) {
    if (!list) continue;
    for (const info of list) {
      if (info.family === "IPv4" && !info.internal && info.address) {
        urls.push(`http://${info.address}:${BRIDGE_PORT}`);
      }
    }
  }
  return urls;
}

// ============================================================================
// Minimal Zero-Dependency RFC-6455 WebSocket Connection Wrapper
// ============================================================================
class WsBrowserClient {
  public readonly id: string;
  public connectedUrl = "";
  public connectedAt = Date.now();
  public lastSeenAt = Date.now();
  public visible = true;
  public focusedAt = Date.now();
  private socket: Socket;
  private rxBuf: Buffer = Buffer.alloc(0);
  private fragOpcode = 0;
  private fragChunks: Buffer[] = [];
  private onJsonMessage: (client: WsBrowserClient, msg: Record<string, unknown>) => void;
  private onClosed: (client: WsBrowserClient) => void;

  constructor(
    socket: Socket,
    onJsonMessage: (client: WsBrowserClient, msg: Record<string, unknown>) => void,
    onClosed: (client: WsBrowserClient) => void
  ) {
    this.id = `ws_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    this.socket = socket;
    this.onJsonMessage = onJsonMessage;
    this.onClosed = onClosed;

    socket.on("data", (chunk: Buffer) => {
      this.lastSeenAt = Date.now();
      this.onData(chunk);
    });
    socket.on("close", () => this.onClosed(this));
    socket.on("error", () => this.onClosed(this));
  }

  public isAlive(): boolean {
    return !this.socket.destroyed && this.socket.writable;
  }

  public isLocalClient(): boolean {
    const u = this.connectedUrl.trim().toLowerCase();
    if (!u) return true;
    return (
      u.startsWith("file://") ||
      u.startsWith("http://127.0.0.1") ||
      u.startsWith("https://127.0.0.1") ||
      u.startsWith("http://localhost") ||
      u.startsWith("https://localhost") ||
      u.startsWith("http://[::1]")
    );
  }

  public sendPing(): void {
    if (!this.isAlive()) return;
    this.sendFrame(0x9, Buffer.from("hb", "utf8"));
  }

  public destroy(): void {
    try {
      this.socket.destroy();
    } catch {
      // ignore
    }
  }

  public sendJson(payload: unknown): void {
    if (!this.isAlive()) return;
    const body = Buffer.from(JSON.stringify(payload), "utf8");
    this.sendFrame(0x1, body);
  }

  private sendFrame(opcode: number, payload: Buffer): void {
    if (this.socket.destroyed) return;
    const len = payload.length;
    let header: Buffer;
    if (len < 126) {
      header = Buffer.alloc(2);
      header[0] = 0x80 | (opcode & 0x0f);
      header[1] = len;
    } else if (len < 65536) {
      header = Buffer.alloc(4);
      header[0] = 0x80 | (opcode & 0x0f);
      header[1] = 126;
      header.writeUInt16BE(len, 2);
    } else {
      header = Buffer.alloc(10);
      header[0] = 0x80 | (opcode & 0x0f);
      header[1] = 127;
      header.writeBigUInt64BE(BigInt(len), 2);
    }
    try {
      this.socket.write(Buffer.concat([header, payload]));
    } catch {
      // ignore broken pipe
    }
  }

  private onData(chunk: Buffer): void {
    this.rxBuf = Buffer.concat([this.rxBuf, chunk]);
    while (this.rxBuf.length >= 2) {
      const b0 = this.rxBuf[0];
      const b1 = this.rxBuf[1];
      const fin = (b0 & 0x80) !== 0;
      const opcode = b0 & 0x0f;
      const masked = (b1 & 0x80) !== 0;
      let payloadLen = b1 & 0x7f;
      let offset = 2;

      if (payloadLen === 126) {
        if (this.rxBuf.length < 4) return;
        payloadLen = this.rxBuf.readUInt16BE(2);
        offset = 4;
      } else if (payloadLen === 127) {
        if (this.rxBuf.length < 10) return;
        payloadLen = Number(this.rxBuf.readBigUInt64BE(2));
        offset = 10;
      }

      const maskBytes = masked ? 4 : 0;
      if (this.rxBuf.length < offset + maskBytes + payloadLen) {
        return;
      }

      let data = this.rxBuf.subarray(offset + maskBytes, offset + maskBytes + payloadLen);
      if (masked) {
        const mask = this.rxBuf.subarray(offset, offset + 4);
        const unmasked = Buffer.allocUnsafe(payloadLen);
        for (let i = 0; i < payloadLen; i++) {
          unmasked[i] = data[i] ^ mask[i & 3];
        }
        data = unmasked;
      }
      this.rxBuf = this.rxBuf.subarray(offset + maskBytes + payloadLen);

      if (opcode === 0x8) {
        // Close
        this.sendFrame(0x8, Buffer.alloc(0));
        this.socket.end();
        return;
      }
      if (opcode === 0x9) {
        // Ping -> Pong
        this.sendFrame(0x0a, data);
        continue;
      }
      if (opcode === 0x0a) {
        continue;
      }

      if (opcode === 0x0) {
        this.fragChunks.push(data);
        if (fin) {
          const full = Buffer.concat(this.fragChunks);
          const doneOp = this.fragOpcode;
          this.fragChunks = [];
          this.fragOpcode = 0;
          if (doneOp === 0x1) this.deliverText(full.toString("utf8"));
        }
      } else if (!fin) {
        this.fragOpcode = opcode;
        this.fragChunks = [data];
      } else if (opcode === 0x1) {
        this.deliverText(data.toString("utf8"));
      }
    }
  }

  private deliverText(text: string): void {
    try {
      const parsed = JSON.parse(text) as unknown;
      if (parsed && typeof parsed === "object") {
        this.onJsonMessage(this, parsed as Record<string, unknown>);
      }
    } catch {
      // ignore malformed JSON
    }
  }
}

// ============================================================================
// Primary Hub / Relay Bridge Coordinator
// ============================================================================
interface PendingRpc {
  clientId: string;
  resolve: (val: unknown) => void;
  reject: (err: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

class BridgeHub {
  private role: "primary" | "relay" = "primary";
  private httpServer: http.Server | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private clients: WsBrowserClient[] = [];
  private pending = new Map<string, PendingRpc>();
  private promotedAt = 0;
  private bindPromise: Promise<boolean> | null = null;

  public getRole(): "primary" | "relay" {
    return this.role;
  }

  public async init(): Promise<void> {
    await this.tryBindPrimary();
  }

  private async tryBindPrimary(): Promise<boolean> {
    if (this.role === "primary" && this.httpServer) return true;
    if (this.bindPromise) return this.bindPromise;

    this.bindPromise = new Promise<boolean>((resolve) => {
      const srv = http.createServer((req, res) => void this.handleHttp(req, res));
      srv.on("upgrade", (req, socket) => this.handleUpgrade(req, socket as Socket));
      srv.once("error", () => {
        this.role = "relay";
        resolve(false);
      });
      srv.listen(BRIDGE_PORT, BRIDGE_BIND_HOST, () => {
        this.role = "primary";
        this.httpServer = srv;
        this.promotedAt = Date.now();
        this.startHeartbeat();
        resolve(true);
      });
    }).finally(() => {
      this.bindPromise = null;
    });

    return this.bindPromise;
  }

  private loopbackHttpJson<T>(options: {
    method: "GET" | "POST";
    path: string;
    body?: unknown;
    timeoutMs: number;
  }): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const payload =
        options.body !== undefined ? Buffer.from(JSON.stringify(options.body), "utf8") : null;
      const req = http.request(
        {
          hostname: LOCAL_RELAY_HOST,
          port: BRIDGE_PORT,
          path: options.path,
          method: options.method,
          headers: payload
            ? {
                "Content-Type": "application/json",
                "Content-Length": payload.length,
              }
            : undefined,
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (chunk: Buffer) => chunks.push(chunk));
          res.on("end", () => {
            const raw = Buffer.concat(chunks).toString("utf8");
            if ((res.statusCode ?? 500) >= 400) {
              reject(new Error(`Bridge loopback HTTP ${res.statusCode}: ${raw.slice(0, 200)}`));
              return;
            }
            try {
              resolve(JSON.parse(raw) as T);
            } catch (err) {
              reject(
                new Error(
                  `Invalid JSON from bridge primary: ${err instanceof Error ? err.message : String(err)}`
                )
              );
            }
          });
        }
      );

      req.setTimeout(options.timeoutMs, () => {
        req.destroy(new Error(`Loopback relay timeout (${Math.round(options.timeoutMs / 1000)}s)`));
      });
      req.on("error", (err) => reject(err));
      if (payload) {
        req.write(payload);
      }
      req.end();
    });
  }

  private isRelayTransportError(err: unknown): boolean {
    if (!err || typeof err !== "object") return false;
    const code = (err as NodeJS.ErrnoException).code;
    if (
      code === "ECONNREFUSED" ||
      code === "ECONNRESET" ||
      code === "EPIPE" ||
      code === "ETIMEDOUT"
    ) {
      return true;
    }
    const msg = err instanceof Error ? err.message : String(err);
    return /ECONNREFUSED|ECONNRESET|socket hang up|fetch failed/i.test(msg);
  }

  private async waitForClientAfterPromotion(maxWaitMs = 3600): Promise<void> {
    if (this.getOrderedClients().length > 0) return;
    const deadline = Math.min(this.promotedAt + maxWaitMs, Date.now() + maxWaitMs);
    while (Date.now() < deadline) {
      if (this.getOrderedClients().length > 0) return;
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) return;
    this.heartbeatTimer = setInterval(() => {
      const now = Date.now();
      const stale: WsBrowserClient[] = [];
      for (const cli of this.clients) {
        if (!cli.isAlive() || now - cli.lastSeenAt > 30000) {
          stale.push(cli);
        } else {
          cli.sendPing();
        }
      }
      for (const dead of stale) {
        this.evictClient(dead);
      }
    }, 12000);
    this.heartbeatTimer.unref?.();
  }

  private rejectPendingForClient(clientId: string, reason: string): void {
    for (const [reqId, entry] of this.pending.entries()) {
      if (entry.clientId === clientId) {
        clearTimeout(entry.timer);
        this.pending.delete(reqId);
        entry.reject(new Error(reason));
      }
    }
  }

  private evictClient(cli: WsBrowserClient): void {
    this.clients = this.clients.filter((c) => c !== cli);
    this.rejectPendingForClient(cli.id, "网页连接已断开或超时被重置，请重试");
    cli.destroy();
  }

  public close(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.httpServer?.close();
  }

  private getOrderedClients(): WsBrowserClient[] {
    const alive = this.clients.filter((c) => c.isAlive());
    if (alive.length !== this.clients.length) {
      const deadIds = new Set(this.clients.filter((c) => !c.isAlive()).map((c) => c.id));
      this.clients = alive;
      for (const deadId of deadIds) {
        this.rejectPendingForClient(deadId, "网页连接已断开");
      }
    }
    return [...alive].sort((a, b) => {
      const aScore = (a.isLocalClient() ? 2 : 0) + (a.visible ? 1 : 0);
      const bScore = (b.isLocalClient() ? 2 : 0) + (b.visible ? 1 : 0);
      if (aScore !== bScore) return bScore - aScore;
      if (a.focusedAt !== b.focusedAt) return b.focusedAt - a.focusedAt;
      return b.connectedAt - a.connectedAt;
    });
  }

  private getActiveClient(): WsBrowserClient | null {
    const ordered = this.getOrderedClients();
    return ordered.length > 0 ? ordered[0] : null;
  }

  public async getBridgeSnapshot(): Promise<{
    connected_clients: number;
    active_client_url: string | null;
    client_urls: string[];
  }> {
    if (this.role === "primary") {
      const ordered = this.getOrderedClients();
      return {
        connected_clients: ordered.length,
        active_client_url: ordered[0]?.connectedUrl || null,
        client_urls: ordered.map((c) => c.connectedUrl || "(connecting)"),
      };
    }
    try {
      const data = await this.loopbackHttpJson<{
        connected_clients?: number;
        latest_client_url?: string | null;
        client_urls?: string[];
      }>({
        method: "GET",
        path: "/health",
        timeoutMs: 3000,
      });
      return {
        connected_clients: data.connected_clients ?? 0,
        active_client_url: data.latest_client_url ?? null,
        client_urls: data.client_urls ?? [],
      };
    } catch {
      // ignore
    }
    return { connected_clients: 0, active_client_url: null, client_urls: [] };
  }

  private setCors(res: http.ServerResponse): void {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept");
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition, Content-Type, Content-Length");
    res.setHeader("Access-Control-Allow-Private-Network", "true");
  }

  private isLoopbackPeer(addr?: string): boolean {
    if (!addr) return false;
    return addr === "127.0.0.1" || addr === "::1" || addr === "::ffff:127.0.0.1";
  }

  private readBodyBuffer(req: http.IncomingMessage): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const parts: Buffer[] = [];
      req.on("data", (c: Buffer) => parts.push(c));
      req.on("end", () => resolve(Buffer.concat(parts)));
      req.on("error", reject);
    });
  }

  private async handleNaiProxy(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    reqUrl: URL
  ): Promise<void> {
    const method = (req.method || "GET").toUpperCase();
    if (method !== "GET" && method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ ok: false, error: `Method not allowed: ${method}` }));
      return;
    }

    const match = /^\/api\/nai-proxy\/(image|api)(\/.*)$/.exec(reqUrl.pathname);
    if (!match) {
      res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
      res.end(
        JSON.stringify({
          ok: false,
          error: "Forbidden or invalid NovelAI proxy target (only /image/* and /api/* are allowed)",
        })
      );
      return;
    }

    const targetHost = NAI_PROXY_TARGETS[match[1]];
    const targetPath = `${match[2]}${reqUrl.search}`;

    let bodyBuf: Buffer | null = null;
    if (method === "POST") {
      try {
        bodyBuf = await this.readBodyBuffer(req);
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
        res.end(
          JSON.stringify({
            ok: false,
            error: `Failed to read request body: ${err instanceof Error ? err.message : String(err)}`,
          })
        );
        return;
      }
    }

    const upstreamHeaders: Record<string, string> = {
      Host: targetHost,
    };
    const passthroughKeys = ["authorization", "content-type", "accept", "user-agent"] as const;
    for (const key of passthroughKeys) {
      const val = req.headers[key];
      if (typeof val === "string" && val.length > 0) {
        upstreamHeaders[key] = val;
      } else if (Array.isArray(val) && val.length > 0) {
        upstreamHeaders[key] = val.join(", ");
      }
    }
    if (bodyBuf !== null) {
      upstreamHeaders["content-length"] = String(bodyBuf.length);
    }

    const proxyUrl = resolveConfiguredNaiProxyUrl();
    let tlsSocket: tls.TLSSocket | null = null;

    try {
      if (proxyUrl) {
        tlsSocket = await openHttpsConnectSocket(proxyUrl, targetHost, 443, 15_000);
      }

      await new Promise<void>((resolve, reject) => {
        const handleUpstreamResponse = (upstreamRes: http.IncomingMessage) => {
          const outHeaders: Record<string, string> = {};
          const copyRespKeys = [
            "content-type",
            "content-disposition",
            "content-length",
            "content-encoding",
          ] as const;
          for (const key of copyRespKeys) {
            const val = upstreamRes.headers[key];
            if (typeof val === "string" && val.length > 0) {
              outHeaders[key] = val;
            } else if (Array.isArray(val) && val.length > 0) {
              outHeaders[key] = val.join(", ");
            }
          }
          res.writeHead(upstreamRes.statusCode ?? 502, outHeaders);
          upstreamRes.pipe(res);
          upstreamRes.on("end", () => resolve());
          upstreamRes.on("error", (err) => reject(err));
        };

        const upstreamReq = tlsSocket
          ? (() => {
              const tunnelAgent = new http.Agent({ keepAlive: false });
              (tunnelAgent as unknown as { createConnection: () => tls.TLSSocket }).createConnection =
                () => tlsSocket!;
              return http.request(
                {
                  hostname: targetHost,
                  port: 443,
                  path: targetPath,
                  method,
                  headers: upstreamHeaders,
                  agent: tunnelAgent,
                },
                handleUpstreamResponse
              );
            })()
          : https.request(
              {
                hostname: targetHost,
                port: 443,
                path: targetPath,
                method,
                headers: upstreamHeaders,
                agent: false,
              },
              handleUpstreamResponse
            );

        upstreamReq.setTimeout(NAI_PROXY_TIMEOUT_MS, () => {
          upstreamReq.destroy(
            new Error(`Upstream NovelAI request timed out (${Math.round(NAI_PROXY_TIMEOUT_MS / 1000)}s)`)
          );
        });
        upstreamReq.on("error", (err) => reject(err));

        if (bodyBuf !== null && bodyBuf.length > 0) {
          upstreamReq.write(bodyBuf);
        }
        upstreamReq.end();
      });
    } catch (err) {
      if (tlsSocket && !tlsSocket.destroyed) {
        try {
          tlsSocket.destroy();
        } catch {
          // ignore
        }
      }
      if (!res.headersSent) {
        res.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
        res.end(
          JSON.stringify({
            ok: false,
            error: `NovelAI proxy error: ${err instanceof Error ? err.message : String(err)}`,
          })
        );
      } else if (!res.writableEnded) {
        res.end();
      }
    }
  }

  private async handleHttp(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    this.setCors(res);
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const reqUrl = new URL(req.url || "/", `http://${LOCAL_RELAY_HOST}:${BRIDGE_PORT}`);

    // Serve standalone NovelAI_Workbench.html directly to LAN / remote browsers!
    if (
      req.method === "GET" &&
      (reqUrl.pathname === "/" || reqUrl.pathname === "/NovelAI_Workbench.html")
    ) {
      if (fs.existsSync(STANDALONE_HTML_PATH)) {
        const htmlBuf = fs.readFileSync(STANDALONE_HTML_PATH);
        res.writeHead(200, {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache",
        });
        res.end(htmlBuf);
      } else {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("NovelAI_Workbench.html not found at repository root.");
      }
      return;
    }

    if (req.method === "GET" && reqUrl.pathname === "/health") {
      const ordered = this.getOrderedClients();
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(
        JSON.stringify({
          ok: true,
          role: this.role,
          bind_host: BRIDGE_BIND_HOST,
          port: BRIDGE_PORT,
          lan_urls: getLanUrls(),
          connected_clients: ordered.length,
          latest_client_url: ordered[0]?.connectedUrl ?? null,
          client_urls: ordered.map((c) => c.connectedUrl || "(connecting)"),
        })
      );
      return;
    }

    if (req.method === "POST" && reqUrl.pathname === "/bridge/upload-latest") {
      try {
        const buf = await this.readBodyBuffer(req);
        const rawName = reqUrl.searchParams.get("filename") || `preview_${Date.now()}.png`;
        const saved = await savePreviewImage(buf, rawName);
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(
          JSON.stringify({
            ok: true,
            savedPath: saved.savedPath,
            format: saved.format,
            originalBytes: saved.originalBytes,
            savedBytes: saved.savedBytes,
          })
        );
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
        res.end(
          JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) })
        );
      }
      return;
    }

    if (reqUrl.pathname.startsWith("/api/nai-proxy/")) {
      await this.handleNaiProxy(req, res, reqUrl);
      return;
    }

    if (req.method === "POST" && reqUrl.pathname === "/api/rpc") {
      if (!this.isLoopbackPeer(req.socket.remoteAddress)) {
        res.writeHead(403, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ ok: false, error: "Forbidden: internal MCP relay is loopback-only" }));
        return;
      }
      try {
        const buf = await this.readBodyBuffer(req);
        const body = JSON.parse(buf.toString("utf8")) as {
          method: string;
          params?: Record<string, unknown>;
          timeoutMs?: number;
        };
        const result = await this.dispatchLocalBrowserRpc(
          body.method,
          body.params ?? {},
          body.timeoutMs ?? 20000
        );
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ ok: true, result }));
      } catch (err) {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(
          JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) })
        );
      }
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }

  private handleUpgrade(req: http.IncomingMessage, socket: Socket): void {
    const key = req.headers["sec-websocket-key"];
    if (!key || typeof key !== "string") {
      socket.destroy();
      return;
    }
    const accept = crypto.createHash("sha1").update(key + WS_GUID).digest("base64");
    const headers = [
      "HTTP/1.1 101 Switching Protocols",
      "Upgrade: websocket",
      "Connection: Upgrade",
      `Sec-WebSocket-Accept: ${accept}`,
      "\r\n",
    ];
    socket.write(headers.join("\r\n"));

    const client = new WsBrowserClient(
      socket,
      (cli, msg) => this.onClientMessage(cli, msg),
      (cli) => {
        this.clients = this.clients.filter((c) => c !== cli);
        this.rejectPendingForClient(cli.id, "网页标签页已刷新或关闭，请重新执行命令");
      }
    );
    this.clients.push(client);
  }

  private onClientMessage(client: WsBrowserClient, msg: Record<string, unknown>): void {
    if (msg.type === "hello") {
      client.connectedUrl = String(msg.url || "");
      if (typeof msg.visible === "boolean") client.visible = msg.visible;
      if (typeof msg.focusedAt === "number" && Number.isFinite(msg.focusedAt)) {
        client.focusedAt = msg.focusedAt;
      }
      return;
    }
    if (msg.type === "presence") {
      if (typeof msg.visible === "boolean") client.visible = msg.visible;
      if (typeof msg.focusedAt === "number" && Number.isFinite(msg.focusedAt)) {
        client.focusedAt = msg.focusedAt;
      } else if (client.visible) {
        client.focusedAt = Date.now();
      }
      return;
    }
    if (msg.type === "rpc_response" && typeof msg.id === "string") {
      const entry = this.pending.get(msg.id);
      if (!entry) return;
      clearTimeout(entry.timer);
      this.pending.delete(msg.id);
      if (msg.ok) {
        entry.resolve(msg.result);
      } else {
        entry.reject(new Error(String(msg.error || "Unknown webpage RPC error")));
      }
    }
  }

  private sendRpcToClient(
    client: WsBrowserClient,
    method: string,
    params: Record<string, unknown>,
    timeoutMs: number
  ): Promise<unknown> {
    if (!client.isAlive()) {
      this.evictClient(client);
      return Promise.reject(new Error(`网页连接已断开: ${method}`));
    }
    const reqId = `rpc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(reqId);
        reject(new Error(`等待网页响应超时 (${Math.round(timeoutMs / 1000)}s): ${method}`));
      }, timeoutMs);

      this.pending.set(reqId, { clientId: client.id, resolve, reject, timer });
      client.sendJson({
        type: "rpc_request",
        id: reqId,
        method,
        params,
      });
    });
  }

  private async dispatchLocalBrowserRpc(
    method: string,
    params: Record<string, unknown>,
    timeoutMs: number
  ): Promise<unknown> {
    const candidates = this.getOrderedClients();
    if (candidates.length === 0) {
      const lanList = getLanUrls();
      const lanHint = lanList.length > 0 ? `；手机/平板/其他设备可直接访问 ${lanList.join(" 或 ")}` : "";
      throw new Error(
        `当前没有检测到已连接的 NovelAI_Workbench.html 网页！请在本机打开 NovelAI_Workbench.html（或访问 http://127.0.0.1:${BRIDGE_PORT}${lanHint}）。`
      );
    }

    // Never 6s-timeout or fail over long-running generation/upscale RPCs,
    // otherwise a normal 7s+ image render or batch upscale gets aborted and resent to a stale background tab!
    const isLongOperation =
      method === "trigger_generate" ||
      method === "generate" ||
      (method === "manage_files" && params.action === "upscale_images");
    const allowFailover = !isLongOperation && candidates.length > 1;
    let lastErr: Error | null = null;
    for (let i = 0; i < candidates.length; i++) {
      const cli = candidates[i];
      const attemptTimeout = allowFailover && i < candidates.length - 1 ? Math.min(timeoutMs, 6000) : timeoutMs;
      try {
        return await this.sendRpcToClient(cli, method, params, attemptTimeout);
      } catch (err) {
        lastErr = err instanceof Error ? err : new Error(String(err));
        if (!allowFailover || !lastErr.message.includes("超时")) {
          throw lastErr;
        }
        // Evict hung zombie socket and try next live client
        this.evictClient(cli);
      }
    }
    throw lastErr ?? new Error(`等待网页响应超时: ${method}`);
  }

  public async callBrowser(
    method: string,
    params: Record<string, unknown> = {},
    timeoutMs = 20000
  ): Promise<unknown> {
    if (this.role === "primary") {
      if (this.promotedAt > 0 && Date.now() - this.promotedAt < 3800) {
        await this.waitForClientAfterPromotion();
      }
      return this.dispatchLocalBrowserRpc(method, params, timeoutMs);
    }

    // Relay mode: forward over direct loopback HTTP (proxy-immune) to the Primary Hub instance
    const sendRelay = async (): Promise<unknown> => {
      const data = await this.loopbackHttpJson<{
        ok: boolean;
        result?: unknown;
        error?: string;
      }>({
        method: "POST",
        path: "/api/rpc",
        body: { method, params, timeoutMs },
        timeoutMs: timeoutMs + 5000,
      });
      if (!data.ok) {
        throw new Error(data.error || "Relay RPC failed");
      }
      return data.result;
    };

    try {
      return await sendRelay();
    } catch (err) {
      if (!this.isRelayTransportError(err)) {
        throw err;
      }
      // Primary may have exited: try promoting self to Primary, or retry against the new Primary
      const promoted = await this.tryBindPrimary();
      if (promoted) {
        await this.waitForClientAfterPromotion();
        return this.dispatchLocalBrowserRpc(method, params, timeoutMs);
      }
      await new Promise((r) => setTimeout(r, 250));
      return await sendRelay();
    }
  }
}

// ============================================================================
// Option Catalog Lookup Helper (Zero Hallucination Preset Keys)
// ============================================================================
function lookupPresetCatalog(category: string, query = ""): Record<string, unknown> {
  const q = query.trim().toLowerCase();
  const filterKeys = (keys: string[]) =>
    q ? keys.filter((k) => k.toLowerCase().includes(q)) : keys;

  const catalog: Record<string, unknown> = {
    models: NAI_MODEL_OPTIONS,
    canvases: filterKeys(Object.keys(CANVAS_PRESETS)),
    bundled_custom_presets: filterKeys(Object.keys(BUNDLED_CUSTOM_PRESETS)),
    characters: filterKeys(Object.keys(BUILTIN_CHARACTERS)),
    body: filterKeys(Object.keys(BODY_PRESETS)),
    bust: filterKeys(Object.keys(BUST_PRESETS)),
    skin: filterKeys(Object.keys(SKIN_PRESETS)),
    outfits: filterKeys(Object.keys(OUTFIT_PRESETS)),
    outfit_states: filterKeys(Object.keys(OUTFIT_STATE_PRESETS)),
    legwear: filterKeys(Object.keys(LEGWEAR_PRESETS)),
    styles: filterKeys(Object.keys(STYLE_PRESETS)),
    lighting: filterKeys(Object.keys(LIGHTING_PRESETS)),
    env: filterKeys(Object.keys(ENV_PRESETS)),
    morph: filterKeys(Object.keys(MORPH_PRESETS)),
    pubic: filterKeys(Object.keys(PUBIC_PRESETS)),
    pigment: filterKeys(Object.keys(PIGMENT_PRESETS)),
    expressions: filterKeys(Object.keys(EXPRESSION_PRESETS)),
    pos_male_modes: filterKeys(Object.keys(POS_MALE_MODE_PRESETS)),
    pos_stages: filterKeys(Object.keys(POS_STAGE_PRESETS)),
    pos_scenes: filterKeys(Object.keys(POS_SCENE_PRESETS)),
    poses: ALL_POSITIONS_CHAPTERS.filter(
      (c) => !q || c.id.toLowerCase().includes(q) || c.title.toLowerCase().includes(q)
    ).map((c) => ({ id: c.id, title: c.title, category: c.category })),
    multi_angle: MULTI_ANGLE_CHAPTERS.filter(
      (c) => !q || c.id.toLowerCase().includes(q) || c.title.toLowerCase().includes(q)
    ).map((c) => ({ id: c.id, title: c.title })),
    other_actions: [
      ...ALL_POSITIONS_CHAPTERS.filter(
        (c) =>
          (c.id.startsWith("TN") || c.id.startsWith("BG")) &&
          (!q || c.id.toLowerCase().includes(q) || c.title.toLowerCase().includes(q))
      ).map((c) => ({
        id: c.id,
        title: c.title,
        category: c.id.startsWith("TN") ? "1. 触手缠缚" : "2. 异形虫巢",
      })),
      ...OTHER_ACTION_CHAPTERS.filter(
        (c) =>
          !q ||
          c.id.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.sub.toLowerCase().includes(q)
      ).map((c) => {
        const sfCatMap: Record<string, string> = {
          "1. 对镜私拍": "3. 对镜私拍",
          "2. 场所露出": "4. 场所露出",
          "3. 奇特机位": "5. 奇特机位",
          "4. 束缚与UI": "6. 束缚与UI",
        };
        const tpl = OTHER_ACTION_TEMPLATES[c.id];
        return {
          id: c.id,
          title: c.title,
          sub: c.sub,
          category: sfCatMap[c.category] || c.category,
          camera_mode: c.camera_mode,
          canvas: c.canvas,
          ...(c.category === "22. 温泉单人" || Boolean(tpl?.solo_spread_spec)
            ? {
                solo_spread_eligible: Boolean(tpl?.solo_spread_spec),
                solo_spread_modes: ["off", "pure", "cum"],
              }
            : {}),
        };
      }),
    ],
  };

  if (!category || category === "all") {
    return catalog;
  }
  if (category in catalog) {
    return { [category]: catalog[category] };
  }
  throw new Error(
    `Unknown category '${category}'. Valid categories: all, ${Object.keys(catalog).join(", ")}`
  );
}

// ============================================================================
// MCP Tool Definitions
// ============================================================================
const MCP_TOOLS = [
  {
    name: "nai_get_state",
    description:
      "Read the live state of the open NovelAI_Workbench.html webpage, including active CharacterConfig, model/sampling settings (with API token redacted), active pose/mode, compiled Positive & Negative prompts, exact T5 token counts, Vibe Transfer slots, saved presets, and gallery status.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "nai_list_options",
    description:
      "List exact built-in preset keys and pose IDs supported by NovelAI Studio 2.0 (styles, lighting, outfits including 6 Pool swimwear presets, body, bust, anatomy, 51 poses P01~P51, MA0~MA11, SF01~SF30, KTD01~KTD60, KT01~KT46, PLD01~PLD22, PL01~PL11, CV01~CV07, BT01~BT08, HWD01~HWD15, PS01~PS04, CP01~CP12, AFD01~AFD15, ONS01~ONS55, CAR01~CAR25, MTS01~MTS15, etc.) before calling nai_update_config.",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description:
            "Category to inspect: 'all' | 'models' | 'canvases' | 'characters' | 'body' | 'bust' | 'skin' | 'outfits' | 'outfit_states' | 'legwear' | 'styles' | 'lighting' | 'env' | 'morph' | 'pubic' | 'pigment' | 'expressions' | 'pos_male_modes' | 'pos_stages' | 'pos_scenes' | 'poses' | 'multi_angle' | 'other_actions'",
        },
        query: {
          type: "string",
          description: "Optional substring filter to narrow matching options.",
        },
      },
    },
  },
  {
    name: "nai_update_config",
    description:
      "Directly push configuration changes to the open NovelAI_Workbench.html webpage in real time. Supports updating any CharacterConfig field (char_tag, extra_char_tags, gender_mode: 'normal'|'femboy'|'futa_no_balls'|'futa_with_balls', body_preset, bust_preset, outfit_preset, custom_outfit_tags, outfit_state_mode, style_preset, lighting_preset, pos_stage, pos_male_mode, pos_scene, enable_condom, enable_uterus_xray, solo_spread_mode: 'off'|'pure'|'cum', enable_solo_spread, pixiv_bar_censor: 'off'|'white'|'black'|'mosaic', other_use_scene_outfit, free_action_tags, free_action_prose, free_action_nsfw, etc.), NaiApiSettings (model, steps, scale, cfg_rescale, canvas_preset, seed, batch_count, auto_upscale_replace), action_mode ('positions' | 'multi_angle' | 'other' | 'free'), and active_scene_id ('P01'..'P51' | 'MP01'..'MP15' | 'TN01'..'TN12' | 'BG01'..'BG20' | 'MA0'..'MA11' | 'MA7A'..'MA7E' | 'SF01'..'SF30' | 'KTD01'..'KTD60' | 'KT01'..'KT46' | 'PLD01'..'PLD22' | 'PL01'..'PL11' | 'CV01'..'CV07' | 'BT01'..'BT08' | 'HWD01'..'HWD15' | 'PS01'..'PS04' | 'CP01'..'CP12' | 'AFD01'..'AFD15' | 'ONS01'..'ONS55' | 'CAR01'..'CAR25' | 'MTS01'..'MTS15' | 'FREE').",
    inputSchema: {
      type: "object",
      properties: {
        character_config: {
          type: "object",
          description: "Partial CharacterConfig fields to update on the webpage.",
        },
        api_settings: {
          type: "object",
          description:
            "Partial NaiApiSettings fields to update (model, steps, scale, cfg_rescale, canvas_preset, seed, batch_count, uc_preset_mode, extra_uc, append_v5_quality, auto_upscale_replace).",
        },
        action_mode: {
          type: "string",
          enum: ["positions", "multi_angle", "other", "free"],
          description: "Right-column action mode to switch to.",
        },
        active_scene_id: {
          type: "string",
          description: "Scene ID to activate, e.g. 'P22', 'MA10', 'SF01', 'KTD01', 'KT01', 'PLD01', 'PL01', 'CV01', 'BT01', 'HWD01', 'PS01', 'CP01', 'AFD01', 'ONS01', 'CAR01', 'MTS01', or 'FREE'.",
        },
        checked_position_ids: {
          type: "array",
          items: { type: "string" },
          description: "Optional batch-checked position IDs.",
        },
        checked_other_action_ids: {
          type: "array",
          items: { type: "string" },
          description: "Optional batch-checked TN01..TN12 / BG01..BG20 / SF01..SF30 / KTD01..KTD60 / KT01..KT46 / PLD01..PLD22 / PL01..PL11 / CV01..CV07 / BT01..BT08 / HWD01..HWD15 / PS01..PS04 / CP01..CP12 / AFD01..AFD15 / ONS01..ONS55 / CAR01..CAR25 / MTS01..MTS15 other-action IDs.",
        },
      },
    },
  },
  {
    name: "nai_set_manual_prompt",
    description:
      "Directly edit or patch the live Positive / Negative prompt textareas in the webpage's bottom prompt drawer (locking manual edits for generation), or unlock manual edits to restore automatic engine prompt compilation.",
    inputSchema: {
      type: "object",
      properties: {
        positive: {
          type: "string",
          description: "Full replacement Positive prompt text.",
        },
        negative: {
          type: "string",
          description: "Full replacement scene Negative prompt text.",
        },
        replace_target: {
          type: "string",
          description: "Exact substring in current Positive prompt to replace.",
        },
        replace_with: {
          type: "string",
          description: "Replacement string for replace_target.",
        },
        expand_drawer: {
          type: "boolean",
          description: "Set true to visually expand the bottom prompt drawer on the webpage.",
        },
        unlock: {
          type: "boolean",
          description: "Set true to clear manual prompt lock and restore engine-compiled prompt.",
        },
      },
    },
  },
  {
    name: "nai_manage_presets",
    description:
      "Select, save/create, delete, or factory-restore character presets directly in the open webpage's preset dropdown and localStorage.",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["select", "save", "delete", "restore_defaults"],
          description: "Preset operation to perform.",
        },
        name: {
          type: "string",
          description: "Preset name to select, save as, or delete.",
        },
      },
      required: ["action"],
    },
  },
  {
    name: "nai_manage_vibes",
    description:
      "Inspect, adjust per-slot strength/enabled, clear, or import a local .naiv4vibebundle / .naiv4vibe / NAI PNG file directly into the open webpage's Vibe Transfer slots.",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["list", "clear", "set_master", "update_slot", "import_file"],
          description: "Vibe operation to perform.",
        },
        file_path: {
          type: "string",
          description:
            "For import_file: absolute local path to a .naiv4vibebundle, .naiv4vibe, or NAI PNG file.",
        },
        append: {
          type: "boolean",
          description: "For import_file: true to append slots, false (default) to replace.",
        },
        index: {
          type: "number",
          description: "For update_slot: 0-based Vibe slot index.",
        },
        strength: {
          type: "number",
          description: "For update_slot: Vibe strength between -1.0 and 1.0.",
        },
        enabled: {
          type: "boolean",
          description: "For set_master or update_slot: enable or pause Vibe.",
        },
        normalize_strength: {
          type: "boolean",
          description: "For set_master: toggle multi-vibe strength normalization.",
        },
      },
      required: ["action"],
    },
  },
  {
    name: "nai_list_files",
    description:
      "Read-only inventory of the open NovelAI_Workbench.html webpage's in-session gallery images and grouping folders (including folder counts, ungrouped count, opened/pinned folder state, starred/2x status, seeds, and scene IDs). Call this before nai_manage_files to inspect IDs, indices, and folder names.",
    inputSchema: {
      type: "object",
      properties: {
        folder: {
          type: "string",
          description:
            "Optional folder filter: omit or '*' for all images, '' (empty string) for ungrouped images only, or a specific folder name.",
        },
        scene_id: {
          type: "string",
          description: "Optional exact scene ID filter, e.g. 'BG01' or 'P22'.",
        },
        scene_prefix: {
          type: "string",
          description: "Optional scene ID prefix filter, e.g. 'BG', 'TN', 'MA', 'P'.",
        },
        starred_only: {
          type: "boolean",
          description: "If true, only list starred images.",
        },
        upscaled_only: {
          type: "boolean",
          description: "If true, only list 2x upscaled images.",
        },
        include_prompts: {
          type: "boolean",
          description: "If true, include prompt_pos and prompt_neg per image (default false).",
        },
        offset: {
          type: "number",
          description: "Pagination offset (default 0).",
        },
        limit: {
          type: "number",
          description: "Max number of image entries to return (1..200, default 100).",
        },
      },
    },
  },
  {
    name: "nai_manage_files",
    description:
      "Organize and archive gallery images and incremental folders strictly inside the open NovelAI_Workbench.html webpage (auto-syncing to the browser's mounted local output directory when mounted). Supports creating/renaming/dissolving/deleting/opening/pinning folders, moving images between folders and the ungrouped pool, selecting/starring/deleting/upscaling images via flexible selectors, and triggering browser ZIP export.",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: [
            "create_folder",
            "rename_folder",
            "dissolve_folder",
            "delete_folder",
            "open_folder",
            "pin_folder",
            "move_images",
            "select_image",
            "star_images",
            "delete_images",
            "upscale_images",
            "export_zip",
          ],
          description: "Webpage file/folder management action to execute.",
        },
        folder_name: {
          type: "string",
          description:
            "Target folder name for create_folder / rename_folder / dissolve_folder / delete_folder / open_folder / pin_folder / export_zip. Pass empty string or omit for open_folder/pin_folder to close/unpin.",
        },
        new_name: {
          type: "string",
          description: "For rename_folder: new folder name.",
        },
        merge_if_exists: {
          type: "boolean",
          description:
            "For rename_folder: merge into existing folder of the same name (default true).",
        },
        open: {
          type: "boolean",
          description: "For create_folder: set true to expand organizer and open the folder.",
        },
        pin: {
          type: "boolean",
          description:
            "For create_folder: set true to pin the folder as the default destination for new generations.",
        },
        expanded: {
          type: "boolean",
          description: "For open_folder: explicitly expand or collapse the multi-column archive bar.",
        },
        target_folder: {
          type: "string",
          description:
            "For move_images: destination folder name (auto-created if new). Pass '' or omit to move back to ungrouped pool.",
        },
        open_target_folder: {
          type: "boolean",
          description: "For move_images: expand organizer and open the destination folder after moving.",
        },
        image_id: {
          type: "string",
          description: "For select_image: exact image record ID.",
        },
        gallery_index: {
          type: "number",
          description: "For select_image: 0-based gallery index.",
        },
        starred: {
          type: "boolean",
          description: "For star_images: true to star (default), false to unstar.",
        },
        label: {
          type: "string",
          description: "For export_zip: optional filename prefix label.",
        },
        selector: {
          type: "object",
          description:
            "Image selector (intersection of all provided fields) for move_images / star_images / delete_images / upscale_images / export_zip. Must provide at least one field; use from_folder: '*' to match all images.",
          properties: {
            image_ids: { type: "array", items: { type: "string" } },
            gallery_indices: { type: "array", items: { type: "number" } },
            index_range: {
              type: "array",
              items: { type: "number" },
              description: "Inclusive [startIndex, endIndex], e.g. [0, 19].",
            },
            from_folder: {
              type: "string",
              description: "'' for ungrouped only, '*' for all, or exact folder name.",
            },
            scene_ids: { type: "array", items: { type: "string" } },
            scene_prefix: { type: "string" },
            seeds: { type: "array", items: { type: "number" } },
            starred_only: { type: "boolean" },
            unstarred_only: { type: "boolean" },
            upscaled_only: { type: "boolean" },
            unupscaled_only: { type: "boolean" },
            checked_only: { type: "boolean" },
            selected_only: { type: "boolean" },
          },
        },
      },
      required: ["action"],
    },
  },
  {
    name: "nai_generate",
    description:
      "Trigger image generation directly inside the open NovelAI_Workbench.html webpage! Only call this when the user explicitly asks to generate/render an image on the webpage. When wait_for_result is true (default), waits for generation (and auto 2x upscale if enabled) and saves a local preview copy in outputs/_mcp_live_preview/ so you can inspect it.",
    inputSchema: {
      type: "object",
      properties: {
        scene_ids: {
          type: "array",
          items: { type: "string" },
          description:
            "Optional list of scene IDs (e.g. ['P22'] or ['MA10']). Omit to generate the currently active scene.",
        },
        count: {
          type: "number",
          description: "Number of images to generate per scene (1..8, defaults to webpage batch_count).",
        },
        force_random_seed: {
          type: "boolean",
          description: "Set true to force random seed (-1) even if webpage has a locked seed.",
        },
        target_folder: {
          type: "string",
          description:
            "Optional webpage folder name to automatically archive the generated images into (auto-created if it does not exist yet).",
        },
        wait_for_result: {
          type: "boolean",
          description: "Wait for generation to finish and return saved local_preview_path (default true).",
        },
      },
    },
  },
  {
    name: "nai_get_latest_image",
    description:
      "Fetch the currently selected, latest, or specified generated image from the open webpage's gallery into outputs/_mcp_live_preview/ so you can inspect it with read_file.",
    inputSchema: {
      type: "object",
      properties: {
        image_id: {
          type: "string",
          description: "Optional exact gallery image ID from nai_list_files.",
        },
        gallery_index: {
          type: "number",
          description: "Optional 0-based gallery index; omit for currently selected image.",
        },
      },
    },
  },
];

// ============================================================================
// MCP Stdio JSON-RPC 2.0 Server (Supports both Newline-JSON and Content-Length)
// ============================================================================
const hub = new BridgeHub();
let useContentLengthFraming = false;

function writeRpcMessage(obj: Record<string, unknown>): void {
  const json = JSON.stringify(obj);
  if (useContentLengthFraming) {
    const byteLen = Buffer.byteLength(json, "utf8");
    process.stdout.write(`Content-Length: ${byteLen}\r\n\r\n${json}`);
  } else {
    process.stdout.write(`${json}\n`);
  }
}

async function executeToolCall(
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  if (name === "nai_list_options") {
    return lookupPresetCatalog(String(args.category || "all"), String(args.query || ""));
  }
  if (name === "nai_get_state") {
    const state = (await hub.callBrowser("get_state", {})) as Record<string, unknown>;
    const snap = await hub.getBridgeSnapshot();
    return {
      ...state,
      bridge_access: {
        role: hub.getRole(),
        bind_host: BRIDGE_BIND_HOST,
        port: BRIDGE_PORT,
        local_url: `http://127.0.0.1:${BRIDGE_PORT}`,
        lan_urls: getLanUrls(),
        connected_clients: snap.connected_clients,
        active_client_url: snap.active_client_url,
        client_urls: snap.client_urls,
      },
    };
  }
  if (name === "nai_update_config") {
    return await hub.callBrowser("update_config", args);
  }
  if (name === "nai_set_manual_prompt") {
    return await hub.callBrowser("set_manual_prompt", args);
  }
  if (name === "nai_manage_presets") {
    return await hub.callBrowser("manage_presets", args);
  }
  if (name === "nai_manage_vibes") {
    const act = String(args.action || "list");
    if (act === "import_file") {
      const fp = String(args.file_path || "").trim();
      if (!fp || !fs.existsSync(fp)) {
        throw new Error(`Vibe 文件不存在: ${fp}`);
      }
      const rawBytes = fs.readFileSync(fp);
      return await hub.callBrowser(
        "manage_vibes",
        {
          action: "import_base64",
          base64: rawBytes.toString("base64"),
          filename: path.basename(fp),
          append: Boolean(args.append),
        },
        45000
      );
    }
    return await hub.callBrowser("manage_vibes", args);
  }
  if (name === "nai_list_files") {
    return await hub.callBrowser("list_files", args, 20000);
  }
  if (name === "nai_manage_files") {
    const isLong = String(args.action || "") === "upscale_images";
    return await hub.callBrowser("manage_files", args, isLong ? 300000 : 30000);
  }
  if (name === "nai_generate") {
    return await hub.callBrowser("trigger_generate", args, 180000);
  }
  if (name === "nai_get_latest_image") {
    return await hub.callBrowser("get_latest_image", args, 30000);
  }
  throw new Error(`Unknown MCP tool: ${name}`);
}

async function handleJsonRpcMessage(msg: Record<string, unknown>): Promise<void> {
  const id = msg.id;
  const method = String(msg.method || "");
  const params = (msg.params as Record<string, unknown> | undefined) ?? {};

  // Notifications have no id
  if (id === undefined || id === null) {
    return;
  }

  try {
    if (method === "initialize") {
      const clientProto = String(params.protocolVersion || "2024-11-05");
      writeRpcMessage({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: clientProto,
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: "nai-studio-bridge",
            version: "2.0.0",
          },
        },
      });
      return;
    }

    if (method === "ping") {
      writeRpcMessage({ jsonrpc: "2.0", id, result: {} });
      return;
    }

    if (method === "tools/list") {
      writeRpcMessage({
        jsonrpc: "2.0",
        id,
        result: {
          tools: MCP_TOOLS,
        },
      });
      return;
    }

    if (method === "tools/call") {
      const toolName = String(params.name || "");
      const toolArgs = (params.arguments as Record<string, unknown> | undefined) ?? {};
      try {
        const res = await executeToolCall(toolName, toolArgs);
        writeRpcMessage({
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify(res, null, 2),
              },
            ],
          },
        });
      } catch (toolErr) {
        writeRpcMessage({
          jsonrpc: "2.0",
          id,
          result: {
            isError: true,
            content: [
              {
                type: "text",
                text: toolErr instanceof Error ? toolErr.message : String(toolErr),
              },
            ],
          },
        });
      }
      return;
    }

    writeRpcMessage({
      jsonrpc: "2.0",
      id,
      error: {
        code: -32601,
        message: `Method not found: ${method}`,
      },
    });
  } catch (err) {
    writeRpcMessage({
      jsonrpc: "2.0",
      id,
      error: {
        code: -32603,
        message: err instanceof Error ? err.message : String(err),
      },
    });
  }
}

async function startStdioMcp(): Promise<void> {
  process.stdout.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EPIPE") {
      hub.close();
      process.exit(0);
    }
  });

  await hub.init();

  let stdinBuf: Buffer = Buffer.alloc(0);
  process.stdin.on("data", (chunk: Buffer) => {
    stdinBuf = Buffer.concat([stdinBuf, chunk]);

    while (stdinBuf.length > 0) {
      // Check for Content-Length header framing first
      const headerProbe = stdinBuf.subarray(0, Math.min(64, stdinBuf.length)).toString("ascii");
      if (headerProbe.startsWith("Content-Length:")) {
        useContentLengthFraming = true;
        const sepIdx = stdinBuf.indexOf("\r\n\r\n");
        if (sepIdx === -1) return;
        const headerStr = stdinBuf.subarray(0, sepIdx).toString("ascii");
        const m = /Content-Length:\s*(\d+)/i.exec(headerStr);
        if (!m) {
          stdinBuf = stdinBuf.subarray(sepIdx + 4);
          continue;
        }
        const bodyLen = parseInt(m[1], 10);
        const totalNeeded = sepIdx + 4 + bodyLen;
        if (stdinBuf.length < totalNeeded) return;
        const jsonStr = stdinBuf.subarray(sepIdx + 4, totalNeeded).toString("utf8");
        stdinBuf = stdinBuf.subarray(totalNeeded);
        try {
          const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
          void handleJsonRpcMessage(parsed);
        } catch {
          // ignore invalid json
        }
        continue;
      }

      // Standard MCP newline-delimited JSON framing
      const nlIdx = stdinBuf.indexOf(0x0a);
      if (nlIdx === -1) return;
      const lineStr = stdinBuf.subarray(0, nlIdx).toString("utf8").trim();
      stdinBuf = stdinBuf.subarray(nlIdx + 1);
      if (!lineStr) continue;
      try {
        const parsed = JSON.parse(lineStr) as Record<string, unknown>;
        void handleJsonRpcMessage(parsed);
      } catch {
        // ignore invalid json line
      }
    }
  });

  process.stdin.on("end", () => {
    hub.close();
    process.exit(0);
  });
}

void startStdioMcp();
