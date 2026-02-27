// ========================
// 色阶生成算法
// ========================

import { Color } from './color';
import { ColorInput, ColorGenerateOptions } from './types';
import { clamp, lerp, easeInOut } from './utils';

// ========================
// ant-design-colors 算法 (HSV)
// ========================

const hueStep = 2;
const saturationStep = 0.16;
const saturationStep2 = 0.05;
const brightnessStep1 = 0.05;
const brightnessStep2 = 0.15;
const lightColorCount = 5;
const darkColorCount = 4;

const darkColorMap = [
  { index: 7, amount: 15 },
  { index: 6, amount: 25 },
  { index: 5, amount: 30 },
  { index: 5, amount: 45 },
  { index: 5, amount: 65 },
  { index: 5, amount: 85 },
  { index: 4, amount: 90 },
  { index: 3, amount: 95 },
  { index: 2, amount: 97 },
  { index: 1, amount: 98 },
];

function getHue(hsv: { h: number; s: number; v: number }, i: number, light?: boolean): number {
  let hue: number;
  if (Math.round(hsv.h) >= 60 && Math.round(hsv.h) <= 240) {
    hue = light ? Math.round(hsv.h) - hueStep * i : Math.round(hsv.h) + hueStep * i;
  } else {
    hue = light ? Math.round(hsv.h) + hueStep * i : Math.round(hsv.h) - hueStep * i;
  }
  if (hue < 0) hue += 360;
  else if (hue >= 360) hue -= 360;
  return hue;
}

function getSaturation(hsv: { h: number; s: number; v: number }, i: number, light?: boolean): number {
  if (hsv.h === 0 && hsv.s === 0) return hsv.s;
  
  let saturation: number;
  if (light) {
    saturation = hsv.s - saturationStep * i;
  } else if (i === darkColorCount) {
    saturation = hsv.s + saturationStep;
  } else {
    saturation = hsv.s + saturationStep2 * i;
  }
  
  if (saturation > 1) saturation = 1;
  if (light && i === lightColorCount && saturation > 0.1) saturation = 0.1;
  if (saturation < 0.06) saturation = 0.06;
  
  return Math.round(saturation * 100) / 100;
}

function getValue(hsv: { h: number; s: number; v: number }, i: number, light?: boolean): number {
  let value: number;
  if (light) {
    value = hsv.v + brightnessStep1 * i;
  } else {
    value = hsv.v - brightnessStep2 * i;
  }
  value = clamp(value, 0, 1);
  return Math.round(value * 100) / 100;
}

/**
 * ant-design-colors 色阶生成算法
 * 生成 10 个色阶，主色在 index 5
 */
export function generateAntDesign(color: ColorInput, options: { theme?: 'light' | 'dark'; backgroundColor?: string } = {}): string[] {
  const patterns: Color[] = [];
  const pColor = new Color(color);
  const hsv = pColor.toHsv();

  // 生成浅色
  for (let i = lightColorCount; i > 0; i -= 1) {
    const c = new Color({
      h: getHue(hsv, i, true),
      s: getSaturation(hsv, i, true),
      v: getValue(hsv, i, true),
    });
    patterns.push(c);
  }

  // 添加主色
  patterns.push(pColor);

  // 生成深色
  for (let i = 1; i <= darkColorCount; i += 1) {
    const c = new Color({
      h: getHue(hsv, i),
      s: getSaturation(hsv, i),
      v: getValue(hsv, i),
    });
    patterns.push(c);
  }

  // 暗色主题
  if (options.theme === 'dark') {
    const bg = new Color(options.backgroundColor || '#141414');
    return darkColorMap.map(({ index, amount }) =>
      bg.mix(patterns[index], amount).toHexString()
    );
  }

  return patterns.map((c) => c.toHexString());
}

// ========================
// Tailwind CSS 算法 (OKLCH)
// ========================

// Tailwind 色阶配置
const tailwindLightnessMap: Record<number, number> = {
  50: 0.98,
  100: 0.95,
  200: 0.9,
  300: 0.8,
  400: 0.6,
  500: 0.5,  // 主色
  600: 0.4,
  700: 0.3,
  800: 0.2,
  900: 0.1,
  950: 0.05,
};

const tailwindSteps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

/**
 * 获取色相调整值
 * 根据颜色不同，有些颜色在高饱和度时需要微调色相
 */
function getHueShift(l: number, baseL: number): number {
  // 蓝色系在高亮度时色相微调
  if (baseL < 0.2 && l > 0.8) return -10;
  if (baseL < 0.2 && l > 0.6) return -5;
  return 0;
}

/**
 * 获取饱和度调整值
 */
function getChromaShift(l: number, baseL: number, baseC: number): number {
  // 在极亮或极暗时降低饱和度
  if (l > 0.9 || l < 0.1) return -baseC * 0.4;
  if (l > 0.8 || l < 0.2) return -baseC * 0.2;
  return 0;
}

/**
 * Tailwind CSS 色阶生成算法
 * 生成 11 个色阶 (50-950)，主色在 500
 * 基于 OKLCH 颜色空间，保持色相一致性
 */
export function generateTailwind(color: ColorInput, _baseStep: number = 500): string[] {
  const baseColor = new Color(color);
  const oklch = baseColor.toOklch();
  
  // 保存原始的色相和饱和度
  const baseL = oklch.l;
  const baseC = oklch.c;
  const baseH = oklch.h;
  
  const result: string[] = [];
  
  for (const step of tailwindSteps) {
    const targetL = tailwindLightnessMap[step];
    
    // 色相调整 - 根据亮度的变化微调色相
    const hueShift = getHueShift(targetL, baseL);
    const newH = baseH + hueShift;
    
    // 饱和度调整 - 在极亮或极暗时降低饱和度
    const chromaShift = getChromaShift(targetL, baseL, baseC);
    const newC = Math.max(0, baseC + chromaShift);
    
    // 使用目标亮度，但保持原始色相和饱和度
    const c = new Color({ l: targetL, c: newC, h: newH });
    result.push(c.toHexString());
  }
  
  return result;
}

// ========================
// OKLCH 渐变算法
// ========================

/**
 * OKLCH 平滑渐变色阶生成
 * 支持自定义步数和亮度范围
 */
export function generateOklch(
  color: ColorInput,
  options: {
    steps?: number;
    startL?: number;
    endL?: number;
    interpolation?: 'linear' | 'ease-in-out';
  } = {}
): string[] {
  const {
    steps = 10,
    startL = 0.95,
    endL = 0.1,
    interpolation = 'ease-in-out',
  } = options;

  const baseColor = new Color(color);
  const oklch = baseColor.toOklch();

  const baseC = oklch.c;
  const baseH = oklch.h;
  
  const result: string[] = [];
  
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const easedT = interpolation === 'ease-in-out' ? easeInOut(t) : t;
    
    // 从 startL 渐变到 endL
    const newL = lerp(startL, endL, easedT);
    
    // 保持原有的色相和饱和度
    const c = new Color({ l: newL, c: baseC, h: baseH });
    result.push(c.toHexString());
  }
  
  return result;
}

// ========================
// 统一入口
// ========================

/**
 * 生成色阶的统一入口函数
 */
export function generate(color: ColorInput, options: ColorGenerateOptions = {}): string[] {
  // 默认使用 ant-design 算法
  const algorithm = (options as any).algorithm || 'ant-design';
  
  if (algorithm === 'ant-design') {
    const opts = options as any;
    return generateAntDesign(color, {
      theme: opts.theme,
      backgroundColor: opts.backgroundColor,
    });
  }
  
  if (algorithm === 'tailwind') {
    const opts = options as any;
    return generateTailwind(color, opts.baseIndex);
  }
  
  if (algorithm === 'oklch') {
    const opts = options as any;
    return generateOklch(color, {
      steps: opts.steps,
      startL: opts.startL,
      endL: opts.endL,
      interpolation: opts.interpolation,
    });
  }
  
  // 默认
  return generateAntDesign(color);
}

export default generate;
