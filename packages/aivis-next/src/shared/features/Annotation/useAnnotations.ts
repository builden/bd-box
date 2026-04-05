import { useAtom, useSetAtom } from 'jotai';
import { annotationsAtom, type Annotation } from './store';

/**
 * useAnnotations - 操作标注列表的 hook
 */
export function useAnnotations() {
  const [annotations] = useAtom(annotationsAtom);
  const setAnnotations = useSetAtom(annotationsAtom);

  const addAnnotation = (annotation: Annotation) => {
    setAnnotations((prev) => [...prev, annotation]);
  };

  const removeAnnotation = (id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  };

  const clearAnnotation = (id: string) => {
    removeAnnotation(id);
  };

  const clearAllAnnotations = () => {
    setAnnotations([]);
  };

  const updateAnnotation = (id: string, updates: Partial<Annotation>) => {
    setAnnotations((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  return {
    annotations,
    addAnnotation,
    removeAnnotation,
    clearAnnotation,
    clearAllAnnotations,
    updateAnnotation,
  };
}
