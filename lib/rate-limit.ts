interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<number, RateLimitEntry>();

export function checkRateLimit(apiKeyId: number): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const limit = 100;
  const windowMs = 60 * 60 * 1000; // 1 hour

  const entry = rateLimitMap.get(apiKeyId);

  if (!entry || now > entry.resetAt) {
    // New window
    const resetAt = now + windowMs;
    rateLimitMap.set(apiKeyId, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
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
