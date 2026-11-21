---
name: nai-prompt-cleaner
description: >-
  Cleans, deduplicates, fixes common Danbooru tag typos, strips legacy weight
  wrappers when requested, and optionally organizes raw NovelAI tag dumps into
  reusable Markdown palettes.
---

# NovelAI Prompt Cleaner & Tag Organizer

Use this utility skill when the user wants messy NovelAI tag dumps sanitized, deduplicated, weight-stripped, or organized into reusable tag palettes.

## 1. Input Sanitization Rules

1. **Normalize Delimiters**: Replace full-width commas (`，`) and repeated empty commas (`, ,`) with clean `, `.
2. **Handle Weight Wrappers per Intent**:
   - Strip legacy V3 brackets (`{...}`, `[...]`) and V4/V5 numeric weights (`w::...::`) when building pure unweighted tag pools, or convert `{}`/`[]` into clean V4/V5 `w::...::` syntax when preparing ready-to-run prompts (preserving any intentional natural-language T5 prose).
3. **Fix Common Danbooru Tag Typos & Redundancies**:
   - `from blow` -> `from below`
   - `standing, position` -> `standing`
   - `kneeling position` -> `kneeling`
   - `spooning position` -> `spooning`
   - Drop placeholder tokens like bare `location` and redundant subject duplicates (`1girl` + `girl`).

## 2. Match Output Format to the User's Request

- **Quick / Inline Cleanup**: When the user asks to clean up a single prompt for immediate creative use, return the sanitized prompt directly without extra wrapper sections or file overhead.
- **Optional Structured Library Layout (Default When Organizing Large Tag Dumps)**:
  When turning large raw tag collections into a Markdown reference library (and the user hasn't asked for a different layout), a clean two-pillar grouping works well:
  - **一、人物状态 (Character State)**:
    1. 表情与神态 (Expressions & Gaze)
    2. 姿势与动作 (Poses & Actions)
    3. 身体细节与状态 (Body Details & States)
  - **二、场景与全局表现 (Scene & Global Presentation)**:
    1. 场景与光影氛围 (Environment, Lighting & Mood)
    2. 镜头与构图 (Composition & Camera)
    3. 画风与质感修饰 (Art Style & Rendering)
  - Within a library, you may include an unweighted deduplicated tag pool alongside optional weighted combination snippets or non-standard phrase mappings where helpful.
