type RateLimitOptions = {
  blockMs: number;
  maxAttempts: number;
  windowMs: number;
};

type RateLimitBucket = {
  blockedUntil: number;
  timestamps: number[];
};

const globalForRateLimit = globalThis as typeof globalThis & {
  __csnRateLimitStore?: Map<string, RateLimitBucket>;
};

function getRateLimitStore() {
  if (!globalForRateLimit.__csnRateLimitStore) {
    globalForRateLimit.__csnRateLimitStore = new Map();
  }

  return globalForRateLimit.__csnRateLimitStore;
}

function getBucketKey(scope: string, key: string) {
  return `${scope}:${key}`;
}

export function consumeRateLimit(scope: string, key: string, options: RateLimitOptions) {
  const store = getRateLimitStore();
  const bucketKey = getBucketKey(scope, key);
  const now = Date.now();
  const bucket = store.get(bucketKey) ?? {
    blockedUntil: 0,
    timestamps: [],
  };

  bucket.timestamps = bucket.timestamps.filter((timestamp) => now - timestamp < options.windowMs);

  if (bucket.blockedUntil > now) {
    store.set(bucketKey, bucket);
    return {
      allowed: false,
      retryAfterMs: bucket.blockedUntil - now,
    };
  }

  bucket.timestamps.push(now);

  if (bucket.timestamps.length > options.maxAttempts) {
    bucket.blockedUntil = now + options.blockMs;
    store.set(bucketKey, bucket);
    return {
      allowed: false,
      retryAfterMs: options.blockMs,
    };
  }

  store.set(bucketKey, bucket);
  return {
    allowed: true,
    retryAfterMs: 0,
  };
}

export function resetRateLimit(scope: string, key: string) {
  getRateLimitStore().delete(getBucketKey(scope, key));
}
