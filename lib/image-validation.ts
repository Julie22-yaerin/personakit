import { z } from "zod";

// Every image this app ever sends here comes from a client-side
// canvas.toDataURL("image/jpeg", ...) capture (face scan, live coaching
// frame, visual-scene frame) — never an arbitrary upload. Whitelisting
// the three real raster formats (no image/svg+xml, which can carry
// script content) matches actual usage and closes off a format nothing
// in this app legitimately produces.
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

// ~4.4MB decoded (base64 is ~1.37x raw size) — generous for a compressed
// frame capture, well below anything a legitimate client-side capture at
// this app's canvas sizes (maxDim 480-640px) would ever produce.
const MAX_DATA_URL_LENGTH = 6_000_000;

/**
 * Checked before the request body is even parsed, so an oversized payload
 * gets rejected without first being fully buffered into memory — the
 * Zod .max() below only catches it after that buffering has already
 * happened.
 */
export function contentLengthExceeds(request: Request, maxBytes: number): boolean {
  const header = request.headers.get("content-length");
  if (!header) return false;
  const length = Number(header);
  return Number.isFinite(length) && length > maxBytes;
}

export const MAX_IMAGE_REQUEST_BYTES = 8_000_000;

export const ImageDataUrlSchema = z
  .string()
  .max(MAX_DATA_URL_LENGTH, "Image is too large.")
  .refine(
    (value) => ALLOWED_IMAGE_TYPES.some((type) => value.startsWith(`data:${type};base64,`)),
    { message: "Image must be a base64-encoded JPEG, PNG, or WebP data URL." },
  );
