---
name: nai-anatomy-presets
description: >-
  Optional 4-dimensional NovelAI V4 / V4.5 / V5 Full lower-body tag palette
  covering: (1) Anatomical Morphology (innie slit, plump mons, peeking bud,
  flaring inner folds, prominent clitoris, hymen), (2) Pubic Hair Styles,
  (3) Pigmentation & Coloration, and (4) Opening & Fluid States, plus literal
  metaphor pitfalls. Use as an optional vocabulary menu when the user requests
  specific anatomical subtypes or fine-tuned lower-body details.
---

# NovelAI V4 / V4.5 / V5 局部四维词汇调色盘

> **按需取用（非强制公式）**：NovelAI V4.5 / V5 兼具 **Danbooru 词库** 与 **T5 自然语言理解**。以下四组词汇仅作按需挑选的调色盘——创作时挑出契合角色气质与氛围的词条，或直接用自然英文描写即可，无需机械填满四个维度或死守固定小数权重。画师质感参考与可选 2.5D 光影示例见 [artist_benchmarks.md](./references/artist_benchmarks.md)。

---

## 第一维：器型与局部构造词汇（Morphological Types）

| 细分类别 | 视觉印象 | 常用正向参考 | 可选配套负向 |
| :--- | :--- | :--- | :--- |
| **1A. 平板一线天（スジ）** | 耻丘平滑纤薄，内敛闭合呈浅窄纵缝 | `groin, pussy, 1.2::cleft of venus::, flat mons` | `labia, puffy pussy, gaping, barbie doll anatomy` |
| **1B. 饱满软丘（ぷっくり）** | 耻丘与外侧软肉圆润隆起，中缝嵌于肉感间 | `groin, mons pubis, 1.3::fat mons::, pussy, puffy pussy, plump, cleft of venus` | `gaping, skinny, barbie doll anatomy` |
| **1C. 花苞微露（微ビラ）** | 外唇柔和微启，内侧仅探出一丝精致边缘 | `groin, pussy, 0.5::labia::, 0.5::spread pussy::` | `gaping, barbie doll anatomy` |
| **1D. 舒展外翻双翼（ビラビラ）** | 内唇越过外侧向左右自然舒展（详见下方提示） | `groin, pussy, labia, 0.65::spread pussy::` | `barbie doll anatomy` |
| **1E. 阴蒂包皮明显** | 上端结构饱满凸出（可叠加于任意器型） | `1.2::clitoris::, clitoral hood`（挺立感加 `erect clitoris`） | — |
| **1F. 半透明薄膜可见** | 微启状态可见内部月牙形薄膜细节 | `pussy, spread pussy, 1.2::hymen::` | — |

### `1D` 舒展双翼型的语义碰撞与模型先验提示
1. **字面比喻词陷阱（重要）**：正向标签或 T5 句子里**切勿直译中文比喻词 `butterfly`、`petals` 或 `flower`**——模型会按英语字面意思直接在身上生成真昆虫蝴蝶或植物花瓣。请改用直白解剖学英文：`prominent protruding inner labia flaring outward symmetrically`（单侧非对称写实感可写 `asymmetrical uneven inner labia with one side protruding further out`）。
2. **娇小体型先验偏移**：角色带 `petite` 时训练集默认倾向平板一线天（`1A`）；若希望在娇小体型上清晰呈现舒展内唇，可将 `labia` 提至 `1.4 ~ 1.8` 并搭配适度 `spread pussy`，同时用透明的 `pussy juice` 代替大团不透明 `cum in pussy` 以免遮挡中心结构。
3. **负向 `cleft of venus` 机位陷阱**：切勿在负向屏蔽 `cleft of venus`——这会迫使模型为躲避“可见纵缝”而把骨盆强行扭转背对镜头。

---

## 第二维：毛发修饰参考（Pubic Hair Styles）

| 风格类型 | 视觉印象 | 正向参考词 | 可选配套负向 |
| :--- | :--- | :--- | :--- |
| **2A. 光洁无毛** | 线条干净无遮挡 | `no pubic hair` | `pubic hair` |
| **2B. 稀疏浅绒毛** | 极淡细软的少量浅色绒毛，半透肤色 | `1.2::sparse pubic hair::, light pubic hair` | `thick pubic hair` |
| **2C. 一线跑道修剪** | 两侧剃净，正上方留窄竖条 | `pubic hair, 1.3::landing strip::, trimmed pubic hair` | — |
| **2D. 整洁倒三角** | 耻丘上方修剪整洁的小三角 | `pubic hair, trimmed pubic hair, neat pubic hair` | `excessive pubic hair` |
| **2E. 爱心修剪** | 同人风格心形修剪装饰 | `pubic hair, 1.4::heart-shaped pubic hair::` | — |
| **2F. 自然浓密** | 未经修剪的自然蔓延写实感 | `1.3::pubic hair::, excessive pubic hair, messy pubic hair` | — |
| **2G. 剃后微茬** | 留有细微点状毛囊青茬的写实肌理 | `shaved pubic hair, stubble on mons` | `long pubic hair` |

---

## 第三维：色泽与色素层次（Pigmentation & Coloration）

- **3A. 自然透肤暖珊瑚色（空气感插画常用）**：不单写局部颜色词，靠全局 `subsurface scattering, pastel colors, soft colors` 生成与指尖、膝盖同色系的自然过渡，防贴纸色差。
- **3B. 鲜亮樱桃粉（明快赛璐璐）**：`pink pussy`（适合高饱和明快画风；低饱和逆光下若显突兀可省略）。
- **3C. 边缘微深成熟色素层次（写实反差）**：`1.2::labia::, dark pigmented labia edges, two-tone mucosa`（外缘微暗褐/紫灰、内侧湿润粉红）。
- **3D. 湿润充血红晕**：`glistening, flushed groin, twitching`。

---

## 第四维：开合程度与体液表现基线（Opening & Fluid States）

- **4A. 自然闭合态**：保留 `cleft of venus`，省略 `spread pussy`。
- **4B. 柔和微启余韵**：`0.5::spread pussy::, after vaginal, cum in pussy, cumdrip`。
- **4C. 自然微张水润态**：`spread pussy, pussy juice`（不希望过度扩张时可在负向放 `gaping, cameltoe`）。
- **4D. 手指拨开展示与防遮挡提示**：
  - **参考词**：`groin, pussy, labia, spread pussy, spreading own pussy, fingers`（`spread pussy` 在 `0.65~0.85` 偏含蓄紧致，`0.95~1.05` 适合清晰微张，高于 `1.25` 开口明显拉宽，可随构图调节）。
  - **防自发遮挡**：半身或仰拍近景若触发手掌挡住私处的打码反射，可在负向加入 `covering crotch, covering pussy, censor, mosaic censoring, bar censor`。
- **4E. 紧身衣勒痕（仅限隔衣场景）**：`cameltoe, tight clothes`（全裸状态下不宜使用 `cameltoe`，以免产生布料硬折痕）。
- **4F. 拔出饱满溢流 vs. 明显扩张（`gaping` 特性参考）**：
  - V5 中正向 `gaping` 会刻画较宽的扩张空腔并将白浊推向洞外；若想表现**紧致微张、洞内蓄满白浊向下流淌**，可省略正向 `gaping`（负向仅挡 `gaping anus`），搭配 `0.95::spread pussy::, creampie, after vaginal, cum in pussy, cum overflow, cumdrip`（背视体位加 `pussy from behind`；需流淌拉丝时留意不要在光影负向里误挂 `dripping`），或辅以 T5 自然语言描写。若创作意图就是表现强烈扩张感，则正常使用 `gaping` 即可。
- **4G. 内部透视断面**：`cross-section, uterus, internal cumshot, x-ray`。

---

## 灵感混搭与延伸参考
- **清透空气感**：`1C + 2A + 3A + 4B` · **饱满肉感系**：`1B + 2A/2D + 3A/3B + 4A` · **写实反差系**：`1D + 2B + 3C + 4C`
- **20 位画师局部质感对比与可选 2.5D 光影基线**：见 [artist_benchmarks.md](./references/artist_benchmarks.md)。
