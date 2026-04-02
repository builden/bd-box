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
  'fontFamily',
  'lineHeight',
  'letterSpacing',
  'textDecoration',
  'textAlign',
  'borderRadius',
  'borderWidth',
  'borderColor',
  'boxShadow',
  'width',
  'height',
  'minWidth',
  'maxWidth',
  'minHeight',
  'maxHeight',
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
  // Box model - handled specially
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
] as const;

// Property display names and units
const PROPERTY_CONFIG: Record<string, { label: string; unit?: string; colorInput?: boolean; isBoxSide?: boolean }> = {
  color: { label: 'Color', colorInput: true },
  backgroundColor: { label: 'Background', colorInput: true },
  fontSize: { label: 'Font Size', unit: 'px' },
  fontWeight: { label: 'Font Weight' },
  fontFamily: { label: 'Font Family' },
  lineHeight: { label: 'Line Height' },
  letterSpacing: { label: 'Letter Spacing', unit: 'px' },
  textDecoration: { label: 'Text Decoration' },
  textAlign: { label: 'Text Align' },
  borderRadius: { label: 'Border Radius', unit: 'px' },
  borderWidth: { label: 'Border Width', unit: 'px' },
  borderColor: { label: 'Border Color', colorInput: true },
  boxShadow: { label: 'Box Shadow' },
  width: { label: 'Width', unit: 'px' },
  height: { label: 'Height', unit: 'px' },
  minWidth: { label: 'Min Width', unit: 'px' },
  maxWidth: { label: 'Max Width', unit: 'px' },
  minHeight: { label: 'Min Height', unit: 'px' },
  maxHeight: { label: 'Max Height', unit: 'px' },
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
  // Box model sides
  marginTop: { label: 'Margin Top', unit: 'px', isBoxSide: true },
  marginRight: { label: 'Margin Right', unit: 'px', isBoxSide: true },
  marginBottom: { label: 'Margin Bottom', unit: 'px', isBoxSide: true },
  marginLeft: { label: 'Margin Left', unit: 'px', isBoxSide: true },
  paddingTop: { label: 'Padding Top', unit: 'px', isBoxSide: true },
  paddingRight: { label: 'Padding Right', unit: 'px', isBoxSide: true },
  paddingBottom: { label: 'Padding Bottom', unit: 'px', isBoxSide: true },
  paddingLeft: { label: 'Padding Left', unit: 'px', isBoxSide: true },
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
// Box Model Editor Component (Chrome DevTools Style)
// =============================================================================

type BoxModelEditorProps = {
  computedStyles: Record<string, string>;
  modifiedValues: Record<string, string>;
  onValueChange: (property: string, value: string) => void;
  isDarkMode?: boolean;
};

function BoxModelEditor({ computedStyles, modifiedValues, onValueChange, isDarkMode = true }: BoxModelEditorProps) {
  const [activeSide, setActiveSide] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');

  const getValue = (prop: string) => modifiedValues[prop] ?? computedStyles[prop] ?? '';

  // Margin values
  const marginTop = getValue('marginTop');
  const marginRight = getValue('marginRight');
  const marginBottom = getValue('marginBottom');
  const marginLeft = getValue('marginLeft');
  // Padding values
  const paddingTop = getValue('paddingTop');
  const paddingRight = getValue('paddingRight');
  const paddingBottom = getValue('paddingBottom');
  const paddingLeft = getValue('paddingLeft');
  // Border values
  const borderTop = getValue('borderTopWidth') || getValue('borderWidth') || '0px';
  const borderRight = getValue('borderRightWidth') || getValue('borderWidth') || '0px';
  const borderBottom = getValue('borderBottomWidth') || getValue('borderWidth') || '0px';
  const borderLeft = getValue('borderLeftWidth') || getValue('borderWidth') || '0px';

  const handleSideClick = (side: string) => {
    setActiveSide(side);
    const current = getValue(side);
    setInputValue(current);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    if (activeSide) {
      onValueChange(activeSide, inputValue);
      setActiveSide(null);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (activeSide) {
        onValueChange(activeSide, inputValue);
        setActiveSide(null);
      }
    } else if (e.key === 'Escape') {
      setActiveSide(null);
      setInputValue('');
    }
  };

  // Chrome DevTools style: nested boxes from margin → border → padding → content
  // Colors: margin (yellow), border (orange), padding (green), content (gray)

  return (
    <div className={`${styles.boxModelEditor} ${!isDarkMode ? styles.light : ''}`}>
      <div className={styles.boxModelTitle}>Box Model</div>

      <div className={styles.boxModelWrapper}>
        {/* Margin layer - yellow */}
        <div className={styles.boxModelMargin}>
          {/* Margin top */}
          <button
            className={styles.boxSideTop}
            onClick={() => handleSideClick('marginTop')}
            data-active={activeSide === 'marginTop'}
            data-type="margin"
          >
            <span className={styles.boxLabel}>m</span>
            <span className={styles.boxValue}>{marginTop || 'auto'}</span>
          </button>

          <div className={styles.boxModelMarginMiddle}>
            {/* Margin left */}
            <button
              className={styles.boxSideLeft}
              onClick={() => handleSideClick('marginLeft')}
              data-active={activeSide === 'marginLeft'}
              data-type="margin"
            >
              <span className={styles.boxLabel}>m</span>
              <span className={styles.boxValue}>{marginLeft || 'auto'}</span>
            </button>

            {/* Border layer - orange */}
            <div className={styles.boxModelBorder}>
              {/* Border top */}
              <button
                className={styles.boxSideTop}
                onClick={() => handleSideClick('borderTop')}
                data-active={activeSide === 'borderTop'}
                data-type="border"
              >
                <span className={styles.boxLabel}>b</span>
                <span className={styles.boxValue}>{borderTop}</span>
              </button>

              <div className={styles.boxModelBorderMiddle}>
                {/* Border left */}
                <button
                  className={styles.boxSideLeft}
                  onClick={() => handleSideClick('borderLeft')}
                  data-active={activeSide === 'borderLeft'}
                  data-type="border"
                >
                  <span className={styles.boxLabel}>b</span>
                  <span className={styles.boxValue}>{borderLeft}</span>
                </button>

                {/* Padding layer - green */}
                <div className={styles.boxModelPadding}>
                  {/* Padding top */}
                  <button
                    className={styles.boxSideTop}
                    onClick={() => handleSideClick('paddingTop')}
                    data-active={activeSide === 'paddingTop'}
                    data-type="padding"
                  >
                    <span className={styles.boxLabel}>p</span>
                    <span className={styles.boxValue}>{paddingTop || '0'}</span>
                  </button>

                  <div className={styles.boxModelPaddingMiddle}>
                    {/* Padding left */}
                    <button
                      className={styles.boxSideLeft}
                      onClick={() => handleSideClick('paddingLeft')}
                      data-active={activeSide === 'paddingLeft'}
                      data-type="padding"
                    >
                      <span className={styles.boxLabel}>p</span>
                      <span className={styles.boxValue}>{paddingLeft || '0'}</span>
                    </button>

                    {/* Content */}
                    <div className={styles.boxModelContent}>
                      <span>内容</span>
                    </div>

                    {/* Padding right */}
                    <button
                      className={styles.boxSideLeft}
                      onClick={() => handleSideClick('paddingRight')}
                      data-active={activeSide === 'paddingRight'}
                      data-type="padding"
                    >
                      <span className={styles.boxValue}>{paddingRight || '0'}</span>
                      <span className={styles.boxLabel}>p</span>
                    </button>
                  </div>

                  {/* Padding bottom */}
                  <button
                    className={styles.boxSideTop}
                    onClick={() => handleSideClick('paddingBottom')}
                    data-active={activeSide === 'paddingBottom'}
                    data-type="padding"
                  >
                    <span className={styles.boxValue}>{paddingBottom || '0'}</span>
                    <span className={styles.boxLabel}>p</span>
                  </button>
                </div>

                {/* Border right */}
                <button
                  className={styles.boxSideLeft}
                  onClick={() => handleSideClick('borderRight')}
                  data-active={activeSide === 'borderRight'}
                  data-type="border"
                >
                  <span className={styles.boxValue}>{borderRight}</span>
                  <span className={styles.boxLabel}>b</span>
                </button>
              </div>

              {/* Border bottom */}
              <button
                className={styles.boxSideTop}
                onClick={() => handleSideClick('borderBottom')}
                data-active={activeSide === 'borderBottom'}
                data-type="border"
              >
                <span className={styles.boxValue}>{borderBottom}</span>
                <span className={styles.boxLabel}>b</span>
              </button>
            </div>

            {/* Margin right */}
            <button
              className={styles.boxSideLeft}
              onClick={() => handleSideClick('marginRight')}
              data-active={activeSide === 'marginRight'}
              data-type="margin"
            >
              <span className={styles.boxValue}>{marginRight || 'auto'}</span>
              <span className={styles.boxLabel}>m</span>
            </button>
          </div>

          {/* Margin bottom */}
          <button
            className={styles.boxSideTop}
            onClick={() => handleSideClick('marginBottom')}
            data-active={activeSide === 'marginBottom'}
            data-type="margin"
          >
            <span className={styles.boxValue}>{marginBottom || 'auto'}</span>
            <span className={styles.boxLabel}>m</span>
          </button>
        </div>
      </div>

      {/* Input for editing */}
      {activeSide && (
        <div className={styles.boxModelInputWrapper}>
          <span className={styles.boxModelInputLabel}>{activeSide.replace(/([A-Z])/g, ' ')}</span>
          <input
            type="text"
            className={styles.boxModelInput}
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            placeholder="e.g. 10px"
            autoFocus
          />
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Typography Editor Component (Figma Style)
// =============================================================================

type TypographyEditorProps = {
  computedStyles: Record<string, string>;
  modifiedValues: Record<string, string>;
  onValueChange: (property: string, value: string) => void;
  isDarkMode?: boolean;
};

function TypographyEditor({ computedStyles, modifiedValues, onValueChange, isDarkMode = true }: TypographyEditorProps) {
  const getValue = (prop: string) => modifiedValues[prop] ?? computedStyles[prop] ?? '';

  const fontFamily = getValue('fontFamily');
  const fontSize = getValue('fontSize');
  const fontWeight = getValue('fontWeight');
  const lineHeight = getValue('lineHeight');
  const letterSpacing = getValue('letterSpacing');

  // Check if any typography values exist
  const hasTypography = fontFamily || fontSize || fontWeight || lineHeight || letterSpacing;

  if (!hasTypography) return null;

  return (
    <div className={`${styles.typographyEditor} ${!isDarkMode ? styles.light : ''}`}>
      <div className={styles.typographyTitle}>Typography</div>

      <div className={styles.typographyRow}>
        {/* Font Family */}
        <div className={styles.typographyField}>
          <label className={styles.typographyLabel}>Font</label>
          <input
            type="text"
            className={styles.typographyInput}
            value={fontFamily}
            onChange={(e) => onValueChange('fontFamily', e.target.value)}
            placeholder="System"
          />
        </div>

        {/* Font Size */}
        <div className={styles.typographyField}>
          <label className={styles.typographyLabel}>Size</label>
          <input
            type="text"
            className={styles.typographyInput}
            value={fontSize}
            onChange={(e) => onValueChange('fontSize', e.target.value)}
            placeholder="14"
          />
        </div>

        {/* Font Weight */}
        <div className={styles.typographyField}>
          <label className={styles.typographyLabel}>Weight</label>
          <select
            className={styles.typographySelect}
            value={fontWeight}
            onChange={(e) => onValueChange('fontWeight', e.target.value)}
          >
            <option value="">-</option>
            <option value="100">100 Thin</option>
            <option value="200">200 Extra Light</option>
            <option value="300">300 Light</option>
            <option value="400">400 Regular</option>
            <option value="500">500 Medium</option>
            <option value="600">600 Semi Bold</option>
            <option value="700">700 Bold</option>
            <option value="800">800 Extra Bold</option>
            <option value="900">900 Black</option>
          </select>
        </div>
      </div>

      <div className={styles.typographyRow}>
        {/* Line Height */}
        <div className={styles.typographyField}>
          <label className={styles.typographyLabel}>Line</label>
          <input
            type="text"
            className={styles.typographyInput}
            value={lineHeight}
            onChange={(e) => onValueChange('lineHeight', e.target.value)}
            placeholder="1.5"
          />
        </div>

        {/* Letter Spacing */}
        <div className={styles.typographyField}>
          <label className={styles.typographyLabel}>Spacing</label>
          <input
            type="text"
            className={styles.typographyInput}
            value={letterSpacing}
            onChange={(e) => onValueChange('letterSpacing', e.target.value)}
            placeholder="0"
          />
        </div>
      </div>
    </div>
  );
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
  const exitTimerRef = useRef<ReturnType<typeof originalSetTimeout> | undefined>(undefined);

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

  // Box model properties are handled by BoxModelEditor
  const boxModelProperties = new Set([
    'marginTop',
    'marginRight',
    'marginBottom',
    'marginLeft',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
  ]);

  // Typography properties are handled by TypographyEditor
  const typographyProperties = new Set([
    'fontFamily',
    'fontSize',
    'fontWeight',
    'lineHeight',
    'letterSpacing',
    'textDecoration',
    'textAlign',
  ]);

  const filteredProperties = EDITABLE_PROPERTIES.filter((prop) => {
    if (boxModelProperties.has(prop)) return false;
    if (typographyProperties.has(prop)) return false;
    const hasValue = computedStyles[prop] && computedStyles[prop] !== '';
    const isCommon = ['color', 'backgroundColor', 'borderRadius'].includes(prop);
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

          {/* Box Model Visual Editor */}
          <BoxModelEditor
            computedStyles={computedStyles}
            modifiedValues={modifiedValues}
            onValueChange={handleValueChange}
            isDarkMode={isDarkMode}
          />

          {/* Typography Editor */}
          <TypographyEditor
            computedStyles={computedStyles}
            modifiedValues={modifiedValues}
            onValueChange={handleValueChange}
            isDarkMode={isDarkMode}
          />

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
