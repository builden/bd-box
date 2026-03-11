# 布隆过滤器

## 一句话定义

概率型数据结构，用少量空间判断元素"可能存在"或"一定不存在"。

## 为什么好

**优点：**

- 空间效率极高
- 查询速度快 O(k)
- 不存储原始数据，隐私友好

**缺点：**

- 有假阳性（可能误判存在）
- 无法删除元素
- 参数选择依赖数据量

## 适用场景

- **缓存穿透防护**：判断数据是否在数据库
- **去重**：大规模数据去重
- **黑名单**：垃圾邮件过滤
- **爬虫 URL 去重**

## 代码实现

```typescript
class BloomFilter {
  private bitArray: boolean[];
  private size: number;
  private hashCount: number;

  constructor(expectedItems: number, falsePositiveRate: number = 0.01) {
    // 计算位数组大小
    this.size = Math.ceil((-expectedItems * Math.log(falsePositiveRate)) / Math.log(2) ** 2);
    // 计算哈希函数数量
    this.hashCount = Math.ceil((this.size / expectedItems) * Math.log(2));
    this.bitArray = new Array(this.size).fill(false);
  }

  private hash(value: string, seed: number): number {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = (hash * 31 + value.charCodeAt(i) + seed) % this.size;
    }
    return hash;
  }

  add(value: string): void {
    for (let i = 0; i < this.hashCount; i++) {
      const index = this.hash(value, i);
      this.bitArray[index] = true;
    }
  }

  mightContain(value: string): boolean {
    for (let i = 0; i < this.hashCount; i++) {
      const index = this.hash(value, i);
      if (!this.bitArray[index]) {
        return false;
      }
    }
    return true;
  }

  getFalsePositiveRate(): number {
    let setBits = 0;
    for (const bit of this.bitArray) {
      if (bit) setBits++;
    }
    return Math.pow(setBits / this.size, this.hashCount);
  }
}
```

## 时间/空间复杂度

| 操作 | 时间复杂度 | 空间复杂度 |
| ---- | ---------- | ---------- |
| 添加 | O(k)       | -          |
| 查询 | O(k)       | O(m)       |

注：k = 哈希函数数量，m = 位数组大小

## 使用边界/注意事项

1. **假阳性**：不能用于"精确判断"场景
2. **无法删除**：Counting Bloom Filter 可以解决
3. **参数预估**：需要预估数据量
4. **只增不减**：位数组只能设置不能重置

## 面试常考点

- 布隆过滤器原理和参数计算
- 假阳性率和空间计算公式
- 布隆过滤器 vs 哈希表
- Counting Bloom Filter 和 Scalable Bloom Filter

## 经典应用案例

- **Redis**：BF.MADD、BF.EXISTS
- **HBase**：布隆过滤器快速判断文件不存在
- **Cassandra**：布隆过滤器减少磁盘 IO
- **Chrome**：安全浏览判断恶意 URL

**为什么选择**：布隆过滤器用 1% 错误率换取 10 倍空间节省，是大规模存在性判断的首选。
