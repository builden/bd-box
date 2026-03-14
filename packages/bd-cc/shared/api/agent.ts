/**
 * Agent API Types
 *
 * API 端点: /api/agent
 */
import { z } from 'zod';

/**
 * Agent 请求
 */
export const AgentRequestSchema = z.object({
  githubUrl: z.string().url().optional(),
  projectPath: z.string().optional(),
  message: z.string(),
  provider: z.enum(['claude', 'cursor', 'codex', 'gemini']).optional(),
  model: z.string().optional(),
  githubToken: z.string().optional(),
  branchName: z.string().optional(),
  stream: z.boolean().optional(),
  cleanup: z.boolean().optional(),
  createBranch: z.boolean().optional(),
  createPR: z.boolean().optional(),
});

export type AgentRequest = z.infer<typeof AgentRequestSchema>;

/**
 * Agent 响应
 */
export const AgentResponseSchema = z.object({
  success: z.boolean(),
  projectPath: z.string().optional(),
  branchName: z.string().optional(),
  commitHash: z.string().optional(),
  message: z.string().optional(),
  output: z.string().optional(),
  error: z.string().optional(),
});

export type AgentResponse = z.infer<typeof AgentResponseSchema>;
