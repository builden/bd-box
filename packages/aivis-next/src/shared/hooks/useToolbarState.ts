import { useAtom } from 'jotai';
import { isDraggingToolbarAtom } from '../store/toolbarAtoms';
import { useDragPosition, useDragEvents } from './index';

/**
 * useToolbarState - Manages toolbar drag behavior
 */
export function useToolbarState(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [isDragging] = useAtom(isDraggingToolbarAtom);

  const { toolbarPosition, setToolbarPosition } = useDragPosition();
  const { handleMouseDown, handleClick } = useDragEvents(containerRef, setToolbarPosition);

  return {
    isDragging,
    toolbarPosition,
    handleMouseDown,
    handleClick,
  };
}
