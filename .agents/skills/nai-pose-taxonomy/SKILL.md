---
name: nai-pose-taxonomy
description: Comprehensive NovelAI V4.5 / V5 posture, two-person & multi-person (MMF/FFM threesome, yuri, group/surrounded) & tentacle/insect/oviposition/pregnant-belly interaction taxonomy, 5-stage progression, condom & uterus x-ray physics, transparent background, and partner-visibility decoupling reference. Covers 12 posture families (P01-P51 + MP01-MP15 multi-person + TN01-TN12 tentacle, symbiote, oviposition & translucent egg-belly actions + BG01-BG20 fantasy hive/larvae-overflow & doujin-style giant arthropod mounting, facehugger, and white maggot-overflow actions), V4.5/V5 [Character N (A1..E5)] spatial partitioning & source#/target#/mutual# tags, MA0-MA10 multi-angle showcase, FREE custom action mode, and V5 native RGBA cutout rules.
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
1. **5 Interaction Stages (`pos_stage`) & All-Stage Tight-Opening Calibration (`全过程紧致开合度统一降权规范`)**:
   - `before` (进行中·未射) · `during` (高潮射精瞬间) · `after_inside` (射后体内停留溢流) · `pull_out` (刚拔出·微张洞内蓄满溢流) · `prolapse` (拔出脱垂·粉嫩宫颈外翻特写 `1.55::vaginal prolapse::, 1.35::prolapse::, cervix`).
   - **CRITICAL All-Stage Opening Calibration (Fixes Over-Wide Opening Across ALL Stages `before / during / after_inside / pull_out / solo / fingering / 69`)**:
     - **Global `gaping` Ban in Positive**: **NEVER** inject `0.55::gaping::` or `0.65::gaping::` in Positive on ANY standard stage (`before`, `during`, `after_inside`, `pull_out`, `solo`, `fingering`, or `showP = false`) — V5 renders positive `gaping` as an oversized empty dark cavity and pushes cum outside the rim! In UC, block `gaping` on `before / during / after_inside`, and switch to `gaping anus` only on `pull_out` (so the softly parted vaginal rim stays visible while brimmed full of cum).
     - **Tight Stage-by-Stage `spread pussy` Ceiling (Never Stack `1.2 ~ 1.35::spread pussy::`!)**:
       - **`before` (`solo` / `vaginal` / `showP=false`)**: Respect the active `MORPH_PRESETS` opening (e.g. `0.65::spread pussy::`) with **no extra `spread pussy` boost** (at most `0.8::spread pussy::` when `showP=false`).
       - **`during` & `after_inside`**: Cap at **`0.85::spread pussy::`** so the entrance stays snug and delicate around contact/overflow (`1.45::creampie::, 1.55::cum in pussy::, 1.5::cum overflow::`).
       - **`pull_out`**: Cap at **`0.9 ~ 1.0::spread pussy::`** (zero `gaping`!) + **`1.45::creampie::, 1.55::cum::, 1.75::cum in pussy::, 1.6::cum overflow::, 1.45::cumdrip::`** (plus `1.4::pussy from behind::` on rear postures `P17–P22, P44, P49`; keep `cum string` when `showP=true`; omit `cum on stomach` on rear postures; strip `dripping` from lighting UC whenever fluids are active).
       - **Manual Finger-Spread (`P45–P51` / `MA7A–MA7D` / `P33` 69)**: Tighten from `1.25~1.35::spread pussy::` down to **`0.95 ~ 1.05::spread pussy::`** so finger-parting stays dainty and proportionate to petite bodies.
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
     - Always add `twins, identical hair` + unwanted headcounts (`solo, 2boys, 3girls` for FFM; `solo, 1boy, 2girls` for MMF) to Negative `UC`.
     - When dressing named characters in non-canon outfits (e.g., Reverse Bunnysuit) inside manual `[Character N]` boxes, explicitly add their `canon_neg_tags` (e.g., `neckerchief, serafuku, plaid, gloves, crown`) to `scene_negative` so canonical accessories/crowns never leak in.
   - **Horizontal Sandwich Rule (`B3 · C3 · D3`) & `C5` Bottom-Anchor**:
     - For side/three-quarter **Sandwich** poses (both `MMF` 1-girl-between-2-boys `MP02` and `FFM` 1-boy-between-2-girls `MP15`), always partition horizontally (`B3` Front/Left · `C3` Center Sandwiched Subject · `D3` Rear/Right; or `B4` Supine · `C3` Straddling · `D3` Kneeling Behind) rather than vertical `C2/C3/C4` stacking, preventing head/torso occlusion.
     - For POV / supine-partner `FFM` compositions (`MP06`, `MP08`, `MP09`), explicitly bind the foreground/supine male partner to a lean `[Character 3 (C5)]` bottom-center box (`boy, faceless male, pov crotch / lying on back underneath, penis, ...`).
   - **Token Budget Discipline**: Total T5 tokens **summed across `[Base Prompt]` + ALL `[Character N]` boxes** share the single `512` limit (`<= 400` with 3 V4.5 Vibes). Keep faceless male partner boxes ultra-lean (`12–22` tokens, e.g., `boy, faceless male, muscular, standing, ...`) so hero female boxes retain full detail.
3. **Directed Action Prefixes (`source#` / `target#` / `mutual#`)**:
   - In V4.5 / V5 multi-character boxes, bind asymmetric actions explicitly so roles never invert:
     - Initiator box: `source#fellatio`, `source#breast grab`, `source#fingering`, `source#kissing cheek`
     - Receiver box: `target#fellatio`, `target#breast grab`, `target#fingering`, `target#kissing cheek`
     - Symmetric shared action (both boxes): `mutual#french kiss`, `mutual#holding hands`, `mutual#hug`, `mutual#tribadism`

### E. First-Person POV Optical & Anatomical Consistency Audit (`全系列体位 POV 光学遮挡与防扭头修正总表`)
Across `P01`–`P51`, NovelAI V5 forces physically impossible body rotations or 3rd-person camera drift whenever **injected face/expression/outfit/male-torso tags contradict what the partner's eyes can actually see in `pov`**. All affected poses fall into **4 optical failure groups**:

#### Group 1: Strict Rear-Facing POV — Anti-180° Owl Head-Turn (`纯背向视线组`)
- **Affected Poses**:
  - **Core Rear-Entry / Doggy / Ass-Focus**: `P17`, `P18`, `P19`, `P20`, `P21`, `P22`, `P38`, `P44`, `P49` (partner behind looking forward/down: `1.35::from above::, high angle`)
  - **Reverse Cowgirl (Supine Partner Looking Up at Her Back)**: `P12`, `P13` (**same 4-step rear sanitization**, except swap camera elevation to `1.35::from below::, low angle` looking up at her arched spine, shoulder blades, and hips!)
  - **Side-Rear Spooning (Optional Strict No-Turnback)**: `P23` (nape/back-of-head `nape, back of head, from behind` instead of full frontal face)
- **4-Step Simultaneous Fix (Leaving Even One Restores Head-Turn)**:
  1. **Pose & POV Anchors**: Strip `looking back`, `looking back over shoulder`, `over shoulder`, `head turned back`, `looking at viewer`; inject `1.45::pov::, pov hands, pov crotch, grabbing another's hip, 1.5::from behind::, 1.35::back::, 1.35::facing away::, back of head, bare back, shoulder blades, spine` (+ `from above, high angle` for `P17`–`P22`/`P38`/`P49`, or `from below, low angle` for `P12`/`P13`) and rewrite `prose_core` to `"facing away showing the back of her head and bare slender back"`.
  2. **Suppress ALL Facial/Eye Expressions**: Gate off `expPos` (`smug, jitome, mesugaki, half-closed eyes, blush`), `gradient eyes` in `headPos`, and `blush stickers, nose blush` in Post-pass 4.5; replace with somatic cues (`trembling, twitching, arched spine`).
  3. **Sanitize Front-Only Outfit Tags**: Strip `open jacket, bare breasts, nipples, 1.3::nipples::, pasties, heart pasties, bare stomach, midriff, navel, red bowtie, cleavage` from `posOutfit` so V5 never twists her chest sideways to show a nipple/navel.
  4. **Anti-Turnback Negative Lock**: Prepend `looking back, looking at viewer, face, eyes, front view, profile, bare breasts, nipples, navel, midriff, red bowtie` to `extraNeg` / `scene_negative`.

#### Group 2: Cradled / Seated-on-Lap Rear-Embrace POV (`背后怀抱坐怀/悬空托举组 · 最严重第三人称穿帮组`)
- **Affected Poses**: `P15` (背靠坐姿观音位), `P28` (背向悬空抱举 Reverse Ekiben), `P40` (双腋穿臂 Full Nelson), `P46` (背后环抱揉胸指交), `P50` (背后环抱双手揉胸), `P51` (背后抱腿大开脚指交).
- **Bug Diagnosis**: In true 1st-person POV, the heroine's back is pressed directly against the viewer's chest, so the viewer **looks straight down over her shoulders/top of head at her chest, stomach, and spread thighs (`from above, top-down`)**! Currently:
  - `P28` (`looking back up`) & `P51` (`frontal low angle, carried from behind, looking down at viewer`) mistakenly describe a **3rd-person frontal camera standing in front of both people**!
  - `P15`, `P40`, `P46`, `P50` include `looking up at viewer / looking back up`, forcing her neck to crane 180° backward while often spawning a 3rd-person faceless male behind her.
- **Fix**:
  - Replace `pose_pov` with **over-the-shoulder downward chest/lap POV**: `1.45::pov::, 1.4::from above::, top-down, high angle, looking down, pov hands, top of head, foreshortening` (+ `1.35::grabbing another's breast::` for `P46`/`P50`, or `arms under knees, spread legs, m legs` for `P28`/`P51`, or `arms under armpits` for `P40`).
  - **Same Facial Gating as Group 1** if pure downward body/crown-of-head POV is desired (`top of head, hair crown`, suppress eye/mouth expression tags, block `male face, male head, third-person` in UC); or if chin-tilted-back side-cheek glimpse is kept, never use `frontal low angle` or `looking down at viewer`.

#### Group 3: Mutual 69 & Extreme Face-Occlusion POV (`69互侍与跨骑遮脸组`)
- **Affected Poses**:
  - **`P33` (上下交叠 69 位 · `ventral_no_eyes` + Portrait `832x1216` in POV / Landscape `1216x832` in 3RD)**: When straddling on all fours above the supine male partner, the viewer looks up along her **ventral** body axis (`bare stomach, underboob, bare breasts, head down, chin, open mouth, lips around penis`) — NOT her back! Must use Portrait `832x1216` in `pov` (`canvas_pov`), suppress eye/brow expressions (`eyes, eyebrows, eyelashes, pupils` in UC — NEVER `face`, which turns her inverted jaw into a featureless blob!), keep `bare stomach, underboob, bare breasts, open mouth`, and block `vaginal, vaginal penetration, insertion` in both `pov` and `3rd`.
  - **`P29` (玻璃窗贴胸后入位)**: `pose_pov` currently says `"frontal view through glass ... looking at viewer"` — that is the **outside bystander's view through the window**, NOT the male partner's 1st-person POV standing behind her indoors! Keep `"frontal view through glass"` strictly in `pose_3rd`, and fix `pose_pov` using **Group 1's pure rear-facing POV** (`1.45::pov::, 1.5::from behind::, pressed against glass, palms on glass, back of head, bare back, window in front`).

#### Group 4: Male-Back Self-Occlusion in Frontal POV (`正面体位男伴后背挡镜头伪POV问题`)
- **Affected Poses**: `P01`–`P11`, `P14`, `P16`, `P26`, `P27`, `P30`–`P32`, `P34`–`P37`, `P39`, `P41`, `P45`, `P47`, `P48`.
- **Cause**: `storyEngine.ts` injects `1boy, hetero, faceless male, 1.35::pov::, pov hands` without blocking male upper-body rear views, so V5 frequently draws a **3rd-person over-the-shoulder shot** with a broad male back/head blocking the bottom 40% of the canvas (especially in `P26` standing wall-pin, `P27` Ekiben, `P03` folded press, `P11` leaning-back cowgirl).
- **Fix**:
  - In `pov` mode (`maleCode === "normal"`), replace generic `faceless male` torso drift with **strict foreground limb/groin-only cropping**: inject `pov crotch` (when `showP` on vaginal/oral/chest/thigh) + `pov hands`, and append **`male back, male head, male shoulders, from behind male, over-the-shoulder`** to `partnerNeg`!
  - Minor gaze conflict fixes inside frontal `pose_pov`:
    - `P11` (后仰撑手女上位): `head tilted back` conflicts with expression `looking at viewer` — keep gaze natural/upward or drop `head tilted back` when `looking down at viewer` is active.
    - `P42` (站立一字马): `eye-level full-body` looks like a 3rd-person studio photo; add `pov hands, holding raised leg, close-up` for genuine 1st-person interaction.

#### Unified `web/src/` Verification Checklist (For Auditing Workflow Edits)
1. **Pose Metadata Classification**: Every `P01`–`P51` template in `engineConstants.ts` cleanly distinguishes its `pov` optical visibility (`front_face_visible` vs. `rear_no_face` [`P12, P13, P17–P23, P29, P38, P44, P49`] vs. `top_down_over_shoulder` [`P15, P28, P40, P46, P50, P51`] vs. `ventral_no_eyes` [`P33`]).
2. **Global Module Gating in `storyEngine.ts`**: Whenever `isPov` + `rear_no_face` (or `top_down_over_shoulder`) is active, verify **all three** leak paths are gated: (a) `expPos` & Post-pass 0 `applyExpressionToPrompt`, (b) `headPos` `gradient eyes` & Post-pass 4.5 `blush stickers, nose blush`, and (c) front-only `posOutfit` chest/navel tags (`bare breasts, nipples, midriff, navel, open jacket, red bowtie, pasties` on `rear_no_face`, plus `rabbit tail` on `top_down_over_shoulder` where her back is pressed against the viewer).
3. **True 1st-Person Male Cropping**: In `isPov && maleCode === "normal"`, verify `male back, male head, male shoulders, male face, over-the-shoulder` are blocked in `partnerNeg` so `POV` never degrades into an over-the-shoulder 3rd-person shot.
4. **Build & Token Budget Gate**: Run `npm --prefix web run verify` (all scenes `<= 502` T5 tokens, zero `:::` or nested negative syntax bugs) and `npm --prefix web run build` + `NovelAI_Workbench.html` sync check.

#### Post-Audit & Live-Render Confirmed Edge-Case Fixes (`P20` · `P25` · `P28` · `P33` · `P41` · `P44` 实测出图验核细则)
All 6 poses were live-rendered on NovelAI V5 Full (`28 steps, Scale 6.8`) in `POV` mode to verify the exact failure modes on screen:

1. **`P20` (直立跪姿背拉手后入位 · Live Render `232851_P20_s2062292514.png` ❌ Failed Arm-Pull)**:
   - **Live Visual Verdict**: Pure rear back-of-head framing succeeded cleanly, **BUT her arms braced straight forward on the floor identically to `P17`/`P21`** — zero `arms pulled back` posture!
   - **Root Cause**: `1.3::arms behind back::` was overridden by `pov hands, grabbing another's hip` (`storyEngine.ts:1961`, placing the partner's hands on her hips instead of pulling her wrists) + `1.35::from above::, high angle` pushing her torso forward onto her hands.
   - **Exact Fix**:
     - In `P20.pose_pov`: replace `1.35::from above::, high angle` with `slight high angle`, replace `1.3::arms behind back::` with **`1.45::arms pulled back::, 1.4::wrists held::, holding wrists, torso upright, arched chest`**, add `hands on floor, all fours, supporting hands forward` to `P20` `extraNeg`, and in `storyEngine.ts` suppress `grabbing another's hip` when `sceneId === "P20"`.

2. **`P25` (侧身交错剪刀位 · Live Render `232918_P25_s2834812877.png` ❌ Failed Clamped Legs & Missing Partner)**:
   - **Live Visual Verdict**: Rendered a **3rd-person solo-looking shot with both black-stockinged thighs clamped tightly crossed (`crossed legs`)**, zero visible partner body/limbs, and a floating cutaway X-ray!
   - **Root Cause**: (a) `1.3::crossed legs::` clamps both thighs shut in Danbooru; (b) `P25.pose_pov` lacked `pov, pov hands, pov crotch`; (c) `rabbit tail` poked out awkwardly under her side waist.
   - **Exact Fix**:
     - Replace `P25.pose_pov` with **`1.45::pov::, 1.3::from above::, high angle, pov hands, grabbing thigh, reclining on side, 1.4::leg lift::, 1.35::spread legs::, one leg raised, straddling one leg, interlocked legs, looking at viewer`**, and never use `crossed legs` on vaginal channels.

3. **`P28` (背向悬空抱举 Reverse Ekiben · Live Render `232943_P28_s4096518945.png` ✅ Optical Success + Minor Grounding Tweak)**:
   - **Live Visual Verdict**: **Huge improvement!** `top_down_over_shoulder` rendered an authentic 1st-person downward view over her purple hair crown, red bowtie, bare breasts, womb X-ray, and wide M-legs held under her knees by the viewer's arms — zero 180° head-turn and zero 3rd-person camera flip!
   - **Minor Visual Defect**: Because of `top-down` + `furry beige rug, wooden floor`, her thighs appeared resting on the rug rather than suspended high in mid-air (`Reverse Ekiben`).
   - **Exact Fix**: Add **`standing, 1.35::suspended::, high above floor, distant floor`** to `P28.pose_pov` (and `P40`/`P51`), plus keep `front view, straight-on` in `isTopDownOverShoulderPov` `extraNeg` and strip `rabbit tail` from `posOutfit` for safety across seeds.
   - **Global 3D-Radar Guard (`storyEngine.ts:1416, 2684`)**: Also ensure leftover `cam_enable_override: true` (`azimuth=0`) does not silently disable `pov_visibility` when `perspective_mode === "pov"`.

4. **`P33` (上下交叠互侍 69 位 · Calibrated Live Renders `075153_P33_s2506080865.png` POV + `075331_P33_s51671365.png` 3RD ✅)**:
   - **Root Cause Diagnosis**:
     - **(a) Aspect Ratio**: 1st-person 69 stretches vertically from upper hips/groin -> bare stomach/underboob -> inverted mouth at the bottom, requiring **Portrait `832x1216` (`canvas_pov`)**, whereas 3rd-person side profile requires **Landscape `1216x832` (`canvas`)**.
     - **(b) Ventral-Not-Dorsal Visibility (`ventral_no_eyes`)**: Treating `P33` as `rear_no_face` stripped `bare stomach, bare breasts, open mouth` and put `face` in Negative UC, twisting her torso into a contorted dorsal back and turning her inverted jaw into a featureless blob!
     - **(c) Anti-Insertion & Anti-Gusset Lock**: Must explicitly inject `1.45::pussy::, 1.4::pussy from behind::, 1.35::spread pussy::` (POV) / `1.45::cunnilingus::, licking pussy, tongue on pussy` (3RD) alongside `1.45::oral::, 1.45::fellatio::` while blocking `vaginal, vaginal penetration, insertion, panties, leotard, black leotard, covered crotch` in UC.
   - **Exact Fix**:
     - Set `pov_visibility: "ventral_no_eyes"` + `canvas_pov: "竖图 832x1216"` + `canvas: "横图 1216x832"`; block `eyes, eyebrows, eyelashes, pupils` (NOT `face`) in `extra_pov_neg`; preserve `bare stomach, underboob, bare breasts, head down, chin, open mouth, lips around penis` in `POV`, and lock full side-profile `1.45::from side::, side view, profile, 1.55::sixty-nine::, opposing orientation, head to crotch` in `3RD`.

5. **`P41` (倒立折腰高举臀位 Piledriver · Live Render `233039_P41_s165065121.png` ❌ Completely Unfolded Into Upright `P02` Missionary)**:
   - **Live Visual Verdict**: **100% collapsed into normal upright Legs-Up Missionary (`P02`/`P03`)!** Her head was right-side-up at the TOP of the canvas (`y = 0.2`) and her pelvis was at the BOTTOM (`y = 0.85`) — the exact opposite of an inverted piledriver!
   - **Root Cause**: `P41` was marked `pov_visibility: "front_face_visible"`, injecting upright `looking at viewer` + full facial expressions while omitting `upside-down` and `piledriver`, so V5 placed her head at the top of the vertical `832x1216` canvas.
   - **Exact Fix**:
     - Rewrite `P41.pose_pov` to force vertical inversion (**hips at top, upside-down head at bottom**): **`1.45::pov::, 1.4::from above::, steep high angle, looking down, pov hands, grabbing hips, 1.55::piledriver::, 1.5::upside-down::, inverted body, head at bottom, hips at top, shoulders on floor, pelvis raised high in air, ass up, ankles by ears, upside-down face`**, and add `head at top, upright, sitting, lying flat on back` to `P41` `extraNeg`.

6. **`P44` (跪趴塌腰展示位 · Live Render `233111_P44_s2900981985.png` ⚠️ Rear View OK, Needs Close Framing & Rear Fluid Routing)**:
   - **Live Visual Verdict**: Pure rear-facing all-fours posture + womb X-ray + squirting rendered cleanly without any head-turn! However, because `channel: "solo"` lacks `pov hands` or `close-up`, the camera floated slightly far back like a 3rd-person center-symmetric diagram, and its Chinese title still says `回眸展示位` (`looking back`) while POV now suppresses `looking back` (plus `solo` `after_inside`/`pull_out` injects `cum on stomach` which gets stripped on rear views).
   - **Exact Fix**:
     - Add `close-up, cowboy shot, 1.35::ass focus::, pussy from behind` to `P44.pose_pov` for intimate first-person proximity, route `solo` rear-POV post-climax fluids to `cumdrip, cum on thighs, cum on ass` instead of `cum on stomach`, and update `P44` POV subtitle/label clarity (`客观回眸 / POV纯背特写`).

---

## 3. Ten Complete Posture Families (`P01`–`P51` + `MP01`–`MP15` Multi-Person Reference)

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
| `MP02` | Sandwich Straddle (`站/卧姿前后贴胸三明治夹心位`) | Girl `C3` · Front `B3` (or `B4` supine) · Rear `D3` | `1girl, 2boys, threesome, mmf threesome, 1.45::sandwich::, 1.35::double penetration::, upright straddle, pressed between, simultaneous, from side` | Vertical `832x1216` (standing) / Landscape `1216x832` (bed) |
| `MP03` | Suspended Twin-Carry (`双人左右/前后悬空托举开脚位`) | Girl `C3` · Left `B3` · Right `D3` | `1girl, 2boys, threesome, mmf threesome, carried, lifted in air, spread legs, feet off ground` | Frontal `1024x1024` / `832x1216` |
| `MP04` | Kneeling Dual-Hand / Cheek Service (`跪姿左右双手并侍仰视位`) | Girl `C4` · Left `B3` · Right `D3` | `1girl, 2boys, threesome, mmf threesome, kneeling, 1.35::from above::, both hands occupied, looking up` | High-angle `1024x1024` |
| `MP05` | Supine Upper-and-Lower Trio (`仰卧开腿上下双区同步互动位`) | Girl `C3` · Upper `B3` · Lower `D4` | `1girl, 2boys, threesome, mmf threesome, lying on back, spread legs, head turned to side, arched chest` | Landscape `1216x832` |

#### 10B. FFM Dual-Heroine & Yuri Compositions (`两女一男 / 双女百合 · 2girls`)
| Code | Posture Name | Grid Coords (`[Character N]`) | Core Danbooru Posture Tags | Recommended Framing |
| :--- | :--- | :--- | :--- | :--- |
| `MP06` | Cheek-to-Cheek Twin Kneeling (`双女贴脸并跪协同仰视奉仕`) | Girl1 `B3` · Girl2 `D3` · Male `C5` | `2girls, 1boy, threesome, ffm threesome, pov, kneeling, cheek-to-cheek, 1.3::from above::, looking up at viewer, mutual#holding hands` | High-angle POV `1024x1024` |
| `MP07` | Stacked Prone Rear (`双女上下叠趴回眸后入位 / Daisy Stack`) | TopGirl `C2` · BotGirl `C4` · Partner `D3` | `2girls, 1boy, threesome, ffm threesome, lying on top of each other, prone, from behind, aligned hips, looking back` | Rear 3/4 `832x1216` |
| `MP08` | Tandem Straddle + Upper Ride (`双女上下分跨同乘牵手位`) | UpperGirl `C2` · LowerGirl `C4` · Male `C5` | `2girls, 1boy, threesome, ffm threesome, girl on top, straddling, facesitting, low angle, mutual#holding hands` | Low-angle vertical `832x1216` |
| `MP09` | Twin Pressed Cleavage (`双女贴身并拢四乳协同夹持位`) | Girl1 `B3` · Girl2 `D3` · Male `C5` | `2girls, 1boy, threesome, ffm threesome, 1.4::cooperative paizuri::, paizuri, pov, from above, upper body, close-up, breasts pressed together, symmetrical` | Square `1024x1024` |
| `MP10` | Interlocked Scissoring (`双女剪刀交错磨镜位 / Yuri Tribadism`) | Girl1 `B3` · Girl2 `D4` | `2girls, yuri, females only, 1.4::tribadism::, 1.35::interlocked legs::, spread legs, reclining, mutual#tribadism, mutual#holding hands` | Overhead 3/4 `1216x832` |
| `MP11` | Rear-Embrace Assisted Showcase (`一女背后怀抱开腿·辅助展示位`) | BackGirl `C2` · FrontGirl `C3` | `2girls, yuri (or 1boy ffm), sitting, held from behind, back against chest, 1.35::spread legs::, mutual#kissing cheek` | Frontal vertical `832x1216` |
| `MP15` | FFM Reverse Sandwich (`双女前后贴身夹男伴三明治位`) | FrontGirl `B3` · CenterMale `C3` · RearGirl `D3` | `2girls, 1boy, threesome, ffm threesome, 1.4::sandwich::, pressed between, straddling, hugging from behind, kissing neck` | Landscape `1216x832` |

#### 10C. Surrounded & Group Compositions (`多人环绕群像系 · multiple boys / harem`)
| Code | Posture Name | Grid Coords (`[Character N]`) | Core Danbooru Posture Tags | Recommended Framing |
| :--- | :--- | :--- | :--- | :--- |
| `MP12` | Center-Kneeling Circle (`中心跪坐多方环绕仰视位`) | Girl `C3` (add `A3`/`E3`/`C5` boxes if strict 3-boy count is required; 1-box mode often converges to 2 symmetric partners) | `1girl, multiple boys, 3boys, 1.35::surrounded::, kneeling in center, from above, looking up, faceless males` | Overhead `1024x1024` / `1216x832` |
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

### Family 11: Tentacle, Oviposition, Symbiote & Belly-Inflation Postures (`11. 触手缠缚·苗床产卵·活体寄生与猎奇膨腹系 · TN01–TN12`)

Empirically calibrated on NovelAI V5 Full (`28 steps, Scale 6.8`), covering **Female / Femboy / Futanari (`女 / 伪娘 / 扶他无蛋·有蛋`)** 3-way routing:

#### Core Hygiene & Anti-Bleed Rules for Tentacle / Belly-Inflation Scenes
1. **Strict Anti-Human-Limb Isolation (`solo` + UC)**:
   - High-intensity interaction tags (`spitroast, double penetration, vaginal, fellatio, deepthroat`) strongly bias V5 toward spawning phantom faceless-male hands or torsos unless explicitly blocked.
   - Always keep `1girl, solo` (Female / Futanari) or `1.45::1boy::, solo, 1.55::otoko no ko::, 1.45::crossdressing::, 1.35::genderbend::` (Femboy) and append `human hands, multiple boys, 2boys, extra fingers, extra legs, extra arms` to `extra_uc` (plus `1boy, male, penis, phallus, testicles` on Female; unblock `penis, phallus` on Futanari/Femboy and `testicles` on Femboy/Futa-with-balls).
2. **Cavern / Bioluminescent Environment Synergy**:
   - Replacing bright bedroom tags (`indoors, bedroom, bed, white bedsheet, bright window`) with `dark cavern, glowing bioluminescent mist` (plus `tentacle pit` for nest/oviposition scenes, or `wet stone wall` for `TN06`) dramatically improves translucent slime specular highlights and rim-lit tentacle depth.
3. **Belly-Inflation / Pregnant / Translucent Egg-Belly Unlock on Slender Mini-Lady Presets**:
   - Standard petite/slender body presets inject `slim waist, -0.40::plump::` in Positive and `plump, curvy` in Negative, which flatten abdominal expansion.
   - Whenever generating **pregnant / oviposition / cum-inflation / translucent egg-belly (`TN02, TN04, TN09, TN10, TN12`)**, strip `slim waist, -0.40::plump::` (and outfit `midriff, navel` if conflicting) from Positive and strip `plump, curvy` from Negative while retaining `1.2::petite::, 1.3::slender::, narrow shoulders, 1.25::narrow hips::`.
   - Always add `fetus, baby, embryo, umbilical cord, skeleton, bones, skull, ribcage, gore` to `extra_uc` on X-ray / translucent belly scenes (and add `x-ray, cross-section, uterus, cervix, cutaway` to `extra_uc` on non-X-ray external scenes `TN01, TN05, TN06, TN07, TN08, TN11`).
4. **3-Way Gender Routing Summary (`TN01–TN12`)**:
   - **Female (`normal`)**: `1girl, solo`, `tentacles on breasts`, `vaginal / double penetration / cervical penetration`, `uterus, cervix, cum/eggs in uterus`.
   - **Femboy (`femboy`)**: `1.45::1boy::, solo, 1.55::otoko no ko::, 1.45::crossdressing::, 1.35::genderbend::, 1.55::flat chest::, 1.4::flat male chest::, tiny pink nipples, hairless torso`; swap `tentacles on breasts` → `tentacles on chest`, `vaginal / cervical penetration` → `1.5::anal::, 1.45::anal penetration::, 1.45::male penetrated::`, `uterus, cum/eggs in uterus` → `1.45::intestines::, 1.5::cum in ass::` (or `1.45::intestines::, 1.45::eggs::, 1.5::oviposition::`) with `uterus, cervix` locked in UC; add `1.4::small penis::, 1.3::small testicles::, testicles, 1.45::coiled tentacle around penis::, milking, 1.4::precum::` on milking/frontal scenes. See `nai-genderbend-femboy` **Archetype F**.
   - **Futanari (`futa_no_balls` / `futa_with_balls`)**: `1girl, solo, 1.55::futanari::, 1.45::futa without balls::` (or `1.45::futa with balls::, 1.25::small testicles::, testicles`), pair with `0.28::artist:pija (pianiishimo)::` tail-blend, strip standalone vulva morphology (`labia, 0.65::spread pussy::`), and layer **upper coiled tentacle milking her compact shaft (`1.4::small penis::, 1.35::erection::, 1.45::coiled tentacle around penis::, 1.4::precum::`)** simultaneously with **lower vaginal penetration / oviposition**. See `nai-futanari-crafting` **Archetype F**.

#### Dual-Camera POV Differentiation System Across ALL `TN01–TN12` & `BG01–BG20` (`全 32 个触手与虫类场景双镜头视角差分体系 · 实测校准`)
Every scene in **`TN01–TN12`** and **`BG01–BG20`** supports two switchable camera perspectives (**View A: Standard Scene / Full-Action Framing** vs **View B: Groin-to-Head Worm's-Eye POV · 胯部向头部仰视第一视角**):
- **Mandatory Anti-Inversion Guard on View B (CRITICAL — Empirically Caught in 495+ Token Budget Audit!)**:
  - When long outfits (e.g., Reverse Bunnysuit ~60 tokens) + Femboy headers push `pos_tokens` to `495~500 / 502`, the token trimmer drops trailing T5 spatial prose (`head at the top`). Without an explicit upright anchor, bare `1.55::from below::` + `all fours` / `lying on back` (`BG14, BG15`) can invert vertically (head at bottom, legs at top) even if bare `upside-down` is in UC!
  - **Mandatory Fix**:
    1. **Front-load upright spatial anchor directly inside the View-B camera tag slot** (never rely solely on trailing T5 prose): **`groin focus in foreground, head at top`** (or `ass focus, groin focus in foreground, head at top` on `B-3` rear POV).
    2. **Expand View-B Anti-Inversion UC** from bare `upside-down` to: **`upside-down, inverted, head at bottom, legs at top`**.
    3. **Keep `BG15` Action Tags Compact (~15–20 tokens leaner)** so `second chitinous bug sucking penis` is never clipped when combined with long outfits + Femboy headers!
- **Strip Conflicting View-A Framing Tags**: Before injecting View B, strip `wide shot, cowboy shot, from side, 1.3::from above::, from above, looking at viewer` (and convert `1216x832` landscape scenes `TN03, TN10, BG05, BG12, BG14, BG20` to **Vertical `832x1216`** on View B so the vertical groin-to-head axis fills the entire tall frame!).
- **5 Scene-Adapted Groin-to-Head POV Templates (`视场景自适应仰视镜头配方`)**:
  1. **Type B-1 · Standing / Suspended / Reclining Frontal Groin-to-Head POV** *(for `TN01, TN02, TN04, TN05, TN06, TN09, TN10, TN11, TN12` & `BG01, BG02, BG03, BG04, BG06, BG07, BG09, BG10, BG11, BG12, BG17, BG18`)*:
     - **Camera Tags**: `1.55::from below::, 1.45::pov::, 1.5::foreshortening::, 1.45::worm's-eye view::, groin focus in foreground, head at top, looking down at viewer`
     - **T5 Prose Prefix**: `Dramatic low-angle POV from right between spread thighs looking steeply upward along torso and chest to blushing face at the top: in the close lower foreground ...` *(Verified on `TN05`, `BG07`, `BG20` — even works seamlessly WITH a centered lower-belly `x-ray, cross-section` window!)*
  2. **Type B-2 · Supine Bed / Nest Mounting Groin-to-Head POV** *(for `TN07` & `BG13, BG16`)*:
     - **Camera Tags**: `1.55::from below::, 1.45::pov::, 1.5::foreshortening::, groin focus in foreground, head at top, looking down at viewer`
     - **Anti-Face-Occlusion Rule (`BG13 / BG16`)**: Keep the mounting arthropod positioned low between the thighs (`mounting low between spread thighs in lower foreground`) so its carapace does not block her breasts and crying/ecstatic face at the top!
  3. **Type B-3 · All-Fours Rear Crotch-to-Head Low-Angle POV** *(for `TN03` & `BG05, BG14` — converts `1216x832` side view into `832x1216` rear-underneath POV!)*:
     - **Camera Tags**: `1.55::from behind::, 1.5::from below::, 1.45::pov::, 1.5::foreshortening::, 1.45::ass focus::, groin focus in foreground, head at top, looking back at viewer`
     - **Visual Result** *(Verified `BG14` `s771767528`)*: Spider/insectoid penetration + hanging futa/femboy shaft fill the huge lower foreground while the creature on her back and her turned face crown the top! *(Requires `head at top` + `upside-down, inverted, head at bottom, legs at top` in UC so `all fours + from below` never flips upside-down under 495+ token budgets.)*
  4. **Type B-4 · Supine Facehugger + Groin-Parasite Dual-Anchor Groin-to-Head POV** *(for `BG15`)*:
     - **Camera Tags + Dual-Creature Lock**: `1.55::from below::, 1.45::pov::, 1.5::foreshortening::, groin focus in foreground, head at top, 1.6::2 creatures::, 1.55::groin parasite::, looking down at viewer` *(Keep the `BG15` action tag string concise — e.g. `1.6::facehugger:: on face, tail around neck, 1.45::throat bulge::, second chitinous bug latched onto groin sucking penis` — so it never exceeds 502 tokens or drops the lower groin parasite under long outfits + Femboy headers!)*
  5. **Type B-5 · Oral-Focus Chin/Collarbone-to-Head Low-Angle Orifice POV** *(for upper-body oral scenes `TN08, BG08` — or full-body Groin-to-Head option)*:
     - **Sub-Option B-5a (Tight Sub-Chin Low-Angle POV)**: `1.5::from below::, 1.45::pov::, 1.45::foreshortening::, upper body, close-up from below chest looking steeply up past glistening chest and bulging throat into wide-open mouth` (preserves extreme oral larvae / throat-bulge detail).
     - **Sub-Option B-5b (Full-Body Groin-to-Head Oral POV)**: Pulls back to `between spread thighs looking up torso to throat bulge / larvae-overflowing mouth at top`.
  - **Special Tag Boost for `BG19 / BG20` Maggot Overflow on View B**: Add **`1.55::maggots in pussy::, 1.5::worms crawling on skin::`** (or `maggots in ass` on Femboy) so white maggots gush directly out of the foreground orifice rather than pooling only on the bedsheet below *(Verified `BG19` `s2020219910` & `BG20` `s3666267682`)*.

#### Internal X-Ray / Cross-Section Matrix Across ALL `TN01–TN12` & `BG01–BG20` (`全 32 场景透视版实测评估与 5 类路由规范 · 8/8 实测通过`)
When the user toggles **Internal X-Ray (`enable_uterus_xray: true`)** on any scene in `TN01–TN12` or `BG01–BG20`, do **NOT** blindly inject generic `uterus` everywhere — route dynamically across **5 empirically verified X-Ray modes**:

1. **Mode X-1 · Built-In Cutaway Scenes (Already Native X-Ray — Deduplicate, Do Not Double-Stack)**:
   - **Scenes**: `TN02, TN04, TN10, BG03, BG12, BG20`.
   - **Rule**: Already ship with `builtin_xray: true`; toggling `enable_uterus_xray` keeps the native cutaway clean without duplicating `x-ray, cross-section` tags.
2. **Mode X-2 · Throat / Esophagus / Stomach X-Ray (`咽喉→食道→胃部纵向透视` — CRITICAL for Oral/Facehugger Scenes!)**:
   - **Scenes**: `TN08` *(Verified `s333467657`)*, `BG08`, `BG15` *(Verified `s2467346168`)*.
   - **Why**: Injecting `uterus` on upper-body oral close-ups (`TN08, BG08`) or facehugger deepthroat (`BG15`) breaks framing or spawns misplaced organs.
   - **Tags**: `1.55::x-ray::, 1.5::cross-section::, 1.5::stomach x-ray::, 1.45::internal::` + T5 prose describing the tentacle / golden larvae / facehugger feeding tube descending down the throat & esophagus into a glowing cum- or egg-filled stomach cutaway! *(Note on `BG15`: when X-Ray is ON, drop the secondary groin bug so V5 focuses cleanly on facehugger + chest/stomach egg cutaway + bare groin/shaft below.)*
   - **Works identically across all 3 genders** (Female & Futa keep `bare breasts`, Femboy locks `1.55::flat chest::, tiny pink nipples`).
3. **Mode X-3 · Standard Lower-Belly Penetration / Oviposition / Maggot X-Ray (`居中下腹子宫/肠道剖面`)**:
   - **Scenes**: `TN01, TN05` *(Verified `s4130640127`)*, `TN06, TN07, TN09, TN11` & `BG02, BG07, BG10, BG11, BG17` *(Verified `s3896106058`)*, `BG18` *(Verified `s1244193888`)*, `BG19` *(Verified `s2532087910`)*.
   - **Female / Futa**: `1.55::x-ray::, 1.5::cross-section::, 1.5::uterus::, 1.45::cervical penetration::` + scene payload (`1.5::cum in uterus::` on tentacle/worm, `1.55::eggs in uterus::` on `BG17`, or `1.6::maggots::, packed with wriggling plump white maggots streaming out of gaping pussy` on `BG19`!).
   - **Femboy**: **MUST swap `uterus, cervix, cum in uterus` → `1.5::intestines::, 1.5::cum in ass::, internal cumshot`** (or `1.5::intestines::, 1.5::oviposition::, 1.5::eggs::` on `BG17/BG18`) and **strictly lock `uterus, cervix, womb` in UC** *(Verified `TN05` `s4130640127` & `BG18` `s1244193888` — 0% uterus bleed!)*.
   - **Belly-Unlock Synergy**: Whenever X-Ray is enabled on `TN/BG`, strip `slim waist, -0.40::plump::` from Positive and `plump, curvy` from Negative so the abdomen has clean visual real estate for the cutaway window.
4. **Mode X-4 · Occlusion-Aware Mounting & Side-Profile Pelvic X-Ray (`爬身防遮挡与侧视骨盆剖面`)**:
   - **Front-Mounting Giant Bugs (`BG13` *Verified `s3189867186`*, `BG16`)**: Because a giant insect crawling across the torso can occlude a centered belly cutaway, **anchor the creature low between spread thighs (`mounting low between spread thighs in lower foreground`)** so the lower belly remains completely unobstructed for the womb/intestines cross-section!
   - **All-Fours Side-Profile Rear Entry (`TN03, BG05, BG14` *Verified `s1400135221`*)**: On `1216x832` `from side` (`View A`), inject **`side-profile abdominal x-ray cutaway`** so V5 draws a crisp lateral pelvic cutaway along the flank showing the tentacle/spider phallus penetrating the vagina/rectum and flooding the uterus/intestines! On `View B` (`832x1216` rear POV), use `cross-section inset` in the corner to avoid occluding the buttocks.
5. **Mode X-5 · Translucent-Skin & Non-Penetrative Foreplay Upgrade (`半透明直透覆写与前戏升级`)**:
   - **Translucent Egg-Belly (`TN12, BG06`)**: By default these use `1.55::translucent belly::` (no cutaway border) and lock `x-ray, cross-section` in UC. If the user **explicitly enables X-Ray**, strip `translucent belly` and replace with a sharp `1.55::x-ray::, 1.5::cross-section::, 1.5::uterus::` (or `intestines` on Femboy) cutaway showing the dense glowing eggs inside!
   - **Foreplay / Crawling Tease (`BG01, BG04, BG09`)**: Automatically upgrade the X-Ray window with active internal content (silk tendril / mini glowing jelly-larvae / suction-worm tip entering the uterus or intestines) so the cutaway never renders empty.
- **Universal X-Ray Hygiene UC (Always Append When X-Ray Active)**:
  ```text
  fetus, baby, embryo, umbilical cord, skeleton, bones, skull, ribcage, medical diagram, gore, blood, wound, rotting, corpse
  ```
  *(Plus `uterus, cervix, womb` on **Femboy** mode!)*

| Code | Subtype Name | Core Danbooru Action & Anatomy Delta Tags | View A (Standard) & View B (`胯部→头部 POV`) Camera Notes |
| :--- | :--- | :--- | :--- |
| `TN01` | Suspended M-Spread Coiled Tease (`悬空M字吊缚缠绕·前戏玩弄`) | `dark cavern, glowing bioluminescent mist, 1.55::tentacles::, 1.45::tentacle sex::, 1.35::slimy::, 1.3::slime (substance)::, suction cups, purple tentacles, 1.4::suspended::, lifted in air, feet off ground, wrists bound, bound wrists, bound ankles, 1.35::spread legs::, m legs, 1.3::tentacles on breasts::, nipple tweak, glistening skin, sweat, pussy juice, looking at viewer` | **View A**: `832x1216` frontal M-spread; **View B (`B-1`)**: `832x1216` between bound ankles looking up past glistening slit/shaft & coiled breasts to teary face |
| `TN02` | Suspended Deep Cervical + Womb X-Ray (`悬空M字深部贯通+子宫透视`) | `dark cavern, glowing bioluminescent mist, 1.6::tentacles::, 1.55::tentacle sex::, 1.45::vaginal::, 1.35::cervical penetration::, 1.45::x-ray::, 1.4::cross-section::, 1.45::uterus::, cervix, 1.5::cum in uterus::, 1.4::cum::, 1.4::cumdrip::, stomach bulge, 1.35::slimy::, suction cups, purple tentacles, 1.35::suspended::, lifted in air, wrists bound, 1.35::spread legs::, m legs, tentacles on breasts, glistening skin, sweat, looking at viewer` | **View A**: `832x1216` frontal + womb x-ray; **View B (`B-1`)**: `832x1216` foreground tentacle insertion + centered belly x-ray window + face at top |
| `TN03` | Side All-Fours Dual-End Spitroast (`侧视跪趴前后双端串烧同步`) | `dark cavern, glowing bioluminescent mist, 1.6::tentacles::, 1.55::tentacle sex::, 1.45::spitroast::, 1.45::all fours::, arched back, from side, 1.45::oral::, 1.4::fellatio::, tentacle in mouth, 1.45::vaginal::, 1.35::double penetration::, cum, cumdrip, saliva, 1.35::slimy::, suction cups, purple tentacles, tentacles on breasts, glistening skin, sweat` | **View A**: `1216x832` `from side` full spitroast; **View B (`B-3`)**: `832x1216` rear-underneath crotch POV looking past double penetration along arched back to oral tentacle in mouth |
| `TN04` | Tentacle Pit Oviposition + Egg X-Ray (`触手巢穴鼓腹产卵+荧光卵囊透视`) | `dark cavern, tentacle pit, glowing bioluminescent mist, 1.6::tentacles::, 1.55::tentacle sex::, 1.55::oviposition::, 1.45::eggs::, 1.5::stomach bulge::, cum inflation, round belly, 1.45::x-ray::, 1.4::cross-section::, 1.45::uterus::, 1.5::eggs in uterus::, reclining, spread legs, m legs, bound wrists, 1.35::slimy::, slime (substance), purple tentacles, glistening skin, sweat, looking at viewer` | **View A**: `832x1216` reclining nest; **View B (`B-1`)**: `832x1216` ovipositor tentacle huge in foreground + egg-filled womb/colon x-ray on bulging belly + dazed face at top |
| `TN05` | Coiled Tentacle Milking & Suction (`触手螺旋榨精 / 吸盘敏感带套弄`) | `dark cavern, glowing bioluminescent mist, cowboy shot, 1.6::tentacles::, 1.5::tentacle sex::, 1.35::slimy::, 1.3::slime (substance)::, suction cups, purple tentacles, 1.35::suspended::, bound wrists, spread legs, 1.35::tentacles on breasts::, nipple tweak, 1.4::milking::, 1.4::cum::, cum on stomach, 1.4::precum::, dripping, glistening skin, sweat, looking at viewer` | **View A**: `832x1216` cowboy shot; **View B (`B-1` · Verified `s1376873169`)**: `832x1216` coiled milking tentacle & lower penetration huge in foreground looking steeply up torso to face |
| `TN06` | Wall-Pinned Spread-Eagle & Clothes Tear (`暗窟贴壁十字磔缚·触手钻衣破衣`) | `dark cavern, wet stone wall, glowing bioluminescent mist, cowboy shot, 1.45::pinned against wall::, 1.4::spread eagle::, bound wrists, bound ankles, 1.45::torn clothes::, 1.4::clothes rip::, 1.4::tentacles under clothes::, 1.6::tentacles::, 1.5::tentacle sex::, 1.35::slimy::, suction cups, purple tentacles, tentacles on breasts, pussy, pussy juice, dripping, glistening skin, sweat, looking at viewer` | **View A**: `832x1216` frontal wall-pin; **View B (`B-1`)**: `832x1216` worm's-eye up wet stone wall from torn shorts/groin past ripped top to high-bound wrists & crying face |
| `TN07` | Tentacle Nest Elevated Mating Press (`触手肉床抱膝折腿压制贯通`) | `dark cavern, tentacle pit, glowing bioluminescent mist, 1.3::from above::, lying on back, 1.45::mating press::, 1.4::folded legs::, knees to chest, ankles bound by tentacles, 1.6::tentacles::, 1.55::tentacle sex::, 1.35::slimy::, suction cups, purple tentacles, 1.45::vaginal::, 1.4::cum::, 1.4::cum overflow::, glistening skin, sweat, looking at viewer` | **View A**: `832x1216` `from above` overhead mating press; **View B (`B-2`)**: `832x1216` low nest-level groin POV between folded knees looking past deep insertion to face (`upside-down` in UC) |
| `TN08` | Close-Up Tentacle Deepthroat & Throat Bulge (`近景触手深喉咽喉鼓包·黏液面缚`) | `dark cavern, glowing bioluminescent mist, 1.4::close-up::, 1.35::upper body::, head back, looking at viewer, ahegao, rolling eyes, heart-shaped pupils, tears, crying, heavy blush, drooling, 1.4::saliva::, saliva trail, 1.6::tentacles::, 1.5::tentacle sex::, 1.5::oral::, 1.5::deepthroat::, 1.45::irrumatio::, 1.5::tentacle in mouth::, 1.45::throat bulge::, 1.35::slimy::, suction cups, purple tentacles, tentacles around neck, bound arms behind back, cum on face` | **View A**: `832x1216` eye-level upper-body close-up; **View B (`B-5a/b`)**: low-angle sub-chest/groin POV looking steeply up past chest & prominent **throat bulge** to rolled-back eyes |
| `TN09` | Translucent Slime Cocoon Incubation (`半透明荧光黏液茧囊·卵鞘悬浮培养`) | `dark cavern, glowing bioluminescent mist, cowboy shot, completely nude, 1.55::trapped in slime::, 1.5::translucent slime cocoon::, 1.45::egg pod::, 1.4::glowing membrane::, 1.4::suspended::, floating, spread legs, m legs, 1.6::tentacles::, 1.5::tentacle sex::, 1.45::slimy::, 1.45::slime (substance)::, 1.4::glowing liquid::, purple tentacles, 1.45::vaginal::, 1.4::stomach bulge::, round belly, cum inflation, tentacles on breasts, looking at viewer` | **View A**: `832x1216` full pod view; **View B (`B-1`)**: `832x1216` looking up from beneath translucent glowing pod base past internal penetration & round belly to suspended face |
| `TN10` | Landscape All-Holes Overload + Belly X-Ray (`横图全端满载·悬空贯通鼓腹透视`) | `dark cavern, glowing bioluminescent mist, wide shot, 1.45::suspended::, horizontal reclining in air, spread legs, arched back, 1.6::tentacles::, 1.55::tentacle sex::, 1.45::oral::, 1.45::deepthroat::, tentacle in mouth, 1.45::vaginal::, 1.45::stomach bulge::, 1.45::x-ray::, 1.4::cross-section::, 1.45::uterus::, 1.5::cum in uterus::, 1.4::cum::, 1.35::slimy::, suction cups, purple tentacles, glistening skin` | **View A**: `1216x832` landscape side/3-4 full overload; **View B (`B-1`)**: `832x1216` vertical groin-to-head overload (foreground vaginal + futa/femboy milking + belly x-ray + oral tentacle at top!) |
| `TN11` | Living Tentacle Parasite Suit / Symbiote (`重度猎奇 · 生物活体触手寄生服同化`) | `dark cavern, glowing bioluminescent mist, cowboy shot, legs apart, arched back, 1.55::living clothes::, 1.5::symbiote::, 1.5::tentacle suit::, 1.45::translucent slime bodysuit::, 1.4::organic armor::, glossy purple-black living membrane, glowing veins, 1.6::tentacles::, 1.5::tentacle sex::, 1.45::slimy::, suction cups, purple tentacles, tentacles crawling under membrane, 1.35::nipple bulge::, 1.4::vaginal::, 1.4::cum::, dripping, glistening skin, looking at viewer` | **View A**: `832x1216` cowboy shot; **View B (`B-1`)**: `832x1216` worm's-eye from symbiote-wrapped thighs & groin tendrils looking up glossy membrane torso to face |
| `TN12` | Translucent Glowing Egg-Belly Host (`重度猎奇 · 异形半透明发光多卵鼓腹`) | `dark cavern, tentacle pit, glowing bioluminescent mist, cowboy shot, completely nude, 1.4::suspended::, spread legs, m legs, bound wrists, 1.6::tentacles::, 1.55::tentacle sex::, 1.55::oviposition::, 1.55::extreme stomach bulge::, 1.5::pregnant::, 1.55::translucent belly::, 1.5::glowing eggs inside belly::, 1.45::eggs::, 1.4::egg laying::, 1.4::nipple suction::, 1.4::suction cups::, 1.4::slimy::, purple tentacles, translucent jellyfish tentacles, glowing liquid, cumdrip, looking at viewer` | **View A**: `832x1216` frontal showcase; **View B (`B-1`)**: `832x1216` ovipositor & egg-laying orifice in foreground, monumental translucent glowing egg-belly towering mid-frame, face peeking above |

### Family 12: Fantasy Hive, Glowing Larvae & Doujin-Style Giant Arthropod Postures (`12. 异形虫巢·荧光幼虫与本子风节肢异虫爬身/白蛆涌出系 · BG01–BG20`)

Empirically calibrated on NovelAI V5 Full (`28 steps, Scale 6.8`, **20/20 visually verified** across two sub-series: `BG01–BG12` Fantasy Bioluminescent Hive & Jelly-Larvae + `BG13–BG20` Doujin-Style Giant Arthropod Clinging/Mounting, Facehugger & White Maggot Overflow), with full **Female / Femboy / Futanari (`女 / 伪娘 / 扶他无蛋·有蛋`)** 3-way routing:

#### Critical Three-Tier Insect Hygiene UC Rules (V5 Empirically Verified!)
1. **Tier A — Standard Fantasy Insect / Hive Hygiene UC** (for `BG01, BG02, BG03, BG05, BG06, BG09, BG10, BG11`):
   ```text
   realistic, photorealistic, 3d, horror, gore, grotesque, maggots, trypophobia, realistic insects, cockroach, fly, dirty, rotting, human hands, multiple boys, 2boys, extra hands, extra arms, extra legs
   ```
2. **Tier B — Segmented Glowing Jelly-Larvae Overflow UC** (CRITICAL for `BG04, BG07, BG08, BG12`):
   - **MUST UNBLOCK `maggots` from UC!** Blocking `maggots` suppresses segmented grub/larva geometry in V5 and collapses larvae into round eggs/bubbles!
   - Pair Positive **`1.6::worms::, 1.55::small worms::, 1.5::grubs::, 1.5::larvae::`** + T5 prose (`many small plump segmented translucent glowing pink-and-cyan/golden jelly larvae wriggling and overflowing`) with Larvae Hygiene UC:
     ```text
     realistic, photorealistic, 3d, horror, gore, blood, rotting, corpse, dirty, cockroach, fly, spider, legs on worms, spiky, round eggs, human hands, multiple boys, 2boys, extra hands, extra arms, extra legs
     ```
3. **Tier C — Doujin-Style Giant Arthropod Clinging/Mounting & White Maggots UC** (CRITICAL for `BG13–BG20`!):
   - **NEVER put bare `extra legs` in UC on multi-legged arthropods!** Bare `extra legs` erases 8-legged spider / 6-legged beetle-fly / multi-legged centipede & isopod legs! Always replace with **`extra human arms, extra human legs`**.
   - **Unblock real insect species tags** (`cockroach, fly, spider, realistic insects` removed from UC, and `maggots` unblocked for `BG19–BG20`), while strictly blocking photorealistic gore/3D so the heroine and chitin carapaces stay crisp 2D anime cel-shaded doujin quality:
     ```text
     photorealistic, realistic, 3d, gore, blood, wound, rotting, corpse, painterly, monochrome, comic, text, watermark, blurry, lowres, human hands, human male, 1boy, multiple boys, 2boys, extra human arms, extra human legs
     ```
     *(On **Femboy** mode, remove `1boy` from UC and inject the Femboy Dual-Guard UC `1girl, female, breasts, pussy, vaginal, uterus, cervix, futanari, muscular male, bara, huge penis`; on **X-Ray** `BG20`, append `fetus, baby, embryo, umbilical cord, skeleton, bones, skull, ribcage`.)*

#### Unified 3-Way Gender Routing Rules Across ALL `BG01–BG20` (`全 20 个虫类场景通用三态差分总则`)
Every single scene in **`BG01–BG20`** supports all 3 gender states (`normal` Female / `femboy` / `futa_no_balls` & `futa_with_balls`):
1. **Female (`normal`)**:
   - Style: `🌷 安定萌化mikozin`; Header: `1girl, solo, small breasts` (`bare breasts, 1.3::nipples::` when topless); Channels: `1.45::vaginal::` / `1.45::after vaginal::` / `1.45::uterus::, 1.5::eggs in uterus::`; UC blocks `1boy, male, penis, phallus, futanari, testicles, flat chest`.
2. **Femboy (`femboy`)**:
   - Style: `🌷 安定萌化mikozin`; Header: `1.45::1boy::, solo, 1.55::otoko no ko::, 1.45::crossdressing::, 1.35::genderbend::, 1.25::short male::, 1.55::flat chest::, 1.4::flat male chest::, tiny pink nipples, hairless torso` (replace `bare breasts` → `bare chest`);
   - Channel & X-Ray Swap: Replace `vaginal` → `1.5::anal::, 1.45::anal penetration::, 1.45::male penetrated::`; replace `after vaginal / gaping pussy` → `1.45::after anal::, gaping ass`; replace `uterus, eggs in uterus` → `1.45::intestines::, 1.5::eggs::, 1.5::oviposition::` (locking `uterus, cervix` in UC);
   - Lower Male Anatomy: Add `1.4::small penis::, 1.3::small testicles::, testicles, erection, 1.4::precum::` (or active worm/bug milking `1.45::milking::, 1.4::cum::` on frontal scenes; omit lower groin tags only on `BG08` upper-body close-up);
   - UC: Remove `1boy, male, penis, phallus, testicles` and inject Femboy Dual-Guard + Anti-Oversize UC (`1girl, female, girl, hetero, breasts, pussy, vulva, labia, vaginal, uterus, cervix, futanari, muscular male, bara, huge penis, large penis, oversized penis, huge testicles`).
3. **Futanari (`futa_no_balls` / `futa_with_balls`)**:
   - Style: **`⚡🌷 安定萌化futa专用`** (`+ 0.28::artist:pija (pianiishimo)::` tail-blend) + strip standalone vulva morphology (`labia, 0.65::spread pussy::`);
   - Header: `1girl, solo, 1.55::futanari::, 1.45::futa without balls::` (or `1.45::futa with balls::, 1.3::small testicles::, testicles`) + keep `small breasts / bare breasts` and female `vaginal / uterus` channels intact!
   - Dual-Channel Layering: Retain lower `vaginal / oviposition / uterus / larvae or maggot overflow` while adding `1.35::small penis::, erection, 1.4::precum::` (plus coiled worm/silk/tendril/bug milking `1.45::milking::, 1.4::cum::` on frontal scenes; omit groin shaft tags only on `BG08` upper-body close-up);
   - UC: Unblock `penis, phallus` (and `testicles` on `futa_with_balls`), while locking `1boy, male, otoko no ko, crossdressing, yaoi, flat chest, male chest, huge penis, large penis, oversized penis, hyper penis, monster penis, giant penis` (and `testicles, balls, scrotum` on `futa_no_balls`).

#### Sub-Series 12A: Fantasy Bioluminescent Hive, Spiderweb & Glowing Jelly-Larvae (`BG01–BG12`)

| Code | Subtype Name | Core Danbooru Action, Creature & Environment Tags | Dual-POV (`View A / View B 胯→头`) & 3-Way Gender Routing (`女 / 伪娘 / 扶他`) |
| :--- | :--- | :--- | :--- |
| `BG01` | Glowing Spiderweb Bondage & Silk Tease (`发光蛛丝网缚·悬空黏丝束缚`) | `dark cavern, glowing bioluminescent spiderweb, 1.5::spiderweb::, 1.45::trapped in web::, 1.4::silk bondage::, sticky spider silk, giant fantasy spider silhouette in background, cowboy shot, 1.4::suspended::, spread eagle, bound wrists, glistening skin, looking at viewer` | **View A**: `832x1216` cowboy shot · **View B (`B-1`)**: `832x1216` worm's-eye from silk-wrapped groin looking up silk-crossed torso to face & spider silhouette above; **Female**: silk on breasts & slit; **Femboy**: `flat chest` + silk wrapped around small shaft; **Futa**: silk teasing breasts + shaft + pussy |
| `BG02` | Giant Translucent Bioluminescent Worm (`半透明荧光巨型软虫贯通与套弄`) | `dark cavern, glowing bioluminescent mist, cowboy shot, 1.4::suspended::, spread legs, m legs, bound wrists, 1.55::giant worm::, 1.5::glowing translucent worm::, 1.45::slime worm::, smooth segmented translucent body, cyan-purple bioluminescence, 1.4::slimy::, 1.45::vaginal::, 1.4::cum::, glistening skin` | **View A**: `832x1216` cowboy shot · **View B (`B-1`)**: `832x1216` giant glowing worm entering crotch huge in foreground looking up torso to face; **Female**: `vaginal` + breast rub; **Femboy**: `anal` + smaller worm milking small shaft (`flat chest`); **Futa**: giant worm in pussy + smaller worm milking shaft |
| `BG03` | Golden Honeycomb Hive & Amber Oviposition (`黄金蜂巢蜜汁产卵床·琥珀卵剖面`) | `1.55::honeycomb::, 1.5::insect hive::, glowing golden-amber hexagonal hive walls, 1.45::glowing honey slime::, sticky golden nectar, cowboy shot, reclining, spread legs, m legs, bound wrists, 1.55::oviposition::, 1.5::stomach bulge::, round belly, 1.5::translucent golden eggs::, 1.45::x-ray::, 1.4::cross-section::, 1.45::uterus::, 1.5::eggs in uterus::, ovipositor` | **View A**: `832x1216` reclining hive · **View B (`B-1`)**: `832x1216` amber ovipositor in foreground + golden-egg belly x-ray mid-frame + face against honeycomb at top; **Female**: `uterus` eggs; **Femboy**: `flat chest` + `anal` + `intestines` eggs + small shaft; **Futa**: `uterus` x-ray + erect small shaft |
| `BG04` | Bioluminescent Jelly-Slugs Crawling Tease (`重度猎奇 · 荧光果冻幼体体表爬行`) | `dark cavern, glowing bioluminescent mist, cowboy shot, reclining, spread legs, bound wrists, 1.55::glowing translucent slugs::, 1.5::pastel bioluminescent larvae::, smooth cute jelly-like glowing mini-slugs crawling on skin, glowing slime trails, nipple tweak, pussy juice, dripping` | **View A**: `832x1216` reclining · **View B (`B-1`)**: `832x1216` glowing mini-slugs on groin/shaft in close foreground trailing up stomach & chest to face; **Female**: breasts & vulva; **Femboy**: `flat chest` & small shaft; **Futa**: breasts + compact shaft & vulva |
| `BG05` | Iridescent Chitinous Insectoid Rear Press (`重度猎奇 · 横图光泽甲壳巨虫后入压制`) | `dark glowing insect hive, wide shot, from side, 1.45::all fours::, arched back, raised hips, looking back at viewer, 1.55::insectoid monster::, 1.5::glossy iridescent chitin::, sleek purple-emerald carapace, glowing compound eyes, mantis-like chitinous forearms holding waist, 1.5::ovipositor::, 1.45::vaginal::, cum overflow, slimy` | **View A**: `1216x832` `from side` · **View B (`B-3`)**: `832x1216` rear-underneath crotch POV looking past ovipositor insertion along arched back to iridescent monster & turned head; **Female**: `vaginal`; **Femboy**: `flat chest` + `anal` + hanging shaft; **Futa**: `vaginal` + hanging futa shaft |
| `BG06` | Queen's Amber-Silk Brood Cocoon & Egg Belly (`重度猎奇 · 虫后母巢琥珀蛛丝透明金卵腹`) | `glowing golden-violet insect queen chamber, cowboy shot, 1.55::silk cocoon::, 1.5::translucent amber pod::, sticky glowing silk threads, 1.4::suspended::, spread legs, m legs, 1.45::feeding::, glowing nectar tendril in mouth, golden nectar dripping, 1.55::oviposition::, 1.55::extreme stomach bulge::, 1.55::translucent belly::, 1.5::glowing golden eggs inside belly::, 1.45::eggs::` | **View A**: `832x1216` suspended pod · **View B (`B-1`)**: `832x1216` looking up from beneath silk pod past ovipositor & glowing translucent golden-egg belly to nectar-fed mouth; **Female**: `vaginal`; **Femboy**: `flat chest` + `anal` + small shaft; **Futa**: breasts + compact shaft below egg belly |
| `BG07` | Full-Belly Hatching & Larvae Overflow (`重度猎奇 · 下身荧光果冻幼虫大量溢出`) | `dark glowing insect hive, cowboy shot, reclining, 1.45::spread legs::, m legs, bound wrists, 1.45::stomach bulge::, round belly, 1.45::after vaginal::, 1.6::worms::, 1.55::small worms::, 1.5::grubs::, 1.5::larvae::, many small plump segmented translucent glowing pink-and-cyan jelly worms and larvae wriggling and overflowing out from pussy with thick white slime, 1.45::cum overflow::, 1.45::slimy::` | **View A**: `832x1216` reclining · **View B (`B-1` · Verified `s2475783050`)**: `832x1216` glowing pink-cyan jelly larvae gushing in huge foreground looking up round belly & chest to face; **Female**: pussy; **Femboy**: `flat chest` + `after anal` + small shaft; **Futa**: pussy overflow + erect shaft above |
| `BG08` | Close-Up Oral Larvae & Honey-Slime Overflow (`重度猎奇 · 近景口部荧光幼虫与蜜涎满溢`) | `dark glowing hive, 1.4::close-up::, 1.35::upper body::, head tilted back, 1.45::open mouth::, tongue out, 1.55::oral::, 1.6::worms::, 1.55::small worms::, 1.5::grubs::, 1.5::larvae::, worms in mouth, many small plump segmented translucent glowing golden-pink jelly larvae wriggling on tongue and overflowing out of open mouth with thick glowing honey-slime, 1.45::saliva::, drooling, bound arms` | **View A**: `832x1216` eye-level oral close-up · **View B (`B-5a/b`)**: `832x1216` sub-chest/groin low-angle looking steeply up honey-dripping chest into larvae-heaped open mouth; **Female / Futa**: `bare breasts`; **Femboy**: `1.55::flat chest::, tiny pink nipples` |
| `BG09` | Glowing Leech-Slug Suction & Milking (`重度猎奇 · 荧光吸盘软虫吮乳与套筒榨取`) | `dark cavern, glowing cyan-violet mist, cowboy shot, 1.4::suspended::, bound wrists, spread legs, arched back, 1.55::glowing leech::, 1.5::translucent suction-worm::, plump smooth glowing violet-cyan jelly leech-worms with round glowing suction mouths, 1.5::nipple suction::, leech sucking nipples, 1.45::cum::, slimy, glistening skin` | **View A**: `832x1216` cowboy shot · **View B (`B-1`)**: `832x1216` groin suction-worm milking shaft/vulva huge in foreground looking up to twin nipple-leech worms & face; **Female**: clitoris + nipples; **Femboy**: `flat chest` + shaft milking; **Futa**: breasts + shaft milking + pussy slime |
| `BG10` | Carnivorous Flower-Pod & Pollen Vine-Worms (`奇幻食人花虫巢·催情金粉与花蕊软虫`) | `1.55::giant glowing flower::, carnivorous fantasy flower pod, glowing magenta petals, 1.5::glowing golden pollen::, 1.45::aphrodisiac mist::, pink spore cloud, cowboy shot, reclining inside giant flower blossom, spread legs, bound by glowing green vine-worms, 1.5::plant tentacles::, glowing stamen worms, 1.45::vaginal::, nectar dripping, pussy juice` | **View A**: `832x1216` blossom view · **View B (`B-1`)**: `832x1216` low-angle from golden-pollen groin stamen insertion looking up torso framed by magenta petals to face; **Female**: `vaginal`; **Femboy**: `flat chest` + `anal` + shaft; **Futa**: stamen milking shaft + `vaginal` |
| `BG11` | Living Iridescent Chitin Exoskeleton Symbiote (`重度猎奇 · 活体虹彩甲壳外骨骼虫娘同化`) | `dark glowing hive, cowboy shot, legs apart, arched back, 1.55::living armor::, 1.5::iridescent chitin bodysuit::, 1.45::insect girl::, glowing antennae on head, translucent glowing insect wings, sleek purple-emerald living carapace armor creeping up thighs and arms, living insect tendrils, 1.4::vaginal::, glowing slime, glistening skin` | **View A**: `832x1216` cowboy shot · **View B (`B-1`)**: `832x1216` worm's-eye from chitin-plated thighs & bio-tendril groin looking up past chest & glowing wings to antennae-crowned head; **Female**: `vaginal`; **Femboy**: `flat chest` + shaft + `anal`; **Futa**: breasts + shaft + `vaginal` |
| `BG12` | Landscape Brood-Pit Overload + Larvae X-Ray Overflow (`终极猎奇 · 横图虫巢剖面幼虫满载与双端溢出`) | `dark glowing insect brood-pit, wide shot, 1.45::suspended::, horizontal reclining in air, spread legs, arched back, 1.6::worms::, 1.55::small worms::, 1.5::grubs::, 1.5::larvae::, 1.45::oral::, larvae in mouth, 1.5::stomach bulge::, 1.5::x-ray::, 1.45::cross-section::, 1.45::uterus::, centered womb cross-section packed with wriggling small segmented glowing translucent larvae, dozens of small plump segmented glowing pink-cyan larvae overflowing and spilling out from pussy in thick slime` | **View A**: `1216x832` landscape · **View B (`B-1`)**: `832x1216` vertical groin-to-head overload (foreground larvae gush + centered belly larvae x-ray + oral larvae at top!); **Female**: `uterus`; **Femboy**: `flat chest` + `intestines` + anal; **Futa**: `uterus` + coiled worm on shaft |

#### Sub-Series 12B: Doujin-Style Giant Arthropod Clinging/Mounting, Facehugger & White Maggot Overflow (`BG13–BG20` · 本子风节肢异虫爬身前入/后入/抱脸虫/白蛆涌出系)

- **Environment Policy**: Uses **normal indoor / bedroom environments** (`indoors, bedroom, messy white bedsheet, wooden floor, beige rug, against wall`) rather than forcing cavern backgrounds, matching classic doujin aesthetics where giant arthropods invade everyday rooms and cling directly onto the body.
- **Doujin Arthropod Anatomy Key**: Combine authentic jointed arthropod carapace tags (`glossy dark chitin carapace, spiny jointed insect legs clinging tightly to waist/thighs, antennae, compound eyes, veined wings`) with explicit doujin reproductive organ descriptors (`fleshy insect phallus` / `thick fleshy spider phallus` / `fleshy ovipositor`) + **Tier C UC** (`extra human legs` instead of `extra legs`).

| Code | Subtype Name | Core Danbooru Action, Arthropod & Indoor Tags | Dual-POV (`View A / View B 胯→头`) & 3-Way Gender Routing (`女 / 伪娘 / 扶他`) |
| :--- | :--- | :--- | :--- |
| `BG13` | Giant Cockroach/Beetle Bed Missionary (`卧室床铺巨型蜚蠊/甲虫爬身仰卧前入`) | `indoors, bedroom, messy white bedsheet, pillow, 1.3::from above::, lying on back, spread legs, knees bent, 1.6::giant insect::, 1.5::giant cockroach::, 1.45::giant beetle::, glossy dark reddish-brown chitin carapace, long antennae, spiny jointed insect legs clinging tightly to waist and inner thighs, mounting on top between legs, 1.45::vaginal::, insertion, fleshy insect phallus, 1.4::cum::, cum overflow` | **View A**: `832x1216` `from above` · **View B (`B-2` · Verified `s3388984331`)**: `832x1216` low between spread knees looking past dark beetle mounting low in crotch up lifted top to crying face; **Female**: `vaginal`; **Femboy**: `flat chest` + `anal` + shaft; **Futa**: `vaginal` beneath shaft |
| `BG14` | Giant Spider Back-Clinging Rear Entry (`室内地毯巨型蜘蛛趴背八足锁身跪趴后入`) | `indoors, wooden floor, beige rug, wide shot, from side, 1.45::all fours::, arched back, raised hips, looking back at viewer, 1.6::giant spider::, 1.5::arachnid::, dark chitinous spider body clinging onto back, 8 long jointed spider legs wrapping around shoulders, ribs, and thighs, 1.45::from behind::, 1.45::vaginal::, thick fleshy spider phallus penetrating from behind, 1.4::cum overflow::` | **View A**: `1216x832` `from side` · **View B (`B-3` · Verified `s771767528`)**: `832x1216` rear-underneath crotch POV looking past thick spider phallus & hanging shaft up arched back to spider & turned face; **Female**: `vaginal`; **Femboy**: `flat chest` + `anal` + shaft; **Futa**: `vaginal` + hanging futa shaft |
| `BG15` | Facehugger Oral Deepthroat + Groin Bug Milking (`抱脸虫覆面锁颈深喉鼓包+下身虫吸榨精`) | `indoors, bedroom, messy bed, cowboy shot, lying on back, spread legs, 1.6::facehugger::, 1.55::parasitic arthropod::, pale fleshy-chitinous spider-like creature with eight jointed finger-legs clamped tightly around head covering mouth, curled segmented tail wrapped around neck, 1.5::oral::, 1.5::deepthroat::, 1.45::throat bulge::, muffled, tears streaming from eyes, second smaller chitinous bug latched onto groin` | **View A**: `832x1216` overhead bed · **View B (`B-4` · Verified `s3069112347`)**: `832x1216` (`+ 1.6::2 creatures::, 1.55::groin parasite::`) groin bug huge in foreground looking up torso to facehugger-clamped head & throat bulge; **Female**: vulva bug; **Femboy**: `flat chest` + shaft milking; **Futa**: breasts + shaft milking |
| `BG16` | Winged Giant Mosquito/Fly Standing Front Cling (`振翅巨型蚊蝇抱身前入贯通+口针吸乳`) | `indoors, bedroom, against wall, cowboy shot, legs apart, arched back, 1.6::giant insect::, 1.5::giant mosquito::, 1.45::giant fly::, translucent veined insect wings, compound eyes, six slender jointed insect legs clinging tightly onto front torso and hips, long flexible proboscis sucking nipple, 1.45::vaginal::, thick fleshy insect penis penetrating from front, 1.4::cum overflow::` | **View A**: `832x1216` frontal wall-cling · **View B (`B-2`)**: `832x1216` steep worm's-eye from wall floor between thighs looking past insect phallus & veined wings up to proboscis on nipple & dazed face; **Female**: `vaginal`; **Femboy**: `flat chest` + `anal`; **Futa**: `vaginal` + shaft & small balls |
| `BG17` | Giant Isopod Crotch-Hugger Living Belt Oviposition (`巨型具足虫/腹吸虫活体贞操带扣胯产卵鼓腹`) | `indoors, bedroom floor, cowboy shot, sitting with legs spread wide, leaning back on hands, 1.6::giant pillbug::, 1.55::giant isopod::, segmented glossy grey-brown chitinous carapace creature clamped tightly onto crotch like a living chastity belt, short jointed arthropod legs gripping hips and upper thighs, 1.5::oviposition::, thick fleshy ovipositor buried deep inside, 1.5::stomach bulge::, round distended belly, insect eggs, cum overflow` | **View A**: `832x1216` sitting frontal · **View B (`B-1`)**: `832x1216` floor-level between spread thighs with segmented isopod carapace & egg-leaking tail huge in foreground looking up bulging belly & open shirt to face; **Female**: pussy; **Femboy**: `flat chest` + `anal` + shaft; **Futa**: pussy + shaft poking above belt |
| `BG18` | Indoor Giant Centipede Spiral Coiling & Entry (`卧室床铺红黑巨型多足蜈蚣盘身缠绕贯通`) | `indoors, messy bedsheet, cowboy shot, kneeling on bed, arched back, spread legs, 1.6::giant centipede::, glossy dark-crimson and black segmented chitinous carapace, dozens of sharp orange-red jointed centipede legs gripping thighs, waist, and torso as it coils capably around body, 1.45::vaginal:: (or 1.5::anal::), fleshy centipede phallus penetrating, 1.4::cum::` | **View A**: `832x1216` kneeling bed · **View B (`B-1`)**: `832x1216` bed-surface POV between kneeling thighs looking past centipede tail insertion up crimson-black segmented coils spiraling torso to face; **Female**: `vaginal`; **Femboy**: `flat chest` + `anal` + shaft; **Futa**: `vaginal` + shaft |
| `BG19` | Post-Oviposition Plump White Maggots Crawling Out (`重度猎奇 · 虫奸事后鼓腹·成群白嫩肥蛆涌出爬腿`) | `indoors, messy bedsheet, cowboy shot, lying on back, 1.45::spread legs::, m legs, 1.45::stomach bulge::, round belly, 1.5::oviposition::, 1.45::after vaginal::, 1.6::maggots::, 1.55::white grubs::, 1.5::small white worms::, dozens of plump glossy white maggots and grubs overflowing out from gaping pussy and crawling across inner thighs and belly in thick white slime, dark chitinous beetle crawling beside thigh, 1.45::cum overflow::` | **View A**: `832x1216` supine bed · **View B (`B-1` · Verified `s2020219910`)**: `832x1216` (`+ 1.55::maggots in pussy::`) gaping orifice packed with & gushing white maggots huge in foreground looking up round belly & breasts to face; **Female**: pussy; **Femboy**: `flat chest` + `after anal` + shaft; **Futa**: pussy + erect shaft above |
| `BG20` | Landscape Multi-Bug Mounting + Womb Egg/Maggot X-Ray (`终极猎奇 · 横图大虫交尾+剖面虫卵白蛆同框涌出`) | `indoors, messy bedroom bed, wide shot, from side, reclining on back with legs spread wide, 1.6::giant insect::, glossy dark chitinous beetle-fly mounting between legs, jointed insect legs gripping thighs, smaller dark bugs crawling on stomach, 1.5::stomach bulge::, 1.5::x-ray::, 1.45::cross-section::, 1.45::uterus::, centered womb cross-section packed with insect eggs and wriggling plump white maggots, 1.6::maggots::, 1.55::white grubs::, plump white maggots and thick cum overflowing` | **View A**: `1216x832` landscape · **View B (`B-1` · Verified `s3666267682`)**: `832x1216` vertical groin-to-head POV (foreground white maggots gushing + erect futa/femboy shaft + centered belly egg/maggot x-ray + face at top!); **Female**: `uterus`; **Femboy**: `flat chest` + `intestines`; **Futa**: `uterus` + futa shaft |

---

## 4. Studio 2.0 Three-Mode Action Matrix (`web/src/data/engineConstants.ts` & `storyEngine.ts`)

All posture templates live strictly in TypeScript (`ALL_POSITIONS_TEMPLATES` & `MULTI_ANGLE_TEMPLATES` in `web/src/data/engineConstants.ts`; legacy Python `custom_positions.json` and `F00+S00~S11` Storyline are removed):
1. **`positions` (`P01`–`P51`)**: 51 structured postures across 9 categories, combinable with 3D Camera Radar (`camera_azimuth` / `camera_elevation` / `camera_shot` / `camera_gaze`, which automatically strips conflicting `ANGLE_TAGS_TO_STRIP`, `SHOT_TAGS_TO_STRIP`, and `GAZE_TAGS_TO_STRIP` before injecting the custom camera view).
2. **`multi_angle` (`MA0`–`MA11`)**: `MA0` peaceful sleeping + 11 daily/showcase angles (`MA1`..`MA11`), with optional `enable_multi_angle_nsfw` lower-anatomy showcase toggle:
   - **`MA11` · Ultra Close-Up Wide-Angle V-Legs Under-Crotch Peace-Sign Showcase (`V字高抬腿·超近距广角胯下仰视比耶自展 · 下身占满70%屏`)** *(3/3 Verified Live on V5 Full `832x1216` — Female `s672256152` / Femboy `s4003239764` / Futa `s1618377547`)*:
     - **Core Camera & Storyboard Tags**: `1.65::close-up::, 1.7::from below::, 1.65::worm's-eye view::, 1.65::extreme foreshortening::, 1.5::wide-angle lens::, 1.4::fisheye::, 1.55::pov::, 1.3::dutch angle::, 1.6::ass focus::, 1.6::groin focus::, 1.45::anus::, groin and buttocks filling lower two-thirds of frame, head small at top, lying on back, 1.55::legs up::, 1.5::spread legs::, 1.5::v-shaped legs::, 1.45::looking down at viewer::, 1.4::one eye closed::, wink, 1.35::grin::, smug, heavy blush, sweat, 1.45::v::, 1.4::peace sign::, hand next to cheek`
     - **Mandatory Distance & Anti-Inversion UC**: `full body, wide shot, distant, upside-down, inverted, head at bottom, legs at top, panties, underwear`
     - **3-Way Gender Routing**:
       - **Female (`normal`)**: Add `1.65::pussy focus::, pussy, pussy juice, bare breasts`; massive glossy buttocks, anus & vertical slit dominate the lower 70% of the screen.
       - **Femboy (`femboy`)**: Swap `pussy focus, pussy` → `1.4::small penis::, 1.3::small testicles::, testicles, erection, 1.35::precum::, 1.55::flat chest::, 1.4::flat male chest::, tiny pink nipples`; huge foreground buttocks, anus & compact shaft dominate the lower 70% with 100% flat boyish chest above.
       - **Futanari (`futa_no_balls` / `futa_with_balls`)**: Pair with `⚡🌷 安定萌化futa专用` (`+ 0.28::artist:pija (pianiishimo)::` tail-blend), strip standalone vulva morphology (`labia, 0.65::spread pussy::`), and layer `1.4::small penis::, erection, 1.35::precum::, pussy` (plus `1.3::small testicles::, testicles` on with-balls) in clean vertical alignment above the slit & anus.
3. **`free` (`FREE` Custom Action Mode) & Multi-Person Override**:
   - Compiles user-written `free_action_tags` + `free_action_prose` (and optional `free_action_nsfw` full lower-anatomy + `fluid_scale` pipeline) on top of the active character, outfit, lighting, and style presets.
   - **Important for `MP01`–`MP14` Multi-Person Scenes**: Because single-character `FREE` mode prepends `1girl, solo` from the active preset, when composing `MMF` / `FFM` / `2girls` / `Group` scenes on the live webpage, write a full `[Base Prompt]` + `[Character 1 (B3)]` + `[Character 2 (D3)]` multi-box prompt (or replace `1girl, solo` with the exact multi-person headcount header) in the bottom Prompt Drawer / via `nai_set_manual_prompt`.
