---
name: nai-bathroom-solo-toys
description: Empirically calibrated NovelAI V4.5 / V5 Solo Bathroom Adult-Toys (浴室单人小玩具) prompt engineering guide. Covers 8 distinct adult-toy mechanics (wall-mounted suction-cup dildo, bathtub magic-wand water ripples, clear acrylic stool wired egg vibrator, vanity sink crystal plug + vibrator dual play, spin-cycle washing machine beads, bathtub-floor upright suction dildo, handheld showerhead + ring-base glass dildo, towel-bite wireless app vibrator), 4 humid bathroom lighting modes, BATHROOM_TOWEL_UC & FOOT_ANAT_UC locks, and 8 live-verified scenes (BT01-BT08) across 4 gender modes.
---

# NovelAI V4.5 / V5 Solo Bathroom Adult-Toys (`BT01–BT08`) Skill

This skill provides the empirically verified prompt architecture for **8 Non-Selfie Solo Bathroom Adult-Toy Compositions (`BT01–BT08`)** on NovelAI V5 Full (`nai-diffusion-5-full`, `28 steps, CFG 6.8`).

See also [bathroom_toy_catalog.md](references/bathroom_toy_catalog.md) for the quick creative inspiration menu.

---

## 1. Wardrobe, Lighting & Toy-Geometry Calibration Rules

### A. Strict `BATHROOM_TOWEL_UC` & `FOOT_ANAT_UC` Negative Locks
- **`BATHROOM_TOWEL_UC`** (prevents stray street clothes, swimsuits, or hosiery inside humid bathroom scenes):
  ```text
  shirt, collared shirt, blouse, t-shirt, sweater, jacket, coat, skirt, pleated skirt, miniskirt, dress, pants, shorts, jeans, apron, swimsuit, bikini, bra, panties, thighhighs, stockings, socks, pantyhose, shoes, sneakers, boots
  ```
- **`FOOT_ANAT_UC`** (append on barefoot scenes `BT01, BT02, BT03, BT05, BT07`):
  ```text
  bad feet, mutated feet, extra toes, 6 toes, missing toes, fused toes, deformed feet, ugly feet, footwear, slippers, sandals
  ```

### B. Four Humid Bathroom Lighting Modes
1. **`backlit_glass_shower` (`BT01, BT07`)**: `warm backlit steamy shower stall, overhead chrome showerhead spraying glistening water streams, humid mist`
2. **`steamy_warm_bath` (`BT02, BT03, BT06, BT08`)**: `warm golden bathroom downlight, soft rising white bath steam, sparkling water surface reflections`
3. **`vanity_mirror_warm` (`BT04`)**: `warm glowing LED bathroom vanity mirror strip light, humid mist, glossy porcelain highlights` (append `mirror selfie, holding phone, smartphone, camera` to UC so vanity mirrors never trigger mirror-selfie poses)
4. **`laundry_alcove_glow` (`BT05`)**: `warm bathroom laundry-nook light, glowing digital spin-cycle display on white front-load washing machine`

### C. Empirical Toy-Physics Calibrations (Live V5 Visual QA Verified)
1. **Wall-Mounted Suction-Cup Dildo (`BT01` · `s9101122358`)**:
   - Place the vertical tiled wall directly behind her buttocks on one side (`backed right up against vertical tiled shower wall on the right`), specify `one single 1.7::suction cup dildo:: with its wide pink suction base pressed flat onto the vertical right-side tiled wall`, and block `two dildos, multiple dildos, floating dildo` in UC.
2. **Bathtub-Floor Upright Suction Dildo (`BT06` · `s9106677905`)**:
   - Eye-level bathtub shots clip the dildo through the opaque front bathtub wall. Always shoot from **`1.5::from above::` high-angle looking down inside the bathtub basin** so thighs, soap suds, and the upright suction base sit cleanly inside the tub.
3. **Single-Wire Egg Vibrator (`BT03` · `s9103344572`)**:
   - Specify `one single continuous thin pink cord curving directly up to the single pink 1.55::vibrator controller:: held in her right hand` + `clean empty wet tiles under stool` + `two controllers, extra remote` in UC to prevent a duplicate controller box on the floor.
4. **Showerhead + Glass Dildo Separation (`BT07` · `s9107789014`)**:
   - Anchor the bottom hand to a `round glass loop handle of a short standalone curved transparent beaded 1.7::glass dildo::` so the flexible chrome shower hose never merges onto the glass toy base.

---

## 2. Complete 8-Scene Verified Matrix (`BT01–BT08`)

| Code | Benchmark & Verified Seed | Lighting Mode | Scene Title | Core Toy & Bathroom Prop Anchors |
| :--- | :---: | :---: | :--- | :--- |
| `BT01` | Normal (`s9101122358`) | `backlit_glass_shower` | Shower Wall Suction-Cup Dildo Leg-Up (`水雾淋浴壁贴吸盘玩具高抬腿后坐`) | `one single 1.7::suction cup dildo:: on right tiled wall, 1.55::one leg up::, overhead shower spray` |
| `BT02` | Normal (`s9102233445`) | `steamy_warm_bath` | Steaming Bathtub Rim Magic-Wand Ripples (`热气浴缸搭沿大号魔杖震动器涟漪`) | `1.6::bathtub::, legs over rim, white corded 1.7::magic wand vibrator::, concentric water ripples` |
| `BT03` | Normal (`s9103344572`) | `steamy_warm_bath` | Clear Acrylic Stool Pink Wired Egg Vibrator (`透明亚克力浴凳有线粉跳蛋与调速盒`) | `clear acrylic bath stool, 1.6::m legs::, 1.7::egg vibrator::, single pink cord to 1.55::vibrator controller::` |
| `BT04` | Normal (`s9104455667`) | `vanity_mirror_warm` | Vanity Sink Heart-Crystal Plug & Pink Vibrator (`洗漱台暖光弯腰心形水晶塞+震动棒`) | `1.6::from behind::, bathroom washbasin, pink heart-crystal 1.65::butt plug:: + handheld pink 1.65::vibrator::` |
| `BT05` | Femboy (`s9105566778`) | `laundry_alcove_glow` | Spin-Cycle Washing Machine Pulling Pink Beads (`滚筒洗衣机脱水台面勾环拉出粉串珠`) | `atop vibrating front-load 1.6::washing machine::, hooking ring of glossy pink 1.7::anal beads::` |
| `BT06` | Normal (`s9106677905`) | `steamy_warm_bath` | Bubble-Bath Tub Floor Upright Suction Dildo (`白泡浴缸俯拍骑乘缸底直立吸盘玩具`) | `1.5::from above:: inside bubble-lined 1.6::bathtub::, clear-blue 1.7::suction cup dildo:: upright on tub floor` |
| `BT07` | Futa (`s9107789014`) | `backlit_glass_shower` | Handheld Showerhead Jet & Ring-Base Glass Dildo (`防滑垫左手花洒水柱+右手环柄透明玻璃棒`) | `1.6::legs up:: on bathmat, handheld 1.65::showerhead:: spray + loop-handle beaded 1.7::glass dildo::` |
| `BT08` | Normal (`s9108899001`) | `steamy_warm_bath` | Biting Bath Towel & Max-Slider App Vibrator (`出浴咬白浴巾角忍耐手机满格遥控吸吮跳蛋`) | `biting white towel corner, glowing pink 1.5::vibrator app:: slider screen, wireless pink 1.7::vibrator::` |
