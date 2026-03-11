# 策略模式 (Strategy)

## 一句话定义

定义一系列算法，把它们一个个封装起来，使它们可以互相替换。

## 为什么好

- **算法可替换**：运行时切换算法
- **开闭原则**：新增算法不修改原有代码
- **消除 if-else**：用对象替换条件分支
- **易于测试**：每个策略独立可测试
- **代码复用**：策略可在不同场景复用

## 函数式实现

### 基础实现

```typescript
type Strategy<T, R> = (input: T) => R;

const executeStrategy = <T, R>(strategy: Strategy<T, R>, input: T): R => {
  return strategy(input);
};

// 使用
const uppercase = (s: string) => s.toUpperCase();
const lowercase = (s: string) => s.toLowerCase();
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

executeStrategy(uppercase, "hello"); // 'HELLO'
executeStrategy(lowercase, "HELLO"); // 'hello'
executeStrategy(capitalize, "hello"); // 'Hello'
```

### 带状态的策略

```typescript
interface PaymentStrategy {
  pay(amount: number): boolean;
}

const createPaymentContext = () => {
  let strategy: PaymentStrategy = {
    pay(amount: number) {
      console.log(`Paid ${amount} via default`);
      return true;
    },
  };

  return {
    setStrategy(newStrategy: PaymentStrategy) {
      strategy = newStrategy;
    },
    pay(amount: number) {
      return strategy.pay(amount);
    },
  };
};

const creditCardStrategy: PaymentStrategy = {
  pay(amount: number) {
    console.log(`Paid ${amount} via Credit Card`);
    return true;
  },
};

const context = createPaymentContext();
context.pay(100); // default
context.setStrategy(creditCardStrategy);
context.pay(100); // Credit Card
```

### 策略模式替代 if-else

```typescript
// 错误：if-else 链
function calculate(order: Order) {
  if (order.type === "electronics") {
    return order.price * 0.9;
  } else if (order.type === "clothing") {
    return order.price * 0.8;
  } else if (order.type === "food") {
    return order.price * 0.95;
  }
  return order.price;
}

// 正确：策略模式
type DiscountStrategy = (price: number) => number;

const strategies: Record<string, DiscountStrategy> = {
  electronics: (price) => price * 0.9,
  clothing: (price) => price * 0.8,
  food: (price) => price * 0.95,
};

const calculate = (order: Order) => {
  const discount = strategies[order.type] ?? ((p) => p);
  return discount(order.price);
};
```

## 适用场景

- 多种算法可互换
- 需要动态切换算法
- 想避免 if-else 或 switch
- 需要对客户隐藏算法实现细节

## 禁忌（什么时候不该用）

- **简单场景**：if-else 就够，不要过度设计
- **算法少且不变**：不会扩展的场景
- **性能敏感**：策略模式有额外函数调用开销

## 策略 vs 状态

| 特征     | 策略模式 | 状态模式             |
| -------- | -------- | -------------------- |
| 目的     | 替换算法 | 改变行为             |
| 切换     | 手动设置 | 自动转换             |
| 对象关系 | 独立     | 状态对象知道其他状态 |

## 类实现（补充）

```typescript
interface Strategy {
  execute(data: string): string;
}

class Context {
  private strategy: Strategy;

  constructor(strategy: Strategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy: Strategy) {
    this.strategy = strategy;
  }

  executeStrategy(data: string) {
    return this.strategy.execute(data);
  }
}
```

## 参考

- 《设计模式》- 策略模式
