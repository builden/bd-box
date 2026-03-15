import { useAtom } from 'jotai';
import { projectsAtom, getSessionsAtom } from '../primitives/projects-atoms';

/**
 * 获取项目列表
 * @returns TanStack Query 结果 { data, isLoading, error, refetch }
 */
export function useProjectsQuery() {
  const [result] = useAtom(projectsAtom);
  return result;
}

/**
 * 获取项目会话列表
 * @param projectName - 项目名称
 * @returns TanStack Query 结果 { data, isLoading, error, refetch }
 */
export function useProjectSessionsQuery(projectName: string) {
  const [result] = useAtom(getSessionsAtom(projectName));
  return result;
}
