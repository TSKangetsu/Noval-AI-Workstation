---
name: nai-housework-distraction
description: >-
  NovelAI V4.5 / V5 craft guide for naked-apron domestic housework interruption
  and chore distraction play (裸围干扰做家务 / 家事ながら責め). Covers strict
  APRON_ONLY_UC locks, selective garment-prop unblocking for laundry/ironing/closet
  props, front-bib chest-coverage vs. active contact physics, barefoot vs.
  thighhighs routing, and domestic lighting archetypes.
---

# NovelAI V4.5 / V5 Naked-Apron Housework Distraction Craft Guide

Use this skill when composing non-kitchen domestic chore-interruption scenes (`裸围干扰做家务 / 家事ながら責め`) on NovelAI V4.5 / V5 — balancing pure naked-apron silhouettes against clothing-related chore props, glass-press physics, and natural domestic lighting.

---

## 1. Naked-Apron Lock & Selective Garment-Prop Unblocking (CRITICAL)

- **Default `APRON_ONLY_UC`** (prevents stray shirts, skirts, or underwear from leaking underneath the white frilly naked apron):
  ```text
  shirt, collared shirt, blouse, t-shirt, sweater, cardigan, hoodie, jacket, vest, camisole, tank top, pleated skirt, miniskirt, microskirt, shorts, pants, bra, panties, underwear, maid headdress
  ```
- **Selective Laundry / Ironing / Closet Prop Exception**:
  - When a **non-worn household garment is the chore prop itself** (e.g., a crisp white dress shirt laid flat on an ironing board, a laundry basket, walk-in closet racks, sewing a shirt cuff button, or lint-rolling a suit jacket on a coat hanger), **remove the specific prop garment** (`shirt, collared shirt` or `jacket`) from `APRON_ONLY_UC` and add **`dressed male, man wearing suit`** to Negative UC instead.
  - This allows crisp clothing props to render on boards, hangers, and racks while keeping the characters strictly in naked apron.

---

## 2. Front-Bib Coverage vs. Direct Chest-Contact Physics (CRITICAL)

- **No Direct Chest Contact (Default)**:
  - Keep the halter apron front bib naturally intact over the front chest (`intact white frilly apron bib covering front chest, 1.45::sideboob::, bare shoulders, bare back`) and add **`nipples, areolae`** to Negative UC on frontal and three-quarter angles.
  - Never force `apron pulled aside + bare breasts` when no hand or glass surface is touching the chest — V5 tends to draw an unnatural narrow fabric strip wedged between two exposed breasts.
- **Motivated Chest Exposure**:
  - Expose bare breasts only when physically driven by contact or gravity: e.g., partner fondling breasts from behind during overhead/standing chores, bare breasts squished `1.5::against glass::` on a tall window or low glass coffee table, or an apron strap slipping off one shoulder while leaning sharply forward.

---

## 3. Legwear Routing & Chore-Prop Anchoring

- **Wet-Floor & Balcony Chores → Barefoot**:
  - On mopping, entryway scrubbing, balcony laundry, or plant-watering scenes, use `1.5::bare feet::` + **`FOOT_ANAT_UC`** (`bad feet, mutated feet, extra toes, 6 toes, missing toes, fused toes, deformed feet, ugly feet, footwear, slippers, sandals`) + `thighhighs, stockings, socks, pantyhose, legwear` in Negative UC.
- **Dry Indoor Chores → Classic White Thighhighs**:
  - Pair `white thighhighs` with dry living-room, bedroom, study, or walk-in closet chores.
- **Chore-Prop Hand Continuity**:
  - Keep hands anchored to the chore tool (`cordless vacuum wand`, `clothespins`, `mop pole`, `feather duster`, `steaming iron`, `spray bottle + cloth`, `watering can`, `sewing needle`, `lint roller`, `taut fitted bedsheet corners`) to convey genuine interruption tension (`ながら責め`).

---

## 4. Domestic Lighting Archetypes

1. **Sunlit Living Room / Study Dust Motes**: `bright sunlit living room / study, floating dust motes in golden sunbeams`
2. **Breezy Balcony / Tall Window Light**: `bright breezy summer balcony / floor-to-ceiling window sunlight, translucent light through hanging white sheet or green leaves`
3. **Corridor / Entryway Wet Floor Sheen**: `warm corridor / entryway light, glossy wet reflections on freshly mopped wooden floorboards or ceramic genkan tiles`
4. **Cozy Afternoon Bedroom**: `warm sunlit bedroom / cozy afternoon window light, crisp white cotton sheet highlights`
5. **Walk-In Closet Spotlight**: `warm recessed walk-in closet ceiling spotlight, cozy soft shadows among hanging clothes`

---

## 5. Multi-Box 4-Mode Gender & Yuri Isolation

- **Hetero (`1girl, 1boy`)**: Single-box framing with `faceless male` keeps shirtless partner + naked-apron heroine clean.
- **Femboy (`2boys, yaoi`) / Futanari (`futa_no_balls` / `futa_with_balls`) / Dual-Apron Yuri (`2girls`)**: Use Multi-Box `[Base Prompt]` + `[Character 1]` + `[Character 2]` with `source#` / `target#` role tags and contrasting apron colors (e.g., white vs. pastel-blue naked aprons on `2girls`) to eliminate twin-cloning and trait bleed.
