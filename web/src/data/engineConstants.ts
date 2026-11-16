// NovelAI V4.5 / V5 Workbench Core Engine Constants & Preset Libraries

export const QUALITY_TAGS = "masterpiece, best quality, 0.8::very aesthetic::, absurdres, year 2025";

export const MODULE_SWITCH_PRESETS: Record<string, Record<string, boolean>> = {
  "🌕 全量直出（默认全开）": {
    "enable_quality": true,
    "enable_style": true,
    "enable_identity": true,
    "enable_body": true,
    "enable_outfit": true,
    "enable_clothing_state": true,
    "enable_legwear": true,
    "enable_background": true,
    "enable_expression": true,
    "enable_anatomy": true,
    "enable_action_fluids": true,
    "enable_remnants": true,
    "enable_t5_prose": true,
    "enable_negatives": true
  },
  "🎯 精密参照：人物+画风（关身份/外观/画风）": {
    "enable_quality": true,
    "enable_style": false,
    "enable_identity": false,
    "enable_body": false,
    "enable_outfit": false,
    "enable_clothing_state": true,
    "enable_legwear": false,
    "enable_background": true,
    "enable_expression": true,
    "enable_anatomy": true,
    "enable_action_fluids": true,
    "enable_remnants": true,
    "enable_t5_prose": true,
    "enable_negatives": true
  },
  "👤 精密参照：仅锁人物（保留本台画风+动作）": {
    "enable_quality": true,
    "enable_style": true,
    "enable_identity": false,
    "enable_body": false,
    "enable_outfit": false,
    "enable_clothing_state": true,
    "enable_legwear": false,
    "enable_background": true,
    "enable_expression": true,
    "enable_anatomy": true,
    "enable_action_fluids": true,
    "enable_remnants": true,
    "enable_t5_prose": true,
    "enable_negatives": true
  },
  "🦴 极简纯动作骨架（除动作与视角外全 OFF）": {
    "enable_quality": false,
    "enable_style": false,
    "enable_identity": false,
    "enable_body": false,
    "enable_outfit": false,
    "enable_clothing_state": false,
    "enable_legwear": false,
    "enable_background": false,
    "enable_expression": false,
    "enable_anatomy": false,
    "enable_action_fluids": false,
    "enable_remnants": false,
    "enable_t5_prose": false,
    "enable_negatives": true
  }
};

export const BUILTIN_CHARACTERS: Record<string, Record<string, string>> = {
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
    "bust_preset": "默认随角色原设"
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
    "bust_preset": "平胸贫乳（flat chest, small breasts）"
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
    "bust_preset": "小巧适中（small breasts）"
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
    "bust_preset": "小巧适中（small breasts）"
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
    "bust_preset": "丰满巨乳（large breasts, cleavage）"
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
    "bust_preset": "夸张爆乳（huge breasts, heavy breasts）"
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
    "bust_preset": "饱满中等（medium breasts）"
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
    "bust_preset": "小巧适中（small breasts）"
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
    "bust_preset": "平胸贫乳（flat chest, small breasts）"
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
    "bust_preset": "小巧适中（small breasts）"
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
    "bust_preset": "小巧适中（small breasts）"
  }
};

export const BUNDLED_CUSTOM_PRESETS: Record<string, Record<string, unknown>> = {
  "⭐ hood2": {
    "preset_name": "⭐ hood2",
    "char_tag": "hood (azur lane)",
    "eng_name": "hood",
    "eye_color": "",
    "hair_tags": "",
    "canon_neg_tags": "cape, capelet, blue jacket, blue sleeves, fur trim, ascot, jabot, cravat, gold trim, frills, white gloves",
    "extra_char_tags": "",
    "body_preset": "匀称修长少女（slender, narrow waist, long legs）",
    "bust_preset": "饱满中等（medium breasts）",
    "skin_preset": "自然暖透肤（原版默认）",
    "outfit_preset": "自定义穿搭（使用下方自定义穿搭框）",
    "outfit_state_mode": "🔄 智能适配穿脱（原设/裙装自动撩裙拨内裤 · 单件上衣自动真空）",
    "custom_outfit_tags": "1.45::reverse bunnysuit::, playboy bunny, bunny ears, white collar, bowtie, black bolero, black sleeves, highleg, black pantyhose, rating:explicit, nsfw, uncensored",
    "keep_canon_elements": false,
    "legwear_preset": "🌟 随角色原设鞋袜 / 不强制赤足",
    "add_cat_ears": false,
    "add_horns_tail": false,
    "add_glasses": false,
    "add_choker": false,
    "add_extra_sweat": false,
    "style_preset": "🎨 柔雾白纱无界油画 · 点鼻小嘴内联锁脸款（M6-Tune2 保留款 · 无界油画感）",
    "custom_style_pos": "",
    "custom_style_neg": "",
    "morph_preset": "1D 微明显蝴蝶低过渡（原版默认）",
    "pubic_preset": "默认不额外指定",
    "pigment_preset": "3A 透肤暖珊瑚无色差（原版默认）",
    "fluid_scale": 1.0,
    "perspective_mode": "3rd",
    "include_sub_variants": false,
    "multi_panel_mode": "2koma",
    "enable_quality": true,
    "enable_style": true,
    "enable_identity": true,
    "enable_body": true,
    "enable_outfit": true,
    "enable_clothing_state": true,
    "enable_legwear": true,
    "enable_background": true,
    "enable_expression": true,
    "enable_anatomy": true,
    "enable_action_fluids": true,
    "enable_remnants": true,
    "enable_t5_prose": true,
    "enable_negatives": true,
    "enable_multi_angle_nsfw": true
  }
};

export const BODY_PRESETS: Record<string, [string, string]> = {
  "纤细娇小（原版默认 slender, petite）": [
    "slender, petite",
    "plump, thick thighs"
  ],
  "匀称修长少女（slender, narrow waist, long legs）": [
    "slender, narrow waist, long legs",
    "plump, obese"
  ],
  "丰满肉感微胖（plump, curvy, wide hips, thick thighs）": [
    "plump, curvy, wide hips, thick thighs, soft body",
    "skinny, flat chest"
  ],
  "成熟高挑丰满（tall female, curvy, narrow waist）": [
    "tall female, mature female, curvy, narrow waist, wide hips",
    "loli, petite"
  ]
};

export const BUST_PRESETS: Record<string, [string, string]> = {
  "默认随角色原设": [
    "",
    ""
  ],
  "平胸贫乳（flat chest, small breasts）": [
    "flat chest, small breasts",
    "large breasts, medium breasts, cleavage"
  ],
  "小巧适中（small breasts）": [
    "small breasts",
    "large breasts, huge breasts"
  ],
  "饱满中等（medium breasts）": [
    "medium breasts",
    "flat chest, huge breasts"
  ],
  "丰满巨乳（large breasts, cleavage）": [
    "large breasts, cleavage",
    "flat chest, small breasts"
  ],
  "夸张爆乳（huge breasts, heavy breasts）": [
    "huge breasts, heavy breasts, cleavage",
    "flat chest, small breasts"
  ]
};

export const SKIN_PRESETS: Record<string, string> = {
  "自然暖透肤（原版默认）": "",
  "雪白瓷肌（pale skin, fair skin）": "pale skin, fair skin",
  "健康小麦日晒肌（tan, dark skin）": "tan, dark-skinned female",
  "日晒泳装白痕（tan, tanlines）": "tan, suntan, 1.3::tanlines::",
  "晶莹汗湿反光肌（shiny skin, glistening）": "shiny skin, glistening skin, 1.25::sweat::"
};

export const OUTFIT_PRESETS: Record<string, Record<string, string>> = {
  "🌟 角色标签原设默认服装（自动解锁角色原皮 · 推荐）": {
    "design_tags": "",
    "state_tags": "clothes lift, skirt lift, panties aside",
    "sleep_extra": "disheveled clothes",
    "prose": "",
    "intact_prose": "",
    "allow_canon": "1",
    "kind": "canon_full",
    "bottom_type": "skirt_or_canon"
  },
  "🎽 角色原设上衣与配件保留 · 下身真空半脱": {
    "design_tags": "",
    "state_tags": "clothes lift, bottomless, no panties",
    "sleep_extra": "disheveled clothes",
    "prose": "her lifted top",
    "intact_prose": "",
    "allow_canon": "1",
    "kind": "canon_top",
    "bottom_type": "none"
  },
  "宽松滑肩白T恤·下身真空（故事线默认）": {
    "design_tags": "oversized shirt, white t-shirt, off-shoulder, single bare shoulder, wet clothes",
    "state_tags": "clothes lift, bottomless, no panties",
    "sleep_extra": "disheveled clothes",
    "prose": "her lifted off-shoulder oversized white t-shirt",
    "intact_prose": "an off-shoulder oversized white t-shirt",
    "allow_canon": "0",
    "kind": "preset",
    "bottom_type": "none"
  },
  "学院百褶短裙套装（白衬衫+百褶裙 · 撩裙不脱裙）": {
    "design_tags": "white collared shirt, necktie, pleated skirt, miniskirt",
    "state_tags": "clothes lift, skirt lift, panties aside",
    "sleep_extra": "disheveled clothes",
    "prose": "her lifted pleated skirt",
    "intact_prose": "a white collared shirt and pleated miniskirt",
    "allow_canon": "0",
    "kind": "preset",
    "bottom_type": "skirt"
  },
  "连体兔女郎紧身衣（Bunny Suit · 拨档互动）": {
    "design_tags": "playboy bunny, black leotard, strapless, bare shoulders, wrist cuffs, bowtie",
    "state_tags": "clothes lift, leotard aside",
    "sleep_extra": "disheveled clothes",
    "prose": "her shifted bunny leotard",
    "intact_prose": "a strapless black bunny leotard with wrist cuffs and bowtie",
    "allow_canon": "0",
    "kind": "preset",
    "bottom_type": "leotard"
  },
  "系带微距比基尼泳装（Micro Bikini · 拨开互动）": {
    "design_tags": "bikini, micro bikini, string bikini, side-tie bikini bottom",
    "state_tags": "bikini aside, swimsuit aside",
    "sleep_extra": "disheveled clothes",
    "prose": "her pushed-aside bikini strings",
    "intact_prose": "a string micro bikini",
    "allow_canon": "0",
    "kind": "preset",
    "bottom_type": "swimsuit"
  },
  "全裸无衣（nude · 全程无遮挡）": {
    "design_tags": "nude, completely nude, bare shoulders, nipples",
    "state_tags": "nude",
    "sleep_extra": "",
    "prose": "her bare chest",
    "intact_prose": "completely nude",
    "allow_canon": "0",
    "kind": "nude",
    "bottom_type": "nude"
  },
  "宽松男友白衬衫半敞·下身真空": {
    "design_tags": "oversized shirt, white collared shirt, unbuttoned, open clothes, off-shoulder, wet clothes",
    "state_tags": "clothes lift, bottomless, no panties",
    "sleep_extra": "disheveled clothes",
    "prose": "her unbuttoned oversized white collared shirt",
    "intact_prose": "an unbuttoned oversized white collared shirt",
    "allow_canon": "0",
    "kind": "preset",
    "bottom_type": "none"
  },
  "半脱凌乱水手服上衣·下身真空": {
    "design_tags": "serafuku, sailor collar, neckerchief, open clothes, disheveled clothes, wet clothes",
    "state_tags": "clothes lift, bottomless, no panties",
    "sleep_extra": "",
    "prose": "her disheveled lifted sailor uniform top",
    "intact_prose": "a disheveled open sailor uniform top",
    "allow_canon": "1",
    "kind": "preset",
    "bottom_type": "none"
  },
  "轻薄吊带睡裙掀起·下身真空": {
    "design_tags": "nightgown, camisole, white babydoll, spaghetti strap, see-through, off-shoulder",
    "state_tags": "clothes lift, bottomless, no panties",
    "sleep_extra": "disheveled clothes",
    "prose": "her lifted sheer white camisole nightgown",
    "intact_prose": "a sheer white camisole nightgown",
    "allow_canon": "0",
    "kind": "preset",
    "bottom_type": "none"
  },
  "紧身运动背心掀起·下身真空": {
    "design_tags": "tank top, white sports bra, crop top, breasts out, wet clothes",
    "state_tags": "clothes lift, bottomless, no panties",
    "sleep_extra": "disheveled clothes",
    "prose": "her pushed-up white sports tank top",
    "intact_prose": "a white sports tank top",
    "allow_canon": "0",
    "kind": "preset",
    "bottom_type": "none"
  },
  "自定义穿搭（使用下方自定义穿搭框）": {
    "design_tags": "",
    "state_tags": "",
    "sleep_extra": "",
    "prose": "her outfit",
    "intact_prose": "her outfit",
    "allow_canon": "0",
    "kind": "custom",
    "bottom_type": "none"
  }
};

export const OUTFIT_STATE_PRESETS: Record<string, string> = {
  "🔄 智能适配穿脱（原设/裙装自动撩裙拨内裤 · 单件上衣自动真空）": "auto",
  "👗 保留下装 · 撩裙/拨开内裤互动（skirt lift + panties aside · 不删裙装）": "keep_bottom_aside",
  "👙 半脱凌乱 · 敞衣露肩 + 内裤挂单腿（open clothes + panties around one leg）": "half_off",
  "👕 掀衣 + 下身全真空（clothes lift + bottomless, no panties · 经典模式）": "bottomless",
  "🔒 全程完整穿戴不掀脱（不自动加掀衣/脱裤辅助词）": "intact"
};

export const LEGWEAR_PRESETS: Record<string, [string, string, string]> = {
  "🌟 随角色原设鞋袜 / 不强制赤足": [
    "",
    "no shoes, socks",
    "feet"
  ],
  "赤足裸腿（barefoot 默认）": [
    "barefoot",
    "barefoot",
    "bare feet"
  ],
  "裸足配精致脚链（barefoot, anklet）": [
    "barefoot, anklet",
    "barefoot, anklet",
    "anklet-adorned bare feet"
  ],
  "白色过膝丝袜（white thighhighs）": [
    "white thighhighs",
    "white thighhighs, clothed feet",
    "white-stockinged feet"
  ],
  "黑色蕾丝腿环过膝袜（black thighhighs, garter）": [
    "black thighhighs, thigh strap",
    "black thighhighs, clothed feet",
    "black-stockinged feet"
  ],
  "撕破白丝连裤袜（torn white pantyhose）": [
    "white pantyhose, 1.3::torn pantyhose::",
    "white pantyhose, torn pantyhose, clothed feet",
    "torn-pantyhose-clad feet"
  ]
};

export const STYLE_PRESETS: Record<string, [string, string]> = {
  "137_128 锋利钢笔水彩空气感逆光（原版默认）": [
    "1.4::sharp focus::, fine details, 1.1::colored sketch::, 0.8::pen (medium)::, 0.8::painterly::, 0.5::watercolor (medium)::, visible brushstrokes, pastel colors, soft colors, muted colors, subsurface scattering, backlighting, rim lighting, warm lighting",
    "blurry, out of focus, depth of field, soft focus, cel shading, flat color, oil painting (medium), thick outlines, high contrast, harsh shadows, dark, realistic, 3d"
  ],
  "🌸 柔润同人萌系三画师混调风（mikozin 0.78 + rarigo 0.68 + ai 0.52）": [
    "0.78::artist:mikozin::, 0.68::artist:rarigo::, 0.52::artist:ai (u e o o)::, no text",
    "realistic, photorealistic, 3d, figure, faux figurine, monochrome, greyscale, comic, manga, speech bubble, text, watermark, signature, username, blurry, lowres"
  ],
  "🍑 软糯艳彩萌系三画师混调风（bell 0.80 + itamochi 0.55 + meito 0.48）": [
    "0.80::artist:bell (oppore coppore)::, 0.55::artist:itamochi::, 0.48::artist:meito (maze)::",
    "realistic, photorealistic, 3d, figure, faux figurine, monochrome, greyscale, comic, manga, speech bubble, text, watermark, signature, username, blurry, lowres"
  ],
  "🌸 五画师无描边柔涂厚彩风（shirabi + gomashio + dino + waterring + riichu）": [
    "0.55::artist:shirabi::, 0.52::artist:gomashio ponz::, 0.45::artist:dino (dinoartforame)::, 0.42::artist:waterring::, 0.35::artist:riichu::, painting (medium), soft shading, no lineart, no text",
    "thick outlines, bold lineart, cel shading, flat color, monochrome, greyscale, comic, manga, rough sketch, 3d, figure, faux figurine, photorealistic, speech bubble, text, watermark, signature, username, lowres"
  ],
  "☕ 四画师细棕彩线空气感瓷肌风（ask 0.65 + ciloranko 0.58 + kuroduki + yahako）": [
    "0.65::artist:ask (askzy)::, 0.58::artist:ciloranko::, 0.50::artist:kuroduki (pieat)::, 0.42::artist:yahako::, colored lineart, brown lineart, colored eyelashes, eyeshadow, pale color, soft shading, translucent hair, no text",
    "thick outlines, bold lineart, black outlines, cel shading, flat color, harsh shadows, realistic, photorealistic, 3d, figure, faux figurine, monochrome, greyscale, comic, manga, speech bubble, text, watermark, signature, username, lowres"
  ],
  "🍬 清亮黑线高混融水润反光萌系CG风（收窄小脸+长条乳白反光 · 140209723精修款）": [
    "1.05::artist:tianliang duohe fangdongye::, 1.05::artist:kanikama::, 1.05::artist:kani biimu::, 0.75::artist:mignon::, 0.35::artist:mikozin::, 1.35::smooth shading::, soft shading, 1.25::shiny skin::, glossy highlights, subsurface scattering, clean lines, sharp focus",
    "wide face, big head, chibi, super deformed, full-face blush, flat color, cel shading, no lineart, lineless, realistic, photorealistic, 3d, oil painting (medium), impasto, visible brushstrokes, rough sketch, hatching (texture), monochrome, blurry"
  ],
  "🌤️ 柔雾白纱晨光 · 无描边暖杏真肤二次元萌脸（M6 保留款 · 自然光真肤）": [
    "1.65::no lineart::, 1.5::lineless::, 1.32::realistic::, 0.78::photo (medium)::, 0.48::3d::, 1.6::anime face::, 1.45::moe::, 1.65::dot nose::, small mouth, soft skin, 1.55::front lighting::, 1.45::warm lighting::, 1.45::soft lighting::, diffused lighting, gentle chiaroscuro, 1.6::smooth shading::, soft shadows, hazy, depth of field, 1.15::muted colors::, 1.25::low contrast::, 1.4::ambient occlusion::, 1.1::subsurface scattering::",
    "painterly, painting (medium), oil painting (medium), acrylicpaint (medium), impasto, brushstrokes, visible brushstrokes, gouache, watercolor (medium), airbrush, cel shading, cel highlight, flat color, lineart, outlines, thick outlines, thin outlines, sketch, pen (medium), harsh shadows, cold lighting, blue tint, grey skin, neon hair, vibrant purple, oversaturated, shiny ass, light spots, wet clothes, blush stickers, oiled, latex, plastic, figure, faux figurine, doll, realistic face, 3d face, semi-realistic, realistic eyes, eye sockets, nose bridge, realistic nose, nostrils, lips, thick lips, cosplay, floating heart, sweatdrop"
  ],
  "🎨 柔雾白纱无界油画 · 点鼻小嘴内联锁脸款（M6-Tune2 保留款 · 无界油画感）": [
    "1.65::no lineart::, 1.5::lineless::, 1.32::realistic::, 0.78::photo (medium)::, 0.48::3d::, 1.6::anime face::, 1.45::moe::, 1.85::dot nose::, 1.45::small mouth::, :o, soft skin, 1.55::front lighting::, 1.45::warm lighting::, 1.45::soft lighting::, diffused lighting, gentle chiaroscuro, 1.6::smooth shading::, soft shadows, hazy, depth of field, 1.15::muted colors::, 1.25::low contrast::, 1.4::ambient occlusion::, 1.1::subsurface scattering::",
    "nose bridge, nostrils, lips, thick lips, philtrum, crown, text, signature, copyright name, watermark"
  ],
  "真实微距 PVC 涂装手办摄影风（Scale Figurine Photo · 半哑光保留版）": [
    "1.85::figure::, 1.55::faux figurine::, 1.35::photo (medium)::, 1.25::realistic::, 1.2::3d::, photo background, depth of field, bokeh, studio lighting, soft shadows, subsurface scattering, matte pvc texture, glossy highlights, fine details",
    "doll joints, ball-jointed doll, figma, action figure, flat color, cel shading, lineart, sketch, watercolor (medium), pen (medium), monochrome, comic, 2d, floating heart, sweatdrop"
  ],
  "高光亮油 PVC 手办硬反光微距风（Glossy Lacquer PVC · 强硬塑料高光推荐）": [
    "2.15::figure::, 1.85::faux figurine::, 1.55::photo (medium)::, 1.4::realistic::, 1.35::3d::, 1.7::shiny::, 1.65::shiny skin::, 1.5::shiny hair::, 1.45::shiny clothes::, oiled, reflection, rim lighting, backlighting, shadow, photo background, depth of field, bokeh, chromatic aberration",
    "subsurface scattering, matte, soft skin, real human, cosplay, doll joints, ball-jointed doll, figma, action figure, flat color, cel shading, lineart, sketch, watercolor (medium), pen (medium), monochrome, comic, 2d, floating heart, sweatdrop"
  ],
  "高光亮油展示底座手办棚拍风（Glossy PVC + 亚克力底座 Stand）": [
    "2.2::figure::, 1.9::faux figurine::, 1.55::photo (medium)::, 1.4::realistic::, 1.35::3d::, 1.7::shiny::, 1.65::shiny skin::, 1.5::shiny hair::, 1.45::shiny clothes::, oiled, display stand, diorama, reflection, rim lighting, backlighting, shadow, photo background, depth of field, bokeh, chromatic aberration",
    "subsurface scattering, matte, soft skin, real human, cosplay, doll joints, ball-jointed doll, figma, action figure, flat color, cel shading, lineart, sketch, watercolor (medium), pen (medium), monochrome, comic, 2d, floating heart, sweatdrop"
  ],
  "真实展示底座手办棚拍风（带圆形亚克力底座 Stand · 半哑光版）": [
    "1.9::figure::, 1.6::faux figurine::, 1.35::photo (medium)::, 1.25::realistic::, 1.2::3d::, display stand, miniature, photo background, depth of field, bokeh, studio lighting, rim lighting, subsurface scattering, painted pvc texture, glossy highlights",
    "doll joints, ball-jointed doll, figma, action figure, flat color, cel shading, lineart, sketch, watercolor (medium), pen (medium), monochrome, comic, 2d, floating heart, sweatdrop"
  ],
  "原生大颗粒 16-bit 像素游戏 CG 风（C5 推荐 · 小画布直出 + 3x 硬邻近方块放大）": [
    "3.6::pixel art::, 2.8::pixelated::, 2.2::8-bit::, 16-bit, 2.0::dithering::, sprite, retro game, dot art, blocky pixels, jagged lines, hard edges, warm lighting",
    "mosaic censoring, bar censor, censored, crown, tiara, picture frame, painting (object), highres, absurdres, smooth, smooth shading, anti-aliasing, cel shading, anime coloring, clean lines, lineart, airbrush, soft shading, gradient, watercolor (medium), painterly, realistic, 3d, photo (medium), figure, blurry, soft focus"
  ],
  "复古萌系大颗粒点阵 Sprite CG 风（E 保留款 · 1216x832 原生点阵画师风）": [
    "4.5::pixel art::, 2.5::dithering::, 2.0::retro artstyle::, 16-bit, 8-bit, artist:unosavy, artist:apollo_(pixel_art), artist:mota, game cg, sprite, dot art, soft colors, warm lighting",
    "mosaic censoring, bar censor, censored, crown, tiara, highres, absurdres, smooth shading, anti-aliasing, anime coloring, cel shading, vector, painterly, watercolor (medium), realistic, 3d, photo (medium), figure, blurry"
  ],
  "清透柔光厚涂插画风（柔肤高质感）": [
    "1.3::sharp focus::, fine details, 1.1::painterly::, soft lighting, subsurface scattering, warm lighting, rim lighting, delicate shading, luminous skin",
    "blurry, lowres, cel shading, flat color, thick outlines, harsh shadows, realistic, 3d, bad anatomy"
  ],
  "现代高锐度清亮赛璐璐动画风": [
    "1.3::sharp focus::, anime coloring, clean lines, vibrant colors, rim lighting, warm indoor lighting, glossy highlights",
    "blurry, out of focus, rough sketch, painterly, muted colors, realistic, 3d"
  ],
  "同人志精细黑白网点漫画风（Monochrome Manga）": [
    "1.4::sharp focus::, 1.4::monochrome::, 1.3::greyscale::, manga, comic, pen (medium), screentones, hatching (texture), intricate lineart",
    "color, colorful, watercolor (medium), painterly, blurry, soft focus, realistic, 3d"
  ],
  "自定义画风（使用下方自定义画风框）": [
    "",
    ""
  ]
};

export const LIGHTING_PRESETS: Record<
  string,
  {
    code: string;
    tags: string;
    prose: string;
    badge: string;
    strip_head_lighting?: boolean;
    unblock_neg?: string[];
  }
> = {
  "🔄 随画风与本幕默认光影（不额外覆盖）": {
    code: "auto",
    tags: "",
    prose: "",
    badge: "",
  },
  "🌅🌊 强逆光过曝眩光 · 自然暗面 + 水波焦散反射（Contre-Jour + Water Caustics）": {
    code: "contre_jour_caustics",
    tags: "2.0::backlighting::, 1.75::sun glare::, 1.65::overexposure::, 1.55::bloom::, 1.35::lens flare::, sunbeam, light rays, 1.35::shade::, partially shaded face, dim lighting, 1.35::caustics::, water reflection, depth of field, blurry background",
    prose:
      "Intense contre-jour lighting with a blinding overexposed sun glare behind her; her camera-facing face and body are submerged in natural shadow against the bright light, with glowing halation on her upper silhouette edges and bright water caustics reflecting onto her shaded skin and hair.",
    badge: "🌅🌊逆光焦散",
    strip_head_lighting: true,
    unblock_neg: [
      "bloom",
      "overexposed",
      "blown out",
      "depth of field",
      "blurry",
      "soft focus",
      "out of focus",
      "dim lighting",
      "dark",
      "harsh shadows",
      "high contrast",
      "hazy",
    ],
  },
  "☀️ 窗边过曝白昼侧逆光 · 暖金轮廓柔光（Window Sidelight & Golden Rim）": {
    code: "window_golden_rim",
    tags: "1.35::backlighting::, 1.3::sidelighting::, 1.25::sunlight::, overexposure, depth of field, blurry background",
    prose:
      "Intense overexposed white daylight casts a crisp warm golden-white rim light along her slender waist and fingers while bathing her creamy porcelain skin and airy translucent hair in soft diffused light.",
    badge: "☀️窗边暖金侧逆光",
    strip_head_lighting: true,
    unblock_neg: ["overexposed", "blown out", "depth of field", "blurry", "soft focus", "out of focus", "hazy"],
  },
};

export const ENV_PRESETS: Record<
  string,
  {
    code: string;
    tags: string;
    prose: string;
    badge: string;
    extra_neg?: string;
    unblock_dark?: boolean;
  }
> = {
  "🔄 随本幕/体位工具栏默认环境": {
    code: "auto",
    tags: "",
    prose: "",
    badge: "",
  },
  "🪟 晨光纱帘白床明亮卧室（bright window, curtains, sunlit bedroom, white bedsheet）": {
    code: "sunlit_window_bedroom",
    tags: "indoors, bedroom, bed, white bedsheet, bright window, curtains",
    prose: " in a bright sunlit bedroom beside sheer window curtains",
    badge: "🪟晨光白床卧室",
    extra_neg: "outdoors, couch, sofa",
  },
  "🌸 落樱浅滩水波·粉霞晴空焦散（shallow water, cherry blossoms, caustics, pink sky）": {
    code: "cherry_shallow_water",
    tags: "outdoors, 1.35::shallow water::, in water, ripples, water reflection, 1.35::caustics::, cherry blossoms, falling petals, pink sky, bright sky, shiny skin, wet skin",
    prose: " in shallow rippling water beneath falling cherry blossom petals and a bright pink sky",
    badge: "🌸落樱浅滩",
    extra_neg: "indoors, bedroom, bed, couch, sofa, pillow, bedsheet, curtains, ceiling, lamp",
  },
  "🗑️ 日式城市阴暗小巷·垃圾箱旁（alley, backstreet, trash can, garbage bag）": {
    code: "jp_dark_alley_trash",
    tags: "outdoors, 1.35::alley::, backstreet, japanese street, urban, narrow street, 1.3::dim lighting::, dark, shadow, 1.35::trash can::, garbage bag, cardboard box, air conditioner, utility pole, concrete wall, asphalt",
    prose: " in a dark, narrow Japanese urban back-alley beside trash cans and black garbage bags",
    badge: "🗑️阴暗后巷",
    extra_neg: "indoors, bedroom, bed, couch, sofa, pillow, bedsheet, curtains",
    unblock_dark: true,
  },
};

export const MULTI_PANEL_MODE_PRESETS: Record<string, string> = {
  "📑 同屏双格漫画差分 (2koma 默认)": "2koma",
  "🖼️ 仅出单张图 · 前半拍进行中 (深坐/含入)": "single_a",
  "🖼️ 仅出单张图 · 后半拍事后拉丝 (微抬脱出/松口)": "single_b",
  "🎞️ 拆成前后两张独立单图 (预览框可切换挑选)": "single_pair"
};

export const MORPH_PRESETS: Record<string, [string, string]> = {
  "1D 微明显蝴蝶低过渡（原版默认）": [
    "groin, pussy, labia, 0.65::spread pussy::",
    "barbie doll anatomy"
  ],
  "1A 幼态平板一线天（Flat Innie Slit）": [
    "groin, pussy, 1.2::cleft of venus::, flat mons",
    "labia, puffy pussy, gaping, barbie doll anatomy"
  ],
  "1B 饱满馒头丘陵型（Fat Mons & Puffy）": [
    "groin, mons pubis, 1.3::fat mons::, pussy, puffy pussy, cleft of venus",
    "1.8::labia::, gaping, barbie doll anatomy"
  ],
  "1C 花苞微露含蓄型（Subtle Peeking）": [
    "groin, pussy, 0.5::labia::, 0.5::spread pussy::",
    "gaping, barbie doll anatomy"
  ],
  "1D+ 明显舒展双翼型（高权重防吞版）": [
    "groin, pussy, 1.65::labia::, 1.0::spread pussy::",
    "barbie doll anatomy"
  ]
};

export const PUBIC_PRESETS: Record<string, [string, string]> = {
  "默认不额外指定": [
    "",
    ""
  ],
  "2A 纯净白虎无毛（no pubic hair）": [
    "no pubic hair",
    "pubic hair"
  ],
  "2B 少女初生稀疏绒毛（sparse pubic hair）": [
    "1.2::sparse pubic hair::, light pubic hair",
    "thick pubic hair"
  ],
  "2C 修剪一线跑道型（landing strip）": [
    "pubic hair, 1.3::landing strip::, trimmed pubic hair",
    ""
  ],
  "2E 涩气爱心修剪型（heart-shaped）": [
    "pubic hair, 1.4::heart-shaped pubic hair::",
    ""
  ],
  "2F 自然浓密野生型（natural thick）": [
    "1.3::pubic hair::, messy pubic hair",
    ""
  ]
};

export const PIGMENT_PRESETS: Record<string, string> = {
  "3A 透肤暖珊瑚无色差（原版默认）": "",
  "3B 鲜嫩樱桃亮粉色（pink pussy）": "pink pussy",
  "3C 熟感边缘深色双色层次（dark-edged mucosa）": "dark pigmented labia edges, two-tone mucosa",
  "3D 兴奋充血潮红发亮（flushed & glistening）": "glistening, flushed groin"
};

export const EXPRESSION_PRESETS: Record<string, { code: string; tags: string; prose: string; short: string }> = {
  "🔄 随本幕剧情默认（保留原幕微表情与熟睡/半醒节奏）": {
    "code": "auto",
    "tags": "",
    "prose": "",
    "short": "🔄 随本幕默认"
  },
  "😳 羞涩微醺·含情欲泣（furrowed brow, half-closed eyes, watery eyes, blush）": {
    "code": "shy_watery",
    "tags": "furrowed brow, half-closed eyes, watery eyes, shy, blush",
    "prose": "with a shy, flustered expression, misty half-closed eyes, and a warm blush",
    "short": "😳 羞涩欲泣"
  },
  "😊 温柔浅笑·纯欲治愈（gentle smile, soft blush, parted lips）": {
    "code": "gentle_smile",
    "tags": "gentle smile, slight smile, parted lips, soft blush",
    "prose": "with a gentle, affectionate smile and soft blush",
    "short": "😊 温柔浅笑"
  },
  "😝 俏皮吐舌·小恶魔得意（:p, tongue out, smug, blush, floating heart）": {
    "code": "playful_smug",
    "tags": ":p, tongue out, smug, grin, furrowed brow, half-closed eyes, blush, floating heart",
    "prose": "with a smug, playful expression and sticking the tip of her tongue out",
    "short": "😝 俏皮吐舌"
  },
  "💢 雌小鬼嘲讽·嚣张挑衅（mesugaki, smug, evil smile, jitome, naughty face, blush）": {
    "code": "mesugaki_tease",
    "tags": "1.35::mesugaki::, 1.3::smug::, smirk, evil smile, grin, naughty face, 1.2::half-closed eyes::, jitome, blush",
    "prose": "with a bratty, mocking mesugaki smirk and teasing half-lidded eyes",
    "short": "💢 雌小鬼嘲讽"
  },
  "💔 雌小鬼破防·屈辱强忍（frustrated, humiliated, v-shaped eyebrows, teary eyes, clenched teeth）": {
    "code": "mesugaki_broken",
    "tags": "1.3::frustrated::, humiliated, v-shaped eyebrows, furrowed brow, teary eyes, tears, 1.25::clenched teeth::, trembling, heavy blush, sweatdrop",
    "prose": "with a humiliated, broken-down expression, teary eyes, clenched teeth, and deep flustered blush",
    "short": "💔 破防屈辱"
  },
  "💖 发情魅魔·舔唇索求（seductive smile, bedroom eyes, licking lips, heart-shaped pupils）": {
    "code": "succubus_lust",
    "tags": "1.35::seductive smile::, 1.3::bedroom eyes::, 1.3::licking lips::, 1.3::heart-shaped pupils::, heart in eye, half-closed eyes, blush, floating heart",
    "prose": "with a sultry, lustful smile, heart-shaped pupils, and tongue playfully licking her lips",
    "short": "💖 舔唇发情"
  },
  "🥺 委屈忍耐·咬唇含泪（biting lip, furrowed brow, teary eyes, heavy blush）": {
    "code": "biting_lip_teary",
    "tags": "1.3::biting lip::, furrowed brow, v-shaped eyebrows, teary eyes, watery eyes, trembling, heavy blush",
    "prose": "biting her lower lip with furrowed brows and teary eyes",
    "short": "🥺 委屈咬唇"
  },
  "😵‍💫 迷离失神·融化恍惚（torogao, bedroom eyes, open mouth, saliva, heavy blush）": {
    "code": "torogao_melting",
    "tags": "1.35::torogao::, 1.3::half-closed eyes::, bedroom eyes, open mouth, parted lips, saliva, heavy breathing, heavy blush",
    "prose": "with a dreamy, melting torogao expression, half-closed bedroom eyes, and heavy blush",
    "short": "😵‍💫 迷离恍惚"
  },
  "🥵 极度高潮·阿黑颜吐舌（ahegao, rolling eyes, tongue out, drooling, heavy blush）": {
    "code": "ahegao_climax",
    "tags": "1.4::ahegao::, 1.3::rolling eyes::, upturned eyes, 1.35::tongue out::, open mouth, drooling, saliva, heavy blush, trembling",
    "prose": "with an overwhelmed ahegao expression, rolling eyes, and tongue lolling out",
    "short": "🥵 高潮阿黑颜"
  },
  "😖 紧闭双眼·绝顶痉挛（squeezed eyes, closed eyes, teardrops, open mouth, panting）": {
    "code": "squeezed_climax",
    "tags": "1.35::squeezed eyes::, 1.3::closed eyes::, teardrops, v-shaped eyebrows, furrowed brow, open mouth, heavy breathing, panting, trembling, heavy blush, sweat",
    "prose": "with tightly squeezed-shut eyes beaded with teardrops and an open, gasping mouth at climax",
    "short": "😖 紧闭绝顶"
  },
  "🤤 催眠洗脑·空洞滴涎（empty eyes, no eye highlights, blank stare, slack-jawed, drooling）": {
    "code": "hypno_blank_drool",
    "tags": "1.4::empty eyes::, no eye highlights, 1.25::mind break::, blank stare, half-closed eyes, slack-jawed, open mouth, drooling, saliva trail, blush",
    "prose": "with blank, highlightless empty eyes and a slack-jawed mouth drooling a thin thread of saliva",
    "short": "🤤 催眠空洞"
  },
  "😒 嫌恶鄙视·看垃圾眼神（disgust, scorn, jitome, furrowed brow, frown, slight blush）": {
    "code": "disgust_scorn",
    "tags": "1.4::disgust::, 1.25::scorn::, 1.3::jitome::, furrowed brow, frown, closed mouth, slight blush",
    "prose": "with a cold, disgusted jitome stare of disdain and a faint blush",
    "short": "😒 嫌恶鄙视"
  },
  "🫣 捂嘴憋声·羞耻偷瞄（hand over mouth, covered mouth, watery eyes, sideways glance, heavy blush）": {
    "code": "muffled_hand_mouth",
    "tags": "1.35::hand over mouth::, 1.25::covered mouth::, muffled, v-shaped eyebrows, furrowed brow, watery eyes, sideways glance, heavy blush, sweatdrop",
    "prose": "pressing a hand over her mouth to stifle her voice while glancing shyly with misty eyes and a deep blush",
    "short": "🫣 捂嘴憋声"
  },
  "💋 湿唇微嘟·闭目索吻（puckered lips, kissing face, wet lips, half-closed eyes, soft blush）": {
    "code": "kiss_waiting",
    "tags": "1.3::puckered lips::, kissing face, wet lips, glossy lips, 1.25::half-closed eyes::, long eyelashes, soft blush",
    "prose": "with heavy-lidded eyes and glossy, softly puckered lips waiting for a kiss",
    "short": "💋 微嘟索吻"
  },
  "😴 安睡沉眠·呼吸微张（sleeping, closed eyes, relaxed, parted lips）": {
    "code": "sleeping_peaceful",
    "tags": "1.5::sleeping::, 1.4::closed eyes::, relaxed, parted lips, soft blush",
    "prose": "fast asleep with peaceful closed eyes and softly parted lips",
    "short": "😴 安睡闭眼"
  },
  "😪 困倦迷糊·半梦半醒（sleepy, drowsy, half-closed eyes, parted lips）": {
    "code": "sleepy_drowsy",
    "tags": "1.35::sleepy::, drowsy, 1.4::half-closed eyes::, parted lips, blush",
    "prose": "with a drowsy, half-awake expression and heavy-lidded eyes",
    "short": "😪 困倦半醒"
  },
  "😠 傲娇羞恼·微嗔瞪视（tsundere, glaring, furrowed brow, pout, heavy blush）": {
    "code": "tsundere_glare",
    "tags": "furrowed brow, v-shaped eyebrows, glaring, annoyed, 1.25::pout::, closed mouth, heavy blush",
    "prose": "with a flustered, pouting tsundere glare and deep blush",
    "short": "😠 傲娇微嗔"
  },
  "😶 无口清冷·淡漠平静（expressionless, kuudere, closed mouth, calm）": {
    "code": "kuudere_calm",
    "tags": "1.35::expressionless::, kuudere, calm, closed mouth, slight blush",
    "prose": "with a cool, composed expressionless face",
    "short": "😶 无口清冷"
  },
  "😱 惊慌失措·瞳孔收缩（surprised, wide-eyed, constricted pupils, open mouth）": {
    "code": "surprised_panic",
    "tags": "1.3::surprised::, 1.3::wide-eyed::, constricted pupils, open mouth, furrowed brow, sweatdrop, blush",
    "prose": "with a startled, wide-eyed expression and parted mouth",
    "short": "😱 惊慌睁眼"
  },
  "✏️ 纯自定义组合（仅使用下方眼/嘴/眉红细分项与自定义框）": {
    "code": "custom_only",
    "tags": "",
    "prose": "",
    "short": "✏️ 自定义表情"
  }
};

export const EXPRESSION_EYE_PRESETS: Record<string, string> = {
  "随表情预设默认": "auto",
  "👁️ 自然睁眼 (open eyes)": "open",
  "😌 半阖迷离眼 (1.3::half-closed eyes::)": "half_closed",
  "😴 完全闭眼 (1.4::closed eyes::)": "closed",
  "😉 单眼眨眼 Wink (one eye closed, wink)": "wink",
  "😳 睁大惊愕眼 (1.3::wide-eyed::)": "wide",
  "🙄 翻白眼失神 (1.3::rolling eyes::)": "rolling",
  "😒 半眯鄙视眼 (1.3::jitome::)": "jitome"
};

export const EXPRESSION_MOUTH_PRESETS: Record<string, string> = {
  "随表情预设默认": "auto",
  "🙂 闭合微抿 (closed mouth)": "closed",
  "👄 微张喘息 (parted lips)": "parted",
  "😮 张口娇喘 (open mouth, heavy breathing)": "open_pant",
  "😊 温柔微笑 (gentle smile, slight smile)": "smile",
  "😏 坏笑/得意笑 (smug, smirk, grin)": "smug_grin",
  "😛 俏皮吐舌 (:p, tongue out)": "playful_tongue",
  "🥵 伸舌滴涎 (1.35::tongue out::, drooling)": "drool_tongue",
  "😬 咬紧下唇 (1.3::biting lip::)": "bite_lip",
  "😒 嘟嘴微嗔 (1.3::pout::)": "pout"
};

export const EXPRESSION_BLUSH_PRESETS: Record<string, string> = {
  "随表情预设默认": "auto",
  "🌸 浅粉羞红 (light blush, shy)": "light",
  "🌺 浓重潮红+八字眉 (furrowed brow, heavy blush)": "heavy_furrow",
  "🥺 委屈蹙眉+泪光 (v-shaped eyebrows, watery eyes, blush)": "pitiful",
  "🚫 无红晕清爽 (no blush)": "none"
};

export const EXPR_EYE_TAGS: Record<string, string> = {
  "open": "open eyes",
  "half_closed": "1.3::half-closed eyes::",
  "closed": "1.4::closed eyes::",
  "wink": "one eye closed, wink",
  "wide": "1.3::wide-eyed::",
  "rolling": "1.3::rolling eyes::",
  "jitome": "1.3::jitome::"
};

export const EXPR_MOUTH_TAGS: Record<string, string> = {
  "closed": "closed mouth",
  "parted": "parted lips",
  "open_pant": "open mouth, heavy breathing",
  "smile": "gentle smile, slight smile",
  "smug_grin": "smug, smirk, grin",
  "playful_tongue": ":p, tongue out",
  "drool_tongue": "1.35::tongue out::, drooling",
  "bite_lip": "1.3::biting lip::",
  "pout": "1.3::pout::"
};

export const EXPR_BLUSH_TAGS: Record<string, string> = {
  "light": "light blush, shy",
  "heavy_furrow": "furrowed brow, heavy blush",
  "pitiful": "v-shaped eyebrows, watery eyes, blush",
  "none": "no blush"
};

export const EXPR_EYE_CONFLICT_TAGS: string[] = [
  "bedroom eyes",
  "blank stare",
  "closed eyes",
  "constricted pupils",
  "half-closed eyes",
  "jitome",
  "one eye closed",
  "open eyes",
  "rolling eyes",
  "sleep",
  "sleeping",
  "squeezed eyes",
  "upturned eyes",
  "wide-eyed",
  "wink"
];

export const EXPR_MOUTH_CONFLICT_TAGS: string[] = [
  ":p",
  "biting lip",
  "clenched teeth",
  "closed mouth",
  "drooling",
  "evil smile",
  "frown",
  "gentle smile",
  "glossy lips",
  "grin",
  "kissing face",
  "licking lips",
  "naughty face",
  "open mouth",
  "parted lips",
  "pout",
  "pouting",
  "puckered lips",
  "saliva",
  "seductive smile",
  "slack-jawed",
  "slight smile",
  "slightly open mouth",
  "smile",
  "smirk",
  "smug",
  "tongue out",
  "wet lips"
];

export const EXPR_BLUSH_CONFLICT_TAGS: string[] = [
  "blush",
  "full-face blush",
  "furrowed brow",
  "heavy blush",
  "light blush",
  "no blush",
  "shy",
  "soft blush",
  "v-shaped eyebrows"
];

export const STORY_CHAPTERS: Array<{ id: string; title: string; actor_type: string }> = [
  {
    "id": "F00",
    "title": "✨ 正脸试妆 · 晨光白床跪坐前倾（正面状态校验）",
    "actor_type": "Solo"
  },
  {
    "id": "S00",
    "title": "第 00 幕 · 沙发跪爬吐舌回眸",
    "actor_type": "Solo"
  },
  {
    "id": "S01",
    "title": "第 01 幕 · 沙发跪爬口部互动进行中",
    "actor_type": "Duo"
  },
  {
    "id": "S02",
    "title": "第 02 幕 · 口部事后松口拉丝 + 发丝沾染",
    "actor_type": "Duo"
  },
  {
    "id": "S03",
    "title": "第 03 幕 · 事前 vs 事后拉丝双格漫画差分 (2koma)",
    "actor_type": "2koma"
  },
  {
    "id": "S04",
    "title": "第 04 幕 · 骑乘位双格：左深坐溢流 ➔ 右微抬脱出疲软拉丝",
    "actor_type": "2koma"
  },
  {
    "id": "S05",
    "title": "第 05 幕 · 单人犬式单侧屈膝高抬腿排泄 + 大滩积液",
    "actor_type": "Solo"
  },
  {
    "id": "S06",
    "title": "第 06 幕 · 体力透支仰躺沙发熟睡 + 小腹积存一滩白浊",
    "actor_type": "Solo"
  },
  {
    "id": "S07",
    "title": "第 07 幕 · 熟睡盘腿脚心相对 + 双手抓脚足交（双脚糊满拉丝）",
    "actor_type": "Duo"
  },
  {
    "id": "S08",
    "title": "第 08 幕 · 盘腿抓脚互动中被弄醒 · 睡眼惺忪略带妩媚",
    "actor_type": "Duo"
  },
  {
    "id": "S09",
    "title": "第 09 幕 · 欺身单手轻拢脖颈 · 迷离仰视（中近景全痕迹保留）",
    "actor_type": "Duo"
  },
  {
    "id": "S10",
    "title": "第 10 幕 · 单手轻拢脖颈 + 传教士位压身深入（全痕迹保留）",
    "actor_type": "Duo"
  },
  {
    "id": "S11",
    "title": "第 11 幕 · 传教士位双腿间拔出外射至小腹（全痕迹叠加）",
    "actor_type": "Duo"
  }
];

export const MULTI_ANGLE_CHAPTERS: Array<{ id: string; title: string; actor_type: string }> = [
  {
    "id": "MA0",
    "title": "00 三视图设定表 · 正/侧/背全身 (1216x832)",
    "actor_type": "MultiAngle"
  },
  {
    "id": "MA1",
    "title": "01 仰视站立 · 低机位背手微倾",
    "actor_type": "MultiAngle"
  },
  {
    "id": "MA2",
    "title": "02 俯视抱膝 · 地板坐姿仰望",
    "actor_type": "MultiAngle"
  },
  {
    "id": "MA3",
    "title": "03 侧三分之四 · 窗边拂发回望",
    "actor_type": "MultiAngle"
  },
  {
    "id": "MA4",
    "title": "04 背后回眸 · 沙发跪坐转身",
    "actor_type": "MultiAngle"
  },
  {
    "id": "MA5",
    "title": "05 平视伸懒腰 · 举臂开心微笑",
    "actor_type": "MultiAngle"
  },
  {
    "id": "MA6",
    "title": "06 侧卧撑头 · 床面手肘倚枕 (1216x832)",
    "actor_type": "MultiAngle"
  },
  {
    "id": "MA7",
    "title": "07 近景特写 · 歪头比耶俏皮眨眼",
    "actor_type": "MultiAngle"
  },
  {
    "id": "MA8",
    "title": "08 盘腿托腮 · 柔毯前倾好奇凝视",
    "actor_type": "MultiAngle"
  }
];

export const MULTI_ANGLE_TEMPLATES: Record<string, { title: string; canvas: string; allow_multi_views: boolean; scene: string; prose: string }> = {
  "MA0": {
    "title": "MA0 · 三视图设定表 (Three-View Sheet)",
    "canvas": "横图 1216x832",
    "allow_multi_views": true,
    "scene": "1.4::character sheet::, 1.4::turnaround::, 1.35::multiple views::, three views, front view, side view, back view, full body, standing, relaxed neutral pose, simple white background, clean reference sheet, looking at viewer, slight smile",
    "prose": "standing in a clean three-view character turnaround reference sheet showing front, side, and back views on a simple light background."
  },
  "MA1": {
    "title": "MA1 · 仰视站立 (Low Angle Standing)",
    "canvas": "竖图 832x1216",
    "allow_multi_views": false,
    "scene": "1.35::low angle::, 1.3::from below::, full body, standing, hands clasped behind back, slight tilt forward, looking down at viewer, foreshortening, indoors, cozy sunlit bedroom",
    "prose": "standing indoors in a cozy sunlit bedroom, hands clasped behind her back and leaning slightly forward while looking down at the viewer from a low angle."
  },
  "MA2": {
    "title": "MA2 · 俯视抱膝 (High Angle Hugging Knees)",
    "canvas": "竖图 832x1216",
    "allow_multi_views": false,
    "scene": "1.35::high angle::, 1.3::from above::, sitting on warm wooden floor, knees up, hugging own knees, looking up at viewer, gentle shy expression, indoors, cozy room",
    "prose": "sitting on a warm wooden floor hugging her knees and looking up gently at the viewer from a high angle."
  },
  "MA3": {
    "title": "MA3 · 侧三分之四窗边拂发 (Side 3/4 Window)",
    "canvas": "竖图 832x1216",
    "allow_multi_views": false,
    "scene": "three-quarter side view, upper body, standing beside sunlit window, gentle breeze, wind-blown hair, hand tucking hair behind ear, gazing out the window, soft golden afternoon glow",
    "prose": "standing beside a sunlit window in three-quarter side view, tucking wind-blown hair behind her ear in soft golden glow."
  },
  "MA4": {
    "title": "MA4 · 背后回眸沙发跪坐 (Back Over Shoulder)",
    "canvas": "竖图 832x1216",
    "allow_multi_views": false,
    "scene": "1.3::from behind::, back, 1.35::looking back::, over shoulder, upper body, kneeling on soft beige sofa, turning head toward viewer, indoors, soft cushions",
    "prose": "kneeling on a soft beige sofa seen from behind, turning her head over her shoulder toward the viewer."
  },
  "MA5": {
    "title": "MA5 · 平视伸懒腰 (Morning Stretch)",
    "canvas": "竖图 832x1216",
    "allow_multi_views": false,
    "scene": "eye-level, cowboy shot, arms raised overhead, morning stretch, leaning slightly back, relaxed cheerful smile, looking at viewer, indoors, sunlit bedroom",
    "prose": "stretching both arms overhead with a relaxed cheerful smile in an eye-level cowboy shot inside a sunlit bedroom."
  },
  "MA6": {
    "title": "MA6 · 侧卧撑头床面倚枕 (Lying On Side)",
    "canvas": "横图 1216x832",
    "allow_multi_views": false,
    "scene": "1.3::lying on side::, lying on bed, white bedsheet, head propped on hand, elbow resting on pillow, upper body, legs bent comfortably, looking at viewer, gentle relaxed gaze",
    "prose": "lying on her side on a white bedsheet with her head propped on one hand and elbow resting on a pillow, gazing gently at the viewer."
  },
  "MA7": {
    "title": "MA7 · 近景歪头比耶特写 (Close-Up Peace Sign)",
    "canvas": "竖图 832x1216",
    "allow_multi_views": false,
    "scene": "1.3::close-up::, portrait, head tilt, peace sign near cheek, playful cheerful expression, one eye slightly narrowed, looking at viewer, blurred warm indoor background",
    "prose": "in a close-up portrait tilting her head and making a playful peace sign near her cheek with a cheerful expression."
  },
  "MA8": {
    "title": "MA8 · 盘腿托腮柔毯前倾 (Cross-Legged Chin Rest)",
    "canvas": "竖图 832x1216",
    "allow_multi_views": false,
    "scene": "slight three-quarter angle, sitting cross-legged on soft rug, leaning forward, chin resting on both hands, elbows on knees, curious bright gaze, looking at viewer, cozy sunlit living room",
    "prose": "sitting cross-legged on a soft rug, leaning forward with her chin resting on both hands and gazing curiously at the viewer."
  }
};

export const POS_MALE_MODE_PRESETS: Record<string, string> = {
  "👤 正常显示男方（默认无脸男 faceless male）": "normal",
  "👻 半透明虚影男方（不遮挡女方身体 silhouette）": "translucent",
  "🫥 完全隐形男方（空气互动感 invisible partner）": "invisible",
  "🚫 关闭男方（纯单人 1girl, solo · 保留姿势）": "off"
};

export const POS_STAGE_PRESETS: Record<string, string> = {
  "🔥 1. 射精前 · 进行中（默认专注体位连接 · 无白浊）": "before",
  "💦 2. 射精中 · 内射/迸发瞬间（climax / internal cumshot · 白浊喷涌）": "during",
  "🌊 3. 射精后 · 结合留存溢流（after ejaculation · 仍保持结合白浊满溢）": "after_inside",
  "🔗 4. 事后拔出 · 脱出拉丝/外射（pull out · 刚拔出拉丝与穴口白浊流淌）": "pull_out",
  "🌺 5. 事后宫脱 · 拔出带出子宫口白浊满溢（vaginal prolapse · 宫脱拉丝）": "prolapse"
};

export const POS_SCENE_PRESETS: Record<
  string,
  {
    code: string;
    tags: string;
    prose: string;
    badge: string;
    strip_indoor_pose?: boolean;
    unblock_dark?: boolean;
    extra_neg?: string;
  }
> = {
  "🛋️ 默认暖光室内沙发（indoors, couch, lamp）": {
    code: "default_couch",
    tags: "",
    prose: "",
    badge: "",
  },
  "🪟 晨光纱帘白床明亮卧室（bright window, curtains, sunlit bedroom, white bedsheet）": {
    code: "sunlit_window_bedroom",
    tags: "indoors, bedroom, bed, white bedsheet, bright window, curtains",
    prose: " in a bright sunlit bedroom beside sheer window curtains",
    badge: " · [🪟晨光白床卧室]",
    extra_neg: "outdoors, couch, sofa",
  },
  "🌸 落樱浅滩水波·粉霞晴空焦散（shallow water, cherry blossoms, caustics, pink sky）": {
    code: "cherry_shallow_water",
    tags: "outdoors, 1.35::shallow water::, in water, ripples, water reflection, 1.35::caustics::, cherry blossoms, falling petals, pink sky, bright sky, shiny skin, wet skin",
    prose:
      " in shallow rippling water beneath falling cherry blossom petals and a bright pink sky, with cyan water caustics reflecting onto her wet skin",
    badge: " · [🌸落樱浅滩]",
    strip_indoor_pose: true,
    extra_neg: "indoors, bedroom, bed, couch, sofa, pillow, bedsheet, curtains, ceiling, lamp",
  },
  "🗑️ 日式城市阴暗小巷·垃圾箱旁（alley, backstreet, trash can, garbage bag）": {
    code: "jp_dark_alley_trash",
    tags: "outdoors, 1.35::alley::, backstreet, japanese street, urban, narrow street, 1.3::dim lighting::, dark, shadow, 1.35::trash can::, garbage bag, cardboard box, air conditioner, utility pole, concrete wall, asphalt",
    prose: " in a dark, narrow Japanese urban back-alley beside trash cans and black garbage bags",
    badge: " · [🗑️阴暗后巷]",
    strip_indoor_pose: true,
    unblock_dark: true,
    extra_neg: "indoors, bedroom, bed, couch, sofa, pillow, bedsheet, curtains",
  },
};

export const POS_CATEGORIES: string[] = [
  "全部体位 (All)",
  "1. 仰卧·传教士系",
  "2. 女上位·骑乘坐姿系",
  "3. 后入·俯卧跪趴系",
  "4. 侧卧·汤匙交叉系",
  "5. 站立·悬空抱举系",
  "6. 口部·上半身特写系",
  "7. 外部部位·胸足腿手系",
  "8. 柔韧进阶·展示系",
  "9. 手部爱抚·指技前戏系"
];

export const ALL_POSITIONS_CHAPTERS: Array<{ id: string; title: string; category: string; actor_type: string }> = [
  {
    "id": "P01",
    "title": "P01 · 标准仰卧传教士位 (Classic Supine)",
    "category": "1. 仰卧·传教士系",
    "actor_type": "AllPos"
  },
  {
    "id": "P02",
    "title": "P02 · 双腿高举V字仰卧位 (Legs-Up Supine)",
    "category": "1. 仰卧·传教士系",
    "actor_type": "AllPos"
  },
  {
    "id": "P03",
    "title": "P03 · 屈膝压胸深折位 (Folded Press)",
    "category": "1. 仰卧·传教士系",
    "actor_type": "AllPos"
  },
  {
    "id": "P04",
    "title": "P04 · 双腿盘腰紧扣位 (Leg-Lock Embrace)",
    "category": "1. 仰卧·传教士系",
    "actor_type": "AllPos"
  },
  {
    "id": "P05",
    "title": "P05 · 单腿高抬侧展仰卧位 (Single-Leg-Up)",
    "category": "1. 仰卧·传教士系",
    "actor_type": "AllPos"
  },
  {
    "id": "P06",
    "title": "P06 · 边缘垂臀仰卧蝴蝶位 (Edge Reclining)",
    "category": "1. 仰卧·传教士系",
    "actor_type": "AllPos"
  },
  {
    "id": "P07",
    "title": "P07 · 抬臀反弓仰卧位 (Elevated Pelvis)",
    "category": "1. 仰卧·传教士系",
    "actor_type": "AllPos"
  },
  {
    "id": "P08",
    "title": "P08 · 标准跪姿女上位 (Kneeling Cowgirl)",
    "category": "2. 女上位·骑乘坐姿系",
    "actor_type": "AllPos"
  },
  {
    "id": "P09",
    "title": "P09 · 蹲踞开脚骑乘位 (Squatting Cowgirl)",
    "category": "2. 女上位·骑乘坐姿系",
    "actor_type": "AllPos"
  },
  {
    "id": "P10",
    "title": "P10 · 前倾伏胸贴面女上位 (Leaning-Forward Top)",
    "category": "2. 女上位·骑乘坐姿系",
    "actor_type": "AllPos"
  },
  {
    "id": "P11",
    "title": "P11 · 后仰双手向后撑女上位 (Leaning-Back Arch Top)",
    "category": "2. 女上位·骑乘坐姿系",
    "actor_type": "AllPos"
  },
  {
    "id": "P12",
    "title": "P12 · 背向跪姿反向骑乘位 (Reverse Cowgirl)",
    "category": "2. 女上位·骑乘坐姿系",
    "actor_type": "AllPos"
  },
  {
    "id": "P13",
    "title": "P13 · 背向蹲踞开脚骑乘位 (Reverse Squatting Top)",
    "category": "2. 女上位·骑乘坐姿系",
    "actor_type": "AllPos"
  },
  {
    "id": "P14",
    "title": "P14 · 面对面怀抱坐莲位 (Seated Lotus)",
    "category": "2. 女上位·骑乘坐姿系",
    "actor_type": "AllPos"
  },
  {
    "id": "P15",
    "title": "P15 · 背靠怀抱坐姿观音位 (Reverse Seated Lap)",
    "category": "2. 女上位·骑乘坐姿系",
    "actor_type": "AllPos"
  },
  {
    "id": "P16",
    "title": "P16 · 跨坐控腿主导女上位 (Amazon Top)",
    "category": "2. 女上位·骑乘坐姿系",
    "actor_type": "AllPos"
  },
  {
    "id": "P17",
    "title": "P17 · 标准四肢跪趴后入位 (Classic All-Fours)",
    "category": "3. 后入·俯卧跪趴系",
    "actor_type": "AllPos"
  },
  {
    "id": "P18",
    "title": "P18 · 塌腰贴胸高翘臀位 (Top-Down Bottom-Up)",
    "category": "3. 后入·俯卧跪趴系",
    "actor_type": "AllPos"
  },
  {
    "id": "P19",
    "title": "P19 · 平趴贴身俯卧位 (Flat Prone)",
    "category": "3. 后入·俯卧跪趴系",
    "actor_type": "AllPos"
  },
  {
    "id": "P20",
    "title": "P20 · 直立跪姿背拉手后入位 (Upright Kneeling Rear)",
    "category": "3. 后入·俯卧跪趴系",
    "actor_type": "AllPos"
  },
  {
    "id": "P21",
    "title": "P21 · 站立扶撑弯腰后入位 (Standing Bent-Over)",
    "category": "3. 后入·俯卧跪趴系",
    "actor_type": "AllPos"
  },
  {
    "id": "P22",
    "title": "P22 · 蛙式屈膝俯卧开胯位 (Frog-Leg Prone)",
    "category": "3. 后入·俯卧跪趴系",
    "actor_type": "AllPos"
  },
  {
    "id": "P23",
    "title": "P23 · 侧卧汤匙贴背位 (Spooning Side)",
    "category": "4. 侧卧·汤匙交叉系",
    "actor_type": "AllPos"
  },
  {
    "id": "P24",
    "title": "P24 · 侧卧单腿高抬展开位 (Side Leg-Raised)",
    "category": "4. 侧卧·汤匙交叉系",
    "actor_type": "AllPos"
  },
  {
    "id": "P25",
    "title": "P25 · 侧身交错剪刀位 (Lateral Crossed)",
    "category": "4. 侧卧·汤匙交叉系",
    "actor_type": "AllPos"
  },
  {
    "id": "P26",
    "title": "P26 · 站立面对面单腿挂腰壁咚位 (Standing Leg-Up)",
    "category": "5. 站立·悬空抱举系",
    "actor_type": "AllPos"
  },
  {
    "id": "P27",
    "title": "P27 · 面对面悬空抱举火车便当位 (Suspended Ekiben)",
    "category": "5. 站立·悬空抱举系",
    "actor_type": "AllPos"
  },
  {
    "id": "P28",
    "title": "P28 · 背向悬空抱举正面开脚位 (Reverse Ekiben)",
    "category": "5. 站立·悬空抱举系",
    "actor_type": "AllPos"
  },
  {
    "id": "P29",
    "title": "P29 · 玻璃窗前贴胸站立位 (Pressed On Glass)",
    "category": "5. 站立·悬空抱举系",
    "actor_type": "AllPos"
  },
  {
    "id": "P30",
    "title": "P30 · 跪姿仰视双手奉仕位 (Kneeling Upward Oral)",
    "category": "6. 口部·上半身特写系",
    "actor_type": "AllPos"
  },
  {
    "id": "P31",
    "title": "P31 · 前倾扶头近景深部特写 (Close Forward Oral)",
    "category": "6. 口部·上半身特写系",
    "actor_type": "AllPos"
  },
  {
    "id": "P32",
    "title": "P32 · 仰躺边缘垂首倒挂位 (Inverted Head-Back)",
    "category": "6. 口部·上半身特写系",
    "actor_type": "AllPos"
  },
  {
    "id": "P33",
    "title": "P33 · 上下交叠互侍 69 位 (Mutual 69)",
    "category": "6. 口部·上半身特写系",
    "actor_type": "AllPos"
  },
  {
    "id": "P34",
    "title": "P34 · 跨骑俯视坐颜位 (Straddling Low-Angle)",
    "category": "6. 口部·上半身特写系",
    "actor_type": "AllPos"
  },
  {
    "id": "P35",
    "title": "P35 · 双手拢胸夹持奉仕位 (Cleavage Press / Paizuri)",
    "category": "7. 外部部位·胸足腿手系",
    "actor_type": "AllPos"
  },
  {
    "id": "P36",
    "title": "P36 · 坐姿双脚心相对足部奉仕位 (Foot Press / Footjob)",
    "category": "7. 外部部位·胸足腿手系",
    "actor_type": "AllPos"
  },
  {
    "id": "P37",
    "title": "P37 · 紧闭大腿根贴合素股位 (Thigh Squeeze / Sumata)",
    "category": "7. 外部部位·胸足腿手系",
    "actor_type": "AllPos"
  },
  {
    "id": "P38",
    "title": "P38 · 翘臀贴合磨擦奉仕位 (Glute Press / Assjob)",
    "category": "7. 外部部位·胸足腿手系",
    "actor_type": "AllPos"
  },
  {
    "id": "P39",
    "title": "P39 · 贴身双手环握奉仕位 (Two-Handed Grip / Handjob)",
    "category": "7. 外部部位·胸足腿手系",
    "actor_type": "AllPos"
  },
  {
    "id": "P40",
    "title": "P40 · 双腋穿臂悬空大开脚位 (Full Nelson Lifted)",
    "category": "8. 柔韧进阶·展示系",
    "actor_type": "AllPos"
  },
  {
    "id": "P41",
    "title": "P41 · 倒立折腰高举臀位 (Inverted Fold / Piledriver)",
    "category": "8. 柔韧进阶·展示系",
    "actor_type": "AllPos"
  },
  {
    "id": "P42",
    "title": "P42 · 站立一字马高抬腿平衡位 (Standing Vertical Split)",
    "category": "8. 柔韧进阶·展示系",
    "actor_type": "AllPos"
  },
  {
    "id": "P43",
    "title": "P43 · 正面M字开脚蹲坐展示位 (Solo M-Legs Showcase)",
    "category": "8. 柔韧进阶·展示系",
    "actor_type": "AllPos"
  },
  {
    "id": "P44",
    "title": "P44 · 跪趴塌腰回眸展示位 (Solo Rear-Arch Showcase)",
    "category": "8. 柔韧进阶·展示系",
    "actor_type": "AllPos"
  },
  {
    "id": "P45",
    "title": "P45 · 仰卧开腿双指深入指交位 (Supine Deep Fingering)",
    "category": "9. 手部爱抚·指技前戏系",
    "actor_type": "AllPos"
  },
  {
    "id": "P46",
    "title": "P46 · 背后拥抱一手揉胸一手抠弄位 (Rear Grope & Fingering)",
    "category": "9. 手部爱抚·指技前戏系",
    "actor_type": "AllPos"
  },
  {
    "id": "P47",
    "title": "P47 · 双手拨开阴唇精准玩弄阴蒂位 (Spread & Clitoral Tease)",
    "category": "9. 手部爱抚·指技前戏系",
    "actor_type": "AllPos"
  },
  {
    "id": "P48",
    "title": "P48 · 站立抬单腿探手深抠位 (Standing Leg-Up Fingering)",
    "category": "9. 手部爱抚·指技前戏系",
    "actor_type": "AllPos"
  },
  {
    "id": "P49",
    "title": "P49 · 跪趴塌腰后方探手抠弄潮吹位 (All-Fours Rear Fingering)",
    "category": "9. 手部爱抚·指技前戏系",
    "actor_type": "AllPos"
  },
  {
    "id": "P50",
    "title": "P50 · 背后环抱双手陷肉揉胸捏乳首 (Rear Dual Breast Grope)",
    "category": "9. 手部爱抚·指技前戏系",
    "actor_type": "AllPos"
  },
  {
    "id": "P51",
    "title": "P51 · 背后抱腿大开脚正面指交展示位 (Cradled M-Spread Fingering)",
    "category": "9. 手部爱抚·指技前戏系",
    "actor_type": "AllPos"
  }
];

export const ALL_POSITIONS_TEMPLATES: Record<string, { id: string; title: string; category: string; channel: string; canvas: string; pose_pov: string; pose_3rd: string; prose_core: string }> = {
  "P01": {
    "id": "P01",
    "title": "P01 · 标准仰卧传教士位 (Classic Supine)",
    "category": "1. 仰卧·传教士系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "1.25::from above::, lying on back, spread legs, arms above head, looking at viewer",
    "pose_3rd": "three-quarter view, high angle, lying on back, spread legs, knees bent, looking at viewer",
    "prose_core": "lying on her back with her legs parted and gazing up"
  },
  "P02": {
    "id": "P02",
    "title": "P02 · 双腿高举V字仰卧位 (Legs-Up Supine)",
    "category": "1. 仰卧·传教士系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "from above, lying on back, 1.35::legs up::, v-shaped legs, bare legs raised high, looking at viewer",
    "pose_3rd": "side three-quarter view, lying on back, 1.35::legs up::, ankles raised high in a V-shape",
    "prose_core": "lying on her back with both legs raised high in a V-shape"
  },
  "P03": {
    "id": "P03",
    "title": "P03 · 屈膝压胸深折位 (Folded Press)",
    "category": "1. 仰卧·传教士系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "1.3::from above::, lying on back, 1.4::folded::, knees to chest, ankles near shoulders, tilted hips, looking at viewer",
    "pose_3rd": "side view, lying on back, 1.4::folded::, knees pressed toward chest, raised pelvis",
    "prose_core": "lying folded on her back with her knees pressed close to her chest and hips tilted upward"
  },
  "P04": {
    "id": "P04",
    "title": "P04 · 双腿盘腰紧扣位 (Leg-Lock Embrace)",
    "category": "1. 仰卧·传教士系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "close-up, from above, lying on back, 1.35::leg lock::, ankles crossed, arms outstretched, looking at viewer",
    "pose_3rd": "three-quarter high angle, lying on back, 1.35::leg lock::, legs wrapped around waist, embrace",
    "prose_core": "lying on her back with her legs locked inward in a close embrace"
  },
  "P05": {
    "id": "P05",
    "title": "P05 · 单腿高抬侧展仰卧位 (Single-Leg-Up)",
    "category": "1. 仰卧·传教士系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "from above, lying on back, 1.35::one leg up::, asymmetrical legs, spread thigh, looking at viewer",
    "pose_3rd": "three-quarter view, lying on back, 1.35::one leg up::, one knee bent flat, asymmetric leg posture",
    "prose_core": "lying on her back with one leg lifted high and the other extended"
  },
  "P06": {
    "id": "P06",
    "title": "P06 · 边缘垂臀仰卧蝴蝶位 (Edge Reclining)",
    "category": "1. 仰卧·传教士系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "eye-level, lying on back, hips at edge, knees bent wide apart, arched waist, looking at viewer",
    "pose_3rd": "three-quarter low angle, reclining on back at edge, knees open wide, arched lower back",
    "prose_core": "reclining on her back at the edge with her hips forward and knees parted"
  },
  "P07": {
    "id": "P07",
    "title": "P07 · 抬臀反弓仰卧位 (Elevated Pelvis)",
    "category": "1. 仰卧·传教士系",
    "channel": "vaginal",
    "canvas": "横图 1216x832",
    "pose_pov": "high angle, lying on back, elevated hips, 1.3::arched back::, spread knees, hands gripping sheet",
    "pose_3rd": "side three-quarter view, lying on back, elevated pelvis, 1.3::arched back::, bent knees apart",
    "prose_core": "lying on her back with her pelvis elevated and lower back arched"
  },
  "P08": {
    "id": "P08",
    "title": "P08 · 标准跪姿女上位 (Kneeling Cowgirl)",
    "category": "2. 女上位·骑乘坐姿系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "low angle, from below, 1.35::girl on top::, straddling, kneeling, upright torso, looking down at viewer",
    "pose_3rd": "three-quarter low angle, 1.35::girl on top::, straddling, kneeling upright, hands on thighs",
    "prose_core": "kneeling upright in a straddling top posture while looking down"
  },
  "P09": {
    "id": "P09",
    "title": "P09 · 蹲踞开脚骑乘位 (Squatting Cowgirl)",
    "category": "2. 女上位·骑乘坐姿系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "low angle, from below, 1.4::squatting::, girl on top, straddling, wide knees, soles flat, looking down at viewer",
    "pose_3rd": "frontal three-quarter view, 1.4::squatting::, girl on top, straddling with wide-set knees",
    "prose_core": "squatting in a wide-knee straddling posture on top"
  },
  "P10": {
    "id": "P10",
    "title": "P10 · 前倾伏胸贴面女上位 (Leaning-Forward Top)",
    "category": "2. 女上位·骑乘坐姿系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "close-up, low angle, girl on top, straddling, 1.35::leaning forward::, arms forward, close face, looking at viewer",
    "pose_3rd": "three-quarter cowboy shot, girl on top, straddling, 1.35::leaning forward::, arched spine",
    "prose_core": "straddling on top while leaning closely forward"
  },
  "P11": {
    "id": "P11",
    "title": "P11 · 后仰双手向后撑女上位 (Leaning-Back Arch Top)",
    "category": "2. 女上位·骑乘坐姿系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "low angle, from below, girl on top, straddling, 1.35::leaning back::, arched back, arms supporting behind, head tilted back",
    "pose_3rd": "side three-quarter view, girl on top, straddling, 1.35::leaning back::, hands braced behind, arched torso",
    "prose_core": "straddling on top while leaning back on both hands with an arched spine"
  },
  "P12": {
    "id": "P12",
    "title": "P12 · 背向跪姿反向骑乘位 (Reverse Cowgirl)",
    "category": "2. 女上位·骑乘坐姿系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "low angle, 1.35::from behind::, girl on top, reverse straddle, kneeling, back, 1.3::looking back::, over shoulder",
    "pose_3rd": "rear three-quarter view, girl on top, reverse straddle, kneeling, arched back, looking back over shoulder",
    "prose_core": "kneeling in a reverse straddling posture seen from behind while glancing over her shoulder"
  },
  "P13": {
    "id": "P13",
    "title": "P13 · 背向蹲踞开脚骑乘位 (Reverse Squatting Top)",
    "category": "2. 女上位·骑乘坐姿系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "low angle, 1.35::from behind::, 1.4::squatting::, girl on top, reverse straddle, knees wide, looking back",
    "pose_3rd": "rear low angle, 1.4::squatting::, girl on top, reverse straddle, back view, looking back",
    "prose_core": "squatting with wide knees in a reverse straddling posture seen from behind"
  },
  "P14": {
    "id": "P14",
    "title": "P14 · 面对面怀抱坐莲位 (Seated Lotus)",
    "category": "2. 女上位·骑乘坐姿系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "close cowboy shot, 1.35::upright straddle::, sitting on lap, face-to-face, arms around neck, looking at viewer",
    "pose_3rd": "three-quarter view, 1.35::upright straddle::, sitting on lap, wrapped legs, close embrace",
    "prose_core": "sitting upright face-to-face on a lap with her legs wrapped inward"
  },
  "P15": {
    "id": "P15",
    "title": "P15 · 背靠怀抱坐姿观音位 (Reverse Seated Lap)",
    "category": "2. 女上位·骑乘坐姿系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "high angle, sitting on lap, leaning back, spread thighs, knees up, looking back up at viewer",
    "pose_3rd": "frontal view, sitting on lap from behind, leaning back, 1.35::spread legs::, knees raised, looking at viewer",
    "prose_core": "sitting leaned back with her knees raised and thighs parted toward the front"
  },
  "P16": {
    "id": "P16",
    "title": "P16 · 跨坐控腿主导女上位 (Amazon Top)",
    "category": "2. 女上位·骑乘坐姿系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "low angle, from below, girl on top, squatting forward, dominant posture, hands forward, looking down at viewer",
    "pose_3rd": "three-quarter view, amazon posture, girl straddling forward in a deep squat, looking at viewer",
    "prose_core": "straddling forward in a deep dominant squat while looking down"
  },
  "P17": {
    "id": "P17",
    "title": "P17 · 标准四肢跪趴后入位 (Classic All-Fours)",
    "category": "3. 后入·俯卧跪趴系",
    "channel": "vaginal",
    "canvas": "横图 1216x832",
    "pose_pov": "1.35::from behind::, 1.3::all fours::, kneeling, arched back, raised hips, 1.3::looking back::, over shoulder",
    "pose_3rd": "side three-quarter rear view, 1.3::all fours::, kneeling, arched lower back, looking back at viewer",
    "prose_core": "on all fours with an arched lower back while looking back over her shoulder"
  },
  "P18": {
    "id": "P18",
    "title": "P18 · 塌腰贴胸高翘臀位 (Top-Down Bottom-Up)",
    "category": "3. 后入·俯卧跪趴系",
    "channel": "vaginal",
    "canvas": "横图 1216x832",
    "pose_pov": "1.35::from behind::, 1.4::top-down bottom-up::, chest down, forearms down, hips high, arched spine, looking back",
    "pose_3rd": "side three-quarter view, 1.4::top-down bottom-up::, chest pressed low, raised hips, looking back",
    "prose_core": "resting her chest low on her forearms with her hips raised high and spine arched"
  },
  "P19": {
    "id": "P19",
    "title": "P19 · 平趴贴身俯卧位 (Flat Prone)",
    "category": "3. 后入·俯卧跪趴系",
    "channel": "vaginal",
    "canvas": "横图 1216x832",
    "pose_pov": "high angle, 1.35::from behind::, 1.35::lying on stomach::, prone, slightly parted legs, head turned back, looking at viewer",
    "pose_3rd": "side three-quarter view, 1.35::lying on stomach::, flat prone posture, head resting on arms, looking at viewer",
    "prose_core": "lying flat on her stomach with her head turned back toward the viewer"
  },
  "P20": {
    "id": "P20",
    "title": "P20 · 直立跪姿背拉手后入位 (Upright Kneeling Rear)",
    "category": "3. 后入·俯卧跪趴系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "1.3::from behind::, kneeling upright, 1.3::arms behind back::, arched chest, head turned over shoulder, looking at viewer",
    "pose_3rd": "three-quarter side-rear view, kneeling upright, arms pulled back, arched posture, looking back",
    "prose_core": "kneeling upright with her arms drawn back and chest arched while glancing over her shoulder"
  },
  "P21": {
    "id": "P21",
    "title": "P21 · 站立扶撑弯腰后入位 (Standing Bent-Over)",
    "category": "3. 后入·俯卧跪趴系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "1.35::from behind::, standing, 1.35::bent over::, supporting hands forward, parted legs, looking back over shoulder",
    "pose_3rd": "three-quarter rear view, standing, 1.35::bent over::, torso leaned forward, one heel slightly raised, looking back",
    "prose_core": "standing bent forward with hands braced ahead while looking back over her shoulder"
  },
  "P22": {
    "id": "P22",
    "title": "P22 · 蛙式屈膝俯卧开胯位 (Frog-Leg Prone)",
    "category": "3. 后入·俯卧跪趴系",
    "channel": "vaginal",
    "canvas": "横图 1216x832",
    "pose_pov": "high angle, from behind, lying on stomach, bent knees spread wide, soles upward, looking back",
    "pose_3rd": "three-quarter overhead rear view, lying on stomach, frog-leg bent knees apart, looking back",
    "prose_core": "lying prone on her stomach with both knees bent outward to the sides"
  },
  "P23": {
    "id": "P23",
    "title": "P23 · 侧卧汤匙贴背位 (Spooning Side)",
    "category": "4. 侧卧·汤匙交叉系",
    "channel": "vaginal",
    "canvas": "横图 1216x832",
    "pose_pov": "close side view, 1.35::lying on side::, curled knees, head on pillow, looking back at viewer",
    "pose_3rd": "landscape view, 1.35::lying on side::, spooning posture, knees drawn up, looking at viewer",
    "prose_core": "lying on her side with her knees gently drawn up while glancing back"
  },
  "P24": {
    "id": "P24",
    "title": "P24 · 侧卧单腿高抬展开位 (Side Leg-Raised)",
    "category": "4. 侧卧·汤匙交叉系",
    "channel": "vaginal",
    "canvas": "横图 1216x832",
    "pose_pov": "three-quarter view, 1.3::lying on side::, 1.35::one leg raised::, open hip, supporting on elbow, looking at viewer",
    "pose_3rd": "landscape three-quarter view, lying on side, upper leg lifted high, open posture, looking at viewer",
    "prose_core": "lying on her side propped on one elbow with her upper leg lifted high"
  },
  "P25": {
    "id": "P25",
    "title": "P25 · 侧身交错剪刀位 (Lateral Crossed)",
    "category": "4. 侧卧·汤匙交叉系",
    "channel": "vaginal",
    "canvas": "横图 1216x832",
    "pose_pov": "high angle, reclining on side, 1.3::crossed legs::, asymmetrical open thighs, looking up at viewer",
    "pose_3rd": "overhead three-quarter view, reclining laterally with interlocked angled legs, looking at viewer",
    "prose_core": "reclining laterally with angled parted thighs while looking toward the viewer"
  },
  "P26": {
    "id": "P26",
    "title": "P26 · 站立面对面单腿挂腰壁咚位 (Standing Leg-Up)",
    "category": "5. 站立·悬空抱举系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "close cowboy shot, standing, face-to-face, 1.35::one leg lifted::, arms forward, looking at viewer",
    "pose_3rd": "three-quarter full-body shot, standing face-to-face, one leg hooked high at hip level, looking at viewer",
    "prose_core": "standing upright face-to-face with one leg lifted high at hip level"
  },
  "P27": {
    "id": "P27",
    "title": "P27 · 面对面悬空抱举火车便当位 (Suspended Ekiben)",
    "category": "5. 站立·悬空抱举系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "close shot, 1.4::lifted::, feet off ground, legs wrapped around waist, arms around neck, looking at viewer",
    "pose_3rd": "three-quarter full-body shot, 1.4::carried::, suspended in air face-to-face, legs wrapped high, feet off ground",
    "prose_core": "carried suspended in mid-air face-to-face with her arms around the neck and feet off the ground"
  },
  "P28": {
    "id": "P28",
    "title": "P28 · 背向悬空抱举正面开脚位 (Reverse Ekiben)",
    "category": "5. 站立·悬空抱举系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "high angle, carried from behind, knees lifted wide, feet dangling, looking back up at viewer",
    "pose_3rd": "frontal full-body shot, 1.4::carried from behind::, facing viewer, lifted under knees in a wide M-shape, feet off ground",
    "prose_core": "lifted in mid-air from behind facing forward with both knees held wide apart"
  },
  "P29": {
    "id": "P29",
    "title": "P29 · 玻璃窗前贴胸站立位 (Pressed On Glass)",
    "category": "5. 站立·悬空抱举系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "frontal view through glass, standing, 1.4::against glass::, palms pressed on glass, flattened chest, fogged glass, looking at viewer",
    "pose_3rd": "three-quarter view, standing, 1.4::against glass::, palms and chest pressed against clear windowpane, looking at viewer",
    "prose_core": "standing with both palms and chest pressed flat against a clear glass pane"
  },
  "P30": {
    "id": "P30",
    "title": "P30 · 跪姿仰视双手奉仕位 (Kneeling Upward Oral)",
    "category": "6. 口部·上半身特写系",
    "channel": "oral",
    "canvas": "竖图 832x1216",
    "pose_pov": "1.35::from above::, high angle, kneeling, upper body, 1.35::looking up::, looking at viewer, hands cupped near chin",
    "pose_3rd": "three-quarter high angle, kneeling, upper body, leaning forward, hands near mouth, looking up",
    "prose_core": "kneeling and gazing upward from a high angle with hands raised near her chin"
  },
  "P31": {
    "id": "P31",
    "title": "P31 · 前倾扶头近景深部特写 (Close Forward Oral)",
    "category": "6. 口部·上半身特写系",
    "channel": "oral",
    "canvas": "竖图 832x1216",
    "pose_pov": "1.35::close-up::, portrait, from above, leaning forward, teary eyes, blush, looking up at viewer",
    "pose_3rd": "side three-quarter close-up, leaning forward, hands resting on hair, teary eyes",
    "prose_core": "in an intimate close-up leaning forward with misty eyes gazing upward"
  },
  "P32": {
    "id": "P32",
    "title": "P32 · 仰躺边缘垂首倒挂位 (Inverted Head-Back)",
    "category": "6. 口部·上半身特写系",
    "channel": "oral",
    "canvas": "竖图 832x1216",
    "pose_pov": "top-down view, lying on back, 1.35::upside-down::, head tilted back over edge, hair hanging down, looking at viewer",
    "pose_3rd": "side three-quarter view, lying on back at edge, head hanging backward, hair cascading down",
    "prose_core": "lying on her back with her head tilted backward over the edge and hair hanging down"
  },
  "P33": {
    "id": "P33",
    "title": "P33 · 上下交叠互侍 69 位 (Mutual 69)",
    "category": "6. 口部·上半身特写系",
    "channel": "oral",
    "canvas": "横图 1216x832",
    "pose_pov": "low angle close view, straddling above, thighs framing view, leaning down",
    "pose_3rd": "landscape side view, horizontal opposing posture, kneeling above on all fours, arched hips",
    "prose_core": "poised horizontally in a mutual opposing posture with arched hips"
  },
  "P34": {
    "id": "P34",
    "title": "P34 · 跨骑俯视坐颜位 (Straddling Low-Angle)",
    "category": "6. 口部·上半身特写系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "1.45::from below::, worm's-eye view, kneeling directly over viewer, thighs framing camera, looking down at viewer",
    "pose_3rd": "low-angle three-quarter shot, kneeling astride head level, looking down",
    "prose_core": "kneeling astride directly overhead while looking down from a steep low angle"
  },
  "P35": {
    "id": "P35",
    "title": "P35 · 双手拢胸夹持奉仕位 (Cleavage Press / Paizuri)",
    "category": "7. 外部部位·胸足腿手系",
    "channel": "chest",
    "canvas": "竖图 832x1216",
    "pose_pov": "1.35::from above::, close-up, kneeling, leaning forward, 1.35::looking up::, looking at viewer",
    "pose_3rd": "three-quarter high-angle cowboy shot, kneeling, leaning forward, arms pressed inward, looking at viewer",
    "prose_core": "kneeling and leaning forward while pressing both arms inward around her chest"
  },
  "P36": {
    "id": "P36",
    "title": "P36 · 坐姿双脚心相对足部奉仕位 (Foot Press / Footjob)",
    "category": "7. 外部部位·胸足腿手系",
    "channel": "foot",
    "canvas": "竖图 832x1216",
    "pose_pov": "sitting, leaning back on hands, legs extended toward viewer, 1.35::foot focus::, foreshortening, looking at viewer",
    "pose_3rd": "three-quarter view, sitting leaned back, both legs raised forward with soles pressed together, looking at viewer",
    "prose_core": "sitting leaned back on her hands with both feet extended forward and soles pressed together"
  },
  "P37": {
    "id": "P37",
    "title": "P37 · 紧闭大腿根贴合素股位 (Thigh Squeeze / Sumata)",
    "category": "7. 外部部位·胸足腿手系",
    "channel": "thigh",
    "canvas": "竖图 832x1216",
    "pose_pov": "low angle, kneeling astride, leaning slightly forward, inner thighs pressed close, looking down at viewer",
    "pose_3rd": "three-quarter cowboy shot, kneeling astride with thighs pressed snugly together, looking at viewer",
    "prose_core": "kneeling astride with her inner thighs pressed snugly together"
  },
  "P38": {
    "id": "P38",
    "title": "P38 · 翘臀贴合磨擦奉仕位 (Glute Press / Assjob)",
    "category": "7. 外部部位·胸足腿手系",
    "channel": "glute",
    "canvas": "竖图 832x1216",
    "pose_pov": "1.35::from behind::, close cowboy shot, kneeling, arched back, hips pushed back, 1.3::looking back::, over shoulder",
    "pose_3rd": "rear three-quarter shot, kneeling, arched spine, hips raised, looking back at viewer",
    "prose_core": "kneeling with her lower back arched and glutes pressed together while glancing back"
  },
  "P39": {
    "id": "P39",
    "title": "P39 · 贴身双手环握奉仕位 (Two-Handed Grip / Handjob)",
    "category": "7. 外部部位·胸足腿手系",
    "channel": "hand",
    "canvas": "竖图 832x1216",
    "pose_pov": "close cowboy shot, high angle, kneeling close, both hands raised together in front, shy gaze, looking at viewer",
    "pose_3rd": "three-quarter close shot, kneeling beside, both hands cupped together at chest height, looking at viewer",
    "prose_core": "kneeling up close with both hands cupped together in front while gazing shyly"
  },
  "P40": {
    "id": "P40",
    "title": "P40 · 双腋穿臂悬空大开脚位 (Full Nelson Lifted)",
    "category": "8. 柔韧进阶·展示系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "high angle, lifted, knees pulled wide toward shoulders, feet dangling, looking back up",
    "pose_3rd": "frontal full-body shot, 1.35::full nelson::, lifted from behind, arms behind neck, knees held wide apart, facing viewer",
    "prose_core": "lifted in mid-air from behind with her knees drawn high and wide apart facing forward"
  },
  "P41": {
    "id": "P41",
    "title": "P41 · 倒立折腰高举臀位 (Inverted Fold / Piledriver)",
    "category": "8. 柔韧进阶·展示系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "1.35::from above::, shoulders down, hips raised vertically, legs folded downward past ears, looking at viewer",
    "pose_3rd": "side three-quarter shot, inverted folded posture, shoulders resting low, hips vertical in air",
    "prose_core": "in an inverted folded posture with her shoulders low and hips raised vertically"
  },
  "P42": {
    "id": "P42",
    "title": "P42 · 站立一字马高抬腿平衡位 (Standing Vertical Split)",
    "category": "8. 柔韧进阶·展示系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "eye-level full-body, standing, 1.45::standing split::, one leg raised vertically upward, flexible, looking at viewer",
    "pose_3rd": "three-quarter full-body shot, 1.45::standing split::, one leg extended straight upward, balanced posture, looking at viewer",
    "prose_core": "balancing in a flexible standing vertical split with one leg raised straight upward"
  },
  "P43": {
    "id": "P43",
    "title": "P43 · 正面M字开脚蹲坐展示位 (Solo M-Legs Showcase)",
    "category": "8. 柔韧进阶·展示系",
    "channel": "solo",
    "canvas": "竖图 832x1216",
    "pose_pov": "frontal view, sitting, 1.45::m legs::, knees bent wide apart, hands resting on knees, leaning slightly back, looking at viewer",
    "pose_3rd": "three-quarter frontal shot, sitting, 1.45::m legs::, knees bent wide, soles flat, looking at viewer",
    "prose_core": "sitting facing forward in an M-shaped open-knee posture while looking at the viewer"
  },
  "P44": {
    "id": "P44",
    "title": "P44 · 跪趴塌腰回眸展示位 (Solo Rear-Arch Showcase)",
    "category": "8. 柔韧进阶·展示系",
    "channel": "solo",
    "canvas": "横图 1216x832",
    "pose_pov": "1.35::from behind::, all fours, deep arched back, raised hips, knees apart, 1.35::looking back::, over shoulder",
    "pose_3rd": "three-quarter rear shot, kneeling on all fours, arched lower back, looking back over shoulder at viewer",
    "prose_core": "kneeling on all fours with a deep arched back while turning her head over her shoulder"
  },
  "P45": {
    "id": "P45",
    "title": "P45 · 仰卧开腿双指深入指交位 (Supine Deep Fingering)",
    "category": "9. 手部爱抚·指技前戏系",
    "channel": "fingering",
    "canvas": "竖图 832x1216",
    "pose_pov": "1.3::from above::, lying on back, 1.35::spread legs::, knees bent wide, arched waist, looking at viewer",
    "pose_3rd": "three-quarter high angle, lying on back, spread legs, knees bent apart, hips slightly lifted, looking at viewer",
    "prose_core": "lying on her back with her knees bent wide apart and waist arching sensitively"
  },
  "P46": {
    "id": "P46",
    "title": "P46 · 背后拥抱一手揉胸一手抠弄位 (Rear Grope & Fingering)",
    "category": "9. 手部爱抚·指技前戏系",
    "channel": "grope_fingering",
    "canvas": "竖图 832x1216",
    "pose_pov": "close cowboy shot, sitting on lap, back against chest, spread thighs, head tilted back, looking up at viewer",
    "pose_3rd": "frontal full-body shot, sitting held from behind against chest, 1.35::spread legs::, knees open, looking at viewer",
    "prose_core": "held closely from behind with her back pressed against chest and thighs parted wide toward the camera"
  },
  "P47": {
    "id": "P47",
    "title": "P47 · 双手拨开阴唇精准玩弄阴蒂位 (Spread & Clitoral Tease)",
    "category": "9. 手部爱抚·指技前戏系",
    "channel": "clit_tease",
    "canvas": "竖图 832x1216",
    "pose_pov": "low angle, close shot, reclining on back, 1.4::m legs::, knees wide apart, hips tilted forward, looking down at viewer",
    "pose_3rd": "low-angle three-quarter shot, reclining leaned back, wide M-shaped legs exposing groin clearly, looking at viewer",
    "prose_core": "reclining with her legs spread wide in an M-shape and hips tilted openly forward"
  },
  "P48": {
    "id": "P48",
    "title": "P48 · 站立抬单腿探手深抠位 (Standing Leg-Up Fingering)",
    "category": "9. 手部爱抚·指技前戏系",
    "channel": "fingering",
    "canvas": "竖图 832x1216",
    "pose_pov": "cowboy shot, standing, against wall, 1.35::one leg lifted::, open hip, leaning against wall, looking at viewer",
    "pose_3rd": "three-quarter full-body shot, standing pinned against wall, 1.35::one leg lifted::, knee hooked high, looking at viewer",
    "prose_core": "standing leaned back with one leg lifted high to expose her open hip"
  },
  "P49": {
    "id": "P49",
    "title": "P49 · 跪趴塌腰后方探手抠弄潮吹位 (All-Fours Rear Fingering)",
    "category": "9. 手部爱抚·指技前戏系",
    "channel": "fingering",
    "canvas": "横图 1216x832",
    "pose_pov": "1.35::from behind::, all fours, arched back, raised hips, knees apart, 1.3::looking back::, over shoulder",
    "pose_3rd": "rear three-quarter shot, kneeling on all fours, chest low, hips raised high, looking back at viewer",
    "prose_core": "kneeling on all fours with her spine arched low and hips raised while glancing back over her shoulder"
  },
  "P50": {
    "id": "P50",
    "title": "P50 · 背后环抱双手陷肉揉胸捏乳首 (Rear Dual Breast Grope)",
    "category": "9. 手部爱抚·指技前戏系",
    "channel": "breast_grope",
    "canvas": "竖图 832x1216",
    "pose_pov": "high angle, close cowboy shot, kneeling between legs, back against chest, head tilted back, looking up at viewer",
    "pose_3rd": "frontal cowboy shot, held from behind, arched chest pushed forward, arms held down at sides, looking at viewer",
    "prose_core": "held closely from behind with her chest arched forward"
  },
  "P51": {
    "id": "P51",
    "title": "P51 · 背后抱腿大开脚正面指交展示位 (Cradled M-Spread Fingering)",
    "category": "9. 手部爱抚·指技前戏系",
    "channel": "fingering",
    "canvas": "竖图 832x1216",
    "pose_pov": "frontal low angle, 1.35::carried from behind::, lifted under knees, wide M-legs in air, looking down at viewer",
    "pose_3rd": "frontal full-body shot, 1.35::carried from behind::, both knees cradled high and wide apart, feet off ground, facing viewer",
    "prose_core": "cradled from behind under both knees with her legs held wide open facing forward"
  }
};

export const CAMERA_SHOT_PRESETS: Record<string, string> = {
  "随原幕景别": "auto",
  "面部特写 (Close-up)": "extreme_closeup",
  "近景半身 (Upper Body)": "upper_body",
  "中景七分 (Cowboy Shot)": "cowboy",
  "全身全景 (Full Body)": "full_body",
  "环境远景 (Wide Shot)": "wide_shot"
};

export const CAMERA_GAZE_PRESETS: Record<string, string> = {
  "👁️ 始终看镜头（背后自动回眸）": "auto_look",
  "📌 保持本幕原有视线": "keep_scene",
  "🙈 自然不看镜头（沉浸旁观感）": "natural_away"
};

export const CAMERA_QUICK_PRESETS: Array<[string, number, number, string | null, boolean]> = [
  [
    "正面平视",
    0,
    0,
    null,
    false
  ],
  [
    "前侧 3/4",
    42,
    12,
    null,
    false
  ],
  [
    "正侧 90°",
    90,
    0,
    null,
    false
  ],
  [
    "高机位俯拍",
    25,
    42,
    null,
    false
  ],
  [
    "正顶鸟瞰",
    0,
    78,
    null,
    true
  ],
  [
    "低机位仰拍",
    0,
    -34,
    null,
    false
  ],
  [
    "贴地大仰角",
    15,
    -66,
    null,
    true
  ],
  [
    "侧后 3/4",
    138,
    16,
    null,
    false
  ],
  [
    "正后背影",
    180,
    8,
    null,
    false
  ],
  [
    "后上方俯视",
    165,
    42,
    null,
    false
  ]
];

export const ANGLE_TAGS_TO_STRIP: string[] = [
  "angled view",
  "back",
  "back view",
  "bird's-eye view",
  "close side view",
  "dutch angle",
  "extreme low angle",
  "eye-level",
  "from above",
  "from behind",
  "from below",
  "from side",
  "front view",
  "frontal three-quarter view",
  "frontal view",
  "high angle",
  "landscape side view",
  "landscape three-quarter view",
  "landscape view",
  "low angle",
  "overhead",
  "overhead shot",
  "overhead three-quarter view",
  "pov",
  "pov crotch",
  "pov hands",
  "profile",
  "rear close shot",
  "rear low angle",
  "rear three-quarter view",
  "rear view",
  "side three-quarter close-up",
  "side three-quarter rear view",
  "side three-quarter view",
  "side view",
  "slight three-quarter angle",
  "straight-on",
  "three-quarter close shot",
  "three-quarter cowboy shot",
  "three-quarter frontal shot",
  "three-quarter full-body shot",
  "three-quarter high angle",
  "three-quarter high-angle cowboy shot",
  "three-quarter low angle",
  "three-quarter rear shot",
  "three-quarter rear view",
  "three-quarter side view",
  "three-quarter view",
  "tilted frame",
  "top-down",
  "top-down view",
  "worm's-eye view"
];

export const SHOT_TAGS_TO_STRIP: string[] = [
  "close cowboy shot",
  "close shot",
  "close-up",
  "cowboy shot",
  "distant",
  "eye-level",
  "eye-level full-body",
  "face focus",
  "frontal full-body shot",
  "full body",
  "portrait",
  "upper body",
  "wide shot"
];

export const GAZE_TAGS_TO_STRIP: string[] = [
  "looking at viewer",
  "looking away",
  "looking back",
  "looking back at viewer",
  "looking back over shoulder",
  "looking back up",
  "looking back up at viewer",
  "looking down",
  "looking down at viewer",
  "looking up",
  "looking up at viewer",
  "over shoulder"
];

export const NAI_IMAGE_ENDPOINT = "https://image.novelai.net";
export const MODEL_V5_FULL_MEDIUM = "nai-diffusion-5-full-medium";
export const MODEL_V4_5_FULL = "nai-diffusion-4-5-full";
export const NAI_MODEL_OPTIONS: Array<{ id: "nai-diffusion-5-full-medium" | "nai-diffusion-4-5-full"; label: string }> = [
  { id: "nai-diffusion-5-full-medium", label: "⚡ V5 Full Medium (14步极速 · 512词 · 原生透明底)" },
  { id: "nai-diffusion-4-5-full", label: "🪪 V4.5 Full (28步精绘 · 支持 Character 精密参照)" },
];
export const MAX_T5_TOKENS = 512;
export const V5_HEAVY_UC_BASE = "lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page";
export const V4_5_LIGHT_UC_BASE = "lowres, artistic error, scan artifacts, worst quality, bad quality, jpeg artifacts, multiple views, very displeasing, too many watermarks, negative space, blank page";
export const V4_5_HUMAN_FOCUS_UC_BASE = "lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page, @_@, mismatched pupils, glowing eyes, bad anatomy";
export const V5_QUALITY_SUFFIX = "very aesthetic, masterpiece, no text";
export const CANVAS_PRESETS: Record<string, [number, number] | null> = {
  "🔄 自动跟随本幕推荐画布": null,
  "📱 竖图 832x1216 (标准 Portrait)": [
    832,
    1216
  ],
  "🖥️ 横图 1216x832 (标准 Landscape)": [
    1216,
    832
  ],
  "⬛ 方图 1024x1024 (标准 Square)": [
    1024,
    1024
  ]
};
export const POSITION_GRID: Record<string, { x: number; y: number }> = {
  "A1": {
    "x": 0.1,
    "y": 0.1
  },
  "A2": {
    "x": 0.1,
    "y": 0.3
  },
  "A3": {
    "x": 0.1,
    "y": 0.5
  },
  "A4": {
    "x": 0.1,
    "y": 0.7
  },
  "A5": {
    "x": 0.1,
    "y": 0.9
  },
  "B1": {
    "x": 0.3,
    "y": 0.1
  },
  "B2": {
    "x": 0.3,
    "y": 0.3
  },
  "B3": {
    "x": 0.3,
    "y": 0.5
  },
  "B4": {
    "x": 0.3,
    "y": 0.7
  },
  "B5": {
    "x": 0.3,
    "y": 0.9
  },
  "C1": {
    "x": 0.5,
    "y": 0.1
  },
  "C2": {
    "x": 0.5,
    "y": 0.3
  },
  "C3": {
    "x": 0.5,
    "y": 0.5
  },
  "C4": {
    "x": 0.5,
    "y": 0.7
  },
  "C5": {
    "x": 0.5,
    "y": 0.9
  },
  "D1": {
    "x": 0.7,
    "y": 0.1
  },
  "D2": {
    "x": 0.7,
    "y": 0.3
  },
  "D3": {
    "x": 0.7,
    "y": 0.5
  },
  "D4": {
    "x": 0.7,
    "y": 0.7
  },
  "D5": {
    "x": 0.7,
    "y": 0.9
  },
  "E1": {
    "x": 0.9,
    "y": 0.1
  },
  "E2": {
    "x": 0.9,
    "y": 0.3
  },
  "E3": {
    "x": 0.9,
    "y": 0.5
  },
  "E4": {
    "x": 0.9,
    "y": 0.7
  },
  "E5": {
    "x": 0.9,
    "y": 0.9
  }
};
