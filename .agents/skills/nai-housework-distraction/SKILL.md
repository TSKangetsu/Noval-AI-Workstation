---
name: nai-housework-distraction
description: Empirically calibrated NovelAI V4.5 / V5 Unified Naked-Apron Housework Interruption & Domestic Chore Distraction Play (裸围干扰做家务 / 家事ながら責め) prompt engineering guide. Covers 15 non-kitchen household chores across the home (vacuuming rug, balcony laundry clothespins, hallway wet mopping, tiptoe feather-dusting bookshelf, steam-ironing shirt, wiping floor-to-ceiling window, folding fresh towels, entryway tile scrubbing, tucking fitted bedsheet, watering balcony plants, wiping glass coffee table, lifting box onto high closet shelf, sewing shirt button, lint-rolling hanging suit, 2girls billowing bedsheet canopy), strict APRON_ONLY_UC & selective prop garment unblocking, 5 domestic lighting modes, and 4-mode gender isolation.
---

# NovelAI V4.5 / V5 Unified Naked-Apron Housework Distraction (`HWD01–HWD15` · 裸围干扰做家务) Skill

This skill provides the empirically verified prompt architecture for **15 Unified Naked-Apron Domestic Chore-Interruption Compositions (`HWD01–HWD15`)** on NovelAI V5 Full (`nai-diffusion-5-full`, `28 steps, CFG 6.8`), complementing kitchen-based setups with zero overlap.

See also [housework_scene_catalog.md](references/housework_scene_catalog.md) for the quick creative inspiration menu.

---

## 1. Unified Naked-Apron & Selective Chore-Garment Prop Calibration

### A. Core Naked-Apron Lock & Selective Garment-Prop Unblocking
- **Default `APRON_ONLY_UC`** (keeps both partners free of worn street clothes underneath the white frilly naked apron):
  ```text
  shirt, collared shirt, blouse, t-shirt, sweater, cardigan, hoodie, jacket, vest, camisole, tank top, pleated skirt, miniskirt, microskirt, shorts, pants, bra, panties, underwear, maid headdress
  ```
- **Selective Laundry/Closet Prop Exception (CRITICAL)**:
  - On scenes where a **non-worn household clothing item is the chore prop itself** (`HWD05` crisp white dress shirt laid flat on ironing board, `HWD07` laundry basket, `HWD12` walk-in closet racks, `HWD13` sewing a shirt cuff button, `HWD14` lint-rolling a suit jacket on a coat hanger), remove `shirt, collared shirt` (`HWD05, 07, 12, 13`) or `jacket` (`HWD12, 14`) from `APRON_ONLY_UC` and add `dressed male, man wearing suit` to UC instead. This renders crisp clothing props on boards/hangers while keeping characters strictly in naked apron.
- **Barefoot vs. White Thighhighs Routing**:
  - Wet-floor & sunny-balcony chores (`HWD02, HWD03, HWD08, HWD10`) use barefoot (`1.5::bare feet::` + `FOOT_ANAT_UC` + `thighhighs, stockings, socks, pantyhose, legwear` in UC); dry indoor chores use classic `white thighhighs`.
- **Front-Bib Coverage vs. Direct Chest-Interaction Physics (CRITICAL)**:
  - **No Chest Interaction (`HWD01, HWD02, HWD04, HWD07, HWD08, HWD09, HWD10, HWD13, HWD14, HWD15`)**: Keep the halter apron front bib naturally intact over the front chest (`intact white frilly apron bib covering front chest, 1.45::sideboob::, bare shoulders, bare back`) and add `nipples, areolae` to UC on frontal/three-quarter angles (`HWD04, HWD10, HWD13, HWD15`). Never force `apron pulled aside + bare breasts` when no hand or glass surface touches the chest, or V5 draws an unnatural narrow fabric strip wedged between two exposed breasts.
  - **Active Chest Interaction (`HWD05, HWD06, HWD11, HWD12` + `HWD03` slipped-shoulder balance)**: Only expose front breasts when justified by physical contact (`fondling breast from behind` on `HWD05` ironing & `HWD12` overhead closet box; `bare breasts squished against clear glass` on `HWD06` tall window & `HWD11` low glass coffee table; `apron slipped off one shoulder` leaning down on `HWD03` wet mop pole).

### B. Five Domestic Housework Lighting Modes
1. **`sunlit_living_dust` (`HWD01, HWD04, HWD05, HWD11`)**: `bright sunlit living room / study, floating dust motes in golden sunbeams`
2. **`sunny_balcony_breeze` (`HWD02, HWD06, HWD10`)**: `bright breezy summer balcony / floor-to-ceiling window sunlight, translucent light through hanging white sheet or green leaves`
3. **`hallway_wood_sheen` (`HWD03, HWD08, HWD14`)**: `warm corridor / entryway light, glossy wet reflections on freshly mopped wooden floorboards or ceramic genkan tiles`
4. **`warm_bedroom_lamp` (`HWD07, HWD09, HWD13, HWD15`)**: `warm sunlit bedroom / cozy afternoon window light, crisp white cotton sheet highlights`
5. **`closet_dim_warm` (`HWD12`)**: `warm recessed walk-in closet ceiling spotlight, cozy soft shadows among hanging clothes`

---

## 2. Complete 15-Scene Verified Matrix (`HWD01–HWD15`)

| Code | Canvas & Verified Seed | Legwear & Light Mode | Scene Title | Core Chore Prop & Interruption Anchors |
| :--- | :---: | :---: | :--- | :--- |
| `HWD01` | `832×1216` (`s9201122334`) | Thighhighs · `sunlit_living_dust` | Vacuuming Living Room Rug (`推无线吸尘器吸客厅绒毯后入`) | `both hands gripping cordless upright 1.65::vacuum cleaner:: wand mid-push, 1.5::standing sex::, 1.5::from behind::` |
| `HWD02` | `832×1216` (`s9202233445`) | Barefoot · `sunny_balcony_breeze` | Sunny Balcony Hanging Wet Sheet (`晴日阳台夹衣夹晾湿床单掩护后入`) | `1.55::laundry::, arms overhead clipping blue 1.55::clothespin::s on wet white sheet, clothespin in lips` |
| `HWD03` | `832×1216` (`s9203344556`) | Barefoot · `hallway_wood_sheen` | Wooden Hallway Wet Mop Pole Grip (`木地板走廊双手拄长杆湿拖把后入`) | `blue mop bucket, clutching long pole of wet floor 1.65::mop:: on freshly mopped wooden floor` |
| `HWD04` | `832×1216` (`s9204455689`) | Thighhighs · `sunlit_living_dust` | Tiptoe Feather-Dusting High Bookshelf (`书房踮脚举白鸡毛掸扫顶层书架`) | `1.55::tiptoes::, tall wooden 1.55::bookshelf::, right arm raised holding fluffy white 1.65::feather duster::, intact front bib + 1.45::sideboob::` |
| `HWD05` | `832×1216` (`s9205566778`) | Thighhighs · `sunlit_living_dust` | Steam-Ironing Shirt Hovering Hot Iron (`蒸汽熨衣板悬停热熨斗怕烫衬衫`) | `padded 1.6::ironing board::, white shirt laid flat, holding steaming clothes 1.6::iron:: inches above fabric` |
| `HWD06` | `832×1216` (`s9206677889`) | Thighhighs · `sunny_balcony_breeze` | Wiping Tall Window with Spray Bottle (`高层落地窗握喷壶抹布贴窗挤压`) | `floor-to-ceiling window, blue 1.55::spray bottle:: + yellow cleaning cloth, 1.5::against glass::, 1.45::one leg up::` |
| `HWD07` | `832×1216` (`s9207788990`) | Thighhighs · `warm_bedroom_lamp` | Folding Warm Towels Seated Straddle (`地毯叠温热毛巾摞怀抱叠衣正骑乘`) | `wicker 1.55::laundry basket::, pastel towel stack, clutching folded white towel against chest, 1.55::girl on top::` |
| `HWD08` | `832×1216` (`s9208899001`) | Barefoot · `hallway_wood_sheen` | Entryway All-Fours Scrubbing Tiles (`玄关地砖跪趴湿抹布擦地后入` · Femboy) | `entryway genkan, slippers & bucket, 1.6::all fours:: scrubbing wet tiles with white rag, Multi-Box otoko no ko` |
| `HWD09` | `1216×832` (`s9209900136`) | Thighhighs · `warm_bedroom_lamp` | Tucking Fitted Bedsheet Over Mattress (`换铺洁白床单拽紧床角包边俯压`) | `wide cowboy shot, both hands pulling crisp white bedsheet taut around exposed mattress corner, 1.5::bent over::` |
| `HWD10` | `832×1216` (`s9210011268`) | Barefoot · `sunny_balcony_breeze` | Watering Balcony Plants Spilling Can (`绿植架端长嘴浇水壶手抖浇歪` · Futa) | `1.55::potted plant:: stand, mint long-spout 1.65::watering can::, 1.55::spilling water::, Multi-Box futa + intact front bib + 1.45::sideboob::` |
| `HWD11` | `832×1216` (`s9211122334`) | Thighhighs · `sunlit_living_dust` | Bent Over Wiping Clear Glass Table (`俯身擦拭透明矮玻璃茶几压贴桌面`) | `low clear 1.6::glass table::, wiping tabletop with blue cloth while bare chest presses softly onto glass` |
| `HWD12` | `832×1216` (`s9212233445`) | Thighhighs · `closet_dim_warm` | Walk-In Closet Lifting Storage Box (`衣帽间双臂高举往顶层塞收纳箱锁手`) | `walk-in closet with hanging clothes, both arms overhead lifting lidded 1.55::storage box:: to high shelf` |
| `HWD13` | `832×1216` (`s9213344578`) | Thighhighs · `warm_bedroom_lamp` | Low Table Sewing Button on Lap (`矮几跨坐指尖捏细针穿线缝纽扣`) | `1.5::sitting on lap:: behind low wooden table, sewing box & thread spools, holding 1.55::sewing needle:: & button, intact front bib + 1.45::sideboob::` |
| `HWD14` | `832×1216` (`s9214455667`) | Thighhighs · `hallway_wood_sheen` | Coat Rack Lint-Rolling Suit Muffled (`衣架旁握粘毛滚筒刷西装捂嘴后入`) | `suit jacket on wooden hanger, rolling white adhesive 1.55::lint roller:: down sleeve, 1.55::hand over mouth::` |
| `HWD15` | `832×1216` (`s9215566814`) | Thighhighs · `warm_bedroom_lamp` | 2Girls Dual Aprons Under Billowing Sheet (`双裸围百合抖开雪白被单翻飞贴身`) | `Multi-Box 2girls white × pastel-blue naked aprons (intact front bibs + 1.45::sideboob::), billowing white bedsheet arched overhead, 1.5::scissoring::` |
