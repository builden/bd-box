# 模式决策索引

## 质量标准

在选择模式之前，先了解什么是**高质量代码**：

- [代码质量标准定义](code-quality-standards.md)
- [设计原则](principles.md)（架构三原则：合适/简单/演化 + 代码 SOLID + KISS/YAGNI/DRY/LOD）
- [设计思想](design-thinking.md)（20+ 思想：面向对象、函数式、架构模式等）
- [代码坏味道与反模式](code-smells.md)

## 快速选择表

| 你的需求                 | 推荐模式                                                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| 需要一个全局唯一实例     | [单例](classic/creational/singleton.md)                                                                                              |
| 创建对象逻辑复杂         | [工厂](classic/creational/factory.md) / [抽象工厂](classic/creational/abstract-factory.md) / [建造者](classic/creational/builder.md) |
| 对象的创建成本高，想复用 | [原型](classic/creational/prototype.md) / [享元](structural/flyweight.md)                                                            |
| 需要统一接口             | [适配器](structural/adapter.md) / [外观](structural/facade.md)                                                                       |
| 动态添加功能             | [装饰器](structural/decorator.md)                                                                                                    |
| 处理树形结构             | [组合](structural/composite.md)                                                                                                      |
| 远程对象本地用           | [代理](structural/proxy.md)                                                                                                          |
| 算法可替换               | [策略](behavioral/strategy.md)                                                                                                       |
| 状态变化自动响应         | [观察者](behavioral/observer.md) / [状态](behavioral/state.md)                                                                       |
| 操作可撤销               | [命令](behavioral/command.md) / [备忘录](behavioral/memento.md)                                                                      |
| 遍历集合                 | [迭代器](behavioral/iterator.md)                                                                                                     |
| 多个对象需要协调         | [中介者](behavioral/mediator.md)                                                                                                     |
| 行为随状态变化           | [状态](behavioral/state.md)                                                                                                          |
| 处理多步骤流程           | [模板方法](behavioral/template-method.md) / [职责链](behavioral/chain-of-responsibility.md)                                          |

## 模式-场景矩阵

### 创建对象

| 场景         | 模式          |
| ------------ | ------------- |
| 全局唯一实例 | 单例          |
| 多种对象创建 | 工厂/抽象工厂 |
| 复杂对象构建 | 建造者        |
| 克隆对象     | 原型          |

### 组织代码结构

| 场景           | 模式   |
| -------------- | ------ |
| 统一不同接口   | 适配器 |
| 简化复杂接口   | 外观   |
| 动态添加功能   | 装饰器 |
| 处理树形结构   | 组合   |
| 共享细粒度对象 | 享元   |
| 控制对象访问   | 代理   |
| 分离接口与实现 | 桥接   |

### 管理行为

| 场景         | 模式            |
| ------------ | --------------- |
| 算法可替换   | 策略            |
| 状态变化通知 | 观察者          |
| 命令封装     | 命令            |
| 遍历集合     | 迭代器          |
| 状态机       | 状态            |
| 多步骤流程   | 模板方法/职责链 |
| 操作可撤销   | 备忘录          |
| 对象协调     | 中介者          |

## 模式分类索引

### 创建型（5个）

- [单例](classic/creational/singleton.md)
- [工厂](classic/creational/factory.md)
- [抽象工厂](classic/creational/abstract-factory.md)
- [建造者](classic/creational/builder.md)
- [原型](classic/creational/prototype.md)

### 结构型（7个）

- [适配器](classic/structural/adapter.md)
- [桥接](classic/structural/bridge.md)
- [组合](classic/structural/composite.md)
- [装饰器](classic/structural/decorator.md)
- [外观](classic/structural/facade.md)
- [享元](classic/structural/flyweight.md)
- [代理](classic/structural/proxy.md)

### 行为型（11个）

- [策略](classic/behavioral/strategy.md)
- [观察者](classic/behavioral/observer.md)
- [命令](classic/behavioral/command.md)
- [迭代器](classic/behavioral/iterator.md)
- [状态](classic/behavioral/state.md)
- [职责链](classic/behavioral/chain-of-responsibility.md)
- [模板方法](classic/behavioral/template-method.md)
- [备忘录](classic/behavioral/memento.md)
- [中介者](classic/behavioral/mediator.md)
- [访问者](classic/behavioral/visitor.md)
- [解释器](classic/behavioral/interpreter.md)

### Vanilla JS（7个）

- [模块模式](vanilla/module-pattern.md)
- [Mixins](vanilla/mixin-pattern.md)
- [Provider](vanilla/provider-pattern.md)
- [观察者](vanilla/observer-pattern.md)
- [中介者](vanilla/mediator-pattern.md)
- [代理](vanilla/proxy-pattern.md)
- [洋葱模型](vanilla/onion-model.md)

### React（6个）

- [Hooks](react/hooks-pattern.md)
- [Container/Presentational](react/container-presentational.md)
- [Render Props](react/render-props-pattern.md)
- [HOC](react/hoc-pattern.md)
- [Compound Components](react/compound-pattern.md)
- [AI UI Patterns](react/ai-ui-patterns.md)

### Vue（9个）

- [Composables](vue/composables.md)
- [Provide/Inject](vue/provide-inject.md)
- [Components](vue/components.md)
- [Dynamic Components](vue/dynamic-components.md)
- [Data Provider](vue/data-provider.md)
- [Renderless Components](vue/renderless-components.md)
- [Script Setup](vue/script-setup.md)
- [State Management](vue/state-management.md)
- [Async Components](vue/async-components.md)

### Rendering（8个）

- [SSR](rendering/server-side-rendering.md)
- [SSG](rendering/static-rendering.md)
- [Streaming SSR](rendering/streaming-ssr.md)
- [RSC](rendering/react-server-components.md)
- [CSR](rendering/client-side-rendering.md)
- [ISR](rendering/incremental-static-rendering.md)
- [Progressive Hydration](rendering/progressive-hydration.md)
- [Selective Hydration](rendering/selective-hydration.md)
