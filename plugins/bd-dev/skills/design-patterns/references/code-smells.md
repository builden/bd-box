# 代码坏味道与反模式

> 参考：王争《设计模式之美》

## 坏味道一览

```
┌─────────────────────────────────────────────────────────────┐
│                    常见坏味道                                 │
├─────────────────────────────────────────────────────────────┤
│ 代码冗余    │ 重复代码、长方法、冗余类、多余注释             │
│ 设计问题    │ 霰弹式修改、发散式变化、基本类型偏执           │
│ 对象问题    │ 数据泥团、纯数据类、过小的类                   │
│ 条件问题    │ 深层嵌套、Switch 滥用、门面式方法              │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. 代码冗余类

### 重复代码（Duplicated Code）

**特征**：同一逻辑出现 2 次以上。

```typescript
// ❌ 重复代码
function createUser() {
  const now = new Date();
  return { name: "user", createdAt: now, updatedAt: now };
}
function createAdmin() {
  const now = new Date();
  return { name: "admin", createdAt: now, updatedAt: now };
}

// ✅ 抽取公共逻辑
function createBaseUser(name: string) {
  const now = new Date();
  return { name, createdAt: now, updatedAt: now };
}
```

### 长方法（Long Method）

**特征**：函数超过 30-50 行。

```typescript
// ❌ 长方法
function processOrder(order: Order) {
  // 100 行...
}

// ✅ 拆分
function processOrder(order: Order) {
  validateOrder(order);
  calculateTotal(order);
  applyDiscount(order);
  saveOrder(order);
  notifyCustomer(order);
}
```

### 冗余类（Lazy Class / Speculative Generality）

**特征**：几乎不做事，或为未来预留的类。

```typescript
// ❌ 冗余类
class OrderValidator {
  validate(order: Order) {
    return true; // 总是返回 true
  }
}

// ✅ 移除或实现真正的逻辑
```

---

## 2. 设计问题类

### 霰弹式修改（Shotgun Surgery）

**特征**：改一个功能要改多个地方。

```typescript
// ❌ 霰弹式修改
// user.ts
const USER_ROLE = "user";
// order.ts
const ORDER_USER_ROLE = "user";
// product.ts
const PRODUCT_USER_ROLE = "user";

// ✅ 集中定义
// roles.ts
export const ROLES = { USER: "user", ADMIN: "admin" } as const;
```

### 发散式变化（Divergent Change）

**特征**：一个类因为不同原因需要修改。

```typescript
// ❌ 发散式变化
class User {
  validate() {
    /* 因为验证改 */
  }
  save() {
    /* 因为存储改 */
  }
  sendEmail() {
    /* 因为邮件改 */
  }
}

// ✅ 拆分
class UserValidator {}
class UserRepository {}
class EmailService {}
```

### 基本类型偏执（Primitive Obsession）

**特征**：用基本类型代替小对象。

```typescript
// ❌ 基本类型偏执
function createUser(name: string, email: string, phone: string) {}
function createOrder(address: string, city: string, zip: string) {}

// ✅ 使用对象
interface Address {
  street: string;
  city: string;
  zip: string;
}
function createOrder(address: Address) {}
```

---

## 3. 对象问题类

### 数据泥团（Data Clumps）

**特征**：总是同时出现的几个变量。

```typescript
// ❌ 数据泥团
function draw(x1: number, y1: number, x2: number, y2: number) {}
function move(x1: number, y1: number, x2: number, y2: number) {}

// ✅ 提取对象
interface Point {
  x: number;
  y: number;
}
function draw(from: Point, to: Point) {}
```

### 纯数据类（Data Class）

**特征**：只有 getter/setter 的类。

```typescript
// ❌ 纯数据类
class User {
  name: string;
  email: string;
  getName() {
    return this.name;
  }
  setName(name: string) {
    this.name = name;
  }
}

// ✅ 添加行为
class User {
  private _name: string;
  rename(newName: string) {
    this.validateName(newName);
    this._name = newName;
  }
}
```

### 过小的类（Micro Class）

**特征**：拆分过度。

```typescript
// ❌ 过度拆分
class UserName {
  get() {
    return name;
  }
}
class UserEmail {
  get() {
    return email;
  }
}
class UserRepository {
  save() {}
}

// ✅ 适度合并
class User {
  private name: string;
  private email: string;
}
```

---

## 4. 条件问题类

### 深层嵌套（Deep Nesting）

**特征**：if/for 嵌套超过 3 层。

```typescript
// ❌ 深层嵌套
if (user) {
  if (user.isActive) {
    if (user.hasPermission) {
      // 3 层嵌套
    }
  }
}

// ✅ 提前 return
if (!user || !user.isActive || !user.hasPermission) return;
// 主逻辑
```

### Switch 滥用（Switch Statement）

**特征**：多个 switch 处理相似逻辑。

```typescript
// ❌ Switch 滥用
function getDiscount(user: User) {
  switch (user.type) {
    case "vip":
      return 0.2;
    case "premium":
      return 0.1;
    case "regular":
      return 0.05;
  }
}

// ✅ 多态/策略模式
interface DiscountStrategy {
  get(): number;
}
class VipDiscount implements DiscountStrategy {
  get() {
    return 0.2;
  }
}
```

---

## 5. 其他常见问题

### 门 面 式 方 法（Feature Envy）

**特征**：一个方法过度依赖另一个对象。

```typescript
// ❌ Feature Envy
function getUserName(user: User) {
  return user.getProfile().getName();
}

// ✅ 移到正确的类
user.getName();
```

### 中间人（Middle Man）

**特征**：类只是转发调用，没有实际功能。

```typescript
// ❌ 中间人
class UserService {
  private repo = new UserRepository();
  getUser(id: string) {
    return this.repo.getUser(id); // 纯粹转发
  }
}

// ✅ 直接使用
type UserService = UserRepository;
```

### 魔法数字/字符串（Magic Numbers）

**特征**：硬编码的数值。

```typescript
// ❌ 魔法数字
if (status === 1) {
  /* 处理中 */
}
if (status === 2) {
  /* 已完成 */
}

// ✅ 命名常量
enum OrderStatus {
  Pending = 1,
  Completed = 2,
}
```

### 硬编码（Hard Code）

**特征**：配置写在代码里。

```typescript
// ❌ 硬编码
const API_URL = "https://api.example.com";
const MAX_RETRIES = 3;

// ✅ 配置外置
const API_URL = process.env.API_URL;
const MAX_RETRIES = config.get("maxRetries");
```

---

## 反模式警示

| 反模式       | 描述             | 解决      |
| ------------ | ---------------- | --------- |
| **上帝类**   | 一个类做所有事   | 拆分职责  |
| **魔法数字** | 硬编码数值       | 常量枚举  |
| **循环依赖** | A→B→A            | 依赖注入  |
| **强力胶**   | 过度耦合         | 接口抽象  |
| **过早优化** | 为性能牺牲可读性 | KISS 优先 |

---

## 坏味道与原则对应

| 坏味道     | 违反原则  |
| ---------- | --------- |
| 重复代码   | DRY       |
| 长方法     | SRP、KISS |
| 霰弹式修改 | SRP、OCP  |
| 发散式变化 | SRP       |
| 深层嵌套   | KISS      |
| 硬编码     | OCP       |
| 上帝类     | SRP       |
