import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { DesignPlacement, RearrangeState, SnapGuide, ComponentType } from './types';

// =============================================================================
// Mode Atoms
// =============================================================================

// Layout Mode 总开关
export const isLayoutModeAtom = atom(false);

// Rearrange Mode 子开关（从属于 Layout Mode）
export const isRearrangeModeAtom = atom(false);

// =============================================================================
// Design Mode Atoms
// =============================================================================

// 已放置的组件列表 - 持久化
export const designPlacementsAtom = atomWithStorage<DesignPlacement[]>('aivis-next-layout-placements', [], undefined, {
  getOnInit: true,
});

// 当前选中的组件类型（从 ComponentPanel 选择）
export const activeDesignComponentAtom = atom<ComponentType | null>(null);

// 当前选中的已放置组件 ID
export const selectedPlacementIdAtom = atom<string | null>(null);

// 吸附引导线状态
export const snapGuidesAtom = atom<SnapGuide[]>([]);

// 组件面板是否展开
export const isComponentPanelOpenAtom = atom(true);

// 从 ComponentPanel 拖动状态
export const draggingFromPaletteAtom = atom<{
  type: ComponentType;
  startX: number;
  startY: number;
} | null>(null);

// =============================================================================
// Rearrange Mode Atoms
// =============================================================================

// Rearrange 状态 - 持久化
export const rearrangeStateAtom = atomWithStorage<RearrangeState | null>(
  'aivis-next-layout-rearrange',
  null,
  undefined,
  { getOnInit: true }
);

// 当前选中的区域 ID（可多选）
export const selectedSectionIdsAtom = atom<Set<string>>(new Set<string>());

// 区域检测是否已完成
export const sectionsDetectedAtom = atom(false);

// =============================================================================
// Derived Atoms
// =============================================================================

// 是否有已放置的组件
export const hasPlacementsAtom = atom((get) => get(designPlacementsAtom).length > 0);

// 是否有已检测的区域
export const hasSectionsAtom = atom((get) => {
  const state = get(rearrangeStateAtom);
  return state !== null && state.sections.length > 0;
});

// 当前选中的组件
export const selectedPlacementAtom = atom((get) => {
  const id = get(selectedPlacementIdAtom);
  if (!id) return null;
  return get(designPlacementsAtom).find((p) => p.id === id) ?? null;
});

// 已选中的区域列表
export const selectedSectionsAtom = atom((get) => {
  const ids = get(selectedSectionIdsAtom);
  const state = get(rearrangeStateAtom);
  if (!state) return [];
  return state.sections.filter((s) => ids.has(s.id));
});
