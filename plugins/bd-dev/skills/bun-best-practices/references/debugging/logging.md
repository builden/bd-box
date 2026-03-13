# 日志规范

本规范定义项目的日志和调试标准，目标是提高问题定位效率，支持 Agent 调试流程。

## 适用范围

**需要日志的项目：**

- Web 应用（前后端）
- API 服务
- CLI 工具（长期运行）
- 有用户交互的应用

**不需要日志的项目：**

- **底层库/工具库**（如 bd-color、bd-lunar）
  - 对性能要求极高
  - 对包体积敏感
  - 应通过测试验证行为，而非日志
- 一次性脚本
- 纯函数库

**替代方案：** 通过单元测试验证行为，性能通过 Mitata 基准测试。

## 目录

- [日志工具](#日志工具)
- [日志级别](#日志级别)
- [日志内容](#日志内容)
- [文件规范](#文件规范)
- [Sentry 集成](#sentry-集成)
- [写入技巧](#写入技巧)
- [Bun JSONL](#bun-jsonl)

---

## 日志工具

| 工具                       | 用途                       |
| -------------------------- | -------------------------- |
| **pino**                   | 核心日志库（Bun 官方推荐） |
| **pino-pretty**            | 开发环境美化输出           |
| **@sentry/pino-transport** | Sentry 集成                |
| **@sentry/browser**        | Web 端错误追踪             |

---

## 日志级别

| 级别  | 数值 | 使用场景           |
| ----- | ---- | ------------------ |
| debug | 20   | 开发调试，详细流程 |
| info  | 30   | 常规业务信息       |
| warn  | 40   | 警告，可恢复错误   |
| error | 50   | 错误，异常情况     |

### 按环境配置

| 环境             | 级别                        |
| ---------------- | --------------------------- |
| **开发**         | debug + info + warn + error |
| **生产（常规）** | warn + error                |
| **生产（调试）** | 远程开关指定用户/设备       |

---

## 日志内容

日志必须包含以下信息（便于 Agent 定位问题）：

| 字段      | 说明                     |
| --------- | ------------------------ |
| timestamp | ISO 格式时间             |
| level     | 日志级别                 |
| message   | 日志消息                 |
| stack     | 错误堆栈（error 时必需） |
| requestId | 请求 ID（链路追踪）      |
| context   | 额外上下文               |

### 请求链路追踪

```typescript
import pino from "pino";

const logger = pino();

app.use((req, res, next) => {
  const requestId = req.headers["x-request-id"] || crypto.randomUUID();
  req.log = logger.child({ requestId });
  next();
});
```

---

## 文件规范

### 目录结构

```
logs/
  app-2026-03-10.log
  app-2026-03-10-error.log
```

### pino 配置模板

```typescript
import pino from "pino";
import pinoRoll from "pino-roll";

const logger = pino({
  transport: {
    targets: [
      {
        target: "pino-roll",
        options: {
          file: "./logs/app-%DATE%.log",
          dateFormat: "yyyy-MM-dd",
          maxFiles: 7,
          compress: true,
        },
      },
      {
        target: "pino-roll",
        options: {
          file: "./logs/app-%DATE%-error.log",
          dateFormat: "yyyy-MM-dd",
          maxFiles: 7,
          level: "error",
        },
      },
    ],
  },
});
```

### 开发环境配置

```typescript
const isDevelopment = process.env.NODE_ENV !== "production";

const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info"),
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss.l", // 只显示时间，无日期无时区
          ignore: "pid,hostname", // 忽略冗余字段
        },
      }
    : undefined,
});
```

#### 开发环境格式优化

提高信息密度，移除冗余信息：

| 选项                          | 说明              | 示例           |
| ----------------------------- | ----------------- | -------------- |
| `translateTime: "HH:MM:ss.l"` | 只显示时间 + 毫秒 | `01:57:18.546` |
| `translateTime: "HH:MM:ss"`   | 只显示时间        | `01:57:18`     |
| `ignore: "pid,hostname"`      | 忽略进程信息      | -              |

> 生产环境使用 pino-roll 进行日志轮转，详见下一节。

---

## 结构化日志写法

### 基础写法

```typescript
import pino from "pino";

const logger = pino();

// ❌ 错误 - 不便于检索
logger.info("User logged in: " + userId);

// ✅ 正确 - 结构化日志
logger.info({ userId }, "User logged in");
```

### 错误日志

```typescript
// ❌ 错误
logger.error("Error reading file:", error);

// ✅ 正确 - 将 error 作为对象传递
logger.error({ error }, "Error reading file");

// ✅ 正确 - 包含更多上下文
logger.error({ error, filePath, operation }, "Failed to read file");
```

### Debug 日志

```typescript
// ❌ 错误 - 拼接字符串
logger.debug("[DEBUG] User message: " + data.command);

// ✅ 正确 - 对象 + 消息
logger.debug({ command: data.command || "[Continue/Resume]" }, "User message");

// ✅ 正确 - 多个上下文字段
logger.debug({ command, sessionId, provider }, "Agent message received");
```

### 父子 Logger（请求追踪）

```typescript
// server/utils/logger.ts
import pino from "pino";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDevelopment = process.env.NODE_ENV !== "production";

export const logger = pino({
  /* 配置 */
});

// 创建带 requestId 的子 logger
export function createRequestLogger(requestId: string) {
  return logger.child({ requestId });
}

// server/routes/api.ts
import { createRequestLogger } from "../utils/logger.ts";

app.get("/api/users", (req, res) => {
  const log = createRequestLogger(req.headers["x-request-id"]);
  log.info({ userId: 123 }, "Fetching users");
});
```

---

## 独立 Logger 模块

推荐创建独立的 logger 模块，便于项目各处复用：

```
server/
└── utils/
    └── logger.ts    # 统一的日志配置
```

```typescript
// server/utils/logger.ts
import pino from "pino";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDevelopment = process.env.NODE_ENV !== "production";
const logsDir = path.join(__dirname, "..", "logs");

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info"),
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss.l",
          ignore: "pid,hostname",
        },
      }
    : {
        targets: [
          {
            target: "pino-roll",
            options: {
              file: path.join(logsDir, "app-%DATE%.log"),
              dateFormat: "yyyy-MM-dd",
              maxFiles: 7,
              maxSize: "100m",
            },
          },
          {
            target: "pino-roll",
            options: {
              file: path.join(logsDir, "app-%DATE%-error.log"),
              dateFormat: "yyyy-MM-dd",
              maxFiles: 7,
              maxSize: "50m",
              level: "error",
            },
          },
        ],
      },
});

export function createRequestLogger(requestId: string) {
  return logger.child({ requestId });
}
```

**使用方式：**

```typescript
// server/index.ts
import { logger } from "./utils/logger.ts";

logger.info({ port: 3000 }, "Server starting");

// server/routes/xxx.ts
import { logger } from "../utils/logger.ts";

logger.warn({ path: req.url }, "Deprecated endpoint");
```

---

## Sentry 集成

### Node 端

```typescript
import pino from "pino";
import { createWriteStream } from "pino-sentry";

const sentryStream = createWriteStream({
  dsn: process.env.SENTRY_DSN,
});

const logger = pino({ level: process.env.LOG_LEVEL || "info" }, sentryStream);
```

### Web 端

```typescript
import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  level: process.env.NODE_ENV === "production" ? "error" : "debug",
});

// 捕获错误
try {
  // code
} catch (e) {
  Sentry.captureException(e);
}
```

### 远程调试开关

```typescript
import * as Sentry from "@sentry/browser";

const isDebugUser = await fetch("/api/user/debug-flag").then((r) => r.json());

if (isDebugUser) {
  Sentry.setLevel("debug");
}
```

---

## 写入技巧

### 必须记录的关键节点

| 节点         | 记录内容                  | 级别  |
| ------------ | ------------------------- | ----- |
| 请求入口     | 请求参数、来源、时间      | info  |
| 关键业务操作 | 业务决策点、状态变更      | info  |
| 外部调用     | API 请求、响应状态、耗时  | info  |
| 异常捕获     | 错误堆栈、上下文、请求 ID | error |
| 请求出口     | 响应状态、耗时、结果摘要  | info  |

### 避免过度记录

- 循环内的日志（使用计数器或采样）
- 频繁调用的函数（如 getter）
- 大对象完整打印（只记录关键字段）

### 错误日志模板

```typescript
logger.error(
  {
    err,
    requestId,
    operation,
    duration,
    metadata: { endpoint: "/api/users", method: "POST" },
  },
  "Failed to create user",
);
```

### 自动化日志注入

**中间件（HTTP 请求/响应）：**

```typescript
app.use(async (req, res, next) => {
  const start = Date.now();
  const requestId = req.headers["x-request-id"] || crypto.randomUUID();

  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info({ requestId, method: req.method, url: req.url, status: res.statusCode, duration }, "Request completed");
  });

  next();
});
```

---

## Bun JSONL

Bun 内置 `Bun.JSONL` 命名空间，pino 输出的 JSON 格式本身就是 JSONL：

```typescript
import { JSONL } from "bun";

// 解析日志文件
const logs = JSONL.parse(await Bun.file("./logs/app-2026-03-10.log").text());
const errors = logs.filter((l: any) => l.level === 50);

// 流式解析大文件
const { values } = JSONL.parseChunk(buffer);
```

---

## 运行命令

```bash
# 开发环境
NODE_ENV=development bun run dev

# 生产环境
NODE_ENV=production bun run start
```

---

## 迁移指南

### 步骤 1: 创建 logger 模块

按上述章节创建 `server/utils/logger.ts`

### 步骤 2: 批量替换

使用编辑器的多光标功能或 sed 批量替换：

```bash
# 查找所有 console.log/console.error
grep -rn "console\.log\|console\.error" server/
```

### 步骤 3: 逐个替换

| 原写法                              | 新写法                                               |
| ----------------------------------- | ---------------------------------------------------- |
| `console.log("PORT:", value)`       | `logger.info({ PORT: value }, "PORT from env")`      |
| `console.error("Error:", err)`      | `logger.error({ error: err }, "Error reading file")` |
| `console.log("[DEBUG] msg:", data)` | `logger.debug({ data }, "User message")`             |
| `console.warn("Warning:", msg)`     | `logger.warn({ msg }, "Warning message")`            |

### 步骤 4: 验证

```bash
# 启动服务，确认日志正常输出
bun run server
```

### 常见问题

**Q: pino-pretty 不工作？**

A: 确保 `isDevelopment = process.env.NODE_ENV !== "production"`，开发环境需要设置 `NODE_ENV=development`

**Q: 日志没有颜色？**

A: 检查 `colorize: true` 配置

**Q: 时间格式不对？**

A: 使用 `translateTime: "HH:MM:ss.l"` 格式

---

## Gitignore 配置

确保日志目录不被提交到版本控制：

```gitignore
# 日志文件
logs/
*.log

# pino-roll 生成的文件
app-*.log
app-*-error.log
```

---

## 实施检查清单

- [ ] 安装依赖：`pino`, `pino-pretty`, `pino-roll`, `pino-sentry`
- [ ] 创建 `server/utils/logger.ts` 模块
- [ ] 配置开发环境格式（translateTime, ignore）
- [ ] 配置生产环境日志轮转（pino-roll）
- [ ] 替换所有 console.log/console.error 为 logger
- [ ] 配置 Sentry（Node 端）
- [ ] 配置 Sentry（Web 端）
- [ ] 配置 Gitignore
