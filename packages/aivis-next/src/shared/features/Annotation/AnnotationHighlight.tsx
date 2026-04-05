import { memo } from 'react';
import { useAtom } from 'jotai';
import clsx from 'clsx';
import { pendingAnnotationAtom } from './store';
import { settingsAtom, COLOR_OPTIONS } from '@/shared/features/SettingsPanel/store';

/**
 * AnnotationHighlight - 悬浮时给目标元素加高亮边框和背景
 */
export const AnnotationHighlight = memo(function AnnotationHighlight() {
  const [pendingAnnotation] = useAtom(pendingAnnotationAtom);
  const [settings] = useAtom(settingsAtom);

  if (!pendingAnnotation?.rect) return null;

  // Resolve color from settings
  const colorOption = COLOR_OPTIONS.find((c) => c.id === settings.annotationColorId);
  const highlightColor = colorOption?.srgb ?? '#0088FF';

  return (
    <div
      className={clsx('fixed pointer-events-none z-[99997]')}
      style={{
        left: pendingAnnotation.rect.left,
        top: pendingAnnotation.rect.top,
        width: pendingAnnotation.rect.width,
        height: pendingAnnotation.rect.height,
        border: `2px solid color-mix(in srgb, ${highlightColor} 50%, transparent)`,
        borderRadius: 4,
        backgroundColor: `color-mix(in srgb, ${highlightColor} 4%, transparent)`,
      }}
    />
  );
});
