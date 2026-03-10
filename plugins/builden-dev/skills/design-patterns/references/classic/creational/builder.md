# 建造者模式 (Builder)

## 一句话定义

将一个复杂对象的构建与它的表示分离，使得同样的构建过程可以创建不同的表示。

## 为什么好

- **分步构建**：复杂对象分步创建
- **可变参数**：可创建不同配置的对象
- **代码清晰**：构建逻辑与业务逻辑分离
- **不可变对象**：可构建不可变对象

## 函数式实现

```typescript
type BuildStep<T> = T & {
  // 完成构建
  build: () => T;
};

const createBuilder = <T>(defaults: Partial<T> = {}) => {
  let target = { ...defaults } as T;

  const builder = new Proxy(
    {},
    {
      get: (_, prop) => {
        if (prop === "build") return () => target;
        return (value: T[keyof T]) => {
          (target as any)[prop] = value;
          return builder;
        };
      },
    },
  ) as BuildStep<T>;

  return builder;
};

// 使用
type User = {
  name: string;
  age: number;
  email?: string;
  address?: string;
};

const user = createBuilder<User>().name("Alice").age(25).email("alice@example.com").address("Beijing").build();

// 链式调用
const user2 = createBuilder<User>().name("Bob").age(30).build();
```

## 适用场景

- 复杂对象构建
- 对象可选参数多
- 不可变对象

## 参考

- 《设计模式》- 建造者模式
