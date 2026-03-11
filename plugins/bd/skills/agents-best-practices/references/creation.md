# 创建 Subagent

## 方式一：使用 /agents 命令

运行 `/agents` 打开交互式界面：

- 查看所有可用 Subagents
- 创建新 Subagent（引导或 Claude 生成）
- 编辑现有配置
- 删除自定义 Subagent

## 方式二：手动创建

Subagent 文件使用 YAML frontmatter 配置，后跟 Markdown 格式的系统提示词。

```markdown
---
name: code-reviewer
description: 审查代码质量和最佳实践
tools: Read, Glob, Grep
model: sonnet
---

你是一个代码审查员。调用时分析代码并提供具体、可操作的反馈。
```

frontmatter 定义 Subagent 的元数据和配置。Body 成为指导 Subagent 行为的系统提示词。

## 支持的 Frontmatter 字段

| 字段              | 必填 | 描述                           |
| ----------------- | ---- | ------------------------------ |
| `name`            | 是   | 唯一标识符（小写字母和连字符） |
| `description`     | 是   | Claude 何时委托给此 Subagent   |
| `tools`           | 否   | Subagent 可以使用的工具        |
| `disallowedTools` | 否   | 拒绝的工具                     |
| `model`           | 否   | 使用的模型                     |
| `permissionMode`  | 否   | 权限模式                       |
| `maxTurns`        | 否   | Subagent 停止前的最大代理轮数  |
| `skills`          | 否   | 启动时加载的 Skills            |
| `mcpServers`      | 否   | 可用的 MCP 服务器              |
| `hooks`           | 否   | 生命周期钩子                   |
| `memory`          | 否   | 持久化内存作用域               |
| `background`      | 否   | 是否始终在后台运行             |
| `isolation`       | 否   | 是否在 git worktree 中运行     |

## CLI 方式定义 Subagent

通过 CLI 标志传递 JSON 定义会话级 Subagent：

```bash
claude --agents '{
  "code-reviewer": {
    "description": "专家代码审查员。代码变更后主动使用。",
    "prompt": "你是高级代码审查员。聚焦代码质量、安全和最佳实践。",
    "tools": ["Read", "Grep", "Glob", "Bash"],
    "model": "sonnet"
  }
}'
```

## 作用域位置

| 位置                | 作用域       | 优先级    |
| ------------------- | ------------ | --------- |
| `--agents` CLI flag | 当前会话     | 1（最高） |
| `.claude/agents/`   | 当前项目     | 2         |
| `~/.claude/agents/` | 用户所有项目 | 3         |
| 插件 `agents/` 目录 | 插件启用范围 | 4（最低） |
