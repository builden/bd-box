# 资源链接

本文档收集 UI/UX 设计相关的外部资源。

---

## Apple 官方

- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Apple Design Resources](https://developer.apple.com/design/resources/)

## Ant Design

- [Ant Design 官网](https://ant.design/)
- [Ant Design 设计价值观](https://ant.design/docs/spec/values-cn)
- [Ant Design 设计原则](https://ant.design/docs/spec/overview-cn)
- [Ant Design 反馈模式](https://ant.design/docs/spec/feedback-cn)

## 设计工具

- [Figma](https://www.figma.com/)
- [Framer](https://www.framer.com/)

## 动画资源

- [cubic-bezier.com](https://cubic-bezier.com/) - 贝塞尔曲线调试
- [easings.net](https://easings.net/) - 常用曲线参考
- [Motion One](https://motion.dev/) - 现代动画库
- [Framer Motion](https://www.framer.com/motion/) - React 动画库

## 设计系统

- [Material Design](https://material.io/design)
- [Chakra UI](https://chakra-ui.com/)
- [Radix UI](https://www.radix-ui.com/)

## 可访问性

- [Web Content Accessibility Guidelines (WCAG)](https://www.w3.org/WAI/standards-guidelines/wcag/)
- [A11y Project](https://www.a11yproject.com/)

---

## 源码引用

### 设计系统源码

通过 git-src 可直接查看设计系统源码：

```bash
# 列出 ui 标签仓库
git-src ls --tag ui
```

| 仓库         | 说明                   |
| ------------ | ---------------------- |
| ant-design   | 蚂蚁设计系统，组件丰富 |
| tailwindcss  | 实用优先的 CSS 框架    |
| shadcn-ui/ui | 可定制化的组件库       |

### AI 组件源码

```bash
# 列出 ai 标签仓库
git-src ls --tag ai
```

| 仓库               | 说明                       |
| ------------------ | -------------------------- |
| vercel/ai          | Vercel AI SDK，AI 应用核心 |
| vercel/ai-elements | AI UI 组件库               |

### Ant Design

```bash
# 查看设计文档（价值观、原则、反馈模式等）
# 路径：~/.git-src/ant-design/ant-design/docs/spec/
ls ~/.git-src/ant-design/ant-design/docs/spec/

# 查看组件目录
ls ~/.git-src/ant-design/ant-design/components/Button/
```

| 主题       | 源文件                        |
| ---------- | ----------------------------- |
| 设计价值观 | `docs/spec/values.zh-CN.md`   |
| 设计原则   | `docs/spec/overview.zh-CN.md` |
| 反馈模式   | `docs/spec/feedback.zh-CN.md` |
| 动效原则   | `docs/spec/motion.zh-CN.md`   |
| 暗黑模式   | `docs/spec/dark.zh-CN.md`     |

### Tailwind CSS

```bash
ls ~/.git-src/tailwindlabs/tailwindcss/
```

关键目录：

- `src/utilities` - 工具类
- `src/plugins` - 官方插件

### shadcn/ui

```bash
ls ~/.git-src/shadcn-ui/ui/packages/
```

关键目录：

- `packages/shadcn` - CLI 和组件
- `packages/tests` - 测试用例
