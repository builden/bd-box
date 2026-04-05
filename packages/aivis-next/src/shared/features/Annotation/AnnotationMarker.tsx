import { memo, useState } from 'react';
import { useSetAtom } from 'jotai';
import clsx from 'clsx';
import type { Annotation } from './store';
import { COLOR_OPTIONS } from '@/shared/features/SettingsPanel/store';
import { editingAnnotationAtom } from './store';

interface AnnotationMarkerProps {
  annotation: Annotation;
  index: number;
  colorId?: string;
}

/**
 * AnnotationMarker - 页面上显示的标注标记点
 */
export const AnnotationMarker = memo(function AnnotationMarker({
  annotation,
  index,
  colorId = 'blue',
}: AnnotationMarkerProps) {
  const [isHovered, setIsHovered] = useState(false);
  const setEditingAnnotation = useSetAtom(editingAnnotationAtom);

  // Resolve color: use annotation's own colorId first, fallback to prop
  const colorOption = COLOR_OPTIONS.find((c) => c.id === (annotation.colorId || colorId));
  const markerColor = colorOption?.srgb ?? '#0088FF';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAnnotation(annotation);
  };

  return (
    <div
      data-no-hover
      className={clsx(
        'absolute w-5 h-5 rounded-full flex items-center justify-center cursor-pointer',
        'transition-all duration-150',
        'text-white text-[10px] font-medium',
        isHovered && 'scale-110'
      )}
      style={{
        left: annotation.x,
        top: annotation.y,
        transform: 'translate(-50%, -50%)',
        backgroundColor: markerColor,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Hover 时显示编辑图标，否则显示序号 */}
      {isHovered ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      ) : (
        index + 1
      )}

      {/* Tooltip */}
      {isHovered && (
        <div
          className={clsx(
            'absolute left-1/2 -translate-x-1/2 bottom-full mb-2',
            'px-2 py-1.5 rounded-md text-[11px] whitespace-nowrap',
            'bg-[#1a1a1a] border border-white/10',
            'min-w-[120px]'
          )}
        >
          <div className="text-white/50 text-[10px] truncate max-w-[150px]">{annotation.element}</div>
          {annotation.selectedText && (
            <div className="text-white/40 text-[10px] mt-0.5 truncate max-w-[150px]">
              &quot;{annotation.selectedText.slice(0, 30)}&quot;
            </div>
          )}
          {annotation.comment && (
            <div className="text-white text-[11px] mt-1 truncate max-w-[150px]">{annotation.comment}</div>
          )}
        </div>
      )}
    </div>
  );
});
