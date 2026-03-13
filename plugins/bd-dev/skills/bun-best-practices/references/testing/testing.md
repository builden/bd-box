# 测试规范

本规范适用于所有有用户交互的项目，根据项目类型使用不同测试工具。

## 目录

- [测试分类](#测试分类)
- [测试优先级](#测试优先级)
- [覆盖率要求](#覆盖率要求)
- [目录结构](#目录结构)
- [运行命令](#运行命令)
- [基础配置](#基础配置)（bun test）
- [性能测试](./performance.md)（Mitata）
- [Playwright E2E](./playwright.md)

---

## 测试分类

| 类型     | 工具       | 文件后缀        | 说明                                           |
| -------- | ---------- | --------------- | ---------------------------------------------- |
| 单元测试 | bun test   | `.test.ts`      | 源码同级，快速，量大                           |
| API 测试 | bun test   | `.api.ts`       | `tests/api/`，API 端点验证                     |
| 集成测试 | bun test   | `.spec.ts`      | `tests/integration/`，业务逻辑                 |
| 冒烟测试 | Playwright | `.smoke.e2e.ts` | `tests/e2e/`，核心用户流程，带 UI 方便人工确认 |
| 性能测试 | Mitata     | `.bench.ts`     | `tests/bench/`，基准测试                       |
| E2E 测试 | Playwright | `.e2e.ts`       | `tests/e2e/`，浏览器端到端                     |

### 测试覆盖原则

**必须覆盖真实用户场景**，而不是简化版：

- ❌ 错误：测试 plain shell 模式就认为终端功能正常
- ✅ 正确：测试真正的 Claude CLI 交互模式

```typescript
// ❌ 不完整的测试
it("should connect to terminal", () => {
  ws.send({ type: "init", isPlainShell: true }); // 只测试了 plain shell
});

// ✅ 完整的测试
it("should connect to Claude CLI", () => {
  ws.send({ type: "init", provider: "claude", isPlainShell: false });
});
```

### 验证进程状态

集成测试应验证后台进程是否真正运行：

```typescript
// ✅ 验证 PTY 进程是否启动
it("should keep PTY process alive", async () => {
  const before = countProcesses("spawn-helper");
  await connectToTerminal();
  await waitForOutput("Starting new Claude session");
  const after = countProcesses("spawn-helper");
  expect(after).toBeGreaterThan(before);
});
```

## 测试优先级

**测试金字塔**：单元测试 > 集成测试 > E2E 测试

- 能用集成测试解决的就不要用 E2E 测试
- E2E 测试开销大、耗时长，只测关键路径
- 单元测试最快、最多，覆盖基础逻辑

---

## 覆盖率要求

- **整体覆盖率 ≥ 80%**
- **新增代码覆盖率 ≥ 90%**
- 使用行覆盖率（line coverage），bun test 内置支持

```bash
# 运行测试并生成覆盖率报告
bun test --coverage
```

---

## 目录结构

```
src/
  utils.ts
  utils.test.ts      # 单元测试（源码同级）

tests/
  api/               # API 端点测试
    *.api.ts
  integration/       # 集成测试
    *.spec.ts
  e2e/               # Playwright 测试（E2E + 冒烟）
    *.e2e.ts         # 普通 E2E 测试
    *.smoke.e2e.ts   # 冒烟测试（带 UI，方便人工确认）
  bench/             # 性能测试
    *.bench.ts
  setup.ts           # 测试全局配置
  test-results/      # Playwright 输出目录（已加入 .gitignore）
  playwright.config.ts
```

**重要约束**：

- E2E 测试**禁止使用 `.test.ts` 后缀**，否则会被 bun test 误识别导致冲突
- 冒烟测试使用 `.smoke.e2e.ts` 后缀，与普通 E2E 测试放同一目录

---

## 运行命令

```bash
bun test              # 单元测试 + API 测试 + 集成测试
bun run test:e2e     # Playwright E2E 测试（无 UI，CI/CD 用）
bun run test:smoke   # 冒烟测试（带 UI，人工确认用）
bun run test:bench   # 性能测试（Mitata）
```

| 命令         | UI  | 用途                   |
| ------------ | --- | ---------------------- |
| `test:e2e`   | 无  | CI/CD、自动化流水线    |
| `test:smoke` | 有  | 本地提交前人工二次确认 |

### API 测试示例

```typescript
// tests/api/users.api.ts
import { describe, it, expect } from "bun:test";

describe("Users API", () => {
  it("GET /api/users should return user list", async () => {
    const response = await fetch("http://localhost:3000/api/users");
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it("POST /api/users should create user", async () => {
    const response = await fetch("http://localhost:3000/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test User" }),
    });
    expect(response.status).toBe(201);
  });
});
```

---

## 运行时机

| 时机        | 必须通过的测试                                   |
| ----------- | ------------------------------------------------ |
| commit 之前 | 单元测试 + 集成测试（`bun test`）                |
| push 之前   | 冒烟测试（`bun run test:smoke`，带 UI 人工确认） |
| 提 PR 之前  | 全部测试（单元 + 集成 + E2E + 冒烟）             |

### 功能正常验证标准

| 功能     | 验证方式               | 成功标准                        |
| -------- | ---------------------- | ------------------------------- |
| 服务启动 | HTTP 请求              | 返回 200                        |
| 认证状态 | API `/api/auth/status` | 返回 needsSetup/isAuthenticated |
| 项目列表 | API `/api/projects`    | 返回数组                        |
| 终端连接 | WebSocket `/ws`        | 连接成功，接收消息              |

### 说明

- **commit 前**：运行 `bun test`，确保单元测试和集成测试通过
- **push 前**：运行 `bun run test:smoke`，确保核心功能可用
- **提 PR 前**：运行全部测试，确保不影响主线
- **API 测试**：依赖后端服务，使用独立命令 `bun run test:api`

---

## 基础配置

### bunfig.toml

```toml
# bunfig.toml
[test]
preload = ["./tests/setup.ts"]
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
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: ["**/*.e2e.ts"], // 匹配所有 .e2e.ts 和 .smoke.e2e.ts
  reporter: [["html", { outputFolder: "tests/test-results/playwright-report" }]],
  use: {
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
```

### setup.ts

```typescript
// tests/setup.ts
import { GlobalRegistrator } from "@happy-dom/global-registrator";
GlobalRegistrator.register();
```

### 依赖安装

```json
{
  "devDependencies": {
    "happy-dom": "^16.7.2",
    "@happy-dom/global-registrator": "^16.7.2"
  }
}
```

### 测试导入

```typescript
import { describe, it, expect, beforeEach, mock } from 'bun:test';

// mock 模块
mock.module('mermaid', () => ({
  default: { ... }
}));
```

### 超时配置

```typescript
test("slow test", async () => {
  await someSlowOperation();
}, 30000); // 30 seconds
```

---

## Playwright E2E 测试

详见 [playwright.md](playwright.md)。
