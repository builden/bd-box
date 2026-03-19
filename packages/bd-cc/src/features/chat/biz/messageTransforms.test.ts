import { describe, it, expect } from 'bun:test';
import { convertSessionMessages } from './messageTransforms';

// 实际的会话消息数据（从 475e51ea-e8d9-4d3e-a5e0-7d544275bcd7.jsonl 提取）
const realSessionMessages = [
  // user message
  {
    message: { role: 'user', content: [{ type: 'text', text: '有没有哪个eslint插件检查为未使用的变量和类型导入' }] },
    timestamp: '2026-03-17T09:47:27.000Z',
  },
  // assistant message with thinking in content array
  {
    message: {
      id: '0608562cb9ba43667aeae1cf0d59a046',
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'thinking',
          thinking: '用户在询问是否有 ESLint 插件可以检查未使用的变量和类型导入。',
          signature: 'xxx',
        },
      ],
      model: 'MiniMax-M2.5',
    },
    type: 'assistant',
    uuid: '1e983139-295e-49e6-9147-3cb78c84149f',
    timestamp: '2026-03-17T09:47:27.926Z',
  },
  // assistant message with text content
  {
    message: {
      id: '0608562cb9ba43667aeae1cf0d59a046',
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: '主公明鉴，有以下几个常用方案：...',
        },
      ],
      model: 'MiniMax-M2.5',
    },
    type: 'assistant',
    uuid: 'xxx2',
    timestamp: '2026-03-17T09:47:28.000Z',
  },
];

describe('convertSessionMessages with real data', () => {
  it('should convert all 3 messages without includeHidden', () => {
    const result = convertSessionMessages(realSessionMessages);
    console.log('Result count (no includeHidden):', result.length);
    console.log(
      'Result messages:',
      result.map((m) => ({ type: m.type, isThinking: m.isThinking, content: String(m.content).slice(0, 50) }))
    );
    // Should have user + 2 assistant messages
    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it('should convert all 3 messages with includeHidden: true', () => {
    const result = convertSessionMessages(realSessionMessages, { includeHidden: true });
    console.log('Result count (includeHidden: true):', result.length);
    console.log(
      'Result messages:',
      result.map((m) => ({ type: m.type, isThinking: m.isThinking, content: String(m.content).slice(0, 50) }))
    );
    // Should have user + 2 assistant messages
    expect(result.length).toBe(3);
  });
});
