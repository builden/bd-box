---
name: requesting-code-review
description: 当完成任务、实现主要功能，或在合并之前验证工作时使用。
---

# 请求代码审查

采用**三阶段审查**确保代码质量：

1. **plan-reviewer** - 验证实现是否符合原始计划
2. **code-reviewer** - 检查代码质量、性能、最佳实践
3. **security-reviewer** - 安全审查（如涉及用户输入、认证、敏感数据）

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
- 处理用户输入或敏感数据时

## 审查流程

### 阶段 1：plan-reviewer

使用 `builden-dev:plan-reviewer` 子代理，验证：

- 实现是否与原始计划对齐
- 架构是否符合 SOLID 原则
- 计划功能是否全部实现

### 阶段 2：code-reviewer

使用 `builden-dev:code-reviewer` 子代理，检查：

- 代码简洁性和可读性
- 错误处理和类型安全
- 性能考虑
- 测试覆盖率

### 阶段 3：security-reviewer（如适用）

使用 `builden-dev:security-reviewer` 子代理，检查：

- 硬编码凭证
- SQL 注入
- XSS 漏洞
- 认证/授权问题
- 依赖安全

## 如何请求

**1. 获取 git SHA：**

```bash
BASE_SHA=$(git rev-parse HEAD~1)
HEAD_SHA=$(git rev-parse HEAD)
```

**2. 按顺序调度审查代理：**

```
builden-dev:plan-reviewer → builden-dev:code-reviewer → builden-dev:security-reviewer（可选）
```

**3. 处理反馈：**

- 立即修复 Critical 问题
- 在继续之前修复 Important 问题
- 记录 Minor 问题以便稍后处理
- 如果审查者错了则反击（带推理）

## 示例

```
[刚刚完成任务 2：添加用户认证]

你：让我请求代码审查。

BASE_SHA=$(git log --oneline | grep "Task 1" | head -1 | awk '{print $1}')
HEAD_SHA=$(git rev-parse HEAD)

[调度 builden-dev:plan-reviewer]
  - 验证实现是否符合计划
  - 结果：符合计划，架构合理

[调度 builden-dev:code-reviewer]
  - 检查代码质量
  - 结果：1个 Important 问题需要修复

[修复问题]
[继续任务 3]
```

## 与工作流的集成

**子代理驱动开发：**

- 每个任务后执行完整三阶段审查
- 在问题累积之前捕获
- 修复后再继续下一个任务

**执行计划：**

- 每个批次（3 个任务）后审查
- 获取反馈，应用，继续

**临时开发：**

- 合并前完整审查
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
