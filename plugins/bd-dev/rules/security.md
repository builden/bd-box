# 安全规范

## 敏感信息

- **禁止在代码中硬编码敏感信息**（API Key、密码、Token、密钥等）
- 使用环境变量处理敏感配置

```typescript
// 错误
const apiKey = "sk-xxx";

// 正确
const apiKey = process.env.API_KEY;
```

## 环境变量

- 敏感配置必须通过环境变量传入
- 使用 `.env` 文件管理本地开发配置（需加入 `.gitignore`）
- 生产环境使用 CI/CD 的 secrets 管理

## 提交检查

- 提交前检查是否有意外泄露的敏感数据
- 禁止提交 `.env`、`.env.local`、凭证文件等到版本控制
- 使用 `git diff` 检查变更中是否包含敏感信息

## 第三方服务

- 调用外部 API 时，优先使用环境变量注入凭证
- 禁止将凭证硬编码在 API 调用中
