# 一致性哈希

## 一句话定义

分布式哈希算法，数据映射到环上最近节点，节点变化时只需迁移少量数据。

## 为什么好

**优点：**

- 节点变化时只需迁移少量数据
- 负载均衡
- 支持虚拟节点解决倾斜

**缺点：**

- 实现复杂
- 节点故障检测复杂
- 虚拟节点需要管理

## 适用场景

- **分布式缓存**：Redis 集群、Memcached 集群
- **分布式存储**：Dynamo、Cassandra
- **负载均衡**：nginx 一致性哈希 upstream

## 代码实现

```typescript
interface HashRingNode {
  name: string;
  weight: number;
}

class ConsistentHashRing {
  private virtualNodes: number = 150;
  private hashRing: Map<number, string> = new Map();
  private sortedKeys: number[] = [];
  private nodes: Set<string> = new Set();

  constructor(nodes: HashRingNode[] = [], virtualNodes?: number) {
    if (virtualNodes) this.virtualNodes = virtualNodes;
    for (const node of nodes) {
      this.addNode(node.name, node.weight);
    }
  }

  private hash(key: string): number {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = (hash << 5) - hash + key.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  addNode(name: string, weight: number = 1): void {
    if (this.nodes.has(name)) return;

    const vNodes = Math.floor(this.virtualNodes * weight);
    for (let i = 0; i < vNodes; i++) {
      const vNodeName = `${name}#VN${i}`;
      const hash = this.hash(vNodeName);
      this.hashRing.set(hash, name);
      this.sortedKeys.push(hash);
    }

    this.sortedKeys.sort((a, b) => a - b);
    this.nodes.add(name);
  }

  removeNode(name: string): void {
    if (!this.nodes.has(name)) return;

    for (let i = 0; i < this.virtualNodes; i++) {
      const vNodeName = `${name}#VN${i}`;
      const hash = this.hash(vNodeName);
      this.hashRing.delete(hash);
    }

    this.sortedKeys = Array.from(this.hashRing.keys()).sort((a, b) => a - b);
    this.nodes.delete(name);
  }

  getNode(key: string): string | null {
    if (this.hashRing.size === 0) return null;

    const hash = this.hash(key);
    let index = this.sortedKeys.findIndex((k) => k >= hash);

    if (index === -1) {
      index = 0;
    }

    return this.hashRing.get(this.sortedKeys[index]) ?? null;
  }

  get nodesCount(): number {
    return this.nodes.size;
  }
}
```

## 时间/空间复杂度

| 操作     | 时间复杂度 | 空间复杂度 |
| -------- | ---------- | ---------- |
| 添加节点 | O(v log v) | O(v)       |
| 删除节点 | O(v)       | -          |
| 查找节点 | O(log v)   | -          |

注：v = 虚拟节点数

## 使用边界

**何时不用：**

- 单机系统：普通哈希即可
- 节点固定不变：不需要一致性
- 数据量小：直接复制到所有节点

**注意事项：**

- 虚拟节点数：通常 150-200 个，太少不均匀，太多内存开销
- 数据迁移：节点增加/减少时迁移成本
- 故障检测：需要配合心跳检测，故障节点及时摘除
- 哈希算法：选区计算快、分布均匀的算法（MurmurHash）

**面试常考点：**

- 一致性哈希原理
- 虚拟节点作用
- 节点故障处理
- Dynamo/Cassandra 中的一致性哈希

## 经典应用案例

- **Dynamo**：Amazon 分布式存储
- **Cassandra**：NoSQL 数据库
- **Redis Cluster**：槽迁移
- **Memcached**：客户端一致性哈希

**为什么选择**：一致性哈希是分布式系统的基础，让节点扩缩容时数据迁移最小化。
