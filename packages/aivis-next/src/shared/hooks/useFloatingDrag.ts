import { useEffect, useRef, useCallback } from 'react';
import { useAtom } from 'jotai';
import { toolbarPositionAtom, isDraggingToolbarAtom } from '../store/toolbarAtoms';

// Drag threshold to distinguish click from drag
const DRAG_THRESHOLD = 5;

// Button size
const BUTTON_SIZE = 44;
const PADDING = 20;

export function useFloatingDrag(buttonRef: React.RefObject<HTMLDivElement | null>) {
  const [toolbarPosition, setToolbarPosition] = useAtom(toolbarPositionAtom);
  const [isDragging, setIsDragging] = useAtom(isDraggingToolbarAtom);

  const dragStartRef = useRef<{
    x: number;
    y: number;
    buttonX: number;
    buttonY: number;
  } | null>(null);
  const justFinishedDragRef = useRef(false);
  const hasMovedRef = useRef(false);
  const isDraggingRef = useRef(false);

  // Calculate default position on mount
  useEffect(() => {
    // Check if position is invalid (null, negative, or outside viewport)
    const isInvalidPosition = (pos: typeof toolbarPosition) =>
      pos === null || pos.x < 0 || pos.y < 0 || pos.x > window.innerWidth || pos.y > window.innerHeight;

    if (isInvalidPosition(toolbarPosition)) {
      const defaultX = window.innerWidth - BUTTON_SIZE - PADDING;
      const defaultY = window.innerHeight - BUTTON_SIZE - PADDING;
      setToolbarPosition({ x: defaultX, y: defaultY });
    }
  }, [toolbarPosition, setToolbarPosition]);

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
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;

      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;

      // Check if we've moved beyond threshold
      if (!hasMovedRef.current && (Math.abs(deltaX) > DRAG_THRESHOLD || Math.abs(deltaY) > DRAG_THRESHOLD)) {
        hasMovedRef.current = true;
        isDraggingRef.current = true;
        setIsDragging(true);
      }

      if (isDraggingRef.current && buttonRef.current) {
        let newX = dragStartRef.current.buttonX + deltaX;
        let newY = dragStartRef.current.buttonY + deltaY;

        // Constrain to viewport
        newX = Math.max(PADDING, Math.min(window.innerWidth - BUTTON_SIZE - PADDING, newX));
        newY = Math.max(PADDING, Math.min(window.innerHeight - BUTTON_SIZE - PADDING, newY));

        // Direct DOM manipulation for smooth movement
        buttonRef.current.style.left = `${newX}px`;
        buttonRef.current.style.top = `${newY}px`;
      }
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        justFinishedDragRef.current = true;

        // Get final position and persist to atom
        if (buttonRef.current) {
          const finalX = parseInt(buttonRef.current.style.left, 10);
          const finalY = parseInt(buttonRef.current.style.top, 10);
          setToolbarPosition({ x: finalX, y: finalY });
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

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('selectstart', handleSelectStart);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('selectstart', handleSelectStart);
    };
  }, [buttonRef, setToolbarPosition, setIsDragging]);

  // Handle click - only triggers if not a drag
  const handleClick = useCallback(() => {
    if (justFinishedDragRef.current) {
      justFinishedDragRef.current = false;
      return false;
    }
    return true;
  }, []);

  return {
    toolbarPosition,
    isDragging,
    handleMouseDown,
    handleClick,
    justFinishedDragRef,
  };
}
