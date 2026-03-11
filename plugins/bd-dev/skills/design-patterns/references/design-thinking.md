# 设计思想

> 参考：王争《设计模式之美》

## 核心设计思想一览

```
┌──────────────────────────────────────────────────────────────┐
│                        设计思想                                │
├─────────────┬─────────────┬─────────────┬────────────────────┤
│ 函数式编程   │ 分层思想     │ 分模块思想   │ 高内聚低耦合        │
├─────────────┼─────────────┼─────────────┼────────────────────┤
│ 基于接口而非实现 │ 组合优于继承  │ 充血模型      │ 抽象思维           │
└─────────────┴─────────────┴─────────────┴────────────────────┘
```

---

## 1. 面向对象四大特性

### 封装（Encapsulation）

**定义**：隐藏内部细节，只暴露必要的操作。

```typescript
class User {
  private _name: string;
  private _email: string;

  // 暴露必要的操作
  getName() {
    return this._name;
  }
  updateEmail(newEmail: string) {
    /* 验证后更新 */
  }
}
```

### 抽象（Abstraction）

**定义**：隐藏实现细节，关注"做什么"而非"怎么做"。

```typescript
// 抽象：关注接口，不关心实现
interface Storage {
  get(key: string): unknown;
  set(key: string, value: unknown): void;
}
// 调用者只知道有 get/set，不关心是 Redis 还是 LocalStorage
```

### 继承（Inheritance）

**定义**：复用父类的属性和方法。

```typescript
class Animal {
  eat() {}
}
class Dog extends Animal {
  bark() {}
}
```

### 多态（Polymorphism）

**定义**：同一接口，不同实现。

```typescript
interface Payment {
  pay(): void;
}
class Alipay implements Payment {
  pay() {
    /* 支付宝实现 */
  }
}
class WechatPay implements Payment {
  pay() {
    /* 微信实现 */
  }
}

function checkout(p: Payment) {
  p.pay(); // 运行时决定调用哪个实现
}
```

---

## 2. 函数式编程 (Functional Programming)

### 核心思想

**函数是一等公民**，用表达式求值而非语句执行。

### 特点

| 特性     | 说明                        |
| -------- | --------------------------- |
| 纯函数   | 无副作用，相同输入→相同输出 |
| 不可变性 | 不修改状态，创建新数据      |
| 高阶函数 | 函数作为参数/返回值         |
| 组合     | 小函数组合成复杂逻辑        |

### 函数式 vs 命令式

```typescript
// 命令式：how（怎么做）
const numbers = [1, 2, 3, 4, 5];
const result: number[] = [];
for (const n of numbers) {
  if (n % 2 === 1) {
    result.push(n * 2);
  }
}

// 函数式：what（做什么）
const result = numbers.filter((n) => n % 2 === 1).map((n) => n * 2);
```

### 优势

- **可组合**：函数可像乐高一样组装
- **可测试**：纯函数易于单元测试
- **易并行**：无共享状态，无竞态条件
- **易推理**：无隐式依赖，执行顺序明确

### 实践建议

```typescript
// ✅ 保持纯度
const add = (a: number, b: number): number => a + b;

// ❌ 副作用
let count = 0;
const increment = () => count++;

// ✅ 使用数组方法替代循环
const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

// ✅ 函数组合
const pipe =
  (...fns) =>
  (x) =>
    fns.reduce((v, f) => f(v), x);
const process = pipe(trim, toLowerCase, removeSpecialChars);
```

---

## 3. 分层思想 (Layered Architecture)

### 什么是分层

将系统划分为**清晰的责任层次**，每层只关注自己的职责。

### 经典三层架构

```
┌─────────────────────────────────────────────┐
│                Presentation                  │
│              (Controller/UI)                 │
├─────────────────────────────────────────────┤
│                 Business                     │
│              (Service/Logic)                 │
├─────────────────────────────────────────────┤
│                   Data                       │
│            (Repository/DAO)                  │
└─────────────────────────────────────────────┘
```

### 前端分层示例

```typescript
// presentation/ - UI 展示
function UserCard({ user }: { user: User }) {
  return <div>{user.name}</div>;
}

// application/ - 业务流程
function useUser(id: string) {
  return useQuery(() => userService.getById(id));
}

// domain/ - 业务实体
interface User {
  id: string;
  name: string;
}

// infrastructure/ - 外部依赖
class UserRepository implements IUserRepository {
  async find(id: string): Promise<User> {
    return db.query("SELECT * FROM users WHERE id = ?", [id]);
  }
}
```

### 分层原则

- **每层只调用下层**：禁止跨层调用
- **依赖方向一致**：高层依赖低层
- **封装细节**：隐藏实现细节

---

## 4. 分模块思想 (Modularity)

### 什么是模块

模块是**功能单元**的封装，具有独立职责边界。

### 模块划分原则

| 原则     | 说明                 |
| -------- | -------------------- |
| 单一职责 | 一个模块只做一件事   |
| 高内聚   | 强相关功能放一起     |
| 低耦合   | 模块间通过接口通信   |
| 边界清晰 | 职责明确，不相互渗透 |

### 模块大小

```
┌────────────────────────────────────────────┐
│  模块粒度参考                               │
├────────────────────────────────────────────┤
│  太小：频繁依赖，维护成本高                 │
│  太大：职责混乱，难以理解                   │
│  适中：一个屏幕能看完，一个大脑能记住       │
└────────────────────────────────────────────┘
```

### 模块通信

```typescript
// ✅ 通过导出接口通信
// user/module.ts
export interface IUserService {
  getById(id: string): Promise<User>;
}
export const createUserService = (db: Database): IUserService => { ... }

// other/module.ts
import { createUserService } from "./user/module";
const userService = createUserService(myDb);

// ❌ 直接依赖内部实现
import { UserServiceImpl } from "./user/internal";
```

---

## 5. 高内聚低耦合 (High Cohesion, Low Coupling)

### 定义

| 概念 | 说明                                 |
| ---- | ------------------------------------ |
| 内聚 | 模块内部元素（功能、职责）的紧密程度 |
| 耦合 | 模块之间的依赖程度                   |

### 高内聚特征

- 功能相关：所有代码围绕同一职责
- 职责单一：每个模块只做一件事
- 易于理解：看文件名就知道做什么

### 低耦合特征

- 依赖抽象：依赖接口而非具体
- 少依赖：只依赖必要的模块
- 无循环依赖：A 不依赖 B，B 不依赖 A

### 实践

```typescript
// ❌ 低内聚：一个类做太多事
class UserManager {
  validateUser() { ... }
  sendEmail() { ... }
  calculateSalary() { ... }
  generateReport() { ... }
}

// ✅ 高内聚：拆分为独立模块
class UserValidator {}
class EmailService {}
class SalaryCalculator {}
class ReportGenerator {}
```

```typescript
// ❌ 高耦合
class OrderService {
  private mysql = new MySQLConnection();
  private logger = new FileLogger();
}

// ✅ 低耦合
class OrderService {
  constructor(
    private db: Database,
    private logger: Logger,
  ) {}
}
```

### 衡量指标

- **内聚**：看模块是否"专注"
- **耦合**：看依赖是否"稀疏"
- **最佳状态**：高内聚、低耦合

---

## 6. 组合优于继承 (Composition over Inheritance)

### 为什么

| 对比   | 继承                   | 组合               |
| ------ | ---------------------- | ------------------ |
| 耦合度 | 高（父类变化影响子类） | 低（通过接口解耦） |
| 灵活性 | 静态（编译时确定）     | 动态（运行时替换） |
| 层级   | 单继承限制             | 无限组合           |
| 理解   | 需要看父类实现         | 看接口即可         |

### 继承的问题

```typescript
// ❌ 继承的问题
class Animal {
  eat() {}
}
class Bird extends Animal {
  fly() {}
}
class Penguin extends Bird {
  // 企鹅不会飞！
  fly() {
    throw new Error("Cannot fly");
  } // 违反 Liskov
}
```

### 组合方案

```typescript
// ✅ 组合
interface Eater {
  eat(): void;
}
interface Flyer {
  fly(): void;
}
interface Swimmer {
  swim(): void;
}

class Bird implements Eater, Flyer {}
class Penguin implements Eater, Swimmer {}

class Zoo {
  constructor(private animals: Eater[]) {}
}
```

### 实践

```typescript
// ❌ 用继承实现复用
class Stack extends Array {
  push(item: unknown) {
    super.push(item);
  }
  pop() {
    return super.pop();
  }
}

// ✅ 用组合实现复用
class Stack<T> {
  private items: T[] = [];
  push(item: T) {
    this.items.push(item);
  }
  pop() {
    return this.items.pop();
  }
}
```

### 何时用继承

- 真正的"是"关系（Dog is Animal）
- 不需要修改父类行为
- 继承层级不深（< 3 层）

---

## 7. 基于接口而非实现编程 (Program to an Interface)

### 核心

依赖抽象，不依赖具体。

### 对比

```typescript
// ❌ 基于实现
class MySQLUserRepo {
  save(user: User) { /* mysql 实现 */ }
}

// ✅ 基于接口
interface UserRepository {
  save(user: User): void;
}

class MySQLUserRepo implements UserRepository { ... }
class PostgresUserRepo implements UserRepository { ... }
```

### 优势

- **可替换**：随时切换实现
- **可测试**：易 mock
- **可扩展**：添加新实现无需改调用方

### 实践

```typescript
// ❌ 硬编码依赖
class OrderService {
  private service = new AlipayService();
}

// ✅ 依赖抽象
class OrderService {
  constructor(private paymentService: PaymentService) {}
}

interface PaymentService {
  pay(amount: number): Promise<void>;
}
```

### 注意事项

- 接口要小（ISP）
- 接口要稳定（避免频繁改动）
- 不要过度抽象（YAGNI）

---

## 8. 充血模型 vs 贫血模型

### 贫血模型（Anemic Domain Model）

```typescript
// 只有数据，没有行为
class User {
  id: string;
  name: string;
  email: string;
}

// 行为在 Service 中
class UserService {
  create(user: User) { ... }
  validate(user: User) { ... }
  notify(user: User) { ... }
}
```

### 充血模型（Rich Domain Model）

```typescript
// 数据 + 行为
class User {
  private _id: string;
  private _name: string;

  constructor(id: string, name: string) {
    this.validateName(name);
    this._id = id;
    this._name = name;
  }

  private validateName(name: string) {
    if (!name) throw new Error("Name required");
  }

  rename(newName: string) {
    this.validateName(newName);
    this._name = newName;
  }
}
```

### 对比

| 维度   | 贫血模型                | 充血模型                |
| ------ | ----------------------- | ----------------------- |
| 职责   | Service 负责业务逻辑    | Domain 对象负责业务逻辑 |
| 测试   | 易测试（Service + DTO） | 难测试（需 mock 依赖）  |
| 复杂度 | 低（简单数据结构）      | 高（需理解领域逻辑）    |
| 适用   | 简单 CRUD 系统          | 复杂业务逻辑            |

### 建议

- 简单场景：贫血模型够用
- 复杂场景：充血模型更符合 DDD

---

## 9. 抽象思维

### 什么是抽象

**忽略细节，关注本质**。

### 抽象层级

```
┌─────────────────────────────────────────────┐
│              抽象层级金字塔                   │
├─────────────────────────────────────────────┤
│  高层：接口/抽象类 → 做什么                   │
│  中层：实现类         → 怎么做                 │
│  低层：具体代码       → 做的细节               │
└─────────────────────────────────────────────┘
```

### 抽象的好处

- **简化问题**：聚焦核心
- **提高复用**：抽象更通用
- **应对变化**：细节可替换

### 实践

```typescript
// 抽象层级
interface Storage {  // 高层抽象
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
}

class RedisStorage implements Storage { ... } // 中层
class RedisConnection { ... } // 低层实现
```

### 抽象 vs 过度抽象

```typescript
// ✅ 合理抽象
interface Repository<T> {
  find(id: string): Promise<T>;
  save(entity: T): Promise<void>;
}

// ❌ 过度抽象（YAGNI）
interface SuperRepository<T, K, V, U> {
  // 过度泛化，实际不需要
}
```

---

## 10. 关注点分离（Separation of Concerns）

### 核心思想

每个模块/类/函数只处理一个方面的关注点。

### 示例

```typescript
// ❌ 混合关注点
function createUserAndSendEmail(name: string, email: string) {
  // 验证
  if (!email.includes("@")) throw new Error("Invalid email");
  // 存储
  db.save({ name, email });
  // 发送邮件
  smtp.send(email, "Welcome!");
}

// ✅ 分离关注点
function createUser(name: string, email: string) {
  validateEmail(email);
  return db.save({ name, email });
}

function onUserCreated(user: User) {
  emailService.send(user.email, "Welcome!");
}
```

### 分层就是关注点分离

```
┌─────────────────────────────────────┐
│  关注点分离                          │
├─────────────────────────────────────┤
│  UI 关注点   → 如何展示              │
│  业务关注点  → 如何处理              │
│  数据关注点  → 如何存储               │
│  基础设施    → 如何连接外部服务       │
└─────────────────────────────────────┘
```

### 实践原则

- **横向分离**：分层架构
- **纵向分离**：功能模块拆分
- **职责单一**：一个类只做一件事

---

## 设计思想的关系

```
                    ┌─────────────┐
                    │  抽象思维    │
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
    ┌─────┴─────┐    ┌─────┴─────┐    ┌─────┴─────┐
    │基于接口而非实现│    │ 组合优于继承  │    │  分层思想  │
    └─────┬─────┘    └─────┬─────┘    └─────┬─────┘
          │                │                │
          └────────────────┼────────────────┘
                           │
                    ┌──────┴──────┐
                    │高内聚低耦合  │
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │  分模块思想  │
                    └─────────────┘
```

**核心洞察**：

- 抽象思维是**基础**
- 高内聚低耦合是**目标**
- 分层分模块是**手段**
- 接口编程、组合是**方法**

---

## 11. 最小惊讶原则（POLA）

### 核心思想

代码行为应该符合用户预期，不要让人惊讶。

```typescript
// ❌ 违反 POLA
function getUserList() {
  return users; // 看起来是获取，实际上返回缓存
}

// ✅ 符合预期
function getCachedUserList() {}
function fetchUserList() {}
```

---

## 12. 约定优于配置（CoC）

### 核心思想

用约定减少配置，Convention over Configuration。

```typescript
// ❌ 过度配置
const route = {
  path: "/users",
  method: "GET",
  controller: "UserController",
  action: "list",
  middleware: ["auth", "logger"],
};

// ✅ 约定优于配置
// 文件：routes/users.ts
// 自动映射到 /users 路由
```

### 实践

```typescript
// NestJS 的约定
// UserController 自动映射到 /users
@Controller("/users")
class UserController {
  @Get()
  findAll() {}
}
```

---

## 13. UNIX 哲学

### 核心思想

- **小而专**：每个程序只做一件事，做好
- **组合**：程序之间通过文本交互
- **快速原型**：先跑通，再优化

### 实践

```typescript
// ✅ 小而专
function formatDate() {}
function validateEmail() {}
function parseJSON() {}

// ❌ 大而全
function processEverything() {}

// ✅ 组合
const result = input.pipe(parseJSON).pipe(validate).pipe(transform);
```

---

## 14. 童子军规则

### 核心思想

离开时代码比来时更干净。

```typescript
// 每次修改时
// 1. 修复发现的坏味道
// 2. 添加遗漏的测试
// 3. 清理无用的注释

// ❌ 只改需要的地方，其他不动
function old() {
  /* 很多坏味道 */
}
function newFeature() {
  /* 新功能 */
}

// ✅ 顺手清理
function old() {
  /* 重构成更好 */
}
function newFeature() {
  /* 新功能 */
}
```

---

## 15. 最小权限原则

### 核心思想

只授予必要的权限，不过度授权。

```typescript
// ❌ 过度权限
class UserService {
  private db = new Database(); // 拥有全部权限
}

// ✅ 最小权限
class UserService {
  constructor(private userRepo: UserRepository) {}
  // 只拥有操作用户的能力
}
```

### 实践

- 函数只接收必要的参数
- 类只暴露必要的方法
- API 只返回必要的字段

---

## 16. 响应式编程（Reactive Programming）

### 核心思想

数据流驱动，异步非阻塞。

```typescript
// ❌ 命令式
const data = fetchData();
process(data);

// ✅ 响应式
data$.pipe(map(transform), filter(valid)).subscribe(render);
```

### 优势

- 声明式：表达"做什么"而非"怎么做"
- 异步流：处理事件、实时数据
- 组合：流可组合变换

---

## 17. 事件驱动（Event-Driven）

### 核心思想

通过事件解耦组件。

```typescript
// 事件发布
class UserService {
  createUser(name: string) {
    const user = this.repo.save({ name });
    this.eventBus.emit("user.created", user);
  }
}

// 事件订阅（解耦）
class NotificationService {
  @On("user.created")
  sendWelcome(user: User) {
    this.email.send(user.email, "Welcome!");
  }
}
```

### 模式

- **Pub/Sub**：发布订阅
- **Event Bus**：事件总线
- **CQRS**：命令查询分离

---

## 18. MVC / MVP / MVVM

### MVC（Model-View-Controller）

```
┌─────────┐     ┌───────────┐     ┌─────────┐
│  View   │ ←── │Controller │ ←── │  Model  │
│  展示    │ ──→ │  处理逻辑  │ ──→ │  数据   │
└─────────┘     └───────────┘     └─────────┘
```

### MVVM（Model-View-ViewModel）

```
┌─────────┐     ┌────────────┐     ┌─────────┐
│  View   │ ←── │ ViewModel  │ ←── │  Model  │
│  展示    │ ──→ │ 双向绑定    │ ──→ │  数据   │
└─────────┘     └────────────┘     └─────────┘
```

### 实践

```typescript
// Vue MVVM
const vm = new Vue({
  data: { message: "Hello" },
  methods: {
    greet() {
      alert(this.message);
    },
  },
});
// View 自动同步 ViewModel 的变化
```

---

## 19. CQRS（命令查询职责分离）

### 核心思想

命令（写）和查询（读）使用不同模型。

```typescript
// 命令模型 - 写
class CreateOrderCommand {
  constructor(
    private items: Item[],
    private customer: Customer,
  ) {}
}

// 查询模型 - 读
class OrderQuery {
  constructor(private readDb: ReadDB) {}
  getOrderSummary(id: string) {
    // 专门优化的读取模型
    return this.readDb.query("...");
  }
}
```

### 优势

- 读写分离优化
- 复杂场景下更灵活
- 事件溯源结合

---

## 20. 测试思想

### 测试金字塔

```
           ╱╲
          ╱  ╲        E2E（少量）
         ╱────╲
        ╱      ╲      集成测试（中等）
       ╱────────╲
      ╱          ╲    单元测试（大量）
     ╱────────────╲
```

### AAA 模式

```typescript
describe("add", () => {
  it("should return sum of two numbers", () => {
    // Arrange - 准备
    const a = 1,
      b = 2;

    // Act - 执行
    const result = add(a, b);

    // Assert - 断言
    expect(result).toBe(3);
  });
});
```

### 测试思想

- **Arrange**：准备测试数据
- **Act**：执行被测操作
- **Assert**：验证结果
