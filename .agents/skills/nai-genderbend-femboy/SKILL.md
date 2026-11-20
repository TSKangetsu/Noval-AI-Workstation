---
name: nai-genderbend-femboy
description: >-
  Empirically calibrated NovelAI V4.5 / V5 prompt engineering guide for converting
  female anime characters (e.g., javelin (azur lane)) into cute petite crossdressing
  boys / femboys (otoko no ko / 伪娘) or boyish genderbends (男体化 / 性转正太),
  covering SFW crossdressing & bulge hints, NSFW bare-chest reverse bunnysuit
  contrasts, and 2boys yaoi anal interaction postures without breast regrowth,
  futanari bleed, or bara/muscular masculine drift.
---

# NovelAI V4.5 / V5 Female-to-Male / Femboy (伪娘化 & 性转男体化) Skill

When turning a named female Danbooru character (`javelin (azur lane)`, `firefly (honkai: star rail)`, etc.) into a **petite crossdressing boy / femboy (`伪娘 / 男娘`)** or **cute genderbent boy (`男体化`)**, NovelAI V5 faces a three-way tug-of-war:
1. **Canonical Female Prior**: The character tag pulls breasts, `1girl`, and female lower anatomy back into the latent.
2. **Bara / Adult Male Drift**: Over-weighting raw `1boy, male` alone shifts jawlines, shoulders, necks, and musculature toward adult masculine proportions.
3. **Futanari Bleed**: Mixing female clothing (`reverse bunnysuit, maid, thighhighs`) with `penis` without explicitly stripping `breasts` / `1girl` / `pussy` produces `futanari` instead of a flat-chested boy.

All recipes below were **live-verified on NovelAI V5 Full (`28 steps, Scale 6.8`)** with `javelin (azur lane)` achieving 100% character face/hair lock, completely flat boyish chests, and zero futanari or bara drift.

---

## 1. Core Transformation Architecture (4 Mandatory Rules)

### Rule 1: Replace Headcount & Gender Anchors (`1girl` → `1boy` / `2boys`)
- **Solo Femboy / Crossdressing (`伪娘单人`)**:
  - Replace `1girl, solo` with: `1.35::1boy::, solo, 1.45::otoko no ko::, 1.4::crossdressing::, 1.3::androgynous::, 1.3::genderbend::` (boost to `1.45::1boy::, 1.55::otoko no ko::` for bare-chest NSFW).
- **Solo Boyish Genderbend (`纯男体化/性转正太`)**:
  - Replace `1girl, solo` with: `1.5::1boy::, solo, 1.5::genderbend::, 1.4::bishounen::, 1.35::shota::, cute boy` + `1.3::short hair::, messy boyish <color> hair` (keep signature hairpins/eye colors for instant character recognition).
- **Two-Person Interaction (`伪娘受 / 双男互动`)**:
  - **NEVER** keep `1girl, 1boy, hetero, vaginal, pussy`!
  - Replace actor header with: `2boys, 1.55::yaoi::, 1.55::otoko no ko::, 1.45::crossdressing::, 1.35::genderbend::, faceless male` (plus `1.4::pov::, pov hands, pov crotch` in POV).

### Rule 2: Swap Female Body & Chest Tags to Flat Boyish Proportions
- Replace `short female` → `1.25::short male::`.
- **Strip** `small breasts`, `bare breasts`, `cleavage`, `underboob` from Positive!
- **Inject Flat Male Chest Stack**:
  - Clothed SFW: `1.45::flat chest::, male chest, hairless chest`
  - Bare-Chest NSFW: `1.55::flat chest::, 1.4::flat male chest::, 1.3::pectorals::, tiny pink nipples, hairless torso, bare chest` (note: do **NOT** include `pectorals` if you want ultra-soft slender pre-pubescent chest with zero pec crease — `1.55::flat chest::, 1.4::flat male chest::, tiny pink nipples, hairless torso, bare chest` is cleanest).
- Keep `0.12::chibi::, 1.2::petite::, small frame, 1.3::slender::, 1.3::slender legs::, slim waist, narrow shoulders, 1.25::narrow hips::, short face, round face` so the character stays adorable and petite rather than growing wide male shoulders.

### Rule 3: Dual-Guard Negative Lock (Anti-Female/Futanari + Anti-Bara)
Always include **BOTH** halves in Negative (`scene_negative` / `extra_uc`):
- **Anti-Female & Anti-Futanari Lock**:
  ```text
  1girl, female, girl, hetero, breasts, small breasts, medium breasts, large breasts, cleavage, underboob, pussy, vulva, labia, vaginal, futanari, hermaphrodite
  ```
- **Anti-Bara / Anti-Masculine-Face Drift Lock**:
  ```text
  muscular, muscular male, bara, broad shoulders, wide shoulders, thick neck, adam's apple, facial hair, stubble, mature male, tall male
  ```
- **Proportional Small-Scale Anatomy Lock (`防比例过大 · 娇小少年尺寸校准`, Live-Verified)**:
  - **Why**: Raw high-weight `1.45::penis::` + `1.35::erection::` triggers Danbooru's adult/hyper-scale prior on petite frames, drawing disproportionately huge anatomy.
  - **Fix**: Never use boosted bare `1.45::penis::` on petite femboys! Replace with **`1.55::small penis::, 1.35::tiny penis::, 1.35::small testicles::, testicles, erection`** (drop `1.35::tiny penis::` if you want medium-small rather than petite-tiny), AND append the Anti-Oversize UC block:
    ```text
    huge penis, large penis, oversized penis, thick penis, hyper penis, monster penis, veiny penis, giant penis, huge testicles, large testicles
    ```
- *(For pure boyish genderbend Mode B, also append `long hair, twintails, ponytail, dress, skirt, maid, crossdressing` to UC.)*

### Rule 4: Switch Lower-Body Interaction Channel (`vaginal` → `anal` + `male penetrated`)
- In 2-person NSFW scenes (`2boys, yaoi`), replace all vaginal tags (`vaginal, insertion, pussy, cum in pussy`) with:
  ```text
  1.5::anal::, 1.45::anal penetration::, 1.45::male penetrated::, 1.45::erection::, 1.45::penis::, testicles, male ejaculation, cum on stomach, cum, cumdrip
  ```
- **Rear POV Note**: On pure rear-facing POV (`from behind, all fours`), apply the exact same 4-step rear-POV facial/front-chest sanitization from `nai-pose-taxonomy` (strip `gradient eyes`, expressions, `navel, midriff, red bowtie`; lock `looking back, face, eyes` in UC), and keep `1.5::anal::, 1.45::anal penetration::, 1.45::male penetrated::, testicles, 1.4::cum::, cum overflow`.
- **Disable Uterus X-Ray**: Never enable `enable_uterus_xray` (`uterus, cervix`) on male/femboy subjects (unless intentionally building a fantasy genderbend cutaway); use `prostate` / `anal x-ray` only if explicitly requested.

---

## 2. Four Calibrated Archetype Recipes (Live-Verified on V5 Full)

### Archetype A: Cute Crossdressing Femboy · Clothed Skirt-Lift Bulge (`女装伪娘 · 撩裙微凸日常`)
- **Canvas**: Portrait `832x1216`
- **Verified Core Tags**:
  ```text
  1.35::1boy::, solo, 1.45::otoko no ko::, 1.4::crossdressing::, 1.3::androgynous::, 1.3::bishounen::, 1.3::genderbend::, <char_tag>, 0.12::chibi::, 1.25::short male::, 1.2::petite::, small frame, 1.3::slender::, 1.3::slender legs::, slim waist, narrow shoulders, 1.25::narrow hips::, 1.45::flat chest::, male chest, hairless chest, thigh gap, long legs, short face, round face, cowboy shot, standing, head tilt, looking at viewer, 1.35::mesugaki::, smug, evil smile, jitome, blush, white frilled maid apron, black pleated miniskirt, white blouse, black thighhighs, garter straps, 1.3::skirt lift::, 1.25::bulge::, white panties
  ```
- **T5 Prose Anchor**:
  `A cute petite crossdressing boy version of <Name> with a completely flat male chest and adorable girlish face, teasingly lifting the hem of his black pleated miniskirt to show a soft bulge inside his white panties.`

### Archetype B: Bare-Chest Reverse Bunnysuit Femboy · Full Reveal (`逆兔伪娘 · 平胸直露反差`)
- **Canvas**: Portrait `832x1216`
- **Verified Core Tags**:
  ```text
  1.45::1boy::, solo, 1.55::otoko no ko::, 1.45::crossdressing::, 1.35::genderbend::, androgynous, <char_tag>, 0.12::chibi::, 1.25::short male::, 1.2::petite::, small frame, 1.3::slender::, 1.3::slender legs::, slim waist, narrow shoulders, 1.25::narrow hips::, 1.55::flat chest::, 1.4::flat male chest::, tiny pink nipples, hairless torso, thigh gap, long legs, short face, round face, cowboy shot, legs apart, head tilt, peace sign near cheek, looking at viewer, 1.35::mesugaki::, smug, evil smile, jitome, blush, 1.5::reverse bunnysuit::, black bunny ears, white collar, red bowtie, 1.4::black cropped jacket::, 1.35::bolero::, short sleeves, open jacket, bare chest, bare stomach, navel, white cuffs, bare hips, bare thighs, black thighhighs, thigh strap, rating:explicit, nsfw, uncensored, 1.45::male::, 1.55::small penis::, 1.35::tiny penis::, 1.35::small testicles::, testicles, erection, precum, dripping
  ```
- **Outfit Adaptation Warning**: Standard female Reverse Bunnysuit includes `bare breasts, 1.3::nipples::`. Always swap `bare breasts, 1.3::nipples::` → `bare chest, 1.55::flat chest::, 1.4::flat male chest::, tiny pink nipples`!

### Archetype C: Pure Boyish Genderbend · Short-Hair Male Outfit (`纯男体化 · 短发衬衫领带正太`)
- **Canvas**: Portrait `832x1216`
- **Verified Core Tags**:
  ```text
  1.5::1boy::, solo, 1.5::genderbend::, 1.4::bishounen::, 1.35::shota::, cute boy, <char_tag>, 1.3::short hair::, messy boyish <hair_color> hair, <signature_hairpin>, 0.12::chibi::, 1.25::short male::, 1.2::petite::, small frame, 1.3::slender::, 1.3::slender legs::, slim waist, narrow shoulders, 1.25::narrow hips::, 1.5::flat chest::, flat male chest, hairless torso, short face, round face, cowboy shot, standing, hand on hip, looking at viewer, 1.3::smug::, grin, cheeky smile, jitome, blush, white collared shirt, unbuttoned shirt, loose necktie, navy shorts, bare legs, white ankle socks
  ```
- **Tip**: Keeping the character's signature hair color, eye gradient, and iconic hairpin while switching to `1.3::short hair::, messy boyish hair` + `unbuttoned shirt, loose necktie, navy shorts` makes the genderbend immediately recognizable as the male counterpart without looking like a generic OC.

### Archetype D: Two-Person Femboy Receiving POV (`双男互动 · 伪娘受 仰卧抬腿 & 纯背向后入 POV`)
- **Canvas**: Portrait `832x1216`
- **D1 · Supine Legs-Up POV (`仰卧抬腿双男 POV`)**:
  ```text
  2boys, 1.55::yaoi::, 1.55::otoko no ko::, 1.45::crossdressing::, 1.35::genderbend::, faceless male, 1.4::pov::, pov hands, pov crotch, <char_tag>, 0.12::chibi::, 1.25::short male::, 1.2::petite::, 1.3::slender::, 1.3::slender legs::, slim waist, narrow shoulders, 1.25::narrow hips::, 1.55::flat chest::, 1.4::flat male chest::, hairless torso, short face, round face, 1.3::from above::, lying on back, 1.35::legs up::, spread legs, knees to chest, looking at viewer, <femboy_outfit>, furrowed brow, half-closed eyes, teary eyes, heavy blush, open mouth, rating:explicit, nsfw, uncensored, 1.5::anal::, 1.45::anal penetration::, 1.45::male penetrated::, 1.45::erection::, 1.45::penis::, testicles, male ejaculation, cum on stomach, cum, cumdrip, trembling
  ```
- **D2 · Strict Rear-Facing All-Fours POV (`纯背向跪趴后入双男 POV`)**:
  - Combine `2boys, 1.55::yaoi::, 1.55::otoko no ko::, 1.45::crossdressing::, 1.35::genderbend::, faceless male, 1.45::pov::, pov hands, pov crotch, grabbing another's hip` with the `nai-pose-taxonomy` pure rear-facing block (`1.5::from behind::, 1.35::from above::, high angle, 1.35::back::, 1.35::facing away::, back of head, bare back, shoulder blades, spine, 1.3::all fours::, kneeling, arched back, raised hips`) + `1.5::anal::, 1.45::anal penetration::, 1.45::male penetrated::, 1.35::penis::, testicles, 1.4::cum::, cum overflow, cumdrip` (stripping all facial/eye/front-chest tags and locking `looking back, face, eyes` in UC).

### Archetype E: `MA7A / MA7B / MA7C` Derivative Scenes · Prostatic Fluid / Precum Mode (`伪娘圆腹/平腹 + 肠道透视 + 前列腺液拉丝`)
- **Canvas**: Portrait `832x1216` (V5 Full empirically verified across all 3 variants)
- **Critical Hand-Conflict & Anatomy Rules (Must Apply to All 3 Variants)**:
  1. **Zero Phantom Third Hand**: Standard `MA7A/B/C` templates contain `1.25::spread pussy::, 1.25::spreading own pussy::, fingers` alongside `peace sign near cheek, hand on belly`. On Femboy mode, **strip `spread pussy, spreading own pussy, fingers`** completely (and append `extra hands, extra fingers` to UC), leaving clean two-hand assignments: `peace sign near cheek, hand on belly` (`MA7A`/`MA7B`) or `peace sign near cheek, hand on hip` (`MA7C`).
  2. **Prostatic Fluid / Precum Replacement (`流出前列腺液`)**: Strip vaginal overflow tags (`after vaginal, cum in pussy`) and inject boosted prostatic/precum tags on the compact shaft:
     `1.55::small penis::, 1.35::tiny penis::, 1.35::small testicles::, testicles, 1.35::erection::, 1.45::precum::, 1.4::precum string::, dripping` (unblock `penis, phallus, testicles, dripping` from `extra_neg`).
  3. **Male Colon Cutaway (`MA7B` / `MA7C`)**: Never leave `uterus, cervix, cum in uterus` in Positive; swap to `1.45::x-ray::, 1.4::cross-section::, 1.45::intestines::, 1.5::cum in ass::, internal cumshot` and lock `uterus, cervix, fetus, baby, embryo, umbilical cord, skeleton, bones, skull, ribcage, gore` in UC.
- **Per-Variant Delta Recipes**:
  - **`MA7A` · 饱满圆腹 + 前列腺液 (无透视)**:
    - Strip `slim waist, -0.40::plump::` from Pos and `plump, curvy` from UC; keep `1.55::flat chest::, 1.4::flat male chest::, tiny pink nipples, hairless torso` so belly expands while chest stays flat.
    - Add Pos: `1.55::pregnant::, 1.45::stomach bulge::, 1.35::cum inflation::, round pregnant belly, protruding navel, cowboy shot, legs apart, head tilt, peace sign near cheek, hand on belly, 1.55::small penis::, 1.35::tiny penis::, 1.35::small testicles::, testicles, 1.35::erection::, 1.45::precum::, 1.4::precum string::, dripping`
    - Add UC: `x-ray, cross-section, uterus, cervix, cutaway, extra hands, extra fingers`
  - **`MA7B` · 饱满圆腹 + 肠道内部透视 + 前列腺液**:
    - Same belly-unlock & flat-chest lock as `MA7A`, plus: `1.45::x-ray::, 1.4::cross-section::, 1.45::intestines::, 1.5::cum in ass::, internal cumshot` (unblock `x-ray, cross-section, cutaway` in UC, keep `uterus, cervix` blocked).
  - **`MA7C` · 纤细平腹 + 肠道内部透视 + 前列腺液**:
    - Restore `slim waist, midriff, navel, hand on hip` in Pos; remove `pregnant, stomach bulge, round pregnant belly, protruding navel, hand on belly`; add `pregnant, stomach bulge, plump, curvy, uterus, cervix, extra hands, extra fingers` to UC; keep `1.45::x-ray::, 1.4::cross-section::, 1.45::intestines::, 1.5::cum in ass::, internal cumshot` + `1.45::precum::, 1.4::precum string::, dripping`.

### Archetype F: Tentacle Series Femboy Adaptation (`触手系列 TN01–TN12 伪娘差分 · 螺旋榨精 / 近景深喉 / 肠道透视与寄生服`)
- **Canvas**: Portrait `832x1216` (`TN01–TN02, TN04–TN09, TN11–TN12`) / Landscape `1216x832` (`TN03, TN10`)
- **Mandatory 4-Step Tentacle Femboy Transform Rules (Verified Live on V5 Full)**:
  1. **Flat Chest & Tentacle Chest Swap**: Always replace `tentacles on breasts` → **`tentacles on chest, nipple tweak, 1.55::flat chest::, 1.4::flat male chest::, tiny pink nipples, hairless torso`** (and on `TN08` close-up deepthroat, keep `bare chest, 1.55::flat chest::, tiny pink nipples` so the upper body stays 100% boyish!).
  2. **Penetration & X-Ray Rerouting**:
     - Swap `vaginal, cervical penetration, double penetration` → **`1.5::anal::, 1.45::anal penetration::, 1.45::male penetrated::`**.
     - On X-ray / egg-laying scenes (`TN02, TN04, TN10, TN12`), swap `uterus, cervix, cum in uterus, eggs in uterus` → **`1.45::intestines::, 1.5::cum in ass::, internal cumshot`** (or **`1.45::intestines::, 1.45::eggs::, 1.5::oviposition::`** for egg-belly `TN04/TN12`), and lock `uterus, cervix` in UC.
  3. **Signature Femboy Tentacle Milking Sleeve (`TN05 / TN07 / TN10 / TN11`)**:
     ```text
     1.45::male::, 1.4::small penis::, 1.3::small testicles::, testicles, 1.35::erection::, 1.45::coiled tentacle around penis::, 1.4::milking::, 1.45::male ejaculation::, 1.4::cum::, cum on stomach, 1.4::precum::, dripping
     ```
     - Verified on `TN05` (`144452`) & `TN08` (`144924`): glossy purple tentacles spiral tightly around his compact shaft like a living milking sleeve shooting cum across his stomach, with zero breast regrowth.
  4. **Tentacle UC Unblocking**: Unblock `1boy, male, penis, phallus, testicles` from tentacle `extra_scene_neg`, while **strictly keeping `human hands, multiple boys, 2boys, extra hands, extra arms, extra legs`** + Dual-Guard Femboy UC (`1girl, female, breasts, pussy, futanari, muscular male, bara`) + Anti-Oversize UC (`huge penis, large penis, oversized penis, thick penis, hyper penis, monster penis, giant penis, huge testicles, large testicles`).

### Archetype G: Fantasy Hive & Doujin-Style Arthropod Femboy Adaptation (`虫类系列 BG01–BG20 伪娘差分 · 蛛丝缚 / 抱脸虫覆面虫吸榨精 / 多足蜈蚣盘身 / 荧光幼虫与白蛆溢出`)
- **Empirically Verified Highlights (`BG01`, `BG05`, `BG08_v2`, `BG15`, `BG18`)**:
  1. **`BG01` (Glowing Spiderweb Bondage)**: Sticky silver-violet spider silk criss-crossing `1.55::flat chest::, 1.4::flat male chest::, tiny pink nipples` + `spider silk wrapped around penis, 1.4::small penis::, 1.3::small testicles::, testicles, erection, 1.4::precum::, precum string` with giant spider silhouette behind.
  2. **`BG05` (Landscape `1216x832` Chitinous Insectoid Rear Press)**: `from side, 1.45::all fours::, arched back` + `1.55::insectoid monster::, 1.5::glossy iridescent chitin::, glowing compound eyes, mantis-like chitinous forearms holding waist, 1.5::ovipositor::, 1.5::anal::, 1.45::anal penetration::, 1.45::male penetrated::` while his flat chest and `1.4::small penis::, testicles, erection, 1.4::precum::` hang naturally below.
  3. **`BG07 / BG08 / BG12` (Segmented Glowing Larvae Overflow — Oral & Anal)**:
     - **Oral (`BG08`)**: `1.4::close-up::, 1.35::upper body::, 1.55::flat chest::, bare chest, 1.6::worms::, 1.55::small worms::, 1.5::grubs::, 1.5::larvae::, worms in mouth` + T5 prose (`many small plump segmented translucent glowing golden-pink jelly larvae wriggling on his tongue and overflowing out of his open mouth with thick glowing honey-slime down onto his chin and flat hairless chest`).
     - **Anal / Colon X-Ray (`BG07 / BG12`)**: Swap `after vaginal / pussy / uterus` → `1.45::after anal::, 1.45::intestines::, larvae overflowing from ass` and lock `uterus, cervix` in UC.
     - **CRITICAL Larvae UC Rule**: **Unblock `maggots`** in UC (blocking `maggots` collapses segmented larvae into round orbs!), add `round eggs` to UC when pure larvae are desired, and block `realistic, photorealistic, 3d, horror, gore, blood, rotting, corpse, dirty, cockroach, fly, legs on worms, spiky`.
  4. **`BG15` (Doujin Facehugger Oral Deepthroat + Groin Bug Milking — Verified Live `s3134683063`)**:
     - **Positive Core**: `indoors, bedroom, messy bed, cowboy shot, lying on back, spread legs, 1.55::flat chest::, 1.4::flat male chest::, tiny pink nipples, hairless torso, 1.6::facehugger::, 1.55::parasitic arthropod::, pale fleshy-chitinous spider-like creature with eight jointed finger-legs clamped tightly around his head covering his mouth, curled segmented tail wrapped around his slender neck, 1.5::oral::, 1.5::deepthroat::, 1.45::throat bulge::, second smaller chitinous bug latched onto his groin sucking and milking his 1.4::small penis::, 1.3::small testicles::, testicles, 1.4::cum::, cum on stomach`.
     - **CRITICAL Multi-Legged Arthropod UC Rule**: **Replace bare `extra legs` with `extra human arms, extra human legs`** in UC so V5 renders all 8 arthropod legs cleanly while keeping the boyish torso 100% flat-chested and free of phantom human limbs!
  5. **`BG18` (Indoor Giant Centipede Spiral Coiling & Anal Penetration — Verified Live `s3410480078`)**:
     - **Positive Core**: `indoors, messy bedsheet, cowboy shot, kneeling on bed, arched back, spread legs, 1.6::giant centipede::, glossy dark-crimson and black segmented chitinous carapace, dozens of sharp orange-red jointed centipede legs gripping his thighs, narrow waist, and flat boyish chest as it coils spirally around his body, 1.5::anal::, 1.45::anal penetration::, 1.45::male penetrated::, fleshy centipede phallus penetrating his ass, 1.4::small penis::, 1.3::small testicles::, testicles, erection, 1.4::precum::`.
  6. **`BG13 / BG14 / BG16 / BG17 / BG19 / BG20` (Doujin Arthropod Mounting & White Maggot Anal Overflow)**:
     - Reroute `vaginal` → `1.5::anal::, 1.45::anal penetration::, 1.45::male penetrated::` and `after vaginal` → `1.45::after anal::`. On `BG19 / BG20` white maggot overflow, swap `uterus` → `1.45::intestines::` (locking `uterus, cervix` in UC), unblock `maggots`, and keep `1.4::small penis::, 1.3::small testicles::, erection, 1.4::precum::` visible in front.
  7. **Groin-to-Head Worm's-Eye POV (`View B · 胯部向头部仰视视角差分` — Verified Live on `BG15` `s3069112347` & Audited on Live MCP)**:
     - Across all `TN01–TN12` & `BG01–BG20` Femboy scenes, switching to **View B** (`1.55::from below::, 1.45::pov::, 1.5::foreshortening::, groin focus in foreground, head at top` + **`upside-down, inverted, head at bottom, legs at top`** in UC) places his compact shaft/testicles, anal insertion, or groin-parasite milking right in the huge lower foreground while showcasing his 100% flat boyish chest receding toward his face/facehugger at the top!
     - **502-Token Budget Anti-Inversion & Dual-Bug Guard (MCP Live Catch)**: Because Femboy headers + long outfits (e.g., Reverse Bunnysuit) push `pos_tokens` to `495~499 / 502` and trim trailing T5 prose, **always front-load `groin focus in foreground, head at top` in the camera slot** and keep `BG15` action tags concise (`1.6::2 creatures::, 1.55::groin parasite::, 1.6::facehugger:: on face, tail around neck, 1.45::throat bulge::, second chitinous bug latched onto groin sucking penis`) so neither upright orientation nor the lower groin bug is clipped!
  8. **Internal X-Ray / Cross-Section Femboy Routing Across `TN01–TN12` & `BG01–BG20` (`全 32 场景伪娘透视版 · 实测 4/4 通过`)**:
     - **Anal / Intestinal Cutaway (`TN01–TN07, TN09–TN12, BG01–BG07, BG09–BG14, BG16–BG20`)**: Swap `uterus, cervix, cum/eggs in uterus` → **`1.55::x-ray::, 1.5::cross-section::, 1.5::intestines::, 1.5::cum in ass::`** (or `1.5::intestines::, 1.5::oviposition::, 1.5::eggs::` on egg/maggot scenes) and **strictly lock `uterus, cervix, womb, fetus, baby, embryo, skeleton, bones` in UC** *(Verified live on `TN05` `s4130640127` & `BG18` `s1244193888` — 100% pure intestinal cutaway with zero female organ bleed and compact male shaft cleanly visible below!)*.
     - **Throat / Esophagus / Stomach Cutaway (`TN08, BG08, BG15`)**: Route to **`1.55::x-ray::, 1.5::cross-section::, 1.5::stomach x-ray::, 1.45::internal::`** down his neck and flat hairless chest *(Verified live on `TN08` `s333467657` & `BG15` `s2467346168`; on `BG15` X-Ray, drop the secondary groin bug so the facehugger feeding tube + glowing stomach egg cutaway + small dripping shaft compose cleanly)*.
  9. **`MA11` Ultra Close-Up Wide-Angle V-Legs Under-Crotch Peace-Sign Showcase (`V字高抬腿超近距广角胯下仰视比耶 · 实测 s4003239764`)**:
     - Use `1.65::close-up::, 1.7::from below::, 1.65::worm's-eye view::, 1.65::extreme foreshortening::, 1.5::wide-angle lens::, 1.4::fisheye::, 1.55::pov::, 1.3::dutch angle::, 1.6::ass focus::, 1.6::groin focus::, 1.5::anus::, groin and buttocks filling lower two-thirds of frame, head small at top, lying on back, 1.55::legs up::, 1.5::spread legs::, 1.5::v-shaped legs::, 1.4::small penis::, 1.3::small testicles::, testicles, erection, 1.35::precum::, 1.55::flat chest::, 1.4::one eye closed::, wink, 1.35::grin::, 1.45::v::, 1.4::peace sign::, hand next to cheek` + UC `full body, wide shot, distant, upside-down, inverted, head at bottom, legs at top`. Lower buttocks/anus/compact shaft fill ~70% of the screen while his flat boyish chest and winking peace-sign face crown the top 30%.

### Archetype H: Solo Smartphone Selfie & Uraaka Niche-Fetish Femboy Adaptation (`单人私密手机自拍 SF01–SF30 伪娘全30式差分 · 竞泳拨档 / 凸面镜跳蛋 / 红绳遥控快门 / 夜公园闪光 / 贞操笼颈圈钥匙 / 温泉落巾牛奶 / 保鲜膜紧缚`)
- **Recommended Style, Lighting & Dynamic Light-Override Scheme**:
  - **Artist Chain**: Style #6 Balanced `doshimash0` Blend (`0.56::artist:mikozin::, 0.46::artist:kani bonara::, 0.38::artist:hori (hori no su)::, 0.34::artist:gotyou::, 0.50::artist:doshimash0::, gradient eyes, no text`).
  - **Paired Lighting & Cel-Lock Block** *(indoor/night-adapted `cool_warm_25d_cel`, stripping fixed `sunlight, light rays`)*:
    `1.15::cel shading::, anime coloring, lineart, 1.2::high contrast::, saturated, 1.25::backlighting::, 1.15::subsurface scattering::, 1.18::shiny skin::, sparkle`
  - **Per-Scene Light Overrides**: Add `1.45~1.55::camera flash::` on self-bondage / night park / cling-wrap (`SF14, SF18, SF30`); `warm spotlight` / `warm yellow lighting, steam` on fitting room / onsen (`SF02, SF26`); `1.5::city lights at night::` / `neon-lit bedroom` on night window / livestream (`SF16, SF19`).
  - **Sampling & Official 2x Upscale**: `nai-diffusion-5-full` (`Steps = 28`, `CFG = 6.8`, `Rescale = 0`, `appendV5Quality = true`) + `/ai/upscale` (`nai-diffusion-5-full-medium`, `declared_blur_sigma = 0`, `832×1216 → 1664×2432`).
- **3-Tier Camera UC Split (Mandatory Across All 30 `SF` Scenes)**:
  1. **Mode M — Mirror / Glass Reflection Selfies (`SF01, 02, 04, 05, 06, 08, 10, 11, 16, 17, 21, 22, 23, 25, 26`)**: Keep `1.5::mirror selfie::, 1.45::holding phone::, smartphone` in Positive; append `pov hands` to Femboy Dual-Guard UC.
  2. **Mode D — Direct Camera-Lens / Floor / Under-Glass / Extended-Arm / Timer Flash Selfies (`SF03, 07, 09, 12, 14, 15, 18, 20, 24, 27, 28, 29, 30`)**: **MUST lock `holding phone, smartphone, cellphone, mobile phone, mirror` in UC** so V5 never draws a duplicate smartphone inside the frame!
  3. **Mode U — Foreground Screen / Livestream UI (`SF13, 19`)**: Keep `smartphone` unblocked on foreground hand-held screen `SF13`, and lock `holding phone, smartphone, mirror` on hands-free livestream overlay `SF19`.
- **Empirically Verified Femboy Selfie Signatures (8/8 Live V5 Full Benchmarks)**:
  1. **`SF02` · Fitting Room Curtain-Gap Swimsuit Pull-Aside (`s3228590855`)**: `1.45::competition swimsuit::, glossy dark-navy high-leg one-piece swimsuit, tight clothes, 1.4::curtain slightly open in background::, 1.5::mirror selfie::, 1.45::holding phone::, other hand pulling swimsuit crotch strap aside, tight flat chest, 1.4::small penis::, 1.3::small testicles::, erection, 1.35::precum::`.
  2. **`SF05` · Night Hallway Convex Mirror Open-Coat Taped Vibrator (`s3676087611`)**: `oversized beige trench coat, 1.5::open coat::, bare chest, 1.55::convex mirror::, fisheye mirror reflection, 1.5::mirror selfie::, 1.5::vibrator::, pink egg vibrator taped to small penis with white medical tape, wires trailing, 1.4::anal beads::, ring pull hanging between thighs`.
  3. **`SF09` · Extended-Arm High-Angle Supine Navel Cum Pool (`s4066776766`)**: `unbuttoned collared shirt, bare chest, bare stomach, 1.5::from above::, 1.5::selfie::, 1.5::pov::, one arm extended straight up toward camera out of frame, 1.55::cum on stomach::, 1.5::cum in navel::, deep navel pooled full of thick white cum above small twitching penis` (`DIRECT_POV_UC`).
  4. **`SF14` · Red Shibari Self-Bondage + Biting Wireless Remote Shutter (`s3671195747`)**: `completely nude, bare chest, 1.55::shibari::, 1.5::red rope bondage::, kneeling on tatami mat, 1.45::camera flash::, timer camera on low desk, 1.5::biting::, biting small black wireless camera remote shutter button in mouth, rope knotted snugly around base of 1.4::small penis::, 1.3::small testicles::, erection, 1.4::precum::` (`DIRECT_POV_UC`).
  5. **`SF18` · Night Park Fence Harsh Camera-Flash Wide Squat (`s2491457777`)**: `oversized open tracksuit jacket, nude underneath, bare chest, loose white socks, sneakers, black choker, outdoors, night, dark rooftop park bench, chain-link fence, 1.55::camera flash::, 1.5::squatting::, m legs, hands on knees, 1.4::small penis::, 1.3::small testicles::, erection, precum` (`DIRECT_POV_UC`).
  6. **`SF21` · Locked Pink Chastity Cage Drip + Key on Choker (`s360969622`)**: `frilly white maid apron lifted up, bare flat chest, white garter thighhighs, lace choker with tiny silver padlock key dangling at throat, 1.5::mirror selfie::, 1.45::holding phone::, 1.6::chastity cage::, small translucent pink plastic chastity cage locked neatly over his small penis with tiny silver padlock, 1.45::precum:: thread dripping`.
  7. **`SF26` · Onsen Wooden Locker Room Dropped-Towel + Cold Milk Bottle (`s3056940646`)**: `steaming rosy wet skin, white bath towel fallen on floor around ankles, 1.55::changing room::, traditional Japanese onsen wooden locker room, bamboo baskets, 1.5::mirror selfie::, 1.45::holding phone::, pressing cold glass milk bottle against flat boyish chest, 1.4::small penis::, 1.3::small testicles::` (+ `towel covering crotch` in UC).
  8. **`SF30` · Glossy Clear Cling-Wrap Self-Bondage Timer Flash (`s2013671508`)**: `completely nude, bare flat chest, 1.6::plastic wrap::, 1.55::cling wrap bondage::, glossy transparent plastic cling-film wrapped tightly around slim hairless chest, waist, wrists, and upper thighs, 1.5::camera flash::, 1.5::vibrator::, pink wand vibrator trapped tightly beneath clear plastic wrap directly against 1.4::small penis::, 1.3::small testicles::, 1.45::precum:: smeared inside clear wrap` (`DIRECT_POV_UC`).
- **Rerouting Rules for Converting Remaining Female/Futa `SF` Scenes (`SF01, 03, 04, 06–08, 10–13, 15–17, 19, 20, 22–25, 27–29`) to Femboy**:
  - **Chest & Outfit**: Swap `bare breasts, small breasts, pulled-down bra` → `1.55::flat chest::, 1.4::flat male chest::, tiny pink nipples, hairless torso` (on `SF11` wet shirt, use `wet shirt clinging flat against boyish chest and tiny pink nipples`; on `SF24` car backseat, drop `pulled-down bra` and add `bra` to UC).
  - **Aftermath & Internal Props**: Swap `creampie, cum in pussy` (`SF04, 08, 15, 24`) → `after anal, cum dripping from ass down inner thighs` + `1.4::small penis::, erection, precum`; swap `womb tattoo` (`SF04`) → `tally marks on flat stomach and thighs`; swap `peeing from urethra above spread pussy` (`SF20`) → `golden urine stream arcing from tip of small penis`; swap `nipple clamps chained to labia` (`SF23`) → `nipple clamps on flat chest chained down to ring on small erect penis`; swap `mirror suction dildo in pussy` (`SF25`) → `mirror-mounted pink suction-cup dildo inserted into anus (1.5::anal::) while small penis drips precum in front`; swap `vibrator in pussy` (`SF29`) → `wireless pink vibrator cord hanging from anus beneath small erect penis under classroom desk`; on `SF10` inflated belly, strip `slim waist` while keeping `1.55::flat chest::` so only the lower belly rounds out above his small shaft.

---

## 3. Workbench Integration Audit Checklist (If Adding a Genderbend / Femboy Toggle to `web/src/`)
1. **Actor Header Rewrite**: `1girl, solo` → `1.4::1boy::, solo, 1.5::otoko no ko::, 1.4::crossdressing::, 1.35::genderbend::` (or `2boys, 1.55::yaoi::, ...` in 2-person poses).
2. **Body & Outfit Sanitization**: Replace `short female` → `short male`, `bare breasts` → `bare chest`, `small breasts` → `1.55::flat chest::, 1.4::flat male chest::, hairless torso`; strip `cleavage, underboob, pasties` when bare-chest.
3. **Channel & Anatomy Routing**: Automatically reroute `channel === "vaginal"` to `anal, anal penetration, male penetrated` (+ `erection, penis, testicles` on supine/frontal views), disable `uterus` X-ray, and inject the **Dual-Guard Negative Lock** (`1girl, female, breasts, pussy, futanari` + `muscular, bara, broad shoulders, adam's apple, facial hair`).
