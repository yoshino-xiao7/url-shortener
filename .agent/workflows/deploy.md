---
description: 短链服务完整部署流程，从 0 到 1 部署 Cloudflare Worker + EdgeOne Pages + D1 数据库
---

# 短链服务部署工作流

## 前置条件

- Node.js 18+ 已安装
- Cloudflare 账户
- 腾讯云账户（EdgeOne Pages）
- GitHub 账户

## 部署步骤

### 1. 初始化 Git 仓库并推送到 GitHub

```bash
cd f:\yukiryou\url-shortener
git init
git add .
git commit -m "Initial commit: URL shortener service"
git remote add origin https://github.com/YOUR_USERNAME/url-shortener.git
git push -u origin main
```

### 2. 创建 Cloudflare D1 数据库

```bash
cd worker

# 登录 Cloudflare
npx wrangler login

# 创建数据库
npx wrangler d1 create url-shortener-db
```

复制返回的 `database_id` 到 `wrangler.toml`:
```toml
database_id = "你的数据库ID"
```

// turbo
### 3. 执行数据库迁移

```bash
npx wrangler d1 execute url-shortener-db --file=./schema.sql
```

### 4. 配置 Worker 环境变量

```bash
npx wrangler secret put ADMIN_USERNAME
# 输入管理员用户名

npx wrangler secret put ADMIN_PASSWORD
# 输入管理员密码

npx wrangler secret put JWT_SECRET
# 输入随机字符串
```

### 5. 手动部署 Worker 测试

// turbo
```bash
npx wrangler deploy
```

### 6. 配置 GitHub Secrets

进入 GitHub 仓库 → Settings → Secrets and variables → Actions

添加以下 Secrets：
- `CLOUDFLARE_API_TOKEN`: Cloudflare API Token (Workers 编辑权限)
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare 账户 ID
- `EDGEONE_API_TOKEN`: EdgeOne API Token

### 7. 配置 ki1.mom 域名

1. Cloudflare Dashboard → 添加域名 `ki1.mom`
2. 修改域名 DNS 服务器指向 Cloudflare
3. Workers & Pages → url-shortener → Settings → Triggers
4. 添加 Custom Domain: `ki1.mom`

### 8. 配置 EdgeOne Pages

1. 登录 EdgeOne Pages (edgeone.ai)
2. 创建新项目 → 连接 GitHub 仓库
3. 构建配置：
   - 构建命令: `cd frontend && npm install && npm run build`
   - 输出目录: `frontend/dist`
4. 添加自定义域名: `dl.yukiryou.icu`
5. DNS 添加 CNAME 记录

### 9. 验证部署

1. 访问 `https://dl.yukiryou.icu` 测试管理后台
2. 使用配置的用户名密码登录
3. 创建测试短链
4. 访问 `https://ki1.mom/{短码}` 测试跳转

## 自动部署触发

推送代码到 `main` 分支会自动触发：
- `worker/**` 变更 → 部署 Cloudflare Worker
- `frontend/**` 变更 → 部署 EdgeOne Pages
