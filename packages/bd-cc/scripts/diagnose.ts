#!/usr/bin/env bun
/**
 * 诊断脚本 - 快速定位问题
 *
 * 用法: bun scripts/diagnose.ts
 */

import { spawn } from 'child_process';
import { readFile } from 'fs/promises';
import { join } from 'path';

const CHECKS = [
  {
    name: '服务端口 3001',
    check: async () => {
      const output = await new Response(Bun.spawn(['lsof', '-i', ':3001']).stdout).text();
      return output.includes('LISTEN');
    },
  },
  {
    name: '服务端口 5173 (Vite)',
    check: async () => {
      const output = await new Response(Bun.spawn(['lsof', '-i', ':5173']).stdout).text();
      return output.includes('LISTEN');
    },
  },
  {
    name: 'WebSocket 连接',
    check: async () => {
      return new Promise((resolve) => {
        const ws = new WebSocket('ws://localhost:3001/shell');
        ws.onopen = () => {
          ws.close();
          resolve(true);
        };
        ws.onerror = () => resolve(false);
        ws.onclose = () => resolve(false);
        setTimeout(() => resolve(false), 5000);
      });
    },
  },
  {
    name: 'API 健康检查',
    check: async () => {
      try {
        const res = await fetch('http://localhost:3001/api/auth/status');
        return res.ok;
      } catch {
        return false;
      }
    },
  },
  {
    name: '前端配置',
    check: async () => {
      try {
        const content = await readFile(join(import.meta.dir, '../src/constants/config.ts'), 'utf8');
        return content.includes('IS_PLATFORM');
      } catch {
        return false;
      }
    },
  },
];

async function run() {
  console.log('=== 系统诊断 ===\n');

  let passed = 0;
  let failed = 0;

  for (const check of CHECKS) {
    process.stdout.write(`[${' '.repeat(20)}] ${check.name}... `);

    try {
      const result = await check.check();
      if (result) {
        console.log('✓');
        passed++;
      } else {
        console.log('✗');
        failed++;
      }
    } catch (e) {
      console.log('✗ (错误)');
      failed++;
    }
  }

  console.log(`\n通过: ${passed}/${CHECKS.length}`);
  console.log(`失败: ${failed}/${CHECKS.length}`);

  if (failed > 0) {
    console.log('\n常见问题:');
    console.log('1. 服务未启动: bun run server');
    console.log('2. 前端未启动: bun run client');
    console.log('3. 端口被占用: lsof -i :3001');

    // 自动检查并修复
    console.log('\n尝试自动修复...');

    // 检查服务
    const portCheck = await new Response(Bun.spawn(['lsof', '-ti', ':3001']).stdout).text();

    if (!portCheck.trim()) {
      console.log('- 启动服务...');
      spawn('bun', ['run', 'server'], {
        cwd: join(import.meta.dir, '..'),
        stdout: 'inherit',
        stderr: 'inherit',
        detached: true,
      });
    }
  }

  process.exit(failed > 0 ? 1 : 0);
}

run();
