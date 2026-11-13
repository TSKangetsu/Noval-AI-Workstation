# -*- coding: utf-8 -*-
"""
全体位生成器配置库 (position_library.py)
提供 8 大姿态家族共 44 种标准体位模板、NovelAI V5 原生透明背景处理、
男方四态开关（正常/半透明虚影/完全隐形/单人关闭）以及隐藏男方器官时的私处/使用部位状态保持逻辑。
支持同目录下可选 `custom_positions.json` 扩展或覆盖模板。
"""

from __future__ import annotations

import json
import os
import re
from typing import Dict, List, Tuple

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CUSTOM_POSITIONS_FILE = os.path.join(BASE_DIR, "custom_positions.json")

POS_MALE_MODE_PRESETS: Dict[str, str] = {
    "👤 正常显示男方（默认无脸男 faceless male）": "normal",
    "👻 半透明虚影男方（不遮挡女方身体 silhouette）": "translucent",
    "🫥 完全隐形男方（空气互动感 invisible partner）": "invisible",
    "🚫 关闭男方（纯单人 1girl, solo · 保留姿势）": "off",
}

POS_CATEGORIES: List[str] = [
    "全部体位 (All)",
    "1. 仰卧·传教士系",
    "2. 女上位·骑乘坐姿系",
    "3. 后入·俯卧跪趴系",
    "4. 侧卧·汤匙交叉系",
    "5. 站立·悬空抱举系",
    "6. 口部·上半身特写系",
    "7. 外部部位·胸足腿手系",
    "8. 柔韧进阶·展示系",
]

# 44 项标准体位定义：
# 字段：(id, title, category, channel, canvas, pose_pov, pose_3rd, prose_core)
_RAW_POSITIONS: List[Tuple[str, str, str, str, str, str, str, str]] = [
    # === 1. 仰卧·传教士系 ===
    (
        "P01",
        "P01 · 标准仰卧传教士位 (Classic Supine)",
        "1. 仰卧·传教士系",
        "vaginal",
        "竖图 832x1216",
        "1.25::from above::, lying on back, spread legs, arms above head, looking at viewer",
        "three-quarter view, high angle, lying on back, spread legs, knees bent, looking at viewer",
        "lying on her back with her legs parted and gazing up",
    ),
    (
        "P02",
        "P02 · 双腿高举V字仰卧位 (Legs-Up Supine)",
        "1. 仰卧·传教士系",
        "vaginal",
        "竖图 832x1216",
        "from above, lying on back, 1.35::legs up::, v-shaped legs, bare legs raised high, looking at viewer",
        "side three-quarter view, lying on back, 1.35::legs up::, ankles raised high in a V-shape",
        "lying on her back with both legs raised high in a V-shape",
    ),
    (
        "P03",
        "P03 · 屈膝压胸深折位 (Folded Press)",
        "1. 仰卧·传教士系",
        "vaginal",
        "竖图 832x1216",
        "1.3::from above::, lying on back, 1.4::folded::, knees to chest, ankles near shoulders, tilted hips, looking at viewer",
        "side view, lying on back, 1.4::folded::, knees pressed toward chest, raised pelvis",
        "lying folded on her back with her knees pressed close to her chest and hips tilted upward",
    ),
    (
        "P04",
        "P04 · 双腿盘腰紧扣位 (Leg-Lock Embrace)",
        "1. 仰卧·传教士系",
        "vaginal",
        "竖图 832x1216",
        "close-up, from above, lying on back, 1.35::leg lock::, ankles crossed, arms outstretched, looking at viewer",
        "three-quarter high angle, lying on back, 1.35::leg lock::, legs wrapped around waist, embrace",
        "lying on her back with her legs locked inward in a close embrace",
    ),
    (
        "P05",
        "P05 · 单腿高抬侧展仰卧位 (Single-Leg-Up)",
        "1. 仰卧·传教士系",
        "vaginal",
        "竖图 832x1216",
        "from above, lying on back, 1.35::one leg up::, asymmetrical legs, spread thigh, looking at viewer",
        "three-quarter view, lying on back, 1.35::one leg up::, one knee bent flat, asymmetric leg posture",
        "lying on her back with one leg lifted high and the other extended",
    ),
    (
        "P06",
        "P06 · 边缘垂臀仰卧蝴蝶位 (Edge Reclining)",
        "1. 仰卧·传教士系",
        "vaginal",
        "竖图 832x1216",
        "eye-level, lying on back, hips at edge, knees bent wide apart, arched waist, looking at viewer",
        "three-quarter low angle, reclining on back at edge, knees open wide, arched lower back",
        "reclining on her back at the edge with her hips forward and knees parted",
    ),
    (
        "P07",
        "P07 · 抬臀反弓仰卧位 (Elevated Pelvis)",
        "1. 仰卧·传教士系",
        "vaginal",
        "横图 1216x832",
        "high angle, lying on back, elevated hips, 1.3::arched back::, spread knees, hands gripping sheet",
        "side three-quarter view, lying on back, elevated pelvis, 1.3::arched back::, bent knees apart",
        "lying on her back with her pelvis elevated and lower back arched",
    ),

    # === 2. 女上位·骑乘坐姿系 ===
    (
        "P08",
        "P08 · 标准跪姿女上位 (Kneeling Cowgirl)",
        "2. 女上位·骑乘坐姿系",
        "vaginal",
        "竖图 832x1216",
        "low angle, from below, 1.35::girl on top::, straddling, kneeling, upright torso, looking down at viewer",
        "three-quarter low angle, 1.35::girl on top::, straddling, kneeling upright, hands on thighs",
        "kneeling upright in a straddling top posture while looking down",
    ),
    (
        "P09",
        "P09 · 蹲踞开脚骑乘位 (Squatting Cowgirl)",
        "2. 女上位·骑乘坐姿系",
        "vaginal",
        "竖图 832x1216",
        "low angle, from below, 1.4::squatting::, girl on top, straddling, wide knees, soles flat, looking down at viewer",
        "frontal three-quarter view, 1.4::squatting::, girl on top, straddling with wide-set knees",
        "squatting in a wide-knee straddling posture on top",
    ),
    (
        "P10",
        "P10 · 前倾伏胸贴面女上位 (Leaning-Forward Top)",
        "2. 女上位·骑乘坐姿系",
        "vaginal",
        "竖图 832x1216",
        "close-up, low angle, girl on top, straddling, 1.35::leaning forward::, arms forward, close face, looking at viewer",
        "three-quarter cowboy shot, girl on top, straddling, 1.35::leaning forward::, arched spine",
        "straddling on top while leaning closely forward",
    ),
    (
        "P11",
        "P11 · 后仰双手向后撑女上位 (Leaning-Back Arch Top)",
        "2. 女上位·骑乘坐姿系",
        "vaginal",
        "竖图 832x1216",
        "low angle, from below, girl on top, straddling, 1.35::leaning back::, arched back, arms supporting behind, head tilted back",
        "side three-quarter view, girl on top, straddling, 1.35::leaning back::, hands braced behind, arched torso",
        "straddling on top while leaning back on both hands with an arched spine",
    ),
    (
        "P12",
        "P12 · 背向跪姿反向骑乘位 (Reverse Cowgirl)",
        "2. 女上位·骑乘坐姿系",
        "vaginal",
        "竖图 832x1216",
        "low angle, 1.35::from behind::, girl on top, reverse straddle, kneeling, back, 1.3::looking back::, over shoulder",
        "rear three-quarter view, girl on top, reverse straddle, kneeling, arched back, looking back over shoulder",
        "kneeling in a reverse straddling posture seen from behind while glancing over her shoulder",
    ),
    (
        "P13",
        "P13 · 背向蹲踞开脚骑乘位 (Reverse Squatting Top)",
        "2. 女上位·骑乘坐姿系",
        "vaginal",
        "竖图 832x1216",
        "low angle, 1.35::from behind::, 1.4::squatting::, girl on top, reverse straddle, knees wide, looking back",
        "rear low angle, 1.4::squatting::, girl on top, reverse straddle, back view, looking back",
        "squatting with wide knees in a reverse straddling posture seen from behind",
    ),
    (
        "P14",
        "P14 · 面对面怀抱坐莲位 (Seated Lotus)",
        "2. 女上位·骑乘坐姿系",
        "vaginal",
        "竖图 832x1216",
        "close cowboy shot, 1.35::upright straddle::, sitting on lap, face-to-face, arms around neck, looking at viewer",
        "three-quarter view, 1.35::upright straddle::, sitting on lap, wrapped legs, close embrace",
        "sitting upright face-to-face on a lap with her legs wrapped inward",
    ),
    (
        "P15",
        "P15 · 背靠怀抱坐姿观音位 (Reverse Seated Lap)",
        "2. 女上位·骑乘坐姿系",
        "vaginal",
        "竖图 832x1216",
        "high angle, sitting on lap, leaning back, spread thighs, knees up, looking back up at viewer",
        "frontal view, sitting on lap from behind, leaning back, 1.35::spread legs::, knees raised, looking at viewer",
        "sitting leaned back with her knees raised and thighs parted toward the front",
    ),
    (
        "P16",
        "P16 · 跨坐控腿主导女上位 (Amazon Top)",
        "2. 女上位·骑乘坐姿系",
        "vaginal",
        "竖图 832x1216",
        "low angle, from below, girl on top, squatting forward, dominant posture, hands forward, looking down at viewer",
        "three-quarter view, amazon posture, girl straddling forward in a deep squat, looking at viewer",
        "straddling forward in a deep dominant squat while looking down",
    ),

    # === 3. 后入·俯卧跪趴系 ===
    (
        "P17",
        "P17 · 标准四肢跪趴后入位 (Classic All-Fours)",
        "3. 后入·俯卧跪趴系",
        "vaginal",
        "横图 1216x832",
        "1.35::from behind::, 1.3::all fours::, kneeling, arched back, raised hips, 1.3::looking back::, over shoulder",
        "side three-quarter rear view, 1.3::all fours::, kneeling, arched lower back, looking back at viewer",
        "on all fours with an arched lower back while looking back over her shoulder",
    ),
    (
        "P18",
        "P18 · 塌腰贴胸高翘臀位 (Top-Down Bottom-Up)",
        "3. 后入·俯卧跪趴系",
        "vaginal",
        "横图 1216x832",
        "1.35::from behind::, 1.4::top-down bottom-up::, chest down, forearms down, hips high, arched spine, looking back",
        "side three-quarter view, 1.4::top-down bottom-up::, chest pressed low, raised hips, looking back",
        "resting her chest low on her forearms with her hips raised high and spine arched",
    ),
    (
        "P19",
        "P19 · 平趴贴身俯卧位 (Flat Prone)",
        "3. 后入·俯卧跪趴系",
        "vaginal",
        "横图 1216x832",
        "high angle, 1.35::from behind::, 1.35::lying on stomach::, prone, slightly parted legs, head turned back, looking at viewer",
        "side three-quarter view, 1.35::lying on stomach::, flat prone posture, head resting on arms, looking at viewer",
        "lying flat on her stomach with her head turned back toward the viewer",
    ),
    (
        "P20",
        "P20 · 直立跪姿背拉手后入位 (Upright Kneeling Rear)",
        "3. 后入·俯卧跪趴系",
        "vaginal",
        "竖图 832x1216",
        "1.3::from behind::, kneeling upright, 1.3::arms behind back::, arched chest, head turned over shoulder, looking at viewer",
        "three-quarter side-rear view, kneeling upright, arms pulled back, arched posture, looking back",
        "kneeling upright with her arms drawn back and chest arched while glancing over her shoulder",
    ),
    (
        "P21",
        "P21 · 站立扶撑弯腰后入位 (Standing Bent-Over)",
        "3. 后入·俯卧跪趴系",
        "vaginal",
        "竖图 832x1216",
        "1.35::from behind::, standing, 1.35::bent over::, supporting hands forward, parted legs, looking back over shoulder",
        "three-quarter rear view, standing, 1.35::bent over::, torso leaned forward, one heel slightly raised, looking back",
        "standing bent forward with hands braced ahead while looking back over her shoulder",
    ),
    (
        "P22",
        "P22 · 蛙式屈膝俯卧开胯位 (Frog-Leg Prone)",
        "3. 后入·俯卧跪趴系",
        "vaginal",
        "横图 1216x832",
        "high angle, from behind, lying on stomach, bent knees spread wide, soles upward, looking back",
        "three-quarter overhead rear view, lying on stomach, frog-leg bent knees apart, looking back",
        "lying prone on her stomach with both knees bent outward to the sides",
    ),

    # === 4. 侧卧·汤匙交叉系 ===
    (
        "P23",
        "P23 · 侧卧汤匙贴背位 (Spooning Side)",
        "4. 侧卧·汤匙交叉系",
        "vaginal",
        "横图 1216x832",
        "close side view, 1.35::lying on side::, curled knees, head on pillow, looking back at viewer",
        "landscape view, 1.35::lying on side::, spooning posture, knees drawn up, looking at viewer",
        "lying on her side with her knees gently drawn up while glancing back",
    ),
    (
        "P24",
        "P24 · 侧卧单腿高抬展开位 (Side Leg-Raised)",
        "4. 侧卧·汤匙交叉系",
        "vaginal",
        "横图 1216x832",
        "three-quarter view, 1.3::lying on side::, 1.35::one leg raised::, open hip, supporting on elbow, looking at viewer",
        "landscape three-quarter view, lying on side, upper leg lifted high, open posture, looking at viewer",
        "lying on her side propped on one elbow with her upper leg lifted high",
    ),
    (
        "P25",
        "P25 · 侧身交错剪刀位 (Lateral Crossed)",
        "4. 侧卧·汤匙交叉系",
        "vaginal",
        "横图 1216x832",
        "high angle, reclining on side, 1.3::crossed legs::, asymmetrical open thighs, looking up at viewer",
        "overhead three-quarter view, reclining laterally with interlocked angled legs, looking at viewer",
        "reclining laterally with angled parted thighs while looking toward the viewer",
    ),

    # === 5. 站立·悬空抱举系 ===
    (
        "P26",
        "P26 · 站立面对面单腿挂腰壁咚位 (Standing Leg-Up)",
        "5. 站立·悬空抱举系",
        "vaginal",
        "竖图 832x1216",
        "close cowboy shot, standing, face-to-face, 1.35::one leg lifted::, arms forward, looking at viewer",
        "three-quarter full-body shot, standing face-to-face, one leg hooked high at hip level, looking at viewer",
        "standing upright face-to-face with one leg lifted high at hip level",
    ),
    (
        "P27",
        "P27 · 面对面悬空抱举火车便当位 (Suspended Ekiben)",
        "5. 站立·悬空抱举系",
        "vaginal",
        "竖图 832x1216",
        "close shot, 1.4::lifted::, feet off ground, legs wrapped around waist, arms around neck, looking at viewer",
        "three-quarter full-body shot, 1.4::carried::, suspended in air face-to-face, legs wrapped high, feet off ground",
        "carried suspended in mid-air face-to-face with her arms around the neck and feet off the ground",
    ),
    (
        "P28",
        "P28 · 背向悬空抱举正面开脚位 (Reverse Ekiben)",
        "5. 站立·悬空抱举系",
        "vaginal",
        "竖图 832x1216",
        "high angle, carried from behind, knees lifted wide, feet dangling, looking back up at viewer",
        "frontal full-body shot, 1.4::carried from behind::, facing viewer, lifted under knees in a wide M-shape, feet off ground",
        "lifted in mid-air from behind facing forward with both knees held wide apart",
    ),
    (
        "P29",
        "P29 · 玻璃窗前贴胸站立位 (Pressed On Glass)",
        "5. 站立·悬空抱举系",
        "vaginal",
        "竖图 832x1216",
        "frontal view through glass, standing, 1.4::against glass::, palms pressed on glass, flattened chest, fogged glass, looking at viewer",
        "three-quarter view, standing, 1.4::against glass::, palms and chest pressed against clear windowpane, looking at viewer",
        "standing with both palms and chest pressed flat against a clear glass pane",
    ),

    # === 6. 口部·上半身特写系 ===
    (
        "P30",
        "P30 · 跪姿仰视双手奉仕位 (Kneeling Upward Oral)",
        "6. 口部·上半身特写系",
        "oral",
        "竖图 832x1216",
        "1.35::from above::, high angle, kneeling, upper body, 1.35::looking up::, looking at viewer, hands cupped near chin",
        "three-quarter high angle, kneeling, upper body, leaning forward, hands near mouth, looking up",
        "kneeling and gazing upward from a high angle with hands raised near her chin",
    ),
    (
        "P31",
        "P31 · 前倾扶头近景深部特写 (Close Forward Oral)",
        "6. 口部·上半身特写系",
        "oral",
        "竖图 832x1216",
        "1.35::close-up::, portrait, from above, leaning forward, teary eyes, blush, looking up at viewer",
        "side three-quarter close-up, leaning forward, hands resting on hair, teary eyes",
        "in an intimate close-up leaning forward with misty eyes gazing upward",
    ),
    (
        "P32",
        "P32 · 仰躺边缘垂首倒挂位 (Inverted Head-Back)",
        "6. 口部·上半身特写系",
        "oral",
        "竖图 832x1216",
        "top-down view, lying on back, 1.35::upside-down::, head tilted back over edge, hair hanging down, looking at viewer",
        "side three-quarter view, lying on back at edge, head hanging backward, hair cascading down",
        "lying on her back with her head tilted backward over the edge and hair hanging down",
    ),
    (
        "P33",
        "P33 · 上下交叠互侍 69 位 (Mutual 69)",
        "6. 口部·上半身特写系",
        "oral",
        "横图 1216x832",
        "low angle close view, straddling above, thighs framing view, leaning down",
        "landscape side view, horizontal opposing posture, kneeling above on all fours, arched hips",
        "poised horizontally in a mutual opposing posture with arched hips",
    ),
    (
        "P34",
        "P34 · 跨骑俯视坐颜位 (Straddling Low-Angle)",
        "6. 口部·上半身特写系",
        "vaginal",
        "竖图 832x1216",
        "1.45::from below::, worm's-eye view, kneeling directly over viewer, thighs framing camera, looking down at viewer",
        "low-angle three-quarter shot, kneeling astride head level, looking down",
        "kneeling astride directly overhead while looking down from a steep low angle",
    ),

    # === 7. 外部部位·胸足腿手系 ===
    (
        "P35",
        "P35 · 双手拢胸夹持奉仕位 (Cleavage Press / Paizuri)",
        "7. 外部部位·胸足腿手系",
        "chest",
        "竖图 832x1216",
        "1.35::from above::, close-up, kneeling, leaning forward, 1.35::looking up::, looking at viewer",
        "three-quarter high-angle cowboy shot, kneeling, leaning forward, arms pressed inward, looking at viewer",
        "kneeling and leaning forward while pressing both arms inward around her chest",
    ),
    (
        "P36",
        "P36 · 坐姿双脚心相对足部奉仕位 (Foot Press / Footjob)",
        "7. 外部部位·胸足腿手系",
        "foot",
        "竖图 832x1216",
        "sitting, leaning back on hands, legs extended toward viewer, 1.35::foot focus::, foreshortening, looking at viewer",
        "three-quarter view, sitting leaned back, both legs raised forward with soles pressed together, looking at viewer",
        "sitting leaned back on her hands with both feet extended forward and soles pressed together",
    ),
    (
        "P37",
        "P37 · 紧闭大腿根贴合素股位 (Thigh Squeeze / Sumata)",
        "7. 外部部位·胸足腿手系",
        "thigh",
        "竖图 832x1216",
        "low angle, kneeling astride, leaning slightly forward, inner thighs pressed close, looking down at viewer",
        "three-quarter cowboy shot, kneeling astride with thighs pressed snugly together, looking at viewer",
        "kneeling astride with her inner thighs pressed snugly together",
    ),
    (
        "P38",
        "P38 · 翘臀贴合磨擦奉仕位 (Glute Press / Assjob)",
        "7. 外部部位·胸足腿手系",
        "glute",
        "竖图 832x1216",
        "1.35::from behind::, close cowboy shot, kneeling, arched back, hips pushed back, 1.3::looking back::, over shoulder",
        "rear three-quarter shot, kneeling, arched spine, hips raised, looking back at viewer",
        "kneeling with her lower back arched and glutes pressed together while glancing back",
    ),
    (
        "P39",
        "P39 · 贴身双手环握奉仕位 (Two-Handed Grip / Handjob)",
        "7. 外部部位·胸足腿手系",
        "hand",
        "竖图 832x1216",
        "close cowboy shot, high angle, kneeling close, both hands raised together in front, shy gaze, looking at viewer",
        "three-quarter close shot, kneeling beside, both hands cupped together at chest height, looking at viewer",
        "kneeling up close with both hands cupped together in front while gazing shyly",
    ),

    # === 8. 柔韧进阶·展示系 ===
    (
        "P40",
        "P40 · 双腋穿臂悬空大开脚位 (Full Nelson Lifted)",
        "8. 柔韧进阶·展示系",
        "vaginal",
        "竖图 832x1216",
        "high angle, lifted, knees pulled wide toward shoulders, feet dangling, looking back up",
        "frontal full-body shot, 1.35::full nelson::, lifted from behind, arms behind neck, knees held wide apart, facing viewer",
        "lifted in mid-air from behind with her knees drawn high and wide apart facing forward",
    ),
    (
        "P41",
        "P41 · 倒立折腰高举臀位 (Inverted Fold / Piledriver)",
        "8. 柔韧进阶·展示系",
        "vaginal",
        "竖图 832x1216",
        "1.35::from above::, shoulders down, hips raised vertically, legs folded downward past ears, looking at viewer",
        "side three-quarter shot, inverted folded posture, shoulders resting low, hips vertical in air",
        "in an inverted folded posture with her shoulders low and hips raised vertically",
    ),
    (
        "P42",
        "P42 · 站立一字马高抬腿平衡位 (Standing Vertical Split)",
        "8. 柔韧进阶·展示系",
        "vaginal",
        "竖图 832x1216",
        "eye-level full-body, standing, 1.45::standing split::, one leg raised vertically upward, flexible, looking at viewer",
        "three-quarter full-body shot, 1.45::standing split::, one leg extended straight upward, balanced posture, looking at viewer",
        "balancing in a flexible standing vertical split with one leg raised straight upward",
    ),
    (
        "P43",
        "P43 · 正面M字开脚蹲坐展示位 (Solo M-Legs Showcase)",
        "8. 柔韧进阶·展示系",
        "solo",
        "竖图 832x1216",
        "frontal view, sitting, 1.45::m legs::, knees bent wide apart, hands resting on knees, leaning slightly back, looking at viewer",
        "three-quarter frontal shot, sitting, 1.45::m legs::, knees bent wide, soles flat, looking at viewer",
        "sitting facing forward in an M-shaped open-knee posture while looking at the viewer",
    ),
    (
        "P44",
        "P44 · 跪趴塌腰回眸展示位 (Solo Rear-Arch Showcase)",
        "8. 柔韧进阶·展示系",
        "solo",
        "横图 1216x832",
        "1.35::from behind::, all fours, deep arched back, raised hips, knees apart, 1.35::looking back::, over shoulder",
        "three-quarter rear shot, kneeling on all fours, arched lower back, looking back over shoulder at viewer",
        "kneeling on all fours with a deep arched back while turning her head over her shoulder",
    ),
]


def _build_position_tables() -> Tuple[List[Dict[str, str]], Dict[str, Dict[str, str]]]:
    chapters: List[Dict[str, str]] = []
    templates: Dict[str, Dict[str, str]] = {}
    for pid, title, cat, ch_kind, canvas, p_pov, p_3rd, prose_core in _RAW_POSITIONS:
        chapters.append(
            {
                "id": pid,
                "title": title,
                "category": cat,
                "actor_type": "AllPos",
            }
        )
        templates[pid] = {
            "id": pid,
            "title": title,
            "category": cat,
            "channel": ch_kind,
            "canvas": canvas,
            "pose_pov": p_pov,
            "pose_3rd": p_3rd,
            "prose_core": prose_core,
        }

    # 支持用户通过本地 custom_positions.json 追加或覆盖自定义体位词条
    if os.path.exists(CUSTOM_POSITIONS_FILE):
        try:
            with open(CUSTOM_POSITIONS_FILE, "r", encoding="utf-8") as f:
                custom_data = json.load(f)
            if isinstance(custom_data, list):
                for entry in custom_data:
                    if not isinstance(entry, dict) or not entry.get("id"):
                        continue
                    cid = str(entry["id"]).strip()
                    ctitle = str(entry.get("title", cid)).strip()
                    ccat = str(entry.get("category", "8. 柔韧进阶·展示系")).strip()
                    if ccat not in POS_CATEGORIES:
                        POS_CATEGORIES.append(ccat)
                    tpl_obj = {
                        "id": cid,
                        "title": ctitle,
                        "category": ccat,
                        "channel": str(entry.get("channel", "vaginal")).strip(),
                        "canvas": str(entry.get("canvas", "竖图 832x1216")).strip(),
                        "pose_pov": str(entry.get("pose_pov", "")).strip(),
                        "pose_3rd": str(entry.get("pose_3rd", entry.get("pose_pov", ""))).strip(),
                        "prose_core": str(entry.get("prose_core", "")).strip(),
                    }
                    templates[cid] = tpl_obj
                    existing = next((c for c in chapters if c["id"] == cid), None)
                    if existing:
                        existing["title"] = ctitle
                        existing["category"] = ccat
                    else:
                        chapters.append(
                            {
                                "id": cid,
                                "title": ctitle,
                                "category": ccat,
                                "actor_type": "AllPos",
                            }
                        )
        except Exception:
            pass

    return chapters, templates


ALL_POSITIONS_CHAPTERS, ALL_POSITIONS_TEMPLATES = _build_position_tables()


def sanitize_style_for_transparent_bg(head_pos: str) -> str:
    """开启透明背景时，剥离画风头部中会强制生成实景模糊背景的词条（如 photo background / bokeh / hazy）"""
    if not head_pos:
        return ""
    blocked = {"photo background", "depth of field", "bokeh", "hazy"}
    kept: List[str] = []
    for raw_t in head_pos.split(","):
        t = raw_t.strip()
        if not t:
            continue
        bare = re.sub(r"^-?\d+(?:\.\d+)?::|::$", "", t).strip().lower()
        if bare in blocked:
            continue
        kept.append(t)
    return ", ".join(kept)
