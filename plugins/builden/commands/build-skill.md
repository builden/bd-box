---
description: 使用 TDD 流程创建或优化 Skills
---

# Skill 创建/优化向导

我将引导你完成 TDD for Skills 流程。

## 自然语言意图识别

如果用户输入包含以下意图，直接进入对应分支：

### 创建新 Skill

识别关键词：

- "创建 xxx skill"
- "我要创建 xxx"
- "新增一个 xxx skill"
- "做一个 xxx 的 skill"

### 优化现有 Skill

识别关键词：

- "优化 xxx skill"
- "我要优化 xxx"
- "改进 xxx skill"
- "完善 xxx"

### 问题描述

识别关键词：

- "问题：" 后跟问题描述
- "问题是" 后跟问题描述
- 直接描述观察到的问题

示例：

- `/builden:build-skill 创建 processing-pdfs skill`
- `/builden:build-skill 优化 git-src，问题是 Agent 不查看源码直接使用第三方库`
- `/builden:build-skill 我要做一个处理 PDF 的 skill`

## 信息不足时的交互流程

如果用户只说"创建 skill"或"优化 skill"而没有提供足够信息，使用 **AskUserQuestion** 工具询问：

### 第 1 步：选择操作

使用 AskUserQuestion 工具：

```json
{
  "question": "你想要创建新 Skill 还是优化现有 Skill？",
  "header": "操作类型",
  "options": [
    { "label": "创建新 Skill", "description": "为新技术/模式创建参考指南" },
    { "label": "优化现有 Skill", "description": "改进已有 Skill 的效果" }
  ],
  "multiSelect": false
}
```

### 第 2 步（创建新 Skill）

使用 AskUserQuestion 工具：

```json
{
  "question": "请提供：1) Skill 名称 2) 描述 3) 要解决的问题",
  "header": "新 Skill 信息",
  "options": [],
  "multiSelect": false
}
```

### 第 2 步（优化现有 Skill）

使用 AskUserQuestion 工具：

```json
{
  "question": "请提供：1) 要优化的 Skill 名称 2) 观察到的问题 3) 具体场景",
  "header": "优化信息",
  "options": [],
  "multiSelect": false
}
```

进入对应分支后，遵循 TDD for Skills 流程：

1. RED：运行子代理验证基线行为
2. GREEN：编写 Skill 改进
3. REFACTOR：添加理性化防御
