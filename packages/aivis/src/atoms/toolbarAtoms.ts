/**
 * Toolbar atoms for PageFeedbackToolbarCSS state management.
 * Uses Jotai for atomic state management.
 */

import { atom } from 'jotai';
import type { Annotation } from '../types';
import type { ToolbarSettings, ToolbarMode, HoverInfo } from '../components/page-toolbar-css/types';
import type { DesignPlacement, ComponentType, RearrangeState } from '../components/design-mode/types';

// =============================================================================
// Types
// =============================================================================

export type PendingAnnotationData = {
  x: number;
  y: number;
  clientY: number;
  element: string;
  elementPath: string;
  selectedText?: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
  nearbyText?: string;
  cssClasses?: string;
  isMultiSelect?: boolean;
  isFixed?: boolean;
  fullPath?: string;
  accessibility?: string;
  computedStyles?: string;
  computedStylesObj?: Record<string, string>;
  nearbyElements?: string;
  reactComponents?: string;
  sourceFile?: string;
  elementBoundingBoxes?: Array<{ x: number; y: number; width: number; height: number }>;
  multiSelectElements?: HTMLElement[];
  targetElement?: HTMLElement;
};

// =============================================================================
// Core State Atoms
// =============================================================================

// Active state
export const isActiveAtom = atom(false);

// Annotations
export const annotationsAtom = atom<Annotation[]>([]);
export const showMarkersAtom = atom(true);

// Toolbar mode
export const toolbarModeAtom = atom<ToolbarMode>(null);

// Derived atoms for mode checks
export const isDesignModeAtom = atom((get) => get(toolbarModeAtom) === 'layout');
export const isStyleEditorModeAtom = atom((get) => get(toolbarModeAtom) === 'style');
export const isAnnotationModeAtom = atom((get) => get(toolbarModeAtom) === 'annotation');

// =============================================================================
// Marker State Atoms
// =============================================================================

export const markersVisibleAtom = atom(false);
export const markersExitingAtom = atom(false);
export const animatedMarkersAtom = atom<Set<string>>(new Set<string>());
export const hoveredMarkerIdAtom = atom<string | null>(null);
export const deletingMarkerIdAtom = atom<string | null>(null);
export const renumberFromAtom = atom<number | null>(null);
export const exitingMarkersAtom = atom<Set<string>>(new Set<string>());

// =============================================================================
// Hover State Atoms
// =============================================================================

export const hoverInfoAtom = atom<HoverInfo | null>(null);
export const hoverPositionAtom = atom({ x: 0, y: 0 });
export const hoveredTargetElementAtom = atom<HTMLElement | null>(null);
export const hoveredTargetElementsAtom = atom<HTMLElement[]>([]);

// =============================================================================
// Editing State Atoms
// =============================================================================

export const editingAnnotationAtom = atom<Annotation | null>(null);
export const editingTargetElementAtom = atom<HTMLElement | null>(null);
export const editingTargetElementsAtom = atom<HTMLElement[]>([]);
export const pendingAnnotationAtom = atom<PendingAnnotationData | null>(null);
export const editExitingAtom = atom(false);

// =============================================================================
// UI State Atoms
// =============================================================================

export const isFrozenAtom = atom(false);
export const showSettingsAtom = atom(false);
export const showSettingsVisibleAtom = atom(false);
export const settingsPageAtom = atom<'main' | 'automations'>('main');
export const tooltipsHiddenAtom = atom(false);
export const tooltipSessionActiveAtom = atom(false);
export const copiedAtom = atom(false);
export const sendStateAtom = atom<'idle' | 'sending' | 'sent' | 'failed'>('idle');
export const isClearingAtom = atom(false);
export const scrollYAtom = atom(0);
export const isScrollingAtom = atom(false);
export const mountedAtom = atom(false);
export const pendingExitingAtom = atom(false);
export const isDraggingAtom = atom(false);

// =============================================================================
// Toolbar Visibility Atoms
// =============================================================================

export const isToolbarHiddenAtom = atom(false);
export const isToolbarHidingAtom = atom(false);
export const showEntranceAnimationAtom = atom(false);

// =============================================================================
// Design Mode State Atoms
// =============================================================================

export const designPlacementsAtom = atom<DesignPlacement[]>([]);
export const activeDesignComponentAtom = atom<ComponentType | null>(null);
export const blankCanvasAtom = atom(false);
export const canvasReadyAtom = atom(false);
export const canvasOpacityAtom = atom(1);
export const designInteractingAtom = atom(false);
export const rearrangeStateAtom = atom<RearrangeState | null>(null);
export const wireframePurposeAtom = atom('');
export const designOverlayExitingAtom = atom(false);

// Cross-overlay deselect signals
export const designDeselectSignalAtom = atom(0);
export const rearrangeDeselectSignalAtom = atom(0);
export const designClearSignalAtom = atom(0);
export const rearrangeClearSignalAtom = atom(0);

// =============================================================================
// Style Editor Atoms
// =============================================================================

export const styleEditorElementAtom = atom<HTMLElement | null>(null);

// =============================================================================
// Settings Atoms
// =============================================================================

import { DEFAULT_SETTINGS } from '../components/page-toolbar-css/constants';

export const settingsAtom = atom<ToolbarSettings>(DEFAULT_SETTINGS);
export const isDarkModeAtom = atom(true);

// =============================================================================
// Connection State Atoms
// =============================================================================

export const currentSessionIdAtom = atom<string | null>(null);
export const connectionStatusAtom = atom<'disconnected' | 'connecting' | 'connected'>('disconnected');

// =============================================================================
// Toolbar Position Atoms
// =============================================================================

export const toolbarPositionAtom = atom<{ x: number; y: number } | null>(null);
export const isDraggingToolbarAtom = atom(false);

// =============================================================================
// Draw Mode Atoms
// =============================================================================

export const isDrawModeAtom = atom(false);
export const drawStrokesAtom = atom<
  Array<{ id: string; points: Array<{ x: number; y: number }>; color: string; fixed: boolean }>
>([]);
export const hoveredDrawingIdxAtom = atom<number | null>(null);

// =============================================================================
// Multi-select State Atoms
// =============================================================================

export const pendingMultiSelectElementsAtom = atom<
  Array<{ element: HTMLElement; rect: DOMRect; name: string; path: string; reactComponents?: string }>
>([]);

// =============================================================================
// Computed/Utility Atoms
// =============================================================================

// Has any content to render
export const hasAnnotationsAtom = atom((get) => get(annotationsAtom).length > 0);

// Visible annotations (not exiting, not placement/rearrange)
export const visibleAnnotationsAtom = atom((get) => {
  const annotations = get(annotationsAtom);
  const exiting = get(exitingMarkersAtom);
  return annotations.filter((a) => !exiting.has(a.id) && a.kind !== 'placement' && a.kind !== 'rearrange');
});

// Has visible annotations
export const hasVisibleAnnotationsAtom = atom((get) => get(visibleAnnotationsAtom).length > 0);
