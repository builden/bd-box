# bd-cc Server 架构重构设计

**日期**: 2026-03-16
**版本**: v1.0
**目标**: 提升代码质量、扩展性、可测试性

---

## 1. 背景与目标

### 1.1 当前问题

- **单文件过大**: `server/index.ts` 超过 1000 行
- **职责混乱**: 服务器启动、WebSocket 处理、AI 集成、路由注册混合在一起
- **难以测试**: 核心逻辑与 HTTP/WS 强耦合
- **扩展困难**: 新增 AI Provider 需要修改主文件
- **全局状态分散**: 配置、连接池、 watchers 分散各处

### 1.2 重构目标

| 目标     | 描述                                |
| -------- | ----------------------------------- |
| 模块化   | 按功能拆分为独立模块                |
| 接口抽象 | 统一 AI Provider 接口，支持快速扩展 |
| 可测试   | 核心逻辑可单元测试                  |
| 配置集中 | 消除分散的配置和全局状态            |
| 插件化   | 预留功能模块可插拔能力              |

---

## 2. 架构设计

### 2.1 整体结构

```
server/
├── index.ts                      # 入口，仅组装和启动
├── app/
│   ├── config.ts                 # 配置集中管理
│   ├── container.ts              # 轻量 DI 容器
│   ├── registry.ts               # 路由注册中心
│   └── server.ts                 # 服务器实例创建
├── providers/
│   ├── interfaces.ts             # AI Provider 抽象接口
│   ├── factory.ts                # Provider 工厂
│   ├── types.ts                  # Provider 类型定义
│   ├── claude.ts                 # Claude 实现
│   ├── cursor.ts                 # Cursor 实现
│   ├── codex.ts                  # Codex 实现
│   └── gemini.ts                 # Gemini 实现
├── ws/
│   ├── interfaces.ts             # WebSocket 类型定义
│   ├── shell-handler.ts         # Shell WebSocket 处理器
│   ├── chat-handler.ts          # Chat WebSocket 处理器
│   └── connection-manager.ts    # WebSocket 连接管理
├── services/
│   ├── project-watcher.ts       # 项目文件监控服务
│   ├── session-manager.ts       # 会话管理服务
│   └── ...
├── routes/                       # 路由层（保持现有结构）
│   ├── git/
│   ├── projects/
│   └── ...
└── infrastructure/
    ├── database/
    ├── middleware/
    └── utils/
```

### 2.2 层次关系

```
入口 (index.ts)
    ↓
应用组装 (app/server.ts)
    ├── 配置加载 (app/config.ts)
    ├── DI 容器 (app/container.ts)
    ├── 路由注册 (app/registry.ts)
    │       ↓
    │    路由层 (routes/)
    │       ↓
    │    服务层 (services/)
    │       ↓
    │    Provider 层 (providers/)
    │
    ├── WebSocket 服务器
    │       ↓
    │    WS 处理器 (ws/)
    │       ↓
    │    Provider 调用
    │
    └── 基础设施 (infrastructure/)
```

---

## 3. 核心模块设计

### 3.1 配置集中管理

**目标**: 消除分散的配置，统一管理

```typescript
// app/config.ts
export interface ServerConfig {
  port: number;
  host: string;
  displayHost: string;
  env: 'development' | 'production';
  isPlatform: boolean;
}

export interface ProviderConfig {
  watchPaths: ProviderWatchPath[];
  ignoredPatterns: string[];
  debounceMs: number;
}

export interface TerminalConfig {
  sessionTimeout: number;
  urlParseBufferLimit: number;
}

// 加载优先级：环境变量 > 默认配置
export function loadConfig(): AppConfig { ... }
```

### 3.2 轻量 DI 容器

**目标**: 解耦依赖，支持测试注入

```typescript
// app/container.ts
type ServiceFactory<T> = (container: Container) => T;

class Container {
  private services = new Map<string, any>();

  register<T>(name: string, factory: ServiceFactory<T>): void;
  resolve<T>(name: string): T;
  registerInstance<T>(name: string, instance: T): void;
}

// 预注册核心服务
export function setupContainer(config: AppConfig): Container { ... }
```

### 3.3 AI Provider 接口抽象

**目标**: 统一接口，便于扩展新 Provider

```typescript
// providers/interfaces.ts
export interface ChatOptions {
  projectPath: string;
  sessionId?: string;
  model?: string;
  resume?: boolean;
  initialCommand?: string;
}

export interface ProviderCapability {
  supportsStreaming: boolean;
  supportsPermissions: boolean;
  supportsResume: boolean;
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

// 流事件类型
export type StreamEvent =
  | { type: 'message'; content: string }
  | { type: 'tool_use'; tool: string; input: unknown }
  | { type: 'tool_result'; tool: string; result: string }
  | { type: 'error'; message: string }
  | { type: 'done' };
```

### 3.4 Provider 工厂

**目标**: 动态创建 Provider 实例

```typescript
// providers/factory.ts
export type ProviderType = 'claude' | 'cursor' | 'codex' | 'gemini';

class ProviderFactory {
  private providers = new Map<ProviderType, new () => IAiProvider>();

  register(type: ProviderType, provider: new () => IAiProvider): void;
  create(type: ProviderType): IAiProvider;
  getAvailableProviders(): ProviderType[];
}

// 注册现有 Provider
export function registerProviders(factory: ProviderFactory): void { ... }
```

### 3.5 WebSocket 处理器分离

**目标**: 将 shell/chat handler 移出主文件

```typescript
// ws/interfaces.ts
export interface WSMessage {
  type: string;
  [key: string]: unknown;
}

export interface ShellSession {
  sessionKey: string;
  projectPath: string;
  provider: string;
  process?: Bun.Subprocess;
  buffer: string[];
  timeoutId?: NodeJS.Timeout;
}

// ws/shell-handler.ts
export class ShellHandler {
  constructor(
    private container: Container,
    private sessionStore: Map<string, ShellSession>
  ) {}

  handleConnection(ws: WebSocket, request: IncomingMessage): void;
  handleMessage(ws: WebSocket, data: WSMessage): Promise<void>;
  handleClose(ws: WebSocket): void;
}

// ws/chat-handler.ts
export class ChatHandler {
  constructor(private container: Container) {}

  handleConnection(ws: WebSocket, request: IncomingMessage): void;
  handleMessage(ws: WebSocket, data: WSMessage): Promise<void>;
  handleClose(ws: WebSocket): void;
}
```

### 3.6 项目监控服务

**目标**: 封装文件监控逻辑

```typescript
// services/project-watcher.ts
export interface ProjectUpdateEvent {
  type: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir';
  filePath: string;
  provider: string;
  rootPath: string;
}

export class ProjectWatcher {
  private watchers: chokidar.FSWatcher[] = [];

  constructor(private config: ProviderConfig) {}

  async start(onUpdate: (event: ProjectUpdateEvent) => void): Promise<void>;
  async stop(): Promise<void>;
  broadcastUpdate(event: ProjectUpdateEvent): void;
}
```

---

## 4. 路由注册中心

**目标**: 集中管理路由注册

```typescript
// app/registry.ts
interface RouteModule {
  path: string;
  router: express.Router;
  middleware?: express.RequestHandler[];
}

class RouteRegistry {
  private modules: RouteModule[] = [];

  register(path: string, router: express.Router, middleware?: express.RequestHandler[]): void;
  apply(app: express.Application): void;
  getRoutes(): RouteModule[];
}

// 预注册所有路由
export function registerRoutes(registry: RouteRegistry, container: Container): void { ... }
```

---

## 5. 入口文件重构

**目标**: 仅保留启动逻辑

```typescript
// index.ts
import { loadConfig } from './app/config';
import { setupContainer } from './app/container';
import { createServer } from './app/server';
import { registerRoutes } from './app/registry';
import { setupWebSocket } from './app/websocket';
import { initializeDatabase } from './infrastructure/database';

async function main() {
  // 1. 加载配置
  const config = loadConfig();

  // 2. 初始化数据库
  await initializeDatabase();

  // 3. 设置 DI 容器
  const container = setupContainer(config);

  // 4. 创建 Express 应用
  const app = createServer(config);

  // 5. 注册路由
  const registry = new RouteRegistry();
  registerRoutes(registry, container);
  registry.apply(app);

  // 6. 设置 WebSocket
  setupWebSocket(app, container);

  // 7. 启动服务器
  await app.listen(config.port, config.host);
}

main();
```

---

## 6. 可测试性设计

### 6.1 单元测试示例

```typescript
// __tests__/providers/factory.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProviderFactory, registerProviders } from '../providers/factory';

describe('ProviderFactory', () => {
  let factory: ProviderFactory;

  beforeEach(() => {
    factory = new ProviderFactory();
    registerProviders(factory);
  });

  it('should create claude provider', () => {
    const provider = factory.create('claude');
    expect(provider.name).toBe('claude');
  });

  it('should throw for unknown provider', () => {
    expect(() => factory.create('unknown')).toThrow();
  });
});

// __tests__/services/project-watcher.test.ts
describe('ProjectWatcher', () => {
  it('should emit update event on file change', async () => {
    const watcher = new ProjectWatcher(testConfig);
    const callback = vi.fn();

    await watcher.start(callback);
    // 模拟文件变化
    await watcher.simulateChange('add', '/path/to/file.ts');

    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ type: 'add' }));
  });
});
```

### 6.2 依赖注入测试

```typescript
// 测试时注入 mock
const mockProvider = {
  name: 'mock',
  capabilities: { supportsStreaming: true, supportsPermissions: true, supportsResume: true },
  chat: vi.fn(),
  abort: vi.fn(),
  isActive: vi.fn().mockReturnValue(false),
  getActiveSessions: vi.fn().mockReturnValue([]),
};

container.registerInstance('provider:claude', mockProvider);
```

---

## 7. 扩展性设计

### 7.1 添加新 Provider

```typescript
// providers/windsurf.ts
import { IAiProvider } from './interfaces';

export class WindsurfProvider implements IAiProvider {
  readonly name = 'windsurf';
  readonly capabilities = {
    supportsStreaming: true,
    supportsPermissions: true,
    supportsResume: true,
  };

  async chat(command: string, options: ChatOptions, writer: IStreamWriter) { ... }
  abort(sessionId: string) { ... }
  isActive(sessionId: string) { ... }
  getActiveSessions() { ... }
}

// 注册到工厂
factory.register('windsurf', WindsurfProvider);
```

### 7.2 添加新服务

```typescript
// services/notification.ts
export class NotificationService {
  constructor(
    private container: Container,
    private config: ServerConfig
  ) {}

  async send(notification: Notification): Promise<void> { ... }
}

// 在 container 中注册
container.register('notification', (c) => new NotificationService(c, c.resolve('config')));
```

---

## 8. 实施计划

### Phase 1: 基础设施搭建

1. 创建 `app/` 目录结构
2. 实现 `app/config.ts` - 配置集中管理
3. 实现 `app/container.ts` - 轻量 DI 容器

### Phase 2: Provider 接口抽象

4. 创建 `providers/interfaces.ts` - 定义接口
5. 提取现有 Provider 逻辑实现接口
6. 实现 `providers/factory.ts` - 工厂模式

### Phase 3: 服务层拆分

7. 拆分 `project-watcher` 到 `services/`
8. 封装 WebSocket 处理器到 `ws/`

### Phase 4: 路由注册重构

9. 实现 `app/registry.ts` - 路由注册中心
10. 重构 `index.ts` - 入口简化

### Phase 5: 测试补充

11. 为核心模块编写单元测试
12. 集成测试验证

---

## 9. 风险与缓解

| 风险             | 缓解措施                 |
| ---------------- | ------------------------ |
| 改动过大影响功能 | 分阶段实施，每阶段可运行 |
| 接口设计不合理   | 先抽象现有代码，保持兼容 |
| 测试覆盖不足     | TDD 优先，先写测试       |
| 回滚困难         | Git 分支管理，频繁提交   |

---

## 10. 成功标准

- [ ] `index.ts` 缩减至 100 行以内
- [ ] 核心模块单元测试覆盖率 > 80%
- [ ] 添加新 Provider 只需 30 分钟
- [ ] 关键逻辑可独立测试
- [ ] 无功能退化

---

**设计完成，等待实施**
