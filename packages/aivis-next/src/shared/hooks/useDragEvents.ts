import { useEffect, useRef, useCallback } from 'react';
import { useAtom } from 'jotai';
import { isDraggingToolbarAtom } from '../store/toolbarAtoms';
import { DRAG_CONFIG } from './types';

/**
 * useDragEvents - Handles drag mouse events
 */
export function useDragEvents(
  buttonRef: React.RefObject<HTMLDivElement | null>,
  onDragEnd: (position: { x: number; y: number }) => void
) {
  const [, setIsDragging] = useAtom(isDraggingToolbarAtom);

  const dragStartRef = useRef<{
    x: number;
    y: number;
    buttonX: number;
    buttonY: number;
  } | null>(null);
  const justFinishedDragRef = useRef(false);
  const hasMovedRef = useRef(false);
  const isDraggingRef = useRef(false);

  // Memoize onDragEnd to prevent effect from re-running unnecessarily
  const onDragEndRef = useRef(onDragEnd);
  onDragEndRef.current = onDragEnd;

  // Handle mouse down
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!buttonRef.current) return;

      const rect = buttonRef.current.getBoundingClientRect();
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        buttonX: rect.left,
        buttonY: rect.top,
      };
      hasMovedRef.current = false;
      isDraggingRef.current = false;
    },
    [buttonRef]
  );

  // Handle drag events
  useEffect(() => {
    const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;

      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;

      // Check if we've moved beyond threshold
      if (
        !hasMovedRef.current &&
        (Math.abs(deltaX) > DRAG_CONFIG.THRESHOLD || Math.abs(deltaY) > DRAG_CONFIG.THRESHOLD)
      ) {
        hasMovedRef.current = true;
        isDraggingRef.current = true;
        setIsDragging(true);
      }

      if (isDraggingRef.current && buttonRef.current) {
        let newX = dragStartRef.current.buttonX + deltaX;
        let newY = dragStartRef.current.buttonY + deltaY;

        // Constrain to viewport
        newX = clamp(newX, DRAG_CONFIG.PADDING, window.innerWidth - DRAG_CONFIG.SIZE - DRAG_CONFIG.PADDING);
        newY = clamp(newY, DRAG_CONFIG.PADDING, window.innerHeight - DRAG_CONFIG.SIZE - DRAG_CONFIG.PADDING);

        // Direct DOM manipulation for smooth movement
        buttonRef.current.style.left = `${newX}px`;
        buttonRef.current.style.top = `${newY}px`;
      }
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        justFinishedDragRef.current = true;

        // Get final position and notify
        if (buttonRef.current) {
          const finalX = parseInt(buttonRef.current.style.left, 10);
          const finalY = parseInt(buttonRef.current.style.top, 10);
          onDragEndRef.current({ x: finalX, y: finalY });
        }
      }

      isDraggingRef.current = false;
      setIsDragging(false);
      dragStartRef.current = null;
      hasMovedRef.current = false;
    };

    const handleSelectStart = (e: Event) => {
      if (isDraggingRef.current) {
        e.preventDefault();
      }
    };

    // Handle window resize - clamp button position to stay in viewport
    const handleResize = () => {
      if (!buttonRef.current || isDraggingRef.current) return;

      const currentLeft = parseInt(buttonRef.current.style.left, 10);
      const currentTop = parseInt(buttonRef.current.style.top, 10);

      const newX = clamp(currentLeft, DRAG_CONFIG.PADDING, window.innerWidth - DRAG_CONFIG.SIZE - DRAG_CONFIG.PADDING);
      const newY = clamp(currentTop, DRAG_CONFIG.PADDING, window.innerHeight - DRAG_CONFIG.SIZE - DRAG_CONFIG.PADDING);

      if (newX !== currentLeft || newY !== currentTop) {
        buttonRef.current.style.left = `${newX}px`;
        buttonRef.current.style.top = `${newY}px`;
        onDragEndRef.current({ x: newX, y: newY });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('selectstart', handleSelectStart);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('selectstart', handleSelectStart);
      window.removeEventListener('resize', handleResize);
    };
  }, [buttonRef, setIsDragging]);

  // Handle click - only triggers if not a drag
  const handleClick = useCallback(() => {
    if (justFinishedDragRef.current) {
      justFinishedDragRef.current = false;
      return false;
    }
    return true;
  }, []);

  return {
    handleMouseDown,
    handleClick,
  };
}
