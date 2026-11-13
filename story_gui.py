# -*- coding: utf-8 -*-
"""
NovelAI V4.5 / V5 连续故事线提示词生成器 GUI (story_gui.py)
特性：
1. 第一人称 (POV) 与第三人称 (客观机位) 全 12 幕双轨独立分离；
2. 右上角醒目双态选择器，默认控制下方「🎯 单幕精细预览」展示第一人称还是第三人称；
3. 支持【精密参照 (Precise Reference)】快捷一键减负模式与 14 项细粒度模块独立 OFF 开关，仅留核心动作骨架即可配合精密参照出图。
"""

from __future__ import annotations
import ctypes
from io import BytesIO
import math
import os
import threading
import tkinter as tk
from tkinter import ttk, filedialog, messagebox, simpledialog
from typing import Dict, List, Optional

from PIL import Image, ImageTk

from camera_rig import (
    CAMERA_GAZE_PRESETS,
    CAMERA_QUICK_PRESETS,
    CAMERA_SHOT_PRESETS,
    compile_camera_rig,
    describe_camera_short,
)

from nai_api import (
    BatchGenerateSummary,
    BatchUpscaleSummary,
    CANVAS_PRESETS,
    DEFAULT_OUTPUT_DIR,
    FolderUpscalePlan,
    GenerationResult,
    MAX_T5_TOKENS,
    MODEL_V5_FULL_MEDIUM,
    NaiApiError,
    NaiApiSettings,
    SceneBatchTask,
    SubscriptionInfo,
    UpscaleResult,
    batch_generate_scenes_v5_medium,
    batch_upscale_folder_nai,
    count_prompt_t5_tokens,
    estimate_v5_medium_anlas,
    extract_first_prompt_from_preview,
    extract_prompt_blocks_from_preview,
    fetch_subscription_info,
    generate_single_image_v5_medium,
    load_api_settings,
    parse_canvas_size,
    save_api_settings,
    scan_folder_for_upscale,
    upscale_single_image_nai,
)
from story_engine import (
    BUILTIN_CHARACTERS,
    BODY_PRESETS,
    BUST_PRESETS,
    SKIN_PRESETS,
    OUTFIT_PRESETS,
    OUTFIT_STATE_PRESETS,
    LEGWEAR_PRESETS,
    STYLE_PRESETS,
    MULTI_PANEL_MODE_PRESETS,
    MORPH_PRESETS,
    PUBIC_PRESETS,
    PIGMENT_PRESETS,
    STORY_CHAPTERS,
    MULTI_ANGLE_CHAPTERS,
    ALL_POSITIONS_CHAPTERS,
    POS_CATEGORIES,
    POS_MALE_MODE_PRESETS,
    POS_STAGE_PRESETS,
    MODULE_SWITCH_PRESETS,
    CharacterConfig,
    generate_scene_prompts,
    generate_full_suite,
    load_custom_presets,
    save_custom_preset,
    delete_custom_preset,
)


try:
    ctypes.windll.shcore.SetProcessDpiAwareness(1)
except Exception:
    pass


BG_MAIN = "#1e1e2e"
BG_PANEL = "#262637"
BG_INPUT = "#181825"
FG_TEXT = "#cdd6f4"
FG_MUTED = "#a6adc8"
ACCENT = "#cba6f7"
ACCENT_POV = "#89b4fa"
ACCENT_3RD = "#f9e2af"
SUCCESS = "#a6e3a1"
BORDER = "#313244"


class StoryPromptGeneratorApp:
    def __init__(self, root: tk.Tk) -> None:
        self.root = root
        self.root.title("NovelAI V4.5 / V5 连续故事线提示词工作台 (第一/第三人称双轨 · 支持精密参照模块 OFF)")
        self.root.geometry("1500x920")
        self.root.minsize(1220, 760)
        self.root.configure(bg=BG_MAIN)

        self._setup_styles()
        self._init_variables()
        self._build_layout()
        self._load_preset_by_name(self.var_preset.get(), trigger_refresh=False)
        self._update_perspective_buttons_visual()
        self._on_toggle_s00_seed(persist=False)
        self.refresh_output()

    # ------------------------------------------------------------------
    # 样式与变量初始化
    # ------------------------------------------------------------------
    def _setup_styles(self) -> None:
        style = ttk.Style(self.root)
        style.theme_use("clam")

        style.configure(".", background=BG_MAIN, foreground=FG_TEXT, font=("Microsoft YaHei UI", 10))
        style.configure("TFrame", background=BG_MAIN)
        style.configure("Card.TFrame", background=BG_PANEL)
        style.configure("TLabel", background=BG_PANEL, foreground=FG_TEXT)
        style.configure("Main.TLabel", background=BG_MAIN, foreground=FG_TEXT)
        style.configure("Header.TLabel", background=BG_MAIN, foreground=ACCENT, font=("Microsoft YaHei UI", 12, "bold"))
        style.configure("SubHeader.TLabel", background=BG_PANEL, foreground=ACCENT, font=("Microsoft YaHei UI", 10, "bold"))
        style.configure("Hint.TLabel", background=BG_PANEL, foreground=FG_MUTED, font=("Microsoft YaHei UI", 9))

        style.configure("TNotebook", background=BG_MAIN, borderwidth=0, tabmargins=[2, 4, 2, 0])
        style.configure(
            "TNotebook.Tab",
            background=BORDER,
            foreground=FG_MUTED,
            padding=[10, 6],
            font=("Microsoft YaHei UI", 9, "bold"),
        )
        style.map(
            "TNotebook.Tab",
            background=[("selected", BG_PANEL)],
            foreground=[("selected", ACCENT)],
        )

        style.configure(
            "TCombobox",
            fieldbackground=BG_INPUT,
            background=BORDER,
            foreground=FG_TEXT,
            arrowcolor=FG_TEXT,
            padding=4,
        )
        style.map(
            "TCombobox",
            fieldbackground=[("readonly", BG_INPUT)],
            foreground=[("readonly", FG_TEXT)],
            selectbackground=[("readonly", BG_INPUT)],
            selectforeground=[("readonly", ACCENT)],
        )
        self.root.option_add("*TCombobox*Listbox.background", BG_INPUT)
        self.root.option_add("*TCombobox*Listbox.foreground", FG_TEXT)
        self.root.option_add("*TCombobox*Listbox.selectBackground", ACCENT)
        self.root.option_add("*TCombobox*Listbox.selectForeground", "#11111b")

        style.configure("TCheckbutton", background=BG_PANEL, foreground=FG_TEXT)
        style.map("TCheckbutton", background=[("active", BG_PANEL)])

        style.configure(
            "Accent.TButton",
            background=ACCENT,
            foreground="#11111b",
            font=("Microsoft YaHei UI", 10, "bold"),
            padding=[10, 5],
            borderwidth=0,
        )
        style.map("Accent.TButton", background=[("active", "#b4befe")])

        style.configure(
            "Action.TButton",
            background=ACCENT_POV,
            foreground="#11111b",
            font=("Microsoft YaHei UI", 10, "bold"),
            padding=[10, 5],
            borderwidth=0,
        )
        style.map("Action.TButton", background=[("active", "#74c7ec")])

        style.configure(
            "Secondary.TButton",
            background=BORDER,
            foreground=FG_TEXT,
            padding=[8, 4],
            borderwidth=0,
        )
        style.map("Secondary.TButton", background=[("active", "#45475a")])

        style.configure(
            "Generate.TButton",
            background=SUCCESS,
            foreground="#11111b",
            font=("Microsoft YaHei UI", 10, "bold"),
            padding=[12, 5],
            borderwidth=0,
        )
        style.map(
            "Generate.TButton",
            background=[("active", "#94e2d5"), ("disabled", BORDER)],
            foreground=[("disabled", FG_MUTED)],
        )

    def _get_all_preset_names(self) -> List[str]:
        custom = load_custom_presets()
        names = list(BUILTIN_CHARACTERS.keys())
        for k in custom.keys():
            if k not in names:
                names.append(k)
        return names

    def _init_variables(self) -> None:
        cfg = CharacterConfig()
        self.var_preset = tk.StringVar(value=cfg.preset_name)
        self.var_char_tag = tk.StringVar(value=cfg.char_tag)
        self.var_eng_name = tk.StringVar(value=cfg.eng_name)
        self.var_eye_color = tk.StringVar(value=cfg.eye_color)
        self.var_hair_tags = tk.StringVar(value=cfg.hair_tags)
        self.var_canon_neg = tk.StringVar(value=cfg.canon_neg_tags)
        self.var_extra_char = tk.StringVar(value=cfg.extra_char_tags)

        self.var_body = tk.StringVar(value=cfg.body_preset)
        self.var_bust = tk.StringVar(value=cfg.bust_preset)
        self.var_skin = tk.StringVar(value=cfg.skin_preset)
        self.var_outfit = tk.StringVar(value=cfg.outfit_preset)
        self.var_outfit_state = tk.StringVar(value=cfg.outfit_state_mode)
        self.var_custom_outfit = tk.StringVar(value=cfg.custom_outfit_tags)
        self.var_keep_canon = tk.BooleanVar(value=cfg.keep_canon_elements)
        self.var_legwear = tk.StringVar(value=cfg.legwear_preset)

        self.var_cat_ears = tk.BooleanVar(value=False)
        self.var_horns = tk.BooleanVar(value=False)
        self.var_glasses = tk.BooleanVar(value=False)
        self.var_choker = tk.BooleanVar(value=False)
        self.var_extra_sweat = tk.BooleanVar(value=False)

        self.var_style = tk.StringVar(value=cfg.style_preset)
        self.var_custom_style_pos = tk.StringVar(value="")
        self.var_custom_style_neg = tk.StringVar(value="")
        self.var_morph = tk.StringVar(value=cfg.morph_preset)
        self.var_pubic = tk.StringVar(value=cfg.pubic_preset)
        self.var_pigment = tk.StringVar(value=cfg.pigment_preset)
        self.var_fluid_scale = tk.DoubleVar(value=1.0)

        # 右上角人称选择器（默认 "pov" 第一人称）与多图分镜单图开关
        self.var_perspective = tk.StringVar(value="pov")
        self.var_sub_variants = tk.BooleanVar(value=False)
        self.var_multi_panel_label = tk.StringVar(value="📑 同屏双格漫画差分 (2koma 默认)")
        self.var_active_block_choice = tk.StringVar(value="第 1 条")
        self.var_pure_batch = tk.BooleanVar(value=False)
        self.var_export_both = tk.BooleanVar(value=False)

        # 14 项精密参照模块独立开关
        self.module_vars: Dict[str, tk.BooleanVar] = {
            "enable_quality": tk.BooleanVar(value=True),
            "enable_style": tk.BooleanVar(value=True),
            "enable_identity": tk.BooleanVar(value=True),
            "enable_body": tk.BooleanVar(value=True),
            "enable_outfit": tk.BooleanVar(value=True),
            "enable_clothing_state": tk.BooleanVar(value=True),
            "enable_legwear": tk.BooleanVar(value=True),
            "enable_background": tk.BooleanVar(value=True),
            "enable_expression": tk.BooleanVar(value=True),
            "enable_anatomy": tk.BooleanVar(value=True),
            "enable_action_fluids": tk.BooleanVar(value=True),
            "enable_remnants": tk.BooleanVar(value=True),
            "enable_t5_prose": tk.BooleanVar(value=True),
            "enable_negatives": tk.BooleanVar(value=True),
        }

        self.var_status = tk.StringVar(
            value="就绪 · 可在左侧「🎛️ 精密参照开关」一键关闭角色/画风/外观词条，仅保留核心动作骨架"
        )

        self.scene_vars: Dict[str, tk.BooleanVar] = {
            ch["id"]: tk.BooleanVar(value=(ch["id"] != "F00")) for ch in STORY_CHAPTERS
        }
        self.multi_angle_vars: Dict[str, tk.BooleanVar] = {
            ch["id"]: tk.BooleanVar(value=True) for ch in MULTI_ANGLE_CHAPTERS
        }
        default_pos_checked = {"P01", "P08", "P17", "P23", "P26", "P30", "P35", "P43"}
        self.all_pos_vars: Dict[str, tk.BooleanVar] = {
            ch["id"]: tk.BooleanVar(value=(ch["id"] in default_pos_checked)) for ch in ALL_POSITIONS_CHAPTERS
        }
        self.var_ma_nsfw = tk.BooleanVar(value=cfg.enable_multi_angle_nsfw)
        self.var_pos_category = tk.StringVar(value=POS_CATEGORIES[0])
        self.var_pos_transparent_bg = tk.BooleanVar(value=cfg.pos_transparent_bg)
        self.var_pos_male_mode = tk.StringVar(value=cfg.pos_male_mode)
        self.var_pos_show_penis = tk.BooleanVar(value=cfg.pos_show_penis)
        self.var_pos_stage = tk.StringVar(value=cfg.pos_stage)
        self.var_cam_override = tk.BooleanVar(value=cfg.cam_enable_override)
        self.var_cam_azimuth = tk.IntVar(value=cfg.cam_azimuth)
        self.var_cam_elevation = tk.IntVar(value=cfg.cam_elevation)
        self.var_cam_shot = tk.StringVar(value=cfg.cam_shot_preset)
        self.var_cam_wide = tk.BooleanVar(value=cfg.cam_wide_lens)
        self.var_cam_dutch = tk.BooleanVar(value=cfg.cam_dutch_angle)
        self.var_cam_gaze = tk.StringVar(value=cfg.cam_gaze_preset)
        self.var_cam_compiled_preview = tk.StringVar(value="当前未启用全局机位覆盖 · 自动跟随各幕原有机位")
        self._cam_drag_zone: str = ""
        self.active_scene_id: str = "F00"

        # === NovelAI V5 Full Medium 单张 API 生图状态 ===
        api_cfg = load_api_settings()
        self.var_api_token = tk.StringVar(value=api_cfg.api_token)
        self.var_show_token = tk.BooleanVar(value=False)
        self.var_api_canvas = tk.StringVar(value=api_cfg.canvas_preset)
        self.var_api_scale = tk.DoubleVar(value=api_cfg.scale)
        self.var_api_rescale = tk.DoubleVar(value=api_cfg.cfg_rescale)
        self.var_api_seed = tk.StringVar(value=str(api_cfg.seed))
        self.var_api_use_s00_seed = tk.BooleanVar(value=api_cfg.use_s00_seed)
        self.var_api_extra_uc = tk.StringVar(value=api_cfg.extra_uc)
        self.var_api_quality = tk.BooleanVar(value=api_cfg.append_v5_quality)
        self.var_api_auto_upscale_replace = tk.BooleanVar(value=api_cfg.auto_upscale_replace)
        self.var_api_proxy = tk.StringVar(value=api_cfg.proxy)
        self.var_api_outdir = tk.StringVar(value=api_cfg.output_dir)
        self.var_anlas_badge = tk.StringVar(
            value="💎 账户状态：未验证（点击「查点数」检测 Token 与 Anlas 余额）"
        )
        self.var_preview_meta = tk.StringVar(
            value="尚未生成图片 · 可点击单幕「🎨生成」或右侧「🚀 一键出全套 12 幕」批量连出"
        )
        self.var_s00_seed_badge = tk.StringVar(
            value="（若 Seed=-1：开启后先随机生成 0号幕 S00，后续 S01~S11 自动沿用该 Seed）"
        )

        self.is_generating: bool = False
        self._cancel_batch_upscale: bool = False
        self._cancel_batch_gen: bool = False
        self.last_generated_path: Optional[str] = None
        self.last_generated_seed: Optional[int] = None
        self.last_s00_seed: Optional[int] = None
        self._preview_pil_img: Optional[Image.Image] = None
        self._preview_tk_img: Optional[ImageTk.PhotoImage] = None
        self.gen_btn_refs: Dict[str, tk.Button] = {}

    # ------------------------------------------------------------------
    # 主界面布局构建
    # ------------------------------------------------------------------
    def _build_layout(self) -> None:
        top_bar = ttk.Frame(self.root, padding=(14, 10, 14, 6))
        top_bar.pack(fill=tk.X)

        ttk.Label(
            top_bar,
            text="🎬 NovelAI 连续故事线工作台（双轨视角分离 · 支持精密参照模块 OFF）",
            style="Header.TLabel",
        ).pack(side=tk.LEFT)

        # === 右上角：3D机位状态胶囊 + 视角切换胶囊组 + 整套复制/导出 ===
        right_ctrl = tk.Frame(top_bar, bg=BG_MAIN)
        right_ctrl.pack(side=tk.RIGHT)

        self.btn_top_cam_pill = tk.Button(
            right_ctrl,
            text="🎥 机位: 🔄随本幕默认 (点此调角度)",
            bg=BG_INPUT,
            fg=FG_MUTED,
            activebackground=BORDER,
            activeforeground=ACCENT,
            relief=tk.FLAT,
            highlightthickness=1,
            highlightbackground=BORDER,
            padx=9,
            pady=4,
            cursor="hand2",
            font=("Microsoft YaHei UI", 9, "bold"),
            command=self._jump_to_camera_tab,
        )
        self.btn_top_cam_pill.pack(side=tk.LEFT, padx=(0, 10))
        self.btn_top_cam_pill.bind("<Button-3>", lambda _e: self._reset_camera_override())

        pov_switch_box = tk.Frame(
            right_ctrl, bg=BG_INPUT, highlightbackground=ACCENT, highlightthickness=1, padx=4, pady=3
        )
        pov_switch_box.pack(side=tk.LEFT, padx=(0, 12))

        tk.Label(
            pov_switch_box,
            text="单幕预览视角：",
            bg=BG_INPUT,
            fg=FG_MUTED,
            font=("Microsoft YaHei UI", 9, "bold"),
        ).pack(side=tk.LEFT, padx=(4, 4))

        self.btn_mode_pov = tk.Button(
            pov_switch_box,
            text="👁️ 第一人称 (POV)",
            relief=tk.FLAT,
            padx=10,
            pady=3,
            cursor="hand2",
            font=("Microsoft YaHei UI", 9, "bold"),
            command=lambda: self.set_perspective_mode("pov"),
        )
        self.btn_mode_pov.pack(side=tk.LEFT, padx=2)

        self.btn_mode_3rd = tk.Button(
            pov_switch_box,
            text="🎥 第三人称 (客观机位)",
            relief=tk.FLAT,
            padx=10,
            pady=3,
            cursor="hand2",
            font=("Microsoft YaHei UI", 9, "bold"),
            command=lambda: self.set_perspective_mode("3rd"),
        )
        self.btn_mode_3rd.pack(side=tk.LEFT, padx=2)

        ttk.Button(
            right_ctrl, text="📋 复制当前视角整套", style="Accent.TButton", command=self.copy_current_track_suite
        ).pack(side=tk.LEFT, padx=(0, 6))
        ttk.Button(
            right_ctrl, text="💾 导出 .txt", style="Action.TButton", command=self.export_to_file
        ).pack(side=tk.LEFT)

        paned = tk.PanedWindow(
            self.root, orient=tk.HORIZONTAL, bg=BORDER, sashwidth=5, sashrelief=tk.FLAT, bd=0
        )
        paned.pack(fill=tk.BOTH, expand=True, padx=12, pady=(2, 6))

        left_container = ttk.Frame(paned, width=510)
        right_container = ttk.Frame(paned)
        paned.add(left_container, minsize=465)
        paned.add(right_container, minsize=640)

        self._build_left_tabs(left_container)
        self._build_right_panel(right_container)

        status_bar = tk.Label(
            self.root,
            textvariable=self.var_status,
            bg="#11111b",
            fg=SUCCESS,
            anchor="w",
            padx=14,
            pady=5,
            font=("Microsoft YaHei UI", 9),
        )
        status_bar.pack(fill=tk.X, side=tk.BOTTOM)

    def _make_entry(self, parent: tk.Widget, var: tk.StringVar) -> tk.Entry:
        ent = tk.Entry(
            parent,
            textvariable=var,
            bg=BG_INPUT,
            fg=FG_TEXT,
            insertbackground=ACCENT,
            relief=tk.FLAT,
            highlightthickness=1,
            highlightbackground=BORDER,
            highlightcolor=ACCENT,
            font=("Consolas", 10),
        )
        ent.bind("<KeyRelease>", lambda _e: self.refresh_output())
        ent.bind("<<Paste>>", lambda _e: self.after(10, self.refresh_output))
        ent.bind("<FocusOut>", lambda _e: self.refresh_output())
        return ent

    def _make_combo(self, parent: tk.Widget, var: tk.StringVar, values: List[str], callback=None) -> ttk.Combobox:
        cb = ttk.Combobox(parent, textvariable=var, values=values, state="readonly")
        cb.bind("<<ComboboxSelected>>", callback if callback else lambda _e: self.refresh_output())
        return cb

    def _build_left_tabs(self, parent: ttk.Frame) -> None:
        # 左侧常驻顶部栏：精密参照一键预设快捷条（在任意标签页均可一键切换！）
        quick_card = ttk.Frame(parent, style="Card.TFrame", padding=(8, 6))
        quick_card.pack(fill=tk.X, pady=(0, 6))

        ttk.Label(
            quick_card, text="⚡ 精密参照 (Precise Ref) 一键减负：", style="SubHeader.TLabel"
        ).pack(anchor="w", pady=(0, 4))

        qbtn_row = ttk.Frame(quick_card, style="Card.TFrame")
        qbtn_row.pack(fill=tk.X)
        short_labels = [
            ("🌕 全量直出", "🌕 全量直出（默认全开）"),
            ("🎯 参照:人+画风", "🎯 精密参照：人物+画风（关身份/外观/画风）"),
            ("👤 参照:仅人物", "👤 精密参照：仅锁人物（保留本台画风+动作）"),
            ("🦴 纯动作骨架", "🦴 极简纯动作骨架（除动作与视角外全 OFF）"),
        ]
        for btn_txt, preset_key in short_labels:
            tk.Button(
                qbtn_row,
                text=btn_txt,
                bg=BORDER,
                fg=FG_TEXT,
                activebackground=ACCENT,
                activeforeground="#11111b",
                relief=tk.FLAT,
                padx=6,
                pady=3,
                cursor="hand2",
                font=("Microsoft YaHei UI", 8, "bold"),
                command=lambda k=preset_key: self.apply_module_switch_preset(k),
            ).pack(side=tk.LEFT, fill=tk.X, expand=True, padx=2)

        nb = ttk.Notebook(parent)
        nb.pack(fill=tk.BOTH, expand=True)

        tab_sw = ttk.Frame(nb, style="Card.TFrame", padding=12)
        tab_char = ttk.Frame(nb, style="Card.TFrame", padding=12)
        tab_look = ttk.Frame(nb, style="Card.TFrame", padding=12)
        tab_style = ttk.Frame(nb, style="Card.TFrame", padding=12)
        tab_api = ttk.Frame(nb, style="Card.TFrame", padding=12)
        tab_cam = ttk.Frame(nb, style="Card.TFrame", padding=10)

        nb.add(tab_sw, text=" 🎛️ 精密参照 ")
        nb.add(tab_char, text=" 👤 角色身份 ")
        nb.add(tab_look, text=" 👗 体型穿搭 ")
        nb.add(tab_style, text=" 🎨 画风局部 ")
        nb.add(tab_api, text=" 🚀 API生图 ")
        nb.add(tab_cam, text=" 🎥 3D机位 ")
        self.left_nb = nb

        # === Tab 0: 精密参照模块独立 ON/OFF 开关面板 ===
        ttk.Label(
            tab_sw,
            text="模块独立开关（取消勾选 = OFF，核心动作与镜头视角始终保留）",
            style="SubHeader.TLabel",
        ).pack(anchor="w", pady=(0, 6))

        switch_groups = [
            (
                "🖼️ 画风与角色外观层（开精密参照时建议 OFF）",
                [
                    ("enable_quality", "基础质量前缀 (masterpiece, best quality, absurdres...)"),
                    ("enable_style", "画风笔触与光影词 (colored sketch, backlighting... 及画风负向)"),
                    ("enable_identity", "角色身份·瞳色·发型头饰·原皮负向屏蔽 (OFF后自动由参照接管)"),
                    ("enable_body", "身材体型·胸围·肤色·额外萌点配件 (slender, breasts...)"),
                    ("enable_outfit", "具体服装款式词 (白T恤/水手服/衬衫等具体衣服名称)"),
                    ("enable_legwear", "鞋袜/赤足外观词 (barefoot / 丝袜等；抓脚动作脚掌词仍保留)"),
                ],
            ),
            (
                "🎬 场景辅助与神态细节层（按需自由保留或 OFF）",
                [
                    ("enable_clothing_state", "动作掀衣/下身暴露辅助词 (clothes lift, bottomless · 参照带衣角色建议开)"),
                    ("enable_background", "室内沙发与暖光灯背景词 (indoors, couch, pillow, lamp)"),
                    ("enable_expression", "面部微表情与羞红修饰词 (smug, bedroom eyes, blush...)"),
                    ("enable_anatomy", "局部四维解剖修饰词 (器型/毛发/色泽细分词条)"),
                ],
            ),
            (
                "💦 流体连续性与语句防护层（按需自由保留或 OFF）",
                [
                    ("enable_action_fluids", "本幕核心流体动作表现 (如 S02松口拉丝 / S05排泄 / S07足部 / S11外射)"),
                    ("enable_remnants", "跨幕历史累积残留痕迹 (继承自前几幕的脸颊/发丝/小腹旧积液)"),
                    ("enable_t5_prose", "句尾英文自然语言锚点句 (开启时也会自动剔除上方已 OFF 的模块描述)"),
                    ("enable_negatives", "负向提示词防崩保护块 (-2.5 / -2 姿态与错位封锁词)"),
                ],
            ),
        ]

        for grp_title, items in switch_groups:
            ttk.Label(tab_sw, text=grp_title, foreground=ACCENT_3RD, font=("Microsoft YaHei UI", 9, "bold")).pack(
                anchor="w", pady=(8, 2)
            )
            for key, desc in items:
                ttk.Checkbutton(
                    tab_sw,
                    text=desc,
                    variable=self.module_vars[key],
                    command=self.refresh_output,
                ).pack(anchor="w", padx=(6, 0), pady=2)

        # === Tab 1: 角色与身份 ===
        ttk.Label(tab_char, text="预设角色快选（支持一键切换或保存新角色）", style="SubHeader.TLabel").pack(anchor="w")
        preset_row = ttk.Frame(tab_char, style="Card.TFrame")
        preset_row.pack(fill=tk.X, pady=(4, 6))

        self.cb_preset = self._make_combo(
            preset_row, self.var_preset, self._get_all_preset_names(), self._on_preset_selected
        )
        self.cb_preset.pack(fill=tk.X)

        btn_row = ttk.Frame(tab_char, style="Card.TFrame")
        btn_row.pack(fill=tk.X, pady=(0, 10))
        ttk.Button(
            btn_row, text="💾 保存当前配置为新角色预设", style="Secondary.TButton", command=self.on_save_preset
        ).pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 4))
        ttk.Button(
            btn_row, text="🗑️ 删除预设", style="Secondary.TButton", command=self.on_delete_preset
        ).pack(side=tk.LEFT)

        fields = [
            ("角色核心 Tag（Danbooru 角色名，原创填 original）", self.var_char_tag),
            ("英文句中称呼（自动替换进每幕末尾自然语言锚点）", self.var_eng_name),
            ("瞳色 Tag（智能防冲撞：熟睡闭眼幕 S06/S07 自动隐藏！）", self.var_eye_color),
            ("发型·发色·头饰特征 Tags", self.var_hair_tags),
            ("原设官方服装屏蔽词（自动压入负向防止串回原皮）", self.var_canon_neg),
            ("角色额外常驻补充 Tags（纹身/泪痣/特殊印记等，选填）", self.var_extra_char),
        ]
        for label_txt, var in fields:
            ttk.Label(tab_char, text=label_txt).pack(anchor="w", pady=(6, 2))
            self._make_entry(tab_char, var).pack(fill=tk.X, ipady=4)

        ttk.Label(
            tab_char,
            text="💡 若已在「🎛️ 精密参照开关」中将角色身份设为 OFF，此处角色词条不会输出，完全交由精密参照图片控制。",
            style="Hint.TLabel",
            wraplength=450,
        ).pack(anchor="w", pady=(14, 0))

        # === Tab 2: 体型·穿搭·萌点 ===
        ttk.Label(tab_look, text="身材与局部比例自定义", style="SubHeader.TLabel").pack(anchor="w")

        ttk.Label(tab_look, text="身材体型预设（自动同步移除冲突负向词）：").pack(anchor="w", pady=(6, 2))
        self._make_combo(tab_look, self.var_body, list(BODY_PRESETS.keys())).pack(fill=tk.X)

        ttk.Label(tab_look, text="胸围大小预设：").pack(anchor="w", pady=(6, 2))
        self._make_combo(tab_look, self.var_bust, list(BUST_PRESETS.keys())).pack(fill=tk.X)

        ttk.Label(tab_look, text="肤色与汗湿质感预设：").pack(anchor="w", pady=(6, 2))
        self._make_combo(tab_look, self.var_skin, list(SKIN_PRESETS.keys())).pack(fill=tk.X)

        ttk.Label(tab_look, text="服装与鞋袜搭配", style="SubHeader.TLabel").pack(anchor="w", pady=(14, 2))

        ttk.Label(tab_look, text="上装 / 穿搭款式预设（支持原设原皮与混搭）：").pack(anchor="w", pady=(4, 2))
        self._make_combo(
            tab_look, self.var_outfit, list(OUTFIT_PRESETS.keys()), callback=self._on_outfit_preset_changed
        ).pack(fill=tk.X)

        ttk.Label(tab_look, text="穿脱与动作暴露方式（解耦服装款式与暴露程度）：").pack(anchor="w", pady=(6, 2))
        self._make_combo(tab_look, self.var_outfit_state, list(OUTFIT_STATE_PRESETS.keys())).pack(fill=tk.X)

        ttk.Label(tab_look, text="追加自定义服饰 / 混搭单品 Tags（可叠加到任意预设）：").pack(anchor="w", pady=(6, 2))
        self._make_entry(tab_look, self.var_custom_outfit).pack(fill=tk.X, ipady=4)

        ttk.Checkbutton(
            tab_look,
            text="🔓 允许保留/混搭角色原设服饰配件（不强行屏蔽原皮负向词）",
            variable=self.var_keep_canon,
            command=self.refresh_output,
        ).pack(anchor="w", pady=(6, 2))

        ttk.Label(tab_look, text="足部 / 丝袜款式（自动联动 S07/S08 抓脚足部幕）：").pack(anchor="w", pady=(6, 2))
        self._make_combo(tab_look, self.var_legwear, list(LEGWEAR_PRESETS.keys())).pack(fill=tk.X)

        ttk.Label(tab_look, text="额外萌点配件开关（可多选叠加）", style="SubHeader.TLabel").pack(anchor="w", pady=(14, 4))
        chk_grid = ttk.Frame(tab_look, style="Card.TFrame")
        chk_grid.pack(fill=tk.X)
        extras_chk = [
            ("🐾 猫耳与耳绒毛 (cat ears)", self.var_cat_ears),
            ("😈 小恶魔角与尾巴 (horns & tail)", self.var_horns),
            ("👓 半框眼镜娘 (glasses)", self.var_glasses),
            ("🎀 黑色颈带项圈 (black choker)", self.var_choker),
            ("💦 害羞飞汗与热气 (steam & sweatdrops)", self.var_extra_sweat),
        ]
        for idx, (txt, bvar) in enumerate(extras_chk):
            cb = ttk.Checkbutton(chk_grid, text=txt, variable=bvar, command=self.refresh_output)
            cb.grid(row=idx // 2, column=idx % 2, sticky="w", padx=(0, 12), pady=3)

        # === Tab 3: 画风·局部四维 ===
        ttk.Label(tab_style, text="全局画风引擎", style="SubHeader.TLabel").pack(anchor="w")
        ttk.Label(tab_style, text="画风预设：").pack(anchor="w", pady=(4, 2))
        self._make_combo(
            tab_style, self.var_style, list(STYLE_PRESETS.keys()), callback=self._on_style_preset_changed
        ).pack(fill=tk.X)

        ttk.Label(tab_style, text="自定义正向画风词（选“自定义画风”时生效）：").pack(anchor="w", pady=(6, 2))
        self._make_entry(tab_style, self.var_custom_style_pos).pack(fill=tk.X, ipady=3)

        ttk.Label(tab_style, text="自定义负向画风词（选“自定义画风”时生效）：").pack(anchor="w", pady=(6, 2))
        self._make_entry(tab_style, self.var_custom_style_neg).pack(fill=tk.X, ipady=3)

        ttk.Label(tab_style, text="局部四维模块化精调 (Anatomy Presets)", style="SubHeader.TLabel").pack(
            anchor="w", pady=(14, 2)
        )
        ttk.Label(tab_style, text="第一维 · 局部先天器型分类：").pack(anchor="w", pady=(4, 2))
        self._make_combo(tab_style, self.var_morph, list(MORPH_PRESETS.keys())).pack(fill=tk.X)

        ttk.Label(tab_style, text="第二维 · 毛发修饰款式：").pack(anchor="w", pady=(6, 2))
        self._make_combo(tab_style, self.var_pubic, list(PUBIC_PRESETS.keys())).pack(fill=tk.X)

        ttk.Label(tab_style, text="第三维 · 色泽与黏膜层次：").pack(anchor="w", pady=(6, 2))
        self._make_combo(tab_style, self.var_pigment, list(PIGMENT_PRESETS.keys())).pack(fill=tk.X)

        scale_frame = ttk.Frame(tab_style, style="Card.TFrame")
        scale_frame.pack(fill=tk.X, pady=(14, 4))
        self.lbl_fluid = ttk.Label(scale_frame, text="全局液体与残留痕迹权重倍率：1.00x（标准定稿）", style="SubHeader.TLabel")
        self.lbl_fluid.pack(anchor="w")

        slider = tk.Scale(
            scale_frame,
            from_=0.70,
            to=1.45,
            resolution=0.05,
            orient=tk.HORIZONTAL,
            variable=self.var_fluid_scale,
            bg=BG_PANEL,
            fg=FG_TEXT,
            troughcolor=BG_INPUT,
            highlightthickness=0,
            activebackground=ACCENT,
            showvalue=False,
            command=self._on_fluid_slider,
        )
        slider.pack(fill=tk.X, pady=(2, 6))

        ttk.Label(tab_style, text="多格分镜幕 (S03 / S04) 出图模式（可一键拆为全尺寸单图）：").pack(
            anchor="w", pady=(8, 2)
        )
        self._make_combo(
            tab_style, self.var_multi_panel_label, list(MULTI_PANEL_MODE_PRESETS.keys())
        ).pack(fill=tk.X)

        ttk.Checkbutton(
            tab_style,
            text="附加同视角下的进阶子变体（如 S04 多角色分区框 / S11 双腿抬高环腰版）",
            variable=self.var_sub_variants,
            command=self.refresh_output,
        ).pack(anchor="w", pady=(8, 2))

        # === Tab 4: NovelAI V5 Full Medium 单张 API 生图设置 ===
        self._build_api_tab(tab_api)

        # === Tab 5: 全局 3D 球面机位雷达盘与快捷预设 ===
        self._build_camera_tab(tab_cam)

    def _build_camera_tab(self, tab_cam: ttk.Frame) -> None:
        top_row = ttk.Frame(tab_cam, style="Card.TFrame")
        top_row.pack(fill=tk.X, pady=(0, 6))

        tk.Checkbutton(
            top_row,
            text="🎥 启用全局 3D 相机角度覆盖（拖动下方雷达自动开启）",
            variable=self.var_cam_override,
            bg=BG_PANEL,
            fg=SUCCESS,
            selectcolor=BG_INPUT,
            activebackground=BG_PANEL,
            activeforeground=SUCCESS,
            font=("Microsoft YaHei UI", 9, "bold"),
            cursor="hand2",
            command=self._on_camera_param_changed,
        ).pack(side=tk.LEFT)

        ttk.Button(
            top_row,
            text="🔄 随本幕默认",
            style="Secondary.TButton",
            command=self._reset_camera_override,
        ).pack(side=tk.RIGHT)

        # 可视化 3D 水平环绕雷达盘 (左) + 垂直俯仰剖面弧 (右)
        self.cam_radar_canvas = tk.Canvas(
            tab_cam,
            width=446,
            height=222,
            bg=BG_INPUT,
            highlightthickness=1,
            highlightbackground=BORDER,
            cursor="crosshair",
        )
        self.cam_radar_canvas.pack(fill=tk.X, pady=(0, 6))
        self.cam_radar_canvas.bind("<Button-1>", self._on_cam_canvas_down)
        self.cam_radar_canvas.bind("<B1-Motion>", self._on_cam_canvas_drag)
        self.cam_radar_canvas.bind("<ButtonRelease-1>", self._on_cam_canvas_up)
        self.cam_radar_canvas.bind("<Button-3>", lambda _e: self._reset_camera_override())

        # 一键快捷机位胶囊 (2行 x 5列)
        ttk.Label(
            tab_cam,
            text="⚡ 一键快捷机位胶囊（点击直接切换并自动开启机位覆盖 · 按住 Shift 拖动雷达按 15° 吸附）：",
            style="SubHeader.TLabel",
        ).pack(anchor="w", pady=(2, 3))

        quick_grid = ttk.Frame(tab_cam, style="Card.TFrame")
        quick_grid.pack(fill=tk.X, pady=(0, 6))
        for c_i in range(5):
            quick_grid.columnconfigure(c_i, weight=1)

        for idx, (lbl, q_az, q_el, q_shot, q_wide) in enumerate(CAMERA_QUICK_PRESETS):
            tk.Button(
                quick_grid,
                text=lbl,
                bg=BORDER,
                fg=FG_TEXT,
                activebackground=ACCENT_POV,
                activeforeground="#11111b",
                relief=tk.FLAT,
                padx=4,
                pady=3,
                cursor="hand2",
                font=("Microsoft YaHei UI", 8, "bold"),
                command=lambda a=q_az, e=q_el, s=q_shot, w=q_wide: self._apply_quick_camera_preset(a, e, s, w),
            ).grid(row=idx // 5, column=idx % 5, sticky="ew", padx=2, pady=2)

        # 景别距离胶囊条
        ttk.Label(tab_cam, text="🔭 景别与焦距范围（Shot Distance）：", style="SubHeader.TLabel").pack(
            anchor="w", pady=(2, 3)
        )
        shot_grid = ttk.Frame(tab_cam, style="Card.TFrame")
        shot_grid.pack(fill=tk.X, pady=(0, 6))
        self.cam_shot_btns: Dict[str, tk.Button] = {}
        shot_keys = list(CAMERA_SHOT_PRESETS.keys())
        for c_i in range(3):
            shot_grid.columnconfigure(c_i, weight=1)
        for idx, sk in enumerate(shot_keys):
            b = tk.Button(
                shot_grid,
                text=sk,
                bg=ACCENT_POV if sk == self.var_cam_shot.get() else BORDER,
                fg="#11111b" if sk == self.var_cam_shot.get() else FG_TEXT,
                activebackground=ACCENT_POV,
                activeforeground="#11111b",
                relief=tk.FLAT,
                padx=4,
                pady=3,
                cursor="hand2",
                font=("Microsoft YaHei UI", 8, "bold"),
                command=lambda k=sk: self._select_cam_shot(k),
            )
            b.grid(row=idx // 3, column=idx % 3, sticky="ew", padx=2, pady=2)
            self.cam_shot_btns[sk] = b

        # 广角透视 / 荷兰斜角 / 视线跟随
        lens_row = ttk.Frame(tab_cam, style="Card.TFrame")
        lens_row.pack(fill=tk.X, pady=(2, 4))
        ttk.Checkbutton(
            lens_row,
            text="🔥 超广角强透视近大远小 (foreshortening)",
            variable=self.var_cam_wide,
            command=self._enable_and_refresh_cam,
        ).pack(side=tk.LEFT, padx=(0, 10))
        ttk.Checkbutton(
            lens_row,
            text="📐 荷兰斜角构图 (dutch angle)",
            variable=self.var_cam_dutch,
            command=self._enable_and_refresh_cam,
        ).pack(side=tk.LEFT)

        gaze_row = ttk.Frame(tab_cam, style="Card.TFrame")
        gaze_row.pack(fill=tk.X, pady=(2, 6))
        ttk.Label(gaze_row, text="角色视线：").pack(side=tk.LEFT)
        cb_gaze = ttk.Combobox(
            gaze_row,
            textvariable=self.var_cam_gaze,
            values=list(CAMERA_GAZE_PRESETS.keys()),
            state="readonly",
        )
        cb_gaze.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(4, 0))
        cb_gaze.bind("<<ComboboxSelected>>", lambda _e: self._on_camera_param_changed())

        # 实时机位词条回显框
        tk.Label(
            tab_cam,
            textvariable=self.var_cam_compiled_preview,
            bg=BG_INPUT,
            fg=ACCENT_3RD,
            anchor="w",
            justify=tk.LEFT,
            wraplength=435,
            padx=8,
            pady=6,
            font=("Consolas", 9),
        ).pack(fill=tk.X, pady=(2, 0))

        self._redraw_camera_radar()

    def _jump_to_camera_tab(self) -> None:
        if hasattr(self, "left_nb"):
            self.left_nb.select(5)

    def _reset_camera_override(self) -> None:
        self.var_cam_override.set(False)
        self._on_camera_param_changed()
        self.var_status.set("🔄 已恢复「跟随本幕默认机位」模式（右键点击顶部机位胶囊也可随时快速复位）")

    def _enable_and_refresh_cam(self) -> None:
        self.var_cam_override.set(True)
        self._on_camera_param_changed()

    def _select_cam_shot(self, shot_label: str) -> None:
        self.var_cam_shot.set(shot_label)
        self.var_cam_override.set(True)
        self._on_camera_param_changed()

    def _apply_quick_camera_preset(
        self, az: int, el: int, shot_label: Optional[str], wide: bool
    ) -> None:
        self.var_cam_override.set(True)
        self.var_cam_azimuth.set(az)
        self.var_cam_elevation.set(el)
        if shot_label and shot_label in CAMERA_SHOT_PRESETS:
            self.var_cam_shot.set(shot_label)
        self.var_cam_wide.set(wide)
        self._on_camera_param_changed()

    def _on_cam_canvas_down(self, event: tk.Event) -> None:
        self._cam_drag_zone = "pitch" if event.x >= 254 else "azimuth"
        self.var_cam_override.set(True)
        self._update_cam_from_pointer(event)

    def _on_cam_canvas_drag(self, event: tk.Event) -> None:
        if not self._cam_drag_zone:
            self._cam_drag_zone = "pitch" if event.x >= 254 else "azimuth"
        self.var_cam_override.set(True)
        self._update_cam_from_pointer(event)

    def _on_cam_canvas_up(self, _event: tk.Event) -> None:
        self._cam_drag_zone = ""

    def _update_cam_from_pointer(self, event: tk.Event) -> None:
        snap15 = bool(event.state & 0x0001)  # Shift 键 15° 吸附
        if self._cam_drag_zone == "azimuth":
            cx, cy = 126.0, 114.0
            dx = event.x - cx
            dy = event.y - cy
            if abs(dx) < 1e-3 and abs(dy) < 1e-3:
                return
            az = round(math.degrees(math.atan2(dx, dy)))
            if snap15:
                az = int(round(az / 15.0) * 15)
            az = max(-180, min(180, az))
            self.var_cam_azimuth.set(az)
        else:
            px, py = 304.0, 118.0
            dx = max(6.0, float(event.x) - px)
            dy = py - float(event.y)
            el = round(math.degrees(math.atan2(dy, dx)))
            if snap15:
                el = int(round(el / 15.0) * 15)
            el = max(-80, min(85, el))
            self.var_cam_elevation.set(el)
        self._on_camera_param_changed()

    def _on_camera_param_changed(self) -> None:
        cur_shot = self.var_cam_shot.get()
        if hasattr(self, "cam_shot_btns"):
            for sk, btn in self.cam_shot_btns.items():
                btn.config(
                    bg=ACCENT_POV if sk == cur_shot else BORDER,
                    fg="#11111b" if sk == cur_shot else FG_TEXT,
                )
        self._redraw_camera_radar()
        self.refresh_output()

    def _sync_camera_status_ui(self) -> None:
        on = self.var_cam_override.get()
        az = self.var_cam_azimuth.get()
        el = self.var_cam_elevation.get()
        shot_code = CAMERA_SHOT_PRESETS.get(self.var_cam_shot.get(), "auto")
        gaze_code = CAMERA_GAZE_PRESETS.get(self.var_cam_gaze.get(), "auto_look")
        wide = self.var_cam_wide.get()
        dutch = self.var_cam_dutch.get()

        short_txt = describe_camera_short(on, az, el, shot_code, wide, dutch)
        if hasattr(self, "btn_top_cam_pill"):
            if on:
                self.btn_top_cam_pill.config(
                    text=f"🎥 机位覆盖: {short_txt} (右键复位)",
                    bg=SUCCESS,
                    fg="#11111b",
                    highlightbackground=SUCCESS,
                )
            else:
                self.btn_top_cam_pill.config(
                    text="🎥 机位: 🔄随本幕默认 (点此调角度)",
                    bg=BG_INPUT,
                    fg=FG_MUTED,
                    highlightbackground=BORDER,
                )

        if not on:
            self.var_cam_compiled_preview.set("🔄 当前未启用全局机位覆盖 · 各幕保持原设镜头（拖动上方圆盘或点胶囊即生效）")
        else:
            rig = compile_camera_rig(az, el, shot_code, wide, dutch, gaze_code)
            tags_str = ", ".join(list(rig["pos_tags"]) + list(rig["gaze_tags"]))  # type: ignore[arg-type]
            self.var_cam_compiled_preview.set(f"✅ 注入正向机位: {tags_str}")

    def _redraw_camera_radar(self) -> None:
        if not hasattr(self, "cam_radar_canvas"):
            return
        cv = self.cam_radar_canvas
        cv.delete("all")
        on = self.var_cam_override.get()
        az = self.var_cam_azimuth.get()
        el = self.var_cam_elevation.get()

        active_col = ACCENT_POV if on else "#6c7086"
        pitch_col = SUCCESS if on else "#6c7086"

        # === 左区：360° 水平环绕雷达俯视图 ===
        cx, cy, r_out = 126, 114, 74
        cv.create_text(cx, 13, text="🧭 水平环绕角 Azimuth (俯视拖拽)", fill=FG_TEXT, font=("Microsoft YaHei UI", 8, "bold"))
        cv.create_oval(cx - r_out, cy - r_out, cx + r_out, cy + r_out, outline="#45475a", width=2, fill="#1e1e2e")
        cv.create_oval(cx - 42, cy - 42, cx + 42, cy + 42, outline="#313244", dash=(3, 3))

        for deg_tick in range(-180, 180, 45):
            rad_t = math.radians(deg_tick)
            tx1, ty1 = cx + (r_out - 6) * math.sin(rad_t), cy + (r_out - 6) * math.cos(rad_t)
            tx2, ty2 = cx + r_out * math.sin(rad_t), cy + r_out * math.cos(rad_t)
            cv.create_line(cx, cy, tx2, ty2, fill="#2a2b3d")
            cv.create_line(tx1, ty1, tx2, ty2, fill="#585b70", width=2)

        cv.create_text(cx, cy + r_out + 12, text="▼ 正前 0°", fill=ACCENT_3RD, font=("Microsoft YaHei UI", 8, "bold"))
        cv.create_text(cx, cy - r_out - 10, text="▲ 正后 180°", fill=FG_MUTED, font=("Microsoft YaHei UI", 8))
        cv.create_text(cx - r_out - 20, cy, text="左-90°", fill=FG_MUTED, font=("Microsoft YaHei UI", 8))
        cv.create_text(cx + r_out + 21, cy, text="右+90°", fill=FG_MUTED, font=("Microsoft YaHei UI", 8))

        # 相机视锥扇形 (FOV Cone) 与相机拖拽球
        az_rad = math.radians(az)
        cam_x = cx + r_out * math.sin(az_rad)
        cam_y = cy + r_out * math.cos(az_rad)
        perp_x = math.cos(az_rad) * 16
        perp_y = -math.sin(az_rad) * 16
        cv.create_polygon(
            cam_x,
            cam_y,
            cx + perp_x,
            cy + perp_y,
            cx - perp_x,
            cy - perp_y,
            fill="#273859" if on else "#252636",
            outline=active_col,
            stipple="gray50",
        )
        cv.create_line(cam_x, cam_y, cx, cy, fill=active_col, width=2, arrow=tk.LAST)

        # 中心角色朝向图标（面朝下方“正前 0°”）
        cv.create_oval(cx - 11, cy - 11, cx + 11, cy + 11, fill="#cba6f7", outline="#11111b", width=2)
        cv.create_polygon(cx - 5, cy + 10, cx + 5, cy + 10, cx, cy + 18, fill=ACCENT_3RD)
        cv.create_text(cx, cy, text="女", fill="#11111b", font=("Microsoft YaHei UI", 8, "bold"))

        cv.create_oval(cam_x - 9, cam_y - 9, cam_x + 9, cam_y + 9, fill=active_col, outline="#ffffff", width=2)
        cv.create_text(
            cx,
            211,
            text=f"水平方位: {az:+d}°",
            fill=active_col if on else FG_MUTED,
            font=("Consolas", 9, "bold"),
        )

        # 分隔线
        cv.create_line(254, 12, 254, 210, fill=BORDER, dash=(3, 3))

        # === 右区：垂直俯仰剖面弧 (-80° ~ +85°) ===
        px, py, r_arc = 304, 118, 74
        cv.create_text(350, 13, text="📐 垂直俯仰 Pitch (上下拖拽)", fill=FG_TEXT, font=("Microsoft YaHei UI", 8, "bold"))

        # 绘制侧面小人剪影
        cv.create_oval(px - 7, py - 28, px + 7, py - 14, outline="#cba6f7", width=2)
        cv.create_line(px, py - 14, px, py + 18, fill="#cba6f7", width=3)
        cv.create_line(px, py + 18, px - 6, py + 36, fill="#cba6f7", width=2)
        cv.create_line(px, py + 18, px + 6, py + 36, fill="#cba6f7", width=2)
        cv.create_line(px - 14, py + 37, px + 18, py + 37, fill="#45475a", width=2)

        # 绘制俯仰圆弧轨迹
        arc_pts: List[float] = []
        for d in range(-80, 86, 5):
            rd = math.radians(d)
            arc_pts.extend([px + r_arc * math.cos(rd), py - r_arc * math.sin(rd)])
        cv.create_line(*arc_pts, fill="#45475a", width=3, smooth=True)

        # 平视 0° 基准线
        cv.create_line(px + 10, py, px + r_arc + 6, py, fill="#313244", dash=(2, 2))
        cv.create_text(px + r_arc + 28, py, text="平视 0°", fill=FG_MUTED, font=("Microsoft YaHei UI", 8))
        cv.create_text(px + 38, py - r_arc - 6, text="顶视+85°", fill=FG_MUTED, font=("Microsoft YaHei UI", 8))
        cv.create_text(px + 42, py + r_arc + 6, text="虫视-80°", fill=FG_MUTED, font=("Microsoft YaHei UI", 8))

        el_rad = math.radians(el)
        ey_x = px + r_arc * math.cos(el_rad)
        ey_y = py - r_arc * math.sin(el_rad)
        cv.create_line(ey_x, ey_y, px + 4, py - 4, fill=pitch_col, width=2, arrow=tk.LAST)
        cv.create_oval(ey_x - 8, ey_y - 8, ey_x + 8, ey_y + 8, fill=pitch_col, outline="#ffffff", width=2)
        cv.create_text(
            352,
            211,
            text=f"垂直俯仰: {el:+d}°",
            fill=pitch_col if on else FG_MUTED,
            font=("Consolas", 9, "bold"),
        )

    def _make_api_entry(self, parent: tk.Widget, var: tk.StringVar, show: str = "") -> tk.Entry:
        ent = tk.Entry(
            parent,
            textvariable=var,
            show=show,
            bg=BG_INPUT,
            fg=FG_TEXT,
            insertbackground=ACCENT,
            relief=tk.FLAT,
            highlightthickness=1,
            highlightbackground=BORDER,
            highlightcolor=ACCENT,
            font=("Consolas", 10),
        )
        return ent

    def _build_api_tab(self, tab_api: ttk.Frame) -> None:
        ttk.Label(
            tab_api,
            text=f"⚡ 单张按需生图引擎（锁定：{MODEL_V5_FULL_MEDIUM} · 14步）",
            style="SubHeader.TLabel",
        ).pack(anchor="w")

        tk.Label(
            tab_api,
            textvariable=self.var_anlas_badge,
            bg=BG_INPUT,
            fg=SUCCESS,
            anchor="w",
            padx=8,
            pady=5,
            font=("Microsoft YaHei UI", 9, "bold"),
        ).pack(fill=tk.X, pady=(6, 8))

        ttk.Label(tab_api, text="Persistent API Token（以 pst- 开头，网页端 Account 获取）：").pack(
            anchor="w", pady=(2, 2)
        )
        tok_row = ttk.Frame(tab_api, style="Card.TFrame")
        tok_row.pack(fill=tk.X)
        self.ent_api_token = self._make_api_entry(tok_row, self.var_api_token, show="*")
        self.ent_api_token.pack(side=tk.LEFT, fill=tk.X, expand=True, ipady=4)
        ttk.Checkbutton(
            tok_row,
            text="显示",
            variable=self.var_show_token,
            command=lambda: self.ent_api_token.config(show="" if self.var_show_token.get() else "*"),
        ).pack(side=tk.LEFT, padx=(6, 0))

        tok_btn_row = ttk.Frame(tab_api, style="Card.TFrame")
        tok_btn_row.pack(fill=tk.X, pady=(6, 10))
        ttk.Button(
            tok_btn_row,
            text="💾 保存 API 配置",
            style="Secondary.TButton",
            command=self.on_save_api_config,
        ).pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 4))
        self.btn_check_anlas = ttk.Button(
            tok_btn_row,
            text="🔍 验证 Token / 查点数 (Anlas)",
            style="Action.TButton",
            command=self.on_check_anlas_clicked,
        )
        self.btn_check_anlas.pack(side=tk.LEFT, fill=tk.X, expand=True)

        ttk.Label(tab_api, text="画布尺寸（默认自动识别当前单幕推荐横/竖图）：").pack(anchor="w", pady=(4, 2))
        cb_canvas = ttk.Combobox(
            tab_api,
            textvariable=self.var_api_canvas,
            values=list(CANVAS_PRESETS.keys()),
            state="readonly",
        )
        cb_canvas.pack(fill=tk.X)
        cb_canvas.bind("<<ComboboxSelected>>", lambda _e: self._update_cost_hint_label())

        self.lbl_cost_hint = ttk.Label(tab_api, text="", style="Hint.TLabel")
        self.lbl_cost_hint.pack(anchor="w", pady=(3, 6))

        seed_hdr = ttk.Frame(tab_api, style="Card.TFrame")
        seed_hdr.pack(fill=tk.X, pady=(2, 2))
        ttk.Label(seed_hdr, text="随机种子 Seed（填 -1 为每次随机）：").pack(side=tk.LEFT)
        ttk.Button(
            seed_hdr,
            text="🎲 随机(-1)",
            style="Secondary.TButton",
            command=lambda: self.var_api_seed.set("-1"),
        ).pack(side=tk.RIGHT, padx=(4, 0))
        ttk.Button(
            seed_hdr,
            text="🔒 锁上次",
            style="Secondary.TButton",
            command=self.on_lock_last_seed,
        ).pack(side=tk.RIGHT, padx=(4, 0))
        ttk.Button(
            seed_hdr,
            text="0️⃣ 锁S00",
            style="Secondary.TButton",
            command=self.on_lock_last_s00_seed,
        ).pack(side=tk.RIGHT)
        self._make_api_entry(tab_api, self.var_api_seed).pack(fill=tk.X, ipady=3)

        ttk.Checkbutton(
            tab_api,
            text="🔗 连出时使用 0号幕 (S00) 的 Seed（关闭则后续每幕独立随机）",
            variable=self.var_api_use_s00_seed,
            command=self._on_toggle_s00_seed,
        ).pack(anchor="w", pady=(4, 2))

        scale_row = ttk.Frame(tab_api, style="Card.TFrame")
        scale_row.pack(fill=tk.X, pady=(8, 2))
        self.lbl_api_scale = ttk.Label(
            scale_row, text=f"Prompt Guidance (相关性 Scale)：{self.var_api_scale.get():.1f}", style="SubHeader.TLabel"
        )
        self.lbl_api_scale.pack(anchor="w")
        tk.Scale(
            scale_row,
            from_=3.0,
            to=9.0,
            resolution=0.1,
            orient=tk.HORIZONTAL,
            variable=self.var_api_scale,
            bg=BG_PANEL,
            fg=FG_TEXT,
            troughcolor=BG_INPUT,
            highlightthickness=0,
            activebackground=ACCENT,
            showvalue=False,
            command=lambda v: self.lbl_api_scale.config(text=f"Prompt Guidance (相关性 Scale)：{float(v):.1f}"),
        ).pack(fill=tk.X)

        ttk.Checkbutton(
            tab_api,
            text="未含质量词时自动补充 V5 官方质量后缀 (very aesthetic, masterpiece, no text)",
            variable=self.var_api_quality,
        ).pack(anchor="w", pady=(4, 4))

        ttk.Checkbutton(
            tab_api,
            text="🔎 生成后立刻执行 2x Upscale 并移除放大前原图 (每次 +1 Anlas)",
            variable=self.var_api_auto_upscale_replace,
            command=self._update_cost_hint_label,
        ).pack(anchor="w", pady=(0, 6))

        ttk.Label(tab_api, text="额外全局负面词 UC（可选，附加在 V5 Heavy 预设之后）：").pack(anchor="w", pady=(4, 2))
        self._make_api_entry(tab_api, self.var_api_extra_uc).pack(fill=tk.X, ipady=3)

        ttk.Label(tab_api, text="本地代理 Proxy（选填，如 http://127.0.0.1:7890；留空走系统默认）：").pack(
            anchor="w", pady=(6, 2)
        )
        self._make_api_entry(tab_api, self.var_api_proxy).pack(fill=tk.X, ipady=3)

        dir_row = ttk.Frame(tab_api, style="Card.TFrame")
        dir_row.pack(fill=tk.X, pady=(6, 2))
        ttk.Label(dir_row, text="输出目录：").pack(side=tk.LEFT)
        ttk.Button(
            dir_row, text="📂 浏览", style="Secondary.TButton", command=self.on_choose_output_dir
        ).pack(side=tk.RIGHT, padx=(4, 0))
        ttk.Button(
            dir_row, text="📁 打开目录", style="Secondary.TButton", command=self.on_open_output_dir
        ).pack(side=tk.RIGHT)
        self._make_api_entry(tab_api, self.var_api_outdir).pack(fill=tk.X, ipady=3, pady=(2, 8))

        self.btn_left_generate = ttk.Button(
            tab_api,
            text="🎨 立即单张生成当前选中幕 (V5 Full Medium · 1张)",
            style="Generate.TButton",
            command=self.on_generate_current_preview,
        )
        self.btn_left_generate.pack(fill=tk.X, pady=(2, 4))

        batch_gen_left_row = ttk.Frame(tab_api, style="Card.TFrame")
        batch_gen_left_row.pack(fill=tk.X, pady=(0, 4))
        self.btn_left_batch_all12 = ttk.Button(
            batch_gen_left_row,
            text="🚀 一键连出全套 12 幕",
            style="Generate.TButton",
            command=lambda: self.on_batch_generate_scenes(force_all_12=True),
        )
        self.btn_left_batch_all12.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 4))
        self.btn_left_batch_checked = ttk.Button(
            batch_gen_left_row,
            text="🎯 连出已勾选幕",
            style="Action.TButton",
            command=lambda: self.on_batch_generate_scenes(force_all_12=False),
        )
        self.btn_left_batch_checked.pack(side=tk.LEFT)

        up_row = ttk.Frame(tab_api, style="Card.TFrame")
        up_row.pack(fill=tk.X, pady=(0, 4))
        self.btn_left_upscale_last = ttk.Button(
            up_row,
            text="🔎 高清放大当前图 (2x · 1点数)",
            style="Accent.TButton",
            command=self.on_upscale_last_image,
        )
        self.btn_left_upscale_last.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 4))
        self.btn_left_upscale_file = ttk.Button(
            up_row,
            text="📂 选单图放大 (1点数)",
            style="Secondary.TButton",
            command=self.on_upscale_chosen_file,
        )
        self.btn_left_upscale_file.pack(side=tk.LEFT)

        batch_up_row = ttk.Frame(tab_api, style="Card.TFrame")
        batch_up_row.pack(fill=tk.X, pady=(0, 4))
        self.btn_left_batch_upscale = ttk.Button(
            batch_up_row,
            text="📁 按文件夹批量 Upscale 并另存新目录 (每张 1 点数)",
            style="Action.TButton",
            command=self.on_batch_upscale_folder,
        )
        self.btn_left_batch_upscale.pack(side=tk.LEFT, fill=tk.X, expand=True)
        self.btn_cancel_batch = ttk.Button(
            batch_up_row,
            text="⏹ 停止批量",
            style="Secondary.TButton",
            command=self.on_request_cancel_any_batch,
            state="disabled",
        )
        self.btn_cancel_batch.pack(side=tk.RIGHT, padx=(4, 0))

        ttk.Label(
            tab_api,
            text="💡 说明：V5 官网暂未开放垫图角色参照接口；生图将直接读取右侧「单幕精细预览」框内的第一条文本（支持手改微调后直接点生成）。",
            style="Hint.TLabel",
            wraplength=445,
        ).pack(anchor="w", pady=(4, 0))

    def _build_right_panel(self, parent: ttk.Frame) -> None:
        top_card = ttk.Frame(parent, style="Card.TFrame", padding=6)
        top_card.pack(fill=tk.X, pady=(0, 8))

        self.scene_nb = ttk.Notebook(top_card)
        self.scene_nb.pack(fill=tk.X)
        tab_story_list = ttk.Frame(self.scene_nb, style="Card.TFrame", padding=6)
        tab_ma_list = ttk.Frame(self.scene_nb, style="Card.TFrame", padding=6)
        tab_pos_list = ttk.Frame(self.scene_nb, style="Card.TFrame", padding=6)
        self.scene_nb.add(tab_story_list, text=" 📖 剧情故事线 (F00 + 12幕) ")
        self.scene_nb.add(tab_ma_list, text=" 📷 多角度套图 (9 镜头 · 独立运作) ")
        self.scene_nb.add(tab_pos_list, text=f" 💃 全体位生成器 ({len(ALL_POSITIONS_CHAPTERS)} 体位 · 独立运作) ")
        self.scene_nb.bind("<<NotebookTabChanged>>", self._on_scene_notebook_changed)

        hdr = ttk.Frame(tab_story_list, style="Card.TFrame")
        hdr.pack(fill=tk.X, pady=(0, 6))
        ttk.Label(
            hdr, text="📌 故事线 12 幕章节列表（点击任意幕在下方精细预览 · 右上角切换第一 / 第三人称）", style="SubHeader.TLabel"
        ).pack(side=tk.LEFT)

        ttk.Button(hdr, text="全不选", style="Secondary.TButton", command=lambda: self._batch_toggle(None)).pack(
            side=tk.RIGHT, padx=2
        )
        ttk.Button(hdr, text="仅双人互动幕", style="Secondary.TButton", command=lambda: self._batch_toggle("Duo")).pack(
            side=tk.RIGHT, padx=2
        )
        ttk.Button(hdr, text="仅单人幕", style="Secondary.TButton", command=lambda: self._batch_toggle("Solo")).pack(
            side=tk.RIGHT, padx=2
        )
        ttk.Button(hdr, text="全选 12 幕", style="Secondary.TButton", command=lambda: self._batch_toggle("ALL")).pack(
            side=tk.RIGHT, padx=2
        )

        # 多格分镜幕 (S03/S04) 快捷出图模式切换栏（与左侧「🎨 画风局部」双向同步）
        mp_bar = ttk.Frame(tab_story_list, style="Card.TFrame")
        mp_bar.pack(fill=tk.X, pady=(0, 6))
        ttk.Label(
            mp_bar,
            text="🎞️ 多图分镜幕 (S03 / S04) 出图模式：",
            style="SubHeader.TLabel",
        ).pack(side=tk.LEFT)
        cb_mp_quick = ttk.Combobox(
            mp_bar,
            textvariable=self.var_multi_panel_label,
            values=list(MULTI_PANEL_MODE_PRESETS.keys()),
            state="readonly",
            width=36,
        )
        cb_mp_quick.pack(side=tk.LEFT, padx=(6, 10))
        cb_mp_quick.bind("<<ComboboxSelected>>", lambda _e: self.refresh_output())
        ttk.Label(
            mp_bar,
            text="（可一键将双格漫画拆成独立全幅单图，彻底避免分格失败或画幅减半）",
            style="Hint.TLabel",
        ).pack(side=tk.LEFT)

        # === 一键连出 12 幕 & 0号幕 (S00) Seed 锁定控制栏 ===
        batch_gen_bar = tk.Frame(
            tab_story_list, bg=BG_INPUT, highlightbackground=BORDER, highlightthickness=1, padx=8, pady=5
        )
        batch_gen_bar.pack(fill=tk.X, pady=(0, 6))

        tk.Checkbutton(
            batch_gen_bar,
            text="🔗 连出时使用 0号幕 (S00) 的 Seed",
            variable=self.var_api_use_s00_seed,
            bg=BG_INPUT,
            fg=ACCENT,
            selectcolor=BG_PANEL,
            activebackground=BG_INPUT,
            activeforeground=ACCENT,
            font=("Microsoft YaHei UI", 9, "bold"),
            cursor="hand2",
            command=self._on_toggle_s00_seed,
        ).pack(side=tk.LEFT)

        tk.Label(
            batch_gen_bar,
            textvariable=self.var_s00_seed_badge,
            bg=BG_INPUT,
            fg=FG_MUTED,
            font=("Microsoft YaHei UI", 8),
        ).pack(side=tk.LEFT, padx=(6, 0))

        self.btn_stop_batch_right = ttk.Button(
            batch_gen_bar,
            text="⏹ 停止连出",
            style="Secondary.TButton",
            command=self.on_request_cancel_any_batch,
            state="disabled",
        )
        self.btn_stop_batch_right.pack(side=tk.RIGHT, padx=(6, 0))

        self.btn_batch_checked_right = ttk.Button(
            batch_gen_bar,
            text="🎯 连出已勾选幕",
            style="Action.TButton",
            command=lambda: self.on_batch_generate_scenes(force_all_12=False),
        )
        self.btn_batch_checked_right.pack(side=tk.RIGHT, padx=(6, 0))

        self.btn_batch_all12_right = ttk.Button(
            batch_gen_bar,
            text="🚀 一键出全套 12 幕",
            style="Generate.TButton",
            command=lambda: self.on_batch_generate_scenes(force_all_12=True),
        )
        self.btn_batch_all12_right.pack(side=tk.RIGHT)

        grid_box = ttk.Frame(tab_story_list, style="Card.TFrame")
        grid_box.pack(fill=tk.X)
        grid_box.columnconfigure(0, weight=1)
        grid_box.columnconfigure(1, weight=1)

        self.scene_btn_refs: Dict[str, tk.Button] = {}
        self.copy_btn_refs: Dict[str, tk.Button] = {}
        rows_per_col = (len(STORY_CHAPTERS) + 1) // 2
        for idx, ch in enumerate(STORY_CHAPTERS):
            sid = ch["id"]
            row_f = ttk.Frame(grid_box, style="Card.TFrame")
            row_f.grid(row=idx % rows_per_col, column=idx // rows_per_col, sticky="ew", padx=4, pady=2)

            ttk.Checkbutton(
                row_f, text="", variable=self.scene_vars[sid], command=self.refresh_output
            ).pack(side=tk.LEFT)

            btn_sel = tk.Button(
                row_f,
                text=ch["title"],
                anchor="w",
                bg=BORDER if sid == self.active_scene_id else BG_INPUT,
                fg=ACCENT if sid == self.active_scene_id else FG_TEXT,
                activebackground=BORDER,
                activeforeground=ACCENT,
                relief=tk.FLAT,
                padx=6,
                pady=2,
                cursor="hand2",
                font=("Microsoft YaHei UI", 9),
                command=lambda s=sid: self.select_single_scene(s),
            )
            btn_sel.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(2, 4))
            self.scene_btn_refs[sid] = btn_sel

            btn_gen_row = tk.Button(
                row_f,
                text="🎨生成",
                bg=BORDER,
                fg=SUCCESS,
                activebackground=SUCCESS,
                activeforeground="#11111b",
                relief=tk.FLAT,
                padx=5,
                pady=1,
                cursor="hand2",
                font=("Microsoft YaHei UI", 8, "bold"),
                command=lambda s=sid: self.on_quick_generate_scene(s),
            )
            btn_gen_row.pack(side=tk.RIGHT, padx=(3, 0))
            self.gen_btn_refs[sid] = btn_gen_row

            btn_cp = tk.Button(
                row_f,
                text="复制[第一]",
                bg=BORDER,
                fg=ACCENT_POV,
                activebackground=ACCENT_POV,
                activeforeground="#11111b",
                relief=tk.FLAT,
                padx=6,
                pady=1,
                cursor="hand2",
                font=("Microsoft YaHei UI", 8, "bold"),
                command=lambda s=sid: self.copy_single_scene(s),
            )
            btn_cp.pack(side=tk.RIGHT)
            self.copy_btn_refs[sid] = btn_cp

        # === 第二分页：多角度套图（9 镜头，独立运作不与故事线混跑） ===
        ma_hdr = ttk.Frame(tab_ma_list, style="Card.TFrame")
        ma_hdr.pack(fill=tk.X, pady=(0, 6))
        ttk.Label(
            ma_hdr,
            text="📷 多角度套图 9 镜头（共享左侧角色/服装/画风配置，与故事线分开独立出图）",
            style="SubHeader.TLabel",
        ).pack(side=tk.LEFT)
        ttk.Button(ma_hdr, text="全不选", style="Secondary.TButton", command=lambda: self._batch_toggle_ma(False)).pack(
            side=tk.RIGHT, padx=2
        )
        ttk.Button(ma_hdr, text="全选 9 镜头", style="Secondary.TButton", command=lambda: self._batch_toggle_ma(True)).pack(
            side=tk.RIGHT, padx=2
        )

        ma_bar = tk.Frame(tab_ma_list, bg=BG_INPUT, highlightbackground=BORDER, highlightthickness=1, padx=8, pady=5)
        ma_bar.pack(fill=tk.X, pady=(0, 6))
        tk.Checkbutton(
            ma_bar,
            text="🔞 开启多镜头 NSFW 类词条（关闭=纯SFW过滤）",
            variable=self.var_ma_nsfw,
            bg=BG_INPUT,
            fg=ACCENT,
            selectcolor=BG_PANEL,
            activebackground=BG_INPUT,
            activeforeground=ACCENT,
            font=("Microsoft YaHei UI", 9, "bold"),
            cursor="hand2",
            command=self.refresh_output,
        ).pack(side=tk.LEFT)

        self.btn_stop_ma_right = ttk.Button(
            ma_bar,
            text="⏹ 停止连出",
            style="Secondary.TButton",
            command=self.on_request_cancel_any_batch,
            state="disabled",
        )
        self.btn_stop_ma_right.pack(side=tk.RIGHT, padx=(6, 0))

        self.btn_batch_ma_checked = ttk.Button(
            ma_bar,
            text="🎯 连出已勾选镜头",
            style="Action.TButton",
            command=lambda: self.on_batch_generate_scenes(force_all_12=False, suite_kind="multi_angle"),
        )
        self.btn_batch_ma_checked.pack(side=tk.RIGHT, padx=(6, 0))

        self.btn_batch_ma_all = ttk.Button(
            ma_bar,
            text="🚀 一键出全套 9 镜头",
            style="Generate.TButton",
            command=lambda: self.on_batch_generate_scenes(force_all_12=True, suite_kind="multi_angle"),
        )
        self.btn_batch_ma_all.pack(side=tk.RIGHT)

        ma_grid = ttk.Frame(tab_ma_list, style="Card.TFrame")
        ma_grid.pack(fill=tk.X)
        ma_grid.columnconfigure(0, weight=1)
        ma_grid.columnconfigure(1, weight=1)
        ma_rows_per_col = (len(MULTI_ANGLE_CHAPTERS) + 1) // 2
        for idx, ch in enumerate(MULTI_ANGLE_CHAPTERS):
            sid = ch["id"]
            row_f = ttk.Frame(ma_grid, style="Card.TFrame")
            row_f.grid(row=idx % ma_rows_per_col, column=idx // ma_rows_per_col, sticky="ew", padx=4, pady=2)

            ttk.Checkbutton(
                row_f, text="", variable=self.multi_angle_vars[sid], command=self.refresh_output
            ).pack(side=tk.LEFT)

            btn_sel = tk.Button(
                row_f,
                text=ch["title"],
                anchor="w",
                bg=BORDER if sid == self.active_scene_id else BG_INPUT,
                fg=ACCENT if sid == self.active_scene_id else FG_TEXT,
                activebackground=BORDER,
                activeforeground=ACCENT,
                relief=tk.FLAT,
                padx=6,
                pady=2,
                cursor="hand2",
                font=("Microsoft YaHei UI", 9),
                command=lambda s=sid: self.select_single_scene(s),
            )
            btn_sel.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(2, 4))
            self.scene_btn_refs[sid] = btn_sel

            btn_gen_row = tk.Button(
                row_f,
                text="🎨生成",
                bg=BORDER,
                fg=SUCCESS,
                activebackground=SUCCESS,
                activeforeground="#11111b",
                relief=tk.FLAT,
                padx=5,
                pady=1,
                cursor="hand2",
                font=("Microsoft YaHei UI", 8, "bold"),
                command=lambda s=sid: self.on_quick_generate_scene(s),
            )
            btn_gen_row.pack(side=tk.RIGHT, padx=(3, 0))
            self.gen_btn_refs[sid] = btn_gen_row

            btn_cp = tk.Button(
                row_f,
                text="复制提示词",
                bg=BORDER,
                fg=ACCENT_POV,
                activebackground=ACCENT_POV,
                activeforeground="#11111b",
                relief=tk.FLAT,
                padx=6,
                pady=1,
                cursor="hand2",
                font=("Microsoft YaHei UI", 8, "bold"),
                command=lambda s=sid: self.copy_single_scene(s),
            )
            btn_cp.pack(side=tk.RIGHT)
            self.copy_btn_refs[sid] = btn_cp

        # === 第三分页：全体位生成器（44+ 体位 · 支持透明背景 / 男方四态开关 / 器官状态保持） ===
        pos_hdr = ttk.Frame(tab_pos_list, style="Card.TFrame")
        pos_hdr.pack(fill=tk.X, pady=(0, 5))
        ttk.Label(pos_hdr, text="💃 姿态分类筛选：", style="SubHeader.TLabel").pack(side=tk.LEFT)
        cb_pos_cat = ttk.Combobox(
            pos_hdr,
            textvariable=self.var_pos_category,
            values=POS_CATEGORIES,
            state="readonly",
            width=22,
        )
        cb_pos_cat.pack(side=tk.LEFT, padx=(4, 10))
        cb_pos_cat.bind("<<ComboboxSelected>>", lambda _e: self._rebuild_pos_grid())

        ttk.Button(
            pos_hdr, text="全不选", style="Secondary.TButton", command=lambda: self._batch_toggle_pos("none")
        ).pack(side=tk.RIGHT, padx=2)
        ttk.Button(
            pos_hdr, text="仅勾选本类", style="Secondary.TButton", command=lambda: self._batch_toggle_pos("cat")
        ).pack(side=tk.RIGHT, padx=2)
        ttk.Button(
            pos_hdr,
            text=f"全选 {len(ALL_POSITIONS_CHAPTERS)} 项",
            style="Secondary.TButton",
            command=lambda: self._batch_toggle_pos("all"),
        ).pack(side=tk.RIGHT, padx=2)

        pos_bar = tk.Frame(tab_pos_list, bg=BG_INPUT, highlightbackground=BORDER, highlightthickness=1, padx=8, pady=5)
        pos_bar.pack(fill=tk.X, pady=(0, 6))

        tk.Checkbutton(
            pos_bar,
            text="🪟 透明背景 (V5 Alpha)",
            variable=self.var_pos_transparent_bg,
            bg=BG_INPUT,
            fg=ACCENT_POV,
            selectcolor=BG_PANEL,
            activebackground=BG_INPUT,
            activeforeground=ACCENT_POV,
            font=("Microsoft YaHei UI", 9, "bold"),
            cursor="hand2",
            command=self.refresh_output,
        ).pack(side=tk.LEFT, padx=(0, 8))

        tk.Label(
            pos_bar,
            text="男方：",
            bg=BG_INPUT,
            fg=FG_MUTED,
            font=("Microsoft YaHei UI", 9, "bold"),
        ).pack(side=tk.LEFT)

        cb_pos_male = ttk.Combobox(
            pos_bar,
            textvariable=self.var_pos_male_mode,
            values=list(POS_MALE_MODE_PRESETS.keys()),
            state="readonly",
            width=26,
        )
        cb_pos_male.pack(side=tk.LEFT, padx=(2, 8))
        cb_pos_male.bind("<<ComboboxSelected>>", lambda _e: self.refresh_output())

        tk.Checkbutton(
            pos_bar,
            text="显示阴茎（关闭时保持私处/使用器官互动状态）",
            variable=self.var_pos_show_penis,
            bg=BG_INPUT,
            fg=ACCENT,
            selectcolor=BG_PANEL,
            activebackground=BG_INPUT,
            activeforeground=ACCENT,
            font=("Microsoft YaHei UI", 9, "bold"),
            cursor="hand2",
            command=self.refresh_output,
        ).pack(side=tk.LEFT, padx=(0, 8))

        tk.Label(
            pos_bar,
            text="阶段：",
            bg=BG_INPUT,
            fg=FG_MUTED,
            font=("Microsoft YaHei UI", 9, "bold"),
        ).pack(side=tk.LEFT)

        cb_pos_stage = ttk.Combobox(
            pos_bar,
            textvariable=self.var_pos_stage,
            values=list(POS_STAGE_PRESETS.keys()),
            state="readonly",
            width=26,
        )
        cb_pos_stage.pack(side=tk.LEFT, padx=(2, 8))
        cb_pos_stage.bind("<<ComboboxSelected>>", lambda _e: self.refresh_output())

        self.btn_stop_pos_right = ttk.Button(
            pos_bar,
            text="⏹ 停止",
            style="Secondary.TButton",
            command=self.on_request_cancel_any_batch,
            state="disabled",
        )
        self.btn_stop_pos_right.pack(side=tk.RIGHT, padx=(4, 0))

        self.btn_batch_pos_checked = ttk.Button(
            pos_bar,
            text="🎯 连出已勾选",
            style="Action.TButton",
            command=lambda: self.on_batch_generate_scenes(force_all_12=False, suite_kind="all_positions"),
        )
        self.btn_batch_pos_checked.pack(side=tk.RIGHT, padx=(4, 0))

        self.btn_batch_pos_cat = ttk.Button(
            pos_bar,
            text="🚀 出当前分类",
            style="Generate.TButton",
            command=lambda: self.on_batch_generate_scenes(force_all_12=True, suite_kind="all_positions"),
        )
        self.btn_batch_pos_cat.pack(side=tk.RIGHT)

        pos_scroll_wrap = ttk.Frame(tab_pos_list, style="Card.TFrame")
        pos_scroll_wrap.pack(fill=tk.X)

        self.pos_canvas = tk.Canvas(
            pos_scroll_wrap,
            bg=BG_PANEL,
            highlightthickness=0,
            bd=0,
            height=192,
        )
        pos_vscroll = ttk.Scrollbar(pos_scroll_wrap, orient=tk.VERTICAL, command=self.pos_canvas.yview)
        self.pos_grid_inner = ttk.Frame(self.pos_canvas, style="Card.TFrame")
        self._pos_canvas_win = self.pos_canvas.create_window((0, 0), window=self.pos_grid_inner, anchor="nw")
        self.pos_canvas.configure(yscrollcommand=pos_vscroll.set)
        self.pos_canvas.pack(side=tk.LEFT, fill=tk.X, expand=True)
        pos_vscroll.pack(side=tk.RIGHT, fill=tk.Y)

        self.pos_grid_inner.bind(
            "<Configure>",
            lambda _e: self.pos_canvas.configure(scrollregion=self.pos_canvas.bbox("all")),
        )
        self.pos_canvas.bind(
            "<Configure>",
            lambda e: self.pos_canvas.itemconfigure(self._pos_canvas_win, width=e.width),
        )
        self._bind_pos_mousewheel(self.pos_canvas)
        self._rebuild_pos_grid(trigger_refresh=False)

        out_nb = ttk.Notebook(parent)
        out_nb.pack(fill=tk.BOTH, expand=True)

        tab_single = ttk.Frame(out_nb, style="Card.TFrame", padding=10)
        tab_preview_img = ttk.Frame(out_nb, style="Card.TFrame", padding=10)
        tab_full_pov = ttk.Frame(out_nb, style="Card.TFrame", padding=10)
        tab_full_3rd = ttk.Frame(out_nb, style="Card.TFrame", padding=10)

        out_nb.add(tab_single, text=" 🎯 单幕精细预览 ")
        out_nb.add(tab_preview_img, text=" 🖼️ 最新出图预览 (V5 Medium) ")
        out_nb.add(tab_full_pov, text=" 👁️ 第一人称 (POV) 整套总览 ")
        out_nb.add(tab_full_3rd, text=" 🎥 第三人称 (客观机位) 整套总览 ")
        self.out_nb = out_nb
        self.out_nb.select(0)

        # === Tab 0: 单幕精细预览 ===
        single_bar = ttk.Frame(tab_single, style="Card.TFrame")
        single_bar.pack(fill=tk.X, pady=(0, 6))

        self.lbl_single_badge = tk.Label(
            single_bar,
            text="👁️ 第一人称视角",
            bg=ACCENT_POV,
            fg="#11111b",
            padx=8,
            pady=2,
            font=("Microsoft YaHei UI", 9, "bold"),
        )
        self.lbl_single_badge.pack(side=tk.LEFT, padx=(0, 8))

        self.lbl_single_info = ttk.Label(single_bar, text="", style="SubHeader.TLabel")
        self.lbl_single_info.pack(side=tk.LEFT)

        self.lbl_token_badge = tk.Label(
            single_bar,
            text="T5: --/512",
            bg=BORDER,
            fg=SUCCESS,
            padx=7,
            pady=2,
            font=("Consolas", 9, "bold"),
        )
        self.lbl_token_badge.pack(side=tk.LEFT, padx=(8, 0))

        self.btn_single_generate = ttk.Button(
            single_bar,
            text="🎨 生成当前单幕 (V5 Medium · 1张)",
            style="Generate.TButton",
            command=self.on_generate_current_preview,
        )
        self.btn_single_generate.pack(side=tk.RIGHT, padx=(6, 0))

        ttk.Button(
            single_bar,
            text="📋 复制单幕 Prompt",
            style="Accent.TButton",
            command=lambda: self.copy_single_scene(self.active_scene_id, use_selected_block=True),
        ).pack(side=tk.RIGHT)

        self.cb_block_select = ttk.Combobox(
            single_bar,
            textvariable=self.var_active_block_choice,
            values=["第 1 张"],
            state="disabled",
            width=26,
        )
        self.cb_block_select.pack(side=tk.RIGHT, padx=(8, 8))
        self.cb_block_select.bind("<<ComboboxSelected>>", self._on_block_selection_changed)

        self.txt_single = self._make_textbox(tab_single)
        self.txt_single.bind("<KeyRelease>", lambda _e: self._update_token_badge_from_editor())

        # === Tab 1: 最新出图预览 ===
        self._build_image_preview_tab(tab_preview_img)

        # === Tab 1: 纯第一人称整套总览 ===
        pov_bar = ttk.Frame(tab_full_pov, style="Card.TFrame")
        pov_bar.pack(fill=tk.X, pady=(0, 6))
        ttk.Checkbutton(
            pov_bar,
            text="纯跑图队列行模式（每行一条直出 Prompt）",
            variable=self.var_pure_batch,
            command=self.refresh_output,
        ).pack(side=tk.LEFT)
        ttk.Checkbutton(
            pov_bar,
            text="导出 .txt 时上下分卷同时保存第一与第三人称两套",
            variable=self.var_export_both,
        ).pack(side=tk.LEFT, padx=(16, 0))
        ttk.Button(
            pov_bar,
            text="📋 复制全部【第一人称】整套",
            style="Action.TButton",
            command=lambda: self._copy_specific_suite("pov"),
        ).pack(side=tk.RIGHT)

        self.txt_full_pov = self._make_textbox(tab_full_pov)

        # === Tab 2: 纯第三人称整套总览 ===
        trd_bar = ttk.Frame(tab_full_3rd, style="Card.TFrame")
        trd_bar.pack(fill=tk.X, pady=(0, 6))
        ttk.Checkbutton(
            trd_bar,
            text="纯跑图队列行模式（每行一条直出 Prompt）",
            variable=self.var_pure_batch,
            command=self.refresh_output,
        ).pack(side=tk.LEFT)
        ttk.Checkbutton(
            trd_bar,
            text="导出 .txt 时上下分卷同时保存第一与第三人称两套",
            variable=self.var_export_both,
        ).pack(side=tk.LEFT, padx=(16, 0))
        ttk.Button(
            trd_bar,
            text="📋 复制全部【第三人称】整套",
            style="Accent.TButton",
            command=lambda: self._copy_specific_suite("3rd"),
        ).pack(side=tk.RIGHT)

        self.txt_full_3rd = self._make_textbox(tab_full_3rd)

    def _make_textbox(self, parent: ttk.Frame) -> tk.Text:
        wrap_f = ttk.Frame(parent, style="Card.TFrame")
        wrap_f.pack(fill=tk.BOTH, expand=True)

        scroll = ttk.Scrollbar(wrap_f, orient=tk.VERTICAL)
        scroll.pack(side=tk.RIGHT, fill=tk.Y)

        txt = tk.Text(
            wrap_f,
            bg=BG_INPUT,
            fg=FG_TEXT,
            insertbackground=ACCENT,
            selectbackground=ACCENT,
            selectforeground="#11111b",
            relief=tk.FLAT,
            wrap=tk.WORD,
            padx=12,
            pady=10,
            font=("Consolas", 10),
            yscrollcommand=scroll.set,
        )
        txt.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scroll.config(command=txt.yview)
        return txt

    # ------------------------------------------------------------------
    # 精密参照快捷预设切换与状态管理
    # ------------------------------------------------------------------
    def apply_module_switch_preset(self, preset_key: str) -> None:
        flags = MODULE_SWITCH_PRESETS.get(preset_key, {})
        for k, val in flags.items():
            if k in self.module_vars:
                self.module_vars[k].set(val)
        self.refresh_output()
        self.var_status.set(f"🎛️ 已应用模块开关预设：{preset_key}")

    def set_perspective_mode(self, mode: str) -> None:
        self.var_perspective.set(mode)
        self._update_perspective_buttons_visual()
        self.refresh_output()
        label = "👁️ 第一人称视角 (POV)" if mode == "pov" else "🎥 第三人称视角 (客观机位)"
        self.var_status.set(f"🔄 已切换单幕精细预览与快捷复制模式为：{label}")

    def _update_perspective_buttons_visual(self) -> None:
        is_pov = self.var_perspective.get() == "pov"
        if is_pov:
            self.btn_mode_pov.config(bg=ACCENT_POV, fg="#11111b")
            self.btn_mode_3rd.config(bg=BORDER, fg=FG_MUTED)
            self.lbl_single_badge.config(text="👁️ 当前预览：第一人称 (POV)", bg=ACCENT_POV, fg="#11111b")
            for btn in self.copy_btn_refs.values():
                btn.config(text="复制[第一]", fg=ACCENT_POV)
        else:
            self.btn_mode_pov.config(bg=BORDER, fg=FG_MUTED)
            self.btn_mode_3rd.config(bg=ACCENT_3RD, fg="#11111b")
            self.lbl_single_badge.config(text="🎥 当前预览：第三人称 (客观机位)", bg=ACCENT_3RD, fg="#11111b")
            for btn in self.copy_btn_refs.values():
                btn.config(text="复制[第三]", fg=ACCENT_3RD)

    def _collect_config(self) -> CharacterConfig:
        return CharacterConfig(
            preset_name=self.var_preset.get(),
            char_tag=self.var_char_tag.get(),
            eng_name=self.var_eng_name.get(),
            eye_color=self.var_eye_color.get(),
            hair_tags=self.var_hair_tags.get(),
            canon_neg_tags=self.var_canon_neg.get(),
            extra_char_tags=self.var_extra_char.get(),
            body_preset=self.var_body.get(),
            bust_preset=self.var_bust.get(),
            skin_preset=self.var_skin.get(),
            outfit_preset=self.var_outfit.get(),
            outfit_state_mode=self.var_outfit_state.get(),
            custom_outfit_tags=self.var_custom_outfit.get(),
            keep_canon_elements=self.var_keep_canon.get(),
            legwear_preset=self.var_legwear.get(),
            add_cat_ears=self.var_cat_ears.get(),
            add_horns_tail=self.var_horns.get(),
            add_glasses=self.var_glasses.get(),
            add_choker=self.var_choker.get(),
            add_extra_sweat=self.var_extra_sweat.get(),
            style_preset=self.var_style.get(),
            custom_style_pos=self.var_custom_style_pos.get(),
            custom_style_neg=self.var_custom_style_neg.get(),
            morph_preset=self.var_morph.get(),
            pubic_preset=self.var_pubic.get(),
            pigment_preset=self.var_pigment.get(),
            fluid_scale=round(self.var_fluid_scale.get(), 2),
            perspective_mode=self.var_perspective.get(),
            include_sub_variants=self.var_sub_variants.get(),
            multi_panel_mode=MULTI_PANEL_MODE_PRESETS.get(self.var_multi_panel_label.get(), "2koma"),
            enable_quality=self.module_vars["enable_quality"].get(),
            enable_style=self.module_vars["enable_style"].get(),
            enable_identity=self.module_vars["enable_identity"].get(),
            enable_body=self.module_vars["enable_body"].get(),
            enable_outfit=self.module_vars["enable_outfit"].get(),
            enable_clothing_state=self.module_vars["enable_clothing_state"].get(),
            enable_legwear=self.module_vars["enable_legwear"].get(),
            enable_background=self.module_vars["enable_background"].get(),
            enable_expression=self.module_vars["enable_expression"].get(),
            enable_anatomy=self.module_vars["enable_anatomy"].get(),
            enable_action_fluids=self.module_vars["enable_action_fluids"].get(),
            enable_remnants=self.module_vars["enable_remnants"].get(),
            enable_t5_prose=self.module_vars["enable_t5_prose"].get(),
            enable_negatives=self.module_vars["enable_negatives"].get(),
            enable_multi_angle_nsfw=self.var_ma_nsfw.get(),
            pos_transparent_bg=self.var_pos_transparent_bg.get(),
            pos_male_mode=self.var_pos_male_mode.get(),
            pos_show_penis=self.var_pos_show_penis.get(),
            pos_stage=self.var_pos_stage.get(),
            cam_enable_override=self.var_cam_override.get(),
            cam_azimuth=int(self.var_cam_azimuth.get()),
            cam_elevation=int(self.var_cam_elevation.get()),
            cam_shot_preset=self.var_cam_shot.get(),
            cam_wide_lens=self.var_cam_wide.get(),
            cam_dutch_angle=self.var_cam_dutch.get(),
            cam_gaze_preset=self.var_cam_gaze.get(),
        )

    def _on_preset_selected(self, _event=None) -> None:
        self._load_preset_by_name(self.var_preset.get(), trigger_refresh=True)

    def _load_preset_by_name(self, name: str, trigger_refresh: bool = True) -> None:
        custom = load_custom_presets()
        if name in custom:
            data = custom[name]
            self.var_char_tag.set(data.get("char_tag", ""))
            self.var_eng_name.set(data.get("eng_name", "the girl"))
            self.var_eye_color.set(data.get("eye_color", ""))
            self.var_hair_tags.set(data.get("hair_tags", ""))
            self.var_canon_neg.set(data.get("canon_neg_tags", ""))
            self.var_extra_char.set(data.get("extra_char_tags", ""))
            if data.get("body_preset") in BODY_PRESETS:
                self.var_body.set(data["body_preset"])
            if data.get("bust_preset") in BUST_PRESETS:
                self.var_bust.set(data["bust_preset"])
            if data.get("skin_preset") in SKIN_PRESETS:
                self.var_skin.set(data["skin_preset"])
            if data.get("outfit_preset") in OUTFIT_PRESETS:
                self.var_outfit.set(data["outfit_preset"])
            if data.get("outfit_state_mode") in OUTFIT_STATE_PRESETS:
                self.var_outfit_state.set(data["outfit_state_mode"])
            else:
                self.var_outfit_state.set("🔄 智能适配穿脱（原设/裙装自动撩裙拨内裤 · 单件上衣自动真空）")
            self.var_custom_outfit.set(data.get("custom_outfit_tags", ""))
            self.var_keep_canon.set(bool(data.get("keep_canon_elements", False)))
            if data.get("legwear_preset") in LEGWEAR_PRESETS:
                self.var_legwear.set(data["legwear_preset"])
            if data.get("style_preset") in STYLE_PRESETS:
                self.var_style.set(data["style_preset"])
            if "custom_style_pos" in data:
                self.var_custom_style_pos.set(data.get("custom_style_pos", ""))
            if "custom_style_neg" in data:
                self.var_custom_style_neg.set(data.get("custom_style_neg", ""))
            saved_mp = data.get("multi_panel_mode")
            if saved_mp:
                for lbl, code in MULTI_PANEL_MODE_PRESETS.items():
                    if code == saved_mp:
                        self.var_multi_panel_label.set(lbl)
                        break
            self.var_cat_ears.set(bool(data.get("add_cat_ears", False)))
            self.var_ma_nsfw.set(bool(data.get("enable_multi_angle_nsfw", False)))
            if "pos_transparent_bg" in data:
                self.var_pos_transparent_bg.set(bool(data.get("pos_transparent_bg", False)))
            if data.get("pos_male_mode") in POS_MALE_MODE_PRESETS:
                self.var_pos_male_mode.set(data["pos_male_mode"])
            if "pos_show_penis" in data:
                self.var_pos_show_penis.set(bool(data.get("pos_show_penis", True)))
            if data.get("pos_stage") in POS_STAGE_PRESETS:
                self.var_pos_stage.set(data["pos_stage"])
            if "cam_enable_override" in data:
                self.var_cam_override.set(bool(data.get("cam_enable_override", False)))
            if "cam_azimuth" in data:
                self.var_cam_azimuth.set(int(data.get("cam_azimuth", 0)))
            if "cam_elevation" in data:
                self.var_cam_elevation.set(int(data.get("cam_elevation", 12)))
            if data.get("cam_shot_preset") in CAMERA_SHOT_PRESETS:
                self.var_cam_shot.set(data["cam_shot_preset"])
            if "cam_wide_lens" in data:
                self.var_cam_wide.set(bool(data.get("cam_wide_lens", False)))
            if "cam_dutch_angle" in data:
                self.var_cam_dutch.set(bool(data.get("cam_dutch_angle", False)))
            if data.get("cam_gaze_preset") in CAMERA_GAZE_PRESETS:
                self.var_cam_gaze.set(data["cam_gaze_preset"])
            self._redraw_camera_radar()
            self.var_horns.set(bool(data.get("add_horns_tail", False)))
            self.var_glasses.set(bool(data.get("add_glasses", False)))
            self.var_choker.set(bool(data.get("add_choker", False)))
            self.var_extra_sweat.set(bool(data.get("add_extra_sweat", False)))
            for k, bvar in self.module_vars.items():
                if k in data:
                    bvar.set(bool(data[k]))
        elif name in BUILTIN_CHARACTERS:
            info = BUILTIN_CHARACTERS[name]
            self.var_char_tag.set(info["char_tag"])
            self.var_eng_name.set(info["eng_name"])
            self.var_eye_color.set(info["eye_color"])
            self.var_hair_tags.set(info["hair_tags"])
            self.var_canon_neg.set(info["canon_neg_tags"])
            self.var_extra_char.set("")
            self.var_body.set(info["body_preset"])
            self.var_bust.set(info["bust_preset"])

        if trigger_refresh:
            self.refresh_output()
            self.var_status.set(f"✅ 已切换角色预设：{name}")

    def on_save_preset(self) -> None:
        name = simpledialog.askstring(
            "保存自定义预设",
            "请输入新预设名称（同时保存角色参数与当前的模块开关状态）：",
            parent=self.root,
        )
        if not name or not name.strip():
            return
        clean_name = f"⭐ {name.strip()}" if not name.strip().startswith("⭐") else name.strip()
        cfg = self._collect_config()
        save_custom_preset(clean_name, cfg)
        self.cb_preset["values"] = self._get_all_preset_names()
        self.var_preset.set(clean_name)
        self.var_status.set(f"💾 已保存自定义预设「{clean_name}」至本地 character_presets.json")

    def on_delete_preset(self) -> None:
        cur = self.var_preset.get()
        if cur in BUILTIN_CHARACTERS:
            messagebox.showinfo("内置预设保护", "内置角色预设不可删除；您可以删除自己保存的「⭐」自定义预设。")
            return
        if messagebox.askyesno("确认删除", f"确定要删除自定义预设「{cur}」吗？"):
            if delete_custom_preset(cur):
                names = self._get_all_preset_names()
                self.cb_preset["values"] = names
                self.var_preset.set(names[0])
                self._load_preset_by_name(names[0], trigger_refresh=True)
                self.var_status.set(f"🗑️ 已删除自定义预设「{cur}」")

    def _on_outfit_preset_changed(self, _event=None) -> None:
        outfit_name = self.var_outfit.get()
        cur_leg = self.var_legwear.get()
        if "角色标签原设默认服装" in outfit_name and cur_leg == "赤足裸腿（barefoot 默认）":
            self.var_legwear.set("🌟 随角色原设鞋袜 / 不强制赤足")
        elif "宽松滑肩白T恤" in outfit_name and cur_leg == "🌟 随角色原设鞋袜 / 不强制赤足":
            self.var_legwear.set("赤足裸腿（barefoot 默认）")
        self.refresh_output()

    def _on_style_preset_changed(self, _event=None) -> None:
        style_name = self.var_style.get()
        if any(k in style_name for k in ("M6", "无描边暖杏真肤", "无界油画")):
            is_tune2 = "M6-Tune2" in style_name
            target_rescale = 0.0 if is_tune2 else 0.25
            self.var_api_scale.set(4.8)
            self.var_api_rescale.set(target_rescale)
            if hasattr(self, "lbl_api_scale"):
                self.lbl_api_scale.config(text="Prompt Guidance (相关性 Scale)：4.8")
            self.refresh_output()
            tag_label = "M6-Tune2 无界油画" if is_tune2 else "M6 保留款"
            self.var_status.set(
                f"🌤️ 已切换至 {tag_label} 预设（已自动同步最佳低反差生图参数 Scale=4.8, Rescale={target_rescale}）"
            )
        else:
            if round(float(self.var_api_scale.get()), 1) == 4.8 and round(float(self.var_api_rescale.get()), 2) in (0.0, 0.25):
                self.var_api_scale.set(6.0)
                self.var_api_rescale.set(0.0)
                if hasattr(self, "lbl_api_scale"):
                    self.lbl_api_scale.config(text="Prompt Guidance (相关性 Scale)：6.0")
            self.refresh_output()

    def _on_fluid_slider(self, val_str: str) -> None:
        val = float(val_str)
        desc = "清爽克制" if val < 0.9 else ("标准定稿" if val <= 1.08 else "浓稠增量强化")
        self.lbl_fluid.config(text=f"全局液体与残留痕迹权重倍率：{val:.2f}x（{desc}）")
        self.refresh_output()

    def _is_multi_angle_tab_active(self) -> bool:
        return hasattr(self, "scene_nb") and self.scene_nb.index(self.scene_nb.select()) == 1

    def _is_all_positions_tab_active(self) -> bool:
        return hasattr(self, "scene_nb") and self.scene_nb.index(self.scene_nb.select()) == 2

    def _on_scene_notebook_changed(self, _event=None) -> None:
        if self._is_all_positions_tab_active():
            valid_ids = {c["id"] for c in ALL_POSITIONS_CHAPTERS}
            if self.active_scene_id not in valid_ids:
                vis = self._get_filtered_pos_chapters()
                self.active_scene_id = vis[0]["id"] if vis else ALL_POSITIONS_CHAPTERS[0]["id"]
        elif self._is_multi_angle_tab_active():
            valid_ids = {c["id"] for c in MULTI_ANGLE_CHAPTERS}
            if self.active_scene_id not in valid_ids:
                self.active_scene_id = MULTI_ANGLE_CHAPTERS[0]["id"]
        else:
            valid_ids = {c["id"] for c in STORY_CHAPTERS}
            if self.active_scene_id not in valid_ids:
                self.active_scene_id = STORY_CHAPTERS[0]["id"]
        for sid, btn in list(self.scene_btn_refs.items()):
            if btn.winfo_exists():
                btn.config(
                    bg=BORDER if sid == self.active_scene_id else BG_INPUT,
                    fg=ACCENT if sid == self.active_scene_id else FG_TEXT,
                )
        self.refresh_output()

    def _bind_pos_mousewheel(self, canvas: tk.Canvas) -> None:
        def _on_wheel(event: tk.Event) -> None:
            if self._is_all_positions_tab_active():
                canvas.yview_scroll(int(-1 * (event.delta / 120)), "units")

        canvas.bind("<Enter>", lambda _e: canvas.bind_all("<MouseWheel>", _on_wheel))
        canvas.bind("<Leave>", lambda _e: canvas.unbind_all("<MouseWheel>"))

    def _get_filtered_pos_chapters(self) -> List[Dict[str, str]]:
        cat = self.var_pos_category.get()
        if not cat or cat == POS_CATEGORIES[0]:
            return list(ALL_POSITIONS_CHAPTERS)
        return [ch for ch in ALL_POSITIONS_CHAPTERS if ch.get("category") == cat]

    def _rebuild_pos_grid(self, trigger_refresh: bool = True) -> None:
        if not hasattr(self, "pos_grid_inner"):
            return
        all_pos_ids = {c["id"] for c in ALL_POSITIONS_CHAPTERS}
        for pid in all_pos_ids:
            self.scene_btn_refs.pop(pid, None)
            self.gen_btn_refs.pop(pid, None)
            self.copy_btn_refs.pop(pid, None)
        for child in self.pos_grid_inner.winfo_children():
            child.destroy()

        vis_chapters = self._get_filtered_pos_chapters()
        self.pos_grid_inner.columnconfigure(0, weight=1)
        self.pos_grid_inner.columnconfigure(1, weight=1)
        is_pov = self.var_perspective.get() == "pov"
        cp_txt = "复制[第一]" if is_pov else "复制[第三]"
        cp_fg = ACCENT_POV if is_pov else ACCENT_3RD
        gen_state = "disabled" if self.is_generating else "normal"

        rows_per_col = max(1, (len(vis_chapters) + 1) // 2)
        for idx, ch in enumerate(vis_chapters):
            sid = ch["id"]
            row_f = ttk.Frame(self.pos_grid_inner, style="Card.TFrame")
            row_f.grid(row=idx % rows_per_col, column=idx // rows_per_col, sticky="ew", padx=4, pady=2)

            ttk.Checkbutton(
                row_f, text="", variable=self.all_pos_vars[sid], command=self.refresh_output
            ).pack(side=tk.LEFT)

            btn_sel = tk.Button(
                row_f,
                text=ch["title"],
                anchor="w",
                bg=BORDER if sid == self.active_scene_id else BG_INPUT,
                fg=ACCENT if sid == self.active_scene_id else FG_TEXT,
                activebackground=BORDER,
                activeforeground=ACCENT,
                relief=tk.FLAT,
                padx=6,
                pady=2,
                cursor="hand2",
                font=("Microsoft YaHei UI", 9),
                command=lambda s=sid: self.select_single_scene(s),
            )
            btn_sel.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(2, 4))
            self.scene_btn_refs[sid] = btn_sel

            btn_gen_row = tk.Button(
                row_f,
                text="🎨生成",
                bg=BORDER,
                fg=SUCCESS,
                activebackground=SUCCESS,
                activeforeground="#11111b",
                relief=tk.FLAT,
                padx=5,
                pady=1,
                cursor="hand2",
                font=("Microsoft YaHei UI", 8, "bold"),
                state=gen_state,
                command=lambda s=sid: self.on_quick_generate_scene(s),
            )
            btn_gen_row.pack(side=tk.RIGHT, padx=(3, 0))
            self.gen_btn_refs[sid] = btn_gen_row

            btn_cp = tk.Button(
                row_f,
                text=cp_txt,
                bg=BORDER,
                fg=cp_fg,
                activebackground=cp_fg,
                activeforeground="#11111b",
                relief=tk.FLAT,
                padx=6,
                pady=1,
                cursor="hand2",
                font=("Microsoft YaHei UI", 8, "bold"),
                command=lambda s=sid: self.copy_single_scene(s),
            )
            btn_cp.pack(side=tk.RIGHT)
            self.copy_btn_refs[sid] = btn_cp

        if hasattr(self, "pos_canvas"):
            self.pos_canvas.yview_moveto(0.0)
        if trigger_refresh:
            if self._is_all_positions_tab_active() and vis_chapters:
                vis_ids = {c["id"] for c in vis_chapters}
                if self.active_scene_id not in vis_ids:
                    self.select_single_scene(vis_chapters[0]["id"])
                    return
            self.refresh_output()

    def _batch_toggle_pos(self, mode: str) -> None:
        vis_ids = {c["id"] for c in self._get_filtered_pos_chapters()}
        for ch in ALL_POSITIONS_CHAPTERS:
            sid = ch["id"]
            if mode == "none":
                self.all_pos_vars[sid].set(False)
            elif mode == "all":
                self.all_pos_vars[sid].set(True)
            elif mode == "cat":
                self.all_pos_vars[sid].set(sid in vis_ids)
        self.refresh_output()

    def _batch_toggle_ma(self, select_all: bool) -> None:
        for ch in MULTI_ANGLE_CHAPTERS:
            self.multi_angle_vars[ch["id"]].set(select_all)
        self.refresh_output()

    def _batch_toggle(self, mode: str | None) -> None:
        for ch in STORY_CHAPTERS:
            sid = ch["id"]
            if mode is None:
                self.scene_vars[sid].set(False)
            elif mode == "ALL":
                self.scene_vars[sid].set(True)
            elif mode == "Solo":
                self.scene_vars[sid].set(ch["actor_type"] == "Solo")
            elif mode == "Duo":
                self.scene_vars[sid].set(ch["actor_type"] in ("Duo", "2koma"))
        self.refresh_output()

    def select_single_scene(self, scene_id: str) -> None:
        self.active_scene_id = scene_id
        for sid, btn in self.scene_btn_refs.items():
            btn.config(
                bg=BORDER if sid == scene_id else BG_INPUT,
                fg=ACCENT if sid == scene_id else FG_TEXT,
            )
        self._refresh_single_tab(self._collect_config())
        self.out_nb.select(0)

    def refresh_output(self) -> None:
        self._sync_camera_status_ui()
        cfg = self._collect_config()
        if self._is_all_positions_tab_active():
            selected_ids = [ch["id"] for ch in ALL_POSITIONS_CHAPTERS if self.all_pos_vars[ch["id"]].get()]
        elif self._is_multi_angle_tab_active():
            selected_ids = [ch["id"] for ch in MULTI_ANGLE_CHAPTERS if self.multi_angle_vars[ch["id"]].get()]
        else:
            selected_ids = [ch["id"] for ch in STORY_CHAPTERS if self.scene_vars[ch["id"]].get()]
        pure = self.var_pure_batch.get()

        cfg_pov = self._collect_config()
        cfg_pov.perspective_mode = "pov"
        pov_suite = generate_full_suite(cfg_pov, selected_ids, pure_batch_lines=pure, export_both_separated=False)

        cfg_3rd = self._collect_config()
        cfg_3rd.perspective_mode = "3rd"
        trd_suite = generate_full_suite(cfg_3rd, selected_ids, pure_batch_lines=pure, export_both_separated=False)

        self.txt_full_pov.delete("1.0", tk.END)
        self.txt_full_pov.insert("1.0", pov_suite)

        self.txt_full_3rd.delete("1.0", tk.END)
        self.txt_full_3rd.insert("1.0", trd_suite)

        self._refresh_single_tab(cfg)

    def _get_selected_block_index(self) -> int:
        if not hasattr(self, "cb_block_select"):
            return 0
        idx = self.cb_block_select.current()
        return idx if idx >= 0 else 0

    def _update_token_badge_from_editor(self) -> None:
        if not hasattr(self, "lbl_token_badge") or not hasattr(self, "txt_single"):
            return
        raw_box = self.txt_single.get("1.0", tk.END)
        prompt_str = extract_first_prompt_from_preview(raw_box, block_index=self._get_selected_block_index())
        if not prompt_str:
            self.lbl_token_badge.config(text="T5: 0/512", fg=FG_MUTED)
            return
        info = count_prompt_t5_tokens(prompt_str)
        pos_tok = info["api_pos_tokens"]
        neg_tok = info["api_neg_tokens"]
        web_tok = info["web_single_box_tokens"]
        if pos_tok > MAX_T5_TOKENS:
            fg_col = "#f38ba8"  # 超限红警
            txt = f"⚠️ 正向T5: {pos_tok}/{MAX_T5_TOKENS} (超限!) | 负向: {neg_tok}"
        elif web_tok > MAX_T5_TOKENS:
            fg_col = ACCENT_3RD  # API分流后安全，但直接粘贴网页单框会超
            txt = f"⚡ API正向T5: {pos_tok}/{MAX_T5_TOKENS} (负向已分流:{neg_tok} | 网页单框:{web_tok})"
        else:
            fg_col = SUCCESS
            txt = f"✅ T5分词: {pos_tok}/{MAX_T5_TOKENS} (负向:{neg_tok})"
        self.lbl_token_badge.config(text=txt, fg=fg_col)

    def _on_block_selection_changed(self, _event=None) -> None:
        items = getattr(self, "_current_single_items", [])
        if not items:
            return
        idx = min(self._get_selected_block_index(), len(items) - 1)
        all_ch = STORY_CHAPTERS + MULTI_ANGLE_CHAPTERS + ALL_POSITIONS_CHAPTERS
        ch_meta = next((c for c in all_ch if c["id"] == self.active_scene_id), STORY_CHAPTERS[0])
        canvas_hint = items[idx][1]
        self._active_canvas_hint = canvas_hint
        self.lbl_single_info.config(text=f"{ch_meta['title']}  |  推荐画布：{canvas_hint}")
        self._update_cost_hint_label()
        self._update_token_badge_from_editor()

    def _refresh_single_tab(self, cfg: CharacterConfig) -> None:
        all_ch = STORY_CHAPTERS + MULTI_ANGLE_CHAPTERS + ALL_POSITIONS_CHAPTERS
        ch_meta = next((c for c in all_ch if c["id"] == self.active_scene_id), STORY_CHAPTERS[0])
        items = generate_scene_prompts(self.active_scene_id, cfg, pov_override=cfg.perspective_mode)
        self._current_single_items = items

        prev_idx = self._get_selected_block_index()
        if len(items) > 1:
            choices = []
            for i, (sub_t, _, _) in enumerate(items):
                short_t = sub_t.split("·", 1)[-1].strip() if "·" in sub_t else sub_t
                if len(short_t) > 20:
                    short_t = short_t[:20] + "…"
                choices.append(f"第{i + 1}张：{short_t}")
            self.cb_block_select.config(values=choices, state="readonly")
            sel_idx = prev_idx if prev_idx < len(choices) else 0
            self.cb_block_select.current(sel_idx)
        else:
            self.cb_block_select.config(values=["当前单幕（共 1 张）"], state="disabled")
            self.cb_block_select.current(0)
            sel_idx = 0

        canvas_hint = items[sel_idx][1] if items else ""
        self._active_canvas_hint = canvas_hint
        self.lbl_single_info.config(text=f"{ch_meta['title']}  |  推荐画布：{canvas_hint}")
        self._update_cost_hint_label()

        lines: List[str] = []
        for sub_title, canvas, prompt_text in items:
            lines.append(f"## {sub_title}（推荐画布：{canvas}）：\n{prompt_text}\n")
        self.txt_single.delete("1.0", tk.END)
        self.txt_single.insert("1.0", "\n".join(lines))
        self._update_token_badge_from_editor()

    def copy_single_scene(self, scene_id: str, use_selected_block: bool = False) -> None:
        if use_selected_block and scene_id == self.active_scene_id:
            raw_box_text = self.txt_single.get("1.0", tk.END)
            blocks = extract_prompt_blocks_from_preview(raw_box_text)
            if blocks:
                idx = min(self._get_selected_block_index(), len(blocks) - 1)
                hdr_line, chosen_prompt = blocks[idx]
                self.root.clipboard_clear()
                self.root.clipboard_append(chosen_prompt)
                self.root.update_idletasks()
                clean_hdr = hdr_line.lstrip("# ").rstrip("：:")
                self.var_status.set(f"📋 已复制当前选定子图：{clean_hdr}")
                return

        cfg = self._collect_config()
        items = generate_scene_prompts(scene_id, cfg, pov_override=cfg.perspective_mode)
        if not items:
            return
        idx = min(self._get_selected_block_index(), len(items) - 1) if scene_id == self.active_scene_id else 0
        sub_title, canvas, chosen_prompt = items[idx]
        self.root.clipboard_clear()
        self.root.clipboard_append(chosen_prompt)
        self.root.update_idletasks()
        self.var_status.set(f"📋 已复制 {sub_title} 至剪贴板！（推荐画布：{canvas}）")

    def _copy_specific_suite(self, track_mode: str) -> None:
        target_box = self.txt_full_pov if track_mode == "pov" else self.txt_full_3rd
        content = target_box.get("1.0", tk.END).strip()
        if not content:
            messagebox.showwarning("未勾选章节", "请至少勾选一幕要生成的故事线章节！")
            return
        self.root.clipboard_clear()
        self.root.clipboard_append(content)
        self.root.update_idletasks()
        if self._is_all_positions_tab_active():
            selected_cnt = sum(1 for v in self.all_pos_vars.values() if v.get())
            unit_label = "个体位"
        elif self._is_multi_angle_tab_active():
            selected_cnt = sum(1 for v in self.multi_angle_vars.values() if v.get())
            unit_label = "个镜头"
        else:
            selected_cnt = sum(1 for v in self.scene_vars.values() if v.get())
            unit_label = "幕"
        label = "第一人称 (POV)" if track_mode == "pov" else "第三人称 (客观机位)"
        self.var_status.set(f"📋 已一键复制【{label}】全部已勾选的 {selected_cnt} {unit_label}整套提示词！")

    def copy_current_track_suite(self) -> None:
        self._copy_specific_suite(self.var_perspective.get())

    def export_to_file(self) -> None:
        cfg = self._collect_config()
        if self._is_all_positions_tab_active():
            selected_ids = [ch["id"] for ch in ALL_POSITIONS_CHAPTERS if self.all_pos_vars[ch["id"]].get()]
        elif self._is_multi_angle_tab_active():
            selected_ids = [ch["id"] for ch in MULTI_ANGLE_CHAPTERS if self.multi_angle_vars[ch["id"]].get()]
        else:
            selected_ids = [ch["id"] for ch in STORY_CHAPTERS if self.scene_vars[ch["id"]].get()]
        if not selected_ids:
            messagebox.showwarning("内容为空", "请先勾选要导出的章节、镜头或体位！")
            return

        both = self.var_export_both.get()
        content = generate_full_suite(
            cfg, selected_ids, pure_batch_lines=self.var_pure_batch.get(), export_both_separated=both
        ).strip()

        safe_char = (
            self.var_eng_name.get().strip().replace(" ", "_")
            if cfg.enable_identity
            else "PreciseRef"
        ) or "custom_char"
        suffix = "both_tracks" if both else ("POV" if cfg.perspective_mode == "pov" else "3rdPerson")
        default_name = f"story_suite_{safe_char}_{suffix}.txt"
        path = filedialog.asksaveasfilename(
            parent=self.root,
            title="导出故事线提示词",
            initialdir=os.path.dirname(os.path.abspath(__file__)),
            initialfile=default_name,
            defaultextension=".txt",
            filetypes=[("Text Files (*.txt)", "*.txt"), ("Markdown Files (*.md)", "*.md"), ("All Files (*.*)", "*.*")],
        )
        if not path:
            return
        with open(path, "w", encoding="utf-8") as f:
            f.write(content + "\n")
        self.var_status.set(f"💾 已成功导出提示词文件至：{path}")

    # ------------------------------------------------------------------
    # NovelAI V5 Full Medium 单张 API 生图与预览逻辑
    # ------------------------------------------------------------------
    def _build_image_preview_tab(self, tab_img: ttk.Frame) -> None:
        bar = ttk.Frame(tab_img, style="Card.TFrame")
        bar.pack(fill=tk.X, pady=(0, 6))

        ttk.Label(bar, textvariable=self.var_preview_meta, style="SubHeader.TLabel").pack(side=tk.LEFT)

        ttk.Button(
            bar,
            text="📂 打开所在文件夹",
            style="Secondary.TButton",
            command=self.on_open_output_dir,
        ).pack(side=tk.RIGHT, padx=(6, 0))

        ttk.Button(
            bar,
            text="🔍 系统看图打开原图",
            style="Action.TButton",
            command=self.on_open_last_image,
        ).pack(side=tk.RIGHT, padx=(6, 0))

        self.btn_upscale_folder = ttk.Button(
            bar,
            text="📁 文件夹批量放大另存",
            style="Action.TButton",
            command=self.on_batch_upscale_folder,
        )
        self.btn_upscale_folder.pack(side=tk.RIGHT, padx=(6, 0))

        self.btn_upscale_choose = ttk.Button(
            bar,
            text="📂 选图放大 (1点数)",
            style="Secondary.TButton",
            command=self.on_upscale_chosen_file,
        )
        self.btn_upscale_choose.pack(side=tk.RIGHT, padx=(6, 0))

        self.btn_upscale_last = ttk.Button(
            bar,
            text="🔎 高清放大 2x (1点数)",
            style="Accent.TButton",
            command=self.on_upscale_last_image,
        )
        self.btn_upscale_last.pack(side=tk.RIGHT, padx=(6, 0))

        self.btn_regen_same = ttk.Button(
            bar,
            text="🎨 再生成一张 (当前单幕)",
            style="Generate.TButton",
            command=self.on_generate_current_preview,
        )
        self.btn_regen_same.pack(side=tk.RIGHT)

        self.btn_stop_batch_preview = ttk.Button(
            bar,
            text="⏹ 停止批量",
            style="Secondary.TButton",
            command=self.on_request_cancel_any_batch,
            state="disabled",
        )
        self.btn_stop_batch_preview.pack(side=tk.RIGHT, padx=(0, 6))

        self.preview_canvas_frame = tk.Frame(tab_img, bg=BG_INPUT, highlightthickness=1, highlightbackground=BORDER)
        self.preview_canvas_frame.pack(fill=tk.BOTH, expand=True)

        self.lbl_image_view = tk.Label(
            self.preview_canvas_frame,
            text="🖼️ 暂无生成图片\n\n1. 在左侧「🚀 API生图」填入 Persistent API Token (pst-...)\n2. 点击任意章节右侧「🎨生成」或单幕预览栏绿色按钮即可单张出图",
            bg=BG_INPUT,
            fg=FG_MUTED,
            font=("Microsoft YaHei UI", 10),
            justify=tk.CENTER,
        )
        self.lbl_image_view.pack(fill=tk.BOTH, expand=True)
        self.preview_canvas_frame.bind("<Configure>", self._on_preview_resize)

    def _on_preview_resize(self, _event=None) -> None:
        if self._preview_pil_img is not None:
            self._render_pil_to_label()

    def _render_pil_to_label(self) -> None:
        if self._preview_pil_img is None:
            return
        avail_w = max(240, self.preview_canvas_frame.winfo_width() - 24)
        avail_h = max(240, self.preview_canvas_frame.winfo_height() - 24)
        src_w, src_h = self._preview_pil_img.size
        ratio = min(avail_w / src_w, avail_h / src_h, 1.0)
        new_w = max(1, int(src_w * ratio))
        new_h = max(1, int(src_h * ratio))
        resized = self._preview_pil_img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        if resized.mode == "RGBA":
            alpha_min, _ = resized.getchannel("A").getextrema()
            if alpha_min < 250:
                tile = 16
                checker = Image.new("RGBA", (new_w, new_h), (30, 30, 46, 255))
                light_sq = Image.new("RGBA", (tile, tile), (52, 54, 74, 255))
                for yy in range(0, new_h, tile):
                    for xx in range(((yy // tile) % 2) * tile, new_w, tile * 2):
                        checker.paste(light_sq, (xx, yy))
                resized = Image.alpha_composite(checker, resized)
        self._preview_tk_img = ImageTk.PhotoImage(resized)
        self.lbl_image_view.config(image=self._preview_tk_img, text="")

    def _update_cost_hint_label(self) -> None:
        if not hasattr(self, "lbl_cost_hint"):
            return
        hint = getattr(self, "_active_canvas_hint", "竖图 832x1216")
        w, h = parse_canvas_size(hint, self.var_api_canvas.get())
        est = estimate_v5_medium_anlas(w, h, steps=14, is_opus_free_eligible=False)
        up_note = " + 自动2x放大 1 Anlas" if self.var_api_auto_upscale_replace.get() else ""
        self.lbl_cost_hint.config(
            text=f"📐 当前实际发送尺寸：{w} × {h}  |  单张预计消耗：约 {est} Anlas（Opus 免费额度充足时为 0）{up_note}"
        )

    def _collect_api_settings(self) -> NaiApiSettings:
        try:
            seed_val = int(self.var_api_seed.get().strip())
        except ValueError:
            seed_val = -1
        return NaiApiSettings(
            api_token=self.var_api_token.get().strip(),
            canvas_preset=self.var_api_canvas.get(),
            scale=round(float(self.var_api_scale.get()), 1),
            cfg_rescale=round(float(self.var_api_rescale.get()), 2),
            seed=seed_val,
            use_s00_seed=bool(self.var_api_use_s00_seed.get()),
            extra_uc=self.var_api_extra_uc.get().strip(),
            append_v5_quality=bool(self.var_api_quality.get()),
            auto_upscale_replace=bool(self.var_api_auto_upscale_replace.get()),
            proxy=self.var_api_proxy.get().strip(),
            output_dir=self.var_api_outdir.get().strip() or DEFAULT_OUTPUT_DIR,
        )

    def on_save_api_config(self) -> None:
        settings = self._collect_api_settings()
        save_api_settings(settings)
        self.var_status.set("💾 已保存 API 配置至本地 nai_api_config.json（已加入 .gitignore 保护）")

    def on_choose_output_dir(self) -> None:
        chosen = filedialog.askdirectory(
            parent=self.root,
            title="选择生图保存目录",
            initialdir=self.var_api_outdir.get().strip() or DEFAULT_OUTPUT_DIR,
        )
        if chosen:
            self.var_api_outdir.set(chosen)
            self.on_save_api_config()

    def on_open_output_dir(self) -> None:
        target = self.var_api_outdir.get().strip() or DEFAULT_OUTPUT_DIR
        if self.last_generated_path and os.path.exists(os.path.dirname(self.last_generated_path)):
            target = os.path.dirname(self.last_generated_path)
        os.makedirs(target, exist_ok=True)
        try:
            os.startfile(target)
        except Exception as exc:
            messagebox.showerror("打开文件夹失败", str(exc))

    def on_open_last_image(self) -> None:
        if not self.last_generated_path or not os.path.exists(self.last_generated_path):
            messagebox.showinfo("尚无图片", "当前还没有已生成的本地图片。")
            return
        try:
            os.startfile(self.last_generated_path)
        except Exception as exc:
            messagebox.showerror("打开图片失败", str(exc))

    def on_lock_last_seed(self) -> None:
        if self.last_generated_seed is None:
            messagebox.showinfo("尚无上次 Seed", "请先生成至少一张图片，即可一键锁定其 Seed。")
            return
        self.var_api_seed.set(str(self.last_generated_seed))
        self.var_status.set(f"🔒 已锁定上次出图 Seed：{self.last_generated_seed}")

    def on_lock_last_s00_seed(self) -> None:
        if self.last_s00_seed is None:
            messagebox.showinfo("尚无 0号幕 Seed", "当前会话尚未生成过第 00 幕 (S00)，请先生成 S00 或开启连出。")
            return
        self.var_api_seed.set(str(self.last_s00_seed))
        self.var_status.set(f"0️⃣ 已将最近一次第 00 幕 (S00) 的 Seed 填入种子框：{self.last_s00_seed}")

    def _on_toggle_s00_seed(self, persist: bool = True) -> None:
        use_s00 = bool(self.var_api_use_s00_seed.get())
        if persist:
            try:
                save_api_settings(self._collect_api_settings())
            except Exception:
                pass
        if use_s00:
            s00_note = f"（最近 S00 Seed: {self.last_s00_seed}）" if self.last_s00_seed else "（Seed=-1 时先随机出 S00，后续自动锁定同 Seed）"
            self.var_s00_seed_badge.set(s00_note)
            if persist:
                self.var_status.set("🔗 已开启「使用 0号幕 (S00) 的 Seed」：批量连出时 S01~S11 将自动统一锁定 S00 的 Seed")
        else:
            self.var_s00_seed_badge.set("（已关闭：批量连出时后续每一幕各自独立随机 Seed）")
            if persist:
                self.var_status.set("🎲 已关闭「使用 0号幕 (S00) 的 Seed」：批量连出时每一幕将各自独立随机摇号")

    def on_check_anlas_clicked(self) -> None:
        settings = self._collect_api_settings()
        if not settings.api_token:
            self.left_nb.select(4)
            messagebox.showwarning(
                "未填写 Token",
                "请先在左侧「🚀 API生图」标签页输入 NovelAI Persistent API Token（以 pst- 开头）。",
            )
            return
        save_api_settings(settings)
        self.btn_check_anlas.config(state="disabled")
        self.var_status.set("🔍 正在连接 NovelAI 查询账户订阅与 Anlas 点数...")

        def _worker() -> None:
            try:
                info = fetch_subscription_info(settings.api_token, proxy=settings.proxy)
                self.root.after(0, lambda: self._on_anlas_checked_ok(info))
            except Exception as exc:
                msg = exc.message if isinstance(exc, NaiApiError) else str(exc)
                self.root.after(0, lambda: self._on_anlas_checked_err(msg))

        threading.Thread(target=_worker, daemon=True).start()

    def _on_anlas_checked_ok(self, info: SubscriptionInfo) -> None:
        self.btn_check_anlas.config(state="normal")
        opus_note = ""
        if info.opus_usage_percent is not None:
            used_pct = max(0, 100 - info.opus_usage_percent)
            state_txt = "已透支(计费)" if info.opus_usage_negative else f"充裕(余量{info.opus_usage_percent}%/已用{used_pct}%)"
            opus_note = f" | V5额度条:{state_txt}"
        elif info.tier == 3 and info.active:
            opus_note = " | ♾️Opus免点额度:生效中(≤1024² 0点)"
        badge = (
            f"💎 {info.tier_name} ({'激活' if info.active else '未激活'}) | "
            f"订阅月度:{info.fixed_anlas} + 永久:{info.purchased_anlas} = {info.anlas_left} Anlas{opus_note}"
        )
        self.var_anlas_badge.set(badge)
        self.var_status.set(f"✅ Token 验证成功！{badge}")

    def _on_anlas_checked_err(self, err_msg: str) -> None:
        self.btn_check_anlas.config(state="normal")
        self.var_anlas_badge.set("❌ 账户验证失败，请检查 Token 或网络代理设置")
        self.var_status.set(f"❌ 查询失败：{err_msg}")
        messagebox.showerror("NovelAI 账户查询失败", err_msg)

    def _set_generating_ui_lock(self, locked: bool, allow_cancel_batch: bool = False) -> None:
        self.is_generating = locked
        btn_state = "disabled" if locked else "normal"
        for b in (
            self.btn_single_generate,
            self.btn_left_generate,
            self.btn_left_batch_all12,
            self.btn_left_batch_checked,
            self.btn_batch_all12_right,
            self.btn_batch_checked_right,
            self.btn_batch_ma_all,
            self.btn_batch_ma_checked,
            self.btn_batch_pos_cat,
            self.btn_batch_pos_checked,
            self.btn_regen_same,
            self.btn_upscale_last,
            self.btn_upscale_choose,
            self.btn_upscale_folder,
            self.btn_left_upscale_last,
            self.btn_left_upscale_file,
            self.btn_left_batch_upscale,
        ):
            b.config(state=btn_state)
        for row_btn in list(self.gen_btn_refs.values()):
            if row_btn.winfo_exists():
                row_btn.config(state=btn_state)
        cancel_state = "normal" if (locked and allow_cancel_batch) else "disabled"
        for cb in ("btn_cancel_batch", "btn_stop_batch_right", "btn_stop_ma_right", "btn_stop_pos_right", "btn_stop_batch_preview"):
            if hasattr(self, cb):
                getattr(self, cb).config(state=cancel_state)

    def on_request_cancel_any_batch(self) -> None:
        if not self.is_generating:
            return
        self._cancel_batch_upscale = True
        self._cancel_batch_gen = True
        for cb in ("btn_cancel_batch", "btn_stop_batch_right", "btn_stop_ma_right", "btn_stop_pos_right", "btn_stop_batch_preview"):
            if hasattr(self, cb):
                getattr(self, cb).config(state="disabled")
        self.var_status.set("⏹ 正在等待当前这一张请求完成后安全中断批量任务（已落盘图片将完整保留）...")

    def on_batch_upscale_folder(self) -> None:
        """选择源文件夹与独立的目标输出文件夹，批量执行 1 点数官方 Upscale"""
        if self.is_generating:
            return

        settings = self._collect_api_settings()
        if not settings.api_token:
            self.left_nb.select(4)
            messagebox.showwarning("需要填写 API Token", "请先在左侧「🚀 API生图」填入 Persistent API Token（pst-...）！")
            return

        init_src = self.var_api_outdir.get().strip() or DEFAULT_OUTPUT_DIR
        if self.last_generated_path and os.path.isdir(os.path.dirname(self.last_generated_path)):
            init_src = os.path.dirname(self.last_generated_path)

        src_dir = filedialog.askdirectory(
            parent=self.root,
            title="第 1 步：选择【待放大的源图片文件夹】（例如 outputs/20261112）",
            initialdir=init_src,
        )
        if not src_dir:
            return

        src_abs = os.path.abspath(src_dir)
        default_out = os.path.join(
            os.path.dirname(src_abs),
            f"{os.path.basename(src_abs)}_upscaled_2x",
        )

        choose_custom_out = messagebox.askyesnocancel(
            "选择另存目录方式",
            f"已选源文件夹：\n{src_abs}\n\n"
            f"是否直接将放大后的高清图另存至同级新文件夹：\n📂 {default_out} ？\n\n"
            "• 点击【是 (Yes)】：自动新建并使用上述 `_upscaled_2x` 独立目录（推荐）\n"
            "• 点击【否 (No)】：手动指定另一个保存文件夹\n"
            "• 点击【取消 (Cancel)】：放弃本次操作",
            parent=self.root,
        )
        if choose_custom_out is None:
            return
        if choose_custom_out is True:
            out_dir = default_out
        else:
            picked_out = filedialog.askdirectory(
                parent=self.root,
                title="第 2 步：选择【放大后高清图的另存文件夹】",
                initialdir=os.path.dirname(src_abs),
            )
            if not picked_out:
                return
            out_dir = os.path.abspath(picked_out)

        try:
            plan = scan_folder_for_upscale(src_abs, out_dir)
        except Exception as exc:
            messagebox.showerror("扫描文件夹失败", str(exc))
            return

        if not plan.pending_files:
            messagebox.showinfo(
                "无需重复放大",
                f"源目录：{plan.source_dir}\n目标目录：{plan.output_dir}\n\n"
                f"未发现需要放大的新原图！\n"
                f"• 已跳过已完成/带 _upscaled_ 图：{plan.skipped_already_done} 张\n"
                f"• 已跳过大尺寸图 (>1600px)：{plan.skipped_oversized} 张",
            )
            return

        count = len(plan.pending_files)
        confirm = messagebox.askyesno(
            "确认批量高清放大 (每张 1 Anlas)",
            f"📊 预扫描完成：\n\n"
            f"• 源文件夹：{plan.source_dir}\n"
            f"• 另存文件夹：{plan.output_dir}\n\n"
            f"• 待放大原图数量：{count} 张\n"
            f"• 自动跳过已放大/超尺寸图：{plan.skipped_already_done + plan.skipped_oversized} 张\n"
            f"• 预计总消耗点数：{count} Anlas（固定 1 点数/张）\n\n"
            f"确认开始逐张串行放大吗？（中途可随时点击左侧「⏹ 停止批量」中断，已完成的不会重扣）",
            parent=self.root,
        )
        if not confirm:
            return

        save_api_settings(settings)
        self._cancel_batch_upscale = False
        self._set_generating_ui_lock(True, allow_cancel_batch=True)
        self.out_nb.select(1)

        def _on_prog(idx: int, total: int, fname: str, last_res: Optional[UpscaleResult]) -> None:
            def _ui_step() -> None:
                self.var_status.set(
                    f"📁 批量放大进度 [{idx}/{total}]：正在放大 {fname} -> 另存至 {os.path.basename(plan.output_dir)} (可点「⏹ 停止批量」中断)"
                )
                self.var_preview_meta.set(
                    f"⏳ 批量 2x 高清放大中：第 {idx} / {total} 张 ({fname})  |  目标目录：{plan.output_dir}"
                )
                if last_res is not None:
                    self.last_generated_path = last_res.saved_path
                    try:
                        pil_img = Image.open(BytesIO(last_res.image_bytes))
                        pil_img.load()
                        self._preview_pil_img = pil_img
                        self._render_pil_to_label()
                    except Exception:
                        pass

            self.root.after(0, _ui_step)

        def _worker() -> None:
            try:
                summary = batch_upscale_folder_nai(
                    api_token=settings.api_token,
                    plan=plan,
                    proxy=settings.proxy,
                    on_progress=_on_prog,
                    cancel_check=lambda: self._cancel_batch_upscale,
                )
                sub_info: Optional[SubscriptionInfo] = None
                try:
                    sub_info = fetch_subscription_info(settings.api_token, proxy=settings.proxy)
                except Exception:
                    pass
                self.root.after(0, lambda: self._on_batch_upscale_done(summary, sub_info))
            except Exception as exc:
                msg = exc.message if isinstance(exc, NaiApiError) else str(exc)
                self.root.after(0, lambda: self._on_generate_error(msg))

        threading.Thread(target=_worker, daemon=True).start()

    def _on_batch_upscale_done(self, summary: BatchUpscaleSummary, sub_info: Optional[SubscriptionInfo]) -> None:
        self._set_generating_ui_lock(False)
        self._cancel_batch_upscale = False

        if summary.last_result is not None:
            self.last_generated_path = summary.last_result.saved_path
            try:
                pil_img = Image.open(BytesIO(summary.last_result.image_bytes))
                pil_img.load()
                self._preview_pil_img = pil_img
                self._render_pil_to_label()
            except Exception:
                pass

        if sub_info is not None:
            self._on_anlas_checked_ok(sub_info)

        state_word = "⏹ 已手动中断" if summary.cancelled else "🎉 批量放大完成"
        fail_cnt = len(summary.failed)
        anlas_tail = f" | 剩余: {sub_info.anlas_left} Anlas" if sub_info else ""
        meta = (
            f"{state_word}：成功 {summary.succeeded}/{summary.total_planned} 张"
            + (f"（失败 {fail_cnt} 张）" if fail_cnt else "")
            + f"  |  另存目录：{summary.output_dir}"
        )
        self.var_preview_meta.set(meta)
        self.var_status.set(f"{meta}{anlas_tail}")

        detail_msg = (
            f"{state_word}！\n\n"
            f"• 成功放大：{summary.succeeded} / {summary.total_planned} 张\n"
            f"• 独立保存目录：\n  {summary.output_dir}\n"
        )
        if summary.failed:
            preview_errs = "\n".join(f"  - {fn}: {er}" for fn, er in summary.failed[:5])
            detail_msg += f"\n⚠️ 失败项 ({fail_cnt} 张)：\n{preview_errs}\n"
        detail_msg += "\n是否立即在资源管理器中打开放大后的新文件夹？"

        if messagebox.askyesno("批量 Upscale 结果", detail_msg, parent=self.root):
            try:
                os.startfile(summary.output_dir)
            except Exception:
                pass

    def on_upscale_last_image(self) -> None:
        """将当前最新出图预览中的原图发送至 NovelAI 官方 1 点数 Upscaler 放大 2x"""
        if self.is_generating:
            return
        if not self.last_generated_path or not os.path.exists(self.last_generated_path):
            messagebox.showinfo(
                "尚无当前预览图",
                "当前还没有刚生成的预览图。\n您可以先点击「🎨 生成」出一张图，或点击旁边的「📂 选图放大 (1点数)」挑选任意历史原图放大！",
            )
            return
        self._run_upscale_for_path(self.last_generated_path)

    def on_upscale_chosen_file(self) -> None:
        """任选本地 outputs 中的一张图片进行 1 点数官方 Upscale 放大"""
        if self.is_generating:
            return
        init_dir = self.var_api_outdir.get().strip() or DEFAULT_OUTPUT_DIR
        if self.last_generated_path and os.path.exists(os.path.dirname(self.last_generated_path)):
            init_dir = os.path.dirname(self.last_generated_path)
        chosen = filedialog.askopenfilename(
            parent=self.root,
            title="选择要进行 1 点数高清放大的图片（如 832x1216 / 1216x832）",
            initialdir=init_dir,
            filetypes=[("Image Files (*.png;*.webp;*.jpg)", "*.png *.webp *.jpg *.jpeg"), ("All Files (*.*)", "*.*")],
        )
        if not chosen:
            return
        self._run_upscale_for_path(chosen)

    def _run_upscale_for_path(self, target_path: str) -> None:
        settings = self._collect_api_settings()
        if not settings.api_token:
            self.left_nb.select(4)
            messagebox.showwarning("需要填写 API Token", "请先在左侧「🚀 API生图」填入 Persistent API Token（pst-...）！")
            return
        save_api_settings(settings)

        self._set_generating_ui_lock(True)
        fname = os.path.basename(target_path)
        self.var_status.set(f"🔎 正在执行官方 2x 高清放大 (消耗 1 Anlas)：{fname} ... 请稍候约 3~8 秒")

        def _worker() -> None:
            try:
                up_res = upscale_single_image_nai(
                    api_token=settings.api_token,
                    source_image_path=target_path,
                    proxy=settings.proxy,
                )
                sub_info: Optional[SubscriptionInfo] = None
                try:
                    sub_info = fetch_subscription_info(settings.api_token, proxy=settings.proxy)
                except Exception:
                    pass
                self.root.after(0, lambda: self._on_upscale_success(up_res, sub_info))
            except Exception as exc:
                msg = exc.message if isinstance(exc, NaiApiError) else str(exc)
                self.root.after(0, lambda: self._on_generate_error(msg))

        threading.Thread(target=_worker, daemon=True).start()

    def _on_upscale_success(self, up_res: UpscaleResult, sub_info: Optional[SubscriptionInfo]) -> None:
        self._set_generating_ui_lock(False)
        self.last_generated_path = up_res.saved_path

        try:
            pil_img = Image.open(BytesIO(up_res.image_bytes))
            pil_img.load()
            self._preview_pil_img = pil_img
        except Exception as exc:
            self.var_status.set(f"⚠️ 放大图片已保存至 {up_res.saved_path}，但预览加载失败：{exc}")
            return

        if sub_info is not None:
            self._on_anlas_checked_ok(sub_info)

        meta_str = (
            f"🔎 官方高清放大完成 (1 Anlas)  |  {up_res.src_width}×{up_res.src_height} ➔ {up_res.out_width}×{up_res.out_height}  |  "
            f"耗时: {up_res.elapsed_sec}s  |  文件: {os.path.basename(up_res.saved_path)}"
        )
        self.var_preview_meta.set(meta_str)
        anlas_tail = f"  |  当前剩余: {sub_info.anlas_left} Anlas" if sub_info else ""
        self.var_status.set(f"🎉 2x 高清无损放大完成！已保存至：{up_res.saved_path}{anlas_tail}")

        self.out_nb.select(1)
        self.root.after(30, self._render_pil_to_label)

    def on_quick_generate_scene(self, scene_id: str) -> None:
        """点击章节列表右侧的「🎨生成」：先切换到该幕，再按当前视角单张生图"""
        if self.is_generating:
            return
        self.select_single_scene(scene_id)
        self.on_generate_current_preview()

    def on_generate_current_preview(self) -> None:
        """读取当前单幕精细预览框中的第一条 Prompt 并发起单张 V5 Full Medium 生图"""
        if self.is_generating:
            return

        settings = self._collect_api_settings()
        if not settings.api_token:
            self.left_nb.select(4)
            messagebox.showwarning(
                "需要填写 API Token",
                "请先在左侧「🚀 API生图」标签页填入 NovelAI Persistent API Token（以 pst- 开头）！\n\n获取位置：NovelAI 网页端 -> User Settings -> Account -> Get Persistent API Token",
            )
            return

        raw_box_text = self.txt_single.get("1.0", tk.END)
        sel_block_idx = self._get_selected_block_index()
        blocks = extract_prompt_blocks_from_preview(raw_box_text)
        prompt_to_send = extract_first_prompt_from_preview(raw_box_text, block_index=sel_block_idx)
        if not prompt_to_send:
            messagebox.showwarning("提示词为空", "当前「🎯 单幕精细预览」框中没有可生成的提示词内容！")
            return

        # 自动保存最新 API 设置
        save_api_settings(settings)

        hint = getattr(self, "_active_canvas_hint", "竖图 832x1216")
        width, height = parse_canvas_size(hint, settings.canvas_preset)
        scene_id = self.active_scene_id
        mode = self.var_perspective.get()
        sub_tag = f"_P{sel_block_idx + 1}" if len(blocks) > 1 else ""
        scene_file_tag = f"{scene_id}{sub_tag}"
        mode_label = ("第一人称(POV)" if mode == "pov" else "第三人称(3rd)") + (
            f"·第{sel_block_idx + 1}张" if len(blocks) > 1 else ""
        )

        self._set_generating_ui_lock(True)
        self.var_status.set(
            f"🎨 正在单张生成【{scene_id} · {mode_label}】({width}x{height}, V5 Full Medium, 14步)... 请稍候约 4~10 秒"
        )

        def _worker() -> None:
            try:
                res = generate_single_image_v5_medium(
                    api_token=settings.api_token,
                    prompt_text=prompt_to_send,
                    width=width,
                    height=height,
                    scale=settings.scale,
                    cfg_rescale=settings.cfg_rescale,
                    seed=settings.seed,
                    extra_uc=settings.extra_uc,
                    append_v5_quality=settings.append_v5_quality,
                    auto_upscale_replace=settings.auto_upscale_replace,
                    proxy=settings.proxy,
                    output_dir=settings.output_dir,
                    scene_id=scene_file_tag,
                    perspective_mode=mode,
                )
                if settings.auto_upscale_replace and res.width * res.height <= 1048576:
                    raw_path = res.saved_path
                    try:
                        up_res = upscale_single_image_nai(
                            api_token=settings.api_token,
                            source_image_path=raw_path,
                            proxy=settings.proxy,
                        )
                        if os.path.exists(raw_path) and os.path.abspath(raw_path) != os.path.abspath(up_res.saved_path):
                            os.remove(raw_path)
                        res = GenerationResult(
                            image_bytes=up_res.image_bytes,
                            saved_path=up_res.saved_path,
                            seed=res.seed,
                            width=up_res.out_width,
                            height=up_res.out_height,
                            elapsed_sec=round(res.elapsed_sec + up_res.elapsed_sec, 2),
                            estimated_anlas=res.estimated_anlas + up_res.anlas_cost,
                            model=res.model,
                        )
                    except Exception:
                        pass
                # 生图成功后顺便静默刷新一次剩余点数（失败也不影响主图展示）
                sub_info: Optional[SubscriptionInfo] = None
                try:
                    sub_info = fetch_subscription_info(settings.api_token, proxy=settings.proxy)
                except Exception:
                    pass
                self.root.after(0, lambda: self._on_generate_success(res, scene_id, mode_label, sub_info))
            except Exception as exc:
                msg = exc.message if isinstance(exc, NaiApiError) else str(exc)
                self.root.after(0, lambda: self._on_generate_error(msg))

        threading.Thread(target=_worker, daemon=True).start()

    def _on_generate_success(
        self,
        res: GenerationResult,
        scene_id: str,
        mode_label: str,
        sub_info: Optional[SubscriptionInfo],
    ) -> None:
        self._set_generating_ui_lock(False)
        self.last_generated_path = res.saved_path
        self.last_generated_seed = res.seed
        if scene_id == "S00":
            self.last_s00_seed = res.seed
            if self.var_api_use_s00_seed.get():
                self.var_s00_seed_badge.set(f"（最近 S00 Seed: {res.seed}）")

        try:
            pil_img = Image.open(BytesIO(res.image_bytes))
            pil_img.load()
            self._preview_pil_img = pil_img
        except Exception as exc:
            self.var_status.set(f"⚠️ 图片已保存至 {res.saved_path}，但界面预览解码失败：{exc}")
            return

        if sub_info is not None:
            self._on_anlas_checked_ok(sub_info)

        meta_str = (
            f"✅ {scene_id} [{mode_label}]  |  {res.width}×{res.height}  |  "
            f"Seed: {res.seed}  |  耗时: {res.elapsed_sec}s  |  文件: {os.path.basename(res.saved_path)}"
        )
        self.var_preview_meta.set(meta_str)
        anlas_tail = f"  |  当前剩余: {sub_info.anlas_left} Anlas" if sub_info else ""
        self.var_status.set(f"🎉 单张出图完成！已保存至：{res.saved_path}{anlas_tail}")

        # 自动切到「🖼️ 最新出图预览」标签页并渲染缩放图
        self.out_nb.select(1)
        self.root.after(30, self._render_pil_to_label)

    def _on_generate_error(self, err_msg: str) -> None:
        self._set_generating_ui_lock(False)
        self.var_status.set(f"❌ 生图失败：{err_msg}")
        messagebox.showerror("NovelAI 生图失败", err_msg)

    def on_batch_generate_scenes(self, force_all_12: bool = True, suite_kind: str = "story") -> None:
        """一键串行连出全套 12 幕或 9 镜头多角度套图（互不混跑），支持可选锁定沿用 0 号幕 (S00) 的 Seed"""
        if self.is_generating:
            return

        settings = self._collect_api_settings()
        if not settings.api_token:
            self.left_nb.select(4)
            messagebox.showwarning(
                "需要填写 API Token",
                "请先在左侧「🚀 API生图」标签页填入 NovelAI Persistent API Token（以 pst- 开头）！",
            )
            return

        if suite_kind == "all_positions":
            source_chapters = ALL_POSITIONS_CHAPTERS
            if force_all_12:
                vis_ch = self._get_filtered_pos_chapters()
                target_chapter_ids = [ch["id"] for ch in vis_ch]
                scope_label = f"当前分类 {len(target_chapter_ids)} 个体位"
            else:
                target_chapter_ids = [ch["id"] for ch in ALL_POSITIONS_CHAPTERS if self.all_pos_vars[ch["id"]].get()]
                if not target_chapter_ids:
                    messagebox.showwarning("未勾选任何体位", "请先在「全体位生成器」勾选至少 1 个体位，或点击「🚀 出当前分类」。")
                    return
                scope_label = f"已勾选 {len(target_chapter_ids)} 个体位"
        elif suite_kind == "multi_angle":
            source_chapters = MULTI_ANGLE_CHAPTERS
            if force_all_12:
                target_chapter_ids = [ch["id"] for ch in MULTI_ANGLE_CHAPTERS]
                scope_label = "全套 9 镜头"
            else:
                target_chapter_ids = [ch["id"] for ch in MULTI_ANGLE_CHAPTERS if self.multi_angle_vars[ch["id"]].get()]
                if not target_chapter_ids:
                    messagebox.showwarning("未勾选任何镜头", "请先在「多角度套图」标签页勾选至少 1 个镜头，或点击「🚀 一键出全套 9 镜头」。")
                    return
                scope_label = f"已勾选 {len(target_chapter_ids)} 镜头"
        else:
            source_chapters = STORY_CHAPTERS
            if force_all_12:
                target_chapter_ids = [ch["id"] for ch in STORY_CHAPTERS if ch["id"].startswith("S")]
                scope_label = "全套 12 幕 (S00 ~ S11)"
            else:
                target_chapter_ids = [ch["id"] for ch in STORY_CHAPTERS if self.scene_vars[ch["id"]].get()]
                if not target_chapter_ids:
                    messagebox.showwarning("未勾选任何章节", "请先在右侧章节列表中勾选至少 1 个章节，或直接点击「🚀 一键出全套 12 幕」。")
                    return
                scope_label = f"已勾选 {len(target_chapter_ids)} 幕"

        mode = self.var_perspective.get()
        mode_label = "👁️ 第一人称 (POV)" if mode == "pov" else "🎥 第三人称 (客观机位)"

        # 组装待发送任务队列（自动排除备用同义测试变体，仅按用户选定的分镜模式生成每幕正式主图）
        batch_cfg = self._collect_config()
        batch_cfg.include_sub_variants = False

        tasks: List[SceneBatchTask] = []
        for ch in source_chapters:
            cid = ch["id"]
            if cid not in target_chapter_ids:
                continue
            items = generate_scene_prompts(cid, batch_cfg, pov_override=mode)
            for idx_item, (sub_title, canvas_hint, prompt_text) in enumerate(items):
                if not prompt_text or prompt_text.startswith("[Base Prompt]"):
                    continue
                w, h = parse_canvas_size(canvas_hint, settings.canvas_preset)
                sub_suffix = f"_P{idx_item + 1}" if len(items) > 1 else ""
                tasks.append(
                    SceneBatchTask(
                        scene_id=f"{cid}{sub_suffix}",
                        base_chapter_id=cid,
                        title=sub_title,
                        prompt_text=prompt_text,
                        width=w,
                        height=h,
                    )
                )

        if not tasks:
            messagebox.showwarning("任务为空", "没有可生成的章节提示词任务。")
            return

        has_s00 = any(t.base_chapter_id == "S00" for t in tasks)
        if settings.use_s00_seed:
            if 0 < settings.seed <= 4294967288:
                seed_desc = f"✅ 开启 · 全程统一锁定当前指定 Seed: {settings.seed}"
            elif has_s00:
                seed_desc = "✅ 开启 · 先随机生成 0号幕 (S00)，随后 S01~S11 自动统一沿用 S00 的 Seed"
            elif self.last_s00_seed is not None:
                seed_desc = f"✅ 开启 · 本次不含 S00，将自动沿用最近一次 S00 生成的 Seed: {self.last_s00_seed}"
            else:
                seed_desc = "✅ 开启 · 由本批首幕先随机生成 Seed，后续幕次统一锁定沿用该 Seed"
        else:
            if 0 < settings.seed <= 4294967288 and has_s00:
                seed_desc = f"🎲 关闭 · 仅 S00 使用 {settings.seed}，后续 S01~S11 各自独立随机 Seed"
            else:
                seed_desc = "🎲 关闭 · 不绑定 0号幕 Seed，每一幕各自独立随机摇号 (-1)"

        total_imgs = len(tasks)
        total_anlas = sum(
            estimate_v5_medium_anlas(t.width, t.height, steps=14, is_opus_free_eligible=False)
            for t in tasks
        )
        split_note = (
            f"（含 S03/S04 前后单图拆分，共 {total_imgs} 张）"
            if total_imgs > len(target_chapter_ids)
            else f"（共 {total_imgs} 张）"
        )

        confirm = messagebox.askyesno(
            "确认一键批量连出故事线",
            f"🎬 即将按顺序串行连出 NovelAI V5 Full Medium：\n\n"
            f"• 视角轨道：{mode_label}\n"
            f"• 目标范围：{scope_label} {split_note}\n"
            f"• 0号幕 (S00) Seed 跟随：{seed_desc}\n"
            f"• 画布策略：{settings.canvas_preset}\n"
            f"• 预计总消耗：约 {total_anlas} Anlas（若 Opus 免费额度充裕则为 0 点数）\n"
            f"• 保存位置：{settings.output_dir}/<日期>/suite_.../ 独立套图文件夹\n\n"
            f"确认立即开始连出吗？（中途可随时点击「⏹ 停止连出 / 停止批量」安全中断）",
            parent=self.root,
        )
        if not confirm:
            return

        save_api_settings(settings)
        self._cancel_batch_gen = False
        self._set_generating_ui_lock(True, allow_cancel_batch=True)
        self.out_nb.select(1)

        suite_char_tag = batch_cfg.eng_name or batch_cfg.char_tag or "story"

        def _on_prog(
            phase: str,
            idx: int,
            total: int,
            task: SceneBatchTask,
            cur_seed: int,
            s00_seed_now: Optional[int],
            res_obj: Optional[GenerationResult],
        ) -> None:
            def _ui_step() -> None:
                # 同步高亮当前正在处理的章节按钮
                for sid_k, btn_k in list(self.scene_btn_refs.items()):
                    if btn_k.winfo_exists():
                        btn_k.config(
                            bg=BORDER if sid_k == task.base_chapter_id else BG_INPUT,
                            fg=SUCCESS if sid_k == task.base_chapter_id else FG_TEXT,
                        )

                if phase == "start":
                    seed_lbl = f"Seed={cur_seed}" if cur_seed > 0 else "Seed=随机摇号中"
                    s00_lbl = f" | 0号基准Seed:{s00_seed_now}" if (settings.use_s00_seed and s00_seed_now) else ""
                    self.var_status.set(
                        f"🚀 连出进度 [{idx}/{total}]：正在生成【{task.scene_id}】({task.width}×{task.height}, {seed_lbl}{s00_lbl})... 可点「⏹ 停止连出」中断"
                    )
                    self.var_preview_meta.set(
                        f"⏳ 批量连出中 [{idx}/{total}]：正在绘制 {task.scene_id} ({task.width}×{task.height}, {seed_lbl})"
                    )
                elif phase == "done" and res_obj is not None:
                    self.last_generated_path = res_obj.saved_path
                    self.last_generated_seed = res_obj.seed
                    if task.base_chapter_id == "S00":
                        self.last_s00_seed = res_obj.seed
                        if self.var_api_use_s00_seed.get():
                            self.var_s00_seed_badge.set(f"（最近 S00 Seed: {res_obj.seed}）")
                    try:
                        pil_img = Image.open(BytesIO(res_obj.image_bytes))
                        pil_img.load()
                        self._preview_pil_img = pil_img
                        self._render_pil_to_label()
                    except Exception:
                        pass
                    self.var_preview_meta.set(
                        f"✅ 已完成 [{idx}/{total}] {task.scene_id}  |  {res_obj.width}×{res_obj.height}  |  "
                        f"Seed: {res_obj.seed}  |  耗时: {res_obj.elapsed_sec}s"
                    )

            self.root.after(0, _ui_step)

        def _worker() -> None:
            try:
                summary = batch_generate_scenes_v5_medium(
                    api_token=settings.api_token,
                    tasks=tasks,
                    scale=settings.scale,
                    cfg_rescale=settings.cfg_rescale,
                    initial_seed=settings.seed,
                    use_s00_seed=settings.use_s00_seed,
                    fallback_s00_seed=self.last_s00_seed,
                    extra_uc=settings.extra_uc,
                    append_v5_quality=settings.append_v5_quality,
                    auto_upscale_replace=settings.auto_upscale_replace,
                    proxy=settings.proxy,
                    output_dir=settings.output_dir,
                    perspective_mode=mode,
                    suite_tag=suite_char_tag,
                    on_progress=_on_prog,
                    cancel_check=lambda: self._cancel_batch_gen,
                )
                sub_info: Optional[SubscriptionInfo] = None
                try:
                    sub_info = fetch_subscription_info(settings.api_token, proxy=settings.proxy)
                except Exception:
                    pass
                self.root.after(0, lambda: self._on_batch_generate_done(summary, mode_label, sub_info))
            except Exception as exc:
                msg = exc.message if isinstance(exc, NaiApiError) else str(exc)
                self.root.after(0, lambda: self._on_generate_error(msg))

        threading.Thread(target=_worker, daemon=True).start()

    def _on_batch_generate_done(
        self,
        summary: BatchGenerateSummary,
        mode_label: str,
        sub_info: Optional[SubscriptionInfo],
    ) -> None:
        self._set_generating_ui_lock(False)
        self._cancel_batch_gen = False

        # 恢复当前选中章节高亮色
        for sid_k, btn_k in list(self.scene_btn_refs.items()):
            if btn_k.winfo_exists():
                btn_k.config(
                    bg=BORDER if sid_k == self.active_scene_id else BG_INPUT,
                    fg=ACCENT if sid_k == self.active_scene_id else FG_TEXT,
                )

        if summary.s00_seed_used is not None and self.var_api_use_s00_seed.get():
            self.last_s00_seed = summary.s00_seed_used
            self.var_s00_seed_badge.set(f"（最近 S00 Seed: {summary.s00_seed_used}）")

        if summary.last_result is not None:
            self.last_generated_path = summary.last_result.saved_path
            self.last_generated_seed = summary.last_result.seed
            try:
                pil_img = Image.open(BytesIO(summary.last_result.image_bytes))
                pil_img.load()
                self._preview_pil_img = pil_img
                self._render_pil_to_label()
            except Exception:
                pass

        if sub_info is not None:
            self._on_anlas_checked_ok(sub_info)

        state_word = "⏹ 连出已手动停止" if summary.cancelled else "🎉 故事线批量连出完成"
        fail_cnt = len(summary.failed)
        s00_note = (
            f" | 锁定0号Seed: {summary.s00_seed_used}"
            if (self.var_api_use_s00_seed.get() and summary.s00_seed_used)
            else " | 每幕独立Seed"
        )
        anlas_tail = f" | 剩余: {sub_info.anlas_left} Anlas" if sub_info else ""
        meta = (
            f"{state_word} [{mode_label}]：成功 {summary.succeeded}/{summary.total_planned} 张"
            + (f"（失败 {fail_cnt} 张）" if fail_cnt else "")
            + f"{s00_note}  |  套图目录：{summary.output_dir}"
        )
        self.var_preview_meta.set(meta)
        self.var_status.set(f"{meta}{anlas_tail}")

        detail_msg = (
            f"{state_word}！\n\n"
            f"• 视角轨道：{mode_label}\n"
            f"• 成功出图：{summary.succeeded} / {summary.total_planned} 张\n"
            f"• Seed 记录：{'全程沿用 0号幕 Seed ' + str(summary.s00_seed_used) if (self.var_api_use_s00_seed.get() and summary.s00_seed_used) else '每幕独立随机 Seed'}\n"
            f"• 独立套图文件夹：\n  {summary.output_dir}\n"
            f"（提示：可直接点击「📁 文件夹批量放大另存」将该套图一键全套 2x 高清放大！）\n"
        )
        if summary.failed:
            preview_errs = "\n".join(f"  - {fn}: {er}" for fn, er in summary.failed[:5])
            detail_msg += f"\n⚠️ 失败项 ({fail_cnt} 张)：\n{preview_errs}\n"
        detail_msg += "\n是否立即打开本次生成的套图文件夹？"

        if messagebox.askyesno("批量连出结果", detail_msg, parent=self.root):
            try:
                os.startfile(summary.output_dir)
            except Exception:
                pass


def main() -> None:
    root = tk.Tk()
    StoryPromptGeneratorApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
