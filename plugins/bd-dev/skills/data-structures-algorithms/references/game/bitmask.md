# 位掩码

## 一句话定义

用单个整数的位表示多个布尔状态。

## 为什么好

**优点：**

- 内存极省：1 位/状态
- 操作极快：位运算 O(1)
- 适合标志位

**缺点：**

- 只能表示布尔
- 可读性差
- 有位数限制

## 适用场景

- **状态标志**：游戏实体状态
- **权限管理**：用户权限
- **过滤器**：多条件组合

## 代码实现

```typescript
// 定义标志位
const enum EntityFlags {
  NONE = 0,
  ALIVE = 1 << 0, // 0001
  VISIBLE = 1 << 1, // 0010
  MOVING = 1 << 2, // 0100
  ATTACKING = 1 << 3, // 1000
  INVULNERABLE = 1 << 4,
  POISONED = 1 << 5,
  STUNNED = 1 << 6,
}

// 使用位掩码
class Entity {
  flags: number = EntityFlags.NONE;

  // 设置标志
  addFlag(flag: number): void {
    this.flags |= flag;
  }

  // 清除标志
  removeFlag(flag: number): void {
    this.flags &= ~flag;
  }

  // 切换标志
  toggleFlag(flag: number): void {
    this.flags ^= flag;
  }

  // 检查标志
  hasFlag(flag: number): boolean {
    return (this.flags & flag) !== 0;
  }

  // 组合标志
  addFlags(...flags: number[]): void {
    for (const flag of flags) {
      this.addFlag(flag);
    }
  }
}

// 使用
const player = new Entity();
player.addFlag(EntityFlags.ALIVE);
player.addFlag(EntityFlags.VISIBLE);

if (player.hasFlag(EntityFlags.STUNNED)) {
  // 不能移动
}

player.addFlag(EntityFlags.POISONED);

// 权限系统
const enum Permission {
  READ = 1 << 0, // 001
  WRITE = 1 << 1, // 010
  DELETE = 1 << 2, // 100
}

let userPermissions = Permission.READ | Permission.WRITE;

// 检查权限
function canRead(p: number) {
  return (p & Permission.READ) !== 0;
}
function canWrite(p: number) {
  return (p & Permission.WRITE) !== 0;
}
```

## 经典应用案例

- **游戏状态机**：实体状态管理
- **权限系统**：Linux 文件权限
- **UI 状态**：React 组件 flags
- **网络协议**：TCP 标志位

**为什么选择**：位掩码是游戏开发必备技能，一个整数可以表示 32 个布尔状态。

## 使用边界

**何时不用：**

- 状态数量超过 32/64：需要用多个整数
- 状态有额外数据：位掩码只能表示有无
- 需要序列化存储：调试困难，可读性差

**注意事项：**

- 明确枚举值：使用 1 << 0, 1 << 1 而非 magic number
- 有符号整数：JavaScript/TypeScript 使用无符号位移
- 组合标志：多个标志组合时考虑可读性
- 性能权衡：位运算快但调试困难

**面试常考点：**

- 位掩码基本操作（与、或、非、异或）
- 位掩码 vs 数组/Set 性能对比
- 权限系统的位掩码设计
- JavaScript 位运算特殊行为
