"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { getConsent, trackEvent } from "../../lib/analytics";

/** Fires one pageview per route change — only when consent is granted. */
export function PageTracker() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (getConsent() !== "granted") return;
    if (last.current === pathname) return;
    last.current = pathname;
    void trackEvent("pageview", pathname);
  }, [pathname]);

  return null;
}
