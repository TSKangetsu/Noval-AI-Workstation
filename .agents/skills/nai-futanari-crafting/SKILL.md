---
name: nai-futanari-crafting
description: >-
  Empirically calibrated NovelAI V4.5 / V5 prompt engineering guide for futanari
  (扶他 / 双性女角色) generation across four verified archetypes: (1) Solo ball-free
  futanari (`futa without balls`), (2) Solo full futanari (`futa with balls`),
  (3) Dual-character `futa on female` (`2girls` + `[Character N]` spatial isolation
  with `source#vaginal` / `target#vaginal` to prevent double-futa bleed), and
  (4) Male-on-futa receiving POV (`1girl, 1boy, hetero` vaginal penetration with
  simultaneous futanari shaft above).
---

# NovelAI V4.5 / V5 Futanari (扶他 / 双性女体) Calibration Skill

Unlike `nai-genderbend-femboy` (which flattens the chest and switches headcount to `1boy / 2boys, yaoi`), **futanari (`扶他`)** strictly preserves **female headcount (`1girl` / `2girls`), female chest (`small breasts` / `bare breasts`), and female lower anatomy (`pussy`)** while adding a cleanly rendered erect shaft (`futanari, penis`) with explicit control over testicle presence and multi-character role ownership.

All 4 archetypes below were **live-verified on NovelAI V5 Full (`28 steps, Scale 6.8`)** with zero femboy flat-chest drift, zero unintended male body bleed, and zero double-futa bleed on female partners.

---

## 1. Core Futanari Architecture (4 Mandatory Rules)

### Rule 1: Strict Female Headcount & Anti-Femboy Lock
- **Solo Futanari**: Keep `1girl, solo, 1.55::futanari::` (never use `1boy` or `otoko no ko`).
- **Futa on Female (扶他攻 × 纯女受)**: Use `2girls, 1.5::futanari::, 1.4::futa on female::, yuri` + **`[Character 1]` / `[Character 2]` spatial boxes** (mandatory so the receiving girl does not grow a second penis).
- **Male on Futa (男方 × 扶他受)**: Keep `1girl, 1boy, hetero, faceless male, 1.55::futanari::` (plus `1.4::pov::, pov hands, pov crotch` in POV) — because she retains `pussy`, standard `vaginal, insertion` + `enable_uterus_xray` work natively!
- **Negative Guard (Anti-Femboy / Anti-Flat-Chest)**:
  - Always include `otoko no ko, crossdressing, yaoi, flat chest, male chest, pectorals` in Negative UC (and `1boy, male` on solo / `futa on female` scenes).

### Rule 2: Explicit Ball-Free vs. With-Balls & Proportional Small-Scale Control (`无蛋/有蛋与娇小比例控制`, Live-Verified)
NovelAI V5's `futanari` training set skews heavily toward oversized/hyper proportions whenever bare `1.45::penis::` is boosted. **Always pair explicit size-calibration tags with Anti-Oversize UC** on petite characters:
- **Anti-Oversize Negative Lock (Mandatory for Petite Proportions)**:
  ```text
  huge penis, large penis, oversized penis, thick penis, hyper penis, monster penis, veiny penis, giant penis, huge testicles, large testicles
  ```
- **Variant A — Ball-Free Petite (`无蛋娇小扶他`)**:
  - Positive: `1.55::futanari::, 1.45::futa without balls::, 1.55::small penis::, 1.35::tiny penis::, erection, 1.35::pussy::` *(omit `1.35::tiny penis::` for compact-average size instead of tiny)*
  - Negative UC: **`testicles, balls, scrotum`** + Anti-Oversize Lock.
- **Variant B — With Balls Petite (`有蛋娇小扶他`)**:
  - Positive: `1.55::futanari::, 1.45::futa with balls::, 1.55::small penis::, 1.35::tiny penis::, 1.35::small testicles::, testicles, erection, 1.35::pussy::`
  - Remove `testicles, balls, scrotum` from Negative UC while keeping the Anti-Oversize Lock.

### Rule 3: Multi-Character Isolation for `Futa on Female` (`双女防双扶他串色铁律`)
In single-box `2girls, futanari` prompts, V5 frequently gives **both** girls penises or merges their hair/outfits. Always use `[Base Prompt]` + `[Character 1]` + `[Character 2]` with directed action tags:
- **`[Character 1 (D3)]` (Futa Top / 扶他攻)**:
  - Include `1.55::futanari::, 1.45::futa without balls::, 1.45::penis::, source#vaginal, -2.5::pussy::` (suppressing `pussy` inside the top's box keeps focus cleanly on her penetrating shaft).
- **`[Character 2 (B4)]` (Pure Female Bottom / 纯女受)**:
  - Include `1.35::pussy::, target#vaginal, -2.5::futanari, penis, testicles::` (local negative lock prevents her from sprouting a penis).
- **Global Negative UC**: Add `1girl, 3girls, 1boy, male, twins, identical hair, double penis, two penises, extra limbs, fused bodies`.

### Rule 4: Male-on-Futa Receiving Anatomy Layering (`男攻 × 扶他受双通道不打架 · 无蛋与有蛋均实测通过`)
When a male partner penetrates a futanari heroine (`vaginal, insertion`) in supine POV:
- **Both Ball-Free (`futa without balls`) AND With-Balls (`futa with balls`) work cleanly** once her anatomy is kept compact with **`1.55::small penis::, 1.35::tiny penis::, 1.35::small testicles::`** + the Anti-Oversize UC lock! Keeping her shaft and neat small testicles compact leaves crisp vertical separation directly above her glistening `pussy` so the viewer's penetrating shaft underneath never tangles or clips into her testicles.
- Anchor all three layers explicitly in T5 prose:
  - Ball-free: `"exposing her small female breasts and her cute, proportionally tiny erect ball-free futanari penis resting above her glistening pussy while the viewer's penis penetrates her pussy cleanly underneath."`
  - With-balls: `"exposing her small female breasts and her cute, proportionally tiny erect futanari penis with small neat testicles resting high above her glistening pussy while the viewer's penis penetrates her pussy cleanly underneath."`

---

## 2. Four Calibrated Archetype Recipes (Live-Verified on V5 Full)

### Archetype A: Solo Ball-Free Futanari (`单人无蛋娇小扶他 · 逆兔展示`)
- **Canvas**: Portrait `832x1216`
- **Verified Core Tags**:
  ```text
  1girl, solo, 1.55::futanari::, 1.45::futa without balls::, <char_tag>, 0.12::chibi::, 1.25::short female::, 1.2::petite::, 1.3::slender::, 1.3::slender legs::, slim waist, narrow shoulders, 1.25::narrow hips::, small breasts, cowboy shot, legs apart, head tilt, peace sign near cheek, looking at viewer, <female_outfit_with_bare_breasts>, rating:explicit, nsfw, uncensored, 1.55::small penis::, 1.35::tiny penis::, erection, 1.35::pussy::, 1.3::futanari::, precum, pussy juice, dripping
  ```
- **Extra UC**: `1boy, male, otoko no ko, crossdressing, yaoi, flat chest, male chest, pectorals, testicles, balls, scrotum, huge penis, large penis, oversized penis, thick penis, hyper penis, monster penis, veiny penis, giant penis, huge testicles, large testicles`

### Archetype B: Solo Full Futanari With Balls (`单人有蛋娇小扶他 · 逆兔展示`)
- **Canvas**: Portrait `832x1216`
- **Delta from Archetype A**:
  - Replace `1.45::futa without balls::` → `1.45::futa with balls::`, add `1.35::small testicles::, testicles` next to `erection`, and remove `testicles, balls, scrotum` from UC (keep the Anti-Oversize UC lock).

### Archetype C: Futa-on-Female Dual Character (`扶他攻 × 纯女受 · 横图三框防串色`)
- **Canvas**: Landscape `1216x832`
- **Verified Multi-Box Structure**:
  ```text
  [Base Prompt]
  masterpiece, best quality, very aesthetic, year 2025, <style_lighting>, 2girls, 1.5::futanari::, 1.4::futa on female::, yuri, <scene>, side three-quarter view, rating:explicit, nsfw, uncensored, 1.45::vaginal::, insertion, cum, cum overflow, pussy juice. Futanari <TopName> kneeling behind petite <BotName> in a consensual futa-on-female scene.

  [Character 1 (D3)]
  <top_char_tag>, <top_hair_outfit>, small breasts, 1.55::futanari::, 1.45::futa without balls::, kneeling behind on right, grabbing hips, smug, blush, 1.45::small penis::, source#vaginal, -2.5::pussy::

  [Character 2 (B4)]
  <bot_char_tag>, <bot_hair_outfit>, small breasts, all fours on left, arched back, looking back at viewer, teary eyes, heavy blush, open mouth, 1.35::pussy::, target#vaginal, -2.5::futanari, penis, testicles::
  ```

### Archetype D: Male-on-Futa Supine Receiving POV (`男方第一人称 × 扶他受仰卧抬腿 POV · 支持无蛋与有蛋`)
- **Canvas**: Portrait `832x1216`
- **Verified Core Tags (With-Balls Variant shown; swap to `futa without balls` + UC `testicles, balls, scrotum` for Ball-Free)**:
  ```text
  1girl, 1boy, hetero, faceless male, 1.4::pov::, pov hands, pov crotch, 1.55::futanari::, 1.45::futa with balls::, <char_tag>, 0.12::chibi::, 1.25::short female::, 1.2::petite::, 1.3::slender::, 1.3::slender legs::, small breasts, 1.3::from above::, lying on back, 1.35::legs up::, spread legs, knees to chest, looking at viewer, <female_outfit>, furrowed brow, half-closed eyes, teary eyes, heavy blush, open mouth, rating:explicit, nsfw, uncensored, 1.45::vaginal::, insertion, 1.4::pussy::, 1.45::futanari::, 1.55::small penis::, 1.35::tiny penis::, 1.35::small testicles::, testicles, erection, female ejaculation, cum on stomach, cum, cum overflow, pussy juice, trembling
  ```
- **Extra UC**: `2boys, yaoi, otoko no ko, crossdressing, flat chest, male chest, huge penis, large penis, oversized penis, thick penis, hyper penis, monster penis, veiny penis, giant penis, huge testicles, large testicles, male back, male head, male shoulders, male face, over-the-shoulder`

### Archetype E: `MA7A / MA7B / MA7C` Derivative Scenes · Dual-Fluid Sync (`扶他圆腹/平腹 + 子宫透视 + 内部溢流与前列腺液双流同步`)
- **Canvas**: Portrait `832x1216` (V5 Full empirically verified across all 3 variants)
- **Critical Unobstructed-Crotch & Dual-Fluid Rules (Must Apply to All 3 Variants)**:
  1. **Zero Hand-Occlusion & Zero Phantom Third Hand (Crucial!)**: Leaving `1.25::spread pussy::, 1.25::spreading own pussy::, fingers` in `MA7A/B/C` causes V5 to place a hand over the pubic mound (completely erasing or merging the futanari shaft!) or spawn a disembodied third hand. **Always strip `spread pussy, spreading own pussy, fingers`** and use clean two-hand poses (`peace sign near cheek, hand on belly` for `MA7A`/`MA7B`; `peace sign near cheek, hand on hip` for `MA7C`) + append `extra hands, extra fingers` to UC.
  2. **Ball-Free Default for Simultaneous Dual-Stream Visibility**: Use `1.55::futanari::, 1.45::futa without balls::` + `testicles, balls, scrotum` in UC (and unblock `penis, phallus, dripping` from `extra_neg`) so the vulva directly beneath the compact erect shaft remains 100% unobstructed.
  3. **Simultaneous Dual-Fluid Tag Block (Precum Above + Vaginal Cum Overflow Below)**:
     ```text
     1.55::small penis::, 1.35::tiny penis::, 1.35::erection::, 1.45::precum::, 1.4::precum string::, dripping, 1.35::pussy::, after vaginal, 1.4::cum::, 1.45::cum in pussy::, 1.4::cumdrip::
     ```
     Pair with explicit T5 prose anchoring vertical separation: `unobstructed crotch showing small erect ball-free futanari shaft dripping clear precum threads above her pussy overflowing with thick white cum.`
- **Per-Variant Delta Recipes**:
  - **`MA7A` · 饱满圆腹 + 双流同步 (无透视)**:
    - Belly unlock (`strip slim waist` from Pos, `strip plump, curvy` from UC) + `1.55::pregnant::, 1.45::stomach bulge::, 1.35::cum inflation::, round pregnant belly, protruding navel, hand on belly` + Dual-Fluid block; UC locks `x-ray, cross-section, uterus, cervix, cutaway, fetus, baby, embryo, umbilical cord`.
  - **`MA7B` · 饱满圆腹 + 子宫内部透视 + 双流同步**:
    - Same belly unlock + `hand on belly` + Dual-Fluid block + `1.45::x-ray::, 1.4::cross-section::, 1.45::uterus::, cervix, 1.55::cum in uterus::` (keep `centered x-ray uterus cutaway` in T5 prose so V5 renders the cutaway centered on the belly rather than as a side inset box; UC locks `fetus, baby, embryo, umbilical cord, skeleton, bones, skull, ribcage, gore`).
  - **`MA7C` · 纤细平腹 + 子宫内部透视 + 双流同步**:
    - Restore `slim waist, midriff, navel, hand on hip` in Pos; remove `pregnant, stomach bulge, round pregnant belly, protruding navel, hand on belly`; keep Dual-Fluid block + `1.45::x-ray::, 1.4::cross-section::, 1.45::uterus::, cervix, 1.55::cum in uterus::`; UC locks `pregnant, stomach bulge, plump, curvy, fetus, baby, embryo, umbilical cord, skeleton, bones, skull, ribcage, gore`.

---

## 3. Workbench Integration Audit Checklist (If Adding a Futanari Toggle to `web/src/`)
1. **Mutual Exclusion with Femboy Mode**: Futanari keeps `1girl` (`small breasts / bare breasts`) and female `vaginal` channel, while Femboy switches to `1boy / 2boys, yaoi, flat chest, anal` — keep them mutually exclusive (`normal | femboy | futa_no_balls | futa_with_balls`).
2. **Strip Standalone Vulva Morphology & Gaping Boosts (Anti-Pasted-On Rule — Empirically Verified)**:
   - On Futanari frontal / supine / pull-out scenes, **strip standalone morphology/vulva emphasis tags** (`MORPH_PRESETS` / `labia` / `groin` / boosted `1.35::pussy::` / `spread pussy` / `gaping`) and rely purely on unified action tags (`after vaginal, pull out, cum, cum overflow, cumdrip, cum string`) + `1.5::futanari::, 1.45::futa without balls::, 1.35::small penis::, erection, 1.35::precum::`.
   - **Why**: High-weight standalone vulva morphology splits V5's crotch cross-attention into two competing priors, causing either complete futanari shaft disappearance or a hard "pasted-on" step at the pubic root. Removing them eliminates the pasted-on feel immediately **without needing to blend external futanari artists** (preserving 100% of the user's `mikozin` art style).
   - For 2-person supine pull-out, pairing this with V5 `[Character 1 (C3)]` + `[Character 2 (C5)]` spatial isolation yields the cleanest bottom-entry male perspective and continuous pubic transition.
   - **Optional Moe-Safe Artist Tail-Blend (`安定萌化mikozin` 兼容画师微融)**: Append **`0.28::artist:pija (pianiishimo)::`** (softest, most organic pubic-to-shaft junction — verified on both ball-free and with-balls supine pull-out) or **`0.28::artist:mimonel::`** (crisper cel shading) at the **very end** of the artist chain (`<= 0.30` weight so the leading 4 artists preserve 100% of the face, gradient eyes, and thin lineart).
3. **Solo / Male-on-Futa Injection**: Inject `1.55::futanari::` + `futa without balls` (or `futa with balls, 1.4::testicles::`) + `1.35~1.55::small penis::, erection` without stripping `breasts`, and unblock `penis, phallus` from solo `extraNeg`.
4. **Rear-POV Compatibility**: On pure rear-facing POV (`rear_no_face`), keep `futanari` shaft tucked naturally under or omitted from front-chest sanitization while preserving `vaginal` penetration and `enable_uterus_xray`.
