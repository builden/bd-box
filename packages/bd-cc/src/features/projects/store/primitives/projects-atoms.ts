import { atomWithQuery } from 'jotai-tanstack-query';
import { api } from '@/utils/api';
import { queryKeys } from '@/lib/query-keys';
import { ProjectListResponseSchema } from '@shared/api/projects';
import { SessionsListResponseSchema } from '@shared/api/sessions';
import { validateResponse } from '@shared/api/validation';
import { createLogger } from '@/lib/logger';

const logger = createLogger('projects-atoms');

// ============ Projects Query Atom ============
const createQueryFetcher =
  <T>(key: string, fetcher: () => Promise<T>) =>
  async (): Promise<T> => {
    logger.debug(`Fetching ${key} via TanStack Query`);
    const data = await fetcher();
    logger.debug(`${key} fetched`, { count: Array.isArray(data) ? data.length : 0 });
    return data;
  };

export const projectsAtom = atomWithQuery(() => ({
  queryKey: queryKeys.projects,
  queryFn: createQueryFetcher('projects', async () => {
    const response = await api.projects();
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    const json = await response.json();
    const validated = validateResponse(ProjectListResponseSchema, json, {
      endpoint: '/api/projects',
      status: response.status,
      fallbackValue: { items: [] },
    });
    return validated?.items || [];
  }),
  staleTime: 1000 * 60 * 5, // 5 minutes
}));

// ============ Sessions Query Atoms (动态创建) ============
const sessionsAtomsCache = new Map<string, ReturnType<typeof atomWithQuery>>();

export function getSessionsAtom(projectName: string) {
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
          const result = validateResponse(SessionsListResponseSchema, json, {
            endpoint: `/api/projects/${projectName}/sessions`,
            status: response.status,
            fallbackValue: { items: [] },
          });
          return result?.items || [];
        }),
        staleTime: 1000 * 60 * 2, // 2 minutes
      }))
    );
  }
  return sessionsAtomsCache.get(projectName)!;
}
