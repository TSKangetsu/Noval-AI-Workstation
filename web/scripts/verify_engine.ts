import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  ALL_POSITIONS_CHAPTERS,
  ALL_POSITIONS_TEMPLATES,
  BODY_PRESETS,
  BUNDLED_CUSTOM_PRESETS,
  EXPRESSION_PRESETS,
  FREE_ACTION_STARTERS,
  LIGHTING_PRESETS,
  MODEL_V4_5_FULL,
  MODEL_V5_FULL,
  MODEL_V5_FULL_MEDIUM,
  MULTI_ANGLE_CHAPTERS,
  OTHER_ACTION_CHAPTERS,
  OTHER_ACTION_TEMPLATES,
  POS_STAGE_PRESETS,
  resolveLightingForStyle,
  STYLE_BUNDLED_VIBE_PACK,
  STYLE_PRESETS,
} from "../src/data/engineConstants";
import { BUNDLED_VIBE_PACKS, cloneBundledVibeItems } from "../src/data/bundledVibes";
import {
  buildStageProgressionQueue,
  formatStageFileTag,
  generateScenePrompts,
} from "../src/engine/storyEngine";
import {
  computeSafePosTokenLimit,
  countPromptT5Tokens,
  countSeparatedT5Tokens,
  initT5Tokenizer,
  mergePosAndNegToInline,
  splitPromptPosAndNeg,
} from "../src/engine/t5Tokenizer";
import {
  createDefaultCharacterConfig,
  type GalleryFolderItem,
  type GeneratedImageRecord,
} from "../src/engine/types";
import {
  buildGalleryFolderSummaries,
  hasEffectiveGallerySelector,
  selectGalleryRecordIndices,
} from "../src/services/galleryFileHelpers";
import { resolveMcpEndpoints } from "../src/services/mcpBridgeClient";
import {
  buildNaiGeneratePayload,
  estimateNaiAnlas,
  formatOpusBatterySummary,
} from "../src/services/naiApiClient";
import {
  buildStoreZipBlob,
  clearDeletedPresets,
  filterStarredGalleryForPersist,
  loadCustomPresets,
  loadDeletedPresets,
  markPresetDeleted,
  resolveRecordDiskSubpath,
  sanitizeSubfolderName,
  unmarkPresetDeleted,
} from "../src/services/storageService";
import {
  buildActiveVibeSlotsForModel,
  parseVibeBundleJsonText,
  parseVibeFileBytes,
  serializeVibeBundle,
} from "../src/services/vibeBundleParser";

async function main(): Promise<void> {
  await initT5Tokenizer();

  // 1. Verify T5 exact SentencePiece tokenizer across all Multi-Angle, 51 Positions (POV & 3rd), and Free Action modes
  const cfg = createDefaultCharacterConfig();
  let totalPrompts = 0;

  for (const ch of MULTI_ANGLE_CHAPTERS) {
    const items = generateScenePrompts(ch.id, cfg, "3rd");
    assert(items.length > 0, `Expected non-empty prompt list for ${ch.id}`);
    for (const it of items) {
      const tok = countPromptT5Tokens(it.prompt);
      assert.equal(tok.exact_spiece, true, "Expected exact SentencePiece tokenizer");
      assert(tok.api_pos_tokens <= 512, `${ch.id} exceeded 512 positive T5 tokens: ${tok.api_pos_tokens}`);
      totalPrompts++;
    }
  }

  for (const mode of ["pov", "3rd"] as const) {
    for (const ch of ALL_POSITIONS_CHAPTERS) {
      const items = generateScenePrompts(ch.id, cfg, mode);
      assert(items.length > 0, `Expected non-empty prompt list for ${ch.id} (${mode})`);
      for (const it of items) {
        const tok = countPromptT5Tokens(it.prompt);
        assert.equal(tok.exact_spiece, true);
        assert(tok.api_pos_tokens <= 512, `${ch.id} (${mode}) exceeded 512 positive T5 tokens: ${tok.api_pos_tokens}`);
        totalPrompts++;
      }
    }
  }

  // 2. Verify new FREE ("✍️ 自由手写动作") mode (SFW, NSFW + Anatomy + X-Ray, Transparent BG, Starter Templates)
  for (const starter of FREE_ACTION_STARTERS) {
    const freeCfg = {
      ...createDefaultCharacterConfig(),
      free_action_tags: starter.tags,
      free_action_prose: starter.prose,
      free_action_nsfw: Boolean(starter.nsfw),
    };
    const [freeItem] = generateScenePrompts("FREE", freeCfg, "3rd");
    assert(freeItem && freeItem.prompt.includes("laffey (azur lane)"), "FREE mode must inherit default Laffey identity");
    const tok = countPromptT5Tokens(freeItem.prompt);
    assert(tok.api_pos_tokens <= 512, `FREE starter ${starter.label} exceeded 512 tokens`);
    if (starter.nsfw) {
      assert(freeItem.prompt.includes("rating:explicit"), "NSFW FREE starter must include rating:explicit");
    } else {
      const sp = splitPromptPosAndNeg(freeItem.prompt);
      assert(sp.negPrompt.includes("nsfw"), "SFW FREE starter must guard 'nsfw' in negative");
    }
    totalPrompts++;
  }

  const [freeTrans] = generateScenePrompts(
    "FREE",
    {
      ...createDefaultCharacterConfig(),
      pos_transparent_bg: true,
      free_action_nsfw: true,
      enable_uterus_xray: true,
    },
    "3rd"
  );
  assert(
    freeTrans.prompt.includes("2.0::transparent background::") &&
      freeTrans.prompt.includes("1.4::uterus::"),
    "FREE mode must support RGBA transparent background and optional uterus x-ray when NSFW is enabled"
  );

  // 3. Verify Studio 2.0 Inline Card Switches, Extra Char Tags (zero hardcoded eye/hair), & Style->Lighting/Vibe Sync
  const defaultP01 = generateScenePrompts("P01", cfg, "3rd")[0].prompt;
  assert(
    !defaultP01.includes("purple eyes") && !defaultP01.includes("short purple hair"),
    "Built-in character presets must not inject hardcoded eye_color or hair_tags"
  );
  const customExtraPrompt = generateScenePrompts(
    "P01",
    { ...createDefaultCharacterConfig(), extra_char_tags: "aqua eyes, long silver hair, hairband" },
    "3rd"
  )[0].prompt;
  assert(
    customExtraPrompt.includes("aqua eyes") && customExtraPrompt.includes("long silver hair"),
    "extra_char_tags must supply custom eye/hair/accessory tags cleanly"
  );
  assert.equal(
    resolveLightingForStyle("🧬✨ M2 单画师极细净线赛璐璐风（mikozin 0.62 + 净黑细线 · 内置3槽Vibe调校）"),
    "💎👁️ 极细净黑线 · 丝绒渐变瞳双眼皮睫毛 + 三阶奶桃锁骨柔影（M2 Razor-Fine Cel）"
  );
  assert.equal(
    resolveLightingForStyle("🍑 四画师清透奶桃纤柔赛璐璐风（shouu-kun 0.52 + mikozin 0.36 + gotyou 0.32 + izuoku 0.28）"),
    "🍑✨ 三阶奶桃柔影 · 锁骨烟粉次级暗部 + 白衣冰蓝冷影（Milky-Peach 3-Tier Cel）"
  );
  assert.equal(
    resolveLightingForStyle("137_128 锋利钢笔水彩空气感逆光（原版默认）"),
    "🔄 随画风与本幕默认光影（不额外覆盖）"
  );
  assert.equal(
    STYLE_BUNDLED_VIBE_PACK["🧬✨ M2 单画师极细净线赛璐璐风（mikozin 0.62 + 净黑细线 · 内置3槽Vibe调校）"],
    "m2_mikozin062_triple"
  );

  const noIdPrompt = generateScenePrompts(
    "P01",
    { ...createDefaultCharacterConfig(), enable_identity: false, enable_body: false },
    "3rd"
  )[0].prompt;
  assert(!noIdPrompt.includes("laffey (azur lane)"), "Identity tag must be omitted when enable_identity=false");
  assert(noIdPrompt.includes("the girl"), "Generic prose subject 'the girl' must be used when enable_identity=false");

  const noOutfitPrompt = generateScenePrompts(
    "P01",
    { ...createDefaultCharacterConfig(), enable_outfit: false, enable_legwear: false },
    "3rd"
  )[0].prompt;
  assert(
    !noOutfitPrompt.includes("t-shirt") && !noOutfitPrompt.includes("clothes lift"),
    "Turning enable_outfit=false must strip outfit tags cleanly without emitting orphan 'clothes lift'"
  );

  // 4. Verify Model Payload Routing: V4.5 Full vs V5 Full High vs V5 Full Medium
  const samplePrompt = generateScenePrompts("P01", cfg, "3rd")[0].prompt;
  const v45Res = buildNaiGeneratePayload({
    model: MODEL_V4_5_FULL,
    rawPrompt: samplePrompt,
    width: 832,
    height: 1216,
    steps: 28,
    scale: 7.0,
    cfgRescale: 0.0,
    seed: 123456,
  });
  const p45 = v45Res.payload.parameters as Record<string, unknown>;
  assert.equal(v45Res.payload.model, "nai-diffusion-4-5-full");
  assert.equal(p45.params_version, 3);
  assert.equal(p45.steps, 28);
  assert.equal(p45.sampler, "k_euler_ancestral");
  assert(!String(v45Res.payload.input).includes("-2::"), "V4.5 separates negatives out of positive caption");

  const v5HighRes = buildNaiGeneratePayload({
    model: MODEL_V5_FULL,
    rawPrompt: samplePrompt,
    steps: 28,
    scale: 7.0,
    ucPresetMode: "heavy",
  });
  const p5High = v5HighRes.payload.parameters as Record<string, unknown>;
  assert.equal(v5HighRes.payload.model, "nai-diffusion-5-full");
  assert.equal(p5High.params_version, 4);
  assert.equal(p5High.steps, 28);
  assert.equal(p5High.ucPresetId, "heavy");
  assert(!String(v5HighRes.payload.input).includes("-2::"), "V5 Full High separates positive and negative channels");

  const { posPrompt: samplePos, negPrompt: sampleNeg } = splitPromptPosAndNeg(samplePrompt);
  const v5MedRes = buildNaiGeneratePayload({
    model: MODEL_V5_FULL_MEDIUM,
    rawPrompt: samplePos,
    customNegPrompt: sampleNeg,
    steps: 28,
    scale: 6.0,
    extraUc: "watermark",
  });
  const p5Med = v5MedRes.payload.parameters as Record<string, unknown>;
  assert.equal(v5MedRes.payload.model, "nai-diffusion-5-full-medium");
  assert.equal(p5Med.steps, 14, "V5 Medium enforces 14 distilled steps");
  assert(
    String(v5MedRes.payload.input).includes("-2::") && String(v5MedRes.payload.input).includes("watermark"),
    "V5 Medium must auto-inject scene and extra negatives inline as -2::...::"
  );

  // Verify fractional positive counterweights (< 1.0) & M6-Tune2 face counterweight (-2.5::nose bridge, nostrils, lips::) stay in Positive
  const counterweightTest =
    "1girl, solo, -0.45::wide hips::, -2.5::nose bridge, nostrils, lips::, -2::lowres, bad anatomy::";
  const splitCw = splitPromptPosAndNeg(counterweightTest);
  assert(
    splitCw.posPrompt.includes("-0.45::wide hips::") &&
      splitCw.posPrompt.includes("-2.5::nose bridge, nostrils, lips::") &&
      !splitCw.posPrompt.includes("lowres"),
    "Fractional counterweights and M6-Tune2 face counterweight must stay in Positive prompt"
  );
  assert(splitCw.negPrompt.includes("lowres"), "Standard -2::...:: negative must extract into Negative prompt");
  const mergedBack = mergePosAndNegToInline(splitCw.posPrompt, splitCw.negPrompt);
  assert(mergedBack.includes("-2::lowres, bad anatomy::"), "mergePosAndNegToInline must restore inline -2:: block");

  // 5. Verify add_cat_ears + tail-wrap on All-Positions pull_out & 5-stage progression
  for (const stageKey of Object.keys(POS_STAGE_PRESETS)) {
    const [stageProbe] = generateScenePrompts("P22", { ...cfg, pos_stage: stageKey }, "3rd");
    assert(countPromptT5Tokens(stageProbe.prompt).api_pos_tokens <= 512);
  }

  const catPullOutCfg = {
    ...createDefaultCharacterConfig(),
    add_cat_ears: true,
    pos_show_penis: true,
    pos_stage: "🔗 4. 事后拔出 · 脱出拉丝/外射（pull out · 刚拔出拉丝与穴口白浊流淌）",
  };
  const [p01Cat] = generateScenePrompts("P01", catPullOutCfg, "3rd");
  assert(p01Cat.prompt.includes("1.45::tail around penis::") && p01Cat.subTitle.includes("🐾猫尾缠绕"));
  const [p45Cat] = generateScenePrompts("P45", catPullOutCfg, "3rd");
  assert(!p45Cat.prompt.includes("tail around penis"), "Manual fingering P45 must not wrap tail around penis");

  // 6. Verify Condom & Uterus X-Ray calibration on P01~P51
  const condomDuringCfg = {
    ...createDefaultCharacterConfig(),
    enable_condom: true,
    enable_uterus_xray: true,
    pos_stage: "💦 2. 射精中 · 内射/迸发瞬间（climax / internal cumshot · 白浊喷涌）",
  };
  const [p22CondomDuring] = generateScenePrompts("P22", condomDuringCfg, "3rd");
  assert(
    p22CondomDuring.prompt.includes("1.5::cum in condom::") &&
      p22CondomDuring.prompt.includes("1.4::uterus::") &&
      p22CondomDuring.subTitle.includes("[🎈子宫套内撑满]")
  );

  const condomPullCfg = {
    ...condomDuringCfg,
    pos_stage: "🔗 4. 事后拔出 · 脱出拉丝/外射（pull out · 刚拔出拉丝与穴口白浊流淌）",
  };
  const [p22CondomPull] = generateScenePrompts("P22", condomPullCfg, "3rd");
  const spCondomPull = splitPromptPosAndNeg(p22CondomPull.prompt);
  assert(
    spCondomPull.posPrompt.includes("1.85::used condom in pussy::") &&
      p22CondomPull.subTitle.includes("[🎈套留外口自溢]") &&
      spCondomPull.negPrompt.includes("condom on penis")
  );

  // Expression Override check
  const exprKeys = Object.keys(EXPRESSION_PRESETS);
  const [exprProbe] = generateScenePrompts(
    "MA1",
    { ...cfg, expr_preset: exprKeys[2] || exprKeys[0], expr_heart_eyes: true },
    "3rd"
  );
  assert(exprProbe.prompt.includes("heart-shaped pupils"));

  // 7. Verify SlimTender_Locked 5-module suite across MA0~MA10 & P01~P51
  const slimTenderCfg = {
    ...createDefaultCharacterConfig(),
    style_preset: "🍑 四画师清透奶桃纤柔赛璐璐风（shouu-kun 0.52 + mikozin 0.36 + gotyou 0.32 + izuoku 0.28）",
    lighting_preset: "🍑✨ 三阶奶桃柔影 · 锁骨烟粉次级暗部 + 白衣冰蓝冷影（Milky-Peach 3-Tier Cel）",
    body_preset: "纤柔嫩骨·精致锁骨双向防折痕少女（Slim-Tender · 无腹褶无肋骨）",
    outfit_preset: "🎽 滑肩宽松白背心 + 深蓝运动短裤（露锁骨居家休闲 · 解扣拨档）",
    env_preset: "🪴 落地窗日光绿植 · 绒毛米色地毯木地板（furry beige rug, floor-to-ceiling window, potted plant）",
    pos_scene: "🪴 落地窗日光绿植 · 绒毛米色地毯木地板（furry beige rug, floor-to-ceiling window, potted plant）",
  };
  for (const ch of [...MULTI_ANGLE_CHAPTERS, ...ALL_POSITIONS_CHAPTERS]) {
    for (const item of generateScenePrompts(ch.id, slimTenderCfg, "3rd")) {
      const { posPrompt, negPrompt } = splitPromptPosAndNeg(item.prompt);
      const sepTok = countSeparatedT5Tokens({
        posPrompt,
        sceneNegPrompt: negPrompt,
        ucPresetMode: "heavy",
        appendQuality: true,
      });
      assert(
        sepTok.posTokens <= 512 && sepTok.negTokens <= 512,
        `SlimTender ${ch.id} exceeded 512 tokens: pos=${sepTok.posTokens}, neg=${sepTok.negTokens}`
      );
    }
  }

  // 8. Verify .naiv4vibebundle, .naiv4vibe, PNG Vibe extraction, DPM++ 2M, Anlas & Embedded M2 3-Slot Vibe Preset
  const mockBundleJson = JSON.stringify({
    identifier: "novelai-vibe-transfer-bundle",
    version: 1,
    vibes: [
      {
        identifier: "novelai-vibe-transfer",
        version: 1,
        type: "encoding",
        image: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        id: "vibe_slot_1",
        encodings: {
          "v4-5full": {
            hash_ie88: {
              encoding: "ENC_V45_SLOT1_BASE64_PAYLOAD_" + "A".repeat(80),
              params: { information_extracted: 0.88 },
            },
          },
        },
        name: "Slot1_KeyParts_Atlas",
        importInfo: {
          model: "nai-diffusion-4-5-full",
          information_extracted: 0.88,
          strength: 0.52,
        },
      },
      {
        identifier: "novelai-vibe-transfer",
        version: 1,
        type: "encoding",
        id: "vibe_slot_2",
        encodings: {
          "v4-5full": {
            hash_ie80: {
              encoding: "ENC_V45_SLOT2_BASE64_PAYLOAD_" + "B".repeat(80),
              params: { information_extracted: 0.8 },
            },
          },
        },
        name: "Slot2_FullBody_Anchor",
        importInfo: {
          model: "nai-diffusion-4-5-full",
          information_extracted: 0.8,
          strength: -0.25,
        },
      },
    ],
  });

  const parsedVibes = parseVibeBundleJsonText(mockBundleJson, "TestBundle.naiv4vibebundle");
  assert.equal(parsedVibes.length, 2);
  const reserialized = serializeVibeBundle(parsedVibes, { includeRawImages: true });
  assert.equal(parseVibeBundleJsonText(reserialized).length, 2);

  const v45Slots = buildActiveVibeSlotsForModel(parsedVibes, MODEL_V4_5_FULL, true);
  assert.equal(v45Slots.length, 2);
  const vibePayloadRes = buildNaiGeneratePayload({
    model: MODEL_V4_5_FULL,
    rawPrompt: "1girl, solo, javelin (azur lane)",
    vibes: v45Slots,
    normalizeVibeStrength: false,
  });
  assert.equal(vibePayloadRes.effectiveSampler, "k_dpmpp_2m");
  assert.equal(
    estimateNaiAnlas({
      model: MODEL_V4_5_FULL,
      width: 832,
      height: 1216,
      steps: 28,
      isOpusFreeEligible: true,
      vibeCount: 4,
    }),
    0
  );
  assert.equal(
    estimateNaiAnlas({
      model: MODEL_V4_5_FULL,
      width: 832,
      height: 1216,
      steps: 28,
      isOpusFreeEligible: true,
      vibeCount: 6,
    }),
    4
  );

  // Embedded M2 3-Slot Vibe Preset & 400-token V4.5 Vibe Budget Guard
  const m2PresetKey = "⭐ 🧬 标枪 M2 · 极细净线青瞳 (mikozin 0.62 + 内置3槽Vibe)";
  const m2RawPreset = BUNDLED_CUSTOM_PRESETS[m2PresetKey];
  assert(m2RawPreset, "Expected M2 bundled preset in BUNDLED_CUSTOM_PRESETS");
  const m2Pack = BUNDLED_VIBE_PACKS.m2_mikozin062_triple;
  const m2ClonedVibes = cloneBundledVibeItems("m2_mikozin062_triple");
  assert.equal(m2ClonedVibes.length, 3);

  const repoRoot = fs.existsSync(path.resolve(process.cwd(), "outputs"))
    ? process.cwd()
    : path.resolve(process.cwd(), "..");
  const m2DiskPath = path.resolve(
    repoRoot,
    "outputs/20261118_Vibe_Mikozin_EyeCalibration/02_M2_Mikozin062_TripleVibe.naiv4vibebundle"
  );
  if (fs.existsSync(m2DiskPath)) {
    const m2DiskItems = parseVibeFileBytes(
      new Uint8Array(fs.readFileSync(m2DiskPath)),
      "02_M2_Mikozin062_TripleVibe.naiv4vibebundle"
    );
    for (let i = 0; i < 3; i++) {
      assert.equal(
        m2ClonedVibes[i].encodings["v4-5full"][0].encoding,
        m2DiskItems[i].encodings["v4-5full"][0].encoding
      );
    }
  }

  const m2VibeSafeCeil = computeSafePosTokenLimit({ isV45: true, activeVibeCount: 3 });
  assert.equal(m2VibeSafeCeil, 400);
  const m2Cfg = {
    ...createDefaultCharacterConfig(),
    ...(m2RawPreset as Record<string, unknown>),
    pos_token_limit: m2VibeSafeCeil,
  };
  for (const mode of ["pov", "3rd"] as const) {
    for (const ch of [...MULTI_ANGLE_CHAPTERS, ...ALL_POSITIONS_CHAPTERS]) {
      for (const item of generateScenePrompts(ch.id, m2Cfg, mode)) {
        const { posPrompt, negPrompt } = splitPromptPosAndNeg(item.prompt);
        const sepTok = countSeparatedT5Tokens({
          posPrompt,
          sceneNegPrompt: negPrompt,
          ucPresetMode: "heavy",
          appendQuality: true,
        });
        assert(
          sepTok.posTokens <= m2VibeSafeCeil && sepTok.negTokens <= 512,
          `M2 3-Vibe Preset ${ch.id}(${mode}) exceeded V4.5 Vibe token budget (${m2VibeSafeCeil}): pos=${sepTok.posTokens}`
        );
      }
    }
  }

  const [m2Ma10] = generateScenePrompts("MA10", m2Cfg, "3rd");
  const splitM2Ma10 = splitPromptPosAndNeg(m2Ma10.prompt);
  const m2Payload = buildNaiGeneratePayload({
    model: MODEL_V4_5_FULL,
    rawPrompt: splitM2Ma10.posPrompt,
    customNegPrompt: splitM2Ma10.negPrompt,
    scale: m2Pack.recommendedScale,
    cfgRescale: m2Pack.recommendedRescale,
    vibes: buildActiveVibeSlotsForModel(m2ClonedVibes, MODEL_V4_5_FULL, true),
    normalizeVibeStrength: m2Pack.normalizeStrength,
  });
  const m2Params = m2Payload.payload.parameters as Record<string, unknown>;
  assert.equal(m2Params.sampler, "k_dpmpp_2m");
  assert.equal(m2Params.scale, 5);
  assert.equal(m2Params.cfg_rescale, 0.28);

  // 9. Verify Persistent Preset Deletion (including bundled presets like "⭐ hood2")
  const memLs = new Map<string, string>();
  (globalThis as unknown as { localStorage: unknown }).localStorage = {
    getItem: (k: string) => memLs.get(k) ?? null,
    setItem: (k: string, v: string) => {
      memLs.set(k, String(v));
    },
    removeItem: (k: string) => {
      memLs.delete(k);
    },
  };
  assert("⭐ hood2" in loadCustomPresets(), "Bundled '⭐ hood2' must exist initially");
  markPresetDeleted("⭐ hood2");
  assert(loadDeletedPresets().has("⭐ hood2"), "Deleted tombstone set must record '⭐ hood2'");
  assert(
    !("⭐ hood2" in loadCustomPresets()),
    "Deleted bundled preset '⭐ hood2' must NOT resurrect on reload"
  );
  unmarkPresetDeleted("⭐ hood2");
  assert("⭐ hood2" in loadCustomPresets(), "Unmarking deleted preset must allow saving/restoring it");
  markPresetDeleted("标枪 Javelin（碧蓝航线）");
  clearDeletedPresets();
  assert.equal(loadDeletedPresets().size, 0, "clearDeletedPresets must clear all tombstones");

  // 10. Verify Non-Local / LAN / Remote MCP Endpoint Resolution
  assert.deepEqual(resolveMcpEndpoints("192.168.31.88"), {
    wsUrl: "ws://192.168.31.88:17890/ws",
    uploadUrl: "http://192.168.31.88:17890/bridge/upload-latest",
    displayHost: "192.168.31.88:17890",
  });
  assert.deepEqual(resolveMcpEndpoints("wss://studio-tunnel.example.com/ws"), {
    wsUrl: "wss://studio-tunnel.example.com/ws",
    uploadUrl: "https://studio-tunnel.example.com/bridge/upload-latest",
    displayHost: "studio-tunnel.example.com",
  });

  // 11. Verify Calibrated Reverse Bunnysuit Outfits (Variant A Heart Pasties & Variant B Bare Nipples)
  for (const [revKey, expectPasties] of [
    ["🐰 逆兔女郎装 · 经典黑爱心胸贴 + 腿环过膝袜（Reverse Bunnysuit · 胸贴版）", true],
    ["🐰 逆兔女郎装 · 无胸贴直露乳首 + 腿环过膝袜（Reverse Bunnysuit · 全露版）", false],
  ] as const) {
    const revCfg = {
      ...createDefaultCharacterConfig(),
      outfit_preset: revKey,
      pos_token_limit: computeSafePosTokenLimit({ isV45: true, activeVibeCount: 3 }),
    };
    for (const sid of ["MA1", "P01", "P36", "P50", "FREE"]) {
      const [item] = generateScenePrompts(sid, revCfg, "3rd");
      assert(item, `Missing prompt for ${sid} with ${revKey}`);
      const split = splitPromptPosAndNeg(item.prompt);
      assert(
        split.posPrompt.includes("1.5::reverse bunnysuit::") &&
          split.posPrompt.includes("1.4::black cropped jacket::") &&
          split.posPrompt.includes("1.35::zettai ryouiki::"),
        `Reverse bunnysuit structural tags missing in ${sid}`
      );
      assert(
        !split.posPrompt.includes("clothes lift") && !split.posPrompt.includes("panties aside"),
        `Reverse bunnysuit must keep intact open_groin state without clothes lift / panties aside in ${sid}`
      );
      assert(
        split.negPrompt.includes("playboy bunny") &&
          split.negPrompt.includes("crotchless pantyhose") &&
          !split.negPrompt.split(",").map((s) => s.trim()).includes("nsfw"),
        `Reverse bunnysuit must block playboy bunny & crotchless pantyhose without injecting 'nsfw' into UC in ${sid}`
      );
      if (expectPasties) {
        assert(split.posPrompt.includes("1.4::heart pasties::"));
        if (sid === "P50") {
          assert(
            !split.negPrompt.split(",").map((s) => s.trim()).includes("nipples"),
            "P50 breast_grope should unblock 'nipples' in UC when organTags target nipples"
          );
        } else {
          assert(split.negPrompt.split(",").map((s) => s.trim()).includes("nipples"));
        }
      } else {
        assert(split.posPrompt.includes("1.3::nipples::"));
        assert(split.negPrompt.split(",").map((s) => s.trim()).includes("pasties"));
      }
      const sepTok = countSeparatedT5Tokens({
        posPrompt: split.posPrompt,
        sceneNegPrompt: split.negPrompt,
        ucPresetMode: "heavy",
        appendQuality: true,
      });
      assert(
        sepTok.posTokens <= 400,
        `Reverse bunnysuit ${sid} exceeded 3-Vibe 400 T5 limit: ${sepTok.posTokens}`
      );
    }
  }

  // 12. Verify Tentacle Series TN01~TN04 Built-In Environment Lock & Mixed Sequential Batch Isolation
  assert.equal(ALL_POSITIONS_CHAPTERS.length, 83, "Expected 83 positions (P01..P51 + TN01..TN12 + BG01..BG20)");
  const mixedBatchCfg = {
    ...createDefaultCharacterConfig(),
    body_preset: "袖珍娇小窄肩细腰笔直长腿·微Q萌圆脸（0.25 chibi + short slender mini-lady）",
    outfit_preset: "🐰 逆兔女郎装 · 经典黑爱心胸贴 + 腿环过膝袜（Reverse Bunnysuit · 胸贴版）",
    lighting_preset: "💎✨ 2.5D 冷暖撞色水润高反差光影（Coral-Peach Skin + Cool Violet Rim & Specular）",
    pos_scene: "🪟 晨光纱帘白床明亮卧室（bright window, curtains, sunlit bedroom, white bedsheet）",
    env_preset: "🌸 落樱浅滩水波·粉霞晴空焦散（shallow water, cherry blossoms, caustics, pink sky）",
    enable_background: true,
    pos_token_limit: computeSafePosTokenLimit({ isV45: true, activeVibeCount: 3 }),
  };

  const mixedQueue = ["P01", "TN01", "TN02", "TN03", "TN04", "P18"];
  for (const sid of mixedQueue) {
    const [it] = generateScenePrompts(sid, mixedBatchCfg, "3rd");
    assert(it, `Missing batch item for ${sid}`);
    const sp = splitPromptPosAndNeg(it.prompt);
    assert(!sp.posPrompt.includes("::::"), `${sid} must never produce malformed :::: quadruple colons`);
    if (sid.startsWith("TN")) {
      assert(
        sp.posPrompt.includes("dark cavern") && sp.posPrompt.includes("glowing bioluminescent mist"),
        `${sid} must use built-in dark cavern bioluminescent environment`
      );
      assert(
        !sp.posPrompt.includes("white bedsheet") &&
          !sp.posPrompt.includes("shallow water") &&
          !sp.posPrompt.includes("cherry blossoms"),
        `${sid} must block external pos_scene & env_preset during mixed batch`
      );
      assert(
        sp.posPrompt.includes("1girl, solo") && !sp.posPrompt.includes("1boy"),
        `${sid} must enforce 1girl, solo isolation`
      );
      assert(
        !sp.posPrompt.includes("three-quarter view") && !sp.posPrompt.includes("full body"),
        `${sid} must not inject three-quarter view / full body zoom-out conflict`
      );
      assert(
        !sp.posPrompt.includes("0.65::"),
        `${sid} must strip fractional 0.65:: anatomy down-weight`
      );
      if (sid === "TN01") {
        assert(
          sp.posPrompt.includes("frustrated") &&
            sp.posPrompt.includes("humiliated") &&
            sp.posPrompt.includes("clenched teeth"),
          "TN01 must default to humiliated/frustrated/clenched teeth expression"
        );
      }
      if (sid === "TN02") {
        assert(
          sp.posPrompt.includes("torogao") &&
            sp.posPrompt.includes("bedroom eyes") &&
            sp.posPrompt.includes("heart-shaped pupils") &&
            sp.posPrompt.includes("teardrops"),
          "TN02 must default to melting torogao + heart pupils + teardrops expression"
        );
      }
      if (sid === "TN03") {
        assert(it.canvas.includes("1216x832"), "TN03 must default to 1216x832 landscape");
        assert(
          sp.posPrompt.includes("rolling eyes") &&
            sp.posPrompt.includes("heart-shaped pupils") &&
            sp.posPrompt.includes("drooling") &&
            !sp.posPrompt.includes("tongue out"),
          "TN03 must use climax rolling eyes + heart pupils + drooling WITHOUT tongue out"
        );
      } else {
        assert(
          !sp.posPrompt.includes("rabbit tail"),
          `${sid} frontal supine/suspended posture must strip rabbit tail`
        );
      }
      if (sid === "TN04") {
        assert(
          sp.posPrompt.includes("torogao") &&
            sp.posPrompt.includes("heart-shaped pupils") &&
            sp.posPrompt.includes("tongue out") &&
            sp.posPrompt.includes("saliva"),
          "TN04 must default to torogao + heart pupils + tongue out + saliva expression"
        );
        assert(sp.posPrompt.includes("tentacle pit"), "TN04 must include tentacle pit");
        assert(sp.posPrompt.includes("cowboy shot"), "TN04 must frame as cowboy shot");
        const negSet = new Set(sp.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
        assert(
          !sp.posPrompt.includes("slim waist") &&
            !sp.posPrompt.includes("-0.40::plump::") &&
            !negSet.has("plump") &&
            !negSet.has("curvy"),
          "TN04 must unlock belly expansion in both Positive and Negative"
        );
        for (const reqNeg of [
          "1boy",
          "male",
          "human hands",
          "extra fingers",
          "umbilical cord",
          "censor",
          "mosaic censoring",
          "bar censor",
          "covering crotch",
          "covering breasts",
        ]) {
          assert(negSet.has(reqNeg), `TN04 missing required negative guard: ${reqNeg}`);
        }
        for (const bannedDryNeg of [
          "body oil",
          "oily skin",
          "flying sweatdrops",
          "dripping",
          "splash",
        ]) {
          assert(!negSet.has(bannedDryNeg), `TN04 must strip slime-drying negative tag: ${bannedDryNeg}`);
        }
        assert(
          !(negSet.has("oil painting") && negSet.has("oil painting (medium)")),
          "TN04 negative must deduplicate oil painting vs oil painting (medium)"
        );
      }
      const sepTok = countSeparatedT5Tokens({
        posPrompt: sp.posPrompt,
        sceneNegPrompt: sp.negPrompt,
        ucPresetMode: "heavy",
        appendQuality: true,
      });
      assert(sepTok.posTokens <= 400, `${sid} exceeded 3-Vibe 400 T5 limit: ${sepTok.posTokens}`);
    } else {
      assert(
        sp.posPrompt.includes("white bedsheet"),
        `Non-tentacle pose ${sid} in mixed batch must preserve user's chosen pos_scene without contamination`
      );
    }
  }

  // Even if user previously toggled external enable_background OFF, TN series still uses its prompt's built-in environment (unless transparent_bg is ON)
  const bgOffTn = generateScenePrompts("TN01", { ...mixedBatchCfg, enable_background: false }, "3rd")[0];
  assert(bgOffTn.prompt.includes("dark cavern"), "TN01 must retain prompt built-in environment even when external enable_background is false");
  const transBgTn = generateScenePrompts("TN01", { ...mixedBatchCfg, pos_transparent_bg: true }, "3rd")[0];
  assert(
    transBgTn.prompt.includes("transparent background") && !transBgTn.prompt.includes("dark cavern"),
    "Transparent background toggle should still cleanly override TN01 background when explicitly enabled"
  );

  // 13. Verify MA7 Derived Variants (MA7A, MA7B, MA7C — Top Buttons Only, Single MA7 in Bottom List)
  assert.equal(MULTI_ANGLE_CHAPTERS.length, 12, "Bottom Multi-Angle list must remain MA0~MA11 (12 items)");
  const ma7TestCfg = {
    ...createDefaultCharacterConfig(),
    body_preset: "袖珍娇小窄肩细腰笔直长腿·微Q萌圆脸（0.25 chibi + short slender mini-lady）",
    outfit_preset: "🐰 逆兔女郎装 · 经典黑爱心胸贴 + 腿环过膝袜（Reverse Bunnysuit · 胸贴版）",
    lighting_preset: "💎✨ 2.5D 冷暖撞色水润高反差光影（Coral-Peach Skin + Cool Violet Rim & Specular）",
  };
  for (const ma7Vid of ["MA7A", "MA7B", "MA7C"] as const) {
    const [maItem] = generateScenePrompts(ma7Vid, ma7TestCfg, "3rd");
    assert(maItem, `Missing prompt for ${ma7Vid}`);
    const spMa = splitPromptPosAndNeg(maItem.prompt);
    assert(
      !/[^\x00-\x7F]/.test(spMa.posPrompt) && !/[^\x00-\x7F]/.test(spMa.negPrompt),
      `${ma7Vid} must be 100% pure ASCII English tags without leaked Chinese header text`
    );
    const maNegSet = new Set(spMa.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
    assert(
      spMa.posPrompt.includes("peace sign near cheek") &&
        spMa.posPrompt.includes("1.35::mesugaki::") &&
        !spMa.posPrompt.includes("rabbit tail") &&
        !spMa.posPrompt.includes("0.65::"),
      `${ma7Vid} must include peace sign + default mesugaki expression and strip frontal rabbit tail / 0.65::`
    );
    assert(
      !maNegSet.has("dripping") && !maNegSet.has("splash") && maNegSet.has("censor"),
      `${ma7Vid} negative must strip dripping/splash and retain anti-censor guards`
    );
    if (ma7Vid === "MA7A" || ma7Vid === "MA7B") {
      assert(
        spMa.posPrompt.includes("1.55::pregnant::") &&
          !spMa.posPrompt.includes("slim waist") &&
          !maNegSet.has("plump") &&
          !maNegSet.has("curvy"),
        `${ma7Vid} must unlock round belly silhouette in both Positive and Negative`
      );
    } else {
      assert(
        spMa.posPrompt.includes("slim waist") &&
          maNegSet.has("pregnant") &&
          maNegSet.has("stomach bulge"),
        "MA7C flat-belly x-ray variant must preserve slim waist and block pregnant / stomach bulge"
      );
    }
    if (ma7Vid === "MA7A") {
      assert(maNegSet.has("x-ray") && maNegSet.has("uterus"), "MA7A default must block x-ray cutaway");
    } else {
      assert(
        spMa.posPrompt.includes("1.45::x-ray::") && !maNegSet.has("x-ray"),
        `${ma7Vid} must include built-in x-ray cutaway without blocking x-ray in UC`
      );
    }
    const maTok502 = countSeparatedT5Tokens({
      posPrompt: spMa.posPrompt,
      sceneNegPrompt: spMa.negPrompt,
      ucPresetMode: "heavy",
      appendQuality: true,
    });
    assert(maTok502.posTokens <= 502, `${ma7Vid} exceeded 502 T5 limit: ${maTok502.posTokens}`);

    const [maItem400] = generateScenePrompts(
      ma7Vid,
      { ...ma7TestCfg, pos_token_limit: 400 },
      "3rd"
    );
    const spMa400 = splitPromptPosAndNeg(maItem400.prompt);
    const maTok400 = countSeparatedT5Tokens({
      posPrompt: spMa400.posPrompt,
      sceneNegPrompt: spMa400.negPrompt,
      ucPresetMode: "heavy",
      appendQuality: true,
    });
    assert(maTok400.posTokens <= 400, `${ma7Vid} exceeded 3-Vibe 400 T5 limit: ${maTok400.posTokens}`);
  }

  // 14. Verify Section 2E First-Person POV Optical & Gaze Consistency Audit across P01~P51
  const expectedRearNoFace = new Set([
    "P12",
    "P13",
    "P17",
    "P18",
    "P19",
    "P20",
    "P21",
    "P22",
    "P23",
    "P29",
    "P38",
    "P44",
    "P49",
  ]);
  const expectedTopDown = new Set(["P15", "P28", "P40", "P46", "P50", "P51"]);
  for (let i = 1; i <= 51; i++) {
    const pid = `P${String(i).padStart(2, "0")}`;
    const tpl = ALL_POSITIONS_TEMPLATES[pid];
    assert(tpl, `Missing template ${pid}`);
    const expectedVis =
      pid === "P33"
        ? "ventral_no_eyes"
        : expectedRearNoFace.has(pid)
          ? "rear_no_face"
          : expectedTopDown.has(pid)
            ? "top_down_over_shoulder"
            : "front_face_visible";
    assert.equal(tpl.pov_visibility, expectedVis, `${pid} pov_visibility mismatch`);
  }

  const povAuditCfg = {
    ...createDefaultCharacterConfig(),
    bust_preset: "默认随角色原设",
    style_preset: "🧬✨ M2 单画师极细净线赛璐璐风（mikozin 0.62 + 净黑细线 · 内置3槽Vibe调校）",
    lighting_preset: "💎👁️ 极细净黑线 · 丝绒渐变瞳双眼皮睫毛 + 三阶奶桃锁骨柔影（M2 Razor-Fine Cel）",
    body_preset: "袖珍娇小窄肩细腰笔直长腿·微Q萌圆脸（0.25 chibi + short slender mini-lady）",
    outfit_preset: "🐰 逆兔女郎装 · 经典黑爱心胸贴 + 腿环过膝袜（Reverse Bunnysuit · 胸贴版）",
    expr_preset: "💢 雌小鬼嘲讽·嚣张挑衅（mesugaki, smug, evil smile, jitome, naughty face, blush）",
    extra_char_tags: "silver hair, aqua eyes",
    pos_show_penis: true,
    pos_stage: "🔗 4. 事后拔出 · 脱出拉丝/外射（pull out · 刚拔出拉丝与穴口白浊流淌）",
  };

  // Group 1 & 3: rear_no_face POV must suppress ALL face/eye expressions AND front-chest/navel tags, while 3rd-person retains them
  for (const pid of expectedRearNoFace) {
    const [povItem] = generateScenePrompts(pid, povAuditCfg, "pov");
    const spPov = splitPromptPosAndNeg(povItem.prompt);
    const povNegSet = new Set(spPov.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
    for (const bannedPos of [
      "looking back",
      "looking at viewer",
      "mesugaki",
      "smug",
      "jitome",
      "gradient eyes",
      "thick eyelashes",
      "eyelid crease",
      "aqua eyes",
      "short face",
      "round face",
      "tareme",
      "blush stickers",
      "nose blush",
      "open jacket",
      "bare breasts",
      "heart pasties",
      "black pasties",
      "nipples",
      "midriff",
      "navel",
      "red bowtie",
      "cum on stomach",
      "with a cute large head",
    ]) {
      assert(
        !spPov.posPrompt.toLowerCase().includes(bannedPos),
        `Rear POV ${pid} leaked front/face token '${bannedPos}': ${spPov.posPrompt}`
      );
    }
    for (const reqNeg of ["looking back", "looking at viewer", "face", "eyes", "bare breasts", "nipples"]) {
      assert(povNegSet.has(reqNeg), `Rear POV ${pid} missing anti-turnback UC lock '${reqNeg}'`);
    }
    if (ALL_POSITIONS_TEMPLATES[pid].channel !== "solo") {
      assert(!povNegSet.has("from behind"), `Rear POV ${pid} must not block 'from behind' in UC`);
      assert(povNegSet.has("male back") && povNegSet.has("male head"), `Rear POV ${pid} must block male back/head`);
    }
  }

  // Verify 3rd-person mode on P17 is completely unaffected (retains looking back, expression override, aqua eyes, and Reverse Bunnysuit chest)
  const [p17Third] = generateScenePrompts("P17", povAuditCfg, "3rd");
  const spP17Third = splitPromptPosAndNeg(p17Third.prompt);
  assert(
    spP17Third.posPrompt.includes("looking back") &&
      spP17Third.posPrompt.includes("1.35::mesugaki::") &&
      spP17Third.posPrompt.includes("aqua eyes") &&
      spP17Third.posPrompt.includes("1.4::heart pasties::"),
    "3rd-person P17 must retain looking back, global expression override, eye color, and front outfit tags"
  );

  // Verify 2.5D lighting on Rear POV also suppresses blush stickers / nose blush & facial prose
  const [p18CelPov] = generateScenePrompts(
    "P18",
    {
      ...povAuditCfg,
      lighting_preset: "💎✨ 2.5D 冷暖撞色水润高反差光影（Coral-Peach Skin + Cool Violet Rim & Specular）",
    },
    "pov"
  );
  assert(
    !p18CelPov.prompt.includes("blush stickers") &&
      !p18CelPov.prompt.includes("nose blush") &&
      !p18CelPov.prompt.includes("rosy cheeks"),
    "Rear POV P18 under 2.5D lighting must suppress blush stickers and rosy cheeks prose"
  );

  // Group 2: top_down_over_shoulder POV looks down over crown of head -> keeps front chest/thighs, suppresses face/eyes
  for (const pid of expectedTopDown) {
    const [tdItem] = generateScenePrompts(pid, povAuditCfg, "pov");
    const spTd = splitPromptPosAndNeg(tdItem.prompt);
    const tdNegSet = new Set(spTd.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
    assert(
      spTd.posPrompt.includes("top-down") &&
        spTd.posPrompt.includes("top of head") &&
        spTd.posPrompt.includes("1.4::heart pasties::"),
      `Top-down POV ${pid} must include top-down/top of head and retain visible front chest tags`
    );
    for (const bannedTd of [
      "mesugaki",
      "jitome",
      "gradient eyes",
      "aqua eyes",
      "looking up at viewer",
      "frontal low angle",
      "looking down at viewer",
      "rabbit tail",
    ]) {
      assert(!spTd.posPrompt.toLowerCase().includes(bannedTd), `Top-down POV ${pid} leaked '${bannedTd}'`);
    }
    assert(
      tdNegSet.has("front view") &&
        tdNegSet.has("straight-on") &&
        tdNegSet.has("face") &&
        tdNegSet.has("eyes") &&
        tdNegSet.has("third-person") &&
        tdNegSet.has("male back"),
      `Top-down POV ${pid} missing UC locks`
    );
  }

  // Group 4: front_face_visible POV retains face/expressions/eyes, blocks 3rd-person male back/head occlusion,
  // and suppresses bare 'pov hands' on supine P01~P07 (using foreshortening + lower-body grip to prevent V5 upside-down inversion)
  for (const pid of ["P01", "P03", "P11", "P26", "P27", "P42"]) {
    const [ffItem] = generateScenePrompts(pid, povAuditCfg, "pov");
    const spFf = splitPromptPosAndNeg(ffItem.prompt);
    const ffNegSet = new Set(spFf.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
    const expectsPovHands = !/^P0[1-7]$/.test(pid);
    assert(
      spFf.posPrompt.includes("pov crotch") &&
        (expectsPovHands ? spFf.posPrompt.includes("pov hands") : !spFf.posPrompt.includes("pov hands") && spFf.posPrompt.includes("foreshortening")) &&
        spFf.posPrompt.includes("1.35::mesugaki::") &&
        spFf.posPrompt.includes("aqua eyes"),
      `Frontal POV ${pid} must include calibrated pov crotch/foreshortening and retain face expressions & eye color`
    );
    for (const reqCropNeg of ["from behind", "male back", "male head", "male shoulders", "over-the-shoulder"]) {
      assert(ffNegSet.has(reqCropNeg), `Frontal POV ${pid} missing male-back crop guard '${reqCropNeg}'`);
    }
  }

  // 15. Verify Post-Audit Live-Render Confirmed Edge-Case Fixes (P20, P25, P28/P40/P51, P33, P41, P44 + 3D Radar POV Lock)
  // (1) P20: upright arm-pull without grabbing another's hip + blocks hands on floor / all fours
  const [p20Pov] = generateScenePrompts("P20", povAuditCfg, "pov");
  const spP20 = splitPromptPosAndNeg(p20Pov.prompt);
  const p20NegSet = new Set(spP20.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
  assert(
    spP20.posPrompt.includes("1.45::arms pulled back::") &&
      spP20.posPrompt.includes("1.4::wrists held::") &&
      !spP20.posPrompt.includes("grabbing another's hip") &&
      !spP20.posPrompt.includes("1.35::from above::") &&
      p20NegSet.has("hands on floor") &&
      p20NegSet.has("all fours"),
    "P20 POV must enforce upright wrist-pull without hip-grab or floor-bracing"
  );

  // (2) P25: open scissor leg-lift without crossed legs + strips rabbit tail in POV
  const [p25Pov] = generateScenePrompts("P25", povAuditCfg, "pov");
  const spP25 = splitPromptPosAndNeg(p25Pov.prompt);
  assert(
    spP25.posPrompt.includes("1.4::leg lift::") &&
      spP25.posPrompt.includes("1.35::spread legs::") &&
      spP25.posPrompt.includes("grabbing thigh") &&
      !spP25.posPrompt.includes("crossed legs") &&
      !spP25.posPrompt.includes("rabbit tail"),
    "P25 POV must open thighs with leg lift + grabbing thigh and strip crossed legs / rabbit tail"
  );

  // (3) P28 / P40 / P51: suspended mid-air elevation in top_down_over_shoulder POV
  for (const suspId of ["P28", "P40", "P51"] as const) {
    const [sItem] = generateScenePrompts(suspId, povAuditCfg, "pov");
    const spSusp = splitPromptPosAndNeg(sItem.prompt);
    assert(
      spSusp.posPrompt.includes("1.35::suspended::") &&
        spSusp.posPrompt.includes("high above floor") &&
        spSusp.posPrompt.includes("top-down") &&
        !spSusp.posPrompt.includes("front view") &&
        !spSusp.posPrompt.includes("mesugaki"),
      `${suspId} POV must include mid-air suspension and top-down framing without face leakage`
    );
  }

  // (4) P33 Calibrated Mutual 69 (POV Portrait 832x1216 ventral_no_eyes + 3RD Landscape 1216x832 side-profile)
  const [p33CalibPov] = generateScenePrompts(
    "P33",
    {
      ...povAuditCfg,
      pos_stage: "💦 2. 射精中 · 内射/迸发瞬间（climax / internal cumshot · 白浊喷涌）",
    },
    "pov"
  );
  const spP33Pov = splitPromptPosAndNeg(p33CalibPov.prompt);
  const p33PovNegSet = new Set(spP33Pov.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
  assert(
    p33CalibPov.canvas.includes("832x1216") &&
      spP33Pov.posPrompt.includes("1.5::pov::") &&
      spP33Pov.posPrompt.includes("grabbing ass") &&
      spP33Pov.posPrompt.includes("bare stomach") &&
      spP33Pov.posPrompt.includes("underboob") &&
      spP33Pov.posPrompt.includes("bare breasts") &&
      spP33Pov.posPrompt.includes("head down") &&
      spP33Pov.posPrompt.includes("chin") &&
      spP33Pov.posPrompt.includes("1.45::pussy::") &&
      spP33Pov.posPrompt.includes("1.4::pussy from behind::") &&
      spP33Pov.posPrompt.includes("1.45::oral::") &&
      spP33Pov.posPrompt.includes("1.45::fellatio::") &&
      spP33Pov.posPrompt.includes("open mouth") &&
      spP33Pov.posPrompt.includes("lips around penis") &&
      !spP33Pov.posPrompt.includes("mesugaki") &&
      !spP33Pov.posPrompt.includes("gradient eyes") &&
      !spP33Pov.posPrompt.includes("aqua eyes") &&
      !spP33Pov.posPrompt.includes("rabbit tail") &&
      p33PovNegSet.has("eyes") &&
      p33PovNegSet.has("eyebrows") &&
      p33PovNegSet.has("eyelashes") &&
      p33PovNegSet.has("pupils") &&
      p33PovNegSet.has("vaginal") &&
      p33PovNegSet.has("insertion") &&
      p33PovNegSet.has("covered crotch") &&
      !p33PovNegSet.has("face"),
    "P33 POV must use 832x1216 portrait, preserve ventral torso + inverted chin/open mouth, suppress eyes (without blocking 'face'), and block vaginal insertion"
  );

  const [p33SkirtPov] = generateScenePrompts(
    "P33",
    {
      ...povAuditCfg,
      outfit_preset: "学院百褶短裙套装（白衬衫+百褶裙 · 撩裙不脱裙）",
      enable_uterus_xray: true,
    },
    "pov"
  );
  const spP33Skirt = splitPromptPosAndNeg(p33SkirtPov.prompt);
  assert(
    spP33Skirt.posPrompt.includes("skirt lift") &&
      spP33Skirt.posPrompt.includes("panties aside") &&
      spP33Skirt.posPrompt.includes("1.35::x-ray::"),
    "P33 POV with skirt + uterus x-ray must retain skirt lift, panties aside, and x-ray cutaway"
  );

  const [p33Calib3rd] = generateScenePrompts(
    "P33",
    {
      ...povAuditCfg,
      pos_stage: "💦 2. 射精中 · 内射/迸发瞬间（climax / internal cumshot · 白浊喷涌）",
    },
    "3rd"
  );
  const spP333rd = splitPromptPosAndNeg(p33Calib3rd.prompt);
  const p333rdNegSet = new Set(spP333rd.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
  assert(
    p33Calib3rd.canvas.includes("1216x832") &&
      spP333rd.posPrompt.includes("1.45::from side::") &&
      spP333rd.posPrompt.includes("1.55::sixty-nine::") &&
      spP333rd.posPrompt.includes("opposing orientation") &&
      spP333rd.posPrompt.includes("head to crotch") &&
      spP333rd.posPrompt.includes("1.45::cunnilingus::") &&
      spP333rd.posPrompt.includes("licking pussy") &&
      spP333rd.posPrompt.includes("1.45::oral::") &&
      spP333rd.posPrompt.includes("penis in mouth") &&
      p333rdNegSet.has("pov") &&
      p333rdNegSet.has("worm's-eye view") &&
      p333rdNegSet.has("vaginal") &&
      p333rdNegSet.has("insertion") &&
      p333rdNegSet.has("fused bodies"),
    "P33 3RD must use 1216x832 landscape full-body side profile with dual-end cunnilingus + fellatio and anti-POV/anti-insertion UC"
  );

  // (5) P41: inverted piledriver with upside-down + hips at top + head at bottom + anti-upright UC
  const [p41Pov] = generateScenePrompts("P41", povAuditCfg, "pov");
  const spP41 = splitPromptPosAndNeg(p41Pov.prompt);
  const p41NegSet = new Set(spP41.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
  assert(
    spP41.posPrompt.includes("1.55::piledriver::") &&
      spP41.posPrompt.includes("1.5::upside-down::") &&
      spP41.posPrompt.includes("head at bottom") &&
      spP41.posPrompt.includes("hips at top") &&
      p41NegSet.has("head at top") &&
      p41NegSet.has("upright"),
    "P41 POV must enforce inverted piledriver geometry and block upright collapse"
  );

  // (6) P44: close rear framing + cum on ass routing + clarified title
  const [p44Pov] = generateScenePrompts("P44", povAuditCfg, "pov");
  const spP44 = splitPromptPosAndNeg(p44Pov.prompt);
  assert(
    p44Pov.subTitle.includes("客观回眸/POV纯背特写") &&
      spP44.posPrompt.includes("close-up") &&
      spP44.posPrompt.includes("1.35::ass focus::") &&
      spP44.posPrompt.includes("pussy from behind") &&
      spP44.posPrompt.includes("cum on ass") &&
      !spP44.posPrompt.includes("cum on stomach"),
    "P44 POV must include close rear focus and route post-climax fluid to cum on ass"
  );

  // 16. Verify Gender Mode Transform (Femboy / Futa No-Balls / Futa With-Balls — Conflict-Free Assertions)
  // (a) Femboy on Reverse Bunnysuit Solo (P43) + Two-Person Supine POV (P02) + Uterus X-Ray auto-disable
  const femboySoloCfg = {
    ...povAuditCfg,
    gender_mode: "femboy" as const,
    enable_uterus_xray: true,
  };
  const [fbSolo] = generateScenePrompts("P43", femboySoloCfg, "3rd");
  const spFbSolo = splitPromptPosAndNeg(fbSolo.prompt);
  const fbSoloNeg = new Set(spFbSolo.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
  assert(
    spFbSolo.posPrompt.includes("1.45::1boy::") &&
      spFbSolo.posPrompt.includes("1.55::otoko no ko::") &&
      spFbSolo.posPrompt.includes("1.55::flat chest::") &&
      spFbSolo.posPrompt.includes("1.55::small penis::") &&
      spFbSolo.posPrompt.includes("1.35::small testicles::") &&
      !spFbSolo.posPrompt.includes("1girl") &&
      !spFbSolo.posPrompt.includes("bare breasts") &&
      !spFbSolo.posPrompt.includes("heart pasties") &&
      !spFbSolo.posPrompt.includes("pussy") &&
      !spFbSolo.posPrompt.includes("uterus") &&
      fbSoloNeg.has("1girl") &&
      fbSoloNeg.has("breasts") &&
      fbSoloNeg.has("futanari") &&
      fbSoloNeg.has("bara") &&
      fbSoloNeg.has("huge penis") &&
      !fbSoloNeg.has("1boy") &&
      !fbSoloNeg.has("penis"),
    "Femboy Solo P43 must cleanly convert to flat-chested petite boy without breasts/pussy/uterus or UC self-contradictions"
  );

  // Femboy 2-Person Pull-Out stage (povAuditCfg uses stage 4 pull_out!) must use after anal + pull out and block anal penetration/insertion
  const [fbDuoPullOut] = generateScenePrompts("P02", femboySoloCfg, "pov");
  const spFbDuoPull = splitPromptPosAndNeg(fbDuoPullOut.prompt);
  const fbDuoPullNeg = new Set(spFbDuoPull.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
  assert(
    spFbDuoPull.posPrompt.includes("2boys") &&
      spFbDuoPull.posPrompt.includes("1.55::yaoi::") &&
      spFbDuoPull.posPrompt.includes("1.45::after anal::") &&
      spFbDuoPull.posPrompt.includes("1.45::pull out::") &&
      !spFbDuoPull.posPrompt.includes("anal penetration") &&
      !spFbDuoPull.posPrompt.includes("hetero") &&
      !spFbDuoPull.posPrompt.includes("vaginal") &&
      !spFbDuoPull.posPrompt.includes("pussy") &&
      !spFbDuoPull.posPrompt.includes("x-ray") &&
      fbDuoPullNeg.has("anal penetration") &&
      fbDuoPullNeg.has("insertion") &&
      fbDuoPullNeg.has("hetero") &&
      fbDuoPullNeg.has("vaginal") &&
      fbDuoPullNeg.has("pussy") &&
      !fbDuoPullNeg.has("2boys") &&
      !fbDuoPullNeg.has("anal"),
    "Femboy 2-Person P02 Pull-Out POV must emit after anal + pull out and block anal penetration/insertion"
  );

  // Femboy 2-Person Penetration stage (stage 2 during) must use anal + anal penetration + male penetrated
  const [fbDuo] = generateScenePrompts(
    "P02",
    {
      ...femboySoloCfg,
      pos_stage: "💦 2. 射精中 · 内射/迸发瞬间（climax / internal cumshot · 白浊喷涌）",
    },
    "pov"
  );
  const spFbDuo = splitPromptPosAndNeg(fbDuo.prompt);
  const fbDuoNeg = new Set(spFbDuo.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
  assert(
    spFbDuo.posPrompt.includes("2boys") &&
      spFbDuo.posPrompt.includes("1.55::yaoi::") &&
      spFbDuo.posPrompt.includes("1.5::anal::") &&
      spFbDuo.posPrompt.includes("1.45::anal penetration::") &&
      spFbDuo.posPrompt.includes("1.45::male penetrated::") &&
      !spFbDuo.posPrompt.includes("hetero") &&
      !spFbDuo.posPrompt.includes("vaginal") &&
      !spFbDuo.posPrompt.includes("pussy") &&
      !fbDuoNeg.has("anal penetration"),
    "Femboy 2-Person P02 Penetration POV must switch to 2boys yaoi anal without hetero/vaginal/uterus conflict"
  );

  // (b) Futanari No-Balls on Solo (P43) & Male-on-Futa Receiving POV (P02 with Uterus X-Ray)
  const futaNoBallsCfg = {
    ...povAuditCfg,
    gender_mode: "futa_no_balls" as const,
    enable_uterus_xray: true,
  };
  const [fnSolo] = generateScenePrompts("P43", futaNoBallsCfg, "3rd");
  const spFnSolo = splitPromptPosAndNeg(fnSolo.prompt);
  const fnSoloNeg = new Set(spFnSolo.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
  assert(
    spFnSolo.posPrompt.includes("1girl") &&
      spFnSolo.posPrompt.includes("1.55::futanari::") &&
      spFnSolo.posPrompt.includes("1.45::futa without balls::") &&
      spFnSolo.posPrompt.includes("1.55::small penis::") &&
      spFnSolo.posPrompt.includes("1.35::precum::") &&
      !spFnSolo.posPrompt.includes("1.35::pussy::") &&
      !spFnSolo.posPrompt.includes("labia") &&
      !spFnSolo.posPrompt.includes("spread pussy") &&
      !spFnSolo.posPrompt.includes("gaping") &&
      spFnSolo.posPrompt.includes("bare breasts") &&
      spFnSolo.posPrompt.includes("1.35::x-ray::") &&
      fnSoloNeg.has("testicles") &&
      fnSoloNeg.has("balls") &&
      fnSoloNeg.has("otoko no ko") &&
      fnSoloNeg.has("flat chest") &&
      fnSoloNeg.has("huge penis") &&
      !fnSoloNeg.has("penis"),
    "Futa No-Balls Solo P43 must preserve 1girl/breasts/x-ray, apply Anti-Pasted-On vulva strip + precum, unblock penis, and block testicles/femboy/oversize"
  );

  // (c) Futanari With-Balls on Male-on-Futa Receiving POV (P02)
  const futaWithBallsCfg = {
    ...povAuditCfg,
    pos_stage: "💦 2. 射精中 · 内射/迸发瞬间（climax / internal cumshot · 白浊喷涌）",
    gender_mode: "futa_with_balls" as const,
    enable_uterus_xray: true,
  };
  const [fwDuo] = generateScenePrompts("P02", futaWithBallsCfg, "pov");
  const spFwDuo = splitPromptPosAndNeg(fwDuo.prompt);
  const fwDuoNeg = new Set(spFwDuo.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
  assert(
    spFwDuo.posPrompt.includes("1girl") &&
      spFwDuo.posPrompt.includes("1boy") &&
      spFwDuo.posPrompt.includes("1.55::futanari::") &&
      spFwDuo.posPrompt.includes("1.45::futa with balls::") &&
      spFwDuo.posPrompt.includes("1.25::small testicles::") &&
      spFwDuo.posPrompt.includes("1.35::precum::") &&
      !spFwDuo.posPrompt.includes("1.35::pussy::") &&
      !spFwDuo.posPrompt.includes("labia") &&
      !spFwDuo.posPrompt.includes("spread pussy") &&
      !spFwDuo.posPrompt.includes("gaping") &&
      spFwDuo.posPrompt.includes("vaginal") &&
      !spFwDuo.posPrompt.includes("1.55::small penis::") &&
      !spFwDuo.posPrompt.includes("1.35::tiny penis::") &&
      !fwDuoNeg.has("testicles") &&
      !fwDuoNeg.has("balls") &&
      !fwDuoNeg.has("large penis") &&
      !fwDuoNeg.has("thick penis") &&
      fwDuoNeg.has("2boys") &&
      fwDuoNeg.has("hyper penis") &&
      fwDuoNeg.has("huge testicles"),
    `Futa With-Balls Male-on-Futa P02 POV check failed:\nPOS: ${spFwDuo.posPrompt}\nNEG: ${spFwDuo.negPrompt}`
  );
  const tokFw = countSeparatedT5Tokens({
    posPrompt: spFwDuo.posPrompt,
    sceneNegPrompt: spFwDuo.negPrompt,
    ucPresetMode: "heavy",
    appendQuality: true,
  });
  assert(tokFw.posTokens <= 502, `Futa With-Balls P02 exceeded 502 T5 limit: ${tokFw.posTokens}`);

  // (d) MA7A / MA7B / MA7C / MA7D Archetype E (Orthogonal Belly: Round/Flat × X-Ray: ON/OFF across Femboy & Futa)
  for (const ma7Id of ["MA7A", "MA7B", "MA7C", "MA7D"] as const) {
    // Femboy MA7A/B/C/D
    const [fbMa7] = generateScenePrompts(ma7Id, femboySoloCfg, "3rd");
    const spFbMa7 = splitPromptPosAndNeg(fbMa7.prompt);
    const fbMa7Neg = new Set(spFbMa7.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
    assert(
      spFbMa7.posPrompt.includes("1.45::1boy::") &&
        spFbMa7.posPrompt.includes("1.55::flat chest::") &&
        spFbMa7.posPrompt.includes("1.45::precum::") &&
        spFbMa7.posPrompt.includes("1.4::precum string::") &&
        spFbMa7.posPrompt.includes("dripping") &&
        !spFbMa7.posPrompt.includes("spread pussy") &&
        !spFbMa7.posPrompt.includes("spreading own pussy") &&
        !spFbMa7.posPrompt.includes(", fingers,") &&
        !spFbMa7.posPrompt.includes("uterus") &&
        fbMa7Neg.has("uterus") &&
        fbMa7Neg.has("extra hands") &&
        fbMa7Neg.has("extra fingers") &&
        !fbMa7Neg.has("dripping"),
      `Femboy ${ma7Id} must strip third-hand spread/fingers, emit precum string, and block uterus/extra hands`
    );
    if (ma7Id === "MA7A" || ma7Id === "MA7B") {
      assert(spFbMa7.posPrompt.includes("1.55::pregnant::"), `Femboy ${ma7Id} must keep round belly`);
    } else {
      assert(
        spFbMa7.posPrompt.includes("hand on hip") && !spFbMa7.posPrompt.includes("1.55::pregnant::"),
        `Femboy ${ma7Id} must use hand on hip with flat belly`
      );
    }
    if (ma7Id === "MA7B" || ma7Id === "MA7C") {
      assert(
        spFbMa7.posPrompt.includes("1.45::intestines::") &&
          spFbMa7.posPrompt.includes("1.5::cum in ass::") &&
          !fbMa7Neg.has("x-ray"),
        `Femboy ${ma7Id} must use male colon cutaway (intestines + cum in ass)`
      );
    } else {
      assert(
        !spFbMa7.posPrompt.includes("1.45::x-ray::") && fbMa7Neg.has("x-ray"),
        `Femboy ${ma7Id} (no-xray) must block x-ray cutaway`
      );
    }

    // Futanari No-Balls MA7A/B/C/D
    const [fnMa7] = generateScenePrompts(ma7Id, futaNoBallsCfg, "3rd");
    const spFnMa7 = splitPromptPosAndNeg(fnMa7.prompt);
    const fnMa7Neg = new Set(spFnMa7.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
    assert(
      spFnMa7.posPrompt.includes("1.55::futanari::") &&
        spFnMa7.posPrompt.includes("1.45::futa without balls::") &&
        spFnMa7.posPrompt.includes("1.45::precum::") &&
        spFnMa7.posPrompt.includes("1.4::precum string::") &&
        spFnMa7.posPrompt.includes("1.35::pussy::") &&
        spFnMa7.posPrompt.includes("1.45::cum in pussy::") &&
        !spFnMa7.posPrompt.includes("spread pussy") &&
        !spFnMa7.posPrompt.includes("spreading own pussy") &&
        !spFnMa7.posPrompt.includes(", fingers,") &&
        fnMa7Neg.has("extra hands") &&
        fnMa7Neg.has("extra fingers") &&
        fnMa7Neg.has("testicles") &&
        !fnMa7Neg.has("penis") &&
        !fnMa7Neg.has("dripping"),
      `Futa ${ma7Id} must strip third-hand spread/fingers and emit dual-fluid precum + vaginal cum overflow`
    );
    if (ma7Id === "MA7C" || ma7Id === "MA7D") {
      assert(spFnMa7.posPrompt.includes("hand on hip"), `Futa ${ma7Id} must add hand on hip`);
    }
    if (ma7Id === "MA7D") {
      assert(
        !spFnMa7.posPrompt.includes("1.45::x-ray::") && fnMa7Neg.has("x-ray") && fnMa7Neg.has("pregnant"),
        "Futa MA7D (flat belly, no-xray) must block both pregnant and x-ray"
      );
    }
  }

  // (e) Dedicated Futa Style Preset (安定萌化mikozin + 0.28::artist:pija (pianiishimo):: tail blend)
  const futaStyleKey =
    "⚡🌷 安定萌化futa专用（mikozin 0.66 + kani 0.55 + hori 0.48 + gotyou 0.42 + pija 0.28）";
  const futaStyleTuple = STYLE_PRESETS[futaStyleKey];
  assert(
    Array.isArray(futaStyleTuple) &&
      futaStyleTuple[0].includes(
        "0.66::artist:mikozin::, 0.55::artist:kani bonara::, 0.48::artist:hori (hori no su)::, 0.42::artist:gotyou::, 0.28::artist:pija (pianiishimo)::"
      ) &&
      futaStyleTuple[0].includes("gradient eyes, no text"),
    "STYLE_PRESETS must include 安定萌化futa专用 with 0.28::artist:pija (pianiishimo):: at the tail of the 5-artist chain"
  );

  // (f) Unified Character Prompt Distribution ([Base Prompt] + [Character 1] [+ [Character 2] on 3rd-person 2-person scenes])
  const [p33FutaPov] = generateScenePrompts("P33", futaNoBallsCfg, "pov");
  const [p33Futa3rd] = generateScenePrompts("P33", futaNoBallsCfg, "3rd");
  assert(
    p33FutaPov.prompt.startsWith("[Base Prompt]\n") &&
      p33FutaPov.prompt.includes("[Character 1]\ngirl,") &&
      !p33FutaPov.prompt.includes("[Character 2]"),
    "POV 2-person scene must distribute into [Base Prompt] + [Character 1] without forcing [Character 2] into frame"
  );
  assert(
    p33Futa3rd.prompt.startsWith("[Base Prompt]\n") &&
      p33Futa3rd.prompt.includes("[Character 1]\ngirl,") &&
      p33Futa3rd.prompt.includes("[Character 2]\nboy, faceless male"),
    "3rd-person 2-person scene must distribute into [Base Prompt] + [Character 1] + [Character 2]"
  );

  // (g) V5 Medium single-512 inline-negative budget guard must NOT push [Character 1] past 512,
  // while V5 High keeps full separated positive/negative channels untouched.
  const spP33Futa3rd = splitPromptPosAndNeg(p33Futa3rd.prompt);
  const medPayload = buildNaiGeneratePayload({
    model: MODEL_V5_FULL_MEDIUM,
    rawPrompt: spP33Futa3rd.posPrompt,
    customNegPrompt: spP33Futa3rd.negPrompt,
    ucPresetMode: "heavy",
  }).payload.parameters as {
    v4_prompt: { caption: { base_caption: string; char_captions: Array<{ char_caption: string }> } };
  };
  const medCombinedPrompt =
    `[Base Prompt]\n${medPayload.v4_prompt.caption.base_caption}\n` +
    medPayload.v4_prompt.caption.char_captions
      .map((c, idx) => `[Character ${idx + 1}]\n${c.char_caption}`)
      .join("\n");
  const medTok = countPromptT5Tokens(medCombinedPrompt);
  assert(
    medTok.web_single_box_tokens <= 512 &&
      medPayload.v4_prompt.caption.char_captions.length === 2 &&
      medPayload.v4_prompt.caption.char_captions[0].char_caption.includes("futanari"),
    `V5 Medium must budget-cap inline negatives so combined tokens (${medTok.web_single_box_tokens}) stay <= 512 and [Character 1] is never truncated`
  );
  const highPayload = buildNaiGeneratePayload({
    model: MODEL_V5_FULL,
    rawPrompt: spP33Futa3rd.posPrompt,
    customNegPrompt: spP33Futa3rd.negPrompt,
    ucPresetMode: "none",
  }).payload.parameters as {
    v4_prompt: { caption: { base_caption: string; char_captions: Array<{ char_caption: string }> } };
    v4_negative_prompt: { caption: { base_caption: string } };
  };
  assert(
    !highPayload.v4_prompt.caption.base_caption.includes("-2::") &&
      highPayload.v4_negative_prompt.caption.base_caption.includes("testicles") &&
      highPayload.v4_prompt.caption.char_captions.length === 2,
    "V5 High must remain completely unaffected with separated positive/negative channels"
  );

  // (h) MA7E Dedicated Futa Two-Handed Spread Variant (v4 Final: With-Balls & Ball-Free)
  const [ma7eWithBalls] = generateScenePrompts("MA7E", futaWithBallsCfg, "3rd");
  const spMa7eWb = splitPromptPosAndNeg(ma7eWithBalls.prompt);
  const ma7eWbNeg = new Set(spMa7eWb.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
  assert(
    spMa7eWb.posPrompt.includes("1.45::futa with balls::") &&
      spMa7eWb.posPrompt.indexOf("1.55::futanari::") < spMa7eWb.posPrompt.indexOf("rating:explicit") &&
      spMa7eWb.posPrompt.includes("1.25::asymmetrical pose::") &&
      spMa7eWb.posPrompt.includes("wide spread legs") &&
      spMa7eWb.posPrompt.includes("1.35::small penis::") &&
      spMa7eWb.posPrompt.includes("1.3::erection::") &&
      spMa7eWb.posPrompt.includes("1.35::holding own testicles::") &&
      spMa7eWb.posPrompt.includes("1.35::spread pussy::") &&
      !spMa7eWb.posPrompt.includes("holding own penis") &&
      spMa7eWb.posPrompt.includes("untouched and centered pointing upward") &&
      spMa7eWb.posPrompt.includes("to the viewer's left") &&
      spMa7eWb.posPrompt.includes("right half") &&
      ma7eWbNeg.has("peace sign") &&
      ma7eWbNeg.has("holding own penis") &&
      ma7eWbNeg.has("grabbing penis") &&
      ma7eWbNeg.has("hand on hip") &&
      ma7eWbNeg.has("hand on thigh") &&
      ma7eWbNeg.has("arm at side") &&
      ma7eWbNeg.has("arms at sides") &&
      !ma7eWbNeg.has("testicles") &&
      !ma7eWbNeg.has("dripping"),
    "MA7E v4 With-Balls must keep shaft untouched/upright, lock holding own penis + anti-drift hand UC, and preserve left/right prose"
  );
  const [ma7eNoBalls] = generateScenePrompts("MA7E", futaNoBallsCfg, "3rd");
  const spMa7eNb = splitPromptPosAndNeg(ma7eNoBalls.prompt);
  const ma7eNbNeg = new Set(spMa7eNb.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
  assert(
    spMa7eNb.posPrompt.includes("1.45::futa without balls::") &&
      !spMa7eNb.posPrompt.includes("holding own testicles") &&
      !spMa7eNb.posPrompt.includes("small testicles") &&
      spMa7eNb.posPrompt.includes("1.35::small penis::") &&
      spMa7eNb.posPrompt.includes("1.35::spread pussy::") &&
      spMa7eNb.posPrompt.includes("pull open the left side") &&
      ma7eNbNeg.has("testicles") &&
      ma7eNbNeg.has("holding own penis") &&
      ma7eNbNeg.has("peace sign"),
    "MA7E v4 Ball-Free must swap to futa without balls, strip testicle tags, update prose, and lock testicles/holding own penis in UC"
  );

  // (i) Tentacle Series TN05-TN12 (Female / Femboy / Futa 3-Way Routing)
  for (const tnId of ["TN05", "TN06", "TN07", "TN08", "TN09", "TN10", "TN11", "TN12"] as const) {
    assert(tnId in ALL_POSITIONS_TEMPLATES, `Missing tentacle template ${tnId}`);
  }
  const [tn05Fb] = generateScenePrompts("TN05", femboySoloCfg, "3rd");
  const spTn05Fb = splitPromptPosAndNeg(tn05Fb.prompt);
  const tn05FbNeg = new Set(spTn05Fb.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
  assert(
    spTn05Fb.posPrompt.includes("tentacles on chest") &&
      spTn05Fb.posPrompt.includes("1.45::coiled tentacle around penis::") &&
      spTn05Fb.posPrompt.includes("1.45::male ejaculation::") &&
      tn05FbNeg.has("2boys") &&
      tn05FbNeg.has("uterus") &&
      !tn05FbNeg.has("penis"),
    "Femboy TN05 must swap tentacles on breasts -> chest, inject coiled milking sleeve, keep 2boys locked, and unblock penis"
  );
  const [tn10Futa] = generateScenePrompts("TN10", futaNoBallsCfg, "3rd");
  const spTn10Futa = splitPromptPosAndNeg(tn10Futa.prompt);
  assert(
    tn10Futa.canvas === "横图 1216x832" &&
      spTn10Futa.posPrompt.includes("1.55::futanari::") &&
      spTn10Futa.posPrompt.includes("1.45::coiled tentacle around penis::") &&
      spTn10Futa.posPrompt.includes("1.45::x-ray::"),
    "Futa TN10 must be landscape 1216x832 with simultaneous coiled milking sleeve and uterus x-ray"
  );
  const [tn12Fb] = generateScenePrompts("TN12", { ...femboySoloCfg, enable_uterus_xray: false }, "3rd");
  const spTn12Fb = splitPromptPosAndNeg(tn12Fb.prompt);
  const tn12FbNeg = new Set(spTn12Fb.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
  assert(
    spTn12Fb.posPrompt.includes("1.55::translucent belly::") &&
      spTn12Fb.posPrompt.includes("1.5::pregnant::") &&
      tn12FbNeg.has("uterus") &&
      tn12FbNeg.has("x-ray"),
    "Femboy TN12 must keep translucent glowing egg-belly while locking uterus and x-ray cutaway in UC"
  );

  // (j) Fantasy Hive & Doujin Arthropod Series BG01-BG20 (Three-Tier Hygiene UC + 3-Way Gender Routing)
  for (let i = 1; i <= 20; i++) {
    const bgId = `BG${String(i).padStart(2, "0")}`;
    assert(bgId in ALL_POSITIONS_TEMPLATES, `Missing insect/hive template ${bgId}`);
  }
  const [bg07] = generateScenePrompts("BG07", povAuditCfg, "3rd");
  const spBg07 = splitPromptPosAndNeg(bg07.prompt);
  const bg07Neg = new Set(spBg07.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
  assert(
    spBg07.posPrompt.includes("1.6::worms::") &&
      spBg07.posPrompt.includes("1.5::larvae::") &&
      !bg07Neg.has("maggots") &&
      bg07Neg.has("round eggs"),
    "BG07 (Tier B Larvae) must unblock maggots and block round eggs"
  );
  const [bg14] = generateScenePrompts("BG14", futaNoBallsCfg, "3rd");
  const spBg14 = splitPromptPosAndNeg(bg14.prompt);
  const bg14Neg = new Set(spBg14.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
  assert(
    bg14.canvas === "横图 1216x832" &&
      spBg14.posPrompt.includes("1.6::giant spider::") &&
      spBg14.posPrompt.includes("1.55::futanari::") &&
      !bg14Neg.has("extra legs") &&
      bg14Neg.has("extra human legs"),
    "BG14 (Tier C Giant Spider) must be landscape 1216x832 and use extra human legs instead of bare extra legs"
  );
  const [bg20Fb] = generateScenePrompts("BG20", femboySoloCfg, "3rd");
  const spBg20Fb = splitPromptPosAndNeg(bg20Fb.prompt);
  const bg20FbNeg = new Set(spBg20Fb.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
  assert(
    bg20Fb.canvas === "横图 1216x832" &&
      spBg20Fb.posPrompt.includes("1.6::maggots::") &&
      spBg20Fb.posPrompt.includes("1.45::intestines::") &&
      !bg20FbNeg.has("maggots") &&
      !bg20FbNeg.has("extra legs") &&
      bg20FbNeg.has("uterus") &&
      bg20FbNeg.has("2boys"),
    "Femboy BG20 (Tier C X-Ray Maggot Overflow) must route to intestines, unblock maggots, avoid bare extra legs, and lock uterus/2boys"
  );

  // (k) BG13-BG17 All-Gender Routing & Dual-Camera View B (Groin-to-Head POV) Audit
  for (const bgId of ["BG13", "BG14", "BG15", "BG16", "BG17"] as const) {
    const [povItem] = generateScenePrompts(bgId, { ...femboySoloCfg, enable_uterus_xray: false }, "pov");
    const spPov = splitPromptPosAndNeg(povItem.prompt);
    const negPov = new Set(spPov.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
    assert(
      povItem.canvas === "竖图 832x1216" &&
        !spPov.posPrompt.startsWith("[Base Prompt]") &&
        spPov.posPrompt.includes("1.45::pov::") &&
        spPov.posPrompt.includes("1.5::foreshortening::") &&
        spPov.posPrompt.includes("head at top") &&
        !spPov.posPrompt.includes("1.45::vaginal::") &&
        negPov.has("upside-down") &&
        negPov.has("inverted") &&
        negPov.has("head at bottom") &&
        negPov.has("legs at top") &&
        !negPov.has("extra legs"),
      `Femboy ${bgId} View B POV must be vertical 832x1216 flat prompt, front-load head at top, strip vaginal, lock anti-inversion UC, and avoid bare extra legs`
    );
    if (bgId === "BG13" || bgId === "BG14" || bgId === "BG16") {
      assert(
        spPov.posPrompt.includes("1.5::anal::") && spPov.posPrompt.includes("1.45::male penetrated::"),
        `Femboy ${bgId} must cleanly reroute vaginal -> anal + male penetrated even after multi-word insect descriptors`
      );
    }
    if (bgId === "BG15") {
      assert(
        spPov.posPrompt.includes("1.6::2 creatures::") && spPov.posPrompt.includes("1.55::groin parasite::"),
        "BG15 View B (Type B-4) must inject 1.6::2 creatures:: and 1.55::groin parasite::"
      );
    }
  }

  // (l) 5-Mode Internal X-Ray Matrix (X-1..X-5) on TN01-TN12 & BG01-BG20
  const xrayFutaCfg = { ...futaNoBallsCfg, enable_uterus_xray: true };
  const xrayFemboyCfg = { ...femboySoloCfg, enable_uterus_xray: true };
  // Mode X-2: BG15 stomach x-ray (drops secondary groin bug, no uterus)
  const [bg15Xray] = generateScenePrompts("BG15", xrayFutaCfg, "3rd");
  const spBg15X = splitPromptPosAndNeg(bg15Xray.prompt);
  assert(
    spBg15X.posPrompt.includes("1.5::stomach x-ray::") &&
      !spBg15X.posPrompt.includes("1.55::groin parasite::") &&
      !spBg15X.posPrompt.includes("1.5::uterus::"),
    "Mode X-2 BG15 must use stomach x-ray and drop secondary groin parasite"
  );
  // Mode X-3: BG17 Femboy intestines + eggs + locks uterus/cervix/womb
  const [bg17XrayFb] = generateScenePrompts("BG17", xrayFemboyCfg, "3rd");
  const spBg17XFb = splitPromptPosAndNeg(bg17XrayFb.prompt);
  const bg17XFbNeg = new Set(spBg17XFb.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
  assert(
    spBg17XFb.posPrompt.includes("1.55::x-ray::") &&
      spBg17XFb.posPrompt.includes("1.5::intestines::") &&
      bg17XFbNeg.has("uterus") &&
      bg17XFbNeg.has("womb") &&
      bg17XFbNeg.has("medical diagram"),
    "Mode X-3 Femboy BG17 must emit intestines x-ray and lock uterus/womb/medical diagram"
  );
  // Mode X-4: BG14 View A (side-profile abdominal x-ray cutaway) vs View B (cross-section inset)
  const [bg14Xray3rd] = generateScenePrompts("BG14", xrayFutaCfg, "3rd");
  const [bg14XrayPov] = generateScenePrompts("BG14", xrayFutaCfg, "pov");
  assert(
    bg14Xray3rd.prompt.includes("side-profile abdominal x-ray cutaway") &&
      bg14XrayPov.prompt.includes("cross-section inset"),
    "Mode X-4 BG14 must use side-profile cutaway on View A and cross-section inset on View B"
  );
  // Mode X-5: BG06 explicit X-Ray overrides translucent belly into sharp cutaway
  const [bg06Xray] = generateScenePrompts("BG06", xrayFutaCfg, "3rd");
  const spBg06X = splitPromptPosAndNeg(bg06Xray.prompt);
  assert(
    spBg06X.posPrompt.includes("1.55::x-ray::") &&
      spBg06X.posPrompt.includes("1.55::eggs in uterus::") &&
      !spBg06X.posPrompt.includes("translucent belly"),
    "Mode X-5 BG06 with explicit X-Ray must replace translucent belly with sharp eggs-in-uterus cutaway"
  );

  // (m) MA11 Ultra Close-Up Wide-Angle V-Legs Showcase (Female / Femboy / Futa)
  const [ma11Fem] = generateScenePrompts("MA11", povAuditCfg, "3rd");
  const spMa11Fem = splitPromptPosAndNeg(ma11Fem.prompt);
  const ma11FemNeg = new Set(spMa11Fem.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
  assert(
    ma11Fem.canvas === "竖图 832x1216" &&
      spMa11Fem.posPrompt.includes("1.65::extreme foreshortening::") &&
      spMa11Fem.posPrompt.includes("1.5::v-shaped legs::") &&
      spMa11Fem.posPrompt.includes("1.65::pussy focus::") &&
      ma11FemNeg.has("upside-down") &&
      ma11FemNeg.has("head at bottom"),
    "MA11 Female must emit ultra close-up wide-angle V-legs with anti-inversion UC"
  );
  const [ma11Fb] = generateScenePrompts("MA11", { ...femboySoloCfg, enable_uterus_xray: false }, "3rd");
  const spMa11Fb = splitPromptPosAndNeg(ma11Fb.prompt);
  assert(
    spMa11Fb.posPrompt.includes("1.45::1boy::") &&
      spMa11Fb.posPrompt.includes("1.55::flat chest::") &&
      !spMa11Fb.posPrompt.includes("pussy focus") &&
      !spMa11Fb.posPrompt.includes("pussy"),
    "MA11 Femboy must strip pussy focus / pussy and preserve flat chest"
  );
  const [ma11Futa] = generateScenePrompts("MA11", { ...futaNoBallsCfg, enable_uterus_xray: false }, "3rd");
  const spMa11Futa = splitPromptPosAndNeg(ma11Futa.prompt);
  assert(
    spMa11Futa.posPrompt.includes("1.55::futanari::") &&
      spMa11Futa.posPrompt.includes("pussy") &&
      !spMa11Futa.posPrompt.includes("pussy focus"),
    "MA11 Futa must keep vertical triad (futanari + pussy) while stripping pussy focus"
  );

  // (n) All-Stage Tight-Opening Calibration (No positive gaping, 0.95 spread + creampie on pull_out, gaping anus UC, no dripping block)
  const pullOutRearCfg = {
    ...povAuditCfg,
    pos_stage: "🔗 4. 事后拔出 · 脱出拉丝/外射（pull out · 刚拔出拉丝与穴口白浊流淌）",
  };
  const [p17Pull] = generateScenePrompts("P17", pullOutRearCfg, "3rd");
  const spP17Pull = splitPromptPosAndNeg(p17Pull.prompt);
  const p17PullNeg = new Set(spP17Pull.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
  assert(
    !spP17Pull.posPrompt.includes("gaping") &&
      spP17Pull.posPrompt.includes("0.95::spread pussy::") &&
      spP17Pull.posPrompt.includes("1.45::creampie::") &&
      spP17Pull.posPrompt.includes("1.4::pussy from behind::") &&
      !spP17Pull.posPrompt.includes("cum on stomach") &&
      !p17PullNeg.has("dripping") &&
      !p17PullNeg.has("gaping"),
    "Rear P17 pull_out must use tight 0.95::spread pussy:: + 1.45::creampie:: + pussy from behind, zero positive gaping, and unblock dripping"
  );

  // (o) Scene-Decoupled Water Ripples + Scene×Light-Axis Camera Rotation + V5 High Hybrid Routing Audit
  const fiveArtistStyle = "🌸 五画师无描边柔涂厚彩风（shirabi + gomashio + dino + waterring + riichu）";
  const contreJourLight = "🌅✨ 强逆光过曝眩光 · 深邃暗面 HDR 光比（Contre-Jour HDR Backlight）";
  const frontLuminousLight = "☀️💧 正面清亮直打光 · 亮白瓷桃水光肌 + 纯白高光（Front-Lit Luminous Skin）";
  const windowSideLight = "☀️ 窗边过曝白昼侧逆光 · 暖金轮廓柔光（Window Sidelight & Golden Rim）";
  const cherryWaterScene = "🌸 落樱浅滩水波·粉霞晴空焦散（shallow water, cherry blossoms, caustics, pink sky）";
  const rugWindowScene = "🪴 落地窗日光绿植 · 绒毛米色地毯木地板（furry beige rug, floor-to-ceiling window, potted plant）";

  // 1) Water-ripple & caustic reflections must be enforced by the water scene across ALL lighting presets
  for (const lKey of [
    "🔄 随画风与本幕默认光影（不额外覆盖）",
    contreJourLight,
    frontLuminousLight,
    windowSideLight,
    "💎✨ 2.5D 冷暖撞色水润高反差光影（Coral-Peach Skin + Cool Violet Rim & Specular）",
  ]) {
    const [waterItem] = generateScenePrompts(
      "P22",
      {
        ...createDefaultCharacterConfig(),
        style_preset: fiveArtistStyle,
        lighting_preset: lKey,
        pos_scene: cherryWaterScene,
        pos_male_mode: "🚫 关闭男方（纯单人 1girl, solo · 保留姿势）",
        pos_show_penis: false,
      },
      "3rd"
    );
    const spW = splitPromptPosAndNeg(waterItem.prompt);
    assert(
      spW.posPrompt.includes("1.32::water reflection::") &&
        spW.posPrompt.includes("1.32::caustics::") &&
        spW.posPrompt.includes("1.25::wet skin::") &&
        spW.posPrompt.includes("water droplets") &&
        countPromptT5Tokens(waterItem.prompt).api_pos_tokens <= 512,
      `Water scene must enforce water reflection, caustics, wet skin, and droplets under lighting '${lKey}'`
    );
  }

  // 2) Dry indoor scenes must NEVER leak water caustics/reflections from Contre-Jour or Front-Lit lighting
  for (const lKey of [contreJourLight, frontLuminousLight]) {
    const [dryItem] = generateScenePrompts(
      "P22",
      {
        ...createDefaultCharacterConfig(),
        style_preset: fiveArtistStyle,
        lighting_preset: lKey,
        pos_scene: rugWindowScene,
        pos_male_mode: "🚫 关闭男方（纯单人 1girl, solo · 保留姿势）",
        pos_show_penis: false,
      },
      "3rd"
    );
    const spD = splitPromptPosAndNeg(dryItem.prompt);
    assert(
      !spD.posPrompt.includes("caustics") &&
        !spD.posPrompt.includes("water reflection") &&
        !spD.posPrompt.includes("water droplets"),
      `Lighting '${lKey}' on indoor rug scene must not leak water caustics/reflections`
    );
  }

  // 3) Scene × Light-Axis Camera Rotation:
  //    - Backlit on sunlit_rug_floor_window looks OUTWARD toward blazing floor-to-ceiling window
  //    - Front-Lit on sunlit_rug_floor_window (both P22 pos_scene and built-in MA10) rotates camera INWARD into room interior!
  const [rugBacklit] = generateScenePrompts(
    "P22",
    {
      ...createDefaultCharacterConfig(),
      style_preset: fiveArtistStyle,
      lighting_preset: contreJourLight,
      pos_scene: rugWindowScene,
      pos_male_mode: "🚫 关闭男方（纯单人 1girl, solo · 保留姿势）",
      pos_show_penis: false,
    },
    "3rd"
  );
  const spRugBack = splitPromptPosAndNeg(rugBacklit.prompt);
  assert(
    spRugBack.posPrompt.includes("1.3::large floor-to-ceiling window::") &&
      spRugBack.posPrompt.includes("window in background"),
    "Backlit rug scene must face outward toward the floor-to-ceiling window"
  );

  const [rugFrontLit] = generateScenePrompts(
    "P22",
    {
      ...createDefaultCharacterConfig(),
      style_preset: fiveArtistStyle,
      lighting_preset: frontLuminousLight,
      pos_scene: rugWindowScene,
      pos_male_mode: "🚫 关闭男方（纯单人 1girl, solo · 保留姿势）",
      pos_show_penis: false,
    },
    "3rd"
  );
  const spRugFront = splitPromptPosAndNeg(rugFrontLit.prompt);
  assert(
    spRugFront.posPrompt.includes("living room interior") &&
      spRugFront.posPrompt.includes("wooden wall, bookshelf") &&
      !spRugFront.posPrompt.includes("floor-to-ceiling window") &&
      spRugFront.negPrompt.includes("floor-to-ceiling window") &&
      spRugFront.negPrompt.includes("looking outside"),
    "Front-Lit rug scene must rotate camera inward to living room interior and block window behind subject"
  );

  const [ma10FrontLit] = generateScenePrompts(
    "MA10",
    {
      ...createDefaultCharacterConfig(),
      style_preset: fiveArtistStyle,
      lighting_preset: frontLuminousLight,
    },
    "3rd"
  );
  const spMa10Front = splitPromptPosAndNeg(ma10FrontLit.prompt);
  assert(
    spMa10Front.posPrompt.includes("living room interior") &&
      spMa10Front.posPrompt.includes("wooden wall, bookshelf") &&
      !spMa10Front.posPrompt.includes("floor-to-ceiling window") &&
      spMa10Front.negPrompt.includes("floor-to-ceiling window"),
    "Built-in MA10 window rug scene must also auto-rotate inward to room interior under Front-Lit lighting"
  );

  const [p22Contre] = generateScenePrompts(
    "P22",
    {
      ...createDefaultCharacterConfig(),
      style_preset: fiveArtistStyle,
      lighting_preset: contreJourLight,
      pos_scene: cherryWaterScene,
      pos_male_mode: "🚫 关闭男方（纯单人 1girl, solo · 保留姿势）",
      pos_show_penis: false,
    },
    "3rd"
  );
  const spP22Contre = splitPromptPosAndNeg(p22Contre.prompt);
  assert(
    spP22Contre.posPrompt.includes("0.7::soft shading::") &&
      spP22Contre.posPrompt.includes("2.05::backlighting::") &&
      spP22Contre.posPrompt.includes("2.0::shade::, 1.5::dim lighting::, 1.3::dark::") &&
      spP22Contre.posPrompt.includes("arms folded under chin") &&
      spP22Contre.posPrompt.includes("parted labia") &&
      !spP22Contre.posPrompt.includes("bright sky") &&
      !spP22Contre.posPrompt.includes("spread pussy") &&
      spP22Contre.posPrompt.includes("-0.92::front lighting, flat lighting, low contrast, washed out::"),
    "Contre-Jour P22 must apply 0.7::soft shading::, HDR shadow triad, arms folded under chin, parted labia, strip bright sky, and inline counterweight"
  );
  assert(
    !spP22Contre.negPrompt.includes("photorealistic") &&
      spP22Contre.negPrompt.includes("figure") &&
      spP22Contre.negPrompt.includes("spread pussy"),
    "Contre-Jour P22 must unblock photorealistic while keeping figure & spread pussy guarded in UC"
  );

  const v5HybridPayload = buildNaiGeneratePayload({
    model: MODEL_V5_FULL,
    rawPrompt: spP22Contre.posPrompt,
    customNegPrompt: spP22Contre.negPrompt,
  });
  const v5HybridParams = v5HybridPayload.payload.parameters as Record<string, unknown>;
  const v5PosBase = ((v5HybridParams.v4_prompt as Record<string, unknown>).caption as Record<string, unknown>)
    .base_caption as string;
  const v5NegBase = ((v5HybridParams.v4_negative_prompt as Record<string, unknown>).caption as Record<string, unknown>)
    .base_caption as string;
  assert.equal(v5HybridParams.scale, 6.5, "V5 High default scale should be 6.5");
  assert(
    v5PosBase.includes("-0.95::thick outlines, bold lineart, black outlines, cel shading") &&
      !v5NegBase.includes("cel shading") &&
      v5NegBase.includes("red jacket") &&
      v5NegBase.includes("figure"),
    "V5 High hybrid router must move brushwork soft-bans into -0.95::...:: in v4_prompt while keeping hard-bans in v4_negative_prompt"
  );
  assert(countPromptT5Tokens(v5PosBase).api_pos_tokens <= 512, "V5 High hybrid positive caption must stay <= 512 T5 tokens");

  const [p22Front] = generateScenePrompts(
    "P22",
    {
      ...createDefaultCharacterConfig(),
      style_preset: fiveArtistStyle,
      lighting_preset: frontLuminousLight,
      pos_scene: cherryWaterScene,
      pos_male_mode: "🚫 关闭男方（纯单人 1girl, solo · 保留姿势）",
      pos_show_penis: false,
    },
    "3rd"
  );
  const spP22Front = splitPromptPosAndNeg(p22Front.prompt);
  assert(
    spP22Front.posPrompt.includes("1.85::front lighting::") &&
      spP22Front.posPrompt.includes("1.42::shiny skin::, 1.24::glossy highlights::") &&
      spP22Front.posPrompt.includes("1.32::water reflection::, 1.32::caustics::") &&
      spP22Front.posPrompt.includes("-0.95::backlighting, sun glare") &&
      countPromptT5Tokens(p22Front.prompt).api_pos_tokens <= 512,
    "Front-Lit Luminous Skin + Water Scene must combine pure optical lighting with water scene caustics within 512 T5 tokens"
  );

  // 21. Verify V5 Supine POV Upright Lock (P01~P07, P45) & 3rd-Person Couple Geometry + Male-Safe UC
  const pocketBodyKey =
    Object.keys(BODY_PRESETS).find((k) => k.includes("short slender mini-lady")) ||
    "纤细娇小（原版默认 slender, petite）";
  const hdrContreLightKey =
    Object.keys(LIGHTING_PRESETS).find((k) => k.includes("Contre-Jour HDR Backlight")) ||
    "🔄 随画风默认光影（不额外叠加）";
  for (const pid of ["P01", "P02", "P03", "P04", "P05", "P06", "P07"]) {
    const [supPov] = generateScenePrompts(
      pid,
      {
        ...createDefaultCharacterConfig(),
        body_preset: pocketBodyKey,
        lighting_preset: hdrContreLightKey,
        pos_stage: "💦 2. 射精中 · 内射/迸发瞬间（climax / internal cumshot · 白浊喷涌）",
      },
      "pov"
    );
    const spSupPov = splitPromptPosAndNeg(supPov.prompt);
    assert(
      spSupPov.posPrompt.includes("1.45::pov crotch::, foreshortening") &&
        spSupPov.posPrompt.includes("reclining") &&
        !spSupPov.posPrompt.includes("pov hands") &&
        spSupPov.posPrompt.includes("POV from his groin") &&
        spSupPov.posPrompt.includes("bright rim halation") &&
        spSupPov.negPrompt.includes("upside-down") &&
        spSupPov.negPrompt.includes("x-ray") &&
        spSupPov.negPrompt.includes("cross-section") &&
        countPromptT5Tokens(supPov.prompt).api_pos_tokens <= 488,
      `${pid} POV with Pocket Mini-Lady + HDR Contre-Jour must retain upright foreshortening + full HDR prose + anti-xray UC within 488 T5 tokens`
    );

    const [sup3rd] = generateScenePrompts(
      pid,
      {
        ...createDefaultCharacterConfig(),
        body_preset: pocketBodyKey,
        lighting_preset: hdrContreLightKey,
        pos_stage: "💦 2. 射精中 · 内射/迸发瞬间（climax / internal cumshot · 白浊喷涌）",
      },
      "3rd"
    );
    const spSup3rd = splitPromptPosAndNeg(sup3rd.prompt);
    const neg3rdSet = new Set(spSup3rd.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
    assert(
      spSup3rd.posPrompt.includes("1.35::sex::") &&
        spSup3rd.posPrompt.includes("boy on top") &&
        spSup3rd.posPrompt.includes("source#vaginal") &&
        spSup3rd.posPrompt.includes("target#vaginal") &&
        !neg3rdSet.has("broad shoulders") &&
        !neg3rdSet.has("muscular") &&
        countPromptT5Tokens(sup3rd.prompt).api_pos_tokens <= 512,
      `${pid} 3rd-person must inject boy-on-top couple tags, source#/target# anchors, and strip male-erasing global UC`
    );
  }

  // 22. Verify Rich Gallery Star-Only Persistence Filter & Store-ZIP Archive Builder
  const mockGallery = [
    {
      id: "g_unstarred_1",
      scene_id: "P01",
      mode_label: "pov",
      filename: "150001_P01_s111.png",
      bytes: new Uint8Array([137, 80, 78, 71]),
      objectUrl: "blob:mock-1",
      seed: 111,
      width: 832,
      height: 1216,
      elapsed_sec: 3.1,
      estimated_anlas: 0,
      created_at: 1000,
      is_starred: false,
      disk_subpath: ["20261120_Javelin"],
    },
    {
      id: "g_starred_2",
      scene_id: "P02",
      mode_label: "pov",
      filename: "150005_P02_s222_2x.png",
      bytes: new Uint8Array([137, 80, 78, 71, 13, 10]),
      objectUrl: "blob:mock-2",
      seed: 222,
      width: 1664,
      height: 2432,
      elapsed_sec: 6.4,
      estimated_anlas: 1,
      created_at: 2000,
      is_upscaled: true,
      is_starred: true,
      disk_subpath: ["20261120_Javelin", "_favorites"],
      config_snapshot: {
        cfg: createDefaultCharacterConfig(),
        action_mode: "positions" as const,
        model: MODEL_V5_FULL,
        steps: 28,
        scale: 6.5,
        cfg_rescale: 0,
        uc_preset_mode: "heavy" as const,
        extra_uc: "",
        append_v5_quality: true,
      },
    },
  ];
  const persistedOnlyStarred = filterStarredGalleryForPersist(mockGallery);
  assert.equal(persistedOnlyStarred.length, 1, "Only starred gallery records should be persisted to IndexedDB");
  assert.equal(persistedOnlyStarred[0].id, "g_starred_2");
  assert.equal("objectUrl" in persistedOnlyStarred[0], false, "Transient blob objectUrl must not be persisted");
  assert.deepEqual(persistedOnlyStarred[0].disk_subpath, ["20261120_Javelin", "_favorites"]);

  const zipBlob = buildStoreZipBlob([
    { name: `兔女郎组/${mockGallery[1].filename}`, data: mockGallery[1].bytes },
    { name: "prompts.txt", data: "# test" },
  ]);
  assert(zipBlob.size > 80, "Store ZIP archive must contain valid headers and entries");

  // 14. Gallery Subfolder Path Resolution & Progressive Stage Generation Queue Verification
  assert.equal(sanitizeSubfolderName("  兔女郎/逆光:A*B? "), "兔女郎_逆光_A_B");
  assert.equal(sanitizeSubfolderName("_favorites"), "favorites");
  assert.deepEqual(resolveRecordDiskSubpath("20261120_Javelin", undefined, false), [
    "20261120_Javelin",
  ]);
  assert.deepEqual(resolveRecordDiskSubpath("20261120_Javelin", undefined, true), [
    "20261120_Javelin",
    "_favorites",
  ]);
  assert.deepEqual(resolveRecordDiskSubpath("20261120_Javelin", "P01_递进组", false), [
    "20261120_Javelin",
    "P01_递进组",
  ]);
  assert.deepEqual(resolveRecordDiskSubpath("20261120_Javelin", "P01_递进组", true), [
    "20261120_Javelin",
    "P01_递进组",
    "_favorites",
  ]);

  assert.equal(formatStageFileTag("before"), "S1-before");
  assert.equal(formatStageFileTag("prolapse"), "S5-prolapse");

  let mockSeedSeq = 500001;
  const singleChainTasks = buildStageProgressionQueue({
    sceneIds: ["P01"],
    selectedStageCodes: ["pull_out", "before", "after_inside", "during"], // out-of-order input must auto-sort 1->4
    mode: "per_pose_chain",
    lockSharedSeedPerPose: true,
    baseFixedSeed: -1,
    targetGroupFolder: "P01_四幕递进",
    seedGenerator: () => mockSeedSeq++,
  });
  assert.equal(singleChainTasks.length, 4);
  assert.deepEqual(
    singleChainTasks.map((t) => t.stageCode),
    ["before", "during", "after_inside", "pull_out"]
  );
  assert(
    singleChainTasks.every((t) => t.fixedSeedOverride === 500001 && t.targetGroupFolder === "P01_四幕递进"),
    "All stages of a single pose must share the same locked seed and target folder"
  );

  // Verify every stage in the progression generates distinct, valid <512-token prompts
  const progCfg = createDefaultCharacterConfig();
  const stagePosPrompts: string[] = [];
  for (const stTask of singleChainTasks) {
    const items = generateScenePrompts(stTask.sceneId, {
      ...progCfg,
      pos_stage: stTask.stagePresetKey,
    });
    const sp = splitPromptPosAndNeg(items[0].prompt);
    const tok = countSeparatedT5Tokens({
      posPrompt: sp.posPrompt,
      sceneNegPrompt: sp.negPrompt,
      ucPresetMode: "heavy",
      extraUc: "",
      appendQuality: true,
    });
    assert(tok.posTokens <= 512 && tok.negTokens <= 512, `Stage ${stTask.stageCode} exceeded 512 tokens`);
    stagePosPrompts.push(sp.posPrompt);
  }
  assert.notEqual(stagePosPrompts[0], stagePosPrompts[1], "Stage 1 and Stage 2 prompts must differ");
  assert.notEqual(stagePosPrompts[1], stagePosPrompts[3], "Stage 2 and Stage 4 prompts must differ");

  // Multi-pose per_pose_chain: each pose gets its own shared seed across its stages
  const twoPoseChain = buildStageProgressionQueue({
    sceneIds: ["P01", "P02"],
    selectedStageCodes: ["before", "during", "after_inside"],
    mode: "per_pose_chain",
    lockSharedSeedPerPose: true,
    baseFixedSeed: -1,
    seedGenerator: () => mockSeedSeq++,
  });
  assert.equal(twoPoseChain.length, 6);
  assert.equal(twoPoseChain[0].fixedSeedOverride, twoPoseChain[2].fixedSeedOverride);
  assert.equal(twoPoseChain[3].fixedSeedOverride, twoPoseChain[5].fixedSeedOverride);
  assert.notEqual(twoPoseChain[0].fixedSeedOverride, twoPoseChain[3].fixedSeedOverride);

  // Multi-pose across_poses_arc: smooth monotonic stage interpolation from start to end
  const arc4 = buildStageProgressionQueue({
    sceneIds: ["P01", "P08", "P17", "P22"],
    selectedStageCodes: ["before", "during", "after_inside", "pull_out"],
    mode: "across_poses_arc",
    lockSharedSeedPerPose: false,
    baseFixedSeed: -1,
  });
  assert.deepEqual(
    arc4.map((t) => `${t.sceneId}:${t.stageCode}`),
    ["P01:before", "P08:during", "P17:after_inside", "P22:pull_out"]
  );

  const arc6WithProlapse = buildStageProgressionQueue({
    sceneIds: ["P01", "P02", "P08", "P12", "P17", "P22"],
    selectedStageCodes: ["before", "during", "after_inside", "pull_out", "prolapse"],
    mode: "across_poses_arc",
    lockSharedSeedPerPose: false,
    baseFixedSeed: -1,
  });
  assert.equal(arc6WithProlapse[0].stageCode, "before");
  assert.equal(arc6WithProlapse[arc6WithProlapse.length - 1].stageCode, "prolapse");
  for (let i = 1; i < arc6WithProlapse.length; i++) {
    assert(
      arc6WithProlapse[i].stageOrderNum >= arc6WithProlapse[i - 1].stageOrderNum,
      "Across-poses stage progression must be monotonically non-decreasing"
    );
  }

  // Tentacle poses gracefully bypass stage override
  const tnTasks = buildStageProgressionQueue({
    sceneIds: ["TN01"],
    selectedStageCodes: ["before", "during"],
    mode: "per_pose_chain",
    lockSharedSeedPerPose: true,
    baseFixedSeed: 777,
  });
  assert.equal(tnTasks.length, 1);
  assert.equal(tnTasks[0].stageCode, "");

  // 15. Verify MCP Webpage Gallery File Selector & Folder Summary Helpers
  const mkMockRec = (
    id: string,
    sceneId: string,
    seed: number,
    opts?: { group_folder?: string; is_starred?: boolean; is_upscaled?: boolean }
  ): GeneratedImageRecord => ({
    id,
    scene_id: sceneId,
    mode_label: "positions",
    filename: `${sceneId}_s${seed}.png`,
    bytes: new Uint8Array([1, 2, 3]),
    objectUrl: "",
    seed,
    width: 832,
    height: 1216,
    elapsed_sec: 1.5,
    estimated_anlas: 0,
    created_at: 1000,
    group_folder: opts?.group_folder,
    is_starred: opts?.is_starred,
    is_upscaled: opts?.is_upscaled,
  });
  const mcpMockGallery: GeneratedImageRecord[] = [
    mkMockRec("img_0", "BG01", 101, { group_folder: "bugsex_futa", is_starred: true }),
    mkMockRec("img_1", "BG02", 102, { group_folder: "bugsex_futa", is_upscaled: true }),
    mkMockRec("img_2", "BG03", 103),
    mkMockRec("img_3", "P01", 104, { is_starred: true, is_upscaled: true }),
    mkMockRec("img_4", "BG04", 105),
  ];
  const mcpMockFolders: GalleryFolderItem[] = [
    { id: "f1", name: "bugsex_futa", created_at: 1 },
    { id: "f2", name: "bugsex_m", created_at: 2 },
  ];
  const mcpMockChecked = new Set<string>(["img_2", "img_4"]);

  assert.equal(hasEffectiveGallerySelector({}), false, "Empty selector must be rejected");
  assert.deepEqual(
    selectGalleryRecordIndices(mcpMockGallery, 2, mcpMockChecked, {}),
    [],
    "Empty selector must return 0 matches to prevent accidental bulk move/delete"
  );
  assert.deepEqual(
    selectGalleryRecordIndices(mcpMockGallery, 2, mcpMockChecked, { from_folder: "" }),
    [2, 3, 4],
    "from_folder:'' must match only ungrouped images"
  );
  assert.deepEqual(
    selectGalleryRecordIndices(mcpMockGallery, 2, mcpMockChecked, {
      from_folder: "",
      scene_prefix: "BG",
    }),
    [2, 4],
    "from_folder:'' + scene_prefix:'BG' must match only ungrouped BG images"
  );
  assert.deepEqual(
    selectGalleryRecordIndices(mcpMockGallery, 2, mcpMockChecked, {
      from_folder: "bugsex_futa",
      unstarred_only: true,
    }),
    [1],
    "from_folder + unstarred_only intersection must work"
  );
  assert.deepEqual(
    selectGalleryRecordIndices(mcpMockGallery, 2, mcpMockChecked, { index_range: [1, 3] }),
    [1, 2, 3],
    "index_range must be inclusive"
  );
  assert.deepEqual(
    selectGalleryRecordIndices(mcpMockGallery, 2, mcpMockChecked, { from_folder: "*" }),
    [0, 1, 2, 3, 4],
    "from_folder:'*' must explicitly match all gallery images"
  );
  assert.deepEqual(
    selectGalleryRecordIndices(mcpMockGallery, 2, mcpMockChecked, { checked_only: true }),
    [2, 4]
  );
  assert.deepEqual(
    selectGalleryRecordIndices(mcpMockGallery, 2, mcpMockChecked, { selected_only: true }),
    [2]
  );

  const mockSummary = buildGalleryFolderSummaries(mcpMockGallery, mcpMockFolders, "bugsex_futa", "bugsex_m");
  assert.equal(mockSummary.total_count, 5);
  assert.equal(mockSummary.ungrouped_count, 3);
  assert.equal(mockSummary.starred_count, 2);
  assert.equal(mockSummary.upscaled_count, 2);
  assert.deepEqual(
    mockSummary.folders.map((f) => ({
      name: f.name,
      count: f.count,
      starred: f.starred_count,
      upscaled: f.upscaled_count,
      opened: f.is_opened,
      pinned: f.is_pinned,
    })),
    [
      { name: "bugsex_futa", count: 2, starred: 1, upscaled: 1, opened: true, pinned: false },
      { name: "bugsex_m", count: 0, starred: 0, upscaled: 0, opened: false, pinned: true },
    ]
  );

  // 16. Verify Pixiv Genital Censor Switch (white / black / mosaic / off + SFW isolation + token budgets)
  for (const barMode of ["white", "black", "mosaic"] as const) {
    const barCfg = {
      ...createDefaultCharacterConfig(),
      style_preset: "⚡🌷 安定萌化futa专用（mikozin 0.66 + kani 0.55 + hori 0.48 + gotyou 0.42 + pija 0.28）",
      outfit_preset: "🐰 逆兔女郎装 · 无胸贴直露乳首 + 腿环过膝袜（Reverse Bunnysuit · 全露版）",
      enable_multi_angle_nsfw: true,
      pixiv_bar_censor: barMode,
      pos_token_limit: 502,
    };
    for (const sid of ["P01", "MA11", "MA7E", "TN01", "BG01", "SF01"]) {
      const [item] = generateScenePrompts(sid, barCfg, "3rd");
      assert(item, `Missing prompt for ${sid} under pixiv_bar_censor=${barMode}`);
      const sp = splitPromptPosAndNeg(item.prompt);
      assert(
        !/\buncensored\b/i.test(sp.posPrompt),
        `${sid} (${barMode}) must strip 'uncensored' from Positive`
      );
      const basePart = sp.posPrompt.split("\n\n")[0] || sp.posPrompt;
      const negTokensList = sp.negPrompt.split(",").map((s) => s.trim().toLowerCase());
      assert(
        !negTokensList.includes("censor") && !negTokensList.includes("censored"),
        `${sid} (${barMode}) must strip contradictory censor/censored tags from Negative`
      );
      if (barMode === "white") {
        assert(
          basePart.includes("censored") &&
            basePart.includes("bar censor") &&
            basePart.includes("1.45::white bar censor::") &&
            basePart.includes("1.25::thick bar censor::") &&
            sp.negPrompt.includes("black bar censor") &&
            sp.negPrompt.includes("mosaic censoring") &&
            !negTokensList.includes("bar censor"),
          `${sid} (white) must include thicker white bar censor and block black/mosaic`
        );
      } else if (barMode === "black") {
        assert(
          basePart.includes("censored") &&
            basePart.includes("bar censor") &&
            basePart.includes("1.45::black bar censor::") &&
            basePart.includes("1.25::thick bar censor::") &&
            sp.negPrompt.includes("white bar censor") &&
            sp.negPrompt.includes("mosaic censoring") &&
            !negTokensList.includes("bar censor"),
          `${sid} (black) must include thicker black bar censor and block white/mosaic`
        );
      } else {
        assert(
          basePart.includes("censored") &&
            basePart.includes("1.5::mosaic censoring::") &&
            sp.negPrompt.includes("bar censor") &&
            !negTokensList.includes("mosaic censoring") &&
            !negTokensList.includes("pixelated"),
          `${sid} (mosaic) must include localized mosaic censoring and block bar censor`
        );
      }
      assert(
        sp.negPrompt.includes("censored nipples") && sp.negPrompt.includes("uncensored"),
        `${sid} (${barMode}) must keep anti-nipple-censor & uncensored UC guards`
      );
      const tok = countSeparatedT5Tokens({
        posPrompt: sp.posPrompt,
        sceneNegPrompt: sp.negPrompt,
        ucPresetMode: "heavy",
        appendQuality: true,
      });
      assert(
        tok.posTokens <= 512 && tok.negTokens <= 512,
        `${sid} (${barMode}) exceeded 512 T5 token budget: pos=${tok.posTokens}, neg=${tok.negTokens}`
      );
    }

    // SFW MA0 must NOT receive censor bars/mosaic even when pixiv_bar_censor is ON
    const sfwCfg = {
      ...createDefaultCharacterConfig(),
      enable_multi_angle_nsfw: false,
      pixiv_bar_censor: barMode,
    };
    const [ma0Item] = generateScenePrompts("MA0", sfwCfg, "3rd");
    const ma0Sp = splitPromptPosAndNeg(ma0Item.prompt);
    assert(
      !ma0Sp.posPrompt.includes("bar censor") && !ma0Sp.posPrompt.includes("mosaic censoring"),
      `SFW MA0 must not receive censor tags when pixiv_bar_censor=${barMode}`
    );
  }

  // 17. Verify Extra Style Presets, Scene-Decoupled Lighting, & Other Actions SF01~SF30 Full Adherence
  const style6Key =
    "✨🌷 6号均衡闪亮水润doshimash0（mikozin 0.56 + kani 0.46 + hori 0.38 + gotyou 0.34 + doshimash0 0.50）";
  const style6FutaKey =
    "⚡✨ 6号均衡futa专用（mikozin 0.56 + kani 0.46 + hori 0.38 + gotyou 0.34 + doshimash0 0.48 + pija 0.25）";
  assert(style6Key in STYLE_PRESETS && style6FutaKey in STYLE_PRESETS, "Style #6 and Style #6 Futa must exist");
  assert.equal(
    resolveLightingForStyle(style6Key),
    "💎✨ 2.5D 冷暖撞色水润高反差光影（Coral-Peach Skin + Cool Violet Rim & Specular）"
  );
  assert.equal(
    resolveLightingForStyle(style6FutaKey),
    "💎✨ 2.5D 冷暖撞色水润高反差光影（Coral-Peach Skin + Cool Violet Rim & Specular）"
  );
  for (const [sName, [sPos]] of Object.entries(STYLE_PRESETS)) {
    if (sName.startsWith("自定义")) continue;
    assert(sPos.length > 0, `Style preset '${sName}' must have non-empty positive tags`);
    const [sItem] = generateScenePrompts("MA1", { ...createDefaultCharacterConfig(), style_preset: sName }, "3rd");
    assert(countPromptT5Tokens(sItem.prompt).api_pos_tokens <= 512, `Style '${sName}' exceeded 512 T5 tokens`);
  }

  // Verify cool_warm_25d_cel & milky_peach_3tier_cel have zero hardcoded sunlight/light-rays/character-hair bindings
  const cel25dEntry =
    LIGHTING_PRESETS["💎✨ 2.5D 冷暖撞色水润高反差光影（Coral-Peach Skin + Cool Violet Rim & Specular）"];
  const milky3Entry =
    LIGHTING_PRESETS["🍑✨ 三阶奶桃柔影 · 锁骨烟粉次级暗部 + 白衣冰蓝冷影（Milky-Peach 3-Tier Cel）"];
  assert(
    !/\bsunlight\b|\blight rays\b/i.test(cel25dEntry.tags) &&
      !/periwinkle-to-violet|deep navy accents/i.test(cel25dEntry.prose),
    "cool_warm_25d_cel must strip hardcoded sunlight/light rays and Javelin hair/navy prose"
  );
  assert(
    !/\bsunlight\b|\blight rays\b/i.test(milky3Entry.tags) &&
      !/white tank top/i.test(milky3Entry.prose),
    "milky_peach_3tier_cel must strip hardcoded sunlight/light rays and white tank top from base definition"
  );

  // Verify non-daylight scenes (SF05 night hallway, SF18 night park flash, TN01 cavern) strip sunlight/sun glare across ALL lighting presets
  for (const nonDaySid of ["SF05", "SF18", "TN01"]) {
    for (const lKey of Object.keys(LIGHTING_PRESETS)) {
      const [ndItem] = generateScenePrompts(
        nonDaySid,
        { ...createDefaultCharacterConfig(), lighting_preset: lKey },
        "3rd"
      );
      const ndSp = splitPromptPosAndNeg(ndItem.prompt);
      assert(
        !/\bsunlight\b|\bsun glare\b|\blight rays\b|\bdaylight\b/i.test(ndSp.posPrompt),
        `Non-daylight scene ${nonDaySid} under '${lKey}' leaked outdoor sun/daylight: ${ndSp.posPrompt}`
      );
    }
  }

  assert.equal(OTHER_ACTION_CHAPTERS.length, 30, "Expected 30 Other Actions (SF01..SF30)");
  assert.equal(OTHER_ACTION_TEMPLATES["SF06"].canvas, "横图 1216x832", "SF06 must use landscape canvas");

  // Verify SF Dedicated Lighting Engine across both 'auto' (随画风默认) and 'cool_warm_25d_cel':
  // 1) 'auto' lighting automatically injects SF_BASE_CEL_LIGHT_* + per-scene light_tags + light_prose + light_badge
  const autoSfCfg = {
    ...createDefaultCharacterConfig(),
    style_preset: "🌷 安定萌化mikozin（mikozin 0.66 + kani 0.55 + hori 0.48 + gotyou 0.42）",
    lighting_preset: "🔄 随画风与本幕默认光影（不额外覆盖）",
  };
  const [sf18Auto] = generateScenePrompts("SF18", autoSfCfg, "3rd");
  const spSf18Auto = splitPromptPosAndNeg(sf18Auto.prompt);
  assert(
    sf18Auto.subTitle.includes("[⚡夜园闪光]") &&
      spSf18Auto.posPrompt.includes("1.15::cel shading::") &&
      spSf18Auto.posPrompt.includes("1.18::shiny skin::") &&
      spSf18Auto.posPrompt.includes("1.55::camera flash::") &&
      !/\bbacklighting\b/i.test(spSf18Auto.posPrompt),
    "SF18 under 'auto' lighting must auto-inject SF wet-cel base, camera flash, and strip conflicting backlighting"
  );
  // 2) Even under cool_warm_25d_cel (which carries 1.25::backlighting::), flash scenes SF14/SF18/SF30 must strip backlighting!
  for (const flashSid of ["SF14", "SF18", "SF30"] as const) {
    const [flItem] = generateScenePrompts(
      flashSid,
      {
        ...createDefaultCharacterConfig(),
        style_preset: style6Key,
        lighting_preset: "💎✨ 2.5D 冷暖撞色水润高反差光影（Coral-Peach Skin + Cool Violet Rim & Specular）",
      },
      "3rd"
    );
    const spFl = splitPromptPosAndNeg(flItem.prompt);
    assert(
      spFl.posPrompt.includes("camera flash") && !/\bbacklighting\b/i.test(spFl.posPrompt),
      `${flashSid} under cool_warm_25d_cel must strip backlighting so direct frontal flash dominates`
    );
  }
  // 3) Verify per-scene dedicated light overrides on SF02 (warm spotlight), SF16 (1.5::city lights at night::), SF19 (ring light reflection in pupils), SF22 (sunlit dressing room), SF26 (warm yellow lighting)
  assert(
    generateScenePrompts("SF02", autoSfCfg, "3rd")[0].prompt.includes("1.4::warm spotlight::") &&
      generateScenePrompts("SF16", autoSfCfg, "3rd")[0].prompt.includes("1.5::city lights at night::") &&
      generateScenePrompts("SF19", autoSfCfg, "3rd")[0].prompt.includes("ring light reflection in pupils") &&
      generateScenePrompts("SF22", autoSfCfg, "3rd")[0].prompt.includes("sunlit dressing room, 1.2::sunlight::") &&
      generateScenePrompts("SF26", autoSfCfg, "3rd")[0].prompt.includes("1.4::warm yellow lighting::"),
    "SF02/16/19/22/26 must emit their exact skill-calibrated per-scene dedicated light tags"
  );

  // Verify zero >=8-word unweighted tag segments in otherActionsData.ts (prevents findTrailingProseIndex false positives)
  for (const ch of OTHER_ACTION_CHAPTERS) {
    const tpl = OTHER_ACTION_TEMPLATES[ch.id];
    for (const fieldVal of [
      tpl.framing_tags,
      tpl.env_tags,
      tpl.light_tags,
      tpl.core_prop_tags || "",
      tpl.builtin_outfit,
      tpl.femboy_outfit || "",
      tpl.female_tags,
      tpl.femboy_tags,
      tpl.futa_tags,
    ]) {
      for (const rawSeg of fieldVal.split(",")) {
        const seg = rawSeg.trim();
        if (!seg || seg.includes("::")) continue;
        assert(
          seg.split(/\s+/).length < 8,
          `${ch.id} has >=8-word unweighted tag '${seg}' that could be misclassified as trailing prose`
        );
      }
    }
  }

  // Verify hostile left-column config (Reverse Bunnysuit + Intact state + Sunlit Bedroom env + M2 multiple-views UC) NEVER poisons SF scenes!
  const hostileSfCfg = {
    ...createDefaultCharacterConfig(),
    style_preset: "🧬✨ M2 单画师极细净线赛璐璐风（mikozin 0.62 + 净黑细线 · 内置3槽Vibe调校）",
    lighting_preset: "💎✨ 2.5D 冷暖撞色水润高反差光影（Coral-Peach Skin + Cool Violet Rim & Specular）",
    body_preset: "袖珍娇小窄肩细腰笔直长腿·微Q萌圆脸（0.25 chibi + short slender mini-lady）",
    outfit_preset: "🐰 逆兔女郎装 · 经典黑爱心胸贴 + 腿环过膝袜（Reverse Bunnysuit · 胸贴版）",
    outfit_state_mode: "🔒 全程保持原装完整（不撩衣/不脱衣 · 仅自然露肤）",
    env_preset: "🪟 晨光纱帘白床明亮卧室（bright window, curtains, sunlit bedroom, white bedsheet）",
    other_use_scene_outfit: true,
  };
  const [sf24Hostile] = generateScenePrompts("SF24", hostileSfCfg, "3rd");
  const spSf24H = splitPromptPosAndNeg(sf24Hostile.prompt);
  const sf24HNegSet = new Set(spSf24H.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
  for (const forbiddenBleed of [
    "pantyhose",
    "full pantyhose",
    "bra",
    "nude",
    "topless",
    "bottomless",
    "covered torso",
    "outdoors",
    "nipples",
    "dripping",
  ]) {
    assert(
      !sf24HNegSet.has(forbiddenBleed),
      `SF24 (useSceneOutfit=true) must isolate Negative from left-column '${forbiddenBleed}'`
    );
  }
  // First-slot framing check: camera/selfie framing must precede character identity!
  assert(
    spSf24H.posPrompt.indexOf("1.5::selfie::") < spSf24H.posPrompt.indexOf("laffey (azur lane)"),
    "SF24 must place V5 camera/framing tags in early slot before character identity"
  );

  // Dual-view SF06/SF22 & viewfinder SF13 must unblock 'multiple views' even on M2 style; SF04/SF13/SF19 must unblock 'text' and strip 'no text'
  for (const mvSid of ["SF06", "SF13", "SF22"]) {
    const [mvItem] = generateScenePrompts(mvSid, hostileSfCfg, "3rd");
    const mvNeg = new Set(splitPromptPosAndNeg(mvItem.prompt).negPrompt.split(",").map((s) => s.trim().toLowerCase()));
    assert(!mvNeg.has("multiple views"), `${mvSid} must unblock 'multiple views' in Negative`);
  }
  for (const txtSid of ["SF04", "SF13", "SF19"]) {
    const [txtItem] = generateScenePrompts(txtSid, hostileSfCfg, "3rd");
    const spTxt = splitPromptPosAndNeg(txtItem.prompt);
    const txtNeg = new Set(spTxt.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
    assert(
      !/\bno text\b/i.test(spTxt.posPrompt) && !txtNeg.has("text") && txtNeg.has("watermark"),
      `${txtSid} must strip 'no text' and unblock 'text' while preserving 'watermark' guard`
    );
  }
  // School-outfit SF27 & SF29 must strip Javelin's serafuku/neckerchief/plaid from canonNeg
  for (const schSid of ["SF27", "SF29"]) {
    const [schItem] = generateScenePrompts(schSid, hostileSfCfg, "3rd");
    const schNeg = new Set(splitPromptPosAndNeg(schItem.prompt).negPrompt.split(",").map((s) => s.trim().toLowerCase()));
    assert(
      !schNeg.has("serafuku") && !schNeg.has("plaid") && !schNeg.has("neckerchief"),
      `${schSid} must strip serafuku/plaid/neckerchief from canon_neg_tags`
    );
  }
  // Character-outfit mode (other_use_scene_outfit=false) must retain core fetish props & avoid conflicting nipple/prose tags
  const [sf28CustomOut] = generateScenePrompts("SF28", { ...hostileSfCfg, other_use_scene_outfit: false }, "3rd");
  const spSf28Co = splitPromptPosAndNeg(sf28CustomOut.prompt);
  assert(
    spSf28Co.posPrompt.includes("1.55::round glasses::") &&
      spSf28Co.posPrompt.includes("1.5::reverse bunnysuit::") &&
      spSf28Co.posPrompt.includes("1.4::heart pasties::") &&
      !spSf28Co.posPrompt.includes("1.3::nipples::"),
    "SF28 with other_use_scene_outfit=false + heart pasties must retain round glasses + reverse bunnysuit and strip conflicting bare nipples"
  );
  const [sf05CustomOut] = generateScenePrompts("SF05", { ...hostileSfCfg, other_use_scene_outfit: false }, "3rd");
  assert(
    sf05CustomOut.prompt.includes("1.55::egg vibrator::") && !sf05CustomOut.prompt.includes("beige trench coat"),
    "SF05 with other_use_scene_outfit=false must keep egg vibrator prop and remove trench coat from prose"
  );

  const sfGenders = ["normal", "femboy", "futa_no_balls", "futa_with_balls"] as const;
  for (const ch of OTHER_ACTION_CHAPTERS) {
    const tpl = OTHER_ACTION_TEMPLATES[ch.id];
    for (const gm of sfGenders) {
      const sfCfg = {
        ...createDefaultCharacterConfig(),
        gender_mode: gm,
        style_preset: gm.startsWith("futa") ? style6FutaKey : style6Key,
        lighting_preset: "💎✨ 2.5D 冷暖撞色水润高反差光影（Coral-Peach Skin + Cool Violet Rim & Specular）",
        body_preset: "袖珍娇小窄肩细腰笔直长腿·微Q萌圆脸（0.25 chibi + short slender mini-lady）",
        pos_token_limit: 502,
      };
      const [item] = generateScenePrompts(ch.id, sfCfg, "3rd");
      assert(item, `Missing prompt for ${ch.id} (${gm})`);
      const sp = splitPromptPosAndNeg(item.prompt);
      assert(!sp.posPrompt.includes("::::"), `${ch.id} (${gm}) malformed ::::`);
      const negLower = sp.negPrompt.toLowerCase();
      const negSet = new Set(negLower.split(",").map((s) => s.trim()));

      if (tpl.camera_mode === "mirror") {
        assert(negLower.includes("pov hands"), `${ch.id} mirror mode must block pov hands`);
      } else if (tpl.camera_mode === "direct" || tpl.camera_mode === "ui_livestream") {
        assert(
          negLower.includes("holding phone") && negLower.includes("smartphone"),
          `${ch.id} direct/livestream mode must block holding phone & smartphone`
        );
      } else if (tpl.camera_mode === "ui_viewfinder") {
        assert(
          !negSet.has("smartphone"),
          `${ch.id} viewfinder mode must NOT block smartphone`
        );
      }

      if (ch.id === "SF03" || ch.id === "SF07" || ch.id === "SF20") {
        assert(negLower.includes("upside-down"), `${ch.id} must block upside-down`);
      }
      if (ch.id === "SF10") {
        assert(
          !/\bslim waist\b/i.test(sp.posPrompt) &&
            !sp.posPrompt.includes("-0.40::plump::") &&
            !negSet.has("plump") &&
            !negSet.has("curvy"),
          "SF10 must strip slim waist + -0.40::plump:: in Pos and plump/curvy in Neg"
        );
      }
      if (ch.id === "SF15") {
        assert(
          negSet.has("face") && negSet.has("head") && !/\bgradient eyes\b/i.test(sp.posPrompt),
          "SF15 must block face & head and strip gradient eyes"
        );
      }
      if (ch.id === "SF25") {
        assert(
          negLower.includes("multiple dildos") && negLower.includes("double dildo"),
          "SF25 must block multiple dildos & double dildo"
        );
      }
      if (ch.id === "SF26") {
        assert(negLower.includes("towel covering crotch"), "SF26 must block towel covering crotch");
      }
      if (ch.id === "SF27") {
        assert(negLower.includes("selfie stick"), "SF27 must block selfie stick");
      }

      if (gm === "femboy") {
        assert(
          sp.posPrompt.includes("otoko no ko") && sp.posPrompt.includes("flat chest"),
          `${ch.id} femboy must include otoko no ko + flat chest`
        );
        assert(!/\bpussy\b/i.test(sp.posPrompt), `${ch.id} femboy must not contain pussy in Positive`);
        if (ch.id === "SF24") {
          assert(negSet.has("bra"), "SF24 femboy must block bra in UC");
        }
      } else if (gm === "futa_no_balls") {
        assert(
          sp.posPrompt.includes("futa without balls") &&
            negSet.has("testicles") &&
            !/\blabia\b|\bspread pussy\b/i.test(sp.posPrompt),
          `${ch.id} futa_no_balls must include futa without balls, block testicles, and strip labia/spread pussy`
        );
      } else if (gm === "futa_with_balls") {
        assert(
          sp.posPrompt.includes("futa with balls") &&
            sp.posPrompt.includes("small testicles") &&
            !/\blabia\b|\bspread pussy\b/i.test(sp.posPrompt),
          `${ch.id} futa_with_balls must include futa with balls + small testicles and strip labia/spread pussy`
        );
      }

      const tok = countSeparatedT5Tokens({
        posPrompt: sp.posPrompt,
        sceneNegPrompt: sp.negPrompt,
        ucPresetMode: "heavy",
        appendQuality: true,
      });
      assert(
        tok.posTokens <= 512 && tok.negTokens <= 512,
        `${ch.id} (${gm}) exceeded 512 T5 budget: pos=${tok.posTokens}, neg=${tok.negTokens}`
      );
    }
  }

  // 18. Verify Opus Battery Percentage & Recharge Formatter
  const mockSubBase = {
    tier: 3,
    tier_name: "Opus",
    active: true,
    anlas_left: 9541,
    fixed_anlas: 9541,
    purchased_anlas: 0,
    opus_usage_percent: 47,
    opus_purchased_percent: 0,
    opus_usage_negative: false,
    opus_time_until_next_sec: 7888,
    unlimited_max_priority: true,
    expires_at: 1797095674,
  };
  const battMid = formatOpusBatterySummary(mockSubBase);
  assert.equal(battMid.hasBattery, true);
  assert.equal(battMid.percentText, "47%");
  assert.equal(battMid.fillPercent, 47);
  assert.equal(battMid.level, "mid");
  assert(battMid.rechargeHint.includes("2小时12分恢复+1%"));

  const battPurchased = formatOpusBatterySummary({
    ...mockSubBase,
    opus_usage_percent: 82,
    opus_purchased_percent: 100,
  });
  assert.equal(battPurchased.percentText, "82%+100%");
  assert.equal(battPurchased.fillPercent, 100);
  assert.equal(battPurchased.level, "high");

  const battNeg = formatOpusBatterySummary({
    ...mockSubBase,
    opus_usage_percent: 4,
    opus_usage_negative: true,
    opus_time_until_next_sec: 900,
  });
  assert.equal(battNeg.percentText, "-4%");
  assert.equal(battNeg.fillPercent, 0);
  assert.equal(battNeg.level, "low");
  assert.equal(battNeg.rechargeHint, "约15分恢复+1%");

  console.log(
    `PASS: Studio 2.0 Verified (${totalPrompts} scene prompts + 120 SF01~SF30 Other-Action prompts: 83 Positions x2 + MA0~MA11 + 30 SF + Free Action, 2-to-3-Col Folder Organizer + Stage Progression + MCP File Manager + Pixiv Bar/Mosaic Censor Verified, POV Optical & Gaze Audit + Femboy/Futa/TN01~TN12/BG01~BG20/SF01~SF30 Conflict-Free Transform Passed, T5 32k vocab, Embedded M2 3-Slot Vibe + DPM++ 2M, Persistent Preset Delete, Local+LAN+Remote MCP Bridge Ready, zero Python).`
  );
}

main().catch((err) => {
  console.error("VERIFY FAILED:", err);
  process.exit(1);
});
