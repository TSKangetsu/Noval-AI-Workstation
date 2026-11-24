---
name: nai-public-pool-scenarios
description: >-
  NovelAI V4.5 / V5 craft guide for public swimming pool and underwater
  compositions (公共泳池 / 室内外游泳馆). Covers swimwear wardrobe archetypes,
  POOL_SWIM_UC & FOOT_ANAT_UC locks, 6 water/lighting physics modes (including
  split-waterline and night cyan pool glow), weightless underwater floating-cum
  physics, and underwater limb/prop separation.
---

# NovelAI V4.5 / V5 Public Swimming Pool & Underwater Physics Craft Guide

Use this skill when composing indoor/outdoor swimming pool, split-waterline, deep underwater, poolside shower, or wet-swimwear scenes on NovelAI V4.5 / V5.

---

## 1. Swimwear Wardrobe Archetypes & Negative Locks

### A. Optional Wet-Swimwear Vocabulary Palette
1. **Highleg Competition**: `1.55::competition swimsuit::, dark blue one-piece swimsuit, white racing side stripes, 1.4::wet swimsuit::, glossy taut fabric, highleg swimsuit, 1.45::swimsuit aside::` *(Neg: `bikini, two-piece swimsuit, bra, panties`)*
2. **Wet Sheer White One-Piece**: `1.55::white one-piece swimsuit::, 1.45::wet swimsuit::, 1.45::see-through::, translucent wet white swimsuit clinging to skin, spaghetti straps, highleg swimsuit, 1.45::swimsuit aside::, nipples visible through wet fabric` *(Neg: `bikini, two-piece swimsuit, dark blue swimsuit, black swimsuit, bra, panties`)*
3. **V-Sling Slingshot**: `1.55::slingshot swimsuit::, glossy black V-sling swimsuit, thin halter straps, deep plunging front, exposed sideboob, bare waist sides, high-cut bare hips, 1.45::swimsuit aside::` *(Neg: `full coverage swimsuit, navy one-piece swimsuit, bra, panties`)*
4. **Classic Navy White-Piped One-Piece**: `1.55::navy one-piece swimsuit::, classic dark navy blue one-piece swimsuit, white piping trim, 1.4::wet swimsuit::, snug wet fabric, 1.45::swimsuit aside::` *(Neg: `bikini, two-piece swimsuit, bra, panties`)*
5. **String Micro Bikini**: `1.55::micro bikini::, 1.45::string bikini::, glossy aqua-blue triangle bikini, thin halter ties, side-tie bikini bottom, bare stomach, 1.45::bikini aside::` *(Neg: `one-piece swimsuit, competition swimsuit, leotard, bra, panties`)*
6. **Open-Zip Sporty Swimsuit**: `1.5::front-zipper swimsuit::, sleek black and cyan sporty one-piece swimsuit, 1.45::unzipped:: front zipper pulled all the way down, open front exposing cleavage, highleg swimsuit, 1.45::swimsuit aside::` *(Neg: `bikini, two-piece swimsuit, bra, panties`)*

### B. Mandatory `POOL_SWIM_UC` & `FOOT_ANAT_UC` Locks
- **`POOL_SWIM_UC`** (prevents street garments and hosiery across all pool scenes):
  ```text
  shirt, collared shirt, blouse, t-shirt, sweater, jacket, coat, skirt, pleated skirt, miniskirt, dress, pants, shorts, jeans, apron, maid apron, thighhighs, stockings, socks, pantyhose, shoes, sneakers, boots, high heels
  ```
- **`FOOT_ANAT_UC`** (append on barefoot poolside, ladder, footbath, or footjob scenes):
  ```text
  bad feet, mutated feet, extra toes, 6 toes, missing toes, fused toes, deformed feet, ugly feet, footwear, slippers, sandals
  ```

---

## 2. Six Pool Water & Lighting Physics Modes

1. **Sunlit Caustics**: `bright summer sunlight, crystal-clear turquoise pool water, 1.45::water caustics::, shimmering ripples, wet glistening skin` *(Neg: `darkness, night, murky water`)*
2. **Split-Waterline (Half-Submerged Camera)**: `1.6::partially underwater::, half-submerged camera view, clear horizontal 1.55::waterline:: across middle of frame, bright sunlit poolside air above water and refracted blue pool caustics below water` *(Neg: `murky water, opaque water, split-screen comic panels, 2koma, border` — prevents comic-panel borders!)*
3. **Deep Underwater Refraction**: `1.65::underwater::, submerged in crystal-clear azure swimming pool, sunlit surface ripples overhead, 1.45::water caustics::, 1.45::floating hair::, rising air bubbles` *(Neg: `dry hair, dry ground, sky horizon, murky water`)*
4. **Indoor Natatorium**: `large indoor public swimming pool natatorium, high glass skylights, blue tiled pool lanes, humid chlorine mist, wet glossy reflections`
5. **Closed Night Cyan Pool Glow** *(strip `backlighting` from base style)*: `closed public swimming pool at night, dark ambient surroundings, 1.6::underwater pool lights:: casting glowing cyan-blue caustic ripples upward onto wet skin, dramatic chiaroscuro` *(Neg: `bright sunlight, sunny sky, daytime`)*
6. **Public Frosted-Glass Shower**: `public pool shower stall, overhead chrome showerhead spraying streams of water, wet tiled wall, 1.5::frosted glass:: partition with blurred swimmer silhouettes passing outside, humid steam`

---

## 3. Underwater Fluid, Side-Seam & Limb-Separation Physics (CRITICAL)

1. **Weightless Underwater Floating Cum (Never Use `cum drip` Underwater)**:
   - Using `cum drip` underwater forces gravity-bound downward drips as if standing in air.
   - **Winning Formula**:
     ```text
     1.7::cum in water::, 1.7::floating cum::, weightless curling white cum ribbons, swirling milky clouds, and suspended pearly droplets billowing outward and floating upward through clear blue pool water
     ```
2. **Swimsuit Side-Seam Friction & Post-Withdrawal Drift**:
   - For snug one-piece side-seam interactions underwater, pair `1.55::spooning::` + `taut white-piped side seam, 1.55::intercrural:: past shifted gusset`; for post-withdrawal aftermath, pair `1.65::aftermath::, 1.65::pull out::, clear water gap` with `1.7::floating cum:: seeping from white-piped crotch edge`.
3. **Handheld Poolside Props**:
   - Explicitly anchor one hand to handheld props (`1.55::holding popsicle:: stick with right hand`, `1.55::holding bottle:: in right hand`, `gripping blue 1.55::kickboard::`) so objects never float mid-air near the face.
4. **Underwater Rear-Embrace Limb Separation**:
   - When floating upright held from behind underwater, specify `both of her hands gripping partner's muscular forearms wrapped across her stomach` and append **`extra arms, 3 arms, 4 arms`** to Negative UC to eliminate overlapping shoulder/arm tangles.
5. **Multi-Box Gender & Yuri Isolation**:
   - Use Multi-Box `[Base Prompt]` + `[Character 1]` + `[Character 2]` on `femboy` (`2boys, yaoi`), `futanari`, and `2girls` poolside scenes (pairing contrasting swimsuits such as dark-blue competition × sheer-white one-piece on `2girls`).
