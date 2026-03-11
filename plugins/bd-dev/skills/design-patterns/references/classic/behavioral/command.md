# 命令模式 (Command)

## 一句话定义

将请求封装为命令对象，从而参数化客户端、排队执行、撤销操作。

## 为什么好

- **解耦**：调用者与执行者分离
- **可撤销**：可以保存命令历史实现撤销/重做
- **可排队**：命令可以延迟执行或批量执行
- **可录制**：可以记录命令序列用于回放
- **易于扩展**：新增命令不影响现有代码

## 函数式实现

### 基础命令

```typescript
interface Command {
  execute(): void;
  undo(): void;
}

const createCommand = (execute: () => void, undo: () => void): Command => ({ execute, undo });

// 使用
let text = "";

const insertCommand = (char: string) =>
  createCommand(
    () => {
      text += char;
    },
    () => {
      text = text.slice(0, -1);
    },
  );

const cmd = insertCommand("a");
cmd.execute(); // text = 'a'
cmd.undo(); // text = ''
```

### 带参数的命令

```typescript
type Command<T = void> = {
  execute: (arg: T) => void;
  undo?: () => void;
};

interface TextEditor {
  content: string;
  insert(index: number, text: string): void;
  delete(index: number, length: number): string;
}

const createInsertCommand = (editor: TextEditor, index: number, text: string): Command => ({
  execute: () => editor.insert(index, text),
  undo: () => editor.delete(index, text.length),
});

const createDeleteCommand = (editor: TextEditor, index: number, length: number): Command<string> => {
  let deletedText = "";
  return {
    execute: () => {
      deletedText = editor.delete(index, length);
    },
    undo: () => editor.insert(index, deletedText),
  };
};
```

### 命令队列

```typescript
interface Command {
  execute(): void;
}

class CommandQueue {
  private queue: Command[] = [];
  private history: Command[] = [];

  add(command: Command) {
    this.queue.push(command);
  }

  execute() {
    while (this.queue.length > 0) {
      const cmd = this.queue.shift();
      cmd?.execute();
      this.history.push(cmd);
    }
  }

  undo() {
    const cmd = this.history.pop();
    if ("undo" in cmd && typeof cmd.undo === "function") {
      cmd.undo();
    }
  }
}
```

### 函数式命令（更轻量）

```typescript
// 更简洁的命令形式
type Action<T = void> = (arg: T) => void;

const createAction = <T>(
  doAction: Action<T>,
  undoAction: Action<T>
) => ({
  do: doAction,
  undo: undoAction
});

// 使用
const text = { value: '' };
const actions = [
  createAction(
    () => { text.value += 'hello'; },
    () => { text.value = text.value.slice(0, -5); }
  ),
  createAction(
    () => { text.value += ' '; },
    () => text.value = text.value.slice(0, -1)
  ),
  createAction(
    () => { text.value += 'world'; },
    () => text.value = text.value.slice(0, -5);
  )
];

actions.forEach(a => a.do());
console.log(text.value); // 'hello world'

actions.reverse().forEach(a => a.undo());
console.log(text.value); // ''
```

## 适用场景

- 撤销/重做功能
- 命令队列和批处理
- 宏命令（组合多个命令）
- 事务操作
- 异步任务队列
- UI 按钮/菜单操作

## 禁忌（什么时候不该用）

- **简单操作**：不需要撤销/重做时
- **性能敏感**：命令对象有额外开销
- **状态复杂**：难以追踪状态变化

## 命令 vs 策略

| 特征 | 命令模式   | 策略模式 |
| ---- | ---------- | -------- |
| 目的 | 封装请求   | 封装算法 |
| 执行 | 可延迟执行 | 立即执行 |
| 历史 | 可保存历史 | 无       |

## 类实现（补充）

```typescript
interface Command {
  execute(): void;
  undo(): void;
}

class ConcreteCommand implements Command {
  constructor(private receiver: Receiver) {}

  execute() {
    this.receiver.action();
  }

  undo() {
    this.receiver.undoAction();
  }
}

class Invoker {
  private history: Command[] = [];

  executeCommand(cmd: Command) {
    cmd.execute();
    this.history.push(cmd);
  }

  undo() {
    const cmd = this.history.pop();
    cmd?.undo();
  }
}
```

## 参考

- 《设计模式》- 命令模式
