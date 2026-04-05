import { useAtom } from 'jotai';
import { IconChatEllipsis } from '@/shared/components/Icons';
import { ToolbarButton } from '@/shared/components/ToolbarButton';
import { isAnnotationModeAtom } from './store';
import { settingsAtom, COLOR_OPTIONS } from '@/shared/features/SettingsPanel/store';

/**
 * AnnotationButton - 标注模式切换按钮
 * 激活时使用设置面板中的标记颜色
 */
export function AnnotationButton() {
  const [isAnnotationMode, setIsAnnotationMode] = useAtom(isAnnotationModeAtom);
  const [settings] = useAtom(settingsAtom);

  // Resolve annotation color from settings
  const colorOption = COLOR_OPTIONS.find((c) => c.id === settings.annotationColorId);
  const activeColor = colorOption?.srgb ?? '#0088FF';

  return (
    <ToolbarButton
      icon={<IconChatEllipsis size={21} />}
      onClick={() => setIsAnnotationMode(!isAnnotationMode)}
      title={isAnnotationMode ? '退出标注模式' : '标注模式 (A)'}
      isActive={isAnnotationMode}
      activeColor={activeColor}
      activeBgOpacity={25}
    />
  );
}
