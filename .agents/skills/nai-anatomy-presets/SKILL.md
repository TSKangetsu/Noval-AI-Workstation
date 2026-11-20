---
name: nai-anatomy-presets
description: >-
  Comprehensive 4-dimensional NovelAI V4 / V4.5 / V5 Full lower-body taxonomy
  and modular tag library covering: (1) Anatomical Morphology Types (innie slit,
  plump mons/puffy mound, peeking bud, prominent butterfly/outie, prominent
  clitoris, hymen), (2) Pubic Hair Styles (smooth, sparse fuzz, landing strip,
  heart-shaped, thick natural), (3) Pigmentation & Coloration (skin-blended,
  pink, dark-edged mature pigment, engorged), and (4) Opening/Action States.
  Use whenever selecting, combining, or fine-tuning specific anatomical types.
---

# NovelAI V4 / V4.5 / V5 局部全维度分型词库（器型 × 毛发 × 色泽 × 开合状态）

> **架构说明**：Danbooru 原生标签在“开合动作”上分得很细，但在“先天器型品种”上部分词条较粗；而 NovelAI V4.5 / V5 搭载了 **Danbooru 词库 + T5 自然语言双编码器**。本技能采用 **「四维模块化拼装架构」**（从第 1～4 维各挑一项自由组合），结合原生高权重 Booru 标签与精准 T5 结构短语，稳定复现所有细分种类。

---

## 第一维：先天器型与局部构造分类（Morphological Types — 核心品种区分）

### 1A. 幼态平板一线天型（スジ / Flat Innie Slit）
- **品种特征**：耻骨丘平坦纤薄，内外唇完全内藏不外露，闭合时仅有一道干净利落的浅窄竖缝。
- **正向组合**：`groin, pussy, 1.2::cleft of venus::, flat mons`
- **行内负向**：`-2::labia, puffy pussy, gaping, barbie doll anatomy::`

### 1B. 饱满馒头丘陵型（土手高・ぷっくり / Fat Mons & Puffy Mound）
- **品种特征**：耻骨丘（Mons Pubis）与大阴唇软肉圆润高高隆起，像饱满的小馒头/水蜜桃，中缝深陷在两团软肉之间（极具肉感）。
- **正向组合**：`groin, mons pubis, 1.3::fat mons::, pussy, puffy pussy, plump, cleft of venus`
- **行内负向**：`-1.8::labia::, -2::gaping, skinny, barbie doll anatomy::`

### 1C. 花苞微露 / 内藏含蓄型（微ビラ / Subtle Peeking Bud）
- **品种特征**：大阴唇饱满合拢或微开，小阴唇仅在中下段微微探出一点精致柔和的边缘，不外翻不肥厚。
- **正向组合**：`groin, pussy, 0.5::labia::, 0.5::spread pussy::`
- **行内负向**：`-2::gaping, barbie doll anatomy::`

### 1D. 蝴蝶花瓣型 / 外露舒展双翼型（ビラビラ / Outie / Flaring Inner Folds）
- **品种特征**：小阴唇发育明显、长于外侧大阴唇并向左右两侧自然外翻舒展。
- **核心防吞与避坑法则（实测必读）**：
  1. **严禁直译中文比喻词**：在正向或 T5 句子里**绝对不能出现 `butterfly` 或 `petals` / `flower`**，否则 CLIP/T5 会按字面意思直接在角色身上生成一只真昆虫蝴蝶或植物花瓣！必须只用纯解剖学直白英语（`prominent protruding inner labia flaring outward symmetrically`）。
  2. 若角色带 `petite`（娇小体型），训练集 99% 默认锁死平板一线天，`1.3` 以下权重会被完全吞没！必须拉高至 **`1.8::labia::`** 并配 **`1.0 ~ 1.2::spread pussy::`**，双侧结构才能向左右舒展开。
  3. **避免大团不透明白浊糊住中心**：去掉 `cum in pussy`，改用透明水润的 `pussy juice, 0.5::cumdrip::`。
- **正向组合**：`groin, pussy, labia, 0.65::spread pussy::`（如需重度明显则将 `labia` 提至 `1.4 ~ 1.8` 并配合 T5 句末锚点 `prominent protruding inner labia flaring outward symmetrically`）
- **行内负向**：`-2::barbie doll anatomy::`（⚠️ **绝对严禁在负向里写 `cleft of venus`**！实测证明负向挂 `-2::cleft of venus::` 会迫使 AI 为躲避“可见纵向缝隙”而强行把骨盆扭转背对镜头，直接破坏正对镜头的机位安定度！）
- **细分变体（片ビラ / 单侧非对称写实感）**：将 T5 句末锚点改为 `asymmetrical uneven inner labia with one side protruding further out`。

### 1E. 上端豆豆明显凸起型（クリ強調 / Prominent Clitoris & Hood）
- **品种特征**：上端阴蒂包皮与阴蒂头明显饱满凸出（可叠加在 1A～1D 任意器型上）。
- **正向插件**：`1.2::clitoris::, clitoral hood`（若需充血挺立感则加 `erect clitoris`）

### 1F. 纯洁薄膜可见型（処女膜 / Visible Hymen）
- **品种特征**：微开或拨开状态下可见内部半透明环形/月牙形薄膜构造（适合特定纯洁/初体验差分设定）。
- **正向插件**：`pussy, spread pussy, 1.2::hymen::`

---

## 第二维：毛发修饰品种分类（Pubic Hair Styles）

| 品种名称 | 视觉特征 | 正向模块 | 配套负向 |
| :--- | :--- | :--- | :--- |
| **2A. 纯净白虎无毛型** | 光洁无任何毛发遮挡，线条完全裸露 | `no pubic hair` | `-2::pubic hair::` |
| **2B. 少女初生稀疏绒毛型** | 极淡、极细软的少量浅色绒毛，半透皮肤 | `1.2::sparse pubic hair::, light pubic hair` | `-1.5::thick pubic hair::` |
| **2C. 修剪一线跑道型** | 两侧剃净，仅正上方保留一道窄竖条修剪毛发 | `pubic hair, 1.3::landing strip::, trimmed pubic hair` | — |
| **2D. 倒三角标准修剪型** | 耻骨丘上方修剪整洁的小倒三角造型 | `pubic hair, trimmed pubic hair, neat pubic hair` | `-1.5::excessive pubic hair::` |
| **2E. 魅魔/涩气爱心修剪型** | 刻意修剪成心形的同人常见色气造型 | `pubic hair, 1.4::heart-shaped pubic hair::` | — |
| **2F. 自然浓密野生型** | 未经修剪向大腿根自然蔓延的浓密真实感 | `1.3::pubic hair::, excessive pubic hair, messy pubic hair` | — |
| **2G. 刚剃过留青茬型** | 剃毛后留下细小点状毛囊茬印的写实细节 | `shaved pubic hair, stubble on mons` | `-1.5::long pubic hair::` |

---

## 第三维：色泽与色素沉淀分类（Pigmentation & Coloration）

1. **3A. 无痕透肤暖珊瑚色（空气感/清透插画首选，防贴纸色差）**
   - **做法**：**不写任何局部颜色词**，全局配 `subsurface scattering, pastel colors, soft colors`，自动生成与指尖、膝盖同色系的自然暖肉色过渡。
2. **3B. 鲜嫩樱桃亮粉色（萌系赛璐璐 / 高饱和二次元风）**
   - **正向插件**：`pink pussy`（仅在鲜艳明快画风下使用；低饱和逆光下慎用以免像贴纸）。
3. **3C. 熟感边缘深色沉淀型（色素沈着 / 写实熟女・辣妹・反差感）**
   - **视觉特征**：外侧边缘与小阴唇尖端呈微暗褐/紫灰的成熟色素沉淀，而内侧黏膜呈湿润深粉红的双色层次感（极具写实涩气反差）。
   - **正向插件（T5 精准触发）**：`1.2::labia::, dark pigmented labia edges, two-tone mucosa`
4. **3D. 兴奋充血潮红发亮型（充血・発情）**
   - **正向插件**：`glistening, flushed groin, twitching`

---

## 第四维：开合程度与动态状态分类（Opening & Dynamic States）

- **4A. 完全紧闭态**：不加 `spread pussy`，保留 `cleft of venus`。
- **4B. 清透淡化·轻度微张溢流态（`137_128` 默认款）**：`0.5::spread pussy::, after vaginal, cum in pussy, cumdrip` + 负向 `-1.5::labia::`。
- **4C. 标准自然微开态（无需手扶）**：`spread pussy, pussy juice` + 负向 `-2::gaping, cameltoe::`。
- **4D. 手指主动拨开展示态（全过程紧致校准版）**：
  - **紧致甜点权重（`0.95 ~ 1.05` 档 · 替代旧版偏大的 `1.25~1.3`）**：`groin, pussy, labia, 1.0::spread pussy::, 1.15::spreading own pussy::, fingers`
  - **必配防遮挡/防畸变负向**：`covering crotch, covering pussy, covering breasts, censor, mosaic censoring, bar censor, gaping`（缺省 `covering crotch` 时，V4.5/V5 在半身/仰拍近景极易触发手掌挡住私处的自发打码反射）。
  - **权重响应曲线（严禁全过程盲目拉高）**：
    - `0.65 ~ 0.85`：适合 `before / during / after_inside` 常规阶段，保持娇小紧致不撑大；
    - **`0.95 ~ 1.05`（黄金紧致档）**：适合手指拨开与 `pull_out` 刚拔出，清晰可见微张粉嫩洞缘且不显宽大空洞；
    - `>= 1.25`：在 V5 娇小体型上容易把开口撑得偏大，全过程常规阶段应避免。
- **4E. 紧身勒痕骆驼趾态（隔衣/泳装/紧身裤专用）**：`cameltoe, tight clothes`（脱衣状态下严禁使用，否则产生怪异硬折痕）。
- **4F. 事后拔出·微张洞内蓄满溢流态（`pull_out` 全过程紧致校准 · 严禁空黑洞！）**：
  - **全过程铁律**：**任何常规阶段（`before / during / after_inside / pull_out / solo / fingering`）正向均严禁出现 `0.55::gaping::` / `0.65::gaping::`**！`gaping` 会在 V5 中强行挖出偏大空黑洞并把白浊挤出洞外；`pull_out` 负向仅拦截 `gaping anus`（不封死裸 `gaping`），其余阶段负向正常拦截 `gaping`。
  - **黄金紧致配方**：`0.95::spread pussy::, 1.45::creampie::, after vaginal, after sex, 1.55::cum::, 1.75::cum in pussy::, 1.6::cum overflow::, 1.45::cumdrip::`（背视体位如 `P17~P22, P44, P49` 必配 `1.4::pussy from behind::`；有男方器官时保留 `cum string`，且开启流体阶段时必须从光影负向中剔除 `dripping`）。
  - **配套 T5 句尾**：`her softly parted pink labia framing a visible vaginal opening pooled full of thick opaque white cum inside the hole and overflowing down in a heavy stream`。
- **4G. 内部断面透视态（エロ漫画断面図）**：`cross-section, uterus, internal cumshot, x-ray`。

---

## ⚡ 快速点单组合示例（后续可直接按代号混搭）

- **「清透空气感少女淡化款」** = `1C(降权版)` + `2A(无毛)` + `3A(透肤无色差)` + `4B(微张溢流)`
- **「肉感饱满白虎馒头款」** = `1B(饱满馒头)` + `2A(无毛)` + `3A/3B` + `4A(闭合深缝)`
- **「写实反差稀疏绒毛蝴蝶款」** = `1D(蝴蝶外露)` + `2B(稀疏绒毛)` + `3C(边缘色素微深)` + `4C(自然微开)`

---

## 第五维：私处质感优选画师参考库（NovelAI V5 Full · `1D` 蝴蝶型单画师同种子实测归档）

> 以下画师均基于 `MA11` 超近距 V 字广角分镜 + `1.8::labia::, 1.15::spread pussy::` 固定同种子（`seed=672256152`）实测核验。若用于 `安定萌化mikozin`（前 4 位总权 `~2.11`）的**尾融增味**，权重需给到 **`0.35 ~ 0.55`** 才能明显拉动下身质感；若直接单画师或双画师主力驱动，则直接呈现下列本色：

| 画师 Tag | 蝴蝶型实测质感流派 | 实测特点与推荐用法 |
| :--- | :--- | :--- |
| **`artist:mignon`** ⭐ | **樱花粉嫩透光软糖系** | 对称精致粉嫩双瓣、零暗沉脏感、果冻水润透肤高光，脸部极萌干净；单用与混融俱佳 |
| **`artist:shiina excel`** ⭐ | **极致湿润晶莹立体系** | 半透明黏膜高光反光最强、水液流淌立体感极佳，色气度与二次元洁净度兼得 |
| **`artist:henreader`** ⭐ | **舒展饱满柔光花瓣系** | 双翼外翻舒展幅度最大、柔光蜜桃粉过渡丝滑无硬线，视觉冲击力极强 |
| **`artist:alp`** ⭐ | **真实肉感微褶软弹系** | 肉丘软弹挤压感最真实、细腻自然褶皱配微光水丝，高级肉感大师味 |
| **`artist:ban!`** | **纯正同人本精细线稿系** | 赛璐璐净线最清晰锐利，每一道结构褶皱与纹理刻画分明 |
| **`artist:pija (pianiishimo)`** | **浓烈暖光高反差系** | 强暖橙反光与深红湿润拉丝；单用线条偏粗，最适合作为 `0.28` 尾融优化扶他与女版下身衔接 |
| **`artist:marushin (marushin0214)`** ⭐ | **高饱和湿润拉丝精细粉瓣系** | 褶皱层次极细腻、透明拉丝清晰、嫩粉高光饱满且萌脸保真度极高（零重影） |
| **`artist:komone ushio`** ⭐ | **极白嫩少女透粉软糖系** | 肌肤极度白皙透光、粉红肉瓣柔和饱满不脏不暗、水珠晶莹，极配萌系幼态审美（零重影） |
| **`artist:kurokoshou (emuburemu123)`** ⭐ | **清透水光红润立体褶皱系** | 饱满圆润丘部配鲜明湿润红粉褶皱与清澈水丝；单用在极端微距顶部易出小头像，建议混融或 UC 加 `multiple views, inset` |
| **`artist:ciloranko`** ⭐ | **水润玻璃高光细线系** | 通透玻璃感水光点与锐利精致细线拉丝；单用顶部偶出小头像，混融或加 `multiple views, inset` 负向即极稳 |
| **`artist:rurudo`** ⭐ | **仙气珍珠白粉透光系** | 极致白嫩珍珠透光肌肤 + 清澈透明水露与柔和樱粉花瓣，萌脸与下身高级感双双封神（零重影） |
| **`artist:toosaka asagi`** ⭐ | **梦幻清透柔嫩水蜜桃系** | 极其柔和干净的奶油白粉透光 + 晶莹滑落水滴与圆润柔美粉瓣，萌度与清透感极高 |
| **`artist:nanawo (7nanawo)`** ⭐ | **明快粉润精致赛璐璐系** | 色彩明丽干净、细腻水润粉瓣与精致后穴纹理、线条清爽利落 |
| **`artist:doshimash0`** ⭐ | **高清立绘级闪亮湿润系（已实测定稿 6 号均衡配方）** | 极高对比度的闪亮星光水痕 + 精致立体的肉瓣边缘高光与绝美萌脸；**黄金 6 号均衡画风链**：`0.56::artist:mikozin::, 0.46::artist:kani bonara::, 0.38::artist:hori (hori no su)::, 0.34::artist:gotyou::, 0.50::artist:doshimash0::`（总权 `2.24` 防膨胀，萌脸 100% 保真且下身通透度最佳） |
| **`artist:horosuke`** ⭐ | **极净白嫩Q弹水光系** | 极白皙柔滑的腿根大高光 + 极干净可爱的对称浅粉花瓣，色泽毫无杂脏 |
| **`artist:m-da s-tarou`** ⭐ | **极致丰满湿润拉丝肉感系** | 极强立体软肉起伏与饱满多汁的浅粉湿润黏膜+厚水光拉丝，冲击力极强 |
| **`artist:nanashi (774)`** ⭐ | **纯正高精细动漫本子系** | 极度标准的日系高精细漫画线稿解剖、层次分明且神态表现力极佳 |
| **`artist:nagi ichi`** ⭐ | **星光亮泽鲜嫩赛璐璐系** | 清晰明快的鲜嫩粉红双瓣配闪亮高光水丝与精致细腻放射纹，二次元净线感极强 |
| `artist:tofuubear` / `artist:nyuu (manekin-eko)` / `artist:tsukudani (coke-buta)` | **软萌桃粉 / 成熟花边深色褶皱参考系** | `tofuubear` 偏软萌透白桃粉；`nyuu` 专精极端繁复深边花瓣肉褶（适合重度写实熟感）；`tsukudani` 偏高反差同人本解剖 |
| `artist:shiratama (shiratamaco)` / `artist:karory` / `artist:mimonel` | **白嫩柔光 / 细线辅融系** | 白粉通透质感佳，但单用在极端微距分镜顶部易出小分身头像，**仅推荐作中低权重混融** |

### 6 号均衡画风（`mikozin + doshimash0 0.50`）配套光影与室内/夜景调校方案

- **常驻赛璐璐净线 + 冷暖水润光影底座**（基于工作台 `💎✨ 2.5D 冷暖撞色水润高反差光影` / `cool_warm_25d_cel` 调校）：
  ```text
  masterpiece, best quality, very aesthetic, absurdres, year 2025, 0.56::artist:mikozin::, 0.46::artist:kani bonara::, 0.38::artist:hori (hori no su)::, 0.34::artist:gotyou::, 0.50::artist:doshimash0::, gradient eyes, no text, 1.15::cel shading::, anime coloring, lineart, 1.2::high contrast::, saturated, 1.25::backlighting::, 1.15::subsurface scattering::, 1.18::shiny skin::, sparkle
  ```
  *(扶他版将尾部调整为 `0.48::artist:doshimash0::, 0.25::artist:pija (pianiishimo)::`)*
- **核心防偏与动态光源调整规则**：
  1. **防厚涂油腻锁死**：混入 `0.50::artist:doshimash0::` 时必须同步保留 `1.15::cel shading::, anime coloring, lineart`（并在 UC 锁死 `painterly, photorealistic, 3d`），既完整保留星光湿润高光与精致黏膜细节，又确保面部与发丝维持清爽二次元细线。
  2. **室内/密闭/夜间场景去白昼阳光**：从原版 `cool_warm_25d_cel` 中**剥离固定的 `1.15::sunlight::, light rays`**，避免无窗隔间、昏暗卧室或深夜户外误出白天阳光束；改按具体场景叠加局部光源（夜间/自缚直打闪光灯 `+ 1.45~1.55::camera flash::`；试衣间/温泉暖光 `+ warm spotlight / warm yellow lighting`；高层夜景/直播间 `+ 1.5::city lights at night::` 或 `neon-lit bedroom, ring light reflection in pupils`）。
  3. **V5 Full 黄金采样与 2x 放大参数**：`nai-diffusion-5-full`，`Steps = 28`，`CFG Scale = 6.8`，`CFG Rescale = 0`；成图后调用官方 `/ai/upscale`（`nai-diffusion-5-full-medium`, `declared_blur_sigma: 0`）直出 `1664×2432` / `2432×1664` 超清细线大图。
