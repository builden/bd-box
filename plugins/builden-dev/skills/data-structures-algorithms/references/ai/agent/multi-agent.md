# Multi-Agent (多 Agent 协作)

## 一句话定义

多个 Agent 协同工作，分工合作解决复杂任务。

## 核心思想

```
Agent A → Agent B → Agent C → 汇总结果
   ↓         ↓         ↓
  角色A     角色B     角色C
```

## 为什么好

**优点：**

- 分工专业化：每个 Agent 专注特定任务
- 能力叠加：突破单 Agent 能力边界
- 解决复杂任务：单一 Agent 无法完成

**缺点：**

- 协调复杂：Agent 间通信
- 成本倍增：多个 Agent 调用
- 可能产生冲突：Agent 意见不一致

## 适用场景

- **软件开发**：多个 Agent 分别负责设计、编码、测试
- **复杂决策**：多角度分析
- **多模态任务**：不同类型内容处理

## 变种

### 1. 角色分工

```typescript
const agents = {
  planner: createAgent("规划师", "制定计划"),
  coder: createAgent("工程师", "写代码"),
  reviewer: createAgent("审查员", "审查代码"),
};

// 协作流程
const plan = await planner.execute(task);
const code = await coder.execute(plan);
const review = await reviewer.execute(code);
```

### 2. 辩论模式

多个 Agent 辩论，取最优：

```typescript
// 两个 Agent 辩论
const agent1 = createAgent("正方", "提出观点");
const agent2 = createAgent("反方", "反驳观点");

for (let i = 0; i < ROUNDS; i++) {
  const argument1 = await agent1.debate(topic);
  const argument2 = await agent2.debate(topic, argument1);
}
```

### 3. 层级结构

上级分配任务，下级执行：

```
Boss Agent
  ├── Worker Agent A
  ├── Worker Agent B
  └── Worker Agent C
```

## 经典应用

- **ChatDev**：虚拟软件公司
- **MetaGPT**：多角色软件团队
- **CAMEL**：角色扮演 Agent
- **AutoGen**：Microsoft 多 Agent 框架

**为什么选择**：复杂任务需要多种能力，多 Agent 协作是必然选择。

## 使用边界

**何时不用：**

- 简单任务：单 Agent 足够
- 成本敏感：多 Agent 成本倍增
- 实时性要求高：协调增加延迟

**注意事项：**

- Agent 数量：不是越多越好，通常 2-5 个
- 角色定义：每个 Agent 角色要清晰，避免职责重叠
- 通信协议：Agent 间传递信息要结构化
- 冲突处理：Agent 意见不一致时如何决策

**面试常考点：**

- Multi-Agent 架构模式
- Agent 间通信方式
- Multi-Agent vs 单 Agent 对比
- ChatDev / MetaGPT 架构
- Agent 冲突解决策略
