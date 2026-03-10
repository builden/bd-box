# 桥接模式 (Bridge)

## 一句话定义

将抽象部分与实现部分分离，使它们可以独立变化。

## 为什么好

- **独立变化**：抽象和实现可以独立扩展
- **组合优于继承**：避免类爆炸
- **开闭原则**：可以独立修改抽象和实现

## 函数式实现

```typescript
// 实现部分
interface Renderer {
  renderCircle(x: number, y: number, radius: number): string;
  renderSquare(x: number, y: number, side: number): string;
}

const canvasRenderer: Renderer = {
  renderCircle: (x, y, r) => `<canvas circle x="${x}" y="${y}" r="${r}" />`,
  renderSquare: (x, y, s) => `<canvas square x="${x}" y="${y}" s="${s}" />`,
};

const svgRenderer: Renderer = {
  renderCircle: (x, y, r) => `<svg><circle cx="${x}" cy="${y}" r="${r}" /></svg>`,
  renderSquare: (x, y, s) => `<svg><rect x="${x}" y="${y}" width="${s}" height="${s}" /></svg>`,
};

// 抽象部分
type Shape = {
  render: (renderer: Renderer) => string;
};

const circle = (x: number, y: number, r: number): Shape => ({
  render: (r) => r.renderCircle(x, y, r),
});

const square = (x: number, y: number, s: number): Shape => ({
  render: (r) => r.renderSquare(x, y, s),
});

// 使用
circle(10, 10, 5).render(canvasRenderer);
circle(10, 10, 5).render(svgRenderer);
```

## 适用场景

- 跨平台应用
- 插件系统
- 多维度变化

## 参考

- 《设计模式》- 桥接模式
