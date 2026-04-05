import { memo } from 'react';
import { useAtom } from 'jotai';
import clsx from 'clsx';
import { hoverAtom, pendingAnnotationAtom } from './store';

/**
 * AnnotationHoverLabel - 鼠标悬浮时显示的标签
 * 显示元素信息和选中文本
 * 注意：当 pendingAnnotation 存在时不显示（popup 出现时）
 */
export const AnnotationHoverLabel = memo(function AnnotationHoverLabel() {
  const [hover] = useAtom(hoverAtom);
  const [pendingAnnotation] = useAtom(pendingAnnotationAtom);

  // Don't show when popup is open
  if (!hover || pendingAnnotation) return null;

  return (
    <div
      className={clsx(
        'fixed pointer-events-none z-[99998]',
        'px-3 py-2 rounded-lg',
        'text-[12px] leading-tight',
        'max-w-[280px]'
      )}
      style={{
        left: hover.x + 12,
        top: hover.y + 12,
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
