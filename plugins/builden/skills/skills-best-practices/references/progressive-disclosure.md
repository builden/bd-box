# 渐进式披露模式

本文档详细介绍使用渐进式披露模式组织 Skill 内容的策略。

## 概述

渐进式披露是一种信息架构策略，仅在需要时向 Agent 展示其需要的信息。这保持上下文窗口聚焦和高效。

## 基本模式

SKILL.md 作为概述，指向需要的详细材料，类似于入职指南中的目录。

**简单的 Skill 结构：**

```
skill-name/
├── SKILL.md              # 主指令
├── FORMS.md              # 额外指南
└── reference.md          # API 参考
```

## 模式一：高级指南 + 引用

适用场景：单一主领域有多个子主题

````markdown
# PDF 处理

## 快速开始

使用 pdfplumber 提取文本：

```python
import pdfplumber
with pdfplumber.open("file.pdf") as pdf:
    text = pdf.pages[0].extract_text()
```
````

## 高级功能

**表单填写**：详见 [FORMS.md](FORMS.md)
**API 参考**：详见 [REFERENCE.md](REFERENCE.md)
**示例**：详见 [EXAMPLES.md](EXAMPLES.md)

```

## 模式二：领域特定组织

适用场景：Skill 有多个不同领域

```

bigquery-skill/
├── SKILL.md（概述和导航）
└── reference/
├── finance.md（收入、账单指标）
├── sales.md（商机、管道）
└── product.md（API 使用、功能）

````

Agent 仅在需要时读取相关领域文件。

## 模式三：条件详情

适用场景：部分功能是高级或可选的

```markdown
## 基本用法

使用 docx-js 创建新文档。

**对于修订跟踪**：详见 [REDLINING.md](REDLINING.md)
**对于 OOXML 详情**：详见 [OOXML.md](OOML.md)
````

## 重要规则

### 引用保持一级深度

**错误：**

```markdown
# SKILL.md

详见 [advanced.md](advanced.md)

# advanced.md

详见 [details.md](details.md)
```

**正确：**

```markdown
# SKILL.md

详见 [advanced.md](advanced.md)
详见 [details.md](details.md)
```

### 长文件用目录结构

对于超过 100 行的参考文件，在顶部包含目录：

```markdown
# API 参考

## 目录

- 身份验证
- 核心方法
- 高级功能
- 错误处理
- 代码示例

## 身份验证

...
```

## 目录结构示例

完整的 Skill 目录：

```
pdf/
├── SKILL.md              # 主指令（~50-200行）
├── FORMS.md              # 表单填写指南
├── REFERENCE.md          # API 参考
├── EXAMPLES.md           # 用法示例
└── scripts/
    ├── analyze_form.py   # 可执行工具
    ├── fill_form.py      # 可执行工具
    └── validate.py       # 可执行工具
```
