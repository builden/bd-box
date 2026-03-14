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
import { TaskMasterStatusResponseSchema } from '@shared/api/tasks';
import { notificationService } from '@/components/app/GlobalNotifications';
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
      const res = await authenticatedFetch('/api/taskmasters/installation-status');
      if (res.ok) {
        const json = await res.json();
        const result = TaskMasterStatusResponseSchema.safeParse(json);

        if (!result.success) {
          logger.error('Invalid TaskMaster status response:', result.error);
          notificationService.error('数据格式错误', 'TaskMaster 状态响应格式不正确', {
            url: '/api/taskmasters/installation-status',
            status: 200,
            context: { zodError: result.error.format() },
          });
          setIsTaskMasterInstalled(false);
          setIsTaskMasterReady(false);
          setIsCheckingInstallation(false);
          return;
        }

        const data = result.data;
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
