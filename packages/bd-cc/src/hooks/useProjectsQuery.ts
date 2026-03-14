/**
 * Projects Query Hooks - 使用 jotai-tanstack-query 优化项目数据获取
 *
 * 参考 jotai-best-practices: atomWithQuery 返回的 atom 包含 { data, isLoading, error, refetch }
 */

import { useAtom } from 'jotai';
import { atomWithQuery } from 'jotai-tanstack-query';
import { api } from '@/utils/api';
import { queryKeys } from '@/lib/query-keys';
import { ProjectListResponseSchema } from '@shared/api/projects';
import { SessionsListResponseSchema } from '@shared/api/sessions';
import { validateResponse } from '@shared/api/validation';
import { createLogger } from '@/lib/logger';
import type { Project, ProjectSession } from '@/types';

const logger = createLogger('useProjectsQuery');

// 复用查询逻辑
const createQueryFetcher =
  <T>(key: string, fetcher: () => Promise<T>) =>
  async (): Promise<T> => {
    logger.debug(`Fetching ${key} via TanStack Query`);
    const data = await fetcher();
    logger.debug(`${key} fetched`, { count: Array.isArray(data) ? data.length : 0 });
    return data;
  };

// ============ Projects Query Atom ============
const projectsAtom = atomWithQuery(() => ({
  queryKey: queryKeys.projects,
  queryFn: createQueryFetcher('projects', async () => {
    const response = await api.projects();
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    const json = await response.json();

    // 响应拦截器已展开 data 字段，直接使用
    const validated = validateResponse(ProjectListResponseSchema, json, {
      endpoint: '/api/projects',
      status: response.status,
      fallbackValue: { data: [] },
    });

    // 返回 data 数组
    return validated?.data || [];
  }),
  // 项目列表变化较慢，可以设置较长的 staleTime
  staleTime: 1000 * 60 * 5, // 5 minutes
}));

/**
 * 获取项目列表 - 返回 { data, isLoading, error, refetch }
 */
export function useProjectsQuery() {
  const [result] = useAtom(projectsAtom);
  return result;
}

// ============ Sessions Query Atoms (动态创建) ============
const sessionsAtomsCache = new Map<string, ReturnType<typeof atomWithQuery>>();

function getSessionsAtom(projectName: string) {
  if (!sessionsAtomsCache.has(projectName)) {
    sessionsAtomsCache.set(
      projectName,
      atomWithQuery(() => ({
        queryKey: queryKeys.projectSessions(projectName),
        queryFn: createQueryFetcher(`sessions/${projectName}`, async () => {
          if (!projectName) return [];
          const response = await api.sessions(projectName);
          if (!response.ok) {
            throw new Error(`Failed to fetch sessions: ${response.statusText}`);
          }
          const json = await response.json();

          // 响应拦截器已展开 data 字段
          const result = validateResponse(SessionsListResponseSchema, json, {
            endpoint: `/api/projects/${projectName}/sessions`,
            status: response.status,
            fallbackValue: { data: [] },
          });

          // 返回 data 数组 (兼容新旧格式)
          return result?.data || result?.sessions || [];
        }),
        // 会话数据相对稳定，设置较长的 staleTime
        staleTime: 1000 * 60 * 2, // 2 minutes
      }))
    );
  }
  return sessionsAtomsCache.get(projectName)!;
}

/**
 * 获取项目会话列表
 *
 * @param projectName - 项目名称
 * @returns TanStack Query 结果 { data, isLoading, error, refetch }
 */
export function useProjectSessionsQuery(projectName: string) {
  const [result] = useAtom(getSessionsAtom(projectName));
  return result;
}
