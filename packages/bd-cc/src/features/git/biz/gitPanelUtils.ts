import { FILE_STATUS_BADGE_CLASSES, FILE_STATUS_GROUPS, FILE_STATUS_LABELS } from '@/features/git/biz/constants';
import type { FileStatusCode, GitStatusResponse } from '../types/types';

/**
 * 判断是否为 abort 错误
 */
export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

/**
 * 读取 JSON 响应，支持 abort signal
 */
export async function readJsonResponse<T>(response: Response, signal?: AbortSignal): Promise<T> {
  if (signal?.aborted) {
    throw new DOMException('Request aborted', 'AbortError');
  }

  const data = (await response.json()) as T;

  if (signal?.aborted) {
    throw new DOMException('Request aborted', 'AbortError');
  }

  return data;
}

export function getAllChangedFiles(gitStatus: GitStatusResponse | null): string[] {
  if (!gitStatus) {
    return [];
  }

  return FILE_STATUS_GROUPS.flatMap(({ key }) => gitStatus[key] || []);
}

export function getChangedFileCount(gitStatus: GitStatusResponse | null): number {
  return getAllChangedFiles(gitStatus).length;
}

export function hasChangedFiles(gitStatus: GitStatusResponse | null): boolean {
  return getChangedFileCount(gitStatus) > 0;
}

export function getStatusLabel(status: FileStatusCode): string {
  return FILE_STATUS_LABELS[status] || status;
}

export function getStatusBadgeClass(status: FileStatusCode): string {
  return FILE_STATUS_BADGE_CLASSES[status] || FILE_STATUS_BADGE_CLASSES.U;
}
