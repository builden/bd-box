# 抽象工厂模式 (Abstract Factory)

## 一句话定义

提供一个创建一系列相关对象的接口，而无需指定它们具体的类。

## 为什么好

- **产品族一致性**：确保一系列产品互相兼容
- **解耦**：客户端与具体产品类解耦
- **易于交换**：可以整族替换产品
- **产品扩展**：新增产品族只需修改工厂

## 函数式实现

```typescript
// 抽象产品
interface Button {
  render(): string;
}

interface Input {
  render(): string;
}

// 具体产品 - Light 主题
const lightButton: Button = {
  render: () => '<button class="light">Click</button>',
};

const lightInput: Input = {
  render: () => '<input class="light" />',
};

// 具体产品 - Dark 主题
const darkButton: Button = {
  render: () => '<button class="dark">Click</button>',
};

const darkInput: Input = {
  render: () => '<input class="dark" />',
};

// 抽象工厂
interface UIFactory {
  createButton(): Button;
  createInput(): Input;
}

// 具体工厂
const createLightTheme = (): UIFactory => ({
  createButton: () => lightButton,
  createInput: () => lightInput,
});

const createDarkTheme = (): UIFactory => ({
  createButton: () => darkButton,
  createInput: () => darkInput,
});

// 使用
const app = (factory: UIFactory) => {
  console.log(factory.createButton().render());
  console.log(factory.createInput().render());
};

app(createLightTheme());
app(createDarkTheme());
```

## 适用场景

- 需要创建产品族
- 主题/皮肤系统
- 跨平台 UI
- 数据库适配器

## 禁忌

- 产品族少且固定
- 简单工厂就够

## 参考

- 《设计模式》- 抽象工厂模式
