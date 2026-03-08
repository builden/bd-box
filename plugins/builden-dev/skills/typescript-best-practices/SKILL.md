---
name: typescript-best-practices
description: TypeScript 高阶类型建模技巧。当需要避免使用 any 处理复杂类型时使用，包括：第三方库无类型声明、API 响应结构复杂、深度嵌套对象、需要从现有类型提取部分类型、需要防止原始类型混淆时。使用泛型、条件类型、递归类型、模板字面量、unknown + 类型守卫、Branded Types 等精确建模类型。
---

# TypeScript 类型建模技巧

本 skill 帮助开发者在遇到复杂类型时避免使用 `any`，使用 TypeScript 高阶类型技巧精确建模。

> **强制规范**：TypeScript 类型规范已移至 [rules/typescript.md](../../rules/typescript.md)，请遵守。

## 使用场景

- 第三方库没有类型定义 → 用 `declare module` + `unknown`
- 遇到不确定的类型就想要用 `any` → 用 `unknown` + 类型守卫
- 需要防止 `string` 类型混淆（如 UserId vs OrderId）→ 用 Branded Types
- 需要深度嵌套对象处理 → 用递归类型 (DeepReadonly/Partial)
- 需要从现有类型提取部分 → 用 Pick, Omit, ReturnType

[完整决策树 →](references/decision-tree.md)

## 类型建模技巧

### unknown + 类型守卫

- [unknown + 类型守卫](references/advanced-types.md)
- [条件类型提取](references/advanced-types.md)
- [Branded Types](references/advanced-types.md)

### 类型工程化

- [泛型约束](references/engineering.md)
- [递归类型](references/engineering.md)
- [联合类型分发](references/engineering.md)
- [类型测试](references/engineering.md)

### 实际案例

- [扩展无类型第三方库](references/cases/third-party.md)
- [API 响应建模](references/cases/api-response.md)
- [状态机建模](references/cases/state-machine.md)
- [深度嵌套对象处理](references/cases/deep-nested.md)

## 参考资源

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [Type Challenges](https://github.com/type-challenges/type-challenges)
- [type-level-typescript.com](https://type-level-typescript.com)
