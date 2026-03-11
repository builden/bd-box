# 令牌桶

## 一句话定义

固定容量桶 + 固定速率添加令牌，允许突发流量的限流算法。

## 为什么好

**优点：**

- 允许突发流量
- 实现简单
- 精度高

**缺点：**

- 需要维护令牌数量
- 突发流量可能压垮系统

## 适用场景

- **API 限流**：允许一定突发流量
- **流量整形**：平滑输出
- **并发控制**：限制并发数

## 代码实现

```typescript
class TokenBucket {
  private capacity: number;
  private tokens: number;
  private refillRate: number; // 每秒添加的令牌数
  private lastRefill: number;

  constructor(capacity: number, refillRate: number) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillRate;
    this.lastRefill = Date.now();
  }

  tryConsume(tokens: number = 1): boolean {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    return false;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const newTokens = elapsed * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + newTokens);
    this.lastRefill = now;
  }

  get availableTokens(): number {
    this.refill();
    return this.tokens;
  }
}
```

## 时间/空间复杂度

| 操作       | 时间复杂度 | 空间复杂度 |
| ---------- | ---------- | ---------- |
| tryConsume | O(1)       | O(1)       |

## 使用边界

**何时不用：**

- 严格匀速：漏桶更适合
- 单机限流：计数器足够
- 简单场景：直接拒绝比令牌桶更简单

**注意事项：**

- 容量设置：bucket_size = 峰值 QPS × 允许延迟时间
- 突发流量：需评估下游承受能力，设置合理容量
- 分布式实现：需要 Redis 原子操作（Lua 脚本或 WATCH）
- 预热：服务启动时令牌桶为空，需预热

**面试常考点：**

- 令牌桶 vs 漏桶对比
- 令牌桶参数如何设计
- 分布式限流实现方案
- 令牌桶 vs 计数器限流区别

## 经典应用案例

- **Google Cloud API Gateway**：API 限流
- **AWS API Gateway**：令牌桶限流
- **Nginx**：ngx_http_limit_req_module
- **Sentinel**：阿里巴巴限流组件

**为什么选择**：令牌桶允许突发流量，在限流和体验之间取得平衡。
