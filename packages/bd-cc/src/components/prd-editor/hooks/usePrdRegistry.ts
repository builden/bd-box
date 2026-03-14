import { usePrdRegistryQuery } from '@/hooks/usePrdQuery';
import type { ExistingPrdFile } from '../types';

type UsePrdRegistryArgs = {
  projectName?: string;
};

type UsePrdRegistryResult = {
  existingPrds: ExistingPrdFile[];
  isLoading: boolean;
  error: Error | null;
  refreshExistingPrds: () => Promise<unknown>;
};

/**
 * PRD 注册表 Hook - 使用 atomWithQuery 自动管理状态
 */
export function usePrdRegistry({ projectName }: UsePrdRegistryArgs): UsePrdRegistryResult {
  const { data = [], isLoading, error, refetch } = usePrdRegistryQuery(projectName || '');

  return {
    existingPrds: data as ExistingPrdFile[],
    isLoading,
    error: error as Error | null,
    refreshExistingPrds: () => refetch(),
  };
}
