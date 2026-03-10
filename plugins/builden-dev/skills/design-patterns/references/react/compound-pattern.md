# Compound Components 模式

## 一句话定义

多个组件协作完成一个功能，对外暴露统一的 API。

## 为什么好

- **显式 API**：语义化组件结构
- **灵活性**：用户可以控制渲染
- **状态共享**：子组件共享父组件状态

## 函数式实现

```typescript
import { createContext, useContext, ReactNode } from 'react';

const SelectContext = createContext<{
  value: string;
  onChange: (value: string) => void;
}>({ value: '', onChange: () => {} });

const Select = ({ value, onChange, children }: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) => (
  <SelectContext.Provider value={{ value, onChange }}>
    <div className="select">{children}</div>
  </SelectContext.Provider>
);

const Option = ({ value, children }: { value: string; children: ReactNode }) => {
  const { value: selected, onChange } = useContext(SelectContext);
  return (
    <div
      className={selected === value ? 'active' : ''}
      onClick={() => onChange(value)}
    >
      {children}
    </div>
  );
};

Select.Option = Option;

// 使用
<Select value={value} onChange={setValue}>
  <Select.Option value="a">Option A</Select.Option>
  <Select.Option value="b">Option B</Select.Option>
</Select>
```

## 参考

- [patterns.dev - Compound](https://www.patterns.dev/react/compound-pattern)
