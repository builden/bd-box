/**
 * Commands API Types
 *
 * API 端点: /api/commands
 */
import { z } from 'zod';

/**
 * 命令元数据
 */
export const CommandMetadataSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  args: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        required: z.boolean().optional(),
      })
    )
    .optional(),
});

export type CommandMetadata = z.infer<typeof CommandMetadataSchema>;

/**
 * 命令列表响应
 */
export const CommandsListResponseSchema = z.object({
  builtIn: z.array(CommandMetadataSchema),
  custom: z.array(CommandMetadataSchema),
  count: z.number(),
});

export type CommandsListResponse = z.infer<typeof CommandsListResponseSchema>;

/**
 * 命令内容响应
 */
export const CommandContentResponseSchema = z.object({
  path: z.string(),
  metadata: CommandMetadataSchema.optional(),
  content: z.string(),
});

export type CommandContentResponse = z.infer<typeof CommandContentResponseSchema>;

/**
 * 命令执行响应
 */
export const CommandExecuteResponseSchema = z.object({
  success: z.boolean(),
  output: z.string().optional(),
  error: z.string().optional(),
  command: z.string(),
});

export type CommandExecuteResponse = z.infer<typeof CommandExecuteResponseSchema>;

/**
 * 命令处理响应
 */
export const CommandProcessResponseSchema = z.object({
  type: z.enum(['built-in', 'custom']),
  command: z.string(),
  content: z.string(),
  metadata: CommandMetadataSchema.optional(),
  hasFileIncludes: z.boolean(),
});

export type CommandProcessResponse = z.infer<typeof CommandProcessResponseSchema>;
