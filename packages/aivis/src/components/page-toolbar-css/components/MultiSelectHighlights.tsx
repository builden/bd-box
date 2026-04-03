/**
 * MultiSelectHighlights - Shows highlights for cmd+shift+click multi-select.
 * Extracted from page-toolbar-css/index.tsx.
 */

import styles from '../styles.module.scss';

interface MultiSelectHighlightsProps {
  elements: Array<{ element: HTMLElement; rect: DOMRect; name: string; path: string; reactComponents?: string }>;
}

export function MultiSelectHighlights({ elements }: MultiSelectHighlightsProps) {
  const validElements = elements.filter((item) => document.contains(item.element));
  const isMulti = validElements.length > 1;

  return (
    <>
      {validElements.map((item, index) => {
        const rect = item.element.getBoundingClientRect();
        return (
          <div
            key={index}
            className={isMulti ? styles.multiSelectOutline : styles.singleSelectOutline}
            style={{
              position: 'fixed',
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height,
              ...(isMulti
                ? {}
                : {
                    borderColor: 'color-mix(in srgb, var(--agentation-color-accent) 60%, transparent)',
                    backgroundColor: 'color-mix(in srgb, var(--agentation-color-accent) 5%, transparent)',
                  }),
            }}
          />
        );
      })}
    </>
  );
}
