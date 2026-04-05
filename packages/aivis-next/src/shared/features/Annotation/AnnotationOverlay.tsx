import { useAtom } from 'jotai';
import { annotationsAtom, showMarkersAtom } from './store';
import { settingsAtom } from '@/shared/features/SettingsPanel/store';
import { AnnotationMarker } from './AnnotationMarker';
import { AnnotationHoverLabel } from './AnnotationHoverLabel';
import { AnnotationHighlight } from './AnnotationHighlight';
import { useAnnotationClickHandler } from './useAnnotationClickHandler';
import { useAnnotationHover } from './useAnnotationHover';

/**
 * AnnotationOverlay - 渲染页面上所有标注标记的覆盖层
 */
export function AnnotationOverlay() {
  const [annotations] = useAtom(annotationsAtom);
  const [showMarkers] = useAtom(showMarkersAtom);
  const [settings] = useAtom(settingsAtom);

  // Enable handlers when in annotation mode
  useAnnotationClickHandler();
  useAnnotationHover();

  // Only render if markers should be shown
  if (!showMarkers) return null;

  return (
    <>
      <AnnotationHighlight />
      <div className="fixed inset-0 pointer-events-none z-[99999]">
        {annotations.map((annotation, index) => (
          <div key={annotation.id} className="pointer-events-auto">
            <AnnotationMarker annotation={annotation} index={index} colorId={settings.annotationColorId} />
          </div>
        ))}
      </div>
      <AnnotationHoverLabel />
    </>
  );
}
