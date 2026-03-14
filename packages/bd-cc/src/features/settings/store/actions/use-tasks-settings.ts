import { useAtom, useSetAtom } from 'jotai';
import { useCallback, useEffect } from 'react';
import { authenticatedFetch } from '../../../../utils/api';
import {
  tasksEnabledAtom,
  isTaskMasterInstalledAtom,
  isTaskMasterReadyAtom,
  installationStatusAtom,
  isCheckingInstallationAtom,
} from '../primitives/tasks-settings-atom';
import { createLogger } from '@/lib/logger';

const logger = createLogger('useTasksSettings');

/**
 * Tasks 设置管理 Hook - 使用 atomWithStorage 自动持久化
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

  // 检查 TaskMaster 安装状态
  const checkInstallation = useCallback(async () => {
    try {
      const res = await authenticatedFetch('/taskmasters/installation-status');
      if (res.ok) {
        const data = await res.json();
        setInstallationStatus(data);
        setIsTaskMasterInstalled(data.installation?.isInstalled || false);
        setIsTaskMasterReady(data.isReady || false);

        // 如果 TaskMaster 未安装且用户未明确启用，则自动禁用
        if (!data.installation?.isInstalled) {
          setTasksEnabled(false);
        }
      } else {
        logger.error('Failed to check TaskMaster installation status');
        setIsTaskMasterInstalled(false);
        setIsTaskMasterReady(false);
      }
    } catch (error) {
      logger.error('Error checking TaskMaster installation', error);
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
