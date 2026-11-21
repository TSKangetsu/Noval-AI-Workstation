---
name: nai-futanari-crafting
description: >-
  NovelAI V4.5 / V5 futanari (扶他 / 双性女角色) anatomical and multi-character
  calibration guide. Covers preserving female headcount and chest alongside
  ball-free or with-balls anatomy, multi-box 2girls isolation to prevent
  double-futa bleed, male-on-futa dual-channel layering, and optional
  proportion/scene palettes.
---

# NovelAI V4.5 / V5 Futanari (扶他 / 双性女体) Calibration Guide

Unlike crossdressing femboy prompts (`1boy / 2boys, yaoi, flat chest`), **futanari (`扶他`)** preserves **female headcount (`1girl` / `2girls`), female chest (`breasts`), and female lower anatomy (`pussy`)** alongside a shaft (`futanari, penis`), with clean control over testicle presence and multi-character role ownership.

> **Creative Flexibility Note**: Vary body silhouettes (slender, athletic, voluptuous, mature, or petite), shaft proportions, lighting moods, and artist palettes freely to suit your scene. The compact-scale tags and artist notes below are **optional calibrated baselines** for when you want delicate/petite proportions, not rigid rules.

---

## 1. Four Core Calibration Principles

### 1. Preserve Female Headcount & Guard Against Femboy Drift
- **Solo Futanari**: Keep `1girl, solo, 1.5::futanari::` (do not mix `1boy` or `otoko no ko`).
- **Futa on Female (`扶他攻 × 纯女受`)**: Use `2girls, 1.5::futanari::, 1.4::futa on female::, yuri` + **`[Character 1]` / `[Character 2]` spatial boxes** so only the initiator has a shaft.
- **Male on Futa (`男方 × 扶他受`)**: Keep `1girl, 1boy, hetero, faceless male, 1.5::futanari::` — because she retains `pussy`, standard `vaginal, insertion` and optional womb cutaways work naturally beneath her shaft.
- **Anti-Femboy / Anti-Flat-Chest UC Guard**: Include `otoko no ko, crossdressing, yaoi, flat chest, male chest, pectorals` in Negative UC (plus `1boy, male` on solo and `2girls` scenes).

### 2. Ball-Free vs. With-Balls & Optional Scale Calibration
- **Ball-Free (`无蛋扶他`)**: Pair `1.45::futa without balls::, erection, pussy` with **`testicles, balls, scrotum`** in Negative UC.
- **With Balls (`有蛋扶他`)**: Pair `1.45::futa with balls::, testicles, erection, pussy` and omit `testicles, balls, scrotum` from UC.
- **Optional Compact / Petite Proportion Baseline**:
  - NovelAI V5's `futanari` training distribution skews large/hyper whenever bare `penis` is heavily weighted. *When composing petite or proportionally delicate characters*, add `1.45::small penis::` (plus optional `1.3::tiny penis::` or `1.3::small testicles::`) and block hyper-scale drift in UC (`huge penis, large penis, oversized penis, thick penis, hyper penis, monster penis, giant penis, huge testicles, large testicles`).
  - *When average, generous, or exaggerated proportions fit your artistic intent*, simply omit those size-reducing tags and adjust UC accordingly.

### 3. Multi-Character Isolation for `2girls` (`Futa on Female`)
In single-box `2girls, futanari` prompts, V5 often gives **both** characters penises or blends their hairstyles. Split roles with `[Base Prompt]` + `[Character 1]` + `[Character 2]`:
- **`[Character 1 (D3)]` (Futanari Initiator)**: Include `1.55::futanari::, 1.45::futa without balls::` (or `futa with balls`), `penis, source#vaginal, -2.5::pussy::` (suppressing `pussy` locally keeps attention cleanly on her penetrating shaft).
- **`[Character 2 (B4)]` (Female Partner)**: Include `1.35::pussy::, target#vaginal, -2.5::futanari, penis, testicles::` (local negative prevents double-futa bleed).
- **Global Negative UC**: Add `1girl, 3girls, 1boy, male, twins, identical hair, double penis, two penises, fused bodies`.

### 4. Smooth Dual-Channel Crotch Attention & Male-on-Futa Layering
- **Avoiding the "Pasted-On" Crotch Split**: High-weight standalone vulva morphology (`1.8::labia::`, heavy `spread pussy`, `gaping`) competes with `futanari` for groin cross-attention in V5, sometimes erasing the shaft or creating a harsh seam at the pubic root. On frontal/supine futanari scenes, omitting heavy standalone `labia` boosts lets the shaft and lower `pussy` / fluid tags (`pussy juice`, `after vaginal, cum overflow, cumdrip`) blend organically across any art style.
- **Male-on-Futa Supine Layering**: Anchor vertical separation clearly in a brief T5 sentence (e.g., *"her erect futanari shaft resting cleanly above her glistening pussy while her partner penetrates her pussy underneath"*); keeping her shaft/testicles compact prevents tangling with the lower contact zone.
- **Optional Artist Seasoning Note**: If your chosen cel/moe artist stack ever renders stiff pubic junctions, a light tail-slot touch such as `0.25::artist:pija (pianiishimo)::` or `0.25::artist:mimonel::` at the end of an artist list can soften lower-body transitions without overriding your primary style — completely optional.

---

## 2. Four Adaptable Starting Templates

*(Replace `<style_and_lighting>`, `<char_and_body>`, and `<outfit>` freely with any aesthetic, stature, bust size, and mood.)*

### A. Solo Ball-Free Showcase
```text
<style_and_lighting>, 1girl, solo, 1.5::futanari::, 1.45::futa without balls::, <char_and_body>, cowboy shot, legs apart, <outfit_and_expression>, rating:explicit, nsfw, uncensored, erection, penis, pussy, precum, pussy juice
```
- **Companion UC**: `1boy, male, otoko no ko, crossdressing, yaoi, flat chest, male chest, pectorals, testicles, balls, scrotum` *(+ optional anti-oversize UC if compact scale is desired)*.

### B. Solo With-Balls Variation
- Swap `1.45::futa without balls::` → `1.45::futa with balls::, testicles` (plus `small testicles` if compact) and remove `testicles, balls, scrotum` from UC.

### C. Dual-Character `Futa on Female` (`1216x832` or `832x1216`)
```text
[Base Prompt]
<style_and_lighting>, 2girls, 1.5::futanari::, 1.4::futa on female::, yuri, <environment_and_mood>, side three-quarter view, rating:explicit, nsfw, uncensored, 1.45::vaginal::, insertion, pussy juice. Futanari <TopName> embracing <BotName> from behind in warm intimate lighting.

[Character 1 (D3)]
<top_identity_and_body>, 1.55::futanari::, 1.45::futa without balls::, kneeling behind on right, holding hips, <top_expression>, penis, source#vaginal, -2.5::pussy::

[Character 2 (B4)]
<bottom_identity_and_body>, all fours on left, arched back, <bottom_expression>, 1.35::pussy::, target#vaginal, -2.5::futanari, penis, testicles::
```

### D. Male-on-Futa Receiving POV
```text
<style_and_lighting>, 1girl, 1boy, hetero, faceless male, 1.4::pov::, pov hands, pov crotch, 1.5::futanari::, 1.45::futa with balls::, <char_and_body>, from above, lying on back, legs up, spread legs, <outfit_and_expression>, rating:explicit, nsfw, uncensored, 1.45::vaginal::, insertion, pussy, small penis, small testicles, testicles, erection, precum, cum overflow
```
- **Companion UC**: `2boys, yaoi, otoko no ko, crossdressing, flat chest, male chest, male back, male head, male shoulders, over-the-shoulder`.

---

## 3. Optional Scene-Specific Adaptation Menu

When adapting futanari dual-channel anatomy to specialized showcases, abdominal cutaways, fantasy tentacles/arthropods, or solo mirror/direct-lens smartphone selfies, consult:
- **[scene_adaptations.md](./references/scene_adaptations.md)** — Optional futanari adaptations for standing/belly cutaway showcases (`MA7 / MA7A–C`), tentacle & symbiote dual-line play (`TN01–TN12`), fantasy hive & arthropod scenes (`BG01–BG20`), wide-angle V-legs close-ups (`MA11`), and solo smartphone selfies (`SF01–SF30`).
