/**
 * BlankCanvasBackdrop - Transparent backdrop for blank canvas mode.
 * Extracted from page-toolbar-css/index.tsx.
 */

import designStyles from '../../design-mode/styles.module.scss';

interface BlankCanvasBackdropProps {
  visible: boolean;
  designInteracting: boolean;
  canvasOpacity: number;
}

export function BlankCanvasBackdrop({ visible, designInteracting, canvasOpacity }: BlankCanvasBackdropProps) {
  return (
    <div
      className={`${designStyles.blankCanvas} ${visible ? designStyles.visible : ''} ${designInteracting ? designStyles.gridActive : ''}`}
      style={{ '--canvas-opacity': canvasOpacity } as React.CSSProperties}
      data-feedback-toolbar
    />
  );
}
