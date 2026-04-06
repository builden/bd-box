export * from './store';
export { AnnotationButton } from './AnnotationButton';
export { AnnotationMarker } from './AnnotationMarker';
export { AnnotationOverlay } from './AnnotationOverlay';
export { AnnotationHoverLabel } from './AnnotationHoverLabel';
export { AnnotationHighlight } from './AnnotationHighlight';
export { AnnotationPopup } from './AnnotationPopup';
export { PendingMarker } from './PendingMarker';
export { useAnnotationClickHandler } from './useAnnotationClickHandler';
export { useAnnotationHover } from './useAnnotationHover';
export { useAnnotations } from './useAnnotations';
export { generateAnnotationOutput, copyToClipboard } from './generate-output';

// Pre-initialize source map module for faster first mapping
import { preinitializeSourceMap } from '../../utils/source-location';
preinitializeSourceMap();
