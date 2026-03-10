# 解释器模式 (Interpreter)

## 一句话定义

给定一个语言，定义它的文法的一种表示，并定义一个解释器，使用该解释器来解释语言中的句子。

## 为什么好

- **易于扩展**：新增规则简单
- **简单场景适用**：简单规则无需复杂解析器

## 函数式实现

```typescript
// 简单表达式解释器
type Expr = (vars: Record<string, number>) => number;

const createVar =
  (name: string): Expr =>
  (vars) =>
    vars[name] ?? 0;

const createNum =
  (value: number): Expr =>
  () =>
    value;

const add =
  (left: Expr, right: Expr): Expr =>
  (vars) =>
    left(vars) + right(vars);
const sub =
  (left: Expr, right: Expr): Expr =>
  (vars) =>
    left(vars) - right(vars);
const mul =
  (left: Expr, right: Expr): Expr =>
  (vars) =>
    left(vars) * right(vars);

// 使用：(x + 5) * y
const expr = mul(add(createVar("x"), createNum(5)), createVar("y"));

console.log(expr({ x: 3, y: 2 })); // (3 + 5) * 2 = 16
```

## 适用场景

- 简单规则引擎
- DSL
- 配置表达式

## 禁忌

- 复杂语法
- 性能要求高

## 参考

- 《设计模式》- 解释器模式
