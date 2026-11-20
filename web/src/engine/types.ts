export type PerspectiveMode = "pov" | "3rd";
export type ActionMode = "positions" | "multi_angle" | "free";
export type CharacterGenderMode =
  | "normal"
  | "femboy"
  | "futa_no_balls"
  | "futa_with_balls";

export interface CharacterConfig {
  preset_name: string;
  char_tag: string;
  eng_name: string;
  canon_neg_tags: string;
  extra_char_tags: string;
  gender_mode?: CharacterGenderMode;

  body_preset: string;
  bust_preset: string;
  skin_preset: string;
  outfit_preset: string;
  outfit_state_mode: string;
  custom_outfit_tags: string;
  keep_canon_elements: boolean;
  legwear_preset: string;

  add_cat_ears: boolean;
  add_horns_tail: boolean;
  add_glasses: boolean;
  add_choker: boolean;
  add_extra_sweat: boolean;

  style_preset: string;
  lighting_preset: string;
  env_preset: string;
  custom_style_pos: string;
  custom_style_neg: string;
  morph_preset: string;
  pubic_preset: string;
  pigment_preset: string;
  fluid_scale: number;

  perspective_mode: PerspectiveMode;

  enable_quality: boolean;
  enable_style: boolean;
  enable_identity: boolean;
  enable_body: boolean;
  enable_outfit: boolean;
  enable_clothing_state: boolean;
  enable_legwear: boolean;
  enable_background: boolean;
  enable_expression: boolean;
  enable_anatomy: boolean;
  enable_action_fluids: boolean;
  enable_t5_prose: boolean;
  enable_negatives: boolean;
  enable_multi_angle_nsfw: boolean;
  enable_uterus_xray: boolean;
  enable_condom: boolean;

  pos_transparent_bg: boolean;
  pos_scene: string;
  pos_male_mode: string;
  pos_show_penis: boolean;
  pos_stage: string;

  free_action_tags: string;
  free_action_prose: string;
  free_action_nsfw: boolean;

  expr_preset: string;
  expr_eye_state: string;
  expr_mouth_state: string;
  expr_brow_blush: string;
  expr_heart_eyes: boolean;
  expr_empty_eyes: boolean;
  expr_tears: boolean;
  custom_expression_tags: string;
  pos_token_limit?: number;
  wb_v2_migrated?: boolean;
}

export function createDefaultCharacterConfig(): CharacterConfig {
  return {
    preset_name: "标枪 Javelin（碧蓝航线 · 默认）",
    char_tag: "javelin (azur lane)",
    eng_name: "Javelin",
    canon_neg_tags: "neckerchief, serafuku, plaid, gloves, crown",
    extra_char_tags: "",
    gender_mode: "normal",

    body_preset: "纤细娇小（原版默认 slender, petite）",
    bust_preset: "默认随角色原设",
    skin_preset: "自然暖透肤（原版默认）",
    outfit_preset: "宽松滑肩白T恤·下身真空（故事线默认）",
    outfit_state_mode: "🔄 智能适配穿脱（原设/裙装自动撩裙拨内裤 · 单件上衣自动真空）",
    custom_outfit_tags: "",
    keep_canon_elements: false,
    legwear_preset: "赤足裸腿（barefoot 默认）",

    add_cat_ears: false,
    add_horns_tail: false,
    add_glasses: false,
    add_choker: false,
    add_extra_sweat: false,

    style_preset: "137_128 锋利钢笔水彩空气感逆光（原版默认）",
    lighting_preset: "🔄 随画风与本幕默认光影（不额外覆盖）",
    env_preset: "🔄 随本幕/体位工具栏默认环境",
    custom_style_pos: "",
    custom_style_neg: "",
    morph_preset: "1D 微明显蝴蝶低过渡（原版默认）",
    pubic_preset: "默认不额外指定",
    pigment_preset: "3A 透肤暖珊瑚无色差（原版默认）",
    fluid_scale: 1.0,

    perspective_mode: "3rd",

    enable_quality: true,
    enable_style: true,
    enable_identity: true,
    enable_body: true,
    enable_outfit: true,
    enable_clothing_state: true,
    enable_legwear: true,
    enable_background: true,
    enable_expression: true,
    enable_anatomy: true,
    enable_action_fluids: true,
    enable_t5_prose: true,
    enable_negatives: true,
    enable_multi_angle_nsfw: false,
    enable_uterus_xray: false,
    enable_condom: false,

    pos_transparent_bg: false,
    pos_scene: "🛋️ 默认暖光室内沙发（indoors, couch, lamp）",
    pos_male_mode: "👤 正常显示男方（默认无脸男 faceless male）",
    pos_show_penis: true,
    pos_stage: "🔥 1. 射精前 · 进行中（默认专注体位连接 · 无白浊）",

    free_action_tags: "cowboy shot, sitting, crossed legs, head tilt, gentle smile, looking at viewer",
    free_action_prose: "",
    free_action_nsfw: false,

    expr_preset: "🔄 随本幕剧情默认（保留原幕微表情与熟睡/半醒节奏）",
    expr_eye_state: "随表情预设默认",
    expr_mouth_state: "随表情预设默认",
    expr_brow_blush: "随表情预设默认",
    expr_heart_eyes: false,
    expr_empty_eyes: false,
    expr_tears: false,
    custom_expression_tags: "",
    wb_v2_migrated: true,
  };
}

export interface ScenePromptItem {
  subTitle: string;
  canvas: string;
  prompt: string;
}

export interface TokenCountInfo {
  web_single_box_tokens: number;
  api_pos_tokens: number;
  api_neg_tokens: number;
  inline_neg_tokens: number;
  exact_spiece: boolean;
}

export type NaiModelId =
  | "nai-diffusion-5-full"
  | "nai-diffusion-5-full-medium"
  | "nai-diffusion-4-5-full";
export type NaiUcPresetMode = "heavy" | "light" | "human_focus" | "none";
export type CarouselMode = "manual" | "follow_latest" | "timed";

export interface VibeEncodingEntry {
  hashKey: string;
  encoding: string;
  informationExtracted: number;
}

export interface StoredVibeItem {
  id: string;
  name: string;
  enabled: boolean;
  strength: number;
  selectedModelKey: string;
  selectedHashKey: string;
  informationExtracted: number;
  encodings: Record<string, VibeEncodingEntry[]>;
  thumbnailDataUrl?: string;
  rawImageBase64?: string;
  createdAt: number;
}

export interface VibeTransferSlotInput {
  encoding: string;
  strength: number;
  informationExtracted: number;
  name?: string;
}

export interface NaiApiSettings {
  api_token: string;
  model: NaiModelId;
  steps: number;
  canvas_preset: string;
  scale: number;
  cfg_rescale: number;
  seed: number;
  batch_count: number;
  uc_preset_mode: NaiUcPresetMode;
  uc_preset_migrated_v2?: boolean;
  pos_neg_split_migrated_v1?: boolean;
  v5_rescale_migrated_v1?: boolean;
  keep_inline_negatives: boolean;
  extra_uc: string;
  append_v5_quality: boolean;
  vibe_transfer_enabled: boolean;
  vibe_normalize_strength: boolean;
  auto_download: boolean;
  auto_upscale_replace: boolean;
  auto_fullscreen_carousel: boolean;
  carousel_auto_mode: "follow_latest" | "timed";
  carousel_interval_sec: number;
}

export function createDefaultNaiApiSettings(): NaiApiSettings {
  return {
    api_token: "",
    model: "nai-diffusion-4-5-full",
    steps: 28,
    canvas_preset: "🔄 自动跟随本幕推荐画布",
    scale: 7.0,
    cfg_rescale: 0.0,
    seed: -1,
    batch_count: 1,
    uc_preset_mode: "heavy",
    uc_preset_migrated_v2: true,
    pos_neg_split_migrated_v1: true,
    v5_rescale_migrated_v1: true,
    keep_inline_negatives: false,
    extra_uc: "",
    append_v5_quality: true,
    vibe_transfer_enabled: true,
    vibe_normalize_strength: true,
    auto_download: false,
    auto_upscale_replace: false,
    auto_fullscreen_carousel: true,
    carousel_auto_mode: "follow_latest",
    carousel_interval_sec: 4,
  };
}

export interface SubscriptionInfo {
  tier: number;
  tier_name: string;
  active: boolean;
  anlas_left: number;
  fixed_anlas: number;
  purchased_anlas: number;
  opus_usage_percent: number | null;
  opus_usage_negative: boolean;
  unlimited_max_priority: boolean;
  expires_at: number;
}

export type GalleryFilterMode = "all" | "starred" | "upscaled" | "scene";
export type GalleryStageViewMode = "single" | "grid" | "compare" | "shootout";
export type StageProgressionMode = "per_pose_chain" | "across_poses_arc";

export interface GalleryFolderItem {
  id: string;
  name: string;
  created_at: number;
}

export interface StageProgressionTask {
  sceneId: string;
  stagePresetKey: string;
  stageCode: string;
  stageOrderNum: number;
  fixedSeedOverride?: number;
  targetGroupFolder?: string;
}

export interface GeneratedConfigSnapshot {
  cfg: CharacterConfig;
  action_mode: ActionMode;
  model: NaiModelId;
  steps: number;
  scale: number;
  cfg_rescale: number;
  uc_preset_mode: NaiUcPresetMode;
  extra_uc: string;
  append_v5_quality: boolean;
}

export interface GeneratedImageRecord {
  id: string;
  scene_id: string;
  mode_label: string;
  filename: string;
  bytes: Uint8Array;
  objectUrl: string;
  seed: number;
  width: number;
  height: number;
  elapsed_sec: number;
  estimated_anlas: number;
  created_at: number;
  prompt_pos?: string;
  prompt_neg?: string;
  is_upscaled?: boolean;
  is_starred?: boolean;
  saved_to_dir?: boolean;
  disk_subpath?: string[];
  config_snapshot?: GeneratedConfigSnapshot;
  reroll_group_id?: string;
  group_folder?: string;
  stage_code?: string;
}
