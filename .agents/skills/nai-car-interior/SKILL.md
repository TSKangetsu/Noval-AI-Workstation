---
name: nai-car-interior
description: >-
  NovelAI V4.5 / V5 craft guide for car interior scenes across driver's seat
  1st-person POV, exterior/cabin 3rd-person glass & doorway angles, spacious
  backseat / SUV sunroof compositions, and solo car-cabin 3-stage CG variations
  (车内玩法 / 主驾POV·主驾第三人称·后排车震·车内单人三态差分). Covers 5 row-agnostic cabin
  lighting archetypes, single-steering-wheel & anti-bedroom UC locks, rolled-down
  window anti-cutout physics, console 3-layer depth & 2-hand conservation,
  anti-duplicate-headrest geometry, POV contact anchoring, same-seed 3-stage
  pure-spread vs. overflow isolation, and 4-mode Multi-Box gender isolation.
---

# NovelAI V4.5 / V5 Car Interior Craft Guide

Use this skill when composing intimate car-cabin scenes across front driver/passenger cockpits, exterior through-glass 3rd-person angles, rear bench / folded-SUV cabins, and solo car-cabin temptation variations on NovelAI V4.5 / V5 without steering-wheel duplication, bedroom furniture drift, front-to-rear hardware leaks, or car-door cutout hallucinations.

---

## 1. Five Row-Agnostic Car Cabin Lighting Archetypes

- **Row-Agnostic Lighting Rule (CRITICAL)**: Never embed front-row-only hardware (`infotainment screen`, `dashboard instrument`, `windshield`) inside shared cabin lighting blocks — otherwise backseat scenes bleed glowing front screens and side mirrors into the rear frame. Keep dashboard/windshield anchors scoped strictly to front-cockpit environment descriptions.
- **No-Backlight Dark Cabin Rule**: Pair rim `1.25::backlighting::` only with exterior-glare or neon-window modes (`1`, `3`, `5`), and omit `backlighting` on enclosed nocturnal modes (`2`, `4`) so dark cabins never blow out.

1. **Rainy Neon Night Cabin**:
   - `rainy night city neon reflections on wet car windows, raindrops on glass, moody cyan and magenta rim lighting inside dark leather cabin`
   - **UC Guard**: `daylight, bright sun, clear blue sky, harsh sunlight`
2. **Underground Parking Garage Amber (No Backlight)**:
   - `dim underground parking garage lighting, concrete pillars outside window, cool fluorescent and warm amber cabin glow on leather seats`
   - **UC Guard**: `daylight, bright sun, clear blue sky, trees, forest, beach`
3. **Sunset Coastal Highway Glare**:
   - `warm golden-orange sunset glare streaming through car windows, glowing rim light on hair, coastal highway pullout`
   - **UC Guard**: `night, pitch dark, underground garage`
4. **Midnight Ambient Cabin Glow (No Backlight)**:
   - `intimate dark midnight car cabin, soft glowing blue-and-amber ambient cabin LED and console light on skin, blurred night bokeh outside`
   - **UC Guard**: `daylight, bright sun, clear blue sky, harsh ceiling light`
5. **Dappled Roadside Daylight**:
   - `dappled bright summer sunlight filtering through roadside green trees onto car windows and stitched leather seats`
   - **UC Guard**: `night, pitch dark, dark night, neon lights, underground garage` *(use `pitch dark, dark night` instead of bare `dark` so dark carpeted floor mats or dark cabin interiors do not collide with UC)*

---

## 2. Cabin Geometry & Anti-Hallucination Locks

- **Anti-Bedroom Drift Lock (All Car Scenes)**:
  - Reclining or lying poses inside a vehicle frequently drift into indoor beds or sofas unless suppressed with:
    ```text
    bed, mattress, bedsheet, pillow, bedroom, wooden wall, room window, curtains, couch, living room, sofa
    ```
  - *Folded-SUV Cargo Exception*: Anchor `thin quilted car travel pad, interior car side panels, overhead panoramic sunroof` and block `wooden bedframe, room ceiling, house window`.
- **Single Steering Wheel Conservation vs. Backseat Isolation**:
  - **Front Cockpit**: Bind the single `steering wheel` to a concrete spatial anchor (`behind her back`, `both hands gripping top rim of steering wheel`, `viewer's left hand gripping side of steering wheel`) and add `two steering wheels, extra steering wheel, multiple steering wheels, floating steering wheel` to Negative UC.
  - **Backseat**: Explicitly add `steering wheel, dashboard, pedals, driver seat, infotainment screen, side mirror, windshield` to Negative UC so front-row hardware never spawns in the rear cabin.
- **Seatbelt vs. Rope Disambiguation**:
  - Pair `1.65::seatbelt::, diagonal black woven car seatbelt strap pulled taut 1.55::between breasts::` with `rope, shibari, bondage rope, chains, twine` in Negative UC so automotive webbing never mutates into shibari rope.
- **Pure Rear Driver-Seat Framing**:
  - When a character faces strictly forward gripping the steering wheel away from a 1st-person POV viewer, strip front-only eye/face tags (`gradient eyes`, expressions) and block `looking back, face, eyes` in Negative UC to prevent 180° owl head-turns.

---

## 3. Empirically Verified Optical & Spatial Physics Fixes

1. **Rolled-Down Window "Phantom Door Cutout" Trap**:
   - *Symptom*: In exterior 3rd-person shots leaning out of a half-rolled-down window, leaving `slender legs, thigh gap`, `cowboy shot`, or lower-body tags in Positive causes V5 to carve a rectangular hole through the solid metal car door to draw legs.
   - *Fix*: Crop tightly to **`1.65::upper body::, close-up`**, strip leg/hip/groin tags from the character silhouette block, anchor `solid painted metal car door panel without cutouts at bottom, metal door handle at bottom edge`, and add `full body, cowboy shot, thighs, legs, pussy, groin, lower body, hole in door` to Negative UC.
2. **Across-Console Fellatio 3-Layer Depth, 2-Hand Conservation & Anti-Inversion**:
   - *Symptom*: Weak spatial anchoring across the center console causes V5 to flip legs upside-down into the steering wheel, slip covered sweaters off the chest, or spawn a 3rd hand when one hand grips the gearshift while oral priors add two more hands.
   - *Fix*: Lock three explicit depth planes (**foreground**: gearshift & driver's thighs; **midground**: hips and legs remaining seated on the right passenger leather seat; **action**: torso leaning sideways across the center console). Keep both hands off the shaft (`left hand gripping leather 1.55::gearshift:: knob for balance, right hand resting flat on viewer's thigh, hands away from shaft`), assign head-touching to `one viewer hand resting on back of her head`, and block `upside-down, legs up, legs on dashboard` (plus `bare breasts, nipples` when the upper garment stays intact).
3. **Face-to-Face Driver-Seat Straddle Anti-Duplicate-Headrest Geometry**:
   - *Symptom*: Mentioning a `headrest` during face-to-face lap straddling on the driver's seat spawns a second full seat backrest behind her head (physically impossible facing the steering wheel).
   - *Fix*: Omit `headrest` behind her; anchor `black steering wheel and rain-streaked front windshield` directly behind her back, route any seatbelt diagonally from the side pillar, and add `headrest behind her, seat backrest behind her` to Negative UC.
4. **POV Foreground Contact Anchoring & Footwell / Dashboard Foot Placement**:
   - *POV Contact Lock*: On wide console or backseat POV compositions where the viewer's lower body is easily dropped (degrading into a solo shot), anchor `pov penis entering from <side> foreground` + `penetration` and add **`solo, no penis`** to Negative UC.
   - *Dashboard Heel & Footwell Floor Locks*: When propping a foot onto the dashboard, specify the **heel resting flat on the upper dashboard edge** so toes do not pierce the windshield or A-pillar. On steep downward driver-footwell views, anchor metal pedals on the floor mat and add `dashboard on floor, gauges on floor` to Negative UC.
5. **Open-Top Convertible Torso-Fusion Trap**:
   - *Symptom*: High-angle shots of a reclining character over a seated driver merge both torsos into a single mass.
   - *Fix*: Seat the driver upright against the leather backrest and place her sitting in his lap with her back against his chest in an M-spread (`girl sitting on driver's lap with back against his chest, 1.6::spread legs:: held wide in M-pose facing steering wheel, partner's hands hooking under her knees`).
6. **Backseat Anti-Inversion & Open Rear Doorway Headroom**:
   - *Backseat Bench*: Avoid hooking ankles onto overhead roof grab handles (which flips the body upside-down); brace the raised foot against the rear side door trim (`reclining diagonally across wide car backseat leather bench, head resting upright against rear door armrest, 1.55::one leg up:: bracing foot against rear car door trim`) with `upside-down, inverted, head at bottom, legs at top` in Negative UC.
   - *Open Rear Doorway*: Use vertical portrait framing with `tall open rear doorway frame with ample headroom` and `head clipping roof` in Negative UC so a standing exterior partner's head does not clip the curved roof rail.

---

## 4. Solo Car-Cabin Temptation & Same-Seed 3-Stage CG Variations

When building solo car-cabin scenes that progress cleanly across **Default Temptation → Pure Spread (`纯净掰开`) → Spread + Overflow (`掰开+白流出`)** on a shared seed:

1. **Pure-Spread Anti-Cum Isolation Lock (CRITICAL)**:
   - On Stage 2 (pure spreading without fluids), append **`cum, semen, cum in pussy, cum in ass, cum overflow, cumdrip, after sex`** to Negative UC so arbitrary seeds never drift into post-coital fluids.
   - On Stage 3 (spread + overflow), align fluid direction with cabin gravity and contact surfaces (pooling onto leather seat cushions when seated, trickling straight downward on rear-kneeling/leaning poses, or spreading across a folded SUV travel pad).
2. **Cross-Gender-Safe Solo Partner Ban**:
   - In shared solo cabin Negative UC, block only partner/multi-person concepts:
     ```text
     2boys, multiple boys, man, hetero, penetration, insertion, 2girls, multiple girls
     ```
   - Never hardcode `1boy, male, penis, futanari, testicles, flat chest, otoko no ko` into a cross-gender shared solo UC — doing so collides directly with femboy and futanari modes; leave female-only anatomy exclusions to the gender-routing layer.
3. **Perspective-Neutral Hand Phrasing (Preventing Mirror-Arm Confusion)**:
   - In frontal driver-seat POV compositions, viewer-left corresponds to the character's right arm. Use perspective-neutral phrasing (`one hand gripping steering wheel, other hand / free hand ...`) rather than hardcoded `left hand / right hand` so the reassigned arm transitions smoothly across all 3 stages without extra limbs.
4. **Solo Cabin Pose-Specific Geometry Locks**:
   - *Passenger Dashboard Drink & Foot-Prop*: Anchor the **shoe heel resting flat on the upper dashboard edge** while one hand holds the drink and the free hand handles the spread stage, preventing toes from piercing the windshield.
   - *Rear Fogged-Window Heart Reach-Back*: Pair `looking back` over the shoulder with rear-oriented `1.55::pussy from behind::` and a reach-back hand so V5 never twists the torso 180° forward.
   - *Barefoot SUV Panoramic Sunroof*: Append **`shoes, footwear, socks, stockings, thighhighs, bad feet, extra toes`** to Negative UC to keep all five bare toes clean against the travel pad.

---

## 5. Reusable Prompt Hygiene & 4-Mode Gender Isolation

- **Zero Hardcoded Identity Colors**: Keep reusable expression and gaze tags free of fixed eye/hair colors (write `misty half-closed eyes`, never hardcoded `aqua eyes`) so scenes adapt cleanly to any character.
- **Hetero (`1girl, 1boy`)**: Single-box framing works cleanly across cockpit and backseat scenes (`pov crotch` + `male head, male back` in UC on POV angles; `faceless male` with explicit seat/doorway geometry on 3rd-person angles).
- **Crossdressing Femboy (`2boys, yaoi` / Solo `1boy, otoko no ko`)**: Use Multi-Box `[Base Prompt]` + `[Character 1 (B3)]` (`target#anal`) + `[Character 2 (D3)]` (`source#anal`, suppressing femboy hair/outfit locally) for duo scenes; swap any `bare breasts` / `breast squish` clauses to `flat chest` and rewrite female subject nouns/pronouns (`an adult woman` / `her` → `a slender crossdressing boy` / `his`) so they never collide with femboy Negative UC.
- **Futanari (`futa_no_balls` / `futa_with_balls`)**: Use Multi-Box (`target#vaginal` + `futanari` on Character 1; `source#vaginal` + `-2.5::futanari, breasts::` on Character 2) on duo scenes; on solo spreading variations, keep the shaft untouched above while fingers spread below (`holding own penis, grabbing penis` in UC).
- **Backseat Dual-Girl Yuri (`2girls`)**: Partition contrasting outfits across `[Character 1 (B3)]` and `[Character 2 (D3)]` with `source#` / `target#` interaction tags and mutual `-2.5::...::` color guards.
