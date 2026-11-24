import {
  AFTERSEX_DRIP_DRESSED_CHEST_UC,
  AFTERSEX_DRIP_LIGHT_DEFAULTS,
  AFTERSEX_DRIP_LIGHT_STREAM_UC,
  ALL_POSITIONS_CHAPTERS,
  ALL_POSITIONS_TEMPLATES,
  APRON_ONLY_UC,
  BATHROOM_TOWEL_UC,
  BODY_PRESETS,
  BUILTIN_CHARACTERS,
  BUST_PRESETS,
  CAMPING_BAREFOOT_BAN_UC,
  CAMPING_LIGHT_DEFAULTS,
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
  FEMALE_APRON_NO_LEGWEAR,
  FEMALE_NAKED_APRON_CORE,
  FEMALE_NAKED_APRON_REAR_ONLY_CORE,
  FEMBOY_APRON_NO_LEGWEAR,
  FEMBOY_NAKED_APRON_CORE,
  FOOT_ANAT_UC,
  FUTA_APRON_NO_LEGWEAR,
  FUTA_NAKED_APRON_CORE,
  KITCHEN_LANDSCAPE_ANTI_LETTERBOX_UC,
  kitchenLegwearTagsFor,
  LEGWEAR_PRESETS,
  type LightAxisMode,
  MORPH_PRESETS,
  MULTI_ANGLE_CHAPTERS,
  MULTI_ANGLE_TEMPLATES,
  ONSEN_BAREFOOT_BAN_UC,
  ONSEN_LIGHT_DEFAULTS,
  ONSEN_SOLO_SPREAD_EXTRA_UC,
  ONSEN_UNDERGARMENT_UC,
  OTHER_ACTION_TEMPLATES,
  OUTFIT_PRESETS,
  OUTFIT_STATE_PRESETS,
  PHOTO_SUBSTITUTE_GUARD_UC,
  PIGMENT_PRESETS,
  POOL_LIGHT_DEFAULTS,
  POOL_SWIM_UC,
  POOL_SWIMWEAR_SPECS,
  POS_MALE_MODE_PRESETS,
  POS_SCENE_PRESETS,
  POS_STAGE_PRESETS,
  PUBIC_PRESETS,
  QUALITY_TAGS,
  resolveContrastingPhotoPortrait,
  resolveLightingPresetEntry,
  SF_BASE_CEL_LIGHT_BACKLIT,
  SF_BASE_CEL_LIGHT_NO_BACKLIGHT,
  SF_DIRECT_POV_UC,
  SF_MIRROR_UC,
  SKIN_PRESETS,
  STYLE_PRESETS,
} from "../data/engineConstants";
import {
  applySmartQualitySuffix,
  countPromptT5Tokens,
  deduplicateCommaTags,
  encodeT5Len,
  splitPromptPosAndNeg,
} from "./t5Tokenizer";
import type {
  CharacterConfig,
  CharacterGenderMode,
  PerspectiveMode,
  PixivBarCensorMode,
  ScenePromptItem,
  StageProgressionMode,
  StageProgressionTask,
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

function isExplicitKitchenLightingCode(code: string | undefined): boolean {
  return Boolean(code && code.startsWith("kitchen_"));
}

function isExplicitPoolLightingCode(code: string | undefined): boolean {
  return Boolean(code && code.startsWith("pool_"));
}

function isExplicitBathroomLightingCode(code: string | undefined): boolean {
  return Boolean(code && code.startsWith("bathroom_"));
}

function isExplicitHouseworkLightingCode(code: string | undefined): boolean {
  return Boolean(code && code.startsWith("housework_"));
}

function isExplicitCampingLightingCode(code: string | undefined): boolean {
  return Boolean(code && code.startsWith("camping_"));
}

function isExplicitDedicatedSceneLightingCode(code: string | undefined): boolean {
  return (
    isExplicitKitchenLightingCode(code) ||
    isExplicitPoolLightingCode(code) ||
    isExplicitBathroomLightingCode(code) ||
    isExplicitHouseworkLightingCode(code) ||
    isExplicitCampingLightingCode(code)
  );
}

/**
 * Scene × Light-Axis Camera & Stage Resolver:
 * Rotates background stage geometry and camera orientation so the scene physically matches
 * any lighting preset's `light_axis` ("backlit" | "front_lit" | "side_lit" | "moody_dim" | "auto").
 * - front_lit: camera stands with its back to the window/sun looking INWARD toward room walls/shoreline,
 *   stripping background windows/suns behind the subject and guarding them in negative prompt.
 * - backlit: camera faces outward toward the bright window/horizon/alley-exit behind the subject.
 * - side_lit: camera angles parallel to the light source with the window/sun off to one side.
 */
function adaptSceneStageForLightAxis(
  sceneCode: string,
  rawTags: string,
  rawProse: string,
  rawExtraNeg: string,
  lightAxis: LightAxisMode | undefined
): { tags: string; prose: string; extraNeg: string } {
  const axis: LightAxisMode = lightAxis ?? "auto";
  if (axis === "auto") {
    return { tags: rawTags, prose: rawProse, extraNeg: rawExtraNeg };
  }

  const mergeNeg = (...parts: string[]): string =>
    parts
      .map((p) => p.trim())
      .filter(Boolean)
      .join(", ");

  if (sceneCode === "sunlit_rug_floor_window") {
    if (axis === "front_lit") {
      return {
        tags: "indoors, living room interior, 1.25::furry beige rug::, rug, warm wooden floor, wooden wall, bookshelf, sofa in background, potted plant",
        prose:
          " on a soft furry beige rug over a warm wooden floor with the camera facing inward toward the cozy living room wall, bookshelf, and potted plant while window daylight streams from behind the viewer",
        extraNeg: mergeNeg(
          rawExtraNeg,
          "window, windowpane, floor-to-ceiling window, glass window, sky, clear blue sky, clouds, looking outside, outdoors"
        ),
      };
    }
    if (axis === "backlit") {
      return {
        tags: "indoors, furry beige rug, wooden floor, 1.3::large floor-to-ceiling window::, 1.35::bright window::, window in background, bright sky outside, potted plant",
        prose:
          " on a furry beige rug right in front of a blazing sunlit floor-to-ceiling window and potted plant",
        extraNeg: rawExtraNeg,
      };
    }
    if (axis === "side_lit") {
      return {
        tags: "indoors, living room interior, 1.25::furry beige rug::, rug, wooden floor, window to the side, indoor wall, potted plant",
        prose:
          " on a soft furry beige rug over a wooden floor with the floor-to-ceiling window angled to one side and warm indoor room depth behind her",
        extraNeg: rawExtraNeg,
      };
    }
  }

  if (sceneCode === "sunlit_window_bedroom") {
    if (axis === "front_lit") {
      return {
        tags: "indoors, bedroom interior, bed, white bedsheet, pillows, wooden headboard, bedroom wall, nightstand, warm room depth",
        prose:
          " on crisp white bedsheets with the camera facing inward toward the wooden headboard and cozy bedroom interior wall, bathed in morning window light from behind the viewer",
        extraNeg: mergeNeg(
          rawExtraNeg,
          "window, windowpane, bright window, curtains behind, sky, clouds, looking outside, outdoors"
        ),
      };
    }
    if (axis === "backlit") {
      return {
        tags: "indoors, bedroom, bed, white bedsheet, 1.3::bright window::, window in background, sheer curtains",
        prose: " in a bedroom right in front of a bright sunlit window and glowing sheer curtains",
        extraNeg: rawExtraNeg,
      };
    }
    if (axis === "side_lit") {
      return {
        tags: "indoors, bedroom, bed, white bedsheet, window to the side, sheer curtains, bedroom wall",
        prose: " on white bedsheets with sheer window curtains off to one side and cozy bedroom depth behind her",
        extraNeg: rawExtraNeg,
      };
    }
  }

  if (sceneCode === "default_couch") {
    if (axis === "front_lit") {
      return {
        tags: "indoors, living room interior, couch, cushions, interior wall, bookshelf, warm room background",
        prose: " on the cozy living room couch with the camera facing inward toward the interior wall",
        extraNeg: mergeNeg(rawExtraNeg, "window, windowpane, sky, outdoors, lamp glare"),
      };
    }
    if (axis === "backlit") {
      return {
        tags: "indoors, living room, couch, large window behind sofa, sheer curtains",
        prose: " on the living room couch in front of a bright sunlit window",
        extraNeg: mergeNeg(rawExtraNeg, "lamp"),
      };
    }
    if (axis === "side_lit") {
      return {
        tags: "indoors, living room, couch, window to the side, sheer curtains, interior wall",
        prose: " on the living room couch beside a sunlit side window",
        extraNeg: rawExtraNeg,
      };
    }
  }

  if (sceneCode === "cherry_shallow_water") {
    // Mandatory water-ripple & caustic reflection tags stay active across ALL light axes!
    if (axis === "front_lit") {
      return {
        tags: "outdoors, 1.35::shallow water::, deep cyan water, in water, ripples, 1.32::water reflection::, 1.32::caustics::, cherry blossoms, sakura trees in background, falling petals, pink sky, bright sky, shiny skin, 1.25::wet skin::, water droplets",
        prose:
          " in shallow rippling deep-cyan water with lush cherry blossom trees behind her under a bright pink sky, as luminous water-ripple caustics, water droplets, and shimmering reflections dance across her wet skin",
        extraNeg: mergeNeg(rawExtraNeg, "sun in background, sun orb"),
      };
    }
    if (axis === "backlit") {
      return {
        tags: "outdoors, 1.35::shallow water::, in water, ripples, 1.32::water reflection::, 1.32::caustics::, cherry blossoms, falling petals, pink sky, shiny skin, 1.25::wet skin::, water droplets",
        prose:
          " in shallow rippling water beneath falling cherry blossom petals and a pink sky, with luminous water-ripple caustics and shimmering reflections dancing across her wet skin",
        extraNeg: rawExtraNeg,
      };
    }
    if (axis === "side_lit") {
      return {
        tags: "outdoors, 1.35::shallow water::, in water, ripples, 1.32::water reflection::, 1.32::caustics::, cherry blossoms, overhanging sakura branches, falling petals, pink sky, shiny skin, 1.25::wet skin::, water droplets",
        prose:
          " in shallow rippling cyan water beneath overhanging cherry blossom branches and falling petals, with lateral water-ripple caustics and shimmering reflections across her wet skin",
        extraNeg: rawExtraNeg,
      };
    }
  }

  if (sceneCode === "jp_dark_alley_trash") {
    if (axis === "front_lit") {
      return {
        tags: "outdoors, 1.35::alley::, enclosed back-alley corner, concrete wall behind, brick wall, 1.35::trash can::, garbage bag, cardboard box, air conditioner, asphalt",
        prose:
          " in an enclosed Japanese urban back-alley corner with concrete walls, trash cans, and black garbage bags behind her, illuminated from the street entrance behind the viewer",
        extraNeg: mergeNeg(rawExtraNeg, "sky, bright sky, alley exit behind"),
      };
    }
    if (axis === "backlit") {
      return {
        tags: "outdoors, 1.35::alley::, backstreet, narrow street, bright alley exit in background, 1.35::trash can::, garbage bag, cardboard box, air conditioner, utility pole, concrete wall, asphalt",
        prose:
          " in a narrow Japanese urban back-alley beside trash cans and black garbage bags with the bright sunlit main-street opening behind her",
        extraNeg: rawExtraNeg,
      };
    }
  }

  return { tags: rawTags, prose: rawProse, extraNeg: rawExtraNeg };
}

function adaptMultiAngleBuiltInSceneForLightAxis(
  sceneId: string,
  rawScene: string,
  rawProse: string,
  rawTailNeg: string,
  lightAxis: LightAxisMode | undefined
): { scene: string; prose: string; tailNeg: string } {
  const axis: LightAxisMode = lightAxis ?? "auto";
  if (axis === "auto" || sceneId === "MA0" || sceneId === "MA11") {
    return { scene: rawScene, prose: rawProse, tailNeg: rawTailNeg };
  }

  let scene = rawScene;
  let prose = rawProse;
  let tailNeg = rawTailNeg;
  const appendNeg = (extra: string): void => {
    tailNeg = tailNeg ? `${tailNeg}, ${extra}` : extra;
  };

  if (sceneId === "MA9" || sceneId === "MA10") {
    if (axis === "front_lit") {
      scene = scene.replace(
        /indoors,\s*furry beige rug,\s*wooden floor,\s*large floor-to-ceiling window,\s*clear blue sky,\s*daylight,\s*backlighting,\s*sunlight,\s*potted plant/i,
        "indoors, living room interior, furry beige rug, warm wooden floor, wooden wall, bookshelf, sofa in background, potted plant"
      );
      prose = prose.replace(
        /beside a large sunlit floor-to-ceiling window and potted plant/i,
        "with the camera facing inward toward the cozy living room wall, bookshelf, and potted plant while window daylight streams from behind the viewer"
      );
      appendNeg("window, windowpane, floor-to-ceiling window, glass window, sky, clear blue sky, clouds, looking outside, outdoors");
    } else if (axis === "backlit") {
      scene = scene.replace(
        /large floor-to-ceiling window,\s*clear blue sky,\s*daylight,\s*backlighting,\s*sunlight/i,
        "1.3::large floor-to-ceiling window::, window in background, bright sky outside"
      );
      prose = prose.replace(
        /beside a large sunlit floor-to-ceiling window/i,
        "right in front of a blazing sunlit floor-to-ceiling window"
      );
    } else if (axis === "side_lit") {
      scene = scene.replace(
        /large floor-to-ceiling window,\s*clear blue sky,\s*daylight,\s*backlighting,\s*sunlight/i,
        "window to the side, indoor wall"
      );
    }
  } else if (sceneId === "MA3") {
    if (axis === "front_lit") {
      scene = scene
        .replace(/standing beside sunlit window/i, "standing inside cozy bedroom interior, wooden wall, bookshelf")
        .replace(/gazing out the window,\s*soft golden afternoon glow/i, "looking at viewer");
      prose = prose
        .replace(/standing beside a sunlit window/i, "standing inside a cozy bedroom interior facing the window behind the viewer")
        .replace(/in soft golden glow\./i, "while looking toward the viewer.");
      appendNeg("window behind, glass pane, sky, outdoors");
    }
  } else if (sceneId === "MA1" || sceneId === "MA5" || sceneId === "MA8") {
    if (axis === "front_lit") {
      scene = scene
        .replace(/cozy sunlit bedroom/i, "bedroom interior, wooden wall, headboard")
        .replace(/sunlit bedroom/i, "bedroom interior, wooden wall")
        .replace(/cozy sunlit living room/i, "living room interior, wooden wall, bookshelf");
      appendNeg("window behind, sky, outdoors");
    } else if (axis === "backlit") {
      scene = scene
        .replace(/cozy sunlit bedroom/i, "bedroom, 1.3::bright window::, sheer curtains")
        .replace(/sunlit bedroom/i, "bedroom, 1.3::bright window::, sheer curtains")
        .replace(/cozy sunlit living room/i, "living room, 1.3::large floor-to-ceiling window::");
    }
  }

  return { scene, prose, tailNeg };
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
  const resolvedLight = resolveLightingPresetEntry(cfg.lighting_preset);
  const hasCustomLight = resolvedLight.code !== "auto";
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
  const lightInfo = resolveLightingPresetEntry(cfg.lighting_preset);
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
      const replaceStyleMap = new Map<string, string>();
      if (lightInfo.replace_style_tags) {
        for (const [k, v] of Object.entries(lightInfo.replace_style_tags)) {
          replaceStyleMap.set(k.toLowerCase(), v);
        }
      }
      styleOnlyPos = styleOnlyPos
        .split(",")
        .map((t) => t.trim())
        .filter((t) => {
          if (!t) return false;
          const bare = t.replace(/^\d+(?:\.\d+)?::([\s\S]+?)::$/, "$1").trim().toLowerCase();
          return !stripLightSet.has(bare);
        })
        .map((t) => {
          const bare = t.replace(/^\d+(?:\.\d+)?::([\s\S]+?)::$/, "$1").trim().toLowerCase();
          return replaceStyleMap.get(bare) ?? t;
        })
        .join(", ");
    } else if (lightInfo.replace_style_tags && styleOnlyPos) {
      const replaceStyleMap = new Map<string, string>();
      for (const [k, v] of Object.entries(lightInfo.replace_style_tags)) {
        replaceStyleMap.set(k.toLowerCase(), v);
      }
      styleOnlyPos = styleOnlyPos
        .split(",")
        .map((t) => {
          const trimmed = t.trim();
          if (!trimmed) return "";
          const bare = trimmed.replace(/^\d+(?:\.\d+)?::([\s\S]+?)::$/, "$1").trim().toLowerCase();
          return replaceStyleMap.get(bare) ?? trimmed;
        })
        .filter(Boolean)
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
      const basePresetDesign =
        cfg.gender_mode === "femboy" && outfitInfo.femboy_design_tags
          ? outfitInfo.femboy_design_tags
          : outfitInfo.design_tags;
      designIntact = joinTags(basePresetDesign, customOutfit);
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
      const rawSwimState = outfitInfo.state_tags || "bikini aside, swimsuit aside";
      statePos =
        cfg.gender_mode === "femboy"
          ? rawSwimState
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s && !/\bbreasts out\b|\bnipples visible/i.test(s))
              .join(", ") || "1.45::swimsuit aside::"
          : rawSwimState;
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
      for (const sb of lightInfo.strip_bg_tags ?? []) {
        lightTagSet.add(sb.toLowerCase());
      }
      const adaptedEnv = adaptSceneStageForLightAxis(
        envInfo.code,
        envInfo.tags,
        envInfo.prose,
        envInfo.extra_neg || "",
        lightInfo.light_axis
      );
      let rawEnvTags = adaptedEnv.tags;
      if (is25dCelLight && envInfo.code === "sunlit_rug_floor_window" && (lightInfo.light_axis ?? "auto") === "auto") {
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
      locProse = adaptedEnv.prose;
      envExtraNeg = adaptedEnv.extraNeg;
    } else if (m6Mode) {
      bgCouch = "indoors, beige couch, window, cream sheer curtains";
      bgSleepCouch = "indoors, beige couch, pillow, window, cream sheer curtains";
      locProse = " by cream sheer curtains";
    } else {
      const adaptedCouch = adaptSceneStageForLightAxis(
        "default_couch",
        "indoors, couch, lamp",
        " on the warm-lit couch",
        "",
        lightInfo.light_axis
      );
      bgCouch = adaptedCouch.tags;
      bgSleepCouch = adaptedCouch.tags.includes("couch")
        ? adaptedCouch.tags.replace("couch", "couch, pillow")
        : `${adaptedCouch.tags}, pillow`;
      locProse = adaptedCouch.prose;
      envExtraNeg = adaptedCouch.extraNeg;
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
  const isMangaStyle = cfg.style_preset.includes("黑白网点漫画") || cfg.style_preset.includes("Monochrome Manga");
  const comicLineGuard = isMangaStyle ? "" : "motion lines, emphasis lines, speed lines";
  const commonTailNeg = isTune2
    ? joinTags(canonNeg, comicLineGuard, anatNeg, outfitExtraNeg, intactNeg, envExtraNeg)
    : joinTags(styleNeg, canonNeg, comicLineGuard, bodyFullNeg, anatNeg, outfitExtraNeg, intactNeg, envExtraNeg);

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
    style_neg: isTune2 ? "" : styleNeg,
    body_neg: bodyFullNeg,
    comic_line_guard: comicLineGuard,
    outfit_extra_neg: outfitExtraNeg,
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
    let anatMa = nsfwOn && cfg.enable_anatomy && sceneId !== "MA7E" ? m.anat_pos : "";
    if (isMa7Nsfw) {
      if (anatMa) {
        if (/spread pussy/i.test(anatMa)) {
          anatMa = anatMa.replace(/(?:\d+(?:\.\d+)?::)?spread pussy(?:::)?/gi, "1.0::spread pussy::");
        } else {
          anatMa = joinTags(anatMa, "labia, 1.0::spread pussy::");
        }
        anatMa = joinTags(anatMa, "1.25::spreading own pussy::, fingers");
      } else {
        anatMa = "groin, pussy, labia, 1.0::spread pussy::, 1.15::spreading own pussy::, fingers";
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
        sceneId !== "MA7D" &&
        sceneId !== "MA7E"
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
    if (sceneId === "MA7E") {
      const ma7eStrip = new Set(["penis", "phallus", "futanari", "dripping", "testicles", "balls", "scrotum"]);
      maTailNeg = maTailNeg
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t && !ma7eStrip.has(t.toLowerCase()))
        .join(", ");
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
    const curLightEntry = resolveLightingPresetEntry(cfg.lighting_preset);
    let maScene = isMa7Nsfw
      ? "cowboy shot, 1.35::upper body::, legs apart, head tilt, peace sign near cheek, playful cheerful expression, one eye slightly narrowed, looking at viewer, blurred warm indoor background"
      : String(tpl.scene);
    let maBaseProse = isMa7Nsfw
      ? "in a thighs-up shot tilting her head and making a playful peace sign near her cheek with one hand while her other hand reaches down to spread her pussy open toward the camera with a cheerful expression."
      : tpl.prose;
    const hasCustomGlobalEnv =
      cfg.enable_background &&
      Boolean(m.bg_couch) &&
      (ENV_PRESETS[cfg.env_preset]?.code ?? "auto") !== "auto";
    if (hasCustomGlobalEnv) {
      const activeEnvCode = ENV_PRESETS[cfg.env_preset]?.code ?? "auto";
      if (maScene.includes("blurred warm indoor background")) {
        maScene = maScene.replace("blurred warm indoor background", m.bg_couch);
      } else if ((sceneId === "MA9" || sceneId === "MA10") && /furry beige rug,\s*wooden floor,\s*large floor-to-ceiling window/i.test(maScene)) {
        maScene = maScene.replace(
          /indoors,\s*furry beige rug,\s*wooden floor,\s*large floor-to-ceiling window,\s*clear blue sky,\s*daylight,\s*backlighting,\s*sunlight,\s*potted plant/i,
          m.bg_couch
        );
        if (activeEnvCode !== "sunlit_rug_floor_window" || (curLightEntry.light_axis ?? "auto") !== "auto") {
          maBaseProse = maBaseProse.replace(
            /\s+on a furry beige rug over a wooden floor beside a large sunlit floor-to-ceiling window and potted plant/i,
            m.loc_prose
          );
          if (activeEnvCode === "cherry_shallow_water") {
            maScene = maScene.replace(/\blying on rug,\s*/gi, "").replace(/\bon floor\b/gi, "in shallow water");
          }
        }
      } else if (activeEnvCode === "cherry_shallow_water" && sceneId !== "MA0" && sceneId !== "MA11") {
        maScene = maScene
          .replace(/indoors,\s*cozy sunlit bedroom/i, m.bg_couch)
          .replace(/indoors,\s*sunlit bedroom/i, m.bg_couch)
          .replace(/cozy sunlit living room/i, m.bg_couch)
          .replace(/,\s*indoors,\s*cozy room/i, `, ${m.bg_couch}`)
          .replace(/,\s*indoors,\s*soft cushions/i, `, ${m.bg_couch}`);
        maBaseProse = `${maBaseProse.replace(/\.+\s*$/, "")}${m.loc_prose}.`;
      }
      if (forceNsfw && m.loc_prose && !maBaseProse.includes(m.loc_prose.trim())) {
        maBaseProse = `${maBaseProse.replace(/\.+\s*$/, "")}${m.loc_prose}.`;
      }
    } else {
      const adaptedMa = adaptMultiAngleBuiltInSceneForLightAxis(
        sceneId,
        maScene,
        maBaseProse,
        maTailNeg,
        curLightEntry.light_axis
      );
      maScene = adaptedMa.scene;
      maBaseProse = adaptedMa.prose;
      maTailNeg = adaptedMa.tailNeg;
    }
    if (is25dCelLightingCode(curLightEntry.code)) {
      if ((sceneId === "MA9" || sceneId === "MA10") && /\blarge floor-to-ceiling window\b/i.test(maScene) && !/\bclear blue sky\b/i.test(maScene)) {
        maScene = maScene.replace("large floor-to-ceiling window,", "large floor-to-ceiling window, clear blue sky,");
      }
      maScene = maScene
        .replace(/(?:,\s*)?backlighting\b/gi, "")
        .replace(/(?:,\s*)?sunlight\b/gi, "");
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
    const maActorHead =
      sceneId === "MA7E"
        ? cfg.gender_mode === "futa_no_balls"
          ? "1girl, solo, 1.55::futanari::, 1.45::futa without balls::"
          : "1girl, solo, 1.55::futanari::, 1.45::futa with balls::"
        : "1girl, solo";
    const maProseFinal =
      sceneId === "MA7E" || sceneId === "MA11"
        ? cfg.enable_t5_prose
          ? maBaseProse
          : ""
        : proseIf(cfg, `${m.name}${maShirtProse} ${maBaseProse}`);
    let pMa = joinTags(
      m.head_pos,
      maActorHead,
      charCoreMa,
      maOutfit,
      maLeg,
      nsfwPrefix,
      anatMa,
      maScene,
      maProseFinal,
      wrapTailNeg(m, maTailNeg, negOn)
    );
    // MA7E OC Token-Headroom Guard: when long OC extra_char_tags + heavy presets exceed maxPosBudget,
    // trim low-priority redundant filler tags first so MA7E's left-right directional T5 prose is never truncated.
    const ma7eBudget = Math.max(300, Math.min(502, Math.round(cfg.pos_token_limit ?? 502)));
    if (sceneId === "MA7E" && measureEffectivePosTokens(pMa) > ma7eBudget) {
      const ma7eFillerOrder = [
        "blurred warm indoor background",
        "color contrast",
        "light rays",
        "sparkle",
        "fake animal ears",
        "detached collar",
        "short sleeves",
        "midriff",
        "wrist cuffs",
        "bare hips",
        "zettai ryouiki",
        "rabbit tail",
        "small frame",
        "very short",
        "slender legs",
        "short torso",
        "long legs",
        "short face",
        "one eye slightly narrowed",
        "playful cheerful expression",
        "subsurface scattering",
        "anime coloring",
        "lineart",
        "bolero",
        "navel",
        "bare stomach",
        "white cuffs",
        "thigh strap",
        "thigh gap",
        "round face",
        "narrow shoulders",
        "narrow hips",
        "slim waist",
        "saturated",
        "high contrast",
        "sunlight",
        "backlighting",
        "shiny skin",
      ];
      for (const filler of ma7eFillerOrder) {
        if (measureEffectivePosTokens(pMa) <= ma7eBudget) break;
        const esc = filler.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        pMa = pMa.replace(new RegExp(`(?:,\\s*)?(?:\\d+(?:\\.\\d+)?::)?${esc}(?:::)?(?=\\s*,)`, "gi"), "");
      }
      pMa = pMa.replace(/,\s*,+/g, ", ").replace(/^[ ,]+|[ ,]+$/g, "");
    }
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
        "warm indoor lighting",
        "sunlight",
        "bright summer sunlight",
        "bright breezy summer balcony sunlight",
        "dappled sunlight",
        "morning sunlight",
        "afternoon sunlight",
        "sun glare",
        "daylight",
        "overexposure",
        "light rays",
        "clear blue sky",
        "bright sky",
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
      const curLightEntry = resolveLightingPresetEntry(cfg.lighting_preset);
      headUsed = scenePreset.unblock_dark
        ? m.head_pos.replace(/,\s*warm lighting\b/gi, "")
        : m.head_pos;
      const headSet = new Set(
        headUsed
          .split(",")
          .map((t) => t.trim().replace(/^\d+(?:\.\d+)?::([\s\S]+?)::$/, "$1").trim().toLowerCase())
          .filter(Boolean)
      );
      for (const sb of curLightEntry.strip_bg_tags ?? []) {
        headSet.add(sb.toLowerCase());
      }
      const adaptedScene = adaptSceneStageForLightAxis(
        scenePreset.code,
        scenePreset.tags,
        scenePreset.prose,
        scenePreset.extra_neg || "",
        curLightEntry.light_axis
      );
      let rawSceneTags = adaptedScene.tags;
      if (
        is25dCelLightingCode(curLightEntry.code) &&
        scenePreset.code === "sunlit_rug_floor_window" &&
        (curLightEntry.light_axis ?? "auto") === "auto"
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
      bgProse = (curLightEntry.strip_bg_tags ?? []).includes("bright sky")
        ? adaptedScene.prose.replace(/\bbright pink sky\b/gi, "pink sky")
        : adaptedScene.prose;
      poseUsed = scenePreset.strip_indoor_pose
        ? poseRaw
            .replace(/,\s*head on pillow/gi, "")
            .replace(/,\s*hands gripping sheet/gi, "")
            .replace(/,\s*(?:\d+(?:\.\d+)?::)?pressed against glass(?:::)?/gi, "")
            .replace(/,\s*(?:\d+(?:\.\d+)?::)?against glass(?:::)?/gi, "")
            .replace(/,\s*palms on glass/gi, "")
            .replace(/,\s*window in front/gi, "")
            .replace(/,\s*palms and flattened chest pressed against clear windowpane/gi, ", leaning forward, palms braced")
            .replace(/,\s*fogged glass/gi, "")
            .replace(/frontal view through glass/gi, "frontal view")
            .replace(/standing pinned against wall/gi, "standing leaned back")
        : poseRaw;
      transNeg = adaptedScene.extraNeg;
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

    if (!isTentacle && maleCode === "off") {
      // Pure solo mode: strip ghost partner POV hands & ground suspended-carry poses
      poseUsed = splitTopLevelCommaSegments(poseUsed)
        .filter((seg) => {
          const bare = stripWeightPrefix(seg);
          return (
            Boolean(bare) &&
            bare !== "pov hands" &&
            bare !== "male hands" &&
            bare !== "grabbing thigh" &&
            bare !== "grabbing waist" &&
            bare !== "grabbing another's hip" &&
            bare !== "holding hips"
          );
        })
        .join(", ");
      if (sceneId === "P27") {
        poseUsed = isPov
          ? "close cowboy shot, lying on back, 1.35::legs up::, knees drawn toward chest, looking at viewer"
          : "three-quarter full-body shot, lying on back, 1.35::legs up::, knees drawn toward chest, feet up, looking at viewer";
      } else if (sceneId === "P28") {
        poseUsed = isPov
          ? "1.45::pov::, 1.4::from above::, top-down, high angle, lying on back, 1.35::spread legs::, m legs"
          : "frontal full-body shot, lying on back, facing viewer, 1.35::spread legs::, m legs, knees held wide apart";
      } else if (sceneId === "P40") {
        poseUsed = isPov
          ? "1.45::pov::, 1.4::from above::, top-down, high angle, lying on back, 1.35::folded::, spread legs, knees wide apart"
          : "frontal full-body shot, lying on back, 1.35::folded::, arms behind head, knees drawn high and wide apart, facing viewer";
      } else if (sceneId === "P46") {
        poseUsed = poseUsed.replace(/sitting held from behind against chest/gi, "sitting leaned back");
      } else if (sceneId === "P49") {
        poseUsed = poseUsed.replace(/kneeling on all fours/gi, "kneeling, arched back, one hand supporting");
      } else if (sceneId === "P51") {
        poseUsed = isPov
          ? "1.45::pov::, 1.4::from above::, top-down, high angle, lying on back, 1.35::spread legs::, knees wide apart"
          : "frontal full-body shot, lying on back, both knees drawn high and wide apart, facing viewer";
      }
    }

    if (tpl.unlock_belly || (isTentacle && cfg.enable_uterus_xray)) {
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
          ...(/^BG1[3-9]$|^BG20$/.test(sceneId) ? ["extra legs"] : []),
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
      let tnActionRaw = tpl.raw_action_tags || "";
      if (cfg.enable_uterus_xray) {
        if (sceneId === "TN12" || sceneId === "BG06") {
          // Mode X-5: explicit X-Ray overrides translucent belly skin into a sharp cutaway
          tnActionRaw = splitTopLevelCommaSegments(tnActionRaw)
            .filter((seg) => stripWeightPrefix(seg) !== "translucent belly")
            .join(", ");
        } else if (sceneId === "BG15") {
          // Mode X-2: when X-Ray is ON on BG15, drop secondary groin bug so V5 focuses on facehugger + stomach cutaway
          const bg15XrayStrip = new Set([
            "2 creatures",
            "groin parasite",
            "second chitinous bug latched onto groin",
          ]);
          tnActionRaw = splitTopLevelCommaSegments(tnActionRaw)
            .filter((seg) => !bg15XrayStrip.has(stripWeightPrefix(seg)))
            .join(", ");
        }
      }
      if (isPov) {
        const viewAStrip = new Set([
          "wide shot",
          "cowboy shot",
          "from side",
          "from above",
          "looking at viewer",
        ]);
        tnActionRaw = splitTopLevelCommaSegments(tnActionRaw)
          .filter((seg) => !viewAStrip.has(stripWeightPrefix(seg)))
          .join(", ");
        if (sceneId === "BG19" || sceneId === "BG20") {
          tnActionRaw = joinTags(tnActionRaw, "1.55::maggots in pussy::, 1.5::worms crawling on skin::");
        }
      }
      organTags = joinTags(tnAnatPos, tnActionRaw);
      partnerProse = "";
      organProse = "";
      let tnExtraNeg = tpl.extra_scene_neg || "";
      if (isPov) {
        tnExtraNeg = joinTags(tnExtraNeg, "upside-down, inverted, head at bottom, legs at top");
      }
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
          af ? wtag("pussy juice", 1.15, f) : ""
        );
        organProse = "";
      } else if (stageCode === "during") {
        organTags = joinTags(
          m.anat_pos,
          "0.85::spread pussy::, orgasm, climax, female ejaculation, trembling",
          wtag("pussy juice", 1.4, f),
          wtag("squirting", 1.3, f),
          "pussy juice trail, sweat"
        );
        organProse = ", arching at the peak of climax with glistening fluids";
      } else if (stageCode === "after_inside") {
        organTags = joinTags(
          m.anat_pos,
          "0.85::spread pussy::, after masturbation, after vaginal, heavy breathing, trembling",
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
          "after vaginal, after sex, 1.55::vaginal prolapse::, 1.35::prolapse::, cervix, trembling",
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
          "0.95::spread pussy::, 1.45::creampie::, after vaginal, after sex, trembling",
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
      const suppressSupinePovHands = sceneId === "P45" || sceneId === "P47";
      if (maleCode === "normal") {
        actorTags = joinTags(
          "1girl, 1boy, hetero, faceless male, male hand",
          isPov ? (suppressSupinePovHands ? "1.4::pov::" : "1.35::pov::, 1.35::pov hands::") : ""
        );
        partnerProse = isPov ? "" : " with a faceless partner's hands";
        partnerNeg = isPov ? povMaleCropNeg : "";
      } else if (maleCode === "translucent") {
        actorTags = joinTags(
          "1girl, 1boy, hetero, faceless male, 1.35::male silhouette::, ghostly outline",
          isPov ? (suppressSupinePovHands ? "1.35::pov::" : "1.35::pov::, pov hands") : ""
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
              "1.4::clitoral stimulation::, fingers, 1.0::spread pussy::, 1.25::clitoris::",
              af ? wtag("pussy juice", 1.25, f) : ""
            );
            organProse =
              ", as fingers part her lower anatomy wide open and directly rub her sensitive clitoris";
          } else if (stageCode === "during") {
            organTags = joinTags(
              m.anat_pos,
              spreadTag,
              "1.4::clitoral stimulation::, 1.0::spread pussy::, 1.25::clitoris::, orgasm, climax, 1.35::female ejaculation::, trembling",
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
              "clitoral stimulation, 1.0::spread pussy::, clitoris, after orgasm, heavy breathing, trembling",
              wtag("pussy juice", 1.45, f),
              "pussy juice on fingers, wet thighs, sweat"
            );
            organProse =
              ", quivering right after climax with wet fingers still holding her soaked lower anatomy open against her clitoris";
          } else if (stageCode === "prolapse") {
            organTags = joinTags(
              m.anat_pos,
              "after masturbation, 1.55::vaginal prolapse::, 1.35::prolapse::, cervix, 1.25::clitoris::, trembling, wet fingers, glistening fingers",
              wtag("pussy juice", 1.45, f),
              wtag("pussy juice trail", 1.45, f),
              "pussy juice string, wet thighs, sweat"
            );
            organProse =
              ", just as glistening wet fingers pull back, leaving a glistening pink prolapsed cervix protruding with sticky translucent threads of fluid";
          } else {
            organTags = joinTags(
              m.anat_pos,
              "after masturbation, 1.0::spread pussy::, 1.25::clitoris::, trembling, wet fingers, glistening fingers",
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
              "1.4::fingering::, hand between legs, fingers, 1.0::spread pussy::",
              af ? wtag("pussy juice", 1.25, f) : ""
            );
            organProse = `${gropeProse} fingers stroke and press deep inside her parted lower anatomy`;
          } else if (stageCode === "during") {
            organTags = joinTags(
              m.anat_pos,
              gropePrefix,
              "1.4::fingering::, hand between legs, 1.0::spread pussy::, orgasm, climax, 1.35::female ejaculation::, trembling",
              wtag("pussy juice", 1.45, f),
              wtag("squirting", 1.35, f),
              "pussy juice trail, sweat"
            );
            organProse = `${gropeProse} rapid fingering drives her to climax in a glistening spray of female ejaculation`;
          } else if (stageCode === "after_inside") {
            organTags = joinTags(
              m.anat_pos,
              gropePrefix,
              "1.35::fingering::, hand between legs, 1.0::spread pussy::, after orgasm, heavy breathing, trembling",
              wtag("pussy juice", 1.45, f),
              "pussy juice on fingers, wet thighs, sweat"
            );
            organProse = `${gropeProse} wet fingers remain buried inside her quivering, soaked lower anatomy right after climax`;
          } else if (stageCode === "prolapse") {
            organTags = joinTags(
              m.anat_pos,
              gropePrefix,
              "1.35::after fingering::, after masturbation, 1.55::vaginal prolapse::, 1.35::prolapse::, cervix, trembling, wet fingers, glistening fingers",
              wtag("pussy juice", 1.45, f),
              wtag("pussy juice trail", 1.45, f),
              "pussy juice string, wet thighs, sweat"
            );
            organProse = `${gropeProse} glistening wet fingers withdraw, dragging out a glistening pink prolapsed cervix with sticky translucent threads of fluid`;
          } else {
            organTags = joinTags(
              m.anat_pos,
              gropePrefix,
              "1.35::after fingering::, after masturbation, 1.0::spread pussy::, trembling, wet fingers, glistening fingers",
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
      const isSupineOrSidePov =
        isPov && /^(P0[1-7]|P24)$/.test(sceneId);
      const suppressGenericPovHands =
        isPov && /^(P0[1-7]|P24|P30|P31|P32|P34|P35|P36|P37|P39)$/.test(sceneId);
      const povCrotchTag =
        isPov &&
        showP &&
        ["vaginal", "oral", "sixty_nine", "chest", "thigh", "glute"].includes(channel)
          ? isSupineOrSidePov
            ? "1.45::pov crotch::, foreshortening"
            : "1.4::pov crotch::"
          : "";
      const povHipGrabTag =
        isRearNoFacePov && sceneId !== "P20" && (channel === "vaginal" || channel === "glute")
          ? "grabbing another's hip"
          : "";
      if (maleCode === "normal") {
        actorTags = joinTags(
          "1girl, 1boy, hetero, faceless male",
          isPov
            ? suppressGenericPovHands
              ? "1.45::pov::"
              : "1.4::pov::, pov hands"
            : "",
          povCrotchTag,
          povHipGrabTag
        );
        partnerProse = isPov ? "" : " with a faceless partner";
        partnerNeg = isPov ? povMaleCropNeg : "";
      } else if (maleCode === "translucent") {
        actorTags = joinTags(
          "1girl, 1boy, hetero, faceless male, 1.35::male silhouette::, ghostly outline",
          isPov
            ? suppressGenericPovHands
              ? "1.4::pov::"
              : "1.35::pov::, pov hands"
            : "",
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

      const isRearPosture = /^(P17|P18|P19|P20|P21|P22|P44|P49)$/.test(sceneId);
      const cleanActiveAnatPos = m.anat_pos
        .split(",")
        .map((t) => t.trim())
        .filter((t) => {
          const bare = t.replace(/^\d+(?:\.\d+)?::([\s\S]+?)::$/, "$1").trim().toLowerCase();
          return Boolean(bare) && bare !== "spread pussy";
        })
        .join(", ");
      if (channel === "vaginal") {
        if (stageCode === "before") {
          if (showP) {
            organTags = joinTags(
              cleanActiveAnatPos,
              "vaginal, insertion, penis",
              condomOn ? "1.35::condom::, 1.3::condom on penis::" : "",
              af ? wtag("pussy juice", 1.2, f) : ""
            );
            organProse = condomOn ? ", wearing a snug translucent condom" : "";
          } else if (isRearPosture) {
            organTags = joinTags(
              cleanActiveAnatPos,
              "parted labia",
              af ? wtag("pussy juice", 1.2, f) : ""
            );
            organProse = "";
            partnerNeg = joinTags(
              partnerNeg,
              "motion lines, emphasis lines, speed lines",
              maleCode === "off"
                ? "spread pussy, hands between legs, hands on pussy, fingers on labia, extra arms, extra hands"
                : ""
            );
          } else {
            organTags = joinTags(
              m.anat_pos,
              "0.8::spread pussy::",
              af ? wtag("pussy juice", 1.2, f) : ""
            );
            organProse = ", keeping her lower anatomy actively parted";
            partnerNeg = joinTags(partnerNeg, "motion lines, emphasis lines, speed lines");
          }
        } else if (stageCode === "during") {
          if (condomOn) {
            const baseOrg = showP
              ? joinTags(cleanActiveAnatPos, "vaginal, insertion, penis, 1.4::condom on penis::")
              : joinTags(m.anat_pos, "0.85::spread pussy::, 1.4::condom::");
            organTags = joinTags(
              baseOrg,
              "1.5::x-ray::, 1.45::cross-section::, 1.4::uterus::, cervix, 1.35::cervical penetration::, ejaculation, climax, 1.5::cum in condom::, cum inflation, stomach bulge, trembling",
              wtag("cum", 1.35, f),
              "pussy juice, sweat"
            );
            organProse =
              (showP ? "" : ", keeping her lower anatomy actively parted") +
              "; in a cutaway x-ray cross-section of her womb, the condom tip on his penis pushes through her cervix and inflates like a large taut white balloon stretching and filling the entire interior of her uterus with thick white cum";
          } else {
            const baseOrg = showP
              ? joinTags(cleanActiveAnatPos, "vaginal, insertion, penis")
              : joinTags(m.anat_pos, "0.85::spread pussy::");
            organTags = joinTags(
              baseOrg,
              "internal cumshot, ejaculation, climax",
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
              ? joinTags(cleanActiveAnatPos, "vaginal, insertion, penis, 1.4::condom on penis::")
              : joinTags(m.anat_pos, "0.85::spread pussy::, 1.4::condom::");
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
              ? joinTags(cleanActiveAnatPos, "vaginal, insertion, penis")
              : joinTags(m.anat_pos, "0.85::spread pussy::");
            organTags = joinTags(
              baseOrg,
              "after vaginal, after ejaculation, heavy breathing",
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
            const shaftPart = showP ? ", 1.4::penis::, erection, glans" : "";
            organTags = joinTags(
              m.anat_pos,
              `1.35::after vaginal::, 1.4::pull out::, after sex, 1.15::vaginal prolapse::${shaftPart}`,
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
              "1.35::after vaginal::, 1.4::pull out::, after sex, 1.55::vaginal prolapse::, 1.35::prolapse::, cervix, penis, erection, cum on penis",
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
              "1.4::after vaginal::, pull out, after sex, 1.55::vaginal prolapse::, 1.35::prolapse::, cervix, trembling",
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
            const shaftPart = showP ? ", 1.4::penis::, erection, glans" : "";
            organTags = joinTags(
              m.anat_pos,
              `1.35::after vaginal::, 1.4::pull out::, after sex${shaftPart}, 0.95::spread pussy::`,
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
              "1.35::after vaginal::, 1.4::pull out::, after sex, 0.95::spread pussy::, 1.45::creampie::, penis, erection, cum on penis",
              isRearPosture ? "1.4::pussy from behind::" : "",
              wtag("cum", 1.55, f),
              wtag("cum in pussy", 1.75, f),
              wtag("cum overflow", 1.6, f),
              wtag("cumdrip", 1.45, f),
              wtag("cum string", 1.45, f),
              isRearPosture ? "" : wtag("cum on stomach", 1.25, f),
              "cum on thighs, pussy juice, sweat"
            );
            organProse =
              ", right after pulling out, with sticky white cum strings bridging between the tip and her parted, overflowing lower anatomy";
          } else {
            organTags = joinTags(
              m.anat_pos,
              "1.4::after vaginal::, pull out, after sex, 0.95::spread pussy::, 1.45::creampie::",
              isRearPosture ? "1.4::pussy from behind::" : "",
              wtag("cum", 1.55, f),
              wtag("cum in pussy", 1.75, f),
              wtag("cum overflow", 1.6, f),
              wtag("cumdrip", 1.45, f),
              wtag("cum string", 1.45, f),
              isRearPosture ? "" : wtag("cum on stomach", 1.25, f),
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
            "1.45::pussy::, 1.4::pussy from behind::, 1.0::spread pussy::, labia"
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
                    "1.4::after fellatio::, pull out, open mouth, 1.35::penis::, 1.35::used condom::, 1.35::cum in condom::"
                  )
                : joinTags(
                    pov69Crotch,
                    "1.4::after fellatio::, pull out, open mouth, 1.35::penis::, cum on penis"
                  )
              : joinTags(pov69Crotch, "after cunnilingus, after orgasm");
            organTags = joinTags(
              basePov69,
              wtag("pussy juice", 1.45, f),
              wtag("cum", 1.4, f),
              wtag("cumdrip", 1.4, f),
              wtag("cum string", 1.4, f),
              "saliva trail, sweat"
            );
            organProse =
              " right after intense mutual sixty-nine with glistening fluids overhead and sticky white cum strings at her mouth below";
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
                ? joinTags(third69Crotch, "1.4::after fellatio::, pull out, open mouth, penis, 1.35::used condom::, 1.35::cum in condom::")
                : joinTags(third69Crotch, "1.4::after fellatio::, pull out, open mouth, penis, cum on penis")
              : joinTags(third69Crotch, "after cunnilingus, after orgasm");
            organTags = joinTags(
              base3rd69,
              wtag("cum", 1.4, f),
              "cum in mouth",
              wtag("cum string", 1.4, f),
              wtag("pussy juice", 1.4, f),
              "saliva trail, sweat"
            );
            organProse =
              ", right after intense mutual sixty-nine with glistening fluids and sticky white cum strings";
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
          mildFluid = af ? joinTags(wtag("glistening", 1.15, f), "sweat") : "";
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
            ? `, pulling back right after ejaculation with white fluid brimming and leaking from the used condom`
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
    const hasActiveFluidStage = stageCode !== "before" && !isTentacle;
    if ((stageCode === "prolapse" || stageCode === "pull_out" || organTargetsNipple || hasActiveFluidStage) && tailNegUsed) {
      tailNegUsed = tailNegUsed
        .split(",")
        .map((t) => {
          const trimmed = t.trim();
          const low = trimmed.toLowerCase();
          if (stageCode === "pull_out" && low === "gaping") return "gaping anus";
          return trimmed;
        })
        .filter((t) => {
          const low = t.toLowerCase();
          if (!low) return false;
          if (stageCode === "prolapse" && low === "gaping") return false;
          if (organTargetsNipple && low === "nipples") return false;
          if (hasActiveFluidStage && low === "dripping") return false;
          return true;
        })
        .join(", ");
    }

    // Solo hands-busy 3-arm guard: when male is OFF and posture already occupies her hands,
    // strip 'spread pussy' from organTags (replacing with 'parted labia') so NAI never grows a 3rd arm.
    if (!isTentacle && maleCode === "off" && !isManualFemale) {
      const handsBusyPose =
        /\b(all fours|hands on|arms behind|arms around|holding|grabbing|supporting|palms on|gripping|arms above|arms folded|propped on elbows|on elbows|hugging)\b/i.test(
          poseUsed
        );
      if (handsBusyPose && /\bspread pussy\b/i.test(organTags)) {
        organTags = splitTopLevelCommaSegments(organTags)
          .filter((seg) => stripWeightPrefix(seg) !== "spread pussy")
          .join(", ");
        if (/\bpussy\b/i.test(organTags) && !/\bparted labia\b/i.test(organTags)) {
          organTags = joinTags(organTags, "parted labia");
        }
        organProse = organProse.replace(/,\s*keeping her lower anatomy actively parted/gi, "");
        extraNeg = joinTags(
          extraNeg,
          "spread pussy, hands between legs, hands on pussy, fingers on labia, extra arms, extra hands"
        );
      }
    }

    // Global Anti-Spontaneous-X-Ray Guard:
    // Prevents V5 from spontaneously drawing cutaway womb/x-ray insets when 'internal cumshot' / 'cum in pussy'
    // or artist tags (mikozin, hori, kani bonara) are present while enable_uterus_xray is OFF.
    const intentionalCondomXray =
      condomOn && channel === "vaginal" && (stageCode === "during" || stageCode === "after_inside");
    const effectiveUterusXray =
      Boolean(cfg.enable_uterus_xray) && (cfg.gender_mode ?? "normal") !== "femboy";
    const needsAntiXrayGuard =
      !isTentacle &&
      !effectiveUterusXray &&
      !intentionalCondomXray &&
      (channel === "vaginal" || (channel === "solo" && stageCode !== "before"));
    if (needsAntiXrayGuard) {
      extraNeg = joinTags(
        extraNeg,
        isRearNoFacePov ? "x-ray, cross-section" : "x-ray, cross-section, cutaway, uterus"
      );
    }

    // Global Supine Upright Orientation Guard & 3rd-Person Couple Geometry:
    // 1) Prevents V5 from flipping supine postures (P01..P07, P24, P43, P45, P47) upside-down
    //    (head at bottom, legs at top) when backlit windows appear at the top of the frame.
    // 2) Injects explicit 2-person couple-positioning tags in 3rd-person mode and strips male-anatomy-banning
    //    proportion negatives from global UC so [Character 2] (the male partner) never vanishes.
    if (
      !isTentacle &&
      sceneId !== "P32" &&
      sceneId !== "P41" &&
      /\b(lying on back|reclining on back)\b/i.test(poseUsed)
    ) {
      extraNeg = joinTags(extraNeg, "upside-down, inverted, head at bottom, legs at top, 69, sixty-nine");
      const isMissionaryGroup =
        channel === "vaginal" && maleCode !== "off" && showP && /^P0[1-7]$/.test(sceneId);
      if (isPov && isMissionaryGroup) {
        poseUsed = joinTags("1.35::missionary::", poseUsed);
      }
    }

    if (
      !isPov &&
      !isTentacle &&
      (maleCode === "normal" || maleCode === "translucent")
    ) {
      // Strip global female-body-preset UC tags that accidentally ban the male partner's torso/shoulders in 3rd-person
      const maleSafeStripUc = new Set([
        "muscular",
        "broad shoulders",
        "wide shoulders",
        "long torso",
        "towering",
        "pointy chin",
        "sharp chin",
        "long face",
      ]);
      if (tailNegUsed) {
        tailNegUsed = tailNegUsed
          .split(",")
          .map((t) => t.trim())
          .filter((t) => Boolean(t) && !maleSafeStripUc.has(t.toLowerCase()))
          .join(", ");
      }

      if (showP && channel === "vaginal") {
        let couple3rdTags = "1.35::sex::";
        if (sceneId === "P03") {
          couple3rdTags = "1.35::sex::, 1.4::mating press::, boy on top";
        } else if (/^P0[124567]$/.test(sceneId)) {
          couple3rdTags = "1.35::sex::, 1.35::missionary::, boy on top, between legs";
        } else if (/^(P08|P09|P10|P11|P14|P16|P34)$/.test(sceneId)) {
          couple3rdTags = "1.35::sex::, 1.35::cowgirl position::, straddling";
        } else if (/^(P12|P13|P15)$/.test(sceneId)) {
          couple3rdTags = "1.35::sex::, 1.35::reverse cowgirl::, straddling";
        } else if (/^(P17|P18|P19|P20|P21|P22|P29)$/.test(sceneId)) {
          couple3rdTags = "1.35::sex::, 1.35::sex from behind::, doggystyle";
        } else if (sceneId === "P23") {
          couple3rdTags = "1.35::sex::, 1.35::spooning::, sex from behind";
        } else if (sceneId === "P24" || sceneId === "P25") {
          couple3rdTags = "1.35::sex::, between legs";
        } else if (/^(P26|P27|P42)$/.test(sceneId)) {
          couple3rdTags = "1.35::sex::, 1.35::standing sex::, holding girl";
        } else if (sceneId === "P28" || sceneId === "P40") {
          couple3rdTags = "1.35::sex::, 1.35::standing sex::, sex from behind";
        }
        poseUsed = joinTags(couple3rdTags, poseUsed);
      }
    }

    const expPos = suppressPovFaceAndEyes
      ? stageCode === "before"
        ? "arched back, tense body"
        : "trembling, arched back"
      : exprIf(
          cfg,
          tpl.default_expr_tags || "furrowed brow, half-closed eyes, watery eyes, blush",
          "",
          sceneId
        );
    const remPos = "sweat";
    const fullNeg = joinTags(extraNeg, transNeg, tailNegUsed);
    const creaturePovSpec = isTentacle && isPov ? resolveCreaturePovSpec(sceneId, Boolean(cfg.enable_uterus_xray)) : null;
    const effectivePoseUsed = creaturePovSpec ? creaturePovSpec.poseTags : poseUsed;
    const povLbl = isPov
      ? isTentacle
        ? "仰视第一视角 (View B · 胯→头 POV)"
        : "第一人称 (POV)"
      : "第三人称 (客观镜头)";
    const rawCoreProse = isPov && tpl.prose_pov ? tpl.prose_pov : tpl.prose_core;
    let resolvedCoreProse = rawCoreProse.replaceAll("{name}", m.name);
    if (cfg.enable_uterus_xray && (sceneId === "TN12" || sceneId === "BG06")) {
      resolvedCoreProse = resolvedCoreProse.replace(/translucent belly/gi, "distended abdomen");
    }
    if (!isTentacle && maleCode === "off") {
      if (sceneId === "P27") {
        resolvedCoreProse = "lying on her back with both legs raised high and knees drawn toward her chest";
      } else if (sceneId === "P28") {
        resolvedCoreProse = "lying on her back facing forward with both knees drawn wide apart in an M-shape";
      } else if (sceneId === "P40") {
        resolvedCoreProse = "lying folded on her back with her knees drawn high and wide apart facing forward";
      } else if (sceneId === "P46") {
        resolvedCoreProse = "sitting leaned back with her thighs parted wide toward the camera";
      } else if (sceneId === "P49") {
        resolvedCoreProse = "kneeling with her spine arched low and hips raised while bracing with one hand";
      } else if (sceneId === "P51") {
        resolvedCoreProse = "lying on her back with both knees drawn wide apart facing forward";
      } else if (sceneId === "P33") {
        resolvedCoreProse = `${m.name} kneeling on all fours in side profile with her back arched`;
      }
    }
    if (cfg.enable_background && scenePreset.strip_indoor_pose) {
      resolvedCoreProse = resolvedCoreProse
        .replace(/against a clear glass pane/gi, "leaning forward with her palms braced")
        .replace(/against the glass window in front of her/gi, "braced ahead")
        .replace(/on the floor/gi, "low to the ground");
    }
    const effectivePartnerProse = rawCoreProse.includes("{name}") ? "" : partnerProse;
    const baseProseSentence = rawCoreProse.includes("{name}")
      ? `${resolvedCoreProse}${effectivePartnerProse}${organProse}${bgProse}.`
      : `${m.name} ${resolvedCoreProse}${effectivePartnerProse}${organProse}${bgProse}.`;
    const proseSentence = creaturePovSpec
      ? `${creaturePovSpec.prosePrefix}${baseProseSentence}`
      : baseProseSentence;
    const resolvedCanvas = isTentacle && isPov
      ? "竖图 832x1216"
      : isPov && tpl.canvas_pov
        ? tpl.canvas_pov
        : tpl.canvas;
    const finalPosProse = isTentacle
      ? cfg.enable_t5_prose
        ? proseSentence
        : ""
      : proseIf(cfg, proseSentence, transBg, suppressPovFaceAndEyes);

    const pPos = joinTags(
      headUsed,
      actorTags,
      charCoreUsed,
      bgUsed,
      effectivePoseUsed,
      posLeg,
      posOutfit,
      expPos,
      "rating:explicit, nsfw, uncensored",
      organTags,
      remPos,
      finalPosProse,
      wrapTailNeg(m, fullNeg, negOn)
    );
    results.push({
      subTitle: `【${tpl.title} · ${povLbl}${sceneBadge}${stageBadge}${condomBadge}】`,
      canvas: resolvedCanvas,
      prompt: pPos,
    });
  } else if (sceneId in OTHER_ACTION_TEMPLATES) {
    const tpl = OTHER_ACTION_TEMPLATES[sceneId];
    const genderMode: CharacterGenderMode = cfg.gender_mode ?? "normal";
    const useSceneOutfit = cfg.other_use_scene_outfit !== false;
    const transBg = Boolean(cfg.pos_transparent_bg);
    const sfLightEntry = resolveLightingPresetEntry(cfg.lighting_preset);
    const isAutoLight = sfLightEntry.code === "auto";
    const isSfCompatibleCelStyle =
      cfg.enable_style &&
      !isPixelStyleActive(cfg) &&
      !isM6SoftMorningSkinActive(cfg) &&
      !isFigureStyleActive(cfg) &&
      !cfg.style_preset.includes("无描边柔涂") &&
      !cfg.style_preset.includes("细棕彩线") &&
      !cfg.style_preset.includes("黑白网点漫画") &&
      !cfg.style_preset.includes("Monochrome Manga");
    const m = buildCommonModules(cfg, !tpl.no_face_pov && !tpl.is_photo_substitute_scene);

    const isExplicitDedicatedLight = isExplicitDedicatedSceneLightingCode(sfLightEntry.code);
    const isKitchenOverrideLight =
      !isExplicitDedicatedLight &&
      Boolean(tpl.kitchen_light_mode) &&
      tpl.kitchen_light_mode !== "sunlit_or_pendant";
    const poolLightSpec = tpl.pool_light_mode ? POOL_LIGHT_DEFAULTS[tpl.pool_light_mode] : undefined;
    const isPoolNonSunlit =
      !isExplicitDedicatedLight &&
      Boolean(tpl.pool_light_mode) &&
      tpl.pool_light_mode !== "sunlit_caustics" &&
      tpl.pool_light_mode !== "split_waterline";
    const isPoolNight = !isExplicitDedicatedLight && tpl.pool_light_mode === "night_pool_glow";
    const isSpecimenNocturnalFridge = !isExplicitDedicatedLight && Boolean(tpl.is_nocturnal_fridge);
    const isBathroomHumidLight = !isExplicitDedicatedLight && Boolean(tpl.bathroom_light_mode);
    const isHouseworkNonSunlit =
      !isExplicitDedicatedLight &&
      Boolean(tpl.housework_light_mode) &&
      (tpl.housework_light_mode === "hallway_wood_sheen" ||
        tpl.housework_light_mode === "closet_dim_warm");
    const campingLightSpec = tpl.camping_light_mode
      ? CAMPING_LIGHT_DEFAULTS[tpl.camping_light_mode]
      : undefined;
    const isCampingNocturnalLight =
      !isExplicitDedicatedLight &&
      Boolean(tpl.camping_light_mode) &&
      (tpl.camping_light_mode === "lantern_glowing_tent" ||
        tpl.camping_light_mode === "warm_campfire_ember" ||
        tpl.camping_light_mode === "starry_milkyway_night");
    const aftersexDripLightSpec = tpl.aftersex_drip_light_mode
      ? AFTERSEX_DRIP_LIGHT_DEFAULTS[tpl.aftersex_drip_light_mode]
      : undefined;
    const isAftersexDripNonSunlit =
      !isExplicitDedicatedLight &&
      Boolean(tpl.is_aftersex_drip_scene) &&
      tpl.lighting_mode !== "sunlit_indoor";
    const onsenLightSpec = tpl.onsen_light_mode
      ? ONSEN_LIGHT_DEFAULTS[tpl.onsen_light_mode]
      : undefined;
    const isOnsenNonDaylight =
      !isExplicitDedicatedLight &&
      Boolean(tpl.is_onsen_scene && onsenLightSpec && !onsenLightSpec.is_daylight);
    const isExplicitNonSunlit =
      isExplicitDedicatedLight &&
      sfLightEntry.code !== "kitchen_sunlit_pendant" &&
      sfLightEntry.code !== "pool_sunlit_caustics" &&
      sfLightEntry.code !== "pool_split_waterline" &&
      sfLightEntry.code !== "housework_sunlit_living" &&
      sfLightEntry.code !== "housework_sunny_balcony" &&
      sfLightEntry.code !== "housework_warm_bedroom" &&
      sfLightEntry.code !== "camping_dappled_meadow" &&
      sfLightEntry.code !== "camping_golden_lakeside";

    const isSfNonSunlit =
      !tpl.is_kitchen_scene &&
      !tpl.is_pool_scene &&
      !tpl.is_bathroom_scene &&
      !tpl.is_housework_scene &&
      !tpl.is_photo_substitute_scene &&
      !tpl.is_camping_scene &&
      !tpl.is_aftersex_drip_scene &&
      !tpl.is_onsen_scene &&
      tpl.lighting_mode !== "sunlit_indoor";
    let headUsed = transBg ? sanitizeStyleForTransparentBg(m.head_pos) : m.head_pos;
    const headStripSet = new Set<string>();
    if (
      !transBg &&
      (isSfNonSunlit ||
        (tpl.lighting_mode !== "sunlit_indoor" && !isExplicitDedicatedLight) ||
        isKitchenOverrideLight ||
        isPoolNonSunlit ||
        isSpecimenNocturnalFridge ||
        isBathroomHumidLight ||
        isHouseworkNonSunlit ||
        isCampingNocturnalLight ||
        isAftersexDripNonSunlit ||
        isOnsenNonDaylight ||
        isExplicitNonSunlit)
    ) {
      headStripSet.add("sunlight");
      headStripSet.add("bright summer sunlight");
      headStripSet.add("bright breezy summer balcony sunlight");
      headStripSet.add("dappled sunlight");
      headStripSet.add("morning sunlight");
      headStripSet.add("afternoon sunlight");
      headStripSet.add("sun glare");
      headStripSet.add("light rays");
      headStripSet.add("daylight");
      headStripSet.add("clear blue sky");
      headStripSet.add("bright sky");
    }
    if (
      !transBg &&
      ((tpl.is_camping_scene && !tpl.is_inside_tent) ||
        Boolean(tpl.is_outdoor_drip) ||
        Boolean(tpl.is_outdoor_onsen))
    ) {
      headStripSet.add("indoors");
      headStripSet.add("warm indoor lighting");
    }
    if (
      !transBg &&
      isOnsenNonDaylight &&
      !/\bbacklight/i.test(tpl.light_tags)
    ) {
      headStripSet.add("backlighting");
    }
    if (
      !transBg &&
      (isPoolNight ||
        isSpecimenNocturnalFridge ||
        (!isExplicitDedicatedLight && tpl.camping_light_mode === "warm_campfire_ember"))
    ) {
      for (const pn of [
        "backlighting",
        "rim lighting",
        "warm lighting",
        "warm indoor lighting",
        "overexposure",
        "pastel colors",
        "light colors",
      ]) {
        headStripSet.add(pn);
      }
    }
    if (!transBg && !isExplicitDedicatedLight && tpl.lighting_mode === "flash") {
      // Direct front camera flash must NEVER fight rear backlighting or muted pastel low-contrast tags
      for (const fl of [
        "backlighting",
        "rim lighting",
        "warm lighting",
        "warm indoor lighting",
        "soft lighting",
        "diffused lighting",
        "overexposure",
        "pastel colors",
        "soft colors",
        "muted colors",
        "muted color",
        "low contrast",
      ]) {
        headStripSet.add(fl);
      }
    } else if (!transBg && !isExplicitDedicatedLight && tpl.lighting_mode === "night_neon") {
      for (const nn of ["warm lighting", "warm indoor lighting", "overexposure", "pastel colors", "light colors"]) {
        headStripSet.add(nn);
      }
    } else if (!transBg && isAutoLight && isSfCompatibleCelStyle) {
      for (const st of [
        "warm lighting",
        "warm indoor lighting",
        "soft lighting",
        "pastel colors",
        "soft colors",
        "muted colors",
        "low contrast",
      ]) {
        headStripSet.add(st);
      }
    }
    if (tpl.allow_text_ui) {
      headStripSet.add("no text");
    }
    if (tpl.no_face_pov) {
      for (const ft of [
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
      ]) {
        headStripSet.add(ft);
      }
      if (m.tune2_inline_neg) {
        m.tune2_inline_neg = "";
      }
    } else if (tpl.is_photo_substitute_scene) {
      // Eyes & upper face are occluded beneath the opaque printed portrait photo on PS01..PS04
      for (const et of [
        "gradient eyes",
        "thick eyelashes",
        "eyelashes",
        "eyelid crease",
        "small white eye highlights",
        "colored eyelashes",
        "eyeshadow",
      ]) {
        headStripSet.add(et);
      }
    }
    if (headStripSet.size > 0 && headUsed) {
      headUsed = splitTopLevelCommaSegments(headUsed)
        .filter((tok) => {
          const bare = tok.replace(/^-?\d+(?:\.\d+)?::([\s\S]+?)::$/, "$1").trim().toLowerCase();
          return Boolean(bare) && !headStripSet.has(bare);
        })
        .join(", ");
    }
    // When global lighting_preset is 'auto', automatically inject the skill-calibrated SF/Kitchen/Pool/Specimen/Camping/Onsen base cel-lock & wet specular block!
    if (!transBg && isAutoLight && isSfCompatibleCelStyle) {
      const sfBaseLight =
        tpl.lighting_mode === "flash" ||
        isPoolNight ||
        isSpecimenNocturnalFridge ||
        (isOnsenNonDaylight && !/\bbacklight/i.test(tpl.light_tags)) ||
        (!isExplicitDedicatedLight && tpl.camping_light_mode === "warm_campfire_ember")
          ? SF_BASE_CEL_LIGHT_NO_BACKLIGHT
          : SF_BASE_CEL_LIGHT_BACKLIT;
      headUsed = deduplicatePositiveTagPrefix(joinTags(headUsed, sfBaseLight));
    }
    if (
      (tpl.is_kitchen_scene ||
        tpl.is_pool_scene ||
        tpl.is_specimen_scene ||
        tpl.is_bathroom_scene ||
        tpl.is_housework_scene ||
        tpl.is_photo_substitute_scene ||
        tpl.is_camping_scene ||
        tpl.is_aftersex_drip_scene ||
        tpl.is_onsen_scene) &&
      (genderMode === "futa_no_balls" || genderMode === "futa_with_balls") &&
      headUsed.includes("0.50::artist:doshimash0::") &&
      !headUsed.includes("artist:pija")
    ) {
      headUsed = headUsed.replace(
        "0.50::artist:doshimash0::",
        "0.48::artist:doshimash0::, 0.25::artist:pija (pianiishimo)::"
      );
    }
    if (!transBg && tpl.is_pool_scene && !/\bwater droplets\b/i.test(headUsed)) {
      headUsed = joinTags(headUsed, "water droplets");
    }
    if (!transBg && tpl.is_bathroom_scene) {
      const bathWetAdd: string[] = [];
      if (!/\bwet skin\b/i.test(headUsed)) bathWetAdd.push("wet skin");
      if (!/\bwater droplets\b/i.test(headUsed)) bathWetAdd.push("water droplets");
      if (!/\bsteam\b/i.test(headUsed)) bathWetAdd.push("steam");
      if (bathWetAdd.length > 0) headUsed = joinTags(headUsed, bathWetAdd.join(", "));
    }

    let charCoreUsed = m.char_core;
    if (tpl.strip_slim_waist) {
      charCoreUsed = splitTopLevelCommaSegments(charCoreUsed)
        .filter((tok) => {
          const low = tok.trim().toLowerCase();
          const bare = tok.replace(/^-?\d+(?:\.\d+)?::([\s\S]+?)::$/, "$1").trim().toLowerCase();
          return (
            Boolean(bare) &&
            bare !== "slim waist" &&
            bare !== "narrow waist" &&
            !(
              tpl.id === "AFD14" &&
              (bare === "narrow hips" || bare === "wide hips" || bare === "thin thighs")
            ) &&
            low !== "-0.40::plump::" &&
            low !== "-0.4::plump::"
          );
        })
        .join(", ");
    }
    if (tpl.no_face_pov || tpl.is_photo_substitute_scene) {
      const stripCharFaceSet = new Set([
        ...(tpl.no_face_pov ? ["short face", "round face"] : []),
        "tareme",
        "tsurime",
        "heterochromia",
        "glasses",
        "semi-rimless glasses",
        "heart-shaped pupils",
        "empty eyes",
        "jitome",
        "half-closed eyes",
        "closed eyes",
        "rolling eyes",
      ]);
      charCoreUsed = splitTopLevelCommaSegments(charCoreUsed)
        .filter((tok) => {
          const bare = tok.replace(/^-?\d+(?:\.\d+)?::([\s\S]+?)::$/, "$1").trim().toLowerCase();
          if (!bare) return false;
          if (stripCharFaceSet.has(bare) || /\beyes$/i.test(bare)) return false;
          return true;
        })
        .join(", ");
    }
    if (genderMode === "femboy") {
      charCoreUsed = charCoreUsed
        .replace(
          /(?:,\s*)?(?:\d+(?:\.\d+)?::)?(?:small breasts|medium breasts|large breasts|huge breasts|flat chest|breasts|short female|female|1girl)(?:::)?/gi,
          ""
        )
        .replace(/,\s*,+/g, ", ")
        .replace(/^[ ,]+|[ ,]+$/g, "");
    }

    const soloSpreadSpec =
      cfg.enable_solo_spread && tpl.is_onsen_scene && !tpl.is_onsen_duo
        ? tpl.solo_spread_spec
        : undefined;
    const soloSpreadActive = Boolean(soloSpreadSpec);
    const rawFemaleActionTags = soloSpreadSpec
      ? soloSpreadSpec.spread_female_tags
      : tpl.female_tags;
    const rawFemboyActionTags = soloSpreadSpec
      ? soloSpreadSpec.spread_femboy_tags
      : tpl.femboy_tags;
    const rawFutaActionTags = soloSpreadSpec ? soloSpreadSpec.spread_futa_tags : tpl.futa_tags;

    const charHasFlatChest = /\bflat chest\b/i.test(charCoreUsed);
    let actorTags = "1girl, solo";
    let genderActionTags = rawFemaleActionTags;
    let genderProse = tpl.female_prose;
    let genderNeg = charHasFlatChest
      ? "1boy, male, penis, phallus, futanari, testicles, male chest"
      : "1boy, male, penis, phallus, futanari, testicles, flat chest";
    let genderBadge = "";

    if (genderMode === "femboy") {
      actorTags =
        (tpl.is_aftersex_drip_scene || (tpl.is_onsen_scene && tpl.chest_covered)) && useSceneOutfit
          ? "1.55::1boy::, solo, 1.6::otoko no ko::, 1.5::crossdressing::, 1.25::short male::, 1.55::flat chest::, 1.4::flat male chest::, hairless torso"
          : "1.45::1boy::, solo, 1.55::otoko no ko::, 1.45::crossdressing::, 1.35::genderbend::, 1.25::short male::, 1.55::flat chest::, 1.4::flat male chest::, tiny pink nipples, hairless torso";
      genderActionTags = rawFemboyActionTags;
      genderProse = tpl.femboy_prose;
      genderNeg = joinTags(
        "1girl, female, girl, hetero, breasts, small breasts, medium breasts, large breasts, cleavage, underboob, pussy, vulva, labia, vaginal, uterus, cervix, futanari, muscular male, bara, thick neck, facial hair, mature male, tall male, huge penis, large penis, oversized penis, hyper penis, monster penis, giant penis, huge testicles, large testicles",
        tpl.femboy_extra_neg || ""
      );
      genderBadge = " · [🎀伪娘]";
    } else if (genderMode === "futa_no_balls") {
      actorTags = tpl.is_onsen_scene
        ? "1girl, solo, 1.6::futanari::, 1.5::futa without balls::, 1.4::small penis::"
        : "1girl, solo, 1.55::futanari::, 1.45::futa without balls::";
      genderActionTags = splitTopLevelCommaSegments(rawFutaActionTags)
        .filter((tok) => {
          const bare = tok.replace(/^-?\d+(?:\.\d+)?::([\s\S]+?)::$/, "$1").trim().toLowerCase();
          return (
            Boolean(bare) &&
            bare !== "testicles" &&
            bare !== "small testicles" &&
            bare !== "balls" &&
            (soloSpreadActive || (bare !== "labia" && bare !== "spread pussy"))
          );
        })
        .join(", ");
      genderProse = tpl.futa_prose;
      genderNeg = joinTags(
        "1boy, male, otoko no ko, crossdressing, yaoi, male chest, testicles, balls, scrotum, huge penis, large penis, oversized penis, hyper penis, monster penis, giant penis",
        charHasFlatChest ? "" : "flat chest"
      );
      genderBadge = " · [⚡扶他·无蛋]";
    } else if (genderMode === "futa_with_balls") {
      actorTags = tpl.is_onsen_scene
        ? "1girl, solo, 1.6::futanari::, 1.45::futa with balls::, 1.4::small penis::, 1.3::small testicles::, testicles"
        : "1girl, solo, 1.55::futanari::, 1.45::futa with balls::, 1.3::small testicles::, testicles";
      genderActionTags = splitTopLevelCommaSegments(rawFutaActionTags)
        .filter((tok) => {
          const bare = tok.replace(/^-?\d+(?:\.\d+)?::([\s\S]+?)::$/, "$1").trim().toLowerCase();
          return Boolean(bare) && (soloSpreadActive || (bare !== "labia" && bare !== "spread pussy"));
        })
        .join(", ");
      genderProse = tpl.futa_prose;
      genderNeg = joinTags(
        "1boy, male, otoko no ko, crossdressing, yaoi, male chest, huge penis, large penis, oversized penis, hyper penis, monster penis, giant penis, huge testicles, large testicles",
        charHasFlatChest ? "" : "flat chest"
      );
      genderBadge = " · [⚡扶他·有蛋]";
    }

    let outfitTags = "";
    let customOutfitSafeNeg = "";
    if (useSceneOutfit) {
      if (soloSpreadSpec?.spread_outfit_override) {
        outfitTags =
          genderMode === "femboy"
            ? soloSpreadSpec.spread_femboy_outfit_override || soloSpreadSpec.spread_outfit_override
            : soloSpreadSpec.spread_outfit_override;
      } else {
        outfitTags =
          genderMode === "femboy" && tpl.femboy_outfit ? tpl.femboy_outfit : tpl.builtin_outfit;
      }
    } else if (cfg.enable_outfit) {
      outfitTags = joinTags(m.outfit_pos, m.front_leg_tags);
      if (genderMode === "femboy") {
        outfitTags = outfitTags
          .replace(/(?:,\s*)?(?:\d+(?:\.\d+)?::)?(?:bare breasts|breasts|cleavage|bra|pasties|heart pasties)(?:::)?/gi, "")
          .replace(/,\s*,+/g, ", ");
      }
      const isRearSf = sceneId === "SF06" || sceneId === "SF22" || sceneId === "SF27";
      if (!isRearSf && outfitTags) {
        outfitTags = splitTopLevelCommaSegments(outfitTags)
          .filter((tok) => stripWeightPrefix(tok) !== "rabbit tail")
          .join(", ");
      }
      if (tpl.keep_wet_clothes && outfitTags && !/\bcompletely nude\b/i.test(outfitTags)) {
        outfitTags = joinTags("1.4::wet clothes::, see-through", outfitTags);
      }
      if (m.outfit_extra_neg) {
        const outfitNegTokens = m.outfit_extra_neg
          .split(",")
          .map((t) => t.trim())
          .filter((t) => {
            const low = t.toLowerCase();
            return (
              Boolean(low) &&
              low !== "nude" &&
              low !== "topless" &&
              low !== "bottomless" &&
              low !== "wet clothes" &&
              low !== "dripping"
            );
          });
        const outfitBlocksNipples = outfitNegTokens.some((t) => t.toLowerCase() === "nipples");
        if (outfitBlocksNipples && genderMode !== "femboy") {
          genderActionTags = splitTopLevelCommaSegments(genderActionTags)
            .filter((tok) => {
              const bare = stripWeightPrefix(tok);
              return bare !== "bare breasts" && bare !== "nipples";
            })
            .join(", ");
        }
        customOutfitSafeNeg = outfitNegTokens.join(", ");
      }
      if (tpl.prose_outfit_phrase) {
        const altClauses = tpl.prose_outfit_phrase.split("|").filter(Boolean);
        for (const cl of altClauses) {
          if (genderProse.includes(cl)) {
            const charWear = m.front_shirt_prose ? m.front_shirt_prose.trim() : "";
            genderProse = charWear
              ? genderProse.replace(cl, charWear)
              : genderProse.replace(new RegExp(`\\s*${cl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*`, "g"), " ");
          }
        }
        genderProse = genderProse.replace(/\s{2,}/g, " ");
      }
    } else if (tpl.prose_outfit_phrase) {
      for (const cl of tpl.prose_outfit_phrase.split("|").filter(Boolean)) {
        genderProse = genderProse.replace(cl, "completely nude");
      }
    }

    if (soloSpreadSpec) {
      if (useSceneOutfit) {
        genderProse = genderProse
          .replace(
            /\bwhile holding up (?:her|his) blue floral yukata hem\b/i,
            genderMode === "femboy"
              ? "with his blue floral yukata hem tucked into his obi sash"
              : "with her blue floral yukata hem tucked into her obi sash"
          )
          .replace(
            /\band uses both hands to lift (?:her|his) indigo yukata skirt\b/i,
            "standing"
          )
          .replace(
            /\bwhile tugging open (?:her|his) navy floral yukata hem\b/i,
            genderMode === "femboy" ? "in his navy floral yukata" : "in her navy floral yukata"
          )
          .replace(/\s*while lifting the back hem of (?:her|his) lavender yukata\b/i, "")
          .replace(
            /\bwhile lifting (?:her|his) crimson yukata hem\b/i,
            genderMode === "femboy"
              ? "with his crimson yukata hem tucked into his obi sash"
              : "with her crimson yukata hem tucked into her obi sash"
          );
      }
      let spreadSuffix = soloSpreadSpec.spread_prose_suffix;
      if (!useSceneOutfit) {
        spreadSuffix = spreadSuffix.replace(
          /\s*with (?:her|his) (?:front |back )?(?:yukata )?hem tucked into (?:her|his) (?:[a-z-]+ )?(?:obi|sash) (?:so|while)/gi,
          " while"
        );
      }
      if (genderMode === "femboy") {
        spreadSuffix = femboyPronounClean(spreadSuffix);
      }
      genderProse = `${genderProse.replace(/\.+\s*$/, "")}${spreadSuffix}`;
    }

    if (tpl.is_onsen_scene && !useSceneOutfit) {
      genderActionTags = stripOnsenSceneGarmentRefs(genderActionTags);
    }

    const useSfDedicatedLight =
      !transBg &&
      !isExplicitDedicatedLight &&
      (isAutoLight || is25dCelLightingCode(sfLightEntry.code) || sfLightEntry.code === "m2_razor_fine_cel");
    const rawSceneLightTags =
      transBg || isExplicitDedicatedLight
        ? ""
        : tpl.is_pool_scene && poolLightSpec
          ? joinTags(poolLightSpec.pos, tpl.light_tags)
          : tpl.is_onsen_scene && onsenLightSpec
            ? joinTags(
                splitTopLevelCommaSegments(onsenLightSpec.pos)
                  .filter((seg) => {
                    const low = seg.toLowerCase();
                    const combinedRef = `${tpl.env_tags} ${tpl.light_tags}`.toLowerCase();
                    if (low.includes("tatami room") && combinedRef.includes("tatami")) return false;
                    if (low.includes("andon lamp") && /\b(?:andon|lantern light|vending machine light)\b/i.test(combinedRef)) return false;
                    if (low.includes("cypress bathhouse") && combinedRef.includes("cypress")) return false;
                    if (low.includes("engawa") && combinedRef.includes("engawa")) return false;
                    if (low.includes("yukimi-doro") && combinedRef.includes("yukimi-doro")) return false;
                    return true;
                  })
                  .join(", "),
                tpl.light_tags
              )
            : tpl.is_specimen_scene ||
                tpl.is_bathroom_scene ||
                tpl.is_housework_scene ||
                tpl.is_camping_scene ||
                tpl.is_aftersex_drip_scene ||
                useSfDedicatedLight ||
                isKitchenOverrideLight
              ? tpl.light_tags
              : tpl.lighting_mode === "flash" ||
                  tpl.lighting_mode === "night_neon" ||
                  tpl.lighting_mode === "warm_spot" ||
                  tpl.lighting_mode === "steamy_glass"
                ? tpl.light_tags
                : "";
    const sfSceneLightTags =
      (tpl.is_specimen_scene ||
        tpl.is_bathroom_scene ||
        tpl.is_aftersex_drip_scene ||
        tpl.is_onsen_scene) &&
      genderMode === "femboy"
        ? rawSceneLightTags.replace(/\bher\b/gi, "his")
        : rawSceneLightTags;

    const rawEffectiveEnvTags = isExplicitNonSunlit
      ? tpl.env_tags
          .replace(
            /\bsunlit\b/gi,
            tpl.is_camping_scene || tpl.is_outdoor_drip || tpl.is_outdoor_onsen ? "" : "indoor"
          )
          .replace(/\bsunny\b/gi, "")
          .replace(/\s{2,}/g, " ")
          .trim()
      : tpl.env_tags;
    const preGarmentEnvTags =
      (tpl.is_specimen_scene ||
        tpl.is_bathroom_scene ||
        tpl.is_aftersex_drip_scene ||
        tpl.is_onsen_scene) &&
      genderMode === "femboy"
        ? femboyPronounClean(rawEffectiveEnvTags)
        : rawEffectiveEnvTags;
    const effectiveEnvTags =
      tpl.is_onsen_scene && !useSceneOutfit
        ? stripOnsenSceneGarmentRefs(preGarmentEnvTags)
        : preGarmentEnvTags;
    const activeRawCoreProps = soloSpreadSpec
      ? soloSpreadSpec.spread_prop_tags
      : tpl.core_prop_tags || "";
    const preGarmentCorePropTags =
      (tpl.is_specimen_scene || tpl.is_bathroom_scene) &&
      genderMode === "femboy" &&
      tpl.femboy_core_prop_tags
        ? tpl.femboy_core_prop_tags
        : (tpl.is_aftersex_drip_scene || tpl.is_onsen_scene) && genderMode === "femboy"
          ? femboyPronounClean(
              activeRawCoreProps
                .replace(/\bwet bare breasts?\b/gi, "wet flat chest")
                .replace(/\bbare breasts?\b/gi, "flat chest")
                .replace(/\bcleavage\b/gi, "flat chest")
            )
          : activeRawCoreProps;
    const effectiveCorePropTags =
      tpl.is_onsen_scene && !useSceneOutfit
        ? stripOnsenSceneGarmentRefs(preGarmentCorePropTags)
        : preGarmentCorePropTags;
    const effectiveFramingTags =
      (tpl.is_specimen_scene ||
        tpl.is_bathroom_scene ||
        tpl.is_aftersex_drip_scene ||
        tpl.is_onsen_scene) &&
      genderMode === "femboy"
        ? tpl.femboy_framing_tags ||
          femboyPronounClean(
            tpl.framing_tags
              .replace(/(?:,\s*)?\d+(?:\.\d+)?::girl on top::/gi, "")
              .replace(/\bgirl on top\b/gi, "straddling")
          )
            .replace(/,\s*,+/g, ", ")
            .replace(/^[ ,]+|[ ,]+$/g, "")
        : tpl.framing_tags;

    const envAndPropsUsed = transBg
      ? joinTags("2.0::transparent background::, has alpha, alpha transparency, no background", effectiveCorePropTags)
      : joinTags(effectiveEnvTags, sfSceneLightTags, effectiveCorePropTags);
    const transNeg = transBg
      ? "background, simple background, white background, black background, gradient background, indoors, outdoors, scenery, furniture, bed, couch, sofa, pillow, window, curtains, wall, floor, drop shadow"
      : "";
    const camUc = tpl.allow_smartphone_prop
      ? "mirror, mirror selfie, camera lens, taking picture, phone covering face"
      : tpl.allow_wall_mirror
        ? "mirror selfie, holding phone, smartphone, cellphone, mobile phone, camera lens, taking picture"
        : tpl.camera_mode === "mirror"
          ? SF_MIRROR_UC
          : tpl.camera_mode === "direct" || tpl.camera_mode === "ui_livestream"
            ? SF_DIRECT_POV_UC
            : "";
    const xrayNeg = tpl.builtin_xray
      ? genderMode === "femboy"
        ? "fetus, baby, embryo, skeleton, bones, skull, ribcage, medical diagram, gore, uterus, cervix, womb"
        : "fetus, baby, embryo, skeleton, bones, skull, ribcage, medical diagram, gore"
      : cfg.enable_uterus_xray
        ? ""
        : "x-ray, cross-section, cutaway, uterus";

    // Build isolated SF tail negative WITHOUT left-column intactNeg / envExtraNeg / anatNeg / conflicting outfitExtraNeg!
    const sfStyleUnblock = new Set<string>([
      "dripping",
      "splash",
      "body oil",
      "oily skin",
      "flying sweatdrops",
    ]);
    if (!transBg && isAutoLight && isSfCompatibleCelStyle) {
      for (const cu of [
        "cel shading",
        "cel highlight",
        "anime coloring",
        "lineart",
        "flat color",
        "high contrast",
        "harsh shadow",
        "harsh shadows",
        "saturated",
      ]) {
        sfStyleUnblock.add(cu);
      }
    }
    if (tpl.keep_wet_clothes || tpl.is_pool_scene) {
      sfStyleUnblock.add("wet clothes");
      sfStyleUnblock.add("shiny ass");
      sfStyleUnblock.add("light spots");
    }
    if (tpl.unblock_multiple_views) {
      sfStyleUnblock.add("multiple views");
      sfStyleUnblock.add("inset");
    }
    if (tpl.allow_text_ui) {
      sfStyleUnblock.add("text");
    }
    if (!isExplicitDedicatedLight && tpl.kitchen_light_mode === "doorway_blind_slit") {
      sfStyleUnblock.add("depth of field");
      sfStyleUnblock.add("blurry");
      sfStyleUnblock.add("harsh shadow");
      sfStyleUnblock.add("harsh shadows");
    }
    if (
      !isExplicitDedicatedLight &&
      (tpl.pool_light_mode === "shower_frosted_glass" ||
        tpl.is_bathroom_scene ||
        tpl.is_onsen_scene)
    ) {
      sfStyleUnblock.add("depth of field");
      sfStyleUnblock.add("blurry");
      sfStyleUnblock.add("soft focus");
      sfStyleUnblock.add("hazy");
      sfStyleUnblock.add("foggy");
      sfStyleUnblock.add("steam");
      sfStyleUnblock.add("wet skin");
      sfStyleUnblock.add("wet clothes");
    }
    if (
      !transBg &&
      !isExplicitDedicatedLight &&
      (tpl.lighting_mode !== "sunlit_indoor" || isKitchenOverrideLight || isPoolNonSunlit)
    ) {
      for (const dk of [
        "dark",
        "dim lighting",
        "harsh shadow",
        "harsh shadows",
        "high contrast",
        "overexposed",
        "bloom",
        "neon colors",
        "vibrant colors",
        "cold lighting",
        "blue tint",
      ]) {
        sfStyleUnblock.add(dk);
      }
    }
    const sfStyleNeg = (m.style_neg || "")
      .split(",")
      .map((t) => t.trim())
      .filter((t) => Boolean(t) && !sfStyleUnblock.has(t.toLowerCase()))
      .join(", ");

    const sfCanonStrip = new Set<string>();
    if (useSceneOutfit && /\bskirt\b/i.test(outfitTags)) {
      sfCanonStrip.add("skirt");
    }
    if (useSceneOutfit && /\bjacket\b/i.test(outfitTags)) {
      sfCanonStrip.add("jacket");
      sfCanonStrip.add("red jacket");
    }
    if (useSceneOutfit && tpl.allow_school_canon) {
      sfCanonStrip.add("serafuku");
      sfCanonStrip.add("neckerchief");
      sfCanonStrip.add("plaid");
      sfCanonStrip.add("skirt");
    }
    if (
      useSceneOutfit &&
      (sceneId === "SF21" || tpl.is_kitchen_scene || tpl.is_housework_scene)
    ) {
      sfCanonStrip.add("apron");
      sfCanonStrip.add("maid apron");
      sfCanonStrip.add("maid");
    }
    if (useSceneOutfit && tpl.unblock_prop_shirt) {
      sfCanonStrip.add("shirt");
      sfCanonStrip.add("collared shirt");
    }
    if (useSceneOutfit && tpl.unblock_prop_jacket) {
      sfCanonStrip.add("jacket");
      sfCanonStrip.add("red jacket");
    }
    if (useSceneOutfit && tpl.is_pool_scene) {
      sfCanonStrip.add("swimsuit");
      sfCanonStrip.add("bikini");
      sfCanonStrip.add("one-piece swimsuit");
      sfCanonStrip.add("competition swimsuit");
    }
    if (useSceneOutfit && tpl.is_photo_substitute_scene) {
      sfCanonStrip.add("maid");
      sfCanonStrip.add("maid headdress");
      sfCanonStrip.add("maid apron");
      sfCanonStrip.add("apron");
      sfCanonStrip.add("skirt");
      sfCanonStrip.add("cuffs");
      sfCanonStrip.add("detached cuffs");
      sfCanonStrip.add("bowtie");
      sfCanonStrip.add("neckerchief");
    }
    if (
      useSceneOutfit &&
      (tpl.is_camping_scene || tpl.is_aftersex_drip_scene || tpl.is_onsen_scene)
    ) {
      sfCanonStrip.add("skirt");
      sfCanonStrip.add("pleated skirt");
      sfCanonStrip.add("dress");
      sfCanonStrip.add("white dress");
      sfCanonStrip.add("green dress");
      sfCanonStrip.add("jacket");
      sfCanonStrip.add("red jacket");
      sfCanonStrip.add("shirt");
      sfCanonStrip.add("collared shirt");
      sfCanonStrip.add("shorts");
      if (tpl.is_onsen_scene) {
        sfCanonStrip.add("yukata");
        sfCanonStrip.add("kimono");
        sfCanonStrip.add("gloves");
        sfCanonStrip.add("white gloves");
      }
      if (tpl.is_camping_scene) {
        sfCanonStrip.add("hat");
      }
      sfCanonStrip.add("socks");
    }
    const sfCanonNeg = (m.canon_neg || "")
      .split(",")
      .map((t) => t.trim())
      .filter((t) => Boolean(t) && !sfCanonStrip.has(t.toLowerCase()))
      .join(", ");

    const kitchenDuoBodyStrip = new Set([
      "tall female",
      "mature female",
      "muscular",
      "broad shoulders",
      "wide shoulders",
      "doll",
      "plushie",
      "oversized head",
      "stubby legs",
      "short legs",
      "giantess",
      "towering",
      "miniature furniture",
      "low doorframe",
      "pointy chin",
      "sharp chin",
      "long face",
    ]);
    const sfBodyNeg = (m.body_neg || "")
      .split(",")
      .map((t) => t.trim())
      .filter((t) => {
        if (!t) return false;
        const low = t.toLowerCase();
        if (
          tpl.strip_slim_waist &&
          (low === "plump" ||
            low === "curvy" ||
            low === "chubby" ||
            (tpl.id === "AFD14" && (low === "wide hips" || low === "thick thighs")))
        ) {
          return false;
        }
        if (genderMode === "femboy" && /breasts/i.test(low)) {
          return false;
        }
        if (
          (tpl.is_kitchen_duo ||
            tpl.is_pool_duo ||
            tpl.is_specimen_duo ||
            tpl.is_housework_duo ||
            tpl.is_camping_duo ||
            tpl.is_onsen_duo) &&
          kitchenDuoBodyStrip.has(low)
        ) {
          return false;
        }
        return true;
      })
      .join(", ");

    // Place canon_neg & customOutfitSafeNeg ahead of verbose style/body negatives so priority guards never clip
    const comicLineUsed =
      tpl.is_bathroom_scene || /\bmotion lines\b/i.test(effectiveCorePropTags)
        ? (m.comic_line_guard || "").replace(/\bmotion lines,\s*/gi, "")
        : m.comic_line_guard || "";
    const baseTailNeg = joinTags(
      sfCanonNeg,
      customOutfitSafeNeg,
      sfStyleNeg,
      comicLineUsed,
      sfBodyNeg
    );

    const apronOnlyGuard = tpl.is_kitchen_scene && useSceneOutfit ? APRON_ONLY_UC : "";
    let houseworkApronGuard = "";
    if (tpl.is_housework_scene && useSceneOutfit) {
      const unblockSet = new Set<string>();
      if (tpl.unblock_prop_shirt) {
        unblockSet.add("shirt");
        unblockSet.add("collared shirt");
      }
      if (tpl.unblock_prop_jacket) {
        unblockSet.add("jacket");
      }
      const filteredApronUc = APRON_ONLY_UC.split(",")
        .map((s) => s.trim())
        .filter((s) => Boolean(s) && !unblockSet.has(s.toLowerCase()))
        .join(", ");
      const dressedGuard =
        tpl.unblock_prop_shirt || tpl.unblock_prop_jacket
          ? "dressed male, man wearing suit"
          : "";
      const barefootBan = tpl.barefoot
        ? "thighhighs, stockings, socks, legwear, pantyhose"
        : "";
      houseworkApronGuard = joinTags(filteredApronUc, dressedGuard, barefootBan);
    }
    const poolSwimGuard = tpl.is_pool_scene && useSceneOutfit ? POOL_SWIM_UC : "";
    const bathroomTowelGuard = tpl.is_bathroom_scene && useSceneOutfit ? BATHROOM_TOWEL_UC : "";
    const bathroomToyPartnerBan = tpl.is_bathroom_scene
      ? genderMode === "femboy"
        ? "2boys, hetero"
        : genderMode === "normal"
          ? "2boys, hetero, man, real penis"
          : "2boys, hetero, man"
      : "";
    const poolSwimExtraNeg =
      tpl.is_pool_scene && useSceneOutfit && tpl.swimsuit_style
        ? POOL_SWIMWEAR_SPECS[tpl.swimsuit_style].extra_neg
        : "";
    const specimenOutfitGuard =
      tpl.is_specimen_scene && useSceneOutfit ? tpl.specimen_outfit_neg || "" : "";
    const poolLightNeg =
      tpl.is_pool_scene && !transBg && !isExplicitDedicatedLight && poolLightSpec
        ? poolLightSpec.neg
        : "";
    const campingLightNeg =
      tpl.is_camping_scene && !transBg && !isExplicitDedicatedLight && campingLightSpec
        ? campingLightSpec.neg
        : "";
    const campingBarefootBan =
      tpl.is_camping_scene && useSceneOutfit && tpl.barefoot ? CAMPING_BAREFOOT_BAN_UC : "";
    const aftersexDripPartnerBan =
      tpl.is_aftersex_drip_scene || (tpl.is_onsen_scene && !tpl.is_onsen_duo)
        ? genderMode === "femboy"
          ? "1girl, 2girls, multiple girls, female, breasts, pussy, vaginal, futanari, 2boys, multiple boys, hetero, penetration, insertion"
          : genderMode === "normal"
            ? "1boy, 2boys, multiple boys, male, man, penis, erection, testicles, hetero, penetration, insertion, 2girls, multiple girls, futanari, otoko no ko"
            : genderMode === "futa_with_balls"
              ? "1boy, 2boys, multiple boys, male, man, hetero, penetration, insertion, 2girls, multiple girls, otoko no ko, huge penis, large penis"
              : "1boy, 2boys, multiple boys, male, man, hetero, penetration, insertion, 2girls, multiple girls, otoko no ko, testicles, balls, scrotum, huge penis, large penis"
        : "";
    const aftersexDripDressedGuard =
      tpl.is_aftersex_drip_scene && useSceneOutfit
        ? AFTERSEX_DRIP_DRESSED_CHEST_UC
        : tpl.is_onsen_scene && !tpl.is_onsen_duo && useSceneOutfit
          ? joinTags(
              tpl.chest_covered ? "nipples, areolae, bare breasts" : "",
              ONSEN_UNDERGARMENT_UC
            )
          : "";
    const aftersexDripStreamGuard =
      (tpl.is_aftersex_drip_scene || tpl.is_onsen_scene) && tpl.light_thigh_only
        ? AFTERSEX_DRIP_LIGHT_STREAM_UC
        : "";
    const aftersexDripLightNeg =
      tpl.is_aftersex_drip_scene && !transBg && aftersexDripLightSpec
        ? aftersexDripLightSpec.neg
        : "";
    const onsenLightNeg =
      tpl.is_onsen_scene && !transBg && onsenLightSpec ? onsenLightSpec.neg : "";
    const onsenBarefootBan =
      tpl.is_onsen_scene && useSceneOutfit && (tpl.barefoot || tpl.is_foot_focus)
        ? ONSEN_BAREFOOT_BAN_UC
        : "";
    const aftersexDripBarefootBan =
      tpl.is_aftersex_drip_scene && useSceneOutfit && tpl.barefoot ? CAMPING_BAREFOOT_BAN_UC : "";
    const sceneFootGuard =
      (tpl.is_kitchen_scene ||
        tpl.is_pool_scene ||
        tpl.is_specimen_scene ||
        tpl.is_bathroom_scene ||
        tpl.is_housework_scene ||
        tpl.is_camping_scene ||
        tpl.is_aftersex_drip_scene ||
        tpl.is_onsen_scene) &&
      (tpl.is_foot_focus || tpl.barefoot)
        ? FOOT_ANAT_UC
        : "";
    const kitchenBareFootSockBan =
      tpl.is_kitchen_scene && useSceneOutfit && tpl.footwear_mode === "bare_feet"
        ? "thighhighs, stockings, socks, legwear, pantyhose"
        : "";
    const sceneLandscapeGuard =
      (tpl.is_kitchen_scene ||
        tpl.is_pool_scene ||
        tpl.is_specimen_scene ||
        tpl.is_housework_scene ||
        tpl.is_aftersex_drip_scene ||
        tpl.is_onsen_scene) &&
      tpl.canvas.includes("1216x832")
        ? KITCHEN_LANDSCAPE_ANTI_LETTERBOX_UC
        : "";

    if (tpl.is_kitchen_duo && tpl.kitchen_duo) {
      results.push(
        compileKitchenDuoScenePrompt({
          tpl: { ...tpl, env_tags: effectiveEnvTags },
          duo: tpl.kitchen_duo,
          cfg,
          m,
          headUsed,
          charCoreUsed,
          charHasFlatChest,
          genderMode,
          genderBadge,
          useSceneOutfit,
          outfitTagsFromLeft: useSceneOutfit ? "" : outfitTags,
          transBg,
          transNeg,
          sfSceneLightTags,
          isExplicitDedicatedLight,
          apronOnlyGuard,
          kitchenFootGuard: sceneFootGuard,
          kitchenBareFootSockBan,
          kitchenLandscapeGuard: sceneLandscapeGuard,
          baseTailNeg,
          negOn,
        })
      );
    } else if (tpl.is_pool_duo && tpl.pool_duo) {
      results.push(
        compilePoolDuoScenePrompt({
          tpl: { ...tpl, env_tags: effectiveEnvTags },
          duo: tpl.pool_duo,
          cfg,
          m,
          headUsed,
          charCoreUsed,
          charHasFlatChest,
          genderMode,
          genderBadge,
          useSceneOutfit,
          outfitTagsFromLeft: useSceneOutfit ? "" : outfitTags,
          transBg,
          transNeg,
          sfSceneLightTags,
          isExplicitDedicatedLight,
          poolSwimGuard,
          poolSwimExtraNeg,
          poolLightNeg,
          footGuard: sceneFootGuard,
          landscapeGuard: sceneLandscapeGuard,
          baseTailNeg,
          negOn,
        })
      );
    } else if (tpl.is_specimen_duo && tpl.specimen_duo) {
      results.push(
        compileSpecimenDuoScenePrompt({
          tpl: {
            ...tpl,
            env_tags: effectiveEnvTags,
            core_prop_tags: effectiveCorePropTags,
            framing_tags: effectiveFramingTags,
          },
          duo: tpl.specimen_duo,
          cfg,
          m,
          headUsed,
          charCoreUsed,
          charHasFlatChest,
          genderMode,
          genderBadge,
          useSceneOutfit,
          outfitTagsFromLeft: useSceneOutfit ? "" : outfitTags,
          transBg,
          transNeg,
          sfSceneLightTags,
          isExplicitDedicatedLight,
          specimenOutfitGuard,
          footGuard: sceneFootGuard,
          landscapeGuard: sceneLandscapeGuard,
          baseTailNeg,
          negOn,
        })
      );
    } else if (tpl.is_housework_duo && tpl.housework_duo) {
      results.push(
        compileHouseworkDuoScenePrompt({
          tpl: {
            ...tpl,
            env_tags: effectiveEnvTags,
            core_prop_tags: effectiveCorePropTags,
            framing_tags: effectiveFramingTags,
          },
          duo: tpl.housework_duo,
          cfg,
          m,
          headUsed,
          charCoreUsed,
          charHasFlatChest,
          genderMode,
          genderBadge,
          useSceneOutfit,
          outfitTagsFromLeft: useSceneOutfit ? "" : outfitTags,
          transBg,
          transNeg,
          sfSceneLightTags,
          isExplicitDedicatedLight,
          houseworkApronGuard,
          footGuard: sceneFootGuard,
          landscapeGuard: sceneLandscapeGuard,
          baseTailNeg,
          negOn,
        })
      );
    } else if (tpl.is_photo_substitute_scene) {
      results.push(
        compilePhotoSubstituteScenePrompt({
          tpl: {
            ...tpl,
            env_tags: effectiveEnvTags,
            core_prop_tags: effectiveCorePropTags,
            framing_tags: effectiveFramingTags,
          },
          cfg,
          m,
          headUsed,
          charCoreUsed,
          charHasFlatChest,
          genderMode,
          genderBadge,
          useSceneOutfit,
          outfitTagsFromLeft: useSceneOutfit ? "" : outfitTags,
          transBg,
          transNeg,
          sfSceneLightTags,
          isExplicitDedicatedLight,
          baseTailNeg,
          negOn,
        })
      );
    } else if (tpl.is_camping_duo && tpl.camping_duo) {
      results.push(
        compileCampingDuoScenePrompt({
          tpl: {
            ...tpl,
            env_tags: effectiveEnvTags,
            core_prop_tags: effectiveCorePropTags,
            framing_tags: effectiveFramingTags,
          },
          duo: tpl.camping_duo,
          cfg,
          m,
          headUsed,
          charCoreUsed,
          charHasFlatChest,
          genderMode,
          genderBadge,
          useSceneOutfit,
          outfitTagsFromLeft: useSceneOutfit ? "" : outfitTags,
          transBg,
          transNeg,
          sfSceneLightTags,
          isExplicitDedicatedLight,
          campingLightNeg,
          campingBarefootBan,
          footGuard: sceneFootGuard,
          landscapeGuard: sceneLandscapeGuard,
          baseTailNeg,
          negOn,
        })
      );
    } else if (tpl.is_onsen_duo) {
      results.push(
        compileOnsenDuoScenePrompt({
          tpl: {
            ...tpl,
            env_tags: effectiveEnvTags,
            core_prop_tags: effectiveCorePropTags,
            framing_tags: effectiveFramingTags,
          },
          cfg,
          m,
          headUsed,
          charCoreUsed,
          charHasFlatChest,
          genderMode,
          genderBadge,
          useSceneOutfit,
          outfitTagsFromLeft: useSceneOutfit ? "" : outfitTags,
          transBg,
          transNeg,
          sfSceneLightTags,
          isExplicitDedicatedLight,
          onsenLightNeg,
          onsenBarefootBan,
          footGuard: sceneFootGuard,
          landscapeGuard: sceneLandscapeGuard,
          baseTailNeg,
          negOn,
        })
      );
    } else {
      let soloCondomTags = "";
      let soloCondomBadge = "";
      let soloXrayTags = "";
      let soloXrayProse = "";
      let soloXrayBadge = tpl.builtin_xray ? " · [🔬内置透视]" : "";
      let effectiveXrayNeg = xrayNeg;
      if (
        tpl.is_kitchen_scene ||
        tpl.is_pool_scene ||
        tpl.is_specimen_scene ||
        tpl.is_bathroom_scene ||
        tpl.is_aftersex_drip_scene ||
        tpl.is_onsen_scene
      ) {
        if (cfg.enable_condom) {
          soloCondomTags = tpl.is_precoital_invite
            ? "1.5::condom packet::, 1.45::holding condom::, foil condom wrapper"
            : "1.55::used condom::, 1.45::cum in condom::";
          soloCondomBadge = " · [🛡️安全套]";
        }
        if (cfg.enable_uterus_xray && !tpl.builtin_xray) {
          soloXrayBadge = " · [🔬内部透视]";
          if (genderMode === "femboy") {
            soloXrayTags = tpl.is_precoital_invite
              ? "1.45::x-ray::, 1.4::cross-section::, 1.5::intestines::, anal canal"
              : "1.45::x-ray::, 1.4::cross-section::, 1.5::intestines::, 1.5::cum in ass::, internal cumshot";
            soloXrayProse = tpl.is_precoital_invite
              ? " accompanied by an anatomical x-ray cross-section of his internal canal."
              : " accompanied by an anatomical x-ray cross-section of his cum-filled intestines.";
            effectiveXrayNeg =
              "fetus, baby, embryo, skeleton, bones, skull, ribcage, medical diagram, gore, uterus, cervix, womb";
          } else {
            soloXrayTags = tpl.is_precoital_invite
              ? "1.45::x-ray::, 1.4::cross-section::, 1.45::uterus::, cervix"
              : "1.45::x-ray::, 1.4::cross-section::, 1.45::uterus::, cervix, 1.45::cum in uterus::";
            soloXrayProse = " accompanied by a centered x-ray cross-section revealing her uterus.";
            effectiveXrayNeg =
              "fetus, baby, embryo, skeleton, bones, skull, ribcage, medical diagram, gore";
          }
        }
      }

      if (tpl.is_pool_scene && useSceneOutfit && !/\bbare feet\b/i.test(actorTags)) {
        actorTags = `${actorTags}, bare feet`;
      }
      const soloSceneExprTags =
        tpl.is_pool_scene && tpl.pool_expr_tags
          ? exprIf(cfg, tpl.pool_expr_tags, "", tpl.id)
          : tpl.is_specimen_scene && tpl.specimen_expr_tags
            ? exprIf(cfg, tpl.specimen_expr_tags, "", tpl.id)
            : tpl.is_bathroom_scene && tpl.bathroom_expr_tags
              ? exprIf(cfg, tpl.bathroom_expr_tags, "", tpl.id)
              : tpl.is_aftersex_drip_scene && tpl.aftersex_drip_expr_tags
                ? tpl.no_face_pov
                  ? tpl.aftersex_drip_expr_tags
                  : exprIf(cfg, tpl.aftersex_drip_expr_tags, "", tpl.id)
                : tpl.is_onsen_scene && tpl.onsen_expr_tags
                  ? exprIf(
                      cfg,
                      genderMode === "femboy"
                        ? tpl.onsen_expr_tags
                            .replace(/\bshe\b/gi, "he")
                            .replace(/\bhers\b/gi, "his")
                            .replace(/\bher\b/gi, "his")
                        : tpl.onsen_expr_tags,
                      "",
                      tpl.id
                    )
                  : "";

      let fullNeg = joinTags(
        camUc,
        poolLightNeg,
        aftersexDripLightNeg,
        onsenLightNeg,
        poolSwimExtraNeg,
        specimenOutfitGuard,
        aftersexDripDressedGuard,
        aftersexDripStreamGuard,
        aftersexDripBarefootBan,
        onsenBarefootBan,
        soloSpreadActive ? ONSEN_SOLO_SPREAD_EXTRA_UC : "",
        sceneFootGuard,
        kitchenBareFootSockBan,
        tpl.extra_neg || "",
        genderNeg,
        bathroomToyPartnerBan,
        aftersexDripPartnerBan,
        apronOnlyGuard,
        poolSwimGuard,
        bathroomTowelGuard,
        sceneLandscapeGuard,
        transNeg,
        tpl.allow_speculum || (soloSpreadActive && genderMode === "femboy")
          ? "censor, mosaic censoring, bar censor"
          : "gaping, censor, mosaic censoring, bar censor",
        effectiveXrayNeg,
        baseTailNeg
      );
      if (tpl.allow_speculum || (soloSpreadActive && genderMode === "femboy")) {
        fullNeg = fullNeg
          .split(",")
          .map((s) => s.trim())
          .filter((s) => Boolean(s) && s.toLowerCase() !== "gaping")
          .join(", ");
      }
      if (
        tpl.is_kitchen_scene ||
        tpl.is_pool_scene ||
        tpl.is_specimen_scene ||
        tpl.is_bathroom_scene ||
        tpl.is_aftersex_drip_scene ||
        tpl.is_onsen_scene
      ) {
        const dedupSoloNeg = deduplicateCommaTags(fullNeg);
        if (encodeT5Len(dedupSoloNeg) > 435) {
          const parts = dedupSoloNeg.split(",").map((s) => s.trim()).filter(Boolean);
          while (parts.length > 20 && encodeT5Len(parts.join(", ")) > 435) {
            parts.pop();
          }
          fullNeg = parts.join(", ");
        } else {
          fullNeg = dedupSoloNeg;
        }
      }

      const sfLightProseTail = !transBg && useSfDedicatedLight && tpl.light_prose ? ` ${tpl.light_prose}` : "";
      const baseSoloProse = soloXrayProse
        ? `${genderProse.replace(/\.+\s*$/, "")},${soloXrayProse}`
        : genderProse;
      const proseBody = cfg.enable_t5_prose
        ? baseSoloProse.includes("{name}")
          ? `${baseSoloProse.replace(/\{name\}/g, m.name)}${sfLightProseTail}${transBg ? " Isolated on a transparent background." : ""}`
          : /^(?:High-angle|Low-angle|Steep low-angle|Low cushion-level|Ground-level|First-person|Overhead|Frontal low-angle|Low eye-level|Low frontal|Low rear-side)\b/i.test(
              baseSoloProse
            )
            ? `${baseSoloProse.replace(/\b(as|where) (?:she|he)\b/i, `$1 ${m.name}`)}${sfLightProseTail}${transBg ? " Isolated on a transparent background." : ""}`
            : `${m.name} ${baseSoloProse}${sfLightProseTail}${transBg ? " Isolated on a transparent background." : ""}`
        : "";
      const camBadge = tpl.is_onsen_scene
        ? "♨️温泉单人"
        : tpl.is_aftersex_drip_scene
          ? "💧事后滑落"
        : tpl.is_bathroom_scene
          ? "🛁浴室玩具"
          : tpl.is_specimen_scene
            ? "🧪储精自注"
            : tpl.is_pool_scene
              ? "🏊泳池单人"
              : tpl.is_kitchen_scene
                ? tpl.camera_mode === "mirror"
                  ? "🪞厨房对镜"
                  : tpl.category.startsWith("11.")
                    ? "🍱饭菜单人"
                    : "🍳裸围单人"
                : tpl.camera_mode === "mirror"
                  ? "🪞对镜"
                  : tpl.camera_mode === "direct"
                    ? "📷直拍"
                    : "📱界面";
      const sfLightBadge = transBg
        ? " · [🏁透明底]"
        : isExplicitDedicatedLight
          ? ""
          : ` · [${tpl.light_badge}]`;

      // V5 Golden Positional Order: First-slot camera/mirror/UI framing right after actorTags!
      const pOther = joinTags(
        headUsed,
        actorTags,
        effectiveFramingTags,
        charCoreUsed,
        envAndPropsUsed,
        outfitTags,
        soloSceneExprTags,
        "rating:explicit, nsfw, uncensored",
        soloCondomTags,
        soloXrayTags,
        genderActionTags,
        proseBody,
        wrapTailNeg(m, fullNeg, negOn)
      );
      const soloSpreadBadge = soloSpreadActive ? " · [🫶掰开差分]" : "";
      results.push({
        subTitle: `【${tpl.id} · ${tpl.title} · ${camBadge}${sfLightBadge}${genderBadge}${soloSpreadBadge}${soloCondomBadge}${soloXrayBadge}】`,
        canvas: tpl.canvas,
        prompt: pOther,
      });
    }
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
        const curLightEntry = resolveLightingPresetEntry(cfg.lighting_preset);
        headUsed = scenePreset.unblock_dark
          ? m.head_pos.replace(/,\s*warm lighting\b/gi, "")
          : m.head_pos;
        const headSet = new Set(
          headUsed
            .split(",")
            .map((t) => t.trim().replace(/^\d+(?:\.\d+)?::([\s\S]+?)::$/, "$1").trim().toLowerCase())
            .filter(Boolean)
        );
        for (const sb of curLightEntry.strip_bg_tags ?? []) {
          headSet.add(sb.toLowerCase());
        }
        const adaptedScene = adaptSceneStageForLightAxis(
          scenePreset.code,
          scenePreset.tags,
          scenePreset.prose,
          scenePreset.extra_neg || "",
          curLightEntry.light_axis
        );
        let rawSceneTags = adaptedScene.tags;
        if (
          is25dCelLightingCode(curLightEntry.code) &&
          scenePreset.code === "sunlit_rug_floor_window" &&
          (curLightEntry.light_axis ?? "auto") === "auto"
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
        bgProse = (curLightEntry.strip_bg_tags ?? []).includes("bright sky")
          ? adaptedScene.prose.replace(/\bbright pink sky\b/gi, "pink sky")
          : adaptedScene.prose;
        if (scenePreset.unblock_dark && tailNegUsed) {
          tailNegUsed = tailNegUsed
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t && !["dark", "harsh shadows", "high contrast"].includes(t.toLowerCase()))
            .join(", ");
        }
        if (adaptedScene.extraNeg) {
          tailNegUsed = joinTags(tailNegUsed, adaptedScene.extraNeg);
        }
      } else {
        bgUsed = m.bg_couch;
        bgProse = m.loc_prose;
      }
    }

    const freeHasInherentNsfwOutfit = /\b(nude|reverse bunnysuit|pasties|nipples|micro bikini)\b/i.test(
      freeOutfit
    );
    if (!cfg.enable_uterus_xray && !/\b(x-ray|cross-section|uterus)\b/i.test(rawFreeTags)) {
      tailNegUsed = joinTags(tailNegUsed, "x-ray, cross-section, cutaway, uterus");
    }
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
  const isOtherActionScene = sceneId in OTHER_ACTION_TEMPLATES;
  const isKitchenActionScene =
    isOtherActionScene && Boolean(OTHER_ACTION_TEMPLATES[sceneId].is_kitchen_scene);
  const isKitchenDuoScene =
    isOtherActionScene && Boolean(OTHER_ACTION_TEMPLATES[sceneId].is_kitchen_duo);
  const isPoolActionScene =
    isOtherActionScene && Boolean(OTHER_ACTION_TEMPLATES[sceneId].is_pool_scene);
  const isPoolDuoScene =
    isOtherActionScene && Boolean(OTHER_ACTION_TEMPLATES[sceneId].is_pool_duo);
  const isSpecimenActionScene =
    isOtherActionScene && Boolean(OTHER_ACTION_TEMPLATES[sceneId].is_specimen_scene);
  const isSpecimenDuoScene =
    isOtherActionScene && Boolean(OTHER_ACTION_TEMPLATES[sceneId].is_specimen_duo);
  const isBathroomActionScene =
    isOtherActionScene && Boolean(OTHER_ACTION_TEMPLATES[sceneId].is_bathroom_scene);
  const isHouseworkActionScene =
    isOtherActionScene && Boolean(OTHER_ACTION_TEMPLATES[sceneId].is_housework_scene);
  const isHouseworkDuoScene =
    isOtherActionScene && Boolean(OTHER_ACTION_TEMPLATES[sceneId].is_housework_duo);
  const isPhotoSubstituteScene =
    isOtherActionScene && Boolean(OTHER_ACTION_TEMPLATES[sceneId].is_photo_substitute_scene);
  const isCampingActionScene =
    isOtherActionScene && Boolean(OTHER_ACTION_TEMPLATES[sceneId].is_camping_scene);
  const isCampingDuoScene =
    isOtherActionScene && Boolean(OTHER_ACTION_TEMPLATES[sceneId].is_camping_duo);
  const isAftersexDripActionScene =
    isOtherActionScene && Boolean(OTHER_ACTION_TEMPLATES[sceneId].is_aftersex_drip_scene);
  const isOnsenActionScene =
    isOtherActionScene && Boolean(OTHER_ACTION_TEMPLATES[sceneId].is_onsen_scene);
  const isOnsenDuoScene =
    isOtherActionScene && Boolean(OTHER_ACTION_TEMPLATES[sceneId].is_onsen_duo);
  const suppressPovFacePost =
    (isPosPovLocked &&
      (ALL_POSITIONS_TEMPLATES[sceneId].pov_visibility === "rear_no_face" ||
        ALL_POSITIONS_TEMPLATES[sceneId].pov_visibility === "top_down_over_shoulder" ||
        ALL_POSITIONS_TEMPLATES[sceneId].pov_visibility === "ventral_no_eyes")) ||
    (isOtherActionScene &&
      Boolean(
        OTHER_ACTION_TEMPLATES[sceneId].no_face_pov ||
          OTHER_ACTION_TEMPLATES[sceneId].is_photo_substitute_scene
      ));

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
    const activeLightTags = resolveLightingPresetEntry(cfg.lighting_preset).tags;
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

  // Post-pass 4: Optional Uterus Cross-Section / X-Ray Pass (Kitchen & Pool scenes compile calibrated gender-aware X-Ray directly)
  const activeGenderMode: CharacterGenderMode = cfg.gender_mode ?? "normal";
  const isCreatureSceneId = sceneId.startsWith("TN") || sceneId.startsWith("BG");
  if (
    cfg.enable_uterus_xray &&
    !isKitchenActionScene &&
    !isPoolActionScene &&
    !isSpecimenActionScene &&
    !isBathroomActionScene &&
    !isHouseworkActionScene &&
    !isPhotoSubstituteScene &&
    !isCampingActionScene &&
    !isAftersexDripActionScene &&
    !isOnsenActionScene &&
    (activeGenderMode !== "femboy" || isCreatureSceneId)
  ) {
    const xraySpec = resolveUterusXraySpec(sceneId, cfg, isPov);
    if (xraySpec) {
      const xrayNegGuard = isCreatureSceneId
        ? activeGenderMode === "femboy"
          ? "fetus, baby, embryo, umbilical cord, skeleton, bones, skull, ribcage, medical diagram, gore, uterus, cervix, womb"
          : "fetus, baby, embryo, umbilical cord, skeleton, bones, skull, ribcage, medical diagram, gore"
        : "skeleton, bones, skull, ribcage, gore";
      results = results.map((item) => {
        if (item.prompt.startsWith("[Base Prompt]")) return item;
        return {
          ...item,
          subTitle: `${item.subTitle} · [🔬内部透视]`,
          prompt: injectAuxFeatureIntoPrompt(
            item.prompt,
            xraySpec.tags,
            cfg.enable_t5_prose ? xraySpec.prose : "",
            xrayNegGuard,
            negOn
          ),
        };
      });
    }
  }

  // Post-pass 4.1: Character Gender Mode Transform (Femboy / Futanari No-Balls / Futanari With-Balls)
  // Note: OTHER_ACTION_TEMPLATES (SF01..SF30) already perform tailored 3-way gender routing directly during scene assembly.
  if (activeGenderMode !== "normal" && !isOtherActionScene) {
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

  // Post-pass 4.15: Pixiv Genital-Only Censor (thicker white/black bars or localized square mosaic strictly on genitals, leaving breasts/nipples uncensored)
  const pixivBarMode: PixivBarCensorMode = cfg.pixiv_bar_censor ?? "off";
  if (pixivBarMode === "white" || pixivBarMode === "black" || pixivBarMode === "mosaic") {
    const barBadge =
      pixivBarMode === "white"
        ? "⬜Pixiv白条"
        : pixivBarMode === "black"
          ? "⬛Pixiv黑条"
          : "🔲Pixiv马赛克";
    results = results.map((item) => {
      const next = applyPixivBarCensorTransform(item.prompt, pixivBarMode, {
        enableNegatives: negOn,
        enableProse: cfg.enable_t5_prose,
      });
      if (next === item.prompt) return item;
      return {
        ...item,
        subTitle: `${item.subTitle} · [${barBadge}]`,
        prompt: next,
      };
    });
  }

  // Post-pass 4.2: Deduplicate repeated single-tag tokens in positive prefix (including Multi-Box [Base Prompt])
  results = results.map((item) => ({
    ...item,
    prompt: deduplicatePositiveTagPrefix(item.prompt),
  }));

  // Reserve ~24 server-side T5 tokens on 2-person partitioned scenes (`[Character 1/2]`) when no Vibe limit is active
  // so 25~30 `w::...::` weight blocks + multi-character partitions NEVER clip lighting prose at NovelAI's 512 wall.
  const rawLimit = cfg.pos_token_limit ?? 502;
  const isSoloOrCreatureScene =
    isCreatureSceneId ||
    isOtherActionScene ||
    sceneId in MULTI_ANGLE_TEMPLATES ||
    sceneId === "FREE" ||
    POS_MALE_MODE_PRESETS[cfg.pos_male_mode] === "off" ||
    POS_MALE_MODE_PRESETS[cfg.pos_male_mode] === "invisible";
  const maxPosBudget = isSoloOrCreatureScene
    ? Math.max(280, Math.min(504, rawLimit))
    : Math.max(280, Math.min(rawLimit >= 490 ? 486 : rawLimit, 504));

  // Post-pass 4.5: Global Lighting Prose & Badge pass (preserves activeLight.prose 100% intact even when trimming scene prose)
  const activeLight = resolveLightingPresetEntry(cfg.lighting_preset);
  const activeEnv =
    ENV_PRESETS[cfg.env_preset] ?? ENV_PRESETS["🔄 随本幕/体位工具栏默认环境"];
  const isPosTransBg =
    (sceneId in ALL_POSITIONS_TEMPLATES || isOtherActionScene || sceneId === "FREE") &&
    Boolean(cfg.pos_transparent_bg);
  if (activeLight.code !== "auto" && !isPosTransBg && sceneId !== "MA0") {
    const is25dCel = is25dCelLightingCode(activeLight.code);
    results = results.map((item) => {
      let nextPrompt = item.prompt;
      let hasActualClothesForLight = false;
      let hasTankTopForLight = false;
      const isLockedDarkEnv = Boolean(ALL_POSITIONS_TEMPLATES[sceneId]?.lock_scene_env);
      const isExplicitNonSunlitPreset =
        isExplicitDedicatedSceneLightingCode(activeLight.code) &&
        activeLight.code !== "kitchen_sunlit_pendant" &&
        activeLight.code !== "pool_sunlit_caustics" &&
        activeLight.code !== "pool_split_waterline" &&
        activeLight.code !== "housework_sunlit_living" &&
        activeLight.code !== "housework_sunny_balcony" &&
        activeLight.code !== "housework_warm_bedroom" &&
        activeLight.code !== "camping_dappled_meadow" &&
        activeLight.code !== "camping_golden_lakeside";
      const isNonDaylightScene =
        isLockedDarkEnv ||
        isExplicitNonSunlitPreset ||
        (isOtherActionScene &&
          !isKitchenActionScene &&
          !isPoolActionScene &&
          !isSpecimenActionScene &&
          !isBathroomActionScene &&
          !isHouseworkActionScene &&
          !isPhotoSubstituteScene &&
          !isCampingActionScene &&
          !isAftersexDripActionScene &&
          !isOnsenActionScene &&
          OTHER_ACTION_TEMPLATES[sceneId].lighting_mode !== "sunlit_indoor") ||
        (isOtherActionScene &&
          !isExplicitDedicatedSceneLightingCode(activeLight.code) &&
          (OTHER_ACTION_TEMPLATES[sceneId].lighting_mode !== "sunlit_indoor" ||
            Boolean(OTHER_ACTION_TEMPLATES[sceneId].is_nocturnal_fridge) ||
            Boolean(OTHER_ACTION_TEMPLATES[sceneId].is_bathroom_scene) ||
            (Boolean(OTHER_ACTION_TEMPLATES[sceneId].onsen_light_mode) &&
              OTHER_ACTION_TEMPLATES[sceneId].onsen_light_mode !== "misty_bamboo_rotenburo") ||
            (Boolean(OTHER_ACTION_TEMPLATES[sceneId].camping_light_mode) &&
              (OTHER_ACTION_TEMPLATES[sceneId].camping_light_mode === "lantern_glowing_tent" ||
                OTHER_ACTION_TEMPLATES[sceneId].camping_light_mode === "warm_campfire_ember" ||
                OTHER_ACTION_TEMPLATES[sceneId].camping_light_mode === "starry_milkyway_night")) ||
            (Boolean(OTHER_ACTION_TEMPLATES[sceneId].housework_light_mode) &&
              (OTHER_ACTION_TEMPLATES[sceneId].housework_light_mode === "hallway_wood_sheen" ||
                OTHER_ACTION_TEMPLATES[sceneId].housework_light_mode === "closet_dim_warm")) ||
            (Boolean(OTHER_ACTION_TEMPLATES[sceneId].kitchen_light_mode) &&
              OTHER_ACTION_TEMPLATES[sceneId].kitchen_light_mode !== "sunlit_or_pendant") ||
            (Boolean(OTHER_ACTION_TEMPLATES[sceneId].pool_light_mode) &&
              OTHER_ACTION_TEMPLATES[sceneId].pool_light_mode !== "sunlit_caustics" &&
              OTHER_ACTION_TEMPLATES[sceneId].pool_light_mode !== "split_waterline"))) ||
        (cfg.enable_background && Boolean(activeEnv?.unblock_dark)) ||
        ((sceneId in ALL_POSITIONS_TEMPLATES || sceneId === "FREE") &&
          cfg.enable_background &&
          Boolean(POS_SCENE_PRESETS[cfg.pos_scene]?.unblock_dark));
      if (is25dCel && !nextPrompt.startsWith("[Base Prompt]")) {
        // Strip unwanted sweat/splash in non-fluid scenes (unless user explicitly enabled extra sweat or scene is steamy/wet) and add 'shiny clothes' only when clothed
        const negBlocks0: string[] = [];
        let posPart = nextPrompt
          .replace(/(?:,\s*)?(-(?:[1-9]\d*(?:\.\d+)?)::[\s\S]*?::)/g, (_m, block: string) => {
            negBlocks0.push(block.trim());
            return "";
          })
          .replace(/^[ ,]+|[ ,]+$/g, "");
        const negSuffix = negBlocks0.length > 0 ? `, ${negBlocks0.join(", ")}` : "";
        const sceneHasSteamyWet =
          isKitchenActionScene ||
          isPoolActionScene ||
          isBathroomActionScene ||
          /\b(steamy|shower|onsen|steam|wet skin|water droplets)\b/i.test(posPart);
        posPart = posPart
          .split(", ")
          .filter((tok) => {
            const bare = tok.trim().replace(/^\d+(?:\.\d+)?::([\s\S]+?)::$/, "$1").trim().toLowerCase();
            if (
              !cfg.add_extra_sweat &&
              !sceneHasSteamyWet &&
              (bare === "sweat" || bare === "flying sweatdrops" || bare === "sweatdrop")
            ) {
              return false;
            }
            return Boolean(bare);
          })
          .join(", ");
        hasActualClothesForLight =
          !isKitchenActionScene &&
          !isPoolActionScene &&
          !isSpecimenActionScene &&
          !isBathroomActionScene &&
          !isHouseworkActionScene &&
          !isCampingActionScene &&
          !isAftersexDripActionScene &&
          !isOnsenActionScene &&
          (cfg.enable_outfit || (isOtherActionScene && cfg.other_use_scene_outfit !== false)) &&
          !/\bcompletely nude\b/i.test(posPart) &&
          /\b(shirt|t-shirt|tank top|skirt|dress|leotard|bikini|swimsuit|serafuku|camisole|nightgown|cardigan|shorts|briefs|bra|clothed|coat|jacket|hoodie|blouse|sweater|apron|bunnysuit|pantyhose)\b/i.test(
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
      } else if (isNonDaylightScene) {
        // Strip outdoor sun/daylight tags injected by non-2.5D lighting presets (Contre-Jour / Front-Lit / Window Sidelight) on enclosed/night/flash scenes
        const stripSunSet = new Set([
          "sunlight",
          "bright summer sunlight",
          "bright breezy summer balcony sunlight",
          "dappled sunlight",
          "morning sunlight",
          "afternoon sunlight",
          "sun glare",
          "light rays",
          "daylight",
          "clear blue sky",
          "bright sky",
        ]);
        if (nextPrompt.startsWith("[Base Prompt]")) {
          const sections = nextPrompt.split(/\n\n+/);
          nextPrompt = sections
            .map((sec, idx) => {
              if (idx !== 0 || !sec.startsWith("[Base Prompt]\n")) return sec;
              const body = sec.slice("[Base Prompt]\n".length);
              const negBlocksSun: string[] = [];
              let posSun = body
                .replace(/(?:,\s*)?(-(?:[1-9]\d*(?:\.\d+)?)::[\s\S]*?::)/g, (_m, block: string) => {
                  negBlocksSun.push(block.trim());
                  return "";
                })
                .replace(/^[ ,]+|[ ,]+$/g, "");
              const negSunSuffix = negBlocksSun.length > 0 ? `, ${negBlocksSun.join(", ")}` : "";
              posSun = splitTopLevelCommaSegments(posSun)
                .filter((tok) => {
                  const bare = tok.replace(/^-?\d+(?:\.\d+)?::([\s\S]+?)::$/, "$1").trim().toLowerCase();
                  return Boolean(bare) && !stripSunSet.has(bare);
                })
                .join(", ");
              return `[Base Prompt]\n${posSun}${negSunSuffix}`;
            })
            .join("\n\n");
        } else {
          const negBlocksSun: string[] = [];
          let posSun = nextPrompt
            .replace(/(?:,\s*)?(-(?:[1-9]\d*(?:\.\d+)?)::[\s\S]*?::)/g, (_m, block: string) => {
              negBlocksSun.push(block.trim());
              return "";
            })
            .replace(/^[ ,]+|[ ,]+$/g, "");
          const negSunSuffix = negBlocksSun.length > 0 ? `, ${negBlocksSun.join(", ")}` : "";
          posSun = splitTopLevelCommaSegments(posSun)
            .filter((tok) => {
              const bare = tok.replace(/^-?\d+(?:\.\d+)?::([\s\S]+?)::$/, "$1").trim().toLowerCase();
              return Boolean(bare) && !stripSunSet.has(bare);
            })
            .join(", ");
          nextPrompt = `${posSun}${negSunSuffix}`;
        }
      }
      const skipDaylightProse =
        ((isKitchenDuoScene ||
          isPoolDuoScene ||
          isSpecimenDuoScene ||
          isHouseworkDuoScene ||
          isCampingDuoScene ||
          isOnsenDuoScene) &&
          !isExplicitDedicatedSceneLightingCode(activeLight.code)) ||
        (isLockedDarkEnv &&
          (activeLight.code === "window_golden_rim" || activeLight.code === "front_luminous_wet"));
      const isNocturnalNoBacklight =
        isOtherActionScene &&
        !isExplicitDedicatedSceneLightingCode(activeLight.code) &&
        (Boolean(OTHER_ACTION_TEMPLATES[sceneId].is_nocturnal_fridge) ||
          OTHER_ACTION_TEMPLATES[sceneId].pool_light_mode === "night_pool_glow" ||
          OTHER_ACTION_TEMPLATES[sceneId].camping_light_mode === "warm_campfire_ember");
      let resolvedCw = activeLight.inline_counterweight || "";
      if (isNonDaylightScene && resolvedCw) {
        resolvedCw = resolvedCw
          .replace(/\bsun glare,\s*/gi, "")
          .replace(/\bshade,\s*dark,\s*dim lighting,\s*/gi, "")
          .replace(/,\s*harsh shadows/gi, "");
      }
      if (isNocturnalNoBacklight && resolvedCw) {
        resolvedCw = resolvedCw.replace(/\bbacklighting,\s*/gi, "");
      }
      const cwSuffix =
        resolvedCw && !skipDaylightProse && sceneId !== "MA7E"
          ? `, ${resolvedCw}`
          : "";
      if (
        cfg.enable_t5_prose &&
        activeLight.prose &&
        !skipDaylightProse &&
        sceneId !== "MA7E" &&
        !nextPrompt.startsWith("[Base Prompt]")
      ) {
        let resolvedLightProse = activeLight.prose;
        if (isOtherActionScene && (is25dCel || activeLight.code === "m2_razor_fine_cel")) {
          // SF01~SF30 already inject their exact scene-dedicated light_prose (flash / night skyline / neon ring-light / warm spot / steam);
          // pair with a concise, conflict-free 2.5D cel skin-specular clause so dedicated SF lighting prose is never diluted or trimmed!
          resolvedLightProse = suppressPovFacePost
            ? "Rendered in crisp 2.5D anime cel coloring with soft satin glow cushions and pinprick white skin speculars."
            : "Rendered in crisp 2.5D anime cel coloring with soft satin glow cushions, diagonal cheek blush lines, and pinprick white skin speculars.";
        } else if (isNonDaylightScene) {
          resolvedLightProse = resolvedLightProse
            .replace(
              /blinding sun glare behind her/gi,
              isNocturnalNoBacklight ? "dramatic chiaroscuro contrast" : "intense rim backlighting behind her"
            )
            .replace(/Bright direct front sunlight/g, "Bright direct front lighting")
            .replace(/Intense overexposed white daylight/g, "Crisp directional rim lighting")
            .replace(/Bright morning kitchen sunlight/g, "Warm overhead kitchen lighting")
            .replace(/Blazing summer poolside sunlight/g, "Luminous turquoise water lighting")
            .replace(/\bsunlight\b/gi, "warm light")
            .replace(/\bdaylight\b/gi, "ambient light");
        }
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
            .replace("her camera-facing face and body are", "her silhouette is")
            .replace("her camera-facing face and body rest", "her silhouette rests")
            .replace("her camera-facing face and body with", "her bare back and silhouette with");
        }
        if (activeLight.code === "milky_peach_3tier_cel") {
          if (hasTankTopForLight) {
            resolvedLightProse = resolvedLightProse.replace(
              ", with cool ice-blue shadows across pale fabric folds.",
              ", with cool ice-blue shadows on the white tank top."
            );
          } else if (!hasActualClothesForLight) {
            resolvedLightProse = resolvedLightProse.replace(
              ", with cool ice-blue shadows across pale fabric folds.",
              "."
            );
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
        const attachFrontCw = (prefixStr: string): { withCw: string; placedFront: boolean } => {
          if (!cwSuffix) return { withCw: prefixStr, placedFront: false };
          const anchors = ["1.24::glossy highlights::", "depth of field", "1.3::shiny skin::"];
          for (const anc of anchors) {
            const idx = prefixStr.indexOf(anc);
            if (idx !== -1 && idx < 620) {
              const insertPos = idx + anc.length;
              return {
                withCw: `${prefixStr.slice(0, insertPos)}${cwSuffix}${prefixStr.slice(insertPos)}`,
                placedFront: true,
              };
            }
          }
          return { withCw: prefixStr, placedFront: false };
        };
        const buildWithLightProse = (prefixStr: string): string => {
          const { withCw, placedFront } = attachFrontCw(prefixStr);
          const sep = withCw.endsWith(".") ? " " : ", ";
          return `${withCw}${sep}${resolvedLightProse}${placedFront ? "" : cwSuffix}${negTail}`;
        };
        const charDistReserve =
          !isPov &&
          !isKitchenActionScene &&
          !isPoolActionScene &&
          !isSpecimenActionScene &&
          !isHouseworkActionScene &&
          !isPhotoSubstituteScene &&
          !isCampingActionScene &&
          !isOnsenActionScene &&
          /\b(hetero|faceless male|2boys)\b/i.test(rawPrefix)
            ? 24
            : 0;
        const effectiveLightBudget = Math.max(260, maxPosBudget - charDistReserve);
        let candidate = buildWithLightProse(rawPrefix);
        if (countPromptT5Tokens(candidate).api_pos_tokens <= effectiveLightBudget) {
          nextPrompt = candidate;
        } else {
          // Trim scene prose step-by-step until combined prompt fits effectiveLightBudget (reserving headroom for
          // Post-pass 5 [Character 1]/[Character 2] headers), keeping Danbooru tags, core posture/POV clause,
          // resolvedLightProse, and inline_counterweight intact!
          const excess = countPromptT5Tokens(candidate).api_pos_tokens - effectiveLightBudget;
          let sceneTarget = measureEffectivePosTokens(`${rawPrefix}${negTail}`) - excess;
          let fitted = "";
          while (sceneTarget >= 180) {
            const trimmedSceneOnly = enforcePositiveTokenBudget(
              `${rawPrefix}${negTail}`,
              sceneTarget,
              false
            );
            const trimmedPrefix = trimmedSceneOnly
              .replace(/(?:,\s*)?(-(?:[1-9]\d*(?:\.\d+)?)::[\s\S]*?::)/g, "")
              .replace(/^[ ,]+|[ ,]+$/g, "");
            const trial = buildWithLightProse(trimmedPrefix);
            if (countPromptT5Tokens(trial).api_pos_tokens <= effectiveLightBudget) {
              fitted = trial;
              break;
            }
            if (trimmedSceneOnly === `${rawPrefix}${negTail}`) {
              sceneTarget -= 6;
              continue;
            }
            sceneTarget -= 4;
          }
          nextPrompt = fitted || enforcePositiveTokenBudget(candidate, effectiveLightBudget);
        }
      } else if (cwSuffix && !nextPrompt.startsWith("[Base Prompt]")) {
        const negBlocks1: string[] = [];
        const rawPrefix = nextPrompt
          .replace(/(?:,\s*)?(-(?:[1-9]\d*(?:\.\d+)?)::[\s\S]*?::)/g, (_m, block: string) => {
            negBlocks1.push(block.trim());
            return "";
          })
          .replace(/^[ ,]+|[ ,]+$/g, "");
        const negTail = negBlocks1.length > 0 ? `, ${negBlocks1.join(", ")}` : "";
        const cand = `${rawPrefix}${cwSuffix}${negTail}`;
        nextPrompt =
          countPromptT5Tokens(cand).api_pos_tokens <= maxPosBudget
            ? cand
            : enforcePositiveTokenBudget(cand, maxPosBudget);
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
    !isOtherActionScene &&
    sceneId !== "FREE" &&
    sceneId !== "MA0"
  ) {
    results = results.map((item) => ({
      ...item,
      subTitle: `${item.subTitle} · [${activeEnv.badge}]`,
    }));
  }

  // Post-pass 5: Unified Character Prompt Distribution ([Base Prompt] + [Character 1] [+ [Character 2]])
  // Kitchen, Pool, Specimen, Bathroom, Housework & Photo-Substitute scenes preserve their exemplar-calibrated single-box or Multi-Box layouts.
  const multiBox490CapSet = new Set([
    "KTD12",
    "KTD30",
    "KTD34",
    "KTD42",
    "KTD50",
    "KTD52",
    "PLD18",
    "PS02",
  ]);
  results = results.map((item) => {
    const isExemptLayout =
      isKitchenActionScene ||
      isPoolActionScene ||
      isSpecimenActionScene ||
      isBathroomActionScene ||
      isHouseworkActionScene ||
      isPhotoSubstituteScene ||
      isCampingActionScene ||
      isAftersexDripActionScene ||
      isOnsenActionScene;
    const candidate = isExemptLayout
      ? item.prompt
      : distributePromptToCharacterCaptions(item.prompt, cfg);
    const effectiveItemCap =
      multiBox490CapSet.has(sceneId) ||
      ((isHouseworkActionScene ||
        isPhotoSubstituteScene ||
        isCampingActionScene ||
        isOnsenActionScene) &&
        candidate.startsWith("[Base Prompt]"))
        ? Math.min(maxPosBudget, 490)
        : isExemptLayout
          ? Math.min(maxPosBudget, 500)
          : maxPosBudget;
    if (measureEffectivePosTokens(candidate) <= effectiveItemCap) {
      return { ...item, prompt: candidate };
    }
    return {
      ...item,
      prompt: enforcePositiveTokenBudget(candidate, effectiveItemCap),
    };
  });

  return results;
}

function compileHouseworkDuoScenePrompt(opts: {
  tpl: (typeof OTHER_ACTION_TEMPLATES)[string];
  duo: NonNullable<(typeof OTHER_ACTION_TEMPLATES)[string]["housework_duo"]>;
  cfg: CharacterConfig;
  m: Record<string, string>;
  headUsed: string;
  charCoreUsed: string;
  charHasFlatChest: boolean;
  genderMode: CharacterGenderMode;
  genderBadge: string;
  useSceneOutfit: boolean;
  outfitTagsFromLeft: string;
  transBg: boolean;
  transNeg: string;
  sfSceneLightTags: string;
  isExplicitDedicatedLight?: boolean;
  houseworkApronGuard: string;
  footGuard: string;
  landscapeGuard: string;
  baseTailNeg: string;
  negOn: boolean;
}): ScenePromptItem {
  const {
    tpl,
    duo,
    cfg,
    m,
    headUsed,
    charCoreUsed,
    charHasFlatChest,
    genderMode,
    genderBadge,
    useSceneOutfit,
    outfitTagsFromLeft,
    transBg,
    transNeg,
    sfSceneLightTags,
    isExplicitDedicatedLight,
    houseworkApronGuard,
    footGuard,
    landscapeGuard,
    baseTailNeg,
    negOn,
  } = opts;

  const isYuriShowcase = Boolean(duo.is_yuri_showcase);
  const wantAuxXray = Boolean(cfg.enable_uterus_xray);
  const condomOn = Boolean(cfg.enable_condom);
  const chestCoveredActive = Boolean(tpl.chest_covered && useSceneOutfit);
  const chestNeg = chestCoveredActive ? "nipples, areolae" : "";

  const femApronBase = tpl.barefoot
    ? "1.6::naked apron::, white frilly apron, nothing underneath, bare back"
    : "1.6::naked apron::, white frilly apron, nothing underneath, bare back, white thighhighs";

  const replaceProseOutfit = (rawProse: string): string => {
    if (useSceneOutfit || !tpl.prose_outfit_phrase) return rawProse;
    let out = rawProse;
    const wearProse = cfg.enable_outfit && m.front_shirt_prose ? m.front_shirt_prose.trim() : "completely nude";
    for (const cl of tpl.prose_outfit_phrase.split("|").filter(Boolean)) {
      if (out.includes(cl)) {
        out = wearProse ? out.replace(cl, wearProse) : out.replace(cl, "");
      }
    }
    return out.replace(/\s{2,}/g, " ").trim();
  };

  const envAndProps = transBg
    ? joinTags(
        "2.0::transparent background::, has alpha, alpha transparency, no background",
        tpl.core_prop_tags || ""
      )
    : joinTags(tpl.env_tags, sfSceneLightTags, tpl.core_prop_tags || "");

  const lightBadge = transBg
    ? " · [🏁透明底]"
    : isExplicitDedicatedLight
      ? ""
      : ` · [${tpl.light_badge}]`;
  const condomBadge = condomOn ? " · [🛡️安全套]" : "";
  const xrayBadge = wantAuxXray ? " · [🔬内部透视]" : "";
  const catBadge = "🏠家务干扰";

  const duoAnatomyNeg =
    "extra hands, 3 hands, extra fingers, bad hands, mutated hands, extra arms, extra legs, fused bodies, gaping, censor, mosaic censoring, bar censor";

  const fitHouseworkNeg = (rawNeg: string): string => {
    const dedup = deduplicateCommaTags(rawNeg);
    if (encodeT5Len(dedup) <= 435) return dedup;
    const parts = dedup.split(",").map((s) => s.trim()).filter(Boolean);
    while (parts.length > 20 && encodeT5Len(parts.join(", ")) > 435) {
      parts.pop();
    }
    return parts.join(", ");
  };

  // --------------------------------------------------------------------------
  // MODE 1: 2Girls Contrast Naked-Aprons Yuri Showcase (HWD15 normal)
  // --------------------------------------------------------------------------
  if (genderMode === "normal" && isYuriShowcase) {
    const heroLower = `${m.char_id} ${cfg.extra_char_tags || ""}`.toLowerCase();
    const heroIsWhiteOrAyanami =
      /\bayanami\b|\blaffey\b|\bwhite hair\b|\bsilver hair\b/i.test(heroLower);
    const partnerIdentity = heroIsWhiteOrAyanami
      ? "javelin (azur lane), short periwinkle hair, aqua eyes, slender, slim waist, small breasts"
      : "ayanami (azur lane), long white hair, red eyes, slender, slim waist, small breasts";
    const c1ContrastGuard = heroIsWhiteOrAyanami
      ? "-2::periwinkle hair, aqua eyes, blue apron::"
      : "-2::white hair, red eyes, blue apron::";

    const c1Wardrobe = useSceneOutfit
      ? joinTags(femApronBase, duo.apron_detail)
      : outfitTagsFromLeft;
    const c2Wardrobe = useSceneOutfit
      ? chestCoveredActive
        ? "1.6::naked apron::, pastel-blue frilly apron, intact apron bib covering front chest, nothing underneath, bare back, 1.45::sideboob::, white thighhighs, blushing"
        : "1.6::naked apron::, pastel-blue frilly apron, nothing underneath, bare breasts, white thighhighs, blushing"
      : joinTags(outfitTagsFromLeft, "blushing");

    const xrayTags = wantAuxXray
      ? "1.45::x-ray::, 1.4::cross-section::, 1.45::uterus::, cervix"
      : "";
    const xrayNeg = wantAuxXray
      ? "fetus, baby, embryo, skeleton, bones, medical diagram, gore"
      : "x-ray, cross-section, cutaway, uterus";
    const condomTags = condomOn ? "1.5::used condom::, 1.4::cum in condom::" : "";

    const yuriGlobalNeg = fitHouseworkNeg(
      joinTags(
        "1boy, 2boys, male, penis, hetero, futanari, twins, identical hair, 3girls",
        chestNeg,
        duoAnatomyNeg,
        footGuard,
        tpl.extra_neg || "",
        xrayNeg,
        houseworkApronGuard,
        landscapeGuard,
        transNeg,
        baseTailNeg
      )
    );

    const exprUsed = exprIf(cfg, duo.expr_tags, "", tpl.id);
    const yuriProseClean = cfg.enable_t5_prose
      ? `${replaceProseOutfit(tpl.female_prose)}${transBg ? " Isolated on a transparent background." : ""}`
      : "";

    const baseLine = joinTags(
      headUsed,
      "2girls, 1.55::yuri::",
      "rating:explicit, nsfw, uncensored",
      condomTags,
      xrayTags,
      envAndProps,
      tpl.framing_tags,
      useSceneOutfit ? tpl.female_tags : stripOnsenSceneGarmentRefs(tpl.female_tags),
      yuriProseClean,
      wrapTailNeg(m, yuriGlobalNeg, negOn)
    );

    const char1Line = joinTags(
      "1girl",
      charCoreUsed,
      c1Wardrobe,
      exprUsed,
      negOn ? c1ContrastGuard : ""
    );

    const char2Line = joinTags("1girl", partnerIdentity, c2Wardrobe);

    const yuriPrompt = `[Base Prompt]\n${baseLine}\n\n[Character 1 (B3)]\n${char1Line}\n\n[Character 2 (D3)]\n${char2Line}`;
    return {
      subTitle: `【${tpl.id} · ${tpl.title} · 👯家务双裸围百合${lightBadge}${condomBadge}${xrayBadge}】`,
      canvas: tpl.canvas,
      prompt: yuriPrompt,
    };
  }

  // --------------------------------------------------------------------------
  // MODE 2: Crossdressing Femboy x Male Partner (Multi-Box 2boys across HWD01..15)
  // --------------------------------------------------------------------------
  if (genderMode === "femboy") {
    const femboyCharCore = splitTopLevelCommaSegments(m.char_core)
      .map((tok) => {
        const bare = stripWeightPrefix(tok);
        if (bare === "short female") return "1.25::short male::";
        if (
          bare === "small breasts" ||
          bare === "medium breasts" ||
          bare === "large breasts" ||
          bare === "huge breasts" ||
          bare === "flat chest" ||
          bare === "breasts" ||
          bare === "female" ||
          bare === "1girl"
        ) {
          return "";
        }
        return tok;
      })
      .filter(Boolean)
      .join(", ");

    const femboyOutfitLeft = splitTopLevelCommaSegments(outfitTagsFromLeft)
      .filter((tok) => {
        const bare = stripWeightPrefix(tok);
        return (
          Boolean(bare) &&
          bare !== "bare breasts" &&
          bare !== "breasts" &&
          bare !== "cleavage" &&
          bare !== "bra" &&
          bare !== "pasties" &&
          bare !== "heart pasties" &&
          bare !== "rabbit tail"
        );
      })
      .join(", ");

    const femboyApronDetail = splitTopLevelCommaSegments(duo.apron_detail)
      .filter((tok) => {
        const bare = stripWeightPrefix(tok);
        return (
          Boolean(bare) &&
          bare !== "bare breasts" &&
          bare !== "nipples" &&
          bare !== "sideboob" &&
          !/\bbreasts\b/i.test(bare)
        );
      })
      .join(", ");

    const femboyWardrobe = useSceneOutfit
      ? joinTags(femApronBase, femboyApronDetail)
      : femboyOutfitLeft;
    // Omit 'tiny pink nipples' on chest_covered scenes so UC 'nipples, areolae' never self-contradicts
    const femboyChestTags = chestCoveredActive
      ? "1.55::flat chest::, 1.4::flat male chest::, hairless torso"
      : "1.55::flat chest::, 1.4::flat male chest::, tiny pink nipples, hairless torso";

    const femboyFraming = tpl.framing_tags
      .replace(/1\.55::girl on top::/g, "1.55::straddling::")
      .replace(/1\.5::scissoring::/g, "1.5::sitting sex::")
      .replace(/\bbare breasts\b/gi, "flat chest");
    const femboyProps = envAndProps
      .replace(/\bboth girls\b/gi, "both boys")
      .replace(/\bbare breasts\b/gi, "flat chest")
      .replace(/\bher\b/gi, "his");
    const femboyPartner = isYuriShowcase
      ? "shirtless faceless male embracing him on the mattress"
      : duo.partner_tags
          .replace(/\bbreast\b/gi, "chest")
          .replace(/\bher\b/gi, "his");

    const condomBase = condomOn ? "1.4::condom::, 1.35::cum in condom::" : "";
    const condomPartner = condomOn ? "1.35::condom on penis::" : "";
    const xrayTags = wantAuxXray
      ? "1.45::x-ray::, 1.4::cross-section::, 1.5::intestines::, 1.5::cum in ass::, internal cumshot"
      : "";
    const xrayNeg = wantAuxXray
      ? "fetus, baby, embryo, skeleton, bones, skull, ribcage, medical diagram, gore, uterus, cervix, womb"
      : "x-ray, cross-section, cutaway, uterus";

    const femboyGlobalNeg = fitHouseworkNeg(
      joinTags(
        "1girl, 2girls, female, girl, hetero, breasts, small breasts, medium breasts, large breasts, cleavage, pussy, vulva, labia, vaginal, uterus, cervix, futanari, twins, identical hair, 3boys, multiple boys, muscular male, bara, facial hair, huge penis, large penis",
        chestNeg,
        duoAnatomyNeg,
        footGuard,
        tpl.extra_neg || "",
        xrayNeg,
        houseworkApronGuard,
        landscapeGuard,
        transNeg,
        baseTailNeg
      )
    );

    const exprUsed = exprIf(cfg, duo.expr_tags, "", tpl.id);
    const femboyProseClean = cfg.enable_t5_prose
      ? `${replaceProseOutfit(tpl.femboy_prose)}${transBg ? " Isolated on a transparent background." : ""}`
      : "";

    const baseLine = joinTags(
      headUsed,
      "2boys, 1.55::yaoi::",
      "rating:explicit, nsfw, uncensored",
      condomBase,
      xrayTags,
      femboyProps,
      femboyFraming,
      tpl.femboy_tags,
      femboyProseClean,
      wrapTailNeg(m, femboyGlobalNeg, negOn)
    );

    const char1Line = joinTags(
      "1.45::1boy::, 1.55::otoko no ko::, 1.45::crossdressing::, 1.35::genderbend::",
      femboyCharCore,
      femboyChestTags,
      femboyWardrobe,
      exprUsed,
      "target#anal",
      negOn ? "-2.5::breasts, pussy, female::" : ""
    );

    const char2Line = joinTags(
      "1boy, tall shirtless faceless male",
      femboyPartner,
      "penis",
      condomPartner,
      "source#anal",
      negOn ? "-2.5::otoko no ko, crossdressing, feminine, apron::" : ""
    );

    const femboyPrompt = `[Base Prompt]\n${baseLine}\n\n[Character 1 (B3)]\n${char1Line}\n\n[Character 2 (D3)]\n${char2Line}`;
    return {
      subTitle: `【${tpl.id} · ${tpl.title} · ${catBadge}${lightBadge}${genderBadge}${condomBadge}${xrayBadge}】`,
      canvas: tpl.canvas,
      prompt: femboyPrompt,
    };
  }

  // --------------------------------------------------------------------------
  // MODE 3: Male-on-Futa Multi-Box (futa_no_balls / futa_with_balls across HWD01..15)
  // --------------------------------------------------------------------------
  if (genderMode === "futa_no_balls" || genderMode === "futa_with_balls") {
    const withBalls = genderMode === "futa_with_balls";
    const futaMorph = withBalls
      ? "1.6::futanari::, 1.45::futa with balls::, 1.45::small penis::, 1.4::erect penis::, 1.3::small testicles::, testicles"
      : "1.6::futanari::, 1.5::futa without balls::, 1.45::small penis::, 1.4::erect penis::";

    const futaAction = splitTopLevelCommaSegments(tpl.futa_tags)
      .filter((tok) => {
        const bare = stripWeightPrefix(tok);
        return (
          Boolean(bare) &&
          bare !== "small penis" &&
          bare !== "small testicles" &&
          bare !== "testicles" &&
          bare !== "balls" &&
          bare !== "labia" &&
          bare !== "spread pussy"
        );
      })
      .join(", ");

    const futaFraming = tpl.framing_tags.replace(/1\.5::scissoring::/g, "1.5::sitting sex::");
    const futaProps = envAndProps.replace(/\bboth girls\b/gi, "both partners");
    const futaPartner = isYuriShowcase
      ? "shirtless faceless male embracing her on the mattress"
      : duo.partner_tags;

    const futaWardrobe = useSceneOutfit
      ? joinTags(femApronBase, duo.apron_detail)
      : outfitTagsFromLeft;

    const condomBase = condomOn ? "1.4::condom::, 1.35::cum in condom::" : "";
    const condomPartner = condomOn ? "1.35::condom on penis::" : "";
    const xrayTags = wantAuxXray
      ? "1.45::x-ray::, 1.4::cross-section::, 1.45::uterus::, cervix, 1.45::cum in uterus::"
      : "";
    const xrayNeg = wantAuxXray
      ? "fetus, baby, embryo, skeleton, bones, medical diagram, gore"
      : "x-ray, cross-section, cutaway, uterus";

    const futaGlobalNeg = fitHouseworkNeg(
      joinTags(
        "2boys, yaoi, otoko no ko, crossdressing, male chest, huge penis, large penis, oversized penis, hyper penis, monster penis, giant penis, 2girls",
        charHasFlatChest ? "" : "flat chest",
        withBalls ? "huge testicles, large testicles" : "testicles, balls, scrotum",
        chestNeg,
        duoAnatomyNeg,
        footGuard,
        tpl.extra_neg || "",
        xrayNeg,
        houseworkApronGuard,
        landscapeGuard,
        transNeg,
        baseTailNeg
      )
    );

    const exprUsed = exprIf(cfg, duo.expr_tags, "", tpl.id);
    const futaProseClean = cfg.enable_t5_prose
      ? `${replaceProseOutfit(tpl.futa_prose)}${transBg ? " Isolated on a transparent background." : ""}`
      : "";

    const baseLine = joinTags(
      headUsed,
      "1girl, 1boy, hetero, 1.55::futanari::",
      "rating:explicit, nsfw, uncensored",
      condomBase,
      xrayTags,
      futaProps,
      futaFraming,
      useSceneOutfit ? futaAction : stripOnsenSceneGarmentRefs(futaAction),
      futaProseClean,
      wrapTailNeg(m, futaGlobalNeg, negOn)
    );

    const char1Line = joinTags(
      "1girl",
      charCoreUsed,
      futaMorph,
      futaWardrobe,
      exprUsed,
      "target#vaginal"
    );

    const char2Line = joinTags(
      "1boy, tall shirtless faceless male",
      futaPartner,
      "penis",
      condomPartner,
      "source#vaginal",
      negOn ? "-2.5::futanari, breasts, feminine, apron::" : ""
    );

    const futaPrompt = `[Base Prompt]\n${baseLine}\n\n[Character 1 (B3)]\n${char1Line}\n\n[Character 2 (D3)]\n${char2Line}`;
    return {
      subTitle: `【${tpl.id} · ${tpl.title} · ${catBadge}${lightBadge}${genderBadge}${condomBadge}${xrayBadge}】`,
      canvas: tpl.canvas,
      prompt: futaPrompt,
    };
  }

  // --------------------------------------------------------------------------
  // MODE 4: Normal Female x Male Partner (Single-Box on HWD01..HWD14)
  // --------------------------------------------------------------------------
  const femaleWardrobe = useSceneOutfit
    ? joinTags(femApronBase, duo.apron_detail)
    : outfitTagsFromLeft;
  const condomTags = condomOn
    ? "1.4::condom::, 1.35::condom on penis::, 1.35::cum in condom::"
    : "";
  const xrayTags = wantAuxXray
    ? "1.45::x-ray::, 1.4::cross-section::, 1.45::uterus::, cervix, 1.45::cum in uterus::"
    : "";
  const xrayNeg = wantAuxXray
    ? "fetus, baby, embryo, skeleton, bones, medical diagram, gore"
    : "x-ray, cross-section, cutaway, uterus";

  const normalNeg = fitHouseworkNeg(
    joinTags(
      "2boys, yaoi, futanari, otoko no ko, multiple boys, 2girls",
      charHasFlatChest ? "" : "flat chest",
      chestNeg,
      duoAnatomyNeg,
      footGuard,
      tpl.extra_neg || "",
      xrayNeg,
      houseworkApronGuard,
      landscapeGuard,
      transNeg,
      baseTailNeg
    )
  );

  const exprUsed = exprIf(cfg, duo.expr_tags, "", tpl.id);
  const femaleProseClean = cfg.enable_t5_prose
    ? `${replaceProseOutfit(tpl.female_prose)}${transBg ? " Isolated on a transparent background." : ""}`
    : "";

  const pNormal = joinTags(
    headUsed,
    "1girl, 1boy, hetero, faceless male",
    charCoreUsed,
    femaleWardrobe,
    envAndProps,
    tpl.framing_tags,
    duo.partner_tags,
    exprUsed,
    "rating:explicit, nsfw, uncensored",
    tpl.female_tags,
    condomTags,
    xrayTags,
    femaleProseClean,
    wrapTailNeg(m, normalNeg, negOn)
  );
  return {
    subTitle: `【${tpl.id} · ${tpl.title} · ${catBadge}${lightBadge}${condomBadge}${xrayBadge}】`,
    canvas: tpl.canvas,
    prompt: pNormal,
  };
}

function compileCampingDuoScenePrompt(opts: {
  tpl: (typeof OTHER_ACTION_TEMPLATES)[string];
  duo: NonNullable<(typeof OTHER_ACTION_TEMPLATES)[string]["camping_duo"]>;
  cfg: CharacterConfig;
  m: Record<string, string>;
  headUsed: string;
  charCoreUsed: string;
  charHasFlatChest: boolean;
  genderMode: CharacterGenderMode;
  genderBadge: string;
  useSceneOutfit: boolean;
  outfitTagsFromLeft: string;
  transBg: boolean;
  transNeg: string;
  sfSceneLightTags: string;
  isExplicitDedicatedLight?: boolean;
  campingLightNeg: string;
  campingBarefootBan: string;
  footGuard: string;
  landscapeGuard: string;
  baseTailNeg: string;
  negOn: boolean;
}): ScenePromptItem {
  const {
    tpl,
    duo,
    cfg,
    m,
    headUsed,
    charCoreUsed,
    charHasFlatChest,
    genderMode,
    genderBadge,
    useSceneOutfit,
    outfitTagsFromLeft,
    transBg,
    transNeg,
    sfSceneLightTags,
    isExplicitDedicatedLight,
    campingLightNeg,
    campingBarefootBan,
    footGuard,
    landscapeGuard,
    baseTailNeg,
    negOn,
  } = opts;

  const isYuriShowcase = Boolean(duo.is_yuri_showcase);
  const wantAuxXray = Boolean(cfg.enable_uterus_xray);
  const condomOn = Boolean(cfg.enable_condom);
  const chestCoveredActive = Boolean(tpl.chest_covered && useSceneOutfit);
  const chestNeg = chestCoveredActive ? "nipples, areolae" : "";
  const campingUnderwearBan = useSceneOutfit ? "bra, panties, underwear" : "";

  const replaceProseOutfit = (rawProse: string): string => {
    if (useSceneOutfit || !tpl.prose_outfit_phrase) return rawProse;
    let out = rawProse;
    const wearProse =
      cfg.enable_outfit && m.front_shirt_prose ? m.front_shirt_prose.trim() : "completely nude";
    for (const cl of tpl.prose_outfit_phrase.split("|").filter(Boolean)) {
      if (out.includes(cl)) {
        out = wearProse ? out.replace(cl, wearProse) : out.replace(cl, "");
      }
    }
    return out.replace(/\s{2,}/g, " ").trim();
  };

  const envAndProps = transBg
    ? joinTags(
        "2.0::transparent background::, has alpha, alpha transparency, no background",
        tpl.core_prop_tags || ""
      )
    : joinTags(tpl.env_tags, sfSceneLightTags, tpl.core_prop_tags || "");

  const lightBadge = transBg
    ? " · [🏁透明底]"
    : isExplicitDedicatedLight
      ? ""
      : ` · [${tpl.light_badge}]`;
  const condomBadge = condomOn ? " · [🛡️安全套]" : "";
  const xrayBadge = wantAuxXray ? " · [🔬内部透视]" : "";
  const catBadge = "⛺露营野餐";

  const duoAnatomyNeg =
    "extra hands, 3 hands, extra fingers, bad hands, mutated hands, extra arms, extra legs, fused bodies, gaping, censor, mosaic censoring, bar censor";

  const fitCampingNeg = (rawNeg: string): string => {
    const dedup = deduplicateCommaTags(rawNeg);
    if (encodeT5Len(dedup) <= 435) return dedup;
    const parts = dedup.split(",").map((s) => s.trim()).filter(Boolean);
    while (parts.length > 20 && encodeT5Len(parts.join(", ")) > 435) {
      parts.pop();
    }
    return parts.join(", ");
  };

  // --------------------------------------------------------------------------
  // MODE 1: 2Girls Sunlit Flower-Meadow Dual-Sundress Yuri Showcase (CP12 normal)
  // --------------------------------------------------------------------------
  if (genderMode === "normal" && isYuriShowcase) {
    const heroLower = `${m.char_id} ${cfg.extra_char_tags || ""}`.toLowerCase();
    const heroIsWhiteOrAyanami =
      /\bayanami\b|\blaffey\b|\bwhite hair\b|\bsilver hair\b/i.test(heroLower);
    const partnerIdentity = heroIsWhiteOrAyanami
      ? "javelin (azur lane), short periwinkle hair, aqua eyes, slender, slim waist, small breasts"
      : "ayanami (azur lane), long white hair, red eyes, slender, slim waist, small breasts";
    const c1ContrastGuard = heroIsWhiteOrAyanami
      ? "-2.5::periwinkle hair, aqua eyes, yellow dress::"
      : "-2.5::white hair, red eyes, yellow dress::";
    const c2ContrastGuard = heroIsWhiteOrAyanami
      ? "-2.5::white hair, red eyes, white dress::"
      : "-2.5::purple hair, green eyes, white dress::";

    const c1Wardrobe = useSceneOutfit ? duo.outfit_tags : outfitTagsFromLeft;
    const c2Wardrobe = useSceneOutfit
      ? "sleeveless pastel-yellow summer sundress, intact bodice covering front chest, sundress skirt bunched at waist, bare legs, blushing"
      : outfitTagsFromLeft || "completely nude";

    const xrayTags = wantAuxXray
      ? "1.45::x-ray::, 1.4::cross-section::, 1.45::uterus::, cervix"
      : "";
    const xrayNeg = wantAuxXray
      ? "fetus, baby, embryo, skeleton, bones, medical diagram, gore"
      : "x-ray, cross-section, cutaway, uterus";

    const yuriGlobalNeg = fitCampingNeg(
      joinTags(
        "1boy, 2boys, male, penis, hetero, futanari, twins, identical hair, 3girls, multiple girls",
        chestNeg,
        campingUnderwearBan,
        campingLightNeg,
        campingBarefootBan,
        duoAnatomyNeg,
        footGuard,
        tpl.extra_neg || "",
        xrayNeg,
        landscapeGuard,
        transNeg,
        baseTailNeg
      )
    );

    const exprUsed = exprIf(cfg, duo.expr_tags, "", tpl.id);
    const yuriProseClean = cfg.enable_t5_prose
      ? `${replaceProseOutfit(tpl.female_prose)}${transBg ? " Isolated on a transparent background." : ""}`
      : "";

    const baseLine = joinTags(
      headUsed,
      "2girls, 1.55::yuri::",
      "rating:explicit, nsfw, uncensored",
      xrayTags,
      envAndProps,
      tpl.framing_tags,
      useSceneOutfit ? tpl.female_tags : stripOnsenSceneGarmentRefs(tpl.female_tags),
      yuriProseClean,
      wrapTailNeg(m, yuriGlobalNeg, negOn)
    );

    const char1Line = joinTags(
      "1girl",
      charCoreUsed,
      c1Wardrobe,
      exprUsed,
      "target#fingering",
      negOn ? c1ContrastGuard : ""
    );

    const char2Line = joinTags(
      "1girl",
      partnerIdentity,
      c2Wardrobe,
      "source#fingering",
      negOn ? c2ContrastGuard : ""
    );

    return {
      subTitle: `【${tpl.id} · ${tpl.title} · 👯花甸野餐百合${lightBadge}${condomBadge}${xrayBadge}】`,
      canvas: tpl.canvas,
      prompt: `[Base Prompt]\n${baseLine}\n\n[Character 1 (B3)]\n${char1Line}\n\n[Character 2 (D3)]\n${char2Line}`,
    };
  }

  // --------------------------------------------------------------------------
  // MODE 2: Crossdressing Femboy x Male Partner (Multi-Box 2boys across CP01..12)
  // --------------------------------------------------------------------------
  if (genderMode === "femboy") {
    const femboyCharCore = splitTopLevelCommaSegments(m.char_core)
      .map((tok) => {
        const bare = stripWeightPrefix(tok);
        if (bare === "short female") return "1.25::short male::";
        if (
          bare === "small breasts" ||
          bare === "medium breasts" ||
          bare === "large breasts" ||
          bare === "huge breasts" ||
          bare === "flat chest" ||
          bare === "breasts" ||
          bare === "female" ||
          bare === "1girl"
        ) {
          return "";
        }
        return tok;
      })
      .filter(Boolean)
      .join(", ");

    const femboyWardrobe = useSceneOutfit ? duo.femboy_outfit_tags : outfitTagsFromLeft;
    const femboyChestTags = chestCoveredActive
      ? "1.55::flat chest::, 1.4::flat male chest::, hairless torso"
      : "1.55::flat chest::, 1.4::flat male chest::, tiny pink nipples, hairless torso";

    const femboyFraming = tpl.framing_tags
      .replace(/1\.55::girl on top::/g, "1.55::straddling::")
      .replace(/\btwo girls\b/gi, "two boys")
      .replace(/\bbare breasts\b/gi, "flat chest");
    const femboyProps = envAndProps
      .replace(/\bher\b/gi, "his")
      .replace(/\bbare breasts\b/gi, "flat chest");
    const femboyPartner = isYuriShowcase
      ? "shirtless faceless male seated beside him on picnic blanket"
      : duo.partner_tags
          .replace(/fondling (?:her )?(?:bare )?breast/gi, "gripping chest")
          .replace(/\bher\b/gi, "his");

    const condomBase = condomOn ? "1.4::condom::, 1.35::cum in condom::" : "";
    const condomPartner = condomOn ? "1.35::condom on penis::" : "";
    const xrayTags = wantAuxXray
      ? "1.45::x-ray::, 1.4::cross-section::, 1.5::intestines::, 1.5::cum in ass::, internal cumshot"
      : "";
    const xrayNeg = wantAuxXray
      ? "fetus, baby, embryo, skeleton, bones, skull, ribcage, medical diagram, gore, uterus, cervix, womb"
      : "x-ray, cross-section, cutaway, uterus";

    const femboyGlobalNeg = fitCampingNeg(
      joinTags(
        "1girl, 2girls, female, girl, hetero, breasts, small breasts, medium breasts, large breasts, cleavage, pussy, vulva, labia, vaginal, uterus, cervix, futanari, twins, identical hair, 3boys, multiple boys, muscular male, bara, facial hair, huge penis, large penis",
        chestNeg,
        campingUnderwearBan,
        campingLightNeg,
        campingBarefootBan,
        duoAnatomyNeg,
        footGuard,
        tpl.extra_neg || "",
        xrayNeg,
        landscapeGuard,
        transNeg,
        baseTailNeg
      )
    );

    const exprUsed = exprIf(cfg, duo.expr_tags, "", tpl.id);
    const femboyProseClean = cfg.enable_t5_prose
      ? `${replaceProseOutfit(tpl.femboy_prose)}${transBg ? " Isolated on a transparent background." : ""}`
      : "";

    const baseLine = joinTags(
      headUsed,
      "2boys, 1.55::yaoi::",
      "rating:explicit, nsfw, uncensored",
      condomBase,
      xrayTags,
      femboyProps,
      femboyFraming,
      tpl.femboy_tags,
      femboyProseClean,
      wrapTailNeg(m, femboyGlobalNeg, negOn)
    );

    const char1Line = joinTags(
      "1.45::1boy::, 1.55::otoko no ko::, 1.45::crossdressing::",
      femboyCharCore,
      femboyChestTags,
      femboyWardrobe,
      exprUsed,
      "target#anal",
      negOn ? "-2.5::breasts, pussy, female::" : ""
    );

    const char2Line = joinTags(
      /\bfaceless male\b/i.test(femboyPartner) ? "1boy" : "1boy, tall shirtless faceless male",
      femboyPartner,
      "penis",
      condomPartner,
      "source#anal",
      negOn ? "-2.5::otoko no ko, crossdressing, feminine::" : ""
    );

    return {
      subTitle: `【${tpl.id} · ${tpl.title} · ${catBadge}${lightBadge}${genderBadge}${condomBadge}${xrayBadge}】`,
      canvas: tpl.canvas,
      prompt: `[Base Prompt]\n${baseLine}\n\n[Character 1 (B3)]\n${char1Line}\n\n[Character 2 (D3)]\n${char2Line}`,
    };
  }

  // --------------------------------------------------------------------------
  // MODE 3: Male-on-Futa Multi-Box (futa_no_balls / futa_with_balls across CP01..12)
  // --------------------------------------------------------------------------
  if (genderMode === "futa_no_balls" || genderMode === "futa_with_balls") {
    const withBalls = genderMode === "futa_with_balls";
    const futaMorph = withBalls
      ? "1.6::futanari::, 1.45::futa with balls::, 1.45::small penis::, 1.4::erect penis::, 1.3::small testicles::, testicles"
      : "1.6::futanari::, 1.5::futa without balls::, 1.45::small penis::, 1.4::erect penis::";

    const futaAction = splitTopLevelCommaSegments(tpl.futa_tags)
      .filter((tok) => {
        const bare = stripWeightPrefix(tok);
        return (
          Boolean(bare) &&
          bare !== "small penis" &&
          bare !== "small testicles" &&
          bare !== "testicles" &&
          bare !== "balls" &&
          bare !== "labia" &&
          bare !== "spread pussy"
        );
      })
      .join(", ");

    const futaFraming = tpl.framing_tags.replace(/\btwo girls\b/gi, "two partners");
    const futaPartner = isYuriShowcase
      ? "shirtless faceless male seated beside her on picnic blanket"
      : duo.partner_tags;
    const futaWardrobe = useSceneOutfit ? duo.outfit_tags : outfitTagsFromLeft;

    const condomBase = condomOn ? "1.4::condom::, 1.35::cum in condom::" : "";
    const condomPartner = condomOn ? "1.35::condom on penis::" : "";
    const xrayTags = wantAuxXray
      ? "1.45::x-ray::, 1.4::cross-section::, 1.45::uterus::, cervix, 1.45::cum in uterus::"
      : "";
    const xrayNeg = wantAuxXray
      ? "fetus, baby, embryo, skeleton, bones, medical diagram, gore"
      : "x-ray, cross-section, cutaway, uterus";

    const futaGlobalNeg = fitCampingNeg(
      joinTags(
        "2boys, yaoi, otoko no ko, crossdressing, male chest, huge penis, large penis, oversized penis, hyper penis, monster penis, giant penis, 2girls",
        charHasFlatChest ? "" : "flat chest",
        withBalls ? "huge testicles, large testicles" : "testicles, balls, scrotum",
        chestNeg,
        campingUnderwearBan,
        campingLightNeg,
        campingBarefootBan,
        duoAnatomyNeg,
        footGuard,
        tpl.extra_neg || "",
        xrayNeg,
        landscapeGuard,
        transNeg,
        baseTailNeg
      )
    );

    const exprUsed = exprIf(cfg, duo.expr_tags, "", tpl.id);
    const futaProseClean = cfg.enable_t5_prose
      ? `${replaceProseOutfit(tpl.futa_prose)}${transBg ? " Isolated on a transparent background." : ""}`
      : "";

    const baseLine = joinTags(
      headUsed,
      "1girl, 1boy, hetero, 1.55::futanari::",
      "rating:explicit, nsfw, uncensored",
      condomBase,
      xrayTags,
      envAndProps,
      futaFraming,
      useSceneOutfit ? futaAction : stripOnsenSceneGarmentRefs(futaAction),
      futaProseClean,
      wrapTailNeg(m, futaGlobalNeg, negOn)
    );

    const char1Line = joinTags(
      "1girl",
      charCoreUsed,
      futaMorph,
      futaWardrobe,
      exprUsed,
      "target#vaginal"
    );

    const char2Line = joinTags(
      /\bfaceless male\b/i.test(futaPartner) ? "1boy" : "1boy, tall shirtless faceless male",
      futaPartner,
      "penis",
      condomPartner,
      "source#vaginal",
      negOn ? "-2.5::futanari, breasts, feminine::" : ""
    );

    return {
      subTitle: `【${tpl.id} · ${tpl.title} · ${catBadge}${lightBadge}${genderBadge}${condomBadge}${xrayBadge}】`,
      canvas: tpl.canvas,
      prompt: `[Base Prompt]\n${baseLine}\n\n[Character 1 (B3)]\n${char1Line}\n\n[Character 2 (D3)]\n${char2Line}`,
    };
  }

  // --------------------------------------------------------------------------
  // MODE 4: Normal Female x Male Partner (Single-Box on CP01..CP11)
  // --------------------------------------------------------------------------
  const femaleWardrobe = useSceneOutfit ? duo.outfit_tags : outfitTagsFromLeft;
  const condomTags = condomOn
    ? "1.4::condom::, 1.35::condom on penis::, 1.35::cum in condom::"
    : "";
  const xrayTags = wantAuxXray
    ? "1.45::x-ray::, 1.4::cross-section::, 1.45::uterus::, cervix, 1.45::cum in uterus::"
    : "";
  const xrayNeg = wantAuxXray
    ? "fetus, baby, embryo, skeleton, bones, medical diagram, gore"
    : "x-ray, cross-section, cutaway, uterus";

  const normalNeg = fitCampingNeg(
    joinTags(
      "2boys, yaoi, futanari, otoko no ko, multiple boys, 2girls",
      charHasFlatChest ? "" : "flat chest",
      chestNeg,
      campingUnderwearBan,
      campingLightNeg,
      campingBarefootBan,
      duoAnatomyNeg,
      footGuard,
      tpl.extra_neg || "",
      xrayNeg,
      landscapeGuard,
      transNeg,
      baseTailNeg
    )
  );

  const exprUsed = exprIf(cfg, duo.expr_tags, "", tpl.id);
  const femaleProseClean = cfg.enable_t5_prose
    ? `${replaceProseOutfit(tpl.female_prose)}${transBg ? " Isolated on a transparent background." : ""}`
    : "";

  const pNormal = joinTags(
    headUsed,
    "1girl, 1boy, hetero, faceless male",
    "rating:explicit, nsfw, uncensored",
    condomTags,
    xrayTags,
    charCoreUsed,
    femaleWardrobe,
    envAndProps,
    tpl.framing_tags,
    duo.partner_tags,
    exprUsed,
    useSceneOutfit ? tpl.female_tags : stripOnsenSceneGarmentRefs(tpl.female_tags),
    femaleProseClean,
    wrapTailNeg(m, normalNeg, negOn)
  );
  return {
    subTitle: `【${tpl.id} · ${tpl.title} · ${catBadge}${lightBadge}${condomBadge}${xrayBadge}】`,
    canvas: tpl.canvas,
    prompt: pNormal,
  };
}

function femboyPronounClean(raw: string): string {
  if (!raw) return raw;
  return raw
    .replace(/\bShe\b/g, "He")
    .replace(/\bshe\b/g, "he")
    .replace(/\bhers\b/gi, "his")
    .replace(
      /\b(behind|beneath|beside|watching|looking down at)\s+her\b(?=$|[.,;!]|\s+(?:in|on|at|from|with|by|for|to|into|onto|over|under|above|below|along|across|through|between|while|as|and|raising|gripping|holding|supporting|leaning|lying|sitting|standing|kneeling|walk|walks|walking)\b)/gi,
      "$1 him"
    )
    .replace(/\bHer\b/g, "His")
    .replace(/\bher\b/g, "his");
}

function stripOnsenSceneGarmentRefs(raw: string): string {
  if (!raw) return raw;
  return raw
    .replace(/(?:,\s*)?loosened red obi ribbon trailing on tatami/gi, "")
    .replace(/,\s*below short yukata hem/gi, "")
    .replace(/\s+onto yukata (?:sash|hem)/gi, "")
    .replace(/,\s*teasing invitation to untie sash/gi, ", teasing invitation")
    .replace(
      /\b(?:parted|lifted)(?:\s+(?:front|back))?\s+yukata(?:\s+(?:hem|skirt))?\s+(?:openly\s+)?(?=(?:exposing|revealing|on\b))/gi,
      "open posture "
    )
    .replace(/\s+with\s+lifted\s+yukata\s+(?=revealing)/gi, " ")
    .replace(/\b(?:\d+(?:\.\d+)?::)?yukata(?:::)?(?:\s+(?:fabric|hem|skirt|sash|back hem))?/gi, "outfit")
    .replace(
      /\b(?:crimson|red)\s+silk\s+(?:\d+(?:\.\d+)?::)?obi(?:::)?\s+(?:sash(?:\s+bow)?|ribbon(?:\s+end)?)/gi,
      "ribbon"
    )
    .replace(/\b(?:\d+(?:\.\d+)?::)?obi(?:::)?(?:\s+(?:sash|ribbon))?/gi, "ribbon")
    .replace(/,\s*,+/g, ", ")
    .replace(/\s{2,}/g, " ")
    .replace(/^[ ,]+|[ ,]+$/g, "");
}

function compileOnsenDuoScenePrompt(opts: {
  tpl: (typeof OTHER_ACTION_TEMPLATES)[string];
  cfg: CharacterConfig;
  m: Record<string, string>;
  headUsed: string;
  charCoreUsed: string;
  charHasFlatChest: boolean;
  genderMode: CharacterGenderMode;
  genderBadge: string;
  useSceneOutfit: boolean;
  outfitTagsFromLeft: string;
  transBg: boolean;
  transNeg: string;
  sfSceneLightTags: string;
  isExplicitDedicatedLight?: boolean;
  onsenLightNeg: string;
  onsenBarefootBan: string;
  footGuard: string;
  landscapeGuard: string;
  baseTailNeg: string;
  negOn: boolean;
}): ScenePromptItem {
  const {
    tpl,
    cfg,
    m,
    headUsed,
    charCoreUsed,
    charHasFlatChest,
    genderMode,
    genderBadge,
    useSceneOutfit,
    outfitTagsFromLeft,
    transBg,
    transNeg,
    sfSceneLightTags,
    isExplicitDedicatedLight,
    onsenLightNeg,
    onsenBarefootBan,
    footGuard,
    landscapeGuard,
    baseTailNeg,
    negOn,
  } = opts;

  const isYuriShowcase = Boolean(tpl.is_onsen_yuri_showcase);
  const wantAuxXray = Boolean(cfg.enable_uterus_xray);
  const condomOn = Boolean(cfg.enable_condom);
  const chestCoveredActive = Boolean(tpl.chest_covered && useSceneOutfit);
  const chestNeg = chestCoveredActive ? "nipples, areolae, bare breasts" : "";
  const onsenUndergarmentBan = useSceneOutfit ? ONSEN_UNDERGARMENT_UC : "";
  const mirrorGuard = tpl.allow_wall_mirror
    ? "mirror selfie, holding phone, smartphone, cellphone, mobile phone, camera lens"
    : "";

  const replaceProseOutfit = (rawProse: string): string => {
    if (useSceneOutfit || !tpl.prose_outfit_phrase) return rawProse;
    let out = rawProse;
    const wearProse =
      cfg.enable_outfit && m.front_shirt_prose ? m.front_shirt_prose.trim() : "completely nude";
    for (const cl of tpl.prose_outfit_phrase.split("|").filter(Boolean)) {
      if (out.includes(cl)) {
        out = wearProse ? out.replace(cl, wearProse) : out.replace(cl, "");
      }
    }
    return out.replace(/\s{2,}/g, " ").trim();
  };

  const envAndProps = transBg
    ? joinTags(
        "2.0::transparent background::, has alpha, alpha transparency, no background",
        tpl.core_prop_tags || ""
      )
    : joinTags(tpl.env_tags, sfSceneLightTags, tpl.core_prop_tags || "");

  const lightBadge = transBg
    ? " · [🏁透明底]"
    : isExplicitDedicatedLight
      ? ""
      : ` · [${tpl.light_badge}]`;
  const condomBadge = condomOn ? " · [🛡️安全套]" : "";
  const xrayBadge = wantAuxXray ? " · [🔬内部透视]" : "";
  const catBadge = "♨️温泉双人";

  const duoAnatomyNeg =
    "bald, shaved head, extra hands, 3 hands, extra fingers, bad hands, mutated hands, extra arms, extra legs, fused bodies, gaping, censor, mosaic censoring, bar censor";

  const fitOnsenNeg = (rawNeg: string): string => {
    const dedup = deduplicateCommaTags(rawNeg);
    if (encodeT5Len(dedup) <= 435) return dedup;
    const parts = dedup.split(",").map((s) => s.trim()).filter(Boolean);
    while (parts.length > 20 && encodeT5Len(parts.join(", ")) > 435) {
      parts.pop();
    }
    return parts.join(", ");
  };

  // --------------------------------------------------------------------------
  // MODE 1: 2Girls Dual-Yukata Yuri Showcase (ONS10 normal)
  // --------------------------------------------------------------------------
  if (genderMode === "normal" && isYuriShowcase) {
    const heroLower = `${m.char_id} ${cfg.extra_char_tags || ""}`.toLowerCase();
    const heroIsWhiteOrAyanami =
      /\bayanami\b|\blaffey\b|\bwhite hair\b|\bsilver hair\b/i.test(heroLower);
    const partnerIdentity = heroIsWhiteOrAyanami
      ? "javelin (azur lane), short periwinkle hair, amber eyes, slender, slim waist, small breasts"
      : "ayanami (azur lane), long white hair, red eyes, slender, slim waist, small breasts";
    const c1ContrastGuard = heroIsWhiteOrAyanami
      ? useSceneOutfit
        ? "-2::periwinkle hair, amber eyes, pink yukata::"
        : "-2::periwinkle hair, amber eyes::"
      : useSceneOutfit
        ? "-2::white hair, red eyes, pink yukata::"
        : "-2::white hair, red eyes::";
    const c2ContrastGuard = heroIsWhiteOrAyanami
      ? useSceneOutfit
        ? "-2::white hair, red eyes, navy yukata::"
        : "-2::white hair, red eyes::"
      : useSceneOutfit
        ? "-2::purple hair, green eyes, navy yukata::"
        : "-2::purple hair, green eyes::";

    const c1Wardrobe = useSceneOutfit ? tpl.builtin_outfit : outfitTagsFromLeft;
    const c2Wardrobe = useSceneOutfit
      ? "adult woman, sakura-pink floral cotton yukata, intact modest collar covering front chest, yellow obi sash, lower hem parted slightly, bare legs, blushing"
      : joinTags(outfitTagsFromLeft, "blushing");

    const xrayTags = wantAuxXray
      ? "1.45::x-ray::, 1.4::cross-section::, 1.45::uterus::, cervix"
      : "";
    const xrayNeg = wantAuxXray
      ? "fetus, baby, embryo, skeleton, bones, medical diagram, gore"
      : "x-ray, cross-section, cutaway, uterus";
    const condomTags = condomOn ? "1.5::used condom::, 1.4::cum in condom::" : "";

    const yuriGlobalNeg = fitOnsenNeg(
      joinTags(
        "1boy, 2boys, male, penis, hetero, futanari, twins, identical hair, 3girls",
        mirrorGuard,
        chestNeg,
        onsenUndergarmentBan,
        onsenLightNeg,
        onsenBarefootBan,
        duoAnatomyNeg,
        footGuard,
        tpl.extra_neg || "",
        xrayNeg,
        landscapeGuard,
        transNeg,
        baseTailNeg
      )
    );

    const exprUsed = exprIf(cfg, tpl.onsen_expr_tags || "", "", tpl.id);
    const yuriProseClean = cfg.enable_t5_prose
      ? `${replaceProseOutfit(tpl.female_prose)}${transBg ? " Isolated on a transparent background." : ""}`
      : "";

    const baseLine = joinTags(
      headUsed,
      "2girls, 1.55::yuri::",
      "rating:explicit, nsfw, uncensored",
      condomTags,
      xrayTags,
      envAndProps,
      tpl.framing_tags,
      useSceneOutfit ? tpl.female_tags : stripOnsenSceneGarmentRefs(tpl.female_tags),
      yuriProseClean,
      wrapTailNeg(m, yuriGlobalNeg, negOn)
    );

    const char1Line = joinTags(
      "1girl",
      charCoreUsed,
      c1Wardrobe,
      exprUsed,
      "target#fingering",
      negOn ? c1ContrastGuard : ""
    );

    const char2Line = joinTags(
      "1girl",
      partnerIdentity,
      c2Wardrobe,
      "source#fingering",
      negOn ? c2ContrastGuard : ""
    );

    return {
      subTitle: `【${tpl.id} · ${tpl.title} · 👯和室双浴衣百合${lightBadge}${condomBadge}${xrayBadge}】`,
      canvas: tpl.canvas,
      prompt: `[Base Prompt]\n${baseLine}\n\n[Character 1 (B3)]\n${char1Line}\n\n[Character 2 (D3)]\n${char2Line}`,
    };
  }

  // --------------------------------------------------------------------------
  // MODE 2: Crossdressing Femboy x Male Partner (Multi-Box 2boys across 32 Duo)
  // --------------------------------------------------------------------------
  if (genderMode === "femboy") {
    const femboyCharCore = splitTopLevelCommaSegments(m.char_core)
      .map((tok) => {
        const bare = stripWeightPrefix(tok);
        if (bare === "short female") return "1.25::short male::";
        if (
          bare === "small breasts" ||
          bare === "medium breasts" ||
          bare === "large breasts" ||
          bare === "huge breasts" ||
          bare === "flat chest" ||
          bare === "breasts" ||
          bare === "female" ||
          bare === "1girl"
        ) {
          return "";
        }
        return tok;
      })
      .filter(Boolean)
      .join(", ");

    const femboyWardrobe = useSceneOutfit
      ? tpl.femboy_outfit || tpl.builtin_outfit
      : outfitTagsFromLeft;
    const femboyChestTags = chestCoveredActive
      ? "1.55::flat chest::, 1.4::flat male chest::, hairless torso"
      : "1.55::flat chest::, 1.4::flat male chest::, tiny pink nipples, hairless torso";

    const femboyFraming = femboyPronounClean(
      tpl.framing_tags
        .replace(/of two girls\s*/gi, "")
        .replace(/\btwo girls\b/gi, "two boys")
        .replace(/(?:,\s*)?\d+(?:\.\d+)?::girl on top::/gi, "")
        .replace(/\bgirl on top\b/gi, "straddling")
        .replace(/\bbare breasts\b/gi, "flat chest")
    )
      .replace(/,\s*,+/g, ", ")
      .replace(/^[ ,]+|[ ,]+$/g, "");
    const femboyProps = femboyPronounClean(
      envAndProps
        .replace(/\bleft girl\b/gi, "boy")
        .replace(/\bbare breasts\b/gi, "flat chest")
    );
    const femboyPartner = femboyPronounClean(
      (tpl.onsen_partner_tags || "shirtless faceless male behind him").replace(
        /fondling (?:her )?(?:wet )?(?:bare )?breast/gi,
        "gripping chest"
      )
    );

    const condomBase = condomOn ? "1.4::condom::, 1.35::cum in condom::" : "";
    const condomPartner = condomOn ? "1.35::condom on penis::" : "";
    const xrayTags = wantAuxXray
      ? "1.45::x-ray::, 1.4::cross-section::, 1.5::intestines::, 1.5::cum in ass::, internal cumshot"
      : "";
    const xrayNeg = wantAuxXray
      ? "fetus, baby, embryo, skeleton, bones, skull, ribcage, medical diagram, gore, uterus, cervix, womb"
      : "x-ray, cross-section, cutaway, uterus";

    const femboyGlobalNeg = fitOnsenNeg(
      joinTags(
        "1girl, 2girls, female, girl, hetero, breasts, small breasts, medium breasts, large breasts, cleavage, pussy, vulva, labia, vaginal, uterus, cervix, futanari, twins, identical hair, 3boys, multiple boys, muscular male, bara, facial hair, huge penis, large penis",
        mirrorGuard,
        chestNeg,
        onsenUndergarmentBan,
        onsenLightNeg,
        onsenBarefootBan,
        duoAnatomyNeg,
        footGuard,
        tpl.extra_neg || "",
        xrayNeg,
        landscapeGuard,
        transNeg,
        baseTailNeg
      )
    );

    const exprUsed = exprIf(
      cfg,
      (tpl.onsen_expr_tags || "")
        .replace(/\bshe\b/gi, "he")
        .replace(/\bhers\b/gi, "his")
        .replace(/\bher\b/gi, "his"),
      "",
      tpl.id
    );
    const femboyProseBase = isYuriShowcase
      ? "Crossdressing boy seated on a white futon over tatami mats in a warm ryokan room wearing a navy floral yukata closed over his flat chest while holding a sweet three-color dango skewer."
      : tpl.femboy_prose;
    const femboyProseClean = cfg.enable_t5_prose
      ? `${replaceProseOutfit(femboyProseBase)}${transBg ? " Isolated on a transparent background." : ""}`
      : "";

    const baseLine = joinTags(
      headUsed,
      "2boys, 1.55::yaoi::",
      "rating:explicit, nsfw, uncensored",
      condomBase,
      xrayTags,
      femboyProps,
      femboyFraming,
      useSceneOutfit ? tpl.femboy_tags : stripOnsenSceneGarmentRefs(tpl.femboy_tags),
      femboyProseClean,
      wrapTailNeg(m, femboyGlobalNeg, negOn)
    );

    const char1Line = joinTags(
      "1.45::1boy::, 1.55::otoko no ko::, 1.45::crossdressing::",
      femboyCharCore,
      femboyChestTags,
      femboyWardrobe,
      exprUsed,
      "target#anal",
      negOn ? "-2.5::breasts, pussy, female::" : ""
    );

    const char2Line = joinTags(
      /\bfaceless male\b/i.test(femboyPartner) ? "1boy" : "1boy, tall shirtless faceless male",
      femboyPartner,
      "penis",
      condomPartner,
      "source#anal",
      negOn ? "-2.5::otoko no ko, crossdressing, feminine::" : ""
    );

    return {
      subTitle: `【${tpl.id} · ${tpl.title} · ${catBadge}${lightBadge}${genderBadge}${condomBadge}${xrayBadge}】`,
      canvas: tpl.canvas,
      prompt: `[Base Prompt]\n${baseLine}\n\n[Character 1 (B3)]\n${char1Line}\n\n[Character 2 (D3)]\n${char2Line}`,
    };
  }

  // --------------------------------------------------------------------------
  // MODE 3: Male-on-Futa Multi-Box (futa_no_balls / futa_with_balls across 32 Duo)
  // --------------------------------------------------------------------------
  if (genderMode === "futa_no_balls" || genderMode === "futa_with_balls") {
    const withBalls = genderMode === "futa_with_balls";
    const futaMorph = withBalls
      ? "1.6::futanari::, 1.45::futa with balls::, 1.45::small penis::, 1.4::erect penis::, 1.3::small testicles::, testicles"
      : "1.6::futanari::, 1.5::futa without balls::, 1.45::small penis::, 1.4::erect penis::";

    const futaAction = splitTopLevelCommaSegments(tpl.futa_tags)
      .filter((tok) => {
        const bare = stripWeightPrefix(tok);
        return (
          Boolean(bare) &&
          bare !== "small penis" &&
          bare !== "small testicles" &&
          bare !== "testicles" &&
          bare !== "balls" &&
          bare !== "labia" &&
          bare !== "spread pussy"
        );
      })
      .join(", ");

    const futaFraming = tpl.framing_tags.replace(/of two girls\s*/gi, "").replace(/\btwo girls\b/gi, "two partners");
    const futaPartner = tpl.onsen_partner_tags || "shirtless faceless male behind her";
    const futaWardrobe = useSceneOutfit ? tpl.builtin_outfit : outfitTagsFromLeft;

    const condomBase = condomOn ? "1.4::condom::, 1.35::cum in condom::" : "";
    const condomPartner = condomOn ? "1.35::condom on penis::" : "";
    const xrayTags = wantAuxXray
      ? "1.45::x-ray::, 1.4::cross-section::, 1.45::uterus::, cervix, 1.45::cum in uterus::"
      : "";
    const xrayNeg = wantAuxXray
      ? "fetus, baby, embryo, skeleton, bones, medical diagram, gore"
      : "x-ray, cross-section, cutaway, uterus";

    const futaGlobalNeg = fitOnsenNeg(
      joinTags(
        "2boys, yaoi, otoko no ko, crossdressing, male chest, huge penis, large penis, oversized penis, hyper penis, monster penis, giant penis, 2girls",
        charHasFlatChest ? "" : "flat chest",
        withBalls ? "huge testicles, large testicles" : "testicles, balls, scrotum",
        mirrorGuard,
        chestNeg,
        onsenUndergarmentBan,
        onsenLightNeg,
        onsenBarefootBan,
        duoAnatomyNeg,
        footGuard,
        tpl.extra_neg || "",
        xrayNeg,
        landscapeGuard,
        transNeg,
        baseTailNeg
      )
    );

    const exprUsed = exprIf(cfg, tpl.onsen_expr_tags || "", "", tpl.id);
    const futaProseBase = isYuriShowcase
      ? "Futanari girl seated on a white futon over tatami mats in a warm ryokan room wearing a navy floral yukata closed over her chest while holding a sweet three-color dango skewer."
      : tpl.futa_prose;
    const futaProseClean = cfg.enable_t5_prose
      ? `${replaceProseOutfit(futaProseBase)}${transBg ? " Isolated on a transparent background." : ""}`
      : "";

    const baseLine = joinTags(
      headUsed,
      "1girl, 1boy, hetero, 1.55::futanari::",
      "rating:explicit, nsfw, uncensored",
      condomBase,
      xrayTags,
      envAndProps,
      futaFraming,
      useSceneOutfit ? futaAction : stripOnsenSceneGarmentRefs(futaAction),
      futaProseClean,
      wrapTailNeg(m, futaGlobalNeg, negOn)
    );

    const char1Line = joinTags(
      "1girl",
      charCoreUsed,
      futaMorph,
      futaWardrobe,
      exprUsed,
      "target#vaginal"
    );

    const char2Line = joinTags(
      /\bfaceless male\b/i.test(futaPartner) ? "1boy" : "1boy, tall shirtless faceless male",
      futaPartner,
      "penis",
      condomPartner,
      "source#vaginal",
      negOn ? "-2.5::futanari, breasts, feminine::" : ""
    );

    return {
      subTitle: `【${tpl.id} · ${tpl.title} · ${catBadge}${lightBadge}${genderBadge}${condomBadge}${xrayBadge}】`,
      canvas: tpl.canvas,
      prompt: `[Base Prompt]\n${baseLine}\n\n[Character 1 (B3)]\n${char1Line}\n\n[Character 2 (D3)]\n${char2Line}`,
    };
  }

  // --------------------------------------------------------------------------
  // MODE 4: Normal Female x Male Partner (Single-Box on 31 non-Yuri Duo scenes)
  // --------------------------------------------------------------------------
  const femaleWardrobe = useSceneOutfit ? tpl.builtin_outfit : outfitTagsFromLeft;
  const condomTags = condomOn
    ? "1.4::condom::, 1.35::condom on penis::, 1.35::cum in condom::"
    : "";
  const xrayTags = wantAuxXray
    ? "1.45::x-ray::, 1.4::cross-section::, 1.45::uterus::, cervix, 1.45::cum in uterus::"
    : "";
  const xrayNeg = wantAuxXray
    ? "fetus, baby, embryo, skeleton, bones, medical diagram, gore"
    : "x-ray, cross-section, cutaway, uterus";

  const normalNeg = fitOnsenNeg(
    joinTags(
      "2boys, yaoi, futanari, otoko no ko, multiple boys, 2girls",
      charHasFlatChest ? "" : "flat chest",
      mirrorGuard,
      chestNeg,
      onsenUndergarmentBan,
      onsenLightNeg,
      onsenBarefootBan,
      duoAnatomyNeg,
      footGuard,
      tpl.extra_neg || "",
      xrayNeg,
      landscapeGuard,
      transNeg,
      baseTailNeg
    )
  );

  const exprUsed = exprIf(cfg, tpl.onsen_expr_tags || "", "", tpl.id);
  const femaleProseClean = cfg.enable_t5_prose
    ? `${replaceProseOutfit(tpl.female_prose)}${transBg ? " Isolated on a transparent background." : ""}`
    : "";

  const pNormal = joinTags(
    headUsed,
    "1girl, 1boy, hetero, faceless male",
    "rating:explicit, nsfw, uncensored",
    condomTags,
    xrayTags,
    charCoreUsed,
    femaleWardrobe,
    envAndProps,
    tpl.framing_tags,
    tpl.onsen_partner_tags || "",
    exprUsed,
    useSceneOutfit ? tpl.female_tags : stripOnsenSceneGarmentRefs(tpl.female_tags),
    femaleProseClean,
    wrapTailNeg(m, normalNeg, negOn)
  );
  return {
    subTitle: `【${tpl.id} · ${tpl.title} · ${catBadge}${lightBadge}${condomBadge}${xrayBadge}】`,
    canvas: tpl.canvas,
    prompt: pNormal,
  };
}

function compilePhotoSubstituteScenePrompt(opts: {
  tpl: (typeof OTHER_ACTION_TEMPLATES)[string];
  cfg: CharacterConfig;
  m: Record<string, string>;
  headUsed: string;
  charCoreUsed: string;
  charHasFlatChest: boolean;
  genderMode: CharacterGenderMode;
  genderBadge: string;
  useSceneOutfit: boolean;
  outfitTagsFromLeft: string;
  transBg: boolean;
  transNeg: string;
  sfSceneLightTags: string;
  isExplicitDedicatedLight?: boolean;
  baseTailNeg: string;
  negOn: boolean;
}): ScenePromptItem {
  const {
    tpl,
    cfg,
    m,
    headUsed,
    charCoreUsed,
    charHasFlatChest,
    genderMode,
    genderBadge,
    useSceneOutfit,
    outfitTagsFromLeft,
    transBg,
    transNeg,
    sfSceneLightTags,
    isExplicitDedicatedLight,
    baseTailNeg,
    negOn,
  } = opts;

  const isMultiBoxAnchor = Boolean(tpl.is_multibox_photo_anchor);
  const isAfterSexBellyPress = Boolean(tpl.is_aftersex_belly_press);
  const stageKind = tpl.photo_substitute_stage ?? "missionary_intact";
  const wantAuxXray = Boolean(cfg.enable_uterus_xray);
  const condomOn = Boolean(cfg.enable_condom);
  const chestCoveredActive = Boolean(tpl.chest_covered && useSceneOutfit);
  const chestNeg = chestCoveredActive ? "nipples, areolae" : "";

  const photoSpec = resolveContrastingPhotoPortrait(
    m.char_id || cfg.char_tag || "",
    cfg.extra_char_tags || ""
  );
  const supineProbe = `${m.char_id || cfg.char_tag || ""} ${cfg.extra_char_tags || ""}`.toLowerCase();

  // Build C1 anti-bleed negative counterweight for PS02 Multi-Box without contradicting supine traits
  const rawC1BleedItems = photoSpec.c1_anti_bleed_neg
    .replace(/^-2\.5::([\s\S]+?)::$/, "$1")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s && !supineProbe.includes(s.toLowerCase()));
  const safeC1AntiBleedNeg =
    rawC1BleedItems.length > 0 ? `-2.5::${rawC1BleedItems.join(", ")}::` : "";

  const envAndProps = transBg
    ? joinTags(
        "2.0::transparent background::, has alpha, alpha transparency, no background",
        tpl.core_prop_tags || ""
      )
    : joinTags(tpl.env_tags, sfSceneLightTags, tpl.core_prop_tags || "");

  // Preserve stage lower-face/tears anchor below the photo border while appending non-eye expression overrides
  const basePhotoExpr = tpl.photo_substitute_expr_tags || "";
  const overrideExpr = isExpressionOverrideActive(cfg) ? exprIf(cfg, "", "", tpl.id) : "";
  const exprUsed = splitTopLevelCommaSegments(joinTags(basePhotoExpr, overrideExpr))
    .filter((seg) => {
      const bare = stripWeightPrefix(seg);
      return Boolean(bare) && !/\beyes\b|\bpupils\b|\beyelashes\b|\bjitome\b/i.test(bare);
    })
    .join(", ");

  const lightBadge = transBg
    ? " · [🏁透明底]"
    : isExplicitDedicatedLight
      ? ""
      : ` · [${tpl.light_badge}]`;
  const condomBadge = condomOn
    ? isAfterSexBellyPress
      ? " · [🛡️事后脱套]"
      : " · [🛡️安全套]"
    : "";
  const xrayBadge = wantAuxXray ? " · [🔬内部透视]" : "";
  const catBadge = `📸替身盖照·${photoSpec.short_zh}`;

  const handAndLegNeg = isAfterSexBellyPress
    ? "extra hands, 4 hands, extra fingers, bad hands, mutated hands, extra legs, 3 legs, gaping, censor, mosaic censoring, bar censor, mirror, mirror selfie, smartphone, cellphone"
    : "extra hands, 3 hands, extra fingers, bad hands, mutated hands, extra legs, 3 legs, gaping, censor, mosaic censoring, bar censor, mirror, mirror selfie, smartphone, cellphone";

  // Hard invariant: NEVER allow bare `2girls` on PS01..PS04, and NEVER allow `male torso` on PS04
  const fitPhotoSubNeg = (rawNeg: string): string => {
    const dedup = deduplicateCommaTags(rawNeg)
      .split(",")
      .map((s) => s.trim())
      .filter((s) => {
        if (!s) return false;
        const low = s.toLowerCase();
        if (low === "2girls") return false;
        if (isAfterSexBellyPress && low === "male torso") return false;
        return true;
      })
      .join(", ");
    if (encodeT5Len(dedup) <= 435) return dedup;
    const parts = dedup.split(",").map((s) => s.trim()).filter(Boolean);
    while (parts.length > 20 && encodeT5Len(parts.join(", ")) > 435) {
      parts.pop();
    }
    return parts.join(", ");
  };

  const condomTags = condomOn
    ? isAfterSexBellyPress
      ? "1.65::used condom::, cum-filled condom on bedsheet, 1.45::cum in condom::"
      : "1.4::condom::, 1.35::condom on penis::, 1.35::cum in condom::"
    : "";
  const condomNeg = condomOn && isAfterSexBellyPress ? "condom on penis" : "";

  const xrayTags = wantAuxXray
    ? genderMode === "femboy"
      ? "1.45::x-ray::, 1.4::cross-section::, 1.5::intestines::, 1.5::cum in ass::, internal cumshot"
      : "1.45::x-ray::, 1.4::cross-section::, 1.45::uterus::, cervix, 1.45::cum in uterus::"
    : "";
  const xrayNeg = wantAuxXray
    ? genderMode === "femboy"
      ? "fetus, baby, embryo, skeleton, bones, skull, ribcage, medical diagram, gore, uterus, cervix, womb"
      : "fetus, baby, embryo, skeleton, bones, medical diagram, gore"
    : "x-ray, cross-section, cutaway, uterus";

  const possPronoun = genderMode === "femboy" ? "his" : "her";
  const outfitProsePhrase = useSceneOutfit
    ? stageKind === "missionary_climax_unbuttoned"
      ? `in a disheveled unbuttoned navy-and-white frilly maid dress`
      : stageKind === "aftersex_belly_press"
        ? `with ${possPronoun} navy-and-white frilly maid dress pushed high up to ${possPronoun} chest exposing ${possPronoun} bare belly`
        : `in a navy-and-white cold-shoulder frilly maid dress with ${possPronoun} skirt pushed up around ${possPronoun} waist`
    : cfg.enable_outfit && m.front_shirt_prose
      ? m.front_shirt_prose.trim()
      : "completely nude";

  const buildStageProse = (): string => {
    if (!cfg.enable_t5_prose) return "";
    const transTail = transBg ? " Isolated on a transparent background." : "";
    if (stageKind === "missionary_multibox") {
      return `Top-down first-person missionary POV of ${m.name} lying on a white pillow ${outfitProsePhrase}, while a square white-bordered printed portrait photograph of ${photoSpec.prose_desc} rests flat over ${m.name}'s face covering ${possPronoun} eyes so only ${possPronoun} open moaning mouth peeks out below the photo edge.${transTail}`;
    }
    if (stageKind === "missionary_climax_unbuttoned") {
      return `Top-down first-person missionary POV of ${m.name} climaxing on a white pillow ${outfitProsePhrase}, while an askew square white-bordered printed photograph covering ${possPronoun} eyes shows a smiling close-up portrait of ${photoSpec.prose_desc} as hot tears stream from beneath ${photoSpec.eng_name}'s cheerful photo past ${m.name}'s gasping mouth.${transTail}`;
    }
    if (stageKind === "aftersex_belly_press") {
      return `Top-down post-coital POV of exhausted ${m.name} lying limp on a white pillow ${outfitProsePhrase} with a square white-bordered smiling portrait photo of ${photoSpec.prose_desc} covering ${possPronoun} eyes, as a continuous tanned male arm extends from the bottom edge of the frame to press firmly flat onto ${possPronoun} bare lower abdomen below ${possPronoun} navel, squeezing a thick gushing stream of white cum out onto the bedsheet.${transTail}`;
    }
    return `Top-down first-person missionary POV looking down at ${m.name} lying on a white pillow ${outfitProsePhrase}, while a tilted square white-bordered printed portrait photograph resting flat over ${possPronoun} face covering ${possPronoun} eyes shows a close-up portrait of ${photoSpec.prose_desc}, leaving only ${m.name}'s flushed chin and small open gasping mouth visible beneath the photo's bottom border.${transTail}`;
  };

  // ==========================================================================
  // BRANCH A: PS02 Multi-Box [Character 1 (C3) Body + Character 2 (C2) Photo]
  // ==========================================================================
  if (isMultiBoxAnchor) {
    const char2PhotoLine = joinTags(
      "printed portrait inside white-bordered 1.75::photograph::",
      "resting flat on top of face",
      `1.45::${photoSpec.char_tag}::`,
      photoSpec.trait_tags,
      "head and neck portrait photo only, flat paper photo print",
      negOn ? photoSpec.c2_anti_bleed_neg : ""
    );

    if (genderMode === "femboy") {
      const femboyCharCore = splitTopLevelCommaSegments(charCoreUsed)
        .map((tok) => {
          const bare = stripWeightPrefix(tok);
          if (bare === "short female") return "1.25::short male::";
          if (
            bare === "small breasts" ||
            bare === "medium breasts" ||
            bare === "large breasts" ||
            bare === "huge breasts" ||
            bare === "flat chest" ||
            bare === "breasts" ||
            bare === "female" ||
            bare === "1girl"
          ) {
            return "";
          }
          return tok;
        })
        .filter(Boolean)
        .join(", ");
      const femboyWardrobe = useSceneOutfit
        ? tpl.femboy_outfit || tpl.builtin_outfit
        : outfitTagsFromLeft;
      const femboyChest = chestCoveredActive
        ? "1.55::flat chest::, 1.4::flat male chest::, hairless torso"
        : "1.55::flat chest::, 1.4::flat male chest::, tiny pink nipples, hairless torso";
      const femboyNeg = fitPhotoSubNeg(
        joinTags(
          "2boys lying together, female body, breasts, small breasts, medium breasts, large breasts, cleavage, pussy, vulva, labia, vaginal, uterus, cervix, futanari, muscular male, bara, facial hair, huge penis, large penis",
          PHOTO_SUBSTITUTE_GUARD_UC,
          chestNeg,
          handAndLegNeg,
          tpl.extra_neg || "",
          condomNeg,
          xrayNeg,
          transNeg,
          baseTailNeg
        )
      );
      const baseLine = joinTags(
        headUsed,
        "1.45::1boy::, pov crotch, penis",
        "rating:explicit, nsfw, uncensored",
        envAndProps,
        tpl.framing_tags,
        "1.55::anal::, anal insertion, 1.5::cum in ass::",
        condomTags,
        xrayTags,
        buildStageProse(),
        wrapTailNeg(m, femboyNeg, negOn)
      );
      const char1Line = joinTags(
        "1.45::1boy::, 1.55::otoko no ko::, 1.45::crossdressing::, 1.35::genderbend::",
        femboyCharCore,
        femboyChest,
        "1.7::covered face::, 1.65::covered eyes::, upper face hidden under photograph",
        exprUsed,
        femboyWardrobe,
        "1.4::small penis::, hands gripping bedsheet, legs spread, target#anal",
        negOn ? "-2.5::breasts, pussy, female::" : ""
      );
      return {
        subTitle: `【${tpl.id} · ${tpl.title} · ${catBadge}${lightBadge}${genderBadge}${condomBadge}${xrayBadge}】`,
        canvas: tpl.canvas,
        prompt: `[Base Prompt]\n${baseLine}\n\n[Character 1 (C3)]\n${char1Line}\n\n[Character 2 (C2)]\n${char2PhotoLine}`,
      };
    }

    if (genderMode === "futa_no_balls" || genderMode === "futa_with_balls") {
      const withBalls = genderMode === "futa_with_balls";
      const futaMorph = withBalls
        ? "1.6::futanari::, 1.45::futa with balls::, 1.45::small penis::, 1.3::small testicles::, testicles"
        : "1.6::futanari::, 1.5::futa without balls::, 1.45::small penis::";
      const futaWardrobe = useSceneOutfit ? tpl.builtin_outfit : outfitTagsFromLeft;
      const futaNeg = fitPhotoSubNeg(
        joinTags(
          "2boys, yaoi, otoko no ko, crossdressing, male chest, huge penis, large penis, oversized penis, hyper penis, monster penis, giant penis",
          charHasFlatChest ? "" : "flat chest",
          withBalls ? "huge testicles, large testicles" : "testicles, balls, scrotum",
          PHOTO_SUBSTITUTE_GUARD_UC,
          chestNeg,
          handAndLegNeg,
          tpl.extra_neg || "",
          condomNeg,
          xrayNeg,
          transNeg,
          baseTailNeg
        )
      );
      const baseLine = joinTags(
        headUsed,
        "1girl, 1boy, hetero, 1.55::futanari::",
        "rating:explicit, nsfw, uncensored",
        envAndProps,
        tpl.framing_tags,
        "pov crotch, penis, 1.5::vaginal::, insertion, 1.5::cum overflow::",
        condomTags,
        xrayTags,
        buildStageProse(),
        wrapTailNeg(m, futaNeg, negOn)
      );
      const char1Line = joinTags(
        "1girl",
        charCoreUsed,
        futaMorph,
        "1.7::covered face::, 1.65::covered eyes::, upper face hidden under photograph",
        exprUsed,
        futaWardrobe,
        "hands gripping bedsheet, legs spread, target#vaginal",
        negOn ? safeC1AntiBleedNeg : ""
      );
      return {
        subTitle: `【${tpl.id} · ${tpl.title} · ${catBadge}${lightBadge}${genderBadge}${condomBadge}${xrayBadge}】`,
        canvas: tpl.canvas,
        prompt: `[Base Prompt]\n${baseLine}\n\n[Character 1 (C3)]\n${char1Line}\n\n[Character 2 (C2)]\n${char2PhotoLine}`,
      };
    }

    // PS02 Normal Female
    const normalWardrobe = useSceneOutfit ? tpl.builtin_outfit : outfitTagsFromLeft;
    const normalMultiNeg = fitPhotoSubNeg(
      joinTags(
        "2boys, yaoi, futanari, otoko no ko, multiple boys",
        charHasFlatChest ? "" : "flat chest",
        PHOTO_SUBSTITUTE_GUARD_UC,
        chestNeg,
        handAndLegNeg,
        tpl.extra_neg || "",
        condomNeg,
        xrayNeg,
        transNeg,
        baseTailNeg
      )
    );
    const baseLine = joinTags(
      headUsed,
      "1girl, 1boy, hetero",
      "rating:explicit, nsfw, uncensored",
      envAndProps,
      tpl.framing_tags,
      "pov crotch, penis, 1.55::vaginal::, insertion, 1.5::cum overflow::",
      condomTags,
      xrayTags,
      buildStageProse(),
      wrapTailNeg(m, normalMultiNeg, negOn)
    );
    const char1Line = joinTags(
      "1girl",
      charCoreUsed,
      "1.7::covered face::, 1.65::covered eyes::, upper face hidden under photograph",
      exprUsed,
      normalWardrobe,
      "hands gripping bedsheet, legs spread, target#vaginal",
      negOn ? safeC1AntiBleedNeg : ""
    );
    return {
      subTitle: `【${tpl.id} · ${tpl.title} · ${catBadge}${lightBadge}${condomBadge}${xrayBadge}】`,
      canvas: tpl.canvas,
      prompt: `[Base Prompt]\n${baseLine}\n\n[Character 1 (C3)]\n${char1Line}\n\n[Character 2 (C2)]\n${char2PhotoLine}`,
    };
  }

  // ==========================================================================
  // BRANCH B: PS01, PS03, PS04 Single-Box + T5 Spatial Containment Prose
  // ==========================================================================
  const photoInlineTags = `smiling portrait of 1.35::${photoSpec.char_tag}::, ${photoSpec.trait_tags}`;

  if (genderMode === "femboy") {
    const femboyCharCore = splitTopLevelCommaSegments(charCoreUsed)
      .map((tok) => {
        const bare = stripWeightPrefix(tok);
        if (bare === "short female") return "1.25::short male::";
        if (
          bare === "small breasts" ||
          bare === "medium breasts" ||
          bare === "large breasts" ||
          bare === "huge breasts" ||
          bare === "flat chest" ||
          bare === "breasts" ||
          bare === "female" ||
          bare === "1girl"
        ) {
          return "";
        }
        return tok;
      })
      .filter(Boolean)
      .join(", ");
    const femboyActor = isAfterSexBellyPress
      ? "1.45::1boy::, 1.55::otoko no ko::, 1.45::crossdressing::, 1.35::genderbend::, 1.25::short male::, 1.55::flat chest::, 1.4::flat male chest::, hairless torso"
      : chestCoveredActive
        ? "1.45::1boy::, 2boys, 1.55::yaoi::, faceless male, 1.55::otoko no ko::, 1.45::crossdressing::, 1.35::genderbend::, 1.25::short male::, 1.55::flat chest::, 1.4::flat male chest::, hairless torso"
        : "1.45::1boy::, 2boys, 1.55::yaoi::, faceless male, 1.55::otoko no ko::, 1.45::crossdressing::, 1.35::genderbend::, 1.25::short male::, 1.55::flat chest::, 1.4::flat male chest::, tiny pink nipples, hairless torso";
    const femboyWardrobe = useSceneOutfit
      ? tpl.femboy_outfit || tpl.builtin_outfit
      : outfitTagsFromLeft;
    const femboyNeg = fitPhotoSubNeg(
      joinTags(
        "female body, breasts, small breasts, medium breasts, large breasts, cleavage, pussy, vulva, labia, vaginal, uterus, cervix, futanari, muscular male, bara, facial hair, huge penis, large penis",
        PHOTO_SUBSTITUTE_GUARD_UC,
        chestNeg,
        handAndLegNeg,
        tpl.extra_neg || "",
        condomNeg,
        xrayNeg,
        transNeg,
        baseTailNeg
      )
    );
    const pFemboy = joinTags(
      headUsed,
      femboyActor,
      "rating:explicit, nsfw, uncensored",
      condomTags,
      xrayTags,
      tpl.framing_tags,
      femboyCharCore,
      envAndProps,
      photoInlineTags,
      exprUsed,
      femboyWardrobe,
      tpl.femboy_tags,
      buildStageProse(),
      wrapTailNeg(m, femboyNeg, negOn)
    );
    return {
      subTitle: `【${tpl.id} · ${tpl.title} · ${catBadge}${lightBadge}${genderBadge}${condomBadge}${xrayBadge}】`,
      canvas: tpl.canvas,
      prompt: pFemboy,
    };
  }

  if (genderMode === "futa_no_balls" || genderMode === "futa_with_balls") {
    const withBalls = genderMode === "futa_with_balls";
    const futaActor = isAfterSexBellyPress
      ? withBalls
        ? "1girl, 1.55::futanari::, 1.45::futa with balls::, 1.45::small penis::, 1.3::small testicles::, testicles"
        : "1girl, 1.55::futanari::, 1.45::futa without balls::, 1.45::small penis::"
      : withBalls
        ? "1girl, 1boy, hetero, faceless male, 1.55::futanari::, 1.45::futa with balls::, 1.45::small penis::, 1.3::small testicles::, testicles"
        : "1girl, 1boy, hetero, faceless male, 1.55::futanari::, 1.45::futa without balls::, 1.45::small penis::";
    const futaAction = splitTopLevelCommaSegments(tpl.futa_tags)
      .filter((tok) => {
        const bare = stripWeightPrefix(tok);
        return (
          Boolean(bare) &&
          bare !== "small penis" &&
          bare !== "small testicles" &&
          bare !== "testicles" &&
          bare !== "balls"
        );
      })
      .join(", ");
    const futaWardrobe = useSceneOutfit ? tpl.builtin_outfit : outfitTagsFromLeft;
    const futaNeg = fitPhotoSubNeg(
      joinTags(
        "2boys, yaoi, otoko no ko, crossdressing, male chest, huge penis, large penis, oversized penis, hyper penis, monster penis, giant penis",
        charHasFlatChest ? "" : "flat chest",
        withBalls ? "huge testicles, large testicles" : "testicles, balls, scrotum",
        PHOTO_SUBSTITUTE_GUARD_UC,
        chestNeg,
        handAndLegNeg,
        tpl.extra_neg || "",
        condomNeg,
        xrayNeg,
        transNeg,
        baseTailNeg
      )
    );
    const pFuta = joinTags(
      headUsed,
      futaActor,
      "rating:explicit, nsfw, uncensored",
      condomTags,
      xrayTags,
      tpl.framing_tags,
      charCoreUsed,
      envAndProps,
      photoInlineTags,
      exprUsed,
      futaWardrobe,
      futaAction,
      buildStageProse(),
      wrapTailNeg(m, futaNeg, negOn)
    );
    return {
      subTitle: `【${tpl.id} · ${tpl.title} · ${catBadge}${lightBadge}${genderBadge}${condomBadge}${xrayBadge}】`,
      canvas: tpl.canvas,
      prompt: pFuta,
    };
  }

  // Normal Female (PS01, PS03, PS04)
  const normalActor = isAfterSexBellyPress
    ? "1girl, hetero"
    : "1girl, 1boy, hetero, faceless male";
  const normalPostSexPenisBan = isAfterSexBellyPress ? "penis, testicles" : "";
  const normalWardrobe = useSceneOutfit ? tpl.builtin_outfit : outfitTagsFromLeft;
  const normalNeg = fitPhotoSubNeg(
    joinTags(
      "2boys, yaoi, futanari, otoko no ko, multiple boys",
      charHasFlatChest ? "" : "flat chest",
      normalPostSexPenisBan,
      PHOTO_SUBSTITUTE_GUARD_UC,
      chestNeg,
      handAndLegNeg,
      tpl.extra_neg || "",
      condomNeg,
      xrayNeg,
      transNeg,
      baseTailNeg
    )
  );
  const pNormal = joinTags(
    headUsed,
    normalActor,
    "rating:explicit, nsfw, uncensored",
    condomTags,
    xrayTags,
    tpl.framing_tags,
    charCoreUsed,
    envAndProps,
    photoInlineTags,
    exprUsed,
    normalWardrobe,
    tpl.female_tags,
    buildStageProse(),
    wrapTailNeg(m, normalNeg, negOn)
  );
  return {
    subTitle: `【${tpl.id} · ${tpl.title} · ${catBadge}${lightBadge}${condomBadge}${xrayBadge}】`,
    canvas: tpl.canvas,
    prompt: pNormal,
  };
}

function compileKitchenDuoScenePrompt(opts: {
  tpl: (typeof OTHER_ACTION_TEMPLATES)[string];
  duo: NonNullable<(typeof OTHER_ACTION_TEMPLATES)[string]["kitchen_duo"]>;
  cfg: CharacterConfig;
  m: Record<string, string>;
  headUsed: string;
  charCoreUsed: string;
  charHasFlatChest: boolean;
  genderMode: CharacterGenderMode;
  genderBadge: string;
  useSceneOutfit: boolean;
  outfitTagsFromLeft: string;
  transBg: boolean;
  transNeg: string;
  sfSceneLightTags: string;
  isExplicitDedicatedLight?: boolean;
  apronOnlyGuard: string;
  kitchenFootGuard: string;
  kitchenBareFootSockBan: string;
  kitchenLandscapeGuard: string;
  baseTailNeg: string;
  negOn: boolean;
}): ScenePromptItem {
  const {
    tpl,
    duo,
    cfg,
    m,
    headUsed,
    charCoreUsed,
    charHasFlatChest,
    genderMode,
    genderBadge,
    useSceneOutfit,
    outfitTagsFromLeft,
    transBg,
    transNeg,
    sfSceneLightTags,
    isExplicitDedicatedLight,
    apronOnlyGuard,
    kitchenFootGuard,
    kitchenBareFootSockBan,
    kitchenLandscapeGuard,
    baseTailNeg,
    negOn,
  } = opts;

  const isBuiltinXray = duo.channel === "builtin_xray";
  const isOral = duo.channel === "oral";
  const isPullOut = duo.channel === "pull_out";
  const wantAuxXray = Boolean(cfg.enable_uterus_xray) && !isBuiltinXray;
  const condomOn = Boolean(cfg.enable_condom);

  const envAndProps = transBg
    ? joinTags(
        "2.0::transparent background::, has alpha, alpha transparency, no background",
        tpl.core_prop_tags || ""
      )
    : joinTags(tpl.env_tags, sfSceneLightTags, tpl.core_prop_tags || "");

  const replaceProseOutfit = (rawProse: string): string => {
    if (useSceneOutfit || !tpl.prose_outfit_phrase) return rawProse;
    let updated = rawProse;
    const altClauses = tpl.prose_outfit_phrase.split("|").filter(Boolean);
    const charWear = cfg.enable_outfit && m.front_shirt_prose ? m.front_shirt_prose.trim() : "";
    for (const cl of altClauses) {
      if (updated.includes(cl)) {
        if (/^Wearing|^Both wearing/i.test(cl)) {
          const capWear = charWear
            ? `${charWear.charAt(0).toUpperCase()}${charWear.slice(1)}, `
            : "";
          updated = updated.replace(cl, capWear);
        } else {
          updated = charWear ? updated.replace(cl, charWear) : updated.replace(cl, "").trim();
        }
      }
    }
    updated = updated.replace(/\s{2,}/g, " ").trim();
    return updated ? `${updated.charAt(0).toUpperCase()}${updated.slice(1)}` : updated;
  };

  const lightBadge = transBg
    ? " · [🏁透明底]"
    : isExplicitDedicatedLight
      ? ""
      : ` · [${tpl.light_badge}]`;
  const condomBadge = condomOn ? " · [🛡️安全套]" : "";
  const xrayBadge = isBuiltinXray || wantAuxXray ? " · [🔬内部透视]" : "";
  const catBadge = tpl.category.startsWith("10.")
    ? "🍱饭菜双人"
    : tpl.category.startsWith("8.")
      ? "⚡厨房干扰"
      : "🍳裸围双人";

  const duoAnatomyNeg =
    "extra hands, 3 hands, extra fingers, bad hands, mutated hands, extra arms, extra legs, fused bodies, gaping, censor, mosaic censoring, bar censor";

  const fitKitchenNeg = (rawNeg: string): string => {
    const dedup = deduplicateCommaTags(rawNeg);
    if (encodeT5Len(dedup) <= 435) return dedup;
    const parts = dedup.split(",").map((s) => s.trim()).filter(Boolean);
    while (parts.length > 20 && encodeT5Len(parts.join(", ")) > 435) {
      parts.pop();
    }
    return parts.join(", ");
  };

  // --------------------------------------------------------------------------
  // MODE 2: Crossdressing Femboy x Shirtless Faceless Male (Multi-Box 2boys)
  // --------------------------------------------------------------------------
  if (genderMode === "femboy") {
    const femboyCharCore = splitTopLevelCommaSegments(m.char_core)
      .map((tok) => {
        const bare = stripWeightPrefix(tok);
        if (bare === "short female") return "1.25::short male::";
        if (
          bare === "small breasts" ||
          bare === "medium breasts" ||
          bare === "large breasts" ||
          bare === "huge breasts" ||
          bare === "flat chest" ||
          bare === "breasts" ||
          bare === "female" ||
          bare === "1girl"
        ) {
          return "";
        }
        return tok;
      })
      .filter(Boolean)
      .join(", ");

    const femboyBaseApron = tpl.footwear_mode
      ? joinTags(FEMBOY_APRON_NO_LEGWEAR, kitchenLegwearTagsFor(tpl.footwear_mode))
      : FEMBOY_NAKED_APRON_CORE;
    const femboyWardrobe = useSceneOutfit
      ? joinTags(femboyBaseApron, duo.apron_detail_femboy)
      : outfitTagsFromLeft;

    const roleTarget = isOral ? "target#oral" : "target#anal";
    const roleSource = isOral ? "source#oral" : "source#anal";

    const condomBaseTags = condomOn
      ? isPullOut
        ? "1.65::used condom::, 1.45::cum in condom::"
        : "1.4::condom::, 1.35::condom on penis::, 1.35::cum in condom::"
      : "";
    const condomPartnerTags = condomOn && !isPullOut ? "condom on penis" : "";
    const condomNeg = condomOn && isPullOut ? "condom on penis" : "";

    const defaultNoXrayNeg =
      tpl.id === "KTD23" ? "x-ray, cross-section, uterus" : "x-ray, cross-section, cutaway, uterus";
    let xrayTags = "";
    let xrayNeg = isBuiltinXray
      ? "fetus, baby, embryo, skeleton, bones, medical diagram, uterus, cervix, womb"
      : defaultNoXrayNeg;
    if (wantAuxXray) {
      xrayTags = isOral
        ? "1.5::x-ray::, 1.45::cross-section::, 1.45::throat bulge::, internal cumshot"
        : "1.5::x-ray::, 1.45::cross-section::, 1.5::intestines::, 1.5::cum in ass::, internal cumshot";
      xrayNeg =
        "fetus, baby, embryo, skeleton, bones, skull, ribcage, medical diagram, gore, uterus, cervix, womb";
    }

    const femboyGlobalNeg = fitKitchenNeg(
      joinTags(
        "1girl, 2girls, female, girl, hetero, breasts, small breasts, medium breasts, large breasts, huge breasts, cleavage, pussy, vulva, labia, vaginal, futanari, uterus, cervix, twins, identical hair, 3boys",
        duoAnatomyNeg,
        kitchenFootGuard,
        kitchenBareFootSockBan,
        tpl.extra_neg || "",
        condomNeg,
        xrayNeg,
        apronOnlyGuard,
        kitchenLandscapeGuard,
        transNeg,
        baseTailNeg
      )
    );

    const femboyProseClean = cfg.enable_t5_prose
      ? `${replaceProseOutfit(tpl.femboy_prose)}${transBg ? " Isolated on a transparent background." : ""}`
      : "";

    const baseLine = joinTags(
      headUsed,
      "2boys, 1.55::yaoi::",
      "rating:explicit, nsfw, uncensored",
      condomBaseTags,
      xrayTags,
      envAndProps,
      duo.femboy_base_action,
      tpl.femboy_tags,
      femboyProseClean,
      wrapTailNeg(m, femboyGlobalNeg, negOn)
    );

    const char1Line = joinTags(
      "1.45::1boy::, 1.55::otoko no ko::, 1.45::crossdressing::, 1.35::genderbend::",
      femboyCharCore,
      "1.55::flat chest::, 1.4::flat male chest::, tiny pink nipples, hairless torso",
      femboyWardrobe,
      duo.femboy_char1_pose,
      roleTarget,
      negOn ? "-2.5::breasts, pussy, female::" : ""
    );

    const char2Line = joinTags(
      tpl.id === "KTD23" ? "1boy, shirtless faceless male" : "1boy, tall shirtless faceless male",
      duo.femboy_char2_pose,
      "penis",
      condomPartnerTags,
      roleSource,
      negOn ? "-2.5::otoko no ko, crossdressing, petite, feminine::" : ""
    );

    const [c1Coord, c2Coord] = duo.femboy_coords;
    const multiPrompt = `[Base Prompt]\n${baseLine}\n\n[Character 1 (${c1Coord})]\n${char1Line}\n\n[Character 2 (${c2Coord})]\n${char2Line}`;

    return {
      subTitle: `【${tpl.id} · ${tpl.title} · ${catBadge}${lightBadge}${genderBadge}${condomBadge}${xrayBadge}】`,
      canvas: tpl.canvas,
      prompt: multiPrompt,
    };
  }

  // --------------------------------------------------------------------------
  // MODE 4: Futa-on-Female Dual Naked-Apron Yuri (Multi-Box 2girls on KTD12/18/34/42/50/52)
  // --------------------------------------------------------------------------
  if (
    (genderMode === "futa_no_balls" || genderMode === "futa_with_balls") &&
    duo.futa_2girls_yuri &&
    duo.futa_yuri_spec
  ) {
    const withBalls = genderMode === "futa_with_balls";
    const spec = duo.futa_yuri_spec;
    const heroLower = `${cfg.char_tag} ${cfg.extra_char_tags}`.toLowerCase();
    const topIdentity =
      heroLower.includes("hood") || heroLower.includes("blonde")
        ? "belfast (azur lane), long silver hair"
        : "hood (azur lane), long blonde hair";

    const topWardrobe = useSceneOutfit ? spec.top_apron_tags : outfitTagsFromLeft;
    const bottomBaseApron = tpl.footwear_mode
      ? joinTags(FEMALE_APRON_NO_LEGWEAR, kitchenLegwearTagsFor(tpl.footwear_mode))
      : FEMALE_NAKED_APRON_CORE;
    const bottomWardrobe = useSceneOutfit
      ? joinTags(bottomBaseApron, "white frilly naked apron", spec.bottom_apron_detail)
      : outfitTagsFromLeft;

    const condomBase = condomOn ? "1.4::condom::, 1.35::condom on penis::, 1.35::cum in condom::" : "";
    const condomTop = condomOn ? "condom on penis" : "";
    const xrayTags = wantAuxXray
      ? "1.45::x-ray::, 1.4::cross-section::, 1.45::uterus::, cervix, 1.45::cum in uterus::"
      : "";
    const xrayNeg = wantAuxXray
      ? "fetus, baby, embryo, skeleton, bones, medical diagram, gore"
      : tpl.id === "KTD23"
        ? "x-ray, cross-section, uterus"
        : "x-ray, cross-section, cutaway, uterus";

    const yuriGlobalNeg = fitKitchenNeg(
      joinTags(
        "1boy, male, 2boys, yaoi, otoko no ko, flat chest, male chest, 1girl, 3girls, twins, identical hair, double penis, two penises, huge penis, large penis, hyper penis",
        withBalls ? "huge testicles, large testicles" : "testicles, balls, scrotum",
        duoAnatomyNeg,
        kitchenFootGuard,
        kitchenBareFootSockBan,
        tpl.extra_neg || "",
        xrayNeg,
        apronOnlyGuard,
        kitchenLandscapeGuard,
        transNeg,
        baseTailNeg
      )
    );

    const rawYuriProse = useSceneOutfit ? spec.prose : spec.prose_no_apron;
    const yuriProseClean = cfg.enable_t5_prose
      ? `${rawYuriProse}${transBg ? " Isolated on a transparent background." : ""}`
      : "";

    const baseLine = joinTags(
      headUsed,
      "2girls, 1.5::futanari::, 1.45::futa on female::, yuri",
      "rating:explicit, nsfw, uncensored",
      condomBase,
      xrayTags,
      envAndProps,
      spec.base_action,
      tpl.futa_tags,
      yuriProseClean,
      wrapTailNeg(m, yuriGlobalNeg, negOn)
    );

    const char1Line = joinTags(
      "1girl",
      topIdentity,
      topWardrobe,
      "1.55::futanari::",
      withBalls
        ? "1.45::futa with balls::, 1.3::small testicles::, testicles"
        : "1.45::futa without balls::",
      spec.top_pose_tags,
      "1.45::small penis::, erection",
      condomTop,
      "source#vaginal",
      negOn ? "-2.5::pussy::" : ""
    );

    const char2Line = joinTags(
      "1girl",
      charCoreUsed,
      bottomWardrobe,
      spec.bottom_pose_tags,
      "1.35::pussy::, target#vaginal",
      negOn ? "-2.5::futanari, penis, testicles::" : ""
    );

    const [c1Coord, c2Coord] = spec.coords;
    const yuriPrompt = `[Base Prompt]\n${baseLine}\n\n[Character 1 (${c1Coord})]\n${char1Line}\n\n[Character 2 (${c2Coord})]\n${char2Line}`;

    return {
      subTitle: `【${tpl.id} · ${tpl.title} · 👯双裸围百合${lightBadge}${genderBadge}${condomBadge}${xrayBadge}】`,
      canvas: tpl.canvas,
      prompt: yuriPrompt,
    };
  }

  // --------------------------------------------------------------------------
  // MODE 3: Male-on-Futa Dual-Line (Single-Box on remaining KTD scenes)
  // --------------------------------------------------------------------------
  if (genderMode === "futa_no_balls" || genderMode === "futa_with_balls") {
    const withBalls = genderMode === "futa_with_balls";
    const rawFutaSegs = splitTopLevelCommaSegments(duo.futa_male_tags);
    const smallPenisSeg =
      rawFutaSegs.find((tok) => stripWeightPrefix(tok) === "small penis") || "1.4::small penis::";
    const futaActor = withBalls
      ? `1girl, 1boy, hetero, faceless male, 1.55::futanari::, 1.45::futa with balls::, ${smallPenisSeg}, 1.3::small testicles::, testicles`
      : `1girl, 1boy, hetero, faceless male, 1.55::futanari::, 1.45::futa without balls::, ${smallPenisSeg}`;

    const futaCoreApron = duo.hide_upper_chest
      ? FEMALE_NAKED_APRON_REAR_ONLY_CORE
      : tpl.footwear_mode
        ? joinTags(FUTA_APRON_NO_LEGWEAR, kitchenLegwearTagsFor(tpl.footwear_mode))
        : FUTA_NAKED_APRON_CORE;
    const futaWardrobe = useSceneOutfit
      ? joinTags(futaCoreApron, duo.apron_detail_female)
      : outfitTagsFromLeft;

    const futaAction = rawFutaSegs
      .filter((tok) => {
        const bare = stripWeightPrefix(tok);
        return (
          Boolean(bare) &&
          bare !== "labia" &&
          bare !== "spread pussy" &&
          bare !== "small penis" &&
          bare !== "small testicles" &&
          bare !== "testicles" &&
          bare !== "balls"
        );
      })
      .join(", ");

    const condomTags = condomOn
      ? isPullOut
        ? "1.75::used condom in pussy::, 1.45::cum in condom::"
        : "1.4::condom::, 1.35::condom on penis::, 1.35::cum in condom::"
      : "";
    const condomNeg = condomOn && isPullOut ? "condom on penis" : "";

    const xrayTags = wantAuxXray
      ? isOral
        ? "1.5::x-ray::, 1.45::cross-section::, 1.45::throat bulge::, internal cumshot"
        : "1.45::x-ray::, 1.4::cross-section::, 1.45::uterus::, cervix, 1.45::cum in uterus::"
      : "";
    const xrayNeg =
      isBuiltinXray || wantAuxXray
        ? "fetus, baby, embryo, skeleton, bones, medical diagram, gore"
        : tpl.id === "KTD23"
          ? "x-ray, cross-section, uterus"
          : "x-ray, cross-section, cutaway, uterus";

    const futaNeg = fitKitchenNeg(
      joinTags(
        "2boys, yaoi, otoko no ko, crossdressing, male chest, huge penis, large penis, oversized penis, hyper penis, monster penis, giant penis, 2girls",
        charHasFlatChest ? "" : "flat chest",
        withBalls ? "huge testicles, large testicles" : "testicles, balls, scrotum",
        duoAnatomyNeg,
        kitchenFootGuard,
        kitchenBareFootSockBan,
        tpl.extra_neg || "",
        condomNeg,
        xrayNeg,
        apronOnlyGuard,
        kitchenLandscapeGuard,
        transNeg,
        baseTailNeg
      )
    );

    const exprUsed = duo.hide_upper_chest ? duo.single_expr_tags : exprIf(cfg, duo.single_expr_tags, "", tpl.id);
    const futaProseClean = cfg.enable_t5_prose
      ? `${replaceProseOutfit(tpl.futa_prose)}${transBg ? " Isolated on a transparent background." : ""}`
      : "";

    const pFuta = joinTags(
      headUsed,
      futaActor,
      charCoreUsed,
      futaWardrobe,
      envAndProps,
      tpl.framing_tags,
      duo.single_partner_tags,
      exprUsed,
      "rating:explicit, nsfw, uncensored",
      futaAction,
      condomTags,
      xrayTags,
      futaProseClean,
      wrapTailNeg(m, futaNeg, negOn)
    );

    return {
      subTitle: `【${tpl.id} · ${tpl.title} · ${catBadge}${lightBadge}${genderBadge}${condomBadge}${xrayBadge}】`,
      canvas: tpl.canvas,
      prompt: pFuta,
    };
  }

  // --------------------------------------------------------------------------
  // MODE 1: Normal Female Heroine x Shirtless Faceless Male (Single-Box)
  // --------------------------------------------------------------------------
  const femaleCoreApron = duo.hide_upper_chest
    ? FEMALE_NAKED_APRON_REAR_ONLY_CORE
    : tpl.footwear_mode
      ? joinTags(FEMALE_APRON_NO_LEGWEAR, kitchenLegwearTagsFor(tpl.footwear_mode))
      : FEMALE_NAKED_APRON_CORE;
  const femaleWardrobe = useSceneOutfit
    ? joinTags(femaleCoreApron, duo.apron_detail_female)
    : outfitTagsFromLeft;

  const condomTags = condomOn
    ? isPullOut
      ? "1.75::used condom in pussy::, 1.45::cum in condom::"
      : "1.4::condom::, 1.35::condom on penis::, 1.35::cum in condom::"
    : "";
  const condomNeg = condomOn && isPullOut ? "condom on penis" : "";

  const xrayTags = wantAuxXray
    ? isOral
      ? "1.5::x-ray::, 1.45::cross-section::, 1.45::throat bulge::, internal cumshot"
      : "1.45::x-ray::, 1.4::cross-section::, 1.45::uterus::, cervix, 1.45::cum in uterus::"
    : "";
  const xrayNeg =
    isBuiltinXray || wantAuxXray
      ? "fetus, baby, embryo, skeleton, bones, medical diagram, gore"
      : "x-ray, cross-section, cutaway, uterus";

  const normalNeg = fitKitchenNeg(
    joinTags(
      "2boys, yaoi, futanari, otoko no ko, multiple boys, 2girls",
      charHasFlatChest ? "" : "flat chest",
      duoAnatomyNeg,
      kitchenFootGuard,
      kitchenBareFootSockBan,
      tpl.extra_neg || "",
      condomNeg,
      xrayNeg,
      apronOnlyGuard,
      kitchenLandscapeGuard,
      transNeg,
      baseTailNeg
    )
  );

  const exprUsed = duo.hide_upper_chest ? duo.single_expr_tags : exprIf(cfg, duo.single_expr_tags, "", tpl.id);
  const femaleProseClean = cfg.enable_t5_prose
    ? `${replaceProseOutfit(tpl.female_prose)}${transBg ? " Isolated on a transparent background." : ""}`
    : "";

  const pNormal = joinTags(
    headUsed,
    "1girl, 1boy, hetero, faceless male",
    charCoreUsed,
    femaleWardrobe,
    envAndProps,
    tpl.framing_tags,
    duo.single_partner_tags,
    exprUsed,
    "rating:explicit, nsfw, uncensored",
    tpl.female_tags,
    condomTags,
    xrayTags,
    femaleProseClean,
    wrapTailNeg(m, normalNeg, negOn)
  );

  return {
    subTitle: `【${tpl.id} · ${tpl.title} · ${catBadge}${lightBadge}${condomBadge}${xrayBadge}】`,
    canvas: tpl.canvas,
    prompt: pNormal,
  };
}

function compileSpecimenDuoScenePrompt(opts: {
  tpl: (typeof OTHER_ACTION_TEMPLATES)[string];
  duo: NonNullable<(typeof OTHER_ACTION_TEMPLATES)[string]["specimen_duo"]>;
  cfg: CharacterConfig;
  m: Record<string, string>;
  headUsed: string;
  charCoreUsed: string;
  charHasFlatChest: boolean;
  genderMode: CharacterGenderMode;
  genderBadge: string;
  useSceneOutfit: boolean;
  outfitTagsFromLeft: string;
  transBg: boolean;
  transNeg: string;
  sfSceneLightTags: string;
  isExplicitDedicatedLight?: boolean;
  specimenOutfitGuard: string;
  footGuard: string;
  landscapeGuard: string;
  baseTailNeg: string;
  negOn: boolean;
}): ScenePromptItem {
  const {
    tpl,
    duo,
    cfg,
    m,
    headUsed,
    charCoreUsed,
    charHasFlatChest,
    genderMode,
    genderBadge,
    useSceneOutfit,
    outfitTagsFromLeft,
    transBg,
    transNeg,
    sfSceneLightTags,
    isExplicitDedicatedLight,
    specimenOutfitGuard,
    footGuard,
    landscapeGuard,
    baseTailNeg,
    negOn,
  } = opts;

  const wantAuxXray = Boolean(cfg.enable_uterus_xray) && !tpl.builtin_xray;
  const condomOn = Boolean(cfg.enable_condom);

  const envAndProps = transBg
    ? joinTags(
        "2.0::transparent background::, has alpha, alpha transparency, no background",
        tpl.core_prop_tags || ""
      )
    : joinTags(tpl.env_tags, sfSceneLightTags, tpl.core_prop_tags || "");

  const lightBadge = transBg
    ? " · [🏁透明底]"
    : isExplicitDedicatedLight
      ? ""
      : ` · [${tpl.light_badge}]`;
  const condomBadge = condomOn ? " · [🛡️安全套]" : "";
  const xrayBadge = tpl.builtin_xray
    ? " · [🔬内置透视]"
    : wantAuxXray
      ? " · [🔬内部透视]"
      : "";
  const catBadge = "🧪双人采精";

  const duoAnatomyNeg =
    "extra hands, 3 hands, extra fingers, bad hands, mutated hands, extra arms, extra legs, fused bodies, gaping, censor, mosaic censoring, bar censor";

  const fitSpecimenNeg = (rawNeg: string): string => {
    const dedup = deduplicateCommaTags(rawNeg);
    if (encodeT5Len(dedup) <= 435) return dedup;
    const parts = dedup.split(",").map((s) => s.trim()).filter(Boolean);
    while (parts.length > 20 && encodeT5Len(parts.join(", ")) > 435) {
      parts.pop();
    }
    return parts.join(", ");
  };

  // --------------------------------------------------------------------------
  // MODE 2: Crossdressing Femboy x Standing Male Partner (Multi-Box 2boys)
  // --------------------------------------------------------------------------
  if (genderMode === "femboy") {
    const femboyCharCore = splitTopLevelCommaSegments(m.char_core)
      .map((tok) => {
        const bare = stripWeightPrefix(tok);
        if (bare === "short female") return "1.25::short male::";
        if (
          bare === "small breasts" ||
          bare === "medium breasts" ||
          bare === "large breasts" ||
          bare === "huge breasts" ||
          bare === "flat chest" ||
          bare === "breasts" ||
          bare === "female" ||
          bare === "1girl"
        ) {
          return "";
        }
        return tok;
      })
      .filter(Boolean)
      .join(", ");

    const femboyOutfitLeft = splitTopLevelCommaSegments(outfitTagsFromLeft)
      .filter((tok) => {
        const bare = stripWeightPrefix(tok);
        return (
          Boolean(bare) &&
          bare !== "bare breasts" &&
          bare !== "breasts" &&
          bare !== "cleavage" &&
          bare !== "bra" &&
          bare !== "pasties" &&
          bare !== "heart pasties" &&
          bare !== "rabbit tail"
        );
      })
      .join(", ");

    const femboyWardrobe = useSceneOutfit
      ? tpl.femboy_outfit || tpl.builtin_outfit
      : femboyOutfitLeft;
    const exprUsed = exprIf(cfg, duo.expr_tags, "", tpl.id);

    const condomBase = condomOn ? "1.4::condom::, 1.35::cum in condom::" : "";
    const condomPartner = condomOn ? "1.35::condom on penis::" : "";
    const xrayTags = wantAuxXray
      ? "1.45::x-ray::, 1.4::cross-section::, 1.5::intestines::, 1.5::cum in ass::, internal cumshot"
      : "";
    const xrayNeg =
      tpl.builtin_xray || wantAuxXray
        ? "fetus, baby, embryo, skeleton, bones, skull, ribcage, medical diagram, gore, uterus, cervix, womb"
        : "x-ray, cross-section, cutaway, uterus";

    const femboyGlobalNeg = fitSpecimenNeg(
      joinTags(
        "1girl, 2girls, female, girl, hetero, breasts, small breasts, medium breasts, large breasts, cleavage, pussy, vulva, vaginal, uterus, cervix, futanari, twins, identical hair, 3boys, multiple boys",
        duoAnatomyNeg,
        specimenOutfitGuard,
        footGuard,
        tpl.extra_neg || "",
        xrayNeg,
        landscapeGuard,
        transNeg,
        baseTailNeg
      )
    );

    const femboyProseClean = cfg.enable_t5_prose
      ? `${tpl.femboy_prose}${transBg ? " Isolated on a transparent background." : ""}`
      : "";

    const baseLine = joinTags(
      headUsed,
      "2boys, 1.55::yaoi::",
      "rating:explicit, nsfw, uncensored",
      condomBase,
      xrayTags,
      envAndProps,
      tpl.framing_tags,
      tpl.femboy_tags,
      femboyProseClean,
      wrapTailNeg(m, femboyGlobalNeg, negOn)
    );
    const char1Line = joinTags(
      "1.45::1boy::, 1.55::otoko no ko::, 1.45::crossdressing::",
      femboyCharCore,
      "1.55::flat chest::, 1.4::flat male chest::",
      femboyWardrobe,
      exprUsed,
      negOn ? "-2.5::breasts, pussy, female::" : ""
    );
    const char2Line = joinTags(
      "1boy, tall shirtless faceless male",
      duo.partner_tags,
      condomPartner,
      negOn ? "-2.5::otoko no ko, crossdressing, petite, feminine::" : ""
    );

    return {
      subTitle: `【${tpl.id} · ${tpl.title} · ${catBadge}${lightBadge}${genderBadge}${condomBadge}${xrayBadge}】`,
      canvas: tpl.canvas,
      prompt: `[Base Prompt]\n${baseLine}\n\n[Character 1 (B3)]\n${char1Line}\n\n[Character 2 (D3)]\n${char2Line}`,
    };
  }

  // --------------------------------------------------------------------------
  // MODE 3: Male + Futa Heroine (Single-Box)
  // --------------------------------------------------------------------------
  if (genderMode === "futa_no_balls" || genderMode === "futa_with_balls") {
    const withBalls = genderMode === "futa_with_balls";
    const rawFutaSegs = splitTopLevelCommaSegments(tpl.futa_tags);
    const smallPenisSeg =
      rawFutaSegs.find((tok) => stripWeightPrefix(tok) === "small penis") || "1.4::small penis::";
    const futaActor = withBalls
      ? `1girl, 1boy, hetero, faceless male, 1.55::futanari::, 1.45::futa with balls::, ${smallPenisSeg}, 1.3::small testicles::, testicles`
      : `1girl, 1boy, hetero, faceless male, 1.55::futanari::, 1.45::futa without balls::, ${smallPenisSeg}`;

    const futaWardrobe = useSceneOutfit ? tpl.builtin_outfit : outfitTagsFromLeft;
    const futaAction = rawFutaSegs
      .filter((tok) => {
        const bare = stripWeightPrefix(tok);
        return (
          Boolean(bare) &&
          bare !== "labia" &&
          bare !== "spread pussy" &&
          bare !== "small penis" &&
          bare !== "small testicles" &&
          bare !== "testicles" &&
          bare !== "balls"
        );
      })
      .join(", ");

    const condomTags = condomOn ? "1.4::condom::, 1.35::condom on penis::, 1.35::cum in condom::" : "";
    const xrayTags = wantAuxXray
      ? "1.45::x-ray::, 1.4::cross-section::, 1.45::uterus::, cervix, 1.45::cum in uterus::"
      : "";
    const xrayNeg =
      tpl.builtin_xray || wantAuxXray
        ? "fetus, baby, embryo, skeleton, bones, medical diagram, gore"
        : "x-ray, cross-section, cutaway, uterus";

    const futaNeg = fitSpecimenNeg(
      joinTags(
        "2boys, yaoi, otoko no ko, crossdressing, male chest, huge penis, large penis, oversized penis, hyper penis, monster penis, giant penis, 2girls",
        charHasFlatChest ? "" : "flat chest",
        withBalls ? "huge testicles, large testicles" : "testicles, balls, scrotum",
        duoAnatomyNeg,
        specimenOutfitGuard,
        footGuard,
        tpl.extra_neg || "",
        xrayNeg,
        landscapeGuard,
        transNeg,
        baseTailNeg
      )
    );

    const exprUsed = exprIf(cfg, duo.expr_tags, "", tpl.id);
    const futaProseClean = cfg.enable_t5_prose
      ? `${tpl.futa_prose}${transBg ? " Isolated on a transparent background." : ""}`
      : "";

    const pFuta = joinTags(
      headUsed,
      futaActor,
      charCoreUsed,
      futaWardrobe,
      envAndProps,
      tpl.framing_tags,
      duo.partner_tags,
      exprUsed,
      "rating:explicit, nsfw, uncensored",
      futaAction,
      condomTags,
      xrayTags,
      futaProseClean,
      wrapTailNeg(m, futaNeg, negOn)
    );
    return {
      subTitle: `【${tpl.id} · ${tpl.title} · ${catBadge}${lightBadge}${genderBadge}${condomBadge}${xrayBadge}】`,
      canvas: tpl.canvas,
      prompt: pFuta,
    };
  }

  // --------------------------------------------------------------------------
  // MODE 1: Normal Female Heroine x Standing Male Partner (Single-Box)
  // --------------------------------------------------------------------------
  const femaleWardrobe = useSceneOutfit ? tpl.builtin_outfit : outfitTagsFromLeft;
  const condomTags = condomOn ? "1.4::condom::, 1.35::condom on penis::, 1.35::cum in condom::" : "";
  const xrayTags = wantAuxXray
    ? "1.45::x-ray::, 1.4::cross-section::, 1.45::uterus::, cervix, 1.45::cum in uterus::"
    : "";
  const xrayNeg =
    tpl.builtin_xray || wantAuxXray
      ? "fetus, baby, embryo, skeleton, bones, medical diagram, gore"
      : "x-ray, cross-section, cutaway, uterus";

  const normalNeg = fitSpecimenNeg(
    joinTags(
      "2boys, yaoi, futanari, otoko no ko, multiple boys, 2girls",
      charHasFlatChest ? "" : "flat chest",
      duoAnatomyNeg,
      specimenOutfitGuard,
      footGuard,
      tpl.extra_neg || "",
      xrayNeg,
      landscapeGuard,
      transNeg,
      baseTailNeg
    )
  );

  const exprUsed = exprIf(cfg, duo.expr_tags, "", tpl.id);
  const femaleProseClean = cfg.enable_t5_prose
    ? `${tpl.female_prose}${transBg ? " Isolated on a transparent background." : ""}`
    : "";

  const pNormal = joinTags(
    headUsed,
    "1girl, 1boy, hetero, faceless male",
    charCoreUsed,
    femaleWardrobe,
    envAndProps,
    tpl.framing_tags,
    duo.partner_tags,
    exprUsed,
    "rating:explicit, nsfw, uncensored",
    tpl.female_tags,
    condomTags,
    xrayTags,
    femaleProseClean,
    wrapTailNeg(m, normalNeg, negOn)
  );
  return {
    subTitle: `【${tpl.id} · ${tpl.title} · ${catBadge}${lightBadge}${condomBadge}${xrayBadge}】`,
    canvas: tpl.canvas,
    prompt: pNormal,
  };
}

function compilePoolDuoScenePrompt(opts: {
  tpl: (typeof OTHER_ACTION_TEMPLATES)[string];
  duo: NonNullable<(typeof OTHER_ACTION_TEMPLATES)[string]["pool_duo"]>;
  cfg: CharacterConfig;
  m: Record<string, string>;
  headUsed: string;
  charCoreUsed: string;
  charHasFlatChest: boolean;
  genderMode: CharacterGenderMode;
  genderBadge: string;
  useSceneOutfit: boolean;
  outfitTagsFromLeft: string;
  transBg: boolean;
  transNeg: string;
  sfSceneLightTags: string;
  isExplicitDedicatedLight?: boolean;
  poolSwimGuard: string;
  poolSwimExtraNeg: string;
  poolLightNeg: string;
  footGuard: string;
  landscapeGuard: string;
  baseTailNeg: string;
  negOn: boolean;
}): ScenePromptItem {
  const {
    tpl,
    duo,
    cfg,
    m,
    headUsed,
    charCoreUsed,
    charHasFlatChest,
    genderMode,
    genderBadge,
    useSceneOutfit,
    outfitTagsFromLeft,
    transBg,
    transNeg,
    sfSceneLightTags,
    isExplicitDedicatedLight,
    poolSwimGuard,
    poolSwimExtraNeg,
    poolLightNeg,
    footGuard,
    landscapeGuard,
    baseTailNeg,
    negOn,
  } = opts;

  const isOral = duo.channel === "oral";
  const isPullOut = tpl.id === "PLD22";
  const isYuriShowcase = Boolean(duo.is_yuri_showcase);
  const wantAuxXray = Boolean(cfg.enable_uterus_xray);
  const condomOn = Boolean(cfg.enable_condom);

  const swim = tpl.swimsuit_style
    ? POOL_SWIMWEAR_SPECS[tpl.swimsuit_style]
    : POOL_SWIMWEAR_SPECS.comp_highleg;
  const swimState = tpl.swimsuit_state_override ?? swim.state_tags;
  const femboySwimState =
    swimState
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s && !/\bbreasts out\b|\bnipples visible/i.test(s))
      .join(", ") || "1.45::swimsuit aside::";

  const envAndProps = transBg
    ? joinTags(
        "2.0::transparent background::, has alpha, alpha transparency, no background",
        tpl.core_prop_tags || ""
      )
    : joinTags(tpl.env_tags, sfSceneLightTags, tpl.core_prop_tags || "");

  const lightBadge = transBg
    ? " · [🏁透明底]"
    : isExplicitDedicatedLight
      ? ""
      : ` · [${tpl.light_badge}]`;
  const condomBadge = condomOn ? " · [🛡️安全套]" : "";
  const xrayBadge = wantAuxXray ? " · [🔬内部透视]" : "";
  const catBadge = tpl.category.startsWith("13.") ? "🤿泳池伪装" : "🌊泳池双人";

  const duoAnatomyNeg =
    "extra hands, 3 hands, extra fingers, bad hands, mutated hands, extra arms, extra legs, fused bodies, gaping, censor, mosaic censoring, bar censor";

  const fitPoolNeg = (rawNeg: string): string => {
    const dedup = deduplicateCommaTags(rawNeg);
    if (encodeT5Len(dedup) <= 435) return dedup;
    const parts = dedup.split(",").map((s) => s.trim()).filter(Boolean);
    while (parts.length > 20 && encodeT5Len(parts.join(", ")) > 435) {
      parts.pop();
    }
    return parts.join(", ");
  };

  // --------------------------------------------------------------------------
  // MODE 2: Crossdressing Femboy x Athletic Male Swimmer (Multi-Box 2boys)
  // --------------------------------------------------------------------------
  if (genderMode === "femboy") {
    const femboyCharCore = splitTopLevelCommaSegments(m.char_core)
      .map((tok) => {
        const bare = stripWeightPrefix(tok);
        if (bare === "short female") return "1.25::short male::";
        if (
          bare === "small breasts" ||
          bare === "medium breasts" ||
          bare === "large breasts" ||
          bare === "huge breasts" ||
          bare === "flat chest" ||
          bare === "breasts" ||
          bare === "female" ||
          bare === "1girl"
        ) {
          return "";
        }
        return tok;
      })
      .filter(Boolean)
      .join(", ");

    const femboyOutfitLeft = splitTopLevelCommaSegments(outfitTagsFromLeft)
      .filter((tok) => {
        const bare = stripWeightPrefix(tok);
        return (
          Boolean(bare) &&
          bare !== "bare breasts" &&
          bare !== "breasts" &&
          bare !== "cleavage" &&
          bare !== "bra" &&
          bare !== "pasties" &&
          bare !== "heart pasties" &&
          bare !== "rabbit tail"
        );
      })
      .join(", ");

    const femboyWardrobe = useSceneOutfit
      ? joinTags(swim.femboy_design_tags, femboySwimState)
      : femboyOutfitLeft;
    const exprUsed = exprIf(cfg, duo.expr_tags, "", tpl.id);
    const roleT = isOral ? "target#oral" : "target#anal";
    const roleS = isOral ? "source#oral" : "source#anal";

    const condomBase = condomOn
      ? isPullOut
        ? "1.75::used condom::, 1.45::cum in condom::"
        : "1.4::condom::, 1.35::cum in condom::"
      : "";
    const condomPartner = condomOn && !isPullOut ? "1.35::condom on penis::" : "";
    const condomNeg = condomOn && isPullOut ? "condom on penis" : "";

    const xrayTags = wantAuxXray
      ? isOral
        ? "1.5::x-ray::, 1.45::cross-section::, 1.45::throat bulge::, internal cumshot"
        : "1.45::x-ray::, 1.4::cross-section::, 1.5::intestines::, 1.5::cum in ass::, internal cumshot"
      : "";
    const xrayNeg = wantAuxXray
      ? "fetus, baby, embryo, skeleton, bones, skull, ribcage, medical diagram, gore, uterus, cervix, womb"
      : "x-ray, cross-section, cutaway, uterus";

    const femboyGlobalNeg = fitPoolNeg(
      joinTags(
        "1girl, 2girls, female, girl, hetero, breasts, small breasts, medium breasts, large breasts, cleavage, pussy, vulva, vaginal, uterus, cervix, futanari, twins, identical hair, 3boys, multiple boys",
        duoAnatomyNeg,
        poolLightNeg,
        poolSwimExtraNeg,
        footGuard,
        tpl.extra_neg || "",
        condomNeg,
        xrayNeg,
        poolSwimGuard,
        landscapeGuard,
        transNeg,
        baseTailNeg
      )
    );

    const femboyProseClean = cfg.enable_t5_prose
      ? `${tpl.femboy_prose}${transBg ? " Isolated on a transparent background." : ""}`
      : "";

    const baseLine = joinTags(
      headUsed,
      "2boys, 1.55::yaoi::, bare feet",
      "rating:explicit, nsfw, uncensored",
      condomBase,
      xrayTags,
      envAndProps,
      tpl.framing_tags,
      tpl.femboy_tags,
      femboyProseClean,
      wrapTailNeg(m, femboyGlobalNeg, negOn)
    );

    const char1Line = joinTags(
      "1.45::1boy::, 1.55::otoko no ko::, 1.45::crossdressing::",
      femboyCharCore,
      "1.55::flat chest::, 1.4::flat male chest::, tiny pink nipples, hairless torso",
      femboyWardrobe,
      exprUsed,
      roleT,
      negOn ? "-2.5::breasts, pussy, female::" : ""
    );

    const femboyPartnerPose = duo.partner_tags.replace(
      /\bsecond female swimmer\b/gi,
      "athletic male swimmer"
    );
    const char2Line = joinTags(
      "1boy, tall athletic shirtless faceless male swimmer, dark swim briefs pulled down",
      femboyPartnerPose,
      condomPartner,
      roleS,
      negOn ? "-2.5::otoko no ko, crossdressing, petite, feminine, one-piece swimsuit::" : ""
    );

    const femboyPrompt = `[Base Prompt]\n${baseLine}\n\n[Character 1 (B3)]\n${char1Line}\n\n[Character 2 (D3)]\n${char2Line}`;
    return {
      subTitle: `【${tpl.id} · ${tpl.title} · ${catBadge}${lightBadge}${genderBadge}${condomBadge}${xrayBadge}】`,
      canvas: tpl.canvas,
      prompt: femboyPrompt,
    };
  }

  // --------------------------------------------------------------------------
  // MODE 4: 2Girls Contrast Swimsuits Yuri Showcase (Multi-Box on PLD18)
  // --------------------------------------------------------------------------
  if (isYuriShowcase) {
    const heroIsAyanami = /\bayanami\b/i.test(m.char_id);
    const partnerCore = heroIsAyanami
      ? "hood (azur lane), long blonde hair, blue eyes, slender, slim waist, medium breasts"
      : "ayanami (azur lane), long white hair, red eyes, slender, slim waist, small breasts";
    const c1HairGuard = heroIsAyanami ? "-2::blonde hair, blue eyes::" : "-2::white hair, red eyes::";
    const exprUsed = exprIf(cfg, duo.expr_tags, "", tpl.id);

    const primaryWardrobe = useSceneOutfit
      ? joinTags(swim.design_tags, swimState)
      : outfitTagsFromLeft;
    const contrastWardrobe = useSceneOutfit
      ? joinTags(POOL_SWIMWEAR_SPECS.sheer_white_onepiece.design_tags, "1.4::swimsuit aside::")
      : outfitTagsFromLeft;

    const xrayTags = wantAuxXray
      ? "1.45::x-ray::, 1.4::cross-section::, 1.45::uterus::, cervix, 1.45::cum in uterus::"
      : "";
    const xrayNeg = wantAuxXray
      ? "fetus, baby, embryo, skeleton, bones, medical diagram, gore"
      : "x-ray, cross-section, cutaway, uterus";

    const yuriProseClean = cfg.enable_t5_prose
      ? `${tpl.female_prose}${transBg ? " Isolated on a transparent background." : ""}`
      : "";

    if (genderMode === "normal") {
      const condomBase = condomOn ? "1.55::used condom::, 1.45::cum in condom::" : "";
      const yuriNormalNeg = fitPoolNeg(
        joinTags(
          "1boy, 2boys, male, penis, hetero, futanari, twins, identical hair, 3girls",
          charHasFlatChest ? "" : "flat chest",
          duoAnatomyNeg,
          poolLightNeg,
          poolSwimExtraNeg,
          footGuard,
          tpl.extra_neg || "",
          xrayNeg,
          poolSwimGuard,
          landscapeGuard,
          transNeg,
          baseTailNeg
        )
      );
      const baseLine = joinTags(
        headUsed,
        "2girls, 1.55::yuri::, bare feet",
        "rating:explicit, nsfw, uncensored",
        condomBase,
        xrayTags,
        envAndProps,
        tpl.framing_tags,
        tpl.female_tags,
        yuriProseClean,
        wrapTailNeg(m, yuriNormalNeg, negOn)
      );
      const char1Line = joinTags(
        "1girl",
        charCoreUsed,
        primaryWardrobe,
        exprUsed,
        negOn ? c1HairGuard : ""
      );
      const char2Line = joinTags(
        "1girl",
        partnerCore,
        contrastWardrobe,
        "blushing, parted lips"
      );
      return {
        subTitle: `【${tpl.id} · ${tpl.title} · 👯双水着百合${lightBadge}${condomBadge}${xrayBadge}】`,
        canvas: tpl.canvas,
        prompt: `[Base Prompt]\n${baseLine}\n\n[Character 1 (B3)]\n${char1Line}\n\n[Character 2 (D3)]\n${char2Line}`,
      };
    }

    // Futa-on-Female 2Girls Contrast Swimsuits Yuri
    const withBalls = genderMode === "futa_with_balls";
    const condomBase = condomOn ? "1.4::condom::, 1.35::cum in condom::" : "";
    const condomTop = condomOn ? "1.35::condom on penis::" : "";
    const yuriFutaNeg = fitPoolNeg(
      joinTags(
        "1boy, 2boys, male, yaoi, otoko no ko, flat chest, male chest, 1girl, 3girls, twins, identical hair, double penis, two penises, huge penis, large penis, hyper penis",
        withBalls ? "huge testicles, large testicles" : "testicles, balls, scrotum",
        duoAnatomyNeg,
        poolLightNeg,
        poolSwimExtraNeg,
        footGuard,
        tpl.extra_neg || "",
        xrayNeg,
        poolSwimGuard,
        landscapeGuard,
        transNeg,
        baseTailNeg
      )
    );
    const baseLine = joinTags(
      headUsed,
      "2girls, 1.5::futanari::, 1.45::futa on female::, yuri, bare feet",
      "rating:explicit, nsfw, uncensored",
      condomBase,
      xrayTags,
      envAndProps,
      tpl.framing_tags,
      tpl.futa_tags,
      yuriProseClean,
      wrapTailNeg(m, yuriFutaNeg, negOn)
    );
    const char1Line = joinTags(
      "1girl",
      partnerCore,
      primaryWardrobe,
      "1.55::futanari::",
      withBalls
        ? "1.45::futa with balls::, 1.3::small testicles::, testicles"
        : "1.45::futa without balls::",
      "1.45::small penis::, erection",
      condomTop,
      "source#vaginal",
      negOn ? "-2.5::pussy::" : ""
    );
    const char2Line = joinTags(
      "1girl",
      charCoreUsed,
      contrastWardrobe,
      exprUsed,
      "1.35::pussy::, target#vaginal",
      negOn ? "-2.5::futanari, penis, testicles::" : ""
    );
    return {
      subTitle: `【${tpl.id} · ${tpl.title} · 👯双水着百合${lightBadge}${genderBadge}${condomBadge}${xrayBadge}】`,
      canvas: tpl.canvas,
      prompt: `[Base Prompt]\n${baseLine}\n\n[Character 1 (B3)]\n${char1Line}\n\n[Character 2 (D3)]\n${char2Line}`,
    };
  }

  // --------------------------------------------------------------------------
  // MODE 3: Male-on-Futa Dual-Line (Single-Box on PLD01..17, 19..22)
  // --------------------------------------------------------------------------
  if (genderMode === "futa_no_balls" || genderMode === "futa_with_balls") {
    const withBalls = genderMode === "futa_with_balls";
    const rawFutaSegs = splitTopLevelCommaSegments(tpl.futa_tags);
    const smallPenisSeg =
      rawFutaSegs.find((tok) => stripWeightPrefix(tok) === "small penis") || "1.4::small penis::";
    const futaActor = withBalls
      ? `1girl, 1boy, hetero, faceless male, 1.55::futanari::, 1.45::futa with balls::, ${smallPenisSeg}, 1.3::small testicles::, testicles, bare feet`
      : `1girl, 1boy, hetero, faceless male, 1.55::futanari::, 1.45::futa without balls::, ${smallPenisSeg}, bare feet`;

    const futaWardrobe = useSceneOutfit
      ? joinTags(swim.design_tags, swimState)
      : outfitTagsFromLeft;
    const futaAction = rawFutaSegs
      .filter((tok) => {
        const bare = stripWeightPrefix(tok);
        return (
          Boolean(bare) &&
          bare !== "labia" &&
          bare !== "spread pussy" &&
          bare !== "small penis" &&
          bare !== "small testicles" &&
          bare !== "testicles" &&
          bare !== "balls"
        );
      })
      .join(", ");

    const condomTags = condomOn
      ? isPullOut
        ? "1.75::used condom::, 1.45::cum in condom::"
        : "1.4::condom::, 1.35::condom on penis::, 1.35::cum in condom::"
      : "";
    const condomNeg = condomOn && isPullOut ? "condom on penis" : "";

    const xrayTags = wantAuxXray
      ? isOral
        ? "1.5::x-ray::, 1.45::cross-section::, 1.45::throat bulge::, internal cumshot"
        : "1.45::x-ray::, 1.4::cross-section::, 1.45::uterus::, cervix, 1.45::cum in uterus::"
      : "";
    const xrayNeg = wantAuxXray
      ? "fetus, baby, embryo, skeleton, bones, medical diagram, gore"
      : "x-ray, cross-section, cutaway, uterus";

    const futaNeg = fitPoolNeg(
      joinTags(
        "2boys, yaoi, otoko no ko, crossdressing, male chest, huge penis, large penis, oversized penis, hyper penis, monster penis, giant penis, 2girls",
        charHasFlatChest ? "" : "flat chest",
        withBalls ? "huge testicles, large testicles" : "testicles, balls, scrotum",
        duoAnatomyNeg,
        poolLightNeg,
        poolSwimExtraNeg,
        footGuard,
        tpl.extra_neg || "",
        condomNeg,
        xrayNeg,
        poolSwimGuard,
        landscapeGuard,
        transNeg,
        baseTailNeg
      )
    );

    const exprUsed = exprIf(cfg, duo.expr_tags, "", tpl.id);
    const futaProseClean = cfg.enable_t5_prose
      ? `${tpl.futa_prose}${transBg ? " Isolated on a transparent background." : ""}`
      : "";

    const pFuta = joinTags(
      headUsed,
      futaActor,
      charCoreUsed,
      futaWardrobe,
      envAndProps,
      tpl.framing_tags,
      duo.partner_tags,
      exprUsed,
      "rating:explicit, nsfw, uncensored",
      futaAction,
      condomTags,
      xrayTags,
      futaProseClean,
      wrapTailNeg(m, futaNeg, negOn)
    );
    return {
      subTitle: `【${tpl.id} · ${tpl.title} · ${catBadge}${lightBadge}${genderBadge}${condomBadge}${xrayBadge}】`,
      canvas: tpl.canvas,
      prompt: pFuta,
    };
  }

  // --------------------------------------------------------------------------
  // MODE 1: Normal Female Heroine x Shirtless Male Swimmer (Single-Box)
  // --------------------------------------------------------------------------
  const femaleWardrobe = useSceneOutfit
    ? joinTags(swim.design_tags, swimState)
    : outfitTagsFromLeft;
  const condomTags = condomOn
    ? isPullOut
      ? "1.75::used condom::, 1.45::cum in condom::"
      : "1.4::condom::, 1.35::condom on penis::, 1.35::cum in condom::"
    : "";
  const condomNeg = condomOn && isPullOut ? "condom on penis" : "";

  const xrayTags = wantAuxXray
    ? isOral
      ? "1.5::x-ray::, 1.45::cross-section::, 1.45::throat bulge::, internal cumshot"
      : "1.45::x-ray::, 1.4::cross-section::, 1.45::uterus::, cervix, 1.45::cum in uterus::"
    : "";
  const xrayNeg = wantAuxXray
    ? "fetus, baby, embryo, skeleton, bones, medical diagram, gore"
    : "x-ray, cross-section, cutaway, uterus";

  const normalNeg = fitPoolNeg(
    joinTags(
      "2boys, yaoi, futanari, otoko no ko, multiple boys, 2girls",
      charHasFlatChest ? "" : "flat chest",
      duoAnatomyNeg,
      poolLightNeg,
      poolSwimExtraNeg,
      footGuard,
      tpl.extra_neg || "",
      condomNeg,
      xrayNeg,
      poolSwimGuard,
      landscapeGuard,
      transNeg,
      baseTailNeg
    )
  );

  const exprUsed = exprIf(cfg, duo.expr_tags, "", tpl.id);
  const femaleProseClean = cfg.enable_t5_prose
    ? `${tpl.female_prose}${transBg ? " Isolated on a transparent background." : ""}`
    : "";

  const pNormal = joinTags(
    headUsed,
    "1girl, 1boy, hetero, faceless male, bare feet",
    charCoreUsed,
    femaleWardrobe,
    envAndProps,
    tpl.framing_tags,
    duo.partner_tags,
    exprUsed,
    "rating:explicit, nsfw, uncensored",
    tpl.female_tags,
    condomTags,
    xrayTags,
    femaleProseClean,
    wrapTailNeg(m, normalNeg, negOn)
  );

  return {
    subTitle: `【${tpl.id} · ${tpl.title} · ${catBadge}${lightBadge}${condomBadge}${xrayBadge}】`,
    canvas: tpl.canvas,
    prompt: pNormal,
  };
}

function eyesOpenFor25dBlush(sceneId: string, exprCtrl: CompiledExpressionOverride): boolean {
  if (sceneId === "MA0") return false;
  return exprCtrl.active ? exprCtrl.eyes_open : true;
}

function resolveUterusXraySpec(
  sceneId: string,
  cfg: CharacterConfig,
  isPov = false
): { tags: string; prose: string } | null {
  const baseTags = "1.35::x-ray::, 1.35::cross-section::, 1.4::uterus::, cervix";
  if (sceneId in ALL_POSITIONS_TEMPLATES) {
    const tpl = ALL_POSITIONS_TEMPLATES[sceneId];
    // Mode X-1: built-in cutaway scenes already include native x-ray tags; do not double-stack
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

    // 5-Mode Internal X-Ray Matrix for TN01-TN12 & BG01-BG20
    if (ch === "tentacle") {
      const isFemboy = cfg.gender_mode === "femboy";
      // Mode X-2: Throat / Esophagus / Stomach X-Ray (TN08, BG08, BG15)
      if (sceneId === "TN08" || sceneId === "BG08" || sceneId === "BG15") {
        const stomachProse =
          sceneId === "TN08"
            ? "with a longitudinal throat-to-stomach x-ray cutaway showing the tentacle descending down the esophagus into a cum-filled stomach."
            : sceneId === "BG08"
              ? "with a longitudinal throat-to-stomach x-ray cutaway showing glowing golden larvae descending down the esophagus into a honey-slime stomach."
              : "with a longitudinal throat-to-stomach x-ray cutaway showing the facehugger feeding tube descending down the esophagus into an egg-filled stomach.";
        return {
          tags: "1.55::x-ray::, 1.5::cross-section::, 1.5::stomach x-ray::, 1.45::internal::",
          prose: stomachProse,
        };
      }
      // Mode X-4: Occlusion-Aware Front Mounting (BG13, BG16) & All-Fours Side-Profile Rear (TN03, BG05, BG14)
      if (sceneId === "BG13" || sceneId === "BG16") {
        const organ = isFemboy
          ? "1.5::intestines::, 1.5::cum in ass::, internal cumshot"
          : "1.5::uterus::, 1.5::cum in uterus::";
        return {
          tags: `1.55::x-ray::, 1.5::cross-section::, ${organ}, mounting low between spread thighs in lower foreground`,
          prose: isFemboy
            ? "with the giant insect positioned low between spread thighs leaving an unobstructed abdominal x-ray cutaway of intestines filled with fluid."
            : "with the giant insect positioned low between spread thighs leaving an unobstructed abdominal x-ray cutaway of the uterus filled with fluid.",
        };
      }
      if (sceneId === "TN03" || sceneId === "BG05" || sceneId === "BG14") {
        const organ = isFemboy
          ? "1.5::intestines::, 1.5::cum in ass::, internal cumshot"
          : "1.5::uterus::, 1.5::cum in uterus::";
        const placement = isPov ? "cross-section inset" : "side-profile abdominal x-ray cutaway";
        return {
          tags: `1.55::x-ray::, 1.5::cross-section::, ${organ}, ${placement}`,
          prose: isPov
            ? "accompanied by a corner cross-section inset showing internal penetration."
            : "with a crisp side-profile abdominal x-ray cutaway along the flank showing deep internal penetration.",
        };
      }
      // Mode X-5: Translucent-Skin Override (TN12, BG06) & Foreplay Upgrade (BG01, BG04, BG09)
      if (sceneId === "TN12" || sceneId === "BG06") {
        const organ = isFemboy
          ? "1.5::intestines::, 1.5::eggs::, 1.5::oviposition::"
          : "1.5::uterus::, 1.55::eggs in uterus::";
        return {
          tags: `1.55::x-ray::, 1.5::cross-section::, ${organ}`,
          prose: "with a sharp centered abdominal x-ray cutaway revealing dense glowing alien eggs packed inside.",
        };
      }
      if (sceneId === "BG01" || sceneId === "BG04" || sceneId === "BG09") {
        const organ = isFemboy ? "1.5::intestines::" : "1.5::uterus::";
        const payload =
          sceneId === "BG01"
            ? "silk tendril entering internal cavity"
            : sceneId === "BG04"
              ? "glowing jelly larvae inside internal cavity"
              : "suction-worm tip entering internal cavity";
        return {
          tags: `1.55::x-ray::, 1.5::cross-section::, ${organ}, ${payload}`,
          prose: `with a centered abdominal x-ray cutaway showing ${payload}.`,
        };
      }
      // Mode X-3: Standard Lower-Belly Penetration / Oviposition / Maggot X-Ray
      if (isFemboy) {
        const fbPayload =
          sceneId === "BG17" || sceneId === "BG18"
            ? "1.5::intestines::, 1.5::oviposition::, 1.5::eggs::"
            : sceneId === "BG19"
              ? "1.5::intestines::, 1.6::maggots::, 1.55::white grubs::"
              : "1.5::intestines::, 1.5::cum in ass::, internal cumshot";
        return {
          tags: `1.55::x-ray::, 1.5::cross-section::, ${fbPayload}`,
          prose: "with a centered lower-belly anatomical x-ray cutaway of the intestines.",
        };
      }
      const fPayload =
        sceneId === "BG17"
          ? "1.5::uterus::, 1.45::cervical penetration::, 1.55::eggs in uterus::"
          : sceneId === "BG19"
            ? "1.5::uterus::, 1.6::maggots::, 1.55::white grubs::"
            : "1.5::uterus::, 1.45::cervical penetration::, 1.5::cum in uterus::";
      return {
        tags: `1.55::x-ray::, 1.5::cross-section::, ${fPayload}`,
        prose: "with a centered lower-belly anatomical x-ray cutaway revealing the filled uterus.",
      };
    }
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
      sceneId !== "MA7E" &&
      !MULTI_ANGLE_TEMPLATES[sceneId]?.builtin_xray &&
      (cfg.enable_multi_angle_nsfw || Boolean(MULTI_ANGLE_TEMPLATES[sceneId]?.force_nsfw))) ||
    sceneId in OTHER_ACTION_TEMPLATES ||
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

  const segments = splitTopLevelCommaSegments(posOnly);
  const proseIdx = findTrailingProseIndex(segments);

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

function applyPixivBarCensorTransform(
  rawPrompt: string,
  mode: "white" | "black" | "mosaic",
  options: { enableNegatives: boolean; enableProse: boolean }
): string {
  // Only apply on NSFW / explicit prompts (check positive portion ONLY, excluding -2::...:: negative blocks)
  const posCheckLower = rawPrompt
    .replace(/-(?:[1-9]\d*(?:\.\d+)?)::[\s\S]*?::/g, "")
    .toLowerCase();
  const isNsfwScene =
    /\b(rating:explicit|nsfw|uncensored|pussy|penis|vaginal|anal|cum|futanari|spread pussy)\b/.test(
      posCheckLower
    );
  if (!isNsfwScene) return rawPrompt;

  const censorTags =
    mode === "white"
      ? "censored, 1.55::bar censor::, 1.45::white bar censor::, 1.25::thick bar censor::"
      : mode === "black"
        ? "censored, 1.55::bar censor::, 1.45::black bar censor::, 1.25::thick bar censor::"
        : "censored, 1.5::mosaic censoring::";
  const censorProse =
    mode === "white"
      ? "censored for pixiv with three or four distinct opaque medium-thick horizontal white censor bars strictly over the exposed genitals, leaving breasts and nipples completely bare and unobstructed."
      : mode === "black"
        ? "censored for pixiv with three or four distinct opaque medium-thick horizontal black censor bars strictly over the exposed genitals, leaving breasts and nipples completely bare and unobstructed."
        : "censored for pixiv with clean localized square pixel mosaic censoring strictly over the exposed genitals, leaving breasts, nipples, and surrounding skin sharp and unobstructed.";
  const antiBloatNeg =
    mode === "white"
      ? "uncensored, mosaic censoring, blur censor, pixelated, glowing censor, heart censor, censored nipples, eye censor, black bar censor, hairline bars, full body censor"
      : mode === "black"
        ? "uncensored, mosaic censoring, blur censor, pixelated, glowing censor, heart censor, censored nipples, eye censor, white bar censor, hairline bars, huge black box"
        : "uncensored, bar censor, white bar censor, black bar censor, thick bar censor, glowing censor, heart censor, censored nipples, eye censor, full body mosaic";

  const cleanNegBlockInner = (inner: string): string => {
    const kept = inner
      .split(",")
      .map((s) => s.trim())
      .filter((s) => {
        if (!s) return false;
        const bare = s.replace(/^\d+(?:\.\d+)?::([\s\S]+?)::$/, "$1").trim().toLowerCase();
        if (bare === "censor" || bare === "censored") return false;
        if (mode === "mosaic") {
          return bare !== "mosaic censoring" && bare !== "pixelated" && bare !== "blur censor";
        }
        return bare !== "bar censor";
      });
    return kept.join(", ");
  };

  const stripUncensoredFromPos = (s: string): string =>
    s
      .replace(/(?:,\s*)?(?:\d+(?:\.\d+)?::)?\buncensored\b(?:::)?/gi, "")
      .replace(/,\s*,+/g, ", ")
      .replace(/^[ ,]+|[ ,]+$/g, "");

  // Handle pre-partitioned multi-block prompts (e.g. MA7E starting with [Base Prompt])
  if (rawPrompt.startsWith("[Base Prompt]")) {
    const sections = rawPrompt.split(/\n\n+/);
    const updated = sections.map((sec, idx) => {
      if (idx === 0 && sec.startsWith("[Base Prompt]\n")) {
        const body = sec.slice("[Base Prompt]\n".length);
        const negBlocks: string[] = [];
        let posPart = body
          .replace(/(?:,\s*)?(-(?:[1-9]\d*(?:\.\d+)?)::[\s\S]*?::)/g, (_m, block: string) => {
            negBlocks.push(block.trim());
            return "";
          })
          .replace(/^[ ,]+|[ ,]+$/g, "");
        posPart = stripUncensoredFromPos(posPart);
        const segs = splitTopLevelCommaSegments(posPart);
        const proseIdx = findTrailingProseIndex(segs);
        if (proseIdx > 0) {
          const before = segs.slice(0, proseIdx).join(", ");
          let after = segs.slice(proseIdx).join(", ");
          if (options.enableProse) {
            after = `${after.replace(/\.+\s*$/, "")}, ${censorProse}`;
          }
          posPart = `${before}, ${censorTags}, ${after}`;
        } else {
          posPart = options.enableProse
            ? `${posPart}, ${censorTags}, ${censorProse}`
            : `${posPart}, ${censorTags}`;
        }

        const rebuiltNegs = negBlocks
          .map((blk) => {
            const m = /^(-[1-9]\d*(?:\.\d+)?::)([\s\S]*?)(::)$/.exec(blk);
            if (!m) return blk;
            const cleaned = cleanNegBlockInner(m[2]);
            return cleaned ? `${m[1]}${cleaned}${m[3]}` : "";
          })
          .filter(Boolean);
        if (options.enableNegatives) {
          const mainIdx = rebuiltNegs.findIndex((b) => b.startsWith("-2::"));
          if (mainIdx !== -1) {
            const inner = rebuiltNegs[mainIdx].slice(4, -2).trim();
            rebuiltNegs[mainIdx] = `-2::${inner ? `${inner}, ${antiBloatNeg}` : antiBloatNeg}::`;
          } else {
            rebuiltNegs.unshift(`-2::${antiBloatNeg}::`);
          }
        }
        return `[Base Prompt]\n${rebuiltNegs.length > 0 ? `${posPart}, ${rebuiltNegs.join(", ")}` : posPart}`;
      }
      // Also strip any stray 'uncensored' from [Character N] blocks
      const nl = sec.indexOf("\n");
      if (nl !== -1) {
        const header = sec.slice(0, nl);
        const body = stripUncensoredFromPos(sec.slice(nl + 1));
        return `${header}\n${body}`;
      }
      return sec;
    });
    return updated.join("\n\n");
  }

  // Standard flat prompt path
  const negBlocks: string[] = [];
  let posOnly = rawPrompt
    .replace(/(?:,\s*)?(-(?:[1-9]\d*(?:\.\d+)?)::[\s\S]*?::)/g, (_m, block: string) => {
      negBlocks.push(block.trim());
      return "";
    })
    .replace(/^[ ,]+|[ ,]+$/g, "");

  posOnly = stripUncensoredFromPos(posOnly);
  const segments = splitTopLevelCommaSegments(posOnly);
  const proseIdx = findTrailingProseIndex(segments);
  if (proseIdx > 0) {
    const before = segments.slice(0, proseIdx).join(", ");
    let after = segments.slice(proseIdx).join(", ");
    if (options.enableProse) {
      after = `${after.replace(/\.+\s*$/, "")}, ${censorProse}`;
    }
    posOnly = `${before}, ${censorTags}, ${after}`;
  } else {
    posOnly = options.enableProse
      ? `${posOnly}, ${censorTags}, ${censorProse}`
      : `${posOnly}, ${censorTags}`;
  }

  const rebuiltNegs = negBlocks
    .map((blk) => {
      const m = /^(-[1-9]\d*(?:\.\d+)?::)([\s\S]*?)(::)$/.exec(blk);
      if (!m) return blk;
      const cleaned = cleanNegBlockInner(m[2]);
      return cleaned ? `${m[1]}${cleaned}${m[3]}` : "";
    })
    .filter(Boolean);

  if (options.enableNegatives) {
    const mainIdx = rebuiltNegs.findIndex((b) => b.startsWith("-2::"));
    if (mainIdx !== -1) {
      const inner = rebuiltNegs[mainIdx].slice(4, -2).trim();
      rebuiltNegs[mainIdx] = `-2::${inner ? `${inner}, ${antiBloatNeg}` : antiBloatNeg}::`;
    } else {
      rebuiltNegs.unshift(`-2::${antiBloatNeg}::`);
    }
  }

  return rebuiltNegs.length > 0 ? `${posOnly}, ${rebuiltNegs.join(", ")}` : posOnly;
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

function findTrailingProseIndex(segments: string[]): number {
  let endIdx = segments.length;
  while (endIdx > 0 && /^-0\.\d+::[\s\S]*?::$/.test(segments[endIdx - 1]?.trim() ?? "")) {
    endIdx--;
  }
  let lastWeightedIdx = -1;
  for (let i = 0; i < endIdx; i++) {
    if (segments[i] && segments[i].includes("::")) {
      lastWeightedIdx = i;
    }
  }
  for (let i = lastWeightedIdx + 1; i < endIdx; i++) {
    const seg = segments[i];
    if (!seg || seg.includes("::")) continue;
    if (/^[A-Z]|^the girl\b/.test(seg) || seg.split(/\s+/).length >= 8) {
      return i;
    }
  }
  return -1;
}

function resolveCreaturePovSpec(sceneId: string, xrayOn = false): { poseTags: string; prosePrefix: string } {
  if (sceneId === "TN07" || sceneId === "BG13" || sceneId === "BG16") {
    return {
      poseTags:
        "1.55::from below::, 1.45::pov::, 1.5::foreshortening::, groin focus in foreground, head at top, mounting low between spread thighs in lower foreground, looking down at viewer",
      prosePrefix:
        "Dramatic low-angle POV between spread knees looking upward past crotch and chest to blushing face at the top: ",
    };
  }
  if (sceneId === "TN03" || sceneId === "BG05" || sceneId === "BG14") {
    return {
      poseTags:
        "1.55::from behind::, 1.5::from below::, 1.45::pov::, 1.5::foreshortening::, 1.45::ass focus::, head at top, looking back at viewer",
      prosePrefix:
        "Low-angle rear crotch-to-head POV from behind and beneath raised hips looking up along arched back toward turned face at the top: ",
    };
  }
  if (sceneId === "BG15") {
    if (xrayOn) {
      return {
        poseTags:
          "1.55::from below::, 1.45::pov::, 1.5::foreshortening::, groin focus in foreground, head at top, looking down at viewer",
        prosePrefix:
          "Low-angle groin-to-head POV from between spread thighs looking upward along torso and stomach cutaway to facehugger-clamped head at the top: ",
      };
    }
    return {
      poseTags:
        "1.55::from below::, 1.45::pov::, 1.5::foreshortening::, groin focus in foreground, head at top, 1.6::2 creatures::, 1.55::groin parasite::, looking down at viewer",
      prosePrefix:
        "Low-angle groin-to-head POV from between spread thighs with groin parasite huge in foreground looking upward along torso to facehugger-clamped head at the top: ",
    };
  }
  if (sceneId === "TN08" || sceneId === "BG08") {
    return {
      poseTags:
        "1.5::from below::, 1.45::pov::, 1.45::foreshortening::, upper body, head at top, close-up from below chest",
      prosePrefix:
        "Low-angle POV from below chest looking steeply upward past glistening chest into wide-open mouth at the top: ",
    };
  }
  return {
    poseTags:
      "1.55::from below::, 1.45::pov::, 1.5::foreshortening::, 1.45::worm's-eye view::, groin focus in foreground, head at top, looking down at viewer",
    prosePrefix:
      "Dramatic low-angle POV from right between spread thighs looking steeply upward along torso and chest to blushing face at the top: ",
  };
}

function deduplicatePositiveTagPrefix(rawPrompt: string): string {
  if (rawPrompt.startsWith("[Base Prompt]")) {
    return rawPrompt
      .split(/\n\n+/)
      .map((sec) => {
        const nl = sec.indexOf("\n");
        if (nl === -1) return sec;
        const header = sec.slice(0, nl);
        const body = sec.slice(nl + 1).trim();
        return `${header}\n${deduplicatePositiveTagPrefix(body)}`;
      })
      .join("\n\n");
  }
  const negBlocks: string[] = [];
  const posOnly = rawPrompt
    .replace(/(?:,\s*)?(-(?:[1-9]\d*(?:\.\d+)?)::[\s\S]*?::)/g, (_m, block: string) => {
      negBlocks.push(block.trim());
      return "";
    })
    .replace(/^[ ,]+|[ ,]+$/g, "");

  const segments = splitTopLevelCommaSegments(posOnly);
  const proseIdx = findTrailingProseIndex(segments);

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

  // Handle structured [Base Prompt] + [Character N] prompts by trimming [Base Prompt] tail prose/tags
  // while keeping [Character N] blocks intact.
  if (rawPrompt.startsWith("[Base Prompt]")) {
    const nextCharIdx = rawPrompt.search(/\n\s*\[Character\s*\d+/i);
    if (nextCharIdx !== -1) {
      const baseSection = rawPrompt.slice(0, nextCharIdx);
      const charSections = rawPrompt.slice(nextCharIdx);
      const baseHeaderMatch = /^\[Base Prompt\]\s*:?\s*\n?/.exec(baseSection);
      const baseHeader = baseHeaderMatch ? baseHeaderMatch[0] : "[Base Prompt]\n";
      const baseBody = baseSection.slice(baseHeader.length).trim();
      const baseSoloTokenCost = measureEffectivePosTokens("masterpiece");
      const charOverhead = Math.max(
        0,
        measureEffectivePosTokens(`[Base Prompt]\nmasterpiece${charSections}`) - baseSoloTokenCost
      );
      const baseBudget = Math.max(120, maxPosTokens - charOverhead);
      const trimmedBase = enforcePositiveTokenBudget(baseBody, baseBudget, allowTagTrim);
      const rebuilt = `${baseHeader}${trimmedBase}${charSections}`;
      if (measureEffectivePosTokens(rebuilt) <= maxPosTokens) {
        return rebuilt;
      }
      // Fine-tune by tightening baseBudget step-by-step if rounding left 1~5 tokens over
      let tight = baseBudget - 6;
      while (tight >= 80) {
        const cand = `${baseHeader}${enforcePositiveTokenBudget(baseBody, tight, allowTagTrim)}${charSections}`;
        if (measureEffectivePosTokens(cand) <= maxPosTokens) {
          return cand;
        }
        tight -= 6;
      }
      return rebuilt;
    }
  }

  const negBlocks: string[] = [];
  const rawPosWithCw = rawPrompt
    .replace(/(?:,\s*)?(-(?:[1-9]\d*(?:\.\d+)?)::[\s\S]*?::)/g, (_m, block: string) => {
      negBlocks.push(block.trim());
      return "";
    })
    .replace(/^[ ,]+|[ ,]+$/g, "");

  const rawPosSegs = splitTopLevelCommaSegments(rawPosWithCw);
  const trailingCwBlocks: string[] = [];
  while (rawPosSegs.length > 0 && /^-0\.\d+::[\s\S]*?::$/.test(rawPosSegs[rawPosSegs.length - 1]?.trim() ?? "")) {
    const popped = rawPosSegs.pop();
    if (popped) trailingCwBlocks.unshift(popped.trim());
  }
  const posOnly = rawPosSegs.join(", ");

  const rebuild = (candidatePos: string, includeCw = true): string => {
    const cleanP = candidatePos.replace(/^[ ,]+|[ ,]+$/g, "");
    const parts = [cleanP];
    if (includeCw && trailingCwBlocks.length > 0) parts.push(...trailingCwBlocks);
    if (negBlocks.length > 0) parts.push(...negBlocks);
    return parts.filter(Boolean).join(", ");
  };

  // Locate start of trailing T5 prose sentence (strictly AFTER the last weighted :: tag)
  const segments = rawPosSegs;
  const proseIdx = findTrailingProseIndex(segments);

  if (proseIdx > 0) {
    const tagsPart = segments.slice(0, proseIdx).join(", ");
    const prosePart = segments.slice(proseIdx).join(", ").replace(/\.+\s*$/, "");

    const colonIdx = prosePart.indexOf(": ");
    const locSplitRe =
      /;\s+|,\s+|\s+(?=on a soft furry\b|on a furry beige\b|in shallow rippling\b|in a bedroom\b|on crisp white\b|in a narrow Japanese\b|on the living room\b)/;
    if (colonIdx !== -1) {
      const stylePrefix = prosePart.slice(0, colonIdx).trim();
      const bodyClauses = prosePart
        .slice(colonIdx + 2)
        .split(locSplitRe)
        .filter(Boolean);

      for (let keep = bodyClauses.length - 1; keep >= 1; keep--) {
        const cand = rebuild(`${tagsPart}, ${stylePrefix}: ${bodyClauses.slice(0, keep).join(", ")}.`);
        if (measureEffectivePosTokens(cand) <= maxPosTokens) {
          return cand;
        }
      }

      // If stylePrefix is just redundant body-proportion prose ("Petite slender mini-lady"), drop stylePrefix
      // first so the core posture/POV spatial clause (bodyClauses[0]) survives under tight token budgets!
      if (/^Petite slender mini-lady$/i.test(stylePrefix) && bodyClauses.length > 0) {
        for (let keep = bodyClauses.length; keep >= 1; keep--) {
          const bodyOnlyCand = rebuild(`${tagsPart}, ${bodyClauses.slice(0, keep).join(", ")}.`);
          if (measureEffectivePosTokens(bodyOnlyCand) <= maxPosTokens) {
            return bodyOnlyCand;
          }
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
      const clauses = prosePart.split(locSplitRe).filter(Boolean);
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
    if (trailingCwBlocks.length > 0) {
      const tagsWithoutCw = rebuild(tagsPart, false);
      if (measureEffectivePosTokens(tagsWithoutCw) <= maxPosTokens) {
        return tagsWithoutCw;
      }
    }
    // Extreme custom-tag overflow fallback: drop unweighted >=5-word descriptive clauses first so weighted `w::...::` & short env tags survive
    const tagTokens = splitTopLevelCommaSegments(tagsPart);
    for (let idx = tagTokens.length - 1; idx >= 6 && tagTokens.length > 10; idx--) {
      const seg = tagTokens[idx];
      if (!seg.includes("::") && seg.trim().split(/\s+/).length >= 5) {
        tagTokens.splice(idx, 1);
        const shrunk = rebuild(tagTokens.join(", "), false);
        if (measureEffectivePosTokens(shrunk) <= maxPosTokens) {
          return shrunk;
        }
      }
    }
    while (tagTokens.length > 10) {
      tagTokens.pop();
      const shrunk = rebuild(tagTokens.join(", "), false);
      if (measureEffectivePosTokens(shrunk) <= maxPosTokens) {
        return shrunk;
      }
    }
    return tagsOnlyCand;
  }

  // No trailing T5 prose present: if tags alone still exceed maxPosTokens, drop trailing cw & unweighted >=5-word clauses first
  if (allowTagTrim) {
    if (trailingCwBlocks.length > 0) {
      const noCw = rebuild(posOnly, false);
      if (measureEffectivePosTokens(noCw) <= maxPosTokens) {
        return noCw;
      }
    }
    const tagTokens = splitTopLevelCommaSegments(posOnly);
    for (let idx = tagTokens.length - 1; idx >= 6 && tagTokens.length > 10; idx--) {
      const seg = tagTokens[idx];
      if (!seg.includes("::") && seg.trim().split(/\s+/).length >= 5) {
        tagTokens.splice(idx, 1);
        const shrunk = rebuild(tagTokens.join(", "), false);
        if (measureEffectivePosTokens(shrunk) <= maxPosTokens) {
          return shrunk;
        }
      }
    }
    while (tagTokens.length > 10) {
      tagTokens.pop();
      const shrunk = rebuild(tagTokens.join(", "), false);
      if (measureEffectivePosTokens(shrunk) <= maxPosTokens) {
        return shrunk;
      }
    }
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
  const isTentacleScene = opts.sceneId.startsWith("TN");
  const isInsectScene = opts.sceneId.startsWith("BG");
  const isCreatureScene = isTentacleScene || isInsectScene;
  const isTentacleMilking =
    opts.sceneId === "TN05" ||
    opts.sceneId === "TN07" ||
    opts.sceneId === "TN10" ||
    opts.sceneId === "TN11";
  const isInsectMilking =
    opts.sceneId === "BG02" ||
    opts.sceneId === "BG09" ||
    opts.sceneId === "BG10" ||
    opts.sceneId === "BG11" ||
    opts.sceneId === "BG15";
  const isTentacleXray =
    opts.sceneId === "TN02" ||
    opts.sceneId === "TN04" ||
    opts.sceneId === "TN10" ||
    opts.sceneId === "BG03" ||
    opts.sceneId === "BG12" ||
    opts.sceneId === "BG20";
  const isTentacleBelly =
    opts.sceneId === "TN02" ||
    opts.sceneId === "TN04" ||
    opts.sceneId === "TN09" ||
    opts.sceneId === "TN10" ||
    opts.sceneId === "TN12" ||
    opts.sceneId === "BG03" ||
    opts.sceneId === "BG06" ||
    opts.sceneId === "BG07" ||
    opts.sceneId === "BG12" ||
    opts.sceneId === "BG17" ||
    opts.sceneId === "BG19" ||
    opts.sceneId === "BG20";
  const negBlocks: string[] = [];
  const posOnly = rawPrompt
    .replace(/(?:,\s*)?(-(?:[1-9]\d*(?:\.\d+)?)::[\s\S]*?::)/g, (_m, block: string) => {
      negBlocks.push(block.trim());
      return "";
    })
    .replace(/^[ ,]+|[ ,]+$/g, "");

  const segments = splitTopLevelCommaSegments(posOnly);
  const proseIdx = findTrailingProseIndex(segments);

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
      "pussy focus",
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
    if (isMa7Pregnant || isTentacleBelly) {
      femboyStripPos.delete("pregnant");
    }
    if (isTentacleXray || (isCreatureScene && bareTagSet.has("x-ray"))) {
      femboyStripPos.delete("x-ray");
      femboyStripPos.delete("cross-section");
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

      if (bare === "vaginal" && isCreatureScene) {
        outTags.push("1.5::anal::", "1.45::anal penetration::", "1.45::male penetrated::");
        continue;
      }

      if (bare === "after vaginal" && isCreatureScene) {
        outTags.push("1.45::after anal::");
        continue;
      }

      if (bare === "maggots in pussy") {
        outTags.push("1.55::maggots in ass::");
        continue;
      }

      if (bare === "uterus" && isTentacleXray) {
        outTags.push("1.45::intestines::");
        continue;
      }

      if (bare === "tentacles on breasts") {
        outTags.push("tentacles on chest");
        if (!bodyChestInserted) {
          bodyChestInserted = true;
          outTags.push("1.55::flat chest::", "1.4::flat male chest::", "tiny pink nipples", "hairless torso");
        }
        if (isTentacleMilking) {
          outTags.push(
            "1.45::coiled tentacle around penis::",
            "1.4::milking::",
            "1.45::male ejaculation::",
            "1.4::precum::",
            "dripping"
          );
        }
        continue;
      }

      if (bare === "nipple bulge" || bare === "nipple suction") {
        outTags.push("tiny pink nipples");
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

      // Sanitize female anatomy references inside multi-word creature phrases for Femboy
      if (isCreatureScene && /\b(pussy|nipple|nipples|womb)\b/i.test(seg)) {
        outTags.push(
          seg
            .replace(/\bgaping pussy\b/gi, "gaping ass")
            .replace(/\bout from pussy\b/gi, "out from ass")
            .replace(/\bfrom pussy\b/gi, "from ass")
            .replace(/\bsucking nipples?\b/gi, "sucking flat chest nipple")
            .replace(/\bwomb\b/gi, "intestines")
        );
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

    const isUpperOralCloseUp = opts.sceneId === "TN08" || opts.sceneId === "BG08";
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
      } else if ((hasPartnerBoy || isCreatureScene) && (isPenetratedScene || bareTagSet.has("oviposition"))) {
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
      } else if (!isUpperOralCloseUp) {
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
      if (isTentacleXray) {
        if (bareTagSet.has("oviposition") || bareTagSet.has("eggs")) {
          outTags.push("1.45::intestines::", "1.45::eggs::", "1.5::oviposition::");
        } else {
          outTags.push("1.45::intestines::", "1.5::cum in ass::", "internal cumshot");
        }
      }
      if (isTentacleMilking && !outTags.includes("1.45::coiled tentacle around penis::")) {
        outTags.push(
          "1.45::coiled tentacle around penis::",
          "1.4::milking::",
          "1.45::male ejaculation::",
          "1.4::precum::",
          "dripping"
        );
      }
      if (isInsectMilking) {
        outTags.push("1.4::milking::", "1.4::precum::", "dripping");
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
      ...(isCreatureScene ? [] : ["2boys"]),
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
      ...(isMa7Derivative || isCreatureScene ? ["dripping"] : []),
      ...(isMa7Xray || isTentacleXray ? ["x-ray", "cross-section", "cutaway", "internal cumshot"] : []),
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
      "pussy focus",
      "vulva",
      "labia",
      "vaginal",
      "futanari",
      "hermaphrodite",
      ...(isMa7Derivative || isCreatureScene ? ["uterus", "cervix"] : []),
      ...(isCreatureScene ? ["2boys"] : []),
      ...(isMa7Derivative ? ["extra hands", "extra fingers"] : []),
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
    const isMa7FutaSpread = opts.sceneId === "MA7E";

    if (isMa7FutaSpread) {
      for (const seg of tagSegs) {
        const bare = stripWeightPrefix(seg);
        if (!bare) continue;
        if (!withBalls) {
          if (bare === "futa with balls") {
            outTags.push("1.45::futa without balls::");
            continue;
          }
          if (
            bare === "small testicles" ||
            bare === "testicles" ||
            bare === "holding own testicles"
          ) {
            continue;
          }
        }
        outTags.push(seg);
      }
      if (!withBalls && opts.enableProse && prosePart) {
        prosePart = prosePart.replace(
          /gently tug only her small round testicles slightly to the viewer's left/i,
          "gently pull open the left side of her glistening pink labia"
        );
      }
      const ma7eUnblock = new Set([
        "penis",
        "phallus",
        "futanari",
        "dripping",
        ...(withBalls ? ["testicles", "balls", "scrotum"] : []),
      ]);
      mainNegTokens = mainNegTokens.filter((t) => !ma7eUnblock.has(t.toLowerCase()));
      if (!withBalls) {
        const lowerNeg = new Set(mainNegTokens.map((t) => t.toLowerCase()));
        for (const tag of ["testicles", "balls", "scrotum"]) {
          if (!lowerNeg.has(tag)) {
            mainNegTokens.unshift(tag);
            lowerNeg.add(tag);
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
    // On Solo scenes, use strict petite small/tiny penis + full Anti-Oversize UC.
    // On 2-person Male-on-Futa scenes, AVOID global `1.55::small penis::, 1.35::tiny penis::` and `large penis / thick penis` UC
    // so the male partner's penis stays normal/full-sized while T5 prose + gentle `1.15::small futanari penis::` keeps ONLY her shaft compact!
    const isUpperOralCloseUpFuta = opts.sceneId === "TN08" || opts.sceneId === "BG08";
    const futaCoreTags = isNsfw && !isUpperOralCloseUpFuta
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
    const isMa11UltraClose = opts.sceneId === "MA11";
    const futaAntiPasteStrip =
      isNsfw && !opts.isRearNoFacePos
        ? new Set([
            "groin",
            ...(isMa11UltraClose ? ["pussy focus"] : ["pussy"]),
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

    const isUpperOralCloseUp = opts.sceneId === "TN08" || opts.sceneId === "BG08";
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
        if (isTentacleMilking) {
          outTags.push("1.45::coiled tentacle around penis::", "1.4::milking::", "1.4::precum::", "dripping");
        } else if (isInsectMilking) {
          outTags.push("1.4::milking::", "1.4::precum::", "dripping");
        } else if (!opts.isRearNoFacePos) {
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
      ...(isMa7Derivative || isCreatureScene ? ["dripping"] : []),
      ...(withBalls ? ["testicles", "balls", "scrotum"] : []),
    ]);
    const futaOversizeNeg = hasPartnerBoy
      ? ["hyper penis", "monster penis", "giant penis", "huge testicles"]
      : ANTI_OVERSIZE_ANATOMY_UC;
    const posHasFlatChest = outTags.some((t) => stripWeightPrefix(t) === "flat chest");
    const futaAddNeg = [
      ...(hasPartnerBoy ? ["2boys"] : ["1boy", "male"]),
      "otoko no ko",
      "crossdressing",
      "yaoi",
      ...(posHasFlatChest ? [] : ["flat chest"]),
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

const BASE_PROTECT_TAG_SET = new Set([
  "masterpiece",
  "best quality",
  "very aesthetic",
  "absurdres",
  "highres",
  "no text",
  "gradient eyes",
  "shiny skin",
  "glossy hair",
  "soft shading",
  "smooth shading",
  "cel shading",
  "anime coloring",
  "lineart",
  "clean lineart",
  "fine lineart",
  "crisp lineart",
  "smooth lineart",
  "colored lineart",
  "no lineart",
  "lineless",
  "subsurface scattering",
  "ambient occlusion",
  "backlighting",
  "sunlight",
  "light rays",
  "sparkle",
  "high contrast",
  "color contrast",
  "saturated",
  "1girl",
  "2girls",
  "3girls",
  "1boy",
  "2boys",
  "multiple boys",
  "solo",
  "hetero",
  "yaoi",
  "yuri",
  "faceless male",
  "pov",
  "first-person",
  "pov hands",
  "pov crotch",
  "rating:explicit",
  "nsfw",
  "uncensored",
  "censored",
  "bar censor",
  "thick bar censor",
  "mosaic censoring",
  "thin white bars",
  "white bar censor",
  "black bar censor",
  "from below",
  "from above",
  "from side",
  "from behind",
  "side view",
  "profile",
  "three-quarter view",
  "full body",
  "upper body",
  "cowboy shot",
  "worm's-eye view",
  "high angle",
  "low angle",
  "looking at viewer",
  "looking back",
  "looking away",
  "looking down",
  "looking up",
  "foreshortening",
  "facing away",
  "indoors",
  "outdoors",
  "transparent background",
  "simple background",
  "white background",
]);

const STATIC_CHAR1_TAG_SET = new Set([
  // Gender / Futa / Femboy character-bound traits
  "futanari",
  "futa without balls",
  "futa with balls",
  "otoko no ko",
  "crossdressing",
  "genderbend",
  "androgynous",
  "short female",
  "short male",
  "bare chest",
  "flat chest",
  "flat male chest",
  "tiny pink nipples",
  "hairless torso",
  "bulge",
  "panties bulge",
  "small penis",
  "tiny penis",
  "small testicles",
  "testicles",
  // Body & proportion descriptors
  "chibi",
  "very short",
  "petite",
  "small frame",
  "slender",
  "slender legs",
  "slim waist",
  "narrow shoulders",
  "narrow hips",
  "short torso",
  "small breasts",
  "medium breasts",
  "large breasts",
  "flat chest",
  "thigh gap",
  "long legs",
  "short face",
  "round face",
  "pale skin",
  "fair skin",
  "soft skin",
  "wide hips",
  "thick thighs",
  "plump",
  // Outfit, clothing state & accessories
  "reverse bunnysuit",
  "bunny ears",
  "fake animal ears",
  "black bunny ears",
  "cat ears",
  "cat tail",
  "horns",
  "demon tail",
  "glasses",
  "choker",
  "collar",
  "detached collar",
  "white collar",
  "red bowtie",
  "black cropped jacket",
  "bolero",
  "short sleeves",
  "open jacket",
  "partially unbuttoned",
  "oversized shirt",
  "white t-shirt",
  "off-shoulder",
  "single bare shoulder",
  "wet clothes",
  "clothes lift",
  "shirt lift",
  "skirt lift",
  "bottomless",
  "no panties",
  "panties aside",
  "panties down",
  "panties around one leg",
  "bare breasts",
  "breasts out",
  "underboob",
  "sideboob",
  "nipples",
  "erect nipples",
  "bare stomach",
  "midriff",
  "navel",
  "wrist cuffs",
  "white cuffs",
  "bare hips",
  "bare thighs",
  "zettai ryouiki",
  "thighhighs",
  "black thighhighs",
  "white thighhighs",
  "thigh strap",
  "rabbit tail",
  "barefoot",
  "nude",
  "completely nude",
  "topless",
  "pasties",
  "black pasties",
  "heart pasties",
  "micro bikini",
  // Facial expressions
  "blush",
  "blush stickers",
  "nose blush",
  "full-face blush",
  "furrowed brow",
  "half-closed eyes",
  "watery eyes",
  "tears",
  "tearing up",
  "heart-shaped pupils",
  "empty eyes",
  "ahegao",
  "rolling eyes",
  "trembling",
  "twitching",
  "open mouth",
  "parted lips",
  "saliva",
  "drooling",
  "tongue out",
  "smile",
  "closed eyes",
  "jitome",
  "embarrassed",
  "shy",
  "aroused",
  "panting",
  "heavy breathing",
  "flushed face",
  "sweatdrop",
  "sweat",
]);

function collectBareTagsIntoSet(rawStr: string | undefined, target: Set<string>): void {
  if (!rawStr) return;
  for (const seg of splitTopLevelCommaSegments(rawStr)) {
    const bare = stripWeightPrefix(seg);
    if (!bare || bare.startsWith("artist:") || BASE_PROTECT_TAG_SET.has(bare)) continue;
    target.add(bare);
  }
}

function distributePromptToCharacterCaptions(rawPrompt: string, cfg: CharacterConfig): string {
  const trimmed = rawPrompt.trim();
  if (!trimmed || trimmed.startsWith("[Base Prompt]")) {
    return rawPrompt;
  }

  const negBlocks: string[] = [];
  const posOnly = trimmed
    .replace(/(?:,\s*)?(-(?:[1-9]\d*(?:\.\d+)?)::[\s\S]*?::)/g, (_m, block: string) => {
      negBlocks.push(block.trim());
      return "";
    })
    .replace(/^[ ,]+|[ ,]+$/g, "");

  const segments = splitTopLevelCommaSegments(posOnly);
  const proseIdx = findTrailingProseIndex(segments);

  const tagSegs = proseIdx >= 0 ? segments.slice(0, proseIdx) : segments;
  const prosePart = proseIdx >= 0 ? segments.slice(proseIdx).join(", ") : "";

  // Build exact Character-1 tag set from active config presets + static char traits
  const char1TagSet = new Set<string>(STATIC_CHAR1_TAG_SET);
  collectBareTagsIntoSet(cfg.char_tag, char1TagSet);
  collectBareTagsIntoSet(cfg.extra_char_tags, char1TagSet);
  collectBareTagsIntoSet(BODY_PRESETS[cfg.body_preset]?.[0], char1TagSet);
  collectBareTagsIntoSet(BUST_PRESETS[cfg.bust_preset]?.[0], char1TagSet);
  collectBareTagsIntoSet(SKIN_PRESETS[cfg.skin_preset]?.[0], char1TagSet);
  collectBareTagsIntoSet(OUTFIT_PRESETS[cfg.outfit_preset]?.[0], char1TagSet);
  collectBareTagsIntoSet(cfg.custom_outfit_tags, char1TagSet);
  collectBareTagsIntoSet(LEGWEAR_PRESETS[cfg.legwear_preset]?.[0], char1TagSet);
  collectBareTagsIntoSet(EXPRESSION_PRESETS[cfg.expr_preset]?.tags, char1TagSet);
  collectBareTagsIntoSet(cfg.custom_expression_tags, char1TagSet);

  const bareSet = new Set(tagSegs.map((s) => stripWeightPrefix(s)));
  const isPov = bareSet.has("pov") || bareSet.has("first-person");
  const hasPartnerBoy =
    bareSet.has("2boys") ||
    bareSet.has("hetero") ||
    bareSet.has("faceless male") ||
    (bareSet.has("1boy") && bareSet.has("1girl"));

  // Solo scenes have no second actor to isolate against; splitting a single character's
  // futanari/anatomy/body tags away from base action tags weakens V5 cross-attention coherence
  // (e.g., MA7E two-handed spread). Only distribute into [Character 1]/[Character 2] on 2-person scenes.
  if (!hasPartnerBoy) {
    return rawPrompt;
  }

  const baseTags: string[] = [];
  const char1Tags: string[] = [];

  for (const seg of tagSegs) {
    const bare = stripWeightPrefix(seg);
    if (!bare) continue;
    // Keep single-tag fractional positive-space body counterweights (e.g. -0.45::wide hips::) with Character 1;
    // leave multi-tag lighting/style counterweights in [Base Prompt].
    const isBodyCounterweight =
      /^-0\.\d+::/.test(seg.trim()) &&
      !seg.includes(",") &&
      (bare === "wide hips" || bare === "thick thighs" || bare === "plump");
    if (
      !bare.startsWith("artist:") &&
      !bare.startsWith("year ") &&
      !BASE_PROTECT_TAG_SET.has(bare) &&
      (char1TagSet.has(bare) || isBodyCounterweight)
    ) {
      char1Tags.push(seg);
    } else {
      baseTags.push(seg);
    }
  }

  // If fewer than 2 character tags matched, keep flat prompt untouched
  if (char1Tags.length < 2) {
    return rawPrompt;
  }

  const char1Header = cfg.gender_mode === "femboy" ? "boy" : "girl";
  const hasVaginalAction =
    bareSet.has("vaginal") || bareSet.has("insertion") || bareSet.has("after vaginal");
  const hasPenisService =
    bareSet.has("penis") ||
    bareSet.has("fellatio") ||
    bareSet.has("paizuri") ||
    bareSet.has("footjob") ||
    bareSet.has("handjob") ||
    bareSet.has("sumata") ||
    bareSet.has("assjob");
  const hasManualMaleHands =
    bareSet.has("fingering") || bareSet.has("breast grab") || bareSet.has("clitoral stimulation");

  // Bind native V4.5/V5 source#/target# interaction on 3rd-person vaginal scenes so the male partner
  // never vanishes into solo composition when Character 1 carries heavy body/identity weights.
  if (hasPartnerBoy && !isPov && hasVaginalAction && cfg.gender_mode !== "femboy") {
    if (!char1Tags.includes("target#vaginal")) {
      char1Tags.push("target#vaginal");
    }
  }
  const char1Line = `${char1Header}, ${char1Tags.join(", ")}`;

  const basePos = prosePart ? `${baseTags.join(", ")}, ${prosePart}` : baseTags.join(", ");
  const baseWithNeg = negBlocks.length > 0 ? `${basePos}, ${negBlocks.join(", ")}` : basePos;

  const sections: string[] = [`[Base Prompt]\n${baseWithNeg}`, `[Character 1]\n${char1Line}`];

  // In third-person 2-person scenes, add [Character 2] for the male partner with explicit anatomical
  // interaction anchors so V5 renders the male partner consistently instead of dropping him.
  // In POV scenes, omit [Character 2] so the unseen camera-holder is not forced into frame.
  if (hasPartnerBoy && !isPov) {
    const malePoseHint =
      bareSet.has("missionary") || bareSet.has("mating press") || bareSet.has("boy on top")
        ? ", boy on top, male thighs"
        : bareSet.has("cowgirl position") || bareSet.has("reverse cowgirl") || bareSet.has("sixty-nine")
          ? ", lying on back, male thighs"
          : bareSet.has("sex from behind") || bareSet.has("doggystyle") || bareSet.has("spooning")
            ? ", from behind, male hips"
            : "";
    let char2Line = `boy, faceless male, male torso${malePoseHint}`;
    if (hasVaginalAction) {
      char2Line =
        cfg.gender_mode === "femboy"
          ? `boy, faceless male, nude male, male torso${malePoseHint}, 1.25::penis::`
          : `boy, faceless male, nude male, male torso${malePoseHint}, 1.25::penis::, source#vaginal`;
    } else if (hasPenisService) {
      char2Line = `boy, faceless male, nude male, male torso${malePoseHint}, 1.25::penis::`;
    } else if (hasManualMaleHands) {
      char2Line = "boy, faceless male, male hands";
    }
    sections.push(`[Character 2]\n${char2Line}`);
  }

  return sections.join("\n\n");
}

// ==========================================
// Position Library Progressive Stage Orchestrator
// ==========================================
export interface PosStageMetaEntry {
  key: string;
  code: string;
  orderNum: number;
  shortLabel: string;
  compactPill: string;
  fileTag: string;
}

const STAGE_META_BY_CODE: Record<
  string,
  { orderNum: number; shortLabel: string; compactPill: string; fileTag: string }
> = {
  before: { orderNum: 1, shortLabel: "🔥1.进行", compactPill: "1.进行", fileTag: "S1-before" },
  during: { orderNum: 2, shortLabel: "💦2.内射", compactPill: "2.内射", fileTag: "S2-during" },
  after_inside: { orderNum: 3, shortLabel: "🌊3.溢流", compactPill: "3.溢流", fileTag: "S3-after" },
  pull_out: { orderNum: 4, shortLabel: "🔗4.拔出", compactPill: "4.拔出", fileTag: "S4-pullout" },
  prolapse: { orderNum: 5, shortLabel: "🌺5.宫脱", compactPill: "5.宫脱", fileTag: "S5-prolapse" },
};

export const ORDERED_POS_STAGE_ENTRIES: PosStageMetaEntry[] = Object.entries(POS_STAGE_PRESETS)
  .map(([key, code]) => {
    const meta = STAGE_META_BY_CODE[code] ?? {
      orderNum: 9,
      shortLabel: code,
      compactPill: code,
      fileTag: `S-${code}`,
    };
    return { key, code, ...meta };
  })
  .sort((a, b) => a.orderNum - b.orderNum);

export function formatStageFileTag(stageCodeOrKey?: string): string {
  if (!stageCodeOrKey) return "";
  const resolvedCode = POS_STAGE_PRESETS[stageCodeOrKey] ?? stageCodeOrKey;
  return STAGE_META_BY_CODE[resolvedCode]?.fileTag ?? "";
}

export function formatStageBadgeLabel(stageCode?: string): string {
  if (!stageCode) return "";
  return STAGE_META_BY_CODE[stageCode]?.compactPill ?? "";
}

export interface BuildStageProgressionQueueOptions {
  sceneIds: string[];
  selectedStageCodes: string[];
  mode: StageProgressionMode;
  lockSharedSeedPerPose: boolean;
  baseFixedSeed: number;
  repeatsPerStep?: number;
  targetGroupFolder?: string;
  seedGenerator?: () => number;
}

export function buildStageProgressionQueue(
  opts: BuildStageProgressionQueueOptions
): StageProgressionTask[] {
  const validPoses = opts.sceneIds.filter(Boolean);
  if (validPoses.length === 0) return [];

  const codeSet = new Set(opts.selectedStageCodes);
  let chain = ORDERED_POS_STAGE_ENTRIES.filter((e) => codeSet.has(e.code));
  if (chain.length === 0) {
    chain = ORDERED_POS_STAGE_ENTRIES.filter((e) => e.orderNum <= 4);
  }

  const repeats = Math.max(1, Math.floor(opts.repeatsPerStep ?? 1));
  const rollSeed =
    opts.seedGenerator ??
    (() => Math.floor(100_000_000 + Math.random() * 899_999_999));
  const tasks: StageProgressionTask[] = [];

  // Single pose always runs the full selected stage chain so clicking progression on 1 pose is meaningful
  const effectiveMode: StageProgressionMode =
    validPoses.length === 1 ? "per_pose_chain" : opts.mode;

  if (effectiveMode === "per_pose_chain") {
    for (let pIdx = 0; pIdx < validPoses.length; pIdx++) {
      const sceneId = validPoses[pIdx];
      const isTentacle = ALL_POSITIONS_TEMPLATES[sceneId]?.channel === "tentacle";
      for (let r = 0; r < repeats; r++) {
        let sharedSeed: number | undefined;
        if (opts.lockSharedSeedPerPose) {
          sharedSeed =
            validPoses.length === 1 && r === 0 && opts.baseFixedSeed >= 0
              ? Math.floor(opts.baseFixedSeed)
              : rollSeed();
        }
        if (isTentacle) {
          // Tentacle/arthropod poses have built-in fixed stage anatomy; emit once per repeat
          tasks.push({
            sceneId,
            stagePresetKey: "",
            stageCode: "",
            stageOrderNum: 0,
            fixedSeedOverride: sharedSeed,
            targetGroupFolder: opts.targetGroupFolder || undefined,
          });
          continue;
        }
        for (const st of chain) {
          tasks.push({
            sceneId,
            stagePresetKey: st.key,
            stageCode: st.code,
            stageOrderNum: st.orderNum,
            fixedSeedOverride: sharedSeed,
            targetGroupFolder: opts.targetGroupFolder || undefined,
          });
        }
      }
    }
    return tasks;
  }

  // across_poses_arc: Smoothly advance stages from start to end across the checked pose sequence
  const nPoses = validPoses.length;
  const nStages = chain.length;
  for (let pIdx = 0; pIdx < nPoses; pIdx++) {
    const sceneId = validPoses[pIdx];
    const isTentacle = ALL_POSITIONS_TEMPLATES[sceneId]?.channel === "tentacle";
    const sIdx =
      nStages <= 1 || nPoses <= 1
        ? 0
        : Math.min(nStages - 1, Math.round((pIdx * (nStages - 1)) / (nPoses - 1)));
    const st = chain[sIdx];
    for (let r = 0; r < repeats; r++) {
      const fixedSeed =
        opts.lockSharedSeedPerPose && opts.baseFixedSeed >= 0 && r === 0
          ? Math.floor(opts.baseFixedSeed)
          : undefined;
      tasks.push({
        sceneId,
        stagePresetKey: isTentacle ? "" : st.key,
        stageCode: isTentacle ? "" : st.code,
        stageOrderNum: isTentacle ? 0 : st.orderNum,
        fixedSeedOverride: fixedSeed,
        targetGroupFolder: opts.targetGroupFolder || undefined,
      });
    }
  }
  return tasks;
}
