/**
 * CORS 工具函数
 */

import type { Env } from '../index';

export function corsHeaders(env: Env): Record<string, string> {
    return {
        'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
    };
}

export function handleCors(env: Env): Response {
    return new Response(null, {
        status: 204,
        headers: corsHeaders(env),
    });
}
