import { atom } from 'jotai';

export type Plugin = {
  name: string;
  displayName: string;
  version: string;
  description: string;
  author: string;
  icon: string;
  type: 'react' | 'module';
  slot: 'tab';
  entry: string;
  server: string | null;
  permissions: string[];
  enabled: boolean;
  serverRunning: boolean;
  dirName: string;
  repoUrl: string | null;
};

/**
 * 插件列表 atom (从 API 加载，不持久化)
 */
export const pluginsAtom = atom<Plugin[]>([]);

/**
 * 插件加载状态
 */
export const pluginsLoadingAtom = atom<boolean>(true);

/**
 * 插件错误信息
 */
export const pluginsErrorAtom = atom<string | null>(null);
