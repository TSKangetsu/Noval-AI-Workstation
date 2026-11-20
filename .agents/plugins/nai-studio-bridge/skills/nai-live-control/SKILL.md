---
name: nai-live-control
description: >-
  Real-time two-way control workflow for the open NovelAI_Workbench.html webpage via the nai-studio-bridge MCP server.
  Activate whenever the user asks to inspect, tweak, switch presets/styles/outfits/poses, edit prompts, load Vibes,
  or trigger image generation directly on their open NovelAI Studio webpage without rebuilding HTML.
---

# NAI Studio 2.0 Live Webpage Control Skill

`nai-studio-bridge` (`web/src/mcp/naiStudioMcpServer.ts`, registered as lazy MCP server `nai-studio-bridge_studio`) listens on `0.0.0.0:17890` and supports both local and LAN/remote browsers:
- **Local `file://` or localhost**: Auto-connects to `ws://127.0.0.1:17890/ws`. Multiple Antigravity windows share the active browser session transparently via the loopback-only `/api/rpc` relay on port `17890`.
- **LAN / Tablet / Phone / Remote**: Open `http://<LAN_IP>:17890/` directly (serves `NovelAI_Workbench.html` and auto-connects to `ws://<LAN_IP>:17890/ws`), or click topbar `🔌 MCP` on any standalone copy to set a custom `ws://` / `wss://` address (`nai_wb_mcp_endpoint_v1`). Check `bridge_access.lan_urls` in `nai_get_state` when helping the user connect another device.
- **Lazy MCP Tool Invocation**: Read the tool's JSON schema under `<appDataDir>/mcp/nai-studio-bridge_studio/<toolName>.json` once before calling via `call_mcp_tool` (`ServerName: "nai-studio-bridge_studio"`).

## Workflow Guidelines

1. **Inspect First (`nai_get_state` / `nai_list_options`)**:
   - Call `nai_get_state` to see the user's current character, `gender_mode` (`normal` | `femboy` | `futa_no_balls` | `futa_with_balls`), outfit, style, active scene (`P01..P51`, `MP01..MP15`, `MA0..MA10`, `MA7A..MA7D`, `FREE`), compiled Positive/Negative prompts, T5 token counts, and Vibe slots.
   - **Cross-Check Model vs. CFG Drift**: Verify `api_settings.scale` and `cfg_rescale` match the active `model` — if `nai-diffusion-5-full` (`V5 High`) still carries leftover V4.5 Vibe settings (`scale: 5.0, cfg_rescale: 0.28`), recalibrate via `nai_update_config` to `scale: 6.5 ~ 7.0, cfg_rescale: 0.0` (and conversely restore `scale: 5.0, cfg_rescale: 0.28` when switching back to multi-slot V4.5 Vibe).
   - Before setting enum fields (`style_preset`, `outfit_preset`, `body_preset`, `lighting_preset`, etc.), call `nai_list_options` for that category so you pass the exact preset key string rather than guessing (e.g. `⚡🌷 安定萌化futa专用...` for Futa scenes).

2. **Push Changes Live (`nai_update_config` / `nai_set_manual_prompt`)**:
   - For structured config changes (switching `char_tag`, `extra_char_tags`, `gender_mode`, outfit, style, scale/rescale, pose stage, `MA7A..MA7D` belly/x-ray variants, condom, x-ray, or free action tags), call `nai_update_config`. Note that changing `style_preset` automatically syncs the recommended `lighting_preset` and any bundled Vibe pack unless `lighting_preset` is explicitly passed.
   - **Automatic Character Prompt Distribution**: The workbench engine now uniformly compiles single-character and 2-person scenes into `[Base Prompt]` + `[Character 1]` (plus `[Character 2]\nboy, faceless male` on 3rd-person 2-person scenes, omitting `[Character 2]` on solo & POV scenes) with `use_coords: false` (AI's Choice).
   - For surgical tag tweaks or **explicit coordinate-pinned multi-character scenes** (`[Base Prompt]` + `[Character 1 (B3)]` + `[Character 2 (D3)]` with `source#` / `target#` / `mutual#`), call `nai_set_manual_prompt`. Note that `nai_set_manual_prompt` sets `is_manual_prompt_locked: true`; call `nai_set_manual_prompt({ unlock: true })` whenever returning the webpage to automatic engine prompt compilation.
   - **Manual Lock Ordering Rule**: Calling `nai_update_config` (including changing `canvas_preset`, `action_mode`, or UI toggles by the user) re-runs the engine prompt compiler and **unlocks/overwrites manual `[Base Prompt]` + `[Character N]` edits**. Always execute in strict order: (1) `nai_update_config` to set canvas/model/steps first → (2) `nai_set_manual_prompt` passing BOTH `positive` and `negative` together (staying `<= safe_pos_limit`, e.g., `<= 502` tokens) → (3) `nai_generate`.

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
   - When the user asks to generate and inspect the result, call `nai_generate` (`wait_for_result: true`), then inspect the returned `local_preview_path` with `read_file` (or call `nai_get_latest_image` with `image_id` or `gallery_index`) to evaluate visual quality and iterate if needed.
