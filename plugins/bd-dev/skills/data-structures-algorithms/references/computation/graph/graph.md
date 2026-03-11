# 图

## 一句话定义

由节点（顶点）和边组成的数据结构，用于表示关系网络。

## 基本概念

- **顶点（Vertex）**：图中的节点
- **边（Edge）**：顶点之间的连接
- **度（Degree）**：连接的边数
- **路径（Path）**：顶点序列
- **环（Cycle）**：起点终点相同的路径

## 图的分类

| 类型              | 边特性       |
| ----------------- | ------------ |
| 无向图            | 边无方向     |
| 有向图            | 边有方向     |
| 加权图            | 边有权值     |
| 有向无环图（DAG） | 无环的有向图 |

## 代码实现

```typescript
// 邻接表表示
class Graph {
  private adjacencyList: Map<string, Set<string>>;

  constructor() {
    this.adjacencyList = new Map();
  }

  addVertex(vertex: string): void {
    if (!this.adjacencyList.has(vertex)) {
      this.adjacencyList.set(vertex, new Set());
    }
  }

  addEdge(v1: string, v2: string): void {
    this.addVertex(v1);
    this.addVertex(v2);
    this.adjacencyList.get(v1)!.add(v2);
  }

  // BFS 遍历
  bfs(start: string): string[] {
    const visited = new Set<string>();
    const queue: string[] = [start];
    const result: string[] = [];

    visited.add(start);

    while (queue.length > 0) {
      const vertex = queue.shift()!;
      result.push(vertex);

      for (const neighbor of this.adjacencyList.get(vertex) || []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    return result;
  }

  // DFS 遍历
  dfs(start: string): string[] {
    const visited = new Set<string>();
    const result: string[] = [];

    const dfsHelper = (vertex: string) => {
      visited.add(vertex);
      result.push(vertex);

      for (const neighbor of this.adjacencyList.get(vertex) || []) {
        if (!visited.has(neighbor)) {
          dfsHelper(neighbor);
        }
      }
    };

    dfsHelper(start);
    return result;
  }

  // Dijkstra 最短路径
  dijkstra(start: string, end: string): number {
    const distances = new Map<string, number>();
    const pq = new MinHeap<{ vertex: string; dist: number }>();

    for (const vertex of this.adjacencyList.keys()) {
      distances.set(vertex, Infinity);
    }
    distances.set(start, 0);
    pq.insert({ vertex: start, dist: 0 });

    while (pq.size() > 0) {
      const { vertex, dist } = pq.extract()!;

      if (dist > distances.get(vertex)!) continue;
      if (vertex === end) return dist;

      for (const neighbor of this.adjacencyList.get(vertex) || []) {
        const newDist = dist + 1; // 假设无权图
        if (newDist < distances.get(neighbor)!) {
          distances.set(neighbor, newDist);
          pq.insert({ vertex: neighbor, dist: newDist });
        }
      }
    }

    return -1;
  }
}
```

## 经典应用

- **社交网络**：好友关系
- **地图导航**：路径规划
- **网络拓扑**：路由器
- **任务调度**：DAG 依赖

**为什么选择**：图是处理关系网络的最佳数据结构，现实世界大量问题可以用图建模。

## 使用边界

**何时不用：**

- 简单线性关系：数组/链表即可
- 树是图的特例：不需要图
- 集合关系：并查集更适合

**注意事项：**

- 表示选择：邻接表 vs 邻接矩阵
- 遍历方式：BFS vs DFS 适用不同场景
- 环检测：DFS 中用 visited + onStack
- 最短路径：Dijkstra / Bellman-Floyd / A\*

**面试常考点：**

- 图的遍历（BFS/DFS）
- 最短路径算法对比
- 环检测
- 拓扑排序
- 并查集应用
- 最小生成树（Prim/Kruskal）
