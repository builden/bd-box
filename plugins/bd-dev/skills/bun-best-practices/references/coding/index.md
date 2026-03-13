# 编码指南

本节涵盖编码阶段的最佳实践：测试驱动开发、性能优化、代码重构。

## 目录

| 文件                               | 说明                           |
| ---------------------------------- | ------------------------------ |
| [testing.md](./testing.md)         | 测试框架、覆盖率要求、运行命令 |
| [performance.md](./performance.md) | 性能基准测试（Mitata）         |
| [playwright.md](./playwright.md)   | E2E 测试                       |
| [refactoring.md](./refactoring.md) | 大型重构规范                   |
| [runtime.md](./runtime.md)         | PTY + WebSocket 运行时技巧     |

---

## TDD 流程

```
1. 写测试（红色）→ 2. 写实现（绿色）→ 3. 重构（蓝色）
```

**重构是编码的自然延伸**，不是独立阶段。每次测试通过后都应该考虑是否有可优化之处。

---

## 测试覆盖原则

- **整体覆盖率 ≥ 80%**
- **新增代码覆盖率 ≥ 90%**
- 必须覆盖真实用户场景

---

## 快速命令

```bash
bun test                    # 单元 + 集成测试
bun test --coverage         # 带覆盖率
bun run test:e2e            # Playwright E2E（无 UI）
bun run test:smoke          # 冒烟测试（带 UI）
bun run test:bench          # 性能基准测试
```

---

## 重构时机

| 场景     | 动作                     |
| -------- | ------------------------ |
| 小改进   | 随时进行，提交时附带     |
| 大型重构 | 使用 refactoring.md 规范 |
| 代码审查 | 发现问题时记录，后续处理 |

详见 [refactoring.md](./refactoring.md)
