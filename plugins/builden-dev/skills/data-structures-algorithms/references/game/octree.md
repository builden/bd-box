# 八叉树

## 一句话定义

递归划分子区域的 3D 空间分割树，每个节点最多 8 个子节点。

## 为什么好

**优点：**

- 3D 空间查询效率高 O(log n)
- 支持多种几何形状
- 游戏开发标配

**缺点：**

- 内存开销大
- 构建成本高

## 适用场景

- **3D 碰撞检测**：游戏物体碰撞
- **视锥剔除**：3D 渲染优化
- **射线检测**：光线追踪
- **空间索引**：3D 点云

## 代码实现

```typescript
interface BoundingBox {
  x: number;
  y: number;
  z: number;
  size: number;
}

interface Point3D {
  x: number;
  y: number;
  z: number;
}

class Octree {
  private boundary: BoundingBox;
  private capacity: number;
  private points: Point3D[] = [];
  private divided = false;
  private children: Octree[] = [];

  constructor(boundary: BoundingBox, capacity: number = 8) {
    this.boundary = boundary;
    this.capacity = capacity;
  }

  private contains(point: Point3D): boolean {
    const { x, y, z, size } = this.boundary;
    return (
      point.x >= x && point.x < x + size && point.y >= y && point.y < y + size && point.z >= z && point.z < z + size
    );
  }

  insert(point: Point3D): boolean {
    if (!this.contains(point)) return false;

    if (this.points.length < this.capacity) {
      this.points.push(point);
      return true;
    }

    if (!this.divided) {
      this.subdivide();
    }

    for (const child of this.children) {
      if (child.insert(point)) return true;
    }
    return false;
  }

  private subdivide(): void {
    const { x, y, z, size } = this.boundary;
    const hs = size / 2;

    for (let i = 0; i < 8; i++) {
      const cx = x + (i & 1) * hs;
      const cy = y + ((i >> 1) & 1) * hs;
      const cz = z + ((i >> 2) & 1) * hs;

      this.children.push(new Octree({ x: cx, y: cy, z: cz, size: hs }, this.capacity));
    }
    this.divided = true;
  }

  queryRadius(center: Point3D, radius: number): Point3D[] {
    const found: Point3D[] = [];
    this.queryRadiusHelper(center, radius, found);
    return found;
  }

  private queryRadiusHelper(center: Point3D, radius: number, found: Point3D[]): void {
    const { x, y, z, size } = this.boundary;
    const dx = Math.max(x - center.x, center.x - (x + size));
    const dy = Math.max(y - center.y, center.y - (y + size));
    const dz = Math.max(z - center.z, center.z - (z + size));

    if (dx * dx + dy * dy + dz * dz > radius * radius) return;

    for (const p of this.points) {
      const dist = Math.sqrt((p.x - center.x) ** 2 + (p.y - center.y) ** 2 + (p.z - center.z) ** 2);
      if (dist <= radius) found.push(p);
    }

    if (this.divided) {
      for (const child of this.children) {
        child.queryRadiusHelper(center, radius, found);
      }
    }
  }
}
```

## 时间/空间复杂度

| 操作 | 时间复杂度   | 空间复杂度 |
| ---- | ------------ | ---------- |
| 插入 | O(log n)     | -          |
| 查询 | O(log n + k) | O(n)       |

## 经典应用案例

- **Unity**：3D 物理引擎
- **Unreal Engine**：3D 碰撞检测
- **Doom**：早期游戏引擎
- **点云处理**：LiDAR 数据处理

**为什么选择**：八叉树是 3D 空间查询的标准方案，游戏和图形学必备。

## 使用边界

**何时不用：**

- 对象分布极不均匀：BVH 更适合
- 查询模式简单：暴力搜索可能更快
- 内存敏感：八叉树内存开销大

**注意事项：**

- 容量设置：叶子节点容量影响树深度和查询效率
- 对象跨节点：大对象需同时在多个节点中存储
- 动态更新：频繁插入删除需考虑重建
- 维度限制：主要针对 3D，2D 用四叉树

**面试常考点：**

- 八叉树 vs BVH 对比
- 八叉树构建方法
- 八叉树在光线追踪中的应用
- 八叉树 vs 四叉树区别
