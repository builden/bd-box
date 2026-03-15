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
  scrollToBottom: () => void;
  scrollToBottomAndReset: () => void;
  isNearBottom: () => boolean;
  handleScroll: () => void;
  visibleMessageCount: number;
  setVisibleMessageCount: React.Dispatch<React.SetStateAction<number>>;
  loadEarlierMessages: () => void;
}

export function useScrollManager({
  autoScrollToBottom = true,
  onLoadMore,
  hasMoreMessages = false,
}: UseScrollManagerOptions = {}): UseScrollManagerResult {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isLoadingMoreRef = useRef(false);
  const topLoadLockRef = useRef(false);
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

  const handleScroll = useCallback(async () => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    const nearBottom = isNearBottom();

    if (!hasMoreMessages) {
      return;
    }

    const scrolledNearTop = container.scrollTop < 100;
    if (!scrolledNearTop) {
      topLoadLockRef.current = false;
      return;
    }

    if (topLoadLockRef.current) {
      if (container.scrollTop > 20) {
        topLoadLockRef.current = false;
      }
      return;
    }

    if (onLoadMore && !isLoadingMoreRef.current) {
      isLoadingMoreRef.current = true;
      const didLoad = await onLoadMore();
      if (didLoad) {
        topLoadLockRef.current = true;
      }
      isLoadingMoreRef.current = false;
    }
  }, [isNearBottom, hasMoreMessages, onLoadMore]);

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

  // 滚动监听
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const loadEarlierMessages = useCallback(() => {
    setVisibleMessageCount((previousCount) => previousCount + 100);
  }, []);

  return {
    scrollContainerRef,
    scrollToBottom,
    scrollToBottomAndReset,
    isNearBottom,
    handleScroll,
    visibleMessageCount,
    setVisibleMessageCount,
    loadEarlierMessages,
  };
}
