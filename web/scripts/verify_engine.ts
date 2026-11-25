import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  AFTERSEX_DRIP_DRESSED_CHEST_UC,
  AFTERSEX_DRIP_LIGHT_DEFAULTS,
  AFTERSEX_DRIP_LIGHT_STREAM_UC,
  ALL_POSITIONS_CHAPTERS,
  ALL_POSITIONS_TEMPLATES,
  APRON_ONLY_UC,
  BATHROOM_LIGHT_DEFAULTS,
  BATHROOM_TOWEL_UC,
  BODY_PRESETS,
  BUNDLED_CUSTOM_PRESETS,
  CAMPING_BAREFOOT_BAN_UC,
  CAMPING_LIGHT_DEFAULTS,
  CAR_BAREFOOT_BAN_UC,
  CAR_LIGHT_DEFAULTS,
  CAR_SOLO_PARTNER_BAN_UC,
  CAR_SOLO_PURE_SPREAD_ANTI_CUM_UC,
  EXPRESSION_PRESETS,
  FOOT_ANAT_UC,
  FREE_ACTION_STARTERS,
  HOUSEWORK_LIGHT_DEFAULTS,
  LIGHTING_PRESETS,
  MATSURI_LIGHT_DEFAULTS,
  MATSURI_PURE_SPREAD_ANTI_CUM_UC,
  MATSURI_SOLO_PARTNER_BAN_UC,
  MODEL_V4_5_FULL,
  MODEL_V5_FULL,
  MODEL_V5_FULL_MEDIUM,
  MULTI_ANGLE_CHAPTERS,
  normalizeLightingPresetName,
  ONSEN_BAREFOOT_BAN_UC,
  ONSEN_LIGHT_DEFAULTS,
  OTHER_ACTION_CATEGORIES,
  OTHER_ACTION_CHAPTERS,
  OTHER_ACTION_TEMPLATES,
  OUTFIT_PRESETS,
  PHOTO_SUBSTITUTE_GUARD_UC,
  POOL_LIGHT_DEFAULTS,
  POOL_SWIM_UC,
  POOL_SWIMWEAR_SPECS,
  POS_STAGE_PRESETS,
  resolveContrastingPhotoPortrait,
  resolveLightingForStyle,
  SPECIMEN_STOCKED_FRIDGE_GROCERY_UC,
  SPECIMEN_YANDERE_GUARD_UC,
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
  createDefaultNaiApiSettings,
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
  computePortraitCompactStage,
  EXPECTED_DUAL_STACK_H,
  EXPECTED_FILM_TOOLBAR_W,
} from "../src/ui/app";
import {
  buildNaiGeneratePayload,
  convertWebpToPngWithMetadata,
  crc32Png,
  detectImageExt,
  estimateNaiAnlas,
  formatOpusBatterySummary,
  injectPngTextChunks,
  readPngTextChunks,
  unpackNaiResponseBytes,
} from "../src/services/naiApiClient";
import {
  buildStoreZipBlob,
  clearDeletedPresets,
  filterStarredGalleryForPersist,
  loadActiveConfig,
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

  // 4. Verify Default Model & Model Payload Routing: V4.5 Full vs V5 Full High vs V5 Full Medium
  const defaultApi = createDefaultNaiApiSettings();
  assert.equal(defaultApi.model, MODEL_V5_FULL, "Default workbench model must be V5 High (nai-diffusion-5-full)");
  assert.equal(defaultApi.steps, 28, "Default V5 High steps must be 28");
  assert.equal(defaultApi.scale, 6.5, "Default V5 High scale must be 6.5");
  assert.equal(defaultApi.cfg_rescale, 0.0, "Default V5 High cfg_rescale must be 0.0");
  assert.equal(defaultApi.use_webp_transfer, true, "Default use_webp_transfer must be true");

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
    useWebpTransfer: true,
  });
  const p45 = v45Res.payload.parameters as Record<string, unknown>;
  assert.equal(v45Res.payload.model, "nai-diffusion-4-5-full");
  assert.equal(p45.params_version, 3);
  assert.equal(p45.steps, 28);
  assert.equal(p45.sampler, "k_euler_ancestral");
  assert.equal(p45.image_format, "webp", "V4.5 payload must emit image_format=webp when useWebpTransfer=true");
  assert(!String(v45Res.payload.input).includes("-2::"), "V4.5 separates negatives out of positive caption");

  const v5HighRes = buildNaiGeneratePayload({
    model: MODEL_V5_FULL,
    rawPrompt: samplePrompt,
    steps: 28,
    scale: 7.0,
    ucPresetMode: "heavy",
    useWebpTransfer: true,
  });
  const p5High = v5HighRes.payload.parameters as Record<string, unknown>;
  assert.equal(v5HighRes.payload.model, "nai-diffusion-5-full");
  assert.equal(p5High.params_version, 4);
  assert.equal(p5High.steps, 28);
  assert.equal(p5High.ucPresetId, "heavy");
  assert.equal(p5High.image_format, "webp", "V5 High payload must emit image_format=webp when useWebpTransfer=true");
  assert(!String(v5HighRes.payload.input).includes("-2::"), "V5 Full High separates positive and negative channels");

  const v5HighPngRes = buildNaiGeneratePayload({
    model: MODEL_V5_FULL,
    rawPrompt: samplePrompt,
    useWebpTransfer: false,
  });
  assert.equal(
    (v5HighPngRes.payload.parameters as Record<string, unknown>).image_format,
    "png",
    "Payload must emit image_format=png when useWebpTransfer=false"
  );

  // Verify WebP ZIP unpacking, non-browser safe fallback, and PNG tEXt CRC32 metadata injection
  const fakeWebp = new Uint8Array([
    0x52, 0x49, 0x46, 0x46, 0x0c, 0x00, 0x00, 0x00,
    0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x58,
    0x00, 0x00, 0x00, 0x00,
  ]);
  const webpZipBlob = buildStoreZipBlob([{ name: "image_0.webp", data: fakeWebp }]);
  const webpZipBytes = new Uint8Array(await webpZipBlob.arrayBuffer());
  const unpackedWebp = await unpackNaiResponseBytes(webpZipBytes);
  assert.equal(detectImageExt(unpackedWebp), ".webp", "ZIP unpacker must recognize .webp payload by RIFF/WEBP magic");
  assert.deepEqual(unpackedWebp, fakeWebp, "Unpacked .webp bytes must match original entry");
  const nodeFallbackBytes = await convertWebpToPngWithMetadata(unpackedWebp, { Software: "NovelAI" });
  assert.deepEqual(
    nodeFallbackBytes,
    unpackedWebp,
    "Non-browser Node environment must safely skip canvas WebP->PNG conversion"
  );

  // Minimal valid 1x1 PNG (signature + 13-byte IHDR + 0-byte IEND)
  const minimalPng = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89,
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44,
    0xae, 0x42, 0x60, 0x82,
  ]);
  const testComment = JSON.stringify({ prompt: "1girl, test", uc: "lowres", seed: 42, steps: 28, scale: 6.5 });
  const taggedPng = injectPngTextChunks(minimalPng, {
    Software: "NovelAI",
    Description: "1girl, test",
    Comment: testComment,
  });
  assert.equal(detectImageExt(taggedPng), ".png", "Tagged PNG must preserve PNG signature");
  const parsedMeta = readPngTextChunks(taggedPng);
  assert.equal(parsedMeta.Software, "NovelAI");
  assert.equal(parsedMeta.Description, "1girl, test");
  assert.equal(parsedMeta.Comment, testComment);
  // Verify CRC32 of every chunk in taggedPng
  {
    const dv = new DataView(taggedPng.buffer, taggedPng.byteOffset, taggedPng.byteLength);
    let off = 8;
    let chunkCount = 0;
    while (off + 12 <= taggedPng.length) {
      const len = dv.getUint32(off, false);
      const expectedCrc = dv.getUint32(off + 8 + len, false);
      const actualCrc = crc32Png(taggedPng.subarray(off + 4, off + 8 + len));
      assert.equal(actualCrc, expectedCrc, `PNG chunk #${chunkCount} CRC32 mismatch`);
      chunkCount += 1;
      off += 12 + len;
    }
    assert.equal(chunkCount, 5, "Tagged minimal PNG should contain IHDR + 3 tEXt + IEND");
  }

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

  // Verify fractional positive counterweights (< 1.0) & M6-Tune2 face counterweight (-0.95:: / legacy -2.5::) stay in Positive
  const counterweightTest =
    "1girl, solo, -0.45::wide hips::, -0.95::nose bridge, nostrils, lips, thick lips, philtrum::, -2.5::nose bridge, nostrils, lips::, -2::lowres, bad anatomy::";
  const splitCw = splitPromptPosAndNeg(counterweightTest);
  assert(
    splitCw.posPrompt.includes("-0.45::wide hips::") &&
      splitCw.posPrompt.includes("-0.95::nose bridge, nostrils, lips, thick lips, philtrum::") &&
      splitCw.posPrompt.includes("-2.5::nose bridge, nostrils, lips::") &&
      !splitCw.posPrompt.includes("lowres"),
    "Fractional counterweights and M6-Tune2 face counterweight must stay in Positive prompt"
  );
  assert(splitCw.negPrompt.includes("lowres"), "Standard -2::...:: negative must extract into Negative prompt");
  const mergedBack = mergePosAndNegToInline(splitCw.posPrompt, splitCw.negPrompt);
  assert(mergedBack.includes("-2::lowres, bad anatomy::"), "mergePosAndNegToInline must restore inline -2:: block");

  // Verify M6-Tune2 anti-cropped-head fix: -0.95:: 5-tag facial counterweight in Positive + head out of frame UC in Negative
  const tune2Cfg = {
    ...createDefaultCharacterConfig(),
    style_preset: "🎨 柔雾白纱无界油画 · 点鼻小嘴内联锁脸款（M6-Tune2 保留款 · 无界油画感）",
  };
  const [tune2Scene] = generateScenePrompts("P01", tune2Cfg, "3rd");
  const tune2Split = splitPromptPosAndNeg(tune2Scene.prompt);
  assert(
    tune2Split.posPrompt.includes("-0.95::nose bridge, nostrils, lips, thick lips, philtrum::"),
    "M6-Tune2 must emit narrowed -0.95:: facial counterweight in Positive"
  );
  assert(
    !tune2Split.posPrompt.includes("-2.5::") &&
      !tune2Split.posPrompt.includes("crown") &&
      !tune2Split.posPrompt.includes("small mouth") &&
      !tune2Split.posPrompt.includes(":o"),
    "M6-Tune2 Positive must not contain legacy -2.5::, crown, or mouth-locking small mouth/:o tags"
  );
  assert(
    tune2Split.negPrompt.includes("head out of frame") &&
      tune2Split.negPrompt.includes("cropped head") &&
      tune2Split.negPrompt.includes("headless"),
    "M6-Tune2 must route anti-cropped-head UC into Negative prompt"
  );

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

  assert.equal(
    OTHER_ACTION_CHAPTERS.length,
    325,
    "Expected 325 Other Actions (30 SF + 60 KTD duo + 46 KT solo + 22 PLD duo + 11 PL solo + 7 CV + 8 BT + 15 HWD + 4 PS + 12 CP + 15 AFD + 55 ONS + 25 CAR + 15 MTS)"
  );
  assert(
    OTHER_ACTION_CATEGORIES.includes("7. 裸围厨房") &&
      OTHER_ACTION_CATEGORIES.includes("8. 厨房干扰") &&
      OTHER_ACTION_CATEGORIES.includes("9. 厨房单人") &&
      OTHER_ACTION_CATEGORIES.includes("10. 饭菜双人") &&
      OTHER_ACTION_CATEGORIES.includes("11. 饭菜单人") &&
      OTHER_ACTION_CATEGORIES.includes("12. 泳池双人") &&
      OTHER_ACTION_CATEGORIES.includes("13. 泳池伪装") &&
      OTHER_ACTION_CATEGORIES.includes("14. 泳池单人") &&
      OTHER_ACTION_CATEGORIES.includes("15. 储精自注") &&
      OTHER_ACTION_CATEGORIES.includes("16. 浴室玩具") &&
      OTHER_ACTION_CATEGORIES.includes("17. 家务干扰") &&
      OTHER_ACTION_CATEGORIES.includes("18. 替身盖照") &&
      OTHER_ACTION_CATEGORIES.includes("19. 露营野餐") &&
      OTHER_ACTION_CATEGORIES.includes("20. 事后滑落") &&
      OTHER_ACTION_CATEGORIES.includes("21. 温泉双人") &&
      OTHER_ACTION_CATEGORIES.includes("22. 温泉单人"),
    "OTHER_ACTION_CATEGORIES must export all Kitchen, Pool, Specimen, Bathroom, Housework, PhotoSubstitute, Camping, AftersexDrip & Onsen Duo/Solo categories"
  );
  assert.equal(
    OTHER_ACTION_CHAPTERS.filter((c) => c.category === "7. 裸围厨房").length,
    20,
    "Expected 20 scenes in 7. 裸围厨房 (KTD01..KTD20)"
  );
  assert.equal(
    OTHER_ACTION_CHAPTERS.filter((c) => c.category === "8. 厨房干扰").length,
    10,
    "Expected 10 scenes in 8. 厨房干扰 (KTD21..KTD30)"
  );
  assert.equal(
    OTHER_ACTION_CHAPTERS.filter((c) => c.category === "9. 厨房单人").length,
    20,
    "Expected 20 scenes in 9. 厨房单人 (KT01..KT20)"
  );
  assert.equal(
    OTHER_ACTION_CHAPTERS.filter((c) => c.category === "10. 饭菜双人").length,
    30,
    "Expected 30 scenes in 10. 饭菜双人 (KTD31..KTD60)"
  );
  assert.equal(
    OTHER_ACTION_CHAPTERS.filter((c) => c.category === "11. 饭菜单人").length,
    26,
    "Expected 26 scenes in 11. 饭菜单人 (KT21..KT46)"
  );
  assert.equal(
    OTHER_ACTION_CHAPTERS.filter((c) => c.category === "12. 泳池双人").length,
    12,
    "Expected 12 scenes in 12. 泳池双人 (PLD01..PLD10, PLD21..PLD22)"
  );
  assert.equal(
    OTHER_ACTION_CHAPTERS.filter((c) => c.category === "13. 泳池伪装").length,
    10,
    "Expected 10 scenes in 13. 泳池伪装 (PLD11..PLD20)"
  );
  assert.equal(
    OTHER_ACTION_CHAPTERS.filter((c) => c.category === "14. 泳池单人").length,
    11,
    "Expected 11 scenes in 14. 泳池单人 (PL01..PL11)"
  );
  assert.equal(
    OTHER_ACTION_CHAPTERS.filter((c) => c.category === "15. 储精自注").length,
    7,
    "Expected 7 scenes in 15. 储精自注 (CV01..CV07)"
  );
  assert.equal(
    OTHER_ACTION_CHAPTERS.filter((c) => c.category === "16. 浴室玩具").length,
    8,
    "Expected 8 scenes in 16. 浴室玩具 (BT01..BT08)"
  );
  assert.equal(
    OTHER_ACTION_CHAPTERS.filter((c) => c.category === "17. 家务干扰").length,
    15,
    "Expected 15 scenes in 17. 家务干扰 (HWD01..HWD15)"
  );
  assert.equal(
    OTHER_ACTION_CHAPTERS.filter((c) => c.category === "18. 替身盖照").length,
    4,
    "Expected 4 scenes in 18. 替身盖照 (PS01..PS04)"
  );
  assert.equal(
    OTHER_ACTION_CHAPTERS.filter((c) => c.category === "19. 露营野餐").length,
    12,
    "Expected 12 scenes in 19. 露营野餐 (CP01..CP12)"
  );
  assert.equal(
    OTHER_ACTION_CHAPTERS.filter((c) => c.category === "20. 事后滑落").length,
    15,
    "Expected 15 scenes in 20. 事后滑落 (AFD01..AFD15)"
  );
  assert.equal(
    OTHER_ACTION_CHAPTERS.filter((c) => c.category === "21. 温泉双人").length,
    32,
    "Expected 32 Duo scenes in 21. 温泉双人"
  );
  assert.equal(
    OTHER_ACTION_CHAPTERS.filter((c) => c.category === "22. 温泉单人").length,
    23,
    "Expected 23 Solo scenes in 22. 温泉单人"
  );
  assert.equal(OTHER_ACTION_TEMPLATES["SF06"].canvas, "横图 1216x832", "SF06 must use landscape canvas");
  assert.equal(OTHER_ACTION_TEMPLATES["CP06"].canvas, "横图 1216x832", "CP06 must use landscape canvas");
  assert.equal(OTHER_ACTION_TEMPLATES["AFD12"].canvas, "横图 1216x832", "AFD12 must use landscape canvas");
  assert.equal(OTHER_ACTION_TEMPLATES["ONS05"].canvas, "横图 1216x832", "ONS05 must use landscape canvas");

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

  // Verify zero >=8-word unweighted tag segments in otherActionsData.ts, kitchenActionsData.ts & poolActionsData.ts
  for (const ch of OTHER_ACTION_CHAPTERS) {
    const tpl = OTHER_ACTION_TEMPLATES[ch.id];
    const duoFields = tpl.kitchen_duo
      ? [
          tpl.kitchen_duo.apron_detail_female,
          tpl.kitchen_duo.apron_detail_femboy,
          tpl.kitchen_duo.single_partner_tags,
          tpl.kitchen_duo.single_expr_tags,
          tpl.kitchen_duo.femboy_base_action,
          tpl.kitchen_duo.femboy_char1_pose,
          tpl.kitchen_duo.femboy_char2_pose,
          tpl.kitchen_duo.futa_male_tags,
          tpl.kitchen_duo.futa_yuri_spec?.base_action || "",
          tpl.kitchen_duo.futa_yuri_spec?.top_apron_tags || "",
          tpl.kitchen_duo.futa_yuri_spec?.top_pose_tags || "",
          tpl.kitchen_duo.futa_yuri_spec?.bottom_apron_detail || "",
          tpl.kitchen_duo.futa_yuri_spec?.bottom_pose_tags || "",
        ]
      : tpl.pool_duo
        ? [tpl.pool_duo.partner_tags, tpl.pool_duo.expr_tags]
        : tpl.specimen_duo
          ? [tpl.specimen_duo.partner_tags, tpl.specimen_duo.expr_tags]
          : tpl.housework_duo
            ? [tpl.housework_duo.apron_detail, tpl.housework_duo.partner_tags, tpl.housework_duo.expr_tags]
            : tpl.camping_duo
              ? [
                  tpl.camping_duo.outfit_tags,
                  tpl.camping_duo.femboy_outfit_tags,
                  tpl.camping_duo.partner_tags,
                  tpl.camping_duo.expr_tags,
                ]
              : [];
    for (const fieldVal of [
      tpl.framing_tags,
      tpl.femboy_framing_tags || "",
      tpl.env_tags,
      tpl.light_tags,
      tpl.core_prop_tags || "",
      tpl.femboy_core_prop_tags || "",
      tpl.pool_expr_tags || "",
      tpl.specimen_expr_tags || "",
      tpl.bathroom_expr_tags || "",
      tpl.photo_substitute_expr_tags || "",
      tpl.aftersex_drip_expr_tags || "",
      tpl.onsen_expr_tags || "",
      tpl.onsen_partner_tags || "",
      tpl.swimsuit_state_override || "",
      tpl.builtin_outfit,
      tpl.femboy_outfit || "",
      tpl.female_tags,
      tpl.femboy_tags,
      tpl.futa_tags,
      ...duoFields,
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
  const sfOnlyChapters = OTHER_ACTION_CHAPTERS.filter((c) => c.id.startsWith("SF"));
  for (const ch of sfOnlyChapters) {
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

  // 17.5 Verify Unified Naked-Apron Kitchen Series (KTD01..KTD60 & KT01..KT46 x 4 Gender Modes = 424 Prompts)
  const kitchenChapters = OTHER_ACTION_CHAPTERS.filter(
    (c) => c.id.startsWith("KTD") || c.id.startsWith("KT")
  );
  assert.equal(kitchenChapters.length, 106, "Expected 106 Kitchen chapters (KTD01..KTD60 + KT01..KT46)");
  const apronUcTokens = APRON_ONLY_UC.split(",").map((s) => s.trim().toLowerCase());
  const footUcTokens = FOOT_ANAT_UC.split(",").map((s) => s.trim().toLowerCase());

  const assertZeroNestedColons = (promptText: string, label: string): void => {
    assert(!promptText.includes(":::"), `${label} contains corrupt triple/quadruple colons`);
    let openSpan = false;
    for (let i = 0; i < promptText.length - 1; i++) {
      if (promptText[i] === ":" && promptText[i + 1] === ":") {
        const prefixSlice = promptText.slice(Math.max(0, i - 6), i);
        const looksLikeWeightStart = /(?:^|[\s,(\n])-?\d+(?:\.\d+)?$/.test(prefixSlice);
        if (!openSpan) {
          assert(looksLikeWeightStart, `${label} has stray closing '::' without weight prefix near index ${i}`);
          openSpan = true;
        } else {
          assert(!looksLikeWeightStart, `${label} has nested 'w::...::' inside another '::' span near index ${i}`);
          openSpan = false;
        }
        i++;
      }
    }
    assert(!openSpan, `${label} has unclosed 'w::...::' weight block`);
  };

  const validKitchenLightModes = new Set([
    "midnight_fridge",
    "oven_warm_bottom",
    "stove_steam_hood",
    "digital_screen_glow",
    "doorway_blind_slit",
    "sunlit_or_pendant",
  ]);
  const expectedNonSunlitModeById: Record<string, string> = {
    KTD06: "midnight_fridge",
    KTD38: "midnight_fridge",
    KT06: "midnight_fridge",
    KT26: "midnight_fridge",
    KT35: "midnight_fridge",
    KT39: "midnight_fridge",
    KTD09: "oven_warm_bottom",
    KTD35: "oven_warm_bottom",
    KTD45: "oven_warm_bottom",
    KTD48: "oven_warm_bottom",
    KTD55: "oven_warm_bottom",
    KT07: "oven_warm_bottom",
    KT28: "oven_warm_bottom",
    KT34: "oven_warm_bottom",
    KT38: "oven_warm_bottom",
    KT45: "oven_warm_bottom",
    KTD04: "stove_steam_hood",
    KTD33: "stove_steam_hood",
    KTD44: "stove_steam_hood",
    KTD56: "stove_steam_hood",
    KT10: "stove_steam_hood",
    KT23: "stove_steam_hood",
    KT27: "stove_steam_hood",
    KTD07: "digital_screen_glow",
    KTD21: "digital_screen_glow",
    KTD25: "digital_screen_glow",
    KT09: "digital_screen_glow",
    KTD14: "doorway_blind_slit",
    KTD15: "doorway_blind_slit",
    KTD28: "doorway_blind_slit",
    KT14: "doorway_blind_slit",
  };
  const expectedYuriShowcaseSet = new Set(["KTD12", "KTD18", "KTD34", "KTD42", "KTD50", "KTD52"]);
  const expectedMultiBox490Set = new Set(["KTD12", "KTD30", "KTD34", "KTD42", "KTD50", "KTD52"]);
  const expectedLandscapeKitchenSet = new Set(["KTD03", "KTD09", "KTD18", "KTD31", "KT15", "KT21"]);

  let kitchenVerifiedCount = 0;
  let maxKitchenPosTokens = 0;
  let maxMultiBox490PosTokens = 0;
  for (const ch of kitchenChapters) {
    const tpl = OTHER_ACTION_TEMPLATES[ch.id];
    assert(
      tpl.kitchen_light_mode && validKitchenLightModes.has(tpl.kitchen_light_mode),
      `${ch.id} missing valid kitchen_light_mode: got '${String(tpl.kitchen_light_mode)}'`
    );
    const expectedMode = expectedNonSunlitModeById[ch.id] ?? "sunlit_or_pendant";
    assert.equal(
      tpl.kitchen_light_mode,
      expectedMode,
      `${ch.id} expected kitchen_light_mode='${expectedMode}', got '${tpl.kitchen_light_mode}'`
    );
    if (tpl.kitchen_light_mode === "midnight_fridge") {
      assert(tpl.light_tags.includes("strong chiaroscuro"), `${ch.id} missing strong chiaroscuro`);
    } else if (tpl.kitchen_light_mode === "oven_warm_bottom") {
      assert(
        tpl.light_tags.includes("warm cozy kitchen") &&
          tpl.light_tags.includes("warm orange bottom lighting"),
        `${ch.id} missing warm cozy kitchen / warm orange bottom lighting`
      );
    } else if (tpl.kitchen_light_mode === "stove_steam_hood") {
      assert(
        tpl.light_tags.includes("range hood spotlight") && tpl.light_tags.includes("steam"),
        `${ch.id} missing range hood spotlight / steam`
      );
      if (ch.id === "KTD04" || ch.id === "KTD33" || ch.id === "KT10") {
        assert(
          tpl.light_tags.includes("blue gas flame, boiling pot with rising white steam, range hood spotlight"),
          `${ch.id} missing stove_steam_hood canonical phrase`
        );
      }
    }
    if (ch.id === "KTD25") {
      assert(tpl.light_tags.includes("red chime indicator light"), "KTD25 missing red chime indicator light");
    }
    if (ch.id === "KTD14") {
      assert(
        tpl.light_tags.includes("warm blurred living room sofa") &&
          tpl.light_tags.includes("TV glow through doorway, depth of field"),
        "KTD14 missing doorway bokeh phrase"
      );
    }
    if (ch.id === "KTD15") {
      assert(tpl.light_tags.includes("dim doorway slit light"), "KTD15 missing dim doorway slit light");
    }
    if (ch.id === "KTD28") {
      assert(
        tpl.light_tags.includes("half-open horizontal 1.55::window blinds:: showing sunlit street"),
        "KTD28 missing window blinds phrase"
      );
    }
    if (ch.id === "KTD03") {
      assert(
        tpl.light_tags.includes("warm sunlit kitchen counter") &&
          tpl.light_tags.includes("flour dust in air"),
        "KTD03 missing warm sunlit kitchen counter / flour dust in air"
      );
    }
    if (ch.id === "KTD11") {
      assert(tpl.light_tags.includes("warm breakfast bar pendant light"), "KTD11 missing pendant light");
    }
    if (ch.id === "KTD12") {
      assert(tpl.light_tags.includes("sunlit kitchen island"), "KTD12 missing sunlit kitchen island");
    }
    if (ch.id === "KTD13") {
      assert(tpl.light_tags.includes("bright modern kitchen"), "KTD13 missing bright modern kitchen");
    }
    if (ch.id === "KTD26") {
      assert(tpl.light_tags.includes("morning kitchen counter"), "KTD26 missing morning kitchen counter");
    }
    if (ch.id === "KTD27") {
      assert(
        tpl.light_tags.includes("sunlit kitchen counter with fruit basket"),
        "KTD27 missing sunlit kitchen counter with fruit basket"
      );
    }

    const isDuo = ch.id.startsWith("KTD");
    const isYuriShowcase = Boolean(tpl.kitchen_duo?.futa_2girls_yuri);
    assert.equal(
      isYuriShowcase,
      expectedYuriShowcaseSet.has(ch.id),
      `${ch.id} futa_2girls_yuri mismatch`
    );
    const isOralDuo = tpl.kitchen_duo?.channel === "oral";
    const isLandscapeKitchen = expectedLandscapeKitchenSet.has(ch.id);

    for (const gm of sfGenders) {
      const ktCfg = {
        ...createDefaultCharacterConfig(),
        char_tag: "javelin (azur lane)",
        eng_name: "Javelin",
        canon_neg_tags: "neckerchief, serafuku, plaid, gloves, crown",
        gender_mode: gm,
        style_preset: style6Key,
        lighting_preset: "💎✨ 2.5D 冷暖撞色水润高反差光影（Coral-Peach Skin + Cool Violet Rim & Specular）",
        body_preset: "袖珍娇小窄肩细腰笔直长腿·微Q萌圆脸（0.25 chibi + short slender mini-lady）",
        bust_preset: "小巧适中（small breasts）",
        other_use_scene_outfit: true,
        pos_token_limit: 502,
      };
      const [item] = generateScenePrompts(ch.id, ktCfg, "3rd");
      assert(item, `Missing Kitchen prompt for ${ch.id} (${gm})`);
      assertZeroNestedColons(item.prompt, `${ch.id} (${gm})`);

      const sp = splitPromptPosAndNeg(item.prompt);
      assert(!/-?\d+(?:\.\d+)?::/.test(sp.negPrompt), `${ch.id} (${gm}) negative must never contain w::tag:: syntax`);
      const negSet = new Set(sp.negPrompt.split(",").map((s) => s.trim().toLowerCase()));

      // APRON_ONLY_UC check when other_use_scene_outfit !== false
      assert(
        sp.posPrompt.includes("naked apron"),
        `${ch.id} (${gm}) must inject naked apron when other_use_scene_outfit=true`
      );
      for (const apTok of apronUcTokens) {
        assert(negSet.has(apTok), `${ch.id} (${gm}) missing APRON_ONLY_UC token '${apTok}'`);
      }

      // Foot-focus anatomy & bare-feet legwear isolation checks
      if (tpl.is_foot_focus) {
        for (const ftTok of footUcTokens) {
          assert(negSet.has(ftTok), `${ch.id} (${gm}) foot-focus scene missing FOOT_ANAT_UC token '${ftTok}'`);
        }
      }
      if (tpl.footwear_mode === "bare_feet") {
        assert(
          negSet.has("thighhighs") &&
            negSet.has("stockings") &&
            !/\bwhite thighhighs\b/i.test(sp.posPrompt),
          `${ch.id} (${gm}) bare_feet scene must block legwear in UC and omit white thighhighs from Positive`
        );
      }

      // Landscape anti-letterbox check
      if (isLandscapeKitchen) {
        assert.equal(tpl.canvas, "横图 1216x832", `${ch.id} must use 1216x832 landscape canvas`);
        for (const lbTok of ["letterboxed", "pillarboxed", "black bars", "border", "cropped"]) {
          assert(negSet.has(lbTok), `${ch.id} (${gm}) landscape must block '${lbTok}' in UC`);
        }
      }

      // 4-Mode Gender Isolation checks
      if (isDuo) {
        if (gm === "normal") {
          assert(
            !sp.posPrompt.startsWith("[Base Prompt]") &&
              sp.posPrompt.includes("1girl, 1boy, hetero, faceless male") &&
              sp.posPrompt.includes("shirtless faceless male"),
            `${ch.id} (normal) must compile single-box female x shirtless faceless male`
          );
        } else if (gm === "femboy") {
          const expectedTarget = isOralDuo ? "target#oral" : "target#anal";
          const expectedSource = isOralDuo ? "source#oral" : "source#anal";
          const expectedChar2Header =
            ch.id === "KTD23" ? "1boy, shirtless faceless male" : "1boy, tall shirtless faceless male";
          assert(
            sp.posPrompt.startsWith("[Base Prompt]") &&
              sp.posPrompt.includes("[Character 1 (") &&
              sp.posPrompt.includes("[Character 2 (") &&
              sp.posPrompt.includes("1.45::1boy::, 1.55::otoko no ko::") &&
              sp.posPrompt.includes("1.55::flat chest::") &&
              sp.posPrompt.includes(expectedChar2Header) &&
              sp.posPrompt.includes(expectedTarget) &&
              sp.posPrompt.includes(expectedSource) &&
              sp.posPrompt.includes("-2.5::breasts, pussy, female::") &&
              sp.posPrompt.includes("-2.5::otoko no ko, crossdressing, petite, feminine::"),
            `${ch.id} (femboy) must compile Multi-Box 2boys with Character 1/2 role & inline per-char UC`
          );
          if (ch.id === "KTD23") {
            assert(
              !negSet.has("cutaway") &&
                !negSet.has("multiple views") &&
                sp.posPrompt.includes("1.55::insertion::") &&
                sp.posPrompt.includes("sunlit modern kitchen"),
              "KTD23 (femboy) must omit cutaway/multiple views from UC and include flush insertion + bright kitchen lighting"
            );
          }
          assert(
            negSet.has("twins") && negSet.has("identical hair") && negSet.has("3boys") && !negSet.has("otoko no ko"),
            `${ch.id} (femboy) global UC must include twins/identical hair/3boys and NEVER leak Char2's 'otoko no ko'`
          );
          const apiFemboy = buildNaiGeneratePayload({
            model: MODEL_V5_FULL,
            rawPrompt: sp.posPrompt,
            customNegPrompt: sp.negPrompt,
            steps: 28,
            scale: 6.8,
          });
          const v4Neg = (apiFemboy.payload.parameters as Record<string, unknown>).v4_negative_prompt as {
            caption: { base_caption: string; char_captions: Array<{ char_caption: string }> };
          };
          assert.equal(v4Neg.caption.char_captions.length, 2);
          assert(v4Neg.caption.char_captions[0].char_caption.includes("breasts, pussy, female"));
          assert(v4Neg.caption.char_captions[1].char_caption.includes("otoko no ko, crossdressing, petite, feminine"));
          assert(!v4Neg.caption.base_caption.includes("otoko no ko"));
        } else if (isYuriShowcase) {
          assert(
            sp.posPrompt.startsWith("[Base Prompt]") &&
              sp.posPrompt.includes("2girls, 1.5::futanari::, 1.45::futa on female::, yuri") &&
              sp.posPrompt.includes("blue frilly naked apron") &&
              sp.posPrompt.includes("white frilly naked apron") &&
              sp.posPrompt.includes("source#vaginal") &&
              sp.posPrompt.includes("target#vaginal") &&
              sp.posPrompt.includes("-2.5::pussy::") &&
              sp.posPrompt.includes("-2.5::futanari, penis, testicles::"),
            `${ch.id} (${gm}) must compile 2girls Multi-Box with blue & white naked aprons`
          );
          assert(
            !negSet.has("futanari") && !negSet.has("pussy"),
            `${ch.id} (${gm}) 2girls global UC must NOT leak per-char futanari or pussy bans`
          );
          const apiYuri = buildNaiGeneratePayload({
            model: MODEL_V5_FULL,
            rawPrompt: sp.posPrompt,
            customNegPrompt: sp.negPrompt,
            steps: 28,
            scale: 6.8,
          });
          const v4NegY = (apiYuri.payload.parameters as Record<string, unknown>).v4_negative_prompt as {
            caption: { base_caption: string; char_captions: Array<{ char_caption: string }> };
          };
          assert.equal(v4NegY.caption.char_captions.length, 2);
          assert.equal(v4NegY.caption.char_captions[0].char_caption, "pussy");
          assert.equal(v4NegY.caption.char_captions[1].char_caption, "futanari, penis, testicles");
        } else {
          assert(
            !sp.posPrompt.startsWith("[Base Prompt]") &&
              sp.posPrompt.includes("1girl, 1boy, hetero, faceless male, 1.55::futanari::") &&
              sp.posPrompt.includes("0.25::artist:pija (pianiishimo)::") &&
              /1\.45?::small penis::/.test(sp.posPrompt),
            `${ch.id} (${gm}) must compile Male-on-Futa dual-line with Style #6 pija artist tweak`
          );
          if (gm === "futa_no_balls") {
            assert(negSet.has("testicles"), `${ch.id} (futa_no_balls) must block testicles`);
          } else {
            assert(sp.posPrompt.includes("1.3::small testicles::") && !negSet.has("testicles"));
          }
        }
      }

      // Token ceiling assertions (<=490 on KTD12/30/34/42/50/52, <=500 on all 106 scenes)
      const tok = countSeparatedT5Tokens({
        posPrompt: sp.posPrompt,
        sceneNegPrompt: sp.negPrompt,
        ucPresetMode: "heavy",
        appendQuality: true,
      });
      const maxExpectedPos = expectedMultiBox490Set.has(ch.id) ? 490 : 500;
      assert(
        tok.posTokens <= maxExpectedPos && tok.negTokens <= 512,
        `${ch.id} (${gm}) exceeded T5 budget (${maxExpectedPos}): pos=${tok.posTokens}, neg=${tok.negTokens}`
      );
      if (tok.posTokens > maxKitchenPosTokens) maxKitchenPosTokens = tok.posTokens;
      if (expectedMultiBox490Set.has(ch.id) && tok.posTokens > maxMultiBox490PosTokens) {
        maxMultiBox490PosTokens = tok.posTokens;
      }
      kitchenVerifiedCount++;
    }
  }

  // Verify 6-mode Kitchen dynamic lighting overrides across all non-explicit (auto / style-paired / directional) lighting presets:
  const nonExplicitLightKeys = Object.keys(LIGHTING_PRESETS).filter((k) => {
    const c = LIGHTING_PRESETS[k].code;
    return (
      !c.startsWith("kitchen_") &&
      !c.startsWith("pool_") &&
      !c.startsWith("bathroom_") &&
      !c.startsWith("housework_") &&
      !c.startsWith("camping_")
    );
  });
  for (const kNoSunId of Object.keys(expectedNonSunlitModeById)) {
    const kTpl = OTHER_ACTION_TEMPLATES[kNoSunId];
    const firstLightAnchor = kTpl.light_tags.split(",")[0].trim();
    for (const lKey of nonExplicitLightKeys) {
      for (const gmProbe of ["normal", "femboy"] as const) {
        const [kItem] = generateScenePrompts(
          kNoSunId,
          {
            ...createDefaultCharacterConfig(),
            gender_mode: gmProbe,
            lighting_preset: lKey,
            custom_style_pos:
              "sunlight, dappled sunlight, morning sunlight, afternoon sunlight, sun glare, light rays, daylight, clear blue sky, bright sky",
            custom_style_neg: "depth of field, blurry, harsh shadow, harsh shadows, lowres",
            style_preset: "自定义画风（使用下方自定义画风框）",
          },
          "3rd"
        );
        const kSp = splitPromptPosAndNeg(kItem.prompt);
        assert(
          !/\bsunlight\b|\bdappled sunlight\b|\bmorning sunlight\b|\bafternoon sunlight\b|\blight rays\b|\bsun glare\b|\bdaylight\b|\bclear blue sky\b|\bbright sky\b/i.test(
            kSp.posPrompt
          ),
          `Kitchen override scene ${kNoSunId} (${gmProbe}) under '${lKey}' leaked outdoor sun/sky tag: ${kSp.posPrompt}`
        );
        assert(
          kSp.posPrompt.includes(firstLightAnchor) && !/\bwater caustics\b/i.test(kSp.posPrompt),
          `Kitchen override scene ${kNoSunId} (${gmProbe}) under '${lKey}' failed to inject tpl.light_tags ('${firstLightAnchor}') or cross-bled pool caustics`
        );
        if (kTpl.kitchen_light_mode === "doorway_blind_slit") {
          const kNegSet = new Set(kSp.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
          for (const unblocked of ["depth of field", "blurry", "harsh shadow", "harsh shadows"]) {
            assert(
              !kNegSet.has(unblocked),
              `doorway_blind_slit scene ${kNoSunId} (${gmProbe}) under '${lKey}' failed to unblock '${unblocked}' from style_neg`
            );
          }
        }
      }
    }
  }

  // Verify other_use_scene_outfit=false fallback + enable_condom + enable_uterus_xray (femboy intestines cutaway) + pos_transparent_bg + 3-Vibe 400 token cap
  const [ktd01Fallback] = generateScenePrompts(
    "KTD01",
    { ...hostileSfCfg, other_use_scene_outfit: false },
    "3rd"
  );
  const spKtd01Fb = splitPromptPosAndNeg(ktd01Fallback.prompt);
  const fbNegSet = new Set(spKtd01Fb.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
  assert(
    !spKtd01Fb.posPrompt.includes("naked apron") &&
      spKtd01Fb.posPrompt.includes("1.5::reverse bunnysuit::") &&
      !fbNegSet.has("shirt") &&
      !fbNegSet.has("pleated skirt"),
    "KTD01 with other_use_scene_outfit=false must use left-column outfit without APRON_ONLY_UC"
  );

  const [ktd21FemboyAux] = generateScenePrompts(
    "KTD21",
    {
      ...createDefaultCharacterConfig(),
      gender_mode: "femboy",
      enable_condom: true,
      enable_uterus_xray: true,
      pos_transparent_bg: true,
      pos_token_limit: computeSafePosTokenLimit({ isV45: true, activeVibeCount: 3 }),
    },
    "3rd"
  );
  const spKtd21Aux = splitPromptPosAndNeg(ktd21FemboyAux.prompt);
  const tokKtd21Aux = countSeparatedT5Tokens({
    posPrompt: spKtd21Aux.posPrompt,
    sceneNegPrompt: spKtd21Aux.negPrompt,
    ucPresetMode: "heavy",
    appendQuality: true,
  });
  assert(
    spKtd21Aux.posPrompt.includes("1.5::intestines::, 1.5::cum in ass::") &&
      spKtd21Aux.posPrompt.includes("1.4::condom::") &&
      spKtd21Aux.posPrompt.includes("2.0::transparent background::") &&
      tokKtd21Aux.posTokens <= 400,
    `KTD21 femboy with condom+xray+transparent_bg+3Vibes failed checks (posTokens=${tokKtd21Aux.posTokens})`
  );

  // 17.6 Verify 6 Swimwear Presets, 12 Dedicated Kitchen/Pool LIGHTING_PRESETS, & 33 Public Pool Scenes (PLD01..22 + PL01..11 = 132 Prompts)
  for (const swSpec of Object.values(POOL_SWIMWEAR_SPECS)) {
    const outPreset = OUTFIT_PRESETS[swSpec.out_data_key];
    assert(outPreset, `Missing swimwear OUTFIT_PRESETS entry '${swSpec.out_data_key}'`);
    assert(
      !/-?\d+(?:\.\d+)?::/.test(outPreset.extra_neg || ""),
      `Swimwear preset '${swSpec.out_data_key}' extra_neg must never contain w::tag:: weights`
    );
    for (const gmSw of ["normal", "femboy"] as const) {
      const [pSw] = generateScenePrompts(
        "P22",
        {
          ...createDefaultCharacterConfig(),
          gender_mode: gmSw,
          outfit_preset: swSpec.out_data_key,
          outfit_state_mode: "🔄 智能适配穿脱（原设/裙装自动撩裙拨内裤 · 单件上衣自动真空）",
        },
        "3rd"
      );
      assertZeroNestedColons(pSw.prompt, `P22 (${gmSw} / ${swSpec.style_id})`);
      const spSw = splitPromptPosAndNeg(pSw.prompt);
      assert(!/-?\d+(?:\.\d+)?::/.test(spSw.negPrompt), `P22 (${swSpec.style_id}) neg weights`);
      if (swSpec.style_id === "comp_highleg") {
        assert(
          spSw.posPrompt.includes("1.55::competition swimsuit::") &&
            spSw.posPrompt.includes("1.45::swimsuit aside::") &&
            !/\bbikini aside\b/i.test(spSw.posPrompt),
          `comp_highleg on P22 (${gmSw}) must emit swimsuit aside without colliding bikini aside`
        );
      }
      if (gmSw === "femboy") {
        assert(
          !/\bexposed sideboob\b|\bexposing cleavage\b|\bbreasts out\b/i.test(spSw.posPrompt),
          `Swimwear '${swSpec.style_id}' on P22 (femboy) leaked female chest tags`
        );
      }
    }
  }

  // Verify all 26 standalone venue-specific presets were removed from global LIGHTING_PRESETS (#83)
  // while scene-bound venue lighting remains 100% active inside storyEngine.ts, and localStorage migrates cleanly!
  for (const [lKey, lEntry] of Object.entries(LIGHTING_PRESETS)) {
    assert(
      !/厨房专属|泳池专属|浴室专属|家务专属|露营专属/.test(lKey) &&
        !/^(?:kitchen|pool|bathroom|housework|camping)_/i.test(lEntry.code),
      `Standalone venue lighting preset must NOT appear in global LIGHTING_PRESETS: ${lKey} (${lEntry.code})`
    );
  }
  for (const legacyVenueName of [
    "🧊🔦 厨房专属 · 深夜开冰箱冷白强明暗（Midnight Open-Fridge Chiaroscuro）",
    "🌊☀️ 泳池专属 · 晴日碧水焦散波纹强反光（Sunlit Turquoise Water Caustics）",
    "🚿💨 浴室专属 · 水雾玻璃淋浴间暖逆光花洒水珠（Backlit Steamy Glass Shower）",
    "☀️🧹 家务专属 · 晴日客厅金光微尘与柔毯高光（Sunlit Living Room & Dust Motes）",
    "🌿🧺 露营专属 · 晴林树影斑驳草甸与溪光（Dappled Meadow & Creek Sunbeams）",
    "kitchen_midnight_fridge",
    "pool_night_pool_glow",
    "bathroom_steamy_bath",
    "housework_sunny_balcony",
    "camping_warm_campfire",
  ]) {
    assert.equal(
      normalizeLightingPresetName(legacyVenueName),
      "🔄 随画风与本幕默认光影（不额外覆盖）",
      `normalizeLightingPresetName must migrate '${legacyVenueName}' back to default scene-bound lighting`
    );
    memLs.set(
      "nai_wb_active_config_v1",
      JSON.stringify({ ...createDefaultCharacterConfig(), lighting_preset: legacyVenueName })
    );
    assert.equal(
      loadActiveConfig().lighting_preset,
      "🔄 随画风与本幕默认光影（不额外覆盖）",
      `loadActiveConfig must migrate saved localStorage '${legacyVenueName}' cleanly`
    );
  }
  memLs.delete("nai_wb_active_config_v1");

  // Verify all 33 Public Swimming Pool chapters (PLD01..PLD22 & PL01..PL11 x 4 Gender Modes = 132 Prompts)
  const poolChapters = OTHER_ACTION_CHAPTERS.filter(
    (c) => c.id.startsWith("PLD") || (c.id.startsWith("PL") && !c.id.startsWith("PLD"))
  );
  assert.equal(poolChapters.length, 33, "Expected 33 Public Pool chapters (PLD01..PLD22 + PL01..PL11)");
  const poolSwimUcTokens = POOL_SWIM_UC.split(",").map((s) => s.trim().toLowerCase());
  const validPoolLightModes = new Set(Object.keys(POOL_LIGHT_DEFAULTS));
  const validPoolSwimStyles = new Set(Object.keys(POOL_SWIMWEAR_SPECS));

  let poolVerifiedCount = 0;
  let maxPoolPosTokens = 0;
  let maxPld18PosTokens = 0;
  for (const ch of poolChapters) {
    const tpl = OTHER_ACTION_TEMPLATES[ch.id];
    assert(
      tpl.pool_light_mode && validPoolLightModes.has(tpl.pool_light_mode),
      `${ch.id} missing valid pool_light_mode`
    );
    assert(
      tpl.swimsuit_style && validPoolSwimStyles.has(tpl.swimsuit_style),
      `${ch.id} missing valid swimsuit_style`
    );
    const poolLightDef = POOL_LIGHT_DEFAULTS[tpl.pool_light_mode];
    const isPoolDuo = ch.id.startsWith("PLD");
    const isPoolYuriShowcase = ch.id === "PLD18";
    const isPoolOral = tpl.pool_duo?.channel === "oral";
    const isPoolLandscape = ch.id === "PLD04";

    for (const gm of sfGenders) {
      const plCfg = {
        ...createDefaultCharacterConfig(),
        char_tag: "javelin (azur lane)",
        eng_name: "Javelin",
        canon_neg_tags: "neckerchief, serafuku, plaid, gloves, crown",
        gender_mode: gm,
        style_preset: style6Key,
        lighting_preset: "💎✨ 2.5D 冷暖撞色水润高反差光影（Coral-Peach Skin + Cool Violet Rim & Specular）",
        body_preset: "袖珍娇小窄肩细腰笔直长腿·微Q萌圆脸（0.25 chibi + short slender mini-lady）",
        bust_preset: "小巧适中（small breasts）",
        other_use_scene_outfit: true,
        pos_token_limit: 502,
      };
      const [item] = generateScenePrompts(ch.id, plCfg, "3rd");
      assert(item, `Missing Pool prompt for ${ch.id} (${gm})`);
      assertZeroNestedColons(item.prompt, `${ch.id} (${gm})`);

      const sp = splitPromptPosAndNeg(item.prompt);
      assert(!/-?\d+(?:\.\d+)?::/.test(sp.negPrompt), `${ch.id} (${gm}) negative must never contain w::tag:: syntax`);
      const negSet = new Set(sp.negPrompt.split(",").map((s) => s.trim().toLowerCase()));

      // Zero Kitchen <-> Pool cross-bleed + POOL_SWIM_UC check
      assert(
        !sp.posPrompt.includes("naked apron") && !sp.posPrompt.includes("open refrigerator"),
        `${ch.id} (${gm}) must never cross-bleed Kitchen naked apron or appliance tags`
      );
      for (const swTok of poolSwimUcTokens) {
        assert(negSet.has(swTok), `${ch.id} (${gm}) missing POOL_SWIM_UC token '${swTok}'`);
      }

      // Pool dedicated lighting positive & negative checks
      const firstPoolLightAnchor = poolLightDef.pos.split(",")[0].trim();
      assert(
        sp.posPrompt.includes(firstPoolLightAnchor),
        `${ch.id} (${gm}) missing pool_light_mode anchor '${firstPoolLightAnchor}'`
      );
      for (const plNegTok of poolLightDef.neg.split(",").map((s) => s.trim().toLowerCase())) {
        assert(negSet.has(plNegTok), `${ch.id} (${gm}) missing pool_light_mode neg '${plNegTok}'`);
      }
      if (tpl.pool_light_mode === "night_pool_glow") {
        assert(
          !/\bbacklighting\b|\bsunlight\b/i.test(sp.posPrompt),
          `${ch.id} (${gm}) night_pool_glow must strip backlighting and sunlight`
        );
      }

      if (tpl.is_foot_focus) {
        for (const ftTok of footUcTokens) {
          assert(negSet.has(ftTok), `${ch.id} (${gm}) foot-focus pool scene missing '${ftTok}'`);
        }
      }
      if (isPoolLandscape) {
        assert.equal(tpl.canvas, "横图 1216x832", "PLD04 must use landscape 1216x832 canvas");
        assert(negSet.has("letterboxed") && negSet.has("pillarboxed"), "PLD04 missing anti-letterbox UC");
      }

      if (isPoolDuo) {
        if (gm === "femboy") {
          const expTarget = isPoolOral ? "target#oral" : "target#anal";
          const expSource = isPoolOral ? "source#oral" : "source#anal";
          assert(
            sp.posPrompt.startsWith("[Base Prompt]") &&
              sp.posPrompt.includes("2boys, 1.55::yaoi::, bare feet") &&
              sp.posPrompt.includes("1.45::1boy::, 1.55::otoko no ko::") &&
              sp.posPrompt.includes("tall athletic shirtless faceless male swimmer") &&
              sp.posPrompt.includes(expTarget) &&
              sp.posPrompt.includes(expSource) &&
              sp.posPrompt.includes("-2.5::breasts, pussy, female::"),
            `${ch.id} (femboy) must compile Multi-Box 2boys pool swimmer layout`
          );
        } else if (isPoolYuriShowcase && gm === "normal") {
          assert(
            sp.posPrompt.startsWith("[Base Prompt]") &&
              sp.posPrompt.includes("2girls, 1.55::yuri::, bare feet") &&
              sp.posPrompt.includes("1.55::competition swimsuit::") &&
              sp.posPrompt.includes("1.55::white one-piece swimsuit::") &&
              sp.posPrompt.includes("1.55::tribadism::"),
            "PLD18 (normal) must compile 2girls contrast-swimsuit Yuri Multi-Box"
          );
        } else if (isPoolYuriShowcase) {
          assert(
            sp.posPrompt.startsWith("[Base Prompt]") &&
              sp.posPrompt.includes("2girls, 1.5::futanari::, 1.45::futa on female::, yuri") &&
              sp.posPrompt.includes("source#vaginal") &&
              sp.posPrompt.includes("target#vaginal") &&
              !negSet.has("futanari") &&
              !negSet.has("pussy"),
            `PLD18 (${gm}) must compile 2girls Futa-on-Female contrast-swimsuit Yuri Multi-Box`
          );
        } else if (gm === "normal") {
          assert(
            !sp.posPrompt.startsWith("[Base Prompt]") &&
              sp.posPrompt.includes("1girl, 1boy, hetero, faceless male, bare feet"),
            `${ch.id} (normal) must compile single-box female x male swimmer`
          );
        } else {
          assert(
            !sp.posPrompt.startsWith("[Base Prompt]") &&
              sp.posPrompt.includes("1girl, 1boy, hetero, faceless male, 1.55::futanari::") &&
              sp.posPrompt.includes("0.25::artist:pija (pianiishimo)::") &&
              /1\.45?::small penis::/.test(sp.posPrompt),
            `${ch.id} (${gm}) must compile Male-on-Futa pool scene with Style #6 pija tweak`
          );
        }
      }

      const tok = countSeparatedT5Tokens({
        posPrompt: sp.posPrompt,
        sceneNegPrompt: sp.negPrompt,
        ucPresetMode: "heavy",
        appendQuality: true,
      });
      const maxExpectedPoolPos = ch.id === "PLD18" ? 490 : 500;
      assert(
        tok.posTokens <= maxExpectedPoolPos && tok.negTokens <= 512,
        `${ch.id} (${gm}) exceeded Pool T5 budget (${maxExpectedPoolPos}): pos=${tok.posTokens}, neg=${tok.negTokens}`
      );
      if (tok.posTokens > maxPoolPosTokens) maxPoolPosTokens = tok.posTokens;
      if (ch.id === "PLD18" && tok.posTokens > maxPld18PosTokens) maxPld18PosTokens = tok.posTokens;
      poolVerifiedCount++;
    }
  }

  // Verify non-sunlit Pool scenes strip outdoor sun/sky tags across ALL non-explicit lighting presets
  for (const pNoSunId of ["PLD02", "PLD03", "PLD07", "PLD08", "PL03", "PL05", "PL07", "PL08"]) {
    const pTpl = OTHER_ACTION_TEMPLATES[pNoSunId];
    const pAnchor = POOL_LIGHT_DEFAULTS[pTpl.pool_light_mode!].pos.split(",")[0].trim();
    for (const lKey of nonExplicitLightKeys) {
      const [pItem] = generateScenePrompts(
        pNoSunId,
        {
          ...createDefaultCharacterConfig(),
          lighting_preset: lKey,
          custom_style_pos:
            "sunlight, dappled sunlight, morning sunlight, afternoon sunlight, sun glare, light rays, daylight, clear blue sky, bright sky",
          style_preset: "自定义画风（使用下方自定义画风框）",
        },
        "3rd"
      );
      const pSp = splitPromptPosAndNeg(pItem.prompt);
      const forbiddenSunRe =
        pTpl.pool_light_mode === "deep_underwater"
          ? /\bmorning sunlight\b|\bafternoon sunlight\b|\blight rays\b|\bsun glare\b|\bdaylight\b|\bclear blue sky\b|\bbright sky\b/i
          : /\bsunlight\b|\bdappled sunlight\b|\bmorning sunlight\b|\bafternoon sunlight\b|\blight rays\b|\bsun glare\b|\bdaylight\b|\bclear blue sky\b|\bbright sky\b/i;
      assert(
        !forbiddenSunRe.test(pSp.posPrompt) && pSp.posPrompt.includes(pAnchor),
        `Non-sunlit Pool scene ${pNoSunId} under '${lKey}' leaked outdoor sun/sky or dropped '${pAnchor}'`
      );
    }
  }

  // Verify Pool other_use_scene_outfit=false fallback + enable_condom + femboy enable_uterus_xray + 3-Vibe 400 cap
  const [pld01Fallback] = generateScenePrompts(
    "PLD01",
    { ...hostileSfCfg, other_use_scene_outfit: false },
    "3rd"
  );
  const spPld01Fb = splitPromptPosAndNeg(pld01Fallback.prompt);
  const pld01FbNeg = new Set(spPld01Fb.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
  assert(
    !spPld01Fb.posPrompt.includes("competition swimsuit") &&
      spPld01Fb.posPrompt.includes("1.5::reverse bunnysuit::") &&
      !pld01FbNeg.has("shirt") &&
      !pld01FbNeg.has("thighhighs"),
    "PLD01 with other_use_scene_outfit=false must use left-column outfit without POOL_SWIM_UC"
  );

  const [pld16FemboyAux] = generateScenePrompts(
    "PLD16",
    {
      ...createDefaultCharacterConfig(),
      gender_mode: "femboy",
      enable_condom: true,
      enable_uterus_xray: true,
      pos_transparent_bg: true,
      pos_token_limit: computeSafePosTokenLimit({ isV45: true, activeVibeCount: 3 }),
    },
    "3rd"
  );
  const spPld16Aux = splitPromptPosAndNeg(pld16FemboyAux.prompt);
  const tokPld16Aux = countSeparatedT5Tokens({
    posPrompt: spPld16Aux.posPrompt,
    sceneNegPrompt: spPld16Aux.negPrompt,
    ucPresetMode: "heavy",
    appendQuality: true,
  });
  assert(
    spPld16Aux.posPrompt.includes("1.5::intestines::, 1.5::cum in ass::") &&
      spPld16Aux.posPrompt.includes("1.4::condom::") &&
      spPld16Aux.posPrompt.includes("2.0::transparent background::") &&
      tokPld16Aux.posTokens <= 400,
    `PLD16 femboy with condom+xray+transparent_bg+3Vibes failed checks (posTokens=${tokPld16Aux.posTokens})`
  );

  // 17.7 Verify 7 Restrained-Yandere Specimen Collection Scenes (CV01..CV07 x 4 Gender Modes = 28 Prompts) + Skill Hygiene
  const specimenChapters = OTHER_ACTION_CHAPTERS.filter((c) => c.id.startsWith("CV"));
  assert.equal(specimenChapters.length, 7, "Expected 7 Specimen chapters (CV01..CV07)");
  const yandereGuardTokens = SPECIMEN_YANDERE_GUARD_UC.split(",").map((s) => s.trim().toLowerCase());
  const fridgeGroceryTokens = SPECIMEN_STOCKED_FRIDGE_GROCERY_UC.split(",").map((s) => s.trim().toLowerCase());
  const expectedNocturnalCvSet = new Set(["CV02", "CV04", "CV05", "CV06"]);

  let specimenVerifiedCount = 0;
  let maxSpecimenPosTokens = 0;
  let maxSpecimenNegTokens = 0;
  for (const ch of specimenChapters) {
    const tpl = OTHER_ACTION_TEMPLATES[ch.id];
    assert.equal(Boolean(tpl.is_specimen_scene), true, `${ch.id} must set is_specimen_scene=true`);
    assert.equal(Boolean(tpl.is_specimen_duo), ch.id === "CV04", `${ch.id} is_specimen_duo mismatch`);
    assert.equal(Boolean(tpl.builtin_xray), ch.id === "CV01", `${ch.id} builtin_xray mismatch`);
    assert.equal(Boolean(tpl.allow_speculum), ch.id === "CV07", `${ch.id} allow_speculum mismatch`);
    assert.equal(
      Boolean(tpl.is_nocturnal_fridge),
      expectedNocturnalCvSet.has(ch.id),
      `${ch.id} is_nocturnal_fridge mismatch`
    );

    for (const gm of sfGenders) {
      const cvCfg = {
        ...createDefaultCharacterConfig(),
        char_tag: "javelin (azur lane)",
        eng_name: "Javelin",
        canon_neg_tags: "neckerchief, serafuku, plaid, gloves, crown",
        gender_mode: gm,
        style_preset: style6Key,
        lighting_preset: "💎✨ 2.5D 冷暖撞色水润高反差光影（Coral-Peach Skin + Cool Violet Rim & Specular）",
        body_preset: "袖珍娇小窄肩细腰笔直长腿·微Q萌圆脸（0.25 chibi + short slender mini-lady）",
        bust_preset: "小巧适中（small breasts）",
        other_use_scene_outfit: true,
        enable_uterus_xray: false,
        pos_token_limit: 502,
      };
      const [item] = generateScenePrompts(ch.id, cvCfg, "3rd");
      assert(item, `Missing Specimen prompt for ${ch.id} (${gm})`);
      assertZeroNestedColons(item.prompt, `${ch.id} (${gm})`);

      const sp = splitPromptPosAndNeg(item.prompt);
      assert(!/-?\d+(?:\.\d+)?::/.test(sp.negPrompt), `${ch.id} (${gm}) negative must never contain w::tag:: syntax`);
      const negSet = new Set(sp.negPrompt.split(",").map((s) => s.trim().toLowerCase()));

      // Invariant 1: Restrained subtle yandere expression + anti-cartoon-horror UC guards
      assert(
        sp.posPrompt.includes("1.15::yandere::") && sp.posPrompt.includes("1.15::heart-shaped pupils::"),
        `${ch.id} (${gm}) missing default restrained yandere expression anchors`
      );
      for (const yg of yandereGuardTokens) {
        assert(negSet.has(yg), `${ch.id} (${gm}) missing SPECIMEN_YANDERE_GUARD_UC '${yg}'`);
      }

      // Invariant 2: CV01 Built-in Syringe X-Ray
      if (ch.id === "CV01") {
        assert(
          item.subTitle.includes("[🔬内置透视]") &&
            sp.posPrompt.includes("1.7::syringe::") &&
            sp.posPrompt.includes("1.65::x-ray::") &&
            sp.posPrompt.includes("1.65::cross-section::") &&
            !negSet.has("x-ray") &&
            !negSet.has("cross-section") &&
            negSet.has("graduated cylinder") &&
            negSet.has("beaker") &&
            negSet.has("test tube") &&
            negSet.has("hypodermic needle") &&
            negSet.has("blood"),
          `CV01 (${gm}) failed built-in syringe X-Ray invariants`
        );
      } else {
        assert(
          negSet.has("x-ray") && negSet.has("cross-section"),
          `${ch.id} (${gm}) must block x-ray/cross-section when enable_uterus_xray=false`
        );
      }

      // Invariant 3: CV07 Flush-Inserted Thumbscrew Speculum & Exposed Cervix
      if (ch.id === "CV07") {
        assert(
          !negSet.has("gaping") &&
            sp.posPrompt.includes("speculum") &&
            sp.posPrompt.includes("object insertion") &&
            negSet.has("strainer") &&
            negSet.has("colander") &&
            negSet.has("funnel") &&
            negSet.has("scoop") &&
            negSet.has("wrench") &&
            negSet.has("two side handles") &&
            negSet.has("tongs"),
          `CV07 (${gm}) failed speculum hardware & anti-gaping UC invariants`
        );
        if (gm !== "femboy") {
          assert(sp.posPrompt.includes("cervix"), `CV07 (${gm}) must expose cervix`);
        }
      }

      // Invariant 4: Nocturnal Stocked-Fridge Lighting & Grocery Bans (CV02, CV04, CV05, CV06) + FOOT_ANAT_UC on CV02
      if (expectedNocturnalCvSet.has(ch.id)) {
        assert(
          !/\bbacklighting\b|\bsunlight\b/i.test(sp.posPrompt),
          `${ch.id} (${gm}) nocturnal fridge scene must strip backlighting and sunlight`
        );
        for (const grTok of fridgeGroceryTokens) {
          assert(negSet.has(grTok), `${ch.id} (${gm}) missing fridge grocery ban '${grTok}'`);
        }
      }
      if (ch.id === "CV02") {
        for (const ftTok of footUcTokens) {
          assert(negSet.has(ftTok), `CV02 (${gm}) missing FOOT_ANAT_UC '${ftTok}'`);
        }
      }

      // 4-Mode Gender Isolation checks
      if (gm === "femboy") {
        assert(
          !/\bpussy\b|\bcervix\b|\bvulva\b|\blabia\b/i.test(sp.posPrompt.split("-2.5::")[0]),
          `${ch.id} (femboy) leaked female genital tag into Positive`
        );
      }
      if (ch.id === "CV04") {
        if (gm === "femboy") {
          assert(
            sp.posPrompt.startsWith("[Base Prompt]") &&
              sp.posPrompt.includes("2boys, 1.55::yaoi::") &&
              sp.posPrompt.includes("1.45::1boy::, 1.55::otoko no ko::") &&
              sp.posPrompt.includes("1boy, tall shirtless faceless male"),
            "CV04 (femboy) must compile Multi-Box 2boys layout"
          );
        } else if (gm === "normal") {
          assert(
            !sp.posPrompt.startsWith("[Base Prompt]") &&
              sp.posPrompt.includes("1girl, 1boy, hetero, faceless male"),
            "CV04 (normal) must compile Single-Box 1girl x 1boy layout"
          );
        } else {
          assert(
            !sp.posPrompt.startsWith("[Base Prompt]") &&
              sp.posPrompt.includes("1girl, 1boy, hetero, faceless male, 1.55::futanari::") &&
              sp.posPrompt.includes("0.25::artist:pija (pianiishimo)::") &&
              /1\.45?::small penis::/.test(sp.posPrompt),
            `CV04 (${gm}) must compile Male-on-Futa with Style #6 pija tweak`
          );
        }
      }

      const tok = countSeparatedT5Tokens({
        posPrompt: sp.posPrompt,
        sceneNegPrompt: sp.negPrompt,
        ucPresetMode: "heavy",
        appendQuality: true,
      });
      assert(
        tok.posTokens <= 500 && tok.negTokens <= 512,
        `${ch.id} (${gm}) exceeded Specimen T5 budget: pos=${tok.posTokens}/500, neg=${tok.negTokens}/512`
      );
      if (tok.posTokens > maxSpecimenPosTokens) maxSpecimenPosTokens = tok.posTokens;
      if (tok.negTokens > maxSpecimenNegTokens) maxSpecimenNegTokens = tok.negTokens;
      specimenVerifiedCount++;
    }
  }

  // Verify nocturnal CV02/CV04/CV05/CV06 strip backlighting & sun/sky under ALL non-explicit presets while honoring explicit kitchen_*/pool_* overrides
  for (const cvNoctId of ["CV02", "CV04", "CV05", "CV06"]) {
    for (const lKey of nonExplicitLightKeys) {
      const [cvNoct] = generateScenePrompts(
        cvNoctId,
        {
          ...createDefaultCharacterConfig(),
          lighting_preset: lKey,
          custom_style_pos: "backlighting, sunlight, morning sunlight, sun glare, daylight, clear blue sky",
          style_preset: "自定义画风（使用下方自定义画风框）",
        },
        "3rd"
      );
      const spNoct = splitPromptPosAndNeg(cvNoct.prompt);
      assert(
        !/\bbacklighting\b|\bsunlight\b|\bmorning sunlight\b|\bsun glare\b|\bdaylight\b|\bclear blue sky\b/i.test(
          spNoct.posPrompt
        ),
        `Nocturnal Specimen ${cvNoctId} under '${lKey}' leaked backlighting or sun/sky`
      );
    }
  }

  // Verify explicit UI expression override + other_use_scene_outfit=false + condom + femboy X-Ray + 3-Vibe 400 cap on CV04
  const exprOverrideKey = Object.keys(EXPRESSION_PRESETS).find((k) => k.includes("温柔浅笑"))!;
  const [cv03ExprOverride] = generateScenePrompts(
    "CV03",
    { ...createDefaultCharacterConfig(), expr_preset: exprOverrideKey },
    "3rd"
  );
  assert(
    cv03ExprOverride.subTitle.includes("[😊") && cv03ExprOverride.prompt.includes("gentle smile"),
    "CV03 must honor explicit UI expression_preset override"
  );

  const [cv02Fallback] = generateScenePrompts(
    "CV02",
    { ...hostileSfCfg, other_use_scene_outfit: false },
    "3rd"
  );
  const spCv02Fb = splitPromptPosAndNeg(cv02Fallback.prompt);
  const cv02FbNeg = new Set(spCv02Fb.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
  assert(
    !spCv02Fb.posPrompt.includes("loose white off-shoulder camisole") &&
      spCv02Fb.posPrompt.includes("1.5::reverse bunnysuit::") &&
      !cv02FbNeg.has("collared shirt") &&
      !cv02FbNeg.has("thighhighs"),
    "CV02 with other_use_scene_outfit=false must use left-column outfit without specimen_outfit_neg"
  );

  const [cv04FemboyAux] = generateScenePrompts(
    "CV04",
    {
      ...createDefaultCharacterConfig(),
      gender_mode: "femboy",
      enable_condom: true,
      enable_uterus_xray: true,
      pos_transparent_bg: true,
      pos_token_limit: computeSafePosTokenLimit({ isV45: true, activeVibeCount: 3 }),
    },
    "3rd"
  );
  const spCv04Aux = splitPromptPosAndNeg(cv04FemboyAux.prompt);
  const tokCv04Aux = countSeparatedT5Tokens({
    posPrompt: spCv04Aux.posPrompt,
    sceneNegPrompt: spCv04Aux.negPrompt,
    ucPresetMode: "heavy",
    appendQuality: true,
  });
  assert(
    spCv04Aux.posPrompt.includes("1.5::intestines::, 1.5::cum in ass::") &&
      spCv04Aux.posPrompt.includes("1.4::condom::") &&
      spCv04Aux.posPrompt.includes("2.0::transparent background::") &&
      tokCv04Aux.posTokens <= 400,
    `CV04 femboy with condom+xray+transparent_bg+3Vibes failed checks (posTokens=${tokCv04Aux.posTokens})`
  );

  // Verify .agents/skills/nai-specimen-collection/ hygiene (zero code/build vocabulary leaks)
  const specimenSkillDir = path.resolve(process.cwd(), "../.agents/skills/nai-specimen-collection");
  for (const relDoc of ["SKILL.md"]) {
    const docPath = path.join(specimenSkillDir, relDoc);
    assert(fs.existsSync(docPath), `Missing specimen skill doc: ${docPath}`);
    const docText = fs.readFileSync(docPath, "utf8");
    assert(
      !/storyEngine|engineConstants|otherActionsData|specimenActionsData|verify_engine|NovelAI_Workbench\.html|vite build|tsc --noEmit|npm --prefix/i.test(
        docText
      ),
      `${relDoc} leaked codebase/build vocabulary`
    );
  }

  // 17.8 Verify 8 Solo Bathroom Adult-Toy Scenes (BT01..BT08 = 32 Prompts), 4 Bathroom Light Modes, & Skill Hygiene
  const bathroomChapters = OTHER_ACTION_CHAPTERS.filter((c) => c.id.startsWith("BT"));
  assert.equal(bathroomChapters.length, 8, "Expected 8 Bathroom Solo-Toy scenes (BT01..BT08)");
  const bathroomTowelUcTokens = BATHROOM_TOWEL_UC.split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const footAnatUcTokensForBt = FOOT_ANAT_UC.split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  let maxBathroomPosTokens = 0;
  let maxBathroomNegTokens = 0;
  let bathroomVerifiedCount = 0;

  for (const ch of bathroomChapters) {
    const tpl = OTHER_ACTION_TEMPLATES[ch.id];
    assert(tpl && tpl.is_bathroom_scene, `Missing or unmarked Bathroom template ${ch.id}`);
    assert(
      tpl.bathroom_light_mode && tpl.bathroom_light_mode in BATHROOM_LIGHT_DEFAULTS,
      `${ch.id} must declare a valid bathroom_light_mode`
    );
    for (const gm of ["normal", "femboy", "futa_no_balls", "futa_with_balls"] as const) {
      const btCfg = {
        ...createDefaultCharacterConfig(),
        gender_mode: gm,
        style_preset: gm.startsWith("futa_") ? style6FutaKey : style6Key,
        lighting_preset: "🔄 随画风与本幕默认光影（不额外覆盖）",
        body_preset: Object.keys(BODY_PRESETS).find((k) => k.includes("丰满沙漏")) || createDefaultCharacterConfig().body_preset,
      };
      const [item] = generateScenePrompts(ch.id, btCfg, "3rd");
      assertZeroNestedColons(item.prompt, `${ch.id} (${gm})`);
      const sp = splitPromptPosAndNeg(item.prompt);
      assert(
        !/-?\d+(?:\.\d+)?::/.test(sp.negPrompt),
        `${ch.id} (${gm}) negPrompt must contain zero w::tag:: weights`
      );
      const negSet = new Set(sp.negPrompt.split(",").map((s) => s.trim().toLowerCase()));

      // Zero cross-bleed with Kitchen or Public Pool vocabulary
      assert(
        !sp.posPrompt.includes("naked apron") &&
          !sp.posPrompt.includes("competition swimsuit") &&
          !sp.posPrompt.includes("water caustics"),
        `${ch.id} (${gm}) cross-bled Kitchen or Pool tags into Positive`
      );

      // Subtitle badge check
      assert(
        item.subTitle.includes("🛁浴室玩具"),
        `${ch.id} (${gm}) subTitle must include 🛁浴室玩具`
      );

      // BATHROOM_TOWEL_UC check when other_use_scene_outfit=true
      for (const btTok of bathroomTowelUcTokens) {
        assert(
          negSet.has(btTok),
          `${ch.id} (${gm}) missing BATHROOM_TOWEL_UC token '${btTok}' in Negative`
        );
      }

      // FOOT_ANAT_UC check on barefoot scenes (BT01, BT02, BT03, BT05, BT07)
      if (tpl.is_foot_focus) {
        for (const ftTok of footAnatUcTokensForBt) {
          assert(
            negSet.has(ftTok),
            `${ch.id} (${gm}) missing FOOT_ANAT_UC token '${ftTok}' in Negative`
          );
        }
      }

      // Scene-specific empirical toy-physics & camera locks
      if (ch.id === "BT01") {
        assert(
          negSet.has("two dildos") && negSet.has("multiple dildos") && negSet.has("floating dildo"),
          `BT01 (${gm}) must guard two dildos / multiple dildos / floating dildo`
        );
      } else if (ch.id === "BT02" || ch.id === "BT03") {
        assert(
          !negSet.has("motion lines"),
          `${ch.id} (${gm}) must strip 'motion lines' from comic_line_guard so vibrator ripples render`
        );
        if (ch.id === "BT03") {
          assert(
            negSet.has("two controllers") && negSet.has("extra remote"),
            `BT03 (${gm}) must guard two controllers / extra remote`
          );
        }
      } else if (ch.id === "BT04") {
        assert(
          negSet.has("mirror selfie") &&
            negSet.has("holding phone") &&
            negSet.has("smartphone") &&
            negSet.has("camera"),
          `BT04 (${gm}) must block mirror selfie / holding phone / smartphone / camera`
        );
      } else if (ch.id === "BT06") {
        assert(
          sp.posPrompt.includes("1.5::from above::"),
          `BT06 (${gm}) must retain high-angle 1.5::from above:: framing`
        );
      } else if (ch.id === "BT08") {
        assert(
          !negSet.has("motion lines") &&
            !negSet.has("holding phone") &&
            !negSet.has("smartphone") &&
            negSet.has("mirror") &&
            negSet.has("mirror selfie") &&
            negSet.has("camera lens") &&
            negSet.has("taking picture") &&
            negSet.has("phone covering face"),
          `BT08 (${gm}) must allow smartphone app controller while blocking mirror/selfie/camera lens`
        );
      }

      // Gender isolation checks
      if (gm === "femboy") {
        assert(
          sp.posPrompt.includes("otoko no ko") &&
            sp.posPrompt.includes("flat chest") &&
            !/\bpussy\b|\bvaginal\b|\bclit\b|\bbare breasts\b/i.test(sp.posPrompt),
          `${ch.id} (femboy) leaked female anatomy into Positive: ${sp.posPrompt}`
        );
      } else if (gm.startsWith("futa_")) {
        assert(
          sp.posPrompt.includes("0.25::artist:pija (pianiishimo)::") &&
            /1\.45?::small penis::/.test(sp.posPrompt),
          `${ch.id} (${gm}) must include Style #6 Futa pija tweak and small penis anchor`
        );
      }

      const tok = countSeparatedT5Tokens({
        posPrompt: sp.posPrompt,
        sceneNegPrompt: sp.negPrompt,
        ucPresetMode: "heavy",
        appendQuality: true,
      });
      assert(
        tok.posTokens <= 500 && tok.negTokens <= 512,
        `${ch.id} (${gm}) exceeded Bathroom T5 budget: pos=${tok.posTokens}/500, neg=${tok.negTokens}/512`
      );
      if (tok.posTokens > maxBathroomPosTokens) maxBathroomPosTokens = tok.posTokens;
      if (tok.negTokens > maxBathroomNegTokens) maxBathroomNegTokens = tok.negTokens;
      bathroomVerifiedCount++;
    }
  }

  // Verify BT01..BT08 strip outdoor sun/daylight/sky tags across ALL non-explicit presets
  for (const ch of bathroomChapters) {
    const firstBtLightAnchor = OTHER_ACTION_TEMPLATES[ch.id].light_tags.split(",")[0].trim();
    for (const lKey of nonExplicitLightKeys) {
      const [btLightItem] = generateScenePrompts(
        ch.id,
        {
          ...createDefaultCharacterConfig(),
          lighting_preset: lKey,
          custom_style_pos:
            "sunlight, dappled sunlight, morning sunlight, afternoon sunlight, sun glare, light rays, daylight, clear blue sky, bright sky",
          style_preset: "自定义画风（使用下方自定义画风框）",
        },
        "3rd"
      );
      const spBtLight = splitPromptPosAndNeg(btLightItem.prompt);
      assert(
        spBtLight.posPrompt.includes(firstBtLightAnchor) &&
          !/\bsunlight\b|\bdappled sunlight\b|\bmorning sunlight\b|\bafternoon sunlight\b|\blight rays\b|\bsun glare\b|\bdaylight\b|\bclear blue sky\b|\bbright sky\b/i.test(
            spBtLight.posPrompt
          ),
        `Bathroom scene ${ch.id} under '${lKey}' leaked outdoor sun/sky or missed '${firstBtLightAnchor}'`
      );
    }
  }

  // Verify BT01 with other_use_scene_outfit=false + BT05 femboy condom + X-Ray + transparent_bg + 3-Vibe 400 cap
  const [bt01Fallback] = generateScenePrompts(
    "BT01",
    { ...hostileSfCfg, other_use_scene_outfit: false },
    "3rd"
  );
  const spBt01Fb = splitPromptPosAndNeg(bt01Fallback.prompt);
  const bt01FbNeg = new Set(spBt01Fb.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
  assert(
    spBt01Fb.posPrompt.includes("1.5::reverse bunnysuit::") &&
      !bt01FbNeg.has("collared shirt") &&
      !bt01FbNeg.has("thighhighs"),
    "BT01 with other_use_scene_outfit=false must use left-column outfit without BATHROOM_TOWEL_UC"
  );

  const [bt05FemboyAux] = generateScenePrompts(
    "BT05",
    {
      ...createDefaultCharacterConfig(),
      gender_mode: "femboy",
      enable_condom: true,
      enable_uterus_xray: true,
      pos_transparent_bg: true,
      pos_token_limit: computeSafePosTokenLimit({ isV45: true, activeVibeCount: 3 }),
    },
    "3rd"
  );
  const spBt05Aux = splitPromptPosAndNeg(bt05FemboyAux.prompt);
  const tokBt05Aux = countSeparatedT5Tokens({
    posPrompt: spBt05Aux.posPrompt,
    sceneNegPrompt: spBt05Aux.negPrompt,
    ucPresetMode: "heavy",
    appendQuality: true,
  });
  assert(
    spBt05Aux.posPrompt.includes("1.5::intestines::, 1.5::cum in ass::") &&
      spBt05Aux.posPrompt.includes("1.55::used condom::") &&
      spBt05Aux.posPrompt.includes("2.0::transparent background::") &&
      tokBt05Aux.posTokens <= 400,
    `BT05 femboy with condom+xray+transparent_bg+3Vibes failed checks (posTokens=${tokBt05Aux.posTokens})`
  );

  // Verify .agents/skills/nai-bathroom-solo-toys/ hygiene (zero code/build vocabulary leaks)
  const bathroomSkillDir = path.resolve(process.cwd(), "../.agents/skills/nai-bathroom-solo-toys");
  for (const relDoc of ["SKILL.md"]) {
    const docPath = path.join(bathroomSkillDir, relDoc);
    assert(fs.existsSync(docPath), `Missing bathroom skill doc: ${docPath}`);
    const docText = fs.readFileSync(docPath, "utf8");
    assert(
      !/storyEngine|engineConstants|otherActionsData|bathroomActionsData|verify_engine|NovelAI_Workbench\.html|vite build|tsc --noEmit|npm --prefix/i.test(
        docText
      ),
      `${relDoc} leaked codebase/build vocabulary`
    );
  }

  // 17.9 Verify 15 Unified Naked-Apron Housework Distraction Scenes (HWD01..HWD15 = 60 Prompts), 5 Housework Light Modes, Selective Garment-Prop Unblocking, & Skill Hygiene
  const houseworkChapters = OTHER_ACTION_CHAPTERS.filter((c) => c.id.startsWith("HWD"));
  assert.equal(houseworkChapters.length, 15, "Expected 15 Housework Distraction scenes (HWD01..HWD15)");
  const expectedChestCoveredHwd = new Set(["HWD04", "HWD10", "HWD13", "HWD15"]);
  const expectedUnblockShirtHwd = new Set(["HWD05", "HWD07", "HWD12", "HWD13"]);
  const expectedUnblockJacketHwd = new Set(["HWD12", "HWD14"]);
  const expectedBarefootHwd = new Set(["HWD02", "HWD03", "HWD08", "HWD10"]);
  const footAnatUcTokensForHwd = FOOT_ANAT_UC.split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  let maxHouseworkPosTokens = 0;
  let maxHouseworkMultiBoxPosTokens = 0;
  let maxHouseworkNegTokens = 0;
  let houseworkVerifiedCount = 0;

  for (const ch of houseworkChapters) {
    const tpl = OTHER_ACTION_TEMPLATES[ch.id];
    assert(
      tpl && tpl.is_housework_scene && tpl.is_housework_duo && tpl.housework_duo,
      `Missing or unmarked Housework duo template ${ch.id}`
    );
    assert(
      tpl.housework_light_mode && tpl.housework_light_mode in HOUSEWORK_LIGHT_DEFAULTS,
      `${ch.id} must declare a valid housework_light_mode`
    );
    assert.equal(
      Boolean(tpl.chest_covered),
      expectedChestCoveredHwd.has(ch.id),
      `${ch.id} chest_covered mismatch`
    );
    assert.equal(
      Boolean(tpl.unblock_prop_shirt),
      expectedUnblockShirtHwd.has(ch.id),
      `${ch.id} unblock_prop_shirt mismatch`
    );
    assert.equal(
      Boolean(tpl.unblock_prop_jacket),
      expectedUnblockJacketHwd.has(ch.id),
      `${ch.id} unblock_prop_jacket mismatch`
    );
    assert.equal(
      Boolean(tpl.barefoot),
      expectedBarefootHwd.has(ch.id),
      `${ch.id} barefoot mismatch`
    );
    if (ch.id === "HWD09") {
      assert.equal(tpl.canvas, "横图 1216x832", "HWD09 must use landscape 1216x832 canvas");
    }

    for (const gm of ["normal", "femboy", "futa_no_balls", "futa_with_balls"] as const) {
      const hwdCfg = {
        ...createDefaultCharacterConfig(),
        gender_mode: gm,
        style_preset: gm.startsWith("futa_") ? style6FutaKey : style6Key,
        lighting_preset: "🔄 随画风与本幕默认光影（不额外覆盖）",
        body_preset:
          Object.keys(BODY_PRESETS).find((k) => k.includes("丰满沙漏")) ||
          createDefaultCharacterConfig().body_preset,
      };
      const [item] = generateScenePrompts(ch.id, hwdCfg, "3rd");
      assertZeroNestedColons(item.prompt, `${ch.id} (${gm})`);
      const sp = splitPromptPosAndNeg(item.prompt);
      assert(
        !/-?\d+(?:\.\d+)?::/.test(sp.negPrompt),
        `${ch.id} (${gm}) negPrompt must contain zero w::tag:: weights`
      );
      const negSet = new Set(sp.negPrompt.split(",").map((s) => s.trim().toLowerCase()));

      // Zero cross-bleed with Public Pool swimwear/caustics
      assert(
        !sp.posPrompt.includes("competition swimsuit") && !sp.posPrompt.includes("water caustics"),
        `${ch.id} (${gm}) cross-bled Pool vocabulary into Positive`
      );

      // Subtitle badge check
      const expHwdBadge = ch.id === "HWD15" && gm === "normal" ? "👯家务双裸围百合" : "🏠家务干扰";
      assert(
        item.subTitle.includes(expHwdBadge),
        `${ch.id} (${gm}) subTitle must include ${expHwdBadge} (got: ${item.subTitle})`
      );

      // Selective Garment-Prop Unblocking checks
      assert(
        negSet.has("pleated skirt") && negSet.has("maid headdress"),
        `${ch.id} (${gm}) must enforce core APRON_ONLY_UC garment locks`
      );
      if (expectedUnblockShirtHwd.has(ch.id)) {
        assert(
          !negSet.has("shirt") &&
            !negSet.has("collared shirt") &&
            negSet.has("dressed male") &&
            negSet.has("man wearing suit"),
          `${ch.id} (${gm}) must unblock shirt/collared shirt prop while guarding dressed male/man wearing suit`
        );
      } else {
        assert(
          negSet.has("shirt") && negSet.has("collared shirt"),
          `${ch.id} (${gm}) must keep shirt/collared shirt blocked in APRON_ONLY_UC`
        );
      }
      if (expectedUnblockJacketHwd.has(ch.id)) {
        assert(
          !negSet.has("jacket") &&
            !negSet.has("red jacket") &&
            negSet.has("dressed male") &&
            negSet.has("man wearing suit"),
          `${ch.id} (${gm}) must unblock jacket/red jacket prop while guarding dressed male/man wearing suit`
        );
      } else {
        assert(
          negSet.has("jacket"),
          `${ch.id} (${gm}) must keep jacket blocked in APRON_ONLY_UC`
        );
      }

      // Chest-bib coverage vs. chest-interaction checks
      if (expectedChestCoveredHwd.has(ch.id)) {
        assert(
          sp.posPrompt.includes("intact apron bib covering front chest") &&
            negSet.has("nipples") &&
            negSet.has("areolae"),
          `${ch.id} (${gm}) chest_covered scene must keep intact front bib and block nipples/areolae`
        );
        if (gm === "femboy") {
          assert(
            !sp.posPrompt.includes("tiny pink nipples"),
            `${ch.id} (femboy) chest_covered scene must omit tiny pink nipples to avoid pos/neg conflict`
          );
        }
      } else if (ch.id === "HWD05" || ch.id === "HWD06" || ch.id === "HWD11" || ch.id === "HWD12") {
        assert(
          !negSet.has("nipples"),
          `${ch.id} (${gm}) active chest-interaction scene must not block nipples in Negative`
        );
      }

      // Barefoot & FOOT_ANAT_UC checks
      if (expectedBarefootHwd.has(ch.id)) {
        assert(
          negSet.has("thighhighs") && negSet.has("stockings") && negSet.has("socks"),
          `${ch.id} (${gm}) barefoot scene must block thighhighs/stockings/socks`
        );
        for (const ftTok of footAnatUcTokensForHwd) {
          assert(negSet.has(ftTok), `${ch.id} (${gm}) barefoot scene missing FOOT_ANAT_UC '${ftTok}'`);
        }
      }
      if (ch.id === "HWD09") {
        assert(
          negSet.has("letterboxed") && negSet.has("pillarboxed"),
          "HWD09 missing landscape anti-letterbox UC"
        );
      }

      // Multi-Box vs Single-Box & Gender Mode layout checks
      const isHwdMultiBox = gm !== "normal" || ch.id === "HWD15";
      assert.equal(
        sp.posPrompt.startsWith("[Base Prompt]"),
        isHwdMultiBox,
        `${ch.id} (${gm}) Multi-Box routing mismatch`
      );
      if (gm === "femboy") {
        const posWithoutNegWeights = sp.posPrompt.replace(/-\d+(?:\.\d+)?::[\s\S]*?::/g, "");
        assert(
          sp.posPrompt.includes("2boys, 1.55::yaoi::") &&
            sp.posPrompt.includes("1.45::1boy::, 1.55::otoko no ko::") &&
            sp.posPrompt.includes("target#anal") &&
            sp.posPrompt.includes("source#anal") &&
            sp.posPrompt.includes("-2.5::breasts, pussy, female::") &&
            !/\bpussy\b|\bvaginal\b|\bbare breasts\b/i.test(posWithoutNegWeights),
          `${ch.id} (femboy) must compile Multi-Box 2boys layout with zero female anatomy leaks`
        );
      } else if (ch.id === "HWD15" && gm === "normal") {
        assert(
          sp.posPrompt.includes("2girls, 1.55::yuri::") &&
            sp.posPrompt.includes("pastel-blue frilly apron") &&
            sp.posPrompt.includes("short periwinkle hair") &&
            sp.posPrompt.includes("1.5::scissoring::"),
          "HWD15 (normal) must compile contrast-hair/apron 2girls Yuri Multi-Box"
        );
      } else if (gm.startsWith("futa_")) {
        assert(
          sp.posPrompt.includes("1.6::futanari::") &&
            /1\.45?::small penis::/.test(sp.posPrompt) &&
            sp.posPrompt.includes("0.25::artist:pija (pianiishimo)::") &&
            sp.posPrompt.includes("target#vaginal") &&
            sp.posPrompt.includes("source#vaginal"),
          `${ch.id} (${gm}) must compile Multi-Box Male-on-Futa layout with Style #6 pija tweak`
        );
      } else {
        assert(
          sp.posPrompt.includes("1girl, 1boy, hetero, faceless male"),
          `${ch.id} (normal) must compile single-box 1girl+1boy hetero housework duo`
        );
      }

      const tok = countSeparatedT5Tokens({
        posPrompt: sp.posPrompt,
        sceneNegPrompt: sp.negPrompt,
        ucPresetMode: "heavy",
        appendQuality: true,
      });
      const maxExpectedHwdPos = isHwdMultiBox ? 490 : 500;
      assert(
        tok.posTokens <= maxExpectedHwdPos && tok.negTokens <= 512,
        `${ch.id} (${gm}) exceeded Housework T5 budget (${maxExpectedHwdPos}): pos=${tok.posTokens}, neg=${tok.negTokens}`
      );
      if (tok.posTokens > maxHouseworkPosTokens) maxHouseworkPosTokens = tok.posTokens;
      if (isHwdMultiBox && tok.posTokens > maxHouseworkMultiBoxPosTokens) {
        maxHouseworkMultiBoxPosTokens = tok.posTokens;
      }
      if (tok.negTokens > maxHouseworkNegTokens) maxHouseworkNegTokens = tok.negTokens;
      houseworkVerifiedCount++;
    }
  }

  // Verify non-sunlit Housework scenes (HWD03, HWD08, HWD12, HWD14) strip outdoor sun/daylight/sky tags across ALL non-explicit presets
  for (const hNoSunId of ["HWD03", "HWD08", "HWD12", "HWD14"] as const) {
    const firstHwdAnchor = OTHER_ACTION_TEMPLATES[hNoSunId].light_tags.split(",")[0].trim();
    for (const lKey of nonExplicitLightKeys) {
      const [hItem] = generateScenePrompts(
        hNoSunId,
        {
          ...createDefaultCharacterConfig(),
          lighting_preset: lKey,
          custom_style_pos:
            "sunlight, dappled sunlight, morning sunlight, afternoon sunlight, sun glare, light rays, daylight, clear blue sky, bright sky",
          style_preset: "自定义画风（使用下方自定义画风框）",
        },
        "3rd"
      );
      const spH = splitPromptPosAndNeg(hItem.prompt);
      assert(
        spH.posPrompt.includes(firstHwdAnchor) &&
          !/\bsunlight\b|\bdappled sunlight\b|\bmorning sunlight\b|\bafternoon sunlight\b|\blight rays\b|\bsun glare\b|\bdaylight\b|\bclear blue sky\b|\bbright sky\b/i.test(
            spH.posPrompt
          ),
        `Non-sunlit Housework scene ${hNoSunId} under '${lKey}' leaked outdoor sun/sky or missed '${firstHwdAnchor}'`
      );
    }
  }

  // Verify HWD01 with other_use_scene_outfit=false + HWD08 femboy condom + X-Ray + transparent_bg + 3-Vibe 400 cap
  const [hwd01Fallback] = generateScenePrompts(
    "HWD01",
    { ...hostileSfCfg, other_use_scene_outfit: false },
    "3rd"
  );
  const spHwd01Fb = splitPromptPosAndNeg(hwd01Fallback.prompt);
  const hwd01FbNeg = new Set(spHwd01Fb.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
  assert(
    !spHwd01Fb.posPrompt.includes("naked apron") &&
      spHwd01Fb.posPrompt.includes("1.5::reverse bunnysuit::") &&
      !hwd01FbNeg.has("collared shirt") &&
      !hwd01FbNeg.has("pleated skirt"),
    "HWD01 with other_use_scene_outfit=false must use left-column outfit without APRON_ONLY_UC"
  );

  const [hwd08FemboyAux] = generateScenePrompts(
    "HWD08",
    {
      ...createDefaultCharacterConfig(),
      gender_mode: "femboy",
      enable_condom: true,
      enable_uterus_xray: true,
      pos_transparent_bg: true,
      pos_token_limit: computeSafePosTokenLimit({ isV45: true, activeVibeCount: 3 }),
    },
    "3rd"
  );
  const spHwd08Aux = splitPromptPosAndNeg(hwd08FemboyAux.prompt);
  const tokHwd08Aux = countSeparatedT5Tokens({
    posPrompt: spHwd08Aux.posPrompt,
    sceneNegPrompt: spHwd08Aux.negPrompt,
    ucPresetMode: "heavy",
    appendQuality: true,
  });
  assert(
    spHwd08Aux.posPrompt.includes("1.5::intestines::, 1.5::cum in ass::") &&
      spHwd08Aux.posPrompt.includes("1.4::condom::") &&
      spHwd08Aux.posPrompt.includes("2.0::transparent background::") &&
      tokHwd08Aux.posTokens <= 400,
    `HWD08 femboy with condom+xray+transparent_bg+3Vibes failed checks (posTokens=${tokHwd08Aux.posTokens})`
  );

  // Verify .agents/skills/nai-housework-distraction/ hygiene (zero code/build vocabulary leaks)
  const houseworkSkillDir = path.resolve(process.cwd(), "../.agents/skills/nai-housework-distraction");
  for (const relDoc of ["SKILL.md"]) {
    const docPath = path.join(houseworkSkillDir, relDoc);
    assert(fs.existsSync(docPath), `Missing housework skill doc: ${docPath}`);
    const docText = fs.readFileSync(docPath, "utf8");
    assert(
      !/storyEngine|engineConstants|otherActionsData|houseworkActionsData|verify_engine|NovelAI_Workbench\.html|vite build|tsc --noEmit|npm --prefix/i.test(
        docText
      ),
      `${relDoc} leaked codebase/build vocabulary`
    );
  }

  // 17.10 Verify 4-Stage Substitute Photo-Over-Face & Post-Coital Belly-Press Series (PS01..PS04 = 16 Prompts), Dynamic Photo Swap, Photo-Safe UC, & Skill Hygiene
  const photoSubChapters = OTHER_ACTION_CHAPTERS.filter((c) => c.id.startsWith("PS"));
  assert.equal(photoSubChapters.length, 4, "Expected 4 Photo-Substitute scenes (PS01..PS04)");
  assert.equal(
    resolveContrastingPhotoPortrait("laffey (azur lane)", "").char_tag,
    "javelin (azur lane)",
    "Laffey supine must pair Javelin portrait photo"
  );
  assert.equal(
    resolveContrastingPhotoPortrait("javelin (azur lane)", "").char_tag,
    "laffey (azur lane)",
    "Javelin supine must dynamically swap portrait photo to Laffey"
  );
  assert.equal(
    resolveContrastingPhotoPortrait("custom_char", "short purple hair").char_tag,
    "laffey (azur lane)",
    "Purple-haired supine character must dynamically swap portrait photo to Laffey"
  );

  const photoGuardUcTokens = PHOTO_SUBSTITUTE_GUARD_UC.split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  let maxPhotoSubPosTokens = 0;
  let maxPs02MultiBoxTokens = 0;
  let maxPhotoSubNegTokens = 0;
  let photoSubVerifiedCount = 0;

  for (const ch of photoSubChapters) {
    const tpl = OTHER_ACTION_TEMPLATES[ch.id];
    assert(tpl && tpl.is_photo_substitute_scene, `Missing or unmarked Photo-Substitute template ${ch.id}`);
    assert.equal(Boolean(tpl.is_multibox_photo_anchor), ch.id === "PS02", `${ch.id} multibox flag mismatch`);
    assert.equal(Boolean(tpl.is_aftersex_belly_press), ch.id === "PS04", `${ch.id} belly-press flag mismatch`);

    for (const gm of ["normal", "femboy", "futa_no_balls", "futa_with_balls"] as const) {
      const psCfg = {
        ...createDefaultCharacterConfig(),
        extra_char_tags: "long white hair, red eyes",
        expr_heart_eyes: true,
        gender_mode: gm,
        style_preset: gm.startsWith("futa_") ? style6FutaKey : style6Key,
        lighting_preset: "🔄 随画风与本幕默认光影（不额外覆盖）",
        body_preset:
          Object.keys(BODY_PRESETS).find((k) => k.includes("丰满沙漏")) ||
          createDefaultCharacterConfig().body_preset,
      };
      const [item] = generateScenePrompts(ch.id, psCfg, "3rd");
      assertZeroNestedColons(item.prompt, `${ch.id} (${gm})`);
      const sp = splitPromptPosAndNeg(item.prompt);
      assert(
        !/-?\d+(?:\.\d+)?::/.test(sp.negPrompt),
        `${ch.id} (${gm}) negPrompt must contain zero w::tag:: weights`
      );
      const negSet = new Set(sp.negPrompt.split(",").map((s) => s.trim().toLowerCase()));

      // Critical Rule 1 (#70 §3.1): NEVER put bare `2girls` in Negative UC
      assert(
        !negSet.has("2girls"),
        `${ch.id} (${gm}) must NEVER place bare '2girls' in Negative UC`
      );
      for (const pgTok of photoGuardUcTokens) {
        assert(
          negSet.has(pgTok),
          `${ch.id} (${gm}) missing PHOTO_SUBSTITUTE_GUARD_UC token '${pgTok}'`
        );
      }

      // Critical Rule 2 (#70 §3.2): Default Laffey supine pairs Javelin photo & strips supine eye tags
      const posWithoutNegWeights = sp.posPrompt.replace(/-\d+(?:\.\d+)?::[\s\S]*?::/g, "");
      assert(
        item.subTitle.includes("📸替身盖照·标枪笑颜照") &&
          posWithoutNegWeights.includes("javelin (azur lane)") &&
          posWithoutNegWeights.includes("purple hair") &&
          posWithoutNegWeights.includes("bright green eyes") &&
          !/\bred eyes\b|\bgradient eyes\b|\bheart-shaped pupils\b/i.test(posWithoutNegWeights),
        `${ch.id} (${gm}) failed default Javelin photo pairing or leaked supine Laffey eye/pupil tags through photo`
      );

      // Stage-specific checks (PS01/02/03/04)
      if (ch.id === "PS02") {
        assert(
          sp.posPrompt.startsWith("[Base Prompt]") &&
            sp.posPrompt.includes("[Character 1 (C3)]") &&
            sp.posPrompt.includes("[Character 2 (C2)]") &&
            sp.posPrompt.includes("1.75::photograph::") &&
            sp.posPrompt.includes("head and neck portrait photo only"),
          `PS02 (${gm}) must compile Multi-Box [C3 Body + C2 Photo] coordinate anchor`
        );
      } else {
        assert(
          !sp.posPrompt.startsWith("[Base Prompt]"),
          `${ch.id} (${gm}) must compile Single-Box T5 spatial containment layout`
        );
      }

      if (ch.id === "PS03") {
        assert(
          sp.posPrompt.includes("unbuttoned open white ruffled bodice") &&
            sp.posPrompt.includes("1.5::tears::") &&
            !negSet.has("nipples"),
          `PS03 (${gm}) must render unbuttoned bodice & tears without blocking nipples`
        );
      } else {
        assert(
          negSet.has("nipples") && negSet.has("areolae"),
          `${ch.id} (${gm}) covered-bodice stage must block nipples/areolae`
        );
      }

      // Critical Rule 3 (#70 §3.3): PS04 Continuous Arm Guard (NEVER `male torso` in UC!)
      if (ch.id === "PS04") {
        assert(
          !negSet.has("male torso") &&
            negSet.has("floating arm") &&
            negSet.has("detached arm") &&
            negSet.has("severed arm") &&
            negSet.has("penetration") &&
            sp.posPrompt.includes("1.65::after sex::") &&
            sp.posPrompt.includes("1.65::bare stomach::") &&
            sp.posPrompt.includes("1.65::pov hands::") &&
            sp.posPrompt.includes("continuous tanned male arm"),
          `PS04 (${gm}) failed continuous bottom-border arm or post-coital belly-press guards`
        );
        if (gm === "normal") {
          assert(
            negSet.has("penis") && negSet.has("testicles"),
            "PS04 (normal) must block penis/testicles during post-coital belly press"
          );
        }
      }

      if (gm === "femboy") {
        assert(
          sp.posPrompt.includes("otoko no ko") &&
            sp.posPrompt.includes("flat chest") &&
            !/\bpussy\b|\bvaginal\b|\bbare breasts\b/i.test(posWithoutNegWeights),
          `${ch.id} (femboy) leaked female anatomy into Positive`
        );
      } else if (gm.startsWith("futa_")) {
        assert(
          sp.posPrompt.includes("0.25::artist:pija (pianiishimo)::") &&
            /1\.45?::small penis::/.test(posWithoutNegWeights),
          `${ch.id} (${gm}) must include Style #6 Futa pija tweak and small penis anchor`
        );
      }

      const tok = countSeparatedT5Tokens({
        posPrompt: sp.posPrompt,
        sceneNegPrompt: sp.negPrompt,
        ucPresetMode: "heavy",
        appendQuality: true,
      });
      const maxExpectedPsPos = ch.id === "PS02" ? 490 : 500;
      assert(
        tok.posTokens <= maxExpectedPsPos && tok.negTokens <= 512,
        `${ch.id} (${gm}) exceeded Photo-Substitute T5 budget (${maxExpectedPsPos}): pos=${tok.posTokens}, neg=${tok.negTokens}`
      );
      if (tok.posTokens > maxPhotoSubPosTokens) maxPhotoSubPosTokens = tok.posTokens;
      if (ch.id === "PS02" && tok.posTokens > maxPs02MultiBoxTokens) {
        maxPs02MultiBoxTokens = tok.posTokens;
      }
      if (tok.negTokens > maxPhotoSubNegTokens) maxPhotoSubNegTokens = tok.negTokens;
      photoSubVerifiedCount++;
    }

    // Dynamic Photo-Swap Anti-Collision Check when Supine Character IS Javelin!
    const [javItem] = generateScenePrompts(
      ch.id,
      {
        ...createDefaultCharacterConfig(),
        preset_name: "标枪 Javelin（碧蓝航线）",
        char_tag: "javelin (azur lane)",
        eng_name: "Javelin",
        extra_char_tags: "short purple hair, bright green eyes",
      },
      "3rd"
    );
    const spJav = splitPromptPosAndNeg(javItem.prompt);
    const javPosNoNegW = spJav.posPrompt.replace(/-\d+(?:\.\d+)?::[\s\S]*?::/g, "");
    assert(
      javItem.subTitle.includes("📸替身盖照·拉菲笑颜照") &&
        javPosNoNegW.includes("javelin (azur lane)") &&
        javPosNoNegW.includes("laffey (azur lane)") &&
        javPosNoNegW.includes("white rabbit-ear hairband") &&
        !/\bbright green eyes\b/i.test(javPosNoNegW),
      `${ch.id} with Javelin supine failed to swap photo portrait to Laffey or leaked Javelin's green eyes`
    );
  }

  // Verify PS01 with other_use_scene_outfit=false + PS04 condom + femboy X-Ray + transparent_bg + 3-Vibe 400 cap
  const [ps01Fallback] = generateScenePrompts(
    "PS01",
    { ...hostileSfCfg, other_use_scene_outfit: false },
    "3rd"
  );
  const spPs01Fb = splitPromptPosAndNeg(ps01Fallback.prompt);
  const ps01FbNeg = new Set(spPs01Fb.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
  assert(
    !spPs01Fb.posPrompt.includes("cold-shoulder maid dress") &&
      spPs01Fb.posPrompt.includes("1.5::reverse bunnysuit::") &&
      !ps01FbNeg.has("2girls"),
    "PS01 with other_use_scene_outfit=false must use left-column outfit while keeping photo-safe UC"
  );

  const [ps04FemboyAux] = generateScenePrompts(
    "PS04",
    {
      ...createDefaultCharacterConfig(),
      gender_mode: "femboy",
      enable_condom: true,
      enable_uterus_xray: true,
      pos_transparent_bg: true,
      pos_token_limit: computeSafePosTokenLimit({ isV45: true, activeVibeCount: 3 }),
    },
    "3rd"
  );
  const spPs04Aux = splitPromptPosAndNeg(ps04FemboyAux.prompt);
  const ps04AuxNeg = new Set(spPs04Aux.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
  const tokPs04Aux = countSeparatedT5Tokens({
    posPrompt: spPs04Aux.posPrompt,
    sceneNegPrompt: spPs04Aux.negPrompt,
    ucPresetMode: "heavy",
    appendQuality: true,
  });
  assert(
    spPs04Aux.posPrompt.includes("1.5::intestines::") &&
      spPs04Aux.posPrompt.includes("cum in ass") &&
      spPs04Aux.posPrompt.includes("1.65::used condom::") &&
      ps04AuxNeg.has("condom on penis") &&
      !ps04AuxNeg.has("2girls") &&
      !ps04AuxNeg.has("male torso") &&
      spPs04Aux.posPrompt.includes("2.0::transparent background::") &&
      tokPs04Aux.posTokens <= 400,
    `PS04 femboy with condom+xray+transparent_bg+3Vibes failed checks (posTokens=${tokPs04Aux.posTokens})`
  );

  // Verify .agents/skills/nai-photo-substitute/ hygiene (zero code/build vocabulary leaks)
  const photoSubSkillDir = path.resolve(process.cwd(), "../.agents/skills/nai-photo-substitute");
  for (const relDoc of ["SKILL.md"]) {
    const docPath = path.join(photoSubSkillDir, relDoc);
    assert(fs.existsSync(docPath), `Missing photo-substitute skill doc: ${docPath}`);
    const docText = fs.readFileSync(docPath, "utf8");
    assert(
      !/storyEngine|engineConstants|otherActionsData|photoSubstituteActionsData|verify_engine|NovelAI_Workbench\.html|vite build|tsc --noEmit|npm --prefix/i.test(
        docText
      ),
      `${relDoc} leaked codebase/build vocabulary`
    );
  }

  // 17.11 Verify 12 Outdoor Camping & Woodland Picnic Scenes (CP01..CP12 = 48 Prompts), 5 Camping Light Modes, Chest-Coverage & Barefoot Hygiene, & Skill Hygiene
  const campingChapters = OTHER_ACTION_CHAPTERS.filter((c) => c.id.startsWith("CP"));
  assert.equal(campingChapters.length, 12, "Expected 12 Outdoor Camping scenes (CP01..CP12)");
  const expectedChestCoveredCp = new Set([
    "CP01",
    "CP02",
    "CP03",
    "CP04",
    "CP06",
    "CP08",
    "CP09",
    "CP10",
    "CP12",
  ]);
  const expectedBarefootCp = new Set(["CP04", "CP10", "CP11"]);
  const footAnatUcTokensForCp = FOOT_ANAT_UC.split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const campingBarefootBanTokens = CAMPING_BAREFOOT_BAN_UC.split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  let maxCampingPosTokens = 0;
  let maxCampingMultiBoxPosTokens = 0;
  let maxCampingNegTokens = 0;
  let campingVerifiedCount = 0;

  for (const ch of campingChapters) {
    const tpl = OTHER_ACTION_TEMPLATES[ch.id];
    assert(tpl && tpl.is_camping_scene && tpl.is_camping_duo, `Missing or unmarked Camping template ${ch.id}`);
    assert(
      tpl.camping_light_mode && tpl.camping_light_mode in CAMPING_LIGHT_DEFAULTS,
      `${ch.id} must declare a valid camping_light_mode`
    );
    assert.equal(Boolean(tpl.chest_covered), expectedChestCoveredCp.has(ch.id), `${ch.id} chest_covered mismatch`);
    assert.equal(Boolean(tpl.barefoot), expectedBarefootCp.has(ch.id), `${ch.id} barefoot mismatch`);
    assert.equal(Boolean(tpl.is_inside_tent), ch.id === "CP07", `${ch.id} is_inside_tent mismatch`);

    for (const gm of ["normal", "femboy", "futa_no_balls", "futa_with_balls"] as const) {
      const cpCfg = {
        ...createDefaultCharacterConfig(),
        gender_mode: gm,
        style_preset: gm.startsWith("futa_") ? style6FutaKey : style6Key,
        lighting_preset: "🔄 随画风与本幕默认光影（不额外覆盖）",
        body_preset:
          Object.keys(BODY_PRESETS).find((k) => k.includes("丰满沙漏")) ||
          createDefaultCharacterConfig().body_preset,
      };
      const [item] = generateScenePrompts(ch.id, cpCfg, "3rd");
      assertZeroNestedColons(item.prompt, `${ch.id} (${gm})`);
      const sp = splitPromptPosAndNeg(item.prompt);
      assert(
        !/-?\d+(?:\.\d+)?::/.test(sp.negPrompt),
        `${ch.id} (${gm}) negPrompt must contain zero w::tag:: weights`
      );
      const negSet = new Set(sp.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
      const posWithoutNegWeights = sp.posPrompt.replace(/-\d+(?:\.\d+)?::[\s\S]*?::/g, "");

      // Zero cross-bleed with Naked-Apron or Public Pool vocabulary
      assert(
        !sp.posPrompt.includes("naked apron") && !sp.posPrompt.includes("competition swimsuit"),
        `${ch.id} (${gm}) cross-bled Kitchen or Pool outfit tags into Positive`
      );

      // Subtitle badge check
      const expCpBadge = ch.id === "CP12" && gm === "normal" ? "👯花甸野餐百合" : "⛺露营野餐";
      assert(
        item.subTitle.includes(expCpBadge),
        `${ch.id} (${gm}) subTitle must include ${expCpBadge} (got: ${item.subTitle})`
      );

      // Outdoor indoors-guard check (all except CP07 inside tent)
      if (ch.id !== "CP07") {
        assert(
          negSet.has("indoors") && !/\bindoors\b/i.test(posWithoutNegWeights),
          `${ch.id} (${gm}) outdoor camping scene must block 'indoors' and never leak 'indoors' into Positive`
        );
      }

      // Chest-coverage vs. bare-chest interaction discipline
      if (expectedChestCoveredCp.has(ch.id)) {
        assert(
          negSet.has("nipples") && negSet.has("areolae"),
          `${ch.id} (${gm}) chest_covered scene must block nipples/areolae in Negative`
        );
        if (gm === "femboy") {
          assert(
            !posWithoutNegWeights.includes("tiny pink nipples"),
            `${ch.id} (femboy) chest_covered scene must omit tiny pink nipples`
          );
        }
      } else {
        assert(
          !negSet.has("nipples"),
          `${ch.id} (${gm}) bare-chest camp scene must not block nipples in Negative`
        );
      }

      // Barefoot & FOOT_ANAT_UC checks (CP04, CP10, CP11)
      if (expectedBarefootCp.has(ch.id)) {
        for (const banTok of campingBarefootBanTokens) {
          assert(
            negSet.has(banTok),
            `${ch.id} (${gm}) barefoot camp scene missing CAMPING_BAREFOOT_BAN_UC '${banTok}'`
          );
        }
        for (const ftTok of footAnatUcTokensForCp) {
          assert(
            negSet.has(ftTok),
            `${ch.id} (${gm}) barefoot camp scene missing FOOT_ANAT_UC '${ftTok}'`
          );
        }
      }

      // Landscape CP06 & Nocturnal CP07/CP08/CP09 UC locks
      if (ch.id === "CP06") {
        assert(
          negSet.has("letterboxed") && negSet.has("pillarboxed"),
          `CP06 (${gm}) missing landscape anti-letterbox UC`
        );
      } else if (ch.id === "CP07") {
        assert(
          negSet.has("daylight") && negSet.has("bright sun"),
          `CP07 (${gm}) missing lantern-tent nocturnal UC`
        );
      } else if (ch.id === "CP08") {
        assert(
          negSet.has("daylight") && negSet.has("indoors") && negSet.has("fireplace"),
          `CP08 (${gm}) missing campfire nocturnal UC`
        );
      } else if (ch.id === "CP09") {
        assert(
          negSet.has("daylight") && negSet.has("indoors") && negSet.has("steering wheel"),
          `CP09 (${gm}) missing starry tailgate nocturnal UC`
        );
      }

      // Multi-Box vs Single-Box & 4-Mode Gender Isolation checks
      const isCpMultiBox = gm !== "normal" || ch.id === "CP12";
      assert.equal(
        sp.posPrompt.startsWith("[Base Prompt]"),
        isCpMultiBox,
        `${ch.id} (${gm}) Multi-Box routing mismatch`
      );
      if (gm === "femboy") {
        assert(
          sp.posPrompt.includes("2boys, 1.55::yaoi::") &&
            sp.posPrompt.includes("1.45::1boy::, 1.55::otoko no ko::") &&
            sp.posPrompt.includes("target#anal") &&
            sp.posPrompt.includes("source#anal") &&
            sp.posPrompt.includes("-2.5::breasts, pussy, female::") &&
            !/\bpussy\b|\bvaginal\b|\bbare breasts\b/i.test(posWithoutNegWeights),
          `${ch.id} (femboy) must compile Multi-Box 2boys layout with zero female anatomy leaks`
        );
      } else if (ch.id === "CP12" && gm === "normal") {
        assert(
          sp.posPrompt.includes("2girls, 1.55::yuri::") &&
            sp.posPrompt.includes("pastel-yellow summer sundress") &&
            sp.posPrompt.includes("short periwinkle hair") &&
            sp.posPrompt.includes("target#fingering") &&
            sp.posPrompt.includes("source#fingering"),
          "CP12 (normal) must compile contrast-sundress/hair 2girls Yuri Multi-Box"
        );
      } else if (gm.startsWith("futa_")) {
        assert(
          sp.posPrompt.includes("1.6::futanari::") &&
            /1\.45?::small penis::/.test(sp.posPrompt) &&
            sp.posPrompt.includes("0.25::artist:pija (pianiishimo)::") &&
            sp.posPrompt.includes("target#vaginal") &&
            sp.posPrompt.includes("source#vaginal"),
          `${ch.id} (${gm}) must compile Multi-Box Male-on-Futa layout with Style #6 pija tweak`
        );
      } else {
        assert(
          sp.posPrompt.includes("1girl, 1boy, hetero, faceless male"),
          `${ch.id} (normal) must compile single-box 1girl+1boy hetero camping duo`
        );
      }

      const tok = countSeparatedT5Tokens({
        posPrompt: sp.posPrompt,
        sceneNegPrompt: sp.negPrompt,
        ucPresetMode: "heavy",
        appendQuality: true,
      });
      const maxExpectedCpPos = isCpMultiBox ? 490 : 500;
      assert(
        tok.posTokens <= maxExpectedCpPos && tok.negTokens <= 512,
        `${ch.id} (${gm}) exceeded Camping T5 budget (${maxExpectedCpPos}): pos=${tok.posTokens}, neg=${tok.negTokens}`
      );
      if (tok.posTokens > maxCampingPosTokens) maxCampingPosTokens = tok.posTokens;
      if (isCpMultiBox && tok.posTokens > maxCampingMultiBoxPosTokens) {
        maxCampingMultiBoxPosTokens = tok.posTokens;
      }
      if (tok.negTokens > maxCampingNegTokens) maxCampingNegTokens = tok.negTokens;
      campingVerifiedCount++;
    }
  }

  // Verify nocturnal Camping scenes (CP07, CP08, CP09) strip outdoor sun/daylight/sky tags across ALL non-explicit presets (and CP08 strips backlighting)
  for (const cpNoctId of ["CP07", "CP08", "CP09"] as const) {
    const firstCpAnchor = OTHER_ACTION_TEMPLATES[cpNoctId].light_tags.split(",")[0].trim();
    for (const lKey of nonExplicitLightKeys) {
      const [cpItem] = generateScenePrompts(
        cpNoctId,
        {
          ...createDefaultCharacterConfig(),
          lighting_preset: lKey,
          custom_style_pos:
            "backlighting, sunlight, dappled sunlight, morning sunlight, afternoon sunlight, sun glare, light rays, daylight, clear blue sky, bright sky",
          style_preset: "自定义画风（使用下方自定义画风框）",
        },
        "3rd"
      );
      const spCp = splitPromptPosAndNeg(cpItem.prompt);
      assert(
        spCp.posPrompt.includes(firstCpAnchor) &&
          !/\bsunlight\b|\bdappled sunlight\b|\bmorning sunlight\b|\bafternoon sunlight\b|\blight rays\b|\bsun glare\b|\bdaylight\b|\bclear blue sky\b|\bbright sky\b/i.test(
            spCp.posPrompt
          ),
        `Nocturnal Camping scene ${cpNoctId} under '${lKey}' leaked outdoor sun/sky or missed '${firstCpAnchor}'`
      );
      if (cpNoctId === "CP08") {
        assert(
          !/\bbacklighting\b/i.test(spCp.posPrompt),
          `Campfire scene CP08 under '${lKey}' must strip backlighting so warm orange firelight dominates`
        );
      }
    }
  }

  // Verify CP01 with other_use_scene_outfit=false + CP04 femboy condom + X-Ray + transparent_bg + 3-Vibe 400 cap
  const [cp01Fallback] = generateScenePrompts(
    "CP01",
    { ...hostileSfCfg, other_use_scene_outfit: false },
    "3rd"
  );
  const spCp01Fb = splitPromptPosAndNeg(cp01Fallback.prompt);
  const cp01FbNeg = new Set(spCp01Fb.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
  assert(
    !spCp01Fb.posPrompt.includes("white eyelet sundress") &&
      spCp01Fb.posPrompt.includes("1.5::reverse bunnysuit::") &&
      !cp01FbNeg.has("areolae"),
    "CP01 with other_use_scene_outfit=false must use left-column outfit without scene sundress/chest_covered UC"
  );

  const [cp04FemboyAux] = generateScenePrompts(
    "CP04",
    {
      ...createDefaultCharacterConfig(),
      gender_mode: "femboy",
      enable_condom: true,
      enable_uterus_xray: true,
      pos_transparent_bg: true,
      pos_token_limit: computeSafePosTokenLimit({ isV45: true, activeVibeCount: 3 }),
    },
    "3rd"
  );
  const spCp04Aux = splitPromptPosAndNeg(cp04FemboyAux.prompt);
  const tokCp04Aux = countSeparatedT5Tokens({
    posPrompt: spCp04Aux.posPrompt,
    sceneNegPrompt: spCp04Aux.negPrompt,
    ucPresetMode: "heavy",
    appendQuality: true,
  });
  assert(
    spCp04Aux.posPrompt.includes("1.5::intestines::") &&
      spCp04Aux.posPrompt.includes("cum in ass") &&
      spCp04Aux.posPrompt.includes("1.4::condom::") &&
      spCp04Aux.posPrompt.includes("2.0::transparent background::") &&
      tokCp04Aux.posTokens <= 400,
    `CP04 femboy with condom+xray+transparent_bg+3Vibes failed checks (posTokens=${tokCp04Aux.posTokens})`
  );

  // Verify .agents/skills/nai-camping-picnic/ hygiene (zero code/build vocabulary leaks)
  const campingSkillDir = path.resolve(process.cwd(), "../.agents/skills/nai-camping-picnic");
  for (const relDoc of ["SKILL.md"]) {
    const docPath = path.join(campingSkillDir, relDoc);
    assert(fs.existsSync(docPath), `Missing camping skill doc: ${docPath}`);
    const docText = fs.readFileSync(docPath, "utf8");
    assert(
      !/storyEngine|engineConstants|otherActionsData|campingActionsData|verify_engine|NovelAI_Workbench\.html|vite build|tsc --noEmit|npm --prefix/i.test(
        docText
      ),
      `${relDoc} leaked codebase/build vocabulary`
    );
  }

  // 17.12 Verify 15 Solo Post-Coital Everyday Activity Inner-Thigh Drip Scenes (AFD01..AFD15 = 60 Prompts), Two-Tier Stream Guards, Solo Anti-Partner Locks, & Skill Hygiene
  const aftersexDripChapters = OTHER_ACTION_CHAPTERS.filter((c) => c.id.startsWith("AFD"));
  assert.equal(aftersexDripChapters.length, 15, "Expected 15 Aftersex-Drip scenes (AFD01..AFD15)");
  const expectedHeavySpillAfd = new Set(["AFD07", "AFD08", "AFD11"]);
  const expectedBarefootAfd = new Set(["AFD01", "AFD02", "AFD05", "AFD08", "AFD09", "AFD12"]);
  const expectedPhoneAfd = new Set(["AFD06", "AFD12"]);
  const expectedMirrorAfd = new Set(["AFD01", "AFD05", "AFD11"]);
  const expectedOutdoorAfd = new Set(["AFD13", "AFD14"]);
  const afdDressedChestTokens = AFTERSEX_DRIP_DRESSED_CHEST_UC.split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const afdLightStreamTokens = AFTERSEX_DRIP_LIGHT_STREAM_UC.split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const footAnatUcTokensForAfd = FOOT_ANAT_UC.split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const afdBarefootBanTokens = CAMPING_BAREFOOT_BAN_UC.split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  let maxAfdPosTokens = 0;
  let maxAfdNegTokens = 0;
  let afdVerifiedCount = 0;

  for (const ch of aftersexDripChapters) {
    const tpl = OTHER_ACTION_TEMPLATES[ch.id];
    assert(tpl && tpl.is_aftersex_drip_scene, `Missing or unmarked Aftersex-Drip template ${ch.id}`);
    assert(
      tpl.aftersex_drip_light_mode && tpl.aftersex_drip_light_mode in AFTERSEX_DRIP_LIGHT_DEFAULTS,
      `${ch.id} must declare a valid aftersex_drip_light_mode`
    );
    assert.equal(Boolean(tpl.barefoot), expectedBarefootAfd.has(ch.id), `${ch.id} barefoot mismatch`);
    assert.equal(
      Boolean(tpl.light_thigh_only),
      !expectedHeavySpillAfd.has(ch.id),
      `${ch.id} light_thigh_only mismatch`
    );
    assert.equal(Boolean(tpl.no_face_pov), ch.id === "AFD14", `${ch.id} no_face_pov mismatch`);

    for (const gm of ["normal", "femboy", "futa_no_balls", "futa_with_balls"] as const) {
      const afdCfg = {
        ...createDefaultCharacterConfig(),
        extra_char_tags: "long white hair, red eyes",
        gender_mode: gm,
        style_preset: gm.startsWith("futa_") ? style6FutaKey : style6Key,
        lighting_preset: "🔄 随画风与本幕默认光影（不额外覆盖）",
        body_preset:
          Object.keys(BODY_PRESETS).find((k) => k.includes("纤细娇小")) ||
          createDefaultCharacterConfig().body_preset,
      };
      const [item] = generateScenePrompts(ch.id, afdCfg, "3rd");
      assertZeroNestedColons(item.prompt, `${ch.id} (${gm})`);
      const sp = splitPromptPosAndNeg(item.prompt);
      assert(
        !/-?\d+(?:\.\d+)?::/.test(sp.negPrompt),
        `${ch.id} (${gm}) negPrompt must contain zero w::tag:: weights`
      );
      const negSet = new Set(sp.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
      const posWithoutNegWeights = sp.posPrompt.replace(/-\d+(?:\.\d+)?::[\s\S]*?::/g, "");

      // Single-box Solo layout & subtitle badge
      assert(
        !sp.posPrompt.startsWith("[Base Prompt]") && item.subTitle.includes("💧事后滑落"),
        `${ch.id} (${gm}) must compile Single-Box solo layout with 💧事后滑落 badge`
      );

      // Guard 1: Solo Anti-Partner UC Lock (NEVER bare 'sex' in Negative UC!)
      assert(
        !negSet.has("sex") &&
          negSet.has("penetration") &&
          negSet.has("insertion") &&
          negSet.has("hetero"),
        `${ch.id} (${gm}) must block penetration/insertion/hetero without placing bare 'sex' in UC`
      );
      if (gm === "normal") {
        assert(
          sp.posPrompt.includes("1girl, solo") &&
            negSet.has("1boy") &&
            negSet.has("2boys") &&
            negSet.has("penis") &&
            negSet.has("2girls"),
          `${ch.id} (normal) failed solo female anti-partner UC lock`
        );
      } else if (gm === "femboy") {
        assert(
          sp.posPrompt.includes("1.55::1boy::, solo, 1.6::otoko no ko::") &&
            negSet.has("1girl") &&
            negSet.has("2boys") &&
            negSet.has("multiple boys") &&
            !posWithoutNegWeights.includes("tiny pink nipples") &&
            !/\bpussy\b|\bvaginal\b|\bbare breasts\b/i.test(posWithoutNegWeights),
          `${ch.id} (femboy) failed solo otoko no ko isolation or leaked female/nipple tags`
        );
      } else {
        assert(
          sp.posPrompt.includes("1.55::futanari::") &&
            sp.posPrompt.includes("0.25::artist:pija (pianiishimo)::") &&
            /1\.4::small penis::/.test(posWithoutNegWeights) &&
            negSet.has("1boy") &&
            negSet.has("2boys"),
          `${ch.id} (${gm}) failed solo futanari isolation or Style #6 pija tweak`
        );
      }

      // Guard 2: 100% Dressed Upper-Body Chest Coverage & Underwear Ban
      for (const chTok of afdDressedChestTokens) {
        assert(
          negSet.has(chTok),
          `${ch.id} (${gm}) missing AFTERSEX_DRIP_DRESSED_CHEST_UC token '${chTok}'`
        );
      }

      // Guard 3: Two-Tier Fluid Volume & Vertical Gravity Guard
      if (expectedHeavySpillAfd.has(ch.id)) {
        assert(
          sp.posPrompt.includes("1.75::cumdrip::") && !negSet.has("huge puddle"),
          `${ch.id} (${gm}) heavy-spill scene must emit 1.75::cumdrip:: without blocking huge puddle`
        );
      } else {
        for (const stTok of afdLightStreamTokens) {
          assert(
            negSet.has(stTok),
            `${ch.id} (${gm}) Tier-1 vertical-stream scene missing '${stTok}'`
          );
        }
      }

      // Barefoot, Phone, Wall Mirror, Outdoor & AFD14 Pure-Rear Sundress Checks
      if (expectedBarefootAfd.has(ch.id)) {
        for (const ftTok of footAnatUcTokensForAfd) {
          assert(negSet.has(ftTok), `${ch.id} (${gm}) missing FOOT_ANAT_UC '${ftTok}'`);
        }
        for (const banTok of afdBarefootBanTokens) {
          assert(negSet.has(banTok), `${ch.id} (${gm}) missing barefoot ban '${banTok}'`);
        }
      }
      if (expectedPhoneAfd.has(ch.id)) {
        assert(
          !negSet.has("smartphone") && !negSet.has("holding phone"),
          `${ch.id} (${gm}) handheld smartphone prop must not be blocked in UC`
        );
      }
      if (expectedMirrorAfd.has(ch.id)) {
        assert(
          !negSet.has("mirror") && negSet.has("mirror selfie"),
          `${ch.id} (${gm}) wall mirror scene must allow 'mirror' while blocking 'mirror selfie'`
        );
      }
      if (expectedOutdoorAfd.has(ch.id)) {
        assert(
          negSet.has("indoors") && !/\bindoors\b/i.test(posWithoutNegWeights),
          `${ch.id} (${gm}) outdoor scene must block 'indoors' and never leak 'indoors' into Positive`
        );
      }
      if (ch.id === "AFD12") {
        assert(
          negSet.has("letterboxed") && negSet.has("pillarboxed"),
          `AFD12 (${gm}) missing landscape anti-letterbox UC`
        );
      }
      if (ch.id === "AFD14") {
        assert(
          !posWithoutNegWeights.includes("gradient eyes") &&
            !/\bred eyes\b/i.test(posWithoutNegWeights) &&
            !/\bnarrow hips\b/i.test(posWithoutNegWeights) &&
            sp.posPrompt.includes("1.65::white sundress::") &&
            sp.posPrompt.includes("1.8::see-through::") &&
            negSet.has("straw hat") &&
            negSet.has("hat") &&
            negSet.has("t-shirt") &&
            negSet.has("sleeves") &&
            negSet.has("face") &&
            negSet.has("eyes"),
          `AFD14 (${gm}) failed pure-rear classic white sundress face/eye/narrow-hips/hat guards`
        );
        if (gm !== "femboy") {
          assert(
            sp.posPrompt.includes("1.35::plump thighs::"),
            `AFD14 (${gm}) must include 1.35::plump thighs::`
          );
        }
      }

      const tok = countSeparatedT5Tokens({
        posPrompt: sp.posPrompt,
        sceneNegPrompt: sp.negPrompt,
        ucPresetMode: "heavy",
        appendQuality: true,
      });
      assert(
        tok.posTokens <= 500 && tok.negTokens <= 512,
        `${ch.id} (${gm}) exceeded Aftersex-Drip T5 budget: pos=${tok.posTokens}/500, neg=${tok.negTokens}/512`
      );
      if (tok.posTokens > maxAfdPosTokens) maxAfdPosTokens = tok.posTokens;
      if (tok.negTokens > maxAfdNegTokens) maxAfdNegTokens = tok.negTokens;
      afdVerifiedCount++;
    }
  }

  // Verify non-sunlit Aftersex-Drip scenes (AFD02, AFD05, AFD07, AFD08, AFD11) strip outdoor sun/sky tags across ALL lighting presets
  for (const afdNoSunId of ["AFD02", "AFD05", "AFD07", "AFD08", "AFD11"] as const) {
    const firstAfdAnchor = OTHER_ACTION_TEMPLATES[afdNoSunId].light_tags.split(",")[0].trim();
    for (const lKey of Object.keys(LIGHTING_PRESETS)) {
      const [afdItem] = generateScenePrompts(
        afdNoSunId,
        {
          ...createDefaultCharacterConfig(),
          lighting_preset: lKey,
          custom_style_pos:
            "sunlight, dappled sunlight, morning sunlight, afternoon sunlight, sun glare, light rays, daylight, clear blue sky, bright sky",
          style_preset: "自定义画风（使用下方自定义画风框）",
        },
        "3rd"
      );
      const spAfd = splitPromptPosAndNeg(afdItem.prompt);
      assert(
        spAfd.posPrompt.includes(firstAfdAnchor) &&
          !/\bsunlight\b|\bdappled sunlight\b|\bmorning sunlight\b|\bafternoon sunlight\b|\blight rays\b|\bsun glare\b|\bdaylight\b|\bclear blue sky\b|\bbright sky\b/i.test(
            spAfd.posPrompt
          ),
        `Non-sunlit Aftersex-Drip scene ${afdNoSunId} under '${lKey}' leaked outdoor sun/sky or missed '${firstAfdAnchor}'`
      );
    }
  }

  // Verify AFD01 with other_use_scene_outfit=false + AFD08 femboy condom + X-Ray + transparent_bg + 3-Vibe 400 cap
  const [afd01Fallback] = generateScenePrompts(
    "AFD01",
    { ...hostileSfCfg, other_use_scene_outfit: false },
    "3rd"
  );
  const spAfd01Fb = splitPromptPosAndNeg(afd01Fallback.prompt);
  const afd01FbNeg = new Set(spAfd01Fb.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
  assert(
    !spAfd01Fb.posPrompt.includes("collared shirt") &&
      spAfd01Fb.posPrompt.includes("1.5::reverse bunnysuit::") &&
      !afd01FbNeg.has("areolae"),
    "AFD01 with other_use_scene_outfit=false must use left-column outfit without AFTERSEX_DRIP_DRESSED_CHEST_UC"
  );

  const [afd08FemboyAux] = generateScenePrompts(
    "AFD08",
    {
      ...createDefaultCharacterConfig(),
      gender_mode: "femboy",
      enable_condom: true,
      enable_uterus_xray: true,
      pos_transparent_bg: true,
      pos_token_limit: computeSafePosTokenLimit({ isV45: true, activeVibeCount: 3 }),
    },
    "3rd"
  );
  const spAfd08Aux = splitPromptPosAndNeg(afd08FemboyAux.prompt);
  const tokAfd08Aux = countSeparatedT5Tokens({
    posPrompt: spAfd08Aux.posPrompt,
    sceneNegPrompt: spAfd08Aux.negPrompt,
    ucPresetMode: "heavy",
    appendQuality: true,
  });
  assert(
    spAfd08Aux.posPrompt.includes("1.5::intestines::") &&
      spAfd08Aux.posPrompt.includes("cum in ass") &&
      spAfd08Aux.posPrompt.includes("1.55::used condom::") &&
      spAfd08Aux.posPrompt.includes("2.0::transparent background::") &&
      tokAfd08Aux.posTokens <= 400,
    `AFD08 femboy with condom+xray+transparent_bg+3Vibes failed checks (posTokens=${tokAfd08Aux.posTokens})`
  );

  // Verify .agents/skills/nai-aftersex-drip/ hygiene (zero code/build vocabulary leaks)
  const afdSkillDir = path.resolve(process.cwd(), "../.agents/skills/nai-aftersex-drip");
  for (const relDoc of ["SKILL.md"]) {
    const docPath = path.join(afdSkillDir, relDoc);
    assert(fs.existsSync(docPath), `Missing aftersex-drip skill doc: ${docPath}`);
    const docText = fs.readFileSync(docPath, "utf8");
    assert(
      !/storyEngine|engineConstants|otherActionsData|aftersexDripActionsData|verify_engine|NovelAI_Workbench\.html|vite build|tsc --noEmit|npm --prefix/i.test(
        docText
      ),
      `${relDoc} leaked codebase/build vocabulary`
    );
  }

  // 17.13 Verify 55 Japanese Hot-Spring Onsen & Ryokan Yukata Scenes (ONS01..ONS55 = 220 Prompts: 32 Duo + 23 Solo), 5 Scene-Bound Onsen Light Modes, Chest/Footwear/Mirror Guards, & Skill Hygiene
  for (const [lKey, lEntry] of Object.entries(LIGHTING_PRESETS)) {
    assert(
      !/温泉专属/.test(lKey) && !/^onsen_/i.test(lEntry.code),
      `Onsen lighting must stay 100% scene-bound and NOT appear in global LIGHTING_PRESETS: ${lKey}`
    );
  }
  const onsenChapters = OTHER_ACTION_CHAPTERS.filter((c) => c.id.startsWith("ONS"));
  assert.equal(onsenChapters.length, 55, "Expected 55 Onsen & Yukata scenes (ONS01..ONS55)");
  const expectedExposedChestOns = new Set([
    "ONS03",
    "ONS06",
    "ONS16",
    "ONS17",
    "ONS20",
    "ONS33",
    "ONS35",
    "ONS36",
  ]);
  const expectedSlipperOrGetaOns = new Set(["ONS09", "ONS14", "ONS31", "ONS32", "ONS42", "ONS55"]);
  const expectedLightStreamOns = new Set(["ONS11", "ONS12", "ONS14"]);
  const expectedMirrorOns = new Set(["ONS04", "ONS11", "ONS53"]);
  const footAnatUcTokensForOns = FOOT_ANAT_UC.split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const onsenBarefootBanTokens = ONSEN_BAREFOOT_BAN_UC.split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  let maxOnsenPosTokens = 0;
  let maxOnsenMultiBoxPosTokens = 0;
  let maxOnsenNegTokens = 0;
  let onsenVerifiedCount = 0;

  for (const ch of onsenChapters) {
    const tpl = OTHER_ACTION_TEMPLATES[ch.id];
    assert(tpl && tpl.is_onsen_scene, `Missing or unmarked Onsen template ${ch.id}`);
    assert(
      tpl.onsen_light_mode && tpl.onsen_light_mode in ONSEN_LIGHT_DEFAULTS,
      `${ch.id} must declare a valid onsen_light_mode`
    );
    assert.equal(
      Boolean(tpl.chest_covered),
      !expectedExposedChestOns.has(ch.id),
      `${ch.id} chest_covered mismatch`
    );
    assert.equal(
      Boolean(tpl.light_thigh_only),
      expectedLightStreamOns.has(ch.id),
      `${ch.id} light_thigh_only mismatch`
    );
    assert.equal(
      Boolean(tpl.allow_wall_mirror),
      expectedMirrorOns.has(ch.id),
      `${ch.id} allow_wall_mirror mismatch`
    );

    const isDuo = Boolean(tpl.is_onsen_duo);
    const lightSpec = ONSEN_LIGHT_DEFAULTS[tpl.onsen_light_mode];
    const lightSpecAnchors = lightSpec.pos
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const gm of ["normal", "femboy", "futa_no_balls", "futa_with_balls"] as const) {
      const onsCfg = {
        ...createDefaultCharacterConfig(),
        gender_mode: gm,
        style_preset: gm.startsWith("futa_") ? style6FutaKey : style6Key,
        lighting_preset: "🔄 随画风与本幕默认光影（不额外覆盖）",
        body_preset:
          Object.keys(BODY_PRESETS).find((k) => k.includes("纤细娇小")) ||
          createDefaultCharacterConfig().body_preset,
      };
      const [item] = generateScenePrompts(ch.id, onsCfg, "3rd");
      assertZeroNestedColons(item.prompt, `${ch.id} (${gm})`);
      const sp = splitPromptPosAndNeg(item.prompt);
      assert(
        !/-?\d+(?:\.\d+)?::/.test(sp.negPrompt),
        `${ch.id} (${gm}) negPrompt must contain zero w::tag:: weights`
      );
      const negSet = new Set(sp.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
      const posWithoutNegWeights = sp.posPrompt.replace(/-\d+(?:\.\d+)?::[\s\S]*?::/g, "");

      // Scene-bound ONSEN_LIGHT_DEFAULTS check
      assert(
        lightSpecAnchors.some((anc) => sp.posPrompt.includes(anc)),
        `${ch.id} (${gm}) failed to inject scene-bound ONSEN_LIGHT_DEFAULTS anchor from '${lightSpec.pos}'`
      );

      // Outdoor indoors-stripping check
      if (tpl.is_outdoor_onsen) {
        assert(
          negSet.has("indoors") && !/\bindoors\b/i.test(posWithoutNegWeights),
          `${ch.id} (${gm}) outdoor Onsen scene must block 'indoors' and never leak 'indoors' into Positive`
        );
      }

      // Chest-coverage vs. 8 exposed-chest scenes check
      if (tpl.chest_covered) {
        assert(
          negSet.has("nipples") && negSet.has("areolae") && negSet.has("bare breasts"),
          `${ch.id} (${gm}) chest_covered Onsen scene must block nipples/areolae/bare breasts`
        );
        if (gm === "femboy") {
          assert(
            !posWithoutNegWeights.includes("tiny pink nipples"),
            `${ch.id} (femboy) chest_covered Onsen scene must omit tiny pink nipples`
          );
        }
      } else {
        assert(
          !negSet.has("nipples") &&
            !/\b(?:covering (?:her|his|front) (?:flat )?chest|closed (?:neatly )?over (?:her|his|front) (?:flat )?chest|intact modest collar)\b/i.test(
              posWithoutNegWeights
            ),
          `${ch.id} (${gm}) exposed-chest Onsen scene must not block nipples or claim chest is covered`
        );
      }
      if (gm === "femboy") {
        assert(
          !/\b(?:1girl|2girls|girls?|woman|women|female|breasts?|sideboob|underboob|cleavage|pussy|vulva|labia|vaginal|cervix|uterus|futanari|she|her|hers)\b/i.test(
            posWithoutNegWeights
          ),
          `${ch.id} (femboy) leaked female anatomy or pronoun into Positive/Prose`
        );
      }
      const expectedOnsWeighted = Array.from(
        `${tpl.framing_tags}, ${tpl.env_tags}, ${tpl.core_prop_tags || ""}, ${
          gm === "femboy" ? tpl.femboy_tags : gm.startsWith("futa_") ? tpl.futa_tags : tpl.female_tags
        }`.matchAll(/\d+(?:\.\d+)?::([^:]+)::/g)
      )
        .map((m) => m[1].trim().toLowerCase())
        .filter((t) => {
          if (gm === "femboy" && t === "girl on top") return false;
          if (gm === "futa_no_balls" && (t === "small testicles" || t === "testicles")) return false;
          if (gm.startsWith("futa_") && (t === "labia" || t === "spread pussy")) return false;
          return true;
        });
      for (const wTag of expectedOnsWeighted) {
        assert(
          sp.posPrompt.toLowerCase().includes(wTag),
          `${ch.id} (${gm}) clipped weighted scene/anatomy anchor '${wTag}'`
        );
      }

      // Barefoot vs. Slipper/Geta Footwear Hygiene
      if (tpl.barefoot || tpl.is_foot_focus) {
        for (const ftTok of footAnatUcTokensForOns) {
          assert(negSet.has(ftTok), `${ch.id} (${gm}) missing FOOT_ANAT_UC '${ftTok}'`);
        }
        for (const banTok of onsenBarefootBanTokens) {
          assert(negSet.has(banTok), `${ch.id} (${gm}) missing ONSEN_BAREFOOT_BAN_UC '${banTok}'`);
        }
      } else if (expectedSlipperOrGetaOns.has(ch.id)) {
        assert(
          !negSet.has("footwear") && !negSet.has("geta") && !negSet.has("slippers"),
          `${ch.id} (${gm}) slipper/geta Onsen scene must keep footwear/geta/slippers unblocked`
        );
      }

      // Vertical stream & wall mirror checks
      if (expectedLightStreamOns.has(ch.id)) {
        assert(
          negSet.has("sideways cum string") && negSet.has("horizontal string"),
          `${ch.id} (${gm}) missing vertical stream UC guard`
        );
      }
      if (expectedMirrorOns.has(ch.id)) {
        assert(
          !negSet.has("mirror") && negSet.has("mirror selfie"),
          `${ch.id} (${gm}) wall mirror Onsen scene must allow 'mirror' while blocking 'mirror selfie'`
        );
      }
      if (ch.id === "ONS05") {
        assert(
          negSet.has("letterboxed") && negSet.has("pillarboxed"),
          `ONS05 (${gm}) missing landscape anti-letterbox UC`
        );
      }

      // Duo (32) vs. Solo (23) routing & 4-mode gender isolation
      const isExpectedMultiBox = isDuo && (gm !== "normal" || ch.id === "ONS10");
      assert.equal(
        sp.posPrompt.startsWith("[Base Prompt]"),
        isExpectedMultiBox,
        `${ch.id} (${gm}) Multi-Box routing mismatch`
      );
      if (isDuo) {
        assert(
          negSet.has("bald") && negSet.has("shaved head"),
          `${ch.id} (${gm}) Duo Onsen scene must guard bald/shaved head in UC`
        );
        const expDuoBadge =
          ch.id === "ONS10" && gm === "normal" ? "👯和室双浴衣百合" : "♨️温泉双人";
        assert(
          item.subTitle.includes(expDuoBadge),
          `${ch.id} (${gm}) subTitle must include ${expDuoBadge}`
        );
        if (ch.id === "ONS10" && gm === "normal") {
          assert(
            sp.posPrompt.includes("2girls, 1.55::yuri::") &&
              sp.posPrompt.includes("sakura-pink floral cotton yukata") &&
              sp.posPrompt.includes("target#fingering") &&
              sp.posPrompt.includes("source#fingering"),
            "ONS10 (normal) must compile dual-yukata 2girls Yuri Multi-Box"
          );
        } else if (gm === "femboy") {
          assert(
            sp.posPrompt.includes("2boys, 1.55::yaoi::") &&
              sp.posPrompt.includes("target#anal") &&
              sp.posPrompt.includes("source#anal") &&
              !/\bpussy\b|\bvaginal\b|\bbare breasts\b/i.test(posWithoutNegWeights),
            `${ch.id} (femboy) Duo failed Multi-Box 2boys isolation`
          );
        } else if (gm.startsWith("futa_")) {
          assert(
            sp.posPrompt.includes("1.6::futanari::") &&
              sp.posPrompt.includes("0.25::artist:pija (pianiishimo)::") &&
              sp.posPrompt.includes("target#vaginal") &&
              sp.posPrompt.includes("source#vaginal"),
            `${ch.id} (${gm}) Duo failed Male-on-Futa Multi-Box`
          );
        } else {
          assert(
            sp.posPrompt.includes("1girl, 1boy, hetero, faceless male"),
            `${ch.id} (normal) Duo must compile Single-Box 1girl+1boy layout`
          );
        }
      } else {
        assert(
          item.subTitle.includes("♨️温泉单人") &&
            !negSet.has("sex") &&
            negSet.has("penetration") &&
            negSet.has("insertion") &&
            negSet.has("hetero"),
          `${ch.id} (${gm}) Solo Onsen scene failed solo anti-partner UC lock or placed bare 'sex' in UC`
        );
        if (gm === "normal") {
          assert(
            sp.posPrompt.includes("1girl, solo") && negSet.has("1boy") && negSet.has("penis"),
            `${ch.id} (normal) Solo Onsen failed 1girl solo lock`
          );
        } else if (gm === "femboy") {
          assert(
            sp.posPrompt.includes("solo") &&
              sp.posPrompt.includes("otoko no ko") &&
              negSet.has("2boys") &&
              !/\bpussy\b|\bvaginal\b|\bbare breasts\b/i.test(posWithoutNegWeights),
            `${ch.id} (femboy) Solo Onsen failed otoko no ko solo lock`
          );
        } else {
          assert(
            sp.posPrompt.includes("futanari") &&
              sp.posPrompt.includes("0.25::artist:pija (pianiishimo)::") &&
              /small penis/.test(posWithoutNegWeights) &&
              negSet.has("1boy"),
            `${ch.id} (${gm}) Solo Onsen failed futanari solo lock`
          );
        }
      }

      const tok = countSeparatedT5Tokens({
        posPrompt: sp.posPrompt,
        sceneNegPrompt: sp.negPrompt,
        ucPresetMode: "heavy",
        appendQuality: true,
      });
      const maxExpectedOnsPos = isExpectedMultiBox ? 490 : 500;
      assert(
        tok.posTokens <= maxExpectedOnsPos && tok.negTokens <= 512,
        `${ch.id} (${gm}) exceeded Onsen T5 budget (${maxExpectedOnsPos}): pos=${tok.posTokens}, neg=${tok.negTokens}`
      );
      if (tok.posTokens > maxOnsenPosTokens) maxOnsenPosTokens = tok.posTokens;
      if (isExpectedMultiBox && tok.posTokens > maxOnsenMultiBoxPosTokens) {
        maxOnsenMultiBoxPosTokens = tok.posTokens;
      }
      if (tok.negTokens > maxOnsenNegTokens) maxOnsenNegTokens = tok.negTokens;
      onsenVerifiedCount++;
    }
  }

  // Verify non-daylight Onsen modes strip outdoor sun/sky tags across ALL lighting presets
  for (const onsNoSunId of ["ONS02", "ONS03", "ONS06", "ONS14", "ONS48"] as const) {
    for (const lKey of Object.keys(LIGHTING_PRESETS)) {
      const [onsItem] = generateScenePrompts(
        onsNoSunId,
        {
          ...createDefaultCharacterConfig(),
          lighting_preset: lKey,
          custom_style_pos:
            "sunlight, dappled sunlight, morning sunlight, afternoon sunlight, sun glare, light rays, daylight, clear blue sky, bright sky",
          style_preset: "自定义画风（使用下方自定义画风框）",
        },
        "3rd"
      );
      const spOns = splitPromptPosAndNeg(onsItem.prompt);
      assert(
        !/\bsunlight\b|\bdappled sunlight\b|\bmorning sunlight\b|\bafternoon sunlight\b|\blight rays\b|\bsun glare\b|\bdaylight\b|\bclear blue sky\b|\bbright sky\b/i.test(
          spOns.posPrompt
        ),
        `Non-daylight Onsen scene ${onsNoSunId} under '${lKey}' leaked outdoor sun/sky`
      );
    }
  }

  // Verify ONS01 with other_use_scene_outfit=false + ONS04 femboy condom + X-Ray + transparent_bg + 3-Vibe 400 cap
  const [ons01Fallback] = generateScenePrompts(
    "ONS01",
    { ...hostileSfCfg, other_use_scene_outfit: false },
    "3rd"
  );
  const spOns01Fb = splitPromptPosAndNeg(ons01Fallback.prompt);
  const ons01FbNeg = new Set(spOns01Fb.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
  assert(
    !spOns01Fb.posPrompt.includes("white bath 1.55::towel::") &&
      spOns01Fb.posPrompt.includes("1.5::reverse bunnysuit::") &&
      !ons01FbNeg.has("areolae"),
    "ONS01 with other_use_scene_outfit=false must use left-column outfit without chest_covered UC"
  );

  // Verify pre-coital Solo invitation (ONS26) with condom+xray emits unopened condom packet & clean cutaway without post-coital cum
  const [ons26PrecoitalAux] = generateScenePrompts(
    "ONS26",
    {
      ...createDefaultCharacterConfig(),
      enable_condom: true,
      enable_uterus_xray: true,
    },
    "3rd"
  );
  assert(
    ons26PrecoitalAux.prompt.includes("1.5::condom packet::") &&
      ons26PrecoitalAux.prompt.includes("1.45::uterus::") &&
      !/\bused condom\b|\bcum in condom\b|\bcum in uterus\b/i.test(ons26PrecoitalAux.prompt),
    "Pre-coital ONS26 with condom+xray must emit unopened condom packet & clean cutaway without post-coital cum tags"
  );

  // Verify ONS26 & ONS10 with other_use_scene_outfit=false leave zero heroine yukata text
  for (const noYukataId of ["ONS10", "ONS26"] as const) {
    const [noYukataItem] = generateScenePrompts(
      noYukataId,
      { ...hostileSfCfg, other_use_scene_outfit: false },
      "3rd"
    );
    const spNoYukata = splitPromptPosAndNeg(noYukataItem.prompt);
    assert(
      !/\byukata\b/i.test(spNoYukata.posPrompt),
      `${noYukataId} with other_use_scene_outfit=false leaked 'yukata' into posPrompt`
    );
  }

  const [ons04FemboyAux] = generateScenePrompts(
    "ONS04",
    {
      ...createDefaultCharacterConfig(),
      gender_mode: "femboy",
      enable_condom: true,
      enable_uterus_xray: true,
      pos_transparent_bg: true,
      pos_token_limit: computeSafePosTokenLimit({ isV45: true, activeVibeCount: 3 }),
    },
    "3rd"
  );
  const spOns04Aux = splitPromptPosAndNeg(ons04FemboyAux.prompt);
  const tokOns04Aux = countSeparatedT5Tokens({
    posPrompt: spOns04Aux.posPrompt,
    sceneNegPrompt: spOns04Aux.negPrompt,
    ucPresetMode: "heavy",
    appendQuality: true,
  });
  assert(
    spOns04Aux.posPrompt.includes("1.5::intestines::") &&
      spOns04Aux.posPrompt.includes("cum in ass") &&
      spOns04Aux.posPrompt.includes("1.4::condom::") &&
      spOns04Aux.posPrompt.includes("2.0::transparent background::") &&
      tokOns04Aux.posTokens <= 400,
    `ONS04 femboy with condom+xray+transparent_bg+3Vibes failed checks (posTokens=${tokOns04Aux.posTokens})`
  );

  // Verify 20/23 Onsen Solo Spreading CG Variation (`enable_solo_spread: true` = 80 prompts) + 3/23 Ineligible Invariance (ONS11, ONS14, ONS15)
  const expectedIneligibleSoloSpread = new Set(["ONS11", "ONS14", "ONS15"]);
  let onsenSoloSpreadVerifiedCount = 0;
  let maxOnsenSpreadPosTokens = 0;
  let maxOnsenSpreadNegTokens = 0;
  for (const ch of onsenChapters) {
    const tpl = OTHER_ACTION_TEMPLATES[ch.id];
    if (tpl.is_onsen_duo) {
      assert(!tpl.solo_spread_spec, `${ch.id} Duo must not define solo_spread_spec`);
      continue;
    }
    if (expectedIneligibleSoloSpread.has(ch.id)) {
      assert(
        !tpl.solo_spread_spec && Boolean(tpl.solo_spread_disabled_reason),
        `${ch.id} must omit solo_spread_spec and provide solo_spread_disabled_reason`
      );
      const [baseInelig] = generateScenePrompts(
        ch.id,
        { ...createDefaultCharacterConfig(), enable_solo_spread: false },
        "3rd"
      );
      const [spInelig] = generateScenePrompts(
        ch.id,
        { ...createDefaultCharacterConfig(), enable_solo_spread: true },
        "3rd"
      );
      assert.equal(spInelig.prompt, baseInelig.prompt, `${ch.id} ineligible Solo must stay invariant`);
      assert.equal(spInelig.subTitle, baseInelig.subTitle, `${ch.id} ineligible Solo subTitle must stay invariant`);
      continue;
    }

    assert(tpl.solo_spread_spec, `${ch.id} eligible Solo Onsen must define solo_spread_spec`);
    for (const gm of ["normal", "femboy", "futa_no_balls", "futa_with_balls"] as const) {
      const [spItem] = generateScenePrompts(
        ch.id,
        {
          ...createDefaultCharacterConfig(),
          gender_mode: gm,
          style_preset: style6Key,
          lighting_preset: "🔄 随画风与本幕默认光影（不额外覆盖）",
          enable_solo_spread: true,
        },
        "3rd"
      );
      assertZeroNestedColons(spItem.prompt, `${ch.id}_SP (${gm})`);
      assert(spItem.subTitle.includes("🫶掰开差分"), `${ch.id}_SP (${gm}) missing 🫶掰开差分 badge`);
      const sp = splitPromptPosAndNeg(spItem.prompt);
      assert(!/-?\d+(?:\.\d+)?::/.test(sp.negPrompt), `${ch.id}_SP (${gm}) negPrompt has weight`);
      const posNoNeg = sp.posPrompt.replace(/-\d+(?:\.\d+)?::[\s\S]*?::/g, "");
      const negSetSp = new Set(sp.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
      for (const gTok of [
        "covering crotch",
        "covering pussy",
        "hand over crotch",
        "holding own penis",
        "grabbing penis",
        "extra arms",
        "3 arms",
      ]) {
        assert(negSetSp.has(gTok), `${ch.id}_SP (${gm}) missing spread UC '${gTok}'`);
      }
      if (gm === "femboy") {
        assert(!negSetSp.has("gaping"), `${ch.id}_SP (femboy) must omit bare 'gaping' from UC`);
        assert(
          !/\b(?:1girl|2girls|girls?|woman|women|female|breasts?|sideboob|underboob|cleavage|pussy|vulva|labia|vaginal|cervix|uterus|futanari|she|her|hers)\b/i.test(
            posNoNeg
          ),
          `${ch.id}_SP (femboy) leaked female anatomy or pronoun`
        );
      } else if (ch.id === "ONS48" || ch.id === "ONS53") {
        assert(
          posNoNeg.includes("pussy from behind"),
          `${ch.id}_SP (${gm}) rear lookback spread must keep 'pussy from behind'`
        );
      }
      const spSpec = tpl.solo_spread_spec;
      const expSpGender =
        gm === "femboy"
          ? spSpec.spread_femboy_tags
          : gm.startsWith("futa_")
            ? spSpec.spread_futa_tags
            : spSpec.spread_female_tags;
      const expSpWeighted = Array.from(
        `${spSpec.spread_prop_tags}, ${expSpGender}`.matchAll(/\d+(?:\.\d+)?::([^:]+)::/g)
      )
        .map((m) => m[1].trim().toLowerCase())
        .filter((t) => !(gm === "futa_no_balls" && (t === "small testicles" || t === "testicles")));
      for (const wTag of expSpWeighted) {
        assert(
          sp.posPrompt.toLowerCase().includes(wTag),
          `${ch.id}_SP (${gm}) clipped weighted spread anchor '${wTag}'`
        );
      }
      const tokSp = countSeparatedT5Tokens({
        posPrompt: sp.posPrompt,
        sceneNegPrompt: sp.negPrompt,
        ucPresetMode: "heavy",
        appendQuality: true,
      });
      assert(
        tokSp.posTokens <= 500 && tokSp.negTokens <= 512,
        `${ch.id}_SP (${gm}) exceeded T5 budget: pos=${tokSp.posTokens}/500, neg=${tokSp.negTokens}/512`
      );
      if (tokSp.posTokens > maxOnsenSpreadPosTokens) maxOnsenSpreadPosTokens = tokSp.posTokens;
      if (tokSp.negTokens > maxOnsenSpreadNegTokens) maxOnsenSpreadNegTokens = tokSp.negTokens;
      assert(
        !/\bcum\b|\bcumdrip\b|\bcum overflow\b|\bcum in pussy\b|\bcum in ass\b|\bafter sex\b/i.test(
          posNoNeg
        ) && negSetSp.has("cum"),
        `${ch.id}_SP pure (${gm}) leaked cum/after-sex or missed anti-cum UC`
      );
      onsenSoloSpreadVerifiedCount++;

      // Stage 3: solo_spread_mode='cum' (💧掰开+白流出差分)
      const [cumItem] = generateScenePrompts(
        ch.id,
        {
          ...createDefaultCharacterConfig(),
          gender_mode: gm,
          style_preset: style6Key,
          lighting_preset: "🔄 随画风与本幕默认光影（不额外覆盖）",
          solo_spread_mode: "cum",
        },
        "3rd"
      );
      assertZeroNestedColons(cumItem.prompt, `${ch.id}_SP_CUM (${gm})`);
      assert(
        cumItem.subTitle.includes("💧掰开+白流出"),
        `${ch.id}_SP_CUM (${gm}) missing 💧掰开+白流出 badge`
      );
      const spCum = splitPromptPosAndNeg(cumItem.prompt);
      assert(!/-?\d+(?:\.\d+)?::/.test(spCum.negPrompt), `${ch.id}_SP_CUM (${gm}) negPrompt has weight`);
      const posNoNegCum = spCum.posPrompt.replace(/-\d+(?:\.\d+)?::[\s\S]*?::/g, "");
      assert(
        /\bafter sex\b/i.test(posNoNegCum) && /\bcum/i.test(posNoNegCum),
        `${ch.id}_SP_CUM (${gm}) missing after sex / cum tags`
      );
      const tokCum = countSeparatedT5Tokens({
        posPrompt: spCum.posPrompt,
        sceneNegPrompt: spCum.negPrompt,
        ucPresetMode: "heavy",
        appendQuality: true,
      });
      assert(
        tokCum.posTokens <= 500 && tokCum.negTokens <= 512,
        `${ch.id}_SP_CUM (${gm}) exceeded T5 budget: pos=${tokCum.posTokens}/500, neg=${tokCum.negTokens}/512`
      );
      if (tokCum.posTokens > maxOnsenSpreadPosTokens) maxOnsenSpreadPosTokens = tokCum.posTokens;
      if (tokCum.negTokens > maxOnsenSpreadNegTokens) maxOnsenSpreadNegTokens = tokCum.negTokens;
      onsenSoloSpreadVerifiedCount++;
    }
  }
  assert.equal(onsenSoloSpreadVerifiedCount, 160, "Expected 160 verified Onsen Solo Spread prompts (20 x 4 x 2 stages)");

  // Verify .agents/skills/nai-onsen-yukata/ & nai-cg-variations/ hygiene (zero code/build vocabulary leaks)
  const onsenSkillDir = path.resolve(process.cwd(), "../.agents/skills/nai-onsen-yukata");
  for (const relDoc of ["SKILL.md"]) {
    const docPath = path.join(onsenSkillDir, relDoc);
    assert(fs.existsSync(docPath), `Missing onsen-yukata skill doc: ${docPath}`);
    const docText = fs.readFileSync(docPath, "utf8");
    assert(
      !/storyEngine|engineConstants|otherActionsData|onsenYukataActionsData|verify_engine|NovelAI_Workbench\.html|vite build|tsc --noEmit|npm --prefix/i.test(
        docText
      ),
      `${relDoc} leaked codebase/build vocabulary`
    );
  }
  const cgVarSkillDoc = path.resolve(process.cwd(), "../.agents/skills/nai-cg-variations/SKILL.md");
  assert(fs.existsSync(cgVarSkillDoc), `Missing nai-cg-variations SKILL.md: ${cgVarSkillDoc}`);
  const cgVarText = fs.readFileSync(cgVarSkillDoc, "utf8");
  assert(
    !/storyEngine|engineConstants|otherActionsData|onsenYukataActionsData|verify_engine|NovelAI_Workbench\.html|vite build|tsc --noEmit|npm --prefix/i.test(
      cgVarText
    ),
    "nai-cg-variations/SKILL.md leaked codebase/build vocabulary"
  );

  // 17.14 Verify 20 Car Interior Scenes (CAR01..CAR20 = 80 Prompts), 5 Scene-Bound Car Light Modes, Physical Overrides (CAR02 pure_rear, CAR11 upper_body_window, CAR20 Yuri Multi-Box), Femboy Chest Sanitization, & Skill Hygiene
  assert(
    OTHER_ACTION_CATEGORIES.includes("23. 车内玩法"),
    "OTHER_ACTION_CATEGORIES must include '23. 车内玩法'"
  );
  for (const [lKey, lEntry] of Object.entries(LIGHTING_PRESETS)) {
    assert(
      !/车内专属/.test(lKey) && !/^car_/i.test(lEntry.code),
      `Car lighting must stay 100% scene-bound and NOT appear in global LIGHTING_PRESETS: ${lKey}`
    );
  }
  assert.equal(
    Object.keys(CAR_LIGHT_DEFAULTS).length,
    5,
    "Expected 5 scene-bound CAR_LIGHT_DEFAULTS"
  );
  assert(
    !CAR_LIGHT_DEFAULTS.underground_garage_amber.backlit &&
      !CAR_LIGHT_DEFAULTS.dashboard_glow_midnight.backlit &&
      CAR_LIGHT_DEFAULTS.rainy_neon_night_cabin.backlit &&
      CAR_LIGHT_DEFAULTS.sunset_highway_glare.backlit &&
      CAR_LIGHT_DEFAULTS.dappled_roadside_daylight.backlit,
    "Dark car cabins (underground_garage_amber, dashboard_glow_midnight) must set backlit: false"
  );
  assert(
    CAR_LIGHT_DEFAULTS.dappled_roadside_daylight.neg.includes("pitch dark") &&
      CAR_LIGHT_DEFAULTS.dappled_roadside_daylight.neg.includes("dark night") &&
      !/(?:^|,\s*)dark(?:\s*,|$)/i.test(CAR_LIGHT_DEFAULTS.dappled_roadside_daylight.neg),
    "dappled_roadside_daylight.neg must replace bare 'dark' with 'pitch dark, dark night'"
  );

  const carChapters = OTHER_ACTION_CHAPTERS.filter((c) => c.id.startsWith("CAR"));
  assert.equal(carChapters.length, 25, "Expected 25 Car Interior scenes (CAR01..CAR25: 20 duo + 5 solo)");
  const carDuoChapters = carChapters.filter((c) => !OTHER_ACTION_TEMPLATES[c.id]?.is_car_solo);
  const carSoloChapters = carChapters.filter((c) => Boolean(OTHER_ACTION_TEMPLATES[c.id]?.is_car_solo));
  assert.equal(carDuoChapters.length, 20, "Expected 20 Car Duo scenes (CAR01..CAR20)");
  assert.equal(carSoloChapters.length, 5, "Expected 5 Car Solo scenes (CAR21..CAR25)");
  let carVerifiedCount = 0;
  let maxCarPosTokens = 0;
  let maxCarMultiBoxPosTokens = 0;
  let maxCarNegTokens = 0;
  const carFemboyExposedIds = new Set(["CAR06", "CAR08", "CAR11", "CAR12", "CAR17"]);

  for (const ch of carDuoChapters) {
    const tpl = OTHER_ACTION_TEMPLATES[ch.id];
    assert(tpl?.is_car_scene && tpl.car_light_mode, `${ch.id} missing car metadata`);
    for (const gm of ["normal", "femboy", "futa_no_balls", "futa_with_balls"] as const) {
      const carCfg = {
        ...createDefaultCharacterConfig(),
        gender_mode: gm,
        style_preset: style6Key,
        other_use_scene_outfit: true,
        lighting_preset: "🔄 随画风与本幕默认光影（不额外覆盖）",
      };
      const items = generateScenePrompts(ch.id, carCfg, "3rd");
      assert.equal(items.length, 1, `${ch.id} (${gm}) must emit 1 prompt`);
      assertZeroNestedColons(items[0].prompt, `${ch.id} (${gm})`);
      const sp = splitPromptPosAndNeg(items[0].prompt);
      assert(!/-?\d+(?:\.\d+)?::/.test(sp.negPrompt), `${ch.id} (${gm}) negPrompt has weight`);
      const tok = countSeparatedT5Tokens({
        posPrompt: sp.posPrompt,
        sceneNegPrompt: sp.negPrompt,
        ucPresetMode: "heavy",
        appendQuality: true,
      });
      const isMultiBox = sp.posPrompt.includes("[Character 1");
      const posCeiling = isMultiBox ? 490 : 500;
      assert(
        tok.posTokens <= posCeiling && tok.negTokens <= 512,
        `${ch.id} (${gm}) exceeded T5 budget: pos=${tok.posTokens}/${posCeiling}, neg=${tok.negTokens}/512`
      );
      if (tok.posTokens > maxCarPosTokens) maxCarPosTokens = tok.posTokens;
      if (isMultiBox && tok.posTokens > maxCarMultiBoxPosTokens) {
        maxCarMultiBoxPosTokens = tok.posTokens;
      }
      if (tok.negTokens > maxCarNegTokens) maxCarNegTokens = tok.negTokens;

      const posNoInlineNeg = sp.posPrompt.replace(/-\d+(?:\.\d+)?::[\s\S]*?::/g, "");
      if (ch.id === "CAR01") {
        assert(
          !/\baqua eyes\b/i.test(posNoInlineNeg),
          `CAR01 (${gm}) must not contain hardcoded 'aqua eyes'`
        );
      }
      if (ch.id === "CAR02") {
        assert(
          !/\b(?:red eyes|amber eyes|blue eyes|green eyes|gradient eyes|looking at viewer)\b/i.test(
            posNoInlineNeg
          ),
          `CAR02 (${gm}) pure_rear must strip iris/eye/face tags`
        );
      }
      if (ch.id === "CAR11") {
        assert(
          !/\b(?:slender legs|thigh gap|long legs|wide hips|thick thighs)\b/i.test(posNoInlineNeg),
          `CAR11 (${gm}) upper_body_window must strip lower-body leg/hip tags`
        );
      }
      if (ch.id === "CAR20" && gm === "normal") {
        assert(
          posNoInlineNeg.includes("2girls") &&
            posNoInlineNeg.includes("[Character 1 (B3)]") &&
            posNoInlineNeg.includes("[Character 2 (D3)]"),
          `CAR20 normal must compile as 2girls [B3]/[D3] Multi-Box Yuri Showcase`
        );
      }
      if (
        tpl.car_light_mode === "underground_garage_amber" ||
        tpl.car_light_mode === "dashboard_glow_midnight"
      ) {
        assert(
          !/\bbacklighting\b/i.test(posNoInlineNeg),
          `${ch.id} (${gm}) dark cabin (${tpl.car_light_mode}) must NOT inject backlighting`
        );
      }
      if (gm === "femboy") {
        assert(
          posNoInlineNeg.includes("2boys") && posNoInlineNeg.includes("1.55::flat chest::"),
          `${ch.id} femboy must route 2boys with flat chest`
        );
        if (carFemboyExposedIds.has(ch.id)) {
          assert(
            !/\bbare breasts\b|\bbetween breasts\b|\bheavy breast squish\b/i.test(posNoInlineNeg),
            `${ch.id} femboy must strip bare breasts / between breasts / heavy breast squish`
          );
        }
      }
      if (tpl.barefoot) {
        const bareTokens = CAR_BAREFOOT_BAN_UC.split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean);
        const negLower = sp.negPrompt.toLowerCase();
        for (const bt of bareTokens) {
          assert(negLower.includes(bt), `${ch.id} (${gm}) barefoot missing UC token '${bt}'`);
        }
      }
      carVerifiedCount++;
    }
  }
  assert.equal(carVerifiedCount, 80, "Expected 80 verified Car Duo prompts (20 x 4)");

  // Verify CAR21..CAR25 (5 Solo scenes x 3 solo_spread_mode stages x 4 gender modes = 60 prompts, 0 truncation)
  let carSoloVerifiedCount = 0;
  let maxCarSoloPosTokens = 0;
  let maxCarSoloNegTokens = 0;
  const carSoloPartnerBanTokens = CAR_SOLO_PARTNER_BAN_UC.split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const carPureAntiCumTokens = CAR_SOLO_PURE_SPREAD_ANTI_CUM_UC.split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  for (const ch of carSoloChapters) {
    const tpl = OTHER_ACTION_TEMPLATES[ch.id];
    assert(tpl?.is_car_scene && tpl.is_car_solo && tpl.solo_spread_spec, `${ch.id} missing car solo metadata`);
    for (const sMode of ["off", "pure", "cum"] as const) {
      for (const gm of ["normal", "femboy", "futa_no_balls", "futa_with_balls"] as const) {
        const [item] = generateScenePrompts(
          ch.id,
          {
            ...createDefaultCharacterConfig(),
            gender_mode: gm,
            style_preset: style6Key,
            other_use_scene_outfit: true,
            lighting_preset: "🔄 随画风与本幕默认光影（不额外覆盖）",
            solo_spread_mode: sMode,
          },
          "3rd"
        );
        assertZeroNestedColons(item.prompt, `${ch.id}_${sMode} (${gm})`);
        const sp = splitPromptPosAndNeg(item.prompt);
        assert(!/-?\d+(?:\.\d+)?::/.test(sp.negPrompt), `${ch.id}_${sMode} (${gm}) negPrompt has weight`);
        const posNoInlineNeg = sp.posPrompt.replace(/-\d+(?:\.\d+)?::[\s\S]*?::/g, "");
        const negSet = new Set(sp.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
        for (const pt of carSoloPartnerBanTokens) {
          assert(negSet.has(pt), `${ch.id}_${sMode} (${gm}) missing CAR_SOLO_PARTNER_BAN_UC '${pt}'`);
        }
        const tok = countSeparatedT5Tokens({
          posPrompt: sp.posPrompt,
          sceneNegPrompt: sp.negPrompt,
          ucPresetMode: "heavy",
          appendQuality: true,
        });
        assert(
          tok.posTokens <= 500 && tok.negTokens <= 512,
          `${ch.id}_${sMode} (${gm}) exceeded T5 budget: pos=${tok.posTokens}/500, neg=${tok.negTokens}/512`
        );
        if (tok.posTokens > maxCarSoloPosTokens) maxCarSoloPosTokens = tok.posTokens;
        if (tok.negTokens > maxCarSoloNegTokens) maxCarSoloNegTokens = tok.negTokens;

        // 0-truncation check: base prose core must survive intact without enforcePositiveTokenBudget clipping
        const expectedProseCore = (gm === "femboy" ? tpl.femboy_prose : tpl.female_prose).replace(
          /\.+\s*$/,
          ""
        );
        assert(
          sp.posPrompt.includes(expectedProseCore),
          `${ch.id}_${sMode} (${gm}) truncated base prose (posTokens=${tok.posTokens})`
        );

        if (gm === "femboy") {
          assert(
            !/\badult woman\b|\bpussy\b|\blabia\b|\bbare breasts\b/i.test(posNoInlineNeg) &&
              posNoInlineNeg.includes("a slender crossdressing boy"),
            `${ch.id}_${sMode} (femboy) leaked female anatomy or missed 'a slender crossdressing boy'`
          );
        }
        if (sMode === "pure") {
          assert(
            item.subTitle.includes("🫶掰开差分") &&
              !/\bcum\b|\bcumdrip\b|\bcum overflow\b|\bcum in pussy\b|\bcum in ass\b|\bafter sex\b/i.test(
                posNoInlineNeg
              ),
            `${ch.id}_pure (${gm}) failed pure spread badge or leaked cum tags`
          );
          for (const ac of carPureAntiCumTokens) {
            assert(negSet.has(ac), `${ch.id}_pure (${gm}) missing anti-cum UC '${ac}'`);
          }
        } else if (sMode === "cum") {
          assert(
            item.subTitle.includes("💧掰开+白流出") &&
              /\bafter sex\b/i.test(posNoInlineNeg) &&
              /\bcum/i.test(posNoInlineNeg),
            `${ch.id}_cum (${gm}) failed cum spread badge or tags`
          );
        }
        if (tpl.barefoot) {
          const bareTokens = CAR_BAREFOOT_BAN_UC.split(",")
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean);
          for (const bt of bareTokens) {
            assert(negSet.has(bt), `${ch.id}_${sMode} (${gm}) barefoot missing UC '${bt}'`);
          }
        }
        carSoloVerifiedCount++;
      }
    }
  }
  assert.equal(carSoloVerifiedCount, 60, "Expected 60 verified Car Solo 3-stage prompts (5 x 3 x 4)");

  // Verify CAR02 pure_rear resists global expression override
  const car02ExprTest = generateScenePrompts(
    "CAR02",
    {
      ...createDefaultCharacterConfig(),
      style_preset: style6Key,
      expression_preset: "迷离潮红",
      other_use_scene_outfit: true,
    },
    "3rd"
  )[0];
  assert(
    !/\blooking at viewer\b|\bheart-shaped pupils\b/i.test(
      splitPromptPosAndNeg(car02ExprTest.prompt).posPrompt
    ),
    "CAR02 pure_rear must suppress global facial expression post-pass"
  );

  // Verify CAR01 femboy auxiliary toggles (condom + xray + transparent_bg) stay within 400 tokens (3-Vibe safe)
  const car01AuxItem = generateScenePrompts(
    "CAR01",
    {
      ...createDefaultCharacterConfig(),
      style_preset: style6Key,
      gender_mode: "femboy",
      enable_condom: true,
      enable_uterus_xray: true,
      pos_transparent_bg: true,
      other_use_scene_outfit: true,
      pos_token_limit: computeSafePosTokenLimit({ isV45: true, activeVibeCount: 3 }),
    },
    "3rd"
  )[0];
  const spCar01Aux = splitPromptPosAndNeg(car01AuxItem.prompt);
  const tokCar01Aux = countSeparatedT5Tokens({
    posPrompt: spCar01Aux.posPrompt,
    sceneNegPrompt: spCar01Aux.negPrompt,
    ucPresetMode: "heavy",
    appendQuality: true,
  });
  assert(
    spCar01Aux.posPrompt.includes("1.5::intestines::") &&
      spCar01Aux.posPrompt.includes("1.4::condom::") &&
      spCar01Aux.posPrompt.includes("2.0::transparent background::") &&
      tokCar01Aux.posTokens <= 400,
    `CAR01 femboy with condom+xray+transparent_bg+3Vibes failed checks (posTokens=${tokCar01Aux.posTokens})`
  );

  // Verify .agents/skills/nai-car-interior/SKILL.md hygiene (zero code/build vocabulary leaks)
  const carSkillDoc = path.resolve(process.cwd(), "../.agents/skills/nai-car-interior/SKILL.md");
  assert(fs.existsSync(carSkillDoc), `Missing nai-car-interior SKILL.md: ${carSkillDoc}`);
  const carSkillText = fs.readFileSync(carSkillDoc, "utf8");
  assert(
    !/storyEngine|engineConstants|otherActionsData|carInteriorActionsData|verify_engine|NovelAI_Workbench\.html|vite build|tsc --noEmit|npm --prefix/i.test(
      carSkillText
    ),
    "nai-car-interior/SKILL.md leaked codebase/build vocabulary"
  );

  // 17.15 Verify 15 Summer Matsuri Stealth Yukata Scenes (MTS01..MTS15 = 92 Prompts: 11 Duo x 4 + 4 Solo x 3 x 4), 5 Scene-Bound Matsuri Light Modes, 0-Truncation, Yuri Multi-Box, & Skill Hygiene
  assert(
    OTHER_ACTION_CATEGORIES.includes("24. 夏日祭典"),
    "OTHER_ACTION_CATEGORIES must include '24. 夏日祭典'"
  );
  for (const [lKey, lEntry] of Object.entries(LIGHTING_PRESETS)) {
    assert(
      !/夏日祭专属|祭典专属/.test(lKey) && !/^matsuri_/i.test(lEntry.code),
      `Matsuri lighting must stay 100% scene-bound and NOT appear in global LIGHTING_PRESETS: ${lKey}`
    );
  }
  assert.equal(
    Object.keys(MATSURI_LIGHT_DEFAULTS).length,
    5,
    "Expected 5 scene-bound MATSURI_LIGHT_DEFAULTS"
  );
  assert(
    !MATSURI_LIGHT_DEFAULTS.yatai_chochin_amber.backlit &&
      !MATSURI_LIGHT_DEFAULTS.shrine_torii_moonlight.backlit &&
      !MATSURI_LIGHT_DEFAULTS.sparkler_close_glow.backlit &&
      MATSURI_LIGHT_DEFAULTS.hanabi_burst_riverside.backlit &&
      MATSURI_LIGHT_DEFAULTS.festival_crowd_bokeh.backlit,
    "Dark Matsuri modes (yatai_chochin_amber, shrine_torii_moonlight, sparkler_close_glow) must set backlit: false"
  );

  const mtsChapters = OTHER_ACTION_CHAPTERS.filter((c) => c.id.startsWith("MTS"));
  assert.equal(mtsChapters.length, 15, "Expected 15 Matsuri scenes (MTS01..MTS15)");
  const mtsDuoChapters = mtsChapters.filter((c) => !OTHER_ACTION_TEMPLATES[c.id]?.is_matsuri_solo);
  const mtsSoloChapters = mtsChapters.filter((c) => Boolean(OTHER_ACTION_TEMPLATES[c.id]?.is_matsuri_solo));
  assert.equal(mtsDuoChapters.length, 11, "Expected 11 Matsuri Duo scenes (MTS01..MTS11)");
  assert.equal(mtsSoloChapters.length, 4, "Expected 4 Matsuri Solo 3-stage scenes (MTS12..MTS15)");

  let mtsDuoVerifiedCount = 0;
  let mtsSoloVerifiedCount = 0;
  let maxMtsPosTokens = 0;
  let maxMtsMultiBoxPosTokens = 0;
  let maxMtsNegTokens = 0;

  for (const ch of mtsDuoChapters) {
    const tpl = OTHER_ACTION_TEMPLATES[ch.id];
    assert(tpl?.is_matsuri_scene && tpl.matsuri_light_mode, `${ch.id} missing matsuri metadata`);
    for (const gm of ["normal", "femboy", "futa_no_balls", "futa_with_balls"] as const) {
      const [item] = generateScenePrompts(
        ch.id,
        {
          ...createDefaultCharacterConfig(),
          gender_mode: gm,
          style_preset: style6Key,
          other_use_scene_outfit: true,
          lighting_preset: "🔄 随画风与本幕默认光影（不额外覆盖）",
        },
        "3rd"
      );
      assertZeroNestedColons(item.prompt, `${ch.id} (${gm})`);
      const sp = splitPromptPosAndNeg(item.prompt);
      assert(!/-?\d+(?:\.\d+)?::/.test(sp.negPrompt), `${ch.id} (${gm}) negPrompt has weight`);
      const tok = countSeparatedT5Tokens({
        posPrompt: sp.posPrompt,
        sceneNegPrompt: sp.negPrompt,
        ucPresetMode: "heavy",
        appendQuality: true,
      });
      const isMultiBox = sp.posPrompt.includes("[Character 1");
      const posCeiling = isMultiBox ? 490 : 500;
      assert(
        tok.posTokens <= posCeiling && tok.negTokens <= 512,
        `${ch.id} (${gm}) exceeded T5 budget: pos=${tok.posTokens}/${posCeiling}, neg=${tok.negTokens}/512`
      );
      if (tok.posTokens > maxMtsPosTokens) maxMtsPosTokens = tok.posTokens;
      if (isMultiBox && tok.posTokens > maxMtsMultiBoxPosTokens) {
        maxMtsMultiBoxPosTokens = tok.posTokens;
      }
      if (tok.negTokens > maxMtsNegTokens) maxMtsNegTokens = tok.negTokens;

      const posNoInlineNeg = sp.posPrompt.replace(/-\d+(?:\.\d+)?::[\s\S]*?::/g, "");
      const expectedProse =
        gm === "femboy" ? tpl.femboy_prose : gm === "normal" ? tpl.female_prose : tpl.futa_prose;
      assert(
        sp.posPrompt.includes(expectedProse),
        `${ch.id} (${gm}) truncated prose (posTokens=${tok.posTokens})`
      );
      if (
        tpl.matsuri_light_mode === "yatai_chochin_amber" ||
        tpl.matsuri_light_mode === "shrine_torii_moonlight" ||
        tpl.matsuri_light_mode === "sparkler_close_glow"
      ) {
        assert(
          !/\bbacklighting\b/i.test(posNoInlineNeg),
          `${ch.id} (${gm}) dark Matsuri mode (${tpl.matsuri_light_mode}) must NOT inject backlighting`
        );
      }
      if (ch.id === "MTS11" && gm === "normal") {
        assert(
          posNoInlineNeg.includes("2girls") &&
            posNoInlineNeg.includes("[Character 1 (B3)]") &&
            posNoInlineNeg.includes("[Character 2 (D3)]"),
          "MTS11 normal must compile as 2girls [B3]/[D3] Multi-Box Yuri Showcase"
        );
      }
      if (gm === "femboy") {
        assert(
          posNoInlineNeg.includes("2boys") &&
            posNoInlineNeg.includes("1.55::flat chest::") &&
            !/\badult woman\b|\bbare breasts\b|\bthe kitsune-masked girl\b/i.test(posNoInlineNeg),
          `${ch.id} femboy failed 2boys/flat-chest/pronoun check`
        );
      }
      if (ch.id === "MTS07") {
        const negSet = new Set(sp.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
        assert(
          negSet.has("wearing geta") && !negSet.has("geta"),
          `MTS07 (${gm}) must use 'wearing geta' instead of bare 'geta' in UC`
        );
      }
      mtsDuoVerifiedCount++;
    }
  }
  assert.equal(mtsDuoVerifiedCount, 44, "Expected 44 verified Matsuri Duo prompts (11 x 4)");

  const mtsSoloPartnerBanTokens = MATSURI_SOLO_PARTNER_BAN_UC.split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const mtsPureAntiCumTokens = MATSURI_PURE_SPREAD_ANTI_CUM_UC.split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  for (const ch of mtsSoloChapters) {
    const tpl = OTHER_ACTION_TEMPLATES[ch.id];
    assert(
      tpl?.is_matsuri_scene && tpl.is_matsuri_solo && tpl.solo_spread_spec,
      `${ch.id} missing matsuri solo metadata`
    );
    for (const sMode of ["off", "pure", "cum"] as const) {
      for (const gm of ["normal", "femboy", "futa_no_balls", "futa_with_balls"] as const) {
        const [item] = generateScenePrompts(
          ch.id,
          {
            ...createDefaultCharacterConfig(),
            gender_mode: gm,
            style_preset: style6Key,
            other_use_scene_outfit: true,
            lighting_preset: "🔄 随画风与本幕默认光影（不额外覆盖）",
            solo_spread_mode: sMode,
          },
          "3rd"
        );
        assertZeroNestedColons(item.prompt, `${ch.id}_${sMode} (${gm})`);
        const sp = splitPromptPosAndNeg(item.prompt);
        assert(!/-?\d+(?:\.\d+)?::/.test(sp.negPrompt), `${ch.id}_${sMode} (${gm}) negPrompt has weight`);
        const posNoInlineNeg = sp.posPrompt.replace(/-\d+(?:\.\d+)?::[\s\S]*?::/g, "");
        const negSet = new Set(sp.negPrompt.split(",").map((s) => s.trim().toLowerCase()));
        for (const pt of mtsSoloPartnerBanTokens) {
          assert(negSet.has(pt), `${ch.id}_${sMode} (${gm}) missing MATSURI_SOLO_PARTNER_BAN_UC '${pt}'`);
        }
        const tok = countSeparatedT5Tokens({
          posPrompt: sp.posPrompt,
          sceneNegPrompt: sp.negPrompt,
          ucPresetMode: "heavy",
          appendQuality: true,
        });
        assert(
          tok.posTokens <= 500 && tok.negTokens <= 512,
          `${ch.id}_${sMode} (${gm}) exceeded T5 budget: pos=${tok.posTokens}/500, neg=${tok.negTokens}/512`
        );
        if (tok.posTokens > maxMtsPosTokens) maxMtsPosTokens = tok.posTokens;
        if (tok.negTokens > maxMtsNegTokens) maxMtsNegTokens = tok.negTokens;

        if (gm === "femboy") {
          assert(
            !/\badult woman\b|\bpussy\b|\blabia\b|\bbare breasts\b/i.test(posNoInlineNeg) &&
              posNoInlineNeg.includes("a slender crossdressing boy"),
            `${ch.id}_${sMode} (femboy) leaked female anatomy or missed 'a slender crossdressing boy'`
          );
        }
        if (sMode === "pure") {
          assert(
            item.subTitle.includes("🫶掰开差分") &&
              !/\bcum\b|\bcumdrip\b|\bcum overflow\b|\bcum in pussy\b|\bcum in ass\b|\bafter sex\b/i.test(
                posNoInlineNeg
              ),
            `${ch.id}_pure (${gm}) failed pure spread badge or leaked cum tags`
          );
          for (const ac of mtsPureAntiCumTokens) {
            assert(negSet.has(ac), `${ch.id}_pure (${gm}) missing anti-cum UC '${ac}'`);
          }
        } else if (sMode === "cum") {
          assert(
            item.subTitle.includes("💧掰开+白流出") &&
              /\bafter sex\b/i.test(posNoInlineNeg) &&
              /\bcum/i.test(posNoInlineNeg),
            `${ch.id}_cum (${gm}) failed cum spread badge or tags`
          );
        }
        if (ch.id === "MTS12" && sMode !== "off") {
          assert(
            posNoInlineNeg.includes("front hem tucked in gold obi"),
            `MTS12_${sMode} (${gm}) must apply spread_outfit_override obi tuck`
          );
        }
        if (ch.id === "MTS15" && sMode !== "off") {
          assert(
            posNoInlineNeg.includes("back hem tucked in yellow obi"),
            `MTS15_${sMode} (${gm}) must apply spread_outfit_override obi tuck`
          );
        }
        if (ch.id === "MTS13") {
          assert(
            negSet.has("wearing geta") && !negSet.has("geta"),
            `MTS13_${sMode} (${gm}) must use 'wearing geta' instead of bare 'geta' in UC`
          );
        }
        mtsSoloVerifiedCount++;
      }
    }
  }
  assert.equal(mtsSoloVerifiedCount, 48, "Expected 48 verified Matsuri Solo 3-stage prompts (4 x 3 x 4)");
  const mtsVerifiedCount = mtsDuoVerifiedCount + mtsSoloVerifiedCount;
  assert.equal(mtsVerifiedCount, 92, "Expected 92 total Matsuri prompts");

  // Verify .agents/skills/nai-matsuri-stealth/SKILL.md hygiene (zero code/build vocabulary leaks)
  const mtsSkillDoc = path.resolve(process.cwd(), "../.agents/skills/nai-matsuri-stealth/SKILL.md");
  assert(fs.existsSync(mtsSkillDoc), `Missing nai-matsuri-stealth SKILL.md: ${mtsSkillDoc}`);
  const mtsSkillText = fs.readFileSync(mtsSkillDoc, "utf8");
  assert(
    !/storyEngine|engineConstants|otherActionsData|matsuriStealthActionsData|verify_engine|NovelAI_Workbench\.html|vite build|tsc --noEmit|npm --prefix/i.test(
      mtsSkillText
    ),
    "nai-matsuri-stealth/SKILL.md leaked codebase/build vocabulary"
  );

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

  // 19. Verify Responsive Space-Budget Portrait Compact Stage Math & CSS/UI Invariants
  assert.equal(EXPECTED_FILM_TOOLBAR_W, 680, "EXPECTED_FILM_TOOLBAR_W must equal 680");
  assert.equal(EXPECTED_DUAL_STACK_H, 882, "EXPECTED_DUAL_STACK_H must equal 882");

  // Landscape Guard: ANY landscape orientation (desktop, laptop, tablet landscape, phone landscape) -> false
  assert.equal(
    computePortraitCompactStage({ winW: 1920, winH: 1080, colW: 1166, colH: 1030 }),
    false,
    "Desktop landscape 1920x1080 must never activate portrait-compact-stage"
  );
  assert.equal(
    computePortraitCompactStage({ winW: 1366, winH: 768, colW: 612, colH: 718 }),
    false,
    "Laptop landscape 1366x768 (even with narrow colW) must never activate portrait-compact-stage"
  );
  assert.equal(
    computePortraitCompactStage({ winW: 844, winH: 390, colW: 844, colH: 290 }),
    false,
    "Phone landscape 844x390 must never activate portrait-compact-stage"
  );
  assert.equal(
    computePortraitCompactStage({ winW: 667, winH: 375, colW: 667, colH: 275 }),
    false,
    "Small phone landscape 667x375 must never activate portrait-compact-stage"
  );

  // Portrait Space Check: wide tablets >= 680px or tall center stage >= 922px stay uncramped (false)
  assert.equal(
    computePortraitCompactStage({ winW: 820, winH: 1180, colW: 820, colH: 1040 }),
    false,
    "Wide portrait tablet 820x1180 must stay uncramped (colW >= 680)"
  );
  assert.equal(
    computePortraitCompactStage({ winW: 768, winH: 1024, colW: 768, colH: 884 }),
    false,
    "iPad Mini portrait 768x1024 must stay uncramped (colW >= 680)"
  );
  assert.equal(
    computePortraitCompactStage({ winW: 520, winH: 1120, colW: 520, colH: 980 }),
    false,
    "Tall portrait container (colH >= 922) can fit stacked drawers and must stay false"
  );

  // Narrow Portrait Viewports (< 680px width AND < 922px height) -> true
  assert.equal(
    computePortraitCompactStage({ winW: 390, winH: 844, colW: 390, colH: 704 }),
    true,
    "Phone portrait 390x844 must activate portrait-compact-stage"
  );
  assert.equal(
    computePortraitCompactStage({ winW: 430, winH: 932, colW: 430, colH: 792 }),
    true,
    "Large phone portrait 430x932 must activate portrait-compact-stage"
  );
  assert.equal(
    computePortraitCompactStage({ winW: 520, winH: 860, colW: 520, colH: 720 }),
    true,
    "Resized narrow portrait window 520x860 must activate portrait-compact-stage"
  );

  // Transient virtual keyboard shrink vs real rotation to landscape
  assert.equal(
    computePortraitCompactStage({
      winW: 390,
      winH: 360,
      colW: 390,
      colH: 220,
      wasCompact: true,
      lastCompactWinW: 390,
      isTextInputFocused: true,
    }),
    true,
    "On-screen keyboard shrinking innerHeight at identical portrait width must preserve compact overlay"
  );
  assert.equal(
    computePortraitCompactStage({
      winW: 844,
      winH: 390,
      colW: 844,
      colH: 290,
      wasCompact: true,
      lastCompactWinW: 390,
      isTextInputFocused: true,
    }),
    false,
    "Rotating phone to 844x390 landscape even with focused input must immediately exit portrait-compact-stage"
  );

  const appTsSrc = fs.readFileSync(path.resolve(process.cwd(), "src/ui/app.ts"), "utf8");
  const wbCssSrc = fs.readFileSync(path.resolve(process.cwd(), "src/styles/workbench.css"), "utf8");
  assert(
    !/navigator\.userAgent/i.test(appTsSrc),
    "app.ts must use pure space-budget math with zero User-Agent sniffing"
  );
  assert(
    appTsSrc.includes("evaluateCenterStageSpaceBudget") &&
      appTsSrc.includes("film-move-folder-select") &&
      appTsSrc.includes("prompt-focus-seg") &&
      appTsSrc.includes("▾ 收起看图") &&
      appTsSrc.includes("bindHorizontalWheelScroll") &&
      appTsSrc.includes("mobile-left-preset-bar") &&
      appTsSrc.includes("preset-select-left-mirror") &&
      appTsSrc.includes("solo-spread-chip") &&
      appTsSrc.includes("🫶 掰开差分"),
    "app.ts must include evaluateCenterStageSpaceBudget, touch folder-move select, prompt-focus-seg, ▾ 收起看图, bindHorizontalWheelScroll, synced mobile-left-preset-bar, and solo-spread-chip"
  );
  assert(
    wbCssSrc.includes(".col-center.portrait-compact-stage .filmstrip-bar:not(.expanded) .filmstrip-toolbar") &&
      wbCssSrc.includes(".col-center.portrait-compact-stage .filmstrip-bar.expanded") &&
      wbCssSrc.includes(".col-center.portrait-compact-stage .prompt-drawer:not(.collapsed)") &&
      wbCssSrc.includes('[data-prompt-focus="pos"]') &&
      wbCssSrc.includes('[data-prompt-focus="neg"]') &&
      wbCssSrc.includes(".mobile-left-preset-bar") &&
      wbCssSrc.includes(".preset-select-left-mirror"),
    "workbench.css must define portrait-compact-stage rules and mobile-left-preset-bar mirror rules"
  );
  // Anti-collision, up-front mobile preset bar (order: -1), & sleek mobile control size static guards
  const mobileMediaSlice = wbCssSrc.slice(wbCssSrc.indexOf("@media (max-width: 768px)"));
  assert(
    mobileMediaSlice.includes("flex: 1 1 100%;") &&
      /\.topbar-group-left\s*\{[\s\S]*?order:\s*-1;/m.test(mobileMediaSlice) &&
      mobileMediaSlice.includes('#app[data-mobile-col="left"] .topbar-group-left') &&
      /\.col-center\.portrait-compact-stage\s+\.prompt-drawer:not\(\.collapsed\)\s*\{[\s\S]*?top:\s*0;/m.test(
        wbCssSrc
      ) &&
      /\.col-center\.portrait-compact-stage\s+\.filmstrip-bar\.expanded\s*\{[\s\S]*?top:\s*0;/m.test(
        wbCssSrc
      ) &&
      !/font-size:\s*16px/i.test(mobileMediaSlice),
    "workbench.css must keep .topbar-group-left at order: -1 on <=768px, flex: 1 1 100% on wrapped prompt rows, top: 0 full-stage portrait overlays, and sleek <16px mobile control typography"
  );

  console.log(
    `PASS: Studio 2.0 Verified (${totalPrompts} scene prompts + 120 SF01~SF30 + ${kitchenVerifiedCount} Kitchen KTD01~KTD60/KT01~KT46 [maxPos=${maxKitchenPosTokens}<=500, MultiBox490=${maxMultiBox490PosTokens}<=490] + ${poolVerifiedCount} Pool PLD01~PLD22/PL01~PL11 [maxPos=${maxPoolPosTokens}<=500, PLD18=${maxPld18PosTokens}<=490] + ${specimenVerifiedCount} Specimen CV01~CV07 [maxPos=${maxSpecimenPosTokens}<=500, maxNeg=${maxSpecimenNegTokens}<=512] + ${bathroomVerifiedCount} Bathroom BT01~BT08 [maxPos=${maxBathroomPosTokens}<=500, maxNeg=${maxBathroomNegTokens}<=512] + ${houseworkVerifiedCount} Housework HWD01~HWD15 [maxPos=${maxHouseworkPosTokens}<=500, MultiBox490=${maxHouseworkMultiBoxPosTokens}<=490, maxNeg=${maxHouseworkNegTokens}<=512] + ${photoSubVerifiedCount} PhotoSubstitute PS01~PS04 [maxPos=${maxPhotoSubPosTokens}<=500, PS02=${maxPs02MultiBoxTokens}<=490, maxNeg=${maxPhotoSubNegTokens}<=512] + ${campingVerifiedCount} Camping CP01~CP12 [maxPos=${maxCampingPosTokens}<=500, MultiBox490=${maxCampingMultiBoxPosTokens}<=490, maxNeg=${maxCampingNegTokens}<=512] + ${afdVerifiedCount} AftersexDrip AFD01~AFD15 [maxPos=${maxAfdPosTokens}<=500, maxNeg=${maxAfdNegTokens}<=512] + ${onsenVerifiedCount} OnsenYukata ONS01~ONS55 [maxPos=${maxOnsenPosTokens}<=500, MultiBox490=${maxOnsenMultiBoxPosTokens}<=490, maxNeg=${maxOnsenNegTokens}<=512] + ${onsenSoloSpreadVerifiedCount} OnsenSoloSpread3Stage [maxPos=${maxOnsenSpreadPosTokens}<=500, maxNeg=${maxOnsenSpreadNegTokens}<=512] + ${carVerifiedCount} CarDuo CAR01~CAR20 [maxPos=${maxCarPosTokens}<=500, MultiBox490=${maxCarMultiBoxPosTokens}<=490, maxNeg=${maxCarNegTokens}<=512] + ${carSoloVerifiedCount} CarSolo3Stage CAR21~CAR25 [maxPos=${maxCarSoloPosTokens}<=500, maxNeg=${maxCarSoloNegTokens}<=512] + ${mtsVerifiedCount} Matsuri MTS01~MTS15 [maxPos=${maxMtsPosTokens}<=500, MultiBox490=${maxMtsMultiBoxPosTokens}<=490, maxNeg=${maxMtsNegTokens}<=512] = ${totalPrompts + 120 + kitchenVerifiedCount + poolVerifiedCount + specimenVerifiedCount + bathroomVerifiedCount + houseworkVerifiedCount + photoSubVerifiedCount + campingVerifiedCount + afdVerifiedCount + onsenVerifiedCount + onsenSoloSpreadVerifiedCount + carVerifiedCount + carSoloVerifiedCount + mtsVerifiedCount} total prompts: 83 Positions x2 + MA0~MA11 + 325 Other Actions + 29 3-Stage Solo Spread CG Variations + Free Action, 6 Swimwear Outfits + Scene-Bound Venue Lighting + CV01~CV07 + BT01~BT08 + HWD01~HWD15 + PS01~PS04 + CP01~CP12 + AFD01~AFD15 + ONS01~ONS55 + CAR01~CAR25 + MTS01~MTS15 Locks Verified, T5 32k vocab, Embedded M2 3-Slot Vibe + DPM++ 2M, Persistent Preset Delete, Local+LAN+Remote MCP Bridge Ready, zero Python).`
  );
}

main().catch((err) => {
  console.error("VERIFY FAILED:", err);
  process.exit(1);
});
