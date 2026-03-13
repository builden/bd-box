#!/usr/bin/env bun
// ============================================
// Bun WebSocket + Terminal 测试服务器
// ============================================

const PORT = 3009;
const DEFAULT_SHELL = 'zsh';

// PTY 配置
const PTY_OPTS = {
  cols: 80,
  rows: 30,
  name: 'xterm-256color',
};

// 日志前缀
const LOG_PREFIX = '[Bun]';

// 类型定义
interface ClientMessage {
  type: 'init' | 'input';
  cmd?: string;
  data?: string;
}

interface ServerMessage {
  type: 'output';
  data: string;
}

// 存储每个连接的进程，使用 any 避免复杂的 Bun 类型
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const processes = new WeakMap<any, Bun.Subprocess>();

// 工具函数：创建清理后的环境变量
function createEnv(): Record<string, string> {
  const env = { ...Bun.env } as Record<string, string>;
  delete env.CLAUDECODE;
  return { ...env, TERM: PTY_OPTS.name };
}

// 工具函数：发送消息到客户端
function sendOutput(ws: unknown, data: string): void {
  const msg: ServerMessage = { type: 'output', data };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (ws as any).send(JSON.stringify(msg));
}

// 工具函数：启动 PTY 进程
function spawnProcess(ws: unknown, cmd: string = DEFAULT_SHELL): Bun.Subprocess {
  const env = createEnv();
  const proc = Bun.spawn([cmd], {
    terminal: {
      ...PTY_OPTS,
      data(_t: unknown, data: Uint8Array) {
        sendOutput(ws, new TextDecoder().decode(data));
      },
    },
    cwd: Bun.env.HOME,
    env,
  });

  console.log(`${LOG_PREFIX} Spawned ${cmd} (PID: ${proc.pid})`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  processes.set(ws as any, proc);
  return proc;
}

// 工具函数：处理客户端消息
function handleMessage(ws: unknown, message: Buffer | string): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proc = processes.get(ws as any);
  const data = JSON.parse(message.toString()) as ClientMessage;

  console.log(`${LOG_PREFIX} Received:`, data.type, proc ? `(PID: ${proc.pid})` : '');

  switch (data.type) {
    case 'init': {
      const cmd = data.cmd || DEFAULT_SHELL;

      // 杀掉旧进程并启动新的
      if (proc) proc.kill();
      spawnProcess(ws, cmd);
      break;
    }

    case 'input':
      if (proc?.terminal) {
        proc.terminal.write(data.data);
      }
      break;

    default:
      console.log(`${LOG_PREFIX} Unknown message type:`, (data as ClientMessage).type);
  }
}

// 工具函数：处理客户端断开
function handleClose(ws: unknown): void {
  console.log(`${LOG_PREFIX} Client disconnected`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proc = processes.get(ws as any);
  if (proc) {
    proc.kill();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    processes.delete(ws as any);
  }
}

// HTTP 服务器：处理静态文件
function handleRequest(req: Request): Response {
  const url = new URL(req.url);
  const routes: Record<string, string> = {
    '/': './test-bun.html',
    '/test-all.html': './test-all.html',
  };

  const filePath = routes[url.pathname];
  if (filePath) {
    return new Response(Bun.file(filePath), {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  return new Response('Not Found', { status: 404 });
}

// 启动服务器
console.log(`${LOG_PREFIX} Starting on port ${PORT}`);

const server = Bun.serve({
  port: PORT,
  fetch(req, server) {
    const url = new URL(req.url);
    if (url.pathname === '/ws') {
      const success = server.upgrade(req);
      if (success) return undefined;
      return new Response('Upgrade failed', { status: 400 });
    }
    return handleRequest(req);
  },
  websocket: {
    open(ws) {
      console.log(`${LOG_PREFIX} Client connected`);
      spawnProcess(ws, DEFAULT_SHELL);
    },
    message(ws, message) {
      handleMessage(ws, message);
    },
    close(ws) {
      handleClose(ws);
    },
  },
});

console.log(`${LOG_PREFIX} Ready at http://localhost:${server.port}`);
