# NovelAI Workstation Workspace Rules

## 1. Dual-Workflow Operating Contract
- **Workflow A — Sensibility & Creative Content Generation (感性与内容生成)**:
  - Prioritize visual storytelling, mood, lighting atmosphere, emotional nuance, and natural T5 English prose.
  - Avoid rigid tag checklists, mechanical SKU copy-pasting, or unrequested artist/body proportion locks. Treat built-in Studio presets and `.agents/skills/*` taxonomies as **optional inspiration palettes**, never mandatory templates.
  - When crafting bespoke or atmospheric scenes on the live webpage (`nai-live-control`), prefer `nai_set_manual_prompt` or `FREE` mode prose/tags over forcing creative ideas into preset enums.
- **Workflow B — Code & Workbench Engineering (代码生成与工程维护)**:
  - Strict TypeScript, UI, serializer, and build guardrails apply **only** to codebase engineering. Read and follow `web/AGENTS.md` whenever inspecting, modifying, building, or verifying `web/` or syncing `NovelAI_Workbench.html`.

## 2. NovelAI V4.5 / V5 Hard Model Physics
- **T5 Token Ceiling**: Stay within the hard `512` T5 token limit across `[Base Prompt]` + `[Character N]` boxes (safe target `<= 502`; on V4.5 Full with active Vibe slots, `502 - 34 * activeVibeCount` with `k_dpmpp_2m` sampler, `0 Anlas` on Opus for `<= 4` pre-encoded vibes).
- **Non-Nesting `w::...::` Syntax**: `::` blocks do not nest — never place inner `w::tag::` blocks inside `-2::...::` wrappers (which prematurely closes `-2::` and leaks tail tags into Positive), and never wrap colon emoticons like `:3` inside `::` (produces corrupt `:::`).
- **Model Positive / Negative Routing**:
  - `nai-diffusion-4-5-full` (V4.5 Full) & `nai-diffusion-5-full` (V5 Full High, `params_version: 4` multipart) use separated positive (`v4_prompt`) and negative (`v4_negative_prompt`) channels.
  - `nai-diffusion-5-full-medium` (14-step distilled) ignores custom `negative_prompt` server-side; inject scene/custom negative tags as inline `-2::...::` in `base_caption` on Medium.
  - Keep fractional positive-space counterweights (`|weight| < 1.0`, e.g. `-0.45::wide hips::`) and M6-Tune2 face counterweights (`-2.5::nose bridge, nostrils, lips::`) inside Positive.

## 3. Windows Shell & Live NovelAI API Proxy
- **PowerShell 5.1 Chaining**: Do not use `&&` in Windows PowerShell commands; chain sequentially with `; if ($LASTEXITCODE -eq 0) { ... }`.
- **Node.js Proxy for `image.novelai.net`**: Node `fetch` (`undici`) does not automatically read `nai_api_config.json`'s `"proxy"` field. When running scratch image-generation scripts via `npx tsx`, read `proxy` from `nai_api_config.json` (e.g. `http://127.0.0.1:5010`) and set `$env:HTTPS_PROXY`, `$env:HTTP_PROXY`, and `$env:NODE_USE_ENV_PROXY = '1'`.
