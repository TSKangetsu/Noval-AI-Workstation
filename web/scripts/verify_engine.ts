import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  ALL_POSITIONS_CHAPTERS,
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

  console.log(
    `PASS: Studio 2.0 Verified (${totalPrompts} scene prompts: 51 Positions x2 + MA0~MA10 + Free Action, T5 32k vocab, Embedded M2 3-Slot Vibe + DPM++ 2M, Persistent Preset Delete, Local+LAN+Remote MCP Bridge Ready, zero Python).`
  );
}

main().catch((err) => {
  console.error("VERIFY FAILED:", err);
  process.exit(1);
});
