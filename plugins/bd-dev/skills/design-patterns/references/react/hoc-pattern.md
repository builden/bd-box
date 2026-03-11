# HOC 模式 (Higher Order Component)

## 一句话定义

接收组件并返回新组件的函数。

## 为什么好

- **逻辑复用**：包装组件共享逻辑
- **属性代理**：可以修改 props
- **状态抽象**：抽象子组件状态

## 函数式实现

```typescript
// withLoading HOC
const withLoading = <P extends object>(Component: React.ComponentType<P>) => {
  return ({ isLoading, ...props }: P & { isLoading: boolean }) => {
    if (isLoading) return <Spinner />;
    return <Component {...props} />;
  };
};

// 使用
const UserListWithLoading = withLoading(UserList);

<UserListWithLoading isLoading={loading} users={users} />;
```

## 适用场景

- 逻辑复用（Hooks 出现后已较少使用）

## 现代替代

自定义 Hook 是更好的选择。

## 参考

- [patterns.dev - HOC](https://www.patterns.dev/react/hoc-pattern)
