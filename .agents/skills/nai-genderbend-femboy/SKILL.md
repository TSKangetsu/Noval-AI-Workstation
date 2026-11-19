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

---

## 3. Workbench Integration Audit Checklist (If Adding a Genderbend / Femboy Toggle to `web/src/`)
1. **Actor Header Rewrite**: `1girl, solo` → `1.4::1boy::, solo, 1.5::otoko no ko::, 1.4::crossdressing::, 1.35::genderbend::` (or `2boys, 1.55::yaoi::, ...` in 2-person poses).
2. **Body & Outfit Sanitization**: Replace `short female` → `short male`, `bare breasts` → `bare chest`, `small breasts` → `1.55::flat chest::, 1.4::flat male chest::, hairless torso`; strip `cleavage, underboob, pasties` when bare-chest.
3. **Channel & Anatomy Routing**: Automatically reroute `channel === "vaginal"` to `anal, anal penetration, male penetrated` (+ `erection, penis, testicles` on supine/frontal views), disable `uterus` X-ray, and inject the **Dual-Guard Negative Lock** (`1girl, female, breasts, pussy, futanari` + `muscular, bara, broad shoulders, adam's apple, facial hair`).
