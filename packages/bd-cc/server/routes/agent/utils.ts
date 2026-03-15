/**
 * Agent Route Utilities
 * =====================
 * Re-export layer for backward compatibility
 * Actual implementation moved to services/
 */

export {
  // GitHub service
  normalizeGitHubUrl,
  parseGitHubUrl,
  autogenerateBranchName,
  validateBranchName,
  getGitRemoteUrl,
  getCommitMessages,
  createGitHubBranch,
  createGitHubPR,
  cloneGitHubRepo,
  cleanupProject,
} from '../../services/github';

export { SSEStreamWriter, ResponseCollector } from '../../services/response-writer';
