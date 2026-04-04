import { memo } from 'react';
import clsx from 'clsx';
import type { ReactNode } from 'react';

export interface ToolbarButtonProps {
  icon: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  className?: string;
  stopPropagation?: boolean;
}

/**
 * ToolbarButton - 单个工具栏按钮
 * 尺寸: 34x34px, 圆形
 */
export const ToolbarButton = memo(function ToolbarButton({
  icon,
  onClick,
  disabled = false,
  title,
  className = '',
  stopPropagation = false,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      onMouseDown={(e) => stopPropagation && e.stopPropagation()}
      className={clsx(
        'w-[34px] h-[34px]',
        'rounded-full',
        'flex items-center justify-center',
        'text-white/85',
        'transition-all duration-150 ease-out',
        'hover:bg-white/12',
        'active:scale-95',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'cursor-pointer',
        className
      )}
    >
      {icon}
    </button>
  );
});
