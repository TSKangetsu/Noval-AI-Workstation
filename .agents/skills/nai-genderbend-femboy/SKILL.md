---
name: nai-genderbend-femboy
description: >-
  NovelAI V4.5 / V5 crossdressing femboy (otoko no ko / 伪娘) and boyish
  genderbend (男体化) transformation guide. Balances canonical female character
  identity against breast regrowth, accidental futanari bleed, and adult
  masculine/bara drift across solo, 2boys multi-character, and optional niche
  scene palettes.
---

# NovelAI V4.5 / V5 Crossdressing Femboy & Boyish Genderbend Guide

When adapting a named female anime character (or original feminine design) into a **crossdressing femboy (`otoko no ko / 伪娘`)** or **boyish genderbend (`男体化`)**, NovelAI V4.5 / V5 pulls in three competing directions:
1. **Canonical Female Prior**: Character identity tags pull `1girl`, `breasts`, and `pussy` back into the image.
2. **Adult Masculine / Bara Drift**: Heavy raw `1boy, male` alone widens shoulders, thickens necks, and sharpens jawlines.
3. **Accidental Futanari Bleed**: Pairing feminine outfits (`maid, reverse bunnysuit, thighhighs`) with `penis` without removing `1girl / breasts / pussy` produces `futanari` rather than a flat-chested boy.

> **Creative Flexibility Note**: Choose stature (slender `bishounen`, cute `otoko no ko`, sporty youth, or petite silhouette), expressions, lighting atmosphere, and artist palettes freely to match your character concept. Petite `~4.6H` proportions and compact anatomy tags below are **optional calibrated baselines**, not universal laws.

---

## 1. Four Core Transformation Principles

### 1. Swap Headcount & Gender Anchors (`1girl` → `1boy` / `2boys`)
- **Solo Crossdressing Femboy (`女装伪娘`)**:
  - Replace `1girl, solo` with `1.35::1boy::, solo, 1.45::otoko no ko::, 1.4::crossdressing::, 1.3::androgynous::, 1.3::genderbend::` (raise slightly to `1.45::1boy::, 1.55::otoko no ko::` on topless/bare-chest scenes).
- **Solo Boyish Genderbend (`男体化`)**:
  - Replace `1girl, solo` with `1.5::1boy::, solo, 1.5::genderbend::, 1.4::bishounen::, cute boy` + `1.3::short hair::, messy boyish <color> hair` while keeping iconic eye colors or signature hairpins so the character stays recognizable.
- **Two-Person Interaction (`2boys, yaoi`)**:
  - Omit `1girl, hetero, vaginal, pussy` completely and use `2boys, 1.5::yaoi::, 1.5::otoko no ko::, 1.4::crossdressing::, faceless male`.
  - **Multi-Box Isolation Tip for `2boys`**: In non-POV two-person scenes, single-box `2boys, <char_tag>, faceless male` can clone the femboy's hair color onto the partner. Splitting into `[Base Prompt]` + `[Character 1 (B3)]` (femboy + `target#anal`) + `[Character 2 (D3)]` (`1boy, tall male, faceless male, source#anal, -2.5::otoko no ko, crossdressing, <char_hair_color>::`) keeps both roles distinct.

### 2. Flat Boyish Chest & Optional Silhouette Tuning
- **Chest Replacement**: Strip `breasts, small breasts, bare breasts, cleavage, underboob, pasties` from Positive and use:
  - *Clothed*: `1.45::flat chest::, male chest, hairless chest`
  - *Bare-Chest*: `1.55::flat chest::, 1.4::flat male chest::, tiny pink nipples, hairless torso, bare chest` *(omit `pectorals` if you prefer a soft, smooth chest contour without defined pec creases; include `pectorals` for toned `bishounen` builds)*.
- **Optional Petite Silhouette Baseline**:
  - When aiming for a dainty, cute crossdressing frame without wide male shoulders, you can pair `short male, petite, slender, slim waist, narrow shoulders, narrow hips, round face` (and optional `0.12::chibi::`). Omit these whenever composing taller, older, or sleek `bishounen` proportions.

### 3. Dual-Guard Negative UC & Optional Anatomy Scale Calibration
- **Anti-Female & Anti-Futanari UC Guard** (prevents breast regrowth and futanari bleed):
  ```text
  1girl, 2girls, female, girl, hetero, breasts, small breasts, medium breasts, large breasts, cleavage, underboob, pussy, vulva, labia, vaginal, futanari, hermaphrodite
  ```
- **Soft-Feature / Anti-Bara UC Guard** *(include when keeping delicate boyish features; relax if a toned/athletic build is desired)*:
  ```text
  muscular, muscular male, bara, broad shoulders, wide shoulders, thick neck, adam's apple, facial hair, stubble, mature male
  ```
  *(For non-crossdressing male genderbends, also block `long hair, twintails, dress, skirt, maid, crossdressing`.)*
- **Optional Compact Anatomy Calibration**:
  - Heavy bare `1.45::penis::` on petite frames triggers V5's adult/hyper-scale prior. *When proportional compact scale is desired on a petite character*, use `1.45::small penis::, 1.3::small testicles::, testicles, erection` (plus optional `tiny penis`) and add `huge penis, large penis, oversized penis, thick penis, hyper penis, monster penis, giant penis, huge testicles` to UC. Omit this cap whenever standard or larger proportions suit the scene.

### 4. Lower-Body Channel & Cutaway Rerouting
- In 2-person explicit scenes, route interaction tags from `vaginal, pussy, cum in pussy` to **`1.5::anal::, 1.45::anal penetration::, 1.45::male penetrated::`** (+ `erection, penis, testicles, male ejaculation, cum, precum`).
- **Internal Cutaways**: Never leave female `uterus, cervix` on femboy subjects (unless intentionally depicting surreal fantasy); use **`x-ray, cross-section, intestines, cum in ass`** and add `uterus, cervix, womb` to UC.
- **Strict Rear-Facing POV**: On pure back-of-head `from behind` POV, omit facial/iris tags and front-chest ornaments while locking `looking back, face, eyes` in UC to avoid 180° neck turns.

---

## 2. Four Adaptable Starting Templates

*(Substitute `<style_and_lighting>`, `<char_tag>`, stature, expressions, and outfits freely.)*

### A. Clothed Crossdressing Skirt-Lift Bulge (Suggestive / Everyday)
```text
<style_and_lighting>, 1.35::1boy::, solo, 1.45::otoko no ko::, 1.4::crossdressing::, 1.3::androgynous::, 1.3::genderbend::, <char_tag_and_stature>, 1.45::flat chest::, male chest, hairless chest, cowboy shot, standing, head tilt, looking at viewer, <teasing_expression>, frilled maid apron, black pleated miniskirt, white blouse, thighhighs, 1.3::skirt lift::, 1.25::bulge::, white panties
```

### B. Bare-Chest Reverse Bunnysuit Contrast
*(Note: swap female `bare breasts, nipples` → `bare chest, 1.55::flat chest::, 1.4::flat male chest::, tiny pink nipples`.)*
```text
<style_and_lighting>, 1.45::1boy::, solo, 1.55::otoko no ko::, 1.45::crossdressing::, 1.35::genderbend::, <char_tag_and_stature>, 1.55::flat chest::, 1.4::flat male chest::, tiny pink nipples, hairless torso, cowboy shot, legs apart, <expression>, 1.5::reverse bunnysuit::, bunny ears, white collar, red bowtie, black cropped jacket, bolero, open jacket, bare chest, bare stomach, navel, white cuffs, black thighhighs, rating:explicit, nsfw, uncensored, male, penis, testicles, erection, precum
```

### C. Short-Hair Boyish Genderbend (`男体化`)
```text
<style_and_lighting>, 1.5::1boy::, solo, 1.5::genderbend::, 1.4::bishounen::, cute boy, <char_tag>, 1.3::short hair::, messy boyish <hair_color> hair, <signature_hairpin>, <stature>, 1.5::flat chest::, flat male chest, hairless torso, cowboy shot, standing, hand on hip, cheeky grin, unbuttoned white collared shirt, loose necktie, navy shorts
```

### D. Two-Person Femboy Receiving POV (`2boys, yaoi`)
```text
<style_and_lighting>, 2boys, 1.5::yaoi::, 1.5::otoko no ko::, 1.4::crossdressing::, faceless male, 1.4::pov::, pov hands, pov crotch, <char_tag_and_stature>, 1.55::flat chest::, 1.4::flat male chest::, hairless torso, from above, lying on back, legs up, spread legs, <femboy_outfit_and_expression>, rating:explicit, nsfw, uncensored, 1.5::anal::, 1.45::anal penetration::, 1.45::male penetrated::, erection, penis, testicles, male ejaculation, cum on stomach, trembling
```

---

## 3. Optional Scene-Specific Adaptation Menu

When adapting crossdressing femboy or boyish genderbend characters to abdominal cutaways, fantasy tentacle/arthropod scenes, or solo mirror/direct-lens smartphone selfies, consult:
- **[scene_adaptations.md](./references/scene_adaptations.md)** — Optional femboy rerouting notes for belly/colon cutaway showcases (`MA7A–C`), tentacle chest-swap & milking play (`TN01–TN12`), fantasy hive & arthropod scenes (`BG01–BG20`), wide-angle V-legs close-ups (`MA11`), and solo smartphone selfies (`SF01–SF30`).
