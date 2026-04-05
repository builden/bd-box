import { memo, type ReactNode } from 'react';
import { BaseToolbarButton, type BaseToolbarButtonProps } from './BaseToolbarButton';

export interface ToolbarButtonProps extends Omit<BaseToolbarButtonProps, 'icon'> {
  icon: ReactNode;
  /** 激活状态 */
  isActive?: boolean;
  /** 激活状态的高亮颜色，默认 #f59e0b (amber-500) */
  activeColor?: string;
  /** 激活状态的高亮背景色透明度，默认 25% */
  activeBgOpacity?: number;
  /** 右上角徽章数字 */
  badge?: number;
}

/**
 * ToolbarButton - 带激活状态的工具栏按钮
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
  badge,
}: ToolbarButtonProps) {
  const activeStyle = isActive
    ? {
        color: activeColor,
        backgroundColor: `color-mix(in srgb, ${activeColor} ${activeBgOpacity}%, transparent)`,
      }
    : undefined;

  return (
    <BaseToolbarButton
      icon={icon}
      onClick={onClick}
      disabled={disabled}
      title={title}
      data-no-drag={isActive ? undefined : true}
      style={activeStyle}
      className={className}
      {...(badge !== undefined && { badge })}
    />
  );
});
