# UI/UX/动效设计 Skill

帮助开发者在实现 UI 组件时参考业界优秀设计体系。

---

## 核心理念

**做设计决策时，问自己三个问题**：

1. **用户目标是什么**？→ 决定信息优先级和布局
2. **用户期望什么反馈**？→ 决定交互方式和动效
3. **这个设计是否通用**？→ 决定是否需要设计系统支持

---

## 快速参考

### 设计价值观

**Ant Design**：确定性、一致性、亲密性、反馈、可控

- **确定性**：操作结果可预期
- **一致性**：同场景同类设计语言一致
- **亲密性**：相关内容靠近
- **反馈**：每个操作都有回应
- **可控**：用户始终掌握主导权

**Apple HIG**：清晰、层次、深度

- **清晰**：内容优先，装饰最小化
- **层次**：视觉层级引导注意力
- **深度**：动效和阴影表达层级关系

### 间距系统

| 类型       | 基准值             |
| ---------- | ------------------ |
| 基础网格   | 4px / 8px          |
| 组件内边距 | 12px / 16px        |
| 卡片间距   | 16px / 24px        |
| 页面边距   | 16px / 24px / 32px |

### 组件使用决策

| 场景       | 推荐组件                |
| ---------- | ----------------------- |
| 确认操作   | Modal                   |
| 展示详情   | Drawer                  |
| 解释性文本 | Tooltip                 |
| 非阻断通知 | Toast                   |
| 简单提示   | Alert                   |
| 加载等待   | Spin / 骨架屏           |
| 空状态     | Empty + 插画 + 操作引导 |

---

## 源码参考

通过 git-src 可直接查看 ant-design 源码：

```bash
# 查看组件设计原则
ls ~/ant-design/docs/spec/

# 查看组件源码
ls ~/ant-design/components/Button/
```

---

## 文档导航

- [设计价值观](references/values.md)
- [设计原则](references/principles.md)
- [颜色系统](references/colors.md)
- [布局模式](references/layout/index.md)
- [组件设计](references/components/index.md)
- [动效规范](references/animation/curves.md)
- [检查清单](references/checklist.md)

---

## 参考资源

- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Ant Design](https://ant.design/)
- [Ant Design 设计价值观](https://ant.design/docs/spec/values-cn)
