# Concurrently 配合 Bun 使用

`concurrently` 是 Bun 项目中常用的进程管理工具，用于同时运行多个进程（如开发服务器、测试监视器、Linter 等）。

**注意**：Bun 1.3.9+ 已原生支持 `--parallel` 和 `--sequential`，对于简单场景可优先使用 Bun 原生方案。详见 [第 6 节](#6-bun---parallel-与-concurrently-对比)。

---

## 1. 安装

```bash
bun add -D concurrently
```

---

## 2. 基础用法

### 同时运行服务端和客户端

```json
{
  "scripts": {
    "dev": "concurrently \"bun run server\" \"bun run client\""
  }
}
```

### 带 kill 开关

```json
{
  "scripts": {
    "dev": "concurrently --kill-others \"bun run server\" \"bun run client\""
  }
}
```

`--kill-others`：任一进程退出时，终止其他所有进程。

---

## 3. 高级用法

### 3.1 等待服务启动后再运行测试

```bash
bun add -D wait-on
```

```json
{
  "scripts": {
    "dev": "concurrently \"bun run server\" \"wait-on http://localhost:3000 && bun run test\""
  }
}
```

### 3.2 控制成功退出码

```bash
# 第一个命令成功就返回成功（适合服务器 + 测试场景）
concurrently --kill-others --success first "bun run server" "bun run test"

# 最后一个命令成功才返回成功
concurrently --success last "bun run dev" "bun run test"
```

### 3.3 分组输出 + 自定义前缀

```bash
concurrently -c blue,green -n server,client "bun run server" "bun run client"
# 输出：
# [server] Server started on port 3000
# [client] Client compiled successfully
```

### 3.4 顺序执行（限制并发数）

```bash
# -m 1 表示一次只运行一个
concurrently -m 1 "bun run build:step1" "bun run build:step2" "bun run build:step3"
```

### 3.5 重试机制

```bash
# 进程失败时重试 2 次
concurrently --restart-tries 2 "bun run dev"

# 结合 kill-others
concurrently --kill-others --restart-tries 2 "node server.js" "bun run test"
```

### 3.6 发送特定信号

```bash
# 使用 SIGINT 而不是 SIGTERM
concurrently --kill-signal=SIGINT "bun run dev"
```

---

## 4. Programmatic API

在 Node.js 脚本中使用：

```typescript
import concurrently from "concurrently";

const { result } = concurrently(
  [
    { command: "bun run server", name: "Server" },
    { command: "bun run client", name: "Client" },
  ],
  {
    killOthers: ["failure", "success"],
    successCondition: "first",
  },
);

result.then(
  () => console.log("All processes completed"),
  () => console.error("Some process failed"),
);
```

---

## 5. 常见场景

### 5.1 全栈开发

```json
{
  "scripts": {
    "dev": "concurrently --kill-others -n server,client \"bun run server\" \"bun run client\"",
    "server": "bun run --cwd server index.ts",
    "client": "bun run --cwd client dev"
  }
}
```

### 5.2 开发 + 测试监视

```json
{
  "scripts": {
    "dev": "concurrently \"bun run server\" \"bun run client\" \"bun run test:watch\""
  }
}
```

### 5.3 构建流水线

```json
{
  "scripts": {
    "build": "concurrently -m 1 \"bun run build:types\" \"bun run build:utils\" \"bun run build:app\""
  }
}
```

---

## 6. Bun --parallel 与 Concurrently 对比

Bun 1.3.9+ 原生支持 `--parallel` 和 `--sequential` 运行多个脚本，两者的对比如下：

### 6.1 功能对比

| 特性                 | Bun --parallel                        | Concurrently                   |
| -------------------- | ------------------------------------- | ------------------------------ |
| **安装**             | 无需安装                              | 需要 `bun add -D concurrently` |
| **命令来源**         | 必须是 package.json 中的 script       | 任意 shell 命令                |
| **工作区支持**       | 原生支持 `--filter` 和 `--workspaces` | 需额外配置                     |
| **跨包脚本**         | 支持不同包运行不同脚本                | 需配合其他工具                 |
| **输出前缀**         | Foreman 风格自动前缀                  | 可自定义颜色和名称             |
| **顺序执行**         | `--sequential`                        | `-m 1`                         |
| **失败策略**         | `--no-exit-on-error`                  | `--kill-others`                |
| **重试机制**         | 不支持                                | `--restart-tries`              |
| **Programmatic API** | 无                                    | 支持                           |

### 6.2 用法对比

```bash
# Bun --parallel：运行 package.json 中的多个脚本
bun run --parallel build test lint

# Bun --sequential：顺序执行
bun run --sequential build test lint

# Bun 工作区并行
bun run --parallel --filter '*' build

# Concurrently：运行任意命令
concurrently "bun run server" "bun run client"
```

### 6.3 优劣势

#### Bun --parallel 优势

- **零依赖**：无需安装额外包
- **工作区原生**：内置 `--filter` 和 `--workspaces` 支持
- **更简单**：命令更简洁
- **性能更好**：Bun 原生执行，减少进程开销

#### Bun --parallel 劣势

- 只能运行 package.json 中的脚本，不能运行任意命令
- 不支持重试机制
- 不支持 Programmatic API
- 功能相对有限

#### Concurrently 优势

- **灵活性**：支持任意 shell 命令
- **功能丰富**：重试、信号控制、Programmatic API
- **跨平台**：更成熟稳定
- **可组合**：可配合 wait-on 等工具

#### Concurrently 劣势

- 需要安装依赖
- 工作区支持需要额外配置

### 6.4 场景选择

| 场景                            | 推荐工具               |
| ------------------------------- | ---------------------- |
| **Monorepo 多包构建/测试**      | Bun --parallel         |
| **全栈开发（服务端 + 客户端）** | Concurrently           |
| **等待服务启动后运行测试**      | Concurrently + wait-on |
| **需要重试机制**                | Concurrently           |
| **Programmatic 用法**           | Concurrently           |
| **简单脚本并行**                | Bun --parallel         |

### 6.5 实际示例

```json
{
  "scripts": {
    "dev": "concurrently \"bun run server\" \"bun run client\"",
    "build:all": "bun run --parallel --workspaces build",
    "test:all": "bun run --parallel --workspaces test",
    "lint:all": "bun run --parallel --filter '*' lint"
  }
}
```

---

## 8. 常见问题

### Windows 下 Ctrl+C 无法终止所有进程

升级到 concurrently v9.0.0+：

```bash
bun add -D concurrently@latest
```

### 与 --restart-tries 结合时 kill-others 不生效

这是 v9 之前的已知问题。升级到最新版本即可解决。

### 退出码不为 0

使用 `--success first` 或 `--success last` 控制成功条件，确保 CI 能正确判断构建状态。
