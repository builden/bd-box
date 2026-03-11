# Container/Presentational 模式

## 一句话定义

将组件的逻辑（Container）与 UI 渲染（Presentational）分离。

## 为什么好

- **关注点分离**：逻辑与 UI 分离
- **可复用性**：Presentational 组件可在不同场景复用
- **可测试性**：Presentational 组件易于单元测试
- **团队协作**：设计师可以独立修改 UI

## 函数式实现

### 基础分离

```typescript
// Presentational 组件（纯 UI）
interface UserListProps {
  users: User[];
  onDelete: (id: string) => void;
  loading?: boolean;
}

function UserList({ users, onDelete, loading }: UserListProps) {
  if (loading) return <Spinner />;

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>
          {user.name}
          <button onClick={() => onDelete(user.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}

// Container 组件（逻辑）
function UserListContainer() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      });
  }, []);

  const handleDelete = async (id: string) => {
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
    setUsers(users.filter(u => u.id !== id));
  };

  return <UserList users={users} onDelete={handleDelete} loading={loading} />;
}
```

### 自定义 Hook 替代 Container

```typescript
// Hook 封装逻辑
function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers().then(data => {
      setUsers(data);
      setLoading(false);
    });
  }, []);

  const deleteUser = async (id: string) => {
    await deleteUserApi(id);
    setUsers(users.filter(u => u.id !== id));
  };

  return { users, loading, deleteUser };
}

// 使用
function UserList() {
  const { users, loading, deleteUser } = useUsers();

  if (loading) return <Spinner />;

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>
          {user.name}
          <button onClick={() => deleteUser(user.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}
```

### Props 分离

```typescript
// 只接收数据的 Presentational
function UserCard({ user }: { user: User }) {
  return (
    <div className="user-card">
      <img src={user.avatar} alt={user.name} />
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  );
}

// Container 决定数据和行为
function UserCardContainer({ userId }: { userId: string }) {
  const { user, isOwner } = useUserData(userId);

  return <UserCard user={user} isOwner={isOwner} />;
}

// Presentational 增强
function UserCard({ user, isOwner }: { user: User; isOwner?: boolean }) {
  return (
    <div className="user-card">
      <img src={user.avatar} alt={user.name} />
      <h3>{user.name}</h3>
      {isOwner && <span className="badge">You</span>}
    </div>
  );
}
```

## 适用场景

- 复杂业务逻辑
- 需要复用的 UI 组件
- 团队分工明确
- 需要单元测试

## 禁忌（什么时候不该用）

- **简单组件**：逻辑简单不需要分离
- **小型应用**：过度工程
- **Hooks 足够**：现代 React 更推荐使用 Hooks

## Container/Presentational vs Hooks

| 特征     | Container/Presentational | Hooks       |
| -------- | ------------------------ | ----------- |
| 分离方式 | 组件分层                 | 自定义 Hook |
| 代码量   | 较多                     | 较少        |
| 学习成本 | 低                       | 中          |
| 推荐度   | 一般                     | 推荐        |

## 现代推荐：Hooks 优先

```typescript
// 最佳实践：一个文件同时定义 Presentational 和 Hook
function UserList() {
  // Hook 定义逻辑
  const { users, loading, deleteUser } = useUsers();

  // Presentational 定义 UI
  if (loading) return <Spinner />;

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}

// 复杂逻辑抽取为独立 Hook
function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  // ... 复杂逻辑
  return { users, loading, deleteUser };
}
```

## 参考

- [patterns.dev - Container/Presentational](https://www.patterns.dev/react/presentational-container-pattern)
- Dan Abramov - Presentational and Container Components
