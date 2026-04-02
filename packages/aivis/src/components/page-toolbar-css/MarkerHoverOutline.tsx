/**
 * MarkerHoverOutline - Shows bounding box outline when hovering over a marker.
 * Extracted from page-toolbar-css/index.tsx.
 */

import type { Annotation } from '../../types';
import styles from './styles.module.scss';

interface MarkerHoverOutlineProps {
  hoveredAnnotation: Annotation | null;
  hoveredTargetElement: HTMLElement | null;
  hoveredTargetElements: HTMLElement[];
  scrollY: number;
}

export function MarkerHoverOutline({
  hoveredAnnotation,
  hoveredTargetElement,
  hoveredTargetElements,
  scrollY,
}: MarkerHoverOutlineProps) {
  if (!hoveredAnnotation?.boundingBox) return null;

  // Render individual element boxes if available (cmd+shift+click multi-select)
  if (hoveredAnnotation.elementBoundingBoxes?.length) {
    // Use live positions from hoveredTargetElements when available
    if (hoveredTargetElements.length > 0) {
      return (
        <>
          {hoveredTargetElements
            .filter((el) => document.contains(el))
            .map((el, index) => {
              const rect = el.getBoundingClientRect();
              return (
                <div
                  key={`hover-outline-live-${index}`}
                  className={`${styles.multiSelectOutline} ${styles.enter}`}
                  style={{
                    left: rect.left,
                    top: rect.top,
                    width: rect.width,
                    height: rect.height,
                  }}
                />
              );
            })}
        </>
      );
    }
    // Fallback to stored bounding boxes
    return (
      <>
        {hoveredAnnotation.elementBoundingBoxes.map((bb, index) => (
          <div
            key={`hover-outline-${index}`}
            className={`${styles.multiSelectOutline} ${styles.enter}`}
            style={{
              left: bb.x,
              top: bb.y - scrollY,
              width: bb.width,
              height: bb.height,
            }}
          />
        ))}
      </>
    );
  }

  // Single element: use live position from hoveredTargetElement when available
  const rect =
    hoveredTargetElement && document.contains(hoveredTargetElement)
      ? hoveredTargetElement.getBoundingClientRect()
      : null;

  const bb = rect
    ? { x: rect.left, y: rect.top, width: rect.width, height: rect.height }
    : {
        x: hoveredAnnotation.boundingBox.x,
        y: hoveredAnnotation.isFixed ? hoveredAnnotation.boundingBox.y : hoveredAnnotation.boundingBox.y - scrollY,
        width: hoveredAnnotation.boundingBox.width,
        height: hoveredAnnotation.boundingBox.height,
      };

  const isMulti = hoveredAnnotation.isMultiSelect;
  return (
    <div
      className={`${isMulti ? styles.multiSelectOutline : styles.singleSelectOutline} ${styles.enter}`}
      style={{
        left: bb.x,
        top: bb.y,
        width: bb.width,
        height: bb.height,
        ...(isMulti
          ? {}
          : {
              borderColor: 'color-mix(in srgb, var(--agentation-color-accent) 60%, transparent)',
              backgroundColor: 'color-mix(in srgb, var(--agentation-color-accent) 5%, transparent)',
            }),
      }}
    />
  );
}
