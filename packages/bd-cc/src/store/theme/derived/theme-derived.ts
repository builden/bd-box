import { atom } from 'jotai';
import { themeAtom } from '../primitives/theme-atom';

/**
 * 是否为深色模式
 */
export const isDarkModeAtom = atom((get) => get(themeAtom) === 'dark');
