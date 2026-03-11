# 适配器模式 (Adapter)

## 一句话定义

将一个类的接口转换成客户端期望的另一个接口。

## 为什么好

- **接口兼容**：让不兼容的接口可以一起工作
- **解耦**：客户端与具体实现解耦
- **复用**：复用已有代码

## 函数式实现

```typescript
// 旧接口
interface OldPayment {
  pay(money: number): void;
}

// 新接口
interface NewPayment {
  pay(amount: number, currency: string): Promise<boolean>;
}

// 适配器
const oldToNewAdapter = (old: OldPayment): NewPayment => ({
  pay: async (amount, currency) => {
    old.pay(amount);
    return true;
  },
});

// 使用
const oldSystem: OldPayment = {
  pay: (money) => console.log(`Paid ${money} via old system`),
};

const newSystem = oldToNewAdapter(oldSystem);
newSystem.pay(100, "USD");
```

## 适用场景

- 集成第三方库
- 接口兼容
- 遗留代码改造

## 参考

- 《设计模式》- 适配器模式
