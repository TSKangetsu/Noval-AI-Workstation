---
name: nai-v4-prompt-debugger
description: >-
  Diagnoses and fixes NovelAI V4 / V4.5 / V5 prompt adherence issues, V5 latent
  convergence quirks, artist order & outlier-weight collapse, 512-token
  overflow, tag conflicts, camera framing errors, true-height world scale, pixel
  art granularity, default outfit locks, and anatomy rendering defects. Use this
  skill when the user asks to analyze, debug, optimize, or write NovelAI V4/V5
  prompts.
---

# NovelAI V4 / V4.5 / V5 Prompt Architect & Debugger

Use this skill when diagnosing low prompt adherence, conflicting tags, framing issues, pixel art texture problems, or anatomy glitches in NovelAI Diffusion V4 / V4.5 / V5.

## Core V4 / V5 Syntax & Token Budget Rules

1. **Strict 512-Token Cap**:
   - Total tokens across Base Prompt + all Character Prompt boxes **must stay well under 512 tokens** (aim for `220 ~ 280` tokens total).
   - Eliminate synonymous pairs (`nude` + `completely nude`, `pixel art` + `pixel art style`, `looking down` + `looking at viewer`) and bloated T5 prose when multi-character boxes are active.
   - **Smart Quality Suffix Deduplication & Prose Trimming**: If the prompt header already includes `masterpiece` and `very aesthetic`, append only `, no text` (`+2` tokens) rather than duplicating `, very aesthetic, masterpiece, no text` (`+7` tokens). When multi-preset stacking exceeds `510` positive T5 tokens, progressively trim trailing T5 prose clauses from the right while keeping 100% of Danbooru tags intact.
   - **V4.5 Vibe Transfer Token Reservation & Exact Comma Tokenization**:
     - NovelAI V4.5 reserves context budget for each active Vibe Transfer slot (`502 - 34 * activeVibeCount`, e.g., `<= 400` positive T5 tokens when 3 Vibes are active, plus Web UI Quality Toggle suffix headroom). Exceeding this causes Web UI token overflow even when raw prompt tokens are `< 512`.
     - When counting SentencePiece T5 tokens around `w::...::` weight blocks, **never strip commas `,`** and never prepend a phantom `▁` space before post-`::` punctuation (stripping commas undercounts prompts by `25 ~ 45` tokens).
     - Active V4.5 Vibe Transfer requires switching sampler to **`DPM++ 2M` (`k_dpmpp_2m`)** (`0 Anlas` on Opus for `<= 4` pre-encoded vibes; lower guidance to `Scale = 5.0, cfg_rescale = 0.28` for multi-slot artist vibes).
2. **Positive / Negative Separation Across V4.5, V5 High & V5 Medium**:
   - **V4.5 Full (`nai-diffusion-4-5-full`) & V5 Full High (`nai-diffusion-5-full`, 28 steps / Scale 7)**: Both natively support independent `v4_negative_prompt` (`512 + 512` separate T5 budgets). Separate `-2::...::` scene negatives into `v4_negative_prompt` by default.
   - **Fractional Counterweight Preservation (`|w| < 1.0`)**: Gentle negative emphasis weights with `|w| < 1.0` (e.g., `-0.45::wide hips::, -0.45::thick thighs::, -0.40::plump::`) and positive-space feature counterweights (`-2.5::nose bridge, nostrils, lips::`) **MUST remain inside the Positive prompt**! Stripping `-0.45::wide hips::` into Negative UC turns it into a full `-1.0` suppression.
   - **V5 Full Medium (`nai-diffusion-5-full-medium`, 14 steps)**: Server-side locks Heavy UC and **ignores custom `negative_prompt`**; automatically re-wrap scene/custom negatives as `-2::...::` inline in Positive when sending to Medium.
   - **Opus Anlas Quota Nuance**: V4.5 Full (`<=28` steps, `<=1,048,576 px`, no Precise Reference) is truly unlimited `0 Anlas` on Opus. V5 Full High (`<=28` steps) and V5 Medium (`14` steps) draw from the time-recovering **Opus V5 Usage Pool** (`0` direct Anlas until the stamina bar depletes; Medium saves ~42% pool usage).
   - **CRITICAL**: Keep heavy inline negative lists out of Character boxes whenever possible—overloading a Character box with `-3::long list::` disrupts pose/action attention! Only add minimal targeted inline negatives (e.g., `-2.5::clothes, bustier, skirt, sleeves, panties::`) if outfits bleed from Character Reference.
3. **File Output for Sensitive Prompts**:
   - Always write complete NSFW / uncensored test prompt sets directly to a workspace file (e.g., `new.txt`) to avoid chat stream safety interruptions.
4. **`::` Delimiter Safety (Emoticon Tags `:3` & Non-Nesting `-2::...::` Blocks)**:
   - Never wrap colon-prefixed tags like `:3` in weight syntax (`1.2:::3::` creates `:::` triple-colon parser corruption); keep `:3, closed mouth` unweighted.
   - Pairing `:3` with `smug, naughty face` induces slightly half-lidded eyes; when crisp normal open eyes (`正常睁眼 + W猫嘴`) are desired, omit `smug` and use `:3, closed mouth, open eyes, light blush`.
   - **Never nest `w::tag::` inside an inline negative `-2::...::` block**: NovelAI `::` delimiters do not nest — `-2::a, 1.8::labia::, b::` closes prematurely right after `1.8::`, dumping bare `1.8` into Negative UC while leaking `labia::, b::` onto the end of the Positive prompt. Always strip inner weights inside negative lists.

## Common Conflict & Fix Checklist

### 1. Framing Collapse (Upper Body Taking Over / Cowboy Shot Turning Into Portrait)
- **Cause**: Micro-facial tags pull the camera up, OR putting `-4::full body::` in negative weights forces an extreme upper-body crop that cuts off the crotch/thighs.
- **Fix**:
  - Never put heavy negative weight on `full body` when doing low-angle crotch shots! Instead, suppress `-2::upper body, portrait, headshot::` if needed.
  - Anchor low-angle shots with `from below, low angle, cowboy shot` + lower-body anchors (`bare thighs`, `upskirt`, `spread legs`).

### 2. Pixel Art Granularity Control (Too Smooth vs. Yellow/Muddy)
- **If pixel art looks too smooth / high-res cel-shaded**:
  - Remove `masterpiece, very aesthetic` (which force smooth anti-aliased commercial anime rendering in V5).
  - Use `best quality, 1.7::pixel art::, 16-bit, 1.3::dithering::, -1.5::realistic, smooth shading, anti-aliasing::` in Base Prompt. Adjust `pixel art` between `1.4` (finer) and `2.2` (chunkier).
- **If fluids turn into solid yellow/opaque patches**:
  - Remove `limited palette` (retro limited palettes force translucent white fluids into opaque yellowish blocks). Keep `soft colors` + `16-bit, 1.3::dithering::` instead.

### 3. Aesthetic `mosaic` vs. `nsfw` / `uncensored` Collision
- **Fix**: Never use `mosaic` in NSFW prompts (triggers `mosaic censoring`). Use `glitch, dithering, chromatic aberration` instead.

### 4. Anatomy & Fluid Realism (Closed vs. Grotesque/Rubbery vs. Smeared)
- **Check Model First**: `Curated` models physically strip open explicit anatomy even at max steps. Always confirm **V4/V4.5/V5 Full**, and keep Steps at default (`14` in V5 Medium / `28` in High).
- **Keep Full-Model Weights at 1.0x**:
  - Prepend `rating:explicit` in Base Prompt.
  - Inside the Character box, plain `1.0x` tags (`completely nude, uncensored, nipples, pussy, spread pussy, after vaginal, cum in pussy, cumdrip, pussy juice`) produce clean, natural anatomy and internal dripping without grotesque rubbery distortion.
  - **Avoid**: `gaping` (causes grotesque dilation on Full models), `labia` / `fingers on labia` (triggers puffy/closed outer labia), `hands between legs` (triggers inward squeezing/covering), `cameltoe` (triggers tight-clothing creases), and `pink pussy` in single-box mode (bleeds with `miniskirt` into `pink panties`).

---

## NovelAI V5 Behavioral Quirks & Latent Convergence Laws

NovelAI V5 (`nai-diffusion-5-full` / DiT + bidirectional LLM text encoder) behaves fundamentally differently from V4.5 on artist mixing, token ordering, CFG scaling, and stylized proportions. Always apply these five empirically verified V5 laws:

### 1. Native Modern-Illustration Prior & Super-Attractor Collapse ("Outlier Resonance")
- **Quirk**: V5's unconditioned prior sits firmly in modern `~6.0–6.5H` sleek commercial/indie illustration (pale grey-tinted lineart, simplified flat irises, longer mid-face). Artists aligned with this modern prior resonate **up to 70x stronger** in V5 than in V4.5 (e.g., `1.0::artist:mikozin::` measures `64.07%` Kaloscope-3 purity in V5 vs `0.87%` in V4.5).
- **Symptom**: Mixing a high-weight (`>= 0.50`) modern/non-moe artist (such as `mikozin`, `kasumi (skchkko)`, `neit ni sei`) with classic Moe (`~4.5H`) artists works as a balanced tug-of-war in V4.5, **but collapses 90% into the modern artist's basin in V5** — flattening iris gradients into hollow ovals, muting outlines, and pushing feet off the bottom of the canvas (`6.5H` framing override).
- **Fix (Intra-Cluster Primary Core + Inverse-Distance Tail Cap)**:
  1. **Keep 85–100% of primary artist weight inside the SAME target style manifold** (e.g., for rounded ~4.5H Moe: `kani bonara`, `hori (hori no su)`, `gotyou`, `nejime`, `kani biimu`, `suimya` — all clustered around `CosToMoe >= 0.45`).
  2. **Cap out-of-cluster color/tone seasoning artists below the phase-transition threshold (`<= 0.15 ~ 0.20`) AND place them LAST** in the artist list. At `<= 0.18` in the tail slot, V5 breaks free of outlier collapse and achieves high V4.5↔V5 visual consistency (`~0.65` cosine agreement).

### 2. Nonlinear Positional Attention: First-Slot Primacy vs. Tail-Sentence Retention
- **Quirk**: Unlike SD1.5/NAI-V3 (77-token CLIP cutoff), V5 has **no hard positional cliff** within 512 tokens, **but** early denoising steps (`steps 1–6`) exhibit strong **First-Slot Primacy** for layout and facial bone/eye basins, while middle-late scattered Booru tags suffer from **Softmax Attention Dilution** past `~220` total tokens.
  - **Artist Slot #1–#2**: Locks eye-socket geometry, upper-lash shape, and base head-to-body ratio. Simply swapping an outlier artist from Slot #1 to Slot #4 (without changing weights) shifts V4.5↔V5 consistency by `+0.073`, though high weight (`0.66`) at Slot #4 still partially bleeds until reduced (`<= 0.20`).
  - **Framing Before Micro-Features**: Placing micro-facial tags (`blush, eyelashes, parted lips, aqua eyes`) *ahead* of `full body` causes V5 to lock a knee-cropped 3/4 shot early, ignoring the trailing `full body` tag.
  - **Tail Natural-Language Sentences Still Work Strongly**: A single coherent English T5 summary sentence at the **very end** of the prompt (`token 180–220`) retains high cross-attention authority in V5 for global spatial & proportion relationships.
- **V5 Golden 6-Block Prompt Order** (`<= 220 tokens` total):
  1. **Quality + Camera Framing**: `masterpiece, best quality, very aesthetic, year 2025, full body, slightly from above,`
  2. **Artist Stack (In-Cluster Core First -> Trace Colorist Last)**: `0.55::artist:core_moe_1::, 0.48::artist:core_moe_2::, ..., 0.18::artist:color_seasoning::,`
  3. **Stature & Skeletal Proportions**: `1.25::short female::, 1.2::petite::, small frame, 1.3::slender::, 1.3::slender legs::, 0.25::chibi::, slim waist, narrow shoulders, short torso, thigh gap,`
  4. **Subject + Outfit + Action + World-Scale Props**: `1girl, solo, <character>, standing, <outfit>, spacious room, tall wooden door, high doorknob,`
  5. **Micro-Facial & Ornaments**: `round face, short face, looking at viewer, gentle smile, gradient eyes, blush, <hair & ornaments>.`
  6. **One Concise T5 Anchor Sentence**: `Compact 140cm petite figure standing in a standard-scale room...`
  *(Using V5's native split `Base Prompt` + `Character Prompt #1` boxes further isolates scene/style attention from character anatomy.)*

### 3. 14-Step Distilled (`Medium`) vs. 28-Step Full (`nai-diffusion-5-full` + UC)
- **Quirk**: V5's 14-step distilled *Medium Effort* mode aggressively snaps stylized proportions (such as `~4.6H` slender `Mini-Lady`) back toward standard `6H` anatomy and hides the Negative Prompt (`UC`) box.
- **Fix**: For stylized head-to-body ratios or strict cross-seed consistency, always use **28-step `nai-diffusion-5-full`** (`k_euler_ancestral`, `karras`, `Scale = 7.0`; `0 Anlas` on Opus at `832x1216`) paired with an explicit stabilization Negative Prompt (`super deformed, doll, plushie, stubby legs, short legs` against chibi collapse + `tall female, mature female, broad shoulders, long torso, plump, chubby, thick thighs, wide hips` against adult/pear drift).

### 4. Native CFG Scale Sweet Spot & Bimodal Artist Lighting Divergence
- **Quirk**:
  - **V5 Full** is natively calibrated for **`Scale = 6.5 ~ 7.0` (`cfg_rescale = 0.0`)**: renders creamy backlit halation (`吃光柔雾感`), clean tonal roll-off, and genuine multi-angle `multiple views` turnaround sheets without harsh shadow banding.
  - **V4.5 Full** at `Scale = 7.0, cfg_rescale = 0.0` tends to over-saturate cel shadows and harden outlines; V4.5 prefers **`Scale = 5.0 ~ 5.5`** (or `cfg_rescale = 0.18 ~ 0.25`).
  - **Bimodal Lighting Artists**: Screen artists individually under `backlighting` before mixing — some artists (e.g., `artist:tonda`) flip from `95%` neon-violet hard cel blocks in V4.5 to dark muddy sepia backlit faces (`Luma 133, R/B 1.16`) in V5, destabilizing hybrid color palettes across lighting setups.
  - **Opposing Lighting Tug-of-War & Stable Luminous Formula**: Pairing equal-weight (`~0.65 vs ~0.60`) opposing lighting schools — e.g., luminous light-transmitting `artist:mikozin` vs opaque dark-shadow `artist:neit ni sei` — causes seed-to-seed oscillation between bright airy skin and heavy purple-brown shadows. Lock lighting stability by:
    1. Removing bimodal `artist:tonda` completely;
    2. Grouping co-directional luminous/rim artists + stable round-jaw bone-structure artist as the primary core (`0.68::artist:mikozin::, 0.44::artist:kani bonara::, 0.42::artist:kasumi (skchkko)::`);
    3. Demoting heavy-shadow structural artists (`0.22::artist:neit ni sei::`) to a low-weight structural slot (`0.16 ~ 0.24`).

### 5. Projective Scale Blindness & True-Height World Locking
- **Quirk**: Head-to-body ratio (`~4.6H`) is projective-scale invariant on plain backgrounds. Without world-scale anchors in indoor scenes, V5/V4.5 frequently draw a `~180cm` doorway-filling figure with an enlarged `38cm` mascot head ("giant-head adult" uncanniness).
- **Fix**: Combine **intrinsic stature** (`1.25::short female::, 1.15::very short::, 1.2::petite::, small frame`) + **normal-viewer downward eye-level** (`slightly from above`) + **one standard-dimension world reference** (`tall wooden door, high doorknob` for standing; `sitting on bed, dangling legs, feet off floor, oversized pillow` for sitting; `oversized cardigan, sleeves past wrists` for close/medium shots) + UC `giantess, oversized head, towering, miniature furniture, low doorframe`.
