/**
 * CORS (Cross-Origin Resource Sharing) configuration.
 * Provides secure defaults for API routes.
 */

import { NextResponse } from "next/server";

interface CorsConfig {
  origin?: string | string[];
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

const DEFAULT_CONFIG: CorsConfig = {
  origin: [
    "https://thelyceum.site",
    "https://personakit.app",
    "http://localhost:3000",
    "http://localhost:3001",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token", "X-Request-ID"],
  credentials: true,
  maxAge: 86400, // 24 hours
};

/**
 * Apply CORS headers to a response.
 */
export function applyCorsHeaders(
  request: Request,
  response: NextResponse,
  config: CorsConfig = DEFAULT_CONFIG,
): NextResponse {
  const origin = request.headers.get("origin");
  const { methods, allowedHeaders, credentials, maxAge } = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  // Check if origin is allowed
  if (origin && config.origin) {
    const allowedOrigins = Array.isArray(config.origin)
      ? config.origin
      : [config.origin];

    if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
      response.headers.set("Access-Control-Allow-Origin", origin);
    }
  }

  if (methods) {
    response.headers.set("Access-Control-Allow-Methods", methods.join(", "));
  }

  if (allowedHeaders) {
    response.headers.set("Access-Control-Allow-Headers", allowedHeaders.join(", "));
  }

  if (credentials) {
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }

  if (maxAge) {
    response.headers.set("Access-Control-Max-Age", String(maxAge));
  }

  return response;
}

/**
 * Handle CORS preflight requests.
 */
export function handleCorsPreflight(request: Request): NextResponse | null {
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    return applyCorsHeaders(request, response);
  }
  return null;
}
