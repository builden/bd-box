# 项目术语表

项目启动时创建的术语统一文档，确保团队沟通和代码命名一致。

## 术语规范

### 术语格式

| 术语 | 英文    | 缩写 | 说明       | 变量命名示例               |
| ---- | ------- | ---- | ---------- | -------------------------- |
| 用户 | user    | -    | 系统使用者 | `userId`, `currentUser`    |
| 订单 | order   | -    | 购买交易   | `orderId`, `orderList`     |
| 商品 | product | -    | 售卖物品   | `productId`, `productName` |

### 命名原则

1. **一个概念一个术语**：避免"用户"又叫"客户"、"账号"
2. **英文优先**：核心术语用英文，便于代码命名
3. **缩写需定义**：首次出现需注明全称
4. **变量名保持一致**：后端、前端、数据库统一

### 禁用术语

| 禁用 | 原因       | 改用 |
| ---- | ---------- | ---- |
| xxx  | 易混淆     | xxx  |
| xxx  | 与业务无关 | xxx  |

---

## 领域术语

### 核心业务

[项目核心业务领域的术语]

### 技术术语

[技术实现相关的术语]

### 通用术语

[跨领域通用的术语]

---

## 场景术语表

按场景分类的常用术语，供项目按需引用。

### 通用基础

| 术语     | 英文       | 说明         |
| -------- | ---------- | ------------ |
| ID       | identifier | 唯一标识符   |
| 创建时间 | createdAt  | 记录创建时间 |
| 更新时间 | updatedAt  | 记录更新时间 |
| 状态     | status     | 业务状态     |
| 类型     | type       | 业务类型     |

### UI 布局

| 术语     | 英文                  | 说明             | 变量示例        |
| -------- | --------------------- | ---------------- | --------------- |
| 头部导航 | header                | 页面顶部导航区域 | `<Header>`      |
| 侧边栏   | sidebar               | 左侧导航菜单     | `<Sidebar>`     |
| 主内容区 | content / main        | 页面主要内容区域 | `<MainContent>` |
| 底部     | footer                | 页面底部信息区   | `<Footer>`      |
| 卡片     | card                  | 独立内容容器     | `<Card>`        |
| 弹窗     | modal / dialog        | 模态弹窗         | `<Modal>`       |
| 抽屉     | drawer                | 侧边抽屉         | `<Drawer>`      |
| 表格     | table                 | 数据展示表格     | `<Table>`       |
| 表单     | form                  | 用户输入表单     | `<Form>`        |
| 按钮     | button                | 操作按钮         | `<Button>`      |
| 输入框   | input                 | 文本输入         | `<Input>`       |
| 下拉选择 | select                | 下拉选择器       | `<Select>`      |
| 分页     | pagination            | 列表分页         | `<Pagination>`  |
| 加载中   | loading               | 加载状态         | `isLoading`     |
| 空状态   | empty                 | 无数据展示       | `<Empty>`       |
| 响应式   | responsive            | 响应式布局       | `isMobile`      |
| 导航栏   | navbar                | 顶部导航菜单     | `<Navbar>`      |
| 面包屑   | breadcrumb            | 路径导航指示     | `<Breadcrumb>`  |
| 提示框   | tooltip               | 鼠标悬停提示     | `<Tooltip>`     |
| 轻提示   | toast / snackbar      | 临时通知消息     | `<Toast>`       |
| 头像     | avatar                | 用户头像展示     | `<Avatar>`      |
| 键盘按键 | kbd                   | 键盘按键展示     | `<Kbd>`         |
| 复合框   | combobox              | 可搜索的下拉选择 | `<Combobox>`    |
| 日历     | calendar / datepicker | 日期选择器       | `<Calendar>`    |
| 上传     | upload                | 文件上传         | `<Upload>`      |
| 单选     | radio                 | 单选按钮         | `<Radio>`       |
| 复选     | checkbox              | 复选框           | `<Checkbox>`    |

### API 接口

| 术语   | 英文           | 说明              |
| ------ | -------------- | ----------------- |
| 请求体 | request body   | POST/PUT 请求数据 |
| 响应体 | response body  | API 返回数据      |
| 分页   | pagination     | 列表分页参数      |
| 过滤   | filter         | 数据筛选条件      |
| 排序   | sort           | 数据排序规则      |
| 认证   | authentication | 用户身份验证      |
| 授权   | authorization  | 权限控制          |

### 状态管理

| 术语       | 英文              | 说明             | 变量示例          |
| ---------- | ----------------- | ---------------- | ----------------- |
| 全局状态   | global state      | 跨组件共享状态   | `useStore()`      |
| 本地状态   | local state       | 组件私有状态     | `useState()`      |
| 服务端状态 | server state      | 服务端数据缓存   | `useQuery()`      |
| 状态机     | state machine     | 有限状态机       | `createMachine()` |
| 乐观更新   | optimistic update | 先更新 UI 再请求 | `onMutate`        |

### 错误处理

| 术语     | 英文             | 说明           |
| -------- | ---------------- | -------------- |
| 错误边界 | error boundary   | 组件错误捕获   |
| 全局异常 | global exception | 全局未捕获异常 |
| 回退     | fallback         | 异常降级 UI    |
| 重试     | retry            | 失败自动重试   |
| 断路器   | circuit breaker  | 防止级联失败   |
