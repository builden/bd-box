import { memo, type ReactNode, type CSSProperties } from 'react';
import clsx from 'clsx';

export interface BaseToolbarButtonProps {
  icon: ReactNode;
  onClick?: (() => void) | undefined;
  disabled?: boolean;
  title?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  'data-no-drag'?: boolean | undefined;
}

/**
 * BaseToolbarButton - 工具栏按钮基础组件
 * 尺寸: 34x34px, 圆形
 * 提供基础 UI 样式和状态管理
 */
export const BaseToolbarButton = memo(function BaseToolbarButton({
  icon,
  onClick,
  disabled = false,
  title,
  className = '',
  style,
  'data-no-drag': dataNoDrag,
}: BaseToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      data-no-drag={dataNoDrag}
      style={{ color: 'var(--toolbar-icon)', ...style }}
      className={clsx(
        'w-[34px] h-[34px]',
        'rounded-full',
        'flex items-center justify-center',
        'transition-all duration-150 ease-out',
        'hover:bg-[var(--toolbar-hover-bg)]',
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
