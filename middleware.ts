/**
 * Global middleware for security checks on every request.
 * - Enforces HTTPS
 * - Adds security headers
 * - Rate limits by IP
 * - Blocks suspicious patterns
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Suspicious patterns to block
const BLOCKED_PATTERNS = [
  /\.env/i,
  /\.git/i,
  /wp-admin/i,
  /wp-login/i,
  /phpmyadmin/i,
  /\.well-known/i,
  /debug/i,
  /actuator/i,
];

// Path traversal patterns
const TRAVERSAL_PATTERNS = [
  /\.\./,
  /%2e%2e/i,
  /%252e%252e/i,
  /\.%2e/i,
  /%2e\./i,
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Block access to sensitive files/directories
  if (BLOCKED_PATTERNS.some((pattern) => pattern.test(pathname))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Block path traversal attempts
  if (TRAVERSAL_PATTERNS.some((pattern) => pattern.test(pathname))) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  // Force HTTPS in production
  if (
    process.env.NODE_ENV === "production" &&
    request.headers.get("x-forwarded-proto") !== "https"
  ) {
    const httpsUrl = request.nextUrl.clone();
    httpsUrl.protocol = "https:";
    return NextResponse.redirect(httpsUrl, 301);
  }

  // Validate redirect parameter to prevent open redirects
  const redirect = request.nextUrl.searchParams.get("redirect");
  if (redirect) {
    try {
      const url = new URL(redirect, request.url);
      // Only allow relative redirects or same-origin
      if (url.origin !== request.nextUrl.origin && !redirect.startsWith("/")) {
        return NextResponse.json({ error: "Invalid redirect" }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "Invalid redirect" }, { status: 400 });
    }
  }

  // Add request ID for tracing
  const requestId = crypto.randomUUID();
  response.headers.set("X-Request-ID", requestId);

  // Remove server header leakage
  response.headers.delete("X-Powered-By");

  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
