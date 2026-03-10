# 布局复刻规范实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use builden-dev:executing-plans to implement this plan task-by-task.

**目标：** 将布局复刻规范文档实现到 bun-best-practices skill 中，建立 UI 布局调试的最佳实践

**架构：** 在 debugging 目录下新增 `layout.md` 布局调试规范，整合设计文档中的流程、原则和常见问题

**技术栈：** Markdown 文档编写

---

## 任务概览

| 任务   | 内容                                 |
| ------ | ------------------------------------ |
| 任务 1 | 创建布局调试规范文档 layout.md       |
| 任务 2 | 更新调试规范主文件 debugging.md 引用 |
| 任务 3 | 提交更改                             |

---

### 任务 1：创建布局调试规范文档 layout.md

**文件：**

- 创建：`plugins/builden-dev/skills/bun-best-practices/references/debugging/layout.md`

**步骤 1：创建 layout.md 文件**

根据设计文档创建布局调试规范，内容包括：

- 背景和设计目标
- 整体流程（精确分析 → 示意图 → 实现 → 验证）
- 7 个布局设计原则
- Tailwind 使用规范
- 调试工具规范
- 验收标准
- 常见问题速查
- 用户参与点
- 相关规范引用

**步骤 2：提交**

运行：

```bash
git add plugins/builden-dev/skills/bun-best-practices/references/debugging/layout.md
git commit -m "docs(bun-best-practices): 添加布局调试规范"
```

预期：成功创建 layout.md 文件

---

### 任务 2：更新调试规范主文件 debugging.md 引用

**文件：**

- 修改：`plugins/builden-dev/skills/bun-best-practices/references/debugging/debugging.md`

**步骤 1：更新相关规范引用**

在 "相关规范" 末尾添加布局调试规范：

```markdown
## 相关规范

- **日志规范**：[logging.md](./logging.md) - pino 配置、写入技巧
- **布局规范**：[layout.md](./layout.md) - 布局复刻流程、设计原则
- **测试规范**：[../testing/testing.md](../testing/testing.md) - 测试编写、复现问题
- **性能测试**：[../testing/performance.md](../testing/performance.md) - Mitata 基准测试
```

**步骤 2：提交**

运行：

```bash
git add plugins/builden-dev/skills/bun-best-practices/references/debugging/debugging.md
git commit -m "docs(bun-best-practices): 更新调试规范引用布局调试文档"
```

预期：成功更新 debugging.md

---

### 任务 3：提交更改

**步骤 1：检查 git 状态**

运行：

```bash
git status
```

预期：显示 layout.md 和 debugging.md 的更改

**步骤 2：确认提交**

运行：

```bash
git log --oneline -3
```

预期：显示最新的提交记录

---

## 验收标准

- [ ] layout.md 文件已创建并包含完整内容
- [ ] debugging.md 已更新引用
- [ ] git 提交成功
- [ ] 相关文档链接可访问
