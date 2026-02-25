// ========================
// 类型定义
// ========================

export interface RGB {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
  a?: number;
}

export interface HSV {
  h: number;
  s: number;
  v: number;
  a?: number;
}

export interface OKLCH {
  l: number;  // 0-1
  c: number;  // 0-~0.5
  h: number;  // 0-360
  a?: number; // 0-1
}

export interface OKLAB {
  l: number;  // 0-1
  a: number;  // -0.5 - 0.5 (OKLAB a-axis)
  b: number;  // -0.5 - 0.5
  alpha?: number; // 0-1
}

export type ColorInput = string | RGB | HSL | HSV | OKLCH | OKLAB | ColorInterface | undefined;

// ========================
// Color 类接口
// ========================

export interface ColorInterface {
  r: number;
  g: number;
  b: number;
  a: number;
  
  // 转换方法
  toHexString(): string;
  toRgb(): RGB;
  toRgbString(): string;
  toHsl(): HSL;
  toHslString(): string;
  toHsv(): HSV;
  toOklch(): OKLCH;
  toOklab(): OKLAB;
  toString(): string;
  
  // 颜色操作
  clone(): ColorInterface;
  lighten(amount: number): ColorInterface;
  darken(amount: number): ColorInterface;
  saturate(amount: number): ColorInterface;
  desaturate(amount: number): ColorInterface;
  mix(color: ColorInput, amount: number): ColorInterface;
  tint(amount: number): ColorInterface;
  shade(amount: number): ColorInterface;
  grayscale(): ColorInterface;
  
  // 状态判断
  isDark(): boolean;
  isLight(): boolean;
  equals(other: ColorInput): boolean;
  
  // 便捷方法
  getLuminance(): number;
  getBrightness(): number;
  contrast(color: ColorInput): number;
}

// ========================
// 生成选项
// ========================

export type GenerateAlgorithm = 'ant-design' | 'tailwind' | 'oklch';

export interface GenerateOptions {
  /** 渐变步数 */
  steps?: number;
  /** 输出格式 */
  format?: 'hex' | 'rgb' | 'hsl';
}

export interface AntDesignOptions extends GenerateOptions {
  algorithm?: 'ant-design';
  theme?: 'light' | 'dark';
  backgroundColor?: string;
}

export interface TailwindOptions extends GenerateOptions {
  algorithm: 'tailwind';
  /** 主色位置，默认为 500 对应 index 5 */
  baseIndex?: number;
}

export interface OklchOptions extends GenerateOptions {
  algorithm: 'oklch';
  /** 起始亮度 (0-1) */
  startL?: number;
  /** 结束亮度 (0-1) */
  endL?: number;
  /** 插值方式 */
  interpolation?: 'linear' | 'ease-in-out';
}

export type ColorGenerateOptions = AntDesignOptions | TailwindOptions | OklchOptions;

// ========================
// 预设颜色
// ========================

export interface Palette extends Array<string> {
  primary?: string;
}

export interface PresetColor {
  name: string;
  primary: string;
  nameZh?: string;
  description?: string;
}

export interface Presets {
  [key: string]: Palette;
}
