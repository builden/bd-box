---
name: writing-plans
description: 当你有多步骤任务的需求或规格时，在接触代码之前使用。
---

# 编写计划

## 概述

编写全面的实施计划，假设工程师对我们的代码库没有上下文且品味可疑。记录他们需要知道的一切：每个任务要触摸哪些文件、代码、测试、他们可能需要检查的文档、如何测试。把整个计划作为小任务给他们。DRY。YAGNI。TDD。频繁提交。

假设他们是一名熟练的开发人员，但对我们的工具集或问题领域几乎一无所知。假设他们不太懂好的测试设计。

**开始时宣布：** "我正在使用 writing-plans 技能来创建实施计划。"

**上下文：** 这应该在专门的工作树中运行（由头脑风暴技能创建）。

**保存计划到：** `docs/plans/YYYY-MM-DD-<功能名>.md`

## 小任务粒度

**每个步骤是一个动作（2-5 分钟）：**

- "编写失败的测试"——步骤
- "运行它确保它失败"——步骤
- "编写最少的代码使测试通过"——步骤
- "运行测试确保它们通过"——步骤
- "提交"——步骤

## 计划文档头部

**每个计划必须以此头部开始：**

```markdown
# [功能名称] 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use builden-dev:executing-plans to implement this plan task-by-task.

**目标：** [一句话描述构建什么]

**架构：** [2-3 句话关于方法]

**技术栈：** [关键技术/库]

---
```

## 任务结构

````markdown
### 任务 N：[组件名称]

**文件：**

- 创建：`src/utils/helper.ts`
- 修改：`src/index.ts:10-20`
- 测试：`src/utils/helper.test.ts`

**步骤 1：编写失败的测试**

```typescript
import { helper } from "./helper";

describe("helper", () => {
  it("should return expected result", () => {
    expect(helper("input")).toBe("expected");
  });
});
```

**步骤 2：运行测试验证它失败**

运行：`bun test src/utils/helper.test.ts`
预期：FAIL with "helper is not defined"

**步骤 3：编写最少实现**

```typescript
export function helper(input: string): string {
  return "expected";
}
```

**步骤 4：运行测试验证它通过**

运行：`bun test src/utils/helper.test.ts`
预期：PASS

**步骤 5：提交**

```bash
git add src/utils/helper.test.ts src/utils/helper.ts
git commit -m "feat: add helper function"
```
````

## TypeScript 规范

- 使用 strict 模式
- 避免使用 `any`，使用 `unknown` + 类型守卫
- 优先使用类型推断
- 接口优于类型别名（除非需要联合/交叉）

## 记住

- 始终使用精确的文件路径
- 计划中的完整代码（不是"添加验证"）
- 带有预期输出的精确命令
- 使用 @ 语法引用相关技能
- DRY、YAGNI、TDD、频繁提交

## 执行交接

保存计划后，提供执行选择：

**"计划完成并保存到 `docs/plans/<filename>.md`。两种执行选项：**

**1. 子代理驱动（此会话）** - 我为每个任务调度新的子代理，任务之间审查，快速迭代

**2. 并行会话（单独）** - 在工作树中打开新会话使用 executing-plans，带检查点的批量执行

**哪种方法？**

**如果选择子代理驱动：**

- **必需子技能：** 使用 builden-dev:subagent-driven-development
- 留在当前会话
- 每个任务新子代理 + 代码审查

**如果选择并行会话：**

- 引导他们在工作树中打开新会话
- **必需子技能：** 新会话使用 builden-dev:executing-plans
