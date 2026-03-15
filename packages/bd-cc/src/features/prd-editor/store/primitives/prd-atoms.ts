import { atomWithQuery } from 'jotai-tanstack-query';
import { api } from '@/utils/api';
import { queryKeys } from '@/lib/query-keys';
import { createLogger } from '@/lib/logger';
import type { ExistingPrdFile } from '../../types/types';

const logger = createLogger('prd-atoms');

const createQueryFetcher =
  <T>(key: string, fetcher: () => Promise<T>) =>
  async (): Promise<T> => {
    logger.debug(`Fetching ${key}`);
    return fetcher();
  };

const prdRegistryAtomsCache = new Map<string, ReturnType<typeof atomWithQuery>>();

export function getPrdRegistryAtom(projectName: string) {
  if (!prdRegistryAtomsCache.has(projectName)) {
    prdRegistryAtomsCache.set(
      projectName,
      atomWithQuery(() => ({
        queryKey: queryKeys.prds(projectName),
        queryFn: createQueryFetcher(`prds/${projectName}`, async () => {
          const response = await api.get(`/taskmaster/prd/${encodeURIComponent(projectName)}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch PRDs: ${response.statusText}`);
          }
          const data = await response.json();
          return (data.prdFiles || data.prds || []) as ExistingPrdFile[];
        }),
        staleTime: 1000 * 60 * 5,
        enabled: !!projectName,
      }))
    );
  }
  return prdRegistryAtomsCache.get(projectName)!;
}
