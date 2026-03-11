# 设计原则

本文件包含两层设计原则：

- **代码设计原则**：代码层面的设计规范（SOLID、辅助原则）
- **架构设计原则**：系统层面的架构规范（来自《从零开始学架构》）

---

## 一、架构设计原则（系统层面）

> 来自李运华《从零开始学架构》，适用于系统架构设计决策。

### 架构设计三原则

| 原则         | 宣言             | 核心价值                 |
| ------------ | ---------------- | ------------------------ |
| **合适原则** | 合适优于业界领先 | 不贪大求全，尊重现实约束 |
| **简单原则** | 简单优于复杂     | 避免过度设计，降低复杂度 |
| **演化原则** | 演化优于一步到位 | 持续迭代，不过度设计未来 |

### 1. 合适原则

**宣言**：合适优于业界领先。

**核心理解**：

- 架构设计不是选最先进的技术，而是选最合适当前业务、团队、成本的技术
- BAT 的架构到小公司不一定适用（没有大公司的资源、平台、积累和业务）
- 失败原因：
  - **将军难打无兵之仗**：人数不够，无法驾驭复杂架构
  - **罗马不是一天建成的**：积累不够，无法支撑先进方案
  - **冰山下面才是关键**：业务理解不深，架构无法落地

**实践**：

```
❌ 照搬淘宝/京东的电商架构
✅ 根据团队规模和业务阶段选择合适方案（单体 → 模块化 → 微服务）
```

### 2. 简单原则

**宣言**：简单优于复杂。

**复杂度来源**：

| 类型       | 说明                                                             |
| ---------- | ---------------------------------------------------------------- |
| 结构复杂性 | 组件数量多、组件间关系复杂、可用性下降、改动影响面大、问题定位难 |
| 逻辑复杂性 | 单组件承担功能过多、算法复杂难以维护、功能修改影响范围大         |

**实践**：

```
❌ 微服务全家桶（当前只需单体）
✅ 优先选择简单的、能满足需求的方案
```

### 3. 演化原则

**宣言**：演化优于一步到位。

**核心理解**：

- 软件架构不同于建筑架构——建筑不可变，软件可变
- 软件像生物一样，通过演化适应环境，逐步变得强大
- 演化路径：
  1. 首先满足当前需要
  2. 不断迭代优化
  3. 业务变化时，架构扩展或重构

**实践**：

```
❌ 一步到位设计"可用10年"的架构
✅ 先满足当前业务， 随着业务发展持续演进
```

### 架构设计流程

```
识别问题 → 制定多个方案 → 选择最优方案 → 详细方案设计
```

| 步骤     | 说明                               |
| -------- | ---------------------------------- |
| 识别问题 | 明确业务复杂度、性能、可靠性等需求 |
| 制定方案 | 设计 2-3 个备选方案，包含权衡分析  |
| 选择方案 | 根据三原则选择最适合当前阶段的方案 |
| 详细设计 | 完成技术选型、模块划分、接口设计等 |

### 架构复杂度来源

| 复杂度     | 说明                     | 典型场景           |
| ---------- | ------------------------ | ------------------ |
| **高性能** | 需要处理大量并发请求     | 搜索引擎、电商平台 |
| **高可用** | 需要 7×24 小时不间断服务 | 金融系统、通讯系统 |
| **可扩展** | 需要快速响应业务变化     | SaaS、平台系统     |
| **低成本** | 需要在有限预算内实现     | 创业项目、内部工具 |
| **安全**   | 需要防止攻击和数据泄露   | 支付、用户数据     |
| **规模**   | 需要支撑海量数据和用户   | 社交平台、物联网   |

---

## 二、代码设计原则

### SOLID 原则

| 原则     | 一句话                 | 核心价值       |
| -------- | ---------------------- | -------------- |
| 单一职责 | 一个类只做一件事       | 可维护、可测试 |
| 开闭     | 对扩展开放，对修改封闭 | 可扩展、可复用 |
| 里氏替换 | 子类可以替换父类       | 可靠性         |
| 接口隔离 | 尽量少依赖小接口       | 解耦           |
| 依赖倒置 | 依赖抽象，不依赖具体   | 可替换         |

## 辅助原则

| 原则       | 一句话               | 核心价值       |
| ---------- | -------------------- | -------------- |
| KISS       | 保持简单             | 可读、可维护   |
| YAGNI      | 不要做当前不需要的事 | 避免过度设计   |
| DRY        | 不要重复自己         | 可复用、可维护 |
| LOD        | 只和直接朋友交流     | 解耦           |
| 奥卡姆剃刀 | 如无必要，勿增实体   | 避免过度设计   |

## 反模式警示

- **上帝类（God Class）**：一个类做太多事情
- **循环依赖**：模块之间相互依赖
- **深层嵌套**：代码层级过深
- **魔法数字/字符串**：硬编码的常量
- **硬编码**：配置写在代码里

## 原则详解

### 单一职责（SRP）

一个类/模块只负责一件事。当需要修改一个类时，只有一个原因会导致修改。

```typescript
// 错误：一个类做多件事
class User {
  validate() {
    /* 验证 */
  }
  save() {
    /* 存储 */
  }
  sendEmail() {
    /* 发送邮件 */
  }
}

// 正确：分离职责
class UserValidator {}
class UserRepository {}
class EmailService {}
```

### 开闭（OCP）

对扩展开放，对修改封闭。通过继承/组合扩展行为，而不是修改已有代码。

```typescript
// 错误：修改原有类添加新行为
class Payment {
  pay(type: "alipay" | "wechat") {
    if (type === "alipay") {
      /* ... */
    }
    if (type === "wechat") {
      /* ... */
    }
  }
}

// 正确：扩展新支付方式无需修改原有代码
interface Payment {
  pay(): void;
}
class Alipay implements Payment {}
class WechatPay implements Payment {}
```

### 里氏替换（LSP）

子类可以替换父类而不影响程序正确性。

```typescript
class Bird {
  fly() {
    /* 飞 */
  }
}
// 如果企鹅继承 Bird，需要重写 fly 抛出异常，违反 LSP
// 正确做法：将 fly 提取为接口
```

### 接口隔离（ISP）

尽量依赖小接口，而不是大接口。

```typescript
// 错误：大接口
interface Worker {
  work();
  eat();
  sleep();
}

// 正确：小接口
interface Workable {
  work();
}
interface Eatable {
  eat();
}
class Human implements Workable, Eatable {}
class Robot implements Workable {}
```

### 依赖倒置（DIP）

依赖抽象，不依赖具体。高层模块不应该依赖低层模块。

```typescript
// 错误：高层依赖低层
class OrderService {
  private database = new MySQLDatabase();
}

// 正确：依赖抽象
class OrderService {
  private database: Database;
  constructor(database: Database) {
    this.database = database;
  }
}
interface Database {
  save();
}
```

### KISS（Keep It Simple, Stupid）

保持简单。简单才容易读懂，bug 才不容易隐藏。

**核心**：

- 代码行数少 ≠ 简单（要考虑逻辑复杂度、实现难度、可读性）
- 复杂问题用复杂方法解决，并不违反 KISS

**实践**：

```typescript
// ❌ 为优化而优化，牺牲可读性
const fastMultiply = (a: number, b: number) => a * b; // 过度优化

// ❌ 重复造轮子
function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ✅ 使用标准库
import { isValidEmail } from "./utils";

function processData(data: unknown): string {
  if (typeof data !== "string") {
    throw new Error("Expected string");
  }
  return data.trim();
}
```

### YAGNI（You Aren't Gonna Need It）

你不会需要它。不要设计当前用不到的功能。

**核心**：

- KISS 回答"怎么做"，YAGNI 回答"要不要做"
- 不要过度设计

**实践**：

```typescript
// ❌ 为未来预留（当前不用）
interface User {
  name: string;
  email: string;
  phone?: string; // 当前不用
  address?: string; // 当前不用
  avatar?: string; // 当前不用
}

// ✅ 只设计当前需要的
interface User {
  name: string;
  email: string;
}
```

### DRY（Don't Repeat Yourself）

不要重复自己。重复代码是万恶之源。

**核心**：

- 重复逻辑 → 抽取函数
- 重复配置 → 提取常量
- 重复类型 → 提取公共类型

**实践**：

```typescript
// ❌ 重复代码
function createUser() {
  const user = { name: "test", role: "user", createdAt: new Date() };
  return user;
}
function createAdmin() {
  const user = { name: "admin", role: "admin", createdAt: new Date() };
  return user;
}

// ✅ 抽取公共逻辑
function createUser(name: string, role: string) {
  return { name, role, createdAt: new Date() };
}
```

### LOD（Law of Demeter）

迪米特法则，又称最少知识原则。只和直接朋友交流，不和陌生人说话。

**核心**：

- 减少对象之间的依赖
- 只调用直接朋友的方法

**实践**：

```typescript
class User {
  getName() {
    return "Alice";
  }
}
class UserProfile {
  getUser() {
    return new User();
  }
}

// ❌ 链式调用，违反 LOD
const name = userProfile.getUser().getName();

// ✅ 通过朋友获取
const user = userProfile.getUser();
const name = user.getName();
```

### 奥卡姆剃刀（Ockham's Razor）

如无必要，勿增实体。**不要引入不必要的复杂性**。

**核心**：

- 简单的方案比复杂的好
- 先用简单方案，必要时再复杂化
- 避免过度工程

**与 YAGNI 的关系**：

- 奥卡姆剃刀：**更倾向于简单**
- YAGNI：**更倾向于不做**

**实践**：

```typescript
// ❌ 过度设计：引入不必要的抽象
interface IUserRepository {
  findById(id: string): Promise<User>;
  findByEmail(email: string): Promise<User>;
  save(user: User): Promise<void>;
  delete(id: string): Promise<void>;
}
class UserRepositoryImpl implements IUserRepository { ... }

// ✅ 简单直接：当前只需要一个方法
async function getUser(id: string): Promise<User | null> {
  return db.query("SELECT * FROM users WHERE id = ?", [id]);
}
```

```typescript
// ❌ 过度工程：抽象出"通用"框架
class AbstractBaseService<T, K, M> {
  protected abstract mapToEntity(dto: K): T;
  protected abstract validate(entity: T): boolean;
  // ... 10 层抽象
}

// ✅ 够用就好
function createUser(name: string): User {
  return { id: crypto.randomUUID(), name };
}
```
