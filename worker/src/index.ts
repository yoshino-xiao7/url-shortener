/**
 * Cloudflare Worker 入口文件
 * 短链服务 API + 跳转服务
 */

import { handleRequest } from './router';

export interface Env {
    DB: D1Database;
    ADMIN_USERNAME: string;
    ADMIN_PASSWORD: string;
    JWT_SECRET: string;
    CORS_ORIGIN: string;
}

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        return handleRequest(request, env, ctx);
    },
};
