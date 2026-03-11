---
name: skills-best-practices
description: 提供编写高效 Agent Skills 的指南。用于创建、改进或评估 Skills，或当用户询问 Skill 最佳实践、结构或模式时触发。
---

# Skill 创作最佳实践

本 Skill 提供有关编写高效 Agent Skills 的指南，帮助 Agent 能够成功发现和使用这些 Skills。

## 概述

优秀的 Skills 具有简洁、结构良好且经过真实使用测试的特点。本 Skill 涵盖：

- 编写 Skills 的核心原则
- Skill 结构与命名规范
- 渐进式披露模式
- 工作流与反馈循环
- 评估与迭代策略

## 核心原则

### 简洁至上

上下文窗口是公共资源。你的 Skill 与 Agent 需要了解的所有其他内容共享上下文窗口。只添加 Agent 没有的上下文。

**需要问自己的关键问题：**

- Agent 真的需要这个解释吗？
- 我能否假设 Agent 已经知道这些？
- 这段话是否值得其 token 消耗？

详见 [references/progressive-disclosure.md](references/progressive-disclosure.md)。

### 设置适当的自由度

根据任务的脆弱性和可变性选择具体的程度。

- **高自由度**（基于文本的指令）：当有多种有效方法时使用
- **中等自由度**（伪代码/脚本）：当存在首选模式时使用
- **低自由度**（特定脚本）：当操作脆弱且一致性至关重要时使用

详见 [references/workflows.md](references/workflows.md)。

### 使用多种模型测试

Skills 作为模型的附加功能，其效果取决于底层模型。使用不同模型测试你的 Skill。

## Skill 结构

### 命名规范

Skill 名称使用**动名词形式**（动词 + -ing）：

- `processing-pdfs`
- `analyzing-spreadsheets`
- `managing-databases`

**要求：**

- 最多 64 个字符
- 只能使用小写字母、数字和连字符
- 不能包含 XML 标签或保留字

### 编写有效的描述

`description` 字段支持 Skill 发现。应包含 Skill 的**作用**和**使用场景**。

**始终使用第三人称：**

- ✓ "处理 Excel 文件并生成报告"
- ✗ "我可以帮助你处理 Excel 文件"

**要具体并包含关键词：**

```yaml
description: 从 PDF 文件提取文本和表格，填写表单，合并文档。当处理 PDF 文件或用户提到 PDF、表单或文档提取时使用。
```

详见 [references/progressive-disclosure.md](references/progressive-disclosure.md)。

## 渐进式披露

保持 SKILL.md 正文在 500 行以内。使用单独的参考文件存储详细内容：

```
skill-name/
├── SKILL.md              # 主指令（触发时加载）
├── FORMS.md              # 表单填写指南（按需加载）
├── reference.md          # API 参考（按需加载）
└── scripts/
    ├── analyze.py        # 实用脚本（执行，不加载）
    └── validate.py       # 验证脚本
```

**重要：** 保持引用从 SKILL.md 出发仅一级深度。

详见 [references/progressive-disclosure.md](references/progressive-disclosure.md)。

## 工作流与反馈循环

### 复杂任务使用工作流

将复杂操作分解为清晰的顺序步骤。使用清单跟踪进度。

详见 [references/workflows.md](references/workflows.md)。

### 实现反馈循环

**常见模式：** 运行验证器 → 修复错误 → 重复

此模式可显著提高输出质量。

详见 [references/workflows.md](references/workflows.md)。

## 评估与迭代

### 先构建评估

在编写大量文档之前先创建评估。这确保你的 Skill 解决的是真实问题而非想象的问题。

**评估驱动开发：**

1. 识别差距：在没有 Skill 的情况下运行 Agent，记录失败
2. 创建评估：构建测试这些差距的场景
3. 建立基准：测量没有 Skill 时 Agent 的表现
4. 编写最小指令：创建足以通过评估的内容
5. 迭代：执行评估，与基准比较并改进

详见 [references/evaluation.md](references/evaluation.md)。

### 纪律性 Skills 的专门测试

对于强制执行 discipline 的 Skills（如 TDD、代码审查要求），使用与通用评估不同的专门测试方法。这些 Skills 需要抵抗 Agent 的"理性化"倾向——即 Agent 为自己的违规行为寻找借口的能力。

**为什么需要专门测试：**

- 纪律性 Skills 有compliance costs（时间、精力、重构）
- Agent 有动机绕过规则（"就这一次"）
- 压力下 Agent 会选择捷径而非规则

详见 [disciplined-testing skill](../disciplined-testing/SKILL.md)。

### 迭代开发 Skills

使用一个 Agent 实例创建供其他实例使用的 Skill。使用真实工作流测试并根据观察迭代。

详见 [references/evaluation.md](references/evaluation.md)。

## 常见模式

### 模板模式

为输出格式提供模板。根据需要匹配严格程度。

### 示例模式

对于输出质量依赖于示例的 Skills，提供输入/输出对。

### 条件工作流模式

通过清晰的分支引导 Agent 做出决策。

详见 [references/patterns.md](references/patterns.md)。

## 需要避免的反模式

- **Windows 风格路径**：使用正斜杠（`scripts/helper.py`）
- **选项过多**：提供默认选项并提供退出方案
- **时间敏感信息**：使用"旧模式"部分存储已弃用的信息

## 下一步

使用 **disciplined-testing** skill 进行测试驱动优化：

1. 调用 `builden:disciplined-testing` skill
2. 按照 RED → GREEN → REFACTOR 循环进行
3. 迭代直到 Skill 防弹
