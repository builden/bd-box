# 原型模式 (Prototype)

## 一句话定义

通过复制已有对象来创建新对象，而无需知道其具体类。

## 为什么好

- **性能优化**：避免重复创建复杂对象
- **简化创建**：无需知道对象创建细节
- **动态配置**：运行时动态创建对象

## 函数式实现

```typescript
// 原型克隆
const clone = <T extends object>(source: T): T => {
  return Object.create(source);
};

// 深拷贝版本
const deepClone = <T>(source: T): T => {
  if (source === null || typeof source !== "object") return source;
  if (source instanceof Date) return new Date(source.getTime()) as any;
  if (Array.isArray(source)) return source.map(deepClone) as any;

  const target = {} as T;
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      target[key] = deepClone(source[key]);
    }
  }
  return target;
};

// 使用
const user = {
  name: "Alice",
  profile: { age: 25 },
};

const cloned = deepClone(user);
cloned.name = "Bob";
cloned.profile.age = 30;

console.log(user.name); // 'Alice'（原对象不变）
console.log(user.profile.age); // 25
```

## 适用场景

- 对象创建成本高
- 需要复制复杂对象
- 避免重复配置

## 参考

- [patterns.dev - Prototype](https://www.patterns.dev/vanilla/prototype-pattern)
- 《设计模式》- 原型模式
