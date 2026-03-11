# Chain of Thought (CoT)

## 一句话定义

思维链推理，让模型显式展示推理过程，提升复杂任务表现。

## 核心思想

```
问题 → 逐步推理 → 答案
```

通过引导词如 "Let's think step by step" 触发。

## 为什么好

**优点：**

- 显著提升推理能力：数学、逻辑任务大幅提升
- 可解释性强：能看到推理过程
- 无需微调：只需提示词

**缺点：**

- 需要合适的触发词
- 对小模型效果差
- 推理长度不可控

## 适用场景

- **数学推理**：计算题、证明题
- **逻辑推理**：演绎、归纳
- **代码生成**：复杂算法实现
- **多步骤问题**：需要分解的任务

## 变种

### 1. Few-shot CoT

提供推理示例：

```
问题: 5 * 6 = ?
解答: 5 * 6 = 30

问题: 12 + 7 = ?
解答: 12 + 7 = 19

问题: [新问题]
解答:
```

### 2. Self-Consistency

多路径推理，投票选择最优答案：

```typescript
async function selfConsistency(query: string): Promise<string> {
  const answers = [];
  for (let i = 0; i < N; i++) {
    const answer = await llm.generate(query, {
      prefix: "Let's think step by step",
    });
    answers.push(parseAnswer(answer));
  }
  return vote(answers); // 投票
}
```

### 3. Tree of Thoughts

多思维分支，探索多种推理路径。

## 经典应用

- **GPT-4**：内置 CoT 能力
- **PaLM**：Google 大模型
- **Claude**：思维链能力

**为什么选择**：CoT 是大模型最重要的推理技术之一，简单有效。

## 使用边界

**何时不用：**

- 简单任务：不需要复杂推理，直接回答即可
- 小模型（<10B）：CoT 效果差，可能幻觉更严重
- 实时性要求高：推理增加延迟

**注意事项：**

- 模型规模：CoT 对大模型（>10B）效果显著，小模型可能适得其反
- 触发词："Let's think step by step" 是经典触发词
- 示例质量：Few-shot 示例要准确、推理过程要完整
- 推理长度：输出可能很长，需要控制成本

**面试常考点：**

- CoT 原理，为什么有效
- CoT vs 普通 Prompt 对比
- Few-shot CoT vs Zero-shot CoT
- Self-Consistency 原理
- Tree of Thoughts vs CoT
