'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { IconEdit, IconXmark, IconCopyAnimated } from '../icons';
import { getDetailedComputedStyles, getElementPath } from '../../utils/element-identification';
import { originalRequestAnimationFrame, originalSetTimeout } from '../../utils/freeze-animations';
import styles from './styles.module.scss';

// =============================================================================
// Types
// =============================================================================

export type StyleChange = {
  selector: string;
  changes: Array<{
    property: string;
    oldValue: string;
    newValue: string;
  }>;
};

export type StyleEditorProps = {
  /** The element to edit styles for */
  element: HTMLElement | null;
  /** Callback when the editor is closed */
  onClose: () => void;
  /** Callback when the user copies the diff */
  onCopyDiff: (diff: StyleChange) => void;
  /** Whether to use light mode */
  isDarkMode?: boolean;
};

// CSS properties that can be edited
const EDITABLE_PROPERTIES = [
  'color',
  'backgroundColor',
  'fontSize',
  'fontWeight',
  'padding',
  'margin',
  'borderRadius',
  'width',
  'height',
  'display',
  'flexDirection',
  'justifyContent',
  'alignItems',
  'gap',
  'opacity',
  'zIndex',
  'position',
  'top',
  'right',
  'bottom',
  'left',
] as const;

// Property display names and units
const PROPERTY_CONFIG: Record<string, { label: string; unit?: string; colorInput?: boolean }> = {
  color: { label: 'Color', colorInput: true },
  backgroundColor: { label: 'Background', colorInput: true },
  fontSize: { label: 'Font Size', unit: 'px' },
  fontWeight: { label: 'Font Weight' },
  padding: { label: 'Padding', unit: 'px' },
  margin: { label: 'Margin', unit: 'px' },
  borderRadius: { label: 'Border Radius', unit: 'px' },
  width: { label: 'Width', unit: 'px' },
  height: { label: 'Height', unit: 'px' },
  display: { label: 'Display' },
  flexDirection: { label: 'Flex Direction' },
  justifyContent: { label: 'Justify Content' },
  alignItems: { label: 'Align Items' },
  gap: { label: 'Gap', unit: 'px' },
  opacity: { label: 'Opacity' },
  zIndex: { label: 'Z-Index' },
  position: { label: 'Position' },
  top: { label: 'Top', unit: 'px' },
  right: { label: 'Right', unit: 'px' },
  bottom: { label: 'Bottom', unit: 'px' },
  left: { label: 'Left', unit: 'px' },
};

// =============================================================================
// Helper Functions
// =============================================================================

function getCSSPropertyName(camelCase: string): string {
  return camelCase.replace(/([A-Z])/g, '-$1').toLowerCase();
}

function generateDiffText(selector: string, changes: StyleChange['changes']): string {
  const lines: string[] = [];
  lines.push(`/* ${selector} */`);
  for (const change of changes) {
    if (change.oldValue) {
      lines.push(`- ${change.property}: ${change.oldValue};`);
    }
    lines.push(`+ ${change.property}: ${change.newValue};`);
  }
  return lines.join('\n');
}

// =============================================================================
// Component
// =============================================================================

export function StyleEditor({ element, onClose, onCopyDiff, isDarkMode = true }: StyleEditorProps) {
  const [mounted, setMounted] = useState(false);
  const [animClass, setAnimClass] = useState<'enter' | 'exit'>('exit');
  const [computedStyles, setComputedStyles] = useState<Record<string, string>>({});
  const [originalStyles, setOriginalStyles] = useState<Record<string, string>>({});
  const [modifiedValues, setModifiedValues] = useState<Record<string, string>>({});
  const [elementPath, setElementPath] = useState<string>('');
  const [showCopied, setShowCopied] = useState(false);
  const exitTimerRef = useRef<ReturnType<typeof originalSetTimeout>>();

  // Mount/unmount animation
  useEffect(() => {
    setMounted(true);
    originalRequestAnimationFrame(() => {
      originalRequestAnimationFrame(() => {
        setAnimClass('enter');
      });
    });

    return () => {
      clearTimeout(exitTimerRef.current);
    };
  }, []);

  // Get computed styles when element changes
  useEffect(() => {
    if (!element) {
      setComputedStyles({});
      setOriginalStyles({});
      setModifiedValues({});
      setElementPath('');
      return;
    }

    // Get element path
    const path = getElementPath(element);
    setElementPath(path);

    // Get detailed computed styles
    const styles = getDetailedComputedStyles(element);
    setComputedStyles(styles);
    setOriginalStyles(styles);
    setModifiedValues({});
  }, [element]);

  // Check if there are any changes
  const hasChanges = Object.keys(modifiedValues).length > 0;

  // Get the changes array for the diff
  const getChanges = useCallback((): StyleChange['changes'] => {
    const changes: StyleChange['changes'] = [];
    for (const [property, newValue] of Object.entries(modifiedValues)) {
      const oldValue = originalStyles[property] || '';
      if (oldValue !== newValue) {
        changes.push({
          property: getCSSPropertyName(property),
          oldValue,
          newValue,
        });
      }
    }
    return changes;
  }, [modifiedValues, originalStyles]);

  // Handle input change
  const handleValueChange = useCallback(
    (property: string, value: string) => {
      setModifiedValues((prev) => ({
        ...prev,
        [property]: value,
      }));

      // Apply the change to the element directly for live preview
      if (element) {
        const cssProperty = getCSSPropertyName(property);
        element.style.setProperty(cssProperty, value);
      }
    },
    [element]
  );

  // Reset all changes
  const handleReset = useCallback(() => {
    if (!element) return;

    // Reset element styles
    for (const [property, originalValue] of Object.entries(originalStyles)) {
      const cssProperty = getCSSPropertyName(property);
      if (originalValue) {
        element.style.setProperty(cssProperty, originalValue);
      } else {
        element.style.removeProperty(cssProperty);
      }
    }

    setModifiedValues({});
  }, [element, originalStyles]);

  // Copy diff to clipboard
  const handleCopyDiff = useCallback(() => {
    if (!element || !hasChanges) return;

    const changes = getChanges();
    if (changes.length === 0) return;

    const diff: StyleChange = {
      selector: elementPath || getElementPath(element),
      changes,
    };

    const diffText = generateDiffText(diff.selector, diff.changes);
    navigator.clipboard.writeText(diffText).then(() => {
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 1500);
      onCopyDiff(diff);
    });
  }, [element, hasChanges, getChanges, elementPath, onCopyDiff]);

  // Close with animation
  const handleClose = useCallback(() => {
    // Reset any modified styles before closing
    handleReset();
    setAnimClass('exit');
    exitTimerRef.current = originalSetTimeout(() => {
      onClose();
    }, 150);
  }, [handleReset, onClose]);

  if (!mounted) return null;

  const filteredProperties = EDITABLE_PROPERTIES.filter((prop) => {
    // Show property if it has a computed value or if it's commonly used
    const hasValue = computedStyles[prop] && computedStyles[prop] !== '';
    const isCommon = ['color', 'backgroundColor', 'fontSize', 'padding', 'margin', 'borderRadius'].includes(prop);
    return hasValue || isCommon;
  });

  return (
    <div
      className={`${styles.panel} ${styles[animClass]} ${!isDarkMode ? styles.light : ''}`}
      data-feedback-toolbar
      data-agentation-style-editor
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <span className={styles.headerIcon}>
            <IconEdit size={16} />
          </span>
          Style Editor
        </div>
        <button className={styles.closeButton} onClick={handleClose} title="Close">
          <IconXmark size={16} />
        </button>
      </div>

      {/* Element Info */}
      {element ? (
        <>
          <div className={styles.elementInfo}>
            <span className={styles.elementTag}>{element.tagName.toLowerCase()}</span>
            {element.id && <span> #{element.id}</span>}
            <div className={styles.elementPath}>{elementPath}</div>
          </div>

          {/* Styles List */}
          <div className={styles.stylesList}>
            {filteredProperties.map((property) => {
              const config = PROPERTY_CONFIG[property] || { label: property };
              const currentValue = modifiedValues[property] ?? computedStyles[property] ?? '';
              const isModified = property in modifiedValues;
              const isChanged = isModified && modifiedValues[property] !== computedStyles[property];

              if (!currentValue && !isModified) return null;

              return (
                <div key={property} className={styles.styleRow}>
                  <span className={styles.styleProperty}>{config.label}</span>
                  {config.colorInput ? (
                    <div className={styles.colorInputWrapper}>
                      <span className={styles.colorSwatch} style={{ backgroundColor: currentValue || 'transparent' }} />
                      <input
                        type="text"
                        className={`${styles.styleInput} ${styles.colorInput} ${isChanged ? styles.changed : ''}`}
                        value={currentValue}
                        onChange={(e) => handleValueChange(property, e.target.value)}
                        placeholder="none"
                      />
                    </div>
                  ) : (
                    <input
                      type="text"
                      className={`${styles.styleInput} ${isChanged ? styles.changed : ''}`}
                      value={currentValue}
                      onChange={(e) => handleValueChange(property, e.target.value)}
                      placeholder="none"
                    />
                  )}
                </div>
              );
            })}

            {filteredProperties.length === 0 && (
              <div className={styles.emptyState}>No editable styles found for this element.</div>
            )}
          </div>

          {/* Diff Preview */}
          {hasChanges && (
            <div className={styles.diffPreview}>
              {getChanges().map((change, i) => (
                <div key={i}>
                  <span className={styles.removed}>
                    {change.property}: {change.oldValue || '(none)'}
                  </span>
                  {'\n'}
                  <span className={styles.added}>
                    {change.property}: {change.newValue}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Footer Actions */}
          <div className={styles.footer}>
            <button className={styles.resetButton} onClick={handleReset} disabled={!hasChanges}>
              Reset
            </button>
            <button className={styles.copyButton} onClick={handleCopyDiff} disabled={!hasChanges}>
              <IconCopyAnimated size={14} />
              Copy Diff
            </button>
          </div>
        </>
      ) : (
        /* No Element Selected */
        <div className={styles.noSelection}>
          <span className={styles.noSelectionIcon}>
            <IconEdit size={32} />
          </span>
          <div className={styles.noSelectionText}>Select an element to edit its styles</div>
        </div>
      )}

      {/* Copied Feedback */}
      {showCopied && <div className={styles.copiedFeedback}>Copied!</div>}
    </div>
  );
}
