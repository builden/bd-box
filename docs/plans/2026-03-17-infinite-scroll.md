# 聊天消息无限滚动优化

> **For Claude:** REQUIRED SUB-SKILL: Use builden-dev:executing-plans to implement this plan task-by-task.

**目标：** 优化聊天消息的向上滚动加载体验，使用 Intersection Observer 实现无感知无限滚动

**架构：** 使用 React + Intersection Observer API，替换当前的 scroll 事件监听，实现流畅的无限滚动体验

**技术栈：** React Hooks, Intersection Observer API

---

## 任务 0：修复默认加载数量（从 20 条改为 100 条）

**文件：**

- 修改：`packages/bd-cc/src/features/chat/biz/constants.ts`

**步骤 1：修改 MESSAGES_PER_PAGE**

运行：`cat packages/bd-cc/src/features/chat/biz/constants.ts`

将 `MESSAGES_PER_PAGE = 20` 改为 `MESSAGES_PER_PAGE = 100`：

```typescript
/** Number of messages to load per page when paginating */
export const MESSAGES_PER_PAGE = 100;
```

**步骤 2：验证**

运行：`grep -n "MESSAGES_PER_PAGE" packages/bd-cc/src/features/chat/biz/constants.ts`
预期输出包含 `= 100`

---

## 任务 1：重构 useScrollManager 使用 Intersection Observer

**文件：**

- 修改：`packages/bd-cc/src/features/chat/hooks/useScrollManager.ts`

**步骤 1：读取并分析现有代码**

运行：`cat packages/bd-cc/src/features/chat/hooks/useScrollManager.ts`

分析需要保留和删除的代码部分。

**步骤 2：重写 useScrollManager 核心逻辑**

```typescript
import { useCallback, useEffect, useRef, useState } from 'react';

const INITIAL_VISIBLE_MESSAGES = 50;

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
  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const pendingScrollRestoreRef = useRef<{ height: number; top: number } | null>(null);
  const scrollPositionRef = useRef({ height: 0, top: 0 });
  const [visibleMessageCount, setVisibleMessageCount] = useState(INITIAL_VISIBLE_MESSAGES);

  const isNearBottom = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return false;
    const { scrollTop, scrollHeight, clientHeight } = container;
    return scrollHeight - scrollTop - clientHeight < 50;
  }, []);

  const scrollToBottom = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, []);

  const scrollToBottomAndReset = useCallback(() => {
    scrollToBottom();
    setVisibleMessageCount(INITIAL_VISIBLE_MESSAGES);
  }, [scrollToBottom]);

  // Intersection Observer 实现无限滚动
  useEffect(() => {
    if (!sentinelRef.current || !scrollContainerRef.current) return;

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
    if (!pendingScrollRestoreRef.current || !scrollContainerRef.current) return;

    const { height, top } = pendingScrollRestoreRef.current;
    const container = scrollContainerRef.current;
    const newScrollHeight = container.scrollHeight;
    const scrollDiff = newScrollHeight - height;
    container.scrollTop = top + Math.max(scrollDiff, 0);
    pendingScrollRestoreRef.current = null;
  });

  // 自动滚动
  useEffect(() => {
    if (!scrollContainerRef.current) return;

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
```

**步骤 3：运行类型检查**

运行：`cd packages/bd-cc && bun run typecheck`
预期：无类型错误

**步骤 4：测试验证**

运行：`bun run dev`

- 打开聊天页面
- 向上滚动消息
- 验证距离顶部 500px 时开始加载

---

## 任务 2：更新 ChatMessagesPane 集成 sentinel

**文件：**

- 修改：`packages/bd-cc/src/features/chat/ui/composites/ChatMessagesPane.tsx`

**步骤 1：更新 Props 类型**

在 ChatMessagesPaneProps 中添加 sentinelRef：

```typescript
interface ChatMessagesPaneProps {
  // ... 现有字段
  sentinelRef: React.RefObject<HTMLDivElement | null>; // 新增
  // ... 其他字段
}
```

**步骤 2：更新组件参数解构**

```typescript
export default function ChatMessagesPane({
  // ... 现有字段
  sentinelRef, // 新增
  // ... 其他字段
}: ChatMessagesPaneProps) {
```

**步骤 3：在消息列表顶部添加 sentinel 元素**

找到消息列表渲染位置，添加 sentinel ref：

```tsx
{
  /* 消息列表 - sentinel 用于触发无限滚动 */
}
<div ref={sentinelRef}>
  {visibleMessages.map((message, index) => {
    // ... 现有逻辑
  })}
</div>;
```

**步骤 4：移除旧的加载指示器**

删除以下代码：

- 旧的 "Loading older messages" spinner（第 169-176 行）
- "scrollToLoad" 提示（第 179-188 行）
- 旧的前端分页提示（第 230-245 行）

**步骤 5：添加新的顶部状态提示**

```tsx
{
  /* 到达顶部的提示 */
}
{
  allMessagesLoaded && (
    <div className="border-b border-gray-200 py-2 text-center text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
      {t('session.messages.allLoaded', { total: totalMessages })}
    </div>
  );
}
```

**步骤 6：验证**

运行：`bun run dev`

- 向上滚动验证 sentinel 触发加载
- 验证无感知加载体验

---

## 任务 3：更新 ChatInterface 连接 sentinelRef

**文件：**

- 修改：`packages/bd-cc/src/features/chat/ui/pages/ChatInterface.tsx`

**步骤 1：读取 ChatInterface.tsx**

运行：`cat packages/bd-cc/src/features/chat/ui/pages/ChatInterface.tsx`

找到 useScrollManager 的调用位置。

**步骤 2：传递 sentinelRef 到 ChatMessagesPane**

从 useScrollManager 解构 sentinelRef：

```typescript
const {
  scrollContainerRef,
  sentinelRef, // 新增
  scrollToBottom,
  // ... 其他
} = useScrollManager({...});
```

传递给 ChatMessagesPane：

```tsx
<ChatMessagesPane
  // ... 其他 props
  sentinelRef={sentinelRef}
  // ... 其他 props
/>
```

**步骤 3：验证**

运行：`bun run dev`

- 验证 sentinelRef 正确传递
- 验证滚动加载功能正常

---

## 任务 4：更新 i18n 翻译

**文件：**

- 修改：`packages/bd-cc/src/i18n/locales/zh-CN/chat.json`

**步骤 1：更新翻译文本**

```json
{
  "session": {
    "messages": {
      "allLoaded": "已加载全部消息，共 {{total}} 条"
    }
  }
}
```

---

## 任务 5：运行完整测试并提交

**步骤 1：运行完整测试**

```bash
cd packages/bd-cc && bun run typecheck
```

**步骤 2：提交**

```bash
git add packages/bd-cc/src/features/chat/biz/constants.ts
git add packages/bd-cc/src/features/chat/hooks/useScrollManager.ts
git add packages/bd-cc/src/features/chat/ui/composites/ChatMessagesPane.tsx
git add packages/bd-cc/src/features/chat/ui/pages/ChatInterface.tsx
git add packages/bd-cc/src/i18n/locales/zh-CN/chat.json
git commit -m "feat(chat): optimize message scroll with Intersection Observer

- Use Intersection Observer with 500px rootMargin for preloading
- Implement seamless infinite scroll experience
- Show 'all loaded' indicator when reaching top
- Increase MESSAGES_PER_PAGE from 20 to 100"
```
