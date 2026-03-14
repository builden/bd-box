import { useAtom, useSetAtom } from 'jotai';
import { useCallback, useEffect } from 'react';
import { authenticatedFetch } from '../../../../utils/api';
import { skillsAtom, skillsLoadingAtom, skillsErrorAtom } from '../primitives/skills-atom';
import {
  enabledSkillsAtom,
  disabledSkillsAtom,
  skillsCountAtom,
  enabledSkillsCountAtom,
} from '../domain/skills-derived';
import { createLogger } from '@/lib/logger';

const logger = createLogger('useSkills');

/**
 * Skills 管理 Hook
 */
export function useSkills() {
  // Atoms
  const [skills] = useAtom(skillsAtom);
  const [loading] = useAtom(skillsLoadingAtom);
  const [error] = useAtom(skillsErrorAtom);
  const [enabledSkills] = useAtom(enabledSkillsAtom);
  const [disabledSkills] = useAtom(disabledSkillsAtom);
  const [skillsCount] = useAtom(skillsCountAtom);
  const [enabledCount] = useAtom(enabledSkillsCountAtom);

  // Setters
  const setSkills = useSetAtom(skillsAtom);
  const setLoading = useSetAtom(skillsLoadingAtom);
  const setError = useSetAtom(skillsErrorAtom);

  // 刷新 skills 列表
  const refreshSkills = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authenticatedFetch('/api/skills');
      if (res.ok) {
        const data = await res.json();
        setSkills(data.skills || []);
        setError(null);
      } else {
        let errorMessage = `Failed to fetch skills (${res.status})`;
        try {
          const data = await res.json();
          errorMessage = data.details || data.error || errorMessage;
        } catch {
          errorMessage = res.statusText || errorMessage;
        }
        setError(errorMessage);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch skills';
      setError(message);
      logger.error('Failed to fetch skills', err);
    } finally {
      setLoading(false);
    }
  }, [setSkills, setLoading, setError]);

  // 初始加载
  useEffect(() => {
    void refreshSkills();
  }, [refreshSkills]);

  // 安装 skill
  const installSkill = useCallback(
    async (url: string) => {
      try {
        const res = await authenticatedFetch('/api/skills/install', {
          method: 'POST',
          body: JSON.stringify({ url }),
        });
        const data = await res.json();
        if (res.ok) {
          await refreshSkills();
          return { success: true };
        }
        return { success: false, error: data.details || data.error || 'Install failed' };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Install failed' };
      }
    },
    [refreshSkills]
  );

  // 卸载 skill
  const uninstallSkill = useCallback(
    async (name: string) => {
      try {
        const res = await authenticatedFetch(`/api/skills/${encodeURIComponent(name)}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (res.ok) {
          await refreshSkills();
          return { success: true };
        }
        return { success: false, error: data.details || data.error || 'Uninstall failed' };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Uninstall failed' };
      }
    },
    [refreshSkills]
  );

  // 更新 skill
  const updateSkill = useCallback(
    async (name: string) => {
      try {
        const res = await authenticatedFetch(`/api/skills/${encodeURIComponent(name)}/update`, {
          method: 'POST',
        });
        const data = await res.json();
        if (res.ok) {
          await refreshSkills();
          return { success: true };
        }
        return { success: false, error: data.details || data.error || 'Update failed' };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Update failed' };
      }
    },
    [refreshSkills]
  );

  // 切换 skill
  const toggleSkill = useCallback(
    async (name: string, enabled: boolean): Promise<{ success: boolean; error: string | null }> => {
      try {
        const res = await authenticatedFetch(`/api/skills/${encodeURIComponent(name)}/enable`, {
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
        await refreshSkills();
        return { success: true, error: null };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Toggle failed' };
      }
    },
    [refreshSkills]
  );

  return {
    // 状态
    skills,
    loading,
    error,
    enabledSkills,
    disabledSkills,
    skillsCount,
    enabledCount,
    // 操作
    refreshSkills,
    installSkill,
    uninstallSkill,
    updateSkill,
    toggleSkill,
  };
}
