# 终端连接问题诊断报告

## 问题描述

用户在应用中点击终端标签时，提示"在 shell 中继续"。

## 诊断流程

### 1. 架构梳理

```
前端流程:
Shell.tsx → useShellRuntime → useShellConnection → WebSocket (/shell)
     ↓
socket.ts: getShellWebSocketUrl() → 构建 ws://localhost:3001/shell

后端流程:
WebSocketServer (port 3001)
    ↓
verifyClient (认证)
    ↓
wss.on('connection')
    ↓
handleShellConnection (创建 PTY)
```

### 2. 关键文件

| 层级 | 文件                                               | 职责               |
| ---- | -------------------------------------------------- | ------------------ |
| 前端 | `src/components/shell/utils/socket.ts`             | 构建 WebSocket URL |
| 前端 | `src/components/shell/hooks/useShellConnection.ts` | 管理连接生命周期   |
| 前端 | `src/components/shell/hooks/useShellRuntime.ts`    | 整合终端和连接     |
| 后端 | `server/index.ts` (line 1443+)                     | WebSocket 处理     |
| 后端 | `server/middleware/auth.ts`                        | 认证中间件         |

### 3. 测试验证

运行集成测试验证后端服务：

```bash
bun test tests/integration/terminal.spec.ts
# 结果: PASS (103ms)
```

**结论**: 后端 WebSocket 服务正常工作。

### 4. 已添加的调试日志

#### socket.ts

```typescript
logger.info('[ShellSocket] Building WebSocket URL:', { protocol, host, IS_PLATFORM });
logger.info('[ShellSocket] Platform mode, returning URL:', url);
logger.error('[ShellSocket] No authentication token found...');
```

#### useShellConnection.ts

```typescript
logger.info('[Shell] connectToShell called:', { isInitialized, isConnected, isConnecting });
logger.info('[Shell] Connecting to WebSocket:', wsUrl);
logger.error('[Shell] WebSocket error:', error);
logger.info('[Shell] WebSocket closed:', { code, reason });
```

## 排查步骤

用户遇到问题时，请按以下步骤排查：

### 步骤 1: 检查服务状态

```bash
lsof -i :3001
```

预期: 显示 bun 或 node 进程监听端口 3001

### 步骤 2: 检查浏览器控制台日志

在浏览器 Console 中查看日志:

- `[ShellSocket]` - WebSocket URL 构建
- `[Shell]` - 连接状态

### 步骤 3: 检查网络请求

打开浏览器开发者工具:

- Network → WS → `/shell` → 查看连接状态

### 步骤 4: 检查本地存储

Console 中执行:

```javascript
localStorage.getItem('auth-token');
```

## 已创建的文件

1. `docs/specs/terminal/connection-flow.md` - 终端连接架构文档
2. `tests/api/terminal.api.test.ts` - 终端 API 测试用例

## 后续改进

- [x] 添加前端调试日志
- [ ] 添加前端自动化测试
- [ ] 添加连接状态监控 UI
