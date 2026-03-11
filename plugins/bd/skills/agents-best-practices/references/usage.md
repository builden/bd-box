# Subagent 使用模式

## 理解自动委托

Claude 根据请求中的任务描述、Subagent 配置中的 `description` 字段和当前上下文自动委托任务。

也可以显式请求特定 Subagent：

```
使用 test-runner subagent 修复失败的测试
让 code-reviewer subagent 查看我最近的更改
```

## 前台与后台运行

- **前台 Subagent**：阻塞主对话直到完成
- **后台 Subagent**：并发运行

Claude 根据任务决定运行方式。也可以：

- 让 Claude "在后台运行"
- 按 Ctrl+B 将运行中的任务放到后台

## 常用模式

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

## 选择 Subagent 还是主对话

使用**主对话**当：

- 任务需要频繁来回或迭代细化
- 多个阶段共享重要上下文
- 快速、目标明确的更改
- 延迟重要

使用**Subagent**当：

- 任务产生大量输出
- 想要强制特定工具限制或权限
- 工作独立且可返回摘要

## 管理 Subagent 上下文

### 恢复 Subagent

每次 Subagent 调用创建新实例。要继续现有 Subagent 的工作而非重新开始：

```
继续之前的代码审查，现在分析授权逻辑
```

恢复的 Subagent 保留完整的对话历史。

### 自动压缩

Subagent 支持与主对话相同的自动压缩逻辑。压缩事件记录在 Subagent 转录文件中。
