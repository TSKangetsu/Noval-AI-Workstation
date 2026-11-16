import {
  ALL_POSITIONS_CHAPTERS,
  BODY_PRESETS,
  BUILTIN_CHARACTERS,
  BUST_PRESETS,
  CAMERA_GAZE_PRESETS,
  CAMERA_QUICK_PRESETS,
  CAMERA_SHOT_PRESETS,
  CANVAS_PRESETS,
  ENV_PRESETS,
  EXPRESSION_BLUSH_PRESETS,
  EXPRESSION_EYE_PRESETS,
  EXPRESSION_MOUTH_PRESETS,
  EXPRESSION_PRESETS,
  LEGWEAR_PRESETS,
  LIGHTING_PRESETS,
  MODEL_V4_5_FULL,
  MODEL_V5_FULL_MEDIUM,
  MODULE_SWITCH_PRESETS,
  MORPH_PRESETS,
  MULTI_ANGLE_CHAPTERS,
  MULTI_ANGLE_TEMPLATES,
  MULTI_PANEL_MODE_PRESETS,
  NAI_MODEL_OPTIONS,
  OUTFIT_PRESETS,
  OUTFIT_STATE_PRESETS,
  PIGMENT_PRESETS,
  POS_CATEGORIES,
  POS_MALE_MODE_PRESETS,
  POS_SCENE_PRESETS,
  POS_STAGE_PRESETS,
  PUBIC_PRESETS,
  SKIN_PRESETS,
  STORY_CHAPTERS,
  STYLE_PRESETS,
} from "../data/engineConstants";
import { describeCameraShort } from "../engine/cameraRig";
import {
  compileExpressionOverride,
  describeActiveModules,
  describeExpressionShort,
  generateFullSuite,
  generateScenePrompts,
  isC5LowresPixelStyleActive,
  isExpressionOverrideActive,
} from "../engine/storyEngine";
import {
  countPromptT5Tokens,
  extractFirstPromptFromPreview,
  extractPromptBlocksFromPreview,
  initT5Tokenizer,
} from "../engine/t5Tokenizer";
import {
  createDefaultCharacterConfig,
  type CarouselMode,
  type CharacterConfig,
  type GeneratedImageRecord,
  type MultiPanelMode,
  type NaiApiSettings,
  type NaiModelId,
  type NaiUcPresetMode,
  type PerspectiveMode,
  type PreciseRefSlotInput,
  type PreciseRefWorkflowMode,
  type ScenePromptItem,
  type SubscriptionInfo,
} from "../engine/types";
import {
  detectImageExt,
  estimateNaiAnlas,
  fetchSubscriptionInfo,
  generateSingleImageNai,
  NaiApiError,
  parseCanvasSize,
  preparePreciseReferencePng,
  upscaleSingleImageNai,
} from "../services/naiApiClient";
import {
  buildStoreZipBlob,
  clearPreciseRefImage,
  clearPreciseStyleRefImage,
  formatDateYYYYMMDD,
  formatTimeHHMMSS,
  getMountedDirName,
  loadActiveConfig,
  loadApiSettings,
  loadCustomPresets,
  loadPreciseRefImage,
  loadPreciseStyleRefImage,
  mountLocalOutputDirectory,
  saveActiveConfig,
  saveApiSettings,
  saveBytesToMountedDir,
  saveCustomPresets,
  savePreciseRefImage,
  savePreciseStyleRefImage,
  supportsDirectoryPicker,
  triggerBlobDownload,
  triggerBytesDownload,
  triggerTextDownload,
  unmountLocalOutputDirectory,
  type StoredPreciseRefImage,
} from "../services/storageService";
import { CameraRadarCanvas } from "./cameraRadarCanvas";

const MODULE_LABELS: Array<[keyof CharacterConfig, string]> = [
  ["enable_quality", "1. 基础质量词 (Quality)"],
  ["enable_style", "2. 画风光影与负向 (Style)"],
  ["enable_identity", "3. 角色名/瞳/发 (Identity)"],
  ["enable_body", "4. 体型/胸/肤/萌点 (Body)"],
  ["enable_outfit", "5. 服装款式 (Outfit)"],
  ["enable_clothing_state", "6. 掀衣暴露辅助 (State)"],
  ["enable_legwear", "7. 鞋袜与赤足 (Legwear)"],
  ["enable_background", "8. 室内环境与光 (BG)"],
  ["enable_expression", "9. 微表情与脸红 (Expr)"],
  ["enable_anatomy", "10. 局部四维开关 (Anat)"],
  ["enable_action_fluids", "11. 本幕核心流体 (Action)"],
  ["enable_remnants", "12. 跨幕历史残留 (Remnant)"],
  ["enable_t5_prose", "13. 句尾英文T5句 (Prose)"],
  ["enable_negatives", "14. 防崩负向词块 (Negs)"],
];

export class WorkbenchApp {
  private root: HTMLElement;
  private cfg: CharacterConfig;
  private apiSettings: NaiApiSettings;
  private customPresets: Record<string, Partial<CharacterConfig>>;

  private activeSuiteTab: "story" | "multi_angle" | "all_pos" = "story";
  private activeLeftTab = "tab-identity";
  private activeOutTab = "out-single";
  private activeMobilePane: "config" | "scenes" | "output" = "scenes";
  private mobileHeaderOpen = false;
  private mobilePosFiltersOpen = false;

  private activeSceneId = "S00";
  private activeSubVariantIdx = 0;
  private currentSceneItems: ScenePromptItem[] = [];
  private isSingleEdited = false;

  private selectedStoryIds = new Set<string>(
    STORY_CHAPTERS.filter((c) => c.id !== "F00").map((c) => c.id)
  );
  private selectedMaIds = new Set<string>(MULTI_ANGLE_CHAPTERS.map((c) => c.id));
  private selectedPosIds = new Set<string>(ALL_POSITIONS_CHAPTERS.map((c) => c.id));
  private posCategory = POS_CATEGORIES[0];
  private posSearchQuery = "";

  private isGenerating = false;
  private batchAbortCtrl: AbortController | null = null;
  private lastS00Seed: number | null = null;
  private subInfo: SubscriptionInfo | null = null;
  private gallery: GeneratedImageRecord[] = [];
  private activeGalleryIdx = -1;
  private checkerboardOn = true;
  private lightboxZoom1x = false;
  private carouselTimer: number | null = null;
  private carouselMode: CarouselMode = "manual";
  private batchLightboxDismissed = false;
  private batchProgressLabel = "";
  private batchDoneLabel = "";
  private autoCarouselCheckboxes: HTMLInputElement[] = [];
  private autoUpscaleCheckboxes: HTMLInputElement[] = [];
  private preciseRef: StoredPreciseRefImage | null = null;
  private preciseRefThumbUrl: string | null = null;
  private preciseStyleRef: StoredPreciseRefImage | null = null;
  private preciseStyleRefThumbUrl: string | null = null;
  private activePasteSlot: "char" | "style" = "char";
  private pasteListenerBound = false;

  private radarCtrl: CameraRadarCanvas | null = null;
  private logs: string[] = [];

  // Cached interactive elements
  private elHeaderBar!: HTMLElement;
  private elMobileHeaderToggleBtn!: HTMLButtonElement;
  private elMobilePerspBtn!: HTMLButtonElement;
  private elMobileQuickSceneLbl!: HTMLElement;
  private elMobileOutBadge!: HTMLElement;
  private elPosMalePills: Map<string, HTMLButtonElement> = new Map();
  private elPosStagePills: Map<string, HTMLButtonElement> = new Map();
  private elPosScenePills: Map<string, HTMLButtonElement> = new Map();
  private elPosPenisLbl!: HTMLElement;
  private elPresetSelect!: HTMLSelectElement;
  private elRefCapsule!: HTMLButtonElement;
  private elExprCapsule!: HTMLButtonElement;
  private elExprPreviewBox!: HTMLElement;
  private elExprPresetPills: Map<string, HTMLButtonElement> = new Map();
  private elCamCapsule!: HTMLButtonElement;
  private elPreciseWorkflowBtns: Map<PreciseRefWorkflowMode, HTMLButtonElement> = new Map();
  private elPreciseCharSlot!: HTMLElement;
  private elPreciseCharModeLbl!: HTMLElement;
  private elPreciseRefThumb!: HTMLElement;
  private elPreciseRefToggleBtn!: HTMLButtonElement;
  private elPreciseRefClearBtn!: HTMLButtonElement;
  private elPreciseStyleSlot!: HTMLElement;
  private elPreciseStyleThumb!: HTMLElement;
  private elPreciseStyleToggleBtn!: HTMLButtonElement;
  private elPreciseStyleClearBtn!: HTMLButtonElement;
  private elPreciseRefStatus!: HTMLElement;
  private elModTabRefBanner!: HTMLElement;
  private elSingleSelect!: HTMLSelectElement;
  private elSingleText!: HTMLTextAreaElement;
  private elTokenBadge!: HTMLElement;
  private elCanvasBadge!: HTMLElement;
  private elPovText!: HTMLTextAreaElement;
  private elTrdText!: HTMLTextAreaElement;
  private elStatusText!: HTMLElement;
  private elAnlasBadge!: HTMLElement;
  private elApiSubBanner!: HTMLElement;
  private elCostHint!: HTMLElement;
  private elMountedDirBadge!: HTMLElement;
  private elLogBox!: HTMLElement;
  private elPreviewStage!: HTMLElement;
  private elPreviewMeta!: HTMLElement;
  private elFilmstrip!: HTMLElement;
  private elLightbox!: HTMLElement;
  private elLightboxImg!: HTMLImageElement;
  private elLightboxBody!: HTMLElement;
  private elLightboxMeta!: HTMLElement;
  private elLightboxProgress!: HTMLElement;
  private elLightboxStopBatchBtn!: HTMLButtonElement;
  private elLightboxFollowBtn!: HTMLButtonElement;
  private elLightboxPlayBtn!: HTMLButtonElement;
  private elLightboxIntervalBtns: Map<number, HTMLButtonElement> = new Map();
  private elLightboxStrip!: HTMLElement;

  private formBindings: Map<keyof CharacterConfig, HTMLInputElement | HTMLSelectElement> = new Map();
  private moduleBindings: Map<keyof CharacterConfig, HTMLInputElement> = new Map();

  constructor(root: HTMLElement) {
    this.root = root;
    this.cfg = loadActiveConfig();
    this.apiSettings = loadApiSettings();
    this.customPresets = loadCustomPresets();
  }

  public async mount(): Promise<void> {
    this.renderShell();
    this.bindGlobalPasteForPreciseRef();
    this.syncControlsFromConfig();
    this.refreshAllOutputs();
    const [savedRef, savedStyleRef] = await Promise.all([
      loadPreciseRefImage(),
      loadPreciseStyleRefImage(),
    ]);
    if (savedRef) {
      const upgradedRef = await this.maybeUpgradeCachedPreciseRef("char", savedRef);
      this.setPreciseRefMemory("char", upgradedRef);
    }
    if (savedStyleRef) {
      const upgradedStyle = await this.maybeUpgradeCachedPreciseRef("style", savedStyleRef);
      this.setPreciseRefMemory("style", upgradedStyle);
    }
    this.syncApiInputs();
    this.syncPreciseRefDisplays();
    this.updateCostHint();
    this.setStatus("就绪 · 正在后台加载精确 T5 分词表 (32,000 词条)...");
    await initT5Tokenizer();
    this.updateTokenBadge();
    this.setStatus("✅ 就绪 · T5 SentencePiece 精确分词器已激活 (32,000 词条零误差)");

    if (this.apiSettings.api_token.trim()) {
      void this.onCheckSubscription(true);
    }
  }

  private el<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    cls?: string,
    text?: string
  ): HTMLElementTagNameMap[K] {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  private setStatus(msg: string): void {
    if (this.elStatusText) this.elStatusText.textContent = msg;
  }

  private appendLog(msg: string): void {
    const stamp = new Date().toLocaleTimeString();
    this.logs.push(`[${stamp}] ${msg}`);
    if (this.logs.length > 200) this.logs.shift();
    if (this.elLogBox) {
      this.elLogBox.textContent = this.logs.join("\n");
      this.elLogBox.scrollTop = this.elLogBox.scrollHeight;
    }
  }

  private renderShell(): void {
    this.root.innerHTML = "";
    this.root.dataset.mobilePane = this.activeMobilePane;
    this.mobileHeaderOpen = false;
    this.mobilePosFiltersOpen = false;
    this.autoCarouselCheckboxes = [];
    this.autoUpscaleCheckboxes = [];
    if (this.elLightbox && this.elLightbox.parentElement) {
      this.elLightbox.parentElement.removeChild(this.elLightbox);
    }

    // 1. HEADER BAR
    const header = this.el("header", "header-bar");
    this.elHeaderBar = header;

    const topRow = this.el("div", "header-top-row");
    const title = this.el("div", "header-title");
    title.append(
      this.el("span", "header-logo", "🎬"),
      this.el("span", "header-title-text", "NovelAI V4.5 / V5 故事线 & 全体位工作台")
    );

    this.elMobilePerspBtn = this.el(
      "button",
      "btn-sm pill mobile-only mobile-persp-btn",
      this.cfg.perspective_mode === "pov" ? "👁️ POV" : "🎥 3rd"
    );
    this.elMobilePerspBtn.title = "快捷切换第一人称 POV / 第三人称 3rd";
    this.elMobilePerspBtn.addEventListener("click", () => {
      this.cfg.perspective_mode = this.cfg.perspective_mode === "pov" ? "3rd" : "pov";
      this.syncControlsFromConfig();
      this.saveCfgAndRefresh();
    });

    this.elMobileHeaderToggleBtn = this.el(
      "button",
      "btn-sm mobile-only mobile-header-toggle",
      "🎛️ 预设/顶栏 ▾"
    );
    this.elMobileHeaderToggleBtn.addEventListener("click", () => {
      this.setMobileHeaderOpen(!this.mobileHeaderOpen);
    });
    topRow.append(title, this.elMobilePerspBtn, this.elMobileHeaderToggleBtn);
    header.appendChild(topRow);

    const collapsible = this.el("div", "header-collapsible");

    const presetGrp = this.el("div", "header-group header-preset-group");
    presetGrp.appendChild(this.el("span", "hint-text", "角色预设:"));
    this.elPresetSelect = this.el("select", "preset-select");
    this.populatePresetDropdown();
    this.elPresetSelect.addEventListener("change", () => {
      this.loadPresetByName(this.elPresetSelect.value);
    });
    presetGrp.appendChild(this.elPresetSelect);

    const btnSavePreset = this.el("button", "btn-sm", "💾 存预设");
    btnSavePreset.title = "将当前完整配置保存为自定义预设 (localStorage)";
    btnSavePreset.addEventListener("click", () => this.onSavePreset());

    const btnDelPreset = this.el("button", "btn-sm", "🗑️");
    btnDelPreset.title = "删除当前选中的自定义预设";
    btnDelPreset.addEventListener("click", () => this.onDeletePreset());

    const btnImportJson = this.el("button", "btn-sm", "📥 导入JSON");
    btnImportJson.title = "导入 character_presets.json 格式预设文件";
    btnImportJson.addEventListener("click", () => this.onImportPresetsJson());

    const btnExportJson = this.el("button", "btn-sm", "📤 导出JSON");
    btnExportJson.title = "导出所有自定义预设为 JSON 文件";
    btnExportJson.addEventListener("click", () => this.onExportPresetsJson());

    presetGrp.append(btnSavePreset, btnDelPreset, btnImportJson, btnExportJson);
    collapsible.appendChild(presetGrp);

    // Perspective & Multi-panel controls
    const modeGrp = this.el("div", "header-group header-mode-group");
    const mkPerspRadio = (val: PerspectiveMode, lbl: string) => {
      const wrap = this.el("label", "radio-pill");
      const r = this.el("input");
      r.type = "radio";
      r.name = "persp_mode";
      r.value = val;
      r.checked = this.cfg.perspective_mode === val;
      r.addEventListener("change", () => {
        if (r.checked) {
          this.cfg.perspective_mode = val;
          this.saveCfgAndRefresh();
        }
      });
      wrap.append(r, document.createTextNode(lbl));
      return wrap;
    };
    modeGrp.append(mkPerspRadio("pov", "👁️ 第一人称 POV"), mkPerspRadio("3rd", "🎥 第三人称 3rd"));

    const mpSel = this.el("select");
    mpSel.title = "S03 / S04 多格或单图拆分模式";
    for (const [lbl, code] of Object.entries(MULTI_PANEL_MODE_PRESETS)) {
      const opt = this.el("option", "", lbl);
      opt.value = code;
      if (code === this.cfg.multi_panel_mode) opt.selected = true;
      mpSel.appendChild(opt);
    }
    mpSel.addEventListener("change", () => {
      this.cfg.multi_panel_mode = mpSel.value as MultiPanelMode;
      this.saveCfgAndRefresh();
    });
    modeGrp.appendChild(mpSel);

    const chkSub = this.el("label", "check-row");
    const subInput = this.el("input");
    subInput.type = "checkbox";
    subInput.checked = this.cfg.include_sub_variants;
    subInput.addEventListener("change", () => {
      this.cfg.include_sub_variants = subInput.checked;
      this.saveCfgAndRefresh();
    });
    chkSub.append(subInput, document.createTextNode("含备选变体"));
    modeGrp.appendChild(chkSub);
    collapsible.appendChild(modeGrp);

    collapsible.appendChild(this.el("div", "spacer header-spacer"));

    const capGrp = this.el("div", "header-capsules");

    // Top Precise Reference (Style+Chara / Chara单独) Capsule
    this.elRefCapsule = this.el("button", "cam-capsule", "🪪 参照: 未启用");
    this.elRefCapsule.title =
      "左键：打开「⚡ NAI生图」V4.5 Full 精密参照 (Style+Chara 混合 / Chara 单独) 面板 | 右键：快捷启用/暂停当前参照";
    this.elRefCapsule.addEventListener("click", () => {
      this.switchLeftTab("tab-api");
      this.switchMobilePane("config");
      this.setMobileHeaderOpen(false);
    });
    this.elRefCapsule.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.togglePreciseRefEnabled();
    });
    capGrp.appendChild(this.elRefCapsule);

    // Top Expression Quick Capsule
    this.elExprCapsule = this.el("button", "cam-capsule", "😊 表情: 🔄 随本幕默认");
    this.elExprCapsule.title = "左键：跳转到「😊 表情」设置页 | 右键：一键复位为随本幕默认表情";
    this.elExprCapsule.addEventListener("click", () => {
      this.switchLeftTab("tab-expr");
      this.switchMobilePane("config");
      this.setMobileHeaderOpen(false);
    });
    this.elExprCapsule.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.resetExpressionOverride();
    });
    capGrp.appendChild(this.elExprCapsule);

    // Top 3D Camera Capsule
    this.elCamCapsule = this.el("button", "cam-capsule", "🎥 机位: 🔄 随本幕默认");
    this.elCamCapsule.title = "左键：跳转到「🎥 3D机位」设置页 | 右键：一键复位为随本幕默认机位";
    this.elCamCapsule.addEventListener("click", () => {
      this.switchLeftTab("tab-camera");
      this.switchMobilePane("config");
      this.setMobileHeaderOpen(false);
    });
    this.elCamCapsule.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.resetCameraOverride();
    });
    capGrp.appendChild(this.elCamCapsule);

    collapsible.appendChild(capGrp);
    header.appendChild(collapsible);
    this.root.appendChild(header);

    // 2. WORKBENCH BODY (Left Config + Right Suites & Preview)
    const body = this.el("div", "workbench-body");
    const leftPane = this.buildLeftPane();
    const rightPane = this.buildRightPane();
    body.append(leftPane, rightPane);
    this.root.appendChild(body);

    // 3. STATUS BAR
    const footer = this.el("footer", "status-bar");
    this.elStatusText = this.el("span", "", "就绪");
    const rightFooter = this.el("div", "header-group");
    this.elAnlasBadge = this.el("span", "hint-text", "Anlas: 未查询");
    this.elMountedDirBadge = this.el("span", "hint-text", "存储: 浏览器下载 / ZIP模式");
    rightFooter.append(this.elAnlasBadge, this.el("span", "hint-text", "|"), this.elMountedDirBadge);
    footer.append(this.elStatusText, rightFooter);
    this.root.appendChild(footer);

    // 3.5 MOBILE STICKY BOTTOM NAV
    this.root.appendChild(this.buildMobileBottomNav());

    // 4. LIGHTBOX MODAL & FULLSCREEN CAROUSEL
    this.elLightbox = this.el("div", "lightbox-modal");
    const lbBar = this.el("div", "lightbox-bar");
    const lbLeft = this.el("div", "header-group");
    this.elLightboxMeta = this.el("span", "", "");
    this.elLightboxProgress = this.el("span", "lightbox-status-pill", "");
    this.elLightboxStopBatchBtn = this.el("button", "btn-sm btn-danger", "⏹ 停止连出");
    this.elLightboxStopBatchBtn.style.display = "none";
    this.elLightboxStopBatchBtn.addEventListener("click", () => {
      if (this.batchAbortCtrl) {
        this.batchAbortCtrl.abort();
        this.appendLog("⏹ 全屏轮播页触发中断指令，等待当前请求结束...");
        this.updateLightboxBatchStatus();
      }
    });
    lbLeft.append(this.elLightboxMeta, this.elLightboxProgress, this.elLightboxStopBatchBtn);

    const lbBtns = this.el("div", "header-group");
    this.elLightboxFollowBtn = this.el("button", "btn-sm", "📌 跟踪最新");
    this.elLightboxFollowBtn.title =
      "开启后每当新图（含自动2x放大）完成时立即切到最新一张；与按秒轮播互斥";
    this.elLightboxFollowBtn.addEventListener("click", () => {
      if (this.carouselMode === "follow_latest") {
        this.setCarouselMode("manual", false, false);
      } else {
        this.setCarouselMode("follow_latest", true, true);
      }
    });

    this.elLightboxPlayBtn = this.el("button", "btn-sm btn-blue", "▶️ 按秒轮播");
    this.elLightboxPlayBtn.title = "按右侧秒数循环播放画廊图片（快捷键：空格 Space）；后台出新图时不打断计时";
    this.elLightboxPlayBtn.addEventListener("click", () => {
      if (this.carouselMode === "timed") {
        this.setCarouselMode("manual", false, false);
      } else {
        this.setCarouselMode("timed", false, true);
      }
    });

    const intervalGrp = this.el("div", "lightbox-interval-group");
    this.elLightboxIntervalBtns.clear();
    for (const sec of [2, 3, 4, 6, 8]) {
      const b = this.el("button", "lightbox-sec-btn", `${sec}s`);
      b.title = `按 ${sec} 秒/张自动轮播`;
      b.addEventListener("click", () => {
        this.apiSettings.carousel_interval_sec = sec;
        saveApiSettings(this.apiSettings);
        this.setCarouselMode("timed", false, true);
      });
      this.elLightboxIntervalBtns.set(sec, b);
      intervalGrp.appendChild(b);
    }

    const btnLbFullscreen = this.el("button", "btn-sm", "🖥️ 真全屏");
    btnLbFullscreen.title = "切换浏览器全屏显示 (F11 效果)";
    btnLbFullscreen.addEventListener("click", () => void this.toggleNativeFullscreen());

    const btnLbChecker = this.el("button", "btn-sm", "🏁 透明棋盘底");
    btnLbChecker.addEventListener("click", () => {
      this.checkerboardOn = !this.checkerboardOn;
      this.syncCheckerboard();
    });
    const btnLbZoom = this.el("button", "btn-sm", "🔍 100% 原始尺寸");
    btnLbZoom.addEventListener("click", () => {
      this.lightboxZoom1x = !this.lightboxZoom1x;
      this.elLightboxImg.classList.toggle("zoomed-1x", this.lightboxZoom1x);
      btnLbZoom.textContent = this.lightboxZoom1x ? "🔍 适应窗口" : "🔍 100% 原始尺寸";
    });
    const btnLbClose = this.el("button", "btn-sm btn-danger", "✕ 关闭 (Esc)");
    btnLbClose.addEventListener("click", () => this.closeLightbox());
    lbBtns.append(
      this.elLightboxFollowBtn,
      this.elLightboxPlayBtn,
      intervalGrp,
      btnLbFullscreen,
      btnLbChecker,
      btnLbZoom,
      btnLbClose
    );
    lbBar.append(lbLeft, lbBtns);

    const lbStage = this.el("div", "lightbox-stage");
    const btnPrev = this.el("button", "lightbox-nav-btn prev", "◀");
    btnPrev.title = "上一张 (←)";
    btnPrev.addEventListener("click", (e) => {
      e.stopPropagation();
      this.handleManualLightboxStep(-1);
    });
    const btnNext = this.el("button", "lightbox-nav-btn next", "▶");
    btnNext.title = "下一张 (→)";
    btnNext.addEventListener("click", (e) => {
      e.stopPropagation();
      this.handleManualLightboxStep(1);
    });

    this.elLightboxBody = this.el("div", "lightbox-body checkerboard");
    this.elLightboxImg = this.el("img");
    this.elLightboxImg.addEventListener("click", () => {
      this.lightboxZoom1x = !this.lightboxZoom1x;
      this.elLightboxImg.classList.toggle("zoomed-1x", this.lightboxZoom1x);
    });
    this.elLightboxBody.appendChild(this.elLightboxImg);
    lbStage.append(btnPrev, this.elLightboxBody, btnNext);

    let touchStartX = 0;
    let touchStartY = 0;
    lbStage.addEventListener(
      "touchstart",
      (e: TouchEvent) => {
        if (e.touches.length === 1) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
        }
      },
      { passive: true }
    );
    lbStage.addEventListener(
      "touchend",
      (e: TouchEvent) => {
        if (this.lightboxZoom1x || this.gallery.length <= 1 || e.changedTouches.length === 0) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) {
          this.handleManualLightboxStep(dx > 0 ? -1 : 1);
        }
      },
      { passive: true }
    );

    this.elLightboxStrip = this.el("div", "lightbox-filmstrip");
    this.elLightbox.append(lbBar, lbStage, this.elLightboxStrip);
    document.body.appendChild(this.elLightbox);
    this.syncCarouselControlsUi();

    window.addEventListener("keydown", (e) => {
      if (!this.elLightbox.classList.contains("open")) return;
      if (e.key === "Escape") {
        this.closeLightbox();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        this.handleManualLightboxStep(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        this.handleManualLightboxStep(1);
      } else if (e.key === " ") {
        e.preventDefault();
        if (this.carouselMode === "timed") {
          this.setCarouselMode("manual", false, false);
        } else {
          this.setCarouselMode("timed", false, true);
        }
      }
    });
  }

  private buildMobileBottomNav(): HTMLElement {
    const nav = this.el("nav", "mobile-bottom-nav");
    nav.setAttribute("aria-label", "移动端主导航");
    const items: Array<["config" | "scenes" | "output", string, string]> = [
      ["config", "⚙️", "角色·参数"],
      ["scenes", "🎬", "选幕·51式"],
      ["output", "🖼️", "预览·词条"],
    ];
    for (const [pane, icon, label] of items) {
      const btn = this.el("button", `mobile-nav-btn ${pane === this.activeMobilePane ? "active" : ""}`);
      btn.dataset.mobileNav = pane;
      btn.append(this.el("span", "mobile-nav-icon", icon), this.el("span", "mobile-nav-lbl", label));
      if (pane === "output") {
        this.elMobileOutBadge = this.el("span", "mobile-nav-badge", "");
        btn.appendChild(this.elMobileOutBadge);
      }
      btn.addEventListener("click", () => this.switchMobilePane(pane));
      nav.appendChild(btn);
    }
    return nav;
  }

  private buildLeftPane(): HTMLElement {
    const pane = this.el("aside", "left-pane");
    const tabBar = this.el("div", "tab-bar");
    const tabs: Array<[string, string]> = [
      ["tab-identity", "👤 身份"],
      ["tab-body", "👗 穿搭"],
      ["tab-style", "🎨 画风局部"],
      ["tab-expr", "😊 表情"],
      ["tab-camera", "🎥 3D机位"],
      ["tab-modules", "🎛️ 模块"],
      ["tab-api", "⚡ NAI生图"],
    ];

    const panels = new Map<string, HTMLElement>();
    for (const [id, label] of tabs) {
      const btn = this.el("button", `tab-btn ${id === this.activeLeftTab ? "active" : ""}`, label);
      btn.dataset.tabId = id;
      btn.addEventListener("click", () => this.switchLeftTab(id));
      tabBar.appendChild(btn);

      const panel = this.el("div", `tab-panel ${id === this.activeLeftTab ? "active" : ""}`);
      panel.dataset.panelId = id;
      panels.set(id, panel);
    }
    pane.appendChild(tabBar);
    for (const panel of panels.values()) {
      pane.appendChild(panel);
    }

    // Tab 1: Identity
    const pId = panels.get("tab-identity")!;
    const cardId = this.el("div", "field-card");
    cardId.appendChild(this.el("div", "field-card-title", "角色标签与外形基础 (Danbooru)"));
    cardId.append(
      this.makeInputRow("char_tag", "角色核心 Tag (char_tag)", "例如: javelin (azur lane) 或 original"),
      this.makeInputRow("eng_name", "T5 句用英文称呼 (eng_name)", "例如: Javelin / Hood / the girl"),
      this.makeInputRow("eye_color", "瞳色标签 (eye_color)", "例如: purple eyes（闭眼幕次自动隐藏）"),
      this.makeInputRow("hair_tags", "发型与头饰 (hair_tags)", "short purple hair, hair ribbon..."),
      this.makeInputRow("canon_neg_tags", "原设服装负向防串词 (canon_neg_tags)", "更换便服时自动加入 -2 屏蔽"),
      this.makeInputRow("extra_char_tags", "额外常驻特征 (extra_char_tags)", "可选追加角色常驻 Tag")
    );
    pId.appendChild(cardId);

    // Tab 2: Body & Outfit
    const pBody = panels.get("tab-body")!;
    const cardBody = this.el("div", "field-card");
    cardBody.appendChild(this.el("div", "field-card-title", "体型 · 胸围 · 肤色"));
    cardBody.append(
      this.makeSelectRow("body_preset", "体型预设", Object.keys(BODY_PRESETS)),
      this.makeSelectRow("bust_preset", "胸围尺寸", Object.keys(BUST_PRESETS)),
      this.makeSelectRow("skin_preset", "肤色质感", Object.keys(SKIN_PRESETS))
    );
    pBody.appendChild(cardBody);

    const cardOutfit = this.el("div", "field-card");
    cardOutfit.appendChild(this.el("div", "field-card-title", "服装款式 · 穿脱暴露 · 鞋袜"));
    cardOutfit.append(
      this.makeSelectRow("outfit_preset", "服装预设", Object.keys(OUTFIT_PRESETS), () => {
        const curLeg = this.cfg.legwear_preset;
        if (this.cfg.outfit_preset.includes("角色标签原设默认服装") && curLeg === "赤足裸腿（barefoot 默认）") {
          this.cfg.legwear_preset = "🌟 随角色原设鞋袜 / 不强制赤足";
        } else if (this.cfg.outfit_preset.includes("宽松滑肩白T恤") && curLeg === "🌟 随角色原设鞋袜 / 不强制赤足") {
          this.cfg.legwear_preset = "赤足裸腿（barefoot 默认）";
        }
        this.syncControlsFromConfig();
      }),
      this.makeSelectRow("outfit_state_mode", "穿脱与暴露方式", Object.keys(OUTFIT_STATE_PRESETS)),
      this.makeCheckboxRow("keep_canon_elements", "允许保留角色原皮衣装配件（关闭原设负向屏蔽）"),
      this.makeInputRow("custom_outfit_tags", "自定义服装 Tag / 原设补充框", "如 1.45::reverse bunnysuit::, ..."),
      this.makeSelectRow("legwear_preset", "足部与丝袜", Object.keys(LEGWEAR_PRESETS))
    );
    pBody.appendChild(cardOutfit);

    const cardAcc = this.el("div", "field-card");
    cardAcc.appendChild(this.el("div", "field-card-title", "额外萌点配件开关"));
    cardAcc.append(
      this.makeCheckboxRow("add_cat_ears", "🐱 猫耳与猫尾 (cat ears, animal ear fluff, cat tail)"),
      this.makeCheckboxRow("add_horns_tail", "😈 恶魔角与尾巴 (demon horns, demon tail)"),
      this.makeCheckboxRow("add_glasses", "👓 半框眼镜 (semi-rimless glasses)"),
      this.makeCheckboxRow("add_choker", "🖤 项圈 (black choker)"),
      this.makeCheckboxRow("add_extra_sweat", "💦 额外汗珠蒸汽 (sweatdrop, steam)")
    );
    pBody.appendChild(cardAcc);

    // Tab 3: Style & Anatomy
    const pStyle = panels.get("tab-style")!;
    const cardSt = this.el("div", "field-card");
    cardSt.appendChild(this.el("div", "field-card-title", "画风渲染流派"));
    cardSt.append(
      this.makeSelectRow("style_preset", "画风预设", Object.keys(STYLE_PRESETS), () => {
        const sn = this.cfg.style_preset;
        if (sn.includes("M6") || sn.includes("无描边暖杏真肤") || sn.includes("无界油画")) {
          const isTune2 = sn.includes("M6-Tune2");
          this.apiSettings.scale = 4.8;
          this.apiSettings.cfg_rescale = isTune2 ? 0.0 : 0.25;
          saveApiSettings(this.apiSettings);
          this.syncApiInputs();
          this.setStatus(
            `🌤️ 已切换至 ${isTune2 ? "M6-Tune2 无界油画" : "M6 保留款"}（已自动同步 Scale=4.8, Rescale=${this.apiSettings.cfg_rescale}）`
          );
        } else if (Number(this.apiSettings.scale.toFixed(1)) === 4.8) {
          this.apiSettings.scale = this.apiSettings.model === MODEL_V4_5_FULL ? 7.0 : 6.0;
          this.apiSettings.cfg_rescale = 0.0;
          saveApiSettings(this.apiSettings);
          this.syncApiInputs();
        }
      }),
      this.makeInputRow("custom_style_pos", "自定义画风正向（选自定义画风时生效）", "正向笔触/光影标签..."),
      this.makeInputRow("custom_style_neg", "自定义画风负向（选自定义画风时生效）", "负向屏蔽标签...")
    );
    pStyle.appendChild(cardSt);

    const cardLightEnv = this.el("div", "field-card");
    cardLightEnv.appendChild(this.el("div", "field-card-title", "🌅 全局光影氛围与环境覆盖"));
    cardLightEnv.append(
      this.makeSelectRow("lighting_preset", "全局光影预设", Object.keys(LIGHTING_PRESETS)),
      this.makeSelectRow("env_preset", "全局环境覆盖", Object.keys(ENV_PRESETS))
    );
    pStyle.appendChild(cardLightEnv);

    const cardAnat = this.el("div", "field-card");
    cardAnat.appendChild(this.el("div", "field-card-title", "局部四维模块与流体倍率"));
    cardAnat.append(
      this.makeSelectRow("morph_preset", "第一维 · 先天器型", Object.keys(MORPH_PRESETS)),
      this.makeSelectRow("pubic_preset", "第二维 · 毛发修饰", Object.keys(PUBIC_PRESETS)),
      this.makeSelectRow("pigment_preset", "第三维 · 色泽色素", Object.keys(PIGMENT_PRESETS))
    );
    const fluidRow = this.el("div", "field-row");
    const fluidLbl = this.el("label", "lbl", `全局流体倍率: ${this.cfg.fluid_scale.toFixed(2)}x`);
    const fluidSlider = this.el("input");
    fluidSlider.type = "range";
    fluidSlider.min = "0.5";
    fluidSlider.max = "1.6";
    fluidSlider.step = "0.05";
    fluidSlider.value = String(this.cfg.fluid_scale);
    fluidSlider.addEventListener("input", () => {
      this.cfg.fluid_scale = parseFloat(fluidSlider.value);
      fluidLbl.textContent = `全局流体倍率: ${this.cfg.fluid_scale.toFixed(2)}x`;
      this.saveCfgAndRefresh();
    });
    this.formBindings.set("fluid_scale", fluidSlider);
    fluidRow.append(fluidLbl, fluidSlider);
    cardAnat.appendChild(fluidRow);
    pStyle.appendChild(cardAnat);

    // Tab 3.5: Character Expression Editor
    this.buildExpressionTab(panels.get("tab-expr")!);

    // Tab 4: 3D Spherical Camera Rig
    const pCam = panels.get("tab-camera")!;
    const cardCam = this.el("div", "field-card");
    const camHead = this.el("div", "field-card-title");
    camHead.appendChild(this.el("span", "", "🌐 3D 球面机位雷达控制器"));
    const btnCamReset = this.el("button", "btn-sm", "🔄 复位随本幕默认");
    btnCamReset.addEventListener("click", () => this.resetCameraOverride());
    camHead.appendChild(btnCamReset);
    cardCam.appendChild(camHead);

    cardCam.appendChild(
      this.makeCheckboxRow("cam_enable_override", "✅ 启用全局 3D 机位覆盖（关闭时保留每幕原生机位；拖拽雷达盘自动开启）")
    );

    const radarWrap = this.el("div", "radar-wrap");
    const radarCanvas = this.el("canvas", "radar-canvas");
    radarWrap.appendChild(radarCanvas);
    cardCam.appendChild(radarWrap);

    this.radarCtrl = new CameraRadarCanvas(
      radarCanvas,
      (next) => {
        this.cfg.cam_enable_override = next.enabled;
        this.cfg.cam_azimuth = next.azimuth;
        this.cfg.cam_elevation = next.elevation;
        this.syncControlsFromConfig();
        this.saveCfgAndRefresh();
      },
      () => this.resetCameraOverride()
    );

    // Numeric sliders for Azimuth & Elevation
    const azElGrid = this.el("div", "grid-2");
    azElGrid.style.marginTop = "8px";
    const mkRangeBox = (key: "cam_azimuth" | "cam_elevation", titleText: string, min: number, max: number) => {
      const box = this.el("div", "field-row");
      const lbl = this.el("label", "lbl", titleText);
      const inp = this.el("input");
      inp.type = "range";
      inp.min = String(min);
      inp.max = String(max);
      inp.step = "1";
      inp.addEventListener("input", () => {
        this.cfg.cam_enable_override = true;
        this.cfg[key] = parseInt(inp.value, 10);
        this.syncControlsFromConfig();
        this.saveCfgAndRefresh();
      });
      this.formBindings.set(key, inp);
      box.append(lbl, inp);
      return box;
    };
    azElGrid.append(
      mkRangeBox("cam_azimuth", "水平环绕角 (-180° ~ +180°)", -180, 180),
      mkRangeBox("cam_elevation", "垂直俯仰角 (-80° ~ +85°)", -80, 85)
    );
    cardCam.appendChild(azElGrid);

    // Quick Camera Capsules
    const quickTitle = this.el("label", "lbl", "一键快捷机位胶囊:");
    quickTitle.style.display = "block";
    quickTitle.style.marginTop = "8px";
    cardCam.appendChild(quickTitle);
    const quickWrap = this.el("div", "flex-wrap-row");
    quickWrap.style.marginTop = "4px";
    for (const [lbl, az, el, shotKey, wide] of CAMERA_QUICK_PRESETS) {
      const pill = this.el("button", "btn-sm pill", lbl);
      pill.addEventListener("click", () => {
        this.cfg.cam_enable_override = true;
        this.cfg.cam_azimuth = az;
        this.cfg.cam_elevation = el;
        if (shotKey) this.cfg.cam_shot_preset = shotKey;
        this.cfg.cam_wide_lens = wide;
        this.syncControlsFromConfig();
        this.saveCfgAndRefresh();
      });
      quickWrap.appendChild(pill);
    }
    cardCam.appendChild(quickWrap);

    cardCam.appendChild(this.makeSelectRow("cam_shot_preset", "景别距离 (Shot Size)", Object.keys(CAMERA_SHOT_PRESETS)));
    cardCam.appendChild(this.makeSelectRow("cam_gaze_preset", "视线跟随模式 (Gaze)", Object.keys(CAMERA_GAZE_PRESETS)));
    const lensRow = this.el("div", "grid-2");
    lensRow.append(
      this.makeCheckboxRow("cam_wide_lens", "🔥 超广角强透视"),
      this.makeCheckboxRow("cam_dutch_angle", "📐 荷兰斜角构图")
    );
    cardCam.appendChild(lensRow);
    pCam.appendChild(cardCam);

    // Tab 5: Precise Reference Modules
    const pMod = panels.get("tab-modules")!;
    const cardRefShortcut = this.el("div", "field-card");
    const refShortHead = this.el("div", "field-card-title");
    refShortHead.appendChild(this.el("span", "", "🪪 V4.5 Full 角色精密参照 (Character) 联动"));
    const btnJumpRef = this.el("button", "btn-sm btn-primary", "📤 前往上传/调参");
    btnJumpRef.addEventListener("click", () => {
      this.switchLeftTab("tab-api");
      this.switchMobilePane("config");
    });
    refShortHead.appendChild(btnJumpRef);
    cardRefShortcut.appendChild(refShortHead);
    this.elModTabRefBanner = this.el(
      "div",
      "hint-text",
      "当前尚未载入角色参照图。可在「⚡ NAI生图」上传参考图并配合下方「👤 精密参照：仅锁人物」剔除原设冲突词。"
    );
    cardRefShortcut.appendChild(this.elModTabRefBanner);
    pMod.appendChild(cardRefShortcut);

    const cardModPresets = this.el("div", "field-card");
    cardModPresets.appendChild(this.el("div", "field-card-title", "快捷精密参照预设组"));
    const modPresetBtns = this.el("div", "flex-wrap-row");
    for (const [name, mapping] of Object.entries(MODULE_SWITCH_PRESETS)) {
      const b = this.el("button", "btn-sm", name);
      b.addEventListener("click", () => {
        for (const [k, v] of Object.entries(mapping)) {
          (this.cfg as unknown as Record<string, boolean>)[k] = v;
        }
        this.syncControlsFromConfig();
        this.saveCfgAndRefresh();
        this.setStatus(`🎛️ 已应用模块开关方案：${name}`);
      });
      modPresetBtns.appendChild(b);
    }
    cardModPresets.appendChild(modPresetBtns);
    pMod.appendChild(cardModPresets);

    const cardModGrid = this.el("div", "field-card");
    cardModGrid.appendChild(this.el("div", "field-card-title", "14 维精细开关（OFF 时精确剔除词条）"));
    const modGrid = this.el("div", "module-grid");
    for (const [key, label] of MODULE_LABELS) {
      const row = this.el("label", "check-row");
      const cb = this.el("input");
      cb.type = "checkbox";
      cb.addEventListener("change", () => {
        (this.cfg as unknown as Record<string, boolean>)[key] = cb.checked;
        this.saveCfgAndRefresh();
      });
      this.moduleBindings.set(key, cb);
      row.append(cb, document.createTextNode(label));
      modGrid.appendChild(row);
    }
    cardModGrid.appendChild(modGrid);
    pMod.appendChild(cardModGrid);

    // Tab 6: NAI Direct API Generation & Storage
    this.buildApiTab(panels.get("tab-api")!);

    return pane;
  }

  private buildExpressionTab(panel: HTMLElement): void {
    const cardPreset = this.el("div", "field-card");
    const head = this.el("div", "field-card-title");
    head.appendChild(this.el("span", "", "🎭 角色表情预设与一键胶囊"));
    const btnReset = this.el("button", "btn-sm", "🔄 复位随本幕默认");
    btnReset.addEventListener("click", () => this.resetExpressionOverride());
    head.appendChild(btnReset);
    cardPreset.appendChild(head);

    const pillWrap = this.el("div", "flex-wrap-row");
    pillWrap.style.marginBottom = "8px";
    this.elExprPresetPills.clear();
    for (const [fullKey, info] of Object.entries(EXPRESSION_PRESETS)) {
      if (info.code === "auto" || info.code === "custom_only") continue;
      const pill = this.el("button", "btn-sm pill", info.short);
      pill.title = fullKey;
      pill.addEventListener("click", () => {
        this.cfg.expr_preset = fullKey;
        this.syncControlsFromConfig();
        this.saveCfgAndRefresh();
      });
      this.elExprPresetPills.set(fullKey, pill);
      pillWrap.appendChild(pill);
    }
    cardPreset.appendChild(pillWrap);

    cardPreset.append(
      this.makeSelectRow("expr_preset", "表情总预设", Object.keys(EXPRESSION_PRESETS), () => {
        this.syncControlsFromConfig();
      }),
      this.makeCheckboxRow("expr_override_sleeping", "🌙 强制覆盖 S06/S07 熟睡闭眼幕次（默认保护熟睡闭眼）")
    );
    panel.appendChild(cardPreset);

    const cardParts = this.el("div", "field-card");
    cardParts.appendChild(this.el("div", "field-card-title", "👁️ 五官细分覆盖与瞳孔特效"));
    cardParts.append(
      this.makeSelectRow("expr_eye_state", "眼部状态覆盖", Object.keys(EXPRESSION_EYE_PRESETS)),
      this.makeSelectRow("expr_mouth_state", "嘴部状态覆盖", Object.keys(EXPRESSION_MOUTH_PRESETS)),
      this.makeSelectRow("expr_brow_blush", "眉眼与羞红强度", Object.keys(EXPRESSION_BLUSH_PRESETS))
    );

    const fxRow = this.el("div", "flex-wrap-row");
    fxRow.style.marginTop = "4px";
    fxRow.style.marginBottom = "6px";
    fxRow.append(
      this.makeCheckboxRow("expr_heart_eyes", "💖 爱心瞳"),
      this.makeCheckboxRow("expr_empty_eyes", "🖤 空洞失神瞳"),
      this.makeCheckboxRow("expr_tears", "😭 泪珠滑落")
    );
    cardParts.appendChild(fxRow);

    cardParts.appendChild(
      this.makeInputRow("custom_expression_tags", "自定义表情补充 Tag", "例如: open mouth, smirk, tongue out")
    );
    panel.appendChild(cardParts);

    const cardPrev = this.el("div", "field-card");
    cardPrev.appendChild(this.el("div", "field-card-title", "🔍 表情编译结果实时预览"));
    this.elExprPreviewBox = this.el("div", "log-box");
    this.elExprPreviewBox.style.maxHeight = "130px";
    this.elExprPreviewBox.textContent = "🔄 当前跟随各幕次默认微表情（未覆盖）";
    cardPrev.appendChild(this.elExprPreviewBox);
    panel.appendChild(cardPrev);
  }

  private buildApiTab(panel: HTMLElement): void {
    const cardConn = this.el("div", "field-card");
    cardConn.appendChild(this.el("div", "field-card-title", "🔑 NovelAI 官方直连认证（CORS 纯前端直出）"));

    this.elApiSubBanner = this.el(
      "div",
      "sub-banner",
      "💎 Opus 订阅与点数状态：待查询（填入 Token 后将自动获取，或点击「🔍 查点数」）"
    );
    cardConn.appendChild(this.elApiSubBanner);

    const tokRow = this.el("div", "field-row");
    tokRow.appendChild(this.el("label", "lbl", "Persistent API Token (pst-...，仅存于本机浏览器 localStorage)"));
    const tokWrap = this.el("div", "header-group");
    const tokInput = this.el("input");
    tokInput.type = "password";
    tokInput.id = "api-token-input";
    tokInput.style.flex = "1";
    tokInput.placeholder = "pst-...";
    tokInput.value = this.apiSettings.api_token;
    tokInput.addEventListener("input", () => {
      this.apiSettings.api_token = tokInput.value;
      saveApiSettings(this.apiSettings);
    });
    const btnToggleVis = this.el("button", "btn-sm", "👁️");
    btnToggleVis.addEventListener("click", () => {
      tokInput.type = tokInput.type === "password" ? "text" : "password";
    });
    const btnCheckSub = this.el("button", "btn-sm btn-blue", "🔍 查点数");
    btnCheckSub.addEventListener("click", () => void this.onCheckSubscription(false));
    tokWrap.append(tokInput, btnToggleVis, btnCheckSub);
    tokRow.appendChild(tokWrap);
    cardConn.appendChild(tokRow);

    // Precise Reference (Style+Chara / Chara单独 / 单图Chara&Style - V4.5 Full) Card
    const cardRef = this.el("div", "field-card precise-ref-card");
    const refHead = this.el("div", "field-card-title");
    refHead.appendChild(this.el("span", "", "🪪 Precise Reference · 精密参照 (V4.5 Full)"));
    const refHeadBtns = this.el("div", "header-group");

    const fileInputChar = this.el("input");
    fileInputChar.type = "file";
    fileInputChar.accept = "image/*";
    fileInputChar.style.display = "none";
    fileInputChar.addEventListener("change", () => {
      const f = fileInputChar.files?.[0];
      if (f) void this.handleUploadPreciseRefFile("char", f);
      fileInputChar.value = "";
    });

    const fileInputStyle = this.el("input");
    fileInputStyle.type = "file";
    fileInputStyle.accept = "image/*";
    fileInputStyle.style.display = "none";
    fileInputStyle.addEventListener("change", () => {
      const f = fileInputStyle.files?.[0];
      if (f) void this.handleUploadPreciseRefFile("style", f);
      fileInputStyle.value = "";
    });

    const btnUploadChar = this.el("button", "btn-sm btn-primary", "📤 人物图");
    btnUploadChar.title = "上传 Character 人物基图（也可直接拖入下方角色槽位，或选中槽位后 Ctrl+V 粘贴）";
    btnUploadChar.addEventListener("click", () => {
      this.setActivePasteSlot("char");
      fileInputChar.click();
    });

    const btnUploadStyle = this.el("button", "btn-sm", "🎨 画风图");
    btnUploadStyle.title = "上传 Style 画风基图（自动切至「Style+Chara 混合」双槽模式）";
    btnUploadStyle.addEventListener("click", () => {
      if (this.apiSettings.precise_ref_workflow !== "style_plus_chara") {
        this.setPreciseRefWorkflow("style_plus_chara");
      }
      this.setActivePasteSlot("style");
      fileInputStyle.click();
    });

    refHeadBtns.append(fileInputChar, fileInputStyle, btnUploadChar, btnUploadStyle);
    refHead.appendChild(refHeadBtns);
    cardRef.appendChild(refHead);

    // 3-Way Workflow Mode Bar: Style+Chara双图混合 / Chara单独 / 单图Chara&Style
    const wfBar = this.el("div", "precise-ref-workflow-bar");
    const wfOptions: Array<[PreciseRefWorkflowMode, string, string]> = [
      [
        "style_plus_chara",
        "🎨+👤 Style+Chara 混合",
        "双槽独立混合：同时附带 Character 人物基图 + Style 画风基图（各 +5 Anlas，共 +10 Anlas）",
      ],
      [
        "chara_only",
        "👤 Chara 单独",
        "仅发送 Character 人物基图（+5 Anlas），自动暂停画风基图以配合本台文字画风词条混用（不删除已缓存画风图）",
      ],
      [
        "single_char_and_style",
        "👤&🎨 单图 Chara&Style",
        "单张参考图同时锁定 Character & Style 档位（base_caption=character&style，单图 +5 Anlas）",
      ],
    ];
    this.elPreciseWorkflowBtns.clear();
    for (const [wfId, wfLabel, wfTip] of wfOptions) {
      const b = this.el("button", "precise-ref-wf-btn", wfLabel);
      b.title = wfTip;
      b.addEventListener("click", () => this.setPreciseRefWorkflow(wfId));
      this.elPreciseWorkflowBtns.set(wfId, b);
      wfBar.appendChild(b);
    }
    cardRef.appendChild(wfBar);

    const buildRefSlotUi = (
      slotKind: "char" | "style",
      slotTitle: string,
      inputPrefix: string,
      initStrength: number,
      initFidelity: number,
      onApplyStrength: (val: number) => void,
      onApplyFidelity: (val: number) => void,
      onPickFile: () => void,
      onClearSlot: () => void,
      onToggleSlot: () => void
    ) => {
      const slotEl = this.el("div", "precise-ref-slot");
      slotEl.addEventListener("click", () => this.setActivePasteSlot(slotKind));
      slotEl.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.stopPropagation();
        slotEl.classList.add("drag-over");
      });
      slotEl.addEventListener("dragleave", () => {
        slotEl.classList.remove("drag-over");
      });
      slotEl.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopPropagation();
        slotEl.classList.remove("drag-over");
        this.setActivePasteSlot(slotKind);
        const f = e.dataTransfer?.files?.[0];
        if (f && f.type.startsWith("image/")) {
          void this.handleUploadPreciseRefFile(slotKind, f);
        }
      });

      const body = this.el("div", "precise-ref-body");
      const left = this.el("div", "precise-ref-left");
      const thumb = this.el("div", "precise-ref-thumb");
      thumb.title = `点击上传或替换${slotTitle}（支持拖拽图片至此框，或选中后按 Ctrl+V 粘贴）`;
      thumb.addEventListener("click", (e) => {
        e.stopPropagation();
        this.setActivePasteSlot(slotKind);
        onPickFile();
      });

      const actions = this.el("div", "precise-ref-thumb-actions");
      const btnClr = this.el("button", "btn-sm", "🗑️");
      btnClr.title = `移除当前${slotTitle}`;
      btnClr.addEventListener("click", (e) => {
        e.stopPropagation();
        onClearSlot();
      });

      const btnTgl = this.el("button", "btn-sm", "✓");
      btnTgl.title = `启用 / 暂停${slotTitle}`;
      btnTgl.addEventListener("click", (e) => {
        e.stopPropagation();
        onToggleSlot();
      });

      actions.append(btnClr, btnTgl);
      left.append(thumb, actions);

      const right = this.el("div", "precise-ref-right");
      const modeLock = this.el("div", "precise-ref-mode-lock");
      const modeTitleSpan = this.el("span", "", slotTitle);
      const modeSubSpan = this.el(
        "span",
        "hint-text",
        slotKind === "char" ? "人物槽" : "画风槽"
      );
      modeLock.append(modeTitleSpan, modeSubSpan);
      right.appendChild(modeLock);

      const strRow = this.el("div", "field-row");
      strRow.appendChild(this.el("label", "lbl", "Strength (强度)"));
      const strCtrl = this.el("div", "slider-num-row");
      const strNum = this.el("input");
      strNum.id = `${inputPrefix}-strength-num`;
      strNum.type = "number";
      strNum.min = "0";
      strNum.max = "1";
      strNum.step = "0.05";
      strNum.value = String(Number(initStrength.toFixed(2)));
      const strRange = this.el("input");
      strRange.id = `${inputPrefix}-strength-range`;
      strRange.type = "range";
      strRange.min = "0";
      strRange.max = "1";
      strRange.step = "0.01";
      strRange.value = String(initStrength);
      const syncStr = (raw: number) => {
        const clamped = Number(Math.max(0, Math.min(1, Number.isNaN(raw) ? 1 : raw)).toFixed(2));
        strNum.value = String(clamped);
        strRange.value = String(clamped);
        onApplyStrength(clamped);
      };
      strRange.addEventListener("input", () => syncStr(parseFloat(strRange.value)));
      strNum.addEventListener("change", () => syncStr(parseFloat(strNum.value)));
      strCtrl.append(strNum, strRange);
      strRow.appendChild(strCtrl);
      right.appendChild(strRow);

      const fidRow = this.el("div", "field-row");
      fidRow.appendChild(this.el("label", "lbl", "Fidelity (保真度)"));
      const fidCtrl = this.el("div", "slider-num-row");
      const fidNum = this.el("input");
      fidNum.id = `${inputPrefix}-fidelity-num`;
      fidNum.type = "number";
      fidNum.min = "0";
      fidNum.max = "1";
      fidNum.step = "0.05";
      fidNum.value = String(Number(initFidelity.toFixed(2)));
      const fidRange = this.el("input");
      fidRange.id = `${inputPrefix}-fidelity-range`;
      fidRange.type = "range";
      fidRange.min = "0";
      fidRange.max = "1";
      fidRange.step = "0.01";
      fidRange.value = String(initFidelity);
      const syncFid = (raw: number) => {
        const clamped = Number(Math.max(0, Math.min(1, Number.isNaN(raw) ? 1 : raw)).toFixed(2));
        fidNum.value = String(clamped);
        fidRange.value = String(clamped);
        onApplyFidelity(clamped);
      };
      fidRange.addEventListener("input", () => syncFid(parseFloat(fidRange.value)));
      fidNum.addEventListener("change", () => syncFid(parseFloat(fidNum.value)));
      fidCtrl.append(fidNum, fidRange);
      fidRow.appendChild(fidCtrl);
      right.appendChild(fidRow);

      body.append(left, right);
      slotEl.appendChild(body);
      return { slotEl, thumb, btnClr, btnTgl, modeTitleSpan };
    };

    const charUi = buildRefSlotUi(
      "char",
      "👤 Character (人物基图)",
      "api-ref",
      this.apiSettings.precise_ref_strength,
      this.apiSettings.precise_ref_fidelity,
      (clamped) => {
        this.apiSettings.precise_ref_strength = clamped;
        saveApiSettings(this.apiSettings);
        this.syncPreciseRefDisplays();
      },
      (clamped) => {
        this.apiSettings.precise_ref_fidelity = clamped;
        saveApiSettings(this.apiSettings);
        this.syncPreciseRefDisplays();
      },
      () => fileInputChar.click(),
      () => void this.onClearPreciseRef("char"),
      () => this.togglePreciseRefSlot("char")
    );
    this.elPreciseCharSlot = charUi.slotEl;
    this.elPreciseCharModeLbl = charUi.modeTitleSpan;
    this.elPreciseRefThumb = charUi.thumb;
    this.elPreciseRefClearBtn = charUi.btnClr;
    this.elPreciseRefToggleBtn = charUi.btnTgl;
    cardRef.appendChild(this.elPreciseCharSlot);

    const styleUi = buildRefSlotUi(
      "style",
      "🎨 Style (画风基图)",
      "api-style-ref",
      this.apiSettings.precise_style_strength,
      this.apiSettings.precise_style_fidelity,
      (clamped) => {
        this.apiSettings.precise_style_strength = clamped;
        saveApiSettings(this.apiSettings);
        this.syncPreciseRefDisplays();
      },
      (clamped) => {
        this.apiSettings.precise_style_fidelity = clamped;
        saveApiSettings(this.apiSettings);
        this.syncPreciseRefDisplays();
      },
      () => fileInputStyle.click(),
      () => void this.onClearPreciseRef("style"),
      () => this.togglePreciseRefSlot("style")
    );
    this.elPreciseStyleSlot = styleUi.slotEl;
    this.elPreciseStyleThumb = styleUi.thumb;
    this.elPreciseStyleClearBtn = styleUi.btnClr;
    this.elPreciseStyleToggleBtn = styleUi.btnTgl;
    cardRef.appendChild(this.elPreciseStyleSlot);

    this.elPreciseRefStatus = this.el("div", "precise-ref-status", "");
    cardRef.appendChild(this.elPreciseRefStatus);

    const refQuickRow = this.el("div", "flex-wrap-row");
    refQuickRow.style.marginTop = "6px";
    const btnApplyDualMod = this.el(
      "button",
      "btn-sm",
      "🎯 切「人物+画风双锁」词条"
    );
    btnApplyDualMod.title = "关闭提示词中的画风+身份+体型+衣服词条，完全交由 Style+Chara 双精密参照决定";
    btnApplyDualMod.addEventListener("click", () => {
      const preset = MODULE_SWITCH_PRESETS["🎯 精密参照：人物+画风（关身份/外观/画风）"];
      if (preset) {
        for (const [k, v] of Object.entries(preset)) {
          (this.cfg as unknown as Record<string, boolean>)[k] = v;
        }
        this.syncControlsFromConfig();
        this.saveCfgAndRefresh();
        this.setStatus("🎯 已切换模块开关为「精密参照：人物+画风」（已关闭本台文字画风与身份外观词条）");
      }
    });
    const btnApplyCharOnlyMod = this.el(
      "button",
      "btn-sm",
      "👤 切「仅锁人物」词条"
    );
    btnApplyCharOnlyMod.title = "保留本台画风词条，仅关闭身份/发型/体型/衣服词条（适合 Chara 单独参照 + 文字画风混合）";
    btnApplyCharOnlyMod.addEventListener("click", () => {
      const preset = MODULE_SWITCH_PRESETS["👤 精密参照：仅锁人物（保留本台画风+动作）"];
      if (preset) {
        for (const [k, v] of Object.entries(preset)) {
          (this.cfg as unknown as Record<string, boolean>)[k] = v;
        }
        this.syncControlsFromConfig();
        this.saveCfgAndRefresh();
        this.setStatus("👤 已切换模块开关为「精密参照：仅锁人物」（保留本台文字画风，剔除身份/服装冲突词）");
      }
    });
    const btnRestoreFullMod = this.el("button", "btn-sm", "🌕 恢复全量词条");
    btnRestoreFullMod.addEventListener("click", () => {
      const preset = MODULE_SWITCH_PRESETS["🌕 全量直出（默认全开）"];
      if (preset) {
        for (const [k, v] of Object.entries(preset)) {
          (this.cfg as unknown as Record<string, boolean>)[k] = v;
        }
        this.syncControlsFromConfig();
        this.saveCfgAndRefresh();
        this.setStatus("🌕 已恢复全部 14 维提示词模块开启");
      }
    });
    refQuickRow.append(btnApplyDualMod, btnApplyCharOnlyMod, btnRestoreFullMod);
    cardRef.appendChild(refQuickRow);

    // AI Settings Card (Model + Canvas + Steps + Guidance + Seed)
    const cardParams = this.el("div", "field-card");
    const paramsHead = this.el("div", "field-card-title");
    const paramsTitleSpan = this.el("span", "", "⚙️ AI Settings · 生图模型与采样参数");
    paramsTitleSpan.id = "api-params-card-title";
    const btnResetAiDefaults = this.el("button", "btn-sm", "↺ 默认参数");
    btnResetAiDefaults.title = "恢复当前模型的官方推荐 Steps / Guidance / Rescale 默认值";
    btnResetAiDefaults.addEventListener("click", () => {
      const isV45 = this.apiSettings.model === MODEL_V4_5_FULL;
      this.apiSettings.steps = 28;
      this.apiSettings.scale = isV45 ? 7.0 : 6.0;
      this.apiSettings.cfg_rescale = 0.0;
      this.apiSettings.uc_preset_mode = "heavy";
      this.apiSettings.keep_inline_negatives = true;
      saveApiSettings(this.apiSettings);
      this.syncApiInputs();
      this.updateCostHint();
      this.setStatus(
        `↺ 已恢复 ${isV45 ? "V4.5 Full (Steps=28, Guidance=7, Rescale=0, UC=Heavy, 内联负权保留)" : "V5 Full Medium (Steps=14, Guidance=6, Rescale=0)"} 默认参数`
      );
    });
    paramsHead.append(paramsTitleSpan, btnResetAiDefaults);
    cardParams.appendChild(paramsHead);

    const modelRow = this.el("div", "field-row");
    modelRow.appendChild(this.el("label", "lbl", "生图模型 (Model · k_euler_ancestral / karras)"));
    const modelSel = this.el("select");
    modelSel.id = "api-model-select";
    for (const mOpt of NAI_MODEL_OPTIONS) {
      const opt = this.el("option", "", mOpt.label);
      opt.value = mOpt.id;
      if (mOpt.id === this.apiSettings.model) opt.selected = true;
      modelSel.appendChild(opt);
    }
    modelSel.addEventListener("change", () => {
      this.setModel(modelSel.value as NaiModelId, true);
    });
    modelRow.appendChild(modelSel);
    cardParams.appendChild(modelRow);

    const canvasRow = this.el("div", "field-row");
    canvasRow.appendChild(this.el("label", "lbl", "输出画布尺寸"));
    const canvasSel = this.el("select");
    canvasSel.id = "api-canvas-select";
    for (const key of Object.keys(CANVAS_PRESETS)) {
      const opt = this.el("option", "", key);
      opt.value = key;
      if (key === this.apiSettings.canvas_preset) opt.selected = true;
      canvasSel.appendChild(opt);
    }
    canvasSel.addEventListener("change", () => {
      this.apiSettings.canvas_preset = canvasSel.value;
      saveApiSettings(this.apiSettings);
      this.updateCostHint();
    });
    canvasRow.appendChild(canvasSel);
    this.elCostHint = this.el("div", "hint-text", "");
    this.elCostHint.style.marginTop = "2px";
    canvasRow.appendChild(this.elCostHint);
    cardParams.appendChild(canvasRow);

    // Steps Row (unlocked 1~50 on V4.5 Full, fixed 14 on V5 Full Medium)
    const stepsRow = this.el("div", "field-row");
    const stepsLbl = this.el("label", "lbl", "Steps (采样步数)");
    stepsLbl.id = "api-steps-lbl";
    const stepsCtrl = this.el("div", "slider-num-row");
    const stepsNum = this.el("input");
    stepsNum.id = "api-steps-num";
    stepsNum.type = "number";
    stepsNum.min = "1";
    stepsNum.max = "50";
    stepsNum.step = "1";
    const stepsRange = this.el("input");
    stepsRange.id = "api-steps-range";
    stepsRange.type = "range";
    stepsRange.min = "1";
    stepsRange.max = "50";
    stepsRange.step = "1";
    const applySteps = (raw: number) => {
      if (this.apiSettings.model !== MODEL_V4_5_FULL) return;
      const clamped = Math.max(1, Math.min(50, Math.round(Number.isNaN(raw) ? 28 : raw)));
      this.apiSettings.steps = clamped;
      saveApiSettings(this.apiSettings);
      this.syncApiInputs();
      this.updateCostHint();
    };
    stepsRange.addEventListener("input", () => applySteps(parseInt(stepsRange.value, 10)));
    stepsNum.addEventListener("change", () => applySteps(parseInt(stepsNum.value, 10)));
    stepsCtrl.append(stepsNum, stepsRange);
    stepsRow.append(stepsLbl, stepsCtrl);
    cardParams.appendChild(stepsRow);

    const gridSC = this.el("div", "grid-2");
    const scaleRow = this.el("div", "field-row");
    const scaleLbl = this.el("label", "lbl", `Prompt Guidance: ${this.apiSettings.scale.toFixed(1)}`);
    scaleLbl.id = "api-scale-lbl";
    const scaleCtrl = this.el("div", "slider-num-row");
    const scaleNum = this.el("input");
    scaleNum.id = "api-scale-num";
    scaleNum.type = "number";
    scaleNum.min = "1";
    scaleNum.max = "10";
    scaleNum.step = "0.1";
    scaleNum.value = String(Number(this.apiSettings.scale.toFixed(1)));
    const scaleInp = this.el("input");
    scaleInp.id = "api-scale-input";
    scaleInp.type = "range";
    scaleInp.min = "1";
    scaleInp.max = "10";
    scaleInp.step = "0.1";
    scaleInp.value = String(this.apiSettings.scale);
    const applyScale = (raw: number) => {
      const clamped = Number(Math.max(1, Math.min(10, Number.isNaN(raw) ? 7 : raw)).toFixed(1));
      this.apiSettings.scale = clamped;
      saveApiSettings(this.apiSettings);
      this.syncApiInputs();
    };
    scaleInp.addEventListener("input", () => applyScale(parseFloat(scaleInp.value)));
    scaleNum.addEventListener("change", () => applyScale(parseFloat(scaleNum.value)));
    scaleCtrl.append(scaleNum, scaleInp);
    scaleRow.append(scaleLbl, scaleCtrl);

    const rescaleRow = this.el("div", "field-row");
    const rescaleLbl = this.el("label", "lbl", `Guidance Rescale: ${this.apiSettings.cfg_rescale.toFixed(2)}`);
    rescaleLbl.id = "api-rescale-lbl";
    const rescaleCtrl = this.el("div", "slider-num-row");
    const rescaleNum = this.el("input");
    rescaleNum.id = "api-rescale-num";
    rescaleNum.type = "number";
    rescaleNum.min = "0";
    rescaleNum.max = "1";
    rescaleNum.step = "0.05";
    rescaleNum.value = String(Number(this.apiSettings.cfg_rescale.toFixed(2)));
    const rescaleInp = this.el("input");
    rescaleInp.id = "api-rescale-input";
    rescaleInp.type = "range";
    rescaleInp.min = "0";
    rescaleInp.max = "1";
    rescaleInp.step = "0.05";
    rescaleInp.value = String(this.apiSettings.cfg_rescale);
    const applyRescale = (raw: number) => {
      const clamped = Number(Math.max(0, Math.min(1, Number.isNaN(raw) ? 0 : raw)).toFixed(2));
      this.apiSettings.cfg_rescale = clamped;
      saveApiSettings(this.apiSettings);
      this.syncApiInputs();
    };
    rescaleInp.addEventListener("input", () => applyRescale(parseFloat(rescaleInp.value)));
    rescaleNum.addEventListener("change", () => applyRescale(parseFloat(rescaleNum.value)));
    rescaleCtrl.append(rescaleNum, rescaleInp);
    rescaleRow.append(rescaleLbl, rescaleCtrl);
    gridSC.append(scaleRow, rescaleRow);
    cardParams.appendChild(gridSC);

    const seedRow = this.el("div", "field-row");
    seedRow.appendChild(this.el("label", "lbl", "固定 Seed（-1 为每次随机）"));
    const seedWrap = this.el("div", "header-group");
    const seedInp = this.el("input", "seed-input");
    seedInp.id = "api-seed-input";
    seedInp.type = "number";
    seedInp.value = String(this.apiSettings.seed);
    seedInp.addEventListener("input", () => {
      const v = parseInt(seedInp.value, 10);
      this.apiSettings.seed = Number.isNaN(v) ? -1 : v;
      saveApiSettings(this.apiSettings);
    });
    const btnRandSeed = this.el("button", "btn-sm", "🎲 -1");
    btnRandSeed.addEventListener("click", () => {
      this.apiSettings.seed = -1;
      seedInp.value = "-1";
      saveApiSettings(this.apiSettings);
    });
    const btnLockS00 = this.el("button", "btn-sm", "🔒 填入最近 S00");
    btnLockS00.addEventListener("click", () => {
      if (this.lastS00Seed === null) {
        this.setStatus("⚠️ 尚未生成过 S00 图片，暂无可锁定的 Seed");
        return;
      }
      this.apiSettings.seed = this.lastS00Seed;
      seedInp.value = String(this.lastS00Seed);
      saveApiSettings(this.apiSettings);
      this.setStatus(`🔒 已锁定 Seed 为最近 S00 种子：${this.lastS00Seed}`);
    });
    seedWrap.append(seedInp, btnRandSeed, btnLockS00);
    seedRow.appendChild(seedWrap);
    cardParams.appendChild(seedRow);

    const ucPresetRow = this.el("div", "field-row");
    ucPresetRow.style.marginTop = "6px";
    const ucPresetLbl = this.el("label", "lbl", "V4.5 全局负向预设 (Undesired Content Preset)");
    ucPresetLbl.id = "api-uc-preset-lbl";
    const ucPresetSel = this.el("select");
    ucPresetSel.id = "api-uc-preset-select";
    const ucPresetOptions: Array<[NaiUcPresetMode, string]> = [
      ["heavy", "🛡️ Heavy · 官方网页端默认强力防崩（推荐 · 保异色瞳/抑三视图平涂）"],
      ["light", "🪶 Light · 官方轻量防崩（保留噪点/网点肌理）"],
      ["human_focus", "👤 Human Focus · 人体强化（含禁异色瞳 mismatched pupils，异色瞳勿选）"],
      ["none", "🧼 None · 空全局负向（仅高步数或纯手写负向时用）"],
    ];
    for (const [val, txt] of ucPresetOptions) {
      const opt = this.el("option", "", txt);
      opt.value = val;
      if (val === this.apiSettings.uc_preset_mode) opt.selected = true;
      ucPresetSel.appendChild(opt);
    }
    ucPresetSel.addEventListener("change", () => {
      this.apiSettings.uc_preset_mode = ucPresetSel.value as NaiUcPresetMode;
      saveApiSettings(this.apiSettings);
      this.syncApiInputs();
    });
    ucPresetRow.append(ucPresetLbl, ucPresetSel);
    cardParams.appendChild(ucPresetRow);

    const chkS00 = this.el("label", "check-row");
    const cbS00 = this.el("input");
    cbS00.type = "checkbox";
    cbS00.checked = this.apiSettings.use_s00_seed;
    cbS00.addEventListener("change", () => {
      this.apiSettings.use_s00_seed = cbS00.checked;
      saveApiSettings(this.apiSettings);
    });
    chkS00.append(cbS00, document.createTextNode("批量连出时自动沿用第 00 幕 (S00) Seed 锁定画风/角色"));
    cardParams.appendChild(chkS00);

    const chkQual = this.el("label", "check-row");
    chkQual.style.marginTop = "5px";
    const cbQual = this.el("input");
    cbQual.id = "api-append-qual-cb";
    cbQual.type = "checkbox";
    cbQual.checked = this.apiSettings.append_v5_quality;
    cbQual.addEventListener("change", () => {
      this.apiSettings.append_v5_quality = cbQual.checked;
      saveApiSettings(this.apiSettings);
    });
    chkQual.append(cbQual, document.createTextNode("追加官方 Quality Tags: Standard 尾缀 (very aesthetic, masterpiece, no text)"));
    cardParams.appendChild(chkQual);

    const chkInlineNeg = this.el("label", "check-row");
    chkInlineNeg.style.marginTop = "5px";
    const cbInlineNeg = this.el("input");
    cbInlineNeg.id = "api-keep-inline-neg-cb";
    cbInlineNeg.type = "checkbox";
    cbInlineNeg.checked = this.apiSettings.keep_inline_negatives;
    cbInlineNeg.addEventListener("change", () => {
      this.apiSettings.keep_inline_negatives = cbInlineNeg.checked;
      saveApiSettings(this.apiSettings);
    });
    chkInlineNeg.append(
      cbInlineNeg,
      document.createTextNode("📌 保留提示词内联负权重 (-2::...::) 原样直发（与网页端单框完全一致）")
    );
    cardParams.appendChild(chkInlineNeg);

    const chkCarousel = this.el("label", "check-row");
    chkCarousel.style.marginTop = "5px";
    const cbCarousel = this.el("input");
    cbCarousel.type = "checkbox";
    cbCarousel.checked = this.apiSettings.auto_fullscreen_carousel;
    cbCarousel.addEventListener("change", () => this.setAutoCarouselEnabled(cbCarousel.checked));
    this.autoCarouselCheckboxes.push(cbCarousel);
    chkCarousel.append(cbCarousel, document.createTextNode("🎬 连续批量生成时自动弹出全屏轮播画廊"));
    cardParams.appendChild(chkCarousel);

    const chkAutoUpscale = this.el("label", "check-row");
    chkAutoUpscale.style.marginTop = "5px";
    const cbAutoUpscale = this.el("input");
    cbAutoUpscale.type = "checkbox";
    cbAutoUpscale.checked = this.apiSettings.auto_upscale_replace;
    cbAutoUpscale.addEventListener("change", () => this.setAutoUpscaleEnabled(cbAutoUpscale.checked));
    this.autoUpscaleCheckboxes.push(cbAutoUpscale);
    chkAutoUpscale.append(
      cbAutoUpscale,
      document.createTextNode("🔎 生成后立刻 2x 放大并移除放大前原图 (每张 +1 Anlas)")
    );
    cardParams.appendChild(chkAutoUpscale);

    const ucRow = this.el("div", "field-row");
    ucRow.style.marginTop = "6px";
    ucRow.appendChild(this.el("label", "lbl", "额外全局负向 UC（可留空）"));
    const ucInp = this.el("input");
    ucInp.type = "text";
    ucInp.value = this.apiSettings.extra_uc;
    ucInp.addEventListener("input", () => {
      this.apiSettings.extra_uc = ucInp.value;
      saveApiSettings(this.apiSettings);
    });
    ucRow.appendChild(ucInp);
    cardParams.appendChild(ucRow);

    // Local Disk / Dual-mode storage card
    const cardDisk = this.el("div", "field-card");
    cardDisk.appendChild(this.el("div", "field-card-title", "💾 双模落盘存储（本地目录直写 / 浏览器 ZIP 下载）"));
    const diskBtns = this.el("div", "header-group");
    const btnMountDir = this.el("button", "btn-sm btn-green", "📂 挂载本地 outputs 目录直写");
    btnMountDir.disabled = !supportsDirectoryPicker();
    btnMountDir.addEventListener("click", async () => {
      try {
        const name = await mountLocalOutputDirectory();
        this.elMountedDirBadge.textContent = `📁 已挂载直写: ${name}/`;
        this.elMountedDirBadge.style.color = "var(--green)";
        this.appendLog(`已授权挂载本地输出目录：${name}/（生图将直接按日期子目录写盘）`);
      } catch (err) {
        this.appendLog(`挂载本地目录未完成：${err instanceof Error ? err.message : String(err)}`);
      }
    });
    const btnUnmountDir = this.el("button", "btn-sm", "🔌 断开挂载");
    btnUnmountDir.addEventListener("click", () => {
      unmountLocalOutputDirectory();
      this.elMountedDirBadge.textContent = "存储: 浏览器下载 / ZIP模式";
      this.elMountedDirBadge.style.color = "";
    });
    diskBtns.append(btnMountDir, btnUnmountDir);
    cardDisk.appendChild(diskBtns);

    const chkAutoDl = this.el("label", "check-row");
    chkAutoDl.style.marginTop = "6px";
    const cbAutoDl = this.el("input");
    cbAutoDl.type = "checkbox";
    cbAutoDl.checked = this.apiSettings.auto_download;
    cbAutoDl.addEventListener("change", () => {
      this.apiSettings.auto_download = cbAutoDl.checked;
      saveApiSettings(this.apiSettings);
    });
    chkAutoDl.append(cbAutoDl, document.createTextNode("未挂载文件夹时，出图后自动触发浏览器单张下载"));
    cardDisk.appendChild(chkAutoDl);

    // Action Buttons & Log
    const cardRun = this.el("div", "field-card");
    cardRun.appendChild(this.el("div", "field-card-title", "🚀 生图控制与日志"));
    const runBtns = this.el("div", "flex-wrap-row");
    const btnGenSingle = this.el("button", "btn-primary", "🎨 单张生成当前幕");
    btnGenSingle.addEventListener("click", () => this.onGenerateCurrentPreview());
    const btnBatchCur = this.el("button", "btn-blue", "🎬 批量连出当前套勾选");
    btnBatchCur.addEventListener("click", () => this.onBatchGenerateCurrentSuite());
    const btnStop = this.el("button", "btn-danger btn-sm", "⏹ 中断");
    btnStop.addEventListener("click", () => {
      if (this.batchAbortCtrl) {
        this.batchAbortCtrl.abort();
        this.appendLog("⏹ 收到中断指令，等待当前请求结束...");
      }
    });
    const btnUpLast = this.el("button", "btn-yellow btn-sm", "🔎 2x 放大当前图 (1 Anlas)");
    btnUpLast.addEventListener("click", () => this.onUpscaleActiveImage());
    runBtns.append(btnGenSingle, btnBatchCur, btnStop, btnUpLast);
    cardRun.appendChild(runBtns);

    this.elLogBox = this.el("div", "log-box");
    this.elLogBox.style.marginTop = "8px";
    this.elLogBox.textContent = "等待生图指令...";
    cardRun.appendChild(this.elLogBox);

    panel.append(cardConn, cardRef, cardParams, cardDisk, cardRun);
  }

  private buildRightPane(): HTMLElement {
    const right = this.el("main", "right-pane");

    // RIGHT TOP: 3 SUITE TABS
    const rTop = this.el("section", "right-top");
    const suiteBar = this.el("div", "tab-bar");
    const sTabs: Array<["story" | "multi_angle" | "all_pos", string]> = [
      ["story", "📖 剧情故事线 (F00+S00~S11)"],
      ["multi_angle", "🎥 角色多角度套图 (MA0~MA8)"],
      ["all_pos", "🔞 全体位生成器 (51式 · 透明背景 · 男方开关)"],
    ];
    for (const [id, lbl] of sTabs) {
      const btn = this.el("button", `tab-btn ${id === this.activeSuiteTab ? "active" : ""}`, lbl);
      btn.dataset.suiteId = id;
      btn.addEventListener("click", () => this.switchSuiteTab(id));
      suiteBar.appendChild(btn);
    }
    rTop.appendChild(suiteBar);

    const storyPanel = this.buildStorySuitePanel();
    const maPanel = this.buildMultiAngleSuitePanel();
    const posPanel = this.buildAllPositionsSuitePanel();
    storyPanel.dataset.suitePanel = "story";
    maPanel.dataset.suitePanel = "multi_angle";
    posPanel.dataset.suitePanel = "all_pos";
    rTop.append(storyPanel, maPanel, posPanel);

    const quickBar = this.el("div", "mobile-scene-quickbar mobile-only");
    this.elMobileQuickSceneLbl = this.el("span", "mobile-quick-scene-lbl", "当前: S00");
    const btnEditPrompt = this.el("button", "btn-sm", "🔍 词条微调");
    btnEditPrompt.addEventListener("click", () => {
      this.switchOutTab("out-single");
      this.switchMobilePane("output");
    });
    const btnQuickGen = this.el("button", "btn-sm btn-primary", "🎨 立即生图");
    btnQuickGen.addEventListener("click", () => {
      void this.onGenerateCurrentPreview();
    });
    quickBar.append(this.elMobileQuickSceneLbl, btnEditPrompt, btnQuickGen);
    rTop.appendChild(quickBar);

    // RIGHT BOTTOM: 4 OUTPUT TABS
    const rBot = this.el("section", "right-bottom");
    const outBar = this.el("div", "tab-bar");
    const oTabs: Array<[string, string]> = [
      ["out-single", "🔍 单幕详情与微调"],
      ["out-image", "🖼️ NAI 生成画面预览 & 历史画廊"],
      ["out-pov", "👁️ 第一人称全卷 (POV)"],
      ["out-3rd", "🎥 第三人称全卷 (3rd)"],
    ];
    for (const [id, lbl] of oTabs) {
      const btn = this.el("button", `tab-btn ${id === this.activeOutTab ? "active" : ""}`, lbl);
      btn.dataset.outTabId = id;
      btn.addEventListener("click", () => this.switchOutTab(id));
      outBar.appendChild(btn);
    }
    rBot.appendChild(outBar);

    const pOutSingle = this.buildSingleOutPanel();
    const pOutImage = this.buildImageGalleryPanel();
    const pOutPov = this.buildFullTextPanel("pov");
    const pOutTrd = this.buildFullTextPanel("3rd");
    rBot.append(pOutSingle, pOutImage, pOutPov, pOutTrd);

    right.append(rTop, rBot);
    return right;
  }

  private buildStorySuitePanel(): HTMLElement {
    const wrap = this.el("div", "tab-panel flex-col active");
    wrap.style.padding = "0";
    const tb = this.el("div", "suite-toolbar");
    const btnAll = this.el("button", "btn-sm", "✅ 全选 S00~S11");
    btnAll.addEventListener("click", () => {
      for (const ch of STORY_CHAPTERS) if (ch.id !== "F00") this.selectedStoryIds.add(ch.id);
      this.renderStoryRows(list);
      this.refreshSuiteTexts();
    });
    const btnNone = this.el("button", "btn-sm", "⬜ 清空");
    btnNone.addEventListener("click", () => {
      this.selectedStoryIds.clear();
      this.renderStoryRows(list);
      this.refreshSuiteTexts();
    });
    const btnBatch = this.el("button", "btn-sm btn-primary", "🚀 连出已勾选故事线");
    btnBatch.addEventListener("click", () => this.runBatchForIds(this.getOrderedSelectedStoryIds(), "story"));
    tb.append(btnAll, btnNone, btnBatch);
    wrap.appendChild(tb);

    const list = this.el("div", "suite-list");
    list.id = "story-list-container";
    this.renderStoryRows(list);
    wrap.appendChild(list);
    return wrap;
  }

  private renderStoryRows(container: HTMLElement): void {
    container.innerHTML = "";
    for (const ch of STORY_CHAPTERS) {
      const row = this.el("div", `scene-row ${ch.id === this.activeSceneId ? "active" : ""}`);
      row.dataset.sceneId = ch.id;
      const cb = this.el("input");
      cb.type = "checkbox";
      cb.checked = this.selectedStoryIds.has(ch.id);
      cb.addEventListener("click", (e) => e.stopPropagation());
      cb.addEventListener("change", () => {
        if (cb.checked) this.selectedStoryIds.add(ch.id);
        else this.selectedStoryIds.delete(ch.id);
        this.refreshSuiteTexts();
      });
      const title = this.el("span", "scene-row-title", ch.title);
      const badge = this.el("span", "scene-row-badge", ch.actor_type);
      const genBtn = this.el("button", "btn-sm btn-blue", "🎨 生成");
      genBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.selectSingleScene(ch.id);
        this.onGenerateCurrentPreview();
      });
      row.addEventListener("click", () => this.selectSingleScene(ch.id));
      row.append(cb, title, badge, genBtn);
      container.appendChild(row);
    }
  }

  private buildMultiAngleSuitePanel(): HTMLElement {
    const wrap = this.el("div", "tab-panel flex-col");
    wrap.style.padding = "0";
    const tb = this.el("div", "suite-toolbar");
    const btnAll = this.el("button", "btn-sm", "✅ 全选 9 镜头");
    btnAll.addEventListener("click", () => {
      for (const ch of MULTI_ANGLE_CHAPTERS) this.selectedMaIds.add(ch.id);
      this.renderMultiAngleRows(list);
      this.refreshSuiteTexts();
    });
    const btnNone = this.el("button", "btn-sm", "⬜ 清空");
    btnNone.addEventListener("click", () => {
      this.selectedMaIds.clear();
      this.renderMultiAngleRows(list);
      this.refreshSuiteTexts();
    });
    const nsfwLbl = this.el("label", "check-row");
    const nsfwCb = this.el("input");
    nsfwCb.type = "checkbox";
    nsfwCb.checked = this.cfg.enable_multi_angle_nsfw;
    nsfwCb.addEventListener("change", () => {
      this.cfg.enable_multi_angle_nsfw = nsfwCb.checked;
      this.saveCfgAndRefresh();
    });
    this.formBindings.set("enable_multi_angle_nsfw", nsfwCb);
    nsfwLbl.append(nsfwCb, document.createTextNode("🔞 开启套图 NSFW 暴露"));
    const btnBatch = this.el("button", "btn-sm btn-primary", "🚀 连出已勾选多角度");
    btnBatch.addEventListener("click", () => {
      const ids = MULTI_ANGLE_CHAPTERS.filter((c) => this.selectedMaIds.has(c.id)).map((c) => c.id);
      this.runBatchForIds(ids, "multi_angle");
    });
    tb.append(btnAll, btnNone, nsfwLbl, btnBatch);
    wrap.appendChild(tb);

    const list = this.el("div", "suite-list");
    list.id = "ma-list-container";
    this.renderMultiAngleRows(list);
    wrap.appendChild(list);
    return wrap;
  }

  private renderMultiAngleRows(container: HTMLElement): void {
    container.innerHTML = "";
    for (const ch of MULTI_ANGLE_CHAPTERS) {
      const row = this.el("div", `scene-row ${ch.id === this.activeSceneId ? "active" : ""}`);
      row.dataset.sceneId = ch.id;
      const cb = this.el("input");
      cb.type = "checkbox";
      cb.checked = this.selectedMaIds.has(ch.id);
      cb.addEventListener("click", (e) => e.stopPropagation());
      cb.addEventListener("change", () => {
        if (cb.checked) this.selectedMaIds.add(ch.id);
        else this.selectedMaIds.delete(ch.id);
        this.refreshSuiteTexts();
      });
      const title = this.el("span", "scene-row-title", ch.title);
      const genBtn = this.el("button", "btn-sm btn-blue", "🎨 生成");
      genBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.selectSingleScene(ch.id);
        this.onGenerateCurrentPreview();
      });
      row.addEventListener("click", () => this.selectSingleScene(ch.id));
      row.append(cb, title, genBtn);
      container.appendChild(row);
    }
  }

  private buildAllPositionsSuitePanel(): HTMLElement {
    const wrap = this.el("div", "tab-panel flex-col");
    wrap.style.padding = "0";
    const tb = this.el("div", "suite-toolbar pos-suite-toolbar");

    this.elPosMalePills.clear();
    this.elPosStagePills.clear();
    this.elPosScenePills.clear();

    const maleShortLabel = (fullKey: string, code: string): string => {
      if (code === "normal") return "👤 正常男方";
      if (code === "translucent") return "👻 半透明男";
      if (code === "invisible") return "🫥 隐形男方";
      if (code === "off") return "🚫 纯单人";
      return fullKey.split("（")[0];
    };
    const stageShortLabel = (fullKey: string, code: string): string => {
      if (code === "before") return "🔥 1.进行中";
      if (code === "during") return "💦 2.内射中";
      if (code === "after_inside") return "🌊 3.结合溢流";
      if (code === "pull_out") return "🔗 4.拔出拉丝";
      if (code === "prolapse") return "🌺 5.事后宫脱";
      return fullKey.split("（")[0];
    };
    const sceneShortLabel = (fullKey: string, code: string): string => {
      if (code === "default_couch") return "🛋️ 室内沙发";
      if (code === "sunlit_window_bedroom") return "🪟 晨光白床";
      if (code === "cherry_shallow_water") return "🌸 落樱浅滩";
      if (code === "jp_dark_alley_trash") return "🗑️ 阴暗小巷";
      return fullKey.split("（")[0];
    };

    const searchInp = this.el("input", "pos-search-input");
    searchInp.type = "text";
    searchInp.placeholder = "🔍 搜索体位关键词...";
    searchInp.addEventListener("input", () => {
      this.posSearchQuery = searchInp.value.trim().toLowerCase();
      this.renderPosRows(list);
    });

    const btnAllCat = this.el("button", "btn-sm", "✅ 全选当前类");
    btnAllCat.addEventListener("click", () => {
      for (const ch of this.getFilteredPosChapters()) this.selectedPosIds.add(ch.id);
      this.renderPosRows(list);
      this.refreshSuiteTexts();
    });
    const btnNone = this.el("button", "btn-sm", "⬜ 清空");
    btnNone.addEventListener("click", () => {
      for (const ch of this.getFilteredPosChapters()) this.selectedPosIds.delete(ch.id);
      this.renderPosRows(list);
      this.refreshSuiteTexts();
    });
    const btnBatch = this.el("button", "btn-sm btn-primary", "🚀 连出已勾选体位");
    btnBatch.addEventListener("click", () => {
      const ids = this.getFilteredPosChapters()
        .filter((c) => this.selectedPosIds.has(c.id))
        .map((c) => c.id);
      this.runBatchForIds(ids, "all_pos");
    });

    const primaryRow = this.el("div", "pos-toolbar-primary");
    const advRow = this.el("div", "pos-toolbar-advanced");
    const btnFilterToggle = this.el("button", "btn-sm mobile-only", "🎛️ 阶段/场景 ▾");
    btnFilterToggle.addEventListener("click", () => {
      this.mobilePosFiltersOpen = !this.mobilePosFiltersOpen;
      advRow.classList.toggle("open", this.mobilePosFiltersOpen);
      btnFilterToggle.textContent = this.mobilePosFiltersOpen ? "▴ 收起阶段/场景" : "🎛️ 阶段/场景 ▾";
    });
    primaryRow.append(searchInp, btnFilterToggle, btnBatch);

    // Row B: Always-visible in-screen Male Partner & Background Strip
    const partnerBar = this.el("div", "pos-partner-bar");
    partnerBar.appendChild(this.el("span", "pos-bar-lbl", "男方:"));
    for (const [fullKey, code] of Object.entries(POS_MALE_MODE_PRESETS)) {
      const pill = this.el("button", "btn-sm pill", maleShortLabel(fullKey, code));
      pill.title = fullKey;
      pill.dataset.maleMode = fullKey;
      pill.addEventListener("click", () => {
        this.cfg.pos_male_mode = fullKey;
        pill.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
        this.syncPosToolbarPills();
        this.saveCfgAndRefresh();
      });
      this.elPosMalePills.set(fullKey, pill);
      partnerBar.appendChild(pill);
    }

    const penisLbl = this.el("label", "check-row pos-inline-chk");
    penisLbl.title = "显示男方器官（选择「纯单人」时不注入）";
    const penisCb = this.el("input");
    penisCb.type = "checkbox";
    penisCb.checked = this.cfg.pos_show_penis;
    penisCb.addEventListener("change", () => {
      this.cfg.pos_show_penis = penisCb.checked;
      this.saveCfgAndRefresh();
    });
    this.formBindings.set("pos_show_penis", penisCb);
    penisLbl.append(penisCb, document.createTextNode("显器官"));
    this.elPosPenisLbl = penisLbl;

    const transLbl = this.el("label", "check-row pos-inline-chk");
    transLbl.title = "开启 V5 原生透明背景（RGBA 抠图模式）";
    const transCb = this.el("input");
    transCb.type = "checkbox";
    transCb.checked = this.cfg.pos_transparent_bg;
    transCb.addEventListener("change", () => {
      this.cfg.pos_transparent_bg = transCb.checked;
      this.syncPosToolbarPills();
      this.saveCfgAndRefresh();
    });
    this.formBindings.set("pos_transparent_bg", transCb);
    transLbl.append(transCb, document.createTextNode("🫧透明底"));
    partnerBar.append(penisLbl, transLbl);

    // Row C: Stage & Scene In-DOM Pills (always shown on Desktop, collapsible drawer on Mobile)
    const stageRow = this.el("div", "pos-pill-row");
    stageRow.appendChild(this.el("span", "pos-bar-lbl", "阶段:"));
    for (const [fullKey, code] of Object.entries(POS_STAGE_PRESETS)) {
      const pill = this.el("button", "btn-sm pill", stageShortLabel(fullKey, code));
      pill.title = fullKey;
      pill.dataset.stageMode = fullKey;
      pill.addEventListener("click", () => {
        this.cfg.pos_stage = fullKey;
        pill.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
        this.syncPosToolbarPills();
        this.saveCfgAndRefresh();
      });
      this.elPosStagePills.set(fullKey, pill);
      stageRow.appendChild(pill);
    }

    const sceneRow = this.el("div", "pos-pill-row");
    sceneRow.appendChild(this.el("span", "pos-bar-lbl", "场景:"));
    for (const [fullKey, info] of Object.entries(POS_SCENE_PRESETS)) {
      const pill = this.el("button", "btn-sm pill", sceneShortLabel(fullKey, info.code));
      pill.title = fullKey;
      pill.dataset.scenePreset = fullKey;
      pill.addEventListener("click", () => {
        this.cfg.pos_scene = fullKey;
        pill.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
        this.syncPosToolbarPills();
        this.saveCfgAndRefresh();
      });
      this.elPosScenePills.set(fullKey, pill);
      sceneRow.appendChild(pill);
    }
    sceneRow.append(btnAllCat, btnNone);

    advRow.append(stageRow, sceneRow);
    tb.append(primaryRow, partnerBar, advRow);
    this.syncPosToolbarPills();
    wrap.appendChild(tb);

    // Category filter bar
    const catStrip = this.el("div", "cat-strip");
    for (const cat of POS_CATEGORIES) {
      const pill = this.el("button", `btn-sm pill ${cat === this.posCategory ? "active" : ""}`, cat);
      pill.dataset.cat = cat;
      pill.addEventListener("click", () => {
        this.posCategory = cat;
        for (const btn of catStrip.querySelectorAll("button")) {
          btn.classList.toggle("active", (btn as HTMLElement).dataset.cat === cat);
        }
        pill.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
        this.renderPosRows(list);
      });
      catStrip.appendChild(pill);
    }
    wrap.appendChild(catStrip);

    const list = this.el("div", "suite-list");
    list.id = "pos-list-container";
    this.renderPosRows(list);
    wrap.appendChild(list);
    return wrap;
  }

  private getFilteredPosChapters() {
    return ALL_POSITIONS_CHAPTERS.filter((c) => {
      if (this.posCategory !== POS_CATEGORIES[0] && c.category !== this.posCategory) return false;
      if (this.posSearchQuery && !c.title.toLowerCase().includes(this.posSearchQuery)) return false;
      return true;
    });
  }

  private renderPosRows(container: HTMLElement): void {
    container.innerHTML = "";
    for (const ch of this.getFilteredPosChapters()) {
      const row = this.el("div", `scene-row ${ch.id === this.activeSceneId ? "active" : ""}`);
      row.dataset.sceneId = ch.id;
      const cb = this.el("input");
      cb.type = "checkbox";
      cb.checked = this.selectedPosIds.has(ch.id);
      cb.addEventListener("click", (e) => e.stopPropagation());
      cb.addEventListener("change", () => {
        if (cb.checked) this.selectedPosIds.add(ch.id);
        else this.selectedPosIds.delete(ch.id);
        this.refreshSuiteTexts();
      });
      const title = this.el("span", "scene-row-title", ch.title);
      const badge = this.el("span", "scene-row-badge", ch.category.split(" ")[0]);
      const genBtn = this.el("button", "btn-sm btn-blue", "🎨 生成");
      genBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.selectSingleScene(ch.id);
        this.onGenerateCurrentPreview();
      });
      row.addEventListener("click", () => this.selectSingleScene(ch.id));
      row.append(cb, title, badge, genBtn);
      container.appendChild(row);
    }
  }

  private buildSingleOutPanel(): HTMLElement {
    const wrap = this.el("div", "tab-panel flex-col active");
    wrap.dataset.outPanel = "out-single";
    wrap.style.padding = "8px 10px";

    const tb = this.el("div", "header-group single-out-toolbar");
    tb.style.marginBottom = "6px";

    this.elSingleSelect = this.el("select", "single-variant-select");
    this.elSingleSelect.addEventListener("change", () => {
      this.activeSubVariantIdx = parseInt(this.elSingleSelect.value, 10) || 0;
      this.isSingleEdited = false;
      this.renderSinglePromptBox();
    });

    this.elCanvasBadge = this.el("span", "scene-row-badge", "竖图 832x1216");
    this.elTokenBadge = this.el("span", "token-badge ok", "T5: 0/512");

    const spacer = this.el("div", "spacer");
    const btnCopy = this.el("button", "btn-sm", "📋 复制单幕");
    btnCopy.addEventListener("click", async () => {
      await navigator.clipboard.writeText(this.elSingleText.value);
      this.setStatus("✅ 已复制当前单幕提示词到剪贴板");
    });
    const btnResetEdit = this.el("button", "btn-sm", "↺ 还原引擎输出");
    btnResetEdit.addEventListener("click", () => {
      this.isSingleEdited = false;
      this.renderSinglePromptBox();
    });
    const btnGen = this.el("button", "btn-sm btn-primary", "🎨 单张生成");
    btnGen.addEventListener("click", () => this.onGenerateCurrentPreview());

    tb.append(this.elSingleSelect, this.elCanvasBadge, this.elTokenBadge, spacer, btnResetEdit, btnCopy, btnGen);
    wrap.appendChild(tb);

    this.elSingleText = this.el("textarea", "mono");
    this.elSingleText.style.flex = "1";
    this.elSingleText.style.width = "100%";
    this.elSingleText.addEventListener("input", () => {
      this.isSingleEdited = true;
      this.updateTokenBadge();
    });
    wrap.appendChild(this.elSingleText);
    return wrap;
  }

  private buildImageGalleryPanel(): HTMLElement {
    const wrap = this.el("div", "tab-panel flex-col");
    wrap.dataset.outPanel = "out-image";
    wrap.style.padding = "8px 10px";

    const tb = this.el("div", "header-group gallery-toolbar");
    tb.style.marginBottom = "6px";
    this.elPreviewMeta = this.el("span", "hint-text", "尚无生成画面，请在上方点击「🎨 生成」或左侧「🎨 单张生成当前幕」");
    const spacer = this.el("div", "spacer");

    const chkGalleryCarousel = this.el("label", "check-row");
    const cbGalleryCarousel = this.el("input");
    cbGalleryCarousel.type = "checkbox";
    cbGalleryCarousel.checked = this.apiSettings.auto_fullscreen_carousel;
    cbGalleryCarousel.addEventListener("change", () => this.setAutoCarouselEnabled(cbGalleryCarousel.checked));
    this.autoCarouselCheckboxes.push(cbGalleryCarousel);
    chkGalleryCarousel.append(cbGalleryCarousel, document.createTextNode("🎬 连出自动全屏轮播"));

    const chkGalleryUpscale = this.el("label", "check-row");
    const cbGalleryUpscale = this.el("input");
    cbGalleryUpscale.type = "checkbox";
    cbGalleryUpscale.checked = this.apiSettings.auto_upscale_replace;
    cbGalleryUpscale.addEventListener("change", () => this.setAutoUpscaleEnabled(cbGalleryUpscale.checked));
    this.autoUpscaleCheckboxes.push(cbGalleryUpscale);
    chkGalleryUpscale.append(cbGalleryUpscale, document.createTextNode("🔎 生后即放大替换"));

    const btnFullscreenPlay = this.el("button", "btn-sm btn-primary", "📺 全屏轮播");
    btnFullscreenPlay.addEventListener("click", () => {
      const rec = this.gallery[this.activeGalleryIdx];
      if (!rec) {
        window.alert("当前预览画廊还没有图片，请先生成至少一张图片。");
        return;
      }
      this.batchLightboxDismissed = false;
      this.openLightbox(rec, "auto");
    });

    const btnChecker = this.el("button", "btn-sm", "🏁 透明棋盘底");
    btnChecker.addEventListener("click", () => {
      this.checkerboardOn = !this.checkerboardOn;
      this.syncCheckerboard();
    });
    const btnUpscale = this.el("button", "btn-sm btn-yellow", "🔎 2x 高清放大 (1 Anlas)");
    btnUpscale.addEventListener("click", () => this.onUpscaleActiveImage());
    const btnDownloadOne = this.el("button", "btn-sm btn-blue", "💾 下载当前图");
    btnDownloadOne.addEventListener("click", () => {
      const rec = this.gallery[this.activeGalleryIdx];
      if (!rec) return;
      triggerBytesDownload(rec.bytes, rec.filename);
    });
    const btnZipAll = this.el("button", "btn-sm btn-green", "📦 打包下载全部 (.zip)");
    btnZipAll.addEventListener("click", () => this.onDownloadAllGalleryZip());

    const actionsWrap = this.el("div", "gallery-actions-row");
    actionsWrap.append(
      chkGalleryCarousel,
      chkGalleryUpscale,
      btnFullscreenPlay,
      btnChecker,
      btnUpscale,
      btnDownloadOne,
      btnZipAll
    );
    tb.append(this.elPreviewMeta, spacer, actionsWrap);
    wrap.appendChild(tb);

    this.elPreviewStage = this.el("div", "preview-stage checkerboard");
    this.elPreviewStage.appendChild(this.el("span", "hint-text", "等待 NovelAI V4.5 / V5 生成图片..."));
    wrap.appendChild(this.elPreviewStage);

    this.elFilmstrip = this.el("div", "filmstrip");
    wrap.appendChild(this.elFilmstrip);
    return wrap;
  }

  private buildFullTextPanel(track: PerspectiveMode): HTMLElement {
    const wrap = this.el("div", "tab-panel flex-col");
    wrap.dataset.outPanel = track === "pov" ? "out-pov" : "out-3rd";
    wrap.style.padding = "8px 10px";

    const tb = this.el("div", "header-group");
    tb.style.marginBottom = "6px";
    const btnCopyAll = this.el("button", "btn-sm btn-blue", "📋 复制本卷全套提示词");
    btnCopyAll.addEventListener("click", async () => {
      const box = track === "pov" ? this.elPovText : this.elTrdText;
      await navigator.clipboard.writeText(box.value);
      this.setStatus(`✅ 已复制 ${track.toUpperCase()} 全卷提示词`);
    });
    const btnExportMd = this.el("button", "btn-sm", "💾 导出为 .md 文件");
    btnExportMd.addEventListener("click", () => {
      const box = track === "pov" ? this.elPovText : this.elTrdText;
      triggerTextDownload(box.value, `novelai_${track}_suite_${formatDateYYYYMMDD()}.md`, "text/markdown;charset=utf-8");
    });
    const btnExportLines = this.el("button", "btn-sm", "📄 导出纯批量行 (.txt)");
    btnExportLines.addEventListener("click", () => {
      const ids = this.getActiveSuiteSelectedIds();
      const lines = generateFullSuite(this.cfg, ids, true, false);
      triggerTextDownload(lines, `novelai_${track}_batch_${formatDateYYYYMMDD()}.txt`);
    });
    tb.append(btnCopyAll, btnExportMd, btnExportLines);
    wrap.appendChild(tb);

    const ta = this.el("textarea", "mono");
    ta.style.flex = "1";
    ta.style.width = "100%";
    ta.readOnly = true;
    if (track === "pov") this.elPovText = ta;
    else this.elTrdText = ta;
    wrap.appendChild(ta);
    return wrap;
  }

  // Helper factories
  private makeInputRow(key: keyof CharacterConfig, labelText: string, placeholder: string): HTMLElement {
    const row = this.el("div", "field-row");
    row.appendChild(this.el("label", "lbl", labelText));
    const inp = this.el("input");
    inp.type = "text";
    inp.placeholder = placeholder;
    inp.addEventListener("input", () => {
      (this.cfg as unknown as Record<string, string>)[key] = inp.value;
      this.saveCfgAndRefresh();
    });
    this.formBindings.set(key, inp);
    row.appendChild(inp);
    return row;
  }

  private makeSelectRow(
    key: keyof CharacterConfig,
    labelText: string,
    options: string[],
    extraOnChange?: () => void
  ): HTMLElement {
    const row = this.el("div", "field-row");
    row.appendChild(this.el("label", "lbl", labelText));
    const sel = this.el("select");
    for (const optText of options) {
      const opt = this.el("option", "", optText);
      opt.value = optText;
      sel.appendChild(opt);
    }
    sel.addEventListener("change", () => {
      (this.cfg as unknown as Record<string, string>)[key] = sel.value;
      if (extraOnChange) extraOnChange();
      this.saveCfgAndRefresh();
    });
    this.formBindings.set(key, sel);
    row.appendChild(sel);
    return row;
  }

  private makeCheckboxRow(key: keyof CharacterConfig, labelText: string): HTMLElement {
    const row = this.el("label", "check-row");
    row.style.marginBottom = "4px";
    const cb = this.el("input");
    cb.type = "checkbox";
    cb.addEventListener("change", () => {
      (this.cfg as unknown as Record<string, boolean>)[key] = cb.checked;
      this.syncControlsFromConfig();
      this.saveCfgAndRefresh();
    });
    this.formBindings.set(key, cb);
    row.append(cb, document.createTextNode(labelText));
    return row;
  }

  private populatePresetDropdown(): void {
    this.elPresetSelect.innerHTML = "";
    const allNames = [
      ...Object.keys(BUILTIN_CHARACTERS),
      ...Object.keys(this.customPresets),
    ];
    for (const name of allNames) {
      const opt = this.el("option", "", name);
      opt.value = name;
      if (name === this.cfg.preset_name) opt.selected = true;
      this.elPresetSelect.appendChild(opt);
    }
  }

  private syncControlsFromConfig(): void {
    for (const [key, ctrl] of this.formBindings.entries()) {
      const val = (this.cfg as unknown as Record<string, unknown>)[key];
      if (ctrl instanceof HTMLInputElement && ctrl.type === "checkbox") {
        ctrl.checked = Boolean(val);
      } else {
        ctrl.value = String(val ?? "");
      }
    }
    for (const [key, cb] of this.moduleBindings.entries()) {
      cb.checked = Boolean((this.cfg as unknown as Record<string, unknown>)[key]);
    }
    // Sync header perspective radios & multi_panel_mode
    const radios = this.root.querySelectorAll<HTMLInputElement>('input[name="persp_mode"]');
    radios.forEach((r) => {
      r.checked = r.value === this.cfg.perspective_mode;
    });
    this.elPresetSelect.value = this.cfg.preset_name;
    this.syncPosToolbarPills();
    this.syncExpressionDisplays();
    this.syncCameraDisplays();
    this.syncMobileUi();
  }

  private syncPosToolbarPills(): void {
    for (const [k, btn] of this.elPosMalePills.entries()) {
      btn.classList.toggle("active", k === this.cfg.pos_male_mode);
    }
    for (const [k, btn] of this.elPosStagePills.entries()) {
      btn.classList.toggle("active", k === this.cfg.pos_stage);
    }
    for (const [k, btn] of this.elPosScenePills.entries()) {
      btn.classList.toggle("active", k === this.cfg.pos_scene);
    }
    if (this.elPosPenisLbl) {
      const isOff = POS_MALE_MODE_PRESETS[this.cfg.pos_male_mode] === "off";
      this.elPosPenisLbl.style.opacity = isOff ? "0.45" : "1";
    }
  }

  private syncApiInputs(): void {
    const isV45 = this.apiSettings.model === MODEL_V4_5_FULL;
    const modelSel = document.getElementById("api-model-select") as HTMLSelectElement | null;
    if (modelSel) modelSel.value = this.apiSettings.model;

    const paramsTitle = document.getElementById("api-params-card-title");
    if (paramsTitle) {
      paramsTitle.textContent = isV45
        ? `⚙️ AI Settings · V4.5 Full (${this.apiSettings.steps} 步 · 支持精密参照)`
        : "⚙️ AI Settings · V5 Full Medium (14 步固定 · 512词)";
    }

    const stepsLbl = document.getElementById("api-steps-lbl");
    const stepsNum = document.getElementById("api-steps-num") as HTMLInputElement | null;
    const stepsRange = document.getElementById("api-steps-range") as HTMLInputElement | null;
    const dispSteps = isV45 ? this.apiSettings.steps : 14;
    if (stepsLbl) {
      stepsLbl.textContent = isV45
        ? `Steps: ${dispSteps}${dispSteps <= 28 ? " (Opus 标准免底图点)" : " (>28步计点数)"}`
        : "Steps: 14 (V5 Full Medium 固定步数)";
    }
    if (stepsNum) {
      stepsNum.value = String(dispSteps);
      stepsNum.disabled = !isV45;
    }
    if (stepsRange) {
      stepsRange.value = String(dispSteps);
      stepsRange.disabled = !isV45;
    }

    const scaleInp = document.getElementById("api-scale-input") as HTMLInputElement | null;
    const scaleNum = document.getElementById("api-scale-num") as HTMLInputElement | null;
    const scaleLbl = document.getElementById("api-scale-lbl");
    const rescaleInp = document.getElementById("api-rescale-input") as HTMLInputElement | null;
    const rescaleNum = document.getElementById("api-rescale-num") as HTMLInputElement | null;
    const rescaleLbl = document.getElementById("api-rescale-lbl");
    if (scaleInp) scaleInp.value = String(this.apiSettings.scale);
    if (scaleNum) scaleNum.value = String(Number(this.apiSettings.scale.toFixed(1)));
    if (scaleLbl) scaleLbl.textContent = `Prompt Guidance: ${this.apiSettings.scale.toFixed(1)}`;
    if (rescaleInp) rescaleInp.value = String(this.apiSettings.cfg_rescale);
    if (rescaleNum) rescaleNum.value = String(Number(this.apiSettings.cfg_rescale.toFixed(2)));
    if (rescaleLbl) rescaleLbl.textContent = `Guidance Rescale: ${this.apiSettings.cfg_rescale.toFixed(2)}`;

    const strNum = document.getElementById("api-ref-strength-num") as HTMLInputElement | null;
    const strRange = document.getElementById("api-ref-strength-range") as HTMLInputElement | null;
    const fidNum = document.getElementById("api-ref-fidelity-num") as HTMLInputElement | null;
    const fidRange = document.getElementById("api-ref-fidelity-range") as HTMLInputElement | null;
    if (strNum) strNum.value = String(Number(this.apiSettings.precise_ref_strength.toFixed(2)));
    if (strRange) strRange.value = String(this.apiSettings.precise_ref_strength);
    if (fidNum) fidNum.value = String(Number(this.apiSettings.precise_ref_fidelity.toFixed(2)));
    if (fidRange) fidRange.value = String(this.apiSettings.precise_ref_fidelity);

    const styleStrNum = document.getElementById("api-style-ref-strength-num") as HTMLInputElement | null;
    const styleStrRange = document.getElementById("api-style-ref-strength-range") as HTMLInputElement | null;
    const styleFidNum = document.getElementById("api-style-ref-fidelity-num") as HTMLInputElement | null;
    const styleFidRange = document.getElementById("api-style-ref-fidelity-range") as HTMLInputElement | null;
    if (styleStrNum) styleStrNum.value = String(Number(this.apiSettings.precise_style_strength.toFixed(2)));
    if (styleStrRange) styleStrRange.value = String(this.apiSettings.precise_style_strength);
    if (styleFidNum) styleFidNum.value = String(Number(this.apiSettings.precise_style_fidelity.toFixed(2)));
    if (styleFidRange) styleFidRange.value = String(this.apiSettings.precise_style_fidelity);

    const ucPresetSel = document.getElementById("api-uc-preset-select") as HTMLSelectElement | null;
    const ucPresetLbl = document.getElementById("api-uc-preset-lbl");
    if (ucPresetSel) {
      ucPresetSel.value = isV45 ? this.apiSettings.uc_preset_mode : "heavy";
      ucPresetSel.disabled = !isV45;
    }
    if (ucPresetLbl) {
      ucPresetLbl.textContent = isV45
        ? "V4.5 全局负向预设 (Undesired Content Preset)"
        : "全局负向预设 (V5 Full Medium 固定为官方 Heavy)";
    }
    const cbInlineNeg = document.getElementById("api-keep-inline-neg-cb") as HTMLInputElement | null;
    if (cbInlineNeg) {
      cbInlineNeg.checked = this.apiSettings.keep_inline_negatives;
    }
  }

  private bindGlobalPasteForPreciseRef(): void {
    if (this.pasteListenerBound) return;
    this.pasteListenerBound = true;
    window.addEventListener("paste", (e: ClipboardEvent) => {
      if (this.activeLeftTab !== "tab-api" && this.activeLeftTab !== "tab-modules") return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (it.type.startsWith("image/")) {
          const f = it.getAsFile();
          if (f) {
            e.preventDefault();
            const targetSlot: "char" | "style" =
              this.apiSettings.precise_ref_workflow === "style_plus_chara"
                ? this.activePasteSlot
                : "char";
            void this.handleUploadPreciseRefFile(targetSlot, f);
            break;
          }
        }
      }
    });
  }

  private setActivePasteSlot(slot: "char" | "style"): void {
    this.activePasteSlot = slot;
    const isDual = this.apiSettings.precise_ref_workflow === "style_plus_chara";
    if (this.elPreciseCharSlot) {
      this.elPreciseCharSlot.classList.toggle("paste-target", isDual && slot === "char");
    }
    if (this.elPreciseStyleSlot) {
      this.elPreciseStyleSlot.classList.toggle("paste-target", isDual && slot === "style");
    }
  }

  private setPreciseRefWorkflow(wf: PreciseRefWorkflowMode): void {
    this.apiSettings.precise_ref_workflow = wf;
    if (wf !== "style_plus_chara") {
      this.activePasteSlot = "char";
    } else if (this.preciseRef && !this.preciseStyleRef) {
      this.activePasteSlot = "style";
    }
    saveApiSettings(this.apiSettings);
    this.syncPreciseRefDisplays();
    this.updateCostHint();

    if (wf === "style_plus_chara") {
      this.setStatus(
        "🎨+👤 已切至「Style+Chara 混合」双槽模式：可同时附带人物基图 + 画风基图独立调节 Strength/Fidelity"
      );
    } else if (wf === "chara_only") {
      const styleKeep = this.preciseStyleRef
        ? `（已缓存画风图 ${this.preciseStyleRef.filename} 暂挂保留，随时可一键切回混合）`
        : "";
      this.setStatus(
        `👤 已切至「Chara 单独」模式：仅发送 Character 人物参照 (+5 Anlas)，可自由混合本台文字画风词条${styleKeep}`
      );
    } else {
      this.setStatus(
        "👤&🎨 已切至「单图 Chara&Style」模式：单张图片同时锁定人物与画风 (base_caption=character&style, +5 Anlas)"
      );
    }
  }

  private setPreciseRefMemory(slot: "char" | "style", item: StoredPreciseRefImage | null): void {
    if (slot === "char") {
      if (this.preciseRefThumbUrl) {
        URL.revokeObjectURL(this.preciseRefThumbUrl);
        this.preciseRefThumbUrl = null;
      }
      this.preciseRef = item;
      if (item) {
        const previewBytes = item.rawBytes.length > 0 ? item.rawBytes : item.preparedPngBytes;
        const copy = new Uint8Array(previewBytes.byteLength);
        copy.set(previewBytes);
        this.preciseRefThumbUrl = URL.createObjectURL(new Blob([copy]));
      }
    } else {
      if (this.preciseStyleRefThumbUrl) {
        URL.revokeObjectURL(this.preciseStyleRefThumbUrl);
        this.preciseStyleRefThumbUrl = null;
      }
      this.preciseStyleRef = item;
      if (item) {
        const previewBytes = item.rawBytes.length > 0 ? item.rawBytes : item.preparedPngBytes;
        const copy = new Uint8Array(previewBytes.byteLength);
        copy.set(previewBytes);
        this.preciseStyleRefThumbUrl = URL.createObjectURL(new Blob([copy]));
      }
    }
  }

  private async maybeUpgradeCachedPreciseRef(
    slot: "char" | "style",
    item: StoredPreciseRefImage
  ): Promise<StoredPreciseRefImage> {
    if ((item.prepVersion ?? 1) >= 2) {
      return item;
    }
    // If the original high-res rawBytes are still stored in IndexedDB, re-run progressive multi-step halving once
    if (item.rawBytes && item.rawBytes.byteLength > 0 && item.rawBytes !== item.preparedPngBytes) {
      try {
        const norm = await preparePreciseReferencePng(item.rawBytes);
        const upgraded: StoredPreciseRefImage = {
          ...item,
          preparedPngBytes: norm.preparedPngBytes,
          origWidth: norm.origWidth,
          origHeight: norm.origHeight,
          normWidth: norm.normWidth,
          normHeight: norm.normHeight,
          prepVersion: 2,
          updatedAt: Date.now(),
        };
        if (slot === "char") {
          await savePreciseRefImage(upgraded);
        } else {
          await savePreciseStyleRefImage(upgraded);
        }
        this.appendLog(
          `✨ 已自动使用渐进超采样重生成缓存${slot === "char" ? "人物" : "画风"}参照图：${item.filename} (${norm.origWidth}×${norm.origHeight} ➔ ${norm.normWidth}×${norm.normHeight})`
        );
        return upgraded;
      } catch {
        return item;
      }
    }
    return item;
  }

  private async handleUploadPreciseRefFile(slot: "char" | "style", file: File): Promise<void> {
    const slotLabel = slot === "char" ? "Character 人物参照" : "Style 画风参照";
    try {
      this.setStatus(`🪪 正在处理 ${slotLabel}图 ${file.name}...`);
      const rawBytes = new Uint8Array(await file.arrayBuffer());
      const norm = await preparePreciseReferencePng(rawBytes);
      const stored: StoredPreciseRefImage = {
        filename: file.name || (slot === "char" ? "character_ref.png" : "style_ref.png"),
        rawBytes,
        preparedPngBytes: norm.preparedPngBytes,
        origWidth: norm.origWidth,
        origHeight: norm.origHeight,
        normWidth: norm.normWidth,
        normHeight: norm.normHeight,
        prepVersion: 2,
        updatedAt: Date.now(),
      };

      if (slot === "char") {
        await savePreciseRefImage(stored);
        this.setPreciseRefMemory("char", stored);
        this.apiSettings.precise_ref_enabled = true;
        if (
          this.apiSettings.precise_ref_workflow === "style_plus_chara" &&
          !this.preciseStyleRef
        ) {
          this.activePasteSlot = "style";
        }
      } else {
        await savePreciseStyleRefImage(stored);
        this.setPreciseRefMemory("style", stored);
        this.apiSettings.precise_style_enabled = true;
        if (this.apiSettings.precise_ref_workflow !== "style_plus_chara") {
          this.apiSettings.precise_ref_workflow = "style_plus_chara";
        }
      }

      let switchedNote = "";
      if (this.apiSettings.model !== MODEL_V4_5_FULL) {
        this.setModel(MODEL_V4_5_FULL, true, true);
        switchedNote = " · 已自动切换至 V4.5 Full";
      } else {
        saveApiSettings(this.apiSettings);
        this.syncApiInputs();
        this.syncPreciseRefDisplays();
        this.updateCostHint();
      }

      const msg =
        `🪪 已载入 ${slotLabel}：${stored.filename} (${stored.origWidth}×${stored.origHeight} ➔ 标准画布 ${stored.normWidth}×${stored.normHeight})${switchedNote}`;
      this.appendLog(msg);
      this.setStatus(msg);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.appendLog(`❌ 载入 ${slotLabel}图失败: ${msg}`);
      this.setStatus(`❌ 载入 ${slotLabel}图失败：${msg}`);
      window.alert(`载入 ${slotLabel}图失败：${msg}`);
    }
  }

  private async onClearPreciseRef(slot: "char" | "style"): Promise<void> {
    if (slot === "char") {
      if (!this.preciseRef) return;
      const oldName = this.preciseRef.filename;
      await clearPreciseRefImage();
      this.setPreciseRefMemory("char", null);
      this.syncPreciseRefDisplays();
      this.updateCostHint();
      this.appendLog(`🗑️ 已移除 Character 人物参照图：${oldName}`);
      this.setStatus(`🗑️ 已移除 Character 人物参照图：${oldName}`);
    } else {
      if (!this.preciseStyleRef) return;
      const oldName = this.preciseStyleRef.filename;
      await clearPreciseStyleRefImage();
      this.setPreciseRefMemory("style", null);
      this.syncPreciseRefDisplays();
      this.updateCostHint();
      this.appendLog(`🗑️ 已移除 Style 画风参照图：${oldName}`);
      this.setStatus(`🗑️ 已移除 Style 画风参照图：${oldName}`);
    }
  }

  private togglePreciseRefSlot(slot: "char" | "style"): void {
    if (slot === "char") {
      if (!this.preciseRef) return;
      this.apiSettings.precise_ref_enabled = !this.apiSettings.precise_ref_enabled;
      if (this.apiSettings.precise_ref_enabled && this.apiSettings.model !== MODEL_V4_5_FULL) {
        this.setModel(MODEL_V4_5_FULL, true, true);
        this.setStatus(`🪪 已启用 Character 人物参照 (${this.preciseRef.filename})，并自动切换模型至 V4.5 Full`);
        return;
      }
      saveApiSettings(this.apiSettings);
      this.syncPreciseRefDisplays();
      this.updateCostHint();
      this.setStatus(
        this.apiSettings.precise_ref_enabled
          ? `✅ 已启用 Character 人物参照 (${this.preciseRef.filename})`
          : `⏸️ 已暂停 Character 人物参照 (${this.preciseRef.filename})`
      );
    } else {
      if (!this.preciseStyleRef) return;
      this.apiSettings.precise_style_enabled = !this.apiSettings.precise_style_enabled;
      if (this.apiSettings.precise_style_enabled && this.apiSettings.model !== MODEL_V4_5_FULL) {
        this.setModel(MODEL_V4_5_FULL, true, true);
        this.setStatus(`🎨 已启用 Style 画风参照 (${this.preciseStyleRef.filename})，并自动切换模型至 V4.5 Full`);
        return;
      }
      saveApiSettings(this.apiSettings);
      this.syncPreciseRefDisplays();
      this.updateCostHint();
      this.setStatus(
        this.apiSettings.precise_style_enabled
          ? `✅ 已启用 Style 画风参照 (${this.preciseStyleRef.filename})`
          : `⏸️ 已暂停 Style 画风参照 (${this.preciseStyleRef.filename})`
      );
    }
  }

  private togglePreciseRefEnabled(): void {
    const wf = this.apiSettings.precise_ref_workflow;
    const hasChar = Boolean(this.preciseRef);
    const hasStyle = Boolean(this.preciseStyleRef);

    if (!hasChar && !(wf === "style_plus_chara" && hasStyle)) {
      this.switchMobilePane("config");
      this.switchLeftTab("tab-api");
      this.setStatus("🪪 请先在「Precise Reference」面板上传人物或画风参照图");
      return;
    }

    const activeNow = this.getActivePreciseRefSlots().length > 0;
    if (activeNow) {
      if (hasChar) this.apiSettings.precise_ref_enabled = false;
      if (wf === "style_plus_chara" && hasStyle) this.apiSettings.precise_style_enabled = false;
      saveApiSettings(this.apiSettings);
      this.syncPreciseRefDisplays();
      this.updateCostHint();
      this.setStatus("⏸️ 已快捷暂停精密参照");
    } else {
      if (hasChar) this.apiSettings.precise_ref_enabled = true;
      if (wf === "style_plus_chara" && hasStyle) this.apiSettings.precise_style_enabled = true;
      if (this.apiSettings.model !== MODEL_V4_5_FULL) {
        this.setModel(MODEL_V4_5_FULL, true, true);
        this.setStatus("🪪 已快捷恢复精密参照，并自动切换模型至 V4.5 Full");
        return;
      }
      saveApiSettings(this.apiSettings);
      this.syncPreciseRefDisplays();
      this.updateCostHint();
      this.setStatus("✅ 已快捷恢复启用精密参照");
    }
  }

  private setModel(nextModel: NaiModelId, adjustDefaultScale = true, silentStatus = false): void {
    const prevModel = this.apiSettings.model;
    this.apiSettings.model = nextModel;
    if (adjustDefaultScale && prevModel !== nextModel) {
      const curScale = Number(this.apiSettings.scale.toFixed(1));
      if (nextModel === MODEL_V4_5_FULL && curScale === 6.0) {
        this.apiSettings.scale = 7.0;
      } else if (nextModel === MODEL_V5_FULL_MEDIUM && curScale === 7.0) {
        this.apiSettings.scale = 6.0;
      }
    }
    saveApiSettings(this.apiSettings);
    this.syncApiInputs();
    this.syncPreciseRefDisplays();
    this.updateCostHint();
    if (!silentStatus) {
      this.setStatus(
        nextModel === MODEL_V4_5_FULL
          ? `🪪 已切换至 NovelAI Diffusion V4.5 Full (Steps=${this.apiSettings.steps}, Guidance=${this.apiSettings.scale})`
          : `⚡ 已切换至 NovelAI Diffusion V5 Full Medium (固定 14 步, Guidance=${this.apiSettings.scale})`
      );
    }
  }

  private getActivePreciseRefSlots(): PreciseRefSlotInput[] {
    if (this.apiSettings.model !== MODEL_V4_5_FULL) return [];
    const wf = this.apiSettings.precise_ref_workflow;
    const out: PreciseRefSlotInput[] = [];

    const hasChar = Boolean(
      this.apiSettings.precise_ref_enabled &&
        this.preciseRef &&
        this.preciseRef.preparedPngBytes.length > 0
    );
    const hasStyle = Boolean(
      this.apiSettings.precise_style_enabled &&
        this.preciseStyleRef &&
        this.preciseStyleRef.preparedPngBytes.length > 0
    );

    if (wf === "chara_only") {
      if (hasChar && this.preciseRef) {
        out.push({
          mode: "character",
          pngBytes: this.preciseRef.preparedPngBytes,
          strength: this.apiSettings.precise_ref_strength,
          fidelity: this.apiSettings.precise_ref_fidelity,
        });
      }
    } else if (wf === "single_char_and_style") {
      if (hasChar && this.preciseRef) {
        out.push({
          mode: "character&style",
          pngBytes: this.preciseRef.preparedPngBytes,
          strength: this.apiSettings.precise_ref_strength,
          fidelity: this.apiSettings.precise_ref_fidelity,
        });
      }
    } else {
      // "style_plus_chara"
      if (hasChar && this.preciseRef) {
        out.push({
          mode: "character",
          pngBytes: this.preciseRef.preparedPngBytes,
          strength: this.apiSettings.precise_ref_strength,
          fidelity: this.apiSettings.precise_ref_fidelity,
        });
      }
      if (hasStyle && this.preciseStyleRef) {
        out.push({
          mode: "style",
          pngBytes: this.preciseStyleRef.preparedPngBytes,
          strength: this.apiSettings.precise_style_strength,
          fidelity: this.apiSettings.precise_style_fidelity,
        });
      }
    }
    return out;
  }

  private getActiveModelShortLabel(): string {
    if (this.apiSettings.model === MODEL_V4_5_FULL) {
      const slots = this.getActivePreciseRefSlots();
      if (slots.length === 2) return "V4.5 Full + Style+Chara双参照";
      if (slots.length === 1) {
        const m = slots[0].mode;
        if (m === "character&style") return "V4.5 Full + Chara&Style参照";
        if (m === "style") return "V4.5 Full + Style参照";
        return "V4.5 Full + Chara参照";
      }
      return "V4.5 Full";
    }
    return "V5 Full Medium";
  }

  private isOpusFreeActive(): boolean {
    return Boolean(
      this.subInfo &&
        this.subInfo.tier === 3 &&
        this.subInfo.active &&
        !this.subInfo.opus_usage_negative
    );
  }

  private syncPreciseRefDisplays(): void {
    const wf = this.apiSettings.precise_ref_workflow;
    const isDualWf = wf === "style_plus_chara";
    const isV45 = this.apiSettings.model === MODEL_V4_5_FULL;

    const hasCharImg = Boolean(this.preciseRef && this.preciseRefThumbUrl);
    const charEnabled = this.apiSettings.precise_ref_enabled;
    const charS = Number(this.apiSettings.precise_ref_strength.toFixed(2));
    const charF = Number(this.apiSettings.precise_ref_fidelity.toFixed(2));

    const hasStyleImg = Boolean(this.preciseStyleRef && this.preciseStyleRefThumbUrl);
    const styleEnabled = this.apiSettings.precise_style_enabled;
    const styleS = Number(this.apiSettings.precise_style_strength.toFixed(2));
    const styleF = Number(this.apiSettings.precise_style_fidelity.toFixed(2));

    for (const [wfId, btn] of this.elPreciseWorkflowBtns.entries()) {
      btn.classList.toggle("active", wfId === wf);
    }

    if (this.elPreciseStyleSlot) {
      this.elPreciseStyleSlot.classList.toggle("hidden-slot", !isDualWf);
      this.elPreciseStyleSlot.classList.toggle(
        "paste-target",
        isDualWf && this.activePasteSlot === "style"
      );
    }
    if (this.elPreciseCharSlot) {
      this.elPreciseCharSlot.classList.toggle(
        "paste-target",
        isDualWf && this.activePasteSlot === "char"
      );
    }
    if (this.elPreciseCharModeLbl) {
      this.elPreciseCharModeLbl.textContent =
        wf === "single_char_and_style"
          ? "👤&🎨 Character & Style (单图同锁)"
          : "👤 Character (人物基图)";
    }

    const activeSlots = this.getActivePreciseRefSlots();
    const anyUploadedInWf = hasCharImg || (isDualWf && hasStyleImg);

    if (this.elRefCapsule) {
      if (activeSlots.length === 2) {
        this.elRefCapsule.textContent = `🪪 参照: Style+Chara (${charS}/${styleS})`;
        this.elRefCapsule.classList.add("active");
      } else if (activeSlots.length === 1) {
        const s0 = activeSlots[0];
        if (s0.mode === "character&style") {
          this.elRefCapsule.textContent = `🪪 参照: Chara&Style ${charS}/${charF}`;
        } else if (s0.mode === "style") {
          this.elRefCapsule.textContent = `🪪 参照: Style ${styleS}/${styleF}`;
        } else {
          this.elRefCapsule.textContent = `🪪 参照: Chara ${charS}/${charF}`;
        }
        this.elRefCapsule.classList.add("active");
      } else if (anyUploadedInWf && !isV45) {
        this.elRefCapsule.textContent = "🪪 参照: 待切V4.5";
        this.elRefCapsule.classList.remove("active");
      } else if (anyUploadedInWf) {
        this.elRefCapsule.textContent = "🪪 参照: 已暂停";
        this.elRefCapsule.classList.remove("active");
      } else {
        this.elRefCapsule.textContent = "🪪 参照: 未启用";
        this.elRefCapsule.classList.remove("active");
      }
    }

    // Slot 1: Character (or Single Chara&Style)
    if (this.elPreciseRefThumb) {
      this.elPreciseRefThumb.innerHTML = "";
      this.elPreciseRefThumb.classList.toggle("has-img", hasCharImg);
      this.elPreciseRefThumb.classList.toggle("paused", hasCharImg && (!charEnabled || !isV45));
      if (hasCharImg && this.preciseRefThumbUrl && this.preciseRef) {
        const img = this.el("img");
        img.src = this.preciseRefThumbUrl;
        img.alt = this.preciseRef.filename;
        this.elPreciseRefThumb.appendChild(img);
      } else {
        const ph = this.el(
          "span",
          "hint-text",
          wf === "single_char_and_style" ? "📤 点击或拖入\n单张同锁参考图" : "📤 点击或拖入\n人物参考图"
        );
        ph.style.whiteSpace = "pre-line";
        this.elPreciseRefThumb.appendChild(ph);
      }
    }
    if (this.elPreciseRefClearBtn) {
      this.elPreciseRefClearBtn.disabled = !hasCharImg;
    }
    if (this.elPreciseRefToggleBtn) {
      this.elPreciseRefToggleBtn.disabled = !hasCharImg;
      this.elPreciseRefToggleBtn.classList.toggle("precise-ref-toggle-on", hasCharImg && charEnabled);
      this.elPreciseRefToggleBtn.textContent = charEnabled ? "✓" : "⏸";
    }

    // Slot 2: Style
    if (this.elPreciseStyleThumb) {
      this.elPreciseStyleThumb.innerHTML = "";
      this.elPreciseStyleThumb.classList.toggle("has-img", hasStyleImg);
      this.elPreciseStyleThumb.classList.toggle("paused", hasStyleImg && (!styleEnabled || !isV45));
      if (hasStyleImg && this.preciseStyleRefThumbUrl && this.preciseStyleRef) {
        const img = this.el("img");
        img.src = this.preciseStyleRefThumbUrl;
        img.alt = this.preciseStyleRef.filename;
        this.elPreciseStyleThumb.appendChild(img);
      } else {
        const ph = this.el("span", "hint-text", "🎨 点击或拖入\n画风参考图");
        ph.style.whiteSpace = "pre-line";
        this.elPreciseStyleThumb.appendChild(ph);
      }
    }
    if (this.elPreciseStyleClearBtn) {
      this.elPreciseStyleClearBtn.disabled = !hasStyleImg;
    }
    if (this.elPreciseStyleToggleBtn) {
      this.elPreciseStyleToggleBtn.disabled = !hasStyleImg;
      this.elPreciseStyleToggleBtn.classList.toggle(
        "precise-ref-toggle-on",
        hasStyleImg && styleEnabled
      );
      this.elPreciseStyleToggleBtn.textContent = styleEnabled ? "✓" : "⏸";
    }

    if (this.elPreciseRefStatus) {
      this.elPreciseRefStatus.innerHTML = "";
      if (!anyUploadedInWf) {
        this.elPreciseRefStatus.className = "precise-ref-status";
        this.elPreciseRefStatus.textContent = isDualWf
          ? "当前为「Style+Chara 混合」模式：请拖入或粘贴 👤人物基图 与 🎨画风基图（选中槽位后按 Ctrl+V 可分别粘贴，上传后自动切 V4.5 Full）。"
          : wf === "single_char_and_style"
            ? "当前为「单图 Chara&Style」模式：请上传单张参考图同时锁定人物与画风 (+5 Anlas)。"
            : hasStyleImg && this.preciseStyleRef
              ? `当前为「Chara 单独」模式：尚未上传人物参照图（已缓存画风图 ${this.preciseStyleRef.filename} 暂挂保留中）。`
              : "尚未上传角色参照图（支持点击上传 / 拖拽图片 / 在本页 Ctrl+V 粘贴；上传后自动切 V4.5 Full）。";
      } else if (!isV45) {
        this.elPreciseRefStatus.className = "precise-ref-status warn";
        const span = this.el(
          "span",
          "",
          "⚠️ 已载入精密参照图，但当前模型为 V5 Medium（不支持精密参照，生图时不会附带）。 "
        );
        const btnSw = this.el("button", "btn-sm btn-primary", "切换至 V4.5 Full 激活");
        btnSw.style.marginLeft = "4px";
        btnSw.addEventListener("click", () => this.setModel(MODEL_V4_5_FULL, true));
        this.elPreciseRefStatus.append(span, btnSw);
      } else if (activeSlots.length === 0) {
        this.elPreciseRefStatus.className = "precise-ref-status";
        this.elPreciseRefStatus.textContent =
          "⏸️ 当前模式下的参照槽已暂停（点击缩略图下方按钮即可恢复启用）。";
      } else if (activeSlots.length === 2 && this.preciseRef && this.preciseStyleRef) {
        this.elPreciseRefStatus.className = "precise-ref-status active";
        this.elPreciseRefStatus.textContent =
          `✅ Style+Chara 双图混合已激活：👤${this.preciseRef.filename} (S=${charS}/F=${charF}) + 🎨${this.preciseStyleRef.filename} (S=${styleS}/F=${styleF}) · 共 +10 Anlas`;
      } else {
        const s0 = activeSlots[0];
        this.elPreciseRefStatus.className = "precise-ref-status active";
        if (s0.mode === "style" && this.preciseStyleRef) {
          const hintChar = hasCharImg ? "（人物槽已暂停）" : "（人物槽未传图，仅锁画风）";
          this.elPreciseRefStatus.textContent =
            `✅ Style 画风参照已激活：🎨${this.preciseStyleRef.filename} (S=${styleS}/F=${styleF} · +5 Anlas) ${hintChar}`;
        } else if (s0.mode === "character&style" && this.preciseRef) {
          this.elPreciseRefStatus.textContent =
            `✅ 单图 Chara&Style 已激活：👤&🎨${this.preciseRef.filename} (S=${charS}/F=${charF} · +5 Anlas)`;
        } else if (this.preciseRef) {
          const standbyStyle =
            wf === "chara_only" && hasStyleImg && this.preciseStyleRef
              ? ` · 画风槽 (${this.preciseStyleRef.filename}) 已暂挂不计费`
              : isDualWf && !hasStyleImg
                ? " · 画风槽待上传（当前仅人物生效）"
                : "";
          this.elPreciseRefStatus.textContent =
            `✅ Character 单独参照已激活：👤${this.preciseRef.filename} (S=${charS}/F=${charF} · +5 Anlas)${standbyStyle}`;
        }
      }
    }

    if (this.elModTabRefBanner) {
      if (activeSlots.length === 2 && this.preciseRef && this.preciseStyleRef) {
        this.elModTabRefBanner.textContent =
          `✅ 当前已激活 Style+Chara 双参照 (👤${this.preciseRef.filename} + 🎨${this.preciseStyleRef.filename})。建议点击下方「🎯 精密参照：人物+画风」关闭文字画风与原设身份词条，避免打架！`;
        this.elModTabRefBanner.style.color = "var(--green)";
      } else if (activeSlots.length === 1) {
        const mode = activeSlots[0].mode;
        this.elModTabRefBanner.textContent =
          mode === "character"
            ? `✅ 当前已激活 Chara 单独参照 (S=${charS}, F=${charF})。建议点击下方「👤 精密参照：仅锁人物」保留本台文字画风词条并与角色参照混合！`
            : `✅ 当前已激活 ${mode} 精密参照。建议按需切换下方模块开关避免文字标签冲突。`;
        this.elModTabRefBanner.style.color = "var(--green)";
      } else if (hasCharImg || hasStyleImg) {
        this.elModTabRefBanner.textContent =
          "⏸️ 已缓存精密参照图（当前未激活，可在「⚡ NAI生图」切至 V4.5 Full 或开启槽位激活）。";
        this.elModTabRefBanner.style.color = "";
      } else {
        this.elModTabRefBanner.textContent =
          "当前尚未载入精密参照图。可在「⚡ NAI生图」上传 Style+Chara 双图或 Chara 单图，并配合下方预设剔除冲突词。";
        this.elModTabRefBanner.style.color = "";
      }
    }
  }

  private syncCameraDisplays(): void {
    const shotCode = CAMERA_SHOT_PRESETS[this.cfg.cam_shot_preset] ?? "auto";
    const desc = describeCameraShort(
      this.cfg.cam_enable_override,
      this.cfg.cam_azimuth,
      this.cfg.cam_elevation,
      shotCode,
      this.cfg.cam_wide_lens,
      this.cfg.cam_dutch_angle
    );
    this.elCamCapsule.textContent = `🎥 机位: ${desc}`;
    this.elCamCapsule.classList.toggle("active", this.cfg.cam_enable_override);
    if (this.radarCtrl) {
      this.radarCtrl.setState({
        enabled: this.cfg.cam_enable_override,
        azimuth: this.cfg.cam_azimuth,
        elevation: this.cfg.cam_elevation,
      });
    }
  }

  private resetCameraOverride(): void {
    this.cfg.cam_enable_override = false;
    this.syncControlsFromConfig();
    this.saveCfgAndRefresh();
    this.setStatus("🔄 已复位相机角度为「随本幕默认」");
  }

  private syncExpressionDisplays(): void {
    const active = isExpressionOverrideActive(this.cfg);
    const shortDesc = describeExpressionShort(this.cfg);
    this.elExprCapsule.textContent = `😊 表情: ${shortDesc}`;
    this.elExprCapsule.classList.toggle("active", active);
    for (const [key, pill] of this.elExprPresetPills.entries()) {
      pill.classList.toggle("active", this.cfg.expr_preset === key);
    }
    if (this.elExprPreviewBox) {
      if (!this.cfg.enable_expression) {
        this.elExprPreviewBox.textContent = "🚫 「9. 微表情与脸红 (Expr)」模块已在「🎛️ 模块」关闭，本面板不注入表情词条。";
      } else if (!active) {
        this.elExprPreviewBox.textContent = "🔄 当前跟随各幕次原设微表情节奏（未启用全局表情覆盖）。";
      } else {
        const compiled = compileExpressionOverride(this.cfg, this.activeSceneId);
        const rawCompiled = compileExpressionOverride(this.cfg, "");
        const lines: string[] = [];
        if (!compiled.active && (this.activeSceneId === "S06" || this.activeSceneId === "S07")) {
          lines.push(`😴 当前预览幕 [${this.activeSceneId}] 为熟睡闭眼保护幕（如需覆盖请勾选上方「强制覆盖 S06/S07」）。`);
        }
        lines.push(`正向词条: ${rawCompiled.pos_tags_str || "(无)"}`);
        lines.push(`睁/闭眼状态: ${rawCompiled.eyes_open ? "👁️ 睁眼（保留瞳色，自动解锁看着镜头）" : "😴 闭眼（自动隐藏瞳色，屏蔽睁眼防冲突）"}`);
        if (rawCompiled.neg_unblock.size > 0) {
          lines.push(`自动解除负向屏蔽: ${Array.from(rawCompiled.neg_unblock).join(", ")}`);
        }
        if (rawCompiled.neg_add.length > 0) {
          lines.push(`自动追加防串负向: ${rawCompiled.neg_add.join(", ")}`);
        }
        if (rawCompiled.prose_clause) {
          lines.push(`T5 自然语言句: ${rawCompiled.prose_clause}`);
        }
        this.elExprPreviewBox.textContent = lines.join("\n");
      }
    }
  }

  private resetExpressionOverride(): void {
    const defaults = createDefaultCharacterConfig();
    this.cfg.expr_preset = defaults.expr_preset;
    this.cfg.expr_eye_state = defaults.expr_eye_state;
    this.cfg.expr_mouth_state = defaults.expr_mouth_state;
    this.cfg.expr_brow_blush = defaults.expr_brow_blush;
    this.cfg.expr_heart_eyes = false;
    this.cfg.expr_empty_eyes = false;
    this.cfg.expr_tears = false;
    this.cfg.expr_override_sleeping = false;
    this.cfg.custom_expression_tags = "";
    this.syncControlsFromConfig();
    this.saveCfgAndRefresh();
    this.setStatus("🔄 已复位人物表情为「随本幕默认」");
  }

  private setMobileHeaderOpen(open: boolean): void {
    this.mobileHeaderOpen = open;
    if (this.elHeaderBar) {
      this.elHeaderBar.classList.toggle("mobile-header-open", open);
    }
    if (this.elMobileHeaderToggleBtn) {
      this.elMobileHeaderToggleBtn.textContent = open ? "▴ 收起顶栏" : "🎛️ 预设/顶栏 ▾";
    }
  }

  private switchMobilePane(pane: "config" | "scenes" | "output"): void {
    this.activeMobilePane = pane;
    this.root.dataset.mobilePane = pane;
    this.root.querySelectorAll<HTMLElement>("[data-mobile-nav]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.mobileNav === pane);
    });
    if (pane === "config" && this.activeLeftTab === "tab-camera" && this.radarCtrl) {
      requestAnimationFrame(() => this.radarCtrl?.render());
    }
  }

  private syncMobileUi(): void {
    if (this.elMobilePerspBtn) {
      this.elMobilePerspBtn.textContent = this.cfg.perspective_mode === "pov" ? "👁️ POV" : "🎥 3rd";
    }
    if (this.elMobileQuickSceneLbl) {
      const ch =
        STORY_CHAPTERS.find((c) => c.id === this.activeSceneId) ??
        MULTI_ANGLE_CHAPTERS.find((c) => c.id === this.activeSceneId) ??
        ALL_POSITIONS_CHAPTERS.find((c) => c.id === this.activeSceneId);
      this.elMobileQuickSceneLbl.textContent = `当前: ${ch?.title ?? this.activeSceneId}`;
    }
    if (this.elMobileOutBadge) {
      if (this.isGenerating) {
        this.elMobileOutBadge.textContent = "⏳";
        this.elMobileOutBadge.className = "mobile-nav-badge busy";
      } else if (this.gallery.length > 0) {
        this.elMobileOutBadge.textContent = String(this.gallery.length);
        this.elMobileOutBadge.className = "mobile-nav-badge has-items";
      } else {
        this.elMobileOutBadge.textContent = "";
        this.elMobileOutBadge.className = "mobile-nav-badge";
      }
    }
  }

  private switchLeftTab(tabId: string): void {
    this.activeLeftTab = tabId;
    this.root.querySelectorAll("[data-tab-id]").forEach((b) => {
      const isMatch = (b as HTMLElement).dataset.tabId === tabId;
      b.classList.toggle("active", isMatch);
      if (isMatch) {
        b.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
      }
    });
    this.root.querySelectorAll("[data-panel-id]").forEach((p) => {
      p.classList.toggle("active", (p as HTMLElement).dataset.panelId === tabId);
    });
    if (tabId === "tab-camera" && this.radarCtrl) {
      requestAnimationFrame(() => this.radarCtrl?.render());
    }
  }

  private switchSuiteTab(suiteId: "story" | "multi_angle" | "all_pos"): void {
    this.activeSuiteTab = suiteId;
    this.root.querySelectorAll("[data-suite-id]").forEach((b) => {
      const isMatch = (b as HTMLElement).dataset.suiteId === suiteId;
      b.classList.toggle("active", isMatch);
      if (isMatch) {
        b.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
      }
    });
    this.root.querySelectorAll("[data-suite-panel]").forEach((p) => {
      p.classList.toggle("active", (p as HTMLElement).dataset.suitePanel === suiteId);
    });

    if (suiteId === "story" && !STORY_CHAPTERS.some((c) => c.id === this.activeSceneId)) {
      this.selectSingleScene("S00");
    } else if (suiteId === "multi_angle" && !MULTI_ANGLE_CHAPTERS.some((c) => c.id === this.activeSceneId)) {
      this.selectSingleScene("MA0");
    } else if (suiteId === "all_pos" && !ALL_POSITIONS_CHAPTERS.some((c) => c.id === this.activeSceneId)) {
      const vis = this.getFilteredPosChapters();
      this.selectSingleScene(vis[0]?.id || "P01");
    }
    this.refreshSuiteTexts();
  }

  private switchOutTab(outTabId: string): void {
    this.activeOutTab = outTabId;
    this.root.querySelectorAll("[data-out-tab-id]").forEach((b) => {
      const isMatch = (b as HTMLElement).dataset.outTabId === outTabId;
      b.classList.toggle("active", isMatch);
      if (isMatch) {
        b.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
      }
    });
    this.root.querySelectorAll("[data-out-panel]").forEach((p) => {
      p.classList.toggle("active", (p as HTMLElement).dataset.outPanel === outTabId);
    });
  }

  private selectSingleScene(sceneId: string): void {
    this.activeSceneId = sceneId;
    this.activeSubVariantIdx = 0;
    this.isSingleEdited = false;
    this.root.querySelectorAll(".scene-row").forEach((r) => {
      r.classList.toggle("active", (r as HTMLElement).dataset.sceneId === sceneId);
    });
    this.syncExpressionDisplays();
    this.renderSinglePromptBox();
    this.syncMobileUi();
  }

  private saveCfgAndRefresh(): void {
    saveActiveConfig(this.cfg);
    this.syncExpressionDisplays();
    this.syncCameraDisplays();
    this.refreshAllOutputs();
  }

  private refreshAllOutputs(): void {
    if (!this.isSingleEdited) {
      this.renderSinglePromptBox();
    }
    this.refreshSuiteTexts();
  }

  private renderSinglePromptBox(): void {
    this.currentSceneItems = generateScenePrompts(this.activeSceneId, this.cfg);
    this.elSingleSelect.innerHTML = "";
    this.currentSceneItems.forEach((item, idx) => {
      const opt = this.el("option", "", item.subTitle);
      opt.value = String(idx);
      this.elSingleSelect.appendChild(opt);
    });
    const safeIdx = Math.max(0, Math.min(this.activeSubVariantIdx, this.currentSceneItems.length - 1));
    this.activeSubVariantIdx = safeIdx;
    this.elSingleSelect.value = String(safeIdx);

    const activeItem = this.currentSceneItems[safeIdx];
    if (activeItem) {
      this.elCanvasBadge.textContent = activeItem.canvas;
      this.elSingleText.value = `## ${activeItem.subTitle}（画布：${activeItem.canvas}）：\n${activeItem.prompt}`;
    } else {
      this.elSingleText.value = "";
    }
    this.updateTokenBadge();
    this.updateCostHint();
  }

  private updateTokenBadge(): void {
    const promptToCount = extractFirstPromptFromPreview(this.elSingleText.value, 0) || this.elSingleText.value;
    const tok = countPromptT5Tokens(promptToCount);
    const maxTok = Math.max(tok.api_pos_tokens, tok.api_neg_tokens);
    this.elTokenBadge.textContent =
      `API正 ${tok.api_pos_tokens}/512 · 负 ${tok.api_neg_tokens}/512 · 单框 ${tok.web_single_box_tokens}` +
      (tok.exact_spiece ? "" : " (估算)");
    this.elTokenBadge.className =
      "token-badge " + (maxTok > 512 ? "over" : maxTok >= 475 ? "warn" : "ok");
  }

  private getOrderedSelectedStoryIds(): string[] {
    return STORY_CHAPTERS.filter((c) => this.selectedStoryIds.has(c.id)).map((c) => c.id);
  }

  private getActiveSuiteSelectedIds(): string[] {
    if (this.activeSuiteTab === "multi_angle") {
      return MULTI_ANGLE_CHAPTERS.filter((c) => this.selectedMaIds.has(c.id)).map((c) => c.id);
    }
    if (this.activeSuiteTab === "all_pos") {
      return this.getFilteredPosChapters()
        .filter((c) => this.selectedPosIds.has(c.id))
        .map((c) => c.id);
    }
    return this.getOrderedSelectedStoryIds();
  }

  private refreshSuiteTexts(): void {
    const ids = this.getActiveSuiteSelectedIds();
    const povCfg = { ...this.cfg, perspective_mode: "pov" as const };
    const trdCfg = { ...this.cfg, perspective_mode: "3rd" as const };
    if (this.elPovText) {
      this.elPovText.value = generateFullSuite(povCfg, ids, false, false);
    }
    if (this.elTrdText) {
      this.elTrdText.value = generateFullSuite(trdCfg, ids, false, false);
    }
  }

  // ==========================================
  // Preset Management (Built-in + localStorage + JSON)
  // ==========================================
  private loadPresetByName(name: string): void {
    if (name in this.customPresets) {
      const data = this.customPresets[name];
      this.cfg = { ...createDefaultCharacterConfig(), ...data, preset_name: name };
    } else if (name in BUILTIN_CHARACTERS) {
      const info = BUILTIN_CHARACTERS[name];
      this.cfg.preset_name = name;
      this.cfg.char_tag = info.char_tag;
      this.cfg.eng_name = info.eng_name;
      this.cfg.eye_color = info.eye_color;
      this.cfg.hair_tags = info.hair_tags;
      this.cfg.canon_neg_tags = info.canon_neg_tags;
      this.cfg.extra_char_tags = "";
      this.cfg.body_preset = info.body_preset;
      this.cfg.bust_preset = info.bust_preset;
    }
    this.syncControlsFromConfig();
    this.saveCfgAndRefresh();
    this.setStatus(`✅ 已切换预设：${name}`);
  }

  private onSavePreset(): void {
    const raw = window.prompt("请输入自定义预设名称：", this.cfg.eng_name || "custom");
    if (!raw || !raw.trim()) return;
    const cleanName = raw.trim().startsWith("⭐") ? raw.trim() : `⭐ ${raw.trim()}`;
    this.cfg.preset_name = cleanName;
    this.customPresets[cleanName] = { ...this.cfg };
    saveCustomPresets(this.customPresets);
    this.populatePresetDropdown();
    this.elPresetSelect.value = cleanName;
    this.setStatus(`💾 已保存自定义预设「${cleanName}」`);
  }

  private onDeletePreset(): void {
    const cur = this.cfg.preset_name;
    if (cur in BUILTIN_CHARACTERS && !(cur in this.customPresets)) {
      window.alert("内置角色预设不可删除；请选择您保存的 ⭐ 自定义预设。");
      return;
    }
    if (!window.confirm(`确定要删除自定义预设「${cur}」吗？`)) return;
    delete this.customPresets[cur];
    saveCustomPresets(this.customPresets);
    this.populatePresetDropdown();
    const first = Object.keys(BUILTIN_CHARACTERS)[0];
    this.loadPresetByName(first);
  }

  private onExportPresetsJson(): void {
    const jsonStr = JSON.stringify(this.customPresets, null, 2);
    triggerTextDownload(jsonStr, "character_presets.json", "application/json;charset=utf-8");
    this.setStatus("📤 已导出自定义预设 character_presets.json");
  }

  private onImportPresetsJson(): void {
    const inp = this.el("input");
    inp.type = "file";
    inp.accept = ".json";
    inp.addEventListener("change", async () => {
      const file = inp.files?.[0];
      if (!file) return;
      try {
        const parsed = JSON.parse(await file.text()) as Record<string, Partial<CharacterConfig>>;
        if (!parsed || typeof parsed !== "object") throw new Error("无效的 JSON 预设格式");
        this.customPresets = { ...this.customPresets, ...parsed };
        saveCustomPresets(this.customPresets);
        this.populatePresetDropdown();
        const firstImported = Object.keys(parsed)[0];
        if (firstImported) this.loadPresetByName(firstImported);
        this.setStatus(`📥 已成功导入 ${Object.keys(parsed).length} 条自定义预设`);
      } catch (err) {
        window.alert(`导入预设失败：${err instanceof Error ? err.message : String(err)}`);
      }
    });
    inp.click();
  }

  // ==========================================
  // NovelAI API Integration (CORS Direct Fetch)
  // ==========================================
  private async onCheckSubscription(silent = false): Promise<void> {
    try {
      if (!silent) {
        this.setStatus("🔍 正在查询 NovelAI 账户订阅与 Anlas / Opus 余额...");
      }
      const info = await fetchSubscriptionInfo(this.apiSettings.api_token);
      this.subInfo = info;
      this.updateAnlasDisplay();
      const opusExtra =
        info.opus_usage_percent !== null
          ? ` | V5额度条: ${info.opus_usage_negative ? "已透支" : `余量${info.opus_usage_percent}%`}`
          : info.tier === 3 && info.active
            ? " | Opus免点额度生效中"
            : "";
      this.appendLog(
        `订阅状态: ${info.tier_name} (${info.active ? "激活" : "未激活"}) | 订阅月度余量: ${info.fixed_anlas} + 永久购买: ${info.purchased_anlas} = ${info.anlas_left} Anlas${opusExtra}`
      );
      if (!silent) {
        this.setStatus(
          `✅ 账户有效：${info.tier_name} | 订阅余量 ${info.fixed_anlas} + 永久 ${info.purchased_anlas} = ${info.anlas_left} Anlas`
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (this.elApiSubBanner) {
        this.elApiSubBanner.className = "sub-banner opus-err";
        this.elApiSubBanner.textContent = `❌ 订阅查询失败：${msg}`;
      }
      this.appendLog(`❌ 查点数失败: ${msg}`);
      if (!silent) {
        this.setStatus(`❌ ${msg}`);
        window.alert(msg);
      }
    }
  }

  private describeActivePreciseRefsForManifest(slots: PreciseRefSlotInput[]): string {
    if (slots.length === 0) return "none";
    return slots
      .map((s) => {
        if (s.mode === "style") {
          return `Style(${this.preciseStyleRef?.filename ?? "style.png"}, S=${s.strength}, F=${s.fidelity})`;
        }
        if (s.mode === "character&style") {
          return `Character&Style(${this.preciseRef?.filename ?? "char_style.png"}, S=${s.strength}, F=${s.fidelity})`;
        }
        return `Character(${this.preciseRef?.filename ?? "char.png"}, S=${s.strength}, F=${s.fidelity})`;
      })
      .join(" + ");
  }

  private updateCostHint(): void {
    if (!this.elCostHint) return;
    const activeItem = this.currentSceneItems[this.activeSubVariantIdx];
    const hint = activeItem?.canvas || "竖图 832x1216";
    const [w, h] = parseCanvasSize(hint, this.apiSettings.canvas_preset);
    const model = this.apiSettings.model;
    const isV45 = model === MODEL_V4_5_FULL;
    const effSteps = isV45 ? this.apiSettings.steps : 14;
    const activeRefSlots = this.getActivePreciseRefSlots();
    const refCount = activeRefSlots.length;
    const opusActive = this.isOpusFreeActive();
    const isOpusFreeBase = opusActive && w * h <= 1048576 && effSteps <= 28;
    const actualEst = estimateNaiAnlas({
      model,
      width: w,
      height: h,
      steps: effSteps,
      isOpusFreeEligible: opusActive,
      preciseRefCount: refCount,
    });
    const nonOpusEst = estimateNaiAnlas({
      model,
      width: w,
      height: h,
      steps: effSteps,
      isOpusFreeEligible: false,
      preciseRefCount: refCount,
    });
    const modelLbl = this.getActiveModelShortLabel();
    const upNote = this.apiSettings.auto_upscale_replace ? " + 自动2x放大 1 Anlas" : "";
    const refSurcharge = refCount * 5;

    if (isOpusFreeBase && refCount > 0) {
      const refDesc =
        refCount === 2
          ? "Style+Chara 双精密参照 10 Anlas"
          : `精密参照 (${activeRefSlots[0].mode}) 5 Anlas`;
      this.elCostHint.textContent =
        `📐 发送：${w} × ${h} (${effSteps}步 · ${modelLbl}) | 单张消耗：${actualEst} Anlas（Opus 底图免点 0 + ${refDesc}）${upNote}`;
    } else if (isOpusFreeBase) {
      this.elCostHint.textContent =
        `📐 发送：${w} × ${h} (${effSteps}步 · ${modelLbl}) | 单张消耗：0 Anlas（Opus 免点生效中 · 原价约 ${nonOpusEst} Anlas）${upNote}`;
    } else {
      const opusTip =
        refCount > 0
          ? `（Opus 标准尺寸 ≤28步时为 ${refSurcharge} Anlas）`
          : "（Opus 标准尺寸 ≤28步时为 0 Anlas）";
      this.elCostHint.textContent =
        `📐 发送：${w} × ${h} (${effSteps}步 · ${modelLbl}) | 单张预计消耗：约 ${actualEst} Anlas${opusTip}${upNote}`;
    }
  }

  private updateAnlasDisplay(): void {
    if (!this.subInfo) return;
    const info = this.subInfo;
    const isOpusFree = info.tier === 3 && info.active && info.unlimited_max_priority && !info.opus_usage_negative;

    let usageFull = "";
    let usageShort = "";
    if (info.opus_usage_percent !== null) {
      const remPct = Math.max(0, Math.min(100, info.opus_usage_percent));
      const usedPct = Math.max(0, 100 - remPct);
      usageFull = info.opus_usage_negative
        ? " | ⚠️ V5额度条：已透支(按点数计费)"
        : ` | 🔋 V5额度条：充裕(余量 ${remPct}% / 已用 ${usedPct}%)`;
      usageShort = info.opus_usage_negative
        ? " · V5额度透支"
        : ` · OpusV5余${remPct}%`;
    } else if (info.tier === 3 && info.active) {
      usageFull = " | ♾️ Opus免点标准生成：生效中 (≤1024² & ≤28步 0点)";
      usageShort = " · ♾️Opus免点";
    }

    let expNote = "";
    if (info.expires_at > 0) {
      const ms = info.expires_at > 1e12 ? info.expires_at : info.expires_at * 1000;
      const d = new Date(ms);
      if (!Number.isNaN(d.getTime()) && d.getUTCFullYear() >= 2020) {
        expNote = ` | 📅 续期/到期：${d.toISOString().slice(0, 10)}`;
      }
    }

    if (this.elApiSubBanner) {
      this.elApiSubBanner.className = `sub-banner ${
        info.active && !info.opus_usage_negative ? "opus-ok" : "opus-warn"
      }`;
      this.elApiSubBanner.textContent =
        `💎 套餐：${info.tier_name} (${info.active ? "已激活" : "未激活"}) | ${
          isOpusFree ? "♾️ Opus 无限标准生成生效中" : info.opus_usage_negative ? "⚠️ 免费额度条已透支" : "点数模式"
        }\n` +
        `📊 订阅月度余量(固定)：${info.fixed_anlas} Anlas | 永久购买：${info.purchased_anlas} Anlas | 总计：${info.anlas_left} Anlas` +
        usageFull +
        expNote;
    }

    this.elAnlasBadge.textContent =
      `💎 ${info.tier_name}${info.active ? "" : "(未激活)"} | 订阅月度:${info.fixed_anlas} + 永久:${info.purchased_anlas} = ${info.anlas_left} Anlas${usageShort}`;
    this.elAnlasBadge.style.color = info.opus_usage_negative ? "var(--yellow)" : "var(--green)";
    this.updateCostHint();
  }

  private async onGenerateCurrentPreview(): Promise<void> {
    if (this.isGenerating) return;
    if (!this.apiSettings.api_token.trim()) {
      this.switchMobilePane("config");
      this.switchLeftTab("tab-api");
      window.alert("请先在左侧「⚡ NAI生图」填入 Persistent API Token (pst-...)");
      return;
    }

    const blocks = extractPromptBlocksFromPreview(this.elSingleText.value);
    const promptToSend = extractFirstPromptFromPreview(this.elSingleText.value, 0) || this.elSingleText.value.trim();
    if (!promptToSend) {
      window.alert("当前单幕提示词为空！");
      return;
    }

    const activeItem = this.currentSceneItems[this.activeSubVariantIdx];
    const hint = activeItem?.canvas || "竖图 832x1216";
    const [w, h] = parseCanvasSize(hint, this.apiSettings.canvas_preset);
    const isC5 = isC5LowresPixelStyleActive(this.cfg) || hint.includes("自动3x硬放大");
    const mode = this.cfg.perspective_mode;
    const safeMode = mode === "pov" ? "POV" : "3rd";
    const subTag = this.currentSceneItems.length > 1 ? `_P${this.activeSubVariantIdx + 1}` : "";
    const sceneFileTag = `${this.activeSceneId}${subTag}`;

    const activeRefSlots = this.getActivePreciseRefSlots();
    const modelShort = this.getActiveModelShortLabel();
    this.isGenerating = true;
    this.switchOutTab("out-image");
    this.switchMobilePane("output");
    this.syncMobileUi();
    this.setStatus(`🎨 正在生成【${sceneFileTag} · ${safeMode}】(${w}x${h}, ${modelShort})...`);
    this.appendLog(
      `开始生成 ${sceneFileTag} (${w}x${h}, ${modelShort}, Seed=${this.apiSettings.seed})...`
    );

    try {
      const res = await generateSingleImageNai({
        apiToken: this.apiSettings.api_token,
        model: this.apiSettings.model,
        promptText: promptToSend,
        width: w,
        height: h,
        steps: this.apiSettings.steps,
        scale: this.apiSettings.scale,
        cfgRescale: this.apiSettings.cfg_rescale,
        seed: this.apiSettings.seed,
        ucPresetMode: this.apiSettings.uc_preset_mode,
        keepInlineNegatives: this.apiSettings.keep_inline_negatives,
        extraUc: this.apiSettings.extra_uc,
        appendV5Quality: this.apiSettings.append_v5_quality,
        preciseRefs: activeRefSlots,
        isOpusFreeEligible: this.isOpusFreeActive(),
        pixel3xNearest: isC5,
      });

      if (this.activeSceneId === "S00") {
        this.lastS00Seed = res.seed;
      }

      let finalBytes = res.imageBytes;
      let finalW = res.width;
      let finalH = res.height;
      let finalElapsed = res.elapsedSec;
      let finalAnlas = res.estimatedAnlas;
      let didUpscale = false;

      const baseExt = detectImageExt(res.imageBytes);
      let finalName = `${sceneFileTag}_${safeMode}_s${res.seed}_${formatTimeHHMMSS()}${baseExt}`;

      if (this.apiSettings.auto_upscale_replace && res.width * res.height <= 1048576) {
        this.switchOutTab("out-image");
        this.setStatus("🔎 底图已生成，正在执行 2x 高清放大，完成后再更新画面...");
        this.appendLog(`🔎 自动 2x Upscale (放大完成前不推送 1x 原图): ${finalName} (${res.width}x${res.height})...`);

        try {
          const up = await upscaleSingleImageNai({
            apiToken: this.apiSettings.api_token,
            imageBytes: res.imageBytes,
          });
          finalBytes = up.imageBytes;
          finalW = up.outWidth;
          finalH = up.outHeight;
          finalElapsed = Number((res.elapsedSec + up.elapsedSec).toFixed(2));
          finalAnlas = res.estimatedAnlas + 1;
          didUpscale = true;
          const upExt = detectImageExt(finalBytes);
          finalName = `${sceneFileTag}_${safeMode}_s${res.seed}_${formatTimeHHMMSS()}_2x_${finalW}x${finalH}${upExt}`;
        } catch (upErr) {
          const upMsg = upErr instanceof Error ? upErr.message : String(upErr);
          this.appendLog(`⚠️ 自动 2x Upscale 失败，保留放大前原图: ${upMsg}`);
        }
      }

      const savedPath = await saveBytesToMountedDir([formatDateYYYYMMDD()], finalName, finalBytes);
      if (!savedPath && this.apiSettings.auto_download) {
        triggerBytesDownload(finalBytes, finalName);
      }

      this.pushGalleryRecord({
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        scene_id: didUpscale ? `${sceneFileTag}_2x` : sceneFileTag,
        mode_label: safeMode,
        filename: finalName,
        bytes: finalBytes,
        objectUrl: URL.createObjectURL(new Blob([finalBytes.slice()], { type: "image/png" })),
        seed: res.seed,
        width: finalW,
        height: finalH,
        elapsed_sec: finalElapsed,
        estimated_anlas: finalAnlas,
        created_at: Date.now(),
        is_upscaled: didUpscale,
        saved_to_dir: Boolean(savedPath),
      });

      this.switchOutTab("out-image");
      this.appendLog(
        `✅ ${didUpscale ? "生图+2x放大" : "生成"}完成 ${finalName} (${finalW}x${finalH}, Seed=${res.seed}, ${finalElapsed}s)` +
          (savedPath ? ` -> 已写盘 ${savedPath}` : "")
      );
      this.setStatus(
        `🎉 ${didUpscale ? "单张生图+2x放大" : "单张生图"}完成！Seed=${res.seed} (${finalElapsed}s)`
      );

      try {
        this.subInfo = await fetchSubscriptionInfo(this.apiSettings.api_token);
        this.updateAnlasDisplay();
      } catch {
        // silent refresh
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.appendLog(`❌ 生图失败: ${msg}`);
      this.setStatus(`❌ 生图失败：${msg}`);
      window.alert(msg);
    } finally {
      this.isGenerating = false;
      this.syncMobileUi();
    }
  }

  private onBatchGenerateCurrentSuite(): void {
    const ids = this.getActiveSuiteSelectedIds();
    this.runBatchForIds(ids, this.activeSuiteTab);
  }

  private async runBatchForIds(ids: string[], suiteKind: "story" | "multi_angle" | "all_pos"): Promise<void> {
    if (this.isGenerating) return;
    if (!this.apiSettings.api_token.trim()) {
      this.switchMobilePane("config");
      this.switchLeftTab("tab-api");
      window.alert("请先在左侧「⚡ NAI生图」填入 Persistent API Token (pst-...)");
      return;
    }
    if (ids.length === 0) {
      window.alert("当前勾选的任务列表为空！");
      return;
    }

    const mode = this.cfg.perspective_mode;
    const safeMode = mode === "pov" ? "POV" : "3rd";

    interface TaskItem {
      sceneId: string;
      baseChapterId: string;
      title: string;
      promptText: string;
      width: number;
      height: number;
      isC5: boolean;
    }
    const tasks: TaskItem[] = [];
    for (const sid of ids) {
      const prompts = generateScenePrompts(sid, this.cfg, mode);
      const valid = prompts.filter((p) => !p.prompt.startsWith("[Base Prompt]"));
      valid.forEach((item, idx) => {
        const [w, h] = parseCanvasSize(item.canvas, this.apiSettings.canvas_preset);
        const tag = valid.length > 1 ? `${sid}_P${idx + 1}` : sid;
        tasks.push({
          sceneId: tag,
          baseChapterId: sid,
          title: item.subTitle,
          promptText: item.prompt,
          width: w,
          height: h,
          isC5: isC5LowresPixelStyleActive(this.cfg) || item.canvas.includes("自动3x硬放大"),
        });
      });
    }

    const useS00 = this.apiSettings.use_s00_seed;
    const initSeed = this.apiSettings.seed;
    let lockedS00Seed: number | null = null;
    if (useS00) {
      if (initSeed > 0 && initSeed <= 4294967288) {
        lockedS00Seed = initSeed;
      } else if (!tasks.some((t) => t.baseChapterId === "S00") && this.lastS00Seed) {
        lockedS00Seed = this.lastS00Seed;
      }
    }

    const safeTag = (this.cfg.eng_name || this.cfg.char_tag || "char")
      .replace(/[^A-Za-z0-9_-]/g, "")
      .slice(0, 24);
    const runDirParts = [
      formatDateYYYYMMDD(),
      `suite_${safeMode}_${safeTag || suiteKind}_${formatTimeHHMMSS()}`,
    ];

    const activeRefSlots = this.getActivePreciseRefSlots();
    const modelShort = this.getActiveModelShortLabel();

    this.isGenerating = true;
    this.batchAbortCtrl = new AbortController();
    this.batchLightboxDismissed = false;
    this.batchDoneLabel = "";
    this.batchProgressLabel = `⏳ 连出准备中 (0/${tasks.length})`;
    this.switchLeftTab("tab-api");
    this.switchOutTab("out-image");
    this.switchMobilePane("output");
    this.syncMobileUi();
    this.appendLog(
      `🚀 开始批量连出 ${tasks.length} 张 (${suiteKind}, ${safeMode}, ${modelShort}, 锁S00=${useS00})`
    );
    this.updateLightboxBatchStatus();
    if (this.apiSettings.auto_fullscreen_carousel && this.gallery.length > 0) {
      this.openLightbox(this.gallery[this.activeGalleryIdx] || this.gallery[this.gallery.length - 1], "auto");
    }

    const refManifestNote = this.describeActivePreciseRefsForManifest(activeRefSlots);
    const manifestLines: string[] = [
      `# NovelAI Workbench Batch Manifest (${new Date().toISOString()})`,
      `# Model: ${this.apiSettings.model} | PreciseRef: ${refManifestNote}`,
      `# Mode: ${safeMode} | ModuleState: ${describeActiveModules(this.cfg)}`,
      "",
    ];

    let succeeded = 0;
    for (let i = 0; i < tasks.length; i++) {
      if (this.batchAbortCtrl.signal.aborted) break;
      const t = tasks[i];
      const curSeed =
        t.baseChapterId === "S00"
          ? useS00 && lockedS00Seed !== null
            ? lockedS00Seed
            : initSeed
          : useS00
            ? lockedS00Seed ?? initSeed
            : -1;

      this.batchProgressLabel = `⏳ 正在生成 [${i + 1}/${tasks.length}] ${t.sceneId}`;
      this.updateLightboxBatchStatus();
      this.setStatus(
        `⏳ [${i + 1}/${tasks.length}] 正在生成 ${t.sceneId} (${modelShort}, Seed=${curSeed})...`
      );
      this.appendLog(
        `[${i + 1}/${tasks.length}] 请求 ${t.sceneId} (${t.width}x${t.height}, ${modelShort}, Seed=${curSeed})...`
      );

      let ok = false;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const res = await generateSingleImageNai({
            apiToken: this.apiSettings.api_token,
            model: this.apiSettings.model,
            promptText: t.promptText,
            width: t.width,
            height: t.height,
            steps: this.apiSettings.steps,
            scale: this.apiSettings.scale,
            cfgRescale: this.apiSettings.cfg_rescale,
            seed: curSeed,
            ucPresetMode: this.apiSettings.uc_preset_mode,
            keepInlineNegatives: this.apiSettings.keep_inline_negatives,
            extraUc: this.apiSettings.extra_uc,
            appendV5Quality: this.apiSettings.append_v5_quality,
            preciseRefs: activeRefSlots,
            isOpusFreeEligible: this.isOpusFreeActive(),
            pixel3xNearest: t.isC5,
            signal: this.batchAbortCtrl.signal,
          });
          ok = true;
          succeeded++;
          if (t.baseChapterId === "S00") {
            lockedS00Seed = res.seed;
            this.lastS00Seed = res.seed;
          } else if (useS00 && lockedS00Seed === null) {
            lockedS00Seed = res.seed;
          }

          let finalBytes = res.imageBytes;
          let finalW = res.width;
          let finalH = res.height;
          let finalElapsed = res.elapsedSec;
          let finalAnlas = res.estimatedAnlas;
          let didUpscale = false;
          const baseExt = detectImageExt(res.imageBytes);
          const baseName = `${String(i + 1).padStart(2, "0")}_${t.sceneId}_${safeMode}_s${res.seed}${baseExt}`;
          let fname = baseName;

          if (this.apiSettings.auto_upscale_replace && res.width * res.height <= 1048576) {
            this.batchProgressLabel = `🔎 正在 2x 放大 [${i + 1}/${tasks.length}] ${t.sceneId}`;
            this.updateLightboxBatchStatus();
            this.setStatus(`🔎 [${i + 1}/${tasks.length}] 底图已出，正在 2x Upscale（放大完成后再切图）...`);
            this.appendLog(`  🔎 自动 2x 放大 [${i + 1}/${tasks.length}] ${t.sceneId}...`);

            let upscaledOk = false;
            for (let upTry = 0; upTry < 2; upTry++) {
              try {
                const up = await upscaleSingleImageNai({
                  apiToken: this.apiSettings.api_token,
                  imageBytes: res.imageBytes,
                  signal: this.batchAbortCtrl.signal,
                });
                finalBytes = up.imageBytes;
                finalW = up.outWidth;
                finalH = up.outHeight;
                finalElapsed = Number((res.elapsedSec + up.elapsedSec).toFixed(2));
                finalAnlas = res.estimatedAnlas + 1;
                didUpscale = true;
                upscaledOk = true;
                const upExt = detectImageExt(finalBytes);
                fname = `${String(i + 1).padStart(2, "0")}_${t.sceneId}_${safeMode}_s${res.seed}_2x_${finalW}x${finalH}${upExt}`;
                break;
              } catch (upErr) {
                if (upErr instanceof NaiApiError && upErr.statusCode === 429 && upTry === 0) {
                  this.appendLog("  ⚠️ Upscale HTTP 429 限流，等待 3 秒后重试一次...");
                  await new Promise((r) => setTimeout(r, 3000));
                  continue;
                }
                const upMsg = upErr instanceof Error ? upErr.message : String(upErr);
                this.appendLog(`  ⚠️ ${t.sceneId} 自动 2x 放大失败，保留原图: ${upMsg}`);
                break;
              }
            }
            if (!upscaledOk) {
              fname = baseName;
            }
          }

          const savedPath = await saveBytesToMountedDir(runDirParts, fname, finalBytes);
          manifestLines.push(`## ${fname} (${t.title})\n${t.promptText}\n`);

          this.pushGalleryRecord({
            id: `${Date.now()}_${i}`,
            scene_id: didUpscale ? `${t.sceneId}_2x` : t.sceneId,
            mode_label: safeMode,
            filename: fname,
            bytes: finalBytes,
            objectUrl: URL.createObjectURL(new Blob([finalBytes.slice()], { type: "image/png" })),
            seed: res.seed,
            width: finalW,
            height: finalH,
            elapsed_sec: finalElapsed,
            estimated_anlas: finalAnlas,
            created_at: Date.now(),
            is_upscaled: didUpscale,
            saved_to_dir: Boolean(savedPath),
          });
          this.appendLog(`  ✅ ${fname} (${finalW}x${finalH}, ${finalElapsed}s, Seed=${res.seed})`);
          break;
        } catch (err) {
          if (err instanceof NaiApiError && err.statusCode === 429 && attempt === 0) {
            this.appendLog("  ⚠️ HTTP 429 限流，等待 3 秒后重试一次...");
            await new Promise((r) => setTimeout(r, 3000));
            continue;
          }
          const msg = err instanceof Error ? err.message : String(err);
          this.appendLog(`  ❌ ${t.sceneId} 失败: ${msg}`);
          if (err instanceof NaiApiError && (err.statusCode === 401 || err.statusCode === 402)) {
            this.batchAbortCtrl.abort();
          }
          break;
        }
      }

      if (ok && i + 1 < tasks.length && !this.batchAbortCtrl.signal.aborted) {
        await new Promise((r) => setTimeout(r, 450));
      }
    }

    await saveBytesToMountedDir(runDirParts, "prompts_manifest.txt", manifestLines.join("\n"));
    this.isGenerating = false;
    this.batchAbortCtrl = null;
    this.batchProgressLabel = "";
    this.batchDoneLabel = `🎉 本轮连出完成 (${succeeded}/${tasks.length} 张)`;
    this.updateLightboxBatchStatus();
    this.switchOutTab("out-image");
    this.syncMobileUi();
    const msgDone = `🎉 批量连出结束：成功 ${succeeded}/${tasks.length} 张` +
      (getMountedDirName() ? `（已保存至 ${runDirParts.join("/")}）` : "（可点击画廊右上角📦打包下载全部 .zip）");
    this.setStatus(msgDone);
    this.appendLog(msgDone);

    try {
      this.subInfo = await fetchSubscriptionInfo(this.apiSettings.api_token);
      this.updateAnlasDisplay();
    } catch {
      // silent
    }
  }

  private async onUpscaleActiveImage(): Promise<void> {
    if (this.isGenerating) return;
    const rec = this.gallery[this.activeGalleryIdx];
    if (!rec) {
      window.alert("当前预览画廊还没有图片，请先生成至少一张图片。");
      return;
    }
    if (!this.apiSettings.api_token.trim()) {
      this.switchMobilePane("config");
      this.switchLeftTab("tab-api");
      window.alert("请先填写 API Token！");
      return;
    }

    this.isGenerating = true;
    this.syncMobileUi();
    this.setStatus(`🔎 正在对 ${rec.filename} 执行官方 2x 高清放大 (1 Anlas)...`);
    this.appendLog(`🔎 请求官方 2x Upscale: ${rec.filename} (${rec.width}x${rec.height})...`);

    try {
      const up = await upscaleSingleImageNai({
        apiToken: this.apiSettings.api_token,
        imageBytes: rec.bytes,
      });
      const stem = rec.filename.replace(/\.[^.]+$/, "");
      const ext = detectImageExt(up.imageBytes);
      const outName = `${stem}_upscaled_${up.outWidth}x${up.outHeight}${ext}`;
      const savedPath = await saveBytesToMountedDir([formatDateYYYYMMDD()], outName, up.imageBytes);
      if (!savedPath && this.apiSettings.auto_download) {
        triggerBytesDownload(up.imageBytes, outName);
      }

      if (this.apiSettings.auto_upscale_replace) {
        this.removeGalleryRecordById(rec.id);
      }
      this.pushGalleryRecord({
        id: `${Date.now()}_up`,
        scene_id: `${rec.scene_id}_2x`,
        mode_label: rec.mode_label,
        filename: outName,
        bytes: up.imageBytes,
        objectUrl: URL.createObjectURL(new Blob([up.imageBytes.slice()], { type: "image/png" })),
        seed: rec.seed,
        width: up.outWidth,
        height: up.outHeight,
        elapsed_sec: up.elapsedSec,
        estimated_anlas: 1,
        created_at: Date.now(),
        is_upscaled: true,
        saved_to_dir: Boolean(savedPath),
      });

      this.setStatus(`🎉 2x 高清放大完成：${up.srcWidth}x${up.srcHeight} ➔ ${up.outWidth}x${up.outHeight} (${up.elapsedSec}s)`);
      this.appendLog(`✅ 2x Upscale 完成: ${outName} (${up.outWidth}x${up.outHeight}, ${up.elapsedSec}s)`);
      try {
        this.subInfo = await fetchSubscriptionInfo(this.apiSettings.api_token);
        this.updateAnlasDisplay();
      } catch {
        // silent refresh
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.appendLog(`❌ 2x 放大失败: ${msg}`);
      this.setStatus(`❌ 放大失败：${msg}`);
      window.alert(msg);
    } finally {
      this.isGenerating = false;
      this.syncMobileUi();
    }
  }

  private pushGalleryRecord(rec: GeneratedImageRecord): void {
    this.gallery.push(rec);
    const latestIdx = this.gallery.length - 1;
    const isBatchActive = Boolean(this.isGenerating && this.batchAbortCtrl);
    const lightboxOpen = this.elLightbox.classList.contains("open");

    if (
      isBatchActive &&
      this.apiSettings.auto_fullscreen_carousel &&
      !lightboxOpen &&
      !this.batchLightboxDismissed
    ) {
      this.activeGalleryIdx = latestIdx;
      this.renderGallery();
      this.openLightbox(rec, "auto");
      return;
    }

    if (lightboxOpen) {
      if (this.carouselMode === "follow_latest" || this.activeGalleryIdx < 0) {
        this.activeGalleryIdx = latestIdx;
        this.renderGallery();
        this.syncLightboxView(true);
      } else {
        // In "timed" or "manual" mode, keep current slide & timer undisturbed
        this.renderGallery();
        this.syncLightboxView(false);
      }
      return;
    }

    this.activeGalleryIdx = latestIdx;
    this.renderGallery();
  }

  private renderGallery(): void {
    const rec = this.gallery[this.activeGalleryIdx];
    this.elPreviewStage.innerHTML = "";
    if (rec) {
      const img = this.el("img");
      img.src = rec.objectUrl;
      img.alt = rec.filename;
      img.title = "点击打开全屏高清灯箱对比";
      img.addEventListener("click", () => this.openLightbox(rec));
      this.elPreviewStage.appendChild(img);
      this.elPreviewMeta.textContent =
        `${rec.is_upscaled ? "🔎2x" : "✅"} ${rec.scene_id} [${rec.mode_label}] | ` +
        `${rec.width}×${rec.height} | Seed: ${rec.seed} | ${rec.elapsed_sec}s` +
        (rec.saved_to_dir ? " | 📁已写盘" : "");
    } else {
      this.elPreviewStage.appendChild(this.el("span", "hint-text", "等待 NovelAI V4.5 / V5 生成图片..."));
    }

    this.elFilmstrip.innerHTML = "";
    this.gallery.forEach((item, idx) => {
      const thumb = this.el("div", `film-thumb ${idx === this.activeGalleryIdx ? "active" : ""}`);
      const tImg = this.el("img");
      tImg.src = item.objectUrl;
      const lbl = this.el("div", "film-lbl", item.scene_id);
      thumb.append(tImg, lbl);
      thumb.addEventListener("click", () => {
        this.activeGalleryIdx = idx;
        this.renderGallery();
      });
      this.elFilmstrip.appendChild(thumb);
    });
    this.syncMobileUi();
  }

  private onDownloadAllGalleryZip(): void {
    if (this.gallery.length === 0) {
      window.alert("当前会话还没有生成任何图片可供打包下载。");
      return;
    }
    const entries = this.gallery.map((g) => ({ name: g.filename, data: g.bytes }));
    const blob = buildStoreZipBlob(entries);
    triggerBlobDownload(blob, `novelai_session_${formatDateYYYYMMDD()}_${formatTimeHHMMSS()}.zip`);
    this.setStatus(`📦 已打包下载当前会话全部 ${this.gallery.length} 张图片 (.zip)`);
  }

  private syncCheckerboard(): void {
    this.elPreviewStage.classList.toggle("checkerboard", this.checkerboardOn);
    this.elLightboxBody.classList.toggle("checkerboard", this.checkerboardOn);
  }

  private setAutoCarouselEnabled(enabled: boolean): void {
    this.apiSettings.auto_fullscreen_carousel = enabled;
    saveApiSettings(this.apiSettings);
    for (const cb of this.autoCarouselCheckboxes) {
      cb.checked = enabled;
    }
  }

  private setAutoUpscaleEnabled(enabled: boolean): void {
    this.apiSettings.auto_upscale_replace = enabled;
    saveApiSettings(this.apiSettings);
    for (const cb of this.autoUpscaleCheckboxes) {
      cb.checked = enabled;
    }
    this.updateCostHint();
  }

  private removeGalleryRecordById(id: string): void {
    const idx = this.gallery.findIndex((g) => g.id === id);
    if (idx < 0) return;
    const [removed] = this.gallery.splice(idx, 1);
    if (removed?.objectUrl) {
      URL.revokeObjectURL(removed.objectUrl);
    }
    if (this.gallery.length === 0) {
      this.activeGalleryIdx = -1;
    } else if (this.activeGalleryIdx >= this.gallery.length) {
      this.activeGalleryIdx = this.gallery.length - 1;
    } else if (idx < this.activeGalleryIdx) {
      this.activeGalleryIdx = Math.max(0, this.activeGalleryIdx - 1);
    }
    this.renderGallery();
    this.syncLightboxView();
  }

  private openLightbox(rec: GeneratedImageRecord, launchMode: "manual" | "auto" = "manual"): void {
    const idx = this.gallery.findIndex((g) => g.id === rec.id);
    if (idx >= 0) {
      this.activeGalleryIdx = idx;
    }
    this.lightboxZoom1x = false;
    this.elLightboxImg.classList.remove("zoomed-1x");
    this.elLightbox.classList.add("open");
    this.syncLightboxView(true);
    this.updateLightboxBatchStatus();
    if (launchMode === "auto") {
      const targetMode: CarouselMode = this.isGenerating
        ? this.apiSettings.carousel_auto_mode
        : "timed";
      this.setCarouselMode(targetMode, false, this.isGenerating);
    } else {
      this.setCarouselMode("manual", false, false);
    }
  }

  private syncLightboxView(scrollActiveThumb = true): void {
    if (!this.elLightbox.classList.contains("open")) return;
    const rec = this.gallery[this.activeGalleryIdx];
    if (!rec) return;
    if (this.elLightboxImg.src !== rec.objectUrl) {
      this.elLightboxImg.src = rec.objectUrl;
    }
    this.elLightboxMeta.textContent =
      `[${this.activeGalleryIdx + 1}/${this.gallery.length}] ${rec.filename}  (${rec.width}×${rec.height} · Seed ${rec.seed})`;

    this.elLightboxStrip.innerHTML = "";
    this.gallery.forEach((item, idx) => {
      const thumb = this.el("div", `film-thumb ${idx === this.activeGalleryIdx ? "active" : ""}`);
      const tImg = this.el("img");
      tImg.src = item.objectUrl;
      const lbl = this.el("div", "film-lbl", item.scene_id);
      thumb.append(tImg, lbl);
      thumb.addEventListener("click", () => {
        this.activeGalleryIdx = idx;
        this.renderGallery();
        this.syncLightboxView(true);
        if (this.carouselMode === "follow_latest" && idx < this.gallery.length - 1) {
          this.setCarouselMode("manual", false, false);
        } else if (this.carouselMode === "timed") {
          this.restartTimedInterval();
        }
      });
      this.elLightboxStrip.appendChild(thumb);
      if (scrollActiveThumb && idx === this.activeGalleryIdx) {
        thumb.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
      }
    });
  }

  private updateLightboxBatchStatus(): void {
    if (!this.elLightboxProgress || !this.elLightboxStopBatchBtn) return;
    const isBatchActive = Boolean(this.isGenerating && this.batchAbortCtrl);
    if (isBatchActive && this.batchProgressLabel) {
      this.elLightboxProgress.textContent = this.batchProgressLabel;
      this.elLightboxProgress.className = "lightbox-status-pill active";
      this.elLightboxStopBatchBtn.style.display = "";
    } else if (this.batchDoneLabel && this.elLightbox.classList.contains("open")) {
      this.elLightboxProgress.textContent = this.batchDoneLabel;
      this.elLightboxProgress.className = "lightbox-status-pill active done";
      this.elLightboxStopBatchBtn.style.display = "none";
    } else {
      this.elLightboxProgress.textContent = "";
      this.elLightboxProgress.className = "lightbox-status-pill";
      this.elLightboxStopBatchBtn.style.display = "none";
    }
  }

  private handleManualLightboxStep(delta: number): void {
    this.stepLightbox(delta);
    if (this.carouselMode === "follow_latest") {
      this.setCarouselMode("manual", false, false);
    } else if (this.carouselMode === "timed") {
      this.restartTimedInterval();
    }
  }

  private stepLightbox(delta: number): void {
    if (this.gallery.length === 0) return;
    const len = this.gallery.length;
    this.activeGalleryIdx = (this.activeGalleryIdx + delta + len) % len;
    this.renderGallery();
    this.syncLightboxView(true);
  }

  private clearCarouselTimer(): void {
    if (this.carouselTimer !== null) {
      window.clearInterval(this.carouselTimer);
      this.carouselTimer = null;
    }
  }

  private restartTimedInterval(): void {
    this.clearCarouselTimer();
    if (this.carouselMode !== "timed" || !this.elLightbox.classList.contains("open")) return;
    const sec = this.apiSettings.carousel_interval_sec || 4;
    this.carouselTimer = window.setInterval(() => {
      if (!this.elLightbox.classList.contains("open") || this.carouselMode !== "timed") {
        this.clearCarouselTimer();
        return;
      }
      if (this.gallery.length > 1) {
        this.stepLightbox(1);
      }
    }, sec * 1000);
  }

  private setCarouselMode(mode: CarouselMode, jumpLatest = true, persistPref = true): void {
    this.clearCarouselTimer();
    this.carouselMode = mode;

    if (persistPref && (mode === "follow_latest" || mode === "timed")) {
      this.apiSettings.carousel_auto_mode = mode;
      saveApiSettings(this.apiSettings);
    }

    if (mode === "follow_latest" && jumpLatest && this.gallery.length > 0) {
      this.activeGalleryIdx = this.gallery.length - 1;
      this.renderGallery();
      this.syncLightboxView(true);
    } else if (mode === "timed") {
      this.restartTimedInterval();
    }

    this.syncCarouselControlsUi();
  }

  private syncCarouselControlsUi(): void {
    const sec = this.apiSettings.carousel_interval_sec || 4;
    if (this.elLightboxFollowBtn) {
      const onFollow = this.carouselMode === "follow_latest";
      this.elLightboxFollowBtn.textContent = onFollow ? "📌 跟踪最新中" : "📌 跟踪最新";
      this.elLightboxFollowBtn.className = onFollow ? "btn-sm btn-green" : "btn-sm";
    }
    if (this.elLightboxPlayBtn) {
      const onTimed = this.carouselMode === "timed";
      this.elLightboxPlayBtn.textContent = onTimed ? `⏸️ 按秒轮播中 (${sec}s)` : "▶️ 按秒轮播";
      this.elLightboxPlayBtn.className = onTimed ? "btn-sm btn-green" : "btn-sm btn-blue";
    }
    for (const [val, btn] of this.elLightboxIntervalBtns.entries()) {
      btn.classList.toggle("active", val === sec);
    }
  }

  private async toggleNativeFullscreen(): Promise<void> {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await this.elLightbox.requestFullscreen();
      }
    } catch {
      // Ignore if browser blocks fullscreen API in local file context
    }
  }

  private closeLightbox(): void {
    if (this.isGenerating && this.batchAbortCtrl) {
      this.batchLightboxDismissed = true;
    }
    this.setCarouselMode("manual", false, false);
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
    }
    this.elLightbox.classList.remove("open");
  }
}
