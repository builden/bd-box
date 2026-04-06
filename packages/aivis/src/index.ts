// =============================================================================
// Aivis
// =============================================================================
//
// Visual feedback for AI coding agents.
//
// Usage:
//   import { Agentation } from '@builden/aivis';
//   <Agentation />
//
// =============================================================================

export { Agentation, PageFeedbackToolbarCSS } from './components/page-toolbar-css';
export type { AgentationProps, DemoAnnotation } from './components/page-toolbar-css';
export { AnnotationPopupCSS } from './components/annotation-popup-css';
export type { AnnotationPopupCSSProps, AnnotationPopupCSSHandle } from './components/annotation-popup-css';

export * from './components/icons';
export type { Annotation } from './types';

// React detection utilities
export { getReactComponentName, isReactPage, clearReactDetectionCache } from './utils/react-detection';
export type { ReactComponentInfo, ReactDetectionConfig, ReactDetectionMode } from './utils/react-detection';
