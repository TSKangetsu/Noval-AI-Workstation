import {
  ALL_POSITIONS_CHAPTERS,
  ALL_POSITIONS_TEMPLATES,
  BODY_PRESETS,
  BUILTIN_CHARACTERS,
  BUST_PRESETS,
  CANVAS_PRESETS,
  ENV_PRESETS,
  EXPRESSION_BLUSH_PRESETS,
  EXPRESSION_EYE_PRESETS,
  EXPRESSION_MOUTH_PRESETS,
  EXPRESSION_PRESETS,
  FREE_ACTION_STARTERS,
  LEGWEAR_PRESETS,
  LIGHTING_PRESETS,
  MODEL_V4_5_FULL,
  MODEL_V5_FULL,
  MODEL_V5_FULL_MEDIUM,
  MORPH_PRESETS,
  MULTI_ANGLE_CHAPTERS,
  MULTI_ANGLE_TEMPLATES,
  OUTFIT_PRESETS,
  OUTFIT_STATE_PRESETS,
  PIGMENT_PRESETS,
  POS_CATEGORIES,
  POS_MALE_MODE_PRESETS,
  POS_SCENE_PRESETS,
  POS_STAGE_PRESETS,
  PUBIC_PRESETS,
  resolveLightingForStyle,
  SKIN_PRESETS,
  STYLE_BUNDLED_VIBE_PACK,
  STYLE_PRESETS,
} from "../data/engineConstants";
import { BUNDLED_VIBE_PACKS, cloneBundledVibeItems } from "../data/bundledVibes";
import {
  describeExpressionShort,
  generateScenePrompts,
  isC5LowresPixelStyleActive,
  isExpressionOverrideActive,
} from "../engine/storyEngine";
import {
  buildFullNegativeString,
  computeSafePosTokenLimit,
  countSeparatedT5Tokens,
  initT5Tokenizer,
  mergePosAndNegToInline,
  splitPromptPosAndNeg,
} from "../engine/t5Tokenizer";
import {
  createDefaultCharacterConfig,
  type ActionMode,
  type CarouselMode,
  type CharacterConfig,
  type CharacterGenderMode,
  type GeneratedImageRecord,
  type NaiApiSettings,
  type NaiModelId,
  type NaiUcPresetMode,
  type ScenePromptItem,
  type StoredVibeItem,
  type SubscriptionInfo,
  type VibeTransferSlotInput,
} from "../engine/types";
import {
  detectImageExt,
  encodeVibeImageNai,
  estimateNaiAnlas,
  fetchSubscriptionInfo,
  generateSingleImageNai,
  parseCanvasSize,
  uint8ArrayToBase64,
  upscaleSingleImageNai,
} from "../services/naiApiClient";
import {
  McpBridgeClient,
  type McpBridgeStatus,
} from "../services/mcpBridgeClient";
import {
  buildStoreZipBlob,
  clearDeletedPresets,
  clearStoredVibeItems,
  formatDateYYYYMMDD,
  formatTimeHHMMSS,
  getMountedDirName,
  loadActiveConfig,
  loadApiSettings,
  loadCustomPresets,
  loadDeletedPresets,
  loadMcpBridgeEnabled,
  loadMcpBridgeEndpoint,
  loadStoredVibeItems,
  markPresetDeleted,
  mountLocalOutputDirectory,
  saveActiveConfig,
  saveApiSettings,
  saveBytesToMountedDir,
  saveCustomPresets,
  saveMcpBridgeEnabled,
  saveMcpBridgeEndpoint,
  saveStoredVibeItems,
  supportsDirectoryPicker,
  triggerBlobDownload,
  triggerBytesDownload,
  unmarkPresetDeleted,
  unmountLocalOutputDirectory,
} from "../services/storageService";
import {
  buildActiveVibeSlotsForModel,
  compactVibeThumbnailInBrowser,
  MAX_VIBE_SLOTS,
  parseVibeFileBytes,
  resolveVibeEncodingForModel,
} from "../services/vibeBundleParser";

function compactOptionText(raw: string, maxLen = 38): string {
  const cleaned = raw.replace(/（([^）]{18,})）/g, (_m, inner: string) => {
    const shortInner = inner.split("·")[0]?.trim() || inner.slice(0, 14);
    return ` (${shortInner})`;
  });
  return cleaned.length > maxLen ? `${cleaned.slice(0, maxLen - 1)}…` : cleaned;
}

function splitPoseTitle(fullTitle: string): { main: string; sub: string } {
  const stripped = fullTitle.replace(/^P\d+\s*·\s*/i, "").replace(/^\d+\s+/, "").trim();
  const m = /^(.+?)\s*\(([^)]+)\)\s*$/.exec(stripped);
  if (m) {
    return { main: m[1].trim(), sub: m[2].trim() };
  }
  const parts = stripped.split(" · ");
  if (parts.length >= 2) {
    return { main: parts[0].trim(), sub: parts.slice(1).join(" · ").trim() };
  }
  return { main: stripped, sub: "" };
}

export class WorkbenchApp {
  private root: HTMLElement;
  private cfg: CharacterConfig;
  private customPresets: Record<string, Partial<CharacterConfig>>;
  private apiSettings: NaiApiSettings;
  private subInfo: SubscriptionInfo | null = null;

  private actionMode: ActionMode = "positions";
  private activeSceneId = "P01";
  private activeMa7Variant: "" | "MA7A" | "MA7B" | "MA7C" | "MA7D" | "MA7E" = "";
  private activePosCategory = POS_CATEGORIES[0];
  private posSearchQuery = "";
  private checkedPositionIds = new Set<string>(["P01"]);
  private checkedMultiAngleIds = new Set<string>(["MA1"]);

  private currentSceneItems: ScenePromptItem[] = [];
  private isManualPromptEdited = false;
  private promptDrawerExpanded = false;
  private showCustomOutfitExtra = false;
  private checkerboardBg = false;
  private mobileCol: "left" | "center" | "right" = "center";

  private vibeItems: StoredVibeItem[] = [];
  private gallery: GeneratedImageRecord[] = [];
  private selectedGalleryIdx = -1;
  private checkedGalleryIds = new Set<string>();

  private isGenerating = false;
  private abortController: AbortController | null = null;
  private genTimerHandle: number | null = null;

  // Lightbox Carousel State (mutually exclusive modes)
  private lightboxOpen = false;
  private lightboxIdx = 0;
  private carouselMode: CarouselMode = "follow_latest";
  private carouselTimer: number | null = null;

  // Key DOM Refs
  private elPresetSelect!: HTMLSelectElement;
  private elDeletePresetBtn!: HTMLButtonElement;
  private elModelBtns = new Map<NaiModelId, HTMLButtonElement>();
  private elCanvasSelect!: HTMLSelectElement;
  private elSeedInput!: HTMLInputElement;
  private elBatchSelect!: HTMLSelectElement;
  private elMcpPill!: HTMLButtonElement;
  private elQuotaPill!: HTMLButtonElement;
  private elMountBtn!: HTMLButtonElement;
  private elHeroGenBtn!: HTMLButtonElement;
  private elStopGenBtn!: HTMLButtonElement;
  private mcpBridge!: McpBridgeClient;

  private elColLeft!: HTMLElement;
  private elColCenter!: HTMLElement;
  private elColRight!: HTMLElement;
  private elMobileBtns = new Map<string, HTMLButtonElement>();

  // Left Inspector Refs
  private elIdentityCard!: HTMLElement;
  private elIdentitySwitch!: HTMLButtonElement;
  private elIdentitySummary!: HTMLElement;
  private elOutfitCard!: HTMLElement;
  private elOutfitSwitch!: HTMLButtonElement;
  private elOutfitSummary!: HTMLElement;
  private elCustomOutfitWrap!: HTMLElement;
  private elAnatomyCard!: HTMLElement;
  private elAnatomySwitch!: HTMLButtonElement;
  private elAnatomySummary!: HTMLElement;
  private elStyleCard!: HTMLElement;
  private elStyleCardTitle!: HTMLElement;
  private elStyleSwitch!: HTMLButtonElement;
  private elStyleSummary!: HTMLElement;
  private elCustomStyleWrap!: HTMLElement;
  private elVibePanel!: HTMLElement;
  private elVibeSlotList!: HTMLElement;
  private elVibeStatusNote!: HTMLElement;
  private elVibeSwitch!: HTMLButtonElement;
  private elVibeNormChk!: HTMLInputElement;
  private elVibeNormWrap!: HTMLElement;
  private elScaleRange!: HTMLInputElement;
  private elScaleNum!: HTMLInputElement;
  private elRescaleRange!: HTMLInputElement;
  private elRescaleNum!: HTMLInputElement;
  private elApiCard!: HTMLElement;
  private elApiSummary!: HTMLElement;
  private elStepsRange!: HTMLInputElement;
  private elStepsNum!: HTMLInputElement;
  private elStepsHint!: HTMLElement;
  private elUcModeSelect!: HTMLSelectElement;

  // Center Stage Refs
  private elStageMeta!: HTMLElement;
  private elHeroViewport!: HTMLElement;
  private elProgressBanner!: HTMLElement;
  private elProgressText!: HTMLElement;
  private elFilmstripBar!: HTMLElement;
  private elFilmstripScroll!: HTMLElement;
  private elUpscaleBtn!: HTMLButtonElement;
  private elAutoUpscaleBtn!: HTMLButtonElement;
  private elAutoCarouselBtn!: HTMLButtonElement;

  // Prompt Drawer Refs
  private elPromptDrawer!: HTMLElement;
  private elDrawerToggleBtn!: HTMLButtonElement;
  private elPromptSceneLbl!: HTMLElement;
  private elTokenPill!: HTMLElement;
  private elManualLockPill!: HTMLElement;
  private elPosTextarea!: HTMLTextAreaElement;
  private elNegTextarea!: HTMLTextAreaElement;

  // Right Matrix Refs
  private elActionModeBtns = new Map<ActionMode, HTMLButtonElement>();
  private elContextCtrlBox!: HTMLElement;
  private elExprTrigger!: HTMLButtonElement;
  private elPoseFilterBar!: HTMLElement;
  private elPoseListWrap!: HTMLElement;
  private elFreeActionWrap!: HTMLElement;
  private elBatchCheckedBtn!: HTMLButtonElement;

  // Popovers & Lightbox
  private elMcpPopover!: HTMLElement;
  private elMcpEndpointInput!: HTMLInputElement;
  private elMcpPopSwitch!: HTMLButtonElement;
  private elMcpPopStatusNote!: HTMLElement;
  private elExprPopover!: HTMLElement;
  private elSavePresetPopover!: HTMLElement;
  private elSavePresetInput!: HTMLInputElement;
  private elLightbox!: HTMLElement;
  private elLightboxImg!: HTMLImageElement;
  private elLightboxMeta!: HTMLElement;
  private elLightboxModeBtns = new Map<CarouselMode, HTMLButtonElement>();

  // Syncable form bindings
  private syncHooks: Array<() => void> = [];

  constructor(root: HTMLElement) {
    this.root = root;
    this.cfg = loadActiveConfig();
    this.customPresets = loadCustomPresets();
    this.apiSettings = loadApiSettings();
    this.carouselMode = this.apiSettings.carousel_auto_mode || "follow_latest";
    this.showCustomOutfitExtra = Boolean(this.cfg.custom_outfit_tags.trim());
  }

  public async mount(): Promise<void> {
    initT5Tokenizer();
    this.vibeItems = await loadStoredVibeItems();
    // Auto-seed bundled Vibe pack if active preset or active style declares one and vibe list is empty
    const activePresetObj = this.customPresets[this.cfg.preset_name] as
      | Record<string, unknown>
      | undefined;
    const packId =
      (typeof activePresetObj?.bundled_vibe_pack === "string"
        ? activePresetObj.bundled_vibe_pack
        : "") ||
      STYLE_BUNDLED_VIBE_PACK[this.cfg.style_preset] ||
      "";
    if (packId && this.vibeItems.length === 0 && BUNDLED_VIBE_PACKS[packId]) {
      this.vibeItems = cloneBundledVibeItems(packId);
      await saveStoredVibeItems(this.vibeItems);
    }

    this.mcpBridge = new McpBridgeClient({
      enabled: loadMcpBridgeEnabled(),
      customEndpoint: loadMcpBridgeEndpoint(),
      onCommand: (method, params) => this.handleMcpCommand(method, params),
      onStatusChange: (st) => this.syncMcpPill(st),
    });
    this.buildLayout();
    this.bindGlobalEvents();
    this.syncAllControls();
    this.refreshSceneAndPrompt();

    this.mcpBridge.start();
    this.syncMcpPill(this.mcpBridge.getStatus());

    if (this.apiSettings.api_token.trim()) {
      void this.refreshSubscription(true);
    }
  }

  private el<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    className = "",
    text = ""
  ): HTMLElementTagNameMap[K] {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  private buildLayout(): void {
    this.root.innerHTML = "";

    // 1. Top Studio Bar
    this.root.appendChild(this.buildTopBar());

    // 2. Three-Column Workspace with Drag-Resizable Left & Right Dividers
    const ws = this.el("div", "studio-workspace");
    this.elColLeft = this.buildLeftColumn();
    this.elColCenter = this.buildCenterColumn();
    this.elColRight = this.buildRightColumn();
    const resizerLeft = this.el("div", "col-resizer resizer-left");
    resizerLeft.title = "拖动调节左侧栏宽度（双击重置）";
    const resizerRight = this.el("div", "col-resizer resizer-right");
    resizerRight.title = "拖动调节右侧栏宽度（双击重置）";
    ws.append(this.elColLeft, resizerLeft, this.elColCenter, resizerRight, this.elColRight);
    this.setupColumnResizers(ws, resizerLeft, resizerRight);
    this.root.appendChild(ws);

    // 3. Mobile Bottom Tab Bar (< 1120px)
    const mobileNav = this.el("nav", "mobile-col-nav");
    const mTabs: Array<["left" | "center" | "right", string]> = [
      ["left", "👤 人设·画风·Vibe"],
      ["center", "🖼️ 主画布·词条"],
      ["right", "🔞 动作库"],
    ];
    for (const [colKey, label] of mTabs) {
      const b = this.el("button", `btn btn-xs${this.mobileCol === colKey ? " btn-primary" : ""}`, label);
      b.addEventListener("click", () => {
        this.mobileCol = colKey;
        this.syncMobileColumns();
      });
      this.elMobileBtns.set(colKey, b);
      mobileNav.appendChild(b);
    }
    this.root.appendChild(mobileNav);

    // 4. Floating Popovers & Lightbox
    this.elMcpPopover = this.buildMcpPopover();
    this.elSavePresetPopover = this.buildSavePresetPopover();
    this.elExprPopover = this.buildExpressionPopover();
    this.elLightbox = this.buildLightbox();
    this.root.append(
      this.elMcpPopover,
      this.elSavePresetPopover,
      this.elExprPopover,
      this.elLightbox
    );

    this.syncMobileColumns();
  }

  private syncMobileColumns(): void {
    this.elColLeft.classList.toggle("mobile-active", this.mobileCol === "left");
    this.elColCenter.classList.toggle("mobile-active", this.mobileCol === "center");
    this.elColRight.classList.toggle("mobile-active", this.mobileCol === "right");
    for (const [k, btn] of this.elMobileBtns.entries()) {
      btn.classList.toggle("btn-primary", k === this.mobileCol);
    }
  }

  private setupColumnResizers(
    ws: HTMLElement,
    resizerLeft: HTMLElement,
    resizerRight: HTMLElement
  ): void {
    const LS_KEY = "nai_wb_col_widths_v1";
    const DEF_LEFT = 344;
    const DEF_RIGHT = 400;
    const MIN_LEFT = 260;
    const MAX_LEFT = 560;
    const MIN_RIGHT = 300;
    const MAX_RIGHT = 640;
    const MIN_CENTER = 260;

    let leftW = DEF_LEFT;
    let rightW = DEF_RIGHT;
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY) || "null") as {
        left?: number;
        right?: number;
      } | null;
      if (saved) {
        if (typeof saved.left === "number" && Number.isFinite(saved.left)) {
          leftW = Math.max(MIN_LEFT, Math.min(MAX_LEFT, Math.round(saved.left)));
        }
        if (typeof saved.right === "number" && Number.isFinite(saved.right)) {
          rightW = Math.max(MIN_RIGHT, Math.min(MAX_RIGHT, Math.round(saved.right)));
        }
      }
    } catch {
      // ignore storage errors
    }

    const applyWidths = (persist = false): void => {
      const total = ws.clientWidth || window.innerWidth;
      if (total > 1120) {
        const maxLeftAllowed = Math.max(MIN_LEFT, Math.min(MAX_LEFT, total - rightW - MIN_CENTER - 10));
        leftW = Math.max(MIN_LEFT, Math.min(maxLeftAllowed, leftW));
        const maxRightAllowed = Math.max(MIN_RIGHT, Math.min(MAX_RIGHT, total - leftW - MIN_CENTER - 10));
        rightW = Math.max(MIN_RIGHT, Math.min(maxRightAllowed, rightW));
      }
      ws.style.setProperty("--col-left-w", `${leftW}px`);
      ws.style.setProperty("--col-right-w", `${rightW}px`);
      if (persist) {
        try {
          localStorage.setItem(LS_KEY, JSON.stringify({ left: leftW, right: rightW }));
        } catch {
          // ignore
        }
      }
    };
    applyWidths(false);

    const bindDrag = (handle: HTMLElement, side: "left" | "right"): void => {
      handle.addEventListener("dblclick", () => {
        if (side === "left") leftW = DEF_LEFT;
        else rightW = DEF_RIGHT;
        applyWidths(true);
      });
      handle.addEventListener("pointerdown", (ev: PointerEvent) => {
        ev.preventDefault();
        handle.setPointerCapture(ev.pointerId);
        handle.classList.add("dragging");
        ws.classList.add("is-resizing");
        const startX = ev.clientX;
        const startLeft = leftW;
        const startRight = rightW;

        const onMove = (moveEv: PointerEvent): void => {
          const dx = moveEv.clientX - startX;
          if (side === "left") {
            leftW = Math.max(MIN_LEFT, Math.min(MAX_LEFT, Math.round(startLeft + dx)));
          } else {
            rightW = Math.max(MIN_RIGHT, Math.min(MAX_RIGHT, Math.round(startRight - dx)));
          }
          applyWidths(false);
        };
        const onUp = (upEv: PointerEvent): void => {
          handle.releasePointerCapture(upEv.pointerId);
          handle.classList.remove("dragging");
          ws.classList.remove("is-resizing");
          handle.removeEventListener("pointermove", onMove);
          handle.removeEventListener("pointerup", onUp);
          handle.removeEventListener("pointercancel", onUp);
          applyWidths(true);
        };
        handle.addEventListener("pointermove", onMove);
        handle.addEventListener("pointerup", onUp);
        handle.addEventListener("pointercancel", onUp);
      });
    };

    bindDrag(resizerLeft, "left");
    bindDrag(resizerRight, "right");
    window.addEventListener("resize", () => applyWidths(false));
  }

  // ===========================================================================
  // TOP STUDIO BAR
  // ===========================================================================
  private buildTopBar(): HTMLElement {
    const bar = this.el("header", "studio-topbar");

    // Left: Brand + Character Preset Selector + Save/Delete/Reset
    const gLeft = this.el("div", "topbar-group topbar-group-left");
    gLeft.appendChild(this.el("div", "brand-badge", "✨ NAI Studio 2.0"));

    this.elPresetSelect = this.el("select", "preset-select-main");
    this.elPresetSelect.title = "切换角色预设（支持内置含Vibe特调预设与自定义保存预设）";
    this.populatePresetSelect();
    this.elPresetSelect.addEventListener("change", () => {
      void this.applySelectedCharacterPreset(this.elPresetSelect.value);
    });

    const btnSavePreset = this.el("button", "btn btn-icon", "💾");
    btnSavePreset.title = "将当前人设、穿搭、画风等保存为自定义预设";
    btnSavePreset.addEventListener("click", (ev) => {
      ev.stopPropagation();
      this.togglePopover(this.elSavePresetPopover, btnSavePreset);
      this.elSavePresetInput.value = this.cfg.preset_name.startsWith("⭐ ")
        ? this.cfg.preset_name.replace(/^⭐\s*/, "")
        : `${this.cfg.eng_name || "角色"} 特调`;
      this.elSavePresetInput.focus();
      this.elSavePresetInput.select();
    });

    this.elDeletePresetBtn = this.el("button", "btn btn-icon", "🗑️");
    this.elDeletePresetBtn.title = "删除当前下拉框选中的角色预设（刷新不复活；Shift+点击右侧 ↺ 可恢复出厂预设列表）";
    this.elDeletePresetBtn.addEventListener("click", () => {
      const cur = this.elPresetSelect.value || this.cfg.preset_name;
      if (!cur) return;
      void this.deletePresetByKey(cur);
    });

    const btnResetAll = this.el("button", "btn btn-icon", "↺");
    btnResetAll.title = "点击：重置当前面板为默认配置；按住 Shift 点击：恢复全部已删除的出厂角色预设";
    btnResetAll.addEventListener("click", (ev) => {
      if (ev.shiftKey) {
        this.restoreFactoryPresets();
        return;
      }
      this.cfg = createDefaultCharacterConfig();
      saveActiveConfig(this.cfg);
      this.isManualPromptEdited = false;
      this.populatePresetSelect();
      this.syncAllControls();
      this.refreshSceneAndPrompt();
      this.setStatus("↺ 已恢复默认角色与画风参数（提示：Shift+点击 ↺ 可恢复已删出厂预设）");
    });

    gLeft.append(this.elPresetSelect, btnSavePreset, this.elDeletePresetBtn, btnResetAll);

    // Center: Model Segmented Pills + Canvas + Seed + Batch
    const gCenter = this.el("div", "topbar-group topbar-group-center");
    const modelSeg = this.el("div", "seg-group");
    const models: Array<[NaiModelId, string, string]> = [
      [MODEL_V4_5_FULL, "♾️ V4.5 Full", "Opus 标准尺寸 28步真正无限 0 Anlas · 原生支持 Vibe Transfer"],
      [MODEL_V5_FULL, "🔥 V5 High", "V5 Full High 28步 · 全题材独立负向 UC · Opus 走恢复池"],
      [MODEL_V5_FULL_MEDIUM, "⚡ V5 Med", "V5 Full Medium 14步极速 · 省约 42% V5 恢复池额度"],
    ];
    this.elModelBtns.clear();
    for (const [mId, lbl, tip] of models) {
      const b = this.el("button", "seg-btn", lbl);
      b.title = tip;
      b.addEventListener("click", () => this.setModel(mId));
      this.elModelBtns.set(mId, b);
      modelSeg.appendChild(b);
    }

    this.elCanvasSelect = this.el("select", "topbar-canvas-select");
    this.elCanvasSelect.title = "画幅尺寸选择";
    const canvasLabels: Record<string, string> = {
      "🔄 自动跟随本幕推荐画布": "🔄 画幅随动作",
      "📱 竖图 832x1216 (标准 Portrait)": "📱 竖 832×1216",
      "🖥️ 横图 1216x832 (标准 Landscape)": "🖥️ 横 1216×832",
      "⬛ 方图 1024x1024 (标准 Square)": "⬛ 方 1024×1024",
    };
    for (const key of Object.keys(CANVAS_PRESETS)) {
      const opt = this.el("option", "", canvasLabels[key] || key);
      opt.value = key;
      this.elCanvasSelect.appendChild(opt);
    }
    this.elCanvasSelect.addEventListener("change", () => {
      this.apiSettings.canvas_preset = this.elCanvasSelect.value;
      saveApiSettings(this.apiSettings);
      this.updateQuotaPill();
    });

    const seedBox = this.el("div", "seed-box");
    seedBox.appendChild(this.el("span", "seed-box-lbl", "Seed"));
    this.elSeedInput = this.el("input") as HTMLInputElement;
    this.elSeedInput.type = "number";
    this.elSeedInput.placeholder = "-1 随机";
    this.elSeedInput.title = "-1 表示每次随机生成新 Seed；填入正整数则固定 Seed";
    this.elSeedInput.addEventListener("change", () => {
      const v = parseInt(this.elSeedInput.value, 10);
      this.apiSettings.seed = Number.isFinite(v) && v > 0 ? v : -1;
      this.elSeedInput.value = String(this.apiSettings.seed);
      saveApiSettings(this.apiSettings);
    });
    const btnRandSeed = this.el("button", "btn btn-xs btn-icon", "🎲");
    btnRandSeed.title = "恢复每次随机 Seed (-1)";
    btnRandSeed.addEventListener("click", () => {
      this.apiSettings.seed = -1;
      this.elSeedInput.value = "-1";
      saveApiSettings(this.apiSettings);
    });
    const btnLockLastSeed = this.el("button", "btn btn-xs btn-icon", "📌");
    btnLockLastSeed.title = "锁定当前预览画布图片的 Seed";
    btnLockLastSeed.addEventListener("click", () => {
      const curRec = this.gallery[this.selectedGalleryIdx];
      if (!curRec) {
        this.setStatus("⚠️ 当前画廊暂无已生成图片可锁 Seed", true);
        return;
      }
      this.apiSettings.seed = curRec.seed;
      this.elSeedInput.value = String(curRec.seed);
      saveApiSettings(this.apiSettings);
      this.setStatus(`📌 已锁定 Seed: ${curRec.seed}`);
    });
    seedBox.append(this.elSeedInput, btnRandSeed, btnLockLastSeed);

    this.elBatchSelect = this.el("select", "batch-select");
    this.elBatchSelect.title = "每次点击生图连续抽取的张数";
    for (const n of [1, 2, 3, 4, 6, 8]) {
      const opt = this.el("option", "", `连抽 ${n}×`);
      opt.value = String(n);
      this.elBatchSelect.appendChild(opt);
    }
    this.elBatchSelect.addEventListener("change", () => {
      this.apiSettings.batch_count = Math.max(1, Math.min(8, parseInt(this.elBatchSelect.value, 10) || 1));
      saveApiSettings(this.apiSettings);
      this.updateQuotaPill();
    });

    gCenter.append(modelSeg, this.elCanvasSelect, seedBox, this.elBatchSelect);

    // Right: MCP Bridge Pill + Quota Pill + Folder Mount + Hero Generate / Stop
    const gRight = this.el("div", "topbar-group topbar-group-right");
    this.elMcpPill = this.el("button", "mcp-pill");
    this.elMcpPill.title = "MCP 实时控制桥（支持本机与局域网/远程连接）：点击设置服务器地址或开关";
    this.elMcpPill.addEventListener("click", (ev) => {
      ev.stopPropagation();
      this.elMcpEndpointInput.value = this.mcpBridge.getCustomEndpoint();
      this.syncMcpPill(this.mcpBridge.getStatus());
      this.togglePopover(this.elMcpPopover, this.elMcpPill);
    });

    this.elQuotaPill = this.el("button", "quota-pill", "🔑 未设Token");
    this.elQuotaPill.title = "点击查看/刷新 API Token 与账户点数状态";
    this.elQuotaPill.addEventListener("click", () => {
      this.elApiCard.classList.remove("collapsed");
      this.mobileCol = "left";
      this.syncMobileColumns();
      this.elApiCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
      if (this.apiSettings.api_token.trim()) {
        void this.refreshSubscription(false);
      }
    });

    this.elMountBtn = this.el("button", "btn", "📂 挂载目录");
    this.elMountBtn.title = "授权本地文件夹后，每张出图与 2x 放大图将自动按日期子目录落盘保存";
    if (!supportsDirectoryPicker()) {
      this.elMountBtn.style.display = "none";
    }
    this.elMountBtn.addEventListener("click", async () => {
      if (getMountedDirName()) {
        unmountLocalOutputDirectory();
        this.syncMountButton();
        this.setStatus("📂 已断开本地自动保存目录");
        return;
      }
      try {
        const name = await mountLocalOutputDirectory();
        this.syncMountButton();
        this.setStatus(`📂 已挂载本地输出目录：${name}（新生成图片将自动落盘）`);
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          this.setStatus(`⚠️ 挂载目录取消或失败：${err.message}`, true);
        }
      }
    });

    this.elHeroGenBtn = this.el("button", "btn btn-generate-hero", "🚀 立即生图");
    this.elHeroGenBtn.addEventListener("click", () => {
      const targetId = this.actionMode === "free" ? "FREE" : this.activeSceneId;
      const count = this.apiSettings.batch_count || 1;
      const queue = Array.from({ length: count }, () => ({
        sceneId: targetId,
        useManualPrompt: this.isManualPromptEdited,
      }));
      void this.runGenerationQueue(queue);
    });

    this.elStopGenBtn = this.el("button", "btn btn-danger", "⏹ 停止");
    this.elStopGenBtn.style.display = "none";
    this.elStopGenBtn.addEventListener("click", () => {
      if (this.abortController) {
        this.abortController.abort();
      }
    });

    gRight.append(this.elMcpPill, this.elQuotaPill, this.elMountBtn, this.elHeroGenBtn, this.elStopGenBtn);
    bar.append(gLeft, gCenter, gRight);
    return bar;
  }

  private syncMcpPill(status: McpBridgeStatus): void {
    if (!this.elMcpPill) return;
    this.elMcpPill.className = "mcp-pill";
    this.elMcpPill.innerHTML = "";
    const dot = this.el("span", "mcp-dot");
    const resolved = this.mcpBridge.getResolvedEndpoints();
    let txt = "MCP 待机";
    if (status === "connected") {
      this.elMcpPill.classList.add("connected");
      txt = "MCP 已连";
    } else if (status === "disabled") {
      this.elMcpPill.classList.add("disabled");
      txt = "MCP 已关";
    }
    this.elMcpPill.append(dot, this.el("span", "", txt));

    if (this.elMcpPopSwitch) {
      const on = this.mcpBridge.isEnabled();
      this.elMcpPopSwitch.classList.toggle("on", on);
      this.elMcpPopSwitch.textContent = on ? "已启用 ON" : "已暂停 OFF";
    }
    if (this.elMcpPopStatusNote) {
      this.elMcpPopStatusNote.textContent =
        status === "connected"
          ? `🟢 已连接至 ${resolved.wsUrl}`
          : status === "disabled"
            ? "⏸️ MCP 远程控制已暂停"
            : `⚪ 待机重连中：${resolved.wsUrl}`;
    }
  }

  private getAvailableBuiltinKeys(): string[] {
    const deleted = loadDeletedPresets();
    return Object.keys(BUILTIN_CHARACTERS).filter((k) => !deleted.has(k));
  }

  private getAllAvailablePresetKeys(): string[] {
    return [...Object.keys(this.customPresets), ...this.getAvailableBuiltinKeys()];
  }

  private async deletePresetByKey(targetKey: string): Promise<boolean> {
    const allBefore = this.getAllAvailablePresetKeys();
    if (!allBefore.includes(targetKey)) return false;
    if (allBefore.length <= 1) {
      this.setStatus("⚠️ 至少需保留 1 个预设（Shift+点击 ↺ 可恢复出厂预设列表）", true);
      return false;
    }

    const prevIdx = allBefore.indexOf(targetKey);
    if (targetKey in this.customPresets) {
      delete this.customPresets[targetKey];
      saveCustomPresets(this.customPresets);
    }
    markPresetDeleted(targetKey);
    this.customPresets = loadCustomPresets();

    const remaining = this.getAllAvailablePresetKeys();
    const nextKey = remaining[Math.min(prevIdx, remaining.length - 1)] || remaining[0];
    this.populatePresetSelect();
    if (nextKey) {
      await this.applySelectedCharacterPreset(nextKey);
    }
    this.setStatus(`🗑️ 已删除预设「${compactOptionText(targetKey, 28)}」`);
    return true;
  }

  private restoreFactoryPresets(): void {
    clearDeletedPresets();
    this.customPresets = loadCustomPresets();
    this.populatePresetSelect();
    this.syncAllControls();
    this.setStatus("✨ 已恢复全部被删除的出厂角色与特调预设");
  }

  private populatePresetSelect(): void {
    if (!this.elPresetSelect) return;
    this.elPresetSelect.innerHTML = "";
    const customKeys = Object.keys(this.customPresets);
    if (customKeys.length > 0) {
      const grpCustom = document.createElement("optgroup");
      grpCustom.label = "⭐ 特调 / 自定义角色预设";
      for (const k of customKeys) {
        const opt = this.el("option", "", compactOptionText(k, 36));
        opt.value = k;
        opt.title = k;
        grpCustom.appendChild(opt);
      }
      this.elPresetSelect.appendChild(grpCustom);
    }

    const builtinKeys = this.getAvailableBuiltinKeys();
    if (builtinKeys.length > 0) {
      const grpBuiltin = document.createElement("optgroup");
      grpBuiltin.label = "👤 内置角色模板";
      for (const k of builtinKeys) {
        const opt = this.el("option", "", compactOptionText(k, 36));
        opt.value = k;
        opt.title = k;
        grpBuiltin.appendChild(opt);
      }
      this.elPresetSelect.appendChild(grpBuiltin);
    }

    const allKeys = [...customKeys, ...builtinKeys];
    if (allKeys.includes(this.cfg.preset_name)) {
      this.elPresetSelect.value = this.cfg.preset_name;
    } else if (allKeys.length > 0) {
      this.cfg.preset_name = allKeys[0];
      this.elPresetSelect.value = allKeys[0];
    }
    if (this.elDeletePresetBtn) {
      this.elDeletePresetBtn.disabled = allKeys.length <= 1;
    }
  }

  private async injectBundledVibePack(packId: string, switchToV45: boolean): Promise<void> {
    const pack = BUNDLED_VIBE_PACKS[packId];
    if (!pack) return;
    this.vibeItems = cloneBundledVibeItems(packId);
    await saveStoredVibeItems(this.vibeItems);
    if (switchToV45) {
      this.apiSettings.model = MODEL_V4_5_FULL;
    }
    this.apiSettings.vibe_transfer_enabled = true;
    this.apiSettings.vibe_normalize_strength = pack.normalizeStrength;
    if (this.apiSettings.model === MODEL_V4_5_FULL) {
      this.apiSettings.scale = pack.recommendedScale;
      this.apiSettings.cfg_rescale = pack.recommendedRescale;
    }
    saveApiSettings(this.apiSettings);
  }

  private async applySelectedCharacterPreset(key: string): Promise<void> {
    this.isManualPromptEdited = false;
    if (key in this.customPresets) {
      const rawP = this.customPresets[key] as Record<string, unknown>;
      const base = createDefaultCharacterConfig();
      const mergedCfg: CharacterConfig = {
        ...base,
        ...(rawP as Partial<CharacterConfig>),
        preset_name: key,
        wb_v2_migrated: true,
      };
      delete (mergedCfg as unknown as Record<string, unknown>).eye_color;
      delete (mergedCfg as unknown as Record<string, unknown>).hair_tags;
      this.cfg = mergedCfg;
      saveActiveConfig(this.cfg);

      const packId =
        (typeof rawP.bundled_vibe_pack === "string" ? rawP.bundled_vibe_pack : "") ||
        STYLE_BUNDLED_VIBE_PACK[this.cfg.style_preset] ||
        "";
      if (packId && BUNDLED_VIBE_PACKS[packId]) {
        const pack = BUNDLED_VIBE_PACKS[packId];
        await this.injectBundledVibePack(packId, true);
        this.populatePresetSelect();
        this.syncAllControls();
        this.refreshSceneAndPrompt();
        this.setStatus(
          `🧬 已载入「${compactOptionText(key, 28)}」并自动添加内置 ${this.vibeItems.length} 槽 Vibe (V4.5 · DPM++ 2M · Scale ${pack.recommendedScale})`
        );
        return;
      }

      this.populatePresetSelect();
      this.syncAllControls();
      this.refreshSceneAndPrompt();
      this.setStatus(`⭐ 已载入角色预设：${compactOptionText(key, 32)}`);
      return;
    }

    const b = BUILTIN_CHARACTERS[key];
    if (b) {
      this.cfg.preset_name = key;
      this.cfg.char_tag = b.char_tag || "";
      this.cfg.eng_name = b.eng_name || "the girl";
      this.cfg.extra_char_tags = "";
      this.cfg.canon_neg_tags = b.canon_neg_tags || "";
      if (b.body_preset) this.cfg.body_preset = b.body_preset;
      if (b.bust_preset) this.cfg.bust_preset = b.bust_preset;
      saveActiveConfig(this.cfg);
      this.populatePresetSelect();
      this.syncAllControls();
      this.refreshSceneAndPrompt();
      this.setStatus(`👤 已切换角色：${key}`);
    }
  }

  // ===========================================================================
  // LEFT COLUMN: SINGLE-STREAM INSPECTOR (5 CLEAN ACCORDION CARDS)
  // ===========================================================================
  private createInspectorCard(options: {
    title: string;
    collapsed?: boolean;
    onToggleSwitch?: () => void;
    extraHeaderEl?: HTMLElement;
  }): {
    card: HTMLElement;
    body: HTMLElement;
    titleEl: HTMLElement;
    summaryEl: HTMLElement;
    switchBtn?: HTMLButtonElement;
  } {
    const card = this.el("section", `insp-card${options.collapsed ? " collapsed" : ""}`);
    const head = this.el("div", "insp-head");
    const titleWrap = this.el("div", "insp-title-wrap");
    const caret = this.el("span", "insp-caret", "▾");
    const titleEl = this.el("span", "insp-title", options.title);
    const summaryEl = this.el("span", "insp-summary", "");
    titleWrap.append(caret, titleEl, summaryEl);

    const actions = this.el("div", "insp-head-actions");
    if (options.extraHeaderEl) {
      actions.appendChild(options.extraHeaderEl);
    }
    let switchBtn: HTMLButtonElement | undefined;
    if (options.onToggleSwitch) {
      switchBtn = this.el("button", "switch-pill on", "ON");
      switchBtn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        options.onToggleSwitch!();
      });
      actions.appendChild(switchBtn);
    }

    head.append(titleWrap, actions);
    head.addEventListener("click", () => {
      card.classList.toggle("collapsed");
    });

    const body = this.el("div", "insp-body");
    card.append(head, body);
    return { card, body, titleEl, summaryEl, switchBtn };
  }

  private bindCfgText(
    label: string,
    key: keyof CharacterConfig,
    placeholder = ""
  ): HTMLElement {
    const row = this.el("div", "field-row");
    row.appendChild(this.el("label", "", label));
    const inp = this.el("input") as HTMLInputElement;
    inp.type = "text";
    inp.placeholder = placeholder;
    inp.addEventListener("input", () => {
      (this.cfg[key] as unknown as string) = inp.value;
      this.onCfgChanged();
    });
    this.syncHooks.push(() => {
      const v = String(this.cfg[key] ?? "");
      if (inp.value !== v) inp.value = v;
    });
    row.appendChild(inp);
    return row;
  }

  private bindCfgSelect(
    label: string,
    key: keyof CharacterConfig,
    options: string[],
    onAfterChange?: () => void
  ): HTMLElement {
    const row = this.el("div", "field-row");
    row.appendChild(this.el("label", "", label));
    const sel = this.el("select");
    for (const optKey of options) {
      const opt = this.el("option", "", compactOptionText(optKey, 40));
      opt.value = optKey;
      opt.title = optKey;
      sel.appendChild(opt);
    }
    sel.addEventListener("change", () => {
      (this.cfg[key] as unknown as string) = sel.value;
      onAfterChange?.();
      this.onCfgChanged();
    });
    this.syncHooks.push(() => {
      const cur = String(this.cfg[key] ?? "");
      if (options.includes(cur)) {
        sel.value = cur;
      }
      sel.title = cur;
    });
    row.appendChild(sel);
    return row;
  }

  private buildLeftColumn(): HTMLElement {
    const col = this.el("aside", "studio-col col-left");

    // --- CARD 1: CHARACTER IDENTITY & BODY (Always collapsed on open) ---
    const c1 = this.createInspectorCard({
      title: "👤 人设与体型",
      collapsed: true,
      onToggleSwitch: () => {
        const next = !this.cfg.enable_identity;
        this.cfg.enable_identity = next;
        this.cfg.enable_body = next;
        this.onCfgChanged();
      },
    });
    this.elIdentityCard = c1.card;
    this.elIdentitySwitch = c1.switchBtn!;
    this.elIdentitySummary = c1.summaryEl;

    const idGrid = this.el("div", "grid-2");
    idGrid.append(
      this.bindCfgText("角色 Tag", "char_tag", "如 javelin (azur lane)"),
      this.bindCfgText("英文名 (T5句主语)", "eng_name", "如 Javelin")
    );
    c1.body.append(
      idGrid,
      this.bindCfgText(
        "额外常驻人物 Tag (自定义瞳色/发型/头饰/特征)",
        "extra_char_tags",
        "如 aqua eyes, short purple hair, mole under eye..."
      ),
      this.bindCfgSelect("体型骨架", "body_preset", Object.keys(BODY_PRESETS))
    );

    const bodyGrid = this.el("div", "grid-2");
    bodyGrid.append(
      this.bindCfgSelect("胸围尺寸", "bust_preset", Object.keys(BUST_PRESETS)),
      this.bindCfgSelect("肤质光泽", "skin_preset", Object.keys(SKIN_PRESETS))
    );
    c1.body.appendChild(bodyGrid);

    const genderRow = this.el("div", "field-row");
    genderRow.appendChild(
      this.el("label", "", "性别形态（互斥切换 · 自动清冲突词与防过大锁）")
    );
    const genderChips = this.el("div", "chip-wrap");
    const genderModes: Array<[CharacterGenderMode, string, string]> = [
      ["normal", "👩 常规女主", "标准女性角色设定"],
      ["femboy", "🎀 伪娘", "平胸女装少年 (1boy/2boys, yaoi, anal · 自动屏蔽胸部/女阴/子宫透视)"],
      ["futa_no_balls", "⚡ 扶他·无蛋", "双性女体·无蛋娇小比例 (保留女胸与双通道，屏蔽蛋蛋与过大词)"],
      ["futa_with_balls", "⚡ 扶他·有蛋", "双性女体·有蛋娇小比例 (保留女胸与双通道，防过大比例锁)"],
    ];
    for (const [gVal, gLbl, gTip] of genderModes) {
      const btn = this.el("button", "chip-btn", gLbl);
      btn.title = gTip;
      btn.addEventListener("click", () => {
        this.cfg.gender_mode = gVal;
        this.onCfgChanged();
        this.renderRightModeView();
      });
      this.syncHooks.push(() => {
        btn.classList.toggle("active", (this.cfg.gender_mode ?? "normal") === gVal);
      });
      genderChips.appendChild(btn);
    }
    genderRow.appendChild(genderChips);
    c1.body.appendChild(genderRow);

    const subMoreChar = this.el("details", "sub-drawer");
    subMoreChar.appendChild(this.el("summary", "", "▸ 萌点配饰胶囊 & 原设服装屏蔽词"));
    const subMoreBody = this.el("div", "sub-drawer-body");
    const accWrap = this.el("div", "chip-wrap");
    const accDefs: Array<[keyof CharacterConfig, string]> = [
      ["add_cat_ears", "🐱 猫耳猫尾"],
      ["add_horns_tail", "😈 恶魔角尾"],
      ["add_glasses", "👓 眼镜"],
      ["add_choker", "🖤 颈环"],
      ["add_extra_sweat", "💦 微汗蒸汽"],
    ];
    for (const [k, lbl] of accDefs) {
      const chip = this.el("button", "chip-btn", lbl);
      chip.addEventListener("click", () => {
        (this.cfg[k] as unknown as boolean) = !this.cfg[k];
        this.onCfgChanged();
      });
      this.syncHooks.push(() => {
        chip.classList.toggle("active", Boolean(this.cfg[k]));
      });
      accWrap.appendChild(chip);
    }
    subMoreBody.append(
      accWrap,
      this.bindCfgText("屏蔽原设服饰词 (防串服)", "canon_neg_tags", "如 serafuku, plaid, gloves")
    );
    subMoreChar.appendChild(subMoreBody);
    c1.body.appendChild(subMoreChar);
    col.appendChild(c1.card);

    // --- CARD 2: OUTFIT & CLOTHING STATE (Always collapsed on open) ---
    const btnQuickNude = this.el("button", "btn btn-xs", "⚡全裸");
    btnQuickNude.title = "一键切换为全裸不穿衣预设";
    btnQuickNude.addEventListener("click", (ev) => {
      ev.stopPropagation();
      this.cfg.enable_outfit = true;
      this.cfg.outfit_preset = "全裸无衣（nude · 全程无遮挡）";
      this.onCfgChanged();
    });

    const c2 = this.createInspectorCard({
      title: "👗 穿搭与衣态",
      collapsed: true,
      extraHeaderEl: btnQuickNude,
      onToggleSwitch: () => {
        this.cfg.enable_outfit = !this.cfg.enable_outfit;
        this.cfg.enable_legwear = this.cfg.enable_outfit;
        this.onCfgChanged();
      },
    });
    this.elOutfitCard = c2.card;
    this.elOutfitSwitch = c2.switchBtn!;
    this.elOutfitSummary = c2.summaryEl;

    c2.body.appendChild(
      this.bindCfgSelect("服装款式", "outfit_preset", Object.keys(OUTFIT_PRESETS), () => {
        if (this.cfg.outfit_preset.includes("自定义穿搭")) {
          this.showCustomOutfitExtra = true;
        }
      })
    );

    this.elCustomOutfitWrap = this.el("div", "field-row");
    const customOutLbl = this.el("label", "", "自定义 / 附加穿搭 Tag");
    const customOutInp = this.el("input") as HTMLInputElement;
    customOutInp.type = "text";
    customOutInp.placeholder = "如 reverse bunnysuit, white collar, highleg...";
    customOutInp.addEventListener("input", () => {
      this.cfg.custom_outfit_tags = customOutInp.value;
      this.onCfgChanged();
    });
    this.syncHooks.push(() => {
      if (customOutInp.value !== this.cfg.custom_outfit_tags) {
        customOutInp.value = this.cfg.custom_outfit_tags;
      }
      const isCustomKind = this.cfg.outfit_preset.includes("自定义穿搭");
      this.elCustomOutfitWrap.style.display =
        isCustomKind || this.showCustomOutfitExtra || Boolean(this.cfg.custom_outfit_tags.trim())
          ? "flex"
          : "none";
    });
    this.elCustomOutfitWrap.append(customOutLbl, customOutInp);
    c2.body.appendChild(this.elCustomOutfitWrap);

    const outGrid = this.el("div", "grid-2");
    outGrid.append(
      this.bindCfgSelect("互动穿脱衣态", "outfit_state_mode", Object.keys(OUTFIT_STATE_PRESETS)),
      this.bindCfgSelect("腿袜与鞋履", "legwear_preset", Object.keys(LEGWEAR_PRESETS))
    );
    c2.body.appendChild(outGrid);

    const outChips = this.el("div", "chip-wrap");
    const btnToggleExtraOut = this.el("button", "chip-btn", "➕ 附加自定义服饰词");
    btnToggleExtraOut.addEventListener("click", () => {
      this.showCustomOutfitExtra = !this.showCustomOutfitExtra;
      this.syncAllControls();
    });
    const btnKeepCanon = this.el("button", "chip-btn", "👑 保留角色原设头饰配件");
    btnKeepCanon.addEventListener("click", () => {
      this.cfg.keep_canon_elements = !this.cfg.keep_canon_elements;
      this.onCfgChanged();
    });
    this.syncHooks.push(() => {
      btnToggleExtraOut.classList.toggle(
        "active",
        this.showCustomOutfitExtra || Boolean(this.cfg.custom_outfit_tags.trim())
      );
      btnKeepCanon.classList.toggle("active", Boolean(this.cfg.keep_canon_elements));
    });
    outChips.append(btnToggleExtraOut, btnKeepCanon);
    c2.body.appendChild(outChips);
    col.appendChild(c2.card);

    // --- CARD 3: 4D ANATOMY (Collapsed by default with clear live summary!) ---
    const c3 = this.createInspectorCard({
      title: "🌸 下半身解剖",
      collapsed: true,
      onToggleSwitch: () => {
        this.cfg.enable_anatomy = !this.cfg.enable_anatomy;
        this.onCfgChanged();
      },
    });
    this.elAnatomyCard = c3.card;
    this.elAnatomySwitch = c3.switchBtn!;
    this.elAnatomySummary = c3.summaryEl;

    c3.body.append(
      this.bindCfgSelect("1. 形态类型 (Morph)", "morph_preset", Object.keys(MORPH_PRESETS)),
      this.bindCfgSelect("2. 阴毛样式 (Pubic)", "pubic_preset", Object.keys(PUBIC_PRESETS)),
      this.bindCfgSelect("3. 色素色泽 (Pigment)", "pigment_preset", Object.keys(PIGMENT_PRESETS))
    );

    const fluidSlider = this.el("div", "slider-row");
    const fluidHead = this.el("div", "slider-head");
    const fluidValLbl = this.el("span", "", "1.0x");
    fluidHead.append(this.el("span", "", "💦 体液表现强度倍率"), fluidValLbl);
    const fluidCtrl = this.el("div", "slider-controls");
    const fluidRange = this.el("input") as HTMLInputElement;
    fluidRange.type = "range";
    fluidRange.min = "0.5";
    fluidRange.max = "1.8";
    fluidRange.step = "0.1";
    fluidRange.addEventListener("input", () => {
      this.cfg.fluid_scale = parseFloat(fluidRange.value) || 1.0;
      fluidValLbl.textContent = `${this.cfg.fluid_scale.toFixed(1)}x`;
      this.onCfgChanged();
    });
    this.syncHooks.push(() => {
      fluidRange.value = String(this.cfg.fluid_scale);
      fluidValLbl.textContent = `${this.cfg.fluid_scale.toFixed(1)}x`;
    });
    fluidCtrl.appendChild(fluidRange);
    fluidSlider.append(fluidHead, fluidCtrl);
    c3.body.appendChild(fluidSlider);
    col.appendChild(c3.card);

    // --- CARD 4: UNIFIED STYLE + LIGHTING + VIBE + GUIDANCE (Always collapsed on open) ---
    const c4 = this.createInspectorCard({
      title: "🎨 画风 · 光影 · Vibe",
      collapsed: true,
      onToggleSwitch: () => {
        this.cfg.enable_style = !this.cfg.enable_style;
        this.onCfgChanged();
      },
    });
    this.elStyleCard = c4.card;
    this.elStyleCardTitle = c4.titleEl;
    this.elStyleSwitch = c4.switchBtn!;
    this.elStyleSummary = c4.summaryEl;

    c4.body.append(
      this.bindCfgSelect("主力画风串", "style_preset", Object.keys(STYLE_PRESETS), () => {
        // Automatically sync corresponding global lighting override for selected style
        this.cfg.lighting_preset = resolveLightingForStyle(this.cfg.style_preset);
        // Automatically populate bundled Vibe slots whenever a Vibe-tuned style is chosen
        const styleVibePack = STYLE_BUNDLED_VIBE_PACK[this.cfg.style_preset];
        if (styleVibePack && BUNDLED_VIBE_PACKS[styleVibePack]) {
          void this.injectBundledVibePack(styleVibePack, false).then(() => {
            this.syncAllControls();
            this.refreshSceneAndPrompt();
            if (this.apiSettings.model === MODEL_V4_5_FULL) {
              this.setStatus(
                `🧬 已同步打光并自动载入内置 ${this.vibeItems.length} 槽 Vibe (DPM++ 2M · Scale ${this.apiSettings.scale})`
              );
            }
          });
        }
      }),
      this.bindCfgSelect("全局打光覆写", "lighting_preset", Object.keys(LIGHTING_PRESETS))
    );

    this.elCustomStyleWrap = this.el("div", "field-row");
    this.elCustomStyleWrap.style.gap = "5px";
    this.elCustomStyleWrap.append(
      this.bindCfgText("自定义画风正向词", "custom_style_pos", "artist:..., watercolor..."),
      this.bindCfgText("自定义画风负向词", "custom_style_neg", "3d, photorealistic...")
    );
    this.syncHooks.push(() => {
      this.elCustomStyleWrap.style.display = this.cfg.style_preset.includes("自定义画风")
        ? "flex"
        : "none";
    });
    c4.body.appendChild(this.elCustomStyleWrap);

    // Embedded Vibe Transfer Panel inside Style Card (Hidden on V5 models!)
    const vibePanel = this.el("div", "vibe-panel");
    this.elVibePanel = vibePanel;
    const vibeHead = this.el("div", "vibe-head");
    const vibeLeft = this.el("div", "topbar-group");
    vibeLeft.appendChild(this.el("strong", "", "🧬 Vibe 参照"));
    this.elVibeSwitch = this.el("button", "switch-pill on", "ON");
    this.elVibeSwitch.title = "启用/暂挂 Vibe Transfer（支持 .naiv4vibebundle / .naiv4vibe / NAI 原图拖拽）";
    this.elVibeSwitch.addEventListener("click", () => {
      this.apiSettings.vibe_transfer_enabled = !this.apiSettings.vibe_transfer_enabled;
      saveApiSettings(this.apiSettings);
      this.syncVibeUI();
      this.refreshSceneAndPrompt();
    });
    vibeLeft.appendChild(this.elVibeSwitch);

    const vibeBtns = this.el("div", "topbar-group");
    const fileInputReplace = document.createElement("input");
    fileInputReplace.type = "file";
    fileInputReplace.multiple = true;
    fileInputReplace.accept = ".naiv4vibebundle,.naiv4vibe,.json,.png,.webp,.jpg,.jpeg";
    fileInputReplace.style.display = "none";
    fileInputReplace.addEventListener("change", () => {
      if (fileInputReplace.files?.length) {
        void this.handleVibeFilesImport(fileInputReplace.files, false);
        fileInputReplace.value = "";
      }
    });

    const fileInputAppend = document.createElement("input");
    fileInputAppend.type = "file";
    fileInputAppend.multiple = true;
    fileInputAppend.accept = ".naiv4vibebundle,.naiv4vibe,.json,.png,.webp,.jpg,.jpeg";
    fileInputAppend.style.display = "none";
    fileInputAppend.addEventListener("change", () => {
      if (fileInputAppend.files?.length) {
        void this.handleVibeFilesImport(fileInputAppend.files, true);
        fileInputAppend.value = "";
      }
    });

    const btnImportVibe = this.el("button", "btn btn-xs btn-primary", "📂 导入");
    btnImportVibe.title = "导入 .naiv4vibebundle / .naiv4vibe / 含Vibe的NAI原图（覆盖当前列表）";
    btnImportVibe.addEventListener("click", () => fileInputReplace.click());

    const btnAppendVibe = this.el("button", "btn btn-xs", "➕ 追加");
    btnAppendVibe.title = "追加新的 Vibe 槽位（最多 16 槽）";
    btnAppendVibe.addEventListener("click", () => fileInputAppend.click());

    const btnClearVibe = this.el("button", "btn btn-xs", "清空");
    btnClearVibe.addEventListener("click", async () => {
      this.vibeItems = [];
      await clearStoredVibeItems();
      this.syncVibeUI();
      this.refreshSceneAndPrompt();
      this.setStatus("🧹 已清空全部 Vibe 槽位");
    });

    vibeBtns.append(fileInputReplace, fileInputAppend, btnImportVibe, btnAppendVibe, btnClearVibe);
    vibeHead.append(vibeLeft, vibeBtns);

    vibePanel.addEventListener("dragover", (ev) => {
      ev.preventDefault();
      vibePanel.classList.add("drag-over");
    });
    vibePanel.addEventListener("dragleave", () => vibePanel.classList.remove("drag-over"));
    vibePanel.addEventListener("drop", (ev) => {
      ev.preventDefault();
      vibePanel.classList.remove("drag-over");
      if (ev.dataTransfer?.files?.length) {
        void this.handleVibeFilesImport(ev.dataTransfer.files, ev.shiftKey);
      }
    });

    this.elVibeSlotList = this.el("div", "vibe-slot-list");
    this.elVibeNormWrap = this.el("label", "vibe-note");
    this.elVibeNormWrap.style.display = "flex";
    this.elVibeNormWrap.style.alignItems = "center";
    this.elVibeNormWrap.style.gap = "5px";
    this.elVibeNormChk = this.el("input") as HTMLInputElement;
    this.elVibeNormChk.type = "checkbox";
    this.elVibeNormChk.addEventListener("change", () => {
      this.apiSettings.vibe_normalize_strength = this.elVibeNormChk.checked;
      saveApiSettings(this.apiSettings);
    });
    this.elVibeNormWrap.append(
      this.elVibeNormChk,
      this.el("span", "", "多槽位自动归一化强度 (Normalize Reference Strength)")
    );

    this.elVibeStatusNote = this.el("div", "vibe-note");
    vibePanel.append(vibeHead, this.elVibeSlotList, this.elVibeNormWrap, this.elVibeStatusNote);
    c4.body.appendChild(vibePanel);

    // Style-Coupled Guidance & CFG Rescale Sliders right under Vibe!
    const scaleRow = this.el("div", "slider-row");
    const scaleHead = this.el("div", "slider-head");
    const btnResetScale = this.el("button", "btn btn-xs", "↺ 推荐值");
    btnResetScale.title = "恢复当前模型的官方默认 Scale 与 Rescale";
    btnResetScale.addEventListener("click", () => {
      this.apiSettings.scale = this.apiSettings.model === MODEL_V5_FULL_MEDIUM ? 6.0 : 7.0;
      this.apiSettings.cfg_rescale = 0.0;
      saveApiSettings(this.apiSettings);
      this.syncApiControls();
    });
    scaleHead.append(this.el("span", "", "🎯 Guidance (Scale 相关性)"), btnResetScale);
    const scaleCtrl = this.el("div", "slider-controls");
    this.elScaleRange = this.el("input") as HTMLInputElement;
    this.elScaleRange.type = "range";
    this.elScaleRange.min = "1";
    this.elScaleRange.max = "10";
    this.elScaleRange.step = "0.1";
    this.elScaleNum = this.el("input") as HTMLInputElement;
    this.elScaleNum.type = "number";
    this.elScaleNum.min = "1";
    this.elScaleNum.max = "10";
    this.elScaleNum.step = "0.1";
    const onScaleInput = (valStr: string) => {
      const v = Math.max(1, Math.min(10, Number(parseFloat(valStr).toFixed(1)) || 7.0));
      this.apiSettings.scale = v;
      this.elScaleRange.value = String(v);
      this.elScaleNum.value = v.toFixed(1);
      saveApiSettings(this.apiSettings);
    };
    this.elScaleRange.addEventListener("input", () => onScaleInput(this.elScaleRange.value));
    this.elScaleNum.addEventListener("change", () => onScaleInput(this.elScaleNum.value));
    scaleCtrl.append(this.elScaleRange, this.elScaleNum);
    scaleRow.append(scaleHead, scaleCtrl);

    const rescaleRow = this.el("div", "slider-row");
    const rescaleHead = this.el("div", "slider-head");
    rescaleHead.appendChild(this.el("span", "", "⚖️ Prompt Guidance Rescale (防过曝)"));
    const rescaleCtrl = this.el("div", "slider-controls");
    this.elRescaleRange = this.el("input") as HTMLInputElement;
    this.elRescaleRange.type = "range";
    this.elRescaleRange.min = "0";
    this.elRescaleRange.max = "1";
    this.elRescaleRange.step = "0.02";
    this.elRescaleNum = this.el("input") as HTMLInputElement;
    this.elRescaleNum.type = "number";
    this.elRescaleNum.min = "0";
    this.elRescaleNum.max = "1";
    this.elRescaleNum.step = "0.02";
    const onRescaleInput = (valStr: string) => {
      const v = Math.max(0, Math.min(1, Number((parseFloat(valStr) || 0).toFixed(2))));
      this.apiSettings.cfg_rescale = v;
      this.elRescaleRange.value = String(v);
      this.elRescaleNum.value = v.toFixed(2);
      saveApiSettings(this.apiSettings);
    };
    this.elRescaleRange.addEventListener("input", () => onRescaleInput(this.elRescaleRange.value));
    this.elRescaleNum.addEventListener("change", () => onRescaleInput(this.elRescaleNum.value));
    rescaleCtrl.append(this.elRescaleRange, this.elRescaleNum);
    rescaleRow.append(rescaleHead, rescaleCtrl);

    c4.body.append(scaleRow, rescaleRow);
    col.appendChild(c4.card);

    // --- CARD 5: API TOKEN & ADVANCED SAMPLING (Always collapsed on open) ---
    const c5 = this.createInspectorCard({
      title: "🔑 API 令牌与高级采样",
      collapsed: true,
    });
    this.elApiCard = c5.card;
    this.elApiSummary = c5.summaryEl;

    const tokRow = this.el("div", "field-row");
    tokRow.appendChild(this.el("label", "", "Persistent API Token (pst-...)"));
    const tokBar = this.el("div", "pose-search-row");
    const tokInp = this.el("input") as HTMLInputElement;
    tokInp.type = "password";
    tokInp.placeholder = "粘贴 pst-... 永久令牌";
    tokInp.value = this.apiSettings.api_token;
    tokInp.addEventListener("change", () => {
      this.apiSettings.api_token = tokInp.value.trim();
      saveApiSettings(this.apiSettings);
      this.updateQuotaPill();
      if (this.apiSettings.api_token) {
        void this.refreshSubscription(false);
      }
    });
    const btnShowTok = this.el("button", "btn btn-xs btn-icon", "👁️");
    btnShowTok.addEventListener("click", () => {
      tokInp.type = tokInp.type === "password" ? "text" : "password";
    });
    const btnCheckSub = this.el("button", "btn btn-xs btn-primary", "查余额");
    btnCheckSub.addEventListener("click", () => void this.refreshSubscription(false));
    tokBar.append(tokInp, btnShowTok, btnCheckSub);
    tokRow.appendChild(tokBar);

    const stepsRow = this.el("div", "slider-row");
    const stepsHead = this.el("div", "slider-head");
    this.elStepsHint = this.el("span", "", "Steps: 28 (Opus ≤28步免点)");
    stepsHead.appendChild(this.elStepsHint);
    const stepsCtrl = this.el("div", "slider-controls");
    this.elStepsRange = this.el("input") as HTMLInputElement;
    this.elStepsRange.type = "range";
    this.elStepsRange.min = "1";
    this.elStepsRange.max = "50";
    this.elStepsRange.step = "1";
    this.elStepsNum = this.el("input") as HTMLInputElement;
    this.elStepsNum.type = "number";
    this.elStepsNum.min = "1";
    this.elStepsNum.max = "50";
    const onStepsChange = (valStr: string) => {
      const s = Math.max(1, Math.min(50, Math.round(parseInt(valStr, 10) || 28)));
      this.apiSettings.steps = s;
      this.elStepsRange.value = String(s);
      this.elStepsNum.value = String(s);
      saveApiSettings(this.apiSettings);
      this.syncApiControls();
      this.updateQuotaPill();
    };
    this.elStepsRange.addEventListener("input", () => onStepsChange(this.elStepsRange.value));
    this.elStepsNum.addEventListener("change", () => onStepsChange(this.elStepsNum.value));
    stepsCtrl.append(this.elStepsRange, this.elStepsNum);
    stepsRow.append(stepsHead, stepsCtrl);

    const ucRow = this.el("div", "field-row");
    ucRow.appendChild(this.el("label", "", "官方负向预设档位 (UC Preset)"));
    this.elUcModeSelect = this.el("select");
    const ucOpts: Array<[NaiUcPresetMode, string]> = [
      ["heavy", "Heavy (重度防崩 · 默认推荐)"],
      ["human_focus", "Human Focus (人物五官解剖强化 · V4.5佳)"],
      ["light", "Light (轻量精简)"],
      ["none", "None (不加官方预设底词)"],
    ];
    for (const [val, txt] of ucOpts) {
      const o = this.el("option", "", txt);
      o.value = val;
      this.elUcModeSelect.appendChild(o);
    }
    this.elUcModeSelect.addEventListener("change", () => {
      this.apiSettings.uc_preset_mode = this.elUcModeSelect.value as NaiUcPresetMode;
      saveApiSettings(this.apiSettings);
      this.refreshSceneAndPrompt();
    });
    ucRow.appendChild(this.elUcModeSelect);

    const extraUcRow = this.el("div", "field-row");
    extraUcRow.appendChild(this.el("label", "", "全局附加负向词 (Extra UC)"));
    const extraUcInp = this.el("input") as HTMLInputElement;
    extraUcInp.type = "text";
    extraUcInp.placeholder = "如 watermark, signature, extra digits...";
    extraUcInp.value = this.apiSettings.extra_uc;
    extraUcInp.addEventListener("input", () => {
      this.apiSettings.extra_uc = extraUcInp.value;
      saveApiSettings(this.apiSettings);
      this.refreshSceneAndPrompt();
    });
    extraUcRow.appendChild(extraUcInp);

    const advChips = this.el("div", "chip-wrap");
    const chipQt = this.el("button", "chip-btn", "✨ 官方画质尾缀");
    chipQt.addEventListener("click", () => {
      this.apiSettings.append_v5_quality = !this.apiSettings.append_v5_quality;
      saveApiSettings(this.apiSettings);
      this.syncApiControls();
      this.refreshSceneAndPrompt();
    });
    const chipProse = this.el("button", "chip-btn", "📖 T5 自然语言尾句");
    chipProse.addEventListener("click", () => {
      this.cfg.enable_t5_prose = !this.cfg.enable_t5_prose;
      this.onCfgChanged();
    });
    const chipAutoDl = this.el("button", "chip-btn", "⬇️ 出图自动浏览器下载");
    chipAutoDl.addEventListener("click", () => {
      this.apiSettings.auto_download = !this.apiSettings.auto_download;
      saveApiSettings(this.apiSettings);
      this.syncApiControls();
    });
    this.syncHooks.push(() => {
      chipQt.classList.toggle("active", Boolean(this.apiSettings.append_v5_quality));
      chipProse.classList.toggle("active", Boolean(this.cfg.enable_t5_prose));
      chipAutoDl.classList.toggle("active", Boolean(this.apiSettings.auto_download));
    });
    advChips.append(chipQt, chipProse, chipAutoDl);

    c5.body.append(tokRow, stepsRow, ucRow, extraUcRow, advChips);
    col.appendChild(c5.card);

    return col;
  }

  // ===========================================================================
  // CENTER COLUMN: HERO STAGE + FILMSTRIP + COLLAPSIBLE PROMPT DRAWER
  // ===========================================================================
  private buildCenterColumn(): HTMLElement {
    const col = this.el("main", "studio-col col-center");

    // 1. Stage Top Toolbar
    const toolbar = this.el("div", "stage-toolbar");
    this.elStageMeta = this.el("div", "stage-meta", "就绪 · 选择右侧动作或点击顶部「🚀 立即生图」");

    const actions = this.el("div", "stage-actions");
    this.elAutoUpscaleBtn = this.el("button", "chip-btn", "🔍 生后即2x替换");
    this.elAutoUpscaleBtn.title =
      "开启后：每次生图自动完成官方 2x 高清放大后再推入画廊与全屏灯箱（不推临时1x小图）";
    this.elAutoUpscaleBtn.addEventListener("click", () => {
      this.apiSettings.auto_upscale_replace = !this.apiSettings.auto_upscale_replace;
      saveApiSettings(this.apiSettings);
      this.syncStageToolbar();
    });

    this.elAutoCarouselBtn = this.el("button", "chip-btn", "🎬 连出全屏轮播");
    this.elAutoCarouselBtn.title = "连续生成多张图片时自动弹出全屏灯箱跟随展示最新成图";
    this.elAutoCarouselBtn.addEventListener("click", () => {
      this.apiSettings.auto_fullscreen_carousel = !this.apiSettings.auto_fullscreen_carousel;
      saveApiSettings(this.apiSettings);
      this.syncStageToolbar();
    });

    const btnChecker = this.el("button", "btn btn-xs", "🏁 棋盘底");
    btnChecker.addEventListener("click", () => {
      this.checkerboardBg = !this.checkerboardBg;
      this.elHeroViewport.classList.toggle("checkerboard", this.checkerboardBg);
      btnChecker.classList.toggle("btn-primary", this.checkerboardBg);
    });

    const btnOpenLightbox = this.el("button", "btn btn-xs", "📺 全屏灯箱");
    btnOpenLightbox.addEventListener("click", () => {
      if (this.gallery.length === 0) {
        this.setStatus("⚠️ 画廊暂无图片，请先生图", true);
        return;
      }
      this.openLightbox(Math.max(0, this.selectedGalleryIdx));
    });

    this.elUpscaleBtn = this.el("button", "btn btn-xs btn-primary", "✨ 2x高清放大");
    this.elUpscaleBtn.title = "对当前预览图片调用官方 2x Upscale 高清放大并原位替换";
    this.elUpscaleBtn.addEventListener("click", () => void this.upscaleSelectedGalleryImage());

    const btnDownloadCur = this.el("button", "btn btn-xs", "💾 下载");
    btnDownloadCur.addEventListener("click", () => {
      const rec = this.gallery[this.selectedGalleryIdx];
      if (!rec) return;
      triggerBytesDownload(rec.bytes, rec.filename);
    });

    const btnZipAll = this.el("button", "btn btn-xs btn-success", "📦 打包ZIP");
    btnZipAll.addEventListener("click", () => this.exportGalleryZip());

    actions.append(
      this.elAutoUpscaleBtn,
      this.elAutoCarouselBtn,
      btnChecker,
      btnOpenLightbox,
      this.elUpscaleBtn,
      btnDownloadCur,
      btnZipAll
    );
    toolbar.append(this.elStageMeta, actions);

    // 2. Hero Image Viewport
    this.elHeroViewport = this.el("div", "hero-viewport");
    this.elProgressBanner = this.el("div", "gen-progress-banner");
    this.elProgressBanner.style.display = "none";
    this.elProgressText = this.el("span", "", "正在生成...");
    this.elProgressBanner.append(this.el("span", "spinner-dot"), this.elProgressText);
    this.renderHeroViewport();

    // 3. Horizontal Filmstrip
    this.elFilmstripBar = this.el("div", "filmstrip-bar hidden");
    this.elFilmstripScroll = this.el("div", "filmstrip-scroll");
    const filmActions = this.el("div", "topbar-group");
    const btnClearGallery = this.el("button", "btn btn-xs", "清空画廊");
    btnClearGallery.addEventListener("click", () => {
      for (const g of this.gallery) URL.revokeObjectURL(g.objectUrl);
      this.gallery = [];
      this.checkedGalleryIds.clear();
      this.selectedGalleryIdx = -1;
      this.renderHeroViewport();
      this.renderFilmstrip();
      this.setStatus("🧹 已清空当前会话画廊缓存");
    });
    filmActions.appendChild(btnClearGallery);
    this.elFilmstripBar.append(this.elFilmstripScroll, filmActions);

    // 4. Collapsible & Vertically Resizable Bottom Live Prompt Drawer
    this.elPromptDrawer = this.el("section", "prompt-drawer collapsed");
    const drawerResizer = this.el("div", "prompt-drawer-resizer");
    drawerResizer.title = "上下拖动调节词条面板高度（双击重置）";
    const pBar = this.el("div", "prompt-drawer-bar");
    const pLeft = this.el("div", "prompt-bar-left");

    this.elDrawerToggleBtn = this.el("button", "btn btn-xs", "▸ 展开词条微调");
    this.elDrawerToggleBtn.addEventListener("click", () => {
      this.promptDrawerExpanded = !this.promptDrawerExpanded;
      this.elPromptDrawer.classList.toggle("collapsed", !this.promptDrawerExpanded);
      this.elDrawerToggleBtn.textContent = this.promptDrawerExpanded
        ? "▾ 收起词条面板"
        : "▸ 展开词条微调";
    });

    this.elPromptSceneLbl = this.el("span", "prompt-scene-lbl", "");
    this.elTokenPill = this.el("span", "token-pill", "0 / 502 tok");
    this.elManualLockPill = this.el("span", "manual-lock-pill", "✏️ 手改生效中");
    this.elManualLockPill.style.display = "none";
    const btnResetManual = this.el("button", "btn btn-xs", "↺ 恢复引擎词条");
    btnResetManual.style.marginLeft = "4px";
    btnResetManual.addEventListener("click", () => {
      this.isManualPromptEdited = false;
      this.refreshSceneAndPrompt();
    });
    this.elManualLockPill.appendChild(btnResetManual);

    pLeft.append(
      this.elDrawerToggleBtn,
      this.elPromptSceneLbl,
      this.elTokenPill,
      this.elManualLockPill
    );

    const pRight = this.el("div", "topbar-group");
    const btnCopyPos = this.el("button", "btn btn-xs", "📋 复制正向");
    btnCopyPos.addEventListener("click", () => {
      void navigator.clipboard.writeText(this.elPosTextarea.value.trim());
      this.setStatus("📋 已复制正向 Prompt 到剪贴板");
    });
    const btnCopyNeg = this.el("button", "btn btn-xs", "📋 复制负向");
    btnCopyNeg.addEventListener("click", () => {
      const fullNeg = buildFullNegativeString({
        posPrompt: this.elPosTextarea.value.trim(),
        sceneNegPrompt: this.elNegTextarea.value.trim(),
        ucPresetMode:
          this.apiSettings.model === MODEL_V5_FULL_MEDIUM
            ? "heavy"
            : this.apiSettings.uc_preset_mode,
        extraUc: this.apiSettings.extra_uc,
      });
      void navigator.clipboard.writeText(fullNeg);
      this.setStatus("📋 已复制完整负向 UC 到剪贴板");
    });
    const btnCopyInline = this.el("button", "btn btn-xs", "📋 单框内联");
    btnCopyInline.title = "复制把负向包裹为 -2::...:: 的单框合并文本（适合 V5 Medium 网页粘贴）";
    btnCopyInline.addEventListener("click", () => {
      const merged = mergePosAndNegToInline(this.elPosTextarea.value, this.elNegTextarea.value);
      void navigator.clipboard.writeText(merged);
      this.setStatus("📋 已复制单框内联格式 (-2::...::) 到剪贴板");
    });
    pRight.append(btnCopyPos, btnCopyNeg, btnCopyInline);
    pBar.append(pLeft, pRight);

    const pBody = this.el("div", "prompt-drawer-body");
    const posCol = this.el("div", "prompt-box-col");
    const posHead = this.el("div", "prompt-box-head");
    posHead.appendChild(this.el("span", "", "✨ Positive Prompt (可直接手改并锁定生图)"));
    this.elPosTextarea = this.el("textarea") as HTMLTextAreaElement;
    this.elPosTextarea.spellcheck = false;
    this.elPosTextarea.addEventListener("input", () => {
      this.isManualPromptEdited = true;
      this.elManualLockPill.style.display = "inline-flex";
      this.updateTokenBadgeFromBoxes();
    });
    posCol.append(posHead, this.elPosTextarea);

    const negCol = this.el("div", "prompt-box-col");
    const negHead = this.el("div", "prompt-box-head");
    negHead.appendChild(this.el("span", "", "🛡️ Negative UC (场景附加负向词 · V4.5/V5独立通道)"));
    this.elNegTextarea = this.el("textarea") as HTMLTextAreaElement;
    this.elNegTextarea.spellcheck = false;
    this.elNegTextarea.addEventListener("input", () => {
      this.isManualPromptEdited = true;
      this.elManualLockPill.style.display = "inline-flex";
      this.updateTokenBadgeFromBoxes();
    });
    negCol.append(negHead, this.elNegTextarea);

    pBody.append(posCol, negCol);
    this.elPromptDrawer.append(drawerResizer, pBar, pBody);
    this.setupPromptDrawerResizer(col, this.elPromptDrawer, drawerResizer);

    col.append(toolbar, this.elHeroViewport, this.elFilmstripBar, this.elPromptDrawer);
    return col;
  }

  private setupPromptDrawerResizer(
    colCenter: HTMLElement,
    drawer: HTMLElement,
    handle: HTMLElement
  ): void {
    const LS_KEY = "nai_wb_prompt_drawer_h_v1";
    const isMobile = () => window.innerWidth <= 768;
    const getDefaultH = () => (isMobile() ? 260 : window.innerWidth <= 1120 ? 240 : 192);
    const getMaxH = () => {
      const containerH = colCenter.clientHeight || window.innerHeight;
      return Math.max(220, Math.round(containerH * (isMobile() ? 0.65 : 0.68)));
    };
    const MIN_H = 110;

    let drawerH: number | null = null;
    try {
      const raw = Number(localStorage.getItem(LS_KEY));
      if (Number.isFinite(raw) && raw >= MIN_H) {
        drawerH = Math.round(raw);
      }
    } catch {
      // ignore
    }

    const applyH = (persist = false): void => {
      if (drawerH === null) {
        drawer.style.removeProperty("--prompt-drawer-h");
      } else {
        drawerH = Math.max(MIN_H, Math.min(getMaxH(), drawerH));
        drawer.style.setProperty("--prompt-drawer-h", `${drawerH}px`);
      }
      if (persist) {
        try {
          if (drawerH === null) localStorage.removeItem(LS_KEY);
          else localStorage.setItem(LS_KEY, String(drawerH));
        } catch {
          // ignore
        }
      }
    };
    applyH(false);

    handle.addEventListener("dblclick", () => {
      drawerH = null;
      applyH(true);
    });

    handle.addEventListener("pointerdown", (ev: PointerEvent) => {
      ev.preventDefault();
      handle.setPointerCapture(ev.pointerId);
      handle.classList.add("dragging");
      const startY = ev.clientY;
      const startH = drawerH ?? getDefaultH();

      const onMove = (moveEv: PointerEvent): void => {
        const dy = startY - moveEv.clientY;
        drawerH = Math.max(MIN_H, Math.min(getMaxH(), Math.round(startH + dy)));
        applyH(false);
      };
      const onUp = (upEv: PointerEvent): void => {
        handle.releasePointerCapture(upEv.pointerId);
        handle.classList.remove("dragging");
        handle.removeEventListener("pointermove", onMove);
        handle.removeEventListener("pointerup", onUp);
        handle.removeEventListener("pointercancel", onUp);
        applyH(true);
      };
      handle.addEventListener("pointermove", onMove);
      handle.addEventListener("pointerup", onUp);
      handle.addEventListener("pointercancel", onUp);
    });

    window.addEventListener("resize", () => {
      if (drawerH !== null) applyH(false);
    });
  }

  // ===========================================================================
  // RIGHT COLUMN: 3-MODE ACTION & CAMERA MATRIX (STORYLINE-FREE)
  // ===========================================================================
  private buildRightColumn(): HTMLElement {
    const col = this.el("aside", "studio-col col-right");

    // 1. 3-Mode Switcher
    const modeBar = this.el("div", "action-mode-bar");
    const seg = this.el("div", "seg-group");
    const modes: Array<[ActionMode, string]> = [
      ["positions", "🔞 体位动作库"],
      ["multi_angle", "✨ 多角度日常"],
      ["free", "✍️ 自由手写动作"],
    ];
    this.elActionModeBtns.clear();
    for (const [m, lbl] of modes) {
      const b = this.el("button", `seg-btn${this.actionMode === m ? " active" : ""}`, lbl);
      b.addEventListener("click", () => {
        this.actionMode = m;
        this.isManualPromptEdited = false;
        if (m === "positions" && !(this.activeSceneId in ALL_POSITIONS_TEMPLATES)) {
          this.activeSceneId = "P01";
        } else if (m === "multi_angle" && !this.activeSceneId.startsWith("MA")) {
          this.activeSceneId = "MA1";
        }
        this.renderRightModeView();
        this.refreshSceneAndPrompt();
      });
      this.elActionModeBtns.set(m, b);
      seg.appendChild(b);
    }
    modeBar.appendChild(seg);

    // 2. Dynamic Context Control Box
    this.elContextCtrlBox = this.el("div", "context-ctrl-box");

    // 3. Compact Override Strip (Expression Popover Trigger)
    const overrideStrip = this.el("div", "override-strip");
    this.elExprTrigger = this.el("button", "override-trigger");
    this.elExprTrigger.addEventListener("click", (ev) => {
      ev.stopPropagation();
      this.togglePopover(this.elExprPopover, this.elExprTrigger);
    });
    overrideStrip.append(this.elExprTrigger);

    // 4. Pose Search & Category Filter Bar
    this.elPoseFilterBar = this.el("div", "pose-filter-bar");

    // 5. Scrollable Pose / Multi-Angle List
    this.elPoseListWrap = this.el("div", "pose-list-scroll");

    // 6. Dedicated Free Action Panel
    this.elFreeActionWrap = this.buildFreeActionPanel();

    col.append(
      modeBar,
      this.elContextCtrlBox,
      overrideStrip,
      this.elPoseFilterBar,
      this.elPoseListWrap,
      this.elFreeActionWrap
    );

    this.renderRightModeView();
    return col;
  }

  private renderRightModeView(): void {
    for (const [m, b] of this.elActionModeBtns.entries()) {
      b.classList.toggle("active", m === this.actionMode);
    }

    this.elContextCtrlBox.innerHTML = "";
    this.elPoseFilterBar.innerHTML = "";

    if (this.actionMode === "positions") {
      this.buildPositionsContextControls();
      this.buildPoseFilterControls();
      this.elPoseFilterBar.style.display = "flex";
      this.elPoseListWrap.style.display = "flex";
      this.elFreeActionWrap.style.display = "none";
      this.renderPoseCards();
    } else if (this.actionMode === "multi_angle") {
      this.buildMultiAngleContextControls();
      this.buildMultiAngleFilterControls();
      this.elPoseFilterBar.style.display = "flex";
      this.elPoseListWrap.style.display = "flex";
      this.elFreeActionWrap.style.display = "none";
      this.renderPoseCards();
    } else {
      this.buildFreeContextControls();
      this.elPoseFilterBar.style.display = "none";
      this.elPoseListWrap.style.display = "none";
      this.elFreeActionWrap.style.display = "flex";
    }
  }

  private buildPositionsContextControls(): void {
    // Row 1: POV / 3rd + Male 4-State Pills
    const r1 = this.el("div", "ctrl-inline-row");
    const povSeg = this.el("div", "seg-group");
    for (const [pMode, lbl] of [
      ["pov", "👁️ POV"],
      ["3rd", "🎥 3rd"],
    ] as const) {
      const b = this.el(
        "button",
        `seg-btn${this.cfg.perspective_mode === pMode ? " active" : ""}`,
        lbl
      );
      b.addEventListener("click", () => {
        this.cfg.perspective_mode = pMode;
        this.onCfgChanged();
        this.renderRightModeView();
      });
      povSeg.appendChild(b);
    }
    r1.appendChild(povSeg);

    const activePosTpl = ALL_POSITIONS_TEMPLATES[this.activeSceneId];
    const isTentacleScene = activePosTpl?.channel === "tentacle";
    const hasBuiltinXray = Boolean(activePosTpl?.builtin_xray);

    const maleCodeLabels: Record<string, string> = {
      normal: "👤正常",
      translucent: "👻半透",
      invisible: "🫥隐形",
      off: "🚫单人",
    };
    for (const [fullKey, code] of Object.entries(POS_MALE_MODE_PRESETS)) {
      const shortLbl = maleCodeLabels[code] || compactOptionText(fullKey, 8);
      const isActiveMale = isTentacleScene ? code === "off" : this.cfg.pos_male_mode === fullKey;
      const c = this.el(
        "button",
        `chip-btn${isActiveMale ? " active" : ""}`,
        shortLbl
      );
      c.title = isTentacleScene ? "触手系动作固定使用单女主防人形肢体串染" : fullKey;
      c.disabled = isTentacleScene;
      c.addEventListener("click", () => {
        this.cfg.pos_male_mode = fullKey;
        this.onCfgChanged();
        this.renderRightModeView();
      });
      r1.appendChild(c);
    }

    // Row 2: 5-Stage Progression Pills
    const r2 = this.el("div", "ctrl-inline-row");
    r2.appendChild(this.el("span", "ctrl-tag-lbl", "阶段"));
    const stageCodeLabels: Record<string, string> = {
      before: "🔥1.进行",
      during: "💦2.内射",
      after_inside: "🌊3.溢流",
      pull_out: "🔗4.拔出",
      prolapse: "🌺5.宫脱",
    };
    for (const [fullKey, code] of Object.entries(POS_STAGE_PRESETS)) {
      const shortLbl = stageCodeLabels[code] || compactOptionText(fullKey, 10);
      const c = this.el(
        "button",
        `chip-btn${!isTentacleScene && this.cfg.pos_stage === fullKey ? " active" : ""}`,
        shortLbl
      );
      c.title = isTentacleScene ? "触手系子型号 (TN01~TN04) 已内置各自独立阶段与解剖结构" : fullKey;
      c.disabled = isTentacleScene;
      c.addEventListener("click", () => {
        this.cfg.pos_stage = fullKey;
        this.onCfgChanged();
        this.renderRightModeView();
      });
      r2.appendChild(c);
    }

    // Row 3: Aux Toggles (Show Penis / Condom / Uterus X-Ray / Transparent BG)
    const r3 = this.el("div", "ctrl-inline-row");
    r3.appendChild(this.el("span", "ctrl-tag-lbl", "叠加"));
    const isSoloMaleOff =
      isTentacleScene || (POS_MALE_MODE_PRESETS[this.cfg.pos_male_mode] ?? "normal") === "off";
    const auxItems: Array<[string, boolean, () => void, boolean?]> = [
      [
        "🍆 显器官",
        this.cfg.pos_show_penis && !isSoloMaleOff,
        () => {
          this.cfg.pos_show_penis = !this.cfg.pos_show_penis;
          this.onCfgChanged();
          this.renderRightModeView();
        },
        isSoloMaleOff,
      ],
      [
        "🎈 戴套",
        !isTentacleScene && this.cfg.enable_condom,
        () => {
          this.cfg.enable_condom = !this.cfg.enable_condom;
          this.onCfgChanged();
          this.renderRightModeView();
        },
        isTentacleScene,
      ],
      [
        "🔬 子宫透视",
        (this.cfg.gender_mode ?? "normal") !== "femboy" && (hasBuiltinXray || this.cfg.enable_uterus_xray),
        () => {
          this.cfg.enable_uterus_xray = !this.cfg.enable_uterus_xray;
          this.onCfgChanged();
          this.renderRightModeView();
        },
        hasBuiltinXray || (this.cfg.gender_mode ?? "normal") === "femboy",
      ],
      [
        "🏁 透明底",
        this.cfg.pos_transparent_bg,
        () => {
          this.cfg.pos_transparent_bg = !this.cfg.pos_transparent_bg;
          this.onCfgChanged();
          this.renderRightModeView();
        },
      ],
    ];
    for (const [lbl, active, onClick, disabled] of auxItems) {
      const b = this.el("button", `chip-btn${active ? " active" : ""}`, lbl);
      if (disabled) b.disabled = true;
      b.addEventListener("click", onClick);
      r3.appendChild(b);
    }

    // Row 4: Scene Environment Bar with inline Enable Switch (auto-locked for TN poses)
    const r4 = this.buildPosSceneRow();
    this.elContextCtrlBox.append(r1, r2, r3, r4);
  }

  private buildPosSceneRow(): HTMLElement {
    const r = this.el("div", "ctrl-inline-row");
    const isLockedEnvScene =
      this.actionMode === "positions" &&
      Boolean(ALL_POSITIONS_TEMPLATES[this.activeSceneId]?.lock_scene_env);

    const envSw = this.el(
      "button",
      `switch-pill${!isLockedEnvScene && this.cfg.enable_background ? " on" : ""}`,
      isLockedEnvScene ? "内置环境" : this.cfg.enable_background ? "环境ON" : "环境OFF"
    );
    envSw.title = isLockedEnvScene
      ? "当前触手系动作强制使用提示词内置暗窟荧光环境（自动屏蔽其他环境预设；混合连出时其他普通体位仍保留各自环境）"
      : "开关背景环境词条";
    envSw.disabled = isLockedEnvScene;
    envSw.addEventListener("click", () => {
      this.cfg.enable_background = !this.cfg.enable_background;
      this.onCfgChanged();
      this.renderRightModeView();
    });
    r.appendChild(envSw);

    if (isLockedEnvScene) {
      const lockedChip = this.el(
        "button",
        `chip-btn${!this.cfg.pos_transparent_bg ? " active" : ""}`,
        this.cfg.pos_transparent_bg ? "🏁 已切透明底" : "🔒 提示词内置暗窟环境"
      );
      lockedChip.disabled = true;
      lockedChip.title =
        "触手系列自动禁用外部环境并采用提示词内置暗窟荧光环境；批量连出混合体位时按单幕独立生效，互不污染";
      r.appendChild(lockedChip);
    }

    const sceneShort: Array<[string, string]> = [
      ["🛋️ 默认暖光室内沙发（indoors, couch, lamp）", "🛋️沙发"],
      ["🪟 晨光纱帘白床明亮卧室（bright window, curtains, sunlit bedroom, white bedsheet）", "🪟白床"],
      ["🌸 落樱浅滩水波·粉霞晴空焦散（shallow water, cherry blossoms, caustics, pink sky）", "🌸浅滩"],
      ["🗑️ 日式城市阴暗小巷·垃圾箱旁（alley, backstreet, trash can, garbage bag）", "🗑️后巷"],
      ["🪴 落地窗日光绿植 · 绒毛米色地毯木地板（furry beige rug, floor-to-ceiling window, potted plant）", "🪴绒毯"],
    ];
    for (const [fullKey, shortLbl] of sceneShort) {
      const b = this.el(
        "button",
        `chip-btn${!isLockedEnvScene && this.cfg.enable_background && !this.cfg.pos_transparent_bg && this.cfg.pos_scene === fullKey ? " active" : ""}`,
        shortLbl
      );
      b.title = isLockedEnvScene
        ? `当前触手动作已自动禁用外部环境（连出其他普通体位时仍使用你原选的环境）`
        : fullKey;
      b.disabled = isLockedEnvScene || !this.cfg.enable_background || this.cfg.pos_transparent_bg;
      b.addEventListener("click", () => {
        this.cfg.pos_scene = fullKey;
        this.onCfgChanged();
        this.renderRightModeView();
      });
      r.appendChild(b);
    }
    return r;
  }

  private buildMultiAngleContextControls(): void {
    const activeMaTpl = MULTI_ANGLE_TEMPLATES[this.activeSceneId];
    const isForcedMaNsfw = Boolean(activeMaTpl?.force_nsfw);
    const hasMaBuiltinXray = Boolean(activeMaTpl?.builtin_xray);

    const r1 = this.el("div", "ctrl-inline-row");
    const btnNsfw = this.el(
      "button",
      `chip-btn${isForcedMaNsfw || this.cfg.enable_multi_angle_nsfw ? " active" : ""}`,
      isForcedMaNsfw ? "🔞 派生内置 R-18" : "🔞 开启 R-18 解剖 / MA7掰穴差分"
    );
    btnNsfw.disabled = isForcedMaNsfw;
    btnNsfw.addEventListener("click", () => {
      this.cfg.enable_multi_angle_nsfw = !this.cfg.enable_multi_angle_nsfw;
      this.onCfgChanged();
      this.renderRightModeView();
    });

    const btnXray = this.el(
      "button",
      `chip-btn${hasMaBuiltinXray || ((isForcedMaNsfw || this.cfg.enable_multi_angle_nsfw) && this.cfg.enable_uterus_xray) ? " active" : ""}`,
      "🔬 子宫透视"
    );
    btnXray.disabled = hasMaBuiltinXray || (!isForcedMaNsfw && !this.cfg.enable_multi_angle_nsfw);
    btnXray.addEventListener("click", () => {
      this.cfg.enable_uterus_xray = !this.cfg.enable_uterus_xray;
      this.onCfgChanged();
      this.renderRightModeView();
    });
    r1.append(btnNsfw, btnXray);

    // Row 1.5: MA7 2×2 Orthogonal Controls (腹型: 圆腹 / 平腹  ×  透视: 无透视 / 透视)
    const rMa7 = this.el("div", "ctrl-inline-row");
    rMa7.appendChild(this.el("span", "ctrl-tag-lbl", "MA7派生"));
    const isMa7DerivedActive =
      this.activeSceneId === "MA7A" ||
      this.activeSceneId === "MA7B" ||
      this.activeSceneId === "MA7C" ||
      this.activeSceneId === "MA7D";
    const curBelly: "round" | "flat" =
      this.activeSceneId === "MA7C" || this.activeSceneId === "MA7D" ? "flat" : "round";
    const curXray: boolean = this.activeSceneId === "MA7B" || this.activeSceneId === "MA7C";

    const resolveMa7Id = (belly: "round" | "flat", xray: boolean): "MA7A" | "MA7B" | "MA7C" | "MA7D" => {
      if (belly === "round") return xray ? "MA7B" : "MA7A";
      return xray ? "MA7C" : "MA7D";
    };

    const btnRound = this.el(
      "button",
      `chip-btn${isMa7DerivedActive && curBelly === "round" ? " active" : ""}`,
      "🤰 圆腹"
    );
    btnRound.title = "MA7 饱满圆腹版（再次点击可退出派生回到原版 MA7）";
    btnRound.addEventListener("click", () => {
      if (isMa7DerivedActive && curBelly === "round") {
        this.activeMa7Variant = "";
        this.selectScene("MA7");
      } else {
        const nextId = resolveMa7Id("round", isMa7DerivedActive ? curXray : false);
        this.activeMa7Variant = nextId;
        this.selectScene(nextId);
      }
    });

    const btnFlat = this.el(
      "button",
      `chip-btn${isMa7DerivedActive && curBelly === "flat" ? " active" : ""}`,
      "✨ 平腹"
    );
    btnFlat.title = "MA7 纤细平腹版（再次点击可退出派生回到原版 MA7）";
    btnFlat.addEventListener("click", () => {
      if (isMa7DerivedActive && curBelly === "flat") {
        this.activeMa7Variant = "";
        this.selectScene("MA7");
      } else {
        const nextId = resolveMa7Id("flat", isMa7DerivedActive ? curXray : false);
        this.activeMa7Variant = nextId;
        this.selectScene(nextId);
      }
    });

    const btnMa7Xray = this.el(
      "button",
      `chip-btn${isMa7DerivedActive && curXray ? " active" : ""}`,
      isMa7DerivedActive && curXray ? "🔬 透视 ON" : "🔬 透视 OFF"
    );
    btnMa7Xray.title = "独立切换 MA7 派生的内部透视窗（圆腹/平腹均可自由搭配透视或无透视）";
    btnMa7Xray.addEventListener("click", () => {
      const nextBelly = isMa7DerivedActive ? curBelly : "flat";
      const nextXray = isMa7DerivedActive ? !curXray : true;
      const nextId = resolveMa7Id(nextBelly, nextXray);
      this.activeMa7Variant = nextId;
      this.selectScene(nextId);
    });

    const btnFutaSpread = this.el(
      "button",
      `chip-btn${this.activeSceneId === "MA7E" ? " active" : ""}`,
      "⚡ 扶他双拨"
    );
    btnFutaSpread.title =
      "MA7 扶他专用双手分工双拨版（兼容有蛋/无蛋模式；再次点击退出派生回到原版 MA7）";
    btnFutaSpread.addEventListener("click", () => {
      if (this.activeSceneId === "MA7E") {
        this.activeMa7Variant = "";
        this.selectScene("MA7");
      } else {
        this.activeMa7Variant = "MA7E";
        this.selectScene("MA7E");
      }
    });

    rMa7.append(btnRound, btnFlat, btnMa7Xray, btnFutaSpread);

    const r2 = this.el("div", "ctrl-inline-row");
    const envSw = this.el(
      "button",
      `switch-pill${this.cfg.enable_background ? " on" : ""}`,
      this.cfg.enable_background ? "环境ON" : "环境OFF"
    );
    envSw.addEventListener("click", () => {
      this.cfg.enable_background = !this.cfg.enable_background;
      this.onCfgChanged();
      this.renderRightModeView();
    });
    r2.appendChild(envSw);

    const envShort: Array<[string, string]> = [
      ["🔄 随本幕/体位工具栏默认环境", "🔄随本幕"],
      ["🪟 晨光纱帘白床明亮卧室（bright window, curtains, sunlit bedroom, white bedsheet）", "🪟白床"],
      ["🌸 落樱浅滩水波·粉霞晴空焦散（shallow water, cherry blossoms, caustics, pink sky）", "🌸浅滩"],
      ["🗑️ 日式城市阴暗小巷·垃圾箱旁（alley, backstreet, trash can, garbage bag）", "🗑️后巷"],
      ["🪴 落地窗日光绿植 · 绒毛米色地毯木地板（furry beige rug, floor-to-ceiling window, potted plant）", "🪴绒毯"],
    ];
    for (const [fullKey, shortLbl] of envShort) {
      const b = this.el(
        "button",
        `chip-btn${this.cfg.enable_background && this.cfg.env_preset === fullKey ? " active" : ""}`,
        shortLbl
      );
      b.disabled = !this.cfg.enable_background;
      b.addEventListener("click", () => {
        this.cfg.env_preset = fullKey;
        this.onCfgChanged();
        this.renderRightModeView();
      });
      r2.appendChild(b);
    }

    this.elContextCtrlBox.append(r1, rMa7, r2);
  }

  private buildFreeContextControls(): void {
    const r1 = this.el("div", "ctrl-inline-row");
    const btnFreeNsfw = this.el(
      "button",
      `chip-btn${this.cfg.free_action_nsfw ? " active" : ""}`,
      "🔞 注入 R-18 与下半身解剖词条"
    );
    btnFreeNsfw.addEventListener("click", () => {
      this.cfg.free_action_nsfw = !this.cfg.free_action_nsfw;
      this.onCfgChanged();
      this.renderRightModeView();
    });

    const btnFreeXray = this.el(
      "button",
      `chip-btn${this.cfg.free_action_nsfw && this.cfg.enable_uterus_xray ? " active" : ""}`,
      "🔬 子宫透视"
    );
    btnFreeXray.disabled = !this.cfg.free_action_nsfw;
    btnFreeXray.addEventListener("click", () => {
      this.cfg.enable_uterus_xray = !this.cfg.enable_uterus_xray;
      this.onCfgChanged();
      this.renderRightModeView();
    });

    const btnTrans = this.el(
      "button",
      `chip-btn${this.cfg.pos_transparent_bg ? " active" : ""}`,
      "🏁 透明底"
    );
    btnTrans.addEventListener("click", () => {
      this.cfg.pos_transparent_bg = !this.cfg.pos_transparent_bg;
      this.onCfgChanged();
      this.renderRightModeView();
    });
    r1.append(btnFreeNsfw, btnFreeXray, btnTrans);
    this.elContextCtrlBox.append(r1, this.buildPosSceneRow());
  }

  private buildPoseFilterControls(): void {
    const searchRow = this.el("div", "pose-search-row");
    const searchInp = this.el("input") as HTMLInputElement;
    searchInp.type = "text";
    searchInp.placeholder = "🔍 搜索体位编号或关键词 (如 P22 / 蛙式 / 骑乘)...";
    searchInp.value = this.posSearchQuery;
    searchInp.addEventListener("input", () => {
      this.posSearchQuery = searchInp.value.trim();
      this.renderPoseCards();
    });

    const btnCheckCat = this.el("button", "btn btn-xs", "☑️全选");
    btnCheckCat.title = "勾选当前筛选下的全部体位以便批量连出";
    btnCheckCat.addEventListener("click", () => {
      for (const ch of this.getFilteredPositionChapters()) {
        this.checkedPositionIds.add(ch.id);
      }
      this.renderPoseCards();
    });

    const btnClearChk = this.el("button", "btn btn-xs", "清空");
    btnClearChk.addEventListener("click", () => {
      this.checkedPositionIds.clear();
      this.renderPoseCards();
    });

    this.elBatchCheckedBtn = this.el("button", "btn btn-xs btn-primary", "🚀 连出勾选");
    this.elBatchCheckedBtn.addEventListener("click", () => this.runCheckedBatch());

    searchRow.append(searchInp, btnCheckCat, btnClearChk, this.elBatchCheckedBtn);

    const catScroll = this.el("div", "cat-pills-scroll");
    const shortCatLabel = (c: string) =>
      c === "全部体位 (All)" ? `全部 (${ALL_POSITIONS_CHAPTERS.length})` : c.split("·")[0]?.trim() || c;
    for (const cat of POS_CATEGORIES) {
      const b = this.el(
        "button",
        `chip-btn${this.activePosCategory === cat ? " active" : ""}`,
        shortCatLabel(cat)
      );
      b.style.flexShrink = "0";
      b.title = cat;
      b.addEventListener("click", () => {
        this.activePosCategory = cat;
        if (cat !== "全部体位 (All)") {
          const curCat = ALL_POSITIONS_TEMPLATES[this.activeSceneId]?.category;
          if (curCat !== cat) {
            const firstMatch = ALL_POSITIONS_CHAPTERS.find((ch) => ch.category === cat);
            if (firstMatch) {
              this.selectScene(firstMatch.id);
            }
          }
        }
        this.buildPoseFilterControlsReset();
        this.renderPoseCards();
      });
      catScroll.appendChild(b);
    }

    this.elPoseFilterBar.append(searchRow, catScroll);
    this.updateBatchCheckedButton();
  }

  private buildPoseFilterControlsReset(): void {
    this.elPoseFilterBar.innerHTML = "";
    this.buildPoseFilterControls();
  }

  private buildMultiAngleFilterControls(): void {
    const row = this.el("div", "pose-search-row");
    row.appendChild(this.el("span", "insp-summary", "MA0 三视图设定表 + MA1~MA10 多机位日常立绘"));
    const spacer = this.el("div");
    spacer.style.flex = "1";
    const btnAll = this.el("button", "btn btn-xs", "☑️全选");
    btnAll.addEventListener("click", () => {
      for (const ch of MULTI_ANGLE_CHAPTERS) this.checkedMultiAngleIds.add(ch.id);
      this.renderPoseCards();
    });
    const btnClr = this.el("button", "btn btn-xs", "清空");
    btnClr.addEventListener("click", () => {
      this.checkedMultiAngleIds.clear();
      this.renderPoseCards();
    });
    this.elBatchCheckedBtn = this.el("button", "btn btn-xs btn-primary", "🚀 连出勾选");
    this.elBatchCheckedBtn.addEventListener("click", () => this.runCheckedBatch());
    row.append(spacer, btnAll, btnClr, this.elBatchCheckedBtn);
    this.elPoseFilterBar.appendChild(row);
    this.updateBatchCheckedButton();
  }

  private getFilteredPositionChapters() {
    const q = this.posSearchQuery.toLowerCase();
    return ALL_POSITIONS_CHAPTERS.filter((ch) => {
      const catOk =
        this.activePosCategory === "全部体位 (All)" || ch.category === this.activePosCategory;
      if (!catOk) return false;
      if (!q) return true;
      return ch.id.toLowerCase().includes(q) || ch.title.toLowerCase().includes(q);
    });
  }

  private renderPoseCards(): void {
    this.elPoseListWrap.innerHTML = "";
    const isPos = this.actionMode === "positions";
    const items = isPos ? this.getFilteredPositionChapters() : MULTI_ANGLE_CHAPTERS;
    const checkedSet = isPos ? this.checkedPositionIds : this.checkedMultiAngleIds;

    if (items.length === 0) {
      this.elPoseListWrap.appendChild(
        this.el("div", "vibe-note", "未找到匹配的动作词条，请尝试其他关键词或切换分类。")
      );
      this.updateBatchCheckedButton();
      return;
    }

    for (const ch of items) {
      const isSelectedCard =
        this.activeSceneId === ch.id ||
        (!isPos && ch.id === "MA7" && this.activeSceneId.startsWith("MA7"));
      const card = this.el("div", `pose-card${isSelectedCard ? " selected" : ""}`);

      const chk = this.el("input") as HTMLInputElement;
      chk.type = "checkbox";
      chk.checked = checkedSet.has(ch.id);
      chk.addEventListener("click", (ev) => ev.stopPropagation());
      chk.addEventListener("change", () => {
        if (chk.checked) checkedSet.add(ch.id);
        else checkedSet.delete(ch.id);
        this.updateBatchCheckedButton();
      });

      const idBadge = this.el("span", "pose-id-badge", ch.id);
      const { main, sub } = splitPoseTitle(ch.title);
      const titleCol = this.el("div", "pose-title-col");
      titleCol.appendChild(this.el("span", "pose-main-title", main));
      if (sub) {
        titleCol.appendChild(this.el("span", "pose-sub-title", sub));
      }

      const resolveMaId = (rawId: string) =>
        !isPos && rawId === "MA7" && this.activeMa7Variant ? this.activeMa7Variant : rawId;

      const rowActs = this.el("div", "pose-row-actions");
      const btnRandRun = this.el("button", "btn btn-xs btn-icon", "🎲");
      btnRandRun.title = "强制使用新随机 Seed 生成此动作";
      btnRandRun.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const effId = resolveMaId(ch.id);
        this.selectScene(effId);
        const count = this.apiSettings.batch_count || 1;
        void this.runGenerationQueue(
          Array.from({ length: count }, () => ({
            sceneId: effId,
            forceRandomSeed: true,
          }))
        );
      });

      const btnRun = this.el("button", "btn btn-xs btn-primary", "⚡生图");
      btnRun.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const effId = resolveMaId(ch.id);
        this.selectScene(effId);
        const count = this.apiSettings.batch_count || 1;
        void this.runGenerationQueue(
          Array.from({ length: count }, () => ({
            sceneId: effId,
          }))
        );
      });
      rowActs.append(btnRandRun, btnRun);

      card.addEventListener("click", () => {
        if (!isPos && ch.id === "MA7") {
          this.selectScene(this.activeMa7Variant || "MA7");
        } else {
          this.selectScene(ch.id);
        }
      });

      card.append(chk, idBadge, titleCol, rowActs);
      this.elPoseListWrap.appendChild(card);
    }

    this.updateBatchCheckedButton();
  }

  private selectScene(sceneId: string): void {
    const prevId = this.activeSceneId;
    this.activeSceneId = sceneId;
    if (
      sceneId === "MA7A" ||
      sceneId === "MA7B" ||
      sceneId === "MA7C" ||
      sceneId === "MA7D" ||
      sceneId === "MA7E"
    ) {
      this.activeMa7Variant = sceneId;
    }
    this.isManualPromptEdited = false;
    for (const card of Array.from(this.elPoseListWrap.children)) {
      const badge = card.querySelector(".pose-id-badge");
      const bid = badge?.textContent || "";
      card.classList.toggle(
        "selected",
        bid === sceneId || (bid === "MA7" && sceneId.startsWith("MA7"))
      );
    }
    if (this.actionMode === "positions") {
      const prevTpl = ALL_POSITIONS_TEMPLATES[prevId];
      const nextTpl = ALL_POSITIONS_TEMPLATES[sceneId];
      if (
        Boolean(prevTpl?.lock_scene_env) !== Boolean(nextTpl?.lock_scene_env) ||
        prevTpl?.channel !== nextTpl?.channel ||
        Boolean(prevTpl?.builtin_xray) !== Boolean(nextTpl?.builtin_xray)
      ) {
        this.elContextCtrlBox.innerHTML = "";
        this.buildPositionsContextControls();
      }
    } else if (this.actionMode === "multi_angle") {
      this.elContextCtrlBox.innerHTML = "";
      this.buildMultiAngleContextControls();
    }
    this.refreshSceneAndPrompt();
  }

  private updateBatchCheckedButton(): void {
    if (!this.elBatchCheckedBtn) return;
    const set =
      this.actionMode === "positions" ? this.checkedPositionIds : this.checkedMultiAngleIds;
    const n = set.size;
    this.elBatchCheckedBtn.textContent = `🚀 连出勾选 (${n})`;
    this.elBatchCheckedBtn.disabled = n === 0 || this.isGenerating;
  }

  private runCheckedBatch(): void {
    const orderedIds =
      this.actionMode === "positions"
        ? ALL_POSITIONS_CHAPTERS.filter((c) => this.checkedPositionIds.has(c.id)).map((c) => c.id)
        : MULTI_ANGLE_CHAPTERS.filter((c) => this.checkedMultiAngleIds.has(c.id)).map((c) =>
            c.id === "MA7" && this.activeMa7Variant ? this.activeMa7Variant : c.id
          );
    if (orderedIds.length === 0) return;
    const repeats = this.apiSettings.batch_count || 1;
    const queue: Array<{ sceneId: string }> = [];
    for (const id of orderedIds) {
      for (let r = 0; r < repeats; r++) {
        queue.push({ sceneId: id });
      }
    }
    void this.runGenerationQueue(queue);
  }

  private buildFreeActionPanel(): HTMLElement {
    const wrap = this.el("div", "free-action-panel");

    const starterBox = this.el("div", "field-row");
    starterBox.appendChild(this.el("label", "", "⚡ 一键填入起手动作模板（自动继承左侧人设+穿搭+画风+Vibe）"));
    const chips = this.el("div", "chip-wrap");
    for (const st of FREE_ACTION_STARTERS) {
      const c = this.el("button", "chip-btn", st.label);
      c.addEventListener("click", () => {
        this.cfg.free_action_tags = st.tags;
        this.cfg.free_action_prose = st.prose;
        if (st.nsfw !== undefined) {
          this.cfg.free_action_nsfw = st.nsfw;
        }
        this.isManualPromptEdited = false;
        this.syncAllControls();
        this.renderRightModeView();
        this.refreshSceneAndPrompt();
      });
      chips.appendChild(c);
    }
    starterBox.appendChild(chips);

    const tagRow = this.el("div", "field-row");
    tagRow.appendChild(
      this.el("label", "", "✍️ 自由动作与构图 Danbooru Tags（无需重复写角色/服装/画风）")
    );
    const tagArea = this.el("textarea") as HTMLTextAreaElement;
    tagArea.placeholder =
      "例如: cowboy shot, sitting on chair, crossed legs, holding teacup, gentle smile, looking at viewer";
    tagArea.addEventListener("input", () => {
      this.cfg.free_action_tags = tagArea.value;
      this.isManualPromptEdited = false;
      this.onCfgChanged();
    });
    this.syncHooks.push(() => {
      if (tagArea.value !== this.cfg.free_action_tags) {
        tagArea.value = this.cfg.free_action_tags;
      }
    });
    tagRow.appendChild(tagArea);

    const proseRow = this.el("div", "field-row");
    proseRow.appendChild(this.el("label", "", "📖 可选 T5 自然语言动作补充句（留空自动生成简短角色场景句）"));
    const proseInp = this.el("input") as HTMLInputElement;
    proseInp.type = "text";
    proseInp.placeholder = "例如: sitting gracefully while holding a warm teacup...";
    proseInp.addEventListener("input", () => {
      this.cfg.free_action_prose = proseInp.value;
      this.isManualPromptEdited = false;
      this.onCfgChanged();
    });
    this.syncHooks.push(() => {
      if (proseInp.value !== this.cfg.free_action_prose) {
        proseInp.value = this.cfg.free_action_prose;
      }
    });
    proseRow.appendChild(proseInp);

    const btnRunFree = this.el("button", "btn btn-generate-hero", "🚀 用当前自由手写动作生图");
    btnRunFree.style.width = "100%";
    btnRunFree.addEventListener("click", () => {
      const count = this.apiSettings.batch_count || 1;
      void this.runGenerationQueue(
        Array.from({ length: count }, () => ({
          sceneId: "FREE",
          useManualPrompt: this.isManualPromptEdited,
        }))
      );
    });

    wrap.append(starterBox, tagRow, proseRow, btnRunFree);
    return wrap;
  }

  // ===========================================================================
  // FLOATING POPOVERS: SAVE PRESET / EXPRESSION / 3D CAMERA RADAR
  // ===========================================================================
  private closeAllPopovers(): void {
    this.elMcpPopover?.classList.add("hidden");
    this.elSavePresetPopover?.classList.add("hidden");
    this.elExprPopover?.classList.add("hidden");
  }

  private buildMcpPopover(): HTMLElement {
    const pop = this.el("div", "floating-popover hidden");
    pop.style.width = "360px";
    pop.addEventListener("click", (ev) => ev.stopPropagation());

    const head = this.el("div", "popover-head");
    head.appendChild(this.el("span", "", "🔌 MCP 实时控制与局域网/远程连接"));
    const rightActs = this.el("div", "topbar-group");
    this.elMcpPopSwitch = this.el("button", "switch-pill on", "已启用 ON");
    this.elMcpPopSwitch.addEventListener("click", () => {
      const next = !this.mcpBridge.isEnabled();
      saveMcpBridgeEnabled(next);
      this.mcpBridge.setEnabled(next);
      this.syncMcpPill(this.mcpBridge.getStatus());
    });
    const btnClose = this.el("button", "btn btn-xs btn-icon", "✕");
    btnClose.addEventListener("click", () => pop.classList.add("hidden"));
    rightActs.append(this.elMcpPopSwitch, btnClose);
    head.appendChild(rightActs);

    this.elMcpPopStatusNote = this.el("div", "vibe-note", "");

    const epRow = this.el("div", "field-row");
    epRow.appendChild(
      this.el("label", "", "MCP 服务地址（支持局域网 IP:17890 / ws:// / wss://，留空自动识别）")
    );
    this.elMcpEndpointInput = this.el("input") as HTMLInputElement;
    this.elMcpEndpointInput.type = "text";
    this.elMcpEndpointInput.placeholder = "留空自动 (http直开跟随当前IP，本地file默认127.0.0.1:17890)";
    epRow.appendChild(this.elMcpEndpointInput);

    const applyEndpoint = (val: string) => {
      saveMcpBridgeEndpoint(val);
      if (!this.mcpBridge.isEnabled()) {
        saveMcpBridgeEnabled(true);
        this.mcpBridge.setEnabled(true);
      }
      this.mcpBridge.setCustomEndpoint(val);
      this.syncMcpPill(this.mcpBridge.getStatus());
      const resolved = this.mcpBridge.getResolvedEndpoints();
      this.setStatus(`🔌 MCP 目标地址已设为：${resolved.wsUrl}`);
    };

    this.elMcpEndpointInput.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") applyEndpoint(this.elMcpEndpointInput.value);
    });

    const btnRow = this.el("div", "topbar-group");
    const btnApply = this.el("button", "btn btn-xs btn-primary", "💾 保存并重连");
    btnApply.style.flex = "1";
    btnApply.addEventListener("click", () => applyEndpoint(this.elMcpEndpointInput.value));

    const btnAuto = this.el("button", "btn btn-xs", "↺ 恢复自动识别");
    btnAuto.addEventListener("click", () => {
      this.elMcpEndpointInput.value = "";
      applyEndpoint("");
    });
    btnRow.append(btnApply, btnAuto);

    const tip = this.el(
      "div",
      "vibe-note",
      "提示：手机/平板或其他电脑可直接浏览器访问 http://<本机局域网IP>:17890 打开工作台并自动连上 MCP；若用本地 HTML 文件跨设备打开，在此填入电脑 IP:17890 即可。"
    );

    pop.append(head, this.elMcpPopStatusNote, epRow, btnRow, tip);
    return pop;
  }

  private togglePopover(pop: HTMLElement, anchor: HTMLElement): void {
    const wasHidden = pop.classList.contains("hidden");
    this.closeAllPopovers();
    if (!wasHidden) return;
    pop.classList.remove("hidden");
    if (window.innerWidth <= 768) {
      pop.style.left = "8px";
      pop.style.right = "8px";
      pop.style.width = "auto";
      pop.style.top = "auto";
      pop.style.bottom = "calc(58px + env(safe-area-inset-bottom, 0px))";
      return;
    }
    pop.style.right = "";
    pop.style.bottom = "";
    const rect = anchor.getBoundingClientRect();
    const popW = Math.min(420, window.innerWidth - 20);
    const left = Math.max(10, Math.min(rect.left, window.innerWidth - popW - 10));
    const measuredH = Math.min(pop.offsetHeight || 360, window.innerHeight - 70);
    const top = Math.min(rect.bottom + 6, window.innerHeight - measuredH - 12);
    pop.style.left = `${left}px`;
    pop.style.top = `${Math.max(54, top)}px`;
  }

  private buildSavePresetPopover(): HTMLElement {
    const pop = this.el("div", "floating-popover hidden");
    pop.style.width = "320px";
    pop.addEventListener("click", (ev) => ev.stopPropagation());

    const head = this.el("div", "popover-head");
    head.appendChild(this.el("span", "", "💾 保存为自定义角色预设"));
    const btnClose = this.el("button", "btn btn-xs btn-icon", "✕");
    btnClose.addEventListener("click", () => pop.classList.add("hidden"));
    head.appendChild(btnClose);

    const row = this.el("div", "field-row");
    row.appendChild(this.el("label", "", "预设名称（保存当前人设、体型、穿搭与画风配置）"));
    this.elSavePresetInput = this.el("input") as HTMLInputElement;
    this.elSavePresetInput.type = "text";
    this.elSavePresetInput.placeholder = "输入预设名...";
    row.appendChild(this.elSavePresetInput);

    const doSave = () => {
      const rawName = this.elSavePresetInput.value.trim();
      if (!rawName) return;
      const finalName = rawName.startsWith("⭐") ? rawName : `⭐ ${rawName}`;
      unmarkPresetDeleted(finalName);
      this.cfg.preset_name = finalName;
      this.customPresets[finalName] = { ...this.cfg };
      saveCustomPresets(this.customPresets);
      saveActiveConfig(this.cfg);
      this.populatePresetSelect();
      pop.classList.add("hidden");
      this.setStatus(`💾 已保存预设「${finalName}」`);
    };

    this.elSavePresetInput.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") doSave();
    });

    const btnConfirm = this.el("button", "btn btn-primary", "💾 确认保存");
    btnConfirm.addEventListener("click", doSave);

    pop.append(head, row, btnConfirm);
    return pop;
  }

  private buildExpressionPopover(): HTMLElement {
    const pop = this.el("div", "floating-popover hidden");
    pop.addEventListener("click", (ev) => ev.stopPropagation());

    const head = this.el("div", "popover-head");
    head.appendChild(this.el("span", "", "😊 全局表情覆写与五官微调"));
    const rightActs = this.el("div", "topbar-group");
    const btnResetExpr = this.el("button", "btn btn-xs", "↺ 恢复默认");
    btnResetExpr.addEventListener("click", () => {
      this.cfg.expr_preset = "🔄 随本幕剧情默认（保留原幕微表情与熟睡/半醒节奏）";
      this.cfg.expr_eye_state = "随表情预设默认";
      this.cfg.expr_mouth_state = "随表情预设默认";
      this.cfg.expr_brow_blush = "随表情预设默认";
      this.cfg.expr_heart_eyes = false;
      this.cfg.expr_empty_eyes = false;
      this.cfg.expr_tears = false;
      this.cfg.custom_expression_tags = "";
      this.onCfgChanged();
    });
    const btnClose = this.el("button", "btn btn-xs btn-icon", "✕");
    btnClose.addEventListener("click", () => pop.classList.add("hidden"));
    rightActs.append(btnResetExpr, btnClose);
    head.appendChild(rightActs);

    // Quick Emotion Chips
    const quickChips = this.el("div", "chip-wrap");
    for (const [fullKey, info] of Object.entries(EXPRESSION_PRESETS)) {
      const label = info.code === "auto" ? "🔄 随动作默认" : info.short || compactOptionText(fullKey, 14);
      const b = this.el("button", "chip-btn", label);
      b.title = fullKey;
      b.addEventListener("click", () => {
        this.cfg.expr_preset = fullKey;
        this.onCfgChanged();
      });
      this.syncHooks.push(() => {
        b.classList.toggle("active", this.cfg.expr_preset === fullKey);
      });
      quickChips.appendChild(b);
    }

    const detailGrid = this.el("div", "grid-2");
    detailGrid.append(
      this.bindCfgSelect("眼部覆写", "expr_eye_state", Object.keys(EXPRESSION_EYE_PRESETS)),
      this.bindCfgSelect("嘴型覆写", "expr_mouth_state", Object.keys(EXPRESSION_MOUTH_PRESETS))
    );

    const blushRow = this.bindCfgSelect(
      "眉眼红晕",
      "expr_brow_blush",
      Object.keys(EXPRESSION_BLUSH_PRESETS)
    );

    const pupilChips = this.el("div", "chip-wrap");
    const pDefs: Array<[keyof CharacterConfig, string]> = [
      ["expr_heart_eyes", "💖 爱心瞳"],
      ["expr_empty_eyes", "🖤 空洞失神瞳"],
      ["expr_tears", "😭 眼角带泪"],
    ];
    for (const [k, lbl] of pDefs) {
      const c = this.el("button", "chip-btn", lbl);
      c.addEventListener("click", () => {
        (this.cfg[k] as unknown as boolean) = !this.cfg[k];
        this.onCfgChanged();
      });
      this.syncHooks.push(() => {
        c.classList.toggle("active", Boolean(this.cfg[k]));
      });
      pupilChips.appendChild(c);
    }

    pop.append(
      head,
      quickChips,
      detailGrid,
      blushRow,
      pupilChips,
      this.bindCfgText("附加表情 Tag", "custom_expression_tags", "如 tongue out, drooling...")
    );
    return pop;
  }

  // ===========================================================================
  // FULLSCREEN CAROUSEL LIGHTBOX (Mutually Exclusive Modes + Auto-2x Invariant)
  // ===========================================================================
  private buildLightbox(): HTMLElement {
    const overlay = this.el("div", "lightbox-overlay hidden");
    const top = this.el("div", "lightbox-topbar");
    const headRow = this.el("div", "lightbox-head-row");
    this.elLightboxMeta = this.el("div", "stage-meta", "");

    const btnLbClose = this.el("button", "btn btn-xs btn-danger lightbox-close-btn", "✕ 退出全屏");
    btnLbClose.addEventListener("click", () => this.closeLightbox());
    headRow.append(this.elLightboxMeta, btnLbClose);

    const ctrls = this.el("div", "lightbox-ctrls");
    const modeSeg = this.el("div", "seg-group");
    const cModes: Array<[CarouselMode, string]> = [
      ["manual", "✋ 手动"],
      ["follow_latest", "⚡ 跟随最新"],
      ["timed", "⏱️ 轮播"],
    ];
    this.elLightboxModeBtns.clear();
    for (const [cm, lbl] of cModes) {
      const b = this.el("button", "seg-btn", lbl);
      b.addEventListener("click", () => this.setCarouselMode(cm));
      this.elLightboxModeBtns.set(cm, b);
      modeSeg.appendChild(b);
    }

    const intSel = this.el("select", "batch-select");
    for (const sec of [2, 3, 4, 6, 8]) {
      const o = this.el("option", "", `${sec}秒/张`);
      o.value = String(sec);
      intSel.appendChild(o);
    }
    intSel.value = String(this.apiSettings.carousel_interval_sec || 4);
    intSel.addEventListener("change", () => {
      this.apiSettings.carousel_interval_sec = parseInt(intSel.value, 10) || 4;
      saveApiSettings(this.apiSettings);
      if (this.carouselMode === "timed") this.restartCarouselTimer();
    });

    const btnLbUpscale = this.el("button", "btn btn-xs btn-primary", "✨ 2x放大");
    btnLbUpscale.addEventListener("click", () => {
      this.selectedGalleryIdx = this.lightboxIdx;
      void this.upscaleSelectedGalleryImage();
    });

    const btnLbDl = this.el("button", "btn btn-xs", "💾 下载");
    btnLbDl.addEventListener("click", () => {
      const rec = this.gallery[this.lightboxIdx];
      if (rec) triggerBytesDownload(rec.bytes, rec.filename);
    });

    ctrls.append(modeSeg, intSel, btnLbUpscale, btnLbDl);
    top.append(headRow, ctrls);

    const stage = this.el("div", "lightbox-stage");
    stage.addEventListener("click", (ev) => {
      if (ev.target === stage) {
        this.closeLightbox();
      }
    });
    const btnPrev = this.el("button", "lightbox-nav-btn prev", "‹");
    btnPrev.addEventListener("click", (ev) => {
      ev.stopPropagation();
      this.stepLightbox(-1, true);
    });
    this.elLightboxImg = document.createElement("img");
    const btnNext = this.el("button", "lightbox-nav-btn next", "›");
    btnNext.addEventListener("click", (ev) => {
      ev.stopPropagation();
      this.stepLightbox(1, true);
    });
    stage.append(btnPrev, this.elLightboxImg, btnNext);

    overlay.append(top, stage);
    return overlay;
  }

  private setCarouselMode(mode: CarouselMode): void {
    this.carouselMode = mode;
    if (mode === "follow_latest" || mode === "timed") {
      this.apiSettings.carousel_auto_mode = mode;
      saveApiSettings(this.apiSettings);
    }
    for (const [m, b] of this.elLightboxModeBtns.entries()) {
      b.classList.toggle("active", m === mode);
    }
    this.restartCarouselTimer();
  }

  private restartCarouselTimer(): void {
    if (this.carouselTimer !== null) {
      window.clearInterval(this.carouselTimer);
      this.carouselTimer = null;
    }
    if (this.lightboxOpen && this.carouselMode === "timed" && this.gallery.length > 1) {
      const ms = (this.apiSettings.carousel_interval_sec || 4) * 1000;
      this.carouselTimer = window.setInterval(() => {
        this.stepLightbox(1, false);
      }, ms);
    }
  }

  private openLightbox(idx: number, autoMode?: CarouselMode): void {
    if (this.gallery.length === 0) return;
    this.lightboxOpen = true;
    this.lightboxIdx = Math.max(0, Math.min(this.gallery.length - 1, idx));
    this.elLightbox.classList.remove("hidden");
    this.setCarouselMode(autoMode ?? this.carouselMode);
    this.renderLightboxFrame();
  }

  private closeLightbox(): void {
    this.lightboxOpen = false;
    this.elLightbox.classList.add("hidden");
    if (this.carouselTimer !== null) {
      window.clearInterval(this.carouselTimer);
      this.carouselTimer = null;
    }
  }

  private stepLightbox(delta: number, isManualUserClick: boolean): void {
    if (this.gallery.length === 0) return;
    if (isManualUserClick && this.carouselMode !== "manual") {
      this.setCarouselMode("manual");
    }
    this.lightboxIdx = (this.lightboxIdx + delta + this.gallery.length) % this.gallery.length;
    this.renderLightboxFrame();
  }

  private renderLightboxFrame(): void {
    if (!this.lightboxOpen || this.gallery.length === 0) return;
    const rec = this.gallery[this.lightboxIdx];
    if (!rec) return;
    this.elLightboxImg.src = rec.objectUrl;
    this.elLightboxMeta.textContent = `[${this.lightboxIdx + 1}/${this.gallery.length}] ${rec.scene_id} · ${rec.width}×${rec.height}${rec.is_upscaled ? " (2x HD)" : ""} · Seed ${rec.seed}`;
  }

  // ===========================================================================
  // STATE SYNCHRONIZATION & PROMPT ENGINE REFRESH
  // ===========================================================================
  private onCfgChanged(): void {
    this.isManualPromptEdited = false;
    saveActiveConfig(this.cfg);
    this.syncAllControls();
    this.refreshSceneAndPrompt();
    this.updateQuotaPill();
  }

  private syncAllControls(): void {
    for (const fn of this.syncHooks) fn();
    this.syncCardSummariesAndSwitches();
    this.syncApiControls();
    this.syncVibeUI();
    this.syncOverrideTriggers();
    this.syncStageToolbar();
    this.syncMountButton();
    this.updateQuotaPill();
  }

  private syncCardSummariesAndSwitches(): void {
    const idOn = Boolean(this.cfg.enable_identity);
    this.elIdentityCard.classList.toggle("muted", !idOn);
    this.elIdentitySwitch.classList.toggle("on", idOn);
    this.elIdentitySwitch.textContent = idOn ? "ON" : "OFF";
    const gMode = this.cfg.gender_mode ?? "normal";
    const gSuffix =
      gMode === "femboy"
        ? " · 🎀伪娘"
        : gMode === "futa_no_balls"
          ? " · ⚡扶他无蛋"
          : gMode === "futa_with_balls"
            ? " · ⚡扶他有蛋"
            : "";
    this.elIdentitySummary.textContent = idOn
      ? `${this.cfg.eng_name || this.cfg.char_tag}${gSuffix}`
      : "已关闭人物词";

    const outOn = Boolean(this.cfg.enable_outfit);
    this.elOutfitCard.classList.toggle("muted", !outOn);
    this.elOutfitSwitch.classList.toggle("on", outOn);
    this.elOutfitSwitch.textContent = outOn ? "ON" : "OFF";
    this.elOutfitSummary.textContent = outOn
      ? compactOptionText(this.cfg.outfit_preset, 16)
      : "不加服装词";

    const anatOn = Boolean(this.cfg.enable_anatomy);
    this.elAnatomyCard.classList.toggle("muted", !anatOn);
    this.elAnatomySwitch.classList.toggle("on", anatOn);
    this.elAnatomySwitch.textContent = anatOn ? "ON" : "OFF";
    this.elAnatomySummary.textContent = anatOn
      ? `${this.cfg.morph_preset.slice(0, 8)} · ${this.cfg.pigment_preset.slice(0, 6)}`
      : "基础默认";

    const styleOn = Boolean(this.cfg.enable_style);
    const isV45 = this.apiSettings.model === MODEL_V4_5_FULL;
    this.elStyleCard.classList.toggle("muted", !styleOn);
    this.elStyleCardTitle.textContent = isV45 ? "🎨 画风 · 光影 · Vibe" : "🎨 画风与光影";
    const mobileLeftBtn = this.elMobileBtns.get("left");
    if (mobileLeftBtn) {
      mobileLeftBtn.textContent = isV45 ? "👤 人设·画风·Vibe" : "👤 人设·画风";
    }
    this.elStyleSwitch.classList.toggle("on", styleOn);
    this.elStyleSwitch.textContent = styleOn ? "ON" : "OFF";
    const activeVibeCount = isV45 ? this.getActiveVibeSlots().length : 0;
    this.elStyleSummary.textContent =
      activeVibeCount > 0 ? `+${activeVibeCount}槽Vibe` : compactOptionText(this.cfg.style_preset, 14);
  }

  private syncApiControls(): void {
    const m = this.apiSettings.model;
    for (const [mId, b] of this.elModelBtns.entries()) {
      b.classList.toggle("active", mId === m);
    }
    this.elCanvasSelect.value = this.apiSettings.canvas_preset;
    this.elSeedInput.value = String(this.apiSettings.seed);
    this.elBatchSelect.value = String(this.apiSettings.batch_count || 1);

    const isV5Med = m === MODEL_V5_FULL_MEDIUM;
    const effSteps = isV5Med ? 14 : this.apiSettings.steps;
    this.elStepsRange.value = String(effSteps);
    this.elStepsNum.value = String(effSteps);
    this.elStepsRange.disabled = isV5Med;
    this.elStepsNum.disabled = isV5Med;
    this.elStepsHint.textContent = isV5Med
      ? "Steps: 14 (V5 Medium 固定蒸馏步数)"
      : m === MODEL_V4_5_FULL
        ? `Steps: ${effSteps}${effSteps <= 28 ? " (Opus 真无限 0 点)" : " (>28步计费)"}`
        : `Steps: ${effSteps}${effSteps <= 28 ? " (Opus 走恢复池)" : " (>28步计费)"}`;

    this.elScaleRange.value = String(this.apiSettings.scale);
    this.elScaleNum.value = this.apiSettings.scale.toFixed(1);
    this.elRescaleRange.value = String(this.apiSettings.cfg_rescale);
    this.elRescaleNum.value = this.apiSettings.cfg_rescale.toFixed(2);
    this.elRescaleRange.disabled = isV5Med;
    this.elRescaleNum.disabled = isV5Med;

    this.elUcModeSelect.value = isV5Med ? "heavy" : this.apiSettings.uc_preset_mode;
    this.elUcModeSelect.disabled = isV5Med;

    this.elApiSummary.textContent = this.apiSettings.api_token.trim()
      ? `${effSteps}步 · UC:${this.elUcModeSelect.value}`
      : "⚠️ 待填Token";
  }

  private syncOverrideTriggers(): void {
    const exprActive = isExpressionOverrideActive(this.cfg);
    const exprShort = describeExpressionShort(this.cfg);
    this.elExprTrigger.classList.toggle("active", exprActive);
    this.elExprTrigger.innerHTML = "";
    this.elExprTrigger.append(
      this.el("span", "", `😊 表情: ${exprActive ? exprShort : "随动作默认"}`),
      this.el("span", "", "▾")
    );
  }

  private syncStageToolbar(): void {
    this.elAutoUpscaleBtn.classList.toggle("active", Boolean(this.apiSettings.auto_upscale_replace));
    this.elAutoCarouselBtn.classList.toggle(
      "active",
      Boolean(this.apiSettings.auto_fullscreen_carousel)
    );
    const rec = this.gallery[this.selectedGalleryIdx];
    this.elUpscaleBtn.disabled = !rec || Boolean(rec.is_upscaled) || this.isGenerating;
  }

  private syncMountButton(): void {
    const name = getMountedDirName();
    if (name) {
      this.elMountBtn.textContent = `📂 ${name} ✓`;
      this.elMountBtn.classList.add("btn-success");
    } else {
      this.elMountBtn.textContent = "📂 挂载目录";
      this.elMountBtn.classList.remove("btn-success");
    }
  }

  private setModel(nextModel: NaiModelId): void {
    const prev = this.apiSettings.model;
    this.apiSettings.model = nextModel;
    if (prev !== nextModel) {
      const curScale = Number(this.apiSettings.scale.toFixed(1));
      if ((nextModel === MODEL_V4_5_FULL || nextModel === MODEL_V5_FULL) && curScale === 6.0) {
        this.apiSettings.scale = 7.0;
      } else if (nextModel === MODEL_V5_FULL_MEDIUM && curScale === 7.0) {
        this.apiSettings.scale = 6.0;
      }
    }
    saveApiSettings(this.apiSettings);
    this.syncAllControls();
    this.refreshSceneAndPrompt();
    this.updateQuotaPill();
  }

  // ===========================================================================
  // VIBE TRANSFER MANAGEMENT
  // ===========================================================================
  private getActiveVibeSlots(): VibeTransferSlotInput[] {
    return buildActiveVibeSlotsForModel(
      this.vibeItems,
      this.apiSettings.model,
      this.apiSettings.vibe_transfer_enabled
    );
  }

  private syncVibeUI(): void {
    const isV45 = this.apiSettings.model === MODEL_V4_5_FULL;
    if (this.elVibePanel) {
      this.elVibePanel.style.display = isV45 ? "flex" : "none";
    }
    if (!isV45) {
      this.syncCardSummariesAndSwitches();
      this.updateQuotaPill();
      return;
    }

    const masterOn = Boolean(this.apiSettings.vibe_transfer_enabled);
    this.elVibeSwitch.classList.toggle("on", masterOn);
    this.elVibeSwitch.textContent = masterOn ? "ON" : "暂停";
    this.elVibeNormChk.checked = Boolean(this.apiSettings.vibe_normalize_strength);
    this.elVibeNormWrap.style.display = this.vibeItems.length >= 2 ? "flex" : "none";

    this.elVibeSlotList.innerHTML = "";
    for (const item of this.vibeItems) {
      const resolved = resolveVibeEncodingForModel(item, this.apiSettings.model);
      const row = this.el("div", `vibe-slot-item${!item.enabled || !masterOn ? " off" : ""}`);

      const thumb = document.createElement("img");
      thumb.className = "vibe-thumb";
      if (item.thumbnailDataUrl) {
        thumb.src = item.thumbnailDataUrl;
      } else if (item.rawImageBase64) {
        thumb.src = `data:image/png;base64,${item.rawImageBase64}`;
      }

      const main = this.el("div", "vibe-slot-main");
      const titleLbl = this.el(
        "div",
        "vibe-slot-name",
        `${item.name} · IE ${(resolved?.informationExtracted ?? item.informationExtracted).toFixed(2)}`
      );
      const sRow = this.el("div", "vibe-slot-slider");
      const sRange = this.el("input") as HTMLInputElement;
      sRange.type = "range";
      sRange.min = "-1";
      sRange.max = "1";
      sRange.step = "0.01";
      sRange.value = String(item.strength);
      const sNum = this.el("input") as HTMLInputElement;
      sNum.type = "number";
      sNum.min = "-1";
      sNum.max = "1";
      sNum.step = "0.01";
      sNum.value = item.strength.toFixed(2);

      const updateStrength = (rawVal: string) => {
        const clean = Math.max(-1, Math.min(1, Number((parseFloat(rawVal) || 0).toFixed(2))));
        item.strength = clean;
        sRange.value = String(clean);
        sNum.value = clean.toFixed(2);
        void saveStoredVibeItems(this.vibeItems);
      };
      sRange.addEventListener("input", () => updateStrength(sRange.value));
      sNum.addEventListener("change", () => updateStrength(sNum.value));
      sRow.append(sRange, sNum);
      main.append(titleLbl, sRow);

      const rightBox = this.el("div", "topbar-group");
      const chk = this.el("input") as HTMLInputElement;
      chk.type = "checkbox";
      chk.checked = item.enabled;
      chk.title = "启用/禁用此 Vibe 槽位";
      chk.addEventListener("change", () => {
        item.enabled = chk.checked;
        void saveStoredVibeItems(this.vibeItems);
        this.syncVibeUI();
        this.refreshSceneAndPrompt();
      });
      const btnDel = this.el("button", "btn btn-xs btn-icon", "✕");
      btnDel.addEventListener("click", () => {
        this.vibeItems = this.vibeItems.filter((x) => x.id !== item.id);
        void saveStoredVibeItems(this.vibeItems);
        this.syncVibeUI();
        this.refreshSceneAndPrompt();
      });
      rightBox.append(chk, btnDel);

      row.append(thumb, main, rightBox);
      this.elVibeSlotList.appendChild(row);
    }

    const activeSlots = this.getActiveVibeSlots();
    this.elVibeStatusNote.className = "vibe-note";
    this.elVibeStatusNote.innerHTML = "";
    if (this.vibeItems.length === 0) {
      this.elVibeStatusNote.textContent =
        "提示：可直接拖拽 .naiv4vibebundle / .naiv4vibe 或带 Vibe 元数据的 NAI 原图到此处。";
    } else if (!masterOn) {
      this.elVibeStatusNote.textContent = `⏸️ Vibe 已暂挂（${this.vibeItems.length} 个槽位保留中）。`;
    } else if (
      activeSlots.length === 0 &&
      this.apiSettings.model !== MODEL_V4_5_FULL &&
      this.vibeItems.some((it) => Boolean(it.encodings["v4-5full"]))
    ) {
      this.elVibeStatusNote.classList.add("warn");
      const warnTxt = this.el(
        "span",
        "",
        `⚠️ 当前载入的 ${this.vibeItems.length} 个槽位为 V4.5 Vibe 编码，需在 V4.5 Full 下生效：`
      );
      const btnSw = this.el("button", "btn btn-xs btn-primary", "切至 V4.5 Full");
      btnSw.style.marginLeft = "5px";
      btnSw.addEventListener("click", () => this.setModel(MODEL_V4_5_FULL));
      this.elVibeStatusNote.append(warnTxt, btnSw);
    } else {
      const safeLimit = computeSafePosTokenLimit({
        isV45: this.apiSettings.model === MODEL_V4_5_FULL,
        activeVibeCount: activeSlots.length,
      });
      this.elVibeStatusNote.textContent = `✅ 已激活 ${activeSlots.length} 槽 Vibe · 采样器自动联动 DPM++ 2M · 正向安全上限 ${safeLimit} tok`;
    }

    this.syncCardSummariesAndSwitches();
    this.updateQuotaPill();
  }

  private async handleVibeFilesImport(files: FileList | File[], append: boolean): Promise<void> {
    try {
      const fileArr = Array.from(files);
      const nextItems: StoredVibeItem[] = [];
      const unencodedImages: Array<{ name: string; bytes: Uint8Array }> = [];
      const warnings: string[] = [];

      for (const f of fileArr) {
        const bytes = new Uint8Array(await f.arrayBuffer());
        const isRaster = /\.(png|webp|jpe?g)$/i.test(f.name);
        try {
          const items = parseVibeFileBytes(bytes, f.name);
          for (const it of items) {
            nextItems.push(await compactVibeThumbnailInBrowser(it));
          }
        } catch (err) {
          if (isRaster) {
            unencodedImages.push({ name: f.name, bytes });
          } else {
            warnings.push(err instanceof Error ? err.message : String(err));
          }
        }
      }

      // Online encode fallback if user dropped plain images without embedded Vibe vectors
      if (unencodedImages.length > 0) {
        if (!this.apiSettings.api_token.trim()) {
          warnings.push(
            "普通图片无内置 Vibe 编码，需先填写 API Token 才能在线编码（或直接导入 .naiv4vibebundle）"
          );
        } else {
          for (const rawImg of unencodedImages) {
            this.setStatus(`⏳ 正在为图片「${rawImg.name}」请求在线 Vibe 编码 (2 Anlas)...`);
            const enc = await encodeVibeImageNai({
              apiToken: this.apiSettings.api_token,
              imageBytes: rawImg.bytes,
              informationExtracted: 1.0,
              model: MODEL_V4_5_FULL,
            });
            const rawB64 = uint8ArrayToBase64(enc.preparedPngBytes);
            const rawItem: StoredVibeItem = {
              id: `vibe_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              name: rawImg.name.replace(/\.[^.]+$/, ""),
              enabled: true,
              strength: 0.4,
              selectedModelKey: enc.modelKey,
              selectedHashKey: "ie_1.00",
              informationExtracted: enc.informationExtracted,
              encodings: {
                [enc.modelKey]: [
                  {
                    hashKey: "ie_1.00",
                    encoding: enc.encodingBase64,
                    informationExtracted: enc.informationExtracted,
                  },
                ],
              },
              rawImageBase64: rawB64,
              createdAt: Date.now(),
            };
            nextItems.push(await compactVibeThumbnailInBrowser(rawItem));
          }
        }
      }

      if (nextItems.length === 0) {
        if (warnings.length > 0) {
          this.setStatus(`⚠️ ${warnings.join("；")}`, true);
        }
        return;
      }

      this.vibeItems = append
        ? [...this.vibeItems, ...nextItems].slice(0, MAX_VIBE_SLOTS)
        : nextItems.slice(0, MAX_VIBE_SLOTS);
      this.apiSettings.vibe_transfer_enabled = true;
      if (
        this.apiSettings.model !== MODEL_V4_5_FULL &&
        this.vibeItems.some((it) => Boolean(it.encodings["v4-5full"]))
      ) {
        this.apiSettings.model = MODEL_V4_5_FULL;
      }
      saveApiSettings(this.apiSettings);
      await saveStoredVibeItems(this.vibeItems);
      this.syncAllControls();
      this.refreshSceneAndPrompt();
      this.setStatus(`🧬 已载入 ${this.vibeItems.length} 个 Vibe 槽位（默认启用 DPM++ 2M）`);
    } catch (err) {
      this.setStatus(
        `❌ 导入 Vibe 失败：${err instanceof Error ? err.message : String(err)}`,
        true
      );
    }
  }

  // ===========================================================================
  // PROMPT COMPUTATION & LIVE TOKEN GUARD
  // ===========================================================================
  private refreshSceneAndPrompt(): void {
    const activeVibes = this.getActiveVibeSlots();
    const safeLimit = computeSafePosTokenLimit({
      isV45: this.apiSettings.model === MODEL_V4_5_FULL,
      activeVibeCount: activeVibes.length,
    });
    this.cfg.pos_token_limit = safeLimit;

    const targetSceneId = this.actionMode === "free" ? "FREE" : this.activeSceneId;
    this.currentSceneItems = generateScenePrompts(targetSceneId, this.cfg);
    const first = this.currentSceneItems[0] ?? {
      subTitle: "【空场景】",
      canvas: "竖图 832x1216",
      prompt: "",
    };

    this.elPromptSceneLbl.textContent = first.subTitle.replace(/^【|】$/g, "");

    if (!this.isManualPromptEdited) {
      this.elManualLockPill.style.display = "none";
      const { posPrompt, negPrompt } = splitPromptPosAndNeg(first.prompt);
      this.elPosTextarea.value = posPrompt;
      this.elNegTextarea.value = negPrompt;
    }

    this.updateTokenBadgeFromBoxes();
    if (this.gallery.length === 0) {
      this.renderHeroViewport();
    }
  }

  private updateTokenBadgeFromBoxes(): void {
    const activeVibes = this.getActiveVibeSlots();
    const safeLimit = computeSafePosTokenLimit({
      isV45: this.apiSettings.model === MODEL_V4_5_FULL,
      activeVibeCount: activeVibes.length,
    });
    const posStr = this.elPosTextarea.value.trim();
    const sceneNeg = this.elNegTextarea.value.trim();
    const counts = countSeparatedT5Tokens({
      posPrompt: posStr,
      sceneNegPrompt: sceneNeg,
      ucPresetMode:
        this.apiSettings.model === MODEL_V5_FULL_MEDIUM
          ? "heavy"
          : this.apiSettings.uc_preset_mode,
      extraUc: this.apiSettings.extra_uc,
      appendQuality: this.apiSettings.append_v5_quality,
    });
    const isMed = this.apiSettings.model === MODEL_V5_FULL_MEDIUM;
    const rawMedTotal = counts.posTokens + counts.sceneNegTokens;
    const medNegBudget = Math.max(0, 506 - counts.posTokens);
    const medFittedNeg = Math.min(counts.sceneNegTokens, medNegBudget);
    const medSentTotal = counts.posTokens + medFittedNeg;
    const usedPos = isMed ? medSentTotal : counts.posTokens;
    const limit = isMed ? 512 : safeLimit;

    const vibeTag =
      this.apiSettings.model === MODEL_V4_5_FULL && activeVibes.length > 0
        ? ` · 含${activeVibes.length}Vibe`
        : "";
    if (isMed) {
      if (counts.posTokens > 506) {
        this.elTokenPill.textContent = `内联 正向超限 ${counts.posTokens} / 512 tok`;
        this.elTokenPill.title = "正向提示词本身已超过 512 上限，建议精简预设";
      } else if (rawMedTotal > 512) {
        this.elTokenPill.textContent = `内联 ${medSentTotal}/512 tok (负向缩${medFittedNeg}/${counts.sceneNegTokens})`;
        this.elTokenPill.title =
          "V5 Medium 发包时已自动按 512 剩余预算截取高优先级负向，确保正向与 [Character 1] 不被截断";
      } else {
        this.elTokenPill.textContent = `内联 ${rawMedTotal} / 512 tok`;
        this.elTokenPill.title = "V5 Medium 单通道正向 + 全部内联负向均在 512 以内";
      }
    } else {
      this.elTokenPill.textContent = `正向 ${usedPos} / ${limit} tok${vibeTag} · 负向 ${counts.negTokens}`;
      this.elTokenPill.title = "";
    }

    this.elTokenPill.className = "token-pill";
    if (isMed) {
      if (counts.posTokens > 506) {
        this.elTokenPill.classList.add("danger");
      } else if (rawMedTotal > 512 || medSentTotal > 484) {
        this.elTokenPill.classList.add("warn");
      }
    } else if (usedPos > limit) {
      this.elTokenPill.classList.add("danger");
    } else if (usedPos > limit - 28) {
      this.elTokenPill.classList.add("warn");
    }
  }

  // ===========================================================================
  // QUOTA / SUBSCRIPTION & IMAGE GENERATION PIPELINE
  // ===========================================================================
  private isOpusFreeActive(): boolean {
    return Boolean(
      this.subInfo &&
        this.subInfo.tier === 3 &&
        this.subInfo.active &&
        !this.subInfo.opus_usage_negative
    );
  }

  private updateQuotaPill(): void {
    if (!this.elQuotaPill) return;
    if (!this.apiSettings.api_token.trim()) {
      this.elQuotaPill.textContent = "🔑 点击填Token";
      this.elQuotaPill.className = "quota-pill warn";
      return;
    }

    const hint = this.currentSceneItems[0]?.canvas || "竖图 832x1216";
    const [w, h] = parseCanvasSize(hint, this.apiSettings.canvas_preset);
    const activeVibes = this.getActiveVibeSlots();
    const estSingle = estimateNaiAnlas({
      model: this.apiSettings.model,
      width: w,
      height: h,
      steps: this.apiSettings.steps,
      isOpusFreeEligible: this.isOpusFreeActive(),
      vibeCount: activeVibes.length,
    });
    const totalEst = estSingle * (this.apiSettings.batch_count || 1);

    if (this.subInfo) {
      const tierStr = this.subInfo.tier === 3 ? "Opus" : this.subInfo.tier_name;
      this.elQuotaPill.textContent = `${tierStr} · ${this.subInfo.anlas_left}点 (本次~${totalEst}点)`;
      this.elQuotaPill.className = totalEst === 0 ? "quota-pill" : "quota-pill warn";
    } else {
      this.elQuotaPill.textContent = `⚡ 预估 ~${totalEst} Anlas`;
      this.elQuotaPill.className = "quota-pill";
    }
  }

  private async refreshSubscription(silent = false): Promise<void> {
    if (!this.apiSettings.api_token.trim()) return;
    try {
      this.subInfo = await fetchSubscriptionInfo(this.apiSettings.api_token);
      this.updateQuotaPill();
      if (!silent) {
        this.setStatus(
          `✅ 账户已连接：${this.subInfo.tier_name} · 剩余 ${this.subInfo.anlas_left} Anlas`
        );
      }
    } catch (err) {
      if (!silent) {
        this.setStatus(
          `❌ 查询账户失败：${err instanceof Error ? err.message : String(err)}`,
          true
        );
      }
    }
  }

  private setStatus(msg: string, isError = false): void {
    if (!this.elStageMeta) return;
    this.elStageMeta.textContent = msg;
    this.elStageMeta.className = `stage-meta${isError ? " err" : " ok"}`;
  }

  private async runGenerationQueue(
    tasks: Array<{ sceneId: string; useManualPrompt?: boolean; forceRandomSeed?: boolean }>
  ): Promise<void> {
    if (this.isGenerating || tasks.length === 0) return;
    if (!this.apiSettings.api_token.trim()) {
      this.elApiCard.classList.remove("collapsed");
      this.mobileCol = "left";
      this.syncMobileColumns();
      this.setStatus("⚠️ 请先在左侧底部「🔑 API 令牌」卡片填入 Persistent API Token (pst-...)", true);
      return;
    }

    this.isGenerating = true;
    this.abortController = new AbortController();
    this.elHeroGenBtn.style.display = "none";
    this.elStopGenBtn.style.display = "inline-flex";
    this.elProgressBanner.style.display = "inline-flex";
    this.updateBatchCheckedButton();
    this.syncStageToolbar();

    // Switch mobile view to Center Stage so user sees live output immediately
    this.mobileCol = "center";
    this.syncMobileColumns();

    const activeVibes = this.getActiveVibeSlots();
    const safeLimit = computeSafePosTokenLimit({
      isV45: this.apiSettings.model === MODEL_V4_5_FULL,
      activeVibeCount: activeVibes.length,
    });
    this.cfg.pos_token_limit = safeLimit;

    const sessionFolder = `${formatDateYYYYMMDD()}_${(this.cfg.eng_name || "Studio").replace(/[^a-zA-Z0-9_-]/g, "")}`;
    const promptLogs: string[] = [];

    try {
      for (let i = 0; i < tasks.length; i++) {
        if (this.abortController.signal.aborted) break;
        const task = tasks[i];
        const genItems = generateScenePrompts(task.sceneId, this.cfg);
        const sceneItem = genItems[0];
        if (!sceneItem) continue;

        let rawPosPrompt: string;
        let customNeg: string;
        if (task.useManualPrompt) {
          rawPosPrompt = this.elPosTextarea.value.trim();
          customNeg = this.elNegTextarea.value.trim();
        } else {
          const sp = splitPromptPosAndNeg(sceneItem.prompt);
          rawPosPrompt = sp.posPrompt;
          customNeg = sp.negPrompt;
        }

        const isPixelC5 = isC5LowresPixelStyleActive(this.cfg);
        const [w, h] = isPixelC5
          ? sceneItem.canvas.includes("384x512")
            ? [384, 512]
            : [512, 384]
          : parseCanvasSize(sceneItem.canvas, this.apiSettings.canvas_preset);

        const reqSeed =
          task.forceRandomSeed || tasks.length > 1 ? -1 : this.apiSettings.seed;

        const tStart = performance.now();
        this.startLiveTimerLabel(
          `[${i + 1}/${tasks.length}] 正在生成 ${task.sceneId}${this.apiSettings.auto_upscale_replace && !isPixelC5 ? " (+自动2x高清)" : ""}`,
          tStart
        );

        const res = await generateSingleImageNai({
          apiToken: this.apiSettings.api_token,
          model: this.apiSettings.model,
          promptText: rawPosPrompt,
          customNegPrompt: customNeg,
          width: w,
          height: h,
          steps: this.apiSettings.steps,
          scale: this.apiSettings.scale,
          cfgRescale: this.apiSettings.cfg_rescale,
          seed: reqSeed,
          ucPresetMode: this.apiSettings.uc_preset_mode,
          keepInlineNegatives: false,
          extraUc: this.apiSettings.extra_uc,
          appendV5Quality: this.apiSettings.append_v5_quality,
          vibes: activeVibes,
          normalizeVibeStrength: this.apiSettings.vibe_normalize_strength,
          isOpusFreeEligible: this.isOpusFreeActive(),
          pixel3xNearest: isPixelC5,
          signal: this.abortController.signal,
        });

        let finalBytes = res.imageBytes;
        let finalW = res.width;
        let finalH = res.height;
        let finalElapsed = res.elapsedSec;
        let isUpscaled = false;

        // INVARIANT (AGENTS.md Rule 3): When auto_upscale_replace is enabled, NEVER push temporary 1x base images
        // to the gallery or Lightbox before 2x upscaling completes!
        if (this.apiSettings.auto_upscale_replace && !isPixelC5) {
          this.startLiveTimerLabel(
            `[${i + 1}/${tasks.length}] 正在执行 2x 高清放大替换 ${task.sceneId}`,
            tStart
          );
          try {
            const up = await upscaleSingleImageNai({
              apiToken: this.apiSettings.api_token,
              imageBytes: finalBytes,
              signal: this.abortController.signal,
            });
            finalBytes = up.imageBytes;
            finalW = up.outWidth;
            finalH = up.outHeight;
            finalElapsed = Number((finalElapsed + up.elapsedSec).toFixed(2));
            isUpscaled = true;
          } catch (upErr) {
            if (this.abortController.signal.aborted) break;
            this.setStatus(
              `⚠️ 2x 自动放大失败，已保留 1x 原图：${upErr instanceof Error ? upErr.message : String(upErr)}`,
              true
            );
          }
        }

        const ext = detectImageExt(finalBytes);
        const timeTag = formatTimeHHMMSS();
        const filename = `${timeTag}_${task.sceneId}_s${res.seed}${isUpscaled ? "_2x" : ""}${ext}`;
        const copyForBlob = new Uint8Array(finalBytes.byteLength);
        copyForBlob.set(finalBytes);
        const objectUrl = URL.createObjectURL(new Blob([copyForBlob], { type: "image/png" }));

        const rec: GeneratedImageRecord = {
          id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          scene_id: task.sceneId,
          mode_label: this.cfg.perspective_mode,
          filename,
          bytes: finalBytes,
          objectUrl,
          seed: res.seed,
          width: finalW,
          height: finalH,
          elapsed_sec: finalElapsed,
          estimated_anlas: res.estimatedAnlas + (isUpscaled ? 1 : 0),
          created_at: Date.now(),
          prompt_pos: rawPosPrompt,
          prompt_neg: customNeg,
          is_upscaled: isUpscaled,
        };

        // Save to mounted local directory if connected
        const savedPath = await saveBytesToMountedDir([sessionFolder], filename, finalBytes);
        if (savedPath) rec.saved_to_dir = true;
        promptLogs.push(`# ${filename} | ${finalW}x${finalH} | Seed: ${res.seed}\n[POS] ${rawPosPrompt}\n[NEG] ${customNeg}\n`);
        if (getMountedDirName()) {
          await saveBytesToMountedDir([sessionFolder], "prompts.txt", promptLogs.join("\n"));
        }

        if (this.apiSettings.auto_download) {
          triggerBytesDownload(finalBytes, filename);
        }

        this.gallery.push(rec);
        this.selectedGalleryIdx = this.gallery.length - 1;
        this.renderHeroViewport();
        this.renderFilmstrip();
        this.setStatus(
          `✅ ${rec.scene_id} · ${rec.width}×${rec.height}${rec.is_upscaled ? " [2x HD]" : ""} · Seed: ${rec.seed} · ${rec.elapsed_sec}s${rec.saved_to_dir ? " · 📂已落盘" : ""}`
        );

        // Fullscreen Carousel Lightbox sync (ONLY after final 2x or 1x record is pushed!)
        if (this.lightboxOpen) {
          if (this.carouselMode === "follow_latest") {
            this.lightboxIdx = this.gallery.length - 1;
          }
          this.renderLightboxFrame();
        } else if (this.apiSettings.auto_fullscreen_carousel && tasks.length > 1) {
          this.openLightbox(this.gallery.length - 1, this.apiSettings.carousel_auto_mode);
        }
      }
    } catch (err) {
      if (!this.abortController.signal.aborted) {
        this.setStatus(
          `❌ 生图中断：${err instanceof Error ? err.message : String(err)}`,
          true
        );
      } else {
        this.setStatus("⏹ 已手动停止生图队列");
      }
    } finally {
      this.stopLiveTimerLabel();
      this.isGenerating = false;
      this.abortController = null;
      this.elHeroGenBtn.style.display = "inline-flex";
      this.elStopGenBtn.style.display = "none";
      this.elProgressBanner.style.display = "none";
      this.updateBatchCheckedButton();
      this.syncStageToolbar();
      void this.refreshSubscription(true);
    }
  }

  private startLiveTimerLabel(prefix: string, tStart: number): void {
    this.stopLiveTimerLabel();
    const update = () => {
      const sec = ((performance.now() - tStart) / 1000).toFixed(1);
      this.elProgressText.textContent = `${prefix} · ${sec}s`;
    };
    update();
    this.genTimerHandle = window.setInterval(update, 200);
  }

  private stopLiveTimerLabel(): void {
    if (this.genTimerHandle !== null) {
      window.clearInterval(this.genTimerHandle);
      this.genTimerHandle = null;
    }
  }

  private async upscaleSelectedGalleryImage(): Promise<void> {
    const rec = this.gallery[this.selectedGalleryIdx];
    if (!rec || rec.is_upscaled || this.isGenerating) return;
    if (!this.apiSettings.api_token.trim()) {
      this.setStatus("⚠️ 请先填写 API Token", true);
      return;
    }

    this.isGenerating = true;
    this.syncStageToolbar();
    this.elProgressBanner.style.display = "inline-flex";
    const t0 = performance.now();
    this.startLiveTimerLabel(`🔍 正在 2x 放大 ${rec.scene_id}`, t0);

    try {
      const up = await upscaleSingleImageNai({
        apiToken: this.apiSettings.api_token,
        imageBytes: rec.bytes,
      });
      URL.revokeObjectURL(rec.objectUrl);
      const copy = new Uint8Array(up.imageBytes.byteLength);
      copy.set(up.imageBytes);
      rec.bytes = up.imageBytes;
      rec.objectUrl = URL.createObjectURL(new Blob([copy], { type: "image/png" }));
      rec.width = up.outWidth;
      rec.height = up.outHeight;
      rec.is_upscaled = true;
      rec.filename = rec.filename.replace(/(\.[^.]+)$/, "_2x$1");

      if (getMountedDirName()) {
        const folder = `${formatDateYYYYMMDD()}_${(this.cfg.eng_name || "Studio").replace(/[^a-zA-Z0-9_-]/g, "")}`;
        const saved = await saveBytesToMountedDir([folder], rec.filename, rec.bytes);
        if (saved) rec.saved_to_dir = true;
      }

      this.renderHeroViewport();
      this.renderFilmstrip();
      if (this.lightboxOpen) this.renderLightboxFrame();
      this.setStatus(
        `✨ 2x 放大完成：${rec.scene_id} · ${rec.width}×${rec.height} (${up.elapsedSec}s)`
      );
    } catch (err) {
      this.setStatus(
        `❌ 2x 放大失败：${err instanceof Error ? err.message : String(err)}`,
        true
      );
    } finally {
      this.stopLiveTimerLabel();
      this.isGenerating = false;
      this.elProgressBanner.style.display = "none";
      this.syncStageToolbar();
    }
  }

  private renderHeroViewport(): void {
    this.elHeroViewport.innerHTML = "";
    this.elHeroViewport.appendChild(this.elProgressBanner);

    const rec = this.gallery[this.selectedGalleryIdx];
    if (!rec) {
      this.syncStageToolbar();
      return;
    }

    const img = document.createElement("img");
    img.className = "hero-img";
    img.src = rec.objectUrl;
    img.alt = rec.filename;
    img.title = "点击进入全屏灯箱查看";
    img.addEventListener("click", () => this.openLightbox(this.selectedGalleryIdx));
    this.elHeroViewport.appendChild(img);
    this.syncStageToolbar();
  }

  private renderFilmstrip(): void {
    if (this.gallery.length === 0) {
      this.elFilmstripBar.classList.add("hidden");
      return;
    }
    this.elFilmstripBar.classList.remove("hidden");
    this.elFilmstripScroll.innerHTML = "";

    this.gallery.forEach((rec, idx) => {
      const item = this.el(
        "div",
        `film-item${idx === this.selectedGalleryIdx ? " active" : ""}`
      );
      const img = document.createElement("img");
      img.src = rec.objectUrl;
      const chk = this.el("input", "film-item-chk") as HTMLInputElement;
      chk.type = "checkbox";
      chk.checked = this.checkedGalleryIds.has(rec.id);
      chk.title = "勾选以用于打包 ZIP 导出（不勾选则默认打包全部）";
      chk.addEventListener("click", (ev) => ev.stopPropagation());
      chk.addEventListener("change", () => {
        if (chk.checked) this.checkedGalleryIds.add(rec.id);
        else this.checkedGalleryIds.delete(rec.id);
      });

      item.append(img, chk);
      if (rec.is_upscaled) {
        item.appendChild(this.el("span", "film-item-2x", "2x"));
      }
      item.appendChild(this.el("div", "film-item-lbl", rec.scene_id));
      item.addEventListener("click", () => {
        this.selectedGalleryIdx = idx;
        this.renderHeroViewport();
        this.renderFilmstrip();
        this.setStatus(
          `🖼️ ${rec.scene_id} · ${rec.width}×${rec.height}${rec.is_upscaled ? " [2x HD]" : ""} · Seed: ${rec.seed}`
        );
      });
      this.elFilmstripScroll.appendChild(item);
    });

    // Keep latest active thumbnail scrolled into view
    const activeThumb = this.elFilmstripScroll.children[this.selectedGalleryIdx] as
      | HTMLElement
      | undefined;
    activeThumb?.scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" });
  }

  private exportGalleryZip(): void {
    if (this.gallery.length === 0) {
      this.setStatus("⚠️ 当前画廊为空，无可打包图片", true);
      return;
    }
    const targets =
      this.checkedGalleryIds.size > 0
        ? this.gallery.filter((g) => this.checkedGalleryIds.has(g.id))
        : this.gallery;
    const entries: Array<{ name: string; data: Uint8Array | string }> = targets.map((g) => ({
      name: g.filename,
      data: g.bytes,
    }));
    const logTxt = targets
      .map(
        (g) =>
          `# ${g.filename} (${g.width}x${g.height}, Seed=${g.seed})\n[Positive]\n${g.prompt_pos || ""}\n[Negative]\n${g.prompt_neg || ""}\n`
      )
      .join("\n----------------------------------------\n");
    entries.push({ name: "prompts.txt", data: logTxt });
    const zip = buildStoreZipBlob(entries);
    triggerBlobDownload(zip, `NAI_Studio_${formatDateYYYYMMDD()}_${formatTimeHHMMSS()}.zip`);
    this.setStatus(`📦 已打包下载 ${targets.length} 张图片与 prompts.txt`);
  }

  private bindGlobalEvents(): void {
    document.addEventListener("click", () => {
      this.closeAllPopovers();
    });

    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") {
        if (this.lightboxOpen) {
          this.closeLightbox();
        } else {
          this.closeAllPopovers();
        }
        return;
      }
      if (this.lightboxOpen) {
        if (ev.key === "ArrowLeft") {
          ev.preventDefault();
          this.stepLightbox(-1, true);
        } else if (ev.key === "ArrowRight" || ev.key === " ") {
          ev.preventDefault();
          this.stepLightbox(1, true);
        }
      }
    });
  }

  // ===========================================================================
  // LIVE MCP BRIDGE COMMAND EXECUTOR
  // ===========================================================================
  private buildStateSnapshotForMcp(): Record<string, unknown> {
    const activeVibes = this.getActiveVibeSlots();
    const safeLimit = computeSafePosTokenLimit({
      isV45: this.apiSettings.model === MODEL_V4_5_FULL,
      activeVibeCount: activeVibes.length,
    });
    const posPrompt = this.elPosTextarea.value.trim();
    const negPrompt = this.elNegTextarea.value.trim();
    const counts = countSeparatedT5Tokens({
      posPrompt,
      sceneNegPrompt: negPrompt,
      ucPresetMode:
        this.apiSettings.model === MODEL_V5_FULL_MEDIUM
          ? "heavy"
          : this.apiSettings.uc_preset_mode,
      extraUc: this.apiSettings.extra_uc,
      appendQuality: this.apiSettings.append_v5_quality,
    });

    const { api_token: _redacted, ...safeApiSettings } = this.apiSettings;
    return {
      connected: true,
      is_generating: this.isGenerating,
      action_mode: this.actionMode,
      active_scene_id: this.actionMode === "free" ? "FREE" : this.activeSceneId,
      checked_position_ids: Array.from(this.checkedPositionIds),
      checked_multi_angle_ids: Array.from(this.checkedMultiAngleIds),
      is_manual_prompt_locked: this.isManualPromptEdited,
      prompt: {
        scene_title: this.elPromptSceneLbl.textContent || "",
        positive: posPrompt,
        scene_negative: negPrompt,
        pos_tokens: counts.posTokens,
        neg_tokens: counts.negTokens,
        safe_pos_limit: this.apiSettings.model === MODEL_V5_FULL_MEDIUM ? 512 : safeLimit,
      },
      character_config: { ...this.cfg },
      api_settings: {
        ...safeApiSettings,
        has_api_token: Boolean(this.apiSettings.api_token.trim()),
      },
      vibes: this.vibeItems.map((v, idx) => ({
        index: idx,
        id: v.id,
        name: v.name,
        enabled: v.enabled,
        strength: v.strength,
        information_extracted: v.informationExtracted,
        models: Object.keys(v.encodings),
      })),
      presets: {
        active: this.cfg.preset_name,
        custom: Object.keys(this.customPresets),
        builtin: this.getAvailableBuiltinKeys(),
      },
      gallery: {
        count: this.gallery.length,
        selected_index: this.selectedGalleryIdx,
        latest:
          this.gallery.length > 0
            ? {
                filename: this.gallery[this.gallery.length - 1].filename,
                scene_id: this.gallery[this.gallery.length - 1].scene_id,
                seed: this.gallery[this.gallery.length - 1].seed,
                width: this.gallery[this.gallery.length - 1].width,
                height: this.gallery[this.gallery.length - 1].height,
                is_upscaled: Boolean(this.gallery[this.gallery.length - 1].is_upscaled),
              }
            : null,
      },
    };
  }

  private async handleMcpCommand(
    method: string,
    params: Record<string, unknown>
  ): Promise<unknown> {
    if (method === "get_state") {
      return this.buildStateSnapshotForMcp();
    }

    if (method === "update_config") {
      const cfgPatch = (params.character_config as Record<string, unknown> | undefined) ?? {};
      const apiPatch = (params.api_settings as Record<string, unknown> | undefined) ?? {};
      const changedNotes: string[] = [];

      const prevStyle = this.cfg.style_preset;
      for (const [k, v] of Object.entries(cfgPatch)) {
        if (k === "eye_color" || k === "hair_tags" || v === undefined) continue;
        if (k in this.cfg) {
          (this.cfg as unknown as Record<string, unknown>)[k] = v;
          changedNotes.push(k);
        }
      }

      // Auto-sync lighting & bundled Vibe if style_preset changed and lighting_preset wasn't explicitly overridden
      if (
        typeof cfgPatch.style_preset === "string" &&
        cfgPatch.style_preset !== prevStyle
      ) {
        if (cfgPatch.lighting_preset === undefined) {
          this.cfg.lighting_preset = resolveLightingForStyle(this.cfg.style_preset);
        }
        const stylePack = STYLE_BUNDLED_VIBE_PACK[this.cfg.style_preset];
        if (stylePack && BUNDLED_VIBE_PACKS[stylePack]) {
          await this.injectBundledVibePack(stylePack, false);
        }
      }

      for (const [k, v] of Object.entries(apiPatch)) {
        if (k === "api_token" || v === undefined) continue;
        if (k in this.apiSettings) {
          (this.apiSettings as unknown as Record<string, unknown>)[k] = v;
          changedNotes.push(k);
        }
      }

      if (
        params.action_mode === "positions" ||
        params.action_mode === "multi_angle" ||
        params.action_mode === "free"
      ) {
        this.actionMode = params.action_mode;
        changedNotes.push(`mode=${params.action_mode}`);
      }
      if (typeof params.active_scene_id === "string" && params.active_scene_id.trim()) {
        const sid = params.active_scene_id.trim();
        if (sid === "FREE") {
          this.actionMode = "free";
        } else if (sid.startsWith("MA")) {
          this.actionMode = "multi_angle";
          this.activeSceneId = sid;
        } else if (sid in ALL_POSITIONS_TEMPLATES || sid.startsWith("P")) {
          this.actionMode = "positions";
          this.activeSceneId = sid;
        }
        changedNotes.push(`scene=${sid}`);
      }
      if (Array.isArray(params.checked_position_ids)) {
        this.checkedPositionIds = new Set(
          params.checked_position_ids.filter((x): x is string => typeof x === "string")
        );
      }
      if (Array.isArray(params.checked_multi_angle_ids)) {
        this.checkedMultiAngleIds = new Set(
          params.checked_multi_angle_ids.filter((x): x is string => typeof x === "string")
        );
      }

      this.isManualPromptEdited = false;
      saveActiveConfig(this.cfg);
      saveApiSettings(this.apiSettings);
      this.populatePresetSelect();
      this.syncAllControls();
      this.renderRightModeView();
      this.refreshSceneAndPrompt();
      this.setStatus(`🤖 MCP 已实时更新网页 (${changedNotes.slice(0, 5).join(", ") || "同步完成"})`);
      return this.buildStateSnapshotForMcp();
    }

    if (method === "set_manual_prompt") {
      if (params.unlock === true) {
        this.isManualPromptEdited = false;
        this.refreshSceneAndPrompt();
        this.setStatus("🤖 MCP 已解除手改词条锁定，恢复引擎自动生成");
        return this.buildStateSnapshotForMcp();
      }

      let pos = this.elPosTextarea.value;
      let neg = this.elNegTextarea.value;
      if (typeof params.positive === "string") {
        pos = params.positive;
      }
      if (typeof params.negative === "string") {
        neg = params.negative;
      }
      if (typeof params.replace_target === "string" && params.replace_target.length > 0) {
        const rep = typeof params.replace_with === "string" ? params.replace_with : "";
        pos = pos.split(params.replace_target).join(rep);
      }
      this.elPosTextarea.value = pos;
      this.elNegTextarea.value = neg;
      this.isManualPromptEdited = true;
      this.elManualLockPill.style.display = "inline-flex";
      if (params.expand_drawer === true && !this.promptDrawerExpanded) {
        this.elDrawerToggleBtn.click();
      }
      this.updateTokenBadgeFromBoxes();
      this.setStatus("🤖 MCP 已直接更新当前正向/负向提示词框 (手改已锁定)");
      return this.buildStateSnapshotForMcp();
    }

    if (method === "manage_presets") {
      const action = String(params.action || "");
      const name = typeof params.name === "string" ? params.name.trim() : "";
      if (action === "select") {
        if (!name) throw new Error("Missing preset name for select");
        await this.applySelectedCharacterPreset(name);
        return this.buildStateSnapshotForMcp();
      }
      if (action === "save") {
        if (!name) throw new Error("Missing preset name for save");
        const finalName = name.startsWith("⭐") ? name : `⭐ ${name}`;
        unmarkPresetDeleted(finalName);
        this.cfg.preset_name = finalName;
        this.customPresets[finalName] = { ...this.cfg };
        saveCustomPresets(this.customPresets);
        saveActiveConfig(this.cfg);
        this.populatePresetSelect();
        this.setStatus(`🤖 MCP 已保存自定义角色预设「${finalName}」`);
        return this.buildStateSnapshotForMcp();
      }
      if (action === "delete") {
        const target = name || this.elPresetSelect.value || this.cfg.preset_name;
        const ok = await this.deletePresetByKey(target);
        if (!ok) throw new Error(`Preset '${target}' could not be deleted`);
        return this.buildStateSnapshotForMcp();
      }
      if (action === "restore_defaults") {
        this.restoreFactoryPresets();
        return this.buildStateSnapshotForMcp();
      }
      throw new Error(`Unknown manage_presets action: ${action}`);
    }

    if (method === "manage_vibes") {
      const action = String(params.action || "list");
      if (action === "clear") {
        this.vibeItems = [];
        await clearStoredVibeItems();
        this.syncVibeUI();
        this.refreshSceneAndPrompt();
        this.setStatus("🤖 MCP 已清空 Vibe 槽位");
        return this.buildStateSnapshotForMcp();
      }
      if (action === "set_master") {
        if (typeof params.enabled === "boolean") {
          this.apiSettings.vibe_transfer_enabled = params.enabled;
        }
        if (typeof params.normalize_strength === "boolean") {
          this.apiSettings.vibe_normalize_strength = params.normalize_strength;
        }
        saveApiSettings(this.apiSettings);
        this.syncVibeUI();
        this.refreshSceneAndPrompt();
        return this.buildStateSnapshotForMcp();
      }
      if (action === "update_slot") {
        const idx = Number(params.index ?? -1);
        const item = this.vibeItems[idx];
        if (!item) throw new Error(`Vibe slot index ${idx} out of range (0..${this.vibeItems.length - 1})`);
        if (typeof params.strength === "number") {
          item.strength = Math.max(-1, Math.min(1, Number(params.strength.toFixed(2))));
        }
        if (typeof params.enabled === "boolean") {
          item.enabled = params.enabled;
        }
        await saveStoredVibeItems(this.vibeItems);
        this.syncVibeUI();
        this.refreshSceneAndPrompt();
        this.setStatus(`🤖 MCP 已更新 Vibe 槽位 #${idx + 1} (${item.name}: ${item.strength})`);
        return this.buildStateSnapshotForMcp();
      }
      if (action === "import_base64") {
        const b64 = String(params.base64 || "");
        const filename = String(params.filename || "imported.naiv4vibebundle");
        const append = Boolean(params.append);
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const file = new File([bytes], filename);
        await this.handleVibeFilesImport([file], append);
        return this.buildStateSnapshotForMcp();
      }
      return this.buildStateSnapshotForMcp();
    }

    if (method === "trigger_generate") {
      if (this.isGenerating) {
        throw new Error("网页当前正在执行生图任务，请等待当前队列完成或停止后再试。");
      }
      const sceneIdsRaw = Array.isArray(params.scene_ids)
        ? params.scene_ids.filter((x): x is string => typeof x === "string")
        : [];
      const count = Math.max(1, Math.min(8, Number(params.count || this.apiSettings.batch_count || 1)));
      const forceRandomSeed = Boolean(params.force_random_seed);
      const targetIds =
        sceneIdsRaw.length > 0
          ? sceneIdsRaw
          : [this.actionMode === "free" ? "FREE" : this.activeSceneId];
      const queue: Array<{ sceneId: string; useManualPrompt?: boolean; forceRandomSeed?: boolean }> = [];
      for (const sid of targetIds) {
        for (let c = 0; c < count; c++) {
          queue.push({
            sceneId: sid,
            useManualPrompt: sid === targetIds[0] && this.isManualPromptEdited,
            forceRandomSeed,
          });
        }
      }

      const prevCount = this.gallery.length;
      const waitFinish = params.wait_for_result !== false;
      if (!waitFinish) {
        void this.runGenerationQueue(queue);
        return { started: true, queued_tasks: queue.length };
      }

      await this.runGenerationQueue(queue);
      const added = this.gallery.slice(prevCount);
      const latest = added[added.length - 1];
      let savedPreviewPath: string | null = null;
      if (latest && params.upload_preview !== false) {
        savedPreviewPath = await this.mcpBridge.uploadImageBytesToBridge({
          filename: latest.filename,
          sceneId: latest.scene_id,
          seed: latest.seed,
          width: latest.width,
          height: latest.height,
          isUpscaled: Boolean(latest.is_upscaled),
          bytes: latest.bytes,
        });
      }
      return {
        completed: true,
        generated_count: added.length,
        latest_image: latest
          ? {
              filename: latest.filename,
              scene_id: latest.scene_id,
              seed: latest.seed,
              width: latest.width,
              height: latest.height,
              elapsed_sec: latest.elapsed_sec,
              is_upscaled: Boolean(latest.is_upscaled),
              local_preview_path: savedPreviewPath,
            }
          : null,
      };
    }

    if (method === "get_latest_image") {
      const idx =
        typeof params.gallery_index === "number"
          ? params.gallery_index
          : this.selectedGalleryIdx >= 0
            ? this.selectedGalleryIdx
            : this.gallery.length - 1;
      const rec = this.gallery[idx];
      if (!rec) {
        throw new Error("当前网页画廊为空，尚无已生成的图片。");
      }
      const savedPath = await this.mcpBridge.uploadImageBytesToBridge({
        filename: rec.filename,
        sceneId: rec.scene_id,
        seed: rec.seed,
        width: rec.width,
        height: rec.height,
        isUpscaled: Boolean(rec.is_upscaled),
        bytes: rec.bytes,
      });
      return {
        filename: rec.filename,
        scene_id: rec.scene_id,
        seed: rec.seed,
        width: rec.width,
        height: rec.height,
        is_upscaled: Boolean(rec.is_upscaled),
        local_preview_path: savedPath,
      };
    }

    throw new Error(`Unsupported MCP bridge method: ${method}`);
  }
}
