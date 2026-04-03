import { useState, useEffect, useRef, useCallback } from 'react';
import { useAtom } from 'jotai';
import { IconListSparkle } from './Icons';
import { toolbarPositionAtom, isDraggingToolbarAtom, isActiveAtom } from '../store/toolbarAtoms';

interface FloatingButtonProps {
  onClick?: () => void;
  className?: string;
}

// Drag threshold to distinguish click from drag
const DRAG_THRESHOLD = 5;

// Button size
const BUTTON_SIZE = 44;
const PADDING = 20;

export function FloatingButton({ onClick, className = '' }: FloatingButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useAtom(toolbarPositionAtom);
  const [isDragging, setIsDragging] = useAtom(isDraggingToolbarAtom);
  const [, setIsActive] = useAtom(isActiveAtom);

  const buttonRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{
    x: number;
    y: number;
    buttonX: number;
    buttonY: number;
  } | null>(null);
  const justFinishedDragRef = useRef(false);
  const hasMovedRef = useRef(false);
  const isDraggingRef = useRef(false);
  const isInitializedRef = useRef(false);

  // Calculate default position on mount - only runs when toolbarPosition is null
  useEffect(() => {
    if (toolbarPosition === null && !isInitializedRef.current) {
      isInitializedRef.current = true;
      const defaultX = window.innerWidth - BUTTON_SIZE - PADDING;
      const defaultY = window.innerHeight - BUTTON_SIZE - PADDING;
      setToolbarPosition({ x: defaultX, y: defaultY });
    }
  }, [toolbarPosition, setToolbarPosition]);

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => {}, 500);
    return () => clearTimeout(timer);
  }, []);

  // Handle mouse down
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
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
    setIsPressed(true);
  }, []);

  // Handle mouse move - use direct DOM manipulation for smooth dragging
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
      setIsPressed(false);
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
  }, [setToolbarPosition, setIsDragging]);

  // Handle click
  const handleClick = useCallback(() => {
    if (justFinishedDragRef.current) {
      justFinishedDragRef.current = false;
      return;
    }
    setIsActive(true);
    onClick?.();
  }, [onClick, setIsActive]);

  // Compute initial style
  const getInitialStyle = (): React.CSSProperties => {
    if (toolbarPosition) {
      return {
        position: 'fixed' as const,
        left: toolbarPosition.x,
        top: toolbarPosition.y,
      };
    }
    return {
      position: 'fixed' as const,
      left: -9999,
      top: -9999,
    };
  };

  return (
    <div
      ref={buttonRef}
      className={`floating-button entrance ${isPressed ? 'pressed' : ''} ${isDragging ? 'dragging' : ''} ${className}`}
      style={getInitialStyle()}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      role="button"
      tabIndex={0}
      aria-label="Toggle toolbar"
    >
      <style>{`
        .floating-button {
          width: 44px;
          height: 44px;
          border-radius: 22px;
          background: #1a1a1a;
          color: rgba(255, 255, 255, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: grab;
          user-select: none;
          box-shadow:
            0 2px 8px rgba(0, 0, 0, 0.2),
            0 4px 16px rgba(0, 0, 0, 0.1);
          transition:
            background-color 0.15s ease;
          animation: toolbarEnter 0.5s cubic-bezier(0.34, 1.2, 0.64, 1) forwards;
          z-index: 100000;
        }

        @keyframes toolbarEnter {
          from {
            opacity: 0;
            transform: scale(0.5) rotate(90deg);
          }
          to {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }

        .floating-button:hover {
          background: #2a2a2a;
        }

        .floating-button:active,
        .floating-button.pressed {
          transform: scale(0.95);
          cursor: grabbing;
        }

        .floating-button.dragging {
          cursor: grabbing;
        }

        .floating-button.entrance {
          animation: toolbarEnter 0.5s cubic-bezier(0.34, 1.2, 0.64, 1) forwards;
        }
      `}</style>
      <IconListSparkle size={24} />
    </div>
  );
}
