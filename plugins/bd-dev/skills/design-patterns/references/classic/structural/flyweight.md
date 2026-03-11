# 享元模式 (Flyweight)

## 一句话定义

运用共享技术有效地支持大量细粒度对象。

## 为什么好

- **节省内存**：共享细粒度对象
- **提高性能**：减少对象创建开销

## 函数式实现

```typescript
// 享元工厂
const createFlyweightFactory = <T extends string>() => {
  const pool = new Map<T, { count: number }>();

  return {
    get(key: T) {
      if (!pool.has(key)) {
        pool.set(key, { count: 0 });
      }
      const item = pool.get(key)!;
      item.count++;
      return item;
    },
    getStats() {
      return Object.fromEntries(pool);
    },
  };
};

// 使用
const userFactory = createFlyweightFactory<string>();

const user1 = userFactory.get("Alice");
const user2 = userFactory.get("Alice");
const user3 = userFactory.get("Bob");

console.log(userFactory.getStats());
// { Alice: { count: 2 }, Bob: { count: 1 } }
```

## 适用场景

- 大量相似对象
- 对象创建成本高
- 缓存

## 参考

- [patterns.dev - Flyweight](https://www.patterns.dev/vanilla/flyweight-pattern)
- 《设计模式》- 享元模式
