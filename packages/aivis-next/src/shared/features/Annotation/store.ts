import { atom } from 'jotai';

// =============================================================================
// Types
// =============================================================================

export type Annotation = {
  id: string;
  x: number; // x position (percentage)
  y: number; // y position (px)
  element: string; // element description
  selectedText?: string;
  comment?: string;
  isMultiSelect?: boolean;
  kind?: 'annotation' | 'placement' | 'rearrange';
  timestamp: number;
};

// =============================================================================
// Core State Atoms
// =============================================================================

// Annotation mode toggle
export const isAnnotationModeAtom = atom(false);

// Annotations list
export const annotationsAtom = atom<Annotation[]>([]);

// Show/hide markers
export const showMarkersAtom = atom(true);

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
