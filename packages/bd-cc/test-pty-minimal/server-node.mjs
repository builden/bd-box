#!/usr/bin/env node
// ============================================
// Node.js WebSocket + Terminal 测试服务器
// ============================================

import http from 'http';
import { WebSocketServer } from 'ws';
import pty from 'node-pty';
import os from 'os';
import fs from 'fs';

const PORT = 3008;
const DEFAULT_SHELL = 'zsh';

// PTY 配置
const PTY_OPTS = {
  cols: 80,
  rows: 30,
  name: 'xterm-256color',
};

// 日志前缀
const LOG_PREFIX = '[Node]';

// 存储每个连接的进程
const processes = new Map();

// 工具函数：创建清理后的环境变量
function createEnv() {
  const env = { ...process.env };
  delete env.CLAUDECODE;
  return { ...env, TERM: PTY_OPTS.name };
}

// 工具函数：发送消息到客户端
function sendOutput(ws, data) {
  ws.send(JSON.stringify({ type: 'output', data }));
}

// 工具函数：启动 PTY 进程
function spawnProcess(ws, cmd = DEFAULT_SHELL) {
  const env = createEnv();
  const proc = pty.spawn(cmd, [], {
    ...PTY_OPTS,
    cwd: os.homedir(),
    env,
  });

  console.log(`${LOG_PREFIX} Spawned ${cmd} (PID: ${proc.pid})`);
  processes.set(ws, proc);

  // 绑定事件
  proc.onData((data) => sendOutput(ws, data));
  proc.onExit(({ exitCode }) => {
    sendOutput(ws, `\r\n[Exit: ${exitCode}]\r\n`);
  });

  return proc;
}

// 工具函数：处理客户端消息
function handleMessage(ws, data) {
  const proc = processes.get(ws);
  console.log(`${LOG_PREFIX} Received:`, data.type, proc ? `(PID: ${proc.pid})` : '');

  switch (data.type) {
    case 'init': {
      const cmd = data.cmd || DEFAULT_SHELL;

      // 检查当前进程是否已经是需要的命令
      if (proc) {
        try {
          if (proc.process === cmd) {
            console.log(`${LOG_PREFIX} Already running: ${cmd}`);
            return;
          }
        } catch (e) {
          // 忽略错误
        }
      }

      // 杀掉旧进程并启动新的
      if (proc) proc.kill();
      spawnProcess(ws, cmd);
      break;
    }

    case 'input':
      if (proc) {
        proc.write(data.data);
      }
      break;

    default:
      console.log(`${LOG_PREFIX} Unknown message type:`, data.type);
  }
}

// 工具函数：处理客户端断开
function handleClose(ws) {
  console.log(`${LOG_PREFIX} Client disconnected`);
  const proc = processes.get(ws);
  if (proc) {
    proc.kill();
    processes.delete(ws);
  }
}

// HTTP 服务器：处理静态文件
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const routes = {
    '/': './test-node.html',
  };

  const filePath = routes[url.pathname];
  if (filePath) {
    const html = fs.readFileSync(filePath, 'utf-8');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// WebSocket 服务器
const wss = new WebSocketServer({ server });

console.log(`${LOG_PREFIX} Starting on port ${PORT}`);

wss.on('connection', (ws) => {
  console.log(`${LOG_PREFIX} Client connected`);
  spawnProcess(ws, DEFAULT_SHELL);

  ws.on('message', (msg) => {
    const data = JSON.parse(msg);
    handleMessage(ws, data);
  });

  ws.on('close', () => handleClose(ws));
});

server.listen(PORT, () => {
  console.log(`${LOG_PREFIX} Ready at ws://localhost:${PORT}`);
});
