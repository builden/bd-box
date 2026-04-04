import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { ToolbarPosition } from './types';

// Persistent position atom - saved to localStorage
export const toolbarPositionAtom = atomWithStorage<ToolbarPosition>(
  'aivis-next-toolbar-position',
  null, // null means use default position
  undefined, // use default localStorage
  { getOnInit: true } // read from localStorage on init
);

// Dragging state atom
export const isDraggingToolbarAtom = atom(false);

// Active state (expanded/collapsed)
export const isActiveAtom = atom(false);
