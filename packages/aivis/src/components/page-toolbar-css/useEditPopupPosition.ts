/**
 * useEditPopupPosition - Calculates position for the edit annotation popup.
 * Reads directly from atoms - no props needed.
 */

import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { editingAnnotationAtom, scrollYAtom } from '../../atoms/toolbarAtoms';

const POPUP_HORIZONTAL_MARGIN = 160; // 140px center offset + 20px edge buffer
const POPUP_VERTICAL_BUFFER = 20;
const POPUP_HEIGHT = 290;

export function useEditPopupPosition(): React.CSSProperties {
  const editingAnnotation = useAtomValue(editingAnnotationAtom);
  const scrollY = useAtomValue(scrollYAtom);

  return useMemo(() => {
    if (!editingAnnotation) {
      return {};
    }

    const markerY = editingAnnotation.isFixed ? editingAnnotation.y : editingAnnotation.y - scrollY;

    return {
      // Popup is 280px wide, centered with translateX(-50%), so 140px each side
      // Clamp so popup stays 20px from viewport edges
      left: Math.max(
        POPUP_HORIZONTAL_MARGIN,
        Math.min(window.innerWidth - POPUP_HORIZONTAL_MARGIN, (editingAnnotation.x / 100) * window.innerWidth)
      ),
      // Position popup above or below marker to keep marker visible
      ...(markerY > window.innerHeight - POPUP_HEIGHT
        ? { bottom: window.innerHeight - markerY + POPUP_VERTICAL_BUFFER }
        : { top: markerY + POPUP_VERTICAL_BUFFER }),
    };
  }, [editingAnnotation, scrollY]);
}
