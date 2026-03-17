import { useCallback, useEffect, useRef, useState } from 'react';

const INITIAL_VISIBLE_MESSAGES = 50;

interface ScrollRestoreState {
  height: number;
  top: number;
}

interface UseScrollManagerOptions {
  autoScrollToBottom?: boolean;
  onLoadMore?: () => Promise<boolean>;
  hasMoreMessages?: boolean;
}

interface UseScrollManagerResult {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  scrollToBottom: () => void;
  scrollToBottomAndReset: () => void;
  isNearBottom: () => boolean;
  visibleMessageCount: number;
  setVisibleMessageCount: React.Dispatch<React.SetStateAction<number>>;
}

export function useScrollManager({
  autoScrollToBottom = true,
  onLoadMore,
  hasMoreMessages = false,
}: UseScrollManagerOptions = {}): UseScrollManagerResult {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const pendingScrollRestoreRef = useRef<ScrollRestoreState | null>(null);
  const scrollPositionRef = useRef({ height: 0, top: 0 });
  const [visibleMessageCount, setVisibleMessageCount] = useState(INITIAL_VISIBLE_MESSAGES);

  const isNearBottom = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return false;
    }
    const { scrollTop, scrollHeight, clientHeight } = container;
    return scrollHeight - scrollTop - clientHeight < 50;
  }, []);

  const scrollToBottom = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }
    container.scrollTop = container.scrollHeight;
  }, []);

  const scrollToBottomAndReset = useCallback(() => {
    scrollToBottom();
    setVisibleMessageCount(INITIAL_VISIBLE_MESSAGES);
  }, [scrollToBottom]);

  // Intersection Observer 实现无限滚动
  useEffect(() => {
    if (!sentinelRef.current || !scrollContainerRef.current) {
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        // 只有在可视区域内且还有更多消息时才触发
        if (entry.isIntersecting && hasMoreMessages && onLoadMore) {
          onLoadMore();
        }
      },
      {
        root: scrollContainerRef.current,
        rootMargin: '500px', // 提前 500px 触发
        threshold: 0,
      }
    );

    observerRef.current.observe(sentinelRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [hasMoreMessages, onLoadMore]);

  // 滚动恢复
  useEffect(() => {
    if (!pendingScrollRestoreRef.current || !scrollContainerRef.current) {
      return;
    }

    const { height, top } = pendingScrollRestoreRef.current;
    const container = scrollContainerRef.current;
    const newScrollHeight = container.scrollHeight;
    const scrollDiff = newScrollHeight - height;
    container.scrollTop = top + Math.max(scrollDiff, 0);
    pendingScrollRestoreRef.current = null;
  });

  // 自动滚动
  useEffect(() => {
    if (!scrollContainerRef.current) {
      return;
    }

    if (autoScrollToBottom) {
      if (isNearBottom()) {
        setTimeout(() => scrollToBottom(), 50);
      }
      return;
    }

    const container = scrollContainerRef.current;
    const prevHeight = scrollPositionRef.current.height;
    const prevTop = scrollPositionRef.current.top;
    const newHeight = container.scrollHeight;
    const heightDiff = newHeight - prevHeight;

    if (heightDiff > 0 && prevTop > 0) {
      container.scrollTop = prevTop + heightDiff;
    }
  });

  return {
    scrollContainerRef,
    sentinelRef,
    scrollToBottom,
    scrollToBottomAndReset,
    isNearBottom,
    visibleMessageCount,
    setVisibleMessageCount,
  };
}
