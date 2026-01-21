# 短链服务 (URL Shortener)

基于 Cloudflare Worker + EdgeOne Pages + D1 数据库的短链服务

## 技术栈

- **后端**: Cloudflare Worker (TypeScript)
- **前端**: Vue 3 + Vite (部署到 EdgeOne Pages)
- **数据库**: Cloudflare D1 (SQLite)
- **短链域名**: ki1.mom
- **管理后台**: dl.yukiryou.icu

## 项目结构

```
├── worker/          # Cloudflare Worker 后端
├── frontend/        # Vue 3 管理后台前端
└── .github/         # GitHub Actions 工作流
```

## 部署步骤

### 1. 安装依赖

```bash
# Worker 后端
cd worker && npm install

# 前端
cd frontend && npm install
```

### 2. 配置 Cloudflare D1 数据库

```bash
# 登录 Cloudflare
npx wrangler login

# 创建数据库
npx wrangler d1 create url-shortener-db

# 更新 worker/wrangler.toml 中的 database_id

# 执行数据库迁移
npx wrangler d1 execute url-shortener-db --file=./worker/schema.sql
```

### 3. 配置 GitHub Secrets

在 GitHub 仓库 Settings → Secrets and variables → Actions 中添加：

| Secret | 说明 |
|--------|------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token (Worker 编辑权限) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 账户 ID |
| `EDGEONE_API_TOKEN` | EdgeOne API Token |

### 4. 本地开发

```bash
# Worker 开发
cd worker && npm run dev

# 前端开发
cd frontend && npm run dev
```

### 5. 部署

推送到 `main` 分支会自动触发 GitHub Actions 部署

## 环境变量

Worker 需要配置以下环境变量:

- `ADMIN_USERNAME`: 管理员用户名
- `ADMIN_PASSWORD`: 管理员密码
- `JWT_SECRET`: JWT 签名密钥

可通过 Cloudflare Dashboard 或 wrangler 配置:

```bash
npx wrangler secret put ADMIN_USERNAME
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put JWT_SECRET
```
