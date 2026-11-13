import {
  ALL_POSITIONS_CHAPTERS,
  ALL_POSITIONS_TEMPLATES,
  BODY_PRESETS,
  BUILTIN_CHARACTERS,
  BUST_PRESETS,
  CAMERA_GAZE_PRESETS,
  CAMERA_SHOT_PRESETS,
  EXPR_BLUSH_CONFLICT_TAGS,
  EXPR_BLUSH_TAGS,
  EXPR_EYE_CONFLICT_TAGS,
  EXPR_EYE_TAGS,
  EXPR_MOUTH_CONFLICT_TAGS,
  EXPR_MOUTH_TAGS,
  EXPRESSION_BLUSH_PRESETS,
  EXPRESSION_EYE_PRESETS,
  EXPRESSION_MOUTH_PRESETS,
  EXPRESSION_PRESETS,
  LEGWEAR_PRESETS,
  MORPH_PRESETS,
  MULTI_ANGLE_CHAPTERS,
  MULTI_ANGLE_TEMPLATES,
  OUTFIT_PRESETS,
  OUTFIT_STATE_PRESETS,
  PIGMENT_PRESETS,
  POS_MALE_MODE_PRESETS,
  POS_STAGE_PRESETS,
  PUBIC_PRESETS,
  QUALITY_TAGS,
  SKIN_PRESETS,
  STORY_CHAPTERS,
  STYLE_PRESETS,
} from "../data/engineConstants";
import { applyCameraOverrideToPrompt, describeCameraShort } from "./cameraRig";
import type { CharacterConfig, PerspectiveMode, ScenePromptItem } from "./types";

export function sanitizeStyleForTransparentBg(headPos: string): string {
  if (!headPos) return "";
  const blocked = new Set(["photo background", "depth of field", "bokeh", "hazy"]);
  const kept: string[] = [];
  for (const rawT of headPos.split(",")) {
    const t = rawT.trim();
    if (!t) continue;
    const bare = t.replace(/^-?\d+(?:\.\d+)?::|::$/g, "").trim().toLowerCase();
    if (blocked.has(bare)) continue;
    kept.push(t);
  }
  return kept.join(", ");
}

export function scaleWeight(baseWeight: number, factor: number): string {
  const val = Number(Math.max(0.45, Math.min(2.2, baseWeight * factor)).toFixed(2));
  if (Math.abs(val - 1.0) < 0.04) return "";
  return String(val);
}

export function wtag(tag: string, baseWeight: number, factor = 1.0): string {
  const w = scaleWeight(baseWeight, factor);
  return w ? `${w}::${tag}::` : tag;
}

export function joinTags(...parts: Array<string | undefined | null>): string {
  const tokens: string[] = [];
  for (const p of parts) {
    if (!p) continue;
    const cleaned = p.trim().replace(/^,+|,+$/g, "");
    if (cleaned) {
      tokens.push(cleaned);
    }
  }
  return tokens.join(", ");
}

export function wrapNeg(level: string, tagsStr: string, enabled: boolean): string {
  if (!enabled) return "";
  const cleaned = tagsStr.trim().replace(/^,+|,+$/g, "");
  return cleaned ? `${level}::${cleaned}::` : "";
}

export function wrapTailNeg(m: Record<string, string>, tagsStr: string, enabled: boolean): string {
  const baseNeg = wrapNeg("-2", tagsStr, enabled);
  const tune2Inline = m.tune2_inline_neg || "";
  if (enabled && tune2Inline) {
    const tune2Block = wrapNeg("-2.5", tune2Inline, true);
    return joinTags(baseNeg, tune2Block);
  }
  return baseNeg;
}

export function isFigureStyleActive(cfg: CharacterConfig): boolean {
  if (!cfg.enable_style) return false;
  if (
    cfg.style_preset.includes("手办") ||
    cfg.style_preset.includes("Figurine") ||
    cfg.style_preset.includes("PVC")
  ) {
    return true;
  }
  if (cfg.style_preset === "自定义画风（使用下方自定义画风框）") {
    const low = cfg.custom_style_pos.toLowerCase();
    return low.includes("figure") || low.includes("figurine");
  }
  return false;
}

export function isGlossyFigureStyleActive(cfg: CharacterConfig): boolean {
  if (!isFigureStyleActive(cfg)) return false;
  if (cfg.style_preset.includes("高光亮油") || cfg.style_preset.includes("Glossy")) {
    return true;
  }
  if (cfg.style_preset === "自定义画风（使用下方自定义画风框）") {
    const low = cfg.custom_style_pos.toLowerCase();
    return low.includes("shiny skin") || low.includes("glossy");
  }
  return false;
}

export function isPixelStyleActive(cfg: CharacterConfig): boolean {
  if (!cfg.enable_style) return false;
  if (
    cfg.style_preset.includes("像素") ||
    cfg.style_preset.includes("Sprite") ||
    cfg.style_preset.includes("点阵")
  ) {
    return true;
  }
  if (cfg.style_preset === "自定义画风（使用下方自定义画风框）") {
    const low = cfg.custom_style_pos.toLowerCase();
    return low.includes("pixel art") || low.includes("pixelated") || low.includes("dot art");
  }
  return false;
}

export function isC5LowresPixelStyleActive(cfg: CharacterConfig): boolean {
  if (!isPixelStyleActive(cfg)) return false;
  return cfg.style_preset.includes("C5") || cfg.style_preset.includes("小画布直出");
}

export function isM6SoftMorningSkinActive(cfg: CharacterConfig): boolean {
  if (!cfg.enable_style) return false;
  return cfg.style_preset.includes("M6") || cfg.style_preset.includes("无描边暖杏真肤");
}

const EXPR_EYE_CONFLICT_SET = new Set(EXPR_EYE_CONFLICT_TAGS);
const EXPR_MOUTH_CONFLICT_SET = new Set(EXPR_MOUTH_CONFLICT_TAGS);
const EXPR_BLUSH_CONFLICT_SET = new Set(EXPR_BLUSH_CONFLICT_TAGS);

export interface CompiledExpressionOverride {
  active: boolean;
  pos_tags_str: string;
  eyes_open: boolean;
  neg_add: string[];
  neg_unblock: Set<string>;
  prose_clause: string;
  short_label: string;
}

function stripExprTagList(tagsStr: string, conflictSet: Set<string>): string[] {
  const out: string[] = [];
  for (const rawT of tagsStr.split(",")) {
    const t = rawT.trim();
    if (!t) continue;
    const bare = t.replace(/^\d+(?:\.\d+)?::([\s\S]+?)::$/, "$1").trim().toLowerCase();
    if (conflictSet.has(bare)) continue;
    if (!out.includes(t)) out.push(t);
  }
  return out;
}

export function isExpressionOverrideActive(cfg: CharacterConfig): boolean {
  if (!cfg.enable_expression) return false;
  const presetInfo = EXPRESSION_PRESETS[cfg.expr_preset];
  const presetCode = presetInfo?.code || "auto";
  const eyeCode = EXPRESSION_EYE_PRESETS[cfg.expr_eye_state] ?? "auto";
  const mouthCode = EXPRESSION_MOUTH_PRESETS[cfg.expr_mouth_state] ?? "auto";
  const blushCode = EXPRESSION_BLUSH_PRESETS[cfg.expr_brow_blush] ?? "auto";
  return Boolean(
    (presetCode !== "auto" && presetCode !== "custom_only" && Boolean(presetInfo?.tags)) ||
      eyeCode !== "auto" ||
      mouthCode !== "auto" ||
      blushCode !== "auto" ||
      cfg.expr_heart_eyes ||
      cfg.expr_empty_eyes ||
      cfg.expr_tears ||
      cfg.custom_expression_tags.trim()
  );
}

export function describeExpressionShort(cfg: CharacterConfig): string {
  if (!cfg.enable_expression) return "🚫 模块已关闭";
  if (!isExpressionOverrideActive(cfg)) return "🔄 随本幕默认";
  const parts: string[] = [];
  const presetInfo = EXPRESSION_PRESETS[cfg.expr_preset];
  const presetCode = presetInfo?.code || "auto";
  if (presetCode !== "auto" && presetCode !== "custom_only" && presetInfo) {
    parts.push(presetInfo.short);
  } else if (presetCode === "custom_only") {
    parts.push("✏️ 自定义");
  }

  const eyeCode = EXPRESSION_EYE_PRESETS[cfg.expr_eye_state] ?? "auto";
  const mouthCode = EXPRESSION_MOUTH_PRESETS[cfg.expr_mouth_state] ?? "auto";
  const blushCode = EXPRESSION_BLUSH_PRESETS[cfg.expr_brow_blush] ?? "auto";
  if (eyeCode !== "auto") parts.push(`眼:${cfg.expr_eye_state.split(" (")[0]}`);
  if (mouthCode !== "auto") parts.push(`嘴:${cfg.expr_mouth_state.split(" (")[0]}`);
  if (blushCode !== "auto") parts.push(cfg.expr_brow_blush.split(" (")[0]);
  if (cfg.expr_heart_eyes) parts.push("💖爱心瞳");
  if (cfg.expr_empty_eyes) parts.push("🖤空洞瞳");
  if (cfg.expr_tears) parts.push("😭流泪");
  if (cfg.custom_expression_tags.trim()) parts.push("➕自定义Tag");
  return parts.length > 0 ? parts.join(" · ") : "✏️ 自定义表情";
}

export function compileExpressionOverride(
  cfg: CharacterConfig,
  sceneId = ""
): CompiledExpressionOverride {
  const inactive: CompiledExpressionOverride = {
    active: false,
    pos_tags_str: "",
    eyes_open: true,
    neg_add: [],
    neg_unblock: new Set<string>(),
    prose_clause: "",
    short_label: "🔄 随本幕默认",
  };
  if (sceneId === "MA0") return inactive;
  if ((sceneId === "S06" || sceneId === "S07") && !cfg.expr_override_sleeping) {
    return inactive;
  }
  if (!isExpressionOverrideActive(cfg)) return inactive;

  const presetInfo = EXPRESSION_PRESETS[cfg.expr_preset];
  const presetCode = presetInfo?.code || "auto";
  const eyeCode = EXPRESSION_EYE_PRESETS[cfg.expr_eye_state] ?? "auto";
  const mouthCode = EXPRESSION_MOUTH_PRESETS[cfg.expr_mouth_state] ?? "auto";
  const blushCode = EXPRESSION_BLUSH_PRESETS[cfg.expr_brow_blush] ?? "auto";

  const m6On = isM6SoftMorningSkinActive(cfg);
  const figOn = isFigureStyleActive(cfg);

  const rawBaseTags =
    presetInfo && presetCode !== "auto" && presetCode !== "custom_only" ? presetInfo.tags || "" : "";
  let tokens: string[] = [];
  if (rawBaseTags) {
    for (const rawT of rawBaseTags.split(",")) {
      let t = rawT.trim();
      if (!t) continue;
      if ((figOn || m6On) && (t.includes("floating heart") || t.includes("sweatdrop"))) {
        continue;
      }
      if (m6On) {
        if (t.includes("bedroom eyes")) {
          t = "shy";
        } else if (t.includes("seductive smile")) {
          t = "furrowed brow";
        } else if (t === "parted lips") {
          t = "open mouth";
        } else if (t.includes("half-closed eyes") && eyeCode === "auto") {
          t = "0.85::half-closed eyes::";
        }
      }
      if (!tokens.includes(t)) tokens.push(t);
    }
  }

  if (eyeCode !== "auto") {
    tokens = stripExprTagList(tokens.join(", "), EXPR_EYE_CONFLICT_SET);
    for (const et of (EXPR_EYE_TAGS[eyeCode] || "").split(",")) {
      const s = et.trim();
      if (s && !tokens.includes(s)) tokens.push(s);
    }
  }

  if (mouthCode !== "auto") {
    tokens = stripExprTagList(tokens.join(", "), EXPR_MOUTH_CONFLICT_SET);
    for (const mt of (EXPR_MOUTH_TAGS[mouthCode] || "").split(",")) {
      const s = mt.trim();
      if (s && !tokens.includes(s)) tokens.push(s);
    }
  }

  if (blushCode !== "auto") {
    tokens = stripExprTagList(tokens.join(", "), EXPR_BLUSH_CONFLICT_SET);
    for (const bt of (EXPR_BLUSH_TAGS[blushCode] || "").split(",")) {
      const s = bt.trim();
      if (s && !tokens.includes(s)) tokens.push(s);
    }
  }

  if (cfg.expr_heart_eyes) {
    for (const ht of ["1.3::heart-shaped pupils::", "heart in eye"]) {
      if (!tokens.includes(ht)) tokens.push(ht);
    }
  }
  if (cfg.expr_empty_eyes) {
    for (const et of ["1.3::empty eyes::", "no eye highlights"]) {
      if (!tokens.includes(et)) tokens.push(et);
    }
  }
  if (cfg.expr_tears) {
    for (const tt of ["1.25::tears::", "crying", "teardrops", "watery eyes"]) {
      if (!tokens.includes(tt)) tokens.push(tt);
    }
  }

  const customStr = cfg.custom_expression_tags.trim();
  if (customStr) {
    for (const ct of customStr.split(",")) {
      const s = ct.trim();
      if (s && !tokens.includes(s)) tokens.push(s);
    }
  }

  const posTagsStr = tokens.join(", ");
  const lowBare = new Set(
    tokens.map((t) => t.replace(/^\d+(?:\.\d+)?::([\s\S]+?)::$/, "$1").trim().toLowerCase())
  );
  const eyesOpen = !(lowBare.has("closed eyes") || lowBare.has("sleeping"));

  const negUnblock = new Set<string>();
  const negAdd: string[] = [];
  if (eyesOpen) {
    negUnblock.add("open eyes");
    negUnblock.add("half-closed eyes");
    negUnblock.add("looking at viewer");
    negAdd.push("closed eyes", "sleeping");
  } else {
    negUnblock.add("closed eyes");
    negUnblock.add("sleeping");
    negUnblock.add("sleep");
    negAdd.push("open eyes", "half-closed eyes");
  }

  if (lowBare.has("ahegao")) negUnblock.add("ahegao");
  if (lowBare.has("tongue out") || lowBare.has(":p")) negUnblock.add("tongue out");
  if (lowBare.has("wide-eyed")) negUnblock.add("wide-eyed");
  if (lowBare.has("rolling eyes")) negUnblock.add("rolling eyes");
  if (lowBare.has("no blush")) negAdd.push("blush", "heavy blush");
  if (lowBare.has("closed mouth")) negAdd.push("open mouth", "tongue out");

  let proseClause =
    presetInfo && presetCode !== "auto" && presetCode !== "custom_only" ? presetInfo.prose || "" : "";
  const extraProse: string[] = [];
  if (eyeCode === "closed") extraProse.push("closed eyes");
  else if (eyeCode === "wink") extraProse.push("one eye winking playfully");
  else if (eyeCode === "wide") extraProse.push("wide eyes");
  else if (eyeCode === "rolling") extraProse.push("rolling eyes");
  else if (eyeCode === "jitome") extraProse.push("half-lidded unimpressed stare");
  else if (eyeCode === "half_closed" && !proseClause.includes("half-closed")) {
    extraProse.push("half-closed eyes");
  } else if (eyeCode === "open" && proseClause.includes("closed eyes")) {
    proseClause = proseClause.replace("with peaceful closed eyes", "with open eyes");
  }

  if (mouthCode === "closed") extraProse.push("closed lips");
  else if (mouthCode === "parted") extraProse.push("softly parted mouth");
  else if (mouthCode === "open_pant") extraProse.push("an open panting mouth");
  else if (mouthCode === "smile") extraProse.push("a gentle smile");
  else if (mouthCode === "smug_grin") extraProse.push("a teasing smirk");
  else if (mouthCode === "playful_tongue" || mouthCode === "drool_tongue") {
    extraProse.push("tongue sticking out");
  } else if (mouthCode === "bite_lip") extraProse.push("biting her lower lip");
  else if (mouthCode === "pout") extraProse.push("a cute pout");

  if (cfg.expr_heart_eyes) extraProse.push("heart-shaped pupils");
  if (cfg.expr_empty_eyes) extraProse.push("dull empty eyes");
  if (cfg.expr_tears) extraProse.push("tears streaming down her cheeks");

  if (!proseClause && extraProse.length > 0) {
    proseClause = `with ${extraProse.join(", ")}`;
  } else if (proseClause && extraProse.length > 0) {
    proseClause = `${proseClause} and ${extraProse.join(", ")}`;
  }

  return {
    active: Boolean(posTagsStr),
    pos_tags_str: posTagsStr,
    eyes_open: eyesOpen,
    neg_add: negAdd,
    neg_unblock: negUnblock,
    prose_clause: proseClause,
    short_label: describeExpressionShort(cfg),
  };
}

export function applyExpressionToPrompt(
  promptStr: string,
  exprCtrl: CompiledExpressionOverride,
  applyProse: boolean,
  enableNegatives: boolean
): string {
  if (!promptStr || promptStr.startsWith("[Base Prompt]") || !exprCtrl.active) {
    return promptStr;
  }

  const negUnblock = exprCtrl.neg_unblock;
  const negAdd = exprCtrl.neg_add;
  const eyesOpen = exprCtrl.eyes_open;
  const proseClause = exprCtrl.prose_clause || "";

  let mainNegTokens: string[] | null = null;
  const extraNegBlocks: string[] = [];

  let posOnly = promptStr
    .replace(/(?:,\s*)?(-\d+(?:\.\d+)?)::([\s\S]*?)::/g, (_m, lvl: string, rawBody: string) => {
      const body = rawBody.replace(/^[ ,]+|[ ,]+$/g, "");
      if (body.includes("nose bridge, nostrils, lips")) {
        extraNegBlocks.push(`${lvl}::${body}::`);
        return "";
      }
      const subTokens = body
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const filtered = subTokens.filter((t) => !negUnblock.has(t.toLowerCase()));
      if (lvl === "-2" && mainNegTokens === null) {
        mainNegTokens = filtered;
      } else if (filtered.length > 0) {
        extraNegBlocks.push(`${lvl}::${filtered.join(", ")}::`);
      }
      return "";
    })
    .replace(/^[ ,]+|[ ,]+$/g, "");

  if (!eyesOpen) {
    posOnly = posOnly.replace(/(?:,\s*)?\blooking at viewer\b/g, "");
    posOnly = posOnly.replace(/^\s*,\s*/, "");
  }

  if (applyProse && proseClause && posOnly.trimEnd().endsWith(".")) {
    let replaced = false;
    const proseSubs: Array<[RegExp, string]> = [
      [/\bwhile gazing shyly at the viewer\b/g, proseClause],
      [/\bwith a relaxed cheerful smile\b/g, proseClause],
      [/\bwith a cheerful expression\b/g, proseClause],
      [/\band gazing gently at the viewer\b/g, `and looking at the viewer ${proseClause}`],
      [/\bgazing gently at the viewer\b/g, `looking at the viewer ${proseClause}`],
      [/\band gazing curiously at the viewer\b/g, `and looking at the viewer ${proseClause}`],
      [/\bgazing curiously at the viewer\b/g, `looking at the viewer ${proseClause}`],
      [/\blooking up gently at the viewer\b/g, `looking up at the viewer ${proseClause}`],
      [/\bgazing drowsily down\b/g, `looking down ${proseClause}`],
      [/\bwith drowsy half-closed eyes\b/g, proseClause],
      [/\bwith closed eyes\b/g, proseClause],
    ];
    for (const [pat, rep] of proseSubs) {
      if (pat.test(posOnly)) {
        posOnly = posOnly.replace(pat, rep);
        replaced = true;
      }
    }
    if (!replaced && !posOnly.includes(proseClause)) {
      const trimmed = posOnly.trimEnd();
      posOnly = trimmed.slice(0, -1) + `, ${proseClause}.`;
    }
  }

  const outParts = posOnly ? [posOnly] : [];
  if (enableNegatives) {
    if (mainNegTokens === null && negAdd.length > 0) {
      mainNegTokens = [];
    }
    if (mainNegTokens !== null) {
      const tokensArr: string[] = mainNegTokens;
      const lowerExisting = new Set(tokensArr.map((t) => t.toLowerCase()));
      for (let i = negAdd.length - 1; i >= 0; i--) {
        const na = negAdd[i];
        const lowNa = na.toLowerCase();
        if (!lowerExisting.has(lowNa) && !negUnblock.has(lowNa)) {
          tokensArr.unshift(na);
          lowerExisting.add(lowNa);
        }
      }
      if (tokensArr.length > 0) {
        outParts.push(`-2::${tokensArr.join(", ")}::`);
      }
    }
  }
  outParts.push(...extraNegBlocks);
  return outParts.join(", ");
}

export function exprIf(cfg: CharacterConfig, tags: string, essential = "", sceneId = ""): string {
  const overrideCtrl = compileExpressionOverride(cfg, sceneId);
  if (overrideCtrl.active) {
    return overrideCtrl.pos_tags_str;
  }
  const m6On = isM6SoftMorningSkinActive(cfg);
  let cleanEss = essential;
  if (m6On && cleanEss) {
    cleanEss = cleanEss.replace(/(?:\d+(?:\.\d+)?::)?half-closed eyes(?:::)?/g, "0.85::half-closed eyes::");
  }
  if (!cfg.enable_expression) {
    return cleanEss;
  }
  let cleanedTags = tags;
  if (isFigureStyleActive(cfg) || m6On) {
    const outTokens: string[] = [];
    for (const rawT of tags.split(",")) {
      let t = rawT.trim();
      if (!t || t.includes("floating heart") || t.includes("sweatdrop")) {
        continue;
      }
      if (m6On) {
        if (t.includes("bedroom eyes")) {
          t = "shy";
        } else if (t.includes("seductive smile")) {
          t = "furrowed brow";
        } else if (t === "parted lips") {
          t = "open mouth";
        } else if (t.includes("half-closed eyes")) {
          t = "0.85::half-closed eyes::";
        }
      }
      if (!outTokens.includes(t)) {
        outTokens.push(t);
      }
    }
    cleanedTags = outTokens.join(", ");
  }
  return joinTags(cleanEss, cleanedTags);
}

export function proseIf(cfg: CharacterConfig, text: string, transparentBg = false): string {
  if (!cfg.enable_t5_prose) return "";
  const body = text.trim();
  if (!body) return "";
  if (isC5LowresPixelStyleActive(cfg)) {
    return (
      "Low-resolution retro pixel art game CG upscaled with nearest-neighbor scaling, " +
      `large visible square pixels, stepped jagged pixel outlines, crosshatch dithering, zero anti-aliasing: ${body}`
    );
  }
  if (isPixelStyleActive(cfg)) {
    return (
      "Authentic 16-bit pixel art game CG drawn with chunky visible square pixels, " +
      `stepped pixel-grid outlines, and checkerboard dithering: ${body}`
    );
  }
  if (isM6SoftMorningSkinActive(cfg)) {
    const m6Body = body.replaceAll("her lips", "her mouth");
    const lightClause = transparentBg
      ? "Warm morning frontal light, "
      : "Warm morning frontal light by cream sheer curtains, ";
    return (
      `${lightClause}` +
      "lineless rosy-apricot skin with smooth 3D shading, " +
      `flat 2D moe anime face with big eyes and dot nose: ${m6Body}`
    );
  }
  if (isGlossyFigureStyleActive(cfg)) {
    return (
      "DSLR macro photo of a glossy clear-coated painted PVC scale figurine under studio spotlights, " +
      `with sharp white plastic reflections on molded hair, lacquered skin, rigid PVC clothes, and glossy resin fluids: ${body}`
    );
  }
  if (isFigureStyleActive(cfg)) {
    const bgClause = transparentBg ? "" : " with shallow depth of field and bokeh";
    return `Macro product photo of a painted PVC scale figurine${bgClause}: ${body}`;
  }
  return body;
}

export function buildCommonModules(
  cfg: CharacterConfig,
  eyesOpen: boolean,
  isSleepDisheveled = false
): Record<string, string> {
  const pixelMode = isPixelStyleActive(cfg);
  const m6Mode = isM6SoftMorningSkinActive(cfg);
  let qualPos: string;
  if (!cfg.enable_quality || pixelMode) {
    qualPos = "";
  } else if (m6Mode) {
    qualPos = "masterpiece, best quality, absurdres, year 2025";
  } else {
    qualPos = QUALITY_TAGS;
  }

  let styleOnlyPos = "";
  let styleNeg = "";
  if (cfg.enable_style) {
    if (cfg.style_preset === "自定义画风（使用下方自定义画风框）") {
      styleOnlyPos = cfg.custom_style_pos.trim();
      styleNeg = cfg.custom_style_neg.trim();
    } else {
      const st =
        STYLE_PRESETS[cfg.style_preset] ??
        STYLE_PRESETS["137_128 锋利钢笔水彩空气感逆光（原版默认）"];
      styleOnlyPos = st[0];
      styleNeg = st[1];
    }
  }
  const headPos = joinTags(qualPos, styleOnlyPos);

  const outfitInfo =
    OUTFIT_PRESETS[cfg.outfit_preset] ??
    OUTFIT_PRESETS["宽松滑肩白T恤·下身真空（故事线默认）"];
  const outfitKind = outfitInfo.kind || "preset";
  const allowCanon = outfitInfo.allow_canon === "1" || Boolean(cfg.keep_canon_elements);

  const builtinEntry = BUILTIN_CHARACTERS[cfg.preset_name];
  const matchedBuiltin =
    builtinEntry && cfg.char_tag.trim() === (builtinEntry.char_tag || "").trim()
      ? builtinEntry
      : null;

  const hasExplicitCanon = Boolean(
    matchedBuiltin && (matchedBuiltin.canon_outfit || matchedBuiltin.canon_top_only)
  );

  let charId = "";
  let eyeTag = "";
  let hairTag = "";
  let engName = "the girl";
  let rawCanonNeg = "";

  if (cfg.enable_identity) {
    const rawCid = cfg.char_tag.trim();
    if (rawCid && m6Mode && rawCid !== "original" && !rawCid.includes("::")) {
      if (!allowCanon || hasExplicitCanon || (outfitKind !== "canon_full" && outfitKind !== "canon_top")) {
        charId = `0.85::${rawCid}::`;
      } else {
        charId = `0.9::${rawCid}::`;
      }
    } else {
      charId = rawCid || "original";
    }

    eyeTag = eyesOpen ? cfg.eye_color.trim() : "";
    if (m6Mode && eyesOpen) {
      if (eyeTag === "purple eyes") {
        eyeTag = "tareme, blue-purple eyes";
      } else if (!eyeTag.includes("tareme")) {
        eyeTag = joinTags("tareme", eyeTag);
      }
    }

    hairTag = cfg.hair_tags.trim();
    if (m6Mode && hairTag) {
      if (hairTag.includes("short purple hair")) {
        hairTag = hairTag.replace(
          "short purple hair",
          "1.3::light purple hair::, grey-tinted hair, short hair"
        );
      } else if (hairTag.includes("purple hair")) {
        hairTag = hairTag.replace("purple hair", "1.3::light purple hair::, grey-tinted hair");
      } else if (
        !["grey-tinted hair", "grey hair", "white hair", "silver hair"].some((c) =>
          hairTag.includes(c)
        )
      ) {
        hairTag = joinTags(hairTag, "grey-tinted hair");
      }
    }
    if (isSleepDisheveled && !hairTag.includes("disheveled hair")) {
      hairTag = joinTags(hairTag, "disheveled hair");
    }
    engName = cfg.eng_name.trim() || "the girl";
    rawCanonNeg = cfg.canon_neg_tags.trim();
  }

  const wantsSweatM6 =
    cfg.add_extra_sweat || (SKIN_PRESETS[cfg.skin_preset] || "").includes("shiny skin");
  if (m6Mode && wantsSweatM6 && styleNeg) {
    for (const wTag of ["shiny ass, ", "light spots, ", "wet clothes, "]) {
      styleNeg = styleNeg.replaceAll(wTag, "");
    }
  }

  let bodyPos = "";
  let bodyFullPos = "";
  let bodyFullNeg = "";
  if (cfg.enable_body) {
    let bodyNeg: string;
    [bodyPos, bodyNeg] = BODY_PRESETS[cfg.body_preset] ?? [
      "slender, petite",
      "plump, thick thighs",
    ];
    if (m6Mode) {
      if (cfg.body_preset.includes("纤细娇小")) {
        bodyPos = "1.3::slender::, 1.3::petite::, narrow hips, small ass";
        bodyNeg =
          "plump, thick thighs, wide hips, big ass, huge ass, curvy, voluptuous, mature female";
      } else if (cfg.body_preset.includes("匀称修长少女")) {
        bodyPos = "1.25::slender::, narrow waist, long legs";
        bodyNeg = "plump, obese";
      }
    }
    const [bustPos, bustNeg] = BUST_PRESETS[cfg.bust_preset] ?? ["", ""];
    const skinPos = SKIN_PRESETS[cfg.skin_preset] ?? "";
    const extras: string[] = [];
    if (cfg.add_cat_ears) extras.push("cat ears, animal ears, animal ear fluff");
    if (cfg.add_horns_tail) extras.push("demon horns, demon tail");
    if (cfg.add_glasses) extras.push("glasses, semi-rimless glasses");
    if (cfg.add_choker) extras.push("choker, black choker");
    if (cfg.add_extra_sweat) extras.push("sweatdrop, flying sweatdrops, steam");
    if (cfg.extra_char_tags.trim()) extras.push(cfg.extra_char_tags.trim());

    bodyFullPos = joinTags(bodyPos, bustPos, skinPos, extras.join(", "));
    bodyFullNeg = joinTags(bodyNeg, bustNeg);
  }

  const charRest = joinTags(eyeTag, hairTag, bodyFullPos);
  const charCore = joinTags(charId, charRest);

  const customOutfit = cfg.custom_outfit_tags.trim();
  let designIntact = "";
  let designPos = "";
  let outfitProseClause = "";
  let frontShirtProse = "";

  if (cfg.enable_outfit) {
    if (outfitKind === "canon_full") {
      designIntact = joinTags("clothed", customOutfit);
      outfitProseClause = customOutfit ? ` below ${customOutfit}` : "";
      frontShirtProse = customOutfit ? ` wearing ${customOutfit}` : "";
    } else if (outfitKind === "canon_top") {
      designIntact = customOutfit;
      outfitProseClause = customOutfit ? ` below ${customOutfit}` : " below her lifted top";
      frontShirtProse = customOutfit ? ` wearing ${customOutfit}` : "";
    } else if (outfitKind === "custom") {
      designIntact = customOutfit;
      outfitProseClause = customOutfit ? ` below ${customOutfit}` : " below her outfit";
      frontShirtProse = customOutfit ? ` wearing ${customOutfit}` : " in her outfit";
    } else if (outfitKind === "nude") {
      designIntact = outfitInfo.design_tags;
      outfitProseClause = ` below ${outfitInfo.prose}`;
      frontShirtProse = " completely nude";
    } else {
      designIntact = joinTags(outfitInfo.design_tags, customOutfit);
      if (m6Mode && !wantsSweatM6) {
        designIntact = designIntact
          .replace(/(?:,\s*)?wet clothes(?=\s*,|$)/g, "")
          .replace(/^[ ,]+|[ ,]+$/g, "");
      }
      outfitProseClause = ` below ${outfitInfo.prose}`;
      if (cfg.outfit_preset === "宽松滑肩白T恤·下身真空（故事线默认）") {
        frontShirtProse = " in an off-shoulder oversized white t-shirt";
      } else {
        frontShirtProse = ` wearing ${outfitInfo.intact_prose || outfitInfo.prose}`;
      }
    }

    designPos =
      isSleepDisheveled && outfitInfo.sleep_extra
        ? joinTags(designIntact, outfitInfo.sleep_extra)
        : designIntact;
  }

  const rawBottom = outfitInfo.bottom_type || "none";
  const dLow = designIntact.toLowerCase();
  let bottomType: string;
  if (outfitKind === "nude") {
    bottomType = "nude";
  } else if (outfitKind === "canon_full") {
    if (["shorts", "pants", "jeans"].some((k) => dLow.includes(k))) {
      bottomType = "shorts";
    } else if (["leotard", "bodysuit"].some((k) => dLow.includes(k))) {
      bottomType = "leotard";
    } else if (["bikini", "swimsuit"].some((k) => dLow.includes(k))) {
      bottomType = "swimsuit";
    } else {
      bottomType = "skirt";
    }
  } else if (rawBottom === "auto" && outfitKind !== "custom") {
    if (["leotard", "bodysuit"].some((k) => dLow.includes(k))) {
      bottomType = "leotard";
    } else if (["bikini", "swimsuit"].some((k) => dLow.includes(k))) {
      bottomType = "swimsuit";
    } else if (["shorts", "pants", "jeans"].some((k) => dLow.includes(k))) {
      bottomType = "shorts";
    } else if (["skirt", "dress", "serafuku", "maid", "panties", "underwear"].some((k) => dLow.includes(k))) {
      bottomType = "skirt";
    } else {
      bottomType = "none";
    }
  } else {
    bottomType = rawBottom;
  }

  const reqState = OUTFIT_STATE_PRESETS[cfg.outfit_state_mode] ?? "auto";
  let effState: string;
  if (!cfg.enable_clothing_state || reqState === "intact") {
    effState = "intact";
  } else if (outfitKind === "nude") {
    effState = "nude";
  } else if (outfitKind === "custom" && reqState === "auto") {
    effState = "intact";
  } else if (reqState === "auto") {
    effState = ["skirt", "shorts", "leotard", "swimsuit", "skirt_or_canon"].includes(bottomType)
      ? "keep_bottom_aside"
      : "bottomless";
  } else {
    effState = reqState;
  }

  let statePos: string;
  if (effState === "intact") {
    statePos = "";
  } else if (effState === "nude") {
    statePos = "nude";
  } else if (effState === "keep_bottom_aside") {
    if (bottomType === "leotard") {
      statePos = "clothes lift, leotard aside";
    } else if (bottomType === "swimsuit") {
      statePos = "bikini aside, swimsuit aside";
    } else if (bottomType === "shorts") {
      statePos = "unbuttoned, open shorts, panties aside";
    } else {
      statePos = "clothes lift, skirt lift, panties aside";
    }
  } else if (effState === "half_off") {
    if (bottomType === "shorts") {
      statePos = "disheveled clothes, open clothes, open shorts, panties around one leg";
    } else if (["skirt", "leotard", "swimsuit", "skirt_or_canon"].includes(bottomType)) {
      statePos = "disheveled clothes, open clothes, skirt lift, panties around one leg";
    } else {
      statePos = "disheveled clothes, open clothes, clothes lift, bottomless, panties around one leg";
    }
  } else {
    statePos = "clothes lift, bottomless, no panties";
  }

  const seenO = new Set<string>();
  const dedupO: string[] = [];
  for (const t of joinTags(designPos, statePos)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)) {
    if (!seenO.has(t.toLowerCase())) {
      seenO.add(t.toLowerCase());
      dedupO.push(t);
    }
  }
  const outfitPos = dedupO.join(", ");
  const outfitIntact = designIntact;
  const outfitUpperOral =
    (effState === "intact" || effState === "keep_bottom_aside") &&
    ["skirt", "shorts", "leotard", "swimsuit", "skirt_or_canon"].includes(bottomType)
      ? outfitIntact
      : outfitPos;

  let canonNeg: string;
  if (!cfg.enable_identity) {
    canonNeg = "";
  } else if (
    outfitKind === "canon_top" &&
    !cfg.keep_canon_elements &&
    (effState === "bottomless" || effState === "half_off")
  ) {
    canonNeg = matchedBuiltin?.canon_bottom_neg || "skirt, pants, shorts";
  } else if (allowCanon) {
    canonNeg = "";
  } else {
    canonNeg = rawCanonNeg;
  }

  const isBareMidriffCanon = ["crop top", "navel", "bikini", "midriff"].some((k) => dLow.includes(k));
  const isDressOrBodysuit =
    ["dress", "leotard", "bodysuit", "nightgown"].some((k) => dLow.includes(k)) ||
    (outfitKind === "canon_full" && matchedBuiltin === null);
  const coversMidriff = Boolean(
    cfg.enable_outfit &&
      effState !== "nude" &&
      effState !== "bottomless" &&
      isDressOrBodysuit &&
      !isBareMidriffCanon
  );

  const bellyTags = coversMidriff ? "" : "midriff, stomach, navel";
  const bellyTagsS0611 = coversMidriff ? "stomach" : "midriff, stomach, navel";
  const stomachRemTag = coversMidriff ? "cum on clothes" : "cum on stomach";
  const stomachRemProse = coversMidriff
    ? ` on her outfit${outfitProseClause}`
    : " on her bare lower stomach";
  const stomachPoolProse = coversMidriff
    ? ", exposing thick white cum soaking her outfit and thighs"
    : `, exposing a thick pool of white cum resting on her bare lower stomach and navel${outfitProseClause}`;

  const frontDesign =
    cfg.enable_outfit && cfg.outfit_preset === "宽松滑肩白T恤·下身真空（故事线默认）"
      ? joinTags("oversized white t-shirt, off-shoulder, single bare shoulder", customOutfit)
      : outfitIntact;
  const f00ActiveUndress =
    cfg.enable_clothing_state &&
    ["keep_bottom_aside", "half_off", "bottomless"].includes(reqState);
  const frontOutfitTags = f00ActiveUndress ? joinTags(frontDesign, statePos) : frontDesign;
  if (f00ActiveUndress && cfg.enable_outfit && outfitKind === "preset") {
    frontShirtProse = ` wearing ${outfitInfo.prose}`;
  }

  const isCanonLegwear = cfg.legwear_preset === "🌟 随角色原设鞋袜 / 不强制赤足";
  let legNormal = "";
  let footHoldTags = "soles, toes, soles together";
  let solesRear = "soles";
  let legProse = "feet";
  let frontLegTags = "bare thighs";

  if (cfg.enable_legwear) {
    let legFootLook: string;
    [legNormal, legFootLook, legProse] =
      LEGWEAR_PRESETS[cfg.legwear_preset] ?? LEGWEAR_PRESETS["赤足裸腿（barefoot 默认）"];
    if (isCanonLegwear) {
      footHoldTags = "no shoes, socks, clothed feet, soles, soles together";
      solesRear = "";
      frontLegTags = "";
    } else if (legFootLook.includes("barefoot")) {
      footHoldTags = joinTags(legFootLook, "soles, toes, soles together");
      solesRear = "soles";
      frontLegTags = "bare thighs";
    } else {
      footHoldTags = joinTags(legFootLook, "soles, soles together");
      solesRear = "soles";
      frontLegTags = legNormal;
    }
  }

  let bgCouch = "";
  let bgSleepCouch = "";
  let locProse = "";
  if (cfg.enable_background) {
    if (m6Mode) {
      bgCouch = "indoors, beige couch, window, cream sheer curtains";
      bgSleepCouch = "indoors, beige couch, pillow, window, cream sheer curtains";
      locProse = " by cream sheer curtains";
    } else {
      bgCouch = "indoors, couch, lamp";
      bgSleepCouch = "indoors, couch, pillow, lamp";
      locProse = " on the warm-lit couch";
    }
  }
  const onCouchTag = cfg.enable_background ? "lying on couch" : "";
  const kneelCouchTag = cfg.enable_background ? "kneeling on couch" : "kneeling";
  const handsCouchTag = cfg.enable_background ? "hands on couch" : "supporting weight";

  let anatPos: string;
  let anatNeg: string;
  if (cfg.enable_anatomy) {
    let [morphPos, morphNeg] =
      MORPH_PRESETS[cfg.morph_preset] ?? MORPH_PRESETS["1D 微明显蝴蝶低过渡（原版默认）"];
    if (cfg.morph_preset.includes("1D+") && bodyPos.includes("petite")) {
      morphPos = "groin, pussy, 1.8::labia::, 1.1::spread pussy::";
    }
    const [pubicPos, pubicNeg] = PUBIC_PRESETS[cfg.pubic_preset] ?? ["", ""];
    const pigmentPos = PIGMENT_PRESETS[cfg.pigment_preset] ?? "";
    anatPos = joinTags(morphPos, pubicPos, pigmentPos);
    anatNeg = joinTags(morphNeg, pubicNeg);
  } else {
    anatPos = "groin, pussy";
    anatNeg = "";
  }

  const intactNeg =
    cfg.enable_outfit && effState === "intact" && outfitKind !== "nude" && outfitKind !== "custom"
      ? "nude, topless, bottomless"
      : "";
  const isTune2 = cfg.style_preset.includes("M6-Tune2");
  const commonTailNeg = isTune2
    ? joinTags(anatNeg, canonNeg, intactNeg)
    : joinTags(styleNeg, bodyFullNeg, anatNeg, canonNeg, intactNeg);

  return {
    head_pos: headPos,
    char_id: charId,
    char_rest: charRest,
    char_core: charCore,
    outfit_pos: outfitPos,
    outfit_intact: outfitIntact,
    outfit_upper_oral: outfitUpperOral,
    outfit_prose_clause: outfitProseClause,
    front_outfit_tags: frontOutfitTags,
    front_leg_tags: frontLegTags,
    front_shirt_prose: frontShirtProse,
    outfit_kind: outfitKind,
    f00_active_undress: f00ActiveUndress ? "1" : "",
    covers_midriff: coversMidriff ? "1" : "",
    belly_tags: bellyTags,
    belly_tags_s06_11: bellyTagsS0611,
    stomach_rem_tag: stomachRemTag,
    stomach_rem_prose: stomachRemProse,
    stomach_pool_prose: stomachPoolProse,
    soles_rear: solesRear,
    leg_normal: legNormal,
    leg_foot: footHoldTags,
    leg_prose: legProse,
    bg_couch: bgCouch,
    bg_sleep_couch: bgSleepCouch,
    on_couch_tag: onCouchTag,
    kneel_couch_tag: kneelCouchTag,
    hands_couch_tag: handsCouchTag,
    loc_prose: locProse,
    anat_pos: anatPos,
    common_tail_neg: commonTailNeg,
    tune2_inline_neg: isTune2 ? styleNeg : "",
    canon_neg: canonNeg,
    name: engName,
  };
}

export function generateScenePrompts(
  sceneId: string,
  cfg: CharacterConfig,
  povOverride?: PerspectiveMode | null
): ScenePromptItem[] {
  const mode: PerspectiveMode =
    povOverride === "pov" || povOverride === "3rd" ? povOverride : cfg.perspective_mode;
  const isPov = mode === "pov";
  const f = cfg.fluid_scale;
  const af = cfg.enable_action_fluids;
  const rem = cfg.enable_remnants;
  const negOn = cfg.enable_negatives;
  const exprCtrl = compileExpressionOverride(cfg, sceneId);
  const defEyesOpen = exprCtrl.active ? exprCtrl.eyes_open : true;
  const sleepEyesOpen = exprCtrl.active ? exprCtrl.eyes_open : false;
  let results: ScenePromptItem[] = [];

  if (sceneId in MULTI_ANGLE_TEMPLATES) {
    const tpl = MULTI_ANGLE_TEMPLATES[sceneId];
    const m = buildCommonModules(cfg, defEyesOpen);
    const maOutfit = m.front_outfit_tags;
    const maShirtProse = m.front_shirt_prose;
    const maLeg = m.front_leg_tags;
    const nsfwOn = cfg.enable_multi_angle_nsfw;
    const nsfwPrefix = nsfwOn ? "rating:explicit, nsfw, uncensored" : "";
    const anatMa = nsfwOn && cfg.enable_anatomy ? m.anat_pos : "";
    let maTailNeg = m.common_tail_neg;
    if (maTailNeg) {
      let negTokens = maTailNeg
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      if (tpl.allow_multi_views) {
        negTokens = negTokens.filter((t) => t.toLowerCase() !== "multiple views");
      }
      if (nsfwOn) {
        negTokens = negTokens.filter((t) => t.toLowerCase() !== "nsfw");
      } else if (!maOutfit.includes("nude") && !negTokens.some((t) => t.toLowerCase() === "nsfw")) {
        negTokens.unshift("nsfw");
      }
      maTailNeg = negTokens.join(", ");
    } else if (!nsfwOn && !maOutfit.includes("nude")) {
      maTailNeg = "nsfw";
    }
    let maScene = String(tpl.scene);
    if (exprCtrl.active) {
      for (const baked of [
        "playful cheerful expression",
        "relaxed cheerful smile",
        "gentle shy expression",
        "one eye slightly narrowed",
        "gentle relaxed gaze",
        "curious bright gaze",
        "slight smile",
      ]) {
        const escaped = baked.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        maScene = maScene.replace(new RegExp(`(?:,\\s*)?\\b${escaped}\\b`, "gi"), "");
      }
      maScene = maScene.replace(/^[ ,]+|[ ,]+$/g, "");
      maScene = joinTags(maScene, exprCtrl.pos_tags_str);
    }
    const pMa = joinTags(
      m.head_pos,
      "1girl, solo",
      m.char_core,
      maOutfit,
      maLeg,
      nsfwPrefix,
      anatMa,
      maScene,
      proseIf(cfg, `${m.name}${maShirtProse} ${tpl.prose}`),
      wrapTailNeg(m, maTailNeg, negOn)
    );
    results.push({ subTitle: `【${tpl.title}】`, canvas: tpl.canvas, prompt: pMa });
  } else if (sceneId in ALL_POSITIONS_TEMPLATES) {
    const tpl = ALL_POSITIONS_TEMPLATES[sceneId];
    const channel = tpl.channel;
    const m = buildCommonModules(cfg, defEyesOpen);
    const transBg = Boolean(cfg.pos_transparent_bg);
    const maleCode = POS_MALE_MODE_PRESETS[cfg.pos_male_mode] ?? "normal";
    const showP = Boolean(cfg.pos_show_penis);
    const stageCode = POS_STAGE_PRESETS[cfg.pos_stage] ?? "before";
    const stageBadge =
      stageCode === "during"
        ? " · [💦射精中]"
        : stageCode === "after_inside"
          ? " · [🌊射精后结合]"
          : stageCode === "pull_out"
            ? " · [🔗事后拔出]"
            : "";

    let posOutfit: string;
    if (channel === "chest") {
      if (cfg.enable_outfit && cfg.enable_clothing_state && !m.outfit_pos.includes("nude")) {
        posOutfit = joinTags(m.outfit_intact, "clothes lift, breasts out");
      } else {
        posOutfit = m.outfit_pos;
      }
    } else if (channel === "oral" || channel === "hand") {
      posOutfit = m.outfit_upper_oral;
    } else {
      posOutfit = m.outfit_pos;
    }

    const posLeg = channel === "foot" ? m.leg_foot : m.leg_normal;
    const poseRaw = isPov ? tpl.pose_pov : tpl.pose_3rd;

    let headUsed: string;
    let bgUsed: string;
    let bgProse: string;
    let poseUsed: string;
    let transNeg: string;
    if (transBg) {
      headUsed = sanitizeStyleForTransparentBg(m.head_pos);
      bgUsed = "2.0::transparent background::, has alpha, alpha transparency, no background";
      bgProse = " isolated on a transparent background";
      poseUsed = poseRaw.replace(", head on pillow", "").replace(", hands gripping sheet", "");
      transNeg =
        "background, simple background, white background, black background, gradient background, " +
        "indoors, outdoors, scenery, furniture, bed, couch, sofa, pillow, window, curtains, wall, floor, drop shadow";
    } else {
      headUsed = m.head_pos;
      bgUsed = m.bg_couch;
      bgProse = m.loc_prose;
      poseUsed = poseRaw;
      transNeg = "";
    }

    let actorTags: string;
    let organTags: string;
    let partnerProse: string;
    let organProse: string;
    let extraNeg: string;

    if (channel === "solo") {
      actorTags = "1girl, solo";
      if (stageCode === "before") {
        organTags = joinTags(
          m.anat_pos,
          "1.2::spread pussy::",
          af ? wtag("pussy juice", 1.15, f) : ""
        );
        organProse = "";
      } else if (stageCode === "during") {
        organTags = joinTags(
          m.anat_pos,
          "1.2::spread pussy::, orgasm, climax, female ejaculation, trembling, twitching",
          wtag("pussy juice", 1.4, f),
          wtag("squirting", 1.3, f),
          "pussy juice trail, sweat"
        );
        organProse = ", arching at the peak of climax with glistening fluids";
      } else if (stageCode === "after_inside") {
        organTags = joinTags(
          m.anat_pos,
          "1.2::spread pussy::, after masturbation, after vaginal, heavy breathing, trembling",
          wtag("cum", 1.4, f),
          wtag("cum in pussy", 1.45, f),
          wtag("cum overflow", 1.4, f),
          wtag("cumdrip", 1.35, f),
          "cum on thighs, sweat"
        );
        organProse =
          ", resting after climax with thick white cum pooling and overflowing from her parted lower anatomy";
      } else {
        organTags = joinTags(
          m.anat_pos,
          "1.3::spread pussy::, after vaginal, after sex, 0.65::gaping::, twitching",
          wtag("cum", 1.45, f),
          wtag("cum in pussy", 1.45, f),
          wtag("cumdrip", 1.45, f),
          wtag("cum string", 1.4, f),
          wtag("cum on stomach", 1.3, f),
          "cum on thighs, sweat"
        );
        organProse =
          ", right after withdrawal with thick white cum overflowing and dripping in sticky strings from her parted lower anatomy";
      }
      partnerProse = "";
      extraNeg = "1boy, male, penis, phallus, dildo";
    } else {
      let partnerNeg: string;
      if (maleCode === "normal") {
        actorTags = joinTags("1girl, 1boy, hetero, faceless male", isPov ? "1.35::pov::, pov hands" : "");
        partnerProse = " with a faceless partner";
        partnerNeg = "";
      } else if (maleCode === "translucent") {
        actorTags = joinTags(
          "1girl, 1boy, hetero, faceless male, 1.35::male silhouette::, ghostly outline",
          isPov ? "1.35::pov::" : ""
        );
        partnerProse =
          " with a semi-transparent see-through male silhouette that does not obscure her opaque body";
        partnerNeg = "";
      } else if (maleCode === "invisible") {
        actorTags = joinTags(
          "1girl",
          showP ? "disembodied penis" : "solo",
          isPov ? "1.3::pov::" : ""
        );
        partnerProse = " held in position by an unseen invisible partner";
        partnerNeg = showP ? "male body, male torso, male face" : "1boy, male, male body";
      } else {
        actorTags = showP ? "1girl, disembodied penis" : "1girl, solo";
        partnerProse = "";
        partnerNeg = showP ? "1boy, male body, male torso" : "1boy, male, multiple people";
      }

      if (channel === "vaginal") {
        if (stageCode === "before") {
          if (showP) {
            organTags = joinTags(
              m.anat_pos,
              "vaginal, insertion, penis",
              af ? wtag("pussy juice", 1.2, f) : ""
            );
            organProse = "";
          } else {
            organTags = joinTags(
              m.anat_pos,
              "1.3::spread pussy::, 0.55::gaping::, twitching",
              af ? wtag("pussy juice, cumdrip", 1.2, f) : ""
            );
            organProse = ", keeping her lower anatomy actively parted";
          }
        } else if (stageCode === "during") {
          const baseOrg = showP
            ? joinTags(m.anat_pos, "vaginal, insertion, penis")
            : joinTags(m.anat_pos, "1.3::spread pussy::, 0.55::gaping::, twitching");
          organTags = joinTags(
            baseOrg,
            "internal cumshot, ejaculation, climax, trembling, twitching",
            wtag("cum", 1.35, f),
            wtag("cum in pussy", 1.4, f),
            wtag("cum overflow", 1.35, f),
            "pussy juice, sweat"
          );
          organProse =
            (showP ? "" : ", keeping her lower anatomy actively parted") +
            ", climaxing during internal ejaculation as thick white cum begins overflowing from their tightly joined base";
        } else if (stageCode === "after_inside") {
          const baseOrg = showP
            ? joinTags(m.anat_pos, "vaginal, insertion, penis")
            : joinTags(m.anat_pos, "1.3::spread pussy::, 0.55::gaping::, twitching");
          organTags = joinTags(
            baseOrg,
            "after vaginal, after ejaculation, heavy breathing, trembling",
            wtag("cum", 1.35, f),
            wtag("cum in pussy", 1.45, f),
            wtag("cum overflow", 1.45, f),
            wtag("cumdrip", 1.35, f),
            "cum on thighs, pussy juice, sweat"
          );
          organProse =
            (showP ? "" : ", keeping her lower anatomy actively parted") +
            ", resting right after internal ejaculation while still deeply joined together as thick white cum pools and overflows";
        } else {
          if (showP) {
            organTags = joinTags(
              m.anat_pos,
              "1.35::after vaginal::, 1.4::pull out::, after sex, penis, erection, twitching penis, cum on penis, spread pussy, 0.55::gaping::",
              wtag("cum", 1.4, f),
              wtag("cum in pussy", 1.45, f),
              wtag("cumdrip", 1.45, f),
              wtag("cum string", 1.45, f),
              wtag("cum on stomach", 1.25, f),
              "cum on thighs, pussy juice, sweat"
            );
            organProse =
              ", right after pulling out, with sticky white cum strings bridging between the tip and her parted, overflowing lower anatomy";
          } else {
            organTags = joinTags(
              m.anat_pos,
              "1.4::after vaginal::, pull out, after sex, 1.3::spread pussy::, 0.65::gaping::, twitching",
              wtag("cum", 1.4, f),
              wtag("cum in pussy", 1.45, f),
              wtag("cumdrip", 1.45, f),
              wtag("cum string", 1.45, f),
              wtag("cum on stomach", 1.25, f),
              "cum on thighs, pussy juice, sweat"
            );
            organProse =
              ", right after withdrawal, keeping her lower anatomy parted as thick white cum overflows, drips down, and forms sticky strings";
          }
        }
      } else if (channel === "oral") {
        if (stageCode === "before") {
          if (showP) {
            organTags = joinTags(
              "oral, fellatio, penis, open mouth, tongue, saliva",
              af ? wtag("saliva trail", 1.2, f) : ""
            );
            organProse = "";
          } else {
            organTags = joinTags(
              "1.3::open mouth::, 1.35::o-shaped mouth::, tongue out, saliva",
              af ? wtag("saliva trail", 1.2, f) : ""
            );
            organProse = ", keeping her mouth hollowed open with tongue extended";
          }
        } else if (stageCode === "during") {
          const baseOrg = showP
            ? "oral, fellatio, penis, open mouth, tongue, saliva"
            : "1.3::open mouth::, 1.35::o-shaped mouth::, tongue out, saliva";
          organTags = joinTags(
            baseOrg,
            "ejaculation, climax, swallowing",
            wtag("cum", 1.35, f),
            wtag("cum in mouth", 1.4, f),
            wtag("cum overflow", 1.35, f),
            "cum on tongue, saliva"
          );
          organProse =
            (showP ? "" : ", keeping her mouth hollowed open with tongue extended") +
            ", during oral ejaculation as thick white cum fills her mouth and overflows past her lips";
        } else if (stageCode === "after_inside") {
          const baseOrg = showP
            ? "oral, fellatio, penis, open mouth, tongue, saliva"
            : "1.3::open mouth::, 1.35::o-shaped mouth::, tongue out, saliva";
          organTags = joinTags(
            baseOrg,
            "after fellatio, after ejaculation, heavy breathing",
            wtag("cum", 1.35, f),
            wtag("cum in mouth", 1.4, f),
            wtag("cum on tongue", 1.35, f),
            "cum on lips",
            wtag("cum string", 1.3, f),
            "saliva trail"
          );
          organProse =
            (showP ? "" : ", keeping her mouth hollowed open with tongue extended") +
            ", right after oral ejaculation with thick white cum pooling on her tongue and along her lips";
        } else {
          const baseOrg = showP
            ? "1.4::after fellatio::, 0.55::oral::, pull out, penis, cum on penis, open mouth, tongue out, saliva"
            : "1.4::after fellatio::, pull out, 1.3::open mouth::, 1.35::o-shaped mouth::, tongue out, saliva";
          organTags = joinTags(
            baseOrg,
            wtag("cum", 1.4, f),
            wtag("cum in mouth", 1.3, f),
            wtag("cum on face", 1.35, f),
            wtag("cum on tongue", 1.35, f),
            wtag("cum string", 1.45, f),
            "saliva trail"
          );
          organProse =
            (showP ? "" : ", keeping her mouth hollowed open with tongue extended") +
            ", pulling her mouth slightly back right after fellatio with sticky white cum strings stretching from her lips and tongue";
        }
      } else {
        let baseBeforeP: string;
        let baseBeforeNp: string;
        let mildFluid: string;
        let npProse: string;
        let surfaceTags: string[];
        let surfaceEn: string;
        if (channel === "chest") {
          baseBeforeP = "paizuri, breasts squeezed together, cleavage, grabbing own breasts, penis";
          baseBeforeNp = "1.4::grabbing own breasts::, 1.35::breasts squeezed together::, cleavage, paizuri pose";
          mildFluid = af ? joinTags(wtag("glistening", 1.15, f), "sweat") : "";
          npProse = ", pressing her chest together around an open central channel";
          surfaceTags = [wtag("cum on breasts", 1.4, f), wtag("cum on chest", 1.3, f), "facial"];
          surfaceEn = "squeezed cleavage and chest";
        } else if (channel === "foot") {
          baseBeforeP = "footjob, soles together, feet together, penis";
          baseBeforeNp = "1.4::soles together::, arched feet, feet together";
          mildFluid = af ? wtag("cum on feet", 1.2, f) : "";
          npProse = ", keeping both soles arched and pressed together";
          surfaceTags = [wtag("cum on feet", 1.45, f), wtag("cum on toes", 1.35, f), "cum on soles"];
          surfaceEn = "pressed soles and toes";
        } else if (channel === "thigh") {
          baseBeforeP = joinTags(m.anat_pos, "sumata, thigh sex, thighs together, penis");
          baseBeforeNp = joinTags(m.anat_pos, "1.35::thighs together::, squeezed thighs");
          mildFluid = af ? wtag("pussy juice", 1.15, f) : "";
          npProse = ", keeping her inner thighs pressed snugly together";
          surfaceTags = [wtag("cum on thighs", 1.4, f), wtag("cum on stomach", 1.3, f), "cum on pussy"];
          surfaceEn = "tightly pressed inner thighs";
        } else if (channel === "glute") {
          baseBeforeP = "ass focus, assjob, squeezed glutes, penis";
          baseBeforeNp = "ass focus, 1.35::squeezed glutes::, spread ass";
          mildFluid = af ? joinTags(wtag("glistening", 1.15, f), "sweat") : "";
          npProse = ", keeping her glutes pressed and arched";
          surfaceTags = [wtag("cum on ass", 1.4, f), wtag("cum on back", 1.25, f)];
          surfaceEn = "arched glutes and lower back";
        } else {
          baseBeforeP = "handjob, two-handed, curled fingers, penis";
          baseBeforeNp = "1.35::curled fingers::, cylindrical hand grip, hands together";
          mildFluid = af ? wtag(showP ? "precum" : "saliva trail", 1.15, f) : "";
          npProse = ", holding both hands in a curled cylindrical grip";
          surfaceTags = [wtag("cum on hands", 1.4, f), wtag("cum on fingers", 1.35, f)];
          surfaceEn = "cupped hands and fingers";
        }

        const baseOrg = showP ? baseBeforeP : baseBeforeNp;
        organProse = showP ? "" : npProse;
        if (stageCode === "before") {
          organTags = joinTags(baseOrg, mildFluid);
        } else if (stageCode === "during") {
          organTags = joinTags(
            baseOrg,
            "ejaculation, climax, flying cum",
            wtag("cum", 1.35, f),
            ...surfaceTags,
            wtag("cum string", 1.25, f),
            "sweat"
          );
          organProse += `, at the moment of ejaculation as thick white cum spurts across her ${surfaceEn}`;
        } else if (stageCode === "after_inside") {
          organTags = joinTags(
            baseOrg,
            "after ejaculation, heavy breathing",
            wtag("cum", 1.4, f),
            ...surfaceTags,
            wtag("cumdrip", 1.35, f),
            wtag("cum string", 1.3, f),
            "sweat"
          );
          organProse += `, resting right after ejaculation while still holding close as thick white cum pools and drips over her ${surfaceEn}`;
        } else {
          organTags = joinTags(
            baseOrg,
            "after ejaculation, pull out, excessive cum",
            wtag("cum", 1.45, f),
            ...surfaceTags,
            wtag("cum string", 1.45, f),
            wtag("cumdrip", 1.4, f),
            "sweat"
          );
          organProse += `, pulling slightly back right after ejaculation with sticky white cum strings stretching across her ${surfaceEn}`;
        }
      }

      const penisNeg = showP ? "" : "penis, phallus, testicles, dildo, sex toy";
      extraNeg = joinTags(partnerNeg, penisNeg);
    }

    const expPos = exprIf(cfg, "furrowed brow, half-closed eyes, watery eyes, blush");
    const remPos = rem ? "sweat" : "";
    const fullNeg = joinTags(extraNeg, transNeg, m.common_tail_neg);
    const povLbl = isPov ? "第一人称 (POV)" : "第三人称 (客观镜头)";
    const proseSentence = `${m.name} ${tpl.prose_core}${partnerProse}${organProse}${bgProse}.`;

    const pPos = joinTags(
      headUsed,
      actorTags,
      m.char_core,
      bgUsed,
      poseUsed,
      posLeg,
      posOutfit,
      expPos,
      "rating:explicit, nsfw, uncensored",
      organTags,
      remPos,
      proseIf(cfg, proseSentence, transBg),
      wrapTailNeg(m, fullNeg, negOn)
    );
    results.push({
      subTitle: `【${tpl.title} · ${povLbl}${stageBadge}】`,
      canvas: tpl.canvas,
      prompt: pPos,
    });
  } else if (sceneId === "F00") {
    const m = buildCommonModules(cfg, defEyesOpen);
    const bgBed = cfg.enable_background
      ? "indoors, bedroom, bed, white bedsheet, wooden headboard, window, cream sheer curtains"
      : "";
    const bedProse = cfg.enable_background ? " on a white bedsheet in front of a wooden headboard" : "";
    const frontOutfit = m.front_outfit_tags;
    const shirtProse = m.front_shirt_prose;
    const legFront = m.front_leg_tags;
    const foLow = frontOutfit.toLowerCase();

    let hasExplicitOutfit: boolean;
    let anatFront: string;
    if (m.outfit_kind === "custom") {
      hasExplicitOutfit = Boolean(m.f00_active_undress);
      anatFront = m.f00_active_undress ? m.anat_pos : "";
    } else {
      hasExplicitOutfit =
        foLow.includes("nude") || foLow.includes("breasts out") || Boolean(m.f00_active_undress);
      anatFront = foLow.includes("nude") || m.f00_active_undress ? m.anat_pos : "";
    }
    const nsfwPrefix = hasExplicitOutfit ? "rating:explicit, nsfw, uncensored" : "";
    const expTags = exprIf(cfg, "furrowed brow, shy, soft blush");
    const kneelTag = cfg.enable_background ? "kneeling on bed" : "kneeling";

    if (isPov) {
      const pPov = joinTags(
        m.head_pos,
        "1girl, solo",
        m.char_core,
        frontOutfit,
        legFront,
        nsfwPrefix,
        anatFront,
        bgBed,
        kneelTag,
        "leaning forward, arms in front, looking at viewer",
        expTags,
        proseIf(
          cfg,
          `${m.name} kneeling${bedProse}, leaning forward with her arms in front${shirtProse} while gazing shyly at the viewer.`
        ),
        wrapTailNeg(m, m.common_tail_neg, negOn)
      );
      results.push({
        subTitle: "【F00 · 第一人称视角 (POV) · 晨光白床正面跪坐前倾（正脸状态校验）】",
        canvas: "竖图 832x1216",
        prompt: pPov,
      });
    } else {
      const p3rd = joinTags(
        m.head_pos,
        "1girl, solo",
        m.char_core,
        frontOutfit,
        legFront,
        nsfwPrefix,
        anatFront,
        bgBed,
        "front view, cowboy shot",
        kneelTag,
        "knees apart, leaning forward, arms in front, looking at viewer",
        expTags,
        proseIf(
          cfg,
          `Frontal cowboy shot of ${m.name} kneeling with knees apart${bedProse}, leaning forward with her arms in front${shirtProse} while gazing shyly at the viewer.`
        ),
        wrapTailNeg(m, joinTags("from behind, back, profile", m.common_tail_neg), negOn)
      );
      results.push({
        subTitle: "【F00 · 第三人称视角 (客观镜头) · 正面七分身跪床前倾（正脸与比例校验）】",
        canvas: "竖图 832x1216",
        prompt: p3rd,
      });
    }
  } else if (sceneId === "S00") {
    const m = buildCommonModules(cfg, defEyesOpen);
    const remTags = rem
      ? joinTags("after vaginal, cum", wtag("cum in pussy", 1.0, f), wtag("cumdrip", 1.0, f), "cum on thighs, sweat")
      : "";
    const expTags = exprIf(cfg, ":p, tongue out, smug, furrowed brow, half-closed eyes, watery eyes, blush, floating heart");
    if (isPov) {
      const p = joinTags(
        m.head_pos,
        "1girl, solo",
        m.char_core,
        m.bg_couch,
        "1.45::pov::, 1.4::from behind::, close-up, foreshortening, low angle",
        "all fours, arched back, knees apart",
        m.leg_normal,
        m.soles_rear,
        "looking back, looking at viewer",
        m.outfit_pos,
        expTags,
        "rating:explicit, nsfw, uncensored, ass",
        m.anat_pos,
        remTags,
        proseIf(
          cfg,
          `Close-up first-person POV standing right behind ${m.name} kneeling on all fours${m.loc_prose} as she arches her back and looks back over her shoulder right at the viewer.`
        ),
        wrapTailNeg(m, joinTags("sitting, wide shot, distant", m.common_tail_neg), negOn)
      );
      results.push({
        subTitle: "【S00 · 第一人称视角 (POV) · 贴近臀后俯看跪爬回眸】",
        canvas: "竖图 832x1216 或 横图 1216x832",
        prompt: p,
      });
    } else {
      const p = joinTags(
        m.head_pos,
        "1girl, solo",
        m.char_core,
        m.bg_couch,
        "full body, 1.3::from behind::, from side, low angle, perspective",
        "all fours, arched back, knees apart",
        m.leg_normal,
        m.soles_rear,
        "looking back, looking at viewer",
        m.outfit_pos,
        expTags,
        "rating:explicit, nsfw, uncensored, ass",
        m.anat_pos,
        remTags,
        proseIf(
          cfg,
          `Full-body angled rear-side view of ${m.name} kneeling on all fours${m.loc_prose} as she arches her back and looks back over her shoulder at the viewer.`
        ),
        wrapTailNeg(m, joinTags("pov, close-up, sitting", m.common_tail_neg), negOn)
      );
      results.push({
        subTitle: "【S00 · 第三人称视角 (客观镜头) · 侧后 30° 全景跪爬回眸】",
        canvas: "横图 1216x832",
        prompt: p,
      });
    }
  } else if (sceneId === "S01") {
    const m = buildCommonModules(cfg, defEyesOpen);
    const expTags = exprIf(cfg, "furrowed brow, half-closed eyes, watery eyes, blush, floating heart");
    const remTags = rem
      ? joinTags("after vaginal, cum", wtag("cum in pussy", 1.0, f), wtag("cumdrip", 1.0, f), "cum on thighs")
      : "";
    const fluidAct = af ? "saliva, sweat" : "";
    if (isPov) {
      const p = joinTags(
        m.head_pos,
        "1girl, 1boy, hetero",
        m.char_core,
        "faceless male",
        m.bg_couch,
        "1.5::pov::, 1.4::pov crotch::, 1.35::from above::, foreshortening",
        "all fours",
        m.kneel_couch_tag,
        "leaning forward, arched back, looking up, looking at viewer",
        m.outfit_upper_oral,
        expTags,
        "rating:explicit, nsfw, uncensored, 1.4::oral::, 1.4::fellatio::, penis",
        fluidAct,
        proseIf(
          cfg,
          `First-person POV looking down${m.loc_prose} as ${m.name} kneels forward on all fours performing fellatio while gazing up at the viewer.`
        ),
        wrapTailNeg(m, joinTags("from behind, profile, sitting, male focus", m.common_tail_neg), negOn)
      );
      results.push({
        subTitle: "【S01 · 第一人称视角 (POV) · 男方俯视口部互动进行中】",
        canvas: "竖图 832x1216",
        prompt: p,
      });
    } else {
      const p = joinTags(
        m.head_pos,
        "1girl, 1boy, hetero",
        m.char_core,
        "faceless male, head out of frame",
        m.bg_couch,
        "1.6::from behind::, low angle, foreshortening, dynamic perspective",
        "all fours, arched back, knees apart",
        m.leg_normal,
        m.soles_rear,
        "looking back, sidelong glance, looking at viewer",
        m.outfit_pos,
        expTags,
        "rating:explicit, nsfw, uncensored, oral, fellatio, penis",
        fluidAct,
        "ass",
        m.anat_pos,
        remTags,
        proseIf(
          cfg,
          `Rear three-quarter low-angle perspective angled 30 degrees along ${m.name}'s spine, looking past her hips in the right foreground toward her head and the faceless man's lower body in the left midground.`
        ),
        wrapTailNeg(m, joinTags("pov, from side, profile, sitting, male focus", m.common_tail_neg), negOn)
      );
      results.push({
        subTitle: "【S01 · 第三人称视角 (客观镜头) · 侧后 30° 跪爬 + 左侧男方进行中】",
        canvas: "横图 1216x832",
        prompt: p,
      });
    }
  } else if (sceneId === "S02") {
    const m = buildCommonModules(cfg, defEyesOpen);
    const expTags = exprIf(cfg, "furrowed brow, half-closed eyes, watery eyes, heavy blush, floating heart");
    const oralFluids = af
      ? joinTags(
          wtag("cum in mouth", 1.05, f),
          wtag("cum on face", 1.25, f),
          wtag("cum in hair", 0.85, f),
          wtag("cum string", 1.45, f),
          "saliva trail, sweat"
        )
      : "";
    const remLower = rem
      ? joinTags("after vaginal, cum", wtag("cum in pussy", 1.0, f), wtag("cumdrip", 1.0, f), "cum on thighs")
      : "";
    const fluidClause = af
      ? " with sticky white cum strings bridging from her mouth and splatters on her cheek and hair"
      : "";
    if (isPov) {
      const p = joinTags(
        m.head_pos,
        "1girl, 1boy, hetero",
        m.char_core,
        "faceless male",
        m.bg_couch,
        "1.5::pov::, 1.4::pov crotch::, 1.35::from above::, foreshortening",
        "all fours",
        m.kneel_couch_tag,
        "leaning forward, looking up, looking at viewer",
        m.outfit_upper_oral,
        expTags,
        "rating:explicit, nsfw, uncensored, 1.4::after fellatio::, 0.6::oral, fellatio::, penis, erection",
        oralFluids,
        proseIf(
          cfg,
          `First-person POV looking down as ${m.name} pulls her lips slightly back right after fellatio${m.loc_prose}, gazing up at the viewer${fluidClause}.`
        ),
        wrapTailNeg(m, joinTags("from behind, profile, sitting, male focus", m.common_tail_neg), negOn)
      );
      results.push({
        subTitle: "【S02 · 第一人称视角 (POV) · 男方俯视刚松口拉丝 + 发丝沾染】",
        canvas: "竖图 832x1216",
        prompt: p,
      });
    } else {
      const p = joinTags(
        m.head_pos,
        "1girl, 1boy, hetero",
        m.char_core,
        "faceless male, head out of frame",
        m.bg_couch,
        "1.6::from behind::, low angle, foreshortening, dynamic perspective",
        "all fours, arched back, knees apart",
        m.leg_normal,
        m.soles_rear,
        "looking back, sidelong glance, looking at viewer",
        m.outfit_pos,
        expTags,
        "rating:explicit, nsfw, uncensored, after fellatio, 0.6::oral, fellatio::, penis",
        oralFluids,
        "ass",
        m.anat_pos,
        remLower,
        proseIf(
          cfg,
          `Rear three-quarter low-angle perspective angled 30 degrees along ${m.name}'s spine, looking past her hips in the right foreground toward her head pulling back${fluidClause} from the faceless man's lower body in the left midground.`
        ),
        wrapTailNeg(m, joinTags("pov, from side, profile, sitting, male focus", m.common_tail_neg), negOn)
      );
      results.push({
        subTitle: "【S02 · 第三人称视角 (客观镜头) · 侧后 30° 松口拉丝 + 发丝沾染】",
        canvas: "横图 1216x832",
        prompt: p,
      });
    }
  } else if (sceneId === "S03") {
    const m = buildCommonModules(cfg, defEyesOpen);
    const expTags = exprIf(cfg, "furrowed brow, half-closed eyes, watery eyes, heavy blush");
    const actFluids = af
      ? joinTags(
          wtag("cum on face", 1.25, f),
          wtag("cum in hair", 0.85, f),
          wtag("cum string", 1.4, f),
          "sweat"
        )
      : "";
    const beforeFluids = af ? "saliva, sweat" : "";
    const remLower = rem ? joinTags("after vaginal, cum", wtag("cumdrip", 1.1, f)) : "";
    const afterClause = af
      ? " with sticky white cum strings bridging from her lips and splatters on her cheek and hair"
      : "";
    const mpMode = cfg.multi_panel_mode;

    if (mpMode === "2koma") {
      if (isPov) {
        const pPov = joinTags(
          "2.5::2koma::, 2.5::vertical split screen::, comic, two panels, vertical border, dividing line, gutter, 2girls, 2boys, same character, hetero",
          m.head_pos,
          m.char_core,
          "faceless male",
          m.bg_couch,
          "1.5::pov::, 1.4::pov crotch::, 1.35::from above::, foreshortening",
          m.kneel_couch_tag,
          "leaning forward, looking up, looking at viewer",
          m.outfit_upper_oral,
          expTags,
          "rating:explicit, nsfw, uncensored, oral, fellatio, after fellatio, penis",
          actFluids,
          proseIf(
            cfg,
            `Two side-by-side first-person POV panels looking down at ${m.name}${m.loc_prose}: in the left panel she performs fellatio; in the right panel she pulls back right after${afterClause}.`
          ),
          wrapTailNeg(
            m,
            joinTags(
              "1girl, solo, single panel, from behind, profile, male focus, 4koma, speech bubble",
              m.common_tail_neg
            ),
            negOn
          )
        );
        results.push({
          subTitle: "【S03 · 第一人称视角 (POV) · 左右双格俯视口部事前 vs 事后】",
          canvas: "横图 1216x832",
          prompt: pPov,
        });
      } else {
        const p3rd = joinTags(
          "2.5::2koma::, 2.5::horizontal split screen::, comic, two panels, horizontal border, dividing line, gutter, 2girls, 2boys, same character, hetero",
          m.head_pos,
          m.char_core,
          "faceless male, head out of frame",
          m.bg_couch,
          "1.5::from behind::, low angle, foreshortening",
          "all fours, arched back, knees apart",
          m.leg_normal,
          m.soles_rear,
          "looking back, sidelong glance, looking at viewer",
          m.outfit_pos,
          expTags,
          "rating:explicit, nsfw, uncensored, oral, fellatio, after fellatio, penis",
          actFluids,
          "ass",
          m.anat_pos,
          remLower,
          proseIf(
            cfg,
            `Two stacked horizontal panels from the same 30-degree rear low-angle view of ${m.name}${m.loc_prose}: in the top panel she performs fellatio; in the bottom panel she pulls back right after${afterClause}.`
          ),
          wrapTailNeg(
            m,
            joinTags(
              "pov, 1girl, solo, single panel, profile, sitting, male focus, 4koma, speech bubble",
              m.common_tail_neg
            ),
            negOn
          )
        );
        results.push({
          subTitle: "【S03 · 第三人称视角 (客观镜头) · 上下横构图双格 30° 侧后事前 vs 事后】",
          canvas: "竖图 832x1216",
          prompt: p3rd,
        });
      }
    } else {
      const noSplitNeg = "2koma, 4koma, split screen, multiple views, comic, border, speech bubble";
      if (isPov) {
        const pA = joinTags(
          m.head_pos,
          "1girl, 1boy, hetero",
          m.char_core,
          "faceless male",
          m.bg_couch,
          "1.5::pov::, 1.4::pov crotch::, 1.35::from above::, foreshortening",
          "all fours",
          m.kneel_couch_tag,
          "leaning forward, arched back, looking up, looking at viewer",
          m.outfit_upper_oral,
          expTags,
          "rating:explicit, nsfw, uncensored, 1.45::oral::, 1.45::fellatio::, deepthroat, penis",
          beforeFluids,
          proseIf(
            cfg,
            `Single full-frame first-person POV looking down at ${m.name}${m.loc_prose} kneeling forward performing deep fellatio while gazing up at the viewer.`
          ),
          wrapTailNeg(
            m,
            joinTags(noSplitNeg, "from behind, profile, sitting, male focus", m.common_tail_neg),
            negOn
          )
        );
        const pB = joinTags(
          m.head_pos,
          "1girl, 1boy, hetero",
          m.char_core,
          "faceless male",
          m.bg_couch,
          "1.5::pov::, 1.4::pov crotch::, 1.35::from above::, foreshortening",
          "all fours",
          m.kneel_couch_tag,
          "leaning forward, looking up, looking at viewer",
          m.outfit_upper_oral,
          expTags,
          "rating:explicit, nsfw, uncensored, 1.45::after fellatio::, 0.55::oral::, penis, erection",
          actFluids,
          proseIf(
            cfg,
            `Single full-frame first-person POV looking down at ${m.name}${m.loc_prose} pulling her lips slightly back right after fellatio${afterClause}.`
          ),
          wrapTailNeg(
            m,
            joinTags(noSplitNeg, "from behind, profile, sitting, male focus", m.common_tail_neg),
            negOn
          )
        );
        if (mpMode === "single_a" || mpMode === "single_pair") {
          results.push({
            subTitle: "【S03 单图A · 第一人称 (POV) · 口部深入进行中单幅】",
            canvas: "竖图 832x1216",
            prompt: pA,
          });
        }
        if (mpMode === "single_b" || mpMode === "single_pair") {
          results.push({
            subTitle: "【S03 单图B · 第一人称 (POV) · 事后松口拉丝单幅】",
            canvas: "竖图 832x1216",
            prompt: pB,
          });
        }
      } else {
        const pA = joinTags(
          m.head_pos,
          "1girl, 1boy, hetero",
          m.char_core,
          "faceless male, head out of frame",
          m.bg_couch,
          "1.6::from behind::, low angle, foreshortening, dynamic perspective",
          "all fours, arched back, knees apart",
          m.leg_normal,
          m.soles_rear,
          "looking back, sidelong glance, looking at viewer",
          m.outfit_pos,
          expTags,
          "rating:explicit, nsfw, uncensored, 1.4::oral::, 1.4::fellatio::, penis",
          beforeFluids,
          "ass",
          m.anat_pos,
          remLower,
          proseIf(
            cfg,
            `Single full-frame 30-degree rear low-angle view of ${m.name}${m.loc_prose} kneeling on all fours performing fellatio on the faceless man in the left midground.`
          ),
          wrapTailNeg(
            m,
            joinTags(noSplitNeg, "pov, from side, profile, sitting, male focus", m.common_tail_neg),
            negOn
          )
        );
        const pB = joinTags(
          m.head_pos,
          "1girl, 1boy, hetero",
          m.char_core,
          "faceless male, head out of frame",
          m.bg_couch,
          "1.6::from behind::, low angle, foreshortening, dynamic perspective",
          "all fours, arched back, knees apart",
          m.leg_normal,
          m.soles_rear,
          "looking back, sidelong glance, looking at viewer",
          m.outfit_pos,
          expTags,
          "rating:explicit, nsfw, uncensored, 1.45::after fellatio::, 0.55::oral::, penis",
          actFluids,
          "ass",
          m.anat_pos,
          remLower,
          proseIf(
            cfg,
            `Single full-frame 30-degree rear low-angle view of ${m.name}${m.loc_prose} pulling her head slightly back right after fellatio${afterClause}.`
          ),
          wrapTailNeg(
            m,
            joinTags(noSplitNeg, "pov, from side, profile, sitting, male focus", m.common_tail_neg),
            negOn
          )
        );
        if (mpMode === "single_a" || mpMode === "single_pair") {
          results.push({
            subTitle: "【S03 单图A · 第三人称 (客观镜头) · 30°侧后口部进行中单幅】",
            canvas: "横图 1216x832",
            prompt: pA,
          });
        }
        if (mpMode === "single_b" || mpMode === "single_pair") {
          results.push({
            subTitle: "【S03 单图B · 第三人称 (客观镜头) · 30°侧后松口拉丝单幅】",
            canvas: "横图 1216x832",
            prompt: pB,
          });
        }
      }
    }
  } else if (sceneId === "S04") {
    const m = buildCommonModules(cfg, defEyesOpen);
    const expTags = exprIf(
      cfg,
      "slight smile, smug, furrowed brow, half-closed eyes, watery eyes, heavy blush, floating heart",
      "1.4::closed mouth::"
    );
    const remFace = rem ? joinTags(wtag("cum on face", 1.4, f), wtag("cum in hair", 1.0, f)) : "";
    const actFluids = af
      ? joinTags(
          "internal cumshot",
          wtag("cum overflow", 1.4, f),
          "cum on penis",
          wtag("cum in pussy", 1.4, f),
          wtag("cumdrip", 1.5, f),
          wtag("cum string", 1.4, f),
          wtag("excessive cum", 1.2, f),
          "sweat"
        )
      : "";
    const c1F = af
      ? joinTags(
          "cum on penis, internal cumshot",
          wtag("cum overflow", 1.4, f),
          wtag("cum in pussy", 1.3, f),
          wtag("cumdrip", 1.3, f),
          "sweat"
        )
      : "";
    const c2F = af
      ? joinTags(
          "after ejaculation, cum on penis",
          wtag("cum in pussy", 1.4, f),
          wtag("cumdrip", 1.5, f),
          wtag("cum string", 1.4, f),
          wtag("excessive cum", 1.2, f),
          "cum on thighs, sweat"
        )
      : "";
    const leftFClause = af ? " as thick white cum overflows at the joined base" : "";
    const rightFClause = af
      ? " with cum stringing onto his flaccid penis below"
      : " above his flaccid penis below";
    const mpMode = cfg.multi_panel_mode;

    if (mpMode === "2koma") {
      if (isPov) {
        const pSingle = joinTags(
          "2.5::2koma::, 2.5::vertical split screen::, comic, two panels, vertical border, dividing line, gutter, 2girls, 2boys, same character, hetero",
          m.head_pos,
          m.char_core,
          "faceless male",
          m.bg_couch,
          "1.5::pov::, 1.4::pov crotch::, 1.3::from below::, low angle",
          "girl on top, kneeling, straddling, looking down, looking at viewer",
          m.outfit_pos,
          expTags,
          "rating:explicit, nsfw, uncensored",
          remFace,
          "cowgirl position, vaginal, insertion, after vaginal, penis, flaccid",
          m.anat_pos,
          actFluids,
          proseIf(
            cfg,
            `Two side-by-side POV panels of ${m.name} kneeling astraddle: left panel, seated in deep cowgirl insertion${leftFClause}; right panel, lifting her hips slightly upward after pulling out${rightFClause}.`
          ),
          wrapNeg("-2.5", "open mouth, cum in mouth, drooling, standing", negOn),
          wrapTailNeg(
            m,
            joinTags(
              "1girl, solo, single panel, from behind, reverse cowgirl, all fours, profile, male focus, 4koma, speech bubble",
              m.common_tail_neg
            ),
            negOn
          )
        );
        results.push({
          subTitle: "【S04 · 第一人称视角 (POV) · 仰视骑乘左右双格（左深坐溢流 ➔ 右微抬疲软）】",
          canvas: "横图 1216x832",
          prompt: pSingle,
        });

        if (cfg.include_sub_variants) {
          const baseMulti = joinTags(
            "2.5::2koma::, 2.5::vertical split screen::, comic, two panels, vertical border, dividing line, gutter, 2girls, 2boys, same character, hetero",
            m.head_pos,
            m.bg_couch,
            "1.5::pov::, 1.4::pov crotch::, 1.3::from below::, low angle, rating:explicit, nsfw, uncensored",
            wrapNeg("-2.5", "open mouth, cum in mouth, drooling", negOn),
            wrapTailNeg(
              m,
              joinTags(
                "from behind, reverse cowgirl, all fours, profile, male focus, 4koma, speech bubble",
                m.common_tail_neg
              ),
              negOn
            )
          );
          const c1 = joinTags(
            "girl, 1boy, faceless male",
            m.char_core,
            "pov crotch, penis, erection, 1.4::girl on top::, 1.4::cowgirl position::, kneeling, straddling, sitting on lap, hips down, hands on chest, knees apart, looking down, looking at viewer",
            m.outfit_pos,
            expTags,
            remFace,
            "vaginal, sex, 1.4::insertion::, deep penetration",
            c1F,
            m.anat_pos,
            proseIf(cfg, `Seated down in deep cowgirl insertion${leftFClause}.`),
            wrapNeg("-2.5", joinTags("open mouth, cum in mouth, standing, flaccid, after vaginal", m.canon_neg), negOn)
          );
          const c2 = joinTags(
            "girl, 1boy, faceless male",
            m.char_core,
            "pov crotch, penis, 1.4::flaccid::, girl on top, kneeling, straddling, 0.8::squatting::, hands on thighs, knees apart, looking down, looking at viewer",
            m.outfit_pos,
            expTags,
            remFace,
            "1.4::after vaginal::",
            m.anat_pos,
            c2F,
            proseIf(
              cfg,
              `Still kneeling astraddle him, she lifts her hips just slightly off by a few inches right after pulling out${rightFClause}.`
            ),
            wrapNeg("-2.5", joinTags("open mouth, cum in mouth, insertion, penetration, standing, erection", m.canon_neg), negOn)
          );
          results.push({
            subTitle: "【S04 · 第一人称多角色精准分区版 (Base + 左A3 + 右E3)】",
            canvas: "横图 1216x832",
            prompt: `[Base Prompt]:\n${baseMulti}\n\n[Character 1 (A3)]:\n${c1}\n\n[Character 2 (E3)]:\n${c2}`,
          });
        }
      } else {
        const p3rd = joinTags(
          "2.5::2koma::, 2.5::vertical split screen::, comic, two panels, vertical border, dividing line, gutter, 2girls, 2boys, same character, hetero",
          m.head_pos,
          m.char_core,
          "faceless male, head out of frame",
          m.on_couch_tag,
          m.bg_couch,
          "three-quarter view, from side, low angle",
          "1.4::girl on top::, 1.4::cowgirl position::, kneeling, straddling",
          m.leg_normal,
          m.outfit_pos,
          expTags,
          "rating:explicit, nsfw, uncensored",
          remFace,
          "vaginal, insertion, after vaginal, penis, flaccid",
          m.anat_pos,
          actFluids,
          proseIf(
            cfg,
            `Two side-by-side angled panels of ${m.name} straddling a faceless man${m.loc_prose}: left panel, seated deeply joined${leftFClause}; right panel, lifting her hips slightly after pulling out${rightFClause}.`
          ),
          wrapNeg("-2.5", "pov, pov crotch, open mouth, cum in mouth, drooling, standing", negOn),
          wrapTailNeg(
            m,
            joinTags("1girl, solo, single panel, all fours, male focus, 4koma, speech bubble", m.common_tail_neg),
            negOn
          )
        );
        results.push({
          subTitle: "【S04 · 第三人称视角 (客观镜头) · 侧斜旁观骑乘左右双格】",
          canvas: "横图 1216x832",
          prompt: p3rd,
        });
      }
    } else {
      const noSplitNeg = "2koma, 4koma, split screen, multiple views, comic, border, speech bubble";
      if (isPov) {
        const pA = joinTags(
          m.head_pos,
          "1girl, 1boy, hetero",
          m.char_core,
          "faceless male",
          m.bg_couch,
          "1.5::pov::, 1.4::pov crotch::, 1.3::from below::, low angle",
          "1.45::girl on top::, 1.45::cowgirl position::, kneeling, straddling, sitting on lap, hips down, hands on chest, knees apart, looking down, looking at viewer",
          m.outfit_pos,
          expTags,
          "rating:explicit, nsfw, uncensored",
          remFace,
          "vaginal, sex, 1.45::insertion::, deep penetration, penis, erection",
          m.anat_pos,
          c1F,
          proseIf(
            cfg,
            `Single full-frame first-person POV looking up at ${m.name} kneeling astraddle on top${m.loc_prose} seated deeply in cowgirl insertion${leftFClause}.`
          ),
          wrapNeg("-2.5", "open mouth, cum in mouth, drooling, standing, flaccid, after vaginal", negOn),
          wrapTailNeg(
            m,
            joinTags(noSplitNeg, "from behind, reverse cowgirl, all fours, profile, male focus", m.common_tail_neg),
            negOn
          )
        );
        const pB = joinTags(
          m.head_pos,
          "1girl, 1boy, hetero",
          m.char_core,
          "faceless male",
          m.bg_couch,
          "1.5::pov::, 1.4::pov crotch::, 1.3::from below::, low angle",
          "1.4::girl on top::, kneeling, straddling, 0.8::squatting::, hands on thighs, knees apart, looking down, looking at viewer",
          m.outfit_pos,
          expTags,
          "rating:explicit, nsfw, uncensored",
          remFace,
          "1.45::after vaginal::, pull out, penis, 1.4::flaccid::",
          m.anat_pos,
          c2F,
          proseIf(
            cfg,
            `Single full-frame first-person POV looking up at ${m.name} kneeling astraddle${m.loc_prose} lifting her hips slightly upward by a few inches right after pulling out${rightFClause}.`
          ),
          wrapNeg("-2.5", "open mouth, cum in mouth, drooling, standing, insertion, penetration, erection", negOn),
          wrapTailNeg(
            m,
            joinTags(noSplitNeg, "from behind, reverse cowgirl, all fours, profile, male focus", m.common_tail_neg),
            negOn
          )
        );
        if (mpMode === "single_a" || mpMode === "single_pair") {
          results.push({
            subTitle: "【S04 单图A · 第一人称 (POV) · 骑乘深坐结合溢流单幅】",
            canvas: "竖图 832x1216",
            prompt: pA,
          });
        }
        if (mpMode === "single_b" || mpMode === "single_pair") {
          results.push({
            subTitle: "【S04 单图B · 第一人称 (POV) · 骑乘微抬脱出疲软拉丝单幅】",
            canvas: "竖图 832x1216",
            prompt: pB,
          });
        }
      } else {
        const pA = joinTags(
          m.head_pos,
          "1girl, 1boy, hetero",
          m.char_core,
          "faceless male, head out of frame",
          m.on_couch_tag,
          m.bg_couch,
          "three-quarter view, from side, low angle",
          "1.45::girl on top::, 1.45::cowgirl position::, kneeling, straddling, sitting on lap, hips down",
          m.leg_normal,
          m.outfit_pos,
          expTags,
          "rating:explicit, nsfw, uncensored",
          remFace,
          "vaginal, sex, 1.45::insertion::, deep penetration, penis, erection",
          m.anat_pos,
          c1F,
          proseIf(
            cfg,
            `Single full-frame angled third-person view of ${m.name} straddling a faceless man${m.loc_prose} seated deeply in cowgirl insertion${leftFClause}.`
          ),
          wrapNeg("-2.5", "pov, pov crotch, open mouth, cum in mouth, drooling, standing, flaccid, after vaginal", negOn),
          wrapTailNeg(m, joinTags(noSplitNeg, "all fours, male focus", m.common_tail_neg), negOn)
        );
        const pB = joinTags(
          m.head_pos,
          "1girl, 1boy, hetero",
          m.char_core,
          "faceless male, head out of frame",
          m.on_couch_tag,
          m.bg_couch,
          "three-quarter view, from side, low angle",
          "1.4::girl on top::, 1.35::cowgirl position::, kneeling, straddling, 0.8::squatting::",
          m.leg_normal,
          m.outfit_pos,
          expTags,
          "rating:explicit, nsfw, uncensored",
          remFace,
          "1.45::after vaginal::, pull out, penis, 1.4::flaccid::",
          m.anat_pos,
          c2F,
          proseIf(
            cfg,
            `Single full-frame angled third-person view of ${m.name} straddling a faceless man${m.loc_prose} lifting her hips slightly off right after pulling out${rightFClause}.`
          ),
          wrapNeg("-2.5", "pov, pov crotch, open mouth, cum in mouth, drooling, standing, insertion, penetration, erection", negOn),
          wrapTailNeg(m, joinTags(noSplitNeg, "all fours, male focus", m.common_tail_neg), negOn)
        );
        if (mpMode === "single_a" || mpMode === "single_pair") {
          results.push({
            subTitle: "【S04 单图A · 第三人称 (客观镜头) · 侧斜旁观骑乘深坐溢流单幅】",
            canvas: "横图 1216x832",
            prompt: pA,
          });
        }
        if (mpMode === "single_b" || mpMode === "single_pair") {
          results.push({
            subTitle: "【S04 单图B · 第三人称 (客观镜头) · 侧斜旁观骑乘微抬拉丝单幅】",
            canvas: "横图 1216x832",
            prompt: pB,
          });
        }
      }
    }
  } else if (sceneId === "S05") {
    const m = buildCommonModules(cfg, defEyesOpen);
    const expTags = exprIf(cfg, ":p, tongue out, smug, furrowed brow, half-closed eyes, watery eyes, heavy blush, floating heart");
    const remFace = rem ? joinTags(wtag("cum on face", 1.3, f), wtag("cum in hair", 0.9, f)) : "";
    const actPee = af
      ? joinTags(
          "1.4::peeing::, urine, after vaginal, cum",
          wtag("excessive cum", 1.4, f),
          wtag("cum in pussy", 1.4, f),
          wtag("cumdrip", 1.4, f),
          "cum string",
          wtag("puddle", 1.35, f),
          "sweat"
        )
      : "";
    const peeClause = af
      ? " as she pees a stream and thick white cum drips heavily into a messy puddle below"
      : "";

    if (isPov) {
      const pPov = joinTags(
        m.head_pos,
        "1girl, solo",
        m.char_id,
        "2.2::leg up::, 2.0::knee up::, 1.5::on one knee::, leaning forward",
        m.hands_couch_tag,
        "arched back, spread legs",
        m.char_rest,
        m.bg_couch,
        "1.45::pov::, 1.4::from behind::, close-up, foreshortening, low angle",
        m.leg_normal,
        "looking back, looking at viewer",
        m.outfit_pos,
        expTags,
        "rating:explicit, nsfw, uncensored",
        remFace,
        "ass",
        m.anat_pos,
        actPee,
        proseIf(
          cfg,
          `Close-up first-person POV right behind ${m.name}${m.loc_prose} leaning on her hands and left knee while raising her bent right knee high out to the side like a dog peeing, looking back at the viewer${peeClause}.`
        ),
        wrapTailNeg(
          m,
          joinTags("knees up, all fours, knees together, standing, sitting, seiza, 1boy, penis, profile", m.common_tail_neg),
          negOn
        )
      );
      results.push({
        subTitle: "【S05 · 第一人称视角 (POV) · 近距俯看犬式单腿屈膝高抬】",
        canvas: "横图 1216x832 或 竖图 832x1216",
        prompt: pPov,
      });
    } else {
      const pCouch = joinTags(
        m.head_pos,
        "1girl, solo",
        m.char_id,
        "2.2::leg up::, 2.0::knee up::, 1.5::on one knee::, leaning forward",
        m.hands_couch_tag,
        "arched back, spread legs",
        m.char_rest,
        m.bg_couch,
        "full body, 1.5::from behind::, 0.6::from side::, low angle, perspective, foreshortening",
        m.leg_normal,
        "looking back, looking at viewer",
        m.outfit_pos,
        expTags,
        "rating:explicit, nsfw, uncensored",
        remFace,
        "ass",
        m.anat_pos,
        actPee,
        proseIf(
          cfg,
          `Rear three-quarter low-angle perspective angled 30 degrees along ${m.name}'s spine, leaning forward on her hands and left knee${m.loc_prose} while raising her bent right knee high out to the side like a dog peeing, looking back over her shoulder${peeClause}.`
        ),
        wrapTailNeg(
          m,
          joinTags("pov, knees up, all fours, knees together, standing, sitting, seiza, 1boy, penis, profile", m.common_tail_neg),
          negOn
        )
      );
      results.push({
        subTitle: "【S05 · 第三人称视角 (客观镜头) · 侧后 30° 全景犬式屈膝高抬】",
        canvas: "横图 1216x832",
        prompt: pCouch,
      });
    }
  } else if (sceneId === "S06") {
    const m = buildCommonModules(cfg, sleepEyesOpen, true);
    const expTags = exprIf(cfg, "exhausted, parted lips, heavy blush", "1.5::sleeping::, 1.4::closed eyes::, relaxed", sceneId);
    const stomachFluid = af
      ? joinTags(
          wtag("cum on stomach", 1.55, f),
          m.covers_midriff ? wtag("cum on clothes", 1.45, f) : "",
          "after vaginal, cum",
          wtag("cum in pussy", 1.3, f),
          wtag("cumdrip", 1.3, f),
          "cum on thighs, sweat"
        )
      : "";
    const remFace = rem ? joinTags(wtag("cum on face", 1.3, f), wtag("cum in hair", 0.9, f)) : "";
    const poolClause = af ? `${m.stomach_pool_prose} while cum oozes between her relaxed parted thighs` : "";

    if (isPov) {
      const pPov = joinTags(
        m.head_pos,
        "1girl, solo",
        m.char_core,
        m.bg_sleep_couch,
        "1.45::pov::, 1.4::from above::, foreshortening",
        "1.4::lying::, 1.3::on back::",
        m.on_couch_tag,
        expTags,
        "spread legs, knees slightly bent",
        m.leg_normal,
        m.outfit_pos,
        m.belly_tags_s06_11,
        "rating:explicit, nsfw, uncensored",
        remFace,
        stomachFluid,
        m.anat_pos,
        proseIf(
          cfg,
          `First-person POV looking directly down over ${m.name} fast asleep lying on her back${m.loc_prose} with closed eyes${poolClause}.`
        ),
        wrapNeg("-2.5", "open eyes, half-closed eyes, looking at viewer, sitting, standing, all fours, kneeling, peeing", negOn),
        wrapTailNeg(m, joinTags("1boy, penis", m.common_tail_neg), negOn)
      );
      results.push({
        subTitle: "【S06 · 第一人称视角 (POV) · 近距俯视仰躺熟睡与小腹积液】",
        canvas: "竖图 832x1216",
        prompt: pPov,
      });
    } else {
      const pBack = joinTags(
        m.head_pos,
        "1girl, solo",
        m.char_core,
        m.bg_sleep_couch,
        "full body, angled view, 1.4::lying::, 1.3::on back::",
        m.on_couch_tag,
        expTags,
        "spread legs, knees slightly bent",
        m.leg_normal,
        m.outfit_pos,
        m.belly_tags_s06_11,
        "rating:explicit, nsfw, uncensored",
        remFace,
        stomachFluid,
        m.anat_pos,
        proseIf(
          cfg,
          `Full-body angled third-person view of ${m.name} fast asleep lying on her back${m.loc_prose} with closed eyes${poolClause}.`
        ),
        wrapNeg("-2.5", "pov, open eyes, half-closed eyes, looking at viewer, sitting, standing, all fours, kneeling, peeing", negOn),
        wrapTailNeg(m, joinTags("1boy, penis", m.common_tail_neg), negOn)
      );
      results.push({
        subTitle: "【S06 · 第三人称视角 (客观镜头) · 全景仰卧熟睡 + 小腹积液】",
        canvas: "横图 1216x832",
        prompt: pBack,
      });
    }
  } else if (sceneId === "S07") {
    const m = buildCommonModules(cfg, sleepEyesOpen, true);
    const expTags = exprIf(cfg, "exhausted, parted lips, heavy blush", "1.5::sleeping::, 1.4::closed eyes::, sleep, relaxed", sceneId);
    const isBarefootHold = m.leg_foot.includes("barefoot");
    const footFluids = af
      ? joinTags(
          wtag("cum on feet", 1.6, f),
          isBarefootHold ? wtag("cum on toes, cum string", 1.4, f) : wtag("cum string", 1.4, f),
          "cum on penis",
          wtag("excessive cum", 1.3, f),
          "sweat"
        )
      : "";
    const remAll = rem
      ? joinTags(
          wtag("cum on face, cum in pussy, cumdrip", 1.3, f),
          wtag("cum in hair", 0.9, f),
          wtag(m.stomach_rem_tag, 1.4, f),
          "after vaginal, cum"
        )
      : "";
    const footFClause = af ? ", coated in cum strings" : "";
    const remClause = rem ? `, with cum${m.stomach_rem_prose}` : "";

    if (isPov) {
      const pFpv = joinTags(
        m.head_pos,
        "1girl, 1boy, hetero",
        m.char_core,
        "faceless male",
        m.bg_sleep_couch,
        "1.45::pov::, pov crotch, pov hands, foreshortening",
        "1.4::lying::, 1.3::on back::",
        m.on_couch_tag,
        expTags,
        "1.3::indian style::, knees apart, bent knees",
        m.leg_foot,
        "1.5::footjob::, 1.4::holding feet::, grabbing another's foot, penis, erection",
        m.outfit_pos,
        m.belly_tags,
        "rating:explicit, nsfw, uncensored",
        footFluids,
        remAll,
        m.anat_pos,
        proseIf(
          cfg,
          `First-person POV grabbing sleeping ${m.name}'s ${m.leg_prose} soles-together in a cross-legged pose for a footjob${footFClause}${remClause}.`
        ),
        wrapNeg("-2.5", "open eyes, half-closed eyes, looking at viewer, sitting, standing, all fours", negOn),
        wrapTailNeg(m, joinTags("male focus", m.common_tail_neg), negOn)
      );
      results.push({
        subTitle: "【S07 · 第一人称视角 (POV) · 男方脚端双手抓握双脚足交】",
        canvas: "竖图 832x1216",
        prompt: pFpv,
      });
    } else {
      const p3rd = joinTags(
        m.head_pos,
        "1girl, 1boy, hetero",
        m.char_core,
        "faceless male, head out of frame",
        m.bg_sleep_couch,
        "full body, angled view, from side, 1.4::lying::, 1.3::on back::",
        m.on_couch_tag,
        expTags,
        "1.3::indian style::, knees apart, bent knees",
        m.leg_foot,
        "1.5::footjob::, 1.4::holding feet::, grabbing another's foot, penis, erection",
        m.outfit_pos,
        m.belly_tags,
        "rating:explicit, nsfw, uncensored",
        footFluids,
        remAll,
        m.anat_pos,
        proseIf(
          cfg,
          `Angled view${m.loc_prose}: sleeping ${m.name} lies cross-legged on her back while a faceless man grabs her ${m.leg_prose} soles-together for a footjob${footFClause}${remClause}.`
        ),
        wrapNeg("-2.5", "pov, pov hands, open eyes, half-closed eyes, looking at viewer, sitting, standing, all fours", negOn),
        wrapTailNeg(m, joinTags("male focus", m.common_tail_neg), negOn)
      );
      results.push({
        subTitle: "【S07 · 第三人称视角 (客观镜头) · 侧斜全景熟睡盘腿抓脚足交】",
        canvas: "横图 1216x832",
        prompt: p3rd,
      });
    }
  } else if (sceneId === "S08") {
    const m = buildCommonModules(cfg, defEyesOpen, true);
    const expTags = exprIf(
      cfg,
      "1.3::bedroom eyes::, 1.2::seductive smile::, parted lips, heavy blush, exhausted",
      "waking up, 1.35::sleepy::, 1.45::half-closed eyes::"
    );
    const isBarefootHold = m.leg_foot.includes("barefoot");
    const footFluids = af
      ? joinTags(
          wtag("cum on feet", 1.6, f),
          isBarefootHold ? wtag("cum on toes", 1.4, f) : "",
          wtag("cum string", 1.4, f),
          "cum on penis",
          wtag("excessive cum", 1.3, f),
          "sweat"
        )
      : "";
    const remAll = rem
      ? joinTags(
          wtag("cum on face", 1.3, f),
          wtag("cum in hair", 0.9, f),
          wtag(m.stomach_rem_tag, 1.4, f),
          "after vaginal, cum",
          wtag("cum in pussy", 1.3, f),
          wtag("cumdrip", 1.3, f)
        )
      : "";
    const footFClause = af ? ", coated in cum strings" : "";

    if (isPov) {
      const pFpv = joinTags(
        m.head_pos,
        "1girl, 1boy, hetero",
        m.char_core,
        "faceless male",
        m.bg_sleep_couch,
        "1.45::pov::, pov crotch, pov hands, foreshortening",
        "1.4::lying::, 1.3::on back::",
        m.on_couch_tag,
        "relaxed",
        expTags,
        "looking at viewer, looking down",
        "1.3::indian style::, knees apart, bent knees",
        m.leg_foot,
        "1.5::footjob::, 1.4::holding feet::, grabbing another's foot, penis, erection",
        m.outfit_pos,
        m.belly_tags,
        "rating:explicit, nsfw, uncensored",
        footFluids,
        remAll,
        m.anat_pos,
        proseIf(
          cfg,
          `First-person POV grabbing ${m.name}'s ${m.leg_prose} soles-together for a footjob${footFClause} as she stirs awake gazing drowsily down.`
        ),
        wrapNeg("-2.5", "closed eyes, sleeping, wide-eyed, ahegao, sitting, standing, all fours", negOn),
        wrapTailNeg(m, joinTags("male focus", m.common_tail_neg), negOn)
      );
      results.push({
        subTitle: "【S08 · 第一人称视角 (POV) · 抓脚互动中刚醒迷离睡眼望向你】",
        canvas: "竖图 832x1216",
        prompt: pFpv,
      });
    } else {
      const p3rd = joinTags(
        m.head_pos,
        "1girl, 1boy, hetero",
        m.char_core,
        "faceless male, head out of frame",
        m.bg_sleep_couch,
        "full body, angled view, from side, 1.4::lying::, 1.3::on back::",
        m.on_couch_tag,
        "relaxed",
        expTags,
        "looking at another, looking down, sideways glance",
        "1.3::indian style::, knees apart, bent knees",
        m.leg_foot,
        "1.5::footjob::, 1.4::holding feet::, grabbing another's foot, penis, erection",
        m.outfit_pos,
        m.belly_tags,
        "rating:explicit, nsfw, uncensored",
        footFluids,
        remAll,
        m.anat_pos,
        proseIf(
          cfg,
          `Angled view${m.loc_prose}: stirred awake on her back, ${m.name} gazes drowsily down as a faceless man grabs her ${m.leg_prose} soles-together for a footjob${footFClause}.`
        ),
        wrapNeg("-2.5", "pov, pov hands, closed eyes, sleeping, wide-eyed, ahegao, sitting, standing, all fours", negOn),
        wrapTailNeg(m, joinTags("male focus", m.common_tail_neg), negOn)
      );
      results.push({
        subTitle: "【S08 · 第三人称视角 (客观镜头) · 侧斜全景被弄醒睡眼朝脚端瞥去】",
        canvas: "横图 1216x832",
        prompt: p3rd,
      });
    }
  } else if (sceneId === "S09") {
    const m = buildCommonModules(cfg, defEyesOpen, true);
    const expTags = exprIf(
      cfg,
      "1.35::bedroom eyes::, 1.15::seductive smile::, parted lips, heavy blush",
      "1.3::sleepy::, 1.4::half-closed eyes::"
    );
    const remAll = rem
      ? joinTags(
          "cum",
          wtag("excessive cum, cum on face", 1.6, f),
          wtag("cum in hair", 1.2, f),
          wtag(m.stomach_rem_tag, 1.7, f),
          "cum on body",
          "after vaginal",
          wtag("cum string, cumdrip, cum in pussy, cum overflow", 1.5, f),
          "sweat"
        )
      : "";
    const remClause = rem ? `, with cum on her cheek and pooled${m.stomach_rem_prose}` : "";

    if (isPov) {
      const pPov = joinTags(
        m.head_pos,
        "1girl, 1boy, hetero",
        m.char_core,
        "faceless male",
        m.bg_sleep_couch,
        "1.5::pov::, 1.4::from above::, pov hands, reaching out",
        "1.4::lying::, 1.3::on back::",
        m.on_couch_tag,
        "neck, collarbone, 1.55::hand on another's neck::",
        expTags,
        "looking at viewer, looking up, head tilt",
        m.outfit_pos,
        m.belly_tags,
        "rating:explicit, nsfw, uncensored",
        remAll,
        m.anat_pos,
        proseIf(
          cfg,
          `First-person POV from above ${m.name} lying on her back${m.loc_prose}: a hand reaches in to gently clasp her neck as she gazes up with drowsy half-closed eyes${remClause}.`
        ),
        wrapNeg("-2.5", "closed eyes, sleeping, wide-eyed, ahegao, tongue out, sitting, standing, all fours, footjob", negOn),
        wrapTailNeg(m, joinTags("male focus", m.common_tail_neg), negOn)
      );
      results.push({
        subTitle: "【S09 · 第一人称视角 (POV) · 正上方俯视单手轻拢脖颈】",
        canvas: "竖图 832x1216",
        prompt: pPov,
      });
    } else {
      const p3rd = joinTags(
        m.head_pos,
        "1girl, 1boy, hetero",
        m.char_core,
        "faceless male, head out of frame, leaning over",
        m.bg_sleep_couch,
        "three-quarter view, from side, 1.4::lying::, 1.3::on back::",
        m.on_couch_tag,
        "neck, collarbone, 1.55::hand on another's neck::",
        expTags,
        "looking at another, looking up, head tilt",
        m.outfit_pos,
        m.belly_tags,
        "rating:explicit, nsfw, uncensored",
        remAll,
        m.anat_pos,
        proseIf(
          cfg,
          `Angled side view${m.loc_prose}: a faceless man leans over ${m.name} and gently clasps one hand around her neck as she gazes up drowsily${remClause}.`
        ),
        wrapNeg("-2.5", "pov, pov hands, closed eyes, sleeping, wide-eyed, ahegao, tongue out, sitting, standing, all fours, footjob", negOn),
        wrapTailNeg(m, joinTags("male focus", m.common_tail_neg), negOn)
      );
      results.push({
        subTitle: "【S09 · 第三人称视角 (客观镜头) · 侧斜近景男方欺身单手轻拢脖颈】",
        canvas: "横图 1216x832",
        prompt: p3rd,
      });
    }
  } else if (sceneId === "S10") {
    const m = buildCommonModules(cfg, defEyesOpen, true);
    const expTags = exprIf(
      cfg,
      "1.35::bedroom eyes::, 1.15::seductive smile::, parted lips, heavy blush",
      "1.3::sleepy::, 1.4::half-closed eyes::"
    );
    const actF = af ? joinTags(wtag("cum overflow, cum string, cumdrip", 1.5, f), "sweat") : "";
    const isBarefootHold = m.leg_foot.includes("barefoot");
    const remAll = rem
      ? joinTags(
          "cum",
          wtag("excessive cum", 1.65, f),
          wtag("cum on face", 1.6, f),
          wtag("cum in hair", 1.2, f),
          wtag(m.stomach_rem_tag, 1.7, f),
          "cum on body",
          wtag("cum on feet", 1.55, f),
          isBarefootHold ? wtag("cum on toes", 1.35, f) : ""
        )
      : "";
    const remMidWord = m.covers_midriff ? "clothes" : "stomach";
    const remClause = rem
      ? `, with cum on her cheek, ${remMidWord}${m.outfit_prose_clause}, and ${m.leg_prose}`
      : "";

    if (isPov) {
      const pPov = joinTags(
        m.head_pos,
        "1girl, 1boy, hetero",
        m.char_core,
        "faceless male",
        m.bg_sleep_couch,
        "1.5::pov::, 1.4::from above::, pov hands, pov crotch, foreshortening",
        "1.4::lying::, 1.3::on back::",
        m.on_couch_tag,
        "1.35::missionary::, spread legs, bent knees",
        m.leg_normal,
        "neck, collarbone, 1.55::hand on another's neck::",
        expTags,
        "looking at viewer, looking up",
        m.outfit_pos,
        m.belly_tags,
        "rating:explicit, nsfw, uncensored, sex, vaginal, penis, insertion",
        remAll,
        actF,
        m.anat_pos,
        proseIf(
          cfg,
          `First-person missionary POV above ${m.name} on her back${m.loc_prose}: pressing between her open legs while one hand gently clasps her neck as she gazes up drowsily${remClause}.`
        ),
        wrapNeg("-2.5", "closed eyes, sleeping, wide-eyed, ahegao, tongue out, sitting, standing, all fours, footjob", negOn),
        wrapTailNeg(m, joinTags("male focus", m.common_tail_neg), negOn)
      );
      results.push({
        subTitle: "【S10 · 第一人称视角 (POV) · 传教士俯视压身深入 + 单手轻拢脖颈】",
        canvas: "竖图 832x1216",
        prompt: pPov,
      });
    } else {
      const p3rd = joinTags(
        m.head_pos,
        "1girl, 1boy, hetero",
        m.char_core,
        "faceless male, head out of frame, boy on top",
        m.bg_sleep_couch,
        "three-quarter view, from side, 1.4::lying::, 1.3::on back::",
        m.on_couch_tag,
        "1.5::missionary::, spread legs, bent knees",
        m.leg_normal,
        "neck, collarbone, 1.55::hand on another's neck::",
        expTags,
        "looking at another, looking up",
        m.outfit_pos,
        m.belly_tags,
        "rating:explicit, nsfw, uncensored, sex, vaginal, penis, insertion",
        remAll,
        actF,
        m.anat_pos,
        proseIf(
          cfg,
          `Angled side view${m.loc_prose}: a faceless man presses between ${m.name}'s open bent legs in missionary while one hand gently clasps her neck${remClause}.`
        ),
        wrapNeg("-2.5", "pov, pov hands, pov crotch, closed eyes, sleeping, wide-eyed, ahegao, tongue out, sitting, standing, all fours, footjob", negOn),
        wrapTailNeg(m, joinTags("male focus", m.common_tail_neg), negOn)
      );
      results.push({
        subTitle: "【S10 · 第三人称视角 (客观镜头) · 侧斜全景传教士深入 + 单手轻拢脖颈】",
        canvas: "横图 1216x832",
        prompt: p3rd,
      });
    }
  } else if (sceneId === "S11") {
    const m = buildCommonModules(cfg, defEyesOpen, true);
    const expTags = exprIf(
      cfg,
      "1.35::bedroom eyes::, 1.15::seductive smile::, parted lips, heavy blush, trembling",
      "1.25::sleepy::, 1.4::half-closed eyes::"
    );
    const actEjac = af
      ? joinTags(
          wtag("ejaculation", 1.65, f),
          wtag("projectile cum", 1.55, f),
          wtag("excessive cum", 1.75, f),
          wtag("cum on pussy", 1.6, f),
          wtag("cum on stomach", 1.85, f),
          m.covers_midriff ? wtag("cum on clothes", 1.55, f) : "",
          wtag("cum string", 1.55, f),
          wtag("cumdrip", 1.5, f),
          "sweat"
        )
      : "";
    const isBarefootHold = m.leg_foot.includes("barefoot");
    const remOld = rem
      ? joinTags(
          wtag("cum on face", 1.3, f),
          wtag("cum in hair", 1.1, f),
          wtag("cum on feet", 1.5, f),
          isBarefootHold ? wtag("cum on toes", 1.3, f) : "",
          wtag("cum in pussy", 1.45, f),
          wtag("cum overflow", 1.45, f)
        )
      : "";
    const ejacClause = af
      ? m.covers_midriff
        ? " shooting cum onto her vulva and outfit"
        : " shooting cum onto her vulva and bare stomach"
      : "";

    if (isPov) {
      const pStd = joinTags(
        m.head_pos,
        "1girl, 1boy, hetero",
        m.char_core,
        "faceless male",
        m.bg_sleep_couch,
        "1.6::missionary::, 1.45::pov::, 1.35::from above::, 1.4::pov crotch::, pov hands, foreshortening",
        "1.4::lying::, 1.3::on back::",
        m.on_couch_tag,
        "1.4::spread legs::, bent knees",
        m.leg_normal,
        "neck, 1.5::hand on another's neck::",
        expTags,
        "looking at viewer, looking up",
        m.outfit_pos,
        m.belly_tags_s06_11,
        "rating:explicit, nsfw, uncensored, after vaginal, pull out, penis, erection, twitching penis",
        actEjac,
        remOld,
        m.anat_pos,
        proseIf(
          cfg,
          `First-person missionary POV between ${m.name}'s open legs${m.loc_prose}: clasping her neck, he pulls out${ejacClause}.`
        ),
        wrapNeg("-2.5", "facial, penis on face, oral, fellatio, internal cumshot, insertion, closed eyes, sleeping, wide-eyed, ahegao, tongue out, sitting, standing, all fours, footjob", negOn),
        wrapTailNeg(m, joinTags("male focus", m.common_tail_neg), negOn)
      );
      results.push({
        subTitle: "【S11 · 第一人称视角 (POV) · 传教士双腿间刚拔出外射标准版】",
        canvas: "竖图 832x1216",
        prompt: pStd,
      });
      if (cfg.include_sub_variants) {
        const pLegsUp = pStd
          .replace("1.6::missionary::", "1.65::missionary::")
          .replace("1.4::spread legs::, bent knees", "1.4::spread legs::, 1.3::legs up::, knees up");
        results.push({
          subTitle: "【S11 · 第一人称备选 · 双腿抬高环腰强化版 (`legs up`)】",
          canvas: "竖图 832x1216",
          prompt: pLegsUp,
        });
      }
    } else {
      const p3rd = joinTags(
        m.head_pos,
        "1girl, 1boy, hetero",
        m.char_core,
        "faceless male, head out of frame, boy on top",
        m.bg_sleep_couch,
        "three-quarter view, from side, 1.55::missionary::, 1.4::lying::, 1.3::on back::",
        m.on_couch_tag,
        "1.4::spread legs::, bent knees",
        m.leg_normal,
        "neck, 1.5::hand on another's neck::",
        expTags,
        "looking at another, looking up",
        m.outfit_pos,
        m.belly_tags_s06_11,
        "rating:explicit, nsfw, uncensored, after vaginal, pull out, penis, erection, twitching penis",
        actEjac,
        remOld,
        m.anat_pos,
        proseIf(
          cfg,
          `Angled missionary view${m.loc_prose}: clasping ${m.name}'s neck between her open legs, the faceless man pulls out${ejacClause}.`
        ),
        wrapNeg("-2.5", "pov, pov hands, pov crotch, facial, penis on face, oral, fellatio, internal cumshot, insertion, closed eyes, sleeping, wide-eyed, ahegao, tongue out, sitting, standing, all fours, footjob", negOn),
        wrapTailNeg(m, joinTags("male focus", m.common_tail_neg), negOn)
      );
      results.push({
        subTitle: "【S11 · 第三人称视角 (客观镜头) · 侧斜全景传教士双腿间拔出外射】",
        canvas: "横图 1216x832",
        prompt: p3rd,
      });
    }
  }

  // Post-pass 0: Global Character Expression Override
  if (exprCtrl.active) {
    results = results.map((item) => ({
      subTitle: `${item.subTitle} · [😊${exprCtrl.short_label}]`,
      canvas: item.canvas,
      prompt: applyExpressionToPrompt(item.prompt, exprCtrl, cfg.enable_t5_prose, negOn),
    }));
  }

  // Post-pass 1: Global 3D Camera Override
  if (cfg.cam_enable_override && sceneId !== "MA0") {
    const shotCode = CAMERA_SHOT_PRESETS[cfg.cam_shot_preset] ?? "auto";
    const gazeCode = CAMERA_GAZE_PRESETS[cfg.cam_gaze_preset] ?? "auto_look";
    const shortCam = describeCameraShort(
      true,
      cfg.cam_azimuth,
      cfg.cam_elevation,
      shotCode,
      cfg.cam_wide_lens,
      cfg.cam_dutch_angle
    );
    const eyesClosed = exprCtrl.active ? !exprCtrl.eyes_open : sceneId === "S06" || sceneId === "S07";
    results = results.map((item) => ({
      subTitle: `${item.subTitle} · [🎥${shortCam}]`,
      canvas: item.canvas,
      prompt: applyCameraOverrideToPrompt(item.prompt, {
        azimuth: cfg.cam_azimuth,
        elevation: cfg.cam_elevation,
        shotCode,
        wideLens: cfg.cam_wide_lens,
        dutchAngle: cfg.cam_dutch_angle,
        gazeCode,
        eyesClosedScene: eyesClosed,
      }),
    }));
  }

  // Post-pass 2: M6 sweat-stripping pass
  if (isM6SoftMorningSkinActive(cfg)) {
    const wantsSweat =
      cfg.add_extra_sweat || (SKIN_PRESETS[cfg.skin_preset] || "").includes("shiny skin");
    if (!wantsSweat) {
      results = results.map((item) => {
        let cleanedP = item.prompt.replace(/(?:,\s*)?(?:\d+(?:\.\d+)?::)?sweat(?:::)?(?=\s*,|$)/g, "");
        cleanedP = cleanedP.replace(/^\s*sweat\s*,\s*/, "");
        return { ...item, prompt: cleanedP };
      });
    }
  }

  // Post-pass 3: C5 low-res pixel canvas annotation pass
  if (isC5LowresPixelStyleActive(cfg)) {
    results = results.map((item) => ({
      ...item,
      canvas: item.canvas.startsWith("竖图")
        ? "像素竖图 384x512 (原生直出 ➔ 自动3x硬放大 1152x1536)"
        : "像素横图 512x384 (原生直出 ➔ 自动3x硬放大 1536x1152)",
    }));
  }

  return results;
}

export function describeActiveModules(cfg: CharacterConfig): string {
  const offList: string[] = [];
  const mapping: Array<[boolean, string]> = [
    [cfg.enable_quality, "质量"],
    [cfg.enable_style, "画风"],
    [cfg.enable_identity, "角色身份"],
    [cfg.enable_body, "体型肤色"],
    [cfg.enable_outfit, "服装款式"],
    [cfg.enable_clothing_state, "掀衣暴露辅助"],
    [cfg.enable_legwear, "鞋袜"],
    [cfg.enable_background, "背景"],
    [cfg.enable_expression, "微表情"],
    [cfg.enable_anatomy, "局部四维"],
    [cfg.enable_action_fluids, "本幕流体"],
    [cfg.enable_remnants, "跨幕残留"],
    [cfg.enable_t5_prose, "T5描述句"],
    [cfg.enable_negatives, "负向词"],
  ];
  for (const [flag, name] of mapping) {
    if (!flag) offList.push(name);
  }
  const stageCode = POS_STAGE_PRESETS[cfg.pos_stage] ?? "before";
  const stageNote = stageCode !== "before" ? ` | 💦体位阶段:${stageCode}` : "";
  if (offList.length === 0) return `全量直出模式（全部模块 ON）${stageNote}`;
  return `精密参照减负模式（已 OFF：${offList.join(" / ")}）${stageNote}`;
}

export function buildSingleTrackBlocks(
  cfg: CharacterConfig,
  selectedIds: string[],
  trackMode: PerspectiveMode,
  pureBatch: boolean
): string[] {
  const trackLabel =
    trackMode === "pov"
      ? "👁️ 第一人称视角卷 (First-Person POV)"
      : "🎥 第三人称视角卷 (Third-Person Objective)";
  const allChapters = [...STORY_CHAPTERS, ...MULTI_ANGLE_CHAPTERS, ...ALL_POSITIONS_CHAPTERS];
  const selectedSet = new Set(selectedIds);

  if (pureBatch) {
    const lines: string[] = [];
    for (const ch of allChapters) {
      if (!selectedSet.has(ch.id)) continue;
      for (const item of generateScenePrompts(ch.id, cfg, trackMode)) {
        if (item.prompt.startsWith("[Base Prompt]")) continue;
        lines.push(item.prompt);
      }
    }
    return lines;
  }

  const whoStr = cfg.enable_identity
    ? `${cfg.preset_name} (${cfg.char_tag})`
    : "精密参照接管角色 (Character Identity OFF)";
  const blocks: string[] = [
    "# ==========================================================================",
    `# 🎬 ${trackLabel} — 角色：${whoStr}`,
    `# 🎛️ 模块状态：${describeActiveModules(cfg)}`,
    "# ==========================================================================\n",
  ];
  for (const ch of allChapters) {
    if (!selectedSet.has(ch.id)) continue;
    const items = generateScenePrompts(ch.id, cfg, trackMode);
    const firstCanvas = items[0]?.canvas || "";
    blocks.push("# --------------------------------------------------------------------------");
    blocks.push(`# 📌 ${ch.title}  |  视角：${trackLabel}  |  推荐画布：${firstCanvas}`);
    blocks.push("# --------------------------------------------------------------------------");
    for (const item of items) {
      blocks.push(`## ${item.subTitle}（画布：{${item.canvas}}）：`.replace(`{${item.canvas}}`, item.canvas));
      blocks.push(item.prompt);
      blocks.push("");
    }
  }
  return blocks;
}

export function generateFullSuite(
  cfg: CharacterConfig,
  selectedIds: string[],
  pureBatchLines = false,
  exportBothSeparated = false
): string {
  if (exportBothSeparated) {
    const povPart = buildSingleTrackBlocks(cfg, selectedIds, "pov", pureBatchLines);
    const trdPart = buildSingleTrackBlocks(cfg, selectedIds, "3rd", pureBatchLines);
    if (pureBatchLines) {
      return [...povPart, ...trdPart].join("\n");
    }
    return [...povPart, "\n\n", ...trdPart].join("\n");
  }
  return buildSingleTrackBlocks(cfg, selectedIds, cfg.perspective_mode, pureBatchLines).join("\n");
}
