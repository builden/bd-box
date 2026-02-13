# bd-color

一个 TypeScript 编写的颜色处理工具包，支持多种颜色格式转换、调色板生成和预设颜色。

## 安装

```bash
npm install @builden/bd-color
# 或
bun add @builden/bd-color
```

## 核心功能

- **Color 类** - 颜色创建、格式转换、颜色操作
- **调色板生成** - Ant Design / Tailwind CSS / OKLCH 三种算法
- **预设颜色** - Ant Design + Tailwind CSS 预设调色板

## Color 类

### 创建颜色

支持多种方式创建颜色：

```typescript
import { Color } from '@builden/bd-color';

// 从 Hex 字符串创建
const color1 = new Color('#ff5500');
const color2 = new Color('#f50');      // 3位简写
const color3 = new Color('#ff550080');  // 8位带透明度

// 从 RGB/HSL/HSV 对象创建
const color4 = new Color({ r: 255, g: 85, b: 0 });
const color5 = new Color({ h: 24, s: 100, l: 50 });
const color6 = new Color({ h: 24, s: 100, v: 100 });

// 从 OKLCH/OKLAB 创建 (现代色彩空间)
const color7 = new Color({ l: 0.6, c: 0.15, h: 24 });
const color8 = new Color({ l: 0.6, a: 0.1, b: 0.15 });

// 从 CSS 字符串创建
const color9 = new Color('rgb(255, 85, 0)');
const color10 = new Color('hsl(24, 100%, 50%)');
const color11 = new Color('rgba(255, 85, 0, 0.5)');

// 从颜色名称创建
const color12 = new Color('red');
const color13 = new Color('blue');
```

### 格式转换

```typescript
const color = new Color('#ff5500');

// 转换为 Hex 字符串
color.toHexString();        // "#ff5500"

// 转换为 RGB 对象
color.toRgb();              // { r: 255, g: 85, b: 0, a: 1 }

// 转换为 RGB 字符串
color.toRgbString();        // "rgb(255,85,0)"
color.toRgbString();       // 带透明度: "rgba(255,85,0,0.5)"

// 转换为 HSL
color.toHsl();             // { h: 24, s: 100, l: 50, a: 1 }

// 转换为 HSL 字符串
color.toHslString();       // "hsl(24,100%,50%)"

// 转换为 HSV
color.toHsv();             // { h: 24, s: 100, v: 100, a: 1 }

// 转换为 OKLAB (现代感知均匀色彩空间)
color.toOklab();           // { l: 0.6, a: 0.1, b: 0.15, alpha: 1 }

// 转换为 OKLCH (极坐标形式)
color.toOklch();           // { l: 0.6, c: 0.15, h: 24, a: 1 }
```

### 颜色操作

```typescript
const color = new Color('#ff5500');

// 调整亮度
color.lighten(10);   // 变亮 10%
color.darken(10);    // 变暗 10%

// 调整饱和度
color.saturate(10);  // 增加饱和度 10%
color.desaturate(10); // 减少饱和度 10%

// 混合颜色
color.mix('#000000', 50);  // 与黑色混合 50%
color.mix('#ffffff', 30);  // 与白色混合 30%

// 调色 (Tint = 混合白色, Shade = 混合黑色)
color.tint(20);   // 添加 20% 白色
color.shade(20);  // 添加 20% 黑色

// 灰度转换
color.grayscale();  // 转换为灰度颜色

// 计算对比度 (WCAG 标准)
color.contrast('#000000');  // 与黑色对比度
color.contrast('blue');     // 与蓝色对比度

// 克隆颜色
color.clone();
```

### 状态判断

```typescript
const color = new Color('#ff5500');

// 判断颜色明暗
color.isDark();    // 是否为深色
color.isLight();  // 是否为浅色

// 判断颜色是否相等
const color2 = new Color('#ff5500');
color.equals(color2);  // true

// 获取亮度值 (0-255)
color.getBrightness();

// 获取相对亮度 (用于计算对比度)
color.getLuminance();
```

## 调色板生成

### Ant Design 算法

生成 Ant Design 风格的 10 色阶调色板，主色位于 index 5：

```typescript
import { generateAntDesign, generate, Color } from '@builden/bd-color';

// 从颜色生成调色板
const palette = generateAntDesign('#1677FF');
// ["#e6f4ff", "#b4d8ff", "#82baff", "#4f9bff", "#1d7dff", "#1677ff", "#0050e6", "#003aac", "#002373", "#000c39"]

// 暗色主题
const darkPalette = generateAntDesign('#1677FF', { theme: 'dark' });
```

### Tailwind CSS 算法

生成 Tailwind CSS 风格的 11 色阶 (50-950)，主色位于 500：

```typescript
import { generateTailwind } from '@builden/bd-color';

const palette = generateTailwind('#3b82f6');
// ["#eff6ff", "#dbeafe", "#bfdbfe", "#93c5fd", "#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8", "#1e40af", "#1e3a8a", "#172554"]
```

### OKLCH 平滑渐变

使用 OKLCH 色彩空间生成平滑渐变色阶：

```typescript
import { generateOklch } from '@builden/bd-color';

// 默认 10 级渐变，从亮到暗
const palette = generateOklch('#3b82f6');
// 从亮度 0.95 渐变到 0.1

// 自定义配置
const customPalette = generateOklch('#3b82f6', {
  steps: 5,              // 5 个色阶
  startL: 0.98,          // 起始亮度
  endL: 0.15,            // 结束亮度
  interpolation: 'ease-in-out',  // 缓动函数
});
```

### 统一入口

使用 `generate` 函数统一调用：

```typescript
import { generate } from '@builden/bd-color';

// 默认使用 ant-design 算法
generate('#1677FF');

// 指定算法
generate('#1677FF', { algorithm: 'ant-design' });
generate('#1677FF', { algorithm: 'tailwind' });
generate('#1677FF', { algorithm: 'oklch' });
```

## 预设颜色

### Ant Design 预设

提供 13 种 Ant Design 主色及完整调色板：

```typescript
import {
  antDesignPrimaryColors,
  antDesignPalettes,
  antDesignDarkPalettes,
} from '@builden/bd-color';

// 获取主色对照表
Object.keys(antDesignPrimaryColors);
// ["red", "volcano", "orange", "gold", "yellow", "lime", "green", "cyan", "blue", "geekblue", "purple", "magenta", "grey"]

// 获取蓝色调色板
const blue = antDesignPalettes.blue;
blue.primary;        // "#1677ff"
blue[1];             // "#b4d8ff"
blue[5];             // "#1677ff" (主色)
blue[9];             // "#000c39"

// 暗色主题
const blueDark = antDesignDarkPalettes.blue;
```

### Tailwind CSS 预设

提供 Tailwind CSS 风格预设：

```typescript
import {
  tailwindPrimaryColors,
  tailwindPalettes,
} from '@builden/bd-color';

// 获取主色对照表
Object.keys(tailwindPrimaryColors);
// ["slate", "gray", "zinc", "neutral", "stone", "red", "orange", "amber", "yellow", "lime", "green", "emerald", "teal", "cyan", "sky", "blue", "indigo", "violet", "purple", "fuchsia", "pink", "rose"]

// 获取调色板
const blue = tailwindPalettes.blue;
blue[500];   // "#3b82f6"
blue[100];   // "#dbeafe"
blue[900];   // "#1e3a8a"

const slate = tailwindPalettes.slate;
slate[500];  // "#64748b"
```

```

## TypeScript 类型

```typescript
import type {
  ColorInput,
  RGB,
  HSL,
  HSV,
  OKLCH,
  OKLAB,
  ColorInterface,
  GenerateOptions,
  AntDesignOptions,
  TailwindOptions,
  OklchOptions,
  Palette,
  PresetColor,
  Presets,
} from '@builden/bd-color';
```

## 完整示例

### React 组件中使用

```tsx
import { generateTailwind, tailwindPalettes } from '@builden/bd-color';

function Button({ children, variant = 'primary' }) {
  const blue = tailwindPalettes.blue;
  const colors = generateTailwind(blue[500]);
  
  return (
    <button
      style={{
        backgroundColor: colors[500],
        color: '#ffffff',
        padding: '8px 16px',
        borderRadius: '6px',
        border: 'none',
      }}
    >
      {children}
    </button>
  );
}
```

### 生成主题色阶

```tsx
import { generate } from '@builden/bd-color';

// 生成 Ant Design 风格色阶用于 UI 主题
const themeColors = generate('#1677FF', {
  algorithm: 'ant-design',
  theme: 'light',
});

// 生成的色阶可用于:
// themeColors[1] - 极浅背景
// themeColors[3] - 浅色背景
// themeColors[5] - 主色 (primary)
// themeColors[7] -  hover 状态
// themeColors[9] -  active 状态
```

## 许可证

MIT
