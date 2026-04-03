/**
 * AnnotationMarkerList - Renders a list of annotation markers.
 * Extracted from page-toolbar-css/index.tsx to reduce JSX repetition.
 */

import type { Annotation } from '../../../types';
import { AnnotationMarker, ExitingMarker } from '../../annotation-marker';
import styles from '../styles.module.scss';

type MarkerClickBehavior = 'edit' | 'delete';

interface AnnotationMarkerListProps {
  annotations: Annotation[];
  exitingAnnotations: Annotation[];
  animatedMarkers: Set<string>;
  markersVisible: boolean;
  markersExiting: boolean;
  isClearing: boolean;
  hoveredMarkerId: string | null;
  deletingMarkerId: string | null;
  editingAnnotation: Annotation | null;
  renumberFrom: number | null;
  markerClickBehavior: MarkerClickBehavior;
  recentlyAddedId: string | null;
  getTooltipPosition: (annotation: Annotation) => React.CSSProperties;
  onMarkerHover: (annotation: Annotation | null) => void;
  onMarkerClick: (annotation: Annotation) => void;
  onMarkerContextMenu: (annotation: Annotation) => void;
  fixed?: boolean;
}

export function AnnotationMarkerList({
  annotations,
  exitingAnnotations,
  animatedMarkers,
  markersVisible,
  markersExiting,
  isClearing,
  hoveredMarkerId,
  deletingMarkerId,
  editingAnnotation,
  renumberFrom,
  markerClickBehavior,
  recentlyAddedId,
  getTooltipPosition,
  onMarkerHover,
  onMarkerClick,
  onMarkerContextMenu,
  fixed,
}: AnnotationMarkerListProps) {
  const filteredAnnotations = annotations.filter((a) => (fixed ? a.isFixed : !a.isFixed));
  const filteredExiting = exitingAnnotations.filter((a) => (fixed ? a.isFixed : !a.isFixed));

  const markerClass = fixed ? styles.fixedMarkersLayer : styles.markersLayer;

  return (
    <div className={markerClass} data-feedback-toolbar>
      {markersVisible &&
        filteredAnnotations.map((annotation, layerIndex, arr) => (
          <AnnotationMarker
            key={annotation.id}
            annotation={annotation}
            globalIndex={annotations.findIndex((a) => a.id === annotation.id)}
            layerIndex={layerIndex}
            layerSize={arr.length}
            isExiting={markersExiting}
            isClearing={isClearing}
            isAnimated={animatedMarkers.has(annotation.id)}
            isHovered={!markersExiting && hoveredMarkerId === annotation.id}
            isDeleting={deletingMarkerId === annotation.id}
            isEditingAny={!!editingAnnotation}
            renumberFrom={renumberFrom}
            markerClickBehavior={markerClickBehavior}
            tooltipStyle={getTooltipPosition(annotation)}
            onHoverEnter={(a: Annotation) => !markersExiting && a.id !== recentlyAddedId && onMarkerHover(a)}
            onHoverLeave={() => onMarkerHover(null)}
            onClick={(a: Annotation) => onMarkerClick(a)}
            onContextMenu={onMarkerContextMenu}
          />
        ))}
      {markersVisible &&
        !markersExiting &&
        filteredExiting.map((a) => <ExitingMarker key={a.id} annotation={a} fixed={fixed} />)}
    </div>
  );
}
