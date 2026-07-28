import { Injectable } from '@nestjs/common';

export interface RateLimitDecision {
  readonly allowed: boolean;
  readonly retryAfterSeconds: number;
}

interface AttemptWindow {
  count: number;
  resetAt: number;
}

@Injectable()
export class LoginAttemptLimiter {
  private readonly attempts = new Map<string, AttemptWindow>();
  private readonly maxAttempts = 10;
  private readonly windowMs = 15 * 60 * 1000;

  check(key: string, now = Date.now()): RateLimitDecision {
    const window = this.attempts.get(key);
    if (!window || window.resetAt <= now) {
      this.attempts.delete(key);
      return { allowed: true, retryAfterSeconds: 0 };
    }
    if (window.count < this.maxAttempts) {
      return { allowed: true, retryAfterSeconds: 0 };
    }
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((window.resetAt - now) / 1000)) };
  }

  recordFailure(key: string, now = Date.now()): void {
    const current = this.attempts.get(key);
    if (!current || current.resetAt <= now) {
      this.attempts.set(key, { count: 1, resetAt: now + this.windowMs });
      return;
    }
    current.count += 1;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}
