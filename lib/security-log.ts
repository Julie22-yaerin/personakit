export type SecurityEventType =
  | "auth_failed"
  | "rate_limited"
  | "request_rejected"
  | "csrf_invalid"
  | "suspicious_input"
  | "privilege_escalation"
  | "token_expired"
  | "invalid_signature"
  | "data_breach_attempt";

interface SecurityEventDetails {
  [key: string]: string | number | boolean | undefined;
  uid?: string;
  ip?: string;
  path?: string;
  userAgent?: string;
}

/**
 * This app has no dedicated SIEM/log-aggregation service — Railway
 * captures stdout and makes it searchable in its own logs UI, so a
 * consistent, greppable line *is* the security event log for now. Every
 * line shares the `[security]` prefix and event type so it can be
 * filtered or alerted on later without changing call sites.
 *
 * In production, this outputs structured JSON for log aggregation tools
 * (Datadog, CloudWatch, etc.) to parse automatically.
 */
export function logSecurityEvent(type: SecurityEventType, details: SecurityEventDetails): void {
  const isProd = process.env.NODE_ENV === "production";
  const entry = {
    level: "warn",
    category: "security",
    type,
    timestamp: new Date().toISOString(),
    ...details,
  };

  if (isProd) {
    // Structured JSON for log aggregation
    console.warn(JSON.stringify(entry));
  } else {
    // Human-readable for local development
    console.warn(`[security] ${type}`, details);
  }
}

/**
 * Extract request metadata for security logging.
 */
export function getRequestMeta(request: Request): { ip: string; userAgent: string; path: string } {
  return {
    ip:
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown",
    userAgent: request.headers.get("user-agent") || "unknown",
    path: new URL(request.url).pathname,
  };
}
