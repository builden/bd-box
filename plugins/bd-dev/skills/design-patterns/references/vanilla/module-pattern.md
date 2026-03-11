# 模块模式 (Module Pattern)

## 一句话定义

使用闭包和 IIFE 创建私有作用域，暴露公共 API。

## 为什么好

- **封装**：隐藏内部实现细节
- **私有化**：保护内部状态不被意外修改
- **命名空间**：避免全局变量污染
- **组织代码**：按功能模块化代码

## 函数式实现

### IIFE 模块

```typescript
const UserModule = (() => {
  // 私有变量
  const _users: Map<string, string> = new Map();

  // 私有函数
  const validate = (name: string) => name.length > 0;

  // 公共 API
  return {
    add(name: string, email: string) {
      if (!validate(name)) throw new Error("Invalid name");
      _users.set(name, email);
    },
    get(name: string) {
      return _users.get(name);
    },
    getAll() {
      return Object.fromEntries(_users);
    },
    delete(name: string) {
      return _users.delete(name);
    },
  };
})();

UserModule.add("Alice", "alice@example.com");
console.log(UserModule.get("Alice")); // 'alice@example.com'
// _users 不可访问
```

### 模块模式 + 工厂函数

```typescript
const createModule = (initialConfig: { debug?: boolean }) => {
  // 私有状态
  let config = { ...initialConfig };
  const cache = new Map<string, unknown>();

  // 私有方法
  const log = (...args: unknown[]) => {
    if (config.debug) console.log("[DEBUG]", ...args);
  };

  // 公共 API
  return {
    setConfig(newConfig: Partial<typeof config>) {
      config = { ...config, ...newConfig };
    },
    get(key: string) {
      log("Getting", key);
      return cache.get(key);
    },
    set(key: string, value: unknown) {
      log("Setting", key, value);
      cache.set(key, value);
    },
    clear() {
      cache.clear();
    },
  };
};

const app = createModule({ debug: true });
app.set("foo", "bar");
```

### ES Module 单例

```typescript
// userService.ts
type User = { id: string; name: string };

class UserService {
  private users: User[] = [];

  add(user: User) {
    this.users.push(user);
  }

  find(id: string) {
    return this.users.find((u) => u.id === id);
  }
}

// 单例导出
export const userService = new UserService();
```

### 命名空间模式

```typescript
const MyApp = MyApp || {};

MyApp.Utils = (() => {
  return {
    formatDate(date: Date) {
      return date.toISOString().split("T")[0];
    },
    debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
      let timer: ReturnType<typeof setTimeout>;
      return (...args: Parameters<T>) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
      };
    },
  };
})();
```

## 适用场景

- 库/工具封装
- 私有状态管理
- 插件系统
- API 封装
- 避免全局污染

## 禁忌（什么时候不该用）

- **需要继承扩展**：模块模式不易于扩展
- **服务端 SSR**：IIFE 在服务端有额外开销
- **现代开发**：ES Module 是更好的选择

## 模块模式 vs ES Module

| 特征     | 模块模式 | ES Module     |
| -------- | -------- | ------------- |
| 语法     | IIFE     | import/export |
| 私有     | 闭包实现 | #private 字段 |
| 静态分析 | 差       | 好            |
| 打包优化 | 一般     | 优秀          |

## 现代替代：ES Module + #private

```typescript
// userService.ts
class UserService {
  #users = new Map<string, string>();

  add(name: string, email: string) {
    this.#users.set(name, email);
  }

  get(name: string) {
    return this.#users.get(name);
  }
}

export const userService = new UserService();
```

## 参考

- [patterns.dev - Module Pattern](https://www.patterns.dev/vanilla/module-pattern)
- 《JavaScript 设计模式》- 模块模式
