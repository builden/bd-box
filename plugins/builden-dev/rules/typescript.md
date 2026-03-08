---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# TypeScript 强制规范

## 禁止使用 any

- **永远禁止使用 `any`**
- 必须使用 `unknown` 替代
- 必须使用类型守卫窄化 `unknown`

## Domain Primitive 保护

- UserId、OrderId、Email 等必须使用 Branded Types
- 禁止直接使用 `string` 混淆不同域的类型

```typescript
// 错误
type UserId = string;
type OrderId = string;

// 正确
type UserId = string & { readonly brand: unique symbol };
type OrderId = string & { readonly brand: unique symbol };
```

## 第三方库类型

- 没有类型声明的库必须用 `declare module` + `unknown`
- 禁止使用 `any` 为第三方库添加类型

```typescript
// 错误
declare module "some-lib" {
  const foo: any;
}

// 正确
declare module "some-lib" {
  export function foo(input: unknown): unknown;
}
```

## 强制规则

| 场景       | 正确做法                        |
| ---------- | ------------------------------- |
| 不确定类型 | 用 `unknown`，不用 `any`        |
| 窄化类型   | 用类型守卫，不用 `as` 断言      |
| 第三方库   | 用 `declare module` + `unknown` |
| 域类型     | 用 Branded Types 防止混淆       |
