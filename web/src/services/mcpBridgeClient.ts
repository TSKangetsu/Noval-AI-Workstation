export const MCP_BRIDGE_PORT = 17890;

export type McpBridgeStatus = "disabled" | "standby" | "connected";

export interface McpBridgeRpcRequest {
  type: "rpc_request";
  id: string;
  method: string;
  params?: Record<string, unknown>;
}

export interface McpBridgeRpcResponse {
  type: "rpc_response";
  id: string;
  ok: boolean;
  result?: unknown;
  error?: string;
}

export type McpCommandHandler = (
  method: string,
  params: Record<string, unknown>
) => Promise<unknown>;

export function resolveMcpEndpoints(customEndpoint = ""): {
  wsUrl: string;
  uploadUrl: string;
  displayHost: string;
} {
  const raw = customEndpoint.trim();
  if (raw) {
    // Full ws:// or wss:// or http:// or https:// URL, or bare host[:port]
    let wsProto = "ws:";
    let httpProto = "http:";
    let rest = raw;
    if (/^wss:\/\//i.test(raw)) {
      wsProto = "wss:";
      httpProto = "https:";
      rest = raw.slice(6);
    } else if (/^ws:\/\//i.test(raw)) {
      wsProto = "ws:";
      httpProto = "http:";
      rest = raw.slice(5);
    } else if (/^https:\/\//i.test(raw)) {
      wsProto = "wss:";
      httpProto = "https:";
      rest = raw.slice(8);
    } else if (/^http:\/\//i.test(raw)) {
      wsProto = "ws:";
      httpProto = "http:";
      rest = raw.slice(7);
    }

    const slashIdx = rest.indexOf("/");
    let hostPort = (slashIdx === -1 ? rest : rest.slice(0, slashIdx)).trim();
    const pathPart = slashIdx === -1 ? "" : rest.slice(slashIdx);
    if (hostPort && !hostPort.includes(":") && wsProto === "ws:") {
      hostPort = `${hostPort}:${MCP_BRIDGE_PORT}`;
    }
    const wsPath = pathPart && pathPart !== "/" ? pathPart : "/ws";
    return {
      wsUrl: `${wsProto}//${hostPort}${wsPath}`,
      uploadUrl: `${httpProto}//${hostPort}/bridge/upload-latest`,
      displayHost: hostPort,
    };
  }

  // Auto-detect from browser location when opened over LAN / remote HTTP(S)
  if (typeof window !== "undefined" && window.location) {
    const loc = window.location;
    if ((loc.protocol === "http:" || loc.protocol === "https:") && loc.hostname) {
      const isHttps = loc.protocol === "https:";
      const port = loc.port || String(MCP_BRIDGE_PORT);
      const hostPort = `${loc.hostname}:${port}`;
      return {
        wsUrl: `${isHttps ? "wss:" : "ws:"}//${hostPort}/ws`,
        uploadUrl: `${isHttps ? "https:" : "http:"}//${hostPort}/bridge/upload-latest`,
        displayHost: hostPort,
      };
    }
  }

  const fallback = `127.0.0.1:${MCP_BRIDGE_PORT}`;
  return {
    wsUrl: `ws://${fallback}/ws`,
    uploadUrl: `http://${fallback}/bridge/upload-latest`,
    displayHost: fallback,
  };
}

export class McpBridgeClient {
  private enabled: boolean;
  private customEndpoint: string;
  private status: McpBridgeStatus = "standby";
  private ws: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private onCommand: McpCommandHandler;
  private onStatusChange: (status: McpBridgeStatus) => void;
  private clientId = `wb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  private lifecycleBound = false;

  constructor(options: {
    enabled: boolean;
    customEndpoint?: string;
    onCommand: McpCommandHandler;
    onStatusChange: (status: McpBridgeStatus) => void;
  }) {
    this.enabled = options.enabled;
    this.customEndpoint = (options.customEndpoint || "").trim();
    this.onCommand = options.onCommand;
    this.onStatusChange = options.onStatusChange;
    this.bindLifecycleListeners();
  }

  private bindLifecycleListeners(): void {
    if (this.lifecycleBound || typeof window === "undefined" || typeof document === "undefined") {
      return;
    }
    this.lifecycleBound = true;
    const sendPresence = () => {
      this.sendJson({
        type: "presence",
        clientId: this.clientId,
        visible: document.visibilityState === "visible",
        focusedAt: Date.now(),
      });
    };
    document.addEventListener("visibilitychange", sendPresence);
    window.addEventListener("focus", sendPresence);
    const closeQuietly = () => {
      this.cleanupSocket();
    };
    window.addEventListener("beforeunload", closeQuietly);
    window.addEventListener("pagehide", closeQuietly);
  }

  public start(): void {
    if (!this.enabled) {
      this.updateStatus("disabled");
      return;
    }
    this.connect();
  }

  public setEnabled(next: boolean): void {
    this.enabled = next;
    if (!next) {
      this.cleanupSocket();
      this.updateStatus("disabled");
      return;
    }
    this.updateStatus("standby");
    this.connect();
  }

  public setCustomEndpoint(nextEndpoint: string): void {
    this.customEndpoint = nextEndpoint.trim();
    this.cleanupSocket();
    if (this.enabled) {
      this.updateStatus("standby");
      this.connect();
    }
  }

  public getCustomEndpoint(): string {
    return this.customEndpoint;
  }

  public getResolvedEndpoints(): { wsUrl: string; uploadUrl: string; displayHost: string } {
    return resolveMcpEndpoints(this.customEndpoint);
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public getStatus(): McpBridgeStatus {
    return this.status;
  }

  private updateStatus(next: McpBridgeStatus): void {
    if (this.status === next) return;
    this.status = next;
    this.onStatusChange(next);
  }

  private cleanupSocket(): void {
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }
  }

  private scheduleReconnect(): void {
    if (!this.enabled || this.reconnectTimer !== null) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      if (this.enabled) {
        this.connect();
      }
    }, 2600);
  }

  private connect(): void {
    if (!this.enabled || typeof WebSocket === "undefined") return;
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.cleanupSocket();
    const { wsUrl } = this.getResolvedEndpoints();
    let sock: WebSocket;
    try {
      sock = new WebSocket(wsUrl);
    } catch {
      this.updateStatus("standby");
      this.scheduleReconnect();
      return;
    }

    this.ws = sock;
    sock.onopen = () => {
      this.updateStatus("connected");
      this.sendJson({
        type: "hello",
        clientId: this.clientId,
        url: window.location.href,
        userAgent: navigator.userAgent,
        visible: typeof document !== "undefined" ? document.visibilityState === "visible" : true,
        focusedAt: Date.now(),
        connectedAt: Date.now(),
      });
    };

    sock.onmessage = (ev) => {
      if (typeof ev.data !== "string") return;
      let parsed: unknown;
      try {
        parsed = JSON.parse(ev.data);
      } catch {
        return;
      }
      if (!parsed || typeof parsed !== "object") return;
      const msg = parsed as Partial<McpBridgeRpcRequest>;
      if (msg.type === "rpc_request" && typeof msg.id === "string" && typeof msg.method === "string") {
        void this.handleRpc(msg.id, msg.method, (msg.params as Record<string, unknown>) || {});
      }
    };

    sock.onclose = () => {
      this.ws = null;
      if (this.enabled) {
        this.updateStatus("standby");
        this.scheduleReconnect();
      }
    };

    sock.onerror = () => {
      // Handled quietly in onclose
    };
  }

  private async handleRpc(
    id: string,
    method: string,
    params: Record<string, unknown>
  ): Promise<void> {
    try {
      const result = await this.onCommand(method, params);
      const resp: McpBridgeRpcResponse = {
        type: "rpc_response",
        id,
        ok: true,
        result,
      };
      this.sendJson(resp);
    } catch (err) {
      const resp: McpBridgeRpcResponse = {
        type: "rpc_response",
        id,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      };
      this.sendJson(resp);
    }
  }

  private sendJson(payload: unknown): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    try {
      this.ws.send(JSON.stringify(payload));
    } catch {
      // ignore
    }
  }

  public async uploadImageBytesToBridge(options: {
    filename: string;
    sceneId: string;
    seed: number;
    width: number;
    height: number;
    isUpscaled: boolean;
    bytes: Uint8Array;
  }): Promise<string | null> {
    try {
      const { uploadUrl } = this.getResolvedEndpoints();
      const copy = new Uint8Array(options.bytes.byteLength);
      copy.set(options.bytes);
      const query = new URLSearchParams({
        filename: options.filename,
        sceneId: options.sceneId,
        seed: String(options.seed),
        width: String(options.width),
        height: String(options.height),
        upscaled: options.isUpscaled ? "1" : "0",
      });
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 10000);
      try {
        const resp = await fetch(`${uploadUrl}?${query.toString()}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
          },
          body: new Blob([copy], { type: "image/png" }),
          signal: controller.signal,
        });
        if (!resp.ok) return null;
        const data = (await resp.json()) as { savedPath?: string };
        return data.savedPath ?? null;
      } finally {
        window.clearTimeout(timer);
      }
    } catch {
      return null;
    }
  }
}
