# A\* 算法

## 一句话定义

启发式寻路算法，结合 Dijkstra 和贪心，最优路径搜索。

## 为什么好

**优点：**

- 有最优解保证
- 效率高，减少搜索空间
- 适应性强，可调整启发函数

**缺点：**

- 需要启发函数设计
- 内存占用较大
- 动态障碍处理复杂

## 适用场景

- **游戏 NPC 寻路**：RPG、SLG 游戏
- **机器人导航**：自动导引车
- **地图路由**：导航软件

## 代码实现

```typescript
interface Point {
  x: number;
  y: number;
}

interface Node {
  point: Point;
  g: number; // 起点到当前点实际代价
  h: number; // 当前点到终点估计代价
  f: number; // g + h
  parent: Node | null;
}

class AStar {
  private grid: boolean[][];
  private rows: number;
  private cols: number;

  constructor(grid: boolean[][], rows: number, cols: number) {
    this.grid = grid;
    this.rows = rows;
    this.cols = cols;
  }

  private heuristic(a: Point, b: Point): number {
    // 曼哈顿距离
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  private getNeighbors(p: Point): Point[] {
    const dirs = [
      { x: 0, y: -1 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      // 可添加对角线
    ];

    const neighbors: Point[] = [];
    for (const dir of dirs) {
      const nx = p.x + dir.x;
      const ny = p.y + dir.y;

      if (nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows) {
        if (this.grid[ny][nx]) {
          // 可通行
          neighbors.push({ x: nx, y: ny });
        }
      }
    }
    return neighbors;
  }

  findPath(start: Point, end: Point): Point[] | null {
    if (!this.grid[end.y][end.x]) return null; // 终点不可达

    const openSet: Node[] = [];
    const closedSet: Set<string> = new Set();

    const startNode: Node = {
      point: start,
      g: 0,
      h: this.heuristic(start, end),
      f: 0,
      parent: null,
    };
    startNode.f = startNode.g + startNode.h;
    openSet.push(startNode);

    while (openSet.length > 0) {
      // 找 f 值最小的节点
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift()!;

      const key = `${current.point.x},${current.point.y}`;
      if (closedSet.has(key)) continue;
      closedSet.add(key);

      // 到达终点
      if (current.point.x === end.x && current.point.y === end.y) {
        return this.reconstructPath(current);
      }

      // 遍历邻居
      for (const neighbor of this.getNeighbors(current.point)) {
        const nKey = `${neighbor.x},${neighbor.y}`;
        if (closedSet.has(nKey)) continue;

        const tentativeG = current.g + 1;
        const existing = openSet.find((n) => n.point.x === neighbor.x && n.point.y === neighbor.y);

        if (!existing) {
          const node: Node = {
            point: neighbor,
            g: tentativeG,
            h: this.heuristic(neighbor, end),
            f: 0,
            parent: current,
          };
          node.f = node.g + node.h;
          openSet.push(node);
        } else if (tentativeG < existing.g) {
          existing.g = tentativeG;
          existing.f = existing.g + existing.h;
          existing.parent = current;
        }
      }
    }

    return null; // 无法到达
  }

  private reconstructPath(node: Node): Point[] {
    const path: Point[] = [];
    let current: Node | null = node;
    while (current) {
      path.unshift(current.point);
      current = current.parent;
    }
    return path;
  }
}
```

## 时间/空间复杂度

| 指标 | 复杂度         |
| ---- | -------------- |
| 时间 | O((V+E) log V) |
| 空间 | O(V)           |

注：V = 节点数，E = 边数

## 使用边界

**何时不用：**

- 无障碍物：直接 Dijkstra 或 BFS 即可
- 动态障碍多：A\* 需要频繁重算
- 路径质量要求不高：贪心最佳优先更快

**注意事项：**

- 启发函数选择：曼哈顿（4向）、欧几里得（8向）、对角线
- 启发函数膨胀：h(n) 不能大于真实距离，否则可能错失最优解
- 开放列表效率：使用优先队列而非数组排序
- 内存：大规模地图需要分层 A\* 或跳点算法

**面试常考点：**

- A\* 算法原理和复杂度分析
- 启发函数设计原则（ admissibility ）
- A\* vs Dijkstra vs 贪心对比
- A\* 优化方法（跳点、二分堆、分层）

## 经典应用案例

- **王者荣耀**：英雄自动寻路
- **Unity NavMesh**：导航系统
- **A\* Pathfinding Project**：Unity 寻路插件
- **Google Maps**：路径规划

**为什么选择**：A\* 是最经典的寻路算法，在游戏和导航中无处不在。
