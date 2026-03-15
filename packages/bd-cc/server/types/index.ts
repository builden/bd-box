/**
 * Server Types Index
 * ==================
 * Centralized type exports for the server module.
 * Types are co-located with their implementation; this file provides a central discovery point.
 *
 * Import patterns:
 *   // From this index (convenience)
 *   import type { WebSocketMessage } from '../types';
 *
 *   // Or directly from the module (recommended for explicit dependencies)
 *   import type { WebSocketMessage } from '../app/websocket';
 */

// Re-export from app/websocket
export type { WebSocketMessage, MessageHandler, WebSocketConfig } from '../app/websocket';

// Re-export from constants/providers
export type { ValidProvider } from '../constants/providers';

// Re-export from utils/taskmaster/taskmaster-detector
export type { TaskMasterDetectionResult, TaskMetadata } from '../utils/taskmaster/taskmaster-detector';

// Re-export from utils/spawn
export type { SpawnResult, SpawnError } from '../utils/spawn';

// Re-export from utils/api-response
export type { ErrorDetail, ErrorOptions } from '../utils/api-response';

// Re-export from utils/websocket-server
export type { WebSocketConnectionHandler, WebSocketRoutes } from '../utils/websocket-server';

// Re-export from utils/skills/skill-loader
export type { SkillManifest, SkillInfo } from '../utils/skills/skill-loader';

// Re-export from utils/spawn-cli
export type { SpawnCliOptions, SpawnCliResult } from '../utils/spawn-cli';

// Re-export from utils/git/git-loader
export type { GitCloneOptions } from '../utils/git/git-loader';
