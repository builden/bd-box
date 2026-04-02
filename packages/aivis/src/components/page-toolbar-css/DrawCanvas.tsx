/**
 * DrawCanvas - Canvas for draw mode.
 * Extracted from page-toolbar-css/index.tsx.
 */

import styles from './styles.module.scss';

interface DrawCanvasProps {
  isDrawMode: boolean;
  shouldShowMarkers: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export function DrawCanvas({ isDrawMode, shouldShowMarkers, canvasRef }: DrawCanvasProps) {
  return (
    <canvas
      ref={canvasRef}
      className={`${styles.drawCanvas} ${isDrawMode ? styles.active : ''}`}
      style={{ opacity: shouldShowMarkers ? 1 : 0, transition: 'opacity 0.15s ease' }}
      data-feedback-toolbar
    />
  );
}
