# Hooks 模式 (Hooks Pattern)

## 一句话定义

使用自定义 Hooks 抽离组件逻辑，实现逻辑复用。

## 为什么好

- **逻辑复用**：跨组件共享状态逻辑
- **关注点分离**：将 UI 和逻辑分离
- **更少代码**：比 HOC 和 Render Props 更简洁
- **易于测试**：逻辑可独立测试
- **组合灵活**：可组合多个 Hooks

## 函数式实现

### 基础自定义 Hook

```typescript
import { useState, useEffect } from 'react';

function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function
        ? value(storedValue)
        : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
}

// 使用
function App() {
  const [name, setName] = useLocalStorage('name', 'Alice');
  return <input value={name} onChange={e => setName(e.target.value)} />;
}
```

### 复杂状态 Hook

```typescript
import { useState, useCallback } from 'react';

function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue(v => !v);
  }, []);

  return [value, toggle, setValue] as const;
}

// 使用
function Toggle() {
  const [isOn, toggle] = useToggle();
  return <button onClick={toggle}>{isOn ? 'ON' : 'OFF'}</button>;
}
```

### 数据获取 Hook

```typescript
import { useState, useEffect } from 'react';

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

function useFetch<T>(url: string): FetchState<T> & { refetch: () => void } {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: null
  });

  const fetchData = async () => {
    setState(s => ({ ...s, loading: true }));
    try {
      const response = await fetch(url);
      const data = await response.json();
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({ data: null, loading: false, error: error as Error });
    }
  };

  useEffect(() => {
    fetchData();
  }, [url]);

  return { ...state, refetch: fetchData };
}

// 使用
function UserList() {
  const { data, loading, error } = useFetch<User[]>('/api/users');

  if (loading) return <Spinner />;
  if (error) return <Error error={error} />;

  return (
    <ul>
      {data?.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  );
}
```

### 组合 Hooks

```typescript
// 组合多个小 Hook
function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 获取用户
  }, []);

  return { user, loading, isAuthenticated: !!user };
}

function useUserData(userId: string) {
  const { data, loading } = useFetch(`/api/users/${userId}`);
  const [name, setName] = useLocalStorage(`user-${userId}-name`, "");

  return { user: data, loading, name };
}

// 组合使用
function useUserProfile(userId: string) {
  const auth = useAuth();
  const userData = useUserData(userId);

  return {
    ...auth,
    ...userData,
    isOwner: auth.user?.id === userId,
  };
}
```

## 适用场景

- 状态逻辑复用
- 数据获取
- 表单处理
- 浏览器 API 封装
- 动画/定时器

## 禁忌（什么时候不该用）

- **过度抽取**：不要每个函数都做成 Hook
- **依赖过多**：Hook 依赖过多难以维护
- **性能问题**：每次渲染都会执行 Hook
- **类组件**：不需要使用（已过时）

## Hooks 规则

1. **只在顶层调用**：不要在循环、条件、嵌套函数中调用 Hooks
2. **只在 React 函数中调用**：只在函数组件或自定义 Hook 中调用
3. **命名规范**：以 `use` 开头

## 类组件替代方案

```typescript
// 旧：类组件
class Counter extends React.Component {
  state = { count: 0 };

  componentDidMount() {
    document.title = `Count: ${this.state.count}`;
  }

  component {
    document.titleDidUpdate() = `Count: ${this.state.count}`;
  }
}

// 新：Hooks
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.title = `Count: ${count}`;
  }, [count]);
}
```

## 参考

- [patterns.dev - Hooks Pattern](https://www.patterns.dev/react/hooks-pattern)
- React 官方文档
