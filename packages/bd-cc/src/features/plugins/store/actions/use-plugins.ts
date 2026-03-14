import { useAtom, useSetAtom } from 'jotai';
import { useCallback, useEffect } from 'react';
import { authenticatedFetch } from '../../../../utils/api';
import { pluginsAtom, pluginsLoadingAtom, pluginsErrorAtom } from '../primitives/plugins-atom';
import {
  enabledPluginsAtom,
  disabledPluginsAtom,
  pluginsCountAtom,
  enabledPluginsCountAtom,
} from '../domain/plugins-derived';
import { createLogger } from '@/lib/logger';

const logger = createLogger('usePlugins');

/**
 * 插件管理 Hook
 */
export function usePlugins() {
  // Atoms
  const [plugins] = useAtom(pluginsAtom);
  const [loading] = useAtom(pluginsLoadingAtom);
  const [error] = useAtom(pluginsErrorAtom);
  const [enabledPlugins] = useAtom(enabledPluginsAtom);
  const [disabledPlugins] = useAtom(disabledPluginsAtom);
  const [pluginsCount] = useAtom(pluginsCountAtom);
  const [enabledCount] = useAtom(enabledPluginsCountAtom);

  // Setters
  const setPlugins = useSetAtom(pluginsAtom);
  const setLoading = useSetAtom(pluginsLoadingAtom);
  const setError = useSetAtom(pluginsErrorAtom);

  // 刷新插件列表
  const refreshPlugins = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authenticatedFetch('/api/plugins');
      if (res.ok) {
        const data = await res.json();
        setPlugins(data.plugins || []);
        setError(null);
      } else {
        let errorMessage = `Failed to fetch plugins (${res.status})`;
        try {
          const data = await res.json();
          errorMessage = data.details || data.error || errorMessage;
        } catch {
          errorMessage = res.statusText || errorMessage;
        }
        setError(errorMessage);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch plugins';
      setError(message);
      logger.error('Failed to fetch plugins', err);
    } finally {
      setLoading(false);
    }
  }, [setPlugins, setLoading, setError]);

  // 初始加载
  useEffect(() => {
    void refreshPlugins();
  }, [refreshPlugins]);

  // 安装插件
  const installPlugin = useCallback(
    async (url: string) => {
      try {
        const res = await authenticatedFetch('/api/plugins/install', {
          method: 'POST',
          body: JSON.stringify({ url }),
        });
        const data = await res.json();
        if (res.ok) {
          await refreshPlugins();
          return { success: true };
        }
        return { success: false, error: data.details || data.error || 'Install failed' };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Install failed' };
      }
    },
    [refreshPlugins]
  );

  // 卸载插件
  const uninstallPlugin = useCallback(
    async (name: string) => {
      try {
        const res = await authenticatedFetch(`/api/plugins/${encodeURIComponent(name)}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (res.ok) {
          await refreshPlugins();
          return { success: true };
        }
        return { success: false, error: data.details || data.error || 'Uninstall failed' };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Uninstall failed' };
      }
    },
    [refreshPlugins]
  );

  // 更新插件
  const updatePlugin = useCallback(
    async (name: string) => {
      try {
        const res = await authenticatedFetch(`/api/plugins/${encodeURIComponent(name)}/update`, {
          method: 'POST',
        });
        const data = await res.json();
        if (res.ok) {
          await refreshPlugins();
          return { success: true };
        }
        return { success: false, error: data.details || data.error || 'Update failed' };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Update failed' };
      }
    },
    [refreshPlugins]
  );

  // 切换插件
  const togglePlugin = useCallback(
    async (name: string, enabled: boolean): Promise<{ success: boolean; error: string | null }> => {
      try {
        const res = await authenticatedFetch(`/api/plugins/${encodeURIComponent(name)}/enable`, {
          method: 'PUT',
          body: JSON.stringify({ enabled }),
        });
        if (!res.ok) {
          let errorMessage = `Toggle failed (${res.status})`;
          try {
            const data = await res.json();
            errorMessage = data.details || data.error || errorMessage;
          } catch {
            errorMessage = res.statusText || errorMessage;
          }
          return { success: false, error: errorMessage };
        }
        await refreshPlugins();
        return { success: true, error: null };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Toggle failed' };
      }
    },
    [refreshPlugins]
  );

  return {
    // 状态
    plugins,
    loading,
    error,
    enabledPlugins,
    disabledPlugins,
    pluginsCount,
    enabledCount,
    // 操作
    refreshPlugins,
    installPlugin,
    uninstallPlugin,
    updatePlugin,
    togglePlugin,
  };
}
