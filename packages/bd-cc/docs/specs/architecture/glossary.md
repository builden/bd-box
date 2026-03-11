# 项目术语表

CloudCLI (Claude Code UI) 项目的术语统一文档，确保团队沟通和代码命名一致。

## 术语规范

### 核心术语

| 术语   | 英文     | 缩写 | 说明                                       | 变量命名示例                      |
| ------ | -------- | ---- | ------------------------------------------ | --------------------------------- |
| 提供商 | Provider | -    | AI 服务提供商 (Claude/Cursor/Codex/Gemini) | `currentProvider`, `providerList` |
| 会话   | Session  | -    | Agent 对话会话实例                         | `sessionId`, `activeSession`      |
| 项目   | Project  | -    | 用户工作项目目录                           | `projectId`, `projectPath`        |
| 消息   | Message  | -    | 聊天消息                                   | `messageId`, `messageList`        |
| 工具   | Tool     | -    | Claude Code 工具                           | `toolName`, `enabledTools`        |
| 插件   | Plugin   | -    | 可扩展插件                                 | `pluginId`, `pluginList`          |
| 终端   | Terminal | -    | 集成终端模拟器                             | `terminalId`, `terminalInstance`  |
| 编辑器 | Editor   | -    | CodeMirror 代码编辑器                      | `editorRef`, `editorState`        |

### 命名原则

1. **一个概念一个术语**：避免"会话"又叫"对话"、"聊天记录"
2. **英文优先**：核心术语用英文，便于代码命名
3. **缩写需定义**：首次出现需注明全称
4. **变量名保持一致**：后端、前端、数据库统一

---

## 领域术语

### 认证授权

| 术语         | 英文         | 说明                |
| ------------ | ------------ | ------------------- |
| API 密钥     | API Key      | 访问 AI 服务的凭证  |
| GitHub Token | GitHub Token | GitHub API 访问凭证 |
| JWT Token    | JWT          | Web 服务认证令牌    |
| 凭据         | Credential   | 认证信息的统称      |

### 会话管理

| 术语     | 英文              | 说明                           |
| -------- | ----------------- | ------------------------------ |
| 会话发现 | Session Discovery | 自动发现 Provider 目录中的会话 |
| 会话恢复 | Session Resume    | 恢复历史会话继续对话           |
| 会话历史 | Session History   | 会话的聊天记录                 |
| 活跃会话 | Active Session    | 当前正在使用的会话             |

### 文件操作

| 术语       | 英文              | 说明               |
| ---------- | ----------------- | ------------------ |
| 文件树     | File Tree         | 目录结构的树形展示 |
| 文件浏览器 | File Explorer     | 文件浏览和管理界面 |
| 工作目录   | Working Directory | 当前项目的根目录   |
| 监视文件   | Watch Files       | 监听文件变化的机制 |

### Git 操作

| 术语     | 英文              | 说明                   |
| -------- | ----------------- | ---------------------- |
| 仓库状态 | Repository Status | Git 仓库当前状态       |
| 文件变更 | File Changes      | 已修改、暂存的文件列表 |
| 提交     | Commit            | Git 提交操作           |
| 分支     | Branch            | Git 分支               |
| 差异     | Diff              | 文件差异对比           |

### 终端

| 术语     | 英文             | 说明             |
| -------- | ---------------- | ---------------- |
| PTY      | PTY              | 伪终端进程       |
| Shell    | Shell            | 命令行解释器     |
| 流式输出 | Stream Output    | 实时输出的数据流 |
| 终端会话 | Terminal Session | 终端连接会话     |

### 插件系统

| 术语     | 英文            | 说明                   |
| -------- | --------------- | ---------------------- |
| 插件清单 | Plugin Manifest | 插件配置文件           |
| 插件前端 | Plugin Frontend | 插件的 UI 部分         |
| 插件后端 | Plugin Backend  | 插件的服务端部分       |
| 插件 API | Plugin API      | 插件与主应用通信的接口 |

---

## 通用术语

### API 接口

| 术语      | 英文          | 说明                 |
| --------- | ------------- | -------------------- |
| REST API  | REST API      | 基于 REST 风格的接口 |
| WebSocket | WebSocket     | 实时双向通信协议     |
| 请求体    | Request Body  | POST/PUT 请求数据    |
| 响应体    | Response Body | API 返回数据         |

### 状态管理

| 术语       | 英文              | 说明                   |
| ---------- | ----------------- | ---------------------- |
| 全局状态   | Global State      | 跨组件共享状态         |
| 本地状态   | Local State       | 组件私有状态           |
| 服务端状态 | Server State      | 服务端数据缓存         |
| 乐观更新   | Optimistic Update | 先更新 UI 再请求服务器 |

### 错误处理

| 术语     | 英文             | 说明           |
| -------- | ---------------- | -------------- |
| 错误边界 | Error Boundary   | 组件错误捕获   |
| 全局异常 | Global Exception | 全局未捕获异常 |
| 回退     | Fallback         | 异常降级 UI    |
| 重试     | Retry            | 失败自动重试   |

### UI 布局

| 术语     | 英文         | 说明             | 变量示例        |
| -------- | ------------ | ---------------- | --------------- |
| 头部导航 | Header       | 页面顶部导航区域 | `<Header>`      |
| 侧边栏   | Sidebar      | 左侧导航菜单     | `<Sidebar>`     |
| 主内容区 | Main Content | 页面主要内容区域 | `<MainContent>` |
| 右侧面板 | Right Panel  | 右侧可折叠面板   | `<RightPanel>`  |
| 底部导航 | Bottom Nav   | 移动端底部导航   | `<MobileNav>`   |
| 模态框   | Modal        | 弹窗对话框       | `<Modal>`       |
| 工具栏   | Toolbar      | 操作按钮栏       | `<Toolbar>`     |

---

## 场景术语表

### 用户认证

| 术语     | 英文     | 说明               |
| -------- | -------- | ------------------ |
| 登录     | Login    | 用户身份验证       |
| 登出     | Logout   | 结束用户会话       |
| 注册     | Register | 创建新账户         |
| 初始设置 | Setup    | 首次使用的配置流程 |

### 聊天交互

| 术语     | 英文           | 说明                  |
| -------- | -------------- | --------------------- |
| 用户消息 | User Message   | 用户发送的消息        |
| AI 消息  | AI Message     | AI 返回的消息         |
| 系统消息 | System Message | 系统提示信息          |
| 思考模式 | Thinking Mode  | AI 思考过程展示       |
| 工具调用 | Tool Call      | 调用 Claude Code 工具 |

### 文件管理

| 术语     | 英文        | 说明             |
| -------- | ----------- | ---------------- |
| 新建文件 | New File    | 创建新文件       |
| 删除文件 | Delete File | 删除文件         |
| 重命名   | Rename      | 文件重命名       |
| 移动文件 | Move File   | 移动文件位置     |
| 上传文件 | Upload      | 文件上传到服务器 |

### 代码编辑

| 术语     | 英文                | 说明         |
| -------- | ------------------- | ------------ |
| 语法高亮 | Syntax Highlighting | 代码着色     |
| 代码补全 | Code Completion     | 自动补全建议 |
| 代码折叠 | Code Folding        | 代码块折叠   |
| 多游标   | Multiple Cursors    | 多位置编辑   |
| 搜索替换 | Search & Replace    | 查找和替换   |

### 发布部署

| 术语       | 英文             | 说明         |
| ---------- | ---------------- | ------------ |
| 构建       | Build            | 打包项目     |
| 开发服务器 | Dev Server       | 本地开发服务 |
| 生产构建   | Production Build | 生产环境构建 |
| 预览       | Preview          | 预览构建结果 |
