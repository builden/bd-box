import { usePrdRegistryQuery } from '@/hooks/usePrdQuery';
import type { PrdFile } from '../types';

type UseProjectPrdFilesOptions = {
  projectName?: string;
};

type UseProjectPrdFilesResult = {
  prdFiles: PrdFile[];
  isLoadingPrdFiles: boolean;
  error: Error | null;
  refreshPrdFiles: () => Promise<unknown>;
};

/**
 * 项目 PRD 文件 Hook - 复用 usePrdRegistryQuery
 */
export function useProjectPrdFiles({ projectName }: UseProjectPrdFilesOptions): UseProjectPrdFilesResult {
  const { data = [], isLoading, error, refetch } = usePrdRegistryQuery(projectName || '');

  return {
    prdFiles: data as PrdFile[],
    isLoadingPrdFiles: isLoading,
    error: error as Error | null,
    refreshPrdFiles: () => refetch(),
  };
}
