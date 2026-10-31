# Nginx 部署 SPA 的路由配置指南

本文说明把前端单页应用（SPA）部署到自有服务器时，如何用 nginx 解决「直接访问深链接返回 404」的问题。

## 问题本质

浏览器直接访问 `/tasks?view=gantt` 这类深链接时，服务器需要把请求**回退（fallback）到应用入口 `index.html`**，让前端路由接管渲染。

- **BrowserRouter（history 模式）**：路由路径会发给服务器，nginx 必须配置回退，否则静态服务器上找不到 `/tasks` 这个文件，直接 404。
- **HashRouter（hash 模式）**：路由信息在 `#` 之后，**永远不会发送到服务器**，nginx 不需要任何回退配置。

GitHub Pages 没有回退能力，才需要自定义 `404.html` 做跳转 hack；nginx 有 `try_files`，可以干净地解决。

## 总览

| | 部署在根路径 `/` | 部署在子路径 `/antd-calendar-demo/` |
|---|---|---|
| **BrowserRouter**（URL 无 `#`） | nginx 必须配回退 | nginx 必须配回退 + 构建时配 `basename`/`PUBLIC_URL` |
| **HashRouter**（URL 有 `#`） | nginx 零特殊配置 | nginx 零特殊配置，只需资源路径正确 |

## 1. BrowserRouter + 根路径

构建配置：`PUBLIC_URL=/`，`<BrowserRouter>`（无 basename）。

```nginx
server {
    listen 80;
    server_name example.com;

    root /var/www/antd-calendar-demo;   # build 产物目录
    index index.html;

    # 关键：文件不存在时回退到应用入口，深链接由前端路由接管
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 带内容 hash 的静态资源长缓存；入口 html 不缓存，保证发版即生效
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    location = /index.html {
        add_header Cache-Control "no-cache";
    }
}
```

核心就是 `try_files $uri $uri/ /index.html;`：`/tasks?view=gantt` 找不到文件 → 内部重写为 `/index.html` → 应用启动 → React Router 读取地址栏渲染对应页面。

## 2. BrowserRouter + 子路径

构建侧要先对齐路径（**只有 history 模式才需要**）：

```jsonc
// package.json：决定资源 URL 前缀
"homepage": "/antd-calendar-demo"
```

```tsx
// 路由声明 basename，让 Link/redirect 都带上前缀
<BrowserRouter basename="/antd-calendar-demo">
```

```nginx
server {
    listen 80;
    server_name example.com;

    # 子路径用 alias：把 /antd-calendar-demo/xxx 映射到磁盘目录
    location /antd-calendar-demo/ {
        alias /var/www/antd-calendar-demo/;
        index index.html;
        # 回退目标写完整 URI，会重新匹配本 location 后命中入口文件
        try_files $uri $uri/ /antd-calendar-demo/index.html;
    }

    location /antd-calendar-demo/static/ {
        alias /var/www/antd-calendar-demo/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

注意 `try_files` 的最后一项写的是 **URI**（`/antd-calendar-demo/index.html`），不是文件系统路径，这样才会走 `alias` 的映射逻辑。

## 3. HashRouter + 根路径

深链接形如 `/#/tasks?view=gantt`，服务器只会收到对 `/` 的请求，路由部分不经过网络。nginx 只负责把文件给出去：

```nginx
server {
    listen 80;
    server_name example.com;

    root /var/www/antd-calendar-demo;
    index index.html;

    location / {
        try_files $uri $uri/ =404;   # 不需要回退，找不到就是找不到
    }

    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 4. HashRouter + 子路径

服务器只会收到 `/antd-calendar-demo/`（入口）和 `/antd-calendar-demo/static/...`（资源）两类请求，同样不需要回退：

```jsonc
// package.json：仅用于资源路径，路由不需要 basename
"homepage": "/antd-calendar-demo"
```

```nginx
server {
    listen 80;
    server_name example.com;

    location /antd-calendar-demo/ {
        alias /var/www/antd-calendar-demo/;
        index index.html;
        try_files $uri $uri/ =404;
    }
}
```

这也是当前项目部署到 GitHub Pages 的形态（hash + 404 页兜底）。换成 nginx 后 `public/404.html` 可以删除，用 `=404` 兜底即可。

## 选择建议

| 诉求 | 推荐 |
|---|---|
| URL 干净、利于 SEO、有 nginx 控制权 | BrowserRouter + `try_files` 回退（方案 1/2） |
| 静态托管（Pages/OSS/CDN）、无服务器控制权 | HashRouter（方案 3/4） |
| 子路径部署且路由是 BrowserRouter | 必须三处对齐：`homepage` + `basename` + nginx `alias` 回退 |

## 验证方式

配置后直接请求深链接：

```bash
curl -I https://example.com/antd-calendar-demo/tasks?view=gantt
```

- BrowserRouter 方案应返回 **200**（响应体是 `index.html`）；
- HashRouter 方案对无 `#` 的路径返回 404 属正常现象——正确的深链接本身带 `#`，服务器只会收到入口路径请求。
