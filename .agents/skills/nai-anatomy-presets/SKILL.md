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
- **4D. 手指主动拨开展示态（经 V4.5 四档双种子梯度校准）**：
  - **黄金甜点权重（`1.25` 档 · 强烈推荐）**：`groin, pussy, labia, 1.25::spread pussy::, 1.25::spreading own pussy::, fingers`
  - **必配防遮挡/防畸变负向**：`covering crotch, covering pussy, covering breasts, censor, mosaic censoring, bar censor, gaping`（缺省 `covering crotch` 时，V4.5 在半身/仰拍近景极易触发手掌挡住私处的自发打码反射）。
  - **权重响应曲线（勿盲目拉高）**：
    - `<= 1.10`：部分种子仅单侧手指轻触、开口偏浅；
    - **`1.25`（黄金档）**：跨种子稳定实现食指+中指V字自然撑开，且**不抢夺另一只手的上半身动作**（如可完美共存单手脸颊比耶 `peace sign near cheek`）；
    - `>= 1.38 ~ 1.52`：注意力向胯部过载，容易吞掉上半身手部姿势（如左臂背到身后）并使内侧黏膜线条变硬。
- **4E. 紧身勒痕骆驼趾态（隔衣/泳装/紧身裤专用）**：`cameltoe, tight clothes`（脱衣状态下严禁使用，否则产生怪异硬折痕）。
- **4F. 事后微松弛未闭合态**：`spread pussy, 0.55::gaping::, after vaginal, cum in pussy, cumdrip, excessive cum`（严禁超过 `0.7::gaping::` 以防橡胶化畸形）。
- **4G. 内部断面透视态（エロ漫画断面図）**：`cross-section, uterus, internal cumshot, x-ray`。

---

## ⚡ 快速点单组合示例（后续可直接按代号混搭）

- **「清透空气感少女淡化款」** = `1C(降权版)` + `2A(无毛)` + `3A(透肤无色差)` + `4B(微张溢流)`
- **「肉感饱满白虎馒头款」** = `1B(饱满馒头)` + `2A(无毛)` + `3A/3B` + `4A(闭合深缝)`
- **「写实反差稀疏绒毛蝴蝶款」** = `1D(蝴蝶外露)` + `2B(稀疏绒毛)` + `3C(边缘色素微深)` + `4C(自然微开)`
