/**
 * EditAnnotationOutline - Renders the outline while editing an annotation.
 * Extracted from page-toolbar-css/index.tsx to reduce JSX repetition.
 */

import type { Annotation } from '../../../types';
import styles from '../styles.module.scss';

interface EditAnnotationOutlineProps {
  editingAnnotation: Annotation;
  editingTargetElements: HTMLElement[];
  editingTargetElement: HTMLElement | null;
  scrollY: number;
}

export function EditAnnotationOutline({
  editingAnnotation,
  editingTargetElements,
  editingTargetElement,
  scrollY,
}: EditAnnotationOutlineProps) {
  // Multi-select with live elements
  if (editingAnnotation.elementBoundingBoxes?.length) {
    // Use live positions from editingTargetElements when available
    if (editingTargetElements.length > 0) {
      return (
        <>
          {editingTargetElements
            .filter((el) => document.contains(el))
            .map((el, index) => {
              const rect = el.getBoundingClientRect();
              return (
                <div
                  key={`edit-multi-live-${index}`}
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
        {editingAnnotation.elementBoundingBoxes!.map((bb, index) => (
          <div
            key={`edit-multi-${index}`}
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

  // Single element: show single box
  const rect =
    editingTargetElement && document.contains(editingTargetElement)
      ? editingTargetElement.getBoundingClientRect()
      : null;

  const bb = rect
    ? { x: rect.left, y: rect.top, width: rect.width, height: rect.height }
    : editingAnnotation.boundingBox
      ? {
          x: editingAnnotation.boundingBox.x,
          y: editingAnnotation.isFixed ? editingAnnotation.boundingBox.y : editingAnnotation.boundingBox.y - scrollY,
          width: editingAnnotation.boundingBox.width,
          height: editingAnnotation.boundingBox.height,
        }
      : null;

  if (!bb) return null;

  return (
    <div
      className={`${editingAnnotation.isMultiSelect ? styles.multiSelectOutline : styles.singleSelectOutline} ${styles.enter}`}
      style={{
        left: bb.x,
        top: bb.y,
        width: bb.width,
        height: bb.height,
        ...(editingAnnotation.isMultiSelect
          ? {}
          : {
              borderColor: 'color-mix(in srgb, var(--agentation-color-accent) 60%, transparent)',
              backgroundColor: 'color-mix(in srgb, var(--agentation-color-accent) 5%, transparent)',
            }),
      }}
    />
  );
}
