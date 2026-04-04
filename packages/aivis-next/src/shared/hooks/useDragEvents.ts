import { useEffect, useRef, useCallback } from 'react';
import { useAtom } from 'jotai';
import { isDraggingToolbarAtom } from '../store/toolbarAtoms';
import { DRAG_CONFIG } from './types';
import { clamp, getMinPosition, getMaxPosition } from './dragUtils';

/**
 * useDragEvents - Handles drag mouse events
 * 拖拽逻辑：记录初始鼠标位置和元素位置，拖动时计算偏移量应用新位置
 * 位置使用 right/top 坐标存储
 */
export function useDragEvents(
  buttonRef: React.RefObject<HTMLDivElement | null>,
  onDragEnd: (position: { x: number; y: number }) => void
) {
  const [, setIsDragging] = useAtom(isDraggingToolbarAtom);

  const dragStartRef = useRef<{
    mouseX: number;
    mouseY: number;
    elemRight: number;
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

      const elemRight = parseInt(buttonRef.current.style.right, 10);
      const elemY = parseInt(buttonRef.current.style.top, 10);

      dragStartRef.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        elemRight: isNaN(elemRight) ? 0 : elemRight,
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
        // 新位置 = 初始元素位置 + 鼠标偏移量（right 坐标：鼠标右移则 right 减小，元素右移）
        let newRight = dragStartRef.current.elemRight - deltaX;
        let newY = dragStartRef.current.elemY + deltaY;

        // 限制在视口边界内
        const minPos = getMinPosition();
        const maxPos = getMaxPosition();
        newRight = clamp(newRight, minPos.x, maxPos.x);
        newY = clamp(newY, minPos.y, maxPos.y);

        buttonRef.current.style.right = `${newRight}px`;
        buttonRef.current.style.top = `${newY}px`;
      }
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        justFinishedDragRef.current = true;

        // Get final position (right, top) - right is directly usable as bottom-right x
        if (buttonRef.current) {
          const finalRight = parseInt(buttonRef.current.style.right, 10);
          const finalY = parseInt(buttonRef.current.style.top, 10);
          onDragEndRef.current({ x: finalRight, y: finalY });
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

      const currentRight = parseInt(buttonRef.current.style.right, 10);
      const currentTop = parseInt(buttonRef.current.style.top, 10);

      if (isNaN(currentRight) || isNaN(currentTop)) return;

      const minPos = getMinPosition();
      const maxPos = getMaxPosition();
      const newRight = clamp(currentRight, minPos.x, maxPos.x);
      const newY = clamp(currentTop, minPos.y, maxPos.y);

      if (newRight !== currentRight || newY !== currentTop) {
        buttonRef.current.style.right = `${newRight}px`;
        buttonRef.current.style.top = `${newY}px`;
        // right is directly usable as bottom-right x
        onDragEndRef.current({ x: newRight, y: newY });
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
