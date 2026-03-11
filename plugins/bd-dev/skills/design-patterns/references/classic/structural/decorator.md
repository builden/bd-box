# 装饰器模式 (Decorator)

## 一句话定义

动态地给一个对象添加额外的职责，比继承更灵活。

## 为什么好

- **运行时扩展**：比继承更灵活
- **单一职责**：每个装饰器只负责一件事
- **可组合**：可以组合多个装饰器
- **避免类爆炸**：避免创建大量子类

## 函数式实现

```typescript
type Decorator<T> = (target: T) => T;

// 基础函数
const withLogging = <T extends (...args: any[]) => any>(fn: T): T => {
  return ((...args: Parameters<T>) => {
    console.log("Calling", fn.name, "with", args);
    const result = fn(...args);
    console.log("Result:", result);
    return result;
  }) as T;
};

const withRetry = <T extends (...args: any[]) => any>(fn: T, retries = 3): T => {
  return ((...args: Parameters<T>) => {
    for (let i = 0; i < retries; i++) {
      try {
        return fn(...args);
      } catch (e) {
        if (i === retries - 1) throw e;
      }
    }
  }) as T;
};

const withCache = <T extends (...args: any[]) => any>(fn: T): T => {
  const cache = new Map<string, ReturnType<T>>();
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key)!;
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

// 使用
const fetchUser = (id: string) => ({ id, name: "Alice" });

const enhancedFetch = withCache(withLogging(withRetry(fetchUser)));
```

## 适用场景

- 动态添加功能
- 日志、缓存、验证
- 函数增强

## 参考

- 《设计模式》- 装饰器模式
