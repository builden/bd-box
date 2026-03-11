# Onion Model (洋葱模型)

## 一句话定义

中间件层层包裹，请求像洋葱一样从外到内穿过，每层可执行前置/后置逻辑。

## 为什么好

- **可插拔**：中间件可以自由组合
- **关注点分离**：每层只处理一件事
- **可扩展**：新增中间件不影响其他层

## 适用场景

- Web 框架中间件（Koa、Express）
- 请求/响应拦截
- 鉴权、日志、错误处理

## TypeScript 实现

```typescript
type Middleware = (ctx: Context, next: () => Promise<void>) => Promise<void>;

class Onion {
  private layers: Middleware[] = [];

  use(fn: Middleware) {
    this.layers.push(fn);
  }

  async handle(ctx: Context) {
    const dispatch = (i: number): Promise<void> => {
      if (i >= this.layers.length) return Promise.resolve();
      const layer = this.layers[i];
      return layer(ctx, () => dispatch(i + 1));
    };
    await dispatch(0);
  }
}

// 使用
const app = new Onion();
app.use(async (ctx, next) => {
  console.log("1. 请求前");
  await next();
  console.log("4. 响应后");
});
app.use(async (ctx, next) => {
  console.log("2. 请求前");
  await next();
  console.log("3. 响应后");
});

// 输出顺序：1 → 2 → 3 → 4
```

## 流程图

```
请求进入                    响应返回
    │                          ▲
    ▼                          │
┌───────────────────┐
│    Logger         │ ──→ next() ──→ │
│  ┌─────────────┐  │                │
│  │    Auth     │ ──→ next() ──→  │
│  │  ┌───────┐  │                │
│  │  │Controller│ │ ←  ←  ←  ← ──│
│  │  └───────┘  │                │
│  └─────────────┘                │
└───────────────────┘
```

## 框架应用

- Koa
- Express（简化版）
- Redux 中间件
- NestJS Guard/Interceptor

## 参考

- [Koa.js Middleware](https://koajs.com/)
