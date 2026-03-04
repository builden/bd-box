/**
 * Default configuration values.
 */
import { ControlsVisibilityMode, ClickDragMode } from "../core/types";
import type { DiagramExtensionConfig, DotExtensionConfig } from "../core/types";

export const defaultConfig: DiagramExtensionConfig = {
  darkModeTheme: "dark",
  lightModeTheme: "default",
  maxTextSize: 50000,
  clickDrag: ClickDragMode.Alt,
  showControls: ControlsVisibilityMode.OnHoverOrFocus,
  resizable: true,
  maxHeight: "",
};

export const defaultDotConfig: DotExtensionConfig = {
  ...defaultConfig,
  layoutEngine: "dot",
};
