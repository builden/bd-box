# SSR (Server-Side Rendering)

## 一句话定义

在服务器端生成完整的 HTML 发送给客户端。

## 为什么好

- **首屏快**：减少首屏渲染时间
- **SEO 友好**：搜索引擎容易抓取
- **弱网优化**：减少客户端 JS

## 缺点

- **服务器负载**：增加服务器压力
- **TTFB**：首字节时间可能较长
- **交互延迟**：需等待 JS 加载

## 适用场景

- 首屏渲染优化
- SEO 优化
- 动态内容

## 框架支持

- Next.js
- Nuxt
- Remix

## 参考

- [patterns.dev - SSR](https://www.patterns.dev/react/server-side-rendering)
