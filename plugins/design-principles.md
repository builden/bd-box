# Claude Code 按需加载设计原则

本文档定义 plugins 目录下的文件组织原则，适用于所有 skill 和 rule 文件。

## 核心理念

**20/80 原则**：Agent 只需加载最少信息就能解决 80% 的问题，剩下 20% 需要时才深入详细文档。

## 分层结构

```
┌─────────────────────────────────────────────────────────────┐
│ ~/.claude/CLAUDE.md                                        │  ← 每次会话加载
├─────────────────────────────────────────────────────────────┤
│ plugins/bd-dev/rules/*.md                             │  ← 按需加载 rules
├─────────────────────────────────────────────────────────────┤
│ plugins/xxx/SKILL.md                                       │  ← 使用 skill 时加载
├─────────────────────────────────────────────────────────────┤
│ plugins/xxx/README.md                                      │  ← 需要详细了解时加载
├─────────────────────────────────────────────────────────────┤
│ plugins/xxx/references/*.md                                │  ← 特定场景深入查阅
└─────────────────────────────────────────────────────────────┘
```

## 各层级职责

### 1. CLAUDE.md（全局宪法）

**位置**：`~/.claude/CLAUDE.md`

**触发时机**：每次会话开始

**职责**：

- 核心原则（输出标准、决策底线、方法论）
- 交互规范（称呼、沟通方式）
- 少量关键约束（必须使用 bun、commit 前询问）
- 引用 rules

**内容原则**：

- 保持精简（< 100 行）
- 只包含 80% 场景需要的准则
- 详细规范引用到 rules

### 2. Rules（项目约束）

**位置**：`plugins/bd-dev/rules/*.md`

**触发时机**：

- 加载 rules 时
- 遇到特定技术问题时

**职责**：

- 项目级技术约束
- 精简的决策规则
- 引用详细规范

**内容原则**：

- 每个 rule 文件聚焦一个领域（toolchain、security、bun 等）
- 保持精简（< 50 行）
- 详细规范引用到 SKILL

### 3. SKILL.md（Agent 快速决策）

**位置**：`plugins/xxx/SKILL.md`

**触发时机**：使用该 skill 时

**职责**：

- 快速决策入口
- 常用操作命令
- 调试优先级
- 引用详细规范

**内容原则**：

- 保持精简（30-50 行）
- 解决 80% 常见问题
- 按需加载时只显示必要信息

### 4. README.md（开发者手册）

**位置**：`plugins/xxx/README.md`

**触发时机**：

- 需要了解整体架构时
- 开发者自行查阅

**职责**：

- 文件职责划分
- 完整的开发流程图表
- 使用场景速查

**内容原则**：

- 包含 mermaid 流程图
- 详细但非冗余
- 供人类开发者查阅

### 5. References（详细规范）

**位置**：`plugins/xxx/references/*.md`

**触发时机**：特定场景需要深入时

**职责**：

- 详细技术规范
- 代码模板
- 完整配置示例

**内容原则**：

- 按阶段/领域分类目录
- 特定场景的完整解决方案
- Agent 按需加载

## 按阶段分类示例

```
references/
├── testing/        # 测试阶段相关
├── debugging/      # 调试阶段相关
├── setup/          # 项目搭建相关
├── publishing/      # 发布阶段相关
└── troubleshooting/ # 避坑指南
```

## 设计检查清单

新建文件时检查：

- [ ] 是否符合 20/80 原则？
- [ ] 应该放在哪一层级？
- [ ] 是否需要拆分子目录？
- [ ] 引用路径是否正确？
- [ ] SKILL.md 是否需要更新？

## 引用路径规范

| 层级       | 引用同级  | 引用其他层级            |
| ---------- | --------- | ----------------------- |
| CLAUDE.md  | -         | rules/xxx.md            |
| rules      | -         | SKILL.md                |
| SKILL.md   | -         | README.md / references/ |
| README.md  | -         | references/             |
| references | ../xxx.md | ../../other/            |

## 示例：bun-best-practices

```
bun-best-practices/
├── SKILL.md                    # Agent 入口（~30 行）
├── README.md                   # 开发者手册（~250 行 + mermaid）
└── references/
    ├── testing/                # 测试阶段
    │   ├── testing.md
    │   ├── performance.md
    │   └── playwright.md
    ├── debugging/              # 调试阶段
    │   ├── logging.md
    │   └── debugging.md
    ├── setup/                  # 项目搭建
    │   ├── monorepo.md
    │   └── gitignore.md
    ├── publishing/             # 发布阶段
    │   └── package-publishing.md
    └── troubleshooting/        # 避坑指南
        └── common-mistakes.md
```

## 关键词

- **按需加载**：只在需要时加载详细文档
- **最少信息**：Agent 只需知道解决 80% 问题的信息
- **引用链**：层层引用，形成完整知识网络
- **职责清晰**：每个文件有明确定位
