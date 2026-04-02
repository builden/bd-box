/**
 * PendingAnnotationPopup - Shows pending annotation outline and popup.
 * Extracted from page-toolbar-css/index.tsx.
 */

import { AnnotationPopupCSS, type AnnotationPopupCSSHandle } from '../annotation-popup-css';
import { PendingMarker } from '../annotation-marker';
import type { PendingAnnotationData } from '../../atoms/toolbarAtoms';
import styles from './styles.module.scss';

const POPUP_HORIZONTAL_MARGIN = 160;
const POPUP_VERTICAL_BUFFER = 20;
const POPUP_HEIGHT = 290;

interface PendingAnnotationPopupProps {
  pendingAnnotation: PendingAnnotationData | null;
  pendingExiting: boolean;
  scrollY: number;
  isDarkMode: boolean;
  popupRef: React.RefObject<AnnotationPopupCSSHandle | null>;
  onSubmit: (comment: string) => void;
  onCancel: () => void;
}

export function PendingAnnotationPopup({
  pendingAnnotation,
  pendingExiting,
  scrollY,
  isDarkMode,
  popupRef,
  onSubmit,
  onCancel,
}: PendingAnnotationPopupProps) {
  if (!pendingAnnotation) return null;

  // Use stored coordinates - they match what will be saved
  const markerX = pendingAnnotation.x;
  const markerY = pendingAnnotation.isFixed ? pendingAnnotation.y : pendingAnnotation.y - scrollY;

  const popupStyle = {
    // Popup is 280px wide, centered with translateX(-50%), so 140px each side
    // Clamp so popup stays 20px from viewport edges
    left: Math.max(
      POPUP_HORIZONTAL_MARGIN,
      Math.min(window.innerWidth - POPUP_HORIZONTAL_MARGIN, (markerX / 100) * window.innerWidth)
    ),
    // Position popup above or below marker to keep marker visible
    ...(markerY > window.innerHeight - POPUP_HEIGHT
      ? { bottom: window.innerHeight - markerY + POPUP_VERTICAL_BUFFER }
      : { top: markerY + POPUP_VERTICAL_BUFFER }),
  };

  return (
    <>
      {/* Show element/area outline while adding annotation */}
      {pendingAnnotation.multiSelectElements?.length
        ? // Cmd+shift+click multi-select: show individual boxes with live positions
          pendingAnnotation.multiSelectElements
            .filter((el) => document.contains(el))
            .map((el, index) => {
              const rect = el.getBoundingClientRect();
              return (
                <div
                  key={`pending-multi-${index}`}
                  className={`${styles.multiSelectOutline} ${pendingExiting ? styles.exit : styles.enter}`}
                  style={{
                    left: rect.left,
                    top: rect.top,
                    width: rect.width,
                    height: rect.height,
                  }}
                />
              );
            })
        : // Single element or drag multi-select: show single box
          pendingAnnotation.targetElement && document.contains(pendingAnnotation.targetElement)
          ? // Single-click: use live getBoundingClientRect for consistent positioning
            (() => {
              const rect = pendingAnnotation.targetElement!.getBoundingClientRect();
              return (
                <div
                  className={`${styles.singleSelectOutline} ${pendingExiting ? styles.exit : styles.enter}`}
                  style={{
                    left: rect.left,
                    top: rect.top,
                    width: rect.width,
                    height: rect.height,
                    borderColor: 'color-mix(in srgb, var(--agentation-color-accent) 60%, transparent)',
                    backgroundColor: 'color-mix(in srgb, var(--agentation-color-accent) 5%, transparent)',
                  }}
                />
              );
            })()
          : // Drag selection or fallback: use stored boundingBox
            pendingAnnotation.boundingBox && (
              <div
                className={`${pendingAnnotation.isMultiSelect ? styles.multiSelectOutline : styles.singleSelectOutline} ${pendingExiting ? styles.exit : styles.enter}`}
                style={{
                  left: pendingAnnotation.boundingBox.x,
                  top: pendingAnnotation.boundingBox.y - scrollY,
                  width: pendingAnnotation.boundingBox.width,
                  height: pendingAnnotation.boundingBox.height,
                  ...(pendingAnnotation.isMultiSelect
                    ? {}
                    : {
                        borderColor: 'color-mix(in srgb, var(--agentation-color-accent) 60%, transparent)',
                        backgroundColor: 'color-mix(in srgb, var(--agentation-color-accent) 5%, transparent)',
                      }),
                }}
              />
            )}

      <PendingMarker
        x={markerX}
        y={markerY}
        isMultiSelect={pendingAnnotation.isMultiSelect}
        isExiting={pendingExiting}
      />

      <AnnotationPopupCSS
        ref={popupRef}
        element={pendingAnnotation.element}
        selectedText={pendingAnnotation.selectedText}
        computedStyles={pendingAnnotation.computedStylesObj}
        placeholder={
          pendingAnnotation.element === 'Area selection'
            ? '这个区域应该怎么改？'
            : pendingAnnotation.isMultiSelect
              ? '这组元素的反馈...'
              : '应该怎么改？'
        }
        onSubmit={onSubmit}
        onCancel={onCancel}
        isExiting={pendingExiting}
        lightMode={!isDarkMode}
        accentColor={
          pendingAnnotation.isMultiSelect ? 'var(--agentation-color-green)' : 'var(--agentation-color-accent)'
        }
        style={popupStyle}
      />
    </>
  );
}
