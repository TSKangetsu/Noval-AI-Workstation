# NovelAI Studio 2.0 Codebase & UI Engineering Rules (`web/`)

Scope: Applies when inspecting, modifying, verifying, or building the TypeScript workbench codebase (`web/src/`, `web/scripts/`) and syncing root `NovelAI_Workbench.html`.

## 1. Architecture & Single-File Build Sync
- **100% TypeScript / Zero Python**: Maintain all engine, tokenizer, API client, and UI logic strictly in `web/src/` (TypeScript + Vite single-file bundle). Store temporary test/audit scripts only in the conversation `scratch/` directory.
- **Node MCP Exclusion in Browser Build**: Keep Node-only MCP bridge code under `web/src/mcp/` excluded from browser DOM typechecking (`"exclude": ["src/mcp"]` in `web/tsconfig.json`) and run it directly via `tsx`.
- **Mandatory Build & Verify Pipeline**: Whenever modifying `web/src/`, always run:
  1. `npm --prefix web run verify` (all automated assertions & 512 T5 token checks must pass)
  2. `npm --prefix web run build` (`tsc --noEmit && vite build`)
  3. Copy `web/dist/index.html` to root `NovelAI_Workbench.html` so the standalone single-file HTML stays in sync.
- **Preset Migration & Persistent Deletion Tombstones**:
  - Map renamed/legacy preset keys in `web/src/services/storageService.ts` (`loadActiveConfig` / `loadApiSettings`).
  - Honor the persistent tombstone set (`nai_wb_deleted_presets_v1` via `loadDeletedPresets` / `markPresetDeleted`) whenever merging `BUNDLED_CUSTOM_PRESETS` and `BUILTIN_CHARACTERS` so user-deleted presets never resurrect on reload (`Shift + Click ↺` restores factory defaults).
- **Permanently Removed Subsystems (Do Not Reintroduce in Code/Schema)**:
  - Never re-add `nai-diffusion-5-curated`, legacy Storyline (`F00+S00~S11`), `director_reference_*` Precise Reference, or character-level `eye_color` / `hair_tags` fields on `CharacterConfig`. Within `CharacterConfig` presets, custom persistent hair/eye/ornament traits belong in `extra_char_tags` (`额外常驻人物 Tag`).

## 2. Studio 2.0 UI & Lightbox Guardrails
- **Global Selection & Layout**:
  - Global `html, body, #app` must enforce `user-select: none` (allowing `user-select: text` only on `input, textarea`) so clicking/dragging never highlights the page blue.
  - Left-column inspector cards must always initialize collapsed on every page load; right-column pose category pills must wrap across multiple rows (`flex-wrap: wrap`, no horizontal scrollbar); empty center viewport must render a pure `#000000` black screen with zero placeholder text/buttons.
- **Responsive Portrait Space-Budget & Anti-Collision Guardrails**:
  - Never mix `flex: 1` (`flex-basis: 0%`) with `width: 100%` on wrapped flex rows (always set explicit `flex: 1 1 100%; width: 100%; min-width: 0` on full-row children such as `.prompt-bar-left` and `.prompt-bar-actions` so sibling toolbars never overlap).
  - Keep mobile (`<= 768px`) & `.portrait-compact-stage` toolbar buttons, pills, and `<select>` controls sleek (`26–32px` height, `11.5–12.5px` typography; never bloated `36–40px` bricks or `16px` `<select>` labels), and anchor default expanded portrait overlays at `top: 0` for 100% full-stage coverage.
  - Whenever modifying responsive UI or CSS (`app.ts` / `workbench.css`), run a headless Chrome CDP `getBoundingClientRect()` collision & screenshot audit across narrow portrait (`360–390px` resting, prompt overlay, gallery overlay) and desktop landscape (`1440×900`) and visually inspect the rendered screenshots.
- **Style, Lighting & Vibe Panel Sync**:
  - Selecting a `style_preset` must auto-sync its paired `lighting_preset` (`resolveLightingForStyle`) and auto-load its bundled Vibe pack (`STYLE_BUNDLED_VIBE_PACK`).
  - Hide the Vibe Transfer panel (`display: none`) whenever a V5 model (`V5 High` / `V5 Med`) is active, and do not add "extract as Vibe" toolbar buttons.
- **Lightbox & Auto-2x Upscale**:
  - When `auto_upscale_replace` is enabled, never push temporary 1x base images to the gallery or Lightbox before 2x upscaling completes. Keep carousel modes (`manual | follow_latest | timed`) mutually exclusive.

## 3. Tokenizer, Compiler & API Payload Invariants
- **Positive/Negative Routing by Model**:
  - `nai-diffusion-4-5-full` (V4.5 Full) & `nai-diffusion-5-full` (V5 Full High, `params_version: 4` multipart) use separated positive (`v4_prompt`) and negative (`v4_negative_prompt`) channels by default.
  - `nai-diffusion-5-full-medium` (14-step distilled) ignores custom `negative_prompt` server-side; always auto-inject scene/custom negative tags as inline `-2::...::` in `base_caption` on Medium.
  - Preserve fractional positive-space counterweights (`|weight| < 1.0`, e.g. `-0.45::wide hips::`) and M6-Tune2 face counterweights (`-0.95::nose bridge, nostrils, lips, thick lips, philtrum::`, plus legacy `-2.5::` compatibility) inside the Positive prompt when splitting negatives.
  - Never place `w::tag::` weight syntax inside preset negative tuples (`MORPH_PRESETS`, `PUBIC_PRESETS`, `extra_neg`) or inside `-2::...::` wrappers (`wrapNeg` must unwrap any inner `w::...::` first so non-nesting `::` delimiters never prematurely close `-2::...::` and leak tail tags into Positive).
- **V4.5 Vibe Transfer Sampler & Token Budget**:
  - On V4.5 Full with active Vibe slots (`reference_image_multiple`), auto-switch sampler to `k_dpmpp_2m` (`DPM++ 2M`, `0 Anlas` on Opus for `<=4` pre-encoded vibes) and reserve `34` T5 tokens per active Vibe slot (`computeSafePosTokenLimit`: `502 - 34 * activeVibeCount`).
  - `encodeT5Len` in `t5Tokenizer.ts` must preserve commas `,` adjacent to `w::...::` weight blocks without injecting phantom leading `▁` spaces before punctuation.
