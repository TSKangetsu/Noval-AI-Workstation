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
   - Call `nai_get_state` to see the user's current character, outfit, style, active scene (`P01..P51`, `MA0..MA10`, `FREE`), compiled Positive/Negative prompts, T5 token counts, and Vibe slots.
   - Before setting enum fields (`style_preset`, `outfit_preset`, `body_preset`, `lighting_preset`, etc.), call `nai_list_options` for that category so you pass the exact preset key string rather than guessing.

2. **Push Changes Live (`nai_update_config` / `nai_set_manual_prompt`)**:
   - For structured config changes (switching character tags, extra_char_tags, outfit, style, scale/rescale, pose stage, condom, x-ray, or free action tags), call `nai_update_config`. Note that changing `style_preset` automatically syncs the recommended `lighting_preset` and any bundled Vibe pack unless `lighting_preset` is explicitly passed.
   - For surgical tag weight tweaks on the currently displayed prompt without altering underlying presets, call `nai_set_manual_prompt` (`replace_target` + `replace_with` or full `positive` / `negative`).

3. **Manage Presets & Vibes (`nai_manage_presets` / `nai_manage_vibes`)**:
   - Use `nai_manage_presets` (`select` | `save` | `delete` | `restore_defaults`) to persist or switch presets in the user's browser `localStorage`.
   - Use `nai_manage_vibes` (`import_file` with an absolute path to `.naiv4vibebundle` / `.naiv4vibe` / NAI PNG, or `update_slot` to tune strengths) to manage Vibe Transfer slots live.

4. **Controlled Generation (`nai_generate` / `nai_get_latest_image`)**:
   - **Never call `nai_generate` unless the user asks to generate/render an image.** Parameter and prompt updates cost 0 Anlas and apply immediately.
   - When the user asks to generate and inspect the result, call `nai_generate` (`wait_for_result: true`), then inspect the returned `local_preview_path` with `read_file` to evaluate visual quality and iterate if needed.
