# Reflection (自我反思)

## 一句话定义

Agent 反思执行过程和结果，从错误中学习并修正。

## 核心思想

```
执行 → 评估结果 → 反思 → 修正 → 重试
```

## 为什么好

**优点：**

- 减少重复错误：学会从失败中学习
- 提高成功率：通过反思改进
- 适应复杂环境：动态调整策略

**缺点：**

- 实现复杂：需要评估和反思机制
- 成本增加：额外的反思步骤
- 依赖评估质量：评估器可能出错

## 适用场景

- **复杂任务**：需要多轮尝试
- **容错要求高**：不能一次失败
- **自我改进**：需要持续优化

## 变种

### 1. 错误反思

失败后反思：

```typescript
async function reflectiveExecute(task: string): Promise<Result> {
  for (let i = 0; i < MAX_RETRIES; i++) {
    const result = await execute(task);

    if (result.success) {
      return result;
    }

    // 反思失败原因
    const reflection = await reflect(result);
    task = await adjust(task, reflection);
  }
}
```

### 2. 连续反思

每步后持续评估：

```typescript
async function continuousReflect(task: string): Promise<Result> {
  let context = task;

  while (!isComplete(context)) {
    const step = await nextStep(context);
    const result = await execute(step);

    // 每步后反思
    const reflection = await reflect(step, result);
    context = update(context, reflection);
  }
}
```

### 3. 外部反馈

结合外部评估器：

```typescript
async function externalReflect(task: string): Promise<Result> {
  let attempt = 0;

  while (attempt < MAX_ATTEMPTS) {
    const result = await execute(task);

    // 外部评估
    const evaluation = await externalEvaluator.evaluate(result);

    if (evaluation.passed) {
      return result;
    }

    // 结合外部反馈反思
    const reflection = await reflect(result, evaluation.feedback);
    task = adjust(task, reflection);
    attempt++;
  }
}
```

## 经典应用

- **Reflexion**：Stanford 提出的反思框架
- **Self-RAG**：反思 + RAG
- **GitHub Copilot**：代码生成后的反思

**为什么选择**：Reflection 让 Agent 具有学习能力，从失败中改进是智能的重要标志。

## 使用边界

**何时不用：**

- 简单任务：一次成功，不需要反思
- 成本敏感：反思增加额外调用，成本倍增
- 实时性要求高：反思增加延迟

**注意事项：**

- 反思深度：不是反思越多越好，需要平衡
- 评估器质量：反思依赖准确的评估，否则会"反思"错误方向
- 无限循环：防止反复失败-反思-失败
- 记忆机制：反思结果需要存储，供后续使用

**面试常考点：**

- Reflection 原理
- Reflection vs ReAct 对比
- Reflexion 框架
- 评估器设计
- Reflection 在代码生成中的应用
