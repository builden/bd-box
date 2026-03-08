# 类型安全技巧

## 目录

- [类型选择原则](#类型选择原则)
- [unknown 是安全版 any](#unknown-是安全版-any)
- [类型守卫](#类型守卫-type-guards)
- [类型收窄](#类型收窄)
- [条件类型提取](#条件类型提取)
- [从实例推断类型](#从实例推断类型)
- [子模块类型导入问题](#子模块类型导入问题)
- [Branded Types](#branded-types)

## 类型选择原则

### type vs interface

- **优先使用 `type`**，谨慎使用 `interface`
- `interface` 更适合对象形状（更好的错误提示）
- `type` 适合联合类型、交叉类型、工具类型

```typescript
// ✅ type - 适合联合类型
type Status = "pending" | "success" | "error";
type Result<T> = { ok: true; data: T } | { ok: false; error: string };

// ✅ interface - 适合对象形状
interface User {
  id: string;
  name: string;
}

// ⚠️ 谨慎 - 复杂对象用 interface
interface Config {
  server: {
    host: string;
    port: number;
  };
}
```

### 禁止使用 enum

```typescript
// ❌ 避免 - enum
enum Direction {
  Up = "UP",
  Down = "DOWN",
}

// ✅ 推荐 - string literal union
type Direction = "UP" | "DOWN";

// 使用
function move(dir: Direction) {}
move("UP"); // 直接用字符串
```

## unknown 是"安全版 any"

永远不要用 `any`，用 `unknown` + 窄化策略。

```typescript
// ❌ 避免这样写
function process(value: any): any {
  return value.name; // 运行时可能出错
}

// ✅ 用 unknown + 窄化
function process(value: unknown): unknown {
  if (value && typeof value === "object" && "name" in value) {
    return (value as { name: string }).name;
  }
  return undefined;
}
```

**原则**：任何值都可以赋给 `unknown`，但使用前必须窄化。

### 避免 any，使用联合类型

```typescript
// ❌ 错误 - 使用 any
const opts = options as any;

// ✅ 正确 - 使用联合类型
type Options = AntDesignOptions | TailwindOptions | OklchOptions;
const opts = options as Options;
```

## 类型守卫 (Type Guards)

类型守卫是窄化 `unknown` 的利器。

### typeof 基础守卫

```typescript
function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number";
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}
```

### instanceof 守卫

```typescript
function isError(value: unknown): value is Error {
  return value instanceof Error;
}

function isDate(value: unknown): value is Date {
  return value instanceof Date;
}
```

### 自定义守卫 - 对象属性检查

```typescript
function hasProperty<T extends object>(value: unknown, key: string): value is T {
  return value !== null && typeof value === "object" && key in value;
}

// 使用示例
function handle(value: unknown) {
  if (hasProperty<{ name: string }>(value, "name")) {
    console.log(value.name); // TypeScript 知道 value 是 { name: string }
  }
}
```

### 使用守卫窄化 unknown

```typescript
function processValue(value: unknown) {
  if (isString(value)) {
    value.toUpperCase(); // TypeScript 知道 value 是 string
  } else if (isNumber(value)) {
    value.toFixed(2); // TypeScript 知道 value 是 number
  }
}
```

## 类型收窄

利用条件判断让 TypeScript 自动推断具体类型。

```typescript
function handle(options: ColorGenerateOptions) {
  if (options.algorithm === "ant-design") {
    // TypeScript 自动推断为 AntDesignOptions
    // 无需类型断言
    return options.colors;
  }
  // TypeScript 知道不是 ant-design
}
```

### 常用收窄技巧

```typescript
// in 收窄
if ("error" in response) {
  console.log(response.error); // TypeScript 知道有 error
}

// 真值收窄
if (value) {
  console.log(value.toString()); // 排除 null/undefined/0/''
}

// instanceof 收窄
if (err instanceof Error) {
  console.log(err.message); // TypeScript 知道是 Error
}
```

## 条件类型提取

用条件类型从现有类型中提取信息，而非手动定义。

### infer 关键字

从类型中提取信息：

```typescript
// 提取返回类型
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

type Fn = () => number;
type R = ReturnType<Fn>; // number

type Fn2 = (x: string) => boolean;
type R2 = ReturnType<Fn2>; // boolean
```

### Parameters 提取参数类型

```typescript
type Parameters<T> = T extends (...args: infer P) => any ? P : never;

type FnParams = Parameters<(a: string, b: number) => void>;
// Type: [string, number]

type NoParams = Parameters<() => void>;
// Type: []
```

### ElementType 提取数组元素类型

```typescript
type ElementType<T> = T extends (infer U)[] ? U : never;

type Arr = string[];
type Elem = ElementType<Arr>; // string

type Nested = (number | string)[];
type Elem2 = ElementType<Nested>; // number | string
```

### Extract 和 Exclude

```typescript
// Extract: 从 union 中提取类型
type T1 = Extract<"a" | "b" | "c", "a" | "b">; // 'a' | 'b'

// Exclude: 从 union 中排除类型
type T2 = Exclude<"a" | "b" | "c", "a">; // 'b' | 'c'

// 实用示例
type NonNull<T> = NonNullable<T>; // 排除 null 和 undefined
type T3 = NonNull<string | null | undefined>; // string
```

## 从实例推断类型

### InstanceType - 从类实例推断

```typescript
// 从类实例推断类型
type StateBlock = InstanceType<typeof md.block.State>;

// 实际应用
class UserService {
  getUser(id: string) {
    return {} as User;
  }
}

type UserServiceInstance = InstanceType<typeof UserService>;
// 相当于 UserService
```

### ReturnType - 从函数返回值推断

```typescript
// 从函数返回值推断类型
type Token = ReturnType<md.parse>[number];

// 实际应用
function getUser() {
  return { id: 1, name: "John" };
}

type User = ReturnType<typeof getUser>;
// { id: number; name: string }
```

## 子模块类型导入问题

某些库（如 markdown-it）的子模块类型无法直接从主模块导入。

### 解决方案

1. **安装 `@types/xxx` 包**
2. **使用 `InstanceType<typeof xxx>` 从实例推断**
3. **使用 `ReturnType<xxx>` 从方法返回值推断**

```typescript
// ❌ 直接导入可能失败
import type { State } from "markdown-it";

// ✅ 从实例推断
import MarkdownIt from "markdown-it";
const md = new MarkdownIt();
type State = InstanceType<typeof md.block.State>;

// ✅ 从方法推断
type Token = ReturnType<md.parse>[number];
```

## Branded Types

防止原始类型混淆，实现 nominal typing。

### 基础实现

```typescript
type Brand<K, T> = K & { __brand: T };

type UserId = Brand<string, "UserId">;
type OrderId = Brand<string, "OrderId">;
type Email = Brand<string, "Email">;
```

### 工厂函数

```typescript
function createUserId(id: string): UserId {
  return id as UserId;
}

function createOrderId(id: string): OrderId {
  return id as OrderId;
}

function createEmail(email: string): Email {
  if (!email.includes("@")) {
    throw new Error("Invalid email");
  }
  return email as Email;
}
```

### 使用场景

```typescript
// 防止混淆
const userId = createUserId("123");
const orderId = createOrderId("456");
const email = createEmail("user@example.com");

function processUser(userId: UserId, email: Email) {}
function processOrder(orderId: OrderId) {}

// 编译错误！类型不匹配
// processUser(orderId, email); // Error!
// processUser(userId, userId); // Error!
```

### 实际应用场景

- 业务 ID（UserId, OrderId, ProductId）
- 货币/单位（USD, EUR, USDollars）
- 邮箱、手机号等验证过的字符串
- 区分不同来源的配置
