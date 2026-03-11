# 测试输出目录模板

将以下内容添加到项目根目录的 `.gitignore` 中：

```gitignore
# ===========================================
# 测试输出
# ===========================================

# Bun Test
tests/.cache/

# Playwright
test-results/
.playwright/
playwright-report/

# Visual Testing 截图（如果使用）
# tests/snapshots/

# 测试覆盖率报告
coverage/
*.lcov
```

## 说明

| 目录                 | 用途                                  |
| -------------------- | ------------------------------------- |
| `tests/.cache/`      | bun test 运行时缓存                   |
| `test-results/`      | Playwright 测试输出（截图、trace 等） |
| `.playwright/`       | Playwright 全局配置和缓存             |
| `playwright-report/` | Playwright HTML 报告                  |
| `coverage/`          | 测试覆盖率报告                        |

## 首次使用

首次使用前需创建 `.gitkeep` 占位：

```bash
mkdir -p tests/test-results
touch tests/test-results/.gitkeep
```
