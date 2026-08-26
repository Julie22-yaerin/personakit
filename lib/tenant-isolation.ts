/**
 * Tenant isolation middleware.
 * Ensures users can only access their own data.
 * Each user's data is isolated under their Firebase UID.
 */

import { NextResponse } from "next/server";

/**
 * Validate that a requested resource belongs to the authenticated user.
 * Returns null if valid, or a 403 response if access is denied.
 */
export function validateTenantAccess(
  authenticatedUid: string,
  requestedUid: string,
): NextResponse | null {
  if (authenticatedUid !== requestedUid) {
    console.warn("[security] cross_user_access", {
      authenticated: authenticatedUid,
      requested: requestedUid,
    });
    return NextResponse.json(
      { error: "Access denied." },
      { status: 403 },
    );
  }
  return null;
}

/**
 * Extract user ID from a path like /api/users/{uid}/...
 * Returns null if no user ID found in path.
 */
export function extractUidFromPath(pathname: string): string | null {
  // Match patterns like /api/users/abc123 or /users/abc123/profile
  const match = pathname.match(/\/(?:users|u)\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Middleware-style check for routes that access user-specific resources.
 *
 * @example
 *   const denied = enforceTenantIsolation(request, auth.uid);
 *   if (denied) return denied;
 */
export function enforceTenantIsolation(
  request: Request,
  authenticatedUid: string,
): NextResponse | null {
  const requestedUid = extractUidFromPath(new URL(request.url).pathname);
  if (requestedUid) {
    return validateTenantAccess(authenticatedUid, requestedUid);
  }
  return null;
}
