"use client";

import { useScroll, useSpring, useTransform, motion } from "motion/react";
import { useRef, type ReactNode } from "react";

/**
 * ScrollHero — High performance pinned hero with smooth spring interpolation.
 * Keeps opacity high and readable at all times so content never goes black.
 */
export function ScrollHero({ children }: { children: ReactNode }) {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end start"],
  });

  const smooth = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 26,
    restDelta: 0.001,
  });

  const scale = useTransform(smooth, [0, 1], [1, 0.92]);
  const rotate = useTransform(smooth, [0, 1], [0, -2]);
  const opacity = useTransform(smooth, [0, 1], [1, 0.85]);

  return (
    <div ref={container} className="p-hero-scroll">
      <motion.section
        style={{ scale, rotate, opacity }}
        className="p-hero-pinned"
      >
        <div className="p-hero-grid-overlay" aria-hidden />
        <div className="p-hero-inner">
          {children}
        </div>
      </motion.section>
    </div>
  );
}
