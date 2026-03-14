/**
 * PROJECT SERVICE - Re-export Layer
 * ================================
 * This file re-exports all services for backward compatibility.
 * The actual implementation has been moved to services/*.ts
 */

export {
  // Config
  loadProjectConfig,
  saveProjectConfig,
  // Discovery
  getProjects,
  extractProjectDirectory,
  clearProjectDirectoryCache,
  generateDisplayName,
  addProjectManually,
  renameProject,
  isProjectEmpty,
  deleteProject,
  // Sessions
  getSessions,
  getSessionMessages,
  parseJsonlSessions,
  deleteSession,
  // Cursor
  getCursorSessions,
  // Codex
  getCodexSessions,
  getCodexSessionMessages,
  deleteCodexSession,
  buildCodexSessionsIndex,
  // Gemini
  getGeminiCliSessions,
  getGeminiCliSessionMessages,
  // Search
  searchConversations,
} from './services/index';
