import { memo } from 'react';
import { useAtom } from 'jotai';
import clsx from 'clsx';
import { pendingAnnotationAtom } from './store';

/**
 * AnnotationHoverLabel - 鼠标悬浮时显示的标签
 * 显示元素信息和选中文本
 */
export const AnnotationHoverLabel = memo(function AnnotationHoverLabel() {
  const [pendingAnnotation] = useAtom(pendingAnnotationAtom);

  if (!pendingAnnotation) return null;

  return (
    <div
      className={clsx(
        'fixed pointer-events-none z-[99998]',
        'px-3 py-2 rounded-lg',
        'text-[12px] leading-tight',
        'max-w-[280px]'
      )}
      style={{
        left: pendingAnnotation.x + 12,
        top: pendingAnnotation.y + 12,
        backgroundColor: '#383838',
        border: '1px solid rgba(255,255,255,0.15)',
        color: '#fff',
      }}
    >
      <div className="font-medium truncate">{pendingAnnotation.element}</div>
      {pendingAnnotation.selectedText && (
        <div className="mt-1 opacity-70 truncate">
          &quot;{pendingAnnotation.selectedText.slice(0, 50)}
          {pendingAnnotation.selectedText.length > 50 ? '...' : ''}&quot;
        </div>
      )}
      {pendingAnnotation.elementPath && (
        <div className="mt-1 text-[10px] opacity-50 font-mono truncate">{pendingAnnotation.elementPath}</div>
      )}
    </div>
  );
});
