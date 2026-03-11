# 职责链模式 (Chain of Responsibility)

## 一句话定义

将请求的发送者和接收者解耦，让多个对象都有可能接收请求，沿链传递直到被处理。

## 为什么好

- **解耦**：发送者和接收者解耦
- **灵活配置**：可以调整链的顺序
- **单一职责**：每个处理者只负责一件事

## 函数式实现

```typescript
type Handler<T> = (request: T) => boolean | void;

const createChain = <T>(...handlers: Handler<T>[]) => {
  return {
    handle(request: T) {
      for (const handler of handlers) {
        const result = handler(request);
        if (result === false) break;
      }
    },
  };
};

// 使用
const auth = (req: any) => {
  if (!req.user) {
    console.log("Unauthorized");
    return false;
  }
};

const validate = (req: any) => {
  if (!req.data) {
    console.log("Invalid data");
    return false;
  }
};

const log = (req: any) => {
  console.log("Logging:", req);
};

const chain = createChain(auth, validate, log);
chain.handle({ user: "Alice", data: { id: 1 } });
```

## 适用场景

- 多个对象处理请求
- 事件冒泡
- 中间件

## 参考

- 《设计模式》- 职责链模式
