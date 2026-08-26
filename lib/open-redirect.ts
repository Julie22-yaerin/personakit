/**
 * Open redirect protection.
 * Validates redirect URLs to prevent phishing attacks.
 */

const ALLOWED_REDIRECT_HOSTS = [
  "personakit.app",
  "thelyceum.site",
  "localhost",
];

/**
 * Validate that a redirect URL is safe (not an open redirect).
 *
 * @param url - The redirect URL to validate
 * @param baseUrl - The application's base URL
 * @returns Whether the redirect is safe
 */
export function isSafeRedirect(url: string, baseUrl?: string): boolean {
  try {
    // Relative URLs are safe
    if (url.startsWith("/") && !url.startsWith("//")) {
      return true;
    }

    const parsed = new URL(url, baseUrl || "https://thelyceum.site");

    // Must be same protocol
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return false;
    }

    // Check against allowed hosts
    const hostname = parsed.hostname.toLowerCase();
    return ALLOWED_REDIRECT_HOSTS.some(
      (h) => hostname === h || hostname.endsWith(`.${h}`),
    );
  } catch {
    // Invalid URL
    return false;
  }
}

/**
 * Sanitize a redirect URL for safe use.
 * Returns the URL if safe, or null if it should be rejected.
 */
export function sanitizeRedirect(url: string): string | null {
  if (isSafeRedirect(url)) {
    return url;
  }
  return null;
}

/**
 * Get a safe redirect URL from user input.
 * Falls back to "/" if the URL is not safe.
 */
export function getSafeRedirectUrl(url: string | null, fallback: string = "/"): string {
  if (!url) return fallback;
  return sanitizeRedirect(url) || fallback;
}
