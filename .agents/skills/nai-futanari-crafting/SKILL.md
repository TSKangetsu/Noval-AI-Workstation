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

### Archetype E0: `MA7` Special Two-Handed Futanari Spread Variant (`扶他 MA7 专属差分 · 无比耶双手微拨：居中直立小前端 + 指尖轻拨双蛋与阴唇 + 白浊涌流`)
- **Canvas**: Portrait `832x1216` (V5 Full empirically verified **3/3 = 100% consistent** with `⚡🌷 安定萌化futa专用` / `0.28::artist:pija (pianiishimo)::` tail-blend)
- **Design Intent (v4 Final · 3/3 = 100% Stable)**: Drops `peace sign near cheek` (`peace sign, v` in UC) AND **bans gripping/pulling the shaft sideways** (`holding own penis, grabbing penis` in UC!). Instead:
  - **Upper Center**: Her compact erect futanari shaft stands **untouched and centered pointing upward**, dripping clear glossy precum from the tip.
  - **Lower Left & Right**: With `wide spread legs` giving the groin 2x pixel real estate, her right fingertips gently tug/part her small round testicles slightly to the viewer's left while her left fingers pull open the right half of her glistening pink labia directly underneath so **thick white cum overflows and drips straight down from inside**.
- **Critical Calibration Rules (Empirically Verified — 3/3 = 100% Pass Rate)**:
  1. **Keep Shaft Untouched & Upright (`1.35::small penis::, 1.3::erection::` + UC `holding own penis, grabbing penis`)**: Removing `holding own penis` from Positive and blocking it in UC completely eliminates awkward sideways stretching, upward ball-squishing, and anatomy inversion!
  2. **Lock Both Hands on Groin**: Add `wide spread legs, 1.35::holding own testicles::, 1.4::pussy::, 1.35::spread pussy::, 1.35::labia::, fingers` in Positive and lock `peace sign, v, holding own penis, grabbing penis, hand on hip, hand on thigh, arm at side, arms at sides, extra penis, duplicate penis, two penises, extra hands, extra fingers, 3 hands` in UC.
  3. **Simultaneous Internal Cum Overflow + Precum**: Always include `after vaginal, 1.4::cum::, 1.45::cum in pussy::, 1.4::cumdrip::, 1.35::precum::, dripping`, paired with `0.28::artist:pija (pianiishimo)::` at the end of the artist chain.
- **Verified Core Delta Tags (v4 · 3/3 = 100% Stable)**:
  - **With-Balls (`futa_with_balls` · Primary Showcase)**:
    ```text
    1.55::futanari::, 1.45::futa with balls::, cowboy shot, 1.25::asymmetrical pose::, wide spread legs, head tilt, 1.3::smug::, playful cheerful expression, one eye slightly narrowed, looking at viewer, 1.35::small penis::, 1.3::erection::, 1.35::small testicles::, 1.35::testicles::, 1.35::precum::, dripping, 1.35::holding own testicles::, 1.4::pussy::, 1.35::spread pussy::, 1.35::labia::, after vaginal, 1.4::cum::, 1.45::cum in pussy::, 1.4::cumdrip::, pussy juice, fingers
    ```
    - **T5 Prose**: `Her small erect futanari penis stands untouched and centered pointing upward dripping clear precum; below it, her right hand's fingertips gently tug only her small round testicles slightly to the viewer's left, while her left hand's fingers pull open the right half of her glistening pink labia so thick white cum overflows and drips straight down from inside.`
    - **UC**: `peace sign, v, holding own penis, grabbing penis, hand on hip, hand on thigh, arm at side, arms at sides, extra penis, duplicate penis, two penises, extra hands, extra fingers, 3 hands, huge penis, large penis, oversized penis, thick penis, hyper penis, monster penis, giant penis, huge testicles, large testicles`
  - **Ball-Free (`futa_no_balls`)**:
    - Swap `1.45::futa with balls::, 1.35::small testicles::, 1.35::testicles::, 1.35::holding own testicles::` → `1.45::futa without balls::`, add `testicles, balls, scrotum` to UC, and change `"gently tug only her small round testicles slightly to the viewer's left"` → `"gently pull open the left side of her glistening pink labia"` in T5 prose.

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

### Archetype F: Tentacle Series Futanari Dual-Line Sync (`触手系列 TN01–TN12 扶他双线同步 · 上榨前端 + 下贯阴道 / 活体寄生服 / 横图三端满载`)
- **Canvas**: Portrait `832x1216` (`TN01–TN02, TN04–TN09, TN11–TN12`) / Landscape `1216x832` (`TN03, TN10`)
- **Recommended Style Blend**: Always pair Futanari tentacle scenes with **`⚡🌷 安定萌化futa专用`** (`0.28::artist:pija (pianiishimo)::` at the end of the artist chain) for seamless pubic-to-tentacle integration and zero pasted-on artifacts.
- **Core Dual-Line Tentacle Mechanics (Verified Live on `TN05`, `TN07`, `TN10`, `TN11`)**:
  1. **Simultaneous Upper Shaft Milking + Lower Vaginal Penetration**:
     ```text
     1girl, solo, 1.55::futanari::, 1.45::futa without balls::, ..., 1.35::tentacles on breasts::, 1.4::small penis::, 1.35::erection::, 1.45::coiled tentacle around penis::, 1.4::milking::, 1.4::cum::, cum on stomach, 1.4::precum::, 1.4::vaginal::, dripping
     ```
     - For **With-Balls (`futa_with_balls`)**, swap `1.45::futa without balls::` → `1.45::futa with balls::, 1.25::small testicles::, testicles`, unblock `testicles, balls, scrotum` in UC, and keep `huge testicles, large testicles` blocked.
     - Always **strip standalone vulva morphology (`labia, 0.65::spread pussy::`)** so the upper coiled milking tentacle and lower penetrating tentacle never fight over crotch attention.
  2. **Per-Archetype Highlights**:
     - **`TN05` (Coiled Milking & Suction)**: Spiral purple tentacle milks her compact shaft shooting cum across her belly while a second suction-cup tentacle penetrates her pussy below and wraps both small breasts.
     - **`TN07` (Tentacle Nest Mating Press)**: Overhead/inverted folded-legs mating press on a writhing purple tentacle bed with simultaneous shaft-coiling milking + deep lower penetration (add `upside-down` to UC if upright head orientation is preferred).
     - **`TN10` (Landscape `1216x832` 3-End Overload + Uterus X-Ray)**: Horizontal mid-air suspension with **all 3 ends active simultaneously**: (1) mouth deepthroat tentacle, (2) vaginal tentacle + centered belly uterus x-ray cutaway, (3) slender coiled tentacle milking her upright futanari shaft shooting cum!
     - **`TN11` (Living Tentacle Parasite Suit / Symbiote)**: Glossy purple-black living membrane (`1.55::living clothes::, 1.5::symbiote::, 1.5::tentacle suit::, 1.45::translucent slime bodysuit::, glowing veins`) crawling up thighs/arms/torso while neon living tendrils coil around her shaft and penetrate underneath.
     - **`TN12` (Translucent Glowing Egg-Belly Host)**: `1.55::translucent belly::, 1.5::glowing eggs inside belly::, 1.55::extreme stomach bulge::, 1.55::oviposition::` (no cutaway box — glowing alien eggs shine directly through semi-translucent belly skin) + lower egg-laying & upper shaft milking.
  3. **Tentacle UC Hygiene**: Unblock `penis, phallus` (and `testicles` for with-balls) from tentacle `extra_scene_neg`, while keeping `1boy, male, otoko no ko, crossdressing, yaoi, flat chest, male chest, human hands, extra hands, extra arms, extra legs` + Anti-Oversize UC (`huge penis, large penis, oversized penis, thick penis, hyper penis, monster penis, giant penis`) locked.

### Archetype G: Fantasy Hive & Doujin-Style Arthropod Futanari Adaptation (`虫类系列 BG01–BG20 扶他双线差分 · 荧光软虫双套弄 / 巨蜘趴背后入 / 蚊蝇抱身前入 / 横图大虫交尾白蛆剖面`)
- **Recommended Style Blend**: Pair all `BG01–BG20` Futanari scenes with **`⚡🌷 安定萌化futa专用`** (`0.28::artist:pija (pianiishimo)::` tail-blend) + strip standalone vulva morphology (`labia, 0.65::spread pussy::`).
- **Empirically Verified Futanari Insect Archetypes (`BG02`, `BG04`, `BG07_v2`, `BG09`, `BG11`, `BG14`, `BG16`, `BG20`)**:
  1. **`BG02` (Giant Translucent Worm Dual-Play)**: Giant smooth glowing cyan-emerald slime-worm (`1.55::giant worm::, 1.5::glowing translucent worm::, 1.45::slime worm::`) penetrates her pussy deeply below while a smaller glowing worm spirals around her compact shaft (`1.4::small penis::, 1.35::erection::, 1.45::milking::, 1.4::cum::`) shooting white cum onto her belly.
  2. **`BG04` (Bioluminescent Jelly-Slugs Crawling — With-Balls Verified)**: `1.55::glowing translucent slugs::, 1.5::pastel bioluminescent larvae::` crawling across collarbone, small breasts, wrists, and coiling gently around `1.35::small penis::, 1.3::small testicles::, testicles, erection, 1.4::precum::`.
  3. **`BG07` (Lower-Body Glowing Larvae Overflow + Erect Shaft Precum)**:
     ```text
     1girl, solo, 1.55::futanari::, 1.45::futa without balls::, ..., 1.45::stomach bulge::, round belly, 1.45::after vaginal::, 1.6::worms::, 1.55::small worms::, 1.5::grubs::, 1.5::larvae::, 1.45::cum overflow::, 1.45::slimy::, 1.4::small penis::, 1.35::erection::, 1.45::precum::, precum string, dripping
     ```
     - **T5 Prose**: `many small plump segmented translucent glowing pink-and-cyan jelly worms and larvae wriggling and overflowing out from her pussy with thick white slime, while her small erect ball-free futanari shaft stands cleanly above dripping clear precum.`
     - **CRITICAL Larvae UC**: **Unblock `maggots`**, add `round eggs` + `realistic, photorealistic, 3d, horror, gore, blood, rotting, corpse, dirty, cockroach, fly, legs on worms, spiky`.
  4. **`BG09` (Glowing Leech-Slug Triple Suction — With-Balls Verified)**: Plump neon cyan-violet suction-worms (`1.55::glowing leech::, 1.5::translucent suction-worm::, 1.5::nipple suction::`) latched onto both nipples while a third glowing suction-worm engulfs and milks the tip of her compact shaft (`glowing suction-worm engulfing tip of penis, 1.5::milking::, 1.45::cum::`) above neat small testicles.
  5. **`BG11` (Living Iridescent Chitin Exoskeleton Symbiote)**: `1.55::living armor::, 1.5::iridescent chitin bodysuit::, 1.45::insect girl::, glowing antennae on head, translucent glowing insect wings` framing her bare breasts while glowing green bio-tendrils spiral around her compact futanari shaft and penetrate underneath.
  6. **`BG14` (Doujin Giant Spider Back-Clinging Rear Entry — Ball-Free Verified `s550225688`)**:
     - **Positive Core**: `indoors, wooden floor, beige rug, wide shot, from side, 1.45::all fours::, arched back, raised hips, 1.6::giant spider::, 1.5::arachnid::, dark chitinous spider body clinging onto her back, 8 long jointed spider legs wrapping around her shoulders, ribs, and thighs, 1.45::from behind::, 1.45::vaginal::, thick fleshy spider phallus penetrating from behind, 1.4::cum overflow::, 1.35::small penis::, erection, 1.4::precum::`.
     - **CRITICAL Arthropod Leg UC**: Replace bare `extra legs` in UC with **`extra human arms, extra human legs`** so V5 preserves all 8 spider legs while keeping her small erect ball-free futanari shaft cleanly visible beneath her arched belly!
  7. **`BG16` (Winged Giant Mosquito/Fly Standing Front Cling — With-Balls Verified `s379807513`)**:
     - **Positive Core**: `indoors, bedroom, against wall, cowboy shot, legs apart, arched back, 1.6::giant insect::, 1.5::giant mosquito::, 1.45::giant fly::, translucent veined insect wings, compound eyes, six slender jointed insect legs clinging tightly onto her front torso and hips, long flexible proboscis sucking her nipple, 1.45::vaginal::, thick fleshy insect penis penetrating her pussy from the front, 1.35::small penis::, 1.3::small testicles::, testicles, erection, 1.4::cum overflow::`.
  8. **`BG20` (Landscape Multi-Bug Mounting + Womb Egg/White-Maggot X-Ray — Ball-Free Verified `s2037791077`)**:
     - **Positive Core**: `indoors, messy bedroom bed, wide shot, from side, reclining on back with legs spread wide, 1.6::giant insect::, glossy dark chitinous beetle-fly mounting between her legs, jointed insect legs gripping thighs, smaller dark bugs crawling on stomach, 1.5::stomach bulge::, 1.5::x-ray::, 1.45::cross-section::, 1.45::uterus::, centered womb cross-section packed with insect eggs and wriggling plump white maggots, 1.6::maggots::, 1.55::white grubs::, plump white maggots and thick cum overflowing from her pussy, 1.4::small penis::, erection, 1.4::precum::`.
     - **UC Hygiene**: Unblock `maggots, cockroach, fly, spider`, use `extra human arms, extra human legs` (never `extra legs`), and block `photorealistic, realistic, 3d, gore, blood, wound, rotting, corpse, fetus, baby, embryo, skeleton, bones`.
  9. **Groin-to-Head Worm's-Eye POV (`View B · 胯部向头部仰视双视角差分` — Verified Live on `TN05` `s1376873169`, `BG14` `s771767528`, `BG20` `s3666267682`)**:
     - Switching any `TN01–TN12` or `BG01–BG20` Futanari scene to **View B** (`832x1216` vertical + `1.55::from below::, 1.45::pov::, 1.5::foreshortening::, groin focus in foreground` + `upside-down` in UC) dramatically magnifies Futanari dual-channel anatomy in the immediate foreground:
       - **Frontal / Supine (`TN05`, `BG20`)**: Lower vaginal penetration or `1.55::maggots in pussy::` gush sits right at the bottom edge, her compact erect futanari shaft (and coiled milking tentacle/worm) stands directly above it in sharp close-up, a centered `x-ray, cross-section` womb window (when active) sits cleanly on her mid-belly, and her breasts & blushing face crown the top!
       - **All-Fours Rear (`TN03`, `BG05`, `BG14` `s771767528`)**: `1.55::from behind::, 1.5::from below::, 1.45::pov::, 1.5::foreshortening::, 1.45::ass focus::` places both the rear-entering spider/tentacle phallus AND her hanging erect futanari shaft dripping precum in massive lower-foreground focus while looking forward along her arched back to her turned head!
  10. **Internal X-Ray / Cross-Section Futanari Routing Across `TN01–TN12` & `BG01–BG20` (`全 32 场景扶他透视版 · 实测验证`)**:
      - **Frontal / Supine (`TN01–TN12, BG01–BG20`)**: Keep female `1.55::x-ray::, 1.5::cross-section::, 1.5::uterus::` cleanly centered on the mid-lower belly **above** her compact erect futanari shaft (`1.35::small penis::, erection, 1.4::precum::`), with lower vaginal penetration or maggot/larvae overflow below (`BG20` `s504269647` / `s3666267682` verified!).
      - **Side-Profile Rear (`TN03, BG05, BG14` *Verified `s1400135221`*)**: On `1216x832` `from side`, use **`side-profile abdominal x-ray cutaway`** showing the spider/insectoid phallus flooding her uterus while her compact futanari shaft hangs naturally underneath her belly dripping clear precum!
      - **Oral / Facehugger (`TN08, BG08, BG15`)**: Route to **`1.55::x-ray::, 1.5::cross-section::, 1.5::stomach x-ray::`** along the neck & chest (keeping `bare breasts` intact). Always append `fetus, baby, embryo, umbilical cord, skeleton, bones, skull, ribcage, medical diagram` to UC.
  11. **`MA11` Ultra Close-Up Wide-Angle V-Legs Under-Crotch Peace-Sign Showcase (`V字高抬腿超近距广角胯下仰视比耶 · 实测 s1618377547`)**:
      - Pair with `⚡🌷 安定萌化futa专用` (`+ 0.28::artist:pija (pianiishimo)::` tail-blend) and strip standalone vulva morphology (`labia, 0.65::spread pussy::`). Combine `1.65::close-up::, 1.7::from below::, 1.65::worm's-eye view::, 1.65::extreme foreshortening::, 1.5::wide-angle lens::, 1.4::fisheye::, 1.55::pov::, 1.3::dutch angle::, 1.6::ass focus::, 1.6::groin focus::, 1.45::anus::, groin and buttocks filling lower two-thirds of frame, head small at top, lying on back, 1.55::legs up::, 1.5::spread legs::, 1.5::v-shaped legs::, 1.4::small penis::, erection, 1.35::precum::, pussy, 1.4::one eye closed::, wink, 1.35::grin::, 1.45::v::, 1.4::peace sign::, hand next to cheek` + UC `full body, wide shot, distant, upside-down, inverted, head at bottom, legs at top`. Renders a seamless vertical triad (anus → glossy slit → compact erect shaft) filling ~70% of the screen.

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
