import { useRef, useMemo, useCallback } from 'react';
import { useAtom } from 'jotai';
import clsx from 'clsx';
import { IconListSparkle } from './Icons';
import { isActiveAtom, isDraggingToolbarAtom } from '../store/toolbarAtoms';
import { useDragPosition, useDragEvents } from '../hooks';
import { DRAG_CONFIG } from '../hooks/types';

export interface FloatingButtonProps {
  onClick?: () => void;
  className?: string;
}

export function FloatingButton({ onClick, className = '' }: FloatingButtonProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [, setIsActive] = useAtom(isActiveAtom);
  const [isDragging] = useAtom(isDraggingToolbarAtom);

  const { toolbarPosition, setToolbarPosition } = useDragPosition();
  const { handleMouseDown, handleClick } = useDragEvents(outerRef, setToolbarPosition, {
    width: DRAG_CONFIG.SIZE,
    height: DRAG_CONFIG.SIZE,
  });

  const onClickHandler = useCallback(() => {
    if (!handleClick()) return;
    setIsActive(true);
    onClick?.();
  }, [handleClick, setIsActive, onClick]);

  const outerStyle = useMemo(() => {
    if (toolbarPosition) {
      // toolbarPosition 是 bottom-right，转换为 top-left
      return {
        left: toolbarPosition.x - DRAG_CONFIG.SIZE,
        top: toolbarPosition.y - DRAG_CONFIG.SIZE,
      };
    }
    return {
      left: -9999,
      top: -9999,
    };
  }, [toolbarPosition]);

  return (
    <div
      ref={outerRef}
      className={clsx(
        'fixed w-11 h-11',
        'cursor-grab select-none',
        'focus:outline-none',
        isDragging && 'cursor-grabbing',
        'z-[100000]',
        className
      )}
      style={outerStyle}
      onClick={onClickHandler}
      onMouseDown={handleMouseDown}
      role="button"
      tabIndex={0}
      aria-label="Toggle toolbar"
    >
      <div
        ref={innerRef}
        className={clsx(
          'w-full h-full rounded-full',
          'bg-neutral-900',
          'hover:bg-neutral-800',
          'shadow-[0_4px_12px_rgba(0,0,0,0.25),0_8px_24px_rgba(0,0,0,0.15)]',
          'hover:shadow-[0_6px_16px_rgba(0,0,0,0.3),0_12px_32px_rgba(0,0,0,0.2)]',
          'flex items-center justify-center',
          'text-white/85',
          'active:scale-95',
          'transition-all duration-150 ease-out',
          'animate-toolbar-enter'
        )}
      >
        <IconListSparkle size={24} />
      </div>
    </div>
  );
}
