# 空间哈希

## 一句话定义

将 2D/3D 空间划分为网格，用哈希表管理空间查询。

## 为什么好

**优点：**

- 实现简单
- 查询效率高 O(1)
- 动态适应

**缺点：**

- 网格大小难选
- 不适合稀疏分布

## 适用场景

- **2D/3D 碰撞检测**：大量动态对象
- **区域查询**：特定范围对象
- **游戏对象管理**：同屏大量物体

## 代码实现

```typescript
interface Vector2 {
  x: number;
  y: number;
}

class SpatialHash {
  private cellSize: number;
  private cells: Map<string, Set<any>> = new Map();

  constructor(cellSize: number) {
    this.cellSize = cellSize;
  }

  private getKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  insert(obj: any, x: number, y: number): void {
    const key = this.getKey(x, y);
    if (!this.cells.has(key)) {
      this.cells.set(key, new Set());
    }
    this.cells.get(key)!.add(obj);
  }

  remove(obj: any, x: number, y: number): void {
    const key = this.getKey(x, y);
    this.cells.get(key)?.delete(obj);
  }

  query(x: number, y: number, radius: number): any[] {
    const results = new Set<any>();
    const cellRadius = Math.ceil(radius / this.cellSize);
    const centerCellX = Math.floor(x / this.cellSize);
    const centerCellY = Math.floor(y / this.cellSize);

    // 检查周围单元格
    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dy = -cellRadius; dy <= cellRadius; dy++) {
        const key = `${centerCellX + dx},${centerCellY + dy}`;
        const cell = this.cells.get(key);
        if (cell) {
          for (const obj of cell) {
            results.add(obj);
          }
        }
      }
    }

    return Array.from(results);
  }

  update(obj: any, oldX: number, oldY: number, newX: number, newY: number): void {
    const oldKey = this.getKey(oldX, oldY);
    const newKey = this.getKey(newX, newY);

    if (oldKey !== newKey) {
      this.cells.get(oldKey)?.delete(obj);
      this.insert(obj, newX, newY);
    }
  }
}
```

## 经典应用案例

- **Unity Physics 2D**：2D 物理引擎
- **游戏碰撞检测**：大量子弹、敌人
- **粒子系统**：粒子空间查询

**为什么选择**：空间哈希是游戏开发最常用的空间索引，实现简单且高效。

## 使用边界

**何时不用：**

- 对象分布极不均匀：四叉树更适合
- 空间维度高：维度灾难，效率下降
- 查询半径变化大：固定网格大小不灵活

**注意事项：**

- 网格大小选择：通常等于最大对象尺寸或查询半径
- 对象跨格处理：大对象需同时插入多个格子
- 更新成本：对象移动时需要删除+重新插入
- 内存：稀疏分布会产生很多空格子

**面试常考点：**

- 空间哈希 vs 四叉树对比
- 网格大小如何选择
- 动态对象如何处理
- 游戏中的典型应用场景
