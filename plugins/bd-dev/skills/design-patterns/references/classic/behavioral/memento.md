# 备忘录模式 (Memento)

## 一句话定义

在不破坏封装性的情况下，捕获并外部化对象的内部状态，以便以后恢复。

## 为什么好

- **状态保存**：保存对象状态
- **撤销功能**：实现撤销/恢复
- **封装性**：不破坏对象封装

## 函数式实现

```typescript
// 备忘录
const createMemento = <T>(state: T): T & { rollback: () => T } => {
  const snapshot = JSON.parse(JSON.stringify(state));
  return {
    ...state,
    rollback: () => JSON.parse(JSON.stringify(snapshot)),
  };
};

// 使用
let editor = {
  content: "Hello",
  cursor: 5,
};

const saved = createMemento(editor);
editor.content = "Hello World";
editor.cursor = 11;

console.log(editor); // { content: 'Hello World', cursor: 11 }

// 撤销
editor = saved.rollback();
console.log(editor); // { content: 'Hello', cursor: 5 }
```

## 适用场景

- 撤销/恢复
- 快照
- 事务回滚

## 参考

- 《设计模式》- 备忘录模式
