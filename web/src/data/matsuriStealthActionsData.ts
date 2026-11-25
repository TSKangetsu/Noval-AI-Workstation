// NovelAI V4.5 / V5 Summer Matsuri Stealth Yukata Scenes (MTS01-MTS15 · 24. 夏日祭典)
// Verbatim from matsuri_stealth_15_handoff_v5_audited.json (dual-signed by physics-reviewer & prompt-auditor).

import type { OnsenSoloSpreadSpec } from "./onsenYukataActionsData";

export type MatsuriActionCategory = "24. 夏日祭典";

export type MatsuriLightMode =
  | "hanabi_burst_riverside"
  | "yatai_chochin_amber"
  | "shrine_torii_moonlight"
  | "sparkler_close_glow"
  | "festival_crowd_bokeh";

export type MatsuriCameraMode = "pov" | "3rd";

export interface MatsuriLightSpec {
  badge: string;
  backlit: boolean;
  pos: string;
  prose: string;
  neg: string;
}

export const MATSURI_LIGHT_DEFAULTS: Record<MatsuriLightMode, MatsuriLightSpec> = {
  "hanabi_burst_riverside": {
    "badge": "🎆花火绽放夜空",
    "backlit": true,
    "pos": "colorful summer fireworks overhead, magenta-gold reflections, dark riverbank shadows, warm rim light",
    "prose": "beneath colorful summer fireworks bursting across the night sky.",
    "neg": "daylight, bright sun, clear blue sky, indoors, bedroom"
  },
  "yatai_chochin_amber": {
    "badge": "🏮屋台提灯暖影",
    "backlit": false,
    "pos": "warm festival chochin lanterns, yatai tungsten glow, deep night shadows",
    "prose": "in deep night shadows beside warm glowing festival paper lanterns.",
    "neg": "daylight, bright sun, clear blue sky, modern bedroom, office"
  },
  "shrine_torii_moonlight": {
    "badge": "⛩️神社石灯月影",
    "backlit": false,
    "pos": "cool silver moonlight through trees, dim stone toro lantern, quiet shrine shadows",
    "prose": "in moonlit shrine grove shadows beside a flickering stone lantern.",
    "neg": "daylight, bright sun, neon sign, modern building, bedroom"
  },
  "sparkler_close_glow": {
    "badge": "🎇线香花火微光",
    "backlit": false,
    "pos": "warm orange handheld sparkler glow, crackling embers in darkness, intimate warm skin light",
    "prose": "illuminated up close by the warm orange glow of a crackling sparkler.",
    "neg": "daylight, bright sun, harsh ceiling light, indoors, bedroom"
  },
  "festival_crowd_bokeh": {
    "badge": "🎐夜市散景暗巷",
    "backlit": true,
    "pos": "deep shadowed narrow alley, colorful festival lantern bokeh, distant blurred silhouettes",
    "prose": "hidden in dark alley shadows just steps from glowing festival lantern bokeh.",
    "neg": "daylight, bright sun, clear blue sky, indoors, bedroom"
  }
};

export const MATSURI_ANTI_INDOOR_UC = "bed, mattress, pillow, bedroom, couch, sofa, modern bathroom, bathtub, hot spring";
export const MATSURI_CROWD_GUARD_UC = "crowd watching, onlookers looking, voyeur, group sex, gangbang, 3boys";
export const MATSURI_UNDERGARMENT_UC = "bra, panties, underwear";
export const MATSURI_BAREFOOT_BAN_UC = "shoes, footwear, sneakers, boots, thighhighs, stockings, socks, pantyhose, geta";
export const MATSURI_GETA_SOCK_BAN_UC = "sneakers, boots, high heels, thighhighs, pantyhose, modern shoes";
export const MATSURI_SOLO_SPREAD_EXTRA_UC = "covering crotch, covering pussy, hand over crotch, holding own penis, grabbing penis, extra arms, 3 arms";
export const MATSURI_PURE_SPREAD_ANTI_CUM_UC = "cum, semen, cum in pussy, cum in ass, cum overflow, cumdrip, after sex";
export const MATSURI_SOLO_PARTNER_BAN_UC = "2boys, multiple boys, man, hetero, penetration, insertion, 2girls, multiple girls";

export interface RawMatsuriActionEntry {
  id: string;
  title: string;
  sub: string;
  category: MatsuriActionCategory;
  canvas: "竖图 832x1216" | "横图 1216x832";
  is_solo: boolean;
  is_precoital_invite?: boolean;
  is_yuri_showcase?: boolean;
  matsuri_camera_mode: MatsuriCameraMode;
  matsuri_light_mode: MatsuriLightMode;
  chest_covered: boolean;
  barefoot: boolean;
  framing_tags: string;
  env_tags: string;
  core_prop_tags: string;
  outfit_tags: string;
  femboy_outfit_tags?: string;
  c2_outfit_tags?: string;
  partner_tags?: string;
  expr_tags: string;
  female_tags: string;
  femboy_tags: string;
  futa_tags: string;
  prose: string;
  prose_outfit_phrase?: string;
  extra_neg: string;
  solo_spread_spec?: OnsenSoloSpreadSpec;
}

export const ALL_RAW_MATSURI_ENTRIES: RawMatsuriActionEntry[] = [
  {
    "id": "MTS01",
    "title": "花火人潮末排·宽袖团扇掩护贴背站立偷偷后入",
    "sub": "Fireworks Crowd Back-Row Uchiwa-Fan Cover Secret Standing Rear",
    "category": "24. 夏日祭典",
    "canvas": "竖图 832x1216",
    "is_solo": false,
    "matsuri_camera_mode": "3rd",
    "matsuri_light_mode": "hanabi_burst_riverside",
    "chest_covered": true,
    "barefoot": false,
    "framing_tags": "cowboy shot, 1.65::from behind::, 1.55::rear view::, 1.5::looking back::, bent forward slightly",
    "env_tags": "riverbank, distant blurred yukata silhouettes, fireworks, dark tree trunk shadow",
    "core_prop_tags": "one hand holding 1.6::uchiwa:: fan, hiding mouth in profile, other hand clutching sleeve",
    "outfit_tags": "adult woman, navy floral 1.6::yukata::, back of yukata, intact shoulders, yellow obi bow on back, back hem lifted, 1.45::ass::",
    "femboy_outfit_tags": "navy floral 1.6::yukata::, back of yukata, intact shoulders, yellow obi bow on back, back hem lifted, 1.45::ass::",
    "partner_tags": "1.5::faceless male:: in dark yukata, pelvis pressed against ass, penetrating from behind, lifting hem",
    "expr_tags": "flushed cheek above fan, nervous eyes, suppressed gasp",
    "female_tags": "1.6::sex from behind::, 1.55::vaginal::, 1.55::penetration::, 1.45::standing sex::, 1.45::cumdrip::",
    "femboy_tags": "1.6::sex from behind::, 1.55::anal::, 1.55::penetration::, 1.45::standing sex::, 1.4::small penis::",
    "futa_tags": "1.6::sex from behind::, 1.5::vaginal::, 1.55::penetration::, 1.45::standing sex::, 1.45::ejaculation::",
    "prose": "Rear view in dark tree shadows: a partner lifts the hem of an adult woman in a navy yukata, penetrating her from behind in standing sex as she leans forward glancing back behind a fan.",
    "prose_outfit_phrase": "in a navy yukata",
    "extra_neg": "bed, mattress, pillow, bedroom, couch, sofa, modern bathroom, bathtub, hot spring, crowd watching, onlookers looking, voyeur, group sex, gangbang, 3boys, sneakers, boots, high heels, thighhighs, pantyhose, modern shoes, pov, front view, straight-on, facing viewer, frontal, facing camera, pussy from front, pubic hair, bare back, off-shoulder, bare shoulders, floating penis, disembodied penis"
  },
  {
    "id": "MTS02",
    "title": "屋台摊位红布帘下·手拎金鱼袋蹲跪桌底隐秘口交",
    "sub": "Under Festival Yatai Stall Curtain Goldfish-Bag Secret Fellatio POV",
    "category": "24. 夏日祭典",
    "canvas": "竖图 832x1216",
    "is_solo": false,
    "matsuri_camera_mode": "pov",
    "matsuri_light_mode": "yatai_chochin_amber",
    "chest_covered": true,
    "barefoot": false,
    "framing_tags": "1.6::pov::, 1.6::from above::, downward angle looking under curtain, crouching on crate, 1.55::pov crotch::, male pelvis at bottom foreground",
    "env_tags": "behind yatai stall, red-white curtain, lantern slit light on ground",
    "core_prop_tags": "1.55::kitsune mask:: on side of head, left hand holding goldfish bag, two 1.55::goldfish::, right hand flat on viewer thigh, hands away from shaft",
    "outfit_tags": "adult woman, crimson 1.6::yukata::, collar closed, white obi, crouching",
    "femboy_outfit_tags": "crimson 1.6::yukata::, collar closed, white obi, crouching",
    "partner_tags": "viewer behind stall counter, male thighs at bottom edge, penis entering from bottom foreground, viewer hand on head",
    "expr_tags": "1.55::looking up::, teary eyes, blush, 1.6::fellatio::, lips wrapped around shaft, saliva",
    "female_tags": "oral, penis in mouth, wet lips",
    "femboy_tags": "oral, fellatio, wet lips",
    "futa_tags": "oral, fellatio, wet lips",
    "prose": "Downward POV behind a stall curtain, an adult woman wearing a crimson floral yukata and a side kitsune mask crouching on a crate with a goldfish bag during fellatio.",
    "prose_outfit_phrase": "wearing a crimson floral yukata and a side kitsune mask",
    "extra_neg": "bed, mattress, pillow, bedroom, couch, sofa, modern bathroom, bathtub, hot spring, crowd watching, onlookers looking, voyeur, group sex, gangbang, 3boys, sneakers, boots, high heels, thighhighs, pantyhose, modern shoes, male head, male back, male face, 3 hands, vaginal, floating penis, disembodied penis, disconnected penis"
  },
  {
    "id": "MTS03",
    "title": "夜市木屋窄巷夹缝·手举红亮苹果糖捂嘴抬腿壁咚",
    "sub": "Narrow Dark Alley Beside Lantern Street Candied-Apple Wall-Pin POV",
    "category": "24. 夏日祭典",
    "canvas": "竖图 832x1216",
    "is_solo": false,
    "matsuri_camera_mode": "pov",
    "matsuri_light_mode": "festival_crowd_bokeh",
    "chest_covered": true,
    "barefoot": false,
    "framing_tags": "cowboy shot, 1.55::pov::, close frontal alley view, pinned against wooden wall, 1.55::leg lift::, one leg hooked high",
    "env_tags": "narrow wooden building gap, festival lantern street bokeh nearby, distant silhouettes at entrance, deep shadow",
    "core_prop_tags": "left hand holding 1.65::candied apple::, glossy red stick, right 1.6::hand over mouth:: stifling moans",
    "outfit_tags": "adult woman, ivory peony 1.6::yukata::, collar covering chest, crimson obi, skirt parted, wooden geta",
    "femboy_outfit_tags": "ivory peony 1.6::yukata::, collar covering chest, crimson obi, skirt parted, wooden geta",
    "partner_tags": "pov crotch, pov hand holding raised thigh, penetration",
    "expr_tags": "embarrassed blush, teary eyes glancing toward entrance, muffled whimpers behind palm",
    "female_tags": "1.55::vaginal::, standing alley insertion, 1.45::cum overflow:: down leg",
    "femboy_tags": "1.55::anal::, standing alley insertion, 1.4::small penis::",
    "futa_tags": "1.5::vaginal::, standing alley insertion, 1.45::ejaculation::",
    "prose": "First-person POV in a dark wooden alley beside lantern bokeh, pinning an adult woman in an ivory floral yukata against the wall with one leg lifted while she holds a candied apple and covers her mouth.",
    "prose_outfit_phrase": "in an ivory floral yukata",
    "extra_neg": "bed, mattress, pillow, bedroom, couch, sofa, modern bathroom, bathtub, hot spring, crowd watching, onlookers looking, voyeur, group sex, gangbang, 3boys, sneakers, boots, high heels, thighhighs, pantyhose, modern shoes, male head, male back, solo, no penis"
  },
  {
    "id": "MTS04",
    "title": "神社手水舍竹篱背面·湿手撑青石水槽咬唇偷偷后入",
    "sub": "Behind Shrine Chozuya Bamboo Screen Biting-Lip Stealth Doggy POV",
    "category": "24. 夏日祭典",
    "canvas": "竖图 832x1216",
    "is_solo": false,
    "matsuri_camera_mode": "pov",
    "matsuri_light_mode": "shrine_torii_moonlight",
    "chest_covered": true,
    "barefoot": false,
    "framing_tags": "cowboy shot, 1.55::pov::, 1.55::from behind::, rear downward angle, leaning over stone basin, 1.5::doggystyle::, 1.45::looking back::",
    "env_tags": "outdoors night, behind shrine chozuya pavilion, mossy stone water basin, bamboo water spout, bamboo fence screen",
    "core_prop_tags": "wet hands gripping stone rim, leaning over water basin",
    "outfit_tags": "adult woman, pink firework 1.6::yukata::, collar closed over chest, purple obi bow, back skirt flipped",
    "femboy_outfit_tags": "pink firework 1.6::yukata::, collar closed over chest, purple obi bow, back skirt flipped",
    "partner_tags": "pov crotch, pov hand gripping hip, rear penetration",
    "expr_tags": "glancing back over shoulder, teary misty eyes, 1.6::biting lip::, flushed red ears",
    "female_tags": "1.55::vaginal::, standing rear entry, 1.5::cumdrip:: down thighs",
    "femboy_tags": "1.55::anal::, standing rear entry, trembling thighs",
    "futa_tags": "1.5::vaginal::, standing rear entry, 1.4::cumdrip::",
    "prose": "Rear POV in moonlit shadows behind a shrine chozuya bamboo screen as an adult woman in a pink floral yukata braces wet hands on the mossy stone basin and bites her lip glancing back.",
    "prose_outfit_phrase": "in a pink floral yukata",
    "extra_neg": "bed, mattress, pillow, bedroom, couch, sofa, modern bathroom, bathtub, hot spring, crowd watching, onlookers looking, voyeur, group sex, gangbang, 3boys, sneakers, boots, high heels, thighhighs, pantyhose, modern shoes, modern sink, chrome faucet, male head, male back, front view, 3 arms, extra arms, extra hands"
  },
  {
    "id": "MTS05",
    "title": "祭典公园锁门隔间·腕勾水球悠悠球贴颈隐忍骑乘",
    "sub": "Locked Festival Park Stall Water-Yoyo Embrace Cowgirl POV",
    "category": "24. 夏日祭典",
    "canvas": "竖图 832x1216",
    "is_solo": false,
    "matsuri_camera_mode": "pov",
    "matsuri_light_mode": "yatai_chochin_amber",
    "chest_covered": true,
    "barefoot": false,
    "framing_tags": "close cowboy shot, 1.55::pov::, 1.55::girl on top::, 1.5::straddling:: in narrow stall, facing viewer closely",
    "env_tags": "narrow park restroom stall, locked metal door latch behind, warm lantern glow through vent",
    "core_prop_tags": "left arm around viewer neck, right hand holding 1.6::water yo-yo:: string",
    "outfit_tags": "adult woman, sky-blue hydrangea 1.6::yukata::, collar covering chest, coral obi, hem bunched at waist, bare thighs",
    "femboy_outfit_tags": "sky-blue hydrangea 1.6::yukata::, collar covering chest, coral obi, hem bunched at waist, bare thighs",
    "partner_tags": "pov crotch, seated on closed lid, hands on thighs",
    "expr_tags": "1.6::biting lip::, breathless flushed face, teary half-closed eyes, sweat droplets",
    "female_tags": "1.55::vaginal::, deep lap straddle, 1.45::cum overflow::",
    "femboy_tags": "1.55::anal::, deep lap straddle, 1.4::small penis::",
    "futa_tags": "1.5::vaginal::, deep lap straddle, 1.45::ejaculation::",
    "prose": "Close POV inside a locked park stall lit by lantern glow through the vent, an adult woman in a sky-blue floral yukata straddling his lap with one arm around his neck and a water yo-yo in hand.",
    "prose_outfit_phrase": "in a sky-blue floral yukata",
    "extra_neg": "bed, mattress, pillow, bedroom, couch, sofa, modern bathroom, bathtub, hot spring, crowd watching, onlookers looking, voyeur, group sex, gangbang, 3boys, sneakers, boots, high heels, thighhighs, pantyhose, modern shoes, male head, male back, open stall door, 3 arms, extra arms, extra hands"
  },
  {
    "id": "MTS06",
    "title": "绘马祈愿木架背面·抓紧满墙木牌缝隙窥外踮脚后入",
    "sub": "Behind Wooden Ema Prayer Wall Peeking-Through-Plaques Tiploe Rear",
    "category": "24. 夏日祭典",
    "canvas": "竖图 832x1216",
    "is_solo": false,
    "matsuri_camera_mode": "3rd",
    "matsuri_light_mode": "festival_crowd_bokeh",
    "chest_covered": true,
    "barefoot": false,
    "framing_tags": "full body, 3rd-person rear-side view, behind wooden prayer rack, 1.55::from behind::, standing on tiptoes",
    "env_tags": "outdoors night, dark rear shrine 1.65::ema:: wall, hanging wooden plaques, lantern light through gaps",
    "core_prop_tags": "hands gripping rack post, peeking through plaque gap, heels raised off wooden 1.5::geta::",
    "outfit_tags": "adult woman, lavender wisteria 1.6::yukata::, collar closed over chest, crimson obi, back skirt tucked up, bare legs",
    "femboy_outfit_tags": "lavender wisteria 1.6::yukata::, collar closed over chest, crimson obi, back skirt tucked up, bare legs",
    "partner_tags": "faceless male in unbuttoned dark yukata, behind in shadow, gripping waist",
    "expr_tags": "nervous blushed profile peeking, bitten lip, teary wide eyes",
    "female_tags": "1.55::vaginal::, tiptoe rear insertion, 1.45::cumdrip:: down thighs",
    "femboy_tags": "1.55::anal::, tiptoe rear insertion, 1.4::small penis::",
    "futa_tags": "1.5::vaginal::, tiptoe rear insertion, 1.45::ejaculation::",
    "prose": "Third-person view in shadow behind a wooden shrine ema wall as an adult woman in a lavender floral yukata rises on tiptoes, peeking nervously through plaques while taken from behind.",
    "prose_outfit_phrase": "in a lavender floral yukata",
    "extra_neg": "bed, mattress, pillow, bedroom, couch, sofa, modern bathroom, bathtub, hot spring, crowd watching, onlookers looking, voyeur, group sex, gangbang, 3boys, sneakers, boots, high heels, thighhighs, pantyhose, modern shoes, pov"
  },
  {
    "id": "MTS07",
    "title": "朱红本殿高床廊底·钻入幽暗木柱下仰躺捂嘴正常位",
    "sub": "Under Raised Shrine Wooden Engawa Veranda Hand-Over-Mouth Missionary POV",
    "category": "24. 夏日祭典",
    "canvas": "横图 1216x832",
    "is_solo": false,
    "matsuri_camera_mode": "pov",
    "matsuri_light_mode": "shrine_torii_moonlight",
    "chest_covered": true,
    "barefoot": true,
    "framing_tags": "1.55::pov::, downward angle in crawlspace, 1.55::missionary::, reclining on haori coat, head left, 1.55::spread legs::",
    "env_tags": "low crawlspace under vermilion veranda, heavy wooden pillars, low timber beams overhead, dim lattice light",
    "core_prop_tags": "right 1.6::hand over mouth::, left hand clutching shoulder, wooden geta beside coat",
    "outfit_tags": "adult woman, emerald dragonfly 1.6::yukata::, collar closed over chest, gold obi, lower hem parted, 1.5::bare feet::",
    "femboy_outfit_tags": "emerald dragonfly 1.6::yukata::, collar closed over chest, gold obi, lower hem parted, 1.5::bare feet::",
    "partner_tags": "1.5::pov crotch::, pov penis entering lower-right foreground, hands holding thighs",
    "expr_tags": "flushed cheeks in shadow, misty teary eyes upward, muffled panting behind palm",
    "female_tags": "1.55::vaginal::, crawlspace missionary 1.5::penetration::, 1.5::cum overflow:: on coat",
    "femboy_tags": "1.55::anal::, crawlspace missionary insertion, 1.4::small penis::",
    "futa_tags": "1.5::vaginal::, crawlspace missionary insertion, 1.45::ejaculation::",
    "prose": "Crawlspace POV beneath a raised shrine veranda where an adult woman reclines barefoot on a haori coat in an emerald floral yukata, covering her mouth from footsteps above.",
    "prose_outfit_phrase": "in an emerald floral yukata",
    "extra_neg": "bed, mattress, pillow, bedroom, couch, sofa, modern bathroom, bathtub, hot spring, crowd watching, onlookers looking, voyeur, group sex, gangbang, 3boys, shoes, footwear, sneakers, boots, thighhighs, stockings, socks, pantyhose, wearing geta, bad feet, extra toes, upside-down, inverted, head at bottom, solo, no penis, letterbox"
  },
  {
    "id": "MTS08",
    "title": "河堤古石桥桥洞暗影·水上花火倒影对坐抱腿深插",
    "sub": "Dark Stone Bridge Archway River Fireworks Reflection Lotus Sit",
    "category": "24. 夏日祭典",
    "canvas": "横图 1216x832",
    "is_solo": false,
    "matsuri_camera_mode": "3rd",
    "matsuri_light_mode": "hanabi_burst_riverside",
    "chest_covered": false,
    "barefoot": false,
    "framing_tags": "3rd-person profile under bridge arch, 1.55::sitting on lap::, face-to-face lotus, stone ledge",
    "env_tags": "dark stone bridge underpass, river outside arch, reflected fireworks, distant festival lights",
    "core_prop_tags": "arms around partner shoulders, wooden 1.5::geta:: dangling from toes",
    "outfit_tags": "adult woman, loosened dark-red 1.6::yukata::, off shoulder, bare breasts, 1.35::nipples::, untied obi",
    "femboy_outfit_tags": "loosened dark-red 1.6::yukata::, off shoulder, flat chest, untied obi",
    "partner_tags": "faceless male in dark yukata, seated on stone, holding hips",
    "expr_tags": "foreheads close, crimson blush, misty half-closed eyes, parted lips",
    "female_tags": "1.55::vaginal::, face-to-face lap coupling, 1.45::cumdrip::",
    "femboy_tags": "1.55::anal::, face-to-face lap coupling, 1.4::small penis::",
    "futa_tags": "1.5::vaginal::, face-to-face lap coupling, 1.45::ejaculation::",
    "prose": "View beneath a stone bridge arch framing river fireworks, an adult woman with her crimson floral yukata loosened off her shoulders straddling her partner face-to-face.",
    "prose_outfit_phrase": "with her crimson floral yukata loosened off her shoulders",
    "extra_neg": "bed, mattress, pillow, bedroom, couch, sofa, modern bathroom, bathtub, hot spring, crowd watching, onlookers looking, voyeur, group sex, gangbang, 3boys, sneakers, boots, high heels, thighhighs, pantyhose, modern shoes, pov, letterbox"
  },
  {
    "id": "MTS09",
    "title": "镇守之森注连绳神木后·背靠古树干托单腿悬空侧入",
    "sub": "Behind Sacred Shimenawa Cedar Tree Trunk Leg-Lift Standing Sex",
    "category": "24. 夏日祭典",
    "canvas": "竖图 832x1216",
    "is_solo": false,
    "matsuri_camera_mode": "3rd",
    "matsuri_light_mode": "shrine_torii_moonlight",
    "chest_covered": true,
    "barefoot": false,
    "framing_tags": "full body, 3rd-person side view, back against cedar bark, 1.55::standing sex::, 1.55::leg lift::",
    "env_tags": "shrine forest grove, ancient cedar trunk, braided 1.6::shimenawa:: rope, paper shide, glowing torii",
    "core_prop_tags": "white 1.55::kitsune mask:: on head, arms around neck, wooden geta",
    "outfit_tags": "adult woman, indigo firework 1.6::yukata::, collar closed, crimson obi, skirt pushed up",
    "femboy_outfit_tags": "indigo firework 1.6::yukata::, collar closed, crimson obi, skirt pushed up",
    "partner_tags": "faceless male in dark yukata, pressing against trunk, holding thigh",
    "expr_tags": "head back on bark, moonlit blush, teary eyes, biting lip",
    "female_tags": "1.55::vaginal::, standing leg-lift insertion, 1.45::cumdrip::",
    "femboy_tags": "1.55::anal::, standing leg-lift insertion, 1.4::small penis::",
    "futa_tags": "1.5::vaginal::, standing leg-lift insertion, 1.45::ejaculation::",
    "prose": "View behind a shimenawa cedar trunk in a moonlit shrine grove, a partner lifting one leg of an adult woman in an indigo yukata and kitsune mask against the bark.",
    "prose_outfit_phrase": "in an indigo yukata and kitsune mask",
    "extra_neg": "bed, mattress, pillow, bedroom, couch, sofa, modern bathroom, bathtub, hot spring, crowd watching, onlookers looking, voyeur, group sex, gangbang, 3boys, sneakers, boots, high heels, thighhighs, pantyhose, modern shoes, shibari, rope bondage, pov, 3 arms, extra arms, extra hands"
  },
  {
    "id": "MTS10",
    "title": "祭典后台器材帐篷·堆叠红白灯笼箱旁扶箱背骑乘",
    "sub": "Festival Storage Canvas Tent Beside Chochin Crates Reverse Cowgirl POV",
    "category": "24. 夏日祭典",
    "canvas": "竖图 832x1216",
    "is_solo": false,
    "matsuri_camera_mode": "pov",
    "matsuri_light_mode": "yatai_chochin_amber",
    "chest_covered": true,
    "barefoot": false,
    "framing_tags": "cowboy shot, 1.55::pov::, 1.5::from behind::, rear downward angle, 1.55::reverse cowgirl::, 1.45::looking back::",
    "env_tags": "white canvas storage tent, stacked wooden crates, folded paper lanterns, silhouettes on tent wall",
    "core_prop_tags": "hands bracing on wooden crate, arched spine, hips raised",
    "outfit_tags": "adult woman, coral goldfish 1.6::yukata::, collar closed over chest, green obi bow, back skirt flipped",
    "femboy_outfit_tags": "coral goldfish 1.6::yukata::, collar closed over chest, green obi bow, back skirt flipped",
    "partner_tags": "pov crotch, pov hands gripping waist, seated on crate",
    "expr_tags": "glancing back toward tent flap, scarlet blush, misty teary eyes, parted lips",
    "female_tags": "1.55::vaginal::, reverse cowgirl in tent, 1.5::cum overflow::",
    "femboy_tags": "1.55::anal::, reverse cowgirl in tent, trembling thighs",
    "futa_tags": "1.5::vaginal::, reverse cowgirl in tent, 1.4::cumdrip::",
    "prose": "Rear POV inside a canvas storage tent lined with lantern crates and outside wall silhouettes, as an adult woman in a coral yukata straddles his lap bracing on a crate.",
    "prose_outfit_phrase": "in a coral yukata",
    "extra_neg": "bed, mattress, pillow, bedroom, couch, sofa, modern bathroom, bathtub, hot spring, crowd watching, onlookers looking, voyeur, group sex, gangbang, 3boys, sneakers, boots, high heels, thighhighs, pantyhose, modern shoes, camping dome tent, sleeping bag, male head, male back, front view"
  },
  {
    "id": "MTS11",
    "title": "竹林石阶双姝偷溜·狐面少女捂唇抵栏百合暗处指交",
    "sub": "Bamboo Shrine Steps Kitsune-Mask Contrast-Yukata Stealth Yuri Fingering",
    "category": "24. 夏日祭典",
    "canvas": "横图 1216x832",
    "is_solo": false,
    "is_yuri_showcase": true,
    "matsuri_camera_mode": "3rd",
    "matsuri_light_mode": "sparkler_close_glow",
    "chest_covered": true,
    "barefoot": false,
    "framing_tags": "cowboy shot, 3rd-person view, bamboo steps, against wooden railing",
    "env_tags": "bamboo shrine steps, stone lantern, sparkler bucket, festival bokeh",
    "core_prop_tags": "covering partner's lips, reaching beneath lifted hem",
    "outfit_tags": "sakura-pink 1.6::yukata::, collar closed, crimson obi, lifted skirt",
    "c2_outfit_tags": "navy-blue 1.6::yukata::, collar closed, yellow obi, 1.55::kitsune mask::",
    "expr_tags": "flushed cheeks, teary half-closed eyes, muffled gasps",
    "female_tags": "1.6::fingering::, 1.5::pussy juice:: on thighs",
    "femboy_tags": "2boys yaoi yukata fondling",
    "futa_tags": "futanari on female yukata yuri",
    "prose": "Two girls in contrasting sakura-pink and navy-blue summer yukatas on bamboo steps, the kitsune-masked girl covering her mouth while fingering beneath her hem.",
    "prose_outfit_phrase": "in contrasting sakura-pink and navy-blue summer yukatas",
    "extra_neg": "bed, mattress, pillow, bedroom, couch, sofa, modern bathroom, bathtub, hot spring, crowd watching, onlookers looking, voyeur, group sex, gangbang, 3boys, scissoring, 5 arms, 3 arms, fused arms, 5 legs, 3 legs, letterbox"
  },
  {
    "id": "MTS12",
    "title": "鸟居偏僻石阶·执线香花火微蹲掀浴衣前摆暗处相邀（单人）",
    "sub": "Secluded Torii Stone Steps Sparkler Squat Skirt-Lift Invite Solo",
    "category": "24. 夏日祭典",
    "canvas": "竖图 832x1216",
    "is_solo": true,
    "is_precoital_invite": true,
    "matsuri_camera_mode": "pov",
    "matsuri_light_mode": "sparkler_close_glow",
    "chest_covered": true,
    "barefoot": false,
    "framing_tags": "full body, 1.6::pov::, 1.6::from below::, low frontal angle, wide 1.6::squatting::, 1.65::spread legs::",
    "env_tags": "secluded stone stairs near vermilion torii, dark cedar trees, metal water bucket",
    "core_prop_tags": "one hand holding 1.65::sparkler:: low, warm sparks on thighs, other hand lifting hem",
    "outfit_tags": "adult woman, crimson firework 1.6::yukata::, collar closed, gold obi, 1.6::skirt lift::, wooden 1.55::geta::",
    "femboy_outfit_tags": "crimson firework 1.6::yukata::, collar closed, gold obi, 1.6::skirt lift::, wooden 1.55::geta::",
    "expr_tags": "shy crimson blush, upturned 1.55::half-closed eyes::, secretive smile",
    "female_tags": "bare glistening 1.45::pussy::, 1.45::pussy juice::",
    "femboy_tags": "1.45::small penis::, 1.4::erect penis::",
    "futa_tags": "1.45::erect penis::, glistening arousal",
    "prose": "Low-angle POV on dark shrine steps where an adult woman squats in wooden geta holding a crackling sparkler while lifting her crimson floral yukata hem.",
    "prose_outfit_phrase": "lifting her crimson floral yukata hem",
    "extra_neg": "bed, mattress, pillow, bedroom, couch, sofa, modern bathroom, bathtub, hot spring, crowd watching, onlookers looking, voyeur, group sex, gangbang, 3boys, sneakers, boots, high heels, thighhighs, pantyhose, modern shoes",
    "solo_spread_spec": {
      "archetype": "one_hand_prop_frontal",
      "spread_outfit_override": "adult woman, crimson firework 1.6::yukata::, collar closed, front hem tucked in gold obi, wooden 1.55::geta::",
      "spread_femboy_outfit_override": "crimson firework 1.6::yukata::, collar closed, front hem tucked in gold obi, wooden 1.55::geta::",
      "spread_prop_tags": "one hand holding 1.65::sparkler:: steady, other hand spreading between squatting thighs",
      "spread_female_tags": "1.4::labia::, 1.3::spread pussy::, 1.6::spreading own pussy::, fingers, 1.5::pussy juice::",
      "spread_femboy_tags": "1.45::small penis::, 1.5::spread anus::, 1.55::spreading own ass::, fingers",
      "spread_futa_tags": "1.45::erect penis::, 1.4::labia::, 1.3::spread pussy::, 1.55::spreading own pussy::, fingers",
      "spread_prose_suffix": " with hem tucked in her obi while her free hand spreads open.",
      "spread_cum_female_tags": "1.55::after sex::, 1.4::labia::, 1.3::spread pussy::, 1.6::spreading own pussy::, fingers, 1.6::cum in pussy::, 1.6::cum overflow::, 1.55::cumdrip::",
      "spread_cum_femboy_tags": "1.55::after sex::, 1.55::after anal::, 1.45::small penis::, 1.5::spread anus::, 1.55::spreading own ass::, fingers, 1.6::cum in ass::, 1.55::cumdrip::",
      "spread_cum_futa_tags": "1.55::after sex::, 1.45::erect penis::, 1.4::labia::, 1.3::spread pussy::, 1.55::spreading own pussy::, fingers, 1.6::cum in pussy::, 1.55::cum overflow::",
      "spread_cum_prose_suffix": " with hem tucked in her obi as white cum drips onto the stone step."
    }
  },
  {
    "id": "MTS13",
    "title": "河堤高草丛背面·口咬苹果糖木签M字坐垫相邀（单人）",
    "sub": "Behind Tall Riverbank Grass Candied-Apple-in-Mouth M-Spread Solo",
    "category": "24. 夏日祭典",
    "canvas": "竖图 832x1216",
    "is_solo": true,
    "is_precoital_invite": true,
    "matsuri_camera_mode": "pov",
    "matsuri_light_mode": "hanabi_burst_riverside",
    "chest_covered": true,
    "barefoot": true,
    "framing_tags": "full body, 1.55::pov::, overhead view in grass shelter, reclining on mat, 1.65::m legs::, 1.5::bare feet::",
    "env_tags": "hidden clearing behind riverbank reeds, bursting night fireworks, wooden geta off mat, paper fan",
    "core_prop_tags": "glossy red 1.65::candied apple::, stick 1.6::in mouth::, hands bracing on mat",
    "outfit_tags": "adult woman, turquoise summer 1.6::yukata::, collar closed, front hem tucked in crimson obi, 1.5::bare feet::",
    "femboy_outfit_tags": "turquoise summer 1.6::yukata::, collar closed, front hem tucked in crimson obi, 1.5::bare feet::",
    "expr_tags": "firework-lit blush, playful 1.55::half-closed eyes::, teasing gaze",
    "female_tags": "M-spread bare thighs, bare glistening 1.45::pussy::, 1.45::pussy juice::",
    "femboy_tags": "M-spread bare thighs, 1.45::small penis::, 1.4::erect penis::",
    "futa_tags": "M-spread bare thighs, 1.45::erect penis::, glistening cleft",
    "prose": "Overhead POV behind tall riverbank grass beneath bursting fireworks, where an adult woman sits barefoot in a turquoise yukata with M-spread knees holding a candied apple in her mouth.",
    "prose_outfit_phrase": "in a turquoise yukata",
    "extra_neg": "bed, mattress, pillow, bedroom, couch, sofa, modern bathroom, bathtub, hot spring, crowd watching, onlookers looking, voyeur, group sex, gangbang, 3boys, shoes, footwear, sneakers, boots, thighhighs, stockings, socks, pantyhose, wearing geta, bad feet, extra toes, upside-down, inverted",
    "solo_spread_spec": {
      "archetype": "two_hand_symmetrical",
      "spread_prop_tags": "red 1.65::candied apple::, stick 1.6::in mouth::, both hands spreading symmetrically",
      "spread_female_tags": "1.4::labia::, 1.35::spread pussy::, 1.65::spreading own pussy::, both hands fingers, 1.5::pussy juice::",
      "spread_femboy_tags": "1.45::small penis::, 1.5::spread anus::, 1.6::spreading own ass::, both hands fingers",
      "spread_futa_tags": "1.45::erect penis::, 1.4::labia::, 1.35::spread pussy::, 1.6::spreading own pussy::, both hands fingers",
      "spread_prose_suffix": " while both hands spread open symmetrically between her barefoot thighs.",
      "spread_cum_female_tags": "1.55::after sex::, 1.4::labia::, 1.35::spread pussy::, 1.65::spreading own pussy::, both hands fingers, 1.65::cum in pussy::, 1.6::cum overflow::, 1.55::cumdrip::",
      "spread_cum_femboy_tags": "1.55::after sex::, 1.55::after anal::, 1.45::small penis::, 1.5::spread anus::, 1.6::spreading own ass::, both hands fingers, 1.6::cum in ass::, 1.6::cum overflow::",
      "spread_cum_futa_tags": "1.55::after sex::, 1.45::erect penis::, 1.4::labia::, 1.35::spread pussy::, 1.6::spreading own pussy::, both hands fingers, 1.65::cum in pussy::, 1.6::cum overflow::",
      "spread_cum_prose_suffix": " while both hands spread open as white cum overflows onto the mat."
    }
  },
  {
    "id": "MTS14",
    "title": "屋台后巷啤酒箱小憩·冰弹珠汽水贴颊散热敞摆诱惑（单人）",
    "sub": "Back-Alley Beer Crate Cold Ramune Bottle Against Cheek Invite Solo",
    "category": "24. 夏日祭典",
    "canvas": "竖图 832x1216",
    "is_solo": true,
    "is_precoital_invite": true,
    "matsuri_camera_mode": "pov",
    "matsuri_light_mode": "yatai_chochin_amber",
    "chest_covered": true,
    "barefoot": false,
    "framing_tags": "full body, 1.55::pov::, low frontal alley view, seated on overturned crate, 1.65::spread legs::",
    "env_tags": "quiet back alley behind stalls, yellow beer crates, glowing red chochin lantern, wooden fence",
    "core_prop_tags": "blue glass 1.65::ramune bottle:: against cheek, other hand on knee",
    "outfit_tags": "adult woman, mint-green goldfish 1.6::yukata::, collar closed, front hem tucked in coral obi, wooden 1.5::geta::",
    "femboy_outfit_tags": "mint-green goldfish 1.6::yukata::, collar closed, front hem tucked in coral obi, wooden 1.5::geta::",
    "expr_tags": "summer crimson blush, languid 1.55::half-closed eyes::, cooling warm cheek",
    "female_tags": "parted bare thighs, bare glistening 1.45::pussy::, 1.45::pussy juice::",
    "femboy_tags": "parted bare thighs, 1.45::small penis::, 1.4::erect penis::",
    "futa_tags": "parted bare thighs, 1.45::erect penis::, glistening arousal",
    "prose": "Low POV in a lantern-lit festival alley where an adult woman sits wide-legged on a crate in a mint-green yukata, pressing a cold glass ramune bottle against her flushed cheek.",
    "prose_outfit_phrase": "in a mint-green yukata",
    "extra_neg": "bed, mattress, pillow, bedroom, couch, sofa, modern bathroom, bathtub, hot spring, crowd watching, onlookers looking, voyeur, group sex, gangbang, 3boys, sneakers, boots, high heels, thighhighs, pantyhose, modern shoes, plastic soda bottle, aluminum can",
    "solo_spread_spec": {
      "archetype": "one_hand_prop_frontal",
      "spread_prop_tags": "blue glass 1.65::ramune bottle:: against cheek, other hand spreading between knees",
      "spread_female_tags": "1.4::labia::, 1.3::spread pussy::, 1.6::spreading own pussy::, fingers, 1.5::pussy juice::",
      "spread_femboy_tags": "1.45::small penis::, 1.5::spread anus::, 1.55::spreading own ass::, fingers",
      "spread_futa_tags": "1.45::erect penis::, 1.4::labia::, 1.3::spread pussy::, 1.55::spreading own pussy::, fingers",
      "spread_prose_suffix": " while her free hand spreads open between her thighs on the crate.",
      "spread_cum_female_tags": "1.55::after sex::, 1.4::labia::, 1.3::spread pussy::, 1.6::spreading own pussy::, fingers, 1.6::cum in pussy::, 1.6::cum overflow::, 1.55::cumdrip::",
      "spread_cum_femboy_tags": "1.55::after sex::, 1.55::after anal::, 1.45::small penis::, 1.5::spread anus::, 1.55::spreading own ass::, fingers, 1.6::cum in ass::, 1.55::cumdrip::",
      "spread_cum_futa_tags": "1.55::after sex::, 1.45::erect penis::, 1.4::labia::, 1.3::spread pussy::, 1.55::spreading own pussy::, fingers, 1.6::cum in pussy::, 1.55::cum overflow::",
      "spread_cum_prose_suffix": " while her free hand spreads open as white cum drips onto the crate."
    }
  },
  {
    "id": "MTS15",
    "title": "石灯笼树影木栏杆·团扇半遮羞脸回眸暗处掀后摆相邀（单人）",
    "sub": "Shrine Grove Railing Uchiwa-Fan Hiding Blush Lookback Rear Invite Solo",
    "category": "24. 夏日祭典",
    "canvas": "竖图 832x1216",
    "is_solo": true,
    "is_precoital_invite": true,
    "matsuri_camera_mode": "pov",
    "matsuri_light_mode": "shrine_torii_moonlight",
    "chest_covered": true,
    "barefoot": false,
    "framing_tags": "cowboy shot, 1.55::pov::, 1.55::from behind::, low rear view, leaning on wooden railing, 1.55::looking back::",
    "env_tags": "shadowed shrine path, maple branches, mossy stone toro lantern, distant lantern glow",
    "core_prop_tags": "bamboo 1.6::uchiwa:: fan hiding lips, other hand lifting back hem",
    "outfit_tags": "adult woman, violet peony 1.6::yukata::, collar closed, yellow obi, 1.6::skirt lift:: at back",
    "femboy_outfit_tags": "violet peony 1.6::yukata::, collar closed, yellow obi, 1.6::skirt lift:: at back",
    "expr_tags": "glancing back above fan, shy scarlet blush, dewy inviting eyes",
    "female_tags": "rounded buttocks, 1.5::pussy from behind::, glistening cleft",
    "femboy_tags": "rounded buttocks, 1.4::small penis:: from behind",
    "futa_tags": "rounded buttocks, 1.45::erect penis::, cleft from behind",
    "prose": "Low rear POV along a moonlit shrine railing as an adult woman hides her blush behind a bamboo fan and glances back while lifting the back hem of her violet yukata.",
    "prose_outfit_phrase": "lifting the back hem of her violet yukata",
    "extra_neg": "bed, mattress, pillow, bedroom, couch, sofa, modern bathroom, bathtub, hot spring, crowd watching, onlookers looking, voyeur, group sex, gangbang, 3boys, sneakers, boots, high heels, thighhighs, pantyhose, modern shoes, front view, torso twisted 180",
    "solo_spread_spec": {
      "archetype": "rear_lookback_one_hand",
      "spread_outfit_override": "adult woman, violet peony 1.6::yukata::, collar closed, back hem tucked in yellow obi",
      "spread_femboy_outfit_override": "violet peony 1.6::yukata::, collar closed, back hem tucked in yellow obi",
      "spread_prop_tags": "bamboo 1.6::uchiwa:: fan hiding lips, other hand reaching back spreading",
      "spread_female_tags": "1.55::pussy from behind::, 1.4::labia::, 1.3::spread pussy::, 1.6::spreading own pussy::, hand reaching back, 1.5::pussy juice::",
      "spread_femboy_tags": "1.4::small penis:: from behind, 1.5::spread anus::, 1.6::spreading own ass::, hand reaching back",
      "spread_futa_tags": "1.45::erect penis::, 1.55::pussy from behind::, 1.35::spread pussy::, 1.55::spreading own pussy::, hand reaching back",
      "spread_prose_suffix": " with back hem tucked in her obi while reaching back to spread open.",
      "spread_cum_female_tags": "1.55::after sex::, 1.55::pussy from behind::, 1.4::labia::, 1.3::spread pussy::, 1.6::spreading own pussy::, hand reaching back, 1.6::cum in pussy::, 1.6::cum overflow::, 1.55::cumdrip::",
      "spread_cum_femboy_tags": "1.55::after sex::, 1.55::after anal::, 1.4::small penis:: from behind, 1.5::spread anus::, 1.6::spreading own ass::, hand reaching back, 1.6::cum in ass::, 1.55::cumdrip::",
      "spread_cum_futa_tags": "1.55::after sex::, 1.45::erect penis::, 1.55::pussy from behind::, 1.35::spread pussy::, 1.55::spreading own pussy::, hand reaching back, 1.6::cum in pussy::, 1.55::cumdrip::",
      "spread_cum_prose_suffix": " with back hem tucked in her obi while spreading open as white cum trails down."
    }
  }
];
