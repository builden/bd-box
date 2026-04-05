import { useEffect } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { isAnnotationModeAtom, annotationsAtom, type Annotation } from './store';

/**
 * useAnnotationClickHandler - 处理标注模式下的页面点击
 * 在标注模式下，点击页面会创建一个新的标注
 */
export function useAnnotationClickHandler() {
  const [isAnnotationMode] = useAtom(isAnnotationModeAtom);
  const setAnnotations = useSetAtom(annotationsAtom);

  useEffect(() => {
    if (!isAnnotationMode) return;

    const handleClick = (e: MouseEvent) => {
      // Don't create annotation if clicking on toolbar or settings
      const target = e.target as HTMLElement;
      if (target.closest('[data-no-drag]') || target.closest('[data-feedback-toolbar]')) {
        return;
      }

      // Calculate position
      const rect = document.documentElement.getBoundingClientRect();
      const x = (e.clientX / rect.width) * 100; // percentage
      const y = e.clientY; // pixels from top

      // Create new annotation
      const newAnnotation: Annotation = {
        id: `annotation-${Date.now()}`,
        x,
        y,
        element: `Element at ${Math.round(x)}%, ${Math.round(y)}px`,
        timestamp: Date.now(),
      };

      setAnnotations((prev) => [...prev, newAnnotation]);
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [isAnnotationMode, setAnnotations]);
}
