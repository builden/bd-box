import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// =============================================================================
// Types
// =============================================================================

export type Annotation = {
  id: string;
  x: number; // x position (px)
  y: number; // y position (px)
  element: string; // element description
  elementPath?: string; // DOM path (standard/detailed)
  selectedText?: string;
  comment?: string;
  isMultiSelect?: boolean;
  kind?: 'annotation' | 'placement' | 'rearrange';
  timestamp: number;
  colorId?: string;
  popupX?: number;
  popupY?: number;
  // Forensic/detailed fields
  fullPath?: string; // 完整 DOM 路径
  cssClasses?: string; // CSS 类
  boundingBox?: { x: number; y: number; width: number; height: number }; // 元素边界框
  nearbyText?: string; // 附近文本
  computedStyles?: string; // 计算样式
  accessibility?: string; // 无障碍信息
  nearbyElements?: string; // 附近元素
  sourceFile?: string; // 源码文件
  reactComponents?: string; // React 组件层级
};

// =============================================================================
// Core State Atoms
// =============================================================================

// Annotation mode toggle
export const isAnnotationModeAtom = atom(false);

// Annotations list - 使用 atomWithStorage 持久化
export const annotationsAtom = atomWithStorage<Annotation[]>('aivis-annotations', [], undefined, {
  getOnInit: true,
});

// Show/hide markers - 使用 atomWithStorage 持久化
export const showMarkersAtom = atomWithStorage<boolean>('aivis-show-markers', true, undefined, {
  getOnInit: true,
});

// =============================================================================
// UI State Atoms
// =============================================================================

// Current editing annotation (for tooltip display)
export const editingAnnotationAtom = atom<Annotation | null>(null);

// Hover state (for highlight and label)
export type HoverData = {
  x: number;
  y: number;
  clientY: number;
  element: string;
  elementPath: string;
  selectedText?: string;
  rect?: DOMRect;
  // Forensic fields
  fullPath?: string;
  cssClasses?: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
  nearbyText?: string;
  computedStyles?: string;
  accessibility?: string;
  nearbyElements?: string;
  sourceFile?: string;
  reactComponents?: string;
};

export const hoverAtom = atom<HoverData | null>(null);

// Pending annotation (before confirmed - popup shown after click)
export type PendingAnnotationData = {
  x: number;
  y: number;
  clientY: number;
  element: string;
  elementPath: string;
  selectedText?: string;
  rect?: DOMRect;
  popupX?: number;
  popupY?: number;
  colorId?: string;
  // Forensic fields
  fullPath?: string;
  cssClasses?: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
  nearbyText?: string;
  computedStyles?: string;
  accessibility?: string;
  nearbyElements?: string;
  sourceFile?: string;
  reactComponents?: string;
};

export const pendingAnnotationAtom = atom<PendingAnnotationData | null>(null);

// Shake trigger for popup
export const popupShakeAtom = atom<number>(0);

// =============================================================================
// Derived Atoms
// =============================================================================

// Has any annotations
export const hasAnnotationsAtom = atom((get) => get(annotationsAtom).length > 0);

// Visible annotations (not exiting)
export const visibleAnnotationsAtom = atom((get) => {
  const annotations = get(annotationsAtom);
  return annotations.filter((a) => a.kind !== 'placement' && a.kind !== 'rearrange');
});

// Annotation count
export const annotationCountAtom = atom((get) => get(annotationsAtom).length);
