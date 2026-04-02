/**
 * EditAnnotationPopup - Shows edit popup when editing an annotation.
 * Extracted from page-toolbar-css/index.tsx.
 */

import type { AnnotationPopupCSSHandle } from '../annotation-popup-css';
import type { Annotation } from '../../types';
import { parseComputedStylesString } from '../../utils/element-identification';
import { AnnotationPopupCSS } from '../annotation-popup-css';
import { EditAnnotationOutline } from './EditAnnotationOutline';

interface EditAnnotationPopupProps {
  editingAnnotation: Annotation;
  editingTargetElements: HTMLElement[];
  editingTargetElement: HTMLElement | null;
  scrollY: number;
  isDarkMode: boolean;
  editExiting: boolean;
  editPopupRef: React.RefObject<AnnotationPopupCSSHandle | null>;
  editPopupStyle: React.CSSProperties;
  onSubmit: (comment: string) => void;
  onCancel: () => void;
  onDelete: () => void;
}

export function EditAnnotationPopup({
  editingAnnotation,
  editingTargetElements,
  editingTargetElement,
  scrollY,
  isDarkMode,
  editExiting,
  editPopupRef,
  editPopupStyle,
  onSubmit,
  onCancel,
  onDelete,
}: EditAnnotationPopupProps) {
  return (
    <>
      {/* Show element/area outline while editing */}
      <EditAnnotationOutline
        editingAnnotation={editingAnnotation}
        editingTargetElements={editingTargetElements}
        editingTargetElement={editingTargetElement}
        scrollY={scrollY}
      />

      <AnnotationPopupCSS
        ref={editPopupRef}
        element={editingAnnotation.element}
        selectedText={editingAnnotation.selectedText}
        computedStyles={parseComputedStylesString(editingAnnotation.computedStyles)}
        placeholder="编辑你的反馈..."
        initialValue={editingAnnotation.comment}
        submitLabel="保存"
        onSubmit={onSubmit}
        onCancel={onCancel}
        onDelete={onDelete}
        isExiting={editExiting}
        lightMode={!isDarkMode}
        accentColor={
          editingAnnotation.isMultiSelect ? 'var(--agentation-color-green)' : 'var(--agentation-color-accent)'
        }
        style={editPopupStyle}
      />
    </>
  );
}
