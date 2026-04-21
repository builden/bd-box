# 测试规范

本规范适用于所有有用户交互的项目，根据项目类型选择测试工具。

## 目录

- [测试分层策略](#测试分层策略)
- [测试分类](#测试分类)
- [目录结构](#目录结构)
- [基础配置](#基础配置)
- [组件测试](#组件测试)（Happy DOM + React Testing Library）
- [开发阶段工具](#开发阶段工具)
- [运行时机](#运行时机)
- [覆盖率要求](#覆盖率要求)

---

## 测试分层策略

### 测试金字塔

```
           ┌─────────────────────┐
           │      Playwright      │  2% 复杂交互（拖拽、动画、多浏览器）
           │    (tests/e2e/)     │
           ├─────────────────────┤
           │     Lightpanda       │  8% 非拖拽复杂交互（可选）
           │   (tests/light/)    │
           ├─────────────────────┤
           │    Happy DOM +       │  90% 组件/函数测试
           │   Testing Library    │
           └─────────────────────┘
```

### 工具选择

| 工具             | 使用场景                   | 速度          | 限制             |
| ---------------- | -------------------------- | ------------- | ---------------- |
| **Happy DOM**    | 渲染、props 响应、状态变化 | ⚡⚡⚡ ~200ms | 无真实浏览器 API |
| **cmux browser** | CSS、布局、快速视觉验证    | ⚡⚡⚡ 即时   | 仅限 cmux 环境   |
| **Lightpanda**   | 复杂交互但非拖拽           | ⚡⚡ ~5s      | Web API 仍在完善 |
| **Playwright**   | 拖拽、动画、多浏览器验证   | ⚡ ~20s       | 启动慢           |

### 开发流程

```
写代码 → Happy DOM 单元测试 → cmux 快速验证 → 提交
       │                              │
       └→ bun test 通过 → E2E 测试 → push
                      │
                      └→ 问题？→ 按需选择调试工具
```

---

## 测试分类

| 类型     | 工具       | 文件后缀        | 说明                     |
| -------- | ---------- | --------------- | ------------------------ |
| 单元测试 | bun test   | `.test.ts`      | 源码同级，快速，量大     |
| API 测试 | bun test   | `.api.ts`       | `tests/api/`，依赖服务器 |
| 集成测试 | bun test   | `.spec.ts`      | `tests/integration/`     |
| 冒烟测试 | Playwright | `.smoke.e2e.ts` | 核心用户流程，带 UI      |
| 性能测试 | Mitata     | `.bench.ts`     | `tests/bench/`           |
| E2E 测试 | Playwright | `.e2e.ts`       | 浏览器端到端             |

### 优先级

**单元测试 > 集成测试 > E2E 测试**

- 能用集成测试解决就不用 E2E 测试
- E2E 测试开销大，只测关键路径

### 真实场景覆盖

❌ **错误**：测试简化场景就认为功能正常

```typescript
// ❌ 只测试 plain shell
it('should connect to terminal', () => {
  ws.send({ type: 'init', isPlainShell: true });
});

// ✅ 测试真实 CLI 交互
it('should connect to Claude CLI', () => {
  ws.send({ type: 'init', provider: 'claude', isPlainShell: false });
});
```

### 禁止服务器依赖

单元测试和集成测试**禁止**依赖外部服务器（HTTP、WebSocket、子进程等）。

```typescript
// ❌ 错误：依赖外部服务
it('should fetch user', async () => {
  const user = await fetchUser(1); // 外部服务
});

// ✅ 正确：使用 mock
it('should fetch user', async () => {
  const mockFetch = vi.fn().mockResolvedValue({ id: 1, name: 'John' });
  const user = await fetchUser(1, mockFetch);
});
```

| 问题       | 影响                |
| ---------- | ------------------- |
| 测试运行慢 | 等待服务器启动/连接 |
| 测试不稳定 | 网络波动导致误报    |
| 并行困难   | 服务器状态难以隔离  |

---

## 目录结构

```
src/
  utils.ts
  utils.test.ts      # 单元测试（源码同级）

tests/
  unit/              # Happy DOM 组件测试
    components/      # 复杂组件多场景测试
    hooks/           # Hook 测试
  api/               # API 测试（依赖服务器）
    *.api.ts
  integration/       # 集成测试
    *.spec.ts
  light/             # Lightpanda 测试（可选）
    *.light.ts
  e2e/               # Playwright 测试
    *.e2e.ts         # 普通 E2E 测试
    *.smoke.e2e.ts   # 冒烟测试
  bench/             # 性能测试
    *.bench.ts
  happydom.ts        # Happy DOM 预加载
  testing-library.ts # Testing Library 预加载
  playwright.config.ts
```

**单元测试位置**：

| 位置                | 适用场景             |
| ------------------- | -------------------- |
| 源码同级 `.test.ts` | 简单组件、函数、工具 |
| `tests/unit/`       | 复杂组件的多场景测试 |

**约束**：E2E 测试禁止使用 `.test.ts` 后缀，会被 bun test 误识别。

---

## 基础配置

### bunfig.toml

```toml
[test]
preload = ["./tests/happydom.ts", "./tests/testing-library.ts"]
```

### package.json

```json
{
  "scripts": {
    "test": "bun test",
    "test:e2e": "playwright test tests/e2e/",
    "test:e2e:ui": "playwright test tests/e2e/ --ui",
    "test:smoke": "playwright test tests/e2e/ --test-match \"*.smoke.e2e.ts\" --ui"
  }
}
```

### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['**/*.e2e.ts'],
  reporter: [['html', { outputFolder: 'tests/test-results/playwright-report' }]],
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

### 测试导入

```typescript
import { describe, it, expect, beforeEach, mock } from 'bun:test';

// mock 模块
mock.module('mermaid', () => ({
  default: { ... }
}));

// 超时配置
test('slow test', async () => {
  await someSlowOperation();
}, 30000);
```

---

## 组件测试

### Happy DOM + React Testing Library

#### 依赖安装

```bash
# 先安装 Happy DOM
bun add -D @happy-dom/global-registrator

# 再安装 Testing Library
bun add -D @testing-library/react @testing-library/dom @testing-library/jest-dom
```

#### Preload 脚本

**tests/happydom.ts**：

```ts
import { GlobalRegistrator } from '@happy-dom/global-registrator';
GlobalRegistrator.register();
```

**tests/testing-library.ts**：

```ts
import { afterEach, expect } from 'bun:test';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
```

#### TypeScript 类型扩展

**test-types.d.ts**：

```ts
import { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';
import { Matchers, AsymmetricMatchers } from 'bun:test';

declare module 'bun:test' {
  interface Matchers<T> extends TestingLibraryMatchers<typeof expect.stringContaining, T> {}
  interface AsymmetricMatchers extends TestingLibraryMatchers {}
}
```

#### 测试示例

```tsx
// src/components/Button.test.tsx
/// <reference lib="dom" />

import { test, expect } from 'bun:test';
import { screen, render } from '@testing-library/react';
import { Button } from './Button';

test('renders button with correct text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByRole('button')).toHaveTextContent('Click me');
});

test('button is in the document', () => {
  render(<Button>Test</Button>);
  const button = screen.getByRole('button');
  expect(button).toBeInTheDocument();
});
```

使用 user-event：

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'bun:test';

describe('Button', () => {
  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
```

#### 常见问题

| 问题                          | 解决方案                                           |
| ----------------------------- | -------------------------------------------------- |
| "Cannot find name 'document'" | 添加 `/// <reference lib="dom" />`                 |
| 缺少 Testing Library matchers | 确保 `@testing-library/jest-dom` 在 preload 中导入 |
| React 组件渲染失败            | 检查 Happy DOM 和 Testing Library 配置             |

---

## 开发阶段工具

### cmux browser

内置 WKWebView 浏览器，适合快速视觉验证。

```bash
# 打开页面
cmux browser open http://localhost:5173

# 获取快照
cmux browser surface:2 snapshot --interactive

# 点击元素
cmux browser surface:2 click "#button-id"

# 填写表单
cmux browser surface:2 fill "#email" --text "test@example.com"

# 截图
cmux browser surface:2 screenshot
```

### Lightpanda

轻量级头戴浏览器，CDP 协议兼容，启动极快。

**安装**：

```bash
curl -L https://github.com/lightpanda-io/browser/releases/latest/download/lipanda-macos.tar.gz | tar xz
./lightpanda serve --port 9222
```

**Playwright 连接**：

```typescript
const browser = await chromium.connectOverCDP('http://localhost:9222');
```

详见 [lightpanda.md](lightpanda.md)。

---

## 运行时机

| 时机        | 必须通过的测试                         |
| ----------- | -------------------------------------- |
| commit 之前 | `bun test`（单元测试 + 集成测试）      |
| push 之前   | `bun run test:smoke`（带 UI 人工确认） |
| 提 PR 之前  | 全部测试（单元 + 集成 + E2E + 冒烟）   |

### 功能验证标准

| 功能     | 验证方式            | 成功标准                        |
| -------- | ------------------- | ------------------------------- |
| 服务启动 | HTTP 请求           | 返回 200                        |
| 认证状态 | API `/api/auth/`    | 返回 needsSetup/isAuthenticated |
| 项目列表 | API `/api/projects` | 返回数组                        |

---

## 覆盖率要求

- **整体覆盖率 ≥ 80%**
- **新增代码覆盖率 ≥ 90%**

```bash
bun test --coverage
```

---

## Playwright E2E 测试

详见 [playwright.md](playwright.md)。

## Lightpanda 轻量级测试

详见 [lightpanda.md](lightpanda.md)。

## 性能测试

详见 [performance.md](./performance.md)（Mitata）。
