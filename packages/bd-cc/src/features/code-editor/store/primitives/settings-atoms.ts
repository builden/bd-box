import { atomWithStorage } from 'jotai/utils';
import { atom } from 'jotai';
import { CODE_EDITOR_DEFAULTS, CODE_EDITOR_STORAGE_KEYS } from '../../biz/settings';

// 存储类型 (localStorage 中实际存储的类型)
type ThemeValue = 'dark' | 'light';
type BooleanStringValue = 'true' | 'false';

// ============ Atoms (使用 atomWithStorage 自动持久化) ============

// 主题 - 存储为 'dark'/'light'，内部使用 boolean
export const editorThemeAtom = atomWithStorage<ThemeValue>(
  CODE_EDITOR_STORAGE_KEYS.theme,
  CODE_EDITOR_DEFAULTS.isDarkMode ? 'dark' : 'light'
);

// wordWrap - 存储为 'true'/'false'，内部使用 boolean
export const editorWordWrapAtom = atomWithStorage<BooleanStringValue>(
  CODE_EDITOR_STORAGE_KEYS.wordWrap,
  CODE_EDITOR_DEFAULTS.wordWrap ? 'true' : 'false'
);

// minimap - 存储为 'true'/'false'，内部使用 boolean
export const editorMinimapAtom = atomWithStorage<BooleanStringValue>(
  CODE_EDITOR_STORAGE_KEYS.showMinimap,
  CODE_EDITOR_DEFAULTS.minimapEnabled ? 'true' : 'false'
);

// lineNumbers - 存储为 'true'/'false'，内部使用 boolean
export const editorLineNumbersAtom = atomWithStorage<BooleanStringValue>(
  CODE_EDITOR_STORAGE_KEYS.lineNumbers,
  CODE_EDITOR_DEFAULTS.showLineNumbers ? 'true' : 'false'
);

// fontSize - 存储为数字字符串，内部使用 number
export const editorFontSizeAtom = atomWithStorage<string>(
  CODE_EDITOR_STORAGE_KEYS.fontSize,
  String(CODE_EDITOR_DEFAULTS.fontSize)
);

// ============ Derived Atoms (类型转换) ============

// 将 'dark'/'light' 转换为 boolean
export const isDarkModeAtom = atom((get) => get(editorThemeAtom) === 'dark');

// 将 'true'/'false' 字符串转换为 boolean
export const isWordWrapAtom = atom((get) => get(editorWordWrapAtom) === 'true');

export const isMinimapEnabledAtom = atom((get) => get(editorMinimapAtom) === 'true');

export const isShowLineNumbersAtom = atom((get) => get(editorLineNumbersAtom) === 'true');

// 将数字字符串转换为 number
const DEFAULT_FONT_SIZE = 12;
export const fontSizeValueAtom = atom<number>((get) => {
  const value = Number(get(editorFontSizeAtom));
  return value || DEFAULT_FONT_SIZE;
});
