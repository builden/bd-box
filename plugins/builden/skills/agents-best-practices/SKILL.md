---
name: agents-best-practices
description: Claude Code Subagents 最佳实践。用于创建、配置和管理自定义 Subagents，或当需要将复杂任务委托给专用子代理时使用。包括工具限制、权限模式、持久化内存、Hooks 配置、团队协作模式等。
---

# Subagents 最佳实践

本 Skill 提供 Claude Code 自定义 Subagents 的创建、配置和管理指南。

## 介绍 Subagents

Subagents 是专门的 AI 助手，用于处理特定类型的任务。每个 Subagent 在独立上下文窗口中运行，拥有自定义系统提示词、特定工具访问权限和独立权限。

Subagents 帮助实现：

- **保留上下文**：将探索和实现工作移出主对话
- **强制约束**：限制 Subagent 可以使用的工具
- **跨项目复用**：用户级 Subagent 可在不同项目间共享
- **专业化行为**：为特定领域定制系统提示词
- **控制成本**：将任务路由到更快、更便宜的模型（如 Haiku）

## 介绍内置 Subagents

Claude Code 内置以下 Subagents：

| Subagent            | 模型       | 用途                         |
| ------------------- | ---------- | ---------------------------- |
| **Explore**         | Haiku      | 快速、只读的代码库搜索和分析 |
| **Plan**            | 继承主对话 | 计划模式下的代码研究         |
| **General-purpose** | 继承主对话 | 复杂多步骤任务               |
| **Bash**            | 继承主对话 | 在独立上下文运行终端命令     |

详见 [references/built-in.md](references/built-in.md)。

## 创建 Subagent

### 方式一：使用 /agents 命令（推荐）

```
/agents
```

交互式界面可：

- 查看所有可用 Subagents
- 创建新 Subagent（引导或 Claude 生成）
- 编辑现有配置
- 删除自定义 Subagent

### 方式二：手动创建

Subagent 是带有 YAML frontmatter 的 Markdown 文件：

```markdown
---
name: code-reviewer
description: 代码审查专家。代码变更后主动审查质量和最佳实践
tools: Read, Grep, Glob, Bash
model: sonnet
---

你是一名高级代码审查员。确保代码质量和安全标准。
```

详见 [references/creation.md](references/creation.md)。

## 配置 Subagent

### 工具控制

```yaml
---
name: safe-researcher
description: 有限制的研究代理
tools: Read, Grep, Glob, Bash
disallowedTools: Write, Edit
---
```

### 模型选择

```yaml
model: sonnet   # 能力与速度平衡
model: opus     # 最强能力
model: haiku    # 最低延迟
model: inherit  # 使用主对话模型
```

### 权限模式

| 模式                | 行为                 |
| ------------------- | -------------------- |
| `default`           | 标准权限检查         |
| `acceptEdits`       | 自动接受文件编辑     |
| `dontAsk`           | 自动拒绝权限请求     |
| `bypassPermissions` | 跳过所有权限检查     |
| `plan`              | 计划模式（只读探索） |

### 持久化内存

```yaml
memory: user    # ~/.claude/agent-memory/<name>/
memory: project  # .claude/agent-memory/<name>/
memory: local    # .claude/agent-memory-local/<name>/
```

详见 [references/configuration.md](references/configuration.md)。

## 使用 Subagent

### 隔离高产出操作

Subagent 最有效的用途之一是隔离产生大量输出的操作：

```
使用 subagent 运行测试套件，只报告失败的测试及其错误信息
```

### 并行研究

对于独立调查，并行生成多个 Subagent：

```
使用不同的 subagent 并行研究认证、数据库和 API 模块
```

### 链式调用

多步骤工作流中，按顺序使用 Subagent：

```
使用 code-reviewer subagent 找出性能问题，然后使用 optimizer subagent 修复
```

详见 [references/usage.md](references/usage.md)。

## 理解作用域优先级

| 位置                | 作用域       | 优先级    |
| ------------------- | ------------ | --------- |
| `--agents` CLI flag | 当前会话     | 1（最高） |
| `.claude/agents/`   | 当前项目     | 2         |
| `~/.claude/agents/` | 用户所有项目 | 3         |
| 插件 `agents/` 目录 | 插件启用范围 | 4（最低） |

## 使用 Agent Teams

当需要协调多个 Claude Code 实例协同工作时使用。

详见 [references/agent-teams.md](references/agent-teams.md)。

## Subagent 示例

- [代码审查 Subagent](references/examples.md)
- [调试器 Subagent](references/examples.md)
- [数据科学家 Subagent](references/examples.md)
- [数据库查询验证器](references/examples.md)

详见 [references/examples.md](references/examples.md)。

## 最佳实践

1. **设计专注的 Subagent**：每个 Subagent 应该擅长一项特定任务
2. **编写详细描述**：Claude 使用描述来决定何时委托
3. **限制工具访问**：仅授予必要的权限
4. **纳入版本控制**：与团队共享项目 Subagent

## 下一步

- [介绍内置 Subagents](references/built-in.md)
- [创建 Subagent](references/creation.md)
- [配置 Subagent](references/configuration.md)
- [使用 Subagent](references/usage.md)
- [使用 Agent Teams](references/agent-teams.md)
- [Subagent 示例](references/examples.md)
