# -*- coding: utf-8 -*-
"""
固化的多角度 SFW 9图套组批量生成器 (multi_angle_sfw_batch.py)
包含：1张正/侧/背三视图 + 8张不同角度与姿势的 SFW 常规图（仰视/俯视/侧逆光/回头/伸懒腰/侧躺/特写/盘腿托腮）。
默认使用从 favorite/00_Pure2_165_3D_POV_s2026111255_202023.png 提取的零油画感 Pure2_165 配方，
全程严格锁定 Opus 免费额度（14 steps, n_samples=1, 像素 <= 1,048,576, 0 Anlas）。
"""

from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path
from typing import Dict, List

REPO_DIR = Path(__file__).resolve().parent
if str(REPO_DIR) not in sys.path:
    sys.path.insert(0, str(REPO_DIR))

import nai_api  # noqa: E402
import story_engine  # noqa: E402

M6_STYLE_KEY = "🌤️ 柔雾白纱晨光 · 无描边暖杏真肤二次元萌脸（M6 保留款 · 自然光真肤）"
M6_HEAD_POS, M6_STYLE_NEG = story_engine.STYLE_PRESETS[M6_STYLE_KEY]
M6_HEAD = f"masterpiece, best quality, absurdres, year 2025, {M6_HEAD_POS}"
M6_CHAR_CORE = (
    "1girl, solo, 0.85::javelin (azur lane)::, tareme, blue-purple eyes, "
    "1.3::light purple hair::, grey-tinted hair, short hair, hair ribbon, x hair ornament, "
    "pointy hair, stray hair, 1.3::slender::, 1.3::petite::, narrow hips, small ass"
)
M6_WHITETEE_OUTFIT = (
    "rating:general, safe, oversized white t-shirt, off-shoulder, loose white t-shirt, "
    "white shorts, bare shoulder, collarbones"
)
M6_NUDE_OUTFIT = (
    "nsfw, completely nude, nude, no clothes, bare shoulders, collarbones, small breasts, nipples, barefoot"
)
M6_NUDE_CLOTHES_UC = (
    "clothes, t-shirt, shirt, shorts, skirt, panties, underwear, bra, "
    "shoes, socks, footwear, gloves, neckerchief, serafuku, plaid"
)
M6_PROSE_TAIL = (
    "Warm morning frontal light by cream sheer curtains, lineless rosy-apricot skin with smooth 3D shading, "
    "flat 2D moe anime face with big eyes and dot nose"
)
M6_UC = (
    f"nsfw, {nai_api.V5_HEAVY_UC_BASE}, {M6_STYLE_NEG}, "
    "plump, thick thighs, wide hips, big ass, huge ass, curvy, voluptuous, mature female, barbie doll anatomy, crown"
)

PURE2_165_HEAD = (
    "masterpiece, best quality, absurdres, year 2025, "
    "1.65::no lineart::, 1.5::lineless::, 1.38::realistic::, 0.9::photo (medium)::, 0.65::3d::, "
    "1.45::dot nose::, 1.65::smooth shading::, 1.55::soft lighting::, warm lighting, "
    "1.5::diffused lighting::, even lighting, soft shadows, window, sheer curtains, hazy, "
    "1.2::muted colors::, 1.42::low contrast::, 1.45::ambient occlusion::, 0.95::subsurface scattering::, "
    "soft skin, natural skin, soft focus"
)

PURE2_165_PROSE_TAIL = (
    "Uniformly diffused hazy morning light through sheer white curtains, "
    "strictly lineless warm rosy-apricot human skin with smooth continuous 3D tonal gradients and zero brushstrokes, "
    "muted ash-lavender hair, cute 2D moe anime face"
)

PURE2_165_UC = (
    "nsfw, lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, "
    "very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, "
    "too many watermarks, negative space, blank page, painterly, painting (medium), oil painting (medium), "
    "acrylicpaint (medium), impasto, brushstrokes, visible brushstrokes, gouache, watercolor (medium), "
    "dappled sunlight, spotty lighting, harsh shadows, pale skin, white skin, grey skin, neon hair, "
    "vibrant purple, high contrast, vibrant colors, oversaturated, lineart, outlines, thick outlines, "
    "thin outlines, cel shading, flat color, sketch, pen (medium), blush stickers, shiny skin, oiled, "
    "glossy, sweat, plastic, figure, faux figurine, doll, realistic nose, nostrils, thick lips, "
    "realistic face, cosplay, crown"
)

DEFAULT_CHAR_CORE = (
    "1girl, solo, 0.85::javelin_(azur_lane)::, 1.3::light purple hair::, pastel purple hair, "
    "grey-tinted hair, short ponytail, hair ribbon, x hair ornament, tareme, blue-purple eyes, "
    "soft blush, small mouth, slender, petite, small breasts, collarbones"
)

DEFAULT_OUTFIT = (
    "rating:general, safe, serafuku, white crop top, neckerchief, purple plaid skirt, pleated skirt, white gloves"
)

# 固化的 9 张 SFW 多角度镜头模板
MULTI_ANGLE_SFW_SHOTS: List[Dict] = [
    {
        "id": "00_ThreeView_Sheet",
        "width": 1216,
        "height": 832,
        "seed_offset": 0,
        "allow_multi_views": True,
        "scene": (
            "1.4::character sheet::, 1.4::turnaround::, 1.35::multiple views::, "
            "three views, front view, side view, back view, full body, standing, "
            "relaxed neutral pose, white shoes, simple white background, clean reference sheet, "
            "looking at viewer, slight smile"
        ),
    },
    {
        "id": "01_LowAngle_Standing",
        "width": 832,
        "height": 1216,
        "seed_offset": 1,
        "allow_multi_views": False,
        "scene": (
            "1.35::low angle::, 1.3::from below::, full body, standing, "
            "hands clasped behind back, slight tilt forward, looking down at viewer, "
            "foreshortening, indoors, cozy sunlit bedroom"
        ),
    },
    {
        "id": "02_HighAngle_SittingHugKnees",
        "width": 832,
        "height": 1216,
        "seed_offset": 2,
        "allow_multi_views": False,
        "scene": (
            "1.35::high angle::, 1.3::from above::, sitting on warm wooden floor, "
            "knees up, hugging own knees, looking up at viewer, gentle shy expression, "
            "indoors, cozy room"
        ),
    },
    {
        "id": "03_SideThreeQuarter_WindowHair",
        "width": 832,
        "height": 1216,
        "seed_offset": 3,
        "allow_multi_views": False,
        "scene": (
            "three-quarter side view, upper body, standing beside sunlit window, "
            "gentle breeze, wind-blown hair, hand tucking hair behind ear, "
            "gazing out the window, soft golden afternoon glow"
        ),
    },
    {
        "id": "04_BackOverShoulder_Couch",
        "width": 832,
        "height": 1216,
        "seed_offset": 4,
        "allow_multi_views": False,
        "scene": (
            "1.3::from behind::, back, 1.35::looking back::, over shoulder, "
            "upper body, kneeling on soft beige sofa, turning head toward viewer, "
            "indoors, soft cushions"
        ),
    },
    {
        "id": "05_MorningStretch_ArmsUp",
        "width": 832,
        "height": 1216,
        "seed_offset": 5,
        "allow_multi_views": False,
        "scene": (
            "eye-level, cowboy shot, arms raised overhead, morning stretch, "
            "leaning slightly back, relaxed cheerful smile, looking at viewer, "
            "indoors, sunlit bedroom"
        ),
    },
    {
        "id": "06_LyingOnSide_ProppedHead",
        "width": 1216,
        "height": 832,
        "seed_offset": 6,
        "allow_multi_views": False,
        "scene": (
            "1.3::lying on side::, lying on bed, white bedsheet, head propped on hand, "
            "elbow resting on pillow, upper body, legs bent comfortably, looking at viewer, "
            "gentle relaxed gaze"
        ),
    },
    {
        "id": "07_CloseUp_HeadTilt_Peace",
        "width": 832,
        "height": 1216,
        "seed_offset": 7,
        "allow_multi_views": False,
        "scene": (
            "1.3::close-up::, portrait, head tilt, peace sign near cheek, "
            "playful cheerful expression, one eye slightly narrowed, looking at viewer, "
            "blurred warm indoor background"
        ),
    },
    {
        "id": "08_CrossLegged_ChinRest",
        "width": 832,
        "height": 1216,
        "seed_offset": 8,
        "allow_multi_views": False,
        "scene": (
            "slight three-quarter angle, sitting cross-legged on soft rug, "
            "leaning forward, chin resting on both hands, elbows on knees, "
            "curious bright gaze, looking at viewer, cozy sunlit living room"
        ),
    },
]


def post_with_retry(token: str, proxy: str, body: bytes, content_type: str) -> bytes:
    url = f"{nai_api.NAI_IMAGE_ENDPOINT}/ai/generate-image"
    headers = nai_api._build_browser_headers(token, content_type=content_type)
    for attempt in range(4):
        with nai_api._create_http_client(proxy=proxy, timeout_sec=150.0) as client:
            resp = client.post(url, content=body, headers=headers)
            if resp.status_code in (200, 201):
                return nai_api._unpack_image_bytes(resp.content)
            if resp.status_code in (429, 500, 502, 503, 504) and attempt < 3:
                wait_s = 4.0 * (attempt + 1)
                print(f"[{resp.status_code} RETRY] waiting {wait_s}s...")
                time.sleep(wait_s)
                continue
            raise nai_api._format_api_error(resp.status_code, resp.content)
    raise RuntimeError("Unreachable retry loop")


def run_multi_angle_sfw_batch(
    out_dir: Path,
    prefix: str = "Pure2",
    base_seed: int = 2026111255,
    preset: str = "pure2",
    sleep_sec: float = 1.6,
) -> List[Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    settings = nai_api.load_api_settings()
    token = nai_api._normalize_token(settings.api_token)
    proxy = settings.proxy

    if preset == "m6_whitetee":
        head, char_core, outfit, prose_tail = M6_HEAD, M6_CHAR_CORE, M6_WHITETEE_OUTFIT, M6_PROSE_TAIL
        base_uc = f"{M6_UC}, neckerchief, serafuku, plaid, gloves"
    elif preset == "m6_nude":
        head, char_core, outfit, prose_tail = M6_HEAD, M6_CHAR_CORE, M6_NUDE_OUTFIT, M6_PROSE_TAIL
        m6_uc_nsfw = M6_UC[6:] if M6_UC.startswith("nsfw, ") else M6_UC
        base_uc = f"{m6_uc_nsfw}, {M6_NUDE_CLOTHES_UC}"
    elif preset == "m6_canon":
        head, char_core, outfit, prose_tail = M6_HEAD, M6_CHAR_CORE, DEFAULT_OUTFIT, M6_PROSE_TAIL
        base_uc = M6_UC
    else:
        head, char_core, outfit, prose_tail = PURE2_165_HEAD, DEFAULT_CHAR_CORE, DEFAULT_OUTFIT, PURE2_165_PROSE_TAIL
        base_uc = PURE2_165_UC

    sub0 = nai_api.fetch_subscription_info(token, proxy=proxy)
    print(f"[SUB BEFORE] tier={sub0.tier} ({sub0.tier_name}) active={sub0.active} anlas={sub0.anlas_left}")
    assert sub0.tier == 3 and sub0.active, "Opus subscription not active!"

    saved: List[Path] = []
    for idx, shot in enumerate(MULTI_ANGLE_SFW_SHOTS):
        seed = base_seed + shot["seed_offset"]
        out_path = out_dir / f"{prefix}_{shot['id']}_s{seed}.png"
        scene_str = shot["scene"].replace("white shoes", "barefoot") if preset == "m6_nude" else shot["scene"]
        full_prompt = f"{head}, {char_core}, {outfit}, {scene_str}, {prose_tail}"
        tok = nai_api.count_prompt_t5_tokens(full_prompt)["web_single_box_tokens"]
        assert tok <= nai_api.MAX_T5_TOKENS, f"{shot['id']} token overflow: {tok}"
        assert shot["width"] * shot["height"] <= 1_048_576, "Exceeds Opus free pixel limit!"

        uc_text = base_uc
        if shot["allow_multi_views"]:
            uc_text = uc_text.replace("multiple views, ", "")

        payload, used_seed = nai_api.build_v5_medium_payload(
            raw_prompt=full_prompt,
            width=shot["width"],
            height=shot["height"],
            scale=4.8,
            cfg_rescale=0.0,
            seed=seed,
            extra_uc="",
            append_v5_quality=False,
        )
        payload["input"] = full_prompt
        payload["parameters"]["v4_prompt"]["caption"]["base_caption"] = full_prompt
        payload["parameters"]["negative_prompt"] = uc_text
        payload["parameters"]["v4_negative_prompt"]["caption"]["base_caption"] = uc_text

        body, content_type = nai_api._build_multipart_body(payload)
        img_bytes = post_with_retry(token, proxy, body, content_type)
        out_path.write_bytes(img_bytes)
        saved.append(out_path)
        print(
            f"[OK {idx + 1}/9] {out_path.name} | {shot['width']}x{shot['height']} | "
            f"tokens={tok}/512 | seed={used_seed} | bytes={len(img_bytes)}"
        )

        if idx == 0:
            sub1 = nai_api.fetch_subscription_info(token, proxy=proxy)
            print(f"[SUB AFTER SHOT 1] anlas={sub1.anlas_left} delta={sub1.anlas_left - sub0.anlas_left}")
            if sub1.anlas_left < sub0.anlas_left:
                raise RuntimeError(f"ABORT: Anlas dropped! {sub0.anlas_left} -> {sub1.anlas_left}")
        if idx < len(MULTI_ANGLE_SFW_SHOTS) - 1:
            time.sleep(sleep_sec)

    sub_end = nai_api.fetch_subscription_info(token, proxy=proxy)
    print(f"[SUB END] anlas={sub_end.anlas_left} total_delta={sub_end.anlas_left - sub0.anlas_left}")
    assert sub_end.anlas_left == sub0.anlas_left
    return saved


def main() -> None:
    parser = argparse.ArgumentParser(description="固化的 Pure2_165 多角度 SFW 9图批量生成器 (0 Anlas)")
    parser.add_argument(
        "--out-dir",
        default=str(REPO_DIR / "outputs" / "20261113_Tune2_多角度SFW测试"),
        help="输出文件夹路径",
    )
    parser.add_argument("--prefix", default="Pure2", help="输出文件名前缀")
    parser.add_argument("--seed", type=int, default=2026111255, help="起始随机种子")
    parser.add_argument(
        "--preset",
        choices=("pure2", "m6_canon", "m6_whitetee", "m6_nude"),
        default="pure2",
        help="风格与默认服装预设",
    )
    args = parser.parse_args()
    run_multi_angle_sfw_batch(
        out_dir=Path(args.out_dir), prefix=args.prefix, base_seed=args.seed, preset=args.preset
    )


if __name__ == "__main__":
    main()
