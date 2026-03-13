import { useAtom, useSetAtom } from 'jotai';
import { useCallback, useEffect } from 'react';
import { authenticatedFetch } from '@/utils/api';
import {
  tasksEnabledAtom,
  isTaskMasterInstalledAtom,
  isTaskMasterReadyAtom,
  installationStatusAtom,
  isCheckingInstallationAtom,
} from '../primitives/tasks-settings-atom';

/**
 * Tasks 设置管理 Hook
 */
export function useTasksSettings() {
  // Atoms
  const [tasksEnabled, setTasksEnabled] = useAtom(tasksEnabledAtom);
  const [isTaskMasterInstalled] = useAtom(isTaskMasterInstalledAtom);
  const [isTaskMasterReady] = useAtom(isTaskMasterReadyAtom);
  const [installationStatus] = useAtom(installationStatusAtom);
  const [isCheckingInstallation] = useAtom(isCheckingInstallationAtom);

  // Setters
  const setIsTaskMasterInstalled = useSetAtom(isTaskMasterInstalledAtom);
  const setIsTaskMasterReady = useSetAtom(isTaskMasterReadyAtom);
  const setInstallationStatus = useSetAtom(installationStatusAtom);
  const setIsCheckingInstallation = useSetAtom(isCheckingInstallationAtom);

  // 持久化 tasksEnabled 到 localStorage
  useEffect(() => {
    localStorage.setItem('bd-cc:tasks-enabled', JSON.stringify(tasksEnabled));
  }, [tasksEnabled]);

  // 初始化时从 localStorage 加载 tasksEnabled
  useEffect(() => {
    const saved = localStorage.getItem('bd-cc:tasks-enabled');
    if (saved !== null) {
      setTasksEnabled(JSON.parse(saved));
    }
  }, [setTasksEnabled]);

  // 检查 TaskMaster 安装状态
  const checkInstallation = useCallback(async () => {
    try {
      const res = await authenticatedFetch('/taskmaster/installation-status');
      if (res.ok) {
        const data = await res.json();
        setInstallationStatus(data);
        setIsTaskMasterInstalled(data.installation?.isInstalled || false);
        setIsTaskMasterReady(data.isReady || false);

        // 如果 TaskMaster 未安装且用户未明确启用，则自动禁用
        const userEnabledTasks = localStorage.getItem('bd-cc:tasks-enabled');
        if (!data.installation?.isInstalled && !userEnabledTasks) {
          setTasksEnabled(false);
        }
      } else {
        console.error('Failed to check TaskMaster installation status');
        setIsTaskMasterInstalled(false);
        setIsTaskMasterReady(false);
      }
    } catch (error) {
      console.error('Error checking TaskMaster installation:', error);
      setIsTaskMasterInstalled(false);
      setIsTaskMasterReady(false);
    } finally {
      setIsCheckingInstallation(false);
    }
  }, [setInstallationStatus, setIsTaskMasterInstalled, setIsTaskMasterReady, setTasksEnabled]);

  // 初始检查
  useEffect(() => {
    setTimeout(checkInstallation, 0);
  }, [checkInstallation]);

  // 切换 tasks 启用状态
  const toggleTasksEnabled = useCallback(() => {
    setTasksEnabled((prev) => !prev);
  }, [setTasksEnabled]);

  return {
    // 状态
    tasksEnabled,
    isTaskMasterInstalled,
    isTaskMasterReady,
    installationStatus,
    isCheckingInstallation,
    // 操作
    setTasksEnabled,
    toggleTasksEnabled,
  };
}
