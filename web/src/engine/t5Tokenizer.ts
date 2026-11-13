import { POSITION_GRID, V5_HEAVY_UC_BASE } from "../data/engineConstants";
import { T5_VOCAB_GZIP_B64 } from "../data/t5VocabB64";
import type { TokenCountInfo } from "./types";

let vocabScores: Map<string, number> | null = null;
let maxPieceLen = 16;
let initPromise: Promise<void> | null = null;

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
  })();
  return initPromise;
}

export function isT5TokenizerReady(): boolean {
  return vocabScores !== null;
}

export function encodeT5Len(text: string): number {
  const clean = text.replace(/^[ ,]+|[ ,]+$/g, "");
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

  const normalized = clean.trim().split(/\s+/).join("▁");
  const s = "▁" + normalized;
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
  return dpCount[n];
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
      let center = { x: 0, y: 0 };
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
    (_m, _lvl: string, rawInner: string) => {
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

  const posChunks: string[] = [];
  const negChunks: string[] = [];
  const reWeight = /(-?\d+(?:\.\d+)?)::([\s\S]*?)::/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = reWeight.exec(combinedRaw)) !== null) {
    const before = combinedRaw.slice(last, m.index).replace(/^[ ,]+|[ ,]+$/g, "");
    if (before) posChunks.push(before);
    const w = parseFloat(m[1]);
    const body = m[2].replace(/^[ ,]+|[ ,]+$/g, "");
    if (body) {
      if (w < 0) negChunks.push(body);
      else if (w > 0) posChunks.push(body);
    }
    last = reWeight.lastIndex;
  }
  const tail = combinedRaw.slice(last).replace(/^[ ,]+|[ ,]+$/g, "");
  if (tail) posChunks.push(tail);

  const posTok =
    posChunks.length > 0 ? posChunks.reduce((acc, c) => acc + encodeT5Len(c), 0) + 1 : 0;
  const inlineNegTok = negChunks.reduce((acc, c) => acc + encodeT5Len(c), 0);
  const webBoxTok = posTok + inlineNegTok;
  const heavyUcTok = encodeT5Len(V5_HEAVY_UC_BASE) + inlineNegTok + 1;

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
