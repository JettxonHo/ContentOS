export type UserId = string & { readonly __brand: 'UserId' };
export type SessionId = string & { readonly __brand: 'SessionId' };

export interface UserPrincipal {
  readonly kind: 'user';
  readonly userId: UserId;
}

export interface SessionRecord {
  readonly id: SessionId;
  readonly credentialHash: string;
  readonly ownerUserId: UserId;
  readonly createdAt: Date;
  readonly expiresAt: Date;
  readonly revokedAt: Date | null;
}

export interface SessionRepository {
  insert(session: SessionRecord): Promise<void>;
  findByCredentialHash(credentialHash: string): Promise<SessionRecord | null>;
  revokeByCredentialHash(credentialHash: string, revokedAt: Date): Promise<boolean>;
}

export interface PasswordVerifier {
  verify(password: string): Promise<boolean>;
}

export interface SessionCredentialManager {
  issue(): { readonly rawCredential: string; readonly credentialHash: string };
  hash(rawCredential: string): string;
}

export interface Clock {
  now(): Date;
}

export interface SessionIdGenerator {
  generate(): SessionId;
}

export type AuthenticationErrorCode = 'INVALID_CREDENTIALS' | 'UNAUTHENTICATED';

export class AuthenticationError extends Error {
  constructor(readonly code: AuthenticationErrorCode) {
    super(code);
    this.name = 'AuthenticationError';
  }
}

export interface AuthenticationServiceOptions {
  readonly ownerUserId: UserId;
  readonly sessionTtlMs: number;
}

export interface AuthenticatedSession {
  readonly principal: UserPrincipal;
  readonly rawCredential: string;
  readonly expiresAt: Date;
}

export interface CurrentSession {
  readonly principal: UserPrincipal;
  readonly expiresAt: Date;
}

export class AuthenticationService {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly passwordVerifier: PasswordVerifier,
    private readonly credentials: SessionCredentialManager,
    private readonly clock: Clock,
    private readonly sessionIds: SessionIdGenerator,
    private readonly options: AuthenticationServiceOptions,
  ) {}

  async login(password: string): Promise<AuthenticatedSession> {
    if (!(await this.passwordVerifier.verify(password))) {
      throw new AuthenticationError('INVALID_CREDENTIALS');
    }

    const now = this.clock.now();
    const expiresAt = new Date(now.getTime() + this.options.sessionTtlMs);
    const issued = this.credentials.issue();
    await this.sessions.insert({
      id: this.sessionIds.generate(),
      credentialHash: issued.credentialHash,
      ownerUserId: this.options.ownerUserId,
      createdAt: now,
      expiresAt,
      revokedAt: null,
    });

    return {
      principal: { kind: 'user', userId: this.options.ownerUserId },
      rawCredential: issued.rawCredential,
      expiresAt,
    };
  }

  async authenticate(rawCredential: string | undefined): Promise<CurrentSession> {
    if (!rawCredential) {
      throw new AuthenticationError('UNAUTHENTICATED');
    }

    const session = await this.sessions.findByCredentialHash(this.credentials.hash(rawCredential));
    const now = this.clock.now();
    if (!session || session.revokedAt !== null || session.expiresAt.getTime() <= now.getTime()) {
      throw new AuthenticationError('UNAUTHENTICATED');
    }

    return {
      principal: { kind: 'user', userId: session.ownerUserId },
      expiresAt: session.expiresAt,
    };
  }

  async logout(rawCredential: string): Promise<void> {
    const revoked = await this.sessions.revokeByCredentialHash(this.credentials.hash(rawCredential), this.clock.now());
    if (!revoked) {
      throw new AuthenticationError('UNAUTHENTICATED');
    }
  }
}
