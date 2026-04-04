import { memo } from 'react';
import clsx from 'clsx';
import type { ReactNode } from 'react';

export interface ToolbarButtonProps {
  icon: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  className?: string;
  isActive?: boolean;
  /** 激活状态的高亮颜色，默认 #f59e0b (amber-500) */
  activeColor?: string;
  /** 激活状态的高亮背景色透明度，默认 25% */
  activeBgOpacity?: number;
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
  isActive = false,
  activeColor = '#f59e0b',
  activeBgOpacity = 25,
}: ToolbarButtonProps) {
  const activeStyle: React.CSSProperties = isActive
    ? {
        color: activeColor,
        backgroundColor: `color-mix(in srgb, ${activeColor} ${activeBgOpacity}%, transparent)`,
      }
    : {};

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      data-no-drag={isActive ? undefined : true}
      style={activeStyle}
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
