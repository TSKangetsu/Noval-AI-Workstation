---
name: nai-v4-prompt-debugger
description: >-
  Diagnoses and fixes broken NovelAI V4 / V4.5 / V5 prompts, including
  512-token overflow, non-nesting :: weight delimiter leaks, tag collisions,
  V5 artist-cluster and CFG collapse, camera/POV framing flips, world-scale
  drift, pixel-art smoothing, and anatomy rendering defects. Activate only when
  troubleshooting, auditing, or repairing prompt issues rather than during
  normal creative prompt authoring.
---

# NovelAI V4 / V4.5 / V5 Prompt Debugger & Physics Reference

Activate this skill when troubleshooting low prompt adherence, broken weight syntax, token truncation, tag collisions, camera/POV flips, style/lighting instability, or rendering artifacts in NovelAI Diffusion V4, V4.5, and V5.

## 1. Hard Syntax, Parser & Token Physics

1. **512 T5 Token Ceiling & V4.5 Vibe Budget**:
   - Base Prompt + all `[Character N]` boxes share a single **512 T5 token limit** (keep positive tokens `<= 502` to leave room for quality suffixes).
   - **V4.5 Vibe Transfer Reservation**: Each active Vibe slot in V4.5 reserves `34` T5 context tokens (`502 - 34 * activeVibeCount`, e.g., `<= 400` tokens when 3 Vibes are active). Exceeding this silently truncates tail tokens. Active V4.5 Vibes also pair with **`DPM++ 2M` (`k_dpmpp_2m`)** (`0 Anlas` on Opus for `<= 4` pre-encoded vibes; `Scale ~ 5.0, cfg_rescale ~ 0.28` avoids multi-vibe burn).
   - **Exact Comma Tokenization Around `w::...::`**: When counting SentencePiece T5 tokens, preserve commas `,` adjacent to `::` blocks without stripping punctuation or injecting phantom leading `▁` spaces (stripping commas undercounts prompts by `25–45` tokens).
   - **Trimming Strategy on Overflow**: Deduplicate redundant quality headers (if `masterpiece, very aesthetic` is already at the start, only `, no text` is needed at the tail) and prune synonymous tag pairs (`nude` + `completely nude`, `looking down` + `looking at viewer`) before trimming expressive T5 prose.

2. **Model-Specific Positive / Negative Routing**:
   - **V4.5 Full (`nai-diffusion-4-5-full`) & V5 Full High (`nai-diffusion-5-full`, 28 steps)**: Natively support separated `v4_prompt` and `v4_negative_prompt` (`512 + 512` independent T5 budgets). Route `-2::...::` scene suppressions into `v4_negative_prompt`.
   - **Fractional Positive Counterweights (`|w| < 1.0`)**: Gentle counterweights such as `-0.45::wide hips::, -0.45::thick thighs::, -0.40::plump::` and positive-space facial counterweights (`-2.5::nose bridge, nostrils, lips::`) **must remain in the Positive prompt**—moving `-0.45::wide hips::` into Negative UC turns it into a full `-1.0` suppression.
   - **V5 Full Medium (`nai-diffusion-5-full-medium`, 14 steps)**: Ignores custom `negative_prompt` server-side; inject critical scene/custom negatives inline as `-2::...::` inside `base_caption` when targeting Medium.
   - **Opus Usage Note**: V4.5 Full (`<=28` steps, `<=1,048,576 px`) is unlimited `0 Anlas` on Opus; V5 High (`<=28` steps) and V5 Medium (`14` steps) draw from the recovering Opus V5 Usage Pool.
   - **Character Box Hygiene**: Avoid stuffing massive `-3::long negative list::` blocks inside `[Character N]` boxes (disrupts local pose attention); reserve local inline negatives for targeted anti-bleed fixes (e.g., `-2.5::clothes, skirt, panties::` on an unclothed split panel).

3. **`::` Weight Delimiter Safety (Non-Nesting Blocks & `:3` Emoticons)**:
   - **Colon-Prefixed Emoticons (`:3`)**: Never wrap `:3` in weight syntax (`1.2:::3::` creates corrupt `:::` triple-colon tokens); keep `:3, closed mouth` unweighted (omit `smug` and pair with `open eyes` if crisp open eyes are wanted instead of half-lidded eyes).
   - **Never Nest `w::tag::` Inside `-2::...::`**: NovelAI `::` delimiters do not nest. Writing `-2::a, 1.8::labia::, b::` closes the `-2::` block right after `1.8::`, dumping bare `1.8` into Negative and leaking `labia::, b::` into Positive! Always unwrap inner weights before placing tags inside `-2::...::` or negative lists.

---

## 2. Common Tag Collisions & Optical Framing Fixes

### 1. Camera Crop Drift & Pure Rear-POV 180° "Owl Head-Turn"
- **Upper-Body Crop Taking Over**: Putting micro-facial tags ahead of camera framing—or putting heavy `-4::full body::` in Negative—crops off hips and thighs. Fix by placing framing (`full body` or `from below, low angle, cowboy shot`) early and suppressing `-2::upper body, portrait, headshot::` instead if the crop stays too tight.
- **Rear-POV 180° Neck Twist**: In a strict rear-entry POV (`from behind, pov`), leaving front-only iris, expression, or chest tags (`gradient eyes, smug, blush stickers, bare breasts, nipples, midriff, navel`) or `looking back` contradicts first-person optics, forcing V5 to twist the character's neck 180° or rotate her chest sideways.
  - **Fix (when pure back/back-of-head POV is intended)**: Anchor `pov, pov hands, pov crotch, from behind, back, facing away, back of head, bare back, shoulder blades, spine`, omit unseen facial/front-torso tags in Positive, and add `looking back, looking at viewer, face, eyes, front view, bare breasts, nipples, navel` to Negative UC. (Similarly, in frontal 1st-person POV, add `male back, male head, male shoulders, over-the-shoulder` to Negative UC if a broad partner back blocks the lower frame.)

### 2. Pixel Art Smoothing vs. Muddy Fluid Blocks
- **Too Smooth / Cel-Shaded**: `masterpiece, very aesthetic` push V5 toward anti-aliased commercial anime rendering. Drop them in favor of `best quality, 1.7::pixel art::, 16-bit, 1.3::dithering::, -1.5::realistic, smooth shading, anti-aliasing::` (dialing `pixel art` between `1.4` fine and `2.2` chunky).
- **Fluids Turning into Solid Yellow Patches**: Remove `limited palette` (forces translucent white fluids into opaque retro color blocks); use `soft colors, 16-bit, 1.3::dithering::` instead.

### 3. Literal `mosaic` Censorship Collision
- **Cause & Fix**: Writing `mosaic` (e.g., for mosaic tile floors or abstract backgrounds) in an NSFW prompt triggers `mosaic censoring` over anatomy. Replace with `patterned tiles, geometric glass, glitch, dithering, chromatic aberration`.

### 4. Anatomy & Fluid Distortion Diagnostics
- **Model Check**: Confirm a `Full` model (`nai-diffusion-4-5-full` or `nai-diffusion-5-full`), as Curated models lack explicit anatomy priors.
- **Over-Weighting & Tag-Interference Check**: If explicit anatomy renders rubbery, occluded, or unintentionally dilated, test dialing weights back toward clean `1.0x` Booru tags (`rating:explicit` in Base + `nude, uncensored, pussy, spread pussy, cumdrip, pussy juice`) as a calm diagnostic baseline, and check for specific culprit tags:
  - `gaping`: Pulls V5 toward wide dark cavities and pushes cum outside the rim (keep in UC if a snug opening is intended).
  - `hands between legs` (or missing `covering crotch` in UC on low-angle shots): Can trigger inward hand-covering reflexes.
  - `cameltoe` on nude bodies: Draws hard fabric-like creases across bare skin.
  - `pink pussy` alongside `miniskirt` in single-box prompts: Can bleed color/cloth concepts into phantom `pink panties` (use `[Character N]` split boxes for clothed/unclothed comparisons).

---

## 3. NovelAI V5 Latent Convergence Quirks & Diagnostic Baselines

NovelAI V5 (`nai-diffusion-5-full`, DiT + bidirectional text encoder) differs sharply from V4.5 on artist mixing, early-token layout locking, and CFG behavior:

### 1. Modern-Illustration Super-Attractor ("Outlier Resonance")
- **Symptom**: Mixing a high-weight (`>= 0.50`) modern sleek-illustration artist (e.g., `artist:mikozin`, `artist:kasumi (skchkko)`, `artist:neit ni sei`—which resonate strongly with V5's native `~6.0–6.5H` prior) alongside classic rounded `~4.5H` Moe artists works as an even blend in V4.5, **but can collapse ~90% into the modern basin in V5**, flattening iris gradients, muting outlines, or elongating proportions.
- **Diagnostic Fix (When Preserving a Specific Target Style Cluster)**: Keep ~85–100% of primary artist weight within the desired style family, and place out-of-cluster color/lighting seasoning artists **at the end of the artist list at low trace weights (`<= 0.15 ~ 0.20`)**. (When intentionally exploring bold hybrid or modern styles, mix freely without this cap.)

### 2. Early-Slot Layout Primacy & Tail Natural-Language Prose Authority
- **Quirk**: V5 has no 77-token cliff, but early denoising steps (`steps 1–6`) weight **first-slot camera framing and lead artist tags** heavily for bone/canvas layout, while scattered mid-prompt Booru tags dilute past `~220` tokens. Conversely, **expressive natural-language English T5 sentences at the end of the prompt retain strong global spatial, mood, and compositional authority**.
- **Diagnostic Re-Ordering Baseline (When Trailing Framing or Props Are Ignored)**:
  1. **Quality & Camera Framing** (`full body`, `from below`, `wide shot` placed *before* micro-facial details)
  2. **Artist Palette** (primary style leads first, subtle color/texture seasoning last)
  3. **Silhouette / Stature** (only if a specific non-default height/build needs anchoring)
  4. **Subject, Outfit, Environment & Action**
  5. **Facial Expression, Gaze & Fine Ornaments**
  6. **Expressive Natural-Language T5 Scene Prose** (coherent prose tying together mood, lighting atmosphere, spatial relationships, and storytelling action)

### 3. 14-Step Distilled (`Medium`) vs. 28-Step Full (`High`)
- **Symptom & Fix**: V5's 14-step distilled Medium model snaps stylized proportions (such as compact chibi-leaning or petite builds) back toward standard `6H` commercial proportions and ignores separate Negative UC. Switch to **28-step `nai-diffusion-5-full`** with explicit Negative UC when stylized proportions or fine cross-seed control are failing on Medium.

### 4. Native CFG Scale Sweet Spots & Bimodal Artist Lighting Clash
- **CFG Calibration**:
  - **V5 Full**: Natively balanced around **`Scale = 6.5 ~ 7.0` (`cfg_rescale = 0.0`)** for smooth backlit halation and tonal roll-off. (Leftover V4.5 settings like `Scale ~ 5.0, cfg_rescale ~ 0.25` look washed out in V5.)
  - **V4.5 Full**: Prefers **`Scale = 5.0 ~ 5.5`** (or `cfg_rescale = 0.18 ~ 0.25`); running V4.5 at `7.0 / 0.0` can over-saturate cel shadows and harden outlines.
- **Seed-to-Seed Lighting Oscillation**: Pairing equal-weight opposing lighting artists (e.g., luminous backlit `mikozin` vs heavy dark-shadow `neit ni sei`, or bimodal artists like `tonda` that shift sepia under `backlighting` in V5) can cause erratic brightness swings across seeds. Diagnose by testing lighting artists solo under `backlighting` and keeping opposing shadow-structural artists at lighter auxiliary weights (`~0.16–0.24`) if consistent luminosity is desired.

### 5. Projective Scale Blindness (Indoor "Giant-Head Adult" Drift)
- **Symptom & Fix**: Head-to-body ratio alone is scale-invariant on plain backgrounds, so petite characters indoors sometimes render as doorway-filling `180cm` figures with enlarged heads. When true small world-scale is needed, pair stature tags (`short female, petite, small frame`) with a slight downward viewer angle (`slightly from above`), **one environmental scale cue** (`tall wooden door, high doorknob`, `sitting on bed, dangling legs, feet off floor`, or `oversized cardigan, sleeves past wrists`), and `giantess, towering, miniature furniture, low doorframe` in Negative UC.
