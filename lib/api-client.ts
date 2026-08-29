"use client";

import { auth } from "./firebase";

/**
 * Every call to this app's own API routes should go through this, not a
 * bare fetch — the routes now require a verified Firebase ID token
 * (lib/auth-guard.ts) and previously had none, meaning anyone could call
 * them directly and spend the app owner's OpenRouter credit.
 */
export async function authedFetch(url: string, body: unknown): Promise<Response> {
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : null;
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

/**
 * Safely parses response JSON, gracefully handling:
 * - 410 Gone status code (no body / expired session / deprecated resource)
 * - 204/205 empty body status codes
 * - Empty body or malformed JSON payloads
 * - Generic server errors
 */
export async function safeReadJson<T = Record<string, unknown>>(
  res: Response,
): Promise<{ ok: boolean; data: T | null; error: string | null }> {
  // Specifically handle 410 Gone (no body)
  if (res.status === 410) {
    return {
      ok: false,
      data: null,
      error: "The requested resource or session has expired (410 Gone). Please refresh and try again.",
    };
  }

  // Handle 204 No Content
  if (res.status === 204 || res.status === 205) {
    return { ok: true, data: null, error: null };
  }

  try {
    const text = await res.text();
    if (!text || !text.trim()) {
      return {
        ok: res.ok,
        data: null,
        error: !res.ok ? `Server returned status ${res.status} (empty body).` : null,
      };
    }

    const parsed = JSON.parse(text);
    if (!res.ok) {
      const errMsg =
        parsed && typeof parsed === "object" && "error" in parsed
          ? typeof parsed.error === "string"
            ? parsed.error
            : JSON.stringify(parsed.error)
          : `Request failed with status ${res.status}`;
      return { ok: false, data: parsed, error: errMsg };
    }

    return { ok: true, data: parsed as T, error: null };
  } catch (err) {
    console.warn("[safeReadJson] Error reading response:", err);
    return {
      ok: false,
      data: null,
      error: !res.ok ? `Server error (HTTP ${res.status})` : "Invalid response from server.",
    };
  }
}
