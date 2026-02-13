// ========================
// 预设颜色
// ========================

import { generateAntDesign, generateTailwind } from './generate';
import { Palette, Presets } from './types';

// ========================
// ant-design 主色对照表
// ========================

export const antDesignPrimaryColors: Record<string, string> = {
  red: '#F5222D',
  volcano: '#FA541C',
  orange: '#FA8C16',
  gold: '#FAAD14',
  yellow: '#FADB14',
  lime: '#A0D911',
  green: '#52C41A',
  cyan: '#13C2C2',
  blue: '#1677FF',
  geekblue: '#2F54EB',
  purple: '#722ED1',
  magenta: '#EB2F96',
  grey: '#666666',
};

// ========================
// Tailwind CSS 主色对照表
// ========================

export const tailwindPrimaryColors: Record<string, string> = {
  slate: '#64748b',
  gray: '#6b7280',
  zinc: '#71717a',
  neutral: '#737373',
  stone: '#78716c',
  red: '#ef4444',
  orange: '#f97316',
  amber: '#f59e0b',
  yellow: '#eab308',
  lime: '#84cc16',
  green: '#22c55e',
  emerald: '#10b981',
  teal: '#14b8a6',
  cyan: '#06b6d4',
  sky: '#0ea5e9',
  blue: '#3b82f6',
  indigo: '#6366f1',
  violet: '#8b5cf6',
  purple: '#a855f7',
  fuchsia: '#d946ef',
  pink: '#ec4899',
  rose: '#f43f5e',
};

// ========================
// 辅助函数
// ========================

/** 创建 ant-design 调色板 */
function createAntDesignPalette(color: string): Palette {
  const palette = generateAntDesign(color) as Palette;
  palette.primary = palette[5];
  return palette;
}

/** 创建 ant-design 暗色调色板 */
function createAntDesignDarkPalette(color: string): Palette {
  const palette = createAntDesignPalette(color);
  Object.assign(palette, generateAntDesign(color, { theme: 'dark' }));
  return palette;
}

/** 创建 Tailwind 调色板 */
function createTailwindPalette(color: string): Palette {
  const palette = generateTailwind(color) as Palette;
  palette.primary = palette[5];
  return palette;
}

/** 从颜色映射创建调色板对象 */
function createPalettes<T>(
  colorMap: Record<string, string>,
  createFn: (color: string) => T
): Record<string, T> {
  return Object.fromEntries(
    Object.entries(colorMap).map(([name, color]) => [name, createFn(color)])
  );
}

// ========================
// 预设导出
// ========================

/** ant-design 亮色调色板 */
export const antDesignPalettes: Presets = createPalettes(
  antDesignPrimaryColors,
  createAntDesignPalette
);

/** ant-design 暗色调色板 */
export const antDesignDarkPalettes: Presets = createPalettes(
  antDesignPrimaryColors,
  createAntDesignDarkPalette
);

/** Tailwind CSS 调色板 */
export const tailwindPalettes: Presets = createPalettes(
  tailwindPrimaryColors,
  createTailwindPalette
);
