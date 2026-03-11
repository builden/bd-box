# 模板方法模式 (Template Method)

## 一句话定义

定义算法骨架，将一些步骤延迟到子类中。

## 为什么好

- **代码复用**：复用算法骨架
- **扩展点**：提供扩展点让子类定制
- **开闭原则**：修改算法结构无需修改客户端

## 函数式实现

```typescript
type Step<T> = () => T | Promise<T>;

const createTemplate = <T>(steps: {
  init: Step<T>;
  validate: Step<boolean>;
  process: Step<T>;
  cleanup: Step<void>;
}) => {
  return async () => {
    const context = await steps.init();
    if (!(await steps.validate())) {
      throw new Error("Validation failed");
    }
    const result = await steps.process();
    await steps.cleanup();
    return result;
  };
};

// 使用
const processOrder = createTemplate({
  init: async () => ({ id: 1, items: [] }),
  validate: async (ctx) => ctx.items.length > 0,
  process: async (ctx) => {
    console.log("Processing order");
    return ctx;
  },
  cleanup: async () => {
    console.log("Cleanup done");
  },
});

processOrder();
```

## 适用场景

- 算法骨架固定
- 多子类共享骨架
- 扩展点

## 参考

- 《设计模式》- 模板方法模式
