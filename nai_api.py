# -*- coding: utf-8 -*-
"""
NovelAI Diffusion V5 Full Medium 单张生图 API 客户端 (nai_api.py)
严格对齐 NovelAI 官方 Web 端 (novelai.net) params_version=4 请求规范：
- 锁定模型：nai-diffusion-5-full-medium（14 步 · k_euler_ancestral · karras · Medium 档）
- 单次单张：强制 n_samples=1，仅在用户手动点击时触发，杜绝后台连跑吞点数
- 自动适配：
  1. 支持单段 Prompt 或 [Base Prompt] + [Character N (坐标)] 多角色分区语法自动解析；
  2. 支持自动识别 NSFW 标签并从默认 Heavy UC 预设中移除冲突的 "nsfw"；
  3. 支持查询账户订阅等级、Opus V5 用量条状态与剩余 Anlas 点数；
  4. 原样保存服务端返回的无损 PNG 字节流（完整保留 NovelAI Comment / Source 元数据）。
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import UTC, datetime
from io import BytesIO
import json
import math
import os
import random
import re
import secrets
import string
import time
from typing import Any, Dict, List, Optional, Tuple
from zipfile import BadZipFile, ZipFile

import httpx

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
API_CONFIG_FILE = os.path.join(BASE_DIR, "nai_api_config.json")
DEFAULT_OUTPUT_DIR = os.path.join(BASE_DIR, "outputs")
T5_SPIECE_MODEL_FILE = os.path.join(BASE_DIR, "t5_spiece.model")
MAX_T5_TOKENS = 512

NAI_IMAGE_ENDPOINT = "https://image.novelai.net"
MODEL_V5_FULL_MEDIUM = "nai-diffusion-5-full-medium"

_T5_PROCESSOR: Any = None


def _get_t5_processor() -> Any:
    """懒加载本地 google-t5 SentencePiece 分词器（若缺失则回退到精准正则子词估算）"""
    global _T5_PROCESSOR
    if _T5_PROCESSOR is not None:
        return _T5_PROCESSOR
    if os.path.exists(T5_SPIECE_MODEL_FILE):
        try:
            import sentencepiece as spm  # type: ignore

            _T5_PROCESSOR = spm.SentencePieceProcessor(model_file=T5_SPIECE_MODEL_FILE)
            return _T5_PROCESSOR
        except Exception:
            _T5_PROCESSOR = False
    else:
        _T5_PROCESSOR = False
    return _T5_PROCESSOR


def _encode_t5_len(text: str) -> int:
    clean = text.strip(" ,")
    if not clean:
        return 0
    sp = _get_t5_processor()
    if sp:
        return len(sp.encode_as_pieces(clean))
    pieces = re.findall(r"[A-Za-z]+|\d+(?:\.\d+)?|[^\sA-Za-z0-9]", clean)
    return sum(max(1, (len(p) + 4) // 5) if p.isalpha() and len(p) > 7 else 1 for p in pieces)


def split_inline_negatives_from_caption(caption: str) -> Tuple[str, List[str]]:
    """
    将单框提示词中的内联负向块（如 `-2::tag1, tag2::`、`-2.5::...::`）剥离出来：
    - 返回 `(clean_positive_caption, extracted_negative_chunks)`；
    - API 发送时把负向块放入独立的 `v4_negative_prompt` 通道（拥有自己独立的 512 Token 预算），
      从而为正向框释放约 100~150 个 T5 Token！
    """
    neg_chunks: List[str] = []

    def _collect_neg(match: re.Match[str]) -> str:
        inner = match.group(2).strip(" ,")
        if inner:
            neg_chunks.append(inner)
        return ""

    cleaned = re.sub(
        r"(?:,\s*)?(-\d+(?:\.\d+)?)::(.*?)::",
        _collect_neg,
        caption,
        flags=re.DOTALL,
    )
    cleaned = re.sub(r"\s*,\s*,+", ", ", cleaned)
    cleaned = re.sub(r"^\s*,\s*|\s*,\s*$", "", cleaned).strip()
    return cleaned, neg_chunks


def count_prompt_t5_tokens(raw_prompt: str) -> Dict[str, Any]:
    """
    使用真实 T5 SentencePiece 分词器统计提示词 Token 占用：
    - `web_single_box_tokens`：若整段（含 `-2::...::` 内联负面）直接粘贴进网页单框的总 T5 Token 数；
    - `api_pos_tokens`：经 API 自动剥离负向块后，正向 `v4_prompt` 实际占用的 T5 Token 数（上限 512）；
    - `api_neg_tokens`：剥离出的内联负向词 + V5 Heavy UC 在负向通道占用的 T5 Token 数（独立上限 512）；
    - `exact_spiece`：是否使用了真实 `t5_spiece.model` 分词。
    """
    base_cap, char_caps, _ = parse_structured_prompt(raw_prompt)
    combined_raw = " ".join([base_cap] + [c["char_caption"] for c in char_caps]).strip()

    pos_chunks: List[str] = []
    neg_chunks: List[str] = []
    last = 0
    for m in re.finditer(r"(-?\d+(?:\.\d+)?)::(.*?)::", combined_raw, flags=re.DOTALL):
        before = combined_raw[last : m.start()].strip(" ,")
        if before:
            pos_chunks.append(before)
        w = float(m.group(1))
        body = m.group(2).strip(" ,")
        if body:
            if w < 0:
                neg_chunks.append(body)
            elif w > 0:
                pos_chunks.append(body)
        last = m.end()
    tail = combined_raw[last:].strip(" ,")
    if tail:
        pos_chunks.append(tail)

    pos_tok = (sum(_encode_t5_len(c) for c in pos_chunks) + 1) if pos_chunks else 0
    inline_neg_tok = sum(_encode_t5_len(c) for c in neg_chunks)
    web_box_tok = pos_tok + inline_neg_tok
    heavy_uc_tok = _encode_t5_len(V5_HEAVY_UC_BASE) + inline_neg_tok + 1
    return {
        "web_single_box_tokens": web_box_tok,
        "api_pos_tokens": pos_tok,
        "api_neg_tokens": heavy_uc_tok,
        "inline_neg_tokens": inline_neg_tok,
        "exact_spiece": bool(_get_t5_processor()),
    }

# V5 官方标准 Heavy 负面预设（当正向包含 nsfw / rating:explicit 时自动剥离前导 nsfw）
V5_HEAVY_UC_BASE = (
    "lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, "
    "jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, "
    "screentone, multiple views, logo, too many watermarks, negative space, blank page"
)

# V5 官方标准质量后缀（若提示词本身已带 masterpiece / best quality 则不重复追加）
V5_QUALITY_SUFFIX = "very aesthetic, masterpiece, no text"

# 画布预设映射
CANVAS_PRESETS: Dict[str, Optional[Tuple[int, int]]] = {
    "🔄 自动跟随本幕推荐画布": None,
    "📱 竖图 832x1216 (标准 Portrait)": (832, 1216),
    "🖥️ 横图 1216x832 (标准 Landscape)": (1216, 832),
    "⬛ 方图 1024x1024 (标准 Square)": (1024, 1024),
}

# 多角色坐标网格映射 (A1~E5 -> 0.1~0.9)
POSITION_GRID: Dict[str, Dict[str, float]] = {
    f"{col_ch}{row_idx}": {
        "x": round(0.1 + col_i * 0.2, 1),
        "y": round(0.1 + (row_idx - 1) * 0.2, 1),
    }
    for col_i, col_ch in enumerate("ABCDE")
    for row_idx in range(1, 6)
}

_CORR_ALPHABET = string.ascii_letters + string.digits


class NaiApiError(Exception):
    """NovelAI API 调用异常（包含友好的中文错误提示）"""

    def __init__(self, message: str, status_code: Optional[int] = None) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


@dataclass
class NaiApiSettings:
    """本地持久化的 API 配置（保存在 nai_api_config.json，已加入 .gitignore）"""

    api_token: str = ""
    canvas_preset: str = "🔄 自动跟随本幕推荐画布"
    scale: float = 6.0
    cfg_rescale: float = 0.0
    seed: int = -1
    use_s00_seed: bool = True
    extra_uc: str = ""
    append_v5_quality: bool = True
    proxy: str = ""
    output_dir: str = DEFAULT_OUTPUT_DIR


@dataclass
class SubscriptionInfo:
    """账户订阅与 Anlas 点数状态"""

    tier: int
    tier_name: str
    active: bool
    anlas_left: int
    fixed_anlas: int
    purchased_anlas: int
    opus_usage_percent: Optional[int] = None
    opus_usage_negative: bool = False


@dataclass
class GenerationResult:
    """单张图片生成结果"""

    image_bytes: bytes
    saved_path: str
    seed: int
    width: int
    height: int
    elapsed_sec: float
    estimated_anlas: int
    model: str = MODEL_V5_FULL_MEDIUM


def load_api_settings() -> NaiApiSettings:
    settings = NaiApiSettings()
    env_key = os.environ.get("NOVELAI_API_KEY", "").strip()
    if env_key:
        settings.api_token = env_key

    if not os.path.exists(API_CONFIG_FILE):
        return settings

    try:
        with open(API_CONFIG_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, dict):
            saved_token = str(data.get("api_token", "")).strip()
            if saved_token:
                settings.api_token = saved_token
            if data.get("canvas_preset") in CANVAS_PRESETS:
                settings.canvas_preset = data["canvas_preset"]
            if "scale" in data:
                settings.scale = float(data["scale"])
            if "cfg_rescale" in data:
                settings.cfg_rescale = float(data["cfg_rescale"])
            if "seed" in data:
                settings.seed = int(data["seed"])
            if "use_s00_seed" in data:
                settings.use_s00_seed = bool(data["use_s00_seed"])
            if "extra_uc" in data:
                settings.extra_uc = str(data["extra_uc"])
            if "append_v5_quality" in data:
                settings.append_v5_quality = bool(data["append_v5_quality"])
            if "proxy" in data:
                settings.proxy = str(data["proxy"]).strip()
            if data.get("output_dir"):
                settings.output_dir = str(data["output_dir"])
    except Exception:
        pass
    return settings


def save_api_settings(settings: NaiApiSettings) -> None:
    data = asdict(settings)
    with open(API_CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def parse_canvas_size(canvas_hint: str, canvas_preset: str) -> Tuple[int, int]:
    """根据用户下拉框选择或当前幕的推荐画布文本自动解析 (width, height)"""
    override = CANVAS_PRESETS.get(canvas_preset)
    if override is not None:
        return override

    m = re.search(r"(\d{3,4})\s*[xX×]\s*(\d{3,4})", canvas_hint or "")
    if m:
        w, h = int(m.group(1)), int(m.group(2))
        w = max(64, (w // 64) * 64)
        h = max(64, (h // 64) * 64)
        return w, h
    return 832, 1216


def estimate_v5_medium_anlas(
    width: int,
    height: int,
    steps: int = 14,
    is_opus_free_eligible: bool = False,
) -> int:
    """按照 NovelAI 官方前端公式估算 V5 Full Medium 单张 Anlas 消耗"""
    pixels = width * height
    if is_opus_free_eligible and pixels <= 1048576 and steps <= 28:
        return 0
    step_factor = 1.0 / 1.06521739
    base_cost = math.ceil(
        2951823174884865e-21 * pixels + 5753298233447344e-22 * pixels * steps * step_factor
    )
    v5_cost = base_cost * 1.5
    return max(math.ceil(v5_cost), 2)


def extract_prompt_blocks_from_preview(raw_text: str) -> List[Tuple[str, str]]:
    """
    从右侧「单幕精细预览」文本框中解析所有 `## 标题` 分隔的提示词块，返回 [(标题, 提示词正文), ...]。
    若用户删除了 `##` 标题直接手写纯提示词，则作为单个块返回。
    """
    lines = raw_text.splitlines()
    blocks: List[Tuple[str, List[str]]] = []
    current_title = "默认单幕提示词"
    current_lines: List[str] = []

    for line in lines:
        stripped = line.strip()
        if stripped.startswith("## "):
            if current_lines and any(x.strip() for x in current_lines):
                blocks.append((current_title, current_lines))
            current_title = stripped[3:].rstrip("：:").strip()
            current_lines = []
            continue
        if stripped.startswith("# ") or stripped.startswith("#=="):
            continue
        current_lines.append(line)

    if current_lines and any(x.strip() for x in current_lines):
        blocks.append((current_title, current_lines))

    return [(title, "\n".join(body).strip()) for title, body in blocks if "\n".join(body).strip()]


def extract_first_prompt_from_preview(raw_text: str, block_index: int = 0) -> str:
    """
    从右侧「单幕精细预览」文本框中提取指定序号（默认第 0 条）的可生成提示词块：
    - 自动跳过 `## 【Sxx ...】（推荐画布：...）：` 标题行与 `#` 注释行；
    - 当拆成前后两张单图或开启子变体时，可通过 block_index 选择跑第 1 张还是第 2 张；
    - 完整保留 `[Base Prompt]: ... [Character 1 (A3)]: ...` 多角色分区结构。
    """
    blocks = extract_prompt_blocks_from_preview(raw_text)
    if not blocks:
        return ""
    idx = max(0, min(block_index, len(blocks) - 1))
    return blocks[idx][1]


def parse_structured_prompt(raw_prompt: str) -> Tuple[str, List[Dict[str, Any]], bool]:
    """
    解析普通单段提示词或 `[Base Prompt]` + `[Character N (坐标)]` 多角色分区提示词。
    返回: (base_caption, char_captions_list, use_coords)
    """
    text = raw_prompt.strip()
    if "[Base Prompt]" not in text:
        return text, [], False

    pattern = re.compile(
        r"\[(Base Prompt|Character\s*\d+(?:\s*\(([A-Ea-e][1-5])\))?)\]\s*:?\s*",
        re.MULTILINE,
    )
    matches = list(pattern.finditer(text))
    if not matches:
        return text, [], False

    base_caption = ""
    char_captions: List[Dict[str, Any]] = []
    use_coords = False

    for idx, match in enumerate(matches):
        header = match.group(1)
        coord_code = (match.group(2) or "").upper()
        start = match.end()
        end = matches[idx + 1].start() if idx + 1 < len(matches) else len(text)
        body = text[start:end].strip()
        if not body:
            continue

        if header.lower().startswith("base prompt"):
            base_caption = body
        else:
            if coord_code and coord_code in POSITION_GRID:
                center = POSITION_GRID[coord_code]
                use_coords = True
            else:
                center = {"x": 0, "y": 0}
            char_captions.append(
                {
                    "char_caption": body,
                    "centers": [center],
                }
            )

    return base_caption or text, char_captions, use_coords


def _normalize_token(raw_token: str) -> str:
    token = raw_token.strip()
    if token.lower().startswith("bearer "):
        token = token[7:].strip()
    return token


def _build_browser_headers(token: str, content_type: Optional[str] = None) -> Dict[str, str]:
    corr_id = "".join(secrets.choice(_CORR_ALPHABET) for _ in range(6))
    initiated_at = datetime.now(UTC).isoformat(timespec="milliseconds").replace("+00:00", "Z")
    headers = {
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Authorization": f"Bearer {token}",
        "Cache-Control": "no-cache",
        "Origin": "https://novelai.net",
        "Pragma": "no-cache",
        "Referer": "https://novelai.net/",
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36"
        ),
        "x-correlation-id": corr_id,
        "x-initiated-at": initiated_at,
    }
    if content_type:
        headers["Content-Type"] = content_type
    return headers


def _build_multipart_body(request_dict: Dict[str, Any]) -> Tuple[bytes, str]:
    """构建 NovelAI params_version=4 标准 multipart/form-data 请求体"""
    boundary = "----WebKitFormBoundary" + "".join(random.choices(_CORR_ALPHABET, k=16))
    request_json = json.dumps(request_dict, ensure_ascii=False).encode("utf-8")
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="request"; filename="blob"\r\n'
        f"Content-Type: application/json\r\n\r\n"
    ).encode("utf-8") + request_json + f"\r\n--{boundary}--\r\n".encode("utf-8")
    return body, f"multipart/form-data; boundary={boundary}"


def build_v5_medium_payload(
    raw_prompt: str,
    width: int = 832,
    height: int = 1216,
    scale: float = 6.0,
    cfg_rescale: float = 0.0,
    seed: int = -1,
    extra_uc: str = "",
    append_v5_quality: bool = True,
) -> Tuple[Dict[str, Any], int]:
    """
    构建严格符合 NovelAI V5 Full Medium (14 steps, k_euler_ancestral, karras, n_samples=1) 的请求字典。
    返回: (payload_dict, actual_seed)
    """
    if width % 64 != 0 or height % 64 != 0:
        raise NaiApiError(f"分辨率必须为 64 的整数倍，当前为 {width}x{height}")

    base_caption, char_captions, use_coords = parse_structured_prompt(raw_prompt)
    if not base_caption.strip():
        raise NaiApiError("提示词内容为空，无法发起生图请求。")

    # 自动剥离内联负向块（-2::...::）转入独立的 v4_negative_prompt 通道，为正向框释放 100~150 个 T5 Token
    # M6-Tune2 特例：Medium 模型仅在器官抑制块保留在正向 base_caption 内联时才生效，因此将其原样留在 base_caption
    base_caption_inline_kept = ""
    m_tune2_inline = re.search(
        r"(?:,\s*)?(-2\.5::(?:(?!::).)*?nose bridge,\s*nostrils,\s*lips(?:(?!::).)*?::)",
        base_caption,
        flags=re.DOTALL,
    )
    if m_tune2_inline:
        base_caption_inline_kept = m_tune2_inline.group(1).strip()
        base_caption = (base_caption[: m_tune2_inline.start()] + base_caption[m_tune2_inline.end() :]).strip(" ,")
    base_caption, base_inline_negs = split_inline_negatives_from_caption(base_caption)
    if base_caption_inline_kept:
        base_caption = f"{base_caption.rstrip(', ')}, {base_caption_inline_kept}"
    char_inline_negs_list: List[List[str]] = []
    cleaned_char_captions: List[Dict[str, Any]] = []
    for c in char_captions:
        clean_cc, cc_negs = split_inline_negatives_from_caption(c["char_caption"])
        cleaned_char_captions.append({"char_caption": clean_cc, "centers": c["centers"]})
        char_inline_negs_list.append(cc_negs)
    char_captions = cleaned_char_captions

    # 若启用 V5 质量后缀，且提示词中尚未包含核心质量词（且非像素画风 / R5 纯单反实拍去滤镜模式），则温和补充在尾部
    lower_check = base_caption.lower()
    has_quality_already = any(
        kw in lower_check for kw in ("masterpiece", "very aesthetic", "best quality")
    )
    suppress_anime_quality = any(
        kw in lower_check
        for kw in ("pixel art", "raw photo", "gravure", "2.8::photorealistic::", "no lineart")
    )
    use_std_quality_preset = bool(append_v5_quality and not suppress_anime_quality)
    if use_std_quality_preset and not has_quality_already:
        base_caption = f"{base_caption.rstrip(', ')}, {V5_QUALITY_SUFFIX}"

    # 处理 V5 Medium 固定的 Heavy UC 预设（若正向包含 nsfw/explicit，自动移除负向预设开头的 nsfw）
    full_pos_lower = (
        base_caption + " " + " ".join(c["char_caption"] for c in char_captions)
    ).lower()
    wants_nsfw = any(
        tag in full_pos_lower for tag in ("nsfw", "rating:explicit", "uncensored", "nude", "pussy", "penis")
    )
    uc_parts = []
    if not wants_nsfw:
        uc_parts.append("nsfw")
    uc_parts.append(V5_HEAVY_UC_BASE)
    if base_inline_negs:
        uc_parts.extend(base_inline_negs)
    if extra_uc.strip():
        uc_parts.append(extra_uc.strip())
    negative_prompt = ", ".join(uc_parts)

    actual_seed = (
        int(seed)
        if (isinstance(seed, int) and 0 < seed <= 4294967288)
        else random.randint(1, 4294967288)
    )
    clean_scale = round(max(0.0, min(10.0, float(scale))), 1)
    clean_rescale = round(max(0.0, min(1.0, float(cfg_rescale))), 2)

    character_prompts_api = [
        {
            "prompt": c["char_caption"],
            "uc": ", ".join(char_inline_negs_list[i]) if i < len(char_inline_negs_list) else "",
            "center": c["centers"][0],
            "enabled": True,
        }
        for i, c in enumerate(char_captions)
    ]
    neg_char_captions = [
        {
            "char_caption": ", ".join(char_inline_negs_list[i]) if i < len(char_inline_negs_list) else "",
            "centers": c["centers"],
        }
        for i, c in enumerate(char_captions)
    ]

    parameters: Dict[str, Any] = {
        "params_version": 4,
        "width": width,
        "height": height,
        "scale": clean_scale,
        "sampler": "k_euler_ancestral",
        "steps": 14,  # V5 Full Medium 锁定 14 步
        "n_samples": 1,  # 严格单次生成 1 张
        "ucPresetId": "heavy",  # V5 Full Medium 锁定 heavy 预设槽位
        "qualityPresetId": "standard" if use_std_quality_preset else "none",
        "autoSmea": False,
        "dynamic_thresholding": False,
        "controlnet_strength": 1.0,
        "legacy": False,
        "add_original_image": True,
        "cfg_rescale": clean_rescale,
        "noise_schedule": "karras",
        "legacy_v3_extend": False,
        "skip_cfg_above_sigma": None,
        "use_coords": use_coords,
        "legacy_uc": False,
        "normalize_reference_strength_multiple": True,
        "inpaintImg2ImgStrength": 1.0,
        "seed": actual_seed,
        "characterPrompts": character_prompts_api,
        "straight_alpha": True,
        "tag_hint_qt": 1,
        "tag_hint_transparent_background": True if "transparent background" in base_caption.lower() else None,
        "tag_hint_uc_preset": 2,
        "v4_prompt": {
            "caption": {
                "base_caption": base_caption,
                "char_captions": char_captions,
            },
            "use_coords": use_coords,
            "use_order": True,
        },
        "v4_negative_prompt": {
            "caption": {
                "base_caption": negative_prompt,
                "char_captions": neg_char_captions,
            },
            "legacy_uc": False,
        },
        "negative_prompt": negative_prompt,
        "deliberate_euler_ancestral_bug": False,
        "prefer_brownian": True,
        "image_format": "png",
    }

    payload: Dict[str, Any] = {
        "input": base_caption,
        "model": MODEL_V5_FULL_MEDIUM,
        "action": "generate",
        "parameters": parameters,
        "use_new_shared_trial": False,
    }
    return payload, actual_seed


def _create_http_client(proxy: str = "", timeout_sec: float = 120.0) -> httpx.Client:
    clean_proxy = proxy.strip() or None
    return httpx.Client(
        proxy=clean_proxy,
        timeout=httpx.Timeout(timeout_sec, connect=20.0),
        trust_env=not bool(clean_proxy),
        follow_redirects=True,
    )


def _format_api_error(status_code: int, raw_body: bytes) -> NaiApiError:
    msg = ""
    try:
        parsed = json.loads(raw_body.decode("utf-8", errors="replace"))
        if isinstance(parsed, dict):
            msg = str(parsed.get("message") or parsed.get("error") or "")
    except Exception:
        msg = raw_body[:240].decode("utf-8", errors="replace").strip()

    if status_code == 401:
        return NaiApiError(
            f"认证失败 (HTTP 401)：API Token 无效或已过期。请在 NovelAI 网页端 User Settings -> Account -> Get Persistent API Token 获取以 pst- 开头的令牌。({msg})",
            status_code=401,
        )
    if status_code == 402:
        return NaiApiError(
            f"点数或订阅不足 (HTTP 402)：当前账户 Anlas 点数不足以支付本次生成。({msg})",
            status_code=402,
        )
    if status_code == 429:
        return NaiApiError(
            f"并发请求受限 (HTTP 429)：NovelAI 同一账号同一时刻仅允许生成 1 张图，请稍候几秒再试。({msg})",
            status_code=429,
        )
    return NaiApiError(
        f"NovelAI 服务端返回错误 (HTTP {status_code})：{msg or '未知错误'}",
        status_code=status_code,
    )


def _unpack_image_bytes(content: bytes) -> bytes:
    """从 NovelAI 响应字节流中提取单张图片（支持直接 PNG/WebP 响应或标准 ZIP 包）"""
    if content[:8] == b"\x89PNG\r\n\x1a\n":
        return content
    if content[:4] == b"RIFF" and content[8:12] == b"WEBP":
        return content
    if content[:3] == b"\xff\xd8\xff":
        return content

    try:
        with ZipFile(BytesIO(content)) as zf:
            names = zf.namelist()
            if not names:
                raise NaiApiError("NovelAI 返回的 ZIP 压缩包为空，未找到生成的图片。")
            return zf.read(names[0])
    except BadZipFile as exc:
        preview = content[:180].decode("utf-8", errors="replace")
        raise NaiApiError(f"无法解析服务端返回的图片数据：{preview}") from exc


def fetch_subscription_info(api_token: str, proxy: str = "") -> SubscriptionInfo:
    """查询当前 Persistent API Token 对应的订阅状态与剩余 Anlas 点数"""
    token = _normalize_token(api_token)
    if not token:
        raise NaiApiError("请先填写 NovelAI Persistent API Token（以 pst- 开头）。")

    url = f"{NAI_IMAGE_ENDPOINT}/user/subscription"
    headers = _build_browser_headers(token)

    try:
        with _create_http_client(proxy=proxy, timeout_sec=25.0) as client:
            resp = client.get(url, headers=headers)
    except httpx.RequestError as exc:
        raise NaiApiError(f"网络连接失败，请检查网络或代理设置：{exc}") from exc

    if resp.status_code >= 400:
        raise _format_api_error(resp.status_code, resp.content)

    try:
        data = resp.json()
    except Exception as exc:
        raise NaiApiError(f"解析账户信息 JSON 失败：{exc}") from exc

    tier = int(data.get("tier", 0) or 0)
    tier_name = {0: "Paper (免费层)", 1: "Tablet", 2: "Scroll", 3: "Opus"}.get(tier, f"Tier-{tier}")
    active = bool(data.get("active", False))
    steps_left = data.get("trainingStepsLeft") or {}
    fixed_anlas = int(steps_left.get("fixedTrainingStepsLeft", 0) or 0)
    purchased_anlas = int(steps_left.get("purchasedTrainingSteps", 0) or 0)

    usage = data.get("usage")
    opus_pct: Optional[int] = None
    opus_neg = False
    if isinstance(usage, dict):
        opus_pct = int(usage.get("percent", 0) or 0)
        opus_neg = bool(usage.get("isNegative", False))

    return SubscriptionInfo(
        tier=tier,
        tier_name=tier_name,
        active=active,
        anlas_left=fixed_anlas + purchased_anlas,
        fixed_anlas=fixed_anlas,
        purchased_anlas=purchased_anlas,
        opus_usage_percent=opus_pct,
        opus_usage_negative=opus_neg,
    )


def generate_single_image_v5_medium(
    api_token: str,
    prompt_text: str,
    *,
    width: int = 832,
    height: int = 1216,
    scale: float = 6.0,
    cfg_rescale: float = 0.0,
    seed: int = -1,
    extra_uc: str = "",
    append_v5_quality: bool = True,
    proxy: str = "",
    output_dir: str = DEFAULT_OUTPUT_DIR,
    custom_target_dir: Optional[str] = None,
    scene_id: str = "S00",
    perspective_mode: str = "pov",
) -> GenerationResult:
    """
    发起单张 NovelAI V5 Full Medium 生图请求，并将原始无损 PNG 落盘保存。
    """
    token = _normalize_token(api_token)
    if not token:
        raise NaiApiError("未填写 API Token！请先在左侧「🚀 API 单张生图」标签页输入 Persistent API Token (pst-...)")

    payload, actual_seed = build_v5_medium_payload(
        raw_prompt=prompt_text,
        width=width,
        height=height,
        scale=scale,
        cfg_rescale=cfg_rescale,
        seed=seed,
        extra_uc=extra_uc,
        append_v5_quality=append_v5_quality,
    )
    body, content_type = _build_multipart_body(payload)
    headers = _build_browser_headers(token, content_type=content_type)
    url = f"{NAI_IMAGE_ENDPOINT}/ai/generate-image"

    t0 = time.perf_counter()
    try:
        with _create_http_client(proxy=proxy, timeout_sec=150.0) as client:
            resp = client.post(url, content=body, headers=headers)
    except httpx.RequestError as exc:
        raise NaiApiError(f"生图请求网络异常（未成功连接或超时）：{exc}") from exc

    if resp.status_code >= 400:
        raise _format_api_error(resp.status_code, resp.content)

    image_bytes = _unpack_image_bytes(resp.content)
    elapsed = round(time.perf_counter() - t0, 2)

    if custom_target_dir:
        target_dir = custom_target_dir
    else:
        date_folder = datetime.now().strftime("%Y%m%d")
        target_dir = os.path.join(output_dir or DEFAULT_OUTPUT_DIR, date_folder)
    os.makedirs(target_dir, exist_ok=True)

    safe_scene = re.sub(r"[^A-Za-z0-9_-]", "", scene_id or "Custom") or "Custom"
    safe_mode = "POV" if perspective_mode == "pov" else "3rd"
    timestamp = datetime.now().strftime("%H%M%S")
    ext = ".webp" if (image_bytes[:4] == b"RIFF" and image_bytes[8:12] == b"WEBP") else ".png"
    filename = f"{safe_scene}_{safe_mode}_s{actual_seed}_{timestamp}{ext}"
    saved_path = os.path.join(target_dir, filename)

    with open(saved_path, "wb") as f:
        f.write(image_bytes)

    est_cost = estimate_v5_medium_anlas(width, height, steps=14, is_opus_free_eligible=False)
    return GenerationResult(
        image_bytes=image_bytes,
        saved_path=saved_path,
        seed=actual_seed,
        width=width,
        height=height,
        elapsed_sec=elapsed,
        estimated_anlas=est_cost,
    )


@dataclass
class SceneBatchTask:
    """批量故事线连出单张任务描述"""

    scene_id: str  # 如 "S00", "S01", "S03_P1"
    base_chapter_id: str  # 如 "S00", "S01", "S03"
    title: str
    prompt_text: str
    width: int
    height: int


@dataclass
class BatchGenerateSummary:
    """批量故事线连出结果汇总"""

    output_dir: str
    total_planned: int
    succeeded: int
    failed: List[Tuple[str, str]]
    cancelled: bool
    s00_seed_used: Optional[int] = None
    results: Optional[List[GenerationResult]] = None
    last_result: Optional[GenerationResult] = None


def batch_generate_scenes_v5_medium(
    api_token: str,
    tasks: List[SceneBatchTask],
    *,
    scale: float = 6.0,
    cfg_rescale: float = 0.0,
    initial_seed: int = -1,
    use_s00_seed: bool = True,
    fallback_s00_seed: Optional[int] = None,
    extra_uc: str = "",
    append_v5_quality: bool = True,
    proxy: str = "",
    output_dir: str = DEFAULT_OUTPUT_DIR,
    perspective_mode: str = "pov",
    suite_tag: str = "",
    on_progress: Optional[Any] = None,
    cancel_check: Optional[Any] = None,
) -> BatchGenerateSummary:
    """
    串行批量生成全套 12 幕（或选定章节）V5 Full Medium 图片：
    - Seed 控制逻辑：
      1. 若 `use_s00_seed=True`（勾选「使用 0 号幕 Seed」）：
         - 当列表含 S00 时，S00 使用 `initial_seed`（填 -1 则先随机摇出一个新 Seed，填固定正数则使用该数），
           随后 S01~S11 自动锁定沿用 S00 实际产出的 Seed；
         - 当列表不含 S00（仅勾选后续幕次）时，优先使用固定正数 `initial_seed`，否则使用 `fallback_s00_seed`（最近一次生成的 S00 Seed），
           若均无则由本批第 1 幕产出的 Seed 统一锁定后续幕次。
      2. 若 `use_s00_seed=False`（未勾选「使用 0 号幕 Seed」）：
         - S00 使用 `initial_seed`，后续所有非 S00 幕次均各自独立随机 Seed (-1)，互不绑定。
    - 防限流保护：严格单张串行发送，遇到 HTTP 429 自动退避重试一次，遇到 401/402 立即安全终止。
    """
    token = _normalize_token(api_token)
    if not token:
        raise NaiApiError("未填写 API Token！请先在左侧「🚀 API生图」填入 Persistent API Token (pst-...)")
    if not tasks:
        raise NaiApiError("待生成的章节任务列表为空！")

    date_folder = datetime.now().strftime("%Y%m%d")
    safe_mode = "POV" if perspective_mode == "pov" else "3rd"
    safe_tag = re.sub(r"[^A-Za-z0-9_-]", "", suite_tag)[:24]
    tag_part = f"_{safe_tag}" if safe_tag else ""
    run_stamp = datetime.now().strftime("%H%M%S")
    suite_dir = os.path.join(
        output_dir or DEFAULT_OUTPUT_DIR,
        date_folder,
        f"suite_{safe_mode}{tag_part}_{run_stamp}",
    )
    os.makedirs(suite_dir, exist_ok=True)

    locked_s00_seed: Optional[int] = None
    if use_s00_seed:
        if isinstance(initial_seed, int) and 0 < initial_seed <= 4294967288:
            locked_s00_seed = initial_seed
        elif not any(t.base_chapter_id == "S00" for t in tasks) and fallback_s00_seed:
            locked_s00_seed = int(fallback_s00_seed)

    succeeded = 0
    failed: List[Tuple[str, str]] = []
    results: List[GenerationResult] = []
    last_res: Optional[GenerationResult] = None
    cancelled = False
    total = len(tasks)

    for idx, task in enumerate(tasks, start=1):
        if callable(cancel_check) and cancel_check():
            cancelled = True
            break

        # 决定当前幕使用的 Seed
        if task.base_chapter_id == "S00":
            cur_seed = locked_s00_seed if (use_s00_seed and locked_s00_seed is not None) else initial_seed
        else:
            if use_s00_seed:
                cur_seed = locked_s00_seed if locked_s00_seed is not None else initial_seed
            else:
                cur_seed = -1

        if callable(on_progress):
            on_progress("start", idx, total, task, cur_seed, locked_s00_seed, last_res)

        res: Optional[GenerationResult] = None
        for attempt in range(2):
            try:
                res = generate_single_image_v5_medium(
                    api_token=token,
                    prompt_text=task.prompt_text,
                    width=task.width,
                    height=task.height,
                    scale=scale,
                    cfg_rescale=cfg_rescale,
                    seed=cur_seed,
                    extra_uc=extra_uc,
                    append_v5_quality=append_v5_quality,
                    proxy=proxy,
                    output_dir=output_dir,
                    custom_target_dir=suite_dir,
                    scene_id=task.scene_id,
                    perspective_mode=perspective_mode,
                )
                break
            except NaiApiError as exc:
                if exc.status_code == 429 and attempt == 0:
                    time.sleep(3.0)
                    continue
                if exc.status_code in (401, 402):
                    failed.append((task.scene_id, exc.message))
                    return BatchGenerateSummary(
                        output_dir=suite_dir,
                        total_planned=total,
                        succeeded=succeeded,
                        failed=failed,
                        cancelled=False,
                        s00_seed_used=locked_s00_seed,
                        results=results,
                        last_result=last_res,
                    )
                failed.append((task.scene_id, exc.message))
                break
            except Exception as exc:
                failed.append((task.scene_id, str(exc)))
                break

        if res is not None:
            succeeded += 1
            results.append(res)
            last_res = res
            if task.base_chapter_id == "S00":
                locked_s00_seed = res.seed
            elif use_s00_seed and locked_s00_seed is None:
                locked_s00_seed = res.seed

            if callable(on_progress):
                on_progress("done", idx, total, task, res.seed, locked_s00_seed, res)

        if idx < total:
            if callable(cancel_check) and cancel_check():
                cancelled = True
                break
            time.sleep(0.45)

    return BatchGenerateSummary(
        output_dir=suite_dir,
        total_planned=total,
        succeeded=succeeded,
        failed=failed,
        cancelled=cancelled,
        s00_seed_used=locked_s00_seed,
        results=results,
        last_result=last_res,
    )


@dataclass
class UpscaleResult:
    """NovelAI 官方 1 点数独立高清放大 (Upscaler) 结果"""

    image_bytes: bytes
    saved_path: str
    src_width: int
    src_height: int
    out_width: int
    out_height: int
    elapsed_sec: float
    anlas_cost: int = 1


def _build_upscale_multipart_body(image_bytes: bytes, model: str = MODEL_V5_FULL_MEDIUM) -> Tuple[bytes, str]:
    """构建 NovelAI 官方 /ai/upscale 所需的双段 multipart/form-data 请求体"""
    boundary = "----WebKitFormBoundary" + "".join(random.choices(_CORR_ALPHABET, k=16))
    req_json = json.dumps(
        {
            "image": "image",
            "model": model,
            "declared_blur_sigma": 0,
        },
        ensure_ascii=False,
    ).encode("utf-8")

    part_img = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="image"; filename="blob"\r\n'
        f"Content-Type: image/png\r\n\r\n"
    ).encode("utf-8") + image_bytes + b"\r\n"
    part_req = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="request"; filename="blob"\r\n'
        f"Content-Type: application/json\r\n\r\n"
    ).encode("utf-8") + req_json + b"\r\n"
    tail = f"--{boundary}--\r\n".encode("utf-8")
    return part_img + part_req + tail, f"multipart/form-data; boundary={boundary}"


def upscale_single_image_nai(
    api_token: str,
    source_image_path: str,
    *,
    proxy: str = "",
    output_dir: Optional[str] = None,
) -> UpscaleResult:
    """
    调用 NovelAI 官方独立 Upscaler 接口 (`POST https://image.novelai.net/ai/upscale`)：
    - 消耗：固定 1 Anlas 点数（不重绘改变画面内容，纯超分清晰放大 2x，例如 832x1216 -> 1664x2432）；
    - 保存：默认保存在原图同目录下，文件名追加 `_upscaled_WxH.png`。
    """
    token = _normalize_token(api_token)
    if not token:
        raise NaiApiError("未填写 API Token！请先在左侧「🚀 API生图」填入 Persistent API Token (pst-...)")
    if not source_image_path or not os.path.exists(source_image_path):
        raise NaiApiError(f"找不到待放大的本地图片文件：{source_image_path}")

    from PIL import Image

    with open(source_image_path, "rb") as f:
        raw_bytes = f.read()

    with Image.open(BytesIO(raw_bytes)) as src_im:
        src_w, src_h = src_im.size
        if src_w * src_h > 1600 * 1600:
            raise NaiApiError(
                f"当前图片分辨率已达 {src_w}×{src_h}（已放大过或超出官方 Upscaler 输入上限），无需重复放大。"
            )
        if src_im.format != "PNG":
            buf = BytesIO()
            src_im.save(buf, format="PNG")
            raw_bytes = buf.getvalue()

    body, content_type = _build_upscale_multipart_body(raw_bytes, model=MODEL_V5_FULL_MEDIUM)
    headers = _build_browser_headers(token, content_type=content_type)
    url = f"{NAI_IMAGE_ENDPOINT}/ai/upscale"

    t0 = time.perf_counter()
    try:
        with _create_http_client(proxy=proxy, timeout_sec=150.0) as client:
            resp = client.post(url, content=body, headers=headers)
    except httpx.RequestError as exc:
        raise NaiApiError(f"Upscale 放大请求网络异常：{exc}") from exc

    if resp.status_code >= 400:
        raise _format_api_error(resp.status_code, resp.content)

    out_bytes = _unpack_image_bytes(resp.content)
    elapsed = round(time.perf_counter() - t0, 2)

    with Image.open(BytesIO(out_bytes)) as out_im:
        out_w, out_h = out_im.size

    target_folder = output_dir or os.path.dirname(os.path.abspath(source_image_path))
    os.makedirs(target_folder, exist_ok=True)
    stem, _ = os.path.splitext(os.path.basename(source_image_path))
    ext = ".webp" if (out_bytes[:4] == b"RIFF" and out_bytes[8:12] == b"WEBP") else ".png"
    out_name = f"{stem}_upscaled_{out_w}x{out_h}{ext}"
    saved_path = os.path.join(target_folder, out_name)

    with open(saved_path, "wb") as f:
        f.write(out_bytes)

    return UpscaleResult(
        image_bytes=out_bytes,
        saved_path=saved_path,
        src_width=src_w,
        src_height=src_h,
        out_width=out_w,
        out_height=out_h,
        elapsed_sec=elapsed,
        anlas_cost=1,
    )


@dataclass
class FolderUpscalePlan:
    """文件夹批量 Upscale 预扫描计划"""

    source_dir: str
    output_dir: str
    pending_files: List[str]
    skipped_already_done: int
    skipped_oversized: int


@dataclass
class BatchUpscaleSummary:
    """文件夹批量 Upscale 执行汇总"""

    source_dir: str
    output_dir: str
    total_planned: int
    succeeded: int
    failed: List[Tuple[str, str]]
    cancelled: bool
    last_result: Optional[UpscaleResult] = None


def scan_folder_for_upscale(source_dir: str, output_dir: str) -> FolderUpscalePlan:
    """
    扫描指定源文件夹中的待放大图片，自动过滤：
    1. 文件名已含 `_upscaled_` 的放大成品；
    2. 分辨率 > 1600×1600（已放大过或超过官方 Upscaler 单张上限）的图片；
    3. 目标输出目录中已经存在对应 `<stem>_upscaled_*` 的图片（支持断点续传不重扣点数）。
    """
    if not source_dir or not os.path.isdir(source_dir):
        raise NaiApiError(f"源图片文件夹不存在：{source_dir}")

    from PIL import Image

    src_abs = os.path.abspath(source_dir)
    out_abs = os.path.abspath(output_dir)
    valid_exts = {".png", ".webp", ".jpg", ".jpeg"}

    existing_stems: set[str] = set()
    if os.path.isdir(out_abs):
        for fn in os.listdir(out_abs):
            m = re.match(r"^(.+)_upscaled_\d+x\d+\.[A-Za-z0-9]+$", fn, flags=re.IGNORECASE)
            if m:
                existing_stems.add(m.group(1).lower())

    pending: List[str] = []
    skipped_done = 0
    skipped_big = 0

    for entry in sorted(os.listdir(src_abs)):
        full_p = os.path.join(src_abs, entry)
        if not os.path.isfile(full_p):
            continue
        stem, ext = os.path.splitext(entry)
        if ext.lower() not in valid_exts:
            continue
        if "_upscaled_" in stem.lower() or stem.lower() in existing_stems:
            skipped_done += 1
            continue
        try:
            with Image.open(full_p) as im:
                w, h = im.size
            if w * h > 1600 * 1600:
                skipped_big += 1
                continue
        except Exception:
            continue
        pending.append(full_p)

    return FolderUpscalePlan(
        source_dir=src_abs,
        output_dir=out_abs,
        pending_files=pending,
        skipped_already_done=skipped_done,
        skipped_oversized=skipped_big,
    )


def batch_upscale_folder_nai(
    api_token: str,
    plan: FolderUpscalePlan,
    *,
    proxy: str = "",
    on_progress: Optional[Any] = None,
    cancel_check: Optional[Any] = None,
) -> BatchUpscaleSummary:
    """
    按预扫描计划逐张串行执行 1 点数官方 Upscale（自动规避 HTTP 429 并发限制），
    并将所有放大后的高清图统一另存到 `plan.output_dir`。
    """
    os.makedirs(plan.output_dir, exist_ok=True)
    succeeded = 0
    failed: List[Tuple[str, str]] = []
    cancelled = False
    last_res: Optional[UpscaleResult] = None
    total = len(plan.pending_files)

    for idx, src_path in enumerate(plan.pending_files, start=1):
        if callable(cancel_check) and cancel_check():
            cancelled = True
            break

        fname = os.path.basename(src_path)
        if callable(on_progress):
            on_progress(idx, total, fname, last_res)

        try:
            res = upscale_single_image_nai(
                api_token=api_token,
                source_image_path=src_path,
                proxy=proxy,
                output_dir=plan.output_dir,
            )
            succeeded += 1
            last_res = res
        except NaiApiError as exc:
            # 遇到 429 限流时自动退避重试一次
            if exc.status_code == 429:
                time.sleep(2.5)
                try:
                    res = upscale_single_image_nai(
                        api_token=api_token,
                        source_image_path=src_path,
                        proxy=proxy,
                        output_dir=plan.output_dir,
                    )
                    succeeded += 1
                    last_res = res
                    continue
                except Exception as retry_exc:
                    err_txt = retry_exc.message if isinstance(retry_exc, NaiApiError) else str(retry_exc)
                    failed.append((fname, err_txt))
            elif exc.status_code in (401, 402):
                failed.append((fname, exc.message))
                break
            else:
                failed.append((fname, exc.message))
        except Exception as exc:
            failed.append((fname, str(exc)))

        if idx < total:
            time.sleep(0.35)

    return BatchUpscaleSummary(
        source_dir=plan.source_dir,
        output_dir=plan.output_dir,
        total_planned=total,
        succeeded=succeeded,
        failed=failed,
        cancelled=cancelled,
        last_result=last_res,
    )
