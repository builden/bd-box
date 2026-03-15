/**
 * PRD Query Hooks - 使用 jotai-tanstack-query 优化 PRD 数据获取
 */

import { useAtom } from 'jotai';
import { atomWithQuery } from 'jotai-tanstack-query';
import { api } from '@/utils/api';
import { queryKeys } from '@/lib/query-keys';
import { createLogger } from '@/lib/logger';
import type { ExistingPrdFile } from '@/features/prd-editor/types/types';

const logger = createLogger('usePrdQuery');

// ============ PRD Registry Query Atom (动态创建) ============
const prdRegistryAtomsCache = new Map<string, ReturnType<typeof atomWithQuery>>();

function getPrdRegistryAtom(projectName: string) {
  if (!prdRegistryAtomsCache.has(projectName)) {
    prdRegistryAtomsCache.set(
      projectName,
      atomWithQuery(() => ({
        queryKey: queryKeys.prds(projectName),
        queryFn: async () => {
          logger.debug(`Fetching PRDs for ${projectName}`);
          const response = await api.get(`/taskmaster/prd/${encodeURIComponent(projectName)}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch PRDs: ${response.statusText}`);
          }
          const data = await response.json();
          // Handle both prdFiles and prds response formats
          return (data.prdFiles || data.prds || []) as ExistingPrdFile[];
        },
        // PRD 列表变化较慢，可以设置较长的 staleTime
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: !!projectName,
      }))
    );
  }
  return prdRegistryAtomsCache.get(projectName)!;
}

/**
 * 获取项目 PRD 列表
 *
 * @param projectName - 项目名称
 * @returns TanStack Query 结果 { data, isLoading, error, refetch }
 */
export function usePrdRegistryQuery(projectName: string) {
  const [result] = useAtom(getPrdRegistryAtom(projectName));
  return result;
}
