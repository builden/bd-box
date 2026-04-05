import { useAtom, useSetAtom } from 'jotai';
import { useEffect } from 'react';
import {
  annotationsAtom,
  showMarkersAtom,
  isAnnotationModeAtom,
  hoverAtom,
  pendingAnnotationAtom,
  editingAnnotationAtom,
} from './store';
import { settingsAtom } from '@/shared/features/SettingsPanel/store';
import { AnnotationMarker } from './AnnotationMarker';
import { AnnotationHoverLabel } from './AnnotationHoverLabel';
import { AnnotationHighlight } from './AnnotationHighlight';
import { AnnotationPopup } from './AnnotationPopup';
import { PendingMarker } from './PendingMarker';
import { useAnnotationClickHandler } from './useAnnotationClickHandler';
import { useAnnotationHover } from './useAnnotationHover';

/**
 * AnnotationOverlay - 渲染页面上所有标注标记的覆盖层
 */
export function AnnotationOverlay() {
  const [annotations] = useAtom(annotationsAtom);
  const [showMarkers] = useAtom(showMarkersAtom);
  const [settings] = useAtom(settingsAtom);
  const [isAnnotationMode] = useAtom(isAnnotationModeAtom);
  const setHover = useSetAtom(hoverAtom);
  const setPendingAnnotation = useSetAtom(pendingAnnotationAtom);
  const setEditingAnnotation = useSetAtom(editingAnnotationAtom);

  // Enable handlers when in annotation mode
  useAnnotationClickHandler();
  useAnnotationHover();

  // 退出标注模式时清理状态
  useEffect(() => {
    if (!isAnnotationMode) {
      setHover(null);
      setPendingAnnotation(null);
      setEditingAnnotation(null);
    }
  }, [isAnnotationMode, setHover, setPendingAnnotation, setEditingAnnotation]);

  // Only render if markers should be shown
  if (!showMarkers) return null;

  return (
    <>
      {/* Cursor style when in annotation mode */}
      {isAnnotationMode && (
        <style>{`
          body { cursor: crosshair !important; }
        `}</style>
      )}
      <AnnotationHighlight />
      <PendingMarker />
      <div className="fixed inset-0 pointer-events-none z-[99999]">
        {annotations.map((annotation, index) => (
          <div key={annotation.id} className="pointer-events-auto">
            <AnnotationMarker annotation={annotation} index={index} colorId={settings.annotationColorId} />
          </div>
        ))}
      </div>
      <AnnotationHoverLabel />
      <AnnotationPopup />
    </>
  );
}
