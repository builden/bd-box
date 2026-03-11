# 代理模式 (Proxy)

## 一句话定义

为另一个对象提供一个替身或占位符以控制对它的访问。

## 为什么好

- **控制访问**：可以控制对象的访问方式
- **延迟加载**：懒加载
- **保护对象**：添加访问控制
- **日志记录**：记录访问日志

## 函数式实现

```typescript
// 代理工厂
const createProxy = <T extends (...args: any[]) => any>(
  target: T,
  hooks: {
    before?: (...args: Parameters<T>) => void;
    after?: (result: ReturnType<T>) => void;
  },
): T => {
  return ((...args: Parameters<T>) => {
    hooks.before?.(...args);
    const result = target(...args);
    hooks.after?.(result);
    return result;
  }) as T;
};

// 使用
const fetchUser = (id: string) => ({ id, name: "Alice" });

const loggedFetch = createProxy(fetchUser, {
  before: (id) => console.log("Fetching user", id),
  after: (user) => console.log("Got user", user),
});

loggedFetch("123");
```

## 适用场景

- 远程代理（API）
- 虚拟代理（懒加载）
- 保护代理（权限）
- 智能引用

## 参考

- [patterns.dev - Proxy](https://www.patterns.dev/vanilla/proxy-pattern)
- 《设计模式》- 代理模式
