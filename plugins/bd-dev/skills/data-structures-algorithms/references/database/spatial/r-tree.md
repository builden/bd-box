# R-Tree

## 一句话定义

空间数据的平衡树，用于地理信息系统（GIS）中的范围查询。

## 为什么好

**优点：**

- 支持高维空间查询
- 范围查询效率高
- 动态插入删除

**缺点：**

- 实现复杂
- 内存开销大

## 适用场景

- **地理信息系统**：POI 查询、路径规划
- **地图应用**：矩形/多边形范围搜索
- **图像检索**：高维特征空间搜索

## 代码实现

```typescript
interface Rectangle {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

interface RTreeNode {
  rect: Rectangle;
  isLeaf: boolean;
  children: RTreeNode[];
  entries: Rectangle[]; // 叶节点存储
}

class RTree {
  private root: RTreeNode;
  private maxEntries: number = 4;
  private minEntries: number = 2;

  constructor() {
    this.root = this.createNode(true);
  }

  private createNode(isLeaf: boolean): RTreeNode {
    return {
      rect: { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
      isLeaf,
      children: [],
      entries: [],
    };
  }

  private calculateArea(rect: Rectangle): number {
    return (rect.maxX - rect.minX) * (rect.maxY - rect.minY);
  }

  private enlargeRect(rect: Rectangle, entry: Rectangle): Rectangle {
    return {
      minX: Math.min(rect.minX, entry.minX),
      minY: Math.min(rect.minY, entry.minY),
      maxX: Math.max(rect.maxX, entry.maxX),
      maxY: Math.max(rect.maxY, entry.maxY),
    };
  }

  private intersects(a: Rectangle, b: Rectangle): boolean {
    return !(a.minX > b.maxX || a.maxX < b.minX || a.minY > b.maxY || a.maxY < b.minY);
  }

  insert(rect: Rectangle): void {
    const leaf = this.chooseLeaf(this.root, rect);
    leaf.entries.push(rect);
    this.adjustTree(leaf);
  }

  private chooseLeaf(node: RTreeNode, rect: Rectangle): RTreeNode {
    if (node.isLeaf) return node;

    let best = node.children[0];
    let minArea = this.calculateArea(this.enlargeRect(best.rect, rect));

    for (let i = 1; i < node.children.length; i++) {
      const child = node.children[i];
      const area = this.calculateArea(this.enlargeRect(child.rect, rect));

      if (area < minArea) {
        best = child;
        minArea = area;
      }
    }

    return this.chooseLeaf(best, rect);
  }

  private adjustTree(node: RTreeNode): void {
    if (node.entries.length <= this.maxEntries) return;

    // 分裂节点
    const split = this.splitNode(node);
    const [a, b] = split;

    if (node === this.root) {
      const newRoot = this.createNode(false);
      newRoot.children.push(a, b);
      this.root = newRoot;
    } else {
      // 继续向上调整
    }
  }

  private splitNode(node: RTreeNode): [RTreeNode, RTreeNode] {
    // 简化版：随机分成两半
    const mid = Math.floor(node.entries.length / 2);
    const a = this.createNode(node.isLeaf);
    const b = this.createNode(node.isLeaf);

    a.entries = node.entries.slice(0, mid);
    b.entries = node.entries.slice(mid);

    return [a, b];
  }

  search(range: Rectangle): Rectangle[] {
    const results: Rectangle[] = [];
    this.searchNode(this.root, range, results);
    return results;
  }

  private searchNode(node: RTreeNode, range: Rectangle, results: Rectangle[]): void {
    if (!this.intersects(node.rect, range)) return;

    if (node.isLeaf) {
      for (const entry of node.entries) {
        if (this.intersects(entry, range)) {
          results.push(entry);
        }
      }
    } else {
      for (const child of node.children) {
        this.searchNode(child, range, results);
      }
    }
  }
}
```

## 时间/空间复杂度

| 操作 | 平均复杂度   | 最坏复杂度 |
| ---- | ------------ | ---------- |
| 插入 | O(log n)     | O(n)       |
| 查询 | O(log n + k) | O(n)       |
| 删除 | O(log n)     | O(n)       |

注：k 为返回结果数量

## 经典应用案例

- **PostGIS**：PostgreSQL 空间扩展
- **MySQL Spatial**：MySQL 空间索引
- **Google Maps**：地图数据索引
- **MongoDB**：2dsphere 索引

## 使用边界

**何时不用：**

- 2D/3D 低维：四叉树/八叉树更简单
- 点查询为主：哈希表更快
- 静态数据：R-Tree 优势不明显

**注意事项：**

- 分裂策略：不同的分裂算法影响树的质量
- 维度限制：通常用于 2-20 维
- 批量构建：自底向上构建比逐个插入更快

**面试常考点：**

- R-Tree 原理
- R-Tree vs 四叉树对比
- 空间查询优化
- GIS 中的应用

**为什么选择**：R-Tree 是地理信息系统的基础索引结构，处理多维空间数据不可或缺。
