---
name: nai-character-crafting
description: >-
  Optional craft guide for translating character reference sheets into accurate
  Danbooru hair, ornament, and outfit-cut tags, tuning diverse body silhouettes
  (statuesque, mature, curvy, slender, or petite), and deconstructing multi-piece
  anime outfits such as Reverse Bunnysuit without tag-merging pitfalls.
---

# NovelAI Character Sheet Translation, Silhouette Palette & Outfit Deconstruction

Use this guide as an optional toolkit when adapting a visual character sheet into NovelAI V4.5 / V5 tags, shaping a character's silhouette to match the intended mood, or breaking down intricate anime costume cuts.

## 1. Translating Character Reference Sheets (`Character Reference` + Tags)

1. **Inspect Reference Art First**:
   - Observe exact hair structure (`ahoge`, `double bun`, `long wavy hair`), asymmetric eye colors (`heterochromia, red right eye, yellow left eye`), and geometric emblem shapes (`four-pointed star hair ornament`, with `five-pointed star` in Negative if precision matters).
2. **Anchor Colors with Canonical Danbooru Tags**:
   - Invented hyphenated compounds like `blue-purple gradient hair` paired with `pink streaks` often bleed into flat blue or solid pink. Anchor primary colors with standard tags instead: `1.4::purple hair::, dark purple hair, gradient hair, purple cat ears, purple cat tail`.
3. **Break Fantasy / Idol Outfit Cuts into Structural Garment Pieces**:
   - Generic modern terms like `crop top` default to casual sporty tank tops. Deconstruct ornate cuts by body zone:
     - *Neck & Torso*: `high collar, halterneck, bare shoulders, dark blue cropped bustier, purple criss-cross waist, midriff`
     - *Sleeves*: `detached wide sleeves, frilled cuffs` (or `juliet sleeves`)
     - *Skirt & Accents*: `dark blue and white layered frilled miniskirt, gold chain belt, coattails, thigh strap`
4. **Pairing with NAI `Character Reference` (When Applicable)**:
   - Cropping just the **front view** from a 3-view turnaround sheet avoids multi-view confusion.
   - For stylized mediums like `pixel art`, turning **Style Aware OFF** prevents smooth cel-shaded reference sheets from erasing pixel dithering, while moderate Fidelity (`~0.65–0.75`) preserves outfit flexibility across variations.

### Example Sheet Translation: Dark-Purple Kemonomimi Idol
```text
cat girl, slender, narrow waist, medium breasts, 1.4::purple hair::, dark purple hair, gradient hair, purple cat ears, ahoge, double bun, long wavy hair, purple cat tail, four-pointed star hair ornament, heterochromia, red right eye, yellow left eye, high collar, halterneck, bare shoulders, dark blue cropped bustier, purple criss-cross waist, midriff, detached wide sleeves, frilled cuffs, dark blue and white layered frilled miniskirt, gold chain belt, coattails, thigh strap
```

---

## 2. Flexible Body Silhouette & Age-Impression Palette

Choose proportions freely to fit the character's design and scene atmosphere—from tall, mature, or voluptuous figures to lithe athletic builds or compact moe silhouettes:

| Desired Direction / Symptom | Helpful Positive Tags | Optional Adjustments / Negative Guards |
| :--- | :--- | :--- |
| **Tall, statuesque, or mature elegance** | `tall female, long legs, slender, mature female, medium breasts` (or `large breasts`) | Avoid `chibi, petite, short female` in Positive and remove `tall female, mature female` from any inherited Negative UC |
| **Soft, curvy, or voluptuous silhouette** | `curvy, wide hips, thick thighs, plump, large breasts, narrow waist` | Ensure `plump, curvy, wide hips, thick thighs` (and fractional counterweights like `-0.45::wide hips::`) are absent |
| **Drifted too round / chibi-short unintentionally** | `slender, narrow waist, long legs` | Add `plump, chubby, chibi, super deformed` to Negative UC |
| **Chest flattened or height overshot from `skinny`** | Swap `skinny` → `1.2::slender::, narrow waist, medium breasts` | Drop `skinny` (strongly flattens bust) and `tall female` if medium stature was intended |
| **Face drifted older / sharper than intended** | `cute face, round face, slender` | Keep `round face` unblocked (banning `round face` sharpens the jawline); optionally add `mature female, pointy chin` to Negative UC |

### Optional Named Archetype: Stylized `~4.6H` Pocket Slender Mini-Lady
When specifically aiming for a stylized cute large-headed, short-jawed mini-lady silhouette (`~4.6` heads tall) with slender legs and zero Nendoroid/SD doll collapse:
- **Example Positive Baseline**:
  `0.25::chibi::, 1.25::short female::, 1.15::very short::, 1.2::petite::, small frame, 1.3::slender::, 1.3::slender legs::, slim waist, narrow shoulders, 1.25::narrow hips::, -0.45::wide hips::, -0.45::thick thighs::, -0.40::plump::, short torso, small breasts, thigh gap, long legs, short face, round face` *(swap `small breasts` if a fuller bust is chosen)*
- **Optional Companion Negative UC**:
  `super deformed, doll, plushie, oversized head, stubby legs, short legs, tall female, mature female, muscular, broad shoulders, wide shoulders, long torso, plump, chubby, fat, thick thighs, wide hips, curvy, pointy chin, sharp chin, long face, giantess, towering, miniature furniture, low doorframe`
- **Technical Notes for This Archetype**:
  1. **Unblock `chibi`, Keep `super deformed`**: When `0.25::chibi::` is used in Positive, remove `chibi, big head, wide face` from Negative UC while keeping `super deformed` as a ceiling against 2-head SD proportions.
  2. **Low-Angle Perspective Counterweight**: Under steep `from below / low angle` foreshortening in V4.5, fractional positive counterweights (`-0.45::wide hips::, -0.45::thick thighs::`) gently restrain lens-induced hip flare without over-thinning neutral angles.

---

## 3. Snippet Extraction Hygiene (Cleaning Sample Prompts)

When saving a reusable **Style** or **Body Silhouette** snippet from a full generation prompt, strip scene-specific identity and staging tags so they do not bleed into later works:
- Remove named character tags (`javelin (azur lane)`), hair/eye colors, personal ornaments (`crown, tiara`), sample clothing (`white camisole`, `sports bikini`), sample backgrounds (`white bedsheet`, `simple background`), camera angles (`from above`), and `safe` rating tags.

---

## 4. Multi-Piece Outfit Deconstruction Example: Reverse Bunnysuit (`逆兔女郎`)

Writing `reverse bunnysuit` alone in V4.5 / V5 often drops the cropped bolero jacket or fills in the torso as a standard Playboy leotard. Deconstructing its structural pieces gives reliable control:

### Example Variant A: Heart-Pasties Reverse Bunnysuit (`黑爱心胸贴 + 腿环过膝袜`)
- **Positive Outfit Snippet**:
  ```text
  1.5::reverse bunnysuit::, bunny ears, fake animal ears, black bunny ears, detached collar, white collar, red bowtie, 1.4::black cropped jacket::, 1.35::bolero::, short sleeves, open jacket, 1.45::black pasties::, 1.4::heart pasties::, covered nipples, bare breasts, bare stomach, midriff, navel, wrist cuffs, white cuffs, bare hips, bare thighs, 1.35::zettai ryouiki::, black thighhighs, thigh strap, rabbit tail
  ```
- **Companion Negative UC**:
  ```text
  playboy bunny, black leotard, leotard, pantyhose, full pantyhose, crotchless pantyhose, panties, bra, covered torso, covered stomach, nipples
  ```

### Example Variant B: Bare-Chest Exposed Reverse Bunnysuit (`无胸贴直露版`)
- Swap pasties for `bare breasts, 1.3::nipples::`, move `pasties` into Negative UC, and remove `nipples` from Negative UC:
  ```text
  1.5::reverse bunnysuit::, bunny ears, fake animal ears, black bunny ears, detached collar, white collar, red bowtie, 1.4::black cropped jacket::, 1.35::bolero::, short sleeves, open jacket, bare breasts, 1.3::nipples::, bare stomach, midriff, navel, wrist cuffs, white cuffs, bare hips, bare thighs, 1.35::zettai ryouiki::, black thighhighs, thigh strap, rabbit tail
  ```

### Tag-Merge Pitfalls to Watch
1. **`crotchless` / `highleg` + `thighhighs` Merge Trap**: Pairing `crotchless` or `highleg` with `black thighhighs` pulls stockings upward over the pelvis into high-waisted crotchless pantyhose. Use `bare hips, bare thighs, zettai ryouiki, black thighhighs, thigh strap` + `pantyhose, full pantyhose, crotchless pantyhose` in Negative UC instead.
2. **Preventing Standard Leotard Fill-In**: Keeping `playboy bunny, black leotard, leotard, covered torso, covered stomach` in Negative UC stops the model from closing the bare midriff into a classic one-piece bunny suit.
3. **Clean Prose & Undress Tags**: Because the midriff and hips are already open, omit redundant `clothes lift` or `panties aside` modifiers, and avoid repeating raw `1.5::...::` weight syntax inside trailing natural-language T5 prose.
