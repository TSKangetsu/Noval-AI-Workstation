// NovelAI V4.5 / V5 Substitute Photo-Over-Face & Post-Coital Belly-Press Play (PS01-PS04 · 18. 替身盖照)
// Calibrated from 4 live-verified 1664x2432 V5 Full upscaled stages:
// - Never put bare `2girls` in Negative UC (preserves distinct portrait identity inside the photo)
// - Dynamic contrasting portrait pairing (Javelin photo by default; swaps to Laffey when supine is Javelin/purple-haired)
// - PS04 continuous bottom-border male arm guard (never put `male torso` in UC)

export type PhotoSubstituteCategory = "18. 替身盖照";

export type PhotoSubstituteStageKind =
  | "missionary_intact"
  | "missionary_multibox"
  | "missionary_climax_unbuttoned"
  | "aftersex_belly_press";

export const PHOTO_SUBSTITUTE_GUARD_UC =
  "two bodies, 2girls lying together, 2girls lying side by side, standing girl, extra person, floating girl, twins, identical hair, uncovered eyes on bed, holding photo, holding paper, 2koma, split screen, panel border";

export const PHOTO_SUBSTITUTE_BELLY_PRESS_ARM_UC =
  "floating arm, detached arm, severed arm, cut off limb, amputee, male back, male head, penetration, pregnant, huge belly";

export interface PhotoSubstitutePortraitSpec {
  char_tag: string;
  eng_name: string;
  short_zh: string;
  trait_tags: string;
  prose_desc: string;
  c1_anti_bleed_neg: string;
  c2_anti_bleed_neg: string;
}

export function resolveContrastingPhotoPortrait(
  supineCharTag: string,
  extraCharTags = ""
): PhotoSubstitutePortraitSpec {
  const probe = `${supineCharTag} ${extraCharTags}`.toLowerCase();
  const isJavelinOrPurpleHair =
    /\bjavelin\b|\bpurple hair\b|\bperiwinkle hair\b|\blavender hair\b|\bunicorn \(azur lane\)/i.test(
      probe
    );

  if (isJavelinOrPurpleHair) {
    return {
      char_tag: "laffey (azur lane)",
      eng_name: "Laffey",
      short_zh: "拉菲笑颜照",
      trait_tags:
        "long white hair, twin tails, white rabbit-ear hairband, bright red eyes, warm cheerful smile",
      prose_desc: "white-haired twin-tailed Laffey with bright red eyes and a warm cheerful smile",
      c1_anti_bleed_neg: "-2.5::white hair, red eyes, rabbit ears::",
      c2_anti_bleed_neg: "-2.5::body, torso, arms, legs, purple hair, maid dress, crying::",
    };
  }

  return {
    char_tag: "javelin (azur lane)",
    eng_name: "Javelin",
    short_zh: "标枪笑颜照",
    trait_tags:
      "purple hair, navy butterfly hair ribbon, bright green eyes, warm cheerful smile",
    prose_desc:
      "purple-haired Javelin with a navy butterfly hair ribbon, bright green eyes, and a warm cheerful smile",
    c1_anti_bleed_neg: "-2.5::purple hair, green eyes::",
    c2_anti_bleed_neg: "-2.5::body, torso, arms, legs, white hair, maid dress, crying::",
  };
}

export interface RawPhotoSubstituteEntry {
  id: string;
  title: string;
  sub: string;
  category: PhotoSubstituteCategory;
  canvas: string;
  stage_kind: PhotoSubstituteStageKind;
  is_multibox_photo_anchor: boolean;
  is_aftersex_belly_press: boolean;
  chest_covered: boolean;
  light_badge: string;
  light_tags: string;
  light_prose: string;
  framing_tags: string;
  env_tags: string;
  core_prop_tags: string;
  builtin_outfit: string;
  femboy_outfit: string;
  expr_tags: string;
  female_tags: string;
  femboy_tags: string;
  futa_tags: string;
  extra_neg: string;
}

export const ALL_RAW_PHOTO_SUBSTITUTE_ENTRIES: RawPhotoSubstituteEntry[] = [
  {
    id: "PS01",
    title: "露肩女仆装掀裙至腰·白边微笑相片盖眼第一人称正常位",
    sub: "Intact Maid Bodice Missionary POV with Smiling Portrait Photo Over Face",
    category: "18. 替身盖照",
    canvas: "竖图 832x1216",
    stage_kind: "missionary_intact",
    is_multibox_photo_anchor: false,
    is_aftersex_belly_press: false,
    chest_covered: true,
    light_badge: "🛏️柔暖卧床顶光",
    light_tags: "soft indoor bedroom lighting, gentle pillow shadow contrast",
    light_prose: "lit by soft warm bedroom light across crisp white sheets.",
    framing_tags:
      "1.55::pov::, 1.55::from above::, top-down view, looking down, 1.55::missionary::, 1.5::on back::, lying on bed",
    env_tags:
      "indoors, bedroom, crisp white rectangular pillow under head, rumpled white bedsheets",
    core_prop_tags:
      "1.7::covered face::, 1.65::covered eyes::, 1.7::photograph::, tilted white-bordered portrait photo on face, flat paper photo covering eyes",
    builtin_outfit:
      "navy-blue and white cold-shoulder maid dress, intact white ruffled buttoned bodice, navy collar bowtie with blue gem, double-breasted navy waist corset, white frilly maid headdress, 1.55::skirt lift::, maid skirt bunched around waist, white thighhighs",
    femboy_outfit:
      "navy-blue and white cold-shoulder maid dress, intact white ruffled buttoned bodice, navy collar bowtie with blue gem, white frilly maid headdress, 1.55::skirt lift::, maid skirt bunched around waist, white thighhighs",
    expr_tags:
      "flushed chin below photo border, small open gasping mouth, single teardrop on cheek",
    female_tags:
      "arms gripping white bedsheet, legs spread wide, pov crotch, penis, 1.55::vaginal::, deep insertion, 1.5::cum overflow::",
    femboy_tags:
      "arms gripping white bedsheet, legs spread wide, pov crotch, penis, 1.55::anal::, deep anal insertion, 1.4::small penis::, 1.5::cum in ass::",
    futa_tags:
      "arms gripping white bedsheet, legs spread wide, pov crotch, penis, 1.5::vaginal::, deep insertion, 1.45::small penis::, 1.5::cum overflow::",
    extra_neg: "male back, male head, male shoulders",
  },
  {
    id: "PS02",
    title: "双框坐标锚定挂脖领饰·相片平铺遮面微张喘息正常位",
    sub: "Multi-Box [C3 Body + C2 Photo] Coordinate-Anchored Maid Missionary POV",
    category: "18. 替身盖照",
    canvas: "竖图 832x1216",
    stage_kind: "missionary_multibox",
    is_multibox_photo_anchor: true,
    is_aftersex_belly_press: false,
    chest_covered: true,
    light_badge: "🛏️柔暖卧床顶光",
    light_tags: "soft indoor bedroom lighting, gentle pillow shadow contrast",
    light_prose: "lit by soft warm bedroom light across crisp white sheets.",
    framing_tags:
      "1.55::pov::, 1.55::from above::, top-down view, looking down, 1.55::missionary::, 1.5::on back::, lying on bed",
    env_tags:
      "indoors, white rectangular pillow at top, rumpled white bedsheets",
    core_prop_tags:
      "1.7::photograph:: flat over lying face, substitute photo play",
    builtin_outfit:
      "navy-blue and white cold-shoulder maid dress, buttoned white ruffled chest, navy halter straps, navy collar bowtie with blue gem, white frilly maid headdress, 1.55::skirt lift::, maid skirt bunched at waist, white thighhighs",
    femboy_outfit:
      "navy-blue and white cold-shoulder maid dress, buttoned white ruffled chest, navy halter straps, navy collar bowtie with blue gem, white frilly maid headdress, 1.55::skirt lift::, maid skirt bunched at waist, white thighhighs",
    expr_tags:
      "small open moaning mouth below photo, flushed chin, teardrop on cheek",
    female_tags:
      "hands gripping bedsheet, legs spread, pov crotch, penis, 1.55::vaginal::, insertion, 1.5::cum overflow::",
    femboy_tags:
      "hands gripping bedsheet, legs spread, pov crotch, penis, 1.55::anal::, anal insertion, 1.4::small penis::, 1.5::cum in ass::",
    futa_tags:
      "hands gripping bedsheet, legs spread, pov crotch, penis, 1.5::vaginal::, insertion, 1.45::small penis::, 1.5::cum overflow::",
    extra_neg: "male back, male head, male shoulders",
  },
  {
    id: "PS03",
    title: "女仆前襟解扣敞胸紧抓枕角·笑脸相片下双行落泪高潮",
    sub: "Unbuttoned Maid Bodice Climax with Tears Streaming Under Smiling Photo",
    category: "18. 替身盖照",
    canvas: "竖图 832x1216",
    stage_kind: "missionary_climax_unbuttoned",
    is_multibox_photo_anchor: false,
    is_aftersex_belly_press: false,
    chest_covered: false,
    light_badge: "🛏️柔暖卧床顶光",
    light_tags: "soft indoor bedroom lighting, dewy skin highlights on bed",
    light_prose: "lit by soft warm bedroom light across crisp white sheets.",
    framing_tags:
      "1.55::pov::, 1.55::from above::, top-down view, looking down, 1.55::missionary::, 1.5::on back::, lying on bed",
    env_tags:
      "indoors, bedroom, crisp white rectangular pillow under head, rumpled white bedsheets",
    core_prop_tags:
      "1.7::covered face::, 1.65::covered eyes::, 1.7::photograph::, askew white-bordered portrait photo on face, covering upper face and eyes",
    builtin_outfit:
      "disheveled navy and white frilly maid dress, unbuttoned open white ruffled bodice, bare breasts, 1.3::nipples::, navy collar bowtie with blue gem, white frilly maid headdress, 1.55::skirt lift::, maid skirt bunched around waist, white thighhighs",
    femboy_outfit:
      "disheveled navy and white frilly maid dress, unbuttoned open white ruffled bodice, navy collar bowtie with blue gem, white frilly maid headdress, 1.55::skirt lift::, maid skirt bunched around waist, white thighhighs",
    expr_tags:
      "1.5::tears:: streaming beneath photo border, flushed cheeks, trembling open gasping mouth, saliva trail",
    female_tags:
      "both hands gripping white pillow corners, trembling thighs spread wide, pov crotch, penis, 1.55::vaginal::, climax insertion, heavy 1.55::cum overflow::",
    femboy_tags:
      "both hands gripping white pillow corners, trembling thighs spread wide, pov crotch, penis, 1.55::anal::, climax anal insertion, 1.4::small penis::, 1.45::ejaculation::",
    futa_tags:
      "both hands gripping white pillow corners, trembling thighs spread wide, pov crotch, penis, 1.5::vaginal::, climax insertion, 1.45::small penis::, 1.45::ejaculation::, heavy 1.55::cum overflow::",
    extra_neg: "male back, male head, male shoulders",
  },
  {
    id: "PS04",
    title: "事后脱力推高女仆裙露软腹·单手按陷脐下小腹挤出浓精",
    sub: "Post-Coital Limp Maid Skirt-Up & Continuous POV Arm Belly-Press Cum Squeeze",
    category: "18. 替身盖照",
    canvas: "竖图 832x1216",
    stage_kind: "aftersex_belly_press",
    is_multibox_photo_anchor: false,
    is_aftersex_belly_press: true,
    chest_covered: true,
    light_badge: "🛏️柔暖卧床顶光",
    light_tags: "soft indoor bedroom lighting, glossy specular highlights on skin",
    light_prose: "lit by soft warm bedroom light across rumpled white bedsheets.",
    framing_tags:
      "1.55::pov::, 1.55::from above::, top-down view, looking down, 1.65::after sex::, 1.5::on back::, lying limp on bed, exhausted",
    env_tags:
      "indoors, crisp white rectangular pillow under head, messy rumpled white bedsheets",
    core_prop_tags:
      "1.7::covered face::, 1.65::covered eyes::, 1.7::photograph::, askew white-bordered portrait photo on face, 1.65::bare stomach::, exposed navel and smooth lower belly, 1.65::pov hands::, continuous tanned male arm from bottom border, male palm pressing flat below navel, fingers sinking into soft belly skin",
    builtin_outfit:
      "disheveled navy and white frilly maid dress, dress pushed high up to chest, navy bowtie with blue gem, white frilly maid headdress, limp wrists with white cuffs by pillow, white thighhighs",
    femboy_outfit:
      "disheveled navy and white frilly maid dress, dress pushed high up to chest, navy bowtie with blue gem, white frilly maid headdress, limp wrists with white cuffs by pillow, white thighhighs",
    expr_tags:
      "teardrops rolling beneath photo edge, flushed cheeks, panting open mouth, saliva",
    female_tags:
      "1.65::after vaginal::, limp thighs spread wide, reddened pussy, 1.7::cum overflow::, 1.65::cumdrip::, thick white semen gushing onto bedsheet, warm puddle of cum",
    femboy_tags:
      "1.65::after anal::, limp thighs spread wide, 1.4::small penis::, 1.7::cum in ass::, 1.65::cumdrip::, thick white semen gushing onto bedsheet, warm puddle of cum",
    futa_tags:
      "1.65::after vaginal::, limp thighs spread wide, 1.45::small penis::, reddened pussy, 1.7::cum overflow::, 1.65::cumdrip::, thick white semen gushing onto bedsheet",
    extra_neg: PHOTO_SUBSTITUTE_BELLY_PRESS_ARM_UC,
  },
];
