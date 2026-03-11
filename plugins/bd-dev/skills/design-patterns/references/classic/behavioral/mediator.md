# 中介者模式 (Mediator)

## 一句话定义

用一个中介对象来封装一系列对象之间的交互。

## 为什么好

- **解耦**：对象之间解耦
- **集中控制**：交互逻辑集中
- **减少继承**：避免大量子类

## 函数式实现

```typescript
type Mediator = {
  notify: (sender: string, event: string) => void;
};

const createMediator = (components: Record<string, any>) => {
  const mediator: Mediator = {
    notify(sender, event) {
      if (sender === "user" && event === "login") {
        components.notification.send("Welcome!");
      }
      if (sender === "order" && event === "placed") {
        components.cart.clear();
      }
    },
  };
  return mediator;
};

// 使用
const notification = {
  send: (msg: string) => console.log("Notification:", msg),
};

const cart = {
  clear: () => console.log("Cart cleared"),
};

const mediator = createMediator({ notification, cart });
mediator.notify("order", "placed");
```

## 适用场景

- UI 组件通信
- 事件系统
- 解耦复杂交互

## 参考

- [patterns.dev - Mediator](https://www.patterns.dev/vanilla/mediator-pattern)
- 《设计模式》- 中介者模式
