import { NextResponse } from "next/server";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { logSecurityEvent } from "./security-log";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

// Firebase ID tokens are standard JWTs signed by Google's securetoken
// service — verifiable against its public JWKS the same way the Admin
// SDK does internally, with no service-account key or new secret needed.
const JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

export interface RequestAuth {
  uid: string;
  email: string | null;
}

async function verifyRequestAuth(request: Request): Promise<RequestAuth | null> {
  if (!PROJECT_ID) return null;
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${PROJECT_ID}`,
      audience: PROJECT_ID,
    });
    if (typeof payload.sub !== "string") return null;
    return { uid: payload.sub, email: typeof payload.email === "string" ? payload.email : null };
  } catch {
    return null;
  }
}

/**
 * Every LLM-backed API route in this app calls this first. Previously
 * none of them checked auth at all — any anonymous caller could hit them
 * directly and spend the app owner's OpenRouter credit. Returns the
 * verified caller on success, or a ready-to-return 401 response on
 * failure — callers do `const auth = await requireAuth(request); if (auth
 * instanceof NextResponse) return auth;`.
 */
export async function requireAuth(request: Request): Promise<RequestAuth | NextResponse> {
  const auth = await verifyRequestAuth(request);
  if (!auth) {
    logSecurityEvent("auth_failed", { path: new URL(request.url).pathname });
    return NextResponse.json({ error: "Sign in and try again." }, { status: 401 });
  }
  return auth;
}
