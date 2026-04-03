import { useRef, useMemo, useCallback } from 'react';
import { useAtom } from 'jotai';
import clsx from 'clsx';
import { IconListSparkle } from './Icons';
import { isActiveAtom, isDraggingToolbarAtom } from '../store/toolbarAtoms';
import { useDragPosition, useDragEvents } from '../hooks';

export interface FloatingButtonProps {
  onClick?: () => void;
  className?: string;
}

export function FloatingButton({ onClick, className = '' }: FloatingButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [, setIsActive] = useAtom(isActiveAtom);
  const [isDragging] = useAtom(isDraggingToolbarAtom);

  const { toolbarPosition, setToolbarPosition } = useDragPosition();
  const { handleMouseDown, handleClick } = useDragEvents(buttonRef, setToolbarPosition);

  const onClickHandler = useCallback(() => {
    if (!handleClick()) return;
    setIsActive(true);
    onClick?.();
  }, [handleClick, setIsActive, onClick]);

  const positionStyle = useMemo(() => {
    if (toolbarPosition) {
      return {
        left: toolbarPosition.x,
        top: toolbarPosition.y,
      };
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
        'bg-neutral-900 text-white/85',
        'flex items-center justify-center',
        'cursor-grab select-none',
        'shadow-[0_2px_8px_rgba(0,0,0,0.2),0_4px_16px_rgba(0,0,0,0.1)]',
        'hover:bg-neutral-800',
        'active:scale-95 active:cursor-grabbing',
        isDragging && 'cursor-grabbing',
        'animate-toolbar-enter',
        'z-[100000]',
        className
      )}
      style={positionStyle}
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
