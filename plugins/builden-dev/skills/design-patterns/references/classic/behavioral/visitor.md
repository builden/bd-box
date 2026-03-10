# 访问者模式 (Visitor)

## 一句话定义

表示一个作用于某对象结构中的各元素的操作，使可以在不改变各元素的类的前提下定义作用于这些元素的新操作。

## 为什么好

- **操作扩展**：新增操作无需修改元素类
- **操作集中**：相关操作集中
- **类型分离**：操作逻辑与数据结构分离

## 函数式实现

```typescript
// 元素
const elements = [
  { type: "circle", radius: 5 },
  { type: "rectangle", width: 10, height: 20 },
];

// 访问者
const visitors = {
  area: {
    circle: (el: any) => Math.PI * el.radius ** 2,
    rectangle: (el: any) => el.width * el.height,
  },
  perimeter: {
    circle: (el: any) => 2 * Math.PI * el.radius,
    rectangle: (el: any) => 2 * (el.width + el.height),
  },
};

// 使用
elements.forEach((el) => {
  console.log("Area:", visitors.area[el.type](el));
  console.log("Perimeter:", visitors.perimeter[el.type](el));
});
```

## 适用场景

- 数据结构稳定但操作经常变化
- 报表系统
- AST 操作

## 参考

- 《设计模式》- 访问者模式
