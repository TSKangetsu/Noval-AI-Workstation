# -*- coding: utf-8 -*-
"""
NovelAI V4.5 / V5 三维球面机位编译器与冲突清洗引擎 (camera_rig.py)
将 GUI 3D 机位雷达盘的连续球面坐标 (Azimuth 水平环绕角, Elevation 垂直俯仰角)、
景别焦距 (Shot Size)、广角透视 (Foreshortening)、荷兰斜角 (Dutch Angle) 与视线模式 (Gaze)
编译为精准加权的 Danbooru 镜头词条 + T5 镜头描述前缀，并自动清洗原幕中的冲突机位正/负向词。
"""

from __future__ import annotations

import re
from typing import Dict, List, Tuple

CAMERA_SHOT_PRESETS: Dict[str, str] = {
    "随原幕景别": "auto",
    "面部特写 (Close-up)": "extreme_closeup",
    "近景半身 (Upper Body)": "upper_body",
    "中景七分 (Cowboy Shot)": "cowboy",
    "全身全景 (Full Body)": "full_body",
    "环境远景 (Wide Shot)": "wide_shot",
}

CAMERA_GAZE_PRESETS: Dict[str, str] = {
    "👁️ 始终看镜头（背后自动回眸）": "auto_look",
    "📌 保持本幕原有视线": "keep_scene",
    "🙈 自然不看镜头（沉浸旁观感）": "natural_away",
}

# 一键机位快捷胶囊：(按钮短名, azimuth_deg, elevation_deg, shot_key_or_None, wide_lens)
CAMERA_QUICK_PRESETS: List[Tuple[str, int, int, str | None, bool]] = [
    ("正面平视", 0, 0, None, False),
    ("前侧 3/4", 42, 12, None, False),
    ("正侧 90°", 90, 0, None, False),
    ("高机位俯拍", 25, 42, None, False),
    ("正顶鸟瞰", 0, 78, None, True),
    ("低机位仰拍", 0, -34, None, False),
    ("贴地大仰角", 15, -66, None, True),
    ("侧后 3/4", 138, 16, None, False),
    ("正后背影", 180, 8, None, False),
    ("后上方俯视", 165, 42, None, False),
]

# 需要被新方位/俯仰覆盖剥离的旧镜头方向词（小写匹配裸词）
_ANGLE_TAGS_TO_STRIP = {
    "pov",
    "pov hands",
    "pov crotch",
    "from above",
    "high angle",
    "overhead",
    "overhead shot",
    "top-down",
    "top-down view",
    "bird's-eye view",
    "from below",
    "low angle",
    "extreme low angle",
    "worm's-eye view",
    "eye-level",
    "front view",
    "frontal view",
    "straight-on",
    "three-quarter view",
    "three-quarter side view",
    "side three-quarter view",
    "frontal three-quarter view",
    "rear three-quarter view",
    "three-quarter rear view",
    "three-quarter rear shot",
    "three-quarter frontal shot",
    "three-quarter full-body shot",
    "three-quarter cowboy shot",
    "three-quarter close shot",
    "three-quarter high angle",
    "three-quarter low angle",
    "three-quarter high-angle cowboy shot",
    "side three-quarter close-up",
    "side three-quarter rear view",
    "overhead three-quarter view",
    "slight three-quarter angle",
    "angled view",
    "from side",
    "side view",
    "close side view",
    "landscape side view",
    "landscape view",
    "landscape three-quarter view",
    "profile",
    "from behind",
    "back",
    "back view",
    "rear view",
    "rear low angle",
    "rear close shot",
    "dutch angle",
    "tilted frame",
}

_SHOT_TAGS_TO_STRIP = {
    "full body",
    "frontal full-body shot",
    "eye-level full-body",
    "cowboy shot",
    "close cowboy shot",
    "eye-level",
    "upper body",
    "close-up",
    "close shot",
    "portrait",
    "face focus",
    "wide shot",
    "distant",
}

_GAZE_TAGS_TO_STRIP = {
    "looking at viewer",
    "looking back",
    "looking back at viewer",
    "looking back over shoulder",
    "looking back up",
    "looking back up at viewer",
    "over shoulder",
    "looking up",
    "looking up at viewer",
    "looking down",
    "looking down at viewer",
    "looking away",
}


def _fmt_w(tag: str, weight: float) -> str:
    w = round(max(0.5, min(2.0, weight)), 2)
    if abs(w - 1.0) < 0.04:
        return tag
    return f"{w:g}::{tag}::"


def describe_camera_short(
    enabled: bool,
    azimuth: int,
    elevation: int,
    shot_code: str = "auto",
    wide_lens: bool = False,
    dutch_angle: bool = False,
) -> str:
    """生成用于顶部状态胶囊与预览标题的简短中文机位描述"""
    if not enabled:
        return "🔄 随本幕默认"
    abs_az = abs(azimuth)
    side_ch = "右" if azimuth > 0 else ("左" if azimuth < 0 else "")
    if abs_az <= 22:
        az_lbl = "正前"
    elif abs_az <= 67:
        az_lbl = f"{side_ch}前3/4"
    elif abs_az <= 112:
        az_lbl = f"{side_ch}正侧"
    elif abs_az <= 157:
        az_lbl = f"{side_ch}后3/4"
    else:
        az_lbl = "正后"

    if elevation >= 62:
        el_lbl = f"顶视+{elevation}°"
    elif elevation >= 20:
        el_lbl = f"俯拍+{elevation}°"
    elif elevation <= -55:
        el_lbl = f"虫视{elevation}°"
    elif elevation <= -18:
        el_lbl = f"仰拍{elevation}°"
    else:
        el_lbl = "平视"

    extras: List[str] = []
    shot_map = {
        "extreme_closeup": "特写",
        "upper_body": "半身",
        "cowboy": "七分身",
        "full_body": "全身",
        "wide_shot": "远景",
    }
    if shot_code in shot_map:
        extras.append(shot_map[shot_code])
    if wide_lens:
        extras.append("广角")
    if dutch_angle:
        extras.append("斜角")
    tail = f"·{'/'.join(extras)}" if extras else ""
    return f"{az_lbl}({azimuth:+d}°)·{el_lbl}{tail}"


def compile_camera_rig(
    azimuth: int,
    elevation: int,
    shot_code: str = "auto",
    wide_lens: bool = False,
    dutch_angle: bool = False,
    gaze_code: str = "auto_look",
) -> Dict[str, object]:
    """
    将连续球面相机参数编译为：
    - pos_tags: List[str] 正向镜头词
    - neg_add: List[str] 需要加入负向屏蔽的冲突方向词
    - neg_unblock: set[str] 需要从原幕负向中解除封锁的词
    - prose_prefix: str 注入 T5 描述句开头的英文镜头锚点
    """
    az = max(-180, min(180, int(azimuth)))
    el = max(-80, min(85, int(elevation)))
    abs_az = abs(az)

    pos_tags: List[str] = []
    neg_add: List[str] = []
    neg_unblock: set[str] = set()

    # 1. 水平环绕角 Azimuth
    if abs_az <= 22:
        pos_tags.extend([_fmt_w("front view", 1.35), "straight-on"])
        neg_add.extend(["from behind", "back", "profile"])
        neg_unblock.update({"front view", "straight-on"})
        az_prose = "frontal straight-on"
    elif abs_az <= 67:
        w = 1.3 + 0.1 * ((abs_az - 22) / 45.0)
        pos_tags.append(_fmt_w("three-quarter view", w))
        neg_add.extend(["from behind", "straight-on"])
        neg_unblock.update({"three-quarter view", "from side"})
        side_word = "right" if az > 0 else "left"
        az_prose = f"front-three-quarter ({side_word} side)"
    elif abs_az <= 112:
        w = 1.45 - 0.1 * (abs(abs_az - 90) / 22.0)
        pos_tags.extend([_fmt_w("from side", w), _fmt_w("side view", 1.3), "profile"])
        neg_add.extend(["front view", "straight-on", "from behind"])
        neg_unblock.update({"from side", "side view", "profile"})
        side_word = "right" if az > 0 else "left"
        az_prose = f"strict {side_word}-side profile"
    elif abs_az <= 157:
        pos_tags.extend([_fmt_w("from behind", 1.35), _fmt_w("from side", 1.25), "three-quarter rear view", "back"])
        neg_add.extend(["front view", "straight-on"])
        neg_unblock.update({"from behind", "back", "from side", "profile"})
        side_word = "right" if az > 0 else "left"
        az_prose = f"rear-three-quarter ({side_word} back)"
    else:
        pos_tags.extend([_fmt_w("from behind", 1.45), _fmt_w("back", 1.3), "rear view"])
        neg_add.extend(["front view", "straight-on", "profile"])
        neg_unblock.update({"from behind", "back", "rear view"})
        az_prose = "direct rear-view"

    # 2. 垂直俯仰角 Elevation
    if el >= 62:
        t = (el - 62) / 23.0
        pos_tags.extend([_fmt_w("from above", 1.45 + 0.15 * t), _fmt_w("bird's-eye view", 1.35 + 0.15 * t), "overhead shot"])
        neg_add.extend(["from below", "low angle", "worm's-eye view"])
        neg_unblock.update({"from above", "high angle", "bird's-eye view", "overhead"})
        el_prose = "steep overhead bird's-eye"
    elif el >= 20:
        t = (el - 20) / 42.0
        pos_tags.extend([_fmt_w("from above", 1.25 + 0.2 * t), _fmt_w("high angle", 1.2 + 0.2 * t)])
        neg_add.extend(["from below", "low angle"])
        neg_unblock.update({"from above", "high angle"})
        el_prose = "high-angle downward"
    elif el <= -55:
        t = (abs(el) - 55) / 25.0
        pos_tags.extend([_fmt_w("from below", 1.45 + 0.15 * t), _fmt_w("worm's-eye view", 1.35 + 0.15 * t), "extreme low angle"])
        neg_add.extend(["from above", "high angle", "bird's-eye view"])
        neg_unblock.update({"from below", "low angle", "worm's-eye view"})
        el_prose = "extreme low worm's-eye upward"
    elif el <= -18:
        t = (abs(el) - 18) / 37.0
        pos_tags.extend([_fmt_w("from below", 1.25 + 0.2 * t), _fmt_w("low angle", 1.2 + 0.2 * t)])
        neg_add.extend(["from above", "high angle"])
        neg_unblock.update({"from below", "low angle"})
        el_prose = "low-angle upward"
    else:
        pos_tags.append("eye-level")
        neg_add.extend(["bird's-eye view", "worm's-eye view"])
        neg_unblock.add("eye-level")
        el_prose = "eye-level"

    # 3. 景别距离 Shot Size
    shot_prose = "camera shot"
    if shot_code == "extreme_closeup":
        pos_tags.extend([_fmt_w("close-up", 1.45), "portrait"])
        neg_add.extend(["full body", "wide shot", "distant"])
        neg_unblock.update({"close-up", "portrait"})
        shot_prose = "tight close-up shot"
    elif shot_code == "upper_body":
        pos_tags.extend([_fmt_w("upper body", 1.35), "close-up"])
        neg_add.extend(["full body", "wide shot", "distant"])
        neg_unblock.update({"upper body", "close-up"})
        shot_prose = "upper-body medium close-up"
    elif shot_code == "cowboy":
        pos_tags.append(_fmt_w("cowboy shot", 1.35))
        neg_add.extend(["close-up", "portrait", "wide shot"])
        neg_unblock.add("cowboy shot")
        shot_prose = "thighs-up cowboy shot"
    elif shot_code == "full_body":
        pos_tags.append(_fmt_w("full body", 1.4))
        neg_add.extend(["close-up", "portrait", "cropped legs"])
        neg_unblock.add("full body")
        shot_prose = "full-body framing"
    elif shot_code == "wide_shot":
        pos_tags.extend([_fmt_w("wide shot", 1.4), "full body", "distant"])
        neg_add.extend(["close-up", "portrait"])
        neg_unblock.update({"wide shot", "distant", "full body"})
        shot_prose = "wide-angle full-environment shot"

    # 4. 广角透视与荷兰角
    lens_clauses: List[str] = []
    if wide_lens:
        pos_tags.extend([_fmt_w("foreshortening", 1.4), "perspective", "wide-angle"])
        neg_unblock.update({"foreshortening", "perspective"})
        lens_clauses.append("dramatic wide-angle foreshortening")
    if dutch_angle:
        pos_tags.extend([_fmt_w("dutch angle", 1.35), "tilted frame"])
        neg_unblock.add("dutch angle")
        lens_clauses.append("tilted Dutch-angle framing")

    # 5. 视线跟随 Gaze
    gaze_tags: List[str] = []
    if gaze_code == "auto_look":
        if abs_az > 112:
            gaze_tags.extend([_fmt_w("looking back", 1.35), "over shoulder", "looking at viewer"])
            neg_unblock.update({"looking back", "looking at viewer"})
        elif el >= 25:
            gaze_tags.extend(["looking up", "looking at viewer"])
            neg_unblock.add("looking at viewer")
        elif el <= -25:
            gaze_tags.extend(["looking down", "looking at viewer"])
            neg_unblock.add("looking at viewer")
        else:
            gaze_tags.append("looking at viewer")
            neg_unblock.add("looking at viewer")
    elif gaze_code == "natural_away":
        gaze_tags.append("looking away")
        neg_add.append("looking at viewer")

    lens_tail = f", {', '.join(lens_clauses)}" if lens_clauses else ""
    shot_word = "" if shot_prose == "camera shot" else f" {shot_prose}"
    prose_prefix = f"{el_prose.capitalize()} {az_prose}{shot_word} view{lens_tail}: "

    return {
        "pos_tags": pos_tags,
        "gaze_tags": gaze_tags,
        "neg_add": neg_add,
        "neg_unblock": neg_unblock,
        "prose_prefix": prose_prefix,
    }


def _strip_bare_tag(raw_token: str) -> str:
    return re.sub(r"^-?\d+(?:\.\d+)?::|::$", "", raw_token.strip()).strip().lower()


def apply_camera_override_to_prompt(
    prompt_str: str,
    *,
    azimuth: int,
    elevation: int,
    shot_code: str = "auto",
    wide_lens: bool = False,
    dutch_angle: bool = False,
    gaze_code: str = "auto_look",
    eyes_closed_scene: bool = False,
) -> str:
    """
    在不破坏原提示词质量前缀、角色外观、动作骨架与 M6-Tune2 `-2.5::...::` 锁脸块的前提下，
    智能剥离旧镜头方向/景别词并注入新的 3D 球面机位词与冲突负向词。
    """
    if not prompt_str or prompt_str.startswith("[Base Prompt]"):
        return prompt_str

    effective_gaze = "keep_scene" if eyes_closed_scene else gaze_code
    rig = compile_camera_rig(
        azimuth=azimuth,
        elevation=elevation,
        shot_code=shot_code,
        wide_lens=wide_lens,
        dutch_angle=dutch_angle,
        gaze_code=effective_gaze,
    )
    pos_cam_tags: List[str] = list(rig["pos_tags"])  # type: ignore[arg-type]
    gaze_tags: List[str] = list(rig["gaze_tags"])  # type: ignore[arg-type]
    neg_add: List[str] = list(rig["neg_add"])  # type: ignore[arg-type]
    neg_unblock: set[str] = set(rig["neg_unblock"])  # type: ignore[arg-type]
    prose_prefix: str = str(rig["prose_prefix"])

    # 1. 分离内联负向块（保留 -2.5::...:: M6-Tune2 器官块原样不动，单独清洗主 -2::...:: 块）
    main_neg_body: str | None = None
    extra_neg_blocks: List[str] = []

    def _extract_neg(match: re.Match[str]) -> str:
        nonlocal main_neg_body
        lvl = match.group(1)
        body = match.group(2).strip(" ,")
        if "nose bridge, nostrils, lips" in body:
            # M6-Tune2 专用正向尾端锁脸块，原样保留
            extra_neg_blocks.append(f"{lvl}::{body}::")
        elif lvl == "-2" and main_neg_body is None:
            main_neg_body = body
        else:
            # 故事线幕次自带的 -2.5 姿态防崩块：同样解除与当前自定义新机位冲突的封锁词
            sub_tokens = [t.strip() for t in body.split(",") if t.strip()]
            sub_filtered = [t for t in sub_tokens if t.lower() not in neg_unblock]
            if sub_filtered:
                extra_neg_blocks.append(f"{lvl}::{', '.join(sub_filtered)}::")
        return ""

    pos_only = re.sub(r"(?:,\s*)?(-\d+(?:\.\d+)?)::(.*?)::", _extract_neg, prompt_str, flags=re.DOTALL).strip(" ,")

    # 2. 按逗号拆分正向词，定位末尾 T5 自然语言长句并剥离旧机位标签
    raw_parts = [p.strip() for p in pos_only.split(",") if p.strip()]
    strip_set = set(_ANGLE_TAGS_TO_STRIP)
    if shot_code != "auto":
        strip_set.update(_SHOT_TAGS_TO_STRIP)
    if effective_gaze != "keep_scene":
        strip_set.update(_GAZE_TAGS_TO_STRIP)

    # 检测末尾 T5 自然语言片段（含句号或长度较长的英文描述子句）
    prose_start_idx: int | None = None
    for i in range(len(raw_parts) - 1, -1, -1):
        seg = raw_parts[i]
        if "::" in seg and not seg.endswith("."):
            break
        if seg.endswith(".") or len(seg.split()) >= 6:
            prose_start_idx = i
        elif prose_start_idx is not None and len(seg.split()) >= 4:
            prose_start_idx = i
        else:
            break

    if prose_start_idx is not None:
        tag_segments = raw_parts[:prose_start_idx]
        prose_segment = ", ".join(raw_parts[prose_start_idx:])
    else:
        tag_segments = raw_parts
        prose_segment = ""

    cleaned_tags: List[str] = []
    insert_pos: int | None = None
    for seg in tag_segments:
        bare = _strip_bare_tag(seg)
        if bare in strip_set:
            if insert_pos is None:
                insert_pos = len(cleaned_tags)
            continue
        cleaned_tags.append(seg)

    if insert_pos is None:
        # 默认插在角色与背景之后（约第 4~6 个词位置）
        insert_pos = min(len(cleaned_tags), 5)

    injected = pos_cam_tags + gaze_tags
    existing_bares = {_strip_bare_tag(x) for x in cleaned_tags}
    dedup_injected = [t for t in injected if _strip_bare_tag(t) not in existing_bares]
    final_tags = cleaned_tags[:insert_pos] + dedup_injected + cleaned_tags[insert_pos:]

    if prose_segment:
        # 清洗原句中残留的旧方向措辞，防止与新 3D 球面镜头锚点冲突
        prose_clean_subs = [
            (r"\b(?:Close-up\s+)?First-person POV\s+(?:standing right behind|looking down)?\s*", ""),
            (r"\bFull-body angled rear-side view of\s*", ""),
            (r"\bFrontal cowboy shot of\s*", ""),
            (r"\bAngled missionary view\b", ""),
            (r"\b(?:seen|viewed|captured|shot) from behind,?\s*", ""),
            (r"\bfrom a (?:steep )?(?:low|high) angle\b", ""),
            (r"\bin three-quarter side view,?\s*", ""),
        ]
        for pat, rep in prose_clean_subs:
            prose_segment = re.sub(pat, rep, prose_segment, flags=re.IGNORECASE)
        prose_segment = re.sub(r"\s{2,}", " ", prose_segment).replace(" .", ".")

        if ":" in prose_segment and prose_segment.index(":") < 180:
            # 画风已自带长前缀（如 M6 / M6-Tune2 / PVC），使用精简镜头短锚点防止极端长幕突破 512 Token
            colon_i = prose_segment.index(":")
            head_p = prose_segment[: colon_i + 1]
            tail_p = prose_segment[colon_i + 1 :].strip()
            short_prefix = prose_prefix.split(",")[0].rstrip(": ") + ", "
            prose_segment = f"{head_p} {short_prefix}{tail_p}"
        else:
            prose_segment = f"{prose_prefix}{prose_segment}"
        prose_segment = prose_segment.replace("a eye-level", "an eye-level")
        final_tags.append(prose_segment)

    # 3. 更新主负向块（解除新机位词的封锁，并压入反向冲突机位词）
    if main_neg_body is not None:
        neg_tokens = [t.strip() for t in main_neg_body.split(",") if t.strip()]
        filtered_neg = [t for t in neg_tokens if t.lower() not in neg_unblock]
        lower_existing = {t.lower() for t in filtered_neg}
        for na in neg_add:
            if na.lower() not in lower_existing and na.lower() not in neg_unblock:
                filtered_neg.insert(0, na)
                lower_existing.add(na.lower())
        if filtered_neg:
            final_tags.append(f"-2::{', '.join(filtered_neg)}::")
    elif neg_add:
        # 若用户未关闭负向，但原幕无 -2 块时不强加（尊重外层 neg_on 控制）
        pass

    final_tags.extend(extra_neg_blocks)
    return ", ".join(final_tags)
