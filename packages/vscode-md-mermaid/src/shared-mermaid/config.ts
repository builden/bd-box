/**
 * Diagram extension configuration.
 *
 * Note: Core types have been migrated to core/types.ts.
 * This file provides backward compatibility exports.
 */

// Re-export from core/types
export { ControlsVisibilityMode, ClickDragMode, validMermaidThemes, defaultMermaidTheme } from "../core/types";
export type { DiagramExtensionConfig, MermaidExtensionConfig } from "../core/types";

// Backward compatibility alias
import { ControlsVisibilityMode } from "../core/types";
export { ControlsVisibilityMode as ShowControlsMode };
