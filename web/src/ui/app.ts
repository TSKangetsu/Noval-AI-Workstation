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
  normalizeLightingPresetName,
  OTHER_ACTION_CHAPTERS,
  OTHER_ACTION_TEMPLATES,
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
  buildStageProgressionQueue,
  describeExpressionShort,
  formatStageBadgeLabel,
  formatStageFileTag,
  generateScenePrompts,
  isC5LowresPixelStyleActive,
  isExpressionOverrideActive,
  ORDERED_POS_STAGE_ENTRIES,
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
  type GalleryFilterMode,
  type GalleryFolderItem,
  type GalleryStageViewMode,
  type GeneratedConfigSnapshot,
  type GeneratedImageRecord,
  type NaiApiSettings,
  type NaiModelId,
  type NaiUcPresetMode,
  type ScenePromptItem,
  type StageProgressionMode,
  type StoredVibeItem,
  type SubscriptionInfo,
  type VibeTransferSlotInput,
} from "../engine/types";
import {
  detectImageExt,
  encodeVibeImageNai,
  estimateNaiAnlas,
  fetchSubscriptionInfo,
  formatOpusBatterySummary,
  generateSingleImageNai,
  parseCanvasSize,
  uint8ArrayToBase64,
  upscaleSingleImageNai,
} from "../services/naiApiClient";
import {
  buildGalleryFolderSummaries,
  hasEffectiveGallerySelector,
  selectGalleryRecordIndices,
  type GalleryFileSelector,
} from "../services/galleryFileHelpers";
import {
  McpBridgeClient,
  type McpBridgeStatus,
} from "../services/mcpBridgeClient";
import {
  buildStoreZipBlob,
  clearDeletedPresets,
  clearStoredVibeItems,
  deleteDirectoryFromMountedDir,
  deleteFileFromMountedDir,
  formatDateYYYYMMDD,
  formatTimeHHMMSS,
  getMountedDirName,
  loadActiveConfig,
  loadApiSettings,
  loadCustomPresets,
  loadDeletedPresets,
  loadMcpBridgeEnabled,
  loadMcpBridgeEndpoint,
  loadStarredGalleryRecords,
  loadStoredVibeItems,
  markPresetDeleted,
  mountLocalOutputDirectory,
  moveFileInMountedDir,
  resolveRecordDiskSubpath,
  sanitizeSubfolderName,
  saveActiveConfig,
  saveApiSettings,
  saveBytesToMountedDir,
  saveCustomPresets,
  saveMcpBridgeEnabled,
  saveMcpBridgeEndpoint,
  saveStarredGalleryRecords,
  saveStoredVibeItems,
  supportsDirectoryPicker,
  syncPromptsLogToMountedDir,
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

export const EXPECTED_FILM_TOOLBAR_W = 680; // ~310px filter controls + ~370px 6 batch buttons
export const EXPECTED_DUAL_STACK_H = 882; // 52px stage toolbar + 300px min usable hero image + 270px expanded gallery + 260px expanded prompt

export function computePortraitCompactStage(params: {
  winW: number;
  winH: number;
  colW: number;
  colH: number;
  wasCompact?: boolean;
  lastCompactWinW?: number;
  isTextInputFocused?: boolean;
}): boolean {
  const {
    winW,
    winH,
    colW,
    colH,
    wasCompact = false,
    lastCompactWinW = 0,
    isTextInputFocused = false,
  } = params;
  // Landscape Guard: ANY real landscape orientation (desktop, laptop, tablet landscape, phone landscape) -> false!
  if (winW >= winH) {
    if (
      wasCompact &&
      isTextInputFocused &&
      winW < EXPECTED_FILM_TOOLBAR_W &&
      Math.abs(winW - lastCompactWinW) <= 2
    ) {
      return true;
    }
    return false;
  }
  return colW < EXPECTED_FILM_TOOLBAR_W && colH < EXPECTED_DUAL_STACK_H + 40;
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
  private activeOtherCategory = "全部";
  private otherSearchQuery = "";
  private checkedOtherActionIds = new Set<string>(["SF01"]);

  private currentSceneItems: ScenePromptItem[] = [];
  private isManualPromptEdited = false;
  private promptDrawerExpanded = false;
  private promptFocusMode: "both" | "pos" | "neg" = "both";
  private isPortraitCompactStage = false;
  private lastCompactWinW = 0;
  private collapsedPromptBarH = 44;
  private collapsedFilmstripBarH = 86;
  private portraitFilmOverlayCustomH: number | null = null;
  private portraitPromptOverlayCustomH: number | null = null;
  private colCenterResizeObserver: ResizeObserver | null = null;
  private restoreDesktopFilmstripHeight: (() => void) | null = null;
  private restoreDesktopPromptDrawerHeight: (() => void) | null = null;
  private showCustomOutfitExtra = false;
  private checkerboardBg = false;
  private mobileCol: "left" | "center" | "right" = "center";

  private vibeItems: StoredVibeItem[] = [];
  private gallery: GeneratedImageRecord[] = [];
  private selectedGalleryIdx = -1;
  private checkedGalleryIds = new Set<string>();
  private lastClickedGalleryId: string | null = null;
  private galleryFilterMode: GalleryFilterMode = "all";
  private gallerySceneFilter = "";
  private filmstripExpanded = false;
  private galleryFolders: GalleryFolderItem[] = [];
  private openedFolderName: string | null = null;
  private pinnedTargetFolderName: string | null = null;
  private organizerLeftPoolMode: "ungrouped" | "all" = "ungrouped";
  private draggingRecordIds: string[] = [];
  private stageViewMode: GalleryStageViewMode = "single";
  private comparePairIds: [string, string] = ["", ""];
  private compareFitOneToOne = false;
  private rerollCountPerRound = 2;
  private shootoutState: {
    anchorId: string;
    candidateIds: string[];
  } | null = null;

  // Position Library Progressive Stage Generation State
  private progSelectedStageCodes = new Set<string>(["before", "during", "after_inside", "pull_out"]);
  private progMode: StageProgressionMode = "per_pose_chain";
  private progLockSeedPerPose = true;
  private progAutoGroupFolder = true;
  private elProgFirstBtn: HTMLButtonElement | null = null;
  private elProgContinueBtn: HTMLButtonElement | null = null;
  private elProgRunBtn: HTMLButtonElement | null = null;

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
  private elLeftPresetSelect: HTMLSelectElement | null = null;
  private elLeftDeletePresetBtn: HTMLButtonElement | null = null;
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
  private elMobileNavLabels = new Map<string, HTMLElement>();
  private elMobileNavBadges = new Map<string, HTMLElement>();
  private elMobileQuickGenBtn!: HTMLButtonElement;
  private elMobileStepsSelect!: HTMLSelectElement;
  private elMobileUpscaleBtn!: HTMLButtonElement;

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
  private elFilmFilterBtns = new Map<GalleryFilterMode, HTMLButtonElement>();
  private elFilmSceneSelect!: HTMLSelectElement;
  private elFilmExpandBtn!: HTMLButtonElement;
  private elBatchMoveFolderSelect!: HTMLSelectElement;
  private elBatchUpscaleGalleryBtn!: HTMLButtonElement;
  private elBatchDeleteGalleryBtn!: HTMLButtonElement;
  private elUpscaleBtn!: HTMLButtonElement;
  private elStarCurBtn!: HTMLButtonElement;
  private elRerollCurBtn!: HTMLButtonElement;
  private elRerollCountSelect!: HTMLSelectElement;
  private elRestoreTriggerBtn!: HTMLButtonElement;
  private elRestorePopover!: HTMLElement;
  private elStageGridBtn!: HTMLButtonElement;
  private elStageCompareBtn!: HTMLButtonElement;
  private elDeleteCurBtn!: HTMLButtonElement;
  private elAutoUpscaleBtn!: HTMLButtonElement;
  private elAutoCarouselBtn!: HTMLButtonElement;

  // Prompt Drawer Refs
  private elPromptDrawer!: HTMLElement;
  private elPromptDrawerBody!: HTMLElement;
  private elPromptFocusBtns = new Map<"both" | "pos" | "neg", HTMLButtonElement>();
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
  private elLightboxStarBtn!: HTMLButtonElement;
  private elLightboxModeBtns = new Map<CarouselMode, HTMLButtonElement>();

  // Syncable form bindings
  private syncHooks: Array<() => void> = [];

  constructor(root: HTMLElement) {
    this.root = root;
    this.cfg = loadActiveConfig();
    this.customPresets = loadCustomPresets();
    this.apiSettings = loadApiSettings();
    // Session-incremental folders only: never auto-resurrect stale folders from prior sessions on page refresh
    this.galleryFolders = [];
    this.carouselMode = this.apiSettings.carousel_auto_mode || "follow_latest";
    this.showCustomOutfitExtra = Boolean(this.cfg.custom_outfit_tags.trim());
  }

  public async mount(): Promise<void> {
    initT5Tokenizer();
    this.vibeItems = await loadStoredVibeItems();
    const persistedStarred = await loadStarredGalleryRecords();
    if (persistedStarred.length > 0) {
      // Keep prior folders hidden across refreshes (incremental-only); clear stale group_folder tags in memory
      // while preserving disk_subpath so persisted starred items remain visible in the ungrouped pool.
      for (const rec of persistedStarred) {
        rec.group_folder = undefined;
      }
      this.gallery = persistedStarred;
      this.selectedGalleryIdx = persistedStarred.length - 1;
    }
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
    if (this.gallery.length > 0 || this.galleryFolders.length > 0) {
      this.renderHeroViewport();
      this.renderFilmstrip();
    }

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

    // 3. Mobile Bottom Tab Bar (< 1120px) + Thumb-Reachable Quick Generate CTA
    const mobileNav = this.el("nav", "mobile-col-nav");
    const mTabs: Array<["left" | "center" | "right", string, string]> = [
      ["left", "👤 人设·画风", "V4.5"],
      ["center", "🖼️ 主画布", "0张"],
      ["right", "🔞 动作库", "P01"],
    ];
    this.elMobileBtns.clear();
    this.elMobileNavLabels.clear();
    this.elMobileNavBadges.clear();
    for (const [colKey, label, initBadge] of mTabs) {
      const b = this.el(
        "button",
        `btn btn-xs mobile-nav-tab${this.mobileCol === colKey ? " btn-primary active" : ""}`
      );
      const lblSpan = this.el("span", "mnav-label", label);
      const badgeSpan = this.el(
        "span",
        `mnav-badge${colKey === "right" ? " mnav-pose-badge" : ""}`,
        initBadge
      );
      b.append(lblSpan, badgeSpan);
      b.addEventListener("click", () => {
        this.mobileCol = colKey;
        this.syncMobileColumns();
      });
      this.elMobileBtns.set(colKey, b);
      this.elMobileNavLabels.set(colKey, lblSpan);
      this.elMobileNavBadges.set(colKey, badgeSpan);
      mobileNav.appendChild(b);
    }

    this.elMobileQuickGenBtn = this.el(
      "button",
      "btn btn-generate-hero mobile-quick-gen-btn",
      "⚡ 生成"
    );
    this.elMobileQuickGenBtn.title = "单手快捷生图（正在生图时点击停止）";
    this.elMobileQuickGenBtn.addEventListener("click", () => {
      if (this.isGenerating) {
        this.abortController?.abort();
        return;
      }
      this.elHeroGenBtn.click();
    });
    mobileNav.appendChild(this.elMobileQuickGenBtn);
    this.root.appendChild(mobileNav);

    // 4. Floating Popovers & Lightbox
    this.elMcpPopover = this.buildMcpPopover();
    this.elSavePresetPopover = this.buildSavePresetPopover();
    this.elExprPopover = this.buildExpressionPopover();
    this.elRestorePopover = this.buildRestoreRecordPopover();
    this.elLightbox = this.buildLightbox();
    this.root.append(
      this.elMcpPopover,
      this.elSavePresetPopover,
      this.elExprPopover,
      this.elRestorePopover,
      this.elLightbox
    );

    this.syncMobileColumns();
    if (this.colCenterResizeObserver) {
      this.colCenterResizeObserver.disconnect();
    }
    if (typeof ResizeObserver !== "undefined") {
      this.colCenterResizeObserver = new ResizeObserver(() => {
        this.evaluateCenterStageSpaceBudget();
      });
      this.colCenterResizeObserver.observe(this.elColCenter);
    }
    this.evaluateCenterStageSpaceBudget();
  }

  private syncMobileColumns(): void {
    this.root.dataset.mobileCol = this.mobileCol;
    this.elColLeft.classList.toggle("mobile-active", this.mobileCol === "left");
    this.elColCenter.classList.toggle("mobile-active", this.mobileCol === "center");
    this.elColRight.classList.toggle("mobile-active", this.mobileCol === "right");
    for (const [k, btn] of this.elMobileBtns.entries()) {
      const isAct = k === this.mobileCol;
      btn.classList.toggle("btn-primary", isAct);
      btn.classList.toggle("active", isAct);
    }
    this.syncMobileNavState();
    this.evaluateCenterStageSpaceBudget();
  }

  private snapshotCollapsedBarHeights(): void {
    if (!this.elColCenter) return;
    if (this.elPromptDrawer && !this.promptDrawerExpanded) {
      const measuredPromptH = this.elPromptDrawer.offsetHeight;
      if (measuredPromptH > 0) {
        this.collapsedPromptBarH = measuredPromptH;
      } else if (this.isPortraitCompactStage) {
        this.collapsedPromptBarH = Math.max(this.collapsedPromptBarH, 56);
      }
    }
    if (
      this.elFilmstripBar &&
      !this.filmstripExpanded &&
      !this.elFilmstripBar.classList.contains("hidden")
    ) {
      const measuredFilmH = this.elFilmstripBar.offsetHeight;
      if (measuredFilmH > 0) {
        this.collapsedFilmstripBarH = measuredFilmH;
      }
    }
    this.elColCenter.style.setProperty(
      "--collapsed-prompt-bar-h",
      `${this.collapsedPromptBarH}px`
    );
    const filmReserve =
      this.elFilmstripBar && !this.elFilmstripBar.classList.contains("hidden")
        ? this.collapsedFilmstripBarH
        : 0;
    this.elColCenter.style.setProperty("--collapsed-filmstrip-h", `${filmReserve}px`);
  }

  private syncPortraitOverlayState(): void {
    if (!this.elColCenter || !this.elFilmstripBar || !this.elPromptDrawer) return;
    if (!this.isPortraitCompactStage) {
      this.elColCenter.classList.remove(
        "has-film-overlay",
        "has-prompt-overlay",
        "has-visible-filmstrip"
      );
      this.elFilmstripBar.classList.remove("has-custom-h");
      this.elPromptDrawer.classList.remove("has-custom-h");
      this.elFilmstripBar.style.removeProperty("--portrait-film-overlay-h");
      this.elPromptDrawer.style.removeProperty("--portrait-prompt-overlay-h");
      return;
    }

    const hasVisibleFilm = !this.elFilmstripBar.classList.contains("hidden");
    this.elColCenter.classList.toggle("has-visible-filmstrip", hasVisibleFilm);
    this.elColCenter.classList.toggle("has-film-overlay", this.filmstripExpanded);
    this.elColCenter.classList.toggle("has-prompt-overlay", this.promptDrawerExpanded);
    this.elColCenter.style.setProperty(
      "--collapsed-prompt-bar-h",
      `${this.collapsedPromptBarH}px`
    );
    this.elColCenter.style.setProperty(
      "--collapsed-filmstrip-h",
      `${hasVisibleFilm ? this.collapsedFilmstripBarH : 0}px`
    );

    const containerH =
      this.elColCenter.clientHeight || Math.max(320, window.innerHeight - 140);

    if (this.filmstripExpanded && this.portraitFilmOverlayCustomH !== null) {
      const maxFilmH = Math.max(180, containerH - this.collapsedPromptBarH);
      const effFilmH = Math.max(130, Math.min(maxFilmH, this.portraitFilmOverlayCustomH));
      this.elFilmstripBar.classList.add("has-custom-h");
      this.elFilmstripBar.style.setProperty("--portrait-film-overlay-h", `${effFilmH}px`);
    } else {
      this.elFilmstripBar.classList.remove("has-custom-h");
      this.elFilmstripBar.style.removeProperty("--portrait-film-overlay-h");
    }

    if (this.promptDrawerExpanded && this.portraitPromptOverlayCustomH !== null) {
      const maxPromptH = Math.max(180, containerH);
      const effPromptH = Math.max(130, Math.min(maxPromptH, this.portraitPromptOverlayCustomH));
      this.elPromptDrawer.classList.add("has-custom-h");
      this.elPromptDrawer.style.setProperty("--portrait-prompt-overlay-h", `${effPromptH}px`);
    } else {
      this.elPromptDrawer.classList.remove("has-custom-h");
      this.elPromptDrawer.style.removeProperty("--portrait-prompt-overlay-h");
    }
  }

  private evaluateCenterStageSpaceBudget(): void {
    if (!this.elColCenter) return;
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    const colW = this.elColCenter.clientWidth || winW;
    const colH = this.elColCenter.clientHeight || Math.max(240, winH - 140);
    const activeEl = document.activeElement as HTMLElement | null;
    const isTextInputFocused = Boolean(
      activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")
    );

    const nextCompact = computePortraitCompactStage({
      winW,
      winH,
      colW,
      colH,
      wasCompact: this.isPortraitCompactStage,
      lastCompactWinW: this.lastCompactWinW,
      isTextInputFocused,
    });
    if (nextCompact && winH > winW) {
      this.lastCompactWinW = winW;
    }

    const changed = nextCompact !== this.isPortraitCompactStage;
    this.isPortraitCompactStage = nextCompact;
    this.elColCenter.classList.toggle("portrait-compact-stage", this.isPortraitCompactStage);

    if (!this.isPortraitCompactStage) {
      this.syncPortraitOverlayState();
      if (changed) {
        this.restoreDesktopFilmstripHeight?.();
        this.restoreDesktopPromptDrawerHeight?.();
        this.renderFilmstrip();
      }
      return;
    }

    // Strict mutual exclusion if both drawers were open before entering portrait-compact-stage
    if (this.filmstripExpanded && this.promptDrawerExpanded) {
      this.togglePromptDrawer(false);
    }

    this.snapshotCollapsedBarHeights();
    this.syncPortraitOverlayState();
    if (changed) {
      this.renderFilmstrip();
    }
  }

  private setFilmstripExpanded(
    expanded: boolean,
    customOverlayH?: number | null
  ): void {
    if (expanded) {
      this.snapshotCollapsedBarHeights();
      if (this.isPortraitCompactStage) {
        if (this.promptDrawerExpanded) {
          this.togglePromptDrawer(false);
        }
        this.portraitFilmOverlayCustomH =
          customOverlayH !== undefined ? customOverlayH : null;
      }
    }
    this.filmstripExpanded = expanded;
    this.renderFilmstrip();
    this.syncPortraitOverlayState();
  }

  private syncMobileNavState(): void {
    const isV45 = this.apiSettings.model === MODEL_V4_5_FULL;
    const leftLbl = this.elMobileNavLabels.get("left");
    if (leftLbl) {
      leftLbl.textContent = isV45 ? "👤 人设·Vibe" : "👤 人设·画风";
    }
    const leftBadge = this.elMobileNavBadges.get("left");
    if (leftBadge) {
      const gMode = this.cfg.gender_mode ?? "normal";
      const gTag =
        gMode === "femboy"
          ? "伪娘"
          : gMode === "futa_no_balls" || gMode === "futa_with_balls"
            ? "扶他"
            : "";
      const mShort = isV45
        ? "V4.5"
        : this.apiSettings.model === MODEL_V5_FULL
          ? "V5H"
          : "V5M";
      leftBadge.textContent = gTag ? `${mShort}·${gTag}` : mShort;
    }

    const centerBadge = this.elMobileNavBadges.get("center");
    if (centerBadge) {
      const cnt = this.gallery.length;
      centerBadge.textContent = `${cnt}张`;
      centerBadge.classList.toggle("has-count", cnt > 0);
    }

    const rightBadge = this.elMobileNavBadges.get("right");
    if (rightBadge) {
      const poseCode = this.actionMode === "free" ? "FREE" : this.activeSceneId || "P01";
      rightBadge.textContent = poseCode;
    }

    if (this.elMobileQuickGenBtn) {
      const showQuickCta = this.mobileCol !== "center" || this.isGenerating;
      this.elMobileQuickGenBtn.classList.toggle("hidden-on-stage", !showQuickCta);
      this.elMobileQuickGenBtn.classList.toggle("is-stopping", this.isGenerating);
      const batch = this.apiSettings.batch_count || 1;
      this.elMobileQuickGenBtn.textContent = this.isGenerating
        ? "⏹"
        : batch > 1
          ? `⚡×${batch}`
          : "⚡";
      this.elMobileQuickGenBtn.setAttribute(
        "aria-label",
        this.isGenerating ? "停止生图" : "立即生图"
      );
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

  private bindHorizontalWheelScroll(el: HTMLElement): void {
    el.addEventListener(
      "wheel",
      (ev: WheelEvent) => {
        if (Math.abs(ev.deltaY) > Math.abs(ev.deltaX) && el.scrollWidth > el.clientWidth) {
          ev.preventDefault();
          el.scrollLeft += ev.deltaY;
        }
      },
      { passive: false }
    );
  }

  private openSavePresetDialog(anchorBtn: HTMLElement): void {
    this.togglePopover(this.elSavePresetPopover, anchorBtn);
    this.elSavePresetInput.value = this.cfg.preset_name.startsWith("⭐ ")
      ? this.cfg.preset_name.replace(/^⭐\s*/, "")
      : `${this.cfg.eng_name || "角色"} 特调`;
    this.elSavePresetInput.focus();
    this.elSavePresetInput.select();
  }

  private handleResetOrRestorePresetsClick(ev: MouseEvent): void {
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
      this.openSavePresetDialog(btnSavePreset);
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
      this.handleResetOrRestorePresetsClick(ev);
    });

    gLeft.append(this.elPresetSelect, btnSavePreset, this.elDeletePresetBtn, btnResetAll);

    // Center: Model Segmented Pills + Canvas + Seed + Batch
    const gCenter = this.el("div", "topbar-group topbar-group-center");
    const modelSeg = this.el("div", "seg-group topbar-model-seg");
    const models: Array<[NaiModelId, string, string, string]> = [
      [
        MODEL_V4_5_FULL,
        "♾️ V4.5 Full",
        "♾️ V4.5",
        "Opus 标准尺寸 28步真正无限 0 Anlas · 原生支持 Vibe Transfer",
      ],
      [
        MODEL_V5_FULL,
        "🔥 V5 High",
        "🔥 V5H",
        "V5 Full High 28步 · 全题材独立负向 UC · Opus 走恢复池",
      ],
      [
        MODEL_V5_FULL_MEDIUM,
        "⚡ V5 Med",
        "⚡ V5M",
        "V5 Full Medium 14步极速 · 省约 42% V5 恢复池额度",
      ],
    ];
    this.elModelBtns.clear();
    for (const [mId, deskLbl, mobLbl, tip] of models) {
      const b = this.el("button", "seg-btn");
      b.append(
        this.el("span", "gen-lbl-desk", deskLbl),
        this.el("span", "gen-lbl-mob", mobLbl)
      );
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
      this.updateBatchCheckedButton();
    });

    this.elMobileStepsSelect = this.el(
      "select",
      "batch-select mobile-only-ctrl mobile-steps-select"
    ) as HTMLSelectElement;
    this.elMobileStepsSelect.title = "快捷切换采样步数 (Steps)";
    for (const st of [14, 20, 24, 28, 36, 50]) {
      const opt = this.el("option", "", `${st}步`);
      opt.value = String(st);
      this.elMobileStepsSelect.appendChild(opt);
    }
    this.elMobileStepsSelect.addEventListener("change", () => {
      const s = Math.max(1, Math.min(50, parseInt(this.elMobileStepsSelect.value, 10) || 28));
      this.apiSettings.steps = s;
      saveApiSettings(this.apiSettings);
      this.syncApiControls();
      this.updateQuotaPill();
    });

    this.elMobileUpscaleBtn = this.el(
      "button",
      "chip-btn mobile-only-ctrl mobile-upscale-chip",
      "🔍 2x替换"
    );
    this.elMobileUpscaleBtn.title = "生图完成后自动调用官方 2x 高清放大替换";
    this.elMobileUpscaleBtn.addEventListener("click", () => {
      this.apiSettings.auto_upscale_replace = !this.apiSettings.auto_upscale_replace;
      saveApiSettings(this.apiSettings);
      this.syncStageToolbar();
    });

    gCenter.append(
      modelSeg,
      this.elCanvasSelect,
      this.elMobileStepsSelect,
      this.elMobileUpscaleBtn,
      seedBox,
      this.elBatchSelect
    );

    const quickStrip = this.el("div", "topbar-quick-strip");
    quickStrip.append(gLeft, gCenter);
    this.bindHorizontalWheelScroll(quickStrip);

    // Right: Compact Mobile Brand + MCP Bridge Pill + Quota Pill + Folder Mount + Hero Generate / Stop
    const gRight = this.el("div", "topbar-group topbar-group-right");
    const mobileBrand = this.el("div", "brand-badge mobile-brand-badge", "✨ 2.0");
    mobileBrand.title = "NovelAI Studio 2.0";

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

    this.elMountBtn = this.el("button", "btn topbar-mount-btn", "📂 挂载目录");
    this.elMountBtn.title = "授权本地文件夹后，每张出图与 2x 放大图将自动按日期子目录落盘保存";
    if (!supportsDirectoryPicker()) {
      this.elMountBtn.style.display = "none";
    }
    this.elMountBtn.addEventListener("click", async () => {
      if (getMountedDirName()) {
        unmountLocalOutputDirectory();
        for (const rec of this.gallery) {
          rec.saved_to_dir = false;
        }
        this.syncMountButton();
        this.setStatus("📂 已断开本地自动保存目录");
        return;
      }
      try {
        const name = await mountLocalOutputDirectory();
        this.syncMountButton();
        const unsaved = this.gallery.filter((g) => !g.saved_to_dir);
        if (unsaved.length > 0) {
          const folderSet = new Set(
            unsaved.map((g) => g.group_folder).filter((f): f is string => Boolean(f))
          );
          const folderHint =
            folderSet.size > 0 ? `（含 ${folderSet.size} 个分组文件夹）` : "";
          const shouldSync = window.confirm(
            `已挂载本地输出目录「${name}」。\n当前画廊已有 ${unsaved.length} 张尚未保存到硬盘的图片${folderHint}，是否立刻按当前文件夹结构同步到硬盘？`
          );
          if (shouldSync) {
            await this.syncUnsavedGalleryToMountedDir(unsaved, name);
            return;
          }
          this.setStatus(
            `📂 已挂载本地输出目录：${name}（跳过历史 ${unsaved.length} 张，仅后续新图与归组操作自动落盘）`
          );
          return;
        }
        this.setStatus(`📂 已挂载本地输出目录：${name}（新生成图片将自动落盘）`);
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          this.setStatus(`⚠️ 挂载目录取消或失败：${err.message}`, true);
        }
      }
    });

    this.elHeroGenBtn = this.el("button", "btn btn-generate-hero");
    this.elHeroGenBtn.append(
      this.el("span", "gen-lbl-desk", "🚀 立即生图"),
      this.el("span", "gen-lbl-mob", "⚡ 生成")
    );
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

    gRight.append(
      mobileBrand,
      this.elQuotaPill,
      this.elMcpPill,
      this.elMountBtn,
      this.elHeroGenBtn,
      this.elStopGenBtn
    );
    bar.append(quickStrip, gRight);
    return bar;
  }

  private syncMcpPill(status: McpBridgeStatus): void {
    if (!this.elMcpPill) return;
    this.elMcpPill.className = "mcp-pill";
    this.elMcpPill.innerHTML = "";
    const dot = this.el("span", "mcp-dot");
    const resolved = this.mcpBridge.getResolvedEndpoints();
    let stateSuffix = " 待机";
    if (status === "connected") {
      this.elMcpPill.classList.add("connected");
      stateSuffix = " 已连";
    } else if (status === "disabled") {
      this.elMcpPill.classList.add("disabled");
      stateSuffix = " 已关";
    }
    const labelWrap = this.el("span", "mcp-lbl-wrap");
    labelWrap.append(
      this.el("span", "", "MCP"),
      this.el("span", "mcp-state-word", stateSuffix)
    );
    this.elMcpPill.append(dot, labelWrap);

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
    const customKeys = Object.keys(this.customPresets);
    const builtinKeys = this.getAvailableBuiltinKeys();
    const allKeys = [...customKeys, ...builtinKeys];

    let selectedKey = this.cfg.preset_name;
    if (!allKeys.includes(selectedKey) && allKeys.length > 0) {
      selectedKey = allKeys[0];
      this.cfg.preset_name = selectedKey;
    }

    const fillOneSelect = (sel: HTMLSelectElement | null): void => {
      if (!sel) return;
      sel.innerHTML = "";
      if (customKeys.length > 0) {
        const grpCustom = document.createElement("optgroup");
        grpCustom.label = "⭐ 特调 / 自定义角色预设";
        for (const k of customKeys) {
          const opt = this.el("option", "", compactOptionText(k, 36));
          opt.value = k;
          opt.title = k;
          grpCustom.appendChild(opt);
        }
        sel.appendChild(grpCustom);
      }
      if (builtinKeys.length > 0) {
        const grpBuiltin = document.createElement("optgroup");
        grpBuiltin.label = "👤 内置角色模板";
        for (const k of builtinKeys) {
          const opt = this.el("option", "", compactOptionText(k, 36));
          opt.value = k;
          opt.title = k;
          grpBuiltin.appendChild(opt);
        }
        sel.appendChild(grpBuiltin);
      }
      if (selectedKey && allKeys.includes(selectedKey)) {
        sel.value = selectedKey;
      }
    };

    fillOneSelect(this.elPresetSelect ?? null);
    fillOneSelect(this.elLeftPresetSelect);

    const disableDel = allKeys.length <= 1;
    if (this.elDeletePresetBtn) {
      this.elDeletePresetBtn.disabled = disableDel;
    }
    if (this.elLeftDeletePresetBtn) {
      this.elLeftDeletePresetBtn.disabled = disableDel;
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

    // --- SYNCED COMPACT PRESET SWITCHER BAR (Visible on <= 1120px above accordion cards) ---
    const leftPresetBar = this.el("div", "mobile-left-preset-bar");
    const leftPresetIcon = this.el("span", "mobile-left-preset-lbl", "📑");
    leftPresetIcon.title = "角色与特调预设快捷切换";

    this.elLeftPresetSelect = this.el("select", "preset-select-left-mirror") as HTMLSelectElement;
    this.elLeftPresetSelect.title = "切换角色预设（支持内置含Vibe特调预设与自定义保存预设）";
    this.elLeftPresetSelect.addEventListener("change", () => {
      if (this.elLeftPresetSelect) {
        void this.applySelectedCharacterPreset(this.elLeftPresetSelect.value);
      }
    });

    const btnLeftSave = this.el("button", "btn btn-icon", "💾");
    btnLeftSave.title = "将当前人设、穿搭、画风等保存为自定义预设";
    btnLeftSave.addEventListener("click", (ev) => {
      ev.stopPropagation();
      this.openSavePresetDialog(btnLeftSave);
    });

    this.elLeftDeletePresetBtn = this.el("button", "btn btn-icon", "🗑️");
    this.elLeftDeletePresetBtn.title =
      "删除当前下拉框选中的角色预设（刷新不复活；Shift+点击右侧 ↺ 可恢复出厂预设列表）";
    this.elLeftDeletePresetBtn.addEventListener("click", () => {
      const cur =
        this.elLeftPresetSelect?.value || this.elPresetSelect?.value || this.cfg.preset_name;
      if (!cur) return;
      void this.deletePresetByKey(cur);
    });

    const btnLeftReset = this.el("button", "btn btn-icon", "↺");
    btnLeftReset.title =
      "点击：重置当前面板为默认配置；按住 Shift 点击：恢复全部已删除的出厂角色预设";
    btnLeftReset.addEventListener("click", (ev) => {
      this.handleResetOrRestorePresetsClick(ev);
    });

    leftPresetBar.append(
      leftPresetIcon,
      this.elLeftPresetSelect,
      btnLeftSave,
      this.elLeftDeletePresetBtn,
      btnLeftReset
    );
    col.appendChild(leftPresetBar);
    this.populatePresetSelect();

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
      this.apiSettings.scale =
        this.apiSettings.model === MODEL_V5_FULL_MEDIUM
          ? 6.0
          : this.apiSettings.model === MODEL_V5_FULL
            ? 6.5
            : 7.0;
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
    this.bindHorizontalWheelScroll(actions);
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
    btnOpenLightbox.title = "进入全屏灯箱轮播查看 (快捷键: ←/→ 切图, F 收藏, Delete 删图)";
    btnOpenLightbox.addEventListener("click", () => {
      if (this.gallery.length === 0) {
        this.setStatus("⚠️ 画廊暂无图片，请先生图", true);
        return;
      }
      this.openLightbox(Math.max(0, this.selectedGalleryIdx));
    });

    const btnOpenFolders = this.el("button", "btn btn-xs", "📁 分组");
    btnOpenFolders.title = "拉起底部「两栏 ➔ 三栏」拖拽分组文件夹抽屉（支持预建文件夹与 🎯新图直入）";
    btnOpenFolders.addEventListener("click", () => {
      this.setFilmstripExpanded(!this.filmstripExpanded);
    });

    this.elStageGridBtn = this.el("button", "btn btn-xs", "🪟 总览");
    this.elStageGridBtn.title = "在中央舞台展开当前筛选画廊的大图网格总览";
    this.elStageGridBtn.addEventListener("click", () => {
      if (this.gallery.length === 0) return;
      this.stageViewMode = this.stageViewMode === "grid" ? "single" : "grid";
      this.renderHeroViewport();
    });

    this.elStageCompareBtn = this.el("button", "btn btn-xs", "⚖️ 对比");
    this.elStageCompareBtn.title = "勾选 2 张图（或对比当前图与上一张）在中央舞台同屏左右比对";
    this.elStageCompareBtn.addEventListener("click", () => {
      this.toggleCompareStageView();
    });

    this.elStarCurBtn = this.el("button", "btn btn-xs", "☆ 收藏");
    this.elStarCurBtn.title =
      "收藏当前图：自动持久化至浏览器 IndexedDB（刷新不丢），已挂载目录时同步移入 _favorites 子文件夹 (快捷键: F)";
    this.elStarCurBtn.addEventListener("click", () => {
      const rec = this.gallery[this.selectedGalleryIdx];
      if (rec) void this.toggleGalleryStar(rec.id);
    });

    const rerollGroup = this.el("div", "reroll-inline-group");
    this.elRerollCurBtn = this.el("button", "btn btn-xs btn-primary", "🎲 重抽选优");
    this.elRerollCurBtn.title =
      "按当前图原始配置快照快速重抽 N 张新候选图，同屏比对并一键选定留用、自动销毁落选图 (快捷键: R)";
    this.elRerollCurBtn.addEventListener("click", () => {
      const rec = this.gallery[this.selectedGalleryIdx];
      if (rec) void this.startOrContinueShootout(rec.id, this.rerollCountPerRound);
    });
    this.elRerollCountSelect = this.el("select", "batch-select reroll-cnt-select") as HTMLSelectElement;
    this.elRerollCountSelect.title = "每次重抽生成的候选张数";
    for (const n of [1, 2, 3, 4]) {
      const opt = this.el("option", "", `+${n}张`);
      opt.value = String(n);
      this.elRerollCountSelect.appendChild(opt);
    }
    this.elRerollCountSelect.value = String(this.rerollCountPerRound);
    this.elRerollCountSelect.addEventListener("change", () => {
      this.rerollCountPerRound = Math.max(1, Math.min(4, parseInt(this.elRerollCountSelect.value, 10) || 2));
    });
    rerollGroup.append(this.elRerollCurBtn, this.elRerollCountSelect);

    this.elRestoreTriggerBtn = this.el("button", "btn btn-xs", "🧬 回溯 ▾");
    this.elRestoreTriggerBtn.title = "从当前预览图一键回填生成当时的角色/画风/光影配置、Seed 或词条";
    this.elRestoreTriggerBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      if (!this.gallery[this.selectedGalleryIdx]) return;
      this.refreshRestorePopoverLabels();
      this.togglePopover(this.elRestorePopover, this.elRestoreTriggerBtn);
    });

    this.elUpscaleBtn = this.el("button", "btn btn-xs btn-primary", "✨ 2x高清");
    this.elUpscaleBtn.title = "对当前预览图片调用官方 2x Upscale 高清放大并原位替换（同步清理硬盘旧1x图）";
    this.elUpscaleBtn.addEventListener("click", () => void this.upscaleSelectedGalleryImage());

    const btnDownloadCur = this.el("button", "btn btn-xs", "💾 下载");
    btnDownloadCur.addEventListener("click", () => {
      const rec = this.gallery[this.selectedGalleryIdx];
      if (!rec) return;
      triggerBytesDownload(rec.bytes, rec.filename);
    });

    this.elDeleteCurBtn = this.el("button", "btn btn-xs btn-danger", "🗑️ 删除");
    this.elDeleteCurBtn.title = "删除当前图（已挂载本地目录时同步删除硬盘对应 PNG 文件，快捷键: Delete）";
    this.elDeleteCurBtn.addEventListener("click", () => {
      const rec = this.gallery[this.selectedGalleryIdx];
      if (rec) void this.deleteGalleryRecordsByIds([rec.id], `已删除 ${rec.scene_id}`);
    });

    const btnZipAll = this.el("button", "btn btn-xs btn-success", "📦 打包ZIP");
    btnZipAll.title = "打包导出已勾选图片（未勾选时导出当前筛选列表全部图片）与 prompts.txt";
    btnZipAll.addEventListener("click", () => this.exportGalleryZip());

    actions.append(
      this.elAutoUpscaleBtn,
      this.elAutoCarouselBtn,
      btnChecker,
      btnOpenFolders,
      this.elStageGridBtn,
      this.elStageCompareBtn,
      btnOpenLightbox,
      this.elStarCurBtn,
      rerollGroup,
      this.elRestoreTriggerBtn,
      this.elUpscaleBtn,
      btnDownloadCur,
      this.elDeleteCurBtn,
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

    // 3. Rich Bottom Gallery Bar (Single-Row Filmstrip ⇄ Multi-Row Adjustable Drawer)
    this.elFilmstripBar = this.el("div", "filmstrip-bar hidden");
    const filmResizer = this.el("div", "filmstrip-resizer");
    filmResizer.title = "上下拖动调节展开态画廊抽屉高度（双击重置）";

    const filmToolbar = this.el("div", "filmstrip-toolbar");
    const filmLeft = this.el("div", "filmstrip-filter-group");

    this.elFilmExpandBtn = this.el("button", "btn btn-xs btn-primary", "▴ 分栏归档");
    this.elFilmExpandBtn.title = "上拉展开「两栏拖拽归档 ➔ 点击文件夹展开三栏」自动分文件夹视图";
    this.elFilmExpandBtn.addEventListener("click", () => {
      this.setFilmstripExpanded(!this.filmstripExpanded);
    });
    filmLeft.appendChild(this.elFilmExpandBtn);

    const filterDefs: Array<[GalleryFilterMode, string, string]> = [
      ["all", "全部", "显示全部画廊图片"],
      ["starred", "⭐收藏", "仅显示已点亮星标收藏的图片（刷新保留）"],
      ["upscaled", "🔍2x", "仅显示已完成 2x 高清放大的图片"],
    ];
    this.elFilmFilterBtns.clear();
    for (const [fMode, fLbl, fTip] of filterDefs) {
      const fb = this.el("button", `chip-btn${this.galleryFilterMode === fMode ? " active" : ""}`, fLbl);
      fb.title = fTip;
      fb.addEventListener("click", () => {
        this.galleryFilterMode = fMode;
        if (fMode !== "scene") this.elFilmSceneSelect.value = "";
        this.ensureSelectedMatchesFilter();
        this.renderFilmstrip();
        this.renderHeroViewport();
      });
      this.elFilmFilterBtns.set(fMode, fb);
      filmLeft.appendChild(fb);
    }

    this.elFilmSceneSelect = this.el("select", "batch-select film-scene-select") as HTMLSelectElement;
    this.elFilmSceneSelect.title = "按生成时的场景/体位 ID 筛选画廊图片";
    this.elFilmSceneSelect.addEventListener("change", () => {
      const val = this.elFilmSceneSelect.value;
      if (val) {
        this.gallerySceneFilter = val;
        this.galleryFilterMode = "scene";
      } else {
        this.gallerySceneFilter = "";
        if (this.galleryFilterMode === "scene") this.galleryFilterMode = "all";
      }
      this.ensureSelectedMatchesFilter();
      this.renderFilmstrip();
      this.renderHeroViewport();
    });
    filmLeft.appendChild(this.elFilmSceneSelect);

    const filmRight = this.el("div", "filmstrip-batch-group");
    const getTopbarSelectionIndices = (): { indices: number[]; scopeLabel: string } => {
      const filtered = this.getFilteredGalleryIndices();
      if (!this.filmstripExpanded) {
        return { indices: filtered, scopeLabel: "当前列表" };
      }
      if (this.organizerLeftPoolMode === "ungrouped") {
        const ungrouped = filtered.filter((i) => !this.gallery[i].group_folder);
        if (ungrouped.length > 0) {
          return { indices: ungrouped, scopeLabel: "未分组图池" };
        }
      }
      if (this.openedFolderName) {
        const opened = filtered.filter((i) => this.gallery[i].group_folder === this.openedFolderName);
        if (opened.length > 0) {
          return { indices: opened, scopeLabel: `文件夹「${this.openedFolderName}」` };
        }
      }
      return { indices: filtered, scopeLabel: "当前筛选" };
    };

    const btnSelAll = this.el("button", "btn btn-xs", "全选");
    btnSelAll.title =
      "分栏归档模式下仅全选当前区块（优先未分组图池，避免误选已归档文件夹）；各区块标题栏也有独立全选/反选按钮";
    btnSelAll.addEventListener("click", () => {
      const { indices, scopeLabel } = getTopbarSelectionIndices();
      const allChecked =
        indices.length > 0 && indices.every((idx) => this.checkedGalleryIds.has(this.gallery[idx].id));
      for (const idx of indices) {
        const id = this.gallery[idx].id;
        if (allChecked) this.checkedGalleryIds.delete(id);
        else this.checkedGalleryIds.add(id);
      }
      this.renderFilmstrip();
      this.syncStageToolbar();
      this.setStatus(
        allChecked
          ? `已取消勾选${scopeLabel} (${indices.length} 张)`
          : `☑️ 已全选${scopeLabel} (${indices.length} 张)`
      );
    });

    const btnSelInvert = this.el("button", "btn btn-xs", "反选");
    btnSelInvert.title = "反选当前区块内的图片勾选状态";
    btnSelInvert.addEventListener("click", () => {
      const { indices } = getTopbarSelectionIndices();
      for (const idx of indices) {
        const id = this.gallery[idx].id;
        if (this.checkedGalleryIds.has(id)) this.checkedGalleryIds.delete(id);
        else this.checkedGalleryIds.add(id);
      }
      this.renderFilmstrip();
      this.syncStageToolbar();
    });

    this.elBatchUpscaleGalleryBtn = this.el("button", "btn btn-xs btn-primary", "✨ 批量2x");
    this.elBatchUpscaleGalleryBtn.title = "对已勾选的所有未放大图片依次执行官方 2x 高清放大替换";
    this.elBatchUpscaleGalleryBtn.addEventListener("click", () => {
      const ids = this.gallery
        .filter((g) => this.checkedGalleryIds.has(g.id) && !g.is_upscaled)
        .map((g) => g.id);
      if (ids.length === 0) {
        this.setStatus("⚠️ 请先在画廊勾选尚未 2x 放大的 1x 图片", true);
        return;
      }
      void this.upscaleGalleryRecordsByIds(ids);
    });

    this.elBatchDeleteGalleryBtn = this.el("button", "btn btn-xs btn-danger", "🗑️ 删已选");
    this.elBatchDeleteGalleryBtn.title = "删除所有已勾选图片（同步清理已挂载本地硬盘文件）";
    this.elBatchDeleteGalleryBtn.addEventListener("click", () => {
      if (this.checkedGalleryIds.size === 0) return;
      const cnt = this.checkedGalleryIds.size;
      void this.deleteGalleryRecordsByIds(
        Array.from(this.checkedGalleryIds),
        `🗑️ 已批量删除 ${cnt} 张勾选图片`
      );
    });

    const btnClearUnstarred = this.el("button", "btn btn-xs", "🧹 清未收藏");
    btnClearUnstarred.title = "一键清理所有未标星 ⭐ 的普通图（保留全部收藏图，同步删除硬盘未收藏文件）";
    btnClearUnstarred.addEventListener("click", () => {
      const unstarredIds = this.gallery.filter((g) => !g.is_starred).map((g) => g.id);
      if (unstarredIds.length === 0) {
        this.setStatus("✨ 当前画廊没有未收藏的普通图");
        return;
      }
      void this.deleteGalleryRecordsByIds(
        unstarredIds,
        `🧹 已清理 ${unstarredIds.length} 张未收藏图片（⭐收藏已保留）`
      );
    });

    const btnClearGallery = this.el("button", "btn btn-xs", "清空全部");
    btnClearGallery.title = "清空当前全部画廊图片（包含取消收藏并同步清理本地文件）";
    btnClearGallery.addEventListener("click", () => {
      if (this.gallery.length === 0) return;
      const hasStars = this.gallery.some((g) => g.is_starred);
      if (hasStars && !window.confirm("当前画廊包含 ⭐ 已收藏图片，确定全部清空并从本地移除吗？")) {
        return;
      }
      void this.deleteGalleryRecordsByIds(
        this.gallery.map((g) => g.id),
        "🧹 已清空全部画廊图片"
      );
    });

    this.elBatchMoveFolderSelect = this.el(
      "select",
      "batch-select film-move-folder-select"
    ) as HTMLSelectElement;
    this.elBatchMoveFolderSelect.title =
      "触屏一键归档：将已勾选图片（未勾选时为当前选中图）移入已有或新建文件夹，无需鼠标拖拽";
    this.elBatchMoveFolderSelect.addEventListener("change", () => {
      const val = this.elBatchMoveFolderSelect.value;
      this.elBatchMoveFolderSelect.value = "";
      if (!val) return;
      const curRec = this.gallery[this.selectedGalleryIdx];
      const targetIds =
        this.checkedGalleryIds.size > 0
          ? Array.from(this.checkedGalleryIds)
          : curRec
            ? [curRec.id]
            : [];
      if (targetIds.length === 0) {
        this.setStatus("⚠️ 请先勾选或选中需要移入文件夹的图片", true);
        return;
      }
      if (val === "__new__") {
        const firstRec = this.gallery.find((g) => targetIds.includes(g.id));
        const defaultName = `${firstRec?.scene_id || this.activeSceneId || "分组"}_${this.galleryFolders.length + 1}`;
        const inputName = window.prompt("新建分组文件夹名称：", defaultName);
        if (inputName === null) return;
        const created = this.ensureGalleryFolderExists(inputName.trim() || defaultName);
        if (!created) return;
        this.openedFolderName = created;
        void this.moveGalleryRecordsToFolder(targetIds, created);
      } else if (val === "__ungroup__") {
        void this.moveGalleryRecordsToFolder(targetIds, null);
      } else if (val.startsWith("fld:")) {
        const folderName = val.slice(4);
        this.openedFolderName = folderName;
        void this.moveGalleryRecordsToFolder(targetIds, folderName);
      }
    });

    filmRight.append(
      btnSelAll,
      btnSelInvert,
      this.elBatchMoveFolderSelect,
      this.elBatchUpscaleGalleryBtn,
      this.elBatchDeleteGalleryBtn,
      btnClearUnstarred,
      btnClearGallery
    );
    filmToolbar.append(filmLeft, filmRight);

    this.elFilmstripScroll = this.el("div", "filmstrip-scroll");
    this.elFilmstripBar.append(filmResizer, filmToolbar, this.elFilmstripScroll);
    this.setupFilmstripDrawerResizer(col, this.elFilmstripBar, filmResizer);

    // 4. Collapsible & Vertically Resizable Bottom Live Prompt Drawer (defaults collapsed on mobile & load)
    this.elPromptDrawer = this.el("section", "prompt-drawer collapsed");
    const drawerResizer = this.el("div", "prompt-drawer-resizer");
    drawerResizer.title = "上下拖动调节词条面板高度（双击重置）";
    const pBar = this.el("div", "prompt-drawer-bar");
    pBar.title = "点击展开 / 收起词条微调面板";
    const pLeft = this.el("div", "prompt-bar-left");

    this.elDrawerToggleBtn = this.el("button", "btn btn-xs prompt-toggle-btn", "▸ 展开词条微调");
    this.elDrawerToggleBtn.setAttribute("aria-expanded", "false");
    this.elDrawerToggleBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      this.togglePromptDrawer();
    });

    pBar.addEventListener("click", () => {
      this.togglePromptDrawer();
    });

    this.elPromptSceneLbl = this.el("span", "prompt-scene-lbl", "");
    this.elTokenPill = this.el("span", "token-pill", "0 / 502 tok");
    this.elManualLockPill = this.el("span", "manual-lock-pill", "✏️ 手改生效中");
    this.elManualLockPill.style.display = "none";
    const btnResetManual = this.el("button", "btn btn-xs", "↺ 恢复引擎词条");
    btnResetManual.style.marginLeft = "4px";
    btnResetManual.addEventListener("click", (ev) => {
      ev.stopPropagation();
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

    const pRight = this.el("div", "topbar-group prompt-bar-actions");
    const focusSeg = this.el("div", "seg-group prompt-focus-seg");
    const focusModes: Array<["both" | "pos" | "neg", string, string]> = [
      ["both", "双框", "同时显示正向与负向词条框"],
      ["pos", "正向", "让 Positive 正向框占满 100% 编辑区（适合手机虚拟键盘输入）"],
      ["neg", "负向", "让 Negative 负向框占满 100% 编辑区（适合手机虚拟键盘输入）"],
    ];
    this.elPromptFocusBtns.clear();
    for (const [fKey, fLbl, fTip] of focusModes) {
      const fBtn = this.el(
        "button",
        `seg-btn${this.promptFocusMode === fKey ? " active" : ""}`,
        fLbl
      );
      fBtn.title = fTip;
      fBtn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        this.setPromptFocusMode(fKey);
      });
      this.elPromptFocusBtns.set(fKey, fBtn);
      focusSeg.appendChild(fBtn);
    }

    const btnCopyPos = this.el("button", "btn btn-xs", "📋 复制正向");
    btnCopyPos.addEventListener("click", (ev) => {
      ev.stopPropagation();
      void navigator.clipboard.writeText(this.elPosTextarea.value.trim());
      this.setStatus("📋 已复制正向 Prompt 到剪贴板");
    });
    const btnCopyNeg = this.el("button", "btn btn-xs", "📋 复制负向");
    btnCopyNeg.addEventListener("click", (ev) => {
      ev.stopPropagation();
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
    btnCopyInline.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const merged = mergePosAndNegToInline(this.elPosTextarea.value, this.elNegTextarea.value);
      void navigator.clipboard.writeText(merged);
      this.setStatus("📋 已复制单框内联格式 (-2::...::) 到剪贴板");
    });
    pRight.append(focusSeg, btnCopyPos, btnCopyNeg, btnCopyInline);
    pBar.append(pLeft, pRight);

    const pBody = this.el("div", "prompt-drawer-body");
    pBody.dataset.promptFocus = this.promptFocusMode;
    this.elPromptDrawerBody = pBody;
    const posCol = this.el("div", "prompt-box-col prompt-box-pos");
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

    const negCol = this.el("div", "prompt-box-col prompt-box-neg");
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

  private setPromptFocusMode(mode: "both" | "pos" | "neg"): void {
    this.promptFocusMode = mode;
    if (this.elPromptDrawerBody) {
      this.elPromptDrawerBody.dataset.promptFocus = mode;
    }
    for (const [k, btn] of this.elPromptFocusBtns.entries()) {
      btn.classList.toggle("active", k === mode);
    }
  }

  private togglePromptDrawer(force?: boolean, customOverlayH?: number | null): void {
    const next = force !== undefined ? force : !this.promptDrawerExpanded;
    if (next) {
      this.snapshotCollapsedBarHeights();
      if (this.isPortraitCompactStage) {
        if (this.filmstripExpanded) {
          this.filmstripExpanded = false;
          this.renderFilmstrip();
        }
        this.portraitPromptOverlayCustomH =
          customOverlayH !== undefined ? customOverlayH : null;
      }
    }
    this.promptDrawerExpanded = next;
    this.elPromptDrawer.classList.toggle("collapsed", !this.promptDrawerExpanded);
    this.elDrawerToggleBtn.textContent = this.promptDrawerExpanded
      ? "▾ 收起词条面板"
      : "▸ 展开词条微调";
    this.elDrawerToggleBtn.setAttribute("aria-expanded", String(this.promptDrawerExpanded));
    this.snapshotCollapsedBarHeights();
    this.syncPortraitOverlayState();
  }

  private setupFilmstripDrawerResizer(
    colCenter: HTMLElement,
    bar: HTMLElement,
    handle: HTMLElement
  ): void {
    const LS_KEY = "nai_wb_filmstrip_h_v1";
    const MIN_H = 175;
    const getDefaultH = () => 268;
    const getMaxH = () => {
      const containerH = colCenter.clientHeight || window.innerHeight;
      return Math.max(240, Math.round(containerH * 0.64));
    };
    const getPortraitMaxH = () => {
      const containerH =
        colCenter.clientHeight || Math.max(320, window.innerHeight - 140);
      return Math.max(180, containerH - (this.collapsedPromptBarH || 44));
    };

    let customH: number | null = null;
    try {
      const raw = Number(localStorage.getItem(LS_KEY));
      if (Number.isFinite(raw) && raw >= MIN_H) customH = Math.round(raw);
    } catch {
      // ignore
    }

    const applyH = (persist = false): void => {
      if (customH === null) {
        bar.style.removeProperty("--filmstrip-expanded-h");
      } else {
        customH = Math.max(MIN_H, Math.min(getMaxH(), customH));
        bar.style.setProperty("--filmstrip-expanded-h", `${customH}px`);
      }
      if (persist) {
        try {
          if (customH === null) localStorage.removeItem(LS_KEY);
          else localStorage.setItem(LS_KEY, String(customH));
        } catch {
          // ignore
        }
      }
    };
    this.restoreDesktopFilmstripHeight = () => applyH(false);
    applyH(false);

    handle.addEventListener("dblclick", () => {
      if (this.isPortraitCompactStage) {
        this.portraitFilmOverlayCustomH = null;
        this.syncPortraitOverlayState();
        return;
      }
      customH = null;
      applyH(true);
    });

    handle.addEventListener("pointerdown", (ev: PointerEvent) => {
      ev.preventDefault();
      handle.setPointerCapture(ev.pointerId);
      handle.classList.add("dragging");

      if (this.isPortraitCompactStage) {
        const wasExpanded = this.filmstripExpanded;
        const startY = ev.clientY;
        const startTime = performance.now();
        const startH = wasExpanded
          ? bar.offsetHeight || this.portraitFilmOverlayCustomH || getPortraitMaxH()
          : bar.offsetHeight || this.collapsedFilmstripBarH || 88;
        let currentlyExpanded = wasExpanded;
        let liveH = startH;
        let peakH = startH;
        bar.classList.add("is-dragging-overlay");

        const onMove = (moveEv: PointerEvent): void => {
          const dy = startY - moveEv.clientY;
          const maxH = getPortraitMaxH();
          if (!currentlyExpanded && dy > 4) {
            liveH = Math.max(130, Math.min(maxH, Math.round(startH + dy)));
            peakH = Math.max(peakH, liveH);
            this.setFilmstripExpanded(true, liveH);
            bar.classList.add("is-dragging-overlay");
            currentlyExpanded = true;
          } else if (currentlyExpanded) {
            liveH = Math.max(84, Math.min(maxH, Math.round(startH + dy)));
            peakH = Math.max(peakH, liveH);
            this.portraitFilmOverlayCustomH = liveH;
            bar.classList.add("has-custom-h");
            bar.style.setProperty("--portrait-film-overlay-h", `${liveH}px`);
          }
        };

        const onUp = (upEv: PointerEvent): void => {
          handle.releasePointerCapture(upEv.pointerId);
          handle.classList.remove("dragging");
          bar.classList.remove("is-dragging-overlay");
          handle.removeEventListener("pointermove", onMove);
          handle.removeEventListener("pointerup", onUp);
          handle.removeEventListener("pointercancel", onUp);

          const totalDy = startY - upEv.clientY;
          const isQuickFlick = performance.now() - startTime < 320;
          const maxH = getPortraitMaxH();
          const reversedDownAfterPull = peakH - liveH > 26;

          if (!wasExpanded) {
            if (
              Math.abs(totalDy) < 8 ||
              (totalDy > 36 && (!reversedDownAfterPull || isQuickFlick))
            ) {
              this.setFilmstripExpanded(true, null);
            } else if (!currentlyExpanded || liveH < 130) {
              this.setFilmstripExpanded(false);
            } else if (liveH >= maxH - 36) {
              this.portraitFilmOverlayCustomH = null;
              this.syncPortraitOverlayState();
            } else {
              this.portraitFilmOverlayCustomH = liveH;
              this.syncPortraitOverlayState();
            }
          } else {
            if ((isQuickFlick && totalDy < -42) || liveH < 130) {
              this.setFilmstripExpanded(false);
            } else if (Math.abs(totalDy) < 8) {
              if (this.portraitFilmOverlayCustomH !== null) {
                this.portraitFilmOverlayCustomH = null;
                this.syncPortraitOverlayState();
              } else {
                this.setFilmstripExpanded(false);
              }
            } else if ((isQuickFlick && totalDy > 36) || liveH >= maxH - 36) {
              this.portraitFilmOverlayCustomH = null;
              this.syncPortraitOverlayState();
            } else {
              this.portraitFilmOverlayCustomH = liveH;
              this.syncPortraitOverlayState();
            }
          }
        };

        handle.addEventListener("pointermove", onMove);
        handle.addEventListener("pointerup", onUp);
        handle.addEventListener("pointercancel", onUp);
        return;
      }

      if (!this.filmstripExpanded) {
        this.setFilmstripExpanded(true);
      }
      const startY = ev.clientY;
      const startH = customH ?? getDefaultH();

      const onMove = (moveEv: PointerEvent): void => {
        const dy = startY - moveEv.clientY;
        customH = Math.max(MIN_H, Math.min(getMaxH(), Math.round(startH + dy)));
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
    const getPortraitMaxH = () =>
      Math.max(180, colCenter.clientHeight || Math.max(320, window.innerHeight - 140));
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
    this.restoreDesktopPromptDrawerHeight = () => applyH(false);
    applyH(false);

    handle.addEventListener("dblclick", () => {
      if (this.isPortraitCompactStage) {
        this.portraitPromptOverlayCustomH = null;
        this.syncPortraitOverlayState();
        return;
      }
      drawerH = null;
      applyH(true);
    });

    handle.addEventListener("pointerdown", (ev: PointerEvent) => {
      ev.preventDefault();
      handle.setPointerCapture(ev.pointerId);
      handle.classList.add("dragging");

      if (this.isPortraitCompactStage) {
        const wasExpanded = this.promptDrawerExpanded;
        const startY = ev.clientY;
        const startTime = performance.now();
        const startH = wasExpanded
          ? drawer.offsetHeight || this.portraitPromptOverlayCustomH || getPortraitMaxH()
          : drawer.offsetHeight || this.collapsedPromptBarH || 56;
        let currentlyExpanded = wasExpanded;
        let liveH = startH;
        let peakH = startH;
        drawer.classList.add("is-dragging-overlay");

        const onMove = (moveEv: PointerEvent): void => {
          const dy = startY - moveEv.clientY;
          const maxH = getPortraitMaxH();
          if (!currentlyExpanded && dy > 4) {
            liveH = Math.max(130, Math.min(maxH, Math.round(startH + dy)));
            peakH = Math.max(peakH, liveH);
            this.togglePromptDrawer(true, liveH);
            drawer.classList.add("is-dragging-overlay");
            currentlyExpanded = true;
          } else if (currentlyExpanded) {
            liveH = Math.max(84, Math.min(maxH, Math.round(startH + dy)));
            peakH = Math.max(peakH, liveH);
            this.portraitPromptOverlayCustomH = liveH;
            drawer.classList.add("has-custom-h");
            drawer.style.setProperty("--portrait-prompt-overlay-h", `${liveH}px`);
          }
        };

        const onUp = (upEv: PointerEvent): void => {
          handle.releasePointerCapture(upEv.pointerId);
          handle.classList.remove("dragging");
          drawer.classList.remove("is-dragging-overlay");
          handle.removeEventListener("pointermove", onMove);
          handle.removeEventListener("pointerup", onUp);
          handle.removeEventListener("pointercancel", onUp);

          const totalDy = startY - upEv.clientY;
          const isQuickFlick = performance.now() - startTime < 320;
          const maxH = getPortraitMaxH();
          const reversedDownAfterPull = peakH - liveH > 26;

          if (!wasExpanded) {
            if (
              Math.abs(totalDy) < 8 ||
              (totalDy > 36 && (!reversedDownAfterPull || isQuickFlick))
            ) {
              this.togglePromptDrawer(true, null);
            } else if (!currentlyExpanded || liveH < 130) {
              this.togglePromptDrawer(false);
            } else if (liveH >= maxH - 36) {
              this.portraitPromptOverlayCustomH = null;
              this.syncPortraitOverlayState();
            } else {
              this.portraitPromptOverlayCustomH = liveH;
              this.syncPortraitOverlayState();
            }
          } else {
            if ((isQuickFlick && totalDy < -42) || liveH < 130) {
              this.togglePromptDrawer(false);
            } else if (Math.abs(totalDy) < 8) {
              if (this.portraitPromptOverlayCustomH !== null) {
                this.portraitPromptOverlayCustomH = null;
                this.syncPortraitOverlayState();
              } else {
                this.togglePromptDrawer(false);
              }
            } else if ((isQuickFlick && totalDy > 36) || liveH >= maxH - 36) {
              this.portraitPromptOverlayCustomH = null;
              this.syncPortraitOverlayState();
            } else {
              this.portraitPromptOverlayCustomH = liveH;
              this.syncPortraitOverlayState();
            }
          }
        };

        handle.addEventListener("pointermove", onMove);
        handle.addEventListener("pointerup", onUp);
        handle.addEventListener("pointercancel", onUp);
        return;
      }

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
      if (!this.isPortraitCompactStage && drawerH !== null) applyH(false);
    });
  }

  // ===========================================================================
  // RIGHT COLUMN: 3-MODE ACTION & CAMERA MATRIX (STORYLINE-FREE)
  // ===========================================================================
  private buildRightColumn(): HTMLElement {
    const col = this.el("aside", "studio-col col-right");

    // 1. 4-Mode Switcher
    const modeBar = this.el("div", "action-mode-bar");
    const seg = this.el("div", "seg-group");
    const modes: Array<[ActionMode, string]> = [
      ["positions", "🔞 体位库"],
      ["multi_angle", "✨ 多角度"],
      ["other", "📱 其他动作"],
      ["free", "✍️ 自由手写"],
    ];
    this.elActionModeBtns.clear();
    for (const [m, lbl] of modes) {
      const b = this.el("button", `seg-btn${this.actionMode === m ? " active" : ""}`, lbl);
      b.addEventListener("click", () => {
        this.actionMode = m;
        this.isManualPromptEdited = false;
        if (
          m === "positions" &&
          (!(this.activeSceneId in ALL_POSITIONS_TEMPLATES) || this.isCreatureOtherId(this.activeSceneId))
        ) {
          this.activeSceneId = "P01";
        } else if (m === "multi_angle" && !this.activeSceneId.startsWith("MA")) {
          this.activeSceneId = "MA1";
        } else if (m === "other" && !this.isOtherActionId(this.activeSceneId)) {
          this.activeSceneId = "TN01";
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
    } else if (this.actionMode === "other") {
      this.buildOtherActionContextControls();
      this.buildOtherActionFilterControls();
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

    // Row 2.5: Progressive Stage Generation Bar (由阶段递进生成)
    const progBox = this.buildStageProgressionBox(isTentacleScene);

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
    r3.appendChild(this.buildPixivBarCensorChip(false));

    // Row 4: Scene Environment Bar with inline Enable Switch (auto-locked for TN poses)
    const r4 = this.buildPosSceneRow();
    this.elContextCtrlBox.append(r1, r2, progBox, r3, r4);
    this.updateBatchCheckedButton();
  }

  private buildStageProgressionBox(isCurrentPoseTentacle: boolean): HTMLElement {
    const box = this.el("div", "stage-prog-box");

    // Top line: Multi-select stage chain pills (1.进行 ➔ 2.内射 ➔ 3.溢流 ➔ 4.拔出 [5.宫脱])
    const line1 = this.el("div", "ctrl-inline-row stage-prog-row");
    const lbl = this.el("span", "ctrl-tag-lbl stage-prog-lbl", "📈递进");
    lbl.title = "勾选参与递进生成的阶段链（至少保留 2 个阶段，按 1➔5 顺序推进）";
    line1.appendChild(lbl);

    ORDERED_POS_STAGE_ENTRIES.forEach((st, idx) => {
      if (idx > 0) {
        line1.appendChild(this.el("span", "stage-prog-arrow", "›"));
      }
      const isOn = this.progSelectedStageCodes.has(st.code);
      const pill = this.el(
        "button",
        `chip-btn stage-chain-chip${isOn ? " active" : ""}`,
        st.compactPill
      );
      pill.title = `${isOn ? "已纳入递进链" : "点击加入递进链"}：${st.key}`;
      pill.addEventListener("click", () => {
        if (this.progSelectedStageCodes.has(st.code)) {
          if (this.progSelectedStageCodes.size <= 2) {
            this.setStatus("⚠️ 阶段递进至少保留 2 个阶段");
            return;
          }
          this.progSelectedStageCodes.delete(st.code);
        } else {
          this.progSelectedStageCodes.add(st.code);
        }
        this.renderRightModeView();
      });
      line1.appendChild(pill);
    });

    // Bottom line: Mode switcher + Lock Shared Seed + Auto Folder + Run button
    const line2 = this.el("div", "ctrl-inline-row stage-prog-row");

    const modeSeg = this.el("div", "seg-group stage-prog-seg");
    const modeDefs: Array<[StageProgressionMode, string, string]> = [
      [
        "per_pose_chain",
        "🔁 单体位全阶段",
        "对当前体位（或每个勾选体位依次）完整连出所选阶段链（如 1.进行 ➔ 2.内射 ➔ 3.溢流 ➔ 4.拔出）",
      ],
      [
        "across_poses_arc",
        "📖 多体位推进",
        "勾选多个体位时，按动作列表顺序自动从前向后推进阶段（第1个体位走前段 ➔ 最后体位走事后）",
      ],
    ];
    for (const [mVal, mLbl, mTip] of modeDefs) {
      const mb = this.el(
        "button",
        `seg-btn${this.progMode === mVal ? " active" : ""}`,
        mLbl
      );
      mb.title = mTip;
      mb.addEventListener("click", () => {
        this.progMode = mVal;
        this.renderRightModeView();
      });
      modeSeg.appendChild(mb);
    }

    const seedLockBtn = this.el(
      "button",
      `switch-pill${this.progLockSeedPerPose ? " on" : ""}`,
      this.progLockSeedPerPose ? "🔒同Seed" : "🎲各随机"
    );
    seedLockBtn.title =
      "开启后：同一体位在跨阶段递进时锁定同一个随机/指定 Seed，最大化保持构图与角度一致（做阶段差分效果）";
    seedLockBtn.addEventListener("click", () => {
      this.progLockSeedPerPose = !this.progLockSeedPerPose;
      this.renderRightModeView();
    });

    const autoGrpBtn = this.el(
      "button",
      `switch-pill${this.progAutoGroupFolder ? " on" : ""}`,
      this.progAutoGroupFolder ? "📁自动建组" : "📁不建组"
    );
    autoGrpBtn.title =
      "开启后：每次发起递进生成自动新建专属分组文件夹（同步在挂载本地目录建子文件夹）归档整套递进图";
    autoGrpBtn.addEventListener("click", () => {
      this.progAutoGroupFolder = !this.progAutoGroupFolder;
      this.renderRightModeView();
    });

    line2.append(modeSeg, seedLockBtn, autoGrpBtn);

    // Action row: Step 1 (Draw Stage-1 candidate(s) to pick seed) -> Step 2 (Continue remaining stages with selected image's Seed) + 1-click full run
    const line3 = this.el("div", "ctrl-inline-row stage-prog-row stage-prog-actions");

    this.elProgFirstBtn = this.el(
      "button",
      "btn btn-xs stage-prog-first-btn",
      "🎯 先抽首幕"
    );
    this.elProgFirstBtn.disabled =
      this.isGenerating || (isCurrentPoseTentacle && this.checkedPositionIds.size === 0);
    this.elProgFirstBtn.addEventListener("click", () => {
      this.runStageProgressionFirstStep();
    });

    this.elProgContinueBtn = this.el(
      "button",
      "btn btn-xs btn-primary stage-prog-continue-btn",
      "⏩ 选中首幕图后续出"
    );
    this.elProgContinueBtn.disabled = true;
    this.elProgContinueBtn.addEventListener("click", () => {
      void this.runStageProgressionContinueFromSelected();
    });

    this.elProgRunBtn = this.el("button", "btn btn-xs stage-prog-run-btn", "📈 一键递进");
    this.elProgRunBtn.disabled =
      this.isGenerating || (isCurrentPoseTentacle && this.checkedPositionIds.size === 0);
    this.elProgRunBtn.addEventListener("click", () => {
      this.runStageProgressionBatch();
    });

    line3.append(this.elProgFirstBtn, this.elProgContinueBtn, this.elProgRunBtn);
    box.append(line1, line2, line3);
    return box;
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
    r1.append(
      btnNsfw,
      btnXray,
      this.buildPixivBarCensorChip(!isForcedMaNsfw && !this.cfg.enable_multi_angle_nsfw)
    );

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
    r1.append(
      btnFreeNsfw,
      btnFreeXray,
      btnTrans,
      this.buildPixivBarCensorChip(!this.cfg.free_action_nsfw)
    );
    this.elContextCtrlBox.append(r1, this.buildPosSceneRow());
  }

  private buildPixivBarCensorChip(disabled = false): HTMLButtonElement {
    const mode = this.cfg.pixiv_bar_censor ?? "off";
    const isOn = !disabled && (mode === "white" || mode === "black" || mode === "mosaic");
    const label =
      disabled || mode === "off"
        ? "➖ Pixiv修正"
        : mode === "white"
          ? "⬜ Pixiv白条"
          : mode === "black"
            ? "⬛ Pixiv黑条"
            : "🔲 Pixiv马赛克";
    const btn = this.el("button", `chip-btn${isOn ? " active" : ""}`, label);
    btn.disabled = disabled;
    btn.title =
      "Pixiv 合规局部修正开关（仅遮挡私处、胸部/乳首完全无修）· 点击循环切换：关闭 ➔ 加厚白条 ➔ 加厚黑条 ➔ 局部马赛克";
    btn.addEventListener("click", () => {
      const cur = this.cfg.pixiv_bar_censor ?? "off";
      this.cfg.pixiv_bar_censor =
        cur === "off"
          ? "white"
          : cur === "white"
            ? "black"
            : cur === "black"
              ? "mosaic"
              : "off";
      this.onCfgChanged();
      this.renderRightModeView();
    });
    return btn;
  }

  private isCreatureOtherId(id: string): boolean {
    return id.startsWith("TN") || id.startsWith("BG");
  }

  private isOtherActionId(id: string): boolean {
    return id in OTHER_ACTION_TEMPLATES || this.isCreatureOtherId(id);
  }

  private getHumanPositionChapters() {
    return ALL_POSITIONS_CHAPTERS.filter((ch) => !this.isCreatureOtherId(ch.id));
  }

  private getAllOtherActionItems(): Array<{
    id: string;
    title: string;
    sub: string;
    category: string;
    camera_mode?: string;
    isCreature: boolean;
  }> {
    const sfCatMap: Record<string, string> = {
      "1. 对镜私拍": "3. 对镜私拍",
      "2. 场所露出": "4. 场所露出",
      "3. 奇特机位": "5. 奇特机位",
      "4. 束缚与UI": "6. 束缚与UI",
    };
    const creatures = ALL_POSITIONS_CHAPTERS.filter((ch) => this.isCreatureOtherId(ch.id)).map(
      (ch) => {
        const parsed = splitPoseTitle(ch.title);
        return {
          id: ch.id,
          title: parsed.main,
          sub: parsed.sub,
          category: ch.id.startsWith("TN") ? "1. 触手缠缚" : "2. 异形虫巢",
          isCreature: true,
        };
      }
    );
    const selfies = OTHER_ACTION_CHAPTERS.map((ch) => ({
      id: ch.id,
      title: ch.title,
      sub: ch.sub,
      category: sfCatMap[ch.category] || ch.category,
      camera_mode: ch.camera_mode,
      isCreature: false,
    }));
    return [...creatures, ...selfies];
  }

  private buildOtherActionContextControls(): void {
    const r1 = this.el("div", "ctrl-inline-row");
    const isCreature = this.isCreatureOtherId(this.activeSceneId);

    if (isCreature) {
      const tpl = ALL_POSITIONS_TEMPLATES[this.activeSceneId];
      const hasBuiltinXray = Boolean(tpl?.builtin_xray);
      const povSeg = this.el("div", "seg-group");
      for (const [pMode, lbl] of [
        ["pov", "👁️ POV (胯→头)"],
        ["3rd", "🎥 3rd (全景)"],
      ] as const) {
        const b = this.el(
          "button",
          `seg-btn${this.cfg.perspective_mode === pMode ? " active" : ""}`,
          lbl
        );
        b.title =
          pMode === "pov"
            ? "仰视第一视角（View B：胯部/接触点前景 ➔ 沿腹部透视向上看至脸部）"
            : "标准全景第三视角（View A：完整体位构图）";
        b.addEventListener("click", () => {
          this.cfg.perspective_mode = pMode;
          this.onCfgChanged();
          this.renderRightModeView();
        });
        povSeg.appendChild(b);
      }

      const btnXray = this.el(
        "button",
        `chip-btn${hasBuiltinXray || this.cfg.enable_uterus_xray ? " active" : ""}`,
        hasBuiltinXray ? "🔬 内置透视" : "🔬 内部透视"
      );
      btnXray.disabled = hasBuiltinXray;
      btnXray.title = hasBuiltinXray
        ? "当前触手/虫巢动作已内置腹部剖面透视"
        : "叠加内部剖面透视（女性/扶他显示子宫产卵，伪娘自动切换肠道剖面）";
      btnXray.addEventListener("click", () => {
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

      r1.append(povSeg, btnXray, btnTrans, this.buildPixivBarCensorChip(false));
      this.elContextCtrlBox.appendChild(r1);
      return;
    }

    const otherTpl = OTHER_ACTION_TEMPLATES[this.activeSceneId];
    const hasBuiltinXray = Boolean(
      otherTpl?.builtin_xray || otherTpl?.kitchen_duo?.channel === "builtin_xray"
    );
    const isKtd = this.activeSceneId.startsWith("KTD");
    const isPld = this.activeSceneId.startsWith("PLD");
    const isCv = this.activeSceneId.startsWith("CV");
    const isBt = this.activeSceneId.startsWith("BT");
    const isHwd = this.activeSceneId.startsWith("HWD");
    const isPs = this.activeSceneId.startsWith("PS");
    const isCp = this.activeSceneId.startsWith("CP");
    const isAfd = this.activeSceneId.startsWith("AFD");
    const isOns = this.activeSceneId.startsWith("ONS");
    const isCvDuo = this.activeSceneId === "CV04";
    const isKtSolo = this.activeSceneId.startsWith("KT") && !isKtd;
    const isPlSolo = this.activeSceneId.startsWith("PL") && !isPld;
    const hasCondomChip = isKtd || isPld || isCvDuo || isHwd || isPs || isCp || isAfd || isOns;
    const supportsInternalXray =
      isKtd || isPld || isKtSolo || isPlSolo || isCv || isBt || isHwd || isPs || isCp || isAfd || isOns;
    const isFemboy = (this.cfg.gender_mode ?? "normal") === "femboy";
    const xrayAllowed = supportsInternalXray || !isFemboy;

    const useSceneOutfit = this.cfg.other_use_scene_outfit !== false;
    const btnSceneOutfit = this.el(
      "button",
      `chip-btn${useSceneOutfit ? " active" : ""}`,
      useSceneOutfit ? "👗 场景专属穿搭: ON" : "👗 场景穿搭: OFF (用左侧)"
    );
    btnSceneOutfit.title =
      "开启：使用 SF 自拍专属穿搭、KTD/KT/HWD 纯白荷叶边裸围、PLD/PL 泳池专属水着、CV 储精吊带、或 BT 浴室湿身浴巾；关闭：改用左侧角色穿搭预设";
    btnSceneOutfit.addEventListener("click", () => {
      this.cfg.other_use_scene_outfit = !useSceneOutfit;
      this.onCfgChanged();
      this.renderRightModeView();
    });

    let btnCondom: HTMLButtonElement | null = null;
    if (hasCondomChip) {
      btnCondom = this.el(
        "button",
        `chip-btn${this.cfg.enable_condom ? " active" : ""}`,
        "🛡️ 安全套"
      );
      btnCondom.title =
        "开关双人厨房 (KTD01~KTD60) / 公共泳池 (PLD01~PLD22) / 双人采精 (CV04) / 家务干扰 (HWD01~HWD15) / 替身盖照 (PS01~PS04) / 露营野餐 (CP01~CP12) / 事后滑落 (AFD01~AFD15) / 温泉浴衣 (ONS01~ONS55) 动作的安全套表现词条";
      btnCondom.addEventListener("click", () => {
        this.cfg.enable_condom = !this.cfg.enable_condom;
        this.onCfgChanged();
        this.renderRightModeView();
      });
    }

    const btnXray = this.el(
      "button",
      `chip-btn${hasBuiltinXray || (xrayAllowed && this.cfg.enable_uterus_xray) ? " active" : ""}`,
      hasBuiltinXray ? "🔬 内置透视" : supportsInternalXray ? "🔬 内部透视" : "🔬 子宫透视"
    );
    btnXray.disabled = hasBuiltinXray || !xrayAllowed;
    btnXray.title = hasBuiltinXray
      ? "当前动作已内置刻度注射器/下腹剖面透视构图"
      : supportsInternalXray
        ? "叠加内部剖面透视（女性/扶他显示子宫或喉部透视，伪娘自动切换肠道剖面 cutaway）"
        : "叠加子宫内部剖面透视（常规女主/扶他可用）";
    btnXray.addEventListener("click", () => {
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

    if (btnCondom) {
      r1.append(btnSceneOutfit, btnCondom, btnXray, btnTrans, this.buildPixivBarCensorChip(false));
    } else {
      r1.append(btnSceneOutfit, btnXray, btnTrans, this.buildPixivBarCensorChip(false));
    }
    this.elContextCtrlBox.appendChild(r1);
  }

  private buildOtherActionFilterControls(): void {
    const searchRow = this.el("div", "pose-search-row");
    const searchInp = this.el("input") as HTMLInputElement;
    searchInp.type = "text";
    searchInp.placeholder =
      "🔍 搜索 TN / BG / SF / KTD / KT / PLD / PL / CV / BT / HWD / PS / CP / AFD / ONS 编号或关键词...";
    searchInp.value = this.otherSearchQuery;
    searchInp.addEventListener("input", () => {
      this.otherSearchQuery = searchInp.value.trim();
      this.renderPoseCards();
    });

    const btnCheckCat = this.el("button", "btn btn-xs", "☑️全选");
    btnCheckCat.title = "勾选当前筛选结果中的所有其他动作";
    btnCheckCat.addEventListener("click", () => {
      for (const ch of this.getFilteredOtherChapters()) {
        this.checkedOtherActionIds.add(ch.id);
      }
      this.renderPoseCards();
    });

    const btnClearCat = this.el("button", "btn btn-xs", "清空");
    btnClearCat.title = "清空已勾选的其他动作";
    btnClearCat.addEventListener("click", () => {
      this.checkedOtherActionIds.clear();
      this.renderPoseCards();
    });

    this.elBatchCheckedBtn = this.el("button", "btn btn-xs btn-primary", "🚀 连出勾选");
    this.elBatchCheckedBtn.addEventListener("click", () => this.runCheckedBatch());

    searchRow.append(searchInp, btnCheckCat, btnClearCat, this.elBatchCheckedBtn);

    const allOther = this.getAllOtherActionItems();
    const catScroll = this.el("div", "cat-pills-scroll");
    const baseCats = [
      "全部",
      "1. 触手缠缚",
      "2. 异形虫巢",
      "3. 对镜私拍",
      "4. 场所露出",
      "5. 奇特机位",
      "6. 束缚与UI",
      "7. 裸围厨房",
      "8. 厨房干扰",
      "9. 厨房单人",
      "10. 饭菜双人",
      "11. 饭菜单人",
      "12. 泳池双人",
      "13. 泳池伪装",
      "14. 泳池单人",
      "15. 储精自注",
      "16. 浴室玩具",
      "17. 家务干扰",
      "18. 替身盖照",
      "19. 露营野餐",
      "20. 事后滑落",
      "21. 温泉双人",
      "22. 温泉单人",
    ];
    const extraCats = Array.from(new Set(allOther.map((c) => c.category))).filter(
      (c) => !baseCats.includes(c)
    );
    const allCats = [...baseCats, ...extraCats];
    for (const cat of allCats) {
      const cnt =
        cat === "全部"
          ? allOther.length
          : allOther.filter((c) => c.category === cat).length;
      const lbl = cat === "全部" ? `全部 (${cnt})` : `${cat} (${cnt})`;
      const b = this.el(
        "button",
        `chip-btn${this.activeOtherCategory === cat ? " active" : ""}`,
        lbl
      );
      b.style.flexShrink = "0";
      b.title = cat;
      b.addEventListener("click", () => {
        this.activeOtherCategory = cat;
        if (cat !== "全部") {
          const curItem = allOther.find((it) => it.id === this.activeSceneId);
          if (curItem?.category !== cat) {
            const firstMatch = allOther.find((ch) => ch.category === cat);
            if (firstMatch) {
              this.selectScene(firstMatch.id);
            }
          }
        }
        this.elPoseFilterBar.innerHTML = "";
        this.buildOtherActionFilterControls();
        this.renderPoseCards();
      });
      catScroll.appendChild(b);
    }

    this.elPoseFilterBar.append(searchRow, catScroll);
    this.updateBatchCheckedButton();
  }

  private getFilteredOtherChapters() {
    const q = this.otherSearchQuery.toLowerCase();
    return this.getAllOtherActionItems().filter((ch) => {
      const catOk = this.activeOtherCategory === "全部" || ch.category === this.activeOtherCategory;
      if (!catOk) return false;
      if (!q) return true;
      return (
        ch.id.toLowerCase().includes(q) ||
        ch.title.toLowerCase().includes(q) ||
        ch.sub.toLowerCase().includes(q)
      );
    });
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

    const humanChapters = this.getHumanPositionChapters();
    const humanCategories = POS_CATEGORIES.filter(
      (c) => !c.startsWith("10.") && !c.startsWith("11.")
    );
    if (!humanCategories.includes(this.activePosCategory)) {
      this.activePosCategory = humanCategories[0];
    }

    const catScroll = this.el("div", "cat-pills-scroll");
    const shortCatLabel = (c: string) =>
      c === "全部体位 (All)" ? `全部 (${humanChapters.length})` : c.split("·")[0]?.trim() || c;
    for (const cat of humanCategories) {
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
            const firstMatch = humanChapters.find((ch) => ch.category === cat);
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
    return this.getHumanPositionChapters().filter((ch) => {
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
    const isOther = this.actionMode === "other";
    const items: Array<{
      id: string;
      title: string;
      sub?: string;
      camera_mode?: string;
      isCreature?: boolean;
    }> = isPos
      ? this.getFilteredPositionChapters()
      : isOther
        ? this.getFilteredOtherChapters()
        : MULTI_ANGLE_CHAPTERS;
    const checkedSet = isPos
      ? this.checkedPositionIds
      : isOther
        ? this.checkedOtherActionIds
        : this.checkedMultiAngleIds;

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
        (!isPos && !isOther && ch.id === "MA7" && this.activeSceneId.startsWith("MA7"));
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
      const parsed = isOther ? { main: ch.title, sub: ch.sub || "" } : splitPoseTitle(ch.title);
      const titleCol = this.el("div", "pose-title-col");
      titleCol.appendChild(this.el("span", "pose-main-title", parsed.main));
      const subText =
        isOther && !ch.isCreature && ch.camera_mode
          ? `${ch.camera_mode === "mirror" ? "🪞对镜" : ch.camera_mode === "direct" ? "📷直拍" : "📱界面"} · ${parsed.sub}`
          : parsed.sub;
      if (subText) {
        titleCol.appendChild(this.el("span", "pose-sub-title", subText));
      }

      const resolveMaId = (rawId: string) =>
        !isPos && !isOther && rawId === "MA7" && this.activeMa7Variant ? this.activeMa7Variant : rawId;

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
    } else if (this.actionMode === "other") {
      this.elContextCtrlBox.innerHTML = "";
      this.buildOtherActionContextControls();
    }
    this.refreshSceneAndPrompt();
    this.updateBatchCheckedButton();
  }

  private getEffectiveProgressionSceneIds(): string[] {
    const human = this.getHumanPositionChapters();
    if (this.checkedPositionIds.size > 0) {
      const matched = human.filter((c) => this.checkedPositionIds.has(c.id)).map((c) => c.id);
      if (matched.length > 0) return matched;
    }
    return this.activeSceneId in ALL_POSITIONS_TEMPLATES && !this.isCreatureOtherId(this.activeSceneId)
      ? [this.activeSceneId]
      : ["P01"];
  }

  private updateBatchCheckedButton(): void {
    if (this.elBatchCheckedBtn) {
      const set =
        this.actionMode === "positions"
          ? this.checkedPositionIds
          : this.actionMode === "other"
            ? this.checkedOtherActionIds
            : this.checkedMultiAngleIds;
      const n = set.size;
      this.elBatchCheckedBtn.textContent = `🚀 连出勾选 (${n})`;
      this.elBatchCheckedBtn.disabled = n === 0 || this.isGenerating;
    }
    this.updateStageProgressionActionButtons();
  }

  private getOrderedProgressionStages() {
    const selected = ORDERED_POS_STAGE_ENTRIES.filter((e) =>
      this.progSelectedStageCodes.has(e.code)
    );
    return selected.length >= 2 ? selected : ORDERED_POS_STAGE_ENTRIES.slice(0, 4);
  }

  private getStageProgressionContinuationTarget(): {
    anchor: GeneratedImageRecord;
    orderedChain: typeof ORDERED_POS_STAGE_ENTRIES;
    remainingStages: typeof ORDERED_POS_STAGE_ENTRIES;
    reasonIfEmpty?: string;
  } | null {
    const anchor = this.gallery[this.selectedGalleryIdx];
    if (!anchor) return null;
    const tpl = ALL_POSITIONS_TEMPLATES[anchor.scene_id];
    if (!tpl || tpl.channel === "tentacle") return null;

    const orderedChain = this.getOrderedProgressionStages();
    let remainingStages: typeof ORDERED_POS_STAGE_ENTRIES;
    if (anchor.stage_code) {
      const idx = orderedChain.findIndex((e) => e.code === anchor.stage_code);
      if (idx !== -1) {
        remainingStages = orderedChain.slice(idx + 1);
        if (remainingStages.length === 0) {
          return {
            anchor,
            orderedChain,
            remainingStages,
            reasonIfEmpty: `当前图 (${anchor.scene_id}) 已是所选递进链的最后一幕`,
          };
        }
      } else {
        remainingStages = orderedChain.slice(1);
      }
    } else {
      remainingStages = orderedChain.slice(1);
    }
    return { anchor, orderedChain, remainingStages };
  }

  private updateStageProgressionActionButtons(): void {
    if (this.actionMode !== "positions") return;
    const poseIds = this.getEffectiveProgressionSceneIds();
    const stageablePoses = poseIds.filter(
      (id) => ALL_POSITIONS_TEMPLATES[id]?.channel !== "tentacle"
    );
    const nonTentacleCount = stageablePoses.length;
    const orderedChain = this.getOrderedProgressionStages();
    const firstStage = orderedChain[0];
    const repeats = this.apiSettings.batch_count || 1;
    const scopeHint =
      this.checkedPositionIds.size > 0 ? `${poseIds.length}体位` : poseIds[0] || "P01";

    if (this.elProgFirstBtn) {
      const firstCount = nonTentacleCount * repeats;
      this.elProgFirstBtn.textContent = `🎯 先抽首幕 (${firstStage.compactPill}×${Math.max(1, firstCount)})`;
      this.elProgFirstBtn.disabled = this.isGenerating || nonTentacleCount === 0;
      this.elProgFirstBtn.title =
        nonTentacleCount === 0
          ? "触手/异种虫系动作已内置独立解剖阶段，请选择或勾选常规体位"
          : `第 1 步：只生成「${firstStage.key}」随机 Seed 候选图（共 ${firstCount} 张）。挑中满意的一张后，点右侧「⏩ 续出」锁定该图 Seed 续出后续阶段`;
    }

    if (this.elProgContinueBtn) {
      const target = this.getStageProgressionContinuationTarget();
      if (!target) {
        this.elProgContinueBtn.textContent = "⏩ 选中首幕图续出";
        this.elProgContinueBtn.disabled = true;
        this.elProgContinueBtn.title =
          "第 2 步：在画廊点击选中任意一张常规体位首幕图后，点击此按钮即可锁定该图 Seed 续出后续递进阶段";
      } else if (target.remainingStages.length === 0) {
        this.elProgContinueBtn.textContent = `⏩ ${target.anchor.scene_id} 已是末幕`;
        this.elProgContinueBtn.disabled = true;
        this.elProgContinueBtn.title = target.reasonIfEmpty || "当前图已是最后一幕";
      } else {
        const nextList = target.remainingStages.map((s) => s.compactPill).join("›");
        this.elProgContinueBtn.textContent = `⏩ 续出 ${target.anchor.scene_id} (+${target.remainingStages.length}张 · s${target.anchor.seed})`;
        this.elProgContinueBtn.disabled = this.isGenerating;
        this.elProgContinueBtn.title = `锁定当前选中图 ${target.anchor.scene_id} 的 Seed (${target.anchor.seed})，续出后续 ${target.remainingStages.length} 幕：${nextList}${this.progAutoGroupFolder ? "（并自动与首幕图归入同一分组）" : ""}`;
      }
    }

    if (this.elProgRunBtn) {
      const previewTasks = buildStageProgressionQueue({
        sceneIds: poseIds,
        selectedStageCodes: Array.from(this.progSelectedStageCodes),
        mode: this.progMode,
        lockSharedSeedPerPose: this.progLockSeedPerPose,
        baseFixedSeed: this.apiSettings.seed,
        repeatsPerStep: repeats,
      });
      this.elProgRunBtn.textContent = `📈 一键全递进 ${scopeHint} (${previewTasks.length}张)`;
      this.elProgRunBtn.disabled = this.isGenerating || nonTentacleCount === 0;
      this.elProgRunBtn.title =
        nonTentacleCount === 0
          ? "触手/异种虫系动作已内置独立解剖阶段，请选择或勾选常规体位 (P01~MP15) 执行阶段递进"
          : `不挑首幕直接按所选 ${this.progSelectedStageCodes.size} 个阶段连续生成共 ${previewTasks.length} 张图片`;
    }
  }

  private runStageProgressionFirstStep(): void {
    if (this.isGenerating || this.actionMode !== "positions") return;
    const stageablePoses = this.getEffectiveProgressionSceneIds().filter(
      (id) => ALL_POSITIONS_TEMPLATES[id]?.channel !== "tentacle"
    );
    if (stageablePoses.length === 0) {
      this.setStatus("⚠️ 当前选中的触手/虫系动作已内置固定阶段，请切换或勾选常规体位", true);
      return;
    }
    const orderedChain = this.getOrderedProgressionStages();
    const firstStage = orderedChain[0];
    const repeats = this.apiSettings.batch_count || 1;
    const tasks: Array<{
      sceneId: string;
      forceRandomSeed?: boolean;
      stagePresetKeyOverride?: string;
      stageCode?: string;
      targetGroupFolder?: string;
    }> = [];
    for (const poseId of stageablePoses) {
      for (let r = 0; r < repeats; r++) {
        tasks.push({
          sceneId: poseId,
          forceRandomSeed: true,
          stagePresetKeyOverride: firstStage.key,
          stageCode: firstStage.code,
          targetGroupFolder: this.pinnedTargetFolderName || undefined,
        });
      }
    }
    this.setStatus(
      `🎯 第 1 步：正在随机抽取 ${firstStage.compactPill} 首幕候选（共 ${tasks.length} 张），挑中后选中图片点「⏩ 续出」锁定同 Seed 续出后续阶段`
    );
    void this.runGenerationQueue(tasks);
  }

  private async runStageProgressionContinueFromSelected(): Promise<void> {
    if (this.isGenerating || this.actionMode !== "positions") return;
    const target = this.getStageProgressionContinuationTarget();
    if (!target || target.remainingStages.length === 0) {
      this.setStatus(
        target?.reasonIfEmpty ||
          "⚠️ 请先在画廊中选中一张常规体位的首幕图，再点击「⏩ 续出」",
        true
      );
      return;
    }

    const { anchor, orderedChain, remainingStages } = target;
    let targetFolder = anchor.group_folder;
    if (!targetFolder && this.progAutoGroupFolder) {
      const folderTag = `${anchor.scene_id}_递进${orderedChain.length}幕_s${anchor.seed}_${formatTimeHHMMSS()}`;
      targetFolder = this.ensureGalleryFolderExists(folderTag);
      await this.moveGalleryRecordsToFolder([anchor.id], targetFolder);
      this.openedFolderName = targetFolder;
      this.renderFilmstrip();
    } else if (!targetFolder && this.pinnedTargetFolderName) {
      targetFolder = this.pinnedTargetFolderName;
    }

    const nextSummary = remainingStages.map((s) => s.compactPill).join(" ➔ ");
    this.setStatus(
      `⏩ 锁定 ${anchor.scene_id} Seed (${anchor.seed})，续出后续 ${remainingStages.length} 幕：${nextSummary}`
    );

    void this.runGenerationQueue(
      remainingStages.map((st) => ({
        sceneId: anchor.scene_id,
        fixedSeedOverride: anchor.seed,
        stagePresetKeyOverride: st.key,
        stageCode: st.code,
        targetGroupFolder: targetFolder,
      }))
    );
  }

  private runStageProgressionBatch(): void {
    if (this.isGenerating || this.actionMode !== "positions") return;
    const poseIds = this.getEffectiveProgressionSceneIds();
    const hasStageable = poseIds.some((id) => ALL_POSITIONS_TEMPLATES[id]?.channel !== "tentacle");
    if (!hasStageable) {
      this.setStatus("⚠️ 当前选中的触手/虫系动作已内置固定阶段，请切换或勾选常规体位执行递进", true);
      return;
    }

    let targetFolder: string | undefined;
    if (this.progAutoGroupFolder) {
      const tag =
        poseIds.length === 1
          ? `${poseIds[0]}_递进${this.progSelectedStageCodes.size}幕_${formatTimeHHMMSS()}`
          : `剧情递进_${poseIds.length}幕_${formatTimeHHMMSS()}`;
      targetFolder = this.ensureGalleryFolderExists(tag);
      this.openedFolderName = targetFolder;
    } else if (this.pinnedTargetFolderName) {
      targetFolder = this.pinnedTargetFolderName;
    }

    const progTasks = buildStageProgressionQueue({
      sceneIds: poseIds,
      selectedStageCodes: Array.from(this.progSelectedStageCodes),
      mode: this.progMode,
      lockSharedSeedPerPose: this.progLockSeedPerPose,
      baseFixedSeed: this.apiSettings.seed,
      repeatsPerStep: this.apiSettings.batch_count || 1,
      targetGroupFolder: targetFolder,
    });
    if (progTasks.length === 0) return;

    void this.runGenerationQueue(
      progTasks.map((pt) => ({
        sceneId: pt.sceneId,
        fixedSeedOverride: pt.fixedSeedOverride,
        stagePresetKeyOverride: pt.stagePresetKey || undefined,
        stageCode: pt.stageCode || undefined,
        targetGroupFolder: pt.targetGroupFolder,
      }))
    );
  }

  private runCheckedBatch(): void {
    const orderedIds =
      this.actionMode === "positions"
        ? this.getHumanPositionChapters()
            .filter((c) => this.checkedPositionIds.has(c.id))
            .map((c) => c.id)
        : this.actionMode === "other"
          ? this.getAllOtherActionItems()
              .filter((c) => this.checkedOtherActionIds.has(c.id))
              .map((c) => c.id)
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
    this.elRestorePopover?.classList.add("hidden");
  }

  private elRestoreSeedBtn!: HTMLButtonElement;
  private elRestoreCfgBtn!: HTMLButtonElement;

  private buildRestoreRecordPopover(): HTMLElement {
    const pop = this.el("div", "floating-popover popover-w-330 hidden");
    pop.addEventListener("click", (ev) => ev.stopPropagation());

    const head = this.el("div", "popover-head");
    head.appendChild(this.el("span", "", "🧬 历史成图参数与词条回溯"));
    const btnClose = this.el("button", "btn btn-xs btn-icon", "✕");
    btnClose.addEventListener("click", () => pop.classList.add("hidden"));
    head.appendChild(btnClose);

    const col = this.el("div", "restore-pop-actions");

    this.elRestoreCfgBtn = this.el(
      "button",
      "btn btn-primary",
      "🧬 完整回填此图角色/画风/光影配置 + 体位"
    );
    this.elRestoreCfgBtn.addEventListener("click", () => {
      const rec = this.gallery[this.selectedGalleryIdx];
      if (!rec) return;
      this.restoreRecordFullConfig(rec);
      pop.classList.add("hidden");
    });

    this.elRestoreSeedBtn = this.el("button", "btn", "🎲 锁定此图 Seed");
    this.elRestoreSeedBtn.addEventListener("click", () => {
      const rec = this.gallery[this.selectedGalleryIdx];
      if (!rec) return;
      this.apiSettings.seed = rec.seed;
      saveApiSettings(this.apiSettings);
      this.syncApiControls();
      pop.classList.add("hidden");
      this.setStatus(`🎲 已锁定 Seed 为 ${rec.seed}（切换其他动作将沿用此种子）`);
    });

    const btnRestorePrompts = this.el(
      "button",
      "btn",
      "📝 仅回填此图正/负向词条（手改锁定）"
    );
    btnRestorePrompts.addEventListener("click", () => {
      const rec = this.gallery[this.selectedGalleryIdx];
      if (!rec) return;
      this.elPosTextarea.value = rec.prompt_pos || "";
      this.elNegTextarea.value = rec.prompt_neg || "";
      this.isManualPromptEdited = true;
      this.elManualLockPill.style.display = "inline-flex";
      if (!this.promptDrawerExpanded) {
        this.togglePromptDrawer(true);
      }
      this.updateTokenBadgeFromBoxes();
      pop.classList.add("hidden");
      this.setStatus(`📝 已回填 ${rec.scene_id} 的正/负向提示词并锁定手改模式`);
    });

    const btnResetRandomSeed = this.el("button", "btn btn-xs", "🔀 恢复随机 Seed (-1)");
    btnResetRandomSeed.addEventListener("click", () => {
      this.apiSettings.seed = -1;
      saveApiSettings(this.apiSettings);
      this.syncApiControls();
      pop.classList.add("hidden");
      this.setStatus("🔀 已恢复随机种子 (-1)");
    });

    col.append(this.elRestoreCfgBtn, this.elRestoreSeedBtn, btnRestorePrompts, btnResetRandomSeed);
    pop.append(head, col);
    return pop;
  }

  private refreshRestorePopoverLabels(): void {
    const rec = this.gallery[this.selectedGalleryIdx];
    if (!rec) return;
    this.elRestoreSeedBtn.textContent = `🎲 仅锁定此图 Seed (${rec.seed})`;
    this.elRestoreCfgBtn.disabled = !rec.config_snapshot;
    this.elRestoreCfgBtn.textContent = rec.config_snapshot
      ? `🧬 完整回填 ${rec.scene_id} 配置快照 + 采样参数`
      : "🧬 无配置快照（仅支持回填 Seed / 词条）";
  }

  private buildMcpPopover(): HTMLElement {
    const pop = this.el("div", "floating-popover popover-w-360 hidden");
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
      pop.style.bottom = "calc(62px + env(safe-area-inset-bottom, 0px))";
      return;
    }
    pop.style.width = "";
    pop.style.right = "";
    pop.style.bottom = "";
    const rect = anchor.getBoundingClientRect();
    const popW = Math.min(pop.offsetWidth || 420, window.innerWidth - 20);
    const left = Math.max(10, Math.min(rect.left, window.innerWidth - popW - 10));
    const measuredH = Math.min(pop.offsetHeight || 360, window.innerHeight - 70);
    const top = Math.min(rect.bottom + 6, window.innerHeight - measuredH - 12);
    pop.style.left = `${left}px`;
    pop.style.top = `${Math.max(54, top)}px`;
  }

  private buildSavePresetPopover(): HTMLElement {
    const pop = this.el("div", "floating-popover popover-w-320 hidden");
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

    this.elLightboxStarBtn = this.el("button", "btn btn-xs", "☆ 收藏");
    this.elLightboxStarBtn.addEventListener("click", () => {
      const rec = this.gallery[this.lightboxIdx];
      if (rec) void this.toggleGalleryStar(rec.id);
    });

    const btnLbReroll = this.el("button", "btn btn-xs btn-primary", "🎲 重抽此图");
    btnLbReroll.addEventListener("click", () => {
      const rec = this.gallery[this.lightboxIdx];
      if (!rec) return;
      this.selectedGalleryIdx = this.lightboxIdx;
      this.closeLightbox();
      void this.startOrContinueShootout(rec.id, this.rerollCountPerRound);
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

    const btnLbDel = this.el("button", "btn btn-xs btn-danger", "🗑️ 删除");
    btnLbDel.addEventListener("click", () => {
      const rec = this.gallery[this.lightboxIdx];
      if (rec) void this.deleteGalleryRecordsByIds([rec.id], `🗑️ 已删除 ${rec.scene_id}`);
    });

    ctrls.append(modeSeg, intSel, this.elLightboxStarBtn, btnLbReroll, btnLbUpscale, btnLbDl, btnLbDel);
    top.append(headRow, ctrls);

    const stage = this.el("div", "lightbox-stage");
    let swipeStartX = 0;
    let swipeStartY = 0;
    let swipeMultiTouch = false;
    let lastSwipeAt = 0;

    stage.addEventListener(
      "touchstart",
      (ev: TouchEvent) => {
        if (ev.touches.length !== 1) {
          swipeMultiTouch = true;
          return;
        }
        swipeMultiTouch = false;
        swipeStartX = ev.touches[0].clientX;
        swipeStartY = ev.touches[0].clientY;
      },
      { passive: true }
    );
    stage.addEventListener(
      "touchmove",
      (ev: TouchEvent) => {
        if (ev.touches.length > 1) {
          swipeMultiTouch = true;
        }
      },
      { passive: true }
    );
    stage.addEventListener(
      "touchend",
      (ev: TouchEvent) => {
        if (swipeMultiTouch || !this.lightboxOpen || this.gallery.length <= 1) return;
        const zoom = window.visualViewport?.scale ?? 1;
        if (zoom > 1.05) return;
        const t = ev.changedTouches[0];
        if (!t) return;
        const dx = t.clientX - swipeStartX;
        const dy = t.clientY - swipeStartY;
        if (Math.abs(dx) > 48 && Math.abs(dx) > 1.5 * Math.abs(dy)) {
          lastSwipeAt = performance.now();
          this.stepLightbox(dx < 0 ? 1 : -1, true);
        }
      },
      { passive: true }
    );

    stage.addEventListener("click", (ev) => {
      if (performance.now() - lastSwipeAt < 320) return;
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
    const filtered = this.getFilteredGalleryIndices();
    const pool = filtered.length > 0 ? filtered : this.gallery.map((_, i) => i);
    if (pool.length === 0) return;
    if (isManualUserClick && this.carouselMode !== "manual") {
      this.setCarouselMode("manual");
    }
    const curPos = pool.indexOf(this.lightboxIdx);
    const nextPos =
      curPos === -1
        ? delta >= 0
          ? 0
          : pool.length - 1
        : (curPos + delta + pool.length) % pool.length;
    this.lightboxIdx = pool[nextPos];
    this.selectedGalleryIdx = this.lightboxIdx;
    this.renderLightboxFrame();
    this.renderHeroViewport();
    this.renderFilmstrip();
  }

  private renderLightboxFrame(): void {
    if (!this.lightboxOpen || this.gallery.length === 0) return;
    const rec = this.gallery[this.lightboxIdx];
    if (!rec) return;
    this.elLightboxImg.src = rec.objectUrl;
    this.elLightboxMeta.textContent = `[${this.lightboxIdx + 1}/${this.gallery.length}] ${rec.is_starred ? "⭐ " : ""}${rec.scene_id} · ${rec.width}×${rec.height}${rec.is_upscaled ? " (2x HD)" : ""} · Seed ${rec.seed}`;
    if (this.elLightboxStarBtn) {
      this.elLightboxStarBtn.textContent = rec.is_starred ? "⭐ 已收藏" : "☆ 收藏";
      this.elLightboxStarBtn.classList.toggle("btn-star-on", Boolean(rec.is_starred));
    }
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
    const availPresetKeys = this.getAllAvailablePresetKeys();
    if (this.cfg.preset_name && availPresetKeys.includes(this.cfg.preset_name)) {
      if (this.elPresetSelect && this.elPresetSelect.value !== this.cfg.preset_name) {
        this.elPresetSelect.value = this.cfg.preset_name;
      }
      if (this.elLeftPresetSelect && this.elLeftPresetSelect.value !== this.cfg.preset_name) {
        this.elLeftPresetSelect.value = this.cfg.preset_name;
      }
    }
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
    this.elStyleSwitch.classList.toggle("on", styleOn);
    this.elStyleSwitch.textContent = styleOn ? "ON" : "OFF";
    const activeVibeCount = isV45 ? this.getActiveVibeSlots().length : 0;
    this.elStyleSummary.textContent =
      activeVibeCount > 0 ? `+${activeVibeCount}槽Vibe` : compactOptionText(this.cfg.style_preset, 14);
    this.syncMobileNavState();
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
    if (this.elMobileStepsSelect) {
      const presetSteps = [14, 20, 24, 28, 36, 50];
      const existingCustom = this.elMobileStepsSelect.querySelector(
        'option[data-custom-step="1"]'
      ) as HTMLOptionElement | null;
      if (!presetSteps.includes(effSteps)) {
        const opt = existingCustom ?? this.el("option", "", "");
        opt.dataset.customStep = "1";
        opt.value = String(effSteps);
        opt.textContent = `${effSteps}步`;
        if (!existingCustom) this.elMobileStepsSelect.appendChild(opt);
      } else if (existingCustom) {
        existingCustom.remove();
      }
      this.elMobileStepsSelect.value = String(effSteps);
      this.elMobileStepsSelect.disabled = isV5Med;
    }
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

    const batt = formatOpusBatterySummary(this.subInfo);
    this.elApiSummary.textContent = this.apiSettings.api_token.trim()
      ? `${batt.hasBattery ? `🔋${batt.percentText} · ` : ""}${effSteps}步 · UC:${this.elUcModeSelect.value}`
      : "⚠️ 待填Token";
    this.syncMobileNavState();
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
    const autoUp = Boolean(this.apiSettings.auto_upscale_replace);
    this.elAutoUpscaleBtn.classList.toggle("active", autoUp);
    if (this.elMobileUpscaleBtn) {
      this.elMobileUpscaleBtn.classList.toggle("active", autoUp);
    }
    this.elAutoCarouselBtn.classList.toggle(
      "active",
      Boolean(this.apiSettings.auto_fullscreen_carousel)
    );
    const rec = this.gallery[this.selectedGalleryIdx];
    const hasRec = Boolean(rec);
    this.elUpscaleBtn.disabled = !rec || Boolean(rec.is_upscaled) || this.isGenerating;
    if (this.elStarCurBtn) {
      this.elStarCurBtn.disabled = !hasRec;
      this.elStarCurBtn.textContent = rec?.is_starred ? "⭐ 已收藏" : "☆ 收藏";
      this.elStarCurBtn.classList.toggle("btn-star-on", Boolean(rec?.is_starred));
    }
    if (this.elRerollCurBtn) {
      this.elRerollCurBtn.disabled = !hasRec || this.isGenerating;
    }
    if (this.elRestoreTriggerBtn) {
      this.elRestoreTriggerBtn.disabled = !hasRec;
    }
    if (this.elDeleteCurBtn) {
      this.elDeleteCurBtn.disabled = !hasRec || this.isGenerating;
    }
    if (this.elStageGridBtn) {
      this.elStageGridBtn.disabled = this.gallery.length === 0;
      this.elStageGridBtn.classList.toggle("btn-primary", this.stageViewMode === "grid");
    }
    if (this.elStageCompareBtn) {
      this.elStageCompareBtn.disabled = this.gallery.length < 2;
      this.elStageCompareBtn.classList.toggle("btn-primary", this.stageViewMode === "compare");
    }
    if (this.elBatchUpscaleGalleryBtn) {
      const checked1x = this.gallery.filter(
        (g) => this.checkedGalleryIds.has(g.id) && !g.is_upscaled
      ).length;
      this.elBatchUpscaleGalleryBtn.disabled = checked1x === 0 || this.isGenerating;
      this.elBatchUpscaleGalleryBtn.textContent =
        checked1x > 0 ? `✨ 批量2x(${checked1x})` : "✨ 批量2x";
    }
    if (this.elBatchDeleteGalleryBtn) {
      const chkCnt = this.checkedGalleryIds.size;
      this.elBatchDeleteGalleryBtn.disabled = chkCnt === 0 || this.isGenerating;
      this.elBatchDeleteGalleryBtn.textContent =
        chkCnt > 0 ? `🗑️ 删已选(${chkCnt})` : "🗑️ 删已选";
    }
    if (this.elBatchMoveFolderSelect) {
      const chkCnt = this.checkedGalleryIds.size;
      this.elBatchMoveFolderSelect.disabled =
        (chkCnt === 0 && !hasRec) || this.isGenerating;
      const headOpt = this.elBatchMoveFolderSelect.options[0];
      if (headOpt) {
        headOpt.textContent =
          chkCnt > 0 ? `📥 移入文件夹(${chkCnt})` : "📥 移入文件夹";
      }
    }
    this.updateStageProgressionActionButtons();
    this.syncMobileNavState();
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
      if (nextModel === MODEL_V4_5_FULL && (curScale === 6.0 || curScale === 6.5)) {
        this.apiSettings.scale = 7.0;
      } else if (nextModel === MODEL_V5_FULL) {
        if (curScale <= 6.0 || curScale === 7.0) {
          this.apiSettings.scale = 6.5;
        }
        if (prev === MODEL_V4_5_FULL && this.apiSettings.cfg_rescale > 0) {
          this.apiSettings.cfg_rescale = 0.0;
        }
      } else if (nextModel === MODEL_V5_FULL_MEDIUM) {
        if (curScale >= 6.5 || curScale === 5.0) {
          this.apiSettings.scale = 6.0;
        }
        this.apiSettings.cfg_rescale = 0.0;
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
    this.syncMobileNavState();
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
    if (!this.subInfo || this.subInfo.tier !== 3 || !this.subInfo.active) {
      return false;
    }
    if (this.apiSettings.model === MODEL_V4_5_FULL) {
      return true;
    }
    const totalCharge =
      (this.subInfo.opus_usage_percent ?? 100) + (this.subInfo.opus_purchased_percent ?? 0);
    return !this.subInfo.opus_usage_negative && totalCharge > 0;
  }

  private updateQuotaPill(): void {
    if (!this.elQuotaPill) return;
    this.elQuotaPill.innerHTML = "";
    if (!this.apiSettings.api_token.trim()) {
      this.elQuotaPill.textContent = "🔑 点击填Token";
      this.elQuotaPill.className = "quota-pill warn";
      this.elQuotaPill.title = "点击打开 API 令牌设置，填写 pst-... 永久令牌";
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
      const batt = formatOpusBatterySummary(this.subInfo);
      this.elQuotaPill.appendChild(this.el("span", "", tierStr));
      if (batt.hasBattery) {
        const battBadge = this.el("span", `opus-batt-badge ${batt.level}`);
        const bar = this.el("span", "opus-batt-bar");
        const fill = this.el("span", "opus-batt-fill");
        fill.style.width = `${batt.fillPercent}%`;
        bar.appendChild(fill);
        battBadge.append(bar, this.el("span", "", batt.percentText));
        this.elQuotaPill.appendChild(battBadge);
      }
      this.elQuotaPill.appendChild(
        this.el("span", "quota-verbose-txt", `· ${this.subInfo.anlas_left}点 (本次~${totalEst}点)`)
      );
      if (!batt.hasBattery) {
        this.elQuotaPill.appendChild(
          this.el("span", "quota-compact-txt", `· ${this.subInfo.anlas_left}`)
        );
      }
      const isDepletedWarn = totalEst > 0 || (this.subInfo.tier === 3 && batt.hasBattery && batt.level === "low");
      this.elQuotaPill.className = isDepletedWarn ? "quota-pill warn" : "quota-pill";
      const tipLines = [
        `套餐状态：${this.subInfo.tier_name} (${this.subInfo.active ? "有效" : "未激活"})`,
      ];
      if (batt.hasBattery) {
        tipLines.push(
          `Opus 电池电量：${batt.percentText}${batt.rechargeHint ? `（${batt.rechargeHint}）` : ""}`
        );
      }
      tipLines.push(
        `剩余 Anlas：${this.subInfo.anlas_left} 点（固定 ${this.subInfo.fixed_anlas} + 购买 ${this.subInfo.purchased_anlas}）`,
        `当前生图预估：本次约 ${totalEst} 点 · 点击立即刷新实时电量与点数`
      );
      this.elQuotaPill.title = tipLines.join("\n");
    } else {
      this.elQuotaPill.textContent = `⚡ 预估 ~${totalEst} Anlas`;
      this.elQuotaPill.className = "quota-pill";
      this.elQuotaPill.title = "点击查询 NovelAI 账户 Opus 电池电量与剩余 Anlas";
    }
  }

  private async refreshSubscription(silent = false): Promise<void> {
    if (!this.apiSettings.api_token.trim()) return;
    try {
      this.subInfo = await fetchSubscriptionInfo(this.apiSettings.api_token);
      this.updateQuotaPill();
      this.syncApiControls();
      if (!silent) {
        const batt = formatOpusBatterySummary(this.subInfo);
        const battMsg = batt.hasBattery
          ? ` · 🔋Opus电池 ${batt.percentText}${batt.rechargeHint ? ` (${batt.rechargeHint})` : ""}`
          : "";
        this.setStatus(
          `✅ 账户已连接：${this.subInfo.tier_name}${battMsg} · 剩余 ${this.subInfo.anlas_left} Anlas`
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
    tasks: Array<{
      sceneId: string;
      useManualPrompt?: boolean;
      forceRandomSeed?: boolean;
      fixedSeedOverride?: number;
      stagePresetKeyOverride?: string;
      stageCode?: string;
      targetGroupFolder?: string;
    }>
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
    // Option A: Auto-collapse portrait compact overlays on generate (preserving manual prompt lock!)
    if (this.isPortraitCompactStage) {
      if (this.filmstripExpanded) {
        this.setFilmstripExpanded(false);
      }
      if (this.promptDrawerExpanded) {
        this.togglePromptDrawer(false);
      }
    }

    const activeVibes = this.getActiveVibeSlots();
    const safeLimit = computeSafePosTokenLimit({
      isV45: this.apiSettings.model === MODEL_V4_5_FULL,
      activeVibeCount: activeVibes.length,
    });
    this.cfg.pos_token_limit = safeLimit;

    const sessionFolder = `${formatDateYYYYMMDD()}_${(this.cfg.eng_name || "Studio").replace(/[^a-zA-Z0-9_-]/g, "")}`;
    if (this.stageViewMode === "shootout") {
      this.stageViewMode = "single";
      this.shootoutState = null;
    }

    try {
      for (let i = 0; i < tasks.length; i++) {
        if (this.abortController.signal.aborted) break;
        const task = tasks[i];
        const isTentaclePose = ALL_POSITIONS_TEMPLATES[task.sceneId]?.channel === "tentacle";
        const effectiveCfg: CharacterConfig =
          task.stagePresetKeyOverride && !isTentaclePose
            ? { ...this.cfg, pos_stage: task.stagePresetKeyOverride }
            : this.cfg;
        const genItems = generateScenePrompts(task.sceneId, effectiveCfg);
        const sceneItem = genItems[0];
        if (!sceneItem) continue;

        let rawPosPrompt: string;
        let customNeg: string;
        if (task.useManualPrompt && !task.stagePresetKeyOverride) {
          rawPosPrompt = this.elPosTextarea.value.trim();
          customNeg = this.elNegTextarea.value.trim();
        } else {
          const sp = splitPromptPosAndNeg(sceneItem.prompt);
          rawPosPrompt = sp.posPrompt;
          customNeg = sp.negPrompt;
        }

        const isPixelC5 = isC5LowresPixelStyleActive(effectiveCfg);
        const [w, h] = isPixelC5
          ? sceneItem.canvas.includes("384x512")
            ? [384, 512]
            : [512, 384]
          : parseCanvasSize(sceneItem.canvas, this.apiSettings.canvas_preset);

        const reqSeed =
          typeof task.fixedSeedOverride === "number" && task.fixedSeedOverride >= 0
            ? task.fixedSeedOverride
            : task.forceRandomSeed || tasks.length > 1
              ? -1
              : this.apiSettings.seed;
        const snap = this.captureCurrentConfigSnapshot();
        snap.cfg = JSON.parse(JSON.stringify(effectiveCfg)) as CharacterConfig;

        const stageBadge = formatStageBadgeLabel(task.stageCode);
        const stageProgressHint = stageBadge ? ` · ${stageBadge}` : "";
        const tStart = performance.now();
        this.startLiveTimerLabel(
          `[${i + 1}/${tasks.length}] 正在生成 ${task.sceneId}${stageProgressHint}${this.apiSettings.auto_upscale_replace && !isPixelC5 ? " (+自动2x高清)" : ""}`,
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
            `[${i + 1}/${tasks.length}] 正在执行 2x 高清放大替换 ${task.sceneId}${stageProgressHint}`,
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
        const stageFileTag = task.stageCode ? `_${formatStageFileTag(task.stageCode)}` : "";
        const filename = `${timeTag}_${task.sceneId}${stageFileTag}_s${res.seed}${isUpscaled ? "_2x" : ""}${ext}`;
        const copyForBlob = new Uint8Array(finalBytes.byteLength);
        copyForBlob.set(finalBytes);
        const objectUrl = URL.createObjectURL(new Blob([copyForBlob], { type: "image/png" }));

        const effectiveFolderRaw = task.targetGroupFolder ?? this.pinnedTargetFolderName ?? "";
        const assignedGroupFolder = effectiveFolderRaw
          ? this.ensureGalleryFolderExists(effectiveFolderRaw) || undefined
          : undefined;
        const diskPath = resolveRecordDiskSubpath(sessionFolder, assignedGroupFolder, false);

        const rec: GeneratedImageRecord = {
          id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          scene_id: task.sceneId,
          mode_label: effectiveCfg.perspective_mode,
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
          is_starred: false,
          disk_subpath: diskPath,
          config_snapshot: snap,
          group_folder: assignedGroupFolder,
          stage_code: task.stageCode,
        };

        // Save to mounted local directory (automatically creates group subfolder if assigned!)
        const savedPath = await saveBytesToMountedDir(diskPath, filename, finalBytes);
        if (savedPath) rec.saved_to_dir = true;

        if (this.apiSettings.auto_download) {
          triggerBytesDownload(finalBytes, filename);
        }

        this.gallery.push(rec);
        if (getMountedDirName()) {
          await syncPromptsLogToMountedDir(this.gallery, [diskPath]);
        }
        this.selectedGalleryIdx = this.gallery.length - 1;
        if (this.galleryFilterMode === "starred" || (this.galleryFilterMode === "upscaled" && !isUpscaled)) {
          this.galleryFilterMode = "all";
        }
        this.renderHeroViewport();
        this.renderFilmstrip();
        this.setStatus(
          `✅ ${rec.scene_id}${stageProgressHint}${assignedGroupFolder ? ` [📁${assignedGroupFolder}]` : ""} · ${rec.width}×${rec.height}${rec.is_upscaled ? " [2x HD]" : ""} · Seed: ${rec.seed} · ${rec.elapsed_sec}s${rec.saved_to_dir ? " · 📂已落盘" : ""}`
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
      if (this.stageViewMode !== "single") {
        this.renderHeroViewport();
      } else {
        this.syncStageToolbar();
      }
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

  private captureCurrentConfigSnapshot(): GeneratedConfigSnapshot {
    return {
      cfg: JSON.parse(JSON.stringify(this.cfg)) as CharacterConfig,
      action_mode: this.actionMode,
      model: this.apiSettings.model,
      steps: this.apiSettings.steps,
      scale: this.apiSettings.scale,
      cfg_rescale: this.apiSettings.cfg_rescale,
      uc_preset_mode: this.apiSettings.uc_preset_mode,
      extra_uc: this.apiSettings.extra_uc,
      append_v5_quality: this.apiSettings.append_v5_quality,
    };
  }

  private async upscaleSelectedGalleryImage(): Promise<void> {
    const rec = this.gallery[this.selectedGalleryIdx];
    if (!rec || rec.is_upscaled || this.isGenerating) return;
    await this.upscaleGalleryRecordsByIds([rec.id]);
  }

  private async upscaleGalleryRecordsByIds(ids: string[]): Promise<void> {
    const targets = ids
      .map((id) => this.gallery.find((g) => g.id === id))
      .filter((g): g is GeneratedImageRecord => Boolean(g && !g.is_upscaled));
    if (targets.length === 0 || this.isGenerating) return;
    if (!this.apiSettings.api_token.trim()) {
      this.setStatus("⚠️ 请先填写 API Token", true);
      return;
    }

    this.isGenerating = true;
    this.abortController = new AbortController();
    this.elHeroGenBtn.style.display = "none";
    this.elStopGenBtn.style.display = "inline-flex";
    this.syncStageToolbar();
    this.elProgressBanner.style.display = "inline-flex";

    let doneCount = 0;
    let starredTouched = false;
    const touchedDiskPaths: string[][] = [];

    try {
      for (let i = 0; i < targets.length; i++) {
        if (this.abortController.signal.aborted) break;
        const rec = targets[i];
        const t0 = performance.now();
        this.startLiveTimerLabel(
          targets.length > 1
            ? `[${i + 1}/${targets.length}] 🔍 正在批量 2x 放大 ${rec.scene_id}`
            : `🔍 正在 2x 放大 ${rec.scene_id}`,
          t0
        );

        const up = await upscaleSingleImageNai({
          apiToken: this.apiSettings.api_token,
          imageBytes: rec.bytes,
          signal: this.abortController.signal,
        });
        const oldFilename = rec.filename;
        URL.revokeObjectURL(rec.objectUrl);
        const copy = new Uint8Array(up.imageBytes.byteLength);
        copy.set(up.imageBytes);
        rec.bytes = up.imageBytes;
        rec.objectUrl = URL.createObjectURL(new Blob([copy], { type: "image/png" }));
        rec.width = up.outWidth;
        rec.height = up.outHeight;
        rec.is_upscaled = true;
        rec.filename = rec.filename.replace(/(\.[^.]+)$/, "_2x$1");
        if (rec.is_starred) starredTouched = true;

        if (getMountedDirName()) {
          const defaultFolder = `${formatDateYYYYMMDD()}_${(this.cfg.eng_name || "Studio").replace(/[^a-zA-Z0-9_-]/g, "")}`;
          const subPath =
            rec.disk_subpath && rec.disk_subpath.length > 0
              ? rec.disk_subpath
              : resolveRecordDiskSubpath(defaultFolder, rec.group_folder, rec.is_starred);
          const saved = await saveBytesToMountedDir(subPath, rec.filename, rec.bytes);
          if (saved) {
            rec.saved_to_dir = true;
            rec.disk_subpath = [...subPath];
            if (oldFilename !== rec.filename) {
              await deleteFileFromMountedDir(subPath, oldFilename);
            }
            touchedDiskPaths.push([...subPath]);
          }
        }
        doneCount++;
        this.renderHeroViewport();
        this.renderFilmstrip();
        if (this.lightboxOpen) this.renderLightboxFrame();
      }

      if (starredTouched) {
        await saveStarredGalleryRecords(this.gallery);
      }
      if (getMountedDirName() && touchedDiskPaths.length > 0) {
        await syncPromptsLogToMountedDir(this.gallery, touchedDiskPaths);
      }
      if (doneCount > 0) {
        const last = targets[Math.min(doneCount - 1, targets.length - 1)];
        this.setStatus(
          targets.length > 1
            ? `✨ 批量 2x 放大完成 (${doneCount}/${targets.length} 张)`
            : `✨ 2x 放大完成：${last.scene_id} · ${last.width}×${last.height}`
        );
      }
    } catch (err) {
      if (!this.abortController.signal.aborted) {
        this.setStatus(
          `❌ 2x 放大失败：${err instanceof Error ? err.message : String(err)}`,
          true
        );
      } else {
        this.setStatus(`⏹ 已停止批量 2x 放大（已完成 ${doneCount} 张）`);
      }
    } finally {
      this.stopLiveTimerLabel();
      this.isGenerating = false;
      this.abortController = null;
      this.elHeroGenBtn.style.display = "inline-flex";
      this.elStopGenBtn.style.display = "none";
      this.elProgressBanner.style.display = "none";
      this.updateBatchCheckedButton();
      this.renderHeroViewport();
      void this.refreshSubscription(true);
    }
  }

  // ===========================================================================
  // RICH GALLERY MANAGEMENT: FILTER / STAR+IDB / DISK SYNC / SHOOTOUT / COMPARE
  // ===========================================================================
  private getFilteredGalleryIndices(): number[] {
    const out: number[] = [];
    for (let i = 0; i < this.gallery.length; i++) {
      const g = this.gallery[i];
      if (this.galleryFilterMode === "starred" && !g.is_starred) continue;
      if (this.galleryFilterMode === "upscaled" && !g.is_upscaled) continue;
      if (this.galleryFilterMode === "scene" && this.gallerySceneFilter && g.scene_id !== this.gallerySceneFilter) {
        continue;
      }
      out.push(i);
    }
    return out;
  }

  private ensureSelectedMatchesFilter(): void {
    if (this.gallery.length === 0) {
      this.selectedGalleryIdx = -1;
      return;
    }
    const indices = this.getFilteredGalleryIndices();
    if (indices.length === 0) return;
    if (!indices.includes(this.selectedGalleryIdx)) {
      this.selectedGalleryIdx = indices[indices.length - 1];
    }
  }

  private stepCenterGallery(delta: number): void {
    const indices = this.getFilteredGalleryIndices();
    const pool = indices.length > 0 ? indices : this.gallery.map((_, i) => i);
    if (pool.length === 0) return;
    const curPos = pool.indexOf(this.selectedGalleryIdx);
    const nextPos =
      curPos === -1
        ? delta >= 0
          ? 0
          : pool.length - 1
        : (curPos + delta + pool.length) % pool.length;
    this.selectedGalleryIdx = pool[nextPos];
    const rec = this.gallery[this.selectedGalleryIdx];
    this.renderHeroViewport();
    this.renderFilmstrip(true);
    if (rec) {
      this.setStatus(
        `🖼️ [${nextPos + 1}/${pool.length}] ${rec.is_starred ? "⭐ " : ""}${rec.scene_id} · ${rec.width}×${rec.height}${rec.is_upscaled ? " [2x HD]" : ""} · Seed: ${rec.seed}`
      );
    }
  }

  private async toggleGalleryStar(recId: string): Promise<void> {
    const rec = this.gallery.find((g) => g.id === recId);
    if (!rec) return;
    rec.is_starred = !rec.is_starred;

    // 1. Persist starred-only set to IndexedDB (unstarred items are automatically purged from IDB)
    await saveStarredGalleryRecords(this.gallery);

    // 2. Two-way strong sync with mounted local directory (_favorites subfolder, respecting group_folder)
    let diskSyncNote = "";
    if (getMountedDirName()) {
      const baseFolder =
        rec.disk_subpath?.[0] ||
        `${formatDateYYYYMMDD()}_${(this.cfg.eng_name || "Studio").replace(/[^a-zA-Z0-9_-]/g, "")}`;
      const normalPath = resolveRecordDiskSubpath(baseFolder, rec.group_folder, false);
      const favPath = resolveRecordDiskSubpath(baseFolder, rec.group_folder, true);
      const prevPath =
        rec.disk_subpath && rec.disk_subpath.length > 0 ? [...rec.disk_subpath] : normalPath;
      const targetPath = rec.is_starred ? favPath : normalPath;

      if (rec.saved_to_dir) {
        const moved = await moveFileInMountedDir(prevPath, targetPath, rec.filename, rec.bytes);
        if (moved) {
          rec.disk_subpath = targetPath;
          diskSyncNote = rec.is_starred ? " · 📂已移入 _favorites" : " · 📂已移回会话目录";
        }
      } else {
        const saved = await saveBytesToMountedDir(targetPath, rec.filename, rec.bytes);
        if (saved) {
          rec.saved_to_dir = true;
          rec.disk_subpath = targetPath;
          diskSyncNote = rec.is_starred ? " · 📂已存入 _favorites" : " · 📂已存入会话目录";
        }
      }
      await syncPromptsLogToMountedDir(this.gallery, [normalPath, favPath]);
    }

    if (!rec.is_starred && this.galleryFilterMode === "starred") {
      this.ensureSelectedMatchesFilter();
    }
    this.renderHeroViewport();
    this.renderFilmstrip();
    if (this.lightboxOpen) this.renderLightboxFrame();
    this.setStatus(
      rec.is_starred
        ? `⭐ 已收藏 ${rec.scene_id}（IndexedDB 持久化保护${diskSyncNote}）`
        : `☆ 已取消收藏 ${rec.scene_id}（刷新后不保留${diskSyncNote}）`
    );
  }

  private async setGalleryStarStateByIds(
    ids: Iterable<string>,
    starred: boolean
  ): Promise<number> {
    const idSet = new Set(ids);
    const targets = this.gallery.filter((g) => idSet.has(g.id) && Boolean(g.is_starred) !== starred);
    if (targets.length === 0) return 0;

    const defaultSessionFolder = `${formatDateYYYYMMDD()}_${(this.cfg.eng_name || "Studio").replace(/[^a-zA-Z0-9_-]/g, "")}`;
    const touchedPaths: string[][] = [];
    for (const rec of targets) {
      rec.is_starred = starred;
      if (getMountedDirName()) {
        const baseFolder = rec.disk_subpath?.[0] || defaultSessionFolder;
        const normalPath = resolveRecordDiskSubpath(baseFolder, rec.group_folder, false);
        const favPath = resolveRecordDiskSubpath(baseFolder, rec.group_folder, true);
        const prevPath =
          rec.disk_subpath && rec.disk_subpath.length > 0 ? [...rec.disk_subpath] : normalPath;
        const targetPath = starred ? favPath : normalPath;
        if (rec.saved_to_dir) {
          const moved = await moveFileInMountedDir(prevPath, targetPath, rec.filename, rec.bytes);
          if (moved) rec.disk_subpath = targetPath;
        } else {
          const saved = await saveBytesToMountedDir(targetPath, rec.filename, rec.bytes);
          if (saved) {
            rec.saved_to_dir = true;
            rec.disk_subpath = targetPath;
          }
        }
        touchedPaths.push(normalPath, favPath);
      }
    }

    await saveStarredGalleryRecords(this.gallery);
    if (getMountedDirName() && touchedPaths.length > 0) {
      await syncPromptsLogToMountedDir(this.gallery, touchedPaths);
    }
    if (!starred && this.galleryFilterMode === "starred") {
      this.ensureSelectedMatchesFilter();
    }
    this.renderHeroViewport();
    this.renderFilmstrip();
    if (this.lightboxOpen) this.renderLightboxFrame();
    this.setStatus(
      starred
        ? `⭐ 已批量收藏 ${targets.length} 张图片`
        : `☆ 已批量取消收藏 ${targets.length} 张图片`
    );
    return targets.length;
  }

  private async deleteGalleryRecordsByIds(
    ids: Iterable<string>,
    statusMsg?: string
  ): Promise<void> {
    const delSet = new Set(ids);
    if (delSet.size === 0 || this.gallery.length === 0) return;

    const currentSelectedId = this.gallery[this.selectedGalleryIdx]?.id ?? null;
    const currentLbId = this.gallery[this.lightboxIdx]?.id ?? null;

    // Remember neighbor before deletion so cursor lands smoothly on adjacent item
    let fallbackNextId: string | null = null;
    if (currentSelectedId && delSet.has(currentSelectedId)) {
      for (let i = this.selectedGalleryIdx + 1; i < this.gallery.length; i++) {
        if (!delSet.has(this.gallery[i].id)) {
          fallbackNextId = this.gallery[i].id;
          break;
        }
      }
      if (!fallbackNextId) {
        for (let i = this.selectedGalleryIdx - 1; i >= 0; i--) {
          if (!delSet.has(this.gallery[i].id)) {
            fallbackNextId = this.gallery[i].id;
            break;
          }
        }
      }
    } else {
      fallbackNextId = currentSelectedId;
    }

    let hadStarredDeleted = false;
    let diskDeletedCount = 0;
    const touchedPaths: string[][] = [];

    for (const rec of this.gallery) {
      if (!delSet.has(rec.id)) continue;
      URL.revokeObjectURL(rec.objectUrl);
      this.checkedGalleryIds.delete(rec.id);
      if (rec.is_starred) hadStarredDeleted = true;
      if (getMountedDirName() && rec.disk_subpath && rec.disk_subpath.length > 0) {
        const ok = await deleteFileFromMountedDir(rec.disk_subpath, rec.filename);
        if (ok) diskDeletedCount++;
        touchedPaths.push([...rec.disk_subpath]);
      }
    }

    this.gallery = this.gallery.filter((g) => !delSet.has(g.id));

    if (hadStarredDeleted) {
      await saveStarredGalleryRecords(this.gallery);
    }
    if (getMountedDirName() && touchedPaths.length > 0) {
      await syncPromptsLogToMountedDir(this.gallery, touchedPaths);
    }

    // Update Shootout state if active
    if (this.shootoutState) {
      this.shootoutState.candidateIds = this.shootoutState.candidateIds.filter(
        (cid) => !delSet.has(cid) && this.gallery.some((g) => g.id === cid)
      );
      if (this.shootoutState.candidateIds.length === 0) {
        this.shootoutState = null;
        if (this.stageViewMode === "shootout") this.stageViewMode = "single";
      } else if (!this.gallery.some((g) => g.id === this.shootoutState!.anchorId)) {
        this.shootoutState.anchorId = this.shootoutState.candidateIds[0];
      }
    }

    if (this.gallery.length === 0) {
      this.selectedGalleryIdx = -1;
      this.stageViewMode = "single";
      if (this.lightboxOpen) this.closeLightbox();
    } else {
      const nextIdx = fallbackNextId
        ? this.gallery.findIndex((g) => g.id === fallbackNextId)
        : -1;
      this.selectedGalleryIdx =
        nextIdx !== -1 ? nextIdx : Math.min(this.selectedGalleryIdx, this.gallery.length - 1);
      this.ensureSelectedMatchesFilter();

      if (this.stageViewMode === "compare" && this.gallery.length < 2) {
        this.stageViewMode = "single";
      }
      if (this.lightboxOpen) {
        const lbKeepIdx = currentLbId ? this.gallery.findIndex((g) => g.id === currentLbId) : -1;
        this.lightboxIdx =
          lbKeepIdx !== -1 ? lbKeepIdx : Math.max(0, Math.min(this.lightboxIdx, this.gallery.length - 1));
        this.renderLightboxFrame();
      }
    }

    this.renderHeroViewport();
    this.renderFilmstrip();
    const diskSuffix = diskDeletedCount > 0 ? `（📂本地已同步删除 ${diskDeletedCount} 个文件）` : "";
    if (statusMsg) {
      this.setStatus(`${statusMsg}${diskSuffix}`);
    }
  }

  private restoreRecordFullConfig(rec: GeneratedImageRecord): void {
    const snap = rec.config_snapshot;
    if (snap) {
      this.cfg = {
        ...createDefaultCharacterConfig(),
        ...(JSON.parse(JSON.stringify(snap.cfg)) as CharacterConfig),
      };
      this.actionMode = snap.action_mode;
      this.apiSettings.model = snap.model;
      this.apiSettings.steps = snap.steps;
      this.apiSettings.scale = snap.scale;
      this.apiSettings.cfg_rescale = snap.cfg_rescale;
      this.apiSettings.uc_preset_mode = snap.uc_preset_mode;
      this.apiSettings.extra_uc = snap.extra_uc;
      this.apiSettings.append_v5_quality = snap.append_v5_quality;
      saveActiveConfig(this.cfg);
      saveApiSettings(this.apiSettings);
    }
    if (rec.scene_id === "FREE") {
      this.actionMode = "free";
    } else if (rec.scene_id.startsWith("MA")) {
      this.actionMode = "multi_angle";
      this.activeSceneId = rec.scene_id;
    } else if (this.isOtherActionId(rec.scene_id)) {
      this.actionMode = "other";
      this.activeSceneId = rec.scene_id;
    } else if (rec.scene_id in ALL_POSITIONS_TEMPLATES) {
      this.actionMode = "positions";
      this.activeSceneId = rec.scene_id;
    }
    this.isManualPromptEdited = false;
    this.populatePresetSelect();
    this.syncAllControls();
    this.renderRightModeView();
    this.refreshSceneAndPrompt();
    this.setStatus(`🧬 已完整回填 ${rec.scene_id} 的角色/画风/光影配置与采样参数`);
  }

  private toggleCompareStageView(): void {
    if (this.gallery.length < 2) {
      this.setStatus("⚠️ 画廊至少需要 2 张图片才能进入双图对比视图", true);
      return;
    }
    if (this.stageViewMode === "compare") {
      this.stageViewMode = "single";
      this.renderHeroViewport();
      return;
    }
    const checkedInOrder = this.gallery.filter((g) => this.checkedGalleryIds.has(g.id));
    if (checkedInOrder.length >= 2) {
      this.comparePairIds = [
        checkedInOrder[checkedInOrder.length - 2].id,
        checkedInOrder[checkedInOrder.length - 1].id,
      ];
    } else {
      const curIdx = Math.max(0, this.selectedGalleryIdx);
      const prevIdx = curIdx > 0 ? curIdx - 1 : Math.min(this.gallery.length - 1, curIdx + 1);
      this.comparePairIds = [this.gallery[prevIdx].id, this.gallery[curIdx].id];
    }
    this.stageViewMode = "compare";
    this.renderHeroViewport();
  }

  private async startOrContinueShootout(anchorId: string, count = 2): Promise<void> {
    if (this.isGenerating) return;
    const anchor = this.gallery.find((g) => g.id === anchorId);
    if (!anchor) return;
    if (!this.apiSettings.api_token.trim()) {
      this.elApiCard.classList.remove("collapsed");
      this.mobileCol = "left";
      this.syncMobileColumns();
      this.setStatus("⚠️ 请先填入 Persistent API Token (pst-...)", true);
      return;
    }

    const roundCount = Math.max(1, Math.min(4, count));
    if (!this.shootoutState || !this.shootoutState.candidateIds.includes(anchorId)) {
      this.shootoutState = {
        anchorId: anchor.id,
        candidateIds: [anchor.id],
      };
    }
    this.stageViewMode = "shootout";
    if (this.isPortraitCompactStage) {
      if (this.filmstripExpanded) {
        this.setFilmstripExpanded(false);
      }
      if (this.promptDrawerExpanded) {
        this.togglePromptDrawer(false);
      }
    }
    this.renderHeroViewport();

    const snap = anchor.config_snapshot ?? this.captureCurrentConfigSnapshot();
    const model = snap.model;
    const isPixelC5 = isC5LowresPixelStyleActive(snap.cfg);
    // Recover 1x generation canvas if anchor was already 2x upscaled
    const genW =
      anchor.is_upscaled && !isPixelC5
        ? Math.max(64, Math.round(anchor.width / 2 / 64) * 64)
        : isPixelC5 && anchor.width > 640
          ? Math.round(anchor.width / 3)
          : anchor.width;
    const genH =
      anchor.is_upscaled && !isPixelC5
        ? Math.max(64, Math.round(anchor.height / 2 / 64) * 64)
        : isPixelC5 && anchor.height > 640
          ? Math.round(anchor.height / 3)
          : anchor.height;

    const rawPosPrompt = (anchor.prompt_pos || "").trim() || this.elPosTextarea.value.trim();
    const customNeg = (anchor.prompt_neg ?? this.elNegTextarea.value).trim();
    const activeVibes = model === MODEL_V4_5_FULL ? this.getActiveVibeSlots() : [];
    const sessionFolder =
      anchor.disk_subpath?.[0] ||
      `${formatDateYYYYMMDD()}_${(snap.cfg.eng_name || "Studio").replace(/[^a-zA-Z0-9_-]/g, "")}`;
    const groupId = anchor.reroll_group_id || `shootout_${anchor.id}`;
    anchor.reroll_group_id = groupId;

    this.isGenerating = true;
    this.abortController = new AbortController();
    this.elHeroGenBtn.style.display = "none";
    this.elStopGenBtn.style.display = "inline-flex";
    this.elProgressBanner.style.display = "inline-flex";
    this.syncStageToolbar();

    try {
      for (let r = 0; r < roundCount; r++) {
        if (this.abortController.signal.aborted) break;
        const tStart = performance.now();
        this.startLiveTimerLabel(
          `🎯 重抽选优 [${r + 1}/${roundCount}] ${anchor.scene_id}${this.apiSettings.auto_upscale_replace && !isPixelC5 ? " (+2x高清)" : ""}`,
          tStart
        );

        const res = await generateSingleImageNai({
          apiToken: this.apiSettings.api_token,
          model,
          promptText: rawPosPrompt,
          customNegPrompt: customNeg,
          width: genW,
          height: genH,
          steps: snap.steps,
          scale: snap.scale,
          cfgRescale: snap.cfg_rescale,
          seed: -1,
          ucPresetMode: snap.uc_preset_mode,
          keepInlineNegatives: false,
          extraUc: snap.extra_uc,
          appendV5Quality: snap.append_v5_quality,
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

        if (this.apiSettings.auto_upscale_replace && !isPixelC5) {
          this.startLiveTimerLabel(
            `🎯 重抽选优 [${r + 1}/${roundCount}] 正在 2x 放大 ${anchor.scene_id}`,
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
          } catch {
            if (this.abortController.signal.aborted) break;
          }
        }

        const ext = detectImageExt(finalBytes);
        const stageTag = anchor.stage_code ? `_${formatStageFileTag(anchor.stage_code)}` : "";
        const filename = `${formatTimeHHMMSS()}_${anchor.scene_id}${stageTag}_s${res.seed}${isUpscaled ? "_2x" : ""}${ext}`;
        const copyForBlob = new Uint8Array(finalBytes.byteLength);
        copyForBlob.set(finalBytes);
        const objectUrl = URL.createObjectURL(new Blob([copyForBlob], { type: "image/png" }));
        const candDiskPath = resolveRecordDiskSubpath(sessionFolder, anchor.group_folder, false);

        const newRec: GeneratedImageRecord = {
          id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          scene_id: anchor.scene_id,
          mode_label: anchor.mode_label,
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
          is_starred: false,
          disk_subpath: candDiskPath,
          config_snapshot: JSON.parse(JSON.stringify(snap)) as GeneratedConfigSnapshot,
          reroll_group_id: groupId,
          group_folder: anchor.group_folder,
          stage_code: anchor.stage_code,
        };

        const savedPath = await saveBytesToMountedDir(candDiskPath, filename, finalBytes);
        if (savedPath) newRec.saved_to_dir = true;
        if (this.apiSettings.auto_download) {
          triggerBytesDownload(finalBytes, filename);
        }

        // Insert right after the last candidate of this shootout group so gallery sequence stays tidy
        const lastCandId =
          this.shootoutState.candidateIds[this.shootoutState.candidateIds.length - 1];
        const lastCandIdx = this.gallery.findIndex((g) => g.id === lastCandId);
        const insertAt = lastCandIdx !== -1 ? lastCandIdx + 1 : this.gallery.length;
        this.gallery.splice(insertAt, 0, newRec);
        this.shootoutState.candidateIds.push(newRec.id);
        this.selectedGalleryIdx = insertAt;

        if (getMountedDirName()) {
          await syncPromptsLogToMountedDir(this.gallery, [candDiskPath]);
        }
        this.renderHeroViewport();
        this.renderFilmstrip();
      }
      this.setStatus(
        `🎯 重抽完成：请点击候选卡片下方「🏆 仅留此张（删其余）」一键选定最优成图`
      );
    } catch (err) {
      if (!this.abortController.signal.aborted) {
        this.setStatus(
          `❌ 重抽中断：${err instanceof Error ? err.message : String(err)}`,
          true
        );
      } else {
        this.setStatus("⏹ 已停止当前轮重抽");
      }
    } finally {
      this.stopLiveTimerLabel();
      this.isGenerating = false;
      this.abortController = null;
      this.elHeroGenBtn.style.display = "inline-flex";
      this.elStopGenBtn.style.display = "none";
      this.elProgressBanner.style.display = "none";
      this.updateBatchCheckedButton();
      this.renderHeroViewport();
      void this.refreshSubscription(true);
    }
  }

  private async pickShootoutWinner(winnerId: string): Promise<void> {
    if (!this.shootoutState || this.isGenerating) return;
    const { anchorId, candidateIds } = this.shootoutState;
    const winner = this.gallery.find((g) => g.id === winnerId);
    if (!winner) return;

    // Place winner right at anchor's slot if anchor is being replaced
    const anchorIdx = this.gallery.findIndex((g) => g.id === anchorId);
    const winnerIdx = this.gallery.findIndex((g) => g.id === winnerId);
    if (anchorIdx !== -1 && winnerIdx !== -1 && anchorIdx !== winnerIdx) {
      this.gallery.splice(winnerIdx, 1);
      const nextAnchorIdx = this.gallery.findIndex((g) => g.id === anchorId);
      this.gallery.splice(nextAnchorIdx, 0, winner);
    }

    const loserIds = candidateIds.filter((cid) => cid !== winnerId);
    this.shootoutState = null;
    this.stageViewMode = "single";

    if (loserIds.length > 0) {
      await this.deleteGalleryRecordsByIds(
        loserIds,
        `🏆 已选定留用 ${winner.scene_id} (Seed: ${winner.seed})，自动销毁 ${loserIds.length} 张落选图`
      );
    }
    const finalIdx = this.gallery.findIndex((g) => g.id === winnerId);
    if (finalIdx !== -1) this.selectedGalleryIdx = finalIdx;
    this.renderHeroViewport();
    this.renderFilmstrip();
  }

  private renderHeroViewport(): void {
    this.elHeroViewport.innerHTML = "";
    this.elHeroViewport.appendChild(this.elProgressBanner);

    // INVARIANT (AGENTS.md Rule 3): Empty center viewport MUST render pure #000000 black screen with zero placeholder text/buttons!
    if (this.gallery.length === 0) {
      this.elHeroViewport.classList.remove("stage-multi-mode");
      this.syncStageToolbar();
      return;
    }

    if (this.stageViewMode === "shootout" && this.shootoutState) {
      const cands = this.shootoutState.candidateIds
        .map((id) => this.gallery.find((g) => g.id === id))
        .filter((g): g is GeneratedImageRecord => Boolean(g));
      if (cands.length > 0) {
        this.elHeroViewport.classList.add("stage-multi-mode");
        this.renderShootoutStage(cands, this.shootoutState.anchorId);
        this.syncStageToolbar();
        return;
      }
      this.stageViewMode = "single";
    }

    if (this.stageViewMode === "compare" && this.gallery.length >= 2) {
      this.elHeroViewport.classList.add("stage-multi-mode");
      this.renderCompareStage();
      this.syncStageToolbar();
      return;
    }

    if (this.stageViewMode === "grid") {
      this.elHeroViewport.classList.add("stage-multi-mode");
      this.renderGridOverviewStage();
      this.syncStageToolbar();
      return;
    }

    this.elHeroViewport.classList.remove("stage-multi-mode");
    const rec = this.gallery[this.selectedGalleryIdx];
    if (!rec) {
      this.syncStageToolbar();
      return;
    }

    const img = document.createElement("img");
    img.className = "hero-img";
    img.src = rec.objectUrl;
    img.alt = rec.filename;
    img.title = "点击进入全屏灯箱查看 (快捷键: ←/→ 切图, F 收藏, R 重抽, Delete 删除)";
    img.addEventListener("click", () => this.openLightbox(this.selectedGalleryIdx));
    this.elHeroViewport.appendChild(img);
    this.syncStageToolbar();
  }

  private renderShootoutStage(cands: GeneratedImageRecord[], anchorId: string): void {
    const wrap = this.el("div", "stage-multi-wrap");
    const head = this.el("div", "stage-multi-head");
    const title = this.el(
      "div",
      "stage-multi-title",
      `🎯 快速重抽选优 · ${cands[0].scene_id}（共 ${cands.length} 张候选 · 点击图片可全屏放大细看）`
    );

    const acts = this.el("div", "topbar-group");
    const btnMore = this.el(
      "button",
      "btn btn-xs btn-primary",
      `🎲 再抽 +${this.rerollCountPerRound} 张`
    );
    btnMore.disabled = this.isGenerating;
    btnMore.addEventListener("click", () => {
      void this.startOrContinueShootout(anchorId, this.rerollCountPerRound);
    });

    const btnKeepAll = this.el("button", "btn btn-xs btn-success", "✅ 全部保留退出");
    btnKeepAll.disabled = this.isGenerating;
    btnKeepAll.addEventListener("click", () => {
      this.shootoutState = null;
      this.stageViewMode = "single";
      this.renderHeroViewport();
      this.setStatus(`✅ 已保留本轮全部 ${cands.length} 张候选图`);
    });

    const btnRevert = this.el("button", "btn btn-xs btn-danger", "↩ 放弃新抽（仅留原图）");
    btnRevert.disabled = this.isGenerating || !cands.some((c) => c.id === anchorId) || cands.length <= 1;
    btnRevert.addEventListener("click", () => {
      void this.pickShootoutWinner(anchorId);
    });

    acts.append(btnMore, btnKeepAll, btnRevert);
    head.append(title, acts);

    const grid = this.el(
      "div",
      `shootout-grid cols-${cands.length <= 2 ? "2" : cands.length <= 4 ? "2" : "3"}`
    );
    cands.forEach((rec, idx) => {
      const isOrig = rec.id === anchorId;
      const card = this.el(
        "div",
        `shootout-card${this.gallery[this.selectedGalleryIdx]?.id === rec.id ? " active" : ""}`
      );

      const imgWrap = this.el("div", "shootout-img-wrap");
      const img = document.createElement("img");
      img.src = rec.objectUrl;
      img.alt = rec.filename;
      img.addEventListener("click", () => {
        const gIdx = this.gallery.findIndex((g) => g.id === rec.id);
        if (gIdx !== -1) {
          this.selectedGalleryIdx = gIdx;
          this.openLightbox(gIdx, "manual");
        }
      });

      const badge = this.el(
        "span",
        `shootout-badge${isOrig ? " orig" : " reroll"}`,
        isOrig ? "📌 原图" : `🆕 重抽 #${idx}`
      );
      imgWrap.append(img, badge);
      if (rec.is_upscaled) {
        imgWrap.appendChild(this.el("span", "film-item-2x", "2x"));
      }

      const foot = this.el("div", "shootout-foot");
      const meta = this.el("div", "shootout-meta", `Seed: ${rec.seed} · ${rec.width}×${rec.height}`);
      const cBtns = this.el("div", "shootout-card-btns");

      const btnPick = this.el("button", "btn btn-xs btn-success", "🏆 仅留此张（删其余）");
      btnPick.disabled = this.isGenerating;
      btnPick.addEventListener("click", () => {
        void this.pickShootoutWinner(rec.id);
      });

      const btnStar = this.el(
        "button",
        `btn btn-xs${rec.is_starred ? " btn-star-on" : ""}`,
        rec.is_starred ? "⭐" : "☆"
      );
      btnStar.title = "收藏此候选图";
      btnStar.addEventListener("click", () => {
        void this.toggleGalleryStar(rec.id);
      });

      const btnUpscale = this.el("button", "btn btn-xs", "2x");
      btnUpscale.title = "单独对此候选图执行 2x 高清放大";
      btnUpscale.disabled = Boolean(rec.is_upscaled) || this.isGenerating;
      btnUpscale.addEventListener("click", () => {
        void this.upscaleGalleryRecordsByIds([rec.id]);
      });

      const btnDrop = this.el("button", "btn btn-xs btn-danger", "淘汰");
      btnDrop.disabled = this.isGenerating || cands.length <= 1;
      btnDrop.addEventListener("click", () => {
        void this.deleteGalleryRecordsByIds([rec.id], `🗑️ 已淘汰候选图 Seed: ${rec.seed}`);
      });

      cBtns.append(btnPick, btnStar, btnUpscale, btnDrop);
      foot.append(meta, cBtns);
      card.append(imgWrap, foot);
      grid.appendChild(card);
    });

    wrap.append(head, grid);
    this.elHeroViewport.appendChild(wrap);
  }

  private renderCompareStage(): void {
    let leftRec = this.gallery.find((g) => g.id === this.comparePairIds[0]);
    let rightRec = this.gallery.find((g) => g.id === this.comparePairIds[1]);
    if (!leftRec) leftRec = this.gallery[0];
    if (!rightRec || rightRec.id === leftRec.id) {
      rightRec = this.gallery.find((g) => g.id !== leftRec!.id) ?? this.gallery[this.gallery.length - 1];
    }
    this.comparePairIds = [leftRec.id, rightRec.id];

    const wrap = this.el("div", "stage-multi-wrap");
    const head = this.el("div", "stage-multi-head");
    head.appendChild(this.el("div", "stage-multi-title", "⚖️ 双图同屏 A/B 对比"));

    const acts = this.el("div", "topbar-group");
    const btnZoom = this.el(
      "button",
      `btn btn-xs${this.compareFitOneToOne ? " btn-primary" : ""}`,
      this.compareFitOneToOne ? "🔍 1:1 原始像素" : "📐 适应窗口"
    );
    btnZoom.addEventListener("click", () => {
      this.compareFitOneToOne = !this.compareFitOneToOne;
      this.renderHeroViewport();
    });

    const btnKeepLeft = this.el("button", "btn btn-xs btn-success", "🏆 留左删右");
    btnKeepLeft.disabled = leftRec.id === rightRec.id || this.isGenerating;
    btnKeepLeft.addEventListener("click", () => {
      const dropId = rightRec!.id;
      const keepIdx = this.gallery.findIndex((g) => g.id === leftRec!.id);
      if (keepIdx !== -1) this.selectedGalleryIdx = keepIdx;
      this.stageViewMode = "single";
      void this.deleteGalleryRecordsByIds([dropId], `🏆 已保留左图 (${leftRec!.scene_id}) 并删除右图`);
    });

    const btnKeepRight = this.el("button", "btn btn-xs btn-success", "🏆 留右删左");
    btnKeepRight.disabled = leftRec.id === rightRec.id || this.isGenerating;
    btnKeepRight.addEventListener("click", () => {
      const dropId = leftRec!.id;
      const keepIdx = this.gallery.findIndex((g) => g.id === rightRec!.id);
      if (keepIdx !== -1) this.selectedGalleryIdx = keepIdx;
      this.stageViewMode = "single";
      void this.deleteGalleryRecordsByIds([dropId], `🏆 已保留右图 (${rightRec!.scene_id}) 并删除左图`);
    });

    const btnExit = this.el("button", "btn btn-xs", "✕ 返回单图");
    btnExit.addEventListener("click", () => {
      this.stageViewMode = "single";
      this.renderHeroViewport();
    });

    acts.append(btnZoom, btnKeepLeft, btnKeepRight, btnExit);
    head.appendChild(acts);

    const split = this.el("div", `compare-split${this.compareFitOneToOne ? " zoom-1x" : ""}`);
    const buildPane = (rec: GeneratedImageRecord, slotIdx: 0 | 1, tagLbl: string): HTMLElement => {
      const pane = this.el("div", "compare-pane");
      const pTop = this.el("div", "compare-pane-bar");
      const sel = this.el("select", "batch-select compare-slot-select") as HTMLSelectElement;
      this.gallery.forEach((g, idx) => {
        const opt = this.el(
          "option",
          "",
          `#${idx + 1} ${g.is_starred ? "⭐" : ""}${g.scene_id}${g.is_upscaled ? " [2x]" : ""} · s${g.seed}`
        );
        opt.value = g.id;
        sel.appendChild(opt);
      });
      sel.value = rec.id;
      sel.addEventListener("change", () => {
        this.comparePairIds[slotIdx] = sel.value;
        this.renderHeroViewport();
      });

      const meta = this.el("span", "compare-meta", `${tagLbl} · ${rec.width}×${rec.height}`);
      pTop.append(meta, sel);

      const canvas = this.el("div", "compare-img-box");
      const img = document.createElement("img");
      img.src = rec.objectUrl;
      img.alt = rec.filename;
      img.addEventListener("click", () => {
        const gIdx = this.gallery.findIndex((g) => g.id === rec.id);
        if (gIdx !== -1) this.openLightbox(gIdx, "manual");
      });
      canvas.appendChild(img);
      pane.append(pTop, canvas);
      return pane;
    };

    split.append(buildPane(leftRec, 0, "🅰️ 左图"), buildPane(rightRec, 1, "🅱️ 右图"));
    wrap.append(head, split);
    this.elHeroViewport.appendChild(wrap);
  }

  private renderGridOverviewStage(): void {
    const indices = this.getFilteredGalleryIndices();
    const wrap = this.el("div", "stage-multi-wrap");
    const head = this.el("div", "stage-multi-head");
    head.appendChild(
      this.el("div", "stage-multi-title", `🪟 画廊大图网格总览（当前显示 ${indices.length} / ${this.gallery.length} 张）`)
    );
    const btnClose = this.el("button", "btn btn-xs", "✕ 返回单图舞台");
    btnClose.addEventListener("click", () => {
      this.stageViewMode = "single";
      this.renderHeroViewport();
    });
    head.appendChild(btnClose);

    const grid = this.el("div", "stage-overview-grid");
    for (const idx of indices) {
      const rec = this.gallery[idx];
      const card = this.el(
        "div",
        `overview-card${idx === this.selectedGalleryIdx ? " active" : ""}${rec.is_starred ? " starred" : ""}`
      );
      const imgBox = this.el("div", "overview-img-box");
      const img = document.createElement("img");
      img.src = rec.objectUrl;
      img.alt = rec.filename;
      img.addEventListener("click", () => {
        this.selectedGalleryIdx = idx;
        this.stageViewMode = "single";
        this.renderHeroViewport();
        this.renderFilmstrip();
      });
      imgBox.appendChild(img);
      if (rec.is_upscaled) imgBox.appendChild(this.el("span", "film-item-2x", "2x"));

      const bar = this.el("div", "overview-card-bar");
      bar.appendChild(this.el("span", "overview-lbl", `${rec.scene_id} · s${rec.seed}`));
      const bActs = this.el("div", "overview-card-btns");

      const bStar = this.el("button", `btn btn-xs${rec.is_starred ? " btn-star-on" : ""}`, rec.is_starred ? "⭐" : "☆");
      bStar.title = "收藏 / 取消收藏";
      bStar.addEventListener("click", (ev) => {
        ev.stopPropagation();
        void this.toggleGalleryStar(rec.id);
      });

      const bReroll = this.el("button", "btn btn-xs btn-primary", "🎲");
      bReroll.title = "对此图发起快速重抽选优";
      bReroll.disabled = this.isGenerating;
      bReroll.addEventListener("click", (ev) => {
        ev.stopPropagation();
        this.selectedGalleryIdx = idx;
        void this.startOrContinueShootout(rec.id, this.rerollCountPerRound);
      });

      const bDel = this.el("button", "btn btn-xs btn-danger", "×");
      bDel.title = "删除此图";
      bDel.disabled = this.isGenerating;
      bDel.addEventListener("click", (ev) => {
        ev.stopPropagation();
        void this.deleteGalleryRecordsByIds([rec.id], `🗑️ 已删除 ${rec.scene_id}`);
      });

      bActs.append(bStar, bReroll, bDel);
      bar.appendChild(bActs);
      card.append(imgBox, bar);
      grid.appendChild(card);
    }

    wrap.append(head, grid);
    this.elHeroViewport.appendChild(wrap);
  }

  // ===========================================================================
  // GALLERY FOLDER ORGANIZER (2-COLUMN ➔ 3-COLUMN DRAG & DROP + DISK SUBFOLDERS)
  // ===========================================================================
  private async syncUnsavedGalleryToMountedDir(
    records: GeneratedImageRecord[],
    mountedDirName: string
  ): Promise<number> {
    if (!getMountedDirName() || records.length === 0) return 0;
    const defaultSessionFolder = `${formatDateYYYYMMDD()}_${(this.cfg.eng_name || "Studio").replace(/[^a-zA-Z0-9_-]/g, "")}`;
    const touchedPaths: string[][] = [];
    let savedCount = 0;
    let starredTouched = false;

    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      this.setStatus(`📂 正在同步至硬盘「${mountedDirName}」(${i + 1}/${records.length})...`);
      const baseSession = rec.disk_subpath?.[0] || defaultSessionFolder;
      const targetPath = resolveRecordDiskSubpath(
        baseSession,
        rec.group_folder,
        Boolean(rec.is_starred)
      );
      const saved = await saveBytesToMountedDir(targetPath, rec.filename, rec.bytes);
      if (saved) {
        rec.saved_to_dir = true;
        rec.disk_subpath = targetPath;
        savedCount++;
        if (rec.is_starred) starredTouched = true;
        touchedPaths.push(targetPath);
      }
    }

    if (starredTouched) {
      await saveStarredGalleryRecords(this.gallery);
    }
    if (touchedPaths.length > 0) {
      await syncPromptsLogToMountedDir(this.gallery, touchedPaths);
    }
    this.renderFilmstrip();
    this.renderHeroViewport();

    if (savedCount === records.length) {
      this.setStatus(
        `📂 已挂载「${mountedDirName}」并立即同步 ${savedCount} 张图片（含分组文件夹与 prompts.txt）到硬盘`
      );
    } else {
      this.setStatus(
        `⚠️ 已挂载「${mountedDirName}」，成功同步 ${savedCount}/${records.length} 张图片到硬盘`,
        true
      );
    }
    return savedCount;
  }

  private ensureGalleryFolderExists(rawName: string): string {
    const safeName = sanitizeSubfolderName(rawName);
    if (!safeName) return "";
    const existing = this.galleryFolders.find(
      (f) => f.name.toLowerCase() === safeName.toLowerCase()
    );
    if (existing) return existing.name;
    this.galleryFolders.push({
      id: `fld_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: safeName,
      created_at: Date.now(),
    });
    return safeName;
  }

  private extractDraggedIds(ev: DragEvent): string[] {
    if (this.draggingRecordIds.length > 0) {
      return [...this.draggingRecordIds];
    }
    try {
      const raw = ev.dataTransfer?.getData("text/plain") || "";
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
    } catch {
      return [];
    }
  }

  private async moveGalleryRecordsToFolder(
    ids: Iterable<string>,
    targetFolderRaw: string | null
  ): Promise<{ movedCount: number; targetFolder: string }> {
    const idSet = new Set(ids);
    if (idSet.size === 0) return { movedCount: 0, targetFolder: "" };

    const destFolder = targetFolderRaw ? this.ensureGalleryFolderExists(targetFolderRaw) : "";
    const targets = this.gallery.filter(
      (g) => idSet.has(g.id) && (g.group_folder || "") !== destFolder
    );
    if (targets.length === 0) {
      this.setStatus(
        destFolder
          ? `📁 所选图片已在文件夹「${destFolder}」中`
          : "🖼️ 所选图片已在未分组图池中"
      );
      return { movedCount: 0, targetFolder: destFolder };
    }

    const defaultSessionFolder = `${formatDateYYYYMMDD()}_${(this.cfg.eng_name || "Studio").replace(/[^a-zA-Z0-9_-]/g, "")}`;
    let starredTouched = false;
    let movedDiskCount = 0;
    const touchedPaths: string[][] = [];

    for (const rec of targets) {
      rec.group_folder = destFolder || undefined;
      if (rec.is_starred) starredTouched = true;
      this.checkedGalleryIds.delete(rec.id);

      if (getMountedDirName()) {
        const baseSession = rec.disk_subpath?.[0] || defaultSessionFolder;
        const prevPath =
          rec.disk_subpath && rec.disk_subpath.length > 0 ? [...rec.disk_subpath] : [baseSession];
        const nextPath = resolveRecordDiskSubpath(
          baseSession,
          destFolder || undefined,
          rec.is_starred
        );
        if (rec.saved_to_dir) {
          const ok = await moveFileInMountedDir(prevPath, nextPath, rec.filename, rec.bytes);
          if (ok) {
            rec.disk_subpath = nextPath;
            movedDiskCount++;
          }
        } else {
          const saved = await saveBytesToMountedDir(nextPath, rec.filename, rec.bytes);
          if (saved) {
            rec.saved_to_dir = true;
            rec.disk_subpath = nextPath;
            movedDiskCount++;
          }
        }
        touchedPaths.push(prevPath, nextPath);
      }
    }

    if (starredTouched) {
      await saveStarredGalleryRecords(this.gallery);
    }
    if (getMountedDirName() && touchedPaths.length > 0) {
      await syncPromptsLogToMountedDir(this.gallery, touchedPaths);
    }

    this.renderFilmstrip();
    this.renderHeroViewport();
    const diskSuffix =
      movedDiskCount > 0
        ? destFolder
          ? `（📂本地已自动建子文件夹「${destFolder}」并移入 ${movedDiskCount} 张）`
          : `（📂本地已移回根会话目录 ${movedDiskCount} 张）`
        : "";
    this.setStatus(
      destFolder
        ? `📁 已将 ${targets.length} 张图片归入文件夹「${destFolder}」${diskSuffix}`
        : `📤 已将 ${targets.length} 张图片移出分组回到未分组图池${diskSuffix}`
    );
    return { movedCount: targets.length, targetFolder: destFolder };
  }

  private async renameGalleryFolder(
    oldName: string,
    rawNewName: string,
    options?: { skipConfirm?: boolean; mergeIfExists?: boolean }
  ): Promise<{ renamedTo: string; merged: boolean; movedCount: number } | null> {
    const nextSafe = sanitizeSubfolderName(rawNewName);
    if (!nextSafe || nextSafe === oldName) return null;

    const existingOther = this.galleryFolders.find(
      (f) => f.name.toLowerCase() === nextSafe.toLowerCase() && f.name !== oldName
    );
    if (existingOther) {
      if (options?.skipConfirm) {
        if (options.mergeIfExists === false) {
          throw new Error(
            `已存在同名文件夹「${existingOther.name}」，如需合并请传 merge_if_exists: true`
          );
        }
      } else if (
        !window.confirm(
          `已存在同名文件夹「${existingOther.name}」，是否将「${oldName}」内的图片合并至「${existingOther.name}」？`
        )
      ) {
        return null;
      }
    }

    if (existingOther) {
      this.galleryFolders = this.galleryFolders.filter((f) => f.name !== oldName);
    } else {
      const fld = this.galleryFolders.find((f) => f.name === oldName);
      if (fld) fld.name = nextSafe;
    }

    const finalTargetName = existingOther ? existingOther.name : nextSafe;
    if (this.openedFolderName === oldName) this.openedFolderName = finalTargetName;
    if (this.pinnedTargetFolderName === oldName) this.pinnedTargetFolderName = finalTargetName;

    const members = this.gallery.filter((g) => g.group_folder === oldName);
    const defaultSessionFolder = `${formatDateYYYYMMDD()}_${(this.cfg.eng_name || "Studio").replace(/[^a-zA-Z0-9_-]/g, "")}`;
    const touchedPaths: string[][] = [];
    const oldSessionRoots = new Set<string>();
    let starredTouched = false;

    for (const rec of members) {
      rec.group_folder = finalTargetName;
      if (rec.is_starred) starredTouched = true;
      if (getMountedDirName()) {
        const baseSession = rec.disk_subpath?.[0] || defaultSessionFolder;
        oldSessionRoots.add(baseSession);
        const prevPath =
          rec.disk_subpath && rec.disk_subpath.length > 0 ? [...rec.disk_subpath] : [baseSession];
        const nextPath = resolveRecordDiskSubpath(baseSession, finalTargetName, rec.is_starred);
        if (rec.saved_to_dir) {
          const ok = await moveFileInMountedDir(prevPath, nextPath, rec.filename, rec.bytes);
          if (ok) rec.disk_subpath = nextPath;
        }
        touchedPaths.push(prevPath, nextPath);
      }
    }

    if (starredTouched) {
      await saveStarredGalleryRecords(this.gallery);
    }
    if (getMountedDirName()) {
      if (touchedPaths.length > 0) {
        await syncPromptsLogToMountedDir(this.gallery, touchedPaths);
      }
      for (const rootSeg of oldSessionRoots) {
        await deleteDirectoryFromMountedDir([rootSeg], oldName);
      }
    }

    this.renderFilmstrip();
    this.setStatus(`✏️ 文件夹「${oldName}」已重命名为「${finalTargetName}」`);
    return { renamedTo: finalTargetName, merged: Boolean(existingOther), movedCount: members.length };
  }

  private async dissolveGalleryFolder(folderName: string): Promise<{ ungroupedCount: number }> {
    const members = this.gallery.filter((g) => g.group_folder === folderName);
    const oldSessionRoots = new Set<string>();
    for (const m of members) {
      if (m.disk_subpath?.[0]) oldSessionRoots.add(m.disk_subpath[0]);
    }
    if (members.length > 0) {
      await this.moveGalleryRecordsToFolder(
        members.map((m) => m.id),
        null
      );
    }
    this.galleryFolders = this.galleryFolders.filter((f) => f.name !== folderName);
    if (this.openedFolderName === folderName) this.openedFolderName = null;
    if (this.pinnedTargetFolderName === folderName) this.pinnedTargetFolderName = null;
    if (getMountedDirName()) {
      for (const rootSeg of oldSessionRoots) {
        await deleteDirectoryFromMountedDir([rootSeg], folderName);
      }
    }
    this.renderFilmstrip();
    this.setStatus(`📤 已解散文件夹「${folderName}」（${members.length} 张图片已退回未分组图池）`);
    return { ungroupedCount: members.length };
  }

  private async deleteGalleryFolder(
    folderName: string,
    options?: { skipConfirm?: boolean }
  ): Promise<{ deletedImagesCount: number }> {
    const members = this.gallery.filter((g) => g.group_folder === folderName);
    if (members.length > 0 && !options?.skipConfirm) {
      const hasStar = members.some((m) => m.is_starred);
      const ok = window.confirm(
        `确定连同删除文件夹「${folderName}」及其内部全部 ${members.length} 张图片${hasStar ? "（含 ⭐收藏图）" : ""}与本地子目录吗？\n（若只想移除分组而不删图，请点文件夹上的「📤 解散」按钮）`
      );
      if (!ok) return { deletedImagesCount: 0 };
    }

    const oldSessionRoots = new Set<string>([
      `${formatDateYYYYMMDD()}_${(this.cfg.eng_name || "Studio").replace(/[^a-zA-Z0-9_-]/g, "")}`,
    ]);
    for (const m of members) {
      if (m.disk_subpath?.[0]) oldSessionRoots.add(m.disk_subpath[0]);
    }

    this.galleryFolders = this.galleryFolders.filter((f) => f.name !== folderName);
    if (this.openedFolderName === folderName) this.openedFolderName = null;
    if (this.pinnedTargetFolderName === folderName) this.pinnedTargetFolderName = null;

    if (members.length > 0) {
      await this.deleteGalleryRecordsByIds(
        members.map((m) => m.id),
        `🗑️ 已删除文件夹「${folderName}」及组内 ${members.length} 张图片`
      );
    }
    if (getMountedDirName()) {
      for (const rootSeg of oldSessionRoots) {
        await deleteDirectoryFromMountedDir([rootSeg], folderName);
      }
    }
    this.renderFilmstrip();
    if (members.length === 0) {
      this.setStatus(`🗑️ 已删除空文件夹「${folderName}」`);
    }
    return { deletedImagesCount: members.length };
  }

  private createFilmThumbElement(
    rec: GeneratedImageRecord,
    idx: number,
    orderedPoolIndices: number[],
    showFolderBadge: boolean
  ): HTMLElement {
    const isSelected = idx === this.selectedGalleryIdx;
    const item = this.el(
      "div",
      `film-item${isSelected ? " active" : ""}${rec.is_starred ? " starred" : ""}`
    );
    item.draggable = true;

    const img = document.createElement("img");
    img.src = rec.objectUrl;
    img.alt = rec.filename;
    img.draggable = false;

    item.addEventListener("dragstart", (ev) => {
      const batchIds = this.checkedGalleryIds.has(rec.id)
        ? Array.from(this.checkedGalleryIds)
        : [rec.id];
      this.draggingRecordIds = batchIds;
      item.classList.add("is-dragging");
      if (ev.dataTransfer) {
        ev.dataTransfer.effectAllowed = "move";
        ev.dataTransfer.setData("text/plain", JSON.stringify(batchIds));
      }
    });
    item.addEventListener("dragend", () => {
      this.draggingRecordIds = [];
      item.classList.remove("is-dragging");
      this.elFilmstripScroll
        .querySelectorAll(".drop-target-active")
        .forEach((n) => n.classList.remove("drop-target-active"));
    });

    const chk = this.el("input", "film-item-chk") as HTMLInputElement;
    chk.type = "checkbox";
    chk.checked = this.checkedGalleryIds.has(rec.id);
    chk.title = "勾选图片（按住 Shift 点击可区间连选；勾选后拖动任一张可批量拖入文件夹）";
    chk.addEventListener("click", (ev) => {
      ev.stopPropagation();
      if (ev.shiftKey && this.lastClickedGalleryId) {
        const a = orderedPoolIndices.findIndex(
          (gi) => this.gallery[gi]?.id === this.lastClickedGalleryId
        );
        const b = orderedPoolIndices.indexOf(idx);
        if (a !== -1 && b !== -1) {
          const [lo, hi] = a < b ? [a, b] : [b, a];
          for (let k = lo; k <= hi; k++) {
            const targetId = this.gallery[orderedPoolIndices[k]].id;
            if (chk.checked) this.checkedGalleryIds.add(targetId);
            else this.checkedGalleryIds.delete(targetId);
          }
          this.lastClickedGalleryId = rec.id;
          this.renderFilmstrip();
          this.syncStageToolbar();
          return;
        }
      }
      if (chk.checked) this.checkedGalleryIds.add(rec.id);
      else this.checkedGalleryIds.delete(rec.id);
      this.lastClickedGalleryId = rec.id;
      this.syncStageToolbar();
    });

    const starBtn = this.el(
      "button",
      `film-star-btn${rec.is_starred ? " on" : ""}`,
      rec.is_starred ? "⭐" : "☆"
    );
    starBtn.title = rec.is_starred ? "取消收藏" : "收藏此图 (F)";
    starBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      void this.toggleGalleryStar(rec.id);
    });

    const delBtn = this.el("button", "film-del-btn", "×");
    delBtn.title = "删除此图 (Delete)";
    delBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      if (this.isGenerating) return;
      void this.deleteGalleryRecordsByIds([rec.id], `🗑️ 已删除 ${rec.scene_id}`);
    });

    item.append(img, chk, starBtn, delBtn);
    if (rec.is_upscaled) {
      item.appendChild(this.el("span", "film-item-2x", "2x"));
    }
    if (showFolderBadge && rec.group_folder) {
      const fBadge = this.el(
        "span",
        "film-item-folder-badge",
        `📁${compactOptionText(rec.group_folder, 5)}`
      );
      fBadge.title = `所属文件夹：${rec.group_folder}`;
      item.appendChild(fBadge);
    }
    const stageShort = formatStageBadgeLabel(rec.stage_code);
    item.appendChild(
      this.el("div", "film-item-lbl", stageShort ? `${rec.scene_id}·${stageShort}` : rec.scene_id)
    );

    item.addEventListener("click", () => {
      this.selectedGalleryIdx = idx;
      this.lastClickedGalleryId = rec.id;
      if (this.stageViewMode === "grid") {
        this.stageViewMode = "single";
      }
      this.renderHeroViewport();
      this.renderFilmstrip();
      this.setStatus(
        `🖼️ ${rec.is_starred ? "⭐ " : ""}${rec.scene_id}${stageShort ? ` (${stageShort})` : ""}${rec.group_folder ? ` [📁${rec.group_folder}]` : ""} · ${rec.width}×${rec.height}${rec.is_upscaled ? " [2x HD]" : ""} · Seed: ${rec.seed}`
      );
    });
    item.addEventListener("dblclick", () => {
      this.selectedGalleryIdx = idx;
      this.openLightbox(idx, "manual");
    });

    return item;
  }

  private wireDropZone(elZone: HTMLElement, onDropIds: (ids: string[]) => void): void {
    elZone.addEventListener("dragover", (ev) => {
      ev.preventDefault();
      if (ev.dataTransfer) ev.dataTransfer.dropEffect = "move";
      elZone.classList.add("drop-target-active");
    });
    elZone.addEventListener("dragleave", (ev) => {
      const related = ev.relatedTarget as Node | null;
      if (!related || !elZone.contains(related)) {
        elZone.classList.remove("drop-target-active");
      }
    });
    elZone.addEventListener("drop", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      elZone.classList.remove("drop-target-active");
      const ids = this.extractDraggedIds(ev);
      this.draggingRecordIds = [];
      if (ids.length > 0) onDropIds(ids);
    });
  }

  private renderExpandedOrganizer(filteredIndices: number[]): void {
    if (
      this.openedFolderName &&
      !this.galleryFolders.some((f) => f.name === this.openedFolderName)
    ) {
      this.openedFolderName = null;
    }
    if (
      this.pinnedTargetFolderName &&
      !this.galleryFolders.some((f) => f.name === this.pinnedTargetFolderName)
    ) {
      this.pinnedTargetFolderName = null;
    }

    const hasOpenFolder = Boolean(this.openedFolderName);
    const split = this.el(
      "div",
      `gallery-organizer-split ${hasOpenFolder ? "three-col" : "two-col"}`
    );

    // -------------------------------------------------------------------------
    // COLUMN 1: Ungrouped / Source Image Pool (Drag Source & Ungroup Dropzone)
    // -------------------------------------------------------------------------
    const ungroupedFiltered = filteredIndices.filter((i) => !this.gallery[i].group_folder);
    const leftPoolIndices =
      this.organizerLeftPoolMode === "ungrouped" ? ungroupedFiltered : filteredIndices;

    const colPool = this.el("div", "organizer-col organizer-col-pool");
    this.wireDropZone(colPool, (ids) => {
      void this.moveGalleryRecordsToFolder(ids, null);
    });

    const poolHead = this.el("div", "organizer-col-head");
    const poolSeg = this.el("div", "seg-group");
    const btnPoolUngrouped = this.el(
      "button",
      `seg-btn${this.organizerLeftPoolMode === "ungrouped" ? " active" : ""}`,
      `🖼️ 未分组(${ungroupedFiltered.length})`
    );
    btnPoolUngrouped.title = "仅展示尚未归入任何文件夹的图片（拖入右侧后自动从此处移走）";
    btnPoolUngrouped.addEventListener("click", () => {
      this.organizerLeftPoolMode = "ungrouped";
      this.renderFilmstrip();
    });
    const btnPoolAll = this.el(
      "button",
      `seg-btn${this.organizerLeftPoolMode === "all" ? " active" : ""}`,
      `全部(${filteredIndices.length})`
    );
    btnPoolAll.title = "展示当前筛选下的全部图片（含已归组图，带 📁 标记）";
    btnPoolAll.addEventListener("click", () => {
      this.organizerLeftPoolMode = "all";
      this.renderFilmstrip();
    });
    poolSeg.append(btnPoolUngrouped, btnPoolAll);

    const poolActs = this.el("div", "organizer-open-actions");
    const poolAllChecked =
      leftPoolIndices.length > 0 &&
      leftPoolIndices.every((idx) => this.checkedGalleryIds.has(this.gallery[idx].id));
    const btnPoolSelAll = this.el(
      "button",
      "btn btn-xs",
      poolAllChecked ? "取消全选" : "全选本栏"
    );
    btnPoolSelAll.disabled = leftPoolIndices.length === 0;
    btnPoolSelAll.title = "仅全选/取消勾选当前图池栏内的图片，不影响文件夹内的图片";
    btnPoolSelAll.addEventListener("click", () => {
      for (const idx of leftPoolIndices) {
        const id = this.gallery[idx].id;
        if (poolAllChecked) this.checkedGalleryIds.delete(id);
        else this.checkedGalleryIds.add(id);
      }
      this.renderFilmstrip();
      this.syncStageToolbar();
    });
    const btnPoolInvert = this.el("button", "btn btn-xs", "反选");
    btnPoolInvert.disabled = leftPoolIndices.length === 0;
    btnPoolInvert.title = "仅反选当前图池栏内的图片";
    btnPoolInvert.addEventListener("click", () => {
      for (const idx of leftPoolIndices) {
        const id = this.gallery[idx].id;
        if (this.checkedGalleryIds.has(id)) this.checkedGalleryIds.delete(id);
        else this.checkedGalleryIds.add(id);
      }
      this.renderFilmstrip();
      this.syncStageToolbar();
    });
    poolActs.append(btnPoolSelAll, btnPoolInvert);

    const poolHint = this.el(
      "span",
      "organizer-drag-hint",
      this.checkedGalleryIds.size > 0
        ? `📦 已选 ${this.checkedGalleryIds.size} 张 · 拖动任一即批量归组`
        : "拖拽图片 ➔ 右侧文件夹"
    );
    poolHead.append(poolSeg, poolActs, poolHint);

    const poolGrid = this.el("div", "organizer-thumb-grid");
    poolGrid.dataset.scrollKey = "pool";
    if (leftPoolIndices.length === 0) {
      poolGrid.appendChild(
        this.el(
          "div",
          "organizer-empty-note",
          this.organizerLeftPoolMode === "ungrouped"
            ? "✨ 未分组图片已全部归档完毕（将右侧文件夹内图片拖回此处可移出分组）"
            : "当前筛选条件下暂无图片"
        )
      );
    } else {
      for (const idx of leftPoolIndices) {
        const rec = this.gallery[idx];
        poolGrid.appendChild(
          this.createFilmThumbElement(
            rec,
            idx,
            leftPoolIndices,
            this.organizerLeftPoolMode === "all"
          )
        );
      }
    }
    colPool.append(poolHead, poolGrid);

    // -------------------------------------------------------------------------
    // COLUMN 2: User Folders List (Create / Pin / Dropzone / Click -> Open Col 3)
    // -------------------------------------------------------------------------
    const colFolders = this.el("div", "organizer-col organizer-col-folders");
    const fldHead = this.el("div", "organizer-col-head");
    fldHead.appendChild(
      this.el("span", "organizer-col-title", `📁 分组文件夹 (${this.galleryFolders.length})`)
    );

    const createRow = this.el("div", "folder-create-bar");
    const createInp = this.el("input", "folder-create-input") as HTMLInputElement;
    createInp.type = "text";
    createInp.placeholder = "输入新文件夹名称...";
    const btnCreate = this.el("button", "btn btn-xs btn-primary", "➕新建");
    const submitNewFolder = () => {
      const raw = createInp.value.trim();
      const fallback = `${this.activeSceneId || "分组"}_${this.galleryFolders.length + 1}`;
      const created = this.ensureGalleryFolderExists(raw || fallback);
      if (!created) return;
      createInp.value = "";
      this.openedFolderName = created;
      if (this.checkedGalleryIds.size > 0) {
        void this.moveGalleryRecordsToFolder(Array.from(this.checkedGalleryIds), created);
      } else {
        this.renderFilmstrip();
        this.setStatus(
          `📁 已新建并展开文件夹「${created}」（拖入左侧图片即可自动同步本地子文件夹）`
        );
      }
    };
    createInp.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        submitNewFolder();
      }
    });
    btnCreate.addEventListener("click", submitNewFolder);
    createRow.append(createInp, btnCreate);
    fldHead.appendChild(createRow);

    const fldList = this.el("div", "organizer-folder-list");
    fldList.dataset.scrollKey = "folders";
    for (const fld of this.galleryFolders) {
      const members = this.gallery.filter((g) => g.group_folder === fld.name);
      const isOpened = this.openedFolderName === fld.name;
      const isPinned = this.pinnedTargetFolderName === fld.name;
      const card = this.el(
        "div",
        `folder-card${isOpened ? " opened" : ""}${isPinned ? " pinned" : ""}`
      );
      card.title = isOpened
        ? `点击收起「${fld.name}」返回两栏视图`
        : `点击打开「${fld.name}」展开第三栏查看组内图片（支持直接拖拽图片到此卡片归组）`;

      this.wireDropZone(card, (ids) => {
        void this.moveGalleryRecordsToFolder(ids, fld.name);
      });

      const coverWrap = this.el("div", "folder-cover");
      if (members.length > 0) {
        const covImg = document.createElement("img");
        covImg.src = members[members.length - 1].objectUrl;
        covImg.alt = fld.name;
        covImg.draggable = false;
        coverWrap.appendChild(covImg);
      } else {
        coverWrap.appendChild(this.el("span", "folder-cover-empty", "📁"));
      }

      const infoCol = this.el("div", "folder-info");
      infoCol.appendChild(this.el("div", "folder-name", fld.name));
      infoCol.appendChild(
        this.el(
          "div",
          "folder-sub",
          `${members.length} 张${isPinned ? " · 🎯新图直入" : ""}${isOpened ? " · ▸已展开" : ""}`
        )
      );

      const fActs = this.el("div", "folder-actions");

      if (this.checkedGalleryIds.size > 0) {
        const bMoveIn = this.el("button", "btn btn-xs btn-primary", "📥");
        bMoveIn.title = `将已勾选的 ${this.checkedGalleryIds.size} 张图片一键移入「${fld.name}」`;
        bMoveIn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          void this.moveGalleryRecordsToFolder(Array.from(this.checkedGalleryIds), fld.name);
        });
        fActs.appendChild(bMoveIn);
      }

      const bPin = this.el(
        "button",
        `btn btn-xs${isPinned ? " pin-target-on" : ""}`,
        "🎯"
      );
      bPin.title = isPinned
        ? "已锁定：后续新生成的图片将自动直入此文件夹（再次点击取消）"
        : "设为默认入组目标：后续新生成图片自动存入此文件夹";
      bPin.addEventListener("click", (ev) => {
        ev.stopPropagation();
        this.pinnedTargetFolderName = isPinned ? null : fld.name;
        this.renderFilmstrip();
        this.setStatus(
          this.pinnedTargetFolderName
            ? `🎯 已开启新图直入文件夹「${fld.name}」`
            : "🎯 已恢复新图默认进入未分组图池"
        );
      });

      const bRen = this.el("button", "btn btn-xs", "✏️");
      bRen.title = "重命名此文件夹（同步移动本地子目录）";
      bRen.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const next = window.prompt("重命名分组文件夹：", fld.name);
        if (next !== null) {
          void this.renameGalleryFolder(fld.name, next);
        }
      });

      fActs.append(bPin, bRen);

      if (members.length > 0) {
        const bUngroup = this.el("button", "btn btn-xs", "📤");
        bUngroup.title = "解散此文件夹：内部图片全部退回未分组图池，不删除图片";
        bUngroup.addEventListener("click", (ev) => {
          ev.stopPropagation();
          void this.dissolveGalleryFolder(fld.name);
        });
        fActs.appendChild(bUngroup);
      }

      const bDelFld = this.el("button", "btn btn-xs btn-danger", "🗑️");
      bDelFld.title =
        members.length > 0 ? "连同组内图片与本地子目录一并删除" : "删除此空文件夹";
      bDelFld.addEventListener("click", (ev) => {
        ev.stopPropagation();
        void this.deleteGalleryFolder(fld.name);
      });
      fActs.appendChild(bDelFld);

      card.addEventListener("click", () => {
        this.openedFolderName = isOpened ? null : fld.name;
        this.renderFilmstrip();
      });

      card.append(coverWrap, infoCol, fActs);
      fldList.appendChild(card);
    }

    // Quick-create drop card at bottom of Column 2: drag images here to auto-create a new folder!
    const quickNewDrop = this.el(
      "div",
      "folder-new-dropzone",
      "➕ 拖放图片到此处，自动新建文件夹并归入"
    );
    this.wireDropZone(quickNewDrop, (ids) => {
      const firstRec = this.gallery.find((g) => ids.includes(g.id));
      const defaultName = `${firstRec?.scene_id || "分组"}_${this.galleryFolders.length + 1}`;
      const inputName = window.prompt("新建分组文件夹名称：", defaultName);
      if (inputName === null) return;
      const created = this.ensureGalleryFolderExists(inputName.trim() || defaultName);
      if (!created) return;
      this.openedFolderName = created;
      void this.moveGalleryRecordsToFolder(ids, created);
    });
    fldList.appendChild(quickNewDrop);

    colFolders.append(fldHead, fldList);
    split.append(colPool, colFolders);

    // -------------------------------------------------------------------------
    // COLUMN 3: Opened Folder Contents (Shown when user clicks a folder -> 3 Columns!)
    // -------------------------------------------------------------------------
    if (hasOpenFolder && this.openedFolderName) {
      const openName = this.openedFolderName;
      const openIndices = filteredIndices.filter(
        (i) => this.gallery[i].group_folder === openName
      );
      const allOpenMembers = this.gallery.filter((g) => g.group_folder === openName);

      const colOpen = this.el("div", "organizer-col organizer-col-opened");
      this.wireDropZone(colOpen, (ids) => {
        void this.moveGalleryRecordsToFolder(ids, openName);
      });

      const openHead = this.el("div", "organizer-col-head");
      openHead.appendChild(
        this.el(
          "span",
          "organizer-col-title",
          `📂 ${openName} (${openIndices.length}/${allOpenMembers.length})`
        )
      );

      const openActs = this.el("div", "organizer-open-actions");
      const openAllChecked =
        openIndices.length > 0 &&
        openIndices.every((idx) => this.checkedGalleryIds.has(this.gallery[idx].id));
      const bOpenSelAll = this.el(
        "button",
        "btn btn-xs",
        openAllChecked ? "取消全选" : "全选本组"
      );
      bOpenSelAll.disabled = openIndices.length === 0;
      bOpenSelAll.title = `仅全选/取消勾选「${openName}」内的 ${openIndices.length} 张图片，不影响未分组或其他文件夹`;
      bOpenSelAll.addEventListener("click", () => {
        for (const idx of openIndices) {
          const id = this.gallery[idx].id;
          if (openAllChecked) this.checkedGalleryIds.delete(id);
          else this.checkedGalleryIds.add(id);
        }
        this.renderFilmstrip();
        this.syncStageToolbar();
      });
      const bOpenInvert = this.el("button", "btn btn-xs", "反选");
      bOpenInvert.disabled = openIndices.length === 0;
      bOpenInvert.title = `仅反选「${openName}」内的图片`;
      bOpenInvert.addEventListener("click", () => {
        for (const idx of openIndices) {
          const id = this.gallery[idx].id;
          if (this.checkedGalleryIds.has(id)) this.checkedGalleryIds.delete(id);
          else this.checkedGalleryIds.add(id);
        }
        this.renderFilmstrip();
        this.syncStageToolbar();
      });
      openActs.append(bOpenSelAll, bOpenInvert);

      const externalCheckedIds = Array.from(this.checkedGalleryIds).filter(
        (id) => this.gallery.find((g) => g.id === id)?.group_folder !== openName
      );
      if (externalCheckedIds.length > 0) {
        const bPullChecked = this.el(
          "button",
          "btn btn-xs btn-primary",
          `📥 移入已选(${externalCheckedIds.length})`
        );
        bPullChecked.addEventListener("click", () => {
          void this.moveGalleryRecordsToFolder(externalCheckedIds, openName);
        });
        openActs.appendChild(bPullChecked);
      }

      const bUpFolder = this.el("button", "btn btn-xs", "✨ 本组2x");
      const unupscaledInFolder = allOpenMembers.filter((g) => !g.is_upscaled).map((g) => g.id);
      bUpFolder.disabled = unupscaledInFolder.length === 0 || this.isGenerating;
      bUpFolder.title = `对此文件夹内 ${unupscaledInFolder.length} 张 1x 图片批量执行 2x 高清放大`;
      bUpFolder.addEventListener("click", () => {
        void this.upscaleGalleryRecordsByIds(unupscaledInFolder);
      });

      const bZipFolder = this.el("button", "btn btn-xs", "📦 本组ZIP");
      bZipFolder.disabled = allOpenMembers.length === 0;
      bZipFolder.title = "单独打包下载此文件夹内的全部图片与 prompts.txt";
      bZipFolder.addEventListener("click", () => {
        this.exportGalleryZip(allOpenMembers, openName);
      });

      const bCloseCol3 = this.el("button", "btn btn-xs", "✕ 收起");
      bCloseCol3.title = "关闭第三栏回到两栏视图";
      bCloseCol3.addEventListener("click", () => {
        this.openedFolderName = null;
        this.renderFilmstrip();
      });

      openActs.append(bUpFolder, bZipFolder, bCloseCol3);
      openHead.appendChild(openActs);

      const openGrid = this.el("div", "organizer-thumb-grid");
      openGrid.dataset.scrollKey = "opened";
      if (openIndices.length === 0) {
        openGrid.appendChild(
          this.el(
            "div",
            "organizer-empty-note",
            allOpenMembers.length === 0
              ? `📂 文件夹「${openName}」为空 · 直接将第 1 栏图片拖入此处即可自动分文件夹落盘`
              : "当前顶部筛选条件下该组暂无匹配图片（切换「全部」查看全部组内图片）"
          )
        );
      } else {
        for (const idx of openIndices) {
          openGrid.appendChild(
            this.createFilmThumbElement(this.gallery[idx], idx, openIndices, false)
          );
        }
      }

      colOpen.append(openHead, openGrid);
      split.appendChild(colOpen);
    }

    this.elFilmstripScroll.appendChild(split);
  }

  private renderFilmstrip(scrollActiveIntoView = false): void {
    if (this.isPortraitCompactStage && this.filmstripExpanded && this.promptDrawerExpanded) {
      this.togglePromptDrawer(false);
    }
    if (this.gallery.length === 0 && this.galleryFolders.length === 0 && !this.filmstripExpanded) {
      this.elFilmstripBar.classList.add("hidden");
      this.snapshotCollapsedBarHeights();
      this.syncPortraitOverlayState();
      this.syncStageToolbar();
      return;
    }
    this.elFilmstripBar.classList.remove("hidden");
    this.elFilmstripBar.classList.toggle("expanded", this.filmstripExpanded);
    if (this.elFilmExpandBtn) {
      const grpSuffix =
        this.galleryFolders.length > 0 ? `(${this.galleryFolders.length}组)` : "";
      this.elFilmExpandBtn.textContent = this.filmstripExpanded
        ? this.isPortraitCompactStage
          ? "▾ 收起看图"
          : "▾ 收起单行"
        : `▴ 分栏归档${grpSuffix}`;
    }
    if (this.elBatchMoveFolderSelect) {
      const chkCnt = this.checkedGalleryIds.size;
      this.elBatchMoveFolderSelect.innerHTML = "";
      const headOpt = this.el(
        "option",
        "",
        chkCnt > 0 ? `📥 移入文件夹(${chkCnt})` : "📥 移入文件夹"
      );
      headOpt.value = "";
      this.elBatchMoveFolderSelect.appendChild(headOpt);
      const newOpt = this.el("option", "", "➕ 新建文件夹并移入...");
      newOpt.value = "__new__";
      this.elBatchMoveFolderSelect.appendChild(newOpt);
      for (const fld of this.galleryFolders) {
        const fldOpt = this.el("option", "", `📁 ${fld.name}`);
        fldOpt.value = `fld:${fld.name}`;
        this.elBatchMoveFolderSelect.appendChild(fldOpt);
      }
      if (this.gallery.some((g) => Boolean(g.group_folder))) {
        const outOpt = this.el("option", "", "📤 移出分组 (回未分组)");
        outOpt.value = "__ungroup__";
        this.elBatchMoveFolderSelect.appendChild(outOpt);
      }
      this.elBatchMoveFolderSelect.value = "";
    }

    // Preserve scroll positions across DOM rebuilds (prevents scrollbar reset to top on arrow keys / checkbox clicks)
    const prevOuterScrollLeft = this.elFilmstripScroll.scrollLeft;
    const prevOuterScrollTop = this.elFilmstripScroll.scrollTop;
    const savedPaneScrolls = new Map<string, { top: number; left: number }>();
    this.elFilmstripScroll
      .querySelectorAll<HTMLElement>("[data-scroll-key]")
      .forEach((pane) => {
        const key = pane.dataset.scrollKey;
        if (key) {
          savedPaneScrolls.set(key, { top: pane.scrollTop, left: pane.scrollLeft });
        }
      });

    // Update filter pill counts & scene selector options
    const starCnt = this.gallery.filter((g) => g.is_starred).length;
    const upCnt = this.gallery.filter((g) => g.is_upscaled).length;
    const btnAll = this.elFilmFilterBtns.get("all");
    const btnStar = this.elFilmFilterBtns.get("starred");
    const btnUp = this.elFilmFilterBtns.get("upscaled");
    if (btnAll) {
      btnAll.textContent = `全部(${this.gallery.length})`;
      btnAll.classList.toggle("active", this.galleryFilterMode === "all");
    }
    if (btnStar) {
      btnStar.textContent = `⭐收藏(${starCnt})`;
      btnStar.classList.toggle("active", this.galleryFilterMode === "starred");
    }
    if (btnUp) {
      btnUp.textContent = `🔍2x(${upCnt})`;
      btnUp.classList.toggle("active", this.galleryFilterMode === "upscaled");
    }

    if (this.elFilmSceneSelect) {
      const sceneCounts = new Map<string, number>();
      for (const g of this.gallery) {
        sceneCounts.set(g.scene_id, (sceneCounts.get(g.scene_id) ?? 0) + 1);
      }
      const prevVal = this.galleryFilterMode === "scene" ? this.gallerySceneFilter : "";
      this.elFilmSceneSelect.innerHTML = "";
      const defOpt = this.el("option", "", "📍 按体位筛选");
      defOpt.value = "";
      this.elFilmSceneSelect.appendChild(defOpt);
      for (const [sid, cnt] of sceneCounts.entries()) {
        const opt = this.el("option", "", `${sid} (${cnt})`);
        opt.value = sid;
        this.elFilmSceneSelect.appendChild(opt);
      }
      if (prevVal && sceneCounts.has(prevVal)) {
        this.elFilmSceneSelect.value = prevVal;
      } else if (this.galleryFilterMode === "scene") {
        this.galleryFilterMode = "all";
        this.gallerySceneFilter = "";
      }
    }

    this.elFilmstripScroll.innerHTML = "";
    const filteredIndices = this.getFilteredGalleryIndices();

    // Expanded state: 2-Column ➔ 3-Column Drag-and-Drop Folder Organizer
    if (this.filmstripExpanded) {
      this.renderExpandedOrganizer(filteredIndices);
      this.elFilmstripScroll
        .querySelectorAll<HTMLElement>("[data-scroll-key]")
        .forEach((pane) => {
          const key = pane.dataset.scrollKey;
          const prev = key ? savedPaneScrolls.get(key) : undefined;
          if (prev) {
            pane.scrollTop = prev.top;
            pane.scrollLeft = prev.left;
          }
        });
      if (scrollActiveIntoView) {
        this.elFilmstripScroll
          .querySelectorAll<HTMLElement>(".film-item.active")
          .forEach((activeEl) => {
            activeEl.scrollIntoView({ behavior: "auto", block: "nearest", inline: "nearest" });
          });
      }
      this.syncPortraitOverlayState();
      this.syncStageToolbar();
      return;
    }

    if (filteredIndices.length === 0) {
      const emptyNote = this.el(
        "div",
        "film-empty-filter-note",
        this.gallery.length === 0
          ? "已预建分组文件夹 · 点击左侧「▴ 分栏归档」管理文件夹，或直接生图"
          : "当前筛选条件下暂无图片（点击左侧「全部」返回）"
      );
      this.elFilmstripScroll.appendChild(emptyNote);
      this.snapshotCollapsedBarHeights();
      this.syncPortraitOverlayState();
      this.syncStageToolbar();
      return;
    }

    let activeDomChild: HTMLElement | null = null;
    for (const idx of filteredIndices) {
      const rec = this.gallery[idx];
      const item = this.createFilmThumbElement(rec, idx, filteredIndices, true);
      if (idx === this.selectedGalleryIdx) activeDomChild = item;
      this.elFilmstripScroll.appendChild(item);
    }

    this.elFilmstripScroll.scrollLeft = prevOuterScrollLeft;
    this.elFilmstripScroll.scrollTop = prevOuterScrollTop;
    if (scrollActiveIntoView && activeDomChild) {
      activeDomChild.scrollIntoView({ behavior: "auto", inline: "nearest", block: "nearest" });
    }
    this.snapshotCollapsedBarHeights();
    this.syncPortraitOverlayState();
    this.syncStageToolbar();
  }

  private exportGalleryZip(
    customTargets?: GeneratedImageRecord[],
    customFolderLabel?: string
  ): void {
    if (this.gallery.length === 0 && (!customTargets || customTargets.length === 0)) {
      this.setStatus("⚠️ 当前画廊为空，无可打包图片", true);
      return;
    }
    const filtered = this.getFilteredGalleryIndices().map((i) => this.gallery[i]);
    const targets =
      customTargets && customTargets.length > 0
        ? customTargets
        : this.checkedGalleryIds.size > 0
          ? this.gallery.filter((g) => this.checkedGalleryIds.has(g.id))
          : filtered.length > 0
            ? filtered
            : this.gallery;

    const resolveZipEntryPath = (g: GeneratedImageRecord): string => {
      const safeFolder = g.group_folder ? sanitizeSubfolderName(g.group_folder) : "";
      return safeFolder ? `${safeFolder}/${g.filename}` : g.filename;
    };

    const entries: Array<{ name: string; data: Uint8Array | string }> = targets.map((g) => ({
      name: resolveZipEntryPath(g),
      data: g.bytes,
    }));
    const logTxt = targets
      .map((g) => {
        const entryPath = resolveZipEntryPath(g);
        return `# ${entryPath} (${g.width}x${g.height}, Seed=${g.seed}${g.is_starred ? ", STARRED" : ""})\n[Positive]\n${g.prompt_pos || ""}\n[Negative]\n${g.prompt_neg || ""}\n`;
      })
      .join("\n----------------------------------------\n");
    entries.push({ name: "prompts.txt", data: logTxt });
    const zip = buildStoreZipBlob(entries);
    const safePrefix = customFolderLabel ? `_${sanitizeSubfolderName(customFolderLabel)}` : "";
    triggerBlobDownload(
      zip,
      `NAI_Studio${safePrefix}_${formatDateYYYYMMDD()}_${formatTimeHHMMSS()}.zip`
    );
    this.setStatus(
      `📦 已按文件夹层级打包下载 ${targets.length} 张图片与 prompts.txt`
    );
  }

  private bindGlobalEvents(): void {
    document.addEventListener("click", () => {
      this.closeAllPopovers();
    });

    window.addEventListener("resize", () => {
      this.evaluateCenterStageSpaceBudget();
    });
    window.visualViewport?.addEventListener("resize", () => {
      this.evaluateCenterStageSpaceBudget();
    });
    document.addEventListener("focusout", () => {
      window.setTimeout(() => this.evaluateCenterStageSpaceBudget(), 60);
    });

    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") {
        if (this.lightboxOpen) {
          this.closeLightbox();
        } else if (
          this.isPortraitCompactStage &&
          (this.filmstripExpanded || this.promptDrawerExpanded)
        ) {
          if (this.filmstripExpanded) this.setFilmstripExpanded(false);
          if (this.promptDrawerExpanded) this.togglePromptDrawer(false);
        } else if (this.stageViewMode === "grid" || this.stageViewMode === "compare") {
          this.stageViewMode = "single";
          this.renderHeroViewport();
        } else {
          this.closeAllPopovers();
        }
        return;
      }

      // Never hijack keystrokes while typing inside form inputs / textareas / selects
      const activeEl = document.activeElement as HTMLElement | null;
      if (
        ev.ctrlKey ||
        ev.metaKey ||
        ev.altKey ||
        (activeEl &&
          (activeEl.tagName === "INPUT" ||
            activeEl.tagName === "TEXTAREA" ||
            activeEl.tagName === "SELECT" ||
            activeEl.isContentEditable))
      ) {
        return;
      }

      if (this.lightboxOpen) {
        const curRec = this.gallery[this.lightboxIdx];
        if (ev.key === "ArrowLeft") {
          ev.preventDefault();
          this.stepLightbox(-1, true);
        } else if (ev.key === "ArrowRight" || ev.key === " ") {
          ev.preventDefault();
          this.stepLightbox(1, true);
        } else if ((ev.key === "f" || ev.key === "F") && curRec) {
          ev.preventDefault();
          void this.toggleGalleryStar(curRec.id);
        } else if ((ev.key === "Delete" || ev.key === "Backspace") && curRec && !this.isGenerating) {
          ev.preventDefault();
          void this.deleteGalleryRecordsByIds([curRec.id], `🗑️ 已删除 ${curRec.scene_id}`);
        } else if ((ev.key === "r" || ev.key === "R") && curRec && !this.isGenerating) {
          ev.preventDefault();
          this.selectedGalleryIdx = this.lightboxIdx;
          this.closeLightbox();
          void this.startOrContinueShootout(curRec.id, this.rerollCountPerRound);
        }
        return;
      }

      if (this.gallery.length === 0) return;
      const stageRec = this.gallery[this.selectedGalleryIdx];
      if (ev.key === "ArrowLeft") {
        ev.preventDefault();
        this.stepCenterGallery(-1);
      } else if (ev.key === "ArrowRight") {
        ev.preventDefault();
        this.stepCenterGallery(1);
      } else if ((ev.key === "f" || ev.key === "F") && stageRec) {
        ev.preventDefault();
        void this.toggleGalleryStar(stageRec.id);
      } else if ((ev.key === "Delete" || ev.key === "Backspace") && stageRec && !this.isGenerating) {
        ev.preventDefault();
        void this.deleteGalleryRecordsByIds([stageRec.id], `🗑️ 已删除 ${stageRec.scene_id}`);
      } else if (ev.key === " " && stageRec) {
        ev.preventDefault();
        if (this.checkedGalleryIds.has(stageRec.id)) {
          this.checkedGalleryIds.delete(stageRec.id);
        } else {
          this.checkedGalleryIds.add(stageRec.id);
        }
        this.lastClickedGalleryId = stageRec.id;
        this.renderFilmstrip();
        this.syncStageToolbar();
      } else if ((ev.key === "r" || ev.key === "R") && stageRec && !this.isGenerating) {
        ev.preventDefault();
        void this.startOrContinueShootout(stageRec.id, this.rerollCountPerRound);
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
      checked_other_action_ids: Array.from(this.checkedOtherActionIds),
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
      subscription: this.subInfo,
      gallery: (() => {
        const summary = buildGalleryFolderSummaries(
          this.gallery,
          this.galleryFolders,
          this.openedFolderName,
          this.pinnedTargetFolderName
        );
        const selRec = this.gallery[this.selectedGalleryIdx];
        const latestRec = this.gallery[this.gallery.length - 1];
        return {
          count: this.gallery.length,
          ungrouped_count: summary.ungrouped_count,
          starred_count: summary.starred_count,
          upscaled_count: summary.upscaled_count,
          checked_count: this.checkedGalleryIds.size,
          selected_index: this.selectedGalleryIdx,
          expanded: this.filmstripExpanded,
          opened_folder: this.openedFolderName,
          pinned_folder: this.pinnedTargetFolderName,
          mounted_dir_name: getMountedDirName(),
          folders: summary.folders,
          selected: selRec
            ? {
                index: this.selectedGalleryIdx,
                id: selRec.id,
                filename: selRec.filename,
                scene_id: selRec.scene_id,
                stage_code: selRec.stage_code || null,
                seed: selRec.seed,
                width: selRec.width,
                height: selRec.height,
                group_folder: selRec.group_folder || null,
                is_starred: Boolean(selRec.is_starred),
                is_upscaled: Boolean(selRec.is_upscaled),
              }
            : null,
          latest: latestRec
            ? {
                index: this.gallery.length - 1,
                id: latestRec.id,
                filename: latestRec.filename,
                scene_id: latestRec.scene_id,
                stage_code: latestRec.stage_code || null,
                seed: latestRec.seed,
                width: latestRec.width,
                height: latestRec.height,
                group_folder: latestRec.group_folder || null,
                is_starred: Boolean(latestRec.is_starred),
                is_upscaled: Boolean(latestRec.is_upscaled),
              }
            : null,
        };
      })(),
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
          const nextVal =
            k === "lighting_preset" && typeof v === "string"
              ? normalizeLightingPresetName(v)
              : v;
          (this.cfg as unknown as Record<string, unknown>)[k] = nextVal;
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
        params.action_mode === "other" ||
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
        } else if (
          this.isOtherActionId(sid) ||
          sid.startsWith("SF") ||
          sid.startsWith("KTD") ||
          sid.startsWith("KT") ||
          sid.startsWith("PLD") ||
          sid.startsWith("PL") ||
          sid.startsWith("CV") ||
          sid.startsWith("BT") ||
          sid.startsWith("HWD") ||
          sid.startsWith("PS") ||
          sid.startsWith("CP") ||
          sid.startsWith("AFD") ||
          sid.startsWith("ONS")
        ) {
          this.actionMode = "other";
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
      if (Array.isArray(params.checked_other_action_ids)) {
        this.checkedOtherActionIds = new Set(
          params.checked_other_action_ids.filter((x): x is string => typeof x === "string")
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
        this.togglePromptDrawer(true);
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

    if (method === "list_files") {
      const folderFilter =
        typeof params.folder === "string" ? params.folder.trim() : undefined;
      const sceneFilter =
        typeof params.scene_id === "string" ? params.scene_id.trim().toUpperCase() : "";
      const scenePrefix =
        typeof params.scene_prefix === "string" ? params.scene_prefix.trim().toUpperCase() : "";
      const starredOnly = Boolean(params.starred_only);
      const upscaledOnly = Boolean(params.upscaled_only);
      const includePrompts = Boolean(params.include_prompts);
      const offset = Math.max(0, Math.trunc(Number(params.offset ?? 0) || 0));
      const limit = Math.max(1, Math.min(200, Math.trunc(Number(params.limit ?? 100) || 100)));

      const summary = buildGalleryFolderSummaries(
        this.gallery,
        this.galleryFolders,
        this.openedFolderName,
        this.pinnedTargetFolderName
      );

      const matchedEntries: Array<{ index: number; rec: GeneratedImageRecord }> = [];
      for (let i = 0; i < this.gallery.length; i++) {
        const rec = this.gallery[i];
        if (folderFilter !== undefined && folderFilter !== "*") {
          const recFolder = rec.group_folder || "";
          if (folderFilter === "") {
            if (recFolder !== "") continue;
          } else if (recFolder.toLowerCase() !== folderFilter.toLowerCase()) {
            continue;
          }
        }
        if (sceneFilter && (rec.scene_id || "").toUpperCase() !== sceneFilter) continue;
        if (scenePrefix && !(rec.scene_id || "").toUpperCase().startsWith(scenePrefix)) continue;
        if (starredOnly && !rec.is_starred) continue;
        if (upscaledOnly && !rec.is_upscaled) continue;
        matchedEntries.push({ index: i, rec });
      }

      const paged = matchedEntries.slice(offset, offset + limit).map(({ index, rec }) => ({
        index,
        id: rec.id,
        filename: rec.filename,
        scene_id: rec.scene_id,
        stage_code: rec.stage_code || null,
        seed: rec.seed,
        width: rec.width,
        height: rec.height,
        group_folder: rec.group_folder || null,
        is_starred: Boolean(rec.is_starred),
        is_upscaled: Boolean(rec.is_upscaled),
        is_checked: this.checkedGalleryIds.has(rec.id),
        saved_to_dir: Boolean(rec.saved_to_dir),
        disk_subpath: rec.disk_subpath || null,
        created_at: rec.created_at,
        ...(includePrompts
          ? { prompt_pos: rec.prompt_pos || "", prompt_neg: rec.prompt_neg || "" }
          : {}),
      }));

      return {
        mounted_dir_name: getMountedDirName(),
        expanded: this.filmstripExpanded,
        opened_folder: this.openedFolderName,
        pinned_folder: this.pinnedTargetFolderName,
        selected_index: this.selectedGalleryIdx,
        checked_count: this.checkedGalleryIds.size,
        total_count: summary.total_count,
        ungrouped_count: summary.ungrouped_count,
        starred_count: summary.starred_count,
        upscaled_count: summary.upscaled_count,
        folders: summary.folders,
        matched_count: matchedEntries.length,
        offset,
        limit,
        images: paged,
      };
    }

    if (method === "manage_files") {
      const action = String(params.action || "").trim();
      const resolveExistingFolderName = (raw: string): string | null => {
        const trimmed = raw.trim();
        if (!trimmed) return null;
        const found = this.galleryFolders.find(
          (f) => f.name.toLowerCase() === trimmed.toLowerCase()
        );
        return found ? found.name : null;
      };
      const buildOverview = () => ({
        expanded: this.filmstripExpanded,
        opened_folder: this.openedFolderName,
        pinned_folder: this.pinnedTargetFolderName,
        mounted_dir_name: getMountedDirName(),
        selected_index: this.selectedGalleryIdx,
        checked_count: this.checkedGalleryIds.size,
        ...buildGalleryFolderSummaries(
          this.gallery,
          this.galleryFolders,
          this.openedFolderName,
          this.pinnedTargetFolderName
        ),
      });

      if (action === "create_folder") {
        const rawName = String(params.folder_name || "").trim();
        if (!rawName) throw new Error("Missing folder_name for create_folder");
        const created = this.ensureGalleryFolderExists(rawName);
        if (!created) throw new Error(`Invalid folder_name: '${rawName}'`);
        if (params.open === true) {
          this.openedFolderName = created;
          this.setFilmstripExpanded(true);
        }
        if (params.pin === true) {
          this.pinnedTargetFolderName = created;
        }
        this.renderFilmstrip();
        this.setStatus(`🤖 MCP 已创建网页分组文件夹「${created}」`);
        return { action, folder_name: created, gallery: buildOverview() };
      }

      if (action === "rename_folder") {
        const rawOld = String(params.folder_name || "").trim();
        const rawNew = String(params.new_name || "").trim();
        if (!rawOld || !rawNew) {
          throw new Error("Missing folder_name or new_name for rename_folder");
        }
        const existingName = resolveExistingFolderName(rawOld);
        if (!existingName) throw new Error(`文件夹不存在: '${rawOld}'`);
        const res = await this.renameGalleryFolder(existingName, rawNew, {
          skipConfirm: true,
          mergeIfExists: params.merge_if_exists !== false,
        });
        return {
          action,
          old_name: existingName,
          new_name: res?.renamedTo ?? existingName,
          merged: res?.merged ?? false,
          moved_count: res?.movedCount ?? 0,
          gallery: buildOverview(),
        };
      }

      if (action === "dissolve_folder") {
        const rawName = String(params.folder_name || "").trim();
        if (!rawName) throw new Error("Missing folder_name for dissolve_folder");
        const existingName = resolveExistingFolderName(rawName);
        if (!existingName) throw new Error(`文件夹不存在: '${rawName}'`);
        const res = await this.dissolveGalleryFolder(existingName);
        return {
          action,
          folder_name: existingName,
          ungrouped_count: res.ungroupedCount,
          gallery: buildOverview(),
        };
      }

      if (action === "delete_folder") {
        const rawName = String(params.folder_name || "").trim();
        if (!rawName) throw new Error("Missing folder_name for delete_folder");
        const existingName = resolveExistingFolderName(rawName);
        if (!existingName) throw new Error(`文件夹不存在: '${rawName}'`);
        const res = await this.deleteGalleryFolder(existingName, { skipConfirm: true });
        return {
          action,
          folder_name: existingName,
          deleted_images_count: res.deletedImagesCount,
          gallery: buildOverview(),
        };
      }

      if (action === "open_folder") {
        const rawName =
          params.folder_name === null || params.folder_name === undefined
            ? null
            : String(params.folder_name).trim() || null;
        if (rawName) {
          const existingName = resolveExistingFolderName(rawName);
          if (!existingName) throw new Error(`文件夹不存在: '${rawName}'`);
          this.openedFolderName = existingName;
        } else {
          this.openedFolderName = null;
        }
        if (typeof params.expanded === "boolean") {
          this.setFilmstripExpanded(params.expanded);
        } else if (rawName) {
          this.setFilmstripExpanded(true);
        } else {
          this.renderFilmstrip();
        }
        this.setStatus(
          this.openedFolderName
            ? `🤖 MCP 已展开文件夹「${this.openedFolderName}」`
            : "🤖 MCP 已收起文件夹第三栏"
        );
        return {
          action,
          opened_folder: this.openedFolderName,
          expanded: this.filmstripExpanded,
          gallery: buildOverview(),
        };
      }

      if (action === "pin_folder") {
        const rawName =
          params.folder_name === null || params.folder_name === undefined
            ? null
            : String(params.folder_name).trim() || null;
        if (rawName) {
          const resolved = this.ensureGalleryFolderExists(rawName);
          if (!resolved) throw new Error(`Invalid folder_name: '${rawName}'`);
          this.pinnedTargetFolderName = resolved;
        } else {
          this.pinnedTargetFolderName = null;
        }
        this.renderFilmstrip();
        this.setStatus(
          this.pinnedTargetFolderName
            ? `🤖 MCP 已锁定新图直入文件夹「${this.pinnedTargetFolderName}」`
            : "🤖 MCP 已取消新图直入文件夹锁定"
        );
        return {
          action,
          pinned_folder: this.pinnedTargetFolderName,
          gallery: buildOverview(),
        };
      }

      if (action === "move_images") {
        const selector = (params.selector as GalleryFileSelector | undefined) ?? null;
        if (!hasEffectiveGallerySelector(selector)) {
          throw new Error(
            "move_images 需要提供有效的 selector（如 image_ids / gallery_indices / index_range / from_folder / scene_ids / scene_prefix 等）"
          );
        }
        const indices = selectGalleryRecordIndices(
          this.gallery,
          this.selectedGalleryIdx,
          this.checkedGalleryIds,
          selector
        );
        const targetRaw =
          params.target_folder === null || params.target_folder === undefined
            ? null
            : String(params.target_folder).trim() || null;
        const ids = indices.map((i) => this.gallery[i].id);
        const moveRes =
          ids.length > 0
            ? await this.moveGalleryRecordsToFolder(ids, targetRaw)
            : {
                movedCount: 0,
                targetFolder: targetRaw ? this.ensureGalleryFolderExists(targetRaw) : "",
              };
        if (params.open_target_folder === true && moveRes.targetFolder) {
          this.openedFolderName = moveRes.targetFolder;
          this.setFilmstripExpanded(true);
        }
        return {
          action,
          matched_count: indices.length,
          moved_count: moveRes.movedCount,
          target_folder: moveRes.targetFolder || null,
          gallery: buildOverview(),
        };
      }

      if (action === "select_image") {
        let idx = -1;
        if (typeof params.image_id === "string" && params.image_id.trim()) {
          idx = this.gallery.findIndex((g) => g.id === params.image_id);
        } else if (typeof params.gallery_index === "number") {
          idx = Math.trunc(params.gallery_index);
        }
        const rec = this.gallery[idx];
        if (!rec) {
          throw new Error("未找到指定图片（请先调用 nai_list_files 确认 image_id 或 gallery_index）");
        }
        this.selectedGalleryIdx = idx;
        this.stageViewMode = "single";
        this.renderHeroViewport();
        this.renderFilmstrip(true);
        return {
          action,
          selected: {
            index: idx,
            id: rec.id,
            filename: rec.filename,
            scene_id: rec.scene_id,
            stage_code: rec.stage_code || null,
            seed: rec.seed,
            group_folder: rec.group_folder || null,
            is_starred: Boolean(rec.is_starred),
            is_upscaled: Boolean(rec.is_upscaled),
          },
        };
      }

      if (action === "star_images") {
        const selector = (params.selector as GalleryFileSelector | undefined) ?? null;
        if (!hasEffectiveGallerySelector(selector)) {
          throw new Error("star_images 需要提供有效的 selector");
        }
        const starred = params.starred !== false;
        const indices = selectGalleryRecordIndices(
          this.gallery,
          this.selectedGalleryIdx,
          this.checkedGalleryIds,
          selector
        );
        const ids = indices.map((i) => this.gallery[i].id);
        const updatedCount = await this.setGalleryStarStateByIds(ids, starred);
        return {
          action,
          starred,
          matched_count: indices.length,
          updated_count: updatedCount,
          gallery: buildOverview(),
        };
      }

      if (action === "delete_images") {
        if (this.isGenerating) {
          throw new Error("网页当前正在执行生图/放大任务，请稍后再删除图片");
        }
        const selector = (params.selector as GalleryFileSelector | undefined) ?? null;
        if (!hasEffectiveGallerySelector(selector)) {
          throw new Error(
            "delete_images 需要提供有效的 selector（如 image_ids / gallery_indices / from_folder / unstarred_only 等；若要清空全部请显式传 selector: { from_folder: '*' }）"
          );
        }
        const indices = selectGalleryRecordIndices(
          this.gallery,
          this.selectedGalleryIdx,
          this.checkedGalleryIds,
          selector
        );
        const ids = indices.map((i) => this.gallery[i].id);
        const filenames = indices.map((i) => this.gallery[i].filename);
        if (ids.length > 0) {
          await this.deleteGalleryRecordsByIds(
            ids,
            `🤖 MCP 已删除 ${ids.length} 张画廊图片`
          );
        }
        return {
          action,
          deleted_count: ids.length,
          deleted_filenames: filenames,
          gallery: buildOverview(),
        };
      }

      if (action === "upscale_images") {
        if (this.isGenerating) {
          throw new Error("网页当前正在执行生图/放大任务，请等待完成后再试");
        }
        const selector = (params.selector as GalleryFileSelector | undefined) ?? null;
        if (!hasEffectiveGallerySelector(selector)) {
          throw new Error("upscale_images 需要提供有效的 selector");
        }
        const indices = selectGalleryRecordIndices(
          this.gallery,
          this.selectedGalleryIdx,
          this.checkedGalleryIds,
          selector
        );
        const targetIds = indices
          .map((i) => this.gallery[i])
          .filter((rec) => !rec.is_upscaled)
          .map((rec) => rec.id);
        if (targetIds.length === 0) {
          return {
            action,
            matched_count: indices.length,
            upscaled_count: 0,
            message: "匹配的图片均已完成 2x 放大或无匹配图片",
            gallery: buildOverview(),
          };
        }
        await this.upscaleGalleryRecordsByIds(targetIds);
        return {
          action,
          matched_count: indices.length,
          upscaled_count: targetIds.length,
          gallery: buildOverview(),
        };
      }

      if (action === "export_zip") {
        const folderNameRaw =
          typeof params.folder_name === "string" ? params.folder_name.trim() : "";
        const selector = (params.selector as GalleryFileSelector | undefined) ?? null;
        let targets: GeneratedImageRecord[] = [];
        let label = typeof params.label === "string" ? params.label.trim() : "";

        if (folderNameRaw) {
          const resolved = resolveExistingFolderName(folderNameRaw) || folderNameRaw;
          targets = this.gallery.filter(
            (g) => (g.group_folder || "").toLowerCase() === resolved.toLowerCase()
          );
          if (!label) label = resolved;
        } else if (hasEffectiveGallerySelector(selector)) {
          const indices = selectGalleryRecordIndices(
            this.gallery,
            this.selectedGalleryIdx,
            this.checkedGalleryIds,
            selector
          );
          targets = indices.map((i) => this.gallery[i]);
        } else {
          targets = [...this.gallery];
        }
        if (targets.length === 0) {
          throw new Error("没有符合条件的图片可供打包下载 ZIP");
        }
        this.exportGalleryZip(targets, label || undefined);
        return {
          action,
          exported_count: targets.length,
          label: label || null,
        };
      }

      throw new Error(`Unknown manage_files action: ${action}`);
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
      const targetFolderRaw =
        typeof params.target_folder === "string" ? params.target_folder.trim() : "";
      const targetGroupFolder = targetFolderRaw
        ? this.ensureGalleryFolderExists(targetFolderRaw) || undefined
        : undefined;
      const targetIds =
        sceneIdsRaw.length > 0
          ? sceneIdsRaw
          : [this.actionMode === "free" ? "FREE" : this.activeSceneId];
      const queue: Array<{
        sceneId: string;
        useManualPrompt?: boolean;
        forceRandomSeed?: boolean;
        targetGroupFolder?: string;
      }> = [];
      for (const sid of targetIds) {
        for (let c = 0; c < count; c++) {
          queue.push({
            sceneId: sid,
            useManualPrompt: sid === targetIds[0] && this.isManualPromptEdited,
            forceRandomSeed,
            targetGroupFolder,
          });
        }
      }

      const prevCount = this.gallery.length;
      const waitFinish = params.wait_for_result !== false;
      if (!waitFinish) {
        void this.runGenerationQueue(queue);
        return {
          started: true,
          queued_tasks: queue.length,
          target_folder: targetGroupFolder || this.pinnedTargetFolderName || null,
        };
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
        target_folder: latest?.group_folder || targetGroupFolder || null,
        latest_image: latest
          ? {
              id: latest.id,
              index: this.gallery.length - 1,
              filename: latest.filename,
              scene_id: latest.scene_id,
              seed: latest.seed,
              width: latest.width,
              height: latest.height,
              group_folder: latest.group_folder || null,
              elapsed_sec: latest.elapsed_sec,
              is_upscaled: Boolean(latest.is_upscaled),
              local_preview_path: savedPreviewPath,
            }
          : null,
      };
    }

    if (method === "get_latest_image") {
      let idx = -1;
      if (typeof params.image_id === "string" && params.image_id.trim()) {
        idx = this.gallery.findIndex((g) => g.id === params.image_id);
      } else if (typeof params.gallery_index === "number") {
        idx = Math.trunc(params.gallery_index);
      } else {
        idx = this.selectedGalleryIdx >= 0 ? this.selectedGalleryIdx : this.gallery.length - 1;
      }
      const rec = this.gallery[idx];
      if (!rec) {
        throw new Error("当前网页画廊为空或未找到指定图片。");
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
        id: rec.id,
        index: idx,
        filename: rec.filename,
        scene_id: rec.scene_id,
        stage_code: rec.stage_code || null,
        seed: rec.seed,
        width: rec.width,
        height: rec.height,
        group_folder: rec.group_folder || null,
        is_starred: Boolean(rec.is_starred),
        is_upscaled: Boolean(rec.is_upscaled),
        local_preview_path: savedPath,
      };
    }

    throw new Error(`Unsupported MCP bridge method: ${method}`);
  }
}
