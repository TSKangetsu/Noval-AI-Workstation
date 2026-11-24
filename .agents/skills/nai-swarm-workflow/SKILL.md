---
name: nai-swarm-workflow
description: >-
  Runbook and architecture contract for launching and operating the persistent
  8-worker NovelAI Studio 2.0 development swarm (creator, physics-reviewer,
  prompt-auditor, after-reviewer, skill-optimizer, frontend-dev, mcp-optimizer,
  server-mantainer). Use when starting /swarm for this workspace, dispatching
  post-creator delivery pipelines, running post-integration live render QA,
  hosting the workbench inside the agent browser via the 17890 bridge, or
  deploying updates to the remote server.
---

# NovelAI Studio 2.0 Persistent Swarm & Architecture Contract

Use this skill whenever launching `/swarm` in this workspace or orchestrating multi-worker prompt creation, physical review, real-compiler auditing, workbench integration, post-integration live render QA, MCP bridge hosting, and deployment.

---

## 1. Standing 8-Worker Roster & Lifecycle Invariants

### Hard Lifecycle Guardrails
- **Never `kill` any of the 8 standing workers** — they stay alive (`waiting` costs zero tokens).
- **Never spawn temporary sub-swarms** — do not add extra/one-off workers (including `monitor` or `narrator`), and explicitly instruct every worker in its brief to never call `swarm{action:"add"}`.
- **Fallback ownership** — if a task does not fit any of the 8 standing workers, the Coordinator handles it directly instead of spawning a new worker.
- **Workspace mode** — all 8 workers use `workspace: "inherit"` with strict file-ownership isolation below.

### Standing Roster Table

| Worker Name | Model | Exclusive Scope / Ownership | Hard Boundaries |
| :--- | :--- | :--- | :--- |
| `creator` | `gemini-4-carbon-low` | Direct user-facing prompt creation, live workbench test renders, structured handoff JSON + `walkthrough.md` | Never edits repo code or `SKILL.md`; talks directly with user and reports `[done]` to `@coordinator` with handoff paths |
| `physics-reviewer` | inherit | Second-pass visual/physical plausibility review (`read_file` on real renders), spatial structure optimization (`v2_physics.json`), post-audit zero-regression sign-off | Read-only on `web/src/`; never edits code |
| `prompt-auditor` | inherit | Real-compiler T5 audit (`storyEngine.ts` + `verify_engine.ts` M6-Tune2 / Multi-Box / 4-gender), `<=7`-word tag splitting, minimal zero-truncation trimming (`v3_audited.json`) | Read-only on `web/src/`; **never over-trim spatial/physical/POV anchors when budget already fits**; hands off trimmed `v3` to `@physics-reviewer` |
| `after-reviewer` | inherit | Post-integration live render QA: diffs `v1 → v2 → v3 → live get_state`, triggers real renders on `http://127.0.0.1:17890/api/rpc`, compares against `creator` previews, drives joint tuning until PASS | Read-only on `web/src/`; never edits code |
| `skill-optimizer` | inherit | Exclusively owns `.agents/skills/*/SKILL.md` (pure craft guides, zero SKU IDs, zero code/file/enum leaks, no redundant `references/*_catalog.md`) | Never edits `web/src/` |
| `frontend-dev` | inherit | Owns `web/src/` (UI, engine, data, services), `web/scripts/verify_engine.ts`, and root `NovelAI_Workbench.html` sync (`verify` → `build` → copy) | **Never trims/rewrites prompt text to pass `verify`**; drops in audited JSON verbatim and bounces any overflow back to `@coordinator` |
| `mcp-optimizer` | inherit | Owns `web/src/mcp/naiStudioMcpServer.ts`, `web/src/services/mcpBridgeClient.ts`, `.agents/plugins/nai-studio-bridge/` | Coordinates browser-side UI/engine changes with `@frontend-dev` and restarts with `@server-mantainer` |
| `server-mantainer` | inherit | Local `17890` primary MCP bridge restart & health checks; remote deployment (`ssh tskg@kangetsu.online -p 9097`, port `18080`) | Never edits frontend business logic; **never uploads `nai_api_config.json` or API tokens** |

### Startup Checklist
1. Load `native_swarm` and `swarm_pane`.
2. Name the swarm: `swarm{action:"title", title:"NovelAI Studio 2.0 常驻开发基线"}`.
3. Add all 8 workers in parallel (pin `creator` to `gemini-4-carbon-low`; omit `model` for the other 7; include the no-`swarm add` and file-ownership rules in every brief).
4. Write `<appData>/brain/<conversation-id>/.system_generated/swarm/plan.json` grouping workers into two outcome threads (`Prompt Creation, Physics, Audit, Live QA & Skills` and `Workbench, MCP Bridge & Server Deployment`).
5. End the startup reply with the exact `open_board` link on its own line.

---

## 2. Post-`creator` 5-Stage Delivery Pipeline (with Live QA Gate)

Whenever `creator` posts `@coordinator [done]` with a new scene pack / handoff JSON and test renders, automatically run this pipeline:

1. **Stage 1 — `physics-reviewer` (Visual & Spatial Review)**
   - Inspect every test image (`read_file`) + handoff JSON + `walkthrough.md`.
   - Fix spatial geometry, camera/POV occlusion, limb/hand conservation, garment/fluid gravity, and row-agnostic lighting leaks.
   - Output `v2_physics.json` + review report in its `scratch/` directory and report `@coordinator [done]`.
2. **Stage 2 — `prompt-auditor` → `physics-reviewer` (Real-Compiler Audit & Dual Sign-Off)**
   - Audit `v2_physics.json` against the **real `storyEngine.ts` + `verify_engine.ts` compiler overhead** (M6-Tune2 + `SF_BASE_CEL_LIGHT` + `V5_HEAVY_UC_BASE` + 4-gender + Multi-Box ~230–260 tok fixed overhead).
   - Hard pass criteria:
     - `0` unweighted tags with `>= 8` words (split all to `<= 7` words);
     - `0` nested `::`, negative-channel `w::...::`, hardcoded eye/hair colors, or pos/neg collisions;
     - `0` `prose` truncations (`TRIMMED_PROMPTS_COUNT = 0`, `maxPos <= 500` SingleBox / `<= 490` MultiBox, `maxNeg <= 512`).
   - **Anti-Over-Trimming Rule**: Only trim scenes that actually exceed real M6-Tune2 / 4-gender limits or hit collisions; **never** strip spatial/physical/POV anchors when budget already fits.
   - Output `v3_audited.json` and hand off directly to `@physics-reviewer` to verify **100% zero spatial/physical regression**; `physics-reviewer` reports `@coordinator [done]`.
3. **Stage 3 — `frontend-dev` ∥ `skill-optimizer` (Parallel, Zero File Overlap)**
   - `frontend-dev`: drop `v3_audited.json` in **verbatim** (zero self-trimming), wire engine/UI/MCP/`verify_engine.ts`, run `npm --prefix web run verify` → `npm --prefix web run build` → copy `web/dist/index.html` to root `NovelAI_Workbench.html` (verify SHA-256), then hand off to `@server-mantainer` for **local `17890` refresh first** (hold remote `18080` until live QA passes).
   - `skill-optimizer`: distill validated craft rules into pure craft `.agents/skills/<scene>/SKILL.md` (zero SKU IDs or code leaks) and report `@coordinator [done]`.
4. **Stage 4 — `server-mantainer` (Local `17890` Refresh) → Coordinator Browser Reload**
   - `server-mantainer` restarts local primary MCP bridge (`0.0.0.0:17890`), verifies `GET /` SHA-256, `/health`, `tools/list`, and `nai_list_options`, and reports `@coordinator [done]`.
   - Coordinator reloads the open built-in browser tab (`http://127.0.0.1:17890/`) so the new JS bundle is active in memory.
5. **Stage 5 — `after-reviewer` (Post-Integration Live QA Gate) → Remote `18080` Release**
   - `after-reviewer` diffs `v1 → v2 → v3 → live get_state` and triggers live test renders (`trigger_generate`) on key/modified scenes via `http://127.0.0.1:17890/api/rpc`, visually comparing (`read_file`) against `creator`'s previews.
   - **If any regression is found**: immediately run a targeted joint tuning loop (`physics-reviewer` → `prompt-auditor` [no over-trim] → `frontend-dev` → `server-mantainer` local `17890` → browser reload → `after-reviewer` re-render) until PASS.
   - **Once `after-reviewer` signs off PASS**: dispatch `server-mantainer` to atomically deploy `NovelAI_Workbench.html` to remote `tskg@kangetsu.online:18080` and verify remote SHA-256.

---

## 3. Agent-Managed Workbench & Swarm MCP Architecture

- **Swarm Worker MCP Access**: Antigravity Swarm runtime injects native `nai_*` MCP tools only into the Coordinator, not into Swarm workers. Workers (such as `creator` and `after-reviewer`) control the live workbench directly via loopback HTTP RPC (`POST http://127.0.0.1:17890/api/rpc`), which has 100% parity with all 10 `nai_*` tools, zero startup cost, and proxy-immune loopback handling.
- **Same-Origin Hosting & Proxy (`17890`)**:
  - `http://127.0.0.1:17890/` natively serves root `NovelAI_Workbench.html` and exposes allowlisted `/api/nai-proxy/{image|api}/*` routed through `nai_api_config.json`'s `proxy` via native Node `CONNECT`+TLS tunneling.
  - `naiApiClient.ts` activates same-origin `/api/nai-proxy/*` **only** when served on port `17890`; standalone `file://` opening remains 100% direct.
- **Agent Built-In Browser Keep-Alive**:
  - Open `http://127.0.0.1:17890/` in the built-in `browser` subagent (`Model: "flash"`) and leave the tab open (eliminates external Chrome Sleeping Tabs freezes and built-in browser `ERR_CERT_COMMON_NAME_INVALID`).
  - Always reload the built-in browser tab after `server-mantainer` restarts `17890` with a new `NovelAI_Workbench.html` build so the in-memory JS bundle stays in sync.
  - Note: the built-in browser uses an isolated `localStorage` origin; API Token must be entered once (or injected from `nai_api_config.json` with explicit user approval, never echoing secrets).

---

## 4. Remote Server Deployment Contract

- **Target**: `ssh tskg@kangetsu.online -p 9097`, port `18080`, directory `/home/tskg/novelai-workbench/`.
- **Security**: Upload **only** `NovelAI_Workbench.html` (and lightweight static server `server.py`); **never** upload `nai_api_config.json` or any API token.
- **Verification**: Confirm persistent daemon (`~/novelai-workbench/server.pid`, survives across SSH sessions), `curl http://127.0.0.1:18080/health` returns `200`, and remote `GET /` SHA-256 matches local `NovelAI_Workbench.html` 100%.
