# ReAct Agent

## 一句话定义

结合推理（Reasoning）和行动（Acting）的 Agent 模式，让模型先思考再行动。

## 核心思想

```
观察 → 思考 → 行动 → 观察 → ... → 结束
```

## 为什么好

**优点：**

- 可解释性强：每步都能看到思考过程
- 减少盲目执行：错误可在行动前发现
- 适应复杂任务：需要多步推理的场景

**缺点：**

- 步骤多，速度慢
- 推理成本高
- 可能陷入循环

## 适用场景

- **复杂推理任务**：数学问题、逻辑推理
- **多步骤任务**：需要规划的场景
- **需要可解释性**：需要理解 Agent 决策

## 变种

### 1. 基础 ReAct

```typescript
async function react(query: string, tools: Tool[]): Promise<string> {
  let context = query;
  let history = [];

  for (let i = 0; i < MAX_STEPS; i++) {
    // 思考
    const thought = await llm.think(context, history);

    // 判断是否需要行动
    if (needsAction(thought)) {
      const action = parseAction(thought);
      const result = await execute(action, tools);
      history.push({ thought, action, result });
      context += `\n结果: ${result}`;
    } else {
      // 直接回答
      return thought;
    }
  }
}
```

### 2. ReAct + CoT

结合思维链，推理更详细。

### 3. 反思 ReAct

加入自我反思步骤，纠正错误。

## 经典应用

- **AutoGPT**：自主 Agent
- **New Bing（早期）**：搜索 + 推理
- **BabyAGI**：任务分解 + 执行

**为什么选择**：ReAct 是最直观的 Agent 模式，适合需要推理和行动结合的任务。

## 使用边界

**何时不用：**

- 简单任务：一步完成，不需要多步推理
- 实时性要求高：每步都要调用 LLM，延迟高
- 工具很少：没有行动空间，ReAct 优势不明显

**注意事项：**

- 步数限制：设置 MAX_STEPS 防止无限循环
- 循环检测：检测重复模式，及时退出
- 工具设计：工具要足够原子化，输出要结构化
- 成本控制：每步都调用 LLM，成本需要关注

**面试常考点：**

- ReAct vs 普通 Prompt 对比
- ReAct vs ReAct + CoT 对比
- 如何防止 Agent 陷入循环
- ReAct 在 LangChain 中的实现
