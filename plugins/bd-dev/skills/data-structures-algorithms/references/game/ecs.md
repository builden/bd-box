# ECS（实体组件系统）

## 一句话定义

游戏实体 = 实体 ID + 组件数据 + 系统逻辑的架构模式。

## 为什么好

**优点：**

- 数据布局紧凑，缓存友好
- 组件可复用
- 系统逻辑清晰

**缺点：**

- 学习曲线陡
- 实现复杂
- 不适合小项目

## 适用场景

- **大型游戏**：需要高性能
- **同屏大量对象**： RTS、MOBA
- **需要动态组合**：组件可插拔

## 架构

```
Entity (ID) → Components (数据) → Systems (逻辑)
```

## 代码实现

```typescript
// 实体：只有 ID
type Entity = number;

// 组件：纯数据
interface Position {
  x: number;
  y: number;
  z: number;
}
interface Velocity {
  x: number;
  y: number;
  z: number;
}
interface Render {
  mesh: string;
  material: string;
}

// 组件存储：按组件类型分组
class ComponentStore<T> {
  private data = new Map<Entity, T>();

  set(entity: Entity, component: T): void {
    this.data.set(entity, component);
  }

  get(entity: Entity): T | undefined {
    return this.data.get(entity);
  }

  remove(entity: Entity): void {
    this.data.delete(entity);
  }

  *entities(): Generator<Entity> {
    for (const entity of this.data.keys()) {
      yield entity;
    }
  }
}

// ECS 世界
class ECS {
  private nextEntity = 0;
  private entities = new Set<Entity>();

  // 组件存储
  positions = new ComponentStore<Position>();
  velocities = new ComponentStore<Velocity>();
  renders = new ComponentStore<Render>();

  createEntity(): Entity {
    const entity = this.nextEntity++;
    this.entities.add(entity);
    return entity;
  }

  addComponent<T>(entity: Entity, component: T, store: ComponentStore<T>): void {
    store.set(entity, component);
  }

  removeEntity(entity: Entity): void {
    this.entities.delete(entity);
    this.positions.remove(entity);
    this.velocities.remove(entity);
    this.renders.remove(entity);
  }
}

// 系统：处理逻辑
class MovementSystem {
  update(ecs: ECS, dt: number): void {
    for (const entity of ecs.positions.entities()) {
      const pos = ecs.positions.get(entity)!;
      const vel = ecs.velocities.get(entity);

      if (vel) {
        pos.x += vel.x * dt;
        pos.y += vel.y * dt;
        pos.z += vel.z * dt;
      }
    }
  }
}

// 使用
const ecs = new ECS();
const player = ecs.createEntity();
ecs.addComponent(player, { x: 0, y: 0, z: 0 }, ecs.positions);
ecs.addComponent(player, { x: 10, y: 0, z: 0 }, ecs.velocities);

const movement = new MovementSystem();
movement.update(ecs, 0.016);
```

## 经典应用案例

- **Unity DOTS**：Entity Component System
- **Unreal Engine**：游戏引擎架构
- **《守望先锋》**：ECS 架构
- **《星际争霸》**：早期 ECS 应用

**为什么选择**：ECS 是现代游戏引擎的核心架构，完美解决大量游戏对象的性能问题。

## 使用边界

**何时不用：**

- 小型项目：OOP 更简单直观
- 对象数量少：ECS 额外开销不划算
- 团队不熟悉：学习曲线陡

**注意事项：**

- 组件设计：组件应该是纯数据，避免包含逻辑
- 系统顺序：系统执行顺序影响结果，需要明确
- 缓存友好：按组件类型连续存储，避免随机关联查询
- 调试困难：ECS 的数据与逻辑分离使调试更复杂

**面试常考点：**

- ECS vs OOP 区别和各自适用场景
- ECS 如何提升性能（缓存命中、数据布局）
- Unity DOTS / Unreal ECS 架构
- 组件系统设计原则
