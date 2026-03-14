/**
 * Projects Query Hooks - 使用 jotai-tanstack-query 优化项目数据获取
 *
 * 参考 jotai-best-practices: atomWithQuery 返回的 atom 包含 { data, isLoading, error, refetch }
 */

import { useAtom } from 'jotai';
import { atomWithQuery } from 'jotai-tanstack-query';
import { api } from '@/utils/api';
import { queryKeys } from '@/lib/query-keys';
import { createLogger } from '@/lib/logger';
import type { Project, ProjectSession } from '@/types';

const logger = createLogger('useProjectsQuery');

// ============ Projects Query Atom ============
const projectsAtom = atomWithQuery(() => ({
  queryKey: queryKeys.projects,
  queryFn: async (): Promise<Project[]> => {
    logger.debug('Fetching projects via TanStack Query');
    const response = await api.projects();
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    const data = (await response.json()) as Project[];
    logger.debug('Projects fetched', { count: data.length });
    return data;
  },
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
        queryFn: async (): Promise<ProjectSession[]> => {
          if (!projectName) return [];
          logger.debug('Fetching sessions via TanStack Query', { projectName });
          const response = await api.sessions(projectName);
          if (!response.ok) {
            throw new Error(`Failed to fetch sessions: ${response.statusText}`);
          }
          const data = (await response.json()) as ProjectSession[];
          logger.debug('Sessions fetched', { projectName, count: data.length });
          return data;
        },
      }))
    );
  }
  return sessionsAtomsCache.get(projectName)!;
}

/**
 * 获取项目会话列表
 */
export function useProjectSessionsQuery(projectName: string) {
  const [result] = useAtom(getSessionsAtom(projectName));
  return result;
}
