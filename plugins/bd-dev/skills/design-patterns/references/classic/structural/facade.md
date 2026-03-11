# 外观模式 (Facade)

## 一句话定义

为复杂的子系统提供一个统一的接口，使子系统更容易使用。

## 为什么好

- **简化接口**：为复杂子系统提供简单接口
- **解耦**：客户端与子系统解耦
- **分层**：清晰系统层次

## 函数式实现

```typescript
// 复杂子系统
const subsystem1 = {
  init: () => console.log("Subsystem1 init"),
  process: () => console.log("Subsystem1 process"),
};

const subsystem2 = {
  configure: () => console.log("Subsystem2 configure"),
  execute: () => console.log("Subsystem2 execute"),
};

const subsystem3 = {
  prepare: () => console.log("Subsystem3 prepare"),
  run: () => console.log("Subsystem3 run"),
};

// 外观
const appFacade = {
  start() {
    subsystem1.init();
    subsystem2.configure();
    subsystem3.prepare();
    subsystem1.process();
    subsystem2.execute();
    subsystem3.run();
  },
  stop() {
    // 统一的关闭逻辑
  },
};

// 使用
appFacade.start();
```

## 适用场景

- 复杂系统简化接口
- 库封装
- 遗留系统改造

## 参考

- 《设计模式》- 外观模式
