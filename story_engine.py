# -*- coding: utf-8 -*-
"""
NovelAI V4.5 / V5 连续故事线提示词模块化组装引擎 (story_engine.py)
特性：
1. 第一人称 (POV) 与第三人称 (客观机位) 全 12 幕双轨独立分离；
2. 支持【精密参照 (Precise Reference)】全维度模块开关：除核心动作与视角骨架外，画风、质量、角色身份、体型、服装款式、掀衣暴露辅助、鞋袜、背景、表情、局部四维、本幕流体、跨幕残留、T5自然语言句、防崩负向均可独立 OFF！
"""

from __future__ import annotations
import json
import os
import re
from dataclasses import dataclass, asdict
from typing import Dict, List, Tuple


PRESETS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "character_presets.json")


@dataclass
class CharacterConfig:
    """可变角色、外观、视角与精密参照模块开关数据模型"""
    preset_name: str = "标枪 Javelin（碧蓝航线 · 默认）"
    char_tag: str = "javelin (azur lane)"
    eng_name: str = "Javelin"
    eye_color: str = "purple eyes"
    hair_tags: str = "hair ribbon, x hair ornament, pointy hair, stray hair"
    canon_neg_tags: str = "neckerchief, serafuku, plaid, gloves"
    extra_char_tags: str = ""

    # 外观与体型自定义
    body_preset: str = "纤细娇小（原版默认 slender, petite）"
    bust_preset: str = "默认随角色原设"
    skin_preset: str = "自然暖透肤（原版默认）"
    outfit_preset: str = "宽松滑肩白T恤·下身真空（故事线默认）"
    outfit_state_mode: str = "🔄 智能适配穿脱（原设/裙装自动撩裙拨内裤 · 单件上衣自动真空）"
    custom_outfit_tags: str = ""
    keep_canon_elements: bool = False
    legwear_preset: str = "赤足裸腿（barefoot 默认）"

    # 额外萌点开关
    add_cat_ears: bool = False
    add_horns_tail: bool = False
    add_glasses: bool = False
    add_choker: bool = False
    add_extra_sweat: bool = False

    # 画风与局部四维自定义
    style_preset: str = "137_128 锋利钢笔水彩空气感逆光（原版默认）"
    custom_style_pos: str = ""
    custom_style_neg: str = ""
    morph_preset: str = "1D 微明显蝴蝶低过渡（原版默认）"
    pubic_preset: str = "默认不额外指定"
    pigment_preset: str = "3A 透肤暖珊瑚无色差（原版默认）"
    fluid_scale: float = 1.0

    # 视角轨道 ("pov" = 第一人称视角, "3rd" = 第三人称客观视角)
    perspective_mode: str = "pov"
    include_sub_variants: bool = False

    # 多图分镜 (S03 / S04) 出图形式控制
    # "2koma"      -> 原版同屏双格漫画差分 (2koma split screen)
    # "single_a"   -> 拆为单张图 · 前半拍进行中 (S03:口部进行中 / S04:骑乘深坐结合溢流)
    # "single_b"   -> 拆为单张图 · 后半拍事后拉丝 (S03:松口拉丝 / S04:骑乘微抬脱出疲软拉丝)
    # "single_pair"-> 拆为独立前后两张单图（无分格线，可在单幕预览切换选择跑哪一张）
    multi_panel_mode: str = "2koma"

    # ==========================================
    # 🎛️ 精密参照 (Precise Reference) 模块独立开关（True=开启, False=OFF）
    # 核心动作与视角骨架始终保留，其余模块均可自由 OFF
    # ==========================================
    enable_quality: bool = True         # 1. 基础质量词 (masterpiece, best quality, absurdres...)
    enable_style: bool = True           # 2. 画风笔触与光影词 (colored sketch, backlighting... 及画风负向)
    enable_identity: bool = True        # 3. 角色名·瞳色·发型头饰·原皮负向屏蔽
    enable_body: bool = True            # 4. 身材体型·胸围·肤色·额外萌点配件
    enable_outfit: bool = True          # 5. 具体服装款式词 (白T恤/衬衫/水手服等)
    enable_clothing_state: bool = True  # 6. 动作掀衣/下身暴露状态词 (clothes lift, bottomless, no panties)
    enable_legwear: bool = True         # 7. 鞋袜/赤足外观词 (barefoot / thighhighs...)
    enable_background: bool = True      # 8. 室内沙发灯光环境词 (indoors, couch, pillow, lamp)
    enable_expression: bool = True      # 9. 面部微表情与羞红修饰词 (smug, blush, seductive smile...)
    enable_anatomy: bool = True         # 10. 局部四维器型/毛发/色泽词
    enable_action_fluids: bool = True   # 11. 本幕核心流体动作表现 (如 S02拉丝 / S05排泄 / S07足部白浊 / S11外射)
    enable_remnants: bool = True        # 12. 跨幕历史累积残留痕迹 (前几幕留下的脸颊/发丝/小腹旧积液)
    enable_t5_prose: bool = True        # 13. 句尾英文自然语言锚点句 (开启时也会自动剔除已 OFF 的模块信息)
    enable_negatives: bool = True       # 14. 动作与画面防崩负向词块
    enable_multi_angle_nsfw: bool = False  # 15. 多角度套图 NSFW 类词条开关（默认 OFF 纯 SFW）


# 快捷精密参照开关预设组
MODULE_SWITCH_PRESETS: Dict[str, Dict[str, bool]] = {
    "🌕 全量直出（默认全开）": {
        "enable_quality": True,
        "enable_style": True,
        "enable_identity": True,
        "enable_body": True,
        "enable_outfit": True,
        "enable_clothing_state": True,
        "enable_legwear": True,
        "enable_background": True,
        "enable_expression": True,
        "enable_anatomy": True,
        "enable_action_fluids": True,
        "enable_remnants": True,
        "enable_t5_prose": True,
        "enable_negatives": True,
    },
    "🎯 精密参照：人物+画风（关身份/外观/画风）": {
        "enable_quality": True,
        "enable_style": False,
        "enable_identity": False,
        "enable_body": False,
        "enable_outfit": False,
        "enable_clothing_state": True,  # 保留掀衣与下身暴露辅助，让参照图自带衣服自动掀起不挡动作
        "enable_legwear": False,
        "enable_background": True,
        "enable_expression": True,
        "enable_anatomy": True,
        "enable_action_fluids": True,
        "enable_remnants": True,
        "enable_t5_prose": True,
        "enable_negatives": True,
    },
    "👤 精密参照：仅锁人物（保留本台画风+动作）": {
        "enable_quality": True,
        "enable_style": True,
        "enable_identity": False,
        "enable_body": False,
        "enable_outfit": False,
        "enable_clothing_state": True,
        "enable_legwear": False,
        "enable_background": True,
        "enable_expression": True,
        "enable_anatomy": True,
        "enable_action_fluids": True,
        "enable_remnants": True,
        "enable_t5_prose": True,
        "enable_negatives": True,
    },
    "🦴 极简纯动作骨架（除动作与视角外全 OFF）": {
        "enable_quality": False,
        "enable_style": False,
        "enable_identity": False,
        "enable_body": False,
        "enable_outfit": False,
        "enable_clothing_state": False,
        "enable_legwear": False,
        "enable_background": False,
        "enable_expression": False,
        "enable_anatomy": False,
        "enable_action_fluids": False,
        "enable_remnants": False,
        "enable_t5_prose": False,
        "enable_negatives": True,
    },
}


# ==========================================
# 内置角色预设库
# ==========================================
BUILTIN_CHARACTERS: Dict[str, Dict[str, str]] = {
    "标枪 Javelin（碧蓝航线 · 默认）": {
        "char_tag": "javelin (azur lane)",
        "eng_name": "Javelin",
        "eye_color": "purple eyes",
        "hair_tags": "short purple hair, hair ribbon, x hair ornament, pointy hair, stray hair",
        "canon_neg_tags": "neckerchief, serafuku, plaid, gloves, crown",
        "canon_outfit": "serafuku, white crop top, neckerchief, purple plaid skirt, pleated skirt, white gloves",
        "canon_top_only": "serafuku, white crop top, neckerchief, white gloves",
        "canon_bottom_neg": "skirt, pleated skirt, plaid skirt",
        "canon_prose": "her canonical sailor crop top and purple plaid skirt",
        "body_preset": "纤细娇小（原版默认 slender, petite）",
        "bust_preset": "默认随角色原设",
    },
    "拉菲 Laffey（碧蓝航线）": {
        "char_tag": "laffey (azur lane)",
        "eng_name": "Laffey",
        "eye_color": "red eyes",
        "hair_tags": "white hair, twintails, bunny hair ornament, fake animal ears, messy hair, stray hair",
        "canon_neg_tags": "red jacket, neckerchief, cuffs, skirt",
        "canon_outfit": "red open jacket, white dress, neckerchief, detached cuffs, pleated skirt",
        "canon_top_only": "red open jacket, white top, neckerchief, detached cuffs",
        "canon_bottom_neg": "skirt, pleated skirt",
        "canon_prose": "her canonical red jacket and white outfit",
        "body_preset": "纤细娇小（原版默认 slender, petite）",
        "bust_preset": "平胸贫乳（flat chest, small breasts）",
    },
    "绫波 Ayanami（碧蓝航线）": {
        "char_tag": "ayanami (azur lane)",
        "eng_name": "Ayanami",
        "eye_color": "red eyes",
        "hair_tags": "white hair, long hair, ponytail, mechanical ears, hairband, stray hair",
        "canon_neg_tags": "serafuku, neckerchief, navel cutout, gloves, sword",
        "canon_outfit": "white serafuku, yellow neckerchief, navel cutout, black pleated skirt, white gloves",
        "canon_top_only": "white serafuku, yellow neckerchief, navel cutout, white gloves",
        "canon_bottom_neg": "skirt, pleated skirt",
        "canon_prose": "her canonical white naval uniform and black skirt",
        "body_preset": "纤细娇小（原版默认 slender, petite）",
        "bust_preset": "小巧适中（small breasts）",
    },
    "独角兽 Unicorn（碧蓝航线）": {
        "char_tag": "unicorn (azur lane)",
        "eng_name": "Unicorn",
        "eye_color": "purple eyes",
        "hair_tags": "long purple hair, lowbraided sidelocks, hairband, stray hair",
        "canon_neg_tags": "white dress, capelet, detached sleeves, plushie",
        "canon_outfit": "white dress, purple capelet, detached sleeves",
        "canon_top_only": "purple capelet, white top, detached sleeves",
        "canon_bottom_neg": "skirt, long skirt",
        "canon_prose": "her canonical white dress and purple capelet",
        "body_preset": "纤细娇小（原版默认 slender, petite）",
        "bust_preset": "小巧适中（small breasts）",
    },
    "天狼星 Sirius（碧蓝航线）": {
        "char_tag": "sirius (azur lane)",
        "eng_name": "Sirius",
        "eye_color": "blue eyes",
        "hair_tags": "short white hair, wavy hair, swept bangs, stray hair",
        "canon_neg_tags": "maid headdress, maid apron, black dress, detached sleeves, gloves",
        "canon_outfit": "maid headdress, maid apron, black dress, detached sleeves, white gloves",
        "canon_top_only": "maid headdress, maid collar, detached sleeves, white gloves, open clothes",
        "canon_bottom_neg": "skirt, long dress",
        "canon_prose": "her canonical maid outfit",
        "body_preset": "成熟高挑丰满（tall female, curvy, narrow waist）",
        "bust_preset": "丰满巨乳（large breasts, cleavage）",
    },
    "可畏 Formidable（碧蓝航线）": {
        "char_tag": "formidable (azur lane)",
        "eng_name": "Formidable",
        "eye_color": "red eyes",
        "hair_tags": "silver hair, very long hair, twintails, hair ribbon, stray hair",
        "canon_neg_tags": "gothic lolita, black dress, frills, maid headdress",
        "canon_outfit": "gothic lolita, black dress, frills, maid headdress",
        "canon_top_only": "gothic lolita, black bodice, frills, maid headdress",
        "canon_bottom_neg": "skirt, long skirt",
        "canon_prose": "her canonical black gothic lolita dress",
        "body_preset": "丰满肉感微胖（plump, curvy, wide hips, thick thighs）",
        "bust_preset": "夸张爆乳（huge breasts, heavy breasts）",
    },
    "流萤 Firefly（崩坏：星穹铁道）": {
        "char_tag": "firefly (honkai: star rail)",
        "eng_name": "Firefly",
        "eye_color": "teal eyes, gradient eyes",
        "hair_tags": "long silver hair, black hairband, hair intakes, stray hair",
        "canon_neg_tags": "jacket, neckerchief, green dress, gloves, thigh strap",
        "canon_outfit": "jacket, neckerchief, green dress, white gloves, thigh strap",
        "canon_top_only": "jacket, neckerchief, white gloves",
        "canon_bottom_neg": "skirt, green skirt",
        "canon_prose": "her canonical jacket and green dress",
        "body_preset": "匀称修长少女（slender, narrow waist, long legs）",
        "bust_preset": "饱满中等（medium breasts）",
    },
    "银狼 Silver Wolf（崩坏：星穹铁道）": {
        "char_tag": "silver wolf (honkai: star rail)",
        "eng_name": "Silver Wolf",
        "eye_color": "grey eyes",
        "hair_tags": "grey hair, drill hair, high ponytail, hairclip, tinted sunglasses on head, stray hair",
        "canon_neg_tags": "crop jacket, shorts, fingerless gloves, boots",
        "canon_outfit": "crop jacket, black crop top, shorts, fingerless gloves",
        "canon_top_only": "crop jacket, black crop top, fingerless gloves",
        "canon_bottom_neg": "shorts, denim shorts",
        "canon_prose": "her canonical crop jacket and shorts",
        "body_preset": "纤细娇小（原版默认 slender, petite）",
        "bust_preset": "小巧适中（small breasts）",
    },
    "芙莉莲 Frieren（葬送的芙莉莲）": {
        "char_tag": "frieren",
        "eng_name": "Frieren",
        "eye_color": "green eyes",
        "hair_tags": "white hair, twintails, pointy ears, elf, striped earrings, stray hair",
        "canon_neg_tags": "capelet, white jacket, gold trim, skirt, boots, staff",
        "canon_outfit": "white capelet, white jacket, gold trim, white skirt",
        "canon_top_only": "white capelet, white jacket, gold trim",
        "canon_bottom_neg": "skirt, white skirt",
        "canon_prose": "her canonical white mage capelet and skirt",
        "body_preset": "纤细娇小（原版默认 slender, petite）",
        "bust_preset": "平胸贫乳（flat chest, small breasts）",
    },
    "初音未来 Hatsune Miku": {
        "char_tag": "hatsune miku",
        "eng_name": "Miku",
        "eye_color": "aqua eyes",
        "hair_tags": "aqua hair, very long twintails, hair ornament, stray hair",
        "canon_neg_tags": "necktie, sleeveless shirt, detached sleeves, headset, pleated skirt",
        "canon_outfit": "sleeveless grey shirt, cyan necktie, detached sleeves, black pleated skirt",
        "canon_top_only": "sleeveless grey shirt, cyan necktie, detached sleeves",
        "canon_bottom_neg": "skirt, pleated skirt",
        "canon_prose": "her canonical sleeveless shirt, cyan tie, and pleated skirt",
        "body_preset": "匀称修长少女（slender, narrow waist, long legs）",
        "bust_preset": "小巧适中（small breasts）",
    },
    "原创白发猫娘 OC（无需作品Tag）": {
        "char_tag": "original",
        "eng_name": "the catgirl",
        "eye_color": "golden eyes",
        "hair_tags": "silver hair, messy bob cut, sidelocks, ahoge, cat ears, animal ear fluff, stray hair",
        "canon_neg_tags": "",
        "canon_outfit": "frilled blouse, ribbon, pleated skirt",
        "canon_top_only": "frilled blouse, ribbon",
        "canon_bottom_neg": "skirt, pleated skirt",
        "canon_prose": "her frilled blouse and pleated skirt",
        "body_preset": "纤细娇小（原版默认 slender, petite）",
        "bust_preset": "小巧适中（small breasts）",
    },
}


# ==========================================
# 外观、穿搭、画风与四维局部字典
# ==========================================
QUALITY_TAGS = "masterpiece, best quality, 0.8::very aesthetic::, absurdres, year 2025"

BODY_PRESETS: Dict[str, Tuple[str, str]] = {
    "纤细娇小（原版默认 slender, petite）": ("slender, petite", "plump, thick thighs"),
    "匀称修长少女（slender, narrow waist, long legs）": ("slender, narrow waist, long legs", "plump, obese"),
    "丰满肉感微胖（plump, curvy, wide hips, thick thighs）": ("plump, curvy, wide hips, thick thighs, soft body", "skinny, flat chest"),
    "成熟高挑丰满（tall female, curvy, narrow waist）": ("tall female, mature female, curvy, narrow waist, wide hips", "loli, petite"),
}

BUST_PRESETS: Dict[str, Tuple[str, str]] = {
    "默认随角色原设": ("", ""),
    "平胸贫乳（flat chest, small breasts）": ("flat chest, small breasts", "large breasts, medium breasts, cleavage"),
    "小巧适中（small breasts）": ("small breasts", "large breasts, huge breasts"),
    "饱满中等（medium breasts）": ("medium breasts", "flat chest, huge breasts"),
    "丰满巨乳（large breasts, cleavage）": ("large breasts, cleavage", "flat chest, small breasts"),
    "夸张爆乳（huge breasts, heavy breasts）": ("huge breasts, heavy breasts, cleavage", "flat chest, small breasts"),
}

SKIN_PRESETS: Dict[str, str] = {
    "自然暖透肤（原版默认）": "",
    "雪白瓷肌（pale skin, fair skin）": "pale skin, fair skin",
    "健康小麦日晒肌（tan, dark skin）": "tan, dark-skinned female",
    "日晒泳装白痕（tan, tanlines）": "tan, suntan, 1.3::tanlines::",
    "晶莹汗湿反光肌（shiny skin, glistening）": "shiny skin, glistening skin, 1.25::sweat::",
}

OUTFIT_PRESETS: Dict[str, Dict[str, str]] = {
    "🌟 角色标签原设默认服装（自动解锁角色原皮 · 推荐）": {
        "design_tags": "",
        "state_tags": "clothes lift, skirt lift, panties aside",
        "sleep_extra": "disheveled clothes",
        "prose": "",
        "intact_prose": "",
        "allow_canon": "1",
        "kind": "canon_full",
        "bottom_type": "skirt_or_canon",
    },
    "🎽 角色原设上衣与配件保留 · 下身真空半脱": {
        "design_tags": "",
        "state_tags": "clothes lift, bottomless, no panties",
        "sleep_extra": "disheveled clothes",
        "prose": "her lifted top",
        "intact_prose": "",
        "allow_canon": "1",
        "kind": "canon_top",
        "bottom_type": "none",
    },
    "宽松滑肩白T恤·下身真空（故事线默认）": {
        "design_tags": "oversized shirt, white t-shirt, off-shoulder, single bare shoulder, wet clothes",
        "state_tags": "clothes lift, bottomless, no panties",
        "sleep_extra": "disheveled clothes",
        "prose": "her lifted off-shoulder oversized white t-shirt",
        "intact_prose": "an off-shoulder oversized white t-shirt",
        "allow_canon": "0",
        "kind": "preset",
        "bottom_type": "none",
    },
    "学院百褶短裙套装（白衬衫+百褶裙 · 撩裙不脱裙）": {
        "design_tags": "white collared shirt, necktie, pleated skirt, miniskirt",
        "state_tags": "clothes lift, skirt lift, panties aside",
        "sleep_extra": "disheveled clothes",
        "prose": "her lifted pleated skirt",
        "intact_prose": "a white collared shirt and pleated miniskirt",
        "allow_canon": "0",
        "kind": "preset",
        "bottom_type": "skirt",
    },
    "连体兔女郎紧身衣（Bunny Suit · 拨档互动）": {
        "design_tags": "playboy bunny, black leotard, strapless, bare shoulders, wrist cuffs, bowtie",
        "state_tags": "clothes lift, leotard aside",
        "sleep_extra": "disheveled clothes",
        "prose": "her shifted bunny leotard",
        "intact_prose": "a strapless black bunny leotard with wrist cuffs and bowtie",
        "allow_canon": "0",
        "kind": "preset",
        "bottom_type": "leotard",
    },
    "系带微距比基尼泳装（Micro Bikini · 拨开互动）": {
        "design_tags": "bikini, micro bikini, string bikini, side-tie bikini bottom",
        "state_tags": "bikini aside, swimsuit aside",
        "sleep_extra": "disheveled clothes",
        "prose": "her pushed-aside bikini strings",
        "intact_prose": "a string micro bikini",
        "allow_canon": "0",
        "kind": "preset",
        "bottom_type": "swimsuit",
    },
    "全裸无衣（nude · 全程无遮挡）": {
        "design_tags": "nude, completely nude, bare shoulders, nipples",
        "state_tags": "nude",
        "sleep_extra": "",
        "prose": "her bare chest",
        "intact_prose": "completely nude",
        "allow_canon": "0",
        "kind": "nude",
        "bottom_type": "nude",
    },
    "宽松男友白衬衫半敞·下身真空": {
        "design_tags": "oversized shirt, white collared shirt, unbuttoned, open clothes, off-shoulder, wet clothes",
        "state_tags": "clothes lift, bottomless, no panties",
        "sleep_extra": "disheveled clothes",
        "prose": "her unbuttoned oversized white collared shirt",
        "intact_prose": "an unbuttoned oversized white collared shirt",
        "allow_canon": "0",
        "kind": "preset",
        "bottom_type": "none",
    },
    "半脱凌乱水手服上衣·下身真空": {
        "design_tags": "serafuku, sailor collar, neckerchief, open clothes, disheveled clothes, wet clothes",
        "state_tags": "clothes lift, bottomless, no panties",
        "sleep_extra": "",
        "prose": "her disheveled lifted sailor uniform top",
        "intact_prose": "a disheveled open sailor uniform top",
        "allow_canon": "1",
        "kind": "preset",
        "bottom_type": "none",
    },
    "轻薄吊带睡裙掀起·下身真空": {
        "design_tags": "nightgown, camisole, white babydoll, spaghetti strap, see-through, off-shoulder",
        "state_tags": "clothes lift, bottomless, no panties",
        "sleep_extra": "disheveled clothes",
        "prose": "her lifted sheer white camisole nightgown",
        "intact_prose": "a sheer white camisole nightgown",
        "allow_canon": "0",
        "kind": "preset",
        "bottom_type": "none",
    },
    "紧身运动背心掀起·下身真空": {
        "design_tags": "tank top, white sports bra, crop top, breasts out, wet clothes",
        "state_tags": "clothes lift, bottomless, no panties",
        "sleep_extra": "disheveled clothes",
        "prose": "her pushed-up white sports tank top",
        "intact_prose": "a white sports tank top",
        "allow_canon": "0",
        "kind": "preset",
        "bottom_type": "none",
    },
    "自定义穿搭（使用下方自定义穿搭框）": {
        "design_tags": "",
        "state_tags": "",
        "sleep_extra": "",
        "prose": "her outfit",
        "intact_prose": "her outfit",
        "allow_canon": "0",
        "kind": "custom",
        "bottom_type": "none",
    },
}

OUTFIT_STATE_PRESETS: Dict[str, str] = {
    "🔄 智能适配穿脱（原设/裙装自动撩裙拨内裤 · 单件上衣自动真空）": "auto",
    "👗 保留下装 · 撩裙/拨开内裤互动（skirt lift + panties aside · 不删裙装）": "keep_bottom_aside",
    "👙 半脱凌乱 · 敞衣露肩 + 内裤挂单腿（open clothes + panties around one leg）": "half_off",
    "👕 掀衣 + 下身全真空（clothes lift + bottomless, no panties · 经典模式）": "bottomless",
    "🔒 全程完整穿戴不掀脱（不自动加掀衣/脱裤辅助词）": "intact",
}

LEGWEAR_PRESETS: Dict[str, Tuple[str, str, str]] = {
    "🌟 随角色原设鞋袜 / 不强制赤足": ("", "no shoes, socks", "feet"),
    "赤足裸腿（barefoot 默认）": ("barefoot", "barefoot", "bare feet"),
    "裸足配精致脚链（barefoot, anklet）": ("barefoot, anklet", "barefoot, anklet", "anklet-adorned bare feet"),
    "白色过膝丝袜（white thighhighs）": ("white thighhighs", "white thighhighs, clothed feet", "white-stockinged feet"),
    "黑色蕾丝腿环过膝袜（black thighhighs, garter）": ("black thighhighs, thigh strap", "black thighhighs, clothed feet", "black-stockinged feet"),
    "撕破白丝连裤袜（torn white pantyhose）": ("white pantyhose, 1.3::torn pantyhose::", "white pantyhose, torn pantyhose, clothed feet", "torn-pantyhose-clad feet"),
}

STYLE_PRESETS: Dict[str, Tuple[str, str]] = {
    "137_128 锋利钢笔水彩空气感逆光（原版默认）": (
        "1.4::sharp focus::, fine details, 1.1::colored sketch::, 0.8::pen (medium)::, 0.8::painterly::, "
        "0.5::watercolor (medium)::, visible brushstrokes, pastel colors, soft colors, muted colors, "
        "subsurface scattering, backlighting, rim lighting, warm lighting",
        "blurry, out of focus, depth of field, soft focus, cel shading, flat color, oil painting (medium), thick outlines, high contrast, harsh shadows, dark, realistic, 3d",
    ),
    "🌤️ 柔雾白纱晨光 · 无描边暖杏真肤二次元萌脸（M6 保留款 · 自然光真肤）": (
        "1.65::no lineart::, 1.5::lineless::, 1.32::realistic::, 0.78::photo (medium)::, 0.48::3d::, "
        "1.6::anime face::, 1.45::moe::, 1.65::dot nose::, small mouth, soft skin, "
        "1.55::front lighting::, 1.45::warm lighting::, 1.45::soft lighting::, diffused lighting, gentle chiaroscuro, "
        "1.6::smooth shading::, soft shadows, hazy, depth of field, 1.15::muted colors::, 1.25::low contrast::, "
        "1.4::ambient occlusion::, 1.1::subsurface scattering::",
        "painterly, painting (medium), oil painting (medium), acrylicpaint (medium), impasto, brushstrokes, "
        "visible brushstrokes, gouache, watercolor (medium), airbrush, cel shading, cel highlight, flat color, "
        "lineart, outlines, thick outlines, thin outlines, sketch, pen (medium), "
        "harsh shadows, cold lighting, blue tint, grey skin, neon hair, vibrant purple, oversaturated, "
        "shiny ass, light spots, wet clothes, blush stickers, oiled, latex, plastic, figure, faux figurine, doll, "
        "realistic face, 3d face, semi-realistic, realistic eyes, eye sockets, nose bridge, realistic nose, nostrils, lips, thick lips, cosplay, floating heart, sweatdrop",
    ),
    "🎨 柔雾白纱无界油画 · 点鼻小嘴内联锁脸款（M6-Tune2 保留款 · 无界油画感）": (
        "1.65::no lineart::, 1.5::lineless::, 1.32::realistic::, 0.78::photo (medium)::, 0.48::3d::, "
        "1.6::anime face::, 1.45::moe::, 1.85::dot nose::, 1.45::small mouth::, :o, soft skin, "
        "1.55::front lighting::, 1.45::warm lighting::, 1.45::soft lighting::, diffused lighting, gentle chiaroscuro, "
        "1.6::smooth shading::, soft shadows, hazy, depth of field, 1.15::muted colors::, 1.25::low contrast::, "
        "1.4::ambient occlusion::, 1.1::subsurface scattering::",
        "nose bridge, nostrils, lips, thick lips, philtrum, crown, text, signature, copyright name, watermark",
    ),
    "真实微距 PVC 涂装手办摄影风（Scale Figurine Photo · 半哑光保留版）": (
        "1.85::figure::, 1.55::faux figurine::, 1.35::photo (medium)::, 1.25::realistic::, 1.2::3d::, "
        "photo background, depth of field, bokeh, studio lighting, soft shadows, subsurface scattering, "
        "matte pvc texture, glossy highlights, fine details",
        "doll joints, ball-jointed doll, figma, action figure, flat color, cel shading, lineart, sketch, "
        "watercolor (medium), pen (medium), monochrome, comic, 2d, floating heart, sweatdrop",
    ),
    "高光亮油 PVC 手办硬反光微距风（Glossy Lacquer PVC · 强硬塑料高光推荐）": (
        "2.15::figure::, 1.85::faux figurine::, 1.55::photo (medium)::, 1.4::realistic::, 1.35::3d::, "
        "1.7::shiny::, 1.65::shiny skin::, 1.5::shiny hair::, 1.45::shiny clothes::, oiled, "
        "reflection, rim lighting, backlighting, shadow, photo background, depth of field, bokeh, chromatic aberration",
        "subsurface scattering, matte, soft skin, real human, cosplay, doll joints, ball-jointed doll, figma, "
        "action figure, flat color, cel shading, lineart, sketch, watercolor (medium), pen (medium), monochrome, "
        "comic, 2d, floating heart, sweatdrop",
    ),
    "高光亮油展示底座手办棚拍风（Glossy PVC + 亚克力底座 Stand）": (
        "2.2::figure::, 1.9::faux figurine::, 1.55::photo (medium)::, 1.4::realistic::, 1.35::3d::, "
        "1.7::shiny::, 1.65::shiny skin::, 1.5::shiny hair::, 1.45::shiny clothes::, oiled, "
        "display stand, diorama, reflection, rim lighting, backlighting, shadow, photo background, depth of field, bokeh, chromatic aberration",
        "subsurface scattering, matte, soft skin, real human, cosplay, doll joints, ball-jointed doll, figma, "
        "action figure, flat color, cel shading, lineart, sketch, watercolor (medium), pen (medium), monochrome, "
        "comic, 2d, floating heart, sweatdrop",
    ),
    "真实展示底座手办棚拍风（带圆形亚克力底座 Stand · 半哑光版）": (
        "1.9::figure::, 1.6::faux figurine::, 1.35::photo (medium)::, 1.25::realistic::, 1.2::3d::, "
        "display stand, miniature, photo background, depth of field, bokeh, studio lighting, rim lighting, "
        "subsurface scattering, painted pvc texture, glossy highlights",
        "doll joints, ball-jointed doll, figma, action figure, flat color, cel shading, lineart, sketch, "
        "watercolor (medium), pen (medium), monochrome, comic, 2d, floating heart, sweatdrop",
    ),
    "原生大颗粒 16-bit 像素游戏 CG 风（C5 推荐 · 小画布直出 + 3x 硬邻近方块放大）": (
        "3.6::pixel art::, 2.8::pixelated::, 2.2::8-bit::, 16-bit, 2.0::dithering::, "
        "sprite, retro game, dot art, blocky pixels, jagged lines, hard edges, warm lighting",
        "mosaic censoring, bar censor, censored, crown, tiara, picture frame, painting (object), "
        "highres, absurdres, smooth, smooth shading, anti-aliasing, cel shading, anime coloring, clean lines, lineart, "
        "airbrush, soft shading, gradient, watercolor (medium), painterly, realistic, 3d, photo (medium), figure, blurry, soft focus",
    ),
    "复古萌系大颗粒点阵 Sprite CG 风（E 保留款 · 1216x832 原生点阵画师风）": (
        "4.5::pixel art::, 2.5::dithering::, 2.0::retro artstyle::, 16-bit, 8-bit, "
        "artist:unosavy, artist:apollo_(pixel_art), artist:mota, "
        "game cg, sprite, dot art, soft colors, warm lighting",
        "mosaic censoring, bar censor, censored, crown, tiara, "
        "highres, absurdres, smooth shading, anti-aliasing, anime coloring, cel shading, vector, "
        "painterly, watercolor (medium), realistic, 3d, photo (medium), figure, blurry",
    ),
    "清透柔光厚涂插画风（柔肤高质感）": (
        "1.3::sharp focus::, fine details, 1.1::painterly::, soft lighting, subsurface scattering, "
        "warm lighting, rim lighting, delicate shading, luminous skin",
        "blurry, lowres, cel shading, flat color, thick outlines, harsh shadows, realistic, 3d, bad anatomy",
    ),
    "现代高锐度清亮赛璐璐动画风": (
        "1.3::sharp focus::, anime coloring, clean lines, vibrant colors, rim lighting, warm indoor lighting, glossy highlights",
        "blurry, out of focus, rough sketch, painterly, muted colors, realistic, 3d",
    ),
    "同人志精细黑白网点漫画风（Monochrome Manga）": (
        "1.4::sharp focus::, 1.4::monochrome::, 1.3::greyscale::, manga, comic, pen (medium), screentones, hatching (texture), intricate lineart",
        "color, colorful, watercolor (medium), painterly, blurry, soft focus, realistic, 3d",
    ),
    "自定义画风（使用下方自定义画风框）": ("", ""),
}

MULTI_PANEL_MODE_PRESETS: Dict[str, str] = {
    "📑 同屏双格漫画差分 (2koma 默认)": "2koma",
    "🖼️ 仅出单张图 · 前半拍进行中 (深坐/含入)": "single_a",
    "🖼️ 仅出单张图 · 后半拍事后拉丝 (微抬脱出/松口)": "single_b",
    "🎞️ 拆成前后两张独立单图 (预览框可切换挑选)": "single_pair",
}

MORPH_PRESETS: Dict[str, Tuple[str, str]] = {
    "1D 微明显蝴蝶低过渡（原版默认）": ("groin, pussy, labia, 0.65::spread pussy::", "barbie doll anatomy"),
    "1A 幼态平板一线天（Flat Innie Slit）": ("groin, pussy, 1.2::cleft of venus::, flat mons", "labia, puffy pussy, gaping, barbie doll anatomy"),
    "1B 饱满馒头丘陵型（Fat Mons & Puffy）": ("groin, mons pubis, 1.3::fat mons::, pussy, puffy pussy, cleft of venus", "1.8::labia::, gaping, barbie doll anatomy"),
    "1C 花苞微露含蓄型（Subtle Peeking）": ("groin, pussy, 0.5::labia::, 0.5::spread pussy::", "gaping, barbie doll anatomy"),
    "1D+ 明显舒展双翼型（高权重防吞版）": ("groin, pussy, 1.65::labia::, 1.0::spread pussy::", "barbie doll anatomy"),
}

PUBIC_PRESETS: Dict[str, Tuple[str, str]] = {
    "默认不额外指定": ("", ""),
    "2A 纯净白虎无毛（no pubic hair）": ("no pubic hair", "pubic hair"),
    "2B 少女初生稀疏绒毛（sparse pubic hair）": ("1.2::sparse pubic hair::, light pubic hair", "thick pubic hair"),
    "2C 修剪一线跑道型（landing strip）": ("pubic hair, 1.3::landing strip::, trimmed pubic hair", ""),
    "2E 涩气爱心修剪型（heart-shaped）": ("pubic hair, 1.4::heart-shaped pubic hair::", ""),
    "2F 自然浓密野生型（natural thick）": ("1.3::pubic hair::, messy pubic hair", ""),
}

PIGMENT_PRESETS: Dict[str, str] = {
    "3A 透肤暖珊瑚无色差（原版默认）": "",
    "3B 鲜嫩樱桃亮粉色（pink pussy）": "pink pussy",
    "3C 熟感边缘深色双色层次（dark-edged mucosa）": "dark pigmented labia edges, two-tone mucosa",
    "3D 兴奋充血潮红发亮（flushed & glistening）": "glistening, flushed groin",
}


STORY_CHAPTERS: List[Dict[str, str]] = [
    {"id": "F00", "title": "✨ 正脸试妆 · 晨光白床跪坐前倾（正面状态校验）", "actor_type": "Solo"},
    {"id": "S00", "title": "第 00 幕 · 沙发跪爬吐舌回眸", "actor_type": "Solo"},
    {"id": "S01", "title": "第 01 幕 · 沙发跪爬口部互动进行中", "actor_type": "Duo"},
    {"id": "S02", "title": "第 02 幕 · 口部事后松口拉丝 + 发丝沾染", "actor_type": "Duo"},
    {"id": "S03", "title": "第 03 幕 · 事前 vs 事后拉丝双格漫画差分 (2koma)", "actor_type": "2koma"},
    {"id": "S04", "title": "第 04 幕 · 骑乘位双格：左深坐溢流 ➔ 右微抬脱出疲软拉丝", "actor_type": "2koma"},
    {"id": "S05", "title": "第 05 幕 · 单人犬式单侧屈膝高抬腿排泄 + 大滩积液", "actor_type": "Solo"},
    {"id": "S06", "title": "第 06 幕 · 体力透支仰躺沙发熟睡 + 小腹积存一滩白浊", "actor_type": "Solo"},
    {"id": "S07", "title": "第 07 幕 · 熟睡盘腿脚心相对 + 双手抓脚足交（双脚糊满拉丝）", "actor_type": "Duo"},
    {"id": "S08", "title": "第 08 幕 · 盘腿抓脚互动中被弄醒 · 睡眼惺忪略带妩媚", "actor_type": "Duo"},
    {"id": "S09", "title": "第 09 幕 · 欺身单手轻拢脖颈 · 迷离仰视（中近景全痕迹保留）", "actor_type": "Duo"},
    {"id": "S10", "title": "第 10 幕 · 单手轻拢脖颈 + 传教士位压身深入（全痕迹保留）", "actor_type": "Duo"},
    {"id": "S11", "title": "第 11 幕 · 传教士位双腿间拔出外射至小腹（全痕迹叠加）", "actor_type": "Duo"},
]

MULTI_ANGLE_CHAPTERS: List[Dict[str, str]] = [
    {"id": "MA0", "title": "00 三视图设定表 · 正/侧/背全身 (1216x832)", "actor_type": "MultiAngle"},
    {"id": "MA1", "title": "01 仰视站立 · 低机位背手微倾", "actor_type": "MultiAngle"},
    {"id": "MA2", "title": "02 俯视抱膝 · 地板坐姿仰望", "actor_type": "MultiAngle"},
    {"id": "MA3", "title": "03 侧三分之四 · 窗边拂发回望", "actor_type": "MultiAngle"},
    {"id": "MA4", "title": "04 背后回眸 · 沙发跪坐转身", "actor_type": "MultiAngle"},
    {"id": "MA5", "title": "05 平视伸懒腰 · 举臂开心微笑", "actor_type": "MultiAngle"},
    {"id": "MA6", "title": "06 侧卧撑头 · 床面手肘倚枕 (1216x832)", "actor_type": "MultiAngle"},
    {"id": "MA7", "title": "07 近景特写 · 歪头比耶俏皮眨眼", "actor_type": "MultiAngle"},
    {"id": "MA8", "title": "08 盘腿托腮 · 柔毯前倾好奇凝视", "actor_type": "MultiAngle"},
]

MULTI_ANGLE_TEMPLATES: Dict[str, Dict[str, object]] = {
    "MA0": {
        "title": "MA0 · 三视图设定表 (Three-View Sheet)",
        "canvas": "横图 1216x832",
        "allow_multi_views": True,
        "scene": (
            "1.4::character sheet::, 1.4::turnaround::, 1.35::multiple views::, "
            "three views, front view, side view, back view, full body, standing, "
            "relaxed neutral pose, simple white background, clean reference sheet, "
            "looking at viewer, slight smile"
        ),
        "prose": "standing in a clean three-view character turnaround reference sheet showing front, side, and back views on a simple light background.",
    },
    "MA1": {
        "title": "MA1 · 仰视站立 (Low Angle Standing)",
        "canvas": "竖图 832x1216",
        "allow_multi_views": False,
        "scene": (
            "1.35::low angle::, 1.3::from below::, full body, standing, "
            "hands clasped behind back, slight tilt forward, looking down at viewer, "
            "foreshortening, indoors, cozy sunlit bedroom"
        ),
        "prose": "standing indoors in a cozy sunlit bedroom, hands clasped behind her back and leaning slightly forward while looking down at the viewer from a low angle.",
    },
    "MA2": {
        "title": "MA2 · 俯视抱膝 (High Angle Hugging Knees)",
        "canvas": "竖图 832x1216",
        "allow_multi_views": False,
        "scene": (
            "1.35::high angle::, 1.3::from above::, sitting on warm wooden floor, "
            "knees up, hugging own knees, looking up at viewer, gentle shy expression, "
            "indoors, cozy room"
        ),
        "prose": "sitting on a warm wooden floor hugging her knees and looking up gently at the viewer from a high angle.",
    },
    "MA3": {
        "title": "MA3 · 侧三分之四窗边拂发 (Side 3/4 Window)",
        "canvas": "竖图 832x1216",
        "allow_multi_views": False,
        "scene": (
            "three-quarter side view, upper body, standing beside sunlit window, "
            "gentle breeze, wind-blown hair, hand tucking hair behind ear, "
            "gazing out the window, soft golden afternoon glow"
        ),
        "prose": "standing beside a sunlit window in three-quarter side view, tucking wind-blown hair behind her ear in soft golden glow.",
    },
    "MA4": {
        "title": "MA4 · 背后回眸沙发跪坐 (Back Over Shoulder)",
        "canvas": "竖图 832x1216",
        "allow_multi_views": False,
        "scene": (
            "1.3::from behind::, back, 1.35::looking back::, over shoulder, "
            "upper body, kneeling on soft beige sofa, turning head toward viewer, "
            "indoors, soft cushions"
        ),
        "prose": "kneeling on a soft beige sofa seen from behind, turning her head over her shoulder toward the viewer.",
    },
    "MA5": {
        "title": "MA5 · 平视伸懒腰 (Morning Stretch)",
        "canvas": "竖图 832x1216",
        "allow_multi_views": False,
        "scene": (
            "eye-level, cowboy shot, arms raised overhead, morning stretch, "
            "leaning slightly back, relaxed cheerful smile, looking at viewer, "
            "indoors, sunlit bedroom"
        ),
        "prose": "stretching both arms overhead with a relaxed cheerful smile in an eye-level cowboy shot inside a sunlit bedroom.",
    },
    "MA6": {
        "title": "MA6 · 侧卧撑头床面倚枕 (Lying On Side)",
        "canvas": "横图 1216x832",
        "allow_multi_views": False,
        "scene": (
            "1.3::lying on side::, lying on bed, white bedsheet, head propped on hand, "
            "elbow resting on pillow, upper body, legs bent comfortably, looking at viewer, "
            "gentle relaxed gaze"
        ),
        "prose": "lying on her side on a white bedsheet with her head propped on one hand and elbow resting on a pillow, gazing gently at the viewer.",
    },
    "MA7": {
        "title": "MA7 · 近景歪头比耶特写 (Close-Up Peace Sign)",
        "canvas": "竖图 832x1216",
        "allow_multi_views": False,
        "scene": (
            "1.3::close-up::, portrait, head tilt, peace sign near cheek, "
            "playful cheerful expression, one eye slightly narrowed, looking at viewer, "
            "blurred warm indoor background"
        ),
        "prose": "in a close-up portrait tilting her head and making a playful peace sign near her cheek with a cheerful expression.",
    },
    "MA8": {
        "title": "MA8 · 盘腿托腮柔毯前倾 (Cross-Legged Chin Rest)",
        "canvas": "竖图 832x1216",
        "allow_multi_views": False,
        "scene": (
            "slight three-quarter angle, sitting cross-legged on soft rug, "
            "leaning forward, chin resting on both hands, elbows on knees, "
            "curious bright gaze, looking at viewer, cozy sunlit living room"
        ),
        "prose": "sitting cross-legged on a soft rug, leaning forward with her chin resting on both hands and gazing curiously at the viewer.",
    },
}


def scale_weight(base_weight: float, factor: float) -> str:
    val = round(max(0.45, min(2.2, base_weight * factor)), 2)
    if abs(val - 1.0) < 0.04:
        return ""
    return f"{val:g}"


def wtag(tag: str, base_weight: float, factor: float = 1.0) -> str:
    w = scale_weight(base_weight, factor)
    return f"{w}::{tag}::" if w else tag


def join_tags(*parts: str) -> str:
    tokens: List[str] = []
    for p in parts:
        if not p:
            continue
        cleaned = p.strip().strip(",")
        if cleaned:
            tokens.append(cleaned)
    return ", ".join(tokens)


def wrap_neg(level: str, tags_str: str, enabled: bool) -> str:
    """仅当负向模块启用且内容非空时包装 `-2::...::`"""
    if not enabled:
        return ""
    cleaned = tags_str.strip().strip(",")
    return f"{level}::{cleaned}::" if cleaned else ""


def wrap_tail_neg(m: Dict[str, str], tags_str: str, enabled: bool) -> str:
    """包装通用尾部负向块；M6-Tune2 额外保留器官级 -2.5::...:: 内联负向块于正向末尾"""
    base_neg = wrap_neg("-2", tags_str, enabled)
    tune2_inline = m.get("tune2_inline_neg", "")
    if enabled and tune2_inline:
        tune2_block = wrap_neg("-2.5", tune2_inline, True)
        return join_tags(base_neg, tune2_block)
    return base_neg


def build_common_modules(cfg: CharacterConfig, eyes_open: bool, is_sleep_disheveled: bool = False) -> Dict[str, str]:
    """根据精密参照模块开关编译各可选积木层（OFF 的模块直接返回空串，绝不残留多余词条或冲突负向）"""
    # 1. 质量词与画风词（像素画风下自动剥离 masterpiece / very aesthetic / absurdres；M6 无描边真肤下剥离 0.8::very aesthetic:: 防厚涂笔触块）
    pixel_mode = is_pixel_style_active(cfg)
    m6_mode = is_m6_soft_morning_skin_active(cfg)
    if not cfg.enable_quality or pixel_mode:
        qual_pos = ""
    elif m6_mode:
        qual_pos = "masterpiece, best quality, absurdres, year 2025"
    else:
        qual_pos = QUALITY_TAGS

    if cfg.enable_style:
        if cfg.style_preset == "自定义画风（使用下方自定义画风框）":
            style_only_pos = cfg.custom_style_pos.strip()
            style_neg = cfg.custom_style_neg.strip()
        else:
            style_only_pos, style_neg = STYLE_PRESETS.get(
                cfg.style_preset, STYLE_PRESETS["137_128 锋利钢笔水彩空气感逆光（原版默认）"]
            )
    else:
        style_only_pos, style_neg = "", ""

    head_pos = join_tags(qual_pos, style_only_pos)

    # 2. 身份模块 & 原设解锁预判 (enable_identity)
    outfit_info = OUTFIT_PRESETS.get(cfg.outfit_preset, OUTFIT_PRESETS["宽松滑肩白T恤·下身真空（故事线默认）"])
    outfit_kind = outfit_info.get("kind", "preset")
    allow_canon = (outfit_info.get("allow_canon", "0") == "1") or bool(cfg.keep_canon_elements)

    matched_builtin = (
        BUILTIN_CHARACTERS.get(cfg.preset_name)
        if (
            cfg.preset_name in BUILTIN_CHARACTERS
            and cfg.char_tag.strip() == BUILTIN_CHARACTERS[cfg.preset_name].get("char_tag", "").strip()
        )
        else None
    )

    m6_mode = is_m6_soft_morning_skin_active(cfg)
    has_explicit_canon = bool(
        matched_builtin and (matched_builtin.get("canon_outfit") or matched_builtin.get("canon_top_only"))
    )
    if cfg.enable_identity:
        raw_cid = cfg.char_tag.strip()
        if raw_cid and m6_mode and raw_cid != "original" and "::" not in raw_cid:
            if not allow_canon or has_explicit_canon or outfit_kind not in ("canon_full", "canon_top"):
                char_id = f"0.85::{raw_cid}::"
            else:
                char_id = f"0.9::{raw_cid}::"
        else:
            char_id = raw_cid if raw_cid else "original"
        eye_tag = cfg.eye_color.strip() if eyes_open else ""
        if m6_mode and eyes_open:
            if eye_tag == "purple eyes":
                eye_tag = "tareme, blue-purple eyes"
            elif "tareme" not in eye_tag:
                eye_tag = join_tags("tareme", eye_tag)
        hair_tag = cfg.hair_tags.strip()
        if m6_mode and hair_tag:
            if "short purple hair" in hair_tag:
                hair_tag = hair_tag.replace(
                    "short purple hair", "1.3::light purple hair::, grey-tinted hair, short hair"
                )
            elif "purple hair" in hair_tag:
                hair_tag = hair_tag.replace(
                    "purple hair", "1.3::light purple hair::, grey-tinted hair"
                )
            elif not any(c in hair_tag for c in ("grey-tinted hair", "grey hair", "white hair", "silver hair")):
                hair_tag = join_tags(hair_tag, "grey-tinted hair")
        if is_sleep_disheveled and "disheveled hair" not in hair_tag:
            hair_tag = join_tags(hair_tag, "disheveled hair")
        eng_name = cfg.eng_name.strip() or "the girl"
        raw_canon_neg = cfg.canon_neg_tags.strip()
    else:
        char_id, eye_tag, hair_tag = "", "", ""
        eng_name = "the girl"
        raw_canon_neg = ""

    # 3. 体型、胸围、肤色与萌点配件 (enable_body)
    wants_sweat_m6 = cfg.add_extra_sweat or ("shiny skin" in SKIN_PRESETS.get(cfg.skin_preset, ""))
    if m6_mode and wants_sweat_m6 and style_neg:
        for _w_tag in ("shiny ass, ", "light spots, ", "wet clothes, "):
            style_neg = style_neg.replace(_w_tag, "")

    if cfg.enable_body:
        body_pos, body_neg = BODY_PRESETS.get(cfg.body_preset, ("slender, petite", "plump, thick thighs"))
        if m6_mode:
            if "纤细娇小" in cfg.body_preset:
                body_pos = "1.3::slender::, 1.3::petite::, narrow hips, small ass"
                body_neg = "plump, thick thighs, wide hips, big ass, huge ass, curvy, voluptuous, mature female"
            elif "匀称修长少女" in cfg.body_preset:
                body_pos = "1.25::slender::, narrow waist, long legs"
                body_neg = "plump, obese"
        bust_pos, bust_neg = BUST_PRESETS.get(cfg.bust_preset, ("", ""))
        skin_pos = SKIN_PRESETS.get(cfg.skin_preset, "")
        extras: List[str] = []
        if cfg.add_cat_ears:
            extras.append("cat ears, animal ears, animal ear fluff")
        if cfg.add_horns_tail:
            extras.append("demon horns, demon tail")
        if cfg.add_glasses:
            extras.append("glasses, semi-rimless glasses")
        if cfg.add_choker:
            extras.append("choker, black choker")
        if cfg.add_extra_sweat:
            extras.append("sweatdrop, flying sweatdrops, steam")
        if cfg.extra_char_tags.strip():
            extras.append(cfg.extra_char_tags.strip())
        body_full_pos = join_tags(body_pos, bust_pos, skin_pos, ", ".join(extras))
        body_full_neg = join_tags(body_neg, bust_neg)
    else:
        body_pos = ""
        body_full_pos = ""
        body_full_neg = ""

    char_rest = join_tags(eye_tag, hair_tag, body_full_pos)
    char_core = join_tags(char_id, char_rest)

    # 4. 服装款式 × 穿脱暴露方式 × 场景物理需求（三维动态解耦）
    custom_outfit = cfg.custom_outfit_tags.strip()
    if cfg.enable_outfit:
        if outfit_kind == "canon_full":
            design_intact = join_tags("clothed", custom_outfit)
            outfit_prose_clause = f" below {custom_outfit}" if custom_outfit else ""
            front_shirt_prose = f" wearing {custom_outfit}" if custom_outfit else ""
        elif outfit_kind == "canon_top":
            design_intact = custom_outfit
            outfit_prose_clause = f" below {custom_outfit}" if custom_outfit else " below her lifted top"
            front_shirt_prose = f" wearing {custom_outfit}" if custom_outfit else ""
        elif outfit_kind == "custom":
            design_intact = custom_outfit
            outfit_prose_clause = f" below {custom_outfit}" if custom_outfit else " below her outfit"
            front_shirt_prose = f" wearing {custom_outfit}" if custom_outfit else " in her outfit"
        elif outfit_kind == "nude":
            design_intact = outfit_info["design_tags"]
            outfit_prose_clause = f" below {outfit_info['prose']}"
            front_shirt_prose = " completely nude"
        else:
            design_intact = join_tags(outfit_info["design_tags"], custom_outfit)
            if m6_mode and not wants_sweat_m6:
                design_intact = re.sub(r"(?:,\s*)?wet clothes(?=\s*,|$)", "", design_intact).strip(" ,")
            outfit_prose_clause = f" below {outfit_info['prose']}"
            if cfg.outfit_preset == "宽松滑肩白T恤·下身真空（故事线默认）":
                front_shirt_prose = " in an off-shoulder oversized white t-shirt"
            else:
                front_shirt_prose = f" wearing {outfit_info.get('intact_prose', outfit_info['prose'])}"

        design_pos = (
            join_tags(design_intact, outfit_info.get("sleep_extra", ""))
            if (is_sleep_disheveled and outfit_info.get("sleep_extra"))
            else design_intact
        )
    else:
        design_intact = ""
        design_pos = ""
        outfit_prose_clause = ""
        front_shirt_prose = ""

    raw_bottom = outfit_info.get("bottom_type", "none")
    d_low = design_intact.lower()
    if outfit_kind == "nude":
        bottom_type = "nude"
    elif outfit_kind == "canon_full":
        if any(k in d_low for k in ("shorts", "pants", "jeans")):
            bottom_type = "shorts"
        elif any(k in d_low for k in ("leotard", "bodysuit")):
            bottom_type = "leotard"
        elif any(k in d_low for k in ("bikini", "swimsuit")):
            bottom_type = "swimsuit"
        else:
            bottom_type = "skirt"
    elif raw_bottom == "auto" and outfit_kind != "custom":
        if any(k in d_low for k in ("leotard", "bodysuit")):
            bottom_type = "leotard"
        elif any(k in d_low for k in ("bikini", "swimsuit")):
            bottom_type = "swimsuit"
        elif any(k in d_low for k in ("shorts", "pants", "jeans")):
            bottom_type = "shorts"
        elif any(k in d_low for k in ("skirt", "dress", "serafuku", "maid", "panties", "underwear")):
            bottom_type = "skirt"
        else:
            bottom_type = "none"
    else:
        bottom_type = raw_bottom

    req_state = OUTFIT_STATE_PRESETS.get(cfg.outfit_state_mode, "auto")
    if not cfg.enable_clothing_state or req_state == "intact":
        eff_state = "intact"
    elif outfit_kind == "nude":
        eff_state = "nude"
    elif outfit_kind == "custom" and req_state == "auto":
        eff_state = "intact"
    elif req_state == "auto":
        eff_state = (
            "keep_bottom_aside"
            if bottom_type in ("skirt", "shorts", "leotard", "swimsuit", "skirt_or_canon")
            else "bottomless"
        )
    else:
        eff_state = req_state

    if eff_state == "intact":
        state_pos = ""
    elif eff_state == "nude":
        state_pos = "nude"
    elif eff_state == "keep_bottom_aside":
        if bottom_type == "leotard":
            state_pos = "clothes lift, leotard aside"
        elif bottom_type == "swimsuit":
            state_pos = "bikini aside, swimsuit aside"
        elif bottom_type == "shorts":
            state_pos = "unbuttoned, open shorts, panties aside"
        else:
            state_pos = "clothes lift, skirt lift, panties aside"
    elif eff_state == "half_off":
        if bottom_type == "shorts":
            state_pos = "disheveled clothes, open clothes, open shorts, panties around one leg"
        elif bottom_type in ("skirt", "leotard", "swimsuit", "skirt_or_canon"):
            state_pos = "disheveled clothes, open clothes, skirt lift, panties around one leg"
        else:
            state_pos = "disheveled clothes, open clothes, clothes lift, bottomless, panties around one leg"
    else:
        state_pos = "clothes lift, bottomless, no panties"

    seen_o = set()
    dedup_o: List[str] = []
    for _t in [x.strip() for x in join_tags(design_pos, state_pos).split(",") if x.strip()]:
        if _t.lower() not in seen_o:
            seen_o.add(_t.lower())
            dedup_o.append(_t)
    outfit_pos = ", ".join(dedup_o)
    outfit_intact = design_intact
    if eff_state in ("intact", "keep_bottom_aside") and bottom_type in ("skirt", "shorts", "leotard", "swimsuit", "skirt_or_canon"):
        outfit_upper_oral = outfit_intact
    else:
        outfit_upper_oral = outfit_pos

    if not cfg.enable_identity:
        canon_neg = ""
    elif outfit_kind == "canon_top" and not cfg.keep_canon_elements and eff_state in ("bottomless", "half_off"):
        canon_neg = (
            matched_builtin.get("canon_bottom_neg", "skirt, pants, shorts")
            if matched_builtin
            else "skirt, pants, shorts"
        )
    elif allow_canon:
        canon_neg = ""
    else:
        canon_neg = raw_canon_neg

    # 判断该穿搭在仰躺/传教士幕次是否遮盖腰腹（避免把连衣裙/兔女郎硬挖破成裸露肚脐）
    is_bare_midriff_canon = any(k in d_low for k in ("crop top", "navel", "bikini", "midriff"))
    is_dress_or_bodysuit = any(k in d_low for k in ("dress", "leotard", "bodysuit", "nightgown")) or (
        outfit_kind == "canon_full" and matched_builtin is None
    )
    covers_midriff = bool(
        cfg.enable_outfit
        and eff_state not in ("nude", "bottomless")
        and is_dress_or_bodysuit
        and not is_bare_midriff_canon
    )
    belly_tags = "" if covers_midriff else "midriff, stomach, navel"
    belly_tags_s06_11 = "stomach" if covers_midriff else "midriff, stomach, navel"
    stomach_rem_tag = "cum on clothes" if covers_midriff else "cum on stomach"
    stomach_rem_prose = (
        f" on her outfit{outfit_prose_clause}" if covers_midriff else " on her bare lower stomach"
    )
    stomach_pool_prose = (
        ", exposing thick white cum soaking her outfit and thighs"
        if covers_midriff
        else f", exposing a thick pool of white cum resting on her bare lower stomach and navel{outfit_prose_clause}"
    )

    # F00 正面试妆专属组合：完整默认不加掀脱，主动选掀脱模式时同步响应穿脱状态
    if cfg.enable_outfit and cfg.outfit_preset == "宽松滑肩白T恤·下身真空（故事线默认）":
        front_design = join_tags("oversized white t-shirt, off-shoulder, single bare shoulder", custom_outfit)
    else:
        front_design = outfit_intact
    f00_active_undress = cfg.enable_clothing_state and (req_state in ("keep_bottom_aside", "half_off", "bottomless"))
    front_outfit_tags = join_tags(front_design, state_pos) if f00_active_undress else front_design
    if f00_active_undress and cfg.enable_outfit and outfit_kind == "preset":
        front_shirt_prose = f" wearing {outfit_info['prose']}"

    # 5. 鞋袜外观词 (enable_legwear) —— 解耦原设鞋袜与赤足，避免强迫穿靴/穿袜角色裸足露脚趾
    is_canon_legwear = cfg.legwear_preset == "🌟 随角色原设鞋袜 / 不强制赤足"
    if cfg.enable_legwear:
        leg_normal, leg_foot_look, leg_prose = LEGWEAR_PRESETS.get(
            cfg.legwear_preset, LEGWEAR_PRESETS["赤足裸腿（barefoot 默认）"]
        )
        if is_canon_legwear:
            foot_hold_tags = "no shoes, socks, clothed feet, soles, soles together"
            soles_rear = ""
            front_leg_tags = ""
        elif "barefoot" in leg_foot_look:
            foot_hold_tags = join_tags(leg_foot_look, "soles, toes, soles together")
            soles_rear = "soles"
            front_leg_tags = "bare thighs"
        else:
            foot_hold_tags = join_tags(leg_foot_look, "soles, soles together")
            soles_rear = "soles"
            front_leg_tags = leg_normal
    else:
        leg_normal = ""
        foot_hold_tags = "soles, toes, soles together"
        soles_rear = "soles"
        leg_prose = "feet"
        front_leg_tags = "bare thighs"

    # 6. 背景模块 (enable_background)
    if cfg.enable_background:
        if m6_mode:
            bg_couch = "indoors, beige couch, window, cream sheer curtains"
            bg_sleep_couch = "indoors, beige couch, pillow, window, cream sheer curtains"
            loc_prose = " by cream sheer curtains"
        else:
            bg_couch = "indoors, couch, lamp"
            bg_sleep_couch = "indoors, couch, pillow, lamp"
            loc_prose = " on the warm-lit couch"
    else:
        bg_couch = ""
        bg_sleep_couch = ""
        loc_prose = ""
    on_couch_tag = "lying on couch" if cfg.enable_background else ""
    kneel_couch_tag = "kneeling on couch" if cfg.enable_background else "kneeling"
    hands_couch_tag = "hands on couch" if cfg.enable_background else "supporting weight"

    # 7. 局部四维模块 (enable_anatomy)
    if cfg.enable_anatomy:
        morph_pos, morph_neg = MORPH_PRESETS.get(cfg.morph_preset, MORPH_PRESETS["1D 微明显蝴蝶低过渡（原版默认）"])
        if "1D+" in cfg.morph_preset and "petite" in body_pos:
            morph_pos = "groin, pussy, 1.8::labia::, 1.1::spread pussy::"
        pubic_pos, pubic_neg = PUBIC_PRESETS.get(cfg.pubic_preset, ("", ""))
        pigment_pos = PIGMENT_PRESETS.get(cfg.pigment_preset, "")
        anat_pos = join_tags(morph_pos, pubic_pos, pigment_pos)
        anat_neg = join_tags(morph_neg, pubic_neg)
    else:
        anat_pos = "groin, pussy"
        anat_neg = ""

    intact_neg = (
        "nude, topless, bottomless"
        if (cfg.enable_outfit and eff_state == "intact" and outfit_kind not in ("nude", "custom"))
        else ""
    )
    is_tune2 = "M6-Tune2" in cfg.style_preset
    if is_tune2:
        common_tail_neg = join_tags(anat_neg, canon_neg, intact_neg)
    else:
        common_tail_neg = join_tags(style_neg, body_full_neg, anat_neg, canon_neg, intact_neg)

    return {
        "head_pos": head_pos,
        "char_id": char_id,
        "char_rest": char_rest,
        "char_core": char_core,
        "outfit_pos": outfit_pos,
        "outfit_intact": outfit_intact,
        "outfit_upper_oral": outfit_upper_oral,
        "outfit_prose_clause": outfit_prose_clause,
        "front_outfit_tags": front_outfit_tags,
        "front_leg_tags": front_leg_tags,
        "front_shirt_prose": front_shirt_prose,
        "outfit_kind": outfit_kind,
        "f00_active_undress": "1" if f00_active_undress else "",
        "covers_midriff": "1" if covers_midriff else "",
        "belly_tags": belly_tags,
        "belly_tags_s06_11": belly_tags_s06_11,
        "stomach_rem_tag": stomach_rem_tag,
        "stomach_rem_prose": stomach_rem_prose,
        "stomach_pool_prose": stomach_pool_prose,
        "soles_rear": soles_rear,
        "leg_normal": leg_normal,
        "leg_foot": foot_hold_tags,
        "leg_prose": leg_prose,
        "bg_couch": bg_couch,
        "bg_sleep_couch": bg_sleep_couch,
        "on_couch_tag": on_couch_tag,
        "kneel_couch_tag": kneel_couch_tag,
        "hands_couch_tag": hands_couch_tag,
        "loc_prose": loc_prose,
        "anat_pos": anat_pos,
        "common_tail_neg": common_tail_neg,
        "tune2_inline_neg": style_neg if is_tune2 else "",
        "canon_neg": canon_neg,
        "name": eng_name,
    }


def is_figure_style_active(cfg: CharacterConfig) -> bool:
    if not cfg.enable_style:
        return False
    if "手办" in cfg.style_preset or "Figurine" in cfg.style_preset or "PVC" in cfg.style_preset:
        return True
    if cfg.style_preset == "自定义画风（使用下方自定义画风框）":
        low = cfg.custom_style_pos.lower()
        return "figure" in low or "figurine" in low
    return False


def is_glossy_figure_style_active(cfg: CharacterConfig) -> bool:
    if not is_figure_style_active(cfg):
        return False
    if "高光亮油" in cfg.style_preset or "Glossy" in cfg.style_preset:
        return True
    if cfg.style_preset == "自定义画风（使用下方自定义画风框）":
        low = cfg.custom_style_pos.lower()
        return "shiny skin" in low or "glossy" in low
    return False


def is_pixel_style_active(cfg: CharacterConfig) -> bool:
    """检测当前是否启用了像素点阵画风（C5 或 E 或自定义 pixel art）"""
    if not cfg.enable_style:
        return False
    if "像素" in cfg.style_preset or "Sprite" in cfg.style_preset or "点阵" in cfg.style_preset:
        return True
    if cfg.style_preset == "自定义画风（使用下方自定义画风框）":
        low = cfg.custom_style_pos.lower()
        return "pixel art" in low or "pixelated" in low or "dot art" in low
    return False


def is_c5_lowres_pixel_style_active(cfg: CharacterConfig) -> bool:
    """检测是否为 C5 原生小画布 (512x384 / 384x512) + 3x 硬邻近放大像素风"""
    if not is_pixel_style_active(cfg):
        return False
    return "C5" in cfg.style_preset or "小画布直出" in cfg.style_preset


def is_m6_soft_morning_skin_active(cfg: CharacterConfig) -> bool:
    """检测是否启用了柔雾晨光暖杏柔肤家族画风（M6 保留款）"""
    if not cfg.enable_style:
        return False
    return any(k in cfg.style_preset for k in ("M6", "无描边暖杏真肤"))


def expr_if(cfg: CharacterConfig, tags: str, essential: str = "") -> str:
    """表情开关：关闭时仅保留剧情关键睁闭眼状态 essential；真实手办/M6晨光真肤画风下自动剥离平面符号与真人唇眼触发词"""
    m6_on = is_m6_soft_morning_skin_active(cfg)
    clean_ess = essential
    if m6_on and clean_ess:
        clean_ess = re.sub(r"(?:\d+(?:\.\d+)?::)?half-closed eyes(?:::)?", "0.85::half-closed eyes::", clean_ess)
    if not cfg.enable_expression:
        return clean_ess
    cleaned_tags = tags
    if is_figure_style_active(cfg) or m6_on:
        out_tokens: List[str] = []
        for raw_t in tags.split(","):
            t = raw_t.strip()
            if not t or "floating heart" in t or "sweatdrop" in t:
                continue
            if m6_on:
                if "bedroom eyes" in t:
                    t = "shy"
                elif "seductive smile" in t:
                    t = "furrowed brow"
                elif t == "parted lips":
                    t = "open mouth"
                elif "half-closed eyes" in t:
                    t = "0.85::half-closed eyes::"
            if t not in out_tokens:
                out_tokens.append(t)
        cleaned_tags = ", ".join(out_tokens)
    return join_tags(clean_ess, cleaned_tags)


def prose_if(cfg: CharacterConfig, text: str) -> str:
    if not cfg.enable_t5_prose:
        return ""
    body = text.strip()
    if not body:
        return ""
    if is_c5_lowres_pixel_style_active(cfg):
        return (
            "Low-resolution retro pixel art game CG upscaled with nearest-neighbor scaling, "
            f"large visible square pixels, stepped jagged pixel outlines, crosshatch dithering, zero anti-aliasing: {body}"
        )
    if is_pixel_style_active(cfg):
        return (
            "Authentic 16-bit pixel art game CG drawn with chunky visible square pixels, "
            f"stepped pixel-grid outlines, and checkerboard dithering: {body}"
        )
    if is_m6_soft_morning_skin_active(cfg):
        m6_body = body.replace("her lips", "her mouth")
        return (
            "Warm morning frontal light by cream sheer curtains, "
            "lineless rosy-apricot skin with smooth 3D shading, "
            f"flat 2D moe anime face with big eyes and dot nose: {m6_body}"
        )
    if is_glossy_figure_style_active(cfg):
        return (
            "DSLR macro photo of a glossy clear-coated painted PVC scale figurine under studio spotlights, "
            f"with sharp white plastic reflections on molded hair, lacquered skin, rigid PVC clothes, and glossy resin fluids: {body}"
        )
    if is_figure_style_active(cfg):
        return f"Macro product photo of a painted PVC scale figurine with shallow depth of field and bokeh: {body}"
    return body


def generate_scene_prompts(
    scene_id: str, cfg: CharacterConfig, pov_override: str | None = None
) -> List[Tuple[str, str, str]]:
    """
    严格按视角轨道（"pov" 第一人称 vs "3rd" 第三人称）独立生成指定幕次的提示词，
    并根据精密参照开关动态裁剪非动作词条。
    """
    mode = pov_override if pov_override in ("pov", "3rd") else cfg.perspective_mode
    is_pov = mode == "pov"
    f = cfg.fluid_scale
    af = cfg.enable_action_fluids
    rem = cfg.enable_remnants
    neg_on = cfg.enable_negatives
    results: List[Tuple[str, str, str]] = []

    # ==========================================
    # MA0..MA8: 多角度套图（9 镜头 · 与故事线并列独立运作）
    # ==========================================
    if scene_id in MULTI_ANGLE_TEMPLATES:
        tpl = MULTI_ANGLE_TEMPLATES[scene_id]
        m = build_common_modules(cfg, eyes_open=True)
        ma_outfit = m["front_outfit_tags"]
        ma_shirt_prose = m["front_shirt_prose"]
        ma_leg = m["front_leg_tags"]
        nsfw_on = cfg.enable_multi_angle_nsfw
        nsfw_prefix = "rating:explicit, nsfw, uncensored" if nsfw_on else ""
        anat_ma = m["anat_pos"] if (nsfw_on and cfg.enable_anatomy) else ""
        ma_tail_neg = m["common_tail_neg"]
        if ma_tail_neg:
            neg_tokens = [t.strip() for t in ma_tail_neg.split(",") if t.strip()]
            if tpl["allow_multi_views"]:
                neg_tokens = [t for t in neg_tokens if t.lower() != "multiple views"]
            if nsfw_on:
                neg_tokens = [t for t in neg_tokens if t.lower() != "nsfw"]
            elif "nude" not in ma_outfit and "nsfw" not in [t.lower() for t in neg_tokens]:
                neg_tokens.insert(0, "nsfw")
            ma_tail_neg = ", ".join(neg_tokens)
        elif not nsfw_on and "nude" not in ma_outfit:
            ma_tail_neg = "nsfw"
        p_ma = join_tags(
            m["head_pos"],
            "1girl, solo",
            m["char_core"],
            ma_outfit,
            ma_leg,
            nsfw_prefix,
            anat_ma,
            str(tpl["scene"]),
            prose_if(cfg, f"{m['name']}{ma_shirt_prose} {tpl['prose']}"),
            wrap_tail_neg(m, ma_tail_neg, neg_on),
        )
        results.append((f"【{tpl['title']}】", str(tpl["canvas"]), p_ma))
        return results

    # ==========================================
    # F00: 晨光白床正面跪坐前倾（正脸与身材状态校验）
    # ==========================================
    if scene_id == "F00":
        m = build_common_modules(cfg, eyes_open=True)
        bg_bed = "indoors, bedroom, bed, white bedsheet, wooden headboard, window, cream sheer curtains" if cfg.enable_background else ""
        bed_prose = " on a white bedsheet in front of a wooden headboard" if cfg.enable_background else ""

        front_outfit = m["front_outfit_tags"]
        shirt_prose = m["front_shirt_prose"]
        leg_front = m["front_leg_tags"]

        fo_low = front_outfit.lower()
        if m.get("outfit_kind") == "custom":
            has_explicit_outfit = bool(m["f00_active_undress"])
            anat_front = m["anat_pos"] if m["f00_active_undress"] else ""
        else:
            has_explicit_outfit = ("nude" in fo_low) or ("breasts out" in fo_low) or bool(m["f00_active_undress"])
            anat_front = m["anat_pos"] if (("nude" in fo_low) or m["f00_active_undress"]) else ""
        nsfw_prefix = "rating:explicit, nsfw, uncensored" if has_explicit_outfit else ""

        exp_tags = expr_if(cfg, "furrowed brow, shy, soft blush")
        kneel_tag = "kneeling on bed" if cfg.enable_background else "kneeling"

        if is_pov:
            p_pov = join_tags(
                m["head_pos"], "1girl, solo", m["char_core"],
                front_outfit, leg_front, nsfw_prefix, anat_front,
                bg_bed, kneel_tag, "leaning forward, arms in front, looking at viewer",
                exp_tags,
                prose_if(cfg, f"{m['name']} kneeling{bed_prose}, leaning forward with her arms in front{shirt_prose} while gazing shyly at the viewer."),
                wrap_tail_neg(m, m["common_tail_neg"], neg_on),
            )
            results.append(("【F00 · 第一人称视角 (POV) · 晨光白床正面跪坐前倾（正脸状态校验）】", "竖图 832x1216", p_pov))
        else:
            p_3rd = join_tags(
                m["head_pos"], "1girl, solo", m["char_core"],
                front_outfit, leg_front, nsfw_prefix, anat_front,
                bg_bed, "front view, cowboy shot", kneel_tag, "knees apart, leaning forward, arms in front, looking at viewer",
                exp_tags,
                prose_if(cfg, f"Frontal cowboy shot of {m['name']} kneeling with knees apart{bed_prose}, leaning forward with her arms in front{shirt_prose} while gazing shyly at the viewer."),
                wrap_tail_neg(m, join_tags("from behind, back, profile", m["common_tail_neg"]), neg_on),
            )
            results.append(("【F00 · 第三人称视角 (客观镜头) · 正面七分身跪床前倾（正脸与比例校验）】", "竖图 832x1216", p_3rd))

    # ==========================================
    # S00: 沙发跪爬吐舌回眸
    # ==========================================
    elif scene_id == "S00":
        m = build_common_modules(cfg, eyes_open=True)
        rem_tags = join_tags("after vaginal, cum", wtag("cum in pussy", 1.0, f), wtag("cumdrip", 1.0, f), "cum on thighs, sweat") if rem else ""
        exp_tags = expr_if(cfg, ":p, tongue out, smug, furrowed brow, half-closed eyes, watery eyes, blush, floating heart")
        if is_pov:
            p = join_tags(
                m["head_pos"], "1girl, solo", m["char_core"], m["bg_couch"],
                "1.45::pov::, 1.4::from behind::, close-up, foreshortening, low angle",
                "all fours, arched back, knees apart", m["leg_normal"], m["soles_rear"], "looking back, looking at viewer",
                m["outfit_pos"], exp_tags,
                "rating:explicit, nsfw, uncensored, ass", m["anat_pos"], rem_tags,
                prose_if(cfg, f"Close-up first-person POV standing right behind {m['name']} kneeling on all fours{m['loc_prose']} as she arches her back and looks back over her shoulder right at the viewer."),
                wrap_tail_neg(m, join_tags("sitting, wide shot, distant", m["common_tail_neg"]), neg_on),
            )
            results.append(("【S00 · 第一人称视角 (POV) · 贴近臀后俯看跪爬回眸】", "竖图 832x1216 或 横图 1216x832", p))
        else:
            p = join_tags(
                m["head_pos"], "1girl, solo", m["char_core"], m["bg_couch"],
                "full body, 1.3::from behind::, from side, low angle, perspective",
                "all fours, arched back, knees apart", m["leg_normal"], m["soles_rear"], "looking back, looking at viewer",
                m["outfit_pos"], exp_tags,
                "rating:explicit, nsfw, uncensored, ass", m["anat_pos"], rem_tags,
                prose_if(cfg, f"Full-body angled rear-side view of {m['name']} kneeling on all fours{m['loc_prose']} as she arches her back and looks back over her shoulder at the viewer."),
                wrap_tail_neg(m, join_tags("pov, close-up, sitting", m["common_tail_neg"]), neg_on),
            )
            results.append(("【S00 · 第三人称视角 (客观镜头) · 侧后 30° 全景跪爬回眸】", "横图 1216x832", p))

    # ==========================================
    # S01: 跪爬口部互动进行中
    # ==========================================
    elif scene_id == "S01":
        m = build_common_modules(cfg, eyes_open=True)
        exp_tags = expr_if(cfg, "furrowed brow, half-closed eyes, watery eyes, blush, floating heart")
        rem_tags = join_tags("after vaginal, cum", wtag("cum in pussy", 1.0, f), wtag("cumdrip", 1.0, f), "cum on thighs") if rem else ""
        fluid_act = "saliva, sweat" if af else ""
        if is_pov:
            p = join_tags(
                m["head_pos"], "1girl, 1boy, hetero", m["char_core"], "faceless male", m["bg_couch"],
                "1.5::pov::, 1.4::pov crotch::, 1.35::from above::, foreshortening",
                "all fours", m["kneel_couch_tag"], "leaning forward, arched back, looking up, looking at viewer",
                m["outfit_upper_oral"], exp_tags,
                "rating:explicit, nsfw, uncensored, 1.4::oral::, 1.4::fellatio::, penis", fluid_act,
                prose_if(cfg, f"First-person POV looking down{m['loc_prose']} as {m['name']} kneels forward on all fours performing fellatio while gazing up at the viewer."),
                wrap_tail_neg(m, join_tags("from behind, profile, sitting, male focus", m["common_tail_neg"]), neg_on),
            )
            results.append(("【S01 · 第一人称视角 (POV) · 男方俯视口部互动进行中】", "竖图 832x1216", p))
        else:
            p = join_tags(
                m["head_pos"], "1girl, 1boy, hetero", m["char_core"], "faceless male, head out of frame", m["bg_couch"],
                "1.6::from behind::, low angle, foreshortening, dynamic perspective",
                "all fours, arched back, knees apart", m["leg_normal"], m["soles_rear"], "looking back, sidelong glance, looking at viewer",
                m["outfit_pos"], exp_tags,
                "rating:explicit, nsfw, uncensored, oral, fellatio, penis", fluid_act, "ass", m["anat_pos"], rem_tags,
                prose_if(cfg, f"Rear three-quarter low-angle perspective angled 30 degrees along {m['name']}'s spine, looking past her hips in the right foreground toward her head and the faceless man's lower body in the left midground."),
                wrap_tail_neg(m, join_tags("pov, from side, profile, sitting, male focus", m["common_tail_neg"]), neg_on),
            )
            results.append(("【S01 · 第三人称视角 (客观镜头) · 侧后 30° 跪爬 + 左侧男方进行中】", "横图 1216x832", p))

    # ==========================================
    # S02: 口部事后松口拉丝 + 发丝沾染
    # ==========================================
    elif scene_id == "S02":
        m = build_common_modules(cfg, eyes_open=True)
        exp_tags = expr_if(cfg, "furrowed brow, half-closed eyes, watery eyes, heavy blush, floating heart")
        oral_fluids = join_tags(
            wtag("cum in mouth", 1.05, f), wtag("cum on face", 1.25, f), wtag("cum in hair", 0.85, f), wtag("cum string", 1.45, f), "saliva trail, sweat"
        ) if af else ""
        rem_lower = join_tags("after vaginal, cum", wtag("cum in pussy", 1.0, f), wtag("cumdrip", 1.0, f), "cum on thighs") if rem else ""
        fluid_clause = " with sticky white cum strings bridging from her mouth and splatters on her cheek and hair" if af else ""
        if is_pov:
            p = join_tags(
                m["head_pos"], "1girl, 1boy, hetero", m["char_core"], "faceless male", m["bg_couch"],
                "1.5::pov::, 1.4::pov crotch::, 1.35::from above::, foreshortening",
                "all fours", m["kneel_couch_tag"], "leaning forward, looking up, looking at viewer",
                m["outfit_upper_oral"], exp_tags,
                "rating:explicit, nsfw, uncensored, 1.4::after fellatio::, 0.6::oral, fellatio::, penis, erection",
                oral_fluids,
                prose_if(cfg, f"First-person POV looking down as {m['name']} pulls her lips slightly back right after fellatio{m['loc_prose']}, gazing up at the viewer{fluid_clause}."),
                wrap_tail_neg(m, join_tags("from behind, profile, sitting, male focus", m["common_tail_neg"]), neg_on),
            )
            results.append(("【S02 · 第一人称视角 (POV) · 男方俯视刚松口拉丝 + 发丝沾染】", "竖图 832x1216", p))
        else:
            p = join_tags(
                m["head_pos"], "1girl, 1boy, hetero", m["char_core"], "faceless male, head out of frame", m["bg_couch"],
                "1.6::from behind::, low angle, foreshortening, dynamic perspective",
                "all fours, arched back, knees apart", m["leg_normal"], m["soles_rear"], "looking back, sidelong glance, looking at viewer",
                m["outfit_pos"], exp_tags,
                "rating:explicit, nsfw, uncensored, after fellatio, 0.6::oral, fellatio::, penis",
                oral_fluids, "ass", m["anat_pos"], rem_lower,
                prose_if(cfg, f"Rear three-quarter low-angle perspective angled 30 degrees along {m['name']}'s spine, looking past her hips in the right foreground toward her head pulling back{fluid_clause} from the faceless man's lower body in the left midground."),
                wrap_tail_neg(m, join_tags("pov, from side, profile, sitting, male focus", m["common_tail_neg"]), neg_on),
            )
            results.append(("【S02 · 第三人称视角 (客观镜头) · 侧后 30° 松口拉丝 + 发丝沾染】", "横图 1216x832", p))

    # ==========================================
    # S03: 事前 vs 事后拉丝（支持 2koma 双格 或 拆为单张高清图）
    # ==========================================
    elif scene_id == "S03":
        m = build_common_modules(cfg, eyes_open=True)
        exp_tags = expr_if(cfg, "furrowed brow, half-closed eyes, watery eyes, heavy blush")
        act_fluids = join_tags(wtag("cum on face", 1.25, f), wtag("cum in hair", 0.85, f), wtag("cum string", 1.4, f), "sweat") if af else ""
        before_fluids = "saliva, sweat" if af else ""
        rem_lower = join_tags("after vaginal, cum", wtag("cumdrip", 1.1, f)) if rem else ""
        after_clause = " with sticky white cum strings bridging from her lips and splatters on her cheek and hair" if af else ""
        mp_mode = cfg.multi_panel_mode

        if mp_mode == "2koma":
            if is_pov:
                p_pov = join_tags(
                    "2.5::2koma::, 2.5::vertical split screen::, comic, two panels, vertical border, dividing line, gutter, 2girls, 2boys, same character, hetero",
                    m["head_pos"], m["char_core"], "faceless male", m["bg_couch"],
                    "1.5::pov::, 1.4::pov crotch::, 1.35::from above::, foreshortening",
                    m["kneel_couch_tag"], "leaning forward, looking up, looking at viewer",
                    m["outfit_upper_oral"], exp_tags,
                    "rating:explicit, nsfw, uncensored, oral, fellatio, after fellatio, penis", act_fluids,
                    prose_if(cfg, f"Two side-by-side first-person POV panels looking down at {m['name']}{m['loc_prose']}: in the left panel she performs fellatio; in the right panel she pulls back right after{after_clause}."),
                    wrap_tail_neg(m, join_tags("1girl, solo, single panel, from behind, profile, male focus, 4koma, speech bubble", m["common_tail_neg"]), neg_on),
                )
                results.append(("【S03 · 第一人称视角 (POV) · 左右双格俯视口部事前 vs 事后】", "横图 1216x832", p_pov))
            else:
                p_3rd = join_tags(
                    "2.5::2koma::, 2.5::horizontal split screen::, comic, two panels, horizontal border, dividing line, gutter, 2girls, 2boys, same character, hetero",
                    m["head_pos"], m["char_core"], "faceless male, head out of frame", m["bg_couch"],
                    "1.5::from behind::, low angle, foreshortening",
                    "all fours, arched back, knees apart", m["leg_normal"], m["soles_rear"], "looking back, sidelong glance, looking at viewer",
                    m["outfit_pos"], exp_tags,
                    "rating:explicit, nsfw, uncensored, oral, fellatio, after fellatio, penis", act_fluids,
                    "ass", m["anat_pos"], rem_lower,
                    prose_if(cfg, f"Two stacked horizontal panels from the same 30-degree rear low-angle view of {m['name']}{m['loc_prose']}: in the top panel she performs fellatio; in the bottom panel she pulls back right after{after_clause}."),
                    wrap_tail_neg(m, join_tags("pov, 1girl, solo, single panel, profile, sitting, male focus, 4koma, speech bubble", m["common_tail_neg"]), neg_on),
                )
                results.append(("【S03 · 第三人称视角 (客观镜头) · 上下横构图双格 30° 侧后事前 vs 事后】", "竖图 832x1216", p_3rd))
        else:
            no_split_neg = "2koma, 4koma, split screen, multiple views, comic, border, speech bubble"
            if is_pov:
                p_a = join_tags(
                    m["head_pos"], "1girl, 1boy, hetero", m["char_core"], "faceless male", m["bg_couch"],
                    "1.5::pov::, 1.4::pov crotch::, 1.35::from above::, foreshortening",
                    "all fours", m["kneel_couch_tag"], "leaning forward, arched back, looking up, looking at viewer",
                    m["outfit_upper_oral"], exp_tags,
                    "rating:explicit, nsfw, uncensored, 1.45::oral::, 1.45::fellatio::, deepthroat, penis", before_fluids,
                    prose_if(cfg, f"Single full-frame first-person POV looking down at {m['name']}{m['loc_prose']} kneeling forward performing deep fellatio while gazing up at the viewer."),
                    wrap_tail_neg(m, join_tags(no_split_neg, "from behind, profile, sitting, male focus", m["common_tail_neg"]), neg_on),
                )
                p_b = join_tags(
                    m["head_pos"], "1girl, 1boy, hetero", m["char_core"], "faceless male", m["bg_couch"],
                    "1.5::pov::, 1.4::pov crotch::, 1.35::from above::, foreshortening",
                    "all fours", m["kneel_couch_tag"], "leaning forward, looking up, looking at viewer",
                    m["outfit_upper_oral"], exp_tags,
                    "rating:explicit, nsfw, uncensored, 1.45::after fellatio::, 0.55::oral::, penis, erection", act_fluids,
                    prose_if(cfg, f"Single full-frame first-person POV looking down at {m['name']}{m['loc_prose']} pulling her lips slightly back right after fellatio{after_clause}."),
                    wrap_tail_neg(m, join_tags(no_split_neg, "from behind, profile, sitting, male focus", m["common_tail_neg"]), neg_on),
                )
                if mp_mode in ("single_a", "single_pair"):
                    results.append(("【S03 单图A · 第一人称 (POV) · 口部深入进行中单幅】", "竖图 832x1216", p_a))
                if mp_mode in ("single_b", "single_pair"):
                    results.append(("【S03 单图B · 第一人称 (POV) · 事后松口拉丝单幅】", "竖图 832x1216", p_b))
            else:
                p_a = join_tags(
                    m["head_pos"], "1girl, 1boy, hetero", m["char_core"], "faceless male, head out of frame", m["bg_couch"],
                    "1.6::from behind::, low angle, foreshortening, dynamic perspective",
                    "all fours, arched back, knees apart", m["leg_normal"], m["soles_rear"], "looking back, sidelong glance, looking at viewer",
                    m["outfit_pos"], exp_tags,
                    "rating:explicit, nsfw, uncensored, 1.4::oral::, 1.4::fellatio::, penis", before_fluids,
                    "ass", m["anat_pos"], rem_lower,
                    prose_if(cfg, f"Single full-frame 30-degree rear low-angle view of {m['name']}{m['loc_prose']} kneeling on all fours performing fellatio on the faceless man in the left midground."),
                    wrap_tail_neg(m, join_tags(no_split_neg, "pov, from side, profile, sitting, male focus", m["common_tail_neg"]), neg_on),
                )
                p_b = join_tags(
                    m["head_pos"], "1girl, 1boy, hetero", m["char_core"], "faceless male, head out of frame", m["bg_couch"],
                    "1.6::from behind::, low angle, foreshortening, dynamic perspective",
                    "all fours, arched back, knees apart", m["leg_normal"], m["soles_rear"], "looking back, sidelong glance, looking at viewer",
                    m["outfit_pos"], exp_tags,
                    "rating:explicit, nsfw, uncensored, 1.45::after fellatio::, 0.55::oral::, penis", act_fluids,
                    "ass", m["anat_pos"], rem_lower,
                    prose_if(cfg, f"Single full-frame 30-degree rear low-angle view of {m['name']}{m['loc_prose']} pulling her head slightly back right after fellatio{after_clause}."),
                    wrap_tail_neg(m, join_tags(no_split_neg, "pov, from side, profile, sitting, male focus", m["common_tail_neg"]), neg_on),
                )
                if mp_mode in ("single_a", "single_pair"):
                    results.append(("【S03 单图A · 第三人称 (客观镜头) · 30°侧后口部进行中单幅】", "横图 1216x832", p_a))
                if mp_mode in ("single_b", "single_pair"):
                    results.append(("【S03 单图B · 第三人称 (客观镜头) · 30°侧后松口拉丝单幅】", "横图 1216x832", p_b))

    # ==========================================
    # S04: 骑乘位（支持 2koma 双格 或 拆为单张高清图：深坐溢流 / 微抬脱出拉丝）
    # ==========================================
    elif scene_id == "S04":
        m = build_common_modules(cfg, eyes_open=True)
        exp_tags = expr_if(cfg, "slight smile, smug, furrowed brow, half-closed eyes, watery eyes, heavy blush, floating heart", essential="1.4::closed mouth::")
        rem_face = join_tags(wtag("cum on face", 1.4, f), wtag("cum in hair", 1.0, f)) if rem else ""
        act_fluids = join_tags(
            "internal cumshot", wtag("cum overflow", 1.4, f), "cum on penis",
            wtag("cum in pussy", 1.4, f), wtag("cumdrip", 1.5, f), wtag("cum string", 1.4, f), wtag("excessive cum", 1.2, f), "sweat"
        ) if af else ""
        c1_f = join_tags("cum on penis, internal cumshot", wtag("cum overflow", 1.4, f), wtag("cum in pussy", 1.3, f), wtag("cumdrip", 1.3, f), "sweat") if af else ""
        c2_f = join_tags("after ejaculation, cum on penis", wtag("cum in pussy", 1.4, f), wtag("cumdrip", 1.5, f), wtag("cum string", 1.4, f), wtag("excessive cum", 1.2, f), "cum on thighs, sweat") if af else ""
        left_f_clause = " as thick white cum overflows at the joined base" if af else ""
        right_f_clause = " with cum stringing onto his flaccid penis below" if af else " above his flaccid penis below"
        mp_mode = cfg.multi_panel_mode

        if mp_mode == "2koma":
            if is_pov:
                p_single = join_tags(
                    "2.5::2koma::, 2.5::vertical split screen::, comic, two panels, vertical border, dividing line, gutter, 2girls, 2boys, same character, hetero",
                    m["head_pos"], m["char_core"], "faceless male", m["bg_couch"],
                    "1.5::pov::, 1.4::pov crotch::, 1.3::from below::, low angle",
                    "girl on top, kneeling, straddling, looking down, looking at viewer",
                    m["outfit_pos"], exp_tags, "rating:explicit, nsfw, uncensored",
                    rem_face, "cowgirl position, vaginal, insertion, after vaginal, penis, flaccid",
                    m["anat_pos"], act_fluids,
                    prose_if(cfg, f"Two side-by-side POV panels of {m['name']} kneeling astraddle: left panel, seated in deep cowgirl insertion{left_f_clause}; right panel, lifting her hips slightly upward after pulling out{right_f_clause}."),
                    wrap_neg("-2.5", "open mouth, cum in mouth, drooling, standing", neg_on),
                    wrap_tail_neg(m, join_tags("1girl, solo, single panel, from behind, reverse cowgirl, all fours, profile, male focus, 4koma, speech bubble", m["common_tail_neg"]), neg_on),
                )
                results.append(("【S04 · 第一人称视角 (POV) · 仰视骑乘左右双格（左深坐溢流 ➔ 右微抬疲软）】", "横图 1216x832", p_single))

                if cfg.include_sub_variants:
                    base_multi = join_tags(
                        "2.5::2koma::, 2.5::vertical split screen::, comic, two panels, vertical border, dividing line, gutter, 2girls, 2boys, same character, hetero",
                        m["head_pos"], m["bg_couch"],
                        "1.5::pov::, 1.4::pov crotch::, 1.3::from below::, low angle, rating:explicit, nsfw, uncensored",
                        wrap_neg("-2.5", "open mouth, cum in mouth, drooling", neg_on),
                        wrap_tail_neg(m, join_tags("from behind, reverse cowgirl, all fours, profile, male focus, 4koma, speech bubble", m["common_tail_neg"]), neg_on),
                    )
                    c1 = join_tags(
                        "girl, 1boy, faceless male", m["char_core"],
                        "pov crotch, penis, erection, 1.4::girl on top::, 1.4::cowgirl position::, kneeling, straddling, sitting on lap, hips down, hands on chest, knees apart, looking down, looking at viewer",
                        m["outfit_pos"], exp_tags, rem_face, "vaginal, sex, 1.4::insertion::, deep penetration", c1_f, m["anat_pos"],
                        prose_if(cfg, f"Seated down in deep cowgirl insertion{left_f_clause}."),
                        wrap_neg("-2.5", join_tags("open mouth, cum in mouth, standing, flaccid, after vaginal", m["canon_neg"]), neg_on),
                    )
                    c2 = join_tags(
                        "girl, 1boy, faceless male", m["char_core"],
                        "pov crotch, penis, 1.4::flaccid::, girl on top, kneeling, straddling, 0.8::squatting::, hands on thighs, knees apart, looking down, looking at viewer",
                        m["outfit_pos"], exp_tags, rem_face, "1.4::after vaginal::", m["anat_pos"], c2_f,
                        prose_if(cfg, f"Still kneeling astraddle him, she lifts her hips just slightly off by a few inches right after pulling out{right_f_clause}."),
                        wrap_neg("-2.5", join_tags("open mouth, cum in mouth, insertion, penetration, standing, erection", m["canon_neg"]), neg_on),
                    )
                    results.append(("【S04 · 第一人称多角色精准分区版 (Base + 左A3 + 右E3)】", "横图 1216x832", f"[Base Prompt]:\n{base_multi}\n\n[Character 1 (A3)]:\n{c1}\n\n[Character 2 (E3)]:\n{c2}"))
            else:
                p_3rd = join_tags(
                    "2.5::2koma::, 2.5::vertical split screen::, comic, two panels, vertical border, dividing line, gutter, 2girls, 2boys, same character, hetero",
                    m["head_pos"], m["char_core"], "faceless male, head out of frame", m["on_couch_tag"], m["bg_couch"],
                    "three-quarter view, from side, low angle",
                    "1.4::girl on top::, 1.4::cowgirl position::, kneeling, straddling", m["leg_normal"],
                    m["outfit_pos"], exp_tags, "rating:explicit, nsfw, uncensored",
                    rem_face, "vaginal, insertion, after vaginal, penis, flaccid", m["anat_pos"], act_fluids,
                    prose_if(cfg, f"Two side-by-side angled panels of {m['name']} straddling a faceless man{m['loc_prose']}: left panel, seated deeply joined{left_f_clause}; right panel, lifting her hips slightly after pulling out{right_f_clause}."),
                    wrap_neg("-2.5", "pov, pov crotch, open mouth, cum in mouth, drooling, standing", neg_on),
                    wrap_tail_neg(m, join_tags("1girl, solo, single panel, all fours, male focus, 4koma, speech bubble", m["common_tail_neg"]), neg_on),
                )
                results.append(("【S04 · 第三人称视角 (客观镜头) · 侧斜旁观骑乘左右双格】", "横图 1216x832", p_3rd))
        else:
            no_split_neg = "2koma, 4koma, split screen, multiple views, comic, border, speech bubble"
            if is_pov:
                p_a = join_tags(
                    m["head_pos"], "1girl, 1boy, hetero", m["char_core"], "faceless male", m["bg_couch"],
                    "1.5::pov::, 1.4::pov crotch::, 1.3::from below::, low angle",
                    "1.45::girl on top::, 1.45::cowgirl position::, kneeling, straddling, sitting on lap, hips down, hands on chest, knees apart, looking down, looking at viewer",
                    m["outfit_pos"], exp_tags, "rating:explicit, nsfw, uncensored",
                    rem_face, "vaginal, sex, 1.45::insertion::, deep penetration, penis, erection",
                    m["anat_pos"], c1_f,
                    prose_if(cfg, f"Single full-frame first-person POV looking up at {m['name']} kneeling astraddle on top{m['loc_prose']} seated deeply in cowgirl insertion{left_f_clause}."),
                    wrap_neg("-2.5", "open mouth, cum in mouth, drooling, standing, flaccid, after vaginal", neg_on),
                    wrap_tail_neg(m, join_tags(no_split_neg, "from behind, reverse cowgirl, all fours, profile, male focus", m["common_tail_neg"]), neg_on),
                )
                p_b = join_tags(
                    m["head_pos"], "1girl, 1boy, hetero", m["char_core"], "faceless male", m["bg_couch"],
                    "1.5::pov::, 1.4::pov crotch::, 1.3::from below::, low angle",
                    "1.4::girl on top::, kneeling, straddling, 0.8::squatting::, hands on thighs, knees apart, looking down, looking at viewer",
                    m["outfit_pos"], exp_tags, "rating:explicit, nsfw, uncensored",
                    rem_face, "1.45::after vaginal::, pull out, penis, 1.4::flaccid::",
                    m["anat_pos"], c2_f,
                    prose_if(cfg, f"Single full-frame first-person POV looking up at {m['name']} kneeling astraddle{m['loc_prose']} lifting her hips slightly upward by a few inches right after pulling out{right_f_clause}."),
                    wrap_neg("-2.5", "open mouth, cum in mouth, drooling, standing, insertion, penetration, erection", neg_on),
                    wrap_tail_neg(m, join_tags(no_split_neg, "from behind, reverse cowgirl, all fours, profile, male focus", m["common_tail_neg"]), neg_on),
                )
                if mp_mode in ("single_a", "single_pair"):
                    results.append(("【S04 单图A · 第一人称 (POV) · 骑乘深坐结合溢流单幅】", "竖图 832x1216", p_a))
                if mp_mode in ("single_b", "single_pair"):
                    results.append(("【S04 单图B · 第一人称 (POV) · 骑乘微抬脱出疲软拉丝单幅】", "竖图 832x1216", p_b))
            else:
                p_a = join_tags(
                    m["head_pos"], "1girl, 1boy, hetero", m["char_core"], "faceless male, head out of frame", m["on_couch_tag"], m["bg_couch"],
                    "three-quarter view, from side, low angle",
                    "1.45::girl on top::, 1.45::cowgirl position::, kneeling, straddling, sitting on lap, hips down", m["leg_normal"],
                    m["outfit_pos"], exp_tags, "rating:explicit, nsfw, uncensored",
                    rem_face, "vaginal, sex, 1.45::insertion::, deep penetration, penis, erection",
                    m["anat_pos"], c1_f,
                    prose_if(cfg, f"Single full-frame angled third-person view of {m['name']} straddling a faceless man{m['loc_prose']} seated deeply in cowgirl insertion{left_f_clause}."),
                    wrap_neg("-2.5", "pov, pov crotch, open mouth, cum in mouth, drooling, standing, flaccid, after vaginal", neg_on),
                    wrap_tail_neg(m, join_tags(no_split_neg, "all fours, male focus", m["common_tail_neg"]), neg_on),
                )
                p_b = join_tags(
                    m["head_pos"], "1girl, 1boy, hetero", m["char_core"], "faceless male, head out of frame", m["on_couch_tag"], m["bg_couch"],
                    "three-quarter view, from side, low angle",
                    "1.4::girl on top::, 1.35::cowgirl position::, kneeling, straddling, 0.8::squatting::", m["leg_normal"],
                    m["outfit_pos"], exp_tags, "rating:explicit, nsfw, uncensored",
                    rem_face, "1.45::after vaginal::, pull out, penis, 1.4::flaccid::",
                    m["anat_pos"], c2_f,
                    prose_if(cfg, f"Single full-frame angled third-person view of {m['name']} straddling a faceless man{m['loc_prose']} lifting her hips slightly off right after pulling out{right_f_clause}."),
                    wrap_neg("-2.5", "pov, pov crotch, open mouth, cum in mouth, drooling, standing, insertion, penetration, erection", neg_on),
                    wrap_tail_neg(m, join_tags(no_split_neg, "all fours, male focus", m["common_tail_neg"]), neg_on),
                )
                if mp_mode in ("single_a", "single_pair"):
                    results.append(("【S04 单图A · 第三人称 (客观镜头) · 侧斜旁观骑乘深坐溢流单幅】", "横图 1216x832", p_a))
                if mp_mode in ("single_b", "single_pair"):
                    results.append(("【S04 单图B · 第三人称 (客观镜头) · 侧斜旁观骑乘微抬拉丝单幅】", "横图 1216x832", p_b))

    # ==========================================
    # S05: 单人犬式单侧屈膝高抬腿排泄 + 大滩积液
    # ==========================================
    elif scene_id == "S05":
        m = build_common_modules(cfg, eyes_open=True)
        exp_tags = expr_if(cfg, ":p, tongue out, smug, furrowed brow, half-closed eyes, watery eyes, heavy blush, floating heart")
        rem_face = join_tags(wtag("cum on face", 1.3, f), wtag("cum in hair", 0.9, f)) if rem else ""
        act_pee = join_tags(
            "1.4::peeing::, urine, after vaginal, cum",
            wtag("excessive cum", 1.4, f), wtag("cum in pussy", 1.4, f), wtag("cumdrip", 1.4, f), "cum string", wtag("puddle", 1.35, f), "sweat"
        ) if af else ""
        pee_clause = " as she pees a stream and thick white cum drips heavily into a messy puddle below" if af else ""

        if is_pov:
            p_pov = join_tags(
                m["head_pos"], "1girl, solo", m["char_id"],
                "2.2::leg up::, 2.0::knee up::, 1.5::on one knee::, leaning forward", m["hands_couch_tag"], "arched back, spread legs",
                m["char_rest"], m["bg_couch"],
                "1.45::pov::, 1.4::from behind::, close-up, foreshortening, low angle",
                m["leg_normal"], "looking back, looking at viewer",
                m["outfit_pos"], exp_tags, "rating:explicit, nsfw, uncensored",
                rem_face, "ass", m["anat_pos"], act_pee,
                prose_if(cfg, f"Close-up first-person POV right behind {m['name']}{m['loc_prose']} leaning on her hands and left knee while raising her bent right knee high out to the side like a dog peeing, looking back at the viewer{pee_clause}."),
                wrap_tail_neg(m, join_tags("knees up, all fours, knees together, standing, sitting, seiza, 1boy, penis, profile", m["common_tail_neg"]), neg_on),
            )
            results.append(("【S05 · 第一人称视角 (POV) · 近距俯看犬式单腿屈膝高抬】", "横图 1216x832 或 竖图 832x1216", p_pov))
        else:
            p_couch = join_tags(
                m["head_pos"], "1girl, solo", m["char_id"],
                "2.2::leg up::, 2.0::knee up::, 1.5::on one knee::, leaning forward", m["hands_couch_tag"], "arched back, spread legs",
                m["char_rest"], m["bg_couch"],
                "full body, 1.5::from behind::, 0.6::from side::, low angle, perspective, foreshortening",
                m["leg_normal"], "looking back, looking at viewer",
                m["outfit_pos"], exp_tags, "rating:explicit, nsfw, uncensored",
                rem_face, "ass", m["anat_pos"], act_pee,
                prose_if(cfg, f"Rear three-quarter low-angle perspective angled 30 degrees along {m['name']}'s spine, leaning forward on her hands and left knee{m['loc_prose']} while raising her bent right knee high out to the side like a dog peeing, looking back over her shoulder{pee_clause}."),
                wrap_tail_neg(m, join_tags("pov, knees up, all fours, knees together, standing, sitting, seiza, 1boy, penis, profile", m["common_tail_neg"]), neg_on),
            )
            results.append(("【S05 · 第三人称视角 (客观镜头) · 侧后 30° 全景犬式屈膝高抬】", "横图 1216x832", p_couch))

    # ==========================================
    # S06: 仰躺熟睡 + 小腹积液（闭眼自动隐藏瞳色）
    # ==========================================
    elif scene_id == "S06":
        m = build_common_modules(cfg, eyes_open=False, is_sleep_disheveled=True)
        exp_tags = expr_if(cfg, "exhausted, parted lips, heavy blush", essential="1.5::sleeping::, 1.4::closed eyes::, relaxed")
        stomach_fluid = join_tags(
            wtag("cum on stomach", 1.55, f),
            wtag("cum on clothes", 1.45, f) if m["covers_midriff"] else "",
            "after vaginal, cum", wtag("cum in pussy", 1.3, f), wtag("cumdrip", 1.3, f), "cum on thighs, sweat",
        ) if af else ""
        rem_face = join_tags(wtag("cum on face", 1.3, f), wtag("cum in hair", 0.9, f)) if rem else ""
        pool_clause = f"{m['stomach_pool_prose']} while cum oozes between her relaxed parted thighs" if af else ""

        if is_pov:
            p_pov = join_tags(
                m["head_pos"], "1girl, solo", m["char_core"], m["bg_sleep_couch"],
                "1.45::pov::, 1.4::from above::, foreshortening",
                "1.4::lying::, 1.3::on back::", m["on_couch_tag"], exp_tags,
                "spread legs, knees slightly bent", m["leg_normal"],
                m["outfit_pos"], m["belly_tags_s06_11"], "rating:explicit, nsfw, uncensored",
                rem_face, stomach_fluid, m["anat_pos"],
                prose_if(cfg, f"First-person POV looking directly down over {m['name']} fast asleep lying on her back{m['loc_prose']} with closed eyes{pool_clause}."),
                wrap_neg("-2.5", "open eyes, half-closed eyes, looking at viewer, sitting, standing, all fours, kneeling, peeing", neg_on),
                wrap_tail_neg(m, join_tags("1boy, penis", m["common_tail_neg"]), neg_on),
            )
            results.append(("【S06 · 第一人称视角 (POV) · 近距俯视仰躺熟睡与小腹积液】", "竖图 832x1216", p_pov))
        else:
            p_back = join_tags(
                m["head_pos"], "1girl, solo", m["char_core"], m["bg_sleep_couch"],
                "full body, angled view, 1.4::lying::, 1.3::on back::", m["on_couch_tag"], exp_tags,
                "spread legs, knees slightly bent", m["leg_normal"],
                m["outfit_pos"], m["belly_tags_s06_11"], "rating:explicit, nsfw, uncensored",
                rem_face, stomach_fluid, m["anat_pos"],
                prose_if(cfg, f"Full-body angled third-person view of {m['name']} fast asleep lying on her back{m['loc_prose']} with closed eyes{pool_clause}."),
                wrap_neg("-2.5", "pov, open eyes, half-closed eyes, looking at viewer, sitting, standing, all fours, kneeling, peeing", neg_on),
                wrap_tail_neg(m, join_tags("1boy, penis", m["common_tail_neg"]), neg_on),
            )
            results.append(("【S06 · 第三人称视角 (客观镜头) · 全景仰卧熟睡 + 小腹积液】", "横图 1216x832", p_back))

    # ==========================================
    # S07: 熟睡盘腿脚心相对 + 双手抓脚足交（双脚糊满拉丝）
    # ==========================================
    elif scene_id == "S07":
        m = build_common_modules(cfg, eyes_open=False, is_sleep_disheveled=True)
        exp_tags = expr_if(cfg, "exhausted, parted lips, heavy blush", essential="1.5::sleeping::, 1.4::closed eyes::, sleep, relaxed")
        is_barefoot_hold = "barefoot" in m["leg_foot"]
        foot_fluids = join_tags(
            wtag("cum on feet", 1.6, f),
            wtag("cum on toes, cum string", 1.4, f) if is_barefoot_hold else wtag("cum string", 1.4, f),
            "cum on penis", wtag("excessive cum", 1.3, f), "sweat",
        ) if af else ""
        rem_all = join_tags(
            wtag("cum on face, cum in pussy, cumdrip", 1.3, f),
            wtag("cum in hair", 0.9, f), wtag(m["stomach_rem_tag"], 1.4, f),
            "after vaginal, cum",
        ) if rem else ""
        foot_f_clause = ", coated in cum strings" if af else ""
        rem_clause = f", with cum{m['stomach_rem_prose']}" if rem else ""

        if is_pov:
            p_fpv = join_tags(
                m["head_pos"], "1girl, 1boy, hetero", m["char_core"], "faceless male", m["bg_sleep_couch"],
                "1.45::pov::, pov crotch, pov hands, foreshortening",
                "1.4::lying::, 1.3::on back::", m["on_couch_tag"], exp_tags,
                "1.3::indian style::, knees apart, bent knees", m["leg_foot"],
                "1.5::footjob::, 1.4::holding feet::, grabbing another's foot, penis, erection",
                m["outfit_pos"], m["belly_tags"], "rating:explicit, nsfw, uncensored",
                foot_fluids, rem_all, m["anat_pos"],
                prose_if(cfg, f"First-person POV grabbing sleeping {m['name']}'s {m['leg_prose']} soles-together in a cross-legged pose for a footjob{foot_f_clause}{rem_clause}."),
                wrap_neg("-2.5", "open eyes, half-closed eyes, looking at viewer, sitting, standing, all fours", neg_on),
                wrap_tail_neg(m, join_tags("male focus", m["common_tail_neg"]), neg_on),
            )
            results.append(("【S07 · 第一人称视角 (POV) · 男方脚端双手抓握双脚足交】", "竖图 832x1216", p_fpv))
        else:
            p_3rd = join_tags(
                m["head_pos"], "1girl, 1boy, hetero", m["char_core"], "faceless male, head out of frame", m["bg_sleep_couch"],
                "full body, angled view, from side, 1.4::lying::, 1.3::on back::", m["on_couch_tag"], exp_tags,
                "1.3::indian style::, knees apart, bent knees", m["leg_foot"],
                "1.5::footjob::, 1.4::holding feet::, grabbing another's foot, penis, erection",
                m["outfit_pos"], m["belly_tags"], "rating:explicit, nsfw, uncensored",
                foot_fluids, rem_all, m["anat_pos"],
                prose_if(cfg, f"Angled view{m['loc_prose']}: sleeping {m['name']} lies cross-legged on her back while a faceless man grabs her {m['leg_prose']} soles-together for a footjob{foot_f_clause}{rem_clause}."),
                wrap_neg("-2.5", "pov, pov hands, open eyes, half-closed eyes, looking at viewer, sitting, standing, all fours", neg_on),
                wrap_tail_neg(m, join_tags("male focus", m["common_tail_neg"]), neg_on),
            )
            results.append(("【S07 · 第三人称视角 (客观镜头) · 侧斜全景熟睡盘腿抓脚足交】", "横图 1216x832", p_3rd))

    # ==========================================
    # S08: 盘腿抓脚互动中被弄醒 · 睡眼惺忪略带妩媚
    # ==========================================
    elif scene_id == "S08":
        m = build_common_modules(cfg, eyes_open=True, is_sleep_disheveled=True)
        exp_tags = expr_if(
            cfg,
            "1.3::bedroom eyes::, 1.2::seductive smile::, parted lips, heavy blush, exhausted",
            essential="waking up, 1.35::sleepy::, 1.45::half-closed eyes::",
        )
        is_barefoot_hold = "barefoot" in m["leg_foot"]
        foot_fluids = join_tags(
            wtag("cum on feet", 1.6, f),
            wtag("cum on toes", 1.4, f) if is_barefoot_hold else "",
            wtag("cum string", 1.4, f),
            "cum on penis", wtag("excessive cum", 1.3, f), "sweat",
        ) if af else ""
        rem_all = join_tags(
            wtag("cum on face", 1.3, f), wtag("cum in hair", 0.9, f), wtag(m["stomach_rem_tag"], 1.4, f),
            "after vaginal, cum", wtag("cum in pussy", 1.3, f), wtag("cumdrip", 1.3, f),
        ) if rem else ""
        foot_f_clause = ", coated in cum strings" if af else ""

        if is_pov:
            p_fpv = join_tags(
                m["head_pos"], "1girl, 1boy, hetero", m["char_core"], "faceless male", m["bg_sleep_couch"],
                "1.45::pov::, pov crotch, pov hands, foreshortening",
                "1.4::lying::, 1.3::on back::", m["on_couch_tag"], "relaxed", exp_tags, "looking at viewer, looking down",
                "1.3::indian style::, knees apart, bent knees", m["leg_foot"],
                "1.5::footjob::, 1.4::holding feet::, grabbing another's foot, penis, erection",
                m["outfit_pos"], m["belly_tags"], "rating:explicit, nsfw, uncensored",
                foot_fluids, rem_all, m["anat_pos"],
                prose_if(cfg, f"First-person POV grabbing {m['name']}'s {m['leg_prose']} soles-together for a footjob{foot_f_clause} as she stirs awake gazing drowsily down."),
                wrap_neg("-2.5", "closed eyes, sleeping, wide-eyed, ahegao, sitting, standing, all fours", neg_on),
                wrap_tail_neg(m, join_tags("male focus", m["common_tail_neg"]), neg_on),
            )
            results.append(("【S08 · 第一人称视角 (POV) · 抓脚互动中刚醒迷离睡眼望向你】", "竖图 832x1216", p_fpv))
        else:
            p_3rd = join_tags(
                m["head_pos"], "1girl, 1boy, hetero", m["char_core"], "faceless male, head out of frame", m["bg_sleep_couch"],
                "full body, angled view, from side, 1.4::lying::, 1.3::on back::", m["on_couch_tag"], "relaxed",
                exp_tags, "looking at another, looking down, sideways glance",
                "1.3::indian style::, knees apart, bent knees", m["leg_foot"],
                "1.5::footjob::, 1.4::holding feet::, grabbing another's foot, penis, erection",
                m["outfit_pos"], m["belly_tags"], "rating:explicit, nsfw, uncensored",
                foot_fluids, rem_all, m["anat_pos"],
                prose_if(cfg, f"Angled view{m['loc_prose']}: stirred awake on her back, {m['name']} gazes drowsily down as a faceless man grabs her {m['leg_prose']} soles-together for a footjob{foot_f_clause}."),
                wrap_neg("-2.5", "pov, pov hands, closed eyes, sleeping, wide-eyed, ahegao, sitting, standing, all fours", neg_on),
                wrap_tail_neg(m, join_tags("male focus", m["common_tail_neg"]), neg_on),
            )
            results.append(("【S08 · 第三人称视角 (客观镜头) · 侧斜全景被弄醒睡眼朝脚端瞥去】", "横图 1216x832", p_3rd))

    # ==========================================
    # S09: 欺身单手轻拢脖颈 + 迷离仰视（中近景）
    # ==========================================
    elif scene_id == "S09":
        m = build_common_modules(cfg, eyes_open=True, is_sleep_disheveled=True)
        exp_tags = expr_if(
            cfg,
            "1.35::bedroom eyes::, 1.15::seductive smile::, parted lips, heavy blush",
            essential="1.3::sleepy::, 1.4::half-closed eyes::",
        )
        rem_all = join_tags(
            "cum", wtag("excessive cum, cum on face", 1.6, f), wtag("cum in hair", 1.2, f),
            wtag(m["stomach_rem_tag"], 1.7, f), "cum on body",
            "after vaginal", wtag("cum string, cumdrip, cum in pussy, cum overflow", 1.5, f), "sweat"
        ) if rem else ""
        rem_clause = f", with cum on her cheek and pooled{m['stomach_rem_prose']}" if rem else ""

        if is_pov:
            p_pov = join_tags(
                m["head_pos"], "1girl, 1boy, hetero", m["char_core"], "faceless male", m["bg_sleep_couch"],
                "1.5::pov::, 1.4::from above::, pov hands, reaching out",
                "1.4::lying::, 1.3::on back::", m["on_couch_tag"], "neck, collarbone, 1.55::hand on another's neck::",
                exp_tags, "looking at viewer, looking up, head tilt",
                m["outfit_pos"], m["belly_tags"], "rating:explicit, nsfw, uncensored",
                rem_all, m["anat_pos"],
                prose_if(cfg, f"First-person POV from above {m['name']} lying on her back{m['loc_prose']}: a hand reaches in to gently clasp her neck as she gazes up with drowsy half-closed eyes{rem_clause}."),
                wrap_neg("-2.5", "closed eyes, sleeping, wide-eyed, ahegao, tongue out, sitting, standing, all fours, footjob", neg_on),
                wrap_tail_neg(m, join_tags("male focus", m["common_tail_neg"]), neg_on),
            )
            results.append(("【S09 · 第一人称视角 (POV) · 正上方俯视单手轻拢脖颈】", "竖图 832x1216", p_pov))
        else:
            p_3rd = join_tags(
                m["head_pos"], "1girl, 1boy, hetero", m["char_core"], "faceless male, head out of frame, leaning over", m["bg_sleep_couch"],
                "three-quarter view, from side, 1.4::lying::, 1.3::on back::", m["on_couch_tag"], "neck, collarbone, 1.55::hand on another's neck::",
                exp_tags, "looking at another, looking up, head tilt",
                m["outfit_pos"], m["belly_tags"], "rating:explicit, nsfw, uncensored",
                rem_all, m["anat_pos"],
                prose_if(cfg, f"Angled side view{m['loc_prose']}: a faceless man leans over {m['name']} and gently clasps one hand around her neck as she gazes up drowsily{rem_clause}."),
                wrap_neg("-2.5", "pov, pov hands, closed eyes, sleeping, wide-eyed, ahegao, tongue out, sitting, standing, all fours, footjob", neg_on),
                wrap_tail_neg(m, join_tags("male focus", m["common_tail_neg"]), neg_on),
            )
            results.append(("【S09 · 第三人称视角 (客观镜头) · 侧斜近景男方欺身单手轻拢脖颈】", "横图 1216x832", p_3rd))

    # ==========================================
    # S10: 单手轻拢脖颈 + 传教士压身深入
    # ==========================================
    elif scene_id == "S10":
        m = build_common_modules(cfg, eyes_open=True, is_sleep_disheveled=True)
        exp_tags = expr_if(
            cfg,
            "1.35::bedroom eyes::, 1.15::seductive smile::, parted lips, heavy blush",
            essential="1.3::sleepy::, 1.4::half-closed eyes::",
        )
        act_f = join_tags(wtag("cum overflow, cum string, cumdrip", 1.5, f), "sweat") if af else ""
        is_barefoot_hold = "barefoot" in m["leg_foot"]
        rem_all = join_tags(
            "cum", wtag("excessive cum", 1.65, f), wtag("cum on face", 1.6, f), wtag("cum in hair", 1.2, f),
            wtag(m["stomach_rem_tag"], 1.7, f), "cum on body",
            wtag("cum on feet", 1.55, f),
            wtag("cum on toes", 1.35, f) if is_barefoot_hold else "",
        ) if rem else ""
        rem_mid_word = "clothes" if m["covers_midriff"] else "stomach"
        rem_clause = f", with cum on her cheek, {rem_mid_word}{m['outfit_prose_clause']}, and {m['leg_prose']}" if rem else ""

        if is_pov:
            p_pov = join_tags(
                m["head_pos"], "1girl, 1boy, hetero", m["char_core"], "faceless male", m["bg_sleep_couch"],
                "1.5::pov::, 1.4::from above::, pov hands, pov crotch, foreshortening",
                "1.4::lying::, 1.3::on back::", m["on_couch_tag"], "1.35::missionary::, spread legs, bent knees",
                m["leg_normal"], "neck, collarbone, 1.55::hand on another's neck::",
                exp_tags, "looking at viewer, looking up",
                m["outfit_pos"], m["belly_tags"], "rating:explicit, nsfw, uncensored, sex, vaginal, penis, insertion",
                rem_all, act_f, m["anat_pos"],
                prose_if(cfg, f"First-person missionary POV above {m['name']} on her back{m['loc_prose']}: pressing between her open legs while one hand gently clasps her neck as she gazes up drowsily{rem_clause}."),
                wrap_neg("-2.5", "closed eyes, sleeping, wide-eyed, ahegao, tongue out, sitting, standing, all fours, footjob", neg_on),
                wrap_tail_neg(m, join_tags("male focus", m["common_tail_neg"]), neg_on),
            )
            results.append(("【S10 · 第一人称视角 (POV) · 传教士俯视压身深入 + 单手轻拢脖颈】", "竖图 832x1216", p_pov))
        else:
            p_3rd = join_tags(
                m["head_pos"], "1girl, 1boy, hetero", m["char_core"], "faceless male, head out of frame, boy on top", m["bg_sleep_couch"],
                "three-quarter view, from side, 1.4::lying::, 1.3::on back::", m["on_couch_tag"],
                "1.5::missionary::, spread legs, bent knees",
                m["leg_normal"], "neck, collarbone, 1.55::hand on another's neck::",
                exp_tags, "looking at another, looking up",
                m["outfit_pos"], m["belly_tags"], "rating:explicit, nsfw, uncensored, sex, vaginal, penis, insertion",
                rem_all, act_f, m["anat_pos"],
                prose_if(cfg, f"Angled side view{m['loc_prose']}: a faceless man presses between {m['name']}'s open bent legs in missionary while one hand gently clasps her neck{rem_clause}."),
                wrap_neg("-2.5", "pov, pov hands, pov crotch, closed eyes, sleeping, wide-eyed, ahegao, tongue out, sitting, standing, all fours, footjob", neg_on),
                wrap_tail_neg(m, join_tags("male focus", m["common_tail_neg"]), neg_on),
            )
            results.append(("【S10 · 第三人称视角 (客观镜头) · 侧斜全景传教士深入 + 单手轻拢脖颈】", "横图 1216x832", p_3rd))

    # ==========================================
    # S11: 传教士位双腿间拔出外射至小腹
    # ==========================================
    elif scene_id == "S11":
        m = build_common_modules(cfg, eyes_open=True, is_sleep_disheveled=True)
        exp_tags = expr_if(
            cfg,
            "1.35::bedroom eyes::, 1.15::seductive smile::, parted lips, heavy blush, trembling",
            essential="1.25::sleepy::, 1.4::half-closed eyes::",
        )
        act_ejac = join_tags(
            wtag("ejaculation", 1.65, f), wtag("projectile cum", 1.55, f), wtag("excessive cum", 1.75, f),
            wtag("cum on pussy", 1.6, f), wtag("cum on stomach", 1.85, f),
            wtag("cum on clothes", 1.55, f) if m["covers_midriff"] else "",
            wtag("cum string", 1.55, f), wtag("cumdrip", 1.5, f), "sweat"
        ) if af else ""
        is_barefoot_hold = "barefoot" in m["leg_foot"]
        rem_old = join_tags(
            wtag("cum on face", 1.3, f), wtag("cum in hair", 1.1, f), wtag("cum on feet", 1.5, f),
            wtag("cum on toes", 1.3, f) if is_barefoot_hold else "",
            wtag("cum in pussy", 1.45, f), wtag("cum overflow", 1.45, f)
        ) if rem else ""
        if af:
            ejac_clause = (
                " shooting cum onto her vulva and outfit"
                if m["covers_midriff"]
                else " shooting cum onto her vulva and bare stomach"
            )
        else:
            ejac_clause = ""

        if is_pov:
            p_std = join_tags(
                m["head_pos"], "1girl, 1boy, hetero", m["char_core"], "faceless male", m["bg_sleep_couch"],
                "1.6::missionary::, 1.45::pov::, 1.35::from above::, 1.4::pov crotch::, pov hands, foreshortening",
                "1.4::lying::, 1.3::on back::", m["on_couch_tag"], "1.4::spread legs::, bent knees",
                m["leg_normal"], "neck, 1.5::hand on another's neck::",
                exp_tags, "looking at viewer, looking up",
                m["outfit_pos"], m["belly_tags_s06_11"], "rating:explicit, nsfw, uncensored, after vaginal, pull out, penis, erection, twitching penis",
                act_ejac, rem_old, m["anat_pos"],
                prose_if(cfg, f"First-person missionary POV between {m['name']}'s open legs{m['loc_prose']}: clasping her neck, he pulls out{ejac_clause}."),
                wrap_neg("-2.5", "facial, penis on face, oral, fellatio, internal cumshot, insertion, closed eyes, sleeping, wide-eyed, ahegao, tongue out, sitting, standing, all fours, footjob", neg_on),
                wrap_tail_neg(m, join_tags("male focus", m["common_tail_neg"]), neg_on),
            )
            results.append(("【S11 · 第一人称视角 (POV) · 传教士双腿间刚拔出外射标准版】", "竖图 832x1216", p_std))
            if cfg.include_sub_variants:
                p_legsup = p_std.replace("1.6::missionary::", "1.65::missionary::").replace(
                    "1.4::spread legs::, bent knees", "1.4::spread legs::, 1.3::legs up::, knees up"
                )
                results.append(("【S11 · 第一人称备选 · 双腿抬高环腰强化版 (`legs up`)】", "竖图 832x1216", p_legsup))
        else:
            p_3rd = join_tags(
                m["head_pos"], "1girl, 1boy, hetero", m["char_core"], "faceless male, head out of frame, boy on top", m["bg_sleep_couch"],
                "three-quarter view, from side, 1.55::missionary::, 1.4::lying::, 1.3::on back::", m["on_couch_tag"], "1.4::spread legs::, bent knees",
                m["leg_normal"], "neck, 1.5::hand on another's neck::",
                exp_tags, "looking at another, looking up",
                m["outfit_pos"], m["belly_tags_s06_11"], "rating:explicit, nsfw, uncensored, after vaginal, pull out, penis, erection, twitching penis",
                act_ejac, rem_old, m["anat_pos"],
                prose_if(cfg, f"Angled missionary view{m['loc_prose']}: clasping {m['name']}'s neck between her open legs, the faceless man pulls out{ejac_clause}."),
                wrap_neg("-2.5", "pov, pov hands, pov crotch, facial, penis on face, oral, fellatio, internal cumshot, insertion, closed eyes, sleeping, wide-eyed, ahegao, tongue out, sitting, standing, all fours, footjob", neg_on),
                wrap_tail_neg(m, join_tags("male focus", m["common_tail_neg"]), neg_on),
            )
            results.append(("【S11 · 第三人称视角 (客观镜头) · 侧斜全景传教士双腿间拔出外射】", "横图 1216x832", p_3rd))

    if is_m6_soft_morning_skin_active(cfg):
        wants_sweat = cfg.add_extra_sweat or ("shiny skin" in SKIN_PRESETS.get(cfg.skin_preset, ""))
        if not wants_sweat:
            m6_results: List[Tuple[str, str, str]] = []
            for sub_title, canvas_str, prompt_str in results:
                cleaned_p = re.sub(r"(?:,\s*)?(?:\d+(?:\.\d+)?::)?sweat(?:::)?(?=\s*,|$)", "", prompt_str)
                cleaned_p = re.sub(r"^\s*sweat\s*,\s*", "", cleaned_p)
                m6_results.append((sub_title, canvas_str, cleaned_p))
            results = m6_results

    if is_c5_lowres_pixel_style_active(cfg):
        c5_results: List[Tuple[str, str, str]] = []
        for sub_title, canvas_str, prompt_str in results:
            if canvas_str.startswith("竖图"):
                new_canvas = "像素竖图 384x512 (原生直出 ➔ 自动3x硬放大 1152x1536)"
            else:
                new_canvas = "像素横图 512x384 (原生直出 ➔ 自动3x硬放大 1536x1152)"
            c5_results.append((sub_title, new_canvas, prompt_str))
        return c5_results

    return results


def _describe_active_modules(cfg: CharacterConfig) -> str:
    off_list: List[str] = []
    mapping = [
        (cfg.enable_quality, "质量"),
        (cfg.enable_style, "画风"),
        (cfg.enable_identity, "角色身份"),
        (cfg.enable_body, "体型肤色"),
        (cfg.enable_outfit, "服装款式"),
        (cfg.enable_clothing_state, "掀衣暴露辅助"),
        (cfg.enable_legwear, "鞋袜"),
        (cfg.enable_background, "背景"),
        (cfg.enable_expression, "微表情"),
        (cfg.enable_anatomy, "局部四维"),
        (cfg.enable_action_fluids, "本幕流体"),
        (cfg.enable_remnants, "跨幕残留"),
        (cfg.enable_t5_prose, "T5描述句"),
        (cfg.enable_negatives, "负向词"),
    ]
    for flag, name in mapping:
        if not flag:
            off_list.append(name)
    if not off_list:
        return "全量直出模式（全部模块 ON）"
    return f"精密参照减负模式（已 OFF：{' / '.join(off_list)}）"


def _build_single_track_blocks(cfg: CharacterConfig, selected_ids: List[str], track_mode: str, pure_batch: bool) -> List[str]:
    track_label = "👁️ 第一人称视角卷 (First-Person POV)" if track_mode == "pov" else "🎥 第三人称视角卷 (Third-Person Objective)"
    all_chapters = STORY_CHAPTERS + MULTI_ANGLE_CHAPTERS
    if pure_batch:
        lines: List[str] = []
        for ch in all_chapters:
            if ch["id"] not in selected_ids:
                continue
            for _sub_title, _canvas, prompt_text in generate_scene_prompts(ch["id"], cfg, pov_override=track_mode):
                if prompt_text.startswith("[Base Prompt]"):
                    continue
                lines.append(prompt_text)
        return lines

    who_str = f"{cfg.preset_name} ({cfg.char_tag})" if cfg.enable_identity else "精密参照接管角色 (Character Identity OFF)"
    blocks: List[str] = [
        "# ==========================================================================",
        f"# 🎬 {track_label} — 角色：{who_str}",
        f"# 🎛️ 模块状态：{_describe_active_modules(cfg)}",
        "# ==========================================================================\n",
    ]
    for ch in all_chapters:
        if ch["id"] not in selected_ids:
            continue
        items = generate_scene_prompts(ch["id"], cfg, pov_override=track_mode)
        first_canvas = items[0][1] if items else ""
        blocks.append("# --------------------------------------------------------------------------")
        blocks.append(f"# 📌 {ch['title']}  |  视角：{track_label}  |  推荐画布：{first_canvas}")
        blocks.append("# --------------------------------------------------------------------------")
        for sub_title, canvas, prompt_text in items:
            blocks.append(f"## {sub_title}（画布：{canvas}）：")
            blocks.append(prompt_text)
            blocks.append("")
    return blocks


def generate_full_suite(
    cfg: CharacterConfig,
    selected_ids: List[str],
    pure_batch_lines: bool = False,
    export_both_separated: bool = False,
) -> str:
    if export_both_separated:
        pov_part = _build_single_track_blocks(cfg, selected_ids, "pov", pure_batch_lines)
        trd_part = _build_single_track_blocks(cfg, selected_ids, "3rd", pure_batch_lines)
        if pure_batch_lines:
            return "\n".join(pov_part + trd_part)
        return "\n".join(pov_part + ["\n\n"] + trd_part)

    return "\n".join(_build_single_track_blocks(cfg, selected_ids, cfg.perspective_mode, pure_batch_lines))


def load_custom_presets() -> Dict[str, Dict]:
    if not os.path.exists(PRESETS_FILE):
        return {}
    try:
        with open(PRESETS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def save_custom_preset(name: str, cfg: CharacterConfig) -> None:
    custom = load_custom_presets()
    cfg.preset_name = name
    custom[name] = asdict(cfg)
    with open(PRESETS_FILE, "w", encoding="utf-8") as f:
        json.dump(custom, f, ensure_ascii=False, indent=2)


def delete_custom_preset(name: str) -> bool:
    custom = load_custom_presets()
    if name in custom:
        del custom[name]
        with open(PRESETS_FILE, "w", encoding="utf-8") as f:
            json.dump(custom, f, ensure_ascii=False, indent=2)
        return True
    return False
