"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "persona:cookie-consent";

export type CookieConsent = "essential" | "all" | "denied";

/** Read the founder's stored cookie choice, if any — used to gate optional (e.g. analytics) init elsewhere. */
export function getCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw === "essential" || raw === "all" || raw === "denied" ? raw : null;
}

export function CookieBanner() {
  const [choice, setChoice] = useState<CookieConsent | null>("essential");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = getCookieConsent();
    setChoice(stored);
    setVisible(!stored);
  }, []);

  function choose(next: CookieConsent) {
    window.localStorage.setItem(STORAGE_KEY, next);
    setChoice(next);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-live="polite" aria-label="Cookie preferences">
      <p className="cookie-banner-text">
        We use essential cookies to keep you signed in, and (only if you allow it) analytics cookies to see
        how PERSONA is used.
      </p>
      <div className="cookie-banner-actions">
        <button className="btn btn-ghost" onClick={() => choose("denied")}>
          Deny
        </button>
        <button className="btn btn-ghost" onClick={() => choose("essential")}>
          Accept
        </button>
        <button className="btn btn-primary" onClick={() => choose("all")}>
          Accept All
        </button>
      </div>
    </div>
  );
}
