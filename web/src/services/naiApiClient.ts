import {
  CANVAS_PRESETS,
  MODEL_V4_5_FULL,
  MODEL_V5_FULL,
  MODEL_V5_FULL_MEDIUM,
  NAI_IMAGE_ENDPOINT,
  V4_5_HUMAN_FOCUS_UC_BASE,
  V4_5_LIGHT_UC_BASE,
  V5_HEAVY_UC_BASE,
} from "../data/engineConstants";
import {
  applySmartQualitySuffix,
  deduplicateCommaTags,
  parseStructuredPrompt,
  splitInlineNegativesFromCaption,
} from "../engine/t5Tokenizer";
import type {
  NaiModelId,
  NaiUcPresetMode,
  SubscriptionInfo,
  VibeTransferSlotInput,
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
  vibeCount?: number;
}): number {
  const isV45 = options.model === MODEL_V4_5_FULL;
  const isV5High = options.model === MODEL_V5_FULL;
  const supportsCustomSteps = isV45 || isV5High;
  const effectiveSteps = supportsCustomSteps
    ? Math.max(1, Math.min(50, Math.round(options.steps ?? 28)))
    : 14;
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

  const activeVibeCount =
    typeof options.vibeCount === "number" ? Math.max(0, Math.round(options.vibeCount)) : 0;
  // Pre-encoded .naiv4vibebundle / .naiv4vibe vectors cost 0 encoding Anlas; >4 active vibes add 2 Anlas per extra slot
  const vibeSurcharge = isV45 && activeVibeCount > 4 ? (activeVibeCount - 4) * 2 : 0;
  return genCost + vibeSurcharge;
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

export type NaiSamplerId =
  | "auto"
  | "k_euler_ancestral"
  | "k_dpmpp_2m"
  | "k_dpmpp_2s_ancestral"
  | "k_euler";

export function buildNaiGeneratePayload(options: {
  model?: NaiModelId;
  rawPrompt: string;
  customNegPrompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  scale?: number;
  cfgRescale?: number;
  seed?: number;
  sampler?: NaiSamplerId;
  ucPresetMode?: NaiUcPresetMode;
  keepInlineNegatives?: boolean;
  extraUc?: string;
  appendV5Quality?: boolean;
  vibes?: VibeTransferSlotInput[];
  normalizeVibeStrength?: boolean;
}): {
  payload: Record<string, unknown>;
  actualSeed: number;
  effectiveSteps: number;
  usedVibeTransfer: boolean;
  vibeCount: number;
  effectiveSampler: string;
} {
  const model: NaiModelId =
    options.model === MODEL_V4_5_FULL
      ? MODEL_V4_5_FULL
      : options.model === MODEL_V5_FULL
        ? MODEL_V5_FULL
        : MODEL_V5_FULL_MEDIUM;
  const isV45 = model === MODEL_V4_5_FULL;
  const isV5High = model === MODEL_V5_FULL;
  const isV5Medium = model === MODEL_V5_FULL_MEDIUM;
  const supportsCustomStepsAndUc = isV45 || isV5High;
  const effectiveSteps = supportsCustomStepsAndUc
    ? Math.max(1, Math.min(50, Math.round(options.steps ?? 28)))
    : 14;
  const width = options.width ?? 832;
  const height = options.height ?? 1216;
  const scale = options.scale ?? (supportsCustomStepsAndUc ? 7.0 : 6.0);
  const cfgRescale = supportsCustomStepsAndUc ? (options.cfgRescale ?? 0.0) : 0.0;
  const seed = options.seed ?? -1;
  const extraUc = options.extraUc ?? "";
  const customNegPrompt = (options.customNegPrompt ?? "").trim();
  const appendV5Quality = options.appendV5Quality ?? true;
  // V5 Full Medium enforces heavy UC preset; V4.5 Full and V5 Full High respect user choice
  const effectiveUcPreset: NaiUcPresetMode = supportsCustomStepsAndUc
    ? options.ucPresetMode ?? "heavy"
    : "heavy";
  // V4.5 Full & V5 Full High separate positive and negative prompts by default;
  // V5 Full Medium ignores custom negative_prompt server-side, so inline -2::...:: is enforced on Medium
  const keepInlineNegs = supportsCustomStepsAndUc
    ? Boolean(options.keepInlineNegatives ?? false)
    : true;

  const activeVibes: VibeTransferSlotInput[] = [];
  if (options.vibes && options.vibes.length > 0) {
    for (const v of options.vibes) {
      if (v && typeof v.encoding === "string" && v.encoding.trim().length > 0) {
        activeVibes.push(v);
        if (activeVibes.length >= 16) break;
      }
    }
  }
  const usedVibeTransfer = activeVibes.length > 0;

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
    const inlineAdditions: string[] = [];
    if (customNegPrompt) inlineAdditions.push(customNegPrompt);
    if (isV5Medium && extraUc.trim()) inlineAdditions.push(extraUc.trim());
    if (inlineAdditions.length > 0) {
      const dedupInline = deduplicateCommaTags(inlineAdditions.join(", "));
      if (dedupInline && !baseCaption.includes(`-2::${dedupInline}::`)) {
        baseCaption = `${baseCaption.replace(/[, ]+$/g, "")}, -2::${dedupInline}::`;
      }
    }
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
  baseCaption = applySmartQualitySuffix(baseCaption, useStdQualityPreset);

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
  if (!keepInlineNegs && customNegPrompt) {
    ucParts.push(customNegPrompt);
  }
  if (baseInlineNegs.length > 0) {
    ucParts.push(...baseInlineNegs);
  }
  if (extraUc.trim() && !(keepInlineNegs && isV5Medium)) {
    ucParts.push(extraUc.trim());
  }
  const negativePrompt = deduplicateCommaTags(ucParts.join(", "));

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
  const requestedSampler = options.sampler ?? "auto";
  const effectiveSampler = isV5Medium
    ? "k_euler_ancestral"
    : requestedSampler !== "auto"
      ? requestedSampler
      : usedVibeTransfer
        ? "k_dpmpp_2m"
        : "k_euler_ancestral";

  const parameters: Record<string, unknown> = isV45
    ? {
        params_version: 3,
        width,
        height,
        scale: cleanScale,
        sampler: effectiveSampler,
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
        normalize_reference_strength_multiple: true,
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
        sampler: effectiveSampler,
        steps: effectiveSteps,
        n_samples: 1,
        ucPresetId: effectiveUcPreset,
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
          legacy_uc: false,
        },
        negative_prompt: negativePrompt,
        deliberate_euler_ancestral_bug: false,
        prefer_brownian: true,
        image_format: "png",
      };

  if (usedVibeTransfer) {
    parameters.reference_image_multiple = activeVibes.map((v) => v.encoding.trim());
    parameters.reference_information_extracted_multiple = activeVibes.map((v) =>
      Number(Math.max(0.01, Math.min(1.0, v.informationExtracted)).toFixed(2))
    );
    parameters.reference_strength_multiple = activeVibes.map((v) =>
      Number(Math.max(-1.0, Math.min(1.0, v.strength)).toFixed(2))
    );
    parameters.normalize_reference_strength_multiple = Boolean(
      options.normalizeVibeStrength ?? true
    );
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
    usedVibeTransfer,
    vibeCount: activeVibes.length,
    effectiveSampler,
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

  if (bytes.length >= 30 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let compMethod = view.getUint16(8, true);
    let compSize = view.getUint32(18, true);
    const nameLen = view.getUint16(26, true);
    const extraLen = view.getUint16(28, true);
    let dataStart = 30 + nameLen + extraLen;

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

function computeCanonicalVibeSourceCanvas(
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

async function prepareVibeSourcePng(rawBytes: Uint8Array): Promise<Uint8Array> {
  const copy = new Uint8Array(rawBytes.byteLength);
  copy.set(rawBytes);
  const bmp = await createImageBitmap(new Blob([copy]));
  const origWidth = bmp.width;
  const origHeight = bmp.height;
  const { normWidth, normHeight, drawWidth, drawHeight, dx, dy } =
    computeCanonicalVibeSourceCanvas(origWidth, origHeight);

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
      throw new NaiApiError("浏览器 Canvas 2D 上下文不可用，无法预处理图像。");
    }

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
    return new Uint8Array(await blob.arrayBuffer());
  } finally {
    bmp.close();
  }
}

export async function generateSingleImageNai(options: {
  apiToken: string;
  model?: NaiModelId;
  promptText: string;
  customNegPrompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  scale?: number;
  cfgRescale?: number;
  seed?: number;
  sampler?: NaiSamplerId;
  ucPresetMode?: NaiUcPresetMode;
  keepInlineNegatives?: boolean;
  extraUc?: string;
  appendV5Quality?: boolean;
  vibes?: VibeTransferSlotInput[];
  normalizeVibeStrength?: boolean;
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
  usedVibeTransfer: boolean;
  vibeCount: number;
}> {
  const token = normalizeToken(options.apiToken);
  if (!token) {
    throw new NaiApiError("未填写 API Token！请先填入 NovelAI Persistent API Token (pst-...)");
  }

  const model: NaiModelId =
    options.model === MODEL_V4_5_FULL
      ? MODEL_V4_5_FULL
      : options.model === MODEL_V5_FULL
        ? MODEL_V5_FULL
        : MODEL_V5_FULL_MEDIUM;
  const width = options.width ?? 832;
  const height = options.height ?? 1216;

  const {
    payload,
    actualSeed,
    effectiveSteps,
    usedVibeTransfer,
    vibeCount,
  } = buildNaiGeneratePayload({
    model,
    rawPrompt: options.promptText,
    customNegPrompt: options.customNegPrompt,
    width,
    height,
    steps: options.steps,
    scale: options.scale,
    cfgRescale: options.cfgRescale,
    seed: options.seed,
    sampler: options.sampler,
    ucPresetMode: options.ucPresetMode,
    keepInlineNegatives: options.keepInlineNegatives,
    extraUc: options.extraUc,
    appendV5Quality: options.appendV5Quality,
    vibes: options.vibes,
    normalizeVibeStrength: options.normalizeVibeStrength,
  });

  const t0 = performance.now();
  let resp: Response;
  try {
    if (model === MODEL_V4_5_FULL) {
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
    vibeCount,
  });

  return {
    imageBytes,
    seed: actualSeed,
    width: outW,
    height: outH,
    elapsedSec,
    estimatedAnlas: estCost,
    model,
    usedVibeTransfer,
    vibeCount,
  };
}

export async function encodeVibeImageNai(options: {
  apiToken: string;
  imageBytes: Uint8Array;
  informationExtracted?: number;
  model?: NaiModelId;
  signal?: AbortSignal;
}): Promise<{
  encodingBase64: string;
  informationExtracted: number;
  modelKey: string;
  preparedPngBytes: Uint8Array;
}> {
  const token = normalizeToken(options.apiToken);
  if (!token) {
    throw new NaiApiError("未填写 API Token！请先填入 NovelAI Persistent API Token (pst-...)");
  }
  const cleanIe = Number(
    Math.max(0.01, Math.min(1.0, options.informationExtracted ?? 1.0)).toFixed(2)
  );
  const preparedPngBytes = await prepareVibeSourcePng(options.imageBytes);
  const base64Img = uint8ArrayToBase64(preparedPngBytes);

  let resp: Response;
  try {
    resp = await fetch(`${NAI_IMAGE_ENDPOINT}/ai/encode-vibe`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: base64Img,
        information_extracted: cleanIe,
        model: MODEL_V4_5_FULL,
      }),
      signal: options.signal,
    });
  } catch (err) {
    throw new NaiApiError(`Vibe 在线编码请求网络异常：${err instanceof Error ? err.message : String(err)}`);
  }

  if (!resp.ok) {
    throw await parseApiErrorResponse(resp);
  }

  const rawBuf = new Uint8Array(await resp.arrayBuffer());
  if (rawBuf.byteLength === 0) {
    throw new NaiApiError("Vibe 在线编码返回数据为空。");
  }
  return {
    encodingBase64: uint8ArrayToBase64(rawBuf),
    informationExtracted: cleanIe,
    modelKey: "v4-5full",
    preparedPngBytes,
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
