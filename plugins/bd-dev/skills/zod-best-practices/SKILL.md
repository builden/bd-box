---
name: zod-best-practices
description: |
  Zod 最佳实践：API 响应验证、表单 Schema 定义、null vs undefined 处理、类型安全。
  触发条件：
  - 验证 API 响应或解析 JSON 数据
  - 定义任何 z.object() Schema
  - 遇到 "received null" 验证错误
  - 需要给字段设置默认值
  - 前端调用 validateResponse 或 safeParse
---

# Zod 最佳实践

## 核心原则

Zod 实现了**运行时验证 + 编译时类型**的统一。schema 即类型定义，避免重复声明。

## 快速决策

### 场景选择

| 场景           | 选择                   | 做法                         |
| -------------- | ---------------------- | ---------------------------- |
| 用户输入验证   | 表单 Schema            | `.safeParse()` + 错误展平    |
| API 响应解析   | 响应 Schema + 安全解析 | try/catch + 返回 null/默认值 |
| 持久化数据验证 | Schema + catchall      | `.catchall(z.unknown())`     |
| 类型导出       | Schema + z.infer       | 一次定义，双重用途           |

### 无效数据处理

| 需求       | 方法                  |
| ---------- | --------------------- |
| 抛错       | `schema.parse()`      |
| 返回默认值 | `try/catch` + default |
| 结构化结果 | `schema.safeParse()`  |
| 批量过滤   | `superRefine()`       |

---

## .default() vs .optional() 决策

这是 Zod 最容易用错的点。**先用 `.default()` ，再用 `.optional()`**。

### 决策树

```
数据可能缺失？
    │
    ├─ YES → 后端会返回该字段，只是值为 null？
    │          ├─ YES → 使用 z.string().nullish() 或 .nullable()
    │          └─ NO  → 使用 .default() 提供默认值
    │
    └─ NO → 数据永远不会返回该字段？
              └─ YES → 不要在 Schema 中定义这个字段
```

### 常见错误：null vs undefined

```typescript
// ❌ 后端返回 null，前端用 .optional() → 报错
const schema = z.object({
  customName: z.string().optional(), // 只接受 undefined
});
schema.parse({ customName: null }); // ❌ Invalid: expected string

// ✅ 三种正确做法：
// 1. 让后端不返回该字段（推荐）
// 2. Schema 接受 null
const schema = z.object({
  customName: z.string().nullish(), // 接受 null 或 undefined
});
// 3. 用 default 转换
const schema = z.object({
  customName: z.string().optional().default(undefined),
});
```

### 最佳实践：Schema 定义时优先给默认值

```typescript
// ✅ 推荐：Schema 带默认值，类型自动包含默认值
const settingsSchema = z.object({
  theme: z.enum(['light', 'dark']).default('dark'),
  limit: z.number().default(20),
  enabled: z.boolean().default(true),
});
type Settings = z.infer<typeof settingsSchema>;
// Settings: { theme: 'light' | 'dark'; limit: number; enabled: boolean }
// 解析后的对象一定包含这些字段，无需做空值检查
```

---

## Schema 定义

### 命名

```typescript
export const userSchema = z.object({ ... });
export type User = z.infer<typeof userSchema>;
```

### 基础类型

```typescript
z.string().email().min(1).max(100);
z.number().int().positive().min(0).max(100);
z.boolean();
z.array(z.string()).nonempty();
z.object({ name: z.string().optional() });
z.union([z.string(), z.number()]);
z.enum(['A', 'B', 'C']);
```

---

## 常用模式

### 安全解析

```typescript
// ✅ 返回默认值
function parseWithDefaults<T>(schema: z.ZodSchema<T>, data: unknown, defaults: T): T {
  try {
    return schema.parse(data);
  } catch {
    return defaults;
  }
}

// ✅ 结构化结果
const result = schema.safeParse(data);
if (!result.success) {
  console.error(result.error.issues);
  return null;
}
return result.data;
```

### 持久化存储

```typescript
const settingsSchema = z
  .object({
    theme: z.enum(['light', 'dark']).default('light'),
    language: z.string().default('zh-CN'),
  })
  .catchall(z.unknown()); // 忽略额外字段
```

### 表单验证

```typescript
const formSchema = z.object({
  email: z.string().email('无效邮箱'),
  password: z.string().min(8, '至少8个字符'),
});
```

---

## 常见错误（重点）

| 错误做法                                 | 正确做法                             |
| ---------------------------------------- | ------------------------------------ |
| 后端返回 `null`，Schema 用 `.optional()` | 用 `.nullish()` 或让后端不返回该字段 |
| 字段可能缺失时手动给默认值               | 直接在 Schema 用 `.default()`        |
| 解析后做 `if (!x) x = default`           | Schema 定义阶段就设置默认值          |

### 实际案例：Session.customName 问题

```typescript
// ❌ 后端代码
const session = {
  id: 'xxx',
  customName: customNames[sessionId] || null, // 错误：返回 null
};

// ✅ 后端修复
const session: Session = { id: 'xxx', ... };
if (customNames[sessionId]) {
  session.customName = customNames[sessionId];
}
// 或
session.customName = customNames[sessionId] || undefined;

// ✅ 前端 Schema
const SessionSchema = z.object({
  customName: z.string().optional(), // 只接受 undefined
});
// 现在解析 { customName: undefined } 不会报错
```

---

## 快速参考

| 需求     | 代码                     |
| -------- | ------------------------ |
| 可选     | `.optional()`            |
| 默认值   | `.default(value)`        |
| 忽略未知 | `.catchall(z.unknown())` |
| 安全解析 | `.safeParse()`           |
| 类型推导 | `z.infer<typeof schema>` |

---

## 网络数据验证

### API 响应安全解析

```typescript
import { z } from 'zod';

// API 响应包装 Schema
const apiResponseSchema = <T extends z.ZodSchema>(dataSchema: T) =>
  z.object({
    code: z.number(),
    data: dataSchema.optional(),
    message: z.string().optional(),
  });

// 使用：安全获取 API 数据
async function fetchWithValidation<T>(url: string, schema: z.ZodSchema<T>, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) return null;

    const json = await res.json();
    const parsed = schema.safeParse(json);
    return parsed.success ? parsed.data : null;
  } catch {
    return null; // 网络错误或解析失败
  }
}

// ✅ 正确：带类型安全的数据获取
interface User {
  id: number;
  name: string;
  email: string;
}

const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
});

const user = await fetchWithValidation('/api/user/1', userSchema);
// user 类型为 User | null
if (user) {
  console.log(user.name); // 类型安全访问
}
```

### 超时与重试机制

```typescript
import { z } from 'zod';

// 带超时的数据获取
async function fetchWithTimeout<T>(url: string, schema: z.ZodSchema<T>, timeoutMs: number = 5000): Promise<T | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return null;

    const json = await res.json();
    const parsed = schema.safeParse(json);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

// ✅ 正确：指数退避重试
async function fetchWithRetry<T>(url: string, schema: z.ZodSchema<T>, maxRetries: number = 3): Promise<T | null> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      const parsed = schema.safeParse(json);
      if (parsed.success) return parsed.data;
      throw new Error('Schema validation failed');
    } catch (err) {
      lastError = err as Error;
      const delay = Math.pow(2, attempt) * 1000; // 指数退避
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  console.error(`Failed after ${maxRetries} attempts:`, lastError);
  return null;
}
```

### 批量数据验证

```typescript
// ✅ 正确：批量验证数组数据
const userListSchema = z.array(
  z.object({
    id: z.number(),
    name: z.string().min(1),
    email: z.string().email(),
  })
);

async function fetchUserList(): Promise<User[]> {
  const res = await fetch('/api/users');
  const json = await res.json();

  const parsed = userListSchema.safeParse(json);
  if (parsed.success) {
    return parsed.data;
  }

  // 记录具体哪些数据有问题
  console.error('Invalid users:', parsed.error.issues);
  return [];
}
```

### 错误边界与降级

```typescript
// ✅ 正确：验证失败时的优雅降级
const optionalUserSchema = z.object({
  id: z.number(),
  name: z.string(),
  avatar: z.string().url().optional(), // 可选字段
});

async function getUserData(userId: number) {
  const res = await fetch(`/api/users/${userId}`);

  if (!res.ok) {
    return { error: true, message: '用户不存在' };
  }

  const json = await res.json();
  const parsed = optionalUserSchema.safeParse(json);

  if (!parsed.success) {
    // 验证失败，返回部分数据或默认值
    return {
      id: userId,
      name: '未知用户',
      avatar: null,
    };
  }

  return parsed.data;
}
```

### 分页数据验证

```typescript
const paginatedResponseSchema = <T extends z.ZodSchema>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number().positive(),
    page: z.number().positive(),
    pageSize: z.number().positive().max(100),
    totalPages: z.number().nonnegative(),
  });

interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ✅ 正确：带分页的数据获取
async function fetchPaginatedData<T>(url: string, itemSchema: z.ZodSchema<T>): Promise<PaginatedResult<T> | null> {
  const res = await fetch(url);
  if (!res.ok) return null;

  const json = await res.json();
  const parsed = paginatedResponseSchema(itemSchema).safeParse(json);

  return parsed.success ? parsed.data : null;
}
```

### 类型导出复用

```typescript
// ✅ 正确：一次定义，多处复用
const dictItemSchema = z.object({
  id: z.string(),
  char: z.string().min(1).max(1),
  pinyin: z.string().optional(),
  meaning: z.string().optional(),
  category: z.string(),
});

// 导出的类型可在组件中直接使用
export type DictItem = z.infer<typeof dictItemSchema>;
export { dictItemSchema };
```
