# Proxy Pattern (Vanilla)

## 一句话定义

使用 Proxy 拦截对象操作。

## 函数式实现

```typescript
const createProxy = (target, handlers) => {
  return new Proxy(target, {
    get(obj, prop) {
      return handlers.get?.(prop) ?? obj[prop];
    },
    set(obj, prop, value) {
      return handlers.set?.(prop, value) ?? (obj[prop] = value);
    },
  });
};

// 使用
const user = { name: "Alice" };
const proxy = createProxy(user, {
  get: (prop) => console.log("Getting", prop),
  set: (prop, value) => console.log("Setting", prop, value),
});

proxy.name; // Logs: Getting name
proxy.name = "Bob"; // Logs: Setting name Bob
```

## 参考

- [patterns.dev - Proxy](https://www.patterns.dev/vanilla/proxy-pattern)
