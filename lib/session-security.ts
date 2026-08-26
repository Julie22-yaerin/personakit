/**
 * Session security utilities.
 * Provides secure session management practices.
 */

/**
 * Generate a cryptographically secure random token.
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Hash a token for secure storage.
 * Uses SHA-256 for one-way hashing.
 */
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Compare two tokens in a timing-safe manner.
 * Prevents timing attacks.
 */
export function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Validate session expiration.
 */
export function isSessionExpired(
  createdAt: number,
  maxAgeMs: number = 24 * 60 * 60 * 1000, // 24 hours
): boolean {
  return Date.now() - createdAt > maxAgeMs;
}

/**
 * Generate a session fingerprint for additional security.
 * Based on user agent and other headers (not IP, which can change).
 */
export function generateSessionFingerprint(request: Request): string {
  const components = [
    request.headers.get("user-agent") || "",
    request.headers.get("accept-language") || "",
    request.headers.get("accept-encoding") || "",
  ];
  return components.join("|");
}

/**
 * Validate that a session fingerprint matches.
 */
export function validateSessionFingerprint(
  current: Request,
  stored: string,
): boolean {
  const currentFingerprint = generateSessionFingerprint(current);
  return timingSafeCompare(currentFingerprint, stored);
}
