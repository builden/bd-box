# Tool Use (工具调用)

## 一句话定义

Agent 调用外部工具扩展能力，突破模型知识截止日期。

## 核心思想

```
模型 → 判断需要工具 → 调用工具 → 获取结果 → 继续或回答
```

## 为什么好

**优点：**

- 突破知识限制：实时信息、数据库
- 扩展能力边界：计算、搜索、执行
- 标准化接口：Function Calling

**缺点：**

- 需要定义工具 schema
- 工具选择可能出错
- 工具返回需要正确解析

## 适用场景

- **实时信息**：天气、新闻、股价
- **数据库查询**：业务数据获取
- **API 调用**：第三方服务
- **计算任务**：复杂计算

## 变种

### 1. Function Calling

标准化函数调用接口：

```typescript
// 定义工具
const tools = [
  {
    name: "get_weather",
    description: "获取天气信息",
    parameters: {
      type: "object",
      properties: {
        city: { type: "string" },
      },
    },
  },
];

// 使用
const response = await llm.chat({
  messages: [{ role: "user", content: "北京天气如何?" }],
  tools,
});

// LLM 返回调用请求
if (response.tool_calls) {
  const result = await execute(response.tool_calls[0]);
  // 将结果返回给 LLM
}
```

### 2. Tool Pool

多个工具可选，模型选择：

```typescript
const toolPool = [search, calculator, database, email];
// 模型根据任务选择合适的工具
```

### 3. 工具编排

多个工具串联完成复杂任务：

```
搜索 → 提取数据 → 发送邮件
```

## 经典应用

- **GPT-4 Function Calling**
- **Claude Tool Use**
- **LangChain Agents**
- **OpenAI Assistants API**

**为什么选择**：Tool Use 是 Agent 实际落地的关键，让大模型真正"能用"外部世界。

## 使用边界

**何时不用：**

- 纯文本任务：不需要外部能力
- 工具很慢：每个工具调用都有延迟
- 工具不可靠：需要处理工具失败

**注意事项：**

- 工具描述：description 要清晰准确，帮助模型选择
- 参数设计：参数要精简、必要，复杂参数易出错
- 错误处理：工具可能失败，需要降级策略
- 工具循环：防止无限调用工具，需要步数限制

**面试常考点：**

- Function Calling 原理
- Tool Use vs ReAct 对比
- 如何设计好的工具 schema
- 工具调用失败处理
- LangChain Agent 中的 Tool Use
