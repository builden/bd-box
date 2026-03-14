#!/usr/bin/env bun
/**
 * 终端连接验证脚本
 *
 * 用法: bun scripts/test-shell.ts
 *
 * 验证:
 * 1. 服务是否在端口 3001 运行
 * 2. WebSocket 连接是否正常
 * 3. 终端初始化是否成功
 */

const WS_URL = 'ws://localhost:3001/shell';

async function checkPort() {
  const process = Bun.spawn(['lsof', '-i', ':3001']);
  const output = await new Response(process.stdout).text();

  if (!output.includes('LISTEN')) {
    console.error('✗ 服务未在端口 3001 运行');
    console.log('  运行: bun run server');
    return false;
  }

  const pid = output.split('\n')[1]?.split(/\s+/)[2];
  console.log(`✓ 服务运行中 (PID: ${pid})`);
  return true;
}

async function testWebSocket() {
  return new Promise((resolve) => {
    const ws = new WebSocket(WS_URL);

    const timeout = setTimeout(() => {
      console.error('✗ WebSocket 连接超时');
      ws.close();
      resolve(false);
    }, 10000);

    ws.onopen = () => {
      console.log('✓ WebSocket 已连接');

      ws.send(
        JSON.stringify({
          type: 'init',
          projectPath: '/tmp',
          sessionId: null,
          hasSession: false,
          provider: 'plain-shell',
          cols: 80,
          rows: 24,
          isPlainShell: true,
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'output' && msg.data?.includes('Starting')) {
          console.log('✓ 终端初始化成功');
          clearTimeout(timeout);
          ws.close();
          resolve(true);
        }
      } catch (e) {
        // ignore parse errors
      }
    };

    ws.onerror = (e) => {
      console.error('✗ WebSocket 错误');
      clearTimeout(timeout);
      resolve(false);
    };
  });
}

async function main() {
  console.log('=== 终端连接验证 ===\n');

  const portOk = await checkPort();
  if (!portOk) {
    process.exit(1);
  }

  console.log('');
  const wsOk = await testWebSocket();

  console.log('');
  if (wsOk) {
    console.log('=== 验证通过 ===');
    process.exit(0);
  } else {
    console.log('=== 验证失败 ===');
    process.exit(1);
  }
}

main();
