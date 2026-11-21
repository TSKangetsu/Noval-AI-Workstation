import {
  POSITION_GRID,
  V4_5_HUMAN_FOCUS_UC_BASE,
  V4_5_LIGHT_UC_BASE,
  V5_HEAVY_UC_BASE,
  V5_QUALITY_SUFFIX,
} from "../data/engineConstants";
import { T5_VOCAB_GZIP_B64 } from "../data/t5VocabB64";
import type { NaiUcPresetMode, TokenCountInfo } from "./types";

let vocabScores: Map<string, number> | null = null;
let maxPieceLen = 16;
let initPromise: Promise<void> | null = null;
const encodeLenCache = new Map<string, number>();
const MAX_ENCODE_CACHE = 4096;

function base64ToUint8Array(b64: string): Uint8Array<ArrayBuffer> {
  const binStr = atob(b64);
  const bytes = new Uint8Array(new ArrayBuffer(binStr.length));
  for (let i = 0; i < binStr.length; i++) {
    bytes[i] = binStr.charCodeAt(i);
  }
  return bytes;
}

async function gunzipToString(gzBytes: Uint8Array<ArrayBuffer>): Promise<string> {
  const ds = new DecompressionStream("gzip");
  const stream = new Blob([gzBytes]).stream().pipeThrough(ds);
  return await new Response(stream).text();
}

export async function initT5Tokenizer(): Promise<void> {
  if (vocabScores !== null) return;
  if (initPromise !== null) return initPromise;
  initPromise = (async () => {
    const gzBytes = base64ToUint8Array(T5_VOCAB_GZIP_B64);
    const jsonText = await gunzipToString(gzBytes);
    const entries = JSON.parse(jsonText) as Array<[string, number]>;
    const map = new Map<string, number>();
    let maxLen = 1;
    for (const [piece, score] of entries) {
      map.set(piece, score);
      if (piece.length > maxLen) {
        maxLen = piece.length;
      }
    }
    vocabScores = map;
    maxPieceLen = maxLen;
    encodeLenCache.clear();
  })();
  return initPromise;
}

export function isT5TokenizerReady(): boolean {
  return vocabScores !== null;
}

export function encodeT5Len(text: string): number {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return 0;

  if (vocabScores === null) {
    // Fallback regex estimator only before async DecompressionStream resolves
    const pieces = clean.match(/[A-Za-z]+|\d+(?:\.\d+)?|[^\sA-Za-z0-9]/g) ?? [];
    let total = 0;
    for (const p of pieces) {
      total += /^[A-Za-z]+$/.test(p) && p.length > 7 ? Math.max(1, Math.floor((p.length + 4) / 5)) : 1;
    }
    return total;
  }

  const cached = encodeLenCache.get(clean);
  if (cached !== undefined) {
    return cached;
  }

  const normalized = clean.trim().split(/\s+/).join("▁");
  const s = /^[,.:;!?)]/.test(normalized) ? normalized : "▁" + normalized;
  const n = s.length;
  const dpScore = new Float64Array(n + 1);
  const dpCount = new Int32Array(n + 1);
  dpScore.fill(-1e18);
  dpScore[0] = 0.0;
  dpCount[0] = 0;

  for (let i = 0; i < n; i++) {
    const baseSc = dpScore[i];
    if (baseSc <= -1e17) continue;
    const baseCnt = dpCount[i];
    let matched = false;
    const limit = Math.min(maxPieceLen, n - i);
    for (let l = 1; l <= limit; l++) {
      const sub = s.slice(i, i + l);
      const sc = vocabScores.get(sub);
      if (sc !== undefined) {
        matched = true;
        const cand = baseSc + sc;
        if (cand > dpScore[i + l]) {
          dpScore[i + l] = cand;
          dpCount[i + l] = baseCnt + 1;
        }
      }
    }
    if (!matched) {
      const cand = baseSc - 100.0;
      if (cand > dpScore[i + 1]) {
        dpScore[i + 1] = cand;
        dpCount[i + 1] = baseCnt + 1;
      }
    }
  }
  const ans = dpCount[n];
  if (encodeLenCache.size >= MAX_ENCODE_CACHE) {
    encodeLenCache.clear();
  }
  encodeLenCache.set(clean, ans);
  return ans;
}

export interface CharCaptionItem {
  char_caption: string;
  centers: Array<{ x: number; y: number }>;
}

export function parseStructuredPrompt(rawPrompt: string): {
  baseCaption: string;
  charCaptions: CharCaptionItem[];
  useCoords: boolean;
} {
  const text = rawPrompt.trim();
  if (!text.includes("[Base Prompt]")) {
    return { baseCaption: text, charCaptions: [], useCoords: false };
  }

  const pattern = /\[(Base Prompt|Character\s*\d+(?:\s*\(([A-Ea-e][1-5])\))?)\]\s*:?\s*/gm;
  const matches: Array<{ index: number; end: number; header: string; coord: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    matches.push({
      index: m.index,
      end: pattern.lastIndex,
      header: m[1],
      coord: (m[2] || "").toUpperCase(),
    });
  }

  if (matches.length === 0) {
    return { baseCaption: text, charCaptions: [], useCoords: false };
  }

  let baseCaption = "";
  const charCaptions: CharCaptionItem[] = [];
  let useCoords = false;

  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i];
    const start = cur.end;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    const body = text.slice(start, end).trim();
    if (!body) continue;

    if (cur.header.toLowerCase().startsWith("base prompt")) {
      baseCaption = body;
    } else {
      let center = { x: 0.5, y: 0.5 };
      if (cur.coord && cur.coord in POSITION_GRID) {
        center = POSITION_GRID[cur.coord];
        useCoords = true;
      }
      charCaptions.push({ char_caption: body, centers: [center] });
    }
  }

  return {
    baseCaption: baseCaption || text,
    charCaptions,
    useCoords,
  };
}

export function splitInlineNegativesFromCaption(caption: string): {
  cleaned: string;
  negChunks: string[];
} {
  const negChunks: string[] = [];
  let cleaned = caption.replace(
    /(?:,\s*)?(-\d+(?:\.\d+)?)::([\s\S]*?)::/g,
    (fullMatch, lvl: string, rawInner: string) => {
      // Keep gentle fractional counterweights (e.g. -0.45::wide hips::) inside Positive prompt
      if (Math.abs(parseFloat(lvl)) < 1.0) {
        return fullMatch;
      }
      const inner = rawInner.replace(/^[ ,]+|[ ,]+$/g, "");
      if (inner) negChunks.push(inner);
      return "";
    }
  );
  cleaned = cleaned.replace(/\s*,\s*,+/g, ", ");
  cleaned = cleaned.replace(/^\s*,\s*|\s*,\s*$/g, "").trim();
  return { cleaned, negChunks };
}

export function countPromptT5Tokens(rawPrompt: string): TokenCountInfo {
  const { baseCaption, charCaptions } = parseStructuredPrompt(rawPrompt);
  const combinedRaw = [baseCaption, ...charCaptions.map((c) => c.char_caption)].join(" ").trim();
  const { posClean, negParts } = stripInlineNegsKeepingTune2(combinedRaw);

  const posChunks: string[] = [];
  const reWeight = /(-?\d+(?:\.\d+)?)::([\s\S]*?)::/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = reWeight.exec(posClean)) !== null) {
    const before = posClean.slice(last, m.index).trim();
    if (before) posChunks.push(before);
    const w = parseFloat(m[1]);
    const body = m[2].trim();
    if (body && w !== 0) {
      posChunks.push(body);
    }
    last = reWeight.lastIndex;
  }
  const tail = posClean.slice(last).trim();
  if (tail) posChunks.push(tail);

  const posTok =
    posChunks.length > 0 ? posChunks.reduce((acc, c) => acc + encodeT5Len(c), 0) + 1 : 0;
  const cleanInlineNeg = deduplicateCommaTags(negParts.join(", "));
  const inlineNegTok = cleanInlineNeg ? encodeT5Len(cleanInlineNeg) : 0;
  const webBoxTok = posTok + inlineNegTok;
  const heavyUcFull = deduplicateCommaTags(
    cleanInlineNeg ? `${V5_HEAVY_UC_BASE}, ${cleanInlineNeg}` : V5_HEAVY_UC_BASE
  );
  const heavyUcTok = encodeT5Len(heavyUcFull) + 1;

  return {
    web_single_box_tokens: webBoxTok,
    api_pos_tokens: posTok,
    api_neg_tokens: heavyUcTok,
    inline_neg_tokens: inlineNegTok,
    exact_spiece: vocabScores !== null,
  };
}

export function extractPromptBlocksFromPreview(rawText: string): Array<[string, string]> {
  const lines = rawText.split(/\r?\n/);
  const blocks: Array<[string, string[]]> = [];
  let currentTitle = "默认单幕提示词";
  let currentLines: string[] = [];

  for (const line of lines) {
    const stripped = line.trim();
    if (stripped.startsWith("## ")) {
      if (currentLines.length > 0 && currentLines.some((x) => x.trim())) {
        blocks.push([currentTitle, currentLines]);
      }
      currentTitle = stripped.slice(3).replace(/[：: ]+$/g, "");
      currentLines = [];
      continue;
    }
    if (stripped.startsWith("# ") || stripped.startsWith("#==")) {
      continue;
    }
    currentLines.push(line);
  }

  if (currentLines.length > 0 && currentLines.some((x) => x.trim())) {
    blocks.push([currentTitle, currentLines]);
  }

  const out: Array<[string, string]> = [];
  for (const [title, bodyLines] of blocks) {
    const joined = bodyLines.join("\n").trim();
    if (joined) out.push([title, joined]);
  }
  return out;
}

export function extractFirstPromptFromPreview(rawText: string, blockIndex = 0): string {
  const blocks = extractPromptBlocksFromPreview(rawText);
  if (blocks.length === 0) return "";
  const idx = Math.max(0, Math.min(blockIndex, blocks.length - 1));
  return blocks[idx][1];
}

function stripInlineNegsKeepingTune2(text: string): { posClean: string; negParts: string[] } {
  let keptTune2 = "";
  const tune2Re = /(?:,\s*)?(-2\.5::(?:(?!::)[\s\S])*?nose bridge,\s*nostrils,\s*lips(?:(?!::)[\s\S])*?::)/;
  const mTune2 = tune2Re.exec(text);
  let working = text;
  if (mTune2) {
    keptTune2 = mTune2[1].trim();
    working = (
      working.slice(0, mTune2.index) + working.slice(mTune2.index + mTune2[0].length)
    ).replace(/^[ ,]+|[ ,]+$/g, "");
  }
  const split = splitInlineNegativesFromCaption(working);
  let posClean = split.cleaned;
  if (keptTune2) {
    posClean = posClean ? `${posClean.replace(/[, ]+$/g, "")}, ${keptTune2}` : keptTune2;
  }
  return { posClean, negParts: split.negChunks };
}

export function deduplicateCommaTags(raw: string): string {
  const parts = raw
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const lowerAll = new Set(parts.map((p) => p.toLowerCase()));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of parts) {
    const key = t.toLowerCase();
    // Collapse redundant 'oil painting' when canonical 'oil painting (medium)' is already present
    if (key === "oil painting" && lowerAll.has("oil painting (medium)")) continue;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(t);
    }
  }
  return out.join(", ");
}

export function splitPromptPosAndNeg(rawPrompt: string): { posPrompt: string; negPrompt: string } {
  const trimmed = rawPrompt.trim();
  if (!trimmed) return { posPrompt: "", negPrompt: "" };

  if (!trimmed.includes("[Base Prompt]")) {
    const { posClean, negParts } = stripInlineNegsKeepingTune2(trimmed);
    return {
      posPrompt: posClean,
      negPrompt: deduplicateCommaTags(negParts.join(", ")),
    };
  }

  // Structured multi-character prompt ([Base Prompt] + [Character N (Coord)])
  const pattern = /\[(Base Prompt|Character\s*\d+(?:\s*\([A-Ea-e][1-5]\))?)\]\s*:?\s*/gm;
  const matches: Array<{ index: number; end: number; headerRaw: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(trimmed)) !== null) {
    matches.push({
      index: m.index,
      end: pattern.lastIndex,
      headerRaw: `[${m[1]}]`,
    });
  }
  if (matches.length === 0) {
    const { posClean, negParts } = stripInlineNegsKeepingTune2(trimmed);
    return { posPrompt: posClean, negPrompt: deduplicateCommaTags(negParts.join(", ")) };
  }

  const rebuiltSections: string[] = [];
  const allNegParts: string[] = [];
  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i];
    const start = cur.end;
    const end = i + 1 < matches.length ? matches[i + 1].index : trimmed.length;
    const body = trimmed.slice(start, end).trim();
    if (cur.headerRaw.toLowerCase().startsWith("[base prompt")) {
      const { posClean, negParts } = stripInlineNegsKeepingTune2(body);
      allNegParts.push(...negParts);
      rebuiltSections.push(`${cur.headerRaw}\n${posClean}`);
    } else {
      // Preserve per-character inline negatives (-2.5::...::) inside [Character N] so buildNaiGeneratePayload
      // routes them to v4_negative_prompt.caption.char_captions[i] instead of polluting global base_caption UC.
      rebuiltSections.push(`${cur.headerRaw}\n${body}`);
    }
  }
  return {
    posPrompt: rebuiltSections.join("\n\n"),
    negPrompt: deduplicateCommaTags(allNegParts.join(", ")),
  };
}

export function mergePosAndNegToInline(posPrompt: string, negPrompt: string): string {
  const cleanPos = posPrompt.trim();
  const cleanNeg = deduplicateCommaTags(negPrompt);
  if (!cleanNeg) return cleanPos;
  if (!cleanPos) return `-2::${cleanNeg}::`;

  if (!cleanPos.includes("[Base Prompt]")) {
    return `${cleanPos.replace(/[, ]+$/g, "")}, -2::${cleanNeg}::`;
  }

  const nextHeaderIdx = cleanPos.search(/\n\s*\[Character\s*\d+/i);
  if (nextHeaderIdx === -1) {
    return `${cleanPos.replace(/[, ]+$/g, "")}, -2::${cleanNeg}::`;
  }
  const basePart = cleanPos.slice(0, nextHeaderIdx).trimEnd().replace(/[, ]+$/g, "");
  const restPart = cleanPos.slice(nextHeaderIdx);
  return `${basePart}, -2::${cleanNeg}::${restPart}`;
}

export function applySmartQualitySuffix(posCaption: string, appendQuality: boolean): string {
  const trimmed = posCaption.trim();
  if (!trimmed || !appendQuality) return trimmed;
  const lowerCheck = trimmed.replace(/[, ]+$/g, "").toLowerCase();
  const suppressAnimeQuality = [
    "pixel art",
    "raw photo",
    "gravure",
    "2.8::photorealistic::",
    "no lineart",
  ].some((kw) => lowerCheck.includes(kw));
  if (suppressAnimeQuality) return trimmed;
  if (lowerCheck.endsWith(V5_QUALITY_SUFFIX.toLowerCase())) return trimmed;

  const hasMasterpiece = /\bmasterpiece\b/.test(lowerCheck);
  const hasVeryAesthetic = /\bvery aesthetic\b/.test(lowerCheck);
  if (hasMasterpiece && hasVeryAesthetic) {
    if (!/\bno text\b/.test(lowerCheck)) {
      return `${trimmed.replace(/[, ]+$/g, "")}, no text`;
    }
    return trimmed;
  }
  return `${trimmed.replace(/[, ]+$/g, "")}, ${V5_QUALITY_SUFFIX}`;
}

export function buildFullNegativeString(options: {
  posPrompt: string;
  sceneNegPrompt: string;
  ucPresetMode: NaiUcPresetMode;
  extraUc?: string;
}): string {
  const fullPosLower = options.posPrompt.toLowerCase();
  const wantsNsfw = [
    "nsfw",
    "rating:explicit",
    "uncensored",
    "nude",
    "pussy",
    "penis",
    "reverse bunnysuit",
    "pasties",
    "nipples",
    "micro bikini",
  ].some((tag) => fullPosLower.includes(tag));
  const ucParts: string[] = [];
  if (options.ucPresetMode === "heavy") {
    if (!wantsNsfw) ucParts.push("nsfw");
    ucParts.push(V5_HEAVY_UC_BASE);
  } else if (options.ucPresetMode === "light") {
    if (!wantsNsfw) ucParts.push("nsfw");
    ucParts.push(V4_5_LIGHT_UC_BASE);
  } else if (options.ucPresetMode === "human_focus") {
    if (!wantsNsfw) ucParts.push("nsfw");
    ucParts.push(V4_5_HUMAN_FOCUS_UC_BASE);
  }
  const cleanSceneNeg = deduplicateCommaTags(options.sceneNegPrompt);
  if (cleanSceneNeg) ucParts.push(cleanSceneNeg);
  const cleanExtra = (options.extraUc ?? "").trim();
  if (cleanExtra) ucParts.push(cleanExtra);
  return deduplicateCommaTags(ucParts.join(", "));
}

export const V45_BASE_SAFE_POS_TOKENS = 502;
export const V45_TOKENS_PER_VIBE_SLOT = 34;

export function computeSafePosTokenLimit(options?: {
  isV45?: boolean;
  activeVibeCount?: number;
}): number {
  const isV45 = options?.isV45 ?? true;
  const vibeCount = Math.max(0, Math.round(options?.activeVibeCount ?? 0));
  if (!isV45 || vibeCount === 0) {
    return V45_BASE_SAFE_POS_TOKENS;
  }
  return Math.max(300, V45_BASE_SAFE_POS_TOKENS - vibeCount * V45_TOKENS_PER_VIBE_SLOT);
}

export function countSeparatedT5Tokens(options: {
  posPrompt: string;
  sceneNegPrompt: string;
  ucPresetMode: NaiUcPresetMode;
  extraUc?: string;
  appendQuality?: boolean;
}): {
  posTokens: number;
  negTokens: number;
  sceneNegTokens: number;
  exactSpiece: boolean;
} {
  const { baseCaption, charCaptions } = parseStructuredPrompt(options.posPrompt);
  const effectiveBase = applySmartQualitySuffix(baseCaption, options.appendQuality ?? true);
  const rebuiltPos =
    charCaptions.length > 0
      ? `[Base Prompt]\n${effectiveBase}\n` +
        charCaptions.map((c, idx) => `[Character ${idx + 1}]\n${c.char_caption}`).join("\n")
      : effectiveBase;
  const posInfo = countPromptT5Tokens(rebuiltPos);

  const fullNeg = buildFullNegativeString({
    posPrompt: options.posPrompt,
    sceneNegPrompt: options.sceneNegPrompt,
    ucPresetMode: options.ucPresetMode,
    extraUc: options.extraUc,
  });
  const negTokens = fullNeg ? encodeT5Len(fullNeg) + 1 : 0;
  const cleanSceneNeg = deduplicateCommaTags(options.sceneNegPrompt);
  const sceneNegTokens = cleanSceneNeg ? encodeT5Len(cleanSceneNeg) : 0;

  return {
    posTokens: posInfo.api_pos_tokens,
    negTokens,
    sceneNegTokens,
    exactSpiece: vocabScores !== null,
  };
}
