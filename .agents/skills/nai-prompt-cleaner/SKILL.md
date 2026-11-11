---
name: nai-prompt-cleaner
description: >-
  Cleans, deduplicates, and modularizes raw NovelAI prompt dumps into structured
  Character State and Scene & Global Presentation categories. Use this skill when
  the user wants to strip weights, fix punctuation/typos, or organize raw AI art
  tags from text files into reusable Markdown libraries.
---

# NovelAI Prompt Cleaner & Modularizer

Use this skill to extract, sanitize, and categorize messy or raw NovelAI prompts into clean, modular Markdown libraries.

## Workflow Steps

1. **Sanitize Raw Input**:
   - Replace full-width Chinese commas (`，`) and repeated empty commas (`, ,`) with standard `, `.
   - Strip legacy V3 bracket weights (`{...}`, `[...]`) and V4 numeric weights (`N::...::`) when building pure tag pools, while preserving original weights in separate preset templates.
   - Fix common Danbooru tag typos:
     - `from blow` -> `from below`
     - `standing, position` -> `standing`
     - `kneeling position` -> `kneeling`
     - `spooning position` -> `spooning`
     - Remove stray placeholder tokens like standalone `location` or duplicate subject tags (`1girl` + `girl`).

2. **Two-Pillar Hierarchical Categorization**:
   Always organize extracted tags into a **single Markdown file** (unless explicitly asked for multiple files) divided into two top-level sections:
   - **一、人物状态 (Character State)**:
     1. 表情与神态 (Expressions & Gaze)
     2. 姿势与动作 (Poses & Actions)
     3. 身体细节与体液状态 (Body Details & Fluids)
   - **二、场景与全局表现 (Scene & Global Presentation)**:
     1. 场景与天气时间 (Environment, Weather & Time)
     2. 镜头与构图 (Composition & Camera)
     3. 画面风格与画质起手式 (Art Style & Quality)

3. **Provide Dual Formats per Category**:
   - **汇总词库（无权重）**: Deduplicated, comma-separated clean tags inside a fenced `text` code block.
   - **细分拆解 / 组合模板**: Logical sub-groups (preserving effective weights) for quick copy-paste assembly, plus a small table mapping non-standard natural phrases to canonical Danbooru tags where applicable.
