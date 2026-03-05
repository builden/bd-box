# 类型工程化

用泛型构建可复用的类型工具。

## 泛型约束

用 `extends` 约束精确建模。

### extends 基础约束

```typescript
interface HasLength {
  length: number;
}

function logLength<T extends HasLength>(item: T): T {
  console.log(item.length);
  return item;
}

logLength("hello"); // OK: string 有 length
logLength([1, 2, 3]); // OK: array 有 length
logLength({ length: 10 }); // OK: object 有 length
// logLength(42); // Error: number 没有 length
```

### 多类型参数

```typescript
function merge<T, U>(obj1: T, obj2: U): T & U {
  return { ...obj1, ...obj2 };
}

const merged = merge({ name: "John" }, { age: 30 });
// Type: { name: string } & { age: number }
```

### keyof 约束

```typescript
function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const obj = { a: 1, b: "hello" };
getProp(obj, "a"); // OK: returns 1
getProp(obj, "b"); // OK: returns 'hello'
// getProp(obj, 'c'); // Error: 'c' 不在 keyof T 中
```

### 常用约束模式

```typescript
// 构造函数约束
class Class<T extends new (...args: any[]) => any> {
  constructor(public ctor: T) {}
}

// 函数类型约束
type FnConstraint<T extends (...args: any[]) => any> = T;

// 可索引类型约束
type ValueOf<T> = T[keyof T];
```

## 递归类型

处理任意深度的嵌套对象。

### DeepReadonly - 深度只读

```typescript
type DeepReadonly<T> = T extends (...args: any[]) => any
  ? T
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

interface Config {
  server: {
    host: string;
    port: number;
    ssl: {
      enabled: boolean;
      cert: string;
    };
  };
}

type ReadonlyConfig = DeepReadonly<Config>;
// 所有嵌套属性都变成 readonly
```

### DeepPartial - 深度可选

```typescript
type DeepPartial<T> = T extends (...args: any[]) => any
  ? T
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

type PartialConfig = DeepPartial<Config>;
// 所有嵌套属性都变成可选
```

### 带深度限制的递归

```typescript
// 限制递归深度避免性能问题
type NestedArray<T, D extends number = 5> = D extends 0 ? T : T | NestedArray<T, [-1, 0, 1, 2, 3, 4][D]>;

type DeepArray = NestedArray<string, 3>;
// string | string[] | string[][] | string[][][]
```

### DeepRequired - 深度必填

```typescript
type DeepRequired<T> = T extends (...args: any[]) => any
  ? T
  : T extends object
    ? { [K in keyof T]-?: DeepRequired<T[K]> }
    : T;
```

## 联合类型分发

条件类型在联合类型上会分发。

### 分布式条件类型

```typescript
// 分发：string | number 会分别处理
type ToArray<T> = T extends any ? T[] : never;

type StrOrNum = ToArray<string | number>;
// string[] | number[] (不是 (string | number)[])

// 应用场景
type UnionToMap<T> = T extends any ? [T, T] : never;
type Mapped = UnionToMap<"a" | "b">;
// ['a', 'a'] | ['b', 'b']
```

### 非分发写法

用元组包裹防止分发：

```typescript
// 包裹在元组中防止分发
type ToArrayStrict<T> = [T] extends [any] ? T[] : never;

type Both = ToArrayStrict<string | number>;
// (string | number)[]
```

### 实际应用

```typescript
// 过滤联合类型
type FilterString<T> = T extends string ? T : never;
type StrOnly = FilterString<string | number | boolean>;
// string

// 映射联合类型
type MapToFn<T> = T extends string ? () => T : never;
type FnUnion = MapToFn<"a" | "b">;
// (() => 'a') | (() => 'b')
```

## 类型测试

验证复杂类型的正确性。

### AssertEqual - 严格相等

```typescript
type AssertEqual<T, U> = [T] extends [U]
  ? [U] extends [T]
    : false
  ? true
    : false;

// 测试示例
type Test1 = AssertEqual<string, string>; // true ✅
type Test2 = AssertEqual<string, number>; // false ✅
type Test3 = AssertEqual<string | number, string>; // false ✅
```

### ExpectError - 期望编译错误

```typescript
type ExpectError<T extends never> = T;

// 如果类型相等应该报错
type ShouldError = ExpectError<AssertEqual<string, number>>;

// 使用示例
// type Test = ShouldError; // 如果取消注释，编译报错
```

### Vitest expectTypeOf

```typescript
// 安装: npm install -D vitest
import { expectTypeOf } from "vitest";

expectTypeOf<string>().toEqualTypeOf<string>();
expectTypeOf<string>().not.toEqualTypeOf<number>();

// 测试泛型
function identity<T>(x: T): T {
  return x;
}

expectTypeOf(identity).parameter(0).toEqualTypeOf<string>();
expectTypeOf(identity).returns.toEqualTypeOf<string>();
```

### 测试复杂类型

```typescript
// 测试 ReturnType
type TestReturn = AssertEqual<ReturnType<() => number>, number>;

// 测试 Parameters
type TestParams = AssertEqual<Parameters<(a: string, b: number) => void>, [string, number]>;

// 测试 DeepReadonly
interface Nested {
  a: {
    b: string;
  };
}

type TestDeepReadonly = AssertEqual<
  DeepReadonly<Nested>,
  {
    readonly a: {
      readonly b: string;
    };
  }
>;
```

### 常用类型测试模式

```typescript
// 测试 never 类型
type IsNever<T> = [T] extends [never] ? true : false;

// 测试 any 类型
type IsAny<T> = 0 extends 1 & T ? true : false;

// 测试 unknown 类型
type IsUnknown<T> = IsAny<T> extends false ? (T extends unknown ? (unknown extends T ? true : false) : false) : false;
```
