/**
 * Path traversal protection.
 * Prevents directory traversal attacks (e.g., ../../../etc/passwd).
 */

import path from "path";

/**
 * Check if a path contains traversal sequences.
 */
export function hasPathTraversal(input: string): boolean {
  const dangerousPatterns = [
    /\.\./,           // Parent directory
    /\.+/,            // Multiple dots
    /~\/?/,           // Home directory
    /%2e%2e/i,        // URL-encoded ..
    /%252e%252e/i,    // Double URL-encoded ..
    /\.\.%2f/i,       // Mixed encoding
    /\.\.%5c/i,       // Backslash variant
  ];

  return dangerousPatterns.some((pattern) => pattern.test(input));
}

/**
 * Validate that a file path is safe and doesn't escape the base directory.
 *
 * @param basePath - The allowed base directory
 * @param requestedPath - The path to validate
 * @returns Whether the path is safe
 */
export function isSafePath(basePath: string, requestedPath: string): boolean {
  // Resolve both paths to absolute
  const resolvedBase = path.resolve(basePath);
  const resolvedRequested = path.resolve(basePath, requestedPath);

  // The resolved path must start with the base path
  return resolvedRequested.startsWith(resolvedBase + path.sep) ||
         resolvedRequested === resolvedBase;
}

/**
 * Sanitize a file path for safe use.
 * Removes traversal sequences and normalizes the path.
 */
export function sanitizePath(input: string): string {
  return input
    .replace(/\.\./g, "")           // Remove parent traversal
    .replace(/[^a-zA-Z0-9._\-/]/g, "_")  // Only allow safe characters
    .replace(/\/{2,}/g, "/")        // Collapse multiple slashes
    .replace(/^\/+/, "")            // Remove leading slashes
    .slice(0, 255);                 // Max length
}

/**
 * Extract a safe filename from a path.
 * Returns just the filename without any directory components.
 */
export function extractSafeFilename(filePath: string): string {
  const filename = path.basename(filePath);
  // Remove any remaining traversal attempts
  return filename.replace(/\.\./g, "").slice(0, 255);
}
