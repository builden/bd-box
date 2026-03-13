# Bun 运行时技巧

## PTY (终端)

Bun 内置支持 PTY，通过 `Bun.spawn` 的 `terminal` 选项实现。

### 基本用法

```typescript
const proc = Bun.spawn(['zsh'], {
  terminal: {
    cols: 80,
    rows: 30,
    data(t, data) {
      // data 是 Uint8Array，需要解码
      const output = new TextDecoder().decode(data);
      console.log(output);
    },
  },
  cwd: Bun.env.HOME,
  env: { ...env, TERM: 'xterm-256color' },
});

// 写入输入
proc.terminal.write('hello\n');
```

### 注意事项

1. **删除敏感环境变量**：启动 Claude 等命令时，删除 `CLAUDECODE` 等环境变量避免嵌套
2. **使用 `WeakMap` 存储进程**：每个 WebSocket 连接对应一个进程
3. **进程清理**：客户端断开时调用 `proc.kill()` 清理进程

### 类型定义

```typescript
const processes = new WeakMap<unknown, Bun.Subprocess>();

// 写入数据
proc.terminal.write(data.data);

// 解码输出
new TextDecoder().decode(data);
```

## WebSocket

Bun 内置 WebSocket 支持，通过 `Bun.serve` 的 `websocket` 选项配置。

### 服务器基本结构

```typescript
const server = Bun.serve({
  port: 3009,
  fetch(req, server) {
    const url = new URL(req.url);
    if (url.pathname === '/ws') {
      const success = server.upgrade(req);
      if (success) return undefined;
      return new Response('Upgrade failed', { status: 400 });
    }
    return new Response('Not Found', { status: 404 });
  },
  websocket: {
    open(ws) {
      // 客户端连接
    },
    message(ws, message) {
      // 收到消息
      // message 是 Buffer | string，需要自行解析
      const data = JSON.parse(message.toString());
    },
    close(ws) {
      // 客户端断开
    },
  },
});
```

### 重要区别

**错误写法**（不会触发）：

```typescript
ws.onmessage = (event) => { ... }; // ❌ 无效
```

**正确写法**：

```typescript
websocket: {
  message(ws, message) { ... }, // ✅ 在配置对象中定义
}
```

### 消息类型

```typescript
// 客户端发送
interface ClientMessage {
  type: 'init' | 'input';
  cmd?: string; // init 时指定命令
  data?: string; // input 时传输的数据
}

// 服务端发送
interface ServerMessage {
  type: 'output';
  data: string;
}
```

## 完整示例：WebSocket + PTY

```typescript
const processes = new WeakMap<unknown, Bun.Subprocess>();

const server = Bun.serve({
  port: 3009,
  fetch(req, server) {
    const url = new URL(req.url);
    if (url.pathname === '/ws') {
      const success = server.upgrade(req);
      return success ? undefined : new Response('Upgrade failed', { status: 400 });
    }
    return new Response('Not Found', { status: 404 });
  },
  websocket: {
    open(ws) {
      const proc = Bun.spawn(['zsh'], {
        terminal: {
          cols: 80,
          rows: 30,
          data(_t, data) {
            const msg = { type: 'output', data: new TextDecoder().decode(data) };
            ws.send(JSON.stringify(msg));
          },
        },
        cwd: Bun.env.HOME,
        env: { TERM: 'xterm-256color' },
      });
      processes.set(ws, proc);
    },
    message(ws, message) {
      const proc = processes.get(ws);
      const data = JSON.parse(message.toString());

      if (data.type === 'init') {
        if (proc) proc.kill();
        const newProc = Bun.spawn([data.cmd], {
          /* ... */
        });
        processes.set(ws, newProc);
      } else if (data.type === 'input') {
        proc?.terminal.write(data.data);
      }
    },
    close(ws) {
      const proc = processes.get(ws);
      if (proc) proc.kill();
      processes.delete(ws);
    },
  },
});
```

## 常见问题

| 问题                  | 解决方案                                           |
| --------------------- | -------------------------------------------------- |
| `ws.onmessage` 不触发 | 使用 `websocket: { message(ws, msg) {} }` 配置方式 |
| PTY 输出乱码          | 使用 `new TextDecoder().decode(data)` 解码         |
| 嵌套 Claude           | 删除 `CLAUDECODE` 环境变量                         |
| 进程未清理            | 在 `close` 回调中调用 `proc.kill()`                |
