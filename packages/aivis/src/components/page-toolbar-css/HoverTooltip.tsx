/**
 * HoverTooltip - Shows element info on hover.
 * Extracted from page-toolbar-css/index.tsx.
 */

import styles from './styles.module.scss';

interface HoverTooltipProps {
  hoverInfo: {
    element: string;
    elementName: string;
    elementPath: string;
    rect: DOMRect | null;
    reactComponents?: string | null;
  } | null;
  hoverPosition: { x: number; y: number };
}

export function HoverTooltip({ hoverInfo, hoverPosition }: HoverTooltipProps) {
  if (!hoverInfo) return null;

  return (
    <div
      className={`${styles.hoverTooltip} ${styles.enter}`}
      style={{
        left: Math.max(8, Math.min(hoverPosition.x, window.innerWidth - 100)),
        top: Math.max(hoverPosition.y - (hoverInfo.reactComponents ? 48 : 32), 8),
      }}
    >
      {hoverInfo.reactComponents && <div className={styles.hoverReactPath}>{hoverInfo.reactComponents}</div>}
      <div className={styles.hoverElementName}>{hoverInfo.elementName}</div>
    </div>
  );
}
