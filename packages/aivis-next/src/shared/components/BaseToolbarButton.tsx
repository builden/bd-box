import { memo, type ReactNode, type CSSProperties } from 'react';
import { useAtom } from 'jotai';
import clsx from 'clsx';
import { settingsAtom, COLOR_OPTIONS } from '@/shared/features/SettingsPanel/store';

export interface BaseToolbarButtonProps {
  icon: ReactNode;
  onClick?: (() => void) | undefined;
  disabled?: boolean;
  title?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  'data-no-drag'?: boolean | undefined;
  /** 右上角徽章数字 */
  badge?: number;
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
  badge,
}: BaseToolbarButtonProps) {
  const [settings] = useAtom(settingsAtom);
  const colorOption = COLOR_OPTIONS.find((c) => c.id === settings.annotationColorId);
  const badgeColor = colorOption?.srgb ?? '#EF4444';

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
        'relative',
        className
      )}
    >
      {icon}
      {badge !== undefined && badge > 0 && (
        <span
          className="absolute min-w-[20px] h-[20px] px-1 rounded-full text-white text-[10px] font-medium flex items-center justify-center"
          style={{
            top: -8,
            right: -8,
            backgroundColor: badgeColor,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
          }}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
});
