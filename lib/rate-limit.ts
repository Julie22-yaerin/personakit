import { NextResponse } from "next/server";
import { logSecurityEvent } from "./security-log";

/**
 * In-memory sliding-window limiter, keyed per authenticated uid. This is
 * a real, working mitigation for this app's actual deployment (a single
 * Railway instance), not a no-op — but it's honest to say what it isn't:
 * it resets on every process restart/redeploy, and if this app is ever
 * scaled to multiple instances (or moved to a serverless platform that
 * spins up separate processes per request), each instance keeps its own
 * counters, so the effective limit multiplies by instance count. A
 * proper fix at that point is a shared store (e.g. Upstash Redis), which
 * needs new infrastructure this app doesn't have configured today.
 */
interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60_000;
const DEFAULT_LIMIT = 20;

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count++;
  return true;
}

// Best-effort cleanup so `buckets` doesn't grow forever across a long-running process.
let cleanupTimer: ReturnType<typeof setInterval> | null = null;
function ensureCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (now >= bucket.resetAt) buckets.delete(key);
    }
  }, WINDOW_MS);
  cleanupTimer.unref?.();
}

/** Returns a ready-to-return 429 response when the caller is over budget, or null when they can proceed. */
export function enforceRateLimit(
  uid: string,
  routeName: string,
  limit = DEFAULT_LIMIT,
  windowMs = WINDOW_MS,
): NextResponse | null {
  ensureCleanup();
  const allowed = checkRateLimit(`${routeName}:${uid}`, limit, windowMs);
  if (!allowed) {
    logSecurityEvent("rate_limited", { uid, route: routeName });
    return NextResponse.json(
      { error: "Too many requests — slow down and try again in a minute." },
      { status: 429 },
    );
  }
  return null;
}
