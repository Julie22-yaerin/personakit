"use client";

import { useScroll, useTransform, motion } from "motion/react";
import { useRef, type ReactNode } from "react";

/**
 * ScrollHero — Dual motion scroll engine.
 * Section 1 scales and rotates dynamically as the visitor scrolls down,
 * transitioning smoothly into the founder moments and feature deep-dives.
 */
export function ScrollHero({ children }: { children: ReactNode }) {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.88]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, -3]);

  return (
    <div ref={container} className="relative min-h-[125vh] bg-transparent">
      <motion.section
        style={{ scale, rotate }}
        className="sticky top-0 min-h-screen flex items-center justify-center p-hero-pinned"
      >
        <div className="p-hero-grid-overlay" aria-hidden />
        <div className="p-hero-inner">
          {children}
        </div>
      </motion.section>
    </div>
  );
}

/**
 * Section2Motion — The second stage of the scroll animation that scales up and rotates into place.
 */
export function Section2Motion({ children }: { children: ReactNode }) {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start end", "center center"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [0.88, 1]);
  const rotate = useTransform(scrollYProgress, [0, 1], [3, 0]);

  return (
    <div ref={container} className="relative w-full">
      <motion.section
        style={{ scale, rotate }}
        className="w-full"
      >
        {children}
      </motion.section>
    </div>
  );
}
