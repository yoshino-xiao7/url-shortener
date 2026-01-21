/**
 * 短链跳转处理器
 */

import type { Env } from '../index';

export async function handleRedirect(
    code: string,
    request: Request,
    env: Env,
    ctx: ExecutionContext
): Promise<Response> {
    // 查询短链
    const link = await env.DB.prepare(
        'SELECT id, original_url, is_active, expires_at FROM links WHERE code = ?'
    )
        .bind(code)
        .first<{ id: number; original_url: string; is_active: number; expires_at: string | null }>();

    if (!link) {
        return new Response('Short link not found', { status: 404 });
    }

    // 检查是否启用
    if (!link.is_active) {
        return new Response('This link has been disabled', { status: 410 });
    }

    // 检查是否过期
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
        return new Response('This link has expired', { status: 410 });
    }

    // 异步记录访问统计（不阻塞重定向）
    ctx.waitUntil(recordVisit(link.id, request, env));

    // 301 永久重定向
    return Response.redirect(link.original_url, 301);
}

async function recordVisit(linkId: number, request: Request, env: Env): Promise<void> {
    try {
        const headers = request.headers;
        const ip = headers.get('CF-Connecting-IP') || headers.get('X-Forwarded-For') || '';
        const userAgent = headers.get('User-Agent') || '';
        const referer = headers.get('Referer') || '';
        const country = headers.get('CF-IPCountry') || '';

        await env.DB.prepare(
            'INSERT INTO visits (link_id, ip, user_agent, referer, country) VALUES (?, ?, ?, ?, ?)'
        )
            .bind(linkId, ip, userAgent, referer, country)
            .run();
    } catch (error) {
        console.error('Failed to record visit:', error);
    }
}
