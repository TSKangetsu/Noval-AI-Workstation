---
name: nai-matsuri-stealth
description: >-
  NovelAI V4.5 / V5 craft guide for Japanese summer festival stealth and
  yukata-night compositions (夏日祭典 / 烟花夜空·屋台暗巷·神社潜行·单人三态差分). Covers 5
  scene-bound festival lighting archetypes (including dark-pocket no-backlight
  rules), crowd-background & footwear UC collision guards, festival prop &
  2-hand conservation, dual-yukata Multi-Box [B3]/[D3] isolation, and same-seed
  3-stage solo yukata/obi variations (default -> pure spread -> spread +
  overflow).
---

# NovelAI V4.5 / V5 Summer Festival Stealth & Yukata Night Craft Guide

Use this skill when composing Japanese summer festival (`夏祭り / 花火大会 / 神社参道`) stealth interactions, contrasting dual-yukata encounters, and solo festival-night yukata scenes on NovelAI V4.5 / V5 without crowd-voyeur drift, bedroom/onsen leaks, footwear UC collisions, or extra-limb prop tangles.

---

## 1. Five Scene-Bound Summer Festival Lighting Archetypes

- **No-Backlight Dark-Pocket Rule**: Pair rim `1.25::backlighting::` only with fireworks-sky or lantern-bokeh alley modes (`1`, `5`); omit `backlighting` on enclosed dark-pocket modes (`2`, `3`, `4` — stall eaves, moonlit shrine groves, under-veranda / bridge undersides, close sparkler glow) so nocturnal stealth shadows stay deep and intimate.

1. **Fireworks Burst Night Sky (Backlit)**:
   - `colorful summer fireworks overhead, magenta-gold reflections, dark riverbank shadows, warm rim light`
   - **UC Guard**: `daylight, bright sun, clear blue sky, indoors, bedroom`
2. **Yatai Chochin Amber Shadows (No Backlight)**:
   - `warm festival chochin lanterns, yatai tungsten glow, deep night shadows`
   - **UC Guard**: `daylight, bright sun, clear blue sky, modern bedroom, office`
3. **Moonlit Shrine Torii & Stone Lantern (No Backlight)**:
   - `cool silver moonlight through trees, dim stone toro lantern, quiet shrine shadows`
   - **UC Guard**: `daylight, bright sun, neon sign, modern building, bedroom`
4. **Close Handheld Sparkler Glow (No Backlight)**:
   - `warm orange handheld sparkler glow, crackling embers in darkness, intimate warm skin light`
   - **UC Guard**: `daylight, bright sun, harsh ceiling light, indoors, bedroom`
5. **Night-Market Alley Lantern Bokeh (Backlit)**:
   - `deep shadowed narrow alley, colorful festival lantern bokeh, distant blurred silhouettes`
   - **UC Guard**: `daylight, bright sun, clear blue sky, indoors, bedroom`

---

## 2. Festival Stealth Geometry, Crowd & Footwear Collision Guards

- **Anti-Indoor / Anti-Onsen Drift Lock**:
  - Keep outdoor festival stealth grounded away from bedrooms or hot-spring baths with:
    ```text
    bed, mattress, pillow, bedroom, couch, sofa, modern bathroom, bathtub, hot spring
    ```
- **Background Crowd vs. Voyeur UC Collision Guard (CRITICAL)**:
  - To prevent festival backgrounds from turning into public voyeur or group scenes, block **`crowd watching, onlookers looking, voyeur, group sex, gangbang, 3boys`** in Negative UC.
  - Never write `crowd watching fireworks` in Positive when `crowd watching` is in Negative UC — use **`distant blurred festival silhouettes`** instead so the night-market ambiance renders cleanly with zero positive/negative token collision.
- **Barefoot vs. Placed-Geta Negative Guard (CRITICAL)**:
  - On barefoot scenes where wooden `geta` sandals are intentionally placed beside a picnic mat or jacket in the foreground/background, do **not** put bare `geta` in Negative UC (which collides with the prop). Block **`wearing geta`** instead alongside `shoes, footwear, sneakers, boots, thighhighs, stockings, socks, pantyhose`.
  - When characters wear wooden `geta` with bare ankles, block `sneakers, boots, high heels, thighhighs, pantyhose, modern shoes`.
- **Outdoor Partner Wardrobe Consistency**:
  - Keep the outdoor stealth partner dressed consistently with the night festival (`in unbuttoned dark yukata`) rather than defaulting to bare indoor silhouettes.
- **Low Under-Veranda / Narrow-Space POV Contact Anchor**:
  - On reclining POV scenes beneath shrine verandas or bridge undersides, explicitly anchor `1.55::spread legs::`, `pov penis entering from lower-right foreground`, and `1.5::penetration::` so legs do not cross shut or drop partner contact.

---

## 3. Festival Prop & Two-Hand Conservation Physics

- **Goldfish Bag Anti-Hanging Lock**:
  - In kneeling oral or close POV scenes with a festival goldfish bag, V5 readily loops the bag's red drawstring directly onto the partner's shaft unless hands are explicitly separated. Anchor **`left hand holding goldfish bag by knee, right hand flat on viewer thigh, hands away from shaft`** to enforce 2-hand and prop conservation.
- **Grounded Festival Props**:
  - Keep hands naturally bound to festival items (`uchiwa paper fan`, `goldfish plastic bag`, `handheld sparkler`, `candied apple`, `chilled ramune bottle`, `kitsune mask`), holding compact props `in mouth` (e.g., candied apple stick) whenever both hands are needed elsewhere.
- **Keep Phrases Crisp (`<= 7` Words per Comma Segment)**:
  - Split long descriptive runs into concise comma-separated phrases so T5 attention stays sharp on spatial layers and never overflows the 512-token budget.

---

## 4. Dual-Yukata Multi-Box `[B3]/[D3]` Isolation & 4-Mode Gender Routing

- **Contrasting Dual-Yukata Yuri (`2girls`)**:
  - Partition contrasting festival yukatas across `[Character 1 (B3)]` (e.g., sakura-pink yukata, `target#...`) and `[Character 2 (D3)]` (e.g., navy-blue yukata with kitsune mask, `source#...`) with mutual `-2.5::...::` color guards to maintain zero color bleed and exact 4-arm / 4-leg conservation.
- **Crossdressing Femboy (`2boys, yaoi` / Solo `1boy, otoko no ko`)**:
  - Use Multi-Box `[B3]` / `[D3]` on duo scenes; on open-collar/bare-chest scenes, swap female chest descriptions to `flat chest` and rewrite female subject nouns/pronouns (`an adult woman` / `her` → `a slender crossdressing boy` / `his`) so Positive never collides with femboy Negative UC.
- **Futanari (`futa_no_balls` / `futa_with_balls`)**:
  - Use Multi-Box role separation on duo scenes; on solo spreading variations, keep the shaft untouched above while fingers spread below (`holding own penis, grabbing penis` in UC).

---

## 5. Solo Festival Same-Seed 3-Stage CG Variations

When building solo festival-night scenes that progress cleanly across **Default Base → Pure Spread (`纯净掰开`) → Spread + Overflow (`掰开+白流出`)** on a shared seed:

1. **Yukata Hem-Tucking & Two-Hand Conservation**:
   - When a signature festival prop occupies one hand (sparkler, uchiwa fan, ramune bottle) and the base pose holds up the yukata skirt with the other hand, **tuck the lifted yukata hem securely into the waist `obi` sash** on spread stages so the freed hand can spread without spawning a third arm.
   - Always append **`covering crotch, covering pussy, hand over crotch, holding own penis, grabbing penis, extra arms, 3 arms`** to Negative UC on spread stages.
2. **Pure-Spread Anti-Cum Isolation Lock (CRITICAL)**:
   - On Stage 2 (pure spreading), append **`cum, semen, cum in pussy, cum in ass, cum overflow, cumdrip, after sex`** to Negative UC so arbitrary seeds stay crystal-clear with zero fluid bleed.
   - On Stage 3 (spread + overflow), align fluid direction strictly with gravity and surface contact (vertical downward streams on crouching/standing poses, pooling onto dark stone steps, picnic mats, or grass beneath seated poses).
3. **Cross-Gender-Safe Solo Partner Ban**:
   - In shared solo festival UC, block only partner/multi-person concepts:
     ```text
     2boys, multiple boys, man, hetero, penetration, insertion, 2girls, multiple girls
     ```
   - Never hardcode `1boy, male, penis, futanari, testicles, flat chest, otoko no ko` into a cross-gender shared solo UC; let gender-specific routing handle female-only exclusions cleanly.
