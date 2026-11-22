---
name: nai-camping-picnic
description: Empirically calibrated NovelAI V4.5 / V5 Outdoor Camping & Woodland Picnic (露营野餐 / 野外帐篷与草地野餐玩法) prompt engineering guide. Covers 12 outdoor camp & meadow picnic compositions across day-to-night venues (gingham picnic blanket strawberry missionary, swaying pine hammock straddle, lakeside roll-top table pour-over coffee kettle, shade-tarp ice cooler box all-fours, sunset folding canvas chair roasted marshmallow, unzipped dome tent entrance peeking head out muffled, lantern-lit tent shared sleeping bag spooning, crackling campfire wool blanket hot cocoa mug, starry Milky Way SUV tailgate fairy lights, shallow forest stream barefoot chilled watermelon, forest solar camp shower bag against pine trunk, and 2girls sunlit flower-meadow grape-feeding picnic), 5 outdoor camp lighting modes, chest-coverage discipline, barefoot FOOT_ANAT_UC locks, and 4-mode Multi-Box gender isolation.
---

# NovelAI V4.5 / V5 Outdoor Camping & Woodland Picnic (`CP01–CP12` · 露营野餐) Skill

This skill documents the empirically verified prompt architecture for **12 Outdoor Camping & Meadow Picnic Compositions (`CP01–CP12`)** on NovelAI V5 Full (`nai-diffusion-5-full`, `28 steps, CFG 6.8`).

See also [camping_picnic_catalog.md](references/camping_picnic_catalog.md) for the creative scene inspiration menu.

---

## 1. Outdoor Wardrobe, Lighting & Chest-Coverage Calibration

### A. Five Dedicated Camping & Picnic Lighting Modes
1. **`dappled_meadow_picnic` (`CP01, CP02, CP04, CP10, CP12`)**: `dappled golden sunlight filtering through green tree leaves / pine canopy, sparkling summer stream reflections or blooming meadow bokeh`
2. **`golden_hour_lakeside` (`CP03, CP05, CP06, CP11`)**: `warm golden-hour sunset light reflecting off calm alpine lake or forest campsite, rising white coffee steam or backlit water spray`
3. **`lantern_glowing_tent` (`CP07`)**: `cozy warm amber glow from a hanging vintage LED camp lantern overhead inside nylon tent walls, dark night pines outside mesh window` (add `daylight, bright sun, bedroom wall, wooden bedframe` to UC)
4. **`warm_campfire_ember` (`CP08`)**: `dramatic warm orange firelight and floating glowing embers from crackling stone-ring campfire against deep blue night forest shadows` (add `daylight, indoors, fireplace, living room` to UC)
5. **`starry_milkyway_night` (`CP09`)**: `breathtaking 1.6::starry sky:: and glowing Milky Way overhead, warm golden 1.55::fairy lights:: strung along open camper SUV tailgate` (add `daylight, indoors, sedan front seat, steering wheel` to UC)

### B. Proactive Chest-Coverage vs. Active Chest-Contact Discipline
- **No Direct Chest Contact (`CP01, CP02, CP03, CP04, CP06, CP08, CP09, CP10, CP12`)**:
  - Keep casual outdoor tops/bodices naturally covering the front chest (`intact fitted sundress bodice`, `athletic crop tank under unzipped windbreaker`, `beige camp utility vest over black ribbed top`, `cream turtleneck sleeveless top`, `knotted crop tee with 1.4::sideboob::`) and place `nipples, areolae` in Negative UC so garments look naturally worn mid-activity without unmotivated chest exposure.
- **Motivated Chest Exposure (`CP05, CP07, CP11`)**:
  - Expose bare breasts only when driven by physical touch or water physics (`unbuttoned plaid flannel fondled from behind` on `CP05`; `slipped camisole strap fondled inside sleeping bag` on `CP07`; `soaked clinging crop tank pushed up under hanging solar camp shower` on `CP11`).

### C. Barefoot Creek / Camp-Mat Hygiene & Multi-Box Gender Isolation
- **Barefoot Scenes (`CP04, CP10, CP11`)**: Pair `1.5::bare feet::` with `bad feet, mutated feet, extra toes, 6 toes, missing toes, fused toes, deformed feet, ugly feet, shoes, footwear, sneakers, boots, sandals, thighhighs, stockings, socks, legwear` in Negative UC.
- **Multi-Box Role & Organ Isolation**: Always use `[Base Prompt]` + `[Character 1 (B3)]` + `[Character 2 (D3)]` on `femboy` (`target#anal` / `source#anal`), `futa_no_balls` / `futa_with_balls` (`target#vaginal` + `futanari` on Character 1 / `source#vaginal` + `-2.5::futanari, breasts::` on Character 2), and `2girls` Yuri (`CP12`).

---

## 2. Complete 12-Scene Verified Matrix (`CP01–CP12`)

| Code | Canvas & Verified Seed | Light Mode | Scene Title | Core Outdoor Prop & Posture Anchors |
| :--- | :---: | :---: | :--- | :--- |
| `CP01` | `832×1216` (`s9401122334`) | `dappled_meadow_picnic` | Meadow Gingham Blanket Strawberry POV (`树影红白格野餐垫衔草莓正常位`) | `1.6::checkered blanket::, wicker 1.55::picnic basket::, straw hat, white 1.55::sundress:: + 1.55::skirt lift::, 1.55::strawberry:: at lips` |
| `CP02` | `832×1216` (`s9402233445`) | `dappled_meadow_picnic` | Forest Swaying Hammock Rope-Grip (`双松悬空编织吊床抓绳防翻骑乘`) | `woven 1.65::hammock:: between pine trunks, gripping side ropes tightly, cropped windbreaker + crop tank, 1.55::girl on top::` |
| `CP03` | `832×1216` (`s9403344556`) | `golden_hour_lakeside` | Lakeside Roll-Top Table Pour-Over Coffee (`夕照露营木桌端细嘴壶手冲咖啡后入`) | `wooden folding camp table by lake, silver gooseneck 1.6::kettle:: pouring into glass coffee dripper, camp vest, 1.5::from behind::` |
| `CP04` | `832×1216` (`s9404455667`) | `dappled_meadow_picnic` | Tarp Canopy Ice Cooler Box All-Fours (`天幕下赤足跪趴翻冰桶冷饮后入` · Femboy) | `beige 1.5::camping tarp::, open blue 1.6::cooler box:: with ice & cans, 1.6::all fours::, Multi-Box otoko no ko, barefoot` |
| `CP05` | `832×1216` (`s9405566778`) | `golden_hour_lakeside` | Sunset Canvas Chair Roasted Marshmallow (`夕阳帆布月亮椅跨坐举烤棉花糖`) | `tan canvas 1.6::folding chair::, wooden skewer with gooey roasted 1.6::marshmallow::, open plaid flannel, 1.55::sitting on lap::` |
| `CP06` | `1216×832` (`s9406677889`) | `golden_hour_lakeside` | Unzipped Dome Tent Entrance Muffled (`圆顶帐篷底链探出上半身捂嘴防听见`) | `pitched 1.65::tent:: partially unzipped at bottom, head & shoulders out clutching grass, 1.55::hand over mouth::` |
| `CP07` | `832×1216` (`s9407788990`) | `lantern_glowing_tent` | Night Lantern Tent Shared Sleeping Bag (`夜幕暖灯帐篷共钻羽绒睡袋侧卧勺式`) | `inside 1.6::tent::, hanging warm 1.55::lantern::, half-unzipped quilted 1.65::sleeping bag::, 1.6::spooning::` |
| `CP08` | `832×1216` (`s9408899001`) | `warm_campfire_ember` | Crackling Campfire Wool Blanket & Cocoa (`夜林噼啪篝火披格纹毯捧热可可跨坐`) | `stone-ring 1.65::campfire:: with sparks, tartan wool 1.55::blanket:: over shoulders, steaming 1.55::enamel mug::, straddling on log` |
| `CP09` | `832×1216` (`s9409900138`) | `starry_milkyway_night` | Starry Milky Way Camper SUV Tailgate (`漫天银河串灯越野车敞开尾箱盘腰`) | `1.6::starry sky::, warm 1.55::fairy lights:: on open camper SUV tailgate bed, 1.55::missionary::, 1.55::leg lock::` |
| `CP10` | `832×1216` (`s9410011223`) | `dappled_meadow_picnic` | Forest Stream Chilled Watermelon (`清澈浅溪赤足踩水俯捞冰镇西瓜` · Futa) | `shallow clear 1.6::stream::, half-submerged green 1.6::watermelon::, mossy boulder, Multi-Box futa, barefoot` |
| `CP11` | `832×1216` (`s9411122334`) | `golden_hour_lakeside` | Woodland Hanging Solar Camp Shower (`林间树挂黑淋浴袋温水冲汗扶松树干`) | `hanging black camp 1.55::shower:: bag spraying water, soaked clinging crop tank, hands on pine trunk, barefoot` |
| `CP12` | `832×1216` (`s9412233489`) | `dappled_meadow_picnic` | Flower-Meadow Picnic Dual Sundresses Yuri (`花甸格纹毯双夏裙指尖喂葡萄百合`) | `Multi-Box 2girls white × pastel-yellow sundresses seated side-by-side, feeding purple 1.55::grape::, source#/target#fingering` |
