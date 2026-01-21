/**
 * 短码生成器
 * 使用 Web Crypto API 生成随机短码
 */

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const CODE_LENGTH = 6;

export function generateCode(length: number = CODE_LENGTH): string {
    const randomBytes = new Uint8Array(length);
    crypto.getRandomValues(randomBytes);

    let code = '';
    for (let i = 0; i < length; i++) {
        code += ALPHABET[randomBytes[i] % ALPHABET.length];
    }

    return code;
}
