/**
 * HoverHighlight - Shows highlight on hover.
 * Extracted from page-toolbar-css/index.tsx.
 */

import styles from './styles.module.scss';

interface HoverHighlightProps {
  rect: DOMRect | null | undefined;
  isPending?: boolean;
  isScrolling?: boolean;
  isDragging?: boolean;
}

export function HoverHighlight({ rect, isPending, isScrolling, isDragging }: HoverHighlightProps) {
  if (!rect || isPending || isScrolling || isDragging) return null;

  return (
    <div
      className={`${styles.hoverHighlight} ${styles.enter}`}
      style={{
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        borderColor: 'color-mix(in srgb, var(--agentation-color-accent) 50%, transparent)',
        backgroundColor: 'color-mix(in srgb, var(--agentation-color-accent) 4%, transparent)',
      }}
    />
  );
}
