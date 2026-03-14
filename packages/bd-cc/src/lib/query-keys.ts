/**
 * TanStack Query Keys 统一管理
 */

export const queryKeys = {
  // Projects
  projects: ['projects'] as const,
  projectSessions: (projectName: string) => ['projects', projectName, 'sessions'] as const,

  // Settings
  apiKeys: ['settings', 'api-keys'] as const,
  githubCredentials: ['settings', 'github-credentials'] as const,
  gitConfig: ['users', 'git-config'] as const,
  onboardingStatus: ['users', 'onboarding-status'] as const,

  // Plugins
  plugins: ['plugins'] as const,

  // PRD
  prds: (projectName: string) => ['prds', projectName] as const,

  // Skills
  skills: ['skills'] as const,

  // MCP Servers
  mcpServers: ['mcp', 'servers'] as const,
} as const;
