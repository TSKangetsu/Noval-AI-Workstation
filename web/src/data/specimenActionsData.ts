// ============================================================================
// Restrained-Yandere Specimen Collection, Stocked-Fridge, Syringe-X-Ray &
// Speculum-Cervix-Pour Series Data (CV01..CV07 = 7 Scenes: 6 Solo + 1 Duo CV04)
// Calibrated for NovelAI V4.5 / V5 Full across 4 Gender Modes
// ============================================================================

export type SpecimenActionCategory = "15. 储精自注";

export interface SpecimenDuoMeta {
  partner_tags: string;
  expr_tags: string;
}

export interface RawSpecimenActionEntry {
  id: string;
  title: string;
  sub: string;
  category: SpecimenActionCategory;
  canvas: "竖图 832x1216";
  camera_mode: "direct";
  lighting_mode: "night_neon" | "warm_spot";
  is_nocturnal_fridge: boolean;
  is_foot_focus: boolean;
  builtin_xray: boolean;
  allow_speculum: boolean;
  light_badge: string;
  light_tags: string;
  light_prose: string;
  builtin_outfit: string;
  femboy_outfit: string;
  specimen_outfit_neg: string;
  framing_tags: string;
  env_tags: string;
  core_prop_tags: string;
  femboy_core_prop_tags: string;
  specimen_expr_tags: string;
  female_tags: string;
  femboy_tags: string;
  futa_tags: string;
  prose: string;
  extra_neg: string;
  specimen_duo?: SpecimenDuoMeta;
}

export const YANDERE_SPECIMEN_EXPR = "1.4::half-closed eyes::, 1.35::seductive smile::, 1.3::smirk::, 1.15::yandere::, subtle 1.15::heart-shaped pupils::, entranced dark-sweet gaze, soft crimson blush, faint secretive closed-lip smile";

export const SPECIMEN_YANDERE_GUARD_UC = "crazy smile, wide-eyed horror, drooling";

export const SPECIMEN_STOCKED_FRIDGE_GROCERY_UC = "bright sunlight, sunny sky, daytime, vegetables, lettuce, meat, fruit, milk carton, soda cans, beer bottles, juice box";

export const ALL_RAW_SPECIMEN_ENTRIES: RawSpecimenActionEntry[] = [
  {
    "id": "CV01",
    "title": "【原型测试·壹】病娇恍惚笑·满载白浊刻度注射器半管深入推注与内部透视",
    "sub": "Prototype I: Yandere Plunger-Syringe Half-Barrel Deep Push & Internal X-Ray",
    "category": "15. 储精自注",
    "canvas": "竖图 832x1216",
    "camera_mode": "direct",
    "lighting_mode": "warm_spot",
    "is_nocturnal_fridge": false,
    "is_foot_focus": false,
    "builtin_xray": true,
    "allow_speculum": false,
    "light_badge": "💉暖灯推注透视",
    "light_tags": "warm dim bedroom lamp light, glossy highlights on plastic syringe, and creamy white fluid",
    "light_prose": "",
    "builtin_outfit": "loose white off-shoulder camisole lifted above breasts, bare breasts, 1.3::nipples::, bottomless, no panties, bare legs",
    "femboy_outfit": "loose white off-shoulder camisole lifted, above flat chest, bottomless, no panties, bare legs",
    "specimen_outfit_neg": "skirt, pants, shorts, jeans, panties, bra, collared shirt",
    "framing_tags": "close cowboy shot, low upward frontal view reclining with 1.6::legs up:: spread wide, reaching down between thighs, holding syringe pointing straight upward, into opening",
    "env_tags": "indoors, bedroom bed, white sheets, tray of corked white-liquid vials beside hip",
    "core_prop_tags": "1.7::syringe:: pointed straight upward from below, upper half of the thick clear, graduated syringe barrel filled, with white cum buried deep upward, inside canal while right hand, below hooks the bottom flange, and thumb pushes the plunger rod upward, 1.65::x-ray::, 1.65::cross-section::",
    "femboy_core_prop_tags": "1.7::syringe:: pointed straight upward from below, upper half of the thick clear, graduated syringe barrel filled, with white cum buried deep upward, inside canal while right hand, below hooks the bottom flange, and thumb pushes the plunger rod upward, 1.65::x-ray::, 1.65::cross-section::",
    "specimen_expr_tags": "1.4::half-closed eyes::, 1.35::seductive smile::, 1.3::smirk::, 1.15::yandere::, subtle 1.15::heart-shaped pupils::, entranced dark-sweet gaze, soft crimson blush, faint secretive closed-lip smile",
    "female_tags": "1.5::spread pussy::, 1.65::object insertion::, anatomical lower-belly x-ray cross-section, showing the upper half of the, graduated plastic syringe barrel, inside the vaginal canal, pointing upward and squirting a thick, white jet directly up, into the uterus, 1.6::cum in uterus::, cum overflow",
    "femboy_tags": "1.5::spread anus::, x-ray cutaway showing syringe barrel, pointing upward inside canal injecting white cum, 1.4::small penis::",
    "futa_tags": "1.5::spread pussy::, 1.4::small penis::, x-ray cutaway showing syringe barrel, pointing upward inside slit injecting white, cum into womb",
    "prose": "Reclining with legs raised and a quiet entranced half-lidded smile, reaching down between her thighs to push the bottom plunger upward as the upper half of the clear graduated syringe barrel is seen inside the x-ray cutaway.",
    "extra_neg": "crazy smile, wide-eyed horror, drooling, graduated cylinder, beaker, test tube, open top cylinder, needle, sharp needle, metal needle, hypodermic needle, blood, arm injection, nurse"
  },
  {
    "id": "CV02",
    "title": "【原型测试·贰】深夜塞满白浊瓶的冰箱前病娇痴笑·单手掰开流入直立玻璃小瓶",
    "sub": "Prototype II: Yandere Spreading into Upright Glass Vial Before Stocked Fridge",
    "category": "15. 储精自注",
    "canvas": "竖图 832x1216",
    "camera_mode": "direct",
    "lighting_mode": "night_neon",
    "is_nocturnal_fridge": true,
    "is_foot_focus": true,
    "builtin_xray": false,
    "allow_speculum": false,
    "light_badge": "🧊深夜藏瓶冷光",
    "light_tags": "dark unlit kitchen at night, 1.65::open refrigerator:: casting cold white light across her bare thighs and glass bottles, strong chiaroscuro",
    "light_prose": "",
    "builtin_outfit": "loose white off-shoulder camisole slipped down, bare shoulders, bottomless, no panties, bare legs, 1.5::bare feet::",
    "femboy_outfit": "loose white off-shoulder camisole slipped down, bare shoulders, bottomless, no panties, bare legs, 1.5::bare feet::",
    "specimen_outfit_neg": "skirt, pants, shorts, jeans, panties, bra, collared shirt, socks, thighhighs",
    "framing_tags": "full body low frontal three-quarter shot squatting wide in 1.55::m legs:: directly in front of wide-open refrigerator door",
    "env_tags": "indoors, dark kitchen at night, wide-open refrigerator behind her with interior shelves densely packed with neat rows of dozens of corked clear 1.65::glass bottle::s all filled with opaque white liquid",
    "core_prop_tags": "left hand spreading open, above while right hand holds a, small upright open-mouth clear glass bottle, directly underneath groin, thick white stream pouring straight, into the upright bottle mouth without spilling, bottle half-full of white cum",
    "femboy_core_prop_tags": "left hand spreading open, above while right hand holds a, small upright open-mouth clear glass bottle, directly underneath groin, thick white stream pouring straight, into the upright bottle mouth without spilling, bottle half-full of white cum",
    "specimen_expr_tags": "1.4::half-closed eyes::, 1.35::seductive smile::, 1.3::smirk::, 1.15::yandere::, subtle 1.15::heart-shaped pupils::, entranced dark-sweet gaze, soft crimson blush, faint secretive closed-lip smile",
    "female_tags": "1.6::spread pussy::, fingers of left hand spreading wet, labia wide apart, 1.65::cum drip::, thick white cum streaming down, from spread opening straight, into the upright clear glass bottle, held directly below",
    "femboy_tags": "1.55::spread anus::, one hand spreading while other hand, holds upright glass bottle, underneath catching dripping white cum, 1.4::small penis::",
    "futa_tags": "1.6::spread pussy::, 1.4::small penis::, one hand spreading labia, while other hand holds upright glass, bottle underneath catching dripping white cum",
    "prose": "Squatting barefoot with a quiet entranced half-lidded smile before a glowing midnight refrigerator packed full of corked white-liquid glass bottles, using one hand to spread open while holding an upright glass vial underneath.",
    "extra_neg": "crazy smile, wide-eyed horror, drooling, bright sunlight, sunny sky, daytime, vegetables, lettuce, meat, fruit, milk carton, soda cans, beer bottles, juice box, bright sunlight, sunny sky, daytime, vegetables, lettuce, meat, fruit, milk carton, soda cans, beer bottles, juice box, spilled puddle on floor"
  },
  {
    "id": "CV03",
    "title": "【延伸设计·壹】病娇油性笔给刚接满的温热精液玻璃瓶写爱心日期编号归档",
    "sub": "Extension 1: Yandere Dating & Heart-Labeling Freshly Corked Cum Vial Beside Rack",
    "category": "15. 储精自注",
    "canvas": "竖图 832x1216",
    "camera_mode": "direct",
    "lighting_mode": "warm_spot",
    "is_nocturnal_fridge": false,
    "is_foot_focus": false,
    "builtin_xray": false,
    "allow_speculum": false,
    "light_badge": "🕯️台灯贴标归档",
    "light_tags": "dim desk lamp casting warm intimate, pool of light over glass vials, dark room behind",
    "light_prose": "",
    "builtin_outfit": "loose white off-shoulder camisole slipped off, one shoulder, bare breast peeking, bottomless, no panties, bare thighs",
    "femboy_outfit": "loose white off-shoulder camisole slipped off, one shoulder, flat chest peeking, bottomless, no panties, bare thighs",
    "specimen_outfit_neg": "skirt, pants, shorts, jeans, panties, bra, collared shirt",
    "framing_tags": "cowboy shot, frontal three-quarter view sitting W-style, with knees apart at wooden desk, holding a freshly corked glass bottle, up beside her blushing cheek",
    "env_tags": "indoors, dark bedroom desk crowded, with wooden test-tube racks, holding neat numbered rows of corked, clear glass vials filled, with white liquid",
    "core_prop_tags": "left hand holding a corked clear 1.65::glass bottle:: brimming with thick opaque white cum with a paper sticker label showing a drawn red heart, right hand uncapping a black marker, pen writing on the bottle label",
    "femboy_core_prop_tags": "left hand holding a corked clear 1.65::glass bottle:: brimming with thick opaque white cum with a paper sticker label showing a drawn red heart, right hand uncapping a black marker, pen writing on the bottle label",
    "specimen_expr_tags": "1.4::half-closed eyes::, 1.35::seductive smile::, 1.3::smirk::, 1.15::yandere::, subtle 1.15::heart-shaped pupils::, entranced dark-sweet gaze, soft crimson blush, faint secretive closed-lip smile",
    "female_tags": "1.45::aftermath::, glistening inner thighs with residual white 1.55::cum drip:: on desk pad while admiring the freshly bottled specimen",
    "femboy_tags": "1.45::aftermath::, residual white cum on thighs, while labeling freshly bottled glass vial, 1.4::small penis::",
    "futa_tags": "1.45::aftermath::, 1.4::small penis::, labeling freshly bottled glass vial of, white cum",
    "prose": "Sitting bottomless beside racks of numbered white-liquid vials, softly nuzzling a freshly corked glass bottle of white cum with a quiet half-lidded smile while writing a heart label on it with a black marker.",
    "extra_neg": "crazy smile, wide-eyed horror, drooling, bright sunlight, outdoor sky, hospital, lab coat"
  },
  {
    "id": "CV04",
    "title": "【延伸设计·贰】双人现场采集：微病娇半眯暗笑双手捧直立宽口玻璃罐在下方接取",
    "sub": "Extension 2: Duo Restrained Yandere Catching Downward Stream into Upright Wide-Mouth Jar",
    "category": "15. 储精自注",
    "canvas": "竖图 832x1216",
    "camera_mode": "direct",
    "lighting_mode": "night_neon",
    "is_nocturnal_fridge": true,
    "is_foot_focus": false,
    "builtin_xray": false,
    "allow_speculum": false,
    "light_badge": "🧊深夜藏瓶冷光",
    "light_tags": "dim nocturnal room lit by open, refrigerator cold glow behind, glossy highlights on clear glass jar",
    "light_prose": "",
    "builtin_outfit": "loose white off-shoulder camisole, single bare shoulder, cleavage, bare legs, no panties",
    "femboy_outfit": "loose white off-shoulder camisole, single bare shoulder, bare legs, no panties",
    "specimen_outfit_neg": "skirt, pants, shorts, jeans, panties, bra, collared shirt",
    "framing_tags": "cowboy shot, three-quarter view kneeling low, beside standing male partner on left, looking sideways at viewer, with a quiet half-lidded secretive smile",
    "env_tags": "indoors, kitchen at night beside open refrigerator, stocked with white bottles",
    "core_prop_tags": "both hands holding an upright wide-mouth clear 1.65::glass jar:: positioned directly underneath partner's glans, left fingers stroking shaft, above the jar rim, while thick white cum spurts downward, from tip through the top open, mouth into the bottom of the, upright glass jar",
    "femboy_core_prop_tags": "both hands holding an upright wide-mouth clear 1.65::glass jar:: positioned directly underneath partner's glans, left fingers stroking shaft, above the jar rim, while thick white cum spurts downward, from tip through the top open, mouth into the bottom of the, upright glass jar",
    "specimen_expr_tags": "1.4::half-closed eyes::, 1.35::seductive smile::, 1.3::smirk::, 1.15::yandere::, subtle 1.15::heart-shaped pupils::, entranced dark-sweet gaze, soft crimson blush, faint secretive closed-lip smile",
    "female_tags": "1.65::ejaculation::, white cum stream shooting downward, from tip above rim straight, into the open top mouth of, the upright glass jar, white cum pooling at bottom of jar",
    "femboy_tags": "1.65::ejaculation:: shooting downward into open top of upright glass jar, 1.4::small penis::",
    "futa_tags": "1.65::ejaculation:: shooting downward into open top of upright glass jar, 1.4::small penis::",
    "prose": "Kneeling beside a bottle-packed midnight fridge with a subtle half-lidded smile, holding an upright wide-mouth clear glass jar underneath his tip so thick white cum shoots downward through the open top rim into the jar.",
    "extra_neg": "crazy smile, wide-eyed horror, drooling, bright sunlight, sunny sky, daytime, vegetables, lettuce, meat, fruit, milk carton, soda cans, beer bottles, juice box, bright sunlight, sunny sky, vegetables, soda cans, severed, detached penis, graduated cylinder, tall cylinder, cum on face, penis inside bottle",
    "specimen_duo": {
      "partner_tags": "shirtless faceless male standing tall on, left side, intact penis above jar rim angled, downward toward open top of glass jar",
      "expr_tags": "1.4::half-closed eyes::, 1.35::seductive smile::, 1.3::smirk::, 1.15::yandere::, subtle 1.15::heart-shaped pupils::, entranced dark-sweet gaze, soft crimson blush, faint secretive closed-lip smile"
    }
  },
  {
    "id": "CV05",
    "title": "【延伸设计·叁】自注前准备：微病娇手捧精液玻璃瓶插入注射器向上拉杆抽吸装弹",
    "sub": "Extension 3: Holding Uncorked Cum Bottle & Pulling Syringe Plunger to Load",
    "category": "15. 储精自注",
    "canvas": "竖图 832x1216",
    "camera_mode": "direct",
    "lighting_mode": "night_neon",
    "is_nocturnal_fridge": true,
    "is_foot_focus": false,
    "builtin_xray": false,
    "allow_speculum": false,
    "light_badge": "🧊深夜藏瓶冷光",
    "light_tags": "dim room at night, cold white glow from open refrigerator, packed with white bottles behind, warm steam from mug on table",
    "light_prose": "",
    "builtin_outfit": "loose white off-shoulder camisole slipped off, one shoulder, cleavage, bare thighs, no panties",
    "femboy_outfit": "loose white off-shoulder camisole slipped off, one shoulder, bare thighs, no panties",
    "specimen_outfit_neg": "skirt, pants, shorts, jeans, panties, bra, collared shirt",
    "framing_tags": "close cowboy shot, frontal view seated at low table, holding glass bottle and syringe together, in front of chest",
    "env_tags": "indoors, night kitchen table, wide-open refrigerator stocked with white bottles behind, steaming warm water mug on table",
    "core_prop_tags": "left hand holding an upright uncorked clear 1.65::glass bottle:: half-full of opaque white cum at chest height while right hand holds a clear graduated plastic 1.7::syringe:: with its nozzle dipped down inside the bottle liquid, pulling the plunger rod upward to, draw white cum into the syringe barrel",
    "femboy_core_prop_tags": "left hand holding an upright uncorked clear 1.65::glass bottle:: half-full of opaque white cum at chest height while right hand holds a clear graduated plastic 1.7::syringe:: with its nozzle dipped down inside the bottle liquid, pulling the plunger rod upward to, draw white cum into the syringe barrel",
    "specimen_expr_tags": "1.4::half-closed eyes::, 1.35::seductive smile::, 1.3::smirk::, 1.15::yandere::, subtle 1.15::heart-shaped pupils::, entranced dark-sweet gaze, soft crimson blush, faint secretive closed-lip smile",
    "female_tags": "glistening bare thighs parted below table edge, residual cum on inner thigh",
    "femboy_tags": "1.4::small penis:: between parted thighs below table edge",
    "futa_tags": "1.4::small penis:: between parted thighs below table edge",
    "prose": "Seated before an open bottle-packed midnight fridge with a quiet half-lidded smile, holding an uncorked glass bottle of white cum in her left hand while dipping a clear plastic syringe tip inside and pulling the plunger upward.",
    "extra_neg": "crazy smile, wide-eyed horror, drooling, bright sunlight, sunny sky, daytime, vegetables, lettuce, meat, fruit, milk carton, soda cans, beer bottles, juice box, needle, sharp needle, metal needle, blood, bright sunlight, vegetables, nurse"
  },
  {
    "id": "CV06",
    "title": "【延伸设计·肆】深夜塞满白浊瓶的冰箱前拔开木塞·微病娇半眯眼轻啜玻璃小瓶白丝",
    "sub": "Extension 4: Uncorking & Gently Sipping Saved Cum Vial Before Stocked Midnight Fridge",
    "category": "15. 储精自注",
    "canvas": "竖图 832x1216",
    "camera_mode": "direct",
    "lighting_mode": "night_neon",
    "is_nocturnal_fridge": true,
    "is_foot_focus": false,
    "builtin_xray": false,
    "allow_speculum": false,
    "light_badge": "🧊深夜藏瓶冷光",
    "light_tags": "dark unlit kitchen at night, 1.65::open refrigerator:: casting cold white light across her face and rows of white glass bottles",
    "light_prose": "",
    "builtin_outfit": "loose white off-shoulder camisole slipped off, one shoulder, bare collarbone, cleavage, bottomless, bare thighs",
    "femboy_outfit": "loose white off-shoulder camisole slipped off, one shoulder, bare collarbone, bottomless, bare thighs",
    "specimen_outfit_neg": "skirt, pants, shorts, jeans, panties, bra, collared shirt",
    "framing_tags": "close cowboy shot standing directly before, wide-open refrigerator shelves, holding small glass vial delicately to, softly parted lips",
    "env_tags": "indoors, dark midnight kitchen, wide-open refrigerator behind her densely packed shelf-to-shelf with neat rows of corked clear 1.65::glass bottle::s filled with opaque white liquid",
    "core_prop_tags": "right hand holding an uncorked small, clear glass specimen vial tilted gently, against her lower lip, while left hand holds the tiny, cork between fingers, sipping thick white cum from the vial rim with a delicate white 1.5::cum string:: on glossy lips",
    "femboy_core_prop_tags": "right hand holding an uncorked small, clear glass specimen vial tilted gently, against his lower lip, while left hand holds the tiny, cork between fingers, sipping thick white cum from the vial rim with a delicate white 1.5::cum string:: on glossy lips",
    "specimen_expr_tags": "1.45::half-closed eyes::, subtle 1.15::heart-shaped pupils::, 1.15::yandere::, entranced dark-sweet sidelong gaze at viewer, soft crimson blush",
    "female_tags": "1.55::drinking:: thick white cum from small glass vial rim, 1.45::cum on lips::, glistening thighs below",
    "femboy_tags": "1.55::drinking:: thick white cum from small glass vial rim, 1.4::small penis::",
    "futa_tags": "1.55::drinking:: thick white cum from small glass vial rim, 1.4::small penis::",
    "prose": "Standing at midnight before a glowing open refrigerator packed with rows of white-filled glass bottles, holding a tiny cork in one hand while gently sipping white fluid from the rim of a small glass vial with half-closed entranced eyes.",
    "extra_neg": "crazy smile, wide-eyed horror, drooling, bright sunlight, sunny sky, daytime, vegetables, lettuce, meat, fruit, milk carton, soda cans, beer bottles, juice box, bright sunlight, sunny sky, daytime, vegetables, lettuce, meat, fruit, milk carton, soda cans, beer bottles, wine glass, wide open mouth"
  },
  {
    "id": "CV07",
    "title": "【延伸设计·伍】鸭嘴钳上下双叶撑开直视深处子宫口·微病娇倾倒玻璃瓶白浊直灌",
    "sub": "Extension 5: Cusco Bivalve Speculum Exposing Cervix & Pouring Cum from Glass Bottle",
    "category": "15. 储精自注",
    "canvas": "竖图 832x1216",
    "camera_mode": "direct",
    "lighting_mode": "warm_spot",
    "is_nocturnal_fridge": false,
    "is_foot_focus": false,
    "builtin_xray": false,
    "allow_speculum": true,
    "light_badge": "🔦暖光窥器直灌",
    "light_tags": "warm focused bedside lamp illuminating, inside the open speculum, and glossy white stream",
    "light_prose": "",
    "builtin_outfit": "loose white off-shoulder camisole lifted above breasts, bare breasts, 1.3::nipples::, bottomless, no panties, bare legs",
    "femboy_outfit": "loose white off-shoulder camisole lifted, above flat chest, bottomless, no panties, bare legs",
    "specimen_outfit_neg": "skirt, pants, shorts, jeans, panties, bra, collared shirt",
    "framing_tags": "close low-angle cowboy shot reclining back on white sheets with 1.65::legs up:: spread wide, looking down between thighs",
    "env_tags": "indoors, bedroom bed, white sheets, small tray of corked white-liquid glass, bottles beside hip",
    "core_prop_tags": "2.0::speculum::, 1.6::object insertion::, smooth transparent plastic gynecological speculum inserted, flush inside pussy holding vaginal walls, wide open, hinged squeeze-lever handle with thumbscrew angled, to one side, right hand tilting an uncorked clear 1.65::glass bottle:: of thick white cum above pouring a steady white stream inside onto the cervix",
    "femboy_core_prop_tags": "2.0::speculum::, 1.6::object insertion::, smooth transparent plastic medical speculum inserted, flush inside canal holding walls wide open, hinged squeeze-lever handle with thumbscrew angled, to one side, right hand tilting an uncorked clear 1.65::glass bottle:: of thick white cum above pouring a steady white stream inside deep inside",
    "specimen_expr_tags": "1.4::half-closed eyes::, 1.35::seductive smile::, 1.3::smirk::, 1.15::yandere::, subtle 1.15::heart-shaped pupils::, entranced dark-sweet gaze, soft crimson blush, faint secretive closed-lip smile",
    "female_tags": "1.75::cervix::, 1.5::spread pussy::, round pink cervical opening clearly visible, deep inside through the open speculum, thick white cum pouring, from tilted glass bottle, onto the exposed pink cervix, 1.55::cum inside::",
    "femboy_tags": "1.9::speculum::, 1.55::object insertion:: inserted flush inside holding opening wide while pouring white cum from glass bottle, 1.4::small penis::",
    "futa_tags": "1.9::speculum::, 1.55::object insertion::, 1.7::cervix:: visible inside open speculum while pouring white cum from glass bottle, 1.4::small penis::",
    "prose": "Reclining with legs raised and a quiet half-lidded smile, a smooth transparent medical speculum inserted flush inside holding the opening wide to clearly expose the pink cervix within as she tilts an uncorked clear glass bottle pouring white fluid onto the cervix.",
    "extra_neg": "crazy smile, wide-eyed horror, drooling, syringe, needle, blood, hospital gown, surgical mask, gloves, strainer, colander, pot, funnel, bowl, spoon, scoop, shovel, wrench, claw, prongs, fork, two side handles, tongs"
  }
];
