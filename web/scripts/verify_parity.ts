import { execFileSync } from "node:child_process";
import * as path from "node:path";
import { BUNDLED_CUSTOM_PRESETS } from "../src/data/engineConstants";
import { generateScenePrompts } from "../src/engine/storyEngine";
import { countPromptT5Tokens, initT5Tokenizer } from "../src/engine/t5Tokenizer";
import { createDefaultCharacterConfig, type CharacterConfig } from "../src/engine/types";

const PYTHON_EXE = "C:\\Users\\x4030\\AppData\\Local\\Programs\\Python\\Python313\\python.exe";
const ROOT_DIR = path.resolve(import.meta.dirname, "..", "..");

interface ProfileCase {
  name: string;
  cfg: CharacterConfig;
}

const hood2Raw = (BUNDLED_CUSTOM_PRESETS["⭐ hood2"] ?? {}) as Partial<CharacterConfig>;

const profiles: ProfileCase[] = [
  {
    name: "1. Default Javelin 3rd-person",
    cfg: { ...createDefaultCharacterConfig(), perspective_mode: "3rd" },
  },
  {
    name: "2. POV + include_sub_variants",
    cfg: {
      ...createDefaultCharacterConfig(),
      perspective_mode: "pov",
      include_sub_variants: true,
    },
  },
  {
    name: "3. Custom Preset hood2 (M6-Tune2)",
    cfg: { ...createDefaultCharacterConfig(), ...hood2Raw },
  },
  {
    name: "4. M6 + 3D Camera Override (42°, +12°, wide+dutch)",
    cfg: {
      ...createDefaultCharacterConfig(),
      style_preset: "🌤️ 柔雾白纱晨光 · 无描边暖杏真肤二次元萌脸（M6 保留款 · 自然光真肤）",
      cam_enable_override: true,
      cam_azimuth: 42,
      cam_elevation: 12,
      cam_shot_preset: "近景半身 (Upper Body)",
      cam_wide_lens: true,
      cam_dutch_angle: true,
    },
  },
  {
    name: "5. All-Positions Transparent BG + Invisible Male + No Penis",
    cfg: {
      ...createDefaultCharacterConfig(),
      pos_transparent_bg: true,
      pos_male_mode: "🫥 完全隐形男方（空气互动感 invisible partner）",
      pos_show_penis: false,
      perspective_mode: "3rd",
    },
  },
  {
    name: "6. C5 Pixel Art + Single Pair S03/S04 + Multi-Angle NSFW",
    cfg: {
      ...createDefaultCharacterConfig(),
      style_preset: "原生大颗粒 16-bit 像素游戏 CG 风（C5 推荐 · 小画布直出 + 3x 硬邻近方块放大）",
      multi_panel_mode: "single_pair",
      enable_multi_angle_nsfw: true,
      perspective_mode: "pov",
    },
  },
  {
    name: "7. Expression Override + Eye/Mouth/Heart-Pupil + Override Sleeping",
    cfg: {
      ...createDefaultCharacterConfig(),
      expr_preset: "😵‍💫 迷离失神·融化恍惚（torogao, bedroom eyes, open mouth, saliva, heavy blush）",
      expr_eye_state: "😳 睁大惊愕眼 (1.3::wide-eyed::)",
      expr_mouth_state: "🥵 伸舌滴涎 (1.35::tongue out::, drooling)",
      expr_brow_blush: "🌺 浓重潮红+八字眉 (furrowed brow, heavy blush)",
      expr_heart_eyes: true,
      expr_tears: true,
      expr_override_sleeping: true,
      custom_expression_tags: "fainted, steam",
    },
  },
  {
    name: "8. Expression Sleeping Preset + 3D Camera Override",
    cfg: {
      ...createDefaultCharacterConfig(),
      expr_preset: "😴 安睡沉眠·呼吸微张（sleeping, closed eyes, relaxed, parted lips）",
      expr_empty_eyes: false,
      cam_enable_override: true,
      cam_azimuth: -35,
      cam_elevation: 20,
      perspective_mode: "3rd",
    },
  },
  {
    name: "9. All-Positions Stage: During (Climax/Internal Cumshot)",
    cfg: {
      ...createDefaultCharacterConfig(),
      pos_stage: "💦 2. 射精中 · 内射/迸发瞬间（climax / internal cumshot · 白浊喷涌）",
      pos_show_penis: true,
      perspective_mode: "pov",
    },
  },
  {
    name: "10. All-Positions Stage: After-Inside (No Penis)",
    cfg: {
      ...createDefaultCharacterConfig(),
      pos_stage: "🌊 3. 射精后 · 结合留存溢流（after ejaculation · 仍保持结合白浊满溢）",
      pos_show_penis: false,
      perspective_mode: "3rd",
    },
  },
  {
    name: "11. All-Positions Stage: Pull-Out (Cum Strings/Overflow)",
    cfg: {
      ...createDefaultCharacterConfig(),
      pos_stage: "🔗 4. 事后拔出 · 脱出拉丝/外射（pull out · 刚拔出拉丝与穴口白浊流淌）",
      pos_show_penis: true,
      pos_transparent_bg: true,
      perspective_mode: "pov",
    },
  },
];

const pyScript = `
import json, sys
sys.path.insert(0, r"${ROOT_DIR}")
from story_engine import CharacterConfig, generate_scene_prompts, STORY_CHAPTERS, MULTI_ANGLE_CHAPTERS, ALL_POSITIONS_CHAPTERS
from nai_api import count_prompt_t5_tokens

profiles = json.loads(sys.stdin.read())
all_ids = [c["id"] for c in (STORY_CHAPTERS + MULTI_ANGLE_CHAPTERS + ALL_POSITIONS_CHAPTERS)]
out = []
for p in profiles:
    cfg = CharacterConfig(**p["cfg"])
    items_map = {}
    for sid in all_ids:
        res = []
        for sub_t, canvas, prompt in generate_scene_prompts(sid, cfg):
            tok = count_prompt_t5_tokens(prompt)
            res.append({"subTitle": sub_t, "canvas": canvas, "prompt": prompt, "tok": tok})
        items_map[sid] = res
    out.append({"name": p["name"], "ids": all_ids, "items": items_map})
print(json.dumps(out, ensure_ascii=False))
`;

async function main() {
  await initT5Tokenizer();
  const pyJson = execFileSync(PYTHON_EXE, ["-c", pyScript], {
    input: JSON.stringify(profiles),
    encoding: "utf-8",
    maxBuffer: 64 * 1024 * 1024,
  });
  const pyResults = JSON.parse(pyJson) as Array<{
    name: string;
    ids: string[];
    items: Record<string, Array<{ subTitle: string; canvas: string; prompt: string; tok: Record<string, number | boolean> }>>;
  }>;

  let totalPrompts = 0;
  let mismatches = 0;
  let maxPosTok = 0;
  let maxNegTok = 0;
  let maxTokDiff = 0;

  for (let i = 0; i < profiles.length; i++) {
    const prof = profiles[i];
    const pyData = pyResults[i];
    for (const sid of pyData.ids) {
      const pyItems = pyData.items[sid];
      const tsItems = generateScenePrompts(sid, prof.cfg);

      if (tsItems.length !== pyItems.length) {
        console.error(`[COUNT MISMATCH] ${prof.name} | ${sid}: py=${pyItems.length}, ts=${tsItems.length}`);
        mismatches++;
        continue;
      }

      for (let j = 0; j < pyItems.length; j++) {
        totalPrompts++;
        const py = pyItems[j];
        const ts = tsItems[j];
        if (py.subTitle !== ts.subTitle || py.canvas !== ts.canvas || py.prompt !== ts.prompt) {
          mismatches++;
          console.error(`[PROMPT DIFF] ${prof.name} | ${sid}[${j}]`);
          if (py.subTitle !== ts.subTitle) console.error("  subTitle py:", py.subTitle, "\n  subTitle ts:", ts.subTitle);
          if (py.canvas !== ts.canvas) console.error("  canvas py:", py.canvas, "\n  canvas ts:", ts.canvas);
          if (py.prompt !== ts.prompt) {
            // Find first diff index
            let k = 0;
            while (k < py.prompt.length && k < ts.prompt.length && py.prompt[k] === ts.prompt[k]) k++;
            console.error(`  prompt diff at char ${k}:\n    py: ${py.prompt.slice(Math.max(0, k - 30), k + 80)}\n    ts: ${ts.prompt.slice(Math.max(0, k - 30), k + 80)}`);
          }
          if (mismatches >= 10) {
            throw new Error("Aborting after 10 diffs");
          }
        }
        const tsTok = countPromptT5Tokens(ts.prompt);
        const posDiff = Math.abs(Number(py.tok.api_pos_tokens) - tsTok.api_pos_tokens);
        const negDiff = Math.abs(Number(py.tok.api_neg_tokens) - tsTok.api_neg_tokens);
        maxTokDiff = Math.max(maxTokDiff, posDiff, negDiff);
        if (posDiff !== 0 || negDiff !== 0) {
          mismatches++;
          console.error(`[TOKEN DIFF] ${prof.name} | ${sid}[${j}]: py=${JSON.stringify(py.tok)} ts=${JSON.stringify(tsTok)}`);
        }
        maxPosTok = Math.max(maxPosTok, tsTok.api_pos_tokens);
        maxNegTok = Math.max(maxNegTok, tsTok.api_neg_tokens);
      }
    }
    console.log(`PASS profile: ${prof.name} (66 scenes checked)`);
  }

  console.log(`\nPARITY SUMMARY: checked ${totalPrompts} generated prompts across ${profiles.length} profiles (all 66 scenes each).`);
  console.log(`Mismatches: ${mismatches} | Max T5 token diff: ${maxTokDiff} | Max API pos=${maxPosTok}/512, max neg=${maxNegTok}/512`);
  if (mismatches > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
