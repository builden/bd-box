import { useAtom, useSetAtom } from 'jotai';
import { IconLayout } from '@/shared/components/Icons';
import { ToolbarButton } from '@/shared/components/ToolbarButton';
import { isLayoutModeAtom } from './store';
import { isAnnotationModeAtom } from '@/shared/features/Annotation/store';

/**
 * LayoutButton - 布局模式切换按钮
 * 布局模式下 activeComponent 为 null 时，点击页面可捕获/重排区域
 */
export function LayoutButton() {
  const [isLayoutMode, setIsLayoutMode] = useAtom(isLayoutModeAtom);
  const setIsAnnotationMode = useSetAtom(isAnnotationModeAtom);

  const handleClick = () => {
    const next = !isLayoutMode;
    setIsLayoutMode(next);
    if (next) {
      setIsAnnotationMode(false);
    }
  };

  return (
    <ToolbarButton
      icon={<IconLayout size={21} />}
      onClick={handleClick}
      title={isLayoutMode ? '退出布局模式' : '布局模式 (L)'}
      isActive={isLayoutMode}
      activeColor="var(--accent-color, #7C3AED)"
    />
  );
}
