import { memo, useState, useEffect, useRef } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import clsx from 'clsx';
import { pendingAnnotationAtom, annotationsAtom, popupShakeAtom, type Annotation } from './store';
import { isDarkModeAtom } from '@/shared/features/SettingsPanel/store';
import { COLOR_OPTIONS } from '@/shared/features/SettingsPanel/store';

/**
 * AnnotationPopup - 标注输入弹窗
 * 用户点击页面创建标注时显示的输入面板
 */
export const AnnotationPopup = memo(function AnnotationPopup() {
  const [pendingAnnotation, setPendingAnnotation] = useAtom(pendingAnnotationAtom);
  const setAnnotations = useSetAtom(annotationsAtom);
  const [isDarkMode] = useAtom(isDarkModeAtom);
  const [comment, setComment] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [shakeTrigger] = useAtom(popupShakeAtom);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevShakeTrigger = useRef(shakeTrigger);

  // 监听 shake trigger 变化
  useEffect(() => {
    if (shakeTrigger !== prevShakeTrigger.current && shakeTrigger > 0) {
      setIsShaking(true);
      const timer = setTimeout(() => {
        setIsShaking(false);
        textareaRef.current?.focus();
      }, 250);
      prevShakeTrigger.current = shakeTrigger;
      return () => clearTimeout(timer);
    }
  }, [shakeTrigger]);

  // 获取当前颜色
  const colorOption = pendingAnnotation?.colorId
    ? COLOR_OPTIONS.find((c) => c.id === pendingAnnotation.colorId)
    : COLOR_OPTIONS[1]; // default blue
  const accentColor = colorOption?.srgb ?? '#0088FF';

  // 自动聚焦 textarea
  useEffect(() => {
    if (pendingAnnotation && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [pendingAnnotation]);

  const handleSubmit = () => {
    if (!comment.trim() || !pendingAnnotation) return;

    // 创建正式标注
    const newAnnotation: Annotation = {
      id: `annotation-${Date.now()}`,
      x: pendingAnnotation.x,
      y: pendingAnnotation.y,
      element: pendingAnnotation.element,
      comment: comment.trim(),
      timestamp: Date.now(),
      ...(pendingAnnotation.selectedText ? { selectedText: pendingAnnotation.selectedText } : {}),
    };

    setAnnotations((prev: Annotation[]) => [...prev, newAnnotation]);
    setPendingAnnotation(null);
    setComment('');
  };

  const handleCancel = () => {
    setPendingAnnotation(null);
    setComment('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!pendingAnnotation) return null;

  const POPUP_HEIGHT = 200; // approximate
  const POPUP_VERTICAL_BUFFER = 20;
  const POPUP_HORIZONTAL_MARGIN = 160;

  // Calculate position - same logic as aivis
  // Horizontal: center with translateX(-50%), but clamp to viewport edges
  const rawLeft = pendingAnnotation.popupX ?? pendingAnnotation.x;
  const left = Math.max(POPUP_HORIZONTAL_MARGIN, Math.min(window.innerWidth - POPUP_HORIZONTAL_MARGIN, rawLeft));

  // Vertical: if too low, show above; otherwise below
  const markerY = pendingAnnotation.popupY ?? pendingAnnotation.y;
  const showAbove = markerY > window.innerHeight - POPUP_HEIGHT;
  const top = showAbove ? undefined : markerY + POPUP_VERTICAL_BUFFER;
  const bottom = showAbove ? window.innerHeight - markerY + POPUP_VERTICAL_BUFFER : undefined;

  return (
    <div
      className={clsx(
        'fixed z-[100001] w-[280px]',
        'rounded-2xl p-4',
        'shadow-lg',
        isShaking && 'animate-shake',
        isDarkMode ? 'bg-[#1a1a1a] border border-white/10' : 'bg-white border border-black/5'
      )}
      style={{
        left,
        top,
        bottom,
        transform: 'translateX(-50%)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className={clsx('text-xs truncate flex-1', isDarkMode ? 'text-white/50' : 'text-black/50')}>
          {pendingAnnotation.element}
        </span>
      </div>

      {/* Selected text quote */}
      {pendingAnnotation.selectedText && (
        <div
          className={clsx(
            'text-xs italic px-2 py-1.5 rounded mb-2',
            'leading-relaxed',
            isDarkMode ? 'text-white/60 bg-white/5' : 'text-black/55 bg-black/4'
          )}
        >
          &ldquo;{pendingAnnotation.selectedText.slice(0, 80)}
          {pendingAnnotation.selectedText.length > 80 ? '...' : ''}&rdquo;
        </div>
      )}

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        className={clsx(
          'w-full px-3 py-2 text-sm rounded-lg',
          'resize-none outline-none',
          'transition-colors duration-150',
          isDarkMode
            ? 'bg-white/5 text-white border border-white/15 placeholder:text-white/35 focus:border-[var(--accent)]'
            : 'bg-black/3 text-black border border-black/10 placeholder:text-black/40 focus:border-black/30'
        )}
        style={
          isDarkMode
            ? ({ '--accent': accentColor } as React.CSSProperties)
            : ({ '--accent': accentColor } as React.CSSProperties)
        }
        placeholder="应该怎么改？"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={2}
      />

      {/* Actions */}
      <div className="flex justify-end gap-2 mt-3">
        <button
          className={clsx(
            'px-3 py-1.5 text-xs font-medium rounded-full',
            'transition-colors duration-150',
            isDarkMode
              ? 'text-white/50 hover:bg-white/10 hover:text-white/80'
              : 'text-black/50 hover:bg-black/6 hover:text-black/75'
          )}
          onClick={handleCancel}
        >
          取消
        </button>
        <button
          className={clsx(
            'px-3 py-1.5 text-xs font-medium rounded-full',
            'text-white transition-colors duration-150',
            comment.trim() ? 'opacity-100 hover:brightness-90' : 'opacity-40 cursor-not-allowed'
          )}
          style={{ backgroundColor: accentColor }}
          onClick={handleSubmit}
          disabled={!comment.trim()}
        >
          添加
        </button>
      </div>
    </div>
  );
});
