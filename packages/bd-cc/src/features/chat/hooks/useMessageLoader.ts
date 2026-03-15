import { useCallback, useRef } from 'react';
import { api, authenticatedFetch } from '@/utils/api';
import type { Provider } from '../types';
import type { SessionMessage } from '@shared/api/sessions';
import { createLogger } from '@/lib/logger';
import { MESSAGES_PER_PAGE } from '../biz/constants';

const logger = createLogger('useMessageLoader');

interface UseMessageLoaderOptions {
  provider?: Provider | string;
}

interface UseMessageLoaderResult {
  loadSessionMessages: (
    projectName: string,
    sessionId: string,
    loadMore?: boolean,
    providerArg?: Provider | string
  ) => Promise<SessionMessage[]>;
  loadCursorSessionMessages: (projectPath: string, sessionId: string) => Promise<any[]>;
}

export function useMessageLoader({
  provider: defaultProvider = 'claude',
}: UseMessageLoaderOptions = {}): UseMessageLoaderResult {
  const messagesOffsetRef = useRef(0);

  const loadSessionMessages = useCallback(
    async (
      projectName: string,
      sessionId: string,
      loadMore = false,
      providerArg: Provider | string = defaultProvider
    ): Promise<SessionMessage[]> => {
      if (!projectName || !sessionId) {
        return [];
      }

      const isInitialLoad = !loadMore;

      try {
        const currentOffset = loadMore ? messagesOffsetRef.current : 0;
        const response = await api.sessionMessages(
          projectName,
          sessionId,
          MESSAGES_PER_PAGE,
          currentOffset,
          providerArg
        );
        if (!response.ok) {
          throw new Error('Failed to load session messages');
        }

        const data = await response.json();
        // 遵循 api.md 规范: { data: { messages: [...], meta: { total, hasMore } } }
        const payload = data.data;

        const messages = payload?.messages || [];
        messagesOffsetRef.current = currentOffset + messages.length;
        return messages;
      } catch (error) {
        logger.error('Error loading session messages', error);
        return [];
      }
    },
    [defaultProvider]
  );

  const loadCursorSessionMessages = useCallback(async (projectPath: string, sessionId: string): Promise<any[]> => {
    if (!projectPath || !sessionId) {
      return [];
    }

    try {
      const url = `/api/cursor/sessions/${encodeURIComponent(sessionId)}?projectPath=${encodeURIComponent(projectPath)}`;
      const response = await authenticatedFetch(url);
      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      const blobs = data?.session?.messages || [];

      // 使用导入的转换函数
      const { convertCursorSessionMessages } = await import('../biz/messageTransforms');
      return convertCursorSessionMessages(blobs, projectPath);
    } catch (error) {
      logger.error('Error loading Cursor session messages', error);
      return [];
    }
  }, []);

  return {
    loadSessionMessages,
    loadCursorSessionMessages,
  };
}
