# Mediator Pattern (Vanilla)

## 一句话定义

中介者模式的 Vanilla JS 实现。

## 函数式实现

```typescript
const createMediator = () => {
  const channels = {};

  return {
    subscribe(channel, fn) {
      (channels[channel] ??= []).push(fn);
      return () => {
        channels[channel] = channels[channel].filter((f) => f !== fn);
      };
    },
    publish(channel, data) {
      (channels[channel] ??= []).forEach((fn) => fn(data));
    },
  };
};

// 使用
const mediator = createMediator();
mediator.subscribe("user:login", (user) => console.log(user));
mediator.publish("user:login", { name: "Alice" });
```

## 参考

- [patterns.dev - Mediator](https://www.patterns.dev/vanilla/mediator-pattern)
