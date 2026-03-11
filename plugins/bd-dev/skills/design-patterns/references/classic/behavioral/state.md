# 状态模式 (State)

## 一句话定义

允许对象在内部状态改变时改变它的行为，看起来像对象修改了它的类。

## 为什么好

- **消除 if-else**：用状态对象替换条件分支
- **状态转换清晰**：每个状态独立封装
- **易于扩展**：新增状态只需添加新对象

## 函数式实现

```typescript
type State<T> = {
  handle: (context: T) => void;
};

const createOrderContext = () => {
  let state: State<Context> = pendingState;

  const context = {
    setState(newState: State<Context>) {
      state = newState;
    },
    proceed() {
      state.handle(context);
    },
  };

  return context;
};

const pendingState: State<any> = {
  handle(ctx) {
    console.log("Processing order...");
    ctx.setState(confirmedState);
  },
};

const confirmedState: State<any> = {
  handle(ctx) {
    console.log("Order confirmed!");
    ctx.setState(shippedState);
  },
};

const shippedState: State<any> = {
  handle(ctx) {
    console.log("Order shipped!");
  },
};

// 使用
const order = createOrderContext();
order.proceed(); // Processing...
order.proceed(); // Confirmed!
order.proceed(); // Shipped!
```

## 适用场景

- 状态机
- 工作流
- 游戏状态

## 参考

- 《设计模式》- 状态模式
