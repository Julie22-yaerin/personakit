/**
 * Webhook signature verification.
 * Verifies that incoming webhooks are authentic and haven't been tampered with.
 */

import { createHmac, timingSafeEqual } from "crypto";

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

/**
 * Verify a webhook signature using HMAC-SHA256.
 *
 * @param payload - Raw request body
 * @param signature - Signature from request header
 * @param secret - Webhook secret (defaults to env var)
 * @returns Whether the signature is valid
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string = WEBHOOK_SECRET || "",
): boolean {
  if (!secret) {
    console.warn("[security] No webhook secret configured");
    return false;
  }

  // Remove prefix if present (e.g., "sha256=")
  const cleanSignature = signature.replace(/^sha256=/, "");

  // Compute expected signature
  const expectedSignature = createHmac("sha256", secret)
    .update(typeof payload === "string" ? payload : payload.toString())
    .digest("hex");

  // Timing-safe comparison to prevent timing attacks
  try {
    return timingSafeEqual(
      Buffer.from(cleanSignature, "hex"),
      Buffer.from(expectedSignature, "hex"),
    );
  } catch {
    return false;
  }
}

/**
 * Extract and verify webhook signature from request headers.
 *
 * @example
 *   const isValid = verifyWebhookRequest(request, rawBody);
 *   if (!isValid) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
 */
export function verifyWebhookRequest(
  request: Request,
  body: string | Buffer,
  headerName: string = "x-hub-signature-256",
): boolean {
  const signature = request.headers.get(headerName);
  if (!signature) return false;
  return verifyWebhookSignature(body, signature);
}
