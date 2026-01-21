/**
 * 路由处理器
 */

import type { Env } from './index';
import { handleRedirect } from './handlers/redirect';
import { handleApi } from './handlers/api';
import { corsHeaders, handleCors } from './utils/cors';

export async function handleRequest(
    request: Request,
    env: Env,
    ctx: ExecutionContext
): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
        return handleCors(env);
    }

    try {
        // API 路由 (/api/*)
        if (path.startsWith('/api/')) {
            const response = await handleApi(request, env, path);
            return addCorsHeaders(response, env);
        }

        // 健康检查
        if (path === '/health') {
            return new Response(JSON.stringify({ status: 'ok', time: new Date().toISOString() }), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders(env) },
            });
        }

        // 根路径重定向到前端
        if (path === '/') {
            return Response.redirect('https://dl.yukiryou.icu', 302);
        }

        // 短链跳转 (/:code)
        const code = path.slice(1); // 去掉开头的 /
        if (code && !code.includes('/')) {
            return handleRedirect(code, request, env, ctx);
        }

        return new Response('Not Found', { status: 404 });
    } catch (error) {
        console.error('Error:', error);
        return new Response(
            JSON.stringify({ error: 'Internal Server Error' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json', ...corsHeaders(env) },
            }
        );
    }
}

function addCorsHeaders(response: Response, env: Env): Response {
    const newHeaders = new Headers(response.headers);
    const cors = corsHeaders(env);
    Object.entries(cors).forEach(([key, value]) => {
        newHeaders.set(key, value);
    });
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
    });
}
