import { useEffect, useRef, useCallback } from 'react';
import { useAtom } from 'jotai';
import { isDraggingToolbarAtom } from '../store/toolbarAtoms';
import { DRAG_CONFIG } from './types';
import { getMinPosition, getMaxPosition } from './dragUtils';

/**
 * Options for useDragEvents
 */
export interface UseDragEventsOptions {
  width: number;
  height: number;
}

/**
 * useDragEvents - Handles drag mouse events
 * 拖拽逻辑：记录初始鼠标位置和元素位置，拖动时计算偏移量应用新位置
 * 位置使用 bottom-right 作为共用参考点
 */
export function useDragEvents(
  buttonRef: React.RefObject<HTMLDivElement | null>,
  onDragEnd: (position: { x: number; y: number }) => void,
  options: UseDragEventsOptions
) {
  const [, setIsDragging] = useAtom(isDraggingToolbarAtom);

  const dragStartRef = useRef<{
    mouseX: number;
    mouseY: number;
    elemX: number;
    elemY: number;
  } | null>(null);
  const justFinishedDragRef = useRef(false);
  const hasMovedRef = useRef(false);
  const isDraggingRef = useRef(false);

  // Memoize onDragEnd to prevent effect from re-running unnecessarily
  const onDragEndRef = useRef(onDragEnd);
  onDragEndRef.current = onDragEnd;

  // Handle mouse down - record initial mouse position and element position
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!buttonRef.current) return;

      const elemX = parseInt(buttonRef.current.style.left, 10);
      const elemY = parseInt(buttonRef.current.style.top, 10);

      dragStartRef.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        elemX: isNaN(elemX) ? 0 : elemX,
        elemY: isNaN(elemY) ? 0 : elemY,
      };
      hasMovedRef.current = false;
      isDraggingRef.current = false;
    },
    [buttonRef]
  );

  // Handle drag events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current || !buttonRef.current) return;

      const deltaX = e.clientX - dragStartRef.current.mouseX;
      const deltaY = e.clientY - dragStartRef.current.mouseY;

      // Check if we've moved beyond threshold
      if (
        !hasMovedRef.current &&
        (Math.abs(deltaX) > DRAG_CONFIG.THRESHOLD || Math.abs(deltaY) > DRAG_CONFIG.THRESHOLD)
      ) {
        hasMovedRef.current = true;
        isDraggingRef.current = true;
        setIsDragging(true);
      }

      if (isDraggingRef.current) {
        // 新位置 = 初始元素位置 + 鼠标偏移量
        let newX = dragStartRef.current.elemX + deltaX;
        let newY = dragStartRef.current.elemY + deltaY;

        // 限制在视口边界内（基于组件尺寸）
        const minPos = getMinPosition(options.width);
        const maxPos = getMaxPosition(options.width);
        newX = Math.max(minPos.x, Math.min(maxPos.x, newX));
        newY = Math.max(minPos.y, Math.min(maxPos.y, newY));

        buttonRef.current.style.left = `${newX}px`;
        buttonRef.current.style.top = `${newY}px`;
      }
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        justFinishedDragRef.current = true;

        // Get final position (top-left) and convert to bottom-right (共用参考点)
        if (buttonRef.current) {
          const finalX = parseInt(buttonRef.current.style.left, 10);
          const finalY = parseInt(buttonRef.current.style.top, 10);
          onDragEndRef.current({ x: finalX + options.width, y: finalY + options.height });
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

      if (isNaN(currentLeft) || isNaN(currentTop)) return;

      const minPos = getMinPosition(options.width);
      const maxPos = getMaxPosition(options.width);
      const newX = Math.max(minPos.x, Math.min(maxPos.x, currentLeft));
      const newY = Math.max(minPos.y, Math.min(maxPos.y, currentTop));

      if (newX !== currentLeft || newY !== currentTop) {
        buttonRef.current.style.left = `${newX}px`;
        buttonRef.current.style.top = `${newY}px`;
        // Convert top-left to bottom-right (共用参考点)
        onDragEndRef.current({ x: newX + options.width, y: newY + options.height });
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
