---
name: nai-onsen-yukata
description: Empirically calibrated NovelAI V4.5 / V5 Japanese Hot-Spring Onsen & Ryokan Yukata Play (日式温泉与旅馆浴衣玩法 / 温泉旅館・湯上り浴衣プレイ) prompt engineering guide. Covers 55 scenes across 32 Duo interactions (bamboo rotenburo, snowy floating sake, hinoki tub leg-up, wooden wash stool, bamboo-blind mountain bath, shoji/lattice/noren loosened-yukata trio, tatami futon POV, lacquer matcha table, ryokan ping-pong, 2girls dual-yukata dango-feeding, 4 novel mechanics including egg steamer, belly-balanced sake cup, vintage massage chair & fogged glass heart, plus 16 warm-sake/umeshu/bamboo-sake/gourd-sake/byobu-game/masu/tokkuri tipsy 微醺 duo scenes) and 23 Solo scenes (15 tipsy seductive POV invitations across futon, doorway, moonlit veranda, kotatsu, hinoki rim, hiroen rattan chair, changing bench, standing mirror & night garden stone bench + 8 post-bath/engawa-footbath/aftermath scenes), 5 scene-bound lighting modes, and 4-mode gender compatibility.
---

# NovelAI V4.5 / V5 Japanese Onsen & Ryokan Yukata (`ONS01–ONS55` · 温泉浴衣) Skill

This skill documents the empirically verified prompt architecture for **55 Japanese Hot-Spring Onsen & Ryokan Yukata Compositions (`ONS01–ONS55`: 32 Duo + 23 Solo)** on NovelAI V5 Full (`nai-diffusion-5-full`, `28 steps, CFG 6.8`), verified across all 4 gender modes (`normal`, `femboy`, `futa_no_balls`, `futa_with_balls`) plus `2girls` Yuri (`ONS10`), totaling `221` verified T5 prompt combinations.

See also [onsen_yukata_catalog.md](references/onsen_yukata_catalog.md) for the complete 55-scene creative palette.

---

## 1. Scene-Bound Onsen Lighting, Wardrobe & Sake-Tipsy Calibration

### A. Five Scene-Bound Onsen & Ryokan Lighting Modes
1. **`misty_bamboo_rotenburo` (`ONS01, ONS05, ONS23`)**: `soft morning mountain mist filtering through green bamboo grove, rising warm white onsen steam, natural daylight` (UC guard: `modern bathroom, ceramic tiles, chrome faucet, swimming pool, fiberglass bathtub`)
2. **`snowy_lantern_rock_bath` (`ONS02, ONS13, ONS39`)**: `winter night falling snowflakes, warm amber glow from traditional stone yukimi-doro lantern reflecting on steaming water, cold blue night contrast` (UC guard: `daylight, summer, modern tiles, indoor ceiling, swimming pool`)
3. **`amber_hinoki_steam` (`ONS03, ONS04, ONS11, ONS17, ONS29, ONS50, ONS52`)**: `warm amber wooden wall sconce inside traditional hinoki cypress bathhouse, fragrant rising white steam, glistening wet wood grain` (UC guard: `white ceramic tiles, fiberglass bathtub, plastic shower curtain, swimming pool`)
4. **`tatami_andon_warm` (`ONS06–ONS10, ONS15, ONS20, ONS21, ONS24–ONS26, ONS30, ONS32–ONS34, ONS36–ONS38, ONS40, ONS41, ONS43, ONS45–ONS47, ONS49, ONS51, ONS53, ONS54`)**: `soft warm amber glow from floor-standing paper andon lamp in traditional ryokan tatami room, warm shadows across shoji lattice` (UC guard: `western bedframe, modern office chair, neon lights, modern concrete`)
5. **`lantern_onsen_town_night` (`ONS12, ONS14, ONS16, ONS18, ONS19, ONS22, ONS27, ONS28, ONS31, ONS35, ONS42, ONS44, ONS48, ONS55`)**: `warm red-and-white paper chochin lantern glow along traditional wooden engawa and stone-paved hot-spring street at night, drifting steam` (UC guard: `daylight, asphalt highway, modern skyscraper, cars`)

### B. 15 Solo Tipsy Seductive POV Invitations (`ONS26, ONS27, ONS32, ONS36, ONS37, ONS46–ONS55`)
- **Pre-Coital Solo Framing**: Omit `after sex / cumdrip` and pair `1.55::pov::` or `1.6::from below::` with `1.65::drunk::, 1.55::half-closed eyes::`, keeping solo anti-partner UC guards active so the viewer has an unobstructed 1st-person gaze.
- **Concrete Ryokan Props & Invitation Gestures**:
  - `ONS26` lifting white futon blanket corner; `ONS27` wet hand beckoning at private bath edge; `ONS32` biting wooden room-key tag by retro vending machine; `ONS36` pouring tokkuri sake across collarbone; `ONS37` biting porcelain sake cup while offering red obi sash;
  - `ONS46` sideways tatami lounge tipping sake cup; `ONS47` sliding shoji doorway holding up sake carafe; `ONS48` moonlit veranda iced plum wine + rear skirt lift; `ONS49` lifting red kotatsu quilt wide open; `ONS50` hinoki tub rim extending red-lacquer sakazuki saucer;
  - `ONS51` hiroen rattan armchair leg-over-armrest with frosted green sake bottle; `ONS52` changing-room cypress bench untying obi beside masu cup; `ONS53` tall floor mirror reflecting flushed face while offering sake cup on all-fours; `ONS54` overhead white futon M-legs hugging sake carafe & reaching up; `ONS55` night garden stone bench dangling wooden geta from toes with gourd sake flask.

---

## 2. Verified Matrix Summary (`ONS01–ONS55`)

- **Duo Onsen & Ryokan Classics (`ONS01–ONS10, ONS16–ONS17` · 12 scenes)**: `ONS01` (`s9601122334`), `ONS02` (`s9602233445`), `ONS03` (`s9603344556`), `ONS04` (`s9604455667` femboy), `ONS05` (`s9605566778` `1216×832`), `ONS06` (`s9606677889`), `ONS07` (`s9607788990`), `ONS08` (`s9608899001` futa), `ONS09` (`s9609900112`), `ONS10` (`s9610011223` 2girls yuri), `ONS16` (`s9616677889`), `ONS17` (`s9617788990`).
- **Duo Tipsy Sake & Novel Mechanics (`ONS21–ONS25, ONS28–ONS31, ONS33–ONS35, ONS38–ONS45` · 20 scenes)**: `ONS21` (`s9621122399`), `ONS22` (`s9622233456`), `ONS23` (`s9623344567`), `ONS24` (`s9624455699` futa), `ONS25` (`s9625566789`), `ONS28` (`s9628899012`), `ONS29` (`s9629900155`), `ONS30` (`s9630011234`), `ONS31` (`s9631122388`), `ONS33` (`s9633344567`), `ONS34` (`s9634455712`), `ONS35` (`s9635566789`), `ONS38` (`s9638899055`), `ONS39` (`s9639900123`), `ONS40` (`s9640011234` femboy), `ONS41` (`s9641122345`), `ONS42` (`s9642233456`), `ONS43` (`s9643344567` futa), `ONS44` (`s9644455722`), `ONS45` (`s9645566789`).
- **Solo Post-Bath Everyday & Aftermath (`ONS11–ONS15, ONS18–ONS20` · 8 scenes)**: `ONS11` (`s9611122388`), `ONS12` (`s9612233445`), `ONS13` (`s9613344556`), `ONS14` (`s9614455712`), `ONS15` (`s9615566824`), `ONS18` (`s9618899012`), `ONS19` (`s9619900123`), `ONS20` (`s9620011234`).
- **Solo Tipsy Seductive POV Invitations (`ONS26–ONS27, ONS32, ONS36–ONS37, ONS46–ONS55` · 15 scenes)**: `ONS26` (`s9626677890`), `ONS27` (`s9627788901`), `ONS32` (`s9632233456`), `ONS36` (`s9636677890`), `ONS37` (`s9637788901`), `ONS46` (`s9646677890`), `ONS47` (`s9647788901`), `ONS48` (`s9648899012`), `ONS49` (`s9649900123`), `ONS50` (`s9650011234`), `ONS51` (`s9651122345`), `ONS52` (`s9652233456` femboy), `ONS53` (`s9653344567`), `ONS54` (`s9654455678` futa), `ONS55` (`s9655566789`).
