# M7A / M7B 提示词备忘（已从生成器移除，暂存外部）

## 方案 A：`M7A` 纯 2D 柔焦喷枪上色（彻底去 3D 稳五官）

- **正向画风标签**：
  ```text
  1.15::no lineart::, 0.95::lineless::, colored eyelashes, 1.55::moe::, 1.45::anime face::, 1.55::dot nose::, small mouth, soft skin, 1.5::front lighting::, 1.45::warm lighting::, 1.45::soft lighting::, diffused lighting, gentle chiaroscuro, 1.55::smooth shading::, 1.45::soft shading::, soft shadows, hazy, depth of field, 1.15::muted colors::, 1.25::low contrast::, 1.25::ambient occlusion::, 1.2::subsurface scattering::
  ```
- **负向画风标签**：
  ```text
  painterly, painting (medium), oil painting (medium), acrylicpaint (medium), impasto, brushstrokes, visible brushstrokes, gouache, watercolor (medium), cel shading, cel highlight, flat color, thick outlines, monochrome, sketch, pen (medium), harsh shadows, cold lighting, blue tint, grey skin, neon hair, vibrant purple, oversaturated, shiny ass, light spots, wet clothes, blush stickers, oiled, latex, plastic, figure, faux figurine, doll, ball-jointed doll, realistic, photorealistic, 3d, photo (medium), realistic face, 3d face, semi-realistic, realistic eyes, eye sockets, nose bridge, realistic nose, nostrils, lips, thick lips, cosplay, floating heart, sweatdrop
  ```
- **T5 自然语言前缀**：
  ```text
  Warm morning frontal light by cream sheer curtains, creamy rosy-apricot skin with soft 2D gradient shading, pure flat 2D moe anime face with big eyes and tiny dot nose:
  ```

---

## 方案 B：`M7B` 微写实半降维柔光上色（保留微立体肉感）

- **正向画风标签**：
  ```text
  1.3::no lineart::, 1.1::lineless::, 0.5::realistic::, colored eyelashes, 1.55::moe::, 1.5::anime face::, 1.6::dot nose::, small mouth, soft skin, 1.5::front lighting::, 1.45::warm lighting::, 1.45::soft lighting::, diffused lighting, gentle chiaroscuro, 1.6::smooth shading::, 1.4::soft shading::, soft shadows, hazy, depth of field, 1.15::muted colors::, 1.25::low contrast::, 1.3::ambient occlusion::, 1.2::subsurface scattering::
  ```
- **负向画风标签**：
  ```text
  painterly, painting (medium), oil painting (medium), acrylicpaint (medium), impasto, brushstrokes, visible brushstrokes, gouache, watercolor (medium), cel shading, cel highlight, flat color, thick outlines, monochrome, sketch, pen (medium), harsh shadows, cold lighting, blue tint, grey skin, neon hair, vibrant purple, oversaturated, shiny ass, light spots, wet clothes, blush stickers, oiled, latex, plastic, figure, faux figurine, doll, ball-jointed doll, photorealistic, 3d, photo (medium), realistic face, 3d face, semi-realistic, realistic eyes, eye sockets, nose bridge, realistic nose, nostrils, lips, thick lips, cosplay, floating heart, sweatdrop
  ```
- **T5 自然语言前缀**：
  ```text
  Warm morning frontal light by cream sheer curtains, soft rosy-apricot skin with gentle volumetric shading, pure flat 2D moe anime face with big eyes and tiny dot nose:
  ```
