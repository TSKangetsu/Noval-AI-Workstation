import {
  CANVAS_PRESETS,
  MODEL_V5_FULL_MEDIUM,
  NAI_IMAGE_ENDPOINT,
  V5_HEAVY_UC_BASE,
  V5_QUALITY_SUFFIX,
} from "../data/engineConstants";
import {
  parseStructuredPrompt,
  splitInlineNegativesFromCaption,
} from "../engine/t5Tokenizer";
import type { SubscriptionInfo } from "../engine/types";

export class NaiApiError extends Error {
  statusCode?: number;
  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "NaiApiError";
    this.statusCode = statusCode;
  }
}

export function normalizeToken(rawToken: string): string {
  let token = rawToken.trim();
  if (token.toLowerCase().startsWith("bearer ")) {
    token = token.slice(7).trim();
  }
  return token;
}

export function parseCanvasSize(canvasHint: string, canvasPreset: string): [number, number] {
  const override = CANVAS_PRESETS[canvasPreset];
  if (override !== undefined && override !== null) {
    return override;
  }
  const m = (canvasHint || "").match(/(\d{3,4})\s*[xX×]\s*(\d{3,4})/);
  if (m) {
    const w = Math.max(64, Math.floor(parseInt(m[1], 10) / 64) * 64);
    const h = Math.max(64, Math.floor(parseInt(m[2], 10) / 64) * 64);
    return [w, h];
  }
  return [832, 1216];
}

export function estimateV5MediumAnlas(
  width: number,
  height: number,
  steps = 14,
  isOpusFreeEligible = false
): number {
  const pixels = width * height;
  if (isOpusFreeEligible && pixels <= 1048576 && steps <= 28) {
    return 0;
  }
  const stepFactor = 1.0 / 1.06521739;
  const baseCost = Math.ceil(
    2951823174884865e-21 * pixels + 5753298233447344e-22 * pixels * steps * stepFactor
  );
  return Math.max(Math.ceil(baseCost * 1.5), 2);
}

export function buildV5MediumPayload(options: {
  rawPrompt: string;
  width?: number;
  height?: number;
  scale?: number;
  cfgRescale?: number;
  seed?: number;
  extraUc?: string;
  appendV5Quality?: boolean;
}): { payload: Record<string, unknown>; actualSeed: number } {
  const width = options.width ?? 832;
  const height = options.height ?? 1216;
  const scale = options.scale ?? 6.0;
  const cfgRescale = options.cfgRescale ?? 0.0;
  const seed = options.seed ?? -1;
  const extraUc = options.extraUc ?? "";
  const appendV5Quality = options.appendV5Quality ?? true;

  if (width % 64 !== 0 || height % 64 !== 0) {
    throw new NaiApiError(`分辨率必须为 64 的整数倍，当前为 ${width}x${height}`);
  }

  let { baseCaption, charCaptions, useCoords } = parseStructuredPrompt(options.rawPrompt);
  if (!baseCaption.trim()) {
    throw new NaiApiError("提示词内容为空，无法发起生图请求。");
  }

  let baseCaptionInlineKept = "";
  const tune2Re = /(?:,\s*)?(-2\.5::(?:(?!::)[\s\S])*?nose bridge,\s*nostrils,\s*lips(?:(?!::)[\s\S])*?::)/;
  const mTune2 = tune2Re.exec(baseCaption);
  if (mTune2) {
    baseCaptionInlineKept = mTune2[1].trim();
    baseCaption = (
      baseCaption.slice(0, mTune2.index) + baseCaption.slice(mTune2.index + mTune2[0].length)
    ).replace(/^[ ,]+|[ ,]+$/g, "");
  }

  const baseSplit = splitInlineNegativesFromCaption(baseCaption);
  baseCaption = baseSplit.cleaned;
  const baseInlineNegs = baseSplit.negChunks;
  if (baseCaptionInlineKept) {
    baseCaption = `${baseCaption.replace(/[, ]+$/g, "")}, ${baseCaptionInlineKept}`;
  }

  const charInlineNegsList: string[][] = [];
  charCaptions = charCaptions.map((c) => {
    const res = splitInlineNegativesFromCaption(c.char_caption);
    charInlineNegsList.push(res.negChunks);
    return { char_caption: res.cleaned, centers: c.centers };
  });

  const lowerCheck = baseCaption.toLowerCase();
  const hasQualityAlready = ["masterpiece", "very aesthetic", "best quality"].some((kw) =>
    lowerCheck.includes(kw)
  );
  const suppressAnimeQuality = [
    "pixel art",
    "raw photo",
    "gravure",
    "2.8::photorealistic::",
    "no lineart",
  ].some((kw) => lowerCheck.includes(kw));
  const useStdQualityPreset = Boolean(appendV5Quality && !suppressAnimeQuality);
  if (useStdQualityPreset && !hasQualityAlready) {
    baseCaption = `${baseCaption.replace(/[, ]+$/g, "")}, ${V5_QUALITY_SUFFIX}`;
  }

  const fullPosLower = (
    baseCaption +
    " " +
    charCaptions.map((c) => c.char_caption).join(" ")
  ).toLowerCase();
  const wantsNsfw = ["nsfw", "rating:explicit", "uncensored", "nude", "pussy", "penis"].some(
    (tag) => fullPosLower.includes(tag)
  );

  const ucParts: string[] = [];
  if (!wantsNsfw) {
    ucParts.push("nsfw");
  }
  ucParts.push(V5_HEAVY_UC_BASE);
  if (baseInlineNegs.length > 0) {
    ucParts.push(...baseInlineNegs);
  }
  if (extraUc.trim()) {
    ucParts.push(extraUc.trim());
  }
  const negativePrompt = ucParts.join(", ");

  const actualSeed =
    Number.isInteger(seed) && seed > 0 && seed <= 4294967288
      ? seed
      : Math.floor(Math.random() * 4294967288) + 1;
  const cleanScale = Number(Math.max(0.0, Math.min(10.0, scale)).toFixed(1));
  const cleanRescale = Number(Math.max(0.0, Math.min(1.0, cfgRescale)).toFixed(2));

  const characterPromptsApi = charCaptions.map((c, i) => ({
    prompt: c.char_caption,
    uc: (charInlineNegsList[i] ?? []).join(", "),
    center: c.centers[0],
    enabled: true,
  }));
  const negCharCaptions = charCaptions.map((c, i) => ({
    char_caption: (charInlineNegsList[i] ?? []).join(", "),
    centers: c.centers,
  }));

  const parameters = {
    params_version: 4,
    width,
    height,
    scale: cleanScale,
    sampler: "k_euler_ancestral",
    steps: 14,
    n_samples: 1,
    ucPresetId: "heavy",
    qualityPresetId: useStdQualityPreset ? "standard" : "none",
    autoSmea: false,
    dynamic_thresholding: false,
    controlnet_strength: 1.0,
    legacy: false,
    add_original_image: true,
    cfg_rescale: cleanRescale,
    noise_schedule: "karras",
    legacy_v3_extend: false,
    skip_cfg_above_sigma: null,
    use_coords: useCoords,
    legacy_uc: false,
    normalize_reference_strength_multiple: true,
    inpaintImg2ImgStrength: 1.0,
    seed: actualSeed,
    characterPrompts: characterPromptsApi,
    straight_alpha: true,
    tag_hint_qt: 1,
    tag_hint_transparent_background: baseCaption.toLowerCase().includes("transparent background")
      ? true
      : null,
    tag_hint_uc_preset: 2,
    v4_prompt: {
      caption: {
        base_caption: baseCaption,
        char_captions: charCaptions,
      },
      use_coords: useCoords,
      use_order: true,
    },
    v4_negative_prompt: {
      caption: {
        base_caption: negativePrompt,
        char_captions: negCharCaptions,
      },
      legacy_uc: false,
    },
    negative_prompt: negativePrompt,
    deliberate_euler_ancestral_bug: false,
    prefer_brownian: true,
    image_format: "png",
  };

  return {
    payload: {
      input: baseCaption,
      model: MODEL_V5_FULL_MEDIUM,
      action: "generate",
      parameters,
      use_new_shared_trial: false,
    },
    actualSeed,
  };
}

function isPngBytes(b: Uint8Array): boolean {
  return (
    b.length >= 8 &&
    b[0] === 0x89 &&
    b[1] === 0x50 &&
    b[2] === 0x4e &&
    b[3] === 0x47 &&
    b[4] === 0x0d &&
    b[5] === 0x0a &&
    b[6] === 0x1a &&
    b[7] === 0x0a
  );
}

function isWebpBytes(b: Uint8Array): boolean {
  return (
    b.length >= 12 &&
    b[0] === 0x52 &&
    b[1] === 0x49 &&
    b[2] === 0x46 &&
    b[3] === 0x46 &&
    b[8] === 0x57 &&
    b[9] === 0x45 &&
    b[10] === 0x42 &&
    b[11] === 0x50
  );
}

function isJpegBytes(b: Uint8Array): boolean {
  return b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
}

export function detectImageExt(b: Uint8Array): string {
  if (isWebpBytes(b)) return ".webp";
  if (isJpegBytes(b)) return ".jpg";
  return ".png";
}

export async function unpackNaiResponseBytes(bytes: Uint8Array): Promise<Uint8Array> {
  if (isPngBytes(bytes) || isWebpBytes(bytes) || isJpegBytes(bytes)) {
    return bytes;
  }

  // Standard ZIP archive unpacking (supports Store=0 and Deflate=8, including Data Descriptor flag)
  if (bytes.length >= 30 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let compMethod = view.getUint16(8, true);
    let compSize = view.getUint32(18, true);
    const nameLen = view.getUint16(26, true);
    const extraLen = view.getUint16(28, true);
    let dataStart = 30 + nameLen + extraLen;

    // If bit 3 (Data Descriptor) is set, compSize in local header may be 0; locate Central Directory
    const flags = view.getUint16(6, true);
    if ((flags & 0x0008) !== 0 || compSize === 0) {
      let eocdPos = -1;
      const searchStart = Math.max(0, bytes.length - 65557);
      for (let i = bytes.length - 22; i >= searchStart; i--) {
        if (bytes[i] === 0x50 && bytes[i + 1] === 0x4b && bytes[i + 2] === 0x05 && bytes[i + 3] === 0x06) {
          eocdPos = i;
          break;
        }
      }
      if (eocdPos !== -1) {
        const cdOffset = view.getUint32(eocdPos + 16, true);
        if (
          cdOffset + 46 <= bytes.length &&
          bytes[cdOffset] === 0x50 &&
          bytes[cdOffset + 1] === 0x4b &&
          bytes[cdOffset + 2] === 0x01 &&
          bytes[cdOffset + 3] === 0x02
        ) {
          compMethod = view.getUint16(cdOffset + 10, true);
          compSize = view.getUint32(cdOffset + 20, true);
          const localOffset = view.getUint32(cdOffset + 42, true);
          const lNameLen = view.getUint16(localOffset + 26, true);
          const lExtraLen = view.getUint16(localOffset + 28, true);
          dataStart = localOffset + 30 + lNameLen + lExtraLen;
        }
      }
    }

    const compressedSlice = bytes.subarray(dataStart, dataStart + compSize);
    if (compMethod === 0) {
      return compressedSlice.slice();
    }
    if (compMethod === 8) {
      const ds = new DecompressionStream("deflate-raw");
      const decompressed = await new Response(new Blob([compressedSlice as BlobPart]).stream().pipeThrough(ds)).arrayBuffer();
      return new Uint8Array(decompressed);
    }
    throw new NaiApiError(`不支持的 ZIP 压缩方式 (${compMethod})。`);
  }

  const preview = new TextDecoder("utf-8", { fatal: false }).decode(bytes.subarray(0, 180));
  throw new NaiApiError(`无法解析服务端返回的图片数据：${preview}`);
}

export async function readImageDimensions(
  bytes: Uint8Array
): Promise<{ width: number; height: number }> {
  if (isPngBytes(bytes) && bytes.length >= 24) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return {
      width: view.getUint32(16, false),
      height: view.getUint32(20, false),
    };
  }
  const bmp = await createImageBitmap(new Blob([bytes as BlobPart]));
  const res = { width: bmp.width, height: bmp.height };
  bmp.close();
  return res;
}

export async function upscaleNearestNeighbor(
  imageBytes: Uint8Array,
  factor = 3
): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  const bmp = await createImageBitmap(new Blob([imageBytes as BlobPart]));
  const outW = bmp.width * factor;
  const outH = bmp.height * factor;
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bmp.close();
    throw new NaiApiError("浏览器 Canvas 2D 上下文不可用");
  }
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(bmp, 0, 0, outW, outH);
  bmp.close();
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))), "image/png");
  });
  return {
    bytes: new Uint8Array(await blob.arrayBuffer()),
    width: outW,
    height: outH,
  };
}

async function parseApiErrorResponse(resp: Response): Promise<NaiApiError> {
  let rawText = "";
  try {
    rawText = await resp.text();
  } catch {
    rawText = "";
  }
  let msg = rawText.slice(0, 240).trim();
  try {
    const parsed = JSON.parse(rawText) as Record<string, unknown>;
    if (parsed && typeof parsed === "object") {
      msg = String(parsed.message || parsed.error || msg);
    }
  } catch {
    // plain text fallback
  }

  if (resp.status === 401) {
    return new NaiApiError(
      `认证失败 (HTTP 401)：API Token 无效或已过期。请在 NovelAI User Settings -> Account -> Get Persistent API Token 获取以 pst- 开头的令牌。(${msg})`,
      401
    );
  }
  if (resp.status === 402) {
    return new NaiApiError(`点数或订阅不足 (HTTP 402)：当前账户 Anlas 点数不足。(${msg})`, 402);
  }
  if (resp.status === 429) {
    return new NaiApiError(
      `并发请求受限 (HTTP 429)：NovelAI 同一账号同一时刻仅允许生成 1 张图，请稍候几秒再试。(${msg})`,
      429
    );
  }
  return new NaiApiError(`NovelAI 服务端返回错误 (HTTP ${resp.status})：${msg || "未知错误"}`, resp.status);
}

export async function fetchSubscriptionInfo(rawToken: string): Promise<SubscriptionInfo> {
  const token = normalizeToken(rawToken);
  if (!token) {
    throw new NaiApiError("请先填写 NovelAI Persistent API Token（以 pst- 开头）。");
  }

  let resp: Response;
  try {
    // CRITICAL CORS RULE: Only pass Authorization header, no custom x-correlation-id headers
    resp = await fetch(`${NAI_IMAGE_ENDPOINT}/user/subscription`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (err) {
    throw new NaiApiError(`网络连接或 CORS 请求失败：${err instanceof Error ? err.message : String(err)}`);
  }

  if (!resp.ok) {
    throw await parseApiErrorResponse(resp);
  }

  const data = (await resp.json()) as Record<string, unknown>;
  const tier = Number(data.tier ?? 0);
  const tierMap: Record<number, string> = {
    0: "Paper (免费层)",
    1: "Tablet",
    2: "Scroll",
    3: "Opus",
  };
  const tierName = tierMap[tier] ?? `Tier-${tier}`;
  const active = Boolean(data.active);
  const stepsLeft = (data.trainingStepsLeft as Record<string, unknown>) || {};
  const fixedAnlas = Number(stepsLeft.fixedTrainingStepsLeft ?? 0);
  const purchasedAnlas = Number(stepsLeft.purchasedTrainingSteps ?? 0);

  let opusPct: number | null = null;
  let opusNeg = false;
  if (data.usage && typeof data.usage === "object") {
    const usage = data.usage as Record<string, unknown>;
    opusPct = Number(usage.percent ?? 0);
    opusNeg = Boolean(usage.isNegative);
  }
  const perks = (data.perks as Record<string, unknown>) || {};
  const unlimitedMaxPriority = Boolean(perks.unlimitedMaxPriority ?? (tier === 3 && active));
  const expiresAt = Number(data.expiresAt ?? 0);

  return {
    tier,
    tier_name: tierName,
    active,
    anlas_left: fixedAnlas + purchasedAnlas,
    fixed_anlas: fixedAnlas,
    purchased_anlas: purchasedAnlas,
    opus_usage_percent: opusPct,
    opus_usage_negative: opusNeg,
    unlimited_max_priority: unlimitedMaxPriority,
    expires_at: expiresAt,
  };
}

export async function generateSingleImageV5Medium(options: {
  apiToken: string;
  promptText: string;
  width?: number;
  height?: number;
  scale?: number;
  cfgRescale?: number;
  seed?: number;
  extraUc?: string;
  appendV5Quality?: boolean;
  pixel3xNearest?: boolean;
  signal?: AbortSignal;
}): Promise<{
  imageBytes: Uint8Array;
  seed: number;
  width: number;
  height: number;
  elapsedSec: number;
  estimatedAnlas: number;
}> {
  const token = normalizeToken(options.apiToken);
  if (!token) {
    throw new NaiApiError("未填写 API Token！请先填入 NovelAI Persistent API Token (pst-...)");
  }

  const width = options.width ?? 832;
  const height = options.height ?? 1216;
  const { payload, actualSeed } = buildV5MediumPayload({
    rawPrompt: options.promptText,
    width,
    height,
    scale: options.scale,
    cfgRescale: options.cfgRescale,
    seed: options.seed,
    extraUc: options.extraUc,
    appendV5Quality: options.appendV5Quality,
  });

  const form = new FormData();
  form.append("request", new Blob([JSON.stringify(payload)], { type: "application/json" }), "blob");

  const t0 = performance.now();
  let resp: Response;
  try {
    // CRITICAL CORS RULE: Only Authorization header; FormData automatically sets multipart/form-data Content-Type
    resp = await fetch(`${NAI_IMAGE_ENDPOINT}/ai/generate-image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
      signal: options.signal,
    });
  } catch (err) {
    throw new NaiApiError(`生图请求网络异常：${err instanceof Error ? err.message : String(err)}`);
  }

  if (!resp.ok) {
    throw await parseApiErrorResponse(resp);
  }

  const respBytes = new Uint8Array(await resp.arrayBuffer());
  let imageBytes = await unpackNaiResponseBytes(respBytes);
  let outW = width;
  let outH = height;

  if (options.pixel3xNearest) {
    const up = await upscaleNearestNeighbor(imageBytes, 3);
    imageBytes = up.bytes;
    outW = up.width;
    outH = up.height;
  }

  const elapsedSec = Number(((performance.now() - t0) / 1000).toFixed(2));
  const estCost = estimateV5MediumAnlas(width, height, 14, false);

  return {
    imageBytes,
    seed: actualSeed,
    width: outW,
    height: outH,
    elapsedSec,
    estimatedAnlas: estCost,
  };
}

export async function upscaleSingleImageNai(options: {
  apiToken: string;
  imageBytes: Uint8Array;
  signal?: AbortSignal;
}): Promise<{
  imageBytes: Uint8Array;
  srcWidth: number;
  srcHeight: number;
  outWidth: number;
  outHeight: number;
  elapsedSec: number;
}> {
  const token = normalizeToken(options.apiToken);
  if (!token) {
    throw new NaiApiError("未填写 API Token！请先填入 Persistent API Token (pst-...)");
  }

  let pngBytes = options.imageBytes;
  const srcDims = await readImageDimensions(pngBytes);
  if (srcDims.width * srcDims.height > 1600 * 1600) {
    throw new NaiApiError(
      `当前图片分辨率已达 ${srcDims.width}×${srcDims.height}（已放大过或超出官方 Upscaler 输入上限），无需重复放大。`
    );
  }

  if (!isPngBytes(pngBytes)) {
    const up = await upscaleNearestNeighbor(pngBytes, 1);
    pngBytes = up.bytes;
  }

  const reqJson = JSON.stringify({
    image: "image",
    model: MODEL_V5_FULL_MEDIUM,
    declared_blur_sigma: 0,
  });

  const form = new FormData();
  form.append("image", new Blob([pngBytes as BlobPart], { type: "image/png" }), "blob");
  form.append("request", new Blob([reqJson], { type: "application/json" }), "blob");

  const t0 = performance.now();
  let resp: Response;
  try {
    resp = await fetch(`${NAI_IMAGE_ENDPOINT}/ai/upscale`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
      signal: options.signal,
    });
  } catch (err) {
    throw new NaiApiError(`Upscale 放大请求网络异常：${err instanceof Error ? err.message : String(err)}`);
  }

  if (!resp.ok) {
    throw await parseApiErrorResponse(resp);
  }

  const outRaw = new Uint8Array(await resp.arrayBuffer());
  const outBytes = await unpackNaiResponseBytes(outRaw);
  const outDims = await readImageDimensions(outBytes);
  const elapsedSec = Number(((performance.now() - t0) / 1000).toFixed(2));

  return {
    imageBytes: outBytes,
    srcWidth: srcDims.width,
    srcHeight: srcDims.height,
    outWidth: outDims.width,
    outHeight: outDims.height,
    elapsedSec,
  };
}
