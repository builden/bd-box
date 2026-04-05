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

// Pending annotation (before confirmed)
export const pendingAnnotationAtom = atom<{
  x: number;
  y: number;
  clientY: number;
  element: string;
  elementPath: string;
  selectedText?: string;
} | null>(null);

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
