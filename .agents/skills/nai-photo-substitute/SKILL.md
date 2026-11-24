---
name: nai-photo-substitute
description: >-
  NovelAI V4.5 / V5 craft guide for substitute photo-over-face POV missionary
  and post-coital belly-press scenes (替身盖脸照玩法 / 身代わり写真乗せ). Covers
  placing a printed portrait photograph of a second character flat over a supine
  character's face without spawning two bodies or bleeding hair colors, T5
  spatial containment vs. Multi-Box [C3 Body + C2 Photo] anchoring, and
  continuous bottom-border POV forearm belly-press calibration.
---

# NovelAI V4.5 / V5 Substitute Photo-Over-Face & Belly-Press Craft Guide

Use this skill when composing **Substitute Photo-Over-Face (`替身盖脸照` / `身代わり写真乗せ`)** overhead 1st-person POV scenes on NovelAI V4.5 / V5 — placing a square white-bordered printed portrait photograph of a second character flat over the supine character's upper face, optionally progressing to tears beneath the photo edge or a post-coital POV belly-press squeeze.

---

## 1. Dual-Identity Containment Without Spawning Two Bodies (CRITICAL)

- **Never Place Bare `2girls` in Negative UC**:
  - When a supine character has a printed portrait photograph of *another* character resting on her face, NovelAI V5 registers two distinct identities. Blocking bare `2girls` in Negative UC either erases the printed portrait or forces the photo to copy the supine character's hair color.
  - Instead, block physical duplication explicitly:
    ```text
    two bodies, 2girls lying together, 2girls lying side by side, standing girl, extra person, floating girl, twins, identical hair, uncovered eyes on bed, holding photo, holding paper
    ```
- **Contrasting Partner-Photo Rule**:
  - Always pair two visually distinct characters (contrasting hair and eye colors) so the supine character and the printed photo never collide on the same identity tag.

---

## 2. Two Identity-Separation Architectures

### A. T5 Spatial Containment Prose (Flexible Single-Box)
1. Anchor the supine character first (`1.45::<body_char>::, <hair_style> spread across white pillow`).
2. Lock face occlusion and exposed lower-face emotion:
   ```text
   1.7::covered face::, 1.65::covered eyes::, 1.7::photograph:: on face, a square white-bordered printed portrait photo resting flat over her face covering her eyes and nose, only her flushed chin and small open gasping mouth visible beneath the bottom white border of the photo
   ```
   *(For climax tears, add `askew smiling portrait photo over eyes, 1.5::tears:: streaming out beneath bottom white border down flushed cheeks`.)*
3. Explicitly scope the second identity inside the paper object:
   ```text
   the square white-bordered printed photo on her face shows a colorful close-up smiling portrait of 1.35::<photo_char>:: with <photo_hair_color> and <photo_eye_color>
   ```

### B. Multi-Box `[C3 Body + C2 Photo]` Coordinate Anchoring (Strict Anti-Bleed)
When hair colors or facial expressions still bleed between body and photo, separate them spatially:
- **`[Character 1 (C3)]` (Supine Body on Bed)**:
  - Body identity, outfit, posture, `target#vaginal`, plus local anti-bleed `-2.5::<photo_hair_color>, <photo_eye_color>::`.
- **`[Character 2 (C2)]` (Printed Photo at Pillow Head)**:
  - `printed portrait inside a square white-bordered 1.75::photograph:: resting flat on top of face, 1.45::<photo_char>::, head and neck portrait photo only, flat paper photo print, -2.5::body, torso, arms, legs, crying::`

---

## 3. Continuous Bottom-Border POV Forearm Belly-Press Calibration

- **Preventing Floating Severed Forearm Stumps**:
  - Never put `male torso` in Negative UC when requesting a 1st-person `pov hands` arm pressing down on the supine character's lower abdomen — V5 will sever the forearm mid-air above her thigh.
- **Winning Continuous-Arm Formula**:
  - **Positive**:
    ```text
    1.65::bare stomach::, exposed navel and smooth lower belly, 1.65::pov hands::, a continuous tanned male arm extending from the bottom edge of the frame with palm and fingers pressing firmly flat onto her bare lower abdomen below her navel, fingers sinking into soft belly skin, 1.7::cum overflow::
    ```
  - **Negative UC**:
    ```text
    floating arm, detached arm, severed arm, cut off limb, amputee, male back, male head, penis, testicles, penetration
    ```
