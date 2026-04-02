/**
 * WireframeHint - Opacity slider and notice for wireframe mode.
 * Extracted from page-toolbar-css/index.tsx.
 */

import designStyles from '../design-mode/styles.module.scss';

interface WireframeHintProps {
  canvasOpacity: number;
  onOpacityChange: (value: number) => void;
  onStartOver: () => void;
}

export function WireframeHint({ canvasOpacity, onOpacityChange, onStartOver }: WireframeHintProps) {
  return (
    <div className={designStyles.wireframeNotice} data-feedback-toolbar>
      <div className={designStyles.wireframeOpacityRow}>
        <span className={designStyles.wireframeOpacityLabel}>Toggle Opacity</span>
        <input
          type="range"
          className={designStyles.wireframeOpacitySlider}
          min={0}
          max={1}
          step={0.01}
          value={canvasOpacity}
          onChange={(e) => onOpacityChange(Number(e.target.value))}
        />
      </div>
      <div className={designStyles.wireframeNoticeTitleRow}>
        <span className={designStyles.wireframeNoticeTitle}>Wireframe Mode</span>
        <span className={designStyles.wireframeNoticeDivider} />
        <button className={designStyles.wireframeStartOver} onClick={onStartOver}>
          Start Over
        </button>
      </div>
      Drag components onto the canvas.
      <br />
      Copied output will only include the wireframed layout.
    </div>
  );
}
