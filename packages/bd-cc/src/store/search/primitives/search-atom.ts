import { atomWithDebounce } from '@builden/bd-utils/jotai';

/**
 * 侧边栏搜索防抖 atom (400ms 延迟)
 */
export const sidebarSearchAtoms = atomWithDebounce('', 400);

/**
 * 文件树搜索防抖 atom (300ms 延迟)
 */
export const fileTreeSearchAtoms = atomWithDebounce('', 300);
