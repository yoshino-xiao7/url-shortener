/**
 * API 处理器
 */

import type { Env } from '../index';
import { verifyAuth, createToken, hashPassword, verifyPassword } from '../utils/auth';
import { generateCode } from '../utils/nanoid';

interface Link {
    id: number;
    code: string;
    original_url: string;
    title: string | null;
    created_at: string;
    expires_at: string | null;
    is_active: number;
}

interface CreateLinkBody {
    url: string;
    code?: string;
    title?: string;
    expires_at?: string;
}

interface UpdateLinkBody {
    url?: string;
    title?: string;
    expires_at?: string | null;
    is_active?: boolean;
}

export async function handleApi(
    request: Request,
    env: Env,
    path: string
): Promise<Response> {
    const method = request.method;

    // 登录接口 - 不需要认证
    if (path === '/api/login' && method === 'POST') {
        return handleLogin(request, env);
    }

    // 其他 API 需要认证
    const authResult = await verifyAuth(request, env);
    if (!authResult.valid) {
        return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    // 路由分发
    if (path === '/api/links') {
        if (method === 'GET') return getLinks(request, env);
        if (method === 'POST') return createLink(request, env);
    }

    if (path.startsWith('/api/links/')) {
        const code = path.replace('/api/links/', '');
        if (method === 'GET') return getLink(code, env);
        if (method === 'PUT') return updateLink(code, request, env);
        if (method === 'DELETE') return deleteLink(code, env);
    }

    if (path.startsWith('/api/stats/')) {
        const segment = path.replace('/api/stats/', '');
        if (segment === 'overview' && method === 'GET') {
            return getStatsOverview(env);
        }
        if (method === 'GET') {
            return getStats(segment, request, env);
        }
    }

    return jsonResponse({ error: 'Not Found' }, 404);
}

// ===== 认证 =====

async function handleLogin(request: Request, env: Env): Promise<Response> {
    try {
        const body = await request.json<{ username: string; password: string }>();

        if (body.username === env.ADMIN_USERNAME && body.password === env.ADMIN_PASSWORD) {
            const token = await createToken(body.username, env);
            return jsonResponse({ token, username: body.username });
        }

        return jsonResponse({ error: 'Invalid credentials' }, 401);
    } catch {
        return jsonResponse({ error: 'Invalid request body' }, 400);
    }
}

// ===== 链接管理 =====

async function getLinks(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const search = url.searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM links';
    let countQuery = 'SELECT COUNT(*) as total FROM links';
    const params: (string | number)[] = [];

    if (search) {
        query += ' WHERE code LIKE ? OR original_url LIKE ? OR title LIKE ?';
        countQuery += ' WHERE code LIKE ? OR original_url LIKE ? OR title LIKE ?';
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

    // 获取总数
    const countResult = await env.DB.prepare(countQuery)
        .bind(...params)
        .first<{ total: number }>();
    const total = countResult?.total || 0;

    // 获取列表
    const links = await env.DB.prepare(query)
        .bind(...params, limit, offset)
        .all<Link>();

    return jsonResponse({
        data: links.results,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    });
}

async function getLink(code: string, env: Env): Promise<Response> {
    const link = await env.DB.prepare('SELECT * FROM links WHERE code = ?')
        .bind(code)
        .first<Link>();

    if (!link) {
        return jsonResponse({ error: 'Link not found' }, 404);
    }

    return jsonResponse(link);
}

async function createLink(request: Request, env: Env): Promise<Response> {
    try {
        const body = await request.json<CreateLinkBody>();

        if (!body.url) {
            return jsonResponse({ error: 'URL is required' }, 400);
        }

        // 验证 URL 格式
        try {
            new URL(body.url);
        } catch {
            return jsonResponse({ error: 'Invalid URL format' }, 400);
        }

        // 生成或使用自定义短码
        let code = body.code || generateCode();

        // 如果是自定义短码，检查是否已存在
        if (body.code) {
            const existing = await env.DB.prepare('SELECT id FROM links WHERE code = ?')
                .bind(code)
                .first();
            if (existing) {
                return jsonResponse({ error: 'Code already exists' }, 409);
            }
        } else {
            // 自动生成的短码，确保唯一性
            let attempts = 0;
            while (attempts < 5) {
                const existing = await env.DB.prepare('SELECT id FROM links WHERE code = ?')
                    .bind(code)
                    .first();
                if (!existing) break;
                code = generateCode();
                attempts++;
            }
        }

        await env.DB.prepare(
            'INSERT INTO links (code, original_url, title, expires_at) VALUES (?, ?, ?, ?)'
        )
            .bind(code, body.url, body.title || null, body.expires_at || null)
            .run();

        const newLink = await env.DB.prepare('SELECT * FROM links WHERE code = ?')
            .bind(code)
            .first<Link>();

        return jsonResponse(newLink, 201);
    } catch (error) {
        console.error('Create link error:', error);
        return jsonResponse({ error: 'Failed to create link' }, 500);
    }
}

async function updateLink(code: string, request: Request, env: Env): Promise<Response> {
    try {
        const body = await request.json<UpdateLinkBody>();

        const existing = await env.DB.prepare('SELECT id FROM links WHERE code = ?')
            .bind(code)
            .first();

        if (!existing) {
            return jsonResponse({ error: 'Link not found' }, 404);
        }

        const updates: string[] = [];
        const params: (string | number | null)[] = [];

        if (body.url !== undefined) {
            try {
                new URL(body.url);
            } catch {
                return jsonResponse({ error: 'Invalid URL format' }, 400);
            }
            updates.push('original_url = ?');
            params.push(body.url);
        }

        if (body.title !== undefined) {
            updates.push('title = ?');
            params.push(body.title);
        }

        if (body.expires_at !== undefined) {
            updates.push('expires_at = ?');
            params.push(body.expires_at);
        }

        if (body.is_active !== undefined) {
            updates.push('is_active = ?');
            params.push(body.is_active ? 1 : 0);
        }

        if (updates.length === 0) {
            return jsonResponse({ error: 'No fields to update' }, 400);
        }

        params.push(code);
        await env.DB.prepare(`UPDATE links SET ${updates.join(', ')} WHERE code = ?`)
            .bind(...params)
            .run();

        const updatedLink = await env.DB.prepare('SELECT * FROM links WHERE code = ?')
            .bind(code)
            .first<Link>();

        return jsonResponse(updatedLink);
    } catch (error) {
        console.error('Update link error:', error);
        return jsonResponse({ error: 'Failed to update link' }, 500);
    }
}

async function deleteLink(code: string, env: Env): Promise<Response> {
    const existing = await env.DB.prepare('SELECT id FROM links WHERE code = ?')
        .bind(code)
        .first();

    if (!existing) {
        return jsonResponse({ error: 'Link not found' }, 404);
    }

    await env.DB.prepare('DELETE FROM links WHERE code = ?').bind(code).run();

    return jsonResponse({ message: 'Link deleted successfully' });
}

// ===== 统计 =====

async function getStatsOverview(env: Env): Promise<Response> {
    const [linksCount, visitsCount, todayVisits, recentLinks] = await Promise.all([
        env.DB.prepare('SELECT COUNT(*) as count FROM links').first<{ count: number }>(),
        env.DB.prepare('SELECT COUNT(*) as count FROM visits').first<{ count: number }>(),
        env.DB.prepare(
            "SELECT COUNT(*) as count FROM visits WHERE date(visited_at) = date('now')"
        ).first<{ count: number }>(),
        env.DB.prepare('SELECT * FROM links ORDER BY created_at DESC LIMIT 5').all<Link>(),
    ]);

    return jsonResponse({
        totalLinks: linksCount?.count || 0,
        totalVisits: visitsCount?.count || 0,
        todayVisits: todayVisits?.count || 0,
        recentLinks: recentLinks.results,
    });
}

async function getStats(code: string, request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '7');

    const link = await env.DB.prepare('SELECT id, code, original_url, title FROM links WHERE code = ?')
        .bind(code)
        .first<{ id: number; code: string; original_url: string; title: string | null }>();

    if (!link) {
        return jsonResponse({ error: 'Link not found' }, 404);
    }

    // 获取访问统计
    const [totalVisits, visitsByDay, topReferers, topCountries] = await Promise.all([
        env.DB.prepare('SELECT COUNT(*) as count FROM visits WHERE link_id = ?')
            .bind(link.id)
            .first<{ count: number }>(),
        env.DB.prepare(
            `SELECT date(visited_at) as date, COUNT(*) as count 
       FROM visits 
       WHERE link_id = ? AND visited_at >= datetime('now', '-' || ? || ' days')
       GROUP BY date(visited_at)
       ORDER BY date DESC`
        )
            .bind(link.id, days)
            .all<{ date: string; count: number }>(),
        env.DB.prepare(
            `SELECT referer, COUNT(*) as count 
       FROM visits 
       WHERE link_id = ? AND referer != ''
       GROUP BY referer
       ORDER BY count DESC
       LIMIT 10`
        )
            .bind(link.id)
            .all<{ referer: string; count: number }>(),
        env.DB.prepare(
            `SELECT country, COUNT(*) as count 
       FROM visits 
       WHERE link_id = ? AND country != ''
       GROUP BY country
       ORDER BY count DESC
       LIMIT 10`
        )
            .bind(link.id)
            .all<{ country: string; count: number }>(),
    ]);

    return jsonResponse({
        link,
        totalVisits: totalVisits?.count || 0,
        visitsByDay: visitsByDay.results,
        topReferers: topReferers.results,
        topCountries: topCountries.results,
    });
}

// ===== 工具函数 =====

function jsonResponse(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}
