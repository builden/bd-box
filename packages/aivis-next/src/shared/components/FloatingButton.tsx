import { useRef, useMemo, useCallback } from 'react';
import { useAtom } from 'jotai';
import clsx from 'clsx';
import { IconListSparkle } from './Icons';
import { isActiveAtom, isDraggingToolbarAtom } from '../store/toolbarAtoms';
import { useDragPosition, useDragEvents } from '../hooks';
import { DRAG_CONFIG } from '../hooks/types';
import { toTopLeft } from '../hooks/dragUtils';

export interface FloatingButtonProps {
  onClick?: () => void;
  className?: string;
}

export function FloatingButton({ onClick, className = '' }: FloatingButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [, setIsActive] = useAtom(isActiveAtom);
  const [isDragging] = useAtom(isDraggingToolbarAtom);

  const { toolbarPosition, setToolbarPosition } = useDragPosition();
  const { handleMouseDown, handleClick } = useDragEvents(buttonRef, setToolbarPosition, {
    width: DRAG_CONFIG.SIZE,
    height: DRAG_CONFIG.SIZE,
  });

  const onClickHandler = useCallback(() => {
    if (!handleClick()) return;
    setIsActive(true);
    onClick?.();
  }, [handleClick, setIsActive, onClick]);

  const buttonStyle = useMemo(() => {
    if (toolbarPosition) {
      return toTopLeft(toolbarPosition, DRAG_CONFIG.SIZE, DRAG_CONFIG.SIZE);
    }
    return {
      left: -9999,
      top: -9999,
    };
  }, [toolbarPosition]);

  return (
    <div
      ref={buttonRef}
      className={clsx(
        'fixed w-11 h-11 rounded-full',
        'bg-neutral-900',
        'hover:bg-neutral-800',
        'shadow-[0_4px_12px_rgba(0,0,0,0.25),0_8px_24px_rgba(0,0,0,0.15)]',
        'hover:shadow-[0_6px_16px_rgba(0,0,0,0.3),0_12px_32px_rgba(0,0,0,0.2)]',
        'flex items-center justify-center',
        'text-white/85',
        'active:scale-95',
        'transition-all duration-150 ease-out',
        'animate-toolbar-enter',
        'cursor-grab select-none',
        'focus:outline-none',
        isDragging && 'cursor-grabbing',
        'z-[100000]',
        className
      )}
      style={buttonStyle}
      onClick={onClickHandler}
      onMouseDown={handleMouseDown}
      role="button"
      tabIndex={0}
      aria-label="Toggle toolbar"
    >
      <IconListSparkle size={24} />
    </div>
  );
}
