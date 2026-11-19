import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  ALL_POSITIONS_CHAPTERS,
  ALL_POSITIONS_TEMPLATES,
  BUNDLED_CUSTOM_PRESETS,
  EXPRESSION_PRESETS,
  FREE_ACTION_STARTERS,
  MODEL_V4_5_FULL,
  MODEL_V5_FULL,
  MODEL_V5_FULL_MEDIUM,
  MULTI_ANGLE_CHAPTERS,
  POS_STAGE_PRESETS,
  resolveLightingForStyle,
  STYLE_BUNDLED_VIBE_PACK,
  STYLE_PRESETS,
} from "../src/data/engineConstants";
import { BUNDLED_VIBE_PACKS, cloneBundledVibeItems } from "../src/data/bundledVibes";
import { generateScenePrompts } from "../src/engine/storyEngine";
import {
  computeSafePosTokenLimit,
  countPromptT5Tokens,
  countSeparatedT5Tokens,
  initT5Tokenizer,
  mergePosAndNegToInline,
  splitPromptPosAndNeg,
} from "../src/engine/t5Tokenizer";
import { createDefaultCharacterConfig } from "../src/engine/types";
import { resolveMcpEndpoints } from "../src/services/mcpBridgeClient";
import {
  buildNaiGeneratePayload,
  estimateNaiAnlas,
} from "../src/services/naiApiClient";
import {
  clearDeletedPresets,
  loadCustomPresets,
  loadDeletedPresets,
  markPresetDeleted,
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
    assert(freeItem && freeItem.prompt.includes("javelin (azur lane)"), "FREE mode must inherit character identity");
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
  assert(!noIdPrompt.includes("javelin (azur lane)"), "Identity tag must be omitted when enable_identity=false");
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
  markPresetDeleted("拉菲 Laffey（碧蓝航线）");
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
  assert.equal(ALL_POSITIONS_CHAPTERS.length, 55, "Expected 55 positions (P01..P51 + TN01..TN04)");
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
  assert.equal(MULTI_ANGLE_CHAPTERS.length, 11, "Bottom Multi-Angle list must remain MA0~MA10 (11 items)");
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

  // Group 4: front_face_visible POV retains face/expressions/eyes and blocks 3rd-person male back/head occlusion
  for (const pid of ["P01", "P03", "P11", "P26", "P27", "P42"]) {
    const [ffItem] = generateScenePrompts(pid, povAuditCfg, "pov");
    const spFf = splitPromptPosAndNeg(ffItem.prompt);
    const ffNegSet = new Set(spFf.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
    assert(
      spFf.posPrompt.includes("pov crotch") &&
        spFf.posPrompt.includes("pov hands") &&
        spFf.posPrompt.includes("1.35::mesugaki::") &&
        spFf.posPrompt.includes("aqua eyes"),
      `Frontal POV ${pid} must include pov crotch/hands and retain face expressions & eye color`
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

  console.log(
    `PASS: Studio 2.0 Verified (${totalPrompts} scene prompts: 55 Positions x2 + MA0~MA10 + Free Action, POV Optical & Gaze Audit + Femboy/Futa Conflict-Free Transform Passed, T5 32k vocab, Embedded M2 3-Slot Vibe + DPM++ 2M, Persistent Preset Delete, Local+LAN+Remote MCP Bridge Ready, zero Python).`
  );
}

main().catch((err) => {
  console.error("VERIFY FAILED:", err);
  process.exit(1);
});
