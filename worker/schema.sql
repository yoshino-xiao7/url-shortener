-- 短链服务数据库 Schema
-- Cloudflare D1 (SQLite)

-- 短链表
CREATE TABLE IF NOT EXISTS links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,           -- 短码 (如: abc123)
    original_url TEXT NOT NULL,          -- 原始 URL
    title TEXT,                          -- 链接标题 (可选)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,                 -- 过期时间 (可选)
    is_active INTEGER DEFAULT 1          -- 是否启用 (1=启用, 0=禁用)
);

-- 访问统计表
CREATE TABLE IF NOT EXISTS visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    link_id INTEGER NOT NULL,
    visited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip TEXT,
    user_agent TEXT,
    referer TEXT,
    country TEXT,
    FOREIGN KEY (link_id) REFERENCES links(id) ON DELETE CASCADE
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_links_code ON links(code);
CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at);
CREATE INDEX IF NOT EXISTS idx_visits_link_id ON visits(link_id);
CREATE INDEX IF NOT EXISTS idx_visits_visited_at ON visits(visited_at);
