---
name: nai-pose-taxonomy
description: Comprehensive NovelAI V4.5 / V5 posture, two-person & multi-person (MMF/FFM threesome, yuri, group/surrounded) interaction taxonomy, 5-stage progression, condom & uterus x-ray physics, transparent background, and partner-visibility decoupling reference. Covers 10 posture families (P01-P51 + MP01-MP14 multi-person actions), V4.5/V5 [Character N (A1..E5)] spatial partitioning & source#/target#/mutual# tags, MA0-MA10 multi-angle showcase, FREE custom action mode, and V5 native RGBA cutout rules.
---

# NovelAI V4.5 / V5 Full Posture & Interaction Taxonomy Skill

This skill documents the complete structural taxonomy of solo, two-person, and **multi-person (`MMF` / `FFM` / `Yuri` / `Group`)** interaction compositions supported by NovelAI V4.5 and V5 (Danbooru tag system + multi-character coordinate boxes + T5 natural-language framing), along with **native V5 RGBA transparent background** rules and **partner / contact-organ state decoupling**.

---

## 1. Native Transparent Background (NovelAI V5 Alpha Cutout)

NovelAI Diffusion V5 (`nai-diffusion-5-full` / `nai-diffusion-5-full-medium`) natively generates 32-bit RGBA PNGs (`straight_alpha: True`).

### Required Positive & API Parameters
- **Positive Tags**: `2.0::transparent background::, has alpha, alpha transparency, no background`
- **API Payload Field**: Set `"tag_hint_transparent_background": True` (Go `*bool` — must be boolean `True` or `None`, never integer `1`) in `parameters` whenever `transparent background` is active.
- **Style & Scene Sanitization**:
  - Strip environment/furniture tags (`indoors, bedroom, couch, bed, pillow, window, curtains, photo background, bokeh, depth of field, hazy`).
  - Replace surface-bound tags (`lying on bed`, `kneeling on couch`) with surface-neutral posture tags (`lying on back`, `kneeling`, `supporting weight`).
- **Negative Tags (`UC`)**:
  - `background, simple background, white background, black background, gradient background, indoors, outdoors, scenery, furniture, bed, couch, sofa, pillow, window, curtains, wall, floor, drop shadow`

---

## 2. Partner Visibility & Contact-State Preservation Matrix

When generating two-person interaction postures, the partner representation and contact-anatomy visibility can be decoupled into **4 Partner Modes** × **2 Contact-Detail Modes**:

### A. Partner Display Modes (`pos_male_mode`)
1. **Standard Faceless Partner (`normal`)**:
   - Tags: `1girl, 1boy, hetero, faceless male`
   - POV vs 3rd-person: In `pov`, add `pov, pov hands` and keep male torso cropped to foreground limbs; in `3rd`, include full objective two-person framing (`side view` / `three-quarter view` / `from behind`).
2. **Semi-Transparent Phantom Silhouette (`translucent`)**:
   - Goal: Prevent the partner's body from occluding the main character's figure while preserving exact contact geometry.
   - Multi-character isolation (recommended for V4.5/V5 API) or scoped T5 clause:
     - Tags: `1girl, 1boy, hetero, faceless male, male silhouette, ghostly outline`
     - T5 Prose Anchor: `"interacting with a semi-transparent see-through phantom male silhouette whose translucent outline does not obscure her solid opaque body"`
   - **Pitfall**: Avoid unscoped high-weight `1.5::translucent::` alone in a single-block prompt without T5 subject scoping, or clothing on `1girl` may become translucent.
3. **Completely Invisible Partner (`invisible`)**:
   - Goal: Maintain physical compression, lifted limbs, or held wrists in mid-air with zero visible partner body.
   - Tags: `1girl, solo, 1.45::invisible partner::` (strip `1boy` when full invisibility is desired, or block `1boy, male body` in UC when contact anatomy is also hidden).
   - T5 Prose Anchor: `"her body held and pressed in mid-air by an unseen invisible partner"`
4. **Solo Posture Only (`off`)**:
   - Goal: Pure single-character showcase retaining the exact posture geometry.
   - Tags: `1girl, solo`
   - Negative (`UC`): `1boy, male, multiple people`

### B. Contact-State Preservation When Partner Anatomy Is Hidden (`pos_show_penis = False`)
When hiding partner anatomy (`pos_show_penis = False`), **never revert the female character to a neutral closed resting pose**. Instead:
1. Strip partner phallic tags from positive prompt and add them to negative `UC` (`-2.5::...::`).
2. Explicitly **retain the active anatomical / muscular contact state** corresponding to the posture's `contact_channel`:
   - **`lower_front` / `lower_rear` (Supine / Straddling / Prone / Standing lower postures)**:
     - Retain open/parted lower-body state (`spread legs`, `parted posture`, active `anat_pos` morphology, moisture/fluid remnants if enabled) so the posture remains physically identical to the active state.
   - **`oral_channel` (Upper-body / kneeling / inverted head postures)**:
     - Retain `open mouth, 1.3::o-shaped mouth::, tongue, saliva` so the mouth and jaw maintain the active hollow service shape.
   - **`chest_channel` (Chest-press postures)**:
     - Retain `1.35::grabbing own breasts::, breasts squeezed together, cleavage, arms pressed inward` so the central cleavage channel remains tightly formed.
   - **`foot_channel` (Seated / supine foot-press postures)**:
     - Retain `1.35::soles together::, arched feet, toes, feet raised` so both soles remain pressed around a central axis.
   - **`hand_channel` (Manual grip postures)**:
     - Retain `curled fingers, cylindrical grip gesture, one-handed / two-handed hold` at chest or lap level.
   - **`thigh_glute_channel` (Intercrural / glute press postures)**:
     - Retain `1.3::thighs squeezed together::, pressed thighs, arched hips` or `squeezed glutes, arched back`.
   - **`fingering` / `grope_fingering` / `clit_tease` / `breast_grope` (Family 9 manual foreplay `P45..P51`)**:
     - Driven by partner hand/finger tags rather than phallic contact; when `maleCode === "off"`, keep self-spread / arched showcase geometry cleanly without stray extra hands.

### C. Five-Stage Progression, Calibrated Condom Physics & Uterus X-Ray
1. **5 Interaction Stages (`pos_stage`)**:
   - `before` (进行中·未射) · `during` (高潮射精瞬间) · `after_inside` (射后体内停留溢流) · `pull_out` (刚拔出·拉丝滴落) · `prolapse` (拔出脱垂·粉嫩宫颈外翻特写 `1.55::vaginal prolapse::, 1.35::prolapse::, cervix`).
2. **Calibrated Condom Physics (`enable_condom`)**:
   - **`before`**: `1.35::condom::, 1.3::condom on penis::` (sheathed contact).
   - **`during` & `after_inside` (Vaginal)**: Auto-inject womb cutaway X-ray showing the condom tip pushing through the cervix and inflating like a taut white pouch filling the entire uterus (`1.5::x-ray::, 1.45::cross-section::, 1.4::uterus::, cervix, 1.35::cervical penetration::, 1.5::cum in condom::, cum inflation, stomach bulge`).
   - **`pull_out` & `prolapse` (Vaginal)**: **Never** keep `condom on penis` after withdrawal! Strip `condom on penis` (and block it in UC) so the partner pulls out a bare uncovered shaft while a single translucent latex condom stays caught halfway inside the entrance (`1.85::used condom in pussy::, 1.2::used condom::, 1.5::condom::, 1.4::cum in condom::, puddle`) with its rolled ring hanging outside spilling into a puddle.
3. **Standalone Uterus X-Ray (`enable_uterus_xray`)**:
   - Injects `1.35::x-ray::, 1.35::cross-section::, 1.4::uterus::, cervix` (+ stage-aware `1.4::cum in uterus::` or `1.25::cervical penetration::`) on lower-body channels (`vaginal`, `solo`, `fingering`, `grope_fingering`, `clit_tease`, `thigh`), NSFW `MA1..MA10`, and NSFW `FREE` mode without duplicating vaginal condom `during`/`after_inside` cutaway tags.

### D. Multi-Person Spatial Partitioning & Role-Binding Rules (`MMF` / `FFM` / `Yuri` / `Group`)
1. **Strict Headcount Header & `solo` Removal**:
   - **Always strip `solo`** from Positive (and add `solo` to UC if extra partners fail to appear). Declare exact headcount immediately in `[Base Prompt]`:
     - **MMF (一女两男)**: `1girl, 2boys, threesome, mmf threesome`
     - **FFM (两女一男)**: `2girls, 1boy, threesome, ffm threesome`
     - **Yuri / Twin Female (双女/多女百合)**: `2girls, yuri, females only` (or `3girls, yuri, females only`)
     - **Group / Surrounded (一女多男群像)**: `1girl, multiple boys, 3boys, group sex, gangbang` (or `harem` for multi-girl `multiple girls, 1boy, harem`)
2. **Workbench Native `[Base Prompt]` + `[Character N (Coord)]` Multi-Box Syntax**:
   - `parseStructuredPrompt` (`web/src/engine/t5Tokenizer.ts`) natively compiles `[Base Prompt]` + `[Character 1 (C3)]` + `[Character 2 (B3)]` + ... into V4.5/V5 `v4_prompt.caption.char_captions` using the `5×5` `POSITION_GRID`:
     - Columns `A`..`E` = horizontal `x: 0.1, 0.3, 0.5, 0.7, 0.9` (Left → Center → Right)
     - Rows `1`..`5` = vertical `y: 0.1, 0.3, 0.5, 0.7, 0.9` (Top → Middle → Bottom)
   - **Mandatory Character Isolation for `2girls` / `FFM`**: Never put two distinct named girls' hair/eye/outfit tags into one flat prompt (causes 100% trait fusion/twins). Put shared style, lighting, environment, and group tags in `[Base Prompt]`, and isolate each character's identity, outfit, and local pose in `[Character 1 (B3)]` and `[Character 2 (D3)]`.
   - **Token Budget Discipline**: Total T5 tokens **summed across `[Base Prompt]` + ALL `[Character N]` boxes** share the single `512` limit (`<= 400` with 3 V4.5 Vibes). Keep faceless male partner boxes ultra-lean (`12–22` tokens, e.g., `boy, faceless male, muscular, standing, ...`) so hero female boxes retain full detail.
3. **Directed Action Prefixes (`source#` / `target#` / `mutual#`)**:
   - In V4.5 / V5 multi-character boxes, bind asymmetric actions explicitly so roles never invert:
     - Initiator box: `source#fellatio`, `source#breast grab`, `source#fingering`, `source#kissing cheek`
     - Receiver box: `target#fellatio`, `target#breast grab`, `target#fingering`, `target#kissing cheek`
     - Symmetric shared action (both boxes): `mutual#french kiss`, `mutual#holding hands`, `mutual#hug`, `mutual#tribadism`

---

## 3. Ten Complete Posture Families (`P01`–`P51` + `MP01`–`MP14` Multi-Person Reference)

### Family 1: Supine & Reclining Postures (`仰卧·正面展开系`)
| Code | Posture Name | Core Danbooru Posture Tags | Recommended Framing |
| :--- | :--- | :--- | :--- |
| `P01` | Classic Supine (`标准仰卧位`) | `lying on back, spread legs, arms at sides, looking up` | `pov` (from above) / `3rd` (three-quarter high angle) |
| `P02` | Legs-Raised V-Supine (`双腿高举V字仰卧`) | `lying on back, 1.3::legs up::, v-shaped legs, heels up` | Vertical `832x1216` |
| `P03` | Folded Ankles-by-Shoulders (`折叠压腿深曲位 / Mating Press`) | `lying on back, 1.4::folded::, knees to chest, ankles near shoulders, hips tilted up` | High-angle top-down or side profile |
| `P04` | Leg-Lock Embrace (`双腿盘腰紧扣仰卧`) | `lying on back, 1.35::leg lock::, legs wrapped around waist, arms around neck` | Three-quarter close shot |
| `P05` | Single-Leg-Raised Supine (`单腿高抬侧展仰卧`) | `lying on back, 1.3::one leg up::, asymmetrical legs, exposed hip` | Three-quarter angle |
| `P06` | Edge-of-Surface Reclining (`床沿垂臀仰卧 / Butterfly Edge`) | `lying on back, hips at edge, legs apart, arched waist` | Low-to-mid frontal / 3/4 view |
| `P07` | Pillow-Elevated Pelvis (`垫枕抬臀仰卧位`) | `lying on back, elevated hips, arched back, knees bent apart` | Side-three-quarter `1216x832` |

### Family 2: Woman-on-Top / Straddling Postures (`女上位·骑乘坐姿系`)
| Code | Posture Name | Core Danbooru Posture Tags | Recommended Framing |
| :--- | :--- | :--- | :--- |
| `P08` | Upright Kneeling Straddle (`标准跪姿女上位`) | `1.3::straddling::, girl on top, kneeling, upright torso, hands on chest/hips` | Vertical `832x1216`, low angle |
| `P09` | Squatting Straddle (`蹲踞开脚骑乘位`) | `1.35::squatting::, girl on top, knees wide apart, soles flat, balancing` | Low frontal / 3/4 view |
| `P10` | Leaning-Forward Embrace Straddle (`前倾伏胸相拥骑乘`) | `straddling, girl on top, 1.3::leaning forward::, close face, arms draped forward` | Close cowboy shot |
| `P11` | Arched-Back Hands-Behind Straddle (`后仰撑手反弓女上位`) | `straddling, girl on top, 1.35::leaning back::, arched back, arms supporting behind` | Side-three-quarter low angle |
| `P12` | Reverse Kneeling Straddle (`背向跪姿反向骑乘`) | `straddling, girl on top, 1.35::from behind::, back, looking back over shoulder` | Rear low angle `832x1216` |
| `P13` | Reverse Squatting Straddle (`背向蹲踞开脚骑乘`) | `1.35::squatting::, girl on top, from behind, knees wide, back view, looking back` | Rear low angle `832x1216` |
| `P14` | Seated Face-to-Face Lotus (`面对面盘坐怀抱莲花位`) | `1.35::upright straddle::, sitting on lap, face-to-face, wrapped legs, embrace` | Vertical `832x1216` |
| `P15` | Reverse Seated Lap (`背向坐怀观音位`) | `sitting on lap, 1.3::from behind::, back against chest, spread thighs, looking back` | Frontal view of girl |
| `P16` | Amazon Cradle Top (`亚马逊女上位·男仰女跨控腿`) | `girl on top, squatting over lap, leaning forward, dominant posture` | Three-quarter view |

### Family 3: Prone & Rear-Entry Postures (`后入·俯卧跪趴系`)
| Code | Posture Name | Core Danbooru Posture Tags | Recommended Framing |
| :--- | :--- | :--- | :--- |
| `P17` | Classic All-Fours Rear (`标准四肢着地犬式后入`) | `1.3::all fours::, from behind, arched back, hips raised, looking back` | Rear POV or 3/4 side-rear |
| `P18` | Chest-Down Hips-Up (`塌腰贴胸高翘臀位 / Jackhammer`) | `1.4::top-down bottom-up::, chest down, face on arms, hips high, arched spine` | Side-rear `1216x832` |
| `P19` | Flat Prone Rear (`完全俯卧贴身压覆位 / Prone Bone`) | `1.35::lying on stomach::, prone, legs straight or slightly parted, from behind, looking back` | Landscape `1216x832` |
| `P20` | Upright Kneeling Rear (`直立跪姿拉手后入`) | `kneeling, upright torso, 1.3::arms pulled back::, arched chest, from behind` | Three-quarter side-rear |
| `P21` | Bent-Over Standing / Tabletop (`站立弯腰扶撑后入`) | `standing, 1.35::bent over::, torso parallel, supporting hands forward, from behind` | Vertical or 3/4 rear |
| `P22` | Frog-Leg Prone Spread (`蛙式屈膝俯卧开胯位`) | `lying on stomach, bent knees wide apart, soles upward, hips pressed down` | High rear angle |

### Family 4: Lateral & Crossed Postures (`侧卧·汤匙交叉系`)
| Code | Posture Name | Core Danbooru Posture Tags | Recommended Framing |
| :--- | :--- | :--- | :--- |
| `P23` | Spooning Side-Rear (`侧卧汤匙贴背位`) | `1.35::lying on side::, spooning, curled knees, from behind, head on arm` | Landscape `1216x832` |
| `P24` | Side-Lying Leg-Lifted (`侧卧单腿高抬展开位`) | `lying on side, 1.35::one leg raised::, open hip, looking at viewer` | Landscape `1216x832` |
| `P25` | Lateral Scissors Interlock (`侧身十字交错剪刀位`) | `lying on side, 1.3::interlocked legs::, crossed thighs, angled torsos` | Overhead 3/4 `1216x832` |

### Family 5: Standing & Suspended Carry Postures (`站立·悬空抱举系`)
| Code | Posture Name | Core Danbooru Posture Tags | Recommended Framing |
| :--- | :--- | :--- | :--- |
| `P26` | Standing Face-to-Face Leg-Up (`站立面对面单腿挂腰壁咚位`) | `standing, face-to-face, 1.35::one leg lifted::, leg around waist, arms on shoulders` | Vertical `832x1216` |
| `P27` | Suspended Carry Face-to-Face (`面对面悬空抱举火车便当位 / Ekiben`) | `1.4::carried::, lifted in air, legs wrapped around waist, arms around neck, feet off ground` | Vertical `832x1216` |
| `P28` | Reverse Suspended Carry (`背向悬空抱举开脚展示位 / Reverse Ekiben`) | `1.4::carried from behind::, facing viewer, lifted under knees, wide M-legs in air, feet off ground` | Frontal vertical `832x1216` |
| `P29` | Pressed-Against-Glass Standing (`落地玻璃贴胸前压站立位`) | `standing, 1.35::pressed against glass::, flattened chest, palms on glass, from behind` | Frontal through-glass view |

### Family 6: Oral & Upper-Body Focus Postures (`口部·上半身特写系`)
| Code | Posture Name | Core Danbooru Posture Tags | Recommended Framing |
| :--- | :--- | :--- | :--- |
| `P30` | Kneeling Upward Gaze Oral (`跪姿仰视双手奉仕位`) | `kneeling, 1.3::from above::, looking up at viewer, hands cupped forward, open mouth` | High-angle POV `832x1216` |
| `P31` | Deep-Forward Head-Held Oral (`按头前倾深含特写`) | `close-up, upper body, leaning forward, hands on head, teary eyes, hollowed cheeks` | Close-up `832x1216` |
| `P32` | Inverted Head-Back Edge (`仰躺垂首倒挂位`) | `lying on back, 1.35::upside-down head::, neck arched back, hair hanging down` | Top-down close shot |
| `P33` | Mutual Sixty-Nine (`上下交叠互侍 69 位`) | `lying horizontal, opposing orientation, hips over face, arched thigh` | Landscape `1216x832` |
| `P34` | Straddling Face-Sit (`跨骑坐颜俯视位`) | `1.35::straddling::, kneeling over viewer face, high angle from below, looking down` | Extreme low POV `832x1216` |

### Family 7: Outercourse & Specialized Contact Postures (`外部器官·胸足手腿特化系`)
| Code | Posture Name | Core Danbooru Posture Tags | Recommended Framing |
| :--- | :--- | :--- | :--- |
| `P35` | Classic Cleavage Press (`双手拢胸夹持奉仕 / Paizuri`) | `upper body, kneeling, 1.35::grabbing own breasts::, breasts squeezed together, looking up` | High-angle close-up |
| `P36` | Soles-Together Foot Press (`坐姿双脚心相对夹持 / Footjob`) | `sitting, leaning back, legs extended forward, 1.4::soles together::, arched toes` | Foot-foreground POV `832x1216` |
| `P37` | Intercrural Thigh Squeeze (`紧闭大腿根摩擦素股 / Sumata`) | `straddling or kneeling, 1.35::thighs together::, squeezed inner thighs, leaning forward` | Low-angle cowboy shot |
| `P38` | Glute-Cleft Press (`翘臀夹缝贴合磨擦 / Assjob`) | `from behind, kneeling, arched lower back, squeezed glutes, looking back over shoulder` | Rear close shot `832x1216` |
| `P39` | Two-Handed Close Grip (`贴身双手环握侍奉 / Handjob`) | `upper body, close-up, kneeling beside, both hands cupped in cylindrical grip, shy gaze` | Close cowboy shot `832x1216` |

### Family 8: Advanced Flexible & Solo Showcase Postures (`高柔韧进阶与单人展示系`)
| Code | Posture Name | Core Danbooru Posture Tags | Recommended Framing |
| :--- | :--- | :--- | :--- |
| `P40` | Full Nelson Lifted Spread (`双腋穿臂抱举大开脚 / Full Nelson`) | `lifted, arms behind head, knees pulled wide to chest, suspended in air, facing viewer` | Frontal vertical `832x1216` |
| `P41` | Inverted Piledriver Fold (`倒立折腰高举臀位 / Piledriver`) | `upside down, shoulders on surface, hips vertical in air, legs folded downward` | Side/3-4 `832x1216` |
| `P42` | Standing Vertical Split (`站立一字马高抬腿平衡位`) | `standing, 1.4::standing split::, one leg vertical, flexible, balanced posture` | Full-body vertical `832x1216` |
| `P43` | M-Shaped Squat Showcase (`正面M字开脚蹲坐展示位`) | `sitting, 1.4::m legs::, knees bent wide, hands on knees or ankles, frontal view` | Frontal `832x1216` |
| `P44` | Rear-Focus Arch Showcase (`跪趴塌腰回眸展示位`) | `all fours, arched back, hips raised toward viewer, 1.3::from behind::, looking back` | Rear POV `832x1216` |

### Family 9: Manual Foreplay, Grope & Fingering Postures (`9. 手部爱抚·指技前戏系`)
| Code | Posture Name | Channel | Core Danbooru Posture Tags | Recommended Framing |
| :--- | :--- | :--- | :--- | :--- |
| `P45` | Supine Deep Fingering (`仰卧开腿双指深入指交位`) | `fingering` | `1.3::from above::, lying on back, 1.35::spread legs::, knees bent wide, arched waist` | Vertical `832x1216` |
| `P46` | Rear Grope & Fingering (`背后拥抱一手揉胸一手抠弄位`) | `grope_fingering` | `sitting on lap, back against chest, 1.35::spread legs::, head tilted back` | Frontal / close cowboy `832x1216` |
| `P47` | Spread & Clitoral Tease (`双手拨开阴唇精准玩弄阴蒂位`) | `clit_tease` | `low angle, reclining on back, 1.4::m legs::, knees wide apart, hips tilted forward` | Low-angle close `832x1216` |
| `P48` | Standing Leg-Up Fingering (`站立抬单腿探手深抠位`) | `fingering` | `standing, against wall, 1.35::one leg lifted::, open hip, leaning against wall` | Vertical `832x1216` |
| `P49` | All-Fours Rear Fingering (`跪趴塌腰后方探手抠弄潮吹位`) | `fingering` | `1.35::from behind::, all fours, arched back, raised hips, knees apart, 1.3::looking back::` | Landscape `1216x832` |
| `P50` | Rear Dual Breast Grope (`背后环抱双手陷肉揉胸捏乳首`) | `breast_grope` | `held from behind, back against chest, arched chest pushed forward, head tilted back` | Vertical cowboy `832x1216` |
| `P51` | Cradled M-Spread Fingering (`背后抱腿大开脚正面指交展示位`) | `fingering` | `1.35::carried from behind::, lifted under knees, wide M-legs in air, feet off ground` | Frontal vertical `832x1216` |

### Family 10: Multi-Person & Group Interaction Postures (`10. 多人互动·三人行·百合与群像系`)

#### 10A. MMF Dual-Partner Focus (`一女两男 · 1girl, 2boys, threesome, mmf threesome`)
| Code | Posture Name | Grid Coords (`[Character N]`) | Core Danbooru Posture Tags | Recommended Framing |
| :--- | :--- | :--- | :--- | :--- |
| `MP01` | Classic Spitroast (`前后串烧位 · 跪趴前后双端协同`) | Girl `C3` · Front `B3` · Rear `D3` | `1girl, 2boys, threesome, mmf threesome, 1.4::spitroast::, all fours, arched back, from side` | Side landscape `1216x832` |
| `MP02` | Sandwich Straddle (`站/坐姿前后贴胸夹心位`) | Girl `C3` · Front `C4` · Rear `C2` | `1girl, 2boys, threesome, mmf threesome, 1.35::sandwich::, upright straddle, pressed between, simultaneous` | Side-3/4 vertical `832x1216` |
| `MP03` | Suspended Twin-Carry (`双人左右/前后悬空托举开脚位`) | Girl `C3` · Left `B3` · Right `D3` | `1girl, 2boys, threesome, mmf threesome, carried, lifted in air, spread legs, feet off ground` | Frontal `1024x1024` / `832x1216` |
| `MP04` | Kneeling Dual-Hand / Cheek Service (`跪姿左右双手并侍仰视位`) | Girl `C4` · Left `B3` · Right `D3` | `1girl, 2boys, threesome, mmf threesome, kneeling, 1.35::from above::, both hands occupied, looking up` | High-angle `1024x1024` |
| `MP05` | Supine Upper-and-Lower Trio (`仰卧开腿上下双区同步互动位`) | Girl `C3` · Upper `B3` · Lower `D4` | `1girl, 2boys, threesome, mmf threesome, lying on back, spread legs, head turned to side, arched chest` | Landscape `1216x832` |

#### 10B. FFM Dual-Heroine & Yuri Compositions (`两女一男 / 双女百合 · 2girls`)
| Code | Posture Name | Grid Coords (`[Character N]`) | Core Danbooru Posture Tags | Recommended Framing |
| :--- | :--- | :--- | :--- | :--- |
| `MP06` | Cheek-to-Cheek Twin Kneeling (`双女贴脸并跪协同仰视奉仕`) | Girl1 `B3` · Girl2 `D3` (POV `C4`) | `2girls, 1boy, threesome, ffm threesome, kneeling, cheek-to-cheek, 1.3::from above::, looking up at viewer, holding hands` | High-angle POV `1024x1024` |
| `MP07` | Stacked Prone Rear (`双女上下叠趴回眸后入位 / Daisy Stack`) | TopGirl `C2` · BotGirl `C4` · Partner `D3` | `2girls, 1boy, threesome, ffm threesome, lying on top of each other, prone, from behind, aligned hips, looking back` | Rear 3/4 `832x1216` |
| `MP08` | Tandem Straddle + Upper Ride (`双女上下分跨同乘位`) | UpperGirl `C2` · LowerGirl `C4` | `2girls, 1boy, threesome, ffm threesome, girl on top, straddling, kneeling over chest, mutual#holding hands` | Low-angle vertical `832x1216` |
| `MP09` | Twin Pressed Cleavage (`双女贴身并拢四乳夹持位`) | Girl1 `B3` · Girl2 `D3` | `2girls, 1boy, threesome, ffm threesome, upper body, close-up, breasts pressed together, symmetrical, looking up` | Square `1024x1024` |
| `MP10` | Interlocked Scissoring (`双女剪刀交错磨镜位 / Yuri Tribadism`) | Girl1 `B3` · Girl2 `D4` | `2girls, yuri, females only, 1.4::interlocked legs::, spread legs, reclining, arched backs, mutual#holding hands` | Overhead 3/4 `1216x832` |
| `MP11` | Rear-Embrace Assisted Showcase (`一女背后怀抱开腿·辅助展示位`) | BackGirl `C2` · FrontGirl `C3` | `2girls, yuri (or 1boy ffm), sitting, held from behind, back against chest, 1.35::spread legs::, mutual#kissing cheek` | Frontal vertical `832x1216` |

#### 10C. Surrounded & Group Compositions (`多人环绕群像系 · multiple boys / harem`)
| Code | Posture Name | Grid Coords (`[Character N]`) | Core Danbooru Posture Tags | Recommended Framing |
| :--- | :--- | :--- | :--- | :--- |
| `MP12` | Center-Kneeling Circle (`中心跪坐多方环绕仰视位`) | Girl `C3` (surrounding silhouettes in Base) | `1girl, multiple boys, 3boys, 1.35::surrounded::, kneeling in center, from above, looking up, faceless males` | Overhead `1024x1024` / `1216x832` |
| `MP13` | Supine Limbs-Held Crowd (`仰卧四肢分持展开群像位`) | Girl `C3` · Left `A3` · Right `E3` | `1girl, multiple boys, lying on back, spread legs, wrists held, high angle, surrounded by faceless males` | Landscape `1216x832` |
| `MP14` | Multi-Girl Harem Lap Surround (`多女环绕坐怀贴身群像位 / Harem`) | Center `C3` · LeftGirl `B3` · RightGirl `D3` | `3girls, 1boy, harem, sitting on lap, hugging from side, leaning in, crowded, looking at viewer` | Landscape `1216x832` |

#### Multi-Character Structured Prompt Template (Directly Supported in Bottom Prompt Drawer & `nai_set_manual_prompt`)
```text
[Base Prompt]
masterpiece, best quality, absurdres, year 2025, <style & lighting tags>, 2girls, 1boy, threesome, ffm threesome, pov, from above, bedroom, kneeling on bed, cheek-to-cheek, looking up at viewer. Two distinct petite heroines kneeling side by side looking up together in soft diffused light.

[Character 1 (B3)]
girl, <Character A tag & hair/eye/outfit>, kneeling on left, leaning right, cheek-to-cheek, mutual#holding hands, looking up at viewer, shy blush

[Character 2 (D3)]
girl, <Character B tag & hair/eye/outfit>, kneeling on right, leaning left, cheek-to-cheek, mutual#holding hands, looking up at viewer, naughty smile
```

---

## 4. Studio 2.0 Three-Mode Action Matrix (`web/src/data/engineConstants.ts` & `storyEngine.ts`)

All posture templates live strictly in TypeScript (`ALL_POSITIONS_TEMPLATES` & `MULTI_ANGLE_TEMPLATES` in `web/src/data/engineConstants.ts`; legacy Python `custom_positions.json` and `F00+S00~S11` Storyline are removed):
1. **`positions` (`P01`–`P51`)**: 51 structured postures across 9 categories, combinable with 3D Camera Radar (`camera_azimuth` / `camera_elevation` / `camera_shot` / `camera_gaze`, which automatically strips conflicting `ANGLE_TAGS_TO_STRIP`, `SHOT_TAGS_TO_STRIP`, and `GAZE_TAGS_TO_STRIP` before injecting the custom camera view).
2. **`multi_angle` (`MA0`–`MA10`)**: `MA0` peaceful sleeping + 10 daily/showcase angles (`MA1`..`MA10`), with optional `enable_multi_angle_nsfw` lower-anatomy showcase toggle.
3. **`free` (`FREE` Custom Action Mode) & Multi-Person Override**:
   - Compiles user-written `free_action_tags` + `free_action_prose` (and optional `free_action_nsfw` full lower-anatomy + `fluid_scale` pipeline) on top of the active character, outfit, lighting, and style presets.
   - **Important for `MP01`–`MP14` Multi-Person Scenes**: Because single-character `FREE` mode prepends `1girl, solo` from the active preset, when composing `MMF` / `FFM` / `2girls` / `Group` scenes on the live webpage, write a full `[Base Prompt]` + `[Character 1 (B3)]` + `[Character 2 (D3)]` multi-box prompt (or replace `1girl, solo` with the exact multi-person headcount header) in the bottom Prompt Drawer / via `nai_set_manual_prompt`.
