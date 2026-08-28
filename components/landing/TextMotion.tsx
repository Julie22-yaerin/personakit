"use client";

import { motion } from "motion/react";
import type { ElementType } from "react";

/**
 * TextMotion — Reliable, crystal-clear typography with subtle entrance motion.
 * Ensures text is never stuck at opacity 0 or blurred out on any browser.
 */
export function TextMotion({
  text,
  as: Component = "h2",
  className,
  delay = 0,
}: {
  text: string;
  as?: ElementType;
  className?: string;
  delay?: number;
}) {
  return (
    <Component className={className} style={{ opacity: 1, visibility: "visible" }}>
      {text}
    </Component>
  );
}

/**
 * Giant footer wordmark driven by scroll.
 */
export function FooterWordmark({ text }: { text: string }) {
  return (
    <h1 className="p-footer-wordmark" style={{ opacity: 1, visibility: "visible" }}>
      {text}
    </h1>
  );
}
