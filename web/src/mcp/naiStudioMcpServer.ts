import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import type { Socket } from "node:net";
import os from "node:os";
import path from "node:path";
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

const BRIDGE_BIND_HOST = process.env.NAI_STUDIO_BRIDGE_HOST || "0.0.0.0";
const LOCAL_RELAY_HOST = "127.0.0.1";
const BRIDGE_PORT = Number(process.env.NAI_STUDIO_BRIDGE_PORT || 17890);
const WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../../..");
const STANDALONE_HTML_PATH = path.join(REPO_ROOT, "NovelAI_Workbench.html");
const PREVIEW_DIR = path.join(REPO_ROOT, "outputs", "_mcp_live_preview");

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

  public async init(): Promise<void> {
    await new Promise<void>((resolve) => {
      const srv = http.createServer((req, res) => void this.handleHttp(req, res));
      srv.on("upgrade", (req, socket) => this.handleUpgrade(req, socket as Socket));
      srv.once("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EADDRINUSE") {
          this.role = "relay";
          resolve();
        } else {
          this.role = "relay";
          resolve();
        }
      });
      srv.listen(BRIDGE_PORT, BRIDGE_BIND_HOST, () => {
        this.role = "primary";
        this.httpServer = srv;
        this.startHeartbeat();
        resolve();
      });
    });
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

  private evictClient(cli: WsBrowserClient): void {
    this.clients = this.clients.filter((c) => c !== cli);
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
      this.clients = alive;
    }
    const locals: WsBrowserClient[] = [];
    const remotes: WsBrowserClient[] = [];
    for (let i = alive.length - 1; i >= 0; i--) {
      const c = alive[i];
      if (c.isLocalClient()) locals.push(c);
      else remotes.push(c);
    }
    return [...locals, ...remotes];
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
      const resp = await fetch(`http://${LOCAL_RELAY_HOST}:${BRIDGE_PORT}/health`);
      if (resp.ok) {
        const data = (await resp.json()) as {
          connected_clients?: number;
          latest_client_url?: string | null;
          client_urls?: string[];
        };
        return {
          connected_clients: data.connected_clients ?? 0,
          active_client_url: data.latest_client_url ?? null,
          client_urls: data.client_urls ?? [],
        };
      }
    } catch {
      // ignore
    }
    return { connected_clients: 0, active_client_url: null, client_urls: [] };
  }

  private setCors(res: http.ServerResponse): void {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
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
        fs.mkdirSync(PREVIEW_DIR, { recursive: true });
        const rawName = (reqUrl.searchParams.get("filename") || `preview_${Date.now()}.png`).replace(
          /[^a-zA-Z0-9._-]/g,
          "_"
        );
        const destPath = path.join(PREVIEW_DIR, rawName);
        fs.writeFileSync(destPath, buf);
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ ok: true, savedPath: destPath.replace(/\\/g, "/") }));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
        res.end(
          JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) })
        );
      }
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
      }
    );
    this.clients.push(client);
  }

  private onClientMessage(client: WsBrowserClient, msg: Record<string, unknown>): void {
    if (msg.type === "hello") {
      client.connectedUrl = String(msg.url || "");
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

      this.pending.set(reqId, { resolve, reject, timer });
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

    // For non-generation RPCs with multiple connected clients, fail over swiftly if a background/sleeping tab hangs
    const allowFailover = method !== "generate" && candidates.length > 1;
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
      return this.dispatchLocalBrowserRpc(method, params, timeoutMs);
    }

    // Relay mode: forward over loopback HTTP to the Primary Hub instance
    const resp = await fetch(`http://${LOCAL_RELAY_HOST}:${BRIDGE_PORT}/api/rpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method, params, timeoutMs }),
    });
    const data = (await resp.json()) as { ok: boolean; result?: unknown; error?: string };
    if (!data.ok) {
      throw new Error(data.error || "Relay RPC failed");
    }
    return data.result;
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
      "List exact built-in preset keys and pose IDs supported by NovelAI Studio 2.0 (styles, lighting, outfits, body, bust, anatomy, 51 poses P01~P51, MA0~MA10, etc.) before calling nai_update_config.",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description:
            "Category to inspect: 'all' | 'models' | 'canvases' | 'characters' | 'body' | 'bust' | 'skin' | 'outfits' | 'outfit_states' | 'legwear' | 'styles' | 'lighting' | 'env' | 'morph' | 'pubic' | 'pigment' | 'expressions' | 'pos_male_modes' | 'pos_stages' | 'pos_scenes' | 'poses' | 'multi_angle'",
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
      "Directly push configuration changes to the open NovelAI_Workbench.html webpage in real time. Supports updating any CharacterConfig field (char_tag, extra_char_tags, gender_mode: 'normal'|'femboy'|'futa_no_balls'|'futa_with_balls', body_preset, bust_preset, outfit_preset, custom_outfit_tags, outfit_state_mode, style_preset, lighting_preset, pos_stage, pos_male_mode, pos_scene, enable_condom, enable_uterus_xray, free_action_tags, free_action_prose, free_action_nsfw, etc.), NaiApiSettings (model, steps, scale, cfg_rescale, canvas_preset, seed, batch_count, auto_upscale_replace), action_mode ('positions' | 'multi_angle' | 'free'), and active_scene_id ('P01'..'P51' | 'MP01'..'MP15' | 'TN01'..'TN12' | 'BG01'..'BG20' | 'MA0'..'MA11' | 'MA7A'..'MA7E' | 'FREE').",
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
          enum: ["positions", "multi_angle", "free"],
          description: "Right-column action mode to switch to.",
        },
        active_scene_id: {
          type: "string",
          description: "Scene ID to activate, e.g. 'P22', 'MA10', or 'FREE'.",
        },
        checked_position_ids: {
          type: "array",
          items: { type: "string" },
          description: "Optional batch-checked position IDs.",
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
      "Fetch the currently selected (or latest) generated image from the open webpage's gallery into outputs/_mcp_live_preview/ so you can inspect it with read_file.",
    inputSchema: {
      type: "object",
      properties: {
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
