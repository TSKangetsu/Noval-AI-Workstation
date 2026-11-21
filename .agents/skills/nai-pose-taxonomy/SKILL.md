---
name: nai-pose-taxonomy
description: >-
  Optional spatial composition, camera physics, multi-character partitioning,
  and posture vocabulary palette for NovelAI V4.5 / V5. Covers V5 native RGBA
  transparent cutouts, [Character N (A1..E5)] & source#/target#/mutual# role
  isolation, optical 1st-person POV consistency, creature/selfie UC collision
  traps, and progressive reference menus for two-person, multi-person, fantasy,
  and solo smartphone-selfie compositions.
---

# NovelAI V4.5 / V5 Spatial Composition & Posture Palette

## 1. Sensibility-First Composition Principle

Start every scene from **mood, narrative tension, gaze, lighting atmosphere, and natural T5 prose** rather than mechanically copy-pasting numbered posture SKUs or locking a single house style:
- Let the emotional beat dictate framing (intimate close crop, languid off-center negative space, dramatic chiaroscuro, or playful wide-angle foreshortening) and choose artists, color palettes, and body proportions freely per scene.
- Treat the catalogs in `./references/` as **optional vocabulary & inspiration menus** — borrow individual Danbooru posture anchors or camera physics tricks when helpful, and rewrite props, expressions, and environments organically.

---

## 2. Native Transparent Background (V5 RGBA Cutout Physics)

NovelAI Diffusion V5 (`nai-diffusion-5-full` / `nai-diffusion-5-full-medium`) natively outputs 32-bit straight-alpha RGBA PNGs when both prompt tags and the API hint are aligned:
- **Positive Tags**: `2.0::transparent background::, has alpha, alpha transparency, no background`
- **API Payload Parameter**: Set `"tag_hint_transparent_background": true` (boolean `true`, never integer `1`) inside `parameters`.
- **Scene Sanitization**: Omit room/atmosphere tags (`indoors, bedroom, window, bokeh, depth of field`) and swap furniture-bound poses (`lying on bed`, `kneeling on couch`) to surface-neutral geometry (`lying on back`, `kneeling`, `supporting weight`).
- **Negative UC**: `background, simple background, white background, black background, gradient background, indoors, outdoors, scenery, furniture, bed, couch, pillow, wall, floor, drop shadow`

---

## 3. Multi-Character Spatial Isolation (`[Character N]` & Role Prefixes)

Putting two or more distinct characters into a single flat prompt causes trait fusion, twin-cloning, or role inversion. Use V4.5 / V5 multi-character coordinate boxes (`5×5` grid: columns `A..E` = left-to-right `0.1..0.9`, rows `1..5` = top-to-bottom `0.1..0.9`):

1. **Header & Isolation**:
   - Declare total headcount (`2girls, yuri`, `1girl, 2boys, mmf threesome`, `2girls, 1boy, ffm threesome`, `2boys, yaoi`) plus shared environment, camera, and lighting in `[Base Prompt]` (omitting `solo`).
   - Isolate each character's identity, hair/eyes, outfit, and local action inside `[Character 1 (B3)]`, `[Character 2 (D3)]`, etc., adding `twins, identical hair` and unwanted headcounts to Negative UC.
   - When dressing a named character in a custom outfit inside `[Character N]`, place their canonical outfit tags in Negative UC so default accessories do not leak in.
2. **Directed Action Prefixes (`source#` / `target#` / `mutual#`)**:
   - Bind asymmetric actions explicitly so roles never flip:
     - Initiator box: `source#vaginal`, `source#anal`, `source#fellatio`, `source#breast grab`, `source#fingering`
     - Receiver box: `target#vaginal`, `target#anal`, `target#fellatio`, `target#breast grab`, `target#fingering`
     - Shared symmetric action (in both boxes): `mutual#french kiss`, `mutual#holding hands`, `mutual#hug`, `mutual#tribadism`
3. **Anti-Occlusion Grid Spacing & Token Sharing**:
   - Partition side/three-quarter trios **horizontally** (`B3 · C3 · D3` rather than vertical `C2 / C3 / C4` stacking) to prevent head/torso overlap, and anchor foreground/supine POV partners at bottom-center (`C5`) using concise (`12–22` token) partner descriptions so hero boxes retain most of the shared `512` T5 token budget.

---

## 4. Optical 1st-Person POV & Semantic Collision Physics

NovelAI V5 resolves conflicting visibility tags by contorting anatomy or flipping into a 3rd-person camera. Keep tags optically consistent with what the lens can actually see:

1. **Pure Rear-Facing POV (Preventing 180° "Owl Head-Turn")**:
   - In strict back-of-head rear POV (`from behind, facing away, back of head, bare back, shoulder blades, spine` — `from above` for doggy/prone, or `from below` for reverse cowgirl), **omit** iris/facial expression tags (`gradient eyes, smug, half-closed eyes, looking at viewer, nose blush`) and front-torso outfit details (`bare breasts, nipples, midriff, navel, red bowtie`), replacing them with somatic cues (`trembling, arched spine`).
   - Add `looking back, looking at viewer, face, eyes, front view, profile, bare breasts, nipples, navel` to Negative UC whenever no over-the-shoulder glance is intended.
2. **Over-the-Shoulder Downward Lap / Carry POV**:
   - When a character's back rests directly against the viewer's chest (reverse lap sit, reverse suspended carry, rear embrace), the viewer looks **down over her shoulders/hair crown** (`1.45::pov::, 1.4::from above::, top-down, looking down, pov hands, top of head, foreshortening`), not from a 3rd-person frontal low angle.
3. **Frontal POV Partner Cropping**:
   - Bare `1boy, faceless male, pov` often spawns a broad male back blocking the lower 40% of the canvas. Pair `pov hands` / `pov crotch` with **`male back, male head, male shoulders, from behind male, over-the-shoulder`** in Negative UC for clean 1st-person framing.
4. **Three High-Impact UC / Tag Collision Traps**:
   - **Multi-Legged Arthropods**: Never put bare `extra legs` in Negative UC when depicting spiders, insects, or centipedes (it erases creature legs); use **`extra human arms, extra human legs`** instead.
   - **Segmented Fantasy Larvae**: Do not block `maggots` in UC when generating segmented glowing grubs/larvae (`worms, grubs, larvae`), or V5 collapses segmented bodies into round bubbles; block `round eggs` instead.
   - **Direct-Lens Smartphone Selfies**: When the smartphone *is* the camera lens outside the frame (floor upward squat, under-glass tabletop, extended-arm overhead, or desk timer flash), **block `holding phone, smartphone, cellphone, mobile phone, mirror` in UC** so V5 does not draw a duplicate floating phone in the character's hand.

---

## 5. Optional Vocabulary & Scene Inspiration Menus (`./references/`)

Load a reference file below **only when browsing for specific posture mechanics, multi-person grid coordinates, fantasy creature tags, or selfie camera ideas**:

- **[core_and_multiperson_poses.md](./references/core_and_multiperson_poses.md)** — Partner visibility modes (faceless / translucent / invisible / solo), contact-channel shape retention, optional stage/condom/cutaway vocabulary, tricky POV optical fixes, 9 two-person & foreplay posture families (`P01–P51`), and multi-person `MMF` / `FFM` / `Yuri` / `Group` layouts (`MP01–MP15`).
- **[fantasy_tentacle_arthropod.md](./references/fantasy_tentacle_arthropod.md)** — Solo creature limb-isolation & belly-expansion tips, optional low-angle groin-to-head POV & anatomical X-ray routing, tentacle/symbiote/oviposition ideas (`TN01–TN12`), and bioluminescent hive & indoor doujin arthropod palettes (`BG01–BG20`).
- **[selfie_and_multi_angle.md](./references/selfie_and_multi_angle.md)** — 3-mode reflection vs. direct-lens smartphone camera physics, motivated indoor/night flash & neon lighting ideas, 30 solo niche/uraaka selfie concepts (`SF01–SF30`), and multi-angle showcase framing (`MA0–MA11`).
