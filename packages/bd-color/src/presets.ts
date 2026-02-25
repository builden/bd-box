// ========================
// 预设颜色
// ========================

import { generateAntDesign, generateTailwind } from './generate';
import { Palette, Presets, PresetColor } from './types';

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
// AntDesign 颜色中文元数据
// ========================

export const antDesignColorMeta: Record<string, PresetColor> = {
  red: { name: 'red', nameZh: '薄暮', description: '斗志、奔放', primary: '#F5222D' },
  volcano: { name: 'volcano', nameZh: '火山', description: '醒目、澎湃', primary: '#FA541C' },
  orange: { name: 'orange', nameZh: '日暮', description: '温暖、欢快', primary: '#FA8C16' },
  gold: { name: 'gold', nameZh: '金盏花', description: '活力、积极', primary: '#FAAD14' },
  yellow: { name: 'yellow', nameZh: '日出', description: '出生、阳光', primary: '#FADB14' },
  lime: { name: 'lime', nameZh: '青柠', description: '自然、生机', primary: '#A0D911' },
  green: { name: 'green', nameZh: '极光绿', description: '健康、创新', primary: '#52C41A' },
  cyan: { name: 'cyan', nameZh: '明青', description: '希望、坚强', primary: '#13C2C2' },
  blue: { name: 'blue', nameZh: '拂晓蓝', description: '包容、科技、普惠', primary: '#1677FF' },
  geekblue: { name: 'geekblue', nameZh: '极客蓝', description: '探索、钻研', primary: '#2F54EB' },
  purple: { name: 'purple', nameZh: '酱紫', description: '优雅、浪漫', primary: '#722ED1' },
  magenta: { name: 'magenta', nameZh: '法式洋红', description: '明快、感性', primary: '#EB2F96' },
  grey: { name: 'grey', nameZh: '中性灰', description: '沉稳、柔和', primary: '#666666' },
};

// ========================
// 飞书高亮背景色
// ========================
export const feishuHighlightColors: Record<string, { soft: string; solid: string }> = {
  gray: { soft: 'rgba(222, 224, 227, 0.8)', solid: '#bbbfc4' },
  red: { soft: '#fbbfbc', solid: '#f76964' },
  orange: { soft: 'rgba(254, 212, 164, 0.8)', solid: '#ffa53d' },
  yellow: { soft: 'rgba(255, 246, 122, 0.8)', solid: '#ffe928' },
  green: { soft: 'rgba(183, 237, 177, 0.8)', solid: '#62d256' },
  blue: { soft: 'rgba(186, 206, 253, 0.7)', solid: 'rgba(78, 131, 253, 0.55)' },
  purple: { soft: 'rgba(205, 178, 250, 0.7)', solid: 'rgba(147, 90, 246, 0.55)' },
};

// ========================
// 飞书文字颜色
// ========================
export const feishuTextColors: Record<string, string> = {
  gray: '#8f959e',
  red: '#d83931',
  orange: '#de7802',
  yellow: '#dc9b04',
  green: '#2ea121',
  blue: '#245bdb',
  purple: '#6425d0',
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
