---
name: nai-character-crafting
description: >-
  Translates reference character sheets (such as community mascots like the
  Gemini catgirl or original designs) into accurate Danbooru hair, accessory,
  fantasy outfit cut, and body-proportion tags. Use this skill when adapting a
  new character image, tuning body proportions (slender, bust size, youthful
  vs. mature), or reconstructing complex anime outfit patterns.
---

# NovelAI Character Sheet Translation & Proportion Tuning

Use this skill when converting a character reference image (e.g., `gemini.png` turnaround sheet) or community mascot concept into concise, Danbooru-accurate NovelAI tags, and when fine-tuning body proportions and age impression.

## 1. Translating Character Reference Sheets (`Character Reference` + Tags)

1. **Always Inspect Local Reference Images First**:
   - Read the image file to extract exact hair structure (`ahoge`, `double bun`, `long wavy hair`), eye heterochromia sides (`red right eye, yellow left eye`), and geometric ornaments (`four-pointed star hair ornament`, `-2::five-pointed star::`).
2. **Use Canonical Danbooru Hair Color Tags**:
   - Avoid hyphenated non-standard color inventions like `blue-purple gradient hair` combined with `pink streaks` (which bleed into solid blue or pink hair).
   - Anchor primary color firmly with standard tags: `1.4::purple hair::, dark purple hair, gradient hair, purple cat ears, purple cat tail`.
3. **Deconstruct Fantasy / Idol Outfit Cuts into Standard Booru Terms**:
   - Instead of vague modern terms like `crop top` (which renders sporty tank tops), break anime outfits into structural pattern pieces:
     - *Neck & Torso*: `high collar, halterneck, bare shoulders, dark blue cropped bustier, purple criss-cross waist, midriff`
     - *Sleeves*: `detached wide sleeves, frilled cuffs` (or `juliet sleeves`)
     - *Skirt & Tails*: `dark blue and white layered frilled miniskirt, gold chain belt, coattails, thigh strap`
4. **Pairing with NAI `Character Reference`**:
   - Advise cropping just the **front view** from a 3-view turnaround sheet before uploading to Character Reference.
   - Turn **Style Aware OFF** when rendering in `pixel art` so smooth cel-shading from the reference sheet doesn't erase pixel dithering, and set Fidelity around `0.65 ~ 0.75` so Character 2 can still undress cleanly.

## 2. Precision Body Proportion & Youthfulness Tuning Matrix

Pixel art and kemonomimi (`cat girl`) tags easily drift toward either **short/chubby chibi** OR **overly mature/tall** depending on modifiers. Balance them using this matrix:

| User Goal / Symptom | Tags to REMOVE | Tags to ADD (Base Negative / Character Positive) |
| :--- | :--- | :--- |
| **Too round, chubby, short/wide** | — | Base: `-2::plump, chubby, thick thighs, chibi::` / Char: `slender, narrow waist` |
| **Chest became too flat + too tall** | `skinny` (flattens chest), `tall female` (overshoots height) | Char: `1.2::slender::, narrow waist, medium breasts` (or `1.2::large breasts::`) |
| **Looks too mature / older sister** | `large breasts` (binds mature face/frame), `-round face` (sharpens jaw too much) | Base: `-2::mature female, plump, chubby, thick thighs, chibi::` (do NOT ban `round face`!) / Char: `slender, petite, narrow waist, medium breasts, cute face` |

### Reference Preset: Community Dark-Purple Gemini Catgirl (哈基米娘)
```text
cat girl, slender, petite, narrow waist, medium breasts, 1.4::purple hair::, dark purple hair, gradient hair, purple cat ears, ahoge, double bun, long wavy hair, purple cat tail, four-pointed star hair ornament, heterochromia, red right eye, yellow left eye, high collar, halterneck, bare shoulders, dark blue cropped bustier, purple criss-cross waist, midriff, detached wide sleeves, frilled cuffs, dark blue and white layered frilled miniskirt, gold chain belt, coattails, thigh strap
```

## 3. Calibrated Pocket-Sized Slender Mini-Lady (`0.25::chibi::` + Low-Angle Hip Restraint)

To achieve a cute large-headed, short-jawed mini-lady silhouette (`~4.6H`) with straight slender legs and zero chubby/SD doll collapse across both V4.5 and V5 High:
- **Positive Tags**:
  `0.25::chibi::, 1.25::short female::, 1.15::very short::, 1.2::petite::, small frame, 1.3::slender::, 1.3::slender legs::, slim waist, narrow shoulders, 1.25::narrow hips::, -0.45::wide hips::, -0.45::thick thighs::, -0.40::plump::, short torso, small breasts, thigh gap, long legs, short face, round face`
- **Companion Negative UC**:
  `super deformed, doll, plushie, oversized head, stubby legs, short legs, tall female, mature female, muscular, muscular female, broad shoulders, wide shoulders, long torso, plump, chubby, fat, thick thighs, wide hips, curvy, pointy chin, sharp chin, long face, giantess, towering, miniature furniture, low doorframe`
- **Cross-Module Rules**:
  1. **Unblock `chibi`, Keep `super deformed`**: When `0.25::chibi::` is active, automatically strip `chibi, big head, wide face` from conflicting style negatives, **but keep `super deformed` in Negative** as a hard ceiling against 2-head Nendoroid collapse.
  2. **Why Keep `-0.45::wide hips::` alongside UC**: Under steep V4.5 `low angle / from below` foreshortening, UC `wide hips` alone still permits pear-shaped perspective hip flaring; keeping `1.25::narrow hips::, -0.45::wide hips::, -0.45::thick thighs::` inside Positive counteracts upward lens distortion cleanly.
  3. **Bust Override Deduplication**: Strip `small breasts` from the body string whenever the user explicitly selects a non-default bust preset.

## 4. Preset Extraction Hygiene (Filtering User Sample Prompts)

When extracting a reusable **Style Preset** or **Body Preset** from a user's full character generation prompt:
- Strip character identity (`javelin (azur lane)`), hair/eye color tags, character-specific ornament blocks (`crown, tiara`), sample clothing (`white camisole`, `sports bikini`), sample backgrounds (`white bedsheet`, `simple background, white background`), sample camera angles (`slightly from above`, `from above`), and `safe` rating tags so the preset never pollutes other characters or NSFW scenes.
