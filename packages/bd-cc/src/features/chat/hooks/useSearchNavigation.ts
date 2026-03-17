import { useCallback, useEffect, useRef, useState } from 'react';
import type { ProjectSession } from '@/types';
import { api } from '@/utils/api';
import { createLogger } from '@/lib/logger';

const logger = createLogger('useSearchNavigation');

interface SearchTarget {
  timestamp?: string;
  uuid?: string;
  snippet?: string;
}

interface UseSearchNavigationOptions {
  selectedSession: ProjectSession | null;
  selectedProject: { name: string; fullPath?: string; path?: string } | null;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

interface UseSearchNavigationResult {
  searchTarget: SearchTarget | null;
  setSearchTarget: React.Dispatch<React.SetStateAction<SearchTarget | null>>;
  scrollToSearchTarget: () => void;
}

export function useSearchNavigation({
  selectedSession,
  selectedProject,
  scrollContainerRef,
}: UseSearchNavigationOptions): UseSearchNavigationResult {
  const [searchTarget, setSearchTarget] = useState<SearchTarget | null>(null);
  const searchScrollActiveRef = useRef(false);

  const scrollToSearchTarget = useCallback(() => {
    if (!searchTarget) return;

    const target = searchTarget;
    setSearchTarget(null);

    const scrollToTarget = async () => {
      if (!selectedSession || !selectedProject) return;

      const sessionProvider = selectedSession.__provider || 'claude';
      if (sessionProvider !== 'cursor') {
        try {
          const response = await api.sessionMessages(
            selectedProject.name,
            selectedSession.id,
            null,
            0,
            sessionProvider
          );
          if (response.ok) {
            const data = await response.json();
            // API 返回格式: { data: { messages: { messages: [...], meta: {...} } } }
            const payload = data.data;
            const messagesData = payload?.messages;
            const allMessages = messagesData?.messages || messagesData || [];
            // Wait for messages to render
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
        } catch {
          // Fall through and scroll in current messages
        }
      }

      const findAndScroll = (retriesLeft: number) => {
        const container = scrollContainerRef.current;
        if (!container) return;

        let targetElement: Element | null = null;

        if (target.snippet) {
          const cleanSnippet = target.snippet
            .replace(/^\.{3}/, '')
            .replace(/\.{3}$/, '')
            .trim();
          const searchPhrase = cleanSnippet.slice(0, 80).toLowerCase().trim();

          if (searchPhrase.length >= 10) {
            const messageElements = container.querySelectorAll('.chat-message');
            for (const el of messageElements) {
              const text = (el.textContent || '').toLowerCase();
              if (text.includes(searchPhrase)) {
                targetElement = el;
                break;
              }
            }
          }
        }

        if (!targetElement && target.timestamp) {
          const targetDate = new Date(target.timestamp).getTime();
          const messageElements = container.querySelectorAll('[data-message-timestamp]');
          let closestDiff = Infinity;

          for (const el of messageElements) {
            const ts = el.getAttribute('data-message-timestamp');
            if (!ts) continue;
            const diff = Math.abs(new Date(ts).getTime() - targetDate);
            if (diff < closestDiff) {
              closestDiff = diff;
              targetElement = el;
            }
          }
        }

        if (targetElement) {
          targetElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
          targetElement.classList.add('search-highlight-flash');
          setTimeout(() => targetElement?.classList.remove('search-highlight-flash'), 4000);
          searchScrollActiveRef.current = false;
        } else if (retriesLeft > 0) {
          setTimeout(() => findAndScroll(retriesLeft - 1), 200);
        } else {
          searchScrollActiveRef.current = false;
        }
      };

      setTimeout(() => findAndScroll(15), 150);
    };

    scrollToTarget();
  }, [searchTarget, selectedProject, selectedSession, scrollContainerRef]);

  // Detect search navigation target
  useEffect(() => {
    const session = selectedSession as Record<string, unknown> | null;
    const targetSnippet = session?.__searchTargetSnippet;
    const targetTimestamp = session?.__searchTargetTimestamp;
    if (typeof targetSnippet === 'string' && targetSnippet) {
      searchScrollActiveRef.current = true;
      setSearchTarget({
        snippet: targetSnippet,
        timestamp: typeof targetTimestamp === 'string' ? targetTimestamp : undefined,
      });
    }
  }, [selectedSession]);

  return {
    searchTarget,
    setSearchTarget,
    scrollToSearchTarget,
  };
}
