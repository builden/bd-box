# KMP 字符串匹配

## 一句话定义

Knuth-Morris-Pratt 算法，利用已匹配信息避免回溯的字符串匹配。

## 为什么好

**优点：**

- 时间复杂度 O(m+n)
- 只需一次遍历
- 不回溯文本指针

**缺点：**

- 空间复杂度 O(m)
- 实现较复杂

## 适用场景

- **字符串匹配**：文本搜索
- **模式匹配**：敏感词过滤
- **前缀匹配**：KMP 是前缀函数基础

## 代码实现

```typescript
function buildKMPTable(pattern: string): number[] {
  const lps = new Array(pattern.length).fill(0);
  let len = 0;
  let i = 1;

  while (i < pattern.length) {
    if (pattern[i] === pattern[len]) {
      len++;
      lps[i] = len;
      i++;
    } else {
      if (len !== 0) {
        len = lps[len - 1];
      } else {
        lps[i] = 0;
        i++;
      }
    }
  }

  return lps;
}

function kmpSearch(text: string, pattern: string): number[] {
  const positions: number[] = [];
  const lps = buildKMPTable(pattern);
  let i = 0; // text index
  let j = 0; // pattern index

  while (i < text.length) {
    if (text[i] === pattern[j]) {
      i++;
      j++;
    }

    if (j === pattern.length) {
      positions.push(i - j);
      j = lps[j - 1];
    } else if (i < text.length && text[i] !== pattern[j]) {
      if (j !== 0) {
        j = lps[j - 1];
      } else {
        i++;
      }
    }
  }

  return positions;
}

// 使用示例
const text = "ABABDABACDABABCABAB";
const pattern = "ABABCABAB";
const positions = kmpSearch(text, pattern);
console.log(positions); // [10]
```

## 时间/空间复杂度

| 操作     | 时间复杂度 | 空间复杂度 |
| -------- | ---------- | ---------- |
| 构建 LPS | O(m)       | O(m)       |
| 搜索     | O(n)       | O(m)       |
| 总计     | O(m + n)   | O(m)       |

注：m = 模式串长度，n = 文本长度

## KMP vs 其他算法

| 算法   | 时间复杂度 | 空间复杂度 | 特点     |
| ------ | ---------- | ---------- | -------- |
| 暴力   | O(mn)      | O(1)       | 简单     |
| KMP    | O(m + n)   | O(m)       | 不回溯   |
| BM     | O(m + n)   | O(m)       | 从右向左 |
| Sunday | O(m + n)   | O(m)       | 简单高效 |

## 经典应用案例

- **字符串搜索**：文本编辑器搜索
- **敏感词过滤**：多模式匹配
- **DNA 序列匹配**：生物信息学

## 使用边界

**何时不用：**

- 短文本：暴力可能更快
- 单次匹配：KMP 构建开销不划算
- 模式串经常变化：预处理成本高

**注意事项：**

- LPS 数组含义：最长前后缀长度
- 边界处理：空字符串/单字符
- 多模式匹配：AC 自动机更合适

**面试常考点：**

- KMP 原理
- LPS/next 数组构建
- KMP vs 暴力对比
- 为什么 KMP 不回溯
- 前缀函数理解

**为什么选择**：KMP 是字符串匹配经典算法，面试必考，也是 AC 自动机的基础。
