import clsx from 'clsx';
import { IconXmarkLarge, IconListSparkle } from '@/shared/components/Icons';
import { useToggleButton } from './useToggleButton';

interface ToggleButtonProps {
  handleClick: () => boolean;
}

export function ToggleButton({ handleClick }: ToggleButtonProps) {
  const { isActive, handleToggle } = useToggleButton(handleClick);

  return (
    <button
      type="button"
      onClick={handleToggle}
      title={isActive ? '关闭' : '展开'}
      data-no-drag={isActive ? true : undefined}
      style={{ color: 'var(--toolbar-icon)' }}
      className={clsx(
        'w-[34px] h-[34px]',
        'rounded-full',
        'flex items-center justify-center',
        'transition-all duration-150 ease-out',
        'hover:bg-[var(--toolbar-hover-bg)]',
        'active:scale-95',
        'cursor-pointer',
        !isActive && 'mx-auto'
      )}
    >
      {isActive ? <IconXmarkLarge size={24} /> : <IconListSparkle size={24} />}
    </button>
  );
}
