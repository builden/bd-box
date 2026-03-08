---
name: typescript-best-practices
description: TypeScript 高阶类型建模技巧。用于避免使用 any 处理复杂类型：第三方库无类型声明、API 响应结构复杂、深度嵌套对象、需要从现有类型提取部分类型、需要防止原始类型混淆时。使用泛型、条件类型、递归类型、模板字面量、unknown + 类型守卫、Barnded Types 等精确建模类型。
---

# TypeScript Export Skill

本 skill 帮助开发者在遇到复杂类型时避免使用 `any`，使用 TypeScript 高阶类型技巧精确建模。

## 何时使用

- 第三方库没有类型定义时 → 使用 `declare module` + `unknown`
- API 响应结构复杂时 → 使用条件类型提取 + 模板字面量
- 需要创建可复用的类型工具时 → 使用泛型约束
- 遇到"不知道用什么类型"就想要用 `any` 时 → 使用 `unknown` + 类型守卫
- 需要深度嵌套类型处理时 → 使用递归类型 (DeepReadonly/Partial)

## 快速决策树

```
1. 第三方库无类型？
   → declare module 扩展 + unknown

2. 复杂嵌套对象？
   → 递归类型 (DeepReadonly/Partial)

3. 多个可能类型？
   → 联合类型 + discriminated unions

4. 需要从现有类型提取部分？
   → Pick, Omit, Extract

5. 需要从函数提取返回类型？
   → ReturnType<typeof fn>

6. 需要防止原始类型混淆？
   → Branded Types

7. 都不确定，但需要安全处理？
   → unknown + 类型守卫
```

## 核心原则

1. **永远优先用 `unknown` 而非 `any`**
2. **用类型守卫窄化 unknown**
3. **用泛型构建可复用的类型工具**
4. **用条件类型提取而非手动定义**
5. **用 Branded Types 防止 domain primitive 混淆**

## 详细参考

### 轨道 1: 类型安全技巧

- [unknown + 类型守卫](references/advanced-types.md#unknown-安全版-any)
- [条件类型提取 (infer, ReturnType, Parameters)](references/advanced-types.md#条件类型提取)
- [Branded Types 防止原始类型混淆](references/advanced-types.md#branded-types)

### 轨道 2: 类型工程化

- [泛型约束精确建模](references/engineering.md#泛型约束)
- [递归类型 (DeepReadonly/Partial)](references/engineering.md#递归类型)
- [联合类型分发](references/engineering.md#联合类型分发)
- [类型测试 (expectTypeOf, AssertEqual)](references/engineering.md#类型测试)

### 实际案例

- [扩展无类型第三方库](references/cases/third-party.md)
- [API 响应建模](references/cases/api-response.md)
- [状态机建模](references/cases/state-machine.md)
- [深度嵌套对象处理](references/cases/deep-nested.md)

## 参考资源

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [Type Challenges](https://github.com/type-challenges/type-challenges)
- [type-level-typescript.com](https://type-level-typescript.com)
