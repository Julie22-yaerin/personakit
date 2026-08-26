/**
 * CSRF protection for API routes.
 * Uses the Double Submit Cookie pattern — safe for SPAs that use
 * Authorization headers (not cookies) for authentication.
 *
 * Since this app uses Firebase ID tokens in the Authorization header
 * (not cookies), CSRF is already mitigated by same-origin policy on
 * the Authorization header. This adds an extra defense layer.
 */

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const CSRF_SECRET = new TextEncoder().encode(
  process.env.CSRF_SECRET || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "csrf-fallback-secret",
);

const CSRF_COOKIE = "csrf_token";
const CSRF_HEADER = "x-csrf-token";

/**
 * Generate a CSRF token and set it as a cookie.
 */
export async function generateCsrfToken(): Promise<string> {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(CSRF_SECRET);
  return token;
}

/**
 * Verify a CSRF token from request header matches the cookie.
 */
export async function verifyCsrfToken(request: Request): Promise<boolean> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE)?.value;
  const headerToken = request.headers.get(CSRF_HEADER);

  if (!cookieToken || !headerToken) return false;
  if (cookieToken !== headerToken) return false;

  try {
    await jwtVerify(headerToken, CSRF_SECRET);
    return true;
  } catch {
    return false;
  }
}
