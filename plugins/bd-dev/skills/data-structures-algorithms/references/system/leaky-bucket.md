# 漏桶

## 一句话定义

固定容量队列 + 恒定速率流出，允许匀速处理请求的限流算法。

## 为什么好

**优点：**

- 流量平滑，无突发
- 实现简单
- 适合严格限流场景

**缺点：**

- 无法处理突发流量
- 队列满则拒绝

## 适用场景

- **严格限流**：需要匀速处理
- **金融交易**：防止瞬间峰值
- **API 限流**：严格控制 QPS

## 代码实现

```typescript
class LeakyBucket {
  private capacity: number; // 桶容量
  private water: number = 0; // 当前水量
  private leakRate: number; // 漏水速率 (每毫秒)
  private lastLeak: number;

  constructor(capacity: number, leakRate: number) {
    this.capacity = capacity;
    this.leakRate = leakRate;
    this.lastLeak = Date.now();
  }

  tryConsume(): boolean {
    this.leak();

    if (this.water < this.capacity) {
      this.water++;
      return true;
    }
    return false; // 桶已满，拒绝
  }

  private leak(): void {
    const now = Date.now();
    const elapsed = now - this.lastLeak;
    const leaked = elapsed * this.leakRate;

    this.water = Math.max(0, this.water - leaked);
    this.lastLeak = now;
  }

  get availableSpace(): number {
    this.leak();
    return this.capacity - this.water;
  }
}
```

## 时间/空间复杂度

| 操作       | 时间复杂度 | 空间复杂度 |
| ---------- | ---------- | ---------- |
| tryConsume | O(1)       | O(1)       |

## 使用边界

**何时不用：**

- 需要突发流量：令牌桶更适合
- 流量波动大：漏桶会严格限制，可能影响体验
- 简单限流：计数器即可满足需求

**注意事项：**

- 漏桶速率：需要根据业务精确设置，太慢影响体验
- 桶容量：设置要合理，既能缓冲峰值又不会占用太多内存
- 拒绝处理：桶满时需要合理返回（429 或队列）
- 分布式实现：需要同步各节点状态（Redis 集中式或本地同步）

**面试常考点：**

- 令牌桶 vs 漏桶对比
- 漏桶参数设计
- 分布式限流方案
- 漏桶在 Nginx 中的应用

## 经典应用案例

- **Nginx**：ngx_http_limit_req_module（leaky bucket）
- **令牌漏桶组合**：某些限流系统
- **网络流量控制**：QoS 流量整形

**为什么选择**：漏桶适合需要严格控制输出速率的场景，与令牌桶互补。
