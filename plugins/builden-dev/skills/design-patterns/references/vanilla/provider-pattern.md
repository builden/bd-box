# Provider 模式 (Provider Pattern)

## 一句话定义

通过上下文传递数据，避免 props 逐层传递。

## 为什么好

- **避免 props 穿透**：避免层层传递 props
- **全局状态**：提供全局可访问的状态
- **解耦**：组件与数据源解耦

## 函数式实现

```typescript
const createContext = <T>(defaultValue: T) => {
  let value = defaultValue;
  const subscribers = new Set<(value: T) => void>();

  return {
    Provider: (props: { value: T; children: any }) => {
      value = props.value;
      return props.children;
    },
    useContext: () => {
      return value;
    }
  };
};

// 使用
const ThemeContext = createContext('light');

const App = () => (
  <ThemeContext.Provider value="dark">
    <Toolbar />
  </ThemeContext.Provider>
);

const Toolbar = () => {
  const theme = ThemeContext.useContext();
  return <button className={theme}>Click</button>;
};
```

## 适用场景

- 全局配置
- 主题
- 用户认证

## 参考

- [patterns.dev - Provider](https://www.patterns.dev/vanilla/provider-pattern)
