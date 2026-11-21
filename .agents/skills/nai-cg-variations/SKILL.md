---
name: nai-cg-variations
description: >-
  Practical reference for creating multi-panel Before & After split-screen
  comparisons (2koma), expression/outfit CG variations, and high-resolution
  panel redraws in NovelAI V4.5 / V5 without cross-panel trait bleeding.
---

# NovelAI Character Variations & Split-Screen (`2koma`) Guide

Use this reference when composing Before & After split-screen comparisons (e.g., clothed left panel vs. contrasting right panel), character expression/costume variations (人物差分), or crisp high-resolution panel refinements.

## 1. Anti-Bleed Multi-Character Layout for `Before & After` Split Screens

Single-box `2koma` prompts frequently suffer from **cross-panel concept bleeding** whenever one half is clothed (`miniskirt, white panties`) and the other half is unclothed or in a contrasting state (clothing colors bleed onto the unclothed side, or anti-clothing negatives strip the clothed side).

Using **Multi-Character Regional Partitioning (`[Base Prompt]` + `[Character 1]` + `[Character 2]`)** cleanly isolates each half:

1. **Canvas**: Landscape `1216x832` or Square `1024x1024` (gives each side a sleek `512x1024` 1:2 vertical strip).
2. **Base Prompt (Shared Split Framing, Style, Lighting & Atmosphere)**:
   - Anchor a clean physical comic divider in `[Base Prompt]` (omit `multiple views` in V5, as V5's built-in priors suppress turnaround-sheet layouts in split scenes):
     ```text
     2::2koma::, 2::vertical split screen::, comic, vertical border, gutter, before and after, 2girls, same character, best quality, <style & lighting>, <camera & environment>
     ```
3. **Left / Right Grid Placement**:
   - Anchor **`[Character 1 (A3)]`** on the far-left column and **`[Character 2 (E3)]`** on the far-right column to maximize spatial separation across the center border.
4. **Character 1 Box (`A3` — Left Panel State)**:
   - Shared character identity/hair/eye/ornament tags + "Before" outfit, posture, gaze, and mood (e.g., composed expression, intact attire).
5. **Character 2 Box (`E3` — Right Panel State)**:
   - Matching character identity/hair/eye tags (optionally keeping signature small accessories like hairpins or thigh straps for continuity) + "After" posture, emotional expression, and state details, paired with a compact local negative (`-2.5::clothes, skirt, sleeves, panties::`) if the left panel's outfit tries to bleed across.

## 2. Optional Post-Processing Techniques for Crisp Variations

1. **Panel Crop -> Low-Denoise Img2Img Redraw**:
   - If fine facial or line details feel soft inside a `2koma` split, crop the left and right panels into standalone portraits (`832x1216`) first, run a gentle **Img2Img** pass (`Strength: 0.32 ~ 0.40`, `Noise: 0.0 ~ 0.05`) to sharpen linework at full single-character resolution, and upscale afterward if desired.
2. **Nearest-Neighbor Snap for Authentic Pixel Art**:
   - For crisp retro pixel-art sprites, downsampling finished art to `25%` and scaling back to `400%` with **Nearest Neighbor** interpolation locks clean pixel edges.
3. **Regional Draw + Inpaint for Exact Emblems**:
   - For specific geometric ornaments (such as a 4-pointed star hairpin `✦`), sketching a simple color hint on NAI's Draw canvas and running regional **Inpaint** (`Strength: 0.45 ~ 0.55`) lets the emblem inherit surrounding lighting and brushwork naturally.
