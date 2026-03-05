# 状态机建模

用 discriminated unions 建模类型安全的状态机。

## 基础状态机

### 定义状态和事件

```typescript
type State =
  | { type: "idle" }
  | { type: "loading"; requestId: string }
  | { type: "success"; data: User }
  | { type: "error"; error: Error };

type Event =
  | { type: "FETCH"; requestId: string }
  | { type: "SUCCESS"; data: User }
  | { type: "ERROR"; error: Error }
  | { type: "RESET" };
```

### Reducer 实现

```typescript
function reducer(state: State, event: Event): State {
  switch (state.type) {
    case "idle":
      return event.type === "FETCH" ? { type: "loading", requestId: event.requestId } : state;

    case "loading":
      if (event.type === "SUCCESS") {
        return { type: "success", data: event.data };
      }
      if (event.type === "ERROR") {
        return { type: "error", error: event.error };
      }
      return state;

    case "success":
    case "error":
      return event.type === "RESET" ? { type: "idle" } : state;
  }
}
```

### 使用示例

```typescript
const initialState: State = { type: "idle" };

const loadingState = reducer(initialState, {
  type: "FETCH",
  requestId: "req-123",
});
// { type: 'loading', requestId: 'req-123' }

const successState = reducer(loadingState, {
  type: "SUCCESS",
  data: { id: 1, name: "John" },
});
// { type: 'success', data: { id: 1, name: 'John' } }

const backToIdle = reducer(successState, { type: "RESET" });
// { type: 'idle' }
```

## 泛型状态机

### 可复用的状态机类型

```typescript
// 泛型状态机
type StateMachine<S extends string, E extends string, T extends Record<S, unknown>> = {
  states: S;
  events: E;
  data: T;
};

// 简化版本
type SimpleStateMachine<T extends Record<string, unknown>> = {
  [K in keyof T]: T[K] & { _state: K };
}[keyof T];

// 实际应用
interface States {
  idle: {};
  loading: { requestId: string };
  success: { data: User };
  error: { error: Error };
}

type AppState = SimpleStateMachine<States>;
// { _state: 'idle' } | { _state: 'loading'; requestId: string } | ...
```

### 带上下文的泛型状态机

```typescript
type StateWithContext<Context> =
  | { type: "idle" }
  | { type: "loading"; requestId: string }
  | { type: "success"; data: User; context: Context }
  | { type: "error"; error: Error; context: Context };

interface AppContext {
  userId: string;
  retries: number;
}

function createContext(userId: string): AppContext {
  return { userId, retries: 0 };
}

function reducer(state: StateWithContext<AppContext>, event: Event): StateWithContext<AppContext> {
  const context = state.type === "idle" || state.type === "loading" ? createContext("default") : state.context;

  switch (state.type) {
    case "idle":
      return event.type === "FETCH" ? { type: "loading", requestId: event.requestId } : state;

    case "loading":
      if (event.type === "SUCCESS") {
        return {
          type: "success",
          data: event.data,
          context: { ...context, retries: context.retries + 1 },
        };
      }
    // ...
  }
}
```

## 表单状态机

### 表单状态建模

```typescript
type FormState<T> =
  | { status: "idle" }
  | { status: "editing"; data: T; errors: Partial<Record<keyof T, string>> }
  | { status: "submitting"; data: T }
  | { status: "success"; data: T }
  | { status: "error"; data: T; errors: string };

interface UserForm {
  name: string;
  email: string;
}

type UserFormState = FormState<UserForm>;

// 使用
const editingState: UserFormState = {
  status: "editing",
  data: { name: "", email: "" },
  errors: {},
};

const withErrors: UserFormState = {
  status: "editing",
  data: { name: "John", email: "invalid" },
  errors: { email: "Invalid email format" },
};
```

## 路由状态机

### SPA 路由状态

```typescript
type Route =
  | { type: "home" }
  | { type: "user"; params: { id: string } }
  | { type: "post"; params: { id: string }; query: { commentId?: string } }
  | { type: "notFound" };

type NavigationEvent = { type: "NAVIGATE"; path: string } | { type: "BACK" } | { type: "FORWARD" };

// 类型安全的路由转换
function navigate(current: Route, event: NavigationEvent): Route {
  switch (event.type) {
    case "NAVIGATE":
      const path = event.path.split("/").filter(Boolean);
      if (path[0] === "users" && path[1]) {
        return { type: "user", params: { id: path[1] } };
      }
      if (path[0] === "posts" && path[1]) {
        return {
          type: "post",
          params: { id: path[1] },
          query: {},
        };
      }
      return { type: "home" };
    // ...
  }
}
```

## 最佳实践

### 1. 使用 discriminated union

```typescript
// ✅ 好：用 type 作为 discriminant
type State = { type: "idle" } | { type: "loading" };

// ❌ 差：用 boolean 或其他
type BadState = { loading: false } | { loading: true; data: unknown };
```

### 2. 确保 exhaustive checking

```typescript
// TypeScript 会检查所有状态
function handleState(state: State): never {
  switch (state.type) {
    case "idle":
      // ...
      break;
    case "loading":
      // ...
      break;
    case "success":
      // ...
      break;
    case "error":
      // ...
      break;
    // 如果添加新状态没处理，编译报错
  }
}
```

### 3. 用 `never` 保证完整性

```typescript
function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${value}`);
}
```
