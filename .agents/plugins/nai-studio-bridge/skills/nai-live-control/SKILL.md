---
name: nai-live-control
description: >-
  Real-time two-way control and creative co-pilot workflow for the open NovelAI_Workbench.html webpage via the nai-studio-bridge MCP server.
  Activate whenever the user asks to craft expressive live prompts, inspect state, switch presets/styles/outfits/poses, load Vibes,
  organize gallery folders, or trigger image generation directly on their open NovelAI Studio webpage without rebuilding HTML.
---

# NAI Studio 2.0 Live Webpage Control Skill

`nai-studio-bridge` (`web/src/mcp/naiStudioMcpServer.ts`, registered as lazy MCP server `nai-studio-bridge_studio`) listens on `0.0.0.0:17890` and supports both local and LAN/remote browsers:
- **Local `file://` or localhost**: Auto-connects to `ws://127.0.0.1:17890/ws`. Multiple Antigravity windows share the active browser session transparently via the loopback-only `/api/rpc` relay on port `17890`.
- **LAN / Tablet / Phone / Remote**: Open `http://<LAN_IP>:17890/` directly (serves `NovelAI_Workbench.html` and auto-connects to `ws://<LAN_IP>:17890/ws`), or click topbar `🔌 MCP` on any standalone copy to set a custom `ws://` / `wss://` address (`nai_wb_mcp_endpoint_v1`). Check `bridge_access.lan_urls` in `nai_get_state` when helping the user connect another device.
- **Lazy MCP Tool Invocation**: Read the tool's JSON schema under `<appDataDir>/mcp/nai-studio-bridge_studio/<toolName>.json` once before calling via `call_mcp_tool` (`ServerName: "nai-studio-bridge_studio"`).

## Hard MCP Constraints (Mandatory)

- **ZERO Direct-Gen Script Bypass**: Never bypass the `17890` MCP bridge by writing temporary `.ts` / `.mjs` / `tsx` scripts that call `image.novelai.net` or `naiApiClient.ts` directly. All live image generation and QA renders MUST go through `nai_generate` (Coordinator) or `POST http://127.0.0.1:17890/api/rpc` (Swarm workers).
- **Zero-Client Recovery (`connected_clients: 0`)**: If `17890` has no active browser client (e.g., after a server restart), NEVER fall back to direct API scripts — open/revive `http://127.0.0.1:17890/` in the built-in browser (or immediately report to `@coordinator` if running as a worker). Always reload the browser tab after restarting `17890` with a new `NovelAI_Workbench.html` build.
- **Same-Origin Proxy & Bandwidth-Saving Pipeline**:
  - Pages served on port `17890` automatically route NovelAI calls through same-origin `/api/nai-proxy/{image|api}/*` (via `nai_api_config.json` `proxy` + native Node `CONNECT`/TLS tunnel, eliminating built-in browser `ERR_CERT_COMMON_NAME_INVALID`; standalone `file://` stays 100% direct).
  - `use_webp_transfer` defaults to `true` (lossless WebP download `-29%`, converted back to lossless PNG + `tEXt` metadata in-browser).
  - `naiStudioMcpServer.ts` automatically compresses `outputs/_mcp_live_preview/*.jpg` via `ffmpeg` pipe (`-87%` upload bandwidth to Gemini). **Always inspect ONLY the returned `.jpg` `local_preview_path` via `read_file`**; never upload raw PNGs for routine AI review.
- **No Leftover Temp Scripts**: Never leave temporary image-generation `.ts` / `.mjs` scripts in the workspace or `scratch/`.

## Workflow Guidelines

1. **Inspect First (`nai_get_state` / conditional `nai_list_options`)**:
   - Call `nai_get_state` to inspect the user's active character, `gender_mode` (`normal` | `femboy` | `futa_no_balls` | `futa_with_balls`), outfit, style, active scene, compiled Positive/Negative prompts, T5 token counts (`safe_pos_limit`), and Vibe slots.
   - **Cross-Model CFG Drift Only**: Only recalibrate `api_settings.scale` / `cfg_rescale` when **cross-model leftover drift** is present (e.g., switching to `nai-diffusion-5-full` while still carrying leftover V4.5 multi-Vibe `scale: 5.0, cfg_rescale: 0.28` -> `6.5 ~ 7.0 / 0.0`, or restoring `5.0 / 0.28` when switching back to multi-slot V4.5 Vibe). Leave deliberate same-model user CFG/rescale tuning untouched.
   - Call `nai_list_options` **only** when setting structured enum fields (`style_preset`, `outfit_preset`, `body_preset`, `lighting_preset`, catalog poses) so you pass exact preset keys; skip enum lookups during freeform creative prompting.

2. **Choose Track by Intent (`nai_set_manual_prompt` vs. `nai_update_config`)**:
   - **Expressive / Sensibility Track (`nai_set_manual_prompt` or `FREE` prose) — Default for Mood, Story & Bespoke Scenes**:
     - When the user describes an atmosphere, story beat, lighting mood, subtle expression, or original composition (or wants coordinate-pinned multi-character `[Base Prompt]` + `[Character 1 (B3)]` + `[Character 2 (D3)]` with `source#` / `target#` / `mutual#`), **skip `nai_list_options` hunting** and compose expressive tags + natural English T5 prose directly (inheriting active character/style anchors from `nai_get_state` when desired).
     - Use `nai_set_manual_prompt` for full creative control, or `nai_update_config` with `action_mode: "free"` (`free_action_tags`, `free_action_prose`) when keeping the webpage's active character/style modules unlocked.
     - **Manual Lock Ordering & Scope**: Calling `nai_update_config` re-runs the engine compiler and **unlocks/overwrites** manual prompt edits. Always execute in strict order: (1) `nai_update_config` first if canvas/model/steps need changing → (2) `nai_set_manual_prompt` passing **BOTH** `positive` and `negative` together (`<= safe_pos_limit`, e.g., `<= 502` tokens) → (3) `nai_generate` (only when asked). Manual lock applies to the active/single scene (`scene_ids` omitted or single-item); call `nai_set_manual_prompt({ unlock: true })` to return to automatic engine compilation.
   - **Preset / UI Track (`nai_list_options` + `nai_update_config`) — For Named Studio Presets & Catalog Poses**:
     - Use `nai_update_config` when switching named presets (`char_tag`, `extra_char_tags`, `gender_mode`, `solo_spread_mode: "off" | "pure" | "cum"`, `use_webp_transfer`, outfit, style, pose stage, condom, x-ray) or catalog scenes (`P01..P51`, `MP01..MP15`, `TN01..TN12`, `BG01..BG20`, `MA0..MA11`, `MA7A..MA7E`, `SF01..SF30`, `KTD01..KTD60`, `KT01..KT46`, `PLD01..PLD22`, `PL01..PL11`, `CV01..CV07`, `BT01..BT08`, `HWD01..HWD15`, `PS01..PS04`, `CP01..CP12`, `AFD01..AFD15`, `ONS01..ONS55`, `CAR01..CAR25`, `MTS01..MTS15`). Changing `style_preset` auto-syncs its paired `lighting_preset` and bundled Vibe pack unless `lighting_preset` is explicitly passed.
     - Engine-compiled 2-person scenes automatically distribute into `[Base Prompt]` + `[Character 1]` (plus `[Character 2]\nboy, faceless male...` on 3rd-person 2-person scenes, omitted on solo/POV) with `use_coords: false`.

3. **Manage Presets & Vibes (`nai_manage_presets` / `nai_manage_vibes`)**:
   - Use `nai_manage_presets` (`select` | `save` | `delete` | `restore_defaults`) to persist or switch presets in the user's browser `localStorage`.
   - Use `nai_manage_vibes` (`import_file` with an absolute path to `.naiv4vibebundle` / `.naiv4vibe` / NAI PNG, or `update_slot` to tune strengths) to manage Vibe Transfer slots live.

4. **Webpage Gallery & Folder Archiving (`nai_list_files` / `nai_manage_files`)**:
   - Folders in the webpage are **session-incremental only** (refreshing the page starts with zero stale prior folders). All file operations via MCP are strictly scoped inside the open webpage's gallery & folder organizer (automatically syncing with the user's mounted local directory when mounted).
   - Call `nai_list_files` first to inspect current session folders, ungrouped images, indices, `image_id`, `scene_id`, `seed`, `is_starred`, and `is_upscaled`.
   - Call `nai_manage_files` to:
     - Organize folders: `create_folder` (`open`, `pin`), `rename_folder` (`new_name`, `merge_if_exists`), `dissolve_folder` (non-destructive ungroup), `delete_folder`, `open_folder`, `pin_folder`.
     - Organize images via `selector` (`image_ids`, `gallery_indices`, `index_range`, `from_folder` (`""` ungrouped / `"*"` all / folder name), `scene_ids`, `scene_prefix`, `seeds`, `starred_only`, `unstarred_only`, `upscaled_only`, `unupscaled_only`, `checked_only`, `selected_only`): `move_images`, `select_image`, `star_images`, `delete_images`, `upscale_images` (only when user requests 2x upscale), and `export_zip`.

5. **Controlled Generation (`nai_generate` / `nai_get_latest_image`)**:
   - **Never call `nai_generate` unless the user asks to generate/render an image.** Parameter, prompt, and folder organization updates cost 0 Anlas and apply immediately.
   - Pass optional `target_folder` to `nai_generate` to automatically archive generated images directly into a webpage folder.
   - When the user asks to generate and inspect the result, call `nai_generate` (`wait_for_result: true`), then inspect **only** the compressed `.jpg` `local_preview_path` (`outputs/_mcp_live_preview/*.jpg`) with `read_file` (or call `nai_get_latest_image` with `image_id` or `gallery_index`) to evaluate visual quality and iterate if needed. Always unlock manual prompt (`nai_set_manual_prompt({ unlock: true })`) and restore random seed (`seed: -1`) after A/B tests.
