type SecurityEventType = "auth_failed" | "rate_limited" | "request_rejected";

/**
 * This app has no dedicated SIEM/log-aggregation service — Railway
 * captures stdout and makes it searchable in its own logs UI, so a
 * consistent, greppable line *is* the security event log for now. Every
 * line shares the `[security]` prefix and event type so it can be
 * filtered or alerted on later without changing call sites.
 */
export function logSecurityEvent(type: SecurityEventType, details: Record<string, string | number>): void {
  console.warn(`[security] ${type}`, details);
}
