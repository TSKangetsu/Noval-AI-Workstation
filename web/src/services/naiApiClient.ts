import {
  CANVAS_PRESETS,
  MODEL_V4_5_FULL,
  MODEL_V5_FULL_MEDIUM,
  NAI_IMAGE_ENDPOINT,
  V4_5_HUMAN_FOCUS_UC_BASE,
  V4_5_LIGHT_UC_BASE,
  V5_HEAVY_UC_BASE,
  V5_QUALITY_SUFFIX,
} from "../data/engineConstants";
import {
  parseStructuredPrompt,
  splitInlineNegativesFromCaption,
} from "../engine/t5Tokenizer";
import type {
  NaiModelId,
  NaiUcPresetMode,
  PreciseRefMode,
  PreciseRefSlotInput,
  SubscriptionInfo,
} from "../engine/types";

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

export function estimateNaiAnlas(options: {
  model: NaiModelId;
  width: number;
  height: number;
  steps?: number;
  isOpusFreeEligible?: boolean;
  hasPreciseRef?: boolean;
  preciseRefCount?: number;
}): number {
  const isV45 = options.model === MODEL_V4_5_FULL;
  const effectiveSteps = isV45 ? Math.max(1, Math.min(50, Math.round(options.steps ?? 28))) : 14;
  const pixels = options.width * options.height;
  const isOpusFreeBase = Boolean(
    options.isOpusFreeEligible && pixels <= 1048576 && effectiveSteps <= 28
  );

  let genCost = 0;
  if (!isOpusFreeBase) {
    const stepFactor = 1.0 / 1.06521739;
    const baseCost = Math.ceil(
      2951823174884865e-21 * pixels + 5753298233447344e-22 * pixels * effectiveSteps * stepFactor
    );
    genCost = isV45 ? Math.max(baseCost, 2) : Math.max(Math.ceil(baseCost * 1.5), 2);
  }

  const refCount =
    typeof options.preciseRefCount === "number"
      ? Math.max(0, Math.round(options.preciseRefCount))
      : options.hasPreciseRef
        ? 1
        : 0;
  const refSurcharge = isV45 ? refCount * 5 : 0;
  return genCost + refSurcharge;
}

export function estimateV5MediumAnlas(
  width: number,
  height: number,
  steps = 14,
  isOpusFreeEligible = false
): number {
  return estimateNaiAnlas({
    model: MODEL_V5_FULL_MEDIUM,
    width,
    height,
    steps,
    isOpusFreeEligible,
    hasPreciseRef: false,
  });
}

export interface BuildPreciseRefMeta {
  mode: PreciseRefMode;
  strength: number;
  fidelity: number;
  base64Image?: string;
}

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  const CHUNK_SIZE = 0x8000;
  const chunks: string[] = [];
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const slice = bytes.subarray(i, Math.min(i + CHUNK_SIZE, bytes.length));
    chunks.push(String.fromCharCode.apply(null, slice as unknown as number[]));
  }
  return btoa(chunks.join(""));
}

export function buildNaiGeneratePayload(options: {
  model?: NaiModelId;
  rawPrompt: string;
  width?: number;
  height?: number;
  steps?: number;
  scale?: number;
  cfgRescale?: number;
  seed?: number;
  ucPresetMode?: NaiUcPresetMode;
  keepInlineNegatives?: boolean;
  extraUc?: string;
  appendV5Quality?: boolean;
  hasPreciseRef?: boolean;
  preciseRefMode?: PreciseRefMode;
  preciseRefStrength?: number;
  preciseRefFidelity?: number;
  preciseRefMetas?: BuildPreciseRefMeta[];
}): {
  payload: Record<string, unknown>;
  actualSeed: number;
  effectiveSteps: number;
  usedPreciseRef: boolean;
  preciseRefCount: number;
} {
  const model: NaiModelId =
    options.model === MODEL_V4_5_FULL ? MODEL_V4_5_FULL : MODEL_V5_FULL_MEDIUM;
  const isV45 = model === MODEL_V4_5_FULL;
  const effectiveSteps = isV45 ? Math.max(1, Math.min(50, Math.round(options.steps ?? 28))) : 14;
  const width = options.width ?? 832;
  const height = options.height ?? 1216;
  const scale = options.scale ?? (isV45 ? 7.0 : 6.0);
  const cfgRescale = options.cfgRescale ?? 0.0;
  const seed = options.seed ?? -1;
  const extraUc = options.extraUc ?? "";
  const appendV5Quality = options.appendV5Quality ?? true;
  // V5 Full Medium enforces heavy UC preset; V4.5 respects user choice (default "heavy" to match NovelAI Web UI default)
  const effectiveUcPreset: NaiUcPresetMode = isV45
    ? options.ucPresetMode ?? "heavy"
    : "heavy";
  // Keep inline `-2::...::` weights intact in positive caption by default on V4.5 (matching web single-box behavior)
  const keepInlineNegs = options.keepInlineNegatives ?? isV45;

  const resolvedMetas: BuildPreciseRefMeta[] = [];
  if (isV45) {
    if (options.preciseRefMetas && options.preciseRefMetas.length > 0) {
      resolvedMetas.push(...options.preciseRefMetas);
    } else if (options.hasPreciseRef) {
      resolvedMetas.push({
        mode: options.preciseRefMode ?? "character",
        strength: options.preciseRefStrength ?? 1.0,
        fidelity: options.preciseRefFidelity ?? 1.0,
      });
    }
  }
  const usedPreciseRef = resolvedMetas.length > 0;

  if (width % 64 !== 0 || height % 64 !== 0) {
    throw new NaiApiError(`分辨率必须为 64 的整数倍，当前为 ${width}x${height}`);
  }

  let { baseCaption, charCaptions, useCoords } = parseStructuredPrompt(options.rawPrompt);
  if (!baseCaption.trim()) {
    throw new NaiApiError("提示词内容为空，无法发起生图请求。");
  }

  let baseInlineNegs: string[] = [];
  const charInlineNegsList: string[][] = [];

  if (keepInlineNegs) {
    baseCaption = baseCaption.trim();
    charCaptions = charCaptions.map((c) => {
      charInlineNegsList.push([]);
      return { char_caption: c.char_caption.trim(), centers: c.centers };
    });
  } else {
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
    baseInlineNegs = baseSplit.negChunks;
    if (baseCaptionInlineKept) {
      baseCaption = `${baseCaption.replace(/[, ]+$/g, "")}, ${baseCaptionInlineKept}`;
    }

    charCaptions = charCaptions.map((c) => {
      const res = splitInlineNegativesFromCaption(c.char_caption);
      charInlineNegsList.push(res.negChunks);
      return { char_caption: res.cleaned, centers: c.centers };
    });
  }

  const lowerCheck = baseCaption.trim().replace(/[, ]+$/g, "").toLowerCase();
  const suppressAnimeQuality = [
    "pixel art",
    "raw photo",
    "gravure",
    "2.8::photorealistic::",
    "no lineart",
  ].some((kw) => lowerCheck.includes(kw));
  const useStdQualityPreset = Boolean(appendV5Quality && !suppressAnimeQuality);
  const alreadyHasStdSuffix = lowerCheck.endsWith(V5_QUALITY_SUFFIX.toLowerCase());
  if (useStdQualityPreset && !alreadyHasStdSuffix) {
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
  if (effectiveUcPreset === "heavy") {
    if (!wantsNsfw) ucParts.push("nsfw");
    ucParts.push(V5_HEAVY_UC_BASE);
  } else if (effectiveUcPreset === "light") {
    if (!wantsNsfw) ucParts.push("nsfw");
    ucParts.push(V4_5_LIGHT_UC_BASE);
  } else if (effectiveUcPreset === "human_focus") {
    if (!wantsNsfw) ucParts.push("nsfw");
    ucParts.push(V4_5_HUMAN_FOCUS_UC_BASE);
  }
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

  const ucPresetIntMap: Partial<Record<NaiUcPresetMode, number>> = {
    heavy: 0,
    light: 1,
    human_focus: 3,
  };
  const tagHintUcMap: Record<NaiUcPresetMode, number> = {
    none: 0,
    heavy: 2,
    light: 3,
    human_focus: 4,
  };
  const ucPresetInt = ucPresetIntMap[effectiveUcPreset];

  const parameters: Record<string, unknown> = isV45
    ? {
        params_version: 3,
        width,
        height,
        scale: cleanScale,
        sampler: "k_euler_ancestral",
        steps: effectiveSteps,
        n_samples: 1,
        ...(ucPresetInt !== undefined ? { ucPreset: ucPresetInt } : {}),
        qualityToggle: useStdQualityPreset,
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
        normalize_reference_strength_multiple: !usedPreciseRef,
        inpaintImg2ImgStrength: 1.0,
        seed: actualSeed,
        characterPrompts: characterPromptsApi,
        tag_hint_qt: useStdQualityPreset ? 1 : 0,
        tag_hint_uc_preset: tagHintUcMap[effectiveUcPreset],
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
          use_coords: false,
          use_order: false,
          legacy_uc: false,
        },
        negative_prompt: negativePrompt,
        deliberate_euler_ancestral_bug: false,
        prefer_brownian: true,
        image_format: "png",
      }
    : {
        params_version: 4,
        width,
        height,
        scale: cleanScale,
        sampler: "k_euler_ancestral",
        steps: effectiveSteps,
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
        tag_hint_qt: useStdQualityPreset ? 1 : 0,
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

  if (usedPreciseRef) {
    // Official NovelAI V4.5 Precise Reference expects raw Base64 PNG strings in director_reference_images
    parameters.director_reference_images = resolvedMetas.map(
      (m, idx) => m.base64Image ?? `director_ref_${idx}`
    );
    parameters.director_reference_descriptions = resolvedMetas.map((m) => ({
      caption: {
        base_caption: m.mode,
        char_captions: [],
      },
      use_coords: false,
      use_order: false,
      legacy_uc: false,
    }));
    parameters.director_reference_information_extracted = resolvedMetas.map(() => 1.0);
    parameters.director_reference_strength_values = resolvedMetas.map((m) =>
      Number(Math.max(0.0, Math.min(1.0, m.strength)).toFixed(2))
    );
    // NovelAI Director Reference API stores (1.0 - Fidelity) in secondary_strength_values
    parameters.director_reference_secondary_strength_values = resolvedMetas.map((m) => {
      const cleanFid = Number(Math.max(0.0, Math.min(1.0, m.fidelity)).toFixed(2));
      return Number((1.0 - cleanFid).toFixed(2));
    });
  }

  return {
    payload: {
      input: baseCaption,
      model,
      action: "generate",
      parameters,
      use_new_shared_trial: true,
    },
    actualSeed,
    effectiveSteps,
    usedPreciseRef,
    preciseRefCount: resolvedMetas.length,
  };
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
  const { payload, actualSeed } = buildNaiGeneratePayload({
    ...options,
    model: MODEL_V5_FULL_MEDIUM,
  });
  return { payload, actualSeed };
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

export function computeCanonicalPreciseRefCanvas(
  srcWidth: number,
  srcHeight: number
): {
  normWidth: number;
  normHeight: number;
  drawWidth: number;
  drawHeight: number;
  dx: number;
  dy: number;
} {
  const safeW = Math.max(1, srcWidth);
  const safeH = Math.max(1, srcHeight);
  const aspect = safeW / safeH;
  const candidates: Array<[number, number]> = [
    [1024, 1536],
    [1472, 1472],
    [1536, 1024],
  ];
  let normWidth = 1472;
  let normHeight = 1472;
  let bestDiff = Number.POSITIVE_INFINITY;
  for (const [cw, ch] of candidates) {
    const diff = Math.abs(cw / ch - aspect);
    if (diff < bestDiff) {
      bestDiff = diff;
      normWidth = cw;
      normHeight = ch;
    }
  }
  const scale = Math.min(normWidth / safeW, normHeight / safeH);
  const drawWidth = Math.max(1, Math.round(safeW * scale));
  const drawHeight = Math.max(1, Math.round(safeH * scale));
  const dx = Math.floor((normWidth - drawWidth) / 2);
  const dy = Math.floor((normHeight - drawHeight) / 2);
  return { normWidth, normHeight, drawWidth, drawHeight, dx, dy };
}

export async function preparePreciseReferencePng(rawBytes: Uint8Array): Promise<{
  preparedPngBytes: Uint8Array;
  origWidth: number;
  origHeight: number;
  normWidth: number;
  normHeight: number;
}> {
  const copy = new Uint8Array(rawBytes.byteLength);
  copy.set(rawBytes);
  const bmp = await createImageBitmap(new Blob([copy]));
  const origWidth = bmp.width;
  const origHeight = bmp.height;
  const { normWidth, normHeight, drawWidth, drawHeight, dx, dy } =
    computeCanonicalPreciseRefCanvas(origWidth, origHeight);

  // Progressive multi-step 2x halving downsample for 4K / ultra-high-res reference sheets:
  // Single-step >2x downscaling in browser Canvas 2D causes lineart aliasing & moiré artifacts.
  let curSource: CanvasImageSource = bmp;
  let curW = origWidth;
  let curH = origHeight;
  try {
    while (curW * 0.5 >= drawWidth && curH * 0.5 >= drawHeight) {
      const nextW = Math.max(drawWidth, Math.round(curW * 0.5));
      const nextH = Math.max(drawHeight, Math.round(curH * 0.5));
      if (nextW === curW && nextH === curH) break;
      const stepCanvas = document.createElement("canvas");
      stepCanvas.width = nextW;
      stepCanvas.height = nextH;
      const stepCtx = stepCanvas.getContext("2d");
      if (!stepCtx) break;
      stepCtx.imageSmoothingEnabled = true;
      stepCtx.imageSmoothingQuality = "high";
      stepCtx.drawImage(curSource, 0, 0, nextW, nextH);
      curSource = stepCanvas;
      curW = nextW;
      curH = nextH;
    }

    const canvas = document.createElement("canvas");
    canvas.width = normWidth;
    canvas.height = normHeight;
    const ctx = canvas.getContext("2d", { alpha: false }) || canvas.getContext("2d");
    if (!ctx) {
      throw new NaiApiError("浏览器 Canvas 2D 上下文不可用，无法预处理精密参照图像。");
    }

    // Standard black letterbox padding matching NovelAI Web UI / SDK preprocessing
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, normWidth, normHeight);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(curSource, dx, dy, drawWidth, drawHeight);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))),
        "image/png"
      );
    });
    return {
      preparedPngBytes: new Uint8Array(await blob.arrayBuffer()),
      origWidth,
      origHeight,
      normWidth,
      normHeight,
    };
  } finally {
    bmp.close();
  }
}

export async function generateSingleImageNai(options: {
  apiToken: string;
  model?: NaiModelId;
  promptText: string;
  width?: number;
  height?: number;
  steps?: number;
  scale?: number;
  cfgRescale?: number;
  seed?: number;
  ucPresetMode?: NaiUcPresetMode;
  keepInlineNegatives?: boolean;
  extraUc?: string;
  appendV5Quality?: boolean;
  preciseRefs?: PreciseRefSlotInput[];
  preciseRefPngBytes?: Uint8Array | null;
  preciseRefMode?: PreciseRefMode;
  preciseRefStrength?: number;
  preciseRefFidelity?: number;
  isOpusFreeEligible?: boolean;
  pixel3xNearest?: boolean;
  signal?: AbortSignal;
}): Promise<{
  imageBytes: Uint8Array;
  seed: number;
  width: number;
  height: number;
  elapsedSec: number;
  estimatedAnlas: number;
  model: NaiModelId;
  usedPreciseRef: boolean;
  preciseRefCount: number;
}> {
  const token = normalizeToken(options.apiToken);
  if (!token) {
    throw new NaiApiError("未填写 API Token！请先填入 NovelAI Persistent API Token (pst-...)");
  }

  const model: NaiModelId =
    options.model === MODEL_V4_5_FULL ? MODEL_V4_5_FULL : MODEL_V5_FULL_MEDIUM;
  const width = options.width ?? 832;
  const height = options.height ?? 1216;

  const activeRefs: PreciseRefSlotInput[] = [];
  if (model === MODEL_V4_5_FULL) {
    if (options.preciseRefs && options.preciseRefs.length > 0) {
      for (const r of options.preciseRefs) {
        if (r.pngBytes && r.pngBytes.length > 0) {
          activeRefs.push(r);
        }
      }
    } else if (options.preciseRefPngBytes && options.preciseRefPngBytes.length > 0) {
      activeRefs.push({
        mode: options.preciseRefMode ?? "character",
        pngBytes: options.preciseRefPngBytes,
        strength: options.preciseRefStrength ?? 1.0,
        fidelity: options.preciseRefFidelity ?? 1.0,
      });
    }
  }

  const { payload, actualSeed, effectiveSteps, usedPreciseRef, preciseRefCount } =
    buildNaiGeneratePayload({
      model,
      rawPrompt: options.promptText,
      width,
      height,
      steps: options.steps,
      scale: options.scale,
      cfgRescale: options.cfgRescale,
      seed: options.seed,
      ucPresetMode: options.ucPresetMode,
      keepInlineNegatives: options.keepInlineNegatives,
      extraUc: options.extraUc,
      appendV5Quality: options.appendV5Quality,
      preciseRefMetas: activeRefs.map((r) => ({
        mode: r.mode,
        strength: r.strength,
        fidelity: r.fidelity,
        base64Image: uint8ArrayToBase64(r.pngBytes),
      })),
    });

  const t0 = performance.now();
  let resp: Response;
  try {
    if (model === MODEL_V4_5_FULL) {
      // Official NovelAI V4.5 REST JSON transport: passes Base64 PNGs in parameters.director_reference_images
      // (CORS preflight verified: Access-Control-Allow-Headers: Authorization, Content-Type; Origin: *)
      resp = await fetch(`${NAI_IMAGE_ENDPOINT}/ai/generate-image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: options.signal,
      });
    } else {
      // V5 Full Medium multipart request part
      const form = new FormData();
      form.append(
        "request",
        new Blob([JSON.stringify(payload)], { type: "application/json" }),
        "blob"
      );
      resp = await fetch(`${NAI_IMAGE_ENDPOINT}/ai/generate-image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
        signal: options.signal,
      });
    }
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
  const estCost = estimateNaiAnlas({
    model,
    width,
    height,
    steps: effectiveSteps,
    isOpusFreeEligible: Boolean(options.isOpusFreeEligible),
    preciseRefCount,
  });

  return {
    imageBytes,
    seed: actualSeed,
    width: outW,
    height: outH,
    elapsedSec,
    estimatedAnlas: estCost,
    model,
    usedPreciseRef,
    preciseRefCount,
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
  return generateSingleImageNai({
    ...options,
    model: MODEL_V5_FULL_MEDIUM,
  });
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
