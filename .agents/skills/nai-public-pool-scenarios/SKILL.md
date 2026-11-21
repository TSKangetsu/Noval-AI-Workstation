---
name: nai-public-pool-scenarios
description: Empirically calibrated NovelAI V4.5 / V5 Public Swimming Pool (公共泳池 / 室内外游泳馆) prompt engineering guide. Covers 6-style swimwear wardrobe presets (highleg competition, wet sheer white one-piece, V-sling slingshot, classic navy white-piped one-piece, aqua string micro bikini, open-zip sporty swimsuit), 6-mode pool water & lighting physics (sunlit caustics, half-submerged split-waterline, deep underwater weightless refraction, indoor natatorium, closed night cyan pool glow, public frosted-glass shower), weightless underwater floating-cum & side-seam drift physics, strict POOL_SWIM_UC & FOOT_ANAT_UC locks, and 33 live-verified scenes (PLD01-PLD22 duo + PL01-PL11 solo).
---

# NovelAI V4.5 / V5 Public Swimming Pool, Multi-Swimwear, Split-Waterline & Underwater Floating-Fluid Skill

This skill provides the empirically verified prompt architecture for **33 Public Swimming Pool (`公共泳池 / 市民プール`) Compositions** on NovelAI V5 Full (`nai-diffusion-5-full`, `28 steps, CFG 6.8`):
- **`PLD01–PLD10` + `PLD21–PLD22`**: Two-Person Pool Facility, Deep Underwater, Side-Seam Diptych & Blindspot Series (12 scenes)
- **`PLD11–PLD20`**: Two-Person Split-Waterline & Public Disguise Series (`水面平静伪装 vs 水下暗涌`, 10 scenes)
- **`PL01–PL11`**: Solo Wet-Swimwear, Barefoot Showcase & Underwater Spreading Aftermath (`PL11` 水下双手拨开浓白丝缕向上飘散, 11 scenes)

See also [pool_scene_catalog.md](references/pool_scene_catalog.md) for the quick creative inspiration menu.

---

## 1. Six-Style Swimwear Wardrobe System & `POOL_SWIM_UC` Lock

### A. Six Curated Swimwear Wardrobe Styles
Each pool scene pairs cleanly with any of the 6 swimwear presets below:
1. **`comp_highleg` (`🏊‍♀️ 深蓝光泽高叉竞泳水着`)**:
   - Design: `1.55::competition swimsuit::, dark blue one-piece swimsuit, white racing side stripes, 1.4::wet swimsuit::, glossy taut fabric, highleg swimsuit, bare shoulders, bare back, bare legs`
   - State: `1.45::swimsuit aside::` · Extra Neg: `bikini, two-piece swimsuit, bra, panties`
2. **`sheer_white_onepiece` (`🤍 湿透半透明纯白连体水着`)**:
   - Design: `1.55::white one-piece swimsuit::, 1.45::wet swimsuit::, 1.45::see-through::, translucent wet white swimsuit clinging to skin, spaghetti straps, highleg swimsuit, bare back, bare legs`
   - State: `1.45::swimsuit aside::, nipples visible through wet fabric` · Extra Neg: `bikini, two-piece swimsuit, dark blue swimsuit, black swimsuit, bra, panties`
3. **`slingshot_swimsuit` (`🖤 极细V字高叉连体水着`)**:
   - Design: `1.55::slingshot swimsuit::, glossy black V-sling swimsuit, thin halter straps, deep plunging front, exposed sideboob, bare waist sides, high-cut bare hips, wet glistening skin`
   - State: `1.45::swimsuit aside::, breasts out` · Extra Neg: `full coverage swimsuit, navy one-piece swimsuit, bra, panties`
4. **`navy_sukusui` (`💙 经典深绀白边连体水着`)**:
   - Design: `1.55::navy one-piece swimsuit::, classic dark navy blue one-piece swimsuit, white piping trim, 1.4::wet swimsuit::, snug wet fabric, bare shoulders, bare legs`
   - State: `1.45::swimsuit aside::` · Extra Neg: `bikini, two-piece swimsuit, bra, panties`
5. **`string_micro_bikini` (`🩵 水蓝细绳系带微距比基尼`)**:
   - Design: `1.55::micro bikini::, 1.45::string bikini::, glossy aqua-blue triangle bikini, thin halter ties, side-tie bikini bottom, wet skin, bare stomach, navel, bare legs`
   - State: `1.45::bikini aside::, swimsuit aside` · Extra Neg: `one-piece swimsuit, competition swimsuit, leotard, bra, panties`
6. **`zip_front_rashguard` (`⚡ 前拉链全敞运动高叉水着`)**:
   - Design: `1.5::front-zipper swimsuit::, sleek black and cyan sporty one-piece swimsuit, 1.45::unzipped:: front zipper pulled all the way down, open front exposing cleavage, highleg swimsuit, wet spandex, bare legs`
   - State: `1.45::swimsuit aside::` · Extra Neg: `bikini, two-piece swimsuit, bra, panties`

### B. Mandatory `POOL_SWIM_UC` & `FOOT_ANAT_UC` Negative Locks
- **`POOL_SWIM_UC`** (blocks street garments & hosiery across all pool scenes):
  ```text
  shirt, collared shirt, blouse, t-shirt, sweater, jacket, coat, skirt, pleated skirt, miniskirt, dress, pants, shorts, jeans, apron, maid apron, thighhighs, stockings, socks, pantyhose, shoes, sneakers, boots, high heels
  ```
- **`FOOT_ANAT_UC`** (append on barefoot/foot-focus scenes `PLD10, PLD16, PL01, PL02, PL07, PL08, PL09`):
  ```text
  bad feet, mutated feet, extra toes, 6 toes, missing toes, fused toes, deformed feet, ugly feet, footwear, slippers, sandals
  ```

---

## 2. Six-Mode Water Physics & Empirical Underwater Fluid Calibration

### A. Six Pool Water & Lighting Modes
1. **`sunlit_caustics`**: `bright summer sunlight, crystal-clear turquoise pool water, 1.45::water caustics::, shimmering ripples, wet glistening skin` (Neg: `darkness, night, murky water`)
2. **`split_waterline`**: `1.6::partially underwater::, half-submerged camera view, clear horizontal 1.55::waterline:: across middle of frame, bright sunlit poolside air above water and refracted blue pool caustics below water` (Neg: `murky water, opaque water, split-screen comic panels, 2koma, border`)
3. **`deep_underwater`**: `1.65::underwater::, submerged in crystal-clear azure swimming pool, sunlit surface ripples overhead, 1.45::water caustics::, 1.45::floating hair::, rising air bubbles` (Neg: `dry hair, dry ground, sky horizon, murky water`)
4. **`indoor_natatorium`**: `large indoor public swimming pool natatorium, high glass skylights, blue tiled pool lanes, humid chlorine mist, wet glossy reflections`
5. **`night_pool_glow`** (strip `backlighting` from base style): `closed public swimming pool at night, dark ambient surroundings, 1.6::underwater pool lights:: casting glowing cyan-blue caustic ripples upward onto wet skin, dramatic chiaroscuro` (Neg: `bright sunlight, sunny sky, daytime`)
6. **`shower_frosted_glass`**: `public pool shower stall, overhead chrome showerhead spraying streams of water, wet tiled wall, 1.5::frosted glass:: partition with blurred swimmer silhouettes passing outside, humid steam`

### B. Critical Calibration Lessons (Live V5 Visual QA Verified)
1. **Weightless Underwater Floating Cum (`水中精液失重漂浮感` — `PLD02, PLD11, PLD12, PLD15, PL03, PL11`)**:
   - **Avoid `cum drip` underwater**: On submerged scenes (especially `PL11` post-climax underwater spreading), `cum drip` forces gravity-bound downward drips as if standing in air.
   - **Winning Tag Formula**: Use `1.7::cum in water::, 1.7::floating cum::, weightless curling white cum ribbons, swirling milky clouds, and suspended pearly droplets billowing outward and floating upward through clear blue pool water` — produces unmistakable spiraling zero-gravity white ribbons floating toward the sunlit surface (`s7311122349`).
2. **Handheld Poolside Props (`PLD13` Popsicle, `PLD17` Sports Drink Bottle)**:
   - Always anchor one explicit hand to the prop (`1.55::holding popsicle:: stick with right hand` / `1.55::holding bottle:: in right hand`) so items never float mid-air near the mouth.
3. **Underwater Rear-Embrace Limb Separation (`PLD15`)**:
   - When floating upright held from behind underwater, specify `both of her hands gripping partner's muscular forearms wrapped across her stomach` + `extra arms, 3 arms, 4 arms` in UC to eliminate overlapping shoulder/arm tangles (`s7155768812`).

---

## 3. Complete 33-Scene Verified Matrix (`PLD01–PLD22` + `PL01–PL11`)

### Part A: Two-Person Pool Facility, Underwater, Side-Seam Diptych & Blindspot Series (`PLD01–PLD10`, `PLD21–PLD22`)

| Code | Canvas & Verified Seed | Swimsuit & Light Mode | Scene Title | Core Composition & Water/Fluid Anchors |
| :--- | :---: | :---: | :--- | :--- |
| `PLD01` | `832×1216` (`s7011029384`) | `comp_highleg` · `sunlit_caustics` | Chrome Pool Ladder Half-Submerged Rear (`不锈钢池梯半浸水后方互动`) | `1.55::pool ladder::, waist half-submerged, 1.5::from behind::, 1.55::cum in water:: swirling around thighs` |
| `PLD02` | `832×1216` (`s7022039485`) | `sheer_white_onepiece` · `deep_underwater` | Deep Underwater Weightless Embrace & Floating Cum (`全水下失重相拥精液漂浮`) | `1.65::underwater::, face-to-face leg-lock embrace, 1.65::cum in water::, 1.65::floating cum:: ribbons drifting upward` |
| `PLD03` | `832×1216` (`s7033049586`) | `string_micro_bikini` · `indoor_natatorium` | Indoor Jacuzzi Jet Bubbles Straddle (`室内水疗泡池喷嘴气泡跨坐`) | `jacuzzi tub, underwater hydrotherapy jets, 1.5::straddling::, 1.55::cum in water:: mixing with bubbles` |
| `PLD04` | `1216×832` (`s7044059687`) | `comp_highleg` · `sunlit_caustics` | Wet Blue-Tile Poolside Edge Press (`湿滑蓝瓷砖岸沿仰卧折腿深压`) | `wide cowboy shot, white overflow gutter grate, 1.5::legs up::, mating press, splashing pool water` |
| `PLD05` | `832×1216` (`s7055069788`) | `zip_front_rashguard` · `sunlit_caustics` | Floating Lane Buoy Rope Straddle (`蓝白分道浮球绳跨骑失衡`) | `straddling floating blue-and-white 1.55::swimming lane rope::, 1.55::cum in water:: ribbons drifting below buoys` |
| `PLD06` | `832×1216` (`s7066079889`) | `navy_sukusui` · `indoor_natatorium` | Pool Storage Room Kickboard Stack Muffled Wall (`器材储藏室浮板盲区捂嘴`) | `stacks of blue EVA foam kickboards, half-open door showing bright pool lanes, hand muffling mouth, 1.5::one leg up::` |
| `PLD07` | `832×1216` (`s7077089990`) | `sheer_white_onepiece` · `shower_frosted_glass` | Frosted-Glass Shower Stall Silhouettes (`公共淋浴间磨砂玻璃外泳客剪影`) | `overhead shower spray, palms against 1.55::frosted glass::, blurred swimmer silhouettes outside, soaked sheer white swimsuit` |
| `PLD08` | `832×1216` (`s7088091091`) | `slingshot_swimsuit` · `night_pool_glow` | Night Closed Pool Cyan Glow Wall Lift (`深夜闭馆水下冷青池灯高抬腿`) | `1.6::underwater pool lights:: cyan glow, 1.55::leg lift:: above waterline, 1.6::cum in water::, 1.55::floating cum::` |
| `PLD09` | `832×1216` (`s7099102192`) | `string_micro_bikini` · `sunlit_caustics` | Poolside Lounge Chair Sunscreen Oil Ride (`池畔躺椅亮泽防晒油骑乘` · Futa) | `poolside lounge chair, sunscreen lotion bottle, 1.55::oily skin::, milky lotion streaks, girl on top` |
| `PLD10` | `832×1216` (`s7100213293`) | `comp_highleg` · `indoor_natatorium` | Under-Lifeguard-Chair Wet Bare Footjob (`救生员高椅盲区湿润赤足奉仕`) | `under white 1.5::lifeguard chair:: with red rescue buoy, 1.65::footjob::, 1.6::foot focus::, wet pink bare soles` |
| `PLD21` | `832×1216` (`s7211324344`) | `navy_sukusui` · `deep_underwater` | Classic Navy Swimsuit I: Side-Seam Friction & Entry (`深绀水着侧缝·壹：水中贴缝摩擦侧入`) | `1.65::underwater::, 1.55::spooning:: side-entry, taut white-piped side seam, 1.55::intercrural:: past shifted gusset` |
| `PLD22` | `832×1216` (`s7222435468`) | `navy_sukusui` · `deep_underwater` | Classic Navy Swimsuit II: Post-Withdrawal Side-Seam Drift (`深绀水着侧缝·贰：事后拔出侧缝飘散`) | `1.65::aftermath::, 1.65::pull out::, clear water gap on right, 1.7::floating cum:: seeping from white-piped crotch edge` |

### Part B: Two-Person Split-Waterline & Public Disguise Series (`PLD11–PLD20`)

| Code | Canvas & Verified Seed | Swimsuit & Light Mode | Scene Title | Core Disguise & Underwater Floating-Fluid Anchors |
| :--- | :---: | :---: | :--- | :--- |
| `PLD11` | `832×1216` (`s7111324394`) | `string_micro_bikini` · `split_waterline` | Split-Waterline Swim-Ring Peace Sign & Floating Cum (`水面切面泳圈比耶·水下精液漂浮`) | `1.6::partially underwater::, peace sign atop 1.5::inflatable swim ring:: above water, 1.65::floating cum:: clouds below` |
| `PLD12` | `832×1216` (`s7122435495`) | `comp_highleg` · `split_waterline` | Split-Waterline Blue Kickboard & Floating Cum (`水面切面抓浮板练习·水下射出白丝`) | `gripping blue 1.55::kickboard:: above waterline, submerged rear contact releasing 1.6::floating cum:: ribbons in blue water` |
| `PLD13` | `832×1216` (`s7133546608`) | `zip_front_rashguard` · `sunlit_caustics` | Melting Blue Soda Popsicle Poolside Disguise (`舔食融化苏打冰棒掩饰·水下缠腰`) | `1.55::holding popsicle:: stick to lips dripping onto unzipped cleavage, leg lock underwater, 1.55::floating cum::` |
| `PLD14` | `832×1216` (`s7144657697`) | `navy_sukusui` · `indoor_natatorium` | Lifeguard Whistle Freeze Panic in Corner (`救生员哨声骤响惊慌捂嘴池角`) | `recessed pool corner, distant lifeguard chair behind, both hands clapped over blushing mouth, floating cum strands` |
| `PLD15` | `832×1216` (`s7155768812`) | `slingshot_swimsuit` · `deep_underwater` | Underwater Breath-Hold Bubbles & Floating Cum (`全水下憋气鼓腮气泡与精液飘浮`) | `puffed cheeks 1.55::holding breath::, rising silver bubbles, hands gripping forearms, 1.7::cum in water::, 1.65::floating cum::` |
| `PLD16` | `832×1216` (`s7166879899`) | `comp_highleg` · `indoor_natatorium` | Pool-Entrance Footbath Barefoot Splashing (`消毒洗脚槽晶莹赤足踩水扶墙` · Femboy) | `ankle-deep 1.5::footbath:: basin, 1.55::bare feet:: on tiptoes splashing ripples, Multi-Box otoko no ko isolation` |
| `PLD17` | `832×1216` (`s7177980915`) | `zip_front_rashguard` · `indoor_natatorium` | Natatorium Corridor Vending Machine Drink (`自动售货机冷光仰头喝运动饮料`) | `glowing 1.55::vending machine::, 1.55::holding bottle:: spilling cold drink into unzipped cleavage, standing leg lift` |
| `PLD18` | `832×1216` (`s7188091011`) | `comp_highleg` · `sunlit_caustics` | 2Girls Contrast Swimsuits Warmup Stretch (`双水着百合池畔压腿拉伸伪装` · Yuri) | `Multi-Box 2girls, dark-blue competition × sheer-white swimsuit, 1.55::leg stretch:: on poolside bench, 1.55::tribadism::` |
| `PLD19` | `832×1216` (`s7199102122`) | `sheer_white_onepiece` · `indoor_natatorium` | Fogged Swim Goggles Blindfold at Gutter Grate (`起白雾泳镜遮眼紧抓溢水格栅`) | `white-fogged 1.55::swimming goggles:: obscuring eyes, clutching white overflow grate, 1.55::cum in water:: ribbons` |
| `PLD20` | `832×1216` (`s7200213233`) | `slingshot_swimsuit` · `night_pool_glow` | Night Spectator Glass Balcony Overlooking Lanes (`深夜二楼玻璃看台俯瞰发光泳道`) | `second-floor tempered glass spectator railing overlooking glowing cyan lanes at night, standing against glass` |

### Part C: Solo Wet-Swimwear, Barefoot & Underwater Aftermath Series (`PL01–PL11`)

| Code | Canvas & Verified Seed | Swimsuit & Light Mode | Scene Title | Core Framing, Water & Barefoot/Fluid Anchors |
| :--- | :---: | :---: | :--- | :--- |
| `PL01` | `832×1216` (`s7301122334`) | `comp_highleg` · `sunlit_caustics` | Sunlit Poolside Edge Wet Bare Feet Ripples (`坐池岸分腿晃动晶莹赤足与竞泳拨档`) | `wet blue tiled edge, 1.6::foot focus::, pink 1.55::bare feet:: dipping in concentric ripples, pulling gusset aside` |
| `PL02` | `832×1216` (`s7302233445`) | `navy_sukusui` · `sunlit_caustics` | Climbing Chrome Pool Ladder Wet Lookback (`攀爬不锈钢池梯出水回眸勒臀`) | `1.55::from behind::, 1.5::ass focus::, climbing chrome 1.55::pool ladder::, streaming water cascading off thighs` |
| `PL03` | `832×1216` (`s7303344556`) | `sheer_white_onepiece` · `deep_underwater` | Underwater Weightless Back-Float Caustics (`全水下失重仰浮M字湿透白水着`) | `1.65::underwater:: back-float, 1.5::m legs::, soaked translucent white swimsuit, 1.55::cum in water:: strands` |
| `PL04` | `832×1216` (`s7304455667`) | `string_micro_bikini` · `deep_underwater` | Underwater Upward View Through Clear Swim Ring (`清澈池底穿过全透明泳圈仰拍`) | `1.65::from below:: looking straight up through crystal-clear transparent 1.6::inflatable swim ring::` |
| `PL05` | `832×1216` (`s7305566778`) | `sheer_white_onepiece` · `shower_frosted_glass` | Frosted Shower Overhead Spray Sheer Cling (`磨砂淋浴间花洒冲刷半透明纯白水着`) | `running shower spray, 1.5::see-through:: soaked white swimsuit clinging to skin, frosted glass silhouettes` |
| `PL06` | `832×1216` (`s7306677889`) | `string_micro_bikini` · `sunlit_caustics` | Poolside Lounge Squeezing White Sunscreen (`池畔躺椅挤涂浓白防晒乳液` · Futa) | `poolside lounge chair, squeezing creamy white 1.5::sunscreen:: lotion across torso and thighs, 1.5::oily skin::` |
| `PL07` | `832×1216` (`s7307788990`) | `slingshot_swimsuit` · `night_pool_glow` | Closed Night Pool Cyan Glow Shallow-Step Squat (`深夜水下冷青池灯浅水池阶M字微蹲`) | `squatting 1.5::m legs:: in ankle-deep glowing cyan water on top pool step at night` |
| `PL08` | `832×1216` (`s7308899001`) | `comp_highleg` · `indoor_natatorium` | Locker Bench Wet Swimsuit Hooked on Bare Foot (`更衣长椅单脚高翘湿竞泳褪至赤足脚趾`) | `numbered pool lockers, 1.65::foot focus::, soaked dark-blue swimsuit peeled down and stretched taut across raised bare foot` |
| `PL09` | `832×1216` (`s7309900112`) | `zip_front_rashguard` · `indoor_natatorium` | Starting Block #1 Extreme Upward Worm's-Eye (`1号出发跳台极低机位大仰拍逆光`) | `1.65::from below:: worm's-eye upward angle, bare toes gripping blue 1.55::starting block:: #1` |
| `PL10` | `832×1216` (`s7310011223`) | `navy_sukusui` · `sunlit_caustics` | Shallow Pool Hugging Blue Kickboard Over Chest (`浅水区湿水着褪至腰际抱蓝浮板遮胸`) | `thigh-deep clear water, 1.5::swimsuit around waist::, hugging blue foam 1.55::kickboard:: shyly over bare chest` |
| `PL11` | `832×1216` (`s7311122349`) | `comp_highleg` · `deep_underwater` | Underwater Aftermath Spreading — Cum Floating Out (`事后水下双手拨开浓白精液飘散浮起`) | `1.65::underwater::, 1.6::aftermath::, both hands 1.6::spread pussy::, 1.7::cum in water::, 1.7::floating cum:: curling upward` |
