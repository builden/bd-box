# Render Props 模式

## 一句话定义

通过 props 传递一个函数组件来共享代码。

## 为什么好

- **逻辑复用**：跨组件共享行为
- **灵活性**：动态控制渲染内容

## 函数式实现

```typescript
// 鼠标位置组件
function MouseTracker({ render }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e) => setPosition({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return render(position);
}

// 使用
<MouseTracker
  render={({ x, y }) => (
    <h1>The mouse is at {x}, {y}</h1>
  )}
/>
```

## 适用场景

- 逻辑复用（Hooks 出现后已较少使用）

## 现代替代

Hooks 模式是更好的选择。

## 参考

- [patterns.dev - Render Props](https://www.patterns.dev/react/render-props-pattern)
