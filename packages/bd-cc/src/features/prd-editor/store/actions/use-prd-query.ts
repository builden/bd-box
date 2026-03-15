import { useAtom } from 'jotai';
import { getPrdRegistryAtom } from '../primitives/prd-atoms';

/**
 * 获取项目 PRD 列表
 * @param projectName - 项目名称
 * @returns TanStack Query 结果 { data, isLoading, error, refetch }
 */
export function usePrdRegistryQuery(projectName: string) {
  const [result] = useAtom(getPrdRegistryAtom(projectName));
  return result;
}
