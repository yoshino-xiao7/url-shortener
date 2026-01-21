# 短链服务 URL Shortener

一个基于 Cloudflare Worker + D1 + EdgeOne Pages 的短链服务，支持：

- ✅ 公开创建短链（无需登录，有效期最多30天）
- ✅ 管理员后台（永久链接、统计分析）
- ✅ 访问统计（来源、地区、趋势）
- ✅ 自动部署（GitHub Actions）

## 技术栈

| 组件 | 技术 |
|------|------|
| 后端 | Cloudflare Worker (TypeScript) |
| 数据库 | Cloudflare D1 (SQLite) |
| 前端 | Vue 3 + Vite |
| 前端托管 | EdgeOne Pages |
| 自动部署 | GitHub Actions |

---

## 🚀 快速部署指南

Fork 本仓库后，按以下步骤部署：

### 步骤 1: 配置 Cloudflare

1. **登录 Cloudflare Dashboard**: https://dash.cloudflare.com

2. **创建 D1 数据库**:
   ```bash
   cd worker
   npx wrangler login  # 浏览器授权登录
   npx wrangler d1 create url-shortener-db
   ```
   
   > 记录返回的 `database_id`，类似 `54f2136f-c9ad-418a-a272-xxxx`

3. **修改配置文件** `worker/wrangler.toml`:
   ```toml
   database_id = "你的数据库ID"  # 替换这里
   
   [env.production]
   routes = [
     { pattern = "你的短链域名", custom_domain = true }  # 替换
   ]
   
   [vars]
   CORS_ORIGIN = "https://你的前端域名"  # 替换
   ```

4. **执行数据库迁移**:
   ```bash
   npx wrangler d1 execute url-shortener-db --remote --file=./schema.sql
   ```

5. **设置 Worker 环境变量**:
   ```bash
   npx wrangler secret put ADMIN_USERNAME
   # 输入管理员用户名，按 Enter
   
   npx wrangler secret put ADMIN_PASSWORD  
   # 输入管理员密码，按 Enter
   
   npx wrangler secret put JWT_SECRET
   # 输入随机字符串（如：openssl rand -hex 32 生成）
   ```

6. **手动部署测试**:
   ```bash
   npx wrangler deploy
   ```

### 步骤 2: 修改前端域名配置

1. **修改** `frontend/src/api/index.ts`:
   ```typescript
   const API_BASE_URL = import.meta.env.PROD
     ? 'https://你的短链域名'  // 替换为你的 Worker 域名
     : ''
   ```

2. **修改** `frontend/src/pages/Home.vue`:
   ```typescript
   const API_URL = import.meta.env.PROD ? 'https://你的短链域名' : ''
   ```
   
   以及所有 `ki1.mom` 替换为你的短链域名（全局搜索替换）

### 步骤 3: 配置 GitHub Secrets

进入 GitHub 仓库 → Settings → Secrets and variables → Actions

添加以下 Secrets:

| Secret 名称 | 获取方式 |
|-------------|----------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare → My Profile → API Tokens → Create Token → "Edit Cloudflare Workers" 模板 |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Dashboard 右侧边栏 "Account ID" |

### 步骤 4: 配置 EdgeOne Pages

1. 登录 [EdgeOne Pages](https://edgeone.ai)
2. 创建新项目 → 连接 GitHub 仓库
3. 构建配置:
   - **构建命令**: `npm run build`
   - **输出目录**: `frontend/dist`
4. 添加自定义域名并配置 DNS CNAME

### 步骤 5: 配置短链域名

1. Cloudflare → Workers & Pages → 你的 Worker
2. Settings → Triggers → Custom Domains
3. 添加你的短链域名

---

## 📁 需要修改的文件清单

| 文件 | 需要修改位置 |
|------|-------------|
| `worker/wrangler.toml` | `database_id`、`routes`、`CORS_ORIGIN` |
| `frontend/src/api/index.ts` | `API_BASE_URL` |
| `frontend/src/pages/Home.vue` | `API_URL` 和 `ki1.mom` |
| `frontend/src/pages/*.vue` | 所有 `ki1.mom` 替换为你的域名 |
| `frontend/src/layouts/MainLayout.vue` | Logo 文字（如需修改） |

---

## 🛠 本地开发

```bash
# 后端
cd worker
npm install
npm run dev  # http://localhost:8787

# 前端（新终端）
cd frontend  
npm install
npm run dev  # http://localhost:3000
```

---

## 📌 功能说明

### 公开用户

- 访问首页直接创建短链
- 必须选择有效期（1/3/7/14/30天）
- 无需登录

### 管理员

- 访问 `/login` 登录后台
- 可创建永久链接
- 查看访问统计
- 管理所有链接

---

## 📄 License

MIT
