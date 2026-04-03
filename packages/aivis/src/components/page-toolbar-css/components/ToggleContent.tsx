/**
 * ToggleContent - Shows collapsed toolbar toggle.
 * Extracted from page-toolbar-css/index.tsx.
 */

import { IconListSparkle } from '../../icons';
import styles from '../styles.module.scss';

interface ToggleContentProps {
  isActive: boolean;
  hasVisibleAnnotations: boolean;
  visibleAnnotationsCount: number;
  showEntranceAnimation: boolean;
}

export function ToggleContent({
  isActive,
  hasVisibleAnnotations,
  visibleAnnotationsCount,
  showEntranceAnimation,
}: ToggleContentProps) {
  return (
    <div className={`${styles.toggleContent} ${!isActive ? styles.visible : styles.hidden}`}>
      <IconListSparkle size={24} />
      {hasVisibleAnnotations && (
        <span
          className={`${styles.badge} ${isActive ? styles.fadeOut : ''} ${showEntranceAnimation ? styles.entrance : ''}`}
        >
          {visibleAnnotationsCount}
        </span>
      )}
    </div>
  );
}
