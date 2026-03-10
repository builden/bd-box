# Mixin 模式 (Mixin Pattern)

## 一句话定义

通过组合多个小功能来构建更大的对象。

## 为什么好

- **组合优于继承**：避免深层继承
- **功能复用**：可复用通用功能
- **解耦**：功能模块化

## 函数式实现

```typescript
const withLogger = <T extends object>(obj: T) => ({
  ...obj,
  log: (msg: string)[${ => console.log(`obj.constructor.name}]`, msg)
});

const withCache = <T extends object>(obj: T) => {
  const cache = new Map();
  return {
    ...obj,
    cache,
    get(key: string) {
      return cache.get(key);
    },
    set(key: string, value: any) {
      cache.set(key, value);
    }
  };
};

// 使用
class UserService {
  fetchUser(id: string) { return { id, name: 'Alice' }; }
}

const enhanced = withLogger(withCache(new UserService()));
enhanced.log('Fetching user');
```

## 参考

- [patterns.dev - Mixin](https://www.patterns.dev/vanilla/mixin-pattern)
