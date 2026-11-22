// NovelAI V4.5 / V5 Outdoor Camping & Woodland Picnic Scenes (CP01-CP12 · 19. 露营野餐)
// Empirically calibrated across 5 Outdoor Camping Lighting Modes, Chest-Coverage Discipline, Barefoot Creek/Mat Hygiene, and 4-Mode Multi-Box Gender Isolation.

export type CampingActionCategory = "19. 露营野餐";

export type CampingLightMode =
  | "dappled_meadow_picnic"
  | "golden_hour_lakeside"
  | "lantern_glowing_tent"
  | "warm_campfire_ember"
  | "starry_milkyway_night";

export const CAMPING_LIGHT_DEFAULTS: Record<
  CampingLightMode,
  { badge: string; pos: string; prose: string; neg: string }
> = {
  "dappled_meadow_picnic": {
    "badge": "🌿晴林树影斑驳",
    "pos": "dappled golden sunlight through green leaves, soft summer breeze",
    "prose": "bathed in dappled golden woodland sunlight filtering through lush green leaves.",
    "neg": "indoors, dark, night"
  },
  "golden_hour_lakeside": {
    "badge": "🌅夕照湖畔金光",
    "pos": "warm golden-hour sunset light, shimmering lakeside reflections",
    "prose": "illuminated by warm golden-hour sunset light across the scenic campsite.",
    "neg": "indoors, night"
  },
  "lantern_glowing_tent": {
    "badge": "🏮夜帐暖灯微光",
    "pos": "warm amber glow from hanging camp lantern, soft tent fabric shadows",
    "prose": "lit by the cozy warm amber glow of a hanging camp lantern inside the tent at night.",
    "neg": "daylight, bright sun, bedroom wall, wooden bedframe, clear blue sky"
  },
  "warm_campfire_ember": {
    "badge": "🔥夜林篝火火星",
    "pos": "dramatic warm orange firelight, floating glowing embers, deep blue night forest shadows",
    "prose": "illuminated by warm crackling orange campfire light and rising embers against dark pines.",
    "neg": "daylight, indoors, fireplace, living room, clear blue sky"
  },
  "starry_milkyway_night": {
    "badge": "🌌银河车尾串灯",
    "pos": "1.6::starry sky::, glowing Milky Way overhead, warm golden 1.55::fairy lights::",
    "prose": "beneath a starry Milky Way sky with warm golden fairy lights glowing along the open tailgate.",
    "neg": "daylight, indoors, bedroom ceiling, sedan front seat, steering wheel, clear blue sky"
  }
};

export const CAMPING_BAREFOOT_BAN_UC =
  "shoes, footwear, sneakers, boots, sandals, thighhighs, stockings, socks, legwear, pantyhose";

export interface CampingDuoMeta {
  outfit_tags: string;
  femboy_outfit_tags: string;
  partner_tags: string;
  expr_tags: string;
  is_yuri_showcase: boolean;
  prose_outfit_phrase: string;
}

export interface RawCampingActionEntry {
  id: string;
  title: string;
  sub: string;
  category: CampingActionCategory;
  canvas: string;
  camping_light_mode: CampingLightMode;
  light_badge: string;
  light_tags: string;
  light_prose: string;
  barefoot: boolean;
  is_foot_focus: boolean;
  chest_covered: boolean;
  is_inside_tent: boolean;
  framing_tags: string;
  env_tags: string;
  core_prop_tags: string;
  female_tags: string;
  femboy_tags: string;
  futa_tags: string;
  prose: string;
  extra_neg: string;
  duo: CampingDuoMeta;
}

export const ALL_RAW_CAMPING_ENTRIES: RawCampingActionEntry[] = [
  {
    "id": "CP01",
    "title": "红白格野餐垫仰躺唇衔鲜红草莓·掀白夏裙第一人称正常位",
    "sub": "Dappled Meadow Checkered Picnic Blanket Strawberry Sundress Missionary POV",
    "category": "19. 露营野餐",
    "canvas": "竖图 832x1216",
    "camping_light_mode": "dappled_meadow_picnic",
    "light_badge": "🌿晴林树影斑驳",
    "light_tags": "dappled golden sunlight through green leaves, soft summer breeze",
    "light_prose": "bathed in dappled golden woodland sunlight filtering through lush green leaves.",
    "barefoot": false,
    "is_foot_focus": false,
    "chest_covered": true,
    "is_inside_tent": false,
    "framing_tags": "1.55::pov::, 1.55::from above::, looking down, 1.55::missionary::, 1.5::on back::, lying on picnic blanket, legs spread",
    "env_tags": "outdoors, lush sunlit green meadow under shade tree, large red-and-white 1.6::checkered blanket::, open wicker 1.55::picnic basket:: with fruit sandwiches, straw sun hat beside head",
    "core_prop_tags": "right hand holding ripe red 1.55::strawberry:: at parted blushing lips, left hand clutching checkered picnic blanket",
    "female_tags": "1.55::vaginal::, deep insertion, glistening 1.5::cum overflow:: onto picnic blanket",
    "femboy_tags": "1.55::anal::, missionary on picnic blanket, 1.4::small penis::",
    "futa_tags": "1.5::vaginal::, missionary on picnic blanket, 1.45::ejaculation:: onto sundress hem",
    "prose": "First-person overhead missionary POV looking down at her lying on a red-and-white checkered picnic blanket beside a wicker picnic basket in dappled tree shade, wearing a white summer sundress lifted around her waist while holding a ripe red strawberry to her parted lips.",
    "extra_neg": "indoors, bed, bedroom, male back, male head",
    "duo": {
      "outfit_tags": "breezy sleeveless white cotton 1.55::sundress::, intact fitted bodice covering front chest, 1.55::skirt lift::, white sundress skirt bunched around waist, bare legs",
      "femboy_outfit_tags": "breezy sleeveless white cotton 1.55::sundress::, intact fitted bodice covering front chest, 1.55::skirt lift::, white sundress skirt bunched around waist, bare legs",
      "partner_tags": "pov crotch, faceless male between thighs",
      "expr_tags": "misty teary eyes looking up, crimson blush, juicy strawberry at parted lips",
      "is_yuri_showcase": false,
      "prose_outfit_phrase": "wearing a white summer sundress lifted around her waist"
    }
  },
  {
    "id": "CP02",
    "title": "双松林间悬空吊床摇晃陷落·双手死抓边绳防翻落正骑乘",
    "sub": "Swaying Woodland Rope Hammock Clutching Side Ropes Cowgirl Straddle",
    "category": "19. 露营野餐",
    "canvas": "竖图 832x1216",
    "camping_light_mode": "dappled_meadow_picnic",
    "light_badge": "🌿晴林树影斑驳",
    "light_tags": "sunlit pine forest canopy, dappled sunbeams across swaying hammock",
    "light_prose": "bathed in dappled golden woodland sunlight filtering through lush green leaves.",
    "barefoot": false,
    "is_foot_focus": false,
    "chest_covered": true,
    "is_inside_tent": false,
    "framing_tags": "cowboy shot, three-quarter frontal view, 1.55::girl on top::, 1.55::straddling:: inside suspended hammock, precarious swaying balance",
    "env_tags": "outdoors, sunny woodland campsite, woven cream rope 1.65::hammock:: between two pine trunks, green grass below",
    "core_prop_tags": "both hands gripping braided hammock side ropes, trying not to tip over",
    "female_tags": "1.55::vaginal::, cowgirl position in hammock, insertion, 1.5::cum overflow::",
    "femboy_tags": "1.55::anal::, cowgirl position in hammock, 1.4::small penis::",
    "futa_tags": "1.5::vaginal::, cowgirl position in hammock, 1.45::ejaculation::",
    "prose": "Straddling on top inside a woven camping hammock suspended between sunlit pine trees, wearing an open cropped windbreaker and fitted white crop tank while clutching both hammock side-ropes tightly so they do not flip over.",
    "extra_neg": "indoors, bed, room, extra arms",
    "duo": {
      "outfit_tags": "unzipped olive cropped outdoor windbreaker, snug white crop tank covering front chest, unbuttoned denim shorts pulled aside",
      "femboy_outfit_tags": "unzipped olive cropped outdoor windbreaker, snug white crop tank covering front chest, unbuttoned denim shorts pulled aside",
      "partner_tags": "faceless male lying back in hammock, gripping hips",
      "expr_tags": "1.55::endurance::, flustered panicked blush, teary eyes, biting lower lip",
      "is_yuri_showcase": false,
      "prose_outfit_phrase": "wearing an open cropped windbreaker and fitted white crop tank"
    }
  },
  {
    "id": "CP03",
    "title": "夕照木质蛋卷桌手端细嘴壶冲咖啡·怕洒热咖啡咬唇后入",
    "sub": "Golden-Hour Lakeside Camp Table Pour-Over Coffee Kettle Rear Interruption",
    "category": "19. 露营野餐",
    "canvas": "竖图 832x1216",
    "camping_light_mode": "golden_hour_lakeside",
    "light_badge": "🌅夕照湖畔金光",
    "light_tags": "warm golden-hour sunset light on calm lake, rising white coffee steam",
    "light_prose": "illuminated by warm golden-hour sunset light across the scenic campsite.",
    "barefoot": false,
    "is_foot_focus": false,
    "chest_covered": true,
    "is_inside_tent": false,
    "framing_tags": "cowboy shot, three-quarter side-rear view leaning over camp table, 1.5::standing sex::, 1.5::from behind::",
    "env_tags": "outdoors, scenic lakeside campsite, slatted wooden folding camp table, pitched beige tent in distance, sparkling lake water",
    "core_prop_tags": "right hand tilting silver gooseneck camp 1.6::kettle::, pouring hot water into glass coffee dripper, camp mug on table, left hand bracing table edge",
    "female_tags": "1.55::vaginal::, standing rear entry, insertion, 1.5::cum drip:: down inner thigh",
    "femboy_tags": "1.55::anal::, standing rear entry at camp table, 1.4::small penis::",
    "futa_tags": "1.5::vaginal::, standing rear entry at camp table, 1.45::ejaculation::",
    "prose": "Leaning over a wooden folding camp table beside a golden-hour mountain lake in a beige camp vest and black sleeveless top, desperately steadying a steaming gooseneck kettle over a coffee dripper during rear interruption.",
    "extra_neg": "indoors, kitchen stove, modern kitchen",
    "duo": {
      "outfit_tags": "beige canvas camp utility vest, fitted black ribbed top covering front chest, khaki hiking shorts pushed down",
      "femboy_outfit_tags": "beige canvas camp utility vest, fitted black ribbed top covering front chest, khaki hiking shorts pushed down",
      "partner_tags": "tall shirtless faceless male standing behind, gripping waist",
      "expr_tags": "1.6::endurance::, teary eyes fixed on coffee stream, crimson blush, tightly bitten lip",
      "is_yuri_showcase": false,
      "prose_outfit_phrase": "in a beige camp vest and black sleeveless top"
    }
  },
  {
    "id": "CP04",
    "title": "露营天幕下赤足跪趴探手翻冰桶冷饮·翘臀短裤褪至膝后入",
    "sub": "Camp Tarp Canopy All-Fours Reaching Into Ice Cooler Box",
    "category": "19. 露营野餐",
    "canvas": "竖图 832x1216",
    "camping_light_mode": "dappled_meadow_picnic",
    "light_badge": "🌿晴林树影斑驳",
    "light_tags": "bright summer campsite light under canvas tarp, glistening cold water droplets",
    "light_prose": "bathed in dappled golden woodland sunlight filtering through lush green leaves.",
    "barefoot": true,
    "is_foot_focus": true,
    "chest_covered": true,
    "is_inside_tent": false,
    "framing_tags": "full body low three-quarter rear-side view, 1.6::all fours:: kneeling on woven camp mat, 1.55::from behind::, 1.5::ass focus::",
    "env_tags": "outdoors, grassy campsite under beige 1.5::camping tarp::, guy ropes, woven outdoor groundsheet",
    "core_prop_tags": "leaning over open blue insulated 1.6::cooler box::, sparkling ice cubes and beverage cans inside, right hand grabbing cold soda can",
    "female_tags": "1.55::vaginal::, doggystyle, insertion, cum dripping onto camp mat",
    "femboy_tags": "1.55::anal::, doggystyle, 1.4::small penis::, 1.3::small testicles::, clear drops on camp mat",
    "futa_tags": "1.5::vaginal::, doggystyle, 1.45::ejaculation:: onto camp mat",
    "prose": "Barefoot on hands and knees on a woven groundsheet under a beige camp tarp in a loose white outdoor tee and green camp shorts pulled down around knees, reaching one hand into an ice-filled blue cooler box for a cold drink during rear entry.",
    "extra_neg": "indoors, refrigerator, kitchen",
    "duo": {
      "outfit_tags": "loose white outdoor t-shirt covering front chest, sporty green camp shorts around knees, bare buttocks, 1.5::bare feet::",
      "femboy_outfit_tags": "loose white outdoor t-shirt covering front chest, sporty green camp shorts around knees, bare buttocks, 1.5::bare feet::",
      "partner_tags": "faceless male kneeling behind on camp mat, gripping bare hips",
      "expr_tags": "looking back over shoulder, burning blush, teary eyes, gasping mouth",
      "is_yuri_showcase": false,
      "prose_outfit_phrase": "in a loose white outdoor tee and green camp shorts pulled down around knees"
    }
  },
  {
    "id": "CP05",
    "title": "湖畔帆布露营椅背面跨坐怀中·手举焦糖烤棉花糖竹签顶入",
    "sub": "Sunset Canvas Camp Chair Reverse Lap Straddle Holding Roasted Marshmallow",
    "category": "19. 露营野餐",
    "canvas": "竖图 832x1216",
    "camping_light_mode": "golden_hour_lakeside",
    "light_badge": "🌅夕照湖畔金光",
    "light_tags": "rich warm sunset glow by lake campsite, soft ember glow from firepit",
    "light_prose": "illuminated by warm golden-hour sunset light across the scenic campsite.",
    "barefoot": false,
    "is_foot_focus": false,
    "chest_covered": false,
    "is_inside_tent": false,
    "framing_tags": "cowboy shot, frontal three-quarter view seated in lap, 1.55::sitting on lap::, reverse upright straddle in camp chair, spread thighs lifted",
    "env_tags": "outdoors, lakeside campsite at dusk, low tan canvas 1.6::folding chair::, small stone fire ring and pines behind",
    "core_prop_tags": "right hand holding wooden roasting stick, golden gooey melted 1.6::marshmallow:: near cheek",
    "female_tags": "1.55::vaginal::, reverse suspended congress on chair, fondling breast from behind, 1.55::cum overflow::",
    "femboy_tags": "1.55::anal::, seated on lap in camp chair, 1.4::small penis::",
    "futa_tags": "1.5::vaginal::, seated on lap in camp chair, 1.45::ejaculation::",
    "prose": "Seated facing outward on his lap in a tan canvas folding camp chair at sunset with her plaid flannel shirt open, holding a wooden stick with a gooey golden roasted marshmallow while bounced from below.",
    "extra_neg": "indoors, office chair, sofa",
    "duo": {
      "outfit_tags": "unbuttoned plaid flannel camp shirt slipped open, exposing bare breasts, pink nipples, hiking socks",
      "femboy_outfit_tags": "unbuttoned plaid flannel camp shirt slipped open, exposing flat male chest, hiking socks",
      "partner_tags": "faceless male seated in camp chair behind, fondling bare breast, lifting thigh",
      "expr_tags": "flustered crimson blush, teary half-closed eyes, parted gasping lips",
      "is_yuri_showcase": false,
      "prose_outfit_phrase": "with her plaid flannel shirt open"
    }
  },
  {
    "id": "CP06",
    "title": "草地圆顶帐篷底链拉开探出上半身·防营地邻帐听见捂嘴后入（横图）",
    "sub": "Poking Head & Arms Out of Unzipped Dome Tent Entrance Muffled (Wide)",
    "category": "19. 露营野餐",
    "canvas": "横图 1216x832",
    "camping_light_mode": "golden_hour_lakeside",
    "light_badge": "🌅夕照湖畔金光",
    "light_tags": "late-afternoon golden campsite light outside, warm shadowed tent interior behind",
    "light_prose": "illuminated by warm golden-hour sunset light across the scenic campsite.",
    "barefoot": false,
    "is_foot_focus": false,
    "chest_covered": true,
    "is_inside_tent": false,
    "framing_tags": "wide shot, low eye-level three-quarter view at tent door, 1.5::prone:: upper body emerging onto grass, lower body inside tent, 1.55::hand over mouth::",
    "env_tags": "outdoors, scenic green campground, pitched yellow-and-olive nylon 1.65::tent::, zippered door partially open at bottom, camp lantern and boots beside tent",
    "core_prop_tags": "unzipped tent flap framing shoulders, one hand clutching green grass turf outside, lower body pulled back inside tent",
    "female_tags": "1.55::vaginal::, rear entry inside tent doorway, trembling shoulders",
    "femboy_tags": "1.55::anal::, rear entry inside tent doorway, 1.4::small penis::",
    "futa_tags": "1.5::vaginal::, rear entry inside tent doorway, 1.45::ejaculation::",
    "prose": "Wide campsite view of a pitched yellow-and-olive dome tent with its zippered door opened partway at the bottom; her head and shoulders in a cream knit sleeveless top emerge out onto the grass clutching the turf while a hand from inside muffles her blushing mouth.",
    "extra_neg": "indoors, bedroom, letterboxed, pillarboxed, black bars",
    "duo": {
      "outfit_tags": "cream knit sleeveless top covering front chest",
      "femboy_outfit_tags": "cream knit sleeveless top covering front chest",
      "partner_tags": "shadowed faceless male kneeling behind inside tent, reaching hand out covering her mouth",
      "expr_tags": "wide panicked teary eyes glancing sideways, deep crimson blush above muffled hand",
      "is_yuri_showcase": false,
      "prose_outfit_phrase": "in a cream knit sleeveless top"
    }
  },
  {
    "id": "CP07",
    "title": "夜幕挂灯帐篷内共钻半拉羽绒睡袋·滑肩吊带温存侧卧勺式后入",
    "sub": "Warm Lantern-Lit Tent Interior Shared Sleeping Bag Spooning",
    "category": "19. 露营野餐",
    "canvas": "竖图 832x1216",
    "camping_light_mode": "lantern_glowing_tent",
    "light_badge": "🏮夜帐暖灯微光",
    "light_tags": "warm amber glow from hanging camp lantern, soft tent fabric shadows",
    "light_prose": "lit by the cozy warm amber glow of a hanging camp lantern inside the tent at night.",
    "barefoot": false,
    "is_foot_focus": false,
    "chest_covered": false,
    "is_inside_tent": true,
    "framing_tags": "cowboy shot, intimate side view inside tent, 1.6::spooning::, lying on side together, one leg lifted out of sleeping bag, 1.5::from behind::",
    "env_tags": "inside pitched nylon 1.6::tent:: at night, warm glowing camp 1.55::lantern:: overhead, inflatable sleeping pad, tent mesh window showing dark pines",
    "core_prop_tags": "fluffy quilted orange-and-cream 1.65::sleeping bag::, unzipped halfway along side around them",
    "female_tags": "1.55::vaginal::, spooning sex inside sleeping bag, fondling breast, 1.55::cum overflow::",
    "femboy_tags": "1.55::anal::, spooning inside sleeping bag, 1.4::small penis::",
    "futa_tags": "1.5::vaginal::, spooning inside sleeping bag, 1.45::ejaculation::",
    "prose": "Inside a cozy lantern-lit camping tent at night, nestled together inside a half-unzipped puffy quilted sleeping bag in a slipped white camisole during intimate spooning from behind.",
    "extra_neg": "daylight, bright sun, bedroom wall, wooden bedframe",
    "duo": {
      "outfit_tags": "thin white ribbed camisole with slipped strap, exposing bare breast, pink nipple, bare thighs",
      "femboy_outfit_tags": "thin white ribbed camisole with slipped strap, exposing flat male chest, bare thighs",
      "partner_tags": "shirtless faceless male spooning inside sleeping bag, fondling bare breast, gripping raised thigh",
      "expr_tags": "melted half-closed teary eyes, warm breathless blush, parted panting lips",
      "is_yuri_showcase": false,
      "prose_outfit_phrase": "in a slipped white camisole"
    }
  },
  {
    "id": "CP08",
    "title": "夜林篝火映照共披格纹羊毛毯坐原木·双手捧热可可杯跨坐吞吐",
    "sub": "Crackling Night Campfire Under Shared Wool Blanket Holding Hot Cocoa Mug",
    "category": "19. 露营野餐",
    "canvas": "竖图 832x1216",
    "camping_light_mode": "warm_campfire_ember",
    "light_badge": "🔥夜林篝火火星",
    "light_tags": "dramatic warm orange firelight, floating glowing embers, deep blue night forest shadows",
    "light_prose": "illuminated by warm crackling orange campfire light and rising embers against dark pines.",
    "barefoot": false,
    "is_foot_focus": false,
    "chest_covered": true,
    "is_inside_tent": false,
    "framing_tags": "cowboy shot, three-quarter frontal-side view on log bench, 1.55::girl on top::, 1.5::straddling:: beside campfire",
    "env_tags": "outdoors, night forest campsite, bright crackling stone-ring 1.65::campfire:: with sparks, pitched tent glowing softly behind",
    "core_prop_tags": "red-and-navy tartan wool 1.55::blanket:: draped over shoulders, open in front below waist, both hands cradling white speckled 1.55::enamel mug::, steaming hot cocoa near chest",
    "female_tags": "1.55::vaginal::, cowgirl straddle by campfire, insertion, 1.55::cum overflow:: glistening in firelight",
    "femboy_tags": "1.55::anal::, straddling by campfire, 1.4::small penis::",
    "futa_tags": "1.5::vaginal::, straddling by campfire, 1.45::ejaculation::",
    "prose": "Straddling on a log bench right beside a crackling night campfire in a cream knit camisole with a tartan wool camp blanket draped around her shoulders, cradling a steaming enamel mug of hot cocoa in both hands as firelight illuminates her bare thighs.",
    "extra_neg": "daylight, indoors, fireplace, living room",
    "duo": {
      "outfit_tags": "snug cream knit camisole covering front chest, thighhigh wool camp socks, bare hips under wool blanket",
      "femboy_outfit_tags": "snug cream knit camisole covering front chest, thighhigh wool camp socks, bare hips under wool blanket",
      "partner_tags": "faceless male seated on wooden log beneath, holding bare hips under blanket",
      "expr_tags": "firelit crimson blush, misty teary eyes, biting lip not to spill cocoa",
      "is_yuri_showcase": false,
      "prose_outfit_phrase": "in a cream knit camisole"
    }
  },
  {
    "id": "CP09",
    "title": "漫天繁星串灯越野车敞开后备箱软铺·双腿盘腰仰望星空交合",
    "sub": "Starry Milky Way Open Camper SUV Tailgate String-Lights Legs-Wrapped Missionary",
    "category": "19. 露营野餐",
    "canvas": "竖图 832x1216",
    "camping_light_mode": "starry_milkyway_night",
    "light_badge": "🌌银河车尾串灯",
    "light_tags": "1.6::starry sky::, glowing Milky Way overhead, warm golden 1.55::fairy lights:: along open tailgate",
    "light_prose": "beneath a starry Milky Way sky with warm golden fairy lights glowing along the open tailgate.",
    "barefoot": false,
    "is_foot_focus": false,
    "chest_covered": true,
    "is_inside_tent": false,
    "framing_tags": "cowboy shot, three-quarter view into open camper hatch, night sky visible above, 1.55::missionary::, 1.55::leg lock:: around waist",
    "env_tags": "outdoors, alpine night overlook, open rear tailgate of off-road camper SUV, cozy padded trunk bed with pillows, starry night sky behind",
    "core_prop_tags": "glowing string fairy lights on tailgate frame, hands clutching soft trunk blanket",
    "female_tags": "1.55::vaginal::, missionary leg lock in open trunk bed, deep insertion, 1.55::cum overflow::",
    "femboy_tags": "1.55::anal::, leg lock in open camper tailgate, 1.4::small penis::",
    "futa_tags": "1.5::vaginal::, leg lock in open camper tailgate, 1.45::ejaculation::",
    "prose": "Lying back on a cozy blanket bed inside the open rear tailgate of a camper SUV strung with warm golden fairy lights beneath a starry Milky Way sky in a navy camp camisole and unbuttoned cardigan, legs wrapped around his waist during missionary embrace.",
    "extra_neg": "daylight, indoors, bedroom ceiling, sedan front seat, steering wheel, cut off feet",
    "duo": {
      "outfit_tags": "fitted navy camp camisole covering front chest, unbuttoned cozy cardigan, white knee socks",
      "femboy_outfit_tags": "fitted navy camp camisole covering front chest, unbuttoned cozy cardigan, white knee socks",
      "partner_tags": "shirtless faceless male kneeling at open tailgate, between her wrapped thighs",
      "expr_tags": "starlit teary eyes, flushed breathless face, parted gasping lips",
      "is_yuri_showcase": false,
      "prose_outfit_phrase": "in a navy camp camisole and unbuttoned cardigan"
    }
  },
  {
    "id": "CP10",
    "title": "清澈林间浅溪赤足踩水俯捞冰镇大西瓜·单腿高抬扶岩石侧后入",
    "sub": "Clear Forest Stream Barefoot Reaching for Chilled Watermelon",
    "category": "19. 露营野餐",
    "canvas": "竖图 832x1216",
    "camping_light_mode": "dappled_meadow_picnic",
    "light_badge": "🌿晴林树影斑驳",
    "light_tags": "sparkling summer sunlight on crystal-clear forest stream, splashed water droplets",
    "light_prose": "bathed in dappled golden woodland sunlight filtering through lush green leaves.",
    "barefoot": true,
    "is_foot_focus": true,
    "chest_covered": true,
    "is_inside_tent": false,
    "framing_tags": "full body, three-quarter side view in shallow stream, 1.55::one leg up::, 1.5::standing sex::",
    "env_tags": "outdoors, lush green woodland creek, crystal-clear shallow 1.6::stream:: over smooth pebbles, mossy riverside boulder",
    "core_prop_tags": "round green-striped 1.6::watermelon:: half-submerged in clear stream, one hand bracing on mossy boulder, other hand reaching down touching wet watermelon",
    "female_tags": "1.55::vaginal::, standing leg lift in stream, insertion, cum dripping into clear water",
    "femboy_tags": "1.55::anal::, standing leg lift in stream, 1.4::small penis::",
    "futa_tags": "1.5::vaginal::, standing leg lift in stream, insertion, 1.45::ejaculation:: over clear stream water",
    "prose": "Standing barefoot ankle-deep in a sparkling sunlit forest stream wearing a knotted white crop tee covering her front chest, reaching down toward a whole green watermelon chilling in the cool water while one wet leg is lifted from behind.",
    "extra_neg": "indoors, swimming pool, tiles, bathtub",
    "duo": {
      "outfit_tags": "knotted white crop tee covering front chest, 1.4::sideboob::, untied bikini bottom slipped off hip, 1.5::bare feet:: in clear water",
      "femboy_outfit_tags": "knotted white crop tee covering front chest, untied bikini bottom slipped off hip, 1.5::bare feet:: in clear water",
      "partner_tags": "shirtless faceless male standing in shallow water, lifting one bare wet thigh",
      "expr_tags": "sunlit crimson blush, open gasping mouth, teary eyes glancing at splashing stream",
      "is_yuri_showcase": false,
      "prose_outfit_phrase": "wearing a knotted white crop tee covering her front chest"
    }
  },
  {
    "id": "CP11",
    "title": "林间树枝悬挂黑淋浴袋温水冲汗·湿透紧贴松树干站立后入",
    "sub": "Woodland Hanging Solar Camp Shower Wet Skin Pressed Against Pine Trunk",
    "category": "19. 露营野餐",
    "canvas": "竖图 832x1216",
    "camping_light_mode": "golden_hour_lakeside",
    "light_badge": "🌅夕照湖畔金光",
    "light_tags": "golden forest backlight on falling water spray, glistening wet skin",
    "light_prose": "illuminated by warm golden-hour sunset light across the scenic campsite.",
    "barefoot": true,
    "is_foot_focus": true,
    "chest_covered": false,
    "is_inside_tent": false,
    "framing_tags": "cowboy shot, three-quarter side-frontal view against pine trunk, under falling water spray, 1.5::standing sex::, 1.5::from behind::",
    "env_tags": "outdoors, secluded sunlit forest campsite corner, thick pine tree trunk, slatted wooden shower mat on grass",
    "core_prop_tags": "black solar camp 1.55::shower:: bag on pine branch, nozzle spraying warm water streams over shoulders, both hands bracing against tree bark",
    "female_tags": "1.55::vaginal::, standing rear entry against tree, wet breasts pressed near bark, 1.5::cum drip::",
    "femboy_tags": "1.55::anal::, standing under camp shower against tree, 1.4::small penis::",
    "futa_tags": "1.5::vaginal::, standing under camp shower against tree, 1.45::ejaculation::",
    "prose": "Barefoot in a secluded sunlit forest corner under a hanging camp shower bag spraying glistening water over her wet skin, bracing against a pine tree trunk with her soaked crop top pushed up during rear contact.",
    "extra_neg": "indoors, tiled bathroom, ceramic wall, bathtub",
    "duo": {
      "outfit_tags": "soaked translucent white crop tank pulled up, exposing wet bare breasts, pink nipples, wet skin with glistening water droplets, 1.5::bare feet::",
      "femboy_outfit_tags": "soaked translucent white crop tank pulled up, exposing wet flat male chest, wet skin with glistening water droplets, 1.5::bare feet::",
      "partner_tags": "wet shirtless faceless male pressing flush behind, under camp shower spray",
      "expr_tags": "wet hair clinging to blushing cheek, breathless arched neck, misty teary eyes, parted lips",
      "is_yuri_showcase": false,
      "prose_outfit_phrase": "with her soaked crop top pushed up"
    }
  },
  {
    "id": "CP12",
    "title": "绿茵格纹毯双夏裙少女指尖喂紫葡萄·并坐爱抚百合同欢",
    "sub": "Sunlit Meadow Picnic 2Girls Dual Sundresses Grape-Feeding Yuri",
    "category": "19. 露营野餐",
    "canvas": "竖图 832x1216",
    "camping_light_mode": "dappled_meadow_picnic",
    "light_badge": "🌿晴林树影斑驳",
    "light_tags": "warm sunlit spring meadow, soft golden bokeh through wildflowers",
    "light_prose": "bathed in dappled golden woodland sunlight filtering through lush green leaves.",
    "barefoot": false,
    "is_foot_focus": false,
    "chest_covered": true,
    "is_inside_tent": false,
    "framing_tags": "cowboy shot, frontal three-quarter view seated side-by-side, on checkered picnic blanket, legs parted forward on blanket",
    "env_tags": "outdoors, sunlit flower meadow under shade tree, large red-and-white checkered picnic blanket, open wicker picnic basket with purple grapes",
    "core_prop_tags": "bracing one palm on picnic blanket, other hand holding purple 1.55::grape:: at partner's lips",
    "female_tags": "1.6::fingering::, glistening 1.55::pussy juice:: dripping onto picnic blanket",
    "femboy_tags": "1.55::anal::, on sunlit picnic blanket, 1.4::small penis::",
    "futa_tags": "1.5::vaginal::, on sunlit picnic blanket, 1.45::ejaculation::",
    "prose": "Two girls in contrasting white and pastel-yellow summer sundresses with intact bodices covering their chests seated side-by-side on a red-and-white checkered picnic blanket beside a wicker basket, holding a single ripe purple grape to parted lips while reaching one hand across beneath the lifted sundress.",
    "extra_neg": "indoors, bed, bedroom, scissoring, extra arms, 5 arms, 3 arms, fused arms, extra legs, 5 legs, 3 legs",
    "duo": {
      "outfit_tags": "sleeveless white summer sundress, intact bodice covering front chest, sundress skirt lifted around waist, bare thighs",
      "femboy_outfit_tags": "sleeveless white summer sundress, intact bodice covering front chest, sundress skirt lifted around waist, bare thighs",
      "partner_tags": "second girl in pastel-yellow sundress seated beside",
      "expr_tags": "sweet flushed eye contact, breathless parted lips, shy teary blush",
      "is_yuri_showcase": true,
      "prose_outfit_phrase": "in contrasting white and pastel-yellow summer sundresses with intact bodices covering their chests"
    }
  }
];
