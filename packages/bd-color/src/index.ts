// ========================
// bd-color 入口文件
// ========================

// 主类
export { Color } from './color';
export { default as ColorClass } from './color';

// 生成算法
export { generate, generateAntDesign, generateTailwind, generateOklch } from './generate';

// 预设颜色
export {
  // 主色对照表
  antDesignPrimaryColors,
  tailwindPrimaryColors,
  // 色板
  antDesignPalettes,
  antDesignDarkPalettes,
  tailwindPalettes,
  // 颜色元数据
  antDesignColorMeta,
} from './presets';

// 类型导出
export type {
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
  ColorGenerateOptions,
  Palette,
  PresetColor,
  Presets,
} from './types';
