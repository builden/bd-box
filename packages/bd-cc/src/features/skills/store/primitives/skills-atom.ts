import { atom } from 'jotai';

export type Skill = {
  name: string;
  displayName: string;
  description: string;
  allowedTools: string;
  enabled: boolean;
  dirName: string;
  repoUrl: string | null;
  isSymlink: boolean;
  sourcePath: string | null;
};

/**
 * Skills 列表 atom (从 API 加载，不持久化)
 */
export const skillsAtom = atom<Skill[]>([]);

/**
 * Skills 加载状态
 */
export const skillsLoadingAtom = atom<boolean>(true);

/**
 * Skills 错误信息
 */
export const skillsErrorAtom = atom<string | null>(null);
