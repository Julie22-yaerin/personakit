/**
 * Input sanitization utilities.
 * Prevents XSS, injection, and other input-based attacks.
 */

/**
 * Sanitize a string for safe display in HTML.
 * Escapes all HTML special characters.
 */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * Sanitize a string for use in a URL.
 * Encodes special characters.
 */
export function sanitizeUrl(input: string): string {
  try {
    const url = new URL(input);
    // Only allow safe protocols
    if (!["http:", "https:", "mailto:"].includes(url.protocol)) {
      return "";
    }
    return url.toString();
  } catch {
    return "";
  }
}

/**
 * Strip any null bytes from input (common injection vector).
 */
export function stripNullBytes(input: string): string {
  return input.replace(/\0/g, "");
}

/**
 * Sanitize a filename for safe storage.
 * Removes path traversal characters and dangerous extensions.
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")  // Only allow safe chars
    .replace(/\.{2,}/g, ".")            // No double dots
    .replace(/^\.+/, "")                // No leading dots
    .slice(0, 255);                     // Max length
}

/**
 * Validate that a string doesn't contain SQL injection patterns.
 * This is a defense-in-depth check — always use parameterized queries.
 */
export function detectSqlInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|FETCH|DECLARE|TRUNCATE)\b)/i,
    /(--|;|\/\*|\*\/|xp_|sp_)/i,
    /('|\")(\s)*(OR|AND)(\s)*(\'|\")/i,
    /CHAR\(|CONCAT\(/i,
  ];
  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Sanitize user input for LLM prompts.
 * Prevents prompt injection attacks.
 */
export function sanitizeForPrompt(input: string): string {
  return input
    .replace(/[<>]/g, "")  // Remove angle brackets
    .replace(/\n{3,}/g, "\n\n")  // Limit newlines
    .trim()
    .slice(0, 10000);  // Max length
}

/**
 * Validate and sanitize an object's string values.
 * Returns a new object with sanitized values.
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  sanitizer: (value: string) => string = escapeHtml,
): T {
  const result = { ...obj };
  for (const [key, value] of Object.entries(result)) {
    if (typeof value === "string") {
      (result as any)[key] = sanitizer(value);
    }
  }
  return result;
}
