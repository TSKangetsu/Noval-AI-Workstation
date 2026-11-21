// Auto-synced from housework_distraction_data.ts (15 Unified Naked-Apron Housework Distraction Scenes: HWD01..HWD15)
export type HouseworkActionCategory = "17. 家务干扰";

export type HouseworkLightMode =
  | "sunlit_living_dust"
  | "sunny_balcony_breeze"
  | "hallway_wood_sheen"
  | "warm_bedroom_lamp"
  | "closet_dim_warm";

export interface HouseworkDuoMeta {
  apron_detail: string;
  partner_tags: string;
  expr_tags: string;
  is_yuri_showcase?: boolean;
}

export interface RawHouseworkActionEntry {
  id: string;
  title: string;
  sub: string;
  category: HouseworkActionCategory;
  canvas: string;
  housework_light_mode: HouseworkLightMode;
  light_badge: string;
  light_tags: string;
  light_prose: string;
  barefoot: boolean;
  is_foot_focus: boolean;
  chest_covered: boolean;
  unblock_prop_shirt: boolean;
  unblock_prop_jacket: boolean;
  framing_tags: string;
  env_tags: string;
  core_prop_tags: string;
  female_tags: string;
  femboy_tags: string;
  futa_tags: string;
  prose: string;
  extra_neg: string;
  duo: HouseworkDuoMeta;
}

export const HOUSEWORK_LIGHT_DEFAULTS: Record<
  HouseworkLightMode,
  { badge: string; pos: string; prose: string }
> = {
  "sunlit_living_dust": {
    "badge": "☀️客厅微尘暖光",
    "pos": "bright sunlit living room, floating dust motes in golden sunbeams",
    "prose": "bathed in warm sunlit living-room beams with floating golden dust motes."
  },
  "sunny_balcony_breeze": {
    "badge": "🌤️晴风阳台透光",
    "pos": "bright breezy summer balcony sunlight, translucent light through hanging white sheet",
    "prose": "lit by breezy summer balcony daylight filtering softly through crisp white fabric."
  },
  "hallway_wood_sheen": {
    "badge": "🪵走廊湿木反光",
    "pos": "warm apartment corridor light, glossy wet reflections on freshly mopped floor",
    "prose": "illuminated by warm indoor corridor light gleaming across wet floor reflections."
  },
  "warm_bedroom_lamp": {
    "badge": "🛏️卧室柔暖床光",
    "pos": "warm cozy bedroom afternoon light, crisp white cotton sheet highlights",
    "prose": "glowing under cozy afternoon bedroom light across crisp white cotton sheets."
  },
  "closet_dim_warm": {
    "badge": "🚪衣帽间暖射灯",
    "pos": "warm recessed walk-in closet ceiling spotlight, cozy soft shadows among hanging clothes",
    "prose": "lit by a warm recessed walk-in closet spotlight casting soft shadows among hanging clothes."
  }
};

export const ALL_RAW_HOUSEWORK_ENTRIES: RawHouseworkActionEntry[] = [
  {
    "id": "HWD01",
    "title": "双手推无线吸尘器吸客厅绒毯·弓背颤抖站立后入",
    "sub": "Naked-Apron Vacuuming Living Room Rug Interrupted from Behind",
    "category": "17. 家务干扰",
    "canvas": "竖图 832x1216",
    "housework_light_mode": "sunlit_living_dust",
    "light_badge": "☀️客厅微尘暖光",
    "light_tags": "bright sunlit living room, floating dust motes in sunbeams",
    "light_prose": "bathed in warm sunlit living-room beams with floating golden dust motes.",
    "barefoot": false,
    "is_foot_focus": false,
    "chest_covered": false,
    "unblock_prop_shirt": false,
    "unblock_prop_jacket": false,
    "framing_tags": "cowboy shot, side-rear three-quarter view leaning forward mid-stride, 1.5::standing sex::, 1.5::from behind::",
    "env_tags": "indoors, modern living room, soft beige carpet rug, sofa and coffee table in background",
    "core_prop_tags": "both hands tightly gripping the handle of a sleek upright cordless 1.65::vacuum cleaner:: mid-push across the rug, struggling not to let go of, the vacuum wand",
    "female_tags": "1.55::vaginal::, insertion, glistening 1.5::cum overflow:: running down thigh",
    "femboy_tags": "1.55::anal::, 1.4::small penis:: dripping onto rug",
    "futa_tags": "1.5::vaginal::, 1.4::small penis:: dripping onto rug",
    "prose": "Pushing an upright cordless vacuum cleaner across a sunlit living room rug in only a white frilly naked apron, clutching the handle tightly to keep vacuuming during rear interruption.",
    "extra_neg": "",
    "duo": {
      "apron_detail": "white apron bow on lower back, apron skirt flipped up, bare buttocks, sideboob",
      "partner_tags": "shirtless faceless male standing flush, behind gripping waist",
      "expr_tags": "1.5::endurance::, biting lower lip fiercely, crimson blush, teary eyes looking down at vacuum",
      "is_yuri_showcase": false
    }
  },
  {
    "id": "HWD02",
    "title": "晴日阳台双臂高举夹衣夹晾湿床单·白布掩护贴身后入",
    "sub": "Naked-Apron Hanging Wet Laundry on Sunny Balcony Clothesline",
    "category": "17. 家务干扰",
    "canvas": "竖图 832x1216",
    "housework_light_mode": "sunny_balcony_breeze",
    "light_badge": "🌤️晴风阳台透光",
    "light_tags": "bright breezy summer balcony sunlight, translucent sunlight glowing through hanging white sheet",
    "light_prose": "lit by breezy summer balcony daylight filtering softly through crisp white fabric.",
    "barefoot": true,
    "is_foot_focus": true,
    "chest_covered": false,
    "unblock_prop_shirt": false,
    "unblock_prop_jacket": false,
    "framing_tags": "cowboy shot, three-quarter rear-side view reaching both arms, overhead toward clothesline, 1.5::standing sex::, 1.5::from behind::",
    "env_tags": "apartment balcony behind billowing wet white, laundry sheet, plastic laundry basket at feet",
    "core_prop_tags": "1.55::laundry::, both hands raised high clipping blue plastic 1.55::clothespin::s onto a damp white sheet on overhead clothesline, extra clothespins held between lips",
    "female_tags": "1.55::vaginal::, insertion, cum dripping down bare inner thigh",
    "femboy_tags": "1.55::anal::, 1.4::small penis:: twitching beneath open apron",
    "futa_tags": "1.5::vaginal::, 1.4::small penis:: twitching beneath open apron",
    "prose": "Reaching barefoot up to a sunny balcony clothesline in a white frilly naked apron to pin up a damp white sheet while hidden behind the billowing laundry during rear contact.",
    "extra_neg": "",
    "duo": {
      "apron_detail": "untied side-open white frilly apron, bare back, sideboob, bare legs, 1.5::bare feet::",
      "partner_tags": "shirtless faceless male hidden, behind the hanging sheet pressing flush, against hips",
      "expr_tags": "blushing panic peeking past sheet edge, muffled breath with clothespin at lips, teary eyes",
      "is_yuri_showcase": false
    }
  },
  {
    "id": "HWD03",
    "title": "木地板走廊双手紧拄长杆拖把打滑·拧腰站立后入",
    "sub": "Naked-Apron Mopping Polished Wooden Hallway Floor",
    "category": "17. 家务干扰",
    "canvas": "竖图 832x1216",
    "housework_light_mode": "hallway_wood_sheen",
    "light_badge": "🪵走廊湿木反光",
    "light_tags": "warm afternoon light reflecting off wet, freshly mopped wooden floorboards",
    "light_prose": "illuminated by warm indoor corridor light gleaming across wet floor reflections.",
    "barefoot": true,
    "is_foot_focus": true,
    "chest_covered": false,
    "unblock_prop_shirt": false,
    "unblock_prop_jacket": false,
    "framing_tags": "full body three-quarter rear-side view leaning, forward on long mop pole, 1.5::standing sex::, 1.5::from behind::, wide trembling stance",
    "env_tags": "indoors, polished wooden hallway floor, blue plastic mop bucket, with soapy water nearby",
    "core_prop_tags": "both hands clutching the long pole of a wet floor 1.65::mop:: as a crutch so she does not slip on the wet wooden floor, wet mop head on floor",
    "female_tags": "1.55::vaginal::, insertion, 1.5::cum drip:: onto wet wooden floor",
    "femboy_tags": "1.55::anal::, 1.4::small penis:: dripping onto wet wooden floor",
    "futa_tags": "1.5::vaginal::, 1.4::small penis:: dripping onto wet wooden floor",
    "prose": "Barefoot on a wet freshly mopped wooden hallway floor in a slipped white frilly naked apron, clutching the long mop handle for balance during rear thrusting.",
    "extra_neg": "",
    "duo": {
      "apron_detail": "white frilly naked apron slipped off, one shoulder, back bow, bare buttocks, 1.5::bare feet::",
      "partner_tags": "shirtless faceless male standing, behind holding hips steady",
      "expr_tags": "flustered crimson blush, eyes squeezed half-shut, open gasping mouth",
      "is_yuri_showcase": false
    }
  },
  {
    "id": "HWD04",
    "title": "书房踮起脚尖高举白鸡毛掸扫顶层书架·托腰顶入",
    "sub": "Naked-Apron Tiptoe Feather-Dusting High Study Bookshelf",
    "category": "17. 家务干扰",
    "canvas": "竖图 832x1216",
    "housework_light_mode": "sunlit_living_dust",
    "light_badge": "☀️客厅微尘暖光",
    "light_tags": "warm sunlit study room, sparkling dust particles floating in golden light",
    "light_prose": "bathed in warm sunlit living-room beams with floating golden dust motes.",
    "barefoot": false,
    "is_foot_focus": false,
    "chest_covered": true,
    "unblock_prop_shirt": false,
    "unblock_prop_jacket": false,
    "framing_tags": "full body side-frontal three-quarter view, stretching high on 1.55::tiptoes:: with right arm extended upward, 1.5::standing sex::, 1.45::from behind::",
    "env_tags": "indoors, home library study, tall wooden 1.55::bookshelf:: packed with hardcover books",
    "core_prop_tags": "right hand raised high holding a fluffy white 1.65::feather duster:: brushing the top bookshelf ledge, left hand bracing on shelf",
    "female_tags": "1.55::vaginal::, insertion, deep upward thrusting, cum overflow",
    "femboy_tags": "1.55::anal::, 1.4::small penis:: pressed against bookshelf",
    "futa_tags": "1.5::vaginal::, 1.4::small penis:: dripping onto thighhighs",
    "prose": "Stretched high on tiptoes in a white frilly naked apron with the front bib covering her chest and sideboob peeking at the side, holding a fluffy feather duster up to a tall study bookshelf while lifted from behind.",
    "extra_neg": "",
    "duo": {
      "apron_detail": "intact apron bib covering front chest, 1.45::sideboob::, bare shoulders, apron bow on lower back, white thighhighs",
      "partner_tags": "tall shirtless faceless male standing flush, behind lifting her waist, onto tiptoes",
      "expr_tags": "arched neck, breathless crimson blush, teary eyes glancing down, biting lip",
      "is_yuri_showcase": false
    }
  },
  {
    "id": "HWD05",
    "title": "蒸汽熨衣板前手握热熨斗悬停怕烫坏衬衫·咬唇忍耐后入",
    "sub": "Naked-Apron Steam-Ironing Dress Shirt Hovering Hot Iron",
    "category": "17. 家务干扰",
    "canvas": "竖图 832x1216",
    "housework_light_mode": "sunlit_living_dust",
    "light_badge": "☀️客厅微尘暖光",
    "light_tags": "warm morning room light, puffs of white steam rising from, hot clothes iron",
    "light_prose": "bathed in warm sunlit living-room beams with floating golden dust motes.",
    "barefoot": false,
    "is_foot_focus": false,
    "chest_covered": false,
    "unblock_prop_shirt": true,
    "unblock_prop_jacket": false,
    "framing_tags": "cowboy shot, three-quarter side view bent slightly, over ironing board, 1.5::standing sex::, 1.5::from behind::",
    "env_tags": "indoors, laundry corner, padded 1.6::ironing board:: at waist height, folded shirts stack",
    "core_prop_tags": "crisp white dress shirt laid flat, on ironing board, right hand gripping a steaming electric clothes 1.6::iron:: held trembling just above the shirt fabric trying not to scorch it, left hand steadying board edge",
    "female_tags": "1.55::vaginal::, insertion, fondling breast from behind, cum drip",
    "femboy_tags": "1.55::anal::, 1.4::small penis::, nip-play on flat chest",
    "futa_tags": "1.5::vaginal::, 1.4::small penis:: dripping under ironing board",
    "prose": "Standing at an ironing board in a white frilly naked apron desperately holding a steaming hot clothes iron inches above a crisp shirt so it will not scorch during rear interruption.",
    "extra_neg": "waffle iron, frying pan, stove",
    "duo": {
      "apron_detail": "loose neck strap, sideboob, white apron bow on lower back, apron skirt flipped up",
      "partner_tags": "shirtless faceless male behind gripping hip, and fondling breast",
      "expr_tags": "1.6::endurance::, panicked teary eyes staring at hot iron, tightly bitten lip, heavy sweatdrops",
      "is_yuri_showcase": false
    }
  },
  {
    "id": "HWD06",
    "title": "高层落地窗手握喷壶抹布擦玻璃·贴窗挤压防窗外察觉",
    "sub": "Naked-Apron Wiping Floor-to-Ceiling Window Glass with Spray Bottle",
    "category": "17. 家务干扰",
    "canvas": "竖图 832x1216",
    "housework_light_mode": "sunny_balcony_breeze",
    "light_badge": "🌤️晴风阳台透光",
    "light_tags": "bright daylight streaming through tall clear, glass window, glistening water mist on pane",
    "light_prose": "lit by breezy summer balcony daylight filtering softly through crisp white fabric.",
    "barefoot": false,
    "is_foot_focus": false,
    "chest_covered": false,
    "unblock_prop_shirt": false,
    "unblock_prop_jacket": false,
    "framing_tags": "cowboy shot, three-quarter frontal-side view seen closely, against clear glass pane, 1.5::standing sex::, 1.5::against glass::, 1.45::one leg up::",
    "env_tags": "indoors, high-rise apartment floor-to-ceiling window, blurred distant city skyline outside",
    "core_prop_tags": "left hand holding a blue window-cleaner 1.55::spray bottle:: while right hand presses a yellow microfiber cleaning cloth wiping water mist across the glass pane, bare breasts squished softly against glass",
    "female_tags": "1.55::vaginal::, standing leg lift against window, cum dripping down thighhighs",
    "femboy_tags": "1.55::anal::, flat chest pressed against glass, 1.4::small penis::",
    "futa_tags": "1.5::vaginal::, 1.4::small penis:: pressed against glass",
    "prose": "Pressed against a sunlit floor-to-ceiling apartment window in a white frilly naked apron while holding a blue spray bottle and yellow wiping cloth mid-chore.",
    "extra_neg": "",
    "duo": {
      "apron_detail": "white frilly naked apron shifted aside, against glass, white thighhighs",
      "partner_tags": "shirtless faceless male pressing from, behind against the window glass",
      "expr_tags": "1.55::embarrassed::, crimson blush, nervous teary glance down past window glass, foggy breath on pane",
      "is_yuri_showcase": false
    }
  },
  {
    "id": "HWD07",
    "title": "地毯叠刚烘干的温热毛巾摞·怀抱叠衣遮胸正骑乘",
    "sub": "Naked-Apron Folding Warm Fresh Towels Seated Straddle",
    "category": "17. 家务干扰",
    "canvas": "竖图 832x1216",
    "housework_light_mode": "warm_bedroom_lamp",
    "light_badge": "🛏️卧室柔暖床光",
    "light_tags": "cozy warm living-room sunlight, soft fabric textures",
    "light_prose": "glowing under cozy afternoon bedroom light across crisp white cotton sheets.",
    "barefoot": false,
    "is_foot_focus": false,
    "chest_covered": false,
    "unblock_prop_shirt": true,
    "unblock_prop_jacket": false,
    "framing_tags": "cowboy shot, frontal three-quarter view, 1.55::girl on top::, 1.5::straddling:: partner seated on soft rug",
    "env_tags": "indoors, cozy carpeted floor, woven wicker 1.55::laundry basket:: brimming with clean clothes, half-toppled stack of folded pastel towels",
    "core_prop_tags": "both hands clutching a freshly folded, fluffy white towel mid-fold, against chest trying not, to drop the laundry",
    "female_tags": "1.55::vaginal::, cowgirl position, insertion, 1.55::cum overflow::",
    "femboy_tags": "1.55::anal::, cowgirl position, 1.4::small penis::",
    "futa_tags": "1.5::vaginal::, cowgirl position, 1.4::small penis::",
    "prose": "Straddling on a soft rug beside an overflowing wicker laundry basket in a white frilly naked apron, still clutching a freshly folded white towel in both hands mid-chore.",
    "extra_neg": "",
    "duo": {
      "apron_detail": "white frilly naked apron bunched around waist, bare shoulders, sideboob, white thighhighs",
      "partner_tags": "shirtless faceless male seated, on rug gripping bare hips from below",
      "expr_tags": "flustered teary blush, trembling pout, trying to keep folding towel",
      "is_yuri_showcase": false
    }
  },
  {
    "id": "HWD08",
    "title": "玄关地砖四肢跪趴拧湿抹布擦地·翘臀蝴蝶结俯压后入",
    "sub": "Naked-Apron Hands-and-Knees Scrubbing Entryway Floor Tiles",
    "category": "17. 家务干扰",
    "canvas": "竖图 832x1216",
    "housework_light_mode": "hallway_wood_sheen",
    "light_badge": "🪵走廊湿木反光",
    "light_tags": "soft indoor entryway light, wet glossy reflections on clean ceramic, floor tiles",
    "light_prose": "illuminated by warm indoor corridor light gleaming across wet floor reflections.",
    "barefoot": true,
    "is_foot_focus": true,
    "chest_covered": false,
    "unblock_prop_shirt": false,
    "unblock_prop_jacket": false,
    "framing_tags": "full body low three-quarter rear-side view, 1.6::all fours:: kneeling on floor scrubbing tiles, 1.55::from behind::, 1.5::ass focus::",
    "env_tags": "indoors, Japanese home entryway genkan, neat pair of house slippers by step, small blue water bucket",
    "core_prop_tags": "right hand pressing a folded wet, white cleaning rag scrubbing the floor, tiles while left palm braces, on wet tile",
    "female_tags": "1.55::vaginal::, doggystyle, insertion, cum dripping onto clean tiles",
    "femboy_tags": "1.55::anal::, doggystyle, 1.4::small penis:: and 1.3::small testicles:: dripping clear drops onto floor tiles",
    "futa_tags": "1.5::vaginal::, doggystyle, 1.4::small penis:: dripping onto tiles",
    "prose": "Down on hands and knees barefoot in the tiled home entryway wearing only a white frilly naked apron, trying to keep scrubbing the floor with a wet rag during rear entry.",
    "extra_neg": "",
    "duo": {
      "apron_detail": "white frilly naked apron, with big back bow above bare buttocks, bare back, 1.5::bare feet::",
      "partner_tags": "shirtless faceless male kneeling behind gripping hips",
      "expr_tags": "looking back over shoulder, burning blush, teary eyes, biting lip",
      "is_yuri_showcase": false
    }
  },
  {
    "id": "HWD09",
    "title": "换铺大床洁白床单双手拽紧床角包边·扶腰俯压后入（横图）",
    "sub": "Naked-Apron Tucking Fitted Bedsheet Over Mattress Corner (Wide)",
    "category": "17. 家务干扰",
    "canvas": "横图 1216x832",
    "housework_light_mode": "warm_bedroom_lamp",
    "light_badge": "🛏️卧室柔暖床光",
    "light_tags": "warm sunlit bedroom morning light, crisp white cotton sheet highlights",
    "light_prose": "glowing under cozy afternoon bedroom light across crisp white cotton sheets.",
    "barefoot": false,
    "is_foot_focus": false,
    "chest_covered": false,
    "unblock_prop_shirt": false,
    "unblock_prop_jacket": false,
    "framing_tags": "wide cowboy shot, three-quarter side view leaning low, across unmade mattress corner, 1.5::bent over::, 1.5::from behind::",
    "env_tags": "indoors, sunlit bedroom, exposed striped mattress corner being covered, with a fresh white bedsheet",
    "core_prop_tags": "both of her hands visibly gripping, and pulling the crisp white bedsheet, corner taut to wrap it around, the exposed mattress corner, struggling to finish making the bed",
    "female_tags": "1.55::vaginal::, rear entry over bed edge, insertion, 1.55::cum overflow::",
    "femboy_tags": "1.55::anal::, rear entry over bed edge, 1.4::small penis::",
    "futa_tags": "1.5::vaginal::, rear entry over bed edge, 1.4::small penis::",
    "prose": "Leaning over an exposed sunlit mattress corner in a white frilly naked apron, using both hands to pull a fresh white fitted bedsheet taut around the mattress corner while gripped by the waist from behind.",
    "extra_neg": "letterboxed, pillarboxed, black bars",
    "duo": {
      "apron_detail": "white frilly naked apron with back bow, apron skirt flipped up, sideboob, white thighhighs",
      "partner_tags": "shirtless faceless male behind gripping both, of her bare hips",
      "expr_tags": "looking down at mattress corner, breathless crimson blush, biting lower lip, teary eyes",
      "is_yuri_showcase": false
    }
  },
  {
    "id": "HWD10",
    "title": "绿植花架前双手端长嘴浇水壶手抖浇歪·高抬单腿侧后入",
    "sub": "Naked-Apron Watering Potted Plants Spilling Watering Can",
    "category": "17. 家务干扰",
    "canvas": "竖图 832x1216",
    "housework_light_mode": "sunny_balcony_breeze",
    "light_badge": "🌤️晴风阳台透光",
    "light_tags": "dappled green sunlit conservatory balcony, sparkling splashed water droplets",
    "light_prose": "lit by breezy summer balcony daylight filtering softly through crisp white fabric.",
    "barefoot": true,
    "is_foot_focus": true,
    "chest_covered": true,
    "unblock_prop_shirt": false,
    "unblock_prop_jacket": false,
    "framing_tags": "cowboy shot, three-quarter frontal-side view standing beside plant stand with 1.55::one leg up::, 1.5::standing sex::",
    "env_tags": "indoors, sunlit balcony sunroom, wooden tiered stand of lush green 1.55::potted plant::s and ferns",
    "core_prop_tags": "both trembling hands holding a mint-green long-spout 1.65::watering can:: tilting crookedly, 1.55::spilling water:: splashing clear streams past the flowerpots onto floor and thighs",
    "female_tags": "1.55::vaginal::, standing leg lift, insertion, cum drip",
    "femboy_tags": "1.55::anal::, standing leg lift, 1.4::small penis::",
    "futa_tags": "1.5::vaginal::, standing leg lift, insertion, 1.45::ejaculation:: spurting white arcs alongside spilled water",
    "prose": "Standing barefoot beside sunlit potted plants in a white frilly naked apron covering her front chest with soft sideboob showing at the side, trembling hands tilting a long-spout watering can crookedly as water splashes past the pots during leg-up rear contact.",
    "extra_neg": "",
    "duo": {
      "apron_detail": "intact apron bib covering front chest, 1.45::sideboob::, bare shoulders, apron skirt lifted high at waist, 1.5::bare feet::",
      "partner_tags": "shirtless faceless male standing, behind lifting one bare thigh",
      "expr_tags": "flustered blush watching water miss the pot, open gasping mouth, teary eyes",
      "is_yuri_showcase": false
    }
  },
  {
    "id": "HWD11",
    "title": "俯身擦拭透明矮玻璃茶几·裸乳压贴桌面水痕后入",
    "sub": "Naked-Apron Bent Over Wiping Clear Glass Coffee Table",
    "category": "17. 家务干扰",
    "canvas": "竖图 832x1216",
    "housework_light_mode": "sunlit_living_dust",
    "light_badge": "☀️客厅微尘暖光",
    "light_tags": "bright living room window light, glossy reflections on clear glass tabletop",
    "light_prose": "bathed in warm sunlit living-room beams with floating golden dust motes.",
    "barefoot": false,
    "is_foot_focus": false,
    "chest_covered": false,
    "unblock_prop_shirt": false,
    "unblock_prop_jacket": false,
    "framing_tags": "cowboy shot, low three-quarter frontal-side view bent low across a clear 1.6::glass table::, 1.5::bent over::, 1.5::from behind::",
    "env_tags": "indoors, modern living room, low rectangular clear glass coffee table, sofa behind",
    "core_prop_tags": "right hand wiping the clear glass, tabletop with a damp blue cleaning, cloth while bare breasts, under her loose apron squish softly, against the transparent glass surface",
    "female_tags": "1.55::vaginal::, bent over sex, insertion, cum dripping down thighs",
    "femboy_tags": "1.55::anal::, bent over glass table, 1.4::small penis::",
    "futa_tags": "1.5::vaginal::, bent over glass table, 1.4::small penis::",
    "prose": "Bent low across a clear glass living-room coffee table in a loose white frilly naked apron, wiping the glass with a blue cloth while her chest presses softly onto the tabletop.",
    "extra_neg": "",
    "duo": {
      "apron_detail": "loose white frilly naked apron hanging, down onto glass table, back bow, white thighhighs",
      "partner_tags": "shirtless faceless male standing, behind gripping bare hips",
      "expr_tags": "blushing cheek near glass tabletop, misty teary eyes, parted trembling lips",
      "is_yuri_showcase": false
    }
  },
  {
    "id": "HWD12",
    "title": "衣帽间双臂高举往顶层隔板塞收纳箱·双手锁死敞胸顶入",
    "sub": "Naked-Apron Lifting Storage Box to High Closet Shelf Hands Locked",
    "category": "17. 家务干扰",
    "canvas": "竖图 832x1216",
    "housework_light_mode": "closet_dim_warm",
    "light_badge": "🚪衣帽间暖射灯",
    "light_tags": "warm recessed walk-in closet ceiling spotlight, cozy soft shadows among hanging clothes",
    "light_prose": "lit by a warm recessed walk-in closet spotlight casting soft shadows among hanging clothes.",
    "barefoot": false,
    "is_foot_focus": false,
    "chest_covered": false,
    "unblock_prop_shirt": true,
    "unblock_prop_jacket": true,
    "framing_tags": "cowboy shot, three-quarter frontal-side view stretching both arms, straight overhead, 1.5::standing sex::, 1.5::from behind::",
    "env_tags": "indoors, wooden walk-in closet, racks of hanging coats and dresses, on both sides, high overhead shelf",
    "core_prop_tags": "both hands occupied overhead lifting a clear lidded plastic clothes 1.55::storage box:: onto the high top closet shelf, unable to lower arms or cover herself",
    "female_tags": "1.55::vaginal::, standing sex, fondling breast from behind, cum overflow",
    "femboy_tags": "1.55::anal::, standing in closet, 1.4::small penis::",
    "futa_tags": "1.5::vaginal::, standing in closet, 1.4::small penis::",
    "prose": "Inside a warm walk-in closet in a shifted white frilly naked apron with both hands occupied lifting a storage box onto the high top shelf, completely unable to block rear contact.",
    "extra_neg": "",
    "duo": {
      "apron_detail": "white frilly naked apron slipped wide, open at sides exposing bare breasts, 1.3::nipples::, white thighhighs",
      "partner_tags": "shirtless faceless male pressing flush from, behind inside narrow closet, one hand fondling breast",
      "expr_tags": "1.55::embarrassed::, helpless crimson blush, trembling arms holding box, biting lower lip",
      "is_yuri_showcase": false
    }
  },
  {
    "id": "HWD13",
    "title": "矮几跪坐指尖捏细针穿线缝衬衫纽扣·屏息凝神跨坐忍耐",
    "sub": "Naked-Apron Threading Needle & Sewing Button Seated on Lap",
    "category": "17. 家务干扰",
    "canvas": "竖图 832x1216",
    "housework_light_mode": "warm_bedroom_lamp",
    "light_badge": "🛏️卧室柔暖床光",
    "light_tags": "warm afternoon window light illuminating fine, white sewing thread",
    "light_prose": "glowing under cozy afternoon bedroom light across crisp white cotton sheets.",
    "barefoot": false,
    "is_foot_focus": false,
    "chest_covered": true,
    "unblock_prop_shirt": true,
    "unblock_prop_jacket": false,
    "framing_tags": "close cowboy shot, frontal three-quarter view seated, in partner's lap from behind, 1.5::sitting on lap:: at low wooden table",
    "env_tags": "indoors, Japanese low wooden chabudai table, open wooden sewing box, with colorful thread spools and red pincushion",
    "core_prop_tags": "both trembling hands holding a white, shirt cuff, tiny 1.55::sewing needle::, and white thread right, in front of chest trying, to sew on a small button, without pricking finger",
    "female_tags": "1.55::vaginal::, reverse suspended congress on lap, insertion, cum overflow",
    "femboy_tags": "1.55::anal::, seated on lap from behind, 1.4::small penis::",
    "futa_tags": "1.5::vaginal::, seated on lap from behind, 1.4::small penis::",
    "prose": "Seated on his lap behind a low wooden table with an open sewing kit in a white frilly naked apron covering her front chest, squinting through teary blushes trying to steady a needle and button mid-stitch.",
    "extra_neg": "blood, syringe, medical needle",
    "duo": {
      "apron_detail": "intact apron bib covering front chest, 1.45::sideboob::, bare shoulders, white thighhighs",
      "partner_tags": "shirtless faceless male seated, behind her bouncing her hips, on his lap",
      "expr_tags": "1.6::endurance::, squinting teary eyes concentrating hard, on needle and button, deep blush, pursed trembling lips",
      "is_yuri_showcase": false
    }
  },
  {
    "id": "HWD14",
    "title": "衣架旁手握粘毛滚筒给西装除尘·被捂嘴压声站立后入",
    "sub": "Naked-Apron Lint-Rolling Hanging Suit Jacket Muffled from Behind",
    "category": "17. 家务干扰",
    "canvas": "竖图 832x1216",
    "housework_light_mode": "hallway_wood_sheen",
    "light_badge": "🪵走廊湿木反光",
    "light_tags": "warm entryway corridor light, soft highlights on dark wool suit, and white frills",
    "light_prose": "illuminated by warm indoor corridor light gleaming across wet floor reflections.",
    "barefoot": false,
    "is_foot_focus": false,
    "chest_covered": false,
    "unblock_prop_shirt": false,
    "unblock_prop_jacket": true,
    "framing_tags": "cowboy shot, three-quarter side view standing beside wooden, coat rack, 1.5::standing sex::, 1.5::from behind::, 1.55::hand over mouth::",
    "env_tags": "indoors, apartment hallway beside wooden coat stand",
    "core_prop_tags": "dark suit jacket hanging, on wooden hanger on coat rack, right hand holding a white adhesive cylindrical 1.55::lint roller:: rolling down the jacket sleeve while left hand clutches jacket hem",
    "female_tags": "1.55::vaginal::, standing sex, insertion, cum dripping down inner leg",
    "femboy_tags": "1.55::anal::, standing muffled, 1.4::small penis::",
    "futa_tags": "1.5::vaginal::, standing muffled, 1.4::small penis::",
    "prose": "Standing beside a hallway coat rack in a white frilly naked apron rolling a white adhesive lint roller down a hanging suit jacket while muffled gently from behind.",
    "extra_neg": "man wearing suit, dressed male",
    "duo": {
      "apron_detail": "white frilly naked apron slipped off shoulder, sideboob, bare buttocks, white thighhighs",
      "partner_tags": "shirtless faceless male standing, behind pressing one hand, over her mouth to muffle moans",
      "expr_tags": "wide teary blushing eyes above muffled hand, trembling shoulders",
      "is_yuri_showcase": false
    }
  },
  {
    "id": "HWD15",
    "title": "双裸围百合合力抖开雪白被单铺床·翻飞白布下贴身纠缠",
    "sub": "2Girls Dual Naked-Aprons Under Billowing White Bedsheet Canopy",
    "category": "17. 家务干扰",
    "canvas": "竖图 832x1216",
    "housework_light_mode": "warm_bedroom_lamp",
    "light_badge": "🛏️卧室柔暖床光",
    "light_tags": "soft sunlit glow filtering through a, billowing white cotton sheet arched overhead",
    "light_prose": "glowing under cozy afternoon bedroom light across crisp white cotton sheets.",
    "barefoot": false,
    "is_foot_focus": false,
    "chest_covered": true,
    "unblock_prop_shirt": false,
    "unblock_prop_jacket": false,
    "framing_tags": "cowboy shot, three-quarter view seated close together, on bed beneath a high-arched billowing, white bedsheet canopy, 1.5::scissoring::, intertwined thighs on mattress",
    "env_tags": "indoors, bright bedroom mattress mid-bedmaking, soft pillows",
    "core_prop_tags": "large freshly shaken crisp white bedsheet, billowing overhead like a tent, over both girls mid-chore",
    "female_tags": "1.55::tribadism::, 1.5::fingering::, glistening 1.5::pussy juice:: on inner thighs",
    "femboy_tags": "1.55::anal::, under billowing white bedsheet, 1.4::small penis::",
    "futa_tags": "1.5::vaginal::, under billowing white bedsheet, 1.4::small penis::",
    "prose": "Two girls in contrasting white and pastel-blue frilly naked aprons with front bibs covering their chests and soft sideboob showing, seated with thighs intertwined on the mattress right beneath a crisp white bedsheet billowing overhead mid-bedmaking.",
    "extra_neg": "extra legs, 5 legs, 3 legs, mutated legs, fused legs",
    "duo": {
      "apron_detail": "intact apron bib covering front chest, 1.45::sideboob::, bare shoulders, white thighhighs",
      "partner_tags": "second girl in contrasting pastel-blue frilly, naked apron embracing her, on the mattress",
      "expr_tags": "flushed eye contact, breathless parted lips, shy teary blush under billowing sheet",
      "is_yuri_showcase": true
    }
  }
];
