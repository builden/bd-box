// Components
export { FloatingButton } from './shared/components/FloatingButton';
export type { FloatingButtonProps } from './shared/components/FloatingButton';
export { Button } from './shared/components/Button';
export type { ButtonProps } from './shared/components/Button';
export { IconListSparkle } from './shared/components/Icons';

// Hooks
export { useDragPosition, useDragEvents, DRAG_CONFIG } from './shared/hooks';

// Store
export type { ToolbarPosition } from './shared/store/types';
export { toolbarPositionAtom, isDraggingToolbarAtom, isActiveAtom } from './shared/store';

export const version = '0.0.1';
