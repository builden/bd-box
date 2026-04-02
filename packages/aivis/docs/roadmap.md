# Aivis 功能改进路线图

> 记录待实现的功能改进，按优先级排序

---

## 方向 6：样式预览与撤销（Style Editor 增强）

### 高优先级

**Box Model 可视化编辑**

- 视觉化的 margin/padding 编辑器
- 上右下左可单独设置
- 类似 Figma 的间距预览

**Typography 行编辑**

- Font Family + Font Size + Weight + Line Height 一行编辑
- Letter Spacing
- Text Decoration

### 中优先级

**颜色选择器增强**

- 支持取色器
- Hex / RGB 切换
- 透明度滑块

**方向键调整数值**

- 选中输入框后，方向键 ±1 调整
- Shift + 方向键 ±10 调整

**快捷键增强**

- ESC 撤销当前修改
- Enter 确认应用

### 低优先级

**boxShadow 可视化**

- 模糊半径、偏移、颜色
- 多层阴影支持

**border 区块**

- 宽度、颜色、位置（上右下左）
- 边框样式（solid/dashed/dotted）

---

## 方向 7：MCP Server 参考实现

**目标：** 提供完整的 MCP Server 实现，让用户开箱即用

```
packages/
├── aivis-server/           # MCP Server
│   ├── src/
│   │   ├── index.ts       # 入口
│   │   ├── session.ts     # Session 管理
│   │   ├── sse.ts         # SSE 事件推送
│   │   └── webhook.ts     # Webhook 转发
│   ├── package.json
│   └── tsconfig.json
```

**核心 API：**

- `POST /sessions` — 创建 session
- `GET /sessions/:id` — 获取 session
- `GET /sessions/:id/events` — SSE 事件流
- `POST /sessions/:id/annotations` — 同步标注
- `PATCH /annotations/:id` — 更新标注
- `DELETE /annotations/:id` — 删除标注
- `POST /sessions/:id/action` — AI 执行操作

---

## 方向 8：导出格式扩展

**当前：** Markdown

**待支持：**

- JSON 格式（结构化数据）
- Figma 原型数据格式
- Jira Issue 格式
- GitHub Issue 格式

---

## 方向 9：多元素批量标注

**目标：** 框选多个元素，一次标注多个

**改进点：**

- 框选模式
- 批量生成标注
- 聚合反馈输出

---

## 方向 10：标注状态管理

**目标：** 引入标注生命周期

**状态：**

- `pending` — 待处理（默认）
- `confirmed` — 已确认
- `resolved` — 已修复
- `rejected` — 已拒绝

**改进点：**

- AI 可更新标注状态
- 状态筛选
- 状态变更历史

---

## 方向 11：截图模式

**目标：** 标注时自动附带元素截图

**改进点：**

- 点击标注时截图
- 输出包含截图 URL 或 base64
- 方便 AI 理解上下文

---

## 方向 12：标注历史 / 版本

**目标：** 保存标注历史，支持对比

**改进点：**

- 自动保存每次标注快照
- 版本历史面板
- 对比不同版本的标注变化

---

## 方向 13：语音标注

**目标：** 解放双手，语音转文字标注

**改进点：**

- 按住快捷键说话
- 语音识别转文字
- 自动生成标注
