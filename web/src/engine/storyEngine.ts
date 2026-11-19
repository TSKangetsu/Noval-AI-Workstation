import {
  ALL_POSITIONS_CHAPTERS,
  ALL_POSITIONS_TEMPLATES,
  BODY_PRESETS,
  BUILTIN_CHARACTERS,
  BUST_PRESETS,
  ENV_PRESETS,
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
  LIGHTING_PRESETS,
  MORPH_PRESETS,
  MULTI_ANGLE_CHAPTERS,
  MULTI_ANGLE_TEMPLATES,
  OUTFIT_PRESETS,
  OUTFIT_STATE_PRESETS,
  PIGMENT_PRESETS,
  POS_MALE_MODE_PRESETS,
  POS_SCENE_PRESETS,
  POS_STAGE_PRESETS,
  PUBIC_PRESETS,
  QUALITY_TAGS,
  SKIN_PRESETS,
  STYLE_PRESETS,
} from "../data/engineConstants";
import {
  applySmartQualitySuffix,
  countPromptT5Tokens,
  splitPromptPosAndNeg,
} from "./t5Tokenizer";
import type {
  CharacterConfig,
  CharacterGenderMode,
  PerspectiveMode,
  ScenePromptItem,
} from "./types";

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
  const cleaned = tagsStr
    .replace(/-?\d+(?:\.\d+)?::([\s\S]*?)::/g, "$1")
    .trim()
    .replace(/^,+|,+$/g, "");
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

export function isGalDakimakuraCgStyleActive(cfg: CharacterConfig): boolean {
  if (!cfg.enable_style) return false;
  return cfg.style_preset.includes("Gal抱枕CG风") || cfg.style_preset.includes("sakura yuki 0.60");
}

export function isPocketMiniLadyBodyActive(cfg: CharacterConfig): boolean {
  if (!cfg.enable_body) return false;
  return (
    cfg.body_preset.includes("袖珍娇小窄肩细腰笔直长腿") ||
    cfg.body_preset.includes("short slender mini-lady")
  );
}

export function isMilkyPeachCelStyleActive(cfg: CharacterConfig): boolean {
  if (!cfg.enable_style) return false;
  return cfg.style_preset.includes("izuoku 0.28") || cfg.style_preset.includes("清透奶桃纤柔赛璐璐");
}

function is25dCelLightingCode(code: string | undefined): boolean {
  return code === "cool_warm_25d_cel" || code === "milky_peach_3tier_cel";
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
  const eyesOpen = !(
    lowBare.has("closed eyes") ||
    lowBare.has("squeezed eyes") ||
    lowBare.has("sleeping")
  );

  const negUnblock = new Set<string>();
  const negAdd: string[] = [];
  if (eyesOpen) {
    negUnblock.add("open eyes");
    negUnblock.add("half-closed eyes");
    negUnblock.add("looking at viewer");
    negAdd.push("closed eyes", "sleeping");
  } else {
    negUnblock.add("closed eyes");
    negUnblock.add("squeezed eyes");
    negUnblock.add("sleeping");
    negUnblock.add("sleep");
    negAdd.push("open eyes", "half-closed eyes");
  }

  if (lowBare.has("ahegao")) negUnblock.add("ahegao");
  if (lowBare.has("tongue out") || lowBare.has(":p") || lowBare.has("licking lips")) {
    negUnblock.add("tongue out");
  }
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
  else if (mouthCode === "cat_mouth_w") extraProse.push("a cute cat-like :3 smile");

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
    .replace(/(?:,\s*)?(-\d+(?:\.\d+)?)::([\s\S]*?)::/g, (fullMatch, lvl: string, rawBody: string) => {
      if (Math.abs(parseFloat(lvl)) < 1.0) {
        return fullMatch;
      }
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

export function proseIf(
  cfg: CharacterConfig,
  text: string,
  transparentBg = false,
  suppressFaceProse = false
): string {
  if (!cfg.enable_t5_prose) return "";
  let body = text.trim();
  if (!body) return "";
  const hasCustomLight =
    (LIGHTING_PRESETS[cfg.lighting_preset]?.code ?? "auto") !== "auto";
  const is25dCelLight = is25dCelLightingCode(LIGHTING_PRESETS[cfg.lighting_preset]?.code);
  if (isPocketMiniLadyBodyActive(cfg) && !is25dCelLight) {
    body =
      (suppressFaceProse
        ? "Pocket-sized slender mini-lady proportions with a slim petite body, narrow shoulders, tiny waist, trim narrow hips, and straight slender legs with a thigh gap; "
        : "Pocket-sized slender mini-lady proportions with a cute large head, slim petite body, narrow shoulders, tiny waist, trim narrow hips, and straight slender legs with a thigh gap; ") +
      body;
  }
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
    const lightClause = hasCustomLight
      ? ""
      : transparentBg
        ? "Warm morning frontal light, "
        : "Warm morning frontal light by cream sheer curtains, ";
    const faceClause = suppressFaceProse
      ? ""
      : ", flat 2D moe anime face with big eyes and dot nose";
    const prefix =
      `${lightClause}` +
      `lineless rosy-apricot skin with smooth 3D shading${faceClause}: ${m6Body}`;
    return prefix.charAt(0).toUpperCase() + prefix.slice(1);
  }
  if (isGlossyFigureStyleActive(cfg)) {
    const spotClause = hasCustomLight ? "" : " under studio spotlights";
    return (
      `DSLR macro photo of a glossy clear-coated painted PVC scale figurine${spotClause}, ` +
      `with sharp white plastic reflections on molded hair, lacquered skin, rigid PVC clothes, and glossy resin fluids: ${body}`
    );
  }
  if (isFigureStyleActive(cfg)) {
    const bgClause = transparentBg ? "" : " with shallow depth of field and bokeh";
    return `Macro product photo of a painted PVC scale figurine${bgClause}: ${body}`;
  }
  if (isGalDakimakuraCgStyleActive(cfg)) {
    return `Polished galgame CG, porcelain skin: ${body}`;
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
  const lightInfo =
    LIGHTING_PRESETS[cfg.lighting_preset] ??
    LIGHTING_PRESETS["🔄 随画风与本幕默认光影（不额外覆盖）"];
  const envInfo =
    ENV_PRESETS[cfg.env_preset] ?? ENV_PRESETS["🔄 随本幕/体位工具栏默认环境"];
  const is25dCelLight = is25dCelLightingCode(lightInfo.code);
  let qualPos: string;
  if (!cfg.enable_quality || pixelMode) {
    qualPos = "";
  } else if (m6Mode) {
    qualPos = "masterpiece, best quality, absurdres, year 2025";
  } else if (is25dCelLight || isMilkyPeachCelStyleActive(cfg)) {
    qualPos = "masterpiece, best quality, very aesthetic, absurdres, year 2025";
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
    if (!eyesOpen && styleOnlyPos.includes("gradient eyes")) {
      styleOnlyPos = styleOnlyPos
        .replace(/(?:,\s*)?\bgradient eyes\b/gi, "")
        .replace(/^[ ,]+|[ ,]+$/g, "");
    }
  }

  if (lightInfo.code !== "auto") {
    if ((lightInfo.strip_head_lighting || lightInfo.strip_style_tags?.length) && styleOnlyPos) {
      const stripLightSet = new Set<string>(
        lightInfo.strip_head_lighting
          ? [
              "front lighting",
              "warm lighting",
              "warm indoor lighting",
              "soft lighting",
              "diffused lighting",
              "gentle chiaroscuro",
              "low contrast",
              "muted color",
              "muted colors",
              "dim lighting",
              "shade",
              "dark",
              "partially shaded face",
              "backlighting",
              "rim lighting",
            ]
          : []
      );
      for (const extraStrip of lightInfo.strip_style_tags ?? []) {
        stripLightSet.add(extraStrip.toLowerCase());
      }
      for (const lt of lightInfo.tags.split(",")) {
        const bareLt = lt.trim().replace(/^\d+(?:\.\d+)?::([\s\S]+?)::$/, "$1").trim().toLowerCase();
        if (bareLt) stripLightSet.add(bareLt);
      }
      styleOnlyPos = styleOnlyPos
        .split(",")
        .map((t) => t.trim())
        .filter((t) => {
          if (!t) return false;
          const bare = t.replace(/^\d+(?:\.\d+)?::([\s\S]+?)::$/, "$1").trim().toLowerCase();
          return !stripLightSet.has(bare);
        })
        .join(", ");
    }
    if (lightInfo.unblock_neg?.length && styleNeg) {
      const unblockSet = new Set(lightInfo.unblock_neg.map((x) => x.toLowerCase()));
      styleNeg = styleNeg
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t && !unblockSet.has(t.toLowerCase()))
        .join(", ");
    }
    if (lightInfo.extra_neg) {
      styleNeg = joinTags(styleNeg, lightInfo.extra_neg);
    }
  }
  if (cfg.enable_background && envInfo.code !== "auto" && envInfo.unblock_dark && styleNeg) {
    styleNeg = styleNeg
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t && !["dark", "harsh shadows", "high contrast"].includes(t.toLowerCase()))
      .join(", ");
  }

  let lightTagsUsed = lightInfo.code !== "auto" ? lightInfo.tags : "";
  if (!eyesOpen && lightTagsUsed) {
    lightTagsUsed = lightTagsUsed
      .replace(/(?:,\s*)?(?:\d+(?:\.\d+)?::)?(?:gradient eyes|small white eye highlights)(?:::)?/gi, "")
      .replace(/^[ ,]+|[ ,]+$/g, "");
  }
  const headPos = joinTags(qualPos, styleOnlyPos, lightTagsUsed);

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
    if (is25dCelLight) {
      bodyPos = bodyPos
        .replace(/(?:,\s*)?-0\.\d+::[\s\S]*?::/g, "")
        .replace(/0\.2[5-9]::chibi::/g, "0.12::chibi::")
        .replace(/^[ ,]+|[ ,]+$/g, "");
    }
    if (bodyPos.includes("::chibi::") && styleNeg) {
      // Unblock 'chibi' / 'big head' from conflicting style negatives while preserving 'super deformed' anti-SD cap
      const chibiAllowSet = new Set(["chibi", "big head", "wide face"]);
      styleNeg = styleNeg
        .split(",")
        .map((t) => t.trim())
        .filter((t) => Boolean(t) && !chibiAllowSet.has(t.toLowerCase()))
        .join(", ");
    }
    const [bustPos, bustNeg] = BUST_PRESETS[cfg.bust_preset] ?? ["", ""];
    if (bodyPos.includes("small breasts")) {
      if (bustPos) {
        bodyPos = bodyPos
          .replace(/(?:,\s*)?\bsmall breasts\b/g, "")
          .replace(/^[ ,]+|[ ,]+$/g, "");
      } else {
        bodyNeg = joinTags(
          bodyNeg,
          cfg.body_preset.includes("Slim-Tender")
            ? "large breasts, medium breasts, huge breasts"
            : "large breasts, huge breasts"
        );
      }
    }
    const skinPos = SKIN_PRESETS[cfg.skin_preset] ?? "";
    const extras: string[] = [];
    if (cfg.add_cat_ears) extras.push("cat ears, animal ears, animal ear fluff, cat tail");
    if (cfg.add_horns_tail) extras.push("demon horns, demon tail");
    if (cfg.add_glasses) extras.push("glasses, semi-rimless glasses");
    if (cfg.add_choker) extras.push("choker, black choker");
    if (cfg.add_extra_sweat) extras.push("sweatdrop, flying sweatdrops, steam");
    if (cfg.extra_char_tags.trim()) extras.push(cfg.extra_char_tags.trim());

    bodyFullPos = joinTags(bodyPos, bustPos, skinPos, extras.join(", "));
    bodyFullNeg = joinTags(bodyNeg, bustNeg);
  }

  const charRest = bodyFullPos;
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
  if (
    !cfg.enable_outfit ||
    !cfg.enable_clothing_state ||
    reqState === "intact" ||
    bottomType === "open_groin"
  ) {
    effState = "intact";
  } else if (outfitKind === "nude") {
    effState = "nude";
  } else if (outfitKind === "custom" && reqState === "auto") {
    effState = "intact";
  } else if (reqState === "auto") {
    effState = ["skirt", "shorts", "leotard", "swimsuit", "panties", "skirt_or_canon"].includes(
      bottomType
    )
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
    } else if (bottomType === "panties") {
      statePos = "clothes lift, panties aside";
    } else {
      statePos = "clothes lift, skirt lift, panties aside";
    }
  } else if (effState === "half_off") {
    if (bottomType === "shorts") {
      statePos = "disheveled clothes, open clothes, open shorts, panties around one leg";
    } else if (bottomType === "panties") {
      statePos = "disheveled clothes, open clothes, clothes lift, panties around one leg";
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
    ["skirt", "shorts", "leotard", "swimsuit", "panties", "skirt_or_canon"].includes(bottomType)
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
    bottomType !== "open_groin" &&
    ["keep_bottom_aside", "half_off", "bottomless"].includes(reqState);
  const frontOutfitTags = f00ActiveUndress ? joinTags(frontDesign, statePos) : frontDesign;
  if (f00ActiveUndress && cfg.enable_outfit && outfitKind === "preset") {
    frontShirtProse = ` wearing ${outfitInfo.prose}`;
  }

  const isCanonLegwear = cfg.legwear_preset === "🌟 随角色原设鞋袜 / 不强制赤足";
  const hasOutfitLockedStockings = cfg.enable_outfit && outfitInfo.lock_stockings === "1";
  let legNormal = "";
  let footHoldTags = "soles, toes, soles together";
  let solesRear = "soles";
  let legProse = "feet";
  let frontLegTags = "bare thighs";

  if (hasOutfitLockedStockings) {
    legNormal = "";
    footHoldTags = "black thighhighs, clothed feet, soles, soles together";
    solesRear = "soles";
    legProse = "black-stockinged feet";
    frontLegTags = "";
  } else if (cfg.enable_legwear) {
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
  let envExtraNeg = "";
  const hasGlobalEnv = cfg.enable_background && envInfo.code !== "auto";
  if (cfg.enable_background) {
    if (hasGlobalEnv) {
      const lightTagSet = new Set(
        (lightInfo.code !== "auto" ? lightInfo.tags : "")
          .split(",")
          .map((t) => t.trim().replace(/^\d+(?:\.\d+)?::([\s\S]+?)::$/, "$1").trim().toLowerCase())
          .filter(Boolean)
      );
      let rawEnvTags = envInfo.tags;
      if (is25dCelLight && envInfo.code === "sunlit_rug_floor_window") {
        rawEnvTags = rawEnvTags.replace(
          "large floor-to-ceiling window,",
          "large floor-to-ceiling window, clear blue sky,"
        );
      }
      const dedupEnv = rawEnvTags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => {
          if (!t) return false;
          const bare = t.replace(/^\d+(?:\.\d+)?::([\s\S]+?)::$/, "$1").trim().toLowerCase();
          return !lightTagSet.has(bare);
        })
        .join(", ");
      bgCouch = dedupEnv;
      bgSleepCouch = dedupEnv;
      locProse = envInfo.prose;
      envExtraNeg = envInfo.extra_neg || "";
    } else if (m6Mode) {
      bgCouch = "indoors, beige couch, window, cream sheer curtains";
      bgSleepCouch = "indoors, beige couch, pillow, window, cream sheer curtains";
      locProse = " by cream sheer curtains";
    } else {
      bgCouch = "indoors, couch, lamp";
      bgSleepCouch = "indoors, couch, pillow, lamp";
      locProse = " on the warm-lit couch";
    }
  }
  const onCouchTag = !cfg.enable_background
    ? ""
    : hasGlobalEnv
      ? envInfo.code === "cherry_shallow_water"
        ? "in water"
        : ""
      : "lying on couch";
  const kneelCouchTag = !cfg.enable_background || hasGlobalEnv ? "kneeling" : "kneeling on couch";
  const handsCouchTag =
    !cfg.enable_background || hasGlobalEnv ? "supporting weight" : "hands on couch";

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
    cfg.enable_outfit &&
    effState === "intact" &&
    outfitKind !== "nude" &&
    outfitKind !== "custom" &&
    bottomType !== "open_groin"
      ? "nude, topless, bottomless"
      : "";
  const outfitExtraNeg = cfg.enable_outfit ? outfitInfo.extra_neg || "" : "";
  const isTune2 = cfg.style_preset.includes("M6-Tune2");
  const commonTailNeg = isTune2
    ? joinTags(anatNeg, outfitExtraNeg, canonNeg, intactNeg, envExtraNeg)
    : joinTags(styleNeg, bodyFullNeg, anatNeg, outfitExtraNeg, canonNeg, intactNeg, envExtraNeg);

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
  const negOn = cfg.enable_negatives;
  const exprCtrl = compileExpressionOverride(cfg, sceneId);
  const defEyesOpen = exprCtrl.active ? exprCtrl.eyes_open : true;
  let results: ScenePromptItem[] = [];

  if (sceneId in MULTI_ANGLE_TEMPLATES) {
    const tpl = MULTI_ANGLE_TEMPLATES[sceneId];
    const m = buildCommonModules(cfg, defEyesOpen);
    const forceNsfw = Boolean(tpl.force_nsfw);
    const nsfwOn = forceNsfw || cfg.enable_multi_angle_nsfw;
    const isMa7Nsfw = sceneId === "MA7" && nsfwOn;
    let charCoreMa = m.char_core;
    let maOutfit = isMa7Nsfw || forceNsfw ? m.outfit_pos : m.front_outfit_tags;
    const maShirtProse = isMa7Nsfw ? m.outfit_prose_clause : m.front_shirt_prose;
    const maLeg = m.front_leg_tags;
    const nsfwPrefix = nsfwOn ? "rating:explicit, nsfw, uncensored" : "";
    let anatMa = nsfwOn && cfg.enable_anatomy ? m.anat_pos : "";
    if (isMa7Nsfw) {
      if (anatMa) {
        if (/spread pussy/i.test(anatMa)) {
          anatMa = anatMa.replace(/(?:\d+(?:\.\d+)?::)?spread pussy(?:::)?/gi, "1.25::spread pussy::");
        } else {
          anatMa = joinTags(anatMa, "labia, 1.25::spread pussy::");
        }
        anatMa = joinTags(anatMa, "1.25::spreading own pussy::, fingers");
      } else {
        anatMa = "groin, pussy, labia, 1.25::spread pussy::, 1.25::spreading own pussy::, fingers";
      }
    } else if (forceNsfw) {
      if (maOutfit) {
        maOutfit = maOutfit
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t && t.toLowerCase() !== "rabbit tail")
          .join(", ");
      }
      if (anatMa) {
        anatMa = anatMa
          .split(",")
          .map((t) => t.trim())
          .filter((t) => {
            if (!t) return false;
            if (t.toLowerCase() === "labia") return false;
            return !/^(0\.\d+)::/.exec(t);
          })
          .join(", ");
      }
    }
    let maTailNeg = m.common_tail_neg;
    if (isMa7Nsfw) {
      maTailNeg = joinTags(
        "covering crotch, covering pussy, covering breasts, censor, mosaic censoring, bar censor, gaping",
        maTailNeg
      );
    }
    if (tpl.extra_neg) {
      let tplNeg = tpl.extra_neg;
      if (
        cfg.enable_uterus_xray &&
        !tpl.builtin_xray &&
        sceneId !== "MA7A" &&
        sceneId !== "MA7D"
      ) {
        const xrayAllow = new Set([
          "x-ray",
          "cross-section",
          "uterus",
          "cervix",
          "internal cumshot",
          "cutaway",
        ]);
        tplNeg = tplNeg
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t && !xrayAllow.has(t.toLowerCase()))
          .join(", ");
      }
      maTailNeg = joinTags(tplNeg, maTailNeg);
    }
    if (tpl.unlock_belly) {
      charCoreMa = charCoreMa
        .split(",")
        .map((t) => t.trim())
        .filter((t) => {
          const low = t.toLowerCase();
          return low !== "slim waist" && low !== "-0.40::plump::" && low !== "-0.4::plump::";
        })
        .join(", ");
      maOutfit = maOutfit
        .split(",")
        .map((t) => t.trim())
        .filter((t) => {
          const low = t.toLowerCase();
          return low !== "midriff" && low !== "navel";
        })
        .join(", ");
      if (maTailNeg) {
        maTailNeg = maTailNeg
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t && !["plump", "curvy"].includes(t.toLowerCase()))
          .join(", ");
      }
    }
    if (forceNsfw && maTailNeg) {
      const dryFluidConflicts = new Set(["dripping", "splash"]);
      maTailNeg = maTailNeg
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t && !dryFluidConflicts.has(t.toLowerCase()))
        .join(", ");
    }
    const maHasInherentNsfwOutfit = /\b(nude|reverse bunnysuit|pasties|nipples|micro bikini)\b/i.test(
      maOutfit
    );
    if (maTailNeg) {
      let negTokens = maTailNeg
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      if (tpl.allow_multi_views) {
        negTokens = negTokens.filter((t) => t.toLowerCase() !== "multiple views");
      }
      if (nsfwOn || maHasInherentNsfwOutfit) {
        negTokens = negTokens.filter((t) => t.toLowerCase() !== "nsfw");
      } else if (!negTokens.some((t) => t.toLowerCase() === "nsfw")) {
        negTokens.unshift("nsfw");
      }
      maTailNeg = negTokens.join(", ");
    } else if (!nsfwOn && !maHasInherentNsfwOutfit) {
      maTailNeg = "nsfw";
    }
    let maScene = isMa7Nsfw
      ? "cowboy shot, 1.35::upper body::, legs apart, head tilt, peace sign near cheek, playful cheerful expression, one eye slightly narrowed, looking at viewer, blurred warm indoor background"
      : String(tpl.scene);
    const hasCustomGlobalEnv =
      cfg.enable_background &&
      Boolean(m.bg_couch) &&
      (ENV_PRESETS[cfg.env_preset]?.code ?? "auto") !== "auto";
    if (hasCustomGlobalEnv && maScene.includes("blurred warm indoor background")) {
      maScene = maScene.replace("blurred warm indoor background", m.bg_couch);
    }
    if (is25dCelLightingCode(LIGHTING_PRESETS[cfg.lighting_preset]?.code)) {
      if ((sceneId === "MA9" || sceneId === "MA10") && !/\bclear blue sky\b/i.test(maScene)) {
        maScene = maScene.replace("large floor-to-ceiling window,", "large floor-to-ceiling window, clear blue sky,");
      }
      maScene = maScene
        .replace(/(?:,\s*)?backlighting\b/gi, "")
        .replace(/(?:,\s*)?sunlight\b/gi, "");
    }
    let maBaseProse = isMa7Nsfw
      ? "in a thighs-up shot tilting her head and making a playful peace sign near her cheek with one hand while her other hand reaches down to spread her pussy open toward the camera with a cheerful expression."
      : tpl.prose;
    if (hasCustomGlobalEnv && m.loc_prose && forceNsfw) {
      maBaseProse = `${maBaseProse.replace(/\.+\s*$/, "")}${m.loc_prose}.`;
    }
    if (exprCtrl.active) {
      for (const baked of [
        "playful cheerful expression",
        "relaxed cheerful smile",
        "gentle shy expression",
        "one eye slightly narrowed",
        "gentle relaxed gaze",
        "curious bright gaze",
        "gentle smile",
        "slight smile",
        "half-closed eyes",
        "tareme",
        "nose blush",
        "blush",
      ]) {
        const escaped = baked.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        maScene = maScene.replace(new RegExp(`(?:,\\s*)?\\b${escaped}\\b`, "gi"), "");
      }
      maScene = maScene.replace(/^[ ,]+|[ ,]+$/g, "");
      maScene = joinTags(maScene, exprCtrl.pos_tags_str);
    } else if (tpl.default_expr_tags && cfg.enable_expression) {
      const exprStr = exprIf(cfg, tpl.default_expr_tags, "", sceneId);
      if (hasCustomGlobalEnv && maScene.includes(m.bg_couch)) {
        maScene = maScene.replace(m.bg_couch, `${exprStr}, ${m.bg_couch}`);
      } else if (maScene.includes("blurred warm indoor background")) {
        maScene = maScene.replace(
          "blurred warm indoor background",
          `${exprStr}, blurred warm indoor background`
        );
      } else {
        maScene = joinTags(maScene, exprStr);
      }
    }
    const maSubTitle = isMa7Nsfw
      ? "【MA7 · 近景歪头比耶 + 单手掰穴 (1.25 Spread)】"
      : `【${tpl.title}】`;
    const pMa = joinTags(
      m.head_pos,
      "1girl, solo",
      charCoreMa,
      maOutfit,
      maLeg,
      nsfwPrefix,
      anatMa,
      maScene,
      proseIf(cfg, `${m.name}${maShirtProse} ${maBaseProse}`),
      wrapTailNeg(m, maTailNeg, negOn)
    );
    results.push({ subTitle: maSubTitle, canvas: tpl.canvas, prompt: pMa });
  } else if (sceneId in ALL_POSITIONS_TEMPLATES) {
    const tpl = ALL_POSITIONS_TEMPLATES[sceneId];
    const channel = tpl.channel;
    const isTentacle = channel === "tentacle";
    const povVis = isPov
      ? tpl.pov_visibility ?? "front_face_visible"
      : "front_face_visible";
    const isRearNoFacePov = povVis === "rear_no_face";
    const isTopDownOverShoulderPov = povVis === "top_down_over_shoulder";
    const isVentralNoEyesPov = povVis === "ventral_no_eyes";
    const suppressPovFaceAndEyes =
      isRearNoFacePov || isTopDownOverShoulderPov || isVentralNoEyesPov;
    const lockSceneEnv = Boolean(tpl.lock_scene_env);
    const cfgForModules = lockSceneEnv
      ? { ...cfg, env_preset: "🔄 随本幕/体位工具栏默认环境" }
      : cfg;
    const m = buildCommonModules(
      cfgForModules,
      suppressPovFaceAndEyes ? false : defEyesOpen
    );
    const transBg = Boolean(cfg.pos_transparent_bg);
    const maleCode = POS_MALE_MODE_PRESETS[cfg.pos_male_mode] ?? "normal";
    const showP = Boolean(cfg.pos_show_penis);
    const condomOn = Boolean(cfg.enable_condom);
    const stageCode = POS_STAGE_PRESETS[cfg.pos_stage] ?? "before";
    const isManualFemale = ["fingering", "grope_fingering", "clit_tease", "breast_grope"].includes(
      channel
    );
    const isPullOutLike = stageCode === "pull_out" || stageCode === "prolapse";
    const condomBadge =
      !isTentacle &&
      condomOn &&
      (channel === "vaginal" || (!isManualFemale && channel !== "solo" && showP))
        ? channel === "vaginal" && isPullOutLike
          ? " · [🎈套留外口自溢]"
          : channel === "vaginal" && (stageCode === "during" || stageCode === "after_inside")
            ? " · [🎈子宫套内撑满]"
            : " · [🎈戴套]"
        : "";
    const catTailWrapActive =
      !isTentacle &&
      Boolean(cfg.add_cat_ears) &&
      channel !== "solo" &&
      !isManualFemale &&
      showP &&
      isPullOutLike;
    const stageBadge = isTentacle
      ? ""
      : stageCode === "during"
        ? isManualFemale
          ? " · [💦高潮迸发]"
          : " · [💦射精中]"
        : stageCode === "after_inside"
          ? isManualFemale
            ? " · [🌊余韵留存]"
            : " · [🌊射精后结合]"
          : stageCode === "pull_out"
            ? isManualFemale
              ? " · [🔗抽指拉丝]"
              : catTailWrapActive
                ? " · [🔗事后拔出·🐾猫尾缠绕]"
                : " · [🔗事后拔出]"
            : stageCode === "prolapse"
              ? isManualFemale
                ? " · [🌺抽指宫脱]"
                : catTailWrapActive
                  ? " · [🌺事后宫脱·🐾猫尾缠绕]"
                  : " · [🌺事后宫脱]"
              : "";

    let posOutfit: string;
    if (channel === "chest" || channel === "breast_grope") {
      if (
        cfg.enable_outfit &&
        cfg.enable_clothing_state &&
        !m.outfit_pos.includes("nude") &&
        !m.outfit_pos.includes("bare breasts")
      ) {
        posOutfit = joinTags(m.outfit_intact, "clothes lift, breasts out, nipples");
      } else {
        posOutfit = m.outfit_pos;
      }
    } else if (channel === "grope_fingering") {
      if (
        cfg.enable_outfit &&
        cfg.enable_clothing_state &&
        !m.outfit_pos.includes("nude") &&
        !m.outfit_pos.includes("breasts out") &&
        !m.outfit_pos.includes("bare breasts")
      ) {
        posOutfit = joinTags(m.outfit_pos, "clothes lift, breasts out, nipples");
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

    let charCoreUsed = m.char_core;
    let headUsed: string;
    let bgUsed: string;
    let bgProse: string;
    let poseUsed: string;
    let transNeg: string;
    let tailNegUsed = m.common_tail_neg;
    const scenePreset =
      POS_SCENE_PRESETS[cfg.pos_scene] ??
      POS_SCENE_PRESETS["🛋️ 默认暖光室内沙发（indoors, couch, lamp）"];
    const sceneBadge = transBg
      ? ""
      : lockSceneEnv
        ? tpl.env_badge || " · [🐙暗窟内置环境]"
        : cfg.enable_background && scenePreset.badge
          ? scenePreset.badge
          : "";
    if (transBg) {
      headUsed = sanitizeStyleForTransparentBg(m.head_pos);
      bgUsed = "2.0::transparent background::, has alpha, alpha transparency, no background";
      bgProse = " isolated on a transparent background";
      poseUsed = poseRaw.replace(", head on pillow", "").replace(", hands gripping sheet", "");
      transNeg =
        "background, simple background, white background, black background, gradient background, " +
        "indoors, outdoors, scenery, furniture, bed, couch, sofa, pillow, window, curtains, wall, floor, drop shadow";
    } else if (lockSceneEnv) {
      const stripDaylightSet = new Set([
        "warm lighting",
        "sunlight",
        "overexposure",
        "light rays",
      ]);
      headUsed = m.head_pos
        .split(",")
        .map((t) => t.trim())
        .filter((t) => {
          if (!t) return false;
          const bare = t.replace(/^-?\d+(?:\.\d+)?::([\s\S]+?)::$/, "$1").trim().toLowerCase();
          return !stripDaylightSet.has(bare);
        })
        .join(", ");
      bgUsed = tpl.env_tags || "";
      bgProse = tpl.env_prose || "";
      poseUsed = poseRaw;
      transNeg = tpl.env_neg || "";
      if (tailNegUsed) {
        tailNegUsed = tailNegUsed
          .split(",")
          .map((t) => t.trim())
          .filter(
            (t) =>
              t &&
              !["dark", "dim lighting", "harsh shadow", "harsh shadows", "high contrast"].includes(
                t.toLowerCase()
              )
          )
          .join(", ");
      }
    } else if (cfg.enable_background && scenePreset.code !== "default_couch") {
      headUsed = scenePreset.unblock_dark
        ? m.head_pos.replace(/,\s*warm lighting\b/gi, "")
        : m.head_pos;
      const headSet = new Set(
        headUsed
          .split(",")
          .map((t) => t.trim().replace(/^\d+(?:\.\d+)?::([\s\S]+?)::$/, "$1").trim().toLowerCase())
          .filter(Boolean)
      );
      let rawSceneTags = scenePreset.tags;
      if (
        is25dCelLightingCode(LIGHTING_PRESETS[cfg.lighting_preset]?.code) &&
        scenePreset.code === "sunlit_rug_floor_window"
      ) {
        rawSceneTags = rawSceneTags.replace(
          "large floor-to-ceiling window,",
          "large floor-to-ceiling window, clear blue sky,"
        );
      }
      bgUsed = rawSceneTags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => {
          if (!t) return false;
          const bare = t.replace(/^\d+(?:\.\d+)?::([\s\S]+?)::$/, "$1").trim().toLowerCase();
          return !headSet.has(bare);
        })
        .join(", ");
      bgProse = scenePreset.prose;
      poseUsed = scenePreset.strip_indoor_pose
        ? poseRaw.replace(", head on pillow", "").replace(", hands gripping sheet", "")
        : poseRaw;
      transNeg = scenePreset.extra_neg || "";
      if (scenePreset.unblock_dark && tailNegUsed) {
        tailNegUsed = tailNegUsed
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t && !["dark", "harsh shadows", "high contrast"].includes(t.toLowerCase()))
          .join(", ");
      }
    } else {
      headUsed = m.head_pos;
      bgUsed = m.bg_couch;
      bgProse = m.loc_prose;
      poseUsed = poseRaw;
      transNeg = "";
    }

    if (tpl.unlock_belly) {
      charCoreUsed = charCoreUsed
        .split(",")
        .map((t) => t.trim())
        .filter((t) => {
          const low = t.toLowerCase();
          return low !== "slim waist" && low !== "-0.40::plump::" && low !== "-0.4::plump::";
        })
        .join(", ");
      posOutfit = posOutfit
        .split(",")
        .map((t) => t.trim())
        .filter((t) => {
          const low = t.toLowerCase();
          return low !== "midriff" && low !== "navel";
        })
        .join(", ");
      if (tailNegUsed) {
        tailNegUsed = tailNegUsed
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t && !["plump", "curvy"].includes(t.toLowerCase()))
          .join(", ");
      }
    }

    let actorTags: string;
    let organTags: string;
    let partnerProse: string;
    let organProse: string;
    let extraNeg: string;

    const povMaleCropNeg =
      povVis === "front_face_visible" && !/\bfrom behind\b/i.test(poseUsed)
        ? "from behind, male back, male head, male shoulders, male face, over-the-shoulder"
        : "male back, male head, male shoulders, male face, over-the-shoulder";

    if (isTentacle) {
      actorTags = isPov ? "1girl, solo, 1.3::pov::" : "1girl, solo";
      if (sceneId !== "TN03" && posOutfit) {
        posOutfit = posOutfit
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t && t.toLowerCase() !== "rabbit tail")
          .join(", ");
      }
      if (tailNegUsed) {
        const dryConflictSet = new Set([
          "body oil",
          "oily skin",
          "flying sweatdrops",
          "dripping",
          "splash",
        ]);
        tailNegUsed = tailNegUsed
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t && !dryConflictSet.has(t.toLowerCase()))
          .join(", ");
      }
      const tnAnatPos = m.anat_pos
        .split(",")
        .map((t) => t.trim())
        .filter((t) => {
          if (!t) return false;
          if (t.toLowerCase() === "labia") return false;
          const mWeight = /^(0\.\d+)::/.exec(t);
          return !mWeight;
        })
        .join(", ");
      organTags = joinTags(tnAnatPos, tpl.raw_action_tags || "");
      partnerProse = "";
      organProse = "";
      let tnExtraNeg = tpl.extra_scene_neg || "";
      if (cfg.enable_uterus_xray && !tpl.builtin_xray && tnExtraNeg) {
        const xrayAllow = new Set(["x-ray", "cross-section", "uterus", "cervix", "cutaway"]);
        tnExtraNeg = tnExtraNeg
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t && !xrayAllow.has(t.toLowerCase()))
          .join(", ");
      }
      extraNeg = tnExtraNeg;
    } else if (channel === "solo") {
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
          isRearNoFacePov ? "cum on thighs, cum on ass, sweat" : "cum on thighs, sweat"
        );
        organProse =
          ", resting after climax with thick white cum pooling and overflowing from her parted lower anatomy";
      } else if (stageCode === "prolapse") {
        organTags = joinTags(
          m.anat_pos,
          "after vaginal, after sex, 1.55::vaginal prolapse::, 1.35::prolapse::, cervix, twitching, trembling",
          wtag("cum", 1.45, f),
          wtag("cum in pussy", 1.45, f),
          wtag("cumdrip", 1.45, f),
          wtag("cum string", 1.4, f),
          isRearNoFacePov ? wtag("cum on ass", 1.3, f) : wtag("cum on stomach", 1.3, f),
          "cum on thighs, sweat"
        );
        organProse =
          ", right after intense sex with a glistening pink prolapsed cervix protruding and dripping with thick white cum and sticky strings";
      } else {
        organTags = joinTags(
          m.anat_pos,
          "1.3::spread pussy::, after vaginal, after sex, 0.65::gaping::, twitching",
          wtag("cum", 1.45, f),
          wtag("cum in pussy", 1.45, f),
          wtag("cumdrip", 1.45, f),
          wtag("cum string", 1.4, f),
          isRearNoFacePov ? wtag("cum on ass", 1.3, f) : wtag("cum on stomach", 1.3, f),
          "cum on thighs, sweat"
        );
        organProse =
          ", right after withdrawal with thick white cum overflowing and dripping in sticky strings from her parted lower anatomy";
      }
      partnerProse = "";
      extraNeg = joinTags(
        "1boy, male, penis, phallus, dildo",
        stageCode === "prolapse" ? "anal prolapse, anal" : ""
      );
    } else if (isManualFemale) {
      let partnerNeg: string;
      const isSelfTouch = maleCode === "off";
      if (maleCode === "normal") {
        actorTags = joinTags(
          "1girl, 1boy, hetero, faceless male, male hand",
          isPov ? "1.35::pov::, 1.35::pov hands::" : ""
        );
        partnerProse = isPov ? "" : " with a faceless partner's hands";
        partnerNeg = isPov ? povMaleCropNeg : "";
      } else if (maleCode === "translucent") {
        actorTags = joinTags(
          "1girl, 1boy, hetero, faceless male, 1.35::male silhouette::, ghostly outline",
          isPov ? "1.35::pov::, pov hands" : ""
        );
        partnerProse =
          " with a semi-transparent see-through male silhouette whose hands do not obscure her opaque body";
        partnerNeg = isPov ? povMaleCropNeg : "";
      } else if (maleCode === "invisible") {
        actorTags = joinTags(
          "1girl, solo, 1.35::invisible partner::",
          isPov ? "1.3::pov::" : ""
        );
        partnerProse = " stimulated by the unseen hands of an invisible partner";
        partnerNeg = "1boy, male, male body";
      } else {
        actorTags = "1girl, solo, female masturbation";
        partnerProse = "";
        partnerNeg = "1boy, male, multiple people";
      }

      if (channel === "breast_grope") {
        const baseGrope = isSelfTouch
          ? "1.4::grabbing own breasts::, squeezing breasts, 1.3::nipple tweak::, pinching nipples, sunken breasts"
          : "1.4::breast grab::, 1.35::grabbing another's breast::, breast grab from behind, groping, 1.3::nipple tweak::, pinching nipples, sunken breasts";
        if (stageCode === "before") {
          organTags = joinTags(baseGrope, af ? "glistening, sweat" : "");
          organProse = isSelfTouch
            ? ", kneading her own soft breasts and pinching her sensitive nipples"
            : ", as hands knead deeply into her soft breasts and pinch her sensitive nipples";
        } else if (stageCode === "during") {
          organTags = joinTags(
            baseGrope,
            "orgasm, climax, trembling, arched back, heavy breathing, glistening skin, flying sweatdrops, sweat"
          );
          organProse =
            ", trembling in intense climax as her soft breasts are squeezed firmly and her erect nipples are pinched";
        } else if (stageCode === "after_inside") {
          organTags = joinTags(
            baseGrope,
            "after orgasm, heavy breathing, trembling, flushed chest, glistening skin, sweat"
          );
          organProse =
            ", panting softly right after climax while hands remain cupped tightly over her flushed breasts";
        } else {
          organTags = joinTags(
            "flushed breasts, erect nipples, 1.25::saliva trail::, glistening skin, heavy breathing, trembling, sweat",
            isSelfTouch ? "hands near chest" : "reaching hands"
          );
          organProse =
            ", just as hands release slightly from her flushed, indented breasts and glistening erect nipples";
        }
      } else {
        const gropePrefix =
          channel === "grope_fingering"
            ? isSelfTouch
              ? "1.3::grabbing own breast::, nipple tweak"
              : "1.35::breast grab::, grabbing another's breast, groping, nipple tweak"
            : "";
        const gropeProse =
          channel === "grope_fingering"
            ? isSelfTouch
              ? " while one hand squeezes her own breast and"
              : " while one hand squeezes her soft breast and"
            : ",";

        if (channel === "clit_tease") {
          const spreadTag = isSelfTouch
            ? "1.35::spreading own pussy::"
            : "1.35::spreading another's pussy::";
          if (stageCode === "before") {
            organTags = joinTags(
              m.anat_pos,
              spreadTag,
              "1.4::clitoral stimulation::, fingers, 1.3::spread pussy::, 1.25::clitoris::",
              af ? wtag("pussy juice", 1.25, f) : ""
            );
            organProse =
              ", as fingers part her lower anatomy wide open and directly rub her sensitive clitoris";
          } else if (stageCode === "during") {
            organTags = joinTags(
              m.anat_pos,
              spreadTag,
              "1.4::clitoral stimulation::, 1.3::spread pussy::, 1.25::clitoris::, orgasm, climax, 1.35::female ejaculation::, trembling, twitching",
              wtag("pussy juice", 1.45, f),
              wtag("squirting", 1.35, f),
              "pussy juice trail, sweat"
            );
            organProse =
              ", jolting in intense climax with a glistening spray of female ejaculation as fingers rapidly rub her exposed clitoris";
          } else if (stageCode === "after_inside") {
            organTags = joinTags(
              m.anat_pos,
              spreadTag,
              "clitoral stimulation, 1.3::spread pussy::, clitoris, after orgasm, heavy breathing, trembling, twitching",
              wtag("pussy juice", 1.45, f),
              "pussy juice on fingers, wet thighs, sweat"
            );
            organProse =
              ", quivering right after climax with wet fingers still holding her soaked lower anatomy open against her clitoris";
          } else if (stageCode === "prolapse") {
            organTags = joinTags(
              m.anat_pos,
              "after masturbation, 1.55::vaginal prolapse::, 1.35::prolapse::, cervix, 1.25::clitoris::, twitching, wet fingers, glistening fingers",
              wtag("pussy juice", 1.45, f),
              wtag("pussy juice trail", 1.45, f),
              "pussy juice string, wet thighs, sweat"
            );
            organProse =
              ", just as glistening wet fingers pull back, leaving a glistening pink prolapsed cervix protruding with sticky translucent threads of fluid";
          } else {
            organTags = joinTags(
              m.anat_pos,
              "after masturbation, 1.3::spread pussy::, 1.25::clitoris::, twitching, wet fingers, glistening fingers",
              wtag("pussy juice", 1.45, f),
              wtag("pussy juice trail", 1.45, f),
              "pussy juice string, wet thighs, sweat"
            );
            organProse =
              ", just as glistening wet fingers pull slightly back, stretching sticky translucent threads of fluid from her swollen clitoris and parted folds";
          }
        } else {
          if (stageCode === "before") {
            organTags = joinTags(
              m.anat_pos,
              gropePrefix,
              "1.4::fingering::, hand between legs, fingers, 1.25::spread pussy::",
              af ? wtag("pussy juice", 1.25, f) : ""
            );
            organProse = `${gropeProse} fingers stroke and press deep inside her parted lower anatomy`;
          } else if (stageCode === "during") {
            organTags = joinTags(
              m.anat_pos,
              gropePrefix,
              "1.4::fingering::, hand between legs, 1.25::spread pussy::, orgasm, climax, 1.35::female ejaculation::, trembling, twitching",
              wtag("pussy juice", 1.45, f),
              wtag("squirting", 1.35, f),
              "pussy juice trail, sweat"
            );
            organProse = `${gropeProse} rapid fingering drives her to climax in a glistening spray of female ejaculation`;
          } else if (stageCode === "after_inside") {
            organTags = joinTags(
              m.anat_pos,
              gropePrefix,
              "1.35::fingering::, hand between legs, 1.25::spread pussy::, after orgasm, heavy breathing, trembling, twitching",
              wtag("pussy juice", 1.45, f),
              "pussy juice on fingers, wet thighs, sweat"
            );
            organProse = `${gropeProse} wet fingers remain buried inside her quivering, soaked lower anatomy right after climax`;
          } else if (stageCode === "prolapse") {
            organTags = joinTags(
              m.anat_pos,
              gropePrefix,
              "1.35::after fingering::, after masturbation, 1.55::vaginal prolapse::, 1.35::prolapse::, cervix, twitching, wet fingers, glistening fingers",
              wtag("pussy juice", 1.45, f),
              wtag("pussy juice trail", 1.45, f),
              "pussy juice string, wet thighs, sweat"
            );
            organProse = `${gropeProse} glistening wet fingers withdraw, dragging out a glistening pink prolapsed cervix with sticky translucent threads of fluid`;
          } else {
            organTags = joinTags(
              m.anat_pos,
              gropePrefix,
              "1.35::after fingering::, after masturbation, 1.3::spread pussy::, 0.55::gaping::, twitching, wet fingers, glistening fingers",
              wtag("pussy juice", 1.45, f),
              wtag("pussy juice trail", 1.45, f),
              "pussy juice string, wet thighs, sweat"
            );
            organProse = `${gropeProse} glistening wet fingers withdraw, stretching sticky translucent threads of fluid from her parted, twitching pussy`;
          }
        }
      }

      extraNeg = joinTags(
        partnerNeg,
        "penis, phallus, testicles, dildo, sex toy, vaginal",
        stageCode === "prolapse" ? "anal prolapse, anal" : ""
      );
    } else {
      let partnerNeg: string;
      const povCrotchTag =
        isPov &&
        showP &&
        ["vaginal", "oral", "sixty_nine", "chest", "thigh", "glute"].includes(channel)
          ? "pov crotch"
          : "";
      const povHipGrabTag =
        isRearNoFacePov && sceneId !== "P20" && (channel === "vaginal" || channel === "glute")
          ? "grabbing another's hip"
          : "";
      if (maleCode === "normal") {
        actorTags = joinTags(
          "1girl, 1boy, hetero, faceless male",
          isPov ? "1.4::pov::, pov hands" : "",
          povCrotchTag,
          povHipGrabTag
        );
        partnerProse = isPov ? "" : " with a faceless partner";
        partnerNeg = isPov ? povMaleCropNeg : "";
      } else if (maleCode === "translucent") {
        actorTags = joinTags(
          "1girl, 1boy, hetero, faceless male, 1.35::male silhouette::, ghostly outline",
          isPov ? "1.35::pov::, pov hands" : "",
          povCrotchTag,
          povHipGrabTag
        );
        partnerProse =
          " with a semi-transparent see-through male silhouette that does not obscure her opaque body";
        partnerNeg = isPov ? povMaleCropNeg : "";
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
              condomOn ? "1.35::condom::, 1.3::condom on penis::" : "",
              af ? wtag("pussy juice", 1.2, f) : ""
            );
            organProse = condomOn ? ", wearing a snug translucent condom" : "";
          } else {
            organTags = joinTags(
              m.anat_pos,
              "1.3::spread pussy::, 0.55::gaping::, twitching",
              af ? wtag("pussy juice, cumdrip", 1.2, f) : ""
            );
            organProse = ", keeping her lower anatomy actively parted";
          }
        } else if (stageCode === "during") {
          if (condomOn) {
            const baseOrg = showP
              ? joinTags(m.anat_pos, "vaginal, insertion, penis, 1.4::condom on penis::")
              : joinTags(m.anat_pos, "1.3::spread pussy::, 1.4::condom::");
            organTags = joinTags(
              baseOrg,
              "1.5::x-ray::, 1.45::cross-section::, 1.4::uterus::, cervix, 1.35::cervical penetration::, ejaculation, climax, 1.5::cum in condom::, cum inflation, stomach bulge, trembling, twitching",
              wtag("cum", 1.35, f),
              "pussy juice, sweat"
            );
            organProse =
              (showP ? "" : ", keeping her lower anatomy actively parted") +
              "; in a cutaway x-ray cross-section of her womb, the condom tip on his penis pushes through her cervix and inflates like a large taut white balloon stretching and filling the entire interior of her uterus with thick white cum";
          } else {
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
          }
        } else if (stageCode === "after_inside") {
          if (condomOn) {
            const baseOrg = showP
              ? joinTags(m.anat_pos, "vaginal, insertion, penis, 1.4::condom on penis::")
              : joinTags(m.anat_pos, "1.3::spread pussy::, 1.4::condom::");
            organTags = joinTags(
              baseOrg,
              "1.5::x-ray::, 1.45::cross-section::, 1.4::uterus::, cervix, 1.35::cervical penetration::, after vaginal, after ejaculation, 1.5::cum in condom::, cum inflation, stomach bulge, heavy breathing, trembling",
              wtag("cum", 1.35, f),
              "pussy juice, sweat"
            );
            organProse =
              (showP ? "" : ", keeping her lower anatomy actively parted") +
              "; in a cutaway x-ray cross-section of her womb, the condom on his penis stays ballooned wide open like a taut white pouch molding and filling the entire interior of her uterus";
          } else {
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
          }
        } else if (stageCode === "prolapse") {
          if (condomOn) {
            const shaftPart = showP ? ", 1.4::penis::, erection, glans, twitching penis" : "";
            organTags = joinTags(
              m.anat_pos,
              `1.35::after vaginal::, 1.4::pull out::, after sex, 1.15::vaginal prolapse::, twitching${shaftPart}`,
              "1.85::used condom in pussy::, 1.2::used condom::, 1.5::condom::, 1.4::cum in condom::",
              wtag("cum", 1.4, f),
              wtag("cum overflow", 1.4, f),
              wtag("cumdrip", 1.45, f),
              "puddle, cum on thighs, pussy juice, sweat"
            );
            organProse = showP
              ? ", right after her partner pulls his bare uncovered pink glans and shaft out; a single translucent white latex condom stays caught inside her swollen prolapsed vaginal entrance with its rolled circular rubber ring hanging clearly outside her labia, spilling thick white cum down into a puddle"
              : ", right after withdrawal with a single translucent white latex condom caught inside her swollen prolapsed vaginal entrance with its rolled circular rubber ring hanging clearly outside her labia, spilling thick white cum down into a puddle";
          } else if (showP) {
            organTags = joinTags(
              m.anat_pos,
              "1.35::after vaginal::, 1.4::pull out::, after sex, 1.55::vaginal prolapse::, 1.35::prolapse::, cervix, twitching, penis, erection, twitching penis, cum on penis",
              wtag("cum", 1.45, f),
              wtag("cum in pussy", 1.45, f),
              wtag("cumdrip", 1.45, f),
              wtag("cum string", 1.45, f),
              wtag("cum on stomach", 1.25, f),
              "cum on thighs, pussy juice, sweat"
            );
            organProse =
              ", right after pulling out, dragging out a glistening pink prolapsed cervix drenched in overflowing white cum with sticky cum strings bridging to the tip";
          } else {
            organTags = joinTags(
              m.anat_pos,
              "1.4::after vaginal::, pull out, after sex, 1.55::vaginal prolapse::, 1.35::prolapse::, cervix, twitching, trembling",
              wtag("cum", 1.45, f),
              wtag("cum in pussy", 1.45, f),
              wtag("cumdrip", 1.45, f),
              wtag("cum string", 1.45, f),
              wtag("cum on stomach", 1.25, f),
              "cum on thighs, pussy juice, sweat"
            );
            organProse =
              ", right after withdrawal, leaving a glistening pink prolapsed cervix protruding and dripping with thick white cum and sticky strings";
          }
        } else {
          if (condomOn) {
            const shaftPart = showP ? ", 1.4::penis::, erection, glans, twitching penis" : "";
            organTags = joinTags(
              m.anat_pos,
              `1.35::after vaginal::, 1.4::pull out::, after sex${shaftPart}, spread pussy, 0.55::gaping::`,
              "1.85::used condom in pussy::, 1.2::used condom::, 1.5::condom::, 1.4::cum in condom::",
              wtag("cum", 1.4, f),
              wtag("cum overflow", 1.4, f),
              wtag("cumdrip", 1.45, f),
              "puddle, cum on thighs, pussy juice, sweat"
            );
            organProse = showP
              ? ", right after her partner pulls his bare uncovered pink glans and shaft out; a single translucent white latex condom hangs halfway out of her vaginal entrance with its rolled circular rubber ring clearly visible outside her labia, spilling thick white cum down into a puddle"
              : ", right after withdrawal with a single translucent white latex condom hanging halfway out of her parted vaginal entrance with its rolled circular rubber ring clearly visible outside her labia, spilling thick white cum down into a puddle";
          } else if (showP) {
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
      } else if (channel === "sixty_nine") {
        const oral69Condom = showP && condomOn ? ", 1.3::condom::, 1.25::condom on penis::" : "";
        const oral69Used =
          showP && condomOn ? ", 1.35::condom::, 1.3::condom on penis::, 1.35::cum in condom::, used condom" : "";
        if (isPov) {
          const pov69Crotch = joinTags(
            m.anat_pos,
            "1.45::pussy::, 1.4::pussy from behind::, 1.35::spread pussy::, labia"
          );
          if (stageCode === "before") {
            organTags = showP
              ? joinTags(
                  pov69Crotch,
                  af ? wtag("pussy juice", 1.3, f) : "",
                  `1.45::oral::, 1.45::fellatio::, open mouth, lips around penis, 1.35::penis::, erection${oral69Condom}, saliva`
                )
              : joinTags(
                  pov69Crotch,
                  af ? wtag("pussy juice", 1.3, f) : "",
                  "1.35::cunnilingus::, open mouth, saliva"
                );
            organProse = showP
              ? condomOn
                ? " sucking his condom-sheathed erect penis"
                : " sucking his erect penis"
              : "";
          } else if (stageCode === "during") {
            const basePov69 = showP
              ? joinTags(
                  pov69Crotch,
                  wtag("pussy juice", 1.45, f),
                  `1.45::oral::, 1.45::fellatio::, open mouth, lips around penis, 1.35::penis::, erection${oral69Used}, saliva`
                )
              : joinTags(
                  pov69Crotch,
                  wtag("pussy juice", 1.45, f),
                  "1.35::cunnilingus::, orgasm, climax, female ejaculation, open mouth, saliva"
                );
            organTags = showP && condomOn
              ? joinTags(basePov69, "ejaculation, climax, bulging condom", wtag("cum", 1.35, f), "sweat")
              : joinTags(
                  basePov69,
                  "ejaculation, climax",
                  wtag("cum", 1.35, f),
                  "cum overflow, sweat"
                );
            organProse = showP
              ? " sucking his erect penis as thick white cum overflows at the bottom"
              : " trembling in mutual climax with glistening fluids";
          } else if (stageCode === "after_inside") {
            const basePov69 = showP
              ? joinTags(
                  pov69Crotch,
                  wtag("pussy juice", 1.45, f),
                  `1.45::oral::, 1.45::fellatio::, after fellatio, open mouth, lips around penis, 1.35::penis::, erection${oral69Used}, saliva`
                )
              : joinTags(
                  pov69Crotch,
                  wtag("pussy juice", 1.4, f),
                  "after cunnilingus, after orgasm, heavy breathing, open mouth, saliva trail"
                );
            organTags = showP && condomOn
              ? joinTags(basePov69, "after ejaculation, bulging condom", wtag("cum", 1.35, f), "sweat")
              : joinTags(
                  basePov69,
                  "after ejaculation, heavy breathing",
                  wtag("cum", 1.35, f),
                  "cum overflow, cum string, sweat"
                );
            organProse = showP
              ? " keeping her lips around his erect penis as thick white cum pools and overflows"
              : " resting right after mutual climax with glistening fluids";
          } else if (stageCode === "prolapse") {
            const basePov69 = showP
              ? condomOn
                ? joinTags(
                    pov69Crotch,
                    "1.5::vaginal prolapse::, 1.3::prolapse::, cervix, 1.4::after fellatio::, pull out, open mouth, 1.35::penis::, 1.35::used condom::, 1.35::cum in condom::"
                  )
                : joinTags(
                    pov69Crotch,
                    "1.5::vaginal prolapse::, 1.3::prolapse::, cervix, 1.4::after fellatio::, pull out, open mouth, 1.35::penis::, cum on penis"
                  )
              : joinTags(
                  pov69Crotch,
                  "1.5::vaginal prolapse::, 1.3::prolapse::, cervix, after cunnilingus"
                );
            organTags = joinTags(
              basePov69,
              wtag("pussy juice", 1.45, f),
              wtag("cum", 1.4, f),
              wtag("cumdrip", 1.4, f),
              wtag("cum string", 1.4, f),
              "saliva trail, sweat"
            );
            organProse =
              " right after mutual climax with a glistening prolapsed cervix overhead and sticky white cum strings at her mouth below";
          } else {
            const basePov69 = showP
              ? condomOn
                ? joinTags(
                    pov69Crotch,
                    "1.4::after fellatio::, 0.55::oral::, pull out, open mouth, 1.35::penis::, erection, 1.35::used condom::, 1.3::condom on penis::, 1.35::cum in condom::"
                  )
                : joinTags(
                    pov69Crotch,
                    "1.4::after fellatio::, 0.55::oral::, pull out, open mouth, 1.35::penis::, erection, cum on penis"
                  )
              : joinTags(pov69Crotch, "after cunnilingus, pull out, open mouth");
            organTags = joinTags(
              basePov69,
              wtag("pussy juice", 1.45, f),
              wtag("cum", 1.4, f),
              "cum overflow",
              wtag("cum string", 1.45, f),
              "saliva, saliva trail, sweat"
            );
            organProse = showP
              ? " pulling her mouth slightly back from his erect penis at the bottom with sticky white cum strings"
              : " right after mutual sixty-nine with glistening fluids";
          }
        } else {
          const third69Crotch = joinTags(
            m.anat_pos,
            "1.35::pussy::, 1.45::cunnilingus::, licking pussy, tongue on pussy"
          );
          if (stageCode === "before") {
            organTags = showP
              ? joinTags(
                  third69Crotch,
                  `1.45::oral::, 1.45::fellatio::, open mouth, penis in mouth, penis, erection${oral69Condom}, saliva`,
                  af ? joinTags("saliva trail", wtag("pussy juice", 1.25, f)) : ""
                )
              : joinTags(third69Crotch, "open mouth, saliva", af ? wtag("pussy juice", 1.25, f) : "");
            organProse = showP
              ? condomOn
                ? ", sucking his condom-sheathed erect penis"
                : ", sucking his erect penis"
              : "";
          } else if (stageCode === "during") {
            const base3rd69 = showP
              ? joinTags(
                  third69Crotch,
                  `1.45::oral::, 1.45::fellatio::, open mouth, penis in mouth, penis, erection${oral69Used}, saliva, saliva trail`
                )
              : joinTags(third69Crotch, "orgasm, climax, female ejaculation, open mouth, saliva");
            organTags = showP && condomOn
              ? joinTags(base3rd69, "ejaculation, climax, bulging condom", wtag("cum", 1.35, f), wtag("pussy juice", 1.4, f), "sweat")
              : joinTags(
                  base3rd69,
                  "ejaculation, climax",
                  wtag("cum", 1.35, f),
                  "cum in mouth, cum overflow",
                  wtag("pussy juice", 1.4, f),
                  "sweat"
                );
            organProse =
              ", climaxing together as thick white cum fills her mouth and overflows while glistening fluids drip at the opposite end";
          } else if (stageCode === "after_inside") {
            const base3rd69 = showP
              ? joinTags(
                  third69Crotch,
                  `1.45::oral::, 1.45::fellatio::, after fellatio, open mouth, penis in mouth, penis, erection${oral69Used}, saliva, saliva trail`
                )
              : joinTags(third69Crotch, "after cunnilingus, after orgasm, heavy breathing, saliva trail");
            organTags = showP && condomOn
              ? joinTags(base3rd69, "after ejaculation, bulging condom", wtag("cum", 1.35, f), wtag("pussy juice", 1.4, f), "sweat")
              : joinTags(
                  base3rd69,
                  "after ejaculation, heavy breathing",
                  wtag("cum", 1.35, f),
                  "cum in mouth, cum overflow",
                  wtag("cum string", 1.3, f),
                  wtag("pussy juice", 1.4, f),
                  "sweat"
                );
            organProse =
              ", resting right after mutual climax with thick white cum overflowing from her mouth and glistening fluids";
          } else if (stageCode === "prolapse") {
            const base3rd69 = showP
              ? condomOn
                ? joinTags(third69Crotch, "1.5::vaginal prolapse::, 1.3::prolapse::, cervix, 1.4::after fellatio::, pull out, open mouth, penis, 1.35::used condom::, 1.35::cum in condom::")
                : joinTags(third69Crotch, "1.5::vaginal prolapse::, 1.3::prolapse::, cervix, 1.4::after fellatio::, pull out, open mouth, penis, cum on penis")
              : joinTags(third69Crotch, "1.5::vaginal prolapse::, 1.3::prolapse::, cervix, after cunnilingus");
            organTags = joinTags(
              base3rd69,
              wtag("cum", 1.4, f),
              "cum in mouth",
              wtag("cum string", 1.4, f),
              wtag("pussy juice", 1.4, f),
              "saliva trail, sweat"
            );
            organProse =
              ", right after mutual climax with a glistening prolapsed cervix and sticky white cum strings";
          } else {
            const base3rd69 = showP
              ? condomOn
                ? joinTags(third69Crotch, "1.4::after fellatio::, 0.55::oral::, pull out, open mouth, penis, erection, 1.35::used condom::, 1.3::condom on penis::, 1.35::cum in condom::")
                : joinTags(third69Crotch, "1.4::after fellatio::, 0.55::oral::, pull out, open mouth, penis, erection, cum on penis")
              : joinTags(third69Crotch, "after cunnilingus, pull out, open mouth");
            organTags = joinTags(
              base3rd69,
              wtag("cum", 1.4, f),
              "cum in mouth, cum overflow",
              wtag("cum string", 1.45, f),
              wtag("pussy juice", 1.4, f),
              "saliva, saliva trail, sweat"
            );
            organProse =
              ", pulling back slightly right after mutual sixty-nine with sticky white cum strings and glistening fluids";
          }
        }
      } else if (channel === "oral") {
        const oralCondom = showP && condomOn ? ", 1.3::condom::, 1.25::condom on penis::" : "";
        const oralUsedCondom =
          showP && condomOn ? ", 1.35::condom::, 1.3::condom on penis::, 1.35::cum in condom::, used condom" : "";
        if (stageCode === "before") {
          if (showP) {
            organTags = joinTags(
              `oral, fellatio, penis${oralCondom}, open mouth, tongue, saliva`,
              af ? wtag("saliva trail", 1.2, f) : ""
            );
            organProse = condomOn ? ", wearing a condom" : "";
          } else {
            organTags = joinTags(
              "1.3::open mouth::, 1.35::o-shaped mouth::, tongue out, saliva",
              af ? wtag("saliva trail", 1.2, f) : ""
            );
            organProse = ", keeping her mouth hollowed open with tongue extended";
          }
        } else if (stageCode === "during") {
          const baseOrg = showP
            ? `oral, fellatio, penis${oralUsedCondom}, open mouth, tongue, saliva`
            : "1.3::open mouth::, 1.35::o-shaped mouth::, tongue out, saliva";
          organTags = showP && condomOn
            ? joinTags(baseOrg, "ejaculation, climax, bulging condom", wtag("cum", 1.3, f), "saliva")
            : joinTags(
                baseOrg,
                "ejaculation, climax, swallowing",
                wtag("cum", 1.35, f),
                wtag("cum in mouth", 1.4, f),
                wtag("cum overflow", 1.35, f),
                "cum on tongue, saliva"
              );
          organProse =
            showP && condomOn
              ? ", during oral ejaculation as thick white fluid fills and swells the condom tip"
              : (showP ? "" : ", keeping her mouth hollowed open with tongue extended") +
                ", during oral ejaculation as thick white cum fills her mouth and overflows past her lips";
        } else if (stageCode === "after_inside") {
          const baseOrg = showP
            ? `oral, fellatio, penis${oralUsedCondom}, open mouth, tongue, saliva`
            : "1.3::open mouth::, 1.35::o-shaped mouth::, tongue out, saliva";
          organTags = showP && condomOn
            ? joinTags(baseOrg, "after fellatio, after ejaculation, bulging condom", wtag("cum", 1.3, f), "saliva trail")
            : joinTags(
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
            showP && condomOn
              ? ", right after oral ejaculation with the worn condom tip filled with white fluid"
              : (showP ? "" : ", keeping her mouth hollowed open with tongue extended") +
                ", right after oral ejaculation with thick white cum pooling on her tongue and along her lips";
        } else {
          const baseOrg = showP
            ? condomOn
              ? "1.4::after fellatio::, 0.55::oral::, pull out, penis, 1.35::used condom::, 1.3::condom on penis::, 1.35::cum in condom::, open mouth, tongue out, saliva"
              : "1.4::after fellatio::, 0.55::oral::, pull out, penis, cum on penis, open mouth, tongue out, saliva"
            : "1.4::after fellatio::, pull out, 1.3::open mouth::, 1.35::o-shaped mouth::, tongue out, saliva";
          organTags = showP && condomOn
            ? joinTags(baseOrg, wtag("cum", 1.35, f), "saliva trail")
            : joinTags(
                baseOrg,
                wtag("cum", 1.4, f),
                wtag("cum in mouth", 1.3, f),
                wtag("cum on face", 1.35, f),
                wtag("cum on tongue", 1.35, f),
                wtag("cum string", 1.45, f),
                "saliva trail"
              );
          organProse =
            showP && condomOn
              ? ", pulling her mouth back right after fellatio from the filled used condom with glossy saliva trails"
              : (showP ? "" : ", keeping her mouth hollowed open with tongue extended") +
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

        const extCondomBefore = showP && condomOn ? ", 1.3::condom::, 1.25::condom on penis::" : "";
        const extCondomFilled =
          showP && condomOn
            ? ", 1.35::condom::, 1.3::condom on penis::, 1.4::cum in condom::, 1.35::used condom::, bulging condom"
            : "";
        const baseOrg = showP ? `${baseBeforeP}${stageCode === "before" ? extCondomBefore : extCondomFilled}` : baseBeforeNp;
        organProse = showP ? (condomOn && stageCode === "before" ? ", wearing a condom" : "") : npProse;
        if (stageCode === "before") {
          organTags = joinTags(baseOrg, mildFluid);
        } else if (stageCode === "during") {
          organTags = showP && condomOn
            ? joinTags(baseOrg, "ejaculation, climax", wtag("cum", 1.35, f), "sweat")
            : joinTags(
                baseOrg,
                "ejaculation, climax, flying cum",
                wtag("cum", 1.35, f),
                ...surfaceTags,
                wtag("cum string", 1.25, f),
                "sweat"
              );
          organProse +=
            showP && condomOn
              ? `, at the moment of ejaculation as thick white fluid fills and swells the condom tip against her ${surfaceEn}`
              : `, at the moment of ejaculation as thick white cum spurts across her ${surfaceEn}`;
        } else if (stageCode === "after_inside") {
          organTags = showP && condomOn
            ? joinTags(baseOrg, "after ejaculation, heavy breathing", wtag("cum", 1.35, f), "sweat")
            : joinTags(
                baseOrg,
                "after ejaculation, heavy breathing",
                wtag("cum", 1.4, f),
                ...surfaceTags,
                wtag("cumdrip", 1.35, f),
                wtag("cum string", 1.3, f),
                "sweat"
              );
          organProse +=
            showP && condomOn
              ? `, resting right after ejaculation with the swollen cum-filled condom pressed against her ${surfaceEn}`
              : `, resting right after ejaculation while still holding close as thick white cum pools and drips over her ${surfaceEn}`;
        } else if (stageCode === "prolapse") {
          const lowerProlapse =
            channel === "thigh" || channel === "glute" || channel === "foot"
              ? "1.5::vaginal prolapse::, 1.3::prolapse::, cervix, after vaginal"
              : "";
          organTags = showP && condomOn
            ? joinTags(
                baseOrg,
                "after ejaculation, pull out",
                lowerProlapse,
                wtag("cum", 1.4, f),
                wtag("cum overflow", 1.3, f),
                "sweat"
              )
            : joinTags(
                baseOrg,
                "after ejaculation, pull out, excessive cum",
                lowerProlapse,
                wtag("cum", 1.45, f),
                ...surfaceTags,
                wtag("cum string", 1.45, f),
                wtag("cumdrip", 1.4, f),
                "sweat"
              );
          organProse += showP && condomOn
            ? `, pulling back right after ejaculation with white fluid brimming and leaking from the used condom`
            : lowerProlapse
              ? `, pulling back right after ejaculation with a glistening prolapsed cervix exposed and sticky white cum strings stretching across her ${surfaceEn}`
              : `, pulling slightly back right after ejaculation with sticky white cum strings stretching across her ${surfaceEn}`;
        } else {
          organTags = showP && condomOn
            ? joinTags(
                baseOrg,
                "after ejaculation, pull out",
                wtag("cum", 1.4, f),
                wtag("cum overflow", 1.3, f),
                "sweat"
              )
            : joinTags(
                baseOrg,
                "after ejaculation, pull out, excessive cum",
                wtag("cum", 1.45, f),
                ...surfaceTags,
                wtag("cum string", 1.45, f),
                wtag("cumdrip", 1.4, f),
                "sweat"
              );
          organProse += showP && condomOn
            ? `, pulling slightly back right after ejaculation with thick white fluid filling and spilling from the used condom`
            : `, pulling slightly back right after ejaculation with sticky white cum strings stretching across her ${surfaceEn}`;
        }
      }

      const penisNeg = showP ? "" : "penis, phallus, testicles, dildo, sex toy";
      const condomExtraNeg =
        condomOn && channel === "vaginal"
          ? stageCode === "during" || stageCode === "after_inside"
            ? "used condom, condom on ground, multiple condoms, skeleton, bones, skull, ribcage, gore"
            : isPullOutLike
              ? "condom on penis, tied condom, knotted condom, multiple condoms, condom wrapper, condom packet, foil packet, cum on penis, cum string"
              : ""
          : "";
      extraNeg = joinTags(
        partnerNeg,
        penisNeg,
        condomExtraNeg,
        stageCode === "prolapse" ? "anal prolapse" : ""
      );

      if (catTailWrapActive) {
        const hasCatTailInCore = m.char_core.toLowerCase().includes("cat tail");
        organTags = joinTags(
          organTags,
          hasCatTailInCore ? "" : "1.3::cat tail::",
          "1.45::tail around penis::, 1.25::tailjob::, prehensile tail"
        );
        organProse +=
          ", while her flexible cat tail instinctively coils and wraps snugly around the withdrawn penis";
      }
    }

    if (suppressPovFaceAndEyes) {
      const stripHeadFaceSet = new Set([
        "gradient eyes",
        "thick eyelashes",
        "eyelashes",
        "eyelid crease",
        "small white eye highlights",
        "colored eyelashes",
        "eyeshadow",
        "anime face",
        "dot nose",
        "small mouth",
        ":o",
        "partially shaded face",
      ]);
      headUsed = splitTopLevelCommaSegments(headUsed)
        .filter((tok) => {
          const bare = tok.replace(/^-?\d+(?:\.\d+)?::([\s\S]+?)::$/, "$1").trim().toLowerCase();
          return Boolean(bare) && !stripHeadFaceSet.has(bare);
        })
        .join(", ");

      const stripCharFaceSet = new Set([
        "short face",
        "round face",
        "tareme",
        "tsurime",
        "heterochromia",
        "glasses",
        "semi-rimless glasses",
      ]);
      charCoreUsed = splitTopLevelCommaSegments(charCoreUsed)
        .filter((tok) => {
          const bare = tok.replace(/^-?\d+(?:\.\d+)?::([\s\S]+?)::$/, "$1").trim().toLowerCase();
          if (!bare) return false;
          if (stripCharFaceSet.has(bare) || /\beyes$/i.test(bare)) return false;
          return true;
        })
        .join(", ");

      if (m.tune2_inline_neg) {
        m.tune2_inline_neg = "";
      }
    }

    if (
      isPov &&
      (sceneId === "P25" || isTopDownOverShoulderPov || isVentralNoEyesPov) &&
      posOutfit
    ) {
      const stripVentral69Set = isVentralNoEyesPov
        ? new Set([
            "rabbit tail",
            "black pasties",
            "heart pasties",
            "pasties",
            "covered nipples",
          ])
        : new Set(["rabbit tail"]);
      posOutfit = splitTopLevelCommaSegments(posOutfit)
        .filter((tok) => {
          const bare = tok.replace(/^-?\d+(?:\.\d+)?::([\s\S]+?)::$/, "$1").trim().toLowerCase();
          return Boolean(bare) && !stripVentral69Set.has(bare);
        })
        .join(", ");
    }

    if (isVentralNoEyesPov && tailNegUsed) {
      const unblock69NegSet = new Set(["nipples", "open mouth", "lips"]);
      tailNegUsed = tailNegUsed
        .split(",")
        .map((t) => t.trim())
        .filter((t) => Boolean(t) && !unblock69NegSet.has(t.toLowerCase()))
        .join(", ");
    }

    if (isPov && tpl.extra_pov_neg) {
      extraNeg = joinTags(tpl.extra_pov_neg, extraNeg);
    } else if (!isPov && tpl.extra_3rd_neg) {
      extraNeg = joinTags(tpl.extra_3rd_neg, extraNeg);
    }

    if (isRearNoFacePov) {
      const stripFrontOutfitSet = new Set([
        "open jacket",
        "bare breasts",
        "breasts out",
        "nipples",
        "black pasties",
        "heart pasties",
        "pasties",
        "covered nipples",
        "bare stomach",
        "midriff",
        "navel",
        "red bowtie",
        "bowtie",
        "cleavage",
      ]);
      posOutfit = splitTopLevelCommaSegments(posOutfit)
        .filter((tok) => {
          const bare = tok.replace(/^-?\d+(?:\.\d+)?::([\s\S]+?)::$/, "$1").trim().toLowerCase();
          return Boolean(bare) && !stripFrontOutfitSet.has(bare);
        })
        .join(", ");

      const stripRearOrganSet = new Set([
        "cum on stomach",
        "cum on face",
        "cum on lips",
        "cum on tongue",
        "cum in mouth",
        "open mouth",
        "o-shaped mouth",
        "tongue out",
        "tongue",
      ]);
      organTags = splitTopLevelCommaSegments(organTags)
        .filter((tok) => {
          const bare = tok.replace(/^-?\d+(?:\.\d+)?::([\s\S]+?)::$/, "$1").trim().toLowerCase();
          return Boolean(bare) && !stripRearOrganSet.has(bare);
        })
        .join(", ");

      extraNeg = joinTags(
        "looking back, looking back over shoulder, looking at viewer, face, eyes, front view, profile, bare breasts, nipples, navel, midriff, red bowtie",
        extraNeg
      );
    } else if (isTopDownOverShoulderPov) {
      extraNeg = joinTags(
        "front view, straight-on, looking back, looking up at viewer, face, eyes, third-person, male face, male head, male back",
        extraNeg
      );
    }

    const organTargetsNipple = !isRearNoFacePov && /\bnipples?\b/i.test(organTags);
    if ((stageCode === "prolapse" || organTargetsNipple) && tailNegUsed) {
      tailNegUsed = tailNegUsed
        .split(",")
        .map((t) => t.trim())
        .filter((t) => {
          const low = t.toLowerCase();
          if (!low) return false;
          if (stageCode === "prolapse" && low === "gaping") return false;
          if (organTargetsNipple && low === "nipples") return false;
          return true;
        })
        .join(", ");
    }

    const expPos = suppressPovFaceAndEyes
      ? "trembling, twitching"
      : exprIf(
          cfg,
          tpl.default_expr_tags || "furrowed brow, half-closed eyes, watery eyes, blush",
          "",
          sceneId
        );
    const remPos = "sweat";
    const fullNeg = joinTags(extraNeg, transNeg, tailNegUsed);
    const povLbl = isPov ? "第一人称 (POV)" : "第三人称 (客观镜头)";
    const rawCoreProse = isPov && tpl.prose_pov ? tpl.prose_pov : tpl.prose_core;
    const resolvedCoreProse = rawCoreProse.replaceAll("{name}", m.name);
    const effectivePartnerProse = rawCoreProse.includes("{name}") ? "" : partnerProse;
    const proseSentence = rawCoreProse.includes("{name}")
      ? `${resolvedCoreProse}${effectivePartnerProse}${organProse}${bgProse}.`
      : `${m.name} ${resolvedCoreProse}${effectivePartnerProse}${organProse}${bgProse}.`;
    const resolvedCanvas = isPov && tpl.canvas_pov ? tpl.canvas_pov : tpl.canvas;

    const pPos = joinTags(
      headUsed,
      actorTags,
      charCoreUsed,
      bgUsed,
      poseUsed,
      posLeg,
      posOutfit,
      expPos,
      "rating:explicit, nsfw, uncensored",
      organTags,
      remPos,
      proseIf(cfg, proseSentence, transBg, suppressPovFaceAndEyes),
      wrapTailNeg(m, fullNeg, negOn)
    );
    results.push({
      subTitle: `【${tpl.title} · ${povLbl}${sceneBadge}${stageBadge}${condomBadge}】`,
      canvas: resolvedCanvas,
      prompt: pPos,
    });
  } else if (sceneId === "FREE") {
    const m = buildCommonModules(cfg, defEyesOpen);
    const transBg = Boolean(cfg.pos_transparent_bg);
    const nsfwOn = Boolean(cfg.free_action_nsfw);
    const rawFreeTags = (cfg.free_action_tags || "").trim();
    const rawFreeProse = (cfg.free_action_prose || "").trim();
    const hasActorInCustom = /\b(1girl|2girls|multiple girls|1boy|2boys|no humans)\b/i.test(rawFreeTags);
    const actorPrefix = hasActorInCustom ? "" : "1girl, solo";

    const freeOutfit = nsfwOn ? m.outfit_pos : m.front_outfit_tags;
    const freeLeg = m.front_leg_tags;
    const freeShirtProse = nsfwOn ? m.outfit_prose_clause : m.front_shirt_prose;
    const nsfwPrefix = nsfwOn ? "rating:explicit, nsfw, uncensored" : "";
    const anatFree = nsfwOn && cfg.enable_anatomy ? m.anat_pos : "";

    let headUsed = m.head_pos;
    let bgUsed = "";
    let bgProse = "";
    let transNeg = "";
    let tailNegUsed = m.common_tail_neg;
    const scenePreset =
      POS_SCENE_PRESETS[cfg.pos_scene] ??
      POS_SCENE_PRESETS["🛋️ 默认暖光室内沙发（indoors, couch, lamp）"];
    let sceneBadge = "";

    if (transBg) {
      headUsed = sanitizeStyleForTransparentBg(m.head_pos);
      bgUsed = "2.0::transparent background::, has alpha, alpha transparency, no background";
      bgProse = " isolated on a transparent background";
      transNeg =
        "background, simple background, white background, black background, gradient background, " +
        "indoors, outdoors, scenery, furniture, bed, couch, sofa, pillow, window, curtains, wall, floor, drop shadow";
      sceneBadge = " · [🏁透明底]";
    } else if (cfg.enable_background) {
      sceneBadge = scenePreset.badge || " · [🛋️室内沙发]";
      if (scenePreset.code !== "default_couch") {
        headUsed = scenePreset.unblock_dark
          ? m.head_pos.replace(/,\s*warm lighting\b/gi, "")
          : m.head_pos;
        const headSet = new Set(
          headUsed
            .split(",")
            .map((t) => t.trim().replace(/^\d+(?:\.\d+)?::([\s\S]+?)::$/, "$1").trim().toLowerCase())
            .filter(Boolean)
        );
        let rawSceneTags = scenePreset.tags;
        if (
          is25dCelLightingCode(LIGHTING_PRESETS[cfg.lighting_preset]?.code) &&
          scenePreset.code === "sunlit_rug_floor_window"
        ) {
          rawSceneTags = rawSceneTags.replace(
            "large floor-to-ceiling window,",
            "large floor-to-ceiling window, clear blue sky,"
          );
        }
        bgUsed = rawSceneTags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => {
            if (!t) return false;
            const bare = t.replace(/^\d+(?:\.\d+)?::([\s\S]+?)::$/, "$1").trim().toLowerCase();
            return !headSet.has(bare);
          })
          .join(", ");
        bgProse = scenePreset.prose;
        if (scenePreset.unblock_dark && tailNegUsed) {
          tailNegUsed = tailNegUsed
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t && !["dark", "harsh shadows", "high contrast"].includes(t.toLowerCase()))
            .join(", ");
        }
        if (scenePreset.extra_neg) {
          tailNegUsed = joinTags(tailNegUsed, scenePreset.extra_neg);
        }
      } else {
        bgUsed = m.bg_couch;
        bgProse = m.loc_prose;
      }
    }

    const freeHasInherentNsfwOutfit = /\b(nude|reverse bunnysuit|pasties|nipples|micro bikini)\b/i.test(
      freeOutfit
    );
    if (!nsfwOn && !freeHasInherentNsfwOutfit && !/\bnsfw\b/i.test(rawFreeTags)) {
      const existingNegs = tailNegUsed
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      if (!existingNegs.some((t) => t.toLowerCase() === "nsfw")) {
        tailNegUsed = joinTags("nsfw", tailNegUsed);
      }
    } else if ((nsfwOn || freeHasInherentNsfwOutfit) && tailNegUsed) {
      tailNegUsed = tailNegUsed
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t && t.toLowerCase() !== "nsfw")
        .join(", ");
    }

    let resolvedProse = "";
    if (rawFreeProse) {
      resolvedProse = /^[A-Z]/.test(rawFreeProse)
        ? `${rawFreeProse.replace(/\.+\s*$/, "")}${bgProse}.`
        : `${m.name}${freeShirtProse} ${rawFreeProse.replace(/\.+\s*$/, "")}${bgProse}.`;
    } else if (rawFreeTags) {
      resolvedProse = `${m.name}${freeShirtProse}${bgProse}.`;
    }

    const pFree = joinTags(
      headUsed,
      actorPrefix,
      m.char_core,
      bgUsed,
      freeOutfit,
      freeLeg,
      nsfwPrefix,
      anatFree,
      rawFreeTags,
      resolvedProse ? proseIf(cfg, resolvedProse, transBg) : "",
      wrapTailNeg(m, joinTags(transNeg, tailNegUsed), negOn)
    );
    results.push({
      subTitle: `【✍️ 自由手写动作${nsfwOn ? " · [🔞R-18]" : ""}${sceneBadge}】`,
      canvas: "竖图 832x1216",
      prompt: pFree,
    });
  }

  const isPosPovLocked = isPov && sceneId in ALL_POSITIONS_TEMPLATES;
  const suppressPovFacePost =
    isPosPovLocked &&
    (ALL_POSITIONS_TEMPLATES[sceneId].pov_visibility === "rear_no_face" ||
      ALL_POSITIONS_TEMPLATES[sceneId].pov_visibility === "top_down_over_shoulder" ||
      ALL_POSITIONS_TEMPLATES[sceneId].pov_visibility === "ventral_no_eyes");

  // Post-pass 0: Global Character Expression Override (skipped on no-face rear/top-down POV to prevent 180° owl head-turn)
  if (exprCtrl.active && !suppressPovFacePost) {
    results = results.map((item) => ({
      subTitle: `${item.subTitle} · [😊${exprCtrl.short_label}]`,
      canvas: item.canvas,
      prompt: applyExpressionToPrompt(item.prompt, exprCtrl, cfg.enable_t5_prose, negOn),
    }));
  }

  // Post-pass 2: M6 sweat-stripping pass (skipped if active global lighting explicitly requests sweat)
  if (isM6SoftMorningSkinActive(cfg)) {
    const activeLightTags = LIGHTING_PRESETS[cfg.lighting_preset]?.tags ?? "";
    const wantsSweat =
      cfg.add_extra_sweat ||
      (SKIN_PRESETS[cfg.skin_preset] || "").includes("shiny skin") ||
      /\bsweat\b/.test(activeLightTags);
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

  // Post-pass 4: Optional Uterus Cross-Section / X-Ray Pass (auto-disabled on Femboy mode to avoid female womb contradiction)
  const activeGenderMode: CharacterGenderMode = cfg.gender_mode ?? "normal";
  if (cfg.enable_uterus_xray && activeGenderMode !== "femboy") {
    const xraySpec = resolveUterusXraySpec(sceneId, cfg);
    if (xraySpec) {
      results = results.map((item) => {
        if (item.prompt.startsWith("[Base Prompt]")) return item;
        return {
          ...item,
          subTitle: `${item.subTitle} · [🔬子宫透视]`,
          prompt: injectAuxFeatureIntoPrompt(
            item.prompt,
            xraySpec.tags,
            cfg.enable_t5_prose ? xraySpec.prose : "",
            "skeleton, bones, skull, ribcage, gore",
            negOn
          ),
        };
      });
    }
  }

  // Post-pass 4.1: Character Gender Mode Transform (Femboy / Futanari No-Balls / Futanari With-Balls)
  if (activeGenderMode !== "normal") {
    const isRearNoFacePos =
      isPosPovLocked && ALL_POSITIONS_TEMPLATES[sceneId]?.pov_visibility === "rear_no_face";
    const genderBadge =
      activeGenderMode === "femboy"
        ? "🎀伪娘"
        : activeGenderMode === "futa_no_balls"
          ? "⚡扶他·无蛋"
          : "⚡扶他·有蛋";
    results = results.map((item) => {
      if (item.prompt.startsWith("[Base Prompt]")) return item;
      return {
        ...item,
        subTitle: `${item.subTitle} · [${genderBadge}]`,
        prompt: applyGenderModeTransform(item.prompt, activeGenderMode, {
          sceneId,
          isRearNoFacePos,
          enableNegatives: negOn,
          enableProse: cfg.enable_t5_prose,
          engName: (cfg.eng_name || "the character").trim(),
        }),
      };
    });
  }

  // Post-pass 4.2: Deduplicate repeated single-tag tokens in positive prefix (recovers 10~25 duplicate tokens cleanly)
  results = results.map((item) => {
    if (item.prompt.startsWith("[Base Prompt]")) return item;
    return {
      ...item,
      prompt: deduplicatePositiveTagPrefix(item.prompt),
    };
  });

  const maxPosBudget = Math.max(280, Math.min(504, cfg.pos_token_limit ?? 502));

  // Post-pass 4.5: Global Lighting Prose & Badge pass (preserves activeLight.prose 100% intact even when trimming scene prose)
  const activeLight =
    LIGHTING_PRESETS[cfg.lighting_preset] ??
    LIGHTING_PRESETS["🔄 随画风与本幕默认光影（不额外覆盖）"];
  const activeEnv =
    ENV_PRESETS[cfg.env_preset] ?? ENV_PRESETS["🔄 随本幕/体位工具栏默认环境"];
  const isPosTransBg = (sceneId in ALL_POSITIONS_TEMPLATES || sceneId === "FREE") && Boolean(cfg.pos_transparent_bg);
  if (activeLight.code !== "auto" && !isPosTransBg && sceneId !== "MA0") {
    const is25dCel = is25dCelLightingCode(activeLight.code);
    results = results.map((item) => {
      let nextPrompt = item.prompt;
      let hasActualClothesForLight = false;
      let hasTankTopForLight = false;
      if (is25dCel && !nextPrompt.startsWith("[Base Prompt]")) {
        // Strip unwanted sweat/splash in non-fluid scenes (unless user explicitly enabled extra sweat) and add 'shiny clothes' only when clothed
        const negBlocks0: string[] = [];
        let posPart = nextPrompt
          .replace(/(?:,\s*)?(-(?:[1-9]\d*(?:\.\d+)?)::[\s\S]*?::)/g, (_m, block: string) => {
            negBlocks0.push(block.trim());
            return "";
          })
          .replace(/^[ ,]+|[ ,]+$/g, "");
        const negSuffix = negBlocks0.length > 0 ? `, ${negBlocks0.join(", ")}` : "";
        posPart = posPart
          .split(", ")
          .filter((tok) => {
            const bare = tok.trim().replace(/^\d+(?:\.\d+)?::([\s\S]+?)::$/, "$1").trim().toLowerCase();
            if (!cfg.add_extra_sweat && (bare === "sweat" || bare === "flying sweatdrops" || bare === "sweatdrop")) {
              return false;
            }
            return Boolean(bare);
          })
          .join(", ");
        hasActualClothesForLight =
          cfg.enable_outfit &&
          !/\bcompletely nude\b/i.test(posPart) &&
          /\b(shirt|t-shirt|tank top|skirt|dress|leotard|bikini|swimsuit|serafuku|camisole|nightgown|cardigan|shorts|briefs|bra|clothed)\b/i.test(
            posPart
          );
        hasTankTopForLight = /\btank top\b/i.test(posPart);
        if (hasActualClothesForLight && !/\bshiny clothes\b/i.test(posPart)) {
          posPart = posPart.replace("1.18::shiny skin::", "1.18::shiny skin::, shiny clothes");
        }
        if (!suppressPovFacePost && eyesOpenFor25dBlush(sceneId, exprCtrl) && /\bblush\b/i.test(posPart)) {
          if (!/\bblush stickers\b/i.test(posPart) && !/\bnose blush\b/i.test(posPart)) {
            posPart = posPart.replace(/\bblush\b/i, "blush, 1.15::blush stickers::, nose blush");
          } else if (!/\bblush stickers\b/i.test(posPart)) {
            posPart = posPart.replace(/\bblush\b/i, "blush, 1.15::blush stickers::");
          } else if (!/\bnose blush\b/i.test(posPart)) {
            posPart = posPart.replace(/\bblush\b/i, "blush, nose blush");
          }
        }
        nextPrompt = `${posPart}${negSuffix}`;
      }
      const isLockedDarkEnv = Boolean(ALL_POSITIONS_TEMPLATES[sceneId]?.lock_scene_env);
      const skipDaylightProse = isLockedDarkEnv && activeLight.code === "window_golden_rim";
      if (
        cfg.enable_t5_prose &&
        activeLight.prose &&
        !skipDaylightProse &&
        !nextPrompt.startsWith("[Base Prompt]")
      ) {
        let resolvedLightProse = activeLight.prose;
        if (suppressPovFacePost) {
          resolvedLightProse = resolvedLightProse
            .replace(
              "crisp diagonal blush lines on rosy cheeks, a tiny soft white nose-tip triangle highlight, ",
              ""
            )
            .replace(
              "paired with soft velvety gradient eyes, delicate double-eyelid creases, thick curved upper eyelashes, ",
              "paired with "
            )
            .replace("her camera-facing face and body are", "her silhouette is");
        }
        if (activeLight.code === "milky_peach_3tier_cel") {
          if (!hasTankTopForLight) {
            resolvedLightProse = hasActualClothesForLight
              ? resolvedLightProse.replace(
                  ", with cool ice-blue shadows on the white tank top.",
                  ", with cool ice-blue shadows across pale fabric folds."
                )
              : resolvedLightProse.replace(", with cool ice-blue shadows on the white tank top.", ".");
          }
        }
        const negBlocks1: string[] = [];
        const rawPrefix = nextPrompt
          .replace(/(?:,\s*)?(-(?:[1-9]\d*(?:\.\d+)?)::[\s\S]*?::)/g, (_m, block: string) => {
            negBlocks1.push(block.trim());
            return "";
          })
          .replace(/^[ ,]+|[ ,]+$/g, "");
        const negTail = negBlocks1.length > 0 ? `, ${negBlocks1.join(", ")}` : "";
        const buildWithLightProse = (prefixStr: string): string => {
          const sep = prefixStr.endsWith(".") ? " " : ", ";
          return `${prefixStr}${sep}${resolvedLightProse}${negTail}`;
        };
        let candidate = buildWithLightProse(rawPrefix);
        if (countPromptT5Tokens(candidate).api_pos_tokens <= maxPosBudget) {
          nextPrompt = candidate;
        } else {
          // Trim scene prose first while keeping 100% of Danbooru tags AND resolvedLightProse intact!
          const overhead = countPromptT5Tokens(resolvedLightProse).api_pos_tokens + 2;
          const trimmedSceneOnly = enforcePositiveTokenBudget(
            `${rawPrefix}${negTail}`,
            Math.max(240, maxPosBudget - overhead),
            false
          );
          const trimmedPrefix = trimmedSceneOnly
            .replace(/(?:,\s*)?(-(?:[1-9]\d*(?:\.\d+)?)::[\s\S]*?::)/g, "")
            .replace(/^[ ,]+|[ ,]+$/g, "");
          candidate = buildWithLightProse(trimmedPrefix);
          nextPrompt =
            countPromptT5Tokens(candidate).api_pos_tokens <= maxPosBudget
              ? candidate
              : enforcePositiveTokenBudget(candidate, maxPosBudget);
        }
      }
      return {
        ...item,
        subTitle: `${item.subTitle} · [${activeLight.badge}]`,
        prompt: nextPrompt,
      };
    });
  }
  if (
    cfg.enable_background &&
    activeEnv.code !== "auto" &&
    !(sceneId in ALL_POSITIONS_TEMPLATES) &&
    sceneId !== "FREE" &&
    sceneId !== "MA0"
  ) {
    results = results.map((item) => ({
      ...item,
      subTitle: `${item.subTitle} · [${activeEnv.badge}]`,
    }));
  }

  // Post-pass 5: Smart Positive Budget Guard (accounts for exact comma T5 tokens, Web UI Quality Toggle headroom, and V4.5 Vibe reservation)
  results = results.map((item) => {
    if (item.prompt.startsWith("[Base Prompt]")) return item;
    if (measureEffectivePosTokens(item.prompt) <= maxPosBudget) return item;
    return {
      ...item,
      prompt: enforcePositiveTokenBudget(item.prompt, maxPosBudget),
    };
  });

  return results;
}

function eyesOpenFor25dBlush(sceneId: string, exprCtrl: CompiledExpressionOverride): boolean {
  if (sceneId === "MA0") return false;
  return exprCtrl.active ? exprCtrl.eyes_open : true;
}

function resolveUterusXraySpec(
  sceneId: string,
  cfg: CharacterConfig
): { tags: string; prose: string } | null {
  const baseTags = "1.35::x-ray::, 1.35::cross-section::, 1.4::uterus::, cervix";
  if (sceneId in ALL_POSITIONS_TEMPLATES) {
    const tpl = ALL_POSITIONS_TEMPLATES[sceneId];
    if (tpl.builtin_xray) return null;
    const ch = tpl.channel;
    const wombChannels = new Set([
      "vaginal",
      "solo",
      "sixty_nine",
      "fingering",
      "grope_fingering",
      "clit_tease",
      "thigh",
      "tentacle",
    ]);
    if (!wombChannels.has(ch)) return null;
    const stageCode = POS_STAGE_PRESETS[cfg.pos_stage] ?? "before";
    const maleCode = POS_MALE_MODE_PRESETS[cfg.pos_male_mode] ?? "normal";
    const hasPartnerOrgan = Boolean(cfg.pos_show_penis) && maleCode !== "off";

    if (ch === "vaginal") {
      if (cfg.enable_condom) {
        if (stageCode === "during" || stageCode === "after_inside") {
          // Already injected full womb x-ray + ballooning condom inside uterus in main vaginal condom branch
          return null;
        }
        if (stageCode === "pull_out" || stageCode === "prolapse") {
          return {
            tags: `${baseTags}`,
            prose:
              "with an anatomical x-ray cross-section showing her empty womb after pull-out while the cum-filled condom hangs out of her entrance.",
          };
        }
        if (hasPartnerOrgan) {
          return {
            tags: `${baseTags}, 1.35::condom::, 1.3::cervical penetration::`,
            prose:
              "with an anatomical x-ray cross-section showing the condom-sheathed tip pressing through her cervix into her uterus.",
          };
        }
      }
      if (stageCode === "during") {
        return {
          tags: `${baseTags}, 1.4::internal cumshot::, 1.4::cum in uterus::`,
          prose: "with an anatomical x-ray cross-section showing fluid filling her uterus.",
        };
      }
      if (stageCode === "after_inside" || stageCode === "pull_out" || stageCode === "prolapse") {
        return {
          tags: `${baseTags}, 1.4::cum in uterus::`,
          prose: "with an anatomical x-ray cross-section showing fluid pooled inside her uterus.",
        };
      }
      if (hasPartnerOrgan) {
        return {
          tags: `${baseTags}, 1.25::cervical penetration::`,
          prose: "with an anatomical x-ray cross-section showing deep contact against her cervix and uterus.",
        };
      }
    } else if (ch === "solo" && stageCode !== "before") {
      return {
        tags: `${baseTags}, 1.35::cum in uterus::`,
        prose: "with an anatomical x-ray cross-section showing fluid pooled inside her uterus.",
      };
    }
    return {
      tags: baseTags,
      prose: "with a translucent anatomical x-ray cross-section revealing her cervix and uterus.",
    };
  }

  if (
    (sceneId in MULTI_ANGLE_TEMPLATES &&
      sceneId !== "MA0" &&
      sceneId !== "MA7A" &&
      sceneId !== "MA7D" &&
      !MULTI_ANGLE_TEMPLATES[sceneId]?.builtin_xray &&
      (cfg.enable_multi_angle_nsfw || Boolean(MULTI_ANGLE_TEMPLATES[sceneId]?.force_nsfw))) ||
    (sceneId === "FREE" && cfg.free_action_nsfw)
  ) {
    return {
      tags: baseTags,
      prose: "with a translucent anatomical x-ray cross-section revealing her uterus.",
    };
  }
  return null;
}

function injectAuxFeatureIntoPrompt(
  rawPrompt: string,
  auxTags: string,
  auxProse: string,
  extraNegGuard: string,
  enableNegatives: boolean
): string {
  const negBlocks: string[] = [];
  let posOnly = rawPrompt
    .replace(/(?:,\s*)?(-(?:[1-9]\d*(?:\.\d+)?)::[\s\S]*?::)/g, (_m, block: string) => {
      negBlocks.push(block.trim());
      return "";
    })
    .replace(/^[ ,]+|[ ,]+$/g, "");

  const segments = posOnly.split(/,\s+/);
  let proseIdx = -1;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i].trim();
    if (!seg || seg.includes("::")) continue;
    if (/^[A-Z]|^the girl\b/.test(seg) || seg.split(/\s+/).length >= 8) {
      proseIdx = i;
      break;
    }
  }

  if (proseIdx > 0) {
    const before = segments.slice(0, proseIdx).join(", ");
    let after = segments.slice(proseIdx).join(", ");
    if (auxProse) {
      after = `${after.replace(/\.+\s*$/, "")}, ${auxProse}`;
    }
    posOnly = `${before}, ${auxTags}, ${after}`;
  } else {
    posOnly = auxProse ? `${posOnly}, ${auxTags}, ${auxProse}` : `${posOnly}, ${auxTags}`;
  }

  if (enableNegatives && extraNegGuard) {
    const mainIdx = negBlocks.findIndex((b) => b.startsWith("-2::"));
    if (mainIdx !== -1) {
      const inner = negBlocks[mainIdx].slice(4, -2).trim();
      negBlocks[mainIdx] = `-2::${inner ? `${inner}, ${extraNegGuard}` : extraNegGuard}::`;
    } else {
      negBlocks.unshift(`-2::${extraNegGuard}::`);
    }
  }

  return negBlocks.length > 0 ? `${posOnly}, ${negBlocks.join(", ")}` : posOnly;
}

function splitTopLevelCommaSegments(input: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inWeightSpan = false;
  for (let i = 0; i < input.length; i++) {
    if (input[i] === ":" && input[i + 1] === ":") {
      inWeightSpan = !inWeightSpan;
      cur += "::";
      i++;
      continue;
    }
    if (!inWeightSpan && input[i] === ",") {
      const trimmed = cur.trim();
      if (trimmed) out.push(trimmed);
      cur = "";
      continue;
    }
    cur += input[i];
  }
  const tail = cur.trim();
  if (tail) out.push(tail);
  return out;
}

function deduplicatePositiveTagPrefix(rawPrompt: string): string {
  const negBlocks: string[] = [];
  const posOnly = rawPrompt
    .replace(/(?:,\s*)?(-(?:[1-9]\d*(?:\.\d+)?)::[\s\S]*?::)/g, (_m, block: string) => {
      negBlocks.push(block.trim());
      return "";
    })
    .replace(/^[ ,]+|[ ,]+$/g, "");

  const segments = splitTopLevelCommaSegments(posOnly);
  let proseIdx = -1;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (!seg || seg.includes("::")) continue;
    if (/^[A-Z]|^the girl\b/.test(seg) || seg.split(/\s+/).length >= 8) {
      proseIdx = i;
      break;
    }
  }

  const tagSegs = proseIdx >= 0 ? segments.slice(0, proseIdx) : segments;
  const proseSegs = proseIdx >= 0 ? segments.slice(proseIdx) : [];

  const dedupedTags: string[] = [];
  const seenKeyToSlot = new Map<string, { idx: number; hasExplicitWeight: boolean; weight?: number }>();

  for (const seg of tagSegs) {
    const mW = /^(-?\d+(?:\.\d+)?)::([\s\S]+?)::$/.exec(seg);
    if (mW) {
      const w = parseFloat(mW[1]);
      const inner = mW[2].trim();
      // Leave multi-tag weight spans or negative counterweights untouched
      if (w <= 0 || inner.includes(",")) {
        dedupedTags.push(seg);
        continue;
      }
      const key = inner.toLowerCase();
      const prev = seenKeyToSlot.get(key);
      if (prev) {
        const prevWeight = prev.weight ?? 1.0;
        if (!prev.hasExplicitWeight || w > prevWeight) {
          dedupedTags[prev.idx] = seg;
          prev.hasExplicitWeight = true;
          prev.weight = w;
        }
        continue;
      }
      seenKeyToSlot.set(key, { idx: dedupedTags.length, hasExplicitWeight: true, weight: w });
      dedupedTags.push(seg);
    } else {
      const key = seg.toLowerCase();
      if (seenKeyToSlot.has(key)) {
        continue;
      }
      seenKeyToSlot.set(key, { idx: dedupedTags.length, hasExplicitWeight: false });
      dedupedTags.push(seg);
    }
  }

  const rebuiltPos = [...dedupedTags, ...proseSegs].join(", ");
  return negBlocks.length > 0 ? `${rebuiltPos}, ${negBlocks.join(", ")}` : rebuiltPos;
}

function measureEffectivePosTokens(rawPrompt: string): number {
  const { posPrompt } = splitPromptPosAndNeg(rawPrompt);
  return countPromptT5Tokens(applySmartQualitySuffix(posPrompt, true)).api_pos_tokens;
}

function enforcePositiveTokenBudget(
  rawPrompt: string,
  maxPosTokens = 510,
  allowTagTrim = true
): string {
  if (measureEffectivePosTokens(rawPrompt) <= maxPosTokens) {
    return rawPrompt;
  }

  const negBlocks: string[] = [];
  const posOnly = rawPrompt
    .replace(/(?:,\s*)?(-(?:[1-9]\d*(?:\.\d+)?)::[\s\S]*?::)/g, (_m, block: string) => {
      negBlocks.push(block.trim());
      return "";
    })
    .replace(/^[ ,]+|[ ,]+$/g, "");

  const rebuild = (candidatePos: string): string => {
    const cleanP = candidatePos.replace(/^[ ,]+|[ ,]+$/g, "");
    return negBlocks.length > 0 ? `${cleanP}, ${negBlocks.join(", ")}` : cleanP;
  };

  // Locate start of trailing T5 prose sentence (first comma-segment that starts with Uppercase or has >=6 plain words)
  const segments = posOnly.split(/,\s+/);
  let proseIdx = -1;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i].trim();
    if (!seg || seg.includes("::")) continue;
    const wordCount = seg.split(/\s+/).length;
    if (/^[A-Z]|^the girl\b/.test(seg) || wordCount >= 8) {
      proseIdx = i;
      break;
    }
  }

  if (proseIdx > 0) {
    const tagsPart = segments.slice(0, proseIdx).join(", ");
    const prosePart = segments.slice(proseIdx).join(", ").replace(/\.+\s*$/, "");

    const colonIdx = prosePart.indexOf(": ");
    if (colonIdx !== -1) {
      const stylePrefix = prosePart.slice(0, colonIdx).trim();
      const bodyClauses = prosePart
        .slice(colonIdx + 2)
        .split(/;\s+|,\s+/)
        .filter(Boolean);

      for (let keep = bodyClauses.length - 1; keep >= 1; keep--) {
        const cand = rebuild(`${tagsPart}, ${stylePrefix}: ${bodyClauses.slice(0, keep).join(", ")}.`);
        if (measureEffectivePosTokens(cand) <= maxPosTokens) {
          return cand;
        }
      }

      const styleOnlyCand = rebuild(`${tagsPart}, ${stylePrefix}.`);
      if (measureEffectivePosTokens(styleOnlyCand) <= maxPosTokens) {
        return styleOnlyCand;
      }

      const prefixClauses = stylePrefix.split(/,\s+/).filter(Boolean);
      for (let keep = prefixClauses.length - 1; keep >= 1; keep--) {
        const cand = rebuild(`${tagsPart}, ${prefixClauses.slice(0, keep).join(", ")}.`);
        if (measureEffectivePosTokens(cand) <= maxPosTokens) {
          return cand;
        }
      }
    } else {
      const clauses = prosePart.split(/;\s+|,\s+/).filter(Boolean);
      for (let keep = clauses.length - 1; keep >= 1; keep--) {
        const cand = rebuild(`${tagsPart}, ${clauses.slice(0, keep).join(", ")}.`);
        if (measureEffectivePosTokens(cand) <= maxPosTokens) {
          return cand;
        }
      }
    }

    // Fallback: keep 100% of Danbooru tags and drop trailing T5 prose
    const tagsOnlyCand = rebuild(tagsPart);
    if (!allowTagTrim || measureEffectivePosTokens(tagsOnlyCand) <= maxPosTokens) {
      return tagsOnlyCand;
    }
    // Extreme custom-tag overflow fallback: trim trailing unessential tags until within budget
    const tagTokens = tagsPart.split(/,\s+/);
    while (tagTokens.length > 10) {
      tagTokens.pop();
      const shrunk = rebuild(tagTokens.join(", "));
      if (measureEffectivePosTokens(shrunk) <= maxPosTokens) {
        return shrunk;
      }
    }
    return tagsOnlyCand;
  }

  return rawPrompt;
}

const ANTI_OVERSIZE_ANATOMY_UC = [
  "huge penis",
  "large penis",
  "oversized penis",
  "thick penis",
  "hyper penis",
  "monster penis",
  "veiny penis",
  "giant penis",
  "huge testicles",
  "large testicles",
];

function stripWeightPrefix(tok: string): string {
  return tok.trim().replace(/^-?\d+(?:\.\d+)?::([\s\S]+?)::$/, "$1").trim().toLowerCase();
}

function applyGenderModeTransform(
  rawPrompt: string,
  mode: Exclude<CharacterGenderMode, "normal">,
  opts: {
    sceneId: string;
    isRearNoFacePos: boolean;
    enableNegatives: boolean;
    enableProse: boolean;
    engName: string;
  }
): string {
  const isMa7Derivative =
    opts.sceneId === "MA7A" ||
    opts.sceneId === "MA7B" ||
    opts.sceneId === "MA7C" ||
    opts.sceneId === "MA7D";
  const isMa7Xray = opts.sceneId === "MA7B" || opts.sceneId === "MA7C";
  const isMa7Pregnant = opts.sceneId === "MA7A" || opts.sceneId === "MA7B";
  const isMa7Flat = opts.sceneId === "MA7C" || opts.sceneId === "MA7D";
  const negBlocks: string[] = [];
  const posOnly = rawPrompt
    .replace(/(?:,\s*)?(-(?:[1-9]\d*(?:\.\d+)?)::[\s\S]*?::)/g, (_m, block: string) => {
      negBlocks.push(block.trim());
      return "";
    })
    .replace(/^[ ,]+|[ ,]+$/g, "");

  const segments = splitTopLevelCommaSegments(posOnly);
  let proseIdx = -1;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (!seg || seg.includes("::")) continue;
    if (/^[A-Z]|^the girl\b/.test(seg) || seg.split(/\s+/).length >= 8) {
      proseIdx = i;
      break;
    }
  }

  const tagSegs = proseIdx >= 0 ? segments.slice(0, proseIdx) : segments;
  let prosePart = proseIdx >= 0 ? segments.slice(proseIdx).join(", ") : "";
  const bareTagSet = new Set(tagSegs.map((t) => stripWeightPrefix(t)));

  const hasPartnerBoy =
    bareTagSet.has("1boy") ||
    bareTagSet.has("2boys") ||
    bareTagSet.has("hetero") ||
    bareTagSet.has("faceless male");
  const isNsfw =
    bareTagSet.has("nsfw") ||
    bareTagSet.has("rating:explicit") ||
    bareTagSet.has("uncensored") ||
    bareTagSet.has("pussy") ||
    bareTagSet.has("vaginal") ||
    bareTagSet.has("oral") ||
    bareTagSet.has("fellatio");
  const isBareChest =
    bareTagSet.has("bare breasts") ||
    bareTagSet.has("breasts out") ||
    bareTagSet.has("nude") ||
    bareTagSet.has("completely nude") ||
    bareTagSet.has("open jacket") ||
    bareTagSet.has("nipples") ||
    bareTagSet.has("black pasties") ||
    bareTagSet.has("heart pasties");
  const isPullOutScene =
    bareTagSet.has("pull out") ||
    bareTagSet.has("after vaginal") ||
    bareTagSet.has("after sex") ||
    bareTagSet.has("vaginal prolapse");
  const isProlapseScene =
    bareTagSet.has("vaginal prolapse") || bareTagSet.has("prolapse");
  const isPenetratedScene =
    bareTagSet.has("vaginal") ||
    bareTagSet.has("insertion") ||
    bareTagSet.has("cervical penetration") ||
    bareTagSet.has("after vaginal") ||
    bareTagSet.has("vaginal prolapse") ||
    bareTagSet.has("fingering") ||
    bareTagSet.has("double penetration");

  let mainNegTokens: string[] = [];
  const extraNegBlocks: string[] = [];
  for (const nb of negBlocks) {
    if (nb.startsWith("-2::") && mainNegTokens.length === 0) {
      mainNegTokens = nb
        .slice(4, -2)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else {
      extraNegBlocks.push(nb);
    }
  }

  const outTags: string[] = [];

  if (mode === "femboy") {
    const femboyStripPos = new Set([
      "1girl",
      "1boy",
      "hetero",
      "small breasts",
      "medium breasts",
      "large breasts",
      "huge breasts",
      "flat chest",
      "bare breasts",
      "breasts out",
      "cleavage",
      "underboob",
      "black pasties",
      "heart pasties",
      "pasties",
      "covered nipples",
      "nipples",
      "pussy",
      "vulva",
      "labia",
      "clitoris",
      "spread pussy",
      "spreading own pussy",
      "spreading another's pussy",
      "clitoral stimulation",
      "pussy juice",
      "pussy juice trail",
      "pussy juice string",
      "pussy juice on fingers",
      "pussy from behind",
      "cunnilingus",
      "licking pussy",
      "tongue on pussy",
      "female ejaculation",
      "squirting",
      "vaginal",
      "insertion",
      "cervical penetration",
      "after vaginal",
      "cum in pussy",
      "cum on pussy",
      "vaginal prolapse",
      "prolapse",
      "cervix",
      "uterus",
      "cum in uterus",
      "eggs in uterus",
      "x-ray",
      "cross-section",
      "pregnant",
      "female masturbation",
      "paizuri",
      "paizuri pose",
      "breasts squeezed together",
      "breast grab",
      "grabbing own breasts",
      "grabbing another's breast",
      "breast grab from behind",
      "squeezing breasts",
      "sunken breasts",
      "flushed breasts",
      "erect nipples",
      "nipple tweak",
      "pinching nipples",
      "pink pussy",
      "dark pigmented labia edges",
      "two-tone mucosa",
      "flushed groin",
      "used condom in pussy",
      "cum in condom",
      ...(isMa7Derivative ? ["fingers"] : []),
    ]);
    if (isMa7Pregnant) {
      femboyStripPos.delete("pregnant");
    }

    let actorInserted = false;
    let bodyChestInserted = false;

    for (const seg of tagSegs) {
      const bare = stripWeightPrefix(seg);
      if (!bare) continue;

      if (bare === "1girl") {
        if (!actorInserted) {
          actorInserted = true;
          if (hasPartnerBoy) {
            outTags.push(
              "2boys",
              "1.55::yaoi::",
              "1.55::otoko no ko::",
              "1.45::crossdressing::",
              "1.35::genderbend::"
            );
          } else {
            outTags.push(
              isNsfw ? "1.45::1boy::" : "1.35::1boy::",
              "solo",
              isNsfw ? "1.55::otoko no ko::" : "1.45::otoko no ko::",
              isNsfw ? "1.45::crossdressing::" : "1.4::crossdressing::",
              "1.35::genderbend::",
              "androgynous"
            );
          }
        }
        continue;
      }

      if (bare === "solo" && actorInserted && !hasPartnerBoy) {
        continue;
      }

      if (bare === "short female") {
        outTags.push("1.25::short male::");
        continue;
      }

      if (bare === "bare breasts" || bare === "breasts out") {
        if (!opts.isRearNoFacePos && !bodyChestInserted) {
          bodyChestInserted = true;
          outTags.push(
            "bare chest",
            "1.55::flat chest::",
            "1.4::flat male chest::",
            "tiny pink nipples",
            "hairless torso"
          );
        }
        continue;
      }

      if (femboyStripPos.has(bare)) {
        continue;
      }

      // Prevent huge bare penis boost on petite femboy
      if (bare === "penis" && !hasPartnerBoy) {
        continue;
      }

      outTags.push(seg);
    }

    if (!actorInserted) {
      outTags.unshift(
        ...(hasPartnerBoy
          ? ["2boys", "1.55::yaoi::", "1.55::otoko no ko::", "1.45::crossdressing::", "1.35::genderbend::"]
          : [
              isNsfw ? "1.45::1boy::" : "1.35::1boy::",
              "solo",
              isNsfw ? "1.55::otoko no ko::" : "1.45::otoko no ko::",
              "1.4::crossdressing::",
              "1.35::genderbend::",
              "androgynous",
            ])
      );
    }

    if (!opts.isRearNoFacePos && !bodyChestInserted) {
      outTags.push(
        ...(isBareChest
          ? ["bare chest", "1.55::flat chest::", "1.4::flat male chest::", "tiny pink nipples", "hairless torso"]
          : ["1.45::flat chest::", "male chest", "hairless chest"])
      );
    }

    if (isNsfw) {
      if (isMa7Derivative) {
        if (isMa7Flat) {
          outTags.push("hand on hip");
        }
        outTags.push(
          "1.45::male::",
          "1.55::small penis::",
          "1.35::tiny penis::",
          "1.35::small testicles::",
          "testicles",
          "1.35::erection::",
          "1.45::precum::",
          "1.4::precum string::",
          "dripping"
        );
        if (isMa7Xray) {
          outTags.push(
            "1.45::x-ray::",
            "1.4::cross-section::",
            "1.45::intestines::",
            "1.5::cum in ass::",
            "internal cumshot"
          );
        }
      } else if (hasPartnerBoy && isPenetratedScene) {
        if (isPullOutScene) {
          outTags.push(
            "1.45::after anal::",
            "1.45::pull out::",
            "after sex",
            "1.35::spread anus::",
            "1.3::gaping::",
            ...(isProlapseScene ? ["1.45::anal prolapse::"] : []),
            "cum in ass",
            "cum overflow",
            "cumdrip",
            "cum string",
            ...(opts.isRearNoFacePos
              ? ["1.35::small penis::", "1.3::small testicles::", "testicles"]
              : ["1.4::small penis::", "1.3::small testicles::", "testicles", "erection"])
          );
        } else {
          outTags.push(
            "1.5::anal::",
            "1.45::anal penetration::",
            "1.45::male penetrated::",
            ...(opts.isRearNoFacePos
              ? ["1.35::small penis::", "1.3::small testicles::", "testicles"]
              : ["1.4::small penis::", "1.3::small testicles::", "testicles", "erection"])
          );
        }
      } else if (hasPartnerBoy) {
        outTags.push("1.4::small penis::", "1.3::small testicles::", "testicles", "erection");
      } else {
        outTags.push(
          "1.45::male::",
          "1.55::small penis::",
          "1.35::tiny penis::",
          "1.35::small testicles::",
          "testicles",
          "erection",
          "precum"
        );
      }
    } else if (bareTagSet.has("skirt lift") || bareTagSet.has("panties")) {
      outTags.push("1.25::bulge::");
    }

    if (opts.enableProse && prosePart) {
      if (isMa7Derivative) {
        const bellyDesc = isMa7Pregnant
          ? "while resting his other hand on his taut round distended belly with a protruding navel"
          : "with his other hand resting on his hip above his slender flat belly";
        const xrayDesc = isMa7Xray
          ? ", accompanied by a centered anatomical cross-section x-ray cutaway window showing his intestines filled with white cum"
          : "";
        prosePart = `${opts.engName} in a cowboy shot with legs apart, completely flat male chest, tilting his head with a peace sign near his cheek ${bellyDesc}, unobstructed crotch showing his small erect penis dripping clear prostatic precum threads${xrayDesc}.`;
      } else {
        prosePart = prosePart
          .replace(/\bher\b/gi, "his")
          .replace(/\bshe\b/gi, "he")
          .replace(/\bgirl\b/gi, "petite crossdressing boy")
          .replace(/\bbare breasts\b/gi, "flat male chest")
          .replace(/\bbreasts\b/gi, "flat chest")
          .replace(/\bpussy\b/gi, "back entrance")
          .replace(/\blower anatomy\b/gi, "slender hips");
      }
    }

    const femboyUnblockNeg = new Set([
      "1boy",
      "male",
      "2boys",
      "yaoi",
      "penis",
      "phallus",
      "testicles",
      "balls",
      "scrotum",
      "flat chest",
      "male chest",
      "nipples",
      "anal",
      ...(isProlapseScene ? ["anal prolapse"] : []),
      ...(isMa7Derivative ? ["dripping"] : []),
      ...(isMa7Xray ? ["x-ray", "cross-section", "cutaway", "internal cumshot"] : []),
      "otoko no ko",
      "crossdressing",
      "genderbend",
      "bulge",
    ]);
    const femboyAddNeg = [
      "1girl",
      "female",
      "girl",
      "hetero",
      "breasts",
      "small breasts",
      "medium breasts",
      "large breasts",
      "cleavage",
      "underboob",
      "pussy",
      "vulva",
      "labia",
      "vaginal",
      "futanari",
      "hermaphrodite",
      ...(isMa7Derivative ? ["uterus", "cervix", "extra hands", "extra fingers"] : []),
      ...(isPullOutScene && !isMa7Derivative ? ["anal penetration", "insertion"] : []),
      "muscular",
      "muscular male",
      "bara",
      "broad shoulders",
      "wide shoulders",
      "thick neck",
      "adam's apple",
      "facial hair",
      "stubble",
      "mature male",
      "tall male",
      ...(hasPartnerBoy
        ? ["hyper penis", "monster penis", "giant penis", "huge testicles"]
        : ANTI_OVERSIZE_ANATOMY_UC),
    ];
    mainNegTokens = mainNegTokens.filter((t) => !femboyUnblockNeg.has(t.toLowerCase()));
    const lowerNeg = new Set(mainNegTokens.map((t) => t.toLowerCase()));
    for (let i = femboyAddNeg.length - 1; i >= 0; i--) {
      const tag = femboyAddNeg[i];
      if (!lowerNeg.has(tag.toLowerCase())) {
        mainNegTokens.unshift(tag);
        lowerNeg.add(tag.toLowerCase());
      }
    }
  } else {
    // Futanari (futa_no_balls | futa_with_balls)
    const withBalls = mode === "futa_with_balls";
    // On Solo scenes, use strict petite small/tiny penis + full Anti-Oversize UC.
    // On 2-person Male-on-Futa scenes, AVOID global `1.55::small penis::, 1.35::tiny penis::` and `large penis / thick penis` UC
    // so the male partner's penis stays normal/full-sized while T5 prose + gentle `1.15::small futanari penis::` keeps ONLY her shaft compact!
    const futaCoreTags = isNsfw
      ? hasPartnerBoy
        ? [
            "1.55::futanari::",
            withBalls ? "1.45::futa with balls::" : "1.45::futa without balls::",
            ...(withBalls ? ["1.25::small testicles::", "testicles"] : []),
            "erection",
          ]
        : !opts.isRearNoFacePos
          ? [
              "1.55::futanari::",
              withBalls ? "1.45::futa with balls::" : "1.45::futa without balls::",
              "1.55::small penis::",
              "1.35::tiny penis::",
              ...(withBalls ? ["1.35::small testicles::", "testicles"] : []),
              "erection",
            ]
          : [
              "1.55::futanari::",
              withBalls ? "1.45::futa with balls::" : "1.45::futa without balls::",
              "1.4::small penis::",
              ...(withBalls ? ["1.3::small testicles::", "testicles"] : []),
              "erection",
            ]
      : [
          "1.55::futanari::",
          withBalls ? "1.45::futa with balls::" : "1.45::futa without balls::",
        ];

    let futaHeaderInserted = false;
    const futaAntiPasteStrip =
      isNsfw && !opts.isRearNoFacePos
        ? new Set([
            "groin",
            "pussy",
            "labia",
            "clitoris",
            "spread pussy",
            "spreading own pussy",
            "gaping",
            "pink pussy",
            "dark pigmented labia edges",
            "two-tone mucosa",
            "flushed groin",
            ...(isMa7Derivative ? ["fingers"] : []),
          ])
        : isMa7Derivative
          ? new Set(["spread pussy", "spreading own pussy", "fingers"])
          : null;
    for (const seg of tagSegs) {
      const bare = stripWeightPrefix(seg);
      if (!bare) continue;
      if (futaAntiPasteStrip && futaAntiPasteStrip.has(bare)) continue;
      if (bare === "1girl") {
        outTags.push(seg);
        if (!futaHeaderInserted) {
          futaHeaderInserted = true;
          outTags.push(...futaCoreTags);
        }
        continue;
      }
      outTags.push(seg);
    }
    if (!futaHeaderInserted) {
      outTags.unshift(...futaCoreTags);
    }

    if (isNsfw) {
      if (isMa7Derivative) {
        if (isMa7Flat) {
          outTags.push("hand on hip");
        }
        outTags.push(
          "1.35::erection::",
          "1.45::precum::",
          "1.4::precum string::",
          "dripping",
          "1.35::pussy::"
        );
        if (opts.enableProse && prosePart) {
          const bellyClause = isMa7Pregnant
            ? "while resting her other hand on her taut round distended belly with a protruding navel"
            : "with her other hand resting on her hip above her slender flat belly";
          const shaftDesc = withBalls
            ? "small erect futanari shaft with small neat testicles"
            : "small erect ball-free futanari shaft";
          const xrayClause = isMa7Xray
            ? ", accompanied by a centered x-ray uterus cutaway showing her womb filled to capacity"
            : "";
          prosePart = `${opts.engName} in a cowboy shot with legs apart, tilting her head with a peace sign near her cheek ${bellyClause}, unobstructed crotch showing ${shaftDesc} dripping clear precum threads above her pussy overflowing with thick white cum${xrayClause}.`;
        }
      } else {
        if (!opts.isRearNoFacePos) {
          outTags.push("1.35::precum::");
        }
        if (opts.enableProse && prosePart && hasPartnerBoy && isPenetratedScene && !opts.isRearNoFacePos) {
          const layerClause = isPullOutScene
            ? withBalls
              ? "exposing her small female breasts and her own cute petite erect futanari penis with small neat testicles resting high above her parted pussy, contrasting cleanly against the male partner's thicker normal-sized penis withdrawing below."
              : "exposing her small female breasts and her own cute petite erect ball-free futanari penis resting high above her parted pussy, contrasting cleanly against the male partner's thicker normal-sized penis withdrawing below."
            : withBalls
              ? "exposing her small female breasts and her own cute petite erect futanari penis with small neat testicles resting high above her glistening pussy while the male partner's normal-sized penis penetrates her pussy cleanly underneath."
              : "exposing her small female breasts and her own cute petite erect ball-free futanari penis resting above her glistening pussy while the male partner's normal-sized penis penetrates her pussy cleanly underneath.";
          prosePart = `${prosePart.replace(/\.+\s*$/, "")}, ${layerClause}`;
        }
      }
    } else if (bareTagSet.has("skirt lift") || bareTagSet.has("panties")) {
      outTags.push("1.25::bulge::");
    }

    const futaUnblockNeg = new Set([
      "penis",
      "phallus",
      "futanari",
      ...(isMa7Derivative ? ["dripping"] : []),
      ...(withBalls ? ["testicles", "balls", "scrotum"] : []),
    ]);
    const futaOversizeNeg = hasPartnerBoy
      ? ["hyper penis", "monster penis", "giant penis", "huge testicles"]
      : ANTI_OVERSIZE_ANATOMY_UC;
    const futaAddNeg = [
      ...(hasPartnerBoy ? ["2boys"] : ["1boy", "male"]),
      "otoko no ko",
      "crossdressing",
      "yaoi",
      "flat chest",
      "male chest",
      "pectorals",
      ...(isMa7Derivative ? ["extra hands", "extra fingers"] : []),
      ...(withBalls ? [] : ["testicles", "balls", "scrotum"]),
      ...futaOversizeNeg,
    ];
    mainNegTokens = mainNegTokens.filter((t) => !futaUnblockNeg.has(t.toLowerCase()));
    const lowerNeg = new Set(mainNegTokens.map((t) => t.toLowerCase()));
    for (let i = futaAddNeg.length - 1; i >= 0; i--) {
      const tag = futaAddNeg[i];
      if (!lowerNeg.has(tag.toLowerCase())) {
        mainNegTokens.unshift(tag);
        lowerNeg.add(tag.toLowerCase());
      }
    }
  }

  const rebuiltPos = prosePart ? `${outTags.join(", ")}, ${prosePart}` : outTags.join(", ");
  const outParts = [rebuiltPos];
  if (opts.enableNegatives && mainNegTokens.length > 0) {
    outParts.push(`-2::${mainNegTokens.join(", ")}::`);
  }
  outParts.push(...extraNegBlocks);
  return outParts.join(", ");
}
