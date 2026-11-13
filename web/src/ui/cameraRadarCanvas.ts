export interface RadarState {
  enabled: boolean;
  azimuth: number;
  elevation: number;
}

export class CameraRadarCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private state: RadarState = { enabled: false, azimuth: 0, elevation: 12 };
  private dragTarget: "az" | "el" | null = null;
  private onChange: (next: RadarState) => void;
  private onReset: () => void;

  // Logical coordinate system (396 x 196)
  private readonly W = 396;
  private readonly H = 196;
  private readonly azCx = 104;
  private readonly azCy = 98;
  private readonly azR = 68;
  private readonly elCx = 276;
  private readonly elCy = 100;
  private readonly elR = 68;

  constructor(
    canvas: HTMLCanvasElement,
    onChange: (next: RadarState) => void,
    onReset: () => void
  ) {
    this.canvas = canvas;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("2D canvas context unavailable");
    this.ctx = context;
    this.onChange = onChange;
    this.onReset = onReset;
    this.setupHiDpi();
    this.bindEvents();
    this.render();
  }

  private setupHiDpi(): void {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    this.canvas.width = this.W * dpr;
    this.canvas.height = this.H * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  public setState(next: RadarState): void {
    this.state = { ...next };
    this.render();
  }

  private toLogicalXY(evt: PointerEvent | MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: ((evt.clientX - rect.left) / Math.max(1, rect.width)) * this.W,
      y: ((evt.clientY - rect.top) / Math.max(1, rect.height)) * this.H,
    };
  }

  private bindEvents(): void {
    this.canvas.addEventListener("pointerdown", (evt) => {
      if (evt.button === 2) return;
      const { x, y } = this.toLogicalXY(evt);
      this.canvas.setPointerCapture(evt.pointerId);
      this.dragTarget = x < 210 ? "az" : "el";
      this.updateFromPoint(x, y, evt.shiftKey);
    });

    this.canvas.addEventListener("pointermove", (evt) => {
      if (!this.dragTarget) return;
      const { x, y } = this.toLogicalXY(evt);
      this.updateFromPoint(x, y, evt.shiftKey);
    });

    const endDrag = (evt: PointerEvent) => {
      if (this.dragTarget) {
        this.dragTarget = null;
        if (this.canvas.hasPointerCapture(evt.pointerId)) {
          this.canvas.releasePointerCapture(evt.pointerId);
        }
      }
    };
    this.canvas.addEventListener("pointerup", endDrag);
    this.canvas.addEventListener("pointercancel", endDrag);

    this.canvas.addEventListener("contextmenu", (evt) => {
      evt.preventDefault();
      this.onReset();
    });
  }

  private updateFromPoint(x: number, y: number, snap15: boolean): void {
    let az = this.state.azimuth;
    let el = this.state.elevation;
    if (this.dragTarget === "az") {
      // Bottom = 0 deg (front), Right = +90, Left = -90, Top = +/-180 (back)
      const dx = x - this.azCx;
      const dy = y - this.azCy;
      let rawDeg = (Math.atan2(dx, dy) * 180) / Math.PI;
      if (snap15) {
        rawDeg = Math.round(rawDeg / 15) * 15;
      }
      az = Math.max(-180, Math.min(180, Math.round(rawDeg)));
    } else if (this.dragTarget === "el") {
      // Center-right semi-circle: +el upward, -el downward, +X toward camera at front
      const dx = Math.max(0.01, x - this.elCx);
      const dy = -(y - this.elCy);
      let rawEl = (Math.atan2(dy, dx) * 180) / Math.PI;
      if (snap15) {
        rawEl = Math.round(rawEl / 15) * 15;
      }
      el = Math.max(-80, Math.min(85, Math.round(rawEl)));
    }
    this.state = { enabled: true, azimuth: az, elevation: el };
    this.render();
    this.onChange({ ...this.state });
  }

  public render(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.W, this.H);

    // Background split divider
    ctx.strokeStyle = "#313244";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(208, 12);
    ctx.lineTo(208, this.H - 12);
    ctx.stroke();

    const activeColor = this.state.enabled ? "#a6e3a1" : "#7f849c";
    const coneFill = this.state.enabled ? "rgba(203, 166, 247, 0.22)" : "rgba(127, 132, 156, 0.12)";
    const accent = this.state.enabled ? "#cba6f7" : "#89b4fa";

    // ==========================
    // LEFT: Azimuth Circle
    // ==========================
    ctx.fillStyle = "#a6adc8";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🧭 水平环绕角 (Azimuth)", this.azCx, 15);

    // Outer rings
    ctx.strokeStyle = "#45475a";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(this.azCx, this.azCy, this.azR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#313244";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(this.azCx, this.azCy, this.azR * 0.55, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(this.azCx - this.azR, this.azCy);
    ctx.lineTo(this.azCx + this.azR, this.azCy);
    ctx.moveTo(this.azCx, this.azCy - this.azR);
    ctx.lineTo(this.azCx, this.azCy + this.azR);
    ctx.stroke();

    // Cardinal Labels (Bottom = 0° Front, Top = 180° Back)
    ctx.fillStyle = "#f9e2af";
    ctx.font = "10px sans-serif";
    ctx.fillText("后背 180°", this.azCx, this.azCy - this.azR - 5);
    ctx.fillStyle = "#89b4fa";
    ctx.fillText("正脸 0°", this.azCx, this.azCy + this.azR + 13);
    ctx.fillStyle = "#a6adc8";
    ctx.textAlign = "right";
    ctx.fillText("左-90°", this.azCx - this.azR - 4, this.azCy + 4);
    ctx.textAlign = "left";
    ctx.fillText("右+90°", this.azCx + this.azR + 4, this.azCy + 4);

    // Center character indicator (nose triangle pointing down toward front 0°)
    ctx.fillStyle = "#f5e0dc";
    ctx.beginPath();
    ctx.arc(this.azCx, this.azCy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(this.azCx - 4, this.azCy + 4);
    ctx.lineTo(this.azCx + 4, this.azCy + 4);
    ctx.lineTo(this.azCx, this.azCy + 11);
    ctx.closePath();
    ctx.fill();

    // Camera Dot & Frustum Cone on Azimuth circle
    const azRad = (this.state.azimuth * Math.PI) / 180;
    const camX = this.azCx + Math.sin(azRad) * this.azR;
    const camY = this.azCy + Math.cos(azRad) * this.azR;
    const spread = 0.28;
    ctx.fillStyle = coneFill;
    ctx.beginPath();
    ctx.moveTo(this.azCx, this.azCy);
    ctx.lineTo(
      this.azCx + Math.sin(azRad - spread) * this.azR,
      this.azCy + Math.cos(azRad - spread) * this.azR
    );
    ctx.lineTo(
      this.azCx + Math.sin(azRad + spread) * this.azR,
      this.azCy + Math.cos(azRad + spread) * this.azR
    );
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = activeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.azCx, this.azCy);
    ctx.lineTo(camX, camY);
    ctx.stroke();

    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(camX, camY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#11111b";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // ==========================
    // RIGHT: Pitch / Elevation Arc
    // ==========================
    ctx.fillStyle = "#a6adc8";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("📐 垂直俯仰弧 (Pitch)", 306, 15);

    // Semi-circular arc (-80° to +85°) on the right of (elCx, elCy)
    ctx.strokeStyle = "#45475a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.elCx, this.elCy, this.elR, (-85 * Math.PI) / 180, (80 * Math.PI) / 180);
    ctx.stroke();

    // Horizon line
    ctx.strokeStyle = "#313244";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.elCx - 16, this.elCy);
    ctx.lineTo(this.elCx + this.elR + 8, this.elCy);
    ctx.stroke();

    // Stylized Standing Silhouette at elCx
    ctx.fillStyle = "#585b70";
    ctx.beginPath();
    ctx.arc(this.elCx, this.elCy - 24, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(this.elCx - 4, this.elCy - 17, 8, 36);

    // Labels for top/horizon/bottom
    ctx.fillStyle = "#f9e2af";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("顶视 +85°", this.elCx + 6, this.elCy - this.elR - 2);
    ctx.fillStyle = "#a6adc8";
    ctx.fillText("平视 0°", this.elCx + this.elR + 5, this.elCy + 4);
    ctx.fillStyle = "#89b4fa";
    ctx.fillText("虫视 -80°", this.elCx + 6, this.elCy + this.elR + 10);

    // Elevation camera point
    const elRad = (this.state.elevation * Math.PI) / 180;
    const pCamX = this.elCx + Math.cos(elRad) * this.elR;
    const pCamY = this.elCy - Math.sin(elRad) * this.elR;

    ctx.strokeStyle = activeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.elCx, this.elCy - 6);
    ctx.lineTo(pCamX, pCamY);
    ctx.stroke();

    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(pCamX, pCamY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#11111b";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Bottom hint
    ctx.fillStyle = "#7f849c";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("左键拖拽调角（Shift 吸附15°） · 右键复位回随本幕默认", this.W / 2, this.H - 4);
  }
}
