---
name: nai-photo-substitute
description: Empirically calibrated NovelAI V4.5 / V5 Substitute Photo-Over-Face Missionary & Post-Coital Belly-Press Play (替身盖脸照玩法 / 身代わり写真乗せ正常位・事後腹部圧迫) prompt engineering guide. Covers placing a square white-bordered smiling portrait photograph of a second character flat over the supine character's face without spawning two bodies or bleeding hair colors, both T5 spatial containment prose and Multi-Box [C3 Body + C2 Photo] coordinate anchoring, continuous bottom-border POV forearm belly-press cum-squeeze calibration, and 4 live-verified 1664x2432 upscaled stages (PS01-PS04).
---

# NovelAI V4.5 / V5 Substitute Photo-Over-Face & Post-Coital Belly-Press (`PS01–PS04` · 替身盖脸照玩法) Skill

This skill documents the empirically verified prompt architecture on NovelAI V5 Full (`nai-diffusion-5-full`, `28 steps, CFG 6.6`) for **Substitute Photo-Over-Face Play (`替身盖脸照` / `身代わり写真乗せプレイ`)** — placing a square white-bordered printed portrait photograph of a cheerful second character flat over the supine character's upper face during 1st-person POV missionary and post-coital belly-press cum squeezing.

See also [photo_substitute_catalog.md](references/photo_substitute_catalog.md) for the 4-stage narrative progression menu.

---

## 1. Core Optical & Multi-Identity Containment Physics

### A. Preventing Dual-Body Spawning While Preserving Distinct Photo Identity (CRITICAL)
- **Never place bare `2girls` in Negative UC**:
  - When a female character lies on the bed with a printed portrait photograph of *another* female character resting on her face, V5 registers two distinct female identities in the scene. Putting bare `2girls` in Negative UC either erases the portrait inside the photo or forces the portrait to copy the supine character's hair color.
  - Instead, block **`two bodies, 2girls lying together, 2girls lying side by side, standing girl, extra person, floating girl, twins, identical hair, uncovered eyes on bed, holding photo, holding paper`**.
- **Two Proven Identity-Separation Architectures**:
  1. **T5 Spatial Containment Prose (`PS01, PS03, PS04`)**:
     - Anchor the supine character first (`1.45::<body_char>::, long white hair, twintails spread across white pillow`), lock face occlusion (`1.7::covered face::, 1.65::covered eyes::, 1.7::photograph:: on face, a square white-bordered printed portrait photo resting flat over her face covering her eyes and nose, only her flushed chin and small open gasping mouth visible beneath the bottom white border of the photo`), and then explicitly scope the second character inside the photo object (`the square white-bordered printed photo on her face shows a colorful close-up smiling portrait of 1.35::<photo_char>:: with purple hair and bright green eyes`).
  2. **Multi-Box `[C3 Body + C2 Photo]` Coordinate Anchoring (`PS02`)**:
     - Anchor `[Character 1 (C3)]` as the supine body on the bed (`target#vaginal, -2.5::<photo_hair_color>, <photo_eye_color>::`) and `[Character 2 (C2)]` at the pillow head coordinate strictly as `printed portrait inside a square white-bordered 1.75::photograph:: resting flat on top of face, 1.45::<photo_char>::, head and neck portrait photo only, flat paper photo print, -2.5::body, torso, arms, legs, crying::`.
- **Automatic Partner-Photo Pairing Rule**:
  - When the active supine character is switched (e.g., if the supine character is `javelin (azur lane)`), swap the default photo portrait to a contrasting character (such as `laffey (azur lane)` or `ayanami (azur lane)`) so body and photo never collide on the same character tag.

### B. Post-Coital Belly-Press Continuous Forearm Calibration (`PS04`)
- **Preventing Floating Severed Forearm Stumps**:
  - Never put `male torso` in Negative UC when requesting a 1st-person `pov hands` hand pressing down on the supine character's stomach — V5 will chop the male forearm off mid-air above her thigh.
  - Specify **`1.65::bare stomach::, exposed navel and smooth lower belly, 1.65::pov hands::, a continuous tanned male arm extending from the bottom edge of the frame with palm and fingers pressing firmly flat onto her bare lower abdomen below her navel, fingers sinking into soft belly skin`**, and place **`floating arm, detached arm, severed arm, cut off limb, amputee, male back, male head, penis, testicles, penetration`** in Negative UC.

---

## 2. Verified 4-Stage Progression Matrix (`PS01–PS04`)

| Code | Canvas & Upscaled Output | Verified Seed | Stage Title | Key Visual & Mechanical Anchors |
| :--- | :---: | :---: | :--- | :--- |
| `PS01` | `832×1216` → `1664×2432` | `s9301122334` | Intact Maid Bodice Missionary (`原版露肩女仆装·盖脸照正常位`) | `1.55::pov::, 1.55::from above::, 1.55::missionary::, tilted white-bordered smiling portrait 1.7::photograph:: over face, intact buttoned ruffled bodice, 1.55::skirt lift::` |
| `PS02` | `832×1216` → `1664×2432` | `s9302233445` | Multi-Box Halter Maid Match (`双框坐标锚定·挂脖领饰盖脸正常位`) | `Multi-Box [Character 1 (C3)] supine body + [Character 2 (C2)] square white-bordered photo portrait, halter straps & blue-gem bowtie, open gasping mouth below photo edge` |
| `PS03` | `832×1216` → `1664×2432` | `s9303344556` | Unbuttoned Bodice & Tears Climax (`前襟解扣敞胸·相片下缘落泪高潮`) | `askew smiling portrait photo over eyes, 1.5::tears:: streaming out beneath bottom white border down flushed cheeks, unbuttoned open ruffled maid bodice, hands clutching pillow` |
| `PS04` | `832×1216` → `1664×2432` | `s9304455689` | Post-Coital Belly-Press Squeeze (`事后脱力摊手·按压小腹挤出浓精`) | `1.65::after sex::, 1.65::after vaginal::, maid dress pushed high to chest, 1.65::bare stomach::, continuous POV male arm from bottom border pressing lower belly, 1.7::cum overflow::` |
