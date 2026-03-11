# AI UI Patterns

## 一句话定义

构建 AI 驱动的用户界面模式。

## 为什么好

- **流式交互**：支持流式响应
- **状态管理**：管理 AI 会话状态
- **多模态**：支持文本、语音、图像

## 函数式实现

```typescript
// 流式响应 Hook
function useAIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (content: string) => {
    setMessages((prev) => [...prev, { role: "user", content }]);
    setIsLoading(true);

    const response = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages: [...messages, { role: "user", content }] }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      // 流式更新
    }
    setIsLoading(false);
  };

  return { messages, sendMessage, isLoading };
}
```

## 参考

- [patterns.dev - AI UI Patterns](https://www.patterns.dev/react/ai-ui-patterns)
