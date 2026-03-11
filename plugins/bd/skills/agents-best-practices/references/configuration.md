# Subagent 配置

## 工具控制

Subagent 可以使用 Claude Code 的任何内部工具。默认继承主对话的所有工具。

使用 `tools`（允许列表）或 `disallowedTools`（拒绝列表）限制工具：

```yaml
---
name: safe-researcher
description: 有限制的研究代理
tools: Read, Grep, Glob, Bash
disallowedTools: Write, Edit
---
```

### 限制可生成的 Subagent

使用 `Agent(agent_type)` 语法限制可生成的子代理类型：

```yaml
---
name: coordinator
description: 协调多个专用代理的工作
tools: Agent(worker, researcher), Read, Bash
---
```

这是允许列表：如果代理尝试生成任何其他类型，请求失败。

## 模型选择

```yaml
model: sonnet   # 能力与速度平衡
model: opus     # 最强能力
model: haiku    # 最低延迟
model: inherit  # 使用主对话模型
```

## 权限模式

| 模式                | 行为                 |
| ------------------- | -------------------- |
| `default`           | 标准权限检查         |
| `acceptEdits`       | 自动接受文件编辑     |
| `dontAsk`           | 自动拒绝权限请求     |
| `bypassPermissions` | 跳过所有权限检查     |
| `plan`              | 计划模式（只读探索） |

## 预加载 Skills

```yaml
---
name: api-developer
description: 按照团队约定实现 API 端点
skills:
  - api-conventions
  - error-handling-patterns
---
实现 API 端点。遵循预加载 Skills 的约定和模式。
```

每个 Skill 的完整内容被注入到 Subagent 上下文中。

## 持久化内存

```yaml
---
name: code-reviewer
description: 审查代码质量和最佳实践
memory: user
---
你是代码审查员。审查代码时更新你的代理记忆。
```

| 作用域    | 位置                                 | 用途                 |
| --------- | ------------------------------------ | -------------------- |
| `user`    | `~/.claude/agent-memory/<name>/`     | 跨所有项目记忆       |
| `project` | `.claude/agent-memory/<name>/`       | 项目特定，可版本控制 |
| `local`   | `.claude/agent-memory-local/<name>/` | 项目特定，不版本控制 |

### 持久化内存技巧

- `user` 是推荐的默认作用域
- 让 Subagent 在开始工作前查阅记忆
- 完成后让 Subagent 更新记忆
- 直接在 Markdown 文件中包含记忆指令

## Hooks

Subagent 可以定义在生命周期中运行的 Hooks：

```yaml
---
name: db-reader
description: 执行只读数据库查询
tools: Bash
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate-readonly-query.sh"
---
```

支持的事件：`PreToolUse`、`PostToolUse`、`Stop`

## 条件规则

使用 `PreToolUse` Hooks 动态控制工具使用，允许某些操作而阻止其他操作。
