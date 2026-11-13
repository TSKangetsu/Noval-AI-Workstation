import { BUNDLED_CUSTOM_PRESETS } from "../data/engineConstants";
import {
  createDefaultCharacterConfig,
  createDefaultNaiApiSettings,
  type CharacterConfig,
  type NaiApiSettings,
} from "../engine/types";

const LS_CFG_KEY = "nai_wb_active_config_v1";
const LS_PRESETS_KEY = "nai_wb_custom_presets_v1";
const LS_API_KEY = "nai_wb_api_settings_v1";

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
    await writable.write(data instanceof Uint8Array ? (data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as unknown as Uint8Array) : data);
    await writable.close();
    return [mountedRootDir.name, ...subPathParts, fileName].join("/");
  } catch {
    return null;
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
    lv.setUint32(0, 0x04034b50, true); // Local file header signature
    lv.setUint16(4, 20, true); // Version needed
    lv.setUint16(6, 0x0800, true); // UTF-8 filename flag
    lv.setUint16(8, 0, true); // Compression method 0 (Store)
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
    cv.setUint32(0, 0x02014b50, true); // Central directory header signature
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
    return { ...def, ...parsed };
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

export function loadCustomPresets(): Record<string, Partial<CharacterConfig>> {
  const bundled = BUNDLED_CUSTOM_PRESETS as Record<string, Partial<CharacterConfig>>;
  try {
    const raw = localStorage.getItem(LS_PRESETS_KEY);
    if (!raw) {
      return { ...bundled };
    }
    const parsed = JSON.parse(raw) as Record<string, Partial<CharacterConfig>>;
    if (!parsed || typeof parsed !== "object") {
      return { ...bundled };
    }
    // Seed any newly bundled presets without overwriting user's saved versions
    return { ...bundled, ...parsed };
  } catch {
    return { ...bundled };
  }
}

export function saveCustomPresets(presets: Record<string, Partial<CharacterConfig>>): void {
  try {
    localStorage.setItem(LS_PRESETS_KEY, JSON.stringify(presets));
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
    return { ...def, ...parsed };
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
