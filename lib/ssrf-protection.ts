/**
 * SSRF (Server-Side Request Forgery) protection.
 * Validates URLs before making requests to prevent internal network access.
 */

import { logSecurityEvent } from "./security-log";

// Blocked IP ranges (internal/private networks)
const BLOCKED_IP_PATTERNS = [
  /^127\./,           // localhost
  /^10\./,            // private class A
  /^172\.(1[6-9]|2\d|3[01])\./,  // private class B
  /^192\.168\./,      // private class C
  /^169\.254\./,      // link-local
  /^::1$/,            // IPv6 localhost
  /^fc00:/,           // IPv6 private
  /^fe80:/,           // IPv6 link-local
  /^0\./,             // "this" network
];

// Blocked hostnames
const BLOCKED_HOSTNAMES = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "metadata.google.internal",  // GCP metadata
  "169.254.169.254",           // AWS/GCP metadata
];

// Allowed domains for this app's AI providers
const ALLOWED_HOSTS = [
  "openrouter.ai",
  "integrate.api.nvidia.com",
  "dashscope-intl.aliyuncs.com",
  "generativelanguage.googleapis.com",
  "www.googleapis.com",
  "securetoken.google.com",
  "identitytoolkit.googleapis.com",
  "firestore.googleapis.com",
];

export interface SsrfCheckResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Validate a URL for SSRF safety.
 * Returns whether the URL is safe to fetch.
 */
export function validateUrlForFetch(urlString: string): SsrfCheckResult {
  try {
    const url = new URL(urlString);

    // Only allow HTTPS
    if (url.protocol !== "https:") {
      return { allowed: false, reason: "Only HTTPS URLs are allowed." };
    }

    // Check blocked hostnames
    const hostname = url.hostname.toLowerCase();
    if (BLOCKED_HOSTNAMES.includes(hostname)) {
      logSecurityEvent("suspicious_input", { type: "ssrf_blocked", hostname });
      return { allowed: false, reason: "This URL is not allowed." };
    }

    // Check for IP patterns
    for (const pattern of BLOCKED_IP_PATTERNS) {
      if (pattern.test(hostname)) {
        logSecurityEvent("suspicious_input", { type: "ssrf_blocked", hostname });
        return { allowed: false, reason: "This URL is not allowed." };
      }
    }

    // If ALLOWED_HOSTS is set, only allow those
    if (ALLOWED_HOSTS.length > 0) {
      const isAllowed = ALLOWED_HOSTS.some(
        (h) => hostname === h || hostname.endsWith(`.${h}`),
      );
      if (!isAllowed) {
        logSecurityEvent("suspicious_input", { type: "ssrf_not_in_allowlist", hostname });
        return { allowed: false, reason: "This domain is not in the allowlist." };
      }
    }

    return { allowed: true };
  } catch {
    return { allowed: false, reason: "Invalid URL format." };
  }
}

/**
 * Safe fetch wrapper that validates URLs before making requests.
 */
export async function safeFetch(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const check = validateUrlForFetch(url);
  if (!check.allowed) {
    throw new Error(`SSRF blocked: ${check.reason}`);
  }
  return fetch(url, init);
}
