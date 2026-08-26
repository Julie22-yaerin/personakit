/**
 * Production-safe error handler.
 * Returns generic errors to clients while logging details server-side.
 */

import { NextResponse } from "next/server";
import { logSecurityEvent } from "./security-log";

interface SafeErrorOptions {
  /** The actual error (logged server-side only) */
  error: unknown;
  /** User-facing message (never expose internals) */
  userMessage: string;
  /** HTTP status code */
  status?: number;
  /** Additional context for security logging */
  context?: Record<string, string | number>;
}

/**
 * Create a production-safe error response.
 * Never leaks stack traces, file paths, or internal details to clients.
 */
export function createSafeError({
  error,
  userMessage,
  status = 500,
  context = {},
}: SafeErrorOptions): NextResponse {
  // Log full error details server-side only
  const errorDetails = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  logSecurityEvent("request_rejected", {
    ...context,
    errorMessage: errorDetails.slice(0, 200), // Truncate for safety
    status,
  });

  // In development, include more details for debugging
  if (process.env.NODE_ENV !== "production") {
    console.error("[dev] Full error:", error);
  }

  // Never expose internal details to clients
  return NextResponse.json(
    { error: userMessage },
    { status },
  );
}

/**
 * Sanitize Zod validation errors for client consumption.
 * Never exposes the actual schema or internal field paths.
 */
export function safeValidationError(details: unknown): NextResponse {
  return NextResponse.json(
    { error: "Invalid request data." },
    { status: 400 },
  );
}
