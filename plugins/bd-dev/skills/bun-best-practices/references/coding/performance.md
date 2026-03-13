# 性能测试

使用 Mitata 进行基准测试，确保性能不会因改动而退化。

## 何时需要性能测试

| 场景                  | 说明                           |
| --------------------- | ------------------------------ |
| **算法/数据结构优化** | 比较不同实现的性能差异         |
| **高频调用函数**      | 每次调用都会被执行很多次的函数 |
| **关键路径**          | 请求链路中的核心函数           |
| **库/工具类**         | 被其他项目依赖的基础库         |
| **发布前基线对比**    | 确保性能不会因改动而退化       |

**不需要性能测试的场景：**

- 业务逻辑代码（非核心路径）
- 一次性脚本
- UI 组件（渲染性能由框架决定）

## 工具：Mitata

Bun 官方推荐的基准测试库。

```bash
bun add -d mitata
```

## 基础用法

```typescript
// bench.ts
import { run, bench, summary } from 'mitata';

function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// 比较两种实现
bench('fibonacci(30) - naive', () => fibonacci(30));

bench('fibonacci(30) - memo', () => {
  const memo = new Map<number, number>();
  const fib = (n: number): number => {
    if (n <= 1) return n;
    if (memo.has(n)) return memo.get(n)!;
    const result = fib(n - 1) + fib(n - 2);
    memo.set(n, result);
    return result;
  };
  return fib(30);
});

await run();
```

```bash
bun run bench.ts
```

## 进阶用法

### 参数化测试

```typescript
bench('Array.from($size)', function* (state) {
  const size = state.get('size');
  yield () => Array.from({ length: size });
}).range('size', 1, 1024); // 1, 8, 64, 512...
```

### 可视化

```typescript
import { boxplot, summary } from 'mitata';

boxplot(() => {
  summary(() => {
    bench('test 1', () => {
      /* ... */
    });
    bench('test 2', () => {
      /* ... */
    });
  });
});

await run();
```

## 运行命令

```bash
bun run test:bench         # 运行基准测试
bun run test:bench --json  # JSON 输出（适合 CI）
```

> 详细目录结构见 [testing.md](testing.md)

## package.json 配置

```json
{
  "scripts": {
    "test": "bun test",
    "test:bench": "bun run tests/bench/*.bench.ts"
  }
}
```

运行命令：

```bash
bun run test:bench
```
