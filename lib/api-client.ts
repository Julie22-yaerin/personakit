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
