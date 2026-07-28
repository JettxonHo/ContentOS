import { randomBytes } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { composeHealth, composePort } from './compose.js';
import { readComposeCredentials, requireState } from './env.js';
import { loopbackReachable } from './process.js';
import { signedFetch } from './sigv4.js';

function isOk(status: number): boolean {
  return status >= 200 && status < 300;
}

describe('object storage smoke', () => {
  it('is healthy, loopback-reachable, honors SigV4 auth, and leaves no probe bucket or object', async () => {
    const state = requireState();

    expect(await composeHealth(state, 'object-storage')).toBe('healthy');

    const portInfo = await composePort(state, 'object-storage', 8333);
    expect(portInfo.stdout.trim()).toMatch(/^127\.0\.0\.1:\d+$/);

    await expect(loopbackReachable(state.ports.objectStorage)).resolves.toBe(true);

    const credentials = readComposeCredentials(state.envFile);
    const accessKeyId = credentials['OBJECT_STORAGE_ACCESS_KEY'];
    const secretAccessKey = credentials['OBJECT_STORAGE_SECRET_KEY'];
    if (!accessKeyId || !secretAccessKey) {
      throw new Error('temporary S3 credentials are not present in the harness env file');
    }
    const creds = { accessKeyId, secretAccessKey };
    const endpoint = `http://127.0.0.1:${state.ports.objectStorage}`;

    // Correct SigV4 signature succeeds.
    const correct = await signedFetch({ method: 'GET', url: `${endpoint}/`, credentials: creds });
    expect(correct.status).toBe(200);

    // A wrong secret is rejected.
    const wrong = await signedFetch({
      method: 'GET',
      url: `${endpoint}/`,
      credentials: { accessKeyId, secretAccessKey: 'invalid-smoke-secret' },
    });
    expect(wrong.status).toBe(403);

    // Anonymous access is rejected.
    const anonymous = await fetch(`${endpoint}/`);
    expect(anonymous.status).toBe(403);

    // Probe bucket + object lifecycle, then prove cleanup.
    const bucket = `cs-smoke-${randomBytes(6).toString('hex')}`;
    const key = 'probe.txt';

    const createBucket = await signedFetch({ method: 'PUT', url: `${endpoint}/${bucket}`, credentials: creds });
    expect(isOk(createBucket.status)).toBe(true);

    const putObject = await signedFetch({
      method: 'PUT',
      url: `${endpoint}/${bucket}/${key}`,
      credentials: creds,
      body: 'smoke',
    });
    expect(isOk(putObject.status)).toBe(true);

    const deleteObject = await signedFetch({
      method: 'DELETE',
      url: `${endpoint}/${bucket}/${key}`,
      credentials: creds,
    });
    expect(isOk(deleteObject.status)).toBe(true);

    const deleteBucket = await signedFetch({ method: 'DELETE', url: `${endpoint}/${bucket}`, credentials: creds });
    expect(isOk(deleteBucket.status)).toBe(true);

    const listing = await signedFetch({ method: 'GET', url: `${endpoint}/`, credentials: creds });
    expect(listing.status).toBe(200);
    expect(await listing.text()).not.toContain(bucket);
  });
});
