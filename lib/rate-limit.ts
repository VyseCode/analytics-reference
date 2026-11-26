type Bucket = { count: number; resetAt: number };

declare global {
  var pulseRateBuckets: Map<string, Bucket> | undefined;
}

const buckets: Map<string, Bucket> =
  global.pulseRateBuckets ?? new Map<string, Bucket>();

if (!global.pulseRateBuckets) {
  global.pulseRateBuckets = buckets;
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
};

export function rateLimit(key: string): RateLimitResult {
  const max = Number(process.env.RATE_LIMIT_MAX ?? 120);
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
  const now = Date.now();

  if (buckets.size > 5000) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt < now) buckets.delete(bucketKey);
    }
  }

  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: Math.max(0, max - 1), retryAfter: 0 };
  }

  if (bucket.count >= max) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, max - bucket.count),
    retryAfter: 0,
  };
}

export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}
