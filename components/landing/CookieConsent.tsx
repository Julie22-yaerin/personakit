"use client";

import { useEffect, useState } from "react";
import { getConsent, setConsent, trackEvent } from "../../lib/analytics";

/**
 * Minimal cookie/analytics consent bar. Nothing non-essential is stored
 * until the visitor accepts; declining keeps the site fully usable.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getConsent() === null) setVisible(true);
  }, []);

  if (!visible) return null;

  const decide = (value: "granted" | "denied") => {
    setConsent(value);
    setVisible(false);
    if (value === "granted") {
      void trackEvent("pageview", window.location.pathname);
    }
  };

  return (
    <div className="p-consent" role="region" aria-label="Cookie consent">
      <p>
        We use anonymous analytics to count visits and improve this page. No ads,
        no trackers, no data selling.{" "}
        <a href="/privacy">Privacy policy</a>.
      </p>
      <div className="p-consent-actions">
        <button type="button" className="btn btn-ghost" onClick={() => decide("denied")}>
          Decline
        </button>
        <button type="button" className="btn btn-primary" onClick={() => decide("granted")}>
          Accept
        </button>
      </div>
    </div>
  );
}
