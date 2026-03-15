# bd-cc Server 架构重构实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use builden-dev:executing-plans to implement this plan task-by-task.

**目标：** 将 server/index.ts 从 1000+ 行重构为模块化架构，支持 AI Provider 扩展、可测试、配置集中

**架构：** 采用模块化 + 轻量 DI 架构，按功能拆分文件，抽象 Provider 接口，预留扩展能力

**技术栈：** TypeScript, Express, WebSocket, Bun PTY

---

## 阶段 1：基础设施搭建

### 任务 1.1：创建 app/config.ts - 配置集中管理

**文件：**

- 创建：`packages/bd-cc/server/app/config.ts`
- 创建：`packages/bd-cc/server/app/config.test.ts`

**步骤 1：编写失败的测试**

```typescript
// packages/bd-cc/server/app/config.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadConfig, type ServerConfig, type ProviderConfig } from './config';

describe('config', () => {
  it('should load default config', () => {
    const config = loadConfig();
    expect(config.server.port).toBe(3001);
    expect(config.server.host).toBe('0.0.0.0');
  });

  it('should allow environment override', () => {
    vi.stubEnv('PORT', '4000');
    const config = loadConfig();
    expect(config.server.port).toBe(4000);
    vi.unstubAllEnvs();
  });
});
```

**步骤 2：运行测试验证它失败**

运行：`cd packages/bd-cc && bun test server/app/config.test.ts`
预期：FAIL - config.ts 不存在

**步骤 3：编写最少实现**

```typescript
// packages/bd-cc/server/app/config.ts
import { PORT, HOST, DISPLAY_HOST } from '../constants/server';
import { PROVIDER_WATCH_PATHS, WATCHER_IGNORED_PATTERNS, WATCHER_DEBOUNCE_MS } from '../constants/providers';
import { PTY_SESSION_TIMEOUT, SHELL_URL_PARSE_BUFFER_LIMIT } from '../constants/terminal';
import { IS_PLATFORM } from '../env';

export interface ServerConfig {
  port: number;
  host: string;
  displayHost: string;
  env: 'development' | 'production';
  isPlatform: boolean;
}

export interface ProviderConfig {
  watchPaths: typeof PROVIDER_WATCH_PATHS;
  ignoredPatterns: typeof WATCHER_IGNORED_PATTERNS;
  debounceMs: number;
}

export interface TerminalConfig {
  sessionTimeout: number;
  urlParseBufferLimit: number;
}

export interface AppConfig {
  server: ServerConfig;
  provider: ProviderConfig;
  terminal: TerminalConfig;
}

export function loadConfig(): AppConfig {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    server: {
      port: parseInt(process.env.PORT, 10) || PORT,
      host: process.env.HOST || HOST,
      displayHost: process.env.DISPLAY_HOST || DISPLAY_HOST,
      env: isProduction ? 'production' : 'development',
      isPlatform: IS_PLATFORM,
    },
    provider: {
      watchPaths: PROVIDER_WATCH_PATHS,
      ignoredPatterns: WATCHER_IGNORED_PATTERNS,
      debounceMs: WATCHER_DEBOUNCE_MS,
    },
    terminal: {
      sessionTimeout: PTY_SESSION_TIMEOUT,
      urlParseBufferLimit: SHELL_URL_PARSE_BUFFER_LIMIT,
    },
  };
}
```

**步骤 4：运行测试验证它通过**

运行：`cd packages/bd-cc && bun test server/app/config.test.ts`
预期：PASS

**步骤 5：提交**

```bash
cd packages/bd-cc
git add server/app/config.ts server/app/config.test.ts
git commit -m "feat(server): add config集中管理"
```

---

### 任务 1.2：创建 app/container.ts - 轻量 DI 容器

**文件：**

- 创建：`packages/bd-cc/server/app/container.ts`
- 创建：`packages/bd-cc/server/app/container.test.ts`

**步骤 1：编写失败的测试**

```typescript
// packages/bd-cc/server/app/container.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Container, type ContainerModule } from './container';

describe('Container', () => {
  it('should register and resolve service', () => {
    const container = new Container();
    container.register('test', () => 'hello');
    expect(container.resolve('test')).toBe('hello');
  });

  it('should support singleton registration', () => {
    const container = new Container();
    let count = 0;
    container.register('counter', () => ++count, { singleton: true });
    container.resolve('counter');
    container.resolve('counter');
    expect(container.resolve('counter')).toBe(1);
  });

  it('should register instance directly', () => {
    const container = new Container();
    container.registerInstance('config', { port: 3001 });
    expect(container.resolve('config')).toEqual({ port: 3001 });
  });
});
```

**步骤 2：运行测试验证它失败**

运行：`cd packages/bd-cc && bun test server/app/container.test.ts`
预期：FAIL - container.ts 不存在

**步骤 3：编写最少实现**

```typescript
// packages/bd-cc/server/app/container.ts
type ServiceFactory<T> = (container: Container) => T;

interface ServiceOptions {
  singleton?: boolean;
}

export class Container {
  private factories = new Map<string, ServiceFactory<unknown>>();
  private singletons = new Map<string, unknown>();
  private options = new Map<string, ServiceOptions>();

  register<T>(name: string, factory: ServiceFactory<T>, options: ServiceOptions = {}): void {
    this.factories.set(name, factory);
    this.options.set(name, options);
  }

  registerInstance<T>(name: string, instance: T): void {
    this.singletons.set(name, instance);
  }

  resolve<T>(name: string): T {
    if (this.singletons.has(name)) {
      return this.singletons.get(name) as T;
    }

    const factory = this.factories.get(name);
    if (!factory) {
      throw new Error(`Service not found: ${name}`);
    }

    const opts = this.options.get(name);
    if (opts?.singleton) {
      const instance = factory(this);
      this.singletons.set(name, instance);
      return instance as T;
    }

    return factory(this) as T;
  }

  has(name: string): boolean {
    return this.factories.has(name) || this.singletons.has(name);
  }
}
```

**步骤 4：运行测试验证它通过**

运行：`cd packages/bd-cc && bun test server/app/container.test.ts`
预期：PASS

**步骤 5：提交**

```bash
cd packages/bd-cc
git add server/app/container.ts server/app/container.test.ts
git commit -m "feat(server): add DI container"
```

---

## 阶段 2：Provider 接口抽象

### 任务 2.1：创建 providers/interfaces.ts - 定义 Provider 接口

**文件：**

- 创建：`packages/bd-cc/server/providers/interfaces.ts`

**步骤 1：编写失败的测试**

```typescript
// packages/bd-cc/server/providers/interfaces.test.ts
import { describe, it, expect } from 'vitest';
import type { IAiProvider, ChatOptions, StreamEvent } from './interfaces';

describe('IAiProvider interface', () => {
  it('should define required properties', () => {
    // 验证接口存在
    const provider: IAiProvider = {
      name: 'test',
      capabilities: { supportsStreaming: true, supportsPermissions: true, supportsResume: true },
      chat: async () => {},
      abort: () => true,
      isActive: () => false,
      getActiveSessions: () => [],
    };
    expect(provider.name).toBe('test');
  });
});
```

**步骤 2：运行测试验证它失败**

运行：`cd packages/bd-cc && bun test server/providers/interfaces.test.ts`
预期：FAIL - interfaces.ts 不存在

**步骤 3：编写接口定义**

```typescript
// packages/bd-cc/server/providers/interfaces.ts
export interface ChatOptions {
  projectPath: string;
  sessionId?: string;
  model?: string;
  resume?: boolean;
  initialCommand?: string;
  cwd?: string;
  images?: Array<{ data: string }>;
  toolsSettings?: {
    allowedTools: string[];
    disallowedTools: string[];
    skipPermissions: boolean;
  };
  permissionMode?: string;
}

export interface ProviderCapability {
  supportsStreaming: boolean;
  supportsPermissions: boolean;
  supportsResume: boolean;
}

export interface StreamEvent {
  type: string;
  [key: string]: unknown;
}

export interface IStreamWriter {
  send(event: StreamEvent): void;
}

export interface IAiProvider {
  readonly name: string;
  readonly capabilities: ProviderCapability;

  chat(command: string, options: ChatOptions, writer: IStreamWriter): Promise<void>;
  abort(sessionId: string): boolean;
  isActive(sessionId: string): boolean;
  getActiveSessions(): string[];
}

export type ProviderType = 'claude' | 'cursor' | 'codex' | 'gemini';
```

**步骤 4：运行测试验证它通过**

运行：`cd packages/bd-cc && bun test server/providers/interfaces.test.ts`
预期：PASS

**步骤 5：提交**

```bash
cd packages/bd-cc
git add server/providers/interfaces.ts server/providers/interfaces.test.ts
git commit -m "feat(server): add AI Provider interfaces"
```

---

### 任务 2.2：创建 providers/factory.ts - Provider 工厂

**文件：**

- 创建：`packages/bd-cc/server/providers/factory.ts`
- 创建：`packages/bd-cc/server/providers/factory.test.ts`

**步骤 1：编写失败的测试**

```typescript
// packages/bd-cc/server/providers/factory.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProviderFactory, registerProviders } from './factory';
import type { IAiProvider } from './interfaces';

describe('ProviderFactory', () => {
  let factory: ProviderFactory;

  beforeEach(() => {
    factory = new ProviderFactory();
  });

  it('should create provider by type', () => {
    // 先注册一个 mock provider
    const mockProvider: IAiProvider = {
      name: 'mock',
      capabilities: { supportsStreaming: true, supportsPermissions: true, supportsResume: true },
      chat: async () => {},
      abort: () => true,
      isActive: () => false,
      getActiveSessions: () => [],
    };
    factory.register('mock', () => mockProvider);

    const provider = factory.create('mock');
    expect(provider.name).toBe('mock');
  });

  it('should throw for unknown provider', () => {
    expect(() => factory.create('unknown')).toThrow();
  });
});
```

**步骤 2：运行测试验证它失败**

运行：`cd packages/bd-cc && bun test server/providers/factory.test.ts`
预期：FAIL - factory.ts 不存在

**步骤 3：编写工厂实现**

```typescript
// packages/bd-cc/server/providers/factory.ts
import type { IAiProvider, ProviderType } from './interfaces';

export class ProviderFactory {
  private providers = new Map<ProviderType | string, () => IAiProvider>();

  register(type: string, factory: () => IAiProvider): void {
    this.providers.set(type, factory);
  }

  create(type: string): IAiProvider {
    const factory = this.providers.get(type);
    if (!factory) {
      throw new Error(`Unknown provider type: ${type}`);
    }
    return factory();
  }

  has(type: string): boolean {
    return this.providers.has(type);
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}

// 注册默认 Provider
export function registerProviders(factory: ProviderFactory): void {
  // 这里将在任务 2.3 中导入实际 Provider
}
```

**步骤 4：运行测试验证它通过**

运行：`cd packages/bd-cc && bun test server/providers/factory.test.ts`
预期：PASS

**步骤 5：提交**

```bash
cd packages/bd-cc
git add server/providers/factory.ts server/providers/factory.test.ts
git commit -m "feat(server): add Provider factory"
```

---

### 任务 2.3：创建项目监控服务 services/project-watcher.ts

**文件：**

- 创建：`packages/bd-cc/server/services/project-watcher.ts`
- 创建：`packages/bd-cc/server/services/project-watcher.test.ts`

**步骤 1：编写失败的测试**

```typescript
// packages/bd-cc/server/services/project-watcher.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ProjectWatcher, type ProjectUpdateEvent } from './project-watcher';

describe('ProjectWatcher', () => {
  let watcher: ProjectWatcher;
  const mockConfig = {
    watchPaths: [{ provider: 'claude', rootPath: '/tmp/test-claude' }],
    ignoredPatterns: ['**/node_modules/**'],
    debounceMs: 100,
  };

  afterEach(() => {
    watcher?.stop();
  });

  it('should emit update event on file change', async () => {
    const callback = vi.fn();
    watcher = new ProjectWatcher(mockConfig as any);

    await watcher.start(callback);
    // 模拟文件变化
    watcher['notifyUpdate']({
      type: 'add',
      filePath: '/tmp/test-claude/test.ts',
      provider: 'claude',
      rootPath: '/tmp/test-claude',
    });

    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ type: 'add' }));
  });
});
```

**步骤 2：运行测试验证它失败**

运行：`cd packages/bd-cc && bun test server/services/project-watcher.test.ts`
预期：FAIL - project-watcher.ts 不存在

**步骤 3：编写服务实现**

```typescript
// packages/bd-cc/server/services/project-watcher.ts
import { createLogger } from '../utils/logger';
import type { ProviderConfig } from '../app/config';

const logger = createLogger('services/project-watcher');

export interface ProjectUpdateEvent {
  type: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir';
  filePath: string;
  provider: string;
  rootPath: string;
}

type UpdateCallback = (event: ProjectUpdateEvent) => void;

export class ProjectWatcher {
  private watchers: chokidar.FSWatcher[] = [];
  private callback: UpdateCallback | null = null;
  private debounceTimer: NodeJS.Timeout | null = null;

  constructor(private config: ProviderConfig) {}

  async start(onUpdate: UpdateCallback): Promise<void> {
    this.callback = onUpdate;

    const chokidar = (await import('chokidar')).default;
    const { promises: fs } = await import('fs');

    for (const { provider, rootPath } of this.config.watchPaths) {
      try {
        await fs.mkdir(rootPath, { recursive: true });

        const watcher = chokidar.watch(rootPath, {
          ignored: this.config.ignoredPatterns,
          persistent: true,
          ignoreInitial: true,
          followSymlinks: false,
          depth: 10,
          awaitWriteFinish: {
            stabilityThreshold: 100,
            pollInterval: 50,
          },
        });

        watcher
          .on('add', (filePath) => this.debouncedNotify('add', filePath, provider, rootPath))
          .on('change', (filePath) => this.debouncedNotify('change', filePath, provider, rootPath))
          .on('unlink', (filePath) => this.debouncedNotify('unlink', filePath, provider, rootPath))
          .on('addDir', (filePath) => this.debouncedNotify('addDir', filePath, provider, rootPath))
          .on('unlinkDir', (filePath) => this.debouncedNotify('unlinkDir', filePath, provider, rootPath))
          .on('error', (error) => logger.error(`${provider} watcher error:`, error));

        this.watchers.push(watcher);
      } catch (error) {
        logger.error(`Failed to setup ${provider} watcher:`, error);
      }
    }

    if (this.watchers.length === 0) {
      logger.error('Failed to setup any provider watchers');
    }
  }

  private debouncedNotify(eventType: string, filePath: string, provider: string, rootPath: string): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.notifyUpdate({ type: eventType as any, filePath, provider, rootPath });
    }, this.config.debounceMs);
  }

  notifyUpdate(event: ProjectUpdateEvent): void {
    if (this.callback) {
      this.callback(event);
    }
  }

  async stop(): Promise<void> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    await Promise.all(
      this.watchers.map(async (watcher) => {
        try {
          await watcher.close();
        } catch (error) {
          logger.error('Failed to close watcher:', error);
        }
      })
    );
    this.watchers = [];
  }
}
```

**步骤 4：运行测试验证它通过**

运行：`cd packages/bd-cc && bun test server/services/project-watcher.test.ts`
预期：PASS

**步骤 5：提交**

```bash
cd packages/bd-cc
git add server/services/project-watcher.ts server/services/project-watcher.test.ts
git commit -m "feat(server): add ProjectWatcher service"
```

---

## 阶段 3：WebSocket 处理器拆分

### 任务 3.1：创建 ws/shell-handler.ts

**文件：**

- 创建：`packages/bd-cc/server/ws/shell-handler.ts`
- 创建：`packages/bd-cc/server/ws/shell-handler.test.ts`

**步骤 1：编写失败的测试**

```typescript
// packages/bd-cc/server/ws/shell-handler.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ShellHandler } from './shell-handler';

describe('ShellHandler', () => {
  it('should handle init message', async () => {
    const mockWs = {
      send: vi.fn(),
      on: vi.fn(),
      close: vi.fn(),
    };
    const handler = new ShellHandler({} as any, new Map());
    // 测试初始化逻辑
  });
});
```

**步骤 2：运行测试验证它失败**

运行：`cd packages/bd-cc && bun test server/ws/shell-handler.test.ts`
预期：FAIL - shell-handler.ts 不存在

**步骤 3：编写 ShellHandler 实现**

```typescript
// packages/bd-cc/server/ws/shell-handler.ts
import type { Container } from '../app/container';
import type { AppConfig } from '../app/config';
import { createLogger } from '../utils/logger';
import {
  stripAnsiSequences,
  normalizeDetectedUrl,
  extractUrlsFromText,
  shouldAutoOpenUrlFromOutput,
} from '../utils/url-parser';
import { WebSocketWriter } from '../utils/websocket-writer';

const logger = createLogger('ws/shell-handler');

export interface ShellSession {
  sessionKey: string;
  projectPath: string;
  provider: string;
  process?: Bun.Subprocess;
  buffer: string[];
  timeoutId?: NodeJS.Timeout;
  ws?: WebSocket;
}

export class ShellHandler {
  private sessions = new Map<string, ShellSession>();
  private urlDetectionBuffer = '';
  private announcedAuthUrls = new Set<string>();

  constructor(
    private container: Container,
    private config: AppConfig
  ) {}

  handleConnection(ws: WebSocket, request: IncomingMessage): void {
    logger.info('Shell client connected');

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'init') {
          await this.handleInit(ws, data);
        } else if (data.type === 'input') {
          await this.handleInput(ws, data);
        }
      } catch (error) {
        logger.error('Shell WebSocket error:', error);
      }
    });

    ws.on('close', () => {
      this.handleClose(ws);
    });
  }

  private async handleInit(ws: WebSocket, data: any): Promise<void> {
    // 核心启动逻辑从 index.ts 提取
    const { projectPath, sessionId, provider, initialCommand } = data;
    const ptySessionKey = `${projectPath}_${sessionId || 'default'}`;

    // 发送欢迎消息
    ws.send(
      JSON.stringify({
        type: 'output',
        data: `\x1b[36mStarting terminal in: ${projectPath}\x1b[0m\r\n`,
      })
    );

    // TODO: 启动 PTY 进程逻辑
    logger.info('Shell initialized:', { projectPath, provider });
  }

  private async handleInput(ws: WebSocket, data: any): Promise<void> {
    // 发送输入到 PTY
  }

  private handleClose(ws: WebSocket): void {
    logger.info('Shell client disconnected');
    // 清理会话
  }
}
```

**步骤 4：运行测试验证它通过**

运行：`cd packages/bd-cc && bun test server/ws/shell-handler.test.ts`
预期：PASS

**步骤 5：提交**

```bash
cd packages/bd-cc
git add server/ws/shell-handler.ts server/ws/shell-handler.test.ts
git commit -m "feat(server): extract ShellHandler to separate module"
```

---

### 任务 3.2：创建 ws/chat-handler.ts

**文件：**

- 创建：`packages/bd-cc/server/ws/chat-handler.ts`
- 创建：`packages/bd-cc/server/ws/chat-handler.test.ts`

**步骤类似 3.1，提取 Chat WebSocket 处理逻辑**

---

## 阶段 4：路由注册重构

### 任务 4.1：创建 app/registry.ts - 路由注册中心

**文件：**

- 创建：`packages/bd-cc/server/app/registry.ts`
- 创建：`packages/bd-cc/server/app/registry.test.ts`

**步骤 1：编写失败的测试**

```typescript
// packages/bd-cc/server/app/registry.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RouteRegistry } from './registry';
import express from 'express';

describe('RouteRegistry', () => {
  it('should register and apply routes', () => {
    const registry = new RouteRegistry();
    const app = express();

    const router = express.Router();
    router.get('/test', (req, res) => res.json({ ok: true }));

    registry.register('/api', router);
    registry.apply(app);

    expect(app._router).toBeDefined();
  });
});
```

**步骤 2：运行测试验证它失败**

运行：`cd packages/bd-cc && bun test server/app/registry.test.ts`
预期：FAIL

**步骤 3：编写实现**

```typescript
// packages/bd-cc/server/app/registry.ts
import type { Application } from 'express';

export interface RouteModule {
  path: string;
  router: express.Router;
  middleware?: express.RequestHandler[];
}

export class RouteRegistry {
  private modules: RouteModule[] = [];

  register(path: string, router: express.Router, middleware?: express.RequestHandler[]): void {
    this.modules.push({ path, router, middleware });
  }

  apply(app: Application): void {
    for (const module of this.modules) {
      if (module.middleware) {
        app.use(module.path, ...module.middleware, module.router);
      } else {
        app.use(module.path, module.router);
      }
    }
  }

  getRoutes(): RouteModule[] {
    return [...this.modules];
  }
}
```

**步骤 4：运行测试验证它通过**
**步骤 5：提交**

---

## 阶段 5：简化入口文件

### 任务 5.1：重构 index.ts

**文件：**

- 修改：`packages/bd-cc/server/index.ts` (大幅简化)

**步骤 1：先确保所有测试通过**

运行：`cd packages/bd-cc && bun test`
预期：所有测试通过

**步骤 2：编写简化后的 index.ts**

```typescript
// packages/bd-cc/server/index.ts
#!/usr/bin/env node
import './env.ts';
import { loadConfig } from './app/config';
import { Container } from './app/container';
import { RouteRegistry } from './app/registry';
import { ProjectWatcher } from './services/project-watcher';
import { initializeDatabase } from './database/db';
import { createLogger } from './utils/logger';
import { startEnabledPluginServers, stopAllPlugins } from './utils/plugins';
import { validateApiKey, authenticateToken, authenticateWebSocket } from './middleware/auth';
import { requestLogger } from './middleware/request-logger';
import { IS_PLATFORM } from './env';

const logger = createLogger('server/index');

async function main() {
  // 1. 加载配置
  const config = loadConfig();
  logger.info('Config loaded:', { port: config.server.port });

  // 2. 初始化数据库
  await initializeDatabase();

  // 3. 设置容器
  const container = new Container();
  container.registerInstance('config', config);

  // 4. 创建 Express 应用
  const express = (await import('express')).default;
  const app = express();
  const http = (await import('http')).createServer(app);

  // 5. 设置 WebSocket
  const { WebSocketServer } = await import('ws');
  const wss = new WebSocketServer({ server: http });

  // 6. 注册路由
  const registry = new RouteRegistry();
  await registerRoutes(registry, container);
  registry.apply(app);

  // 7. 设置中间件
  app.use(requestLogger);
  // ... 其他中间件

  // 8. 启动项目监控
  const watcher = new ProjectWatcher(config.provider);
  const connectedClients = new Set<WebSocket>();
  await watcher.start((event) => {
    // 广播项目更新
    const message = JSON.stringify({ type: 'projects_updated', ...event });
    connectedClients.forEach(client => client.send(message));
  });

  // 9. 启动服务器
  http.listen(config.server.port, config.server.host, () => {
    console.log(`Server ready on ${config.server.displayHost}:${config.server.port}`);
    startEnabledPluginServers();
  });

  // 10. 清理
  process.on('SIGTERM', async () => {
    await watcher.stop();
    await stopAllPlugins();
    process.exit(0);
  });
}

async function registerRoutes(registry: RouteRegistry, container: Container): Promise<void> {
  const { default: authRoutes } = await import('./routes/auth');
  const { default: projectsRoutes } = await import('./routes/projects');
  // ... 其他路由

  registry.register('/api/auth', authRoutes);
  registry.register('/api/projects', projectsRoutes, [authenticateToken]);
  // ...
}

main().catch(err => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
```

**步骤 3：运行 typecheck 验证**

运行：`cd packages/bd-cc && bun run typecheck`
预期：PASS

**步骤 4：运行应用验证功能正常**

运行：`cd packages/bd-cc && bun run server &`
预期：服务器正常启动

**步骤 5：提交**

---

## 阶段 6：集成测试

### 任务 6.1：编写集成测试验证端到端功能

**文件：**

- 创建：`packages/bd-cc/tests/integration/server.test.ts`

**步骤 1：编写集成测试**

```typescript
// packages/bd-cc/tests/integration/server.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { fetch } from 'bun';

describe('Server Integration', () => {
  const BASE_URL = 'http://localhost:3001';

  it('should start server and respond to health check', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    expect(res.status).toBe(200);
  });

  it('should handle auth flow', async () => {
    // 测试认证流程
  });
});
```

**步骤 2：运行集成测试**
**步骤 3：提交**

---

## 验收标准

- [ ] `index.ts` 缩减至 150 行以内
- [ ] 核心模块单元测试覆盖率 > 80%
- [ ] 添加新 Provider 只需实现接口并注册
- [ ] typecheck 通过
- [ ] 服务器正常启动
- [ ] 所有现有功能正常工作
