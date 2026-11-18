import {
  MODEL_V4_5_FULL,
  MODEL_V5_FULL,
  MODEL_V5_FULL_MEDIUM,
} from "../data/engineConstants";
import type {
  NaiModelId,
  StoredVibeItem,
  VibeEncodingEntry,
  VibeTransferSlotInput,
} from "../engine/types";

export const MAX_VIBE_SLOTS = 16;

const MODEL_TO_VIBE_KEYS: Record<NaiModelId, string[]> = {
  [MODEL_V4_5_FULL]: ["v4-5full", "nai-diffusion-4-5-full", "v4_5_full"],
  [MODEL_V5_FULL]: ["v5full", "v5-full", "nai-diffusion-5-full"],
  [MODEL_V5_FULL_MEDIUM]: [
    "v5full-medium",
    "v5full",
    "v5-full",
    "nai-diffusion-5-full-medium",
  ],
};

const IMPORT_MODEL_TO_VIBE_KEY: Record<string, string> = {
  "nai-diffusion-4-5-full": "v4-5full",
  "nai-diffusion-4-5-curated": "v4-5curated",
  "nai-diffusion-4-full": "v4full",
  "nai-diffusion-4-curated": "v4curated",
  "nai-diffusion-5-full": "v5full",
  "nai-diffusion-5-full-medium": "v5full-medium",
};

const VIBE_KEY_LABELS: Record<string, string> = {
  "v4-5full": "V4.5 Full",
  "v4-5curated": "V4.5 Curated",
  v4full: "V4 Full",
  v4curated: "V4 Curated",
  v5full: "V5 Full",
  "v5-full": "V5 Full",
  "v5full-medium": "V5 Medium",
};

export function clampVibeStrength(val: unknown, fallback = 0.6): number {
  const n = typeof val === "number" ? val : Number(val);
  if (!Number.isFinite(n)) return fallback;
  return Number(Math.max(-1.0, Math.min(1.0, n)).toFixed(2));
}

export function clampInfoExtracted(val: unknown, fallback = 1.0): number {
  const n = typeof val === "number" ? val : Number(val);
  if (!Number.isFinite(n)) return fallback;
  return Number(Math.max(0.01, Math.min(1.0, n)).toFixed(2));
}

export function formatVibeModelKey(key: string): string {
  return VIBE_KEY_LABELS[key] ?? key;
}

export function toImageDataUrl(rawOrDataUrl?: string | null): string | undefined {
  if (!rawOrDataUrl || typeof rawOrDataUrl !== "string") return undefined;
  const trimmed = rawOrDataUrl.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("data:image/")) return trimmed;
  const cleanB64 = trimmed.replace(/\s+/g, "");
  if (!cleanB64) return undefined;
  let mime = "image/png";
  if (cleanB64.startsWith("UklGR")) {
    mime = "image/webp";
  } else if (cleanB64.startsWith("/9j/")) {
    mime = "image/jpeg";
  }
  return `data:${mime};base64,${cleanB64}`;
}

export function stripDataUrlPrefix(rawOrDataUrl?: string | null): string | undefined {
  if (!rawOrDataUrl || typeof rawOrDataUrl !== "string") return undefined;
  const trimmed = rawOrDataUrl.trim();
  if (!trimmed) return undefined;
  const m = /^data:[^;]+;base64,([\s\S]+)$/i.exec(trimmed);
  return (m ? m[1] : trimmed).replace(/\s+/g, "");
}

export function hashVibeString(input: string): string {
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (
    (h2 >>> 0).toString(16).padStart(8, "0") + (h1 >>> 0).toString(16).padStart(8, "0")
  );
}

function stripFilenameExt(filename: string): string {
  return filename
    .replace(/^.*[\\/]/, "")
    .replace(/\.(naiv4vibebundle|naiv4vibe|json|png|webp|jpe?g)$/i, "")
    .trim();
}

function parseSingleVibeRecord(
  raw: Record<string, unknown>,
  fallbackName: string,
  indexHint = 0
): StoredVibeItem | null {
  const importInfo =
    raw.importInfo && typeof raw.importInfo === "object"
      ? (raw.importInfo as Record<string, unknown>)
      : {};

  const defaultIe = clampInfoExtracted(
    importInfo.information_extracted ?? raw.information_extracted,
    1.0
  );
  const strength = clampVibeStrength(importInfo.strength ?? raw.strength, 0.6);

  const encodingsOut: Record<string, VibeEncodingEntry[]> = {};
  const rawEncodings = raw.encodings;
  if (rawEncodings && typeof rawEncodings === "object" && !Array.isArray(rawEncodings)) {
    for (const [modelKey, bucket] of Object.entries(rawEncodings as Record<string, unknown>)) {
      if (!bucket || typeof bucket !== "object") continue;
      const entries: VibeEncodingEntry[] = [];
      if (Array.isArray(bucket)) {
        bucket.forEach((item, idx) => {
          if (typeof item === "string" && item.trim()) {
            const cleanEnc = item.trim();
            entries.push({
              hashKey: hashVibeString(`${modelKey}:${idx}:${cleanEnc.slice(0, 64)}`),
              encoding: cleanEnc,
              informationExtracted: defaultIe,
            });
          } else if (item && typeof item === "object") {
            const rec = item as Record<string, unknown>;
            const encStr = typeof rec.encoding === "string" ? rec.encoding.trim() : "";
            if (!encStr) return;
            const params =
              rec.params && typeof rec.params === "object"
                ? (rec.params as Record<string, unknown>)
                : {};
            entries.push({
              hashKey:
                typeof rec.hashKey === "string" && rec.hashKey
                  ? rec.hashKey
                  : hashVibeString(`${modelKey}:${idx}:${encStr.slice(0, 64)}`),
              encoding: encStr,
              informationExtracted: clampInfoExtracted(
                params.information_extracted ?? rec.informationExtracted,
                defaultIe
              ),
            });
          }
        });
      } else {
        for (const [hashKey, val] of Object.entries(bucket as Record<string, unknown>)) {
          if (typeof val === "string" && val.trim()) {
            entries.push({
              hashKey,
              encoding: val.trim(),
              informationExtracted: defaultIe,
            });
          } else if (val && typeof val === "object") {
            const rec = val as Record<string, unknown>;
            const encStr = typeof rec.encoding === "string" ? rec.encoding.trim() : "";
            if (!encStr) continue;
            const params =
              rec.params && typeof rec.params === "object"
                ? (rec.params as Record<string, unknown>)
                : {};
            entries.push({
              hashKey,
              encoding: encStr,
              informationExtracted: clampInfoExtracted(
                params.information_extracted ?? rec.informationExtracted,
                defaultIe
              ),
            });
          }
        }
      }
      if (entries.length > 0) {
        encodingsOut[modelKey] = entries;
      }
    }
  }

  const rawImageStr = typeof raw.image === "string" ? stripDataUrlPrefix(raw.image) : undefined;
  const rawThumbStr =
    typeof raw.thumbnail === "string" && raw.thumbnail.trim()
      ? raw.thumbnail.trim()
      : undefined;

  const availableModelKeys = Object.keys(encodingsOut);
  if (availableModelKeys.length === 0 && !rawImageStr && !rawThumbStr) {
    return null;
  }

  const preferredImportModel =
    typeof importInfo.model === "string" ? IMPORT_MODEL_TO_VIBE_KEY[importInfo.model] : undefined;
  const selectedModelKey =
    (preferredImportModel && encodingsOut[preferredImportModel] ? preferredImportModel : "") ||
    (encodingsOut["v4-5full"] ? "v4-5full" : "") ||
    availableModelKeys[0] ||
    "v4-5full";

  const candidateEntries = encodingsOut[selectedModelKey] ?? [];
  let chosenEntry: VibeEncodingEntry | undefined = candidateEntries.find(
    (e) => Math.abs(e.informationExtracted - defaultIe) < 0.006
  );
  if (!chosenEntry && candidateEntries.length > 0) {
    chosenEntry = candidateEntries[0];
  }

  const cleanName =
    (typeof raw.name === "string" && raw.name.trim()) ||
    (fallbackName ? (indexHint > 0 ? `${fallbackName}_${indexHint + 1}` : fallbackName) : `Vibe_${indexHint + 1}`);

  const rawId =
    typeof raw.id === "string" && raw.id.trim()
      ? raw.id.trim()
      : hashVibeString(
          `${cleanName}:${chosenEntry?.encoding.slice(0, 96) ?? rawImageStr?.slice(0, 96) ?? Date.now()}`
        );

  const thumbnailDataUrl = toImageDataUrl(rawThumbStr ?? rawImageStr);

  return {
    id: rawId,
    name: cleanName,
    enabled: raw.enabled === undefined ? true : Boolean(raw.enabled),
    strength,
    selectedModelKey,
    selectedHashKey: chosenEntry?.hashKey ?? "",
    informationExtracted: chosenEntry?.informationExtracted ?? defaultIe,
    encodings: encodingsOut,
    thumbnailDataUrl,
    rawImageBase64: rawImageStr,
    createdAt:
      typeof raw.createdAt === "number" && Number.isFinite(raw.createdAt)
        ? raw.createdAt
        : Date.now(),
  };
}

export function parseVibeBundleJsonText(jsonText: string, filename = "vibe_bundle"): StoredVibeItem[] {
  const cleanText = jsonText.replace(/^\uFEFF/, "").trim();
  if (!cleanText) {
    throw new Error("文件内容为空，无法解析 Vibe 数据。");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleanText);
  } catch (err) {
    throw new Error(
      `无法解析 JSON 格式的 .naiv4vibebundle / .naiv4vibe 文件：${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }

  const baseStem = stripFilenameExt(filename) || "vibe";
  const out: StoredVibeItem[] = [];

  if (Array.isArray(parsed)) {
    parsed.forEach((el, idx) => {
      if (el && typeof el === "object") {
        const item = parseSingleVibeRecord(el as Record<string, unknown>, baseStem, idx);
        if (item) out.push(item);
      }
    });
  } else if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    if (
      obj.identifier === "novelai-vibe-transfer-bundle" ||
      Array.isArray(obj.vibes)
    ) {
      const arr = Array.isArray(obj.vibes) ? obj.vibes : [];
      arr.forEach((el, idx) => {
        if (el && typeof el === "object") {
          const item = parseSingleVibeRecord(el as Record<string, unknown>, baseStem, idx);
          if (item) out.push(item);
        }
      });
    } else if (
      obj.identifier === "novelai-vibe-transfer" ||
      (obj.encodings && typeof obj.encodings === "object") ||
      typeof obj.image === "string"
    ) {
      const single = parseSingleVibeRecord(obj, baseStem, 0);
      if (single) out.push(single);
    } else {
      throw new Error(
        "未识别的 Vibe JSON 结构：缺少 novelai-vibe-transfer-bundle 或 novelai-vibe-transfer 标识。"
      );
    }
  }

  if (out.length === 0) {
    throw new Error("该 Vibe 文件中未找到任何可用的编码数据 (encodings) 或源图像。");
  }
  return out;
}

function isPngSignature(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  );
}

export function extractVibesFromPngBytes(
  pngBytes: Uint8Array,
  filename = "generated.png"
): StoredVibeItem[] {
  if (!isPngSignature(pngBytes)) return [];
  const view = new DataView(pngBytes.buffer, pngBytes.byteOffset, pngBytes.byteLength);
  const utf8Dec = new TextDecoder("utf-8", { fatal: false });
  const latinDec = new TextDecoder("iso-8859-1");

  let commentJson = "";
  let sourceTag = "";
  let off = 8;

  while (off + 12 <= pngBytes.length) {
    const chunkLen = view.getUint32(off, false);
    if (off + 12 + chunkLen > pngBytes.length) break;
    const type = latinDec.decode(pngBytes.subarray(off + 4, off + 8));
    const data = pngBytes.subarray(off + 8, off + 8 + chunkLen);

    if (type === "tEXt") {
      const nul = data.indexOf(0);
      if (nul > 0) {
        const key = latinDec.decode(data.subarray(0, nul));
        const val = utf8Dec.decode(data.subarray(nul + 1));
        if (key === "Comment") commentJson = val;
        else if (key === "Source") sourceTag = val;
      }
    } else if (type === "iTXt") {
      const nul1 = data.indexOf(0);
      if (nul1 > 0 && nul1 + 2 < data.length) {
        const key = latinDec.decode(data.subarray(0, nul1));
        const compFlag = data[nul1 + 1];
        if (compFlag === 0) {
          let cursor = nul1 + 3;
          const nulLang = data.indexOf(0, cursor);
          if (nulLang >= 0) {
            cursor = nulLang + 1;
            const nulTrans = data.indexOf(0, cursor);
            if (nulTrans >= 0) {
              const val = utf8Dec.decode(data.subarray(nulTrans + 1));
              if (key === "Comment") commentJson = val;
              else if (key === "Source") sourceTag = val;
            }
          }
        }
      }
    } else if (type === "IEND") {
      break;
    }
    off += 12 + chunkLen;
  }

  if (!commentJson) return [];
  try {
    const comment = JSON.parse(commentJson) as Record<string, unknown>;
    const refImgs = comment.reference_image_multiple;
    if (!Array.isArray(refImgs) || refImgs.length === 0) return [];
    const refStrengths = Array.isArray(comment.reference_strength_multiple)
      ? comment.reference_strength_multiple
      : [];
    const refIes = Array.isArray(comment.reference_information_extracted_multiple)
      ? comment.reference_information_extracted_multiple
      : [];

    const modelDescriptor = `${sourceTag} ${String(comment.model_name ?? "")}`.toLowerCase();
    const inferredModelKey = modelDescriptor.includes("4.5")
      ? "v4-5full"
      : modelDescriptor.includes("v5") || modelDescriptor.includes(" 5")
        ? "v5full"
        : "v4-5full";

    const stem = stripFilenameExt(filename) || "PNG_Vibe";
    const out: StoredVibeItem[] = [];

    refImgs.forEach((encRaw, idx) => {
      if (typeof encRaw !== "string" || encRaw.trim().length < 64) return;
      const cleanEnc = encRaw.trim();
      const ie = clampInfoExtracted(refIes[idx], 1.0);
      const str = clampVibeStrength(refStrengths[idx], 0.6);
      const hKey = hashVibeString(`${inferredModelKey}:${ie}:${cleanEnc.slice(0, 96)}`);
      out.push({
        id: hashVibeString(`png:${stem}:${idx}:${cleanEnc.slice(0, 96)}`),
        name: refImgs.length > 1 ? `${stem}_Slot${idx + 1}` : stem,
        enabled: true,
        strength: str,
        selectedModelKey: inferredModelKey,
        selectedHashKey: hKey,
        informationExtracted: ie,
        encodings: {
          [inferredModelKey]: [
            {
              hashKey: hKey,
              encoding: cleanEnc,
              informationExtracted: ie,
            },
          ],
        },
        createdAt: Date.now() + idx,
      });
    });
    return out;
  } catch {
    return [];
  }
}

export function parseVibeFileBytes(bytes: Uint8Array, filename: string): StoredVibeItem[] {
  if (isPngSignature(bytes)) {
    const pngVibes = extractVibesFromPngBytes(bytes, filename);
    if (pngVibes.length > 0) {
      return pngVibes;
    }
    throw new Error(
      `PNG 图片「${filename}」中未包含已编码的 Vibe Transfer 元数据 (reference_image_multiple)。若需将普通参考图在线编码为 Vibe，请使用「🖼️ 编码新图 (2点)」按钮。`
    );
  }
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  return parseVibeBundleJsonText(text, filename);
}

export function resolveVibeEncodingForModel(
  item: StoredVibeItem,
  model: NaiModelId
): VibeEncodingEntry | null {
  const allowedKeys = MODEL_TO_VIBE_KEYS[model] ?? [];
  let bucket: VibeEncodingEntry[] | undefined;
  for (const k of allowedKeys) {
    if (item.encodings[k] && item.encodings[k].length > 0) {
      bucket = item.encodings[k];
      break;
    }
  }
  if (!bucket || bucket.length === 0) return null;

  if (item.selectedHashKey) {
    const byHash = bucket.find((e) => e.hashKey === item.selectedHashKey);
    if (byHash) return byHash;
  }
  const byIe = bucket.find(
    (e) => Math.abs(e.informationExtracted - item.informationExtracted) < 0.006
  );
  return byIe ?? bucket[0];
}

export function buildActiveVibeSlotsForModel(
  items: StoredVibeItem[],
  model: NaiModelId,
  masterEnabled: boolean
): VibeTransferSlotInput[] {
  if (!masterEnabled || items.length === 0) return [];
  const slots: VibeTransferSlotInput[] = [];
  for (const item of items) {
    if (!item.enabled) continue;
    const entry = resolveVibeEncodingForModel(item, model);
    if (!entry || !entry.encoding) continue;
    slots.push({
      encoding: entry.encoding,
      strength: clampVibeStrength(item.strength, 0.6),
      informationExtracted: clampInfoExtracted(entry.informationExtracted, 1.0),
      name: item.name,
    });
    if (slots.length >= MAX_VIBE_SLOTS) break;
  }
  return slots;
}

export function serializeSingleVibeObject(
  item: StoredVibeItem,
  options?: { includeRawImages?: boolean }
): Record<string, unknown> {
  const includeImages = options?.includeRawImages ?? true;
  const encodingsJson: Record<string, Record<string, unknown>> = {};
  for (const [modelKey, entries] of Object.entries(item.encodings)) {
    if (!entries || entries.length === 0) continue;
    const mapObj: Record<string, unknown> = {};
    for (const entry of entries) {
      mapObj[entry.hashKey || hashVibeString(entry.encoding.slice(0, 96))] = {
        encoding: entry.encoding,
        params: {
          information_extracted: clampInfoExtracted(entry.informationExtracted, 1.0),
        },
      };
    }
    encodingsJson[modelKey] = mapObj;
  }

  const importModelName =
    item.selectedModelKey === "v4-5full"
      ? MODEL_V4_5_FULL
      : item.selectedModelKey === "v5full"
        ? MODEL_V5_FULL
        : MODEL_V4_5_FULL;

  const out: Record<string, unknown> = {
    identifier: "novelai-vibe-transfer",
    version: 1,
    type: "encoding",
    id: item.id,
    encodings: encodingsJson,
    name: item.name,
    createdAt: item.createdAt || Date.now(),
    importInfo: {
      model: importModelName,
      information_extracted: clampInfoExtracted(item.informationExtracted, 1.0),
      strength: clampVibeStrength(item.strength, 0.6),
    },
  };

  if (includeImages) {
    const rawImg =
      stripDataUrlPrefix(item.rawImageBase64) ?? stripDataUrlPrefix(item.thumbnailDataUrl);
    if (rawImg) {
      out.image = rawImg;
    }
    if (item.thumbnailDataUrl && !out.image) {
      out.thumbnail = item.thumbnailDataUrl;
    }
  }
  return out;
}

export function serializeVibeBundle(
  items: StoredVibeItem[],
  options?: { includeRawImages?: boolean }
): string {
  const payload = {
    identifier: "novelai-vibe-transfer-bundle",
    version: 1,
    vibes: items.map((it) => serializeSingleVibeObject(it, options)),
  };
  return JSON.stringify(payload, null, 2);
}

export async function compactVibeThumbnailInBrowser(
  item: StoredVibeItem,
  maxThumbSide = 160
): Promise<StoredVibeItem> {
  if (typeof document === "undefined" || typeof createImageBitmap !== "function") {
    return item;
  }
  const srcDataUrl = item.thumbnailDataUrl ?? toImageDataUrl(item.rawImageBase64);
  if (!srcDataUrl) return item;
  // Skip downscaling if already compact (< 48 KB)
  if (srcDataUrl.length <= 49152) {
    return { ...item, thumbnailDataUrl: srcDataUrl };
  }
  try {
    const resp = await fetch(srcDataUrl);
    const blob = await resp.blob();
    const bmp = await createImageBitmap(blob);
    try {
      const scale = Math.min(1, maxThumbSide / Math.max(1, bmp.width, bmp.height));
      const tw = Math.max(1, Math.round(bmp.width * scale));
      const th = Math.max(1, Math.round(bmp.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = tw;
      canvas.height = th;
      const ctx = canvas.getContext("2d");
      if (!ctx) return item;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(bmp, 0, 0, tw, th);
      const compactUrl = canvas.toDataURL("image/webp", 0.86);
      return {
        ...item,
        thumbnailDataUrl: compactUrl.startsWith("data:image/")
          ? compactUrl
          : canvas.toDataURL("image/png"),
      };
    } finally {
      bmp.close();
    }
  } catch {
    return item;
  }
}
