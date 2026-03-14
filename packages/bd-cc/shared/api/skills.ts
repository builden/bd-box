/**
 * Skills API Types
 *
 * API 端点: /api/skills
 */
import { z } from 'zod';

/**
 * 技能信息
 */
export const SkillSchema = z.object({
  name: z.string(),
  displayName: z.string(),
  description: z.string(),
  allowedTools: z.string(),
  enabled: z.boolean(),
  dirName: z.string(),
  repoUrl: z.string().nullable(),
  isSymlink: z.boolean(),
  sourcePath: z.string().nullable(),
});

export type Skill = z.infer<typeof SkillSchema>;

/**
 * 技能列表响应
 */
export const SkillsListResponseSchema = z.object({
  skills: z.array(SkillSchema),
});

export type SkillsListResponse = z.infer<typeof SkillsListResponseSchema>;

/**
 * 技能操作响应
 */
export const SkillActionResponseSchema = z.object({
  success: z.boolean(),
  name: z.string(),
  enabled: z.boolean().optional(),
  skill: SkillSchema.optional(),
});

export type SkillActionResponse = z.infer<typeof SkillActionResponseSchema>;
