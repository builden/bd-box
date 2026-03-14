import { atom } from 'jotai';
import { uiPreferencesAtom } from '../primitives/prefs-atom';

/**
 * 侧边栏可见性
 */
export const sidebarVisibleAtom = atom((get) => get(uiPreferencesAtom).sidebarVisible);

/**
 * 是否自动展开工具面板
 */
export const autoExpandToolsAtom = atom((get) => get(uiPreferencesAtom).autoExpandTools);

/**
 * 是否显示思考过程
 */
export const showThinkingAtom = atom((get) => get(uiPreferencesAtom).showThinking);
