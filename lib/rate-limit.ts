interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<number, RateLimitEntry>();

export function checkRateLimit(apiKeyId: number): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
} {
  const now = Date.now();

  // Special handling for env-based API key (ID = 0) - more lenient limits for development
  const isEnvKey = apiKeyId === 0;
  const limit = isEnvKey ? 1000 : 100; // 10x higher limit for env key
  const windowMs = 60 * 60 * 1000; // 1 hour

  const entry = rateLimitMap.get(apiKeyId);

  if (!entry || now > entry.resetAt) {
    // New window
    const resetTime = now + windowMs;
    rateLimitMap.set(apiKeyId, { count: 1, resetAt: resetTime });
    return { allowed: true, remaining: limit - 1, resetTime, limit };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetTime: entry.resetAt, limit };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count, resetTime: entry.resetAt, limit };
}

// Cleanup old entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 60 * 60 * 1000);
