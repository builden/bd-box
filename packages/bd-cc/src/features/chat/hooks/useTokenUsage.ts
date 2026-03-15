import { useCallback, useEffect, useState } from 'react';
import { authenticatedFetch } from '@/utils/api';
import { createLogger } from '@/lib/logger';

const logger = createLogger('useTokenUsage');

interface UseTokenUsageOptions {
  selectedProject: { name: string } | null;
  selectedSessionId: string | null;
  sessionProvider?: string;
}

interface TokenUsage {
  [key: string]: unknown;
}

interface UseTokenUsageResult {
  tokenBudget: TokenUsage | null;
  setTokenBudget: React.Dispatch<React.SetStateAction<TokenUsage | null>>;
  fetchTokenUsage: () => Promise<void>;
}

export function useTokenUsage({
  selectedProject,
  selectedSessionId,
  sessionProvider = 'claude',
}: UseTokenUsageOptions): UseTokenUsageResult {
  const [tokenBudget, setTokenBudget] = useState<TokenUsage | null>(null);

  const fetchTokenUsage = useCallback(async () => {
    if (!selectedProject || !selectedSessionId || selectedSessionId.startsWith('new-session-')) {
      setTokenBudget(null);
      return;
    }

    if (sessionProvider !== 'claude') {
      return;
    }

    try {
      const url = `/api/projects/${selectedProject.name}/sessions/${selectedSessionId}/token-usage`;
      const response = await authenticatedFetch(url);
      if (response.ok) {
        const data = await response.json();
        setTokenBudget(data);
      } else {
        setTokenBudget(null);
      }
    } catch (error) {
      logger.error('Failed to fetch initial token usage', error);
    }
  }, [selectedProject, selectedSessionId, sessionProvider]);

  useEffect(() => {
    fetchTokenUsage();
  }, [fetchTokenUsage]);

  return {
    tokenBudget,
    setTokenBudget,
    fetchTokenUsage,
  };
}
