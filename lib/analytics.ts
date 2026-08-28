"use client";

import { addDoc, collection } from "firebase/firestore";
import { db } from "./firebase";

const CONSENT_KEY = "persona-analytics-consent";
const SESSION_KEY = "persona-session-id";

export type Consent = "granted" | "denied";

export function getConsent(): Consent | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CONSENT_KEY) as Consent | null;
}

export function setConsent(value: Consent) {
  window.localStorage.setItem(CONSENT_KEY, value);
}

function sessionId(): string {
  let id = window.localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

/** Log one pageview / event row into `site_analytics`. Fails silently. */
export async function trackEvent(type: "pageview", path: string): Promise<void> {
  try {
    await addDoc(collection(db, "site_analytics"), {
      type,
      path,
      sessionId: sessionId(),
      ts: new Date().toISOString(),
    });
  } catch {
    // analytics must never break the page
  }
}

/** One 👍/👎 feedback vote from the landing page widget. */
export async function sendFeedback(vote: "up" | "down", path: string): Promise<void> {
  try {
    await addDoc(collection(db, "site_feedback"), {
      vote,
      path,
      ts: new Date().toISOString(),
    });
  } catch {
    // ignore
  }
}
