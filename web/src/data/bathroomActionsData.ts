// ============================================================================
// Solo Bathroom Adult-Toys Series Data (BT01..BT08 = 8 Solo Scenes)
// Calibrated for NovelAI V4.5 / V5 Full with 4-Mode Humid Bathroom Lighting,
// BATHROOM_TOWEL_UC & FOOT_ANAT_UC Locks, and 4-Mode Gender Isolation
// ============================================================================

export type BathroomActionCategory = "16. 浴室玩具";

export type BathroomLightMode =
  | "steamy_warm_bath"
  | "backlit_glass_shower"
  | "vanity_mirror_warm"
  | "laundry_alcove_glow";

export interface RawBathroomActionEntry {
  id: string;
  title: string;
  sub: string;
  category: BathroomActionCategory;
  canvas: "竖图 832x1216";
  camera_mode: "direct";
  lighting_mode: "steamy_glass" | "warm_spot";
  bathroom_light_mode: BathroomLightMode;
  is_foot_focus: boolean;
  allow_smartphone_prop: boolean;
  light_badge: string;
  light_tags: string;
  light_prose: string;
  builtin_outfit: string;
  femboy_outfit: string;
  framing_tags: string;
  femboy_framing_tags: string;
  env_tags: string;
  core_prop_tags: string;
  femboy_core_prop_tags: string;
  bathroom_expr_tags: string;
  female_tags: string;
  femboy_tags: string;
  futa_tags: string;
  prose: string;
  extra_neg: string;
}

export const BATHROOM_TOWEL_UC = "shirt, collared shirt, blouse, t-shirt, sweater, jacket, coat, skirt, pleated skirt, miniskirt, dress, pants, shorts, jeans, apron, swimsuit, bikini, bra, panties, thighhighs, stockings, socks, pantyhose, shoes, sneakers, boots";

export const BATHROOM_LIGHT_DEFAULTS: Record<
  BathroomLightMode,
  { pos: string; neg: string; badge: string; lighting_mode: "steamy_glass" | "warm_spot" }
> = {
  "backlit_glass_shower": {
    "pos": "warm backlit steamy shower stall, overhead chrome showerhead spraying glistening water streams, humid mist",
    "neg": "bright outdoor sky, clear blue sky, sunny sky",
    "badge": "🚿水雾淋浴逆光",
    "lighting_mode": "steamy_glass"
  },
  "steamy_warm_bath": {
    "pos": "warm golden bathroom downlight, soft rising white bath steam, sparkling water surface reflections",
    "neg": "bright outdoor sky, clear blue sky, sunny sky",
    "badge": "🛁暖金浴雾波光",
    "lighting_mode": "steamy_glass"
  },
  "vanity_mirror_warm": {
    "pos": "warm glowing LED bathroom vanity mirror, strip light, humid mist, glossy porcelain highlights",
    "neg": "bright outdoor sky, clear blue sky, sunny sky, mirror selfie, holding phone, smartphone, camera",
    "badge": "🪞洗漱暖光灯带",
    "lighting_mode": "warm_spot"
  },
  "laundry_alcove_glow": {
    "pos": "warm bathroom laundry-nook light, glowing digital spin-cycle display on white, front-load washing machine",
    "neg": "bright outdoor sky, clear blue sky, sunny sky",
    "badge": "🧺洗衣数显暖光",
    "lighting_mode": "warm_spot"
  }
};

export const ALL_RAW_BATHROOM_ENTRIES: RawBathroomActionEntry[] = [
  {
    "id": "BT01",
    "title": "水雾玻璃淋浴间壁贴透明粉吸盘玩具·单腿高抬扶玻璃背拱后坐",
    "sub": "Steamy Glass Shower Wall Suction-Cup Dildo Standing Leg-Up",
    "category": "16. 浴室玩具",
    "canvas": "竖图 832x1216",
    "camera_mode": "direct",
    "lighting_mode": "steamy_glass",
    "bathroom_light_mode": "backlit_glass_shower",
    "is_foot_focus": true,
    "allow_smartphone_prop": false,
    "light_badge": "🚿水雾淋浴逆光",
    "light_tags": "warm backlit steamy shower stall, overhead chrome showerhead spraying glistening water streams, humid mist",
    "light_prose": "",
    "builtin_outfit": "nude, completely nude, wet hair clinging to shoulders, bare breasts, 1.3::nipples::, bare legs, bare feet",
    "femboy_outfit": "nude, wet hair clinging to shoulders, bare back, bare buttocks, bare legs, bare feet",
    "framing_tags": "cowboy shot, side profile view standing backed right, up against vertical tiled shower wall, on the right side of frame, 1.55::one leg up::, arched back",
    "femboy_framing_tags": "cowboy shot, side profile view standing backed right, up against vertical tiled shower wall, on the right side of frame, 1.55::one leg up::, arched back",
    "env_tags": "indoors, modern home bathroom shower stall, vertical white tiled wall directly, behind buttocks on right",
    "core_prop_tags": "one single 1.7::suction cup dildo:: with its wide pink suction base pressed flat onto the vertical right-side tiled wall and its glossy translucent pink shaft extending horizontally left straight into her hip, 1.6::object insertion::",
    "femboy_core_prop_tags": "one single 1.7::suction cup dildo:: with its wide pink suction base pressed flat onto the vertical right-side tiled wall and its glossy translucent pink shaft extending horizontally left straight into his hip, 1.6::object insertion::",
    "bathroom_expr_tags": "looking at viewer over wet shoulder, flushed cheeks, teary half-lidded eyes, parted gasping lips",
    "female_tags": "1.55::vaginal object insertion::, single wall-mounted pink suction dildo entering, wet slit from right wall, glistening 1.55::pussy juice:: mixing with shower water",
    "femboy_tags": "1.55::anal object insertion::, single wall-mounted pink suction dildo entering, from right wall, 1.4::small penis::",
    "futa_tags": "1.55::vaginal object insertion::, single wall-mounted pink suction dildo entering, slit from right wall, 1.4::small penis::",
    "prose": "Standing nude under warm shower spray backed right up against the tiled shower wall on the right, lowering her raised hip onto a single glossy pink suction-cup dildo stuck horizontally to the wall behind her.",
    "extra_neg": "bright outdoor sky, clear blue sky, sunny sky, bright outdoor sky, sunlight, bedroom, two dildos, multiple dildos, floating dildo"
  },
  {
    "id": "BT02",
    "title": "热气白瓷浴缸分腿搭沿·双手紧按大号圆头魔杖震动器激起水面涟漪",
    "sub": "Steaming Porcelain Bathtub Rim Magic-Wand Vibrator & Water Ripples",
    "category": "16. 浴室玩具",
    "canvas": "竖图 832x1216",
    "camera_mode": "direct",
    "lighting_mode": "steamy_glass",
    "bathroom_light_mode": "steamy_warm_bath",
    "is_foot_focus": true,
    "allow_smartphone_prop": false,
    "light_badge": "🛁暖金浴雾波光",
    "light_tags": "warm golden bathroom downlight, soft rising white bath steam, sparkling water surface reflections",
    "light_prose": "",
    "builtin_outfit": "nude, wet glistening skin, bare breasts, 1.3::nipples::, bare legs, 1.5::bare feet::",
    "femboy_outfit": "nude, wet glistening skin, flat chest, bare legs, 1.5::bare feet::",
    "framing_tags": "full body high-angle frontal three-quarter view reclining back in steaming white porcelain 1.6::bathtub:: with wet bare legs draped wide over the bathtub rim",
    "femboy_framing_tags": "full body high-angle frontal three-quarter view reclining back in steaming white porcelain 1.6::bathtub:: with wet bare legs draped wide over the bathtub rim",
    "env_tags": "indoors, cozy tiled home bathroom, clear warm bathwater with light white, soap suds, folded white towel beside tub",
    "core_prop_tags": "both hands gripping a white corded 1.7::magic wand vibrator::, pressing the round padded white vibrating, head firmly right at the waterline, 1.55::motion lines:: sending concentric vibration ripples and tiny flying droplets across the bathwater",
    "femboy_core_prop_tags": "both hands gripping a white corded 1.7::magic wand vibrator::, pressing the round padded white vibrating, head firmly right at the waterline, 1.55::motion lines:: sending concentric vibration ripples and tiny flying droplets across the bathwater",
    "bathroom_expr_tags": "head tilted back on tub rim, intense crimson blush, squinted teary eyes, biting lower lip, trembling toes",
    "female_tags": "1.55::masturbation::, round white magic wand head pressed, snug against glistening clit, above clear bathwater, 1.55::female orgasm::",
    "femboy_tags": "1.55::masturbation::, round white magic wand head pressed against 1.4::small penis:: at bathwater surface, erection",
    "futa_tags": "1.55::masturbation::, round white magic wand head pressed against slit and 1.4::small penis:: at bathwater surface",
    "prose": "Reclining nude in a steaming porcelain bathtub with wet bare legs draped over the rim, pressing a buzzing white magic-wand vibrator at the waterline as concentric vibration ripples spread across the bathwater.",
    "extra_neg": "bright outdoor sky, clear blue sky, sunny sky, bright outdoor sky, sunlight, murky water"
  },
  {
    "id": "BT03",
    "title": "日式透明亚克力浴凳M字坐姿·粉色有线跳蛋塞入仅露细线与手握调速盒",
    "sub": "Clear Acrylic Bath Stool M-Legs Pink Wired Egg Vibrator & Remote",
    "category": "16. 浴室玩具",
    "canvas": "竖图 832x1216",
    "camera_mode": "direct",
    "lighting_mode": "steamy_glass",
    "bathroom_light_mode": "steamy_warm_bath",
    "is_foot_focus": true,
    "allow_smartphone_prop": false,
    "light_badge": "🛁暖金浴雾波光",
    "light_tags": "warm humid Japanese bathroom lighting, glossy reflections on wet floor tiles, and clear acrylic",
    "light_prose": "",
    "builtin_outfit": "wet white bath towel draped loosely, over shoulders leaving front open, bare breasts, 1.3::nipples::, bare legs, 1.5::bare feet::",
    "femboy_outfit": "wet white bath towel draped loosely, over shoulders leaving flat chest open, bare legs, 1.5::bare feet::",
    "framing_tags": "full body low frontal view seated in wide 1.6::m legs:: posture on a low transparent clear acrylic bath stool",
    "femboy_framing_tags": "full body low frontal view seated in wide 1.6::m legs:: posture on a low transparent clear acrylic bath stool",
    "env_tags": "indoors, Japanese tiled wet bathroom washing area, wooden bucket on floor behind, clean empty wet tiles under stool",
    "core_prop_tags": "1.7::egg vibrator::, small glossy pink wired rotor vibrator tucked half-inside with one single continuous thin pink cord curving directly up to the single pink 1.55::vibrator controller:: held in her right hand at chest height, buzzing motion lines",
    "femboy_core_prop_tags": "1.7::egg vibrator::, small glossy pink wired rotor vibrator tucked half-inside with one single continuous thin pink cord curving directly up to the single pink 1.55::vibrator controller:: held in his right hand at chest height, buzzing motion lines",
    "bathroom_expr_tags": "1.55::embarrassed::, flushed cheeks, misty teary eyes looking at viewer, left hand gripping own knee",
    "female_tags": "0.95::spread pussy::, glossy pink egg vibrator nestled, inside wet labia with single pink, wire leading up to right hand, 1.55::pussy juice:: dripping onto clean wet tiles below clear stool",
    "femboy_tags": "pink wired egg vibrator tucked, inside with wire leading up to, right hand, 1.4::small penis::",
    "futa_tags": "pink wired egg vibrator nestled, inside slit with wire leading up, to right hand, 1.4::small penis::",
    "prose": "Sitting barefoot in wide M-legs on a low clear acrylic bath stool with a loose wet towel on her shoulders, holding the single pink controller in her right hand connected by one thin pink wire to the buzzing egg vibrator.",
    "extra_neg": "bright outdoor sky, clear blue sky, sunny sky, bright outdoor sky, sunlight, two controllers, extra remote"
  },
  {
    "id": "BT04",
    "title": "浴室洗漱台暖光弯腰撑沿翘臀·粉水晶心形尾塞与手持螺纹震动棒双通道",
    "sub": "Bathroom Vanity Basin Bent-Over Heart-Crystal Plug & Pink Vibrator",
    "category": "16. 浴室玩具",
    "canvas": "竖图 832x1216",
    "camera_mode": "direct",
    "lighting_mode": "warm_spot",
    "bathroom_light_mode": "vanity_mirror_warm",
    "is_foot_focus": false,
    "allow_smartphone_prop": false,
    "light_badge": "🪞洗漱暖光灯带",
    "light_tags": "warm glowing LED bathroom vanity mirror, strip light, humid mist, glossy porcelain highlights",
    "light_prose": "",
    "builtin_outfit": "white bath towel wrapped loosely, around upper chest and slipping down, bare back, bare buttocks, bare thighs",
    "femboy_outfit": "white bath towel draped around neck, bare back, bare buttocks, bare thighs",
    "framing_tags": "cowboy shot, 1.6::from behind::, 1.55::ass focus::, bent forward bracing left hand on, white ceramic bathroom washbasin counter, with legs apart, glancing back",
    "femboy_framing_tags": "cowboy shot, 1.6::from behind::, 1.55::ass focus::, bent forward bracing left hand on, white ceramic bathroom washbasin counter, with legs apart, glancing back",
    "env_tags": "indoors, bathroom vanity sink counter, toothbrush glass, liquid soap pump, softly fogged vanity mirror ahead",
    "core_prop_tags": "1.65::butt plug:: with a sparkling faceted pink heart crystal base snugly inserted above while right hand reaches back between thighs pushing a glossy pink ribbed cylindrical 1.65::vibrator:: halfway inside below",
    "femboy_core_prop_tags": "1.65::butt plug:: with a sparkling faceted pink heart crystal base snugly inserted above while right hand reaches back between thighs pushing a glossy pink ribbed cylindrical 1.65::vibrator:: halfway inside below",
    "bathroom_expr_tags": "looking back over shoulder, with bashful crimson blush, biting lower lip, teary half-closed eyes",
    "female_tags": "dual toy play, pink heart-crystal plug inserted in anus, above and pink ribbed vibrator inserted, into wet pussy below, glistening 1.5::pussy juice::",
    "femboy_tags": "pink ribbed vibrator and crystal plug, play from behind, 1.4::small penis:: hanging glistening between thighs",
    "futa_tags": "pink heart-crystal plug above, and pink vibrator inserted, into wet slit below, 1.4::small penis::",
    "prose": "Bent over the glowing bathroom vanity sink from behind in a slipping white towel, a sparkling pink heart-crystal plug snugly in place while her right hand guides a glossy pink vibrator inside.",
    "extra_neg": "bright outdoor sky, clear blue sky, sunny sky, mirror selfie, holding phone, smartphone, camera, mirror selfie, holding phone, smartphone, camera"
  },
  {
    "id": "BT05",
    "title": "浴室滚筒洗衣机脱水震动台面·微敞湿浴巾单手勾环拉出粉亮串珠拉丝",
    "sub": "Vibrating Washing-Machine Top Pulling Glossy Pink Toy Beads",
    "category": "16. 浴室玩具",
    "canvas": "竖图 832x1216",
    "camera_mode": "direct",
    "lighting_mode": "warm_spot",
    "bathroom_light_mode": "laundry_alcove_glow",
    "is_foot_focus": true,
    "allow_smartphone_prop": false,
    "light_badge": "🧺洗衣数显暖光",
    "light_tags": "warm bathroom laundry-nook light, glowing digital spin-cycle display on white, front-load washing machine",
    "light_prose": "",
    "builtin_outfit": "white bath towel open around shoulders, bare breasts, 1.3::nipples::, bottomless, bare legs, 1.5::bare feet::",
    "femboy_outfit": "white bath towel open around shoulders, 1.55::flat chest::, tiny pink nipples, bottomless, bare legs, 1.5::bare feet::",
    "framing_tags": "full body three-quarter frontal view seated bare-bottomed atop a vibrating white front-load 1.6::washing machine:: with one bare knee raised high",
    "femboy_framing_tags": "full body three-quarter frontal view seated bare-bottomed atop a vibrating white front-load 1.6::washing machine:: with one bare knee raised high",
    "env_tags": "indoors, home bathroom laundry alcove, laundry detergent bottle and folded towels, on shelf",
    "core_prop_tags": "1.7::anal beads::, right index finger hooking the circular, pull-ring of a string of glossy, pink graduated spheres, slowly pulling three glistening pink beads, out with clear liquid threads, while remaining beads stay inside, subtle vibration lines on washing machine",
    "femboy_core_prop_tags": "1.7::anal beads::, right index finger hooking the circular, pull-ring of a string of glossy, pink graduated spheres, slowly pulling three glistening pink beads, out with clear liquid threads, while remaining beads stay inside, subtle vibration lines on washing machine",
    "bathroom_expr_tags": "trembling blush, toes curled in midair, biting lower lip, teary eyes looking down",
    "female_tags": "0.9::spread pussy::, pulling glistening pink toy beads out, with clear sticky threads",
    "femboy_tags": "1.55::anal object insertion::, pulling glossy pink beads slowly out from behind between spread thighs while 1.4::small penis:: and 1.3::small testicles:: twitch with clear precum drops",
    "futa_tags": "pulling glossy pink beads out, with clear sticky threads, 1.4::small penis::",
    "prose": "Seated barefoot atop a humming front-load bathroom washing machine with an open white towel on shoulders, hooking the ring of glossy pink beads to slowly pull them out with glistening threads.",
    "extra_neg": "bright outdoor sky, clear blue sky, sunny sky, bright outdoor sky, sunlight"
  },
  {
    "id": "BT06",
    "title": "绵密白泡浴缸内扶沿半蹲·骑乘浴缸底直立吸盘透明玩具缓缓坐落",
    "sub": "Bubble-Bath Tub Floor Upright Suction-Cup Dildo Squatting Ride",
    "category": "16. 浴室玩具",
    "canvas": "竖图 832x1216",
    "camera_mode": "direct",
    "lighting_mode": "steamy_glass",
    "bathroom_light_mode": "steamy_warm_bath",
    "is_foot_focus": false,
    "allow_smartphone_prop": false,
    "light_badge": "🛁暖金浴雾波光",
    "light_tags": "warm cozy bathroom lighting, shimmering soap bubbles and rising warm steam",
    "light_prose": "",
    "builtin_outfit": "nude, fluffy white soap bubbles clinging to, bare breasts and shoulders, 1.3::nipples:: peeking through suds, wet bare thighs",
    "femboy_outfit": "nude, fluffy white soap bubbles on flat, chest and shoulders, wet bare thighs",
    "framing_tags": "1.5::from above::, high-angle overhead cowboy shot looking down inside a wide white porcelain 1.6::bathtub:: as she squats with knees wide apart inside the tub basin",
    "femboy_framing_tags": "1.5::from above::, high-angle overhead cowboy shot looking down inside a wide white porcelain 1.6::bathtub:: as he squats with knees wide apart inside the tub basin",
    "env_tags": "indoors, white porcelain bathtub interior, shallow crystal-clear water with floating white, soap foam around tub edges, chrome faucet",
    "core_prop_tags": "1.7::suction cup dildo::, thick clear-blue translucent dildo, with wide suction base stuck vertically, upright to the white inner floor, of the bathtub directly beneath her, 1.6::object insertion:: as she lowers her soapy hips onto the upright translucent shaft",
    "femboy_core_prop_tags": "1.7::suction cup dildo::, thick clear-blue translucent dildo, with wide suction base stuck vertically, upright to the white inner floor, of the bathtub directly beneath him, 1.6::object insertion:: as he lowers his soapy hips onto the upright translucent shaft",
    "bathroom_expr_tags": "looking up at viewer, with deep full-face blush, trembling open mouth, misty teary eyes",
    "female_tags": "1.55::vaginal object insertion::, squatting inside bathtub onto upright suction-cup, dildo stuck to tub bottom, glistening wet labia around translucent shaft",
    "femboy_tags": "1.55::anal object insertion::, squatting inside bathtub onto upright suction-cup, dildo on tub bottom, 1.4::small penis::",
    "futa_tags": "1.55::vaginal object insertion::, squatting inside bathtub onto upright suction-cup, dildo on tub bottom, 1.4::small penis::",
    "prose": "High-angle view looking down inside a warm bubble-lined white bathtub as she squats inside the basin, slowly lowering her soapy hips onto a clear-blue translucent dildo suctioned upright to the bathtub floor.",
    "extra_neg": "bright outdoor sky, clear blue sky, sunny sky, opaque water, murky water, bright outdoor sky"
  },
  {
    "id": "BT07",
    "title": "浴室防滑垫M字仰躺·左手举花洒水柱直冲、右手握环柄透明玻璃棒深入",
    "sub": "Handheld Showerhead Water-Jet & Ring-Base Clear Glass Dildo Combo",
    "category": "16. 浴室玩具",
    "canvas": "竖图 832x1216",
    "camera_mode": "direct",
    "lighting_mode": "steamy_glass",
    "bathroom_light_mode": "backlit_glass_shower",
    "is_foot_focus": true,
    "allow_smartphone_prop": false,
    "light_badge": "🚿水雾淋浴逆光",
    "light_tags": "bright warm humid shower stall light, sparkling flying water droplets and mist",
    "light_prose": "",
    "builtin_outfit": "nude, drenched wet skin, bare breasts, 1.3::nipples::, bare stomach, bare legs, 1.5::bare feet::",
    "femboy_outfit": "nude, drenched wet skin, flat chest, bare stomach, bare legs, 1.5::bare feet::",
    "framing_tags": "cowboy shot, slightly high frontal view lying back on soft white bathroom mat with 1.6::legs up:: spread wide",
    "femboy_framing_tags": "cowboy shot, slightly high frontal view lying back on soft white bathroom mat with 1.6::legs up:: spread wide",
    "env_tags": "indoors, wet tiled bathroom floor, shower drain behind",
    "core_prop_tags": "left hand holding a chrome handheld 1.65::showerhead:: above spraying pressurized water streams onto groin while right hand grips the round glass loop handle of a short standalone curved transparent beaded 1.7::glass dildo:: pushing it halfway inside",
    "femboy_core_prop_tags": "left hand holding a chrome handheld 1.65::showerhead:: above spraying pressurized water streams onto groin while right hand grips the round glass loop handle of a short standalone curved transparent beaded 1.7::glass dildo:: pushing it halfway inside",
    "bathroom_expr_tags": "arched back, ecstatic crimson blush, teary eyes half-shut, gasping open mouth",
    "female_tags": "1.55::vaginal object insertion::, right hand holding clear beaded glass, dildo inserted inside while left hand, sprays showerhead water jet, against clit",
    "femboy_tags": "1.55::anal object insertion::, right hand holding clear glass dildo inserted while left hand sprays showerhead on 1.4::small penis::",
    "futa_tags": "1.55::vaginal object insertion::, right hand holding clear beaded glass dildo inserted inside wet slit while left hand sprays showerhead water jet onto erect 1.4::small penis:: spurting white arcs",
    "prose": "Lying back on a wet bathroom mat with legs raised wide, holding a chrome showerhead in her left hand spraying water onto her groin while her right hand grips the loop base of a standalone clear beaded glass dildo inserted inside.",
    "extra_neg": "bright outdoor sky, clear blue sky, sunny sky, bright outdoor sky, syringe, bottle"
  },
  {
    "id": "BT08",
    "title": "出浴水雾瓷砖倚靠咬白浴巾角忍耐·手机滑块满格遥控粉色贴合吸吮跳蛋",
    "sub": "Biting Fluffy Bath Towel Enduring Max-Slider App Wearable Vibrator",
    "category": "16. 浴室玩具",
    "canvas": "竖图 832x1216",
    "camera_mode": "direct",
    "lighting_mode": "steamy_glass",
    "bathroom_light_mode": "steamy_warm_bath",
    "is_foot_focus": false,
    "allow_smartphone_prop": true,
    "light_badge": "🛁暖金浴雾波光",
    "light_tags": "warm steamy after-bath bathroom glow, water droplets gleaming on flushed collarbone, and thighs",
    "light_prose": "",
    "builtin_outfit": "wet skin, damp hair, holding corner of white fluffy bath, towel in teeth while rest of, towel drapes down one arm, exposing bare breasts, 1.3::nipples::, bare thighs",
    "femboy_outfit": "wet skin, holding corner of white bath towel, in teeth exposing flat chest, bare thighs",
    "framing_tags": "cowboy shot, frontal three-quarter view leaning back, against steamed white bathroom wall tiles, with thighs trembling apart",
    "femboy_framing_tags": "cowboy shot, frontal three-quarter view leaning back, against steamed white bathroom wall tiles, with thighs trembling apart",
    "env_tags": "indoors, steamy tiled bathroom wall, fogged towel bar behind",
    "core_prop_tags": "biting corner of fluffy white towel, in mouth to muffle moans, left hand down by hip holding a glowing smartphone displaying a pink max-power 1.5::vibrator app:: slider UI, wireless curved pink wearable 1.7::vibrator:: clinging snugly against groin with buzzing motion lines",
    "femboy_core_prop_tags": "biting corner of fluffy white towel, in mouth to muffle moans, left hand down by hip holding a glowing smartphone displaying a pink max-power 1.5::vibrator app:: slider UI, wireless curved pink wearable 1.7::vibrator:: clinging snugly against groin with buzzing motion lines",
    "bathroom_expr_tags": "1.6::embarrassed::, 1.55::trembling::, fierce full-face crimson blush, teary eyes squeezed half-shut, biting white towel corner tightly",
    "female_tags": "wireless curved pink suction vibrator pressed, snug over wet slit, glistening 1.6::pussy juice:: streaming down trembling inner thighs",
    "femboy_tags": "wireless curved pink vibrator strapped snug, against groin, 1.4::small penis:: dripping clear threads down thigh",
    "futa_tags": "wireless curved pink vibrator pressed snug against slit and 1.4::small penis::, dripping clear threads",
    "prose": "Leaning damp and flushed against steamy bathroom tiles biting a corner of a white towel to stay quiet, holding a glowing smartphone with a max-level pink vibrator slider while a wireless pink toy buzzes snugly between her thighs.",
    "extra_neg": "bright outdoor sky, clear blue sky, sunny sky, mirror selfie, taking picture, phone covering face, bright outdoor sky"
  }
];
