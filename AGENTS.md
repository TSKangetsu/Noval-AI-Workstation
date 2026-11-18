# NovelAI V4.5 / V5 Workbench Workspace Rules

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
- **Permanently Removed Subsystems (Do Not Reintroduce)**:
  - Never re-add `nai-diffusion-5-curated`, legacy Storyline (`F00+S00~S11`), `director_reference_*` Precise Reference, or character-level `eye_color` / `hair_tags` fields. All custom hair/eye/ornament traits belong strictly in `extra_char_tags` (`额外常驻人物 Tag`).

## 2. Shell & Live NovelAI API Script Execution (Windows)
- **PowerShell 5.1 Chaining**: Do not use `&&` in Windows PowerShell commands; chain sequentially with `; if ($LASTEXITCODE -eq 0) { ... }`.
- **Node.js Proxy for `image.novelai.net`**: Node `fetch` (`undici`) does not automatically read `nai_api_config.json`'s `"proxy"` field. When running scratch image-generation scripts via `npx tsx`, read `proxy` from `nai_api_config.json` (e.g. `http://127.0.0.1:5010`) and set `$env:HTTPS_PROXY`, `$env:HTTP_PROXY`, and `$env:NODE_USE_ENV_PROXY = '1'`.

## 3. UI & API Payload Invariants
- **Studio 2.0 UI Guardrails**:
  - Global `html, body, #app` must enforce `user-select: none` (allowing `user-select: text` only on `input, textarea`) so clicking/dragging never highlights the page blue.
  - Left-column inspector cards must always initialize collapsed on every page load; right-column pose category pills must wrap across multiple rows (`flex-wrap: wrap`, no horizontal scrollbar); empty center viewport must render a pure `#000000` black screen with zero placeholder text/buttons.
  - Selecting a `style_preset` must auto-sync its paired `lighting_preset` (`resolveLightingForStyle`) and auto-load its bundled Vibe pack (`STYLE_BUNDLED_VIBE_PACK`).
  - Hide the Vibe Transfer panel (`display: none`) whenever a V5 model (`V5 High` / `V5 Med`) is active, and do not add "extract as Vibe" toolbar buttons.
- **Positive/Negative Routing by Model**:
  - `nai-diffusion-4-5-full` (V4.5 Full) & `nai-diffusion-5-full` (V5 Full High, `params_version: 4` multipart) use separated positive (`v4_prompt`) and negative (`v4_negative_prompt`) channels by default.
  - `nai-diffusion-5-full-medium` (14-step distilled) ignores custom `negative_prompt` server-side; always auto-inject scene/custom negative tags as inline `-2::...::` in `base_caption` on Medium.
  - Preserve fractional positive-space counterweights (`|weight| < 1.0`, e.g. `-0.45::wide hips::`) and M6-Tune2 face counterweights (`-2.5::nose bridge, nostrils, lips::`) inside the Positive prompt when splitting negatives.
  - Never place `w::tag::` weight syntax inside preset negative tuples (`MORPH_PRESETS`, `PUBIC_PRESETS`, `extra_neg`) or inside `-2::...::` wrappers (`wrapNeg` must unwrap any inner `w::...::` first so non-nesting `::` delimiters never prematurely close `-2::...::` and leak tail tags into Positive).
- **V4.5 Vibe Transfer Sampler & Token Budget**:
  - On V4.5 Full with active Vibe slots (`reference_image_multiple`), auto-switch sampler to `k_dpmpp_2m` (`DPM++ 2M`, `0 Anlas` on Opus for `<=4` pre-encoded vibes) and reserve `34` T5 tokens per active Vibe slot (`computeSafePosTokenLimit`: `502 - 34 * activeVibeCount`).
  - `encodeT5Len` in `t5Tokenizer.ts` must preserve commas `,` adjacent to `w::...::` weight blocks without injecting phantom leading `▁` spaces before punctuation.
- **Lightbox & Auto-2x Upscale**: When `auto_upscale_replace` is enabled, never push temporary 1x base images to the gallery or Lightbox before 2x upscaling completes. Keep carousel modes (`manual | follow_latest | timed`) mutually exclusive.
