import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

/**
 * TaskMaster 安装状态 - 匹配后端 API 响应格式
 */
export type InstallationStatus = {
  installed: boolean;
  path: string | null;
  error?: string;
};

/**
 * Tasks 设置状态
 */
export type TasksSettingsState = {
  tasksEnabled: boolean;
  isTaskMasterInstalled: boolean | null;
  isTaskMasterReady: boolean | null;
  installationStatus: InstallationStatus | null;
  isCheckingInstallation: boolean;
};

/**
 * tasksEnabled 持久化 atom - 使用 atomWithStorage 自动持久化
 */
export const tasksEnabledAtom = atomWithStorage<boolean>('bd-cc:tasks-enabled', true);

/**
 * TaskMaster 安装状态
 */
export const isTaskMasterInstalledAtom = atom<boolean | null>(null);

/**
 * TaskMaster 就绪状态
 */
export const isTaskMasterReadyAtom = atom<boolean | null>(null);

/**
 * 安装状态详情
 */
export const installationStatusAtom = atom<InstallationStatus | null>(null);

/**
 * 正在检查安装状态
 */
export const isCheckingInstallationAtom = atom<boolean>(true);
