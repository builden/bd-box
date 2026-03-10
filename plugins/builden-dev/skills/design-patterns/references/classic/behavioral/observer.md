# 观察者模式 (Observer)

## 一句话定义

定义对象间的一对多依赖关系，当一个对象状态改变时，所有依赖它的对象都会收到通知。

## 为什么好

- **松耦合**：发布者和订阅者不需要相互了解
- **动态关系**：可以随时订阅/取消订阅
- **广播通信**：一个变化通知多个对象
- **事件驱动**：天然支持异步和事件流

## 函数式实现

### 基础实现

```typescript
type Observer<T> = (data: T) => void;

const createObservable = <T>() => {
  const observers: Observer<T>[] = [];

  return {
    subscribe(observer: Observer<T>) {
      observers.push(observer);
      return () => {
        const index = observers.indexOf(observer);
        if (index > -1) observers.splice(index, 1);
      };
    },
    notify(data: T) {
      observers.forEach((observer) => observer(data));
    },
  };
};

// 使用
const clicks = createObservable<number>();
const unsub1 = clicks.subscribe((count) => console.log(`Click: ${count}`));
const unsub2 = clicks.subscribe((count) => console.log(`Logged: ${count}`));

clicks.notify(1); // 两个订阅者都收到通知
unsub1(); // 取消订阅
clicks.notify(2); // 只有 unsub2 收到
```

### 带主题的观察者

```typescript
interface Observable<T> {
  subscribe(observer: Observer<T>): () => void;
  notify(data: T): void;
}

const createSubject = <T>(initialValue: T): Observable<T> & { getValue: () => T } => {
  let value = initialValue;
  const observers: Observer<T>[] = [];

  return {
    subscribe(observer: Observer<T>) {
      observer(value); // 立即发送当前值
      observers.push(observer);
      return () => {
        const i = observers.indexOf(observer);
        if (i > -1) observers.splice(i, 1);
      };
    },
    notify(data: T) {
      value = data;
      observers.forEach((o) => o(value));
    },
    getValue: () => value,
  };
};

// 使用（类似 RxJS Subject）
const count = createSubject(0);
count.subscribe((v) => console.log(`Current: ${v}`));
count.notify(1); // Current: 1
count.notify(2); // Current: 2
```

### EventEmitter 实现

```typescript
type EventMap = Record<string, any[]>;
type EventKey<T extends EventMap> = string & keyof T;
type EventReceiver<T> = (...args: T[]) => void;

interface Emitter<T extends EventMap> {
  on<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): () => void;
  emit<K extends EventKey<T>>(eventName: K, ...args: T[K]): void;
}

const createEmitter = <T extends EventMap>(): Emitter<T> => {
  const listeners: {
    [K in keyof T]?: Array<EventReceiver<T[K]>>;
  } = {};

  return {
    on(eventName, fn) {
      (listeners[eventName] ??= []).push(fn);
      return () => {
        const arr = listeners[eventName];
        const i = arr?.indexOf(fn);
        if (i !== undefined && i > -1) arr.splice(i, 1);
      };
    },
    emit(eventName, ...args) {
      (listeners[eventName] ??= []).forEach((fn) => fn(...args));
    },
  };
};

// 使用
interface Events {
  userLogin: [user: { id: string; name: string }];
  userLogout: [userId: string];
  error: [error: Error];
}

const emitter = createEmitter<Events>();

emitter.on("userLogin", ({ id, name }) => console.log(`${name} logged in`));
emitter.on("error", (err) => console.error(err));

emitter.emit("userLogin", { id: "1", name: "Alice" });
```

## 适用场景

- 事件系统
- 消息推送
- 数据绑定
- 状态管理（如 Redux）
- 日志系统

## 禁忌（什么时候不该用）

- **简单场景**：不需要一对多通知时
- **内存泄漏风险**：忘记取消订阅
- **复杂状态**：考虑状态机模式

## 观察者 vs 发布-订阅

| 特征     | 观察者模式 | 发布-订阅       |
| -------- | ---------- | --------------- |
| 耦合度   | 紧耦合     | 松耦合          |
| 中介     | 无         | 有（Event Bus） |
| 适用范围 | 同步       | 跨模块/异步     |

## 类实现（补充）

```typescript
class Subject<T> {
  private observers: Observer<T>[] = [];

  subscribe(observer: Observer<T>) {
    this.observers.push(observer);
    return () => {
      this.observers = this.observers.filter((o) => o !== observer);
    };
  }

  notify(data: T) {
    this.observers.forEach((o) => o(data));
  }
}
```

## 参考

- [patterns.dev - Observer](https://www.patterns.dev/vanilla/observer-pattern)
- 《设计模式》- 观察者模式
