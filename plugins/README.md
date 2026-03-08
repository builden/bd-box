# Builden Plugins

本目录包含 builden 插件系统的所有插件。

## 插件概览

### builden - 核心插件

| Skill                 | 用途                               | 依赖                |
| --------------------- | ---------------------------------- | ------------------- |
| git-src               | 管理本地 Git 仓库供 Agent 参考源码 | -                   |
| skills-best-practices | Skill 最佳实践                     | disciplined-testing |
| agents-best-practices | Agent 最佳实践                     | -                   |
| disciplined-testing   | 纪律性测试框架（通用）             | -                   |

### builden-dev - 开发技巧插件

| Skill                     | 用途                    | 依赖 |
| ------------------------- | ----------------------- | ---- |
| bun-best-practices        | Bun 运行时开发技巧      | -    |
| typescript-best-practices | TypeScript 高阶类型建模 | -    |

## 依赖关系图

```
builden:skills-best-practices
    ↓ 依赖
builden:disciplined-testing
```

## 常见 Workflow

### 创建/优化 Skill

1. 使用 `/builden:build-skill` 命令
2. 遵循 TDD 流程
3. 使用 `builden:disciplined-testing` 进行压力测试

### 纪律性测试流程（通用）

1. **RED**：设计压力场景，不带约束运行，记录 Agent 失败
2. **GREEN**：编写约束规则
3. **REFACTOR**：堵住理性化漏洞，重新测试

详见 [disciplined-testing skill](builden/skills/disciplined-testing/SKILL.md)。

## 插件说明

### trans-\* 前缀的插件

以 `trans-` 前缀开头的插件为参考插件，用于学习其他插件系统的设计模式，无需关注。
