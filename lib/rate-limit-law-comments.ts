/**
 * Rate Limiting for Law Comment Submission
 *
 * Implements dual rate limiting (IP-based and email-based)
 * to prevent abuse while allowing legitimate users to comment.
 *
 * Limits:
 * - IP-based: 5 comments per hour per IP address
 * - Email-based: 10 comments per hour per email address
 *
 * Uses in-memory Map for tracking with automatic cleanup.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number; // Timestamp when limit resets
}

interface RateLimitConfig {
  ipLimit: number; // Max comments per hour per IP
  emailLimit: number; // Max comments per hour per email
  windowMs: number; // Time window in milliseconds
}

interface RateLimitResult {
  allowed: boolean;
  resetAt?: number; // Timestamp when user can try again
  limit?: number; // The limit that was exceeded
  current?: number; // Current count
}

export class CommentRateLimiter {
  private ipRequests: Map<string, RateLimitEntry>;
  private emailRequests: Map<string, RateLimitEntry>;
  private config: RateLimitConfig;

  constructor(config?: Partial<RateLimitConfig>) {
    this.ipRequests = new Map();
    this.emailRequests = new Map();

    this.config = {
      ipLimit: config?.ipLimit ?? 5, // 5 comments per hour per IP
      emailLimit: config?.emailLimit ?? 10, // 10 comments per hour per email
      windowMs: config?.windowMs ?? 60 * 60 * 1000, // 1 hour
    };

    // Cleanup expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Check if comment submission is allowed
   * Returns { allowed: true } or { allowed: false, resetAt, limit, current }
   */
  checkRateLimit(ip: string | null, email: string): RateLimitResult {
    const now = Date.now();

    // Check IP limit first (if IP is available)
    if (ip) {
      const ipResult = this.checkLimit(
        this.ipRequests,
        ip,
        this.config.ipLimit,
        now
      );

      if (!ipResult.allowed) {
        return {
          allowed: false,
          resetAt: ipResult.resetAt,
          limit: this.config.ipLimit,
          current: ipResult.current,
        };
      }
    }

    // Check email limit
    const emailResult = this.checkLimit(
      this.emailRequests,
      email.toLowerCase(),
      this.config.emailLimit,
      now
    );

    if (!emailResult.allowed) {
      return {
        allowed: false,
        resetAt: emailResult.resetAt,
        limit: this.config.emailLimit,
        current: emailResult.current,
      };
    }

    // All checks passed - record the request
    if (ip) {
      this.recordRequest(this.ipRequests, ip, now);
    }
    this.recordRequest(this.emailRequests, email.toLowerCase(), now);

    return { allowed: true };
  }

  /**
   * Check limit for a specific key (IP or email)
   */
  private checkLimit(
    store: Map<string, RateLimitEntry>,
    key: string,
    limit: number,
    now: number
  ): { allowed: boolean; resetAt?: number; current?: number } {
    const entry = store.get(key);

    // No previous requests - allow
    if (!entry) {
      return { allowed: true };
    }

    // Reset window has passed - allow and clear old entry
    if (now >= entry.resetAt) {
      store.delete(key);
      return { allowed: true };
    }

    // Check if limit exceeded
    if (entry.count >= limit) {
      return {
        allowed: false,
        resetAt: entry.resetAt,
        current: entry.count,
      };
    }

    return { allowed: true };
  }

  /**
   * Record a successful request
   */
  private recordRequest(
    store: Map<string, RateLimitEntry>,
    key: string,
    now: number
  ): void {
    const entry = store.get(key);

    if (!entry || now >= entry.resetAt) {
      // Create new entry
      store.set(key, {
        count: 1,
        resetAt: now + this.config.windowMs,
      });
    } else {
      // Increment existing entry
      entry.count++;
      store.set(key, entry);
    }
  }

  /**
   * Clean up expired entries to prevent memory leaks
   */
  private cleanup(): void {
    const now = Date.now();

    // Cleanup IP requests
    const ipEntries = Array.from(this.ipRequests.entries());
    for (const [key, entry] of ipEntries) {
      if (now >= entry.resetAt) {
        this.ipRequests.delete(key);
      }
    }

    // Cleanup email requests
    const emailEntries = Array.from(this.emailRequests.entries());
    for (const [key, entry] of emailEntries) {
      if (now >= entry.resetAt) {
        this.emailRequests.delete(key);
      }
    }
  }

  /**
   * Get current status for debugging (admin only)
   */
  getStatus(): {
    ipTracking: number;
    emailTracking: number;
    config: RateLimitConfig;
  } {
    return {
      ipTracking: this.ipRequests.size,
      emailTracking: this.emailRequests.size,
      config: this.config,
    };
  }

  /**
   * Reset limits for a specific IP or email (admin only)
   */
  resetLimit(type: 'ip' | 'email', key: string): void {
    if (type === 'ip') {
      this.ipRequests.delete(key);
    } else {
      this.emailRequests.delete(key.toLowerCase());
    }
  }

  /**
   * Format Hebrew error message with time remaining
   */
  static formatRateLimitError(resetAt: number, limit: number): string {
    const now = Date.now();
    const remainingMs = resetAt - now;
    const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));

    if (remainingMinutes <= 1) {
      return `חרגת ממספר התגובות המותר (${limit} תגובות לשעה). נסה שוב בעוד דקה.`;
    } else if (remainingMinutes < 60) {
      return `חרגת ממספר התגובות המותר (${limit} תגובות לשעה). נסה שוב בעוד ${remainingMinutes} דקות.`;
    } else {
      const hours = Math.ceil(remainingMinutes / 60);
      return `חרגת ממספר התגובות המותר (${limit} תגובות לשעה). נסה שוב בעוד ${hours} שעות.`;
    }
  }
}

// Singleton instance for global rate limiting
let rateLimiterInstance: CommentRateLimiter | null = null;

/**
 * Get or create the global rate limiter instance
 */
export function getCommentRateLimiter(): CommentRateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new CommentRateLimiter();
  }
  return rateLimiterInstance;
}

/**
 * Reset the global rate limiter (for testing)
 */
export function resetCommentRateLimiter(): void {
  rateLimiterInstance = null;
}
