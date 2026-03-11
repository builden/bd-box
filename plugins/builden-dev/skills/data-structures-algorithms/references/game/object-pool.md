# 对象池

## 一句话定义

预先分配对象实例，复用而非频繁创建销毁。

## 为什么好

**优点：**

- 减少 GC 压力
- 提升性能
- 内存分配可预测

**缺点：**

- 内存占用固定
- 需要管理生命周期

## 适用场景

- **高频创建销毁**：子弹、粒子、特效
- **网络对象**：游戏玩家实体
- **资源加载**：图片、音频缓存

## 代码实现

```typescript
class ObjectPool<T> {
  private available: T[] = [];
  private inUse: Set<T> = new Set();
  private factory: () => T;
  private reset: (obj: T) => void;

  constructor(factory: () => T, reset: (obj: T) => void, initialSize: number = 10) {
    this.factory = factory;
    this.reset = reset;

    for (let i = 0; i < initialSize; i++) {
      this.available.push(factory());
    }
  }

  acquire(): T {
    let obj: T;

    if (this.available.length > 0) {
      obj = this.available.pop()!;
    } else {
      obj = this.factory();
    }

    this.inUse.add(obj);
    return obj;
  }

  release(obj: T): void {
    if (!this.inUse.has(obj)) return;

    this.inUse.delete(obj);
    this.reset(obj);
    this.available.push(obj);
  }

  preallocate(count: number): void {
    for (let i = 0; i < count; i++) {
      this.available.push(this.factory());
    }
  }

  get availableCount(): number {
    return this.available.length;
  }

  get inUseCount(): number {
    return this.inUse.size;
  }
}

// 使用示例：子弹池
class Bullet {
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  active = false;
}

const bulletPool = new ObjectPool(
  () => new Bullet(),
  (bullet) => {
    bullet.active = false;
  },
  100,
);

// 使用
const bullet = bulletPool.acquire();
bullet.x = 100;
bullet.y = 200;
bullet.vx = 10;
// ... 游戏逻辑
bulletPool.release(bullet);
```

## 经典应用案例

- **Unity**：对象池系统
- **Unreal Engine**：对象池
- **游戏粒子系统**：大量粒子
- **网络通信**：消息对象复用

**为什么选择**：对象池是游戏开发最常用的优化手段，避免频繁 GC 影响帧率。

## 使用边界

**何时不用：**

- 对象数量少：创建销毁开销可忽略
- 对象生命周期长：复用收益不大
- 对象状态复杂：重置成本高

**注意事项：**

- 初始容量设置：根据预估峰值设置，避免运行时扩容
- 对象重置：release 时必须完整重置状态，防止数据泄露
- 线程安全：多线程环境需加锁或使用无锁队列
- 内存泄漏：确保对象正确归还，避免野指针

**面试常考点：**

- 对象池 vs 缓存的区别
- 如何设计对象池的动态扩容
- 对象池在 Unity/Unreal 中的应用
- 内存分配策略（ slab allocation）

## 时间/空间复杂度

| 操作     | 时间复杂度 | 空间复杂度  |
| -------- | ---------- | ----------- |
| acquire  | O(1)       | -           |
| release  | O(1)       | -           |
| prealloc | O(n)       | O(capacity) |
