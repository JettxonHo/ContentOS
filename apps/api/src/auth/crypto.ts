import { createHash, randomBytes, randomUUID, scrypt as nodeScrypt, timingSafeEqual } from 'node:crypto';

import type { PasswordVerifier, SessionCredentialManager, SessionId, SessionIdGenerator } from '@contentos/core';

const COST = 16_384;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;
const KEY_LENGTH = 32;
const MAX_MEMORY = 64 * 1024 * 1024;
const HASH_PATTERN = /^scrypt\$v=1\$N=16384\$r=8\$p=1\$([A-Za-z0-9_-]{22})\$([A-Za-z0-9_-]{43})$/;

function scrypt(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    nodeScrypt(
      password,
      salt,
      KEY_LENGTH,
      { N: COST, r: BLOCK_SIZE, p: PARALLELIZATION, maxmem: MAX_MEMORY },
      (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(derivedKey);
      },
    );
  });
}

export async function createPasswordHash(password: string): Promise<string> {
  if (password.length < 12 || password.length > 1024) {
    throw new Error('Password must contain between 12 and 1024 characters.');
  }
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt);
  return `scrypt$v=1$N=${COST}$r=${BLOCK_SIZE}$p=${PARALLELIZATION}$${salt.toString('base64url')}$${derived.toString('base64url')}`;
}

export class ScryptPasswordVerifier implements PasswordVerifier {
  constructor(private readonly encodedHash: string) {}

  async verify(password: string): Promise<boolean> {
    const match = HASH_PATTERN.exec(this.encodedHash);
    if (!match || password.length < 1 || password.length > 1024) {
      return false;
    }
    const saltText = match[1];
    const expectedText = match[2];
    if (!saltText || !expectedText) {
      return false;
    }
    const expected = Buffer.from(expectedText, 'base64url');
    const actual = await scrypt(password, Buffer.from(saltText, 'base64url'));
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }
}

export class NodeSessionCredentialManager implements SessionCredentialManager {
  issue(): { readonly rawCredential: string; readonly credentialHash: string } {
    const rawCredential = randomBytes(32).toString('base64url');
    return { rawCredential, credentialHash: this.hash(rawCredential) };
  }

  hash(rawCredential: string): string {
    return createHash('sha256').update(rawCredential, 'utf8').digest('hex');
  }
}

export class UuidSessionIdGenerator implements SessionIdGenerator {
  generate(): SessionId {
    return randomUUID() as SessionId;
  }
}
