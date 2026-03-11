# Plan-Execute (计划执行)

## 一句话定义

先规划再执行的两阶段模式，先生成完整计划，再逐步执行。

## 核心思想

```
任务 → 生成计划 → 逐步执行 → 反馈调整 → 完成
```

## 为什么好

**优点：**

- 明确方向：先有全局计划
- 适合复杂任务：多步骤任务
- 可干预：执行前可审查计划

**缺点：**

- 计划可能错误：依赖规划能力
- 不适应变化：动态任务需要调整
- 灵活性差：过于死板

## 适用场景

- **复杂项目**：软件开发、项目管理
- **多步骤任务**：需要明确步骤
- **需要审查**：计划需要人工确认

## 变种

### 1. 一次性计划

先生成完整计划，再执行：

```typescript
async function planAndExecute(task: string): Promise<Result> {
  // 阶段1: 规划
  const plan = await planner.generate(task);

  // 阶段2: 执行
  const results = [];
  for (const step of plan.steps) {
    const result = await executor.execute(step);
    results.push(result);

    // 可选: 每步后检查
    if (!check(result)) {
      // 重新规划
      plan = await planner.replan(task, results);
    }
  }

  return aggregate(results);
}
```

### 2. 动态计划

边执行边调整：

```typescript
async function dynamicExecute(task: string): Promise<Result> {
  let plan = await planner.generate(task);

  while (!plan.isComplete) {
    const nextStep = plan.nextStep();
    const result = await executor.execute(nextStep);

    plan = await planner.update(plan, result);

    // 根据结果动态调整
    if (plan.needsReplan()) {
      plan = await planner.replan(task, plan.completedSteps);
    }
  }
}
```

### 3. 层级计划

多层分解，大计划包含小计划：

```
Master Plan
  ├── Sub-Plan A
  │   ├── Step A1
  │   └── Step A2
  └── Sub-Plan B
      ├── Step B1
      └── Step B2
```

## 经典应用

- **BabyAGI**：经典 Plan-Execute 实现
- **LangChain Agents**：ReAct 模式的 Plan 版本
- **OpenAI Function Agents**：支持计划执行

**为什么选择**：Plan-Execute 是处理复杂任务的基础模式，明确的计划让执行更有方向。

## 使用边界

**何时不用：**

- 简单任务：一步完成，不需要计划
- 动态变化：任务可能随时变化，计划赶不上变化
- 实时性：计划阶段增加延迟

**注意事项：**

- 计划粒度：计划太粗执行困难，太细灵活性差
- 计划验证：执行前应验证计划可行性
- 失败恢复：某步失败后如何重试或调整计划
- 人工介入：可让用户审批计划后再执行

**面试常考点：**

- Plan-Execute vs ReAct 对比
- 如何评估计划质量
- 计划失败如何处理
- BabyAGI 原理
- 动态重规划策略
