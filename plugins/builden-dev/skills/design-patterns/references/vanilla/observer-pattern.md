# Observer Pattern (Vanilla)

## 一句话定义

观察者模式的 Vanilla JS 实现。

## 函数式实现

```typescript
const createSubject = () => {
  const observers = new Set();

  return {
    subscribe(fn) {
      observers.add(fn);
      return () => observers.delete(fn);
    },
    publish(data) {
      observers.forEach((fn) => fn(data));
    },
  };
};

// 使用
const clicks = createSubject();
const unsub = clicks.subscribe((x) => console.log(x));
clicks.publish(1);
unsub();
```

## 参考

- [patterns.dev - Observer](https://www.patterns.dev/vanilla/observer-pattern)
