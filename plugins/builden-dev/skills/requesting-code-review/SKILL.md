---
name: requesting-code-review
description: 当完成任务、实现主要功能，或在合并之前验证工作时使用。
---

# 请求代码审查

调度 builden-dev:code-reviewer 子代理来在问题级联之前捕获它们。

**核心原则：** 尽早审查，经常审查。

## 何时请求审查

**强制：**

- 子代理驱动开发中每个任务之后
- 完成主要功能之后
- 合并到 main 之前

**可选但有价值：**

- 当卡住时（新视角）
- 重构之前（基线检查）
- 修复复杂 bug 之后

## 如何请求

**1. 获取 git SHA：**

```bash
BASE_SHA=$(git rev-parse HEAD~1)  # 或 origin/main
HEAD_SHA=$(git rev-parse HEAD)
```

**2. 调度 code-reviewer 子代理：**

使用 Task 工具，类型为 builden-dev:code-reviewer，填写 `code-reviewer.md` 中的模板。

**占位符：**

- `{WHAT_WAS_IMPLEMENTED}` - 你刚刚构建的
- `{PLAN_OR_REQUIREMENTS}` - 它应该做什么
- `{BASE_SHA}` - 起始提交
- `{HEAD_SHA}` - 结束提交
- `{DESCRIPTION}` - 简要总结

**3. 处理反馈：**

- 立即修复 Critical 问题
- 在继续之前修复 Important 问题
- 记录 Minor 问题以便稍后处理
- 如果审查者错了则反击（带推理）

## 示例

```
[刚刚完成任务 2：添加验证函数]

你：让我在继续之前请求代码审查。

BASE_SHA=$(git log --oneline | grep "Task 1" | head -1 | awk '{print $1}')
HEAD_SHA=$(git rev-parse HEAD)

[调度 builden-dev:code-reviewer 子代理]
  WHAT_WAS_IMPLEMENTED: 对话索引的验证和修复函数
  PLAN_OR_REQUIREMENTS: docs/plans/deployment-plan.md 中的任务 2
  BASE_SHA: a7981ec
  HEAD_SHA: 3df7661
  DESCRIPTION: 添加了 verifyIndex() 和 repairIndex()，包含 4 种问题类型

[子代理返回]:
  优点：干净的架构、真实的测试
  问题：
    Important：缺少进度指示器
    Minor：报告间隔的幻数 (100)
  评估：可以继续

你：[修复进度指示器]
[继续任务 3]
```

## 与工作流的集成

**子代理驱动开发：**

- 每个任务后审查
- 在问题累积之前捕获
- 修复后再继续下一个任务

**执行计划：**

- 每个批次（3 个任务）后审查
- 获取反馈，应用，继续

**临时开发：**

- 合并前审查
- 卡住时审查

## 红色警示

**永远不要：**

- 因为"它很简单"就跳过审查
- 忽略 Critical 问题
- 继续未修复的 Important 问题
- 与有效的技术反馈争论

**如果审查者错了：**

- 用技术推理反击
- 展示证明其工作的代码/测试
- 请求澄清

模板见：requesting-code-review/code-reviewer.md
