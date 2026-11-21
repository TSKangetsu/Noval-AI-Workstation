# NovelAI V5 Lower-Body Rendering Artist Notes & Lighting Showcase Examples

> **Usage Note**: These single-seed V5 Full (`nai-diffusion-5-full`) observations are an **optional visual reference** when exploring rendering textures (from airy watercolor/pearlescent moe to crisp doujin lineart or glossy highlights). Mix, re-weight, or replace artists freely to match the mood and palette of your scene.

---

## 1. V5 Full Rendering Texture Reference (`1D` Prominent Inner-Fold Benchmark)

Observed under close-up V-leg framing (`seed=672256152`) on NovelAI V5 Full. When adding one of these artists purely as a **subtle texture seasoning tail** behind an existing 3–4 artist moe core, weights around `0.25 ~ 0.50` introduce noticeable mucosal/skin sheen; when used solo or as primary leads, their native aesthetic dominates:

| Artist Tag | Texture & Aesthetic Character | Rendering Notes & Pairing Ideas |
| :--- | :--- | :--- |
| `artist:mignon` | Airy sakura-pink translucent jelly sheen | Clean symmetrical soft pink folds, zero muddy shadow cast, luminous skin highlights, cute facial proportions; works solo or blended |
| `artist:shiina excel` | High-gloss crystalline wet highlights | Strong semi-translucent mucosal speculars and three-dimensional fluid trails while keeping clean anime linework |
| `artist:henreader` | Soft-lit peach flaring contours | Broad, supple petal-like flare with silky peach tonal transitions and minimal harsh outlines |
| `artist:alp` | Supple plush flesh & micro-creases | Convincing soft-tissue compression, natural micro-folds, and delicate glistening threads |
| `artist:ban!` | Crisp doujinshi ink lineart | Sharp cel-shaded linework where structural folds and anatomical contours read clearly |
| `artist:pija (pianiishimo)` | High-contrast warm bounce light | Rich warm-orange bounce light and deep wet contrast; solo lines run slightly bold, while a light tail weight (`~0.25–0.30`) smooths complex lower-body transitions |
| `artist:marushin (marushin0214)` | Saturated glossy pink with fine threads | Detailed fold layering, clear translucent fluid strands, vivid pink highlights, and stable moe facial features |
| `artist:komone ushio` | Porcelain-pale soft pink | Fair translucent skin, gentle pink tones without dark cast, beaded droplets, suited to soft youthful aesthetics |
| `artist:kurokoshou (emuburemu123)` | Dewy crimson-pink sculpted folds | Plump mound with vivid wet crimson-pink folds; solo extreme macro shots occasionally add corner face insets (add `multiple views, inset` to Negative if unwanted) |
| `artist:ciloranko` | Glassy pinpoint highlights & fine lineart | Translucent glass-like water beads and delicate lineart; add `multiple views, inset` to Negative on solo extreme close-ups |
| `artist:rurudo` | Pearlescent pale-pink atmospheric glow | Luminous pearl-white skin, clear dewdrop highlights, and refined atmospheric delicacy |
| `artist:toosaka asagi` | Dreamy pastel cream-peach | Soft creamy-white translucency, clear droplets, and gentle rounded transitions |
| `artist:nanawo (7nanawo)` | Bright, tidy cel-shaded pink | Clean bright color separation, neat wet highlights, and crisp cel contours |
| `artist:doshimash0` | High-contrast starlight wet speculars | Crisp star-like wet glints, defined rim highlights, and polished commercial anime facial rendering |
| `artist:horosuke` | Ultra-clean pale-pink bounce | Smooth bright inner-thigh highlights and tidy symmetrical pale-pink tones |
| `artist:m-da s-tarou` | Voluptuous high-volume wet gloss | Strong soft-flesh relief with rich glossy fluid strands |
| `artist:nanashi (774)` | Classic detailed manga/doujin anatomy | Crisp monochrome-derived anime linework with expressive facial emotion |
| `artist:nagi ichi` | Sparkling vivid cel-shading | Vivid pink tones with bright starlight speculars and fine radial crease lines |
| `artist:tofuubear` / `artist:nyuu (manekin-eko)` / `artist:tsukudani (coke-buta)` | Soft peach moe vs. mature dark-edged folds | `tofuubear` leans soft pale peach; `nyuu` emphasizes intricate mature dark-edged folds; `tsukudani` leans high-contrast doujinshi |
| `artist:shiratama (shiratamaco)` / `artist:karory` / `artist:mimonel` | Soft pastel auxiliary blenders | Clean pale-pink translucency; on extreme macro shots they work best as low-to-mid weight auxiliary blends (`multiple views, inset` in Negative prevents corner insets) |

---

## 2. Optional Style & Lighting Example: Glossy 2.5D Cool/Warm Cel Baseline

If you want a polished 2.5D cel-shaded anime look that balances cute moe facial lineart with glossy wet skin speculars (one optional baseline among many possible styles):

- **Example Positive Style & Lighting Snippet**:
  ```text
  masterpiece, best quality, very aesthetic, absurdres, year 2025, 0.56::artist:mikozin::, 0.46::artist:kani bonara::, 0.38::artist:hori (hori no su)::, 0.34::artist:gotyou::, 0.50::artist:doshimash0::, gradient eyes, no text, 1.15::cel shading::, anime coloring, lineart, 1.2::high contrast::, saturated, 1.25::backlighting::, 1.15::subsurface scattering::, 1.18::shiny skin::, sparkle
  ```
- **Adaptation Tips When Using This Baseline**:
  1. **Keeping Crisp 2D Contours**: Pairing `doshimash0` (`~0.50`) with `cel shading, anime coloring, lineart` (and `painterly, photorealistic, 3d` in Negative) retains glossy highlights without drifting into thick oil-paint textures.
  2. **Matching Light Sources to the Scene**: Omit fixed daytime tags (`sunlight, light rays`) on indoor, windowless, or nighttime scenes so stray sunbeams do not appear; swap in scene-motivated light sources instead (e.g., `camera flash` for night/timer shots, `warm spotlight` or `warm yellow lighting` for fitting rooms/baths, `city lights at night` or `neon-lit bedroom, ring light reflection in pupils` for night rooms).
  3. **Typical V5 Full Sampling Baseline**: `nai-diffusion-5-full` around `Steps: 28, CFG Scale: 6.5–7.0, CFG Rescale: 0` (with optional 2x diffusion upscale when high-resolution output is desired).
