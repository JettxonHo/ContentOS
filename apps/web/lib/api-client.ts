import type {
  ArchiveContentPackageRequest,
  AuthLoginRequest,
  AuthSessionResponse,
  ContentPackageListResponse,
  ContentPackageResponse,
  CreateContentPackageRequest,
  UpdateContentPackageRequest,
  ApiErrorCode,
} from '@contentos/contracts';

type Fetcher = typeof fetch;

export class WebApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode | 'NETWORK_ERROR',
  ) {
    super(code);
    this.name = 'WebApiError';
  }
}

export class ContentOsApiClient {
  constructor(
    private readonly origin: string,
    private readonly fetcher: Fetcher = (input, init) => fetch(input, init),
  ) {}

  login(input: AuthLoginRequest): Promise<AuthSessionResponse> {
    return this.request('/v1/auth/login', { method: 'POST', body: JSON.stringify(input) });
  }

  session(): Promise<AuthSessionResponse> {
    return this.request('/v1/auth/session');
  }

  async logout(): Promise<void> {
    await this.request('/v1/auth/logout', { method: 'POST' }, true);
  }

  list(status: 'active' | 'archived'): Promise<ContentPackageListResponse> {
    return this.request(`/v1/content-packages?status=${status}&limit=50`);
  }

  get(id: string): Promise<ContentPackageResponse> {
    return this.request(`/v1/content-packages/${encodeURIComponent(id)}`);
  }

  create(input: CreateContentPackageRequest): Promise<ContentPackageResponse> {
    return this.request('/v1/content-packages', { method: 'POST', body: JSON.stringify(input) });
  }

  update(id: string, input: UpdateContentPackageRequest): Promise<ContentPackageResponse> {
    return this.request(`/v1/content-packages/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  }

  archive(id: string, input: ArchiveContentPackageRequest): Promise<ContentPackageResponse> {
    return this.request(`/v1/content-packages/${encodeURIComponent(id)}/archive`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  private async request<T>(path: string, init: RequestInit = {}, empty = false): Promise<T> {
    let response: Response;
    try {
      response = await this.fetcher(`${this.origin}${path}`, {
        ...init,
        credentials: 'include',
        headers: { accept: 'application/json', ...(init.body ? { 'content-type': 'application/json' } : {}) },
      });
    } catch {
      throw new WebApiError(0, 'NETWORK_ERROR');
    }
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: { code?: ApiErrorCode } } | null;
      throw new WebApiError(response.status, payload?.error?.code ?? 'INTERNAL_ERROR');
    }
    return (empty ? undefined : await response.json()) as T;
  }
}
