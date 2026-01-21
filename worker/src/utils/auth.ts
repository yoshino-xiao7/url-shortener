/**
 * 认证工具函数
 */

import type { Env } from '../index';

interface TokenPayload {
    username: string;
    exp: number;
}

export async function verifyAuth(
    request: Request,
    env: Env
): Promise<{ valid: boolean; username?: string }> {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { valid: false };
    }

    const token = authHeader.substring(7);

    try {
        const payload = await verifyToken(token, env);
        if (payload && payload.exp > Date.now()) {
            return { valid: true, username: payload.username };
        }
    } catch {
        return { valid: false };
    }

    return { valid: false };
}

export async function createToken(username: string, env: Env): Promise<string> {
    const payload: TokenPayload = {
        username,
        exp: Date.now() + 24 * 60 * 60 * 1000, // 24 小时过期
    };

    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = btoa(JSON.stringify(payload));
    const signature = await sign(`${header}.${body}`, env.JWT_SECRET);

    return `${header}.${body}.${signature}`;
}

async function verifyToken(token: string, env: Env): Promise<TokenPayload | null> {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;
    const expectedSignature = await sign(`${header}.${body}`, env.JWT_SECRET);

    if (signature !== expectedSignature) return null;

    try {
        return JSON.parse(atob(body)) as TokenPayload;
    } catch {
        return null;
    }
}

async function sign(data: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(data)
    );

    return btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

// 密码哈希（用于将来扩展多用户支持）
export async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    const newHash = await hashPassword(password);
    return newHash === hash;
}
