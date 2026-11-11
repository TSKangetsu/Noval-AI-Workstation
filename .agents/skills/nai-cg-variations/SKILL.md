---
name: nai-cg-variations
description: >-
  Guides creation of high-resolution character variations (CG expressions,
  outfit states, and Before & After split-screen comparisons) in NovelAI V4/V5
  without trait bleeding or resolution loss. Use this skill when generating
  Before & After diffs, 2koma comic splits, or upscaling multi-panel outputs.
---

# NovelAI Character Variations & Split-Screen Diff Workflow

Use this skill when building Before & After prompts (left clothed with underwear vs. right unclothed explicit state), expression/outfit variations (人物差分), or solving low-resolution crops.

## 1. Golden Architecture for `Before & After` Split Screens (NAI V5 / V4 Multi-Character)

Single-box `2koma` prompts inevitably suffer from **concept bleeding** when the left side requires `miniskirt, white panties` and the right side requires `nude, spread pussy` (either the right side grows phantom pink/yellow panties, or global anti-panty negatives strip the left side and blur the crotch).

**Always prefer Multi-Character Regional Partition (`+ Add Character`)**:

1. **Canvas**: Landscape `1216x832` (or Square `1024x1024` so each half gets a taller, sleeker `512x1024` 1:2 vertical strip!).
2. **Base Prompt (Layout, Style & Global Camera Only — ~65 Tokens)**:
   - Use canonical comic border tags to force a clean physical split down the center (avoid `multiple views` in V5, as V5's default hidden UC suppresses it):
     ```text
     2::2koma::, 2::vertical split screen::, comic, vertical border, gutter, before and after, 2girls, same character, best quality, [style tags], from below, low angle, [scene tags], rating:explicit, nsfw, uncensored, [global style/proportion negative weights]
     ```
3. **Character Positioning (`Custom` Grid)**:
   - Switch Position from `AI's Choice` to **`Custom`**.
   - Place **Character 1** at the far-left column (`A3`) and **Character 2** at the far-right column (`E3`) to maximize separation and prevent elbow/border merging.
4. **Character 1 Box (Left — Clothed + Underwear Kept)**:
   - Identical character hair/eye/accessory/proportion prefix + detailed canonical outfit + `white panties, underwear, upskirt` + pure expression (`cute face, slight smile, blush`).
5. **Character 2 Box (Right — Unclothed + Clean `1.0x` Explicit State)**:
   - Identical character hair/eye/accessory/proportion prefix (optionally keeping signature small accessories like `thigh strap` or hairpins) + `spread legs, completely nude, uncensored, nipples, pussy, spread pussy, after vaginal, cum in pussy, cumdrip, pussy juice` + `torogao, bedroom eyes, half-closed eyes, blush, slight smile, heavy breathing` + `-2.5::clothes, bustier, skirt, sleeves, panties::`.

## 2. High-Resolution Post-Processing Workflows

1. **Crop First -> Low-Denoise Img2Img Hires Redraw**:
   - Never run simple Upscale before cropping if fine details are soft. Crop the `2koma` into left and right panels first, send each to `832x1216` **Img2Img** (`Strength: 0.32 ~ 0.40`, `Noise: 0.0 ~ 0.05`) to rebuild crisp lines, then Enhance/Upscale.
2. **True Pixel-Art Downsample Trick**:
   - For authentic indie-game pixel grids, resize finished art down to `25%` and back up to `400%` using **Nearest Neighbor** interpolation.
3. **Inpaint Micro-Fix for Logos/Icons**:
   - For exact geometric emblems (e.g., a 4-pointed Gemini sparkle hairpin `✦`), sketch a rough colored cross on NAI's built-in Draw canvas and run regional **Inpaint** at `Strength: 0.45 ~ 0.55` so it inherits matching 16-bit pixel dithering naturally without flat Photoshop paste artifacts.
