# HNSW

## 一句话定义

分层小世界图算法，用多层图结构实现高速向量近似搜索。

## 为什么好

**优点：**

- 搜索速度极快 O(log n)
- 召回率高
- 内存效率好

**缺点：**

- 构建时间长
- 内存占用较高

## 适用场景

- **向量近似检索**：高维向量最近邻
- **推荐系统**：用户/物品向量检索
- **语义搜索**：NLP embeddings 检索

## 代码实现

```typescript
interface Vector {
  id: string;
  data: number[];
}

interface EntryPoint {
  level: number;
  node: HNSWNode;
}

class HNSW {
  private M: number = 16; // 每个节点的最大连接数
  private efConstruction: number = 200; // 构建时搜索宽度
  private maxLevel: number = -1;
  private entryPoint?: EntryPoint;
  private nodes: Map<string, HNSWNode> = new Map();

  insert(vector: Vector): void {
    const level = this.randomLevel();
    const node: HNSWNode = {
      id: vector.id,
      data: vector.data,
      level,
      connections: [],
    };

    // 初始化连接
    for (let i = 0; i <= level; i++) {
      node.connections[i] = [];
    }

    if (!this.entryPoint) {
      this.entryPoint = { level, node };
      this.maxLevel = level;
      this.nodes.set(node.id, node);
      return;
    }

    // 搜索插入位置
    let entryPoint = this.entryPoint.node;
    for (let l = this.maxLevel; l > level; l--) {
      entryPoint = this.searchNearest(entryPoint, vector.data, l)[0];
    }

    // 插入各层
    for (let l = Math.min(level, this.maxLevel); l >= 0; l--) {
      const neighbors = this.searchNearest(entryPoint, vector.data, this.efConstruction)
        .filter((n) => n.id !== node.id)
        .slice(0, this.M);

      node.connections[l] = neighbors.map((n) => n.id);

      // 双向连接
      for (const neighborId of neighbors) {
        const neighbor = this.nodes.get(neighborId)!;
        if (!neighbor.connections[l]) neighbor.connections[l] = [];
        if (neighbor.connections[l].length < this.M) {
          neighbor.connections[l].push(node.id);
        }
      }

      entryPoint = neighbors[0] || entryPoint;
    }

    if (level > this.maxLevel) {
      this.maxLevel = level;
      this.entryPoint = { level, node };
    }

    this.nodes.set(node.id, node);
  }

  search(query: number[], k: number = 10): Vector[] {
    if (!this.entryPoint) return [];

    let entryPoint = this.entryPoint.node;
    for (let l = this.maxLevel; l > 0; l--) {
      entryPoint = this.getBestNeighbor(entryPoint, query, l) || entryPoint;
    }

    const results = this.searchNearest(entryPoint, query, k);
    return results;
  }

  private randomLevel(): number {
    let level = 0;
    while (Math.random() < 0.5 && level < 10) {
      level++;
    }
    return level;
  }

  private searchNearest(node: HNSWNode, query: number[], limit: number): Vector[] {
    const visited = new Set<string>();
    const candidates: { id: string; dist: number }[] = [];
    const results: Vector[] = [];

    candidates.push({ id: node.id, dist: this.distance(node.data, query) });

    while (candidates.length > 0) {
      candidates.sort((a, b) => a.dist - b.dist);
      const current = candidates.shift()!;

      if (visited.has(current.id)) continue;
      visited.add(current.id);

      const currentNode = this.nodes.get(current.id)!;
      results.push({ id: current.id, data: currentNode.data });

      if (results.length >= limit) break;

      for (const neighborId of currentNode.connections[0] || []) {
        if (visited.has(neighborId)) continue;
        const neighbor = this.nodes.get(neighborId)!;
        const dist = this.distance(neighbor.data, query);
        candidates.push({ id: neighborId, dist });
      }
    }

    return results;
  }

  private getBestNeighbor(node: HNSWNode, query: number[], level: number): HNSWNode | undefined {
    let best: HNSWNode | undefined;
    let bestDist = Infinity;

    for (const neighborId of node.connections[level] || []) {
      const neighbor = this.nodes.get(neighborId);
      if (!neighbor) continue;
      const dist = this.distance(neighbor.data, query);
      if (dist < bestDist) {
        bestDist = dist;
        best = neighbor;
      }
    }
    return best;
  }

  private distance(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += (a[i] - b[i]) ** 2;
    }
    return Math.sqrt(sum);
  }
}

interface HNSWNode {
  id: string;
  data: number[];
  level: number;
  connections: string[][];
}
```

## 时间/空间复杂度

| 操作 | 平均复杂度 |
| ---- | ---------- |
| 构建 | O(n log n) |
| 搜索 | O(log n)   |
| 空间 | O(n)       |

## 使用边界

**何时不用：**

- 低维数据（<10维）：KD-Tree 更简单高效
- 数据量极小：暴力搜索足够
- 内存极其敏感：考虑 PQ 量化

**注意事项：**

- M 选择：影响搜索速度和召回率，通常 8-32
- ef 参数：搜索宽度，越大越准但越慢，生产环境 50-200
- 构建时间：大规模数据构建时间长，考虑增量构建
- 维度：高维效果好，低维不如 KD 树

**面试常考点：**

- HNSW 原理（分层小世界图）
- HNSW 参数调优（M, ef, maxLevel）
- HNSW vs KD-Tree vs PQ 对比
- HNSW 内存优化（压缩向量）
- 跳表在 HNSW 中的应用

## 经典应用案例

- **Pinecone**：向量数据库
- **Milvus**：开源向量数据库
- **Weaviate**：向量搜索引擎
- **Faiss**：Facebook 向量检索库

**为什么选择**：HNSW 是当前最快的向量近似检索算法，完美平衡速度、召回率和内存。
