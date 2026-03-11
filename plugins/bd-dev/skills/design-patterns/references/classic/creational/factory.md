# 工厂模式 (Factory)

## 一句话定义

使用工厂函数创建对象，而不直接使用 new 关键字。

## 为什么好

- **封装创建逻辑**：将对象创建逻辑集中在一处
- **解耦**：客户端不需要知道具体类名
- **易于扩展**：新增产品类型只需修改工厂
- **延迟初始化**：可以按需创建对象

## 函数式实现

### 简单工厂

```typescript
type User = {
  name: string;
  role: "admin" | "user" | "guest";
};

const createUser = (name: string, role: User["role"]): User => ({
  name,
  role,
  // 可添加默认方法
  greet() {
    return `Hello, I'm ${this.name}`;
  },
});

const admin = createUser("Alice", "admin");
const user = createUser("Bob", "user");
```

### 参数化工厂

```typescript
interface Payment {
  pay(amount: number): void;
}

const createPayment = (type: "alipay" | "wechat" | "card"): Payment => {
  const payments = {
    alipay: () => ({
      pay(amount: number) {
        console.log(`Alipay: ${amount}`);
      },
    }),
    wechat: () => ({
      pay(amount: number) {
        console.log(`Wechat: ${amount}`);
      },
    }),
    card: () => ({
      pay(amount: number) {
        console.log(`Card: ${amount}`);
      },
    }),
  };
  return payments[type]();
};

const payment = createPayment("alipay");
payment.pay(100);
```

### 工厂函数 + 配置对象

```typescript
type UserConfig = {
  name: string;
  email: string;
  avatar?: string;
};

const createUser = (config: UserConfig) => {
  const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${config.name}`;
  return {
    ...config,
    avatar: config.avatar ?? defaultAvatar,
    createdAt: new Date(),
  };
};
```

## 适用场景

- 创建逻辑复杂
- 需要按条件创建不同类型的对象
- 需要延迟初始化
- 想要解耦对象创建和使用

## 禁忌（什么时候不该用）

- **简单对象**：直接 `new` 就够的情况
- **过度工程**：不要为了"工厂"而工厂
- **类型爆炸**：类型过多时考虑抽象工厂

## 类实现（补充）

```typescript
class PaymentFactory {
  static createPayment(type: "alipay" | "wechat"): Payment {
    switch (type) {
      case "alipay":
        return new Alipay();
      case "wechat":
        return new WechatPay();
    }
  }
}
```

## 对比：工厂 vs 抽象工厂 vs 建造者

| 模式     | 用途               | 复杂度 |
| -------- | ------------------ | ------ |
| 工厂     | 创建同类型对象     | 简单   |
| 抽象工厂 | 创建一系列相关对象 | 中等   |
| 建造者   | 复杂对象分步构建   | 较复杂 |

## 参考

- [patterns.dev - Factory](https://www.patterns.dev/vanilla/factory-pattern)
- 《设计模式》- 工厂方法模式
