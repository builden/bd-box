import { memo } from 'react';
import { useAtom } from 'jotai';
import clsx from 'clsx';
import { pendingAnnotationAtom } from './store';
import { COLOR_OPTIONS } from '@/shared/features/SettingsPanel/store';

/**
 * PendingMarker - 待确认标注的 + 号标记
 * 显示在用户点击的位置
 */
export const PendingMarker = memo(function PendingMarker() {
  const [pendingAnnotation] = useAtom(pendingAnnotationAtom);

  if (!pendingAnnotation) return null;

  const colorOption = pendingAnnotation.colorId
    ? COLOR_OPTIONS.find((c) => c.id === pendingAnnotation.colorId)
    : COLOR_OPTIONS[1];
  const markerColor = colorOption?.srgb ?? '#0088FF';

  return (
    <div
      className={clsx(
        'fixed w-6 h-6 rounded-full flex items-center justify-center',
        'text-white text-xs font-semibold',
        'pointer-events-none z-[100000]'
      )}
      style={{
        left: pendingAnnotation.popupX ?? pendingAnnotation.x,
        top: pendingAnnotation.popupY ?? pendingAnnotation.y,
        transform: 'translate(-50%, -50%)',
        backgroundColor: markerColor,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      +
    </div>
  );
});
