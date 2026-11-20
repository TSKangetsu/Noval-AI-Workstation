// NovelAI V4.5 / V5 Workbench Core Engine Constants & Preset Libraries

export const QUALITY_TAGS = "masterpiece, best quality, 0.8::very aesthetic::, absurdres, year 2025";

export const BUILTIN_CHARACTERS: Record<string, Record<string, string>> = {
  "标枪 Javelin（碧蓝航线 · 默认）": {
    "char_tag": "javelin (azur lane)",
    "eng_name": "Javelin",
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
    "canon_neg_tags": "necktie, sleeveless shirt, detached sleeves, headset, pleated skirt",
    "canon_outfit": "sleeveless grey shirt, cyan necktie, detached sleeves, black pleated skirt",
    "canon_top_only": "sleeveless grey shirt, cyan necktie, detached sleeves",
    "canon_bottom_neg": "skirt, pleated skirt",
    "canon_prose": "her canonical sleeveless shirt, cyan tie, and pleated skirt",
    "body_preset": "匀称修长少女（slender, narrow waist, long legs）",
    "bust_preset": "小巧适中（small breasts）"
  },
  "原创角色 OC（无需作品Tag · 用额外常驻Tag定义外貌）": {
    "char_tag": "original",
    "eng_name": "the girl",
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
  "⭐ 🧬 标枪 M2 · 极细净线青瞳 (mikozin 0.62 + 内置3槽Vibe)": {
    "preset_name": "⭐ 🧬 标枪 M2 · 极细净线青瞳 (mikozin 0.62 + 内置3槽Vibe)",
    "bundled_vibe_pack": "m2_mikozin062_triple",
    "char_tag": "javelin (azur lane)",
    "eng_name": "Javelin",
    "canon_neg_tags": "neckerchief, serafuku, plaid, gloves, crown, tiara, hair crown, cat ears, animal ears, heterochromia, yellow button, brooch, wristband, bracelet",
    "extra_char_tags": "",
    "body_preset": "纤柔嫩骨·精致锁骨双向防折痕少女（Slim-Tender · 无腹褶无肋骨）",
    "bust_preset": "小巧适中（small breasts）",
    "skin_preset": "自然暖透肤（原版默认）",
    "outfit_preset": "🎽 滑肩宽松白背心 + 深蓝运动短裤（露锁骨居家休闲 · 解扣拨档）",
    "outfit_state_mode": "🔄 智能适配穿脱（原设/裙装自动撩裙拨内裤 · 单件上衣自动真空）",
    "custom_outfit_tags": "",
    "keep_canon_elements": false,
    "legwear_preset": "赤足裸腿（barefoot 默认）",
    "add_cat_ears": false,
    "add_horns_tail": false,
    "add_glasses": false,
    "add_choker": false,
    "add_extra_sweat": false,
    "style_preset": "🧬✨ M2 单画师极细净线赛璐璐风（mikozin 0.62 + 净黑细线 · 内置3槽Vibe调校）",
    "lighting_preset": "💎👁️ 极细净黑线 · 丝绒渐变瞳双眼皮睫毛 + 三阶奶桃锁骨柔影（M2 Razor-Fine Cel）",
    "env_preset": "🪴 落地窗日光绿植 · 绒毛米色地毯木地板（furry beige rug, floor-to-ceiling window, potted plant）",
    "pos_scene": "🪴 落地窗日光绿植 · 绒毛米色地毯木地板（furry beige rug, floor-to-ceiling window, potted plant）",
    "custom_style_pos": "",
    "custom_style_neg": "",
    "morph_preset": "1D 微明显蝴蝶低过渡（原版默认）",
    "pubic_preset": "默认不额外指定",
    "pigment_preset": "3A 透肤暖珊瑚无色差（原版默认）",
    "fluid_scale": 1.0,
    "perspective_mode": "3rd",
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
    "enable_t5_prose": true,
    "enable_negatives": true,
    "enable_multi_angle_nsfw": false
  },
  "⭐ hood2": {
    "preset_name": "⭐ hood2",
    "char_tag": "hood (azur lane)",
    "eng_name": "hood",
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
  ],
  "娇小细腰宽胯肉腿圆脸（petite, wide hips, thick thighs, round face）": [
    "1.2::petite::, small breasts, narrow waist, wide hips, 1.3::thick thighs::, long legs, round face",
    "tall female, mature female, skinny, obese"
  ],
  "袖珍娇小窄肩细腰笔直长腿·微Q萌圆脸（0.25 chibi + short slender mini-lady）": [
    "0.25::chibi::, 1.25::short female::, 1.15::very short::, 1.2::petite::, small frame, 1.3::slender::, 1.3::slender legs::, slim waist, narrow shoulders, 1.25::narrow hips::, -0.45::wide hips::, -0.45::thick thighs::, -0.40::plump::, short torso, small breasts, thigh gap, long legs, short face, round face",
    "super deformed, doll, plushie, oversized head, stubby legs, short legs, tall female, mature female, muscular, muscular female, broad shoulders, wide shoulders, long torso, plump, chubby, fat, thick thighs, wide hips, curvy, pointy chin, sharp chin, long face, giantess, towering, miniature furniture, low doorframe"
  ],
  "纤柔嫩骨·精致锁骨双向防折痕少女（Slim-Tender · 无腹褶无肋骨）": [
    "1.2::short female::, 1.2::petite::, small frame, 1.18::slender::, slim waist, small breasts, narrow shoulders, slender legs, 1.25::collarbone::, round face, short face",
    "super deformed, doll, plushie, stubby legs, short legs, tall female, mature female, muscular, muscular female, abs, six pack, bony, skinny, visible ribs, gaunt, broad shoulders, wide shoulders, long torso, chubby, plump, fat, obese, belly fat, stomach folds, skin folds, muffin top, thick waist, wide hips, curvy, thick thighs, pointy chin, sharp chin, long face"
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
  "🐰 逆兔女郎装 · 经典黑爱心胸贴 + 腿环过膝袜（Reverse Bunnysuit · 胸贴版）": {
    "design_tags": "1.5::reverse bunnysuit::, bunny ears, fake animal ears, black bunny ears, detached collar, white collar, red bowtie, 1.4::black cropped jacket::, 1.35::bolero::, short sleeves, open jacket, 1.45::black pasties::, 1.4::heart pasties::, covered nipples, bare breasts, bare stomach, midriff, navel, wrist cuffs, white cuffs, bare hips, bare thighs, 1.35::zettai ryouiki::, black thighhighs, thigh strap, rabbit tail",
    "state_tags": "",
    "sleep_extra": "",
    "prose": "her black reverse bunnysuit cropped bolero jacket with black heart pasties, collar bowtie, wrist cuffs, and thigh-strapped black thighhighs",
    "intact_prose": "a black reverse bunnysuit with a cropped open bolero jacket, black heart pasties, white collar and red bowtie, bare midriff and hips, and thigh-strapped black thighhighs",
    "extra_neg": "playboy bunny, black leotard, leotard, pantyhose, full pantyhose, crotchless pantyhose, panties, bra, covered torso, covered stomach, nipples",
    "lock_stockings": "1",
    "allow_canon": "0",
    "kind": "preset",
    "bottom_type": "open_groin"
  },
  "🐰 逆兔女郎装 · 无胸贴直露乳首 + 腿环过膝袜（Reverse Bunnysuit · 全露版）": {
    "design_tags": "1.5::reverse bunnysuit::, bunny ears, fake animal ears, black bunny ears, detached collar, white collar, red bowtie, 1.4::black cropped jacket::, 1.35::bolero::, short sleeves, open jacket, bare breasts, 1.3::nipples::, bare stomach, midriff, navel, wrist cuffs, white cuffs, bare hips, bare thighs, 1.35::zettai ryouiki::, black thighhighs, thigh strap, rabbit tail",
    "state_tags": "",
    "sleep_extra": "",
    "prose": "her black reverse bunnysuit cropped bolero jacket with exposed breasts, collar bowtie, wrist cuffs, and thigh-strapped black thighhighs",
    "intact_prose": "a black reverse bunnysuit with a cropped open bolero jacket, exposed breasts, white collar and red bowtie, bare midriff and hips, and thigh-strapped black thighhighs",
    "extra_neg": "playboy bunny, black leotard, leotard, pantyhose, full pantyhose, crotchless pantyhose, panties, bra, covered torso, covered stomach, pasties",
    "lock_stockings": "1",
    "allow_canon": "0",
    "kind": "preset",
    "bottom_type": "open_groin"
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
  "🎽 宽松无袖白背心 + 深蓝运动三角裤（居家休闲套装 · 拨档互动）": {
    "design_tags": "loose white sleeveless tank top, bare shoulders, bare legs, navy athletic briefs",
    "state_tags": "clothes lift, panties aside",
    "sleep_extra": "disheveled clothes",
    "prose": "her loose white sleeveless tank top and shifted navy athletic briefs",
    "intact_prose": "a loose white sleeveless tank top and navy athletic briefs",
    "allow_canon": "0",
    "kind": "preset",
    "bottom_type": "panties"
  },
  "🎽 滑肩宽松白背心 + 深蓝运动短裤（露锁骨居家休闲 · 解扣拨档）": {
    "design_tags": "off-shoulder, loose white sleeveless tank top, bare shoulders, bare legs, navy athletic shorts",
    "state_tags": "clothes lift, unbuttoned, open shorts, panties aside",
    "sleep_extra": "disheveled clothes",
    "prose": "her off-shoulder white sleeveless tank top and open navy athletic shorts",
    "intact_prose": "an off-shoulder loose white sleeveless tank top and navy athletic shorts",
    "allow_canon": "0",
    "kind": "preset",
    "bottom_type": "shorts"
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
    "white thighhighs, 1.35::skindentation::, bare legs, white thigh strap",
    "white thighhighs, 1.35::skindentation::, bare legs, white thigh strap, clothed feet",
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
  "🌙 四画师低饱和暗调柔影彩线风（hitsukuya 0.65 + nanaken + sonao + nijihashi）": [
    "0.65::artist:hitsukuya::, 0.55::artist:nanaken nana::, 0.55::artist:sonao::, 0.45::artist:nijihashi sora::, 1.4::muted color::, 1.4::dim lighting::, 1.35::shade::, 0.85::dark::, partially shaded face, colored lineart, soft shading, no text",
    "neon colors, oversaturated, vibrant colors, thick outlines, bold lineart, black outlines, cel shading, flat color, harsh shadows, realistic, photorealistic, 3d, figure, faux figurine, monochrome, greyscale, comic, manga, speech bubble, text, watermark, signature, username, lowres"
  ],
  "💎 四画师丝光亮发瓷肌Gal抱枕CG风（sakura yuki 0.60 + senji + douya + ke-ta）": [
    "0.60::artist:sakura yuki (clochette)::, 0.58::artist:senji (tegone spike)::, 0.50::artist:douya (233)::, 0.48::artist:ke-ta::, dakimakura (medium), clean lineart, soft shading, shiny skin, glossy hair, eyelashes, no text",
    "two-sided fabric, rough sketch, visible brushstrokes, impasto, oil painting (medium), watercolor (medium), thick outlines, bold lineart, no lineart, lineless, flat color, harsh shadows, dark, realistic, photorealistic, 3d, figure, faux figurine, monochrome, greyscale, comic, manga, speech bubble, text, watermark, signature, username, blurry, lowres"
  ],
  "🎀 四画师稳态清透逆光萌系风（mikozin 0.68 + kani 0.44 + kasumi 0.42 + neit 0.22）": [
    "0.68::artist:mikozin::, 0.44::artist:kani bonara::, 0.42::artist:kasumi (skchkko)::, 0.22::artist:neit ni sei::, clean lineart, soft shading, shiny skin, no text",
    "realistic, 3d, painterly, oil painting, crosshatching, hatching (texture), thick outlines, bold lineart, comic, wide-eyed, crossed eyes, asymmetrical eyes, harsh shadows, neon colors, muddy colors, bad anatomy, bad hands, extra digits, fewer digits, missing fingers, fused fingers, extra limbs, watermark, signature, username, text"
  ],
  "🌷 安定萌化mikozin（mikozin 0.66 + kani 0.55 + hori 0.48 + gotyou 0.42）": [
    "0.66::artist:mikozin::, 0.55::artist:kani bonara::, 0.48::artist:hori (hori no su)::, 0.42::artist:gotyou::, gradient eyes, no text",
    "realistic, photorealistic, 3d, figure, faux figurine, painterly, oil painting (medium), impasto, visible brushstrokes, rough sketch, crosshatching, thick outlines, bold lineart, monochrome, greyscale, comic, manga, speech bubble, text, watermark, signature, username, blurry, lowres"
  ],
  "⚡🌷 安定萌化futa专用（mikozin 0.66 + kani 0.55 + hori 0.48 + gotyou 0.42 + pija 0.28）": [
    "0.66::artist:mikozin::, 0.55::artist:kani bonara::, 0.48::artist:hori (hori no su)::, 0.42::artist:gotyou::, 0.28::artist:pija (pianiishimo)::, gradient eyes, no text",
    "realistic, photorealistic, 3d, figure, faux figurine, painterly, oil painting (medium), impasto, visible brushstrokes, rough sketch, crosshatching, thick outlines, bold lineart, monochrome, greyscale, comic, manga, speech bubble, text, watermark, signature, username, blurry, lowres"
  ],
  "🌿 安定中度萌化淡画风（shouu-kun 0.56 + mikozin 0.40 + gotyou 0.38）": [
    "0.40::artist:mikozin::, 0.56::artist:shouu-kun::, 0.38::artist:gotyou::, clean lineart, soft shading, pastel colors, light colors, no text",
    "oversaturated, neon colors, high contrast, harsh shadows, thick outlines, bold lineart, cel shading, flat color, realistic, photorealistic, 3d, figure, faux figurine, painterly, oil painting (medium), impasto, visible brushstrokes, crosshatching, monochrome, greyscale, comic, manga, speech bubble, text, watermark, signature, username, blurry, lowres"
  ],
  "🍑 四画师清透奶桃纤柔赛璐璐风（shouu-kun 0.52 + mikozin 0.36 + gotyou 0.32 + izuoku 0.28）": [
    "0.36::artist:mikozin::, 0.52::artist:shouu-kun::, 0.32::artist:gotyou::, 0.28::artist:izuoku::, cel shading, anime coloring, lineart, 1.18::shiny skin::, no text",
    "realistic, photorealistic, 3d, figure, faux figurine, watercolor (medium), oil painting, painterly, impasto, visible brushstrokes, crosshatching, flat color, harsh shadow, posterization, red skin, sunburn, oversaturated, body oil, oily skin, monochrome, greyscale, comic, manga, speech bubble, text, watermark, signature, username, blurry, lowres"
  ],
  "🧬✨ M2 单画师极细净线赛璐璐风（mikozin 0.62 + 净黑细线 · 内置3槽Vibe调校）": [
    "0.62::artist:mikozin::, 1.25::clean lineart::, 1.18::fine lineart::, crisp lineart, smooth lineart, cel shading, anime coloring, shiny skin, no text",
    "jpeg artifacts, compression artifacts, scan artifacts, noise, grainy, blurry, dirty lines, messy lines, rough lines, stray lines, double lines, scratchy lines, hairy lines, sketch, sketchy, unfinished, bold lineart, thick outlines, marker (medium), hatching, crosshatching, screentones, blush stickers, glowing eyes, sparkling eyes, overly bright eyes, bags under eyes, dark circles, exhausted, monochrome, greyscale, painterly, watercolor (medium), oil painting, impasto, visible brushstrokes, realistic, 3d, figure, faux figurine, multiple views, comic, watermark, signature, username, text"
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

export type LightAxisMode = "auto" | "backlit" | "front_lit" | "side_lit" | "moody_dim";

export interface LightingPresetEntry {
  code: string;
  light_axis?: LightAxisMode;
  tags: string;
  prose: string;
  badge: string;
  strip_head_lighting?: boolean;
  strip_style_tags?: string[];
  replace_style_tags?: Record<string, string>;
  strip_bg_tags?: string[];
  inline_counterweight?: string;
  unblock_neg?: string[];
  extra_neg?: string;
}

export const LIGHTING_PRESETS: Record<string, LightingPresetEntry> = {
  "🔄 随画风与本幕默认光影（不额外覆盖）": {
    code: "auto",
    light_axis: "auto",
    tags: "",
    prose: "",
    badge: "",
  },
  "🌅✨ 强逆光过曝眩光 · 深邃暗面 HDR 光比（Contre-Jour HDR Backlight）": {
    code: "contre_jour_caustics",
    light_axis: "backlit",
    tags: "2.05::backlighting::, 1.72::sun glare::, 1.55::overexposure::, 1.38::bloom::, 1.28::lens flare::, sunbeam, light rays, 2.0::shade::, 1.5::dim lighting::, 1.3::dark::, 0.96::chiaroscuro::, 0.8::high contrast::, 1.22::partially shaded face::, 1.3::shiny skin::, depth of field, blurry background",
    prose:
      "High-contrast HDR contre-jour lighting with blinding sun glare behind her; her camera-facing face and body rest in deep dark shadow, accented by bright rim halation and crisp white specular highlights.",
    badge: "🌅✨强逆光HDR",
    strip_head_lighting: true,
    replace_style_tags: {
      "soft shading": "0.7::soft shading::",
    },
    strip_bg_tags: ["bright sky"],
    inline_counterweight:
      "-0.92::front lighting, flat lighting, low contrast, washed out::, -0.52::purple skin, blue skin, grey skin, dull colors, matte skin::",
    unblock_neg: [
      "3d",
      "photorealistic",
      "realistic",
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
  "☀️💧 正面清亮直打光 · 亮白瓷桃水光肌 + 纯白高光（Front-Lit Luminous Skin）": {
    code: "front_luminous_wet",
    light_axis: "front_lit",
    tags: "1.85::front lighting::, 1.48::sunlight::, 1.35::bright::, direct lighting, well-lit, 1.15::bloom::, 1.42::shiny skin::, 1.24::glossy highlights::",
    prose:
      "Bright direct front sunlight from behind the viewer fully illuminates her camera-facing face and body with creamy luminous warm-peach skin and broad pure-white specular highlights.",
    badge: "☀️💧正面水光直打",
    strip_head_lighting: true,
    inline_counterweight:
      "-0.95::backlighting, sun glare, lens flare, shade, dark, dim lighting, partially shaded face, silhouette, harsh shadows, underexposed::, -0.6::purple skin, blue skin, grey skin, tan, dark skin, dull colors, matte skin::",
    unblock_neg: [
      "3d",
      "photorealistic",
      "realistic",
      "bloom",
      "overexposed",
      "blown out",
      "shiny ass",
      "light spots",
      "wet clothes",
      "glossy highlights",
    ],
  },
  "☀️ 窗边过曝白昼侧逆光 · 暖金轮廓柔光（Window Sidelight & Golden Rim）": {
    code: "window_golden_rim",
    light_axis: "side_lit",
    tags: "1.35::backlighting::, 1.3::sidelighting::, 1.25::sunlight::, overexposure, depth of field, blurry background",
    prose:
      "Intense overexposed white daylight casts a crisp warm golden-white rim light along her slender waist and fingers while bathing her creamy porcelain skin and airy translucent hair in soft diffused light.",
    badge: "☀️窗边暖金侧逆光",
    strip_head_lighting: true,
    unblock_neg: ["overexposed", "blown out", "depth of field", "blurry", "soft focus", "out of focus", "hazy"],
  },
  "💎✨ 2.5D 冷暖撞色水润高反差光影（Coral-Peach Skin + Cool Violet Rim & Specular）": {
    code: "cool_warm_25d_cel",
    tags: "1.15::cel shading::, anime coloring, lineart, 1.2::high contrast::, 1.15::color contrast::, saturated, 1.25::backlighting::, 1.15::sunlight::, light rays, 1.15::subsurface scattering::, 1.18::shiny skin::, sparkle",
    prose:
      "Rich multi-layered 2.5D anime cel coloring with dual-lobe soft-candy skin speculars: wide feathered satin glow cushions on rounded hips, knees, and shoulders accented by tiny broken pinprick white specular dots and short dashed highlight specks along the center of the thighs rather than wide oily streaks; crisp diagonal blush lines on rosy cheeks, a tiny soft white nose-tip triangle highlight, cool periwinkle-to-violet gradient hair, and deep navy accents.",
    badge: "💎✨2.5D软糖双瓣高光",
    strip_head_lighting: true,
    strip_style_tags: [
      "pastel colors",
      "light colors",
      "soft shading",
      "smooth shading",
      "clean lineart",
      "no lineart",
      "lineless",
    ],
    unblock_neg: [
      "cel shading",
      "cel highlight",
      "anime coloring",
      "lineart",
      "outlines",
      "clean lines",
      "thick outlines",
      "bold lineart",
      "black outlines",
      "harsh shadow",
      "harsh shadows",
      "high contrast",
      "saturated",
      "oversaturated",
      "neon colors",
      "vibrant colors",
      "blush stickers",
      "shiny ass",
      "light spots",
      "wet clothes",
    ],
    extra_neg:
      "watercolor (medium), flat color, painterly, oil painting, crosshatching, low contrast, dull colors, grey skin, pallid, matte skin, dry skin, body oil, oily skin, plastic skin, flying sweatdrops, dripping, splash",
  },
  "🍑✨ 三阶奶桃柔影 · 锁骨烟粉次级暗部 + 白衣冰蓝冷影（Milky-Peach 3-Tier Cel）": {
    code: "milky_peach_3tier_cel",
    tags: "cel shading, anime coloring, lineart, 1.15::backlighting::, sunlight, light rays, 1.18::shiny skin::",
    prose:
      "Crisp anime cel hair and clean lineart paired with slim, delicate proportions and smooth three-tier milky-peach skin shading: gentle warm peach primary shadow across the neck and slim torso turns, deep cocoa chin cast occlusion, and subtle dusty-rose secondary hollows nestled neatly inside the collarbone depressions, shoulder-arm creases, and bent hip-and-knee joints, accented by soft satin glow cushions and tiny pinprick white specular dots along the shoulders and thighs, with cool ice-blue shadows on the white tank top.",
    badge: "🍑✨三阶奶桃柔影",
    strip_head_lighting: true,
    strip_style_tags: [
      "pastel colors",
      "light colors",
      "soft shading",
      "smooth shading",
      "clean lineart",
      "no lineart",
      "lineless",
      "high contrast",
      "saturated",
    ],
    unblock_neg: [
      "cel shading",
      "cel highlight",
      "anime coloring",
      "lineart",
      "outlines",
      "clean lines",
      "thick outlines",
      "bold lineart",
      "black outlines",
      "blush stickers",
      "shiny ass",
      "light spots",
      "wet clothes",
    ],
    extra_neg:
      "watercolor (medium), oil painting, impasto, crosshatching, flat color, harsh shadow, posterization, red skin, sunburn, oversaturated, body oil, oily skin",
  },
  "💎👁️ 极细净黑线 · 丝绒渐变瞳双眼皮睫毛 + 三阶奶桃锁骨柔影（M2 Razor-Fine Cel）": {
    code: "m2_razor_fine_cel",
    tags: "1.25::clean lineart::, 1.18::fine lineart::, crisp lineart, smooth lineart, cel shading, anime coloring, shiny skin, 1.16::gradient eyes::, thick eyelashes, eyelid crease, small white eye highlights",
    prose:
      "Ultra-clean, razor-fine commercial anime lineart with glass-smooth black ink contours and zero stray lines, paired with soft velvety gradient eyes, delicate double-eyelid creases, thick curved upper eyelashes, three-tier milky-peach collarbone shading, and crisp pinprick highlights.",
    badge: "💎👁️M2极细净线",
    strip_head_lighting: false,
    strip_style_tags: [
      "no lineart",
      "lineless",
      "painterly",
      "watercolor (medium)",
      "colored sketch",
    ],
    unblock_neg: [
      "cel shading",
      "anime coloring",
      "lineart",
      "clean lines",
    ],
    extra_neg:
      "dirty lines, messy lines, rough lines, stray lines, double lines, scratchy lines, hairy lines, bold lineart, thick outlines, marker (medium), hatching, crosshatching, screentones, blush stickers, glowing eyes, sparkling eyes, overly bright eyes, bags under eyes, dark circles",
  },
};

export const STYLE_RECOMMENDED_LIGHTING: Record<string, string> = {
  "🧬✨ M2 单画师极细净线赛璐璐风（mikozin 0.62 + 净黑细线 · 内置3槽Vibe调校）":
    "💎👁️ 极细净黑线 · 丝绒渐变瞳双眼皮睫毛 + 三阶奶桃锁骨柔影（M2 Razor-Fine Cel）",
  "🍑 四画师清透奶桃纤柔赛璐璐风（shouu-kun 0.52 + mikozin 0.36 + gotyou 0.32 + izuoku 0.28）":
    "🍑✨ 三阶奶桃柔影 · 锁骨烟粉次级暗部 + 白衣冰蓝冷影（Milky-Peach 3-Tier Cel）",
  "🎀 四画师稳态清透逆光萌系风（mikozin 0.68 + kani 0.44 + kasumi 0.42 + neit 0.22）":
    "☀️ 窗边过曝白昼侧逆光 · 暖金轮廓柔光（Window Sidelight & Golden Rim）",
};

export const STYLE_BUNDLED_VIBE_PACK: Record<string, string> = {
  "🧬✨ M2 单画师极细净线赛璐璐风（mikozin 0.62 + 净黑细线 · 内置3槽Vibe调校）":
    "m2_mikozin062_triple",
};

export const LEGACY_LIGHTING_PRESET_MAP: Record<string, string> = {
  "🌅🌊 强逆光过曝眩光 · 自然暗面 + 水波焦散反射（Contre-Jour + Water Caustics）":
    "🌅✨ 强逆光过曝眩光 · 深邃暗面 HDR 光比（Contre-Jour HDR Backlight）",
  "☀️💧 正面清亮直打光 · 亮白瓷桃水光肌 + 纯白高光焦散（Front-Lit Luminous Wet Skin）":
    "☀️💧 正面清亮直打光 · 亮白瓷桃水光肌 + 纯白高光（Front-Lit Luminous Skin）",
};

export function normalizeLightingPresetName(rawName: string | undefined): string {
  if (!rawName) return "🔄 随画风与本幕默认光影（不额外覆盖）";
  return LEGACY_LIGHTING_PRESET_MAP[rawName] ?? rawName;
}

export function resolveLightingPresetEntry(rawName: string | undefined): LightingPresetEntry {
  const norm = normalizeLightingPresetName(rawName);
  return (
    LIGHTING_PRESETS[norm] ??
    LIGHTING_PRESETS["🔄 随画风与本幕默认光影（不额外覆盖）"]
  );
}

export function resolveLightingForStyle(stylePreset: string): string {
  return (
    STYLE_RECOMMENDED_LIGHTING[stylePreset] ??
    "🔄 随画风与本幕默认光影（不额外覆盖）"
  );
}

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
    tags: "outdoors, 1.35::shallow water::, in water, ripples, 1.32::water reflection::, 1.32::caustics::, cherry blossoms, falling petals, pink sky, bright sky, shiny skin, 1.25::wet skin::, water droplets",
    prose:
      " in shallow rippling cyan water beneath falling cherry blossom petals and a bright pink sky, with luminous water-ripple caustics and shimmering reflections dancing across her wet skin",
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
  "🪴 落地窗日光绿植 · 绒毛米色地毯木地板（furry beige rug, floor-to-ceiling window, potted plant）": {
    code: "sunlit_rug_floor_window",
    tags: "indoors, 1.25::furry beige rug::, rug, wooden floor, large floor-to-ceiling window, daylight, backlighting, sunlight, potted plant",
    prose: " on a soft furry beige rug over a wooden floor beside a sunlit floor-to-ceiling window and potted plant",
    badge: "🪴落地窗绒毯",
    extra_neg: "outdoors, bed, couch, sofa, bedsheet",
  },
};

export const FREE_ACTION_STARTERS: Array<{
  label: string;
  tags: string;
  prose: string;
  nsfw?: boolean;
}> = [
  {
    label: "🪑 坐姿翘腿微笑",
    tags: "cowboy shot, sitting, crossed legs, head tilt, gentle smile, looking at viewer",
    prose: "sitting gracefully with her legs crossed, tilting her head with a gentle smile toward the viewer.",
  },
  {
    label: "🧍 站立背手全身",
    tags: "full body, standing, arms behind back, slight lean forward, playful smile, looking at viewer",
    prose: "standing in full view with her arms behind her back, leaning slightly forward with a playful smile.",
  },
  {
    label: "🛋️ 俯卧托腮翘脚",
    tags: "full body, from side, lying, on stomach, propped on elbows, hand on own cheek, legs up, bent knees, soles, looking at viewer",
    prose: "lying on her stomach propped on her elbows with one hand resting on her cheek and her lower legs kicked playfully upward.",
  },
  {
    label: "📸 举手机镜面自拍",
    tags: "upper body, selfie, mirror selfie, holding phone, smartphone, peace sign, wink, looking at viewer",
    prose: "taking a playful mirror selfie with her smartphone while flashing a peace sign and winking.",
  },
  {
    label: "🎀 跪坐撩裙羞涩 (R18)",
    tags: "cowboy shot, kneeling, wariza, lifting own skirt, clothes lift, shy, blush, averted gaze, looking at viewer",
    prose: "kneeling shyly while lifting the hem of her outfit with flushed cheeks.",
    nsfw: true,
  },
  {
    label: "🌸 仰卧M字开腿展示 (R18)",
    tags: "full body, from above, lying, on back, m legs, spread legs, knees up, grabbing own breasts, heavy blush, parted lips, looking at viewer",
    prose: "lying on her back in an open M-leg posture gazing up with flushed cheeks.",
    nsfw: true,
  },
];

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
    "labia, spread labia, gaping, barbie doll anatomy"
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
  "🐱 俏皮猫嘴·得意萌笑（:3, grin, mischievous, blush）": {
    "code": "cat_mouth_cute",
    "tags": ":3, closed mouth, slight smile, smug, naughty face, blush",
    "prose": "with a playful, mischievous cat-like :3 smile and a soft blush",
    "short": "🐱 W猫嘴萌笑"
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
  "😒 嘟嘴微嗔 (1.3::pout::)": "pout",
  "🐱 W猫嘴俏皮笑 (:3)": "cat_mouth_w"
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
  "pout": "1.3::pout::",
  "cat_mouth_w": ":3, closed mouth"
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
  ":3",
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
  },
  {
    "id": "MA9",
    "title": "09 俯卧枕臂翘脚 · 落地窗绒毛地毯侧景 (1216x832)",
    "actor_type": "MultiAngle"
  },
  {
    "id": "MA10",
    "title": "10 俯卧肘撑捧腮 · 露锁骨翘脚3/4斜景 (1216x832)",
    "actor_type": "MultiAngle"
  },
  {
    "id": "MA11",
    "title": "11 超近距广角 · V字高抬腿胯下仰视比耶自展",
    "actor_type": "MultiAngle"
  }
];

export const MULTI_ANGLE_TEMPLATES: Record<string, { title: string; canvas: string; allow_multi_views: boolean; scene: string; prose: string; force_nsfw?: boolean; unlock_belly?: boolean; builtin_xray?: boolean; extra_neg?: string; default_expr_tags?: string; pov_visibility?: "front_face_visible" | "rear_no_face" | "top_down_over_shoulder"; prose_pov?: string }> = {
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
    "MA7A": {
    "title": "MA7 · 派生① 饱满圆腹溢流版 (无透视)",
    "canvas": "竖图 832x1216",
    "allow_multi_views": false,
    "scene": "1.55::pregnant::, 1.45::stomach bulge::, 1.35::cum inflation::, round pregnant belly, protruding navel, 1.0::spread pussy::, 1.15::spreading own pussy::, fingers, after vaginal, 1.4::cum::, 1.45::cum in pussy::, 1.4::cumdrip::, cowboy shot, legs apart, head tilt, peace sign near cheek, hand on belly, looking at viewer, blurred warm indoor background",
    "prose": "cowboy shot with legs apart, tilting her head with a peace sign near her cheek while resting her other hand below her taut, round heavily pregnant belly with a protruding navel and spreading her overflowing cum-dripping pussy with her fingers.",
    "force_nsfw": true,
    "unlock_belly": true,
    "builtin_xray": false,
    "extra_neg": "covering crotch, covering pussy, covering breasts, censor, mosaic censoring, bar censor, gaping, x-ray, cross-section, uterus, cervix, internal cumshot, cutaway, fetus, baby, embryo, umbilical cord, 1boy, male, penis, phallus, testicles",
    "default_expr_tags": "1.35::mesugaki::, 1.3::smug::, smirk, evil smile, grin, naughty face, 1.2::half-closed eyes::, jitome, blush"
  },
  "MA7B": {
    "title": "MA7 · 派生② 饱满圆腹+内部透视版",
    "canvas": "竖图 832x1216",
    "allow_multi_views": false,
    "scene": "1.55::pregnant::, 1.45::stomach bulge::, 1.4::cum inflation::, round pregnant belly, protruding navel, 1.45::x-ray::, 1.4::cross-section::, 1.45::uterus::, cervix, 1.55::cum in uterus::, 1.0::spread pussy::, 1.15::spreading own pussy::, fingers, after vaginal, 1.4::cum::, 1.45::cum in pussy::, 1.4::cumdrip::, cowboy shot, legs apart, head tilt, peace sign near cheek, hand on belly, looking at viewer, blurred warm indoor background",
    "prose": "cowboy shot with legs apart, tilting her head with a peace sign near her cheek while resting her hand below her taut, round heavily pregnant belly with a protruding navel and spreading her overflowing cum-dripping pussy with her fingers, accompanied by an anatomical cross-section x-ray cutaway window showing her distended womb filled to capacity.",
    "force_nsfw": true,
    "unlock_belly": true,
    "builtin_xray": true,
    "extra_neg": "covering crotch, covering pussy, covering breasts, censor, mosaic censoring, bar censor, gaping, fetus, baby, embryo, umbilical cord, 1boy, male, penis, phallus, testicles, skeleton, bones, skull, ribcage, gore",
    "default_expr_tags": "1.35::mesugaki::, 1.3::smug::, smirk, evil smile, grin, naughty face, 1.2::half-closed eyes::, jitome, blush"
  },
  "MA7C": {
    "title": "MA7 · 派生③ 纤细平腹+内部透视满盈版",
    "canvas": "竖图 832x1216",
    "allow_multi_views": false,
    "scene": "cowboy shot, 1.35::upper body::, legs apart, head tilt, peace sign near cheek, 1.0::spread pussy::, 1.15::spreading own pussy::, fingers, after vaginal, 1.4::cum::, 1.45::cum in pussy::, 1.35::cumdrip::, 1.45::x-ray::, 1.4::cross-section::, 1.45::uterus::, cervix, 1.55::cum in uterus::, cum inflation, looking at viewer, blurred warm indoor background",
    "prose": "cowboy shot with legs apart, tilting her head with a peace sign near her cheek while spreading her overflowing cum-dripping pussy with her fingers, accompanied by an anatomical cross-section x-ray cutaway showing her womb filled to capacity.",
    "force_nsfw": true,
    "unlock_belly": false,
    "builtin_xray": true,
    "extra_neg": "covering crotch, covering pussy, covering breasts, censor, mosaic censoring, bar censor, gaping, pregnant, stomach bulge, fetus, baby, embryo, umbilical cord, 1boy, male, penis, phallus, testicles, skeleton, bones, skull, ribcage, gore",
    "default_expr_tags": "1.35::mesugaki::, 1.3::smug::, smirk, evil smile, grin, naughty face, 1.2::half-closed eyes::, jitome, blush"
  },
  "MA7D": {
    "title": "MA7 · 派生④ 纤细平腹溢流版 (无透视)",
    "canvas": "竖图 832x1216",
    "allow_multi_views": false,
    "scene": "cowboy shot, 1.35::upper body::, legs apart, head tilt, peace sign near cheek, 1.0::spread pussy::, 1.15::spreading own pussy::, fingers, after vaginal, 1.4::cum::, 1.45::cum in pussy::, 1.35::cumdrip::, looking at viewer, blurred warm indoor background",
    "prose": "cowboy shot with legs apart, tilting her head with a peace sign near her cheek while spreading her overflowing cum-dripping pussy with her fingers.",
    "force_nsfw": true,
    "unlock_belly": false,
    "builtin_xray": false,
    "extra_neg": "covering crotch, covering pussy, covering breasts, censor, mosaic censoring, bar censor, gaping, pregnant, stomach bulge, x-ray, cross-section, uterus, cervix, internal cumshot, cutaway, fetus, baby, embryo, umbilical cord, 1boy, male, penis, phallus, testicles",
    "default_expr_tags": "1.35::mesugaki::, 1.3::smug::, smirk, evil smile, grin, naughty face, 1.2::half-closed eyes::, jitome, blush"
  },
  "MA7E": {
    "title": "MA7 · 派生⑤ 扶他双手微拨版 (居中直立前端+指尖轻拨双蛋阴唇)",
    "canvas": "竖图 832x1216",
    "allow_multi_views": false,
    "scene": "cowboy shot, 1.25::asymmetrical pose::, wide spread legs, head tilt, 1.3::smug::, playful cheerful expression, one eye slightly narrowed, looking at viewer, 1.35::small penis::, 1.3::erection::, 1.35::small testicles::, 1.35::testicles::, 1.35::precum::, dripping, 1.35::holding own testicles::, 1.4::pussy::, 1.35::spread pussy::, 1.35::labia::, after vaginal, 1.4::cum::, 1.45::cum in pussy::, 1.4::cumdrip::, pussy juice, fingers, blurred warm indoor background",
    "prose": "Her small erect futanari penis stands untouched and centered pointing upward dripping clear precum; below it, her right hand's fingertips gently tug only her small round testicles slightly to the viewer's left, while her left hand's fingers pull open the right half of her glistening pink labia so thick white cum overflows and drips straight down from inside.",
    "force_nsfw": true,
    "unlock_belly": false,
    "builtin_xray": false,
    "extra_neg": "peace sign, v, holding own penis, grabbing penis, hand on hip, hand on thigh, arm at side, arms at sides, extra penis, duplicate penis, two penises, extra hands, extra fingers, 3 hands, huge penis, large penis, oversized penis, thick penis, hyper penis, monster penis, giant penis, huge testicles, large testicles, 1boy, male, otoko no ko, crossdressing, yaoi, flat chest, male chest, pectorals, covering crotch, covering pussy, censor, mosaic censoring, bar censor, x-ray, cross-section, uterus, pregnant, stomach bulge",
    "default_expr_tags": "1.3::smug::, playful cheerful expression, one eye slightly narrowed, blush"
  },
  "MA8": {
    "title": "MA8 · 盘腿托腮柔毯前倾 (Cross-Legged Chin Rest)",
    "canvas": "竖图 832x1216",
    "allow_multi_views": false,
    "scene": "slight three-quarter angle, sitting cross-legged on soft rug, leaning forward, chin resting on both hands, elbows on knees, curious bright gaze, looking at viewer, cozy sunlit living room",
    "prose": "sitting cross-legged on a soft rug, leaning forward with her chin resting on both hands and gazing curiously at the viewer."
  },
  "MA9": {
    "title": "MA9 · 落地窗绒毯俯卧枕臂翘脚 (Prone On Furry Rug)",
    "canvas": "横图 1216x832",
    "allow_multi_views": false,
    "scene": "full body, 1.3::from side::, slightly from above, 1.35::on stomach::, lying on rug, arms crossed on floor, head resting on arms, bent knees, 1.3::feet up::, indoors, furry beige rug, wooden floor, large floor-to-ceiling window, clear blue sky, daylight, backlighting, sunlight, potted plant, looking at viewer, gentle smile, half-closed eyes, tareme, blush, nose blush",
    "prose": "lying on her stomach in side view on a furry beige rug over a wooden floor beside a large sunlit floor-to-ceiling window and potted plant, resting her head on her crossed arms with both knees bent and feet playfully raised while looking toward the viewer."
  },
  "MA10": {
    "title": "MA10 · 落地窗绒毯俯卧肘撑捧腮露锁骨 (Propped Elbows Chin Rest)",
    "canvas": "横图 1216x832",
    "allow_multi_views": false,
    "scene": "full body, 1.3::three-quarter view::, slightly from above, 1.35::on stomach::, lying on rug, 1.35::propped on elbows::, 1.3::hands under chin::, bent knees, 1.3::feet up::, 1.3::collarbone::, armpit crease, indoors, furry beige rug, wooden floor, large floor-to-ceiling window, clear blue sky, daylight, backlighting, sunlight, potted plant, looking at viewer, gentle smile, half-closed eyes, tareme, blush, nose blush",
    "prose": "lying on her stomach in three-quarter view on a furry beige rug over a wooden floor beside a large sunlit floor-to-ceiling window and potted plant, propped up on her elbows with both hands cupped under her chin, knees bent and feet playfully raised while smiling gently at the viewer."
  },
  "MA11": {
    "title": "MA11 · V字高抬腿超近距广角胯下仰视比耶自展 (Ultra Close-Up V-Legs Peace Sign)",
    "canvas": "竖图 832x1216",
    "allow_multi_views": false,
    "scene": "1.65::close-up::, 1.7::from below::, 1.65::worm's-eye view::, 1.65::extreme foreshortening::, 1.5::wide-angle lens::, 1.4::fisheye::, 1.55::pov::, 1.3::dutch angle::, 1.6::ass focus::, 1.6::groin focus::, 1.45::anus::, 1.65::pussy focus::, pussy, pussy juice, groin and buttocks filling lower two-thirds of frame, head small at top, lying on back, 1.55::legs up::, 1.5::spread legs::, 1.5::v-shaped legs::, 1.45::looking down at viewer::, 1.4::one eye closed::, wink, 1.35::grin::, smug, heavy blush, sweat, 1.45::v::, 1.4::peace sign::, hand next to cheek",
    "prose": "Extreme wide-angle worm's-eye close-up from directly beneath her raised V-shaped legs: glossy buttocks and groin fill the lower two-thirds of the frame while her torso recedes upward to her small winking, grinning face making a playful peace sign next to her cheek at the top.",
    "force_nsfw": true,
    "extra_neg": "full body, wide shot, distant, upside-down, inverted, head at bottom, legs at top, panties, underwear, covering crotch, covering pussy, censor, mosaic censoring, bar censor, 1boy, male, penis, phallus, testicles"
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
    tags: "outdoors, 1.35::shallow water::, in water, ripples, 1.32::water reflection::, 1.32::caustics::, cherry blossoms, falling petals, pink sky, bright sky, shiny skin, 1.25::wet skin::, water droplets",
    prose:
      " in shallow rippling cyan water beneath falling cherry blossom petals and a bright pink sky, with luminous water-ripple caustics and shimmering reflections dancing across her wet skin",
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
  "🪴 落地窗日光绿植 · 绒毛米色地毯木地板（furry beige rug, floor-to-ceiling window, potted plant）": {
    code: "sunlit_rug_floor_window",
    tags: "indoors, 1.25::furry beige rug::, rug, wooden floor, large floor-to-ceiling window, daylight, backlighting, sunlight, potted plant",
    prose: " on a soft furry beige rug over a wooden floor beside a sunlit floor-to-ceiling window and potted plant",
    badge: " · [🪴落地窗绒毯]",
    strip_indoor_pose: true,
    extra_neg: "outdoors, bed, couch, sofa, bedsheet",
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
  "9. 手部爱抚·指技前戏系",
  "10. 触手缠缚·苗床产卵系",
  "11. 异形虫巢·节肢异虫系"
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
    "title": "P44 · 跪趴塌腰展示位 · 客观回眸/POV纯背特写 (Solo Rear-Arch Showcase)",
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
  },
  {
    "id": "TN01",
    "title": "TN01 · 悬空M字吊缚缠绕·前戏玩弄 (Suspended M-Spread Coiled Tease)",
    "category": "10. 触手缠缚·苗床产卵系",
    "actor_type": "AllPos"
  },
  {
    "id": "TN02",
    "title": "TN02 · 悬空M字深部贯通+子宫透视 (Suspended Deep Cervical + Womb X-Ray)",
    "category": "10. 触手缠缚·苗床产卵系",
    "actor_type": "AllPos"
  },
  {
    "id": "TN03",
    "title": "TN03 · 侧视跪趴前后双端串烧同步 (Side All-Fours Dual-End Spitroast)",
    "category": "10. 触手缠缚·苗床产卵系",
    "actor_type": "AllPos"
  },
  {
    "id": "TN04",
    "title": "TN04 · 触手巢穴鼓腹产卵+荧光卵囊透视 (Tentacle Pit Oviposition + Egg X-Ray)",
    "category": "10. 触手缠缚·苗床产卵系",
    "actor_type": "AllPos"
  },
  {
    "id": "TN05",
    "title": "TN05 · 触手螺旋榨精 / 吸盘敏感带套弄 (Coiled Tentacle Milking & Suction)",
    "category": "10. 触手缠缚·苗床产卵系",
    "actor_type": "AllPos"
  },
  {
    "id": "TN06",
    "title": "TN06 · 暗窟贴壁十字磔缚·触手钻衣破衣 (Wall-Pinned Spread-Eagle & Clothes Tear)",
    "category": "10. 触手缠缚·苗床产卵系",
    "actor_type": "AllPos"
  },
  {
    "id": "TN07",
    "title": "TN07 · 触手肉床抱膝折腿压制贯通 (Tentacle Nest Elevated Mating Press)",
    "category": "10. 触手缠缚·苗床产卵系",
    "actor_type": "AllPos"
  },
  {
    "id": "TN08",
    "title": "TN08 · 近景触手深喉咽喉鼓包·黏液面缚 (Close-Up Tentacle Deepthroat & Throat Bulge)",
    "category": "10. 触手缠缚·苗床产卵系",
    "actor_type": "AllPos"
  },
  {
    "id": "TN09",
    "title": "TN09 · 半透明荧光黏液茧囊·卵鞘悬浮培养 (Translucent Slime Cocoon Incubation)",
    "category": "10. 触手缠缚·苗床产卵系",
    "actor_type": "AllPos"
  },
  {
    "id": "TN10",
    "title": "TN10 · 横图全端满载·悬空贯通鼓腹透视 (Landscape All-Holes Overload + Belly X-Ray)",
    "category": "10. 触手缠缚·苗床产卵系",
    "actor_type": "AllPos"
  },
  {
    "id": "TN11",
    "title": "TN11 · 生物活体触手寄生服同化 (Living Tentacle Parasite Suit / Symbiote)",
    "category": "10. 触手缠缚·苗床产卵系",
    "actor_type": "AllPos"
  },
  {
    "id": "TN12",
    "title": "TN12 · 异形半透明发光多卵鼓腹 (Translucent Glowing Egg-Belly Host)",
    "category": "10. 触手缠缚·苗床产卵系",
    "actor_type": "AllPos"
  },
  {
    "id": "BG01",
    "title": "BG01 · 发光蛛丝网缚·悬空黏丝束缚 (Glowing Spiderweb Bondage)",
    "category": "11. 异形虫巢·节肢异虫系",
    "actor_type": "AllPos"
  },
  {
    "id": "BG02",
    "title": "BG02 · 半透明荧光巨型软虫贯通与套弄 (Giant Translucent Bioluminescent Worm)",
    "category": "11. 异形虫巢·节肢异虫系",
    "actor_type": "AllPos"
  },
  {
    "id": "BG03",
    "title": "BG03 · 黄金蜂巢蜜汁产卵床·琥珀卵剖面 (Golden Honeycomb Hive & Amber Oviposition)",
    "category": "11. 异形虫巢·节肢异虫系",
    "actor_type": "AllPos"
  },
  {
    "id": "BG04",
    "title": "BG04 · 荧光果冻幼体体表爬行 (Bioluminescent Jelly-Slugs Crawling Tease)",
    "category": "11. 异形虫巢·节肢异虫系",
    "actor_type": "AllPos"
  },
  {
    "id": "BG05",
    "title": "BG05 · 横图光泽甲壳巨虫后入压制 (Iridescent Chitinous Insectoid Rear Press)",
    "category": "11. 异形虫巢·节肢异虫系",
    "actor_type": "AllPos"
  },
  {
    "id": "BG06",
    "title": "BG06 · 虫后母巢琥珀蛛丝透明金卵腹 (Queen's Amber-Silk Brood Cocoon & Egg Belly)",
    "category": "11. 异形虫巢·节肢异虫系",
    "actor_type": "AllPos"
  },
  {
    "id": "BG07",
    "title": "BG07 · 下身荧光果冻幼虫大量溢出 (Full-Belly Hatching & Larvae Overflow)",
    "category": "11. 异形虫巢·节肢异虫系",
    "actor_type": "AllPos"
  },
  {
    "id": "BG08",
    "title": "BG08 · 近景口部荧光幼虫与蜜涎满溢 (Close-Up Oral Larvae & Honey-Slime Overflow)",
    "category": "11. 异形虫巢·节肢异虫系",
    "actor_type": "AllPos"
  },
  {
    "id": "BG09",
    "title": "BG09 · 荧光吸盘软虫吮乳与套筒榨取 (Glowing Leech-Slug Suction & Milking)",
    "category": "11. 异形虫巢·节肢异虫系",
    "actor_type": "AllPos"
  },
  {
    "id": "BG10",
    "title": "BG10 · 奇幻食人花虫巢·催情金粉与花蕊软虫 (Carnivorous Flower-Pod & Pollen Vine-Worms)",
    "category": "11. 异形虫巢·节肢异虫系",
    "actor_type": "AllPos"
  },
  {
    "id": "BG11",
    "title": "BG11 · 活体虹彩甲壳外骨骼虫娘同化 (Living Iridescent Chitin Exoskeleton Symbiote)",
    "category": "11. 异形虫巢·节肢异虫系",
    "actor_type": "AllPos"
  },
  {
    "id": "BG12",
    "title": "BG12 · 横图虫巢剖面幼虫满载与双端溢出 (Landscape Brood-Pit Overload + Larvae X-Ray)",
    "category": "11. 异形虫巢·节肢异虫系",
    "actor_type": "AllPos"
  },
  {
    "id": "BG13",
    "title": "BG13 · 卧室床铺巨型蜚蠊/甲虫爬身仰卧前入 (Giant Cockroach/Beetle Bed Missionary)",
    "category": "11. 异形虫巢·节肢异虫系",
    "actor_type": "AllPos"
  },
  {
    "id": "BG14",
    "title": "BG14 · 室内地毯巨型蜘蛛趴背八足锁身跪趴后入 (Giant Spider Back-Clinging Rear Entry)",
    "category": "11. 异形虫巢·节肢异虫系",
    "actor_type": "AllPos"
  },
  {
    "id": "BG15",
    "title": "BG15 · 抱脸虫覆面锁颈深喉鼓包+下身虫吸榨精 (Facehugger Oral Deepthroat + Groin Bug)",
    "category": "11. 异形虫巢·节肢异虫系",
    "actor_type": "AllPos"
  },
  {
    "id": "BG16",
    "title": "BG16 · 振翅巨型蚊蝇抱身前入贯通+口针吸乳 (Winged Giant Mosquito/Fly Standing Front Cling)",
    "category": "11. 异形虫巢·节肢异虫系",
    "actor_type": "AllPos"
  },
  {
    "id": "BG17",
    "title": "BG17 · 巨型具足虫活体贞操带扣胯产卵鼓腹 (Giant Isopod Crotch-Hugger Living Belt)",
    "category": "11. 异形虫巢·节肢异虫系",
    "actor_type": "AllPos"
  },
  {
    "id": "BG18",
    "title": "BG18 · 卧室床铺红黑巨型多足蜈蚣盘身缠绕贯通 (Indoor Giant Centipede Spiral Coiling)",
    "category": "11. 异形虫巢·节肢异虫系",
    "actor_type": "AllPos"
  },
  {
    "id": "BG19",
    "title": "BG19 · 虫奸事后鼓腹·成群白嫩肥蛆涌出爬腿 (Post-Oviposition Plump White Maggots Overflow)",
    "category": "11. 异形虫巢·节肢异虫系",
    "actor_type": "AllPos"
  },
  {
    "id": "BG20",
    "title": "BG20 · 横图大虫交尾+剖面虫卵白蛆同框涌出 (Landscape Multi-Bug Mounting + Womb X-Ray)",
    "category": "11. 异形虫巢·节肢异虫系",
    "actor_type": "AllPos"
  }
];

export const ALL_POSITIONS_TEMPLATES: Record<string, { id: string; title: string; category: string; channel: string; canvas: string; canvas_pov?: string; pose_pov: string; pose_3rd: string; prose_core: string; pov_visibility?: "front_face_visible" | "rear_no_face" | "top_down_over_shoulder" | "ventral_no_eyes"; prose_pov?: string; extra_pov_neg?: string; extra_3rd_neg?: string; lock_scene_env?: boolean; env_tags?: string; env_prose?: string; env_badge?: string; env_neg?: string; unlock_belly?: boolean; builtin_xray?: boolean; raw_action_tags?: string; extra_scene_neg?: string; default_expr_tags?: string }> = {
  "P01": {
    "id": "P01",
    "title": "P01 · 标准仰卧传教士位 (Classic Supine)",
    "category": "1. 仰卧·传教士系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "1.25::from above::, lying on back, spread legs, arms above head, looking at viewer",
    "pose_3rd": "three-quarter view, high angle, lying on back, spread legs, knees bent, looking at viewer",
    "prose_core": "lying on her back with her legs parted and gazing up",
    "pov_visibility": "front_face_visible"
  },
  "P02": {
    "id": "P02",
    "title": "P02 · 双腿高举V字仰卧位 (Legs-Up Supine)",
    "category": "1. 仰卧·传教士系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "from above, lying on back, 1.35::legs up::, v-shaped legs, bare legs raised high, looking at viewer",
    "pose_3rd": "side three-quarter view, lying on back, 1.35::legs up::, ankles raised high in a V-shape",
    "prose_core": "lying on her back with both legs raised high in a V-shape",
    "pov_visibility": "front_face_visible"
  },
  "P03": {
    "id": "P03",
    "title": "P03 · 屈膝压胸深折位 (Folded Press)",
    "category": "1. 仰卧·传教士系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "1.3::from above::, lying on back, 1.4::folded::, knees to chest, ankles near shoulders, tilted hips, looking at viewer",
    "pose_3rd": "side view, lying on back, 1.4::folded::, knees pressed toward chest, raised pelvis",
    "prose_core": "lying folded on her back with her knees pressed close to her chest and hips tilted upward",
    "pov_visibility": "front_face_visible"
  },
  "P04": {
    "id": "P04",
    "title": "P04 · 双腿盘腰紧扣位 (Leg-Lock Embrace)",
    "category": "1. 仰卧·传教士系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "close-up, from above, lying on back, 1.35::leg lock::, ankles crossed, arms outstretched, looking at viewer",
    "pose_3rd": "three-quarter high angle, lying on back, 1.35::leg lock::, legs wrapped around waist, embrace",
    "prose_core": "lying on her back with her legs locked inward in a close embrace",
    "pov_visibility": "front_face_visible"
  },
  "P05": {
    "id": "P05",
    "title": "P05 · 单腿高抬侧展仰卧位 (Single-Leg-Up)",
    "category": "1. 仰卧·传教士系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "from above, lying on back, 1.35::one leg up::, asymmetrical legs, spread thigh, looking at viewer",
    "pose_3rd": "three-quarter view, lying on back, 1.35::one leg up::, one knee bent flat, asymmetric leg posture",
    "prose_core": "lying on her back with one leg lifted high and the other extended",
    "pov_visibility": "front_face_visible"
  },
  "P06": {
    "id": "P06",
    "title": "P06 · 边缘垂臀仰卧蝴蝶位 (Edge Reclining)",
    "category": "1. 仰卧·传教士系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "eye-level, lying on back, hips at edge, knees bent wide apart, arched waist, looking at viewer",
    "pose_3rd": "three-quarter low angle, reclining on back at edge, knees open wide, arched lower back",
    "prose_core": "reclining on her back at the edge with her hips forward and knees parted",
    "pov_visibility": "front_face_visible"
  },
  "P07": {
    "id": "P07",
    "title": "P07 · 抬臀反弓仰卧位 (Elevated Pelvis)",
    "category": "1. 仰卧·传教士系",
    "channel": "vaginal",
    "canvas": "横图 1216x832",
    "pose_pov": "high angle, lying on back, elevated hips, 1.3::arched back::, spread knees, hands gripping sheet",
    "pose_3rd": "side three-quarter view, lying on back, elevated pelvis, 1.3::arched back::, bent knees apart",
    "prose_core": "lying on her back with her pelvis elevated and lower back arched",
    "pov_visibility": "front_face_visible"
  },
  "P08": {
    "id": "P08",
    "title": "P08 · 标准跪姿女上位 (Kneeling Cowgirl)",
    "category": "2. 女上位·骑乘坐姿系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "low angle, from below, 1.35::girl on top::, straddling, kneeling, upright torso, looking down at viewer",
    "pose_3rd": "three-quarter low angle, 1.35::girl on top::, straddling, kneeling upright, hands on thighs",
    "prose_core": "kneeling upright in a straddling top posture while looking down",
    "pov_visibility": "front_face_visible"
  },
  "P09": {
    "id": "P09",
    "title": "P09 · 蹲踞开脚骑乘位 (Squatting Cowgirl)",
    "category": "2. 女上位·骑乘坐姿系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "low angle, from below, 1.4::squatting::, girl on top, straddling, wide knees, soles flat, looking down at viewer",
    "pose_3rd": "frontal three-quarter view, 1.4::squatting::, girl on top, straddling with wide-set knees",
    "prose_core": "squatting in a wide-knee straddling posture on top",
    "pov_visibility": "front_face_visible"
  },
  "P10": {
    "id": "P10",
    "title": "P10 · 前倾伏胸贴面女上位 (Leaning-Forward Top)",
    "category": "2. 女上位·骑乘坐姿系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "close-up, low angle, girl on top, straddling, 1.35::leaning forward::, arms forward, close face, looking at viewer",
    "pose_3rd": "three-quarter cowboy shot, girl on top, straddling, 1.35::leaning forward::, arched spine",
    "prose_core": "straddling on top while leaning closely forward",
    "pov_visibility": "front_face_visible"
  },
  "P11": {
    "id": "P11",
    "title": "P11 · 后仰双手向后撑女上位 (Leaning-Back Arch Top)",
    "category": "2. 女上位·骑乘坐姿系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "low angle, from below, girl on top, straddling, 1.35::leaning back::, arched back, arms supporting behind, looking down at viewer",
    "pose_3rd": "side three-quarter view, girl on top, straddling, 1.35::leaning back::, hands braced behind, arched torso",
    "prose_core": "straddling on top while leaning back on both hands with an arched spine",
    "pov_visibility": "front_face_visible"
  },
  "P12": {
    "id": "P12",
    "title": "P12 · 背向跪姿反向骑乘位 (Reverse Cowgirl)",
    "category": "2. 女上位·骑乘坐姿系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "1.45::pov::, 1.35::from below::, low angle, 1.5::from behind::, 1.35::back::, 1.35::facing away::, girl on top, reverse straddle, kneeling, back of head, bare back, shoulder blades, spine, arched back",
    "pose_3rd": "rear three-quarter view, girl on top, reverse straddle, kneeling, arched back, looking back over shoulder",
    "prose_core": "kneeling in a reverse straddling posture seen from behind while glancing over her shoulder",
    "pov_visibility": "rear_no_face",
    "prose_pov": "kneeling in a reverse straddling posture facing away, showing the back of her head, bare shoulder blades, and arched spine from below"
  },
  "P13": {
    "id": "P13",
    "title": "P13 · 背向蹲踞开脚骑乘位 (Reverse Squatting Top)",
    "category": "2. 女上位·骑乘坐姿系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "1.45::pov::, 1.35::from below::, low angle, 1.5::from behind::, 1.35::back::, 1.35::facing away::, 1.4::squatting::, girl on top, reverse straddle, knees wide, back of head, bare back, shoulder blades, spine",
    "pose_3rd": "rear low angle, 1.4::squatting::, girl on top, reverse straddle, back view, looking back",
    "prose_core": "squatting with wide knees in a reverse straddling posture seen from behind",
    "pov_visibility": "rear_no_face",
    "prose_pov": "squatting with wide knees in a reverse straddling posture facing away, showing the back of her head and arched bare back from below"
  },
  "P14": {
    "id": "P14",
    "title": "P14 · 面对面怀抱坐莲位 (Seated Lotus)",
    "category": "2. 女上位·骑乘坐姿系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "close cowboy shot, 1.35::upright straddle::, sitting on lap, face-to-face, arms around neck, looking at viewer",
    "pose_3rd": "three-quarter view, 1.35::upright straddle::, sitting on lap, wrapped legs, close embrace",
    "prose_core": "sitting upright face-to-face on a lap with her legs wrapped inward",
    "pov_visibility": "front_face_visible"
  },
  "P15": {
    "id": "P15",
    "title": "P15 · 背靠怀抱坐姿观音位 (Reverse Seated Lap)",
    "category": "2. 女上位·骑乘坐姿系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "1.45::pov::, 1.4::from above::, top-down, high angle, looking down, pov hands, top of head, foreshortening, sitting on lap, back against chest, spread thighs, knees up",
    "pose_3rd": "frontal view, sitting on lap from behind, leaning back, 1.35::spread legs::, knees raised, looking at viewer",
    "prose_core": "sitting leaned back with her knees raised and thighs parted toward the front",
    "pov_visibility": "top_down_over_shoulder",
    "prose_pov": "sitting leaned back against the viewer's chest seen from directly above over the top of her head, looking down along her chest, stomach, and parted thighs"
  },
  "P16": {
    "id": "P16",
    "title": "P16 · 跨坐控腿主导女上位 (Amazon Top)",
    "category": "2. 女上位·骑乘坐姿系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "low angle, from below, girl on top, squatting forward, dominant posture, hands forward, looking down at viewer",
    "pose_3rd": "three-quarter view, amazon posture, girl straddling forward in a deep squat, looking at viewer",
    "prose_core": "straddling forward in a deep dominant squat while looking down",
    "pov_visibility": "front_face_visible"
  },
  "P17": {
    "id": "P17",
    "title": "P17 · 标准四肢跪趴后入位 (Classic All-Fours)",
    "category": "3. 后入·俯卧跪趴系",
    "channel": "vaginal",
    "canvas": "横图 1216x832",
    "pose_pov": "1.45::pov::, 1.35::from above::, high angle, 1.5::from behind::, 1.35::back::, 1.35::facing away::, 1.3::all fours::, kneeling, arched back, raised hips, back of head, bare back, shoulder blades, spine",
    "pose_3rd": "side three-quarter rear view, 1.3::all fours::, kneeling, arched lower back, looking back at viewer",
    "prose_core": "on all fours with an arched lower back while looking back over her shoulder",
    "pov_visibility": "rear_no_face",
    "prose_pov": "on all fours facing away, showing the back of her head, bare slender back, and raised hips from above"
  },
  "P18": {
    "id": "P18",
    "title": "P18 · 塌腰贴胸高翘臀位 (Top-Down Bottom-Up)",
    "category": "3. 后入·俯卧跪趴系",
    "channel": "vaginal",
    "canvas": "横图 1216x832",
    "pose_pov": "1.45::pov::, 1.35::from above::, high angle, 1.5::from behind::, 1.35::back::, 1.35::facing away::, 1.4::top-down bottom-up::, chest down, forearms down, hips high, arched spine, back of head, bare back, shoulder blades",
    "pose_3rd": "side three-quarter view, 1.4::top-down bottom-up::, chest pressed low, raised hips, looking back",
    "prose_core": "resting her chest low on her forearms with her hips raised high and spine arched",
    "pov_visibility": "rear_no_face",
    "prose_pov": "resting her chest low on her forearms facing away, showing the back of her head, arched spine, and high-raised hips"
  },
  "P19": {
    "id": "P19",
    "title": "P19 · 平趴贴身俯卧位 (Flat Prone)",
    "category": "3. 后入·俯卧跪趴系",
    "channel": "vaginal",
    "canvas": "横图 1216x832",
    "pose_pov": "1.45::pov::, 1.35::from above::, high angle, 1.5::from behind::, 1.35::back::, 1.35::facing away::, 1.35::lying on stomach::, prone, slightly parted legs, back of head, bare back, shoulder blades, spine",
    "pose_3rd": "side three-quarter view, 1.35::lying on stomach::, flat prone posture, head resting on arms, looking at viewer",
    "prose_core": "lying flat on her stomach with her head turned back toward the viewer",
    "pov_visibility": "rear_no_face",
    "prose_pov": "lying flat on her stomach facing away, showing the back of her head and bare slender back from above"
  },
  "P20": {
    "id": "P20",
    "title": "P20 · 直立跪姿背拉手后入位 (Upright Kneeling Rear)",
    "category": "3. 后入·俯卧跪趴系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "1.45::pov::, slight high angle, 1.5::from behind::, 1.35::back::, 1.35::facing away::, kneeling upright, torso upright, arched chest, 1.45::arms pulled back::, 1.4::wrists held::, holding wrists, arched spine, back of head, bare back, shoulder blades",
    "pose_3rd": "three-quarter side-rear view, kneeling upright, arms pulled back, arched posture, looking back",
    "prose_core": "kneeling upright with her arms drawn back and chest arched while glancing over her shoulder",
    "pov_visibility": "rear_no_face",
    "prose_pov": "kneeling upright facing away with both wrists held and her arms pulled firmly behind her back, showing the back of her head, shoulder blades, and arched upright back",
    "extra_pov_neg": "hands on floor, all fours, supporting hands forward"
  },
  "P21": {
    "id": "P21",
    "title": "P21 · 站立扶撑弯腰后入位 (Standing Bent-Over)",
    "category": "3. 后入·俯卧跪趴系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "1.45::pov::, 1.35::from above::, high angle, 1.5::from behind::, 1.35::back::, 1.35::facing away::, standing, 1.35::bent over::, supporting hands forward, parted legs, back of head, bare back, shoulder blades, spine",
    "pose_3rd": "three-quarter rear view, standing, 1.35::bent over::, torso leaned forward, one heel slightly raised, looking back",
    "prose_core": "standing bent forward with hands braced ahead while looking back over her shoulder",
    "pov_visibility": "rear_no_face",
    "prose_pov": "standing bent forward with hands braced ahead facing away, showing the back of her head and bare slender back"
  },
  "P22": {
    "id": "P22",
    "title": "P22 · 蛙式屈膝俯卧开胯位 (Frog-Leg Prone)",
    "category": "3. 后入·俯卧跪趴系",
    "channel": "vaginal",
    "canvas": "横图 1216x832",
    "pose_pov": "1.45::pov::, 1.35::from above::, high angle, 1.5::from behind::, 1.35::back::, 1.35::facing away::, lying on stomach, bent knees spread wide, soles upward, back of head, bare back, spine",
    "pose_3rd": "three-quarter overhead rear view, lying on stomach, arms folded under chin, frog-leg bent knees apart, looking back",
    "prose_core": "lying prone on her stomach with her arms folded beneath her chin and both knees bent outward to the sides",
    "pov_visibility": "rear_no_face",
    "prose_pov": "lying prone on her stomach facing away with both knees bent wide outward, showing the back of her head and bare back"
  },
  "P23": {
    "id": "P23",
    "title": "P23 · 侧卧汤匙贴背位 (Spooning Side)",
    "category": "4. 侧卧·汤匙交叉系",
    "channel": "vaginal",
    "canvas": "横图 1216x832",
    "pose_pov": "1.45::pov::, close side-rear view, 1.45::from behind::, 1.35::lying on side::, spooning, curled knees, head on pillow, 1.35::facing away::, nape, back of head, bare back, spine",
    "pose_3rd": "landscape view, 1.35::lying on side::, spooning posture, knees drawn up, looking at viewer",
    "prose_core": "lying on her side with her knees gently drawn up while glancing back",
    "pov_visibility": "rear_no_face",
    "prose_pov": "lying on her side in a close spooning posture facing away, showing the back of her head, slender nape, and curved back"
  },
  "P24": {
    "id": "P24",
    "title": "P24 · 侧卧单腿高抬展开位 (Side Leg-Raised)",
    "category": "4. 侧卧·汤匙交叉系",
    "channel": "vaginal",
    "canvas": "横图 1216x832",
    "pose_pov": "three-quarter view, 1.3::lying on side::, 1.35::one leg raised::, open hip, supporting on elbow, looking at viewer",
    "pose_3rd": "landscape three-quarter view, lying on side, upper leg lifted high, open posture, looking at viewer",
    "prose_core": "lying on her side propped on one elbow with her upper leg lifted high",
    "pov_visibility": "front_face_visible"
  },
  "P25": {
    "id": "P25",
    "title": "P25 · 侧身交错剪刀位 (Lateral Crossed)",
    "category": "4. 侧卧·汤匙交叉系",
    "channel": "vaginal",
    "canvas": "横图 1216x832",
    "pose_pov": "1.45::pov::, 1.3::from above::, high angle, pov hands, grabbing thigh, reclining on side, 1.4::leg lift::, 1.35::spread legs::, one leg raised, straddling one leg, interlocked legs, looking at viewer",
    "pose_3rd": "overhead three-quarter view, reclining laterally with interlocked angled legs, 1.35::spread legs::, one leg raised, looking at viewer",
    "prose_core": "reclining laterally with one leg lifted and thighs parted in an interlocked scissor posture while looking toward the viewer",
    "pov_visibility": "front_face_visible"
  },
  "P26": {
    "id": "P26",
    "title": "P26 · 站立面对面单腿挂腰壁咚位 (Standing Leg-Up)",
    "category": "5. 站立·悬空抱举系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "close cowboy shot, standing, face-to-face, 1.35::one leg lifted::, arms forward, looking at viewer",
    "pose_3rd": "three-quarter full-body shot, standing face-to-face, one leg hooked high at hip level, looking at viewer",
    "prose_core": "standing upright face-to-face with one leg lifted high at hip level",
    "pov_visibility": "front_face_visible"
  },
  "P27": {
    "id": "P27",
    "title": "P27 · 面对面悬空抱举火车便当位 (Suspended Ekiben)",
    "category": "5. 站立·悬空抱举系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "close shot, 1.4::lifted::, feet off ground, legs wrapped around waist, arms around neck, looking at viewer",
    "pose_3rd": "three-quarter full-body shot, 1.4::carried::, suspended in air face-to-face, legs wrapped high, feet off ground",
    "prose_core": "carried suspended in mid-air face-to-face with her arms around the neck and feet off the ground",
    "pov_visibility": "front_face_visible"
  },
  "P28": {
    "id": "P28",
    "title": "P28 · 背向悬空抱举正面开脚位 (Reverse Ekiben)",
    "category": "5. 站立·悬空抱举系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "1.45::pov::, 1.4::from above::, top-down, high angle, looking down, pov hands, top of head, foreshortening, standing, 1.35::suspended::, high above floor, distant floor, carried from behind, arms under knees, 1.35::spread legs::, m legs, feet off ground",
    "pose_3rd": "frontal full-body shot, 1.4::carried from behind::, facing viewer, lifted under knees in a wide M-shape, feet off ground",
    "prose_core": "lifted in mid-air from behind facing forward with both knees held wide apart",
    "pov_visibility": "top_down_over_shoulder",
    "prose_pov": "suspended high above the floor against the standing viewer's chest seen from directly above over the top of her head, looking down along her torso and wide M-spread legs cradled under both knees"
  },
  "P29": {
    "id": "P29",
    "title": "P29 · 玻璃窗前贴胸站立位 (Pressed On Glass)",
    "category": "5. 站立·悬空抱举系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "1.45::pov::, 1.5::from behind::, 1.35::back::, 1.35::facing away::, standing, 1.4::pressed against glass::, palms on glass, window in front, back of head, bare back, shoulder blades, spine",
    "pose_3rd": "frontal view through glass, standing, 1.4::against glass::, palms and flattened chest pressed against clear windowpane, fogged glass, looking at viewer",
    "prose_core": "standing with both palms and chest pressed flat against a clear glass pane",
    "pov_visibility": "rear_no_face",
    "prose_pov": "standing facing away with both palms pressed against the glass window in front of her, showing the back of her head and bare slender back"
  },
  "P30": {
    "id": "P30",
    "title": "P30 · 跪姿仰视双手奉仕位 (Kneeling Upward Oral)",
    "category": "6. 口部·上半身特写系",
    "channel": "oral",
    "canvas": "竖图 832x1216",
    "pose_pov": "1.35::from above::, high angle, kneeling, upper body, 1.35::looking up::, looking at viewer, hands cupped near chin",
    "pose_3rd": "three-quarter high angle, kneeling, upper body, leaning forward, hands near mouth, looking up",
    "prose_core": "kneeling and gazing upward from a high angle with hands raised near her chin",
    "pov_visibility": "front_face_visible"
  },
  "P31": {
    "id": "P31",
    "title": "P31 · 前倾扶头近景深部特写 (Close Forward Oral)",
    "category": "6. 口部·上半身特写系",
    "channel": "oral",
    "canvas": "竖图 832x1216",
    "pose_pov": "1.35::close-up::, portrait, from above, leaning forward, teary eyes, blush, looking up at viewer",
    "pose_3rd": "side three-quarter close-up, leaning forward, hands resting on hair, teary eyes",
    "prose_core": "in an intimate close-up leaning forward with misty eyes gazing upward",
    "pov_visibility": "front_face_visible"
  },
  "P32": {
    "id": "P32",
    "title": "P32 · 仰躺边缘垂首倒挂位 (Inverted Head-Back)",
    "category": "6. 口部·上半身特写系",
    "channel": "oral",
    "canvas": "竖图 832x1216",
    "pose_pov": "top-down view, lying on back, 1.35::upside-down::, head tilted back over edge, hair hanging down, looking at viewer",
    "pose_3rd": "side three-quarter view, lying on back at edge, head hanging backward, hair cascading down",
    "prose_core": "lying on her back with her head tilted backward over the edge and hair hanging down",
    "pov_visibility": "front_face_visible"
  },
  "P33": {
    "id": "P33",
    "title": "P33 · 上下交叠互侍 69 位 (Mutual 69)",
    "category": "6. 口部·上半身特写系",
    "channel": "sixty_nine",
    "canvas": "横图 1216x832",
    "canvas_pov": "竖图 832x1216",
    "pose_pov": "1.5::pov::, pov hands, grabbing ass, spreading another's ass, pov crotch, 1.45::from below::, worm's-eye view, 1.45::sixty-nine::, girl on top, straddling, kneeling above, 1.4::facing away::, foreshortening, thighs framing view, 1.35::ass focus::, bare stomach, underboob, bare breasts, head down, chin",
    "pose_3rd": "full body, 1.45::from side::, side view, profile, 1.55::sixty-nine::, girl on top, all fours, kneeling astride, straddling head, opposing orientation, head to crotch",
    "prose_core": "Full-body objective side-profile view: a faceless male lies flat on his back performing cunnilingus on {name} straddling upside-down on all fours above him in a mutual sixty-nine position while she leans down for mutual oral service at the opposite end",
    "pov_visibility": "ventral_no_eyes",
    "prose_pov": "First-person mutual 69 POV from underneath looking down {name}'s body: her parted glistening pussy hovers above the camera held open by POV hands, looking past her bare stomach and underboob down to her upside-down chin and mouth at the bottom",
    "extra_pov_neg": "looking back, looking back over shoulder, looking at viewer, eyes, eyebrows, eyelashes, pupils, front view, profile, vaginal, vaginal penetration, insertion, male back, male head, male shoulders, male face, over-the-shoulder, censor, mosaic censoring, bar censor, panties, leotard, black leotard, covered crotch, covering crotch",
    "extra_3rd_neg": "pov, first-person, worm's-eye view, front view, straight-on, vaginal, vaginal penetration, insertion, censor, mosaic censoring, bar censor, panties, leotard, black leotard, covered crotch, covering crotch, extra legs, extra arms, fused bodies"
  },
  "P34": {
    "id": "P34",
    "title": "P34 · 跨骑俯视坐颜位 (Straddling Low-Angle)",
    "category": "6. 口部·上半身特写系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "1.45::from below::, worm's-eye view, kneeling directly over viewer, thighs framing camera, looking down at viewer",
    "pose_3rd": "low-angle three-quarter shot, kneeling astride head level, looking down",
    "prose_core": "kneeling astride directly overhead while looking down from a steep low angle",
    "pov_visibility": "front_face_visible"
  },
  "P35": {
    "id": "P35",
    "title": "P35 · 双手拢胸夹持奉仕位 (Cleavage Press / Paizuri)",
    "category": "7. 外部部位·胸足腿手系",
    "channel": "chest",
    "canvas": "竖图 832x1216",
    "pose_pov": "1.35::from above::, close-up, kneeling, leaning forward, 1.35::looking up::, looking at viewer",
    "pose_3rd": "three-quarter high-angle cowboy shot, kneeling, leaning forward, arms pressed inward, looking at viewer",
    "prose_core": "kneeling and leaning forward while pressing both arms inward around her chest",
    "pov_visibility": "front_face_visible"
  },
  "P36": {
    "id": "P36",
    "title": "P36 · 坐姿双脚心相对足部奉仕位 (Foot Press / Footjob)",
    "category": "7. 外部部位·胸足腿手系",
    "channel": "foot",
    "canvas": "竖图 832x1216",
    "pose_pov": "sitting, leaning back on hands, legs extended toward viewer, 1.35::foot focus::, foreshortening, looking at viewer",
    "pose_3rd": "three-quarter view, sitting leaned back, both legs raised forward with soles pressed together, looking at viewer",
    "prose_core": "sitting leaned back on her hands with both feet extended forward and soles pressed together",
    "pov_visibility": "front_face_visible"
  },
  "P37": {
    "id": "P37",
    "title": "P37 · 紧闭大腿根贴合素股位 (Thigh Squeeze / Sumata)",
    "category": "7. 外部部位·胸足腿手系",
    "channel": "thigh",
    "canvas": "竖图 832x1216",
    "pose_pov": "low angle, kneeling astride, leaning slightly forward, inner thighs pressed close, looking down at viewer",
    "pose_3rd": "three-quarter cowboy shot, kneeling astride with thighs pressed snugly together, looking at viewer",
    "prose_core": "kneeling astride with her inner thighs pressed snugly together",
    "pov_visibility": "front_face_visible"
  },
  "P38": {
    "id": "P38",
    "title": "P38 · 翘臀贴合磨擦奉仕位 (Glute Press / Assjob)",
    "category": "7. 外部部位·胸足腿手系",
    "channel": "glute",
    "canvas": "竖图 832x1216",
    "pose_pov": "1.45::pov::, 1.35::from above::, high angle, close cowboy shot, 1.5::from behind::, 1.35::back::, 1.35::facing away::, kneeling, arched back, hips pushed back, squeezed glutes, back of head, bare back, spine",
    "pose_3rd": "rear three-quarter shot, kneeling, arched spine, hips raised, looking back at viewer",
    "prose_core": "kneeling with her lower back arched and glutes pressed together while glancing back",
    "pov_visibility": "rear_no_face",
    "prose_pov": "kneeling facing away with her lower back arched and glutes pressed together, showing the back of her head and bare back"
  },
  "P39": {
    "id": "P39",
    "title": "P39 · 贴身双手环握奉仕位 (Two-Handed Grip / Handjob)",
    "category": "7. 外部部位·胸足腿手系",
    "channel": "hand",
    "canvas": "竖图 832x1216",
    "pose_pov": "close cowboy shot, high angle, kneeling close, both hands raised together in front, shy gaze, looking at viewer",
    "pose_3rd": "three-quarter close shot, kneeling beside, both hands cupped together at chest height, looking at viewer",
    "prose_core": "kneeling up close with both hands cupped together in front while gazing shyly",
    "pov_visibility": "front_face_visible"
  },
  "P40": {
    "id": "P40",
    "title": "P40 · 双腋穿臂悬空大开脚位 (Full Nelson Lifted)",
    "category": "8. 柔韧进阶·展示系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "1.45::pov::, 1.4::from above::, top-down, high angle, looking down, pov hands, top of head, foreshortening, standing, 1.35::suspended::, high above floor, distant floor, full nelson, arms under armpits, lifted, knees pulled wide, feet dangling",
    "pose_3rd": "frontal full-body shot, 1.35::full nelson::, lifted from behind, arms behind neck, knees held wide apart, facing viewer",
    "prose_core": "lifted in mid-air from behind with her knees drawn high and wide apart facing forward",
    "pov_visibility": "top_down_over_shoulder",
    "prose_pov": "suspended high above the floor in a full-nelson hold against the standing viewer's chest seen from directly above over the top of her head, looking down along her arched torso and wide-drawn knees"
  },
  "P41": {
    "id": "P41",
    "title": "P41 · 倒立折腰高举臀位 (Inverted Fold / Piledriver)",
    "category": "8. 柔韧进阶·展示系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "1.45::pov::, 1.4::from above::, steep high angle, looking down, pov hands, grabbing hips, 1.55::piledriver::, 1.5::upside-down::, inverted body, head at bottom, hips at top, shoulders on floor, pelvis raised high in air, ass up, ankles by ears, upside-down face",
    "pose_3rd": "side three-quarter shot, 1.45::piledriver::, 1.35::upside-down::, inverted folded posture, shoulders resting low, hips vertical in air",
    "prose_core": "in an upside-down inverted piledriver posture with her shoulders resting low on the floor, head at the bottom, and hips raised vertically at the top",
    "pov_visibility": "front_face_visible",
    "prose_pov": "folded upside-down in an inverted piledriver posture seen steeply from above with her raised hips and ankles at the top of the frame and her upside-down head resting on her shoulders at the bottom",
    "extra_pov_neg": "head at top, upright, sitting, lying flat on back"
  },
  "P42": {
    "id": "P42",
    "title": "P42 · 站立一字马高抬腿平衡位 (Standing Vertical Split)",
    "category": "8. 柔韧进阶·展示系",
    "channel": "vaginal",
    "canvas": "竖图 832x1216",
    "pose_pov": "1.4::pov::, close-up, cowboy shot, pov hands, holding raised leg, standing, 1.45::standing split::, one leg raised vertically upward, flexible, looking at viewer",
    "pose_3rd": "three-quarter full-body shot, 1.45::standing split::, one leg extended straight upward, balanced posture, looking at viewer",
    "prose_core": "balancing in a flexible standing vertical split with one leg raised straight upward",
    "pov_visibility": "front_face_visible"
  },
  "P43": {
    "id": "P43",
    "title": "P43 · 正面M字开脚蹲坐展示位 (Solo M-Legs Showcase)",
    "category": "8. 柔韧进阶·展示系",
    "channel": "solo",
    "canvas": "竖图 832x1216",
    "pose_pov": "frontal view, sitting, 1.45::m legs::, knees bent wide apart, hands resting on knees, leaning slightly back, looking at viewer",
    "pose_3rd": "three-quarter frontal shot, sitting, 1.45::m legs::, knees bent wide, soles flat, looking at viewer",
    "prose_core": "sitting facing forward in an M-shaped open-knee posture while looking at the viewer",
    "pov_visibility": "front_face_visible"
  },
  "P44": {
    "id": "P44",
    "title": "P44 · 跪趴塌腰展示位 · 客观回眸/POV纯背特写 (Solo Rear-Arch Showcase)",
    "category": "8. 柔韧进阶·展示系",
    "channel": "solo",
    "canvas": "横图 1216x832",
    "pose_pov": "1.45::pov::, close-up, cowboy shot, 1.35::from above::, high angle, 1.5::from behind::, 1.35::back::, 1.35::facing away::, 1.35::ass focus::, pussy from behind, all fours, deep arched back, raised hips, knees apart, back of head, bare back, shoulder blades, spine",
    "pose_3rd": "three-quarter rear shot, kneeling on all fours, arched lower back, looking back over shoulder at viewer",
    "prose_core": "kneeling on all fours with a deep arched back while turning her head over her shoulder",
    "pov_visibility": "rear_no_face",
    "prose_pov": "kneeling up close on all fours facing away with a deep arched back and raised hips in intimate rear focus, showing the back of her head and bare spine"
  },
  "P45": {
    "id": "P45",
    "title": "P45 · 仰卧开腿双指深入指交位 (Supine Deep Fingering)",
    "category": "9. 手部爱抚·指技前戏系",
    "channel": "fingering",
    "canvas": "竖图 832x1216",
    "pose_pov": "1.3::from above::, lying on back, 1.35::spread legs::, knees bent wide, arched waist, looking at viewer",
    "pose_3rd": "three-quarter high angle, lying on back, spread legs, knees bent apart, hips slightly lifted, looking at viewer",
    "prose_core": "lying on her back with her knees bent wide apart and waist arching sensitively",
    "pov_visibility": "front_face_visible"
  },
  "P46": {
    "id": "P46",
    "title": "P46 · 背后拥抱一手揉胸一手抠弄位 (Rear Grope & Fingering)",
    "category": "9. 手部爱抚·指技前戏系",
    "channel": "grope_fingering",
    "canvas": "竖图 832x1216",
    "pose_pov": "1.45::pov::, 1.4::from above::, top-down, high angle, looking down, pov hands, top of head, foreshortening, sitting on lap, back against chest, 1.35::grabbing another's breast::, spread thighs",
    "pose_3rd": "frontal full-body shot, sitting held from behind against chest, 1.35::spread legs::, knees open, looking at viewer",
    "prose_core": "held closely from behind with her back pressed against chest and thighs parted wide toward the camera",
    "pov_visibility": "top_down_over_shoulder",
    "prose_pov": "sitting against the viewer's chest seen from directly above over the top of her head, looking down along her chest and wide-parted thighs"
  },
  "P47": {
    "id": "P47",
    "title": "P47 · 双手拨开阴唇精准玩弄阴蒂位 (Spread & Clitoral Tease)",
    "category": "9. 手部爱抚·指技前戏系",
    "channel": "clit_tease",
    "canvas": "竖图 832x1216",
    "pose_pov": "low angle, close shot, reclining on back, 1.4::m legs::, knees wide apart, hips tilted forward, looking down at viewer",
    "pose_3rd": "low-angle three-quarter shot, reclining leaned back, wide M-shaped legs exposing groin clearly, looking at viewer",
    "prose_core": "reclining with her legs spread wide in an M-shape and hips tilted openly forward",
    "pov_visibility": "front_face_visible"
  },
  "P48": {
    "id": "P48",
    "title": "P48 · 站立抬单腿探手深抠位 (Standing Leg-Up Fingering)",
    "category": "9. 手部爱抚·指技前戏系",
    "channel": "fingering",
    "canvas": "竖图 832x1216",
    "pose_pov": "cowboy shot, standing, against wall, 1.35::one leg lifted::, open hip, leaning against wall, looking at viewer",
    "pose_3rd": "three-quarter full-body shot, standing pinned against wall, 1.35::one leg lifted::, knee hooked high, looking at viewer",
    "prose_core": "standing leaned back with one leg lifted high to expose her open hip",
    "pov_visibility": "front_face_visible"
  },
  "P49": {
    "id": "P49",
    "title": "P49 · 跪趴塌腰后方探手抠弄潮吹位 (All-Fours Rear Fingering)",
    "category": "9. 手部爱抚·指技前戏系",
    "channel": "fingering",
    "canvas": "横图 1216x832",
    "pose_pov": "1.45::pov::, 1.35::from above::, high angle, 1.5::from behind::, 1.35::back::, 1.35::facing away::, all fours, arched back, raised hips, knees apart, back of head, bare back, shoulder blades, spine",
    "pose_3rd": "rear three-quarter shot, kneeling on all fours, chest low, hips raised high, looking back at viewer",
    "prose_core": "kneeling on all fours with her spine arched low and hips raised while glancing back over her shoulder",
    "pov_visibility": "rear_no_face",
    "prose_pov": "kneeling on all fours facing away with her spine arched low and hips raised, showing the back of her head and bare back"
  },
  "P50": {
    "id": "P50",
    "title": "P50 · 背后环抱双手陷肉揉胸捏乳首 (Rear Dual Breast Grope)",
    "category": "9. 手部爱抚·指技前戏系",
    "channel": "breast_grope",
    "canvas": "竖图 832x1216",
    "pose_pov": "1.45::pov::, 1.4::from above::, top-down, high angle, looking down, pov hands, top of head, foreshortening, held from behind, back against chest, 1.35::grabbing another's breast::, arched chest",
    "pose_3rd": "frontal cowboy shot, held from behind, arched chest pushed forward, arms held down at sides, looking at viewer",
    "prose_core": "held closely from behind with her chest arched forward",
    "pov_visibility": "top_down_over_shoulder",
    "prose_pov": "held closely against the viewer's chest seen from directly above over the top of her head, looking down at her arched chest"
  },
  "P51": {
    "id": "P51",
    "title": "P51 · 背后抱腿大开脚正面指交展示位 (Cradled M-Spread Fingering)",
    "category": "9. 手部爱抚·指技前戏系",
    "channel": "fingering",
    "canvas": "竖图 832x1216",
    "pose_pov": "1.45::pov::, 1.4::from above::, top-down, high angle, looking down, pov hands, top of head, foreshortening, standing, 1.35::suspended::, high above floor, distant floor, carried from behind, arms under knees, 1.35::spread legs::, m legs, feet off ground",
    "pose_3rd": "frontal full-body shot, 1.35::carried from behind::, both knees cradled high and wide apart, feet off ground, facing viewer",
    "prose_core": "cradled from behind under both knees with her legs held wide open facing forward",
    "pov_visibility": "top_down_over_shoulder",
    "prose_pov": "suspended high above the floor against the standing viewer's chest seen from directly above over the top of her head, looking down along her torso and wide M-spread legs"
  },
  "TN01": {
    "id": "TN01",
    "title": "TN01 · 悬空M字吊缚缠绕·前戏玩弄 (Suspended M-Spread Coiled Tease)",
    "category": "10. 触手缠缚·苗床产卵系",
    "channel": "tentacle",
    "canvas": "竖图 832x1216",
    "pose_pov": "cowboy shot",
    "pose_3rd": "cowboy shot",
    "prose_core": "suspended in mid-air with wrists and ankles bound by glistening bioluminescent tentacles",
    "default_expr_tags": "frustrated, humiliated, v-shaped eyebrows, teary eyes, clenched teeth, heavy blush",
    "lock_scene_env": true,
    "env_tags": "dark cavern, glowing bioluminescent mist",
    "env_prose": " in a dark cavern filled with glowing bioluminescent mist",
    "env_badge": " · [🐙荧光暗窟]",
    "env_neg": "indoors, bedroom, bed, couch, bedsheet, bright window, sunlight, outdoors",
    "unlock_belly": false,
    "builtin_xray": false,
    "raw_action_tags": "1.55::tentacles::, 1.45::tentacle sex::, 1.35::slimy::, 1.3::slime (substance)::, suction cups, purple tentacles, 1.4::suspended::, lifted in air, feet off ground, wrists bound, bound wrists, bound ankles, 1.35::spread legs::, m legs, 1.3::tentacles on breasts::, nipple tweak, glistening skin, sweat, pussy juice, looking at viewer",
    "extra_scene_neg": "1boy, male, penis, human hands, extra fingers, extra legs, extra arms, multiple boys, phallus, testicles, x-ray, cross-section, uterus, pregnant, stomach bulge, censor, mosaic censoring, bar censor, covering crotch, covering breasts"
  },
  "TN02": {
    "id": "TN02",
    "title": "TN02 · 悬空M字深部贯通+子宫透视 (Suspended Deep Cervical + Womb X-Ray)",
    "category": "10. 触手缠缚·苗床产卵系",
    "channel": "tentacle",
    "canvas": "竖图 832x1216",
    "pose_pov": "cowboy shot",
    "pose_3rd": "cowboy shot",
    "prose_core": "suspended in mid-air with wrists bound by glistening tentacles and an anatomical cutaway view",
    "default_expr_tags": "torogao, bedroom eyes, heart-shaped pupils, open mouth, tongue out, saliva, heavy blush, teardrops",
    "lock_scene_env": true,
    "env_tags": "dark cavern, glowing bioluminescent mist",
    "env_prose": " in a dark cavern filled with glowing bioluminescent mist",
    "env_badge": " · [🐙荧光暗窟]",
    "env_neg": "indoors, bedroom, bed, couch, bedsheet, bright window, sunlight, outdoors",
    "unlock_belly": true,
    "builtin_xray": true,
    "raw_action_tags": "1.6::tentacles::, 1.55::tentacle sex::, 1.45::vaginal::, 1.35::cervical penetration::, 1.45::x-ray::, 1.4::cross-section::, 1.45::uterus::, cervix, 1.5::cum in uterus::, 1.4::cum::, 1.4::cumdrip::, stomach bulge, 1.35::slimy::, suction cups, purple tentacles, 1.35::suspended::, lifted in air, wrists bound, 1.35::spread legs::, m legs, tentacles on breasts, glistening skin, sweat, looking at viewer",
    "extra_scene_neg": "1boy, male, penis, human hands, extra fingers, extra legs, extra arms, multiple boys, phallus, testicles, fetus, baby, embryo, umbilical cord, skeleton, bones, skull, ribcage, gore, censor, mosaic censoring, bar censor, covering crotch, covering breasts"
  },
  "TN03": {
    "id": "TN03",
    "title": "TN03 · 侧视跪趴前后双端串烧同步 (Side All-Fours Dual-End Spitroast)",
    "category": "10. 触手缠缚·苗床产卵系",
    "channel": "tentacle",
    "canvas": "横图 1216x832",
    "pose_pov": "",
    "pose_3rd": "",
    "prose_core": "on all fours seen from the side amidst coiling bioluminescent tentacles",
    "default_expr_tags": "ahegao, rolling eyes, heart-shaped pupils, heavy blush, drooling",
    "lock_scene_env": true,
    "env_tags": "dark cavern, glowing bioluminescent mist",
    "env_prose": " in a dark cavern filled with glowing bioluminescent mist",
    "env_badge": " · [🐙荧光暗窟]",
    "env_neg": "indoors, bedroom, bed, couch, bedsheet, bright window, sunlight, outdoors",
    "unlock_belly": false,
    "builtin_xray": false,
    "raw_action_tags": "1.6::tentacles::, 1.55::tentacle sex::, 1.45::spitroast::, 1.45::all fours::, arched back, from side, 1.45::oral::, 1.4::fellatio::, tentacle in mouth, 1.45::vaginal::, 1.35::double penetration::, cum, cumdrip, saliva, 1.35::slimy::, suction cups, purple tentacles, tentacles on breasts, glistening skin, sweat",
    "extra_scene_neg": "1boy, male, penis, human hands, extra fingers, extra legs, extra arms, multiple boys, phallus, testicles, censor, mosaic censoring, bar censor, covering crotch, covering breasts"
  },
  "TN04": {
    "id": "TN04",
    "title": "TN04 · 触手巢穴鼓腹产卵+荧光卵囊透视 (Tentacle Pit Oviposition + Egg X-Ray)",
    "category": "10. 触手缠缚·苗床产卵系",
    "channel": "tentacle",
    "canvas": "竖图 832x1216",
    "pose_pov": "cowboy shot",
    "pose_3rd": "cowboy shot",
    "prose_core": "reclining bound inside a glowing tentacle nest with a rounded distended belly and centered cutaway view",
    "default_expr_tags": "torogao, heart-shaped pupils, tongue out, heavy blush, saliva",
    "lock_scene_env": true,
    "env_tags": "dark cavern, tentacle pit, glowing bioluminescent mist",
    "env_prose": " inside a dark cavern nest filled with glowing bioluminescent mist",
    "env_badge": " · [🐙暗窟苗床]",
    "env_neg": "indoors, bedroom, bed, couch, bedsheet, bright window, sunlight, outdoors",
    "unlock_belly": true,
    "builtin_xray": true,
    "raw_action_tags": "1.6::tentacles::, 1.55::tentacle sex::, 1.55::oviposition::, 1.45::eggs::, 1.5::stomach bulge::, cum inflation, round belly, 1.45::x-ray::, 1.4::cross-section::, 1.45::uterus::, 1.5::eggs in uterus::, reclining, spread legs, m legs, bound wrists, 1.35::slimy::, slime (substance), purple tentacles, glistening skin, sweat, looking at viewer",
    "extra_scene_neg": "1boy, male, penis, human hands, extra fingers, extra legs, extra arms, multiple boys, phallus, testicles, fetus, baby, embryo, umbilical cord, skeleton, bones, skull, ribcage, gore, censor, mosaic censoring, bar censor, covering crotch, covering breasts"
  },
  "TN05": {
    "id": "TN05",
    "title": "TN05 · 触手螺旋榨精 / 吸盘敏感带套弄 (Coiled Tentacle Milking & Suction)",
    "category": "10. 触手缠缚·苗床产卵系",
    "channel": "tentacle",
    "canvas": "竖图 832x1216",
    "pose_pov": "cowboy shot",
    "pose_3rd": "cowboy shot",
    "prose_core": "suspended with bound wrists amidst glossy purple tentacles coiling and milking",
    "default_expr_tags": "torogao, bedroom eyes, heart-shaped pupils, open mouth, saliva, heavy blush, trembling",
    "lock_scene_env": true,
    "env_tags": "dark cavern, glowing bioluminescent mist",
    "env_prose": " in a dark cavern filled with glowing bioluminescent mist",
    "env_badge": " · [🐙荧光暗窟]",
    "env_neg": "indoors, bedroom, bed, couch, bedsheet, bright window, sunlight, outdoors",
    "unlock_belly": false,
    "builtin_xray": false,
    "raw_action_tags": "cowboy shot, 1.6::tentacles::, 1.5::tentacle sex::, 1.35::slimy::, 1.3::slime (substance)::, suction cups, purple tentacles, 1.35::suspended::, bound wrists, spread legs, 1.35::tentacles on breasts::, nipple tweak, 1.4::milking::, 1.4::cum::, cum on stomach, 1.4::precum::, dripping, glistening skin, sweat, looking at viewer",
    "extra_scene_neg": "1boy, male, penis, human hands, extra fingers, extra legs, extra arms, multiple boys, phallus, testicles, x-ray, cross-section, uterus, cervix, cutaway, pregnant, stomach bulge, censor, mosaic censoring, bar censor, covering crotch, covering breasts"
  },
  "TN06": {
    "id": "TN06",
    "title": "TN06 · 暗窟贴壁十字磔缚·触手钻衣破衣 (Wall-Pinned Spread-Eagle & Clothes Tear)",
    "category": "10. 触手缠缚·苗床产卵系",
    "channel": "tentacle",
    "canvas": "竖图 832x1216",
    "pose_pov": "cowboy shot",
    "pose_3rd": "cowboy shot",
    "prose_core": "pinned spread-eagle against a wet cavern stone wall with tentacles tearing through her clothes",
    "default_expr_tags": "frustrated, humiliated, v-shaped eyebrows, teary eyes, crying, heavy blush",
    "lock_scene_env": true,
    "env_tags": "dark cavern, wet stone wall, glowing bioluminescent mist",
    "env_prose": " pinned against a wet stone wall inside a dark bioluminescent cavern",
    "env_badge": " · [🐙暗窟石壁]",
    "env_neg": "indoors, bedroom, bed, couch, bedsheet, bright window, sunlight, outdoors",
    "unlock_belly": false,
    "builtin_xray": false,
    "raw_action_tags": "cowboy shot, 1.45::pinned against wall::, 1.4::spread eagle::, bound wrists, bound ankles, 1.45::torn clothes::, 1.4::clothes rip::, 1.4::tentacles under clothes::, 1.6::tentacles::, 1.5::tentacle sex::, 1.35::slimy::, suction cups, purple tentacles, tentacles on breasts, pussy, pussy juice, dripping, glistening skin, sweat, looking at viewer",
    "extra_scene_neg": "1boy, male, penis, human hands, extra fingers, extra legs, extra arms, multiple boys, phallus, testicles, x-ray, cross-section, uterus, cervix, cutaway, pregnant, stomach bulge, censor, mosaic censoring, bar censor, covering crotch, covering breasts"
  },
  "TN07": {
    "id": "TN07",
    "title": "TN07 · 触手肉床抱膝折腿压制贯通 (Tentacle Nest Elevated Mating Press)",
    "category": "10. 触手缠缚·苗床产卵系",
    "channel": "tentacle",
    "canvas": "竖图 832x1216",
    "pose_pov": "1.3::from above::",
    "pose_3rd": "1.3::from above::",
    "prose_core": "lying on a writhing tentacle nest with folded legs pinned back in an elevated press",
    "default_expr_tags": "ahegao, rolling eyes, heart-shaped pupils, open mouth, tongue out, heavy blush, sweat",
    "lock_scene_env": true,
    "env_tags": "dark cavern, tentacle pit, glowing bioluminescent mist",
    "env_prose": " on a writhing tentacle pit inside a dark bioluminescent cavern",
    "env_badge": " · [🐙暗窟苗床]",
    "env_neg": "indoors, bedroom, bed, couch, bedsheet, bright window, sunlight, outdoors",
    "unlock_belly": false,
    "builtin_xray": false,
    "raw_action_tags": "1.3::from above::, lying on back, 1.45::mating press::, 1.4::folded legs::, knees to chest, ankles bound by tentacles, 1.6::tentacles::, 1.55::tentacle sex::, 1.35::slimy::, suction cups, purple tentacles, 1.45::vaginal::, 1.4::cum::, 1.4::cum overflow::, glistening skin, sweat, looking at viewer",
    "extra_scene_neg": "1boy, male, penis, human hands, extra fingers, extra legs, extra arms, multiple boys, phallus, testicles, x-ray, cross-section, uterus, cervix, cutaway, pregnant, stomach bulge, censor, mosaic censoring, bar censor, covering crotch, covering breasts"
  },
  "TN08": {
    "id": "TN08",
    "title": "TN08 · 近景触手深喉咽喉鼓包·黏液面缚 (Close-Up Tentacle Deepthroat & Throat Bulge)",
    "category": "10. 触手缠缚·苗床产卵系",
    "channel": "tentacle",
    "canvas": "竖图 832x1216",
    "pose_pov": "1.4::close-up::, 1.35::upper body::",
    "pose_3rd": "1.4::close-up::, 1.35::upper body::",
    "prose_core": "in an upper-body close-up with head tilted back taking a thick glossy tentacle deep down her throat",
    "default_expr_tags": "ahegao, rolling eyes, heart-shaped pupils, tears, crying, heavy blush, drooling",
    "lock_scene_env": true,
    "env_tags": "dark cavern, glowing bioluminescent mist",
    "env_prose": " in a dark cavern filled with glowing bioluminescent mist",
    "env_badge": " · [🐙荧光暗窟]",
    "env_neg": "indoors, bedroom, bed, couch, bedsheet, bright window, sunlight, outdoors",
    "unlock_belly": false,
    "builtin_xray": false,
    "raw_action_tags": "1.4::close-up::, 1.35::upper body::, head back, looking at viewer, ahegao, rolling eyes, heart-shaped pupils, tears, crying, heavy blush, drooling, 1.4::saliva::, saliva trail, 1.6::tentacles::, 1.5::tentacle sex::, 1.5::oral::, 1.5::deepthroat::, 1.45::irrumatio::, 1.5::tentacle in mouth::, 1.45::throat bulge::, 1.35::slimy::, suction cups, purple tentacles, tentacles around neck, bound arms behind back, cum on face",
    "extra_scene_neg": "1boy, male, penis, human hands, extra fingers, extra legs, extra arms, multiple boys, phallus, testicles, x-ray, cross-section, uterus, cervix, cutaway, pregnant, stomach bulge, censor, mosaic censoring, bar censor, covering crotch, covering breasts"
  },
  "TN09": {
    "id": "TN09",
    "title": "TN09 · 半透明荧光黏液茧囊·卵鞘悬浮培养 (Translucent Slime Cocoon Incubation)",
    "category": "10. 触手缠缚·苗床产卵系",
    "channel": "tentacle",
    "canvas": "竖图 832x1216",
    "pose_pov": "cowboy shot",
    "pose_3rd": "cowboy shot",
    "prose_core": "suspended inside a glowing translucent pink-purple slime cocoon with a rounded distended belly",
    "default_expr_tags": "torogao, half-closed eyes, heart-shaped pupils, parted lips, heavy blush, dreamy",
    "lock_scene_env": true,
    "env_tags": "dark cavern, glowing bioluminescent mist",
    "env_prose": " suspended inside a glowing translucent organic pod in a dark cavern",
    "env_badge": " · [🐙黏液茧囊]",
    "env_neg": "indoors, bedroom, bed, couch, bedsheet, bright window, sunlight, outdoors",
    "unlock_belly": true,
    "builtin_xray": false,
    "raw_action_tags": "cowboy shot, completely nude, 1.55::trapped in slime::, 1.5::translucent slime cocoon::, 1.45::egg pod::, 1.4::glowing membrane::, 1.4::suspended::, floating, spread legs, m legs, 1.6::tentacles::, 1.5::tentacle sex::, 1.45::slimy::, 1.45::slime (substance)::, 1.4::glowing liquid::, purple tentacles, 1.45::vaginal::, 1.4::stomach bulge::, round belly, cum inflation, tentacles on breasts, looking at viewer",
    "extra_scene_neg": "1boy, male, penis, human hands, extra fingers, extra legs, extra arms, multiple boys, phallus, testicles, x-ray, cross-section, uterus, cervix, cutaway, fetus, baby, embryo, umbilical cord, gore, covering crotch, covering breasts"
  },
  "TN10": {
    "id": "TN10",
    "title": "TN10 · 横图全端满载·悬空贯通鼓腹透视 (Landscape All-Holes Overload + Belly X-Ray)",
    "category": "10. 触手缠缚·苗床产卵系",
    "channel": "tentacle",
    "canvas": "横图 1216x832",
    "pose_pov": "wide shot",
    "pose_3rd": "wide shot",
    "prose_core": "suspended horizontally in mid-air with simultaneous oral and lower tentacle overload plus a centered cutaway",
    "default_expr_tags": "ahegao, rolling eyes, heart-shaped pupils, heavy blush, drooling, tears",
    "lock_scene_env": true,
    "env_tags": "dark cavern, glowing bioluminescent mist",
    "env_prose": " suspended in a dark cavern filled with glowing bioluminescent mist",
    "env_badge": " · [🐙横图全端]",
    "env_neg": "indoors, bedroom, bed, couch, bedsheet, bright window, sunlight, outdoors",
    "unlock_belly": true,
    "builtin_xray": true,
    "raw_action_tags": "wide shot, 1.45::suspended::, horizontal reclining in air, spread legs, arched back, 1.6::tentacles::, 1.55::tentacle sex::, 1.45::oral::, 1.45::deepthroat::, tentacle in mouth, 1.45::vaginal::, 1.45::stomach bulge::, 1.45::x-ray::, 1.4::cross-section::, 1.45::uterus::, 1.5::cum in uterus::, 1.4::cum::, 1.35::slimy::, suction cups, purple tentacles, glistening skin",
    "extra_scene_neg": "1boy, male, penis, human hands, extra fingers, extra legs, extra arms, multiple boys, phallus, testicles, fetus, baby, embryo, umbilical cord, skeleton, bones, skull, ribcage, gore, censor, mosaic censoring, bar censor, covering crotch, covering breasts"
  },
  "TN11": {
    "id": "TN11",
    "title": "TN11 · 生物活体触手寄生服同化 (Living Tentacle Parasite Suit / Symbiote)",
    "category": "10. 触手缠缚·苗床产卵系",
    "channel": "tentacle",
    "canvas": "竖图 832x1216",
    "pose_pov": "cowboy shot",
    "pose_3rd": "cowboy shot",
    "prose_core": "enveloped in a glossy purple-black living tentacle symbiote bodysuit with glowing veins creeping across her limbs",
    "default_expr_tags": "aroused, half-closed eyes, heart-shaped pupils, open mouth, blush, sweat",
    "lock_scene_env": true,
    "env_tags": "dark cavern, glowing bioluminescent mist",
    "env_prose": " in a dark cavern filled with glowing bioluminescent mist",
    "env_badge": " · [🐙活体寄生]",
    "env_neg": "indoors, bedroom, bed, couch, bedsheet, bright window, sunlight, outdoors",
    "unlock_belly": false,
    "builtin_xray": false,
    "raw_action_tags": "cowboy shot, legs apart, arched back, 1.55::living clothes::, 1.5::symbiote::, 1.5::tentacle suit::, 1.45::translucent slime bodysuit::, 1.4::organic armor::, glossy purple-black living membrane, glowing veins, 1.6::tentacles::, 1.5::tentacle sex::, 1.45::slimy::, suction cups, purple tentacles, tentacles crawling under membrane, 1.35::nipple bulge::, 1.4::vaginal::, 1.4::cum::, dripping, glistening skin, looking at viewer",
    "extra_scene_neg": "1boy, male, penis, human hands, extra fingers, extra legs, extra arms, multiple boys, phallus, testicles, x-ray, cross-section, uterus, cervix, cutaway, pregnant, stomach bulge, censor, mosaic censoring, bar censor, covering crotch, covering breasts"
  },
  "TN12": {
    "id": "TN12",
    "title": "TN12 · 异形半透明发光多卵鼓腹 (Translucent Glowing Egg-Belly Host)",
    "category": "10. 触手缠缚·苗床产卵系",
    "channel": "tentacle",
    "canvas": "竖图 832x1216",
    "pose_pov": "cowboy shot",
    "pose_3rd": "cowboy shot",
    "prose_core": "suspended nude with a heavily distended semi-translucent belly glowing with luminous alien eggs inside",
    "default_expr_tags": "torogao, bedroom eyes, heart-shaped pupils, tongue out, heavy blush, tears",
    "lock_scene_env": true,
    "env_tags": "dark cavern, tentacle pit, glowing bioluminescent mist",
    "env_prose": " suspended above a glowing tentacle pit inside a dark cavern",
    "env_badge": " · [🐙透光卵腹]",
    "env_neg": "indoors, bedroom, bed, couch, bedsheet, bright window, sunlight, outdoors",
    "unlock_belly": true,
    "builtin_xray": false,
    "raw_action_tags": "cowboy shot, completely nude, 1.4::suspended::, spread legs, m legs, bound wrists, 1.6::tentacles::, 1.55::tentacle sex::, 1.55::oviposition::, 1.55::extreme stomach bulge::, 1.5::pregnant::, 1.55::translucent belly::, 1.5::glowing eggs inside belly::, 1.45::eggs::, 1.4::egg laying::, 1.4::nipple suction::, 1.4::suction cups::, 1.4::slimy::, purple tentacles, translucent jellyfish tentacles, glowing liquid, cumdrip, looking at viewer",
    "extra_scene_neg": "1boy, male, penis, human hands, extra fingers, extra legs, extra arms, multiple boys, phallus, testicles, x-ray, cross-section, uterus, cervix, cutaway, fetus, baby, embryo, umbilical cord, gore, covering crotch, covering breasts"
  },
  "BG01": {
    "id": "BG01",
    "title": "BG01 · 发光蛛丝网缚·悬空黏丝束缚 (Glowing Spiderweb Bondage)",
    "category": "11. 异形虫巢·节肢异虫系",
    "channel": "tentacle",
    "canvas": "竖图 832x1216",
    "pose_pov": "cowboy shot",
    "pose_3rd": "cowboy shot",
    "prose_core": "suspended spread-eagle in a glowing bioluminescent spiderweb bound with sticky silk threads",
    "default_expr_tags": "frustrated, humiliated, v-shaped eyebrows, teary eyes, heavy blush",
    "lock_scene_env": true,
    "env_tags": "dark cavern, glowing bioluminescent spiderweb",
    "env_prose": " inside a dark cavern strung with glowing bioluminescent spiderwebs",
    "env_badge": " · [🕸️荧光蛛网]",
    "env_neg": "indoors, bedroom, bed, couch, bedsheet, bright window, sunlight, outdoors",
    "unlock_belly": false,
    "builtin_xray": false,
    "raw_action_tags": "1.5::spiderweb::, 1.45::trapped in web::, 1.4::silk bondage::, sticky spider silk, giant fantasy spider silhouette in background, cowboy shot, 1.4::suspended::, spread eagle, bound wrists, glistening skin, looking at viewer",
    "extra_scene_neg": "horror, gore, maggots, realistic insects, cockroach, fly, 1boy, male, penis, phallus, testicles, human hands, multiple boys, 2boys, extra hands, extra arms, extra legs, x-ray, cross-section, uterus, cutaway, pregnant"
  },
  "BG02": {
    "id": "BG02",
    "title": "BG02 · 半透明荧光巨型软虫贯通与套弄 (Giant Translucent Bioluminescent Worm)",
    "category": "11. 异形虫巢·节肢异虫系",
    "channel": "tentacle",
    "canvas": "竖图 832x1216",
    "pose_pov": "cowboy shot",
    "pose_3rd": "cowboy shot",
    "prose_core": "suspended with bound wrists as a smooth glowing cyan-purple translucent slime worm coils and penetrates",
    "default_expr_tags": "torogao, bedroom eyes, heart-shaped pupils, open mouth, saliva, heavy blush",
    "lock_scene_env": true,
    "env_tags": "dark cavern, glowing bioluminescent mist",
    "env_prose": " in a dark cavern filled with glowing bioluminescent mist",
    "env_badge": " · [🐛荧光软虫]",
    "env_neg": "indoors, bedroom, bed, couch, bedsheet, bright window, sunlight, outdoors",
    "unlock_belly": false,
    "builtin_xray": false,
    "raw_action_tags": "cowboy shot, 1.4::suspended::, spread legs, m legs, bound wrists, 1.55::giant worm::, 1.5::glowing translucent worm::, 1.45::slime worm::, smooth segmented translucent body, cyan-purple bioluminescence, 1.4::slimy::, 1.45::vaginal::, 1.4::cum::, glistening skin",
    "extra_scene_neg": "horror, gore, maggots, realistic insects, cockroach, fly, 1boy, male, penis, phallus, testicles, human hands, multiple boys, 2boys, extra hands, extra arms, extra legs, x-ray, cross-section, uterus, cutaway, pregnant"
  },
  "BG03": {
    "id": "BG03",
    "title": "BG03 · 黄金蜂巢蜜汁产卵床·琥珀卵剖面 (Golden Honeycomb Hive & Amber Oviposition)",
    "category": "11. 异形虫巢·节肢异虫系",
    "channel": "tentacle",
    "canvas": "竖图 832x1216",
    "pose_pov": "cowboy shot",
    "pose_3rd": "cowboy shot",
    "prose_core": "reclining inside glowing golden-amber honeycomb walls dripping honey slime with a centered cutaway full of translucent golden eggs",
    "default_expr_tags": "torogao, heart-shaped pupils, parted lips, heavy blush, dreamy",
    "lock_scene_env": true,
    "env_tags": "1.55::honeycomb::, 1.5::insect hive::, glowing golden-amber hexagonal hive walls",
    "env_prose": " inside glowing golden-amber hexagonal honeycomb hive walls",
    "env_badge": " · [🍯黄金蜂巢]",
    "env_neg": "indoors, bedroom, bed, couch, bedsheet, bright window, sunlight, outdoors",
    "unlock_belly": true,
    "builtin_xray": true,
    "raw_action_tags": "1.45::glowing honey slime::, sticky golden nectar, cowboy shot, reclining, spread legs, m legs, bound wrists, 1.55::oviposition::, 1.5::stomach bulge::, round belly, 1.5::translucent golden eggs::, 1.45::x-ray::, 1.4::cross-section::, 1.45::uterus::, 1.5::eggs in uterus::, ovipositor",
    "extra_scene_neg": "horror, gore, maggots, realistic insects, cockroach, fly, 1boy, male, penis, phallus, testicles, human hands, multiple boys, 2boys, extra hands, extra arms, extra legs, fetus, baby, embryo, skeleton, bones, skull"
  },
  "BG04": {
    "id": "BG04",
    "title": "BG04 · 荧光果冻幼体体表爬行 (Bioluminescent Jelly-Slugs Crawling Tease)",
    "category": "11. 异形虫巢·节肢异虫系",
    "channel": "tentacle",
    "canvas": "竖图 832x1216",
    "pose_pov": "cowboy shot",
    "pose_3rd": "cowboy shot",
    "prose_core": "reclining with bound wrists while cute translucent glowing pink-cyan jelly mini-slugs crawl across her skin leaving luminous trails",
    "default_expr_tags": "embarrassed, teary eyes, trembling, open mouth, heavy blush",
    "lock_scene_env": true,
    "env_tags": "dark cavern, glowing bioluminescent mist",
    "env_prose": " in a dark cavern filled with glowing bioluminescent mist",
    "env_badge": " · [✨果冻幼体]",
    "env_neg": "indoors, bedroom, bed, couch, bedsheet, bright window, sunlight, outdoors",
    "unlock_belly": false,
    "builtin_xray": false,
    "raw_action_tags": "cowboy shot, reclining, spread legs, bound wrists, 1.55::glowing translucent slugs::, 1.5::pastel bioluminescent larvae::, smooth cute jelly-like glowing mini-slugs crawling on skin, glowing slime trails, nipple tweak, pussy juice, dripping",
    "extra_scene_neg": "horror, gore, cockroach, fly, spider, legs on worms, round eggs, 1boy, male, penis, phallus, testicles, human hands, multiple boys, 2boys, extra hands, extra arms, extra legs, x-ray, cross-section, uterus, cervix, cutaway"
  },
  "BG05": {
    "id": "BG05",
    "title": "BG05 · 横图光泽甲壳巨虫后入压制 (Iridescent Chitinous Insectoid Rear Press)",
    "category": "11. 异形虫巢·节肢异虫系",
    "channel": "tentacle",
    "canvas": "横图 1216x832",
    "pose_pov": "wide shot, from side",
    "pose_3rd": "wide shot, from side",
    "prose_core": "on all fours from the side with a sleek purple-emerald iridescent chitinous insectoid monster gripping her waist from behind",
    "default_expr_tags": "ahegao, rolling eyes, heart-shaped pupils, heavy blush, saliva",
    "lock_scene_env": true,
    "env_tags": "dark glowing insect hive",
    "env_prose": " inside a dark glowing insect hive",
    "env_badge": " · [🪲甲壳虫巢]",
    "env_neg": "indoors, bedroom, bed, couch, bedsheet, bright window, sunlight, outdoors",
    "unlock_belly": false,
    "builtin_xray": false,
    "raw_action_tags": "wide shot, from side, 1.45::all fours::, arched back, raised hips, looking back at viewer, 1.55::insectoid monster::, 1.5::glossy iridescent chitin::, sleek purple-emerald carapace, glowing compound eyes, mantis-like chitinous forearms holding waist, 1.5::ovipositor::, 1.45::vaginal::, cum overflow, slimy",
    "extra_scene_neg": "horror, gore, maggots, realistic insects, cockroach, fly, 1boy, male, penis, phallus, testicles, human hands, multiple boys, 2boys, extra hands, extra arms, extra legs, x-ray, cross-section, uterus, cutaway, pregnant"
  },
  "BG06": {
    "id": "BG06",
    "title": "BG06 · 虫后母巢琥珀蛛丝透明金卵腹 (Queen's Amber-Silk Brood Cocoon & Egg Belly)",
    "category": "11. 异形虫巢·节肢异虫系",
    "channel": "tentacle",
    "canvas": "竖图 832x1216",
    "pose_pov": "cowboy shot",
    "pose_3rd": "cowboy shot",
    "prose_core": "suspended inside a translucent amber silk cocoon fed golden nectar by mouth with luminous golden eggs shining directly through her translucent belly",
    "default_expr_tags": "torogao, half-closed eyes, heart-shaped pupils, heavy blush, dreamy",
    "lock_scene_env": true,
    "env_tags": "glowing golden-violet insect queen chamber",
    "env_prose": " inside a glowing golden-violet insect queen chamber",
    "env_badge": " · [👑虫后母巢]",
    "env_neg": "indoors, bedroom, bed, couch, bedsheet, bright window, sunlight, outdoors",
    "unlock_belly": true,
    "builtin_xray": false,
    "raw_action_tags": "cowboy shot, 1.55::silk cocoon::, 1.5::translucent amber pod::, sticky glowing silk threads, 1.4::suspended::, spread legs, m legs, 1.45::feeding::, glowing nectar tendril in mouth, golden nectar dripping, 1.55::oviposition::, 1.55::extreme stomach bulge::, 1.55::translucent belly::, 1.5::glowing golden eggs inside belly::, 1.45::eggs::",
    "extra_scene_neg": "horror, gore, maggots, realistic insects, cockroach, fly, 1boy, male, penis, phallus, testicles, human hands, multiple boys, 2boys, extra hands, extra arms, extra legs, x-ray, cross-section, uterus, cutaway, fetus, baby"
  },
  "BG07": {
    "id": "BG07",
    "title": "BG07 · 下身荧光果冻幼虫大量溢出 (Full-Belly Hatching & Larvae Overflow)",
    "category": "11. 异形虫巢·节肢异虫系",
    "channel": "tentacle",
    "canvas": "竖图 832x1216",
    "pose_pov": "cowboy shot",
    "pose_3rd": "cowboy shot",
    "prose_core": "reclining with spread legs and a round belly as many small plump segmented translucent glowing pink-and-cyan jelly larvae wriggle and overflow in thick slime",
    "default_expr_tags": "ahegao, heart-shaped pupils, tongue out, heavy blush, trembling",
    "lock_scene_env": true,
    "env_tags": "dark glowing insect hive",
    "env_prose": " inside a dark glowing insect hive",
    "env_badge": " · [🐛幼虫溢出]",
    "env_neg": "indoors, bedroom, bed, couch, bedsheet, bright window, sunlight, outdoors",
    "unlock_belly": true,
    "builtin_xray": false,
    "raw_action_tags": "cowboy shot, reclining, 1.45::spread legs::, m legs, bound wrists, 1.45::stomach bulge::, round belly, 1.45::after vaginal::, 1.6::worms::, 1.55::small worms::, 1.5::grubs::, 1.5::larvae::, many small plump segmented translucent glowing pink-and-cyan jelly worms and larvae wriggling and overflowing out from pussy with thick white slime, 1.45::cum overflow::, 1.45::slimy::",
    "extra_scene_neg": "horror, gore, cockroach, fly, spider, legs on worms, round eggs, 1boy, male, penis, phallus, testicles, human hands, multiple boys, 2boys, extra hands, extra arms, extra legs, x-ray, cross-section, uterus, cervix, cutaway"
  },
  "BG08": {
    "id": "BG08",
    "title": "BG08 · 近景口部荧光幼虫与蜜涎满溢 (Close-Up Oral Larvae & Honey-Slime Overflow)",
    "category": "11. 异形虫巢·节肢异虫系",
    "channel": "tentacle",
    "canvas": "竖图 832x1216",
    "pose_pov": "1.4::close-up::, 1.35::upper body::",
    "pose_3rd": "1.4::close-up::, 1.35::upper body::",
    "prose_core": "in an upper-body close-up tilting her head back with small plump segmented translucent glowing golden-pink jelly larvae wriggling on her tongue and overflowing with honey-slime",
    "default_expr_tags": "ahegao, rolling eyes, heart-shaped pupils, tears, heavy blush, drooling",
    "lock_scene_env": true,
    "env_tags": "dark glowing hive",
    "env_prose": " inside a dark glowing hive",
    "env_badge": " · [🍯口部幼体]",
    "env_neg": "indoors, bedroom, bed, couch, bedsheet, bright window, sunlight, outdoors",
    "unlock_belly": false,
    "builtin_xray": false,
    "raw_action_tags": "1.4::close-up::, 1.35::upper body::, head tilted back, 1.45::open mouth::, tongue out, 1.55::oral::, 1.6::worms::, 1.55::small worms::, 1.5::grubs::, 1.5::larvae::, worms in mouth, many small plump segmented translucent glowing golden-pink jelly larvae wriggling on tongue and overflowing out of open mouth with thick glowing honey-slime, 1.45::saliva::, drooling, bound arms",
    "extra_scene_neg": "horror, gore, cockroach, fly, spider, legs on worms, round eggs, 1boy, male, penis, phallus, testicles, human hands, multiple boys, 2boys, extra hands, extra arms, extra legs, x-ray, cross-section, uterus, cervix, cutaway"
  },
  "BG09": {
    "id": "BG09",
    "title": "BG09 · 荧光吸盘软虫吮乳与套筒榨取 (Glowing Leech-Slug Suction & Milking)",
    "category": "11. 异形虫巢·节肢异虫系",
    "channel": "tentacle",
    "canvas": "竖图 832x1216",
    "pose_pov": "cowboy shot",
    "pose_3rd": "cowboy shot",
    "prose_core": "suspended with arched back while plump glowing violet-cyan translucent suction-worms latch onto her nipples and milk with glowing suction mouths",
    "default_expr_tags": "torogao, bedroom eyes, heart-shaped pupils, open mouth, heavy blush, sweat",
    "lock_scene_env": true,
    "env_tags": "dark cavern, glowing cyan-violet mist",
    "env_prose": " in a dark cavern filled with glowing cyan-violet mist",
    "env_badge": " · [🟣荧光吸虫]",
    "env_neg": "indoors, bedroom, bed, couch, bedsheet, bright window, sunlight, outdoors",
    "unlock_belly": false,
    "builtin_xray": false,
    "raw_action_tags": "cowboy shot, 1.4::suspended::, bound wrists, spread legs, arched back, 1.55::glowing leech::, 1.5::translucent suction-worm::, plump smooth glowing violet-cyan jelly leech-worms with round glowing suction mouths, 1.5::nipple suction::, leech sucking nipples, 1.45::cum::, slimy, glistening skin",
    "extra_scene_neg": "horror, gore, maggots, realistic insects, cockroach, fly, 1boy, male, penis, phallus, testicles, human hands, multiple boys, 2boys, extra hands, extra arms, extra legs, x-ray, cross-section, uterus, cutaway, pregnant"
  },
  "BG10": {
    "id": "BG10",
    "title": "BG10 · 奇幻食人花虫巢·催情金粉与花蕊软虫 (Carnivorous Flower-Pod & Pollen Vine-Worms)",
    "category": "11. 异形虫巢·节肢异虫系",
    "channel": "tentacle",
    "canvas": "竖图 832x1216",
    "pose_pov": "cowboy shot",
    "pose_3rd": "cowboy shot",
    "prose_core": "reclining inside a giant glowing magenta carnivorous flower blossom filled with golden pollen mist and bound by glowing green vine-worms",
    "default_expr_tags": "torogao, half-closed eyes, heart-shaped pupils, parted lips, heavy blush",
    "lock_scene_env": true,
    "env_tags": "1.55::giant glowing flower::, carnivorous fantasy flower pod, glowing magenta petals",
    "env_prose": " reclining inside a giant glowing magenta carnivorous flower blossom",
    "env_badge": " · [🌺魔花虫巢]",
    "env_neg": "indoors, bedroom, bed, couch, bedsheet, bright window, sunlight, outdoors",
    "unlock_belly": false,
    "builtin_xray": false,
    "raw_action_tags": "1.5::glowing golden pollen::, 1.45::aphrodisiac mist::, pink spore cloud, cowboy shot, reclining inside giant flower blossom, spread legs, bound by glowing green vine-worms, 1.5::plant tentacles::, glowing stamen worms, 1.45::vaginal::, nectar dripping, pussy juice",
    "extra_scene_neg": "horror, gore, maggots, realistic insects, cockroach, fly, 1boy, male, penis, phallus, testicles, human hands, multiple boys, 2boys, extra hands, extra arms, extra legs, x-ray, cross-section, uterus, cutaway, pregnant"
  },
  "BG11": {
    "id": "BG11",
    "title": "BG11 · 活体虹彩甲壳外骨骼虫娘同化 (Living Iridescent Chitin Exoskeleton Symbiote)",
    "category": "11. 异形虫巢·节肢异虫系",
    "channel": "tentacle",
    "canvas": "竖图 832x1216",
    "pose_pov": "cowboy shot",
    "pose_3rd": "cowboy shot",
    "prose_core": "arched back as sleek purple-emerald living iridescent chitin armor creeps across her limbs with glowing antennae and translucent insect wings",
    "default_expr_tags": "aroused, half-closed eyes, heart-shaped pupils, open mouth, blush, sweat",
    "lock_scene_env": true,
    "env_tags": "dark glowing hive",
    "env_prose": " inside a dark glowing hive",
    "env_badge": " · [🦋甲壳同化]",
    "env_neg": "indoors, bedroom, bed, couch, bedsheet, bright window, sunlight, outdoors",
    "unlock_belly": false,
    "builtin_xray": false,
    "raw_action_tags": "cowboy shot, legs apart, arched back, 1.55::living armor::, 1.5::iridescent chitin bodysuit::, 1.45::insect girl::, glowing antennae on head, translucent glowing insect wings, sleek purple-emerald living carapace armor creeping up thighs and arms, living insect tendrils, 1.4::vaginal::, glowing slime, glistening skin",
    "extra_scene_neg": "horror, gore, maggots, realistic insects, cockroach, fly, 1boy, male, penis, phallus, testicles, human hands, multiple boys, 2boys, extra hands, extra arms, extra legs, x-ray, cross-section, uterus, cutaway, pregnant"
  },
  "BG12": {
    "id": "BG12",
    "title": "BG12 · 横图虫巢剖面幼虫满载与双端溢出 (Landscape Brood-Pit Overload + Larvae X-Ray)",
    "category": "11. 异形虫巢·节肢异虫系",
    "channel": "tentacle",
    "canvas": "横图 1216x832",
    "pose_pov": "wide shot",
    "pose_3rd": "wide shot",
    "prose_core": "suspended horizontally in a glowing brood-pit with a centered cutaway packed with wriggling segmented glowing jelly larvae overflowing from both ends",
    "default_expr_tags": "ahegao, rolling eyes, heart-shaped pupils, heavy blush, drooling, tears",
    "lock_scene_env": true,
    "env_tags": "dark glowing insect brood-pit",
    "env_prose": " suspended inside a dark glowing insect brood-pit",
    "env_badge": " · [🐛横图幼巢]",
    "env_neg": "indoors, bedroom, bed, couch, bedsheet, bright window, sunlight, outdoors",
    "unlock_belly": true,
    "builtin_xray": true,
    "raw_action_tags": "wide shot, 1.45::suspended::, horizontal reclining in air, spread legs, arched back, 1.6::worms::, 1.55::small worms::, 1.5::grubs::, 1.5::larvae::, 1.45::oral::, larvae in mouth, 1.5::stomach bulge::, 1.5::x-ray::, 1.45::cross-section::, 1.45::uterus::, centered womb cross-section packed with wriggling small segmented glowing translucent larvae, dozens of small plump segmented glowing pink-cyan larvae overflowing and spilling out from pussy in thick slime",
    "extra_scene_neg": "horror, gore, cockroach, fly, spider, legs on worms, round eggs, 1boy, male, penis, phallus, testicles, human hands, multiple boys, 2boys, extra hands, extra arms, extra legs, fetus, baby, embryo, skeleton, bones, skull"
  },
  "BG13": {
    "id": "BG13",
    "title": "BG13 · 卧室床铺巨型蜚蠊/甲虫爬身仰卧前入 (Giant Cockroach/Beetle Bed Missionary)",
    "category": "11. 异形虫巢·节肢异虫系",
    "channel": "tentacle",
    "canvas": "竖图 832x1216",
    "pose_pov": "1.3::from above::",
    "pose_3rd": "1.3::from above::",
    "prose_core": "lying on her back on messy white bedsheets as a giant glossy dark chitinous cockroach-beetle clings tightly between her thighs with spiny jointed legs",
    "default_expr_tags": "frustrated, teary eyes, crying, heavy blush, open mouth, trembling",
    "lock_scene_env": true,
    "env_tags": "indoors, bedroom, messy white bedsheet, pillow",
    "env_prose": " on a messy bedroom bed",
    "env_badge": " · [🪳卧室巨虫]",
    "env_neg": "outdoors, dark cavern, tentacle pit, bioluminescent mist, forest, sky",
    "unlock_belly": false,
    "builtin_xray": false,
    "raw_action_tags": "1.3::from above::, lying on back, spread legs, knees bent, 1.6::giant insect::, 1.5::giant cockroach::, 1.45::giant beetle::, glossy dark reddish-brown chitin carapace, long antennae, spiny jointed insect legs clinging tightly to waist and inner thighs, mounting on top between legs, 1.45::vaginal::, insertion, fleshy insect phallus, 1.4::cum::, cum overflow",
    "extra_scene_neg": "gore, blood, rotting, human hands, human male, 1boy, penis, phallus, testicles, multiple boys, 2boys, extra human arms, extra human legs, x-ray, cross-section, uterus, cervix, cutaway"
  },
  "BG14": {
    "id": "BG14",
    "title": "BG14 · 室内地毯巨型蜘蛛趴背八足锁身跪趴后入 (Giant Spider Back-Clinging Rear Entry)",
    "category": "11. 异形虫巢·节肢异虫系",
    "channel": "tentacle",
    "canvas": "横图 1216x832",
    "pose_pov": "wide shot, from side",
    "pose_3rd": "wide shot, from side",
    "prose_core": "on all fours on a wooden floor rug seen from the side with a giant dark chitinous spider clinging to her back wrapping eight long jointed legs around her torso and thighs",
    "default_expr_tags": "ahegao, teary eyes, heavy blush, open mouth, sweat",
    "lock_scene_env": true,
    "env_tags": "indoors, wooden floor, beige rug",
    "env_prose": " on a wooden floor beige rug indoors",
    "env_badge": " · [🕷️巨蛛趴背]",
    "env_neg": "outdoors, dark cavern, tentacle pit, bioluminescent mist, forest, sky",
    "unlock_belly": false,
    "builtin_xray": false,
    "raw_action_tags": "wide shot, from side, 1.45::all fours::, arched back, raised hips, looking back at viewer, 1.6::giant spider::, 1.5::arachnid::, dark chitinous spider body clinging onto back, 8 long jointed spider legs wrapping around shoulders, ribs, and thighs, 1.45::from behind::, 1.45::vaginal::, thick fleshy spider phallus penetrating from behind, 1.4::cum overflow::",
    "extra_scene_neg": "gore, blood, rotting, human hands, human male, 1boy, penis, phallus, testicles, multiple boys, 2boys, extra human arms, extra human legs, x-ray, cross-section, uterus, cervix, cutaway"
  },
  "BG15": {
    "id": "BG15",
    "title": "BG15 · 抱脸虫覆面锁颈深喉鼓包+下身虫吸榨精 (Facehugger Oral Deepthroat + Groin Bug)",
    "category": "11. 异形虫巢·节肢异虫系",
    "channel": "tentacle",
    "canvas": "竖图 832x1216",
    "pose_pov": "cowboy shot",
    "pose_3rd": "cowboy shot",
    "prose_core": "lying on a messy bed with a pale chitinous facehugger clamping eight jointed finger-legs around her head and coiling its tail around her neck while a second bug latches onto her groin",
    "default_expr_tags": "tears, crying, heavy blush, muffled, trembling",
    "lock_scene_env": true,
    "env_tags": "indoors, bedroom, messy bed",
    "env_prose": " on a messy bedroom bed",
    "env_badge": " · [🦂抱脸深喉]",
    "env_neg": "outdoors, dark cavern, tentacle pit, bioluminescent mist, forest, sky",
    "unlock_belly": false,
    "builtin_xray": false,
    "raw_action_tags": "cowboy shot, lying on back, spread legs, 1.6::2 creatures::, 1.6::facehugger::, 1.55::parasitic arthropod::, facehugger clamped on face, tail around neck, 1.5::oral::, 1.5::deepthroat::, 1.45::throat bulge::, muffled, tears, 1.55::groin parasite::, second chitinous bug latched onto groin",
    "extra_scene_neg": "gore, blood, rotting, human hands, human male, 1boy, penis, phallus, testicles, multiple boys, 2boys, extra human arms, extra human legs, x-ray, cross-section, uterus, cervix, cutaway"
  },
  "BG16": {
    "id": "BG16",
    "title": "BG16 · 振翅巨型蚊蝇抱身前入贯通+口针吸乳 (Winged Giant Mosquito/Fly Standing Front Cling)",
    "category": "11. 异形虫巢·节肢异虫系",
    "channel": "tentacle",
    "canvas": "竖图 832x1216",
    "pose_pov": "cowboy shot",
    "pose_3rd": "cowboy shot",
    "prose_core": "pressed against a bedroom wall with a winged giant mosquito-fly clinging to her torso with six jointed legs while its proboscis sucks her nipple during frontal entry",
    "default_expr_tags": "ahegao, teary eyes, heavy blush, open mouth, arched back",
    "lock_scene_env": true,
    "env_tags": "indoors, bedroom, against wall",
    "env_prose": " pressed against a bedroom wall",
    "env_badge": " · [🦟振翅巨蝇]",
    "env_neg": "outdoors, dark cavern, tentacle pit, bioluminescent mist, forest, sky",
    "unlock_belly": false,
    "builtin_xray": false,
    "raw_action_tags": "cowboy shot, legs apart, arched back, 1.6::giant insect::, 1.5::giant mosquito::, 1.45::giant fly::, translucent veined insect wings, compound eyes, six slender jointed insect legs clinging tightly onto front torso and hips, long flexible proboscis sucking nipple, 1.45::vaginal::, thick fleshy insect penis penetrating from front, 1.4::cum overflow::",
    "extra_scene_neg": "gore, blood, rotting, human hands, human male, 1boy, penis, phallus, testicles, multiple boys, 2boys, extra human arms, extra human legs, x-ray, cross-section, uterus, cervix, cutaway"
  },
  "BG17": {
    "id": "BG17",
    "title": "BG17 · 巨型具足虫活体贞操带扣胯产卵鼓腹 (Giant Isopod Crotch-Hugger Living Belt)",
    "category": "11. 异形虫巢·节肢异虫系",
    "channel": "tentacle",
    "canvas": "竖图 832x1216",
    "pose_pov": "cowboy shot",
    "pose_3rd": "cowboy shot",
    "prose_core": "sitting on the bedroom floor with legs spread wide as a segmented glossy grey-brown giant isopod clamps tightly over her crotch like a living belt pumping eggs into her round belly",
    "default_expr_tags": "torogao, teary eyes, heavy blush, open mouth, trembling",
    "lock_scene_env": true,
    "env_tags": "indoors, bedroom floor",
    "env_prose": " sitting on a bedroom floor",
    "env_badge": " · [🐚具足扣胯]",
    "env_neg": "outdoors, dark cavern, tentacle pit, bioluminescent mist, forest, sky",
    "unlock_belly": true,
    "builtin_xray": false,
    "raw_action_tags": "cowboy shot, sitting with legs spread wide, leaning back on hands, 1.6::giant pillbug::, 1.55::giant isopod::, segmented glossy grey-brown chitinous carapace creature clamped tightly onto crotch like a living chastity belt, short jointed arthropod legs gripping hips and upper thighs, 1.5::oviposition::, thick fleshy ovipositor buried deep inside, 1.5::stomach bulge::, round distended belly, insect eggs, cum overflow",
    "extra_scene_neg": "gore, blood, rotting, human hands, human male, 1boy, penis, phallus, testicles, multiple boys, 2boys, extra human arms, extra human legs, x-ray, cross-section, uterus, cervix, cutaway"
  },
  "BG18": {
    "id": "BG18",
    "title": "BG18 · 卧室床铺红黑巨型多足蜈蚣盘身缠绕贯通 (Indoor Giant Centipede Spiral Coiling)",
    "category": "11. 异形虫巢·节肢异虫系",
    "channel": "tentacle",
    "canvas": "竖图 832x1216",
    "pose_pov": "cowboy shot",
    "pose_3rd": "cowboy shot",
    "prose_core": "kneeling on messy bedsheets as a glossy crimson-and-black giant centipede coils spirally around her thighs and torso gripping tightly with dozens of sharp jointed legs",
    "default_expr_tags": "ahegao, teary eyes, heavy blush, open mouth, sweat",
    "lock_scene_env": true,
    "env_tags": "indoors, messy bedsheet",
    "env_prose": " kneeling on messy bedsheets indoors",
    "env_badge": " · [🐛巨型蜈蚣]",
    "env_neg": "outdoors, dark cavern, tentacle pit, bioluminescent mist, forest, sky",
    "unlock_belly": false,
    "builtin_xray": false,
    "raw_action_tags": "cowboy shot, kneeling on bed, arched back, spread legs, 1.6::giant centipede::, glossy dark-crimson and black segmented chitinous carapace, dozens of sharp orange-red jointed centipede legs gripping thighs, waist, and torso as it coils spirally around body, 1.45::vaginal::, fleshy centipede phallus penetrating, 1.4::cum::",
    "extra_scene_neg": "gore, blood, rotting, human hands, human male, 1boy, penis, phallus, testicles, multiple boys, 2boys, extra human arms, extra human legs, x-ray, cross-section, uterus, cervix, cutaway"
  },
  "BG19": {
    "id": "BG19",
    "title": "BG19 · 虫奸事后鼓腹·成群白嫩肥蛆涌出爬腿 (Post-Oviposition Plump White Maggots Overflow)",
    "category": "11. 异形虫巢·节肢异虫系",
    "channel": "tentacle",
    "canvas": "竖图 832x1216",
    "pose_pov": "cowboy shot",
    "pose_3rd": "cowboy shot",
    "prose_core": "lying on messy bedsheets with a round belly as dozens of plump glossy white maggots and grubs overflow in thick white slime and crawl across her inner thighs",
    "default_expr_tags": "torogao, rolling eyes, heart-shaped pupils, tongue out, heavy blush, trembling",
    "lock_scene_env": true,
    "env_tags": "indoors, messy bedsheet",
    "env_prose": " lying on messy bedsheets indoors",
    "env_badge": " · [🪱白蛆涌出]",
    "env_neg": "outdoors, dark cavern, tentacle pit, bioluminescent mist, forest, sky",
    "unlock_belly": true,
    "builtin_xray": false,
    "raw_action_tags": "cowboy shot, lying on back, 1.45::spread legs::, m legs, 1.45::stomach bulge::, round belly, 1.5::oviposition::, 1.45::after vaginal::, 1.6::maggots::, 1.55::white grubs::, 1.5::small white worms::, dozens of plump glossy white maggots and grubs overflowing out from gaping pussy and crawling across inner thighs and belly in thick white slime, dark chitinous beetle crawling beside thigh, 1.45::cum overflow::",
    "extra_scene_neg": "gore, blood, rotting, human hands, human male, 1boy, penis, phallus, testicles, multiple boys, 2boys, extra human arms, extra human legs, x-ray, cross-section, uterus, cervix, cutaway"
  },
  "BG20": {
    "id": "BG20",
    "title": "BG20 · 横图大虫交尾+剖面虫卵白蛆同框涌出 (Landscape Multi-Bug Mounting + Womb X-Ray)",
    "category": "11. 异形虫巢·节肢异虫系",
    "channel": "tentacle",
    "canvas": "横图 1216x832",
    "pose_pov": "wide shot, from side",
    "pose_3rd": "wide shot, from side",
    "prose_core": "reclining on a messy bedroom bed seen from the side with a giant dark chitinous beetle-fly mounting between her legs and a centered cutaway packed with insect eggs and plump white maggots",
    "default_expr_tags": "ahegao, rolling eyes, heart-shaped pupils, heavy blush, drooling, tears",
    "lock_scene_env": true,
    "env_tags": "indoors, messy bedroom bed",
    "env_prose": " reclining on a messy bedroom bed",
    "env_badge": " · [🪲横图虫剖]",
    "env_neg": "outdoors, dark cavern, tentacle pit, bioluminescent mist, forest, sky",
    "unlock_belly": true,
    "builtin_xray": true,
    "raw_action_tags": "wide shot, from side, reclining on back with legs spread wide, 1.6::giant insect::, glossy dark chitinous beetle-fly mounting between legs, jointed insect legs gripping thighs, smaller dark bugs crawling on stomach, 1.5::stomach bulge::, 1.5::x-ray::, 1.45::cross-section::, 1.45::uterus::, 1.6::maggots::, 1.55::white grubs::, 1.45::cum overflow::, centered cutaway packed with insect eggs and wriggling plump white maggots overflowing",
    "extra_scene_neg": "gore, blood, rotting, human hands, human male, 1boy, penis, phallus, testicles, multiple boys, 2boys, extra human arms, extra human legs, fetus, baby, embryo, skeleton, bones, skull"
  }
};

export const NAI_IMAGE_ENDPOINT = "https://image.novelai.net";
export const MODEL_V5_FULL = "nai-diffusion-5-full";
export const MODEL_V5_FULL_MEDIUM = "nai-diffusion-5-full-medium";
export const MODEL_V4_5_FULL = "nai-diffusion-4-5-full";
export const NAI_MODEL_OPTIONS: Array<{
  id: "nai-diffusion-5-full" | "nai-diffusion-5-full-medium" | "nai-diffusion-4-5-full";
  label: string;
}> = [
  { id: "nai-diffusion-4-5-full", label: "♾️ V4.5 Full (28步 · Opus真无限0点 · 原生支持Vibe)" },
  { id: "nai-diffusion-5-full", label: "🔥 V5 Full High (28步 · 全题材独立UC · Opus恢复池)" },
  { id: "nai-diffusion-5-full-medium", label: "⚡ V5 Full Medium (14步极速 · 省42%恢复池 · 内联负权)" },
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
