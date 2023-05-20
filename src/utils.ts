import { createHash } from 'crypto';

export async function encryptPassword(password: string) {
    return createHash('sha256').update(password).digest('hex');
}