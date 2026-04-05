import { memo } from 'react';
import { useAtom } from 'jotai';
import clsx from 'clsx';
import { hoverAtom, pendingAnnotationAtom } from './store';
import { settingsAtom, COLOR_OPTIONS } from '@/shared/features/SettingsPanel/store';

/**
 * AnnotationHighlight - 悬浮时给目标元素加高亮边框和背景
 * 当 pendingAnnotation 存在时也保持显示
 */
export const AnnotationHighlight = memo(function AnnotationHighlight() {
  const [hover] = useAtom(hoverAtom);
  const [pendingAnnotation] = useAtom(pendingAnnotationAtom);
  const [settings] = useAtom(settingsAtom);

  // Show highlight if hover exists OR if there's a pending annotation (for persistence)
  const rect = hover?.rect ?? pendingAnnotation?.rect;
  if (!rect) return null;

  // Resolve color from settings
  const colorOption = COLOR_OPTIONS.find((c) => c.id === settings.annotationColorId);
  const highlightColor = colorOption?.srgb ?? '#0088FF';

  return (
    <div
      className={clsx('fixed pointer-events-none z-[99997]')}
      style={{
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        border: `2px solid color-mix(in srgb, ${highlightColor} 50%, transparent)`,
        borderRadius: 4,
        backgroundColor: `color-mix(in srgb, ${highlightColor} 4%, transparent)`,
      }}
    />
  );
});
