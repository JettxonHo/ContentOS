import type {
  ArchiveContentPackageRequest,
  AuthLoginRequest,
  AuthSessionResponse,
  ContentPackageListResponse,
  ContentPackageResponse,
  CreateContentPackageRequest,
  UpdateContentPackageRequest,
  WorkflowProjectionResponse,
  WorkflowTimelinePageResponse,
  CreateSourceRequest,
  EditSourceWorkingCopyRequest,
  CreateSourceVersionRequest,
  ApproveSourceVersionRequest,
  SourceListResponse,
  SourceResponse,
  SourceWorkingCopyResponse,
  SourceVersionResponse,
  SourceVersionListResponse,
  SourceVersionDetailResponse,
  SourceApprovalResponse,
  UrlCaptureIntakeCollectionResponse,
  UrlCaptureRequest,
  UrlCaptureRequestResponse,
  ApiErrorCode,
  ResearchResponse,
  GenerateResearchRequest,
  EditResearchWorkingCopyRequest,
  CheckpointResearchRequest,
  ApproveResearchRequest,
  OpinionResponse,
  BlogResponse,
  InterpretOpinionRequest,
  ConfirmOpinionRequest,
  GenerateBlogRequest,
  XiaohongshuResponse,
  XiaohongshuBodyDto,
  EditBlogRequest,
  CheckpointBlogRequest,
  ApproveBlogRequest,
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

  workflow(id: string, signal?: AbortSignal): Promise<WorkflowProjectionResponse> {
    return this.request(`/v1/content-packages/${encodeURIComponent(id)}/workflow`, signal ? { signal } : {});
  }

  listSources(id: string): Promise<SourceListResponse> {
    return this.request(`/v1/content-packages/${encodeURIComponent(id)}/sources?limit=20`);
  }

  getSource(packageId: string, sourceId: string): Promise<SourceResponse> {
    return this.request(`${this.sourcePath(packageId, sourceId)}`);
  }

  getWorkingCopy(packageId: string, sourceId: string): Promise<SourceWorkingCopyResponse> {
    return this.request(`${this.sourcePath(packageId, sourceId)}/working-copy`);
  }

  editWorkingCopy(
    packageId: string,
    sourceId: string,
    input: EditSourceWorkingCopyRequest,
  ): Promise<SourceWorkingCopyResponse> {
    return this.request(`${this.sourcePath(packageId, sourceId)}/working-copy`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  }

  createVersion(
    packageId: string,
    sourceId: string,
    input: CreateSourceVersionRequest,
  ): Promise<SourceVersionResponse> {
    return this.request(`${this.sourcePath(packageId, sourceId)}/versions`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  listVersions(packageId: string, sourceId: string): Promise<SourceVersionListResponse> {
    return this.request(`${this.sourcePath(packageId, sourceId)}/versions`);
  }

  getVersion(packageId: string, sourceId: string, versionId: string): Promise<SourceVersionDetailResponse> {
    return this.request(`${this.sourcePath(packageId, sourceId)}/versions/${encodeURIComponent(versionId)}`);
  }

  approveVersion(
    packageId: string,
    sourceId: string,
    input: ApproveSourceVersionRequest,
  ): Promise<SourceApprovalResponse> {
    return this.request(`${this.sourcePath(packageId, sourceId)}/approval`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  workflowTimeline(packageId: string, after: number): Promise<WorkflowTimelinePageResponse> {
    return this.request(
      `/v1/content-packages/${encodeURIComponent(packageId)}/workflow/events?after=${encodeURIComponent(String(after))}&limit=20`,
    );
  }

  createSource(id: string, input: CreateSourceRequest): Promise<SourceResponse> {
    return this.request(`/v1/content-packages/${encodeURIComponent(id)}/sources`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  uploadSource(id: string, form: FormData): Promise<SourceResponse> {
    return this.request(`/v1/content-packages/${encodeURIComponent(id)}/sources/upload`, {
      method: 'POST',
      body: form,
    });
  }

  submitUrlCapture(id: string, input: UrlCaptureRequest, idempotencyKey: string): Promise<UrlCaptureRequestResponse> {
    return this.request(`/v1/content-packages/${encodeURIComponent(id)}/url-capture-requests`, {
      method: 'POST',
      body: JSON.stringify(input),
      headers: { 'idempotency-key': idempotencyKey },
    });
  }

  listUrlCaptureIntakes(id: string): Promise<UrlCaptureIntakeCollectionResponse> {
    return this.request(`/v1/content-packages/${encodeURIComponent(id)}/url-capture-requests`);
  }

  getResearch(packageId: string): Promise<ResearchResponse> {
    return this.request(`/v1/content-packages/${encodeURIComponent(packageId)}/research`);
  }

  generateResearch(packageId: string, input: GenerateResearchRequest): Promise<ResearchResponse> {
    return this.request(`/v1/content-packages/${encodeURIComponent(packageId)}/research/generations`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  editResearch(packageId: string, input: EditResearchWorkingCopyRequest): Promise<ResearchResponse> {
    return this.request(`/v1/content-packages/${encodeURIComponent(packageId)}/research/working-copy`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  }

  checkpointResearch(packageId: string, input: CheckpointResearchRequest): Promise<ResearchResponse> {
    return this.request(`/v1/content-packages/${encodeURIComponent(packageId)}/research/versions`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  approveResearch(packageId: string, input: ApproveResearchRequest): Promise<ResearchResponse> {
    return this.request(`/v1/content-packages/${encodeURIComponent(packageId)}/research/approval`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  getOpinion(packageId: string): Promise<OpinionResponse> {
    return this.request(`/v1/content-packages/${encodeURIComponent(packageId)}/opinion`);
  }

  interpretOpinion(packageId: string, input: InterpretOpinionRequest): Promise<OpinionResponse> {
    return this.request(`/v1/content-packages/${encodeURIComponent(packageId)}/opinion/interpretation`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  confirmOpinion(packageId: string, input: ConfirmOpinionRequest): Promise<OpinionResponse> {
    return this.request(`/v1/content-packages/${encodeURIComponent(packageId)}/opinion/confirmation`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  getBlog(packageId: string): Promise<BlogResponse> {
    return this.request(`/v1/content-packages/${encodeURIComponent(packageId)}/blog`);
  }

  generateBlog(packageId: string, input: GenerateBlogRequest): Promise<BlogResponse> {
    return this.request(`/v1/content-packages/${encodeURIComponent(packageId)}/blog/generations`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  editBlog(packageId: string, input: EditBlogRequest): Promise<BlogResponse> {
    return this.request(`/v1/content-packages/${encodeURIComponent(packageId)}/blog/working-copy`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  }

  checkpointBlog(packageId: string, input: CheckpointBlogRequest): Promise<BlogResponse> {
    return this.request(`/v1/content-packages/${encodeURIComponent(packageId)}/blog/versions`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  approveBlog(packageId: string, input: ApproveBlogRequest): Promise<BlogResponse> {
    return this.request(`/v1/content-packages/${encodeURIComponent(packageId)}/blog/approval`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async exportBlog(packageId: string): Promise<string> {
    const response = await this.fetcher(
      `${this.origin}/v1/content-packages/${encodeURIComponent(packageId)}/blog/export`,
      { credentials: 'include', headers: { accept: 'text/markdown' } },
    );
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: { code?: ApiErrorCode } } | null;
      throw new WebApiError(response.status, payload?.error?.code ?? 'INTERNAL_ERROR');
    }
    return response.text();
  }

  getXiaohongshu(packageId: string): Promise<XiaohongshuResponse> {
    return this.request(`/v1/content-packages/${encodeURIComponent(packageId)}/xiaohongshu`);
  }
  generateXiaohongshu(packageId: string, input: GenerateBlogRequest): Promise<XiaohongshuResponse> {
    return this.request(`/v1/content-packages/${encodeURIComponent(packageId)}/xiaohongshu/generations`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }
  editXiaohongshu(
    packageId: string,
    input: { readonly expectedRevision: number; readonly body: XiaohongshuBodyDto },
  ): Promise<XiaohongshuResponse> {
    return this.request(`/v1/content-packages/${encodeURIComponent(packageId)}/xiaohongshu/working-copy`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  }
  checkpointXiaohongshu(packageId: string, input: { readonly expectedRevision: number }): Promise<XiaohongshuResponse> {
    return this.request(`/v1/content-packages/${encodeURIComponent(packageId)}/xiaohongshu/versions`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }
  approveXiaohongshu(packageId: string, input: { readonly versionId: string }): Promise<XiaohongshuResponse> {
    return this.request(`/v1/content-packages/${encodeURIComponent(packageId)}/xiaohongshu/approval`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async exportXiaohongshu(packageId: string, kind: 'post' | 'pages'): Promise<string> {
    const response = await this.fetcher(
      `${this.origin}/v1/content-packages/${encodeURIComponent(packageId)}/xiaohongshu/export/${kind}`,
      {
        credentials: 'include',
        headers: { accept: kind === 'post' ? 'text/markdown' : 'application/json' },
      },
    );
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: { code?: ApiErrorCode } } | null;
      throw new WebApiError(response.status, payload?.error?.code ?? 'INTERNAL_ERROR');
    }
    return response.text();
  }

  private sourcePath(packageId: string, sourceId: string): string {
    return `/v1/content-packages/${encodeURIComponent(packageId)}/sources/${encodeURIComponent(sourceId)}`;
  }

  private async request<T>(path: string, init: RequestInit = {}, empty = false): Promise<T> {
    let response: Response;
    try {
      response = await this.fetcher(`${this.origin}${path}`, {
        ...init,
        credentials: 'include',
        headers: {
          accept: 'application/json',
          ...(typeof init.body === 'string' ? { 'content-type': 'application/json' } : {}),
          ...init.headers,
        },
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
