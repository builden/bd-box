# 四叉树

## 一句话定义

递归划分子区域的 2D 空间分割树，每个节点最多 4 个子节点。

## 为什么好

**优点：**

- 空间查询效率高 O(log n)
- 动态平衡
- 实现相对简单

**缺点：**

- 树的深度受数据分布影响
- 内存开销较大

## 适用场景

- **2D 碰撞检测**：游戏物体碰撞
- **空间索引**：地图应用
- **视锥剔除**：图形渲染优化
- **区域查询**：范围搜索

## 代码实现

```typescript
interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Point {
  x: number;
  y: number;
}

class QuadTree {
  private boundary: Rectangle;
  private capacity: number;
  private points: Point[] = [];
  private divided = false;
  private northeast?: QuadTree;
  private northwest?: QuadTree;
  private southeast?: QuadTree;
  private southwest?: QuadTree;

  constructor(boundary: Rectangle, capacity: number = 4) {
    this.boundary = boundary;
    this.capacity = capacity;
  }

  private contains(point: Point): boolean {
    return (
      point.x >= this.boundary.x &&
      point.x < this.boundary.x + this.boundary.width &&
      point.y >= this.boundary.y &&
      point.y < this.boundary.y + this.boundary.height
    );
  }

  private intersects(range: Rectangle): boolean {
    return !(
      range.x > this.boundary.x + this.boundary.width ||
      range.x + range.width < this.boundary.x ||
      range.y > this.boundary.y + this.boundary.height ||
      range.y + range.height < this.boundary.y
    );
  }

  insert(point: Point): boolean {
    if (!this.contains(point)) return false;

    if (this.points.length < this.capacity) {
      this.points.push(point);
      return true;
    }

    if (!this.divided) {
      this.subdivide();
    }

    return (
      this.northeast!.insert(point) ||
      this.northwest!.insert(point) ||
      this.southeast!.insert(point) ||
      this.southwest!.insert(point)
    );
  }

  private subdivide(): void {
    const { x, y, width, height } = this.boundary;
    const hw = width / 2;
    const hh = height / 2;

    this.northeast = new QuadTree({ x: x + hw, y: y, width: hw, height: hh }, this.capacity);
    this.northwest = new QuadTree({ x: x, y: y, width: hw, height: hh }, this.capacity);
    this.southeast = new QuadTree({ x: x + hw, y: y + hh, width: hw, height: hh }, this.capacity);
    this.southwest = new QuadTree({ x: x, y: y + hh, width: hw, height: hh }, this.capacity);

    this.divided = true;
  }

  query(range: Rectangle): Point[] {
    const found: Point[] = [];

    if (!this.intersects(range)) return found;

    for (const p of this.points) {
      if (this.contains(p) && this.contains(range)) {
        found.push(p);
      }
    }

    if (this.divided) {
      found.push(...this.northeast!.query(range));
      found.push(...this.northwest!.query(range));
      found.push(...this.southeast!.query(range));
      found.push(...this.southwest!.query(range));
    }

    return found;
  }
}
```

## 时间/空间复杂度

| 操作 | 时间复杂度   | 空间复杂度 |
| ---- | ------------ | ---------- |
| 插入 | O(log n)     | -          |
| 查询 | O(log n + k) | O(n)       |

注：k 为返回结果数量

## 使用边界

**何时不用：**

- 对象分布极不均匀：空间哈希更适合
- 对象经常移动：重建成本高
- 查询区域小且多：哈希表 O(1) 更快

**注意事项：**

- 容量选择：通常 4-10，过大失去分割优势，过小深度太深
- 区域重叠：查询可能返回非精确结果，需二次过滤
- 动态更新：频繁插入删除考虑定期重建
- 内存：每个节点都有子节点指针，内存开销大

**面试常考点：**

- 四叉树 vs 空间哈希对比
- 四叉树构建和查询复杂度
- 四叉树在碰撞检测中的应用
- 四叉树 vs 八叉树区别

## 经典应用案例

- **Unity**：2D 物理碰撞检测
- **Unreal Engine**：2D 空间分割
- **地图应用**：POI 区域查询
- **图像处理**：四叉树图像压缩

**为什么选择**：四叉树是 2D 空间查询的经典解决方案，游戏和地图应用必备。
