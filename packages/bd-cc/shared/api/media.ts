/**
 * Media API Types
 *
 * API 端点: /api/transcribe, /api/process-images
 */
import { z } from 'zod';

/**
 * 转录响应
 */
export const TranscribeResponseSchema = z.object({
  text: z.string(),
  mode: z.string().optional(),
  error: z.string().optional(),
});

export type TranscribeResponse = z.infer<typeof TranscribeResponseSchema>;

/**
 * 处理后的图片
 */
export const ProcessedImageSchema = z.object({
  originalName: z.string(),
  processedName: z.string(),
  path: z.string(),
  size: z.number().optional(),
});

export type ProcessedImage = z.infer<typeof ProcessedImageSchema>;

/**
 * 图片处理响应
 */
export const ProcessImagesResponseSchema = z.object({
  images: z.array(ProcessedImageSchema),
  error: z.string().optional(),
});

export type ProcessImagesResponse = z.infer<typeof ProcessImagesResponseSchema>;
