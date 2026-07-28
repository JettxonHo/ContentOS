import { createRequire } from 'node:module';

import { describe, expect, it, vi } from 'vitest';

interface RouteMatch {
  handler: unknown;
  params: Record<string, string>;
}

interface Router {
  find(method: string, path: string): RouteMatch | null;
  lookup(request: { headers: Record<string, string>; method: string; url: string }, response: object): void;
  on(method: string, path: string, handler: () => void): void;
}

type RouterFactory = (options?: { defaultRoute?: (request: { method: string }) => void }) => Router;

const requireFromApi = createRequire(new URL('../../../../apps/api/package.json', import.meta.url));
const requireFromNestPlatformFastify = createRequire(requireFromApi.resolve('@nestjs/platform-fastify/package.json'));

describe('Nest/Fastify transitive dependency compatibility', () => {
  it('uses find-my-way 9.7.0 from the Nest platform-fastify context and preserves safe routing behavior', () => {
    const packageInfo = requireFromNestPlatformFastify('find-my-way/package.json') as { version: string };
    const findMyWay = requireFromNestPlatformFastify('find-my-way') as RouterFactory;

    expect(packageInfo.version).toBe('9.7.0');
    expect(requireFromNestPlatformFastify.resolve('find-my-way/package.json')).toContain(
      '/node_modules/find-my-way/package.json',
    );

    const defaultRoute = vi.fn();
    const router = findMyWay({ defaultRoute });
    const staticHandler = vi.fn();
    const parameterHandler = vi.fn();

    router.on('GET', '/static', staticHandler);
    router.on('GET', '/articles/:articleId', parameterHandler);

    expect(router.find('GET', '/static')?.handler).toBe(staticHandler);
    expect(router.find('GET', '/articles/42')).toMatchObject({
      handler: parameterHandler,
      params: { articleId: '42' },
    });
    expect(router.find('GET', '/not-found')).toBeNull();

    for (const method of ['constructor', 'toString', '__proto__']) {
      expect(() => router.lookup({ headers: {}, method, url: '/static' }, {})).not.toThrow();
      expect(router.find(method, '/static')).toBeNull();
    }

    expect(defaultRoute).toHaveBeenCalledTimes(3);
    expect(defaultRoute.mock.calls.map(([request]) => request.method)).toEqual([
      'constructor',
      'toString',
      '__proto__',
    ]);
    expect(staticHandler).not.toHaveBeenCalled();
    expect(parameterHandler).not.toHaveBeenCalled();
  });
});
