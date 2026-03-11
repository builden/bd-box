# 单例模式 (Singleton)

## 一句话定义

确保一个类只有一个实例，并提供一个全局访问点。

## 为什么好

- **全局唯一**：确保一个类只有一个实例，避免重复创建
- **延迟初始化**：只在需要时才创建实例
- **全局访问**：方便在任意位置访问共享资源
- **节省资源**：避免重复创建重型对象

## 函数式实现

### 方式 1：闭包实现

```typescript
const createSingleton = <T>(fn: () => T) => {
  let instance: T | null = null;
  return () => {
    if (!instance) {
      instance = fn();
    }
    return instance;
  };
};

// 使用
const getUserService = createSingleton(() => new UserService());
const service1 = getUserService();
const service2 = getUserService();
console.log(service1 === service2); // true
```

### 方式 2：ES Module 单例

```typescript
// userService.ts
class UserService {
  // 私有构造函数
}

export const userService = new UserService();

// 使用
import { userService } from "./userService";
```

### 方式 3：Symbol 实现

```typescript
const createSingleton = <T extends new () => any>(constructor: T) => {
  const symbol = Symbol("singleton");
  return new Proxy(constructor, {
    construct(target, args) {
      if (!(symbol in target)) {
        Reflect.set(target, symbol, new target(...args));
      }
      return Reflect.get(target, symbol);
    },
  });
};

class UserService {}
const SingletonUserService = createSingleton(UserService);
```

## 适用场景

- 全局状态管理（如 Redux store）
- 数据库连接池
- 配置管理器
- 日志记录器
- 缓存实例

## 禁忌（什么时候不该用）

- **需要继承**：单例难以测试和扩展
- **并发环境**：多线程下需要额外同步处理
- **分布式系统**：单例不适用于多进程/多机器
- **过度使用**：不要把所有类都做成单例

## 类实现（补充）

```typescript
class Singleton {
  private static instance: Singleton;
  private constructor() {}

  public static getInstance(): Singleton {
    if (!Singleton.instance) {
      Singleton.instance = new Singleton();
    }
    return Singleton.instance;
  }
}
```

## 参考

- [patterns.dev - Singleton](https://www.patterns.dev/vanilla/singleton-pattern)
- 《设计模式》- 单例模式
