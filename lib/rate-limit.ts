/**
 * Simple in-memory rate limiter for API routes.
 * For production, consider Redis-backed rate limiting (e.g., @upstash/ratelimit).
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /** Max requests per window */
  maxRequests: number;
  /** Window duration in milliseconds (default: 60s) */
  windowMs?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check rate limit for a given key (typically IP or user ID).
 * Returns whether the request is allowed and metadata for headers.
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): RateLimitResult {
  const { maxRequests, windowMs = 60_000 } = config;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    // New window
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

/**
 * Extract client IP from request headers.
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Standard rate limit configs for different route types.
 */
export const RATE_LIMITS = {
  /** Strict: auth-related endpoints */
  auth: { maxRequests: 5, windowMs: 60_000 },
  /** Normal: LLM-backed API routes (expensive) */
  api: { maxRequests: 20, windowMs: 60_000 },
  /** Relaxed: read-only endpoints */
  read: { maxRequests: 60, windowMs: 60_000 },
} as const;

/**
 * Enforce rate limit on an API route. Returns a NextResponse if
 * rate limited, or null if allowed. Matches the interface used by
 * existing API routes.
 *
 * @example
 *   const limited = enforceRateLimit(auth.uid, "assistant/research");
 *   if (limited) return limited;
 */
export function enforceRateLimit(
  uid: string,
  route: string,
  maxRequests: number = 30,
  windowMs: number = 60_000,
): import("next/server").NextResponse | null {
  const key = `${uid}:${route}`;
  const result = checkRateLimit(key, { maxRequests, windowMs });

  if (!result.allowed) {
    console.warn(`[security] rate_limited`, { uid, route, resetAt: result.resetAt });
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { NextResponse } = require("next/server") as typeof import("next/server");
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(result.resetAt),
        },
      },
    );
  }

  return null;
}
