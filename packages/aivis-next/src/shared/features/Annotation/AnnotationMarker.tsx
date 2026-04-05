import { memo, useState } from 'react';
import clsx from 'clsx';
import type { Annotation } from './store';
import { COLOR_OPTIONS } from '@/shared/features/SettingsPanel/store';

interface AnnotationMarkerProps {
  annotation: Annotation;
  index: number;
  colorId?: string;
  onClick?: (annotation: Annotation) => void;
}

/**
 * AnnotationMarker - 页面上显示的标注标记点
 */
export const AnnotationMarker = memo(function AnnotationMarker({
  annotation,
  index,
  colorId = 'blue',
  onClick,
}: AnnotationMarkerProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Resolve color from settings
  const colorOption = COLOR_OPTIONS.find((c) => c.id === colorId);
  const markerColor = colorOption?.srgb ?? '#0088FF';

  return (
    <div
      className={clsx(
        'absolute w-5 h-5 rounded-full flex items-center justify-center cursor-pointer',
        'transition-all duration-150',
        'text-white text-[10px] font-medium',
        isHovered && 'scale-110'
      )}
      style={{
        left: `${annotation.x}%`,
        top: annotation.y,
        backgroundColor: markerColor,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(annotation);
      }}
    >
      {index + 1}

      {/* Tooltip */}
      {isHovered && (
        <div
          className={clsx(
            'absolute left-1/2 -translate-x-1/2 bottom-full mb-2',
            'px-2 py-1 rounded-md text-[11px] whitespace-nowrap',
            'bg-[var(--tooltip-bg,#383838)] border'
          )}
          style={{
            borderColor: markerColor,
            color: 'var(--tooltip-text,#fff)',
          }}
        >
          <div className="text-[var(--tooltip-text,#fff)]">{annotation.element}</div>
          {annotation.selectedText && <div className="opacity-70 mt-0.5">"{annotation.selectedText.slice(0, 30)}"</div>}
        </div>
      )}
    </div>
  );
});
