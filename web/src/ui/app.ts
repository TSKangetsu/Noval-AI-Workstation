import {
  ALL_POSITIONS_CHAPTERS,
  BODY_PRESETS,
  BUILTIN_CHARACTERS,
  BUST_PRESETS,
  CAMERA_GAZE_PRESETS,
  CAMERA_QUICK_PRESETS,
  CAMERA_SHOT_PRESETS,
  CANVAS_PRESETS,
  EXPRESSION_BLUSH_PRESETS,
  EXPRESSION_EYE_PRESETS,
  EXPRESSION_MOUTH_PRESETS,
  EXPRESSION_PRESETS,
  LEGWEAR_PRESETS,
  MODULE_SWITCH_PRESETS,
  MORPH_PRESETS,
  MULTI_ANGLE_CHAPTERS,
  MULTI_ANGLE_TEMPLATES,
  MULTI_PANEL_MODE_PRESETS,
  OUTFIT_PRESETS,
  OUTFIT_STATE_PRESETS,
  PIGMENT_PRESETS,
  POS_CATEGORIES,
  POS_MALE_MODE_PRESETS,
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
  type CharacterConfig,
  type GeneratedImageRecord,
  type MultiPanelMode,
  type NaiApiSettings,
  type PerspectiveMode,
  type ScenePromptItem,
  type SubscriptionInfo,
} from "../engine/types";
import {
  detectImageExt,
  estimateV5MediumAnlas,
  fetchSubscriptionInfo,
  generateSingleImageV5Medium,
  NaiApiError,
  parseCanvasSize,
  upscaleSingleImageNai,
} from "../services/naiApiClient";
import {
  buildStoreZipBlob,
  formatDateYYYYMMDD,
  formatTimeHHMMSS,
  getMountedDirName,
  loadActiveConfig,
  loadApiSettings,
  loadCustomPresets,
  mountLocalOutputDirectory,
  saveActiveConfig,
  saveApiSettings,
  saveBytesToMountedDir,
  saveCustomPresets,
  supportsDirectoryPicker,
  triggerBlobDownload,
  triggerBytesDownload,
  triggerTextDownload,
  unmountLocalOutputDirectory,
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
  private carouselPlaying = false;
  private carouselFollowLatest = true;
  private batchProgressLabel = "";
  private batchDoneLabel = "";
  private autoCarouselCheckboxes: HTMLInputElement[] = [];
  private autoUpscaleCheckboxes: HTMLInputElement[] = [];

  private radarCtrl: CameraRadarCanvas | null = null;
  private logs: string[] = [];

  // Cached interactive elements
  private elPresetSelect!: HTMLSelectElement;
  private elExprCapsule!: HTMLButtonElement;
  private elExprPreviewBox!: HTMLElement;
  private elExprPresetPills: Map<string, HTMLButtonElement> = new Map();
  private elCamCapsule!: HTMLButtonElement;
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
  private elLightboxPlayBtn!: HTMLButtonElement;
  private elLightboxIntervalSel!: HTMLSelectElement;
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
    this.syncControlsFromConfig();
    this.refreshAllOutputs();
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
    this.autoCarouselCheckboxes = [];
    this.autoUpscaleCheckboxes = [];
    if (this.elLightbox && this.elLightbox.parentElement) {
      this.elLightbox.parentElement.removeChild(this.elLightbox);
    }

    // 1. HEADER BAR
    const header = this.el("header", "header-bar");
    const title = this.el("div", "header-title");
    title.append(
      this.el("span", "", "🎬"),
      this.el("span", "", "NovelAI V4.5 / V5 故事线 & 全体位工作台")
    );
    header.appendChild(title);

    const presetGrp = this.el("div", "header-group");
    presetGrp.appendChild(this.el("span", "hint-text", "角色预设:"));
    this.elPresetSelect = this.el("select");
    this.elPresetSelect.style.maxWidth = "230px";
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
    header.appendChild(presetGrp);

    // Perspective & Multi-panel controls
    const modeGrp = this.el("div", "header-group");
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
    header.appendChild(modeGrp);

    header.appendChild(this.el("div", "spacer"));

    // Top Expression Quick Capsule
    this.elExprCapsule = this.el("button", "cam-capsule", "😊 表情: 🔄 随本幕默认");
    this.elExprCapsule.title = "左键：跳转到「😊 表情」设置页 | 右键：一键复位为随本幕默认表情";
    this.elExprCapsule.addEventListener("click", () => this.switchLeftTab("tab-expr"));
    this.elExprCapsule.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.resetExpressionOverride();
    });
    header.appendChild(this.elExprCapsule);

    // Top 3D Camera Capsule
    this.elCamCapsule = this.el("button", "cam-capsule", "🎥 机位: 🔄 随本幕默认");
    this.elCamCapsule.title = "左键：跳转到「🎥 3D机位」设置页 | 右键：一键复位为随本幕默认机位";
    this.elCamCapsule.addEventListener("click", () => this.switchLeftTab("tab-camera"));
    this.elCamCapsule.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.resetCameraOverride();
    });
    header.appendChild(this.elCamCapsule);

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
    this.elLightboxPlayBtn = this.el("button", "btn-sm btn-blue", "▶️ 自动轮播");
    this.elLightboxPlayBtn.title = "快捷键：空格 (Space)";
    this.elLightboxPlayBtn.addEventListener("click", () => {
      if (this.carouselPlaying) this.stopCarousel();
      else this.startCarousel(false);
    });

    this.elLightboxIntervalSel = this.el("select");
    this.elLightboxIntervalSel.title = "全屏自动轮播切图间隔";
    const intervalOpts: Array<[number, string]> = [
      [2, "轮播 2秒/张"],
      [3, "轮播 3秒/张"],
      [4, "轮播 4秒/张"],
      [6, "轮播 6秒/张"],
      [8, "轮播 8秒/张"],
      [0, "仅跟进最新出图"],
    ];
    for (const [sec, txt] of intervalOpts) {
      const opt = this.el("option", "", txt);
      opt.value = String(sec);
      if (sec === (this.apiSettings.carousel_interval_sec ?? 4)) opt.selected = true;
      this.elLightboxIntervalSel.appendChild(opt);
    }
    this.elLightboxIntervalSel.addEventListener("change", () => {
      const v = parseInt(this.elLightboxIntervalSel.value, 10);
      this.apiSettings.carousel_interval_sec = Number.isNaN(v) ? 4 : v;
      saveApiSettings(this.apiSettings);
      if (this.carouselPlaying) {
        this.restartCarouselTimer();
      }
    });

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
      this.elLightboxPlayBtn,
      this.elLightboxIntervalSel,
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
      this.carouselFollowLatest = false;
      this.stepLightbox(-1);
      this.restartCarouselTimer();
    });
    const btnNext = this.el("button", "lightbox-nav-btn next", "▶");
    btnNext.title = "下一张 (→)";
    btnNext.addEventListener("click", (e) => {
      e.stopPropagation();
      this.stepLightbox(1);
      this.restartCarouselTimer();
    });

    this.elLightboxBody = this.el("div", "lightbox-body checkerboard");
    this.elLightboxImg = this.el("img");
    this.elLightboxImg.addEventListener("click", () => {
      this.lightboxZoom1x = !this.lightboxZoom1x;
      this.elLightboxImg.classList.toggle("zoomed-1x", this.lightboxZoom1x);
    });
    this.elLightboxBody.appendChild(this.elLightboxImg);
    lbStage.append(btnPrev, this.elLightboxBody, btnNext);

    this.elLightboxStrip = this.el("div", "lightbox-filmstrip");
    this.elLightbox.append(lbBar, lbStage, this.elLightboxStrip);
    document.body.appendChild(this.elLightbox);

    window.addEventListener("keydown", (e) => {
      if (!this.elLightbox.classList.contains("open")) return;
      if (e.key === "Escape") {
        this.closeLightbox();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        this.carouselFollowLatest = false;
        this.stepLightbox(-1);
        this.restartCarouselTimer();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        this.stepLightbox(1);
        this.restartCarouselTimer();
      } else if (e.key === " ") {
        e.preventDefault();
        if (this.carouselPlaying) this.stopCarousel();
        else this.startCarousel(false);
      }
    });
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
      this.makeCheckboxRow("add_cat_ears", "🐱 猫耳 (cat ears, animal ear fluff)"),
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
          this.apiSettings.scale = 6.0;
          this.apiSettings.cfg_rescale = 0.0;
          saveApiSettings(this.apiSettings);
          this.syncApiInputs();
        }
      }),
      this.makeInputRow("custom_style_pos", "自定义画风正向（选自定义画风时生效）", "正向笔触/光影标签..."),
      this.makeInputRow("custom_style_neg", "自定义画风负向（选自定义画风时生效）", "负向屏蔽标签...")
    );
    pStyle.appendChild(cardSt);

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

    const cardParams = this.el("div", "field-card");
    cardParams.appendChild(this.el("div", "field-card-title", "⚙️ V5 Full Medium 生图参数（14 步 · k_euler_ancestral）"));

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

    const gridSC = this.el("div", "grid-2");
    const scaleRow = this.el("div", "field-row");
    const scaleLbl = this.el("label", "lbl", `Guidance Scale: ${this.apiSettings.scale.toFixed(1)}`);
    scaleLbl.id = "api-scale-lbl";
    const scaleInp = this.el("input");
    scaleInp.id = "api-scale-input";
    scaleInp.type = "range";
    scaleInp.min = "1";
    scaleInp.max = "10";
    scaleInp.step = "0.1";
    scaleInp.value = String(this.apiSettings.scale);
    scaleInp.addEventListener("input", () => {
      this.apiSettings.scale = parseFloat(scaleInp.value);
      scaleLbl.textContent = `Guidance Scale: ${this.apiSettings.scale.toFixed(1)}`;
      saveApiSettings(this.apiSettings);
    });
    scaleRow.append(scaleLbl, scaleInp);

    const rescaleRow = this.el("div", "field-row");
    const rescaleLbl = this.el("label", "lbl", `CFG Rescale: ${this.apiSettings.cfg_rescale.toFixed(2)}`);
    rescaleLbl.id = "api-rescale-lbl";
    const rescaleInp = this.el("input");
    rescaleInp.id = "api-rescale-input";
    rescaleInp.type = "range";
    rescaleInp.min = "0";
    rescaleInp.max = "1";
    rescaleInp.step = "0.05";
    rescaleInp.value = String(this.apiSettings.cfg_rescale);
    rescaleInp.addEventListener("input", () => {
      this.apiSettings.cfg_rescale = parseFloat(rescaleInp.value);
      rescaleLbl.textContent = `CFG Rescale: ${this.apiSettings.cfg_rescale.toFixed(2)}`;
      saveApiSettings(this.apiSettings);
    });
    rescaleRow.append(rescaleLbl, rescaleInp);
    gridSC.append(scaleRow, rescaleRow);
    cardParams.appendChild(gridSC);

    const seedRow = this.el("div", "field-row");
    seedRow.appendChild(this.el("label", "lbl", "固定 Seed（-1 为每次随机）"));
    const seedWrap = this.el("div", "header-group");
    const seedInp = this.el("input");
    seedInp.id = "api-seed-input";
    seedInp.type = "number";
    seedInp.style.width = "140px";
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
    cbQual.type = "checkbox";
    cbQual.checked = this.apiSettings.append_v5_quality;
    cbQual.addEventListener("change", () => {
      this.apiSettings.append_v5_quality = cbQual.checked;
      saveApiSettings(this.apiSettings);
    });
    chkQual.append(cbQual, document.createTextNode("无质量词时自动追加 V5 标准质量后缀"));
    cardParams.appendChild(chkQual);

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

    panel.append(cardConn, cardParams, cardDisk, cardRun);
  }

  private buildRightPane(): HTMLElement {
    const right = this.el("main", "right-pane");

    // RIGHT TOP: 3 SUITE TABS
    const rTop = this.el("section", "right-top");
    const suiteBar = this.el("div", "tab-bar");
    const sTabs: Array<["story" | "multi_angle" | "all_pos", string]> = [
      ["story", "📖 剧情故事线 (F00+S00~S11)"],
      ["multi_angle", "🎥 角色多角度套图 (MA0~MA8)"],
      ["all_pos", "🔞 全体位生成器 (44式 · 透明背景 · 男方开关)"],
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
    const tb = this.el("div", "suite-toolbar");

    const transLbl = this.el("label", "check-row");
    const transCb = this.el("input");
    transCb.type = "checkbox";
    transCb.checked = this.cfg.pos_transparent_bg;
    transCb.addEventListener("change", () => {
      this.cfg.pos_transparent_bg = transCb.checked;
      this.saveCfgAndRefresh();
    });
    this.formBindings.set("pos_transparent_bg", transCb);
    transLbl.append(transCb, document.createTextNode("🫧 V5透明背景"));

    const maleSel = this.el("select");
    maleSel.style.maxWidth = "210px";
    for (const k of Object.keys(POS_MALE_MODE_PRESETS)) {
      const opt = this.el("option", "", k);
      opt.value = k;
      if (k === this.cfg.pos_male_mode) opt.selected = true;
      maleSel.appendChild(opt);
    }
    maleSel.addEventListener("change", () => {
      this.cfg.pos_male_mode = maleSel.value;
      this.saveCfgAndRefresh();
    });
    this.formBindings.set("pos_male_mode", maleSel);

    const penisLbl = this.el("label", "check-row");
    const penisCb = this.el("input");
    penisCb.type = "checkbox";
    penisCb.checked = this.cfg.pos_show_penis;
    penisCb.addEventListener("change", () => {
      this.cfg.pos_show_penis = penisCb.checked;
      this.saveCfgAndRefresh();
    });
    this.formBindings.set("pos_show_penis", penisCb);
    penisLbl.append(penisCb, document.createTextNode("显示男方器官"));

    const stageSel = this.el("select");
    stageSel.title = "选择全体位生成器的射精阶段（射精前/射精中内射/射精后结合溢流/事后拔出拉丝）";
    stageSel.style.maxWidth = "230px";
    for (const k of Object.keys(POS_STAGE_PRESETS)) {
      const opt = this.el("option", "", k);
      opt.value = k;
      if (k === this.cfg.pos_stage) opt.selected = true;
      stageSel.appendChild(opt);
    }
    stageSel.addEventListener("change", () => {
      this.cfg.pos_stage = stageSel.value;
      this.saveCfgAndRefresh();
    });
    this.formBindings.set("pos_stage", stageSel);

    const searchInp = this.el("input");
    searchInp.type = "text";
    searchInp.placeholder = "🔍 搜索体位关键词...";
    searchInp.style.width = "140px";
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

    tb.append(transLbl, maleSel, penisLbl, stageSel, searchInp, btnAllCat, btnNone, btnBatch);
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

    const tb = this.el("div", "header-group");
    tb.style.marginBottom = "6px";

    this.elSingleSelect = this.el("select");
    this.elSingleSelect.style.maxWidth = "260px";
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

    const tb = this.el("div", "header-group");
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
      this.openLightbox(rec, true);
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

    tb.append(
      this.elPreviewMeta,
      spacer,
      chkGalleryCarousel,
      chkGalleryUpscale,
      btnFullscreenPlay,
      btnChecker,
      btnUpscale,
      btnDownloadOne,
      btnZipAll
    );
    wrap.appendChild(tb);

    this.elPreviewStage = this.el("div", "preview-stage checkerboard");
    this.elPreviewStage.appendChild(this.el("span", "hint-text", "等待 NovelAI V5 生成图片..."));
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
    this.syncExpressionDisplays();
    this.syncCameraDisplays();
  }

  private syncApiInputs(): void {
    const scaleInp = document.getElementById("api-scale-input") as HTMLInputElement | null;
    const scaleLbl = document.getElementById("api-scale-lbl");
    const rescaleInp = document.getElementById("api-rescale-input") as HTMLInputElement | null;
    const rescaleLbl = document.getElementById("api-rescale-lbl");
    if (scaleInp) scaleInp.value = String(this.apiSettings.scale);
    if (scaleLbl) scaleLbl.textContent = `Guidance Scale: ${this.apiSettings.scale.toFixed(1)}`;
    if (rescaleInp) rescaleInp.value = String(this.apiSettings.cfg_rescale);
    if (rescaleLbl) rescaleLbl.textContent = `CFG Rescale: ${this.apiSettings.cfg_rescale.toFixed(2)}`;
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

  private switchLeftTab(tabId: string): void {
    this.activeLeftTab = tabId;
    this.root.querySelectorAll("[data-tab-id]").forEach((b) => {
      b.classList.toggle("active", (b as HTMLElement).dataset.tabId === tabId);
    });
    this.root.querySelectorAll("[data-panel-id]").forEach((p) => {
      p.classList.toggle("active", (p as HTMLElement).dataset.panelId === tabId);
    });
  }

  private switchSuiteTab(suiteId: "story" | "multi_angle" | "all_pos"): void {
    this.activeSuiteTab = suiteId;
    this.root.querySelectorAll("[data-suite-id]").forEach((b) => {
      b.classList.toggle("active", (b as HTMLElement).dataset.suiteId === suiteId);
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
      b.classList.toggle("active", (b as HTMLElement).dataset.outTabId === outTabId);
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

  private updateCostHint(): void {
    if (!this.elCostHint) return;
    const activeItem = this.currentSceneItems[this.activeSubVariantIdx];
    const hint = activeItem?.canvas || "竖图 832x1216";
    const [w, h] = parseCanvasSize(hint, this.apiSettings.canvas_preset);
    const rawEst = estimateV5MediumAnlas(w, h, 14, false);
    const isOpusFree = Boolean(
      this.subInfo &&
        this.subInfo.tier === 3 &&
        this.subInfo.active &&
        !this.subInfo.opus_usage_negative &&
        w * h <= 1048576
    );
    const upNote = this.apiSettings.auto_upscale_replace ? " + 自动2x放大 1 Anlas" : "";
    this.elCostHint.textContent = isOpusFree
      ? `📐 当前实际发送尺寸：${w} × ${h} | 单张预计消耗：0 Anlas（Opus 免点无限额度生效中 · 原价约 ${rawEst} Anlas）${upNote}`
      : `📐 当前实际发送尺寸：${w} × ${h} | 单张预计消耗：约 ${rawEst} Anlas（Opus 免费额度充足时为 0）${upNote}`;
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

    this.isGenerating = true;
    this.setStatus(`🎨 正在生成【${sceneFileTag} · ${safeMode}】(${w}x${h}, V5 Full Medium)...`);
    this.appendLog(`开始生成 ${sceneFileTag} (${w}x${h}, Seed=${this.apiSettings.seed})...`);

    try {
      const res = await generateSingleImageV5Medium({
        apiToken: this.apiSettings.api_token,
        promptText: promptToSend,
        width: w,
        height: h,
        scale: this.apiSettings.scale,
        cfgRescale: this.apiSettings.cfg_rescale,
        seed: this.apiSettings.seed,
        extraUc: this.apiSettings.extra_uc,
        appendV5Quality: this.apiSettings.append_v5_quality,
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

      const tempRecId = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const baseExt = detectImageExt(res.imageBytes);
      let finalName = `${sceneFileTag}_${safeMode}_s${res.seed}_${formatTimeHHMMSS()}${baseExt}`;

      if (this.apiSettings.auto_upscale_replace && res.width * res.height <= 1048576) {
        this.pushGalleryRecord({
          id: tempRecId,
          scene_id: sceneFileTag,
          mode_label: safeMode,
          filename: finalName,
          bytes: res.imageBytes,
          objectUrl: URL.createObjectURL(new Blob([res.imageBytes.slice()], { type: "image/png" })),
          seed: res.seed,
          width: res.width,
          height: res.height,
          elapsed_sec: res.elapsedSec,
          estimated_anlas: res.estimatedAnlas,
          created_at: Date.now(),
          saved_to_dir: false,
        });
        this.switchOutTab("out-image");
        this.setStatus(`🔎 已出图，正在立刻执行 2x Upscale 并移除原图...`);
        this.appendLog(`🔎 自动 2x Upscale: ${finalName} (${res.width}x${res.height})...`);

        try {
          const up = await upscaleSingleImageNai({
            apiToken: this.apiSettings.api_token,
            imageBytes: res.imageBytes,
          });
          this.removeGalleryRecordById(tempRecId);
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
          // Remove temp record before pushing saved final record cleanly
          this.removeGalleryRecordById(tempRecId);
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
    }
  }

  private onBatchGenerateCurrentSuite(): void {
    const ids = this.getActiveSuiteSelectedIds();
    this.runBatchForIds(ids, this.activeSuiteTab);
  }

  private async runBatchForIds(ids: string[], suiteKind: "story" | "multi_angle" | "all_pos"): Promise<void> {
    if (this.isGenerating) return;
    if (!this.apiSettings.api_token.trim()) {
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

    this.isGenerating = true;
    this.batchAbortCtrl = new AbortController();
    this.batchDoneLabel = "";
    this.batchProgressLabel = `⏳ 连出准备中 (0/${tasks.length})`;
    this.carouselFollowLatest = true;
    this.switchLeftTab("tab-api");
    this.switchOutTab("out-image");
    this.appendLog(`🚀 开始批量连出 ${tasks.length} 张 (${suiteKind}, ${safeMode}, 锁S00=${useS00})`);
    this.updateLightboxBatchStatus();
    if (this.apiSettings.auto_fullscreen_carousel && this.gallery.length > 0) {
      this.openLightbox(this.gallery[this.activeGalleryIdx] || this.gallery[this.gallery.length - 1], true);
    }

    const manifestLines: string[] = [
      `# NovelAI Workbench Batch Manifest (${new Date().toISOString()})`,
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
      this.setStatus(`⏳ [${i + 1}/${tasks.length}] 正在生成 ${t.sceneId} (Seed=${curSeed})...`);
      this.appendLog(`[${i + 1}/${tasks.length}] 请求 ${t.sceneId} (${t.width}x${t.height}, Seed=${curSeed})...`);

      let ok = false;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const res = await generateSingleImageV5Medium({
            apiToken: this.apiSettings.api_token,
            promptText: t.promptText,
            width: t.width,
            height: t.height,
            scale: this.apiSettings.scale,
            cfgRescale: this.apiSettings.cfg_rescale,
            seed: curSeed,
            extraUc: this.apiSettings.extra_uc,
            appendV5Quality: this.apiSettings.append_v5_quality,
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
            const tempId = `${Date.now()}_${i}_pre`;
            this.pushGalleryRecord({
              id: tempId,
              scene_id: t.sceneId,
              mode_label: safeMode,
              filename: baseName,
              bytes: res.imageBytes,
              objectUrl: URL.createObjectURL(new Blob([res.imageBytes.slice()], { type: "image/png" })),
              seed: res.seed,
              width: res.width,
              height: res.height,
              elapsed_sec: res.elapsedSec,
              estimated_anlas: res.estimatedAnlas,
              created_at: Date.now(),
              saved_to_dir: false,
            });
            this.batchProgressLabel = `🔎 正在 2x 放大 [${i + 1}/${tasks.length}] ${t.sceneId} (将移除原图)`;
            this.updateLightboxBatchStatus();
            this.setStatus(`🔎 [${i + 1}/${tasks.length}] 正在立刻执行 2x Upscale 并移除放大前原图...`);

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
            this.removeGalleryRecordById(tempId);
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
      this.switchLeftTab("tab-api");
      window.alert("请先填写 API Token！");
      return;
    }

    this.isGenerating = true;
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
    }
  }

  private pushGalleryRecord(rec: GeneratedImageRecord): void {
    this.gallery.push(rec);
    const latestIdx = this.gallery.length - 1;
    const isBatchActive = Boolean(this.isGenerating && this.batchAbortCtrl);
    const lightboxOpen = this.elLightbox.classList.contains("open");

    if (isBatchActive && this.apiSettings.auto_fullscreen_carousel && !lightboxOpen) {
      this.activeGalleryIdx = latestIdx;
      this.renderGallery();
      this.openLightbox(rec, true);
      return;
    }

    if (lightboxOpen) {
      if (this.carouselFollowLatest || isBatchActive) {
        this.activeGalleryIdx = latestIdx;
        this.carouselFollowLatest = true;
      }
      this.renderGallery();
      this.syncLightboxView();
      if (this.carouselPlaying) {
        this.restartCarouselTimer();
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
      this.elPreviewStage.appendChild(this.el("span", "hint-text", "等待 NovelAI V5 生成图片..."));
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

  private openLightbox(rec: GeneratedImageRecord, autoPlayCarousel = false): void {
    const idx = this.gallery.findIndex((g) => g.id === rec.id);
    if (idx >= 0) {
      this.activeGalleryIdx = idx;
    }
    this.lightboxZoom1x = false;
    this.elLightboxImg.classList.remove("zoomed-1x");
    this.elLightbox.classList.add("open");
    this.syncLightboxView();
    this.updateLightboxBatchStatus();
    if (autoPlayCarousel) {
      this.startCarousel(true);
    } else {
      this.stopCarousel();
    }
  }

  private syncLightboxView(): void {
    if (!this.elLightbox.classList.contains("open")) return;
    const rec = this.gallery[this.activeGalleryIdx];
    if (!rec) return;
    this.elLightboxImg.src = rec.objectUrl;
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
        this.carouselFollowLatest = idx === this.gallery.length - 1;
        this.renderGallery();
        this.syncLightboxView();
        this.restartCarouselTimer();
      });
      this.elLightboxStrip.appendChild(thumb);
      if (idx === this.activeGalleryIdx) {
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

  private stepLightbox(delta: number): void {
    if (this.gallery.length === 0) return;
    const len = this.gallery.length;
    this.activeGalleryIdx = (this.activeGalleryIdx + delta + len) % len;
    this.renderGallery();
    this.syncLightboxView();
  }

  private startCarousel(followLatest: boolean): void {
    this.carouselPlaying = true;
    this.carouselFollowLatest = followLatest;
    if (this.elLightboxPlayBtn) {
      this.elLightboxPlayBtn.textContent = "⏸️ 轮播中";
      this.elLightboxPlayBtn.className = "btn-sm btn-green";
    }
    this.restartCarouselTimer();
  }

  private stopCarousel(): void {
    this.carouselPlaying = false;
    if (this.carouselTimer !== null) {
      window.clearInterval(this.carouselTimer);
      this.carouselTimer = null;
    }
    if (this.elLightboxPlayBtn) {
      this.elLightboxPlayBtn.textContent = "▶️ 自动轮播";
      this.elLightboxPlayBtn.className = "btn-sm btn-blue";
    }
  }

  private restartCarouselTimer(): void {
    if (this.carouselTimer !== null) {
      window.clearInterval(this.carouselTimer);
      this.carouselTimer = null;
    }
    if (!this.carouselPlaying || !this.elLightbox.classList.contains("open")) return;
    const sec = this.apiSettings.carousel_interval_sec ?? 4;
    if (sec <= 0) return; // "仅跟进最新出图" mode
    this.carouselTimer = window.setInterval(() => {
      if (!this.elLightbox.classList.contains("open")) {
        this.stopCarousel();
        return;
      }
      if (this.gallery.length > 1) {
        this.stepLightbox(1);
      }
    }, sec * 1000);
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
    this.stopCarousel();
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
    }
    this.elLightbox.classList.remove("open");
  }
}
