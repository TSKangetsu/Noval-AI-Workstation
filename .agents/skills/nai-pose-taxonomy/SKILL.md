---
name: nai-pose-taxonomy
description: Comprehensive NovelAI V4.5 / V5 posture, interaction position, transparent background, and partner-visibility decoupling reference. Covers 8 major posture families (supine, straddling/top, prone/rear, lateral/side, standing/carried, upper-body/oral-framing, external-contact poses, and acrobatic/flexible poses), POV vs 3rd-person camera framing, V5 native RGBA transparent background tags, and partner/anatomy visibility state-preservation rules.
---

# NovelAI V4.5 / V5 Full Posture & Interaction Taxonomy Skill

This skill documents the complete structural taxonomy of postures and two-person interaction compositions supported by NovelAI V4.5 and V5 (Danbooru tag system + T5 natural-language framing), along with **native V5 RGBA transparent background** rules and **partner / contact-organ state decoupling**.

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

---

## 3. Eight Complete Posture Families (NovelAI / Danbooru Reference)

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

---

## 4. Extensibility via Custom JSON (`custom_positions.json`)

The generator automatically loads optional user additions or tag overrides from `custom_positions.json` in the workspace root (if present), merging them into `ALL_POSITIONS_CHAPTERS` and `ALL_POSITIONS_TEMPLATES` without code edits.
