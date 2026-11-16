import assert from "node:assert/strict";
import {
  ALL_POSITIONS_CHAPTERS,
  EXPRESSION_PRESETS,
  MODEL_V4_5_FULL,
  MODEL_V5_FULL_MEDIUM,
  MODULE_SWITCH_PRESETS,
  MULTI_ANGLE_CHAPTERS,
  POS_STAGE_PRESETS,
  STORY_CHAPTERS,
} from "../src/data/engineConstants";
import { generateScenePrompts } from "../src/engine/storyEngine";
import { countPromptT5Tokens, initT5Tokenizer } from "../src/engine/t5Tokenizer";
import { createDefaultCharacterConfig } from "../src/engine/types";
import {
  buildNaiGeneratePayload,
  computeCanonicalPreciseRefCanvas,
  estimateNaiAnlas,
  uint8ArrayToBase64,
} from "../src/services/naiApiClient";

async function main(): Promise<void> {
  await initT5Tokenizer();

  // 1. Verify T5 exact SentencePiece tokenizer & all suites
  const cfg = createDefaultCharacterConfig();
  let totalPrompts = 0;
  for (const ch of [...STORY_CHAPTERS, ...MULTI_ANGLE_CHAPTERS, ...ALL_POSITIONS_CHAPTERS]) {
    const items = generateScenePrompts(ch.id, cfg, "pov");
    assert(items.length > 0, `Expected non-empty prompt list for ${ch.id}`);
    for (const it of items) {
      if (it.prompt.startsWith("[Base Prompt]")) continue;
      const tok = countPromptT5Tokens(it.prompt);
      assert.equal(tok.exact_spiece, true, "Expected exact SentencePiece tokenizer");
      assert(tok.api_pos_tokens <= 512, `${ch.id} exceeded 512 positive T5 tokens: ${tok.api_pos_tokens}`);
      totalPrompts++;
    }
  }

  // 2. Verify "仅锁人物" module switch strips built-in identity tags cleanly
  const charOnlyCfg = {
    ...createDefaultCharacterConfig(),
    ...MODULE_SWITCH_PRESETS["👤 精密参照：仅锁人物（保留本台画风+动作）"],
  };
  const s00RefPrompt = generateScenePrompts("S00", charOnlyCfg, "pov")[0].prompt;
  assert(!s00RefPrompt.includes("javelin (azur lane)"), "Identity tag must be stripped in char-only ref mode");
  assert(s00RefPrompt.includes("the girl"), "Generic prose subject 'the girl' must be used");

  // 3. Verify V4.5 Full Precise Reference payload builder (Chara单独 / Style+Chara混合 / 单图Chara&Style)
  const dummyPngA = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x01]);
  const dummyPngB = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x02]);
  const b64A = uint8ArrayToBase64(dummyPngA);
  const b64B = uint8ArrayToBase64(dummyPngB);
  assert.equal(Buffer.from(b64A, "base64").equals(Buffer.from(dummyPngA)), true);

  const v45Default = buildNaiGeneratePayload({
    model: MODEL_V4_5_FULL,
    rawPrompt: s00RefPrompt,
    width: 832,
    height: 1216,
    steps: 28,
    scale: 7.0,
    cfgRescale: 0.0,
    seed: 123456,
    preciseRefMetas: [{ mode: "character", strength: 1.0, fidelity: 1.0, base64Image: b64A }],
  });
  assert.equal(v45Default.payload.model, "nai-diffusion-4-5-full");
  assert.equal(v45Default.payload.use_new_shared_trial, true);
  assert.equal(v45Default.usedPreciseRef, true);
  assert.equal(v45Default.preciseRefCount, 1);
  const p45 = v45Default.payload.parameters as Record<string, unknown>;
  assert.equal(p45.params_version, 3);
  assert.equal(p45.steps, 28);
  assert.equal(p45.scale, 7);
  assert.equal(p45.sampler, "k_euler_ancestral");
  assert.equal(p45.noise_schedule, "karras");
  assert.equal(p45.normalize_reference_strength_multiple, false);
  assert.equal(p45.ucPreset, 0); // "heavy" default on V4.5 matches NovelAI Web UI default
  assert.equal(p45.tag_hint_uc_preset, 2);
  assert(
    String(p45.negative_prompt).includes("multiple views"),
    "Heavy UC preset must include 'multiple views' on V4.5 default"
  );
  assert(
    !String(p45.negative_prompt).startsWith("nsfw"),
    "UC must NOT prepend 'nsfw' when positive prompt contains nsfw"
  );
  assert(
    String(v45Default.payload.input || "").endsWith(", very aesthetic, masterpiece, no text"),
    "V4.5 Quality Tags: Standard must unconditionally append ', very aesthetic, masterpiece, no text' unless already ending with it"
  );
  assert(
    String((v45Default.payload.input as string) || "").includes("::"),
    "Inline negative weights (-2::...::) must remain intact in positive caption on V4.5 by default"
  );

  // Verify suffix is not duplicated if already at end of rawPrompt
  const v45NoDup = buildNaiGeneratePayload({
    model: MODEL_V4_5_FULL,
    rawPrompt: `${s00RefPrompt}, very aesthetic, masterpiece, no text`,
    appendV5Quality: true,
  });
  assert.equal(
    String(v45NoDup.payload.input || "").endsWith("very aesthetic, masterpiece, no text, very aesthetic, masterpiece, no text"),
    false,
    "Quality suffix must not duplicate if already at end"
  );

  // Verify explicit "none" UC omits ucPreset (API schema requires 0..3) and sends empty negative_prompt
  const v45NoneUc = buildNaiGeneratePayload({
    model: MODEL_V4_5_FULL,
    rawPrompt: s00RefPrompt,
    ucPresetMode: "none",
    keepInlineNegatives: true,
  });
  const p45None = v45NoneUc.payload.parameters as Record<string, unknown>;
  assert.equal(p45None.negative_prompt, "");
  assert.equal(p45None.tag_hint_uc_preset, 0);
  assert.equal("ucPreset" in p45None, false);
  assert.deepEqual(p45.director_reference_images, [b64A]);
  assert.deepEqual(p45.director_reference_descriptions, [
    {
      caption: { base_caption: "character", char_captions: [] },
      use_coords: false,
      use_order: false,
      legacy_uc: false,
    },
  ]);
  assert.deepEqual(p45.director_reference_information_extracted, [1]);
  assert.deepEqual(p45.director_reference_strength_values, [1]);
  assert.deepEqual(p45.director_reference_secondary_strength_values, [0]);

  const v45DualMix = buildNaiGeneratePayload({
    model: MODEL_V4_5_FULL,
    rawPrompt: s00RefPrompt,
    preciseRefMetas: [
      { mode: "character", strength: 0.95, fidelity: 0.85, base64Image: b64A },
      { mode: "style", strength: 1.0, fidelity: 0.9, base64Image: b64B },
    ],
  });
  assert.equal(v45DualMix.usedPreciseRef, true);
  assert.equal(v45DualMix.preciseRefCount, 2);
  const p45Dual = v45DualMix.payload.parameters as Record<string, unknown>;
  assert.equal(p45Dual.normalize_reference_strength_multiple, false);
  assert.deepEqual(p45Dual.director_reference_images, [b64A, b64B]);
  assert.deepEqual(p45Dual.director_reference_descriptions, [
    {
      caption: { base_caption: "character", char_captions: [] },
      use_coords: false,
      use_order: false,
      legacy_uc: false,
    },
    {
      caption: { base_caption: "style", char_captions: [] },
      use_coords: false,
      use_order: false,
      legacy_uc: false,
    },
  ]);
  assert.deepEqual(p45Dual.director_reference_information_extracted, [1, 1]);
  assert.deepEqual(p45Dual.director_reference_strength_values, [0.95, 1]);
  assert.deepEqual(p45Dual.director_reference_secondary_strength_values, [0.15, 0.1]);

  const v45SingleBoth = buildNaiGeneratePayload({
    model: MODEL_V4_5_FULL,
    rawPrompt: s00RefPrompt,
    ucPresetMode: "heavy",
    keepInlineNegatives: false,
    preciseRefMetas: [{ mode: "character&style", strength: 0.9, fidelity: 0.8, base64Image: b64A }],
  });
  const p45Both = v45SingleBoth.payload.parameters as Record<string, unknown>;
  assert.equal(p45Both.ucPreset, 0);
  assert(String(p45Both.negative_prompt).includes("lowres"), "Heavy UC preset must populate negative_prompt");
  assert.deepEqual(p45Both.director_reference_images, [b64A]);
  assert.deepEqual(p45Both.director_reference_descriptions, [
    {
      caption: { base_caption: "character&style", char_captions: [] },
      use_coords: false,
      use_order: false,
      legacy_uc: false,
    },
  ]);
  assert.deepEqual(p45Both.director_reference_strength_values, [0.9]);
  assert.deepEqual(p45Both.director_reference_secondary_strength_values, [0.2]);

  const v45Partial = buildNaiGeneratePayload({
    model: MODEL_V4_5_FULL,
    rawPrompt: s00RefPrompt,
    hasPreciseRef: true,
    preciseRefStrength: 0.85,
    preciseRefFidelity: 0.7,
  });
  const p45Part = v45Partial.payload.parameters as Record<string, unknown>;
  assert.deepEqual(p45Part.director_reference_strength_values, [0.85]);
  assert.deepEqual(p45Part.director_reference_secondary_strength_values, [0.3]);

  // 4. Verify V5 Full Medium never attaches director_reference_images
  const v5 = buildNaiGeneratePayload({
    model: MODEL_V5_FULL_MEDIUM,
    rawPrompt: s00RefPrompt,
    steps: 28,
    preciseRefMetas: [
      { mode: "character", strength: 1, fidelity: 1 },
      { mode: "style", strength: 1, fidelity: 1 },
    ],
  });
  const p5 = v5.payload.parameters as Record<string, unknown>;
  assert.equal(v5.payload.model, "nai-diffusion-5-full-medium");
  assert.equal(v5.usedPreciseRef, false);
  assert.equal(v5.preciseRefCount, 0);
  assert.equal(p5.steps, 14);
  assert.equal("director_reference_images" in p5, false);

  // 5. Verify Anlas cost calculation matches NovelAI UI (Opus + 1 Ref = 5 Anlas, + 2 Refs = 10 Anlas)
  assert.equal(
    estimateNaiAnlas({
      model: MODEL_V4_5_FULL,
      width: 832,
      height: 1216,
      steps: 28,
      isOpusFreeEligible: true,
      preciseRefCount: 2,
    }),
    10
  );
  assert.equal(
    estimateNaiAnlas({
      model: MODEL_V4_5_FULL,
      width: 832,
      height: 1216,
      steps: 28,
      isOpusFreeEligible: true,
      hasPreciseRef: true,
    }),
    5
  );
  assert.equal(
    estimateNaiAnlas({
      model: MODEL_V4_5_FULL,
      width: 832,
      height: 1216,
      steps: 28,
      isOpusFreeEligible: true,
      hasPreciseRef: false,
    }),
    0
  );
  assert.equal(
    estimateNaiAnlas({
      model: MODEL_V5_FULL_MEDIUM,
      width: 832,
      height: 1216,
      steps: 14,
      isOpusFreeEligible: true,
      hasPreciseRef: false,
    }),
    0
  );

  // 6. Verify canonical Precise Reference canvas normalization
  const geminiNorm = computeCanonicalPreciseRefCanvas(1536, 1024);
  assert.equal(geminiNorm.normWidth, 1536);
  assert.equal(geminiNorm.normHeight, 1024);
  assert.equal(geminiNorm.dx, 0);
  assert.equal(geminiNorm.dy, 0);

  const portNorm = computeCanonicalPreciseRefCanvas(832, 1216);
  assert.equal(portNorm.normWidth, 1024);
  assert.equal(portNorm.normHeight, 1536);

  const sqNorm = computeCanonicalPreciseRefCanvas(1024, 1024);
  assert.equal(sqNorm.normWidth, 1472);
  assert.equal(sqNorm.normHeight, 1472);

  // 7. Verify add_cat_ears add-on includes cat tail & triggers tail-wrap on All-Positions pull_out when penis is shown
  const catPullOutCfg = {
    ...createDefaultCharacterConfig(),
    add_cat_ears: true,
    pos_show_penis: true,
    pos_stage: "🔗 4. 事后拔出 · 脱出拉丝/外射（pull out · 刚拔出拉丝与穴口白浊流淌）",
  };
  for (const ch of ALL_POSITIONS_CHAPTERS) {
    const [item] = generateScenePrompts(ch.id, catPullOutCfg, "3rd");
    const tok = countPromptT5Tokens(item.prompt);
    assert(
      tok.api_pos_tokens <= 512,
      `${ch.id} with cat-tail pull_out exceeded 512 T5 tokens: ${tok.api_pos_tokens}`
    );
    assert(item.prompt.includes("cat tail"), `${ch.id} expected 'cat tail' when add_cat_ears=true`);
    const isNoPenisChannel = ["P43", "P44", "P45", "P46", "P47", "P48", "P49", "P50", "P51"].includes(
      ch.id
    );
    if (isNoPenisChannel) {
      assert(
        !item.prompt.includes("tail around penis"),
        `No-penis position ${ch.id} must not trigger tail wrap around penis`
      );
    } else {
      assert(
        item.prompt.includes("1.45::tail around penis::"),
        `${ch.id} must trigger 'tail around penis' on pull_out when pos_show_penis=true and add_cat_ears=true`
      );
      assert(
        item.subTitle.includes("🐾猫尾缠绕"),
        `${ch.id} subtitle must display 🐾猫尾缠绕 badge`
      );
    }
  }
  const catNoPenisItem = generateScenePrompts(
    "P01",
    { ...catPullOutCfg, pos_show_penis: false },
    "3rd"
  )[0];
  assert(
    !catNoPenisItem.prompt.includes("tail around penis"),
    "Must not wrap tail when pos_show_penis=false"
  );
  const catBeforeItem = generateScenePrompts(
    "P01",
    { ...catPullOutCfg, pos_stage: "🔥 1. 射精前 · 进行中（默认专注体位连接 · 无白浊）" },
    "3rd"
  )[0];
  assert(
    !catBeforeItem.prompt.includes("tail around penis"),
    "Must not wrap tail before pull_out stage"
  );

  // 8. Verify all EXPRESSION_PRESETS compile cleanly and stay <= 512 T5 tokens
  for (const exprKey of Object.keys(EXPRESSION_PRESETS)) {
    const exprCfg = { ...createDefaultCharacterConfig(), expr_preset: exprKey };
    for (const sid of ["S00", "S10", "P01"]) {
      const [item] = generateScenePrompts(sid, exprCfg, "pov");
      const tok = countPromptT5Tokens(item.prompt);
      assert(
        tok.api_pos_tokens <= 512,
        `${sid} with expr_preset=${exprKey} exceeded 512 T5 tokens: ${tok.api_pos_tokens}`
      );
    }
  }

  // 9. Verify All-Positions Japanese Dark Alley Trash-Can scene across all P01-P44
  const alleyCfg = {
    ...catPullOutCfg,
    pos_scene: "🗑️ 日式城市阴暗小巷·垃圾箱旁（alley, backstreet, trash can, garbage bag）",
  };
  for (const ch of ALL_POSITIONS_CHAPTERS) {
    const [item] = generateScenePrompts(ch.id, alleyCfg, "3rd");
    const tok = countPromptT5Tokens(item.prompt);
    assert(
      tok.api_pos_tokens <= 512,
      `${ch.id} with jp_dark_alley_trash exceeded 512 T5 tokens: ${tok.api_pos_tokens}`
    );
    assert(item.prompt.includes("1.35::alley::"), `${ch.id} missing alley tag`);
    assert(item.prompt.includes("1.35::trash can::"), `${ch.id} missing trash can tag`);
    assert(item.prompt.includes("garbage bag"), `${ch.id} missing garbage bag tag`);
    assert(item.subTitle.includes("🗑️阴暗后巷"), `${ch.id} missing alley badge in subtitle`);
  }

  // 10. Verify P45-P51 Manual-on-Female positions across all 4 stages & POV/3rd
  for (const stageKey of Object.keys(POS_STAGE_PRESETS)) {
    for (const pid of ["P45", "P46", "P47", "P48", "P49", "P50", "P51"]) {
      for (const pMode of ["pov", "3rd"] as const) {
        const [item] = generateScenePrompts(
          pid,
          { ...createDefaultCharacterConfig(), pos_stage: stageKey },
          pMode
        );
        const tok = countPromptT5Tokens(item.prompt);
        assert(
          tok.api_pos_tokens <= 512,
          `${pid} (${pMode}, ${stageKey}) exceeded 512 T5 tokens: ${tok.api_pos_tokens}`
        );
      }
    }
  }

  // 11. Verify Stage 5 Prolapse ("宫脱") across all positions + cat-tail wrap + morph 1A gaping unblock
  const prolapseCfg = {
    ...catPullOutCfg,
    morph_preset: "1A 幼态平板一线天（Flat Innie Slit）",
    pos_stage: "🌺 5. 事后宫脱 · 拔出带出子宫口白浊满溢（vaginal prolapse · 宫脱拉丝）",
  };
  for (const ch of ALL_POSITIONS_CHAPTERS) {
    const [item] = generateScenePrompts(ch.id, prolapseCfg, "3rd");
    const tok = countPromptT5Tokens(item.prompt);
    assert(
      tok.api_pos_tokens <= 512,
      `${ch.id} with prolapse stage exceeded 512 T5 tokens: ${tok.api_pos_tokens}`
    );
  }
  const [p01Prolapse] = generateScenePrompts("P01", prolapseCfg, "pov");
  assert(p01Prolapse.prompt.includes("1.55::vaginal prolapse::"), "Expected vaginal prolapse tag");
  assert(p01Prolapse.prompt.includes("anal prolapse"), "Expected anal prolapse in negative guard");
  assert(p01Prolapse.prompt.includes("1.45::tail around penis::"), "Expected cat-tail wrap on prolapse pull-out");
  assert(!p01Prolapse.prompt.includes(", gaping,"), "Expected 'gaping' unblocked from 1A morph neg during prolapse");

  // 12. Verify 5-artist lineless style + Contre-Jour lighting + Cherry-Blossom Shallow Water env across ALL 73 scenes
  const contreJourCfg = {
    ...createDefaultCharacterConfig(),
    style_preset: "🌸 五画师无描边柔涂厚彩风（shirabi + gomashio + dino + waterring + riichu）",
    lighting_preset: "🌅🌊 强逆光过曝眩光 · 自然暗面 + 水波焦散反射（Contre-Jour + Water Caustics）",
    env_preset: "🌸 落樱浅滩水波·粉霞晴空焦散（shallow water, cherry blossoms, caustics, pink sky）",
    pos_scene: "🌸 落樱浅滩水波·粉霞晴空焦散（shallow water, cherry blossoms, caustics, pink sky）",
  };
  for (const ch of [...STORY_CHAPTERS, ...MULTI_ANGLE_CHAPTERS, ...ALL_POSITIONS_CHAPTERS]) {
    for (const item of generateScenePrompts(ch.id, contreJourCfg, "3rd")) {
      if (item.prompt.startsWith("[Base Prompt]")) continue;
      const tok = countPromptT5Tokens(item.prompt);
      assert(
        tok.api_pos_tokens <= 512,
        `${ch.id} with Contre-Jour Style+Light+Env exceeded 512 T5 tokens: ${tok.api_pos_tokens}`
      );
      assert(!/\bsafe\b/i.test(item.prompt), `${ch.id} must not leak 'safe' rating tag`);
    }
  }
  const [p01Cj] = generateScenePrompts("P01", contreJourCfg, "3rd");
  const causticsCount = (p01Cj.prompt.match(/1\.35::caustics::/g) || []).length;
  assert.equal(causticsCount, 1, "Expected deduplicated 1.35::caustics:: when both lighting and env include caustics");

  // 13. Verify 4-artist fine brown colored-lineart style + Window Sidelight + Sunlit Bedroom env across ALL 73 scenes
  const askCiloCfg = {
    ...createDefaultCharacterConfig(),
    style_preset: "☕ 四画师细棕彩线空气感瓷肌风（ask 0.65 + ciloranko 0.58 + kuroduki + yahako）",
    lighting_preset: "☀️ 窗边过曝白昼侧逆光 · 暖金轮廓柔光（Window Sidelight & Golden Rim）",
    env_preset: "🪟 晨光纱帘白床明亮卧室（bright window, curtains, sunlit bedroom, white bedsheet）",
    pos_scene: "🪟 晨光纱帘白床明亮卧室（bright window, curtains, sunlit bedroom, white bedsheet）",
  };
  for (const ch of [...STORY_CHAPTERS, ...MULTI_ANGLE_CHAPTERS, ...ALL_POSITIONS_CHAPTERS]) {
    for (const item of generateScenePrompts(ch.id, askCiloCfg, "3rd")) {
      if (item.prompt.startsWith("[Base Prompt]")) continue;
      const tok = countPromptT5Tokens(item.prompt);
      assert(
        tok.api_pos_tokens <= 512,
        `${ch.id} with Ask+Ciloranko Style+Light+Env exceeded 512 T5 tokens: ${tok.api_pos_tokens}`
      );
      assert(!/\bsafe\b/i.test(item.prompt), `${ch.id} must not leak 'safe' rating tag`);
    }
  }

  console.log(
    `PASS: Verified ${totalPrompts} scene prompts, T5 32k vocab, V4.5 Full Character Precise Reference payload & Anlas estimator (zero Python).`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
