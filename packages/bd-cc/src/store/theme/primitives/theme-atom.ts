import { atomWithStorage } from 'jotai/utils';
import { STORAGE_KEYS } from '../../constants';

export type Theme = 'light' | 'dark';

const DEFAULT_THEME: Theme = 'dark';

/**
 * 主题 atom - 使用 atomWithStorage 自动持久化
 */
export const themeAtom = atomWithStorage<Theme>(STORAGE_KEYS.THEME, DEFAULT_THEME);
