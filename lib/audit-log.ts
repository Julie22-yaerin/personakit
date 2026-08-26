/**
 * Audit logging for data access and modifications.
 * Tracks who did what, when, and from where.
 */

import { logSecurityEvent } from "./security-log";

export type AuditAction =
  | "user.login"
  | "user.logout"
  | "user.signup"
  | "user.password_change"
  | "user.mfa_enable"
  | "data.read"
  | "data.write"
  | "data.delete"
  | "data.export"
  | "admin.access"
  | "admin.config_change"
  | "api.key_rotate"
  | " billing.change";

interface AuditEntry {
  action: AuditAction;
  uid: string;
  ip?: string;
  userAgent?: string;
  path?: string;
  details?: Record<string, string | number | boolean>;
  timestamp: string;
}

/**
 * Log an audit event. In production, this goes to structured logging
 * for compliance and forensics. In development, it's human-readable.
 */
export function auditLog(
  action: AuditAction,
  uid: string,
  request?: Request,
  details?: Record<string, string | number | boolean>,
): void {
  const entry: AuditEntry = {
    action,
    uid,
    timestamp: new Date().toISOString(),
    ...details,
  };

  if (request) {
    entry.ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    entry.userAgent = request.headers.get("user-agent") || "unknown";
    entry.path = new URL(request.url).pathname;
  }

  // Use security event logger for consistency
  logSecurityEvent(action as any, {
    uid: entry.uid,
    ip: entry.ip,
    path: entry.path,
  });
}

/**
 * Middleware-style audit wrapper for API routes.
 * Wraps a handler to automatically log access.
 */
export function withAudit<T extends (...args: any[]) => Promise<any>>(
  action: AuditAction,
  handler: T,
): T {
  return (async (...args: any[]) => {
    const request = args[0] as Request;
    const auth = args[1] as { uid: string } | undefined;

    auditLog(action, auth?.uid || "anonymous", request);

    return handler(...args);
  }) as T;
}
