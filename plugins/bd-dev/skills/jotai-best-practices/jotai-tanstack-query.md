# Jotai 与 TanStack Query 结合

本文档包含 Jotai 与 TanStack Query（React Query）结合使用的完整指南，包括各 API 用法、常见问题和 4 层架构实践。

## 核心 API 概览

| Jotai 函数                      | 对应 React Query           | 用途              |
| ------------------------------- | -------------------------- | ----------------- |
| `atomWithQuery`                 | `useQuery`                 | 标准查询          |
| `atomWithInfiniteQuery`         | `useInfiniteQuery`         | 无限滚动查询      |
| `atomWithMutation`              | `useMutation`              | 数据变更操作      |
| `atomWithSuspenseQuery`         | `useSuspenseQuery`         | Suspense 查询     |
| `atomWithSuspenseInfiniteQuery` | `useSuspenseInfiniteQuery` | Suspense 无限滚动 |
| `atomWithMutationState`         | `useMutationState`         | Mutation 状态追踪 |

---

## 基础查询

### atomWithQuery（对应 useQuery）

```typescript
import { atom } from 'jotai';
import { atomWithQuery } from 'jotai-tanstack-query';
import { queryClientAtom } from './query-client';

// ✅ 正确：创建基础查询 atom
export const usersAtom = atomWithQuery((get) => ({
  queryKey: ['users'],
  queryFn: fetchUsers,
}));

// ✅ 正确：带参数的查询 atom
export const userAtom = atomWithQuery((get) => {
  const userId = get(selectedUserIdAtom);
  return {
    queryKey: ['user', userId] as const,
    queryFn: () => fetchUser(userId),
    enabled: !!userId,
  };
});

// ❌ 错误：queryFn 中使用 get
const badAtom = atomWithQuery((get) => {
  const config = get(configAtom); // ❌ queryFn 中不能用 get
  return { queryKey: ['data'], queryFn: () => fetchWithConfig(get(configAtom)) };
});

// ✅ 正确：参数通过闭包传递
export const userAtomCorrect = atomWithQuery((get) => {
  const userId = get(selectedUserIdAtom);
  return {
    queryKey: ['user', userId] as const,
    queryFn: async ({ signal }) => {
      const config = get(configAtom); // 在 queryFn 中获取最新配置
      return fetchWithConfig(userId, config, signal);
    },
    enabled: !!userId,
  };
});
```

### atomWithSuspenseQuery（对应 useSuspenseQuery）

```typescript
import { atomWithSuspenseQuery } from 'jotai-tanstack-query';

// ✅ 正确：使用 Suspense 模式（强制处理 loading 状态）
export const userAtom = atomWithSuspenseQuery((get) => {
  const userId = get(selectedUserIdAtom);
  return {
    queryKey: ['user', userId] as const,
    queryFn: () => fetchUser(userId),
  };
});

// 使用时需要 Suspense 包裹
function UserProfile() {
  const [user] = useAtom(userAtom); // loading 时 throw promise
  return <div>{user.name}</div>;
}

function UserPage() {
  return (
    <Suspense fallback={<Loading />}>
      <UserProfile />
    </Suspense>
  );
}
```

---

## 无限滚动

### atomWithInfiniteQuery（对应 useInfiniteQuery）

```typescript
import { atomWithInfiniteQuery } from 'jotai-tanstack-query';
import { atom, useAtom } from 'jotai';
import { infiniteQueryAtom } from 'jotai-tanstack-query';

// ✅ 正确：创建无限滚动查询 atom
export const postsAtom = atomWithInfiniteQuery((get) => ({
  queryKey: ['posts'],
  queryFn: fetchPosts,
  getNextPageParam: (lastPage) => lastPage.nextCursor,
}));

// ✅ 正确：在组件中使用
function PostList() {
  const [postsResult] = useAtom(postsAtom);

  if (postsResult.isError) return <Error />;
  if (!postsResult.data) return <Loading />;

  return (
    <>
      {postsResult.data.pages.map((page) =>
        page.items.map((post) => <PostItem key={post.id} post={post} />)
      )}

      <button
        onClick={() => postsResult.fetchNextPage()}
        disabled={!postsResult.hasNextPage || postsResult.isFetchingNextPage}
      >
        {postsResult.isFetchingNextPage
          ? '加载中...'
          : postsResult.hasNextPage
          ? '加载更多'
          : '没有更多了'}
      </button>
    </>
  );
}
```

### atomWithSuspenseInfiniteQuery（对应 useSuspenseInfiniteQuery）

```typescript
import { atomWithSuspenseInfiniteQuery } from 'jotai-tanstack-query';

// ✅ 正确：Suspense 模式的无限滚动
export const postsAtom = atomWithSuspenseInfiniteQuery((get) => ({
  queryKey: ['posts'],
  queryFn: fetchPosts,
  getNextPageParam: (lastPage) => lastPage.nextCursor,
}));

// 使用时需要 Suspense + useInfiniteQuery 组合
function PostListWithSuspense() {
  const [postsResult] = useAtom(postsAtom);

  return (
    <>
      {postsResult.pages.map((page) =>
        page.items.map((post) => <PostItem key={post.id} post={post} />)
      )}

      <button
        onClick={() => postsResult.fetchNextPage()}
        disabled={!postsResult.hasNextPage}
      >
        加载更多
      </button>
    </>
  );
}
```

---

## 数据变更

### atomWithMutation（对应 useMutation）

```typescript
import { atom } from 'jotai';
import { atomWithMutation } from 'jotai-tanstack-query';
import { queryClientAtom } from './query-client';

// ✅ 正确：创建 Mutation atom
export const createUserAtom = atomWithMutation((get) => ({
  mutationFn: createUser,
  onSuccess: () => {
    // 使 users 查询失效并重新获取
    queryClientAtom.invalidateQueries({ queryKey: ['users'] });
  },
}));

// ✅ 正确：在组件中使用
function CreateUserForm() {
  const [users] = useAtom(usersAtom);
  const [createUser] = useAtom(createUserAtom);

  const handleSubmit = async (userData: UserData) => {
    await createUser(userData);
    // users 会自动重新验证
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" />
      <button type="submit" disabled={createUser.isPending}>
        {createUser.isPending ? '创建中...' : '创建用户'}
      </button>
      {createUser.isError && <Error message={createUser.error.message} />}
    </form>
  );
}

// ✅ 正确：带乐观更新的 mutation
export const updateTodoAtom = atomWithMutation((get) => ({
  mutationFn: updateTodo,
  onMutate: async (newTodo) => {
    // 取消出站请求
    await queryClientAtom.cancelQueries({ queryKey: ['todos'] });

    // 快照当前数据
    const previousTodos = queryClientAtom.getQueryData(['todos']);

    // 乐观更新
    queryClientAtom.setQueryData(['todos'], (old) =>
      old.map((todo) => (todo.id === newTodo.id ? { ...todo, ...newTodo } : todo))
    );

    return { previousTodos };
  },
  onError: (err, newTodo, context) => {
    // 回滚到之前的数据
    queryClientAtom.setQueryData(['todos'], context?.previousTodos);
  },
  onSettled: () => {
    // 重新验证
    queryClientAtom.invalidateQueries({ queryKey: ['todos'] });
  },
}));
```

### atomWithMutationState（对应 useMutationState）

```typescript
import { atomWithMutationState } from 'jotai-tanstack-query';

// ✅ 正确：追踪多个 mutation 的状态
export const mutationStateAtom = atomWithMutationState((get) => ({
  filters: { status: 'pending' },
}));

// ✅ 正确：在组件中显示所有 pending 的 mutation
function PendingMutations() {
  const [pendingMutations] = useAtom(mutationStateAtom);

  return (
    <div>
      <h3>处理中的操作</h3>
      {pendingMutations.map((mutation) => (
        <div key={mutation.variables.id}>
          正在保存: {mutation.variables.title}
        </div>
      ))}
    </div>
  );
}
```

---

## 4 层架构实践

```
store/
├── primitives/           # Layer 1: 基础 atoms
│   └── query-atoms.ts    # queryClientAtom 等
├── domain/               # Layer 2: 派生 atoms
│   └── query-atoms.ts    # 派生的查询 atoms
├── operations/           # Layer 3: 纯函数操作
│   └── fetch-ops.ts      # fetch 函数
└── actions/              # Layer 4: 组合操作
    └── use-data.ts       # useQuery/useMutation 组合
```

```typescript
// store/primitives/query-client.ts

// store/actions/use-users.ts
import { useAtom } from 'jotai';
import { atomWithQuery } from 'jotai-tanstack-query';
import { usersAtom } from '../domain/query-atoms';

// queryClientAtom 需要预先配置
export const queryClientAtom = atomWithQuery(() => ({
  queryKey: ['query-client'],
  queryFn: () => {}, // dummy, 实际由 QueryClientProvider 提供
}));

// store/domain/query-atoms.ts
export const usersAtom = atomWithQuery((get) => ({
  queryKey: ['users'] as const,
  queryFn: fetchUsers,
}));

export const userAtom = atomWithQuery((get) => {
  const userId = get(selectedUserIdAtom);
  return {
    queryKey: ['user', userId] as const,
    queryFn: () => fetchUser(userId),
    enabled: !!userId,
  };
});

// store/operations/fetch-ops.ts
export async function fetchUsers(): Promise<User[]> {
  const res = await fetch('/api/users');
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export function useUsers() {
  return useAtom(usersAtom);
}
```

---

## 常见问题与解决方案

### 问题 1: queryFn 中无法使用 get 获取 atom 值

**原因**: `atomWithQuery` 的 getter 只在配置阶段执行一次

**解决**: 在 `queryFn` 中通过闭包访问或使用 `queryClientAtom.get()`

```typescript
// ❌ 错误：在配置中使用 get
export const badAtom = atomWithQuery((get) => {
  const config = get(configAtom); // 此时 config 可能已过期
  return { queryKey: ['data'], queryFn: () => fetchWithConfig(config) };
});

// ✅ 正确：在 queryFn 中使用 queryClientAtom.get() 获取最新值
export const goodAtom = atomWithQuery((get) => {
  const userId = get(selectedUserIdAtom);
  return {
    queryKey: ['user', userId] as const,
    queryFn: async ({ signal }) => {
      const config = queryClientAtom.get(configAtom); // 获取最新配置
      return fetchWithConfig(userId, config, signal);
    },
    enabled: !!userId,
  };
});
```

### 问题 2: atomWithQuery 不支持 keepPreviousData

**原因**: `atomWithQuery` 是 atom 模式，placeholderData 需要额外处理

**解决**: 使用 `placeholderData: keepPreviousData` 选项

```typescript
import { keepPreviousData } from '@tanstack/react-query';

export const usersAtom = atomWithQuery((get) => ({
  queryKey: ['users', get(filterAtom)] as const,
  queryFn: fetchUsers,
  placeholderData: keepPreviousData,
}));
```

### 问题 3: mutation 后不刷新查询

**原因**: 未正确配置 `onSuccess` 或 `onSettled` 回调

**解决**: 使用 `queryClientAtom.invalidateQueries()`

```typescript
export const createUserAtom = atomWithMutation((get) => ({
  mutationFn: createUser,
  onSuccess: () => {
    // ❌ 错误：使用 queryClient.invalidateQueries
    // ✅ 正确：使用 queryClientAtom
    queryClientAtom.invalidateQueries({ queryKey: ['users'] });
  },
}));
```

### 问题 4: 无限滚动的初始加载问题

**原因**: `atomWithInfiniteQuery` 需要正确处理初始状态

**解决**: 检查 `isFetchingNextPage` 和 `hasNextPage`

```typescript
export const postsAtom = atomWithInfiniteQuery((get) => ({
  queryKey: ['posts'],
  queryFn: fetchPosts,
  getNextPageParam: (lastPage) => lastPage.nextCursor,
  initialPageParam: 0,
}));

function PostList() {
  const [postsResult] = useAtom(postsAtom);

  // ✅ 正确：初始加载使用 isFetching，滚动加载使用 isFetchingNextPage
  if (postsResult.isFetching && !postsResult.data) {
    return <LoadingSkeleton />;
  }

  return (
    <>
      {postsResult.data?.pages.map((page) =>
        page.items.map((post) => <PostItem key={post.id} post={post} />)
      )}

      <button
        onClick={() => postsResult.fetchNextPage()}
        disabled={!postsResult.hasNextPage || postsResult.isFetchingNextPage}
      >
        {postsResult.isFetchingNextPage ? '加载中...' : '加载更多'}
      </button>
    </>
  );
}
```

### 问题 5: SSR/Hydration 不匹配

**原因**: SSR 和客户端的数据可能不一致

**解决**: 使用 `staleTime` 缓存或 Suspense 模式

```typescript
// ✅ 正确：设置 staleTime 避免立即重新请求
export const usersAtom = atomWithQuery(() => ({
  queryKey: ['users'] as const,
  queryFn: fetchUsers,
  staleTime: 1000 * 60 * 5, // 5分钟内不重新请求
}));

// ✅ 正确：使用 Suspense 模式强制等待
export const usersAtom = atomWithSuspenseQuery(() => ({
  queryKey: ['users'] as const,
  queryFn: fetchUsers,
}));
```

### 问题 6: mutation 乐观更新失败回滚

**原因**: 未正确保存和恢复上下文

**解决**: 在 `onMutate` 中保存状态，在 `onError` 中恢复

```typescript
export const updateTodoAtom = atomWithMutation((get) => ({
  mutationFn: updateTodo,
  onMutate: async (newTodo) => {
    await queryClientAtom.cancelQueries({ queryKey: ['todos'] });
    const previousTodos = queryClientAtom.getQueryData(['todos']);

    queryClientAtom.setQueryData(['todos'], (old) =>
      old?.map((todo) => (todo.id === newTodo.id ? { ...todo, ...newTodo } : todo))
    );

    return { previousTodos };
  },
  onError: (err, newTodo, context) => {
    if (context?.previousTodos) {
      queryClientAtom.setQueryData(['todos'], context.previousTodos);
    }
  },
  onSettled: () => {
    queryClientAtom.invalidateQueries({ queryKey: ['todos'] });
  },
}));
```

---

## API 对比

### atomWithQuery vs React Query 直接使用

| 特性              | atomWithQuery           | React Query 直接使用   |
| ----------------- | ----------------------- | ---------------------- |
| 状态访问          | `useAtom(atom)`         | `useQuery()`           |
| 细粒度控制        | 有限                    | 完全                   |
| 与其他 atoms 集成 | 天然集成                | 需要 useAtomValue 桥接 |
| Suspense 支持     | `atomWithSuspenseQuery` | `useSuspenseQuery`     |
| 无限滚动          | `atomWithInfiniteQuery` | `useInfiniteQuery`     |
| 学习曲线          | 较低                    | 较高                   |

**推荐场景**：

- 简单查询、与 atoms 频繁交互 → `atomWithQuery`
- 复杂状态管理、需要细粒度控制 → React Query 直接使用
- 需要 Suspense → `atomWithSuspenseQuery`
- 需要无限滚动 → `atomWithInfiniteQuery`

---

## 相关章节

- [SKILL.md](SKILL.md) - 场景选择指南
- [jotai-core.md](jotai-core.md) - 核心概念
- [jotai-common.md](jotai-common.md) - 常用模式
- [jotai-advanced.md](jotai-advanced.md) - 高级特性
- [jotai-extensions.md](jotai-extensions.md) - 其他扩展库
