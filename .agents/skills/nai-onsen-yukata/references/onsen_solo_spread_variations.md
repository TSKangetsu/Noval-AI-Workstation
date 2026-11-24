# Solo Onsen & Yukata Spreading CG Variation Guide (`ONS` 单人差分评估与实施规范)

## 1. Eligibility Evaluation Across All 23 Solo Scenes (`ONS11–55`)

Before adding a finger-spreading CG variation to a solo scene, evaluate three physical invariants:
1. **Optical Visibility**: Is the lower-body focus unobstructed by ankle/mid-thigh garments or standing profile angles?
2. **Two-Hand Conservation (`Hand Budget <= 2`)**: Every character has exactly two hands. If both hands hold props, tuck any lifted garment hem into the `obi` sash or rest one secondary prop on a nearby surface rather than asking for three simultaneous hand actions.
3. **Core Action Preservation**: Do not overwrite a scene whose primary narrative action already occupies the hand at the lower body (e.g., active tissue wiping) or mid-stride walking.

### A. Ineligible — Preserve Base Action (`3 / 23` Scenes)
- **`ONS11` (Changing-Room Obi Tie)**: Standing rear-three-quarter view tying front sash with intact hip-covering short bath yukata; lower focus is occluded and both hands are tying the sash bow.
- **`ONS14` (Lantern Stone Steps Geta Stroll)**: Mid-stride walking up stone stairs carrying bamboo basket and paper fan; walking gait cannot physically combine with finger-spreading.
- **`ONS15` (Tatami Zabuton Tissue Wipe)**: Right hand already performs active crumpled-tissue wiping between wide-spread thighs while left hand holds wooden comb; preserve the tissue-wipe mechanic.

### B. Eligible — Three Hand-Allocation Archetypes (`20 / 23` Scenes, Including All `ONS46–ONS55`)

| Archetype | Applicable Solo Scenes | Hand-Reassignment Rule |
| :--- | :--- | :--- |
| **1. One-Hand Prop + Free-Hand Spread** (`15` scenes) | `ONS12, ONS19, ONS26, ONS27, ONS36, ONS37, ONS46, ONS47, ONS49, ONS50, ONS51, ONS52, ONS54, ONS55` | Keep Hand 1 holding the signature prop (milk bottle, sake carafe, red quilt corner, sakazuki saucer, green chilled bottle, gourd flask, wooden masu); tuck any hand-held skirt hem into the `obi` sash (`ONS19, 47, 55`) and assign Hand 2 to one-handed finger spreading. |
| **2. Prop-Free Symmetrical Two-Hand Spread** (`3` scenes) | `ONS13, ONS18, ONS20, ONS32` (`4` scenes total; `ONS32` bites wooden key in mouth) | No handheld prop occupies the hands (`ONS32` holds wooden room-key tag `1.6::in mouth::` with yukata hem tucked into `obi`; `ONS18` leans back against cedar post instead of palms), freeing both hands for symmetrical spreading. |
| **3. Rear Lookback Reach-Back Spread** (`2` scenes) | `ONS48, ONS53` | Keep rear three-quarter `1.55::looking back::` camera; Hand 1 holds plum-wine glass (`ONS48`) or porcelain cup (`ONS53`) while Hand 2 reaches back behind the hip paired with `1.55::pussy from behind::` so V5 never twists the pelvis 180° forward. |

---

## 2. Four-Gender Tag Routing & Anti-Censor Guards

- **Female (`normal`)**:
  - Frontal / Overhead: `1.4::labia::, 1.3::spread pussy::, 1.6::spreading own pussy::, fingers`
  - Rear Lookback (`ONS48, ONS53`): `1.55::pussy from behind::, 1.4::labia::, 1.3::spread pussy::, 1.6::spreading own pussy::, fingers`
- **Futanari (`futa_no_balls` / `futa_with_balls`)**:
  - Keep small erect shaft untouched above (`1.45::erect penis::`) while fingers spread the labia below (`1.4::labia::, 1.3::spread pussy::, 1.55::spreading own pussy::, fingers`); add `holding own penis, grabbing penis` to Negative UC so the hand spreads rather thanstroking.
- **Crossdressing Femboy (`femboy`)**:
  - Never emit female anatomical tags; map to `1.45::small penis::, 1.5::spread anus::, 1.55::spreading own ass::, fingers` and strip bare `gaping` from Negative UC so rear/perineum spreading is not suppressed.
- **Universal Variation Negative UC Guards**:
  - Append `covering crotch, covering pussy, hand over crotch, holding own penis, grabbing penis, extra arms, 3 arms` so V5 never turns a hand-at-groin tag into a modesty censor gesture or spawns a third arm.

---

## 3. Dual Implementation Modes & The Hand-Travel Distance Law (`手部像素位移半径铁律`)

Empirical V5 Full testing across `ONS18–ONS55` revealed that choosing between **Frame-Locked `Img2Img`** and **Standalone Surgical `Txt2Img`** depends strictly on how far the reassigned hand must travel from its original position in the base CG:

### A. Short-Travel Hand Reassignment (`位移 < 18% 画幅` -> Use `V5 Img2Img`, `Strength = 0.60 ~ 0.64, Noise = 0.05`)
- **Best-Fit Scenes (`ONS36, ONS46, ONS48, ONS50, ONS52`)**: In the base render, the reassigned hand already rests near the hip, thigh hem, waist `obi`, or tub rim.
- **Result**: Feeding the base PNG into V5 Full `action: "img2img"` at **`strength: 0.62, noise: 0.05, steps: 28, CFG: 6.8`** locks ~99% of shoji lattice lines, lanterns, spilled sake vessels, facial expression, and yukata folds while smoothly moving the nearby hand into a connected 5-finger spreading pose.

### B. Long-Travel Hand Reassignment (`位移 > 20% 画幅` -> Use Surgical `Txt2Img` or Corridor Mask `Inpaint`)
- **Applicable Scenes (`ONS18, ONS20, ONS32, ONS37, ONS47, ONS49, ONS51, ONS53, ONS54, ONS55`)**: In the base render, the reassigned arm is locked far from the pelvis (e.g., high on a doorway frame `ONS47`, holding a cup near the face `ONS49`, outstretched toward the camera `ONS54`, or resting out by the ankle `ONS37`).
- **Three Empirical Whole-Frame `Img2Img (0.62)` Pitfalls to Avoid on Long-Travel Scenes**:
  1. **Frozen Original Arm (`原手臂冻结`)**: At `strength <= 0.64`, `Img2Img` refuses to erase an outstretched arm on a doorframe or chair armrest, leaving no hand at the pelvis (`ONS47, 49, 51, 54, 55`).
  2. **Detached Phantom Fingers (`无臂幽灵手指`, observed on `ONS37`)**: When both base arms are locked far away, forcing `1.6::spreading own pussy::, fingers` in whole-frame `Img2Img` can spawn floating fingertips at the groin detached from either arm!
  3. **Mirror-Reflection Desync (`镜面反射单边生效`, observed on `ONS53`)**: On standing-mirror compositions, `Img2Img (0.62)` may draw the spreading hand inside the smaller mirror reflection while keeping the foreground arm frozen on the cushion.
- **Clean Resolution**: For any scene with `> 20%` arm travel (or mirror reflections), either (a) generate via **Standalone Surgical `Txt2Img`** (building a 100% connected arm skeleton from scratch) or (b) apply a **Regional `Inpaint` mask** covering both the old arm and the arm-to-pelvis corridor so old arm pixels are erased cleanly.
