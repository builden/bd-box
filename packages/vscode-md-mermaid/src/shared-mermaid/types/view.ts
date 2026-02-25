/**
 * View state types for diagram zoom and pan operations.
 */

export interface ViewState {
  x: number;
  y: number;
  zoom: number;
}

export type ViewMode = 'normal' | 'fullscreen';

export interface ViewStates {
  normal: ViewState;
  fullscreen: ViewState;
}
