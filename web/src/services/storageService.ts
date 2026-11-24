import { BUNDLED_CUSTOM_PRESETS, normalizeLightingPresetName } from "../data/engineConstants";
import {
  createDefaultCharacterConfig,
  createDefaultNaiApiSettings,
  type CharacterConfig,
  type GalleryFolderItem,
  type GeneratedImageRecord,
  type NaiApiSettings,
  type StoredVibeItem,
} from "../engine/types";

const LS_CFG_KEY = "nai_wb_active_config_v1";
const LS_PRESETS_KEY = "nai_wb_custom_presets_v1";
const LS_DELETED_PRESETS_KEY = "nai_wb_deleted_presets_v1";
const LS_API_KEY = "nai_wb_api_settings_v1";
const LS_MCP_ENABLED_KEY = "nai_wb_mcp_enabled_v1";
const LS_MCP_ENDPOINT_KEY = "nai_wb_mcp_endpoint_v1";
const LS_GALLERY_FOLDERS_KEY = "nai_wb_gallery_folders_v1";

// File System Access API types (optional on Window in TS DOM)
interface FSFileWritable {
  write(data: Uint8Array | Blob | string): Promise<void>;
  close(): Promise<void>;
}
interface FSFileHandle {
  createWritable(): Promise<FSFileWritable>;
}
export interface FSDirectoryHandle {
  name: string;
  getDirectoryHandle(name: string, opts?: { create?: boolean }): Promise<FSDirectoryHandle>;
  getFileHandle(name: string, opts?: { create?: boolean }): Promise<FSFileHandle>;
  removeEntry?(name: string, opts?: { recursive?: boolean }): Promise<void>;
  queryPermission?(desc?: { mode?: "read" | "readwrite" }): Promise<string>;
  requestPermission?(desc?: { mode?: "read" | "readwrite" }): Promise<string>;
}

let mountedRootDir: FSDirectoryHandle | null = null;

export function supportsDirectoryPicker(): boolean {
  return typeof (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker === "function";
}

export function getMountedDirName(): string | null {
  return mountedRootDir ? mountedRootDir.name : null;
}

export async function mountLocalOutputDirectory(): Promise<string> {
  const picker = (window as unknown as {
    showDirectoryPicker?: (opts?: { mode?: string }) => Promise<FSDirectoryHandle>;
  }).showDirectoryPicker;
  if (!picker) {
    throw new Error("当前浏览器不支持本地目录授权 API (showDirectoryPicker)，将自动使用浏览器下载/打包 ZIP。");
  }
  const handle = await picker({ mode: "readwrite" });
  mountedRootDir = handle;
  return handle.name;
}

export function unmountLocalOutputDirectory(): void {
  mountedRootDir = null;
}

export function formatDateYYYYMMDD(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export function formatTimeHHMMSS(d = new Date()): string {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}${mm}${ss}`;
}

export async function saveBytesToMountedDir(
  subPathParts: string[],
  fileName: string,
  data: Uint8Array | string
): Promise<string | null> {
  if (!mountedRootDir) return null;
  try {
    if (mountedRootDir.queryPermission) {
      const perm = await mountedRootDir.queryPermission({ mode: "readwrite" });
      if (perm !== "granted" && mountedRootDir.requestPermission) {
        const req = await mountedRootDir.requestPermission({ mode: "readwrite" });
        if (req !== "granted") return null;
      }
    }
    let dir = mountedRootDir;
    for (const part of subPathParts) {
      if (!part) continue;
      dir = await dir.getDirectoryHandle(part, { create: true });
    }
    const fh = await dir.getFileHandle(fileName, { create: true });
    const writable = await fh.createWritable();
    await writable.write(
      data instanceof Uint8Array
        ? (data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as unknown as Uint8Array)
        : data
    );
    await writable.close();
    return [mountedRootDir.name, ...subPathParts, fileName].join("/");
  } catch {
    return null;
  }
}

export async function deleteFileFromMountedDir(
  subPathParts: string[],
  fileName: string
): Promise<boolean> {
  if (!mountedRootDir || !fileName) return false;
  try {
    if (mountedRootDir.queryPermission) {
      const perm = await mountedRootDir.queryPermission({ mode: "readwrite" });
      if (perm !== "granted" && mountedRootDir.requestPermission) {
        const req = await mountedRootDir.requestPermission({ mode: "readwrite" });
        if (req !== "granted") return false;
      }
    }
    let dir = mountedRootDir;
    for (const part of subPathParts) {
      if (!part) continue;
      dir = await dir.getDirectoryHandle(part, { create: false });
    }
    if (typeof dir.removeEntry !== "function") return false;
    await dir.removeEntry(fileName);
    return true;
  } catch {
    return false;
  }
}

export function sanitizeSubfolderName(rawName: string): string {
  const trimmed = (rawName || "").trim();
  if (trimmed.toLowerCase() === "_favorites") return "favorites";
  const cleaned = trimmed
    .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, "_")
    .replace(/\s+/g, " ")
    .replace(/_+/g, "_")
    .replace(/^[._\s]+|[._\s]+$/g, "")
    .slice(0, 64);
  if (!cleaned) return "";
  if (cleaned.toLowerCase() === "_favorites") return "favorites";
  return cleaned;
}

export function resolveRecordDiskSubpath(
  baseSessionFolder: string,
  groupFolder?: string,
  isStarred?: boolean
): string[] {
  const root = baseSessionFolder || "Studio";
  const safeGroup = groupFolder ? sanitizeSubfolderName(groupFolder) : "";
  if (safeGroup) {
    return isStarred ? [root, safeGroup, "_favorites"] : [root, safeGroup];
  }
  return isStarred ? [root, "_favorites"] : [root];
}

export async function deleteDirectoryFromMountedDir(
  parentSubPath: string[],
  dirName: string
): Promise<boolean> {
  const safeDir = sanitizeSubfolderName(dirName);
  if (!mountedRootDir || !safeDir) return false;
  try {
    if (mountedRootDir.queryPermission) {
      const perm = await mountedRootDir.queryPermission({ mode: "readwrite" });
      if (perm !== "granted" && mountedRootDir.requestPermission) {
        const req = await mountedRootDir.requestPermission({ mode: "readwrite" });
        if (req !== "granted") return false;
      }
    }
    let dir = mountedRootDir;
    for (const part of parentSubPath) {
      if (!part) continue;
      dir = await dir.getDirectoryHandle(part, { create: false });
    }
    if (typeof dir.removeEntry !== "function") return false;
    await dir.removeEntry(safeDir, { recursive: true });
    return true;
  } catch {
    return false;
  }
}

export async function moveFileInMountedDir(
  fromSubPath: string[],
  toSubPath: string[],
  fileName: string,
  bytes: Uint8Array
): Promise<boolean> {
  if (!mountedRootDir || !fileName) return false;
  const samePath =
    fromSubPath.length === toSubPath.length &&
    fromSubPath.every((seg, i) => seg === toSubPath[i]);
  if (samePath) return true;

  const written = await saveBytesToMountedDir(toSubPath, fileName, bytes);
  if (!written) return false;
  await deleteFileFromMountedDir(fromSubPath, fileName);
  return true;
}

export async function syncPromptsLogToMountedDir(
  records: GeneratedImageRecord[],
  extraTouchedPaths: string[][] = []
): Promise<void> {
  if (!mountedRootDir) return;
  const byPathKey = new Map<string, { parts: string[]; recs: GeneratedImageRecord[] }>();
  for (const tp of extraTouchedPaths) {
    if (!tp || tp.length === 0) continue;
    const key = tp.join("/");
    if (!byPathKey.has(key)) {
      byPathKey.set(key, { parts: [...tp], recs: [] });
    }
  }
  for (const r of records) {
    if (!r.disk_subpath || r.disk_subpath.length === 0) continue;
    const key = r.disk_subpath.join("/");
    let bucket = byPathKey.get(key);
    if (!bucket) {
      bucket = { parts: [...r.disk_subpath], recs: [] };
      byPathKey.set(key, bucket);
    }
    bucket.recs.push(r);
  }
  for (const { parts, recs } of byPathKey.values()) {
    if (recs.length === 0) {
      await deleteFileFromMountedDir(parts, "prompts.txt");
      continue;
    }
    const content = recs
      .map(
        (g) =>
          `# ${g.filename} | ${g.width}x${g.height} | Seed: ${g.seed}${g.is_starred ? " | ⭐STARRED" : ""}\n[POS] ${g.prompt_pos || ""}\n[NEG] ${g.prompt_neg || ""}\n`
      )
      .join("\n");
    await saveBytesToMountedDir(parts, "prompts.txt", content);
  }
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function triggerBytesDownload(bytes: Uint8Array, filename: string, mime = "image/png"): void {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  triggerBlobDownload(new Blob([copy], { type: mime }), filename);
}

export function triggerTextDownload(text: string, filename: string, mime = "text/plain;charset=utf-8"): void {
  triggerBlobDownload(new Blob([text], { type: mime }), filename);
}

// ==========================================
// Zero-Dependency Pure-TS ZIP Archive Builder (Store Mode)
// ==========================================
const CRC32_TABLE = (() => {
  const tbl = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    tbl[i] = c >>> 0;
  }
  return tbl;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c = CRC32_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

export function buildStoreZipBlob(
  entries: Array<{ name: string; data: Uint8Array | string }>
): Blob {
  const enc = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const cdParts: Uint8Array[] = [];
  let offset = 0;

  const now = new Date();
  const dosTime =
    ((now.getHours() & 0x1f) << 11) |
    ((now.getMinutes() & 0x3f) << 5) |
    ((now.getSeconds() >> 1) & 0x1f);
  const dosDate =
    (((Math.max(1980, now.getFullYear()) - 1980) & 0x7f) << 9) |
    (((now.getMonth() + 1) & 0x0f) << 5) |
    (now.getDate() & 0x1f);

  for (const entry of entries) {
    const nameBytes = enc.encode(entry.name);
    const dataBytes = typeof entry.data === "string" ? enc.encode(entry.data) : entry.data;
    const sum = crc32(dataBytes);
    const size = dataBytes.byteLength;

    const lfh = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(lfh.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0x0800, true);
    lv.setUint16(8, 0, true);
    lv.setUint16(10, dosTime, true);
    lv.setUint16(12, dosDate, true);
    lv.setUint32(14, sum, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    lfh.set(nameBytes, 30);

    const copyData = new Uint8Array(size);
    copyData.set(dataBytes);
    localParts.push(lfh, copyData);

    const cdh = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(cdh.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, dosTime, true);
    cv.setUint16(14, dosDate, true);
    cv.setUint32(16, sum, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    cdh.set(nameBytes, 46);
    cdParts.push(cdh);

    offset += lfh.byteLength + size;
  }

  let cdSize = 0;
  for (const part of cdParts) cdSize += part.byteLength;

  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, cdSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  return new Blob([...localParts, ...cdParts, eocd] as BlobPart[], { type: "application/zip" });
}

// ==========================================
// LocalStorage Presets & Settings
// ==========================================
export function loadActiveConfig(): CharacterConfig {
  const def = createDefaultCharacterConfig();
  try {
    const raw = localStorage.getItem(LS_CFG_KEY);
    if (!raw) return def;
    const parsed = JSON.parse(raw) as Partial<CharacterConfig>;
    const merged: CharacterConfig = { ...def, ...parsed };
    if (
      merged.style_preset?.includes("mikozin 0.65 + neit ni sei") ||
      merged.style_preset?.includes("mikozin 0.66 + neit")
    ) {
      merged.style_preset =
        "🎀 四画师稳态清透逆光萌系风（mikozin 0.68 + kani 0.44 + kasumi 0.42 + neit 0.22）";
    }
    if (merged.style_preset?.includes("shouu-kun 0.56 + mikozin 0.40 + gotyou 0.36")) {
      merged.style_preset = "🌿 安定中度萌化淡画风（shouu-kun 0.56 + mikozin 0.40 + gotyou 0.38）";
    }
    if (merged.body_preset?.includes("0.26 chibi + slender mini-lady")) {
      merged.body_preset = "袖珍娇小窄肩细腰笔直长腿·微Q萌圆脸（0.25 chibi + short slender mini-lady）";
    }
    if (merged.preset_name === "原创白发猫娘 OC（无需作品Tag）") {
      merged.preset_name = "原创角色 OC（无需作品Tag · 用额外常驻Tag定义外貌）";
    }
    if (merged.preset_name === "拉菲 Laffey（碧蓝航线）") {
      merged.preset_name = "拉菲 Laffey（碧蓝航线 · 默认）";
    }
    let needsCfgSave = false;
    if (!parsed.default_laffey_migrated_v1) {
      if (
        !parsed.preset_name ||
        parsed.preset_name === "标枪 Javelin（碧蓝航线 · 默认）" ||
        parsed.preset_name === "拉菲 Laffey（碧蓝航线）"
      ) {
        merged.preset_name = def.preset_name;
        merged.char_tag = def.char_tag;
        merged.eng_name = def.eng_name;
        merged.canon_neg_tags = def.canon_neg_tags;
        merged.body_preset = def.body_preset;
        merged.bust_preset = def.bust_preset;
      }
      merged.default_laffey_migrated_v1 = true;
      needsCfgSave = true;
    } else if (merged.preset_name === "标枪 Javelin（碧蓝航线 · 默认）") {
      merged.preset_name = "标枪 Javelin（碧蓝航线）";
      needsCfgSave = true;
    }
    if (merged.lighting_preset) {
      const normLight = normalizeLightingPresetName(merged.lighting_preset);
      if (normLight !== merged.lighting_preset) {
        merged.lighting_preset = normLight;
        needsCfgSave = true;
      }
    }
    if (merged.other_use_scene_outfit === undefined) {
      merged.other_use_scene_outfit = true;
    }
    if (merged.enable_solo_spread === undefined) {
      merged.enable_solo_spread = false;
    } else {
      merged.enable_solo_spread = Boolean(merged.enable_solo_spread);
    }
    delete (merged as unknown as Record<string, unknown>).eye_color;
    delete (merged as unknown as Record<string, unknown>).hair_tags;
    if (!parsed.wb_v2_migrated) {
      merged.enable_quality = true;
      merged.enable_identity = true;
      merged.enable_body = true;
      merged.enable_clothing_state = true;
      merged.enable_legwear = true;
      merged.enable_expression = true;
      merged.enable_action_fluids = true;
      merged.enable_t5_prose = true;
      merged.enable_negatives = true;
      merged.wb_v2_migrated = true;
      needsCfgSave = true;
    }
    if (needsCfgSave) {
      saveActiveConfig(merged);
    }
    return merged;
  } catch {
    return def;
  }
}

export function saveActiveConfig(cfg: CharacterConfig): void {
  try {
    localStorage.setItem(LS_CFG_KEY, JSON.stringify(cfg));
  } catch {
    // ignore storage quota
  }
}

export function loadDeletedPresets(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_DELETED_PRESETS_KEY);
    if (!raw) return new Set<string>();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set<string>();
    return new Set(arr.filter((x): x is string => typeof x === "string" && x.length > 0));
  } catch {
    return new Set<string>();
  }
}

export function saveDeletedPresets(set: Set<string>): void {
  try {
    localStorage.setItem(LS_DELETED_PRESETS_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // ignore
  }
}

export function markPresetDeleted(name: string): void {
  if (!name) return;
  const set = loadDeletedPresets();
  set.add(name);
  saveDeletedPresets(set);
}

export function unmarkPresetDeleted(name: string): void {
  if (!name) return;
  const set = loadDeletedPresets();
  if (set.delete(name)) {
    saveDeletedPresets(set);
  }
}

export function clearDeletedPresets(): void {
  try {
    localStorage.removeItem(LS_DELETED_PRESETS_KEY);
  } catch {
    // ignore
  }
}

export function loadCustomPresets(): Record<string, Partial<CharacterConfig>> {
  const bundled = BUNDLED_CUSTOM_PRESETS as Record<string, Partial<CharacterConfig>>;
  const deleted = loadDeletedPresets();
  let merged: Record<string, Partial<CharacterConfig>> = { ...bundled };
  try {
    const raw = localStorage.getItem(LS_PRESETS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, Partial<CharacterConfig>>;
      if (parsed && typeof parsed === "object") {
        merged = { ...bundled, ...parsed };
      }
    }
  } catch {
    // ignore
  }
  for (const delKey of deleted) {
    delete merged[delKey];
  }
  for (const pVal of Object.values(merged)) {
    if (pVal && typeof pVal.lighting_preset === "string") {
      pVal.lighting_preset = normalizeLightingPresetName(pVal.lighting_preset);
    }
    if (pVal && pVal.enable_solo_spread !== undefined) {
      pVal.enable_solo_spread = Boolean(pVal.enable_solo_spread);
    }
  }
  return merged;
}

export function saveCustomPresets(presets: Record<string, Partial<CharacterConfig>>): void {
  try {
    localStorage.setItem(LS_PRESETS_KEY, JSON.stringify(presets));
  } catch {
    // ignore
  }
}

export function loadMcpBridgeEnabled(): boolean {
  try {
    const raw = localStorage.getItem(LS_MCP_ENABLED_KEY);
    if (raw !== null) {
      return raw === "1" || raw === "true";
    }
    // Default ON only for local PC sessions (file://, localhost, 127.0.0.1);
    // default OFF on public domains / LAN IPs so remote/mobile viewers never hijack local MCP.
    if (typeof window !== "undefined" && window.location) {
      const proto = window.location.protocol;
      const host = (window.location.hostname || "").toLowerCase();
      if (proto === "file:" || host === "localhost" || host === "127.0.0.1" || host === "::1") {
        return true;
      }
      return false;
    }
    return true;
  } catch {
    return true;
  }
}

export function saveMcpBridgeEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(LS_MCP_ENABLED_KEY, enabled ? "1" : "0");
  } catch {
    // ignore
  }
}

export function loadMcpBridgeEndpoint(): string {
  try {
    return (localStorage.getItem(LS_MCP_ENDPOINT_KEY) || "").trim();
  } catch {
    return "";
  }
}

export function saveMcpBridgeEndpoint(endpoint: string): void {
  try {
    const trimmed = endpoint.trim();
    if (!trimmed) {
      localStorage.removeItem(LS_MCP_ENDPOINT_KEY);
    } else {
      localStorage.setItem(LS_MCP_ENDPOINT_KEY, trimmed);
    }
  } catch {
    // ignore
  }
}

export function loadApiSettings(): NaiApiSettings {
  const def = createDefaultNaiApiSettings();
  try {
    const raw = localStorage.getItem(LS_API_KEY);
    if (!raw) return def;
    const parsed = JSON.parse(raw) as Partial<NaiApiSettings>;
    const merged: NaiApiSettings = { ...def, ...parsed };
    if (
      merged.model !== "nai-diffusion-4-5-full" &&
      merged.model !== "nai-diffusion-5-full" &&
      merged.model !== "nai-diffusion-5-full-medium"
    ) {
      merged.model = def.model;
    }
    if (!Number.isFinite(merged.steps)) merged.steps = def.steps;
    merged.steps = Math.max(1, Math.min(50, Math.round(merged.steps)));
    if (!Number.isFinite(merged.batch_count)) merged.batch_count = 1;
    merged.batch_count = Math.max(1, Math.min(8, Math.round(merged.batch_count)));
    if (
      merged.uc_preset_mode !== "heavy" &&
      merged.uc_preset_mode !== "light" &&
      merged.uc_preset_mode !== "human_focus" &&
      merged.uc_preset_mode !== "none"
    ) {
      merged.uc_preset_mode = def.uc_preset_mode;
    }
    let needsSave = false;
    if (!parsed.uc_preset_migrated_v2) {
      if (!parsed.uc_preset_mode || parsed.uc_preset_mode === "none") {
        merged.uc_preset_mode = "heavy";
      }
      merged.uc_preset_migrated_v2 = true;
      needsSave = true;
    }
    if (!parsed.pos_neg_split_migrated_v1) {
      merged.keep_inline_negatives = false;
      merged.pos_neg_split_migrated_v1 = true;
      needsSave = true;
    } else {
      merged.keep_inline_negatives =
        merged.keep_inline_negatives === undefined
          ? def.keep_inline_negatives
          : Boolean(merged.keep_inline_negatives);
    }
    if (!parsed.v5_rescale_migrated_v1) {
      if (
        (merged.model === "nai-diffusion-5-full" || merged.model === "nai-diffusion-5-full-medium") &&
        Number(merged.cfg_rescale) > 0
      ) {
        merged.cfg_rescale = 0.0;
      }
      merged.v5_rescale_migrated_v1 = true;
      needsSave = true;
    }
    if (needsSave) {
      saveApiSettings(merged);
    }
    merged.vibe_transfer_enabled =
      parsed.vibe_transfer_enabled === undefined ? true : Boolean(parsed.vibe_transfer_enabled);
    merged.vibe_normalize_strength =
      parsed.vibe_normalize_strength === undefined ? true : Boolean(parsed.vibe_normalize_strength);
    if (merged.carousel_auto_mode !== "follow_latest" && merged.carousel_auto_mode !== "timed") {
      merged.carousel_auto_mode = parsed.carousel_interval_sec === 0 ? "follow_latest" : "timed";
    }
    if (![2, 3, 4, 6, 8].includes(Number(merged.carousel_interval_sec))) {
      merged.carousel_interval_sec = 4;
    }
    return merged;
  } catch {
    return def;
  }
}

export function saveApiSettings(settings: NaiApiSettings): void {
  try {
    localStorage.setItem(LS_API_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

// ==========================================
// IndexedDB Storage for Vibe Transfer Bundle (.naiv4vibebundle / .naiv4vibe)
// ==========================================
const IDB_NAME = "nai_wb_idb_v1";
const IDB_STORE = "kv";
const IDB_VIBE_BUNDLE_KEY = "vibe_transfer_items_v1";
let memVibeItems: StoredVibeItem[] = [];

function openWorkbenchIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open error"));
  });
}

export async function loadStoredVibeItems(): Promise<StoredVibeItem[]> {
  try {
    const db = await openWorkbenchIdb();
    const record = await new Promise<unknown>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const store = tx.objectStore(IDB_STORE);
      const getReq = store.get(IDB_VIBE_BUNDLE_KEY);
      getReq.onsuccess = () => resolve(getReq.result);
      getReq.onerror = () => reject(getReq.error);
    });
    db.close();
    if (!Array.isArray(record)) {
      return memVibeItems;
    }
    const valid = (record as StoredVibeItem[]).filter(
      (it) => it && typeof it === "object" && typeof it.id === "string" && it.encodings
    );
    memVibeItems = valid;
    return valid;
  } catch {
    return memVibeItems;
  }
}

export async function saveStoredVibeItems(items: StoredVibeItem[]): Promise<void> {
  const compactList: StoredVibeItem[] = items.map((it) => ({
    ...it,
    rawImageBase64:
      it.rawImageBase64 && it.rawImageBase64.length > 600_000 && it.thumbnailDataUrl
        ? undefined
        : it.rawImageBase64,
  }));
  memVibeItems = items;
  try {
    const db = await openWorkbenchIdb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).put(compactList, IDB_VIBE_BUNDLE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Keep in-memory copy if IndexedDB is unavailable
  }
}

export async function clearStoredVibeItems(): Promise<void> {
  memVibeItems = [];
  try {
    const db = await openWorkbenchIdb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).delete(IDB_VIBE_BUNDLE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // ignore
  }
}

// ==========================================
// IndexedDB Storage for ⭐ Starred Gallery Images Only
// (Unstarred session images stay strictly in memory and clear on reload)
// ==========================================
const IDB_STARRED_GALLERY_KEY = "starred_gallery_items_v1";

export type PersistedGalleryRecord = Omit<GeneratedImageRecord, "objectUrl">;

export function filterStarredGalleryForPersist(
  records: GeneratedImageRecord[]
): PersistedGalleryRecord[] {
  return records
    .filter((r) => Boolean(r.is_starred) && r.bytes instanceof Uint8Array && r.bytes.byteLength > 0)
    .map(({ objectUrl: _omit, ...rest }) => ({
      ...rest,
      bytes: new Uint8Array(rest.bytes),
      is_starred: true,
    }));
}

function guessMimeFromFilename(filename: string): string {
  const low = (filename || "").toLowerCase();
  if (low.endsWith(".webp")) return "image/webp";
  if (low.endsWith(".jpg") || low.endsWith(".jpeg")) return "image/jpeg";
  return "image/png";
}

export async function loadStarredGalleryRecords(): Promise<GeneratedImageRecord[]> {
  try {
    const db = await openWorkbenchIdb();
    const raw = await new Promise<unknown>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const getReq = tx.objectStore(IDB_STORE).get(IDB_STARRED_GALLERY_KEY);
      getReq.onsuccess = () => resolve(getReq.result);
      getReq.onerror = () => reject(getReq.error);
    });
    db.close();
    if (!Array.isArray(raw)) return [];

    const out: GeneratedImageRecord[] = [];
    for (const item of raw as Array<Partial<PersistedGalleryRecord>>) {
      if (!item || typeof item !== "object" || typeof item.id !== "string" || !item.bytes) continue;
      const rawBytes: unknown = item.bytes;
      const u8 =
        rawBytes instanceof Uint8Array
          ? new Uint8Array(rawBytes)
          : ArrayBuffer.isView(rawBytes)
            ? new Uint8Array(rawBytes.buffer, rawBytes.byteOffset, rawBytes.byteLength)
            : rawBytes instanceof ArrayBuffer
              ? new Uint8Array(rawBytes)
              : null;
      if (!u8 || u8.byteLength === 0) continue;
      const blobCopy = new Uint8Array(u8.byteLength);
      blobCopy.set(u8);
      const mime = guessMimeFromFilename(item.filename || "image.png");
      const objectUrl =
        typeof URL !== "undefined" && typeof URL.createObjectURL === "function"
          ? URL.createObjectURL(new Blob([blobCopy], { type: mime }))
          : "";
      out.push({
        id: item.id,
        scene_id: item.scene_id || "P01",
        mode_label: item.mode_label || "pov",
        filename: item.filename || `${item.id}.png`,
        bytes: u8,
        objectUrl,
        seed: Number(item.seed ?? 0),
        width: Number(item.width ?? 832),
        height: Number(item.height ?? 1216),
        elapsed_sec: Number(item.elapsed_sec ?? 0),
        estimated_anlas: Number(item.estimated_anlas ?? 0),
        created_at: Number(item.created_at ?? Date.now()),
        prompt_pos: item.prompt_pos,
        prompt_neg: item.prompt_neg,
        is_upscaled: Boolean(item.is_upscaled),
        is_starred: true,
        saved_to_dir: Boolean(item.saved_to_dir),
        disk_subpath: Array.isArray(item.disk_subpath) ? [...item.disk_subpath] : undefined,
        config_snapshot: item.config_snapshot,
        reroll_group_id: item.reroll_group_id,
        group_folder: item.group_folder ? sanitizeSubfolderName(item.group_folder) || undefined : undefined,
        stage_code: typeof item.stage_code === "string" ? item.stage_code : undefined,
      });
    }
    return out;
  } catch {
    return [];
  }
}

export function loadGalleryFolders(): GalleryFolderItem[] {
  try {
    if (typeof localStorage === "undefined") return [];
    const raw = localStorage.getItem(LS_GALLERY_FOLDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    const out: GalleryFolderItem[] = [];
    for (const it of parsed) {
      if (!it || typeof it !== "object") continue;
      const safeName = sanitizeSubfolderName(String((it as { name?: unknown }).name ?? ""));
      if (!safeName || seen.has(safeName.toLowerCase())) continue;
      seen.add(safeName.toLowerCase());
      out.push({
        id: typeof (it as { id?: unknown }).id === "string" ? String((it as { id: string }).id) : `fld_${out.length + 1}`,
        name: safeName,
        created_at: Number((it as { created_at?: unknown }).created_at ?? Date.now()),
      });
    }
    return out;
  } catch {
    return [];
  }
}

export function saveGalleryFolders(folders: GalleryFolderItem[]): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(LS_GALLERY_FOLDERS_KEY, JSON.stringify(folders));
  } catch {
    // ignore
  }
}

export async function saveStarredGalleryRecords(records: GeneratedImageRecord[]): Promise<void> {
  const payload = filterStarredGalleryForPersist(records);
  try {
    const db = await openWorkbenchIdb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      if (payload.length === 0) {
        tx.objectStore(IDB_STORE).delete(IDB_STARRED_GALLERY_KEY);
      } else {
        tx.objectStore(IDB_STORE).put(payload, IDB_STARRED_GALLERY_KEY);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // ignore IndexedDB quota/availability errors
  }
}
