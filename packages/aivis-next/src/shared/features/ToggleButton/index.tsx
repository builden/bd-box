import { IconXmarkLarge, IconListSparkle } from '@/shared/components/Icons';
import { BaseToolbarButton } from '@/shared/components/BaseToolbarButton';
import { useToggleButton } from './useToggleButton';

interface ToggleButtonProps {
  handleClick: () => boolean;
  badge?: number;
}

export function ToggleButton({ handleClick, badge }: ToggleButtonProps) {
  const { isActive, handleToggle } = useToggleButton(handleClick);

  return (
    <BaseToolbarButton
      icon={isActive ? <IconXmarkLarge size={24} /> : <IconListSparkle size={24} />}
      onClick={handleToggle}
      title={isActive ? '关闭' : '展开'}
      className={!isActive ? 'mx-auto' : ''}
      badge={badge}
    />
  );
}
