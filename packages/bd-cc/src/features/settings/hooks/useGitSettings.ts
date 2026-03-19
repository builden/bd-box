import { useCallback, useEffect, useRef, useState } from 'react';
import { GitConfigSchema } from '@shared/api/users';
import { validateResponse } from '@shared/api/validation';
import { authenticatedFetch } from '../../../utils/api';
import { createLogger } from '@/lib/logger';

const logger = createLogger('useGitSettings');

type SaveStatus = 'success' | 'error' | null;

export function useGitSettings() {
  const [gitName, setGitName] = useState('');
  const [gitEmail, setGitEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(null);
  const clearStatusTimerRef = useRef<number | null>(null);

  const clearSaveStatus = useCallback(() => {
    if (clearStatusTimerRef.current !== null) {
      window.clearTimeout(clearStatusTimerRef.current);
      clearStatusTimerRef.current = null;
    }
    setSaveStatus(null);
  }, []);

  const loadGitConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await authenticatedFetch('/api/users/git-config');

      const json = await response.json();
      const result = validateResponse(GitConfigSchema, json, {
        endpoint: '/api/users/git-config',
        status: response.status,
        fallbackValue: null,
      });

      if (result) {
        setGitName(result.gitName || '');
        setGitEmail(result.gitEmail || '');
      }
    } catch (error) {
      logger.error('Error loading git config', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveGitConfig = useCallback(async () => {
    try {
      setIsSaving(true);
      const response = await authenticatedFetch('/api/users/git-config', {
        method: 'POST',
        body: JSON.stringify({ gitName, gitEmail }),
      });

      if (response.ok) {
        setSaveStatus('success');
        clearStatusTimerRef.current = window.setTimeout(() => {
          setSaveStatus(null);
          clearStatusTimerRef.current = null;
        }, 3000);
        return;
      }

      setSaveStatus('error');
    } catch (error) {
      logger.error('Error saving git config', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  }, [gitEmail, gitName]);

  useEffect(() => {
    void loadGitConfig();
  }, [loadGitConfig]);

  useEffect(
    () => () => {
      if (clearStatusTimerRef.current !== null) {
        window.clearTimeout(clearStatusTimerRef.current);
      }
    },
    []
  );

  return {
    gitName,
    setGitName,
    gitEmail,
    setGitEmail,
    isLoading,
    isSaving,
    saveStatus,
    clearSaveStatus,
    saveGitConfig,
  };
}
