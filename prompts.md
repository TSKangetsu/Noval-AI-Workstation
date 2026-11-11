# NovelAI 提示词模块化剥离（人物状态 / 场景环境 两大类）

> 来源：`novalai.txt`  
> 说明：已剥离具体角色名（`javelin (azur lane)`）并修正中文逗号、空逗号及拼写错误（`from blow` → `from below`、`standing, position` → `standing`）。  
> 全文统一归纳为 **一、人物状态** 与 **二、场景与全局表现** 两大板块，每个子类均可单独复制自由组合。

---

# 一、人物状态 (Character State)

## 1. 表情与神态 (Expressions & Gaze)

### 汇总词库（无权重）
```text
torogao, bedroom eyes, half-closed eyes, blush, slight smile, smug, flirt, heavy breathing, cute pixel expression
```

### 细分拆解
- **眼神状态：**
  ```text
  {{torogao}}, {bedroom eyes}, half-closed eyes
  ```
- **面部微表情与呼吸：**
  ```text
  blush, slight smile, flirt, heavy breathing
  ```
  ```text
  smug
  ```
- **特殊画风表情：**
  ```text
  cute pixel expression
  ```
- **完整诱惑神态套组（保留原文权重）：**
  ```text
  {{torogao}}, {bedroom eyes}, half-closed eyes, blush, slight smile, flirt, heavy breathing
  ```

---

## 2. 姿势与动作 (Poses & Actions)

### 汇总词库（无权重）
```text
standing, standing on one leg, kneeling position, lying down, lying on side, lying in water, head rest, single-leg supine hamstring stretch, spooning position, spreading the labia, biting a condom, oral sex, sex, rape
```

| 原文词条 | 标准 Danbooru 标签参考 |
| :--- | :--- |
| `kneeling position` | `kneeling` |
| `spooning position` | `spooning` |
| `spreading the labia` | `spread pussy` |

### 细分拆解
- **站立类：**
  ```text
  standing
  ```
  ```text
  standing on one leg
  ```
- **跪姿类：**
  ```text
  kneeling position
  ```
- **躺卧 / 侧卧类：**
  ```text
  {lying down}
  ```
  ```text
  {{lying on side}}, lying in water, head rest
  ```
- **柔韧拉伸类：**
  ```text
  single-leg supine hamstring stretch
  ```
- **局部动作与道具互动：**
  ```text
  spreading the labia
  ```
  ```text
  biting a condom
  ```
- **双人性行为体位：**
  ```text
  spooning position, sex, rape
  ```
  ```text
  oral sex
  ```

---

## 3. 身体细节与体液状态 (Body Details & Fluids)

### 汇总词库（无权重）
```text
wet skin, wet hair, shaded face, dick, semen, cum, cum leaking out, cum leaking out on ground, facial cumshot
```

| 原文自然语言词条 | 标准 Danbooru 标签参考 |
| :--- | :--- |
| `dick` | `penis` |
| `cum leaking out` | `cumdrip` |
| `facial cumshot` | `facial, cum on face` |

### 细分拆解
- **体表状态（湿身 / 面部阴影）：**
  ```text
  wet skin, wet hair
  ```
  ```text
  shaded face
  ```
- **体液与溢出表现：**
  ```text
  {semen}, cum, cum leaking out
  ```
  ```text
  {semen}, cum leaking out on ground
  ```
- **颜射互动细节：**
  ```text
  dick, facial cumshot, {semen}
  ```

---

# 二、场景与全局表现 (Scene & Global Presentation)

## 1. 场景与天气时间 (Environment, Weather & Time)

### 汇总词库（无权重）
```text
on a sandy beach, wet beach, shore, shallow water, ocean, waves, seafoam, dusk, sunset, golden hour, park background, sunny day, sky, scenery, vast, location, backlighting
```

### 细分拆解
- **海滩与水体：**
  ```text
  on a sandy beach, wet beach, shore, shallow water, ocean, waves, seafoam
  ```
- **开阔天空外景：**
  ```text
  scenery, vast, sky
  ```
- **公园外景：**
  ```text
  park background, location
  ```
- **时间、天气与环境光：**
  ```text
  dusk, sunset, golden hour, backlighting
  ```
  ```text
  sunny day
  ```

---

## 2. 镜头与构图 (Composition & Camera)

### 汇总词库（无权重）
```text
wide shot, negative space, vast, low angle, from below, uterus view
```

### 细分拆解
- **景别与空间留白：**
  ```text
  wide shot, vast, negative space
  ```
- **镜头机位角度（仰拍）：**
  ```text
  from below, low angle
  ```
- **特殊断面透视：**
  ```text
  uterus view
  ```
- **大广角仰拍完整套组：**
  ```text
  wide shot, vast, negative space, from below, low angle
  ```

---

## 3. 画面风格与画质起手式 (Art Style & Quality)

### 汇总词库（无权重）
```text
pixel art style, retro style, old game aesthetic, limited palette, soft colors, masterpiece, best quality, nsfw, uncensored
```

### 细分拆解
- **复古像素游戏美学风：**
  ```text
  pixel art style, retro style, old game aesthetic, limited palette, soft colors
  ```
- **通用画质与无修正前缀（原文起手式）：**
  ```text
  masterpiece, best quality, nsfw, {{{{{uncensored}}}}}
  ```
