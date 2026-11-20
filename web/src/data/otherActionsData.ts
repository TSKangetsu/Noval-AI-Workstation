export type SfCameraMode = "mirror" | "direct" | "ui_viewfinder" | "ui_livestream";
export type SfLightingMode =
  | "indoor_natural"
  | "sunlit_indoor"
  | "enclosed_indoor"
  | "steamy_glass"
  | "warm_spot"
  | "night_neon"
  | "flash";

export interface OtherActionTemplate {
  id: string;
  title: string;
  sub: string;
  category: string;
  canvas: string;
  camera_mode: SfCameraMode;
  lighting_mode: SfLightingMode;
  light_badge: string;
  light_tags: string;
  light_prose: string;
  builtin_outfit: string;
  femboy_outfit?: string;
  /** First-slot V5 camera angle, mirror/glass/UI framing, and core posture tags (<=6 words per tag) */
  framing_tags: string;
  /** Scene environment tags */
  env_tags: string;
  /** Fetish / prop tags that stay active even when using character's left-column outfit */
  core_prop_tags?: string;
  /** Combined scene + dedicated light + prop tags */
  scene_tags: string;
  female_tags: string;
  femboy_tags: string;
  futa_tags: string;
  female_prose: string;
  femboy_prose: string;
  futa_prose: string;
  /** Optional outfit-specific phrase inside prose to replace when `other_use_scene_outfit === false` */
  prose_outfit_phrase?: string;
  extra_neg?: string;
  femboy_extra_neg?: string;
  strip_slim_waist?: boolean;
  no_face_pov?: boolean;
  unblock_multiple_views?: boolean;
  allow_text_ui?: boolean;
  keep_wet_clothes?: boolean;
  allow_school_canon?: boolean;
}

export interface OtherActionChapter {
  id: string;
  title: string;
  sub: string;
  category: string;
  camera_mode: SfCameraMode;
  canvas: string;
}

export const OTHER_ACTION_CATEGORIES: string[] = [
  "1. 对镜私拍",
  "2. 场所露出",
  "3. 奇特机位",
  "4. 束缚与UI",
];

export const SF_MIRROR_UC = "pov hands, extra hands, 3 hands, extra fingers, bad hands";
export const SF_DIRECT_POV_UC =
  "holding phone, smartphone, cellphone, mobile phone, mirror, mirror selfie";

/** Skill-calibrated SF base cel-lock & wet-skin block (`nai-pose-taxonomy` Family 13) */
export const SF_BASE_CEL_LIGHT_BACKLIT =
  "1.15::cel shading::, anime coloring, lineart, 1.2::high contrast::, saturated, 1.25::backlighting::, 1.15::subsurface scattering::, 1.18::shiny skin::, sparkle";
export const SF_BASE_CEL_LIGHT_NO_BACKLIGHT =
  "1.15::cel shading::, anime coloring, lineart, 1.25::high contrast::, saturated, 1.15::subsurface scattering::, 1.18::shiny skin::, sparkle";

type RawSfEntry = Omit<OtherActionTemplate, "scene_tags">;

const RAW_SF_ENTRIES: RawSfEntry[] = [
  {
    id: "SF01",
    title: "公厕隔间踩盖掀裙对镜自拍",
    sub: "Public Restroom Stall Foot-on-Lid Mirror Selfie",
    category: "2. 场所露出",
    canvas: "竖图 832x1216",
    camera_mode: "mirror",
    lighting_mode: "enclosed_indoor",
    light_badge: "🏢隔间荧光",
    light_tags: "indoor fluorescent lighting, overhead stall light, enclosed shadow",
    light_prose:
      "Crisp overhead fluorescent restroom lighting casts cool enclosed shadows inside the narrow stall with pinprick wet highlights.",
    builtin_outfit: "unbuttoned shirt, pleated miniskirt, 1.4::skirt lift::, black thighhighs, no panties",
    framing_tags:
      "cowboy shot, 1.5::mirror selfie::, 1.45::holding phone::, smartphone, 1.4::one leg up::, foot on toilet lid, looking at mirror, shy blush",
    env_tags: "public restroom stall, narrow stall, locked stall door, toilet",
    female_tags: "bare breasts, 1.3::nipples::, groin, pussy, 0.85::spread pussy::, pussy juice",
    femboy_tags: "1.4::small penis::, 1.3::small testicles::, testicles, erection, 1.35::precum::",
    futa_tags: "bare breasts, 1.3::nipples::, 1.4::small penis::, erection, 1.4::precum::, pussy",
    female_prose:
      "taking a secret mirror selfie inside a narrow public restroom stall with one foot propped on the closed toilet lid, lifting her miniskirt high to expose her glistening pussy.",
    femboy_prose:
      "taking a secret mirror selfie inside a narrow public restroom stall with one foot propped on the closed toilet lid, lifting his miniskirt high to expose his erect small penis dripping precum.",
    futa_prose:
      "taking a secret mirror selfie inside a narrow public restroom stall with one foot propped on the closed toilet lid, lifting her miniskirt high to expose her erect small futanari shaft and glistening slit.",
    prose_outfit_phrase: "lifting her miniskirt high|lifting his miniskirt high",
  },
  {
    id: "SF02",
    title: "试衣间半拉帘竞泳拨档对镜",
    sub: "Fitting Room Curtain-Gap Swimsuit Pull-Aside",
    category: "2. 场所露出",
    canvas: "竖图 832x1216",
    camera_mode: "mirror",
    lighting_mode: "warm_spot",
    light_badge: "💡试衣暖射灯",
    light_tags: "1.4::warm spotlight::, indoor overhead spotlight, warm lighting, glossy fabric highlights",
    light_prose:
      "Illuminated by a warm overhead boutique fitting-room spotlight gleaming crisply across taut glossy fabric and soft peach skin.",
    builtin_outfit: "1.5::competition swimsuit::, glossy highleg swimsuit, 1.45::swimsuit aside::, crotch strap pulled aside",
    femboy_outfit:
      "1.5::competition swimsuit::, glossy highleg swimsuit, tight clothes, 1.45::swimsuit aside::, crotch strap pulled aside",
    framing_tags:
      "cowboy shot, 1.5::mirror selfie::, 1.45::holding phone::, smartphone, pulling crotch aside, looking at mirror, nervous blush",
    env_tags: "1.45::fitting room::, boutique dressing room, 1.4::curtain::, half-open curtain behind",
    female_tags: "groin, pussy peeking, labia, pussy juice",
    femboy_tags: "tight flat chest, 1.4::small penis::, 1.3::small testicles::, testicles, erection, 1.35::precum::",
    futa_tags: "1.4::small penis::, erection, 1.4::precum::, pussy, pussy juice",
    female_prose:
      "taking a mirror selfie in a warm boutique fitting room with the curtain slightly ajar behind her, pulling the glossy high-leg swimsuit crotch strap aside to reveal her wet slit.",
    femboy_prose:
      "taking a mirror selfie in a warm boutique fitting room with the curtain slightly ajar behind him, pulling the tight glossy swimsuit crotch strap aside to let his small erect penis pop out.",
    futa_prose:
      "taking a mirror selfie in a warm boutique fitting room with the curtain slightly ajar behind her, pulling the glossy swimsuit crotch strap aside to let her compact erect shaft pop out beside her wet slit.",
    prose_outfit_phrase:
      "pulling the glossy high-leg swimsuit crotch strap aside|pulling the tight glossy swimsuit crotch strap aside|pulling the glossy swimsuit crotch strap aside",
  },
  {
    id: "SF03",
    title: "地板平放手机M字跨蹲仰拍拉丝",
    sub: "Floor Phone Upward Wide-Angle M-Squat Straddle",
    category: "3. 奇特机位",
    canvas: "竖图 832x1216",
    camera_mode: "direct",
    lighting_mode: "indoor_natural",
    light_badge: "🏠室内逆光",
    light_tags: "soft indoor lighting, overhead room light, 1.25::backlighting::",
    light_prose:
      "Soft overhead bedroom rim-lighting outlines her squatting thighs while glistening fluid threads catch bright white speculars.",
    builtin_outfit: "open cardigan, nude underneath, thighhighs",
    framing_tags:
      "1.65::from below::, 1.6::worm's-eye view::, 1.55::wide-angle lens::, 1.45::fisheye::, 1.5::selfie::, 1.5::pov::, 1.55::groin focus::, head at top, 1.55::squatting::, 1.45::m legs::, straddling camera, looking down, wink, peace sign",
    env_tags: "indoors, bedroom, wooden floor",
    female_tags: "bare breasts, 1.3::nipples::, pussy, 0.9::spread pussy::, 1.45::pussy juice::, pussy juice string, dripping",
    femboy_tags: "1.4::small penis::, 1.3::small testicles::, testicles, erection, 1.45::precum::, 1.4::precum string::, dripping",
    futa_tags: "bare breasts, 1.3::nipples::, 1.4::small penis::, erection, 1.45::precum::, 1.4::precum string::, pussy, dripping",
    female_prose:
      "squatting wide-legged directly over a floor-level camera on the wooden floor, looking down with a playful wink and peace sign as glossy pussy juice strings drip toward the lens.",
    femboy_prose:
      "squatting wide-legged directly over a floor-level camera on the wooden floor, looking down with a playful wink and peace sign as glistening precum strings drip from his small penis toward the lens.",
    futa_prose:
      "squatting wide-legged directly over a floor-level camera on the wooden floor, looking down with a playful wink and peace sign as glistening precum strings drip from her compact shaft above her wet slit.",
    extra_neg: "upside-down, inverted, head at bottom, legs at top",
  },
  {
    id: "SF04",
    title: "正字涂鸦+项圈铁链浴室事后对镜",
    sub: "Tally Marks Body-Writing & Chained Collar Bathroom",
    category: "1. 对镜私拍",
    canvas: "竖图 832x1216",
    camera_mode: "mirror",
    lighting_mode: "steamy_glass",
    light_badge: "🚿浴室水雾",
    light_tags: "steamy bathroom lighting, warm vanity light, mist, water droplets on glass, wet skin",
    light_prose:
      "Humid bathroom vanity light diffuses softly through warm steam, catching dewy moisture and glossy white highlights across her skin.",
    builtin_outfit: "completely nude",
    framing_tags:
      "cowboy shot, 1.5::mirror selfie::, 1.45::holding phone::, smartphone, legs apart, looking at mirror, heart-shaped pupils, heavy blush",
    env_tags: "steamy bathroom, bathroom mirror, sink counter",
    core_prop_tags:
      "1.55::body writing::, 1.5::tally marks::, marker writing on stomach, marker writing on thighs, 1.45::collar::, black leather collar, chain leash",
    female_tags:
      "1.4::womb tattoo::, bare breasts, 1.3::nipples::, 0.95::spread pussy::, 1.45::creampie::, 1.7::cum in pussy::, 1.6::cum overflow::, cumdrip",
    femboy_tags:
      "1.4::small penis::, 1.3::small testicles::, testicles, erection, 1.45::after anal::, 1.5::cum from ass::, cum on thighs, cumdrip",
    futa_tags:
      "1.4::womb tattoo::, bare breasts, 1.3::nipples::, 1.4::small penis::, erection, 1.4::precum::, pussy, 1.45::creampie::, 1.6::cum overflow::, cumdrip",
    female_prose:
      "posing in a steamy bathroom mirror wearing a chained black collar with black marker tally marks and a pink womb tattoo on her stomach, thick white cum overflowing from her pussy.",
    femboy_prose:
      "posing in a steamy bathroom mirror wearing a chained black collar with black marker tally marks on his flat stomach and thighs, sticky white cum dripping down his inner thighs.",
    futa_prose:
      "posing in a steamy bathroom mirror wearing a chained black collar with black marker tally marks on her stomach and thighs, her compact shaft erect above her cum-overflowing pussy.",
    femboy_extra_neg: "womb tattoo",
    allow_text_ui: true,
  },
  {
    id: "SF05",
    title: "深夜楼道凸面广角镜敞风衣贴胶带跳蛋",
    sub: "Night Hallway Convex Security Mirror Open-Coat Toy",
    category: "2. 场所露出",
    canvas: "竖图 832x1216",
    camera_mode: "mirror",
    lighting_mode: "night_neon",
    light_badge: "🌙暗廊顶灯",
    light_tags: "dim lighting, night, cool overhead hallway light, moody corridor shadow",
    light_prose:
      "Dim cool night-hallway ceiling light reflects inside the curved convex mirror with moody corridor shadows and crisp skin highlights.",
    builtin_outfit: "beige trench coat, 1.55::open coat::, nude underneath, black thighhighs",
    framing_tags:
      "1.6::convex mirror::, round security mirror on wall, 1.45::fisheye::, 1.5::mirror selfie::, 1.45::holding phone::, smartphone, holding clothes open, trembling blush",
    env_tags: "apartment hallway, dim hallway at night, corridor",
    core_prop_tags: "1.55::egg vibrator::, 1.5::vibrator::, 1.45::tape::, medical tape on groin, vibrator cord",
    female_tags: "bare breasts, 1.3::nipples::, vibrator on clitoris, pussy, pussy juice",
    femboy_tags: "1.4::small penis::, 1.3::small testicles::, testicles, erection, vibrator taped to penis, 1.4::anal beads::",
    futa_tags: "bare breasts, 1.3::nipples::, 1.4::small penis::, erection, vibrator taped to penis, pussy, 1.35::anal beads::",
    female_prose:
      "holding her beige trench coat wide open in front of a round convex security mirror in a dim night apartment hallway, revealing a pink egg vibrator taped over her wet crotch.",
    femboy_prose:
      "holding his beige trench coat wide open in front of a round convex security mirror in a dim night apartment hallway, revealing a flat chest and a pink egg vibrator taped onto his small erect penis.",
    futa_prose:
      "holding her beige trench coat wide open in front of a round convex security mirror in a dim night apartment hallway, revealing bare breasts and a pink egg vibrator taped to her compact shaft.",
    prose_outfit_phrase: "holding her beige trench coat wide open|holding his beige trench coat wide open",
  },
  {
    id: "SF06",
    title: "横图落地镜跪趴宝石塞背影与镜中正面同框",
    sub: "Landscape Standing-Mirror Dual-View Jeweled Plug",
    category: "1. 对镜私拍",
    canvas: "横图 1216x832",
    camera_mode: "mirror",
    lighting_mode: "indoor_natural",
    light_badge: "🏠卧室柔光",
    light_tags: "soft bedroom window light, 1.2::backlighting::, gem facet sparkle",
    light_prose:
      "Soft bedroom sidelighting highlights her arched back and sets a bright sparkle on the faceted pink heart gem.",
    builtin_outfit: "unbuttoned cropped shirt, striped thighhighs, bottomless",
    framing_tags:
      "wide shot, three-quarter rear view, 1.5::all fours::, arched back, raised hips, 1.45::ass focus::, 1.55::mirror selfie::, 1.55::mirror reflection::, 1.45::holding phone::, smartphone",
    env_tags: "bedroom, messy bed, full-length standing mirror",
    core_prop_tags: "1.55::butt plug::, 1.5::jeweled butt plug::, pink heart gem plug",
    female_tags: "1.4::pussy from behind::, bare breasts in mirror, pussy juice",
    femboy_tags: "1.4::small penis::, 1.3::small testicles::, testicles between thighs, flat chest in mirror",
    futa_tags: "1.4::pussy from behind::, bare breasts in mirror, 1.4::small penis::, erection in mirror",
    female_prose:
      "kneeling on all fours with arched back beside a large floor mirror in a wide shot, presenting a jeweled pink heart butt plug and pussy in the foreground while her front and phone show in the mirror.",
    femboy_prose:
      "kneeling on all fours with arched back beside a large floor mirror in a wide shot, presenting a jeweled pink heart butt plug in the foreground while his flat chest and phone show in the mirror.",
    futa_prose:
      "kneeling on all fours with arched back beside a large floor mirror in a wide shot, presenting a jeweled pink heart butt plug and pussy in the foreground while her breasts, compact shaft, and phone show in the mirror.",
    unblock_multiple_views: true,
  },
  {
    id: "SF07",
    title: "透明玻璃茶几桌下穿拍坐压变形",
    sub: "Under Clear Glass Tabletop Pressed-Squish Upward POV",
    category: "3. 奇特机位",
    canvas: "竖图 832x1216",
    camera_mode: "direct",
    lighting_mode: "sunlit_indoor",
    light_badge: "☀️晴窗透光",
    light_tags: "sunlit room, 1.2::sunlight::, light rays, bright indoor daylight, glass reflection",
    light_prose:
      "Bright sunlit indoor daylight streams from above through the crystal-clear glass tabletop, illuminating the squished skin contact patch.",
    builtin_outfit: "cropped hoodie, clothes lift, bottomless",
    framing_tags:
      "1.65::from below::, 1.6::worm's-eye view::, 1.6::through glass::, 1.6::pressed against glass::, 1.55::ass against glass::, sitting on glass table, head at top, looking down, smug wink",
    env_tags: "indoors, clear glass table",
    female_tags: "bare breasts, squished ass, thighs against glass, 1.45::pussy against glass::, labia, wet marks on glass",
    femboy_tags: "squished ass, 1.4::small penis::, 1.3::small testicles::, penis against glass, balls against glass",
    futa_tags: "bare breasts, squished ass, pussy, 1.4::small penis::, penis against glass, wet marks on glass",
    female_prose:
      "sitting bare-bottomed directly on top of a clear glass coffee table while the camera shoots straight upward from underneath, squishing her buttocks and wet labia flat against the glass as she winks down.",
    femboy_prose:
      "sitting bare-bottomed directly on top of a clear glass coffee table while the camera shoots straight upward from underneath, squishing his buttocks, small scrotum, and shaft flat against the glass as he winks down.",
    futa_prose:
      "sitting bare-bottomed directly on top of a clear glass coffee table while the camera shoots straight upward from underneath, squishing her buttocks, wet pussy, and compact shaft flat against the glass as she winks down.",
    extra_neg: "upside-down, inverted, head at bottom, legs at top",
  },
  {
    id: "SF08",
    title: "口叼满载套套战利品掀黑T对镜",
    sub: "Cum-Filled Condom Held in Mouth + Shirt-Lift Trophy",
    category: "1. 对镜私拍",
    canvas: "竖图 832x1216",
    camera_mode: "mirror",
    lighting_mode: "indoor_natural",
    light_badge: "🏠卧室柔光",
    light_tags: "soft bedroom lighting, 1.2::backlighting::, translucent latex highlights",
    light_prose:
      "Soft bedroom rim-light gleams through the translucent cum-filled latex condom and across her flushed thighs.",
    builtin_outfit: "oversized black t-shirt, 1.5::clothes lift::, lifting own shirt, bottomless",
    framing_tags:
      "cowboy shot, 1.5::mirror selfie::, 1.45::holding phone::, smartphone, standing, legs apart, looking at mirror, smug blush",
    env_tags: "indoors, bedroom, bedroom mirror",
    core_prop_tags: "1.65::used condom::, 1.6::holding condom in mouth::, 1.5::cum in condom::, biting condom rim",
    female_tags:
      "bare breasts, 1.3::nipples::, 0.95::spread pussy::, 1.45::creampie::, 1.7::cum in pussy::, 1.55::cum overflow::, cumdrip",
    femboy_tags:
      "1.4::small penis::, 1.3::small testicles::, testicles, erection, 1.45::after anal::, 1.5::cum from ass::, cumdrip",
    futa_tags:
      "bare breasts, 1.3::nipples::, 1.4::small penis::, erection, pussy, 1.45::creampie::, 1.55::cum overflow::, cumdrip",
    female_prose:
      "taking a bedroom mirror selfie while lifting her oversized black t-shirt and biting the knotted rim of a heavy cum-filled condom in her mouth, thick cum overflowing from her pussy.",
    femboy_prose:
      "taking a bedroom mirror selfie while lifting his oversized black t-shirt over his flat chest and biting the knotted rim of a heavy cum-filled condom in his mouth, cum dripping down his inner thighs.",
    futa_prose:
      "taking a bedroom mirror selfie while lifting her oversized black t-shirt and biting the knotted rim of a heavy cum-filled condom in her mouth, her compact shaft erect above her cum-overflowing pussy.",
    prose_outfit_phrase:
      "while lifting her oversized black t-shirt and|while lifting his oversized black t-shirt over his flat chest and",
  },
  {
    id: "SF09",
    title: "伸臂高机位仰躺俯拍肚脐盛液池",
    sub: "Extended-Arm High-Angle Supine Navel Cum Pool",
    category: "3. 奇特机位",
    canvas: "竖图 832x1216",
    camera_mode: "direct",
    lighting_mode: "indoor_natural",
    light_badge: "🏠床铺柔光",
    light_tags: "soft diffused bedroom light, glossy liquid highlights",
    light_prose:
      "Soft overhead bedroom light catches bright milky speculars across the deep navel pool and her flushed stomach.",
    builtin_outfit: "unbuttoned collared shirt, open shirt, skirt pushed down, bottomless",
    framing_tags:
      "1.55::from above::, 1.5::high angle::, 1.5::selfie::, 1.5::pov::, 1.45::extended arm::, arm reaching toward viewer, lying on back, spread legs, panting, tongue out",
    env_tags: "indoors, messy white bedsheet, pillow",
    core_prop_tags: "1.6::cum on stomach::, 1.6::cum in navel::, deep navel cum pool",
    female_tags: "bare breasts, 1.3::nipples::, wet pussy, pussy juice",
    femboy_tags: "1.4::small penis::, 1.3::small testicles::, testicles, erection, 1.4::precum::",
    futa_tags: "bare breasts, 1.3::nipples::, 1.4::small penis::, erection, 1.4::precum::, wet pussy",
    female_prose:
      "lying back on a messy white bed with one arm extended straight up toward the camera, panting with tongue out as thick white cum pools deeply inside her navel above her glistening pussy.",
    femboy_prose:
      "lying back on a messy white bed with one arm extended straight up toward the camera, panting with tongue out as thick white cum pools deeply inside his navel above his twitching small penis.",
    futa_prose:
      "lying back on a messy white bed with one arm extended straight up toward the camera, panting with tongue out as thick white cum pools deeply inside her navel above her twitching compact shaft and wet slit.",
  },
  {
    id: "SF10",
    title: "滚圆鼓腹侧身单手托腹对镜记录",
    sub: "Distended Inflated Belly Side-3/4 Cradling Mirror",
    category: "1. 对镜私拍",
    canvas: "竖图 832x1216",
    camera_mode: "mirror",
    lighting_mode: "indoor_natural",
    light_badge: "🏠侧逆柔光",
    light_tags: "soft bedroom sidelighting, 1.25::backlighting::, taut belly highlight",
    light_prose:
      "Directional bedroom rim-lighting traces the taut curve of her round distended belly with a soft satin highlight cushion.",
    builtin_outfit: "cropped open camisole, bottomless",
    framing_tags:
      "cowboy shot, 1.45::three-quarter view::, from side, standing, 1.5::mirror selfie::, 1.45::holding phone::, smartphone, 1.5::hand on stomach::, cradling belly, looking at mirror",
    env_tags: "indoors, bedroom, full-length mirror",
    core_prop_tags: "1.6::stomach bulge::, 1.55::cum inflation::, 1.5::pregnant::, taut round belly, protruding navel",
    female_tags: "bare breasts, 1.3::nipples::, pussy, 1.5::cum overflow::, cum on thighs, cumdrip",
    femboy_tags: "1.4::small penis::, 1.3::small testicles::, erection beneath round belly, 1.45::after anal::, cumdrip",
    futa_tags: "bare breasts, 1.3::nipples::, 1.4::small penis::, erection beneath round belly, pussy, 1.5::cum overflow::",
    female_prose:
      "standing at a three-quarter angle in front of a bedroom mirror, cradling the underside of her taut glossy cum-inflated round belly with one hand while thick cum overflows down her thighs.",
    femboy_prose:
      "standing at a three-quarter angle in front of a bedroom mirror with a flat chest, cradling the underside of his taut glossy cum-inflated round belly with one hand above his small penis.",
    futa_prose:
      "standing at a three-quarter angle in front of a bedroom mirror, cradling the underside of her taut glossy cum-inflated round belly with one hand while her compact shaft pokes beneath it.",
    strip_slim_waist: true,
  },
  {
    id: "SF11",
    title: "水雾淋浴房湿透白衬衫贴镜自拍",
    sub: "Steamy Shower Booth Soaked See-Through Shirt Glass",
    category: "1. 对镜私拍",
    canvas: "竖图 832x1216",
    camera_mode: "mirror",
    lighting_mode: "steamy_glass",
    light_badge: "🚿淋浴水雾",
    light_tags: "steamy shower lighting, diffused mist glow, water droplets on glass, wet skin",
    light_prose:
      "Diffused shower-booth light filters through warm mist and beaded water droplets, turning the soaked white fabric translucent against her rosy skin.",
    builtin_outfit: "1.55::wet shirt::, 1.55::see-through::, soaked white collared shirt, wet clothes, no bra, no panties, bottomless",
    framing_tags:
      "cowboy shot, 1.5::mirror selfie::, 1.45::holding phone::, smartphone, legs apart, water droplets, looking at mirror",
    env_tags: "1.5::shower::, glass shower booth, steamy bathroom, mist",
    female_tags: "1.45::nipples visible through clothes::, bare thighs, pussy, 0.8::spread pussy::, pussy juice",
    femboy_tags: "nipples visible through clothes, 1.4::small penis::, 1.3::small testicles::, testicles, erection",
    futa_tags: "1.45::nipples visible through clothes::, 1.4::small penis::, erection, pussy, wet thighs",
    female_prose:
      "taking a selfie inside a steamy glass shower booth wearing a soaked see-through white button-up shirt clinging translucently over her nipples, completely bare below the hem.",
    femboy_prose:
      "taking a selfie inside a steamy glass shower booth wearing a soaked see-through white button-up shirt clinging translucently to his flat chest, exposing his wet small penis below the hem.",
    futa_prose:
      "taking a selfie inside a steamy glass shower booth wearing a soaked see-through white button-up shirt clinging translucently over her nipples, exposing her glistening compact shaft and slit below.",
    prose_outfit_phrase:
      "wearing a soaked see-through white button-up shirt clinging translucently over her nipples, completely bare below the hem|wearing a soaked see-through white button-up shirt clinging translucently to his flat chest, exposing his wet small penis below the hem|wearing a soaked see-through white button-up shirt clinging translucently over her nipples, exposing her glistening compact shaft and slit below",
    keep_wet_clothes: true,
  },
  {
    id: "SF12",
    title: "柔韧仰卧自折过肩·胯脸同框俯拍",
    sub: "Self-Folded Supine Piledriver Crotch-Beside-Cheek",
    category: "3. 奇特机位",
    canvas: "竖图 832x1216",
    camera_mode: "direct",
    lighting_mode: "indoor_natural",
    light_badge: "🏠卧室柔光",
    light_tags: "soft bedroom daylight, 1.2::backlighting::, warm skin glow",
    light_prose:
      "Clear overhead bedroom light illuminates both her winking cheek and her folded-up thighs side by side with soft satin highlights.",
    builtin_outfit: "sleeveless crop top, striped thighhighs, bottomless",
    framing_tags:
      "1.55::from above::, 1.5::selfie::, 1.45::pov::, extended arm, 1.65::piledriver pose::, 1.6::folded::, 1.6::legs over head::, flexible, hips above head, wink, heavy blush",
    env_tags: "indoors, soft bedsheet, pillow",
    female_tags: "raised ass, 1.4::anus::, pussy, 0.85::spread pussy::, pussy juice",
    femboy_tags: "raised ass, 1.4::anus::, 1.4::small penis::, 1.3::small testicles::, 1.4::precum::",
    futa_tags: "raised ass, 1.4::anus::, pussy, 1.4::small penis::, erection, 1.4::precum::",
    female_prose:
      "folded completely in half on a soft bed mat with legs draped over her shoulders, reaching one arm up to shoot a downward selfie showing her glistening pussy and buttocks right beside her winking cheek.",
    femboy_prose:
      "folded completely in half on a soft bed mat with legs draped over his shoulders, reaching one arm up to shoot a downward selfie showing his buttocks, anus, and small dripping penis beside his winking cheek.",
    futa_prose:
      "folded completely in half on a soft bed mat with legs draped over her shoulders, reaching one arm up to shoot a downward selfie showing her pussy, anus, and compact dripping shaft right beside her grinning cheek.",
  },
  {
    id: "SF13",
    title: "手机相机取景框UI画中画录制对焦",
    sub: "Smartphone Camera Viewfinder UI Frame-in-Frame",
    category: "4. 束缚与UI",
    canvas: "竖图 832x1216",
    camera_mode: "ui_viewfinder",
    lighting_mode: "indoor_natural",
    light_badge: "📱取景对焦光",
    light_tags: "glowing viewfinder screen, crisp indoor lighting, 1.2::backlighting::",
    light_prose:
      "The foreground smartphone screen glows crisply against a softly blurred bedroom while the subject inside the viewfinder is lit cleanly.",
    builtin_outfit: "1.5::reverse bunnysuit::, black bunny ears, black cropped jacket, white collar, red bowtie, black thighhighs",
    framing_tags:
      "1.65::phone screen::, 1.6::camera interface::, 1.55::viewfinder::, 1.5::depth of field::, smartphone held in foreground, blurry foreground, recording red dot, focus square, sitting on screen, spread legs",
    env_tags: "indoors, bedroom",
    female_tags: "bare breasts, 1.3::nipples::, pussy, 0.9::spread pussy::, pussy juice",
    femboy_tags: "1.4::small penis::, 1.3::small testicles::, testicles, erection, 1.35::precum::",
    futa_tags: "bare breasts, 1.3::nipples::, 1.4::small penis::, erection, 1.35::precum::, pussy",
    female_prose:
      "viewed through a foreground smartphone camera viewfinder screen complete with recording red dot and glowing focus square, crisply framing her sitting spread-legged inside the screen.",
    femboy_prose:
      "viewed through a foreground smartphone camera viewfinder screen complete with recording red dot and glowing focus square, crisply framing him sitting spread-legged with a flat chest inside the screen.",
    futa_prose:
      "viewed through a foreground smartphone camera viewfinder screen complete with recording red dot and glowing focus square, crisply framing her sitting spread-legged with compact futanari shaft and slit in sharp focus.",
    unblock_multiple_views: true,
    allow_text_ui: true,
  },
  {
    id: "SF14",
    title: "红绳自缚跪姿+口咬无线快门闪光拍",
    sub: "Red Shibari Self-Bondage + Biting Remote Shutter",
    category: "4. 束缚与UI",
    canvas: "竖图 832x1216",
    camera_mode: "direct",
    lighting_mode: "flash",
    light_badge: "⚡直打闪光",
    light_tags: "1.5::camera flash::, harsh direct flash lighting, flash drop shadow, dark background, 1.25::high contrast::",
    light_prose:
      "Stark direct camera flash illuminates her bound skin and crimson ropes in a dim room, casting sharp flash drop-shadows behind her.",
    builtin_outfit: "completely nude",
    framing_tags:
      "cowboy shot, kneeling, slight dutch angle, 1.5::biting::, remote control in mouth, teary eyes, heavy blush",
    env_tags: "indoors, dim room, tatami mat",
    core_prop_tags: "1.6::shibari::, 1.55::red rope::, rope bondage, bound wrists, bound thighs, wireless shutter remote",
    female_tags: "bare breasts, 1.3::nipples::, breast bondage, crotch rope, pussy, pussy juice",
    femboy_tags: "rope on flat chest, 1.4::small penis::, 1.3::small testicles::, erection, rope around penis, precum",
    futa_tags: "bare breasts, 1.3::nipples::, breast bondage, 1.4::small penis::, erection, rope around penis, pussy",
    female_prose:
      "kneeling on a tatami mat in a dim room lit by direct camera flash, bound tightly in red shibari ropes while biting a small black wireless shutter remote in her mouth with a teary blush.",
    femboy_prose:
      "kneeling on a tatami mat in a dim room lit by direct camera flash, bound tightly across his flat chest and thighs in red shibari ropes while biting a small wireless shutter remote in his mouth.",
    futa_prose:
      "kneeling on a tatami mat in a dim room lit by direct camera flash, bound tightly in red shibari ropes cinching the base of her erect compact shaft while biting a wireless shutter remote in her mouth.",
  },
  {
    id: "SF15",
    title: "锁骨夹机解放双手·第一人称低头掰穴",
    sub: "Chin-Clamped Hands-Free First-Person Look-Down POV",
    category: "3. 奇特机位",
    canvas: "竖图 832x1216",
    camera_mode: "direct",
    lighting_mode: "indoor_natural",
    light_badge: "🏠床头柔光",
    light_tags: "soft bedroom sidelighting, warm skin highlights",
    light_prose:
      "Soft bedroom sidelight glides down her chest, flat stomach, and inner thighs with clean wet highlights.",
    builtin_outfit: "unbuttoned cardigan, open cardigan, white thighhighs, no panties",
    framing_tags:
      "1.65::pov::, 1.6::first-person view::, 1.65::looking down::, 1.55::from above::, own chest at top, own hands between legs, sitting reclined, spread legs",
    env_tags: "indoors, bed, white bedsheet",
    female_tags:
      "bare breasts, 1.3::nipples::, 1.4::spreading own pussy::, 1.0::spread pussy::, 1.45::creampie::, 1.65::cum in pussy::, cum overflow",
    femboy_tags:
      "own hands on penis, 1.4::small penis::, 1.3::small testicles::, erection, 1.45::precum::",
    futa_tags:
      "bare breasts, 1.3::nipples::, holding own penis, 1.4::small penis::, erection, 1.4::precum::, pussy",
    female_prose:
      "first-person downward body perspective looking steeply past her bare small breasts and flat stomach down to her spread thighs as both of her own hands gently part her cum-brimmed pussy.",
    femboy_prose:
      "first-person downward body perspective looking steeply past his flat hairless chest and slim stomach down to his spread thighs as both of his own hands present his small erect penis dripping precum.",
    futa_prose:
      "first-person downward body perspective looking steeply past her bare small breasts and flat stomach down to her spread thighs as one hand holds her compact shaft while the other shows her wet slit.",
    extra_neg: "face, head, eyes",
    no_face_pov: true,
  },
  {
    id: "SF16",
    title: "深夜高层落地窗·城市霓虹暗玻璃倒影",
    sub: "Night High-Rise Window City-Light Glass Reflection",
    category: "2. 场所露出",
    canvas: "竖图 832x1216",
    camera_mode: "mirror",
    lighting_mode: "night_neon",
    light_badge: "🌃暗窗霓虹",
    light_tags:
      "dark unlit room at night, 1.5::city lights at night::, bokeh skyscraper lights, glowing smartphone screen, dim lighting, cool neon rim light",
    light_prose:
      "Inside an unlit dark high-rise room at night, colorful city-skyline bokeh shines through the glass while her glowing phone screen illuminates her reflected skin.",
    builtin_outfit: "oversized sweater, 1.45::clothes lift::, bottomless, bare legs",
    framing_tags:
      "cowboy shot, 1.55::window reflection::, 1.5::mirror selfie::, 1.45::holding phone::, smartphone, standing against glass, legs apart",
    env_tags: "night, 1.6::floor-to-ceiling window::, night skyline",
    female_tags: "bare breasts, 1.3::nipples::, pussy, 0.8::spread pussy::, glass reflection",
    femboy_tags: "1.4::small penis::, 1.3::small testicles::, testicles, erection, glass reflection",
    futa_tags: "bare breasts, 1.3::nipples::, 1.4::small penis::, erection, pussy, glass reflection",
    female_prose:
      "standing in a dark unlit high-rise room before a floor-to-ceiling night window overlooking bokeh city lights, capturing her bare breasts and glistening slit reflected in the dark glass.",
    femboy_prose:
      "standing in a dark unlit high-rise room before a floor-to-ceiling night window overlooking bokeh city lights, capturing his flat chest and small erect penis reflected in the dark glass.",
    futa_prose:
      "standing in a dark unlit high-rise room before a floor-to-ceiling night window overlooking bokeh city lights, capturing her bare breasts, compact shaft, and slit reflected in the dark glass.",
  },
  {
    id: "SF17",
    title: "电梯不锈钢镜轿厢·楼层亮灯真空掀起",
    sub: "Stainless-Steel Elevator Cabin Floor-Panel Stealth",
    category: "2. 场所露出",
    canvas: "竖图 832x1216",
    camera_mode: "mirror",
    lighting_mode: "enclosed_indoor",
    light_badge: "🏢电梯冷光",
    light_tags: "cool white elevator lighting, overhead cabin light, metallic steel reflection",
    light_prose:
      "Cool white overhead elevator cabin light and glowing amber floor buttons reflect cleanly off the brushed stainless-steel mirror wall.",
    builtin_outfit: "unbuttoned white blouse, navy pleated skirt, 1.45::skirt lift::, no panties, white socks",
    framing_tags:
      "cowboy shot, 1.5::mirror selfie::, 1.45::holding phone::, smartphone, legs apart, nervous glance, heavy blush",
    env_tags: "1.6::elevator::, stainless steel wall, elevator buttons, glowing floor indicator, handrails",
    female_tags: "bare breasts, 1.3::nipples::, fingers parting pussy, 0.85::spread pussy::, pussy juice",
    femboy_tags: "1.4::small penis::, 1.3::small testicles::, testicles, erection, 1.35::precum::",
    futa_tags: "bare breasts, 1.3::nipples::, 1.4::small penis::, erection, 1.35::precum::, pussy",
    female_prose:
      "snapping a thrilling mirror selfie inside a brushed stainless-steel elevator cabin beside glowing floor buttons, glancing nervously at the door while exposing her glistening wet slit.",
    femboy_prose:
      "snapping a thrilling mirror selfie inside a brushed stainless-steel elevator cabin beside glowing floor buttons, glancing nervously at the door while exposing his erect small penis.",
    futa_prose:
      "snapping a thrilling mirror selfie inside a brushed stainless-steel elevator cabin beside glowing floor buttons, glancing nervously at the door while exposing her compact erect shaft and slit.",
  },
  {
    id: "SF18",
    title: "深夜公园铁网长椅·直打闪光灯敞衣蹲拍",
    sub: "Night Park Bench Chain-Link Fence Direct-Flash Squat",
    category: "2. 场所露出",
    canvas: "竖图 832x1216",
    camera_mode: "direct",
    lighting_mode: "flash",
    light_badge: "⚡夜园闪光",
    light_tags:
      "1.55::camera flash::, harsh direct flash lighting, stark flash falloff, dark night background, streetlight bokeh, 1.25::high contrast::",
    light_prose:
      "Harsh direct smartphone camera flash cuts starkly against the pitch-dark night park background with distant streetlight bokeh.",
    builtin_outfit: "oversized tracksuit jacket, 1.5::open jacket::, nude underneath, loose white socks, sneakers, black choker",
    framing_tags:
      "cowboy shot, 1.5::squatting::, 1.45::m legs::, squatting on bench, hands on knees, looking at viewer",
    env_tags: "outdoors, night, 1.45::park bench::, 1.45::chain-link fence::",
    female_tags: "bare breasts, 1.3::nipples::, pussy, 0.85::spread pussy::, pussy juice",
    femboy_tags: "1.4::small penis::, 1.3::small testicles::, testicles, erection, 1.4::precum::",
    futa_tags: "bare breasts, 1.3::nipples::, 1.4::small penis::, erection, 1.4::precum::, pussy",
    female_prose:
      "squatting wide-legged on a dark park bench beside a chain-link fence at night, starkly illuminated by harsh direct camera flash.",
    femboy_prose:
      "squatting wide-legged on a dark park bench beside a chain-link fence at night, revealing his flat chest and small erect penis under harsh direct camera flash.",
    futa_prose:
      "squatting wide-legged on a dark park bench beside a chain-link fence at night, revealing bare breasts, compact erect shaft, and wet slit under harsh direct camera flash.",
  },
  {
    id: "SF19",
    title: "电竞椅猫耳耳机·竖屏直播漂浮爱心UI",
    sub: "Gaming Chair Cat-Ear Headset Vertical Livestream UI",
    category: "4. 束缚与UI",
    canvas: "竖图 832x1216",
    camera_mode: "ui_livestream",
    lighting_mode: "night_neon",
    light_badge: "🟣霓虹环形灯",
    light_tags:
      "neon-lit bedroom, neon lights, pink and cyan neon glow, 1.4::ring light::, ring light reflection in pupils, 1.2::color contrast::",
    light_prose:
      "Bathed in pink-and-cyan gaming-room neon LEDs with a bright frontal ring-light casting circular catchlights in her pupils.",
    builtin_outfit: "cropped pastel hoodie, 1.45::clothes lift::, striped thighhighs, bottomless",
    framing_tags:
      "1.6::live stream interface::, 1.55::social media frame::, floating pink hearts, red live icon, 1.5::sitting::, 1.5::m legs::, wink, peace sign",
    env_tags: "pink gaming chair, led strip lights",
    core_prop_tags: "1.45::cat ear headphones::, pink headphones",
    female_tags: "bare breasts, 1.3::nipples::, pussy, 0.9::spread pussy::, pussy juice",
    femboy_tags: "1.4::small penis::, 1.3::small testicles::, testicles, erection, 1.45::precum::",
    futa_tags: "bare breasts, 1.3::nipples::, 1.4::small penis::, erection, 1.45::precum::, pussy",
    female_prose:
      "sitting spread-legged in a pink gaming chair wearing cat-ear headphones inside a vertical livestream interface with floating pink hearts and a red live indicator dot, winking with a peace sign.",
    femboy_prose:
      "sitting spread-legged in a pink gaming chair wearing cat-ear headphones inside a vertical livestream interface with floating pink hearts and a red live indicator dot, flat chest exposed and small shaft leaking precum.",
    futa_prose:
      "sitting spread-legged in a pink gaming chair wearing cat-ear headphones inside a vertical livestream interface with floating pink hearts and a red live indicator dot, bare breasts and compact shaft gleaming under the ring light.",
    allow_text_ui: true,
  },
  {
    id: "SF20",
    title: "透明亚克力浴凳穿拍·金色圣水弧线仰拍",
    sub: "Clear Acrylic Bath Stool Upward Golden Stream POV",
    category: "3. 奇特机位",
    canvas: "竖图 832x1216",
    camera_mode: "direct",
    lighting_mode: "steamy_glass",
    light_badge: "🚿浴室水雾",
    light_tags: "bright tiled bathroom light, humid mist, wet skin, water droplets, golden liquid speculars",
    light_prose:
      "Bright overhead Japanese bathroom light gleams through the clear acrylic stool and catches sparkling golden highlights along the arcing stream.",
    builtin_outfit: "wet unbuttoned shirt, wet clothes, bottomless",
    framing_tags:
      "1.65::from below::, 1.55::worm's-eye view::, 1.55::through glass::, clear acrylic bath stool, squatting on stool, groin focus, head at top, heavy blush, 1.65::peeing::, 1.55::urine::",
    env_tags: "tiled bathroom, japanese bathroom",
    female_tags: "bare breasts, 0.85::spread pussy::, urine stream, golden arc toward camera",
    femboy_tags: "1.4::small penis::, 1.3::small testicles::, peeing from penis, urine stream",
    futa_tags: "bare breasts, 1.4::small penis::, peeing from penis, urine stream, pussy",
    female_prose:
      "squatting wide-legged on a clear acrylic bath stool in a tiled Japanese bathroom while the camera looks straight up from the floor, blushing crimson as a glistening golden stream arcs downward.",
    femboy_prose:
      "squatting wide-legged on a clear acrylic bath stool in a tiled Japanese bathroom while the camera looks straight up from the floor, blushing crimson as a glistening golden stream arcs from his small penis.",
    futa_prose:
      "squatting wide-legged on a clear acrylic bath stool in a tiled Japanese bathroom while the camera looks straight up from the floor, blushing crimson as a golden stream arcs from her compact shaft above her slit.",
    extra_neg: "upside-down, inverted, head at bottom, legs at top",
    keep_wet_clothes: true,
  },
  {
    id: "SF21",
    title: "透明粉贞操笼锁精拉丝+锁骨挂钥匙对镜",
    sub: "Locked Pink Chastity Cage Drip + Key on Choker",
    category: "1. 对镜私拍",
    canvas: "竖图 832x1216",
    camera_mode: "mirror",
    lighting_mode: "indoor_natural",
    light_badge: "🏠卧室柔光",
    light_tags: "soft bedroom lighting, 1.2::backlighting::, glossy translucent plastic glint",
    light_prose:
      "Soft bedroom light catches crisp specular glints on the silver padlock key at her throat and the translucent pink chastity lock.",
    builtin_outfit: "frilly white maid apron, 1.45::apron lift::, open shirt, white garter thighhighs, bottomless",
    framing_tags:
      "cowboy shot, 1.5::mirror selfie::, 1.45::holding phone::, smartphone, standing, legs apart, shy teary blush, looking at mirror",
    env_tags: "indoors, bedroom, bedroom mirror",
    core_prop_tags: "lace choker, 1.45::key necklace::, small silver key on choker, padlock",
    female_tags: "bare breasts, 1.3::nipples::, 1.55::chastity belt::, pink translucent chastity shield, pussy juice",
    femboy_tags:
      "1.65::chastity cage::, pink translucent chastity cage, locked penis, 1.45::precum::, precum string, 1.3::small testicles::",
    futa_tags:
      "bare breasts, 1.3::nipples::, 1.65::chastity cage::, pink translucent chastity cage, 1.45::precum::, pussy",
    female_prose:
      "standing in front of a bedroom mirror with a tiny silver padlock key dangling from her lace choker, blushing shyly with a pink locked chastity shield over her wet crotch.",
    femboy_prose:
      "standing in front of a bedroom mirror with a tiny silver padlock key dangling from his lace choker, blushing tearfully as precum strings drip from a translucent pink chastity cage.",
    futa_prose:
      "standing in front of a bedroom mirror with a tiny silver padlock key dangling from her lace choker, a translucent pink chastity cage locked over her compact shaft above her wet slit.",
  },
  {
    id: "SF22",
    title: "站姿背影翘臀与全身镜正面双面同框",
    sub: "Standing Back-to-Camera Full-Mirror Front/Rear Sync",
    category: "1. 对镜私拍",
    canvas: "竖图 832x1216",
    camera_mode: "mirror",
    lighting_mode: "sunlit_indoor",
    light_badge: "☀️晴昼更衣室",
    light_tags: "sunlit dressing room, 1.2::sunlight::, warm window sidelighting, 1.25::backlighting::",
    light_prose:
      "Warm sunlit dressing-room window light rims her bare back and rounded buttocks while clearly illuminating her front reflection in the tall mirror.",
    builtin_outfit: "cropped open sweater on shoulders, bottomless, knee-high socks",
    framing_tags:
      "1.55::from behind::, standing facing mirror, legs apart, bare back, bare ass, 1.45::looking back::, 1.55::mirror selfie::, 1.55::mirror reflection::, 1.45::holding phone::, smartphone",
    env_tags: "indoors, large full-length wall mirror",
    female_tags: "1.4::pussy from behind::, bare breasts in mirror, pussy juice",
    femboy_tags: "1.3::small testicles::, balls between thighs, flat chest in mirror, 1.4::small penis::",
    futa_tags: "1.4::pussy from behind::, bare breasts in mirror, 1.4::small penis::, erection in mirror",
    female_prose:
      "standing bare-bottomed facing a tall sunlit dressing-room mirror and glancing back over her shoulder, framing her bare buttocks and rear slit in the foreground while her bare breasts and phone show in the mirror.",
    femboy_prose:
      "standing bare-bottomed facing a tall sunlit dressing-room mirror and glancing back over his shoulder, framing his bare buttocks in the foreground while his flat chest, small shaft, and phone show in the mirror.",
    futa_prose:
      "standing bare-bottomed facing a tall sunlit dressing-room mirror and glancing back over her shoulder, framing her bare buttocks and slit in the foreground while her bare breasts and compact shaft show in the mirror.",
    unblock_multiple_views: true,
  },
  {
    id: "SF23",
    title: "红口球流涎+银链乳夹拉扯受虐对镜",
    sub: "Red Ball-Gag Drool + Chained Nipple Clamps Mirror",
    category: "1. 对镜私拍",
    canvas: "竖图 832x1216",
    camera_mode: "mirror",
    lighting_mode: "enclosed_indoor",
    light_badge: "🕯️暗房微光",
    light_tags: "dim bedroom lighting, moody low-key indoor light, sharp speculars on gag and chain",
    light_prose:
      "Dim moody bedroom light casts deep intimate shadows while catching sharp wet glints on the glossy red ball gag, silver chain, and saliva.",
    builtin_outfit: "open leather harness, nude, black thighhighs",
    framing_tags:
      "cowboy shot, 1.5::mirror selfie::, 1.45::holding phone::, smartphone, trembling knees, legs apart, heart-shaped pupils, teary blush",
    env_tags: "indoors, dim bedroom, bedroom mirror",
    core_prop_tags: "1.6::ball gag::, glossy red ball gag, 1.45::drooling::, saliva trail, 1.6::nipple clamps::, silver chain",
    female_tags: "bare breasts, chain to clitoris, pussy, 0.85::spread pussy::, pussy juice, dripping",
    femboy_tags: "clamps on flat chest, chain to penis, 1.4::small penis::, 1.3::small testicles::, erection, precum",
    futa_tags: "bare breasts, chain to penis, 1.4::small penis::, erection, precum, pussy",
    female_prose:
      "trembling before a dim bedroom mirror wearing a glossy red ball gag with drooling saliva and silver-chained nipple clamps pulling tautly down toward her dripping slit.",
    femboy_prose:
      "trembling before a dim bedroom mirror wearing a glossy red ball gag with drooling saliva and silver-chained nipple clamps on his flat chest linked down to his small erect penis.",
    futa_prose:
      "trembling before a dim bedroom mirror wearing a glossy red ball gag with drooling saliva and silver-chained nipple clamps on her breasts linked down to her compact erect shaft.",
  },
  {
    id: "SF24",
    title: "汽车后排撕破黑丝开档·单腿高架伸臂拍",
    sub: "Car Leather Backseat Torn Black Pantyhose Selfie",
    category: "2. 场所露出",
    canvas: "竖图 832x1216",
    camera_mode: "direct",
    lighting_mode: "indoor_natural",
    light_badge: "🚗车窗侧光",
    light_tags: "car window sidelighting, diffused daylight through car window, nylon sheen",
    light_prose:
      "Diffused street daylight enters sideways through the car window across the dark leather seat and highlights the sheen of ripped black nylon.",
    builtin_outfit: "unbuttoned office blouse, pulled-down bra, 1.6::torn pantyhose::, ripped black pantyhose",
    femboy_outfit: "unbuttoned office shirt, open shirt, 1.6::torn pantyhose::, ripped black pantyhose",
    framing_tags:
      "1.5::selfie::, 1.45::pov::, 1.45::wide-angle lens::, reclining, 1.45::one leg up::, leg propped high, index finger raised, shushing, blush",
    env_tags: "1.6::car interior::, leather backseat, car window, blurry street outside",
    female_tags: "bare breasts, 1.3::nipples::, 0.95::spread pussy::, 1.45::creampie::, 1.65::cum in pussy::, cum overflow",
    femboy_tags: "1.4::small penis::, 1.3::small testicles::, erection, 1.45::after anal::, cumdrip",
    futa_tags: "bare breasts, 1.3::nipples::, 1.4::small penis::, erection, pussy, 1.45::creampie::, cum overflow",
    female_prose:
      "reclining in the leather backseat of a car with one leg propped high, holding a finger to her lips shushing as thick cum brims from her pussy through ripped black pantyhose.",
    femboy_prose:
      "reclining in the leather backseat of a car with one leg propped high and shirt unbuttoned over his flat chest, holding a finger to his lips as his small erect penis pokes through ripped black pantyhose.",
    futa_prose:
      "reclining in the leather backseat of a car with one leg propped high, holding a finger to her lips shushing as her compact erect shaft and cum-brimmed slit show through ripped black pantyhose.",
    prose_outfit_phrase: "through ripped black pantyhose",
    femboy_extra_neg: "bra",
  },
  {
    id: "SF25",
    title: "吸盘透明粉假阳具后入骑乘侧身对镜",
    sub: "Mirror-Mounted Clear Pink Suction-Cup Dildo Ride",
    category: "1. 对镜私拍",
    canvas: "竖图 832x1216",
    camera_mode: "mirror",
    lighting_mode: "indoor_natural",
    light_badge: "🏠镜面侧光",
    light_tags: "soft bedroom sidelighting, 1.25::backlighting::, translucent pink gel highlights",
    light_prose:
      "Clean bedroom rim-light shines through the single translucent pink suction-cup dildo and across her arched hips.",
    builtin_outfit: "cropped camisole, clothes lift, loose white socks, bottomless",
    framing_tags:
      "cowboy shot, 1.45::from side::, three-quarter view, 1.5::mirror selfie::, 1.45::holding phone::, smartphone, hand on mirror, arched back, looking at mirror",
    env_tags: "indoors, bedroom, full-length mirror",
    core_prop_tags: "1.6::suction cup dildo::, 1.5::clear dildo::, translucent pink dildo on mirror",
    female_tags: "bare breasts, 1.3::nipples::, 1.5::vaginal object insertion::, dildo in pussy, pussy juice",
    femboy_tags: "1.5::anal::, 1.5::anal object insertion::, dildo in ass, 1.4::small penis::, 1.4::precum::",
    futa_tags: "bare breasts, 1.3::nipples::, 1.5::vaginal object insertion::, pink dildo in pussy, 1.4::small penis::, 1.4::precum::",
    female_prose:
      "bracing one hand against a full-length bedroom mirror from a side-three-quarter angle, riding a single translucent pink suction-cup dildo stuck to the glass while filming her reflection.",
    femboy_prose:
      "bracing one hand against a full-length bedroom mirror from a side-three-quarter angle, backing onto a single translucent pink suction-cup dildo stuck to the glass while his small penis drips in front.",
    futa_prose:
      "bracing one hand against a full-length bedroom mirror from a side-three-quarter angle, backing her wet pussy onto a single translucent pink suction-cup dildo on the glass while her flesh-colored compact shaft drips in front.",
    extra_neg: "multiple dildos, two dildos, double dildo",
  },
  {
    id: "SF26",
    title: "温泉木更衣室浴巾滑落脚踝·冰牛奶瓶对镜",
    sub: "Onsen Wooden Locker Room Dropped-Towel & Milk Bottle",
    category: "1. 对镜私拍",
    canvas: "竖图 832x1216",
    camera_mode: "mirror",
    lighting_mode: "warm_spot",
    light_badge: "♨️温泉暖光",
    light_tags: "1.4::warm yellow lighting::, warm indoor lighting, bath steam, wet skin, rosy skin",
    light_prose:
      "Warm golden-yellow Japanese onsen locker-room light filters softly through rising steam across her flushed wet skin and cold glass bottle.",
    builtin_outfit: "completely nude",
    framing_tags:
      "cowboy shot, 1.5::mirror selfie::, 1.45::holding phone::, smartphone, standing, steam, shy blush",
    env_tags: "1.55::changing room::, wooden locker room, onsen, bamboo basket",
    core_prop_tags: "1.5::milk bottle::, glass bottle against chest, fallen bath towel at ankles",
    female_tags: "bare breasts, 1.3::nipples::, bottle between breasts, pussy, pussy juice",
    femboy_tags: "bottle against flat chest, 1.4::small penis::, 1.3::small testicles::, erection",
    futa_tags: "bare breasts, 1.3::nipples::, bottle against breasts, 1.4::small penis::, erection, pussy",
    female_prose:
      "standing in a steamy wooden Japanese onsen changing room with a white bath towel fallen around her ankles, pressing a cold glass milk bottle between her flushed breasts in the mirror.",
    femboy_prose:
      "standing in a steamy wooden Japanese onsen changing room with a white bath towel fallen around his ankles, pressing a cold glass milk bottle to his rosy flat chest in the mirror.",
    futa_prose:
      "standing in a steamy wooden Japanese onsen changing room with a white bath towel fallen around her ankles, pressing a cold glass milk bottle against her breasts with her rosy shaft gleaming below.",
    extra_neg: "towel covering crotch, towel around body",
  },
  {
    id: "SF27",
    title: "伸臂探后弯腰扶臀·超广角翘臀回眸自拍",
    sub: "Extended-Arm Behind-Hips Bent-Over Rear Peek",
    category: "3. 奇特机位",
    canvas: "竖图 832x1216",
    camera_mode: "direct",
    lighting_mode: "indoor_natural",
    light_badge: "🏠卧室柔光",
    light_tags: "soft bedroom window light, 1.25::backlighting::, rounded glute rim highlight",
    light_prose:
      "Soft bedroom rim-lighting outlines the curve of her raised buttocks with satin glow cushions and pinprick highlights.",
    builtin_outfit: "cropped sailor sweater, bare midriff, pleated microskirt, 1.45::skirt lift::, striped thighhighs, no panties",
    framing_tags:
      "1.55::from behind::, 1.55::bent over::, 1.6::ass focus::, 1.5::wide-angle lens::, 1.5::selfie::, 1.45::pov::, 1.45::foreshortening::, extended arm behind back, grabbing own ass, looking back, wink",
    env_tags: "indoors, bedroom",
    female_tags: "bare buttocks, 1.4::anus::, 1.45::pussy from behind::, pussy juice",
    femboy_tags: "bare buttocks, 1.4::anus::, 1.3::small testicles::, 1.4::small penis::, balls between thighs",
    futa_tags: "bare buttocks, 1.4::anus::, 1.45::pussy from behind::, 1.4::small penis::",
    female_prose:
      "bending forward in a bedroom while reaching one arm straight back toward the wide-angle camera, spreading a buttock cheek and winking back over her shoulder.",
    femboy_prose:
      "bending forward in a bedroom while reaching one arm straight back toward the wide-angle camera, spreading a buttock cheek to show his cute anus and small balls while winking back.",
    futa_prose:
      "bending forward in a bedroom while reaching one arm straight back toward the wide-angle camera, spreading a buttock cheek to show her anus, slit, and hanging compact shaft.",
    extra_neg: "selfie stick, rod, pole",
    allow_school_canon: true,
  },
  {
    id: "SF28",
    title: "圆框眼镜满脸白浊颜射·高机位比耶事后拍",
    sub: "Cum-Splattered Round Glasses Overhead V-Sign Selfie",
    category: "3. 奇特机位",
    canvas: "竖图 832x1216",
    camera_mode: "direct",
    lighting_mode: "indoor_natural",
    light_badge: "🏠室内清光",
    light_tags: "bright indoor bedroom light, glossy lens reflections, milky specular highlights",
    light_prose:
      "Clear overhead indoor light catches glossy reflections on her round eyeglass lenses and thick white splatters.",
    builtin_outfit: "torn white shirt, open shirt, bottomless, black thighhighs",
    framing_tags:
      "1.55::from above::, 1.5::high angle::, 1.5::selfie::, 1.45::pov::, 1.4::wide-angle lens::, extended arm, kneeling, spread legs, 1.45::peace sign::, tongue out",
    env_tags: "indoors, bedroom floor",
    core_prop_tags: "1.55::round glasses::, eyewear, 1.65::cum on glasses::, 1.6::cum on face::, 1.55::facial::",
    female_tags: "bare breasts, 1.3::nipples::, cum on breasts, pussy, cumdrip",
    femboy_tags: "cum on flat chest, 1.4::small penis::, 1.3::small testicles::, erection, cum on penis",
    futa_tags: "bare breasts, 1.3::nipples::, cum on breasts, 1.4::small penis::, erection, pussy, cumdrip",
    female_prose:
      "kneeling on the bedroom floor reaching one arm up for a high-angle selfie, flashing a playful peace sign with tongue out while thick white cum splatters across her round glasses, cheeks, and bare breasts.",
    femboy_prose:
      "kneeling on the bedroom floor reaching one arm up for a high-angle selfie, flashing a playful peace sign with tongue out while thick white cum splatters across his round glasses, cheeks, and flat chest.",
    futa_prose:
      "kneeling on the bedroom floor reaching one arm up for a high-angle selfie, flashing a playful peace sign with tongue out while thick white cum splatters across her round glasses, bare breasts, and compact shaft.",
  },
  {
    id: "SF29",
    title: "空教室木课桌下隐蔽仰拍·拉线无线跳蛋",
    sub: "Classroom Under-Desk Secret Wireless Vibrator POV",
    category: "2. 场所露出",
    canvas: "竖图 832x1216",
    camera_mode: "direct",
    lighting_mode: "sunlit_indoor",
    light_badge: "☀️课桌暗影",
    light_tags: "sunlit empty classroom, 1.2::sunlight::, afternoon window light above, shaded under-desk shadow",
    light_prose:
      "Warm afternoon classroom sunlight illuminates her upper body above the wooden desk while intimate shadow frames her thighs underneath.",
    builtin_outfit: "unbuttoned school blouse, loose ribbon, pleated skirt, white knee-high socks, no panties",
    framing_tags:
      "1.6::under table::, 1.6::from below::, low angle between thighs, sitting on chair, spread legs, biting lip, enduring blush",
    env_tags: "wooden school desk, school chair",
    core_prop_tags: "1.55::remote control vibrator::, pink vibrator cord",
    female_tags: "bare breasts, 1.6::vibrator in pussy::, pussy juice",
    femboy_tags: "1.5::anal object insertion::, vibrator in ass, 1.4::small penis::, 1.3::small testicles::, erection",
    futa_tags: "bare breasts, 1.6::vibrator in pussy::, 1.4::small penis::, erection, precum",
    female_prose:
      "sitting at a wooden desk in a sunlit empty classroom seen from a hidden low camera underneath, biting her lip above as a pink wireless vibrator cord dangles from her wet pussy.",
    femboy_prose:
      "sitting at a wooden desk in a sunlit empty classroom seen from a hidden low camera underneath, biting his lip above as a pink wireless plug cord dangles beside his erect small penis.",
    futa_prose:
      "sitting at a wooden desk in a sunlit empty classroom seen from a hidden low camera underneath, biting her lip above as a pink vibrator cord hangs from her pussy beneath her twitching compact shaft.",
    allow_school_canon: true,
  },
  {
    id: "SF30",
    title: "透明保鲜膜全身紧缚压震动棒·定时闪光拍",
    sub: "Glossy Clear Cling-Wrap Self-Bondage Timer Flash",
    category: "4. 束缚与UI",
    canvas: "竖图 832x1216",
    camera_mode: "direct",
    lighting_mode: "flash",
    light_badge: "⚡保鲜膜闪光",
    light_tags:
      "1.55::camera flash::, harsh direct flash lighting, 1.4::glossy highlights::, specular flash on plastic film, dark background, 1.25::high contrast::",
    light_prose:
      "Harsh direct camera flash reflects in sharp white streaks across taut layers of glossy transparent cling-wrap against a dark bedroom.",
    builtin_outfit: "completely nude",
    framing_tags:
      "cowboy shot, lying on bed, knees up, spread legs, head free, panting, teary blush",
    env_tags: "dim bedroom, dark bedsheet",
    core_prop_tags:
      "1.65::plastic wrap::, 1.6::cling wrap bondage::, clear plastic film around body, bound wrists, 1.55::wand vibrator::, pink vibrator under wrap",
    female_tags: "squished breasts under clear wrap, 1.3::nipples::, vibrator on pussy, pussy juice, condensation",
    femboy_tags: "clear wrap on flat chest, vibrator on penis, 1.4::small penis::, 1.3::small testicles::, 1.45::precum::",
    futa_tags: "squished breasts under clear wrap, 1.3::nipples::, vibrator between penis and pussy, 1.4::small penis::, pussy",
    female_prose:
      "wrapped tightly from chest to thighs in layers of glossy transparent plastic cling-wrap on a dark bedsheet under direct flash, a pink wand vibrator trapped snugly against her wet vulva beneath the clear film.",
    femboy_prose:
      "wrapped tightly across his flat chest and thighs in layers of glossy transparent plastic cling-wrap on a dark bedsheet under direct flash, a pink wand vibrator pinned against his small erect penis smearing precum inside the film.",
    futa_prose:
      "wrapped tightly from chest to thighs in layers of glossy transparent plastic cling-wrap on a dark bedsheet under direct flash, a pink wand vibrator pinned between her compact shaft and wet slit beneath the film.",
  },
];

export const OTHER_ACTION_TEMPLATES: Record<string, OtherActionTemplate> = Object.fromEntries(
  RAW_SF_ENTRIES.map((item) => {
    const combinedScene = [item.framing_tags, item.env_tags, item.light_tags, item.core_prop_tags || ""]
      .filter(Boolean)
      .join(", ");
    return [
      item.id,
      {
        ...item,
        scene_tags: combinedScene,
      },
    ];
  })
);

export const OTHER_ACTION_CHAPTERS: OtherActionChapter[] = RAW_SF_ENTRIES.map((item) => ({
  id: item.id,
  title: item.title,
  sub: item.sub,
  category: item.category,
  camera_mode: item.camera_mode,
  canvas: item.canvas,
}));
