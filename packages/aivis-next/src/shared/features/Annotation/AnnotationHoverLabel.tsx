import { memo } from 'react';
import { useAtom } from 'jotai';
import clsx from 'clsx';
import { hoverAtom, pendingAnnotationAtom, editingAnnotationAtom } from './store';

/**
 * AnnotationHoverLabel - 鼠标悬浮时显示的标签
 * 显示元素信息和选中文本
 * 注意：当 popup 或编辑模式时不显示
 */
export const AnnotationHoverLabel = memo(function AnnotationHoverLabel() {
  const [hover] = useAtom(hoverAtom);
  const [pendingAnnotation] = useAtom(pendingAnnotationAtom);
  const [editingAnnotation] = useAtom(editingAnnotationAtom);

  // Don't show when popup is open or editing
  if (!hover || pendingAnnotation || editingAnnotation) return null;

  const TOOLTIP_WIDTH = 280;
  const TOOLTIP_HEIGHT = 80;
  const OFFSET = 12;

  // Calculate position with boundary detection
  let left = hover.x + OFFSET;
  let top = hover.y + OFFSET;

  // Flip to left side if would overflow right edge
  if (left + TOOLTIP_WIDTH > window.innerWidth - 10) {
    left = hover.x - TOOLTIP_WIDTH - OFFSET;
  }

  // Flip above if will overflow bottom edge
  if (top + TOOLTIP_HEIGHT > window.innerHeight - 10) {
    top = hover.y - TOOLTIP_HEIGHT - OFFSET;
  }

  // Ensure minimum padding from edges
  left = Math.max(10, left);
  top = Math.max(10, top);

  return (
    <div
      className={clsx(
        'fixed pointer-events-none z-[99998]',
        'px-3 py-2 rounded-lg',
        'text-[12px] leading-tight',
        'max-w-[280px]'
      )}
      style={{
        left,
        top,
        backgroundColor: '#383838',
        border: '1px solid rgba(255,255,255,0.15)',
        color: '#fff',
      }}
    >
      <div className="font-medium truncate">{hover.element}</div>
      {hover.selectedText && (
        <div className="mt-1 opacity-70 truncate">
          &quot;{hover.selectedText.slice(0, 50)}
          {hover.selectedText.length > 50 ? '...' : ''}&quot;
        </div>
      )}
      {hover.elementPath && <div className="mt-1 text-[10px] opacity-50 font-mono truncate">{hover.elementPath}</div>}
    </div>
  );
});
