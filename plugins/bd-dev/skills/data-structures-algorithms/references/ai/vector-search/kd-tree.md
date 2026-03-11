# KD 树

## 一句话定义

k 维二叉搜索树，用超平面交替分割 k 维空间。

## 为什么好

**优点：**

- 搜索效率高 O(log n)
- 支持多维检索
- 实现相对简单

**缺点：**

- 高维效率下降（维度灾难）
- 构建需要排序

## 适用场景

- **低维向量检索**：3-20 维
- **最近邻搜索**：KNN 问题
- **范围查询**：多维范围搜索

## 代码实现

```typescript
interface Point {
  id: string;
  coords: number[];
}

class KDTree {
  private root?: KDNode;
  private k: number;

  constructor(k: number) {
    this.k = k;
  }

  insert(point: Point): void {
    const level = 0;
    if (!this.root) {
      this.root = { point, level, left: null, right: null };
      return;
    }

    let current = this.root;
    while (true) {
      const axis = current.level % this.k;
      const direction = point.coords[axis] < current.point.coords[axis] ? "left" : "right";

      if (!current[direction]) {
        current[direction] = { point, level: current.level + 1, left: null, right: null };
        break;
      }
      current = current[direction]!;
    }
  }

  nearest(query: number[]): Point | null {
    if (!this.root) return null;

    let best: { point: Point; dist: number } | null = null;
    const stack: KDNode[] = [this.root];

    while (stack.length > 0) {
      const node = stack.pop()!;
      const axis = node.level % this.k;

      const dist = this.distance(query, node.point.coords);
      if (!best || dist < best.dist) {
        best = { point: node.point, dist };
      }

      const diff = query[axis] - node.point.coords[axis];
      const near = diff < 0 ? node.left : node.right;
      const far = diff < 0 ? node.right : node.left;

      if (near) stack.push(near);

      // 如果超平面距离小于当前最佳距离，需要检查另一侧
      if (far && diff * diff < best.dist) {
        stack.push(far);
      }
    }

    return best?.point ?? null;
  }

  range(query: number[], radius: number): Point[] {
    const results: Point[] = [];
    this.rangeSearch(this.root, query, radius, results);
    return results;
  }

  private rangeSearch(node: KDNode | null, query: number[], radius: number, results: Point[]): void {
    if (!node) return;

    const dist = this.distance(query, node.point.coords);
    if (dist <= radius) {
      results.push(node.point);
    }

    const axis = node.level % this.k;
    const diff = query[axis] - node.point.coords[axis];

    const near = diff < 0 ? node.left : node.right;
    const far = diff < 0 ? node.right : node.left;

    this.rangeSearch(near, query, radius, results);

    if (diff * diff <= radius * radius) {
      this.rangeSearch(far, query, radius, results);
    }
  }

  private distance(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += (a[i] - b[i]) ** 2;
    }
    return Math.sqrt(sum);
  }
}

interface KDNode {
  point: Point;
  level: number;
  left: KDNode | null;
  right: KDNode | null;
}
```

## 时间/空间复杂度

| 操作     | 平均复杂度   | 最坏复杂度 |
| -------- | ------------ | ---------- |
| 构建     | O(n log n)   | O(n²)      |
| 搜索     | O(log n)     | O(n)       |
| 范围查询 | O(log n + k) | O(n)       |

注：k 为返回结果数量

## 使用边界

**何时不用：**

- 高维数据（>20维）：维度灾难，效率接近暴力搜索
- 数据分布极不均匀：可能导致树不平衡
- 需要近似搜索：HNSW 更适合

**注意事项：**

- 维度限制：超过 20 维效率急剧下降
- 数据分布：不均匀分布可能导致不平衡
- 构建优化：使用中位数分割而非平均值

**面试常考点：**

- KD-Tree 构建方法（选择分割维度）
- KD-Tree 搜索最近邻过程
- 维度灾难问题
- KD-Tree vs HNSW 对比

## 经典应用案例

- **Milvus**：低维向量检索
- **Scikit-learn**：KNN 实现
- **计算机图形学**：最近邻点搜索
- **游戏碰撞检测**：KD 树用于射线检测

**为什么选择**：KD 树是低维向量检索的经典算法，在 20 维以下表现优秀。
