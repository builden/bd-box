# 组合模式 (Composite)

## 一句话定义

将对象组合成树形结构以表示"部分-整体"的层次结构。

## 为什么好

- **树形结构**：统一处理单个对象和组合对象
- **递归处理**：可以递归遍历复杂结构
- **统一接口**：客户端无需关心是叶子还是容器

## 函数式实现

```typescript
interface FileSystemNode {
  name: string;
  print(indent?: string): void;
}

const createFile = (name: string, content = ""): FileSystemNode => ({
  name,
  print(indent = "") {
    console.log(`${indent}- ${name} (${content.length} bytes)`);
  },
});

const createFolder = (name: string, children: FileSystemNode[] = []): FileSystemNode => ({
  name,
  print(indent = "") {
    console.log(`${indent}+ ${name}/`);
    children.forEach((child) => child.print(indent + "  "));
  },
});

// 使用
const tree = createFolder("root", [
  createFile("readme.txt", "Hello"),
  createFolder("src", [createFile("index.ts", 'console.log("hi")'), createFile("utils.ts", "")]),
  createFile("package.json", '{"name": "app"}'),
]);

tree.print();
```

## 适用场景

- 树形结构（文件目录、组织架构）
- UI 组件树
- 菜单系统

## 参考

- 《设计模式》- 组合模式
