import {
  ANGLE_TAGS_TO_STRIP,
  GAZE_TAGS_TO_STRIP,
  SHOT_TAGS_TO_STRIP,
} from "../data/engineConstants";

const ANGLE_STRIP_SET = new Set(ANGLE_TAGS_TO_STRIP);
const SHOT_STRIP_SET = new Set(SHOT_TAGS_TO_STRIP);
const GAZE_STRIP_SET = new Set(GAZE_TAGS_TO_STRIP);

function fmtWeightTag(tag: string, weight: number): string {
  const w = Number(Math.max(0.5, Math.min(2.0, weight)).toFixed(2));
  if (Math.abs(w - 1.0) < 0.04) {
    return tag;
  }
  return `${w}::${tag}::`;
}

function stripBareTag(rawToken: string): string {
  return rawToken
    .trim()
    .replace(/^-?\d+(?:\.\d+)?::|::$/g, "")
    .trim()
    .toLowerCase();
}

export function describeCameraShort(
  enabled: boolean,
  azimuth: number,
  elevation: number,
  shotCode = "auto",
  wideLens = false,
  dutchAngle = false
): string {
  if (!enabled) {
    return "🔄 随本幕默认";
  }
  const absAz = Math.abs(azimuth);
  const sideCh = azimuth > 0 ? "右" : azimuth < 0 ? "左" : "";
  let azLbl: string;
  if (absAz <= 22) {
    azLbl = "正前";
  } else if (absAz <= 67) {
    azLbl = `${sideCh}前3/4`;
  } else if (absAz <= 112) {
    azLbl = `${sideCh}正侧`;
  } else if (absAz <= 157) {
    azLbl = `${sideCh}后3/4`;
  } else {
    azLbl = "正后";
  }

  let elLbl: string;
  if (elevation >= 62) {
    elLbl = `顶视+${elevation}°`;
  } else if (elevation >= 20) {
    elLbl = `俯拍+${elevation}°`;
  } else if (elevation <= -55) {
    elLbl = `虫视${elevation}°`;
  } else if (elevation <= -18) {
    elLbl = `仰拍${elevation}°`;
  } else {
    elLbl = "平视";
  }

  const shotMap: Record<string, string> = {
    extreme_closeup: "特写",
    upper_body: "半身",
    cowboy: "七分身",
    full_body: "全身",
    wide_shot: "远景",
  };
  const extras: string[] = [];
  if (shotCode in shotMap) {
    extras.push(shotMap[shotCode]);
  }
  if (wideLens) {
    extras.push("广角");
  }
  if (dutchAngle) {
    extras.push("斜角");
  }
  const tail = extras.length > 0 ? `·${extras.join("/")}` : "";
  const azSigned = azimuth >= 0 ? `+${azimuth}` : `${azimuth}`;
  return `${azLbl}(${azSigned}°)·${elLbl}${tail}`;
}

export interface CompiledCameraRig {
  pos_tags: string[];
  gaze_tags: string[];
  neg_add: string[];
  neg_unblock: Set<string>;
  prose_prefix: string;
}

export function compileCameraRig(
  azimuth: number,
  elevation: number,
  shotCode = "auto",
  wideLens = false,
  dutchAngle = false,
  gazeCode = "auto_look"
): CompiledCameraRig {
  const az = Math.max(-180, Math.min(180, Math.trunc(azimuth)));
  const el = Math.max(-80, Math.min(85, Math.trunc(elevation)));
  const absAz = Math.abs(az);

  const posTags: string[] = [];
  const negAdd: string[] = [];
  const negUnblock = new Set<string>();

  // 1. Horizontal Azimuth
  let azProse: string;
  if (absAz <= 22) {
    posTags.push(fmtWeightTag("front view", 1.35), "straight-on");
    negAdd.push("from behind", "back", "profile");
    negUnblock.add("front view");
    negUnblock.add("straight-on");
    azProse = "frontal straight-on";
  } else if (absAz <= 67) {
    const w = 1.3 + 0.1 * ((absAz - 22) / 45.0);
    posTags.push(fmtWeightTag("three-quarter view", w));
    negAdd.push("from behind", "straight-on");
    negUnblock.add("three-quarter view");
    negUnblock.add("from side");
    const sideWord = az > 0 ? "right" : "left";
    azProse = `front-three-quarter (${sideWord} side)`;
  } else if (absAz <= 112) {
    const w = 1.45 - 0.1 * (Math.abs(absAz - 90) / 22.0);
    posTags.push(fmtWeightTag("from side", w), fmtWeightTag("side view", 1.3), "profile");
    negAdd.push("front view", "straight-on", "from behind");
    negUnblock.add("from side");
    negUnblock.add("side view");
    negUnblock.add("profile");
    const sideWord = az > 0 ? "right" : "left";
    azProse = `strict ${sideWord}-side profile`;
  } else if (absAz <= 157) {
    posTags.push(
      fmtWeightTag("from behind", 1.35),
      fmtWeightTag("from side", 1.25),
      "three-quarter rear view",
      "back"
    );
    negAdd.push("front view", "straight-on");
    negUnblock.add("from behind");
    negUnblock.add("back");
    negUnblock.add("from side");
    negUnblock.add("profile");
    const sideWord = az > 0 ? "right" : "left";
    azProse = `rear-three-quarter (${sideWord} back)`;
  } else {
    posTags.push(fmtWeightTag("from behind", 1.45), fmtWeightTag("back", 1.3), "rear view");
    negAdd.push("front view", "straight-on", "profile");
    negUnblock.add("from behind");
    negUnblock.add("back");
    negUnblock.add("rear view");
    azProse = "direct rear-view";
  }

  // 2. Vertical Elevation
  let elProse: string;
  if (el >= 62) {
    const t = (el - 62) / 23.0;
    posTags.push(
      fmtWeightTag("from above", 1.45 + 0.15 * t),
      fmtWeightTag("bird's-eye view", 1.35 + 0.15 * t),
      "overhead shot"
    );
    negAdd.push("from below", "low angle", "worm's-eye view");
    negUnblock.add("from above");
    negUnblock.add("high angle");
    negUnblock.add("bird's-eye view");
    negUnblock.add("overhead");
    elProse = "steep overhead bird's-eye";
  } else if (el >= 20) {
    const t = (el - 20) / 42.0;
    posTags.push(
      fmtWeightTag("from above", 1.25 + 0.2 * t),
      fmtWeightTag("high angle", 1.2 + 0.2 * t)
    );
    negAdd.push("from below", "low angle");
    negUnblock.add("from above");
    negUnblock.add("high angle");
    elProse = "high-angle downward";
  } else if (el <= -55) {
    const t = (Math.abs(el) - 55) / 25.0;
    posTags.push(
      fmtWeightTag("from below", 1.45 + 0.15 * t),
      fmtWeightTag("worm's-eye view", 1.35 + 0.15 * t),
      "extreme low angle"
    );
    negAdd.push("from above", "high angle", "bird's-eye view");
    negUnblock.add("from below");
    negUnblock.add("low angle");
    negUnblock.add("worm's-eye view");
    elProse = "extreme low worm's-eye upward";
  } else if (el <= -18) {
    const t = (Math.abs(el) - 18) / 37.0;
    posTags.push(
      fmtWeightTag("from below", 1.25 + 0.2 * t),
      fmtWeightTag("low angle", 1.2 + 0.2 * t)
    );
    negAdd.push("from above", "high angle");
    negUnblock.add("from below");
    negUnblock.add("low angle");
    elProse = "low-angle upward";
  } else {
    posTags.push("eye-level");
    negAdd.push("bird's-eye view", "worm's-eye view");
    negUnblock.add("eye-level");
    elProse = "eye-level";
  }

  // 3. Shot Size
  let shotProse = "camera shot";
  if (shotCode === "extreme_closeup") {
    posTags.push(fmtWeightTag("close-up", 1.45), "portrait");
    negAdd.push("full body", "wide shot", "distant");
    negUnblock.add("close-up");
    negUnblock.add("portrait");
    shotProse = "tight close-up shot";
  } else if (shotCode === "upper_body") {
    posTags.push(fmtWeightTag("upper body", 1.35), "close-up");
    negAdd.push("full body", "wide shot", "distant");
    negUnblock.add("upper body");
    negUnblock.add("close-up");
    shotProse = "upper-body medium close-up";
  } else if (shotCode === "cowboy") {
    posTags.push(fmtWeightTag("cowboy shot", 1.35));
    negAdd.push("close-up", "portrait", "wide shot");
    negUnblock.add("cowboy shot");
    shotProse = "thighs-up cowboy shot";
  } else if (shotCode === "full_body") {
    posTags.push(fmtWeightTag("full body", 1.4));
    negAdd.push("close-up", "portrait", "cropped legs");
    negUnblock.add("full body");
    shotProse = "full-body framing";
  } else if (shotCode === "wide_shot") {
    posTags.push(fmtWeightTag("wide shot", 1.4), "full body", "distant");
    negAdd.push("close-up", "portrait");
    negUnblock.add("wide shot");
    negUnblock.add("distant");
    negUnblock.add("full body");
    shotProse = "wide-angle full-environment shot";
  }

  // 4. Wide Lens & Dutch Angle
  const lensClauses: string[] = [];
  if (wideLens) {
    posTags.push(fmtWeightTag("foreshortening", 1.4), "perspective", "wide-angle");
    negUnblock.add("foreshortening");
    negUnblock.add("perspective");
    lensClauses.push("dramatic wide-angle foreshortening");
  }
  if (dutchAngle) {
    posTags.push(fmtWeightTag("dutch angle", 1.35), "tilted frame");
    negUnblock.add("dutch angle");
    lensClauses.push("tilted Dutch-angle framing");
  }

  // 5. Gaze
  const gazeTags: string[] = [];
  if (gazeCode === "auto_look") {
    if (absAz > 112) {
      gazeTags.push(fmtWeightTag("looking back", 1.35), "over shoulder", "looking at viewer");
      negUnblock.add("looking back");
      negUnblock.add("looking at viewer");
    } else if (el >= 25) {
      gazeTags.push("looking up", "looking at viewer");
      negUnblock.add("looking at viewer");
    } else if (el <= -25) {
      gazeTags.push("looking down", "looking at viewer");
      negUnblock.add("looking at viewer");
    } else {
      gazeTags.push("looking at viewer");
      negUnblock.add("looking at viewer");
    }
  } else if (gazeCode === "natural_away") {
    gazeTags.push("looking away");
    negAdd.push("looking at viewer");
  }

  const lensTail = lensClauses.length > 0 ? `, ${lensClauses.join(", ")}` : "";
  const shotWord = shotProse === "camera shot" ? "" : ` ${shotProse}`;
  const capEl = elProse.charAt(0).toUpperCase() + elProse.slice(1);
  const prosePrefix = `${capEl} ${azProse}${shotWord} view${lensTail}: `;

  return {
    pos_tags: posTags,
    gaze_tags: gazeTags,
    neg_add: negAdd,
    neg_unblock: negUnblock,
    prose_prefix: prosePrefix,
  };
}

export function applyCameraOverrideToPrompt(
  promptStr: string,
  options: {
    azimuth: number;
    elevation: number;
    shotCode?: string;
    wideLens?: boolean;
    dutchAngle?: boolean;
    gazeCode?: string;
    eyesClosedScene?: boolean;
  }
): string {
  const {
    azimuth,
    elevation,
    shotCode = "auto",
    wideLens = false,
    dutchAngle = false,
    gazeCode = "auto_look",
    eyesClosedScene = false,
  } = options;

  if (!promptStr || promptStr.startsWith("[Base Prompt]")) {
    return promptStr;
  }

  const effectiveGaze = eyesClosedScene ? "keep_scene" : gazeCode;
  const rig = compileCameraRig(azimuth, elevation, shotCode, wideLens, dutchAngle, effectiveGaze);

  let mainNegBody: string | null = null;
  const extraNegBlocks: string[] = [];

  const posOnly = promptStr
    .replace(/(?:,\s*)?(-\d+(?:\.\d+)?)::([\s\S]*?)::/g, (fullMatch, lvl: string, rawBody: string) => {
      if (Math.abs(parseFloat(lvl)) < 1.0) {
        return fullMatch;
      }
      const body = rawBody.replace(/^[ ,]+|[ ,]+$/g, "");
      if (body.includes("nose bridge, nostrils, lips")) {
        extraNegBlocks.push(`${lvl}::${body}::`);
      } else if (lvl === "-2" && mainNegBody === null) {
        mainNegBody = body;
      } else {
        const subTokens = body
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
        const subFiltered = subTokens.filter((t) => !rig.neg_unblock.has(t.toLowerCase()));
        if (subFiltered.length > 0) {
          extraNegBlocks.push(`${lvl}::${subFiltered.join(", ")}::`);
        }
      }
      return "";
    })
    .replace(/^[ ,]+|[ ,]+$/g, "");

  const rawParts = posOnly
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  const stripSet = new Set(ANGLE_STRIP_SET);
  if (shotCode !== "auto") {
    for (const s of SHOT_STRIP_SET) stripSet.add(s);
  }
  if (effectiveGaze !== "keep_scene") {
    for (const g of GAZE_STRIP_SET) stripSet.add(g);
  }

  let proseStartIdx: number | null = null;
  for (let i = 0; i < rawParts.length; i++) {
    const seg = rawParts[i];
    if (!seg || seg.includes("::")) continue;
    const wordCount = seg.trim().split(/\s+/).length;
    if (/^[A-Z]|^the girl\b/.test(seg.trim()) || wordCount >= 8) {
      proseStartIdx = i;
      break;
    }
  }

  let tagSegments: string[];
  let proseSegment = "";
  if (proseStartIdx !== null) {
    tagSegments = rawParts.slice(0, proseStartIdx);
    proseSegment = rawParts.slice(proseStartIdx).join(", ");
  } else {
    tagSegments = rawParts;
  }

  const cleanedTags: string[] = [];
  let insertPos: number | null = null;
  for (const seg of tagSegments) {
    const bare = stripBareTag(seg);
    if (stripSet.has(bare)) {
      if (insertPos === null) {
        insertPos = cleanedTags.length;
      }
      continue;
    }
    cleanedTags.push(seg);
  }

  if (insertPos === null) {
    insertPos = Math.min(cleanedTags.length, 5);
  }

  const injected = [...rig.pos_tags, ...rig.gaze_tags];
  const existingBares = new Set(cleanedTags.map((x) => stripBareTag(x)));
  const dedupInjected = injected.filter((t) => !existingBares.has(stripBareTag(t)));
  const finalTags = [
    ...cleanedTags.slice(0, insertPos),
    ...dedupInjected,
    ...cleanedTags.slice(insertPos),
  ];

  if (proseSegment) {
    const proseCleanSubs: Array<[RegExp, string]> = [
      [/\b(?:Close-up\s+)?First-person POV\s+(?:standing right behind|looking down)?\s*/gi, ""],
      [/\bFull-body angled rear-side view of\s*/gi, ""],
      [/\bFrontal cowboy shot of\s*/gi, ""],
      [/\bAngled missionary view\b/gi, ""],
      [/\b(?:seen|viewed|captured|shot) from behind,?\s*/gi, ""],
      [/\bfrom a (?:steep )?(?:low|high) angle\b/gi, ""],
      [/\bin three-quarter side view,?\s*/gi, ""],
    ];
    for (const [pat, rep] of proseCleanSubs) {
      proseSegment = proseSegment.replace(pat, rep);
    }
    proseSegment = proseSegment.replace(/\s{2,}/g, " ").replace(" .", ".");

    const colonI = proseSegment.indexOf(":");
    if (colonI !== -1 && colonI < 180) {
      const headP = proseSegment.slice(0, colonI + 1);
      const tailP = proseSegment.slice(colonI + 1).trim();
      const shortPrefix = rig.prose_prefix.split(",")[0].replace(/[: ]+$/g, "") + ", ";
      proseSegment = `${headP} ${shortPrefix}${tailP}`;
    } else {
      proseSegment = `${rig.prose_prefix}${proseSegment}`;
    }
    proseSegment = proseSegment.replace("a eye-level", "an eye-level");
    finalTags.push(proseSegment);
  }

  if (mainNegBody !== null) {
    const negTokens = (mainNegBody as string)
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const filteredNeg = negTokens.filter((t) => !rig.neg_unblock.has(t.toLowerCase()));
    const lowerExisting = new Set(filteredNeg.map((t) => t.toLowerCase()));
    for (const na of rig.neg_add) {
      const lowNa = na.toLowerCase();
      if (!lowerExisting.has(lowNa) && !rig.neg_unblock.has(lowNa)) {
        filteredNeg.unshift(na);
        lowerExisting.add(lowNa);
      }
    }
    if (filteredNeg.length > 0) {
      finalTags.push(`-2::${filteredNeg.join(", ")}::`);
    }
  }

  finalTags.push(...extraNegBlocks);
  return finalTags.join(", ");
}
