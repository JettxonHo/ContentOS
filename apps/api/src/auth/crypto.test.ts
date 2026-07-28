import { describe, expect, it } from 'vitest';

import { createPasswordHash, NodeSessionCredentialManager, ScryptPasswordVerifier } from './crypto.js';

describe('authentication cryptography', () => {
  it('creates a salted scrypt hash and verifies without storing plaintext', async () => {
    const password = 'a-valid-local-password';
    const first = await createPasswordHash(password);
    const second = await createPasswordHash(password);

    expect(first).not.toBe(second);
    expect(first).not.toContain(password);
    await expect(new ScryptPasswordVerifier(first).verify(password)).resolves.toBe(true);
    await expect(new ScryptPasswordVerifier(first).verify('incorrect-password')).resolves.toBe(false);
  });

  it('issues opaque random credentials and stores only deterministic hashes', () => {
    const manager = new NodeSessionCredentialManager();
    const first = manager.issue();
    const second = manager.issue();

    expect(first.rawCredential).not.toBe(second.rawCredential);
    expect(first.credentialHash).toMatch(/^[a-f0-9]{64}$/);
    expect(first.credentialHash).toBe(manager.hash(first.rawCredential));
    expect(first.credentialHash).not.toContain(first.rawCredential);
  });
});
