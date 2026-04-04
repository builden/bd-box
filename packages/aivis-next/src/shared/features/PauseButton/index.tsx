import { IconPausePlayAnimated } from '@/shared/components/Icons';
import { ToolbarButton } from '@/shared/components/ToolbarButton';
import { usePauseButton } from './usePauseButton';

export function PauseButton() {
  const { isFrozen, handleToggleFreeze } = usePauseButton();

  return (
    <ToolbarButton
      icon={<IconPausePlayAnimated size={24} isPaused={isFrozen} />}
      onClick={handleToggleFreeze}
      title={isFrozen ? '恢复动画' : '暂停动画 (P)'}
      isActive={isFrozen}
      activeColor="#3b82f6"
      activeBgOpacity={25}
    />
  );
}
