/**
 * Files API Types
 *
 * API 端点: /api/projects/:projectName/files
 */
import { z } from 'zod';

/**
 * 文件树节点 - 先定义类型
 */
export const FileTreeNodeSchema: z.ZodType<{
  name: string;
  type: 'file' | 'directory';
  path?: string;
  size?: number;
  modifiedAt?: string;
  children?: z.infer<typeof FileTreeNodeSchema>[];
}> = z.lazy(() =>
  z.object({
    name: z.string(),
    type: z.enum(['file', 'directory']),
    path: z.string().optional(),
    size: z.number().optional(),
    modifiedAt: z.string().optional(),
    children: z.array(FileTreeNodeSchema).optional(),
  })
);

export type FileTreeNode = z.infer<typeof FileTreeNodeSchema>;

/**
 * 文件树响应
 */
export const FileTreeResponseSchema = z.object({
  files: z.array(FileTreeNodeSchema),
  projectRoot: z.string(),
});

export type FileTreeResponse = z.infer<typeof FileTreeResponseSchema>;
